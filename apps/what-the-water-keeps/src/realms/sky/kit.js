// The standing sky: KIT PIECES, standing multitudes and the close band (docs/art/sky.md, sections 3 and 9).
//
// THE WORKS (stage 2, the Works group: docs/build/sky/2-kit-works.md, with its "Second look") are REAL and are made here.
// Their numbers are in plan.js under "THE WORKS" (plan.works); their models in assets/models/sky/, scripts in
// source-art/models/sky/ (works_lib.py is what the timber pieces share):
//   causeway, straight (12 placed)       causeway_a, causeway_b (12 m) and causeway_c (8 m), laid by plan.works.runs:
//                                        boards with worn arrises nailed to driven posts, a king post at each joint,
//                                        nail-weep, salt runs, a lip of crust at the water, small things left on the top
//   sluice mouth with gate (4)           sluice (wing walls, posts with through tenons, beam, braces, peg rack, stop boards,
//                                        the white sill and the rose apron of dried brine) and sluice_board (the lifting
//                                        board, drawn up by plan.works.lift), at s 162 and 206 (right), 178 and 222 (left)
//   causeway end cap (4)                 end_cap: splayed staves under an iron band, the mooring post and its cleat
//   salt heaps (5 variants, 64 placed)   cone_a .. cone_e and the far forms cone_a_far, cone_b_far, cone_e_far: 45 degrees,
//                                        4 m across; on the causeways half on the bank and half in the pan; in the pans
//                                        on the nearest rims; and the first row right of the flats
//   far salt heaps (400)                 grown here: one draw, in runs along the rims out to 300 m
//   brine pans, 20 by 30 m               floors in the painted `brine` (direct view only), the brine's own colour on them
//                                        at first light; rims: rim_a, rim_b near the route, a plain stretch grown here far off
// The works' own additions to the area's paint, each told where by MARKS the models carry in their UVs:
//   GRAIN, TIDE, TOP, LOOSE (timber and banks: u = 1 a level board, 2 a stain; v = 1 a bank's top, 2 crust, 3..4 what
//   hangs loose), HEAP (the heaps: u = a rake's furrows, 2 the wall of a cut; v = crust), RIM, WINDWARD (older grey on
//   the east side of every heap), FAR_CRISP (thin timber kept out of the painter's filter far off).
// Colliders for the works are made here, as the layout made them, and one for every heap that stands in the lake.
//
// The rest of this file is still the layout's STAND-INS, and belongs to other groups, who take each stand-in out from
// their own module (removeStandIn) as its real thing stands; the lines are deleted later:
//   mooring stake (4 variants, 9 placed)        Shallows (kit_shallows.js)
//   rake (5), shovel (4), flat barrow (2), baskets (8), yoke with two pails, plank run; the drowned plank walk, barrow
//   wheel and lost rake                         Tools (kit_tools.js)
//   sedge (90 tufts in 30 groups); crust terraces of the left flats                             Shallows
// They draw their places from the module's shared random sequence `rnd`; the Works group has its own (`wr`, `pr`) and
// leaves `rnd` exactly where the layout's stand-ins for the works left it.
// What this module puts in `shared`: shared.stakes = [{ x, z, top, lean }] (the stand-in stakes, until the Shallows
// group's replace them), shared.cones = { near: [{ x, z, h, r, y, top, bx, bz, s, d, variant, turn }], far: n } (x, z:
// where the cone's TOP stands; top: its height above the water; bx, bz: the middle of its foot; r: the radius of its
// foot at its ground; y: the ground it stands on (0.29 on a bank, 0 in a pan); h: its height above that), shared.pans =
// the pan blocks as built, shared.works = { sluices, boards, boardAt, leaks, bankHeaps }.
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan, C = P.colors, sky = shared.sky, path = ctx.path, rnd = ctx.rng(41);
  const heading = (s) => path.at(s).heading;
  const box = (name, at, size, color, turn = 0, paint) => sky.standIn({ name, at, size, color, turn, paint });
  const collide = (s, d, r, soft) => { const p = kit.at(s, d); ctx.addCollider(soft ? { x: p.x, z: p.z, r, soft } : { x: p.x, z: p.z, r }); };
  const instanced = (name, geo, mat, list) => { const m = kit.instances(geo, mat, list); m.name = 'standin:' + name; return m; };

  // ---------------------------------------------------------------------------------------------- mooring stakes
  // STAND-IN for the mooring stake (4 variants): 1.0 to 1.3 m above the water, 16 to 20 cm thick, leaning 0 to 6 degrees.
  {
    const geo = new THREE.CylinderGeometry(0.085, 0.1, 1, 9); geo.translate(0, 0.5, 0);
    const collar = new THREE.CylinderGeometry(0.13, 0.19, 0.24, 9); collar.translate(0, 0.02, 0);
    const posts = [], collars = [], stakes = shared.stakes = [];
    P.stakes.s.forEach((s, i) => {
      const p = kit.at(s, P.stakes.d + (rnd() - 0.5) * 0.2), high = 1.0 + 0.3 * rnd(), lean = (rnd() * 6) * Math.PI / 180, turn = rnd() * Math.PI * 2;
      posts.push({ position: [p.x, -0.45, p.z], rotation: [Math.sin(turn) * lean, turn, Math.cos(turn) * lean], scale: [1 + 0.2 * rnd(), high + 0.45, 1 + 0.2 * rnd()], color: i % 3 === 1 ? '#f2eef4' : '#ffffff' });
      collars.push({ position: [p.x, 0, p.z], rotation: turn, scale: 0.9 + 0.3 * rnd() });
      stakes.push({ x: p.x + Math.cos(turn) * lean * high * 0.3, z: p.z, top: high, lean, tern: P.stakes.terns.includes(i) });
      ctx.addCollider({ x: p.x, z: p.z, r: 0.42 });
    });
    instanced('mooring stakes', geo, sky.paint({ color: C.timber }), posts);
    instanced('mooring stake: crust collars', collar, sky.paint({ color: '#d9d0c8' }), collars);
  }

  // ---------------------------------------------------------------------------------------------- causeways and sluices
  // (the heaps that stand on the banks, as [x, z, radius of the foot on the bank]: filled in where the heaps are placed,
  // below; the bank's top paints the salt spilled round each one)
  const HEAPS_MAX = 30, heapsU = { value: Array.from({ length: HEAPS_MAX }, () => new THREE.Vector3(0, 0, -10)) };
  // What the Works group's timber and banks wear, besides the area's light, its timber and its salt (light.js). The
  // models say where with two marks in their UVs (source-art/models/sky/works_lib.py, `mark`): u = 1 on a board that lies
  // level in a wall, 2 on a stain lying on a board (a nail's weep, a run of salt); v = 1 on the top of a bank, 2 on crust.
  // GRAIN: light.js draws timber's grain DOWN every upright face, which is right for a post and a stave; a board that
  //   lies level in a revetment has its grain along it. Drawn here, along the wall, with salt bloomed in it.
  // TIDE: the page's "three crust tide lines" on everything dark that stands in the lake: a band of white crust at 5 cm,
  //   a thinner one at 12 and a faint one at 20, each GROWN IN LUMPS (the painted crust's lobes laid along the wall
  //   decide its edges: the first version's three wandering lines were an instrument's trace), the upper two there for a
  //   stretch and gone for a stretch; a haze of salt between; the wet dark below the lowest. By height in the lake, so
  //   the lines run true from piece to piece, round every post and through every sluice.
  // TOP: the top of a bank. The TRODDEN PATH along its channel side (grey wet clay a metre wide, wandering), a barrow's
  //   one wheel rut in it; the crust either side crazed into cells; and round every heap THE SALT SPILLED from it, pale
  //   and ragged, lying over path and crust alike (uHeaps: the heaps' places, filled in where they are set out, below).
  // (the route is straight: -z runs along it and x across; a texture is never read inside an `if`: there the picture's
  // own slopes are not known and it comes back as its average)
  const saltCol = { hol: new THREE.Color((P.salt || {}).hollow || '#8E86B0'), chalk: new THREE.Color(C.chalk) };
  const worksU = { tSalt: sky.tiles.tSalt, tCrust: sky.tiles.tCrust, tTimber: sky.tiles.tTimber, uSaltChalk: { value: saltCol.chalk },
    uSaltHollow: { value: new THREE.Vector3(saltCol.hol.r / saltCol.chalk.r, saltCol.hol.g / saltCol.chalk.g, saltCol.hol.b / saltCol.chalk.b) } };
  const WORKS_PARS = `uniform sampler2D tSalt, tCrust, tTimber; uniform vec3 uSaltHollow, uSaltChalk; uniform vec3 uHeaps[${30}];
    float dressHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }`;
  const WORKS_ALBEDO = (top) => `{
      float mU = vUv0.x, wLevel = clamp(mU, 0.0, 1.0) * (1.0 - smoothstep(1.2, 1.8, mU)), wStain = smoothstep(1.2, 1.8, mU);
      float tPale = dot(uColor * vColor.rgb, vec3(0.2126, 0.7152, 0.0722)), wDark = 1.0 - smoothstep(0.34, 0.52, tPale);
      float wAlong = abs(N.x) > abs(N.z) ? vWPos.z : vWPos.x;
      // GRAIN (the ride's dry-brush tile drawn out long and read as numbers: about 0.30 to 0.41): along a board that lies
      // level, down an upright thing, along the route on a thing's top; salt bloomed white in it, more on what looks up
      vec2 wgUV = wLevel > 0.5 ? vec2(wAlong * 0.21, vWPos.y * 2.9) : abs(N.y) > 0.7 ? vec2(vWPos.x * 1.9, vWPos.z * 0.2) : vec2((vWPos.x + vWPos.z) * 1.9, vWPos.y * 0.2);
      float wg = clamp((texture2D(tBrush, wgUV).r - 0.355) * 16.0, -1.0, 1.0), wTimber = wDark * (1.0 - wStain);
      albedo *= mix(1.0, 0.8 * (1.0 + 0.2 * wg), wTimber);
      albedo = mix(albedo, uSaltChalk * 0.9, smoothstep(0.45, 1.0, wg) * (0.16 + 0.22 * max(N.y, 0.0)) * wTimber);
      // THE FIGURE of weathered boards: the landing's timber tile, the ride's one timber picture (a neutral layer: checks,
      // knots, the weep under a nail), its grain ALONG a board that lies level, DOWN an upright thing, along the route on
      // a top. Five painted boards to the metre: a level board's own seam (0.125 m) is one of the picture's.
      vec2 wfUV = wLevel > 0.5 ? vec2(vWPos.y - 0.125, wAlong / 1.6) : abs(N.y) > 0.7 ? vec2(vWPos.x, vWPos.z / 1.6) : vec2(wAlong + 0.05 * vWPos.y, vWPos.y / 1.6);
      albedo *= mix(vec3(1.0), texture2D(tTimber, wfUV).rgb * 2.0, 0.62 * wTimber);
      // TIDE
      float tw = wDark * (1.0 - wStain) * step(-0.03, vWPos.y) * step(vWPos.y, 0.34);
      vec3 tLob = texture2D(tSalt, vec2(wAlong * 1.1, vWPos.y * 3.1)).rgb;
      vec3 tSlow = texture2D(tCrust, vec2(wAlong * 0.045, wAlong * 0.11 + 0.37)).rgb;
      float tHere = tSlow.b, tWander = tSlow.r;
      float ty = vWPos.y + 0.014 * (tWander - 0.5);
      float lA = smoothstep(0.92, 1.08, tLob.b * 0.75 + (1.0 - abs(ty - 0.05) / 0.026) * (0.62 + 0.5 * tWander));
      float lB = smoothstep(1.05, 1.2, tLob.b * 0.9 + (1.0 - abs(ty - 0.118) / 0.014)) * smoothstep(0.38, 0.55, tHere) * 0.85;
      float lC = smoothstep(1.1, 1.3, tLob.b * 0.95 + (1.0 - abs(ty - 0.198) / 0.017)) * (1.0 - smoothstep(0.36, 0.5, tHere)) * 0.6;
      float tHaze = (1.0 - smoothstep(0.06, 0.24, ty)) * smoothstep(0.03, 0.06, ty) * smoothstep(0.45, 0.8, tLob.g) * 0.32;
      albedo *= mix(1.0, 0.55, (1.0 - smoothstep(0.015, 0.045, ty)) * tw);
      albedo = mix(albedo, vec3(0.93, 0.89, 0.80), clamp(lA + lB + lC + tHaze, 0.0, 1.0) * tw);
      // crust (the mark 2 in v): the painted crust's lobes, on a lip at the waterline, a lobe at a post's foot, a sill of dried brine
      albedo *= mix(vec3(1.0), mix(uSaltHollow, vec3(1.0), smoothstep(0.12, 0.7, texture2D(tSalt, vWPos.xz / 0.58).b)), 0.7 * smoothstep(1.2, 1.8, vUv0.y) * (1.0 - smoothstep(2.3, 2.8, vUv0.y)) * smoothstep(0.3, 0.6, N.y));
      ${top ? `
      // TOP
      float topM = clamp(vUv0.y, 0.0, 1.0) * (1.0 - smoothstep(1.2, 1.8, vUv0.y)) * (1.0 - wDark);
      vec3 pS = texture2D(tCrust, vWPos.xz * 0.13 + 0.3).rgb;
      float pSlow = pS.b, pMid = pS.r;
      vec3 pCell = texture2D(tCrust, vWPos.xz / 1.7).rgb, pGrain = texture2D(tSalt, vWPos.xz / 0.9).rgb;
      float pAcross = abs(vWPos.x), pLine = 22.7 + 0.14 * (pSlow - 0.5) + 0.05 * sin(vWPos.z * 0.9);
      float path = (1.0 - smoothstep(0.24, 0.58, abs(pAcross - pLine))) * (0.72 + 0.28 * smoothstep(0.3, 0.7, pMid));
      float rut = 1.0 - smoothstep(0.012, 0.03, abs(pAcross - pLine - 0.05 * sin(vWPos.z * 2.3) - 0.03));
      float spill = 0.0;
      if (topM > 0.001) for (int i = 0; i < 30; i++) {
        vec3 hp = uHeaps[i];
        if (hp.z < 0.0) break;                                                                       // (the places are filled from the front)
        float hd = length(vWPos.xz - hp.xy) - hp.z;
        spill = max(spill, step(0.0, hp.z) * (1.0 - smoothstep(0.02 + 0.22 * pSlow, 0.12 + 0.55 * pSlow + 0.22 * pGrain.b, hd)));
      }
      float crack = (1.0 - smoothstep(0.08, 0.27, pCell.g)) * (1.0 - 0.8 * path);
      vec3 topCol = albedo * (0.88 + 0.18 * pCell.r) * (1.0 - 0.3 * crack);                          // crust: pitted, crazed into cells
      topCol = mix(topCol, topCol * vec3(0.66, 0.63, 0.72), path);                                      // the path: trodden to grey clay (third version: darker: seen along the bank from the boat it was not seen at all)
      topCol *= 1.0 - 0.3 * rut * path;                                                               // a barrow's one wheel
      topCol = mix(topCol, vec3(0.955, 0.93, 0.86) * (0.9 + 0.14 * pGrain.r), spill * 0.88);           // salt spilled from a heap
      albedo = mix(albedo, topCol, topM);` : ''}
    }`;
  // LOOSE: what hangs loose stirs when the wind has come (the board that hangs by the nails of one end; the rope's end on
  // an end cap's cleat; a mooring line's end on a king post; and, as cloth, a marker rag: the marks 5 to 6): the models
  // mark it (v = 3 where it is held .. 4 at its free end). Nothing before the wind: the
  // night is still. uWorksGust: the way the wind blows (x, z) and how hard (set in update from the area's wind).
  const gustU = { value: new THREE.Vector3(0, 1, 0) };
  const LOOSE = { uniforms: { uWorksGust: gustU }, vertexPars: 'uniform vec3 uWorksGust;',
    vertexWorld: `{ float lw = clamp(uv.y - 3.0, 0.0, 1.0) * step(uv.y, 4.5), cw = clamp(uv.y - 5.0, 0.0, 1.0);
      if (lw > 0.0) { float lg = uWorksGust.z * lw * lw, lp = uTime * 2.1 + wp.x * 0.7 + wp.z * 0.9;
        wp.xz += uWorksGust.xy * lg * (0.035 + 0.03 * sin(lp) + 0.012 * sin(lp * 2.7)); wp.y += lg * 0.014 * sin(lp * 1.3 + 1.0); }
      // (cloth, the marks 5 to 6: a marker rag streams out downwind, its hem lifted, and flutters; slower than two beats a second)
      if (cw > 0.0) { float cg = uWorksGust.z * cw, fl = 0.6 * sin(uTime * 7.3 + cw * 5.0 + wp.x) + 0.4 * sin(uTime * 11.3 + cw * 9.0);
        wp.xz += uWorksGust.xy * cg * (0.19 + 0.05 * fl); wp.y += cg * (0.13 * cw + 0.03 * fl); } }` };
  const TIDE = { ...LOOSE, uniforms: { ...worksU, uHeaps: heapsU, uWorksGust: gustU }, fragmentPars: WORKS_PARS, albedo: WORKS_ALBEDO(true) };
  const TIDE_THIN = { ...LOOSE, uniforms: { ...worksU, uHeaps: heapsU, uWorksGust: gustU }, fragmentPars: WORKS_PARS, albedo: WORKS_ALBEDO(false) };
  // FAR_CRISP: thin timber (posts, beams, pegs) keeps out of the painter's filter once it is far enough off to be thinner
  // than the brush (from about 8 m); nearer it is painted like everything else. Only while its air is open: a thing that
  // is still blended into the night cannot carry the mark (light.js).
  const FAR_CRISP = { final: 'if (uAir.x > 900.0) gl_FragColor.a = mix(gl_FragColor.a, -15.0, smoothstep(7.0, 14.0, dist));' };
  // (NOT light.js's painted salt and timber: on the works GRAIN is the timber, TOP and the crust mark are the salt, and
  // asking light.js for `timber` and `salt: 'pan'` as well cost seventeen texture reads on every pixel of every board,
  // three times a frame. The colours it gave are kept: its timber was, as read, a darkening by a fifth. A few crystals
  // still catch a star on what is pale: WORKS_GLINT, the same cells and numbers as light.js's glints.)
  const WORKS_GLINT = (() => { const G = (P.salt || {}).glints || {}, until = G.until || [0.08, 0.35]; return { light: `{
      float gPale = smoothstep(0.4, 0.56, dot(uColor * vColor.rgb, vec3(0.2126, 0.7152, 0.0722)));
      float gd = max(length(vViewPos), 1.0), lv = log2(gd), g0 = floor(lv), gf = lv - g0, lit = 0.0;
      for (int i = 0; i < 2; i++) {
        float cell = ${Number(G.cell ?? 0.02).toFixed(4)} * exp2(g0 + float(i)), wgt = i == 0 ? 1.0 - gf : gf;
        vec3 q = vWPos / cell, id = floor(q), f = fract(q) - 0.5;
        float r1 = dressHash(id), r2 = dressHash(id + 17.3), r3 = dressHash(id + 41.7);
        float spot = 1.0 - smoothstep(0.02, 0.11, length(f - 0.5 * (vec3(r2, r3, fract(r1 * 57.0)) - 0.5)));
        lit += step(${(1 - 1 / (G.one ?? 70)).toFixed(5)}, r1) * wgt * spot * (0.55 + 0.45 * sin(uTime * (1.2 + 1.6 * r2) + r3 * 40.0));
      }
      glow += vec3(0.86, 0.91, 1.0) * (lit * 0.4 * gPale * (1.0 - smoothstep(${Number(until[0]).toFixed(3)}, ${Number(until[1]).toFixed(3)}, uSunline.w)));
    }` }; })();
  // LANTERN: the works take the bow lantern's light by the square of the distance (plan.works.lantern), as the Shallows
  // and Timber groups' things do: all of it at arm's length, a fifth of it at 3 m. The ride's lantern is even to a
  // quarter of its reach and dies at seven metres: every board, bank and heap within eight metres was one mauve pink.
  const LANTERN = { light: `{ vec3 wkL = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (min(${Number(P.works.lantern ?? 2.2).toFixed(2)} / (1.0 + dot(wkL, wkL)), 1.0) - 1.0); }` };
  const worksPaint = { brush: 0.8, extend: [...sky.extend({ air: 'near' }), LANTERN, TIDE, WORKS_GLINT],
    materials: { thin: { extend: [...sky.extend({ air: 'near' }), LANTERN, TIDE_THIN, FAR_CRISP] } } };
  // (the lake's bed writes no depth: a thing drawn after it shows THROUGH the sand wherever it goes down under the bed.
  // The heaps and the rims stand in the lake outside the pans too: drawn before the bed, the bed covers what is under it)
  const bedOrder = ((ctx.group.getObjectByName('lake bed') || ctx.group.getObjectByName('standin:lake bed') || {}).renderOrder) ?? -6;
  // (only while a thing is solid: while the night air holds it, it is blended, and a blended thing drawn that early is
  // taken for something under the water: the heaps and rims then showed through the mirror at s 94 as a rust line on the
  // seam of the empty first act. The module's update keeps the two in step.)
  const underBedMeshes = [], underBed = (m) => { for (const mesh of m.meshes) underBedMeshes.push(mesh); };
  const PIECE_TINT = ['#ffffff', '#f4f0f3', '#faf5ee', '#f1eef2'];
  {
    const Cw = P.causeway, Wk = P.works, mid = Cw.inner + Cw.width / 2;
    // THE CAUSEWAYS (the page: straight 12 m, 2 variants, 12 placed): causeway_a (sound) and causeway_b (failing), with
    // causeway_c, a 12 m piece cut to 8, for the two short runs by the mouths. The layout's runs between the mouths are 9,
    // 38 and 23 m (right) and 25, 38 and 7 m (left): each run is filled by its pieces stretched or shrunk alike along the
    // bank (plan.works.runs), by 5.6 per cent at most for the 12 m pieces. Twelve placed. Each piece owns the king post
    // at one end (the down-route end on the right bank, the up-route end on the left); the other end is closed by the
    // next piece's, by a sluice's corner post or by an end cap.
    const LEN = { a: 12, b: 12, c: 8 }, lists = { a: [], b: [], c: [] };
    let nPiece = 0;
    for (const run of Wk.runs) {
      const k = (run.s[1] - run.s[0]) / [...run.pieces].reduce((t, v) => t + LEN[v], 0);
      let s = run.s[0];
      for (const v of run.pieces) { lists[v].push({ at: [s + LEN[v] * k / 2, run.side * Cw.inner, 0], face: 'channel', scale: [k, 1, 1], tint: PIECE_TINT[nPiece++ % PIECE_TINT.length] }); s += LEN[v] * k; }
    }
    for (const v of Object.keys(lists)) { const m = await kit.models(`models/sky/causeway_${v}.glb`, lists[v], worksPaint); sky.adopt(m.group, { air: 'near' }); }
    // THE SLUICE MOUTHS WITH THEIR GATES (the page: 4 placed; 6 m opening; posts 1.8 m). sluice.glb is the mouth and its
    // gate (wing walls, posts with through tenons, cross beam, knee braces, peg rack, guide posts, stop boards, the crust
    // and the rose apron of dried brine); sluice_board.glb is the lifting board with its iron straps and its stem of peg
    // holes, a model of its own so that no two sluices stand alike: each is drawn up by its own amount (plan.works.lift).
    {
      const gates = Cw.sluices.map((m, i) => ({ at: [m.s, m.side * Cw.inner, 0], face: 'channel', tint: PIECE_TINT[(i * 3 + 1) % PIECE_TINT.length] }));
      const boards = Cw.sluices.map((m, i) => ({ at: [m.s + Wk.boardOff * m.side, m.side * (Cw.inner + Wk.gate), Wk.lift[m.s] || 0], face: 'channel', tint: PIECE_TINT[(i * 2) % PIECE_TINT.length] }));
      const g = await kit.models('models/sky/sluice.glb', gates, worksPaint); sky.adopt(g.group, { air: 'near' });
      const b = await kit.models('models/sky/sluice_board.glb', boards, worksPaint); sky.adopt(b.group, { air: 'near' });
      // for staging (nothing moves a sluice on the page; if the wind is to knock a lifting board, this is how): the boards'
      // handle and the placement each was given: shared.works.boards.place(i, { ...shared.works.boardAt[i], at: [s, d, lift] })
      // where the brine comes over the end of each sluice's short stop board and drips into the lake (sluice.py): a small
      // ring on the mirror there every few seconds (the module's update, below); staging may give each a sound
      const leaks = Cw.sluices.map((m, i) => { const p = kit.at(m.s - 2.54 * m.side, m.side * (Cw.inner + 0.82)); return { x: p.x, z: p.z, every: [4.3, 5.9, 3.7, 5.1][i % 4], phase: [0.2, 0.55, 0.8, 0.35][i % 4], last: -1 }; });
      // where a lifting board is drawn up the brine runs out under it: a steady small trembling of the mirror in front of
      // that mouth (the module's update), which is what tells the rider that the gate stands open
      const open = Cw.sluices.filter((m) => (Wk.lift[m.s] || 0) > 0.3).map((m) => { const p = kit.at(m.s + Wk.boardOff * m.side, m.side * (Cw.inner + 0.35)); return { x: p.x, z: p.z, last: -1 }; });
      shared.works = { sluices: Cw.sluices, boards: b, boardAt: boards, leaks, trickles: open };
    }
    // THE END CAPS (the page: 4 placed, 3 m; boards splayed, a mooring cleat): end_cap.glb, the bank's revetment carried
    // round its nose as splayed staves under one iron band, and the mooring post with its cleat at the tip. Its nose
    // looks away from the bank: back up the route at the up-route ends, down it at the down-route ends.
    {
      const caps = [];
      for (const side of [-1, 1]) { caps.push({ at: [Cw.from, side * mid, 0], face: 'back', tint: PIECE_TINT[caps.length] }); caps.push({ at: [Cw.to, side * mid, 0], face: 'along', tint: PIECE_TINT[caps.length] }); }
      const m = await kit.models('models/sky/end_cap.glb', caps, worksPaint); sky.adopt(m.group, { air: 'near' });
    }
    for (const side of [-1, 1]) {
      // the colliders of the works, as the layout made them: a row of circles along each bank, mouths and all (the boat
      // lies against a bank and cannot enter a mouth), and along the pans' rims that run out from the causeways' ends
      for (let s = Cw.from; s <= Cw.to + 0.1; s += 2.8) collide(s, side * mid, 1.85);
      for (let d = Cw.inner + Cw.width + 1; d <= 52; d += 2.6) { collide(Cw.from, side * d, 1.3); collide(Cw.to, side * d, 1.3); }
    }
  }

  // ---------------------------------------------------------------------------------------------- brine pans
  // THE BRINE PANS, 20 by 30 m (the page's close band; not a row of its model list). Their FLOORS lie 5 cm under the
  // water and wear the painted `brine` (assets/art/sky/brine.webp, laid 7 m to a repeat and again, turned, at 19 m, so
  // that no repeat shows across a pan); no two pans are one colour: each is at its own stage, from thin rose brine to
  // rust to a floor nearly white with new crust. They are under the surface: drawn in the direct view only, lit as the
  // bed is lit (at night only where a lamp finds them; they come up through the mirror with first light). The same paint
  // lies in the four sluice mouths. One draw. Their RIMS are low banks of crust, grown here: no two lengths alike (each
  // stretch is turned end for end, widened, lowered and tinted its own way), a hollow walked along the top, a lip of
  // crust at each waterline; rose where the brine has stained the foot. Two draws: the rims near the route, the far ones.
  const blocks = [
    { s: [150, 170, 190, 210, 232], d: [25, 55, 85, 115, 145, 175] },             // right of the works
    { s: [232, 252, 272, 292, 312, 332, 352], d: [55, 85, 115, 145, 175] },       // right of the flats, and on past the place where the boat stops (s 316): nothing it can see from there ends
    { s: [150, 170, 190, 210, 230], d: [-25, -55, -85, -115] },                   // left of the works
  ];
  // which pan a place lies in: how far along the row of pans (whole part: the pan; fraction: where in it) and that pan's
  // length. The route is straight: -z is along it, x across. Pans are 20 m along from s 150, but the last pan right of
  // the works is 22 m (to s 232) and the pans right of the flats count from s 232; across, every pan is 30 m, from d 25.
  const PAN_GLSL = `
    vec2 panAlong(vec3 w) { float sa = -w.z; bool right = w.x > 0.0;
      if (right && sa >= 232.0) return vec2((sa - 232.0) / 20.0 + 5.0, 20.0);
      if (right && sa >= 210.0) return vec2(3.0 + (sa - 210.0) / 22.0, 22.0);
      return vec2((sa - 150.0) / 20.0, 20.0); }`;
  // SALTY: what the heaps and the near rims need of the area's painted salt (light.js, "THE SALT") and nothing more: its
  // two pictures, the tint of a hollow, and the few crystals that catch a star by night (the same cells, numbers and
  // going-out with first light as light.js's glints: plan.salt.glints). Asking light.js for its whole salt at strength 0
  // cost fourteen texture reads a pixel for nothing, on the largest things in the close band.
  const SALTY = (() => {
    const G = (P.salt || {}).glints || {}, hol = new THREE.Color((P.salt || {}).hollow || '#8E86B0'), chalk = new THREE.Color(C.chalk), until = G.until || [0.08, 0.35];
    return (glints) => ({
      uniforms: { tSalt: sky.tiles.tSalt, tCrust: sky.tiles.tCrust, uSaltHollow: { value: new THREE.Vector3(hol.r / chalk.r, hol.g / chalk.g, hol.b / chalk.b) } },
      fragmentPars: 'uniform sampler2D tSalt, tCrust; uniform vec3 uSaltHollow; float wHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }',
      light: `{
        float gd = max(length(vViewPos), 1.0), lv = log2(gd), g0 = floor(lv), gf = lv - g0, lit = 0.0;
        for (int i = 0; i < 2; i++) {
          float cell = ${Number(G.cell ?? 0.02).toFixed(4)} * exp2(g0 + float(i)), wgt = i == 0 ? 1.0 - gf : gf;
          vec3 q = vWPos / cell, id = floor(q), f = fract(q) - 0.5;
          float r1 = wHash(id), r2 = wHash(id + 17.3), r3 = wHash(id + 41.7);
          float spot = 1.0 - smoothstep(0.02, 0.11, length(f - 0.5 * (vec3(r2, r3, fract(r1 * 57.0)) - 0.5)));
          lit += step(${(1 - 1 / (G.one ?? 70)).toFixed(5)}, r1) * wgt * spot * (0.55 + 0.45 * sin(uTime * (1.2 + 1.6 * r2) + r3 * 40.0));
        }
        glow += vec3(0.86, 0.91, 1.0) * (lit * ${Number(glints).toFixed(3)} * (1.0 - smoothstep(${Number(until[0]).toFixed(3)}, ${Number(until[1]).toFixed(3)}, uSunline.w)));
      }` });
  })();
  // RIM: what the near rims wear over their paint: crust in lobes where the mark says (vUv0.y), the pitted and crazed
  // crust of a pan's edge elsewhere. (The model's own metres: a rim may be turned end for end, never moved.)
  const RIM = {
    vertexPars: 'varying vec3 vRim;', vertexLocal: 'vRim = transformed;', fragmentPars: 'varying vec3 vRim;',
    albedo: `{
      float rCrust = clamp(vUv0.y, 0.0, 1.0);
      vec3 rLob = texture2D(tSalt, vRim.xz / 0.6).rgb, rCell = texture2D(tCrust, vWPos.xz / 1.5).rgb;
      albedo *= mix(vec3(1.0), mix(uSaltHollow, vec3(1.0), smoothstep(0.12, 0.7, rLob.b)), 0.75 * smoothstep(0.5, 0.95, rCrust));
      albedo *= mix(vec3(1.0), vec3(0.86 + 0.2 * rCell.r) * (1.0 - 0.3 * (1.0 - smoothstep(0.08, 0.27, rCell.g))), (1.0 - smoothstep(0.5, 0.95, rCrust)) * smoothstep(0.55, 0.8, N.y));
    }` };
  {
    const Pn = P.pans, Cw = P.causeway, pr = ctx.rng(7302);
    // ---- the floors
    const pos = [], idx = [];
    const quad = (s0, s1, d0, d1, y) => { const k = pos.length / 3; for (const [s, d] of [[s0, d0], [s1, d0], [s1, d1], [s0, d1]]) { const p = sky.at(s, d, y); pos.push(p.x, p.y, p.z); } const up = (pos[(k + 1) * 3] - pos[k * 3]) * (pos[(k + 3) * 3 + 2] - pos[k * 3 + 2]) - (pos[(k + 1) * 3 + 2] - pos[k * 3 + 2]) * (pos[(k + 3) * 3] - pos[k * 3]) < 0; idx.push(k, up ? k + 1 : k + 3, k + 2, k, k + 2, up ? k + 3 : k + 1); };
    for (const b of blocks) quad(b.s[0], b.s[b.s.length - 1], b.d[0], b.d[b.d.length - 1], Pn.floor);
    for (const m of Cw.sluices) quad(m.s - Cw.mouth / 2 - 0.2, m.s + Cw.mouth / 2 + 0.2, m.side * (Cw.inner + 0.16), m.side * (Cw.inner + Cw.width + 0.6), Pn.floor + 0.012);      // the brine in the sluice mouths (it ends under the sill of crust across the mouth's threshold: sluice.py)
    const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fgeo.setIndex(idx); fgeo.computeVertexNormals();
    const brine = await ctx.tex('art/sky/brine.webp', { repeat: true }).catch((err) => { console.error('INVALID_ART sky/brine.webp did not load: the pan floors are plain rust. ' + err); return null; });
    const floor = new THREE.Mesh(fgeo, !brine ? sky.paint({ color: C.brine, bed: true, brush: 0.9 }) : sky.paint({ color: '#ffffff', map: brine, triplanar: 7, bed: true, brush: 0.5, extend: {
      // (the pan a place lies in gives the pan its own stage. Toward the pan's edges the floor pales: crust grows in from the rims.)
      fragmentPars: PAN_GLSL,
      albedo: `{
        vec2 pw = vec2(vWPos.x * 0.8 + vWPos.z * 0.6, vWPos.z * 0.8 - vWPos.x * 0.6);
        vec3 big = texture2D(tMap, pw / 19.0 + 0.31).rgb;
        albedo = mix(albedo, albedo * (0.5 + 1.1 * big), 0.5);
        vec2 pa = panAlong(vWPos);
        vec2 cell = vec2(floor(pa.x), floor((abs(vWPos.x) - 25.0) / 30.0) + 7.0 * step(0.0, vWPos.x));
        float h1 = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453), h2 = fract(sin(dot(cell, vec2(39.3468, 11.135))) * 24634.6345);
        float lum = dot(albedo, vec3(0.3, 0.55, 0.15));
        vec3 stage = h1 < 0.3 ? vec3(1.12, 0.94, 0.9) : h1 < 0.55 ? vec3(0.86, 0.8, 0.86) : h1 < 0.8 ? vec3(1.0, 1.0, 1.0) : vec3(1.0, 1.06, 1.1);
        albedo = mix(albedo * stage, vec3(lum) * vec3(1.0, 0.95, 0.96), h1 >= 0.8 ? 0.62 : 0.12 + 0.2 * h2);      // (one pan in five is nearly white: its salt is ready)
        vec2 f = vec2(fract(pa.x), fract((abs(vWPos.x) - 25.0) / 30.0));
        float edge = min(min(f.x, 1.0 - f.x) * pa.y, min(f.y, 1.0 - f.y) * 30.0);
        albedo = mix(albedo, vec3(0.86, 0.82, 0.8), (1.0 - smoothstep(0.4, 2.6, edge + 1.6 * (big.r - 0.5))) * 0.55);
      }` } }));
    floor.name = 'brine pan floors'; floor.frustumCulled = false; ctx.only(floor, 'direct'); ctx.add(floor);
    // ---- the brine itself. Brine is coloured water: it mirrors the sky like the lake, and it has a body colour the
    // lake has not. From the boat a pan is seen along the water, where the mirror hides its floor; so with first light
    // (never by night: the pans are part of the exact mirror then) a thin skin of the brine's own colour lies on each
    // pan, each at its own stage and thinning to nothing at its rims: the page's "rust pans" of the vista at first light.
    // Drawn after the water, in the direct view only, lit by the same sky light as everything built.
    {
      const sp = [], si = [];
      const patch = (s0, s1, d0, d1) => { const k = sp.length / 3; for (const [s, d] of [[s0, d0], [s1, d0], [s1, d1], [s0, d1]]) { const p = sky.at(s, d, 0.004); sp.push(p.x, p.y, p.z); } si.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      for (const b of blocks) patch(b.s[0], b.s[b.s.length - 1], b.d[0], b.d[b.d.length - 1]);
      for (const m of Cw.sluices) patch(m.s - Cw.mouth / 2 + 0.06, m.s + Cw.mouth / 2 - 0.06, m.side * (Cw.inner + 0.2), m.side * (Cw.inner + Cw.width + 0.5));
      const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sgeo.setIndex(si);
      const sh = ctx.engine.shared, U = sky.uniforms;
      const skin = new THREE.Mesh(sgeo, new THREE.ShaderMaterial({
        uniforms: { uSunline: U.uSunline, uSkyAmb: U.uSkyAmb, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uBrineGain: { value: 1 } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: 'varying vec3 vW; varying float vDist; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: `
          uniform vec4 uSunline; uniform vec3 uSkyAmb, uFogColor; uniform float uFogDensity, uVeil, uBrineGain; varying vec3 vW; varying float vDist;
          ${PAN_GLSL}
          void main() {
            vec2 pa = panAlong(vW);
            vec2 cell = vec2(floor(pa.x), floor((abs(vW.x) - 25.0) / 30.0) + 7.0 * step(0.0, vW.x));
            float h1 = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
            bool mouth = abs(vW.x) < 25.4;
            // the brine's own colour at each stage (daylight colours), and how thick it lies
            vec3 body = mouth ? vec3(0.42, 0.16, 0.12) : h1 < 0.3 ? vec3(0.40, 0.12, 0.07) : h1 < 0.55 ? vec3(0.55, 0.27, 0.26) : h1 < 0.8 ? vec3(0.33, 0.10, 0.08) : vec3(0.78, 0.70, 0.68);
            float dense = mouth ? 0.5 : h1 < 0.3 ? 0.5 : h1 < 0.55 ? 0.36 : h1 < 0.8 ? 0.58 : 0.3;
            vec2 f = vec2(fract(pa.x), fract((abs(vW.x) - 25.0) / 30.0));
            float edge = mouth ? 3.0 : min(min(f.x, 1.0 - f.x) * pa.y, min(f.y, 1.0 - f.y) * 30.0);
            float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist);
            float a = dense * smoothstep(0.1, 0.5, uSunline.w) * smoothstep(0.5, 2.8, edge) * (1.0 - 0.75 * fog) * (1.0 - uVeil) * uBrineGain * 1.25;
            gl_FragColor = vec4(mix(body * uSkyAmb * 2.2, uFogColor, fog), a);
          }` }));
      skin.name = 'brine'; skin.frustumCulled = false; skin.renderOrder = 1; ctx.only(skin, 'direct'); ctx.add(skin);
    }

    // ---- the rims. Near the route (within 62 m of it, where a boat outside the works can lie beside one): modelled
    // stretches of 10 m, rim_a and rim_b (source-art/models/sky/rim.py: a low back of crusted clay walked along its top,
    // crust grown out over the brine in lobes, one low place where the brine passes over), laid end to end, each turned
    // end for end or not, stretched to its run, lowered and tinted its own way. Far off: a plain stretch grown here.
    // (The first near rims were grown here too, ten stations of a smooth profile: a pink road: `sky_w2_t1_outside.png`.)
    const stretch = (stations, prof) => {
      const v = [], c = [], ix = [], n = prof.length, ph = [pr() * 6.28, pr() * 6.28, pr() * 6.28];
      for (let i = 0; i <= stations; i++) {
        const x = -5 + 10 * i / stations, wide = 1 + 0.2 * Math.sin(x * 0.9 + ph[0]) + 0.1 * Math.sin(x * 2.3 + ph[1]), off = 0.1 * Math.sin(x * 0.55 + ph[2]) * (i > 0 && i < stations ? 1 : 0);
        for (const [y, z, col] of prof) { v.push(x, z * (0.85 + 0.3 * pr()), y * wide + off); c.push(...col); }
      }
      for (let i = 0; i < stations; i++) for (let j = 0; j < n - 1; j++) { const q = i * n + j; ix.push(q, q + 1, q + n + 1, q, q + n + 1, q + n); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setIndex(ix); g.computeVertexNormals();
      return g;
    };
    const lin = (hex) => { const k = new THREE.Color(hex); return [k.r, k.g, k.b]; };
    const CH = lin('#F3EBDA'), ROSE = lin('#CFA8A4');
    const farGeo = stretch(3, [[-0.62, -0.1, ROSE], [-0.45, 0.14, CH], [0.45, 0.14, CH], [0.62, -0.1, ROSE]]);
    const near = { a: [], b: [] }, far = [];
    const RIM_TINT = ['#ffffff', '#f6f1ee', '#f1edf3', '#fbf6ee'];
    const rim = (s0, d0, s1, d1) => {
      const a = sky.at(s0, d0), b = sky.at(s1, d1), len = a.distanceTo(b), n = Math.max(1, Math.round(len / 10)), turn = Math.atan2(-(b.z - a.z), b.x - a.x);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, s = s0 + (s1 - s0) * t, d = d0 + (d1 - d0) * t;
        const flip = pr() < 0.5 ? Math.PI : 0, high = 0.8 + 0.45 * pr(), wide = 0.8 + 0.45 * pr(), g = 0.93 + 0.07 * pr(), g2 = 0.97 + 0.03 * pr();
        if (Math.abs(d) < 62 && s < 300) near[pr() < 0.36 ? 'b' : 'a'].push({ position: [x, 0, z], turn: turn + flip, scale: [len / n / 10 * 1.005, 0.85 + 0.3 * pr(), 0.85 + 0.3 * pr()], tint: RIM_TINT[Math.floor(pr() * RIM_TINT.length)] });
        else far.push({ position: [x, 0, z], rotation: turn + flip + (pr() - 0.5) * 0.02, scale: [len / n / 10 * 1.01, Pn.rimHigh / 0.14 * high, Pn.rim * wide], color: new THREE.Color(g, g * g2, g) });
      }
    };
    blocks.forEach((b, bi) => {
      const s0 = b.s[0], s1 = b.s[b.s.length - 1];
      b.d.forEach((d, i) => { if (i > 0 || bi === 1) rim(s0, d, s1, d); });        // rims along the route (the first of each works block is the causeway itself)
      b.s.forEach((s, i) => { if (!(bi === 1 && i === 0)) b.d.slice(0, -1).forEach((d, k) => rim(s, d, s, b.d[k + 1])); });   // rims across it, pan by pan
    });
    for (const v of Object.keys(near)) {
      // (the NEAR rule of the night air, not the far rims' FAR: under the false dawn a far-rule thing is still blended, and a
      // blended thing cannot be drawn before the lake's bed; these stand at the lake's edge, where the bed is a finger down)
      const m = await kit.models(`models/sky/rim_${v}.glb`, near[v], { brush: 0.7, extend: [...sky.extend({ air: 'near' }), LANTERN, SALTY(0.3), RIM] });
      sky.adopt(m.group, { air: 'near' }); underBed(m);
    }
    const rimMat = sky.paint({ color: '#ffffff', vertexColors: true, brush: 0.6, air: 'far', salt: { kind: [0, 0.2, 0.5, 0.3], glints: 0.3 } });
    const fm = kit.instances(farGeo, rimMat, far); fm.name = 'brine pan rims (far)'; fm.computeBoundingSphere(); fm.computeBoundingBox();
    shared.pans = blocks;
  }

  // ---------------------------------------------------------------------------------------------- salt heaps
  // THE SALT HEAPS (the page's "salt cones": 5 variants, 64 placed, 1.5 to 2.5 m; one slumped side, a shovel cut, a crust
  // skirt, older grey to windward). Second version (docs/build/sky/2-kit-works.md, "Second look"): the first were bells
  // 55 to 60 degrees steep on the bank's top, and read as striped tents. A heap of damp salt lies at about 45 degrees, so
  // one 2 m tall is 4 m across and cannot stand on a bank 3 m wide with a path along it. As in a real works the salt is
  // raked up at the pan's edge: every heap of the causeways stands HALF ON THE BANK AND HALF IN THE PAN (its middle about
  // on the bank's pan edge, d 24.7 to 25), its foot on the bank reaching the edge of the trodden path and no further, its
  // other half standing in the brine with its crust skirt round it. The models (source-art/models/sky/cone.py) are made
  // with z = 0 at the WATER: cone_a .. cone_e, each instanced once, and three far forms (cone_a_far, cone_b_far,
  // cone_e_far, a third of the triangles) for the heaps that stand in the pans 30 m and more from any water the boat
  // can reach. Eight draws for the sixty-four and for the first row right of the flats.
  // HEAP is the heaps' own paint: a rake's furrows running DOWN the flank from the top (the painted salt's furrows laid
  // round the heap's own axis: level on every face they were stripes on a tent), strata in the wall of a cut, lobed
  // crust on the skirt and on an old heap, broken salt in a slide; told where by two marks the models carry in their UVs.
  // WINDWARD lays the older grey on the east side of every heap by world direction, in patches.
  const wr = ctx.rng(7301);                                   // the Works group's own random sequence
  const WINDWARD = { uniforms: { uWindward: { value: new THREE.Vector3(...P.works.windward).normalize() } },
    fragmentPars: 'uniform vec3 uWindward;',
    albedo: '{ float ww = smoothstep(0.05, 0.75, dot(N, uWindward)); float wg = texture2D(tCrust, vWPos.xz * 0.19 + vWPos.y * 0.13).b; albedo = mix(albedo, albedo * vec3(0.74, 0.73, 0.81), ww * (0.2 + 0.8 * smoothstep(0.3, 0.72, wg)) * 0.8); }' };
  // THIRD VERSION of the heaps' paint (8 November). The second drew seventy-four ruled furrows from every heap's top:
  // pleats in a tent. A heap is raked up a PULL at a time: a rake's head is half a metre wide and a pull is a metre
  // long, so the flank is a patchwork of pulls, each with its own furrows running more or less down the fall, each a
  // little askew of its neighbours, a seam of loose salt between two of them, and some places patted smooth with the
  // back of the shovel and never raked at all. The furrows are the Light group's PAINTED raked salt (tSalt.r: crests
  // with their crystals, lilac troughs), laid pull by pull in the heap's own metres. The wall of a cut wears the painted
  // old salt with its strata level (tSalt.g); what has slid, and a trodden floor, the same seen from above; the skirt
  // and an old heap the painted crust's lobes (tSalt.b). The foot is damp and greyer for a hand's height.
  const HEAP = {
    vertexPars: 'varying vec3 vHeap;',
    vertexLocal: 'vHeap = transformed;',
    // HEAP_FOOT: a heap is modelled standing in water. Where one stands over a causeway, whatever of it lies under the
    // bank's top is laid ON the bank as a thin foot of spilt salt that feathers out to nothing a hand beyond the flank
    // (the bank's own section: causeway.py). Without it the flank met the bank in one ruled line.
    vertexWorld: `{ float hAx = abs(wp.x), hS = -wp.z;
      if (hAx > 21.9 && hAx < 25.5 && hS > 149.6 && hS < 232.4) {
        float hBy = 0.302 - 0.17 * smoothstep(24.84, 25.08, hAx) - 0.33 * smoothstep(25.08, 25.42, hAx);
        float hUnder = hBy + 0.014 - wp.y;
        if (hUnder > 0.0) { wp.y = hBy + 0.014 - hUnder * 0.075 + 0.005 * sin(wp.x * 7.0 + wp.z * 5.0); wn = normalize(mix(wn, vec3(0.0, 1.0, 0.0), 0.8)); }
      } }`,
    fragmentPars: 'varying vec3 vHeap;',
    albedo: `{
      // (the marks: vUv0.x = how much of a rake's furrows this place carries, 2 on the wall of a cut; vUv0.y = how crusted. The loader hands a model's v back as Blender wrote it)
      vec2 hq = vHeap.xz; float hr = max(length(hq), 0.05), ha = atan(hq.y, hq.x);
      // (a wall is where the mark says so AND the face stands nearly upright: the mark alone, carried from point to point
      // of a reduced mesh, left stray dashes of strata on the flank above a bay)
      float wallM = smoothstep(0.6, 1.3, vUv0.x) * (1.0 - smoothstep(0.3, 0.5, N.y)), crusted = clamp(vUv0.y, 0.0, 1.0);
      float raked = clamp(vUv0.x, 0.0, 1.0) * (1.0 - smoothstep(1.05, 1.6, vUv0.x)) * (1.0 - wallM);
      vec3 slow = texture2D(tCrust, hq * 0.21 + 0.17).rgb;                                  // r: pits; b: a slow cloud
      albedo *= 0.93 + 0.14 * slow.b;                                                        // no flank is one flat tone
      // PATS: a heap is thrown up a shovel-load at a time and slapped firm with the shovel's back: a quilt of pats, each a
      // little its own tone, the lower edge of each a soft shade (rows round the heap, their edges wandering; cells in a
      // row about half a metre round, staggered). No furrows: a rake's furrows drawn down a heap, whole (the second version)
      // or pull by pull (my first try), were pleats and claw marks. The page asks none of a cone.
      // the salt itself: coarse, damp, in small clods (the painted old salt seen from above, small)
      float grit = texture2D(tSalt, hq / 0.74 + 0.21).g;
      float rowf = hr / 0.62 + 0.9 * slow.b + 0.45 * grit, row = floor(rowf), rowIn = fract(rowf);
      float nAround = max(4.0, floor(6.2831853 * (row + 0.5) * 0.62 / 0.55 + 0.5));
      float af = ha / 6.2831853 * nAround + 0.37 * row + 0.3 * grit, cell = mod(floor(af), nAround), cellIn = fract(af);
      float h1 = wHash(vec3(cell, row, 3.1)), h2 = wHash(vec3(cell, row, 7.7));
      float pat = raked * smoothstep(0.25, 0.7, hr);
      albedo *= 1.0 + pat * (0.13 * (h1 - 0.5) - 0.04 * (1.0 - smoothstep(0.0, 0.2, rowIn)) - 0.025 * (1.0 - smoothstep(0.0, 0.12, cellIn)) * step(0.5, h2));
      albedo *= mix(vec3(1.0), mix(uSaltHollow, vec3(1.0), smoothstep(0.1, 0.8, grit)), 0.36 * raked);
      // what is not raked: the wall of a cut (strata, level), what slid and what is trodden (broken, from above), crust (lobes)
      float oldWall = texture2D(tSalt, vec2(ha / 6.2831853 * 6.0 + 0.3, vWPos.y / 0.95)).g;
      vec3 above = texture2D(tSalt, hq / 0.64).rgb;
      float oldTop = texture2D(tSalt, hq / 1.2 + 0.4).g;
      float broken = (1.0 - raked) * (1.0 - crusted) * (1.0 - wallM);
      albedo *= mix(vec3(1.0), mix(uSaltHollow, vec3(1.0), smoothstep(0.15, 0.75, oldTop)), 0.6 * broken);
      albedo *= mix(vec3(1.0), mix(uSaltHollow, vec3(1.0), smoothstep(0.12, 0.7, above.b)), 0.72 * crusted);
      albedo *= mix(vec3(1.0), mix(uSaltHollow * 0.94, vec3(1.0), smoothstep(0.18, 0.8, oldWall)), 0.8 * wallM);
      // the foot is damp for a hand's height, and greyer (brine wicks up out of the pan and out of the bank)
      albedo *= mix(vec3(1.0), vec3(0.8, 0.78, 0.87), 0.6 * (1.0 - smoothstep(0.1, 0.5, vWPos.y - 0.08 * slow.b)) * (1.0 - 0.6 * crusted));
    }` };
  const heapPaint = (old) => ({ brush: 0.85, extend: [...sky.extend({ air: 'near' }), LANTERN, SALTY(old ? 0.3 : 0.55), HEAP, WINDWARD] });
  {
    const Cw = P.causeway, Wk = P.works, V = Wk.variants, list = shared.cones = { near: [], far: 0 };
    const lists = { a: [], b: [], c: [], d: [], e: [], a_far: [], b_far: [], e_far: [] }, TINT = ['#ffffff', '#f8f4f5', '#f4efe8', '#fbf7ee', '#f0ebf2', '#ffffff', '#f6f2ee'];
    const weighted = (key, not) => { const pool = Object.keys(V).filter((v) => v !== not && V[v][key]).flatMap((v) => Array(V[v][key]).fill(v)); return pool[Math.floor(wr() * pool.length)]; };
    // one heap: (s, d) of its axis; which model; its size (1 = as modelled); which way its front looks ([along, across] in
    // the route's own directions, or null: any way); whether it stands on a bank; whether in its far form
    const turnTo = (s, toward) => { const f = path.at(Math.min(Math.max(s, 0), path.length)); return Math.atan2(f.tx * toward[0] + f.rx * toward[1], f.tz * toward[0] + f.rz * toward[1]); };
    // how far a heap's foot reaches at a bank's top toward the world direction phi (0 = +x, a quarter turn = -z), once it is turned (plan.works.variants: foot)
    const footToward = (v, k, turn, phi) => { const f = V[v].foot, a = ((((phi - turn) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 6), i = Math.floor(a), t = a - i; return k * (f[i % 12] + (f[(i + 1) % 12] - f[i % 12]) * t); };
    const put = (s, d, v, k, toward, onBank, far, exact, turned) => {
      const p = sky.at(s, d, 0), sq = exact ? 1 : 0.96 + 0.08 * wr(), ky = exact ? 1 : 0.94 + 0.12 * wr();
      const turn = turned !== undefined ? turned : toward ? turnTo(s, toward) + (exact ? 0 : (wr() - 0.5) * 0.5) : wr() * Math.PI * 2;
      const sx = k * sq, sz = k / sq, sy = k * ky;
      lists[far ? v + '_far' : v].push({ position: [p.x, 0, p.z], turn, scale: [sx, sy, sz], tint: TINT[Math.floor(wr() * TINT.length)] });
      // where its top stands (the cast streams salt dust from the near tops): the model's top is a little off its axis
      const lx = V[v].top[0] * sx, lz = V[v].top[1] * sz, c = Math.cos(turn), sn = Math.sin(turn), ground = onBank ? Wk.walk.y : 0, top = V[v].h * sy;
      const item = { x: p.x + lx * c + lz * sn, z: p.z - lx * sn + lz * c, h: top - ground, r: (onBank ? V[v].bank : V[v].water) * k, y: ground, top, bx: p.x, bz: p.z, s, d, variant: v, turn };
      if (!far || list.near.length < P.cones.near) list.near.push(item);
      // (a heap that stands in the lake is 4 to 5 m across at the water: the rims' colliders, where there are any, do not
      // cover it, and a boat outside the works can come to the rims as far out as d 60. The bow may ride over its crust skirt)
      if (!onBank) ctx.addCollider({ x: p.x, z: p.z, r: V[v].water * k * 0.86 });
      return item;
    };
    const T = Wk.toolCone, PATH = Wk.walk.d + Wk.walk.half - 0.2;                        // a heap's foot comes this near the channel and no nearer (d 23.0: the path's pan edge)
    const mouthNear = (s, side, r) => Cw.sluices.some((m) => m.side === side && Math.abs(m.s - s) < Cw.mouth / 2 + r + 0.3);
    const clearAt = (s, side) => Wk.clear.find((c) => c.side === side && s > c.s[0] - 0.6 && s < c.s[1] + 0.6);
    const apron = [];                                                                     // the heaps of the banks, for the salt spilled round each on the bank's top (TOP_GLSL, above)
    // THE BANKS (third version). One place every 4.6 m, as the page has it; how large the heap of each place stands is
    // written out (plan.works.heapSizes: tall, low, a gap: never a range of equal peaks, and the pan is seen between them);
    // a heap is turned first and then stood so far out over the pan's edge that its foot, turned so, comes to the path's
    // edge and no further. Beside a sluice mouth only a small one has room; beside the Tools group's plank run they stand
    // further out and are the ones being shovelled away; where their yoke stands one was carted away.
    for (const side of [-1, 1]) {
      let last = null;
      const sizes = Wk.heapSizes[String(side)], channel = side > 0 ? Math.PI : 0;
      for (let i = 0; i < Cw.cones.perSide + 1; i++) {
        const s0 = Cw.cones.from + i * Cw.cones.step;
        if (side === T.side && Math.abs(s0 - T.s) < 0.1) { const it = put(T.s, side * T.d, 'c', 1, [T.cut.toward[0], side * T.cut.toward[1]], true, false, true); apron.push(it); last = 'c'; continue; }
        const clear = clearAt(s0, side), s = s0 + (wr() - 0.5) * 1.1;
        let k = sizes[i % sizes.length];
        if (!k) continue;                                                                 // a gap: the pan is seen through it
        if (clear && clear.d >= Cw.inner + Cw.width) continue;                            // (a heap was carted away from here: the Tools group's yoke and pails stand in its place)
        let v, toward;
        if (clear) {
          // beside the plank run: the heaps stand further out over the pan's edge and are being shovelled away into the barrow
          v = last === 'd' ? (wr() < 0.5 ? 'c' : 'b') : 'd'; k = Math.max(k, 0.68);
          toward = v === 'b' ? [wr() - 0.5, side] : [0.9 * (wr() - 0.5), -side];
        } else {
          v = weighted('onBank', last);
          // (a bite faces the path, some of them slantwise so that the channel sees into them; a slide goes toward the pan;
          // an old heap stands any way round)
          toward = v === 'c' || v === 'd' ? [1.3 * (wr() - 0.5), -side] : v === 'a' ? [2.0 * (wr() - 0.5), -side] : v === 'b' ? [wr() - 0.5, side] : null;
        }
        // (beside a mouth, and at the bank's end, only as large as there is room for)
        const room = Math.min(...Cw.sluices.filter((m) => m.side === side).map((m) => Math.abs(m.s - s) - Cw.mouth / 2 - 0.5), Cw.to - 0.5 - s, s - Cw.from - 0.5);
        k = Math.min(k, room / V[v].bank);
        if (k < 0.5) continue;
        const turn = toward ? turnTo(s, toward) + (wr() - 0.5) * 0.5 : wr() * Math.PI * 2;
        const d = (clear ? clear.d : PATH) + footToward(v, k, turn, channel) + 0.04 + 0.1 * wr();
        apron.push(put(s, side * d, v, k, null, true, false, false, turn)); last = v;
      }
    }
    shared.works.bankHeaps = apron;
    // the rest of the 64 stand in the pans, on the nearest rims behind the causeways (all within 60 m of the route): along
    // the first rim (d 55), on the cross rims between the first pans, and by the works' up-route end. Those a boat can
    // come near from outside the works (round the up-route end) are in the near form; the rest in the far form.
    // (None where the sleepers stand: the layout's groups A, B and C: plan.sleepers.)
    const sleepers = (s, d) => (s > 201 && s < 217 && d > 26 && d < 39) || (s > 217 && s < 235 && d < -26 && d > -41) || (s > 235 && s < 253 && d > 33 && d < 49);
    let rimN = 0;
    const rimHeap = (s, d, last) => {
      if (list.near.length >= P.cones.near || sleepers(s, d)) return last;
      const near = s < 160, far = !near, v = weighted(far ? 'far' : 'onRim', last);
      // (none over the page's 2.5 m; from half that down, and along a rim a tall one, a low one, by turns: four of a size in a row, each on its twin in the mirror, were four cut gems)
      const k = (rimN++ % 2 ? 0.5 + 0.22 * wr() : 0.76 + 0.28 * wr()) + (v === 'a' ? 0.03 : 0);
      put(s, d, v, Math.min(k, 2.4 / V[v].h), v === 'c' || v === 'd' ? [wr() - 0.5, wr() - 0.5] : null, false, far);
      return v;
    };
    for (const side of [-1, 1]) {
      let last = null;
      for (const cd of [31.5, 40, 48.5]) last = rimHeap(150.6 + 0.8 * wr(), side * (cd + 1.5 * wr()), last);      // by the works' up-route end
      for (let i = 0; i < 9; i++) last = rimHeap(154.5 + i * 8.6 + wr() * 2.4, side * (55 + 1.2 * (wr() - 0.5)), last);
      for (const cs of [170, 190, 210]) for (const cd of [33, 41, 48.5]) last = rimHeap(cs + (wr() - 0.5), side * (cd + wr() * 2), last);
    }
    for (const [cs, cd] of [[230.6, 42], [230.4, -47], [150.8, 36], [150.9, -36.5], [230.8, 50], [170.4, 37], [190.6, -37], [210.3, -44.5], [190.2, 45], [170.7, -45]]) rimHeap(cs, cd, null);      // (what the mouths and the cleared tops took from the causeways' rows)
    // the first row right of the flats (d 55, 25 m from the last water's edge: the layout's far cones stood here as
    // 12-triangle tents beside postcards 11 and 12): far forms, in short runs of a size with gaps between
    for (let s = 239 + wr() * 3, n = 0; s < 350;) {
      const run = 2 + Math.floor(wr() * 4), k0 = 0.72 + 0.34 * wr();
      for (let j = 0; j < run && s < 350; j++, n++) { const v = weighted('far', null); put(s, 55 + (wr() - 0.5) * 1.4, v, k0 * (0.9 + 0.2 * wr()), null, false, true); s += 5.6 + 2.4 * wr(); }
      s += 4 + 14 * wr() * wr();
    }
    for (const v of Object.keys(lists)) {
      if (!lists[v].length) continue;
      const m = await kit.models(`models/sky/cone_${v}.glb`, lists[v], heapPaint(v === 'e' || v === 'e_far'));
      sky.adopt(m.group, { air: 'near' }); underBed(m);
    }
    // the salt spilled round each heap on its bank's top: given to the causeways' paint (TOP, above) as places
    apron.slice(0, HEAPS_MAX).forEach((h, i) => heapsU.value[i].set(h.bx, h.bz, h.r));

    // THE FAR HEAPS (the page: far salt cones, 400, 12 triangles each, code; in rows out to 300 m). One draw. Each is a
    // low lumpy heap of 30 triangles (at 12 a cone has four faces or a flat top): its three rings are each a little out
    // of true and its top stands off its middle, so that turned its own way no two show one outline; raked up a few at a
    // time, so they stand in short runs of a size with gaps between; older ones are greyer and have spread.
    {
      const sides = 6, pos = [], colr = [], idx = [], fr = ctx.rng(7303);
      const RINGS = [[1.0, 0.0, [0.76, 0.73, 0.83]], [0.57, 0.45, [0.92, 0.89, 0.86]], [0.19, 0.86, [0.9, 0.87, 0.85]]];
      RINGS.forEach(([r, y, c], k) => { for (let i = 0; i < sides; i++) { const a = (i + 0.5 * k) / sides * Math.PI * 2, rr = r * (0.86 + 0.28 * fr()); pos.push(Math.cos(a) * rr + 0.1 * y, y + (k ? 0.07 * (fr() - 0.5) : 0), Math.sin(a) * rr - 0.06 * y); colr.push(...c); } });
      pos.push(0.11, 1, -0.06); colr.push(0.88, 0.85, 0.84);
      for (let k = 0; k < 2; k++) for (let i = 0; i < sides; i++) { const a0 = k * sides + i, a1 = k * sides + (i + 1) % sides, b0 = a0 + sides, b1 = a1 + sides; idx.push(a0, b0, a1, a1, b0, b1); }
      for (let i = 0; i < sides; i++) idx.push(2 * sides + i, 3 * sides, 2 * sides + (i + 1) % sides);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      const far = [], inRidge = (s, d) => s > P.ridge.s[0] - 8 && d < P.ridge.d[1] + 8 && d > P.ridge.d[0] - 8;
      const one = (s, d, h, old) => { if (far.length < P.cones.far && !inRidge(s, d) && Math.abs(d) <= P.cones.farReach) far.push({ s, d, h, old }); };
      // a row along a rim: short runs of a size, gaps between them, now and then what is left of one
      const row = (s0, s1, d) => {
        for (let s = s0 + wr() * 6; s < s1;) {
          const n = 2 + Math.floor(wr() * 5), h0 = lerp(1.3, 2.3, wr()), old = wr() < 0.3 ? 0.5 + 0.5 * wr() : 0.15 * wr();
          for (let k = 0; k < n && s < s1; k++) { one(s, d + (wr() - 0.5) * 1.6, wr() < 0.1 ? 0.45 + 0.4 * wr() : h0 * (0.86 + 0.28 * wr()), old); s += lerp(5.6, 8.2, wr()); }
          s += lerp(5, 22, wr() * wr());
        }
      };
      for (let k = 0; k < 9; k++) for (const side of [-1, 1]) row(142 + (k % 2) * 4, 350, side * (85 + 30 * k));
      for (const [cs, d0, d1] of [[252, 62, 170], [292, 62, 170], [332, 62, 170], [170, -60, -112], [210, -60, -112], [190, 90, 172]]) for (let d = d0 + Math.sign(d1 - d0) * wr() * 6; Math.abs(d) < Math.abs(d1); d += Math.sign(d1 - d0) * lerp(5.8, 9.5, wr())) one(cs + (wr() - 0.5) * 1.4, d, lerp(1.3, 2.2, wr()), 0.2 * wr());      // and a few rows across the route, on the cross rims
      const mat = sky.paint({ color: C.chalk, brush: 0.3, air: 'far', vertexColors: true, salt: { kind: [0, 0.5, 0.5, 0], strength: 0.4, glints: 0.3 }, extend: WINDWARD });
      const mesh = new THREE.InstancedMesh(geo, mat, far.length), M = new THREE.Matrix4(), Sh = new THREE.Matrix4(), tint = new THREE.Color(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
      far.forEach((c, i) => {
        const p = sky.at(c.s, c.d, 0.0), r = c.h * (0.92 + 0.3 * wr()) * (1 + 0.3 * c.old), lean = (0.05 + 0.2 * c.old) * wr(), la = wr() * 6.283;
        M.compose(v3.set(p.x, p.y - 0.03, p.z), q.setFromAxisAngle(up, wr() * 6.283), sc.set(r * (0.9 + 0.2 * wr()), c.h * (1 - 0.2 * c.old), r * (0.9 + 0.2 * wr())));
        Sh.set(1, lean * Math.cos(la), 0, 0, 0, 1, 0, 0, 0, lean * Math.sin(la), 1, 0, 0, 0, 0, 1);      // the top stands off the middle
        mesh.setMatrixAt(i, M.multiply(Sh));
        const g = 1 - 0.16 * c.old - 0.05 * wr(); mesh.setColorAt(i, tint.setRGB(g, g * 0.985, g * 1.02));
      });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.name = 'far salt cones'; mesh.computeBoundingBox(); mesh.computeBoundingSphere();
      ctx.add(mesh);
      list.far = far.length;
    }
  }
  // &counts=1: what the works are made of, as grown, to .shots/sky_works_counts.json
  if (new URLSearchParams(location.search).has('counts')) {
    const by = {}, bank = {}; let banks = 0;
    for (const c of shared.cones.near) { by[c.variant] = (by[c.variant] || 0) + 1; if (Math.abs(c.d) < 26) { banks++; bank[c.variant] = (bank[c.variant] || 0) + 1; } }
    const inst = {}; ctx.group.traverse((o) => { if (o.isInstancedMesh && o.name && !o.name.startsWith('standin:')) inst[o.name] = o.count; });
    const hs = shared.cones.near.map((c) => c.h);
    fetch('/__shot/sky_works_counts.json', { method: 'POST', body: JSON.stringify({ nearCones: shared.cones.near.length, onBanks: banks, byVariant: by, onBanksByVariant: bank, farCones: shared.cones.far, lowest: Math.min(...hs), tallest: Math.max(...hs), instanced: inst }, null, 1) }).catch(() => {});
  }
  for (let i = 0; i < 3249; i++) rnd();      // (the stand-ins that follow drew their places from the module's shared sequence after the layout's pans and cones, which drew 3,249 numbers from it: leave it where those left it)

  // ---------------------------------------------------------------------------------------------- tool groups
  // STAND-INS for rake, shovel, flat barrow, baskets, yoke with two pails, plank run: three groups left on the causeways.
  {
    const Cw = P.causeway, mid = Cw.inner + Cw.width / 2, stick = (name, a, b, w = 0.05) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, a.distanceTo(b)), sky.paint({ color: C.timber })); m.position.copy(a).add(b).multiplyScalar(0.5); m.lookAt(b); m.name = 'standin:' + name; ctx.add(m); return m; };
    // s 168, right: a rake leaning in a cone, a shovel stuck in its side
    stick('rake leaning in a cone', kit.at(168, mid - 1.0, Cw.top), kit.at(168.6, mid - 0.2, Cw.top + 2.0)); box('rake head', [168.6, mid - 0.2, Cw.top + 1.95], [1.1, 0.06, 0.06], C.timber, heading(168));
    stick('shovel stuck in a cone', kit.at(166.6, mid + 0.5, Cw.top + 0.5), kit.at(166.2, mid + 1.0, Cw.top + 1.7));
    // s 190, left: a flat barrow on a plank run, stacked baskets
    const T = Cw.toolsElsewhere, unit = new THREE.BoxGeometry(1, 1, 1), planks = [], baskets = [];
    for (let i = 0; i < 6; i++) { const q = kit.at(182.6 + 3.03 * i, -(mid + 0.14 * (rnd() - 0.5)), Cw.top + 0.03 + 0.03 * rnd()); planks.push({ position: [q.x, q.y, q.z], rotation: heading(190) + 0.05 * (rnd() - 0.5), scale: [0.3, 0.05, 3.0] }); }
    instanced('plank run (6 planks of 3 m)', unit, sky.paint({ color: C.timber }), planks);
    box('flat barrow', [189, -(mid), Cw.top + 0.08], [0.7, 0.45, 1.6], '#847c8c', heading(190));
    const stack = (st, d, y, n) => { for (let i = 0; i < n; i++) { const q = kit.at(st + 0.05 * (rnd() - 0.5), d + 0.05 * (rnd() - 0.5), y + 0.34 * i); baskets.push({ position: [q.x, q.y, q.z], rotation: rnd() * 6.28, scale: [0.5, 0.34, 0.5] }); } };
    stack(192.4, -(mid + 0.5), Cw.top, 3);
    // s 214, right: a yoke and two pails, a rake laid down
    box('yoke', [214, mid, Cw.top + 0.3], [1.4, 0.06, 0.08], C.timber, heading(214) + 0.4);
    for (const e of [-1, 1]) sky.standIn({ name: 'pail', at: [214 + 0.25 * e, mid + 0.55 * e, Cw.top], size: [0.3, 0.3, 0.3], shape: 'cylinder', color: '#6c6676' });
    stick('rake laid down', kit.at(215.2, mid - 0.9, Cw.top + 0.05), kit.at(217.2, mid - 0.4, Cw.top + 0.05));
    // the rest of the model list's counts (5 rakes, 4 shovels, 2 barrows, 8 baskets), which the page does not place: by the
    // people's other work, at the foot of the barrow run, on the tipping stage, under the hut and on the flats (plan.js)
    for (const t of T) {
      if (t.what === 'baskets') stack(t.at[0], t.at[1], t.y, t.n);
      else if (t.what === 'barrow') box(t.name, [t.at[0], t.at[1], t.y], [0.7, 0.45, 1.6], '#847c8c', heading(t.at[0]) + t.turn);
      else { stick(t.name, kit.at(t.at[0], t.at[1], t.y), kit.at(t.to[0], t.to[1], t.toY)); if (t.what === 'rake') box(t.name + ': head', [t.to[0], t.to[1], t.toY - 0.05], [1.1, 0.06, 0.06], C.timber, heading(t.at[0]) + (t.turn || 0)); }
    }
    const tub = new THREE.CylinderGeometry(0.5, 0.42, 1, 10); tub.translate(0, 0.5, 0);
    instanced('baskets (8, in stacks)', tub, sky.paint({ color: '#9a8f86' }), baskets);
  }

  // ---------------------------------------------------------------------------------------------- drowned things
  // STAND-IN for the drowned plank walk (22 planks 2.4 by 0.3 m on 11 trestle pairs, tops 6 cm under the surface), the
  // barrow wheel half buried at s 104, d +9 and the lost rake at s 118, d -12. Seen in the lantern's pool as the hull passes over.
  {
    const W = P.plankWalk, a = W.from, b = W.to, n = W.planks / 2, planks = [], legs = [], unit = new THREE.BoxGeometry(1, 1, 1);
    const A = kit.at(a[0], a[1]), B = kit.at(b[0], b[1]), dir = B.clone().sub(A), len = dir.length(), turn = Math.atan2(dir.x, dir.z); dir.normalize();
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    for (let i = 0; i < n; i++) {
      const c = A.clone().addScaledVector(dir, (i + 0.5) * len / n);
      for (const e of [-1, 1]) {
        if (rnd() < 0.12) continue;                                             // a plank or two gone
        planks.push({ position: [c.x + side.x * e * 0.18, W.top - 0.02 - 0.03 * rnd(), c.z + side.z * e * 0.18], rotation: turn + (rnd() - 0.5) * 0.12, scale: [W.plank[1], 0.04, W.plank[0]] });
        const t = A.clone().addScaledVector(dir, i * len / n).addScaledVector(side, e * 0.3); legs.push({ position: [t.x, -0.13, t.z], rotation: turn, scale: [0.08, 0.1, 0.08] });
      }
    }
    const under = sky.paint({ color: '#8f8796', air: false });      // (air: false: things under the surface are drawn before the water, always)
    const pm = instanced('drowned plank walk', unit, under, planks); ctx.only(pm, 'direct');
    const lm = instanced('drowned plank walk: trestles', unit, under, legs); ctx.only(lm, 'direct');
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 6, 20), sky.paint({ color: C.iron, air: false })); wheel.position.copy(kit.at(P.drowned.wheel[0], P.drowned.wheel[1], -0.12)); wheel.rotation.set(1.2, 0.5, 0); wheel.name = 'standin:barrow wheel'; ctx.only(wheel, 'direct'); ctx.add(wheel);
    const rake = box('lost rake', [P.drowned.rake[0], P.drowned.rake[1], -0.16], [0.05, 0.05, 2.2], '#8f8796', 0.7, { air: false }); ctx.only(rake, 'direct');
  }

  // ---------------------------------------------------------------------------------------------- sedge
  // STAND-IN for sedge (code-grown blades, 0.8 m, 240 triangles a tuft): thirty groups of three, marking the open mirror's
  // edges every 20 to 30 m, the causeway ends and the flats. Still at night (only its reflection moves): the wind is the cast's.
  {
    const blades = 22, pos = [], idx = [];      // (a spray of fine blades, not a clump: forty made a dark stump of every tuft at 40 m)
    for (let bI = 0; bI < blades; bI++) {
      const a = rnd() * 6.283, r0 = 0.03 + 0.2 * rnd(), lean = 0.15 + 0.7 * rnd(), high = P.sedge.height * (0.5 + 0.5 * rnd()), w = 0.009 + 0.008 * rnd(), base = pos.length / 3;
      for (let k = 0; k <= 3; k++) {
        const t = k / 3, out = r0 + lean * high * t * t, y = high * t, ww = w * (1 - 0.85 * t);
        pos.push(Math.cos(a) * out - Math.sin(a) * ww, y, Math.sin(a) * out + Math.cos(a) * ww, Math.cos(a) * out + Math.sin(a) * ww, y, Math.sin(a) * out - Math.cos(a) * ww);
        if (k < 3) idx.push(base + k * 2, base + k * 2 + 1, base + k * 2 + 2, base + k * 2 + 1, base + k * 2 + 3, base + k * 2 + 2);
      }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const tufts = [], group = (s, d) => { for (let i = 0; i < P.sedge.tufts; i++) { const p = kit.at(s + (rnd() - 0.5) * 2.4, d + (rnd() - 0.5) * 2.4, -0.04); tufts.push({ position: [p.x, p.y, p.z], rotation: rnd() * 6.283, scale: 0.8 + 0.5 * rnd() }); } };
    for (let i = 0; i < 12; i++) { const s = 31 + i * 10.4; group(s + 3 * rnd(), -(35 + 3 * rnd())); group(s + 4 + 4 * rnd(), 35 + 3 * rnd()); }      // twelve groups a side, s 30 to 150
    for (const [gs, gd] of [[148, -27], [149, 28], [234, -27], [235, 28], [262, 29], [296, 33]]) group(gs, gd);
    // (pale salt-dried blades, and thin things go into the mist first: dark tufts every 25 m along the seam are a horizon,
    // which the first image must not have)
    instanced('sedge tufts', geo, sky.paint({ color: C.sedge, side: THREE.DoubleSide, brush: 0.4, extend: { fog: `fog = 1.0 - pow(1.0 - fog, ${(P.sedge.thin * P.sedge.thin).toFixed(2)});` } }), tufts);
    shared.sedge = tufts.length;
  }

  // ---------------------------------------------------------------------------------------------- the left flats
  // STAND-IN for the crust terraces: stepping 2 to 8 cm out of the water toward the ridge's foot, brine pooled rose in each step.
  {
    const F = P.flats.terraces, mid = (F.s[0] + F.s[1]) / 2, len = F.s[1] - F.s[0];
    [[-45, 12, 0.08], [-36.5, 9, 0.05], [-28.5, 9, 0.02]].forEach(([d, w, y], i) => box('crust terrace ' + (i + 1), [mid, d, -0.3], [w, 0.3 + y, len], i === 1 ? '#efe3d6' : C.chalk, heading(mid), { air: 'far' }));
    box('rose brine in the steps', [mid, -32.4, -0.3], [1.2, 0.31, len - 6], C.brineShallow, heading(mid), { air: 'far' });
  }

  // THE WORKS' ONE MOTION OF THEIR OWN: the drip at each sluice's leak. A drop, and a smaller one a third of a second
  // after it, each a small ring on the exact mirror; only within 40 m of the boat (the ripple field reaches 48 m) and
  // only while the water is a mirror (behind the wind a drip is lost). By the realm's clock, so the same moment is the
  // same picture.
  return {
    update(dt, c) {
      for (const mesh of underBedMeshes) { const want = mesh.material.transparent ? 0 : bedOrder - 1; if (mesh.renderOrder !== want) mesh.renderOrder = want; }
      gustU.value.z = (sky.wind || 0) * (c.reducedMotion ? 0.4 : 1);                       // what hangs loose stirs once the wind has come
      const W = shared.works; if (!W || !W.leaks || (sky.wind || 0) > 0.5) return;
      for (const t of W.trickles || []) {                                                  // the open gate: a faint ring every second and a bit, two places by turns
        if (Math.hypot(t.x - c.boat.x, t.z - c.boat.z) > 40) continue;
        const k = Math.floor(c.time / 1.3);
        if (k !== t.last) { t.last = k; c.water.ripple(t.x + (k % 2 ? 0.25 : -0.2), t.z + (k % 3) * 0.05, c.reducedMotion ? 0.04 : 0.07, 0.3); }
      }
      for (const l of W.leaks) {
        if (Math.hypot(l.x - c.boat.x, l.z - c.boat.z) > 40) continue;
        const k = Math.floor((c.time / l.every + l.phase) * 2), part = (c.time / l.every + l.phase) * 2 - k;      // two beats to a period: the drop, then (in the first 0.1 of the next half) nothing
        if (k !== l.last) { l.last = k; l.two = false; if (k % 2 === 0) c.water.ripple(l.x, l.z, 0.2, 0.22); }
        else if (k % 2 === 0 && !l.two && part > 0.7 / l.every) { l.two = true; c.water.ripple(l.x + 0.06, l.z + 0.04, 0.1, 0.16); }
      }
    },
  };
}
