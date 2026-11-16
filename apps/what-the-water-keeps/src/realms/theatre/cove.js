// The theatre of leaves: THE COVE (stage 2, "the place, its light and its water"; docs/build/theatre/2-light.md).
//
// The cove carries the ceiling from the cornice over the fifth tier (19.6 m) up and in to the dome's ring (26 m): from the
// horseshoe of the house to a circle. It fills the top of every picture taken in the house, and for a long way toward the
// stage it is the ceiling. It was one plain plaster surface with twelve flat discs on it. It is now what a painted
// ceiling's cove is:
//
//   the painting   the dome's painted sky carried on down the cove, in faded distemper: cloud in pearl and grey-rose over
//                  blue-green, darker with a hundred years of candle soot toward the cornice, stained where the tear has
//                  let the rain in, flaked to bare plaster in patches. (The house's own picture, art/theatre/dome.webp,
//                  laid four times round, mirrored so that it closes; no new picture.)
//   twelve ribs    the dome's twelve gilt ribs carried on down to the cornice, each a moulded band that broadens to a foot
//                  (the same section as the dome's, so that they run on in one line). The tear has taken what it has taken.
//   a frieze       a gilt bead above the cornice, and painted lines that panel the sky between the ribs
//   round windows  twelve, 1.6 m across, between the ribs (they stood under the ribs' feet): leaded glass that holds a
//                  little of the night, rain running down it, in a moulded gilt frame with a painted wreath round it
//
// It wears the house's paint, so the moon reaches it from the tear and, kindled, the top tier's candles light it from
// below (light.js: the cove's wash, strongest at its foot over each bracket and dying upward).
// Built in code: it is a surface swept between two curves that only the plan knows. About 9,000 triangles, 4 draws.
// Developer switches: &cove=0 the first round's plain cove (set.js); &skip=cove none at all.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { NOISE_GLSL } from '../../engine/kit.js';
import { at, house, grid, dev } from './lib.js';

const GILT = '#A8843F', GILT_HI = '#C29C50';
// the dome's rib, as source-art/models/theatre/dome.py has it: metres across, metres proud, and the paint of each facet
const RIB = [[-0.32, 0.0, '#3d4a34'], [-0.32, 0.05, '#5d5a30'], [-0.26, 0.10, GILT], [-0.20, 0.08, '#6C6A3C'], [-0.13, 0.17, GILT], [-0.05, 0.23, GILT_HI],
  [0.05, 0.23, GILT_HI], [0.13, 0.17, GILT], [0.20, 0.08, '#6C6A3C'], [0.26, 0.10, GILT], [0.32, 0.05, '#5d5a30'], [0.32, 0.0, '#3d4a34']];
const BEAD = [[-0.11, 0.0, '#3d4a34'], [-0.09, 0.06, '#6C6A3C'], [-0.03, 0.11, GILT_HI], [0.03, 0.11, GILT], [0.09, 0.06, '#6C6A3C'], [0.11, 0.0, '#3d4a34']];

/**
 * A moulding swept along a path. path: [{ p: Vector3, a: Vector3 (the way the section's width runs), b: Vector3 (the way it
 * stands proud), k: scale of the section there }]; section: [[across, proud, colour], ...]. Position, normal, uv, colour.
 */
function sweep(path, section) {
  const n = section.length, pos = [], col = [], uv = [], idx = [], c = new THREE.Color(), v = new THREE.Vector3();
  let run = 0;
  path.forEach((q, j) => {
    if (j) run += q.p.distanceTo(path[j - 1].p);
    for (let i = 0; i < n; i++) {
      const [x, h, hex] = section[i], k = q.k ?? 1;
      v.copy(q.p).addScaledVector(q.a, x * k).addScaledVector(q.b, h * k);
      pos.push(v.x, v.y, v.z); c.set(hex); col.push(c.r, c.g, c.b); uv.push(i / (n - 1), run);
    }
    if (j) for (let i = 0; i < n - 1; i++) { const e = (j - 1) * n + i, f = e + 1, g = e + n, h2 = g + 1; idx.push(e, g, f, f, g, h2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}

export async function build(ctx, plan, shared) {
  if (dev.get('cove') === '0' || !dev.second) return {};                   // (the first round's cove is in set.js)
  const { kit } = ctx, H = house(ctx, plan, shared);
  const D = plan.dome, R = D.radius, y0 = plan.cove[0], y1 = plan.cove[1];
  const V = (s, d, y) => at(ctx, s, d, y);

  // ---- the two curves: the horseshoe a hand's breadth inside the top tier's front, closed across the proscenium; and the dome's ring
  const outline = plan.tierLine(5, 0.55)[0].map((p) => ({ s: p.s + p.ns * 0.45, d: p.d + p.nd * 0.45 }));
  { const pr = plan.proscenium.s[0], a = outline.at(-1), b = outline[0]; for (let i = 1; i < 48; i++) outline.push({ s: pr, d: a.d + (b.d - a.d) * i / 48 }); outline.push({ ...b }); }
  const rel = outline.map((p) => [p.s - D.s, p.d - D.d]);
  /** How far the horseshoe stands from the dome's centre along azimuth phi (0 looks at the stage, +90 degrees to the right). */
  const reach = (phi) => {
    const cx = Math.cos(phi), cy = Math.sin(phi); let best = Infinity;
    for (let i = 0; i < rel.length - 1; i++) {
      const [ax, ay] = rel[i], ex = rel[i + 1][0] - ax, ey = rel[i + 1][1] - ay, den = cx * ey - cy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = (ax * ey - ay * ex) / den, w = (ax * cy - ay * cx) / den;
      if (t > 0 && w >= -1e-6 && w <= 1 + 1e-6 && t < best) best = t;
    }
    return best;
  };
  /** A point of the cove: azimuth phi about the dome's centre, u from 0 (the cornice) to 1 (the ring). */
  const coveSD = (phi, u) => { const L = reach(phi), r = L + (R - L) * (1 - Math.cos(u * Math.PI / 2)); return { s: D.s + Math.cos(phi) * r, d: D.d + Math.sin(phi) * r, y: y0 + (y1 - y0) * Math.sin(u * Math.PI / 2) }; };
  const coveAt = (phi, u, out = new THREE.Vector3()) => { const q = coveSD(phi, u); return at(ctx, q.s, q.d, q.y, out); };
  /** The cove's frame there: along (toward the ring), round (the way the azimuth grows), into (out of the surface, into the room). */
  const frameAt = (phi, u) => {
    const e = 0.004, along = coveAt(phi, Math.min(1, u + e)).sub(coveAt(phi, Math.max(0, u - e))).normalize();
    const round = coveAt(phi + e, u).sub(coveAt(phi - e, u)).normalize();
    const into = new THREE.Vector3().crossVectors(along, round).normalize();
    const p = coveAt(phi, u);
    if (into.dot(V(D.s, D.d, p.y - 8).sub(p)) < 0) into.negate();
    return { p, along, round, into };
  };
  const inTear = (phi, u, pad = 0) => { const q = coveSD(phi, u); return plan.inTear(q.s, q.d) || (pad > 0 && (plan.inTear(q.s + pad, q.d) || plan.inTear(q.s - pad, q.d) || plan.inTear(q.s, q.d + pad) || plan.inTear(q.s, q.d - pad))); };

  // ---- the surface itself (as the first round swept it, a little finer up the curve), where the tear has left it
  let skyTex = null;
  try { skyTex = await ctx.tex('art/theatre/dome.webp'); } catch (err) { console.warn('theatre/cove: the ceiling painting did not load; the cove is plain plaster'); }
  const rows = [];
  for (let j = 0; j <= 20; j++) {
    const u = j / 20, hz = 1 - Math.cos(u * Math.PI / 2), y = y0 + (y1 - y0) * Math.sin(u * Math.PI / 2);
    rows.push(outline.map((p) => { const l = Math.hypot(p.s - D.s, p.d - D.d) || 1, rs = D.s + (p.s - D.s) / l * R, rd = D.d + (p.d - D.d) / l * R; return V(p.s + (rs - p.s) * hz, p.d + (rd - p.d) * hz, y); }));
  }
  const surface = grid(rows, (c) => { const q = ctx.path.locate(c.x, c.z); return !plan.inTear(q.s, q.d); });
  const centre = V(D.s, D.d, 0), tearAt = V(plan.tear.s, plan.tear.d, 0);
  const painting = {
    uniforms: { tCoveSky: { value: skyTex }, uCoveC: { value: new THREE.Vector4(centre.x, centre.z, tearAt.x, tearAt.z) }, uCoveH: { value: new THREE.Vector4(y0, y1 - y0, plan.tear.r, skyTex ? 1 : 0) } },
    fragmentPars: /* glsl */`uniform sampler2D tCoveSky; uniform vec4 uCoveC, uCoveH; ${NOISE_GLSL}`,
    albedo: /* glsl */`
    { // ---- the cove's painting (src/realms/theatre/cove.js)
      vec2 cq = vWPos.xz - uCoveC.xy;                                       // from the dome's centre: x is the page's d, z its -s
      float cRad = length(cq);
      // the azimuth, 0 toward the stage, growing to the right; the turn is taken where a rib stands, so its seam is under the rib
      vec2 cr = vec2(cq.x * 0.9659 - (-cq.y) * 0.2588, cq.x * 0.2588 + (-cq.y) * 0.9659);       // turned 15 degrees
      float cphi = atan(cr.x, cr.y) + 0.2618;
      float cu = asin(clamp((vWPos.y - uCoveH.x) / uCoveH.y, 0.0, 1.0)) / 1.5708;                 // 0 at the cornice .. 1 at the ring
      float cpan = (cphi - 0.2618) / 0.5236, ca = fract(cpan) * 2.0 - 1.0, cid = floor(cpan);     // a panel between two ribs: -1 .. 1 across it
      float cHalf = 0.2618 * cRad;                                          // metres from a panel's middle to the middle of its rib
      // the sky, four times round the house, mirrored so that it closes; it climbs a third of the picture
      vec2 cuv = vec2(cphi / 6.2832 * 4.0 + 0.13, cu * 0.34 + 0.05);
      cuv = abs(fract(cuv * 0.5) * 2.0 - 1.0);
      vec3 cSky = uCoveH.w > 0.5 ? texture2D(tCoveSky, cuv).rgb : mix(vec3(0.16, 0.30, 0.32), vec3(0.74, 0.76, 0.72), smoothstep(0.42, 0.6, fbm(vec2(cphi * 6.0, cu * 3.0))));
      // a hundred years of candles: sooted toward the cornice, most over the brackets' rise; old distemper gone a little green
      float cSoot = mix(0.36, 1.0, smoothstep(0.0, 0.6, cu)) * (0.86 + 0.28 * fbm(vec2(cphi * 9.0, cu * 2.2 + 4.0)));
      vec3 cPaint = mix(cSky, vec3(dot(cSky, vec3(0.3, 0.55, 0.15))) * vec3(0.86, 1.0, 0.96), 0.22) * cSoot;
      // where the tear let the rain in: wet and dark for a metre from the broken edge, and long stains running down from it
      float cTear = length(vWPos.xz - uCoveC.zw) - uCoveH.z;
      float cRun = smoothstep(0.55, 0.8, vnoise(vec2(cphi * 37.0, 3.0))) * smoothstep(9.0, 0.5, cTear);
      cPaint *= 1.0 - 0.5 * smoothstep(2.2, 0.2, cTear) - 0.3 * cRun * (0.5 + 0.5 * vnoise(vec2(cphi * 90.0, cu * 6.0)));
      cPaint = mix(cPaint, cPaint * vec3(0.8, 1.0, 0.86), 0.5 * smoothstep(6.0, 0.5, cTear));
      // flaked to bare plaster in patches, hair cracks
      float cFl = smoothstep(0.66, 0.70, fbm(vec2(cphi * 7.0, cu * 4.0) + 17.0)) * smoothstep(0.1, 0.3, cu);
      cPaint = mix(cPaint, vec3(0.52, 0.50, 0.45) * cSoot, cFl * 0.8);
      float cCr = abs(vnoise(vec2(cphi * 13.0, cu * 5.0) + 3.0) - 0.5);
      cPaint *= 1.0 - 0.35 * smoothstep(0.012, 0.003, cCr) * step(0.45, vnoise(vec2(cphi * 3.0, cu * 1.3) + 7.0));
      // the painted panel: a gilt line and a dark one a hand's breadth inside each rib and along the foot and the head
      float cEdge = min((1.0 - abs(ca)) * cHalf - 0.62, min(cu - 0.045, 0.955 - cu) * 10.2);       // metres inside the panel's frame
      float cLine = smoothstep(0.0, 0.03, cEdge) * (1.0 - smoothstep(0.13, 0.16, cEdge));
      float cLine2 = smoothstep(0.24, 0.26, cEdge) * (1.0 - smoothstep(0.30, 0.32, cEdge));
      vec3 cOchre = vec3(0.50, 0.37, 0.14) * (0.75 + 0.5 * vnoise(vWPos.xz * 3.0 + vWPos.y * 2.0));
      cPaint = mix(cPaint, cOchre * cSoot * 1.25, cLine * 0.85);
      cPaint = mix(cPaint, cPaint * 0.45, cLine2 * 0.7);
      cPaint *= mix(0.62, 1.0, smoothstep(-0.05, 0.02, cEdge));                                   // outside the frame, under the rib's shade, the ground colour
      // a painted wreath round each window (the window stands in the middle of its panel, 22.5 m up)
      float cWr = length(vec2(ca * cHalf, (cu - 0.2985) * 10.2)), cTh = atan(ca * cHalf, (cu - 0.2985) * 10.2);
      float cWreath = smoothstep(1.18, 1.26, cWr) * (1.0 - smoothstep(1.52, 1.6, cWr)) * (0.55 + 0.45 * sin(cTh * 18.0 + sin(cWr * 20.0)));
      cPaint = mix(cPaint, cOchre * cSoot * mix(0.7, 1.5, step(0.0, sin(cTh * 18.0))), cWreath * 0.75);
      albedo = cPaint;
    }`,
  };
  // (second look: the painting takes a third of the top tier's candle wash, not all of it: a painted sky under amber is brown, and the key painting's ceiling is the
  // cool half of the picture. Its ribs and bead, which are gilt, take it whole. The night's own light on it is the house's: light.js, THE HIGH ROOM.)
  const coveMat = H.paint('sky', { color: '#ffffff', side: THREE.DoubleSide, wake: false, take: [0, 0.35, 1.6, 3.5], keep: [0.6, 1, 0.22, 0.04], brush: 0.8, extend: painting });
  const cove = new THREE.Mesh(surface, coveMat); cove.name = 'cove'; cove.frustumCulled = false; ctx.add(cove);

  // ---- twelve ribs, from the cornice to the feet of the dome's; and a gilt bead above the cornice
  const parts = [];
  for (let k = 0; k < 12; k++) {
    const phi = (15 + 30 * k) * Math.PI / 180;
    let run = [];
    const flush = () => { if (run.length > 2) parts.push(sweep(run, RIB)); run = []; };
    for (let j = 0; j <= 28; j++) {
      const u = j / 28;
      if (inTear(phi, u, 0.3)) { flush(); continue; }
      const f = frameAt(phi, u), foot = 1 + 0.75 * Math.pow(Math.max(0, 1 - u / 0.11), 1.6);      // it broadens to a foot on the cornice
      run.push({ p: f.p.addScaledVector(f.into, -0.02), a: f.round, b: f.into, k: foot });
    }
    flush();
  }
  { // the bead: all the way round, a hand above the cornice, broken where the tear is
    let run = [];
    const flush = () => { if (run.length > 2) parts.push(sweep(run, BEAD)); run = []; };
    for (let j = 0; j <= 360; j++) {
      const phi = j / 360 * Math.PI * 2, u = 0.035;
      if (inTear(phi, u, 0.3)) { flush(); continue; }
      const f = frameAt(phi, u);
      run.push({ p: f.p.addScaledVector(f.into, -0.02), a: f.along, b: f.into, k: 1 });
    }
    flush();
  }
  const giltMat = H.paint('giltHigh', { color: '#ffffff', vertexColors: true, wake: false, side: THREE.DoubleSide, brush: 0.5, take: [0, 1, 1.3, 3], keep: [0.3, 1, 0.6, 0.8] });
  const ribs = new THREE.Mesh(mergeGeometries(parts, false), giltMat); ribs.name = 'cove ribs and bead'; ribs.frustumCulled = false; ctx.add(ribs);
  for (const g of parts) g.dispose();

  // ---- twelve round windows between the ribs: a moulded gilt frame, and leaded glass with the rain running down it
  const W = plan.windows, uW = Math.asin((W.y - y0) / (y1 - y0)) / (Math.PI / 2), items = [], m = new THREE.Matrix4(), e = new THREE.Euler();
  for (let i = 0; i < W.n; i++) {
    const phi = i * Math.PI / 6;
    if (inTear(phi, uW, 1.6) || inTear(phi, Math.min(1, uW + 0.2), 0.5)) continue;
    const f = frameAt(phi, uW), up = f.along.clone();
    // its own axes: z out of the room (the glass was made to look that way), y up the cove
    const z = f.into.clone().negate(), x = new THREE.Vector3().crossVectors(up, z).normalize(), y = new THREE.Vector3().crossVectors(z, x);
    e.setFromRotationMatrix(m.makeBasis(x, y, z));
    items.push({ position: f.p.clone().addScaledVector(f.into, 0.05), rotation: [e.x, e.y, e.z] });
  }
  const frameGeo = new THREE.LatheGeometry([[0.74, -0.03], [0.80, 0.07], [0.88, 0.15], [0.96, 0.12], [1.02, 0.17], [1.10, 0.10], [1.16, -0.16]].map(([r, h]) => new THREE.Vector2(r, h)), 40);
  frameGeo.rotateX(-Math.PI / 2);                                           // its axis out of the room: the moulding stands into it
  { const p = frameGeo.attributes.position, colr = [], c = new THREE.Color(); for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); c.set(r < 0.78 || r > 1.12 ? '#3d4a34' : r < 0.9 || (r > 0.99 && r < 1.05) ? GILT_HI : '#6C6A3C'); colr.push(c.r, c.g, c.b); } frameGeo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); }
  const frames = kit.instances(frameGeo, giltMat, items); frames.name = 'round windows (frames)';
  const oculus = H.paint({ color: '#8fa0a0', side: THREE.DoubleSide, take: [0, 0.4, 0.4, 0.4], keep: [0.3, 0.7, 0.7, 0.3], brush: 0.5, extend: {
    uniforms: { uOculus: { value: 0.13 } },
    fragmentPars: `uniform float uOculus; ${NOISE_GLSL}`,
    albedo: /* glsl */`
      vec2 ocQ = vUv0 * 2.0 - 1.0; float ocR = length(ocQ), ocA = atan(ocQ.y, ocQ.x);
      float ocLead = max(max(smoothstep(0.05, 0.022, abs(sin(ocA * 4.0)) * ocR) * step(0.30, ocR), smoothstep(0.04, 0.016, abs(ocR - 0.31))), smoothstep(0.035, 0.014, abs(ocR - 0.66)));
      float ocRain = vnoise(vec2(ocQ.x * 26.0, ocQ.y * 2.2 + uTime * 0.11)) * 0.6 + vnoise(vec2(ocQ.x * 61.0 + 3.0, ocQ.y * 5.0 + uTime * 0.23)) * 0.4;
      float ocPane = 0.8 + 0.4 * hash21(floor(vec2(ocA * 1.2732 + 0.5, ocR * 2.9)));              // every pane its own tone
      float ocGlass = (1.0 - ocLead) * (0.42 + 0.58 * smoothstep(-0.9, 0.9, ocQ.y)) * (0.62 + 0.55 * ocRain) * ocPane;
      albedo = mix(albedo * (0.35 + 0.3 * ocRain) * ocPane, vec3(0.10, 0.09, 0.06), ocLead * 0.9);`,
    light: 'glow += vec3(0.60, 0.72, 0.70) * (ocGlass * uOculus);',
  } });
  const glass = kit.instances(new THREE.CircleGeometry(0.8, 28), oculus, items.map((it) => ({ ...it, position: it.position.clone() })));
  glass.name = 'round windows';
  shared.cove = { mesh: cove, ribs, frames, glass, windows: items.map((it) => it.position.clone()) };
  return {};
}
