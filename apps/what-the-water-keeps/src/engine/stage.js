// Staging: an area's route of moments.
//
// A dark ride is a procession of things that begin as the boat arrives. `ctx.stage` lets a realm say so plainly:
//
//   const stage = ctx.stage;
//   stage.cue('wheel', { s: 40 }, () => { stage.tween(wheel, 'speed', 0.4, 6); ctx.audio.play('creak', { x, z }); });
//   stage.cue('herons', { near: { s: 85, d: 14, r: 22 } }, () => herons.takeOff());
//   stage.cue('show', { s: 150, settle: () => lights.setAll(1) }, () => stage.run([
//     [0,   () => lights.kindle(0)],
//     [2.5, () => lights.kindle(1)],
//     [9,   () => curtain.rise(12)],
//   ]));
//   // in update():  uniforms.uGust.value = stage.since('gust');     // seconds since that cue fired, or -1
//
// Rules of the road:
// - A cue fires once, the first time the boat reaches it going forward, however slowly the rider travels; a rider
//   who stops and watches misses nothing, and a rider who turns back does not see it twice (unless `rearm: true`).
// - A realm can be entered part-way along (a rider who comes back into it, or a screenshot taken at `&s=120`):
//   every cue already behind the boat is then marked as done without playing, and its `settle()` is called so
//   the world is left in the state the moment would have left it in (the lights lit, the birds gone).
// - Everything runs on the realm's own clock, so it stops when the ride is paused.
// - `stage.calm` is true when the rider asked for reduced motion: keep the moment, soften large or sudden motion.
// - For pictures: `&play=show` in the address fires the cue called 'show' at once (several: `&play=a,b`), and
//   `&t=8` then shows it eight seconds in. Only works in the developer's modes (with `?realm=` or in screenshots).

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Easing curves, all 0..1 -> 0..1. */
export const ease = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => t * t * (3 - 2 * t),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  /** settles past the target and comes back: for things with weight (a bough springing up, a bell coming to rest) */
  settle: (t) => 1 - Math.exp(-5.5 * t) * Math.cos(9 * t) * (1 - t),
};

export function makeStage(ctx) {
  const cues = [], tweens = [], timers = [], beats = {}, clocks = {};
  const engine = ctx.engine;
  const wanted = new Set(String((engine && engine.devPlay) || '').split(',').map((v) => v.trim()).filter(Boolean));
  let first = true;
  // one broken moment must not silence the rest of the route: report it and carry on
  const safe = (fn, what) => { try { return fn && fn(stage); } catch (err) { console.error(`stage: ${what} threw`, err); } };

  const stage = {
    /** Seconds this realm has been running (stops while paused). */
    time: 0,
    /** True when the rider asked for reduced motion. */
    calm: !!ctx.reducedMotion,
    /** name -> the stage time at which that cue fired (cues settled without playing are at -Infinity). */
    fired: {},

    /**
     * A moment that begins when the boat arrives.
     * where: { s }                       the boat's distance along the route reaches s metres
     *        { near: { s, d, r } }       the boat comes within r metres of the point s along, d to the right
     *        { near: { x, z, r } }       the same with local coordinates
     *        { after: 'other', delay }   `delay` seconds after another cue fired
     *   plus: rearm (fire again when the boat has gone back 20 m and returns), settle() (see the note above),
     *         delay (seconds between arriving and firing).
     * fn(stage) is the moment itself.
     */
    cue(name, where, fn) {
      const c = { name, fn, s: where.s, near: where.near || null, after: where.after || null, delay: where.delay || 0,
        rearm: !!where.rearm, settle: where.settle || null, state: 0, due: 0 };
      if (c.near && c.near.x === undefined) { const p = ctx.path.point(c.near.s, c.near.d || 0, 0); c.near = { x: p.x, z: p.z, r: c.near.r, s: c.near.s }; }
      cues.push(c);
      return stage;
    },

    /** Has this cue fired (or been settled)? */
    done: (name) => name in stage.fired,
    /** Seconds since the cue fired; -1 if it has not; a very large number if it was settled without playing. */
    since: (name) => (name in stage.fired ? (stage.fired[name] === -Infinity ? 1e6 : stage.time - stage.fired[name]) : -1),
    /** 0..1 over `seconds` since the cue fired (0 before it fires), eased. */
    ramp: (name, seconds, curve = ease.inOut) => { const t = stage.since(name); return t < 0 ? 0 : curve(clamp01(t / Math.max(1e-4, seconds))); },
    /**
     * A show clock: seconds into a sequence that began with a cue, which a rider who stops gets whole and a rider
     * who presses on gets faster. It starts when the cue fires and runs in real time, and the boat's progress can only
     * push it forward: it is never less than `f(s)` of the distance along the route, and it keeps running from there
     * (a rider who paddles ahead and then stops does not see the show stand still while time catches up):
     *   const T = stage.clock('unpeg', (s) => (s - 126) / 2);   // -1 until the cue has fired
     * Drive every beat of a showstopper from this one number (uniforms, tweens by hand, sounds via stage.beat).
     */
    clock: (name, f) => {
      const t = stage.since(name);
      if (t < 0) { delete clocks[name]; return -1; }
      const by = f ? f(ctx.s) : 0, c = clocks[name];
      if (!c) { clocks[name] = { v: Math.max(Math.min(t, 1e5), by), at: stage.time }; return clocks[name].v; }
      c.v = Math.max(c.v + (stage.time - c.at), by); c.at = stage.time;      // it runs on from wherever the rider's progress pushed it: it never stands still
      return c.v;
    },
    /**
     * True exactly once, in the frame a clock value first reaches `at` (for sounds and one-off starts on a show clock):
     *   if (stage.beat('unpeg.gust', T, 4.5)) ctx.audio.play('whump', { x, z });
     * If the clock is already far past it when first asked (a realm entered part-way), it stays false: nothing replays.
     */
    beat(key, value, at) {
      const seen = beats[key];
      if (seen === undefined) { beats[key] = value >= at ? (value - at < 1.5 ? 2 : 1) : 0; return beats[key] === 2; }
      if (seen === 0 && value >= at) { beats[key] = 2; return true; }
      return false;
    },
    /** Fire a cue by hand (from another cue, or for testing). */
    fire(name) { const c = cues.find((q) => q.name === name); if (c && c.state < 2) { c.state = 2; stage.fired[name] = stage.time; safe(c.fn, `cue '${name}'`); } return stage; },

    /** Run fn after `seconds`. Returns a handle with cancel(). */
    after(seconds, fn) { const t = { at: stage.time + seconds, fn, every: 0, dead: false, cancel() { this.dead = true; } }; timers.push(t); return t; },
    /** Run fn every `seconds` (plus up to `jitter` seconds, from ctx.rng, so nothing ticks like a clock). */
    every(seconds, fn, jitter = 0) {
      const rnd = jitter ? ctx.rng(Math.round(seconds * 977) + timers.length * 31) : null;
      const t = { at: stage.time + seconds, fn, every: seconds, jitter, rnd, dead: false, cancel() { this.dead = true; } };
      timers.push(t); return t;
    },
    /** A timed sequence relative to now: run([[0, fn], [2.5, fn], [9, fn]]). */
    run(beats) { return beats.map(([t, fn]) => stage.after(t, fn)); },

    /**
     * Ease a number over time.
     *   tween(obj, 'key', to, seconds, curve?)          obj.key goes from what it is now to `to`
     *   tween((v) => { ... }, from, to, seconds, curve?) call the setter every frame
     * Returns a handle: cancel(), and then(fn) to run something when it arrives.
     */
    tween(a, b, c, d, e) {
      const tw = typeof a === 'function'
        ? { set: a, from: b, to: c, dur: d, curve: e || ease.inOut }
        : { set: (v) => { a[b] = v; }, from: a[b], to: c, dur: d, curve: e || ease.inOut, obj: a, key: b };
      tw.t = 0; tw.dead = false; tw.cbs = [];
      tw.cancel = () => { tw.dead = true; };
      tw.then = (fn) => { tw.cbs.push(fn); return tw; };
      if (tw.obj) for (const o of tweens) if (o.obj === tw.obj && o.key === tw.key) o.dead = true;   // a new tween of the same thing replaces the old one
      if (!(tw.dur > 0)) { tw.set(tw.to); tw.dead = true; tw.cbs.forEach((fn) => fn()); return tw; }
      tweens.push(tw); return tw;
    },

    /** Called every frame by the realm manager; do not call it yourself. */
    update(dt) {
      stage.time += dt; stage.calm = !!ctx.reducedMotion;
      const s = ctx.s, bx = ctx.boat.x, bz = ctx.boat.z;
      if (first) {
        // On the first frame: settle every cue the boat is already past, and only then fire the cues a developer asked
        // for with &play= (in one pass, a settle registered later could undo a cue that had just been played).
        const asked = (c) => wanted.has(c.name) || wanted.has('all');
        for (const c of cues) {
          if (c.state === 2 || asked(c)) continue;
          const behind = c.s !== undefined ? s > c.s + 3 : c.near && c.near.s !== undefined ? s > c.near.s + c.near.r + 3 : false;
          if (behind) { c.state = 2; stage.fired[c.name] = -Infinity; safe(c.settle, `settle of '${c.name}'`); }
        }
        for (const c of cues) if (c.state !== 2 && asked(c)) { c.state = 2; stage.fired[c.name] = stage.time; safe(c.fn, `cue '${c.name}'`); }
      }
      for (const c of cues) {
        if (c.state === 2) {
          if (c.rearm && c.s !== undefined && s < c.s - 20) c.state = 0;
          continue;
        }
        if (c.state === 0) {
          let here = false;
          if (c.after) here = stage.since(c.after) >= 0;
          else if (c.near) here = Math.hypot(bx - c.near.x, bz - c.near.z) <= c.near.r;
          else if (c.s !== undefined) here = s >= c.s;
          if (here) { c.state = 1; c.due = stage.time + (c.after && stage.fired[c.after] === -Infinity ? 0 : c.delay); }
        }
        if (c.state === 1 && stage.time >= c.due) {
          c.state = 2;
          if (c.after && stage.fired[c.after] === -Infinity) { stage.fired[c.name] = -Infinity; safe(c.settle, `settle of '${c.name}'`); }
          else { stage.fired[c.name] = stage.time; safe(c.fn, `cue '${c.name}'`); }
        }
      }
      first = false;
      for (let i = 0; i < timers.length; i++) {
        const t = timers[i];
        if (t.dead) continue;
        if (stage.time >= t.at) {
          if (t.every) t.at = stage.time + t.every + (t.rnd ? t.rnd() * t.jitter : 0); else t.dead = true;
          safe(t.fn, 'a timer');
        }
      }
      for (let i = 0; i < tweens.length; i++) {
        const tw = tweens[i];
        if (tw.dead) continue;
        tw.t += dt;
        const k = clamp01(tw.t / tw.dur);
        try { tw.set(tw.from + (tw.to - tw.from) * tw.curve(k)); } catch (err) { tw.dead = true; console.error('stage: a tween threw', err); }
        if (k >= 1 && !tw.dead) { tw.dead = true; for (const fn of tw.cbs) safe(fn, 'a tween callback'); }
      }
      if (timers.length > 64) for (let i = timers.length - 1; i >= 0; i--) if (timers[i].dead) timers.splice(i, 1);
      if (tweens.length > 64) for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].dead) tweens.splice(i, 1);
    },
  };
  return stage;
}
