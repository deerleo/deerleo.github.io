// The standing sky: the OTHER HERO PIECES (everything one of a kind that is not the monument, which is the great wader
// and its kin and the white ridge: heroes.js). What is made HERE:
//
//   the kept lamp (the engine's)      REAL: the ride's storm lantern on its crooked 2.4 m post, alone in the open mirror at
//                                     s 136. The page has it ON the line; its flame hangs 3 m left of it, at the head of
//                                     the stakes' line (the post stands at d -3.7: see plan.js, the route, and the log).
//                                     Note E5 (76), near 8 m, three moths. With it, made here: its amber stroke on the
//                                     exact mirror. (Its crust collar and iron mooring ring are the Shallows group's,
//                                     kit_shallows.js; the two stand-in lines for them are still below and are taken out
//                                     from there.)
//   the far jetty (`jetty.glb`)       REAL since 8 November: THE LANDING'S OWN BUILD (assets/models/landing/jetty.glb, nothing
//                                     of it is modelled here), at s 286, head 2.5 m right of the line, mirrored, salt-
//                                     bleached in the material, in the area's light. If the file does not load the
//                                     layout's stand-in stands and a page error says so (`&jetty=standin` asks for that).
//                                     Lashed to its fender pile, the far lamp (the engine's), COLD. Staging lights it: the
//                                     flame crosses from the prow lantern (flameCrossing, 5 s), then
//                                     shared.farLamp.setLit(true, 2); its three moths come to it by themselves once it
//                                     burns. THE FAR LAMP IS MADE BEFORE THE KEPT ONE (the engine keeps one kept-lamp
//                                     light and the lamp made last owns it).
//   the coil of dry rope              REAL (`rope_coil.glb`, this area's own): a hank hung on the jetty's second mooring
//                                     post; it swings once when the wind front has passed, and keeps a small unrest.
//   the white ridge                   only as a FALLBACK: the layout's plain stand-in, made here when heroes.js has not
//                                     published shared.ridge (it failed, or &skip=heroes), so that the area still has its
//                                     second monument and the barrow run something to stand on.
// What stood here and is now elsewhere: the warden's hut (`hut.glb`) and the barrow run with its tipping stage
// (`barrow_run.glb`) are real, in timber.js (the module after this one); this file still publishes shared.hut's place.
// What this module puts in `shared`: shared.lamp (the kept lamp; shared.lamp.flame is its flame's place),
// shared.farLamp (the cold lamp; .flame, .moths), shared.hut = { at, floor } (timber.js adds the model, its parts and
// points to it), shared.jetty = { s, head, root, deck } and, with the real jetty, { model, piles: [{ x, z, r }], posts:
// { up, down } (the heads of the two mooring posts), rings, ladder, step, lashing, coil, point(name) }; and
// shared.ridge = { faceAt, height, crest } only as the fallback.
import * as lampFile from '../../engine/lamp.js';
import { FOG_PARS } from '../../engine/kit.js';
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, engine } = ctx, P = plan, C = P.colors, sky = shared.sky, sh = engine.shared;
  const box = (name, at, size, color, turn = 0, paint) => sky.standIn({ name, at, size, color, turn, paint });
  const facing = (s) => ctx.path.at(s).heading;

  // TWO LAMP FILES. The ride's lamp is the remodelled one (src/engine/lamp-hero.js, through lamp.js, since 19:49 on
  // 7 November): it has a far point of light and an amber halo of its own, follows each area's light, and shares the
  // painted world's lamp light between two lamps. This module takes it as it is (`remodelled`) and adds ONE thing: the
  // stroke on the exact mirror (below). For the ride's first lamp (src/engine/lamp-first.js) the module also kept a far
  // spark, a stronger halo and the area's light on the post: that path is still here, and is taken only if the file
  // behind lamp.js exports no HOLDINGS.
  let lamps = lampFile;
  if (!lamps.HOLDINGS && new URLSearchParams(location.search).get('lamp') === 'hero') lamps = await import('../../engine/lamp-hero.js');
  const remodelled = !!lamps.HOLDINGS, makeKeptLamp = lamps.makeKeptLamp;
  if (remodelled && lamps.loadLamp) await lamps.loadLamp(['post']);

  // WHAT STANDS IN THE LAKE GOES DOWN THROUGH THE BED, and the bed writes no depth (set.js): drawn after it, a pile or a
  // lamp post showed through the sand as a dark stick a metre long, beside its own reflection. Drawn BEFORE the bed, the
  // sand covers what is sunk in it (as the Tools and Shallows groups draw their sunk things).
  const bedOrder = ((ctx.group.getObjectByName('lake bed') || ctx.group.getObjectByName('standin:lake bed') || {}).renderOrder) ?? -6;
  let coilUpdate = () => {};
  const beforeBed = (root) => root.traverse((o) => { if (o.isMesh && o.material && o.material.isGouache) o.renderOrder = bedOrder - 1; });      // (whatever the night air makes of its material at this moment: nothing here is near the eye while its air is closed)

  // ---------------------------------------------------------------------------------------------- the far jetty and its cold lamp
  // (made before the kept lamp: the engine keeps ONE kept-lamp light for painted things, and the lamp made last owns it)
  {
    const J = P.jetty, s = J.s, mid = (J.head + J.root) / 2, len = J.root - J.head, h = facing(s), F = P.farLamp, TJ = (P.timber || {}).jetty || {};
    let jetty = null, lampAt = F.at;
    // ---- `jetty.glb`, THE LANDING'S (assets/models/landing/, source-art/models/landing/jetty.py: "one build for the
    // landing and for the far landing at the end"). Its front is its head and it is laid from the head toward its root,
    // as plan.jetty has it. The landing's stands on the left of its route and has the fender pile, the lamp and the worn
    // edge on its down-route flank; this one stands on the right, so it is the same build MIRRORED: the lamp is on the
    // flank the boat has passed when the flame crosses, and looking back from the end its stroke lies on open water.
    //
    // (three small extensions that the jetty and the coil of rope both wear)
    // thin members keep out of the painter's filter from a few metres off (the ladder's rungs, the toe rail, the ropes: at
    // 12 m, where postcard 11 stands, a rung is two pixels); written before the night air's last word, as light.js asks
    const crisp = (k) => ({ final: `gl_FragColor.a = mix(gl_FragColor.a, -15.0, uAir.z * smoothstep(${k[0].toFixed(1)}, ${k[1].toFixed(1)}, dist));` });
    // a lamp's light falls away with the square of the distance (the Shallows group's law, kit_shallows.js: without it the
    // timber beside the far lamp and beside the bow lantern is lit as if it hung in the lantern: a salmon stick)
    const lampFall = { light: '{ vec3 jTo = uLampPos - vWPos; c += albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * (1.4 / (1.0 + dot(jTo, jTo)) - 1.0); }' };
    const lanternFall = { light: `{ vec3 jL = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (min(${(TJ.lantern ?? 2.2).toFixed(2)} / (1.0 + dot(jL, jL)), 1.0) - 1.0); }` };
    try {
      if (new URLSearchParams(location.search).get('jetty') === 'standin') throw new Error('asked for with &jetty=standin');      // (a developer's switch: the layout's stand-in, to compare with)
      const B = TJ.bleach || { timber: [0.86, 0.17, 0.72], rope: [0.6, 0.3, 0.8] }, K = TJ.crisp || { timber: [8, 20], rope: [4, 10] };
      // SALT-BLEACHED IN THE MATERIAL (the page, section 10, item 8). The file is painted in the landing's fen oak, tea-brown
      // in its shade. Here every colour of it goes most of the way to the area's timber grey at the same paleness (a
      // little of its own warmth is left: rust weep, end grain), and its contrast is drawn in a little so that worn
      // boards do not stand as chalk in first light. Then it wears what all the area's timber wears (light.js): the grain,
      // salt bloomed in it and caked on what looks at the sky, a dark wet band and a white dry line at the water.
      const bleach = (n, to, k) => ({ uniforms: { [`u${n}To`]: { value: new THREE.Color(to) }, [`u${n}K`]: { value: new THREE.Vector3(k[0], k[1], k[2]) } }, fragmentPars: `uniform vec3 u${n}To, u${n}K;`,
        albedo: `{ float bl = max(dot(albedo, vec3(0.2126, 0.7152, 0.0722)), 1e-4); albedo = mix(albedo, u${n}To * pow(bl / u${n}K.y, u${n}K.z), u${n}K.x); }` });
      // SALT BLOOM ON THE WINDWARD SIDE (the page's hero table). The wind that comes at first light comes from dead ahead:
      // the planks toward the down-route flank, and every face that looks down the route, are whiter with it, in blotches.
      // They are the faces a rider sees who has passed the jetty and looks back at the lamp.
      const here0 = ctx.path.at(s), mid0 = kit.at(s, J.head);
      const windward = { uniforms: { uJtWind: { value: new THREE.Vector4(here0.tx, here0.tz, mid0.x * here0.tx + mid0.z * here0.tz, TJ.windward ?? 0.5) } }, fragmentPars: 'uniform vec4 uJtWind;',
        albedo: `{ float jw = max(dot(N.xz, uJtWind.xy), 0.0), jAcross = dot(vWPos.xz, uJtWind.xy) - uJtWind.z, jn = texture2D(tBrush, vWPos.xz * 0.83 + vWPos.y * 0.31).r;
          float jk = (max(N.y, 0.0) * smoothstep(-0.5, 0.6, jAcross) * 0.8 + jw) * smoothstep(0.43, 0.6, jn) * uJtWind.w * step(0.28, vWPos.y);
          albedo = mix(albedo, uSaltChalk * 0.93, clamp(jk, 0.0, 0.62)); }` };
      jetty = await kit.model('models/landing/jetty.glb', { at: [s, J.head, 0], face: 'channel', scale: [-1, 1, 1], name: 'far jetty', brush: 0.8, collide: TJ.collide || [[0, -0.5, 0.8], [0, -1.8, 0.8], [0, -3.1, 0.8], [0, -4.4, 0.8], [0, -5.7, 0.8]],
        extend: [bleach('Jt', C.timber, B.timber), crisp(K.timber), ...sky.extend({ air: 'near', timber: { grain: 0.3, bloom: 0.34 }, waterline: true }), windward, lampFall, lanternFall],
        materials: { plain: { extend: [bleach('Jr', TJ.rope || '#B5A78C', B.rope), crisp(K.rope), ...sky.extend({ air: 'near', waterline: true }), lampFall, lanternFall] } } });
      sky.adopt(jetty.group, { air: 'near' });
      beforeBed(jetty.group);
      // the lamp's post stands where the model says, lashed to the fender pile (the part `lamp_lashing`). The engine's post is
      // crooked, and beside a mirrored jetty its crook is the other way: its foot stands a hand further down the route, so
      // that post and pile touch at the height of the lashings as they do at the landing.
      const q = jetty.point('lamp_post'), here = ctx.path.at(s);
      const loc = ctx.path.locate(q.x + here.tx * (TJ.crook ?? 0.067), q.z + here.tz * (TJ.crook ?? 0.067));
      lampAt = F.at = [Math.round(loc.s * 1000) / 1000, Math.round(loc.d * 1000) / 1000];      // (written into the plan: the Shallows group's collar for this post reads it there)
    } catch (err) {
      console.error(`INVALID_MODEL sky/heroes_b: the landing's jetty.glb did not come (${(err && err.message) || err}): the stand-in stands`);
      jetty = null;
    }
    if (!jetty) {
      // THE FALLBACK, the layout's STAND-IN: plank deck 6 by 1.4 m at 0.6 m, four bents, the head pair standing 0.9 m above the deck as mooring posts
      box('far jetty: deck', [s, mid, J.deck - 0.1], [len, 0.1, J.width], C.timber, h);
      for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
        const d = J.head + 0.25 + i * (len - 0.5) / 3, top = i === 0 ? J.deck + J.post : J.deck - 0.1;
        sky.standIn({ name: i === 0 ? 'far jetty: mooring post' : 'far jetty: pile', at: [s + side * (J.width / 2 - 0.1), d, -0.25], size: [0.18, top + 0.25, 0.18], shape: 'cylinder', color: i === 0 ? '#7c7484' : C.timber });
      }
      box('far jetty: coil of dry rope', [s - 0.45, J.head + 0.3, J.deck + J.post], [0.34, 0.1, 0.34], '#b5a78c');
      for (let i = 0; i < 4; i++) { const p = kit.at(s, J.head + 0.6 + i * (len - 0.9) / 3); ctx.addCollider({ x: p.x, z: p.z, r: 1.0 }); }
      lampAt = F.at = [J.s + 0.7, J.head + 0.2];                                    // (the stand-in's head corner, where the layout stood the lamp)
    }
    // THE LAMP YOU LIT (plan.timber.jetty.lamp: stroke, haloGain, halo, night). It is lit at first light, on wind-ruffled
    // water under a pale sky, and it is the last picture of the ride (postcard 12: "the new flame and its broken stroke
    // growing small against the lilac west"). As the engine makes a lamp it was, lit, a flame in clear glass without a
    // glow, dimmer than the kept lamp 170 m behind it (which has its glow lifted, below), and its shine on the water was
    // a few pale flecks. Its shine in the mirror is twice as broad, so that the ruffled water draws a broken stroke out
    // of it, and its glow is lifted as the kept lamp's is. A cold lamp shows neither: nothing changes until it is lit.
    const FL = TJ.lamp || {};
    const far = makeKeptLamp(engine, ctx, { at: lampAt, lit: false, note: F.note, near: F.near, reach: F.reach, moths: F.moths, ...(remodelled ? { face: 'channel', night: !!FL.night, halo: FL.halo ?? 1, stroke: FL.stroke ?? 1 } : { turn: h + Math.PI }), ...(jetty ? {} : { lean: 0.1 }) });      // its arm reaches toward the line
    if (!remodelled) {
      sky.adopt(far.group);
      far.mothsMesh = far.group.getObjectByName('moths'); if (far.mothsMesh) far.mothsMesh.visible = false;      // they come 4 s after it is lit (staging shows them: shared.farLamp.mothsMesh; the remodelled lamp's moths come to a lit lamp by themselves)
    }
    if (far.ready && far.holder) far.ready.then(() => beforeBed(far.holder));     // (its post goes 1.4 m down through a bed a hand deep)
    if (remodelled && far.lantern && 'haloGain' in far.lantern) far.lantern.haloGain = FL.haloGain ?? 1;
    far.flame = remodelled ? far.position.clone() : kit.at(lampAt[0], lampAt[1] - 0.66, 2.26);
    far.light = ctx.light({ position: [far.flame.x, far.flame.y, far.flame.z], color: C.amber, radius: F.reach, intensity: 0 });      // its light on painted things, once it burns (the ride's own lamp file keeps ONE lamp light; the remodelled one shares it, and this stays dark)
    shared.farLamp = far;
    if (new URLSearchParams(location.search).get('farlit') === '1') far.setLit(true, 0.1);      // (a developer's switch: the far lamp as staging will light it, for pictures of the jetty in its light)
    // shared.jetty: its place, and (with the real jetty) its model, where every pile stands in the lake (the Shallows
    // group lays a crust collar round each: [{ x, z, r }]), the heads of the two mooring posts, its rings, its ladder
    // and its step, each as the model names them
    shared.jetty = { s, head: J.head, root: J.root, deck: J.deck };
    if (jetty) {
      const pt = (name) => jetty.point(name), piles = [];
      for (let i = 1; i <= 8; i++) { const q = pt('pile_' + i); piles.push({ x: q.x, z: q.z, r: i <= 2 ? 0.1 : 0.09 }); }
      { const q = pt('fender_pile'); piles.push({ x: q.x, z: q.z, r: 0.074 }); }
      // (the mirror turns the model's left and right about: `up` is the head post the boat reaches first, `down` the one by the lamp)
      const a = pt('head_left_top'), b = pt('head_right_top'), aUp = ctx.path.locate(a.x, a.z).s < ctx.path.locate(b.x, b.z).s;
      Object.assign(shared.jetty, { model: jetty, piles, posts: { up: aUp ? a : b, down: aUp ? b : a }, rings: { post: pt('ring_post'), edge: pt('ring_edge') }, ladder: pt('ladder'), step: pt('step'), lashing: jetty.parts.lamp_lashing, point: jetty.point });
      // ---- THE COIL OF DRY ROPE on the second mooring post (`rope_coil.glb`, this area's own: source-art/models/sky/rope_coil.py):
      // a hank of old line hung by its bight in the neck of the head post the boat reaches first, on the quarter between
      // the line and the way the boat comes from (clear of the post's iron ring), at the rider's eye height. The model's
      // placing point is its pivot, the post's axis at the neck (0.28 m under the head, measured off jetty.glb): the whole
      // hank is turned about its own front axis to swing it. Still in the still air; when the wind has come it swings
      // once, heavily, and keeps a small unrest.
      try {
        const Kc = TJ.coil || {}, top = shared.jetty.posts.up, foot = piles.slice(0, 2).sort((u, v) => Math.hypot(u.x - top.x, u.z - top.z) - Math.hypot(v.x - top.x, v.z - top.z))[0];
        const k = (Kc.under ?? 0.28) / top.y, neck = [top.x + (foot.x - top.x) * k, top.y - (Kc.under ?? 0.28), top.z + (foot.z - top.z) * k];
        const here = ctx.path.at(s), w = (Kc.toward ?? 18) * Math.PI / 180, dx = -here.rx * Math.cos(w) - here.tx * Math.sin(w), dz = -here.rz * Math.cos(w) - here.tz * Math.sin(w), ry = Math.atan2(dx, dz);
        const hank = await kit.model('models/sky/rope_coil.glb', { position: neck, rotation: [0, ry, 0], live: true, name: 'far jetty: coil of dry rope', brush: 0.8,
          extend: [crisp((TJ.crisp || {}).rope || [4, 10]), ...sky.extend({ air: 'near' }), lampFall, lanternFall] });
        sky.adopt(hank.group, { air: 'near' });
        shared.jetty.coil = hank;
        let since = -1;
        coilUpdate = (dt) => {
          const blown = sky.front && sky.front.z > neck[2];
          since = blown ? (since < 0 ? 0 : since + dt) : -1;
          const calm = ctx.reducedMotion ? 0.5 : 1, A = Kc.swing ?? 0.11, rate = Kc.rate ?? 2.6, die = Kc.settle ?? 9;
          const a = since < 0 ? 0 : calm * (A * Math.exp(-since / (die / 3)) * Math.sin(since * rate) + 0.2 * A * (1 - Math.exp(-since / 4)) * Math.sin(since * 0.9 + 0.6) * (0.6 + 0.4 * Math.sin(since * 0.23)));
          hank.set({ position: neck, rotation: [0, ry, a] });
        };
      } catch (err) { console.error(`INVALID_MODEL sky/heroes_b: the coil of rope was not hung: ${(err && err.message) || err}`); }
    }
  }

  // ---------------------------------------------------------------------------------------------- the kept lamp
  const Lp = P.lamp, lamp = shared.lamp = makeKeptLamp(engine, ctx, { at: Lp.at, note: Lp.note, near: Lp.near, reach: Lp.reach, moths: Lp.moths, intensity: remodelled ? Lp.hero.intensity : Lp.intensity, ...(remodelled ? { face: 'channel' } : { turn: facing(Lp.at[0]) }) });      // its arm reaches to the right, toward the line the boat passes on
  { const x = new URLSearchParams(location.search).get('hbx') || ''; if (x.includes('far')) shared.farLamp.group.visible = false; if (x.includes('kept')) lamp.group.visible = false; }      // TEMPORARY (the cost of the lamps: see the log)
  if (!remodelled) sky.adopt(lamp.group);                                        // the post takes the area's light (by starlight it is a dark shape with its own warm top); the remodelled lamp's holding follows look.light by itself
  if (lamp.ready && lamp.holder) lamp.ready.then(() => beforeBed(lamp.holder));  // (its post goes 1.4 m down through a bed a hand deep: under the lamp a dark blue stick stood in the water beside the post's reflection)
  // Its halo. The engine's lantern wears two soft amber discs, ADDED to the picture: a thin amber added to ultramarine is
  // rose, and from 12 m (postcard 4) the one warm point of the sphere was a pale pink bloom where the key painting has
  // amber (sampled: halo #8E7395 against the painting's #715D66, flame #DAB9AF against #C4976C). Stronger discs stay
  // amber to their middle; the lantern itself is untouched.
  if (!remodelled) { lamp.lantern.halo.material.color.multiplyScalar(Lp.halo[0]); lamp.lantern.wide.material.color.multiplyScalar(Lp.halo[1]); }
  // (the remodelled lamp keeps its amber by itself; here only its glow is lifted a little, on the deepest blue of the ride,
  // while its light on painted things stays the ride's own: at the first lamp's 1.5 the bare stake 2 m from it was a salmon stick)
  if (remodelled && lamp.lantern && 'haloGain' in lamp.lantern) lamp.lantern.haloGain = Lp.hero.haloGain;
  const foot = kit.at(Lp.at[0], Lp.at[1]), flame = lamp.flame = remodelled ? lamp.position.clone() : kit.at(Lp.at[0], Lp.at[1] + 0.707, 2.26);
  ctx.addCollider({ x: foot.x, z: foot.z, r: 0.42 });
  sky.standIn({ name: 'kept lamp: crust collar', position: [foot.x, -0.05, foot.z], size: [0.3, 0.24, 0.3], shape: 'cylinder', color: '#d9d0c8' });      // STAND-IN: a collar of white crust 25 cm high, lobed
  sky.standIn({ name: 'kept lamp: iron mooring ring', position: [foot.x + 0.09, 0.55, foot.z], size: [0.03, 0.16, 0.16], color: C.iron });                // STAND-IN
  // From the reveal the lamp is 104 m off: the lantern itself is a third of a pixel. A far spark keeps it a small steady
  // amber point (in the air and in the mirror), and hands over to the lantern itself inside 55 m.
  const spark = kit.glows([{ x: flame.x, y: flame.y, z: flame.z, size: Lp.spark.size }], { color: C.amber, sizeAttenuation: false, intensity: 0, flicker: 0.2, pulse: 2.2 });
  spark.visible = !remodelled;
  // Its stroke. On an exact mirror the water draws no column under a light (a column is what waves make of one): the
  // reflection is a second lamp hanging head-down, and that is all. The page's one amber line, laid toward the rider, is
  // a tall thin light standing above the flame that exists only in the mirror: there it hangs below the second lamp and
  // points at whoever looks, the rings bend it, and it draws straight again.
  const S = Lp.stroke, strokeGeo = new THREE.PlaneGeometry(1, 1, 1, 8); strokeGeo.translate(0, 0.5, 0);
  const strokeMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(C.amber) }, uGain: { value: S.gain }, uFoot: { value: flame.clone() }, uSize: { value: new THREE.Vector2(S.width, S.height) }, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform vec3 uFoot; uniform vec2 uSize; varying vec2 vQ; varying float vDist;
      void main() { vQ = vec2(position.x * 2.0, position.y);
        vec2 to = normalize(cameraPosition.xz - uFoot.xz); vec3 right = vec3(to.y, 0.0, -to.x);
        vec3 p = uFoot + right * position.x * uSize.x * (1.0 - 0.6 * position.y) + vec3(0.0, position.y * uSize.y, 0.0);
        vec4 mv = viewMatrix * vec4(p, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform vec3 uColor; uniform float uGain; ${FOG_PARS} varying vec2 vQ; varying float vDist;
      void main() { float a = exp(-vQ.x * vQ.x * 3.5) * pow(1.0 - vQ.y, 1.6) * smoothstep(0.0, 0.03, vQ.y);
        gl_FragColor = vec4(uColor * a * uGain * (1.0 - fogAmount(vDist)) * (1.0 - uVeil), 1.0); }`,
  });
  const stroke = new THREE.Mesh(strokeGeo, strokeMat); stroke.frustumCulled = false; stroke.renderOrder = 3; stroke.name = 'kept lamp: stroke (mirror only)';
  ctx.only(stroke, 'mirror'); ctx.add(stroke);      // (kept with the remodelled lamp too: its own stroke is what WAVES draw out of its shine, and this water has none until the wind)

  // ---------------------------------------------------------------------------------------------- the warden's hut
  // (`hut.glb` stands in timber.js; its place is published here, so that it is known even on a day that module fails)
  shared.hut = { at: kit.at(P.hut.at[0], P.hut.at[1], 0), floor: P.hut.legs };

  // ---------------------------------------------------------------------------------------------- the white ridge
  // THE FALLBACK for `ridge.glb` (the real ridge is the Monument group's, in heroes.js, built before this module): the
  // layout's plain hipped solid with its skirt of crust, made only when shared.ridge has not been published.
  if (!shared.ridge) {
    const R = P.ridge, v = (s, d, y) => sky.at(s, d, y), b0 = v(R.s[0], R.d[1], 0), b1 = v(R.s[0], R.d[0], 0), b2 = v(R.s[1], R.d[0], 0), b3 = v(R.s[1], R.d[1], 0), c0 = v(R.crest[0][0], R.crest[0][1], R.height), c1 = v(R.crest[1][0], R.crest[1][1], R.height);
    const tris = [b0, c0, b1, b2, c1, b3, b1, c0, c1, b1, c1, b2, b3, c1, c0, b3, c0, b0];
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flatMap((p) => [p.x, p.y, p.z]), 3)); geo.computeVertexNormals();
    // (ghost: by night the ridge is absent in the fog, the page says. A fog-coloured solid is not absent: it hides the stars
    // and the Milky Way's foot from the first image on. It thins into the sky instead: see light.js. The model needs the same.)
    const mesh = new THREE.Mesh(geo, sky.paint({ color: C.chalk, brush: 0.9, air: 'far' })); mesh.name = 'standin:white ridge'; mesh.frustumCulled = false; ctx.add(mesh);
    const mid = v((R.s[0] + R.s[1]) / 2, (R.d[0] + R.d[1]) / 2, 0);
    sky.standIn({ name: 'white ridge: crust skirt', position: [mid.x, 0, mid.z], size: [R.d[1] - R.d[0] + 2 * R.skirt, 0.07, R.s[1] - R.s[0] + 2 * R.skirt], color: C.chalk, paint: { air: 'far' } });
    shared.ridge = { faceAt: (s, y) => [R.d[1] - (R.d[1] - R.crest[0][1]) * (y / R.height), y], height: R.height, crest: R.crest };
    // the foot of the ridge is land: the hull stops at its skirt
    for (let s = R.s[0] - 4; s <= P.end + 8; s += 7) { const p = kit.at(s, R.d[1] + R.skirt - 3.5); ctx.addCollider({ x: p.x, z: p.z, r: 4.2 }); }
  }

  // (the barrow run and its tipping stage, `barrow_run.glb`, stand in timber.js)

  const amber = new THREE.Color(C.amber);
  return {
    update(dt, c) {
      coilUpdate(dt);
      const boat = c.boat, dist = Math.hypot(boat.x - flame.x, boat.z - flame.z);
      // the far spark: full beyond 80 m, gone inside 55 m (the lantern itself has taken over), and out with the veil
      spark.material.uniforms.uIntensity.value = Lp.spark.light * lamp.lit * smooth(Lp.spark.near - 20, Lp.spark.near + 30, dist);
      strokeMat.uniforms.uGain.value = S.gain * lamp.lit * (1 - 0.7 * sky.wind) * lerp(1, 0.45, sky.e);      // once the wind is on the water the water draws its own (broken) stroke
      const far = shared.farLamp;
      far.light.intensity = remodelled ? 0 : 1.7 * far.lit;
    },
  };
}
