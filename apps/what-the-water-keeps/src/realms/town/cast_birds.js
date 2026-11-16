// The town below: the cast, group "Birds" (stage 3): five cormorants, plain natural history. A fishing bird, fishing
// and drying: the "bird fishes over its roofs" of the page (docs/art/town.md, section 5; docs/build/town/3-cast-plan.md,
// "Birds"). The bird itself is the toolkit's (docs/life/seabirds.md, makeCormorant): nothing is modelled here.
// Log: docs/build/town/3-cast-birds.md.
//
// What stands (ids are the names used everywhere below, in shared.cast.birds and in the switches):
//   stack    perched on the pot of the stack at s 62, d +15 (shared.perches: the model's own point), its back to the
//            channel: postcard 3 (s 59, d +8, yaw -60) looks at it from behind, 7.8 m off, wings hung out
//   ridge    perched on the church's west apex stone (shared.church.perch: s 118.8, d -4.5, 1.42 m up), turned away
//            from the boat's line; passed at 5 m
//   last     perched on the pot of the stack at s 204, d +32, its back to the square; 32 m from the composed line
//   street   fishing the street's carriageway, s 66 to 112 (clear of the lamp row and of both banks' roofs)
//   square   fishing the left half of the square, s 154 to 200 (clear of the poplar tips and of the glass ridge)
// Perched: wings half open, sagging and lifted, a shiver, a shake every 20 to 40 s; inside 12 m they hold still; they
// never fold by themselves (the fold is a staged moment, played only beyond 12 m: the family sees to that).
// Fishing: low on the water, a V, a dive every 23 to 35 s, 9 to 14 s under (12 to 18 m), up somewhere else, never
// within 6 m of the hull; it dives when the boat comes within 9 m.
//
// The area's own light. Every bird wears the town's material law (light.extendFor) through the family's
// material.extend: above the water the plum night and the town's light from below, under it the water's own colour and
// the dissolving with distance (the pale line where the water meets a bird is the water's own). On top of that, the edge of rose light
// from under the water that the family's page asks for (its material.rim), as the AREA's law (BIRD_RIM below): it comes
// from below (what faces up takes a share of it), it is the town's own colour at that place (rose over the streets,
// jade beside the glass), it wakes and sleeps with the water round the bird, and there is none under the surface.
// With it goes a wash of the same light on what looks down, and the town's own water-light, which the area throws on
// the first metres above the surface as on stone, is held down on black plumage first. The three perched birds are so
// LIGHT ON DARK (a dim bronze-rose form against the overcast and the dark town behind); the two that fish are kept
// DARK ON LIGHT (a low dark bird on the water's sheen). The log says what each stands against.
//
// On the water (this area lacks evidence of a surface: these are made to read): the V while it swims, two rings where
// it dives, a ring, a second slow one and a scatter where it comes up, each larger than the family's own numbers (stage 1
// found that a ring under 0.7 m does not read on this water); under the water a sheath of silver beads let go behind
// it (shared.cast.bubbles.burst: the Small group's, which also writes their pin rings where they break the surface, so
// that the bird's way under water is written on the surface a moment behind it); a perched bird that shakes itself throws
// drops, which fall as a patch of small rings on the water beside its perch; the schools part round a bird under water
// (shared.cast.fishes.threat) and a wheel of sedge flies opens where it comes up (shared.cast.sedges.part). The Small
// group builds after this one: its handles are looked up when they are used.
//
// The four small moments of the page's route, as cues of this module (the area's stage.js does not stage the birds):
//   cormorant_shake        s 54    the bird on the stack shakes itself once (rustle)
//   cormorant_up           s 70    the street's fisher, kept out of sight until now, comes up about 19 m ahead and to
//                                  the left with a ring (drop), swims a few seconds and dives again (splash)
//   cormorant_fold_ridge   s 132   the bird on the church folds its wings (the boat is then 13.8 m from it)
//   cormorant_fold_last    s 204   the bird on the last stack folds its wings
// Each has a settle. &play=<name>&t=<seconds> photographs one.
//
// In shared.cast.birds (for the stager; the log has the same list with what each does):
//   list, byName { stack, ridge, last, street, square }, perched, fishing      the family's own birds
//   shake(i), fold(i), spread(i)      i: 0, 1, 2 or 'stack' | 'ridge' | 'last'
//   dive(which), surfaceAt(place, which)      which: 'street' (default) | 'square'; place: [s, d] or { x, z }
//   away(which, on, place)            a fisher leaves its water at its next dive, and comes back when told
//   onEvent(name, id, bird), onTouch(x, z, kind, id)      ASSIGN: every event and touch of every bird
//   sound      true: this module plays the page's three one-shots itself; false: it plays none (the hooks still come)
//   cues       the four cue names
//
// Developer switches:
//   &birds=stack,street     only these birds          &biraw=1      the family's own paint (no town light, no rim)
//   &biplain=1              the family's plain material.rim in place of the area's (to compare)
//   &birim=<k> &bipow=<p> &bitop=<share> &bifloor=<k> &bifar=<times> &biwash=<k>      the edge: strength, power, the
//                           share on what faces up, the least of it where nothing burns beneath, how much stronger far
//                           off; the wash on what looks down. &bicap=<k>: what it keeps of the town's own water-light
//   &biturn=<id>:<radians>  one perched bird's turn (several: a;b)
//   &biput=<id>:<s>,<d>[,under]   a fisher put afloat (or under the water) there after the first frame (several: a;b)
//   &bido=<id>:<what>:<seconds>   at that time: dive | up | shake | shiver | fold | spread | away | back | mid (surfaceAt
//                           the middle of its water) (several: a;b)
//   &bifree=1               the street's fisher is not kept out of sight before its cue
//   &biwake=<k>             the strength of the V's two marks (0: none)
//   &bilog=<seconds>        at that time write what happened to .shots/town_birds_log.json (&bilogname=<other>)
import * as THREE from 'three';
import { makeCormorant } from '../../engine/life/seabirds.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('birds') || '').split(',').map((v) => v.trim()).filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);
const note = (msg) => console.error('INVALID_ note (cast_birds): ' + msg);
const RAW = Q.has('biraw'), PLAIN = Q.has('biplain');
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** &<key>=<id>:<a>[:<b>];<id>:... -> the parts after the id, for that id (or null) */
const forId = (key, id) => { for (const part of (Q.get(key) || '').split(';')) { const f = part.split(':'); if (f[0] === id && f.length > 1) return f.slice(1); } return null; };

// ------------------------------------------------------------------------------------------------ what was chosen
// (critique, stage 5) Where the street's fisher is put at its cue. The page's 18 m, built as 16 ahead and 5 to the left:
// its head came out 19 m off and the bird was 15 pixels long. Nearer, so that the bird itself is seen
// (&biup=<ahead>,<left> to try others).
const UP_AHEAD = (() => { const v = (Q.get('biup') || '').split(',').map(Number); return Q.has('biup') && Number.isFinite(v[0]) ? v[0] : 10.5; })();
const UP_LEFT = (() => { const v = (Q.get('biup') || '').split(',').map(Number); return Q.has('biup') && Number.isFinite(v[1]) ? v[1] : 4.5; })();
const BIRDS = {
  // the edge of light from under the water (the family's page gives { color '#f3a77e', strength 0.9, power 2.4 } for
  // this town; the colour here multiplies the town's own light from below at the bird's place)
  // wash: the same light laid broadly on what looks down and sideways (the underside of a hung wing, the belly, the
  // throat): black plumage has a sheen, and a bird standing over lit water is seen as a dim bronze-rose form, as the
  // pots it stands on are seen, and not as an outline.
  // cap: [what a black bird gives back of the town's own water-light, and how much of the rest it keeps]: the town's law
  // throws the water's light on the first metres above the surface as on stone (a third of it whatever the paint), and
  // a swimming bird was an orange ember on the water, the ridge's bird a brass ornament. Held down first; the edge and
  // the wash are then the bird's light.
  // far: [times as strong from 40 m, the power the edge falls to there]. A far bird is twenty pixels and the air takes
  // its contrast away, so it is a little stronger there. Tried at 1.6 and 1.5: 46 m off the bird was the brightest point
  // above the waterline, a small lamp on its stack, and nothing here is lit above the water but the kept lamp; at 1.0
  // and 2.1 the last bird, 32 m off, was no lighter than its pot.
  // floor: the least of it where nothing burns beneath: the town's own (0.1), so that a bird's light fails with its
  // stack's when the street under them goes to sleep (at 0.3 it stood lit on a dark stack behind the boat).
  rim: { color: '#ffffff', strength: 1.35, power: 2.4, top: 0.2, floor: 0.1, far: [1.3, 1.9], wash: 0.3, cap: [0.03, 0.12] },
  // the two that fish stay DARK: on this water (the mirror of the overcast, and over the square the brightest water of
  // the town) a low dark bird is dark on light, which carries; lit like the perched ones it was light on middling.
  rimAfloat: { strength: 0.6, wash: 0.06 },
  plain: { color: '#f3a77e', strength: 0.9, power: 2.4, toward: 0 },      // (&biplain=1: the family's own, to compare)
  lit: 0.6,                                                               // the share of the street's lamplight a bird takes under water (the fish take 0.6)
  // the marks on the water, [strength, radius]: the family's own are wake [0.12, 0.2], dive [0.7, 0.5], surface [0.6, 0.5],
  // scatter [0.15, 0.15]. A ring narrower than about 0.4 m lives only within 8 to 12 m of the boat (the water's fine
  // window), and no bird afloat is ever that near: every mark here is wide enough for the wide window.
  marks: { wake: [0, 0.42], dive: [2.6, 0.9], surface: [2.4, 0.9], scatter: [0.45, 0.42] },
  // the V: the family writes one mark at the bird's breast. Its own is switched off (strength 0: the touch still comes)
  // and two are written here instead, behind the bird and to either side of its line: the two arms of a V. (The pale
  // dash along a swimming bird's waterline is not this: it is the water's own line where it meets anything, as on
  // every roof and stack of the town.)
  wake: { strength: 0, radius: 0.42, behind: 0.55, aside: 0.16 },      // (critique, stage 5: the V is taken out. Two marks of 0.12 behind a bird 12 to 20 m off showed in no picture, its builder's or mine; the dive's and the surfacing's rings, which do show, are as they were. &biwake=0.12 writes it again)
  swell: { after: 0.55, strength: 1.4, radius: 1.5 },                     // the second, slow ring where a bird has come up
  perched: [
    // turn: radians from "looking down the route" (+ to its left). Each has its back to where the boat is.
    // drops: where the water lies from its perch, [metres down the route, metres to the right]: a bird that shakes itself
    // throws drops, and they fall there (the stacks stand on roofs awash: the open water is on the channel's side; the
    // church's west gable stands in the water, which lies up the route from it).
    { id: 'stack', seed: 3, near: 62, turn: -0.6, life: { dry: Infinity }, drops: [0, -1] },
    { id: 'ridge', seed: 4, turn: 0.9, back: 0.05, life: { dry: Infinity, folded: [60, 120] }, drops: [-1, 0.3] },
    { id: 'last', seed: 6, near: 204, turn: -1.2, life: { dry: Infinity, folded: [60, 120] }, drops: [0, -1] },
  ],
  // the drops of a shake: how many, when after it begins (seconds), how far from the perch (metres), how wide the patch,
  // and each one's ring. Wide enough for the water's wide window: postcard 3 stands 7.8 m off.
  shower: { count: 9, from: 0.5, over: 1.7, near: 2.6, far: 4.4, wide: 2.8, strength: [0.3, 0.55], radius: 0.45, reach: 40 },
  fishing: [
    { id: 'street', seed: 5, water: { s: [66, 112], d: [-5.5, 5.5] }, at: [92, -3], afloat: [14, 21], under: [9, 14], depth: 1.2 },
    { id: 'square', seed: 8, water: { s: [154, 200], d: [-19, -3] }, at: [174, -10], afloat: [14, 21], under: [9, 14], depth: 1.2 },
  ],
  cues: { shake: 54, up: 70, foldRidge: 132, foldLast: 204 },
  up: { ahead: UP_AHEAD, left: UP_LEFT, again: 7 },                                   // where the street's fisher is put at its cue, from the boat (it rises over the next two metres and a half: its head comes out 18 to 21 m from the boat); seconds until it dives again
  sheath: { every: 0.15, beads: 3, spread: 0.22, behind: 0.3, reach: 46 },      // the beads let go behind a bird under water
  threat: { radius: 1.2, scare: false },                                  // what the schools keep clear of
  part: { radius: 1.3, seconds: 4 },                                      // the hole in a wheel of sedge flies where a bird comes up
  far: [60, 68],                                                          // a bird further from the boat than this is not drawn (shown again inside the first number)
  earshot: 45,                                                            // this module's own one-shots are played for birds nearer than this
};

// The edge of rose light, as the area's law. It is laid after the town's light (light.extendFor), whose globals it
// reads: gTown (the glow map beneath the fragment) and the town's colours. The light that edges a bird a few metres up
// comes from all the lit water round it, so the town is read wide (the glow map eight metres blurred), and it wakes
// and sleeps as the town does there. uBiRim: x strength, y power, z the share on what faces up, w the least of it
// where nothing burns beneath. uBiFar: x how many times stronger from 40 m, y the power it falls to there, z the wash:
// the same light on what looks down, three tenths of it on what looks sideways or up.
// (critique, stage 5: the client's rule about value) Near, the wash is drawn down: the one bird the boat passes close,
// on the church's ridge, stood abeam at 5 m against the misted viaduct as light as its ground (an ochre ornament on a
// lilac wall). Inside 9.5 m the wash falls to NEAR_WASH of itself by 4 m and the edge stays, so that close to it is a
// dark bird with light along its under edges, against the mist; from 10 m on (the stacks, the ridge as the boat comes
// up to it, where the ground is the dark town and the dark hills) nothing is changed. &binear=1 is the old look.
const NEAR_WASH = num('binear', 0.22);
const BIRD_RIM = (U) => ({
  uniforms: U,
  defines: { TOWN_AFLOAT: '' },                                           // (a thing afloat is all waterline: it takes no second line of light from the area's material. The water draws its own where it meets the bird, as on every roof)
  fragmentPars: 'uniform vec4 uBiRim; uniform vec3 uBiRimColor, uBiFar; uniform vec2 uBiCap;',
  light: /* glsl */`{
    float biLum = dot(c, vec3(0.3, 0.5, 0.2));
    if (biLum > uBiCap.x) c = mix(c, c * ((uBiCap.x + (biLum - uBiCap.x) * uBiCap.y) / biLum), smoothstep(0.0, 0.05, vWPos.y));
    float biFar = smoothstep(12.0, 40.0, length(vViewPos));
    float biE = min(pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), mix(uBiRim.y, uBiFar.y, biFar)), 0.6);      // (held under its top: the very edge of a feather was a spark)
    float biUp = mix(1.0, uBiRim.z, smoothstep(-0.3, 0.5, N.y));
    vec4 biG = townGlowSoft(vWPos.xz, 4.5);
    float biL = biG.r * townWake(townS(biG), vWPos.xz, -1.0, biG.a);
    float biOn = smoothstep(0.0, 0.06, vWPos.y) * mix(uBiRim.w, 1.0, min(biL * 2.2, 1.0));
    vec3 biFrom = mix(uTownUnderCol, uTownJade, clamp(biG.g * 1.4, 0.0, 1.0)) * uBiRimColor;
    float biWash = uBiFar.z * (0.3 + 0.7 * (1.0 - smoothstep(-0.75, 0.1, N.y))) * mix(${NEAR_WASH.toFixed(3)}, 1.0, smoothstep(4.0, 9.5, length(vViewPos)));
    c += biFrom * ((biE * uBiRim.x * biUp + biWash) * biOn * mix(1.0, uBiFar.x, biFar)) * (0.3 + 0.7 * albedo);
  }`,
});

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const { kit, stage } = ctx;
  const light = shared.light || ensureLight(ctx, plan, shared);
  const boatDist = (x, z) => Math.hypot(x - ctx.boat.x, z - ctx.boat.z);
  const log = [], logAt = num('bilog', 0);
  const say = (line) => { if (logAt > 0) log.push(`${ctx.time.toFixed(2)} ${line}`); };
  const sd = (x, z) => { const l = ctx.path.locate(x, z, null, {}); return `s ${l.s.toFixed(1)} d ${l.d.toFixed(1)}`; };

  const api = shared.cast.birds = {
    list: [], byName: {}, perched: [], fishing: [], onEvent: null, onTouch: null, sound: true,
    cues: { shake: 'cormorant_shake', up: 'cormorant_up', foldRidge: 'cormorant_fold_ridge', foldLast: 'cormorant_fold_last' },
  };
  const R = BIRDS.rim, state = {};                                       // state[id]: this module's own notes on a bird
  const told = {}, once = (k, msg) => { if (!told[k]) { told[k] = true; note(msg); } };      // (another group's handle that throws is named once, and the birds go on)
  const later = [];                                                      // marks to come: [time, x, z, strength, radius]

  // ---------------------------------------------------------------------------------------------- paint
  const paintFor = (id, afloat) => {
    if (RAW) return {};
    if (PLAIN || typeof light.extendFor !== 'function') { if (!PLAIN) note('light.js gives no extendFor: the birds wear the family\'s own paint'); return { rim: { ...BIRDS.plain, strength: num('birim', BIRDS.plain.strength) }, ...(typeof light.extendFor === 'function' ? { extend: [light.extendFor(BIRDS.lit)] } : {}) }; }
    const U = {
      uBiRim: { value: new THREE.Vector4(num('birim', afloat ? BIRDS.rimAfloat.strength : R.strength), num('bipow', R.power), num('bitop', R.top), num('bifloor', R.floor)) },
      uBiRimColor: { value: new THREE.Color(R.color) },
      uBiFar: { value: new THREE.Vector3(num('bifar', R.far[0]), R.far[1], num('biwash', afloat ? BIRDS.rimAfloat.wash : R.wash)) },
      uBiCap: { value: new THREE.Vector2(num('bicap', R.cap[0]), R.cap[1]) },
    };
    state[id].U = U;
    return { extend: [light.extendFor(BIRDS.lit), BIRD_RIM(U)] };
  };

  // ---------------------------------------------------------------------------------------------- what each bird tells
  const hear = (id) => ({
    onEvent: (name, b) => {
      const st = state[id], p = b.position;
      say(`${id} ${name} at ${sd(p.x, p.z)}, boat ${boatDist(p.x, p.z).toFixed(1)} m`);
      if (st.fisher) {
        // the schools part round it while it is under the water (the fish group's handle; four at once in each system)
        if (name === 'under' && !st.threat) { const F = shared.cast.fishes; if (F && typeof F.threat === 'function') { try { st.threat = F.threat(() => [p.x, p.y, p.z], { ...BIRDS.threat }) || null; } catch (err) { once('threat', `shared.cast.fishes.threat threw: ${err}`); } } say(`${id} the schools' threat: ${st.threat ? 'on' : 'none'}`); }
        if ((name === 'surface' || name === 'afloat') && st.threat) { try { if (st.threat.remove) st.threat.remove(); } catch (err) { once('unthreat', `the threat's remove() threw: ${err}`); } st.threat = null; say(`${id} the schools' threat: off`); }
      }
      // a perched bird that shakes itself throws drops: a patch of small rings on the water beside its perch
      if (name === 'shake' && st.drops && boatDist(p.x, p.z) < BIRDS.shower.reach) {
        const Sh = BIRDS.shower, q = ctx.path.at(clamp(st.s, 0, ctx.path.length)), ax = q.tx * st.drops[0] + q.rx * st.drops[1], az = q.tz * st.drops[0] + q.rz * st.drops[1], al = Math.hypot(ax, az) || 1;
        for (let i = 0; i < Sh.count; i++) {
          const r = Sh.near + (Sh.far - Sh.near) * st.rnd(), w = (st.rnd() - 0.5) * Sh.wide, x = p.x + (ax * r - az * w) / al, z = p.z + (az * r + ax * w) / al;
          later.push([ctx.time + Sh.from + Sh.over * st.rnd(), x, z, Sh.strength[0] + (Sh.strength[1] - Sh.strength[0]) * st.rnd(), Sh.radius, 'drop', id]);
        }
      }
      if (api.sound && boatDist(p.x, p.z) < BIRDS.earshot) {
        if (name === 'shake') ctx.audio.play('rustle', { x: p.x, z: p.z, gain: 0.5 });
        else if (name === 'dive') ctx.audio.play('splash', { x: p.x, z: p.z, gain: 0.35 });
      }
      if (api.onEvent) { try { api.onEvent(name, id, b); } catch (err) { console.error(err); } }
    },
    onTouch: (x, z, kind, strength) => {
      if (kind !== 'wake') say(`${id} touch ${kind} ${strength.toFixed(2)} at ${sd(x, z)}`);
      if (kind === 'wake') { const b = api.byName[id], Wk = BIRDS.wake; if (b) { const h = b.heading, fx = Math.sin(h), fz = Math.cos(h);
        const k = num('biwake', Wk.strength); if (k > 0) for (const side of [-1, 1]) ctx.water.ripple(x - fx * Wk.behind + fz * Wk.aside * side, z - fz * Wk.behind - fx * Wk.aside * side, k, Wk.radius); } }
      if (kind === 'surface') {
        later.push([ctx.time + BIRDS.swell.after, x, z, BIRDS.swell.strength, BIRDS.swell.radius]);
        const S = shared.cast.sedges; if (S && typeof S.part === 'function') { try { S.part(x, 0.3, z, BIRDS.part.radius, BIRDS.part.seconds); say(`${id} sedges.part called`); } catch (err) { once('part', `shared.cast.sedges.part threw: ${err}`); } } else say(`${id} no sedges.part to call`);
        if (api.sound && boatDist(x, z) < BIRDS.earshot) ctx.audio.play('drop', { x, z, pitch: 0.6 });
      }
      if (api.onTouch) { try { api.onTouch(x, z, kind, id); } catch (err) { console.error(err); } }
    },
  });

  // ---------------------------------------------------------------------------------------------- the three on their perches
  const perchOf = (o) => {
    if (o.id === 'ridge') {
      const C = shared.church || {};
      if (C.perch && Number.isFinite(C.perch.x)) return { x: C.perch.x, y: C.perch.y, z: C.perch.z };
      note('shared.church.perch is missing (the church model did not build): no bird on the ridge end');
      return null;
    }
    let best = null;
    for (const p of shared.perches || []) if (Number.isFinite(p.s) && (!best || Math.abs(p.s - o.near) < Math.abs(best.s - o.near))) best = p;
    if (!best || Math.abs(best.s - o.near) > 6) { note(`shared.perches has no stack near s ${o.near}: no bird there`); return null; }
    if (!best.model) note(`the stack near s ${o.near} has no model of its own (kit_roofs did not build): the bird stands on the layout's place for it`);
    return { x: best.x, y: best.y, z: best.z };
  };
  for (const o of BIRDS.perched) {
    if (!want(o.id)) continue;
    const p = perchOf(o); if (!p) continue;
    state[o.id] = { fisher: false, held: false, shown: true, drops: o.drops || null, rnd: ctx.rng(o.seed * 31 + 7), s: ctx.path.locate(p.x, p.z, null, {}).s };
    const t = forId('biturn', o.id), turn = t && !Number.isNaN(+t[0]) ? +t[0] : o.turn;
    // (its feet a little back from the middle of a flat top, so that the tail, which hangs 3 cm below the feet 19 cm
    // behind them, hangs over the edge and not into the stone)
    const loc = ctx.path.locate(p.x, p.z, null, {}), h = kit.faceAngle('along', loc.s, loc.d) + turn, back = o.back || 0;
    try {
      const bird = await makeCormorant(ctx, { name: 'town-cormorant-' + o.id, seed: o.seed, position: [p.x - Math.sin(h) * back, p.y, p.z - Math.cos(h) * back], face: 'along', turn,
        life: o.life, still: 12, material: paintFor(o.id), ...hear(o.id) });
      bird.id = o.id; api.list.push(bird); api.byName[o.id] = bird; api.perched.push(bird);
    } catch (err) { note(`the bird "${o.id}" could not be made: ${(err && err.stack) || err}`); }
  }

  // ---------------------------------------------------------------------------------------------- the two that fish
  for (const o of BIRDS.fishing) {
    if (!want(o.id)) continue;
    state[o.id] = { fisher: true, held: false, shown: true, sheath: 0, threat: null };
    try {
      const bird = await makeCormorant(ctx, { name: 'town-cormorant-' + o.id, seed: o.seed, mode: 'fish', water: o.water, at: o.at, afloat: o.afloat, under: o.under, depth: o.depth,
        shy: 6, flush: 9, marks: BIRDS.marks, material: paintFor(o.id, true), ...hear(o.id) });
      bird.id = o.id; api.list.push(bird); api.byName[o.id] = bird; api.fishing.push(bird);
    } catch (err) { note(`the bird "${o.id}" could not be made: ${(err && err.stack) || err}`); }
  }
  const N = api.byName;

  // ---------------------------------------------------------------------------------------------- handles
  const perchedBy = (i) => (typeof i === 'string' ? N[i] : api.perched[i ?? 0]) || null;
  const fisherBy = (w) => (typeof w === 'string' ? N[w] : api.fishing[w ?? 0]) || null;
  const xzOf = (place) => { if (Array.isArray(place)) { const p = kit.at(place[0], place[1] ?? 0, 0); return [p.x, p.z]; } return [place.x, place.z]; };
  /** One of the perched birds shakes itself now (2.5 s; played at any distance). i: 0, 1, 2 or its id. */
  api.shake = (i) => { const b = perchedBy(i); if (b) b.shake(); return api; };
  /** It folds its wings: the family waits until the rider is more than 12 m off. */
  api.fold = (i) => { const b = perchedBy(i); if (b) b.fold(); return api; };
  /** It hangs them out again (the same waiting). */
  api.spread = (i) => { const b = perchedBy(i); if (b) b.spread(); return api; };
  /** A fisher dives now (if it is afloat). which: 'street' (default) | 'square'. */
  api.dive = (which) => { const b = fisherBy(which); if (b) b.dive(); return api; };
  /**
   * A fisher comes up at a place as soon as it may: place [s, d] or { x, z }. Under the water it makes for the place at
   * 1.3 m/s (allow for the way) and comes up within 2.5 m of it; afloat, it dives first. It still keeps 6 m from the hull.
   */
  api.surfaceAt = (place, which) => { const b = fisherBy(which); if (!b) return api; const st = state[b.id]; if (st.held) { st.held = false; b.show(); st.shown = true; b.set({ at: xzOf(place), under: true }); b.comeUp(); } else b.comeUp({ at: xzOf(place) }); return api; };

  /**
   * A fisher leaves its water for a while (away(which) or away(which, true)): the next time it is under the water it does
   * not come up, and is gone. away(which, false): it is back, under the water where it left (or at `place`: [s, d] or
   * { x, z }), and comes up as soon as it may. For a stretch of the staging that wants the water to itself.
   */
  api.away = (which, on = true, place) => {
    const b = fisherBy(which); if (!b) return api; const st = state[b.id];
    if (on) { if (!st.held) st.leave = true; }
    else { st.leave = false; if (st.held) { st.held = false; b.show(); st.shown = true; b.set({ at: place ? xzOf(place) : [b.position.x, b.position.z], under: true }); b.comeUp(); } }
    return api;
  };

  // ---------------------------------------------------------------------------------------------- the four small moments
  // (a cue that changes the world has a settle: a picture taken further on shows the world after it)
  if (N.stack) stage.cue(api.cues.shake, { s: BIRDS.cues.shake, settle: () => N.stack.set('dry') }, () => N.stack.shake());
  if (N.street) {
    const st = state.street, b = N.street, W = BIRDS.fishing[0].water;
    // Until its moment the street's fisher is out of sight (held under the water it would go round and round one place,
    // and this water is clear enough near the boat to show it). At the cue it is there, under the water, 18 m ahead and
    // to the left of where the boat is, and comes up: its head is out about 2.4 s later, if the boat is 6 m or more off.
    if (!Q.has('bifree')) { st.held = true; b.hide(); st.shown = false; }
    const free = (at) => { st.held = false; b.show(); st.shown = true; if (at) b.set({ at }); };
    stage.cue(api.cues.up, { s: BIRDS.cues.up, settle: () => {
      // afloat in its own water, at the first of three places that is well clear of the boat
      let at = null; for (const [s, d] of [[92, -3], [106, 2], [78, 3]]) { const p = kit.at(s, d, 0); if (!at || boatDist(p.x, p.z) > 14) at = [p.x, p.z]; if (boatDist(p.x, p.z) > 14) break; }
      free(st.held ? at : null);
    } }, () => {
      const l = ctx.path.locate(ctx.boat.x, ctx.boat.z, null, {});
      const p = kit.at(clamp(l.s + BIRDS.up.ahead, W.s[0] + 2, W.s[1] - 2), clamp(l.d - BIRDS.up.left, W.d[0] + 0.3, W.d[1] - 0.3), 0);
      // (hold: it keeps to that place and comes up within a metre or two of it; let go freely it had gone three metres on)
      if (st.held) { free(null); b.set({ at: [p.x, p.z], under: true, hold: true }); b.comeUp(); } else b.comeUp({ at: [p.x, p.z] });
      stage.after(BIRDS.up.again, () => { if (b.state === 'afloat') b.dive(); });
    });
  }
  if (N.ridge) stage.cue(api.cues.foldRidge, { s: BIRDS.cues.foldRidge, settle: () => N.ridge.set('folded') }, () => N.ridge.fold());
  if (N.last) stage.cue(api.cues.foldLast, { s: BIRDS.cues.foldLast, settle: () => N.last.set('folded') }, () => N.last.fold());

  // ---------------------------------------------------------------------------------------------- every frame
  const puts = api.list.map((b) => ({ b, put: forId('biput', b.id), does: (Q.get('bido') || '').split(';').map((v) => v.split(':')).filter((f) => f[0] === b.id && f.length > 2).map((f) => ({ what: f[1], t: +f[2], done: false })) }));
  let frames = 0, logged = false;
  const update = (dt) => {
    frames++;
    // (developer: a bird put somewhere, or told something at a time; after the stage's first frame, which settles the cues)
    if (frames === 2) for (const e of puts) if (e.put) {
      const f = e.put[0].split(','), p = kit.at(+f[0], +f[1] || 0, 0), st = state[e.b.id];
      if (st.fisher) { st.held = false; e.b.show(); st.shown = true; e.b.set({ at: [p.x, p.z], under: f[2] === 'under' }); }
    }
    if (frames >= 2) for (const e of puts) for (const d of e.does) if (!d.done && ctx.time >= d.t) {
      d.done = true; const b = e.b;
      if (d.what === 'dive') b.dive(); else if (d.what === 'up') b.comeUp(); else if (d.what === 'shake') b.shake(); else if (d.what === 'shiver') b.shiver();
      else if (d.what === 'fold') b.fold(); else if (d.what === 'spread') b.spread(); else if (d.what === 'foldnow') b.fold({ force: true });
      else if (d.what === 'away') api.away(b.id, true); else if (d.what === 'back') api.away(b.id, false);
      else if (d.what === 'mid') { const o = BIRDS.fishing.find((f) => f.id === b.id); if (o) api.surfaceAt([(o.water.s[0] + o.water.s[1]) / 2, (o.water.d[0] + o.water.d[1]) / 2], b.id); }      // (surfaceAt the middle of its own water)
    }
    for (const b of api.list) {
      const st = state[b.id], p = b.position, away = boatDist(p.x, p.z);
      // a bird far behind or far ahead is not drawn, and its life stands still until the boat is near again
      if (!st.held) { if (st.shown && away > BIRDS.far[1]) { b.hide(); st.shown = false; } else if (!st.shown && away < BIRDS.far[0]) { b.show(); st.shown = true; } }
      if (!st.fisher || !st.shown) continue;
      if (st.leave && b.submerged) { st.leave = false; st.held = true; b.hide(); st.shown = false; if (st.threat) { try { if (st.threat.remove) st.threat.remove(); } catch (err) { once('unthreat', `the threat's remove() threw: ${err}`); } st.threat = null; } continue; }      // (away(): gone while it is under the water)
      // under the water: a sheath of silver beads let go behind it (the small group's spare beads; it writes their rings)
      if (b.submerged && away < BIRDS.sheath.reach) {
        st.sheath -= dt;
        if (st.sheath <= 0) {
          st.sheath = BIRDS.sheath.every;
          const B = shared.cast.bubbles;
          if (B && typeof B.burst === 'function') { const h = b.heading, k = BIRDS.sheath.behind; try { B.burst(p.x - Math.sin(h) * k, Math.min(-0.25, p.y), p.z - Math.cos(h) * k, BIRDS.sheath.beads, BIRDS.sheath.spread); st.beads = (st.beads || 0) + BIRDS.sheath.beads; } catch (err) { once('burst', `shared.cast.bubbles.burst threw: ${err}`); } }
        }
      } else st.sheath = 0;
    }
    for (let i = later.length - 1; i >= 0; i--) if (ctx.time >= later[i][0]) {
      const m = later[i]; later.splice(i, 1); ctx.water.ripple(m[1], m[2], m[3], m[4]);
      if (m[5]) { say(`${m[6]} touch ${m[5]} ${m[3].toFixed(2)} at ${sd(m[1], m[2])}`); if (api.onTouch) { try { api.onTouch(m[1], m[2], m[5], m[6]); } catch (err) { console.error(err); } } }
    }
    if (logAt > 0 && !logged && ctx.time >= logAt) {
      logged = true;
      const birds = api.list.map((b) => ({ id: b.id, state: b.state, shown: state[b.id].shown, at: sd(b.position.x, b.position.z), y: +b.position.y.toFixed(2), boat: +boatDist(b.position.x, b.position.z).toFixed(1), town: +light.at(b.position.x, b.position.z).toFixed(3), beads: state[b.id].beads || 0 }));
      try { fetch('/__shot/' + (Q.get('bilogname') || 'town_birds_log') + '.json', { method: 'POST', body: JSON.stringify({ t: +ctx.time.toFixed(2), boat: sd(ctx.boat.x, ctx.boat.z), birds, log }) }); } catch (err) { /* no server: nothing written */ }
    }
  };
  let dead = false;
  return { update(dt) { if (dead) return; try { update(dt); } catch (err) { dead = true; note(`the birds' turn threw and was switched off: ${(err && err.stack) || err}`); } } };
}
