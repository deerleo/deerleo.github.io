// Keyboard, mouse, touch and gamepad, reduced to what the boat needs:
//   throttle (-1..1), steer (-1..1), look yaw/pitch (radians, relative to the bow) and a few one-shot actions.
// Everything works from the keyboard alone; the mouse (or right stick) only adds free look.
// The interface's own buttons (src/ui.js, "buttons for steering and looking": for a pointer that cannot drag) reach
// the boat through two calls and nothing else: hold({ throttle, steer }) and lookStep(yawDegrees, pitchDegrees).

const KEY_THROTTLE_UP = ['KeyW', 'ArrowUp'], KEY_THROTTLE_DOWN = ['KeyS', 'ArrowDown'];
const KEY_LEFT = ['KeyA', 'ArrowLeft'], KEY_RIGHT = ['KeyD', 'ArrowRight'];
const LOOK_LIMIT_YAW = 2.97, LOOK_UP = 1.05, LOOK_DOWN = 0.70;      // 170 degrees either side, 60 up, 40 down
const LOOK_STEP_RATE = 6;                                           // 1/s: how quickly a step of the head arrives (most of it in half a second)
// The thumb's stick on a touch screen (the left part of the picture). It begins wherever the thumb comes down, is at
// full deflection STICK_RADIUS px from there, and its base follows a thumb that slides further, so the thumb never has
// to come back to find the middle again. A little dead middle, so a resting thumb does not set the boat going.
export const STICK_RADIUS = 64, STICK_DEAD = 0.14, STICK_ZONE = 0.45;

export class Input {
  constructor(surface) {
    this.surface = surface;
    this.keys = new Set();
    this.throttle = 0; this.steer = 0;
    this.lookYaw = 0; this.lookPitch = 0;             // where the rider is looking, relative to the bow
    this.dragging = false; this.lastLook = 0;          // seconds since the look was last moved by hand
    this.enabled = false;                              // the ride ignores input while a menu is open
    this.actions = new Set();                          // one-shot actions since the last frame: 'pause', 'centre', 'music'
    this.touch = { steer: 0, throttle: 0, id: null, x0: 0, y0: 0, kx: 0, ky: 0 };      // kx, ky: where the thumb is from the stick's middle, in radii (for drawing it)
    this.held = { throttle: 0, steer: 0 };             // what the interface's buttons hold: see hold()
    this.lookGoal = null;                              // where a step of the head is turning to ({ yaw, pitch }: lookStep()), or null
    this.sensitivity = 1;

    const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
    window.addEventListener('keydown', (e) => {
      if (e.metaKey) this.keys.clear();                  // macOS sends no keyup for keys released while Command is down
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) this.actions.add('pause'); return; }
      if (!this.enabled) return;
      if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;   // let buttons work
      if ([...KEY_THROTTLE_UP, ...KEY_THROTTLE_DOWN, ...KEY_LEFT, ...KEY_RIGHT, 'Space', 'KeyQ', 'KeyE', 'KeyR', 'KeyF'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) { if (e.code === 'Space') this.actions.add('centre'); if (e.code === 'KeyM') this.actions.add('music'); }
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (e.key === 'Meta') this.keys.clear(); });
    const noThumb = () => { const t = this.touch; t.id = null; t.steer = 0; t.throttle = 0; t.kx = 0; t.ky = 0; };
    const letGo = () => { this.keys.clear(); this.dragging = false; noThumb(); };
    window.addEventListener('blur', letGo);
    document.addEventListener('visibilitychange', () => { if (document.hidden) letGo(); });

    // drag to look (mouse or one finger on the right part); a finger on the left part is the steering stick
    surface.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      if (e.pointerType === 'touch' && e.clientX < window.innerWidth * STICK_ZONE && this.touch.id === null) {
        this.touch.id = e.pointerId; this.touch.x0 = e.clientX; this.touch.y0 = e.clientY; this.touch.kx = this.touch.ky = 0;
      } else { this.dragging = true; this.dragId = e.pointerId; this.lastX = e.clientX; this.lastY = e.clientY; this.lookGoal = null; }
      try { surface.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    });
    surface.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.touch.id) {
        const t = this.touch;
        let dx = e.clientX - t.x0, dy = e.clientY - t.y0, d = Math.hypot(dx, dy);
        if (d > STICK_RADIUS) {                           // past the rim: the base comes along
          const k = STICK_RADIUS / d;
          t.x0 += dx * (1 - k); t.y0 += dy * (1 - k); dx *= k; dy *= k; d = STICK_RADIUS;
        }
        const k = d / STICK_RADIUS, live = k <= STICK_DEAD ? 0 : Math.pow((k - STICK_DEAD) / (1 - STICK_DEAD), 1.25), g = k > 0 ? live / k : 0;
        t.kx = dx / STICK_RADIUS; t.ky = dy / STICK_RADIUS;
        t.steer = clamp(t.kx * g, -1, 1); t.throttle = clamp(-t.ky * g, -1, 1);
        return;
      }
      if (!this.dragging || e.pointerId !== this.dragId) return;
      const k = 0.0042 * this.sensitivity * (e.pointerType === 'touch' ? 1.4 : 1);
      const mx = e.clientX - this.lastX, my = e.clientY - this.lastY;       // movementX is not reliable for touch
      this.lastX = e.clientX; this.lastY = e.clientY;
      this.lookYaw = clamp(this.lookYaw - mx * k, -LOOK_LIMIT_YAW, LOOK_LIMIT_YAW);
      this.lookPitch = clamp(this.lookPitch - my * k, -LOOK_DOWN, LOOK_UP);
      this.lastLook = 0;
    });
    const end = (e) => {
      if (e.pointerId === this.touch.id) noThumb();
      if (e.pointerId === this.dragId) this.dragging = false;
    };
    surface.addEventListener('pointerup', end); surface.addEventListener('pointercancel', end);
    surface.addEventListener('contextmenu', (e) => e.preventDefault());
    // (two fingers on the picture are two thumbs at work, never a pinch of the page: older iPhones need telling)
    surface.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  /** Call once per frame before reading throttle/steer/look. */
  update(dt) {
    const k = this.keys, any = (list) => list.some((c) => k.has(c));
    let throttle = 0, steer = 0, lookX = 0, lookY = 0;
    if (this.enabled) {
      throttle = (any(KEY_THROTTLE_UP) ? 1 : 0) - (any(KEY_THROTTLE_DOWN) ? 1 : 0);
      steer = (any(KEY_RIGHT) ? 1 : 0) - (any(KEY_LEFT) ? 1 : 0);
      lookX = (k.has('KeyE') ? 1 : 0) - (k.has('KeyQ') ? 1 : 0);
      lookY = (k.has('KeyR') ? 1 : 0) - (k.has('KeyF') ? 1 : 0);
      throttle += this.touch.throttle; steer += this.touch.steer;
      throttle += this.held.throttle; steer += this.held.steer;
      let pads = []; try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch { /* blocked in this frame */ }
      for (const p of pads) {
        if (!p || !p.connected || p.mapping !== 'standard') continue;
        const dz = (v) => (Math.abs(v) < 0.16 ? 0 : (v - Math.sign(v) * 0.16) / 0.84);
        steer += dz(p.axes[0] || 0); throttle += -dz(p.axes[1] || 0);
        lookX += dz(p.axes[2] || 0); lookY += -dz(p.axes[3] || 0);
        const rt = p.buttons[7] ? p.buttons[7].value : 0, lt = p.buttons[6] ? p.buttons[6].value : 0;
        throttle += rt - lt;
        const start = p.buttons[9] && p.buttons[9].pressed;
        if (start && !this._padStart) this.actions.add('pause');
        this._padStart = start;
        break;
      }
    }
    this.throttle = clamp(throttle, -1, 1); this.steer = clamp(steer, -1, 1);
    if (this.actions.has('centre')) this.lookGoal = null;      // facing forward again ends a step that is still turning
    if (lookX || lookY) {
      this.lookYaw = clamp(this.lookYaw - lookX * 1.5 * dt, -LOOK_LIMIT_YAW, LOOK_LIMIT_YAW);
      this.lookPitch = clamp(this.lookPitch + lookY * 1.0 * dt, -LOOK_DOWN, LOOK_UP);
      this.lastLook = 0; this.lookGoal = null;
    } else if (this.lookGoal && this.enabled) {                // a step of the head (lookStep): it counts as a hand on the view until it has arrived
      const yaw = this.lookGoal.yaw - this.lookYaw, pitch = this.lookGoal.pitch - this.lookPitch, f = 1 - Math.exp(-dt * LOOK_STEP_RATE);
      if (Math.abs(yaw) < 0.002 && Math.abs(pitch) < 0.002) { this.lookYaw = this.lookGoal.yaw; this.lookPitch = this.lookGoal.pitch; this.lookGoal = null; }
      else { this.lookYaw += yaw * f; this.lookPitch += pitch * f; }
      this.lastLook = 0;
    } else if (!this.dragging) this.lastLook += dt;
  }

  /**
   * For the interface's own buttons: hold a throttle and a steer (each -1..1; leave one out to keep it) until told
   * otherwise. They are added to the keys, the thumb and the gamepad as those are added to one another, and like
   * them count for nothing while the ride ignores input.
   */
  hold({ throttle = this.held.throttle, steer = this.held.steer } = {}) {
    this.held.throttle = clamp(+throttle || 0, -1, 1); this.held.steer = clamp(+steer || 0, -1, 1);
  }

  /**
   * Turn the head one step (degrees: to the left is positive, and up is), inside the limits. The view eases there
   * in about half a second, and steps asked for meanwhile add up; with eased = false it is there at once (reduced
   * motion). A drag, a look key or facing forward again ends a step that is still turning.
   */
  lookStep(yawDegrees = 0, pitchDegrees = 0, eased = true) {
    if (!this.enabled) return;
    const from = this.lookGoal || { yaw: this.lookYaw, pitch: this.lookPitch }, k = Math.PI / 180;
    this.lookGoal = { yaw: clamp(from.yaw + yawDegrees * k, -LOOK_LIMIT_YAW, LOOK_LIMIT_YAW), pitch: clamp(from.pitch + pitchDegrees * k, -LOOK_DOWN, LOOK_UP) };
    if (!eased) { this.lookYaw = this.lookGoal.yaw; this.lookPitch = this.lookGoal.pitch; }
  }

  /** Ease the view back to the bow. */
  centre(dt, rate = 3) { const f = 1 - Math.exp(-dt * rate); this.lookYaw -= this.lookYaw * f; this.lookPitch -= this.lookPitch * f; }

  take(action) { const had = this.actions.has(action); this.actions.delete(action); return had; }
  endFrame() { this.actions.clear(); }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
