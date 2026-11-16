// The town below: the cast, group "Presences" (stage 3). docs/build/town/3-cast-presences.md is this module's log.
//
// The page's rows of this group (docs/art/town.md, section 5) and where each lives:
//   the clock               heroes_clock.js (shared.clock) and heroes.js (shared.tower): it runs. HERE: its stroke as a
//                           function of the show clock (the strike train, the hands' run to the top, the bell), unfired;
//                           and the hands' waiting for it (they arrive a few degrees short of one, whoever rows); and
//                           the down-route dial's two hands, which stood six hours out, righted
//   waking and sleeping     light.js (townWake, light.level), driven by set.js. HERE: each window's own three-second
//                           fade and the few that go out later ("the windows' own fade", below); the waking ring and the
//                           closing rings of the square's sleep as fronts of the lights family, unfired
//   the sky and the mist    set.js. HERE: the five lamp domes as the lights family's makeLampDomes, each with its disc on
//                           the mist, following the town's waking and kindling one after another from s 36; and the
//                           plumes of lit mist over the glass ridge and the nave's lancets (the set's cannot be seen)
//   water-light             light.js (every wall and stack) and heroes_b.js (the portico's net). HERE: the net on the
//                           tower's four piers, and the bands that climb piers and columns when a ring or a wake passes
//   the moths               the engine's lamp: a check, in the log
//
// What the families give is used as it stands (makeLampDomes, makeFront: docs/life/lights.md). light.js is another
// person's and is being reworked: nothing here edits it. The windows' own fade is laid, from this module, into the
// materials that ask the light's function for a single window: two statements of that function are replaced, all or
// nothing, and if the function's text is no longer the one this module knows it stands down and says so in the page
// errors (docs/build/town/3-cast-presences.md, "Asked of the light", has the same change for light.js itself).
//
// IN shared.cast AFTER THIS MODULE (nothing here plays a sound; the only cue placed is the domes' own, 'tp-domes'):
//   domes        the lamp domes: the family's handle and its controls, with the town's waking in them:
//                  kindle(i, seconds = 3), dim(i, seconds = 3), set(i, k) (at once: under the veil), levelOf(i) (what dome
//                  i gives now, 0..1.4), lamps (the family's: places and levels), heads (x, y, z, s of each),
//                  auto (true: this module kindles domes 0, 1, 2 itself when the boat reaches s 26: the page's moment;
//                  set it false to stage them yourself), object
//   presences    this group's own:
//     onBloom(x, z, what, i)   ASSIGN a function: what = 'dome' (dome i begins to kindle) or 'ring' (the waking ring
//                              leaves the tower): the page's `bloom` A3 (57), gain 0.4
//     stroke(T)                THE STROKE, this group's part of it, as a function of the show clock (seconds since the
//                              trigger; below 0: everything at rest): the fly spins up and the strike lever drops at
//                              2.5, the minute hands run to the top over 2.5 s, the bell swings from 2.5 (the clapper
//                              meets the lip at 3.0), the town holds its breath (45 per cent over 2 s), the ring of
//                              waking light leaves at 3.0 at 16 m/s (140 per cent inside it; the cloud's ring follows by
//                              itself, two seconds late: set.js), and the brightness settles from 24 to 34. Call it
//                              every frame from the staging: presences.stroke(stage.clock('stroke')). Returns
//                              { gain, flare, radius }. NOTHING HERE CALLS IT (but &tptest=stroke, for pictures)
//     wake                     the waking ring: a `makeFront` ring from the tower (16 m/s, 1.2 s; 2.5 s with reduced
//                              motion). stroke(T) launches and ticks it; ask it wake.arrival(x, 0, z), wake.level(x, 0, z),
//                              wake.reached(x, 0, z) for sounds and for what follows the light (the lanterns' letting go)
//     sleepAt(T)               THE SQUARE'S SLEEP on a clock of its own (seconds since its cue; below 0: nothing): rings
//                              closing on the tower over 12 s. It only ever takes light.state.square DOWN from what
//                              set.js makes of the boat's place, so a rider who stops gets the whole of it and one who
//                              presses on gets it sooner. Call it every frame; nothing here calls it (&tptest=sleep)
//     sleep                    its front (a closing ring: sleep.arrival(x, 0, z) is when a place goes dark)
//     times                    the stroke's own times on its show clock: { warning, hands, bell, clapper, ring, ... }
//     onKiss(fn), onTick(fn)   the clock's two sounds, passed on from shared.clock: fn(x, z) as the bob meets the lake
//                              (every 3.0 s: the page's tick and drop, heard from s 116) and as a tooth lands (0.9 s later)
//     hands                    { wait: 58.5 }: minutes past twelve at which the hands wait for stroke(T), which runs
//                              them to the top (see "the hands", below: they arrive there creeping, whoever rows).
//                              wait = null gives the dial back to the movement
//     level(s, x, z, rnd, stay)   light.level with the windows' own fade in it (the script's twin of what is drawn)
//     late                     the windows that go out later, on their own: [{ x, y, z, s, d, tone, rnd, mark, delay, at }]
//                              (at: the realm's time at which its street went; Infinity: not yet)
//     fade                     { on, seconds, patched: how many materials carry it, stayers, jade }
//     waterLight               { object, uniforms, level, places }: the sheet on piers and columns (level 0: none)
//     plumes                   { object, uniforms, places }: the lit mist over the glass ridge and the nave
//                              (uniforms.uPl.value.x: how thick; .y: how soon the light under it fills it)
//     log()                    numbers for the proof (the kiss's period, the rim's height, the hands' rate, the ring's
//                              period, the windows), also printed by &tplog=<seconds>
//
// Developer switches:  &tptest=stroke | sleep | kindle | lap (with &tpt0=<seconds>: when it begins, default 1; lap: the
//                      page's last slow ring from 12 m astern every 7 s, to look at the columns' bands)
//                      &tpdomes=0  the kit's glows as they were, no domes     &tpmist=0  no discs on the mist
//                      &tpfade=0   the windows fade as light.js alone has them  &tplate=0  no window goes out later
//                      &tpwl=level,nets,bands,reach,lean,crest,columns  the water-light's numbers (&tpwl=0: none)
//                      &tpdome=intensity,core,radius,mist   the domes' numbers  &tplog=<seconds>  print the proof's numbers
//                      &tpnet=<tile width>,<tile height>,<focus at rest>,<focus in a ring>,<floor>,<gain>,<plain>,<push>  the piers' web
//                      &tphands=0  the down-route dial's hands as the tower's module leaves them (six hours out)
//                      &tpplume=0  no plumes (&tpplume=<how thick>,<how lit>: other numbers)
import * as THREE from 'three';
import { makeLampDomes, makeFront, MIN_RISE } from '../../engine/life/lights.js';
import { FOG_PARS, NOISE_GLSL } from '../../engine/kit.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);
const note = (msg) => console.error('INVALID_ note (cast_presences): ' + msg);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sm = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const fract = (v) => v - Math.floor(v);

// This group's numbers (plan.presences, if a later stage adds one to plan.js, is laid over them).
const PRES = {
  // the lamp domes: a ball of rose-gold light 3 m across round each head that burns 0.4 m under the surface, and a soft
  // old-rose disc on the mist 2 m above it. `top`: the most a dome is ever asked for (the stroke's flare, 140 per cent)
  // `layers`: [depth, share] of the family's balls that make one dome (see the lamp domes, below)
  domes: { radius: 1.5, color: '#E06A30', core: '#FFA860', intensity: 1.05, coreLevel: 0.45, top: 1.4, kindle: 3, halo: 0.3,
    layers: [[0.05, 0.5], [0.2, 0.45], [0.4, 0.6]],
    mist: { height: 2, size: 4.4, color: '#c76c8c', level: 0.22 },      // (third holder: 0.085 -> 0.22. With the disc and without it were one picture; at 0.4 it is a pink cloud)
    // the page's moment at s 26: the first dome (s 36) kindles, then the second and the third. `at`: seconds into the
    // moment; `pace`: a rider who presses on gets it sooner (the moment's clock is never less than (s - 26) / pace)
    first: { s: 26, at: [0.6, 4.2, 7.8], pace: 1.5 } },
  // the stroke (section 6 of the page), in seconds from its trigger
  stroke: { fly: 3, spin: 1.0625, drop: 2.5, coast: 0.5625, hands: 2.5, bell: 2.5,
    breath: 0.45, breathOver: 2, ring: 3, amount: 0.4, restore: [11, 20], settle: [24, 34] },
  wake: { speed: 16, rise: 1.2, calmRise: 2.5 },
  // the square's sleep: light.js puts a light out when (1 - square) * 84 m of ring has closed past it, over a band of 9 m
  sleep: { reach: 84, band: 9, over: 12 },
  // water-light on the tower's piers and the portico's columns: level = how much of it; nets = the slow nets from still
  // water (the piers only: the columns have the portico's own); bands = the bright bands the living water throws on the
  // stone; reach = metres of water out from the wall's foot that fall on one metre of stone up; lean = how soon a face
  // of water that leans to the wall shows (350: a lean of two in a thousand is half); crest = how sharp a crest shows
  // fully; columns = the columns' share of the bands; height = it fails by here; far = none beyond this from the boat
  // (the bands themselves live only in the engine's ripple field, 32 m round the boat);
  // web = the piers' net, which is the area's own caustic tile (light.js): metres across and up one tile of it, how far
  // out of focus it is read on still water, and where a ring passes; floor, gain = what is taken off it so that the
  // stone shows between its threads, and its strength after; plain = the share of a band that is plain light (the rest
  // is the web made brighter); push = metres the web is carried for a slope of one in one of the water at the wall's
  // foot (a ring makes it quiver); rose = the bloom of a thread (old rose: its core is the state's own water-light).
  // (Second look: the third holder's net was drawn threads of which two masks left only some, so its meshes did not
  // close: forked veins at rest, and under the rider's wake, where a band lit a ragged part of them four times as
  // bright, tongues of fire up the tower's feet. See the shader.)
  waterLight: { level: 1, nets: 0.28, bands: 0.7, reach: 1.1, lean: 350, crest: 0.009, columns: 0.8, height: 6, far: 80,
    web: [2.1, 3.1, 1.25, 0.35], floor: 0.28, gain: 1.2, plain: 0.4, push: 12, rose: '#C76C8C' },
  // plumes of lit mist over the brightest water (the glass ridge, the nave's lancets): thick = the most a card hides of
  // what stands behind it; lit = how soon the light under it fills it; near = none within, whole beyond (metres from the
  // rider); layers = cards to a plume; rose, jade = what it is lit with; glass.along = metres along the ridge from its
  // middle; nave.pairs = between which two lancets of each flank; y = its foot; width, height = one card
  plumes: { thick: 0.2, lit: 1.3, near: [6, 16], layers: 2, rose: '#8a4a66', jade: '#3a8f84',
    glass: { along: [-15.5, -7.75, 0, 7.75, 15.5], y: 0, width: 13.5, height: 4.8 }, nave: { pairs: [[1, 2], [5, 6]], y: 0, width: 9, height: 3.6 } },
  // each window's own fade (seconds), and the few that go out later on their own: every jade one that stays, and of
  // the others one for every `every` metres of the route within `within` metres of its line; how many seconds after
  // its street has gone each of them goes ([from, to], by its own random number; in the square after the ring has passed)
  fade: { seconds: 3, every: 16, within: 46, jade: { street: [4, 24], square: [3, 15] }, other: { street: [5, 17], square: [4, 16] } },
  // the hands (minutes past twelve): they stand short of the hour at `wait` for a rider who dawdles (the last `knee`
  // minutes ever more slowly: never a halt); `ahead`: minutes the dial is put on at the realm's beginning, so that a
  // rider left to the current arrives with the minute hand a few degrees short of the top; `under`: how far under
  // that rider's reading the hands are kept for one who presses on; `to`: where the boat fires the stroke
  hands: { wait: 58.5, knee: 1, ahead: 2.5, under: 0.6, to: 160 },
};

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const P = { ...PRES, ...(plan.presences || {}) };
  const light = ensureLight(ctx, plan, shared), town = light.town, U = light.U, stage = ctx.stage;
  const tw = { x: U.uTownTower.value.x, z: U.uTownTower.value.y };
  const api = shared.cast.presences = { onBloom: null, hands: { wait: P.hands.wait } };
  const bloom = (x, z, what, i) => { if (typeof api.onBloom === 'function') { try { api.onBloom(x, z, what, i); } catch (err) { console.error('cast_presences: onBloom threw', err); } } };
  const TEST = Q.get('tptest') || '', T0 = num('tpt0', 1);

  // ================================================================================================ the lamp domes
  // Five heads burn 0.4 m under the surface (the lamp row's first three at s 36, 48, 60; the two on their plinths at
  // the foot of the theatre steps). The kit gave each a glow that faces the rider at the lamp head; from the boat that
  // is a disc UNDER the place the sedge flies turn on, and it cannot kindle. The family's dome is a ball of light in
  // the water worked out along the eye's own bent ray: a low lens of light lying in the surface as the rider comes up
  // to it, a round pool from above, wavering with every ring. Here each follows the town's own waking (it drowses at
  // 60 per cent ahead, is awake near the boat, stays half lit behind, breathes, flares with the stroke) times its own
  // kindling, and the same number is handed to the sedge flies that turn over it.
  // ONE DOME IS THREE OF THE FAMILY'S BALLS, one over another (PRES.domes.layers: 0.05, 0.2 and 0.4 m down). This water shows
  // what lies beneath it straight along the eye's line, so from 18 m a head 0.4 m down is seen 4.8 m short of where it
  // stands, and the family (rightly) puts its ball where the picture shows the lamp: the flies, who are on the surface at
  // the true place, then turn on dark water beyond their light. Three balls at three depths between the surface and the
  // head are seen at three places between the flies and the lantern and join them: close to, one round pool 3 m across
  // with the lantern at its heart; along the street, a low oval of light, the lantern at its near edge, the flies over its
  // far half. (Their discs on the mist stand at one place and are a third as strong each.)
  const heads = town.lamps.filter((l) => l.kind === 'row' && l.y > -1).map((l) => ({ x: l.x, y: l.y, z: l.z, s: l.s, d: l.d }));
  const D = P.domes, TOP = D.top, n = heads.length;
  const kd = heads.map(() => ({ k: 1, to: 1, per: D.kindle })), lvl = new Float32Array(n);
  // (the five lanterns' own glass and halo, which kindle with their domes: see "a lamp lights", below. HEADS: for the
  // lamps' material, x, z and height of each head and how far its glass is lit, 0..1; haloOf: each head's own halo)
  const HEADS = { value: [0, 1, 2, 3, 4].map((i) => (heads[i] ? new THREE.Vector4(heads[i].x, heads[i].z, heads[i].y, 1) : new THREE.Vector4(1e6, 1e6, 0, 1))) }, haloOf = [];
  let fam = null, layers = D.layers, headsLaid = 0;
  if (Q.get('tpdomes') !== '0' && n) {
    const dv = (Q.get('tpdome') || '').split(','), dn = (i, d) => (dv[i] != null && dv[i] !== '' && Number.isFinite(+dv[i]) ? +dv[i] : d);
    const mist = Q.get('tpmist') === '0' || !D.mist ? null : { ...D.mist, level: dn(3, D.mist.level) * TOP };
    const dc = (Q.get('tpcol') || '').split(',').map((v) => (/^[0-9a-fA-F]{6}$/.test(v) ? '#' + v : null));      // (&tpcol=<body hex>,<core hex>,<mist hex>: other colours, to look at)
    if (mist && dc[2]) mist.color = dc[2];
    // (each dome is THREE of the family's balls, one over another: see `layers` in PRES)
    const lv = (Q.get('tplayers') || '').split(';').filter(Boolean).map((p) => p.split(':').map(Number)).filter((p) => p.length === 2 && p.every(Number.isFinite));      // (&tplayers=<depth>:<share>;<depth>:<share>;.. to try others)
    if (lv.length) layers = lv;
    if (mist) mist.level /= layers.length;
    fam = makeLampDomes(ctx, { lamps: heads.flatMap((l) => layers.map(([y]) => ({ x: l.x, y: -Math.abs(y), z: l.z }))), radius: dn(2, D.radius), color: dc[0] || D.color, core: dc[1] || D.core, intensity: dn(0, D.intensity) * TOP, coreLevel: dn(1, D.coreLevel) * TOP, mist });
    // the kit's glows stood in for these (kit.js, shared.lampDomes.glows): hidden, not removed (their line is the kit owner's)
    const old = shared.lampDomes && shared.lampDomes.glows;
    if (old && old.points) old.points.visible = false;
    // And the street's own halo round each of these five heads (kit_street.js gives every lamp head one: a glow 3.4 m
    // across that faces the rider, in one instanced mesh with the other lamps'): with a dome it is the same light
    // twice, and it is the pale disc UNDER the place the flies turn on. It is drawn down to a small flame's breadth round
    // the lantern's glass (its own instance in that mesh, found by its place; nothing else of the mesh is touched).
    const keep = num('tphalo', D.halo);
    ctx.group.traverse((o) => {
      const a = o.name === 'town-halos' && o.geometry && o.geometry.getAttribute && o.geometry.getAttribute('aHalo');
      if (!a) return;
      let hit = false;
      for (let i = 0; i < a.count; i++) heads.forEach((h, k) => { if (Math.abs(a.getX(i) - h.x) < 0.06 && Math.abs(a.getZ(i) - h.z) < 0.06 && Math.abs(a.getY(i) - h.y) < 0.4) { haloOf.push({ a, i, k, w: a.getW(i) * keep, now: -1 }); if (keep !== 1) { a.setW(i, a.getW(i) * keep); hit = true; } } });
      if (hit) a.needsUpdate = true;
    });
    // ---- A LAMP LIGHTS: THE GLASS FIRST, THEN THE WATER ROUND IT (second look). The five lanterns are the kit's
    // (kit_street.js, one mesh with every other lamp, 'town-lamps'), and their glass burns at the town's own level: so a
    // dome kindled round a lantern that was already lit, and the page's moment at s 26, lamps lighting one after
    // another, was pools spreading round three lit lamps (the third holder's own third point, and the first thing a
    // stranger sees there). The kit has no level for one lamp. Here the statement that makes a lantern's glass give
    // off light is given one more factor in the lamps' own material: what this module says of the five heads, each
    // found by its place (every other lamp reads 1 and burns as it did). The text is the kit's; if it is no longer
    // there this stands down with a note, the lanterns burn as the kit has them and the domes kindle round them.
    // &tpheads=0: as it was. (See "Asked of the set" in the log: a level for each of these five belongs in the kit.)
    if (Q.get('tpheads') !== '0') {
      const G0 = 'uniform vec3 uKsLamp, uKsLampCore;', G1 = 'glow += mix(uKsLamp, uKsLampCore, pow(clamp(dot(N, V), 0.0, 1.0), 2.0)) * (kl * kUnder); }';
      ctx.group.traverse((o) => {
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of mats) {
          if (!m || !m.isShaderMaterial || typeof m.fragmentShader !== 'string' || m.fragmentShader.includes('presHead(') || !m.fragmentShader.includes(G0) || !m.fragmentShader.includes(G1)) continue;
          m.fragmentShader = m.fragmentShader.replace(G0, G0 + ' uniform vec4 uPresHead[5]; float presHead(vec3 p) { float k = 1.0; for (int i = 0; i < 5; i++) { vec2 e = p.xz - uPresHead[i].xy; if (dot(e, e) < 0.5 && p.y > uPresHead[i].z - 1.3) k = uPresHead[i].w; } return k; }')
            .split(G1).join('glow += mix(uKsLamp, uKsLampCore, pow(clamp(dot(N, V), 0.0, 1.0), 2.0)) * (kl * kUnder * presHead(vWPos)); }');
          m.uniforms.uPresHead = HEADS; m.needsUpdate = true; headsLaid++;
        }
      });
      if (!headsLaid) note('the kit\'s lamps no longer have the statement this module knows: the five lanterns burn as the kit has them, and their domes kindle round lit glass');
    }
  }
  const domes = {
    object: fam ? fam.object : null, lamps: fam ? fam.lamps : [], heads, auto: true,
    /** Dome i comes alight over `seconds` (never under half a second). */
    kindle(i, seconds = D.kindle) { const st = kd[i]; if (!st) return domes; if (st.k < 0.05 && st.to < 0.5) bloom(heads[i].x, heads[i].z, 'dome', i); st.to = 1; st.per = seconds; return domes; },
    dim(i, seconds = D.kindle) { const st = kd[i]; if (st) { st.to = 0; st.per = seconds; } return domes; },
    /** Its kindling at once, 0..1 (under the veil, or a realm entered part-way). */
    set(i, k) { const st = kd[i]; if (st) st.k = st.to = clamp01(k); return domes; },
    /** What dome i gives now: its kindling times the town's waking there (0..1.4). */
    levelOf: (i) => (i >= 0 && i < n ? lvl[i] : 0),
  };
  // (the page's moment at s 26: until then the first three are cold; a rider who enters beyond it finds them burning)
  const F = D.first;
  for (let i = 0; i < Math.min(3, n); i++) domes.set(i, 0);
  stage.cue('tp-domes', { s: F.s, settle: () => { for (let i = 0; i < n; i++) domes.set(i, 1); } }, () => {});
  if (TEST === 'kindle') domes.auto = false;
  shared.cast.domes = api.domes = domes;
  let wheelsTold = false;

  // ================================================================================================ the stroke's controls
  // Two fronts of the lights family, centred on the tower. Neither is launched here.
  //   wake    the ring of waking light: 16 m/s, an edge of 1.2 s (2.5 s for a rider who asked for reduced motion). What is
  //           DRAWN is light.js's own ring (light.U.uTownFlare: x the leading edge's radius, y how much brighter inside,
  //           z the edge's depth in metres), which has exactly this front's shape with no raggedness: stroke(T) writes
  //           the one from the other every frame, so what the script is told (arrival, level) is what the windows show
  //   sleep   the closing rings of the square's sleep. light.js puts the square's lights out from light.state.square (1
  //           awake .. 0 asleep): a place r metres from the tower begins to go when 84 * (1 - square) + r passes 84 and
  //           is dark 9 m later. A ring that begins 75 m out and closes at 7 m/s with an edge of 9 m is that, exactly
  const WK = P.wake, SL = P.sleep, SK = P.stroke;
  const wake = makeFront(ctx, { name: 'prwake', shape: 'ring', origin: [tw.x, 0, tw.z], speed: WK.speed, rise: WK.rise, rag: 0, waves: 2, calm: { rise: WK.calmRise } });
  const sleepSpeed = SL.reach / SL.over;
  const sleep = makeFront(ctx, { name: 'prsleep', shape: 'ring', origin: [tw.x, 0, tw.z], speed: sleepSpeed, rise: SL.band / sleepSpeed, rag: 0, waves: 2 });
  let wakeK = -1, sleepK = -1, hr = null, bloomed = false;
  const clock = () => shared.clock, tower = () => shared.tower;
  const fly0 = clock() && clock().strike ? clock().strike.fly : 0;

  // The fly's turns at T seconds into the warning. The strike lever is lifted by a pin of the great wheel through the
  // first 0.875 of a pin's pitch and drops there (clock_movement.json, strike.cam); one pitch is 6.75 turns of the fly.
  // So: the fly spins up to three turns a second over the first second, has made 5.906 turns at 2.5 s (the lever
  // drops: the falling lever pulls the bell wire and the wheel turns the bell), and coasts to a stop at 6.75 turns
  // exactly, where the train stands locked again as it stood before (the great wheel one pin on).
  const flyTurns = (T) => {
    if (T <= 0) return 0;
    const r = SK.fly, a = SK.spin, d = SK.coast;
    if (T < a) { const u = T / a; return r * a * (u * u * u - 0.5 * u * u * u * u); }
    const atDrop = r * (a / 2) + r * (SK.drop - a);
    if (T <= SK.drop) return r * (a / 2) + r * (T - a);
    if (T < SK.drop + d) { const v = (T - SK.drop) / d; return atDrop + r * d * (v - (v * v * v - 0.5 * v * v * v * v)); }
    return atDrop + r * d / 2;
  };
  // What the movement alone shows now, in minutes past twelve (the tower's own sum, without `nudge`: `minutes - nudge` is
  // only that on a frame in which nobody has yet changed the nudge)
  const naturalOf = (ck) => ck.start + (clock() && clock().minuteAngle ? clock().minuteAngle() : ctx.time / 240 * Math.PI * 2) / (Math.PI * 2) * 60;
  // The minute hands' run to the top. The tower shows start + nudge + what the movement has turned (shared.tower.clock);
  // the run is in `nudge`, so the hands go on in the escape wheel's own steps afterwards, from the hour.
  const handsRun = (T) => {
    const ck = tower() && tower().clock; if (!ck) return;
    if (T < 0) { hr = null; return; }
    const natural = naturalOf(ck);                                                 // what the movement alone shows now
    if (!hr) { const from = natural + ck.nudge, top = Math.ceil((from - 1e-6) / 60) * 60; hr = { T0: T, from, top, held: null }; }
    if (T < SK.hands) ck.nudge = hr.from + (hr.top - hr.from) * ease((T - hr.T0) / Math.max(1e-3, SK.hands - hr.T0)) - natural;
    else {
      // (first asked for after the run was over: the hands have gone on from the hour since. A cue that was settled, the
      // realm entered beyond it, hands this a clock that reads a hundred thousand: then the hands show what a boat left
      // to the current would find, the minutes it takes from the place of the stroke to where the boat has been)
      if (hr.held == null) { const late = hr.T0 - SK.hands, drifted = Math.max(0, tHo(light.state.reach) - tHo(P.hands.to)); hr.held = hr.top + Math.max(0, late > 3600 ? drifted : late) * 0.25 - natural; }
      ck.nudge = hr.held;
    }
  };

  /** The stroke at T seconds from its trigger (see the head of this file). */
  api.stroke = (T) => {
    const c = clock(), t = tower();
    if (c && c.strike) c.strike.fly = fly0 + flyTurns(T);
    handsRun(T);
    if (t && t.stroke) t.stroke(T - SK.bell);
    wake.tick(T);
    if (T < 0) { if (wakeK >= 0) { wake.clear(); wakeK = -1; } bloomed = false; }
    else if (wakeK < 0) wakeK = wake.launch({ at: SK.ring });
    // The town's level. It holds its breath: 45 per cent over two seconds, everywhere. Then the ring: inside it 140 per
    // cent, outside it still the held breath, so gain stays at 0.45 and the ring carries the whole of the difference;
    // once the ring has crossed the lake the two change places (gain back to 1, the ring's share down to 0.4) with their
    // product held, so nothing inside the ring moves; and from 24 to 34 the 140 settles to 100.
    let g = 1, y = 0;
    if (T >= 0) {
      const hold = 1 - (1 - SK.breath) * ease(T / SK.breathOver);
      g = hold + (1 - hold) * ease((T - SK.restore[0]) / (SK.restore[1] - SK.restore[0]));
      const inside = 1 + SK.amount * (1 - ease((T - SK.settle[0]) / (SK.settle[1] - SK.settle[0])));
      y = T >= SK.ring ? inside / g - 1 : 0;
    }
    light.state.gain = g; U.uTownWake.value.w = g;
    const Fl = U.uTownFlare.value, radius = wakeK >= 0 ? wake.position(wakeK) : -1;
    Fl.x = Math.max(radius, -1); Fl.z = WK.speed * wake.rise; Fl.y = radius > 0 ? y : 0;
    if (T >= SK.ring && !bloomed && T < SK.ring + 1.5) { bloomed = true; bloom(tw.x, tw.z, 'ring', -1); }
    return { gain: g, flare: Fl.y, radius };
  };
  /** The square's sleep at T seconds from its cue (see the head of this file). */
  api.sleepAt = (T) => {
    sleep.tick(T);
    if (T < 0) { if (sleepK >= 0) { sleep.clear(); sleepK = -1; } return 1; }
    if (sleepK < 0) sleepK = sleep.launch({ at: 0, closing: SL.reach - SL.band });
    const sq = 1 - clamp01(sleep.position(sleepK) / SL.reach);
    light.state.square = Math.min(light.state.square, sq);
    return light.state.square;
  };
  api.wake = wake; api.sleep = sleep;
  /** The stroke's own times on its show clock (seconds), for whoever stages the sounds and the other groups' beats. */
  api.times = { warning: 0, hands: SK.hands, bell: SK.bell, clapper: SK.bell + 0.48, ring: SK.ring, ringSpeed: WK.speed, breath: SK.breath, breathOver: SK.breathOver, restore: SK.restore, settle: SK.settle, sleepOver: SL.over };
  /** The clock's two sounds, passed on from shared.clock so that this group's hooks are in one place: onKiss(fn(x, z)): the
   *  bob meets the lake (every 3.0 s; the page's tick and drop); onTick(fn(x, z)): a tooth lands on a pallet (0.9 s later). */
  api.onKiss = (fn) => { const c = clock(); if (c && c.onKiss) c.onKiss(fn); return api; };
  api.onTick = (fn) => { const c = clock(); if (c && c.onTick) c.onTick(fn); return api; };

  // ================================================================================================ the windows' own fade
  // The page: "windows come up to full as it nears (a fade of 3 s each, started somewhere between 70 and 40 m ahead);
  // they go out 30 to 60 m behind it, one in five staying on, one in forty of those going out later on its own". And:
  // "lights fade over 3 s ... never as a switch"; "the last lit window in a street is always a warm one". light.js
  // gives every window its own two marks (how far ahead it wakes, how far behind it sleeps) but fades it across 5 m of
  // the boat's TRAVEL: three seconds at the current's pace, one second for a rider who paddles, and for a rider who
  // stops, a window caught half-way stays half lit for as long as he stays.
  // Here a window's fade begins when the boat's farthest reach passes its mark and takes three seconds of TIME,
  // whatever the boat does next. No window carries a clock: the module keeps a short record of where the farthest
  // reach stood at nine moments, now and back to three seconds ago, and the shader reads out of it how long ago the
  // reach passed a window's mark. So a rider who stops sees the windows that had begun finish, and nothing else
  // change; one who paddles sees the same three seconds, begun sooner; nothing ever runs backward.
  // (The first holder's form of it, the mark's place between the reach now and the reach three seconds ago, was right
  // at a steady pace only: for a boat that stops just past a mark the whole fade fell into its last tenth of a second.)
  // And the few that go out later, on their own: each is a window that stays lit when its street sleeps and goes out
  // by itself some seconds after the street has gone, over the same three seconds, so that a rider who has stopped to
  // look back sees one more window go. Which: EVERY jade one that stays (what is then left burning in a sleeping
  // street is warm: the page's "the last lit window in a street is always a warm one"), and of the others about one
  // in forty, chosen near the route where they can be watched, a pale gold one where there is one. The shader is told
  // through a small picture: one texel for each 65,536th of the windows' own random number, 1 burning .. 0 gone.
  const FD = P.fade, FADE = FD.seconds, HS = 8, LT = 256;
  const UR = { value: new Array(HS + 1).fill(0) };                                 // the farthest reach now [0], and at HS moments back to FADE seconds ago [HS]
  const lateData = new Uint8Array(LT * LT).fill(255);
  const lateTex = new THREE.DataTexture(lateData, LT, LT, THREE.RedFormat);
  lateTex.colorSpace = THREE.NoColorSpace; lateTex.magFilter = lateTex.minFilter = THREE.NearestFilter; lateTex.wrapS = lateTex.wrapT = THREE.ClampToEdgeWrapping; lateTex.generateMipmaps = false; lateTex.needsUpdate = true;
  ctx.onDispose(() => lateTex.dispose());
  const UT = { value: lateTex };
  const fade = api.fade = { on: Q.get('tpfade') !== '0', seconds: FADE, patched: 0, twin: false, stayers: 0, jade: 0 };
  const S1 = 'else { float a = 40.0 + 30.0 * rnd, b = 30.0 + 30.0 * fract(rnd * 7.31 + 0.17); up = 1.0 - smoothstep(a - 2.5, a + 2.5, ahead); on = 1.0 - smoothstep(b - 2.5, b + 2.5, -ahead); }';
  const S2 = 'float lvl = mix(0.6, 1.0, up) * mix(stay * 0.85, 1.0, on);';
  const S3 = 'uniform vec4 uTownRect, uTownWake, uTownTower, uTownFlare;';
  const OLD = typeof light.GLSL === 'string' ? light.GLSL : '';
  const known = OLD.includes(S1) && OLD.includes(S2) && OLD.includes(S3) && OLD.split(S1).length === 2 && OLD.split(S2).length === 2 && OLD.split(S3).length === 2;
  const NEW = !known ? '' : OLD
    .replace(S3, S3 + /* glsl */` uniform float uPresR[${HS + 1}]; uniform sampler2D tPresLate;
      float presFade(float X) { float f = 0.0; for (int i = 0; i < ${HS}; i++) f += clamp((uPresR[i] - X) / max(uPresR[i] - uPresR[i + 1], 0.0001), 0.0, 1.0); return f / ${HS}.0; }
      float presLate(float rnd) { float i = floor(rnd * 65536.0); return texture2D(tPresLate, (vec2(mod(i, 256.0), floor(i / 256.0)) + 0.5) / 256.0).r; }`)
    .replace(S1, /* glsl */`else { float a = 40.0 + 30.0 * rnd, b = 30.0 + 30.0 * fract(rnd * 7.31 + 0.17);
      float pwU = presFade(s - a), pwO = presFade(s + b);
      up = pwU * pwU * (3.0 - 2.0 * pwU); on = 1.0 - pwO * pwO * (3.0 - 2.0 * pwO); }`)
    .replace(S2, 'float lvl = mix(0.6, 1.0, up) * mix(stay * 0.85 * ((rnd >= 0.0 && stay > 0.5) ? presLate(rnd) : 1.0), 1.0, on);');
  if (fade.on && !known) { fade.on = false; note('light.js no longer has the waking function this module knows: the windows fade as light.js alone has them (across 5 m of travel), and none goes out later'); }
  // does a shader ask the light's function for ONE window (its third argument is not the average, -1.0)?
  const asksForOne = (src) => {
    const rest = src.split(OLD).join('');
    for (let i = rest.indexOf('townWake('); i >= 0; i = rest.indexOf('townWake(', i + 1)) {
      let depth = 0, arg = 0, from = i + 9, third = null;
      for (let j = from; j < rest.length; j++) {
        const ch = rest[j];
        if (ch === '(') depth++;
        else if (ch === ')') { if (depth === 0) { if (arg === 2) third = rest.slice(from, j); break; } depth--; }
        else if (ch === ',' && depth === 0) { if (arg === 2) { third = rest.slice(from, j); break; } arg++; from = j + 1; }
      }
      if (third != null && third.trim() !== '-1.0') return true;
    }
    return false;
  };
  const seen = new WeakSet();
  const lay = () => {
    if (!fade.on) return 0;
    let made = 0;
    ctx.group.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (!m || !m.isShaderMaterial || seen.has(m)) continue;
        seen.add(m);
        const inF = typeof m.fragmentShader === 'string' && m.fragmentShader.includes(OLD), inV = typeof m.vertexShader === 'string' && m.vertexShader.includes(OLD);
        if (!inF && !inV) continue;
        if (!((inF && asksForOne(m.fragmentShader)) || (inV && asksForOne(m.vertexShader)))) continue;
        if (inF) m.fragmentShader = m.fragmentShader.split(OLD).join(NEW);
        if (inV) m.vertexShader = m.vertexShader.split(OLD).join(NEW);
        m.uniforms.uPresR = UR; m.uniforms.tPresLate = UT; m.needsUpdate = true;
        made++;
      }
    });
    fade.patched += made;
    return made;
  };
  // ---- the script's twins: how far through its three seconds a light is whose mark the reach has passed; what is left
  // of a light that goes out later; and light.level with both in it. The last copies light.js's function, so it is first
  // held against the original as that stands (with the fade across 5 m of travel): if they differ, the original is used.
  const fadeOf = (X) => { const R = UR.value; let f = 0; for (let i = 0; i < HS; i++) f += clamp01((R[i] - X) / Math.max(R[i] - R[i + 1], 1e-4)); return f / HS; };
  const cellOf = (rnd) => Math.floor(Math.fround(rnd) * 65536) & 65535;
  const lateOf = (rnd) => lateData[cellOf(rnd)] / 255;
  const replica = (s, x, z, rnd, stay, timed) => {
    const W = U.uTownWake.value, ahead = s - W.x; let up, on;
    const a = 40 + 30 * rnd, b = 30 + 30 * fract(rnd * 7.31 + 0.17);
    if (timed) { up = ease(fadeOf(s - a)); on = 1 - ease(fadeOf(s + b)); }
    else { up = 1 - sm(a - 2.5, a + 2.5, ahead); on = 1 - sm(b - 2.5, b + 2.5, -ahead); }
    const sq = sm(144, 152, s) * (1 - sm(208, 216, s)), r = Math.hypot(x - tw.x, z - tw.z), k = 1 - W.z;
    const sqOn = 1 - sm(0, 0.12, k * 1.12 - (1 - Math.min(1, r / 75)));
    on = on + (sqOn - on) * sq;
    const kept = stay * 0.85 * (timed && stay > 0.5 ? lateOf(rnd) : 1);
    let v = (0.6 + 0.4 * up) * (kept + (1 - kept) * on);
    v *= 1 + 0.12 * Math.sin(6.2832 * (s / 90 - W.y / 14));
    const Fl = U.uTownFlare.value; v *= 1 + Fl.y * (1 - sm(Fl.x - Fl.z, Fl.x, r));
    return v * W.w;
  };
  { const rr = ctx.rng(733); let worst = 0;
    const keep = U.uTownWake.value.clone(); U.uTownWake.value.set(118, 3.7, 0.6, 0.9);
    for (let i = 0; i < 60; i++) { const s = rr() * 260, x = tw.x + (rr() - 0.5) * 240, z = tw.z + (rr() - 0.5) * 240, rnd = rr(), stay = rr() < 0.3 ? 1 : 0; worst = Math.max(worst, Math.abs(replica(s, x, z, rnd, stay, false) - light.level(s, x, z, rnd, stay))); }
    U.uTownWake.value.copy(keep);
    fade.twin = worst < 1e-5;
    if (fade.on && !fade.twin) note('light.level is no longer the function this module copied (differs by ' + worst.toFixed(4) + '): presences.level gives light.level as it stands'); }
  /** light.level with the windows' own fade in it: for whatever follows ONE window's light (rnd 0..1). */
  api.level = (s, x, z, rnd = -1, stay = 0) => (rnd >= 0 && fade.on && fade.twin ? replica(s, x, z, rnd, stay, true) : light.level(s, x, z, rnd, stay));

  // ---- the few that go out later. From the layout's own windows, those that stay (one in five) and whose texel no
  // other window shares (the terrace's and the first dormers' random numbers are given by hand and repeat): every jade
  // one; and of the rest one for every 16 m of the route, the nearest to its line (where it can be watched), a pale
  // gold one where there is one: about one in forty.
  const late = api.late = [];
  if (fade.on && Q.get('tplate') !== '0') {
    const tally = new Map();
    for (const w of town.windows) { const c = cellOf(w.rnd); tally.set(c, (tally.get(c) || 0) + 1); if (w.stay === 1) { fade.stayers++; if (w.tone === 2) fade.jade++; } }
    // (a texel shared with one other window does no harm: that one goes dark with its own street, at most. A random number
    // given by hand to a whole row of windows is left alone. A number that falls on the border of its texel is told to
    // the neighbouring texel too: the shader may round it either way.)
    const sure = (w) => w.rnd >= 0 && w.rnd < 1 && tally.get(cellOf(w.rnd)) <= 2;
    const add = (w, d, range) => {
      const h = fract(w.rnd * 53.7 + 0.19), inSquare = sm(144, 152, w.s) * (1 - sm(208, 216, w.s)) > 0.5, rg = inSquare ? range.square : range.street;
      const f = Math.fround(w.rnd) * 65536, fr = f - Math.floor(f), cell = cellOf(w.rnd), cells = [cell];
      if (fr < 0.03 && cell > 0 && !tally.has(cell - 1)) cells.push(cell - 1); else if (fr > 0.97 && cell < 65535 && !tally.has(cell + 1)) cells.push(cell + 1);
      late.push({ x: w.x, y: w.y, z: w.z, s: w.s, d, tone: w.tone, rnd: Math.fround(w.rnd), cells, inSquare, r: Math.hypot(w.x - tw.x, w.z - tw.z), mark: w.s + 30 + 30 * fract(w.rnd * 7.31 + 0.17), delay: rg[0] + (rg[1] - rg[0]) * h, at: Infinity });
    };
    for (const w of town.windows) if (w.stay === 1 && w.tone === 2 && sure(w) && w.y - w.h / 2 < -0.05) add(w, town.sd(w.x, w.z).d, FD.jade);
    const best = new Map();
    for (const w of town.windows) {
      if (w.stay !== 1 || w.tone === 2 || !sure(w) || w.y > -0.4) continue;
      const q = town.sd(w.x, w.z); if (Math.abs(q.d) > FD.within || w.s < 24 || w.s > 226) continue;
      const bucket = Math.floor(w.s / FD.every), score = (w.tone === 3 ? 0 : 1000) + Math.abs(q.d), was = best.get(bucket);
      if (!was || score < was.score) best.set(bucket, { w, score, d: q.d });
    }
    for (const b of [...best.keys()].sort((p, q) => p - q)) { const { w, d } = best.get(b); add(w, d, FD.other); }
  }

  // ---- the record of where the farthest reach stood
  const HN = 256, hT = new Float64Array(HN), hR = new Float64Array(HN); let hHead = 0, hCount = 0;
  const record = (t, r) => { if (hCount && t - hT[(hHead + HN - 1) % HN] < 1 / 50) return; hT[hHead] = t; hR[hHead] = r; hHead = (hHead + 1) % HN; hCount = Math.min(HN, hCount + 1); };
  const reachAt = (t) => {
    if (!hCount) return 0;
    let newer = (hHead + HN - 1) % HN;
    if (t >= hT[newer]) return hR[newer];
    for (let k = 1; k < hCount; k++) { const older = (hHead + HN - 1 - k) % HN; if (t >= hT[older]) { const u = (t - hT[older]) / Math.max(1e-6, hT[newer] - hT[older]); return hR[older] + (hR[newer] - hR[older]) * u; } newer = older; }
    return hR[newer];
  };

  lay();                                                                         // (before the engine's warm-up: nothing is compiled twice)

  // ================================================================================================ water-light on the piers and the columns
  // The page: "water-light: every wall, stack, column and pier to y 6: slow caustic nets, and bright bands climbing the
  // stone when the rider's wake or a pendulum ring passes". The area's material has it (light.js: nets on the first
  // metres of every upright thing, livelier where the water is stirred), and on brick stacks and gables it is seen. On
  // the two places the page names it is not whole: the tower's piers are the brightest stone of the town and what the
  // material adds there cannot be seen at all (the first holder measured less than two parts in 255 for a passing
  // ring); the portico's six columns have a slow net of their own (heroes_b.js) and no band that climbs.
  // So the four piers, passed at 3 to 6 m with the pendulum's ring arriving at their feet every three seconds, and the
  // six columns, which the bell's last ring laps in turn, wear a sheet of light a finger's breadth off the stone:
  //   - on the piers, the slow net from the still water: the portico's own net of bright threads (see wlNet, below),
  //     so that the two ends of the square are lit by one water (the first holder's threads of the ride's caustic
  //     tile, at a tenth, could not be seen);
  //   - on both, the LIVING water (the engine's own ripple field: the kiss's rings, the bell's ring, the rider's wake)
  //     thrown on the stone, each face of it as far up as it lies out from the wall's foot and softer the higher it
  //     is thrown: as a ring leaves the tower a band of light rises from the waterline, climbs the stone and fails by
  //     six metres. (The first holder's bands were plain light, saturated from the faintest crest: wedges of
  //     searchlight across the piers. On a pier a band is now mostly the net itself made brighter; on a column it is
  //     a soft light over the portico's net.)
  // Added light, in the state's own water-light colour, as strong as the town burns under each place (the piers fail
  // with the square's sleep, the columns with their two lamps); direct view only; nothing beyond 34 m of the boat.
  let waterLight = null;
  if (Q.get('tpwl') !== '0' && ctx.engine.shared.tRipple && ((shared.tower && shared.tower.frame) || (shared.portico && shared.portico.columns))) {
    const WL = { ...P.waterLight }, wv = (Q.get('tpwl') || '').split(',');
    { const nv = (Q.get('tpnet') || '').split(',').map(Number), pick = (i, d) => (Number.isFinite(nv[i]) && nv[i] > 0 ? nv[i] : d);      // (&tpnet=<tile width>,<tile height>,<focus at rest>,<focus in a ring>,<floor>,<gain>,<plain>,<push>)
      WL.web = [pick(0, WL.web[0]), pick(1, WL.web[1]), pick(2, WL.web[2]), pick(3, WL.web[3])]; WL.floor = pick(4, WL.floor); WL.gain = pick(5, WL.gain); WL.plain = pick(6, WL.plain); WL.push = pick(7, WL.push); }
    ['level', 'nets', 'bands', 'reach', 'lean', 'crest', 'columns'].forEach((k, i) => { if (wv[i] != null && wv[i] !== '' && Number.isFinite(+wv[i])) WL[k] = +wv[i]; });      // (&tpwl=level,nets,bands,reach,lean,crest,columns; &tpwl=0: none)
    const H = WL.height, pos = [], nor = [], uv = [], kk = [], cc = [], idx = [];
    const places = [];                                                            // [x, z, which]: where each part stands (to switch the sheet off far away)
    // ---- the tower's four piers: their outer faces, and their jambs inside the arches to the springing
    if (shared.tower && shared.tower.frame) {
      const f = shared.tower.frame, c = Math.cos(f.yaw), sn = Math.sin(f.yaw), half = plan.tower.side / 2, inner = half - plan.tower.loggia.pier, OFF = 0.03, HJ = plan.tower.loggia.spring;
      // one face: from (ls0, ld0) to (ls1, ld1) at the water, `up` metres tall, looking along (nls, nld)
      const face = (ls0, ld0, ls1, ld1, nls, nld, up) => {
        const b = pos.length / 3, nx = nls * c + nld * sn, nz = -nls * sn + nld * c;
        const mid = f.at((ls0 + ls1) / 2 + nls * OFF, 0, (ld0 + ld1) / 2 + nld * OFF);      // the middle of this face's foot: its bands are read from the water straight out from here (see the shader)
        for (const [ls, ld, y, u, v] of [[ls0, ld0, 0, 0, 0], [ls1, ld1, 0, 1, 0], [ls1, ld1, up, 1, 1], [ls0, ld0, up, 0, 1]]) { const q = f.at(ls + nls * OFF, y, ld + nld * OFF); pos.push(q[0], q[1], q[2]); nor.push(nx, 0, nz); uv.push(u, v); kk.push(1, 1, 0); cc.push(mid[0], mid[2]); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      for (const a of [-1, 1]) for (const b of [-1, 1]) {
        face(a * half, b * inner, a * half, b * half, a, 0, H);            // its two outer faces (the tower's own wall planes)
        face(a * inner, b * half, a * half, b * half, 0, b, H);
        face(a * inner, b * inner, a * half, b * inner, 0, -b, HJ);        // its two jambs, inside the arches, to the springing
        face(a * inner, b * inner, a * inner, b * half, -a, 0, HJ);
      }
      places.push([f.x, f.z, 0]);
    }
    // ---- the portico's six columns: a sleeve round each, tapering as the shaft does; the side turned to the lake takes
    // the light (seen from inside, in the roof's shade, a column is a plain dark shape against the lake: heroes_b.js)
    if (shared.portico && shared.portico.columns && WL.columns > 0) {
      const Po = plan.theatre.portico, q0 = ctx.path.at(Po.s), ix = q0.tx, iz = q0.tz, SEG = 20, OFF = 0.045;
      const rAt = (y) => Po.base / 2 - (Po.base - Po.neck) / 2 * (y - Po.floor) / Po.height + OFF;
      for (const [cx, cz] of shared.portico.columns) {
        const b = pos.length / 3;
        for (let j = 0; j <= 1; j++) for (let i = 0; i <= SEG; i++) {
          const a = i / SEG * Math.PI * 2, nx = Math.cos(a), nz = Math.sin(a), y = j * H, r = rAt(y), into = nx * ix + nz * iz;
          pos.push(cx + nx * r, y, cz + nz * r); nor.push(nx, 0, nz); uv.push(0.5, j);
          kk.push(0, WL.columns * (0.14 + 0.86 * (1 - sm(-0.6, 0.6, into))), 1); cc.push(cx + nx * r, cz + nz * r);
        }
        for (let i = 0; i < SEG; i++) { const p = b + i, q = b + SEG + 1 + i; idx.push(p, p + 1, q + 1, p, q + 1, q); }
        places.push([cx, cz, 1]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 3)); geo.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 2)); geo.setIndex(idx);
    const sh = ctx.engine.shared;
    const mat = new THREE.ShaderMaterial({
      uniforms: { tRipple: sh.tRipple, uRippleRect: sh.uRippleRect, tTownNetT: U.tTownNetT, uTime: sh.uTime, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uCameraPos: sh.uCameraPos,
        uTownWaterLight: U.uTownWaterLight, uWl: { value: new THREE.Vector4(0, WL.nets, WL.bands, H) }, uWl2: { value: new THREE.Vector4(WL.reach, WL.lean, WL.crest, WL.far) }, uWl3: { value: new THREE.Vector4(0, 0, 0, 0) },
        uWl4: { value: new THREE.Vector4(WL.web[0], WL.web[1], WL.web[2], WL.web[3]) }, uWl5: { value: new THREE.Vector4(WL.floor, WL.gain, WL.plain, WL.push) }, uWlRose: { value: new THREE.Color(WL.rose) } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec3 aK; attribute vec2 aC; varying vec3 vW, vN, vK; varying vec2 vUv, vC; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normal; vUv = uv; vK = aK; vC = aC; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tRipple, tTownNetT; uniform vec4 uRippleRect, uWl, uWl2, uWl3, uWl4, uWl5; uniform float uTime; uniform vec3 uCameraPos, uTownWaterLight, uWlRose; ${FOG_PARS}
        varying vec3 vW, vN, vK; varying vec2 vUv, vC;
        vec4 wlRip(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec4(0.0); }
        // WATER-LIGHT IS THE AREA'S OWN WEB (second look). Every roof under this surface wears the light's true caustic tile
        // (light.js, netTile: rays sent through a rippled surface and gathered where they land: CLOSED meshes of threads
        // with a spark where three meet), every wall its soft reading of that tile (townNetSoft), and the portico's builder
        // took the same tile for the six columns in a sixth look, because threads drawn by rule were glowing veins in pink
        // marble. The piers alone still wore drawn threads, of which two masks left only some: forked veins at rest, and
        // under the rider's wake, where a band lit a ragged part of them, tongues of fire climbing the tower's feet
        // (town_pr4_23_flames_crop.png). So: the same tile here, read as light.js reads it on a wall (two copies, the
        // second turned a quarter and larger, sliding the other way; drawn out upward, as light thrown up from water is),
        // a little nearer focus than on a far wall because these four piers are passed at arm's length, its floor taken
        // off so that the stone is its own between the threads. p: metres along the face and up it; bias: how far out of
        // focus. The tile's own smaller pictures close it up into an even glow far off: nothing shimmers.
        float wlWeb(vec2 p, float t, float bias) {
          vec2 wr = vec2(sin(p.y * 0.9 + t * 0.7) + sin(p.x * 0.5 - t * 0.4), cos(p.x * 0.8 - t * 0.6) + cos(p.y * 0.6 + t * 0.3)) * 0.10;
          float na = texture2D(tTownNetT, (p + wr) / uWl4.xy + vec2(t * 0.016, t * 0.022), bias).r;
          float nb = texture2D(tTownNetT, vec2(p.y, -p.x) / (uWl4.xy * 1.4) + wr.yx * 0.14 + vec2(-t * 0.020, t * 0.012) + 0.37, bias).r;
          return na + nb * 0.8 + na * nb * 2.5;
        }
        void main() {
          float lvl = mix(uWl.x, uWl3.x, vK.z);
          if (lvl < 0.003) discard;
          float h = vW.y, d = distance(vW, uCameraPos);
          float fall = 1.0 - smoothstep(0.0, uWl.w, h); fall *= fall;
          float edge = smoothstep(0.0, 0.05, vUv.x) * (1.0 - smoothstep(0.95, 1.0, vUv.x)) * smoothstep(0.0, 0.04, h) * (1.0 - smoothstep(0.86, 1.0, vUv.y));
          // (what costs nothing first: where it leaves nothing, the water and the web are not asked)
          float pre = fall * edge * lvl * (1.0 - smoothstep(uWl2.w * 0.7, uWl2.w, d)) * (1.0 - fogAmount(d)) * (1.0 - uVeil);
          if (pre < 0.0015) discard;
          vec2 n = normalize(vN.xz), t = vec2(-n.y, n.x);
          // the living water, thrown on the stone as far up as it lies out from the wall's foot: a CREST passing (the
          // kiss's short rings, the bell's long low one, every wave of the rider's wake) and, less, the face of water that
          // leans to the wall (a wake leans ten times as far as a ring and for seconds: taken whole it lit the pier from
          // the line to the top for as long as the hull was near; a crest is gone in a moment and the next is behind it)
          float wide = 0.14 + 0.05 * h, band = 0.0;
          if (d < 46.0) {
            // (on a pier the water is read straight out from the MIDDLE of the face's foot, a little toward this place: a
            // ring from the bob, which stands to one side, then crosses a face as a level band that climbs, a shade aslant.
            // Read from each place's own foot, as it first was, the same ring raked every face from corner to corner, a wedge)
            vec2 q = mix(vW.xz, vC, 0.82 * vK.x) + n * (0.05 + h * uWl2.x), dq = n * wide;
            float lean = max(dot(wlRip(q).xy, n), 0.0);
            float crest = (dot(wlRip(q - dq).xy, n) - dot(wlRip(q + dq).xy, n)) * 0.16 / wide;
            band = (0.3 * (1.0 - exp(-lean * uWl2.y)) + 0.7 * smoothstep(0.0006, uWl2.z, crest)) * vK.y * (1.0 - smoothstep(36.0, 46.0, d));
          }
          float a = band * uWl.z * (1.0 - vK.x);                                    // on a column the band's own soft light, all of it (the column's web is the portico's)
          vec3 col = uTownWaterLight;
          if (vK.x > 0.001) {
            // the web on a pier. Still water: it crawls and wriggles, soft. A ring at the wall's foot carries it a hand's
            // breadth with the water's own slope and lets it go again (it quivers and settles), and draws it nearer focus;
            // where a band climbs, the web itself is brighter, and a share of the band is plain light, level across the face
            vec4 foot = wlRip(vW.xz + n * 0.4);
            float stir = clamp(foot.w * 4.0, 0.0, 1.0), keen = clamp(max(stir, band), 0.0, 1.0);
            vec2 push = clamp(vec2(dot(foot.xy, t), dot(foot.xy, n)) * uWl5.w, -0.16, 0.16);
            vec2 p = vec2(dot(vW.xz, t) + dot(vC, vec2(0.37, 0.73)), h) + push;                // (each face its own part of the web)
            float web = max(wlWeb(p, uTime, mix(uWl4.z, uWl4.w, keen)) - uWl5.x, 0.0) * uWl5.y;
            a += vK.x * (web * uWl.y * (0.8 + 0.4 * stir) + band * uWl.z * (uWl5.z + (1.0 - uWl5.z) * min(web, 1.6)));
            col = mix(uWlRose * 1.1, uTownWaterLight, 0.3 + 0.55 * smoothstep(0.25, 1.3, web));  // a thread: the state's rose-gold at its core, old rose in its bloom (plain old rose on this stone was candy)
          }
          a *= pre;
          if (a < 0.002) discard;
          gl_FragColor = vec4(clamp(col * a, 0.0, 4.0), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'town-water-light'; mesh.frustumCulled = false; mesh.renderOrder = 2;
    ctx.add(mesh); ctx.only(mesh, 'direct');
    waterLight = api.waterLight = { object: mesh, uniforms: mat.uniforms, level: WL.level, places, far: WL.far };
  }

  // ================================================================================================ plumes over the brightest water
  // The page: "the sky and the mist: the overcast; twelve mist sheets; plumes over the brightest water"; and of the glass
  // ridge: "it is the brightest thing at the waterline and tints the mist above it". The sheets and the low mist are the
  // set's (set.js), and it gives the low mist a card over each bright water; but at the low mist's own faintness, and in
  // the air's own colour, those cannot be found in a picture (the glass ridge with them and without, the third holder's
  // pair: not a pixel between them that the eye can tell). So the plumes are made here: over the glass ridge and over
  // the nave's lancets a few soft cards of mist stand up from the water, turned to the rider, each a slow noise that
  // rises and opens and closes (never a picture), LIT by what burns under its own foot (the glow map and the waking
  // function, read at each corner: jade over the glass, rose over the lancets, the air's own colour where nothing burns
  // and at its top: old rose beneath and plum above, as the page has the mist). Lit, not glowing: plain paint over what
  // stands behind, never added light; it breathes with the town, flares with the stroke's ring, and when its water
  // sleeps it is a breath of the air's own colour. None within six metres of the rider. (The five lamp domes have the
  // family's own discs.) &tpplume=0: none; &tpplume=<how thick>,<how lit>: other numbers.
  let plumes = null;
  if (Q.get('tpplume') !== '0') {
    const PL = P.plumes, pv = (Q.get('tpplume') || '').split(',').map(Number), pk = (i, d) => (Number.isFinite(pv[i]) && pv[i] > 0 ? pv[i] : d);
    const list = [], rnd = ctx.rng(4127);
    const add = (x, z, y, w, h, axis = 0) => { for (let k = 0; k < PL.layers; k++) list.push({ x: x + (rnd() - 0.5) * 1.8, y, z: z + (rnd() - 0.5) * 1.8, w: w * (0.85 + 0.3 * rnd()), h: h * (0.8 + 0.4 * rnd()), seed: rnd() * 40, pace: 0.7 + 0.6 * rnd(), axis }); };      // (axis: the way its row of plumes runs, as an angle in the plan)
    const g = shared.glassRidge;
    if (g && g.frame && g.frame.at) { const o = g.frame.at(0, 0, 0), e = g.frame.at(1, 0, 0), ax = Math.atan2(e[2] - o[2], e[0] - o[0]); for (const ls of PL.glass.along) { const p = g.frame.at(ls, 0, 0); add(p[0], p[2], PL.glass.y, PL.glass.width, PL.glass.height, ax); } }
    else { const H = plan.hall; if (H) { const o = town.xz(158, H.d + 0.5), e = town.xz(188, H.d + 0.5), ax = Math.atan2(e[1] - o[1], e[0] - o[0]); for (const s of [158, 168, 178, 188]) { const p = town.xz(s, H.d + 0.5); add(p[0], p[1], PL.glass.y, PL.glass.width, PL.glass.height, ax); } } }
    const ch = shared.church, lan = (ch && ch.lancets) || [];
    if (lan.length) { for (const side of ['s', 'n']) for (const pair of PL.nave.pairs) { const a = lan.find((l) => l.name === side + pair[0]), b = lan.find((l) => l.name === side + pair[1]); if (a && b) add((a.at.x + b.at.x) / 2, (a.at.z + b.at.z) / 2, PL.nave.y, PL.nave.width, PL.nave.height, Math.atan2(b.at.z - a.at.z, b.at.x - a.at.x)); } }
    else { const C = plan.church; if (C) { const o = town.xz(126, C.d), e = town.xz(140, C.d), ax = Math.atan2(e[1] - o[1], e[0] - o[0]); for (const s of [126, 140]) { const p = town.xz(s, C.d); add(p[0], p[1], PL.nave.y, PL.nave.width, PL.nave.height, ax); } } }
    if (list.length) {
      // (second look: a card was four corners, and what burns under it was read at those four only: a card with one corner
      // over the glass and the next over dark water, fifteen metres on, was lit along a ramp, and a ramp times the fall
      // of the mist with height is a wedge with a straight slanting edge, a beam (town_pr4_09_plume_near_f00.png). A
      // card is now thirteen stations across: the light is read every metre and a bit, and the mist is lit where its
      // own water burns and nowhere else, a mound over the glass seen end-on, a bank along it seen from the side)
      const base = new THREE.PlaneGeometry(1, 1, 12, 3), geo = new THREE.InstancedBufferGeometry(); geo.index = base.index; geo.setAttribute('position', base.attributes.position); geo.setAttribute('uv', base.attributes.uv);
      const aP = new Float32Array(list.length * 4), aQ = new Float32Array(list.length * 4);
      list.forEach((q, i) => { aP.set([q.x, q.y, q.z, q.w], i * 4); aQ.set([q.h, q.seed, q.pace, q.axis], i * 4); });
      geo.setAttribute('aPlume', new THREE.InstancedBufferAttribute(aP, 4)); geo.setAttribute('aPlumeK', new THREE.InstancedBufferAttribute(aQ, 4)); geo.instanceCount = list.length;
      const sh = ctx.engine.shared;
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...U, uFogColor: sh.uFogColor, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil, uVeilColor: sh.uVeilColor, uCameraPos: sh.uCameraPos, uTime: sh.uTime,
          uPl: { value: new THREE.Vector4(pk(0, PL.thick), pk(1, PL.lit), PL.near[0], PL.near[1]) }, uPlRose: { value: new THREE.Color(PL.rose) }, uPlJade: { value: new THREE.Color(PL.jade) } },
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          ${light.GLSL}
          attribute vec4 aPlume, aPlumeK; uniform vec3 uCameraPos; uniform float uTime;
          varying vec2 vUv; varying vec3 vLit; varying float vDist, vSeed, vThin;
          void main() {
            vec3 c = aPlume.xyz;
            c.x += sin(uTime * 0.045 * aPlumeK.z + aPlumeK.y) * 0.9; c.z += cos(uTime * 0.037 * aPlumeK.z + aPlumeK.y * 1.7) * 0.9;      // it wanders a pace or two about its water
            vec2 to = uCameraPos.xz - c.xz; float tl = max(length(to), 1e-3); to /= tl;
            vec3 right = vec3(to.y, 0.0, -to.x);                                             // it stands upright and turns to the rider
            // (second look: seen ALONG its row every plume of the row stands behind the last, and ten thin veils were one
            // bright wall of jade at the ridge's far end: a beam on the far shore's waterline. A plume seen along its
            // row is a quarter as thick, so that the row end-on is about what it is from the side)
            float endOn = abs(dot(to, vec2(cos(aPlumeK.w), sin(aPlumeK.w)))); vThin = 1.0 - 0.75 * endOn * endOn;
            vec3 w = c + right * (position.x * aPlume.w) + vec3(0.0, (position.y + 0.5) * aPlumeK.x, 0.0);
            // what burns under this corner of it, now: x how much, y the share of it that is jade
            vec4 g = townGlowSoft(w.xz, 3.0);
            vLit = vec3(g.r * townWake(townS(g), w.xz, -1.0, g.a), clamp(g.g * 1.3, 0.0, 1.0), 0.0);
            vUv = uv; vSeed = aPlumeK.y; vDist = distance(w, uCameraPos);
            gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
          }`,
        fragmentShader: /* glsl */`
          ${FOG_PARS} ${NOISE_GLSL}
          uniform vec4 uPl; uniform vec3 uPlRose, uPlJade; uniform float uTime;
          varying vec2 vUv; varying vec3 vLit; varying float vDist, vSeed, vThin;
          void main() {
            float u = vUv.x, v = vUv.y;
            float ends = smoothstep(0.0, 0.32, u) * smoothstep(0.0, 0.32, 1.0 - u);
            float vv = v / (0.3 + 0.7 * sin(3.14159 * clamp(u, 0.0, 1.0)));                       // (a mound: it stands lower toward its two ends, where it was cut off aslant)
            float body = smoothstep(0.0, 0.2, v) * (1.0 - smoothstep(0.16, 0.95, vv)); body *= mix(1.0, body, 0.6);      // it lies on the water and thins as it climbs (second look: it stood half a metre clear of the water on a foot four hand's breadths deep, and beyond the ridge's end, where nothing hides its foot, that was a straight bright edge hung over the lake)
            float lv = clamp(vLit.x * uPl.y, 0.0, 1.3);
            float pre = ends * body * uPl.x * vThin * (0.22 + 0.78 * min(lv, 1.0)) * smoothstep(uPl.z, uPl.w, vDist) * (1.0 - fogAmount(vDist) * 0.8) * (1.0 - uVeil);
            if (pre < 0.003) discard;                                                        // (nothing here: the noise is not asked)
            // vapour that rises and leans as it goes; a finer breath inside it; holes that open and close
            float n = fbm(vec2(u * 2.4 + vSeed + v * 0.5, v * 1.5 - uTime * 0.030 + vSeed * 3.0));
            float n2 = fbm(vec2(u * 5.2 - uTime * 0.011 + vSeed * 7.0, v * 3.1 - uTime * 0.045));
            float holes = smoothstep(0.30, 0.68, 0.62 * n + 0.38 * n2 + ends * body * 0.34);
            float a = pre * holes;
            if (a < 0.003) discard;
            // lit from beneath: the colour of its own water at its foot, the air's own colour above
            vec3 lit = mix(uPlRose, uPlJade, vLit.y) * (0.35 + 0.65 * lv);
            vec3 c = mix(lit, uFogColor, smoothstep(0.05, 0.85, v) * 0.85 + 0.15 * (1.0 - min(lv, 1.0)));
            gl_FragColor = vec4(c, a);
          }`,
      });
      const mesh = new THREE.Mesh(geo, mat); mesh.name = 'town-plumes'; mesh.frustumCulled = false; mesh.renderOrder = 5;
      ctx.add(mesh);
      plumes = api.plumes = { object: mesh, uniforms: mat.uniforms, places: list };
    }
  }

  // ================================================================================================ the proof's numbers
  // What the page says of the clock, measured where it runs (docs/build/town/3-cast-presences.md has the readings).
  const meas = { kiss: [], rim: [], tick: [], hands: [], atKiss: [], ring: [], hooked: false };
  const hook = () => {
    const c = clock(); if (meas.hooked || !c || !c.onKiss) return;
    meas.hooked = true; const v = new THREE.Vector3();
    c.onKiss(() => { meas.kiss.push(ctx.time); if (c.rim) { c.rim(v); meas.rim.push(v.y); } const t = tower(); if (t && t.clock) meas.atKiss.push([ctx.time, t.clock.minutes]); });
    if (c.onTick) c.onTick(() => meas.tick.push(ctx.time));
  };
  api.log = () => {
    const out = [], d = (a) => a.slice(1).map((v, i) => v - a[i]), mean = (a) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : NaN), f = (v, k = 3) => (Number.isFinite(v) ? v.toFixed(k) : 'n/a');
    const dk = d(meas.kiss);
    out.push(`kisses ${meas.kiss.length}: every ${f(mean(dk))} s (least ${f(Math.min(...dk))}, most ${f(Math.max(...dk))}); the rim at the kiss y ${f(mean(meas.rim))} m (lowest ${f(Math.min(...meas.rim))})`);
    if (meas.tick.length && meas.kiss.length) { const lag = meas.tick.map((t) => { const k = meas.kiss.filter((q) => q <= t).pop(); return k == null ? NaN : t - k; }).filter(Number.isFinite); out.push(`ticks ${meas.tick.length}: ${f(mean(lag))} s after a kiss`); }
    { const hs = meas.atKiss.length > 2 ? meas.atKiss.filter((_, i) => i % 2 === 0) : meas.hands;      // (read at every second kiss: the same place in the swing)
      if (hs.length > 1) { const a = hs[0], b = hs[hs.length - 1]; out.push(`minute hands: ${f((b[1] - a[1]) * 6 / (b[0] - a[0]))} degrees a second over ${f(b[0] - a[0], 1)} s (one turn in ${f(360 / ((b[1] - a[1]) * 6 / (b[0] - a[0])), 1)} s); they show ${f(b[1] % 60, 1)} minutes past`); } }
    if (meas.ring.length > 1) { const a = meas.ring[0], b = meas.ring[meas.ring.length - 1], rate = (b[1] - a[1]) / (b[0] - a[0]); out.push(`hour ring: ${f(rate * 180 / Math.PI, 3)} degrees a second (one turn in ${f(Math.abs(2 * Math.PI / rate), 1)} s, ${rate < 0 ? 'clockwise' : 'anticlockwise'} seen from above)`); }
    out.push('hands found standing on their heads and righted: ' + (upsideDown ? upsideDown.length + ' of ' + ((tower() && tower().parts && (tower().parts.minute.length + tower().parts.hour.length)) || 0) : 'not looked at yet'));
    if (probes.length) { const took = (k) => probes.filter((q) => q[k][0] != null && q[k][1] != null).map((q) => (q[k][1] - q[k][0]).toFixed(2)).join(' ') || 'none yet';
      out.push(`windows watched (${fade.on ? 'their own fade' : 'as light.js alone has them'}): seconds to wake ${took('up')}; seconds to go out ${took('out')}; the boat at ${(ctx.boat.speed || 0).toFixed(2)} m/s`); }
    { const cam = ctx.engine.camera; if (cam && cam.getWorldDirection) { const dir = cam.getWorldDirection(new THREE.Vector3()), eye = cam.getWorldPosition(new THREE.Vector3()), up = plan.vista.cloud;
        if (dir.y > 0.05) { const k = (up - eye.y) / dir.y; out.push(`the middle of the picture meets the cloud ${Math.hypot(eye.x + dir.x * k - tw.x, eye.z + dir.z * k - tw.z).toFixed(1)} m from the tower's axis`); }
        else if (dir.y < -0.05) { const k = -eye.y / dir.y; out.push(`the middle of the picture meets the water ${Math.hypot(eye.x + dir.x * k - tw.x, eye.z + dir.z * k - tw.z).toFixed(1)} m from the tower's axis (the boat is ${Math.hypot(ctx.boat.x - tw.x, ctx.boat.z - tw.z).toFixed(1)} m from it)`); } } }
    out.push(`domes ${n} (levels ${Array.from(lvl).map((v) => v.toFixed(2)).join(' ')}); windows' own fade ${fade.on ? 'on' : 'off'}, in ${fade.patched} materials, twin ${fade.twin}`);
    out.push(`windows ${town.windows.length}, of which ${fade.stayers} stay (${fade.jade} of them jade); ${late.length} go out later on their own: ${late.filter((L) => L.tone === 2).length} jade, ${late.filter((L) => L.tone === 3).length} pale gold, ${late.filter((L) => L.tone < 2).length} warm; gone so far ${late.filter((L) => L.at < Infinity).length}`);
    out.push('those that go later and are not jade (s d y; mark; delay; tone): ' + late.filter((L) => L.tone !== 2).map((L) => `${L.s.toFixed(1)} ${L.d.toFixed(1)} ${L.y.toFixed(1)}; ${L.mark.toFixed(1)}; ${L.delay.toFixed(1)}; ${L.tone}`).join(' | '));
    out.push('the first jade ones (s d y; mark; delay): ' + late.filter((L) => L.tone === 2).slice(0, 14).map((L) => `${L.s.toFixed(1)} ${L.d.toFixed(1)} ${L.y.toFixed(1)}; ${L.mark.toFixed(1)}; ${L.delay.toFixed(1)}`).join(' | '));
    return out;
  };
  const LOG = Q.has('tplog') ? num('tplog', 20) : 0; let logged = false;
  // (&tplog only) six windows that are not there, watched by the script's twin as the boat goes by: how long each takes to
  // wake and to go out, whatever the boat's pace
  const probes = LOG ? [0.07, 0.23, 0.41, 0.58, 0.76, 0.93].flatMap((rnd, i) => [{ rnd, off: 76 + i * 5, s: null, up: [null, null], out: [null, null], last: null }, { rnd, off: -18 + i * 3, s: null, up: [null, null], out: [null, null], last: null }]) : [];
  const probe = (now) => {
    if (now < 0.5) return;
    for (const q of probes) {
      if (q.s == null) q.s = light.state.reach + q.off;
      const a = 40 + 30 * q.rnd, b = 30 + 30 * fract(q.rnd * 7.31 + 0.17), ahead = q.s - U.uTownWake.value.x;
      const up = fade.on ? ease(fadeOf(q.s - a)) : 1 - sm(a - 2.5, a + 2.5, ahead), out = fade.on ? ease(fadeOf(q.s + b)) : sm(b - 2.5, b + 2.5, -ahead);
      if (q.last) { if (q.last[0] <= 1e-4 && up > 1e-4) q.up[0] = now; if (q.last[0] < 0.9999 && up >= 0.9999) q.up[1] = now; if (q.last[1] <= 1e-4 && out > 1e-4) q.out[0] = now; if (q.last[1] < 0.9999 && out >= 0.9999) q.out[1] = now; }
      q.last = [up, out];
    }
  };

  // ================================================================================================ the hands
  // The page: the minute hand turns once in 240 s, "a visible creep", and at the warning "runs its last few degrees to the
  // top over 2.5 s". The stroke is fired by the boat, so the dial must be a few degrees short of one when the boat gets
  // there, whoever is rowing, and the hands must never be seen to jump or to stand:
  //   - the dial is put on by `ahead` minutes when the realm begins (under the veil), so that a rider left to the current
  //     reaches the place where the stroke is fired with the hands at about 57.6 minutes past, creeping as the movement
  //     turns them the whole way;
  //   - for a rider who presses on, the hands are kept no further behind that rider's reading than `under` minutes (they
  //     go round a little faster while he rows; from a boat that has stopped they creep on from where they are);
  //   - for a rider who dawdles they come up to `wait` ever more slowly and never pass it: it is not yet one.
  // presences.stroke(T) then runs them to the top. presences.hands.wait = null gives the dial back to the movement.
  const HD = P.hands;
  const tHo = (() => {                                                            // seconds a boat left to the current takes to reach s
    const tab = [0]; for (let s = 1; s <= 262; s++) tab.push(tab[s - 1] + 1 / Math.max(0.3, plan.currentAt(s - 0.5)));
    return (s) => { const x = Math.min(261, Math.max(0, s)), i = Math.floor(x); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); };
  })();
  let handsAhead = null;
  // ---- one dial read half past seven while the other three read one (found by the third holder, looking back from the
  // poplar road: `s=211&yaw=180`). The tower's module turns every hand with `rotation.z = -angle`. The down-route dial's
  // two hands are placed in their file by a half turn about the upright, which three.js reads as a half turn about X and
  // a half turn about Z: writing Z alone throws the second away, and those two hands stand on their heads (six hours
  // out, on the dial the rider looks back at when it has just struck one). The file is the tower's builder's (see
  // "Asked of the set" in the log: one line there, the hands' rotation order). Until then: after the tower has turned
  // its hands, any hand that points the opposite way to its own dial's reading is given the half turn back. Each hand is
  // looked at once (its own +Y is the way it points, as modelled; its dial looks away from the tower's axis); a hand
  // that is right is never touched, so this stands down by itself when the tower's module is mended. &tphands=0: as found.
  let upsideDown = Q.get('tphands') === '0' ? [] : null;
  const findUpsideDown = (t, ck) => {
    const out = [], q = new THREE.Quaternion(), v = new THREE.Vector3(), p = new THREE.Vector3(), am = ck.minutes / 60 * Math.PI * 2;
    for (const [list, a, per] of [[t.parts.minute, am, 1], [t.parts.hour, am / 12, 12]]) for (const hand of list || []) {
      if (!hand || !hand.isObject3D || Math.abs(hand.rotation.z + a) > 1e-6) continue;      // (not as the tower's module writes it: left alone)
      hand.updateWorldMatrix(true, false); hand.getWorldQuaternion(q); hand.getWorldPosition(p);
      v.set(0, 1, 0).applyQuaternion(q);
      let nx = p.x - t.x, nz = p.z - t.z; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      // seen from in front of its dial, a hand at angle a points along up cos a + right sin a, where right = up x (the way the dial looks)
      if (v.x * nz * Math.sin(a) + v.y * Math.cos(a) - v.z * nx * Math.sin(a) < 0) out.push({ hand, per });
    }
    return out;
  };

  // ================================================================================================ every frame
  let first = true, relaid = 0;
  const update = (dt, c) => {
    const now = c.time, eye = ctx.engine.shared.uCameraPos.value;
    // ---- the record of the farthest reach (set.js has already moved light.state.reach this frame)
    if (first) record(now - 30, light.state.reach);
    record(now, light.state.reach);
    { const R = UR.value; R[0] = light.state.reach; for (let k = 1; k <= HS; k++) R[k] = Math.min(R[k - 1], reachAt(now - k * FADE / HS)); }
    // (materials made after this module was built: looked for twice more)
    if (fade.on && relaid < 2 && (first || now > 2)) { relaid++; const made = lay(); if (made && !first) note(made + ' more materials took the windows\' own fade after the first frame (they were compiled twice)'); }
    // ---- the windows that go out later
    { let changed = false; const W = U.uTownWake.value;
      for (const L of late) {
        if (L.at === Infinity) {
          const gone = L.inSquare ? (1 - W.z) * 1.12 - (1 - Math.min(1, L.r / 75)) > 0.12 : light.state.reach >= L.mark;
          if (gone) L.at = first && (L.inSquare || light.state.reach - L.mark > 4) ? -1e6 : now;      // (a realm entered part-way: those whose street already sleeps have gone)
        }
        const v = L.at === Infinity ? 255 : Math.round(255 * (1 - sm(0, FADE, now - L.at - L.delay)));
        if (lateData[L.cells[0]] !== v) { for (const cell of L.cells) lateData[cell] = v; changed = true; }
      }
      if (changed) lateTex.needsUpdate = true; }
    // ---- the lamp domes
    if (domes.auto) { const T = stage.clock('tp-domes', (s) => (s - F.s) / F.pace); if (T >= 0) for (let i = 0; i < Math.min(3, n); i++) if (stage.beat('tp-dome' + i, T, F.at[i])) domes.kindle(i, D.kindle); }
    if (TEST === 'kindle') { if (first) for (let i = 0; i < Math.min(3, n); i++) domes.set(i, 0); for (let i = 0; i < Math.min(3, n); i++) if (stage.beat('tp-test-dome' + i, now - T0, F.at[i])) domes.kindle(i, D.kindle); }
    { const perM = U.uTownWater.value.w, ey = Math.max(eye.y, 0.05);
      for (let i = 0; i < n; i++) {
        const st = kd[i], h = heads[i];
        if (st.k !== st.to) { const m = dt / Math.max(MIN_RISE, st.per); st.k += Math.max(-m, Math.min(m, st.to - st.k)); }
        lvl[i] = ease(st.k) * Math.min(TOP, Math.max(0, light.level(h.s, h.x, h.z, -1, 0.6)));
        // (the lantern's own glass leads its dome: lit through by the time the water round it is two fifths up)
        if (i < 5) HEADS.value[i].w = headsLaid ? sm(0, 0.42, st.k) : 1;
        // (the town's water between: a ball of light a hand's breadth to 0.4 m down is swallowed, a little, by the water the
        // sight crosses to reach it, as everything under this surface is: light.js, townThrough. The family's dome takes
        // no extension, so each ball is told here)
        if (fam) { const dist = Math.hypot(eye.x - h.x, eye.z - h.z);
          for (let k = 0; k < layers.length; k++) { const dep = Math.abs(layers[k][0]); fam.set(i * layers.length + k, lvl[i] / TOP * layers[k][1] * Math.exp(-perM * dist * dep / (ey + dep))); } }
      } }
    // (and its halo, the kit's small glow round the glass, comes with it)
    if (headsLaid) for (const ho of haloOf) { const w = ho.w * sm(0.04, 0.6, kd[ho.k].k); if (Math.abs(w - ho.now) > 1e-4) { ho.a.setW(ho.i, w); ho.a.needsUpdate = true; ho.now = w; } }
    // ---- water-light: as strong as the town burns under the tower; on the columns, as their two lamps burn
    if (waterLight) {
      let near = false; for (const p of waterLight.places) if (Math.hypot(c.boat.x - p[0], c.boat.z - p[1]) < waterLight.far + 10) { near = true; break; }
      waterLight.object.visible = near;
      if (near) {
        waterLight.uniforms.uWl.value.x = waterLight.level * Math.min(1.4, light.at(tw.x, tw.z) * 1.5) * (0.3 + 0.7 * clamp01(light.state.square));      // (the lanterns at the tower's foot burn on when the square sleeps; the windows whose light this is do not)
        const pl = shared.portico && shared.portico.light, col = shared.portico && shared.portico.columns && shared.portico.columns[2];
        waterLight.uniforms.uWl3.value.x = waterLight.level * (pl ? Math.min(1.4, pl.level) : col ? Math.min(1.4, light.at(col[0], col[1]) * 1.5) : 0);
      }
    }
    // the sedge flies' wheels over the domes take each dome's own level (cast_small.js: wheels[i].level), whichever of the
    // two modules is built first
    if (!wheelsTold) { const small = shared.cast.small; if (small && small.wheels && small.wheels.length) { wheelsTold = true; for (const w of small.wheels) if (w.kind === 'dome' && w.level == null && w.lamp >= 0 && w.lamp < n) { const k = w.lamp; w.level = () => lvl[k]; } } }
    // ---- the hands that stood on their heads (see above): the tower's module has just written every hand's turn
    { const t = tower(), ck = t && t.clock;
      if (ck && t.parts && Number.isFinite(ck.minutes) && !ck.hold) {
        if (!upsideDown) { upsideDown = findUpsideDown(t, ck); api.hands.righted = upsideDown.length; }
        const am = ck.minutes / 60 * Math.PI * 2;
        for (const u of upsideDown) if (Math.abs(u.hand.rotation.z + am / u.per) < 1e-6) u.hand.rotation.z = Math.PI - am / u.per;
      } }
    // ---- the hands (see above)
    { const ck = tower() && tower().clock;
      if (ck && !hr && api.hands.wait != null && Number.isFinite(ck.minutes)) {
        const natural = naturalOf(ck), base = ck.start + HD.ahead + 0.25 * tHo(Math.min(light.state.reach, HD.to));
        handsAhead = handsAhead == null ? Math.max(HD.ahead, base - natural) : Math.max(handsAhead, base - HD.under - natural);
        const m = natural + handsAhead, w = api.hands.wait, knee = w - HD.knee;
        ck.nudge = (m <= knee ? m : w - HD.knee * Math.exp(-(m - knee) / HD.knee)) - natural;
      } }
    // ---- for pictures: the controls tried without a staging
    if (TEST === 'stroke') api.stroke(now - T0);
    if (TEST === 'sleep') api.sleepAt(now - T0);
    // (&tptest=lap: the page's last slow ring, strength 0.6 and radius 3, sent from 12 m astern on the boat's own line at
    // T0 and every 7 s after: the staging's moment at the portico, here only so that the columns' bands can be looked at)
    if (TEST === 'lap' && stage.beat('tp-test-lap' + Math.max(0, Math.floor((now - T0) / 7)), now, T0 + 7 * Math.max(0, Math.floor((now - T0) / 7)))) { const b = c.boat, h = b.heading || 0; c.water.ripple(b.x + Math.sin(h) * 12, b.z + Math.cos(h) * 12, 0.6, 3); }
    // ---- the proof's numbers (&tplog only)
    if (LOG) {
      hook(); if (probes.length) probe(now);
      const t = tower(), ck = t && t.clock, cl = clock();
      if (ck && (meas.hands.length < 2 || now - meas.hands[meas.hands.length - 1][0] > 0.5)) meas.hands.push([now, ck.minutes]);
      if (cl && cl.ring && (meas.ring.length < 2 || now - meas.ring[meas.ring.length - 1][0] > 0.5)) meas.ring.push([now, cl.ring.angle()]);
      if (meas.hands.length > 400) meas.hands.splice(1, 1); if (meas.ring.length > 400) meas.ring.splice(1, 1);
      if (!logged && now >= LOG) { logged = true; for (const line of api.log()) note('proof: ' + line); }
    }
    first = false;
  };
  return { update };
}
