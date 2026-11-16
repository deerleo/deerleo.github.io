// The landing: the other hero pieces (stage 2b's module). docs/art/landing.md, section 3 (the close band) and
// section 9 (the model list); docs/build/landing/2-heroes-mooring.md is this module's log.
//
// Five models, made by hand in Blender (source-art/models/landing/<name>.py; their shared makers ml.py; their places
// worked out from the plan by mooring_frames.mjs), each laid from one planned point toward another:
//
//   staithe    the boardwalk the boat is moored to, 11.6 by 1.0 m, deck at 0.55 m: seven pairs of hewn piles, the
//              mooring posts M1 (the painter) and M2 (the wet rope), a lashed rubbing strake, nailed boards, the wet
//              step at s 14, and its fixed dressing (coil, basket, reed scythe)
//   rick       the reed rick behind the staithe, 6 by 2.4 by 2.6 m: 389 butt ends to the water under a thatched cap
//   gangway    9.6 m of single plank on seven trestles, a hand line on the fen side
//   jetty      (shared with the far landing: the standing sky loads the same file) 6.0 by 1.3 m, deck at 0.6 m, four
//              bents, the head pair 0.9 m above the deck; the kept lamp's post is lashed to a fender pile on its
//              down-route flank (the lamp itself is placed in src/realms/landing.js); and keep_box, the landing's
//              own loose dressing, a wicker keep-box that rides the water beside it
//   punt       the sunk reed punt, 5.2 by 1.1 m, gunwale 0.3 m under water, turned 20 degrees
//
// and ONE STAND-IN that is not this group's: 'standin:gate_masts' (the Pilings group takes it out from its own
// module with removeStandIn and sets shared.heroes.gate again).
//
// shared.heroes gives the others their places: .staithe { M1, M2, deck, grooves, rings, pin, step, gap, coil, basket },
// .rick { ladder, eave }, .gangway { on, handLine, posts, rope, deck }, .jetty { corner, deck, piles, rings, ladder,
// step, lashing, fenders }, .keepBox { float, at }, .punt { bow, stern, ring }, .gate { lineY }.
// What moves here: the keep-box rides the water; the jetty's two rope fenders swing from the board's edge; the locks
// of sedge under the rick's eave stir with the reeds' wind (in the vertex shader).
// The creature heroes of the model list (heron, dragonfly, damselfly, pike) are the cast's: cast.js.

export async function build(ctx, plan, shared) {
  const L = shared.landing, P = plan, C = P.C, path = ctx.path, rnd = ctx.rng(1414), THREE = ctx.THREE;
  const A = (s, d, y = 0) => P.at(path, s, d, y);
  const tone = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k * (0.86 + 0.26 * rnd()));
  const set = (name, material) => { const items = []; return { items, beam: (a, b, w, h, color, ref) => items.push({ a, b, w, h, color, ref }), done: () => L.beams(name, items, material) }; };
  const timber = L.timber();
  const heroes = shared.heroes = {};

  // ---- a model stands where the plan says: its origin on the plan's point a = [s, d], its +X laid toward the plan's
  // point b. Each model's own places are worked out in that same frame (source-art/models/landing/mooring_frames.mjs),
  // so no place is typed twice; `agree` says so in the page's errors if a model and the plan have drifted apart.
  const stand = (a, b, lay = 'x') => { const p = A(a[0], a[1], 0), q = A(b[0], b[1], 0), ux = q[0] - p[0], uz = q[2] - p[2];
    return { position: [p[0], 0, p[2]], rotation: lay === 'y' ? Math.atan2(-ux, -uz) : Math.atan2(-uz, ux) }; };       // lay 'y': the model's own +Y (Blender's) is laid from a toward b
  const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''), TW = {}; for (const k of ['rim', 'sun', 'grain']) if (QS.has('m' + k)) TW[k] = +QS.get('m' + k);      // (a developer's switch: &mrim=0 &msun=0 &mgrain=0)
  // THE CLOTH'S SHADE: the staithe, the gangway, the jetty and the keep-box stand 49 to 61 m behind the door's nine
  // cloths, where the plan's own rule (PLAN.gate.shade, 1-layout.md K) puts everything under 4.3 to 5.3 m in their
  // shade. They used to wear `sun: 0` (always in shade) because the shade map had holes there; the Light group mended
  // the map (2-light.md, 23:50) and with it the pictures are the same to the pixel (&msun=1 against &msun=0, title view
  // and postcard D, 8 November), so these pieces now ask the map like everything else in the area.
  const SHADE = {};
  // two slots that the staithe, the gangway and the jetty share: DRY, level timber that never stands in the water (a
  // deck, a strake, a plank: no wet band, no dry line); FIT, the fittings: nails, bolts, rings, hoops and rope, drawn
  // crisp (the painter's filter wipes a nail head out, and a 2 cm line)
  const DRY = L.wear('timber', { ...SHADE, wet: false, ...TW }), FIT = { ...L.wear('plain', SHADE), crisp: true };
  // FAR_CRISP: a thin thing (a ladder's rungs, hazel spars) that is paint when near and a drawn line from `near` to `far`
  // metres on: the painter's filter wipes out what is thinner than its brush (the mark is the engine's own CRISP_ALPHA;
  // the same rule as light.js's crispFar, which is not offered for models)
  const farCrisp = (wear, near, far) => ({ ...wear, extend: { ...wear.extend, final: (wear.extend.final || '') + `{ float mK = smoothstep(${near.toFixed(1)}, ${far.toFixed(1)}, dist); if (mK > 0.0) gl_FragColor.a = 0.5 - 1.55 * mK - 13.95 * smoothstep(0.8, 1.0, mK); }` } });
  const model = (name, a, b, opts = {}) => { const { lay, shade, ...rest } = opts; return ctx.kit.model(`models/landing/${name}.glb`, { ...stand(a, b, lay), ...L.wear('timber', { ...(shade ? SHADE : {}), ...TW }), ...rest }); };
  const agree = (what, m, point, sd, within = 0.06) => { const q = m.point(point), w = A(sd[0], sd[1], 0), off = Math.hypot(q.x - w[0], q.z - w[2]);
    if (off > within) console.error(`INVALID_MODEL landing/heroes_b: ${what} stands ${off.toFixed(2)} m from the plan's place: run source-art/models/landing/mooring_frames.mjs and build the model again`); };

  // ============================================================================================ the staithe
  // `staithe.glb` (source-art/models/landing/staithe.py): seven pairs of adzed piles with proud heads, the mooring posts
  // M1 and M2 (rope grooves, an iron ring each), the rubbing strake, nailed boards worn down the middle, the wet step,
  // and its fixed dressing: the coil by M2, the basket on its side, the reed scythe leaning on the rick's corner.
  // Slots: 'paint' the timber that stands in the water (piles, frame, step: the ride's wet band and dry line are laid on
  // these); 'dry' the deck, the strake and the scythe (timber that never stands in the water: the ragged wet line, which
  // is drawn for piles, lay across the strake and the boards' edges in blotches); 'fittings' nails, bolts, rings, the
  // hoop, the pin, the scythe's blade and the rope (the coil, the strake's lashings), drawn CRISP (the painter's filter
  // wipes a nail head out); 'wicker' the basket.
  // (The kit's five traps and eight bundles stand on its deck at s 10.1 to 11.5 and s 13.5 to 15.5: that deck is clear.)
  { const S = P.staithe;
    const m = await model('staithe', [S.s[0], S.d[0]], [S.s[1], S.d[0]], { shade: true, materials: { dry: DRY, fittings: FIT, wicker: L.wear('wicker', SHADE) } });
    agree('staithe: M1', m, 'm1_foot', S.M1); agree('staithe: M2', m, 'm2_foot', S.M2); agree('staithe: its down-route end', m, 'deck_b', [S.s[1], (S.d[0] + S.d[1]) / 2]);
    const pt = (name) => m.point(name).toArray();
    heroes.staithe = { model: m, mesh: m.group, M1: pt('m1_top'), M2: pt('m2_top'), deck: S.deck, gap: pt('board_gone'), pin: pt('m2_pin_out'),
      // where a rope bears on each post (the middle of its upper and lower groove), its iron ring, the wet step, the coil
      grooves: { M1: [pt('m1_groove1'), pt('m1_groove2')], M2: [pt('m2_groove1'), pt('m2_groove2')] }, rings: { M1: pt('m1_ring'), M2: pt('m2_ring') },
      step: pt('step'), coil: pt('coil'), basket: pt('basket') };
    // the wet step stands 0.35 m out from the deck's edge, a hand inside the channel: a hull pressed hard against the
    // staithe just there (the channel's edge lets its side within 0.2 m of the deck) would stand in the step. One small
    // circle at its middle keeps the hull's middle a metre off it; everywhere else the hull still comes up to the strake
    { const q = m.point('step'); ctx.addCollider({ x: q.x, z: q.z, r: 0.05 }); }
    // the basket lies on its side: the wicker tile's stakes must run along the basket and its weavers round it, so the
    // slot is given the basket's own axis (from the model's two named points, in the model's own space)
    { const a = m.points.basket_foot, b = m.points.basket_mouth, U = m.materials.wicker && m.materials.wicker.uniforms && m.materials.wicker.uniforms.uLAxis;
      if (a && b && U) { const v = b.position.clone().sub(a.position).normalize(); U.value.set(v.x, v.y, v.z, 1); } }
    L.label('staithe', ...A((S.s[0] + S.s[1]) / 2, -9.45, 2.2)); }

  // ============================================================================================ the reed rick
  // `rick.glb` (source-art/models/landing/rick.py): some 400 bundles in fourteen courses, butt ends to the water, every
  // one a piece of its own; the end bundles side on; a staddle under it; a thatched cap in yealms with a ridge roll,
  // hazel liggers and cross spars; a ladder on the eave with its feet in the water. Slots: 'reed' (bundles and
  // thatch: the area's reed paint finds each bundle by itself), 'rods' the timber (staddle, ladder, hazel: paint when
  // near, drawn lines from 4.5 to 9 m on, because the painter's filter wipes a rung and a spar out).
  { const K = P.rick;
    // (axis: every bundle lies across the rick and the thatch runs down its slopes, so the reed's grain is given once for
    // the whole slot, along the model's own Y: left to find each yealm's line by itself, the paint turned the cut eave
    // into chevrons)
    // THE EAVE STIRS: the locks of sedge that hang from under the cap's lip (the model's slot 'fringe') lean and shiver with
    // the same wind that leans the reeds behind them (L.wind, PLAN.wind: the same travelling wave), more toward their
    // points, not at all where they are rooted; staging's hush stills them with the reeds.
    const W = P.wind, uMEave = { value: 2.0 };
    const stir = { uniforms: { uLWind: L.wind, uMEave }, vertexPars: 'uniform vec4 uLWind; uniform float uMEave;',
      vertexWorld: /* glsl */`{ float mK = clamp((uMEave - wp.y) / 0.3, 0.0, 1.0);
        float mCrest = 0.5 + 0.5 * sin(dot(wp.xz, uLWind.xy) * ${(2 * Math.PI / W.length).toFixed(4)} - uTime * ${(2 * Math.PI / W.period).toFixed(4)});
        float mJ = fract(sin(dot(floor(wp.xz * 11.0), vec2(12.9898, 78.233))) * 43758.5453);
        wp.xz += uLWind.xy * ((0.15 + 0.85 * mCrest) * 0.045 * uLWind.z * mK * mK) + vec2(sin(uTime * 4.9 + mJ * 40.0), cos(uTime * 4.3 + mJ * 31.0)) * (0.007 * mK * uLWind.z); }` };
    const reedWear = L.wear('reed', { axis: [0, 0, 1] });
    const m = await model('rick', [K.s[0], K.d[0]], [K.s[1], K.d[0]], { materials: { reed: reedWear, rods: farCrisp(L.wear('timber', TW), 4.5, 9), fringe: { ...L.wear('reed', { axis: [0, 0, 1] }), extend: [L.wear('reed', { axis: [0, 0, 1] }).extend, stir] } } });
    agree('rick: its down-route corner', m, 'corner_b', [K.s[1], K.d[0]]);
    uMEave.value = m.point('eave').y;
    heroes.rick = { model: m, mesh: m.group, eave: m.point('eave').toArray(), ladder: { foot: m.point('ladder_foot').toArray(), top: m.point('ladder_top').toArray() } };
    L.label('rick', ...A((K.s[0] + K.s[1]) / 2, (K.d[0] + K.d[1]) / 2, K.height + 0.8)); }

  // ============================================================================================ the gangway
  // `gangway.glb` (source-art/models/landing/gangway.py): four planks that do not quite line up, in two legs with a
  // knee; seven trestles of thin crooked stakes, each with a cross pole lashed on; a hand line of old rope on the fen
  // side, hitched to the tall stake of every other trestle and sagging between them. It is laid from the staithe's
  // end toward the jetty's flank. Slots: 'paint' the stakes, 'dry' the planks and cross poles, 'fittings' the rope and
  // the nails (drawn crisp: the line is 2 cm thick).
  { const G = P.gangway, pts = G.line;
    const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), total = lens.reduce((a, b) => a + b, 0);
    // on(u): the plan's own line, [s, d] at the share u (0..1) of its length
    const on = (u) => { let r = u * total; for (let i = 0; i < lens.length; i++) { if (r <= lens[i] || i === lens.length - 1) { const k = r / lens[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } r -= lens[i]; } };
    const m = await model('gangway', pts[0], pts[2], { shade: true, materials: { dry: DRY, fittings: FIT } });
    agree('gangway: its knee', m, 'knee', pts[1]); agree('gangway: its end at the jetty', m, 'end', pts[2], 0.15);
    const pt = (name) => m.point(name).toArray(), four = [1, 2, 3, 4], rope = [];
    for (let i = 0; i < 12; i++) rope.push(pt('line_' + i));
    // handLine: where the line is hitched to each of its four stakes (as the stand-in gave it); posts: their heads;
    // rope: twelve places along the line itself, sag and all (a perch)
    heroes.gangway = { model: m, mesh: m.group, on, handLine: four.map((i) => pt('knot_' + i)), posts: four.map((i) => pt('post_' + i)), rope, deck: G.deck };
    L.label('gangway', ...A(24, -10.6, 2.0)); }

  // ============================================================================================ the jetty
  // `jetty.glb` (source-art/models/landing/jetty.py): the ride's jetty, shared with the far landing (the standing sky
  // loads the same file). Its front is its head; it is laid from the head's middle toward its root. Four bents, the
  // head pair 0.9 m above the deck as mooring posts, braces, a rubbing pole and a three-rung ladder at the head, two
  // rope fenders, two rings, a toe rail, a step at the root; and on its down-route flank the fender pile to which
  // the kept lamp's crooked post is lashed (the part `lamp_lashing`: the lamp itself is placed in src/realms/landing.js
  // and is not touched here). Slots: 'paint' the timber that stands in the water, 'dry' the deck, toe rail and rubbing
  // pole, 'fittings' nails, bolts, hoops, rings and rope (crisp).
  // `keep_box.glb` (the same script): the landing's own loose dressing, in the jetty's frame: its two tethers, and the
  // wicker keep-box itself (the part `float`), which rides the water beside the flank.
  const afloat = [], hung = [];
  { const J = P.jetty, head = [J.s, J.d[1]], root = [J.s, J.d[0]];
    const m = await model('jetty', head, root, { lay: 'y', shade: true, materials: { dry: DRY, fittings: FIT } });
    agree('jetty: the lamp post\'s place', m, 'lamp_post', P.lamp.post, 0.03); agree('jetty: its root', m, 'root', root); agree('jetty: where the gangway lands', m, 'gangway', P.gangway.line[2]);
    const pt = (name) => m.point(name).toArray(), piles = [];
    for (let i = 1; i <= 8; i++) piles.push(pt('pile_' + i));
    piles.push(pt('fender_pile'));
    heroes.jetty = { model: m, mesh: m.group, corner: { up: pt('head_left_top'), down: pt('head_right_top') }, deck: J.deck,
      piles, rings: { post: pt('ring_post'), edge: pt('ring_edge') }, ladder: pt('ladder'), step: pt('step'), lashing: m.parts.lamp_lashing,
      fenders: [m.parts.fender_left, m.parts.fender_right].filter(Boolean) };
    // the two rope fenders hang from the board's edge (each part's own origin is where it hangs from): they swing a
    // degree or two along the flank, and more for a while after a hull has passed
    heroes.jetty.fenders.forEach((part, i) => { const q = part.getWorldPosition(new THREE.Vector3()); ctx.group.worldToLocal(q); hung.push({ part, x: q.x, z: q.z, kick: 0, seed: 1.3 + 2.1 * i }); });
    const box = await ctx.kit.model('models/landing/keep_box.glb', { ...stand(head, root, 'y'), ...L.wear('plain', SHADE), materials: { wicker: L.wear('wicker', SHADE), fittings: FIT } });
    const at = box.point('box_at'), part = box.parts.float;
    if (part) afloat.push({ part, x: at.x, z: at.z, y0: part.position.y, turn: part.rotation.y, kick: 0, wet: 0, seed: 2.7 });
    ctx.addCollider({ x: at.x, z: at.z, r: 0.5 });                        // it lies a hand inside the channel's edge: the hull goes round it
    heroes.keepBox = { model: box, float: part, at: at.toArray() };
    L.label('jetty', ...A(J.s, (J.d[0] + J.d[1]) / 2, 2.2)); }

  // ============================================================================================ the sunk punt
  // `punt.glb` (source-art/models/landing/punt.py): a reed punt kept under water, lying on the bed with its gunwale
  // 0.3 m down, heeled and down by the stern; a stem with a ring, a transom, four ribs, a thwart, three stones that
  // hold it down, a season's silt in its bottom. It is PAINTED FOR WATER (pale wherever it looks up) and wears the
  // timber's grain with no wet band (that would darken all of it by a third). It is laid along its own length, turned
  // 20 degrees to the path, and is drawn in the direct view only (nothing of it stands above the water to be mirrored).
  { const U = P.punt, t = U.turn * Math.PI / 180;
    const m = await ctx.kit.model('models/landing/punt.glb', { ...stand(U.at, [U.at[0] + Math.cos(t), U.at[1] + Math.sin(t)]), ...L.wear('timber', { wet: false, caustics: false, sun: 0 }) });
    ctx.only(m.group, 'direct');
    agree('punt: its middle', m, 'middle', U.at, 0.03);
    heroes.punt = { model: m, mesh: m.group, bow: m.point('bow').toArray(), stern: m.point('stern').toArray(), ring: m.point('ring').toArray() };
    L.label('sunk punt', ...A(U.at[0], U.at[1], 0.6)); }

  // ============================================================================================ the gate masts
  { const G = P.gate, T = set('gate_masts', timber), f = L.frame(G.s, {}), tops = [];
    for (const k of [-1, 1]) {
      const foot = A(G.s, k * G.mast, -1.2), top = A(G.s + 0.1, k * (G.mast - 0.12), G.mastHeight);
      T.beam(foot, top, G.mastThick, G.mastThick, tone(C.timberOld), [f.rx, 0, f.rz]);
      for (const j of [-1, 1]) T.beam(A(G.s + j * 3.1, k * (G.mast + 0.9), 0.2), A(G.s + j * 0.1, k * (G.mast - 0.05), 6.2), 0.16, 0.16, tone(C.timberOld));      // two raking props each
      tops.push(k);
    }
    // the line, from mast to mast at 9.2 m, with a sag of 0.35 m
    const lineY = (d) => G.line - G.sag * (1 - (d / G.mast) ** 2), n = 10;
    for (let i = 0; i < n; i++) { const a = -G.mast + 2 * G.mast * i / n, b = -G.mast + 2 * G.mast * (i + 1) / n; T.beam(A(G.s, a, lineY(a)), A(G.s, b, lineY(b)), 0.035, 0.035, tone(C.straw, 0.9)); }
    heroes.gate = { mesh: T.done(), lineY };
    L.label('gate masts', ...A(G.s, 0, G.mastHeight + 1)); }

  // ---- what floats rides the water: the keep-box lies low beside the jetty, rocks a little by itself, and more for a
  // while after a hull has passed within five metres (its ring on the water every second or so while it rocks)
  const calm = ctx.reducedMotion ? 0.4 : 1;
  return {
    update(dt, ctx) {
      const t = ctx.time, bx = ctx.boat.x, bz = ctx.boat.z, sp = Math.abs(ctx.boat.speed || 0);
      for (const f of afloat) {
        const near = Math.max(0, 1 - Math.hypot(bx - f.x, bz - f.z) / 5) * Math.min(1, sp / 1.2);
        f.kick = Math.max(f.kick * Math.exp(-dt / 5), near);
        const k = (1 + 3.2 * f.kick) * calm, p = f.part;
        p.position.y = f.y0 + ctx.water.heightAt(f.x, f.z) + 0.006 * k * Math.sin(t * 1.31 + f.seed);
        p.rotation.x = 0.018 * k * Math.sin(t * 1.07 + f.seed * 2.0);
        p.rotation.z = 0.026 * k * Math.sin(t * 0.83 + f.seed);
        p.rotation.y = f.turn + 0.03 * Math.sin(t * 0.21 + f.seed);
        f.wet -= dt;
        if (f.kick > 0.25 && f.wet <= 0) { f.wet = 1.1 + 0.6 * Math.sin(t * 3.1 + f.seed) ** 2; ctx.water.ripple(f.x, f.z, 0.07 * f.kick, 0.25); }
      }
      for (const h of hung) {
        const near = Math.max(0, 1 - Math.hypot(bx - h.x, bz - h.z) / 6) * Math.min(1, sp / 1.2);
        h.kick = Math.max(h.kick * Math.exp(-dt / 6), near);
        const a = (0.014 + 0.07 * h.kick) * calm, p = h.part;
        p.rotation.x = a * Math.sin(t * 1.9 + h.seed) + 0.3 * a * Math.sin(t * 3.1 + h.seed * 2.0);      // along the flank, as a thing hung against a pile can
        p.rotation.y = 0.5 * a * Math.sin(t * 0.7 + h.seed);                                             // and it turns a little on its lanyard
      }
    },
  };
}
