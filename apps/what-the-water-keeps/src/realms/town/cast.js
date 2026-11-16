// The town below: the cast, group "Fish" (stage 3): the five schools and the fry.
// docs/build/town/3-cast-fish.md is this module's log; docs/art/town.md, section 5, is its brief (the rows "Fish
// schools" and "Fry"); docs/life/fish.md is the family both come from (makeSchool).
//
// "Fish keep its streets": flocks that read as one silhouette with one rose flash on the turn, absorbed in their own
// rounds. Fish do not see scenery, so every route here is threaded by hand through the modelled town, and checked
// against the set's own meshes with the probe below.
//
//   A   UP the main street: deep along the left of the carriageway and across it under the washing (s 109 to 71), then
//       up onto the leg that is SEEN: 5.5 m to starboard of the composed line, 3 m down, in front of the right bank's
//       lit ground-floor windows (s 57 to 36); round the head of the street; DOWN it along the lamp row, 1.3 m under
//       the lamp heads, parting round the seven posts. 30 m of ribbon, 540 fish. It waits out of sight with its head
//       at s 58.5 until the boat first reaches s 44 and then comes up the street past it (fishes.first)
//   B   round the tower ABOVE the hour ring's wheel, a metre over the crooks its lanterns hang from: a comet 10 m long
//       and up to 3 m wide over the lanterns' circle, on a gently wandering circle, keeping the ring's own pace
//   D   the leat: down it inside its walls (near half), back up it inside its far half, over the footbridge's parapets,
//       then out of the leat and UNDER the three washing lines 7 m to starboard of the composed line (s 92 to 78: the
//       page's postcard 4), and on up the street at the height of the right bank's ground-floor windows
//   C   (the system "inside": files and mills under a roof, no room for the hull) a thread through the church: in at
//       one open light of the south clerestory, along the nave, out at the other, and back along the lit lancets a
//       quarter of a metre off their stone: looking straight down over the port side from the composed line it is
//       between the rider and the lit glass. 240 fish
//   E   (the system "inside") under the market hall's glass: a MILL, 240 fish turning in a ring 2.4 by 3.1 m in the bay
//       between two trusses right under the lantern, 3.9 m down: six metres from the eye of a rider alongside the
//       glass ridge (the page's postcard 11)
//   fry six shoals just under the surface (over a roof awash on the right bank, before the half-lit gable's window,
//       before two missing panes of the glass ridge, at two of the tower's piers); one of each shoal sips at the
//       surface every few seconds while the boat is near. The lime's 120 are taken out (see "THE LIME'S 120")
//
// How a school fish is drawn here (SCHOOL_PAINT and what follows it): dark all over, broad across the back, never
// slimmed; far off a dash, never thinner on the screen than 1.9 pixels of half width; lit by the town's light, with a
// rose flash on the flank as it banks and, school by school, the street's light given back as rose by its flanks.
//
// Where the schools are when the boat comes ("where the schools are", near the end of build): set out for a boat
// left alone, and put on by that boat's time when the ride is entered part-way.
//
// The family builds its own gouache material and takes no `extend`, so the town's light is laid into the finished
// material from here (dress): after the family's own hooks, (1) the plain material's sum is put back and the flank's
// flash is kept aside, (2) the town's light (light.extendFor), which makes everything under the surface take the
// water's colour and dissolve with distance, (3) the flash is given back, lit by the town beneath the fish. All or
// nothing: if the family's material is not what this expects, the fish keep the family's look and the page says so.
//
// IN shared.cast AFTER THIS MODULE (nothing here plays a sound or places a cue of the showstopper):
//   fish        the family's handle for A, B, D (schools[0..2] in that order): schools[k].hold / .pace / .centre,
//               burst(k, { x, y, z }), threat(target, { radius, scare }), fishAt(i), put(k, metres), lock(k, fn)
//   fishChurch  the family's handle for the schools under a roof: C (schools[0]) and E (schools[1])
//   fry         the family's handle for the six shoals (schools[0..5])
//   fishes      this group's own:
//     names                 { A: ['fish', 0], B: ['fish', 1], D: ['fish', 2], C: ['fishChurch', 0], E: ['fishChurch', 1] } (ask this, not the order)
//     school(name)          the family's record of that school (centre, hold, pace, speed, L, long)
//     onTouch               ASSIGN a function (x, z, kind, name, info). kind 'pass': a ribbon is passing the hull
//                           (info: { distance, depth, ahead, seconds, under }: metres from the boat's plumb line to
//                           the ribbon's nearest point, how deep it is there, metres ahead (+) or astern (-) of the
//                           boat's middle that point lies, how long the ribbon will take to go by, and whether it
//                           is the family's own parting under the hull): the page's `flutter`, front to back.
//                           'burst': a shoal of fry has burst (info.why: 'hull' | 'threat' | 'cue'); 'boil': one of
//                           its five pin rings; 'sip': a fry has touched the surface (one ring; the page gives it no sound)
//     passing[name]         while a ribbon is within 12 m of the hull: { x, z, y, distance, ahead } of its nearest point, live
//     first                 the page's moment at s 44: { auto, s, head, waiting, wait(), go(seconds) }. While auto is
//                           true A hangs with its head abeam of s `head` (58.5) until the boat first reaches `s` (44)
//                           and is then let go over 2 s; the staging sets auto = false in its build and calls wait()
//                           and go() itself, or leaves auto alone and only adds the sound (cast.fish.schools[0].hold
//                           is the number both move)
//     threat(target, opts)  something large (an Object3D, or a function returning [x, y, z]) that every school and
//                           shoal keeps clear of: opts { radius 1.2, scare false (ribbons only part), fry true (a
//                           shoal of fry bursts when it comes in: the lime's shoal lifts off) }. Returns { remove() }
//     lift()                the lime's shoal lifts off (a fright from below) and settles again in 4 s: it does
//                           nothing now, the lime's shoal being taken out (it is kept so that a caller need not ask)
//     ring                  B and the hour ring: { locked, offset (radians behind lantern 0 that B's tail keeps),
//                           wander (metres by which it drifts ahead of that place and back; 0 bolts it to the wheel) }
//     metres(name, s, leg)  how far along its route a school is when it is abeam of route distance s (leg: 'up' or
//                           'down' the street, for A and D), for put()
//     handsOff(s)           seconds a boat left alone takes to come as far as s (the schools are set out by it)
//
// Developer switches (address):
//   &fish=A,B,D,E,C,fry,lime   build only these (the lime's shoal is built only when it is named here)
//   &fishraw=1                 the family's own look (the town's light not laid in)
//   &fishcam=right,up,back     a crane: the eye moved that many metres from the rider's own (pictures only)
//   &fishprobe=name.json       the least room every route has from the set's own meshes, written to .shots/
//   &fishray=s:d,s:d,...       with &fishprobe: what a plumb line at each place meets, from the surface down
//   &fishat=A:0,D:-8           put a school's middle abeam of the boat (plus so many metres along its route)
//   &fishfirst=0               A does not wait for the boat at s 44
//   &fishlock=0                B is let go from the hour ring (so that &fishat=B:0 can put it where a picture wants it)
//   &fishburst=<k | lime>,<seconds>   a fright in shoal k of the fry at that time, from the boat (lime: fishes.lift())
//   &fishlog=1                 print where things are (&fishlog=touch: every 'pass' and 'burst' the staging would hear,
//                              as it happens, and nothing else; &fishlog=touchall: the rings too)
//   numbers: &fishlit= &fishflash= &fishfloor= (the dressing), &fishhull= (the hull's room, metres)
import * as THREE from 'three';
import { makeSchool, SPECIES } from '../../engine/life/fish.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('fish') || '').split(',').map((v) => v.trim()).filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);
const note = (msg) => console.error('INVALID_ note (cast, fish): ' + msg);
const RAW = Q.has('fishraw'), LOGALL = Q.has('fishlog') && !/^touch/.test(Q.get('fishlog') || '');
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };
const ROUTE_N = 1024;                                // samples of a route in the family's texture (src/engine/life/fish.js)
// The school fish as painted and drawn here (second holder).
//   paint   the page's dark plum; flank and belly only a step paler. With the family's example flank (#5e3f5c) every fish
//           over a lit street was a pale lilac streak: the rose of a flank is its FLASH as it banks, not its paint.
//   lit     the share of a lamp's pool a fish takes (roofs 0.25, walls 0.3 to 0.6): little. A school is a dark shape
//           against the town's light, not a thing the street lamps light.
//   refract how far a fish is drawn as slim as the surface would show it: NOT AT ALL here (the family's 1: seen at 30
//           degrees its height is halved, and a 28 cm fish ten metres off is a scratch of 37 by 4 pixels; among window
//           bars and rails it cannot be told from them). Everything else under this water is drawn along the straight
//           line of sight (the set's walls, posts and roofs are not flattened), and so are the town's ribbons: a fish
//           keeps its depth, a spindle with a tail, and stays the size of the things it swims among.
const SCHOOL_PAINT = { back: '#2a1838', flank: '#40284a', belly: '#5c4060', fin: '#33203c', finEdge: '#33203c', dusky: '#2a1838' };
const SCHOOL_LIT = num('fishlit', 0.22), REFR = num('fishrefr', 0), SCHOOL_PX = 1.9;
//   body    broad across the back: 0.166 of its length where the family's is 0.104 (a real roach: 0.10 to 0.13). What the
//           rider sees of a school is its backs, and from above the family's fish, ten metres down, is a line 30 pixels
//           long and 3 wide: a scratch on the picture (the page: "no line thinner than 6 cm under water"). Its depth and
//           its outline from the side are the family's. Beyond about ten metres the floor on the screen (SCHOOL_PX,
//           pixels of half width: see FISH_FLOOR) keeps it that plump.
const BROAD = num('fishbroad', 1.6);
const SCHOOL_SPECIES = { like: 'school', profile: SPECIES.school.profile.map((q) => [q[0], q[1], q[2], q[3] * BROAD]), far: SPECIES.school.far.map((q) => [q[0], q[1], q[2], q[3] * BROAD]) };

// ====================================================================================================== the town's light
// One more gouache extension for a gouache material that already exists: the hooks stay in a gouache shader as
// comments, so this fills them exactly as makeGouache does, after whatever is there.
const HOOKS_V = ['vertexPars', 'vertexLocal', 'vertexWorld'], HOOKS_F = ['fragmentPars', 'albedo', 'light', 'fog', 'final'];
function canWear(material, hooks) {
  if (!material || !material.isGouache || typeof material.fragmentShader !== 'string') return false;
  for (const h of hooks) if (!(HOOKS_V.includes(h) ? material.vertexShader : material.fragmentShader).includes(`//@${h}`)) return false;
  return true;
}
function wear(material, ex) {
  for (const h of HOOKS_V) if (ex[h]) material.vertexShader = material.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  for (const h of HOOKS_F) if (ex[h]) material.fragmentShader = material.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  if (ex.defines) Object.assign(material.defines || (material.defines = {}), ex.defines);
  if (ex.uniforms) Object.assign(material.uniforms, ex.uniforms);
  material.needsUpdate = true;
}
// (1) After the family's own light: the family lights a fish for open water under a sky (the sky's light from above,
// the realm's key light, a flash lit by the sky). Here the town lights it, as it lights every roof and wall under the
// surface, and the town's hook expects to find the plain material's sum in `c`: so that is put back, and the flank's
// flash (the family's lozenge on the fore flank of a fish that rolls into a turn) is worked out again and kept aside.
const FISH_BEFORE = /* glsl */`{
      float tfAlong = smoothstep(-0.36, -0.06, vModel.z) * (1.0 - smoothstep(0.2, 0.44, vModel.z));
      gTfFlash = uTfFlash.rgb * (vFish.x * max(vFish.y, 0.0) * tfAlong * smoothstep(0.15, 0.85, N.y));
      c = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient + albedo * lamps;
    }`;
// (3) After the town's light: the flash again. A flank is a mirror, and what it shows as it rolls is the lit town
// beneath the fish: bright over a lit street, a faint pale glint over a dark lane (uTfFlash.a).
// And (second holder) the town's light from BELOW, on flanks and bellies only, school by school (uTfUnderK; uTfFlashK
// is each school's share of the flash): a school shows the light of the lit town beneath it on its sides; its back
// stays dark, so that from straight above, against a lit floor, it is still a dark shape.
// (Third holder: that light used to fall on the fish's own paint, which is all but black: nothing came of it but
// where it was nine tenths strong, under the hall's jade. A flank is a mirror: it now gives back the street's
// lamplight as rose (uTfRose: "dark, with a rose flank"), a little for every school, so that a fish over an unlit
// stretch of street is a dark back with a warm lower edge and not a hole in the picture. uTfJadeK: how far the
// light under glass is jade for a school: the mill under the market hall turns round a warm lamp.)
const FISH_AFTER = /* glsl */`int tfK = int(clamp(vTfK, 0.0, 7.0) + 0.5);
      c += gTfFlash * (uTfFlashK[tfK] * (uTfFlash.a + (1.0 - uTfFlash.a) * min(gTownL * 1.5, 1.0)));
      { vec3 tfCol = mix(uTownStreet, uTownJade, clamp(gTown.g * 1.4, 0.0, 1.0) * uTfJadeK[tfK]);
        tfCol = mix(vec3(dot(tfCol, vec3(0.35, 0.5, 0.15))), tfCol, 0.45);      // (the lamplight's brightness, half its orange: rose times orange is red, and a school over a lit street was a trail of embers)
        c += uTfRose * tfCol * (uTfUnderK[tfK] * min(gTownL * 1.5, 1.0) * clamp(0.5 - 0.6 * N.y, 0.0, 1.0)); }`;
// (0) To be seen at all. The town's water never lies still: it bends what is under it everywhere, so what the rider
// sees of a fish is not the fish as the screen drew it but the water's own picture of the scene beneath (three
// quarters of the screen's size), bent. In that picture the family draws every fish a pixel and a half slimmer (on
// still water it is only the difference the water makes, and a fat copy would fringe the fish), and leaves out one
// that is too thin for that: here, every school fish beyond six metres. So in this water (a) the fish is drawn into
// that picture as it is, and (b) a far fish keeps a floor on the screen: its BODY is thickened about its axis until
// its half width is uTfPx pixels (its length is left alone: far off it is a dash, never a dot).
// (Third holder. The floor used to multiply everything that stands off the axis by up to four: the tail's fork and
// the body's depth with its width, so that 26 m off a fish was as tall as it was long with a tail fin as tall again:
// school B was a garland of torn black leaves on the hour ring, and so was the far end of every ribbon. Now: the
// width grows by at most uTfMaxK, school by school (2.4: a dash three lengths to one; 3 for the school on the hour
// ring, which is never nearer than 22 m), the depth only once the width has overtaken it (a far fish is round in
// section), and the fins not at all: the tail fin stays a blade the size it is.)
const FISH_FLOOR = /* glsl */`{
      vec3 tfA = vec3(fP0.x, fMidY + fishSwell(fP0.xz), fP0.z), tfO = transformed - tfA;
      float tfZ = dot(tfO, fF);
      vec3 tfP = tfO - fF * tfZ;
      float tfS = clamp(uTfPx * uStreak.z * distance(uCameraPos, tfA) / (0.5 * aSt.w * uBody.y), 1.0, uTfMaxK[int(clamp(aW.w, 0.0, 7.0) + 0.5)]);
      if (aPart >= 0.0 && tfS > 1.0) {
        float tfW = dot(tfP, fL2), tfH = dot(tfP, fU2);
        float tfV = max(1.0, tfS * uBody.y / max(uBody.x, 1e-4));
        transformed += fL2 * (tfW * (tfS - 1.0)) + fU2 * (tfH * (tfV - 1.0));
      }
    }`;
function keep(handle, px, pxMax) {
  const mesh = handle && handle.object, m = mesh && mesh.material, U = handle && handle.uniforms;
  if (!mesh || !U || !U.uInPre) return false;
  const fam = mesh.onBeforeRender;
  mesh.onBeforeRender = function (r, sc, cam, g, mt, gr) { fam.call(this, r, sc, cam, g, mt, gr); U.uInPre.value = 0; };
  if (canWear(m, ['vertexPars', 'vertexLocal']) && m.vertexShader.includes('fMidY') && m.vertexShader.includes('uStreak') && m.vertexShader.includes('uBody'))
    wear(m, { uniforms: { uTfPx: { value: num('fishpx', px) }, uTfMaxK: { value: Array.from({ length: 8 }, (_, i) => num('fishpxmax', pxMax && pxMax[i] != null ? pxMax[i] : 2.4)) } }, vertexPars: 'uniform float uTfPx, uTfMaxK[8];', vertexLocal: FISH_FLOOR });
  else note('the fish family\'s vertex shader is not what this module expects: far fish have no floor on the screen');
  if (canWear(m, ['vertexPars', 'vertexLocal']) && m.vertexShader.includes('aW')) wear(m, { vertexPars: 'varying float vTfK;', vertexLocal: 'vTfK = aW.w;' });      // which school a fish is of, for the fragment shader
  return true;
}
function dress(handle, light, o = {}) {
  const m = handle && handle.object && handle.object.material;
  keep(handle, o.px ?? 1.2, o.pxMax);
  if (RAW) return false;
  if (!canWear(m, ['fragmentPars', 'albedo', 'light', 'fog', 'final']) || !m.fragmentShader.includes('vFish') || !m.fragmentShader.includes('vModel')) {
    note('the fish family\'s material is not what this module expects: the fish keep the family\'s own look (lit by the boat\'s light, swallowed by the engine\'s water only)');
    return false;
  }
  const col = new THREE.Color(o.flash || '#f0a8b8').multiplyScalar(num('fishflash', o.strength ?? 0.8));
  if (!m.vertexShader.includes('vTfK')) { note('the fish family\'s vertex shader has no school index: the fish keep the family\'s own look'); return false; }
  const per = (list, d) => Array.from({ length: 8 }, (_, i) => (list && list[i] != null ? list[i] : d));
  wear(m, { uniforms: { uTfFlash: { value: new THREE.Vector4(col.r, col.g, col.b, num('fishfloor', o.floor ?? 0.3)) }, uTfUnderK: { value: per(o.under, 0) }, uTfFlashK: { value: per(o.flashK, 1) }, uTfJadeK: { value: per(o.jade, 1) },
      uTfRose: { value: new THREE.Color(o.rose || '#d98aa0').multiplyScalar(num('fishrose', o.roseK ?? 0.5)) } },
    fragmentPars: 'vec3 gTfFlash; uniform vec4 uTfFlash; uniform vec3 uTfRose; uniform float uTfUnderK[8], uTfFlashK[8], uTfJadeK[8]; varying float vTfK;', light: FISH_BEFORE });
  wear(m, light.extendFor(num('fishlit', o.lit ?? 0.6)));
  wear(m, { light: FISH_AFTER });
  // The town nets everything that faces up near the surface with moving light, and adds it whatever the paint (a dark
  // roof must show its nets). On a dark fish that light is three times the fish: pale, striped mackerel. This material
  // is given a net colour of its own under the town's name, a share of the town's, kept in step every frame.
  if (m.uniforms.uTownNet && light.U.uTownNet) { const own = { value: new THREE.Color() }, k = num('fishnet', o.nets ?? 0.12); m.uniforms.uTownNet = own; handle.townNet = () => own.value.copy(light.U.uTownNet.value).multiplyScalar(k); handle.townNet(); }
  return true;
}

// ====================================================================================================== routes
/** The baked route of school k of a system, as the family holds it: sample i of 1024, evenly by distance. */
function routeSample(handle, k, i, out) {
  const d = handle.fish.routeData, o = 2 * k * ROUTE_N * 4 + (((i % ROUTE_N) + ROUTE_N) % ROUTE_N) * 4;
  out[0] = d[o]; out[1] = d[o + 1]; out[2] = d[o + 2]; out[3] = d[o + 3];
  return out;
}
/** Where a route is `m` metres along it (the nearest sample: fine for looking and for the hull's distance). */
function routeAt(handle, k, m, out) { const L = handle.schools[k].L; return routeSample(handle, k, Math.round((((m % L) + L) % L) / L * ROUTE_N), out); }

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const light = ensureLight(ctx, plan, shared), town = light.town, F = plan.floorAt;
  const P = (s, d, y, width = 1) => { const [x, z] = town.xz(s, d); return [x, y, z, width]; };
  const mine = new Set(), systems = {}, routes = {};        // my meshes; the family's handles by name; what each school is
  const fishes = shared.cast.fishes = { names: {}, onTouch: null, passing: {}, first: null, ring: null };
  const touch = (sys) => (x, z, kind, k, why) => {
    if (!fishes.onTouch) return;
    const name = Object.keys(fishes.names).find((n) => fishes.names[n][0] === sys && fishes.names[n][1] === k) || (sys === 'fry' ? 'fry' + k : sys + k);
    if (kind === 'pass') { const p = fishes.passing[name]; fishes.onTouch(x, z, 'pass', name, { distance: p ? p.distance : 0, depth: p ? -p.y : 0, ahead: p ? p.ahead : 0, seconds: p ? p.seconds : 0, under: true }); }
    else fishes.onTouch(x, z, kind, name, { why });
  };

  // ---------------------------------------------------------------------------------------------- A, B, D: one system (E's place is set out among them, C's after them; both are built as the system "inside")
  const list = [];
  // A: the main street. UP it (toward the arriving boat): first along the LEFT of the carriageway, deep, under the
  // washing lines at s 92 and 84 (their hems hang 7.5 to 7.9 m down there), and across the street under the one at
  // s 78; then up the right, under the line at s 70 (hems 5.5 to 5.7 m down), rising to the leg that is SEEN: from s 57
  // to 36 it runs 5.5 m to starboard of the composed line and 3 m down, over the heads of the street lamps that stand
  // at d 4.6: abeam it is looked down on at 37 degrees, 7 m off, and the sight through it ends on the right bank's lit
  // ground-floor windows ("30 m of dark ribbon against the windows"). Round at the head of the street, clear of the
  // first terrace's eaves. DOWN it along the lamp row, 1.3 m under the lamp heads and 2.9 m over the raised walk,
  // parting round the seven posts, sinking with the street (2 m over the walk, as the first holder had it, every fish
  // was a dark dash among the dark bars of the walk's rail; at this height the sight through the ribbon ends on the
  // left row's roof); round again short of the church's west front.
  // (Third holder: from s 109 to 70 it used to come up the RIGHT of the street, 7.6 m to starboard: that is the water
  // under the washing where school D is shown now, and two ribbons in one place swim through each other. On the left
  // it lies under the keel's line, deep: it is not meant to be seen there. Where it crosses back, between s 81 and
  // 71, it is 7 to 8 m down under the boat's own line: a boat that comes over it parts it, as the page has it.)
  if (want('A')) {
    const walkY = (s) => F(s) + 4.4 + num('fishay', 2.9), AD = num('fishad', -5.75), near = num('fishan', 5.5), ny = num('fishany', -3.0), LD = num('fishald', -1.8), r = [];
    for (const [s, d, y, w] of [[109, LD, -9.6, 0.8], [100, LD, -9.4, 0.8], [92, LD + 0.2, -9.0, 0.8], [86, LD + 0.6, -8.7, 0.8], [81.5, 0.4, -8.3, 0.8], [78, 2.6, -7.7, 0.8], [74.5, 5.0, -7.0, 0.8], [70.5, 6.9, -6.45, 0.8], [67.5, 6.55, -5.8, 0.85], [64.5, 6.2, -4.85, 0.95], [61, near + 0.3, -3.8, 1],
      [57, near, ny - 0.1, 1], [51, near, ny, 1], [44, near, ny, 1], [36, near - 0.1, ny, 1]]) r.push(P(s, d, y, w));
    r.push(P(30.6, 4.0, ny, 0.95), P(28.3, -0.8, -2.6, 0.85), P(30.2, -4.6, -2.0, 0.7));
    for (const s of [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108]) r.push(P(s, AD, walkY(s), 0.55));
    r.push(P(112.6, AD + 0.2, walkY(112.6) - 0.35, 0.6), P(115.3, -5.0, -9.0, 0.7), P(116.5, -3.6, -9.4, 0.75), P(115.3, -2.2, -9.6, 0.8));
    const posts = plan.lampRow.s.slice(0, 7).map((s) => { const [x, z] = town.xz(s, plan.lampRow.d); return { x, z, r: 0.1, clear: 0.3 }; });
    list.push({ name: 'A', count: num('fishacount', 540), route: r, long: num('fishal', 30), speed: num('fishav', 1.05), posts, start: 0.05, spread: [num('fishaw', 1.05), 0.42] });
  }
  // B: round the tower with the hour ring (see "the hour ring" below for the lock).
  // (Fourth holder. The second had it on the lanterns' own circle, 1.2 m wide and 30 m long: a garland hung on the iron.
  // The third made it a comet 14 m long INSIDE the wheel, a metre over the spokes, between the collar and the lantern
  // standards: there it has 1.8 m of room, the family's ribbon keeps most of its fish within the middle third of its
  // width, and what the rider saw from 27 m was a dark thread lying along the collar: dirt on the ring
  // (town_fi4_07_B26_crop.png). A school 27 m off can only be read as a SHAPE: so it swims ABOVE the wheel now, a metre
  // over the crooks the lanterns hang from, where nothing stands but the tower's shaft: a comet 10 m long and up to 3 m
  // wide over the lanterns' circle, its blunt head leading, the lit flags and the turning lights under it
  // (town_fi4_24_B26_crop.png). Room: the shaft's corners reach 4.95 m from the axis, the lanterns' crooks top out
  // 18.45 m down; the ribbon keeps beyond 5.6 m and above 17.8 m down.)
  let ringDir = 1;
  const tw = town.xz(plan.tower.s, plan.tower.d), HR = plan.tower.hourRing;
  const ringHook = (() => { const ring = shared.clock && shared.clock.ring; try { return ring && ring.point ? ring.point('hook0', new THREE.Vector3()).y : null; } catch (e) { return null; } })();
  const ringR = num('fishbr', 7.3), ringY = num('fishby', (Number.isFinite(ringHook) ? ringHook : HR.y + HR.standard - 0.15) + 1.05);
  if (want('B')) {
    const ring = shared.clock && shared.clock.ring, rig = ring && ring.rig, part = rig && rig.byName && rig.byName.ring;
    if (part && rig.value && rig.set && ring.lantern) {       // which way the lanterns go round the axis as the ring turns (measured, not assumed)
      const v = new THREE.Vector3(), ang = () => { ring.lantern(0, v); return Math.atan2(v.z - tw[1], v.x - tw[0]); };
      const v0 = rig.value('ring'), a0 = ang(); rig.set('ring', v0 + 0.02 * (Math.sign(part.k) || 1)); const a1 = ang(); rig.set('ring', v0);
      ringDir = Math.sign(wrap(a1 - a0)) || 1;
    }
    // It does not swim a ruled circle: the stream wanders in and out by a hand or two as it goes round (five uneven
    // bends to the lap), so that the school snakes, and its flanks catch the lanterns' light at each bend. The bends
    // stand still while the wheel turns under them.
    const weave = num('fishbweave', 1), r = [];
    for (let j = 0; j < 64; j++) { const a = ringDir * TAU * j / 64, rr = ringR + weave * (0.2 * Math.sin(5 * a + 0.6) + 0.1 * Math.sin(3 * a + 2.1)); r.push([tw[0] + rr * Math.cos(a), ringY + weave * 0.14 * Math.sin(3 * a + 1.1), tw[1] + rr * Math.sin(a), 1]); }
    list.push({ name: 'B', count: 360, route: r, long: num('fishbl', 10), speed: TAU * ringR / (HR.period || 96), spread: [num('fishbw', 1.5), 0.3], start: 0 });
  }
  // D: the leat, the walled channel at the foot of the right bank's fronts (its walls stand 0.9 m over the street, its
  // own bed lies at street level). DOWN it the school swims INSIDE it, in its near half, under the copings (this is
  // the leg that goes the boat's way: it lies under the gunwale's line). At the leat's end it turns and comes back UP
  // inside the far half, and pours over the footbridge's two parapets like water over a weir (the model's arch sags,
  // 0.3 to 0.8 m clear of the bed: no school can pass under it; see the log, "Asked of the set"). From the bridge it
  // keeps rising, out of the leat: over the rope of the low washing line at s 97, and then UNDER the three street
  // lines at s 92, 84 and 78, seven metres to starboard of the composed line and half a metre under their hems (8.1,
  // 7.0 and 6.85 m down): the page's "school of fish pouring under them", looked down on at 45 to 50 degrees from the
  // composed line, the right bank's lit ground-floor windows behind it. Above s 70 it runs at the height of the upper
  // street's ground-floor windows, a metre and a half off their wall, to the head of the street, and turns back into
  // the leat. (The far half of the leat is not used above s 104: the set's bed sheet, a 4 m grid, stands up to 1.4 m
  // over the leat's own bed there.)
  // (Third holder: under the washing it swam ten metres down over the unlit leat, 1.3 m off the fronts: in postcard 4
  // it was a smear on a dark street. Second holder: it swam half a metre over the copings both ways, through the
  // washing at s 96.)
  if (want('D')) {
    const fb = plan.street.footbridge, hop = (s) => 2.3 * Math.exp(-((s - fb.s) * (s - fb.s)) / 10), r = [];
    const dn = num('fishdd', 7.3), up = num('fishdu', 9.6), front = num('fishdf', 8.0), win = num('fishdw', 2.3), wd = num('fishdwd', 7.0);      // (front: the fronts' shells stand at d 10, with ledges and one shop front out to 9.3)
    // (Fourth holder: since 01:04 on 8 November things LIE in the leat (kit_street.js, "the right of the street": a skiff
    // sunk at s 79, heeled against the near wall; milk churns at s 66; a cart wheel; shared.kitProps has their places),
    // and the down leg swam through the skiff's planking. The school lifts over whatever lies in its half of the
    // leat as it lifts over the footbridge: a metre over a sunk skiff, less over small things.)
    const Lt = plan.street.leat, lying = (shared.kitProps || []).filter((q) => q && q.d > Lt.d0 + 0.3 && q.d < Lt.d1 - 0.3 && q.s > 46 && q.s < 119 && /skiff|churn|wheel|barrel|crate|cart|bench/.test(q.name))
      .map((q) => ({ s: q.s, d: q.d, half: /skiff/.test(q.name) ? 2.0 : 0.8, rise: /skiff/.test(q.name) ? 1.0 : /wheel/.test(q.name) ? 0.35 : 0.75, reach: /skiff/.test(q.name) ? 1.9 : 1.5 }));
    const over = (s, d) => { let h = 0; for (const q of lying) if (Math.abs(q.d - d) < q.reach) h = Math.max(h, q.rise * (1 - smooth(q.half, q.half + 1.6, Math.abs(s - q.s)))); return h; };
    const inY = (s, d = dn) => F(s) + 0.62 + hop(s) + over(s, d);
    const downAt = [50, 58, 68, 78, 88, 96, 100, 102, 104, 106, 108, 113, 118];
    for (const q of lying) if (Math.abs(q.d - dn) < q.reach) downAt.push(q.s - q.half - 1.7, q.s - q.half * 0.6, q.s + q.half * 0.6, q.s + q.half + 1.7);
    downAt.sort((u, v) => u - v);
    r.push(P(38, dn, F(38) + 2.0, 0.55), P(44, dn, F(44) + 1.3, 0.55));
    { let last = 44; for (const s of downAt) { if (s - last < 1.3 || s > 118.5) continue; last = s; r.push(P(s, dn, inY(s), 0.55)); } }
    r.push(P(120.5, dn + 0.3, inY(120.5), 0.5), P(121.5, (dn + up) / 2, inY(121.5), 0.45), P(120.5, up - 0.3, inY(120.5), 0.5));
    for (const s of [118, 113, 108, 106, 104]) r.push(P(s, up, inY(s, up), 0.55));
    // (Fourth holder: under the washing the ribbon is let out to nine tenths of its width, and swims a hand lower for
    // it: at six tenths it was a line of dashes one fish wide, ants on a path; a school is as broad as its water lets it be.)
    const ww = num('fishdww', 0.9), wy = num('fishdwy', -0.17);
    for (const [s, d, y, w] of [[101.4, 8.9, -10.75, 0.55], [98.8, 8.5, -9.8, 0.55], [96.6, 8.1, -9.2, 0.6], [94, 7.5, -8.6 + wy * 0.5, 0.72], [91.5, wd, -8.1 + wy, ww], [88, wd + 0.15, -7.6 + wy, ww], [84.3, wd + 0.3, -7.0 + wy, ww], [81.2, wd + 0.2, -6.9 + wy, ww], [78.3, wd + 0.1, -6.85 + wy, ww], [74.5, 7.5, -7.3, 0.75]]) r.push(P(s, d, y, w));      // (at s 84 it passes the gap in that line's washing, between the tall sheet at d 5.4 and the cloths from d 8.9 on: half a metre from the sheet's edge)
    for (const s of [70, 60, 50, 40]) r.push(P(s, front, F(s) + win, 0.6));
    r.push(P(36, front - 0.2, F(36) + win, 0.55), P(34.6, (dn + front) / 2, F(34.6) + win - 0.1, 0.45), P(35.6, dn + 0.2, F(35.6) + win - 0.2, 0.5));
    list.push({ name: 'D', count: 360, route: r, long: num('fishdl', 18), speed: 0.95, start: 0.2 });      // (fourth holder: 18 m for 22: the same fish closer together)
  }
  // E: under the market hall's glass (the page, the close band: "a school of fish turning under the glass"; postcard
  // 11: "the market hall 23 m deep with its stalls, lamps and a turning school"). A MILL: a ring of fish turning in
  // the bay between two of the hall's trusses, right under the lantern, three to four metres down: from alongside the
  // glass ridge it is six metres from the eye, looked down on at 45 degrees through the lantern's own panes, the
  // hall's lamps and stalls far below it.
  // (Fourth holder. The third had it as a wheel round the rod of one hanging lamp, ten metres down and fourteen from
  // the eye: twelve-pixel fish, teal on teal, behind two layers of iron: postcard 11 at its own size showed a few pink
  // flecks beside a lamp (town_fi4_05_E11_f00.png). The first two had it filing the length of the hall through the
  // trusses' bays: nothing turned. Now it turns where it can be seen.
  // Room (source-art/models/town/market_hall.py; metres from the hall's axis, y from the water): the trusses stand
  // every 4.4 m along the hall, each a plane of iron (the lamps hang in those planes, so the bays are told from the
  // lamps' places); between two of them nothing crosses the hall but the roof itself, whose ironwork is 2.0 m down
  // under the lantern (to 1.6 m either side of the axis) and falls away at 48 degrees beyond: 3.0 m down at 2.5 m off
  // the axis. So: fish no nearer a truss than 0.3 m, none higher than 3.5 m down, none further off the axis than 2.6.
  // The ring's middle lies 0.4 m beyond the hall's axis from the boat, 4 m down: seen from alongside, the lantern's
  // curb (a band of iron across the view) crosses the ring's empty middle, the near arc shows under it through the
  // great slope's panes, over the far row's lamp pools, and the far arc over it through the lantern's own side. A
  // rider who asked for reduced motion does not lean out (set.js), and his own gunwale hides everything steeper than
  // 43 degrees: he has the far arc (town_fi4_39_E_calm.png).
  // It is a school of the system "inside" (with C): under a roof the hull's room must not push fish through glass.)
  const inner = [];
  if (want('E')) {
    const G = shared.glassRidge, hf = G && G.frame;
    if (hf && hf.local && hf.at && G.lamps && G.lamps.length) {
      const side = Math.sign(hf.local(...town.xz(174, 0))[1]) || 1, aim = hf.local(...town.xz(num('fishes', 176.6), plan.hall.d))[0];      // which side of the ridge the square lies on; where postcard 11 looks
      const planes = [...new Set(G.lamps.filter((q) => q && Number.isFinite(q.x)).map((q) => Math.round(hf.local(q.x, q.z)[0] * 10) / 10))].sort((u, v) => u - v);
      let bay = null; for (let i = 0; i + 1 < planes.length; i++) { const m = (planes[i] + planes[i + 1]) / 2; if (planes[i + 1] - planes[i] > 3 && (!bay || Math.abs(m - aim) < Math.abs(bay.m - aim))) bay = { m, half: (planes[i + 1] - planes[i]) / 2 }; }
      if (bay) {
        const rx = num('fishew', 0.62), Ra = Math.min(num('fishera', 1.2), bay.half - 0.5 - rx * 0.9), Rb = num('fisherb', 1.5), y0 = num('fishey', -4.05), off = num('fisheo', -0.4), turn = num('fishedir', 1), r = [];
        for (let j = 0; j < 24; j++) { const a = turn * TAU * j / 24, w = 1 + 0.05 * Math.sin(3 * a + 0.8), q = hf.at(bay.m + Ra * w * Math.cos(a), y0 + 0.1 * Math.sin(2 * a + 0.3), side * (off + Rb * w * Math.sin(a))); r.push([q[0], q[1], q[2], 1]); }
        const round = Math.PI * (3 * (Ra + Rb) - Math.sqrt((3 * Ra + Rb) * (Ra + 3 * Rb)));
        // (a mill has no head and no tail: the family's `file` strings the fish evenly round the ring, a band 1.2 m wide)
        inner.push({ name: 'E', count: num('fishen', 240), route: r, form: Q.get('fisheform') || 'file', long: num('fishel', 0.97 * round), speed: num('fishev', 0.62), spread: [rx, 0.32], start: 0.1, rx, ry: 0.32 });
      } else note('the market hall\'s lamps do not tell its bays: school E is left out');
    } else note('the market hall publishes no frame or lamps (shared.glassRidge): school E is left out');
  }
  if (list.length) {
    const h = systems.fish = makeSchool(ctx, {
      species: SCHOOL_SPECIES, length: num('fishlen', 0.28), vary: 0.12, spread: [1.3, 0.5], seed: 41, refract: REFR,
      colors: SCHOOL_PAINT,
      flash: { color: '#f0a8b8', strength: 0.8, self: 0.6 },
      hull: { radius: num('fishhull', 2.8), depth: 8 }, burst: { trigger: 2.4 },
      schools: list.map((s) => ({ count: s.count, route: s.route, long: s.long, speed: s.speed, posts: s.posts, start: s.start, spread: s.spread })),
      onTouch: touch('fish'),
    });
    // school by school: the street's light on flanks (A little: it is shown against lit windows and must stay a dark
    // shape; D much: it is shown over a street that is dark between its lamps; B none: a dark comet on firelit flags),
    // each school's share of the flash, and how fat a far fish may be drawn
    const per = (o) => list.map((q) => o[q.name] ?? o._);
    dress(h, light, { lit: SCHOOL_LIT, px: SCHOOL_PX, flash: '#f0a8b8', strength: 0.75, floor: 0.3, rose: '#f2b6c6', roseK: 0.5,
      under: per({ A: num('fishau', 0.25), B: num('fishbu', 0), D: num('fishdun', 0.8), _: 0 }),
      flashK: per({ B: num('fishbflash', 1.6), _: 1 }), pxMax: per({ B: num('fishbpx', 3.0), _: 2.4 }) });
    mine.add(h.object); shared.cast.fish = h;
    list.forEach((s, k) => { fishes.names[s.name] = ['fish', k]; routes[s.name] = { sys: 'fish', k, rx: (s.spread || [1.3, 0.5])[0], ry: (s.spread || [1.3, 0.5])[1], long: s.long }; });
  }

  // ---------------------------------------------------------------------------------------------- C: the church; and the system "inside" (C and E)
  // In at one open light of the south clerestory, along the nave, out at the other, and back along the flank: a loop
  // of some 24 m, and the school is strung round nearly all of it, so that fish are always leaving one window and
  // entering the next. An open light is 0.57 m wide and 2.6 m tall: a ribbon cannot pass it, a FILE can (0.4 m
  // across, 1.1 m deep). Inside, the tie beams cross 2.05 to 2.35 m down and the lamps hang on the axis: the file
  // keeps under the beams and 1.15 m off the axis. The hull floats right over this flank: its room (which would push
  // fish through the wall) is not given here.
  if (want('C') && shared.church && shared.church.open && shared.church.frame) {
    const cf = shared.church.frame, O = {}; for (const o of shared.church.open) O[o.name] = o.at;
    if (O.s2 && O.s5) {
      const [l2, d2] = cf.local(O.s2.x, O.s2.z), [l5, d5] = cf.local(O.s5.x, O.s5.z), sg = Math.sign(d2) || 1, wall = (Math.abs(d2) + Math.abs(d5)) / 2;
      // (Third holder: outside, the file used to run 0.95 m off the glass, 2.3 m down: from the composed line, 2.4 m off
      // the glass, that is under the rider's own gunwale. Now it climbs from the light it leaves to the height of the
      // lancets' heads, runs along them a quarter of a metre off the stone, and comes down to the light it enters:
      // looking straight down over the side, the rider has the stream between himself and the lit glass.
      // The church's own measures (source-art/models/town/church.py), from the glass: the wall's face stands 0.2 m
      // out, the gables' copings 0.26, the lancets' sills 0.31 (3.6 to 3.8 m down), and in the 0.7 m between two gables
      // an eaves course 0.46 (2.66 to 2.84 m down; above it the main roof has drawn back behind the glass).
      // So: above 2.5 m down the file may hug the stone; lower, it keeps 0.7 m out.)
      const yw = Math.min(-2.2, (O.s2.y + O.s5.y) / 2 - 0.25), yo = num('fishcyo', -1.9), yn = num('fishcy', -3.3), off = num('fishcout', 0.45), inn = wall - 1.65;
      const C = (ls, ld, y) => { const q = cf.at(ls, y, sg * ld); return [q[0], q[1], q[2], 1]; };
      // (an open light is one half of a two-light lancet, 0.57 m wide: the file passes through the middle of it, which is
      // 0.035 m further from the lancet's own centre line than the point the model gives)
      const mid = (name, l) => { const L = (shared.church.lancets || []).find((q) => q.name === name); return L && L.at ? l + 0.035 * (Math.sign(l - cf.local(L.at.x, L.at.z)[0]) || 0) : l; };
      const m2 = mid('s2', l2), m5 = mid('s5', l5), half = Math.abs(m5 - m2) / 2;
      const end = (l, e) => [C(l + e * Math.min(3.4, half - 0.6), wall + off, yo), C(l + e * 2.5, wall + off + 0.05, yo + 0.22 * (yw - yo)), C(l + e * 1.6, wall + 0.70, yo + 0.46 * (yw - yo)), C(l + e * 0.70, wall + 0.70, yo + 0.76 * (yw - yo)),
        C(l + e * 0.21, wall + 0.50, yo + 0.92 * (yw - yo)), C(l, wall, yw), C(l, wall - 0.55, yw - 0.12),
        C(l, wall - 0.9, yw - 0.2), C(l + e * 0.22, wall - 1.43, yn + 0.1), C(l + e * 0.75, inn, yn), C(l + e * 2.6, inn, yn)];
      const r = [C((m2 + m5) / 2, wall + off, yo), ...end(m2, 1), C((m2 + m5) / 2, inn, yn), ...end(m5, -1).reverse()];
      let est = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; est += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); }
      inner.unshift({ name: 'C', count: num('fishcn', 240), route: r, form: 'file', spread: [0.17, 0.45], long: est * 0.93, speed: 0.85, start: 0.1, rx: 0.17, ry: 0.45 });
    } else note('the church has no open lights s2 and s5: school C is left out');
  }
  // The system "inside": the schools that swim under a roof (C in the church, E under the market hall's glass). No room
  // for the hull (it floats right over both, and its room would push fish through stone and glass) and no fright from
  // it; under 600 fish, so the family gives them its fuller mesh (fins), which is right for fish seen from 3 to 6 m.
  // Its handle is published as shared.cast.fishChurch (the name the first holders gave it): C is schools[0] when the
  // church stands, E the next.
  if (inner.length) {
    const h = systems.fishChurch = makeSchool(ctx, {
      species: SCHOOL_SPECIES, length: num('fishlen', 0.28), vary: 0.12, seed: 77, hull: false, burst: false, refract: REFR,
      colors: SCHOOL_PAINT,
      flash: { color: '#f0a8b8', strength: 0.8, self: 0.6 },
      schools: inner.map((q) => ({ count: q.count, route: q.route, form: q.form, spread: q.spread, long: q.long, speed: q.speed, start: q.start })),
      onTouch: touch('fishChurch'),
    });
    // school by school: the lit room's light on flanks (C: the nave's; E: the hall's lamps, from below), how far it is
    // jade under glass, and each one's share of the flash (C little: a file past lit glass is a row of dark shapes;
    // E the page's "flash on the turn": a mill is always turning)
    const per = (o) => inner.map((q) => o[q.name] ?? o._);
    dress(h, light, { lit: SCHOOL_LIT, px: SCHOOL_PX, flash: '#f0a8b8', strength: 0.75, floor: 0.3, rose: '#f2b6c6', roseK: 0.5,
      under: per({ C: num('fishcu', 0.7), E: num('fisheu', 0.35), _: 0 }), jade: per({ E: num('fishejade', 0.1), _: 1 }),
      flashK: per({ C: num('fishcflash', 0.35) / 0.75, E: num('fisheflash', 0.8), _: 1 }) });
    mine.add(h.object); shared.cast.fishChurch = h;
    inner.forEach((q, k) => { fishes.names[q.name] = ['fishChurch', k]; routes[q.name] = { sys: 'fishChurch', k, rx: q.rx, ry: q.ry, long: q.long }; });
  }

  // ---------------------------------------------------------------------------------------------- the fry
  // Six shoals hanging just under the surface by things that stand in the water, each over clear water with room
  // behind it to dart into, and the lime's 120 in its crown on the square's floor. They hang, shift together every few
  // seconds with a glint, and burst from a hull that bears down within 3 m: five pin rings, and home in 4 s.
  const fryHomes = [];
  if (want('fry')) {
    // (1) over a roof awash on the right bank, where its tiles lie a metre under the surface
    const roofY = shared.roofs && shared.roofs.mainRoofY;
    const overRoof = (s, d0, d1, deep) => { for (let d = d0; (d1 > d0 ? d <= d1 : d >= d1); d += (d1 > d0 ? 0.1 : -0.1)) { const [x, z] = town.xz(s, d), y = roofY ? roofY(x, z) : -Infinity; if (y > -deep && y < 0) return { x, z, d }; } const [x, z] = town.xz(s, (d0 + d1) / 2); return { x, z, d: (d0 + d1) / 2 }; };
    const a = overRoof(46.5, 10.6, 14.5, 1.25); fryHomes.push({ name: 'roof', x: a.x, z: a.z, r: 0.6, depth: [0.2, 0.5] });
    // (2) before the half-lit gable's window, a metre in front of its wall
    { const g = (town.gables || []).find((q) => q.halfLit) || { s: 58, d: -14, side: -1 }, [x, z] = town.xz(g.s + 0.2, g.d - g.side * num('fishgable', 2.28)); fryHomes.push({ name: 'gable', x, z, r: 0.3, depth: [0.25, 0.7], spread: [0.32, 0.2, 0.5] }); }      // (second holder: the modelled gable's face stands at d -12.6, 1.4 m nearer the channel than the layout's line, so "a metre in front" was inside the wall; and 1.75 m in front of the face a thin wall of the left row's roof stands to half a metre under the surface. The shoal hangs between the two, narrow across)
    // (3, 4) before two missing panes of the glass ridge, on the square's side, over the hall's roof
    { const G = shared.glassRidge, hf = G && G.frame;
      if (hf && G.gaps && G.gaps.length) {
        const loc2 = G.gaps.map((p) => ({ p, l: hf.local(p.x, p.z) })), side = Math.sign(hf.local(...town.xz(174, 0))[1]) || 1;      // which side of the ridge the square lies on
        const near = loc2.filter((q) => Math.sign(q.l[1]) === side), pick = (ls) => (near.length ? near : loc2).reduce((u, v) => (Math.abs(v.l[0] - ls) < Math.abs(u.l[0] - ls) ? v : u));
        const used = new Set();
        for (const ls of [-10, 9]) { const q = pick(ls); if (used.has(q)) continue; used.add(q); const w = hf.at(q.l[0], 0, side * (Math.abs(q.l[1]) + 1.5)); fryHomes.push({ name: 'glass', x: w[0], z: w[2], r: 0.45, depth: [0.2, 0.5] }); }
      } }
    // (5, 6) in the mouths of the tower's up-route and down-route arches, on the channel side: the loggia is behind them
    { const tf = shared.tower && shared.tower.frame;
      if (tf && tf.at) for (const ls of [-4.0, 4.0]) { const w = tf.at(ls, 0, -1.15); fryHomes.push({ name: 'pier', x: w[0], z: w[2], r: 0.5, depth: [0.2, 0.55] }); } }
  }
  // THE LIME'S 120 ARE TAKEN OUT (third holder; the page's own cut list names them third). Their tree stands 16 m down
  // and is never nearer the eye than 18 m: a 6 cm fish there is a third of a pixel wide, and from the composed line the
  // crown lies at the edge of the rider's own gunwale. Drawn as they are, nothing shows; drawn as flecks large enough
  // to show, they are red specks round a bare tree, not fish and not leaves (the log has the pictures). The shoal is
  // still built when the address asks for it by name (&fish=A,B,C,D,E,fry,lime), for whoever lights the tree or brings
  // the eye nearer; fishes.lift() stays, and does nothing without it.
  let limeK = -1;
  if (ONLY.includes('lime')) {
    const Lm = shared.kitLime || (() => { const li = plan.square.lime, [x, z] = town.xz(li.s, li.d), fl = plan.square.floor; return { x, z, crown: [fl + 4.6, fl + 7.4], radius: 2.3 }; })();
    limeK = fryHomes.length;
    fryHomes.push({ name: 'lime', x: Lm.x, z: Lm.z, r: 0.55, depth: [-Lm.crown[1] + 0.45, -Lm.crown[0] - 0.25], spread: [Lm.radius * 0.72, 0.95, Lm.radius * 0.72], count: 120 });
  }
  if (fryHomes.length) {
    const h = systems.fry = makeSchool(ctx, {
      species: 'fry', gait: 'hover', seed: 53,
      colors: { flank: '#b996a8', back: '#33243f', belly: '#cbb2bd', fin: '#5a4660', finEdge: '#5a4660', dusky: '#33243f' },
      flash: { color: '#f3b0c0', strength: 1, self: 0.5 },
      burst: { boil: [num('fishboil', 0.4), 0.26], boils: 5 },      // five pin rings a burst (the family's 0.1, 0.12 are not seen on this water; the set's log: 0.3, 0.4 reads as a fine ring within 15 m)
      // (third holder: a fry takes something from the surface now and then: see "the fry sip" in the module's own work
      // every frame. The family's own clock for rises is left idle (one in three years a fish): it would bring the lime's
      // shoal up through sixteen metres of water. What is given here is the size of the ring a sip leaves.)
      rises: { kind: 'sip', every: [1e8, 1e8], ring: [num('fishsip', 0.3), 0.2], near: 0 },
      schools: fryHomes.map((q) => ({ count: q.count || 67, home: { x: q.x, z: q.z, r: q.r }, depth: q.depth, spread: q.spread })),
      onTouch: touch('fry'),
    });
    // (the lime's shoal, 16 m down, is 6 cm fish under 17 m of water, never nearer the eye than 18 m: a fry there is a
    // third of a pixel wide. "The fry are its leaves" (the page's model list): each is drawn as a pale fleck as wide as
    // it is long (pxMax), in the light of the lamp that stands beside the tree, and its share of the flash is larger)
    const limeIs = (a, b) => fryHomes.map((q) => (q.name === 'lime' ? a : b));
    dress(h, light, { lit: 0.7, flash: '#f3b0c0', strength: 0.9, floor: 0.35, nets: 0.45, px: num('fishfrypx', 1.0), rose: '#f6cdd4', roseK: 0.6,
      flashK: limeIs(num('fishlimeflash', 1.6), 1), under: limeIs(num('fishlimeu', 1.2), 0), pxMax: limeIs(num('fishlimepx', 12), 2.4) });
    mine.add(h.object); shared.cast.fry = h;
    if (limeK >= 0) fishes.names.lime = ['fry', limeK];
    fishes.fryHomes = fryHomes;
  }
  /** The lime's shoal lifts off (a fright from under the crown) and settles again. */
  fishes.lift = () => { const sc = limeK >= 0 && systems.fry ? systems.fry.schools[limeK] : null; if (sc) systems.fry.burst(limeK, { x: sc.centre.x, y: sc.centre.y - 2.2, z: sc.centre.z }); };
  /** Something large that every school and shoal keeps clear of. Returns { remove() }. */
  fishes.threat = (target, o = {}) => {
    const made = [];
    for (const n of ['fish', 'fishChurch']) if (systems[n]) made.push(systems[n].threat(target, { radius: o.radius ?? 1.2, scare: !!o.scare }));
    if (o.fry !== false && systems.fry) made.push(systems.fry.threat(target, { radius: (o.radius ?? 1.2) + 0.3, scare: true }));
    return { remove() { for (const t of made) if (t) t.remove(); } };
  };

  // ---------------------------------------------------------------------------------------------- the module's own work every frame
  const R4 = [0, 0, 0, 0], loc = {};
  const school = fishes.school = (name) => { const n = fishes.names[name]; return n && systems[n[0]] ? systems[n[0]].schools[n[1]] : null; };
  /** How far along its route school `name` is where it is abeam of route distance s. leg: 'up' (going up the street) or 'down'. */
  fishes.metres = (name, s, leg = 'up') => {
    const R = routes[name]; if (!R) return 0;
    const h = systems[R.sys], L = h.schools[R.k].L; let best = 0, bd = 1e9;
    for (let i = 0; i < ROUTE_N; i += 2) {
      routeSample(h, R.k, i, R4); const x = R4[0], z = R4[2]; routeSample(h, R.k, i + 4, R4);
      const a = ctx.path.locate(x, z, null, loc).s, b = ctx.path.locate(R4[0], R4[2], null, loc).s;
      if ((leg === 'up') !== (b < a)) continue;
      const d = Math.abs(a - s); if (d < bd) { bd = d; best = i; }
    }
    return best / ROUTE_N * L;
  };

  // A waits up the street: the page's moment at s 44, "the first school" (first.auto; the staging may take it over)
  const first = fishes.first = { auto: Q.get('fishfirst') !== '0', s: 44, head: num('fishhead', 58.5), waiting: false, t: -1, seconds: 2,
    /** Put A down the street, hanging, its head abeam of route distance first.head before the right bank's windows. */
    wait() { const sc = school('A'); if (!sc) return; systems.fish.put(routes.A.k, fishes.metres('A', first.head, 'up') - sc.long); sc.hold = 0; first.waiting = true; first.t = -1; },
    /** Let A go (eased over `seconds`). */
    go(seconds = 2) { if (!school('A')) return; first.waiting = false; first.t = 0; first.seconds = Math.max(0.01, seconds); } };

  // B keeps the hour ring's own pace: its tail stays `offset` radians behind lantern 0
  const ringLock = fishes.ring = { locked: false, offset: 0.26, turned: 0, last: null, base: 0, wander: num('fishbwander', 1.1) };
  if (routes.B && shared.clock && shared.clock.ring && Q.get('fishlock') !== '0') {
    const ring = shared.clock.ring, v = new THREE.Vector3(), h = systems.fish, k = routes.B.k;
    const ang = () => { ring.lantern(0, v); return Math.atan2(v.z - tw[1], v.x - tw[0]); };
    h.lock(k, (t) => {
      const a = ang(), sc = h.schools[k];
      if (ringLock.last === null) { ringLock.base = ringDir * a; ringLock.turned = 0; } else ringLock.turned += ringDir * wrap(a - ringLock.last);
      ringLock.last = a;
      // (the school keeps the lanterns' pace, but it is not bolted to the wheel: it gains a little on them and falls back, over a minute)
      return (ringLock.base + ringLock.turned - ringLock.offset) * sc.L / TAU + 4 * sc.L + ringLock.wander * (0.62 * Math.sin(0.17 * t + 0.4) + 0.38 * Math.sin(0.071 * t + 1.3));
    });
    ringLock.locked = true;
  }

  // ---------------------------------------------------------------------------------------------- where the schools are when the boat comes
  // A boat left alone is carried down the route at plan.currentAt(s). The schools are set out so that such a rider
  // meets each where it is best seen (this is ordinary life, not a cue: nothing waits but A, which the page asks to).
  // And a ride entered part-way (a rider coming back in, a picture taken at &s=84) finds them where that rider would
  // have: at the first frame every school is put on by the time a boat left alone takes to come as far as the place
  // of entry (&fisht0=<seconds> gives that time by hand).
  const handsOff = fishes.handsOff = (s) => { let t = 0; for (let q = 0; q < s; q += 0.25) t += 0.25 / Math.max(0.3, plan.currentAt(q)); return t; };
  /** Put school `name` so that its HEAD is abeam of route distance `at` on that leg when a boat left alone is at `when` (and `more` seconds on). */
  const meet = (name, at, leg, when, more = 0) => { const R = routes[name], sc = school(name); if (R && sc) systems[R.sys].put(R.k, fishes.metres(name, at, leg) - sc.long - sc.speed * (handsOff(when) + more)); };
  meet('D', 86, 'up', 80);            // D comes up the street under the three washing lines while the boat passes over them (postcard 4: "a school of fish pouring under them")

  // ---------------------------------------------------------------------------------------------- developer's tools
  if (Q.has('fishcam') && ctx.engine && ctx.engine.camera) { const v = Q.get('fishcam').split(',').map(Number); ctx.engine.camera.position.set(v[0] || 0, v[1] || 0, v[2] || 0); }
  const AT = (Q.get('fishat') || '').split(',').filter(Boolean).map((q) => q.split(':'));
  const PLAYB = Q.has('fishburst') ? { k: Q.get('fishburst').split(',')[0], t: +(Q.get('fishburst').split(',')[1] || 1), done: false } : null;      // &fishburst=<shoal | lime>,<seconds>: a fright in that shoal of fry, from the boat (lime: the lime's shoal lifts off)
  let started = false;
  const start = (c) => {
    started = true;
    const T0 = Q.has('fisht0') ? num('fisht0', 0) : handsOff(c.s);
    for (const name in routes) {                             // every school put on by the time a boat left alone takes to come this far
      if (name === 'A' || name === 'C' || (name === 'B' && ringLock.locked)) continue;
      const R = routes[name], sc = school(name); systems[R.sys].put(R.k, sc.U + sc.speed * T0);
    }
    if (school('A')) {
      const sc = school('A');
      if (!first.auto) systems.fish.put(routes.A.k, sc.U + sc.speed * T0);
      else { first.wait(); if (c.s >= first.s - 0.5) { first.waiting = false; sc.hold = 1; systems.fish.put(routes.A.k, sc.U + sc.speed * Math.max(0, T0 - handsOff(first.s) - 1)); } }
    }
    // B rides with the lanterns it is put beside. Which of them, for a boat left alone (fourth holder): the wheel lies
    // 2.7 to 17 m to starboard of the composed line and 20 m down, so abeam of the tower the rider's own boat hides its
    // near half and the shaft its far half; what is seen from the line is the UP-ROUTE arc, over the starboard bow, while
    // the boat comes on from s 160 to 174 (town_fi4_32_Bride_f03.png), and the down-route arc looking back from s 194
    // on. The ring turns up-route -> channel side -> down-route, the way the boat goes: so the comet's middle is on
    // the up-route point when that boat is at s 166. It is in sight on the lit arc all the way in (20 degrees short
    // of the point at s 160, 40 past it at s 176), goes under the hull's line as the boat passes the tower, and is on
    // the down-route arc when the rider looks back from the poplars (&fishbth=<degrees past the up-route point>,
    // &fishbs=<where that boat is then>). From the left of the square it is found whenever it is not behind the shaft.
    if (ringLock.locked && school('B')) {
      const ring = shared.clock.ring, v = ring.lantern(0, new THREE.Vector3()), sc = school('B'), th = num('fishbth', 0) * Math.PI / 180;
      const [px, pz] = town.xz(plan.tower.s - ringR * Math.cos(th), plan.tower.d - ringR * Math.sin(th));
      const aMid = Math.atan2(pz - tw[1], px - tw[0]) - ringDir * (TAU / (ring.period || 96)) * (handsOff(num('fishbs', 166)) - T0);
      ringLock.offset = (((ringDir * (Math.atan2(v.z - tw[1], v.x - tw[0]) - aMid) + (sc.long / 2) / ringR) % TAU) + TAU) % TAU;
      if (LOGALL) { const q = (a) => { const l = ctx.path.locate(tw[0] + ringR * Math.cos(a), tw[1] + ringR * Math.sin(a), null, loc); return `s ${l.s.toFixed(1)} d ${l.d.toFixed(1)}`; };
        note(`B's phase: the ring turns ${ringDir > 0 ? '+' : '-'} in atan2(z, x); lantern 0 at ${q(Math.atan2(v.z - tw[1], v.x - tw[0]))}; the middle is wanted at ${q(aMid)}; offset ${ringLock.offset.toFixed(2)} rad; radius ${ringR.toFixed(2)}, y ${ringY.toFixed(2)} (lantern 0's glass at y ${v.y.toFixed(2)}, its hook at y ${ring.point ? ring.point('hook0', new THREE.Vector3()).y.toFixed(2) : '?'}, ${ring.point ? Math.hypot(ring.point('hook0', new THREE.Vector3()).x - tw[0], ring.point('hook0', new THREE.Vector3()).z - tw[1]).toFixed(2) : '?'} m from the axis); T0 ${T0.toFixed(0)} s`); }
    }
    for (const [name, more, leg] of AT) {                    // a school's middle abeam of the boat (the nearest point of its route; of its leg 'up' or 'down' the street if one is named), plus so many metres
      const R = routes[name]; if (!R) continue;
      const h = systems[R.sys], sc = h.schools[R.k]; let best = 0, bd = 1e9;
      for (let i = 0; i < ROUTE_N; i++) {
        routeSample(h, R.k, i, R4); const x = R4[0], z = R4[2], d = Math.hypot(x - c.boat.x, z - c.boat.z);
        if (leg) { routeSample(h, R.k, i + 4, R4); if ((leg === 'up') !== (ctx.path.locate(R4[0], R4[2], null, loc).s < ctx.path.locate(x, z, null, loc).s)) continue; }
        if (d < bd) { bd = d; best = i; }
      }
      h.put(R.k, best / ROUTE_N * sc.L - sc.long / 2 + (+more || 0)); sc.hold = 1;
      if (name === 'A') { first.waiting = false; first.t = -1; }
    }
    if (/^touch/.test(Q.get('fishlog') || '') && !fishes.onTouch) fishes.onTouch = (x, z, kind, name, info) => { if (Q.get('fishlog') === 'touchall' || (kind !== 'boil' && kind !== 'sip')) { note(`touch at ${ctx.time.toFixed(1)} s: ${kind} ${name} at s ${ctx.path.locate(x, z, null, loc).s.toFixed(1)} ${JSON.stringify(info, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v))}; the boat at s ${c.s.toFixed(1)}`); } };
    if (Q.has('fishprobe')) probe(ctx, town, systems, routes, mine, Q.get('fishprobe'), Q.get('fishray'), fishes.fryHomes, shared.kitCloth);
    if (Q.get('fishlog') === 'cloth' && shared.kitCloth) { const out = []; for (const pc of shared.kitCloth.pieces) { const l = ctx.path.locate(pc.x, pc.z, null, loc); if (l.s > 50 && l.s < 104 && l.d > -9 && l.d < 14) out.push(`${l.s.toFixed(1)}/${l.d.toFixed(1)}/${pc.y.toFixed(1)}/${pc.h.toFixed(1)}/${pc.w.toFixed(1)}`); } for (let i = 0; i < out.length; i += 9) note('washing over the street (s/d/rope y/height/width): ' + out.slice(i, i + 9).join(' ')); }
    if (LOGALL && fishes.fryHomes) note('fry: ' + fishes.fryHomes.map((q, i) => { const l = ctx.path.locate(q.x, q.z, null, loc); return `[${i}] ${q.name} s ${l.s.toFixed(1)} d ${l.d.toFixed(1)} depth ${q.depth.map((v) => v.toFixed(2)).join('..')}`; }).join('; '));
    if (LOGALL && Q.get('fishlog') !== 'fry') for (const n of Object.keys(routes)) { const sc = school(n), h = systems[routes[n].sys], p = h.fishAt(sc.first + (sc.count >> 1)), l = ctx.path.locate(p[0], p[2], null, loc);
      const at = (m) => { routeAt(h, routes[n].k, m, R4); const q = ctx.path.locate(R4[0], R4[2], null, loc); return `s ${q.s.toFixed(1)} d ${q.d.toFixed(1)} y ${R4[1].toFixed(1)}`; };
      note(`${n}: route ${sc.L.toFixed(1)} m, ribbon ${sc.long} m at ${sc.speed.toFixed(2)} m/s, ${sc.count} fish; tail at ${sc.U.toFixed(1)} m (${at(sc.U)}), head at ${at(sc.U + sc.long)}; a fish of it at s ${l.s.toFixed(1)}, d ${l.d.toFixed(1)}, y ${p[1].toFixed(2)}; the boat at s ${c.s.toFixed(1)}; mesh ${h.object.visible ? 'shown' : 'hidden'}, layer ${h.object.layers.mask}, in ${h.object.parent ? h.object.parent.name : 'nothing'}, ${h.object.geometry.instanceCount} instances`); }
  };

  // ---------------------------------------------------------------------------------------------- every frame
  const PASS = { reach: 7.6, rearm: 11, deep: 8.5 }, armed = {};
  // the fry sip: while the boat is within 15 m of a shoal that hangs under the surface, one of its fish comes up every
  // few seconds, touches the surface and leaves a pin ring (the family's sip: 1.6 s for a fry). Evidence of a surface
  // where the area has little; nothing at all for a shoal the rider is not near (a ring that small lives only within
  // ten metres of the boat). Each shoal on a clock of its own, from the area's own random numbers: the same in every run.
  const SIP = { near: num('fishsipnear', 15), every: [num('fishsip0', 2.5), num('fishsip1', 6.5)], rnd: ctx.rng(5309), next: fryHomes.map((_, i) => 1.5 + 0.9 * i) };
  return {
    update(dt, c) {
      if (!started) start(c);
      for (const n in systems) if (systems[n].townNet) systems[n].townNet();
      if (PLAYB && !PLAYB.done && c.time >= PLAYB.t && systems.fry) { PLAYB.done = true; if (PLAYB.k === 'lime') fishes.lift(); else systems.fry.burst(+PLAYB.k, { x: c.boat.x, y: -0.1, z: c.boat.z }); }
      if (Q.has('fishlog') && !fishes._diag) {                    // (a shader that failed to compile: say why; it is known only after the first picture, so this wants a strip)
        const r = ctx.engine.renderer, bad = (r.info.programs || []).filter((q) => q.diagnostics && !q.diagnostics.runnable);
        if (bad.length) fishes._diag = true;
        for (const q of bad) note(`a program failed: ${String(q.diagnostics.programLog).replace(/\s+/g, ' ').slice(0, 100)} | vertex: ${String(q.diagnostics.vertexShader.log).replace(/\s+/g, ' ').slice(0, 280)} | fragment: ${String(q.diagnostics.fragmentShader.log).replace(/\s+/g, ' ').slice(0, 280)}`);
      }
      // the fry sip
      if (systems.fry && SIP.every[0] > 0) for (let k = 0; k < fryHomes.length; k++) {
        if (k === limeK || c.time < SIP.next[k]) continue;
        const sc = systems.fry.schools[k];
        SIP.next[k] = c.time + SIP.every[0] + (SIP.every[1] - SIP.every[0]) * SIP.rnd();
        const pick = sc.first + Math.min(sc.count - 1, Math.floor(SIP.rnd() * sc.count));      // (drawn whether or not the boat is near: the numbers do not depend on where the rider went)
        if (Math.hypot(sc.centre.x - c.boat.x, sc.centre.z - c.boat.z) < SIP.near && c.time - sc.lastBurst > 5) systems.fry.rise(pick, 'sip');
      }
      // the first school: let go when the boat first reaches s 44
      if (first.waiting && first.auto && c.s >= first.s) first.go(2);
      if (first.t >= 0) { const sc = school('A'); first.t += dt; if (sc) sc.hold = smooth(0, first.seconds, first.t); if (first.t >= first.seconds) first.t = -1; }
      // a ribbon passing the hull: where its nearest point is (for the staging's sound), and the touch when it comes within reach
      const boat = c.boat, fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
      for (const name in routes) {
        const R = routes[name]; if (R.sys !== 'fish') continue;
        const h = systems.fish, sc = h.schools[R.k];
        if (Math.hypot(sc.centre.x - boat.x, sc.centre.z - boat.z) > sc.long * 0.5 + 14) { if (fishes.passing[name]) delete fishes.passing[name]; armed[name] = true; continue; }
        let bd = 1e9, bx = 0, by = 0, bz = 0;
        for (let j = 0; j <= 12; j++) { routeAt(h, R.k, sc.U + sc.long * j / 12, R4); const d = Math.hypot(R4[0] - boat.x, R4[2] - boat.z); if (d < bd) { bd = d; bx = R4[0]; by = R4[1]; bz = R4[2]; } }
        if (bd > 12) { if (fishes.passing[name]) delete fishes.passing[name]; if (bd > PASS.rearm) armed[name] = true; continue; }
        const p = fishes.passing[name] || (fishes.passing[name] = {});
        p.x = bx; p.y = by; p.z = bz; p.distance = bd; p.ahead = (bx - boat.x) * fx + (bz - boat.z) * fz;
        p.seconds = sc.long / Math.max(0.3, Math.hypot(sc.vel.x - (boat.vx || 0), sc.vel.z - (boat.vz || 0)));
        if (armed[name] !== false && bd < PASS.reach && -by < PASS.deep) {
          armed[name] = false;
          if (fishes.onTouch) fishes.onTouch(bx, bz, 'pass', name, { distance: bd, depth: -by, ahead: p.ahead, seconds: p.seconds, under: false });
        }
      }
    },
  };
}

// ====================================================================================================== the probe
// A developer's tool (&fishprobe=name.json): the least room every route has from the set's own meshes. Every solid,
// still mesh of the area is taken as triangles in the realm's own space; for a point every half metre of every route
// the nearest of them is found, and from that distance the ribbon's own reach toward it is taken (its half width and
// half depth there). What comes out is written to .shots/: for each school the least room, the ten worst places and
// a table along the route. Moving things (cloth, weed, skiffs, leaves) and see-through ones are left out: the washing
// is kept clear of by its lines. &fishray=s:d,... adds what a plumb line at each of those places meets.
function closestOnTriangle(px, py, pz, T, o, out) {
  const ax = T[o], ay = T[o + 1], az = T[o + 2], bx = T[o + 3], by = T[o + 4], bz = T[o + 5], cx = T[o + 6], cy = T[o + 7], cz = T[o + 8];
  const abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  const d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  if (d1 <= 0 && d2 <= 0) { out[0] = ax; out[1] = ay; out[2] = az; return; }
  const bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) { out[0] = bx; out[1] = by; out[2] = bz; return; }
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); out[0] = ax + abx * v; out[1] = ay + aby * v; out[2] = az + abz * v; return; }
  const cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) { out[0] = cx; out[1] = cy; out[2] = cz; return; }
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); out[0] = ax + acx * w; out[1] = ay + acy * w; out[2] = az + acz * w; return; }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); out[0] = bx + (cx - bx) * w; out[1] = by + (cy - by) * w; out[2] = bz + (cz - bz) * w; return; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  out[0] = ax + abx * v + acx * w; out[1] = ay + aby * v + acy * w; out[2] = az + abz * v + acz * w;
}
function solidMeshes(ctx, mine) {
  const out = [], seen = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  const nameOf = (o) => { const n = []; for (let q = o; q && q !== ctx.group && n.length < 3; q = q.parent) if (q.name) n.push(q.name); return n.join(' < ') || 'a mesh'; };
  ctx.group.updateMatrixWorld(true);
  ctx.group.traverse((o) => {
    if (!o.isMesh || mine.has(o) || !seen(o) || !o.geometry || !o.geometry.attributes.position) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material, name = nameOf(o);
    if (!m || !m.isGouache || m.transparent || m.depthWrite === false || (o.geometry.isInstancedBufferGeometry && !o.isInstancedMesh)) return;
    if (/washing|weed|fringe|leaves|leaf|fish|flies|sedge|mote|bubble|halo|rope|painter|skiff|standin|moth/i.test(name)) return;
    out.push({ o, name });
  });
  return out;
}
function probe(ctx, town, systems, routes, mine, file, rays, extra, cloth) {
  const t0 = performance.now(), CELL = 2, RNG = 2, key = (i, j, k) => ((i + 2048) * 4096 + (j + 2048)) * 4096 + (k + 2048), cells = new Map();
  const samples = [], R4 = [0, 0, 0, 0], Rb = [0, 0, 0, 0];
  for (const name in routes) {
    const R = routes[name], h = systems[R.sys], L = h.schools[R.k].L, step = Math.max(1, Math.round(ROUTE_N * 0.5 / L));
    for (let i = 0; i < ROUTE_N; i += step) { routeSample(h, R.k, i, R4); routeSample(h, R.k, i + step, Rb); samples.push({ name, R, m: i / ROUTE_N * L, x: R4[0], y: R4[1], z: R4[2], w: R4[3], tx: Rb[0] - R4[0], tz: Rb[2] - R4[2] }); }
  }
  // (the fry: the middle of each shoal's pool and four places on its rim, at the middle of its depth; `room` there is the bare distance)
  (extra || []).forEach((q, i) => { const y = -(q.depth[0] + q.depth[1]) / 2; for (const [dx, dz] of [[0, 0], [q.r, 0], [-q.r, 0], [0, q.r], [0, -q.r]]) samples.push({ name: 'fry ' + i + ' ' + q.name, R: { rx: 0, ry: 0, sys: null }, m: 0, x: q.x + dx, y, z: q.z + dz, w: 1, tx: 1, tz: 0 }); });
  for (const p of samples) { const a = Math.floor(p.x / CELL), b = Math.floor(p.y / CELL), c = Math.floor(p.z / CELL); for (let i = -RNG; i <= RNG; i++) for (let j = -RNG; j <= RNG; j++) for (let k = -RNG; k <= RNG; k++) { const q = key(a + i, b + j, c + k); if (!cells.has(q)) cells.set(q, []); } }
  const T = [], owner = [], meshes = solidMeshes(ctx, mine), M = new THREE.Matrix4(), v = new THREE.Vector3();
  let scanned = 0;
  const addTri = (W, a, b, c, id) => {
    const x0 = Math.min(W[a], W[b], W[c]), x1 = Math.max(W[a], W[b], W[c]), y0 = Math.min(W[a + 1], W[b + 1], W[c + 1]), y1 = Math.max(W[a + 1], W[b + 1], W[c + 1]), z0 = Math.min(W[a + 2], W[b + 2], W[c + 2]), z1 = Math.max(W[a + 2], W[b + 2], W[c + 2]);
    const i0 = Math.floor(x0 / CELL), i1 = Math.floor(x1 / CELL), j0 = Math.floor(y0 / CELL), j1 = Math.floor(y1 / CELL), k0 = Math.floor(z0 / CELL), k1 = Math.floor(z1 / CELL);
    let t = -1; scanned++;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (let k = k0; k <= k1; k++) {
      const cell = cells.get(key(i, j, k)); if (!cell) continue;
      if (t < 0) { t = T.length / 9; T.push(W[a], W[a + 1], W[a + 2], W[b], W[b + 1], W[b + 2], W[c], W[c + 1], W[c + 2]); owner.push(id); }
      cell.push(t);
    }
  };
  meshes.forEach(({ o }, id) => {
    const pos = o.geometry.attributes.position, idx = o.geometry.index, n = pos.count, W = new Float32Array(n * 3), tris = idx ? idx.count / 3 : n / 3;
    const one = (mat) => {
      const e = mat.elements;
      for (let i = 0; i < n; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); W[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; W[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; W[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
      for (let t = 0; t < tris; t++) { const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2; addTri(W, a * 3, b * 3, c * 3, id); }
    };
    if (o.isInstancedMesh) {
      const bs = o.geometry.boundingSphere || (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere), I = new THREE.Matrix4();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, I); M.multiplyMatrices(o.matrixWorld, I);
        v.copy(bs.center).applyMatrix4(M); const r = bs.radius * M.getMaxScaleOnAxis() + CELL;       // (an instance nowhere near a route is not unpacked)
        let near = false; for (let a = Math.floor((v.x - r) / CELL); a <= Math.floor((v.x + r) / CELL) && !near; a++) for (let b = Math.floor((v.y - r) / CELL); b <= Math.floor((v.y + r) / CELL) && !near; b++) for (let c = Math.floor((v.z - r) / CELL); c <= Math.floor((v.z + r) / CELL); c++) if (cells.has(key(a, b, c))) { near = true; break; }
        if (near) one(M);
      }
    } else one(o.matrixWorld);
  });
  const q3 = [0, 0, 0], out = { file, seconds: 0, meshes: meshes.length, trianglesScanned: scanned, trianglesKept: T.length / 9, schools: {}, rays: [] }, loc = {};
  const rows = {};
  for (const p of samples) {
    const a = Math.floor(p.x / CELL), b = Math.floor(p.y / CELL), c = Math.floor(p.z / CELL);
    let best = 1e9, bx = 0, by = 0, bz = 0, bo = -1;
    for (let i = -RNG; i <= RNG; i++) for (let j = -RNG; j <= RNG; j++) for (let k = -RNG; k <= RNG; k++) {
      const cell = cells.get(key(a + i, b + j, c + k)); if (!cell) continue;
      for (const t of cell) { closestOnTriangle(p.x, p.y, p.z, T, t * 9, q3); const d = (q3[0] - p.x) * (q3[0] - p.x) + (q3[1] - p.y) * (q3[1] - p.y) + (q3[2] - p.z) * (q3[2] - p.z); if (d < best) { best = d; bx = q3[0]; by = q3[1]; bz = q3[2]; bo = owner[t]; } }
    }
    const dist = Math.sqrt(best), tl = Math.hypot(p.tx, p.tz) || 1, lx = p.tz / tl, lz = -p.tx / tl;      // the school's own left
    const ux = (bx - p.x) / Math.max(dist, 1e-6), uy = (by - p.y) / Math.max(dist, 1e-6), uz = (bz - p.z) / Math.max(dist, 1e-6), side = ux * lx + uz * lz;
    const reach = Math.hypot(p.R.rx * p.w * side, p.R.ry * p.w * uy), l = ctx.path.locate(p.x, p.z, null, loc);
    (rows[p.name] || (rows[p.name] = [])).push({ m: +p.m.toFixed(1), s: +l.s.toFixed(1), d: +l.d.toFixed(2), y: +p.y.toFixed(2), w: +p.w.toFixed(2), dist: dist > 4 ? 4 : +dist.toFixed(2), room: dist > 4 ? 4 : +(dist - reach).toFixed(2), to: bo < 0 ? '' : meshes[bo].name, at: bo < 0 ? null : [+(bx - p.x).toFixed(2), +(by - p.y).toFixed(2), +(bz - p.z).toFixed(2)] });
  }
  for (const name in rows) {
    const r = rows[name], sorted = [...r].sort((a, b) => a.room - b.room);
    out.schools[name] = routes[name] ? { length: +systems[routes[name].sys].schools[routes[name].k].L.toFixed(1), leastRoom: sorted[0].room, worst: sorted.slice(0, 14), worstNotPosts: sorted.filter((q) => !/lamps/.test(q.to)).slice(0, 6), along: r.filter((_, i) => i % 5 === 0) } : { leastRoom: sorted[0].room, places: r };
  }
  // The washing and the curtains are left out above (they move): each piece hangs from (x, y, z) by h. For every route,
  // the pieces its ribbon passes within reach of, and by how much it clears them: over the rope, under the hem, or THROUGH.
  if (cloth && cloth.pieces) {
    out.cloth = {};
    for (const p of samples) {
      if (!p.R.sys) continue;
      const top = p.y + p.R.ry * p.w, bot = p.y - p.R.ry * p.w;
      for (const pc of cloth.pieces) {
        if (Math.hypot(pc.x - p.x, pc.z - p.z) > pc.w / 2 + p.R.rx * p.w + 0.3) continue;
        const where = bot > pc.y ? 'over' : top < pc.y - pc.h ? 'under' : 'THROUGH', gap = bot > pc.y ? bot - pc.y : top < pc.y - pc.h ? pc.y - pc.h - top : -Math.min(top - (pc.y - pc.h), pc.y - bot);
        const l = ctx.path.locate(p.x, p.z, null, loc), e = out.cloth[p.name] || (out.cloth[p.name] = { least: 1e9, pieces: [] });
        e.least = Math.min(e.least, +gap.toFixed(2));
        e.pieces.push({ m: +p.m.toFixed(1), s: +l.s.toFixed(1), d: +l.d.toFixed(2), y: +p.y.toFixed(2), gap: +gap.toFixed(2), where, rope: +pc.y.toFixed(2), hem: +(pc.y - pc.h).toFixed(2) });
      }
    }
    for (const n in out.cloth) { out.cloth[n].pieces.sort((a, b) => a.gap - b.gap); out.cloth[n].pieces = out.cloth[n].pieces.slice(0, 12); }
  }
  if (rays) {                                                // plumb lines: what stands at a place, from the surface down
    const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), set = meshes.map((m) => m.o), nm = new Map(meshes.map((m) => [m.o, m.name]));
    ray.layers.enableAll();
    for (const q of rays.split(',')) {
      const [s, d] = q.split(':').map(Number), [x, z] = town.xz(s, d);
      ray.set(v.set(x, 3, z), down); ray.far = 30;
      out.rays.push({ s, d, hits: ray.intersectObjects(set, false).slice(0, 12).map((h) => [+(3 - h.distance).toFixed(2), nm.get(h.object)]) });
    }
  }
  out.seconds = +((performance.now() - t0) / 1000).toFixed(2);
  fetch('/__shot/' + file, { method: 'POST', body: JSON.stringify(out, null, 1) });
}
