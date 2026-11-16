// The answering sea: the monument and the hero pieces.
//
// STAGE 2a, THE MONUMENT (docs/build/sea/2-monument.md): the lighthouse and the skerry it stands on are modelled
// (source-art/models/sea/lighthouse.py, skerry.py -> assets/models/sea/lighthouse.glb, lighthouse_top.glb, skerry.glb,
// skerry.json) and stand here in place of their stand-ins:
//   skerry (hero, 36 m)         columnar basalt, one field of near-regular prisms in two files: skerry.glb (the channel side and the two
//                               ends, half a metre across: a wave-cut stair of tops at the water, the ledge under the tower, the cliff
//                               of organ pipes behind, the slip and its skids, five landing steps cut into the columns, nine tide
//                               pools, a bollard) and skerry_crag.glb (the inland shores and the middle). The kit's far column units can
//                               be grown in its middle (plan.monument.columns; the kit's geometry, the skerry's paint): none are
//   lighthouse (hero, 34 m)     the monument: 45 courses of granite that diminish upward, the bole stepped and rock-faced,
//                               door and doorcase, six windows, rungs, lightning strap, gallery, lantern, cupola; moving
//                               parts `lens`, `vane`, `shutter` (turned in update). Its thin iron (railing, glazing bars,
//                               vane) is the top file's slot `iron`, kept out of the painter's filter (crisp)
//   the kept lamp               the engine's lamp, hung on the town's wrought bracket beside the open door
// At rest the tower is a dark, stained mass a step under its sky; behind the rain front the sea's light stands at its
// foot and on its seaward limbs, and the lens, when it fills, lights the lantern room (plan.monument has the numbers).
// The other hero pieces are another module's (heroes_b.js): what is left of them here are the layout's STAND-INS,
// which that module takes out as its models arrive, and the whale's two prototypes (the cast's):
//   gate_crown (hero, 70 m)     the cap and keystone mass over the gate's opening, with the vault under it
//   wreck (hero, 21 m)          14 pairs of frames on a reef awash
//   bellbuoy (hero, 5.8 m)      it rides the swell already
//   rowboat (hero, 4.2 m)       on the slip
//   whale (hero, 25 m)          two prototypes: passing beneath (cue 'whale', s 112) and, on the show clock, its back
//                               (t 16 to 24) and its flukes (t 24 to 30) where the page puts them
// What this module puts in `shared`:
//   shared.lamp      the kept lamp
//   shared.tower     { x, z, lens (Vector3, its centre), door { x, z, y, dir }, model, top, parts { lens, vane, shutter },
//                      point(name), beam(i), rail[8], drips[8], windows[6], lintel, rungs[2], shutterAt, strapFoot,
//                      vaneAt, lensLight (the lens's light: x = how full, 0..1), vaneBack (degrees: the staging backs the vane) }
//   shared.heroes    { skerry { cx, cz, model, point(name), columns, pools[9], spray[6], slip { low, high, pitch },
//                      steps[2], ring, creels, ropecoils[2], ledge[2], kelp }, bracket, spark, stroke, flame, wreck, surf }
import { makeKeptLamp } from '../../engine/lamp.js';
import { removeStandIn } from '../../engine/modules.js';
import { ellipseOutline } from './light.js';
import { smooth, lerp, clamp01 } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit, stage } = ctx, P = plan, C = P.colors, sea = shared.sea, path = ctx.path, engine = ctx.engine;
  const tmp = {}, outlines = [];
  const frameAt = (s) => { const a = path.at(s); return { x: a.x, z: a.z, tx: a.tx, tz: a.tz, rx: a.rx, rz: a.rz, heading: a.heading }; };
  const at2 = (f, d, v = 0) => [f.x + f.rx * d + f.tx * v, f.z + f.rz * d + f.tz * v];
  const heroes = shared.heroes = {};

  // What the monument's stone adds to the sea's rock material (shared.sea.extend), laid after it:
  //   - paint is carried into the sea's added light at half strength, as the kit's rock does it: a joint stays a dark
  //     line and a stone its own tone in every light;
  //   - SHELTER, the fourth channel of the model's paint (monument_common.set_alpha): 1 = out in the night; 0 = an
  //     inside (the doorway, the stair) that the sky and the sea do not reach and only the kept lamp lights;
  //   - the kept lamp is a small flame: on stone out in the night it makes a pool of warmth beside itself and gives a
  //     breath beyond (the engine's lamp lights everything within its reach alike, which turned the whole foot of the
  //     tower warm grey); inside the doorway it gives its full light.
  //   - behind the rain front the tower stays a dark mass against the lit water (the director's third point): the lit sea
  //     lies on it only as a glow at its foot that dies within a few metres (`glow`: its colour; `high`: what is left of
  //     it higher up, and the heights between which it falls), stronger on the side turned to the open sea, and as a
  //     sheen on wet stone seen aslant on that side (`sheen`), which is what stands the tower off the wall behind it
  //     in the key painting;
  //   - weather that the model's points cannot carry. On the tower (`axis` given): broad streaks that run down the stone,
  //     the same all the way down a streak, and fine runs two fingers wide, pale (salt) and dark (wet) by turns. On rock:
  //     the flutes' own streaks.
  //   - and a ceiling on the paint (`max`: the palest colour the model is painted in, near the door and above it). With
  //     multisampling a pixel that a small steeply shaded face only grazes (a chamfer 3 cm wide, 40 m off) reads its
  //     paint from outside the face, where the numbers run away: single pale pixels under the gallery and at the
  //     windows that came and went with the swell. Under the ceiling such a pixel is no paler than a salted stone.
  // uMon: x paint carried, y the lamp's light beyond its pool, z the pool's radius (m), w the lamp's gain inside
  // uMonW: x, y the tower's axis (x, z), z how strong the streaks, w how strong the fine runs
  const Mo = P.monument;
  // (&mondraft=1: the skerry's DRAFT files, written by `skerry.py -- draft` (skerry_next.glb, skerry_crag_next.glb, skerry_next.json), so that a half-made model
  // is never in anybody else's picture. The trial copy of this file, heroes.next.js with &monnext=1, was this file line for line and went at stage 5.)
  const SK = typeof location !== 'undefined' && new URLSearchParams(location.search).has('mondraft') ? 'skerry_next' : 'skerry';
  // (the kit's surface paintings and their numbers, plan.kit: the painted basalt of a column's side, and the tide zone's crust and weed)
  const K = P.kit || null;
  const SKN = Mo.skerry;
  const loadArt = (n) => (K && K.art && K.art[n] ? ctx.tex(`art/sea/${K.art[n].file}.webp`, { repeat: true }).catch(() => null) : Promise.resolve(null));
  const sideArt = K && K.art && K.art.face ? 'face' : 'side';      // (the side of ONE prism, no joints: `basalt` has six level joints to a repeat and coursed every column like masonry)
  const [artSide, artTide, artRough] = await Promise.all([loadArt(sideArt), loadArt('tide'), loadArt('rough')]);
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); white.needsUpdate = true;
  const inv = (n, t) => (t ? new THREE.Vector3(1 / K.art[n].mean[0], 1 / K.art[n].mean[1], 1 / K.art[n].mean[2]) : new THREE.Vector3(1, 1, 1));
  const doorU = { value: new THREE.Vector4(0, 0, 0, 1e3) };      // the doorcase, set when the tower has loaded: x, z of its face's middle, its reach (m), its sill's height
  const stoneExt = (ref, o, axis = null) => ({
    uniforms: {
      uMonRef: { value: new THREE.Color(ref) }, uMon: { value: new THREE.Vector4(o.show ?? 0.8, o.lamp ? o.lamp[0] : 0.2, o.lamp ? o.lamp[1] : 1.6, o.lamp ? o.lamp[2] : 1.4) },
      uMonW: { value: new THREE.Vector4(axis ? axis[0] : 0, axis ? axis[1] : 0, o.streak ?? 0.5, o.salt ?? 0.5) },
      uMonH: { value: new THREE.Vector3(o.high ? o.high[0] : 1, o.high ? o.high[1] : 4, o.high ? o.high[2] : 26) },
      uMonGlow: { value: new THREE.Color(o.glow || '#000000') }, uMonSheen: { value: new THREE.Vector2(o.sheen ? o.sheen[0] : 0, o.sheen ? o.sheen[1] : 0.3) },
      // (the form turned: what the side turned away from the open sea keeps of all the night's and the sea's light, and what the side turned to it takes)
      uMonTurn: { value: new THREE.Vector2(o.turn ? o.turn[0] : 1, o.turn ? o.turn[1] : 1) },
      // (the light UNDER every course: its colour, and x how strong, y the height by which it has died, z how much of it the surf's own light gives at rest, w what is left of the wall's own light high up when the sea is lit)
      uMonUnder: { value: new THREE.Color(o.under ? o.under[0] : '#000000') }, uMonUnderK: { value: new THREE.Vector4(o.under ? o.under[1] : 0, o.under ? o.under[2] : 20, o.under ? o.under[3] : 0, o.dim ?? 1) },
      uMonMax: { value: new THREE.Color(o.max ? o.max[0] : '#7c88aa') }, uMonMax2: { value: new THREE.Color(o.max ? o.max[1] : '#7c88aa') }, uMonCap: { value: new THREE.Color(o.cap || '#ffffff') },
      tMonTide: { value: artTide || white }, uMonTideInv: { value: inv('tide', artTide) }, uMonRock: { value: new THREE.Color(C.basalt) },
      // (the bole's quarried faces wear the kit's painting of rough rock, by its light and dark only: x how much, y metres to a repeat)
      tMonRough: { value: artRough || white }, uMonRoughInv: { value: inv('rough', artRough) }, uMonRough: { value: new THREE.Vector2(artRough && axis && o.rough ? o.rough[0] : 0, o.rough ? o.rough[1] : 2.4) }, uMonDoor: doorU,
      uMonTK: { value: new THREE.Vector4(K ? 1 / K.tile.tide : 0.8, o.crust ?? 2.2, K ? K.tide.gain : 1.15, artTide && axis ? (K.tide.amount ?? 0.9) : 0) },
    },
    fragmentPars: 'uniform vec3 uMonRef, uMonH, uMonGlow, uMonMax, uMonMax2, uMonCap, uMonTideInv, uMonRock; uniform vec4 uMon, uMonW, uMonTK; uniform vec2 uMonSheen, uMonRough, uMonTurn; uniform vec3 uMonRoughInv, uMonUnder; uniform vec4 uMonUnderK; float mUnderG = 0.0; uniform vec4 uMonDoor; uniform sampler2D tMonTide, tMonRough;',
    albedo: axis ? /* glsl */`{
      albedo = clamp(albedo, vec3(0.0), mix(uMonMax, uMonMax2, smoothstep(5.0, 6.5, vWPos.y)));
      float mShel = clamp(vColor.a, 0.0, 1.0);
      vec2 mDir = normalize(vWPos.xz - uMonW.xy + vec2(1e-4, 0.0));
      float mWall = 1.0 - smoothstep(0.35, 0.7, abs(N.y));
      float mS = (seaNoise(mDir * 7.0 + vWPos.y * 0.03) - 0.5) * 0.55 + (seaNoise(mDir * 23.0 + 5.0) - 0.5) * 0.35;
      albedo *= 1.0 + uMonW.z * mS * mWall;
      // fine runs down the stone, two fingers wide: pale where salt has dried and dark where the wet still runs; each wanders
      // in strength as it falls. (Beyond about 40 m they are finer than a pixel and would glitter: there they give way to their mean)
      float mAng = atan(-mDir.y, -mDir.x);                                             // (its seam lies on the inland side)
      if (vWPos.y < 5.3 && uMonRough.x > 0.0) {                                         // the bole's quarried faces: rough rock, in the painter's own strokes
        // (the kit's painting of rough rock has long slanting veins: on a stone a metre and a half long they were the figure of polished marble. A quarried
        // face is pitted and bruised a hand at a time: grains of light and dark, each stone its own, drawn out a little along its bed)
        float rG = seaNoise(vec2(mAng * 61.0, vWPos.y * 13.0)) * 0.5 + seaNoise(vec2(mAng * 23.0 + 9.0, vWPos.y * 5.5 + 3.0)) * 0.3 + seaNoise(vec2(mAng * 139.0, vWPos.y * 31.0)) * 0.2;
        float rL = 0.62 + 0.9 * rG * rG + 0.25 * dot(texture2D(tMonRough, vec2(mAng * 4.7, vWPos.y) / uMonRough.y).rgb * uMonRoughInv - 1.0, vec3(0.25, 0.45, 0.3));
        float rCase = (1.0 - smoothstep(uMonDoor.z - 0.1, uMonDoor.z + 0.1, distance(vWPos.xz, uMonDoor.xy))) * step(uMonDoor.w, vWPos.y);      // (the doorcase is dressed stone: smooth)
        albedo *= mix(1.0, clamp(rL, 0.3, 1.8), uMonRough.x * (1.0 - smoothstep(4.7, 5.3, vWPos.y)) * mWall * mShel * (1.0 - rCase));
      }
      float mRun = seaNoise(vec2(mAng * 58.0, vWPos.y * 0.21 + 3.0)), mRun2 = seaNoise(vec2(mAng * 131.0 + 7.0, vWPos.y * 0.33));
      float mFar = smoothstep(0.02, 0.05, max(length(dFdx(vWPos)), length(dFdy(vWPos))));
      float mPaleRun = mix(smoothstep(0.64, 0.82, mRun) * (0.45 + 0.55 * mRun2), 0.07, mFar);
      float mDarkRun = mix(smoothstep(0.6, 0.8, 1.0 - mRun) * (0.4 + 0.6 * mRun2), 0.1, mFar);
      albedo = mix(albedo, albedo * 1.5 + vec3(0.004, 0.006, 0.011), uMonW.w * mPaleRun * mWall * mShel * smoothstep(1.8, 3.2, vWPos.y));
      albedo *= 1.0 - 0.5 * uMonW.w * mDarkRun * mWall;
      // the sea's mark on its foot: the same crust and weed as on the rock it stands on (the kit's painting), to a ragged line at 2.2 m
      if (vWPos.y < 3.6) {
        vec3 tC = cross(dFdx(vWPos), dFdy(vWPos));
        vec3 tFn = dot(tC, tC) > 1e-24 ? normalize(tC) : N;
        vec2 tAl = normalize(vec2(-tFn.z, tFn.x) + vec2(1e-4, 0.0));
        vec3 tTd = texture2D(tMonTide, vec2(dot(vWPos.xz, tAl), vWPos.y) * uMonTK.x).rgb * uMonTideInv;
        float tTl = dot(tTd, vec3(0.25, 0.45, 0.3));
        float tBand = 1.0 - smoothstep(uMonTK.y - 0.7, uMonTK.y + 0.3, vWPos.y - (tTl - 1.0) * 0.7 - 0.5 * (seaNoise(mDir * 9.0) - 0.5));
        albedo = mix(albedo, mix(uMonRock, albedo, 0.35) * mix(vec3(tTl), tTd, 0.3) * uMonTK.z, tBand * uMonTK.w * mShel);
      }
    }` : /* glsl */`{
      albedo = clamp(albedo, vec3(0.0), uMonMax);
      float mWall = 1.0 - smoothstep(0.35, 0.7, abs(N.y));
      albedo *= 1.0 + uMonW.z * mWall * ((seaNoise(vWPos.xz * 2.3) - 0.5) * 0.6 + (seaNoise(vWPos.xz * 9.0 + 3.0) - 0.5) * 0.4);
    }`,
    light: /* glsl */`{
      // (the shelter channel is CLAMPED: with multisampling a pixel that only grazes a small face reads its paint from outside the face, and a
      // shelter of 5 made "one minus shelter" minus four and the night's light five times itself: the white pixel under the gallery)
      float mIn = clamp(1.0 - vColor.a, 0.0, 1.0);
      vec3 mLamp = pointLight(uLampPos, uLampColor, uLampRadius, N);
      float mD = distance(vWPos, uLampPos);
      float mPool = mix(uMon.y, 1.0, exp(-mD * mD / (uMon.z * uMon.z)));
      vec3 mNight = (c - albedo * lamps) * mix(vec3(1.0), sqrt(clamp(albedo / uMonRef, 0.03, 3.0)), uMon.x);
      // behind the rain front: the lit sea's glow on the stone, strongest at the foot and dying within a few metres, more on
      // the side turned to the open sea and on what faces down or outward (stains and joints stay in it); and the sheen of
      // the lit water on wet stone seen aslant on that side. The mass above stays dark against the lit sea
      float mLf = seaFront(vWPos.xz) * uSeaL.x * mix(1.0, seaLee(vWPos.xz), 0.45);
      float mSide = 0.5 + 0.5 * dot(normalize(N.xz + vec2(1e-5, 0.0)), uSeaKey.xy);
      float mFall = mix(1.0, uMonH.x, smoothstep(uMonH.y, uMonH.z, vWPos.y));
      float mPaint = mix(1.0, clamp(dot(albedo, vec3(0.3, 0.4, 0.3)) / dot(uMonRef, vec3(0.3, 0.4, 0.3)), 0.05, 1.6), uMon.x);      // (stains, joints and wet stay as dark in the glow as they are at rest)
      // (the tower's upright limbs as the eye sees them, whatever the eye's height: from under the tower the whole wall is seen aslant, and must stay dark)
      float mEdge = pow(1.0 - clamp(abs(dot(normalize(N.xz + vec2(1e-5, 0.0)), normalize(V.xz + vec2(1e-5, 0.0)))), 0.0, 1.0), 3.0) * (1.0 - smoothstep(0.35, 0.8, abs(N.y)));
      // (what looks down takes most: the undercut along every stone's lower edge, the ledges' and the set-off course's soffits; what looks up takes least)
      mNight += uMonGlow * (mLf * mPaint * (mFall * (0.75 - 1.1 * min(N.y, 0.0) - 0.4 * max(N.y, 0.0)) * (0.3 + 0.7 * mSide * mSide)
                + uMonSheen.x * mEdge * mSide * mix(1.0, uMonSheen.y, smoothstep(2.0, 26.0, vWPos.y))));
      // (and a ceiling on the night's light high up, where nothing is ever lit: with multisampling a pixel that only grazes a small face, between two
      // corbels or at a window's jamb, takes a normal from outside the face, and the sky's rim on a face seen edge-on runs away with it: one
      // near-white pixel under the gallery that came and went with the swell. Under the ceiling (twice the palest the stone is ever lit up there) it
      // is a pixel of pale stone. Below 8 m, where the sea's light and its sheen are, there is no ceiling)
      // THE FORM IS TURNED. A round tower lit alike all round is a paper cone with ruled courses: the key painting's has a side toward the open sea, where the
      // sky is palest and the lit water widest, and a side toward the wall, which stands in the wall's own dark. (Upright faces only: a ledge keeps what it has.)
      mNight *= mix(1.0, mix(uMonTurn.x, uMonTurn.y, smoothstep(0.0, 1.0, mSide)), 1.0 - smoothstep(0.5, 0.9, abs(N.y)));
      // THE MASS ABOVE STAYS DARK: behind the rain front the wall's own light thins with height (uMonUnderK.w: what is left of it at 20 m), and what is
      // left up there is the light UNDER EVERY COURSE. The sea lights from below: each stone's undercut, each ledge's and sill's soffit looks down at it and
      // takes it, the wall between them does not. A ladder of thin cold lines up the tower, one under every course, broken along its length (the water's
      // light is flecks, and it moves), brightest at the foot and gone by uMonUnderK.y metres: aqua low down, ember above. At rest the surf at the
      // tower's foot gives the lowest of them a breath of the same while a crest is on it (uMonUnderK.z).
      mNight *= mix(1.0, uMonUnderK.w, mLf * smoothstep(5.0, 20.0, vWPos.y));
      {
        float uDown = smoothstep(0.22, 0.5, -N.y);
        vec2 uDir = normalize(vWPos.xz - uMonW.xy + vec2(1e-4, 0.0));
        float uAng = atan(uDir.y, uDir.x);
        float uBreak = smoothstep(0.42, 0.68, seaNoise(vec2(uAng * 9.0 + uTime * 0.11, floor(vWPos.y * 2.1) * 7.31)) * 0.65 + seaNoise(vec2(uAng * 31.0 - uTime * 0.23, vWPos.y * 3.0)) * 0.35);
        float uFallL = 1.0 - smoothstep(1.5, uMonUnderK.y, vWPos.y), uFallR = 1.0 - smoothstep(1.0, 0.45 * uMonUnderK.y, vWPos.y);
        float uSurf = uMonUnderK.z * seaSurge(uMonW.xy).y * uSeaL.y;
        // (in dashes with dark between them, never a ring of light round the tower; a broad soffit, a ledge's or the set-off course's, takes less than a stone's thin undercut: lit alike it was a band of neon)
        // (and near the eye it is FLECKS of the sea's own paint, a third as bright: from three metres a lit soffit was a bar of neon; from the sound the flecks run together into the dash)
        vec3 uF = texture2D(tSeaFleck, vec2(uAng * 2.6, vWPos.y * 1.1)).rgb;
        float uNear = 1.0 - smoothstep(5.0, 20.0, distance(uCameraPos, vWPos));
        float uAmt = uDown * (0.06 + 0.94 * uBreak * uBreak) * mix(1.0, 0.4, smoothstep(0.7, 0.95, -N.y)) * (mLf * uFallL * uFallL * (0.35 + 0.65 * mSide) + uSurf * uFallR * uFallR) * uMonUnderK.x
          * mix(1.0, 0.25 + 0.5 * smoothstep(0.3, 0.5, uF.r) * uF.g, uNear);
        mNight += mix(uSeaEmber * 1.6, uMonUnder, uFallL * uFallL) * (uAmt * (1.0 - mIn));
        mUnderG = uAmt;
      }
      mNight = min(mNight, mix(vec3(8.0), uMonCap, smoothstep(8.0, 15.0, vWPos.y)));
      c = mNight * (1.0 - mIn) + albedo * ((lamps - mLamp) + mLamp * mix(mPool, uMon.w, mIn));
      glow *= 1.0 - mIn;
    }`,
    // (a lit underside is two fingers tall: the painter's filter would take it for a flaw in the wall and wipe it out, so those pixels alone are kept as drawn)
    final: 'if (mUnderG > 0.04) gl_FragColor.a = -15.0;',
  });

  // ---------------------------------------------------------------------------------------------- the skerry
  // 36 by 34 m of stepped columnar basalt, 0.8 to 4 m high, on which the lighthouse stands (docs/art/sea.md). Modelled
  // in Blender: source-art/models/sea/skerry.py -> assets/models/sea/skerry.glb. It is made about the TOWER'S axis and
  // placed there, front to the channel: the ledge under the door (0.8 m, awash on crests), the slip with its two skids,
  // the five rock-cut steps and the nine tide pools are the model's; it names its own places (skerry.point(name)).
  // Its far column units (the page's 240) are grown on it below, on the sites the script wrote to skerry.json.
  //
  // Its paint, laid over the sea's rock material: the KIT's surface paintings and numbers (plan.kit; kit.js `kitExt`
  // is the original of this and should take its place if the kit ever publishes it), so that the skerry is the same
  // rock as the stacks and the wall: each column takes its own part of the painted basalt and its own drums and
  // joints (the model's paint carries each column's own number in its fourth channel; 1 = not a column: the slip, the
  // steps, timber), and below about 1.35 m everything is crusted and hung with wrack to a ragged line. Paint is carried
  // into the sea's added light at half strength, and the kept lamp makes a pool on the ledge under it, as on the tower.
  const rockExt = (o) => ({
    uniforms: {
      tMonSide: { value: artSide || white }, uMonSideInv: { value: inv(sideArt, artSide) }, tMonTide: { value: artTide || white }, uMonTideInv: { value: inv('tide', artTide) },
      uMonRef: { value: new THREE.Color(C.basalt) }, uMon: { value: new THREE.Vector4(o.show ?? 0.8, o.lamp ? o.lamp[0] : 0.3, o.lamp ? o.lamp[1] : 2.2, o.carry ?? 1.6) },
      uMonK: { value: new THREE.Vector4(K ? 1 / K.tile.side : 0.3, K ? 1 / K.tile.tide : 0.8, K ? K.tide.top : 1.35, K ? K.tide.ragged : 0.45) },
      uMonP: { value: new THREE.Vector4(artSide ? K.paint.amount : 0, (K ? K.paint.drum : 0.8) * (o.drum ?? 1), (K ? K.paint.seam : 0.6) * (o.seam ?? 1), (K ? K.paint.drums : 0.2) * (o.drums ?? 1)) },      // (seam: the joints the PAINT draws; the colonnade's are modelled, so here they are a whisper)
      uMonT: { value: new THREE.Vector4(artTide ? K.tide.gain : 1, artTide ? K.tide.amount : 0, o.crustTop ?? 0.3, o.crustSide ?? 0.75) },
      // a top's share of the night's light (x), what a wet one keeps besides (y), and how many are wet (z: the share that are not); w: how pale the ceiling on its paint
      uMonTop: { value: new THREE.Vector4(o.topDark ?? 0.5, o.topWet ?? 0.5, o.topShare ?? 0.75, 0) },
    },
    fragmentPars: 'uniform sampler2D tMonSide, tMonTide; uniform vec3 uMonSideInv, uMonTideInv, uMonRef; uniform vec4 uMon, uMonK, uMonP, uMonT, uMonTop; float kUpG = 0.0, kSdG = 0.0;',
    albedo: /* glsl */`{
      albedo = clamp(albedo, vec3(0.0), vec3(0.05, 0.054, 0.105));                            // (a ceiling on the paint, as on the tower: see stoneExt; the palest the skerry is painted is a worn arris)
      float kSd = clamp(vColor.a, 0.0, 1.0), kCol = 1.0 - step(0.985, kSd);
      vec3 kC = cross(dFdx(vWPos), dFdy(vWPos));
      vec3 kFn = dot(kC, kC) > 1e-24 ? normalize(kC) : N;                                     // the face itself
      float kUp = smoothstep(0.62, 0.88, abs(kFn.y));
      kUpG = kUp; kSdG = kSd;
      vec2 kAl = normalize(vec2(-kFn.z, kFn.x) + vec2(1e-4, 0.0));                            // along the face, level
      float kU = dot(vWPos.xz, kAl);
      vec3 kPt = texture2D(tMonSide, mix((vec2(kU, vWPos.y) + kSd * vec2(13.7, 7.9)) * uMonK.x, (vWPos.xz * 1.9 + kSd * 5.3) * uMonK.x, kUp)).rgb * uMonSideInv;
      float kLum = dot(kPt, vec3(0.25, 0.45, 0.3));
      vec3 kRel = mix(vec3(1.0), mix(vec3(kLum), kPt, 0.35), uMonP.x * mix(1.0, 0.6, kUp));
      // drums: basalt is long prisms; a cross joint is a tight dark line with the chipped lip of the drum below it, at that column's own
      // heights, and half of them are missing (two or three drums in one length): never a course
      float kJy = vWPos.y / uMonP.y + kSd * 37.0, kJc = floor(kJy + 0.5);
      vec3 kJh = fract(sin(vec3(kJc * 91.7 + kSd * 411.3, kJc * 47.3 + kSd * 173.1, kJc * 23.9 + kSd * 311.9)) * 43758.5453);
      float kJd = (kJy - kJc - (kJh.x - 0.5) * 0.86) * uMonP.y;                               // metres above this joint
      float kHas = step(0.5, fract(kJh.x * 7.31));
      float kDrum = fract(sin((kJc + step(0.0, kJd)) * 57.3 + kSd * 191.7) * 43758.5453);
      float kSeam = (1.0 - smoothstep(0.008, 0.026, abs(kJd))) * kHas * (0.55 + 0.45 * smoothstep(0.7, 1.1, kLum));
      float kLip = (1.0 - smoothstep(0.0, 0.08, -kJd)) * step(kJd, 0.0) * kHas * smoothstep(0.8, 1.3, kLum);
      float kJoints = (1.0 - uMonP.z * kSeam) * (1.0 + 0.35 * uMonP.z * kLip) * (1.0 + uMonP.w * (kDrum - 0.5) * kHas);
      kRel *= mix(1.0, kJoints, (1.0 - kUp) * kCol);
      // the tide zone: crust and weed, to a ragged line. On a FACE; a top is scoured by every sea and keeps a third of it (crusted alike,
      // tops and faces were one camouflage and no column could be told from the next)
      vec3 kTd = texture2D(tMonTide, mix(vec2(kU, vWPos.y), vWPos.xz, kUp) * uMonK.y + kSd * vec2(3.1, 5.7)).rgb * uMonTideInv;
      float kTl = dot(kTd, vec3(0.25, 0.45, 0.3));
      float kBand = 1.0 - smoothstep(uMonK.z - 0.55, uMonK.z + 0.3, vWPos.y - (kTl - 1.0) * uMonK.w - (kSd - 0.5) * 0.3);
      kRel = mix(kRel, mix(vec3(kTl), kTd, 0.3) * uMonT.x, kBand * uMonT.y * mix(uMonT.w, uMonT.z, kUp) * mix(0.3, 1.0, kCol));      // (cut rock and timber, the slip and the steps, are kept half clean by keels and feet: little crust)
      albedo *= kRel;
    }`,
    light: /* glsl */`{
      vec3 mLamp = pointLight(uLampPos, uLampColor, uLampRadius, N);
      float mD = distance(vWPos, uLampPos);
      float mPool = mix(uMon.y, 1.0, exp(-mD * mD / (uMon.z * uMon.z)));
      // UNDER THE WATER the rock goes down into the dark (the kit's cure for its own rock: kit.js): from a hand under where the water stands
      // NOW, all light on it dies over a metre and a half. Lit like the dry rock, the sunk benches lay in the clear water as a pale pavement
      float kRise = vWPos.y - seaSwellN(vWPos.xz, 0.0) * (uSwell[0].w + uSwell[1].w + uSwell[2].w);
      float kAir = smoothstep(-0.95, -0.05, kRise);
      // A TOP is not a lid. Most tops keep half of the night's light (the sky's slate lay on every top alike, paler than the sky itself: a
      // pavement of frosted tiles); the wet ones, a quarter of them, keep it all: a sheen here and there, as on wet rock
      float kTop = mix(1.0, uMonTop.x + uMonTop.y * step(uMonTop.z, fract(kSdG * 17.31)), kUpG);
      c = (c - albedo * lamps) * (mix(vec3(1.0), sqrt(clamp(albedo / uMonRef, 0.03, uMon.w)), uMon.x) * (kTop * (0.08 + 0.92 * kAir))) + albedo * ((lamps - mLamp) + mLamp * mPool) * (0.3 + 0.7 * kAir);
      glow *= kAir * kAir;
    }`,
  });
  // The water its pools and its dished tops hold is the model's slot `pool`. At rest it is dark, smooth water inside a
  // rim of salt: a pool on a ledge mirrors the dark rock that stands behind it, never the sky. Every swell that reaches
  // it leaves it full of light (the kit lights its pools so: kit.js, poolExt), which it keeps some seconds after the sea
  // round it has gone dark, cooling through ember to violet: light lingers in the pools. Behind the rain front they
  // hold it steadily. (uPool: x how much lower than a crest a pool may lie and still be filled by its run-up, as a share
  // of its height; y the soft light under the marks; z gain)
  const poolExt = {
    uniforms: { uPool: { value: new THREE.Vector3(Mo.pools.reach, Mo.pools.body, Mo.pools.gain) } },
    fragmentPars: 'uniform vec3 uPool;',
    light: /* glsl */`{
      float pE = 0.0;
      for (int i = 0; i < 5; i++) pE = max(pE, smoothstep(0.1, 0.6, seaSwellN(vWPos.xz, float(i) * 1.4) - vWPos.y * uPool.x) * (1.0 - 0.19 * float(i)));
      pE = max(pE, 0.62 * seaFront(vWPos.xz) * uSeaL.x) * uSeaL.y;
      vec2 pF = texture2D(tSeaFleck, vWPos.xz * 1.9).rg;
      float pCut = 1.02 - pE * 0.85, pFl = smoothstep(pCut, pCut + 0.2, pF.r) * pF.g * (0.55 + 0.75 * pF.g);
      vec3 pCol = seaAge(pE * 0.96, uSeaCore, uSeaAqua, uSeaEmber, uSeaViolet * 0.4);
      glow += pCol * (uPool.z * (pFl * (0.5 + 0.7 * pE) + uPool.y * pE * pE));
    }`,
  };
  const skerry = await kit.model(`models/sea/${SK}.glb`, {
    at: [P.tower.at[0], P.tower.at[1], 0], face: 'channel', brush: 0.55, extend: [sea.extend(SKN), rockExt(SKN)],
    materials: { pool: { brush: 0, extend: [sea.extend({ rest: Mo.pools.rest, top: 1, run: 1.2, pale: Mo.pools.pale }), poolExt] } },
  });
  // (its second file: the COLONNADE, the pipes that stand behind the pavement and the stumps and fallen lengths at their foot. Same place, same
  // paint. It is put inside the first file's group, so that whoever looks for the skerry's rock with a ray (the kit lets its things down onto it) finds all of it)
  const crag = await kit.model(`models/sea/${SK === 'skerry' ? 'skerry_crag' : 'skerry_crag_next'}.glb`, {
    at: [P.tower.at[0], P.tower.at[1], 0], face: 'channel', brush: 0.55, extend: [sea.extend(SKN), rockExt(SKN)],
  }).catch((err) => { console.error(`INVALID_MODEL sea/skerry_crag: the skerry stands without its colonnade (${(err && err.message) || err})`); return null; });
  if (crag) { skerry.group.add(crag.group); crag.group.position.set(0, 0, 0); crag.group.quaternion.identity(); crag.group.scale.setScalar(1); crag.group.updateMatrix(); skerry.group.updateMatrixWorld(true); }
  const sites = await fetch(`assets/models/sea/${SK}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!sites) console.error('INVALID_MODEL assets/models/sea/skerry.json is missing: the skerry stands without its far columns (run source-art/models/sea/skerry.py)');
  {
    const S = P.skerry, pts = S.outline.map(([s, d]) => kit.at(s, d)), n = pts.length;
    let cx = 0, cz = 0; for (const p of pts) { cx += p.x / n; cz += p.z / n; }
    const f = frameAt(215);
    // its collider: a row of circles along the whole outline (the channel side first), and its surf
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n], len = a.distanceTo(b), m = Math.max(1, Math.round(len / 3.6)); for (let k = 0; k < m; k++) { const x = lerp(a.x, b.x, k / m), z = lerp(a.z, b.z, k / m), dl = Math.hypot(cx - x, cz - z) || 1; ctx.addCollider({ x: x + (cx - x) / dl * 1.5, z: z + (cz - z) / dl * 1.5, r: 2.3 }); } }
    for (const [x, z, r] of [[cx, cz, 13], [cx + f.tx * 9, cz + f.tz * 9, 10], [cx - f.tx * 9, cz - f.tz * 9, 10]]) ctx.addCollider({ x, z, r });
    outlines.push({ pts: pts.map((p) => [p.x, p.z]), width: 3.4, inset: 1.4 });
    // the reef awash that joins it to the wall (s 230 to 236): STAND-IN for a `reef`
    sea.standIn({ name: 'reef (skerry to wall)', at: [233, 15, -0.45], size: [10, 0.5, 8], color: C.basaltWet, turn: path.at(233).heading });
    for (const d of [10.5, 16, 21.5]) { const p = kit.at(234, d); ctx.addCollider({ x: p.x, z: p.z, r: 3.4 }); }
    heroes.skerry = { cx, cz, model: skerry, crag, point: skerry.point, columns: null };
  }
  // The far column units on the skerry. The unit is the kit's (kit.js builds after this module): on the first frame,
  // when everything is built, they are grown with the kit's own unit and paint (shared.rocks.groups.pipes) if it is
  // there, else with a plain six-sided column of this module's own.
  const growColumns = () => {
    if (!sites || !sites.columns || !(Mo.columns > 0)) return null;
    const src = shared.rocks && shared.rocks.groups && (shared.rocks.groups.pipes || shared.rocks.groups.wall);
    // (the unit's GEOMETRY is the kit's, a seven-cornered prism a metre tall and across; its PAINT is the skerry's own. In the kit's material, which shapes and
    // lights each unit for a stack seen from far off, they stood among the skerry's dark pipes as pale leaning slabs: sea_m6_j_slip2_crop.png. The skerry's
    // paint reads the paint's fourth channel, so the copy carries four-part white paint: 1 = not one of the model's numbered columns)
    let geo;
    if (src && src.geometry) geo = src.geometry.clone();
    else { geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6); geo.translate(0, 0.5, 0); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count * 4).fill(1), 4));
    const mat = kit.gouache({ color: '#ffffff', flat: true, vertexColors: true, brush: 0.55, extend: [sea.extend(SKN), rockExt(SKN)] });
    const tints = [C.basalt, C.basalt, '#1a1730', '#141126', C.lichen, '#1d1a33', C.basaltWet], rnd = ctx.rng(232), v = new THREE.Vector3();
    skerry.group.updateMatrixWorld(true);
    const list = sites.columns.slice(0, Mo.columns).map(([x, y, foot, w, h]) => {
      v.set(x, foot, -y).applyMatrix4(skerry.group.matrix);                        // (the model's x, y, z are the ride's x, z, -y)
      return { position: [v.x, v.y, v.z], scale: [w, h, w], rotation: [(rnd() - 0.5) * 0.03, rnd() * 6.28, (rnd() - 0.5) * 0.03], color: tints[Math.floor(rnd() * tints.length)] };
    });
    const mesh = kit.instances(geo, mat, list); mesh.name = 'columns:skerry' + (src ? '' : ' (own unit)'); mesh.computeBoundingSphere(); mesh.frustumCulled = true;
    return mesh;
  };

  // ---------------------------------------------------------------------------------------------- the lighthouse
  // THE MONUMENT (docs/art/sea.md): a rock tower of dovetailed granite, 34 m to the vane, its great lamp dead (nothing
  // warm above the door, ever). Modelled in Blender: source-art/models/sea/lighthouse.py -> assets/models/sea/lighthouse.glb.
  // The model stands on the tower's axis with its front to the channel, and names its own places (tower.point(name)):
  // where the bracket is nailed, where the lamp hangs, the door, the lens, the rail, the drips. Its moving parts turn
  // about the vertical: `lens` (once in 28 s), `vane`, `shutter`. docs/build/sea/2-monument.md lists it all.
  const T = P.tower, base = kit.at(T.at[0], T.at[1]);
  // the lens: glass and brass are told apart by their paint (the glass is blue). uLens: x how full of the sea's light it
  // is (it fills from its foot), y its glints at rest, z its foot, w its height. uLensRest: x how much of the sky's slate
  // its upward faces give back at rest, y how strongly a prism square to the eye burns when the lens is full.
  // A prism is a FLAT facet, sixteen to a ring: it lights whole as the lens brings it round to face the eye and goes
  // out as it passes, so the turning lens is a run of bars of light crossing its own face: that, at 46 m where a
  // prism is two pixels tall, is what says "a lens of many prisms that turns".
  const lensU = { value: new THREE.Vector4(0, 0, T.lens.y, T.lens.height) };
  const lensExt = {
    uniforms: { uLens: lensU, uLensGain: { value: Mo.lens.gain }, uLensCore: { value: new THREE.Color(C.core) }, uLensAqua: { value: new THREE.Color(C.aqua) }, uLensEmber: { value: new THREE.Color(C.ember) },
      uLensAt: { value: new THREE.Vector2(base.x, base.z) }, uLensEvery: { value: Mo.lens.every }, uLensSky: { value: new THREE.Color((P.rock && P.rock.sky) || '#34406A') },
      uLensRest: { value: new THREE.Vector2(Mo.lens.sky, Mo.lens.flash) } },
    fragmentPars: 'uniform vec4 uLens; uniform float uLensGain, uLensEvery; uniform vec3 uLensCore, uLensAqua, uLensEmber, uLensSky; uniform vec2 uLensAt, uLensRest;',
    light: /* glsl */`{
      float lGlass = smoothstep(0.02, 0.1, vColor.b - vColor.r);
      float lH = clamp((vWPos.y - uLens.z) / uLens.w, 0.0, 1.0);
      vec2 lNh = normalize(N.xz + 1e-5), lVh = normalize(V.xz + 1e-5);
      float lTurn = max(dot(lNh, lVh), 0.0);
      float lSq = pow(lTurn, 10.0);                                                // square to the eye in plan
      float lDown = 1.0 - smoothstep(-0.45, 0.15, N.y), lUp = smoothstep(0.1, 0.5, N.y);      // what looks down takes the sea's light, what looks up the sky's
      // at rest it is glass: every prism gives back a little of the night's slate, most where it is square to the eye, and by turns more and less
      // from ring to ring (a face that looks up, a face that looks down), so that the rings can be counted and the turning seen
      c = mix(c, c * 0.5 + uLensSky * (uLensRest.x * (0.18 + 0.82 * lSq) * (0.45 + 0.55 * lUp)), lGlass);
      // when it holds the sea's light: every prism is lit a little, those that look down more, and the ones square to the eye burn
      float lOn = (1.0 - smoothstep(uLens.x * 1.25 - 0.22, uLens.x * 1.25, lH)) * smoothstep(0.0, 0.08, uLens.x);
      vec3 lHeld = uLensEmber * 0.8 + uLensAqua * ((0.2 + 0.6 * lDown) * (0.3 + 0.7 * lTurn)) + mix(uLensAqua, uLensCore, 0.75) * (uLensRest.y * lSq * (0.45 + 1.1 * lDown));
      // at rest, now and then, a prism throws back the surf's light from below: a cold glint that crosses it as the lens
      // turns (one ring and its neighbours, chosen anew every few seconds, and not every time; the face that looks down,
      // while it is square to the eye; brighter while the surf at the tower's foot is alight)
      // (a band of five rings somewhere in the upper three quarters of the lens, which is what an eye in a boat sees over the gallery; for a second and a half
      // of every window; on whichever facet is nearest to square, so that it is seen to cross from one prism to the next as the lens turns. The first glint was
      // one facet-moment in ten and was never caught at its true rate in twenty-eight frames)
      float lWin = uTime / uLensEvery, lRnd = fract(sin(floor(lWin) * 78.233) * 43758.5453), lPick = 5.0 + floor(lRnd * 13.0);
      float lEnv = smoothstep(0.0, 0.04, fract(lWin)) * (1.0 - smoothstep(0.17, 0.23, fract(lWin)));
      float lGl = pow(lTurn, 26.0) * lDown * (1.0 - step(2.5, abs(floor(lH * 20.0) - lPick))) * lEnv * (0.45 + 0.55 * seaSurge(uLensAt).y);
      glow += lGlass * (lHeld * (lOn * uLensGain) + mix(uLensAqua, uLensCore, 0.5) * (lGl * uLens.y));
    }`,
  };
  // the lantern's panes: clear glass, known by the sky it returns when seen aslant and by the salt on it
  // (uPane: x how much of itself a pane shows square-on, y how much of the sky's slate lies on it. The sky is ADDED to
  // what is seen through the glass, as a reflection is: the lens behind keeps its own darks and lights, and a dead
  // lantern is known against the dark wall behind it by the night sky lying on its panes. Each flat pane returns
  // what its own mirror finds: the open sea's sky on those turned to the eye, the dark wall on those turned away,
  // so the drum is round and no two panes are alike; the crusted ones hold a little of it whichever way they face)
  const seaward = (() => { const a = kit.at(T.at[0], T.at[1] - 20); return new THREE.Vector2(a.x - base.x, a.z - base.z).normalize(); })();
  const paneExt = {
    uniforms: { uPane: { value: new THREE.Vector2(Mo.panes.hold, Mo.panes.sky) }, uPaneSky: { value: new THREE.Color((P.rock && P.rock.sky) || '#34406A') }, uPaneSea: { value: seaward },
      uPaneGlow: { value: new THREE.Color(Mo.panes.glow || '#2a7f9c') }, uPaneLens: lensU,
      uPaneAt: { value: new THREE.Vector3(base.x, base.z, T.lens.y + 0.46 * T.lens.height) }, uPaneHaze: { value: new THREE.Vector3(...(Mo.panes.haze || [0.1, 0.55, 0.5])) },
      // (a pane on the eye's side of the lantern is CLEAR where it is looked through squarely: the sky lies on it only toward the lantern's limb (x: what is left of
      // it square-on); a pane on the far side, seen from within, is a dim slate of salt and night (y), and the lens stands dark against it: a beehive in a glass room)
      uPaneSide: { value: new THREE.Vector2(Mo.panes.near ?? 1, Mo.panes.far ?? 1) } },
    fragmentPars: 'uniform vec2 uPane, uPaneSea, uPaneSide; uniform vec3 uPaneSky, uPaneGlow, uPaneAt, uPaneHaze; uniform vec4 uPaneLens;',
    albedo: /* glsl */`vec3 pV = normalize(uCameraPos - vWPos);
      float pF = pow(1.0 - clamp(abs(dot(N, pV)), 0.0, 1.0), 2.0);
      float pSalt = smoothstep(0.05, 0.11, vColor.b);
      vec3 pR = reflect(-pV, N * sign(dot(N, pV) + 1e-5));
      float pSea = clamp(0.5 + 0.5 * dot(normalize(pR.xz + 1e-5), uPaneSea), 0.0, 1.0) * smoothstep(-0.25, 0.15, pR.y);
      alpha = min(uPane.x + 0.5 * pF + 0.22 * pSalt, 0.92);`,
    // (and when the lens holds the sea's light, the lantern room glimmers with it. Not evenly: a pane the eye looks through AT the lens is full of its
    // haze, one at the lantern's limb or under its roof holds a breath of it, and salt holds it wherever it is (uPaneHaze: everywhere, toward the lens,
    // on salt): so the room has a bright heart and the lattice stands dark against it. pMiss: how near the tower's axis the eye's ray passes, in plan;
    // pY: the height at which it does)
    light: /* glsl */`{
      vec2 pDh = normalize(-pV.xz + 1e-5), pAx = uPaneAt.xy - vWPos.xz;
      float pT = dot(pAx, pDh), pMiss = length(pAx - pDh * pT), pY = vWPos.y - pV.y / max(length(pV.xz), 1e-3) * pT;
      float pCore = (1.0 - smoothstep(0.5, 2.0, pMiss)) * (1.0 - smoothstep(0.8, 2.3, abs(pY - uPaneAt.z)));
      float pSky = gl_FrontFacing ? (0.5 + 0.5 * pF) * mix(0.12, 1.0, pSea * pSea) * mix(uPaneSide.x, 1.0, smoothstep(0.25, 0.8, pF)) : uPaneSide.y * (0.55 + 0.45 * pF);
      c = mix(c, uFogColor * 1.3, 0.3 + 0.5 * pF) + (uPaneSky * (uPane.y * (pSky + 0.3 * pSalt)) + uPaneGlow * (uPaneLens.x * (uPaneHaze.x + uPaneHaze.y * pCore + uPaneHaze.z * pSalt))) / alpha;
    }`,
  };
  // two files, parted at the gallery: the shaft with its door and windows (and the `shutter`), and the top: gallery,
  // lantern and cupola (with the `lens` and the `vane`; the panes are its slot `glass`)
  const stand = { at: [T.at[0], T.at[1], 0], face: 'channel', brush: 0.5 };
  const tower = await kit.model('models/sea/lighthouse.glb', { ...stand, extend: [sea.extend(Mo.tower), stoneExt(C.granite, Mo.tower, [base.x, base.z])] });
  // (the top is iron and copper: it takes less of the sky and of the sea than stone does, and stands dark against both)
  const crown = await kit.model('models/sea/lighthouse_top.glb', { ...stand, extend: [sea.extend(Mo.top), stoneExt(C.granite, Mo.top, [base.x, base.z])],
    materials: { glass: { transparent: true, brush: 0, shade: 0, extend: paneExt },
      // (the lens is glass in the sea's own night: it takes the sea's rock light for its body, so that it knows when the surf at the tower's foot is alight)
      lens: { brush: 0.15, extend: [sea.extend(Mo.lensBody), lensExt] },
      // (everything thin up there, the slot \`iron\`: railing, glazing bars, grab rail, spindle, arms and vane. The painter's filter
      // wipes out what is thinner than its brush, so these are kept out of it and drawn at their true thickness. It is dark iron: a lattice
      // and a vane are silhouettes against the glass and the cloud)
      iron: { crisp: true, brush: 0, extend: [sea.extend(Mo.iron), stoneExt(C.granite, { ...Mo.top, ...Mo.iron }, [base.x, base.z])] } } });
  if (crown.materials.glass) crown.materials.glass.depthWrite = false;
  const towerPoint = (name, target) => (tower.points[name] ? tower : crown).point(name, target);      // a named place of either file
  {
    // ---- the kept lamp: the same storm lantern as everywhere, hung on the wrought bracket beside the open door. Its
    // flame is where the plan puts it (s 212.8, d +7.2, 3.3 m above still water; the composed line passes 7.2 m from it);
    // the model was made to that place, and says so if the two have drifted apart.
    const L = P.lamp, flame = kit.at(L.at[0], L.at[1], L.y);
    const hang = tower.point('lamp_hang'), nail = tower.point('bracket');
    const off = Math.hypot(hang.x - flame.x, hang.y - (flame.y + 0.2), hang.z - flame.z);
    if (off > 0.03) console.error(`INVALID_MODEL sea/lighthouse: its point lamp_hang is ${off.toFixed(3)} m from where plan.lamp hangs the lantern (rebuild source-art/models/sea/lighthouse.py to the plan's numbers)`);
    const lamp = shared.lamp = makeKeptLamp(engine, ctx, { hang: [flame.x, flame.y + 0.2, flame.z], note: L.note, near: L.near, reach: L.reach, moths: L.moths });
    // the wrought bracket is the town's piece (the boat family made the lamp's holdings: assets/models/life/lamp_bracket.glb);
    // its arm leaves the stone at `bracket` and reaches out toward the lamp
    const out = Math.atan2(hang.x - nail.x, hang.z - nail.z);
    // (wrought iron a finger thick: kept out of the painter's filter, or it is wiped away. And it is IRON beside its own flame: the engine's lamp lights
    // everything near it alike, which drew the bracket as a pale stick through the lantern; here its lamp's light thins with the square of the
    // distance, as the engine does it for the lamp's own holdings (lamp-hero.js, HOLDER_LIGHT): dark iron with a glint where it nears the flame)
    const ironExt = { light: '{ vec3 hTo = uLampPos - vWPos; float hD2 = dot(hTo, hTo); vec3 hL = pointLight(uLampPos, uLampColor, uLampRadius, N); c += albedo * hL * (0.9 / (1.0 + 1.4 * hD2) - 1.0) + hL * 0.02 / (1.0 + 0.6 * hD2); }' };
    heroes.bracket = await kit.model('models/life/lamp_bracket.glb', { position: [nail.x, nail.y, nail.z], rotation: [0, out, 0], brush: 0.4, crisp: true, extend: [sea.extend({ rest: 0.7, top: 1, pale: 0.35 }), ironExt] }).catch(() => null);
    if (!heroes.bracket) {                                   // (the file is not there: a plain bar holds the lamp, as in the layout)
      const arm = new THREE.Vector3(hang.x - nail.x, 0, hang.z - nail.z), bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, arm.length() + 0.05), sea.rock({ color: C.iron, rest: 0.6 }));
      bar.position.set((hang.x + nail.x) / 2, hang.y + 0.1, (hang.z + nail.z) / 2); bar.lookAt(nail.x, hang.y + 0.1, nail.z); bar.name = 'standin:wrought bracket (the town\'s)'; ctx.add(bar);
    }
    const door = tower.point('door'), inside = tower.point('door_in'), dn = Math.hypot(door.x - inside.x, door.z - inside.z) || 1;
    doorU.value.set(door.x, door.z, 1.12, door.y - 0.22);
    shared.tower = {
      x: base.x, z: base.z, lens: crown.point('lens_centre'), door: { x: door.x, z: door.z, y: door.y, dir: [(door.x - inside.x) / dn, (door.z - inside.z) / dn] },
      model: tower, top: crown, parts: { shutter: tower.parts.shutter, lens: crown.parts.lens, vane: crown.parts.vane }, point: towerPoint, lensLight: lensU,
      vaneBack: 0,                                           // degrees the staging backs the vane by (moment 8: 40)
    };
    // The lamp is what the rider steers by from the reveal, 183 m off, through the gate; at that distance the lantern
    // itself is a third of a pixel and the night's air swallows nine tenths of it. A far spark keeps it a small steady
    // amber point (and gives the water something to draw its stroke from); it hands over to the lantern itself near to.
    const spark = kit.glows([{ x: flame.x, y: flame.y, z: flame.z, size: 9 }], { color: C.amber, sizeAttenuation: false, intensity: 0, flicker: 0.22, pulse: 2.2 });
    heroes.spark = spark; heroes.flame = flame;
    // Its stroke on the water. The water draws a long column under anything in its mirror that shines, but the mirror
    // here runs at half scale and the lantern is a pixel and a half of it: too little to grow one from. So the lamp's
    // halo is given to the mirror alone, large enough to count (it is never seen directly).
    const stroke = kit.glow({ position: [flame.x, flame.y, flame.z], color: C.amber, size: 1.7, intensity: 1 }); ctx.only(stroke, 'mirror');
    heroes.stroke = stroke; heroes.amber = new THREE.Color(C.amber);
    sea.uniforms.uSeaLee.value.set(flame.x, flame.z, P.lamp.lee[0], P.lamp.lee[1]);      // the lee: the sea's light is held down round the lamp
  }

  // ---- what the people who bring the monument to life are given (docs/build/sea/2-monument.md lists it): the models'
  // named places as Vector3 in the realm's own space. The lens's two bullseyes ride on the lens: ask for them each frame.
  {
    const many = (get, stem, n) => Array.from({ length: n }, (_, i) => get(`${stem}_${i}`));
    Object.assign(shared.tower, {
      rail: many(towerPoint, 'rail', 8), drips: many(towerPoint, 'drip', 8), windows: many(towerPoint, 'window', 6), lintel: towerPoint('lintel'),
      rungs: [towerPoint('rung_foot'), towerPoint('rung_top')], shutterAt: towerPoint('shutter_knock'), strapFoot: towerPoint('strap_foot'), vaneAt: towerPoint('vane_pivot'),
      beam: (i, target) => crown.point(i ? 'beam_b' : 'beam_a', target),      // where bullseye i is now: the beam leaves the lens's centre (shared.tower.lens) through it
    });
    Object.assign(heroes.skerry, {
      pools: many(skerry.point, 'pool', 9), spray: many(skerry.point, 'spray', 6), slip: { low: skerry.point('slip_low'), high: skerry.point('slip_high'), pitch: P.skerry.slip.pitch },
      steps: [skerry.point('steps_foot'), skerry.point('steps_top')], ring: skerry.point('ring'), creels: skerry.point('creels'),
      ropecoils: [skerry.point('ropecoil_a'), skerry.point('ropecoil_b')], ledge: [skerry.point('ledge_a'), skerry.point('ledge_b')], kelp: skerry.point('kelp'),
    });
  }

  // ---------------------------------------------------------------------------------------------- the rowing boat
  // STAND-IN for `rowboat` (4.2 m, clinker, the palest solid in the realm): on the slip at s 223, bow inland, on two skids at 12 degrees
  {
    const R = P.rowboat, p = kit.at(R.at[0], R.at[1], 1.15), f = frameAt(R.at[0]);
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, R.length), sea.rock({ color: C.boatPaint, rest: 0.55, top: 1, pale: 1.7 }));
    m.position.copy(p); m.rotation.order = 'YXZ'; m.rotation.y = Math.atan2(f.rx, f.rz); m.rotation.x = -P.skerry.slip.pitch * Math.PI / 180;
    m.name = 'standin:rowboat'; ctx.add(m);
    const skids = sea.standIn({ name: 'slip (two skids)', at: [R.at[0], R.at[1] - 0.6, 0.72], size: [1.3, 0.12, 5.4], color: C.timber, turn: Math.atan2(f.rx, f.rz) });
    skids.rotation.order = 'YXZ'; skids.rotation.x = -P.skerry.slip.pitch * Math.PI / 180;
  }

  // ---------------------------------------------------------------------------------------------- the gate's crown
  // STAND-IN for `gate_crown` (the cap and keystone mass over the opening, 70 m) and for the vault under it: a slab with
  // the pointed arch cut through, standing 1.5 m proud of the colonnade either side. The kit's columns stand under it.
  {
    const G = P.gate, f = frameAt(G.s), sh = new THREE.Shape(), H = G.crown.half, pts = [[-H, G.crown.from]];
    for (let d = -H; d <= H + 1e-6; d += 2.5) pts.push([d, G.crestAt(d) + (kit.noise(d * 0.21, 3.3, 8) - 0.5) * 2.2]);
    pts.push([H, G.crown.from], [G.open + 1, G.crown.from], [G.open + 1, 9]);
    for (let d = 10.3; d >= -10.3 - 1e-6; d -= 1.03) pts.push([d, G.arch(d)]);
    pts.push([-(G.open + 1), 9], [-(G.open + 1), G.crown.from]);
    pts.forEach(([d, y], i) => (i ? sh.lineTo(d, y) : sh.moveTo(d, y)));
    const depth = G.thickAt(0) + 2 * G.crown.over, geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); geo.translate(0, 0, -depth / 2);
    const m = new THREE.Mesh(geo, sea.rock({ color: C.basalt, uniform: sea.gateInner })); m.name = 'standin:gate_crown and the vault';
    m.position.set(f.x, 0, f.z); m.rotation.y = Math.atan2(-f.rz, f.rx); ctx.add(m);
  }

  // ---------------------------------------------------------------------------------------------- the wreck
  // STAND-IN for `wreck`: the frames of a wooden vessel 21 m long on a reef awash; 14 pairs of frames standing up to 4.2 m.
  {
    const Wk = P.wreck, a = kit.at(Wk.stern[0], Wk.stern[1]), b = kit.at(Wk.stem[0], Wk.stem[1]), len = a.distanceTo(b), kx = (b.x - a.x) / len, kz = (b.z - a.z) / len, yaw = Math.atan2(kx, kz);
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const ribs = [{ position: [(a.x + b.x) / 2, 0.05, (a.z + b.z) / 2], scale: [0.4, 0.45, len], rotation: [0, yaw, 0] }];      // keel and keelson
    for (let i = 0; i < Wk.frames; i++) {
      const t = (i + 0.5) / Wk.frames, beam = 2.6 * Math.sin(Math.PI * (0.12 + 0.8 * t)), h = Wk.high * (0.45 + 0.55 * Math.sin(Math.PI * (0.1 + 0.8 * t))) * (0.8 + 0.2 * kit.noise(i * 1.7, 2.2, 4));
      for (const side of [-1, 1]) ribs.push({ position: [a.x + kx * len * t + kz * side * beam * 0.55, 0.1, a.z + kz * len * t - kx * side * beam * 0.55], scale: [0.26, h, 0.24], rotation: [0, yaw, -side * 0.3] });
    }
    ribs.push({ position: [b.x, 0, b.z], scale: [0.3, 3.4, 0.4], rotation: [0.35, yaw, 0] }, { position: [a.x, 0, a.z], scale: [0.3, 3.0, 0.4], rotation: [-0.2, yaw, 0] });      // the broken stem, the sternpost
    const m = kit.instances(g, sea.rock({ color: C.timber, rest: 0.5, pale: 1.15 }), ribs); m.name = 'standin:wreck (frames, keel, stem, sternpost)';
    // its reef: STAND-IN for four `reef` plates, 26 by 16 m, awash; it stops the boat 4 m from the nearest frame
    const mid = kit.at(169, -42), f = frameAt(169);
    sea.standIn({ name: 'reef x4 (wreck reef)', at: [169, -42, -0.42], size: [16, 0.5, 26], color: C.basaltWet, turn: path.at(169).heading });
    for (const s of [160, 169, 178]) for (const d of [-37.5, -46.5]) { const p = kit.at(s, d); ctx.addCollider({ x: p.x, z: p.z, r: 6.4 }); }
    outlines.push({ pts: ellipseOutline(mid.x, mid.z, f.tx, f.tz, 13.5, 8.5, 28), width: 2.5, inset: 7 });      // every swell sheets over it in a carpet of light
    heroes.wreck = { a, b };
  }

  // ---------------------------------------------------------------------------------------------- the bell buoy
  // STAND-IN for `bellbuoy`: an iron float 2.4 m across with a four-legged cage and a bell, 5.8 m from keel to top-mark.
  // It rides the swell (the water's heightAt), as everything that floats here must.
  let buoy = null;
  {
    const B = P.buoy, p = kit.at(B.at[0], B.at[1]);
    const prof = [[0.01, -1.7], [0.5, -1.6], [1.2, -0.5], [1.2, 0.55], [0.85, 0.7], [0.55, 2.6], [0.28, 2.75], [0.28, 3.4], [0.06, 3.5], [0.06, B.above]].map(([r, y]) => new THREE.Vector2(r, y));
    buoy = new THREE.Mesh(new THREE.LatheGeometry(prof, 12), sea.rock({ color: C.iron, rest: 0.6, pale: 1.2 }));
    buoy.position.copy(p); buoy.name = 'standin:bellbuoy'; ctx.add(buoy);
    ctx.addCollider({ x: p.x, z: p.z, r: 1.6 });
    outlines.push({ pts: ellipseOutline(p.x, p.z, 1, 0, 1.25, 1.25, 12), width: 1.6, inset: 0.2 });
  }

  // ---------------------------------------------------------------------------------------------- the whale (prototypes)
  // PROTOTYPE, not the whale: to find out at the real eye what of it can be seen (docs/build/sea/1-layout.md).
  // (a) beneath, moment 7: 25 m of it crossing under the line from (132, +46) to (144, -40) at 2.5 m/s, rising from
  //     11 m to 7 m. A dark body gives nothing; what is seen is its light, so the stand-in is a green-gold spindle.
  // (b) the showstopper: its back sliding through one place (t 16 to 24) and its flukes, 6.2 m across and 4.5 m
  //     clear of the sea, at (198, -26) from t 24 to 30.
  const Wh = P.whale, wA = kit.at(Wh.beneath.from[0], Wh.beneath.from[1]), wB = kit.at(Wh.beneath.to[0], Wh.beneath.to[1]), wLen = wA.distanceTo(wB);
  const gold = kit.gouache({ color: '#101408', brush: 0.6, shade: 0.2, emissive: C.greenGold, emissiveIntensity: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 10), gold); body.scale.set(Wh.girth, Wh.girth * 0.8, Wh.length); body.name = 'standin:whale (beneath)'; body.visible = false;
  body.rotation.y = Math.atan2(wB.x - wA.x, wB.z - wA.z); ctx.add(body); ctx.only(body, 'direct');
  stage.cue('whale', { s: Wh.beneath.startS, settle() {} }, () => {});
  const dark = sea.rock({ color: C.basalt, rest: 0.45, pale: 1.2 });
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8), dark); back.scale.set(3.4, 2.2, 14); back.name = 'standin:whale (the back, t 16 to 24)'; back.visible = false; ctx.add(back);
  const fl = kit.at(Wh.flukes[0], Wh.flukes[1]), su = kit.at(Wh.surface[0], Wh.surface[1]);
  back.rotation.y = Math.atan2(fl.x - su.x, fl.z - su.z);
  const flukes = new THREE.Group(); flukes.position.copy(fl); flukes.rotation.y = back.rotation.y; flukes.visible = false; ctx.add(flukes);
  { // two broad blades and a stock: seen from directly behind, a butterfly shape
    const blade = new THREE.BoxGeometry(Wh.flukeSpan / 2, 0.22, 1.5); blade.translate(Wh.flukeSpan / 4, 0, 0);
    for (const side of [-1, 1]) { const m = new THREE.Mesh(blade, dark); m.scale.x = side; m.rotation.z = side * 0.32; m.position.y = Wh.flukeHigh - 1.0; flukes.add(m); }
    const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.9, Wh.flukeHigh + 1.5, 10), dark); stock.position.y = (Wh.flukeHigh - 1.5) / 2 - 0.4; flukes.add(stock);
    flukes.name = 'standin:whale (flukes, t 24 to 30)';
  }

  // (the layout's stand-in for the slip's two skids was made with the rowing boat's, above: the skids are the skerry's
  // own now, modelled with it, so that stand-in is taken out here; the rowing boat's lines are the other heroes' module's)
  removeStandIn(ctx, 'slip (two skids)');

  // ---------------------------------------------------------------------------------------------- surf round the heroes' feet
  heroes.surf = sea.surf(outlines);

  const slope = { x: 0, z: 0 };
  return {
    update(dt, c) {
      const s = c.s, boat = c.boat, T2 = sea.T;
      if (heroes.skerry.columns === null) heroes.skerry.columns = growColumns() || false;      // (once, on the first frame: see growColumns)
      // the buoy rides the swell and leans with it
      if (buoy) { const p = buoy.position; p.y = c.water.heightAt(p.x, p.z); if (c.water.slopeAt) c.water.slopeAt(p.x, p.z, slope); buoy.rotation.set(slope.z * 1.6, 0, -slope.x * 1.6); }
      // the lamp's far spark: it makes up for what the air swallows, as far as eight times, and is gone inside 25 m
      const fp = heroes.flame, dist = Math.hypot(boat.x - fp.x, boat.z - fp.z), dens = engine.shared.uFogDensity.value, air = Math.exp(-dens * dens * dist * dist);
      heroes.spark.material.uniforms.uIntensity.value = 3.4 * Math.min(8, 1 / Math.max(air, 1e-3)) * smooth(22, 55, dist) * (1 - c.veil);
      heroes.stroke.material.color.copy(heroes.amber).multiplyScalar(5 * (1 + 1.2 * sea.L) * Math.min(6, 1 / Math.max(air, 1e-3)) * (1 - c.veil));
      // the lens: from t 16 its lowest prisms hold a cold glimmer; from t 30 to 36 it fills (and then holds, with the sea's light).
      // At rest it only glints, one prism at a time, when the water answers at all
      const fill = T2 < 0 ? 0 : (0.16 * smooth(16, 26, T2) + 0.84 * smooth(30, 36, T2)) * Math.max(0.25, P.lightBy(s));
      lensU.value.x = fill; lensU.value.y = Mo.lens.glint * sea.uniforms.uSeaL.value.y * (1 - c.veil);
      // the lighthouse's moving parts, by phase (never dead; the staging comes later): the lens turns once in 28 s (it
      // stands still for a rider who asked for less motion), the vane shivers and veers about the weather's quarter,
      // the fourth window's shutter swings 25 degrees in 5 s
      {
        const pr = shared.tower.parts, t = c.time, calm = c.reducedMotion ? 0.35 : 1, rad = Math.PI / 180;
        if (pr.lens) pr.lens.rotation.y = c.reducedMotion ? 0.6 : -(t / Mo.lens.turn) * Math.PI * 2;
        if (pr.vane) pr.vane.rotation.y = (Mo.vane.from + shared.tower.vaneBack + calm * (Mo.vane.veer * Math.sin(t * 0.13 + 1.0) + Mo.vane.shiver * (0.6 * Math.sin(t * 2.3) + 0.4 * Math.sin(t * 3.7 + 2.0)))) * rad;
        if (pr.shutter) { const ph = (t / Mo.shutter.period) % 1, k = ph < 0.62 ? smooth(0, 0.62, ph) : 1 - smooth(0.62, 1, ph); pr.shutter.rotation.y = (k - 0.5) * Mo.shutter.swing * rad * calm; }
      }
      // the whale beneath (moment 7): starts at the cue, never more than 12 s after s 112
      const tw = stage.since('whale');
      if (tw >= 0 && tw < 60) {
        const run = tw * Wh.beneath.speed - Wh.length * 0.5, k = run / wLen, d = lerp(Wh.beneath.from[1], Wh.beneath.to[1], k);
        const depth = lerp(Wh.beneath.depth[0], Wh.beneath.depth[1], smooth(0.1, 0.55, k)) + 23 * smooth(-20, -40, d);       // beyond d -20 it sinks to 30 m and its light goes out
        body.position.set(lerp(wA.x, wB.x, k), -depth - Wh.girth * 0.4, lerp(wA.z, wB.z, k));
        body.visible = k < 1.25;
      } else body.visible = false;
      // the showstopper's whale: back (t 16 to 24), flukes (t 24 to 30)
      const showing = T2 >= 16 && T2 < 31;
      back.visible = showing && T2 < 24.5; flukes.visible = showing && T2 >= 23.5;
      if (back.visible) { const k = clamp01((T2 - 16) / 8), up = Math.sin(Math.PI * smooth(0, 1, k)); back.position.set(lerp(su.x, fl.x, 0.25 + 0.5 * k), -1.5 + 1.4 * up, lerp(su.z, fl.z, 0.25 + 0.5 * k)); }
      if (flukes.visible) { const up = smooth(23.5, 27, T2) * (1 - smooth(27.6, 30, T2)); flukes.position.y = -(Wh.flukeHigh + 1) * (1 - up); }
    },
  };
}
