/* core.js — namespace, math, input, camera, coroutines, save, main loop */
(() => {
  'use strict';
  const BD = (window.BD = window.BD || {});

  BD.W = 1280;          // logical screen width
  BD.H = 720;           // logical screen height
  BD.GY = 612;          // screen y of the ground line when cam.y === 0
  BD.time = 0;          // real seconds since boot
  BD.hitstop = 0;       // seconds of frozen simulation left
  BD.timeScale = 1;     // slow motion multiplier
  BD.pixelScale = 1;    // backing-store pixels per logical pixel

  /* ---------------------------------------------------------------- math */
  const TAU = Math.PI * 2;
  const _rgb = new Map();
  function rgb(c) {
    let v = _rgb.get(c);
    if (v) return v;
    let h = c.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    _rgb.set(c, v);
    return v;
  }
  const hex = (r, g, b) => '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  const _mix = new Map();
  function mix(a, b, t) {
    const k = a + b + ((t * 1000) | 0);
    let v = _mix.get(k);
    if (v) return v;
    const A = rgb(a), B = rgb(b);
    v = hex(Math.round(A[0] + (B[0] - A[0]) * t), Math.round(A[1] + (B[1] - A[1]) * t), Math.round(A[2] + (B[2] - A[2]) * t));
    if (_mix.size < 4000) _mix.set(k, v);
    return v;
  }

  const U = (BD.U = {
    TAU,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    /** frame-rate independent exponential approach */
    damp: (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt)),
    rand: (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a)),
    randi: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    sign: (v) => (v < 0 ? -1 : 1),
    smooth: (t) => t * t * (3 - 2 * t),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    rgb, hex, mix,
    /** amt < 0 darkens, amt > 0 lightens */
    shade: (c, amt) => (amt < 0 ? mix(c, '#000000', -amt) : mix(c, '#ffffff', amt)),
    rgba: (c, a) => { const v = rgb(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; },
    /** deterministic rng */
    seeded(seed) {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** offscreen canvas helper; s = resolution multiplier */
    canvas(w, h, s = 1, readback = false) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * s));
      c.height = Math.max(1, Math.round(h * s));
      const g = c.getContext('2d', readback ? { willReadFrequently: true } : undefined);
      g.scale(s, s);
      g.imageSmoothingEnabled = false;
      return [c, g];
    },
  });

  /* --------------------------------------------------------------- input */
  const MAP = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'ArrowUp', 'KeyW'],
    light: ['KeyJ', 'KeyZ'], heavy: ['KeyK', 'KeyX'], guard: ['KeyL', 'KeyC'],
    dash: ['ShiftLeft', 'ShiftRight', 'KeyV'], special: ['KeyF', 'KeyQ'], talk: ['Enter', 'KeyE'], map: ['Tab', 'KeyM'],
    confirm: ['Enter', 'Space', 'KeyJ', 'KeyZ'], cancel: ['Escape', 'Backspace'],
    pause: ['Escape', 'KeyP'],
  };
  // standard gamepad layout
  const PAD = { jump: [0], light: [2], heavy: [3], dash: [1], guard: [5, 7], special: [4, 6], confirm: [0], cancel: [1], pause: [9], talk: [3], left: [14], right: [15], up: [12], down: [13] };
  const byCode = {};
  for (const a in MAP) for (const c of MAP[a]) (byCode[c] = byCode[c] || []).push(a);

  const keys = new Set();
  const pressedAt = {};
  const padHeld = {};
  const Input = (BD.Input = {
    anyAt: -1,
    lastDevice: 'keys',
    held(a) {
      if (padHeld[a]) return true;
      const m = MAP[a];
      for (let i = 0; i < m.length; i++) if (keys.has(m[i])) return true;
      return false;
    },
    /** true once per press, if it happened within `win` seconds (input buffer) */
    take(a, win = 0.14) {
      const t = pressedAt[a];
      if (t !== undefined && t >= 0 && BD.time - t <= win) { pressedAt[a] = -1; return true; }
      return false;
    },
    peek(a, win = 0.14) {
      const t = pressedAt[a];
      return t !== undefined && t >= 0 && BD.time - t <= win;
    },
    axisX() { return (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0); },
    press(a) { pressedAt[a] = BD.time; this.anyAt = BD.time; },
    clear() { for (const a in pressedAt) pressedAt[a] = -1; this.anyAt = -1; },
    poll() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gp = null;
      for (const p of pads) if (p && p.connected && p.mapping === 'standard') { gp = p; break; }
      for (const a in PAD) {
        let on = false;
        if (gp) {
          for (const b of PAD[a]) if (gp.buttons[b] && gp.buttons[b].pressed) on = true;
          if (a === 'left' && gp.axes[0] < -0.4) on = true;
          if (a === 'right' && gp.axes[0] > 0.4) on = true;
          if (a === 'up' && gp.axes[1] < -0.6) on = true;
          if (a === 'down' && gp.axes[1] > 0.6) on = true;
        }
        if (on && !padHeld[a]) { this.press(a); this.lastDevice = 'pad'; }
        padHeld[a] = on;
      }
    },
  });
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    const acts = byCode[e.code];
    if (acts || e.code === 'Tab') e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    Input.lastDevice = 'keys';
    Input.anyAt = BD.time;
    if (acts) for (const a of acts) pressedAt[a] = BD.time;
    if (BD.onFirstGesture) { const f = BD.onFirstGesture; BD.onFirstGesture = null; f(); }
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  addEventListener('pointerdown', () => {
    if (BD.onFirstGesture) { const f = BD.onFirstGesture; BD.onFirstGesture = null; f(); }
  });

  /* -------------------------------------------------------------- camera */
  /*
   * World plane: x grows right, y grows DOWN, ground is y = 0 (so heads are at negative y).
   * cam.push(ctx, p) sets up a transform for a layer with parallax factor p
   * (p = 1 is the gameplay plane, p = 0 is glued to the screen, small p = far away).
   * In a pushed layer, local point (cam.x * p, cam.y * p) lands on screen (W/2, GY).
   */
  const cam = (BD.cam = {
    x: 640, y: 0, zoom: 1,
    trauma: 0, sx: 0, sy: 0, punchX: 0, punchY: 0,
    zp(p) { return 1 + (this.zoom - 1) * p; },
    push(ctx, p = 1) {
      const z = this.zp(p);
      ctx.save();
      ctx.translate(BD.W / 2 + (this.sx + this.punchX) * p, BD.GY + (this.sy + this.punchY) * p);
      ctx.scale(z, z);
      ctx.translate(-this.x * p, -this.y * p);
    },
    pop(ctx) { ctx.restore(); },
    /** visible rectangle, in the local coordinates of a layer with parallax p */
    view(p = 1) {
      const z = this.zp(p), cx = this.x * p, cy = this.y * p;
      return { x0: cx - BD.W / 2 / z - 30, x1: cx + BD.W / 2 / z + 30, y0: cy - BD.GY / z - 30, y1: cy + (BD.H - BD.GY) / z + 30 };
    },
    toScreen(wx, wy) {
      return [BD.W / 2 + (wx - this.x) * this.zoom + this.sx, BD.GY + (wy - this.y) * this.zoom + this.sy];
    },
    shake(amount) { this.trauma = Math.min(1, this.trauma + amount); },
    /** directional kick that springs back */
    punch(dx, dy) { this.punchX += dx; this.punchY += dy; },
    set(x, y, zoom) { this.x = x; this.y = y; this.zoom = zoom; },
    follow(tx, ty, tz, dt, rate = 5, width = 0) {
      this.zoom = U.damp(this.zoom, tz, rate * 0.8, dt);
      if (width) {
        const half = BD.W / 2 / this.zoom;
        tx = width <= half * 2 ? width / 2 : U.clamp(tx, half, width - half);
      }
      this.x = U.damp(this.x, tx, rate, dt);
      this.y = U.damp(this.y, ty, rate, dt);
      if (width) {
        const half = BD.W / 2 / this.zoom;
        if (width > half * 2) this.x = U.clamp(this.x, half, width - half);
      }
    },
    update(rdt) {
      this.trauma = Math.max(0, this.trauma - rdt * 1.9);
      const s = this.trauma * this.trauma * 20, t = BD.time * 61;
      this.sx = s * (Math.sin(t * 1.3) + Math.sin(t * 2.9 + 1.7)) * 0.5;
      this.sy = s * (Math.sin(t * 1.7 + 4.1) + Math.sin(t * 3.3 + 0.3)) * 0.5;
      this.punchX = U.damp(this.punchX, 0, 14, rdt);
      this.punchY = U.damp(this.punchY, 0, 14, rdt);
    },
  });

  /* ---------------------------------------------------------- coroutines */
  /*
   * Scripts are generators. `yield 0.5` waits half a second, `yield fn` waits
   * until fn(dt) returns true, a bare `yield` waits one frame.
   */
  class Co {
    constructor(gen) { this.g = gen; this.wait = 0; this.cond = null; this.done = false; }
    update(dt) {
      if (this.done) return true;
      if (this.cond) { if (!this.cond(dt)) return false; this.cond = null; }
      else if (this.wait > 0) { this.wait -= dt; if (this.wait > 0) return false; }
      for (let guard = 0; guard < 500; guard++) {
        const r = this.g.next();
        if (r.done) { this.done = true; this.result = r.value; return true; }
        const v = r.value;
        if (typeof v === 'number') { if (v > 0) { this.wait = v; return false; } }
        else if (typeof v === 'function') { if (!v(0)) { this.cond = v; return false; } }
        else return false;
      }
      return false;
    }
    stop() { this.done = true; try { this.g.return(); } catch (e) { /* ignore */ } }
  }
  BD.Co = Co;

  /* ---------------------------------------------------------------- save */
  const KEY = 'woodcrest-files-v1';
  const Save = (BD.Save = {
    data: { cleared: {}, opts: { music: 0.7, sfx: 0.85 }, seenIntro: false },
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw);
          this.data = Object.assign(this.data, d);
          this.data.opts = Object.assign({ music: 0.7, sfx: 0.85 }, d.opts || {});
        }
      } catch (e) { /* private mode: play without saving */ }
    },
    write() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
    reset() { this.data.cleared = {}; this.data.seenIntro = false; this.write(); },
  });

  /* ---------------------------------------------------------- stage/loop */
  let canvas, ctx;
  BD.scene = null;
  BD.setScene = (scene, arg) => {
    if (BD.scene && BD.scene.exit) BD.scene.exit();
    BD.scene = scene;
    Input.clear();
    if (scene && scene.enter) scene.enter(arg);
  };

  // The game is drawn into a fixed 480x270 framebuffer and scaled up with hard pixels.
  function resize() {
    const fit = Math.min(innerWidth / BD.FBW, innerHeight / BD.FBH);
    const s = fit >= 1.5 ? Math.floor(fit * 2) / 2 : fit;   // half steps stay on whole device pixels on hi-dpi screens
    canvas.style.width = Math.round(BD.FBW * s) + 'px';
    canvas.style.height = Math.round(BD.FBH * s) + 'px';
    BD.uiScale = s;
  }

  /** one full frame; the RAF loop calls this, tests may call it directly */
  BD.tick = (rdt) => {
    BD.time += rdt;
    Input.poll();
    let dt = rdt * BD.timeScale;
    if (BD.hitstop > 0) { BD.hitstop -= rdt; dt = 0; }
    cam.update(rdt);
    const sc = BD.scene;
    if (sc) {
      sc.update(dt, rdt);
      ctx.setTransform(BD.pixelScale, 0, 0, BD.pixelScale, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (BD.scene && BD.scene.render) BD.scene.render(ctx, rdt);
    }
  };

  BD.boot = () => {
    canvas = document.getElementById('game');
    canvas.width = BD.FBW; canvas.height = BD.FBH;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    BD.pixelScale = BD.FBW / BD.W;      // logical 1280x720 units -> framebuffer pixels
    BD.canvas = canvas; BD.ctx = ctx;
    Save.load();
    resize();
    addEventListener('resize', resize);
    let last = performance.now();
    BD.manual = false;
    const frame = (now) => {
      requestAnimationFrame(frame);
      const rdt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!BD.manual && rdt > 0) BD.tick(rdt);
    };
    requestAnimationFrame(frame);
  };
})();
