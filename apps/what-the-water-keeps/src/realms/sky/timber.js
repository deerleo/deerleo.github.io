// The standing sky: TIMBER. The other hero pieces that are built of wood (stage 2; docs/build/sky/2-heroes-timber.md):
//
//   the warden's hut (`hut.glb`)       s 186, d -42, behind the left causeway, in a brine pan: a plank cabin on six
//                                      splayed legs. Its arrow vane, its pail and its propped shutter are separate parts
//                                      with their pivots, left STILL here (cast row 14 moves them at the wind):
//                                      shared.hut.parts = { vane, pail, shutter }, and how each turns: shared.hut.turns.
//   the barrow run (`barrow_run.glb`)  five legs of plank path on trestles up the white ridge's near face, to the tipping
//                                      stage with its A-frame at the crest's near end (see THE BARROW RUN, below). Its
//                                      hook hangs still until the wind front has crossed the stage, then swings.
//
// Both wear the area's light and the night air as 'far' (light.js): they thin into the sky with the ridge by night,
// the false dawn shows them as rimmed ghosts, first light makes them solid. Both wear the Light group's painted timber
// and salt. Everything here that is under a hand wide (legs, braces, ladder, planks seen from 30 m) is kept out of the
// painter's filter: see THIN THINGS.
//
// What this module puts in `shared`:
//   shared.hut   { at, floor (heroes_b.js), model, parts: { vane, pail, shutter }, point(name), turns }
//   shared.run   { model (the stage), mesh (the run as laid), hook, stage, head, point(name), stations, landings,
//                  triangles, relay() }
// `&skip=timber` shows the area without the two pieces (their stand-ins are gone: the layout's lines were deleted from
// heroes_b.js when the real things stood).
export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan, sky = shared.sky;

  // ---------------------------------------------------------------------------------------------- THIN THINGS
  // The painter's filter wipes out whatever is thinner than its brush, and the engine's `crisp: true` keeps a thing out
  // of it by writing a mark (-15) into the picture's alpha. That cannot be used with the night air as it stands: the
  // air's last line multiplies alpha by its fade and throws away anything under 0.004, so a crisp thing in the night
  // air is thrown away whole; and while the air is closed the material is blended, and a blended material's alpha is
  // its opacity. So a thin thing here marks itself in two ways:
  //   the air open (opaque, from the dawn's progress 0.45 on)   it writes the engine's mark, as `crisp` does
  //   the air closed (blended: starlight, the false dawn)        colour is blended as always, and the picture's alpha is
  //                                                              blended as  dst * (1 - a) - a : where the thing is all
  //                                                              there, -1, which the filter reads as 97 parts in 100 crisp
  const uThin = { value: 0 };
  const thinExt = { uniforms: { uThinCrisp: uThin }, fragmentPars: 'uniform float uThinCrisp;', final: 'if (uThinCrisp > 0.5) gl_FragColor.a = -15.0;' };
  const thinMats = [];
  const thin = (m) => { if (m && !thinMats.includes(m)) thinMats.push(m); return m; };
  const thinUpdate = () => {
    for (const m of thinMats) {
      const blended = !!m.transparent;
      if (m.userData.thinBlended === blended) continue;
      m.userData.thinBlended = blended;
      if (blended) {
        m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
        m.blendEquationAlpha = THREE.ReverseSubtractEquation; m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
      } else m.blending = THREE.NormalBlending;
    }
    uThin.value = thinMats.length && !thinMats[0].transparent ? 1 : 0;      // (they all wear the same rule of the air, so they open together)
  };
  // What they wear besides the area's light and the night air: the Light group's painted TIMBER (grain, salt bloomed in the
  // grain and caked on what looks at the sky) and, where the model's own paint is chalk (crust socks, caked tops), its SALT.
  const WOOD = { timber: { grain: 0.35, bloom: 0.32 }, salt: { kind: 'crust', glints: 0.25 } };
  const farThin = (dress = {}, more = []) => [...sky.extend({ air: 'far', ...dress }), ...more, thinExt];

  // ---------------------------------------------------------------------------------------------- the warden's hut
  {
    const H = P.hut;
    // AGAINST THE FALSE DAWN it is edged with jade. The aurora's key (light.js) falls on faces turned to the north, and the
    // hut is seen from the south: its lit side is the far one, and it stood as a flat dark shape with no part in the light
    // that shows it (the page: "a jade-rimmed ghost"). So, while the eye looks toward the curtain, whatever turns away
    // from the eye takes a little of its light: the round legs along both edges, the roof's slope seen from below, the
    // pail. It is the aurora's own colour and strength (uAurKey: it breathes and fails with the curtain).
    const jade = { uniforms: { uHutRim: { value: (P.timber.hut || {}).rim ?? 1.6 } }, fragmentPars: 'uniform float uHutRim;',
      light: 'c += uAurKey * (uHutRim * pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.6) * smoothstep(-0.2, 0.7, -dot(V, uAurDir)) * (0.3 + 0.7 * albedo));' };
    const hut = await kit.model('models/sky/hut.glb', { at: [H.at[0], H.at[1], 0], face: 'channel', extend: [...sky.extend({ air: 'far', ...WOOD }), jade], materials: { thin: { extend: farThin(WOOD, [jade]) } } });
    sky.adopt(hut.group, { air: 'far' });
    thin(hut.materials.thin);
    const parts = { vane: hut.parts.vane, pail: hut.parts.pail, shutter: hut.parts.shutter };
    // (a developer's switch, for whoever animates them: `&hutpose=<vane>,<pail>,<shutter>` in radians holds the three
    // parts turned from their rest, vane about y, pail about z, shutter about x: two stills show a pivot is true)
    { const pose = (new URLSearchParams(location.search).get('hutpose') || '').split(',').map(Number);
      if (pose.length === 3 && pose.every(Number.isFinite)) { parts.vane.rotation.y += pose[0]; parts.pail.rotation.z += pose[1]; parts.shutter.rotation.x += pose[2]; } }
    shared.hut = Object.assign(shared.hut || { at: kit.at(H.at[0], H.at[1], 0), floor: H.legs }, {
      model: hut, parts, point: hut.point,
      // how the cast turns them (each is at rest at 0, in the model's own axes: x east down the route, y up, z south toward
      // the channel). CHECKED IN PICTURES with `&hutpose=` (the fourth holder: the sign first published for the vane, +2.443,
      // pointed the arrow south, at the boat; it is MINUS: sky_t4_i_pose_*.png):
      //   vane      rotation.y   at rest the arrow points north-west; -2.443 (140 degrees, clockwise seen from above) points it
      //                          EAST, into the wind that comes at first light
      //   pail      rotation.z   swings it along the route from the joist it is tied to (the pivot): + is toward the east;
      //             rotation.x   swings it across
      //   shutter   rotation.x   hinged along its top edge, propped open 56 degrees at rest: MINUS lifts it off its prop (the
      //                          stick stays where it is), and it knocks when it falls back to 0; plus would push it through the stick
      turns: { vane: { about: 'y', east: -2.443 }, pail: { about: ['z', 'x'], east: 1 }, shutter: { about: 'x', lift: -1, open: 0.977 } },
    });
  }

  // ---------------------------------------------------------------------------------------------- THE BARROW RUN
  // `barrow_run.glb` is the tipping stage with its A-frame (one model, placed where the stand-in stood) and a KIT of
  // hand-made parts: eight planks, six trestles, a tie board, a sway brace, two turning landings, a sill, a cleat. The
  // run itself is laid here, from the kit, along the line of plan.timber.run ON THE FACE AS THE RIDGE PUBLISHES IT
  // (shared.ridge.faceAt(s, y) -> [d, y], heightAt(s, d)): the deck's place across the face is read from the face, and
  // every trestle's legs are long and stand sunk in the salt to whatever depth the face leaves them. If the ridge
  // changes (another object in shared.ridge, or shared.run.relay()), the run is laid again. The whole run is ONE mesh.
  //
  // WHAT THE BOAT SEES OF IT. The nearest water is 28 m from its foot (the crust terraces stop the hull at d -24) and
  // the line is 52 to 90 m off: the boat looks at the run from its downhill side, from below. So what is laid is an
  // ELEVATION, and what makes it a built thing and not a ruled zigzag is in the elevation:
  //   the deck is CRANKED    it stands on trestles of the heights that were to hand: its height over the ledge wanders
  //                          (plan.timber.run.wander) and it changes slope only at some trestles (the planks between
  //                          are straight: a plank spans one bay or two, and the two lanes break at different trestles)
  //   the bays are uneven    a trestle stands up to a quarter of a bay off its place; every post leans its own way
  //   the tie board          runs from trestle to trestle along the downhill posts' heads, lapped at each post
  //   sway braces            from the foot of one post to the head of the next, in some bays (crossed where the deck
  //                          bridges a hollow): they lie along the run, so the boat sees them whole
  //   one plank has slipped  on the third leg its far end has dropped off its trestle onto the ledge
  let runUpdate = () => {};
  try {
    const Rn = P.timber.run, St = P.timber.stage, Rg = P.ridge, CL = Rn.clear, turns = Rn.turns, Wd = Rn.wander || { amp: 0, taper: 3 };
    // BY NIGHT THE RUN IS NO MORE THERE THAN THE SALT IT STANDS ON. The Monument group draws the ridge, while it is night,
    // as thick as the eye's ray is long inside it (heroes.js, "BY NIGHT IT HAS NO EDGE"): it thins to nothing along its
    // crest and at its ends, and the stars come through. Timber standing on it must thin with it, or the stage and the
    // upper legs hang in the sky by themselves and the lower legs are drawn across the first light on the seam. This
    // is the ridge's own rule, with the ridge's own uniforms (so it closes up with the ridge at first light); a point
    // of the run lies just outside the heap, and its ray is as long as the salt's behind it.
    const rdgMat = shared.ridge && shared.ridge.model && shared.ridge.model.materials ? Object.values(shared.ridge.model.materials).find((m) => m && m.uniforms && m.uniforms.uRdgNight && m.uniforms.uRdgHull) : null;
    const withRidge = rdgMat ? [{
      uniforms: { uRdgNight: rdgMat.uniforms.uRdgNight, uRdgFrame: rdgMat.uniforms.uRdgFrame, uRdgO: rdgMat.uniforms.uRdgO, uRdgHull: rdgMat.uniforms.uRdgHull },
      fragmentPars: 'uniform vec4 uRdgNight, uRdgFrame, uRdgHull; uniform vec3 uRdgO;',
      final: /* glsl */`
        if (uRdgNight.x > 0.001) {
          vec3 rq = vWPos - uRdgO, rr = normalize(vWPos - cameraPosition);
          vec3 rp = vec3(dot(rq.xz, uRdgFrame.xy), rq.y, dot(rq.xz, uRdgFrame.zw)), rv = vec3(dot(rr.xz, uRdgFrame.xy), rr.y, dot(rr.xz, uRdgFrame.zw));
          float rk = uRdgHull.x, rtop = uRdgHull.y, rend = rk * uRdgHull.w, rt = 400.0, rn;
          rn = rk * rv.x + rv.y;  if (rn > 1e-4) rt = min(rt, max(rtop - (rk * rp.x + rp.y), 0.0) / rn);
          rn = -rk * rv.x + rv.y; if (rn > 1e-4) rt = min(rt, max(rtop + rk * rp.x - rp.y, 0.0) / rn);
          rn = rk * rv.z + rv.y;  if (rn > 1e-4) rt = min(rt, max(rend - (rk * rp.z + rp.y), 0.0) / rn);
          rn = -rk * rv.z + rv.y; if (rn > 1e-4) rt = min(rt, max(rend + rk * rp.z - rp.y, 0.0) / rn);
          if (rv.y < -1e-4) rt = min(rt, max(rp.y, 0.0) / -rv.y);
          gl_FragColor.a *= mix(1.0, 1.0 - exp(-rt / uRdgNight.y), uRdgNight.x);
        }` }] : [];
    const model = await kit.model('models/sky/barrow_run.glb', { at: [St.at[0], St.at[1], St.deck], face: 'channel', extend: farThin(WOOD, withRidge) });
    sky.adopt(model.group, { air: 'far' });
    const mat = thin(model.materials.thin);
    // ---- the kit: each part's points, normals and paint, in its own axes (x along the run, y up, +z downhill)
    const PLANKS = ['plank_a', 'plank_b', 'plank_c', 'plank_d', 'plank_e', 'plank_f', 'plank_g'];
    const KIT = [...PLANKS, 'plank_new', 'trestle_a', 'trestle_b', 'trestle_c', 'trestle_d', 'trestle_e', 'trestle_tall', 'tie', 'sway', 'landing', 'landing_b', 'sill', 'cleat'];
    const bank = {}, v = new THREE.Vector3(), nm = new THREE.Matrix3();
    for (const name of KIT) {
      const o = model.parts[name];
      if (!o || !o.geometry) throw new Error(`barrow_run.glb has no part "${name}"`);
      const g = o.geometry, pos = g.attributes.position, nor = g.attributes.normal, col = g.attributes.color, n = pos.count;
      const Pp = new Float32Array(n * 3), Nn = new Float32Array(n * 3), Cc = new Float32Array(n * 3);
      o.updateMatrix(); nm.getNormalMatrix(o.matrix);
      let x0 = Infinity, x1 = -Infinity;
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrix); Pp[3 * i] = v.x; Pp[3 * i + 1] = v.y; Pp[3 * i + 2] = v.z; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x);
        v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); Nn[3 * i] = v.x; Nn[3 * i + 1] = v.y; Nn[3 * i + 2] = v.z;
        Cc[3 * i] = col ? col.getX(i) : 1; Cc[3 * i + 1] = col ? col.getY(i) : 1; Cc[3 * i + 2] = col ? col.getZ(i) : 1;
      }
      bank[name] = { P: Pp, N: Nn, C: Cc, idx: g.index ? Array.from(g.index.array) : Array.from({ length: n }, (_, i) => i), n, length: x1 - x0 };
      o.parent.remove(o);                                           // (its geometry is the file's, and is freed with the file)
    }
    const stageTris = model.triangles - KIT.reduce((a, k) => a + bank[k].idx.length / 3, 0);      // the stage and its hook, as drawn

    // ---- directions on the ground (the area's path is one straight line: the same everywhere on the ridge)
    const o0 = sky.at(270, -60, 0), dDir = sky.at(270, -59, 0).sub(o0).normalize(), UP = new THREE.Vector3(0, 1, 0);
    const smooth01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const arrive = model.point('arrive');                                                         // where the last pitch comes onto the stage (the model names the place)
    // (the mesh's own place is the middle of the run: while the night air is closed everything here is blended, and
    // blended things are drawn far to near by their own places: with its place at the realm's origin the run was drawn
    // BEFORE the ridge behind it, and cut its own shape out of the ridge)
    const HOME = sky.at((turns[0][0] + turns[1][0]) / 2, Rg.d[1] - (Rg.d[1] - Rg.crest[0][1]) * 0.5, Rg.height * 0.5);

    const lay = (ridge) => {
      const rnd = ctx.rng(262);
      const face = ridge && ridge.faceAt ? (s, y) => ridge.faceAt(s, y)[0] : (s, y) => Rg.d[1] - (Rg.d[1] - Rg.crest[0][1]) * (y / Rg.height);
      const top = (ridge && ridge.height) || Rg.height;
      // the height of the salt under a place: the ridge's own (heightAt, read off its triangles), or, on a ridge that
      // gives only its face (the layout's stand-in), found by walking the height
      const groundY = ridge && ridge.heightAt ? (s, d) => Math.max(0, ridge.heightAt(s, d))
        : (s, d) => { let lo = 0, hi = top + 0.5; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (face(s, m) > d) lo = m; else hi = m; } return (lo + hi) / 2; };
      const lip = (ridge && ridge.lip) || 0;                                                     // the lip of the undercut: under it the "face" is the crust skirt
      const foot = (s) => (ridge && ridge.footAt ? ridge.footAt(s) : face(s, 0));
      // where the deck's middle lies across the face at a height of the line: over the outer edge of the trodden ledge
      // (the ledge's floor is a hand under the line: just below it the face is the ledge's outer bank)
      const lineD = (s, h) => face(s, Math.max(lip + 0.06, h - 0.22)) - 0.12;
      const out = { pos: [], nor: [], col: [], idx: [] }; let base = 0;
      const m4 = new THREE.Matrix4(), q = new THREE.Vector3(), nq = new THREE.Vector3(), loc = {};
      const emit = (name, X, Y, Z, at, tint = 1, sx = 1, sy = 1) => {
        const b = bank[name];
        m4.makeBasis(X, Y, Z); nm.setFromMatrix4(m4);
        for (let i = 0; i < b.n; i++) {
          q.set(b.P[3 * i] * sx, b.P[3 * i + 1] * sy, b.P[3 * i + 2]).applyMatrix3(nm).add(at); out.pos.push(q.x, q.y, q.z);
          nq.set(b.N[3 * i], b.N[3 * i + 1], b.N[3 * i + 2]).applyMatrix3(nm); out.nor.push(nq.x, nq.y, nq.z);
          out.col.push(b.C[3 * i] * tint, b.C[3 * i + 1] * tint, b.C[3 * i + 2] * tint);
        }
        for (const k of b.idx) out.idx.push(base + k); base += b.n;
      };
      // a frame from the way a thing runs (any direction) and the downhill side: X along, Z level and downhill, Y up.
      // yaw: a turn about the plumb line; roll: a lean down or up the hill; rack: a lean along the run.
      const frame = (along, yaw = 0, roll = 0, rack = 0) => {
        const X = along.clone().normalize(), Z = new THREE.Vector3().crossVectors(X, UP).normalize();
        if (Z.dot(dDir) < 0) { Z.negate(); X.negate(); }                                         // downhill is always +Z, whichever way the leg runs (the frame stays right-handed, Y up)
        if (yaw) { X.applyAxisAngle(UP, yaw); Z.applyAxisAngle(UP, yaw); }
        const Y = new THREE.Vector3().crossVectors(Z, X).normalize();
        if (roll) { Y.applyAxisAngle(X, roll); Z.applyAxisAngle(X, roll); }
        if (rack) { X.applyAxisAngle(Z, rack); Y.applyAxisAngle(Z, rack); }
        return { X, Y, Z };
      };
      // a board of the kit (one metre long about its middle) stretched from a to b, its depth in the plumb plane
      const board = (name, a, b, tint, over = 0) => {
        const F = frame(new THREE.Vector3().subVectors(b, a)), len = a.distanceTo(b) + 2 * over;
        emit(name, F.X, F.Y, F.Z, a.clone().add(b).multiplyScalar(0.5), tint, len);
      };
      const routeOf = (p) => { ctx.path.locate(p.x, p.z, null, loc); return [loc.s, loc.d]; };
      const groundAt = (p, off = 0) => { const [s, d] = routeOf(p); return groundY(s, d + off); };
      // the deck's height over the ledge wanders along the run (metres from the foot): two slow waves, the same every time
      const wander = (u) => Wd.amp * (0.62 * Math.sin(u * 0.47 + 1.9) + 0.38 * Math.sin(u * 1.13 + 0.4)) + (Wd.lift || 0);
      const stations = [], landings = [];
      let travelled = 0;
      // ---- the deck's line, leg by leg
      for (let i = 0; i < turns.length - 1; i++) {
        const [s0, h0] = turns[i], [s1, h1] = turns[i + 1], dir = Math.sign(s1 - s0), len = Math.abs(s1 - s0), N = Rn.spans[i];
        const f0 = i === 0 ? 0 : 0.17 / len, f1 = i === turns.length - 2 ? 1 : 1 - 0.17 / len, last = i === turns.length - 2;
        const leg = [];
        for (let k = 0; k <= N; k++) {
          const jit = k === 0 || k === N ? 0 : (rnd() - 0.5) * (Rn.uneven ?? 0.34), f = f0 + (f1 - f0) * (k + jit) / N;
          const s = s0 + (s1 - s0) * f, h = h0 + (h1 - h0) * f;
          const along = Math.abs(s - s0), toEnd = Math.abs(s1 - s);
          let d = lineD(s, h), y = h + CL;
          if (i === 0) y = h + Math.min(CL, 0.14 + 0.13 * along);                                // it comes up off the crust at the foot
          // (the wander is nothing at a landing, which stands at the line's own height, and comes in over a few metres)
          const w = wander(travelled + along) * smooth01(0, Wd.taper, along) * smooth01(0, Wd.taper, toEnd) * (i === 0 ? smooth01(4, 9, along) : 1);
          y += last ? 0 : w;
          if (i > 0) d -= 0.31 * (1 - smooth01(0, 4, along));                                    // leaving a landing on its uphill half
          if (!last) d += 0.31 * (1 - smooth01(0, 4, toEnd));                                    // coming onto the next on its downhill half
          if (!last && k > 0 && k < N) y = Math.max(y, groundY(s, d) + 0.34);                    // never lower than a foot over the ledge's own floor (the fans at the turns stand over the line)
          const p = sky.at(s, d, y);
          if (last && k > 0) p.copy(leg[0].p).lerp(arrive, (f - f0) / (1 - f0));                 // the last pitch is one straight ramp from its landing to the stage: it leaves the ledge as it climbs, on taller and taller trestles
          if (i === 0 && k === 0) { const ds = foot(s0) + 0.75; p.copy(sky.at(s0, ds, groundY(s0, ds) + 0.14)); }      // the foot: a sill on the crust skirt, just outside the salt
          leg.push({ p, s, d, k, i, N, crank: k === 0 || k === N || last || rnd() < (Rn.cranks ?? 0.5) });
        }
        // the deck changes slope only at SOME trestles: between two such, the trestles stand under one straight line
        // (never more than two in a row, or the line would leave the ledge)
        for (let a = 0; a < N;) {
          let b = a + 1; while (b < N && !leg[b].crank && b - a < 3) b++;
          leg[b].crank = true;
          if (b - a > 1) {
            let total = 0; const cum = [0];
            for (let k = a + 1; k <= b; k++) { total += Math.hypot(leg[k].p.x - leg[k - 1].p.x, leg[k].p.z - leg[k - 1].p.z); cum.push(total); }
            for (let k = a + 1; k < b; k++) leg[k].p.lerpVectors(leg[a].p, leg[b].p, cum[k - a] / total);
          }
          a = b;
        }
        for (let k = 0; k <= N; k++) {                                                           // the way the run goes at each trestle, on the level
          const a = leg[Math.max(0, k - 1)].p, b = leg[Math.min(N, k + 1)].p;
          leg[k].t = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
        }
        stations.push(leg);
        travelled += Math.hypot(len, h1 - h0);
        if (!last) {                                                                             // the turning landing at the head of this leg
          const sc = s1 + dir * 0.55, hc = h1;
          landings.push({ p: sky.at(sc, lineD(s1, hc), hc + CL + 0.02), dir });
        }
      }
      // ---- trestles, the tie board, sway braces, planks, cleats
      let newPlank = false, newPost = 0, slipped = false;
      const SLIP = Rn.slipped || [2, 5];                                                         // [leg, bay] of the plank that has dropped
      const wood = () => 0.84 + rnd() * 0.2;
      for (const leg of stations) {
        const N = leg[0].N, i = leg[0].i, steep = i === stations.length - 1;
        // which trestle stands at each station (none where a landing or the stage carries the ends)
        for (let k = 0; k <= N; k++) {
          const st = leg[k];
          st.off = st.p.clone().addScaledVector(frame(st.t).Z, 0.52);                            // the downhill posts' outer face, at the deck's height
          st.clear = st.p.y - groundAt(st.p, 0.45);                                              // how far the deck stands above the salt on its downhill side
          if (i === 0 && k === 0) { const F = frame(new THREE.Vector3().subVectors(leg[1].p, leg[0].p).setY(0), 0.08); emit('sill', F.X, F.Y, F.Z, st.p.clone().addScaledVector(UP, -0.05), 0.96); continue; }
          if (k === 0 || k === N) continue;
          const F = frame(st.t, (rnd() - 0.5) * 0.14, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.085);
          let name;
          if (st.clear > 1.75) name = 'trestle_tall';
          else { const r = rnd(); name = r < 0.26 ? 'trestle_a' : r < 0.46 ? 'trestle_c' : r < 0.66 ? 'trestle_b' : r < 0.86 ? 'trestle_e' : 'trestle_d'; if (name === 'trestle_d' && ++newPost > 2) name = 'trestle_a'; }
          // (the tall trestle's long leg reaches 3.57 m under the deck: where the ridge, sculpted again, leaves a hollow deeper than
          // that, the trestle is drawn out so that its legs still stand a hand and a half in the salt)
          const tallReach = Rn.tallReach ?? 3.57, sy = name === 'trestle_tall' ? Math.max(1, (st.clear + 0.4) / tallReach) : 1;
          emit(name, F.X, F.Y, F.Z, st.p.clone().addScaledVector(UP, -0.052), 0.9 + rnd() * 0.16, 1, sy);
        }
        for (let k = 0; k < N; k++) {
          const a = leg[k], b = leg[k + 1], tall = Math.max(a.clear, b.clear) > 1.75;
          // the tie board, lapped at each post: every other one lies over its neighbours' ends
          if (!(i === 0 && k === 0)) {
            const lapZ = (k % 2) * 0.05, Fa = frame(a.t), Fb = frame(b.t);
            board('tie', a.off.clone().addScaledVector(Fa.Z, lapZ).addScaledVector(UP, -0.037 + (rnd() - 0.5) * 0.02), b.off.clone().addScaledVector(Fb.Z, lapZ).addScaledVector(UP, -0.037 + (rnd() - 0.5) * 0.02), wood(), 0.09 + rnd() * 0.1);
          }
          // sway braces: from low on one post to the head of the next, on the outside of the tie
          const sways = tall ? [1, -1] : (k > 0 || i > 0) && k < N - (steep ? 0 : 1) && rnd() < (Rn.sway ?? 0.4) ? [rnd() < 0.5 ? 1 : -1] : [];
          for (const way of sways) {
            const lo = way > 0 ? a : b, hi = way > 0 ? b : a, deep = Math.min(tall ? 2.7 : 1.5, Math.max(0.7, lo.clear + 0.25)), Fl = frame(lo.t), Fh = frame(hi.t);
            const A = lo.off.clone().addScaledVector(Fl.Z, 0.1 + 0.13 * deep).addScaledVector(UP, -deep), B = hi.off.clone().addScaledVector(Fh.Z, 0.1).addScaledVector(UP, -0.1);
            board('sway', A, B, wood(), 0.12 + rnd() * 0.12);
          }
          if (steep) {                                                                            // cleats across the planks of the steep last pitch, for the feet
            const way = new THREE.Vector3().subVectors(b.p, a.p), span = way.length(), F = frame(way); way.normalize();
            for (let t = 0.2 + rnd() * 0.1; t < span - 0.1; t += 0.4 + rnd() * 0.06) emit('cleat', F.X, F.Y, F.Z, a.p.clone().addScaledVector(way, t).addScaledVector(F.Y, 0.002), 0.95);
          }
        }
        // the planks, lane by lane: a plank spans one bay, or two where the deck runs straight over the trestle between
        for (const lane of [-1, 1]) {
          for (let k = 0; k < N;) {
            const two = k + 2 <= N && !leg[k + 1].crank && leg[k].p.distanceTo(leg[k + 2].p) < 5.7 && rnd() < 0.62, k1 = k + (two ? 2 : 1);
            const a = leg[k], b = leg[k1], Fa = frame(a.t), Fb = frame(b.t);
            const A = a.p.clone().addScaledVector(Fa.Z, lane * 0.128), B = b.p.clone().addScaledVector(Fb.Z, lane * 0.128), span = A.distanceTo(B);
            const gap = 0.012 + rnd() * 0.05, want = span - gap;
            let name = PLANKS[0], best = 1e9;
            for (const c of PLANKS) { const e = Math.abs(bank[c].length - want) + rnd() * 0.12; if (e < best) { best = e; name = c; } }
            if (!newPlank && i === 0 && k >= 3 && lane === 1 && !two) { name = 'plank_new'; newPlank = true; }      // one plank replaced, low on the first leg where it is seen
            if (!slipped && i === SLIP[0] && k >= SLIP[1] && lane === 1 && !two) {
              // ONE PLANK HAS SLIPPED: its far end has come off its trestle and lies on the ledge under the deck
              slipped = true;
              const Bd = B.clone().addScaledVector(Fb.Z, 0.1); Bd.y = groundAt(Bd) + 0.05;
              const F = frame(new THREE.Vector3().subVectors(Bd, A), 0, 0.12);
              emit(name, F.X, F.Y, F.Z, A.clone().lerp(Bd, 0.5).addScaledVector(F.X, 0.08), 0.92, 1);
              k = k1; continue;
            }
            const F = frame(new THREE.Vector3().subVectors(B, A), (rnd() - 0.5) * 0.014, (rnd() - 0.5) * 0.05);
            const mid = A.clone().add(B).multiplyScalar(0.5).addScaledVector(F.X, (rnd() - 0.5) * gap).addScaledVector(F.Y, 0.004 * (rnd() - 0.5));
            emit(name, F.X, F.Y, F.Z, mid, name === 'plank_new' ? 1 : 0.86 + rnd() * 0.2, want / bank[name].length);
            k = k1;
          }
        }
      }
      landings.forEach((L, n) => { const F = frame(new THREE.Vector3(0, 0, 0).copy(dDir).cross(UP).multiplyScalar(-L.dir), (rnd() - 0.5) * 0.06); emit(n === (Rn.brokenRail ?? 1) ? 'landing_b' : 'landing', F.X, F.Y, F.Z, L.p, 0.94 + rnd() * 0.1); });
      const g = new THREE.BufferGeometry();
      for (let n = 0; n < out.pos.length; n += 3) { out.pos[n] -= HOME.x; out.pos[n + 1] -= HOME.y; out.pos[n + 2] -= HOME.z; }
      g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
      g.setIndex(out.idx); g.computeBoundingSphere(); g.computeBoundingBox();
      return { geometry: g, stations, landings, triangles: out.idx.length / 3 };
    };

    let laid = lay(shared.ridge), ridgeUsed = shared.ridge;
    const mesh = new THREE.Mesh(laid.geometry, mat); mesh.name = 'barrow run'; mesh.position.copy(HOME); ctx.add(mesh);
    const relay = () => { const old = mesh.geometry; laid = lay(shared.ridge); ridgeUsed = shared.ridge; mesh.geometry = laid.geometry; old.dispose(); Object.assign(shared.run, { stations: laid.stations, landings: laid.landings, triangles: laid.triangles + stageTris }); };
    const hook = model.parts.hook, hookAt = model.point('hook_hang');
    shared.run = { model, mesh, hook, stage: model.point('deck'), head: model.point('head'), point: model.point, stations: laid.stations, landings: laid.landings, triangles: laid.triangles + stageTris, relay };
    // The hook hangs still in the still air; when the wind front has crossed the stage it swings, and settles to a small unrest.
    let since = -1;
    runUpdate = (dt) => {
      if (shared.ridge !== ridgeUsed) relay();
      const blown = sky.front && sky.front.z > hookAt.z;
      since = blown ? (since < 0 ? 0 : since + dt) : -1;
      const k = ctx.reducedMotion ? 0.5 : 1, a = since < 0 ? 0 : k * (0.26 * Math.exp(-since / 7) * Math.sin(since * 3.3) + 0.035 * (1 - Math.exp(-since / 3)) * Math.sin(since * 1.3 + 1));
      if (hook) { hook.rotation.z = -a; hook.rotation.x = 0.35 * a * Math.cos(since * 2.1); }
    };
  } catch (err) {
    console.error(`INVALID_MODEL sky/timber: the barrow run was not laid: ${(err && err.stack) || err}`);
  }

  return {
    update(dt) {
      thinUpdate();
      runUpdate(dt);
    },
  };
}
