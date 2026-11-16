// The landing: the Pilings group's kit (stage 2c). docs/art/landing.md, section 3 (the close band; the last straight)
// and section 9 (kit pieces); the log is docs/build/landing/2-kit-pilings.md.
//
//   wicker     the eel traps (eel_trap_a, _b, _c): nine hanging on cords from crooks lashed to the bridge rail, each on a
//              pendulum of its own (shared.kit.trapSwing: the cast kicks it); five stacked 3 and 2 on the staithe; two on the jetty
//   reed       the reed bundles (reed_bundle_a, _b, _c, _far: 34 of them) and the three low ricks on the hard (low_rick)
//   timber     the piled banks of the last straight (piling_left / _right: 13 piles a bank, every one its own;
//              revetment_left / _right: boards, waling, bolts, fenders, the ladder, a stump, wrack), their plain run on
//              beyond the door (revetment_run, piling_a / _b / _c), the gate masts and the four far pairs (gate_masts,
//              far_mast) with their lines, the twenty withies (withy_a, _b, _c)
//   fittings   what is rope, iron, bark or earth on all of these, and every thin thing
//
// HOW IT IS DRAWN. Every model is loaded once (kit.model: the ride's loader and its conventions), taken straight out
// of the realm again, and its copies are laid, each with its own place, turn, lean, scale and tint, into ONE mesh per
// stuff: 'landing:wicker', 'landing:reed', 'landing:timber', 'landing:fittings'. Four draw calls for the whole group,
// where the stand-ins it replaced were five. A copy's paint is the model's vertex paint times its tint, under the
// area's own paint for that stuff (shared.landing.wear: the tile along every member, the shade, the rim; the wet band
// on timber). Thin parts (a model's slots `rod` and `line`: ribs, hoops, cords, twine, lashings, wrack) carry a mark
// (aThin) and are drawn as lines, out of the painter's filter, from a few metres off. The two banks are built whole in
// "bank space" (source-art/models/landing/palisade.py) and laid along the path by a rule (bankMap), not a matrix.
//
// The stand-ins this module takes out (removeStandIn; all five are out, and their lines may be deleted):
//   'eel traps', 'trap cords', 'reed bundles', 'kit timbers' (kit.js);  'gate_masts' (heroes_b.js)
// What it publishes: shared.kit.traps [{ d, top, at, i, cord, kind }], .trapSwing { kick(i, degrees, seconds), turn, sway },
//   .bundles (the mesh; .list of { at, head, kind, where }), .pilings { '-1': [tops], '1': [tops] }, .piles, .fenders,
//   .ladder, .withies [tops], .timbers (the mesh); shared.heroes.gate { lineY(d), sheaves, mesh }.
//
// Developer switches: &kp=0 leaves the whole module out (the same as &skip=kit_pilings); &kpno=wicker,reed builds a
//   stuff but does not draw it (what each costs); &kpcrisp=0 draws the thin parts as paint (to compare); &kpkick=1
//   kicks every hanging trap at 2 s, as the swifts will; &kpw=1.6 &kpgrain=0.75 &kpin=0.7 are the wicker's three
//   numbers (the tint of the traps that lie in shade, the tile's strength, the dark of a trap's inside).
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const lerp = (a, b, t) => a + (b - a) * t;
const THIN = { rod: 1, line: 1 };
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Color();

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, P = plan, L = shared.landing, B = P.bridge;
  const QS = new URLSearchParams(location.search);
  if (QS.get('kp') === '0') return {};
  const K = shared.kit || (shared.kit = {});
  const counts = shared.counts || (shared.counts = {});
  const A = (s, d, y = 0) => P.at(path, s, d, y);
  const V3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const UP = new THREE.Vector3(0, 1, 0);

  // ============================================================================================ models, as arrays
  /** The matrix of an object inside a loaded model (the model's group itself is left out: it stands at the origin). */
  const within = (o, root) => { const m = new THREE.Matrix4(); for (let q = o; q && q !== root; q = q.parent) m.premultiply(q.matrix); return m; };
  /**
   * Load a model for laying: { parts: [{ slot, n, pos, nor, col, grain, heart, index }], points: { name: Vector3 },
   * triangles }, all in the model's own space as the ride sees it (Blender's (x, y, z) is (x, z, -y)). kind: the stuff
   * it is mostly made of ('wicker' | 'reed' | 'timber' | 'plain'): the area's paint works out which way every member
   * of it runs (shared.landing.grain), and that travels with every copy. flexOf(x, y, z, slot) -> 0..1: how freely
   * that point of the model moves in the wind (the plumes left on a bundle, a withy's sprig): windExt below.
   */
  const load = async (name, kind = 'plain', flexOf = null) => {
    const wear = L.wear ? L.wear(kind) : {};
    const m = await kit.model(`models/landing/${name}.glb`, { position: [0, 0, 0], ...wear });
    if (L.grain) L.grain(m);
    ctx.group.remove(m.group);
    const parts = [], points = {};
    m.group.traverse((o) => {
      if (o !== m.group && o.name && !o.isMesh && o.children.length === 0) points[o.name] = new THREE.Vector3().applyMatrix4(within(o, m.group));
      if (!o.isMesh) return;
      const g = o.geometry, n = g.attributes.position.count, mat = within(o, m.group), nm = new THREE.Matrix3().getNormalMatrix(mat);
      const Pa = g.attributes.position, Na = g.attributes.normal, Ca = g.attributes.color, Ga = g.attributes.aLGrain, Ha = g.attributes.aLHeart;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3).fill(1);
      const grain = Ga ? new Float32Array(n * 4) : null, heart = Ha ? new Float32Array(n * 3) : null;
      for (let i = 0; i < n; i++) {
        _v.fromBufferAttribute(Pa, i).applyMatrix4(mat); pos[i * 3] = _v.x; pos[i * 3 + 1] = _v.y; pos[i * 3 + 2] = _v.z;
        _v.fromBufferAttribute(Na, i).applyMatrix3(nm).normalize(); nor[i * 3] = _v.x; nor[i * 3 + 1] = _v.y; nor[i * 3 + 2] = _v.z;
        if (Ca) { col[i * 3] = Ca.getX(i); col[i * 3 + 1] = Ca.getY(i); col[i * 3 + 2] = Ca.getZ(i); }
        if (grain) { _v.set(Ga.getX(i), Ga.getY(i), Ga.getZ(i)).transformDirection(mat); const known = Ga.getX(i) ** 2 + Ga.getY(i) ** 2 + Ga.getZ(i) ** 2 > 0.25;
          grain[i * 4] = known ? _v.x : 0; grain[i * 4 + 1] = known ? _v.y : 0; grain[i * 4 + 2] = known ? _v.z : 0; grain[i * 4 + 3] = Ga.getW(i); }
        if (heart) { _v.fromBufferAttribute(Ha, i).applyMatrix4(mat); heart[i * 3] = _v.x; heart[i * 3 + 1] = _v.y; heart[i * 3 + 2] = _v.z; }
      }
      const index = g.index ? Uint32Array.from(g.index.array) : Uint32Array.from({ length: n }, (_, i) => i);
      const slot = o.userData.slot || 'paint';
      let flex = null;
      if (flexOf) { flex = new Float32Array(n); for (let i = 0; i < n; i++) flex[i] = Math.min(1, Math.max(0, flexOf(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], slot))); }
      parts.push({ slot, n, pos, nor, col, grain, heart, flex, index });
    });
    for (const k in m.materials) m.materials[k].dispose();
    return { name, parts, points, triangles: m.triangles };
  };

  // ============================================================================================ a stuff: one mesh of many copies
  const stuff = (name) => {
    const chunks = [], S = { name, copies: 0 };
    /**
     * Lay one part. matrix: where (null = as given); o: tint (a colour that multiplies its paint), thin (how thin:
     * see thinExt below; thinOf: { slot: thin } says it slot by slot), hang: [x, y, z, i] (the pivot it swings about
     * and which pendulum it is on), axis: [ox, oy, oz, ax, ay, az] (a point on the line its grain runs along and the
     * line's direction, in the realm's own space, for members whose own direction the paint cannot tell: the woven
     * bands of a trap), force: [slots] (use `axis` for those slots even where the paint thinks it can tell: a rick).
     */
    S.add = (part, matrix, o = {}) => { chunks.push({ part, matrix, o }); return S; };
    /** opts: tile (the paint lays a tile: the grain travels with the mesh), hang (pendulums and the axis each copy is built round: the wicker). */
    S.build = (material, opts = {}) => {
      let nv = 0, ni = 0;
      for (const c of chunks) { nv += c.part.n; ni += c.part.index.length; }
      if (!nv) return null;
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), grain = new Float32Array(nv * 4), heart = new Float32Array(nv * 3);
      // (hang: for each point the way out from its own trap's axis, and which pendulum it is on, + 1: four bytes)
      const flex = new Float32Array(nv), thin = new Float32Array(nv), hang = opts.hang ? new Int8Array(nv * 4) : null, idx = new Uint32Array(ni), nm = new THREE.Matrix3(), I = new THREE.Matrix4();
      let v0 = 0, i0 = 0, k = 0;
      for (const { part, matrix, o } of chunks) {
        // (matrix: a Matrix4, or a RULE { point(v), dir(v, x) } that lays the part along a line of its own: the banks' bankMap)
        const rule = matrix && matrix.point ? matrix : null, M = rule ? I : matrix || I, flip = rule ? !!rule.flip : M.determinant() < 0, seed = Math.abs(Math.sin(++k * 12.9898) * 43758.5453) % 1;
        nm.getNormalMatrix(M); _c.set(o.tint ?? '#ffffff');
        const th = (o.thinOf && o.thinOf[part.slot]) ?? o.thin ?? (THIN[part.slot] ? 1 : 0), hg = o.hang, ax = o.axis, force = ax && o.force && o.force.includes(part.slot);
        for (let i = 0; i < part.n; i++) {
          const a = (v0 + i) * 3, b = i * 3;
          const x0 = part.pos[b];
          _v.set(x0, part.pos[b + 1], part.pos[b + 2]); if (rule) rule.point(_v); else _v.applyMatrix4(M); pos[a] = _v.x; pos[a + 1] = _v.y; pos[a + 2] = _v.z;
          _n.set(part.nor[b], part.nor[b + 1], part.nor[b + 2]); if (rule) rule.dir(_n, x0); else _n.applyMatrix3(nm); _n.normalize(); nor[a] = _n.x; nor[a + 1] = _n.y; nor[a + 2] = _n.z;
          col[a] = part.col[b] * _c.r; col[a + 1] = part.col[b + 1] * _c.g; col[a + 2] = part.col[b + 2] * _c.b;
          const g4 = (v0 + i) * 4;
          let known = false;
          if (part.grain && !force) { _n.set(part.grain[i * 4], part.grain[i * 4 + 1], part.grain[i * 4 + 2]); known = _n.lengthSq() > 0.25; if (known) { if (rule) rule.dir(_n, x0).normalize(); else _n.transformDirection(M); } }
          if (known) { grain[g4] = _n.x; grain[g4 + 1] = _n.y; grain[g4 + 2] = _n.z; _n.set(part.heart[b], part.heart[b + 1], part.heart[b + 2]); if (rule) rule.point(_n); else _n.applyMatrix4(M); heart[a] = _n.x; heart[a + 1] = _n.y; heart[a + 2] = _n.z; }
          else if (ax) {
            grain[g4] = ax[3]; grain[g4 + 1] = ax[4]; grain[g4 + 2] = ax[5];
            const t = (_v.x - ax[0]) * ax[3] + (_v.y - ax[1]) * ax[4] + (_v.z - ax[2]) * ax[5];
            heart[a] = ax[0] + ax[3] * t; heart[a + 1] = ax[1] + ax[4] * t; heart[a + 2] = ax[2] + ax[5] * t;
          }
          grain[g4 + 3] = ((part.grain ? part.grain[i * 4 + 3] : 0) + seed) % 1;
          thin[v0 + i] = th; if (part.flex) flex[v0 + i] = part.flex[i];
          if (hang) {
            if (hg) { hang[g4 + 3] = hg[3] + 1; pivots[hg[3]].set(hg[0], hg[1], hg[2]); }
            // the way out from the nearest point of its own axis (the ride darkens what is seen from within a trap); none, where it has no axis (a cord)
            if (ax) {
              const t = (_v.x - ax[0]) * ax[3] + (_v.y - ax[1]) * ax[4] + (_v.z - ax[2]) * ax[5], rx = _v.x - ax[0] - ax[3] * t, ry = _v.y - ax[1] - ax[4] * t, rz = _v.z - ax[2] - ax[5] * t, rl = Math.hypot(rx, ry, rz);
              if (rl > 1e-5) { hang[g4] = Math.round(rx / rl * 127); hang[g4 + 1] = Math.round(ry / rl * 127); hang[g4 + 2] = Math.round(rz / rl * 127); }
            }
          }
        }
        for (let i = 0; i < part.index.length; i += 3) { idx[i0 + i] = v0 + part.index[i]; idx[i0 + i + 1] = v0 + part.index[i + (flip ? 2 : 1)]; idx[i0 + i + 2] = v0 + part.index[i + (flip ? 1 : 2)]; }
        v0 += part.n; i0 += part.index.length;
      }
      const g = new THREE.BufferGeometry();
      // PACKED: a copy laid into a merged mesh carried about 96 bytes a point as floats (19 MB for this group after the
      // traps were woven). Places stay floats; everything else is as small as it can be: normals and the grain's way
      // as signed bytes, paint as 16 bits a channel, the thin mark and the flex as one byte each. 23 to 35 bytes a point.
      const packed = (src, Type, k, lo, hi, each = null) => { const out = new Type(src.length); for (let i = 0; i < src.length; i++) { const v = each ? each(src[i], i) : src[i]; out[i] = Math.max(lo, Math.min(hi, Math.round(v * k))); } return out; };
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(packed(nor, Int8Array, 127, -127, 127), 3, true));
      g.setAttribute('color', new THREE.BufferAttribute(packed(col, Uint16Array, 65535, 0, 65535), 3, true));
      if (opts.tile) {
        // (the grain's fourth number is a number of the member's own, 0..1: the paint only takes its fraction, so it travels as -1..1)
        g.setAttribute('aLGrain', new THREE.BufferAttribute(packed(grain, Int8Array, 127, -127, 127, (v, i) => (i % 4 === 3 ? v * 2 - 1 : v)), 4, true));
        if (opts.heart) g.setAttribute('aLHeart', new THREE.BufferAttribute(heart, 3));          // (only timber's cut ends ask where the heart is)
      }
      g.userData.lGrain = true;                                    // (light.js: the grain is given here, not worked out again)
      g.setAttribute('aThin', new THREE.BufferAttribute(packed(thin, Uint8Array, 127.5, 0, 255), 1, true));       // (0..2 as 0..255: the shader doubles it)
      if (opts.wind) g.setAttribute('aFlex', new THREE.BufferAttribute(packed(flex, Uint8Array, 255, 0, 255), 1, true));
      if (hang) g.setAttribute('aKHang', new THREE.BufferAttribute(hang, 4, true));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingBox(); g.computeBoundingSphere(); g.boundingSphere.radius += 1.5;
      const mesh = new THREE.Mesh(g, material); mesh.name = 'landing:' + name; mesh.matrixAutoUpdate = false;
      if ((QS.get('kpno') || '').split(',').includes(name)) mesh.visible = false;                   // (&kpno=wicker,reed: built but not drawn, to see what each costs)
      ctx.add(mesh);
      counts['pilings: ' + name] = { copies: S.copies, triangles: ni / 3 };
      S.mesh = mesh; S.triangles = ni / 3;
      return mesh;
    };
    return S;
  };
  /** Lay a whole model: each of its parts into the stuff for its slot (to: { paint: stuff, rod: stuff, ... }; a slot not named goes with `paint`). */
  const lay = (model, matrix, to, o = {}) => { for (const part of model.parts) { const S = to[part.slot] || to.paint; S.add(part, matrix, o); } to.paint.copies++; };

  // ---- small geometry made here: a rod through points (cords, lines), as a part
  const rodPart = (pts, radius, sides, color, slot = 'line') => {
    const n = pts.length, pos = new Float32Array(n * sides * 3), nor = new Float32Array(n * sides * 3), col = new Float32Array(n * sides * 3), index = [];
    const t = new THREE.Vector3(), x = new THREE.Vector3(), y = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      x.crossVectors(t, Math.abs(t.y) > 0.9 ? _v.set(1, 0, 0) : UP).normalize(); y.crossVectors(t, x);
      const r = typeof radius === 'function' ? radius(i / (n - 1)) : radius;
      c.set(typeof color === 'function' ? color(i / (n - 1)) : color);
      for (let k = 0; k < sides; k++) {
        const ang = k / sides * Math.PI * 2 + i * 0.5, cx = Math.cos(ang), sy = Math.sin(ang), o = (i * sides + k) * 3;
        nor[o] = x.x * cx + y.x * sy; nor[o + 1] = x.y * cx + y.y * sy; nor[o + 2] = x.z * cx + y.z * sy;
        pos[o] = p[0] + nor[o] * r; pos[o + 1] = p[1] + nor[o + 1] * r; pos[o + 2] = p[2] + nor[o + 2] * r;
        col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
        if (i < n - 1) { const k2 = (k + 1) % sides, p0 = i * sides + k, p1 = i * sides + k2, q0 = p0 + sides, q1 = p1 + sides; index.push(p0, q0, p1, p1, q0, q1); }
      }
    }
    return { slot, n: n * sides, pos, nor, col, grain: null, heart: null, index: Uint32Array.from(index) };
  };

  // ---- where a copy goes
  const _q = new THREE.Quaternion(), _e = new THREE.Euler();
  /** A copy standing or hanging as modelled: at [x, y, z], turned about the vertical, scaled. */
  const upright = (at, turn = 0, scale = 1) => new THREE.Matrix4().compose(V3(at), _q.setFromEuler(_e.set(0, turn, 0)), Array.isArray(scale) ? V3(scale) : new THREE.Vector3(scale, scale, scale));
  /**
   * A copy LAID DOWN. The model's own axis (o.axis: a unit vector in its own space, from one end toward the other) is
   * laid level along dir = [dx, dz] and its rest side (o.down: a unit vector in its own space) turned to the ground,
   * after a roll about its own axis; then it is tipped by `pitch` (radians: positive lifts the far end) and moved so
   * that its own point `ref` comes to `to` = [x, y, z].
   */
  const laid = (o) => {
    const a = V3(o.axis).normalize(), r = V3(o.down).normalize(), e3 = new THREE.Vector3().crossVectors(a, r);
    const dl = Math.hypot(o.dir[0], o.dir[1]) || 1, f1 = new THREE.Vector3(o.dir[0] / dl, 0, o.dir[1] / dl), f2 = new THREE.Vector3(0, -1, 0), f3 = new THREE.Vector3().crossVectors(f1, f2);
    const E = new THREE.Matrix4().makeBasis(a, r, e3), F = new THREE.Matrix4().makeBasis(f1, f2, f3);
    const R = F.multiply(E.transpose());                                                 // the model's (axis, down, side) onto (dir, ground, across)
    if (o.roll) R.multiply(new THREE.Matrix4().makeRotationAxis(a, o.roll));
    if (o.pitch) R.premultiply(new THREE.Matrix4().makeRotationAxis(f3.clone().negate(), o.pitch));
    const s = o.scale ?? 1; R.scale(new THREE.Vector3(s, s, s));
    const ref = V3(o.ref || [0, 0, 0]).applyMatrix4(R);
    R.setPosition(o.to[0] - ref.x, o.to[1] - ref.y, o.to[2] - ref.z);
    return R;
  };

  // ============================================================================================ the area's paints, with this module's own two extensions
  // (1) thin parts are paint when near and drawn lines further off (the painter's filter wipes out what is thinner
  //     than its brush: a trap's ribs are a few pixels wide at four metres); the mark is the engine's own (CRISP_ALPHA).
  //     aThin is how thin: 1 for a rod 15 mm thick, which is drawn as a line from `near` to `far` metres on; a thing
  //     three times as thick (aThin 0.33) from three times as far; 0 = never (THICK below gives it from a thickness)
  const crisp = QS.get('kpcrisp') !== '0';
  // (the wicker's three numbers, each tried in pictures: the traps that lie in the shade of the staithe and the jetty are tinted up, or they are burnt umber on
  // dark boards; the wicker tile at three quarters, or at four metres its rows are blotches; the dark of a trap's inside at 0.7, or every mouth is a black disc)
  const WK = +(QS.get('kpw') ?? 1.6), WG = +(QS.get('kpgrain') ?? 0.75), WIN = +(QS.get('kpin') ?? 0.7), WROW = +(QS.get('kprow') ?? 1.1);
  const thinExt = (near, far) => ({
    vertexPars: /* glsl */`attribute float aThin; varying float vKThin;`,
    vertexWorld: /* glsl */`vKThin = aThin * 2.0;`,
    fragmentPars: /* glsl */`varying float vKThin;`,
    final: crisp ? /* glsl */`{ float kK = smoothstep(${near.toFixed(1)}, ${far.toFixed(1)}, dist * vKThin); if (kK > 0.0) gl_FragColor.a = 0.5 - 1.55 * kK - 13.95 * smoothstep(0.8, 1.0, kK); }` : '',
  });
  // (2) the pendulums: whatever hangs is turned about its cord and swung about the top of the cord (aKHang.w: which
  //     pendulum, + 1; uKPivot[i]: its pivot in the realm's own space; uKSwing[i]: its turn, its swing and the way
  //     it swings, radians)
  const NP = B.traps.length, swing = Array.from({ length: NP }, () => new THREE.Vector4()), pivots = Array.from({ length: NP }, () => new THREE.Vector3());
  const swingExt = {
    uniforms: { uKSwing: { value: swing }, uKPivot: { value: pivots } },
    vertexPars: /* glsl */`attribute vec4 aKHang; uniform vec4 uKSwing[${NP}]; uniform vec3 uKPivot[${NP}]; varying vec3 vKRad;
      vec3 kTurn(vec3 v, vec4 s) {
        float c = cos(s.x), n = sin(s.x); v.xz = vec2(c * v.x + n * v.z, -n * v.x + c * v.z);
        vec2 d = vec2(cos(s.z), sin(s.z)); float c2 = cos(s.y), s2 = sin(s.y), a = dot(v.xz, d), y = v.y;
        v.xz += d * (a * c2 - y * s2 - a); v.y = a * s2 + y * c2;
        return v;
      }`,
    vertexWorld: /* glsl */`
      vec3 kRad = aKHang.xyz;
      float kI = floor(aKHang.w * 127.0 + 0.5) - 1.0;
      if (kI > -0.5) {
        int kN = int(kI + 0.5); vec4 kS = uKSwing[kN]; vec3 kP = uKPivot[kN];
        wp.xyz = kP + kTurn(wp.xyz - kP, kS); wn = kTurn(wn, kS); kRad = kTurn(kRad, kS);
      }
      vKRad = kRad;`,
    // (3) the dark of the inside: whatever of a trap is seen from within (its far wall and far ribs through the open
    //     bands; the funnel and the walls through the mouth) is in the trap's own shade. A point is seen from within
    //     when the way out from the trap's axis through it points away from the eye.
    fragmentPars: /* glsl */`varying vec3 vKRad;`,
    albedo: /* glsl */`{ float kL = length(vKRad); if (kL > 1e-4) albedo *= mix(mix(vec3(1.0), vec3(0.42, 0.34, 0.26), ${WIN.toFixed(2)}), vec3(1.0), smoothstep(-0.16, 0.05, dot(vKRad / kL, normalize(uCameraPos - vWPos)))); }`,
  };
  // (4) the wind in what is loose: the plumes and dry leaves of a bundle, a stem sprung from under its tie, a withy's
  //     head and its sprig lean with the area's own wind wave (PLAN.wind: 28 m, 7 s; staging hushes it for the crossing)
  //     and shiver as the reeds do, by how free each point is (aFlex: load's flexOf)
  //     AND THEY ANSWER THE BOAT: what is loose within three metres of a moving hull leans from it and shivers in its
  //     wake (uKWake: 0 while the boat lies still, 1 at a drift: update, below), as the reeds do
  const W = P.wind, wake = { value: 0 };
  const windExt = {
    uniforms: { uKWind: L.wind, uKWake: wake },
    vertexPars: /* glsl */`attribute float aFlex; uniform vec4 uKWind; uniform float uKWake;`,
    vertexWorld: /* glsl */`
      if (aFlex > 0.0) {
        float kJ = sin(wp.x * 1.7 + wp.z * 2.3) * 3.0;
        float kC = 0.5 + 0.5 * sin(dot(wp.xz, uKWind.xy) * ${(2 * Math.PI / W.length).toFixed(4)} - uTime * ${(2 * Math.PI / W.period).toFixed(4)} + kJ * 0.3);
        wp.xz += uKWind.xy * ((0.25 + 0.75 * kC) * 0.055 * aFlex * uKWind.z) + vec2(sin(uTime * 8.17 + kJ * 9.0), cos(uTime * 7.31 + kJ * 7.0)) * (0.007 * aFlex * uKWind.z);
        vec2 kB = wp.xz - uBoat.xz; float kBd = length(kB), kN = (1.0 - smoothstep(1.4, 3.6, kBd)) * uKWake;
        wp.xz += kB / max(kBd, 0.3) * (0.07 * aFlex * kN) + vec2(sin(uTime * 13.1 + kJ * 5.0), cos(uTime * 11.7 + kJ * 3.0)) * (0.014 * aFlex * kN);
      }`,
  };
  const THICK = (metres) => Math.min(2, 0.015 / metres);
  const paintOf = (kind, o = {}, ...extra) => {
    const { side, ...wo } = o, w = L.wear ? L.wear(kind, wo) : { brush: 0.7, extend: L.extend({ rim: 0.6, under: true }) };
    return kit.gouache({ color: '#ffffff', vertexColors: true, ...(side ? { side } : {}), ...w, extend: [w.extend, ...extra].filter(Boolean) });
  };
  const rnd = ctx.rng(5775);
  const tints = (lo = 0.86, hi = 1.1) => { const k = lo + (hi - lo) * rnd(); return new THREE.Color(k, k * (0.96 + 0.06 * rnd()), k * (0.9 + 0.12 * rnd())); };

  // ============================================================================================ the four stuffs
  const wicker = stuff('wicker'), reed = stuff('reed'), timber = stuff('timber'), fittings = stuff('fittings');
  const groundY = (x, z) => P.ground(path, x, z, {}).y;
  const dirTo = (s0, d0, s1, d1) => { const a = A(s0, d0), b = A(s1, d1), l = Math.hypot(b[0] - a[0], b[2] - a[2]) || 1; return [(b[0] - a[0]) / l, (b[2] - a[2]) / l]; };
  const skew = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  /** A copy STANDING AND LEANING: its foot at [x, y, z], its head tipped `lean` radians toward dir = [dx, dz] and `aside` radians to that way's left, turned `roll` about its own length first. */
  const leaned = (foot, dir, lean, o = {}) => {
    const dl = Math.hypot(dir[0], dir[1]) || 1, t = new THREE.Vector3(dir[0] / dl, 0, dir[1] / dl), k = new THREE.Vector3(t.z, 0, -t.x);
    const R = new THREE.Matrix4().makeRotationAxis(k, lean);
    if (o.aside) R.premultiply(new THREE.Matrix4().makeRotationAxis(t, o.aside));
    R.multiply(new THREE.Matrix4().makeRotationY(o.roll ?? 0));
    const s = o.scale ?? 1; R.scale(new THREE.Vector3(s, s, s));
    return R.setPosition(foot[0], foot[1], foot[2]);
  };

  // ============================================================================================ wicker: the eel traps
  const TRAP = { axis: [0, -1, 0], down: [0, 0, 1] };                       // a trap hangs down its own -Y from its eye; laid, it rests on its +Z side
  const trap = {};
  for (const k of ['a', 'b', 'c']) trap[k] = await load('eel_trap_' + k, 'wicker');
  const layTrap = (model, M, o = {}) => {
    // the woven bands run round the trap: their grain (the weave's stakes) is the trap's own axis, wherever it lies
    const eye = new THREE.Vector3().applyMatrix4(M), ax = new THREE.Vector3(0, -1, 0).transformDirection(M);
    // (every row of the weave is a rod two centimetres wide: at the three metres from which the stack on the staithe is
    // seen, the painter's filter wiped the rows into mud. The weave is marked as its ribs are: paint under two metres,
    // drawn as made from three: WROW, &kprow)
    lay(model, M, { paint: wicker }, { ...o, axis: [eye.x, eye.y, eye.z, ax.x, ax.y, ax.z], thinOf: { paint: WROW, rod: 1, ...(o.thinOf || {}) } });
  };
  /** A trap laid on a level at height y: resting on its belly and its lip, its belly's middle over (x, z). o: dir [dx, dz] (neck toward mouth), roll, scale, lift (its axis raised: for one that lies on others). */
  const trapLaid = (kind, x, y, z, o) => {
    const m = trap[kind], s = o.scale ?? 1, b = m.points.belly, l = m.points.lip;
    const Rb = b.z * s, Rl = l.z * s, D = (b.y - l.y) * s;
    const pitch = o.lift ? (o.pitch ?? 0) : -Math.asin(Math.min(0.5, (Rb - Rl) / D));
    return laid({ ...TRAP, dir: o.dir, roll: o.roll, pitch, scale: s, ref: [0, b.y, 0], to: [x, y + (o.lift ?? Rb * Math.cos(pitch)), z] });
  };

  // ---- nine drying on cords from the bridge rail (PLAN.bridge.traps). A trap hung from the rail itself would lie
  // against the ends of the deck's boards: each hangs from a crook, a forked pole that stands on the deck against the
  // rail, is lashed to it, and reaches 0.4 m out over the water, so that the trap hangs free and can turn on its cord
  K.traps = [];
  const bridge = shared.bridge;
  if (bridge) {
    const side = B.rail.side, f = bridge.frame, kinds = 'abcbacabc', out = Math.atan2(side * f.tx, side * f.tz);      // the turn that points a model's front out over the water
    const WEED = [1, 4, 6, 8], rw = ctx.rng(9113);
    const crook = { a: await load('trap_crook_a'), b: await load('trap_crook_b') };
    B.traps.forEach((d, i) => {
      // (its lashing is where the monument's own hook is: on the rail's pole as it truly runs; its foot comes down to the deck)
      const hook = bridge.hooks && bridge.hooks[i] && bridge.hooks[i].at, rr = bridge.railRadius ?? 0.03;
      const on = hook ? [hook.x, hook.y + 2 * rr, hook.z] : bridge.pt(d, bridge.railTop(d), bridge.railOff);
      const ck = crook[i % 3 === 1 ? 'b' : 'a'], Mc = upright(on, out + (rnd() - 0.5) * 0.3, [i % 2 ? -1 : 1, (on[1] - bridge.deckTop(d) + 0.015) / 1.05, 1]);
      lay(ck, Mc, { paint: fittings }, { tint: tints(0.86, 1.08), thin: THICK(0.045) });
      const top = ck.points.tip.clone().applyMatrix4(Mc).toArray(), cord = lerp(B.cord[0], B.cord[1], rnd()), at = [top[0], top[1] - cord, top[2]];
      const hang = [top[0], top[1], top[2], i];
      const Mt = upright(at, rnd() * 6.28, 0.94 + 0.12 * rnd());
      layTrap(trap[kinds[i]], Mt, { tint: tints(), hang });
      if (WEED.includes(i)) {
        // weed that was still in the mouth when it was hung up, dried to brown threads: it hangs from the border and swings with the trap
        const lip = trap[kinds[i]].points.lip, n = 3 + Math.floor(rw() * 3);
        for (let k = 0; k < n; k++) {
          const a = rw() * 6.28, rr = lip.z * (0.9 + 0.12 * rw()), len = 0.1 + 0.28 * rw() * rw() + 0.06;
          const p0 = new THREE.Vector3(Math.sin(a) * rr, lip.y + 0.01, Math.cos(a) * rr).applyMatrix4(Mt);
          const p1 = [p0.x + (rw() - 0.5) * 0.03, p0.y - len * 0.55, p0.z + (rw() - 0.5) * 0.03], p2 = [p1[0] + (rw() - 0.5) * 0.04, p0.y - len, p1[2] + (rw() - 0.5) * 0.04];
          wicker.add(rodPart([[p0.x, p0.y + 0.012, p0.z], p1, p2], (t) => 0.0045 * (1 - 0.55 * t), 3, ['#5a5226', '#4a4420', '#6a5c2c'][k % 3]), null, { thin: THICK(0.008), hang });
        }
      }
      wicker.add(rodPart([top, [top[0], top[1] - cord * 0.5, top[2]], [at[0], at[1] + 0.012, at[2]]], 0.0045, 4, (t) => (t > 0.4 && t < 0.6 ? '#7c6a48' : '#9a8862')), null, { thin: THICK(0.009), hang });
      K.traps.push({ d, top, at, i, cord, kind: kinds[i] });
    });
  }

  // ---- five stacked 3 and 2 on the staithe, lying across it with their mouths to the water; two on the jetty
  {
    const S = P.staithe, deck = S.deck, mid = (S.d[0] + S.d[1]) / 2;
    const out = (s) => dirTo(s, mid - 0.5, s, mid + 0.5);                // the way from the staithe's inner edge to the water, at s
    const lower = [['a', 11.26, 0.06, 0.2], ['c', 11.70, -0.05, 2.1], ['b', 12.12, 0.10, 4.0]], rest = [];
    for (const [kind, s, a, roll] of lower) {
      const [x, , z] = A(s, mid - 0.02 + 0.08 * (rnd() - 0.5)), sc = 0.97 + 0.06 * rnd();
      layTrap(trap[kind], trapLaid(kind, x, deck, z, { dir: skew(out(s), a), roll, scale: sc }), { tint: tints(0.86 * WK, 1.1 * WK) });
      rest.push({ s, r: trap[kind].points.belly.z * sc });
    }
    for (const [kind, i, a, roll, dd] of [['b', 0, -0.16, 1.2, -0.05], ['a', 1, 0.07, 5.0, 0.12]]) {
      const lo = rest[i], hi = rest[i + 1], s = (lo.s + hi.s) / 2, sc = 0.96, r = trap[kind].points.belly.z * sc;
      const gap = hi.s - lo.s, rise = Math.sqrt(Math.max(0.01, ((lo.r + hi.r) / 2 + r) ** 2 - (gap / 2) ** 2));
      const [x, , z] = A(s, mid + dd);
      layTrap(trap[kind], trapLaid(kind, x, deck, z, { dir: skew(out(s), a), roll, scale: sc, lift: (lo.r + hi.r) / 2 + rise, pitch: -0.02 }), { tint: tints(0.86 * WK, 1.1 * WK) });
    }
    // (the jetty runs out across the path: they lie along it near its root, mouths toward its head)
    const J = P.jetty, jd = J.deck, toHead = (s, d) => { const a = A(s, d - 0.5), b = A(s, d + 0.5); return [b[0] - a[0], b[2] - a[2]]; };
    { const [x, , z] = A(J.s - 0.24, -13.45); layTrap(trap.c, trapLaid('c', x, jd, z, { dir: skew(toHead(J.s - 0.24, -13.45), 0.18), roll: 0.8 }), { tint: tints(0.86 * WK, 1.1 * WK) }); }
    { const [x, , z] = A(J.s + 0.24, -13.85); layTrap(trap.a, trapLaid('a', x, jd, z, { dir: skew(toHead(J.s + 0.24, -13.85), -0.3), roll: 3.3, scale: 0.95 }), { tint: tints(0.86 * WK, 1.1 * WK) }); }
  }
  const wickerMesh = wicker.build(paintOf('wicker', { side: THREE.DoubleSide, grain: WG }, thinExt(1.6, 3.2), swingExt), { hang: true });
  if (wickerMesh) { removeStandIn(ctx, 'eel traps'); removeStandIn(ctx, 'trap cords'); }

  // ============================================================================================ reed: the bundles, the low ricks
  const BUNDLE = { axis: [0, 1, 0], down: [0, 0, 1] };                      // a bundle stands up its own +Y from its butt; laid, it rests on its +Z side
  const bundle = {};
  // (what is loose on a bundle: whatever stands more than a hand off its side or beyond its head; the twine never)
  const looseOnBundle = (x, y, z, slot) => (slot === 'paint' ? 0 : Math.max(Math.hypot(x, z) - 0.2, y - 1.86) / 0.25 * (slot === 'plume' ? 1 : 0.6));
  for (const k of ['a', 'b', 'c', 'far']) bundle[k] = await load('reed_bundle_' + k, 'reed', looseOnBundle);             // (far: the same bundle in 150 triangles, for the hard, 40 m off and more)
  const bundles = [];
  const layBundle = (kind, M, where) => {
    lay(bundle[kind], M, { paint: reed }, { tint: tints(0.88, 1.1), thinOf: { line: THICK(0.011), plume: THICK(0.03) } });
    bundles.push({ at: new THREE.Vector3().applyMatrix4(M).toArray(), head: bundle[kind].points.head.clone().applyMatrix4(M).toArray(), kind, where });
  };
  /** A bundle laid like a log: its middle over (x, z), its axis at height y above... `on` (the level it lies on) or `axisY` (for one that lies on others); dir: butt toward head. */
  const bundleLaid = (kind, x, z, o) => {
    const m = bundle[kind], s = o.scale ?? 1, a = m.points.rest_a, b = m.points.rest_b, pitch = o.axisY != null ? (o.pitch ?? 0) : -Math.asin(Math.max(-0.3, Math.min(0.3, (b.z - a.z) / (b.y - a.y)))) + (o.pitch ?? 0);
    return laid({ ...BUNDLE, dir: o.dir, roll: o.roll, pitch, scale: s, ref: [0, 1.0, 0], to: [x, o.axisY ?? (o.on + (a.z + b.z) / 2 * s), z] });
  };
  { // ---- eight stacked like logs on the staithe beside the boat: three, three the other way, two askew on top
    const S = P.staithe, deck = S.deck, mid = (S.d[0] + S.d[1]) / 2, s0 = 14.5, fore = dirTo(s0 - 0.5, mid, s0 + 0.5, mid), aft = [-fore[0], -fore[1]];
    const rows = [
      [['a', -0.335, 0.03, 0.02], ['b', 0.0, -0.05, -0.03], ['a', 0.33, 0.06, 0.01]],
      [['b', -0.31, -0.08, 0.04], ['c', 0.02, 0.1, -0.02], ['a', 0.34, -0.02, 0.03]],
      [['c', -0.17, 0.16, 0.12], ['b', 0.2, -0.1, -0.07]],
    ];
    rows.forEach((row, j) => row.forEach(([kind, dd, ds, sk], i) => {
      const [x, , z] = A(s0 + ds, mid - 0.02 + dd), r = bundle[kind].points.rest_a.z;
      const axisY = deck + [r, r + 0.295, r + 0.295 + 0.265][j] + (j === 2 ? 0.01 : 0);
      layBundle(kind, bundleLaid(kind, x, z, { dir: skew(j === 1 ? aft : fore, sk), roll: rnd() * 6.28, axisY, pitch: (rnd() - 0.5) * 0.02, scale: 0.97 + 0.06 * rnd() }), 'staithe');
    }));
  }
  { // ---- two on the jetty, lying along it between the traps and its head
    const J = P.jetty, toHead = dirTo(J.s, -12.5, J.s, -11.5);
    { const [x, , z] = A(J.s - 0.36, -11.6); layBundle('a', bundleLaid('a', x, z, { dir: skew(toHead, 0.05), roll: 1.0, on: J.deck }), 'jetty'); }
    { const [x, , z] = A(J.s - 0.05, -11.85); layBundle('c', bundleLaid('c', x, z, { dir: skew([-toHead[0], -toHead[1]], 0.12), roll: 4.0, on: J.deck }), 'jetty'); }
  }
  if (bridge) { // ---- four leaning on the bridge rail at d -24: standing on the deck, their heads out over the rail
    const side = B.rail.side, f = bridge.frame, outward = [side * f.tx, side * f.tz];
    for (let i = 0; i < P.bundles.onBridge; i++) {
      const d = B.bundlesAt + i * 0.37 + (rnd() - 0.5) * 0.06, lean = 0.2 + 0.07 * rnd();
      const rail = bridge.rail ? bridge.rail(d) : new THREE.Vector3(...bridge.pt(d, bridge.railTop(d) - 0.03, bridge.railOff - side * 0.07));
      const deck = bridge.deckTop(d), kind = 'abca'[i], r = bundle[kind].points.rest_b.z, h = rail.y - deck;
      // its axis passes the rail's pole at the pole's height, a bundle's half thickness inboard of it; its foot stands where that line meets the deck
      const inb = (r + (bridge.railRadius ?? 0.03)) / Math.cos(lean) + h * Math.tan(lean);
      layBundle(kind, leaned([rail.x - outward[0] * inb, deck - 0.01, rail.z - outward[1] * inb], outward, lean, { aside: (rnd() - 0.5) * 0.16, roll: rnd() * 6.28 }), 'bridge');
    }
  }
  { // ---- six at the rick's end, leaning on it in a row (kit.js grows no reed within 0.7 m of that end: they stand in the gap)
    const Kk = P.rick, sEnd = Kk.s[1], toRick = dirTo(sEnd + 1, -11.8, sEnd, -11.8);
    for (let i = 0; i < 6; i++) {
      const d = Kk.d[0] - 0.28 - i * 0.37 + (rnd() - 0.5) * 0.05, s = sEnd + 0.4 + 0.07 * rnd();
      const [x, , z] = A(s, d), y = Math.max(0.03, groundY(x, z)) - 0.02;
      layBundle('abcab'[i % 5], leaned([x, y, z], toRick, 0.17 + 0.05 * rnd(), { aside: (rnd() - 0.5) * 0.14, roll: rnd() * 6.28, scale: 0.96 + 0.08 * rnd() }), 'rick');
    }
  }
  { // ---- what the bundles shed where they were set down: loose stems on the boards, a few over the edge
    const strew = (s0, s1, d0, d1, y, n) => {
      for (let i = 0; i < n; i++) {
        const s = lerp(s0, s1, rnd()), d = lerp(d0, d1, rnd()), a = rnd() * Math.PI, len = 0.3 + 0.8 * rnd() * rnd();
        const p0 = A(s - Math.cos(a) * len / 2, d - Math.sin(a) * len / 2, y), p1 = A(s + Math.cos(a) * len / 2, d + Math.sin(a) * len / 2, y + 0.004 + 0.01 * rnd());
        const mid = [(p0[0] + p1[0]) / 2 + (rnd() - 0.5) * 0.03, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2 + (rnd() - 0.5) * 0.03];
        reed.add(rodPart([p0, mid, p1], 0.0035 + 0.0015 * rnd(), 3, ['#C9A85A', '#B0893C', '#D8BC78', '#9C7E3C'][i % 4]), null, { thin: THICK(0.008) });
      }
    };
    const S = P.staithe, mid = (S.d[0] + S.d[1]) / 2;
    strew(13.1, 16.1, mid - 0.42, mid + 0.47, S.deck + 0.009, 16);                   // round the logs
    strew(10.7, 12.7, mid - 0.4, mid + 0.4, S.deck + 0.009, 5);                      // a few under the traps (they were carried past)
    strew(P.jetty.s - 0.55, P.jetty.s + 0.5, -12.7, -10.7, P.jetty.deck + 0.009, 7); // on the jetty
  }
  let reedMesh = null;
  const finishReed = () => {
    reedMesh = reed.build(paintOf('reed', { side: THREE.DoubleSide }, thinExt(1.6, 3.2), windExt), { tile: true, wind: true });
    if (reedMesh) removeStandIn(ctx, 'reed bundles');
    K.bundles = Object.assign(reedMesh ? [reedMesh] : [], { list: bundles });
    counts['reed bundles'] = { count: bundles.length };
  };

  // ============================================================================================ timber: the last straight, the masts, the withies, the hard
  const looseOnWithy = (x, y, z, slot) => 0.3 * (Math.max(0, y) / 3) ** 2 + (slot === 'leaf' ? 0.55 : 0);          // a rod that long nods at its head; its leaves are free
  const [pA, pB, pC, pileL, pileR, revL, revR, runM, mastM, farMastM, wA, wB, wC, rickM] = await Promise.all([
    load('piling_a', 'timber'), load('piling_b', 'timber'), load('piling_c', 'timber'), load('piling_left', 'timber'), load('piling_right', 'timber'), load('revetment_left', 'timber'), load('revetment_right', 'timber'),
    load('revetment_run', 'timber'), load('gate_masts', 'timber'), load('far_mast', 'timber'),
    load('withy_a', 'plain', looseOnWithy), load('withy_b', 'plain', looseOnWithy), load('withy_c', 'plain', looseOnWithy), load('low_rick', 'reed')]);
  const TIMBER = { paint: timber, plain: fittings, line: fittings, leaf: fittings };
  const U3 = new THREE.Vector3(0, 1, 0);
  /** A frame standing at [x, y, z] with its own +X along `along` = [dx, dz] and its front (+Z) to the right of that... no: to along x up; scale: [sx, sy, sz]. */
  const framed = (at, along, scale = [1, 1, 1]) => {
    const l = Math.hypot(along[0], along[1]) || 1, X = new THREE.Vector3(along[0] / l, 0, along[1] / l), Z = new THREE.Vector3().crossVectors(X, U3);
    return new THREE.Matrix4().makeBasis(X, U3, Z).scale(new THREE.Vector3(scale[0], scale[1], scale[2])).setPosition(at[0], at[1], at[2]);
  };
  const G = P.pilings, GATE = P.gate;
  { // ---- the piled banks of the last straight: each bank is built whole in bank space (source-art/models/landing/
    // palisade.py: x along the bank from its first pile as seen from the water, y up, z out toward the water) and
    // laid along the path by this rule, so that it follows the last of the bend: thirteen piles, no two alike, rising
    // 1.2 to 6.5 m toward the gate like organ pipes; the boards behind them, the waling bolted along their front,
    // rings, fenders, the ladder, a stump, wrack lodged at the waterline
    const _fr = {};
    const bankMap = (side) => ({
      s: (x) => (side < 0 ? G.s[0] + x : G.s[1] - x),
      point(v) { const q = P.at(path, this.s(v.x), side * (G.d - v.z), v.y); return v.set(q[0], q[1], q[2]); },
      dir(n, x) { const f = P.frame(path, this.s(x), _fr), k = side < 0 ? 1 : -1, a = n.x * k, c = n.z * k; return n.set(a * f.tx + c * f.rx, n.y, a * f.tz + c * f.rz); },
    });
    const tops = { '-1': [], '1': [] }, piles = { '-1': [], '1': [] }, fenders = [];
    for (const side of [-1, 1]) {
      const map = bankMap(side), pm = side < 0 ? pileL : pileR, rm = side < 0 ? revL : revR, tint = side < 0 ? new THREE.Color(1, 1, 1) : new THREE.Color(0.97, 0.98, 1.0);
      lay(pm, map, TIMBER, { tint, thinOf: { line: THICK(0.024) } });
      lay(rm, map, TIMBER, { tint, thinOf: { line: THICK(0.012) } });
      // (what the cast and the staging read: the piles' highest points, in the route's order, the lowest first)
      // (each pile's own place along the route is read from the model: the tallest stands half a metre short of the bank's
      // end, clear of the door's cloth, which hangs in the plane of s 75)
      const list = [];
      for (let i = 0; i < G.count; i++) { const q = pm.points['top_' + String(i).padStart(2, '0')]; if (q) list.push({ s: map.s(q.x), top: map.point(q.clone()) }); }
      if (side > 0) list.reverse();
      list.forEach(({ s, top: q }) => { const at = A(s, side * G.d, 0); tops[side].push(q.toArray()); piles[side].push({ s, at, h: q.y, r: 0.15 + 0.0062 * q.y }); });
      for (const k in rm.points) { const q = map.point(rm.points[k].clone()).toArray(); if (k.startsWith('fender')) fenders.push(q); else if (k === 'ladder') K.ladder = { at: q, s: map.s(rm.points[k].x) }; }
    }
    K.pilings = tops; K.piles = piles; K.fenders = fenders;
    // beyond the door the banks run on, plain, into the haze: three courses and a short post every three metres or so
    const posts = [pA, pB, pC];
    for (const side of [-1, 1]) for (let s = G.s[1], n = 0; s < 126; s += 3, n++) {
      const p0 = A(s, side * G.d), p1 = A(s + 3, side * G.d), from = side < 0 ? p0 : p1, to = side < 0 ? p1 : p0;
      lay(runM, framed([from[0], 0, from[2]], [to[0] - from[0], to[2] - from[2]]), TIMBER, { tint: tints(0.84, 1.08) });
      if (n > 0) { const m = posts[(n + (side > 0 ? 1 : 0)) % 3], k = 0.85 + 0.3 * rnd(); lay(m, new THREE.Matrix4().makeRotationY(rnd() * 6.28).scale(new THREE.Vector3(k, 0.85 + 0.4 * rnd(), k)).setPosition(p0[0], 0, p0[2]), TIMBER, { tint: tints(0.82, 1.05) }); }
    }
  }
  { // ---- the gate masts: one model on both banks, its front to the water; the line between their blocks, by PLAN.gate
    const lineY = (d) => GATE.line - GATE.sag * (1 - (d / GATE.mast) ** 2), sheaves = [];
    for (const side of [-1, 1]) {
      const at = A(GATE.s, side * GATE.mast), f = L.frame(GATE.s, {}), along = side < 0 ? [f.tx, f.tz] : [-f.tx, -f.tz];
      const M = framed([at[0], 0, at[2]], along, [GATE.mastThick / 0.36, GATE.mastHeight / mastM.points.head.y, GATE.mastThick / 0.36]);
      lay(mastM, M, TIMBER, { tint: tints(0.9, 1.06), thinOf: { line: THICK(0.022) } });
      sheaves.push(mastM.points.sheave.clone().applyMatrix4(M));
    }
    const rope = (a, b, sag, yOf, n = 26, r = 0.014) => {
      const pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, q = new THREE.Vector3().lerpVectors(a, b, t); q.y = yOf ? (i === 0 || i === n ? q.y : yOf(t)) : q.y - sag * 4 * t * (1 - t); pts.push(q.toArray()); }
      fittings.add(rodPart(pts, r, 5, (t) => (Math.floor(t * 40) % 2 ? '#A8946C' : '#9A865E')), null, { thin: THICK(r * 2) });
    };
    // (the line's height at d is the plan's own rule, shared with the cloth that hangs from it and with the reach's half of the door)
    const dOf = (t) => lerp(-(GATE.mast - 0.27), GATE.mast - 0.27, t);
    rope(sheaves[0], sheaves[1], 0, (t) => lineY(dOf(t)));
    (shared.heroes || (shared.heroes = {})).gate = { lineY, sheaves: sheaves.map((v) => v.toArray()) };
    // ---- four more pairs beyond the door, 14 to 18 m, in the haze: the same mast, plainer, drawn out to its height
    for (const [s, half, h] of P.beyond) {
      const sh = [];
      for (const side of [-1, 1]) {
        const at = A(s, side * half), f = L.frame(s, {}), along = side < 0 ? [f.tx, f.tz] : [-f.tx, -f.tz], k = 0.95 + 0.12 * rnd();
        const M = framed([at[0], 0, at[2]], along, [k, h / farMastM.points.head.y, k]);
        lay(farMastM, M, TIMBER, { tint: tints(0.9, 1.06) });
        sh.push(farMastM.points.sheave.clone().applyMatrix4(M));
      }
      rope(sh[0], sh[1], 0.3, null, 12, 0.016);
    }
  }
  { // ---- the withies: seven along the open left edge (0.3 m outside it), thirteen out on the fen; crooked; four carry a sprig
    const Wt = P.withies, hw = (s) => L.frame(s, {}).halfWidth, models = { a: wA, b: wB, c: wC };
    const places = [...Wt.s.map((s) => [s, -(hw(s) + Wt.out)]), [23, -22], [29, -31], [36, -27], [44, -24], [49, -34], [55, -27], [61, -21], [66, -31], [70, -19], [58, -39], [41, -39], [33, -45], [52, -53]];
    K.withies = places.slice(0, Wt.total).map(([s, d], i) => {
      let [x, , z] = A(s, d);
      if (i >= Wt.s.length && P.inLead(path, x, z)) [x, , z] = A(s, d - 3.5);                 // (not in the open lead behind the heron)
      const kind = i % 5 === 1 ? 'c' : i % 2 ? 'b' : 'a', m = models[kind], modelH = { a: 3.0, b: 3.3, c: 2.8 }[kind];
      const h = i === 0 ? Wt.height[0] : lerp(Wt.height[0], Wt.height[1], rnd()), la = rnd() * 6.28;
      const M = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(la), 0, Math.sin(la)), 0.02 + 0.07 * rnd()).multiply(new THREE.Matrix4().makeRotationY(rnd() * 6.28))
        .scale(new THREE.Vector3(1, h / modelH, 1)).setPosition(x, 0, z);
      lay(m, M, TIMBER, { tint: tints(0.82, 1.1), thinOf: { line: THICK(0.05), leaf: THICK(0.03) } });
      return new THREE.Vector3(0, modelH, 0).applyMatrix4(M).toArray();
    });
  }
  { // ---- the three low ricks on the hard, flat-topped, each turned its own way, and what is left of the bundles about them
    const turns = [0.35, -0.5, 0.9], eye = A(36, 0);
    P.farRicks.at.forEach(([s, d], i) => {
      const [x, , z] = A(s, d), y = Math.max(0.2, groundY(x, z)) - 0.04;
      // its long side toward the mere, more or less (it is seen from there, 40 to 80 m off, as a low loaf)
      const toEye = Math.atan2(eye[0] - x, eye[2] - z), turn = toEye + turns[i], sc = 0.94 + 0.12 * rnd();
      const M = new THREE.Matrix4().makeRotationY(turn).scale(new THREE.Vector3(sc, 0.95 + 0.1 * rnd(), sc)).setPosition(x, y, z);
      const across = new THREE.Vector3(0, 0, 1).transformDirection(M);
      lay(rickM, M, { paint: reed, roof: reed, line: fittings }, { tint: tints(0.86, 1.06), axis: [x, y, z, across.x, across.y, across.z], force: ['paint'], thinOf: { line: THICK(0.05) } });
      // bundles: two or three leaning on its long face, one or two lying by it
      const alongV = new THREE.Vector3(1, 0, 0).transformDirection(M), n = [5, 5, 4][i];
      for (let k = 0; k < n; k++) {
        const kind = 'far';
        if (k < 3) {
          // three lying like logs along its long face: two on the hard, one across them. (As first laid they LEANED on
          // the rick, heads up: pale, pointed, three cones at every rick from the water, and the page says by name that
          // nothing here is a cone.)
          const u = -0.9 + i * 0.45 + (k === 2 ? 0.3 : k * 0.15), off = 0.8 * sc + 0.34 + (k === 1 ? 0.37 : k === 2 ? 0.2 : 0);
          const fx = x + alongV.x * u + across.x * off, fz = z + alongV.z * u + across.z * off, gy = Math.max(0.2, groundY(fx, fz));
          layBundle(kind, bundleLaid(kind, fx, fz, { dir: skew([alongV.x, alongV.z], (rnd() - 0.5) * 0.2 + (k === 2 ? 0.45 : 0)), roll: rnd() * 6.28, ...(k === 2 ? { axisY: gy + 0.165 * 2 + 0.1 } : { on: gy }) }), 'hard');
        } else {
          const u = 2.6 + (k - 3) * 0.4, off = (k - 3) * 0.5 - 0.3, fx = x + alongV.x * u + across.x * off, fz = z + alongV.z * u + across.z * off;
          layBundle(kind, bundleLaid(kind, fx, fz, { dir: skew([across.x, across.z], 0.4 * (rnd() - 0.5)), roll: rnd() * 6.28, on: Math.max(0.2, groundY(fx, fz)) }), 'hard');
        }
      }
    });
  }
  finishReed();
  // (the water-light on this group's timber. The area's timber paint gives the engine's caustics with a share that
  // stands on still water (base 0.15, to 4.5 m): a gold glaze over every pile and board from every place on the
  // water, and the wet band lit back up to the value of the dry timber above it (the Monument found the same on the
  // bridge and took it off there). Here it follows the wake and almost nothing of it stands on still water.
  // &kpcaus=base,intensity,height tries others; &kptg=<0..1.4> is how strongly the timber tile shows)
  const CQ = (QS.get('kpcaus') || '').split(',').filter(Boolean).map(Number);
  const timberCaustics = { ripple: true, base: CQ[0] ?? 0.03, color: '#FFCC6E', intensity: CQ[1] ?? 0.6, height: CQ[2] ?? 3.0 };
  const timberMesh = timber.build(paintOf('timber', { caustics: timberCaustics, ...(QS.get('kptg') ? { grain: +QS.get('kptg') } : {}) }), { tile: true, heart: true });
  if (timberMesh) { removeStandIn(ctx, 'kit timbers'); removeStandIn(ctx, 'gate_masts'); K.timbers = timberMesh; shared.heroes.gate.mesh = timberMesh; }
  fittings.build(paintOf('plain', { wet: true, side: THREE.DoubleSide }, thinExt(1.6, 3.2), windExt), { wind: true });

  // ---- the pendulums (the cast's to drive: shared.kit.trapSwing). At rest each trap turns slowly on its cord as the
  // twist in it winds and unwinds, and swings a little in the wind (the page: +-25 degrees in 5 to 8 s, +-4 degrees);
  // kick(i, degrees, seconds) sets it swinging as a passing bird's wind does, and it settles by itself.
  const RAD = Math.PI / 180, pend = K.traps.map((t, i) => ({ T: 5 + 3 * rnd(), ph: rnd() * 6.28, len: t.cord + 0.75, az: rnd() * 6.28, kick: 0, t0: -1e3, tau: 2.4 }));
  // (they swing ACROSS the bridge, out over the water and back: what a gust down the water or a swift's passage under the
  // span does to a thing hung from a rail. Swung along the bridge, two that hang 0.6 m apart knock through each other)
  const swingAz = bridge ? Math.atan2(bridge.frame.tz, bridge.frame.tx) : Math.atan2(L.wind.value.y, L.wind.value.x);
  K.trapSwing = {
    uniforms: swingExt.uniforms, count: pend.length, turn: 25, sway: 4,                       // degrees: the cast may change turn and sway
    /** Set trap i swinging: `degrees` at once, dying away over about `seconds`. i < 0: all of them. */
    kick(i, degrees = 12, seconds = 6) { for (const p of i < 0 ? pend : [pend[i]]) if (p) { p.kick = degrees; p.t0 = ctx.time; p.tau = seconds / 2.5; } },
  };
  const calm = ctx.reducedMotion ? 0.5 : 1;
  let kicked = false;
  return {
    update(dt) {
      const t = ctx.time, w = L.wind.value.z;
      wake.value += (Math.min(1, Math.abs((ctx.boat && ctx.boat.speed) || 0) / 1.2) * calm - wake.value) * Math.min(1, (dt || 0.016) * 1.6);
      if (QS.get('kpkick') === '1' && !kicked && t > 2) { kicked = true; K.trapSwing.kick(-1); }
      pend.forEach((p, i) => {
        const period = 2 * Math.PI * Math.sqrt(p.len / 9.81), k = p.kick * Math.exp(-(t - p.t0) / p.tau);
        const sway = (K.trapSwing.sway * (0.35 + 0.65 * w) * (0.6 + 0.4 * Math.sin(t * 0.37 + p.ph * 2)) * calm + k) * RAD;
        swing[i].set(K.trapSwing.turn * RAD * calm * Math.sin(t * 2 * Math.PI / p.T + p.ph), sway * Math.sin(t * 2 * Math.PI / period + p.ph), swingAz + 0.22 * Math.sin(t * 0.11 + p.az), 0);
      });
    },
  };
}
