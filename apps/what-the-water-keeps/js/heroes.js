// The landing: the monument. docs/art/landing.md, section 3 ("Monument: the long bridge") and section 9 (`bridge`).
// Its log: docs/build/landing/2-monument.md.
//
// THE LONG BRIDGE: a plain timber footbridge 86.5 m long and 1.5 m wide, crossing the mere at s 39 at right angles to
// the path, on twelve crooked trestle towers. Modelled by hand in Blender by ONE script,
// source-art/models/landing/bridge.py, which writes THREE files cut where no timber is cut (every piece is whole and
// lies in the file its middle is in):
//   bridge_mid.glb     |d| < 12.4: the central span, its four raking struts and two straining beams, the two inner
//                      towers; the coil of rope at d +5 (the moving part `coil`)
//   bridge_left.glb    the five towers striding away over the fen, the four plank steps down to the turf bank
//   bridge_right.glb   the five towers that walk into the reeds (kit.js leaves a lane for them)
// Material slots: `paint` (timber and iron: the area's timber paint, L.wear('timber')), `rail` (rail poles, posts and
// lashings: the same paint, drawn crisp: they are thinner than the painter's brush), `rope` (the coil).
// The paint is the area's (shade, rim, the timber tile, the wet band and dry line by height) WITHOUT the engine's
// caustics, and with the bridge's own WATER-LIGHT laid over it (bridgeLight, below): light thrown up from the water
// onto undersides and upright faces, nearly none of it on still water, whole where the water is disturbed.
// Grown here in code, at the model's own named pile points: THE WEED SKIRTS, twelve green ribbons 0.3 m long at the
// waterline of each of the 48 piles, with a slow first sway (the cast streams them later: shared.bridge.weed).
//
// shared.bridge is what the layout published, unchanged: { frame, pt(d, y, off), deckTop(d), railTop(d), railOff,
// soffit(d) } (the kit hangs its traps from it, the cast rests its mayflies on it), and, new, what the model itself
// knows (every place is read from the files' named points, never typed twice):
//   models { mid, left, right }     the three kit.model results (.group, .point(name), .parts)
//   point(name, out)                any named point of the three files, as a Vector3 in the realm (rail_000 .. rail_171,
//                                   post_00 .. post_42, pile_TT_K_w / _r / _m / _h, strut_N_a / _b, stump_TT, hook_N,
//                                   perch_h5, coil_hang)
//   rail(d, out)                    a Vector3: the MIDDLE of the rail pole at d, as it truly runs (it sags 6 to 10 cm
//                                   between posts, 2 cm where a trap hangs); railRadius: about 0.03
//   hooks[i]  { d, at }             where the cord of the eel trap at PLAN.bridge.traps[i] ties on: the pole's underside
//   posts[i]  { d, top }            the top of every rail post, left to right (43); perch: the post at d -3 (H5)
//   piles[i]  { tower, k, d, off, at, r, mid, head }    each pile: its middle at the waterline (a Vector3), its radius
//                                   there, a point half way up, its head (under the cap; the top of a tall pile)
//   struts[i] [a, b]                the four raking struts (foot, head); strutLines[i]: each log's own crooked centre
//                                   line in five points, foot to head (radius 0.13 to 0.11)
//   stumps[]                        the heads of three old pile stumps beside the towers (perches)
//   baulks, baulk                   the three baulks' offsets down the route, and their [width, depth]
//   coil                            the coil's part (it hangs from shared.bridge.coilHang; it swings about its own z)
//   painter                         the part that is the end of an old painter hanging from the mooring ring of the
//                                   inner left tower into the water (it turns about the ring)
//   weed { mesh, items, current }   the weed skirts: the still mesh, and every ribbon as an item of the engine's
//                                   makeRibbons({ kind: 'weed', items }) (docs/life/ribbons.md), for the cast
//   waterLight { gain, uniforms, numbers }   the bridge's own water-light: gain is a uniform ({ value: 1 }) the
//                                   staging may raise or still (the page: "it has been growing since s 34")
// Colliders: the towers' are the plan's (two circles each); four more keep the rider's head from under the low feet
// of the raking struts.
export async function build(ctx, plan, shared) {
  const { kit } = ctx, THREE = ctx.THREE, L = shared.landing, P = plan, B = P.bridge, R = B.rail;
  const f = L.frame(B.s, {}), half = B.width / 2;
  /** A point of the bridge: d metres along it (the page's d), y up, `off` metres down-route of its centre line. */
  const pt = (d, y, off = 0) => [f.x + f.rx * d + f.tx * off, y, f.z + f.rz * d + f.tz * off];
  const railY = (d) => B.deckTop(d) + R.height, ro = R.side * (half - 0.04);
  const dOf = (v) => (v.x - f.x) * f.rx + (v.z - f.z) * f.rz, offOf = (v) => (v.x - f.x) * f.tx + (v.z - f.z) * f.tz;

  // ---- the three files, in the area's timber paint
  const wear = (kind, o) => (L.wear ? L.wear(kind, o) : { extend: L.extend({ rim: 0.6, under: true }) });
  const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const QS0 = (k) => (QS.get(k) || '').split(',').filter(Boolean);   // (a developer's switch with several numbers: &bridgecaustic=7,0.7)
  // (THE WATER-LIGHT. Second holder: the page's own numbers stop it at 4.5 m, where the soffit, 3.3 to 3.6 m up, gets a
  // sixth of it: nothing "plays over the soffit". It was made to reach 7.5 m, twice as strong and a step more golden,
  // with three tenths of it standing on still water (at the page's 0.15 the soffit over a stopped boat went dead in
  // seven seconds).)
  //
  // THIRD HOLDER (8 November, 01:10): that light was the engine's own caustics, which are strongest AT the water and
  // of which a share (`base`) stands on still water. Three tenths of 1.1 of it, to 7.5 m, was a gold glaze over every
  // timber of the bridge from every place on the water: old grey oak came out pale straw, new pine, and the wet band
  // (darker by a third) was lit back up to the value of the dry timber above it (.shots/landing_m3_tower4.png with it,
  // _tower4_nocaus.png without). The bridge now wears NO caustics of the engine's and has a water-light of its own
  // (bridgeLight, below; the same web, the same ripple field), made as light thrown UP from the water is:
  //   - it lies on what looks down at the water (the soffit, the undersides of baulks, braces and walings) and, a
  //     little less, on upright faces; never on a top;
  //   - on still water there is almost none of it on upright faces (`side` 0.03: the piles, the wet band and the
  //     silhouette keep their own value) and a slow faint web under the deck (`under` 0.3), where it is the page's
  //     "gold water-light crawling over all of it" and where nothing else is lit;
  //   - where the water is disturbed (the boat's wave, a ring) it comes up whole: it climbs the piles and plays over
  //     the soffit, to `top` metres;
  //   - shared.bridge.waterLight.gain (a uniform, 1) is the staging's: "it has been growing since s 34".
  // &bridgecaustic=top,strength,rrggbb,under,side tries other numbers.
  const WLQ = QS0('bridgecaustic'), wlNum = (i, d) => (WLQ[i] !== undefined && WLQ[i] !== '' ? +WLQ[i] : d);
  const WLN = { top: wlNum(0, 7.5), strength: wlNum(1, 1.25), color: '#' + (WLQ[2] || 'FFCC6E'), under: wlNum(3, 0.3), side: wlNum(4, 0.03) };
  const wlUniforms = { uBWL: { value: new THREE.Vector4(WLN.strength, WLN.side, WLN.under, WLN.top) }, uBWLColor: { value: new THREE.Color(WLN.color) }, uBWLGain: { value: 1 } };
  const bridgeLight = {
    uniforms: wlUniforms,
    fragmentPars: /* glsl */`uniform vec4 uBWL; uniform vec3 uBWLColor; uniform float uBWLGain;`,
    light: /* glsl */`
      { float bUnder = smoothstep(-0.15, -0.7, N.y), bFace = clamp(0.55 - 0.75 * N.y, 0.0, 1.0);
        float bBand = (1.0 - smoothstep(uBWL.w * 0.6, uBWL.w, vWPos.y)) * smoothstep(-2.5, -0.2, vWPos.y);
        vec3 bW = pow(abs(N), vec3(4.0)); bW /= (bW.x + bW.y + bW.z);
        vec3 bQ = vWPos * 0.35; float bT = uTime * 0.6;
        float bWeb = min(causticAt(bQ.zy, bT) * bW.x + causticAt(bQ.xz, bT) * bW.y + causticAt(bQ.xy, bT) * bW.z, 4.0);
        vec2 bUv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float bE = (bUv.x > 0.0 && bUv.x < 1.0 && bUv.y > 0.0 && bUv.y < 1.0) ? texture2D(tRipple, bUv).a : 0.0;
        float bStill = mix(uBWL.y, uBWL.z, bUnder);
        float bLive = bStill + (1.0 - bStill) * clamp(bE * 4.0, 0.0, 1.0);
        // (it is the timber's own colour that throws it back: a pale board takes more of it than a dark one. With the
        // engine's floor of 0.35 every board under the deck came out one gold-brown)
        c += uBWLColor * bWeb * uBWL.x * uBWLGain * bBand * bFace * bLive * (0.06 + 1.9 * albedo); }`,
  };
  const timberWear = wear('timber', { caustics: false });
  timberWear.extend = [].concat(timberWear.extend || [], bridgeLight);
  const opts = { at: [B.s, 0, 0], face: 'back', ...timberWear, materials: { rail: { crisp: true }, rope: { ...wear('plain'), crisp: true } } };
  if (QS.get('bridgetint')) opts.color = QS.get('bridgetint');           // (a developer's switch: a tint over the model's paint, to try a value)
  // (the struts' feet stand 1.0 m above the water, 0.6 m inside the towers' own circles: lower than a rider's head)
  const strutFeet = [[8.3, 0.55, 0.45], [8.3, -0.55, 0.45], [-8.3, 0.55, 0.45], [-8.3, -0.55, 0.45]];
  const [mid, left, right] = await Promise.all([
    kit.model('models/landing/bridge_mid.glb', { ...opts, collide: strutFeet }),
    kit.model('models/landing/bridge_left.glb', opts),
    kit.model('models/landing/bridge_right.glb', opts),
  ]);
  const models = { mid, left, right }, all = [left, mid, right];
  // The files carry some 470 named points. None rides on a moving part, so each is read ONCE, here, and its node is
  // taken out of the scene (470 empty nodes walked in every pass of every frame cost more than the bridge's draw
  // calls). model.point(name) goes on answering, from what was read.
  const place = new Map();
  for (const m of all) {
    m.group.name = 'bridge: ' + m.group.name;
    const mine = new Map();
    for (const [k, o] of Object.entries(m.points)) { const v = m.point(k); mine.set(k, v); place.set(k, v); o.removeFromParent(); }
    m.point = (name, target = new THREE.Vector3()) => { const v = mine.get(name); if (!v) console.error(`INVALID_MODEL the bridge has no point "${name}"`); return v ? target.copy(v) : target; };
  }
  /** A named point of the bridge (any of its three files), as a new Vector3 in the realm's own space. */
  const point = (name, target = new THREE.Vector3()) => { const v = place.get(name); if (!v) console.error(`INVALID_MODEL the bridge has no point "${name}"`); return v ? target.copy(v) : target; };

  // ---- what the model knows of itself: its named points, as places in the realm
  const named = (re) => { const out = []; for (const [k, v] of place) if (re.test(k)) out.push([k, v.clone()]); return out.sort((a, b) => (a[0] < b[0] ? -1 : 1)); };
  const railPts = named(/^rail_\d+$/).map(([, v]) => ({ d: dOf(v), v })).sort((a, b) => a.d - b.d);
  const rail = (d, out = new THREE.Vector3()) => {
    let i = 1; while (i < railPts.length - 1 && railPts[i].d < d) i++;
    const a = railPts[i - 1], b = railPts[i], t = Math.min(1, Math.max(0, (d - a.d) / (b.d - a.d || 1)));
    return out.lerpVectors(a.v, b.v, t);
  };
  const hooks = B.traps.map((d, i) => ({ d, at: (i < 5 ? left : i < 7 ? mid : right).point('hook_' + i) }));
  const posts = named(/^post_\d+$/).map(([, v]) => ({ d: dOf(v), top: v }));
  const piles = [];
  for (const [k, v] of named(/^pile_\d+_\d_w$/)) {
    const m = k.split('_'), tower = +m[1], n = +m[2], base = k.slice(0, -2);
    piles.push({ tower, k: n, d: dOf(v), off: offOf(v), at: v, r: point(base + '_r').distanceTo(v), mid: point(base + '_m'), head: point(base + '_h') });
  }
  const struts = [0, 1, 2, 3].map((i) => [mid.point(`strut_${i}_a`), mid.point(`strut_${i}_b`)]);
  // (a strut is a crooked log: its own centre line, foot to head, in five points; it lies up to 12 cm off the straight line)
  const strutLines = [0, 1, 2, 3].map((i) => [0, 1, 2, 3, 4].map((j) => mid.point(`strut_${i}_p${j}`)));
  const stumps = named(/^stump_\d+$/).map(([, v]) => v);
  const coil = mid.parts.coil || null, coilHang = mid.point('coil_hang');
  const painter = mid.parts.painter || null;                       // the end of an old painter left on the mooring ring of the inner left tower

  // ---- the weed skirts: twelve green ribbons 0.3 m long at the waterline of every pile, trailing down the current.
  // Still geometry with a slow sway of its own; the cast streams them (makeRibbons, kind 'weed') from `items`.
  // Each is rooted a hand under the surface, hangs down the timber for its first third and then lies along the
  // current, its tip lifting a little (weed floats). At the two inner towers, which the boat passes at 1.5 m, a
  // ribbon is a gutter with a darker midrib; further off it is a flat blade.
  const rnd = ctx.rng(4839), cur = [f.tx, f.tz], items = [];
  const pos = [], col = [], aux = [], index = [];
  const cRoot = new THREE.Color('#1f230f'), cMid = new THREE.Color('#3a3f1b'), cTip = new THREE.Color('#5d6230'), cDead = new THREE.Color('#5a4a26'), c = new THREE.Color(), c2 = new THREE.Color();
  for (const p of piles) {
    const near = Math.abs(p.d) < 12.4, SEG = near ? 7 : 4, RING = near ? 3 : 2;
    for (let k = 0; k < 12; k++) {
      const th = (k + rnd() * 0.7) / 12 * Math.PI * 2, rx = Math.cos(th), rz = Math.sin(th);
      const len = 0.3 * (0.8 + 0.5 * rnd()), w0 = 0.024 + 0.018 * rnd(), y0 = -0.025 - 0.11 * rnd(), phase = rnd() * 6.283, tone = 0.75 + 0.45 * rnd(), twist = (rnd() - 0.5) * 1.6;
      const dead = rnd() < 0.16, lift = 0.04 + 0.1 * rnd();
      const root = [p.at.x + rx * (p.r - 0.015), y0, p.at.z + rz * (p.r - 0.015)];
      const tipCol = dead ? cDead : cTip;
      items.push({ at: root, length: len, width: w0 * 1.5, color: '#' + c.copy(cMid).multiplyScalar(tone).getHexString(), tip: '#' + c.copy(tipCol).multiplyScalar(tone).getHexString(), direction: [cur[0], 0, cur[1]], phase });
      let x = root[0], y = root[1], z = root[2];
      const first = pos.length / 3;
      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG, a = (1 - u) * (1 - u), b = 0.25 + 1.3 * u;
        let dx = rx * a + cur[0] * b, dz = rz * a + cur[1] * b; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
        // across the ribbon: level, square to the way it runs, rolled a little along its length
        const roll = twist * u, wx = -dz * Math.cos(roll), wy = Math.sin(roll), wz = dx * Math.cos(roll), w = (w0 * (1 - 0.82 * Math.pow(u, 1.5))) / 2;
        const wave = 0.022 * Math.sin(phase + 6 * u) * u;
        const px = x - dz * wave, pz = z + dx * wave;
        c.copy(cRoot).lerp(cMid, Math.min(1, u * 2.2)).lerp(tipCol, Math.max(0, u * 1.6 - 0.6)).multiplyScalar(tone);
        if (RING === 3) {
          pos.push(px - wx * w, y - wy * w, pz - wz * w, px, y - 0.45 * w, pz, px + wx * w, y + wy * w, pz + wz * w);
          c2.copy(c).multiplyScalar(0.62);
          col.push(c.r, c.g, c.b, c2.r, c2.g, c2.b, c.r * 0.88, c.g * 0.88, c.b * 0.88);
          aux.push(u, phase, u, phase, u, phase);
        } else {
          pos.push(px - wx * w, y - wy * w, pz - wz * w, px + wx * w, y + wy * w, pz + wz * w);
          col.push(c.r, c.g, c.b, c.r * 0.82, c.g * 0.82, c.b * 0.82);
          aux.push(u, phase, u, phase);
        }
        if (i < SEG) {
          const q = first + i * RING;
          for (let j = 0; j < RING - 1; j++) index.push(q + j, q + j + 1, q + RING + j + 1, q + j, q + RING + j + 1, q + RING + j);
          const sink = 0.55 * Math.max(0, 1 - 2.4 * u), run = Math.sqrt(1 - sink * sink);
          x += dx * run * len / SEG; z += dz * run * len / SEG;
          y = Math.min(-0.012, y - (sink - lift * Math.max(0, u - 0.3)) * len / SEG);
        }
      }
    }
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  wg.setAttribute('aWeed', new THREE.Float32BufferAttribute(aux, 2)); wg.setIndex(index); wg.computeVertexNormals(); wg.computeBoundingSphere();
  const weedMat = kit.gouache({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.4, extend: [L.extend({ rim: 0.25 }), {
    uniforms: { uWeedAcross: { value: new THREE.Vector2(-cur[1], cur[0]) } },
    vertexPars: /* glsl */`attribute vec2 aWeed; uniform vec2 uWeedAcross;`,
    // a wave that runs down each ribbon and grows toward its free end (about 2 s, as short weed has)
    vertexWorld: /* glsl */`{ float lU = aWeed.x * aWeed.x; wp.xz += uWeedAcross * (sin(uTime * 2.9 + aWeed.y - aWeed.x * 5.0) * 0.03 + sin(uTime * 1.1 + aWeed.y * 1.7) * 0.02) * lU; wp.y += sin(uTime * 1.7 + aWeed.y * 2.3) * 0.012 * lU; }`,
  }] });
  const weed = new THREE.Mesh(wg, weedMat); weed.name = 'bridge: weed skirts';
  ctx.only(weed, 'direct'); ctx.add(weed);                       // (under the surface: nothing of it is in the water's mirror)

  shared.bridge = {
    frame: f, pt, deckTop: (d) => B.deckTop(d), railTop: railY, railOff: ro,
    /** the soffit: the underside of the baulks at d (the mayflies rest here; the swifts pass under it) */
    soffit: (d) => B.deckTop(d) - B.board - B.baulk[1],
    models, point, rail, railRadius: 0.03, hooks, posts, perch: mid.point('perch_h5'), piles, struts, strutLines, stumps, baulks: [-0.52, 0, 0.52], baulk: B.baulk.slice(),
    coil, coilHang, painter, weed: { mesh: weed, items, current: cur },
    /** the bridge's own water-light (bridgeLight, above): gain is a uniform ({ value: 1 }) for the staging to raise or still */
    waterLight: { gain: wlUniforms.uBWLGain, uniforms: wlUniforms, numbers: WLN },
    triangles: all.reduce((n, m) => n + m.triangles, 0) + index.length / 3,
  };
  (shared.counts || (shared.counts = {})).bridge = { triangles: shared.bridge.triangles, files: 3, piles: piles.length, posts: posts.length, weed: items.length,
    // (a check of the placing: a hook of the model against the plan's own frame; metres)
    hook0: { d: dOf(hooks[0].at), y: hooks[0].at.y, off: offOf(hooks[0].at), planD: B.traps[0], planY: railY(B.traps[0]) },
    // (the rail as it runs against the plan's nominal top, at the traps and at mid span: [d, the pole's middle, the plan's rail top, metres up-route])
    rail: [...B.traps, -3, 0, 2, 5].map((d) => { const v = rail(d); return [d, +v.y.toFixed(3), +railY(d).toFixed(3), +offOf(v).toFixed(3)]; }),
    perch: [+dOf(shared.bridge.perch).toFixed(3), +shared.bridge.perch.y.toFixed(3)], coilHang: [+dOf(coilHang).toFixed(3), +coilHang.y.toFixed(3)],
    // (the ground under the two ends, where the steps come down: [d, its height])
    ends: [-43.3, -44, -44.5, -45, -45.5, -46, 43.3, 44.5, 45.5, 46.2].map((d) => { const q = pt(d, 0, 0); return [d, +P.ground(ctx.path, q[0], q[2], {}).y.toFixed(3)]; }) };

  // A KICK FOR THE COIL (the cast's: the swifts shoot the span and their wind sets what hangs swinging; the traps have
  // the same in shared.kit.trapSwing.kick). shared.bridge.kickCoil(degrees = 5, seconds = 6): the hank swings that far
  // across the bridge about the post's head, out over the water and back against its post (1.5 s a swing), and dies away. Nothing calls
  // it yet: a picture is the same picture until something does.
  const swing = { t0: -1e9, amp: 0, life: 6 };
  shared.bridge.kickCoil = (degrees = 5, seconds = 6) => { swing.t0 = ctx.time; swing.amp = degrees * Math.PI / 180; swing.life = Math.max(1, seconds); };

  return {
    // the coil of rope hangs on its post and stirs in the evening air: the cast may take it over (shared.bridge.coil)
    update() {
      const t = ctx.time, k = ctx.reducedMotion ? 0.5 : 1;
      if (coil) {
        coil.rotation.z = k * (0.022 * Math.sin(t * 0.83) + 0.011 * Math.sin(t * 1.9 + 1.3)); coil.rotation.x = k * 0.012 * Math.sin(t * 0.61 + 0.7);
        const dt = t - swing.t0;
        // (outward only, toward the water: it hangs against its post and the rail, and falls back on them)
        if (dt >= 0 && dt < swing.life * 1.6) coil.rotation.x -= k * swing.amp * Math.exp(-3 * dt / swing.life) * Math.abs(Math.sin(dt * 2.1));
      }
      // the old painter's end hangs from its ring into the water, and the current stirs it (it hangs at its own pivot)
      if (painter) { painter.rotation.z = k * (0.035 * Math.sin(t * 0.52) + 0.014 * Math.sin(t * 1.31 + 0.4)); painter.rotation.x = k * 0.018 * Math.sin(t * 0.7 + 1.1); }
    },
  };
}
