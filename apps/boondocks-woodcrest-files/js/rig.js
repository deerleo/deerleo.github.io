/* rig.js — skeletal cel-shaded characters: poses, cycles, drawing primitives, face kit */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U;
  const { sin, cos, PI, max, min, abs, atan2 } = Math;
  const TAU = PI * 2;
  const OUT = '#18110e';

  /* ----------------------------------------------------------- primitives */
  const circ = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
  function capsule(g, ax, ay, bx, by, ra, rb) {
    const a = atan2(by - ay, bx - ax);
    g.beginPath();
    g.arc(ax, ay, ra, a + PI / 2, a - PI / 2);
    g.arc(bx, by, rb, a - PI / 2, a + PI / 2);
    g.closePath();
  }
  /** blobby hair: list of [x, y, r, jiggleWeight] in head-radius units */
  function lobes(g, list, R, ox, oy, col, grow) {
    g.fillStyle = col;
    g.beginPath();
    for (let i = 0; i < list.length; i++) {
      const l = list[i], w = l[3] === undefined ? 1 : l[3];
      const x = l[0] * R + ox * w, y = l[1] * R + oy * w, r = l[2] * R + grow;
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }

  /* ---------------------------------------------------------------- poses */
  /*
   * Angles are absolute, radians. For limbs 0 = straight down, +PI/2 = pointing forward.
   * aF/aB = near/far arm [shoulder, elbow flex], lF/lB = near/far leg [hip, knee flex].
   * lean = torso tilt forward, head = extra head tilt, rot = whole body rotation, propA = weapon angle.
   */
  const KEYS = ['lean', 'head', 'aFs', 'aFe', 'aBs', 'aBe', 'lFh', 'lFk', 'lBh', 'lBk', 'rot', 'lift', 'propA'];
  const mk = (lean, head, aF, aB, lF, lB, x) => Object.assign(
    { lean, head, aFs: aF[0], aFe: aF[1], aBs: aB[0], aBe: aB[1], lFh: lF[0], lFk: lF[1], lBh: lB[0], lBk: lB[1], rot: 0, lift: 0, propA: 0.5 }, x);

  const POSES = (BD.POSES = {
    stand:      mk(0.03, 0, [0.06, 0.22], [-0.04, 0.28], [-0.1, 0.06], [0.12, 0.1]),
    stance:     mk(0.14, -0.06, [0.42, 1.86], [0.98, 1.08], [0.04, 0.62], [0.6, 0.76]),
    // strikes
    jabW:       mk(0.06, -0.02, [0.3, 2.0], [0.5, 2.1], [-0.45, 0.3], [0.5, 0.7]),
    jab:        mk(0.26, -0.12, [0.45, 2.05], [1.52, 0.06], [-0.7, 0.14], [0.72, 0.82]),
    crossW:     mk(0.1, -0.05, [-0.2, 2.2], [1.0, 1.3], [-0.5, 0.3], [0.55, 0.7]),
    cross:      mk(0.38, -0.2, [1.55, 0.05], [0.2, 2.2], [-0.82, 0.08], [0.66, 0.8]),
    spinW:      mk(-0.15, 0.1, [0.9, 1.6], [0.6, 1.7], [0.7, 1.9], [-0.05, 0.3]),
    spinKick:   mk(-0.6, 0.38, [-0.75, 0.5], [0.85, 1.5], [1.48, 0.04], [-0.12, 0.22]),
    kickW:      mk(-0.22, 0.1, [0.5, 1.7], [0.9, 1.5], [1.25, 1.95], [-0.08, 0.26]),
    sideKick:   mk(-0.62, 0.4, [-0.6, 0.6], [0.7, 1.7], [1.54, 0], [-0.16, 0.2]),
    riseKick:   mk(-0.42, 0.2, [-0.9, 0.3], [-0.3, 0.8], [2.55, 0], [-0.1, 0.12], { lift: 6 }),
    airKick:    mk(-0.36, 0.25, [-0.5, 0.5], [1.0, 1.6], [1.42, 0], [0.9, 2.05]),
    diveKick:   mk(-0.3, 0.2, [-0.8, 0.4], [1.9, 0.4], [0.86, 0], [1.05, 2.1]),
    sweep:      mk(0.72, -0.5, [0.2, 0.6], [1.2, 0.4], [1.3, 0.02], [0.7, 2.0]),
    flurry:     mk(0.3, -0.15, [1.5, 0.3], [1.2, 1.4], [-0.7, 0.2], [0.7, 0.85]),
    // defense & reactions
    guard:      mk(0.04, 0.05, [0.92, 1.78], [1.08, 1.6], [-0.56, 0.46], [0.6, 0.86]),
    parry:      mk(0.2, -0.08, [0.4, 1.9], [1.4, 0.85], [-0.6, 0.25], [0.62, 0.8]),
    hurt:       mk(-0.36, -0.38, [-0.5, 0.6], [0.95, 0.7], [-0.3, 0.3], [0.36, 0.5]),
    hurtGut:    mk(0.58, 0.42, [0.55, 1.2], [0.6, 1.3], [-0.2, 0.4], [0.32, 0.62]),
    stagger:    mk(-0.12, 0.35, [0.3, 0.5], [-0.3, 0.4], [-0.3, 0.5], [0.3, 0.55]),
    launch:     mk(-0.12, -0.3, [1.6, 0.3], [2.0, 0.3], [0.9, 0.5], [0.5, 0.8], { rot: -0.95 }),
    down:       mk(0, 0.1, [0.2, 0.2], [-0.3, 0.3], [0.25, 0.3], [-0.1, 0.1], { rot: -1.52 }),
    getup:      mk(0.66, -0.3, [0.35, 0.2], [0.6, 0.3], [0.95, 1.95], [1.15, 2.05]),
    // movement
    dash:       mk(0.78, -0.55, [-1.1, 0.25], [-0.9, 0.2], [-0.9, 0.5], [0.95, 1.2]),
    jump:       mk(0.06, -0.05, [0.3, 1.2], [0.7, 1.2], [0.5, 1.3], [0.95, 1.5]),
    fall:       mk(-0.04, 0.05, [2.4, 0.3], [2.65, 0.3], [-0.2, 0.3], [0.42, 0.5]),
    crouch:     mk(0.5, -0.32, [0.6, 1.2], [0.8, 1.1], [1.0, 2.2], [1.25, 2.3]),
    // acting
    armsCrossed: mk(-0.02, 0, [0.28, 1.36], [0.4, 1.3], [-0.1, 0.05], [0.12, 0.1]),
    handsHips:  mk(-0.04, 0, [-0.5, 1.42], [-0.3, 1.5], [-0.14, 0.04], [0.16, 0.08]),
    point:      mk(0.12, -0.05, [0.05, 0.3], [1.48, 0.06], [-0.2, 0.08], [0.26, 0.2]),
    pointUp:    mk(0, -0.1, [0.05, 0.3], [2.5, 0.2], [-0.12, 0.06], [0.14, 0.1]),
    shrug:      mk(-0.03, 0.05, [0.6, 1.5], [0.8, 1.5], [-0.1, 0.05], [0.12, 0.1]),
    think:      mk(0.05, 0.12, [0.56, 2.32], [0.5, 1.2], [-0.1, 0.05], [0.12, 0.1]),
    facepalm:   mk(0.1, 0.34, [0.78, 2.36], [0, 0.3], [-0.1, 0.05], [0.12, 0.1]),
    cheer:      mk(-0.1, -0.2, [2.7, 0.3], [2.9, 0.3], [-0.14, 0.05], [0.18, 0.1]),
    cower:      mk(0.4, 0.3, [1.2, 2.2], [1.3, 2.2], [0.3, 0.9], [0.5, 1.0]),
    sit:        mk(0.1, 0, [0.5, 0.9], [0.6, 0.9], [1.45, 1.5], [1.5, 1.5]),
    lean:       mk(-0.16, 0.05, [0.3, 1.4], [0.4, 1.3], [0.2, 0.1], [0.5, 0.5]),
    // weapons
    hold:       mk(0.06, 0, [0.5, 0.5], [0, 0.3], [-0.14, 0.08], [0.2, 0.14], { propA: 0.15 }),
    caneLean:   mk(0.22, -0.1, [0.62, 0.3], [-0.1, 0.4], [-0.14, 0.1], [0.2, 0.18], { propA: 2.5 }),
    beltHold:   mk(0.03, 0, [0.1, 0.25], [-0.04, 0.28], [-0.1, 0.06], [0.12, 0.1], { propA: 1.9 }),
    swingW:     mk(-0.12, 0, [2.5, 0.7], [0.6, 1.4], [-0.4, 0.3], [0.46, 0.6], { propA: -0.5 }),
    swing:      mk(0.36, -0.15, [1.2, 0.12], [-0.3, 1.2], [-0.7, 0.14], [0.66, 0.82], { propA: 1.2 }),
    overW:      mk(-0.2, -0.1, [2.9, 0.5], [2.2, 0.9], [-0.36, 0.3], [0.44, 0.6], { propA: -0.9 }),
    over:       mk(0.5, 0.1, [0.95, 0.1], [0.3, 0.8], [-0.72, 0.16], [0.7, 0.9], { propA: 1.3 }),
    thrustW:    mk(-0.05, 0, [-0.5, 1.9], [1.0, 1.2], [-0.4, 0.3], [0.5, 0.6], { propA: 1.57 }),
    thrust:     mk(0.42, -0.2, [1.56, 0], [-0.4, 1.0], [-0.9, 0.1], [0.8, 0.95], { propA: 1.57 }),
    iaiW:       mk(0.5, -0.4, [-0.25, 0.9], [0.3, 1.5], [-0.75, 0.5], [0.85, 1.25], { propA: 2.7 }),
    iaiCut:     mk(0.46, -0.3, [2.0, 0.06], [-0.8, 0.4], [-1.0, 0.1], [0.95, 1.1], { propA: 1.2 }),
    aim:        mk(0.08, -0.04, [1.5, 0.06], [1.3, 0.5], [-0.3, 0.2], [0.34, 0.4], { propA: 1.57 }),
    aimDown:    mk(0.12, 0.05, [1.15, 0.05], [1.0, 0.4], [-0.3, 0.2], [0.34, 0.4], { propA: 1.57 }),
    recoil:     mk(-0.06, -0.1, [1.75, 0.3], [1.4, 0.7], [-0.3, 0.2], [0.34, 0.4], { propA: 1.57 }),
    throwW:     mk(-0.25, -0.1, [3.0, 0.9], [1.1, 0.6], [-0.4, 0.3], [0.45, 0.55], { propA: -0.6 }),
    throwR:     mk(0.4, 0, [1.1, 0.1], [-0.4, 0.6], [-0.75, 0.14], [0.68, 0.84], { propA: 1.4 }),
    stomp:      mk(0.3, 0.2, [0.9, 1.4], [1.0, 1.4], [0.9, 1.5], [-0.1, 0.3]),
    slam:       mk(0.62, 0.25, [0.9, 0.2], [1.0, 0.2], [-0.6, 0.5], [0.7, 1.1], { propA: 1.5 }),
    float:      mk(-0.08, -0.1, [-0.5, 0.3], [-0.7, 0.3], [0.1, 0.5], [0.3, 0.7], { lift: 14 }),
    flashlight: mk(0.08, 0, [1.15, 0.2], [-0.05, 0.3], [-0.1, 0.06], [0.12, 0.1], { propA: 1.57 }),
  });

  const CYCLES = {
    run(ph, o) {
      const s = sin(ph), c = cos(ph);
      o.lean = 0.32; o.head = -0.2;
      o.lFh = 0.18 + 0.98 * s; o.lFk = 0.34 + 1.3 * max(0, c);
      o.lBh = 0.18 - 0.98 * s; o.lBk = 0.34 + 1.3 * max(0, -c);
      o.aFs = 0.1 - 0.9 * s; o.aFe = 1.5; o.aBs = 0.1 + 0.9 * s; o.aBe = 1.5;
      o.rot = 0; o.lift = 0; o.propA = 0.9;
    },
    walk(ph, o) {
      const s = sin(ph), c = cos(ph);
      o.lean = 0.06; o.head = 0;
      o.lFh = 0.46 * s; o.lFk = 0.1 + 0.62 * max(0, c);
      o.lBh = -0.46 * s; o.lBk = 0.1 + 0.62 * max(0, -c);
      o.aFs = -0.36 * s; o.aFe = 0.3; o.aBs = 0.36 * s; o.aBe = 0.3;
      o.rot = 0; o.lift = 0; o.propA = 0.2;
    },
    sneak(ph, o) {
      const s = sin(ph), c = cos(ph);
      o.lean = 0.56; o.head = -0.42;
      o.lFh = 0.72 + 0.42 * s; o.lFk = 1.36 + 0.5 * max(0, c);
      o.lBh = 0.72 - 0.42 * s; o.lBk = 1.36 + 0.5 * max(0, -c);
      o.aFs = 0.5 - 0.2 * s; o.aFe = 1.3; o.aBs = 0.7 + 0.2 * s; o.aBe = 1.2;
      o.rot = 0; o.lift = 0; o.propA = 0.5;
    },
    shuffle(ph, o) { // old folks & flashlight patrols
      const s = sin(ph), c = cos(ph);
      o.lean = 0.2; o.head = -0.08;
      o.lFh = 0.3 * s; o.lFk = 0.14 + 0.4 * max(0, c);
      o.lBh = -0.3 * s; o.lBk = 0.14 + 0.4 * max(0, -c);
      o.aFs = 0.62 + 0.06 * s; o.aFe = 0.3; o.aBs = 0.2 * s; o.aBe = 0.4;
      o.rot = 0; o.lift = 0; o.propA = 2.5 + 0.06 * s;
    },
    patrol(ph, o) {
      CYCLES.walk(ph, o);
      o.aFs = 1.15; o.aFe = 0.2; o.propA = 1.57;
    },
    stride(ph, o) { // confident boss walk, weapon low
      CYCLES.walk(ph, o);
      o.lean = 0.12; o.aFs = 0.4; o.aFe = 0.5; o.propA = 2.8;
    },
  };
  BD.CYCLES = CYCLES;

  const EXPR = (BD.EXPR = {
    neutral: { lid: 0.12, tilt: 0.1, brow: 0, mouth: 'flat' },
    scowl:   { lid: 0.3, tilt: 0.55, brow: -0.2, mouth: 'frown' },
    angry:   { lid: 0.22, tilt: 0.9, brow: -0.3, mouth: 'grit' },
    shout:   { lid: 0.1, tilt: 0.8, brow: -0.2, mouth: 'open', open: 1 },
    smirk:   { lid: 0.3, tilt: 0.15, brow: 0.15, mouth: 'smirk' },
    grin:    { lid: 0.2, tilt: -0.1, brow: 0.3, mouth: 'grin' },
    shock:   { lid: 0, tilt: -0.5, brow: 0.9, mouth: 'o', pupil: 0.62 },
    worry:   { lid: 0.05, tilt: -0.65, brow: 0.5, mouth: 'frown' },
    deadpan: { lid: 0.44, tilt: 0.05, brow: 0, mouth: 'flat' },
    pain:    { lid: 1, tilt: 0.7, brow: -0.2, mouth: 'grit' },
    closed:  { lid: 1, tilt: 0, brow: 0, mouth: 'flat' },
    sly:     { lid: 0.42, tilt: 0.3, brow: 0.1, mouth: 'smirk' },
  });

  /* ------------------------------------------------------------- face kit */
  /*
   * Heads are drawn three-quarter FRONT, the show's default angle: both eyes large and readable,
   * the face turned slightly toward +x. Units are head radii (R); k carries per-character tuning:
   * { ol, jaw, wide, chin, eye, eyeY, brow, browCol, noseT, noseS, noseY, mouthY, mouthW, eN, eF, noEyes }
   */
  function facePath(g, R, k) {
    const j = k.jaw || 1, w = k.wide || 1, ch = k.chin === undefined ? 0.17 : k.chin;
    g.beginPath();
    g.moveTo(-0.92 * R * w, -0.15 * R);
    g.bezierCurveTo(-0.96 * R * w, -1.1 * R, 0.94 * R * w, -1.12 * R, 0.9 * R * w, -0.15 * R);
    g.bezierCurveTo(0.9 * R * w, 0.36 * R * j, 0.74 * R * w, 0.82 * R * j, (0.14 + ch) * R, 1.0 * R * j);
    g.quadraticCurveTo(0.14 * R, 1.07 * R * j, (0.14 - ch) * R, 1.0 * R * j);
    g.bezierCurveTo(-0.64 * R * w, 0.84 * R * j, -0.9 * R * w, 0.42 * R * j, -0.92 * R * w, -0.15 * R);
    g.closePath();
  }
  function skull(g, R, c, k) {
    const j = k.jaw || 1, w = k.wide || 1, es = k.ear || 1;
    g.strokeStyle = c.out; g.lineWidth = k.ol * 2; g.lineJoin = 'round';
    g.fillStyle = c.skinS; // far ear, then the near ear sticking out
    g.beginPath(); g.ellipse(0.9 * R * w, 0.12 * R, 0.13 * R * es, 0.24 * R * es, 0.1, 0, TAU); g.stroke(); g.fill();
    g.fillStyle = c.skin;
    g.beginPath(); g.ellipse(-0.97 * R * w, 0.12 * R, 0.2 * R * es, 0.29 * R * es, -0.12, 0, TAU); g.stroke(); g.fill();
    g.fillStyle = c.skinS; g.beginPath(); g.ellipse(-0.99 * R * w, 0.13 * R, 0.09 * R * es, 0.16 * R * es, -0.12, 0, TAU); g.fill();
    facePath(g, R, k);
    g.fillStyle = c.skin; g.stroke(); g.fill();
    g.save(); g.clip();
    g.fillStyle = c.skinS;
    g.beginPath(); g.moveTo(-1.3 * R * w, -1.2 * R); g.lineTo(-0.66 * R * w, -1.2 * R);
    g.bezierCurveTo(-0.86 * R * w, -0.2 * R, -0.82 * R * w, 0.6 * R * j, -0.12 * R, 1.14 * R * j);
    g.lineTo(-1.3 * R * w, 1.3 * R * j); g.closePath(); g.fill();
    g.fillStyle = c.skinH;
    g.beginPath(); g.ellipse(0.32 * R, -0.52 * R, 0.4 * R, 0.15 * R, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0.64 * R * w, 0.46 * R, 0.13 * R, 0.09 * R, 0, 0, TAU); g.fill();
    g.restore();
  }
  function eyePath(g, cx, cy, hw, hh) {
    g.beginPath();
    g.moveTo(cx - hw, cy - hh * 0.15);
    g.quadraticCurveTo(cx - hw * 0.92, cy - hh, cx, cy - hh);
    g.quadraticCurveTo(cx + hw * 0.92, cy - hh, cx + hw, cy - hh * 0.15);
    g.quadraticCurveTo(cx + hw * 0.96, cy + hh, cx, cy + hh);
    g.quadraticCurveTo(cx - hw * 0.96, cy + hh, cx - hw, cy - hh * 0.15);
    g.closePath();
  }
  function eye(g, cx, cy, w, h, e, c, inner, ol) {
    const hw = w / 2, hh = h / 2;
    if (e.lid >= 0.95) {
      g.strokeStyle = c.out; g.lineWidth = ol * 2.2; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - hw, cy - inner * e.tilt * h * 0.2);
      g.quadraticCurveTo(cx, cy + h * (e.tilt > 0.4 ? -0.16 : 0.3), cx + hw, cy + inner * e.tilt * h * 0.2);
      g.stroke(); g.lineCap = 'butt';
      return;
    }
    g.save();
    eyePath(g, cx, cy, hw, hh);
    g.fillStyle = c.eye; g.fill();
    g.clip();
    if (!e.blind) {
      const ir = hh * 0.88 * (e.pupil || 1);
      const ix = cx + (e.lookX || 0) * hw * 0.35 + inner * hw * 0.14, iy = cy + (e.lookY || 0) * hh * 0.3 + hh * 0.06;
      g.fillStyle = c.iris; circ(g, ix, iy, ir); g.fill();
      g.fillStyle = '#0c0706'; circ(g, ix, iy, ir * 0.62); g.fill();
      g.fillStyle = '#ffffff'; circ(g, ix - ir * 0.38, iy - ir * 0.42, ir * 0.3); g.fill();
    }
    // heavy upper lid: a straight slab, lower toward the nose when angry
    const yl = cy - hh * 1.3 + h * 1.25 * e.lid;
    const yi = yl + e.tilt * h * 0.42, yo = yl - e.tilt * h * 0.2;
    const yL = inner > 0 ? yo : yi, yR = inner > 0 ? yi : yo;
    g.fillStyle = c.skinS;
    g.beginPath(); g.moveTo(cx - hw - 2, cy - h - 2); g.lineTo(cx + hw + 2, cy - h - 2); g.lineTo(cx + hw + 2, yR); g.lineTo(cx - hw - 2, yL); g.closePath(); g.fill();
    g.strokeStyle = c.out; g.lineWidth = ol * 2.6;
    g.beginPath(); g.moveTo(cx - hw - 2, yL); g.lineTo(cx + hw + 2, yR); g.stroke();
    g.restore();
    g.strokeStyle = c.out; g.lineWidth = ol * 1.5;
    eyePath(g, cx, cy, hw, hh); g.stroke();
  }
  function nose(g, R, c, k) {
    const x = 0.17 * R, y = (k.noseY === undefined ? 0.42 : k.noseY) * R, s = (k.noseS || 1) * R;
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (k.noseT === 'wide') {
      g.fillStyle = c.skinS; g.beginPath(); g.ellipse(x, y, 0.22 * s, 0.12 * s, 0, 0, TAU); g.fill();
      g.fillStyle = c.skinH; g.beginPath(); g.ellipse(x + 0.03 * s, y - 0.1 * s, 0.09 * s, 0.07 * s, 0, 0, TAU); g.fill();
      g.strokeStyle = c.out; g.lineWidth = k.ol * 1.2;
      g.beginPath(); g.moveTo(x - 0.2 * s, y + 0.02 * s); g.quadraticCurveTo(x - 0.27 * s, y - 0.12 * s, x - 0.13 * s, y - 0.15 * s);
      g.moveTo(x + 0.2 * s, y + 0.02 * s); g.quadraticCurveTo(x + 0.27 * s, y - 0.12 * s, x + 0.13 * s, y - 0.15 * s); g.stroke();
      g.fillStyle = c.out; circ(g, x - 0.09 * s, y + 0.03 * s, 0.04 * s); g.fill(); circ(g, x + 0.1 * s, y + 0.03 * s, 0.04 * s); g.fill();
    } else {
      g.strokeStyle = c.out; g.lineWidth = k.ol * 1.2;
      g.beginPath(); g.moveTo(x + 0.03 * s, y - 0.15 * s); g.lineTo(x + 0.11 * s, y - 0.01 * s); g.lineTo(x - 0.03 * s, y + 0.01 * s); g.stroke();
    }
    g.lineCap = 'butt';
  }
  function mouth(g, x, y, w, e, c, ol) {
    const m = e.mouth, op = e.open || 0;
    g.strokeStyle = c.out; g.lineWidth = ol * 1.2; g.lineCap = 'round'; g.lineJoin = 'round';
    if (op > 0.08 && m !== 'grit') {
      const h = w * (0.16 + 0.5 * op);
      g.fillStyle = '#3b1217';
      g.beginPath(); g.ellipse(x, y + h * 0.35, w * 0.46, h, 0, 0, TAU); g.stroke(); g.fill();
      g.fillStyle = '#f4eee2';
      g.beginPath(); g.ellipse(x, y + h * 0.35, w * 0.46, h, 0, PI * 1.14, PI * 1.86); g.closePath(); g.fill();
      if (op > 0.5) { g.fillStyle = '#b5484c'; g.beginPath(); g.ellipse(x, y + h * 1.0, w * 0.26, h * 0.36, 0, 0, TAU); g.fill(); }
    } else if (m === 'frown') {
      g.beginPath(); g.moveTo(x - w / 2, y + w * 0.14); g.quadraticCurveTo(x, y - w * 0.16, x + w / 2, y + w * 0.12); g.stroke();
    } else if (m === 'smirk') {
      g.beginPath(); g.moveTo(x - w * 0.5, y + w * 0.04); g.quadraticCurveTo(x + w * 0.1, y + w * 0.16, x + w * 0.56, y - w * 0.2); g.stroke();
      g.beginPath(); g.moveTo(x + w * 0.5, y - w * 0.32); g.lineTo(x + w * 0.62, y - w * 0.14); g.stroke();
    } else if (m === 'grin') {
      g.fillStyle = '#f4eee2';
      g.beginPath(); g.moveTo(x - w * 0.58, y - w * 0.1); g.quadraticCurveTo(x, y + w * 0.06, x + w * 0.58, y - w * 0.1);
      g.quadraticCurveTo(x, y + w * 0.66, x - w * 0.58, y - w * 0.1); g.closePath(); g.stroke(); g.fill();
    } else if (m === 'grit') {
      g.fillStyle = '#f4eee2';
      g.beginPath(); g.moveTo(x - w * 0.52, y - w * 0.12); g.lineTo(x + w * 0.52, y - w * 0.12); g.lineTo(x + w * 0.46, y + w * 0.22); g.lineTo(x - w * 0.46, y + w * 0.22); g.closePath(); g.stroke(); g.fill();
      g.lineWidth = ol * 0.7;
      g.beginPath(); g.moveTo(x - w * 0.5, y + w * 0.05); g.lineTo(x + w * 0.5, y + w * 0.05);
      for (let i = -1; i <= 1; i++) { g.moveTo(x + i * w * 0.24, y - w * 0.12); g.lineTo(x + i * w * 0.24, y + w * 0.22); }
      g.stroke();
    } else if (m === 'o') {
      g.fillStyle = '#3b1217'; g.beginPath(); g.ellipse(x, y + w * 0.1, w * 0.22, w * 0.3, 0, 0, TAU); g.stroke(); g.fill();
    } else {
      g.beginPath(); g.moveTo(x - w / 2, y + w * 0.02); g.quadraticCurveTo(x, y - w * 0.03, x + w / 2, y + w * 0.03); g.stroke();
    }
    g.lineCap = 'butt';
  }
  function features(g, R, c, e, k) {
    const es = k.eye || 1, ey = (k.eyeY === undefined ? 0.1 : k.eyeY) * R, j = k.jaw || 1;
    const nx = -0.22 * R, fx = 0.5 * R;
    const nw = 0.6 * R * es, nh = 0.52 * R * es, fw = 0.5 * R * es, fh = 0.5 * R * es;
    if (!k.noEyes) {
      eye(g, nx, ey, nw, nh, k.eN || e, c, 1, k.ol);
      eye(g, fx, ey, fw, fh, k.eF || e, c, -1, k.ol);
    }
    const bt = (k.brow || 0.13) * R, by = ey - nh * 0.5 - 0.13 * R - e.brow * 0.16 * R;
    g.strokeStyle = c[k.browCol || 'hair']; g.lineWidth = bt; g.lineCap = 'round';
    g.beginPath(); g.moveTo(nx - nw * 0.56, by - e.tilt * 0.1 * R); g.quadraticCurveTo(nx, by - 0.06 * R, nx + nw * 0.54, by + e.tilt * 0.2 * R); g.stroke();
    g.beginPath(); g.moveTo(fx + fw * 0.56, by - e.tilt * 0.1 * R); g.quadraticCurveTo(fx, by - 0.06 * R, fx - fw * 0.54, by + e.tilt * 0.2 * R); g.stroke();
    g.lineCap = 'butt';
    nose(g, R, c, k);
    mouth(g, 0.16 * R, (k.mouthY === undefined ? 0.7 : k.mouthY) * R * j, 0.42 * R * (k.mouthW || 1), e, c, k.ol);
  }
  BD.Face = { skull, facePath, eye, nose, mouth, features, lobes, circ, capsule };

  /* --------------------------------------------------------------- builds */
  const BUILDS = {
    kid: { thigh: 26, shin: 26, torso: 36, neck: 3, head: 22, uArm: 19, lArm: 18, hand: 5.2,
      rThigh: 8.2, rKnee: 6.4, rAnkle: 4.8, rShoulder: 6.2, rElbow: 5, rWrist: 4.2,
      wShoulder: 27, wWaist: 21, foot: 15, footH: 6.5, hipGap: 3.6, shGap: 5, ol: 1.25 },
    adult: { thigh: 46, shin: 44, torso: 60, neck: 6, head: 23, uArm: 32, lArm: 30, hand: 7,
      rThigh: 11.5, rKnee: 8.6, rAnkle: 6, rShoulder: 8.6, rElbow: 6.8, rWrist: 5.5,
      wShoulder: 40, wWaist: 30, foot: 23, footH: 8.5, hipGap: 5.5, shGap: 8, ol: 1.4 },
  };
  const SCALED = ['thigh', 'shin', 'torso', 'neck', 'head', 'uArm', 'lArm', 'hand', 'rThigh', 'rKnee', 'rAnkle', 'rShoulder', 'rElbow', 'rWrist', 'wShoulder', 'wWaist', 'foot', 'footH', 'hipGap', 'shGap'];

  function gradeColor(col, light, keep) {
    if (!light) return col;
    if (light.grade === 'ink') {
      if (keep) return '#c8102e';
      const v = U.rgb(col), l = (0.3 * v[0] + 0.59 * v[1] + 0.11 * v[2]) / 255;
      return U.mix('#15120f', '#f1e8d4', l < 0.2 ? 0.05 : l < 0.42 ? 0.3 : l < 0.68 ? 0.62 : 0.93);
    }
    return U.mix(col, light.ambient, light.amount);
  }

  // scratch sprite: every character is rendered here, quantised to its palette, then blitted
  let spr, gs;
  const SPR = 256, PO = {};
  const EXTRA_COLS = ['#0c0706', '#ffffff', '#3b1217', '#f4eee2', '#b5484c', '#5a3a22', '#c9a468', '#b8402f', '#f1e7d0', '#254b33', '#d8b24a', '#efe6cf',
    '#2a2622', '#b9b9c2', '#26262b', '#ff7a1a', '#4a4a52', '#1e1e22', '#fff6c9', '#3b2416', '#d9b34a', '#9a9aa4', '#6b4a2a', '#3d2915', '#e6c15a', '#101014',
    '#22252b', '#c7352e', '#d8d2c4', '#2a0f12', '#f3efe6', '#2a2420'];

  class Rig {
    constructor(id, opts = {}) {
      const def = BD.CAST[id];
      if (!def) throw new Error('unknown character ' + id);
      this.id = id; this.def = def;
      const b = Object.assign({}, BUILDS[def.build || 'adult']);
      const sc = def.scale || 1;
      for (const k of SCALED) b[k] *= sc;
      Object.assign(b, def.dims ? def.dims(b) : null);
      this.b = b;
      this.ol = b.ol;
      this.pose = Object.assign({}, POSES[def.idle || 'stand']);
      this.tgt = POSES[def.idle || 'stand'];
      this.rate = 14;
      this.cycle = null; this.phase = 0; this.cycleSpeed = 0; this._cyc = {};
      this.J = {};
      for (const n of ['hip', 'chest', 'neck', 'head', 'shF', 'shB', 'elF', 'elB', 'haF', 'haB', 'hipF', 'hipB', 'knF', 'knB', 'anF', 'anB']) this.J[n] = [0, 0];
      this.expr = def.expr || 'neutral';
      this.blink = 0; this.blinkT = U.rand(1, 4);
      this.talk = 0; this.lookX = 0; this.lookY = 0;
      this.hair = { x: 0, y: 0, vx: 0, vy: 0 };
      this.sx = 1; this.sy = 1;
      this.grounded = true; this.hipY = null;
      this.breath = 1;
      this.t = U.rand(0, 10);
      this.prop = opts.prop !== undefined ? opts.prop : def.prop || null;
      this.propB = null;
      this.spin = 0;       // nunchaku / chain animation phase
      this.vars = opts.vars || {};
      this.variant = opts.variant || 0;
      this.setLight(null);
    }
    setLight(light) {
      if (light === this._light) return;
      this._light = light;
      const base = typeof this.def.colors === 'function' ? this.def.colors(this.variant) : this.def.colors;
      const keep = this.def.keep || [];
      const c = {};
      for (const k in base) c[k] = gradeColor(base[k], light, keep.indexOf(k) >= 0);
      c.out = light && light.grade === 'ink' ? '#100d0b' : U.mix(OUT, light ? light.ambient : OUT, light ? light.amount * 0.35 : 0);
      for (const k of Object.keys(c)) { if (!c[k + 'S']) c[k + 'S'] = U.shade(c[k], -0.22); if (!c[k + 'H']) c[k + 'H'] = U.shade(c[k], 0.17); }
      this.c = c;
      const far = {};
      for (const k in c) far[k] = U.mix(c[k], c.out, 0.26);
      this.cFar = far;
      this.rim = light ? light.rim : null;
      this.rimU = this.rim ? BD.Px.u32(this.rim) : 0;
      this.outU = BD.Px.u32(c.out);
      this._flat = {}; this._pal = null;
    }
    pal() {
      if (!this._pal) this._pal = BD.Px.palette(Object.values(this.c).concat(Object.values(this.cFar), EXTRA_COLS));
      return this._pal;
    }
    flatPal(col) {
      let p = this._flat[col];
      if (!p) { p = {}; for (const k in this.c) p[k] = col; this._flat[col] = p; }
      return p;
    }
    setPose(name, rate = 14) {
      const p = POSES[name];
      if (!p) return;
      this.tgt = p; this.rate = rate; this.cycle = null; this.poseName = name;
    }
    snap(name) { this.setPose(name); Object.assign(this.pose, this.tgt); this.hipY = null; }
    setCycle(name, speed, rate = 16) {
      if (this.cycle !== name) { this.cycle = name; this.poseName = name; }
      this.cycleSpeed = speed; this.rate = rate;
    }
    update(dt, vx = 0, vy = 0) {
      this.t += dt;
      let tgt = this.tgt;
      if (this.cycle) {
        this.phase += dt * this.cycleSpeed;
        CYCLES[this.cycle](this.phase, this._cyc);
        tgt = this._cyc;
      }
      const k = 1 - Math.exp(-this.rate * dt), p = this.pose;
      for (let i = 0; i < KEYS.length; i++) { const key = KEYS[i]; p[key] += (tgt[key] - p[key]) * k; }
      // blink
      this.blinkT -= dt;
      if (this.blinkT < 0) this.blinkT = U.rand(2.2, 5.5);
      this.blink = this.blinkT < 0.11 ? 1 : 0;
      // hair/cloth spring lags behind motion
      const h = this.hair, tx = U.clamp(-vx * 0.012, -5, 5), ty = U.clamp(-vy * 0.01, -5, 5);
      h.vx += ((tx - h.x) * 260 - h.vx * 16) * dt; h.vy += ((ty - h.y) * 260 - h.vy * 16) * dt;
      h.x += h.vx * dt; h.y += h.vy * dt;
      this.sx = U.damp(this.sx, 1, 14, dt); this.sy = U.damp(this.sy, 1, 14, dt);
      this._dt = dt;
    }
    squash(sx, sy) { this.sx = sx; this.sy = sy; }
    face() {
      const d = this.def, base = EXPR[this.expr] || EXPR.neutral, f = d.face || {};
      const e = this._e || (this._e = {});
      e.lid = U.clamp(base.lid + (f.lid || 0), 0, 1);
      e.tilt = base.tilt + (f.tilt || 0);
      e.brow = base.brow + (f.brow || 0);
      e.mouth = base.mouth === 'flat' && f.mouth ? f.mouth : base.mouth;
      e.open = max(base.open || 0, this.talk);
      e.pupil = base.pupil || 1;
      e.lookX = this.lookX; e.lookY = this.lookY;
      e.blind = !!f.blind;
      if (this.blink && e.lid < 0.95) { e.lid = 1; e.tilt = 0; }
      return e;
    }
    solve() {
      const b = this.b, p = this.pose, J = this.J, d = this.def;
      const br = sin(this.t * 2.1) * this.breath;
      const lean = p.lean + (d.stoop || 0) + br * 0.012;
      const ux = sin(lean), uy = -cos(lean), fx = cos(lean), fy = sin(lean);
      J.hip[0] = 0; J.hip[1] = 0;
      J.chest[0] = ux * b.torso; J.chest[1] = uy * b.torso;
      J.neck[0] = J.chest[0] + ux * b.neck; J.neck[1] = J.chest[1] + uy * b.neck;
      const ha = lean * 0.55 + p.head + (d.stoop ? -d.stoop * 0.7 : 0);
      J.head[0] = J.neck[0] + sin(ha) * b.head * 0.9; J.head[1] = J.neck[1] - cos(ha) * b.head * 0.9;
      const sy0 = -br * 0.7;
      J.shF[0] = J.chest[0] - fx * b.shGap - ux * 3; J.shF[1] = J.chest[1] - fy * b.shGap - uy * 3 + sy0;
      J.shB[0] = J.chest[0] + fx * b.shGap - ux * 2; J.shB[1] = J.chest[1] + fy * b.shGap - uy * 2 + sy0;
      J.elF[0] = J.shF[0] + sin(p.aFs) * b.uArm; J.elF[1] = J.shF[1] + cos(p.aFs) * b.uArm;
      J.haF[0] = J.elF[0] + sin(p.aFs + p.aFe) * b.lArm; J.haF[1] = J.elF[1] + cos(p.aFs + p.aFe) * b.lArm;
      J.elB[0] = J.shB[0] + sin(p.aBs) * b.uArm; J.elB[1] = J.shB[1] + cos(p.aBs) * b.uArm;
      J.haB[0] = J.elB[0] + sin(p.aBs + p.aBe) * b.lArm; J.haB[1] = J.elB[1] + cos(p.aBs + p.aBe) * b.lArm;
      J.hipF[0] = -b.hipGap; J.hipF[1] = 0; J.hipB[0] = b.hipGap; J.hipB[1] = 0;
      J.knF[0] = J.hipF[0] + sin(p.lFh) * b.thigh; J.knF[1] = cos(p.lFh) * b.thigh;
      J.anF[0] = J.knF[0] + sin(p.lFh - p.lFk) * b.shin; J.anF[1] = J.knF[1] + cos(p.lFh - p.lFk) * b.shin;
      J.knB[0] = J.hipB[0] + sin(p.lBh) * b.thigh; J.knB[1] = cos(p.lBh) * b.thigh;
      J.anB[0] = J.knB[0] + sin(p.lBh - p.lBk) * b.shin; J.anB[1] = J.knB[1] + cos(p.lBh - p.lBk) * b.shin;
      const rot = p.rot;
      if (abs(rot) > 0.001) {
        const cr = cos(rot), sr = sin(rot);
        for (const n in J) { const q = J[n]; if (q.length !== 2) continue; const x = q[0], y = q[1]; q[0] = x * cr - y * sr; q[1] = x * sr + y * cr; }
      }
      let low = max(J.anF[1], J.anB[1]) + b.footH;
      if (abs(rot) > 0.3) low = max(low, J.hip[1] + b.rThigh, J.chest[1] + b.wShoulder * 0.42, J.head[1] + b.head * 0.9);
      let target = this.grounded ? -low : -((b.thigh + b.shin) * 0.9 + b.footH);
      target -= p.lift;
      if (this.hipY === null) this.hipY = target;
      else this.hipY += (target - this.hipY) * (1 - Math.exp(-30 * (this._dt || 0.016)));
      this._dt = 0;
      const dy = this.grounded ? max(this.hipY, target - 2) : this.hipY;
      for (const n in J) { const q = J[n]; if (q.length === 2) q[1] += dy; }
      J.torsoAng = lean + rot; J.headAng = ha + rot;
      J.aF = p.aFs + p.aFe - rot; J.aB = p.aBs + p.aBe - rot;      // forearm angles (0 = down)
      J.sF = p.lFh - p.lFk - rot; J.sB = p.lBh - p.lBk - rot;      // shin angles
      J.floor = dy + low;
      return J;
    }
    /** world-space position of a joint for the last solve (after draw) */
    joint(name, x, y, face, s = 1) {
      const q = this.J[name];
      return [x + q[0] * face * s * this.sx, y + q[1] * s * this.sy];
    }

    /**
     * Renders the character as a hard-pixel sprite at whatever scale the current transform implies.
     * o: { flat: '#hex', alpha, scale, rim: false, rimDir, flash: 0..1, tint: [u32, amount], anchor: joint name }
     */
    draw(g, x, y, face, o) {
      o = o || {};
      const s = o.scale || 1;
      const J = this.solve();
      if (!spr) [spr, gs] = U.canvas(SPR, SPR, 1, true);
      const m = g.getTransform();
      const k = Math.hypot(m.a, m.b) * s;                    // framebuffer px per rig unit
      const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
      const ox = SPR / 2, oy = Math.round(SPR * (o.anchor ? 0.42 : 0.74));
      gs.setTransform(1, 0, 0, 1, 0, 0); gs.clearRect(0, 0, SPR, SPR);
      const ol0 = this.ol; this.ol = 0.62 / k;               // outlines stay ~1px at any zoom
      let jx = 0, jy = 0;                                    // anchor mode: pin a joint (e.g. the head) to x,y
      if (o.anchor) { const q = J[o.anchor]; jx = q[0] * face * k * this.sx; jy = q[1] * k * this.sy; }
      gs.setTransform(k * face * this.sx, 0, 0, k * this.sy, ox - jx, oy - jy);
      const fp = o.flat ? this.flatPal(o.flat) : null;
      this.paint(gs, J, fp || this.c, fp || this.cFar, !!fp);
      this.ol = ol0;
      const img = gs.getImageData(0, 0, SPR, SPR);
      PO.out = this.outU; PO.flat = o.flat ? BD.Px.u32(o.flat) : 0; PO.flash = o.flash || 0; PO.tint = o.tint || null;
      PO.rim = this.rimU && o.rim !== false ? this.rimU : 0; PO.rimDir = o.rimDir || -1;
      BD.Px.post(img, this.pal(), PO);
      gs.putImageData(img, 0, 0);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
      g.drawImage(spr, Math.round(px) - ox, Math.round(py) - oy);
      g.restore();
    }

    paint(g, J, c, cf, flat) {
      const b = this.b, d = this.def, ol = this.ol;
      this.flat = flat;
      g.lineJoin = 'round';
      if (d.back && !flat) d.back(g, J, c, this);
      // far arm + its prop
      if (this.propB) this.drawProp(g, J.haB, J.aB, this.propB, cf);
      this.arm(g, J.shB, J.elB, J.haB, cf, true);
      // pelvis
      g.fillStyle = c[d.pelvis || 'pants']; g.strokeStyle = c.out; g.lineWidth = ol * 2;
      circ(g, J.hip[0], J.hip[1], b.wWaist * 0.5); g.stroke(); g.fill();
      this.leg(g, J.hipB, J.knB, J.anB, J.sB, cf, true);
      this.leg(g, J.hipF, J.knF, J.anF, J.sF, c, false);
      if (d.skirt) d.skirt(g, J, c, this);
      // neck
      g.strokeStyle = c.out; g.lineWidth = ol * 2;
      capsule(g, J.chest[0], J.chest[1], (J.neck[0] + J.head[0]) / 2, (J.neck[1] + J.head[1]) / 2, b.head * 0.3, b.head * 0.3);
      g.stroke(); g.fillStyle = c.skinS; g.fill();
      this.torso(g, J, c);
      // head
      g.save();
      g.translate(J.head[0], J.head[1]);
      g.rotate(J.headAng);
      d.head(g, b.head, c, flat ? null : this.face(), this, flat);
      g.restore();
      // near arm + prop
      if (this.prop && PROPS[this.prop] && PROPS[this.prop].behind) this.drawProp(g, J.haF, J.aF, this.prop, c);
      this.arm(g, J.shF, J.elF, J.haF, c, false);
      if (this.prop && !(PROPS[this.prop] && PROPS[this.prop].behind)) {
        this.drawProp(g, J.haF, J.aF, this.prop, c);
        // thumb/knuckles over the grip
        g.fillStyle = c.skin; circ(g, J.haF[0], J.haF[1], b.hand * 0.72); g.fill();
      }
      if (d.front && !flat) d.front(g, J, c, this);
    }
    capFill(g, ax, ay, bx, by, ra, rb, col, colS, plain, colH) {
      capsule(g, ax, ay, bx, by, ra, rb);
      if (plain) { g.fillStyle = col; g.fill(); return; }
      g.fillStyle = colS; g.fill();
      capsule(g, ax + 0.8, ay - 1.0, bx + 0.8, by - 1.0, max(0.5, ra - 1.4), max(0.5, rb - 1.4));
      g.fillStyle = col; g.fill();
      if (colH) { capsule(g, ax + 1.7, ay - 2.0, bx + 1.7, by - 2.0, max(0.4, ra * 0.3), max(0.4, rb * 0.3)); g.fillStyle = colH; g.fill(); }
    }
    arm(g, sh, el, ha, c, far) {
      const b = this.b, d = this.def, ol = this.ol;
      const sl = d.sleeve || 'long';
      const up = sl === 'none' ? 'skin' : (d.sleeveCol || 'shirt');
      const lo = sl === 'long' ? up : 'skin';
      const plain = far || this.flat;
      g.strokeStyle = c.out; g.lineWidth = ol * 2;
      capsule(g, sh[0], sh[1], el[0], el[1], b.rShoulder, b.rElbow); g.stroke();
      capsule(g, el[0], el[1], ha[0], ha[1], b.rElbow, b.rWrist); g.stroke();
      circ(g, ha[0], ha[1], b.hand); g.stroke();
      this.capFill(g, el[0], el[1], ha[0], ha[1], b.rElbow, b.rWrist, c[lo], c[lo + 'S'], plain, c[lo + 'H']);
      this.capFill(g, sh[0], sh[1], el[0], el[1], b.rShoulder, b.rElbow, c[up], c[up + 'S'], plain, c[up + 'H']);
      g.fillStyle = c[d.glove || 'skin']; circ(g, ha[0], ha[1], b.hand); g.fill();
      if (sl === 'short') {
        const mx = sh[0] + (el[0] - sh[0]) * 0.62, my = sh[1] + (el[1] - sh[1]) * 0.62;
        capsule(g, sh[0], sh[1], mx, my, b.rShoulder + 1.1, b.rShoulder + 1.4);
        g.lineWidth = ol * 2; g.stroke(); g.fillStyle = c[d.sleeveCol || 'shirt']; g.fill();
      } else if (sl === 'long' && d.cuff && !this.flat) {
        const mx = el[0] + (ha[0] - el[0]) * 0.84, my = el[1] + (ha[1] - el[1]) * 0.84;
        g.strokeStyle = c[d.cuff]; g.lineWidth = b.rWrist * 2 + 1.4; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(mx, my); g.lineTo(ha[0] + (el[0] - ha[0]) * 0.02, ha[1] + (el[1] - ha[1]) * 0.02); g.stroke();
      }
      if (d.wrist && !this.flat && !far) {
        const mx = el[0] + (ha[0] - el[0]) * 0.7, my = el[1] + (ha[1] - el[1]) * 0.7, ex = el[0] + (ha[0] - el[0]) * 0.9, ey = el[1] + (ha[1] - el[1]) * 0.9;
        g.strokeStyle = c[d.wrist]; g.lineWidth = b.rWrist * 2 + 1.6; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(mx, my); g.lineTo(ex, ey); g.stroke();
      }
    }
    leg(g, hp, kn, an, shinAng, c, far) {
      const b = this.b, d = this.def, ol = this.ol;
      const plain = far || this.flat;
      const upCol = d.legs === 'bare' ? 'skin' : 'pants', loCol = d.legs === 'bare' || d.legs === 'shorts' ? 'skin' : 'pants';
      const bag = d.baggy || 0;
      // foot: flat when planted, flexed with the shin when in the air
      let dx = cos(shinAng), dy = -sin(shinAng);
      const plant = U.clamp(1 - (this.J.floor - (an[1] + b.footH)) / 9, 0, 1) * (this.grounded ? 1 : 0);
      dx = dx + (1 - dx) * plant; dy = dy * (1 - plant);
      const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
      const bx = an[0] - dy * b.footH * 0.42, by = an[1] + dx * b.footH * 0.42;
      const hx = bx - dx * b.foot * 0.26, hy = by - dy * b.foot * 0.26, tx = bx + dx * b.foot * 0.74, ty = by + dy * b.foot * 0.74;
      g.strokeStyle = c.out; g.lineWidth = ol * 2;
      capsule(g, hp[0], hp[1], kn[0], kn[1], b.rThigh + bag, b.rKnee + bag); g.stroke();
      capsule(g, kn[0], kn[1], an[0], an[1], b.rKnee + bag, b.rAnkle + bag * 1.3); g.stroke();
      capsule(g, hx, hy, tx, ty, b.footH * 0.56, b.footH * 0.44); g.stroke();
      g.fillStyle = c.shoe; g.fill();
      if (d.sole && !this.flat) {
        g.strokeStyle = c[d.sole]; g.lineWidth = b.footH * 0.26; g.lineCap = 'round';
        g.beginPath(); g.moveTo(hx - dy * b.footH * 0.36, hy + dx * b.footH * 0.36); g.lineTo(tx - dy * b.footH * 0.3, ty + dx * b.footH * 0.3); g.stroke();
        g.lineCap = 'butt';
      }
      this.capFill(g, kn[0], kn[1], an[0], an[1], b.rKnee + bag, b.rAnkle + bag * 1.3, c[loCol], c[loCol + 'S'], plain, c[loCol + 'H']);
      this.capFill(g, hp[0], hp[1], kn[0], kn[1], b.rThigh + bag, b.rKnee + bag, c[upCol], c[upCol + 'S'], plain, c[upCol + 'H']);
      if (d.sock && !this.flat) {
        const mx = kn[0] + (an[0] - kn[0]) * 0.8, my = kn[1] + (an[1] - kn[1]) * 0.8;
        g.strokeStyle = c[d.sock]; g.lineWidth = b.rAnkle * 2 + 0.6; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(mx, my); g.lineTo(an[0], an[1]); g.stroke();
      }
    }
    torso(g, J, c) {
      const b = this.b, d = this.def, ol = this.ol;
      const L = b.torso, ws = b.wShoulder / 2, ww = b.wWaist / 2, hem = d.hem === undefined ? 6 : d.hem * (d.scale || 1), belly = d.belly || 0;
      g.save();
      g.translate(J.hip[0], J.hip[1]);
      g.rotate(J.torsoAng);
      g.beginPath();
      g.moveTo(-ww - (d.flare || 0), hem);
      g.bezierCurveTo(-ww - 1, -L * 0.35, -ws - 1.5, -L * 0.72, -ws + 1, -L + 3);
      g.quadraticCurveTo(-ws * 0.55, -L - 4.5, 0, -L - 3.5);
      g.quadraticCurveTo(ws * 0.62, -L - 3.5, ws, -L + 4);
      g.bezierCurveTo(ws + 3 + belly * 0.35, -L * 0.62, ww + 2 + belly, -L * 0.22, ww + belly * 0.55 + (d.flare || 0), hem);
      g.closePath();
      g.strokeStyle = c.out; g.lineWidth = ol * 2; g.stroke();
      g.fillStyle = c.shirt; g.fill();
      if (!this.flat) {
        g.save(); g.clip();
        g.fillStyle = c.shirtS;
        g.beginPath(); g.moveTo(-ws - 8, -L - 8); g.lineTo(-ws * 0.3, -L - 8);
        g.bezierCurveTo(-ws * 0.62, -L * 0.6, -ww * 0.5, -L * 0.2, -ww * 0.3, hem + 4);
        g.lineTo(-ww - 10, hem + 4); g.closePath(); g.fill();
        g.fillStyle = c.shirtH;
        g.beginPath(); g.ellipse(ws * 0.5, -L * 0.74, ws * 0.36, L * 0.2, 0.25, 0, TAU); g.fill();
        if (d.outfit) d.outfit(g, L, ws, ww, hem, c, this);
        g.restore();
        if (d.over) d.over(g, L, ws, ww, hem, c, this);
      }
      g.restore();
    }
    drawProp(g, hand, foreAng, name, c) {
      const P = PROPS[name];
      if (!P) return;
      g.save();
      g.translate(hand[0], hand[1]);
      g.rotate(PI / 2 - foreAng);      // local +x = along the forearm, -y = thumb side
      g.rotate(this.pose.propA);          // propA = 0: perpendicular (hammer grip), PI/2: in line with forearm
      P.draw(g, c, this, this.flat);
      g.restore();
    }
    /** tip of the held weapon in rig-local coords (after solve) */
    propTip(len) {
      const J = this.J, a = PI / 2 - J.aF + this.pose.propA;
      return [J.haF[0] + sin(a) * len, J.haF[1] - cos(a) * len];
    }
  }
  BD.Rig = Rig;

  /* ---------------------------------------------------------------- props */
  /* drawn in grip space: the weapon points along -y, hand at origin */
  const stick = (g, y0, y1, w, col, out, ol) => {
    g.lineCap = 'round';
    g.strokeStyle = out; g.lineWidth = w + ol * 2; g.beginPath(); g.moveTo(0, y0); g.lineTo(0, y1); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(0, y0); g.lineTo(0, y1); g.stroke();
    g.lineCap = 'butt';
  };
  const PROPS = (BD.PROPS = {
    cane: { len: 92, draw(g, c, r) {
      stick(g, 10, -82, 4.2, c.wood || '#5a3a22', c.out, r.ol);
      g.strokeStyle = c.out; g.lineWidth = 4.2 + r.ol * 2; g.lineCap = 'round';
      g.beginPath(); g.arc(-7, 10, 7, 0, PI * 0.9); g.stroke();
      g.strokeStyle = c.wood || '#5a3a22'; g.lineWidth = 4.2; g.beginPath(); g.arc(-7, 10, 7, 0, PI * 0.9); g.stroke();
      g.lineCap = 'butt';
    } },
    blade: { len: 104, draw(g, c, r) { // shikomizue: cane-sword
      stick(g, 12, -8, 4.6, c.wood || '#2a2420', c.out, r.ol);
      g.strokeStyle = c.out; g.lineWidth = 3.6 + r.ol; g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(-3, -60, 1.5, -104); g.stroke();
      g.strokeStyle = c.steel || '#f3efe6'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(-3, -60, 1.5, -104); g.stroke();
    } },
    mallet: { len: 86, draw(g, c, r) {
      stick(g, 12, -78, 3.6, '#c9a468', c.out, r.ol);
      g.fillStyle = '#b8402f'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.roundRect(-15, -90, 30, 15, 4); g.stroke(); g.fill();
      g.fillStyle = '#f1e7d0'; g.fillRect(-15, -86, 4, 7); g.fillRect(11, -86, 4, 7);
    } },
    bottle: { len: 40, draw(g, c, r) {
      g.fillStyle = '#254b33'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.moveTo(-6, 12); g.lineTo(-6, -14); g.quadraticCurveTo(-6, -22, -2.5, -26); g.lineTo(-2.5, -38); g.lineTo(2.5, -38); g.lineTo(2.5, -26); g.quadraticCurveTo(6, -22, 6, -14); g.lineTo(6, 12); g.closePath(); g.stroke(); g.fill();
      g.fillStyle = '#d8b24a'; g.fillRect(-3.2, -40, 6.4, 9);
      g.fillStyle = '#efe6cf'; g.fillRect(-6, -8, 12, 11);
    } },
    nunchaku: { len: 60, draw(g, c, r) {
      stick(g, 12, -16, 4.4, '#2a2622', c.out, r.ol);
      const a = r.spin, cx = sin(a) * 15, cy = -16 - abs(cos(a)) * 12;
      g.strokeStyle = '#b9b9c2'; g.lineWidth = 1.6; g.setLineDash([2.5, 2]);
      g.beginPath(); g.moveTo(0, -17); g.lineTo(cx, cy); g.stroke(); g.setLineDash([]);
      g.save(); g.translate(cx, cy); g.rotate(a * 1.0 + 0.4);
      stick(g, 0, -30, 4.4, '#2a2622', c.out, r.ol);
      g.restore();
    } },
    pistol: { len: 26, draw(g, c, r) { // airsoft: note the orange safety tip
      g.fillStyle = '#26262b'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.roundRect(-5, -24, 9, 30, 2); g.stroke(); g.fill();
      g.beginPath(); g.roundRect(-5, -4, 16, 8, 2); g.stroke(); g.fill();
      g.fillStyle = '#ff7a1a'; g.fillRect(-4.2, -27, 7.4, 5);
      g.fillStyle = '#4a4a52'; g.fillRect(-5, -16, 9, 3);
    } },
    flashlight: { len: 22, draw(g, c, r) {
      g.fillStyle = '#1e1e22'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.roundRect(-4, -14, 8, 26, 2); g.stroke(); g.fill();
      g.beginPath(); g.moveTo(-4, -14); g.lineTo(-7.5, -22); g.lineTo(7.5, -22); g.lineTo(4, -14); g.closePath(); g.stroke(); g.fill();
      g.fillStyle = '#fff6c9'; g.fillRect(-6.5, -24, 13, 3);
    } },
    belt: { len: 70, draw(g, c, r) {
      const w = sin(r.t * 9) * 5;
      g.lineCap = 'round';
      for (let p = 0; p < 2; p++) {
        g.strokeStyle = p ? '#3b2416' : c.out; g.lineWidth = p ? 5 : 5 + r.ol * 2;
        g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(8, -20, -10 + w, -40, w * 1.4, -66); g.stroke();
      }
      g.fillStyle = '#d9b34a'; g.strokeStyle = c.out; g.lineWidth = r.ol;
      g.beginPath(); g.roundRect(w * 1.4 - 5, -74, 10, 9, 2); g.stroke(); g.fill();
      g.lineCap = 'butt';
    } },
    trap: { len: 46, draw(g, c, r) { // crab trap on a chain
      g.strokeStyle = '#9a9aa4'; g.lineWidth = 2; g.setLineDash([3, 2.4]);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(sin(r.spin) * 8, -30); g.stroke(); g.setLineDash([]);
      g.save(); g.translate(sin(r.spin) * 8, -42);
      g.fillStyle = '#6b4a2a'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.roundRect(-13, -11, 26, 22, 3); g.stroke(); g.fill();
      g.strokeStyle = '#3d2915'; g.lineWidth = 1.4;
      g.beginPath(); for (let i = -8; i <= 8; i += 5.4) { g.moveTo(i, -11); g.lineTo(i, 11); } g.moveTo(-13, -3); g.lineTo(13, -3); g.moveTo(-13, 4); g.lineTo(13, 4); g.stroke();
      g.restore();
    } },
    umbrella: { len: 80, behind: true, draw(g, c, r) {
      stick(g, 8, -70, 2.6, '#2a2622', c.out, r.ol);
      g.fillStyle = c.umbrella || '#1f2430'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
      g.beginPath(); g.moveTo(-52, -62); g.quadraticCurveTo(0, -112, 52, -62);
      g.quadraticCurveTo(39, -70, 26, -62); g.quadraticCurveTo(13, -70, 0, -62); g.quadraticCurveTo(-13, -70, -26, -62); g.quadraticCurveTo(-39, -70, -52, -62);
      g.closePath(); g.stroke(); g.fill();
    } },
    purse: { len: 30, draw(g, c, r) {
      g.strokeStyle = c.out; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 10, 9, PI, TAU); g.stroke();
      g.fillStyle = '#2a2622'; g.lineWidth = r.ol * 2; g.beginPath(); g.roundRect(-13, 10, 26, 20, 4); g.stroke(); g.fill();
      g.fillStyle = '#d9b34a'; g.fillRect(-3, 10, 6, 5);
    } },
    mic: { len: 16, draw(g, c, r) {
      stick(g, 8, -8, 3.4, '#26262b', c.out, r.ol);
      g.fillStyle = '#8c8c96'; g.strokeStyle = c.out; g.lineWidth = r.ol * 2; circ(g, 0, -13, 5.4); g.stroke(); g.fill();
    } },
  });

  /* -------------------------------------------------------------- portrait */
  /** a talking head for dialogue boxes and the HUD; caches one rig per character */
  const pRigs = {};
  BD.Portrait = {
    rig(id) { return pRigs[id] || (pRigs[id] = new Rig(id, { prop: null })); },
    /** draws a bust centred horizontally at cx, head centre at cy, head radius ≈ r px */
    draw(g, id, cx, cy, r, face, expr, talk, dt, pose) {
      const rig = this.rig(id);
      rig.expr = expr || rig.def.expr || 'neutral';
      rig.talk = talk || 0;
      const pn = pose || rig.def.portraitPose || 'stand';
      if (rig.poseName !== pn) rig.snap(pn);
      rig.update(dt || 0, 0, 0);
      const s = r / rig.b.head;
      rig.draw(g, cx, cy, face, { scale: s, anchor: 'head', rim: false });
    },
  };
})();
