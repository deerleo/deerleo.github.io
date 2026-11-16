/* cast.js — character designs. Each entry is a build + palette + head/outfit painters. */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U;
  const { skull, eye, features, lobes, circ } = BD.Face;
  const { sin, cos, PI } = Math;
  const TAU = PI * 2;
  const EYE = '#f5f0e6';

  /* ------------------------------------------------------------ shared bits */
  const ring = (cx, cy, rad, n, r, w) => { const o = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; o.push([cx + cos(a) * rad, cy + sin(a) * rad, r + (i % 3) * 0.03, w === undefined ? 1 : w]); } return o; };
  /** hair that hugs the skull down to a hairline. o: { line, vol, boxed, side, wide } */
  function hairCap(g, R, c, ol, col, o) {
    o = o || {};
    const w = o.wide || 1, line = o.line === undefined ? -0.52 : o.line, vol = o.vol || 0.05, side = (o.side === undefined ? -0.04 : o.side) * R;
    g.fillStyle = col; g.strokeStyle = c.out; g.lineWidth = ol * 1.8; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(-0.95 * R * w, side);
    g.bezierCurveTo(-1.03 * R * w, (-1.14 - vol) * R, 1.01 * R * w, (-1.16 - vol) * R, 0.93 * R * w, side);
    if (o.boxed) { g.lineTo(0.76 * R * w, (line + 0.04) * R); g.lineTo(-0.78 * R * w, line * R); }
    else { g.quadraticCurveTo(0.84 * R * w, line * R, 0.3 * R, (line - 0.03) * R); g.quadraticCurveTo(-0.5 * R, (line - 0.08) * R, -0.82 * R * w, (line + 0.14) * R); }
    g.closePath(); g.stroke(); g.fill();
  }
  function specs(g, R, c, ol, col, ey, r, tint) {
    ey *= R;
    g.strokeStyle = col; g.lineWidth = ol * 1.5; g.fillStyle = tint || 'rgba(255,255,255,0.14)';
    circ(g, -0.22 * R, ey, r * R); g.fill(); g.stroke();
    circ(g, 0.5 * R, ey, r * 0.9 * R); g.fill(); g.stroke();
    g.beginPath(); g.moveTo((-0.22 + r) * R, ey - 0.04 * R); g.quadraticCurveTo(0.16 * R, ey - 0.14 * R, (0.5 - r * 0.9) * R, ey - 0.04 * R);
    g.moveTo((-0.22 - r) * R, ey - 0.04 * R); g.lineTo(-0.92 * R, ey); g.stroke();
    if (!tint) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = ol; g.beginPath(); g.moveTo(-0.38 * R, ey + 0.1 * R); g.lineTo(-0.22 * R, ey - 0.16 * R); g.stroke(); }
  }
  function wrinkles(g, R, c, ol, j) {
    g.strokeStyle = c.skinS; g.lineWidth = ol * 1.1; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-0.36 * R, -0.62 * R); g.quadraticCurveTo(0.12 * R, -0.7 * R, 0.6 * R, -0.6 * R);
    g.moveTo(-0.26 * R, -0.8 * R); g.quadraticCurveTo(0.12 * R, -0.86 * R, 0.5 * R, -0.78 * R);
    g.moveTo(-0.12 * R, 0.5 * R); g.quadraticCurveTo(-0.26 * R, 0.66 * R * j, -0.18 * R, 0.86 * R * j);
    g.moveTo(0.46 * R, 0.5 * R); g.quadraticCurveTo(0.58 * R, 0.66 * R * j, 0.5 * R, 0.86 * R * j);
    g.stroke(); g.lineCap = 'butt';
  }
  const tuft = (g, list, R, c, ol, col) => { lobes(g, list, R, 0, 0, c.out, ol); lobes(g, list, R, 0, 0, col, 0); };
  /** suit front: shirt V, tie, lapels. Torso space: x forward, y up negative, clipped to the torso. */
  function suitFront(g, L, ws, c, tie, bow) {
    g.fillStyle = c.shirt2;
    g.beginPath(); g.moveTo(ws * 0.05, -L - 6); g.lineTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.5, -L * 0.42); g.closePath(); g.fill();
    if (bow) {
      g.fillStyle = c[tie];
      g.beginPath(); g.moveTo(ws * 0.24, -L + 1); g.lineTo(ws * 0.46, -L + 5); g.lineTo(ws * 0.24, -L + 9); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(ws * 0.68, -L + 1); g.lineTo(ws * 0.46, -L + 5); g.lineTo(ws * 0.68, -L + 9); g.closePath(); g.fill();
    } else if (tie) {
      g.fillStyle = c[tie];
      g.beginPath(); g.moveTo(ws * 0.38, -L); g.lineTo(ws * 0.56, -L); g.lineTo(ws * 0.6, -L * 0.52); g.lineTo(ws * 0.5, -L * 0.42); g.lineTo(ws * 0.4, -L * 0.52); g.closePath(); g.fill();
    }
    g.strokeStyle = c.shirtS; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(ws * 0.05, -L - 2); g.lineTo(ws * 0.5, -L * 0.42); g.lineTo(ws * 0.86, -L - 2);
    g.moveTo(ws * 0.5, -L * 0.42); g.lineTo(ws * 0.5, 14); g.stroke();
  }
  function vestFront(g, L, ws, ww, c, vest) {
    // shirt shows at the shoulders/sleeves, vest covers the body
    g.fillStyle = c[vest];
    g.beginPath(); g.moveTo(-ws - 4, -L * 0.86); g.lineTo(ws * 0.1, -L * 0.98); g.lineTo(ws * 0.46, -L * 0.5); g.lineTo(ws * 0.84, -L * 0.98); g.lineTo(ws + 12, -L * 0.8); g.lineTo(ws + 14, 20); g.lineTo(-ws - 6, 20); g.closePath(); g.fill();
    g.fillStyle = c[vest + 'S'];
    g.beginPath(); g.moveTo(-ws - 4, -L * 0.86); g.lineTo(-ws * 0.3, -L * 0.9); g.lineTo(-ww * 0.35, 20); g.lineTo(-ws - 6, 20); g.closePath(); g.fill();
    g.strokeStyle = c.out; g.lineWidth = 1; g.globalAlpha = 0.5;
    g.beginPath(); g.moveTo(ws * 0.46, -L * 0.5); g.lineTo(ws * 0.46, 20); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = '#e6c15a';
    for (let i = 0; i < 3; i++) { circ(g, ws * 0.56, -L * (0.4 - i * 0.16), 1.3); g.fill(); }
  }

  /* --------------------------------------------------------------- the kids */
  // Huey: the afro is the character. One huge sphere, ears poking out, face low in the middle.
  const AFRO = [[0, -0.76, 1.84, 0.5]].concat(ring(0, -0.76, 1.8, 26, 0.26));
  const AFRO_LINE = [[-0.62, -0.92, 0.44, 0.4], [-0.12, -1.0, 0.48, 0.4], [0.4, -0.97, 0.46, 0.4], [0.8, -0.82, 0.32, 0.4], [-0.94, -0.64, 0.28, 0.4], [0.95, -0.58, 0.22, 0.4]];
  function hueyHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, hx = rig.hair.x, hy = rig.hair.y;
    lobes(g, AFRO, R, hx, hy, c.out, ol);
    lobes(g, AFRO, R, hx, hy, c.hair, 0);
    if (!flat) {
      g.strokeStyle = c.hairHi; g.lineWidth = 0.14 * R; g.lineCap = 'round';
      g.beginPath(); g.arc(hx, -0.76 * R + hy, 1.5 * R, -2.5, -1.75); g.stroke();
      g.beginPath(); g.arc(hx, -0.76 * R + hy, 1.18 * R, -2.3, -1.9); g.stroke();
      g.beginPath(); g.arc(hx, -0.76 * R + hy, 1.5 * R, -1.3, -0.95); g.stroke();
      g.lineCap = 'butt';
    }
    skull(g, R, c, { ol, ear: 1.1 });
    lobes(g, AFRO_LINE, R, hx, hy, c.hair, 0);
    if (flat) return;
    features(g, R, c, e, { ol, brow: 0.16 });
  }

  function rileyHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, sw = rig.hair.x * 0.5;
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { // braid tails behind the ear
      const x0 = (-0.72 - i * 0.1) * R, y0 = (0.28 + i * 0.03) * R, x1 = x0 - 0.1 * R + sw, y1 = y0 + (0.8 - i * 0.08) * R;
      g.strokeStyle = c.out; g.lineWidth = 0.17 * R + ol * 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = c.hair; g.lineWidth = 0.17 * R; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    g.lineCap = 'butt';
    skull(g, R, c, { ol, ear: 1.1 });
    hairCap(g, R, c, ol, c.hair, { boxed: true, line: -0.5, vol: 0.02 });
    if (flat) return;
    g.strokeStyle = c.skinS; g.lineWidth = 0.05 * R; g.lineCap = 'butt'; // cornrows: thin lines of scalp between the braids
    for (let i = 0; i < 6; i++) { const x0 = (-0.62 + i * 0.25) * R; g.beginPath(); g.moveTo(x0, -0.52 * R); g.quadraticCurveTo(x0 * 0.9, -0.82 * R, x0 * 0.66, -1.02 * R); g.stroke(); }
    g.lineCap = 'butt';
    features(g, R, c, e, { ol, brow: 0.11, eye: 1.04 });
    if (rig.vars.goggles) {
      g.fillStyle = 'rgba(120,200,255,0.32)'; g.strokeStyle = '#22252b'; g.lineWidth = ol * 1.8;
      g.beginPath(); g.roundRect(-0.62 * R, -0.24 * R, 1.46 * R, 0.66 * R, 0.24 * R); g.fill(); g.stroke();
      g.strokeStyle = '#c7352e'; g.lineWidth = 0.16 * R;
      g.beginPath(); g.moveTo(-0.62 * R, 0.06 * R); g.lineTo(-0.96 * R, 0); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = ol;
      g.beginPath(); g.moveTo(-0.44 * R, 0.24 * R); g.lineTo(-0.24 * R, -0.14 * R); g.stroke();
    }
  }

  const PUFF_FAR = [[1.04, -1.0, 0.7, 1]].concat(ring(1.04, -1.0, 0.66, 9, 0.2));
  const PUFF_NEAR = [[-1.1, -1.0, 0.78, 1]].concat(ring(-1.1, -1.0, 0.74, 10, 0.2));
  function jazmineHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, hx = rig.hair.x, hy = rig.hair.y;
    lobes(g, PUFF_FAR, R, hx, hy, c.out, ol); lobes(g, PUFF_FAR, R, hx, hy, c.hairS, 0);
    lobes(g, PUFF_NEAR, R, hx, hy, c.out, ol); lobes(g, PUFF_NEAR, R, hx, hy, c.hair, 0);
    skull(g, R, c, { ol, chin: 0.15 });
    hairCap(g, R, c, ol, c.hair, { line: -0.54, vol: 0.03 });
    g.fillStyle = c.shirt; circ(g, -0.74 * R, -0.66 * R, 0.13 * R); g.fill(); circ(g, 0.74 * R, -0.68 * R, 0.11 * R); g.fill();
    if (flat) return;
    g.strokeStyle = c.hairHi; g.lineWidth = 0.1 * R; g.lineCap = 'round';
    g.beginPath(); g.arc(-1.1 * R + hx, -1.0 * R + hy, 0.5 * R, -2.4, -1.2); g.stroke();
    g.beginPath(); g.moveTo(0.05 * R, -1.12 * R); g.lineTo(0.08 * R, -0.6 * R); g.stroke(); g.lineCap = 'butt';
    features(g, R, c, e, { ol, brow: 0.07, eye: 1.08 });
    g.fillStyle = c.skinS; // freckles
    for (const [x, y] of [[-0.5, 0.46], [-0.36, 0.52], [-0.24, 0.45], [0.5, 0.46], [0.62, 0.52], [0.72, 0.44]]) g.fillRect(x * R, y * R, 0.06 * R, 0.06 * R);
    g.strokeStyle = c.out; g.lineWidth = ol;
    g.beginPath(); g.moveTo(-0.52 * R, 0.0); g.lineTo(-0.62 * R, -0.1 * R); g.moveTo(0.76 * R, 0.0); g.lineTo(0.84 * R, -0.1 * R); g.stroke();
  }

  /* ------------------------------------------------------------- the adults */
  const GD_NEAR = [[-0.98, -0.5, 0.32], [-1.08, -0.22, 0.26], [-0.86, -0.76, 0.24]];
  const GD_FAR = [[0.94, -0.46, 0.24], [1.0, -0.18, 0.2], [0.86, -0.7, 0.18]];
  function granddadHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.2, chin: 0.27, wide: 0.94, eye: 0.74, eyeY: -0.04, brow: 0.16, browCol: 'hair', noseT: 'wide', noseS: 1.15, noseY: 0.44, mouthY: 0.72 };
    tuft(g, GD_FAR, R, c, ol, c.hairS);
    skull(g, R, c, k);
    tuft(g, GD_NEAR, R, c, ol, c.hair);
    if (flat) return;
    g.fillStyle = c.skinH; g.beginPath(); g.ellipse(0.2 * R, -0.88 * R, 0.34 * R, 0.1 * R, 0, 0, TAU); g.fill();
    wrinkles(g, R, c, ol, 1.2);
    features(g, R, c, e, k);
    specs(g, R, c, ol, c.glass, -0.04, 0.31);
  }

  function tomHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, poss = rig.def.possessed, k = { ol, jaw: 1.14, chin: 0.25, eye: 0.82, eyeY: 0, brow: 0.1, noseT: 'wide', noseS: 0.9, noseY: 0.44, mouthY: 0.7 };
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.56, vol: 0.04 });
    if (flat) return;
    if (poss) {
      g.fillStyle = 'rgba(20,30,10,0.5)';
      g.beginPath(); g.ellipse(0.14 * R, 0, 0.74 * R, 0.3 * R, 0, 0, TAU); g.fill();
      g.strokeStyle = '#3e5a2a'; g.lineWidth = ol;
      g.beginPath(); g.moveTo(-0.6 * R, -0.4 * R); g.lineTo(-0.46 * R, -0.28 * R); g.lineTo(-0.56 * R, -0.16 * R); g.moveTo(0.6 * R, 0.5 * R); g.lineTo(0.5 * R, 0.66 * R); g.stroke();
    }
    features(g, R, c, e, k);
  }

  const RUCK_NEAR = [[-0.96, -0.42, 0.2], [-1.02, -0.18, 0.18], [-0.86, -0.62, 0.16]];
  const RUCK_FAR = [[0.92, -0.4, 0.16], [0.96, -0.18, 0.14]];
  function ruckusHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.06, chin: 0.42, ear: 1.1, noEyes: true, eye: 0.9, eyeY: -0.12, brow: 0.09, browCol: 'hair', noseT: 'wide', noseS: 1.5, noseY: 0.36, mouthY: 0.74, mouthW: 1.5 };
    g.save(); g.scale(1.2, 1.0);
    g.fillStyle = c.skinS; g.strokeStyle = c.out; g.lineWidth = ol * 2; // jowls
    g.beginPath(); g.ellipse(0.12 * R, 0.94 * R, 0.72 * R, 0.3 * R, 0, 0, TAU); g.stroke(); g.fill();
    lobes(g, RUCK_FAR, R, 0, 0, c.hairS, 0);
    skull(g, R, c, k);
    lobes(g, RUCK_NEAR, R, 0, 0, c.hair, 0);
    if (!flat) {
      const eN = rig._eN || (rig._eN = {}), eF = rig._eF || (rig._eF = {});
      Object.assign(eN, e, { lid: e.lid >= 0.95 ? 1 : 0.02, tilt: e.tilt * 0.3, pupil: 0.5, lookX: 0.4 });
      Object.assign(eF, e, { lid: e.lid >= 0.95 ? 1 : 0.56 });
      eye(g, -0.26 * R, -0.1 * R, 0.68 * R, 0.68 * R, eN, c, 1, ol);   // the big wandering eye
      eye(g, 0.5 * R, -0.02 * R, 0.44 * R, 0.34 * R, eF, c, -1, ol);
      features(g, R, c, e, k);
      g.strokeStyle = c.skinS; g.lineWidth = ol * 1.8; g.lineCap = 'round'; // heavy lower lip
      g.beginPath(); g.moveTo(-0.12 * R, 0.96 * R); g.quadraticCurveTo(0.16 * R, 1.06 * R, 0.44 * R, 0.95 * R); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = c.hair; // stubble
      for (let i = 0; i < 7; i++) g.fillRect((-0.4 + i * 0.17) * R, (0.86 + (i % 2) * 0.07) * R, 0.05 * R, 0.05 * R);
    }
    g.restore();
  }

  const STINK_NEAR = [[-0.94, -0.4, 0.26], [-1.02, -0.16, 0.22], [-0.82, -0.62, 0.2]];
  const STINK_FAR = [[0.9, -0.34, 0.2], [0.94, -0.08, 0.17]];
  function stinkHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.14, chin: 0.2, wide: 0.92, eye: 0.8, eyeY: -0.02, brow: 0.15, browCol: 'hair', noseT: 'wide', noseS: 1.25, noseY: 0.42, mouthY: 0.7, mouthW: 1.45 };
    tuft(g, STINK_FAR, R, c, ol, c.hairS);
    skull(g, R, c, k);
    tuft(g, STINK_NEAR, R, c, ol, c.hair);
    if (!flat) {
      wrinkles(g, R, c, ol, 1.14);
      features(g, R, c, e, k);
      if (e.mouth === 'grin' && e.open < 0.1) { g.fillStyle = '#2a0f12'; g.fillRect(0.2 * R, 0.78 * R, 0.1 * R, 0.16 * R); } // the missing tooth
      g.fillStyle = c.hair;
      for (let i = 0; i < 6; i++) g.fillRect((-0.16 + i * 0.12) * R, (1.02 + (i % 2) * 0.05) * R, 0.05 * R, 0.05 * R);
    }
    if (rig.def.kasa) { // the wandering-swordsman hat
      g.fillStyle = c.hat; g.strokeStyle = c.out; g.lineWidth = ol * 2;
      g.beginPath(); g.moveTo(-1.8 * R, -0.42 * R); g.quadraticCurveTo(-0.3 * R, -1.6 * R, 0.08 * R, -1.72 * R);
      g.quadraticCurveTo(0.5 * R, -1.6 * R, 1.8 * R, -0.46 * R); g.quadraticCurveTo(0, -0.2 * R, -1.8 * R, -0.42 * R); g.closePath(); g.stroke(); g.fill();
      if (!flat) {
        g.strokeStyle = c.hatS; g.lineWidth = ol * 1.2;
        g.beginPath(); for (let i = -3; i <= 3; i++) { g.moveTo(0.08 * R, -1.7 * R); g.lineTo(i * 0.5 * R, (-0.38 + Math.abs(i) * 0.02) * R); } g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.3)'; // brim shadow across the eyes
        g.beginPath(); g.moveTo(-0.9 * R, -0.33 * R); g.quadraticCurveTo(0, -0.24 * R, 0.9 * R, -0.35 * R); g.lineTo(0.9 * R, -0.04 * R); g.quadraticCurveTo(0, 0.08 * R, -0.9 * R, -0.04 * R); g.closePath(); g.fill();
      }
    }
  }

  // A Pimp Named Slickback. Yes, you say the whole thing.
  function slickHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, sw = rig.hair.x * 0.6, k = { ol, jaw: 1.16, chin: 0.2, wide: 0.9, eye: 0.76, eyeY: 0, brow: 0.07, noseT: 'wide', noseS: 0.9, noseY: 0.44, mouthY: 0.7 };
    g.fillStyle = c.hair; g.strokeStyle = c.out; g.lineWidth = ol * 2; // the perm, down to the shoulders
    g.beginPath(); g.moveTo(-0.98 * R, -0.5 * R); g.bezierCurveTo(-1.2 * R, 0.4 * R, -1.34 * R + sw, 1.2 * R, -1.12 * R + sw, 1.8 * R);
    g.lineTo(-0.5 * R + sw, 1.66 * R); g.lineTo(-0.4 * R, 0.6 * R); g.lineTo(0.6 * R, 0.6 * R); g.lineTo(0.7 * R + sw, 1.64 * R); g.lineTo(1.14 * R + sw, 1.74 * R);
    g.bezierCurveTo(1.3 * R + sw, 1.1 * R, 1.14 * R, 0.3 * R, 0.96 * R, -0.5 * R); g.closePath(); g.stroke(); g.fill();
    skull(g, R, c, k);
    g.fillStyle = c.hair; g.lineWidth = ol * 1.6; // locks framing the face
    g.beginPath(); g.moveTo(-0.1 * R, -0.74 * R); g.bezierCurveTo(-0.84 * R, -0.62 * R, -1.02 * R, 0, -0.94 * R, 0.84 * R); g.lineTo(-0.72 * R, 0.72 * R); g.bezierCurveTo(-0.8 * R, 0.1 * R, -0.58 * R, -0.3 * R, -0.1 * R, -0.74 * R); g.closePath(); g.stroke(); g.fill();
    g.beginPath(); g.moveTo(0.3 * R, -0.74 * R); g.bezierCurveTo(0.84 * R, -0.62 * R, 0.98 * R, 0, 0.92 * R, 0.8 * R); g.lineTo(0.76 * R, 0.7 * R); g.bezierCurveTo(0.8 * R, 0.1 * R, 0.66 * R, -0.3 * R, 0.3 * R, -0.74 * R); g.closePath(); g.stroke(); g.fill();
    if (!flat) {
      g.strokeStyle = c.hairHi; g.lineWidth = ol * 1.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-1.06 * R, 0.5 * R); g.quadraticCurveTo(-1.16 * R + sw, 1.0 * R, -1.02 * R + sw, 1.5 * R); g.moveTo(-0.86 * R, 0.1 * R); g.lineTo(-0.84 * R, 0.6 * R); g.stroke();
      features(g, R, c, e, k);
      g.strokeStyle = c.hair; g.lineWidth = 0.06 * R; // pencil moustache + soul patch
      g.beginPath(); g.moveTo(-0.08 * R, 0.66 * R); g.quadraticCurveTo(0.16 * R, 0.58 * R, 0.4 * R, 0.66 * R); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = c.hair; g.beginPath(); g.moveTo(-0.04 * R, 0.92 * R); g.lineTo(0.36 * R, 0.92 * R); g.lineTo(0.26 * R, 1.2 * R); g.lineTo(0.06 * R, 1.2 * R); g.closePath(); g.fill(); // goatee
      g.fillStyle = 'rgba(120,40,170,0.72)'; g.strokeStyle = '#e8c33a'; g.lineWidth = ol * 1.3; // the purple shades
      g.beginPath(); g.roundRect(-0.56 * R, -0.2 * R, 0.66 * R, 0.4 * R, 0.1 * R); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(0.24 * R, -0.2 * R, 0.56 * R, 0.38 * R, 0.1 * R); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0.1 * R, -0.08 * R); g.lineTo(0.24 * R, -0.08 * R); g.moveTo(-0.56 * R, -0.08 * R); g.lineTo(-0.9 * R, -0.02 * R); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = ol; g.beginPath(); g.moveTo(-0.42 * R, 0.1 * R); g.lineTo(-0.26 * R, -0.14 * R); g.stroke();
    }
    // the hat
    g.fillStyle = c.hat; g.strokeStyle = c.out; g.lineWidth = ol * 2;
    g.beginPath(); g.moveTo(-0.84 * R, -0.6 * R); g.bezierCurveTo(-0.9 * R, -1.74 * R, 0.96 * R, -1.78 * R, 0.9 * R, -0.64 * R); g.closePath(); g.stroke(); g.fill();
    if (!flat) {
      g.fillStyle = c.hatS; g.beginPath(); g.moveTo(-0.84 * R, -0.6 * R); g.bezierCurveTo(-0.9 * R, -1.74 * R, -0.3 * R, -1.76 * R, -0.3 * R, -1.6 * R); g.lineTo(-0.4 * R, -0.6 * R); g.closePath(); g.fill();
      g.fillStyle = c.band; g.fillRect(-0.86 * R, -0.9 * R, 1.76 * R, 0.2 * R);
    }
    g.fillStyle = c.hat;
    g.beginPath(); g.ellipse(0.04 * R, -0.62 * R, 1.8 * R, 0.3 * R, -0.06, 0, TAU); g.stroke(); g.fill();
    if (!flat) {
      g.fillStyle = c.hatH; g.beginPath(); g.ellipse(0.3 * R, -0.68 * R, 1.1 * R, 0.1 * R, -0.06, 0, TAU); g.fill();
      g.fillStyle = c.feather; g.strokeStyle = c.out; g.lineWidth = ol * 1.6; // the plume
      g.beginPath(); g.moveTo(-0.7 * R, -0.84 * R); g.bezierCurveTo(-1.5 * R, -1.3 * R, -1.9 * R + sw, -1.9 * R, -1.5 * R + sw, -2.3 * R);
      g.bezierCurveTo(-1.36 * R + sw, -1.8 * R, -1.0 * R, -1.3 * R, -0.52 * R, -0.9 * R); g.closePath(); g.stroke(); g.fill();
    }
  }

  const SWOOP = [[0.2, -1.02, 0.36], [0.56, -0.9, 0.28], [-0.2, -1.06, 0.34]];
  function guestHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.16, chin: 0.26, wide: 0.94, eye: 0.74, eyeY: -0.02, brow: 0.07, noseS: 1.5, noseY: 0.46, mouthY: 0.72 };
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.6, vol: 0.06 });
    lobes(g, SWOOP, R, 0, 0, c.hair, 0);
    if (flat) return;
    g.strokeStyle = c.hairHi; g.lineWidth = 0.09 * R; g.lineCap = 'round';
    g.beginPath(); g.arc(0.14 * R, -0.98 * R, 0.34 * R, -2.5, -0.8); g.stroke(); g.lineCap = 'butt';
    features(g, R, c, e, k);
    if (rig.def.monocle) {
      g.strokeStyle = '#d9b34a'; g.lineWidth = ol * 1.4; circ(g, -0.22 * R, -0.02 * R, 0.3 * R); g.stroke();
      g.beginPath(); g.moveTo(-0.3 * R, 0.28 * R); g.quadraticCurveTo(-0.5 * R, 0.8 * R, -0.3 * R, 1.3 * R); g.stroke();
    }
  }

  function guardHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.18, chin: 0.36, wide: 1.04, noEyes: true, eye: 0.8, eyeY: -0.04, brow: 0.01, noseT: 'wide', noseY: 0.44, mouthY: 0.72 };
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { boxed: true, line: -0.66, vol: 0.02, wide: 1.04 });
    if (flat) return;
    features(g, R, c, e, k);
    g.fillStyle = '#101014'; g.strokeStyle = c.out; g.lineWidth = ol; // shades
    g.beginPath(); g.roundRect(-0.6 * R, -0.26 * R, 0.68 * R, 0.4 * R, 0.1 * R); g.fill();
    g.beginPath(); g.roundRect(0.24 * R, -0.26 * R, 0.58 * R, 0.38 * R, 0.1 * R); g.fill();
    g.fillRect(-0.96 * R, -0.2 * R, 1.8 * R, 0.09 * R);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(-0.46 * R, 0.04 * R); g.lineTo(-0.3 * R, -0.2 * R); g.stroke();
    g.strokeStyle = '#d8d2c4'; g.lineWidth = ol * 1.2; // earpiece
    g.beginPath(); g.moveTo(-1.0 * R, 0.3 * R); g.bezierCurveTo(-1.2 * R, 0.6 * R, -0.9 * R, 0.9 * R, -1.1 * R, 1.3 * R); g.stroke();
  }

  function managerHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, boss = !rig.variant, k = { ol, jaw: 1.14, chin: 0.24, wide: 0.94, eye: 0.78, eyeY: 0, brow: 0.1, noseT: 'wide', noseS: 0.9, mouthY: 0.74 };
    if (boss) { // headband tails
      const w = sin(rig.t * 7) * 0.12 + rig.hair.x * 0.05;
      g.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const y1 = (-0.1 + i * 0.4 + w) * R;
        g.strokeStyle = c.out; g.lineWidth = 0.2 * R + ol * 2; g.beginPath(); g.moveTo(-0.9 * R, -0.52 * R); g.quadraticCurveTo(-1.4 * R, -0.5 * R, -1.9 * R, y1); g.stroke();
        g.strokeStyle = c.band; g.lineWidth = 0.2 * R; g.beginPath(); g.moveTo(-0.9 * R, -0.52 * R); g.quadraticCurveTo(-1.4 * R, -0.5 * R, -1.9 * R, y1); g.stroke();
      }
      g.lineCap = 'butt';
    }
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.5, vol: boss ? 0.1 : 0.04, wide: 0.94 });
    if (boss) {
      g.fillStyle = c.band; g.strokeStyle = c.out; g.lineWidth = ol * 1.4;
      g.beginPath(); g.moveTo(0.88 * R, -0.66 * R); g.quadraticCurveTo(0, -0.84 * R, -0.9 * R, -0.66 * R); g.lineTo(-0.9 * R, -0.44 * R); g.quadraticCurveTo(0, -0.62 * R, 0.88 * R, -0.44 * R); g.closePath(); g.stroke(); g.fill();
    }
    if (flat) return;
    features(g, R, c, e, k);
    if (boss) { g.strokeStyle = c.hair; g.lineWidth = 0.08 * R; g.lineCap = 'round'; g.beginPath(); g.moveTo(-0.12 * R, 0.68 * R); g.quadraticCurveTo(0.16 * R, 0.58 * R, 0.44 * R, 0.68 * R); g.stroke(); g.lineCap = 'butt'; }
  }

  const BEARD = [[-0.72, 0.52, 0.26], [-0.52, 0.82, 0.28], [-0.18, 1.0, 0.3], [0.2, 1.06, 0.3], [0.54, 0.94, 0.28], [0.76, 0.6, 0.24]];
  function crabHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.1, chin: 0.3, eye: 0.78, eyeY: -0.02, brow: 0.15, browCol: 'hair', noseT: 'wide', noseS: 1.3, mouthY: 0.72 };
    skull(g, R, c, k);
    tuft(g, BEARD, R, c, ol, c.hair);
    if (!flat) {
      const eF = rig._eF || (rig._eF = {}); Object.assign(eF, e, { lid: e.lid >= 0.95 ? 1 : 0.62 });
      k.eF = eF;
      features(g, R, c, e, k);
    }
    g.fillStyle = c.hat; g.strokeStyle = c.out; g.lineWidth = ol * 2; // flat cap
    g.beginPath(); g.moveTo(-0.98 * R, -0.42 * R); g.bezierCurveTo(-1.02 * R, -1.32 * R, 0.9 * R, -1.36 * R, 0.96 * R, -0.58 * R);
    g.lineTo(1.36 * R, -0.42 * R); g.quadraticCurveTo(0.7 * R, -0.34 * R, 0.2 * R, -0.5 * R); g.quadraticCurveTo(-0.4 * R, -0.62 * R, -0.98 * R, -0.42 * R); g.closePath(); g.stroke(); g.fill();
  }

  const BUN = [[-0.1, -1.36, 0.44], [0.2, -1.5, 0.2]];
  function gripeHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.14, chin: 0.18, wide: 0.9, eye: 0.78, eyeY: -0.02, brow: 0.05, noseT: 'wide', noseS: 0.9, mouthY: 0.72, mouthW: 0.8 };
    tuft(g, BUN, R, c, ol, c.hair);
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.58, vol: 0.04, wide: 0.9 });
    if (flat) return;
    g.fillStyle = '#d9b34a'; circ(g, -0.9 * R, 0.46 * R, 0.1 * R); g.fill();
    wrinkles(g, R, c, ol, 1.14);
    g.fillStyle = 'rgba(110,60,130,0.5)'; // eyeshadow
    g.beginPath(); g.ellipse(-0.22 * R, -0.2 * R, 0.26 * R, 0.12 * R, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.5 * R, -0.2 * R, 0.22 * R, 0.12 * R, 0, 0, TAU); g.fill();
    features(g, R, c, e, k);
    specs(g, R, c, ol, '#d9b34a', -0.02, 0.27);
  }

  const STACHE = [[-0.1, 0.62, 0.2], [0.16, 0.58, 0.2], [0.42, 0.62, 0.2], [-0.32, 0.7, 0.15], [0.62, 0.7, 0.15]];
  function pistHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.12, chin: 0.4, ear: 1.1, eye: 0.74, eyeY: -0.04, brow: 0.18, browCol: 'hair', noseT: 'wide', noseS: 1.3, noseY: 0.4, mouthY: 0.8 };
    g.save(); g.scale(1.12, 1.0);
    lobes(g, [[0.94, -0.2, 0.16]], R, 0, 0, c.hairS, 0);
    skull(g, R, c, k);
    lobes(g, [[-1.0, -0.26, 0.2], [-1.02, -0.04, 0.16]], R, 0, 0, c.hair, 0);
    if (!flat) {
      wrinkles(g, R, c, ol, 1.12);
      features(g, R, c, e, k);
      tuft(g, STACHE, R, c, ol * 0.8, c.hair);
    }
    g.restore();
  }

  // Ed Wuncler Sr.: the man who owns Woodcrest
  function wunclerHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.18, chin: 0.34, wide: 1.02, eye: 0.7, eyeY: -0.04, brow: 0.14, browCol: 'hair', noseS: 1.7, noseY: 0.46, mouthY: 0.74 };
    tuft(g, GD_FAR, R, c, ol, c.hairS);
    g.fillStyle = c.skinS; g.strokeStyle = c.out; g.lineWidth = ol * 2; g.beginPath(); g.ellipse(0.12 * R, 1.0 * R, 0.6 * R, 0.26 * R, 0, 0, TAU); g.stroke(); g.fill();
    skull(g, R, c, k);
    tuft(g, GD_NEAR, R, c, ol, c.hair);
    if (flat) return;
    wrinkles(g, R, c, ol, 1.18);
    features(g, R, c, e, k);
  }
  // Ed Wuncler III: buzz cut, do-rag energy, zero consequences
  function ed3Head(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.14, chin: 0.28, eye: 0.76, eyeY: -0.02, brow: 0.08, noseS: 1.4, noseY: 0.46, mouthY: 0.72 };
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { boxed: true, line: -0.62, vol: 0 });
    if (flat) return;
    features(g, R, c, e, k);
    g.fillStyle = c.hair; for (let i = 0; i < 6; i++) g.fillRect((-0.2 + i * 0.12) * R, (0.98 + (i % 2) * 0.05) * R, 0.05 * R, 0.05 * R); // chin scruff
  }
  // Gin Rummy: receding hairline, goatee, always explaining
  function rummyHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, k = { ol, jaw: 1.16, chin: 0.26, wide: 0.96, eye: 0.74, eyeY: -0.02, brow: 0.09, noseS: 1.5, noseY: 0.46, mouthY: 0.72 };
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.82, vol: 0.02, side: -0.2 });
    if (flat) return;
    features(g, R, c, e, k);
    g.strokeStyle = c.hair; g.lineWidth = 0.09 * R; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.1 * R, 0.68 * R); g.quadraticCurveTo(0.16 * R, 0.6 * R, 0.42 * R, 0.68 * R); g.moveTo(-0.1 * R, 0.68 * R); g.quadraticCurveTo(-0.08 * R, 1.06 * R, 0.16 * R, 1.12 * R); g.quadraticCurveTo(0.4 * R, 1.06 * R, 0.42 * R, 0.68 * R); g.stroke(); g.lineCap = 'butt';
  }
  // Bushido Brown: the afro, the sideburns, the absolute confidence
  const BB_AFRO = [[0, -0.7, 1.3, 0.5]].concat(ring(0, -0.7, 1.26, 20, 0.22));
  function bushidoHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, hx = rig.hair.x, hy = rig.hair.y, k = { ol, jaw: 1.16, chin: 0.28, eye: 0.78, eyeY: 0, brow: 0.12, noseT: 'wide', noseS: 1.0, mouthY: 0.74 };
    lobes(g, BB_AFRO, R, hx, hy, c.out, ol); lobes(g, BB_AFRO, R, hx, hy, c.hair, 0);
    skull(g, R, c, k);
    lobes(g, [[-0.5, -0.86, 0.4, 0.4], [0, -0.94, 0.44, 0.4], [0.5, -0.88, 0.4, 0.4], [-0.86, -0.3, 0.2, 0.4], [-0.84, 0.1, 0.16, 0.4], [0.84, -0.3, 0.16, 0.4]], R, hx, hy, c.hair, 0);
    if (flat) return;
    features(g, R, c, e, k);
    g.strokeStyle = c.hair; g.lineWidth = 0.1 * R; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-0.14 * R, 0.7 * R); g.quadraticCurveTo(0.16 * R, 0.6 * R, 0.46 * R, 0.7 * R); g.stroke(); g.lineCap = 'butt';
  }

  // Cristal, "like the champagne": Granddad's very new, very expensive girlfriend
  function cristalHead(g, R, c, e, rig, flat) {
    const ol = rig.ol, sw = rig.hair.x * 0.6, k = { ol, jaw: 1.1, chin: 0.16, wide: 0.9, eye: 0.88, eyeY: 0.02, brow: 0.05, noseS: 0.8, mouthY: 0.72, mouthW: 0.9 };
    g.fillStyle = c.hair; g.strokeStyle = c.out; g.lineWidth = ol * 2;
    g.beginPath(); g.moveTo(-1.0 * R, -0.5 * R); g.bezierCurveTo(-1.3 * R, 0.4 * R, -1.3 * R + sw, 1.3 * R, -0.9 * R + sw, 1.9 * R); g.lineTo(0.9 * R + sw, 1.8 * R);
    g.bezierCurveTo(1.3 * R + sw, 1.2 * R, 1.2 * R, 0.3 * R, 0.98 * R, -0.5 * R); g.closePath(); g.stroke(); g.fill();
    skull(g, R, c, k);
    hairCap(g, R, c, ol, c.hair, { line: -0.5, vol: 0.12 });
    if (flat) return;
    g.strokeStyle = c.gold; g.lineWidth = ol * 1.8; circ(g, -0.98 * R, 0.52 * R, 0.17 * R); g.stroke();
    g.fillStyle = 'rgba(150,60,140,0.5)'; g.beginPath(); g.ellipse(-0.22 * R, -0.22 * R, 0.28 * R, 0.12 * R, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.5 * R, -0.22 * R, 0.24 * R, 0.12 * R, 0, 0, TAU); g.fill();
    features(g, R, c, e, k);
    g.strokeStyle = c.out; g.lineWidth = ol; g.beginPath(); g.moveTo(-0.54 * R, -0.04 * R); g.lineTo(-0.66 * R, -0.14 * R); g.moveTo(0.78 * R, -0.04 * R); g.lineTo(0.88 * R, -0.14 * R); g.stroke();
  }

  /* -------------------------------------------------------------- the cast */
  const big = (k) => (b) => ({ wShoulder: b.wShoulder * k, wWaist: b.wWaist * (k + 0.1), rThigh: b.rThigh * k, rKnee: b.rKnee * k, rShoulder: b.rShoulder * k, rElbow: b.rElbow * k, rWrist: b.rWrist * (k * 0.94), hand: b.hand * 1.1 });

  BD.CAST = {
    huey: {
      name: 'Huey', full: 'Huey Freeman', color: '#b3262d', voice: 1.18,
      build: 'kid', idle: 'stand', portraitPose: 'armsCrossed', face: { lid: 0.2, tilt: 0.36, mouth: 'frown' },
      sleeve: 'long', hem: 10, sole: 'sock',
      colors: { skin: '#a06c48', hair: '#1d1613', hairHi: '#4d3c33', shirt: '#7c2026', shirt2: '#4d1115', pants: '#3b4a6b', shoe: '#1c1c22', sock: '#ece6d6', eye: EYE, iris: '#4a2416' },
      keep: [],
      head: hueyHead,
      outfit(g, L, ws, ww, hem, c) {
        g.strokeStyle = c.shirt2; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(ws * 0.44, -L); g.quadraticCurveTo(ws * 0.54, -L * 0.5, ws * 0.48, hem + 2); g.stroke();
        g.fillStyle = c.shirt2;
        for (let i = 0; i < 4; i++) { circ(g, ws * 0.47, -L * (0.74 - i * 0.22), 1.5); g.fill(); }
      },
      over(g, L, ws, ww, hem, c, r) { // shirt collar
        g.fillStyle = c.shirtS; g.strokeStyle = c.out; g.lineWidth = r.ol * 1.6; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(ws * 0.12, -L - 4.5); g.lineTo(ws * 0.46, -L + 6); g.lineTo(-ws * 0.34, -L + 2.5); g.closePath(); g.stroke(); g.fill();
        g.beginPath(); g.moveTo(ws * 0.5, -L - 4.5); g.lineTo(ws * 0.5, -L + 7); g.lineTo(ws * 1.02, -L + 1.5); g.closePath(); g.stroke(); g.fill();
      },
    },
    riley: {
      name: 'Riley', full: 'Riley Freeman', color: '#2e6fd0', voice: 1.5,
      build: 'kid', scale: 0.94, idle: 'stand', portraitPose: 'lean', face: { lid: 0.16, tilt: 0.2, mouth: 'smirk' },
      sleeve: 'none', hem: 14, baggy: 1.7, wrist: 'accent', sole: 'accent',
      dims: (b) => ({ wWaist: b.wWaist + 5, wShoulder: b.wShoulder + 2 }),
      colors: { skin: '#9c6843', hair: '#17110e', shirt: '#f1ede3', gold: '#e2b93f', pants: '#3d629b', shoe: '#f5f2ea', accent: '#c7352e', eye: EYE, iris: '#6a3d1c' },
      head: rileyHead,
      outfit(g, L, ws, ww, hem, c) { // tank top: scoop neck and armholes show skin
        g.fillStyle = c.skin;
        g.beginPath(); g.ellipse(ws * 0.36, -L - 3, ws * 0.44, 8, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(-ws * 1.0, -L * 0.84, ws * 0.36, L * 0.2, 0, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(ws * 1.1, -L * 0.82, ws * 0.28, L * 0.18, 0, 0, TAU); g.fill();
        g.strokeStyle = c.gold; g.lineWidth = 1.7;
        g.beginPath(); g.moveTo(-ws * 0.1, -L - 2); g.quadraticCurveTo(ws * 0.3, -L * 0.5, ws * 0.78, -L - 1); g.stroke();
        g.fillStyle = c.gold; g.beginPath(); g.roundRect(ws * 0.2, -L * 0.72, 5, 6, 1.2); g.fill();
      },
    },
    jazmine: {
      name: 'Jazmine', full: 'Jazmine DuBois', color: '#e77fa0', voice: 1.7,
      build: 'kid', scale: 0.93, face: { tilt: -0.3, brow: 0.2, mouth: 'smirk' },
      sleeve: 'short', hem: 4, legs: 'bare', sock: 'sock',
      colors: { skin: '#cfa076', hair: '#b06a34', hairHi: '#dc9a5c', shirt: '#e77fa0', pants: '#6189cc', shoe: '#f5f2ea', sock: '#f5f2ea', eye: EYE, iris: '#3f8a4a' },
      head: jazmineHead,
      skirt(g, J, c, r) {
        const w = r.b.wWaist * 0.5;
        g.save(); g.translate(J.hip[0], J.hip[1]); g.rotate(J.torsoAng * 0.4);
        g.fillStyle = c.pants; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
        g.beginPath(); g.moveTo(-w, -3); g.lineTo(w + 1, -3); g.lineTo(w + 9, 20); g.quadraticCurveTo(0, 25, -w - 8, 20); g.closePath(); g.stroke(); g.fill();
        g.restore();
      },
    },
    granddad: {
      name: 'Granddad', full: 'Robert Freeman', color: '#7c8a3d', voice: 0.72,
      build: 'adult', scale: 0.97, stoop: 0.05, face: { lid: 0.18, tilt: 0.22, mouth: 'frown' },
      sleeve: 'long', hem: 8, cuff: 'shirt2',
      colors: { skin: '#7d5137', hair: '#f0ece3', shirt: '#6f7d3c', shirt2: '#efe6cf', pants: '#7a654c', shoe: '#5b3a29', glass: '#1d1b20', eye: EYE, iris: '#6a3d1c' },
      head: granddadHead,
      outfit(g, L, ws, ww, hem, c) { // cardigan open over a cream shirt
        g.fillStyle = c.shirt2;
        g.beginPath(); g.moveTo(ws * 0.08, -L - 6); g.lineTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.66, hem + 4); g.lineTo(ws * 0.3, hem + 4); g.closePath(); g.fill();
        g.strokeStyle = c.shirtS; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(ws * 0.08, -L - 2); g.lineTo(ws * 0.3, hem + 4); g.moveTo(ws * 0.86, -L - 2); g.lineTo(ws * 0.66, hem + 4); g.stroke();
        g.fillStyle = c.shirt2S;
        for (let i = 0; i < 4; i++) { circ(g, ws * 0.48, -L * (0.8 - i * 0.22), 1.4); g.fill(); }
        g.fillStyle = '#3b2416'; g.fillRect(-ws - 4, hem - 3, ws * 2 + 20, 4);
      },
    },
    tom: {
      name: 'Tom', full: 'Tom DuBois', color: '#5a6478', voice: 0.95,
      build: 'adult', face: { tilt: -0.4, brow: 0.3 }, sleeve: 'long', hem: 13, cuff: 'shirt2',
      colors: { skin: '#8f623f', hair: '#1c1613', shirt: '#26272e', shirt2: '#f2f0ea', tie: '#2f4f9a', pants: '#26272e', shoe: '#191919', eye: EYE, iris: '#6a3d1c' },
      head: tomHead,
      outfit(g, L, ws, ww, hem, c) { suitFront(g, L, ws, c, 'tie'); },
    },
    tomP: {
      name: 'Tom?', full: 'Stinkmeaner-in-Tom', color: '#5fae4a', voice: 0.6,
      build: 'adult', possessed: true, idle: 'stance', expr: 'angry', face: { tilt: 0.5, lid: 0.1 }, sleeve: 'long', hem: 13, cuff: 'shirt2', stoop: 0.1,
      colors: { skin: '#9a8a66', hair: '#1c1613', shirt: '#343a44', shirt2: '#dfe3d2', tie: '#a3262b', pants: '#343a44', shoe: '#191919', eye: '#f4ffd0', iris: '#c8102e' },
      head: tomHead,
      outfit(g, L, ws, ww, hem, c) {
        suitFront(g, L, ws, c, null);
        g.fillStyle = c.tie; // tie yanked loose and flung over the shoulder
        g.beginPath(); g.moveTo(ws * 0.4, -L + 4); g.lineTo(ws * 0.58, -L + 3); g.lineTo(ws * 0.1, -L * 0.5); g.lineTo(-ws * 0.1, -L * 0.56); g.closePath(); g.fill();
      },
    },
    ruckus: {
      name: 'Uncle Ruckus', full: 'Uncle Ruckus (no relation)', color: '#c98a2b', voice: 0.62,
      build: 'adult', scale: 0.98, belly: 24, hem: 8, sleeve: 'long', sleeveCol: 'shirt2', face: { tilt: -0.1, mouth: 'grin' }, stoop: 0.04,
      dims: big(1.42),
      colors: (v) => (v
        ? { skin: '#4d3125', hair: '#8f8a82', shirt: '#f0ede5', shirt2: '#f0ede5', vest: '#b52b2b', tie: '#17171b', pants: '#23232b', shoe: '#161616', eye: EYE, iris: '#6a3d1c' }
        : { skin: '#4d3125', hair: '#8f8a82', shirt: '#a8707a', shirt2: '#a8707a', tee: '#f0ede5', vest: '#b52b2b', tie: '#17171b', pants: '#8a8474', shoe: '#2a221c', eye: EYE, iris: '#6a3d1c' }),
      head: ruckusHead,
      outfit(g, L, ws, ww, hem, c, r) {
        if (!r.variant) { // everyday Ruckus: dusty-rose work shirt hanging open over a white undershirt
          g.fillStyle = c.tee;
          g.beginPath(); g.moveTo(ws * 0.0, -L - 6); g.lineTo(ws * 0.9, -L - 6); g.lineTo(ws * 1.5, hem + 6); g.lineTo(ws * 0.1, hem + 6); g.closePath(); g.fill();
          g.strokeStyle = c.shirtS; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(ws * 0.0, -L - 2); g.lineTo(ws * 0.1, hem + 6); g.stroke();
          g.fillStyle = c.teeS; g.beginPath(); g.ellipse(ws * 0.8, -L * 0.2, ws * 0.5, L * 0.16, 0, 0, TAU); g.fill();
          return;
        }
        vestFront(g, L, ws, ww, c, 'vest');
        g.fillStyle = c.tie; // bow tie
        g.beginPath(); g.moveTo(ws * 0.24, -L - 1); g.lineTo(ws * 0.46, -L + 4); g.lineTo(ws * 0.24, -L + 9); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(ws * 0.68, -L - 1); g.lineTo(ws * 0.46, -L + 4); g.lineTo(ws * 0.68, -L + 9); g.closePath(); g.fill();
        g.fillStyle = '#e6c15a'; g.fillRect(-ws * 0.1, -L * 0.72, 9, 5); // name tag
      },
    },
    stink: {
      name: 'Stinkmeaner', full: 'Col. H. Stinkmeaner', color: '#6f8f3a', voice: 0.56,
      build: 'adult', scale: 0.9, stoop: 0.16, idle: 'caneLean', prop: 'cane', face: { blind: true, lid: 0.34, tilt: 0.7, mouth: 'grin' },
      sleeve: 'long', hem: 12,
      colors: { skin: '#6b4630', hair: '#c2bdb3', shirt: '#4e5c40', shirt2: '#cdbd92', pants: '#3b342d', shoe: '#1e1915', eye: '#dfe3d6', iris: '#dfe3d6', wood: '#5a3a22' },
      head: stinkHead,
      outfit(g, L, ws, ww, hem, c) {
        g.fillStyle = c.shirt2; // turtleneck under a drab blazer
        g.beginPath(); g.moveTo(ws * 0.1, -L - 6); g.lineTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.52, -L * 0.36); g.closePath(); g.fill();
        g.strokeStyle = c.shirtS; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(ws * 0.1, -L - 2); g.lineTo(ws * 0.52, -L * 0.36); g.lineTo(ws * 0.86, -L - 2); g.moveTo(ws * 0.52, -L * 0.36); g.lineTo(ws * 0.5, 16); g.stroke();
      },
    },
    stinkInk: {
      name: 'Stinkmeaner', full: 'The Blind Fury of Legend', color: '#c8102e', voice: 0.56,
      build: 'adult', scale: 0.9, stoop: 0.1, idle: 'caneLean', prop: 'blade', kasa: true, face: { blind: true, lid: 0.34, tilt: 0.7, mouth: 'grin' },
      sleeve: 'long', hem: 26, flare: 5, pelvis: 'shirt',
      dims: (b) => ({ rShoulder: b.rShoulder + 2.5, rElbow: b.rElbow + 4, rWrist: b.rWrist + 3.4 }),
      colors: { skin: '#6b4630', hair: '#c2bdb3', shirt: '#262220', sash: '#c8102e', pants: '#1c1917', shoe: '#cbb98a', hat: '#cdbb8a', eye: '#dfe3d6', iris: '#dfe3d6', wood: '#221d1a', steel: '#f6f2e8' },
      keep: ['sash'],
      head: stinkHead,
      outfit(g, L, ws, ww, hem, c) { // wrapped robe + sash
        g.strokeStyle = c.shirtS; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ws * 0.86, -L - 2); g.lineTo(ws * 0.06, -L * 0.42); g.moveTo(ws * 0.04, -L - 2); g.lineTo(ws * 0.5, -L * 0.62); g.stroke();
        g.fillStyle = c.sash; g.fillRect(-ws - 8, -L * 0.26, ws * 2 + 30, 8);
      },
    },
    slick: {
      name: 'A Pimp Named Slickback', full: 'A Pimp Named Slickback', color: '#6a2c91', voice: 1.05,
      build: 'adult', scale: 1.0, idle: 'caneLean', prop: 'cane', portraitPose: 'stand', face: { lid: 0.36, tilt: 0.2, brow: 0.2, mouth: 'smirk' },
      sleeve: 'long', hem: 14, cuff: 'shirt2',
      dims: (b) => ({ wShoulder: b.wShoulder - 2, wWaist: b.wWaist - 3 }),
      colors: { skin: '#a8754e', hair: '#1a1310', hairHi: '#5a463a', shirt: '#6a2c91', shirt2: '#e8c33a', gold: '#f2d15a', pants: '#6a2c91', shoe: '#f2f0ea', hat: '#6a2c91', band: '#e8c33a', feather: '#3fb86a', wood: '#f2f0ea', eye: EYE, iris: '#4a2416' },
      head: slickHead,
      outfit(g, L, ws, ww, hem, c) {
        suitFront(g, L, ws, c, null);
        g.strokeStyle = c.gold; g.lineWidth = 2.2; // the chain
        g.beginPath(); g.moveTo(ws * 0.2, -L - 2); g.quadraticCurveTo(ws * 0.46, -L * 0.52, ws * 0.76, -L - 1); g.stroke();
        g.fillStyle = c.gold; circ(g, ws * 0.47, -L * 0.66, 3); g.fill();
        g.fillStyle = c.shirt2; g.fillRect(-ws * 0.3, -L * 0.74, 7, 4); // pocket square
      },
    },
    wuncler: {
      name: 'Ed Wuncler', full: 'Ed Wuncler Sr.', color: '#2f4a7a', voice: 0.7,
      build: 'adult', scale: 1.0, belly: 14, sleeve: 'long', hem: 13, cuff: 'shirt2', face: { lid: 0.3, brow: 0.2, mouth: 'smirk' },
      dims: big(1.2),
      colors: { skin: '#eab99c', hair: '#e6e2d8', shirt: '#2a3550', shirt2: '#f2f0ea', tie: '#b3262d', pants: '#2a3550', shoe: '#141416', eye: EYE, iris: '#3a6fa0' },
      head: wunclerHead,
      outfit(g, L, ws, ww, hem, c) { suitFront(g, L, ws, c, 'tie'); },
    },
    ed3: {
      name: 'Ed Wuncler III', full: 'Ed Wuncler III', color: '#5a6b3a', voice: 0.9,
      build: 'adult', scale: 1.0, sleeve: 'long', hem: 12, face: { lid: 0.3, brow: 0.1, mouth: 'smirk' },
      colors: { skin: '#eac4a8', hair: '#c9a85a', shirt: '#5a6b3a', shirt2: '#f0ede5', gold: '#f2d15a', pants: '#3b3f46', shoe: '#c9a468', eye: EYE, iris: '#3a6fa0' },
      head: ed3Head,
      outfit(g, L, ws, ww, hem, c) { // army jacket over a white tee, chain
        g.fillStyle = c.shirt2; g.beginPath(); g.moveTo(ws * 0.1, -L - 6); g.lineTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.7, hem + 4); g.lineTo(ws * 0.3, hem + 4); g.closePath(); g.fill();
        g.strokeStyle = c.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(ws * 0.2, -L - 2); g.quadraticCurveTo(ws * 0.48, -L * 0.5, ws * 0.78, -L - 1); g.stroke();
      },
    },
    rummy: {
      name: 'Gin Rummy', full: 'Gin Rummy', color: '#5a4a6a', voice: 0.8,
      build: 'adult', scale: 1.02, sleeve: 'long', hem: 12, face: { lid: 0.24, tilt: 0.2, brow: 0.1 },
      colors: { skin: '#e6bfa2', hair: '#5a4030', shirt: '#3a3440', shirt2: '#1c1a20', pants: '#2a2830', shoe: '#141416', eye: EYE, iris: '#4a6a3a' },
      head: rummyHead,
      outfit(g, L, ws, ww, hem, c) { // blazer over a black turtleneck
        g.fillStyle = c.shirt2; g.beginPath(); g.moveTo(ws * 0.1, -L - 6); g.lineTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.52, -L * 0.3); g.closePath(); g.fill();
        g.strokeStyle = c.shirtS; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ws * 0.52, -L * 0.3); g.lineTo(ws * 0.5, 16); g.stroke();
      },
    },
    bushido: {
      name: 'Bushido Brown', full: 'Bushido Brown', color: '#d8a81e', voice: 0.75,
      build: 'adult', scale: 1.02, idle: 'stance', sleeve: 'long', hem: 12, flare: 2, face: { lid: 0.3, tilt: 0.4, mouth: 'smirk' },
      colors: { skin: '#7a4f33', hair: '#1a1310', shirt: '#e2b52a', shirt2: '#1c1a20', pants: '#e2b52a', shoe: '#1c1a20', eye: EYE, iris: '#4a2416' },
      head: bushidoHead,
      outfit(g, L, ws, ww, hem, c) { // yellow gi, black trim and belt
        g.strokeStyle = c.shirt2; g.lineWidth = 4;
        g.beginPath(); g.moveTo(ws * 0.9, -L - 2); g.lineTo(ws * 0.1, -L * 0.42); g.moveTo(ws * 0.04, -L - 2); g.lineTo(ws * 0.5, -L * 0.62); g.stroke();
        g.fillStyle = c.shirt2; g.fillRect(-ws - 8, -L * 0.24, ws * 2 + 30, 7);
      },
    },
    cristal: {
      name: 'Cristal', full: 'Cristal, like the champagne', color: '#c2263a', voice: 1.25,
      build: 'adult', scale: 0.92, sleeve: 'none', hem: 6, legs: 'bare', idle: 'handsHips', face: { lid: 0.3, brow: 0.3, mouth: 'smirk' },
      dims: (b) => ({ wShoulder: b.wShoulder - 7, wWaist: b.wWaist - 6, rThigh: b.rThigh - 2, rShoulder: b.rShoulder - 1.6, rElbow: b.rElbow - 1 }),
      colors: { skin: '#b07a50', hair: '#1f1512', shirt: '#c2263a', gold: '#f2d15a', pants: '#c2263a', shoe: '#c2263a', eye: EYE, iris: '#4a2416' },
      head: cristalHead,
      outfit(g, L, ws, ww, hem, c) {
        g.fillStyle = c.skin; g.beginPath(); g.ellipse(ws * 0.36, -L - 3, ws * 0.5, 9, 0, 0, TAU); g.fill();
        g.strokeStyle = c.gold; g.lineWidth = 1.8; g.beginPath(); g.moveTo(ws * 0.0, -L - 2); g.quadraticCurveTo(ws * 0.36, -L * 0.7, ws * 0.76, -L - 1); g.stroke();
      },
      skirt(g, J, c, r) {
        const w = r.b.wWaist * 0.5;
        g.save(); g.translate(J.hip[0], J.hip[1]); g.rotate(J.torsoAng * 0.4);
        g.fillStyle = c.shirt; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
        g.beginPath(); g.moveTo(-w, -4); g.lineTo(w + 1, -4); g.lineTo(w + 6, 34); g.quadraticCurveTo(0, 38, -w - 5, 34); g.closePath(); g.stroke(); g.fill();
        g.restore();
      },
    },
    guest: {
      name: 'Party Guest', color: '#8fc5b2', voice: 0.9,
      build: 'adult', sleeve: 'short', hem: 5, face: { lid: 0.3, brow: 0.3 },
      colors: (v) => [
        { skin: '#eac4a8', hair: '#d8b867', hairHi: '#f2dc9c', shirt: '#8fc5b2', knot: '#f3e9c9', pants: '#cdb88d', shoe: '#7a4a2a', eye: EYE, iris: '#3a6fa0' },
        { skin: '#f0cfb5', hair: '#a3a8b0', hairHi: '#d5d9df', shirt: '#f0b3ab', knot: '#2f4a7a', pants: '#eee9dc', shoe: '#7a4a2a', eye: EYE, iris: '#3a6fa0' },
        { skin: '#dba780', hair: '#6b4a34', hairHi: '#9a7355', shirt: '#a9c3ea', knot: '#e9d37a', pants: '#b5413a', shoe: '#2b2b2b', eye: EYE, iris: '#6a4a2a' },
      ][v % 3],
      head: guestHead,
      outfit(g, L, ws, ww, hem, c) {
        g.strokeStyle = c.shirtS; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(ws * 0.46, -L); g.lineTo(ws * 0.46, -L * 0.6); g.stroke();
        g.fillStyle = '#6b4a2a'; g.fillRect(-ws - 4, hem - 3, ws * 2 + 20, 4);
      },
      over(g, L, ws, ww, hem, c, r) { // the sweater. Tied around the shoulders. Of course.
        g.strokeStyle = c.out; g.lineWidth = 7 + r.ol * 2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-ws * 0.8, -L + 3); g.quadraticCurveTo(0, -L - 5, ws * 0.86, -L + 4); g.lineTo(ws * 0.5, -L * 0.72); g.stroke();
        g.strokeStyle = c.knot; g.lineWidth = 7;
        g.beginPath(); g.moveTo(-ws * 0.8, -L + 3); g.quadraticCurveTo(0, -L - 5, ws * 0.86, -L + 4); g.lineTo(ws * 0.5, -L * 0.72); g.stroke();
        g.strokeStyle = c.out; g.lineWidth = 6 + r.ol * 2; g.beginPath(); g.moveTo(ws * 0.5, -L * 0.72); g.lineTo(ws * 0.3, -L * 0.5); g.moveTo(ws * 0.5, -L * 0.72); g.lineTo(ws * 0.76, -L * 0.5); g.stroke();
        g.strokeStyle = c.knot; g.lineWidth = 6; g.beginPath(); g.moveTo(ws * 0.5, -L * 0.72); g.lineTo(ws * 0.3, -L * 0.5); g.moveTo(ws * 0.5, -L * 0.72); g.lineTo(ws * 0.76, -L * 0.5); g.stroke();
        g.lineCap = 'butt';
      },
    },
    tux: {
      name: 'Party Guest', color: '#2a2a30', voice: 0.82, monocle: true,
      build: 'adult', sleeve: 'long', hem: 13, cuff: 'shirt2', face: { lid: 0.34, brow: 0.36 },
      colors: (v) => [
        { skin: '#eccab0', hair: '#c9c4ba', hairHi: '#eeeae2', shirt: '#22232b', shirt2: '#f2f0ea', tie: '#16161a', pants: '#22232b', shoe: '#121214', eye: EYE, iris: '#3a6fa0' },
        { skin: '#e3b592', hair: '#3a2b22', hairHi: '#6a5244', shirt: '#eee8d8', shirt2: '#f7f5ef', tie: '#7a1f24', pants: '#22232b', shoe: '#121214', eye: EYE, iris: '#6a4a2a' },
      ][v % 2],
      head: guestHead,
      outfit(g, L, ws, ww, hem, c) { suitFront(g, L, ws, c, 'tie', true); },
    },
    guard: {
      name: 'Security', full: 'Wuncler Estate Security', color: '#3d3d46', voice: 0.6,
      build: 'adult', scale: 1.08, sleeve: 'long', hem: 13, belly: 4, idle: 'stand', face: { mouth: 'frown' },
      dims: big(1.26),
      colors: { skin: '#c9966f', hair: '#2a211b', shirt: '#1f2026', shirt2: '#f2f0ea', tie: '#1a1a1e', pants: '#1f2026', shoe: '#101012', eye: EYE, iris: '#6a3d1c' },
      head: guardHead,
      outfit(g, L, ws, ww, hem, c) { suitFront(g, L, ws, c, 'tie'); },
    },
    manager: {
      name: 'Night Manager', full: 'The Night Manager', color: '#a8262c', voice: 0.88,
      build: 'adult', scale: 0.98, sleeve: 'long', sleeveCol: 'shirt2', hem: 6, idle: 'stand', face: { tilt: 0.3, lid: 0.2 },
      dims: (b) => ({ wShoulder: b.wShoulder - 3, wWaist: b.wWaist - 3 }),
      colors: (v) => (v
        ? { skin: '#e2b592', hair: '#a8522a', shirt: '#f0ede6', shirt2: '#f0ede6', vest: '#a8262c', band: '#f2f0ea', pants: '#1f1f26', shoe: '#141416', eye: EYE, iris: '#6a4a2a' }
        : { skin: '#c08a5e', hair: '#201a17', shirt: '#f0ede6', shirt2: '#f0ede6', vest: '#a8262c', band: '#f2f0ea', pants: '#1f1f26', shoe: '#141416', eye: EYE, iris: '#6a3d1c' }),
      head: managerHead,
      outfit(g, L, ws, ww, hem, c) { vestFront(g, L, ws, ww, c, 'vest'); g.fillStyle = '#e6c15a'; g.fillRect(-ws * 0.1, -L * 0.72, 8, 4.5); },
    },
    crab: {
      name: 'Crabmiser', full: 'Lord Rufus Crabmiser', color: '#c9a23a', voice: 0.6,
      build: 'adult', scale: 0.93, belly: 8, stoop: 0.08, sleeve: 'long', hem: 18, flare: 3, prop: 'trap', idle: 'hold', face: { tilt: 0.5, lid: 0.2, mouth: 'frown' },
      dims: big(1.14),
      colors: { skin: '#6a452f', hair: '#cbc7bd', shirt: '#cfa63a', shirt2: '#8a6a1e', hat: '#3b4048', pants: '#3b4048', shoe: '#2a2a1e', eye: EYE, iris: '#6a3d1c' },
      head: crabHead,
      outfit(g, L, ws, ww, hem, c) { // fisherman's slicker with toggles
        g.strokeStyle = c.shirt2; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(ws * 0.46, -L - 4); g.lineTo(ws * 0.5, hem + 4); g.stroke();
        g.fillStyle = c.shirt2; for (let i = 0; i < 3; i++) g.fillRect(ws * 0.3, -L * (0.74 - i * 0.26), ws * 0.36, 3.2);
      },
    },
    gripe: {
      name: 'Gripenasty', full: 'Lady Esmeralda Gripenasty', color: '#7a3d8a', voice: 0.98,
      build: 'adult', scale: 0.88, sleeve: 'long', hem: 6, idle: 'stand', face: { tilt: 0.45, lid: 0.3, mouth: 'frown' },
      dims: (b) => ({ wShoulder: b.wShoulder - 6, wWaist: b.wWaist - 5, rThigh: b.rThigh - 2, rShoulder: b.rShoulder - 1.4 }),
      colors: { skin: '#7a5139', hair: '#d9d4ca', shirt: '#6a3d7a', pearl: '#f3ecdc', shawl: '#d9c9a8', pants: '#3a2a40', shoe: '#232327', eye: EYE, iris: '#6a3d1c' },
      head: gripeHead,
      outfit(g, L, ws, ww, hem, c) {
        g.strokeStyle = c.pearl; g.lineWidth = 2.6; g.setLineDash([2.6, 1.6]);
        g.beginPath(); g.moveTo(-ws * 0.1, -L - 2); g.quadraticCurveTo(ws * 0.36, -L * 0.62, ws * 0.8, -L - 1); g.stroke(); g.setLineDash([]);
      },
      skirt(g, J, c, r) {
        const w = r.b.wWaist * 0.5;
        g.save(); g.translate(J.hip[0], J.hip[1]); g.rotate(J.torsoAng * 0.4);
        g.fillStyle = c.shirt; g.strokeStyle = c.out; g.lineWidth = r.ol * 2;
        g.beginPath(); g.moveTo(-w, -4); g.lineTo(w + 1, -4); g.lineTo(w + 13, 44); g.quadraticCurveTo(0, 50, -w - 12, 44); g.closePath(); g.stroke(); g.fill();
        g.restore();
      },
    },
    pist: {
      name: 'Pistofferson', full: 'Mr. George Pistofferson', color: '#7a2a22', voice: 0.5,
      build: 'adult', scale: 1.06, belly: 14, sleeve: 'long', hem: 6, idle: 'stand', face: { tilt: 0.6, lid: 0.26, mouth: 'frown' },
      dims: big(1.4),
      colors: { skin: '#5a3a28', hair: '#d6d1c7', shirt: '#e9e3d3', brace: '#7a2a22', pants: '#4a4238', shoe: '#1b1713', eye: EYE, iris: '#6a3d1c' },
      head: pistHead,
      outfit(g, L, ws, ww, hem, c) { // suspenders + bow tie
        g.strokeStyle = c.brace; g.lineWidth = 5;
        g.beginPath(); g.moveTo(ws * 0.1, -L - 6); g.lineTo(ws * 0.2, hem + 6); g.moveTo(ws * 0.86, -L - 6); g.lineTo(ws * 0.9, hem + 6); g.stroke();
        g.fillStyle = c.brace;
        g.beginPath(); g.moveTo(ws * 0.3, -L); g.lineTo(ws * 0.5, -L + 4); g.lineTo(ws * 0.3, -L + 8); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(ws * 0.7, -L); g.lineTo(ws * 0.5, -L + 4); g.lineTo(ws * 0.7, -L + 8); g.closePath(); g.fill();
      },
    },
  };
})();
