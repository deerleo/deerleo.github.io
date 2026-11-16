// The answering sea: kit pieces, multitudes and the close band (stage 2b; docs/build/sea/2-kit.md says what is made,
// what is still a stand-in, and what the cast must know). docs/art/sea.md sections 3 and 9 say what each piece is.
//
//   the kit's rock   the sea's own rock material (shared.sea.extend) with the kit's paint over it: the painted basalt on
//                    every face, drums and joints, the tide zone's crust and weed (kitExt, below)
//   columns          the far column unit (49 triangles; its shape is made per copy in the vertex shader), instanced in
//                    draw groups that can be culled: pipes (eleven stacks), gate, gateInner, wall + Prow + cave, far pipes
//   column_near      a to e (Blender): wherever a column stands within 14 m of the channel on its side of a rock
//   steps            a to c (Blender): column tops stepping into the water at the feet of things, each dish holding a pool
//   and              caps, drums, reefs, hanging ends, cave vault panels, floats, dans, creels, rope coils, the ring;
//                    barnacle clumps. Kelp and the jellies are the cast's: their stand-ins are left as layout made them.
// Colliders for all of it are added here (the edges are soft: everything solid needs one), and the surf light round
// every foot (shared.sea.surf). What this module puts in `shared`: shared.rocks = { stacks, gate, wall, feet, pools,
// kelpBeds, groups, near, colliders, surf, info } for the cast (kelp, spray, petrels, run-up) and for staging; of the
// reefs (docs/build/sea/6-reefs.md): reefs, reefPools, reefKnobs, reefGround.
//
// Switches for looking: &nonear=1 the far unit everywhere (no Blender columns); &nosteps=1; &counts=1 writes what was
// grown to .shots/sea_counts.json; &kitmap=1 draws every collider of the area as a ring a metre over the water and
// writes them, with the reefs' rock by the square metre, to .shots/sea_kitmap.json (.shots/sea_reefs_plan.py draws it
// as plans); &knobrings=0 leaves out the reef knobs' own rings of surf; &reefkeep=1 keeps the sound's reefs drawn
// to the end of the area in place of the wreck's two slabs from afar.
import { ellipseOutline } from './light.js';
import { smooth, lerp } from './plan.js';
import { removeStandIn } from '../../engine/modules.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan, C = P.colors, K = P.kit, sea = shared.sea, path = ctx.path;
  const rnd = ctx.rng(505), params = new URLSearchParams(location.search);
  const info = { columns: {}, pieces: {} };
  const hash2 = (x, z, k = 0) => { const v = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
  const json = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  // what the models' scripts wrote down about them (source-art/models/sea/*.py): sizes, where a column's plain stretch is, where pools are
  const [capSpec, hangSpec] = await Promise.all([json('assets/models/sea/cap.json'), json('assets/models/sea/hang.json')]);

  // ---------------------------------------------------------------------------------------------- painted surfaces
  // The area's surface paintings (tools/art.py; docs/art/sea.md section 10; how they were made: docs/build/sea/2-kit.md).
  // They are never laid on as pictures of things: every form is modelled, and the painting gives its faces their joints,
  // cracks, lichen, salt, crust and weed. A painting that is missing leaves flat paint and nothing else.
  const white = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); t.needsUpdate = true; return t; })();
  const art = {};
  // (only the four this module lays on its own forms are loaded here: the list in plan.kit.art also serves the heroes)
  // (`side` here is the page's basalt as generated a second time, without joints: plan.kit.art.face. The first, plan.kit.art.side, has
  // six level joint lines to a repeat, each with its bloom of salt: on every column, near and far, that was a course every 0.57 m,
  // a tower of drums: sea_k5_005.png, sea_k5_013_crop.png. A column's joints are its model's and the few drawn below: never the painting's.)
  const artFile = (n) => (n === 'side' && K.art.face && !params.has('oldside') ? K.art.face : K.art[n]);
  await Promise.all(['side', 'tide', 'rough', 'ledge'].map(async (n) => { art[n] = await ctx.tex(`art/sea/${artFile(n).file}.webp`, { repeat: true }).catch(() => null); }));
  const inv = (n) => (art[n] ? new THREE.Vector3(1 / artFile(n).mean[0], 1 / artFile(n).mean[1], 1 / artFile(n).mean[2]) : new THREE.Vector3(1, 1, 1));

  // ---------------------------------------------------------------------------------------------- the kit's rock
  // Everything solid here wears the sea's own rock material (shared.sea.extend: light from below, a cool rim from the
  // sky) and, laid over it, this: the kit's paint.
  //   - Each column takes its own part of the painted basalt (a number from where it stands), along its own faces, so
  //     the joints of neighbours never line up and no face is stretched; thicker columns have longer drums.
  //   - Drums. Far columns: joints drawn here, each a plane through the column tipped its own way, at uneven heights.
  //     Modelled columns say where their joints are (their UVs: source-art/models/sea/basalt.py).
  //   - The tide zone: below about 1.4 m the rock is crusted with barnacle and mussel and hung with wrack, to a ragged line.
  //   - The sea's light on rock is added light and does not pass through a surface's paint; so the paint is carried
  //     into it here, at half strength (the square root): a joint is a dark line and lichen a pale patch in every light.
  //   - `unit`: the far column unit's shape. `tele`: a near column's height. `rough`: uncolumned rock (caps, the brow).
  // The kit's rock is published for the others as shared.rocks.paint (kitExtend, kitRock, kitTint) at the end.
  const FOOT = { amount: 1, film: 0.075, breath: 0.4, thin: 0.66, over: 0.45, ...(K.foot || {}) }, WEED = { top: 0.5, tint: '#a9b6b2', amount: 1, crust: 0.7, ...(K.weed || {}) };      // (plan.kit.foot, plan.kit.weed: the numbers are the plan's; these stand if it has none)
  const WU = (ctx.engine && ctx.engine.water && ctx.engine.water.material && ctx.engine.water.material.uniforms) || {};
  const kitUniforms = {
    tKitSide: { value: art.side || white }, uKitSideInv: { value: inv('side') },
    tKitTide: { value: art.tide || white }, uKitTideInv: { value: inv('tide') },
    tKitRough: { value: art.rough || white }, uKitRoughInv: { value: inv('rough') },
    tKitLedge: { value: art.ledge || white }, uKitLedgeInv: { value: inv('ledge') },
    uKitRef: { value: new THREE.Color(C.basalt) },
    uKit: { value: new THREE.Vector4(1 / K.tile.side, 1 / WEED.crust, K.show, K.tide.top) },      // (y: the crust's repeat on the kit's own rock, plan.kit.weed.crust: at plan.kit.tile.tide, 1.25 m, a barnacle was a flower a hand across)
    uKitTide: { value: new THREE.Vector4(K.tide.gain, K.tide.amount, K.tide.ragged, WEED.top) },
    uKitPaint: { value: new THREE.Vector4(K.paint.amount, K.paint.drum, K.paint.seam, K.paint.drums) },
    uKitBig: { value: new THREE.Vector4(1 / K.tile.rough, 1 / K.tile.ledge, K.paint.lip ?? 0.35, 0) },      // (z: how pale the chipped lip at a joint)
    // the cave (filled in where the wall is laid out): xy a point in the middle of the cleft's mouth, zw the way in (level, a unit);
    // R: half the width that counts as inside, metres over which the light from the mouth falls to a third, the height under which a thing is inside
    uKitCave: { value: new THREE.Vector4(0, 1e6, 0, -1) }, uKitCaveR: { value: new THREE.Vector4(10, 9, 26, K.low ?? 0.55) },      // (R.w: LOW, below)
    // the lit foot (plan.kit.foot; kitExt's light, "THE LIT FOOT"): x how bright a film of light is at most (what is brighter is a mark), y how much of a
    // film is kept just over the water, z how few marks are left high up (the cut their clusters must pass), w metres over which they thin; 2.x: how much of all this
    uKitFoot: { value: new THREE.Vector4(FOOT.film, FOOT.breath, FOOT.thin, FOOT.over) }, uKitFoot2: { value: new THREE.Vector4(FOOT.amount, 0, 0, 0) },
    // the weed's zone (plan.kit.weed): rgb what wet rock under the crust's band is multiplied by, w how much of it; uKitTide.w is its upper line (m)
    uKitWeed: { value: (() => { const c = new THREE.Color(WEED.tint); return new THREE.Vector4(c.r, c.g, c.b, WEED.amount); })() },
    // the water's own body colours (its live uniforms: they follow the light states): what rock that goes down under the surface goes down INTO
    uKitSeaA: WU.uDeep || { value: new THREE.Color(P.water.deep) }, uKitSeaB: WU.uShallow || { value: new THREE.Color(P.water.shallow) },
  };
  const kitExt = (o = {}) => (params.has('nopaint') ? kitExtPlain(o) : kitExtFull(o));
  const kitExtPlain = (o = {}) => { const e = kitExtFull(o); return { defines: e.defines, uniforms: e.uniforms, vertexPars: e.vertexPars, vertexLocal: e.vertexLocal }; };      // (&nopaint=1: the kit's shapes without its paint, to measure what the paint costs)
  const kitExtFull = (o = {}) => ({
    defines: { ...(o.unit ? { KIT_UNIT: '' } : {}), ...(o.uv ? { KIT_UV: '' } : {}), ...(o.rough ? { KIT_ROUGH: '' } : {}), ...(o.pools ? { KIT_POOL: '' } : {}),
      ...(o.tele ? { KIT_TELE: '', KIT_Z0: Number(o.tele.z0).toFixed(3), KIT_Z1: Number(o.tele.z1).toFixed(3), KIT_SPLIT: Number(o.tele.split).toFixed(3), KIT_TOPZ: Number(o.tele.top ?? 4).toFixed(3) } : {}),
      KIT_WIDTH: Number(o.width || 1).toFixed(3), ...(o.defines || {}) },
    uniforms: kitUniforms,
    vertexPars: /* glsl */`varying vec4 vKit;
      #ifdef KIT_UNIT
        attribute vec2 aKit;
      #endif
      #ifdef KIT_TELE
        varying vec2 vKitZ; varying float vKitTop;
      #endif`,
    vertexLocal: /* glsl */`
      #ifdef USE_INSTANCING
        vec3 kI = instanceMatrix[3].xyz; float kSx = length(instanceMatrix[0].xyz), kSy = length(instanceMatrix[1].xyz);
      #else
        vec3 kI = modelMatrix[3].xyz; float kSx = 1.0, kSy = 1.0;
      #endif
      float kSd = fract(sin(dot(kI.xz, vec2(12.9898, 78.233))) * 43758.5453);                // this copy's own number, from where it stands
      vKit = vec4(kSd, clamp(0.78 / max(kSx * KIT_WIDTH, 0.2), 0.45, 1.3), kI.xz);
      #ifdef KIT_UNIT
      {
        // THE FAR COLUMN UNIT. One prism of seven corners; each copy makes itself five-, six- or seven-sided, out of
        // true, turned its own way; sheds a drum somewhere below its top (a ledge the sky finds); and ends in a break
        // that slants its own way. Top and ledge keep their true size whatever the column's height (which is the copy's scale).
        float kN = kSd < 0.2 ? 5.0 : (kSd < 0.78 ? 6.0 : 7.0);
        float kC = aKit.x < kN ? aKit.x : 0.0;                                               // corners beyond its count fold onto the first
        vec3 kH = fract(sin(vec3(kC * 12.71 + kSd * 311.7, kC * 7.13 + kSd * 74.7, kC * 3.71 + kSd * 191.3)) * 43758.5453);
        float kA = (kC + (kH.x - 0.5) * 0.46) * 6.2831853 / kN + kSd * 40.0;
        float kR = 0.5 * (0.84 + 0.3 * kH.y);
        float kShed = step(0.5, fract(kSd * 17.3)) * step(1.5, aKit.y);                      // above the ledge the shaft is slimmer and stands a little aside
        float kHb = min(mix(0.5, 6.0, pow(fract(kSd * 53.7), 2.0)), 0.8 * kSy);              // metres below the top
        float kIn = mix(1.0, 0.76 + 0.16 * fract(kSd * 29.1), kShed);
        vec2 kOff = kShed * (vec2(fract(kSd * 91.3), fract(kSd * 37.9)) - 0.5) * 0.12;
        float kSl = (fract(kSd * 71.7) - 0.5) * 0.9;
        float kTop = 1.0 + (kSl * cos(kA - kSd * 60.0) * kR * kSx + (kH.z - 0.5) * 0.18) / kSy;
        transformed.x = cos(kA) * kR * kIn + kOff.x; transformed.z = sin(kA) * kR * kIn + kOff.y;
        transformed.y = aKit.y < 0.5 ? 0.0 : (aKit.y < 2.5 ? 1.0 - kHb / kSy : (aKit.y < 3.5 ? kTop : 1.0 - 0.06 / kSy));
        if (aKit.y > 3.5) transformed.xz = kOff;
      }
      #endif
      #ifdef KIT_TELE
      {
        // A NEAR COLUMN'S HEIGHT. The model is one whole column of true size, scaled whole by the copy's x scale; the
        // copy's y scale also carries how much taller this one stands (y = x * (1 + metres of the model / 64)), and the
        // shaft is drawn out across the model's plain stretch, between two of its joints (KIT_Z0, KIT_Z1).
        float kSt = (kSy / kSx - 1.0) * 64.0;
        vKitZ = vec2(kI.y + kSx * KIT_Z0, kI.y + kSx * (KIT_Z1 + kSt)); vKitTop = kI.y + kSx * (KIT_TOPZ + kSt);
        transformed.y = (transformed.y + kSt * step(KIT_SPLIT, transformed.y)) * kSx / kSy;
        objectNormal.y *= kSx / kSy;
      }
      #endif`,
    fragmentPars: /* glsl */`varying vec4 vKit; uniform sampler2D tKitSide, tKitTide, tKitRough, tKitLedge; uniform vec3 uKitSideInv, uKitTideInv, uKitRoughInv, uKitLedgeInv, uKitRef, uKitSeaA, uKitSeaB; uniform vec4 uKit, uKitTide, uKitPaint, uKitBig, uKitCave, uKitCaveR, uKitFoot, uKitFoot2, uKitWeed;
      #ifdef KIT_TELE
        varying vec2 vKitZ; varying float vKitTop;
      #endif`,
    albedo: /* glsl */`
      vec3 kFn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));                                 // the face itself (a rounded arris must not smear the painting)
      float kUp = smoothstep(0.62, 0.88, abs(kFn.y));
      vec2 kAl = normalize(vec2(-kFn.z, kFn.x) + vec2(1e-4, 0.0));                            // along the face, level
      float kU = dot(vWPos.xz - vKit.zw, kAl);
      #ifdef KIT_ROUGH
        // uncolumned rock: the painted fracture from three sides, and on steep faces the streaks that run down from ledges
        vec3 kBw = pow(abs(kFn), vec3(5.0)); kBw /= (kBw.x + kBw.y + kBw.z);
        vec3 kQ = vWPos * uKitBig.x + vKit.x * 3.7;
        vec3 kPt = (texture2D(tKitRough, kQ.zy).rgb * kBw.x + texture2D(tKitRough, kQ.xz).rgb * kBw.y + texture2D(tKitRough, kQ.xy).rgb * kBw.z) * uKitRoughInv;
        vec3 kLg = texture2D(tKitLedge, vec2(kU + vKit.x * 9.0, vWPos.y) * uKitBig.y).rgb * uKitLedgeInv;
        kPt = mix(kPt, kLg, (1.0 - kUp) * 0.55);
        float kLum = dot(kPt, vec3(0.25, 0.45, 0.3));
        vec3 kRel = mix(vec3(1.0), mix(vec3(kLum), kPt, 0.35), 0.8);
      #else
        // the painted basalt, as a change of value about its own mean (and a little of its change of hue: lichen is greyer than rock)
        vec3 kPt = texture2D(tKitSide, mix((vec2(kU, vWPos.y) + vKit.x * vec2(13.7, 7.9)) * (uKit.x * vKit.y), (vWPos.xz * 1.9 + vKit.x * 5.3) * uKit.x, kUp)).rgb * uKitSideInv;
        float kLum = dot(kPt, vec3(0.25, 0.45, 0.3));
        vec3 kRel = mix(vec3(1.0), mix(vec3(kLum), kPt, 0.35), uKitPaint.x);
        // drums: a column is a stack of drums of its own lengths. A joint is an open dark line with the chipped pale lip of
        // the drum below it, and no two drums are quite one colour (modelled joints take over on a near column: kProc)
        float kProc = 1.0 - kUp;
        #ifdef KIT_TELE
          kProc *= smoothstep(vKitZ.x, vKitZ.x + 0.25, vWPos.y) * (1.0 - smoothstep(vKitZ.y - 0.25, vKitZ.y, vWPos.y));
        #endif
        float kDl = uKitPaint.y / vKit.y;
        // (each joint is a plane through the column, tipped its own way: its line climbs round the shaft and is never level with a neighbour's)
        float kJy = vWPos.y / kDl + vKit.x * 37.0, kJc = floor(kJy + 0.5);
        vec3 kJh = fract(sin(vec3(kJc * 91.7 + vKit.x * 411.3, kJc * 47.3 + vKit.x * 173.1, kJc * 23.9 + vKit.x * 311.9)) * 43758.5453);
        float kJd = (kJy - kJc - (kJh.x - 0.5) * 0.86) * kDl + dot(vWPos.xz - vKit.zw, (kJh.yz - 0.5) * 0.34);      // metres above this joint (below it: negative)
        float kHas = step(0.5, fract(kJh.x * 7.31));                                            // many drums are two or three long: no two columns keep one rhythm
        float kDrum = fract(sin((kJc + step(0.0, kJd)) * 57.3 + vKit.x * 191.7) * 43758.5453);
        float kSeam = (1.0 - smoothstep(0.01, 0.032, abs(kJd))) * kHas * (0.55 + 0.45 * smoothstep(0.7, 1.1, kLum));
        float kLip = (1.0 - smoothstep(0.0, 0.1, -kJd)) * step(kJd, 0.0) * kHas * smoothstep(0.8, 1.3, kLum);
        float kJoints = (1.0 - uKitPaint.z * kSeam) * (1.0 + uKitBig.z * kLip) * (1.0 + uKitPaint.w * (kDrum - 0.5) * kHas);
        #ifdef KIT_UV
          // a modelled column says where its own joints are: u = metres above the foot of this drum, v = metres below its
          // top (a top: u = 9). The open joint is dark, the chipped foot of the drum above it pale, each drum its own tone.
          // (a top is u = 9 exactly and v within 0..1; the water in a dish u = 11, v = 1. Read as "u over 8.5" and "u over 10.5" they also took in the
          // side of any foot drum more than 8.5 m long, and since every piece goes down nine metres that is every foot drum from half a metre under still
          // water up: no joint was drawn under its head, and where pools are read its side above +0.5 m was painted as held water, a flat pale band
          // with a ruled lower edge across every patch of steps and many a stump: sea_k7_063_crop.png)
          float kTopF = step(8.99, vUv0.x) * step(vUv0.x, 9.01) * step(vUv0.y, 1.01), kUd = vUv0.x, kVd = vUv0.y;
          float kSeamM = (1.0 - smoothstep(0.012, 0.045, min(kUd, kVd))) * (1.0 - kTopF);
          float kLipM = smoothstep(0.02, 0.05, kUd) * (1.0 - smoothstep(0.05, 0.15, kUd)) * (1.0 - kTopF) * smoothstep(0.75, 1.2, kLum);
          float kDrumM = fract(sin(floor((kUd + kVd) * 37.0 + 0.5) * 12.9898 + vKit.x * 311.7) * 43758.5453);
          float kModel = (1.0 - uKitPaint.z * kSeamM) * (1.0 + 0.7 * uKitBig.z * kLipM) * (1.0 + uKitPaint.w * (kDrumM - 0.5) * (1.0 - kTopF));
          #ifndef KIT_TELE
            kProc = 0.0;
          #endif
          kRel *= mix(kModel, kJoints, kProc);
        #else
          kRel *= mix(1.0, kJoints, kProc);
        #endif
      #endif
      {
        // THE TIDE ZONE, in bands as the sea lays them. From the splash line (ragged, near 1.4 m) down: a band of barnacle crust, the
        // palest thing on the rock; and from about half a metre over still water down, the weed's zone: black-wet rock that the crust
        // does not reach, in which a column is still a column. (As first laid the crust lay on everything under the line, tops and
        // all: every step, reef and fallen drum, all of them under a metre, wore its pale blossoms from the water up like
        // camouflage, and a reef was a heap of crates: sea_k6_005.png against sea_k6_007.png, the same without paint.)
        vec3 kTd = texture2D(tKitTide, mix(vec2(kU, vWPos.y), vWPos.xz, kUp) * uKit.y + vKit.x * vec2(3.1, 5.7)).rgb * uKitTideInv;
        float kTl = dot(kTd, vec3(0.25, 0.45, 0.3));
        float kTy = vWPos.y - (kTl - 1.0) * uKitTide.z - (vKit.x - 0.5) * 0.3 - 0.3 * (seaNoise(vWPos.xz * 1.7 + vKit.x * 9.0) - 0.5);      // (the last: the lines stand a hand higher on one column of a patch than on the next. A patch of steps is one copy, and across all its blocks the crust's lower edge was one ruled level line, a painted stripe: sea_k7_062.png)
        float kBand = 1.0 - smoothstep(uKit.w - 0.55, uKit.w + 0.3, kTy);
        float kWeedZ = (1.0 - smoothstep(uKitTide.w - 0.22, uKitTide.w + 0.18, kTy + 0.3 * (kLum - 1.0))) * uKitWeed.w;
        kRel = mix(kRel, mix(vec3(kTl), kTd, 0.3) * uKitTide.x, kBand * uKitTide.y * (1.0 - kWeedZ) * mix(1.0, 0.4, kUp));      // (a top is swept: it keeps less crust than a face)
        kRel = mix(kRel, kRel * uKitWeed.rgb * (0.8 + 0.2 * kTl), kWeedZ);
      }
      #ifdef KIT_TELE
      {
        // a ledge the petrels use (a near column broken off two to six metres up: the cast's crevices): the birds' pale
        // streaks run down its faces from the top, a metre and a half, and its top is splashed with the same
        float kBird = step(2.0, vKitTop) * step(vKitTop, 6.2) * step(0.55, fract(vKit.x * 23.7)), kDn = vKitTop - vWPos.y;      // (not every ledge is used)
        vec3 kG = texture2D(tKitLedge, vec2(kU * 1.3 + vKit.x * 5.0, vWPos.y * 0.45) * uKitBig.y * 3.0).rgb * uKitLedgeInv;
        float kGl = dot(kG, vec3(0.25, 0.45, 0.3));
        float kStreak = kBird * mix((1.0 - smoothstep(0.15, 1.7, kDn)) * smoothstep(1.12, 1.5, kGl + 0.3 * (1.0 - smoothstep(0.0, 0.5, kDn))), 0.5 * smoothstep(0.9, 1.3, kGl), kUp) * step(-0.3, kDn);
        // (runs of slate-lilac no paler than the sky behind them, and never a whole face: at 0.34 of a near white the top drum of every
        // such column was a block of marble, the palest thing in every picture at rest: sea_k5_003.png)
        kRel = mix(kRel, vec3(2.3, 2.5, 2.6), 0.3 * kStreak * (0.5 + 0.7 * fract(vKit.x * 61.3)));
      }
      #endif
      #ifdef KIT_POOL
        float kPool = step(10.99, vUv0.x) * step(vUv0.x, 11.01) * step(0.99, vUv0.y) * step(vUv0.y, 1.01);                                                     // the water a dished top holds (its UVs say so): no rock paint on it
        kRel = mix(kRel, vec3(1.0), kPool);
      #endif
      albedo *= kRel;`,
    light: /* glsl */`vec3 kShow = mix(vec3(1.0), sqrt(clamp(albedo / uKitRef, 0.03, 12.0)), uKit.z); c *= kShow;
      {
        // UNDER THE WATER rock goes down into the dark: the sea's light (the lit foot, the fill behind the front) is made
        // for what stands in air, and on a reef plate or the shaft of a column under the surface it stood as a glowing
        // slab with a ruled edge. From a hand under where the water stands NOW, all light dies over a metre and a half.
        float kRise = vWPos.y - seaSwellN(vWPos.xz, 0.0) * (uSwell[0].w + uSwell[1].w + uSwell[2].w);
        float kAir = smoothstep(-1.7, -0.2, kRise);
        // (the dark it goes down into is the WATER'S OWN: the colour the water shows where nothing lies beneath it, deep or, looked down into beside
        // the boat, its petrol body. Gone down to black instead, the nine sunk metres of a reef stood in the clear water beside the boat as a black
        // box with ruled corners, darker than the sea round it: sea_k7_051.png, sea_k7_056.png)
        vec3 kBody = mix(uKitSeaA, uKitSeaB, pow(clamp(V.y, 0.0, 1.0), 1.5) * (1.0 - smoothstep(4.0, 70.0, distance(vWPos, uCameraPos))));
        // (but in the cave the bed under the keel IS the dark: there the water is the dark thing, and its petrol body between the walls was a pale strip: sea_k6_035.png)
        vec2 kCq = vWPos.xz - uKitCave.xy;
        kBody *= 1.0 - 0.92 * smoothstep(-4.0, 3.0, dot(kCq, uKitCave.zw)) * (1.0 - smoothstep(uKitCaveR.x, uKitCaveR.x + 2.5, abs(dot(kCq, vec2(-uKitCave.w, uKitCave.z)))));
        c = mix(kBody, c, kAir); glow *= kAir * kAir;
        {
          // THE LIT FOOT (the kit's own shaping of the sea's light on its rock near the eye; plan.kit.foot; with its amount at 0 the light is left as it comes).
          // The surge's wash is made to be read from the channel. From a boat's length it stood on a stump, a step or a fallen drum as a
          // film of teal from the water to its top with marks all through it, and the rock was a block of glass (sea_k6_003.png, the
          // gate's stumps; sea_k6_002.png). Wet basalt is black, and what the sea's light does on it is MARKS, densest at the waterline:
          //   - what is weaker than a mark (the film between the marks) is kept only as a breath a hand or two over the water;
          //   - marks stand in clusters with bare rock between them, fewer the higher above the water as it stands NOW.
          // On what faces up and far off (where single marks cannot be told apart) nothing is changed: there the light's own sum speaks.
          // (near: by the distance to the eye, not by the rock under a pixel: a face seen edge-on has metres under a pixel, and left out it kept
          // its film and drew every stump's outline in light. What faces up: by the shading's own normal, as the light reads it: a joint's ledge is a face to both)
          float kNearEye = 1.0 - smoothstep(22.0, 60.0, distance(vWPos, uCameraPos)), kFlatN = clamp(N.y, 0.0, 1.0) * clamp(N.y, 0.0, 1.0);
          float kOver = max(kRise, 0.0) * (0.7 + 0.75 * seaNoise(vec2(kU * 0.8 + vKit.x * 19.0, vKit.x * 3.0))), kGl = dot(glow, vec3(0.25, 0.55, 0.2));      // (the run-up stands higher on one face than on the next: its upper edge is never a level line)
          float kIsFilm = 1.0 - smoothstep(uKitFoot.x, 2.2 * uKitFoot.x + 1e-4, kGl);
          float kBreath = uKitFoot.y * exp(-kOver / 0.3);
          float kCn = 0.65 * seaNoise(vec2(kU * 2.1 + vKit.x * 31.0, vWPos.y * 1.5 + vKit.x * 7.0)) + 0.35 * seaNoise(vec2(kU * 5.3 + vKit.x * 13.0, vWPos.y * 4.1));
          float kCut = uKitFoot.z * (1.0 - exp(-kOver / (uKitFoot.w * (1.0 + 1.5 * uSeaL.z))));      // (inside the gate, as a crest floods it, they climb two and a half times as far)
          float kClus = smoothstep(kCut - 0.06, kCut + 0.06, kCn);
          glow *= mix(1.0, mix(kClus, kBreath, kIsFilm), kNearEye * (1.0 - kFlatN) * uKitFoot2.x);
        }
        #ifdef KIT_TELE
          // a stump (a near column that ends within a man's height of the water) is low rock like the steps it stands in: behind
          // the rain front it keeps LOW of the lit sea's fill, so that it is a dark thing with a lit foot and not a block of ice
          c *= mix(1.0, mix(uKitCaveR.w, 1.0, smoothstep(2.2, 5.0, vKitTop)), seaFront(vWPos.xz) * uSeaL.x);
        #endif
        // INSIDE THE CAVE the only light is what comes in at the mouth, and it dies as it goes in: rock stands a little
        // darker with every metre, until the last of it cannot be told from the dark the cave ends in. (Without this the
        // cave was lit to its end like the cliff outside and stopped at a flat black shape: sea_k4_045.png)
        vec2 kCv = vWPos.xz - uKitCave.xy; float kIn = dot(kCv, uKitCave.zw), kAc = abs(dot(kCv, vec2(-uKitCave.w, uKitCave.z)));
        float kCave = smoothstep(-1.5, 2.5, kIn) * (1.0 - smoothstep(uKitCaveR.x, uKitCaveR.x + 2.5, kAc)) * (1.0 - smoothstep(uKitCaveR.z, uKitCaveR.z + 6.0, vWPos.y));
        // (and it comes from one side: what is turned to the mouth takes it, what is turned into the cave is a silhouette to a rider looking back out)
        float kTurn = mix(0.22, 1.0, smoothstep(-0.7, 0.35, -dot(N.xz, uKitCave.zw)));
        float kFall = exp(-pow(max(kIn, 0.0) / uKitCaveR.y, 1.6));
        float kMouth = mix(1.0, (0.015 + 0.985 * kFall) * kTurn, kCave);
        vec3 kLamp = kShow * albedo * lamps;                                                  // (the rider's own lantern and the kept lamp are not the mouth's light: in the cave they are all there is)
        c = (c - kLamp) * kMouth + kLamp; glow *= kMouth;
        // ... and it is a LIGHT, not only a loss: the night sky in the mouth (and behind the front the lit sea under it) rakes along the
        // walls from behind a rider going in, so that every column has a side turned to it and a side turned away, and the cave can be
        // read. It is there for an eye that is INSIDE (kEye: the boat from 3 m outside the face to 3 m in): from the sound the cave is a
        // dark mouth in a dark cliff, and with this on it the mouth wore a pale lining (sea_k4_104.png); as the rider goes in, the eye
        // opens and the colonnade comes up out of the dark.
        float kToward = smoothstep(0.05, 0.85, -dot(N.xz, uKitCave.zw) + 0.3 * max(-N.y, 0.0));
        float kEye = smoothstep(-3.0, 3.0, dot(uBoat.xz - uKitCave.xy, uKitCave.zw));
        c += kShow * (uSeaSky0 * 0.5 + uSeaFillLow * (0.4 * seaFront(vWPos.xz) * uSeaL.x)) * (kEye * kToward * kFall * kCave * smoothstep(0.8, 3.6, kIn) * (1.0 - smoothstep(-0.4, 0.3, -kRise)));
      }
      #ifdef KIT_POOL
      if (kPool > 0.5) {
        // Each swell that reaches a top fills its dish with light, which it keeps for some seconds and loses, cooling;
        // behind the rain front every dish answers the rain. Broken by the sea's own marks, like every light here
        // (the functions and uniforms are light.js's); never core: held water is aqua at its newest.
        // (and still water in a dish is a small mirror: from a boat it is looked at aslant and gives back the low sky, one clear step
        // lighter than the wet rock round it; looked down into, it is dark. Without this a pool could not be told from a top until a swell lit it.)
        float pRise = vWPos.y - seaSwellN(vWPos.xz, 0.0) * (uSwell[0].w + uSwell[1].w + uSwell[2].w), pOut = smoothstep(0.02, 0.3, pRise);      // (not while the sea stands over it)
        float pAsl = 1.0 - clamp(V.y, 0.0, 1.0); pAsl *= pAsl;
        c = mix(c, uSeaSky0 * (0.3 + 0.42 * seaNoise(vWPos.xz * 3.1 + 7.0) + 0.12 * stroke), 0.62 * pAsl * pOut);      // (the sky it gives back is cloud: lighter here, darker there; evenly pale it was a lid on the column)
        float pE = 0.0;
        for (int i = 0; i < 5; i++) pE = max(pE, smoothstep(0.1, 0.6, seaSwellN(vWPos.xz, float(i) * 1.4) - vWPos.y * 0.85) * (1.0 - 0.19 * float(i)));
        pE = max(pE, 0.62 * seaFront(vWPos.xz) * uSeaL.x) * uSeaL.y;
        vec2 pF = texture2D(tSeaFleck, vWPos.xz * 1.9).rg;
        float pCut = 1.02 - pE * 0.85, pFl = smoothstep(pCut, pCut + 0.2, pF.r) * pF.g * (0.55 + 0.75 * pF.g);
        // (and a dish gives off its light only once the sea has left it: while the swell stood over the lowest steps their dishes shone up through
        // it, and the water bent each into a stroke: a fringe of light hung under the waterline along every patch of steps, sea_k7_015_crop.png)
        glow += seaAge(pE * 0.88, uSeaCore, uSeaAqua, uSeaEmber, uSeaViolet * 0.4) * (pFl * (0.45 + 0.6 * pE) * smoothstep(-0.1, 0.04, pRise));
      }
      #endif`,
  });
  // THE LIGHT'S OWN TEXT, CHANGED FOR THE KIT'S ROCK (plan.kit.near; &nearlight=0 leaves it as light.js gives it). sea.extend hands over the rock's
  // light as text. The kit's rock is the rock a boat lies alongside, and three things in that light are made to be read from the channel:
  //   - its largest marks are dabs up to half a metre long: on a cliff forty metres off they are flecks; on a stump at a boat's length they were
  //     leaves as large as its face, and a reef at a crest was a heap of glass crates in camouflage (sea_k7_004.png, sea_k7_007.png). Near the eye
  //     the large dabs are left out and the middle ones thinned: what is left is the glitter and the small commas, which are the right size there;
  //   - rock is lit from a metre under the surface: through the clear water the sunk half of a reef or a stump stood as a pale slab with a ruled
  //     edge. Here nothing is lit deeper than a hand or two under where the water stands NOW;
  //   - the draining threads are plumb lines of one brightness from a top down into the deep: here each wavers a finger or two as it finds its
  //     way down the rock, and runs in beads.
  // Each change is made only if its line is still there as it was (light.js is not the kit's): what was not found is named in the console and in
  // &counts=1 (nearLight), and the light is then left as it comes for that part.
  const NEARL = { amount: 1, big: [12, 30], mid: [1.5, 4.5], line: 0.4, above: 0.2, under: 0.18, wander: 1, ...(K.near || {}) };
  const nearNotes = info.nearLight = { applied: [], missed: [] }, fx = (v) => Number(v).toFixed(3);
  const seaForKit = (ext) => {
    if (!ext || typeof ext.light !== 'string' || !NEARL.amount || params.get('nearlight') === '0') return ext;
    let s = ext.light;
    const sub = (what, from, to) => { const t = s.replace(from, to); if (t === s) { if (!nearNotes.missed.includes(what)) { nearNotes.missed.push(what); console.warn(`sea/kit: the light's text has changed (${what}): the kit's rock takes that part as it comes`); } } else if (!nearNotes.applied.includes(what)) nearNotes.applied.push(what); s = t; };
    // near the eye: no large dabs, fewer of the middle ones (each mark's cover is its green, its own threshold its red)
    // (the small commas: near the eye they keep to the waterline, where with the glitter they are its bright broken line; above it one in five is left,
    // and no two are one brightness: all of one flat aqua, spread evenly up a face, they were confetti)
    sub('marks', 'seaFa *= 1.0 - seaFlat; seaFb *= 1.0 - 0.92 * seaFlat;', `seaFa *= 1.0 - seaFlat; seaFb *= 1.0 - 0.92 * seaFlat;
      { float kitEye = distance(vWPos, uCameraPos), kitBig = smoothstep(${fx(NEARL.big[0])}, ${fx(NEARL.big[1])}, kitEye), kitMid = smoothstep(${fx(NEARL.mid[0])}, ${fx(NEARL.mid[1])}, kitEye), kitNear = 1.0 - smoothstep(${fx(NEARL.big[0] + 2)}, ${fx(NEARL.big[1] + 4)}, kitEye);
        float kitLow = 1.0 - smoothstep(0.06, ${fx(NEARL.line)}, seaRise + 0.2 * (seaBroad - 0.5)), kitTone = smoothstep(0.15, 0.85, fract(seaFb.b / max(seaFb.g, 0.004) * 3.7));
        seaFa.g *= kitBig; seaFa.r *= 0.6 + 0.4 * kitBig;
        seaFb.g *= (0.35 + 0.65 * kitMid) * mix(1.0, mix(${fx(NEARL.above)}, 1.0, kitLow) * (0.3 + 0.7 * kitTone), kitNear); seaFb.r *= 0.8 + 0.2 * kitMid; }`);
    // a face seen edge-on has metres of rock under a pixel, and the light takes it for rock far off, which it paints in flat bands: every arris
    // and every top seen at a glance was a bar of teal, an outline round each block (sea-kit6/c014z.png). How far off a face is, is how far it is from the eye.
    sub('far', 'float seaPx = length(fwidth(vWPos)),', 'float seaPx = min(length(fwidth(vWPos)), 0.004 * distance(vWPos, uCameraPos)),');
    // nothing lit under the surface
    sub('wash', /float seaWashZ = smoothstep\(-[\d.]+, -[\d.]+, seaRise\);/, `float seaWashZ = smoothstep(-${fx(NEARL.under)}, -0.03, seaRise);`);
    sub('wet', /float seaWet = smoothstep\(-[\d.]+, -[\d.]+, seaRise\) \* seaShore;/, `float seaWet = smoothstep(-${fx(NEARL.under)}, -0.03, seaRise) * seaShore;`);
    sub('climb', /smoothstep\(-0\.9, 0\.0, seaRise\);/, `smoothstep(-${fx(NEARL.under)}, 0.0, seaRise);`);
    // (nor does the sky lie on a top that is under water: the sunk tops of a reef were pale sheets in the clear water round it)
    sub('sky', '(seaSkyW * seaPale * seaOpen);', '(seaSkyW * seaPale * seaOpen * (0.12 + 0.88 * smoothstep(-0.4, -0.02, seaRise)));');
    // threads that waver and bead
    // (it jogs a finger's breadth to one side and the other, as water does on rough rock; swung to and fro evenly it was a worm of light)
    sub('thread', 'abs(fract(seaTc) - 0.2 - 0.6 * seaTh) * 0.42', `abs(fract(seaTc) - 0.2 - 0.6 * seaTh + ${fx(NEARL.wander)} * 0.1 * (seaNoise(vec2(seaTi * 3.1 + 7.0, seaY * 2.7)) - 0.5)) * 0.42`);
    sub('beads', /smoothstep\(0\.42, 0\.7, seaNoise\(vec2\(seaTi \* 7\.3, seaY \* 1\.6 \+ uTime/, 'smoothstep(0.6, 0.78, seaNoise(vec2(seaTi * 7.3, seaY * 9.0 + uTime');
    sub('drain', 'float seaDrain = seaLine * seaDash *', 'float seaDrain = smoothstep(-0.05, 0.03, seaRise) * smoothstep(0.3, 0.45, seaNoise(vec2(seaTi * 3.7 + 2.0, seaY * 24.0 + uTime * 1.3))) * seaLine * seaDash *');      // (a thread ends where it meets the water: carried on under it, a row of them hung from every waterline like a fringe)
    sub('fewer', 'step(0.62, seaTh2 + 0.3 * seaBroad)', 'step(0.76, seaTh2 + 0.3 * seaBroad)');      // (one face in five carries a thread, not two: where a pale band of crust crossed a block, a thread on every other face was a row of stitches along it: sea_k7_047.png)
    return { ...ext, light: s };
  };
  /** The two extensions together, for kit.gouache and kit.models: the sea's light (as the kit's rock takes it), then the kit's paint. o: rest, top, run, pale, uniform (shared.sea.extend) and unit, uv, tele, rough, width. */
  const kitExtend = (o = {}) => [seaForKit(sea.extend({ rest: o.rest, top: o.top, run: o.run, pale: o.pale, uniform: o.uniform })), kitExt(o)];
  /** The kit's rock as a material: any gouache option, and the options of kitExtend. */
  const kitRock = (o = {}) => {
    const { rest, top, run, pale, uniform, unit, uv, tele, rough, width, defines, ...g } = o;
    return kit.gouache({ color: '#ffffff', brush: 0.6, ...g, extend: kitExtend(o) });
  };
  // the models are painted in a mid value (so that paint can be read on a Blender sheet); here that paint is brought down to the page's basalt
  const basaltLin = new THREE.Color(C.basalt), paintLin = new THREE.Color(K.base);
  const kitTint = new THREE.Color(basaltLin.r / paintLin.r, basaltLin.g / paintLin.g, basaltLin.b / paintLin.b);
  // LOW: how readily the kit's low rock (steps, reefs, fallen drums: all of it within a man's height of the water) takes the sky's
  // slate and the lit sea's light. At 1 a reef behind the rain front was a block of pale ice (sea_k4_063.png) and at rest its
  // tops were paler than the sky; the key painting's low rock is dark, with the light at its waterline.
  const LOW = (K.low ?? 0.55);
  const relTint = (chip) => { const c = new THREE.Color(chip); return new THREE.Color(c.r / basaltLin.r, c.g / basaltLin.g, c.b / basaltLin.b); };

  // (A geometry that is instanced with a colour for each copy carries white vertex paint, and its material says vertexColors.
  // From 21:14 on 7 November the engine's gouache declares its paint varying in the vertex shader only under USE_COLOR, which
  // three.js sets there for vertex colours alone, while the fragment shader has it for instance colours too: a material with
  // instance colours and no vertex colours no longer links, and every far column of the area was missing: sea_k5_023.png.
  // With white paint on the geometry both shaders agree, in either version of the engine. See "Asked of the engine".)
  const whitePaint = (g) => { g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 3).fill(1), 3)); return g; };
  // ---------------------------------------------------------------------------------------------- the far column unit
  // One metre tall and one across, foot at y = 0; height and width by instance scale. 49 triangles: the lower shaft,
  // the ledge where a drum was shed, the upper shaft, the broken top. Its shape is made in the vertex shader (above),
  // from a number each copy takes from where it stands: no two neighbours are alike, and it is one draw call a group.
  // aKit: x the corner (0..6), y the ring (0 foot, 1 under the ledge, 2 over it, 3 the top's rim, 4 the top's middle).
  const unit = (() => {
    const pos = [], ak = [], nor = [], idx = [], n = 7;
    for (let j = 0; j < 4; j++) for (let k = 0; k < n; k++) { const a = k * Math.PI * 2 / n; pos.push(Math.cos(a) * 0.5, [0, 0.7, 0.7, 1][j], Math.sin(a) * 0.5); nor.push(Math.cos(a), 0, Math.sin(a)); ak.push(k, j); }
    pos.push(0, 1, 0); nor.push(0, 1, 0); ak.push(0, 4);
    for (let j = 0; j < 3; j++) for (let k = 0; k < n; k++) { const a = j * n + k, b = j * n + (k + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
    for (let k = 0; k < n; k++) idx.push(3 * n + k, 4 * n, 3 * n + (k + 1) % n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aKit', new THREE.Float32BufferAttribute(ak, 2));
    g.setIndex(idx); whitePaint(g);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.5, 0), 1.2); g.boundingBox = new THREE.Box3(new THREE.Vector3(-0.7, 0, -0.7), new THREE.Vector3(0.7, 1.3, 0.7));
    return g;
  })();
  // The light unit, for a column that stands behind others: no ledge, six corners, 18 triangles (the same shader makes its shape).
  const unitInner = (() => {
    const pos = [], ak = [], nor = [], idx = [], n = 6;
    for (const j of [0, 3]) for (let k = 0; k < n; k++) { const a = k * Math.PI * 2 / n; pos.push(Math.cos(a) * 0.5, j ? 1 : 0, Math.sin(a) * 0.5); nor.push(Math.cos(a), 0, Math.sin(a)); ak.push(k, j); }
    pos.push(0, 1, 0); nor.push(0, 1, 0); ak.push(0, 4);
    for (let k = 0; k < n; k++) { const a = k, b = (k + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
    for (let k = 0; k < n; k++) idx.push(n + k, 2 * n, n + (k + 1) % n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aKit', new THREE.Float32BufferAttribute(ak, 2));
    g.setIndex(idx); whitePaint(g);
    g.boundingSphere = unit.boundingSphere.clone(); g.boundingBox = unit.boundingBox.clone();
    return g;
  })();
  const rockMat = kitRock({ flat: true, unit: true, vertexColors: true });                // (instances carry the basalt's colour and its variation)
  const innerU = sea.gateInner;                                                           // the gate's inner walls and vault: the surge climbs further there
  const gateInnerMat = kitRock({ flat: true, unit: true, uniform: innerU, vertexColors: true });
  const tints = [C.basalt, C.basalt, '#1a1730', '#141126', '#262440', '#1d1a33', C.basaltWet, '#19172c', '#211e38'];      // (the palest was the page's lichen chip, #2B2A45: a whole column of it is three times basalt's value, a bar of marble in a dark wall)
  const tint = () => tints[Math.floor(rnd() * tints.length)];
  // a column: foot at (x, z), width w, height h above the water, leaning by `lean` radians toward (lx, lz)
  // (`inner`: it stands behind others and only its top shows over them: it is drawn as the light unit)
  // (BELOW: the water is clear near the boat (clarity 8.5 m) and a column that ended 2.5 m down hung in it; every column now goes down
  // nine metres, into the dark. `below` is still the depth its lean is taken about, so that it stands where it stood above the water)
  const BELOW = 9;
  const col = (list, x, z, w, h, lean = 0, lx = 0, lz = 0, below = P.columns.below, inner = false, color = tint()) => { const k = Math.tan(lean) * (BELOW - below); list.push({ position: [x - lx * k, -BELOW, z - lz * k], scale: [w, h + BELOW, w], rotation: [lean * lz, 0, -lean * lx], color, x, z, w, h, inner }); };
  const groups = { pipes: [], gate: [], gateInner: [], wall: [], cleft: [], farPipes: [], skerry: [], near: [] }, hangList = [];
  // Zones along the route. What is modelled for the close band (Blender columns, steps, clumps, reefs, hanging ends, the
  // cave's vault) is drawn only while the boat is within reach of its zone: [from, to] in metres along. Out of reach
  // (70 m and more) the far units that stand for it in the mirror stand for it in the direct view as well (`twins`).
  const REACH = { stacks: [-1e9, 132], gate: [55, 176], sound: [100, 222], wall: [118, 1e9] };
  const zones = {}, twinLists = {}; for (const k of Object.keys(REACH)) { zones[k] = { shown: [], twins: [] }; twinLists[k] = []; }
  const zoneAt = (x, z) => { const zs = path.locate(x, z, null, tmp).s; return zs < 87 ? 'stacks' : zs < 112 ? 'gate' : zs < 200 ? 'sound' : 'wall'; };
  // The smallest things of the close band (clumps, wrack: a few centimetres each, never seen from more than a few metres) are
  // drawn by CELL: a stretch of CELL metres along the route, shown only while the boat is within CELL_REACH metres of it along the route.
  const CELL = 18, CELL_REACH = 24, cellShown = [];                                       // [{ o, s0, s1 }]
  const cellAt = (x, z) => Math.floor(path.locate(x, z, null, tmp).s / CELL);
  const reefList = [];                                                                    // `reef` a, b: { v, x, z, turn, sx, sz } (placed below)
  const supports = [];                                                                    // the modelled rock of the close band (steps, reefs, near columns): what a lodged thing rests on
  const soft = (x, z, r, k = true) => ctx.addCollider({ x, z, r, soft: k });               // shallows: the boat can cross, is slowed, and is eased out                                                  // things shown only while the boat is where they can be seen (update, below)
  // which columns are close-band ones: within 14 m of the channel, on its side of the rock
  const tmp = {};
  const outOf = (x, z) => { const l = path.locate(x, z, null, tmp); return { s: l.s, d: l.d, out: Math.abs(l.d) - l.halfWidth }; };
  const frameAt = (s) => { const a = path.at(s); return { x: a.x, z: a.z, tx: a.tx, tz: a.tz, rx: a.rx, rz: a.rz }; };
  const at2 = (f, d, v = 0) => [f.x + f.rx * d + f.tx * v, f.z + f.rz * d + f.tz * v];
  const colliders = [], addC = (x, z, r) => { colliders.push({ x, z, r }); ctx.addCollider({ x, z, r }); };
  const outlines = [];                                                                    // for the surf light
  const feet = [];                                                                        // close-band places on rock at the waterline: [x, z, nx, nz] (outward), for clumps and drums
  const rocks = shared.rocks = { stacks: [], gate: null, wall: null, colliders, feet };

  // ---------------------------------------------------------------------------------------------- steps
  // `steps` a to c: a patch of column tops stepping down into the water, 4 m along a rock and 3 m out (at scale 1). It
  // stands with its back row under the rock's own columns and its front row awash; the rock's own short columns are
  // not grown where a patch stands (inSteps). centre of its back line, the way out to the water, scale.
  const stepList = [];
  const steps = (x, z, ox, oz, scale = 1) => { const l = Math.hypot(ox, oz) || 1; stepList.push({ x, z, ox: ox / l, oz: oz / l, scale, v: stepList.length % 3 }); };
  const inSteps = (px, pz) => {
    for (const s of stepList) { const dx = px - s.x, dz = pz - s.z, v = dx * s.ox + dz * s.oz, u = -dx * s.oz + dz * s.ox; if (Math.abs(u) < 2.0 * s.scale - 0.1 && v > 0.15 && v < 3.0 * s.scale) return true; }
    return false;
  };

  // ---------------------------------------------------------------------------------------------- the pipes
  // Eleven stacks of hexagonal columns, 0.55 to 0.9 m across, leaning together 2 to 6 degrees, broken off at different
  // heights, each with a wave-cut skirt. (A whole footprint packed at 0.78 m is the page's count of 1,900.)
  // Neighbours break off together: a stack's top is a set of treads, each a bundle of columns broken at one joint
  // (clusters about 2.6 m across, each with its own height), not a cone.
  const bundle = (u, v, seed, size = 2.6) => {
    const iu = Math.floor(u / size), iv = Math.floor(v / size); let best = 1e9, val = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const cu = iu + a, cv = iv + b, d = Math.hypot(u - (cu + hash2(cu, cv, seed)) * size, v - (cv + hash2(cu, cv, seed + 7)) * size);
      if (d < best) { best = d; val = hash2(cu, cv, seed + 13); }
    }
    return val;
  };
  // the same, with shoulders: at the border between two bundles a column or two stands at a height between theirs
  const bundleSoft = (u, v, seed, size = 2.6, soft = 1.8) => {
    const iu = Math.floor(u / size), iv = Math.floor(v / size); let d1 = 1e9, d2 = 1e9, v1 = 0, v2 = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const cu = iu + a, cv = iv + b, d = Math.hypot(u - (cu + hash2(cu, cv, seed)) * size, v - (cv + hash2(cu, cv, seed + 7)) * size), val = hash2(cu, cv, seed + 13);
      if (d < d1) { d2 = d1; v2 = v1; d1 = d; v1 = val; } else if (d < d2) { d2 = d; v2 = val; }
    }
    return lerp(v1, v2, 0.5 * (1 - smooth(0, soft, d2 - d1)));
  };
  const grow = (list, cx, cz, tx, tz, A, B, H, o = {}) => {
    const p = P.columns.pitch, rx = -tz, rz = tx, seed = o.seed || 1, shell = [];
    for (let j = -Math.ceil(B / (p * 0.866)); j <= Math.ceil(B / (p * 0.866)); j++) for (let i = -Math.ceil(A / p) - 1; i <= Math.ceil(A / p) + 1; i++) {
      const u = i * p + (j & 1 ? p / 2 : 0), v = j * p * 0.866, rho = Math.hypot(u / A, v / B);
      if (rho > 1) continue;
      if (o.slit && Math.abs(u) < o.slit / 2) continue;                                   // the leaning pair: two shafts and a slit
      const n1 = kit.fbm(u * 0.3 + seed * 7.1, v * 0.3 - seed * 3.3, 2, seed), bd = bundle(u, v, seed * 3 + 1);
      let h = H * (o.flat ? 0.93 + 0.07 * n1 : (1 - 0.36 * smooth(0.3, 1.0, rho)) * (0.6 + 0.28 * bd * bd + 0.2 * n1));
      if (!o.flat && (bd > 0.82 || rho < 0.4) && rho < 0.62) h = H * (0.9 + 0.1 * n1) * (rho < 0.4 ? 1 - 0.25 * (rho / 0.4) * (1 - bd) : 1);      // the tallest bundles, and the heart of the stack, carry its height
      if (!o.flat && rnd() < 0.22) h -= rnd() * 0.1 * H;
      h = Math.min(H, Math.max(0.3, Math.round(h / 0.6) * 0.6 + (rnd() - 0.5) * 0.25));
      if (rho > 0.8) h = Math.min(h, 0.15 + (1 - (rho - 0.8) / 0.2) * 5 * (0.3 + 0.7 * rnd()));      // the skirt: column tops stepping down, the lowest awash
      const x = cx + tx * u + rx * v + (rnd() - 0.5) * 0.14, z = cz + tz * u + rz * v + (rnd() - 0.5) * 0.14;
      const lean = (P.columns.lean[0] + (P.columns.lean[1] - P.columns.lean[0]) * rnd()) * Math.PI / 180 * Math.min(1, rho * 1.2);
      const dl = Math.hypot(u, v) || 1, lx = -(tx * u + rx * v) / dl, lz = -(tz * u + rz * v) / dl;
      const w = Math.min(P.columns.across[1], Math.max(P.columns.across[0], p * (0.74 + 0.42 * rnd())));
      if (h < 3.2 && inSteps(x, z)) continue;                                             // a steps patch stands here
      const q = rho > 0.72 ? outOf(x, z) : null;
      // close band: on the shell, within 14 m of the channel, and on the channel's side of the rock
      const near = !o.far && q && q.out < 14 && Math.sign(q.d) * ((x - cx) * path.at(q.s, tmp).rx + (z - cz) * tmp.rz) < 0.5;
      col(near ? groups.near : list, x, z, w, h, lean, lx, lz, P.columns.below, rho < 0.68);
      if (o.crown && rho < 0.5 && h > o.crown.h) { o.crown.h = h; o.crown.x = x + lx * Math.tan(lean) * h; o.crown.z = z + lz * Math.tan(lean) * h; }      // where its tallest column ends: the cap sits there
      if (rho > 0.9 && near) shell.push([x, z, -lx, -lz]);
    }
    return shell;
  };
  const close = [2, 3, 6, 7, 9, 10];                                                      // the stacks whose feet the boat passes (the page's close band)
  for (const st of P.stacks) {
    const f = frameAt(st.s), [cx, cz] = at2(f, st.d), A = st.along / 2, B = st.across / 2;
    const side = st.d > 0 ? -1 : 1;                                                       // the channel is on this side of it
    // steps on the channel side: two patches (three round the largest feet), each turned to the foot's own curve
    if (close.includes(st.n)) for (const a of (A + B > 12.5 ? [-0.62, 0, 0.62] : [-0.42, 0.42])) {
      const cu = Math.sin(a) * A, cv = Math.cos(a) * B * side, nu = Math.sin(a) / A, nv = Math.cos(a) * side / B, nl = Math.hypot(nu, nv), k = 1 - 1.75 / Math.hypot(cu, cv);
      steps(cx + f.tx * cu * k + f.rx * cv * k, cz + f.tz * cu * k + f.rz * cv * k, (f.tx * nu + f.rx * nv) / nl, (f.tz * nu + f.rz * nv) / nl);
    }
    const crown = { h: 0, x: cx, z: cz };
    const shell = grow(groups.pipes, cx, cz, f.tx, f.tz, A, B, st.flat ? st.h : st.h * P.kit.cap.under, { seed: st.n, flat: st.flat, slit: st.slit, crown });      // (a stack's height is its cap's crest: its columns stop a tenth short)
    feet.push(...shell);
    // its collider (every stack: the edges are soft and a rider can leave the channel), as circles along its long axis
    if (A - B > 1) for (const k of [-1, 0, 1]) addC(cx + f.tx * k * (A - B), cz + f.tz * k * (A - B), B + 1.0); else addC(cx, cz, Math.max(A, B) + 1.0);
    outlines.push({ pts: ellipseOutline(cx, cz, f.tx, f.tz, A + 0.2, B + 0.2), width: 3.4 });
    rocks.stacks.push({ ...st, x: cx, z: cz, tx: f.tx, tz: f.tz, rx: f.rx, rz: f.rz, A, B, side, crown });
  }
  // `cap` a to c (source-art/models/sea/cap.py): rough uncolumned rock on top of every stack but the table. Each is
  // scaled to its stack's top (about six tenths of the foot: the columns lean together), its crest at the stack's height,
  // turned its own way. Flat-shaded: it is fractured rock.
  const roughOpts = { color: kitTint, flat: true, brush: 0.6, extend: kitExtend({ rough: true }) };
  {
    const sets = { a: [], b: [], c: [] }, names = ['a', 'b', 'c'];
    if (capSpec) for (const [i, st] of rocks.stacks.entries()) {
      if (st.flat) continue;
      const v = names[(i * 2 + 1) % 3], c = capSpec.cap[v], y0 = Math.min(st.h * K.cap.under, st.crown.h) - 0.5, t = hash2(st.x, st.z, 4) * Math.PI * 2;
      const sx = K.cap.across * st.along / c.across[0], sz = K.cap.across * st.across / c.across[1], sy = Math.max(0.4, (st.h - y0) / c.crest) * (0.85 + 0.3 * hash2(st.x, st.z, 6));
      // (the cap is turned by t about the vertical: its own x and z are scaled before the turn, so a long stack gets a long cap only when the turn is small; keep it nearly square)
      const k = (sx + sz) / 2;
      sets[v].push({ position: [lerp(st.x, st.crown.x, 0.6), y0 - 0.8, lerp(st.z, st.crown.z, 0.6)], rotation: [(hash2(st.x, st.z, 7) - 0.5) * 0.3, t, (hash2(st.x, st.z, 8) - 0.5) * 0.3], scale: [k, sy, k], tint: ['#ffffff', '#ece8f6', '#f6f2ff'][i % 3] });
    }
    let n = 0, tri = 0;
    for (const v of names) if (sets[v].length) { const m = await kit.models(`models/sea/cap_${v}.glb`, sets[v], roughOpts); m.group.name = `cap:${v}`; ctx.only(m.group, 'direct'); n += m.count; tri += m.triangles; }      // (in the mirror, a rough half-size picture, the coarse columns under it stand for it)
    info.pieces.cap = { copies: n, triangles: tri };
  }

  // ---------------------------------------------------------------------------------------------- the gate
  // A curtain of columnar basalt across the route with a pointed arch through it. Its frame: centre plane at s 96.
  {
    const G = P.gate, f = frameAt(G.s), p = 0.9;
    rocks.gate = { ...f, s: G.s };
    // causeway steps at each foot (the page: 1.5 m wide; patches at scale 0.72 are 2.2 m out, their back row under the
    // jamb's own columns). The right jamb's run unbroken; the left jamb's leave room for its nine stumps.
    for (const v of [-8.2, -4.9, -1.6, 1.6, 4.9, 8.2]) { const [x, z] = at2(f, G.open + 0.55, v); steps(x, z, -f.rx, -f.rz, 0.72); }
    for (const v of [-7.4, 0, 7.4]) { const [x, z] = at2(f, -(G.open + 0.55), v); steps(x, z, f.rx, f.rz, 0.72); }
    const column = (list, d, v, w, h, sign, inner) => { const [x, z] = at2(f, d, v); col(list, x + (rnd() - 0.5) * 0.14, z + (rnd() - 0.5) * 0.14, w, h, 4 * Math.PI / 180, -f.tx * sign, -f.tz * sign, P.columns.below, inner); };      // leaning 4 degrees inward
    // THE WINGS' TOP LINE (beyond the crown, d -62 to -35 and +35 to +50). The page gives the crest as a straight fall from
    // 30 m to 16 m, and built so it was a ruled ramp against the sky from both sides (sea_k5_009_crop.png), ending in a
    // square corner. A wall of basalt breaks off in bundles: its top goes in plateaus some 8 m long, each at the page's
    // height or a quarter under it, with a notch where a bundle has gone; and its two ends come down to their reefs in
    // three or four steps. Under the crown nothing changes (the crown sits on those columns).
    const wingK = (d) => {
      const a = Math.abs(d), t = smooth(G.crown.half + 1, G.crown.half + 6, a);
      if (t <= 0) return 1;
      const blk = 0.76 + 0.24 * smooth(0.3, 0.7, bundleSoft(d, 3, 337, 8, 2.5)), notch = bundle(d, 3, 277, 5.5) < 0.15 ? 0.68 : 1;
      const end = Math.min(d - G.from, G.to - d), stepDown = 0.42 + 0.58 * Math.min(1, Math.ceil(Math.max(0.01, end + 2 * (hash2(Math.round(d / 3), 5, 9) - 0.5)) / 3.2) / 3);      // the last ten metres: three steps down
      return lerp(1, blk * notch, t) * stepDown;
    };
    const crestOf = (d) => G.crestAt(d) * wingK(d);
    for (let d = G.from; d <= G.to; d += p) {
      const half = G.thickAt(d) / 2, crest = crestOf(d), under = Math.abs(d) < G.crown.half;      // under the crown the columns stop where it begins
      if (Math.abs(d) < G.open + 0.5) continue;                                           // the opening
      const rows = under ? 5 : Math.ceil(half / (p * 0.866));
      for (const sign of [-1, 1]) for (let k = 0; k < rows; k++) {
        const v = sign * (half - 0.45 - k * p * 0.866), dd = d + (k & 1 ? p / 2 : 0) + (rnd() - 0.5) * 0.1;
        if (Math.abs(dd) < G.open + 0.5 || dd > G.to || dd < G.from) continue;
        const n1 = kit.fbm(dd * 0.21 + sign * 9, k * 0.7, 2, 33), bd = bundle(dd, sign * 40 + k * 0.9, 77, 3.4);
        // organ pipes: the outer rows are shorter, the inner ones carry the crest; and they break off in bundles
        let h = (under ? Math.min(crest, G.crown.from + 1.5) : crest) * [0.56, 0.72, 0.86, 0.95, 1, 1, 1, 1, 1, 1][Math.min(k, 9)] * (0.8 + 0.14 * n1 + 0.12 * bd);
        if (rnd() < 0.25) h -= rnd() * 3;
        const near = Math.abs(dd) < G.open + 4.2 && k === 0;                              // the jambs' own columns are close band
        column(near ? groups.near : groups.gate, dd, v, p * (0.9 + 0.3 * rnd()), Math.max(1, h), sign, (k >= 1 && d > G.from + 3 && d < G.to - 3) || Math.abs(dd) > 27);      // (behind others, or out on the wings where no eye comes within 20 m: the light unit)
      }
    }
    // the two ends: columns wrapped round them
    for (const [d0, turn] of [[G.from, -1], [G.to, 1]]) {
      const half = G.thickAt(d0) / 2, crest = crestOf(d0 - turn * 0.5);
      for (let k = 0; k < 3; k++) for (let a = -1.45; a <= 1.45; a += p / (half - k * 0.8)) {
        const r = half - 0.45 - k * 0.8, [x, z] = at2(f, d0 + turn * Math.cos(a) * r * 0.9, Math.sin(a) * r);
        col(groups.gate, x, z, p * (0.9 + 0.3 * rnd()), crest * [0.5, 0.7, 0.9][k] * (0.8 + 0.3 * rnd()), 0, 0, 0, P.columns.below, k >= 1);
      }
    }
    // the jambs inside the tunnel: two rows a side, standing as high as the arch lets them; and the nine stumps
    for (const side of [-1, 1]) for (let v = -G.thickAt(0) / 2 + 0.5; v <= G.thickAt(0) / 2 - 0.5; v += p) for (let k = 0; k < 2; k++) {
      const d = side * (G.open + 0.35 + k * 0.8), [x, z] = at2(f, d, v + (k ? p / 2 : 0));
      col(k === 0 ? groups.near : groups.gateInner, x, z, p * (0.9 + 0.25 * rnd()), (k ? 9.5 : 6.5) * (0.75 + 0.3 * rnd()), 4 * Math.PI / 180, -f.rx * side, -f.rz * side);
      if (k === 0 && rnd() < 0.5) feet.push([x, z, -f.rx * side, -f.rz * side]);
    }
    // nine free-standing stumps in the water along the left jamb, in the gaps of its causeway
    [-9.5, -5.3, -4.2, -3.0, -2.1, 2.0, 3.1, 4.2, 5.3].forEach((v) => {
      const [x, z] = at2(f, lerp(G.stumps.d[0], G.stumps.d[1], rnd()), v + (rnd() - 0.5) * 0.3);
      col(groups.near, x, z, 0.6 + 0.3 * rnd(), lerp(G.stumps.top[0], G.stumps.top[1], rnd()));
      (rocks.gateStumps || (rocks.gateStumps = [])).push({ ...groups.near[groups.near.length - 1], v });
    });
    // hanging ends: 150 broken column ends under the vault (`hang` a to d, placed below)
    for (let i = 0; i < G.hang.count; i++) {
      const d = (rnd() * 2 - 1) * 10.6, v = (rnd() * 2 - 1) * (G.thickAt(0) / 2 - 0.6), [x, z] = at2(f, d, v), len = lerp(G.hang.len[0], G.hang.len[1], Math.pow(rnd(), 1.7));
      hangList.push({ x, y: G.arch(d) + 0.5, z, len, w: 0.85 + 0.5 * rnd(), turn: rnd() * Math.PI * 2, color: [C.basalt, '#1a1730', '#141126', C.basaltWet, '#19172c'][Math.floor(rnd() * 5)] });      // (no lichen under a wet roof)
    }
    // the gate's body behind its columns: two piers of rough rock (never seen whole: the columns stand five rows deep in front of them)
    // (its top stands under the lowest column tops near it: as first built it stood 2.4 m under the page's crest, above every bundle
    // that had broken lower, and it was the ruled ramp; and it stops 5 m short of each end, where the wall comes down in steps)
    const pier = (d0, d1) => {
      const sh = new THREE.Shape(), pts = [[d0, -3]];
      const low = (d) => 0.74 * Math.min(crestOf(d - 2.4), crestOf(d - 1.2), crestOf(d), crestOf(d + 1.2), crestOf(d + 2.4)) - 0.6;
      for (let d = d0; d <= d1 + 1e-6; d += (d1 - d0) / 40) pts.push([d, Math.abs(d) < G.crown.half ? Math.min(G.crestAt(d), G.crown.from + 1) - 2.4 : low(d)]);
      pts.push([d1, -3]);
      pts.forEach(([d, y], i) => (i ? sh.lineTo(d, y) : sh.moveTo(d, y)));
      return sh;
    };
    {
      const geo = new THREE.ExtrudeGeometry([pier(G.from + 5, -(G.open + 1.2)), pier(G.open + 1.2, G.to - 5)], { depth: 9, bevelEnabled: false }); geo.translate(0, 0, -4.5);
      const m = new THREE.Mesh(geo, kitRock({ color: C.basaltWet, rough: true })); m.name = 'the gate: body behind its columns';
      m.position.set(f.x, 0, f.z); m.rotation.y = Math.atan2(-f.rz, f.rx); ctx.add(m);
    }
    // colliders: the steps and stumps along both jambs (free water 21 m), the piers, the reefs awash at the two ends
    for (const side of [-1, 1]) for (let v = -9.6; v <= 9.7; v += 2.74) { const [x, z] = at2(f, side * (G.open - G.steps + 1.6), v); addC(x, z, 1.6); }
    for (const [d, r] of [[-23, 10.4], [-40, 9.2], [-55, 8.2], [23, 10.4], [38, 9], [47, 8]]) { const [x, z] = at2(f, d, 0); addC(x, z, r); }
    // (stage 6, engineering: those six circles are round and the gate's two faces are straight: between them, and in the corner beside each jamb, the
    // rock stood up to 4.5 m outside every circle, and a boat paddled at the corner by the left jamb put its bow into a column: .shots/sea_crit_ram_jamb.png.
    // A row along each face of each pier, a metre and more of water kept in front of it. For the boat only (ctx.addCollider, not addC: the cast plans the
    // ways of its animals by the kit's own list, which is as it was). The free water of the opening is not touched: the jambs' own circles reach further in.)
    for (const [d0, d1] of [[G.from + 5, -(G.open + 2.6)], [G.open + 2.6, G.to - 5]]) {
      const n = Math.ceil((d1 - d0) / 3.5);
      for (let i = 0; i <= n; i++) for (const side of [-1, 1]) { const d = d0 + (d1 - d0) * i / n, [x, z] = at2(f, d, side * (G.thickAt(d) / 2 - 2.0)); ctx.addCollider({ x, z, r: 3.5 }); }
    }
    for (const [d, r] of [[-66, 5.4], [54, 5.4]]) { const [x, z] = at2(f, d, 0); addC(x, z, r); soft(x, z, r + 3.2); }      // (the reefs at its ends: shallows that slow the boat and ease it back, round a core that stops it: the gate is the only way through)
    // surf: round each pier, and the whole floor of the gate (the surge)
    const ring = (d0, d1) => { const pts = []; for (let d = d0; d <= d1 + 1e-6; d += 2) pts.push(at2(f, d, -G.thickAt(d) / 2 - 0.2)); for (let d = d1; d >= d0 - 1e-6; d -= 2) pts.push(at2(f, d, G.thickAt(d) / 2 + 0.2)); return pts; };
    outlines.push({ pts: ring(G.from - 0.5, -G.open), width: 3.6 }, { pts: ring(G.open, G.to + 0.5), width: 3.6 });
    outlines.push({ pts: [at2(f, -G.open + 0.5, -11), at2(f, -G.open + 0.5, -4), at2(f, -G.open + 0.5, 4), at2(f, -G.open + 0.5, 11)], closed: false, width: 11, inset: 0, flip: true });
    outlines.push({ pts: [at2(f, G.open - 0.5, -11), at2(f, G.open - 0.5, -4), at2(f, G.open - 0.5, 4), at2(f, G.open - 0.5, 11)], closed: false, width: 11, inset: 0 });
    // `reef`: plates of column tops just under the surface, at the gate's two ends (placed with the other reefs, below)
    // (the lighter of the two small tables, `b`: no boat comes within 40 m of the left end, and the water leans it back from the right one. 2,208 triangles a copy where
    // the first plates had 2,885 and `a` has 3,140: both ends are drawn whenever the gate is looked at from s 55 to s 176)
    for (const [i, [d0, d1]] of G.reefs.entries()) { const [x, z] = at2(f, (d0 + d1) / 2, 0); reefList.push({ v: 'b', x, z, turn: Math.atan2(-f.rz, f.rx) + i * Math.PI, sx: (d1 - d0 + 3) / 11, sz: 9 / 8 }); }
  }

  // ---------------------------------------------------------------------------------------------- the wall, the Prow, the cleft and the cave
  {
    const Wl = P.wall, f = frameAt(Wl.s), p = Wl.col;
    rocks.wall = { ...f, s: Wl.s };
    // steps either side of the cleft's mouth, their back row under the plinth
    for (const side of [-1, 1]) { const [x, z] = at2(f, side * (Wl.cleft.half + 3.6), 0.4); steps(x, z, -f.tx, -f.tz); }
    // the face as a polyline in the realm's x, z, with the water on its up-route side; then the Prow's side and the coast beyond
    const face = Wl.face.map(([d, z]) => ({ d, zf: z, p: at2(f, d, z) }));
    const coastEnd = Wl.prow.coast, prowTip = at2(f, Wl.prow.from, -Wl.prow.out), prowIn = at2(f, Wl.prow.to - 0.3, -Wl.prow.out);
    // walk a polyline and call fn(x, z, nx, nz) every `step` metres. (nx, nz) is the side the water is on: with flip 1,
    // (tz, -tx) of the direction of travel; with -1 the other side
    const walk = (pts, step, fn, flip = 1) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
        for (let t = 0; t < len; t += step) fn(a[0] + tx * t, a[1] + tz * t, tz * flip, -tx * flip, i + t / len);
      }
    };
    const dOf = (x, z) => (x - f.x) * f.rx + (z - f.z) * f.rz, zOf = (x, z) => (x - f.x) * f.tx + (z - f.z) * f.tz;      // a point in the wall's frame: across, and down the route from the face
    // the same every `step` metres along the whole line (the measure runs on round its corners), beginning `start` in
    const every = (pts, step, fn, flip = 1, start = step / 2) => {
      let acc = start;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
        while (acc <= len) { fn(a[0] + tx * acc, a[1] + tz * acc, tz * flip, -tx * flip); acc += step; }
        acc -= len;
      }
    };
    const cut = (pts, keep) => pts.filter((q) => keep(dOf(q[0], q[1])));
    const dense = (pts, step = 2) => { const o = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } o.push(pts[pts.length - 1]); return o; };
    // THE ORGAN. A cliff of basalt is ranks of columns, each rank standing behind and above the one in front like the
    // pipes of an organ: the front rank reaches not half the cliff's height, the last ones its brow. Within a rank
    // neighbours break off together (bundles a few metres across); here and there a bundle has broken low (a notch) or
    // fallen altogether (a chimney, its drums at the foot); every bundle leans its own way by a degree or two; and the
    // whole crest rises and falls. The page's three tiers are in it: the plinth of stumps; the colonnade (ranks 0 to
    // 2: columns 1.2 to 1.6 m across, to about 32 m); and above it the cap: thinner columns to the brow, with the
    // rough rock of the cliff's body standing between their bundles. Nothing here is a slab and no top is a line.
    // [share of the cliff's height its columns reach, width as a share of wall.col]
    const RANKS = [[0.46, 1], [0.6, 1], [0.72, 1], [0.82, 0.85], [0.9, 0.85], [0.96, 0.72], [1, 0.72], [0.93, 0.72]];
    const FAR_RANKS = [[0.5, 1.15], [0.74, 1.15], [0.92, 1], [1, 1]];                      // (120 m off and more: fewer and stouter)
    const depthsOf = (R) => { const z = [0.4]; for (let k = 1; k < R.length; k++) z.push(z[k - 1] + 0.8 * p * (R[k - 1][1] + R[k][1]) / 2); return z; };
    // (the cliff's top goes in blocks some 17 m long, each its own height: 0.82 to 1 of the page's)
    const blockOf = (x, z) => 0.74 + 0.26 * smooth(0.25, 0.75, bundleSoft(x, z, 331, 21, 5));      // (plateaus: 0.74 or the full height, and little between)
    // how high a column of rank k stands at (x, z) where the cliff is H high (null: its bundle has fallen)
    const rankHeight = (R, k, x, z, H) => {
      // THE SKYLINE. The last three ranks are the cliff's top line, and they break off TOGETHER: one pattern of bundles some
      // 8 m across runs through all three (each rank had its own, 4 m across, and the skyline was the highest of three
      // unrelated patterns: single columns standing above their neighbours like the pickets of a fence, sea_k4_075.png);
      // a bundle that has broken low is a notch through all three; and few of their columns end short by themselves.
      const sky = k >= R.length - 3;
      const bd = sky ? bundleSoft(x, z, 191, 8.5, 2.2) : bundle(x, z, 91 + k * 7, k < 3 ? 5 : 4.4), brk = sky ? bundle(x, z, 271, 11) : bundle(x, z, 171 + k * 5, 8), und = 0.89 + 0.2 * kit.fbm(x * 0.03 + 3, z * 0.03 - 7, 2, 55);
      if (k < 2 && brk < 0.07) return null;
      let h = H * blockOf(x, z) * R[k][0] * und * (sky ? 0.82 + 0.24 * bd : 0.87 + 0.19 * bd) * (brk > 0.88 ? 0.7 : 1);
      { const r1 = rnd(); if (r1 < 0.2) { const r2 = rnd(); h -= sky ? (r1 < 0.07 ? r2 * 2.5 : 0) : r2 * 3.5; } }
      return Math.round(h / 0.7) * 0.7 + (rnd() - 0.5) * 0.3;
    };
    // o.skip(x, z): no column here; o.near: its front rank is close band where the channel is within 14 m; o.far: the stout ranks
    const bundleTints = [C.basalt, '#1a1730', '#141126', '#211e38', '#1d1a33', C.basaltWet, '#19172c', '#252340'];
    const organ = (pts, flip, top, o = {}) => {
      const R = o.far ? FAR_RANKS : RANKS, Z = depthsOf(R);
      R.forEach(([, wk], k) => {
        const w0 = p * wk;
        every(pts, w0 * 0.98, (bx, bz, nx, nz) => {
          const x = bx - nx * Z[k] + (rnd() - 0.5) * 0.2, z = bz - nz * Z[k] + (rnd() - 0.5) * 0.2;
          if (o.skip && o.skip(x, z)) return;
          const h = rankHeight(R, k, x, z, top(dOf(bx, bz), x, z)), nearHere = k === 0 && o.near && outOf(bx, bz).out < 14;
          if (k === 0) {
            for (let j = 1; j <= 2; j++) if (rnd() < 0.72) {                              // the plinth of stumps
              const sx = bx + nx * (j * 1.1 - 0.2) + (rnd() - 0.5) * 0.3, sz = bz + nz * (j * 1.1 - 0.2) + (rnd() - 0.5) * 0.3;
              if (!inSteps(sx, sz)) col(nearHere ? groups.near : groups.wall, sx, sz, p * (0.8 + 0.3 * rnd()), Wl.plinth * (1.05 - 0.38 * j) * (0.3 + 0.7 * rnd()), 0, 0, 0, 3);
            }
            if (o.near && rnd() < (h === null ? 1 : 0.12)) feet.push([bx + nx * 2.4, bz + nz * 2.4, nx, nz]);      // (where a bundle fell, its drums lie)
          }
          if (h === null) return;
          // into the cliff by a degree or two, and with its bundle a little along it
          const tl = (bundle(x, z, 211 + k * 3, 6) - 0.5) * 0.028, inn = 0.02 + 0.015 * rnd(), lx = -nx * inn - nz * tl, lz = -nz * inn + nx * tl, ll = Math.hypot(lx, lz);
          col(nearHere ? groups.near : groups.wall, x, z, w0 * (0.86 + 0.28 * rnd()), h, ll, lx / ll, lz / ll, 3, (!!o.far && k >= 1) || (k >= 1 && dOf(x, z) > 42), rnd() < 0.3 ? tint() : bundleTints[Math.floor(bundle(x, z, 251 + k, 5.5) * bundleTints.length) % bundleTints.length]);      // (a bundle is mostly of one colour)
        }, flip, (k & 1 ? w0 * 0.49 : 0) + 0.3);
      });
    };
    // the cleft's mouth: half its width where the arch springs (the jambs' own columns stand just inside it), and how
    // high the arch is `zf` metres in from the face
    const W = Wl.cleft.half + 0.9, apexAt = (zf) => lerp(27, 20.5, smooth(0, 9.5, zf));
    const facePts = face.map((v) => v.p), iFar = face.findIndex((v) => v.d >= 110);
    organ(facePts.slice(0, iFar + 1), -1, (d) => Wl.heightAt(d), { skip: (x, z) => dOf(x, z) < W + 1.1, near: true });       // (the Prow has its own; the cleft is open)
    organ(facePts.slice(iFar), -1, (d) => Wl.heightAt(d), { far: true });
    // the Prow: a buttress standing out from the face, then the coast running away down the route
    // (the page models the coast for 80 m, to local (-30, -300); from west of the Prow its end showed against the sky, so it
    // runs on and bends away to the east behind itself, where no reachable eye can see it stop)
    const coast = [at2(f, Wl.prow.to - 0.3, -0.6), prowIn, prowTip, at2(f, Wl.prow.from - 1, 6), [lerp(prowTip[0], coastEnd[0], 0.5) - 5, lerp(prowTip[1], coastEnd[1], 0.5)], coastEnd, ...Wl.prow.beyond];
    organ(coast.slice(0, 5), 1, (d, x, z) => Wl.prow.height * (zOf(x, z) < 8 ? 1.03 / blockOf(x, z) : 1), { skip: (x, z) => zOf(x, z) > -0.7 && dOf(x, z) > -(W + 0.9), near: true });      // (its ranks stop short of the cleft's own jamb)
    organ(coast.slice(4), 1, () => Wl.prow.height, { far: true });
    // THE CLEFT'S WALLS AND THE CAVE'S: whole columns on both sides, following the path, standing 10 to 13 m and breaking
    // off two or three together; behind them a second row to 15 m. The roof begins over their heads: the mouth's hanging
    // orders and then the vault panels (source-art/models/sea/hang.py), whose lowest ends hang at about 11 m.
    // (As first built they stood 5 to 8 m under a roof that came down to 7 m at the walls: every column wore a wider block
    // on its head and the cave was a stack of boxes: sea_k5_026.png, sea_k5_002.png. The page gives only "its walls lean in
    // and close overhead at 20 m": the walls are now sheer for their first twelve metres, as in a sea cave of columns.)
    // (the second row is not grown where the organ's own ranks stand behind the jamb: the right wall for its first 7 m, the Prow's end on the left)
    for (let s = Wl.s - 0.5; s < P.length + 4; s += 1.05) for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
      if (k === 1 && s - Wl.s < (side > 0 ? 7.3 : 2.3)) continue;
      const a = path.at(Math.min(s, P.length), tmp), over = Math.max(0, s - P.length), d = side * (Wl.cleft.half + 0.55 + k * 1.0);
      const x = a.x + a.rx * d + a.tx * over, z = a.z + a.rz * d + a.tz * over;
      const bd = bundle(s, side * 9 + k * 3, 411, 3.1), h = k ? 12.6 + 2.8 * bd + 0.5 * rnd() : 10.3 + 2.4 * bd + (rnd() - 0.5) * 0.35;
      col(k === 0 ? groups.near : groups.wall, x, z, 1.0 + 0.3 * rnd(), h, 0.05, -a.rx * side, -a.rz * side, 3);
    }
    // (the left wall inside the mouth, behind its jamb, where the Prow's ranks have ended)
    for (let zf = 2.6; zf < 8; zf += 1.2) for (let j = 0; j < 2; j++) { const [x, z] = at2(f, -(W + 1.7 + j * 1.15) + (rnd() - 0.5) * 0.2, zf + (j ? 0.6 : 0)); col(groups.wall, x, z, p * (0.86 + 0.28 * rnd()), 22 + 12 * rnd() + j * 6, 0.02, f.rx, f.rz, 3); }
    // THE CLEFT'S MOUTH (the page: 16 m wide at the water, its walls closing overhead, 20 m by s 248). A pointed slot
    // where the cliff's columns have fallen away. Every rank of the organ runs on across it and ends in the air, its
    // columns broken off along a pointed arch (27 m at the face, 20.5 m ten metres in, where the vault panels take
    // over), each at a joint of its own: a portal of receding orders, all of them broken column ends, and inside it a
    // roof of the same. Nothing leans and nothing is a slab: the arch is in where each column broke.
    // (a hanging end is the column unit upside down: its break, and the ledge of its shed drum, are at its lower end)
    const archY = (a, zf, grow = 0) => { const Wd = W + grow, H = apexAt(zf) + grow * 1.4, c = (H * H - Wd * Wd) / (2 * Wd), R = Wd + c; return a >= Wd ? 0 : Math.sqrt(Math.max(0, R * R - (a + c) * (a + c))); };
    const wetTints = [C.basalt, '#1a1730', '#141126', C.basaltWet, '#19172c'];             // (no lichen under a wet roof)
    rocks.mouth = { ends: [], half: W, apexAt, archY };                                   // for the cast: [{ x, y, z }] the lower ends over the water (drips fall from them)
    { // the cave's own axis (it bends a little to the right): from the middle of the mouth to the path's end
      const a = path.at(Wl.s, {}), b = path.at(P.length, {}), l = Math.hypot(b.x - a.x, b.z - a.z);
      kitUniforms.uKitCave.value.set(a.x, a.z, (b.x - a.x) / l, (b.z - a.z) / l); kitUniforms.uKitCaveR.value.set(W + 2.4, K.cave ? K.cave.reach : 15, 26, kitUniforms.uKitCaveR.value.w);
      rocks.cave = { x: a.x, z: a.z, tx: (b.x - a.x) / l, tz: (b.z - a.z) / l, half: W + 2.4, reach: K.cave ? K.cave.reach : 15 };      // for the cast: how deep in the cave a place is
    }
    {
      const Z = depthsOf(RANKS), H = Wl.heightAt(0);
      for (let k = 0; k < RANKS.length + 3; k++) {
        const inside = k >= RANKS.length, w0 = p * (inside ? 0.85 : RANKS[k][1]), zk = inside ? Z[RANKS.length - 1] + (k - RANKS.length + 1) * 1.0 : Z[k];
        for (let d = -W + 0.35 + (k & 1 ? w0 * 0.49 : 0); d < W - 0.2; d += w0 * 0.98) {
          const a = Math.abs(d), [x, z] = at2(f, d + (rnd() - 0.5) * 0.15, zk + (rnd() - 0.5) * 0.15);
          let yLow = archY(a, zk) + (rnd() < 0.3 ? -rnd() * 1.4 : rnd() * 1.3);
          if (a > W - 1.7 && zk > 1.2) continue;                                           // (inside the mouth nothing hangs over the walls' own columns, which stand to 10 to 13 m: a wider end on a column's head was a box on a post)
          if (a > W - 1.7) yLow = Math.max(yLow, 13.2 + rnd());                            // (at the face itself the first order comes down to the jambs' heads)
          const yTop = inside ? yLow + 5 + 3 * rnd() : rankHeight(RANKS, k, x, z, H / blockOf(x, z));      // (over the mouth the cliff stands at its full height)
          if (yTop === null || yTop - yLow < 1.6) continue;
          groups.wall.push({ position: [x, yTop, z], scale: [w0 * (0.86 + 0.28 * rnd()), yTop - yLow, 1], rotation: [Math.PI, 0, 0], color: wetTints[Math.floor(rnd() * wetTints.length)], tier: true });
          const it = groups.wall[groups.wall.length - 1]; it.scale[2] = it.scale[0];
          if (a < W - 2) rocks.mouth.ends.push({ x, y: yLow, z });
        }
      }
    }
    rocks.brows = [];                                                                     // (the first build's brow of boulders: the organ's upper ranks and the body's own blocks are the cap now)
    // `cave_vault` a, b (source-art/models/sea/hang.py): where the cleft has closed (s 245 on), its roof is column ends
    // closing overhead: three panels of 12 m, each across the whole cleft, following the path (the cave bends right)
    rocks.vaults = [];
    for (const [i, sv] of [250.2, 259.4, 268.6].entries()) {
      const a = path.at(Math.min(sv, P.length), tmp), over = Math.max(0, sv - P.length);
      rocks.vaults.push({ v: i % 2 ? 'b' : 'a', position: [a.x + a.tx * over, 0, a.z + a.tz * over], rotation: [0, a.heading + (i === 1 ? Math.PI : 0), 0], scale: [1, 1, 1.02], tint: ['#ffffff', '#ece8f6', '#f6f2ff'][i] });
    }
    // THE CLIFF'S BODY: rough rock behind the ranks, so that no gap between columns shows the sky. It steps back as
    // the ranks do (always behind the rank that is in front at that height) and ends in blocks of its own heights,
    // 0.72 to 0.94 of the cliff's: where the cap's columns have broken low it is the rough rock that shows between them.
    const bodyPos = [], bodyIdx = [];
    const body = (line, flip, top, R = RANKS) => {
      const pts = dense(line, 2.5), N = pts.length, Z = depthsOf(R), nl = R.length - 1, ia = Math.min(2, nl), ib = Math.min(4, nl), sh = (k) => R[Math.min(k, nl)][0], base = bodyPos.length / 3;
      for (let i = 0; i < N; i++) {
        const a = pts[Math.min(i, N - 2)], b = pts[Math.min(i, N - 2) + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (b[1] - a[1]) / len * flip, nz = -(b[0] - a[0]) / len * flip, x = pts[i][0], z = pts[i][1];
        // (its tops stand under the lowest break of the ranks in front of them: 0.56 of a rank's own height, where a bundle has broken low.
        // As first built it stood to 0.72 .. 0.94 of the cliff and showed between the upper ranks as flat dark lids: sea_k4_002.png)
        const H = top(dOf(x, z), x, z) * blockOf(x, z), low = 0.5, blk = H * sh(nl) * low * (0.9 + 0.1 * bundle(x, z, 301, 9)), wob = (kit.noise(x * 0.11, z * 0.11, 9) - 0.5) * 1.2;
        for (const [back, y] of [[Z[ia] + 0.95, -BELOW], [Z[ia] + 0.95, H * sh(ia) * low - 0.3], [Z[ib] + 0.85, H * sh(ia) * low], [Z[ib] + 0.85, H * sh(ib) * low - 0.3], [Z[nl] + 0.9, H * sh(ib) * low], [Z[nl] + 0.9 + wob, blk], [Z[nl] + 5, blk + 0.8]]) bodyPos.push(x - nx * back, y, z - nz * back);
      }
      for (let i = 0; i < N - 1; i++) for (let k = 0; k < 6; k++) { const q = base + i * 7 + k, r = q + 7; bodyIdx.push(q, r, q + 1, r, r + 1, q + 1); }
    };
    body(cut(dense(facePts.slice(0, iFar + 1)), (d) => d >= W + 2.5), -1, (d) => Wl.heightAt(d));
    body(facePts.slice(iFar), -1, (d) => Wl.heightAt(d), FAR_RANKS);
    body(coast.slice(0, 5), 1, (d, x, z) => Wl.prow.height * (zOf(x, z) < 8 ? 1.03 / blockOf(x, z) : 1));
    body(coast.slice(4), 1, () => Wl.prow.height, FAR_RANKS);
    { // the cleft and the cave: a tunnel of rough rock outside the jambs, the hanging ends and the vault (a pointed arch, wider and higher than theirs)
      const shares = [-1, 0, 0.22, 0.42, 0.6, 0.75, 0.87, 0.95], ring = shares.length * 2 + 1, base = bodyPos.length / 3, Wb = W + 2.3;
      let n = 0;
      for (let s = Wl.s + 3.2; s <= P.length + 6.01; s += 2) {
        const a = path.at(Math.min(s, P.length), tmp), over = Math.max(0, s - P.length), cx = a.x + a.tx * over, cz = a.z + a.tz * over;
        const Hb = apexAt(s - Wl.s) + 3.2, c = (Hb * Hb - Wb * Wb) / (2 * Wb), R = Wb + c;
        const pt = (side, shr) => { const y = shr < 0 ? -BELOW : shr * Hb, yy = Math.max(0, y), aa = Math.sqrt(Math.max(0, R * R - yy * yy)) - c; bodyPos.push(cx + a.rx * side * aa, y, cz + a.rz * side * aa); };
        for (const shr of shares) pt(-1, shr);
        bodyPos.push(cx, Hb, cz);
        for (let i = shares.length - 1; i >= 0; i--) pt(1, shares[i]);
        n++;
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < ring - 1; k++) { const q = base + i * ring + k, r = q + ring; bodyIdx.push(q, r, q + 1, r, r + 1, q + 1); }
      // THE CAVE'S BED: rock under the keel from two metres outside the mouth on, four metres down and rising a little as the cave goes in. Without it
      // nothing lay beneath the middle of the cave, and near the boat (where the water is looked into) its own petrol body stood between the
      // walls' sunk columns as a pale strip from the bow to the far dark (sea_k6_035.png, over-exposed to show it): in a cave the water is the
      // dark thing, and the wake's last flecks are its only light.
      {
        const b0 = bodyPos.length / 3; let nb = 0;
        for (let s = Wl.s - 2; s <= P.length + 12.01; s += 2) {
          const a = path.at(Math.min(s, P.length), tmp), over = Math.max(0, s - P.length), cx = a.x + a.tx * over, cz = a.z + a.tz * over, y = -4.1 + 0.9 * smooth(Wl.s, P.length, s);
          for (const side of [-1, -0.34, 0.34, 1]) bodyPos.push(cx + a.rx * side * (Wb + 0.4), y - 0.5 * Math.abs(side) + 0.35 * (hash2(Math.round(s), side * 7, 3) - 0.5), cz + a.rz * side * (Wb + 0.4));
          nb++;
        }
        for (let i = 0; i < nb - 1; i++) for (let k = 0; k < 3; k++) { const q = b0 + i * 4 + k, r = q + 4; bodyIdx.push(q, r, q + 1, r, r + 1, q + 1); }
      }
      // and over the mouth, behind the last of its hanging ends: the cliff's own rock, from that arch to its blocks
      const zb = depthsOf(RANKS)[RANKS.length - 1] + 1.4, Hb = apexAt(zb) + 3.2, c = (Hb * Hb - Wb * Wb) / (2 * Wb), R = Wb + c, b2 = bodyPos.length / 3, top = Math.max(Hb + 1.5, Wl.heightAt(0) * 0.5);
      let m = 0;
      for (let i = 0; i <= 12; i++) { const d = (i / 6 - 1) * (Wb + 0.6), aa = Math.abs(d), [x, z] = at2(f, d, zb), y = aa >= Wb ? -BELOW : Math.sqrt(Math.max(0, R * R - (aa + c) * (aa + c))) - 0.6; bodyPos.push(x, y, z, x, top * (0.94 + 0.12 * hash2(Math.floor(i / 2), 3, 5)), z); m++; }
      for (let i = 0; i < m - 1; i++) { const q = b2 + i * 2; bodyIdx.push(q, q + 2, q + 1, q + 2, q + 3, q + 1); }
    }
    { // (all the lengths of body are one mesh: one draw call)
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(bodyPos, 3)); geo.setIndex(bodyIdx); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, kitRock({ color: C.basalt, rough: true, side: THREE.DoubleSide, flat: true })); m.name = 'the wall, the Prow, the coast and the cleft: body'; m.frustumCulled = false; ctx.add(m);      // (flat: a fold must not lend its top's sky to the face under it)
    }
    // the cave goes on in the next realm (the orchard in snow builds the other 25 m); from here its far end is the dark
    { const a = path.at(P.length), m = new THREE.Mesh(new THREE.PlaneGeometry(30, 34), sea.rock({ color: '#030308', rest: 0.5, pale: 0 })); m.position.set(a.x + a.tx * 7, 14, a.z + a.tz * 7); m.lookAt(a.x, 14, a.z); m.name = 'the dark at the cave\'s far end'; ctx.add(m); }
    // colliders: along the face and the coast; along both walls of the cleft and the cave (free water 16 m)
    walk(cut(dense(facePts), (d) => d >= Wl.cleft.half + 2.5), 5.2, (x, z, nx, nz) => addC(x - nx * 0.7, z - nz * 0.7, 3.5), -1);
    walk(dense(coast), 5.2, (x, z, nx, nz) => addC(x - nx * 0.7, z - nz * 0.7, 3.5), 1);
    for (let s = Wl.s - 1; s <= P.length + 3; s += 2.5) for (const side of [-1, 1]) { const a = path.at(Math.min(s, P.length), tmp), over = Math.max(0, s - P.length), d = side * (Wl.cleft.half + 1.5); addC(a.x + a.rx * d + a.tx * over, a.z + a.rz * d + a.tz * over, 1.5); }
    // surf along the foot of all of it
    outlines.push({ pts: cut(dense(facePts, 3), (d) => d >= Wl.cleft.half), closed: false, width: 4.4, inset: 0.4, flip: true });
    outlines.push({ pts: dense(coast, 3), closed: false, width: 4.4, inset: 0.4 });
    for (const side of [-1, 1]) { const pts = []; for (let s = Wl.s - 1; s <= P.length; s += 3) { const a = path.at(s, tmp); pts.push([a.x + a.rx * side * Wl.cleft.half, a.z + a.rz * side * Wl.cleft.half]); } outlines.push({ pts, closed: false, width: 3.2, inset: 0.3, flip: side < 0 }); }
    { const [x, z] = at2(f, Wl.prow.from - 5, -4); reefList.push({ v: 'b', x, z, turn: path.at(Wl.s).heading + 0.6, sx: 1, sz: 1, hidFrom: Wl.s }); soft(x, z, 5); }      // the reef awash at the Prow's foot (hidFrom: from inside the cleft the Prow itself stands before it)
  }

  // the brows, placed: front to the water, a little wider or narrower, stretched to the height of the brow there
  if (capSpec && rocks.brows.length) {
    const names = ['a', 'b'], sets = { a: [], b: [] };
    rocks.brows.forEach((b, i) => {
      const v = names[(i + (i >> 2)) % 2], c = capSpec.brow[v];
      sets[v].push({ position: [b.x, rocks.browAt, b.z], rotation: [0, Math.atan2(b.nx, b.nz), 0], scale: [0.96 + 0.1 * hash2(b.x, b.z, 7), (b.top - rocks.browAt) / c.top * (0.94 + 0.1 * hash2(b.x, b.z, 8)), 1], tint: ['#ffffff', '#ece8f6', '#f6f2ff', '#e4e0ee'][i % 4] });
    });
    let n = 0, tri = 0;
    for (const v of names) if (sets[v].length) { const m = await kit.models(`models/sea/brow_${v}.glb`, sets[v], roughOpts); m.group.name = `brow:${v}`; ctx.only(m.group, 'direct'); n += m.count; tri += m.triangles; }      // (in the mirror the body behind them stands for them)
    info.pieces.brow = { copies: n, triangles: tri };
  }

  // the cave's vault panels, placed
  if (hangSpec && rocks.vaults.length) {
    let n = 0, tri = 0;
    for (const v of ['a', 'b']) {
      const mine = rocks.vaults.filter((p) => p.v === v);
      if (!mine.length) continue;
      const m = await kit.models(`models/sea/cave_vault_${v}.glb`, mine, { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, width: 1.22, run: 3.2 }) }); m.group.name = `cave_vault:${v}`; zones.wall.shown.push(m.group); n += m.count; tri += m.triangles;
    }
    info.pieces.cave_vault = { copies: n, triangles: tri };
  }

  // ---------------------------------------------------------------------------------------------- far pipes
  // Three lone stacks in the open sea to the left: modelled (they are within 150 m of reachable water), far units only.
  // (As first grown each was one cone of steps round one heart, three slim spires like chessmen: sea_k6_031_crop.png. A sea stack is
  // what the weather has left of a headland: a main mass that stands sheer to the weather, lower shoulders in its lee where bundles have
  // gone, a foot awash on the lee side only; and no two alike. The page gives each its place and height, not its breadth.)
  for (const [i, fp] of P.farPipes.entries()) {
    // (their own random numbers; and the first growth is still run, into nothing, so that the module's shared sequence is spent exactly as it was:
    // every drum, clump and tuft placed after this stands where the earlier holders looked at it)
    grow([], fp.x, fp.z, 0, -1, fp.w / 2, fp.w / 2 * 0.9, fp.h, { seed: 40 + i, far: true });
    const rnd = ctx.rng(700 + i);
    const pch = 1.05, seed = 40 + i, Wd = fp.w * 1.32, H = fp.h, flip = i % 2 ? -1 : 1, sl = Math.hypot(0.9, 0.42);
    const e1 = [0.9 / sl, 0.42 / sl], e2 = [-0.42 / sl * flip, 0.9 / sl * flip];              // e1: from the weather to the lee (the swell's own way); e2: across it
    const k1 = hash2(i, 3, 71), k2 = hash2(i, 5, 71), k3 = hash2(i, 7, 71);
    // lobes: [along e1, along e2, radius along, radius across, share of the height]
    const lobes = [
      [-0.10 * Wd, 0, 0.33 * Wd, 0.29 * Wd, 1],
      [(0.24 + 0.1 * k1) * Wd, (0.08 + 0.1 * k2) * Wd, 0.27 * Wd, 0.24 * Wd, 0.52 + 0.2 * k1],
      [(0.02 + 0.1 * k3) * Wd, -(0.26 + 0.08 * k2) * Wd, 0.2 * Wd, 0.2 * Wd, 0.3 + 0.22 * k3],
      [(0.5 + 0.06 * k2) * Wd, -0.04 * Wd, 0.2 * Wd, 0.23 * Wd, 0.14 + 0.1 * k1],
    ];
    const n = Math.ceil(0.8 * Wd / pch);
    for (let j = -n; j <= n; j++) for (let q = -n; q <= n; q++) {
      const a = q * pch + (j & 1 ? pch / 2 : 0), b = j * pch * 0.866;
      let h = 0, edge = 0, rhoMain = 9;
      for (const [li, [la, lb, ra, rb, share]] of lobes.entries()) {
        const rho = Math.hypot((a - la) / ra, (b - lb) / rb);
        if (li === 0) rhoMain = rho;
        if (rho >= 1) continue;
        const hl = H * share * (rho < 0.55 ? 1 : 1 - 0.4 * smooth(0.55, 1, rho));
        if (hl > h) { h = hl; edge = rho; }
      }
      if (h <= 0) continue;
      const x = fp.x + e1[0] * a + e2[0] * b + (rnd() - 0.5) * 0.16, z = fp.z + e1[1] * a + e2[1] * b + (rnd() - 0.5) * 0.16;
      const bd = bundle(a, b, seed * 3 + 1, 3.0), n1 = kit.fbm(a * 0.3 + seed * 7.1, b * 0.3 - seed * 3.3, 2, seed);
      h *= 0.72 + 0.2 * bd * bd + 0.12 * n1;
      if (bundle(a, b, seed * 5 + 2, 4.4) < 0.13) h *= 0.66;                                // a bundle gone: a notch
      if (rhoMain < 0.36) h = Math.max(h, H * (0.9 + 0.1 * n1) * (1 - 0.2 * (rhoMain / 0.36) * (1 - bd)));      // the heart carries the height
      if (rnd() < 0.2) h -= rnd() * 0.08 * H;
      h = Math.max(0.3, Math.round(h / 0.7) * 0.7 + (rnd() - 0.5) * 0.3);
      if (edge > 0.82 && a > -0.05 * Wd) h = Math.min(h, 0.2 + (1 - (edge - 0.82) / 0.18) * 4.5 * (0.3 + 0.7 * rnd()));      // a skirt awash, on the lee side only: the weather side is sheer
      const dl = Math.hypot(a, b) || 1, lean = (2 + 4 * rnd()) * Math.PI / 180 * Math.min(1, dl / (0.4 * Wd));
      col(groups.farPipes, x, z, pch * (0.82 + 0.36 * rnd()), Math.min(H, h), lean, -(e1[0] * a + e2[0] * b) / dl, -(e1[1] * a + e2[1] * b) / dl, P.columns.below, false, tints[Math.floor(rnd() * tints.length)]);      // (its tint from its own numbers too: left to col it is drawn from the shared sequence)
    }
    outlines.push({ pts: ellipseOutline(fp.x + e1[0] * 0.14 * Wd, fp.z + e1[1] * 0.14 * Wd, e1[0], e1[1], 0.6 * Wd, 0.42 * Wd, 20), width: 4.5 });
  }

  // ---------------------------------------------------------------------------------------------- the east reef and the wreck's reef
  {
    const E = P.eastReef, f = frameAt(E.at[0]), [x, z] = at2(f, E.at[1]);
    reefList.push({ v: 'a', x, z, turn: path.at(E.at[0]).heading + Math.PI / 2, sx: E.along / 12.6, sz: E.across / 8.3 });      // (its long side lies along the route)
    steps(x - f.rx * 1.7, z - f.rz * 1.7, -f.rx, -f.rz, 0.85);
    for (let i = 0; i < E.stumps; i++) { const sx = x + (rnd() - 0.5) * E.across * 0.8, sz = z + (rnd() - 0.5) * E.along * 0.8; if (!inSteps(sx, sz)) { col(groups.near, sx, sz, 0.7 + 0.3 * rnd(), 0.4 + 1.6 * rnd()); addC(sx, sz, 0.75); (rocks.eastStumps || (rocks.eastStumps = [])).push(groups.near[groups.near.length - 1]); } }
    for (const k of [-0.5, 0.5]) soft(x + f.tx * k * 5, z + f.tz * k * 5, 5.4);                // shallows over the table; its stumps and its steps stop the boat
    addC(x - f.rx * 2.2, z - f.rz * 2.2, 2.2);
    outlines.push({ pts: ellipseOutline(x, z, f.tx, f.tz, E.along / 2 + 0.5, E.across / 2 + 0.5, 20), width: 3, inset: 2.5 });
  }

  // ---------------------------------------------------------------------------------------------- the column groups
  // Each group is drawn as: its outer columns (the unit), the columns behind them (the light unit), both in the direct
  // view only; and in the mirror a coarse copy (one fat column where seven stand: the mirror is a rough half-size
  // picture on a swell, and a stack is a dark mass in it). A group far from the boat can be shown as its coarse
  // copy in the direct view too (update, below).
  const made = {}, lod = {};
  const instanceGroup = (name, list, mat = rockMat, geo = unit) => {
    const mesh = kit.instances(geo, mat, list);
    mesh.name = `columns:${name}`; mesh.computeBoundingSphere(); mesh.frustumCulled = true;            // each group can be culled
    made[name] = mesh; info.columns[name] = list.length;
    return mesh;
  };
  const coarsen = (list, cell) => {
    const bins = new Map();
    for (const c of list) {
      if (c.tier || c.x === undefined) continue;
      const key = Math.round(c.x / cell) + ':' + Math.round(c.z / cell); let bn = bins.get(key);
      if (!bn) bins.set(key, bn = { n: 0, x: 0, z: 0, h: -1e9, rx: 0, rz: 0, w: 0, color: c.color });
      bn.n++; bn.x += c.x; bn.z += c.z; bn.h = Math.max(bn.h, c.h); bn.rx += c.rotation[0]; bn.rz += c.rotation[2]; bn.w = Math.max(bn.w, c.w);
    }
    return [...bins.values()].map((bn) => { const w = Math.max(bn.w, cell * 1.1); return { position: [bn.x / bn.n, -P.columns.below, bn.z / bn.n], scale: [w, bn.h + P.columns.below, w], rotation: [bn.rx / bn.n, 0, bn.rz / bn.n], color: bn.color }; });
  };
  const cells = { pipes: 2.0, gate: 2.4, wall: 3.6 };
  // From afar (the boat 90 m and more from a group, or the group seen only through the gate's arch) its outer columns
  // are drawn with the light unit as well: the same columns in the same places with the same breaks, without the ledge
  // of the shed drum (a hand's breadth: under two pixels there). By the boat's distance along:
  // (stage 6, engineering: 160 -> 200. The showstopper's view stood at 1,599,048 triangles, over the law's 1.5 million, and the wall's outer columns in
  // their full unit were 105,834 of them, seen through rain from 46 to 72 m. With the light unit until the boat is 32 m from the wall: 1,493,214. The same
  // view either way at s 186 and at s 199 (.shots/sea_crit_wall_fine_crop.png, _light_crop.png: 0.03 per cent of the picture differs by more than a tenth).)
  const FARWALL = +(params.get('farwall') || 200);
  const FAR = { pipes: (bs) => bs > 128, gate: (bs) => bs > 160, wall: (bs) => bs < FARWALL };      // (the gate from 64 m behind, the wall from 76 m ahead: its shed drums are under two pixels there)
  info.columns.farPipes = groups.farPipes.length; groups.wall.push(...groups.farPipes); groups.farPipes = [];      // (the three far pipes are drawn with the wall: fewer draw calls)
  for (const [name, list] of Object.entries(groups)) {
    if (!list.length || name === 'near') continue;
    const mat = name === 'gateInner' ? gateInnerMat : rockMat, outer = list.filter((c) => !c.inner), inner = list.filter((c) => c.inner), g = lod[name] = { fine: [], coarse: null };
    if (outer.length) g.fine.push(ctx.only(instanceGroup(name, outer, mat), 'direct'));
    if (outer.length && FAR[name] && !params.has('nofar')) { g.outer = g.fine[0]; g.light = ctx.only(instanceGroup(name + ' (from afar)', outer, mat, unitInner), 'direct'); g.light.visible = false; g.far = false; }
    if (inner.length) g.fine.push(ctx.only(instanceGroup(name + ' (behind)', inner, mat, unitInner), 'direct'));
    if (cells[name]) { const fat = coarsen(list, cells[name]); if (fat.length) g.coarse = ctx.only(instanceGroup(name + ' (coarse)', fat, mat, params.has('finemirror') ? unit : unitInner), 'mirror'); }      // (the light unit: no ledge of a shed drum is seen in a rough half-size mirror on a swell; 31 triangles a column less. &finemirror=1 to compare)
    else if (name === 'cleft') zones.wall.shown.push(...g.fine);                           // (the cleft's leaning tiers: seen only from the tower on)
    else for (const m of g.fine) m.layers.set(0);                                         // (a small group with no coarse copy is in the mirror as it is)
    info.columns[name] = list.length;
  }
  rocks.groups = made; rocks.innerUniform = innerU;

  // ---------------------------------------------------------------------------------------------- hanging ends
  // `hang` a to d (source-art/models/sea/hang.py): clusters of broken column ends under the gate's vault, each the
  // variant nearest its length, turned, widened and lengthened its own way. They take the gate's inner light.
  rocks.hang = hangList;                                                                  // [{ x, y, z, len }]: y is where each joins the vault; its tip is len below (drips fall from tips)
  if (hangSpec) {
    const names = Object.keys(hangSpec.hang), sets = {};
    for (const h of hangList) {
      const v = names.reduce((best, n) => (Math.abs(hangSpec.hang[n].length - h.len) < Math.abs(hangSpec.hang[best].length - h.len) ? n : best), names[0]);
      (sets[v] || (sets[v] = [])).push({ position: [h.x, h.y, h.z], rotation: [0, h.turn, 0], scale: [h.w, Math.min(1.5, Math.max(0.66, h.len / hangSpec.hang[v].length)), h.w], tint: relTint(h.color) });
    }
    let n = 0, tri = 0;
    // (they hang among the 788 ends of the heroes' vault and wear its light when it is there: shared.heroesB.vaultRock keeps the rock's wash,
    // which is made for faces that stand in the sea, off a roof; vaultLight is the night at the two mouths and the surge thrown up from below.
    // The kit's paint is carried into that light as `hbPaint`. &novaultlight=1, or no heroes_b: the gate's inner wash, as before.)
    const hb = shared.heroesB, hangExt = hb && hb.vaultLight && hb.vaultRock && !params.has('novaultlight')
      ? [sea.extend({ uniform: hb.vaultRock }), kitExt({ uv: true, width: 0.8 }), { fragmentPars: 'vec3 hbPaint = vec3(1.0);', light: params.has('nopaint') ? '' : 'hbPaint = 0.6 * sqrt(clamp(albedo / uKitRef, 0.03, 12.0));' }, hb.vaultLight]      // (0.6: every face of these counts as within the water's reach; the vault's own ends keep their recesses dark)
      : kitExtend({ uv: true, width: 0.8, uniform: innerU });
    for (const v of Object.keys(sets)) { const m = await kit.models(`models/sea/hang_${v}.glb`, sets[v], { color: kitTint, brush: 0.6, extend: hangExt }); m.group.name = `hang:${v}`; ctx.only(m.group, 'direct'); zones.gate.shown.push(m.group); n += m.count; tri += m.triangles; }
    info.pieces.hang = { copies: n, triangles: tri };
    // THE CLEFT'S MOUTH wears the same pieces: pendants of two or three broken ends under four in ten of the lower ends of its
    // orders (which are plain prisms cut to the arch: from under them the roof was a ceiling of boxes), a third larger than
    // under the gate: the wall's columns are 1.2 to 1.6 m across. They take the cave's light with the rest of the kit's rock.
    if (rocks.mouth && rocks.mouth.ends.length) {
      const sets2 = {}, wet = [C.basalt, '#1a1730', '#141126', C.basaltWet, '#19172c'];
      for (const e of rocks.mouth.ends) {
        if (hash2(e.x, e.z, 61) > 0.4) continue;
        const len = lerp(0.6, 3.3, Math.pow(hash2(e.x, e.z, 62), 1.5)), v = names.reduce((best, nm) => (Math.abs(hangSpec.hang[nm].length - len) < Math.abs(hangSpec.hang[best].length - len) ? nm : best), names[0]);
        const k = 1.2 + 0.45 * hash2(e.x, e.z, 63);
        (sets2[v] || (sets2[v] = [])).push({ position: [e.x, e.y + 0.4, e.z], rotation: [0, hash2(e.x, e.z, 64) * Math.PI * 2, 0], scale: [k, 1.15 * Math.min(1.5, Math.max(0.66, len / hangSpec.hang[v].length)), k], tint: relTint(wet[Math.floor(hash2(e.x, e.z, 65) * wet.length) % wet.length]) });
      }
      let n2 = 0, tri2 = 0;
      for (const v of Object.keys(sets2)) { const m = await kit.models(`models/sea/hang_${v}.glb`, sets2[v], { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, width: 1.1, run: 3.2 }) }).catch(() => null); if (m) { m.group.name = `hang:mouth:${v}`; ctx.only(m.group, 'direct'); zones.wall.shown.push(m.group); n2 += m.count; tri2 += m.triangles; } }
      info.pieces.hangMouth = { copies: n2, triangles: tri2 };
    }
  } else if (hangList.length) instanceGroup('hang', hangList.map((h) => ({ position: [h.x, h.y, h.z], scale: [0.6 * h.w, h.len + 0.5, 0.6 * h.w], rotation: [Math.PI, 0, 0], color: h.color })), gateInnerMat);

  // ---------------------------------------------------------------------------------------------- near columns
  // `column_near` a to e (source-art/models/sea/column_near.py): the column as it is seen from the boat, wherever a
  // column stands within 14 m of the channel on its side of a rock. Each copy is one whole column: turned its own way,
  // leaning as its stack leans, scaled whole to its width, sunk or drawn out to its height (the kit's rock, `tele`),
  // tinted. One draw call a variant and zone; out of the mirror, where the far unit stands in for it (the mirror is a
  // rough half-size picture on a swell: a joint is not seen in it).
  const near = rocks.near = { models: [], count: 0, triangles: 0 };
  {
    const spec = params.has('nonear') ? null : await json('assets/models/sea/column_near.json');
    const list = groups.near;
    if (spec) {
      const names = Object.keys(spec.variants), H0 = spec.top, sets = {};
      for (const c of list) {
        const v = names[Math.floor(hash2(c.x, c.z, 1) * names.length) % names.length], zone = c.zone = zoneAt(c.x, c.z);
        c.pool = v === 'a' || v === 'd';                                                    // (the dished variants hold water: rocks.stumpPools, below)
        const u = c.w / spec.across, top = H0 * u, tall = c.h >= top, st = tall ? (c.h - top) / u : 0, sink = tall ? 0 : top - c.h;
        const t = hash2(c.x, c.z, 2) * Math.PI * 2, ax = c.rotation[0], az = c.rotation[2];
        const set = sets[zone + ':' + v] || (sets[zone + ':' + v] = { v, zone, list: [], box: new THREE.Box3() });
        // (near the boat no column is a different stone: the far units' palest chip, the page's lichen, is three times basalt's
        // value, and a whole near column in it was a block of marble at a stack's foot: sea_k5_003.png. Lichen is in the painting, as patches.)
        set.list.push({ position: [c.x + az * sink, -sink, c.z - ax * sink], rotation: [ax * Math.cos(t) - az * Math.sin(t), t, ax * Math.sin(t) + az * Math.cos(t)], scale: [u, u * (1 + st / 64), u], tint: relTint(c.color === C.lichen ? '#1f1c35' : c.color === '#211e38' ? '#1c1931' : c.color) });
        set.box.expandByPoint(new THREE.Vector3(c.x - 1.5, -BELOW, c.z - 1.5)).expandByPoint(new THREE.Vector3(c.x + 1.5, c.h + 1, c.z + 1.5));
      }
      for (const set of Object.values(sets)) {
        const m = await kit.models(`models/sea/column_near_${set.v}.glb`, set.list, { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, pools: true, tele: { ...spec.variants[set.v], top: H0 }, width: spec.across }) });      // (pools: the dished ones hold water, as the steps' tops do)
        for (const mesh of m.meshes) { mesh.boundingSphere = set.box.getBoundingSphere(new THREE.Sphere()); mesh.frustumCulled = true; }
        m.group.name = `near:${set.zone}:${set.v}`; ctx.only(m.group, 'direct');
        near.models.push(m); near.count += m.count; near.triangles += m.triangles;
        zones[set.zone].shown.push(m.group);
      }
      // the far unit stands in for each of them in the mirror, and in the direct view too while its zone is far from the boat (update, below)
      for (const zone of Object.keys(zones)) twinLists[zone].push(...list.filter((c) => c.zone === zone));
      info.columns.near = list.length; info.pieces.column_near = { copies: near.count, triangles: near.triangles, draws: near.models.length };
    } else if (list.length) instanceGroup('near', list);
  }

  // ---------------------------------------------------------------------------------------------- steps and their pools
  // (source-art/models/sea/steps.py). Each copy: turned so that its front is the water, a little larger or smaller,
  // tinted. The pools of its dished tops are in the same mesh (the kit's rock lights them: `pools`); where they are
  // (for rain rings, drips and whatever drinks) is in shared.rocks.pools: [{ x, y, z, r }].
  rocks.pools = []; rocks.steps = stepList;
  {
    const spec = params.has('nosteps') ? null : await json('assets/models/sea/steps.json');
    if (spec) {
      const names = Object.keys(spec.variants), stepTints = ['#ffffff', '#f2eefc', '#e6e2f2', '#fbf6ff', '#dedaea'];
      let copies = 0, triangles = 0;
      for (const st of stepList) st.zone = zoneAt(st.x, st.z);
      for (const zone of Object.keys(zones)) for (const [vi, name] of names.entries()) {
        const mine = stepList.filter((s) => s.v % names.length === vi && s.zone === zone);
        if (!mine.length) continue;
        const places = mine.map((s, i) => ({ position: [s.x, 0, s.z], rotation: [0, Math.atan2(s.ox, s.oz), 0], scale: s.scale * (0.96 + 0.08 * hash2(s.x, s.z, 3)), tint: stepTints[(i + vi) % stepTints.length] }));
        const m = await kit.models(`models/sea/steps_${name}.glb`, places, { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, pools: true, width: 0.78, pale: LOW }) });
        m.group.name = `steps:${zone}:${name}`; ctx.only(m.group, 'direct'); zones[zone].shown.push(m.group); supports.push(m.group);
        copies += m.count; triangles += m.triangles;
        for (const [i, s] of mine.entries()) {
          const k = places[i].scale, c = Math.cos(places[i].rotation[1]), sn = Math.sin(places[i].rotation[1]);
          for (const [px, py, pz, pr] of spec.variants[name].pools) rocks.pools.push({ x: s.x + (px * c + pz * sn) * k, y: py * k, z: s.z + (-px * sn + pz * c) * k, r: pr * k });
          for (const a of [-1.2, 0, 1.2]) feet.push([s.x - s.oz * a * s.scale + s.ox * 2.4 * s.scale, s.z + s.ox * a * s.scale + s.oz * 2.4 * s.scale, s.ox, s.oz]);
        }
      }
      // in the mirror (and from afar): far units along each patch's back, so that the foot is never bare
      for (const st of stepList) for (const a of [-1.4, -0.5, 0.4, 1.3]) for (const b of [0.4, 1.3]) col(twinLists[st.zone], st.x - st.oz * a * st.scale + st.ox * b * st.scale, st.z + st.ox * a * st.scale + st.oz * b * st.scale, 0.78 * st.scale, Math.max(0.1, 1.5 - b * 0.9 + (hash2(st.x + a, st.z + b, 5) - 0.5) * 0.5));
      info.pieces.steps = { copies, triangles, pools: rocks.pools.length };
    } else {
      // (no models: the layout's stand-in, far units stepping down)
      const list = [];
      for (const s of stepList) { const p = 0.8 * s.scale; for (let j = 0; j * p * 0.866 < 3 * s.scale; j++) for (let i = -2; i <= 2; i++) { const u = i * p + (j & 1 ? p / 2 : 0), v = j * p * 0.866, k = v / (3 * s.scale); if (rnd() < 0.12 + 0.3 * k) continue; col(list, s.x - s.oz * u + s.ox * v, s.z + s.ox * u + s.oz * v, p * (0.86 + 0.3 * rnd()), Math.max(-0.12, lerp(1.7, -0.1, k) * (0.5 + 0.7 * rnd()))); } }
      if (list.length) instanceGroup('steps', list);
      info.pieces.steps = stepList.length;
    }
  }

  // the far units that stand for a zone's Blender columns and steps in the mirror, and in the direct view from afar: one mesh a zone
  for (const zone of Object.keys(zones)) if (twinLists[zone].length) zones[zone].twins.push(ctx.only(instanceGroup(`${zone}: far units for its close band`, twinLists[zone]), 'mirror'));      // (the fine unit: from afar they stand in the direct view too, and at postcard 4 the gate's tall jamb columns are among them: as light units their shed drums were missed at 50 m)

  // ---------------------------------------------------------------------------------------------- small kit pieces
  // `reef` a to d (source-art/models/sea/reef.py): rock cut down to the sea's own level. Seven copies in six places: the gate's
  // two ends, the east reef, the Prow's foot (above: b, b, a, b); the reef that joins the skerry to the wall (b); and the
  // wreck's reef, which is two tables made for her, c on her lee side and d to weather, laid in her own frame with her gully
  // between them (as first laid it was four plates across her keel, their tops through her own bed of column tops). Layout
  // left stand-ins for the last two in heroes.js (taken out below once the rock lies).
  // A reef is terraces: a table in the wash, a spine every trough bares, a knob of stumps that never goes under, a ragged rim
  // going down in steps. What the models say of themselves (reef.json) is used here: the pools of their dished tops (lit by
  // each swell that reaches them: the kit's rock, `pools`; shared.rocks.reefPools for the cast), their knobs (a collider and a
  // ring of surf each, where the boat can come), and holdfasts for wrack at the rims that stand in the wash (below, "wrack").
  // Where their rock stands (the boat's colliders, and what the cast's kelp and wake root on) is read from the models
  // themselves: "THE REEF'S GROUND", below. How it was finished and measured: docs/build/sea/6-reefs.md.
  const REEF = 'reef_try';                                                                 // (the files as they are named on disk: reef_try_a..d.glb and reef_try.json. The first plates, reef_a.glb and reef_b.glb, are no longer read)
  const reefTufts = [], reefGeo = {}, reefPart = [];
  rocks.reefPools = []; rocks.reefKnobs = [];
  {
    const spec = await json(`assets/models/sea/${REEF}.json`), V = (spec && spec.variants) || {};
    const Wk = P.wreck, wa = kit.at(Wk.stern[0], Wk.stern[1]), wb = kit.at(Wk.stem[0], Wk.stem[1]), wturn = Math.atan2(-(wb.z - wa.z), wb.x - wa.x);
    for (const v of ['c', 'd']) reefList.push({ v, x: (wa.x + wb.x) / 2, z: (wa.z + wb.z) / 2, turn: wturn, sx: 1, sz: 1, wreck: true });      // (the wreck's own frame: +X from her stern to her stem, as heroes_b.js lays her)
    const p = kit.at(233, 15); reefList.push({ v: 'b', x: p.x, z: p.z, turn: path.at(233).heading + 1.2, sx: 1.12, sz: 1.14 });
    let n = 0, tri = 0;
    for (const r of reefList) r.zone = zoneAt(r.x, r.z);
    for (const zone of Object.keys(zones)) for (const v of ['a', 'b', 'c', 'd']) {
      const these = reefList.filter((r) => r.v === v && r.zone === zone).sort((a, b) => (a.hidFrom || 1e9) - (b.hidFrom || 1e9)).reverse();      // (a copy that goes out of sight at some s comes last: it is dropped by drawing one copy fewer)
      const mine = these.map((r, i) => ({ position: [r.x, 0, r.z], rotation: [0, r.turn, 0], scale: [r.sx, 1, r.sz], tint: ['#ffffff', '#ece8f6', '#f6f2ff', '#e2deee'][i % 4] }));
      if (!mine.length) continue;
      const m = await kit.models(`models/sea/${REEF}_${v}.glb`, mine, { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, pools: true, width: 1.02, pale: LOW }) }).catch(() => null);
      // (its name: the cast's kelp and wake read rock as the BOX of every copy whose group is called near:, steps:, reef:, drums: or columns:
      // (cast_edge.js). The box of a table 28 m long is not its rock: a reef's rock is given to them cell by cell, as `reef:ground`, below.)
      if (!m) continue;
      m.group.name = `reefrock:${zone}:${v}`; ctx.only(m.group, 'direct'); supports.push(m.group); n += m.count; tri += m.triangles; if (m.meshes[0]) reefGeo[v] = m.meshes[0].geometry;
      // (the Prow's foot shares this mesh with the reef that joins the skerry to the wall, and from s 236, in the cleft, it is behind the Prow: 2,208 triangles
      // twice a frame in the area's heaviest views, the ones that look back from the mouth. From there one copy is drawn: update, below.)
      { const k = these.findIndex((r) => r.hidFrom); if (k > 0) reefPart.push({ meshes: m.meshes, full: these.length, kept: k, s: these[k].hidFrom }); }
      // (a reef goes with its zone, like all the close band; &reefkeep=1 keeps the sound's drawn to the end of the area, to compare: see "from afar", below)
      if (zone === 'sound' && params.get('reefkeep') === '1') cellShown.push({ o: m.group, s0: REACH.sound[0] + CELL_REACH, s1: 1e9 }); else zones[zone].shown.push(m.group);
    }
    if (n) { removeStandIn(ctx, 'reef x4 (wreck reef)'); removeStandIn(ctx, 'reef (skerry to wall)'); }
    // THE REEF'S GROUND. Where a reef's rock stands is in its model and nowhere else (a ragged table with bays, tongues and outliers): each
    // variant's highest top in every square metre of its own frame, read once from its triangles. Two things are made of it, per copy:
    //   - the boat's colliders: a circle on every cell at the rim of the rock that stands in the wash or over it (a top higher than HARD:
    //     bared by a trough), reaching 1.5 m beyond the cell (the boat's circle is 0.95 m and its bow stands 2.4 m ahead of its middle: with
    //     a metre and a half of water kept, a bow steered straight at a face stops at it). For the boat only (ctx.addCollider): the cast plans
    //     the ways of its animals by the kit's own list, which has the knobs (below) as it had;
    //   - `reef:ground`: one box a cell, from the cell's top down into the dark, in an instanced mesh that is never drawn. It is what the
    //     cast's kelp and wake read as this reef's rock (walls to root on where rock stands through the troughs, ledges where it ends under them).
    const HARD = -0.38, KEEP = 1.5, ground = [];
    const readGround = (geo) => {
      const pos = geo.attributes.position, ix = geo.index, cnt = ix ? ix.count : pos.count, cells = new Map();
      const put = (x, y, z) => { const k = Math.floor(x) + ',' + Math.floor(z), t = cells.get(k); if (t === undefined || y > t) cells.set(k, y); };
      for (let i = 0; i < cnt; i += 3) {
        const a = ix ? ix.getX(i) : i, b = ix ? ix.getX(i + 1) : i + 1, c = ix ? ix.getX(i + 2) : i + 2;
        const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a), bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b), cx = pos.getX(c), cy = pos.getY(c), cz = pos.getZ(c);
        put(ax, ay, az); put(bx, by, bz); put(cx, cy, cz);
        if (Math.max(ay, by, cy) - Math.min(ay, by, cy) < 0.3) {      // a face of a top: its middle and its edges too (a sunk top is one polygon a metre across)
          put((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3); put((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); put((bx + cx) / 2, (by + cy) / 2, (bz + cz) / 2); put((cx + ax) / 2, (cy + ay) / 2, (cz + az) / 2);
        }
      }
      return cells;
    };
    const groundOf = {}; for (const v of Object.keys(reefGeo)) groundOf[v] = readGround(reefGeo[v]);
    // HER REEF FROM AFAR. The sound's zone goes out of reach at s 222 with the wreck 45 m astern, and for a rider looking back her terraces went from under
    // her in one frame, a dark band at her foot (.shots/sea_reefs_pop2_far_compare.png; the first plates lay awash and were not missed). Kept drawn, her two
    // tables are 20,000 triangles in every view that looks back from the tower's foot and the cleft, and those stand at 1.5 to 1.6 million already
    // (docs/build/sea/6-reefs.md). So from s 222 on the lee table, the one between her and the route, is two low six-sided slabs (36 triangles in all, one
    // mesh) where its rock stands over still water: each as large as the half of the table it stands for, and as high. (Two fat copies of the far column
    // unit were tried first: its cap grows with its width, and they stood before her like two barges.)
    {
      const r = reefList.find((q) => q.wreck && q.v === 'c'), cells = r && groundOf.c;
      if (cells && params.get('reefkeep') !== '1') {
        const c = Math.cos(r.turn), sn = Math.sin(r.turn), up = [...cells].map(([key, top]) => [...key.split(',').map(Number), top]).filter((q) => q[2] > -0.06).sort((a, b) => a[0] - b[0]);
        const pos = [], nor = [], tri = (p0, p1, p2, n) => { pos.push(...p0, ...p1, ...p2); nor.push(...n, ...n, ...n); }, slabs = [];
        for (const part of [up.slice(0, up.length >> 1), up.slice(up.length >> 1)]) {
          if (!part.length) continue;
          let mx = 0, mz = 0, mt = 0; for (const [i, j, top] of part) { mx += i + 0.5; mz += j + 0.5; mt += top; }
          mx /= part.length; mz /= part.length; mt /= part.length;
          const X = r.x + mx * c + mz * sn, Z = r.z - mx * sn + mz * c, T = mt + 0.05, R = 1.07 * Math.sqrt(part.length) / 2 / 0.866;      // (a hexagon of the part's own area)
          slabs.push([+(2 * R * 0.866).toFixed(2), +T.toFixed(2)]);
          for (let k = 0; k < 6; k++) {
            const a0 = r.turn + k * Math.PI / 3, a1 = a0 + Math.PI / 3, am = (a0 + a1) / 2, p0 = [X + Math.cos(a0) * R, T, Z + Math.sin(a0) * R], p1 = [X + Math.cos(a1) * R, T, Z + Math.sin(a1) * R];
            tri([X, T, Z], p1, p0, [0, 1, 0]);
            tri(p0, p1, [p1[0], -3, p1[2]], [Math.cos(am), 0, Math.sin(am)]); tri(p0, [p1[0], -3, p1[2]], [p0[0], -3, p0[2]], [Math.cos(am), 0, Math.sin(am)]);
          }
        }
        if (pos.length) {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
          const far = new THREE.Mesh(g, sea.rock({ color: C.basaltWet, rest: 0.5, pale: LOW })); far.name = 'the wreck\'s reef from afar (two slabs)';
          ctx.add(far); ctx.only(far, 'direct'); cellShown.push({ o: far, s0: REACH.sound[1] + CELL_REACH, s1: 1e9 }); info.pieces.reefFar = slabs;
        }
      }
    }
    let reefCircles = 0;
    for (const r of reefList) {
      const cells = groundOf[r.v]; if (!cells) continue;
      const c = Math.cos(r.turn), sn = Math.sin(r.turn), k = Math.max(r.sx, r.sz);
      const at = (px, pz) => [r.x + px * r.sx * c + pz * r.sz * sn, r.z - px * r.sx * sn + pz * r.sz * c];
      const hard = (i, j) => { const t = cells.get(i + ',' + j); return t !== undefined && t > HARD; };
      for (const [key, top] of cells) {
        const [i, j] = key.split(',').map(Number), [x, z] = at(i + 0.5, j + 0.5);
        ground.push({ x, z, top, turn: r.turn, sx: r.sx, sz: r.sz, hard: top > HARD, v: r.v });
        if (top <= HARD) continue;
        let rim = false; for (let di = -1; di <= 1 && !rim; di++) for (let dj = -1; dj <= 1; dj++) if (!hard(i + di, j + dj)) { rim = true; break; }
        if (!rim) continue;                                                                 // (inside the table: the cells round it hold the boat off)
        const rr = 0.71 * k + KEEP;
        if (colliders.some((q) => Math.hypot(q.x - x, q.z - z) + rr <= q.r)) continue;      // (within a circle the kit has laid already)
        ctx.addCollider({ x, z, r: rr }); reefCircles++;
      }
    }
    if (ground.length) {
      const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, -0.5, 0);
      const boxes = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ visible: false }), ground.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
      ground.forEach((cl, i) => { M.compose(pv.set(cl.x, cl.top, cl.z), q.setFromEuler(e.set(0, cl.turn, 0)), sv.set(cl.sx, cl.top + BELOW, cl.sz)); boxes.setMatrixAt(i, M); });
      boxes.instanceMatrix.needsUpdate = true; boxes.name = 'reef:ground (never drawn: where the reefs\' rock stands, a box a square metre, for the cast)'; boxes.visible = false; boxes.frustumCulled = false; ctx.add(boxes);
    }
    rocks.reefGround = ground;                                                             // [{ x, z, top, hard }]: a reef's rock by the square metre (hard: it stands in the wash or over it, and holds the boat off)
    // a place the model names (its own x, z as the ride sees them), where this copy lies
    for (const r of reefList) {
      const f = V[r.v]; if (!f) continue;
      const c = Math.cos(r.turn), sn = Math.sin(r.turn);
      const at = (px, pz) => [r.x + px * r.sx * c + pz * r.sz * sn, r.z - px * r.sx * sn + pz * r.sz * c];
      for (const [px, py, pz, pr] of f.pools || []) { const [x, z] = at(px, pz); rocks.reefPools.push({ x, y: py, z, r: pr * Math.min(r.sx, r.sz) }); }
      for (const [px, py, pz, ox, oz] of f.tufts || []) { const [x, z] = at(px, pz); reefTufts.push({ x, y: py, z, ox: ox * c + oz * sn, oz: -ox * sn + oz * c, len: 0.3 + 0.4 * hash2(x, z, 41) }); }
      for (const [px, pz, pr, top] of f.knobs || []) {
        const [x, z] = at(px, pz), kr = pr * Math.max(r.sx, r.sz);
        rocks.reefKnobs.push({ x, z, r: kr, top });
        // (ringed with light as each swell leaves it, like a fallen drum: with it a knob stands in a pool of light at each crest, without it the rock is lit and the
        // water at its foot is dark: .shots/sea_reefs_rings_compare.png. Six points: a knob is a bundle of six-sided columns, and a ring is 6 triangles a point,
        // drawn from everywhere in the area. Not at the gate's two ends, which no boat comes within 40 m of: the piers' own surf reaches them. &knobrings=0: none.)
        if (r.zone !== 'gate' && params.get('knobrings') !== '0') outlines.push({ pts: ellipseOutline(x, z, 1, 0, kr, kr * 0.85, 6), width: 0.9, inset: 0.2 });
        // (stumps a boat could ride into: a circle of their own, unless they stand inside a circle already; her reef's are the layout's, six of 6.4 m in heroes.js)
        if (!r.wreck && !colliders.some((q) => Math.hypot(q.x - x, q.z - z) + kr < q.r)) addC(x, z, kr);
      }
    }
    info.pieces.reef = { copies: n, triangles: tri, pools: rocks.reefPools.length, knobs: rocks.reefKnobs.length, tufts: reefTufts.length, ground: ground.length, circles: reefCircles };
    rocks.reefs = reefList;
  }

  // `drums` a to d (source-art/models/sea/drums.py): fallen drums lying awash at the close-band feet, half a metre to
  // a metre and a half out, each turned its own way; the water round each is shallows (the boat is eased off it), and
  // each has its own ring of surf light, so that it is ringed with light as the swell uncovers it.
  {
    const names = ['a', 'b', 'c', 'd'], sets = { a: [], b: [], c: [], d: [] }, placed = [];
    for (let i = 0, tries = 0; placed.length < 40 && feet.length && tries < 400; tries++) {
      const ft = feet[Math.floor(rnd() * feet.length)], out = 0.5 + 1.0 * rnd(), x = ft[0] + ft[2] * out + (rnd() - 0.5) * 0.8, z = ft[1] + ft[3] * out + (rnd() - 0.5) * 0.8;
      if (inSteps(x, z) || placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.6)) continue;
      const v = names[[0, 0, 1, 2, 0, 3, 1, 0][i % 8]], k = 0.85 + 0.4 * rnd(), key = zoneAt(x, z) + ':' + v; i++;
      placed.push([x, z]);
      (sets[key] || (sets[key] = [])).push({ position: [x, -0.1 + 0.16 * rnd(), z], rotation: [(rnd() - 0.5) * 0.08, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.08], scale: k, tint: relTint(tint()) });
      const r = (v === 'c' ? 1.5 : v === 'a' ? 0.8 : 1.1) * k;                                // (the drum itself; its bed of column tops lies under the troughs round it)
      soft(x, z, r + 0.7);
      outlines.push({ pts: ellipseOutline(x, z, 1, 0, r, r * 0.8, 8), width: 0.9, inset: 0.2 });      // (eight points, not ten: the forty rings pay for the reefs' seven, so that the surf is no heavier than it was: 2,172 triangles for these 47 against 2,400 for the 40)
    }
    let n = 0, tri = 0;
    for (const key of Object.keys(sets)) { if (!sets[key].length) continue; const [zone, v] = key.split(':'), m = await kit.models(`models/sea/drums_${v}.glb`, sets[key], { color: kitTint, brush: 0.6, extend: kitExtend({ uv: true, width: 0.8, pale: LOW }) }).catch(() => null); if (m) { m.group.name = `drums:${key}`; ctx.only(m.group, 'direct'); zones[zone].shown.push(m.group); supports.push(m.group); n += m.count; tri += m.triangles; } }
    info.pieces.drums = { copies: n, triangles: tri }; rocks.drums = placed;
  }

  // (the kept lamp warms its doorway and little else: on the kit's small pale things, a fifth of its light beyond a pool of 1.6 m; the engine's lamp lights all within its reach alike)
  const lampPool = { light: /* glsl */`{ vec3 kLampL = pointLight(uLampPos, uLampColor, uLampRadius, N); float kLampD = distance(vWPos, uLampPos); c -= albedo * kLampL * (0.8 * (1.0 - exp(-kLampD * kLampD / 2.56))); }` };
  // The tide zone on the monument's rock (the skerry's channel edge under the tower, the tower's own foot: the page's
  // "weed and barnacle to 2.2 m"). The models say where their rock is: each is looked at from the water, level, and
  // where a look lands a clump or a tuft of weed may grow. [{ x, y, z, nx, ny, nz }]
  const heroSpots = [];
  {
    const sk = shared.heroes && shared.heroes.skerry, tw = shared.tower, targets = [sk && sk.model && sk.model.group, tw && tw.model && tw.model.group].filter(Boolean);
    if (targets.length && !params.has('noherotide')) {
      const ray = new THREE.Raycaster(), o = new THREE.Vector3(), dir = new THREE.Vector3(), nrm = new THREE.Vector3();
      const probe = (x, y, z, dx, dz, far) => {
        ray.set(o.set(x, y, z), dir.set(dx, 0, dz).normalize()); ray.far = far;
        const hit = ray.intersectObjects(targets, true)[0];
        if (!hit || !hit.face) return;
        nrm.copy(hit.face.normal).transformDirection(hit.object.matrixWorld); if (nrm.dot(dir) > 0) nrm.negate();
        heroSpots.push({ x: hit.point.x, y: hit.point.y, z: hit.point.z, nx: nrm.x, ny: nrm.y, nz: nrm.z });
      };
      // the skerry's channel edge, from its up-route corner to the slip: every half metre, two looks
      const O = P.skerry.outline.slice(0, 6);
      for (let i = 0; i < O.length - 1; i++) {
        const [s0, d0] = O[i], [s1, d1] = O[i + 1], n = Math.ceil(Math.hypot(s1 - s0, d1 - d0) / 0.5);
        for (let k = 0; k < n; k++) for (let j = 0; j < 2; j++) {
          const t = (k + rnd()) / n, ss = lerp(s0, s1, t), fr = frameAt(ss), [x, z] = at2(fr, lerp(d0, d1, t) - 3);
          probe(x, j ? -0.25 + 0.9 * rnd() : 0.05 + 1.25 * rnd() * rnd(), z, fr.rx, fr.rz, 7);
        }
      }
      // the tower's foot, on the sides the boat sees: from 8 m out toward its axis, between the ledge and 2.2 m
      const ax = kit.at(P.tower.at[0], P.tower.at[1]), fr = frameAt(P.tower.at[0]);
      for (let a = -1.9; a <= 1.9; a += 0.075) { const ox = -fr.rx * Math.cos(a) + fr.tx * Math.sin(a), oz = -fr.rz * Math.cos(a) + fr.tz * Math.sin(a); probe(ax.x + ox * 8, 0.95 + 1.25 * Math.pow(rnd(), 1.5), ax.z + oz * 8, -ox, -oz, 8); }
    }
    info.pieces.heroSpots = heroSpots.length;
  }
  // `clump` a, b (source-art/models/sea/clump.py): barnacle and mussel clumps, 1,200, in the tide zone of the close
  // band only: on the channel-side faces of the near columns (each laid against its column, growing out of it) and on
  // the rims of the low dished tops of the steps. The palest things on the rock; the crust between them is painted.
  {
    const clumpPaint = new THREE.Color('#c9cde0'), bar = new THREE.Color(C.barnacle), clumpTint = new THREE.Color(bar.r / clumpPaint.r, bar.g / clumpPaint.g, bar.b / clumpPaint.b);
    const sets = {}, up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), q = new THREE.Quaternion(), spin = new THREE.Quaternion(), e = new THREE.Euler(), tm = {};
    const lay = (v, x, y, z, dx, dy, dz, k) => {
      dir.set(dx, dy, dz).normalize(); q.setFromUnitVectors(up, dir).multiply(spin.setFromAxisAngle(up, rnd() * Math.PI * 2)); e.setFromQuaternion(q, 'YXZ');
      const key = cellAt(x, z) + ':' + v; (sets[key] || (sets[key] = [])).push({ position: [x, y, z], rotation: [e.x, e.y, e.z], scale: k, tint: (v === 'b' ? ['#8a8a9c', '#77778c', '#9c9cae', '#6c6c84'] : ['#ffffff', '#e9e9f4', '#f4f1ff', '#dcdcec'])[Math.floor(rnd() * 4)] });      // (mussels are blue-black: brought down with the barnacles' grey alone they were bunches of lilac beads in the rider's lantern: sea_k7_003.png)
    };
    const cols = groups.near.filter((c) => c.h > 0.25), per = Math.max(1, Math.round((P.clumps - 180) / Math.max(1, cols.length)));
    for (const c of cols) {
      const l = path.locate(c.x, c.z, null, tm), a = path.at(l.s, tmp), side = -Math.sign(l.d) || 1, base = Math.atan2(a.rz * side, a.rx * side);      // toward the channel
      for (let i = 0; i < per + (rnd() < 0.4 ? 1 : 0); i++) {
        const ang = base + (rnd() - 0.5) * 3.4, y = 0.04 + Math.min(c.h - 0.1, 1.3) * rnd() * rnd(), v = rnd() < (y < 0.7 ? 0.45 : 0.15) ? 'b' : 'a', r = 0.415 * c.w / 0.78;
        lay(v, c.x + Math.cos(ang) * r, y, c.z + Math.sin(ang) * r, Math.cos(ang), 0.12, Math.sin(ang), (0.8 + 0.9 * rnd()) * (v === 'b' ? 0.9 : 1));      // (a mussel is two fingers long: at 1.25 the largest were a hand and a half)
      }
    }
    for (const sp of heroSpots) if (sp.y > 0.02 && rnd() < 0.85) lay(rnd() < (sp.y < 0.7 ? 0.45 : 0.15) ? 'b' : 'a', sp.x, sp.y, sp.z, sp.nx, sp.ny, sp.nz, 0.8 + 0.9 * rnd());      // (the skerry's edge, the tower's foot)
    for (const pl of rocks.pools) if (pl.y < 1.0 && rnd() < 0.6) { const ang = rnd() * 6.28; lay(rnd() < 0.3 ? 'b' : 'a', pl.x + Math.cos(ang) * pl.r * 1.22, pl.y + 0.012, pl.z + Math.sin(ang) * pl.r * 1.22, (rnd() - 0.5) * 0.2, 1, (rnd() - 0.5) * 0.2, 0.7 + 0.7 * rnd()); }
    let n = 0, tri = 0;
    for (const key of Object.keys(sets)) { const [cell, v] = key.split(':'), m = await kit.models(`models/sea/clump_${v}.glb`, sets[key], { color: clumpTint, brush: 0.4, extend: [seaForKit(sea.extend({ rest: 0.5, top: 1, pale: 0.9 })), lampPool] }).catch(() => null); if (m) { m.group.name = `clump:${key}`; ctx.only(m.group, 'direct'); cellShown.push({ o: m.group, s0: +cell * CELL, s1: (+cell + 1) * CELL }); n += m.count; tri += m.triangles; } }
    info.pieces.clumps = { copies: n, triangles: tri };
  }
  // ---------------------------------------------------------------------------------------------- wrack
  // The weed of the tide zone: tufts of strap wrack, a hand to two feet long, holding to the rock between the lowest
  // trough and the splash line of the close band (the channel-side faces of the near columns, the rims of the low
  // steps; the skerry's ledge and the tower's foot, below). Olive-black, matte, never lit of itself: wet weed takes a
  // little of the sky, and against a lit foot it is the dark shape. It is a standing thing and its motion is here:
  // while the swell stands below its holdfast a tuft hangs down the rock; as the water rises over it the straps
  // float up, lie on the surface and stream with the wave (forward on the crest, back in the trough), each strap a
  // little after its neighbour; and they are pushed aside by the hull. One draw call, direct view only.
  // (the long kelp of the twelve beds is the cast's and stays a stand-in: below)
  const wrackAt = [];                                                                     // { x, y, z, ox, oz, len }: a holdfast, the way out from the rock (level), its straps' length
  rocks.wrack = (list) => wrackAt.push(...list);                                          // (for a module that builds before this one and has rock of its own in the tide zone)
  const growWrack = (x, y, z, ox, oz, len) => wrackAt.push({ x, y, z, ox, oz, len });
  {
    const tm = {};
    for (const c of groups.near) {
      if (c.h < 0.2) continue;
      const l = path.locate(c.x, c.z, null, tm), a = path.at(l.s, tmp), side = -Math.sign(l.d) || 1, base = Math.atan2(a.rz * side, a.rx * side), r = 0.52 * c.w;      // toward the channel
      // a skirt round the channel's side of each column at its own tide line (a stump awash wears it at its rim)
      const y0 = Math.min(0.05 + 0.45 * rnd(), c.h - 0.06);
      for (const k of [-1.2, -0.4, 0.4, 1.2]) {
        if (rnd() < 0.15) continue;
        const ang = base + k + (rnd() - 0.5) * 0.4;
        growWrack(c.x + Math.cos(ang) * r, y0 + (rnd() - 0.5) * 0.16, c.z + Math.sin(ang) * r, Math.cos(ang), Math.sin(ang), 0.32 + 0.3 * rnd());
      }
    }
    for (const sp of heroSpots) { const hl = Math.hypot(sp.nx, sp.nz); if (hl > 0.6 && rnd() < 0.6) growWrack(sp.x - sp.nx * 0.02, sp.y, sp.z - sp.nz * 0.02, sp.nx / hl, sp.nz / hl, 0.3 + 0.45 * rnd()); }      // (the skerry's edge, the tower's foot: there it only hangs)
    for (const pl of rocks.pools) if (pl.y < 0.95 && rnd() < 0.55) { const ang = rnd() * 6.28; growWrack(pl.x + Math.cos(ang) * pl.r * 1.32, pl.y - 0.05, pl.z + Math.sin(ang) * pl.r * 1.32, Math.cos(ang), Math.sin(ang), 0.25 + 0.35 * rnd()); }
    // (the reefs' rims that stand in the wash: reef.json. Last, and with no number drawn: every tuft laid before these keeps its place and its colour. As many as
    // the quality allows (kit.count), taken evenly along the rims)
    { const N = reefTufts.length, keep = Math.min(N, kit.count(N)); reefTufts.forEach((t, i) => { if (Math.floor((i + 1) * keep / N) > Math.floor(i * keep / N)) growWrack(t.x, t.y, t.z, t.ox, t.oz, t.len); }); }
  }
  const buildWrack = () => {
    if (!wrackAt.length || params.has('nowrack')) return;
    // one tuft: five narrow straps of five rows, fanned (40 triangles); position = (across the strap in metres, share of its length, which strap)
    // (a strap of wrack is a ribbon of one width with a blunt end, a finger across. As first cut each was widest in its middle and pointed at both
    // ends, four to a tuft: under the rider's lantern a tuft was a handful of dead leaves at the foot of a column: sea_k7_040_crop.png)
    const FR = 5, rows = [0.006, 0.0105, 0.0115, 0.0105, 0.0055], pos = [], idx = [];
    for (let fr = 0; fr < FR; fr++) {
      const wide = [1, 0.75, 1.2, 0.85, 1.05][fr], b = pos.length / 3;
      rows.forEach((hw, j) => { const t = j / (rows.length - 1); pos.push(-hw * wide, t, fr, hw * wide, t, fr); });
      for (let j = 0; j < rows.length - 1; j++) { const q = b + j * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const g0 = new THREE.BufferGeometry();
    g0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g0.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0).map((v, i) => (i % 3 === 2 ? 1 : 0)), 3)); g0.setIndex(idx);
    whitePaint(g0);
    g0.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2); g0.boundingBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    const weeds = ['#0e110e', '#11130f', '#0d100c', '#0c0e0d', '#12140f'];      // (olive-black, no red in it: at '#171510' and its like the rider's own lantern, which is warm, made autumn of it)
    //      // (the page's kelp and wrack is #0A1A18; under the rider's lantern that green stood up as grass (sea_k4_056.png): bladder wrack is olive-brown going black, and against rock it must be the dark thing)
    const mat = kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, brush: 0.3, vertexColors: true, extend: [seaForKit(sea.extend({ rest: 0.8, top: 1, run: 1.2, pale: 0.45 })), lampPool, {
      vertexPars: /* glsl */`attribute vec2 aOut, aTuft; uniform vec4 uSwell[3]; varying float vWrT;`,
      vertexLocal: /* glsl */`{
        float wT = position.y, wF = position.z;
        vec3 wA = instanceMatrix[3].xyz;                                                 // the holdfast
        float wS = fract(aTuft.y * 7.31 + wF * 0.37);                                    // this strap's own number
        vec3 wOut = vec3(aOut.x, 0.0, aOut.y), wSide = vec3(-aOut.y, 0.0, aOut.x);
        float wL = aTuft.x * (0.45 + 0.75 * fract(wS * 5.3));
        float wAng = (wF - 2.0) * 0.5 + (wS - 0.5) * 0.5;
        vec3 wD = normalize(wOut * cos(wAng) + wSide * sin(wAng));                       // each strap leaves the holdfast its own way
        // the water where it grows: how high it stands, and which way it is moving (with the wave on a crest, against it in a trough)
        float wl = 0.0, wa = 1e-4; vec2 wFlow = vec2(0.0);
        for (int i = 0; i < 3; i++) { float c = cos(dot(uSwell[i].xy, wA.xz) - uSwell[i].z); wl += uSwell[i].w * c; wFlow += normalize(uSwell[i].xy + 1e-6) * (uSwell[i].w * c); wa += uSwell[i].w; }
        wFlow /= wa;
        float wK = smoothstep(-0.1, 0.22, wl - wA.y + 0.12 * (wS - 0.5));                // 0 hanging .. 1 afloat (each strap lets go a little after its neighbour)
        vec3 wHang = normalize(vec3(0.0, -1.0, 0.0) + wD * 0.16 + wSide * (0.5 * sin(wAng)));      // (hanging, a tuft is a fan against the rock)
        vec3 wFloat = normalize(vec3(wFlow.x, 0.0, wFlow.y) * 1.5 + wD * 0.55 + vec3(0.0, 0.8, 0.0));
        vec3 wTip = normalize(mix(wHang, wFloat, wK));
        vec3 wRoot = normalize(wD + vec3(0.0, mix(-0.6, 0.5, wK), 0.0));
        vec3 wP = wA + wL * wT * normalize(mix(wRoot, wTip, smoothstep(0.0, 0.6, wT)));
        wP.y = mix(wP.y, min(wP.y, wl + 0.02), wK);                                      // afloat, it lies on the water
        wP += wSide * (0.035 * wT * sin(uTime * (0.8 + wS) + wS * 40.0 + wT * 3.0));
        vec2 wAway = wP.xz - uBoat.xz; wP.xz += normalize(wAway + 1e-5) * (0.3 * wT * (1.0 - smoothstep(1.2, 3.0, length(wAway))));      // the hull shoulders it aside
        vec3 wAcross = normalize(cross(wTip, normalize(mix(wD, vec3(0.0, 1.0, 0.0), wK))) + 1e-4 * wSide);
        transformed = wP + wAcross * position.x - wA;
        objectNormal = normalize(cross(wAcross, wTip) + 1e-4 * wOut);
        vWrT = wT;
      }`,
      fragmentPars: /* glsl */`varying float vWrT;`,
      albedo: /* glsl */`albedo *= mix(0.75, 1.2, vWrT);`,                                 // (darkest at the holdfast, its tips a little paler)
      light: /* glsl */`glow *= 0.12;`,                                                  // (weed is the dark shape against a lit foot: wearing the rock's light, every strap that hung in a lit wash was a stroke of aqua)
    }] });
    // one mesh a cell (each is drawn only while the boat is within reach of its cell)
    const byCell = new Map(); for (const w of wrackAt) { const k = cellAt(w.x, w.z); if (!byCell.has(k)) byCell.set(k, []); byCell.get(k).push(w); }
    for (const [cell, mine] of byCell) {
      const g = g0.clone(), out = new Float32Array(mine.length * 2), tuft = new Float32Array(mine.length * 2);
      g.boundingSphere = g0.boundingSphere.clone(); g.boundingBox = g0.boundingBox.clone();
      mine.forEach((w, i) => { out[i * 2] = w.ox; out[i * 2 + 1] = w.oz; tuft[i * 2] = w.len; tuft[i * 2 + 1] = hash2(w.x, w.z, 31 + i * 0.01); });
      g.setAttribute('aOut', new THREE.InstancedBufferAttribute(out, 2)); g.setAttribute('aTuft', new THREE.InstancedBufferAttribute(tuft, 2));
      const m = kit.instances(g, mat, mine.map((w, i) => ({ position: [w.x, w.y, w.z], color: weeds[i % weeds.length] })));
      m.name = `wrack:${cell} (tufts at the tide line)`; ctx.only(m, 'direct'); cellShown.push({ o: m, s0: cell * CELL, s1: (cell + 1) * CELL });
    }
    info.pieces.wrack = { tufts: wrackAt.length, triangles: wrackAt.length * FR * (rows.length - 1) * 2 };
  };
  buildWrack();
  // STAND-IN for kelp: twelve beds of 75 fronds, 3 to 6 m, at rock feet (the cast makes them stream: cast.js)
  // (layout's, left as it was but for one number: the fronds stand 0.7 m lower, under the troughs of the swell as it now is (1.4 m): they stood out of every trough as black cards)
  const beds = [];
  for (const st of rocks.stacks) if (st.kelp) beds.push([st.x + st.rx * st.side * (st.B + 2.2), st.z + st.rz * st.side * (st.B + 2.2)]);
  { const f = rocks.gate; for (const side of [-1, 1]) beds.push(at2(f, side * (P.gate.open - 1.2), 0)); }
  { const E = P.eastReef, f = frameAt(E.at[0]); beds.push(at2(f, E.at[1] - 5)); }
  { const f = frameAt(169); beds.push(at2(f, -36)); }
  { const f = frameAt(212); beds.push(at2(f, 3.4)); }                                     // the skerry's ledge
  { const f = rocks.wall; for (const side of [-1, 1]) beds.push(at2(f, side * (P.wall.cleft.half + 5), -3)); }
  {
    const g = whitePaint(new THREE.PlaneGeometry(1, 1, 1, 8)); g.translate(0, 0.5, 0);
    const list = [], per = Math.round(P.kelp.fronds / P.kelp.beds);
    for (const [bx, bz] of beds) for (let i = 0; i < per; i++) { const a = rnd() * 6.28, r = 3.6 * Math.sqrt(rnd()), len = lerp(P.kelp.len[0], P.kelp.len[1], rnd()); list.push({ position: [bx + Math.cos(a) * r, -len - 0.95 - 0.8 * rnd(), bz + Math.sin(a) * r], scale: [0.2 + 0.2 * rnd(), len, 1], rotation: [(rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5], color: C.kelp }); }
    const m = kit.instances(g, kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, brush: 0.3, vertexColors: true }), list); m.name = 'standin:kelp (900 fronds)'; ctx.only(m, 'direct');
    info.pieces.kelp = list.length; rocks.kelpBeds = beds;
  }
  // ---------------------------------------------------------------------------------------------- the small kit
  // `float`, `dan`, `creel`, `ropecoil`, `ring` (source-art/models/sea/props.py). They are painted six times as light
  // as they are seen and brought down here with one grey; they take the sea's light like everything else.
  const propOpts = (o = {}, k = 1 / 6) => ({ color: new THREE.Color().setRGB(k, k, k), brush: 0.5, extend: seaForKit(sea.extend({ rest: 0.6, top: 1, pale: 1.25, ...o })) });      // (k: what the models' paint is brought down by)
  const afloat = rocks.afloat = { floats: [], dans: [], model: null, rags: null };
  {
    // five cork floats and two dan buoys down the left edge of the sound, from the bell buoy to the wreck's reef. They
    // ride the swell (update, below); each float has its own ring of surf light, so that it is ringed as it lifts.
    for (const [s, d] of P.floats) { const p = kit.at(s, d); afloat.floats.push({ x: p.x, z: p.z, turn: hash2(p.x, p.z, 11) * 6.28, lean: [(hash2(p.x, p.z, 12) - 0.5) * 0.5, (hash2(p.x, p.z, 13) - 0.5) * 0.5], k: 0.92 + 0.2 * hash2(p.x, p.z, 14) }); outlines.push({ pts: ellipseOutline(p.x, p.z, 1, 0, 0.22, 0.22, 8), width: 0.75, inset: 0.1 }); }
    // (a cork on a line lies on its side, dark and low: upright and pale it was a bottle with a handle. `run`: the sea's light climbs a hand up it
    // and no further: with the rock's two metres every crest coated the whole cork in light and it read as a glass ball: sea_k4_069_crop.png)
    afloat.model = await kit.models('models/sea/float.glb', afloat.floats.map((f) => ({ position: [f.x, 0, f.z], rotation: [Math.PI / 2 + f.lean[0], f.turn, f.lean[1]], scale: f.k })), (() => { const o = propOpts({ rest: 0.5, pale: 0.15, run: 0.1 }, 0.11); return { ...o, extend: [o.extend, { light: 'glow *= 0.06;' }] }; })()).catch(() => null);      // (0.11: wet cork is nearly black; beside the hull, in the rider's lantern, at a sixth it was a white egg. And it gives off next to none of the surge's light itself: its under side lit all round, from a boat it was a glass ball with a dark heart (sea_k7_028_crop.png); the light a lifting cork makes is on the water round it, which is the cast's wash and this module's strip of surf)
    if (afloat.model) { afloat.model.group.name = 'floats'; zones.sound.shown.push(afloat.model.group); }
    for (const [s, d] of P.dans) {
      const p = kit.at(s, d), m = await kit.model('models/sea/dan.glb', { position: [p.x, 0, p.z], turn: hash2(p.x, p.z, 15) * 6.28, live: true, crisp: true, ...propOpts({ pale: 0.5, run: 0.25 }, 0.11) }).catch(() => null);      // (crisp: its cane is 17 mm)
      if (m) { zones.sound.shown.push(m.group); afloat.dans.push({ x: p.x, z: p.z, model: m, turn: hash2(p.x, p.z, 15) * 6.28, phase: hash2(p.x, p.z, 16) * 6.28 }); outlines.push({ pts: ellipseOutline(p.x, p.z, 1, 0, 0.2, 0.2, 8), width: 0.7, inset: 0.1 }); }
    }
    // THE LINE the floats and dans are strung on (the page: "a line of five cork floats and two dan buoys"): a headrope lying a hand
    // under the surface from dan to float to float to dan, sagging between them, its two ends going down into the dark (toward the
    // buoy's mooring, and toward the wreck's reef). It rides the swell with them (the water's own three waves, in its vertex
    // shader); without it they were corks adrift, each alone. One draw call, direct view only.
    {
      const pts = [...afloat.dans.map((d) => ({ x: d.x, z: d.z })), ...afloat.floats.map((f) => ({ x: f.x, z: f.z }))].map((q) => ({ ...q, s: path.locate(q.x, q.z, null, {}).s })).sort((a, b) => a.s - b.s);
      if (pts.length > 2) {
        const line = [], a0 = kit.at(138.9, -29.5), a1 = kit.at(163.5, -36.4);
        const span = (A, B, yA, yB, sag, ride) => { const n = 10; for (let i = 0; i < n; i++) { const t = i / n, w = Math.sin(t * Math.PI), wob = (hash2(A.x + i, A.z, 21) - 0.5) * 0.16 * w; line.push([lerp(A.x, B.x, t) + wob, lerp(yA, yB, t) - sag * w, lerp(A.z, B.z, t) - wob, lerp(ride[0], ride[1], t)]); } };
        span(a0, pts[0], -2.6, -0.1, 0.3, [0, 1]);                                           // up from the dark
        for (let i = 0; i < pts.length - 1; i++) span(pts[i], pts[i + 1], -0.1, -0.1, 0.28 + 0.2 * hash2(pts[i].x, pts[i].z, 22), [1, 1]);
        span(pts[pts.length - 1], a1, -0.1, -2.8, 0.3, [1, 0]); line.push([a1.x, -2.8, a1.z, 0]);
        // a tube of four sides along it
        const pos = [], ride = [], idx = [], R = 0.012, up = new THREE.Vector3(0, 1, 0), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
        line.forEach((q, i) => {
          const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)];
          T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); A.crossVectors(T, up).normalize(); B.crossVectors(T, A);
          for (let k = 0; k < 4; k++) { const c = Math.cos(k * Math.PI / 2 + 0.6), sn = Math.sin(k * Math.PI / 2 + 0.6); pos.push(q[0] + (A.x * c + B.x * sn) * R, q[1] + (A.y * c + B.y * sn) * R, q[2] + (A.z * c + B.z * sn) * R); ride.push(q[3]); }
          if (i) for (let k = 0; k < 4; k++) { const p0 = (i - 1) * 4 + k, p1 = (i - 1) * 4 + (k + 1) % 4; idx.push(p0, p0 + 4, p1, p1, p0 + 4, p1 + 4); }
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRide', new THREE.Float32BufferAttribute(ride, 1)); g.setIndex(idx); g.computeVertexNormals();
        const mat = kit.gouache({ color: '#11121a', brush: 0.3, crisp: true, extend: {
          uniforms: { uSwell: sea.uniforms.uSwell },
          vertexPars: 'attribute float aRide; uniform vec4 uSwell[3];',
          vertexWorld: 'float lh = 0.0; for (int i = 0; i < 3; i++) { float ph = dot(uSwell[i].xy, wp.xz) - uSwell[i].z, am = uSwell[i].w; lh += am * cos(ph) + 0.5 * length(uSwell[i].xy) * am * am * cos(2.0 * ph); } wp.y += lh * aRide;',
        } });
        const m = new THREE.Mesh(g, mat); m.name = 'the floats\' line'; m.frustumCulled = false; ctx.add(m); ctx.only(m, 'direct'); zones.sound.shown.push(m);
        afloat.line = m; info.pieces.floatLine = { points: line.length, triangles: idx.length / 3 };
      }
    }
    // the dans' rags: two strips of cloth tied under each cane's head (the engine's cloth: they hang, stir, and lift
    // when a wind front passes; never flags). Each is tied to its dan every frame.
    // (the cloth engine is loaded here and not at the top: if it cannot be had, the rags are left out and everything else stands)
    const cloth = afloat.dans.length ? await import('../../engine/cloth.js').catch(() => null) : null;
    if (cloth && cloth.makeCloth) {
      const bolts = [];
      for (const dn of afloat.dans) for (const k of [0, 1]) bolts.push({ position: [dn.x, 1.44, dn.z], width: 0.11 - 0.03 * k, length: 0.3 - 0.07 * k, turn: dn.turn + k * 1.9, color: k ? '#1b1f2e' : '#232838', stiff: 0.1 });
      afloat.rags = cloth.makeCloth(ctx, bolts, { backlight: 0, sway: 0.09, speed: 0.7, part: false, segments: [2, 6], wet: 0.5, mirror: false, brush: 0.5 });
      afloat.rags.object.name = 'dan rags'; zones.sound.shown.push(afloat.rags.object);
    }
  }
  {
    // on the skerry, beside the slip: three creels, two coils of rope, the iron ring. The skerry's model names the
    // places (heroes.js: shared.heroes.skerry.creels, ropecoils, ring); each thing is let down onto the rock where it stands.
    const sk = shared.heroes && shared.heroes.skerry, ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
    const groundAt = (x, z, y) => {                                                       // the rock's height under (x, z), by looking down at the skerry's model
      if (!sk || !sk.model || !sk.model.group) return y;
      ray.set(from.set(x, y + 3, z), down); ray.far = 6;
      const hit = ray.intersectObject(sk.model.group, true)[0];
      return hit ? hit.point.y : y;
    };
    const c0 = (sk && sk.creels) || kit.at(P.skerry.creels[0], P.skerry.creels[1] + 0.9, 0.8), f = frameAt(P.skerry.creels[0]), th = Math.atan2(f.tx, f.tz);
    const creels = [];
    for (const [du, dv, turn, up] of [[0, 0, 0.2, 0], [0.86, 0.12, -0.35, 0], [0.4, 0.05, 1.2, 0.43]]) {      // two side by side, the third thrown on top of them
      const x = c0.x + f.tx * du + f.rx * dv, z = c0.z + f.tz * du + f.rz * dv;
      creels.push({ position: [x, groundAt(x, z, c0.y) + up, z], rotation: [up ? 0.08 : 0, th + turn, up ? -0.1 : 0], scale: 0.95 + 0.1 * hash2(x, z, 17), tint: ['#ffffff', '#f0ecf8', '#e2deee'][creels.length] });
    }
    const coils = ((sk && sk.ropecoils) || [kit.at(P.skerry.creels[0] + 1.4, P.skerry.creels[1] + 1.8, 0.8), kit.at(P.skerry.creels[0] + 5, P.skerry.creels[1] + 1.2, 1.3)]).map((p, i) => ({ position: [p.x, groundAt(p.x, p.z, p.y) + 0.005, p.z], rotation: [0, i * 2.3 + 0.7, 0], scale: i ? 0.86 : 1 }));
    // (the first coil is stood against the down-route pot, its face to the channel: lying flat on rock that stands at the rider's eye it was seen edge-on,
    // a pale band (sea_k6_048_crop.png). It stands on its rim where its tail leaves it, leaning back 55 degrees onto the pot's shoulder; the tail lies
    // away up-route along the rock. The second lies flat beyond the slip, as dropped.)
    if (creels[1]) {
      const lean = 55 * Math.PI / 180, c = creels[1].position, rimX = c[0] - f.rx * 0.37, rimZ = c[2] - f.rz * 0.37, g = groundAt(rimX, rimZ, c[1]);
      coils[0] = { position: [rimX + f.rx * 0.172, g + 0.3 * Math.sin(lean) + 0.02, rimZ + f.rz * 0.172], rotation: [0, Math.atan2(f.rz, -f.rx), -lean], scale: 1 };
    }
    const rg = (sk && sk.ring) || kit.at(222, 8.6, 1.0);
    const props = rocks.props = {};
    // (tarred twine and wet hazel are dark things: with the rock's own readiness for the sky's slate (and half as much again for the rope) a pot was a
    // pale wire frame and the coil a stack of pale plates against the rock behind them: sea_k6_034.png)
    props.creels = await kit.models('models/sea/creel.glb', creels, propOpts({ pale: 0.7 })).catch(() => null);
    props.coils = await kit.models('models/sea/ropecoil.glb', coils, propOpts({ pale: 0.95 })).catch(() => null);
    props.ring = await kit.model('models/sea/ring.glb', { position: [rg.x, rg.y, rg.z], face: 'channel', ...propOpts() }).catch(() => null);
    for (const m of [props.creels, props.coils, props.ring]) if (m) { ctx.only(m.group, 'direct'); zones.wall.shown.push(m.group); }
    const where = (q) => { const l = path.locate(q[0], q[2], null, tmp); return [Math.round(l.s * 10) / 10, Math.round(l.d * 10) / 10, Math.round(q[1] * 100) / 100]; };      // [s, d, height], for the log
    info.pieces.props = { floats: afloat.floats.length, dans: afloat.dans.length, creels: creels.map((c) => where(c.position)), ropecoils: coils.map((c) => where(c.position)), ring: props.ring ? where([rg.x, rg.y, rg.z]) : null, named: !!(sk && sk.creels) };
  }

  // ---------------------------------------------------------------------------------------------- lodged
  // What the sea has fetched up in the close band, each where the swell would leave it (the swell and the wind run from
  // ahead-left to behind-right): `drift` a to c (source-art/models/sea/flotsam.py) and one creel off the skerry.
  //   - a strake and a futtock's head of the wreck on the east reef, straight down-swell of her
  //   - another strake stood against the gate's right pier on its sound side
  //   - a float lost from the line of floats, its line and a rag of net thrown over one of the gate's nine stumps
  //   - a creel washed off the skerry's slip, on its side in the wall's plinth beside the cleft
  // A long thing is laid by its two ends on what is modelled under them (a look straight down at the steps, reefs and
  // near columns); none of them moves: they are lodged.
  {
    const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4();
    ray.layers.enableAll();
    const nearGroups = near.models.map((m) => m.group);
    const all = [...supports, ...nearGroups];
    const topAt = (x, z, fallback = -0.2) => { ray.set(o.set(x, 6, z), down); ray.far = 8; const hit = ray.intersectObjects(all, true)[0]; return hit ? hit.point.y : fallback; };
    // a model whose length lies along its own +X, laid from a (its origin) toward b; roll: degrees about its length (0: its own top up)
    const lay = async (url, a, b, zone, roll = 0, o2 = {}) => {
      const m = await kit.model(url, { position: a, live: true, ...propOpts({ rest: 0.6, pale: 0.35 }, 0.11), ...o2 }).catch(() => null);      // (wet oak: a dark thing against a lit foot, never a lit line; and at a sixth of its paint the rider's own lantern made it the palest and warmest thing on a reef, an olive board: sea_k7_047.png)
      if (!m) return null;
      X.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); Y.set(0, 1, 0).addScaledVector(X, -X.y).normalize(); Z.crossVectors(X, Y);
      if (roll) { const c = Math.cos(roll * Math.PI / 180), sn = Math.sin(roll * Math.PI / 180), y2 = Y.clone().multiplyScalar(c).addScaledVector(Z, sn); Z.crossVectors(X, y2); Y.copy(y2); }
      m.group.quaternion.setFromRotationMatrix(M.makeBasis(X, Y, Z)); m.group.position.set(a[0], a[1], a[2]); m.group.updateMatrix(); m.group.updateMatrixWorld(true);
      ctx.only(m.group, 'direct'); zones[zone].shown.push(m.group);
      return m;
    };
    const lodged = rocks.lodged = [];
    // ---- the east reef: a strake and a futtock's head lying on its channel side, where a rider sees them: each end on
    // a top of its own, nothing between its ends standing higher than it lies (it is tried in several places and turns,
    // and takes the first that is a true lie; if there is none it is left out)
    {
      const E = P.eastReef, f = frameAt(E.at[0]), [cx, cz] = at2(f, E.at[1]), px = cx - f.rx * 1.7, pz = cz - f.rz * 1.7;      // the middle of the steps' back line; they run out toward the channel
      const on = (u, v) => [px + f.tx * u - f.rx * v, pz + f.tz * u - f.rz * v];
      const lie = (long, half, tries, slope = 0) => {
        for (const [uc, vc, th] of tries) {
          const du = Math.cos(th) * long / 2, dv = Math.sin(th) * long / 2, [x0, z0] = on(uc - du, vc - dv), [x1, z1] = on(uc + du, vc + dv), y0 = topAt(x0, z0, null), y1 = topAt(x1, z1, null);
          if (y0 === null || y1 === null || Math.abs(y1 - y0) < slope || Math.abs(y1 - y0) > long * 0.6) continue;
          let over = 0;
          for (const k of [0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88]) over = Math.max(over, topAt(lerp(x0, x1, k), lerp(z0, z1, k), -9) - lerp(y0, y1, k));
          if (over > 0.04) continue;
          return y0 < y1 ? { a: [x0, y0 + half, z0], b: [x1, y1 + half, z1] } : { a: [x1, y1 + half, z1], b: [x0, y0 + half, z0] };      // (its whole end low, its broken end up)
        }
        return null;
      };
      const tries = (us, vs, ths) => { const o = []; for (const v of vs) for (const u of us) for (const th of ths) o.push([u, v, th]); return o; };
      // (the strake: leaning on one of the reef's stumps, along the reef, its whole end down in the water on the pavement and its splintered end standing a
      // forearm past the stump's rim: seen from the channel in profile, a line of wreckage against the sky. As first laid, by its two ends on two tops, it
      // bridged the table two metres up like a stick laid across a box: sea_k7_047.png)
      const leanOn = (long) => {
        const cands = (rocks.eastStumps || []).filter((c) => c.h > 1.0 && c.h < 2.1).sort((p, q) => ((p.x - cx) * f.rx + (p.z - cz) * f.rz) - ((q.x - cx) * f.rx + (q.z - cz) * f.rz));      // the one nearest the channel first
        for (const c of cands) for (const sgn of [1, -1]) {
          const hx = c.x + f.tx * sgn * (0.5 * c.w - 0.08), hz = c.z + f.tz * sgn * (0.5 * c.w - 0.08), hy = topAt(hx, hz, c.h);      // where it rests: the stump's rim
          for (const run of [1.25, 1.05, 1.45]) {
            const fx = hx + f.tx * sgn * run, fz = hz + f.tz * sgn * run, fy = topAt(fx, fz, -0.55);
            if (fy > 0.2) continue;                                                     // (its foot goes down into the water)
            const d = Math.hypot(run, hy - fy); if (d < 1.5 || d > long - 0.25) continue;
            let over = 0; for (const k of [0.2, 0.4, 0.6, 0.8]) over = Math.max(over, topAt(lerp(fx, hx, k), lerp(fz, hz, k), -9) - lerp(fy, hy, k));
            if (over > 0.03) continue;                                                  // (nothing between its foot and the rim stands higher than it lies)
            return { a: [fx, fy + 0.02, fz], b: [hx, hy + 0.03, hz] };
          }
        }
        return null;
      };
      const leant = leanOn(2.5), sk = leant || lie(2.4, 0.012, tries([0.3, -0.5, 1.0, -1.2, 1.6], [1.5, 2.0, 1.0, 2.4], [0.45, -0.45, 0.8, -0.8, 0.15, -0.15]), 0.2);
      if (sk && await lay('models/sea/drift_a.glb', sk.a, sk.b, 'sound', leant ? 76 : 0)) lodged.push({ what: 'strake', at: sk.a });      // (leant, it stands on its edge, its face to the channel: on its flat a rider saw two inches of plank, a pole)
      const fk = lie(1.4, 0.11, tries([-0.6, 0.4, -1.4, 1.2], [0.5, 0.1, 0.9, -0.4], [0.2, -0.2, 0.6, -0.6]));
      if (fk && await lay('models/sea/drift_b.glb', fk.a, fk.b, 'sound', 84)) lodged.push({ what: 'futtock', at: fk.a });
    }
    // ---- the gate's right pier, on its sound side: a strake stood against the columns
    {
      const f = rocks.gate, half = P.gate.thickAt(15) / 2, [bx, bz] = at2(f, 15.0, half + 0.25), [ax, az] = at2(f, 13.2, half + 1.3);      // (along the wall, its face to the sound)
      if (await lay('models/sea/drift_a.glb', [ax, -0.3, az], [bx, 1.1, bz], 'gate', 0)) { lodged.push({ what: 'strake', at: [ax, -0.3, az] }); soft(ax, az, 1.0); }
    }
    // ---- one of the gate's nine stumps (the sound side of the left jamb): a lost float and its gear thrown over it, its line down the channel side
    {
      const f = rocks.gate, st = (rocks.gateStumps || []).filter((c) => c.v > 0).sort((p, q) => Math.abs(p.h - 1.25) - Math.abs(q.h - 1.25))[0];
      if (st) {
        const m = await kit.model('models/sea/drift_c.glb', { position: [st.x, st.h + 0.005, st.z], rotation: [0, Math.atan2(f.rx, f.rz) + 0.35, 0], scale: Math.min(1.15, st.w / 0.78), crisp: true, ...propOpts({ rest: 0.55, pale: 0.3 }, 0.085) }).catch(() => null);      // (wet cork, old line and tarred twine are dark things: at a sixth, and half as ready again for the sky as rock, they were a pale mop on the stump's head, the palest thing in the gate: sea_k7_003.png)
        if (m) { ctx.only(m.group, 'direct'); zones.gate.shown.push(m.group); lodged.push({ what: 'float and gear', at: [st.x, st.h, st.z] }); }
      }
    }
    // ---- the wall's plinth, right of the cleft: a creel off the slip, on its side among the stumps
    {
      const f = rocks.wall, [x, z] = at2(f, P.wall.cleft.half + 5.2, -1.5), y = topAt(x, z, -0.1);
      const m = await kit.model('models/sea/creel.glb', { position: [x, Math.max(y, -0.1) + 0.2, z], rotation: [1.25, 0.7, 0.2], ...propOpts({ rest: 0.7, pale: 0.5 }) }).catch(() => null);
      if (m) { ctx.only(m.group, 'direct'); zones.wall.shown.push(m.group); lodged.push({ what: 'creel', at: [x, y, z] }); }
    }
    info.pieces.lodged = lodged.map((l) => { const q = path.locate(l.at[0], l.at[2], null, tmp); return [l.what, Math.round(q.s * 10) / 10, Math.round(q.d * 10) / 10, Math.round(l.at[1] * 100) / 100]; });
  }

  // ---------------------------------------------------------------------------------------------- under the keel
  // STAND-IN and PROTOTYPE for the jellies (the cast gives them their pulse, sway and flare; this answers the page's
  // risk "things under the water seen from 1.1 m" before anything is modelled). 2,600 small bells: 2,200 under the
  // sound from 1 to 22 m down, 400 thinly from s 20 to 106. Each pulses on its own time. Not in the mirror.
  // (layout's, untouched: they are the cast's to replace)
  {
    const J = P.jellies.small, g = new THREE.SphereGeometry(0.5, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2), n = kit.count(J.count), list = [], phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const inSound = i < n * J.sound / J.count, s = inSound ? 108 + 96 * rnd() : 30 + 76 * rnd(), hw = path.at(s, tmp).halfWidth, d = (rnd() * 2 - 1) * (inSound ? Math.min(hw + 18, 46) : hw + 8);
      const depth = J.depth[0] + 0.3 + (inSound ? (J.depth[1] - J.depth[0]) * Math.pow(rnd(), 1.5) : 7 * rnd()), w = lerp(J.across[0], J.across[1], rnd());
      const p = kit.at(s, d, -depth); list.push({ position: p, scale: [w, w * 0.7, w], rotation: [(rnd() - 0.5) * 0.4, 0, (rnd() - 0.5) * 0.4] }); phase[i] = rnd();
    }
    const mat = kit.gouache({ color: '#1b1640', brush: 0, shade: 0.3, extend: {
      vertexPars: 'attribute float aPhase; varying float vPulse;',
      // small bells pulse every 3.2 to 5.5 s, each on its own time; the bell draws in 18 per cent as it lights
      vertexLocal: 'float jt = fract(uTime / (3.2 + 2.3 * fract(aPhase * 7.31)) + aPhase); vPulse = smoothstep(0.0, 0.12, jt) * (1.0 - smoothstep(0.12, 0.75, jt)); transformed.xz *= 1.0 - 0.18 * vPulse;',
      fragmentPars: 'varying float vPulse; uniform vec3 uJViolet, uJAqua;',
      light: 'float jrim = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 2.0); glow += uJViolet * (0.55 + 1.0 * vPulse) + uJAqua * (jrim * vPulse * 1.2);',
      uniforms: { uJViolet: { value: new THREE.Color(C.violet) }, uJAqua: { value: new THREE.Color(C.aqua) } },
    } });
    const m = kit.instances(g, mat, list); m.name = 'standin:small jellies (2,600)';
    m.geometry = g.clone(); m.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1)); ctx.only(m, 'direct');
    info.pieces.smallJellies = n;
    // nine great ones: a bell 1.4 to 2 m and 9 m of arms and tentacles under it (STAND-IN for greatjelly a, b)
    const bells = [], tails = [];
    for (const [s, d, depth] of P.jellies.great) { const p = kit.at(s, d, -depth), w = 1.4 + 0.6 * rnd(); bells.push({ position: p, scale: [w, w * 0.62, w] }); tails.push({ position: [p.x, p.y - 7.2, p.z], scale: [w * 0.55, 7.2, w * 0.55] }); }
    const bell = kit.instances(g, kit.gouache({ color: '#1b1640', brush: 0.4, shade: 0.3, emissive: C.violet, emissiveIntensity: 0.55, rim: { color: C.aqua, strength: 0.9, power: 2.2, toward: 0 } }), bells); bell.name = 'standin:greatjelly bells (9)'; ctx.only(bell, 'direct');
    const tg = new THREE.CylinderGeometry(0.5, 0.16, 1, 8, 1, true); tg.translate(0, 0.5, 0);
    const tail = kit.instances(tg, kit.gouache({ color: '#120f2c', brush: 0.4, emissive: C.violet, emissiveIntensity: 0.05, side: THREE.DoubleSide }), tails); tail.name = 'standin:greatjelly arms and tentacles (9)'; ctx.only(tail, 'direct');
    info.pieces.greatJellies = bells.length;
  }

  // ---------------------------------------------------------------------------------------------- for the cast
  // Ledges a small bird can use (the page: crevices at 2 to 5 m at the feet of the close stacks and in the gate): the
  // broken tops of close-band columns that end between 2 and 6 m up, each with the way out to open water.
  // The water the dished stumps hold (column_near a and d; every near column whose top stands under 2.4 m): [{ x, y, z, r }], like rocks.pools (the steps'),
  // kept apart from them because nothing grows round a stump's rim: for rain rings, drips and whatever drinks.
  rocks.stumpPools = groups.near.filter((c) => c.pool && c.h > 0.15 && c.h < 2.4).map((c) => ({ x: c.x + c.rotation[2] * -c.h, y: c.h - 0.02, z: c.z + c.rotation[0] * c.h, r: 0.3 * c.w }));
  info.pieces.stumpPools = rocks.stumpPools.length;
  rocks.crevices = groups.near.filter((c) => c.h > 2 && c.h < 6).map((c) => { const l = path.locate(c.x, c.z, null, tmp), a = path.at(l.s, {}), side = -Math.sign(l.d) || 1; return { x: c.x, y: c.h + 0.05, z: c.z, out: [a.rx * side, a.rz * side], zone: c.zone }; });
  info.pieces.crevices = rocks.crevices.length;

  // ---------------------------------------------------------------------------------------------- surf light round every foot
  rocks.surf = sea.surf(outlines);
  if (params.has('nospray') && rocks.surf && rocks.surf.userData && rocks.surf.userData.spray) rocks.surf.userData.spray.visible = false;      // (&nospray=1: the rock at a lit foot without the light's thrown water in front of it, to tell the one from the other)
  rocks.paint = { extend: kitExtend, rock: kitRock, tint: kitTint, uniforms: kitUniforms, light: seaForKit };      // (light(ext): the sea's light as the kit's rock takes it near the eye, for a copy of this paint laid over sea.extend elsewhere)      // the kit's rock, for whoever builds after this module and wants the same stone
  rocks.info = info;
  // &counts=1 writes what was grown to .shots/sea_counts.json (for the logs in docs/build/sea/)
  if (params.has('counts')) fetch('/__shot/sea_counts.json', { method: 'POST', body: JSON.stringify({ ...info, colliders: colliders.length }, null, 1) });

  // ---------------------------------------------------------------------------------------------- what is drawn where the boat is
  // (the zones, above). &lod=0: everything, always.
  const noLod = params.get('lod') === '0';
  rocks.zones = zones;
  let last = -1;
  const slope = { x: 0, z: 0 }, ragAt = new THREE.Vector3();
  // The hull shoulders a floating thing aside: it slides round the boat on its line and swings back in a few seconds when the boat has
  // passed. f: { x, z } where it lies, and px, pz how far it is held off now (kept on it). The hull is taken as its keel line, stern to stem.
  const shoulder = (f, bt, dt, water) => {
    if (!bt) return;
    const fx = -Math.sin(bt.heading), fz = -Math.cos(bt.heading), cx = f.x + (f.px || 0), cz = f.z + (f.pz || 0);
    const u = Math.max(-1.7, Math.min(2.3, (cx - bt.x) * fx + (cz - bt.z) * fz)), hx = bt.x + fx * u, hz = bt.z + fz * u;      // the nearest point of the keel
    let qx = cx - hx, qz = cz - hz, q = Math.hypot(qx, qz);
    if (q < 1e-3) { qx = -fz * 1e-3; qz = fx * 1e-3; q = 1e-3; }                                // (dead on the keel line: it goes to starboard)
    const reach = 1.05 - 0.4 * Math.max(0, u) / 2.3 - 0.15 * Math.max(0, -u) / 1.7;            // the hull is fullest amidships
    if (q < reach) {
      const k = (reach - q) / q; f.px = (f.px || 0) + qx * k; f.pz = (f.pz || 0) + qz * k;
      if (!f.hit) { f.hit = true; if (water && water.ripple) water.ripple(f.x + f.px, f.z + f.pz, 0.3, 0.5); }
    } else {
      const k = Math.exp(-dt * 0.7); f.px = (f.px || 0) * k; f.pz = (f.pz || 0) * k;
      if (q > reach + 0.6) f.hit = false;
    }
  };
  // &kitmap=1 (for looking, with &edgeeye=45&pitch=-80: the eye lifted over the water): every collider of the area as a ring a metre over the water
  // (solid: pale; shallows: violet), so that a picture from above shows where rock stands outside a circle and where a circle holds empty water.
  let mapped = !params.has('kitmap');
  const drawMap = () => {
    mapped = true;
    const inst = ctx.engine && ctx.engine.realms && [...ctx.engine.realms.built.values()].find((q) => q.group === ctx.group);
    if (!inst) return;
    { // the same as numbers (the area's own x, z, and the route's s, d): .shots/sea_kitmap.json, drawn as plans by .shots/sea_reefs_plan.py
      const t2 = {}, r2 = (v) => Math.round(v * 100) / 100, sd = (x, z) => { const l = path.locate(x, z, null, t2); return [r2(x), r2(z), r2(l.s), r2(l.d)]; };
      const line = []; for (let ss = 0; ss <= P.length; ss += 2) { const a = path.at(ss, t2); line.push([r2(a.x), r2(a.z), r2(a.rx), r2(a.rz), ss]); }
      fetch('/__shot/sea_kitmap.json', { method: 'POST', body: JSON.stringify({
        line, colliders: inst.colliders.map((q) => [...sd(q.x, q.z), r2(q.r), q.soft ? 1 : 0]),
        ground: (rocks.reefGround || []).map((q) => [r2(q.x), r2(q.z), r2(q.top), q.v]),
        reefs: (rocks.reefs || []).map((q) => [...sd(q.x, q.z), q.v]), knobs: (rocks.reefKnobs || []).map((q) => [r2(q.x), r2(q.z), r2(q.r), q.top]),
        beds: (rocks.kelpBeds || []).map(([x, z]) => sd(x, z)),
      }) });
    }
    for (const soft of [false, true]) {
      const pts = [], w = 0.09;
      for (const q of inst.colliders) if (!!q.soft === soft) for (let i = 0; i < 40; i++) {
        const a0 = i / 40 * 6.2832, a1 = (i + 1) / 40 * 6.2832, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), r0 = q.r - w, r1 = q.r + w;
        pts.push(q.x + c0 * r0, 1, q.z + s0 * r0, q.x + c0 * r1, 1, q.z + s0 * r1, q.x + c1 * r1, 1, q.z + s1 * r1, q.x + c0 * r0, 1, q.z + s0 * r0, q.x + c1 * r1, 1, q.z + s1 * r1, q.x + c1 * r0, 1, q.z + s1 * r0);
      }
      if (!pts.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: soft ? '#a070ff' : '#fff2c0', side: THREE.DoubleSide, fog: false, toneMapped: false }));
      m.name = 'kitmap: colliders'; m.frustumCulled = false; ctx.add(m); ctx.only(m, 'direct');
    }
  };
  return {
    update(dt, c) {
      if (!mapped) drawMap();
      // ---- what floats rides the swell: the floats bob and tip with the slope under them; a dan stands nearly upright
      // (its lead keeps it so) and nods slowly; its rags stay tied to it
      const water = c.water, time = c.time;
      if (afloat.model && water) {
        for (const [i, f] of afloat.floats.entries()) {
          shoulder(f, c.boat, dt, water);
          const x = f.x + (f.px || 0), z = f.z + (f.pz || 0), y = water.heightAt(x, z); if (water.slopeAt) water.slopeAt(x, z, slope);
          afloat.model.place(i, { position: [x, y + 0.025, z], rotation: [Math.PI / 2 + f.lean[0] + slope.z * 0.9, f.turn + 0.2 * Math.sin(time * 0.31 + i), f.lean[1] - slope.x * 0.9], scale: f.k });
        }
      }
      for (const [i, dn] of afloat.dans.entries()) {
        const y = water ? water.heightAt(dn.x, dn.z) : 0; if (water && water.slopeAt) water.slopeAt(dn.x, dn.z, slope);
        // (a dan is shouldered aside like a float, and its cane leans away from the hull while it is held off: it has no collider, and stood through the rider's boat)
        shoulder(dn, c.boat, dt, water);
        const px = dn.px || 0, pz = dn.pz || 0;
        const g = dn.model.group; g.position.set(dn.x + px, (water ? water.heightAt(dn.x + px, dn.z + pz) : 0) - 0.03, dn.z + pz); g.rotation.set(slope.z * 0.35 + 0.05 * Math.sin(time * 0.52 + dn.phase) + pz * 0.3, dn.turn, -slope.x * 0.35 + 0.05 * Math.sin(time * 0.43 + dn.phase * 1.7) - px * 0.3); g.updateMatrix(); g.updateMatrixWorld(true);
        if (afloat.rags) { dn.model.point('rag', ragAt); const aPos = afloat.rags.mesh.geometry.attributes.aPos; for (const k of [0, 1]) aPos.setXYZ(i * 2 + k, ragAt.x, ragAt.y, ragAt.z); aPos.needsUpdate = true; }
      }
      const bs = c.s;
      for (const k of Object.keys(FAR)) { const g = lod[k]; if (!g || !g.light) continue; const far = !noLod && FAR[k](bs); if (far !== g.far) { g.far = far; g.outer.visible = !far; g.light.visible = far; } }
      for (const cs of cellShown) cs.o.visible = noLod || (bs > cs.s0 - CELL_REACH && bs < cs.s1 + CELL_REACH);
      for (const q of reefPart) { const n = !noLod && bs >= q.s ? q.kept : q.full; for (const mesh of q.meshes) if (mesh.count !== n) mesh.count = n; }
      let key = 0, bit = 1;
      for (const k of Object.keys(REACH)) { if (noLod || (bs > REACH[k][0] && bs < REACH[k][1])) key += bit; bit *= 2; }
      if (key === last) return;
      last = key; bit = 1;
      for (const k of Object.keys(REACH)) {
        const on = (key & bit) !== 0; bit *= 2;
        for (const o of zones[k].shown) o.visible = on;
        for (const o of zones[k].twins) o.layers.set(on ? 2 : 0);
      }
    },
  };
}
