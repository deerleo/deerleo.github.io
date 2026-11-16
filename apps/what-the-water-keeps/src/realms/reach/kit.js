// The dyers' reach: kit pieces, standing multitudes and the close band (stage 1, layout: everything here is a STAND-IN
// of the true size in the true place, in its local colour, except the cloth, which is the engine's real cloth).
// Page: docs/art/reach.md, sections 3 ("Set pieces", "Close band", "Canopy") and 9 ("Kit pieces", "Multitudes").
//
// Each block below is headed by the model or system of the page it stands for. A stand-in made of many timbers is ONE
// object named 'standin:<name>' (`&labels=1` shows the names): when the real thing stands, delete its block (or call
// removeStandIn(ctx, '<name>') from your own module).
//
//   the cloth          206 hanging bolts in one makeCloth (two draw calls: the water mirrors every second bolt),
//                      12 swags (the vault), 26 flying silks (the cast's: a stand-in here, named 'standin:flying silks').
//                      THE CLOTH IS FINISHED WORK (stage 2, the kit: docs/build/reach/2-kit-cloth.md): the engine's draped
//                      cloth, every bolt hung its own way, painted; shared.cloth.drips: where every hem drips (for the cast).
//                      &hang=over|drop|flag|bunch|rod|plain|tie|rag|slung, &segs=24x16, &flatcloth=1, &nopaint=1, &nopleat=1, &trail=0.35: switches for looking
//   frames and masts   narthex frames, nave frames, aisle and yard masts, door masts, the lines and wall plates
//   the works          vats, pans, spouts, skein racks, wringers, dipping beams, undershot wheels, launder, boom,
//                      rinsing posts, tenter fences, far wheels, chimney, props, nests
//
// shared.cloth = { handle, bolts, groups: { veil: [first, count], nave: ... } }, shared.mastHeads = [[x, y, z], ...]
import * as THREE from 'three';
import * as ENGINE_CLOTH from '../../engine/cloth.js';
import { makeRibbons } from '../../engine/life/ribbons.js';
import { Pile, nameAt } from './standins.js';

const QS = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, C = plan.colors, D = plan.dyes, { CREAM, SAFFRON, MADDER, CRIMSON, VIOLET, INDIGO } = plan.dye;
  const rnd = ctx.rng(1871), sun = shared.sun, solid = shared.mat ? shared.mat.solid : null;
  const hw = (s) => kit.halfWidth(s), head = (s) => kit.headingAt(s);
  const P = {}, tangent = (s) => { const a = path.at(s, P); return [a.tx, a.tz, a.rx, a.rz]; };
  const build = (pile, name, opts = {}) => pile.build(ctx, name, { material: solid, ...opts });
  const counts = {}, W0 = plan.wheel.hub;

  // ================================================================================================ the cloth
  // A bolt's colour: its dye, never quite evenly taken: a little toward a neighbour on the scale, a little lighter or darker.
  const _a = new THREE.Color(), _b = new THREE.Color();
  const dyed = (i, vary = 1, r = rnd) => {
    _a.set(D[i].color);
    const n = r() < 0.5 ? Math.max(0, i - 1) : Math.min(5, i + 1);
    _a.lerp(_b.set(D[n].color), 0.10 * r() * vary);
    _a.multiplyScalar(1 - 0.26 * r() * vary + 0.08 * vary);
    return '#' + _a.getHexString();
  };
  const CLOTH_MAKER = ENGINE_CLOTH;      // (the trial copy of the engine's cloth, cloth_trial.js and its &trial=1, went with the critique: the engine's own has had its changes since 8 November 01:41)
  const { makeCloth, makeSwags } = CLOTH_MAKER, DRAPED = !QS.has('flatcloth');      // (&flatcloth=1: the layout's flat strips, for measuring what the draped cloth costs)

  // ---- HOW EACH BOLT HANGS (the engine's draped cloth: docs/life/ribbons.md, "Draped cloth"). The cloth is heavy and
  // wet: cut fuller than its line, it hangs in deep folds from its pegs and sags between them; some are thrown over the
  // line, some have a corner off its pegs, some are bunched along the line, a few carry a rod in the hem; hems are torn;
  // the dye runs in bands, a second dye toward the hem. No two neighbours alike: width, length, fullness, how it is
  // pegged, how wet, how torn. (A rng of its own, so that the works' stand-ins below stand where they stood.)
  //   kind   'rank' cloth of an arch or a line, seen against the sun | 'yard' drying cloth further off | 'veil' the cream
  //          cloths of the passage in | 'new' the narthex's new cream | 'curtain' cloth that must cover (the door's low
  //          three: they make the dusk) | 'loft' the loft's wall of indigo (the coin burns in it)
  //   alt    the other dye of its zone (an index of the scale): the dyer's order runs DOWN a cloth, so the later of the two
  //          is its hem
  const rd = ctx.rng(4217), rd2 = ctx.rng(9133), rd3 = ctx.rng(5501), rd4 = ctx.rng(7703), rd5 = ctx.rng(6229), rc = ctx.rng(3301), FULLER = QS.has('fuller') ? +QS.get('fuller') : 0.04, FORCE = QS.get('hang'), MARKS = [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6];      // (not 7, the three bands, nor 8, the net: laid large they read as a flag; not 9, the V: it reads as chevrons, an emblem)
  const rd6 = ctx.rng(8807), rd7 = ctx.rng(2957);                    // (sixth look: rngs of its own, so that every bolt keeps what it had)
  const deep = (hex, k) => '#' + _a.set(hex).multiplyScalar(k).getHexString();
  const dress = (b, kind = 'rank', alt = null, hem = 1, dye = null, tie = null, five = null) => {
    if (!DRAPED) return b;
    const trailing = hem <= 0, r = rd;
    b.full = 0.13 + 0.26 * r() * r() + 0.08 * r();                  // most hang a fifth to a third narrower than they are wide
    b.pegs = 3 + Math.floor(r() * 2.7); b.sag = 0.4 + 0.6 * r(); b.fine = 0.3 + 0.55 * r(); b.taper = 0.03 + 0.2 * r() * r(); b.skew = (r() - 0.5) * 1.8;
    b.wet = trailing ? 0.7 + 0.3 * r() : 0.25 + 0.65 * r();
    const t = r(); b.tear = t < 0.4 ? 0.2 * r() : t < 0.8 ? 0.2 + 0.4 * r() : 0.6 + 0.4 * r();
    if (r() < 0.25) b.gather = (r() < 0.5 ? -1 : 1) * (0.4 + 0.6 * r());
    let how = r(); const second = r(), marked = r();
    if (FORCE && (kind === 'rank' || kind === 'yard')) how = { flag: 0.03, drop: 0.15, over: 0.3, bunch: 0.42, rod: 0.5, plain: 0.9 }[FORCE] ?? how;      // &hang=over: every bolt hung that way, to look at it
    if (kind === 'rank' || kind === 'yard') {
      // (FOURTH LOOK) THE CLOTH OF AN ARCH IS ARCHITECTURE. A rank hung 0 to 34 per cent narrower than its places, a tenth of
      // it by one end or bunched, was a row of straps with the sky between all of them: the page's first postcard (seven
      // arches of cloth one inside the other) was gone. A rank's bolt hangs to its whole place (the page's 2.6 m of a 2.75 m
      // pitch, a hand more or less: slits of sky, not gaps), and half as many of them hang oddly as in the yards.
      const rank = kind === 'rank' && !FORCE, odd = rank ? 0.5 : 1;
      b.width *= rank ? 0.97 + 0.07 * r() : 0.84 + 0.16 * r();
      if (how < 0.06 * odd) b.drop = (r() < 0.5 ? -1 : 1) * (0.62 + 0.24 * r());                // it hangs by one end, its top edge falling away
      else if (how < 0.22 * odd) b.drop = (r() < 0.5 ? -1 : 1) * (0.25 + 0.27 * r());           // a corner off its pegs
      else if (how < 0.38 * odd && !trailing) b.over = 0.1 + 0.28 * r();                          // thrown over the line
      else if (how < 0.46 * odd) { b.full = 0.46 + 0.16 * r(); b.pegs = 3; b.width *= rank ? 0.8 : 0.66; }     // bunched along its line
      else if (how < 0.54 * odd && !trailing) { b.rod = true; b.tear = 0; b.skew = 0; b.taper = 0.02; }                      // a rod in its hem: the hem hangs straight and level
    } else if (kind === 'veil') { b.full = 0.12 + 0.1 * r(); b.pegs = 5 + Math.floor(r() * 2); b.sag = 0.15 + 0.3 * r(); b.tear = 0.15 * r(); b.wet = 0.15 + 0.2 * r(); b.gather = 0; b.skew *= 0.3; }
    else if (kind === 'new') { b.full = 0.1 + 0.12 * r(); b.sag = 0.1 + 0.3 * r(); b.tear = 0; b.skew = 0; b.wet = 0.2 + 0.3 * r(); b.gather = 0; if (!trailing && r() < 0.5) b.rod = true; }
    else if (kind === 'curtain' || kind === 'loft') { b.full = 0.2 + 0.14 * r(); b.sag = 0.1 + 0.25 * r(); b.tear = 0.25 * r(); b.skew *= 0.25; b.gather = 0; b.taper = 0; }      // (taper 0: its edges hang true and close against its neighbours: no sliver of bare sun between two curtains)
    if (trailing) { b.tear = Math.min(b.tear, 0.3); b.skew *= 0.3; }                        // its hem is under the water
    // ---- SECOND LOOK (a rng of its own, so that every bolt keeps what it had): rags, pleats, and cloth swept aside and tied
    {
      const q = rd2, ragged = q(), ragHow = q(), tiedHow = q(), tAt = q(), tTight = q(), tSlack = q(), tSide = q(), plt = q();
      const free = kind === 'rank' || kind === 'yard';
      // a hem in rags: of the cloth that hangs clear of the water four bolts in ten have lost their hem to the wind and the
      // pegs: torn away by up to a metre, narrow strips left hanging to its old length (the key painting's hems)
      if (free && !trailing && !b.rod && (ragged < 0.12 || FORCE === 'rag')) { b.rag = 0.25 + 0.4 * ragHow; b.tear = Math.max(b.tear, 0.3); }      // (third look: one in eight, and less of it: four in ten in big square flaps was cut paper; the hem's fringe carries the raggedness now)
      // pleats (wet cloth clings to itself): every bolt its own share of them, the wettest most
      b.pleats = 0.7 + 0.45 * plt + 0.35 * (b.wet - 0.5);
      // SWEPT ASIDE AND TIED: `tie` (from whoever hangs the bolt) says where a mast or a post stands to tie it to: { side, out,
      // chance }; any other rank or yard bolt may be gathered to one of its own edges (one in nine). The far edge runs taut
      // from its peg to the tie, the near threads sag, the tail hangs from the tie: no cloth of the nave is a plank then.
      const T = tie || (free && !b.rod ? { side: tSide < 0.5 ? -1 : 1, out: -0.08, chance: 0.11 } : null);
      if (T && (tiedHow < (T.chance ?? 1) || (FORCE === 'tie' && free))) {
        delete b.over; delete b.drop; delete b.rod; b.gather = 0;
        b.tie = { at: T.at ?? (trailing ? 0.46 + 0.24 * tAt : 0.36 + 0.28 * tAt), side: T.side, out: T.out ?? 0, tight: T.tight ?? (0.3 + 0.14 * tTight), slack: T.slack ?? (0.25 + 0.4 * tSlack), ...(QS.has('widetail') ? {} : { tail: T.tail ?? (0.36 + 0.2 * tTight) }) };      // (fifth look: `tail`: under its tie the cloth hangs as a bunch, not spread to two thirds of its width again: that was an hourglass; &widetail=1: as it was)
        b.full = Math.max(b.full, 0.24); b.pegs = Math.max(b.pegs, 4); b.stiff = Math.max(b.stiff || 0, 0.72);      // (tied cloth hardly lifts in the wind)
      }
      if (FORCE === 'slung' && free) { delete b.over; delete b.drop; delete b.tie; b.pegs = 2; b.sag = 1; b.full = 0.42; }
    }
    // ---- THIRD LOOK (a rng of its own again, so that every bolt keeps what it had): the folds hang FROM THE PEGS and are
    // deep; the hem is torn a little and frays into tatters and threads (the engine's `crease`, `fringe`)
    {
      const q = rd3, fuller = q(), creased = q(), creaseHow = q(), fr = q(), fineLess = q();
      const free = kind === 'rank' || kind === 'yard';
      // deeper: a wet bolt pegged in haste is half as wide again as the line it hangs on (`width` stays what it hangs to)
      b.full = free ? Math.min(0.62, b.full + FULLER + 0.16 * fuller) : kind === 'curtain' || kind === 'loft' ? Math.min(0.5, b.full + 0.06 + 0.1 * fuller) : Math.min(0.4, b.full + 0.06 + 0.09 * fuller);
      // creased at its pegs: more than half of them by a third to a half (a lobe between two pegs, a crease on the peg's line),
      // one in five deeply, one in four not at all (round folds: the lightest silk). (Wholly creased and full, a bolt is a row
      // of bolsters: tried, and wrong.)
      b.crease = QS.has('crease') ? +QS.get('crease') : creased < 0.55 ? 0.28 + 0.27 * creaseHow : creased < 0.75 ? 0.55 + 0.25 * creaseHow : 0.15 * creaseHow;
      if (b.crease > 0.5) { b.fine *= 0.45 + 0.4 * fineLess; b.full = Math.min(b.full, 0.42); }      // (a creased bolt is broad lobes: fewer small folds ride on them)
      // the big teeth go (from under a bolt they were a bat's wing): the hem is torn a little, and FRAYS
      b.tear = Math.min(b.tear, 0.16 + 0.22 * fr);
      b.fringe = kind === 'new' || trailing || b.rod ? 0 : kind === 'veil' ? 0.25 + 0.3 * fr : 0.3 + 0.7 * Math.sqrt(fr);
      // no fold as deep as its neighbour, nor as deep at the hem as under its pegs (a row of even flutes is a column)
      b.uneven = QS.has('uneven') ? +QS.get('uneven') : kind === 'new' ? 0.3 : 0.45 + 0.55 * q();
    }
    // ---- FOURTH LOOK (a rng of its own): WET CLOTH NECKS IN. Every bolt was a parallel-sided strip from heading to hem (a
    // plank; the trailing ones, which show neither their top nor their hem, columns). Heavy wet cloth clings to itself as it
    // hangs: the longer the bolt the narrower its lower half, and one that trails in the river is drawn in to the water
    // (its fullness goes into deeper folds there: the engine keeps its width). Curtains and the loft's wall stay true.
    {
      const q = rd4, tq = q(), free = kind === 'rank' || kind === 'yard';
      if (free && !b.rod && !QS.has('notaper')) { const long = Math.min(1, Math.max(0, (b.length - 4) / 9)); b.taper = Math.max(b.taper, trailing ? 0.24 + 0.2 * tq : (0.1 + 0.26 * tq) * long); }
    }
    // ---- FIFTH LOOK (a rng of its own). (1) NO NECKING. The fourth look's taper (to 0.44) made every long bolt a cone: wide
    // under its line, drawn in to the water, the sky between all of them: the first third of the nave was a wood of gold
    // trunks. A bolt hangs as wide as it was pegged; what gives it a shape is how it is HUNG (the nave's group below: swept to
    // its mast and bound, hanging clear in rags, trailing). (2) HEMS THAT READ FROM THE NAVE'S LENGTH: the third look's hems
    // (tear to 0.38) are cut with pinking shears. Cloth that hangs clear is torn: bitten in broad bites, cut on the slant,
    // one in three in rags, and its fringe (the cloth's `fringe`, below) is tatters as long as a forearm, not threads.
    {
      const q = rd5, tp = q(), tr = q(), rg = q(), rgHow = q(), fr = q(), sk = q();
      const free = kind === 'rank' || kind === 'yard';
      if (free && !QS.has('neck')) b.taper = b.rod ? 0.02 : 0.02 + 0.06 * tp;
      if (free && !trailing && !b.rod && !QS.has('pinked')) {
        b.tear = 0.3 + 0.4 * tr; b.skew = (sk - 0.5) * 2;
        b.rag = rg < 0.14 ? 0.25 + 0.4 * rgHow : 0;
        b.fringe = 0.5 + 0.5 * fr;
      }
      if (kind === 'loft' || kind === 'curtain') b.fringe = Math.min(b.fringe || 0, 0.28 + 0.24 * fr);      // (a wall of cloth a boat's length from the eye: a few tatters, not a row of fangs)
      if (five) Object.assign(b, five);                              // (what whoever hangs the bolt says of it by hand)
    }
    // undyed cloth that has hung in the works is no longer white: tea, with the gold of the first vat in it
    // (pale cloth in the shade of the nave shows the sky's cold light and stands like a stone pillar among the reds: the
    // narthex's new cloth keeps most of its cream, the rest is pale gold)
    // (second look: with the light that now comes THROUGH cloth, undyed cloth that hangs across the route can be nearly cream
    // again: it glows; only cloth hung along the route or out in the yards, which has the bank behind it and stood there like a white post or, half dyed, like a plank, is weld-yellow: the first vat's)
    const pale = (hex) => '#' + _a.set(hex).lerp(_b.set(D[SAFFRON].color), kind === 'new' ? 0.1 + 0.1 * r() : (b.along || kind === 'yard') ? 0.62 + 0.2 * r() : 0.2 + 0.14 * r()).multiplyScalar(kind === 'new' ? 0.93 : (b.along || kind === 'yard') ? 0.92 : 0.9).getHexString();
    if (dye === CREAM && kind !== 'veil' && !QS.has('cream')) { b.color = pale(b.color); b.wet *= 0.55; }      // (and a pale cloth's water line is a tan band, not a brown one)
    if (kind !== 'veil' && kind !== 'new') {
      // a second dye toward the hem: the zone's other dye, the later of the two below; or its own dye, deeper
      if (alt != null && dye != null && alt !== dye && second < 0.42) {
        if (alt > dye) b.hem = dyed(alt, 1, r); else { b.hem = b.color; b.color = alt === CREAM ? pale(dyed(alt, 1, r)) : dyed(alt, 1, r); }
        b.band = 0.3 + 0.45 * r();
      } else if (second < 0.75) { b.hem = deep(b.color, 0.6 + 0.2 * r()); b.band = 0.4 + 0.45 * r(); }
      // resist marks on one bolt in five: rings and ripples most often, the marks water makes; the all-over ones laid large
      const violet = dye === VIOLET || alt === VIOLET;                                 // (the key painting's pale rings are on the violet)
      if (marked < (violet ? 0.45 : 0.2) && kind !== 'loft') { const cell = violet ? [1, 1, 2, 3][Math.floor(r() * 4)] : MARKS[Math.floor(r() * MARKS.length)], wide = cell === 4 || cell === 5 || cell >= 7; b.mark = { cell, at: [0.3 + 0.4 * r(), 0.25 + 0.4 * r()], size: (wide ? 3.2 + 1.2 * r() : 2.3 + 1.2 * r()) * (cell <= 2 ? 1.55 : 1.2), flip: r() < 0.5 }; }      // (second look: half as large again: the key painting's rings are as wide as the cloth)
    }
    // (fifth look) A MARK MUST BE READ. Laid in the cloth's own metres on a bolt half gathered into its folds, a ring 2.5 m
    // across was three arcs and a hook: a scribble, a letter. A marked bolt hangs flatter (its folds take a quarter of it
    // at most), its mark is as wide as the cloth itself whatever its fullness, and it lies in the cloth's lower half, where
    // the rider's eye is. (The mask is repacked soft: cloth-tools/fifth/pack_resist2.py.)
    // (fifth look) A HEM WITHIN REACH OF THE EYE is looked at from a boat's length: there big teeth are a saw and long tatters
    // fangs. It is torn a little, frays, and hangs a few threads; its slant and its broad bites are what is read from far off.
    if (!trailing && hem < 5.5 && kind !== 'veil' && kind !== 'new') { const q = rd5, a = q(), c = q(); b.tear = Math.min(b.tear ?? 0, 0.24 + 0.14 * a); b.fringe = Math.min(b.fringe ?? 0, 0.3 + 0.3 * c); b.rag = Math.min(b.rag || 0, 0.3); }
    // pale cloth shows every streak as a grain of wood: its painted pleats are faint
    if ((dye === CREAM || dye === SAFFRON) && !QS.has('grain')) b.pleats = (b.pleats ?? 1) * 0.4;
    if (kind === 'curtain') delete b.mark;                           // (the door's low curtains stand behind the kept lamp and carry the coin: plain)
    if (b.mark && !QS.has('oldmarks') && !(b.mark.size === 4.4)) {
      const q = rd5, m1 = q(), m2 = q(), m3 = q();
      b._full = b.full; b.full = Math.min(b.full, 0.2 + 0.08 * m1);
      const Wc = b.width / (1 - b.full), big = b.mark.cell <= 2;
      b.mark.size = Wc * (big ? 1.2 : 1.55) * (0.9 + 0.25 * m2);
      b.mark.at = [0.4 + 0.2 * m3, b.length > 12 ? 0.5 + 0.28 * m1 : 0.38 + 0.25 * m1];
      if ((b.mark.cell === 4 || b.mark.cell === 5) && b.length < 12) { b.mark.cell = m2 < 0.5 ? 1 : 3; b.mark.size = Wc * 1.25; }      // (wake ripples and rain on a short bolt seen from under it are a flame, an emblem: rings there)
    }
    // ---- SIXTH LOOK (a rng of its own): MARKS ARE THE MARKS WATER MAKES, NOT A PRINT. As found the same trio of rings hung
    // on bolt after bolt (five in the stamp's picture, eight in the west front's), each whole and the same size, cream on
    // the indigo: a logo. Fewer bolts carry one (about one in six, of the violet one in four, never two neighbours), and a
    // mark is laid LARGER THAN ITS BOLT and off its middle: one broad ring runs off both edges, or two arcs cross a corner:
    // no two bolts show the same figure. (The engine reads it soft and never lighter than twice the cloth beside it:
    // `resist.lift`, `soft`, below.) A bolt that loses its mark hangs as full as it did. &marks5=1: as the fifth look left them.
    if (b.mark && b.mark.size !== 4.4 && !QS.has('marks5')) {
      const q = rd6, keep = q(), u1 = q(), u2 = q(), u3 = q(), u4 = q(), u5 = q(), viol = dye === VIOLET || alt === VIOLET;
      if (keep > (viol ? 0.62 : 0.78) || bolts.slice(-2).some((o) => o.mark && o.mark.size !== 4.4)) { delete b.mark; if (b._full != null) b.full = b._full; }
      else {
        const Wc = b.width / (1 - b.full), cells = viol ? [1, 1, 2, 3] : [1, 1, 2, 2, 3, 3];      // (rings and arcs only, the key painting's: not 6, the grid of dots: on the indigo it is a flag of stars; not 4 and 5, wake ripples and rain: from under a bolt or along a wall they are scratches of light, on the indigo a flag's stripes)
        let cell = cells[Math.floor(u1 * cells.length)];
        if (b.length < 5) cell = 0;                                    // (and a short bolt carries none: there a mark is a stamp)
        b.mark = cell === 0 ? undefined : { cell, size: Wc * (cell <= 2 ? 1.7 + 0.9 * u2 : cell === 3 ? 1.25 + 0.5 * u2 : 1.5 + 0.6 * u2), at: [0.12 + 0.76 * u3, (b.length > 12 ? 0.42 : 0.3) + 0.38 * u4], flip: u5 < 0.5 };
        if (!b.mark) { delete b.mark; if (b._full != null) b.full = b._full; }
      }
    }
    return b;
  };
  const bolts = [], groups = {};
  const TRAIL = QS.has('trail') ? +QS.get('trail') : 1.1;      // metres a trailing hem hangs under the water (second look: the layout's 0.35 stopped at the surface like a curtain above a floor)
  const group = (name, fn) => { const first = bolts.length; fn(); groups[name] = [first, bolts.length - first]; counts['bolts: ' + name] = bolts.length - first; };
  /** One bolt hanging square to the route at (s, d) from height `top`, its hem at `hem` (0 or less: it trails in the water). o: { kind, alt, stiff } */
  const across = (s, d, top, hem, width, dye, o = {}) => {
    const p = kit.at(s + (o.ds || 0), d, top), len = top - (hem <= 0 ? -TRAIL + hem : hem);      // (o.ds: a hand up or down the route: two cloths that cross never hang in one plane)
    bolts.push(dress({ position: [p.x, p.y, p.z], width, length: len, turn: head(s), color: typeof dye === 'string' ? dye : dyed(dye), stiff: hem <= 0 ? 0.45 : (o.stiff || 0), phase: rnd() * 20 }, o.kind, o.alt, hem, typeof dye === 'string' ? null : dye, o.tie, o.five));
  };
  /** One bolt hanging along the route (an aisle wall, a yard line) at (s, d). */
  const along = (s, d, top, hem, width, dye, o = {}) => {
    const p = kit.at(s, d, top), t = tangent(s), len = top - (hem <= 0 ? -TRAIL + hem : hem);
    bolts.push(dress({ position: [p.x, p.y, p.z], width, length: len, turn: Math.atan2(t[2], t[3]), color: dyed(dye), stiff: hem <= 0 ? 0.45 : 0, phase: rnd() * 20, along: true }, o.kind, o.alt, hem, dye, o.tie, o.five));
  };
  /** One bolt in the world: the middle of its top edge at (x, top, z), facing along z. */
  const world = (x, z, top, hem, width, dye, o = {}) => {
    const len = top - (hem <= 0 ? -TRAIL + hem : hem);
    bolts.push(dress({ position: [x, top, z], width, length: len, turn: 0, color: dyed(dye), stiff: hem <= 0 ? 0.45 : 0, phase: rnd() * 20 }, o.kind, o.alt, hem, dye, o.tie, o.five));
  };
  const sym = (list) => list.flatMap((d, i) => (d === 0 ? [[0, i]] : [[-d, i], [d, i]]));
  // ---- FIFTH LOOK: AN ARCH OF CLOTH HAS A LINE. The page's hems step down from the crown (12, 9.8, 6 m, then the water): as
  // built that was a staircase of square ends, and with every hem's own tear and length the seven arches of the first
  // postcard were lost in a jumble. Each bolt of an arch is CUT ON THE SLANT (the engine's `skew`, steeply): its hem runs
  // from where its inner neighbour's ends to where its outer neighbour's begins, so the rank's lower edge is one pointed
  // arch, ragged, from the crown to the water. slant(hems, i): metres its inner edge hangs higher than its outer one;
  // cut(len, slant, inner): what to tell the bolt (inner: +1 if its inner edge is its own +x, the right as the rider comes).
  const ARCHED = !QS.has('steps');                                    // (&steps=1: the staircase, for looking)
  const slant = (hems, i) => (ARCHED && i > 0 && hems[i] > 0 ? 0.45 * (hems[i - 1] - (hems[i + 1] ?? 0)) : 0);
  const cut = (len, sl, inner, q = rc) => (sl > 0 ? { skew: inner * sl / (0.08 * len), rod: false, tear: 0.3 + 0.35 * q(), rag: 0 } : null);

  // ---- the veil (our half of the passage in: nine cream cloths, hems brushing the water)
  group('veil', () => { const V = plan.veil; for (let i = 0; i < V.bolts; i++) across(V.s, (i - (V.bolts - 1) / 2) * V.step, V.top, 0.02, V.width, dyed(CREAM, 0.5), { kind: 'veil' }); });
  // ---- the narthex: two low cream frames
  group('narthex', () => { const N = plan.narthex; for (const f of N.frames) for (const [d, i] of sym(N.d)) across(f.s, d, f.line, N.hems[i] ? N.hems[i] + (rnd() - 0.5) * 0.3 : 0, N.width, CREAM, { kind: 'new' }); });
  // ---- the nave: six ranks; with the west front, seven arches
  group('nave', () => {
    const N = plan.nave;
    // (fifth look) how the two outer bolts of each rank hang: [left, right] for the frames at s 26, 37, 48, 59, 70, 81 (below). &plainarch=1: as the fourth look left them
    const ARCH = QS.has('plainarch') ? null : (QS.get('arch') ? QS.get('arch').split(',').map((x) => [x[0], x[1]]) : [['K', 'T'], ['C', 'C'], ['T', 'K'], ['K', 'C'], ['C', 'T'], ['T', 'C']]);      // (the rank at s 37 frames the first postcard: a curtain each side)
    N.frames.forEach((f, fi) => {
      const lean = fi === 3 ? 0.5 : 0;                               // one rank leans: its line is half a metre lower at one end
      for (const [d, i] of sym(N.d)) {
        let dye = i === 3 ? f.dyes[2] : i % 2 ? f.dyes[1] : f.dyes[0];
        if (f.edge !== undefined && d < -9) dye = f.edge;            // first violet and indigo at the left edge
        const top = f.line - lean * (d / 10.8) * 0.5, alt = f.dyes.find((x) => x !== dye) ?? null;
        let hem = N.hems[i] ? N.hems[i] + (rnd() - 0.5) * N.vary : 0;
        if (i < 3 || !ARCH) {
          const sl = slant(N.hems, i) * (0.85 + 0.3 * rc()); hem -= sl / 2;      // (its lower corner; the page's hem is its middle)
          across(f.s, d, top, hem, N.width, dye, { alt, tie: i === 4 ? { side: Math.sign(d), out: 0.05, chance: 0.64 } : null, five: cut(top - hem, sl, -Math.sign(d)) }); continue;
        }
        // ---- FIFTH LOOK: THE TWO OUTER BOLTS OF A RANK, ARCH BY ARCH AND SIDE BY SIDE (ARCH above). They are the largest
        // shapes of every picture in the nave, and hanging plumb into the water they showed neither top nor hem: columns.
        //   'T'  both trail in the river (the page's: the prow parts them)
        //   'K'  the inner one hangs clear of the water in rags; the outer one is bound to the mast, its tail in the river
        //   'C'  a curtain: both are swept to the mast and bound there with rope a few metres over the water, the inner one
        //        from the channel's side (its far edge runs taut from its peg to the mast), the outer one gathered on
        //        itself; their tails hang at the mast, ragged, dripping at the height of the eye (the key painting's curtains)
        // The mast stands 0.56 m inside the plan's place and 0.75 m up-route of its rank (kit_frames.js, which ties a cord
        // from it to every waist it can reach).
        const side = Math.sign(d), how = ARCH[fi][side < 0 ? 0 : 1], w = N.width, dMast = hw(f.s) + N.mast.out - 0.56, inner = i === 3;
        const r1 = rc(), r2 = rc(), r3 = rc();
        if (how === 'T') { across(f.s, d, top, 0, w, dye, { alt, tie: { chance: 0 } }); continue; }
        if (how === 'K' && inner) { const low = 0.5 + 1.4 * r1, sl = ARCHED ? 1.6 + 1.6 * r2 : 0; across(f.s, d, top, low, w, dye, { alt, tie: { chance: 0 }, five: { rag: 0.25 * r2, tear: 0.5 + 0.3 * r3, fringe: 1, ...(sl ? { skew: -side * sl / (0.08 * (top - low)), rod: false } : {}) } }); continue; }
        // bound to the mast: where its waist is made fast (metres above the water), and where that is in the bolt's own terms
        const tieY = how === 'C' ? (inner ? 4.6 + 2.2 * r1 : 6.3 + 2.4 * r1) : 6.0 + 3.0 * r1;
        hem = how === 'C' ? (inner ? 0.9 + 1.6 * r2 : r2 < 0.5 ? 0 : 1.6 + 1.6 * r2) : 0;
        const len = top - (hem <= 0 ? -TRAIL : hem), tight = 0.2 + 0.1 * r3, wT = tight * w;
        // the waist's outer edge a hand inside the mast's face (the inner bolt), or its middle at the mast (the outer one, gathered on itself)
        const out = inner ? (dMast - 0.32) - (Math.abs(d) + 0.5 * w) : (dMast - 0.1 + 0.5 * wT) - (Math.abs(d) + 0.5 * w);
        across(f.s, d, top, hem, w, dye, { alt, ds: inner ? -0.07 : 0.07, tie: { side, out, at: (top - tieY) / len, tight, slack: inner ? 0.3 + 0.3 * r2 : 0.15 + 0.2 * r2, chance: 1 }, five: hem > 0 ? { rag: r3 < 0.5 ? 0.25 + 0.5 * r3 : 0, tear: 0.5 + 0.3 * r2, fringe: 1 } : null });
      }
    });
  });
  // ---- the west front: nine bolts and two wings, crimson, violet at the left, the crown's bolt the palest
  group('west front', () => {
    const F = plan.westFront;
    for (const [d, i] of sym(F.d)) {
      { let hemF = F.hems[i] ? F.hems[i] + (rnd() - 0.5) * 0.4 : 0; const sl = slant(F.hems, i) * (0.85 + 0.3 * rc()); hemF -= sl / 2;
      across(F.s, d, F.line, hemF, F.width, d < -8 ? VIOLET : CRIMSON, { alt: d < -3 ? VIOLET : d > 8 ? MADDER : null, tie: i === 4 ? (QS.has('plainarch') ? { side: Math.sign(d), out: 0.5, at: d < 0 ? 0.5 : 0.58 } : { side: Math.sign(d), out: 0.5, at: (F.line - (d < 0 ? 6.4 : 5.6)) / (F.line + TRAIL), tight: 0.24, slack: 0.4 }) : null, five: cut(F.line - hemF, sl, -Math.sign(d)) }); }      // (the outermost: swept aside and tied to the great mast: the two curtains of the stamp)
      // (page: "at the crown the one bolt with three soft cream rings": it hangs whole, pegged, its rings where they are seen)
      if (d === 0 && DRAPED) Object.assign(bolts[bolts.length - 1], { mark: { cell: 1, at: [0.5, 0.42], size: 4.4 }, over: 0, drop: 0, rod: false, full: 0.2, pegs: 4, tear: 0.35, gather: 0, tie: null, rag: 0 });
    }
    // (fifth look: bound a few metres over the water, where the rider sees it, the wing above the front's own cloth; their tails ragged and clear)
    const wingAt = (y) => (QS.has('plainarch') ? null : (F.line - 0.6 - y) / (F.line - 0.6 - F.wing.hem));
    across(F.s, -F.wing.d, F.line - 0.6, F.wing.hem, F.width, VIOLET, { alt: INDIGO, ds: 0.08, tie: { side: 1, out: 0.2, at: wingAt(8.0) ?? 0.44, tight: 0.26 }, five: { tear: 0.6, fringe: 1, rag: 0.3 } }); across(F.s, F.wing.d, F.line - 0.6, F.wing.hem, F.width, CRIMSON, { alt: MADDER, ds: 0.08, tie: { side: -1, out: 0.2, at: wingAt(7.2) ?? 0.36, tight: 0.26 }, five: { tear: 0.6, fringe: 1, rag: 0.4 } });      // (the wings: tied to the same masts from outside)
  });
  // ---- aisle walls: cloth between the masts along both sides, from wall plates at 15 m, hems in the water
  group('aisle walls', () => {
    const N = plan.nave, A = N.aisle;
    for (const side of [-1, 1]) {
      const fill = side > 0 ? A.right : A.left;
      fill.forEach((n, bay) => {
        const s0 = N.frames[bay].s, zone = bay < 1 ? [CREAM, SAFFRON] : bay < 2 ? [SAFFRON, CREAM] : bay < 3 ? [SAFFRON, MADDER] : bay < 4 ? [MADDER, SAFFRON] : bay < 5 ? [MADDER, CRIMSON] : [CRIMSON, MADDER];
        const take = n >= 2 ? [0, 2] : n === 1 ? [1] : [];
        take.forEach((k, j) => {
          const s = s0 + A.slots[k];
          let dye = zone[j % 2]; if (side < 0 && bay >= 4) dye = j ? VIOLET : INDIGO;        // indigo from bay 5 on the left
          const altA = side < 0 && bay >= 4 ? (j ? INDIGO : VIOLET) : zone[(j + 1) % 2];
          if (QS.has('plainarch')) { along(s, side * (hw(s) + N.mast.out), A.plate, 0, A.width, dye, { alt: altA, tie: k === 1 ? null : { side: k === 0 ? -1 : 1, out: 0.4, chance: 0.5 } }); return; }      // (half of them swept aside to the mast at their bay's end)
          // (fifth look) THE AISLE WALLS are seen broadside from the boat, in the nave's shade: hanging plumb into the water they
          // were boards. Bay by bay: one is DRAWN ASIDE to the mast at its bay's end and bound a few metres over the water
          // (the bay opens behind it, as a curtain does), its tail ragged and clear; one hangs clear of the water, cut on
          // the slant, in rags; the rest trail. (kit_frames.js cords every waist within its masts' reach.)
          const r1 = rc(), r2 = rc(), r3 = rc(), end = k !== 1, how = end ? (r1 < 0.62 ? 'C' : r1 < 0.8 ? 'K' : 'T') : (r1 < 0.45 ? 'K' : 'T');
          if (how === 'C') {
            const hemA = 0.7 + 1.8 * r2, tieY = 4.4 + 2.6 * r3;
            along(s, side * (hw(s) + N.mast.out), A.plate, hemA, A.width, dye, { alt: altA, tie: { side: k === 0 ? -1 : 1, out: k === 0 ? 0.85 : -0.15, at: (A.plate - tieY) / (A.plate - hemA), tight: 0.2 + 0.08 * r2, slack: 0.3 + 0.35 * r3, tail: 0.34 + 0.16 * r2, chance: 1 }, five: { tear: 0.5 + 0.3 * r3, fringe: 1, rag: r2 < 0.4 ? 0.3 + 0.4 * r2 : 0, full: 0.34 + 0.14 * r3 } });
          } else if (how === 'K') {
            const hemA = 0.5 + 2.0 * r2, sl = 1.2 + 1.8 * r3;
            along(s, side * (hw(s) + N.mast.out), A.plate, hemA, A.width, dye, { alt: altA, tie: { chance: 0 }, five: { skew: (r1 < 0.5 ? -1 : 1) * sl / (0.08 * (A.plate - hemA)), rod: false, tear: 0.5 + 0.3 * r2, rag: 0.2 + 0.4 * r3, fringe: 1, full: 0.3 + 0.16 * r2 } });
          } else along(s, side * (hw(s) + N.mast.out), A.plate, 0, A.width, dye, { alt: altA, tie: { chance: 0 }, five: { full: 0.3 + 0.18 * r2, gather: (r3 < 0.5 ? -1 : 1) * (0.4 + 0.5 * r2) } });
        });
      });
    }
  });
  // ---- outer aisles: masts at d 20, posts at d 29, every 11 m, two bolts on each cross line
  group('outer aisles', () => {
    const O = plan.nave.outer;
    for (const s of O.stations) for (const side of [-1, 1]) O.d.forEach((d, j) => {
      const zone = s < 48 ? [CREAM, SAFFRON] : s < 70 ? [SAFFRON, MADDER] : [MADDER, CRIMSON];
      const top = O.mast.height - 0.6 - (O.mast.height - O.post.height) * (d - O.mast.d) / (O.post.d - O.mast.d);
      across(s, side * d, top, top - O.lengths[j], O.width, side < 0 && s > 70 ? INDIGO : zone[(j + (side > 0 ? 1 : 0)) % 2], { kind: 'yard', alt: side < 0 && s > 70 ? VIOLET : zone[(j + (side > 0 ? 0 : 1)) % 2] });
    });
  });
  // ---- the indigo house's hanging: eight bolts on four cross lines under its roof
  group('indigo house', () => {
    const H = plan.indigoHouse;
    for (let i = 0; i < 4; i++) for (const dd of [-3.2, 3.2]) across(H.at[0] - 10.5 + i * 7, H.at[1] + dd, H.eaves + 0.4, H.floor + 0.9, 2.6, INDIGO, { kind: 'yard' });
  });
  // ---- the blue yard: two walls and a short return of indigo cloth hanging into the water
  group('blue yard', () => {
    const Y = plan.blueYard;
    for (let i = 0; i < 6; i++) across(Y.back.s, Y.back.d[0] - 1.35 - i * 2.7, Y.mast - 0.6, Y.hem, Y.width, INDIGO, { kind: 'yard', alt: VIOLET });
    for (let i = 0; i < 6; i++) along(Y.south.s[0] + 1.35 + i * 2.7, Y.south.d, Y.mast - 0.6, Y.hem, Y.width, INDIGO, { kind: 'yard' });
    for (let i = 0; i < 2; i++) across(Y.ret.s, Y.ret.d[0] - 1.4 - i * 2.75, Y.mast - 0.6, Y.hem, Y.width, INDIGO, { kind: 'yard' });
  });
  // ---- the red yard: four lines behind the wringing gallery, sixteen madder and crimson bolts hung from 13 m
  group('red yard', () => {
    const Y = plan.redYard;
    Y.d.forEach((d, li) => { for (let i = 0; i < 4; i++) along(Y.s[0] + 4.5 + i * 9 + (li % 2) * 3, d, Y.top, Y.top - Y.length, Y.width, (i + li) % 2 ? CRIMSON : MADDER, { kind: 'yard', alt: (i + li) % 2 ? MADDER : CRIMSON }); });
  });
  // ---- the west door: eight bolts in the wheel's own plane; the three low southern ones are the curtains that make the dusk
  group('west door', () => { const W = plan.westDoor; W.x.forEach((x, i) => {
    // (fifth look: the door's arch has its line too: the two beside the crown and the one beyond are cut on the slant)
    const sl = ARCHED && (i === 3 || i === 5 || i === 6) ? 0.45 * Math.abs(W.hems[i - 1] - W.hems[i + 1]) * (i === 3 ? 0.5 : 1) * (0.85 + 0.3 * rc()) : 0, hemW = W.hems[i] - sl / 2;
    world(x, i < 3 ? W.z + (i % 2 ? 0.05 : -0.05) : W.z, W.line, hemW, i < 3 ? W.x[1] - W.x[0] + 0.12 : W.width, W.dyes[i], { kind: i < 3 ? 'curtain' : 'rank', alt: i < 3 ? null : W.dyes[i] === CRIMSON ? VIOLET : W.dyes[i] === VIOLET ? INDIGO : VIOLET, tie: i === 7 ? { side: 1, out: -0.1, at: 0.5 } : null, five: cut(W.line - hemW, sl, i < 4 ? 1 : -1) });
  }); });
  // ---- the right terrace: six violet bolts drying
  group('terrace', () => { const B = plan.rightTerrace.bolts; for (let i = 0; i < B.count; i++) { const s = B.s[0] + (B.s[1] - B.s[0]) * i / (B.count - 1); along(s, B.d, B.top + 3, 3 + B.top - B.length, B.width, VIOLET, { kind: 'yard', alt: INDIGO }); } });

  // ---- THE PAINTED CLOTH (generated art 4 and 5; cut, tiled and packed by reach-kit-cloth/pack_cloth.py and pack_resist.py:
  // docs/build/reach/2-kit-cloth.md). The engine's draped cloth lays them on every bolt:
  //   cloth.webp      red and green: two weaves (slub silk, linen with knots), repeating every 0.35 m: a bolt wears one or
  //                   the other; blue: the dyer's mottle, repeating every 3.6 m
  //   cloth_wet.webp  how soaked, about a water line at 0.607 of its height: blooms where it wicked up, runs above it
  //   resist.webp     nine resist marks, 3 x 3, white where the cloth was bound: 1 three rings, 2 rings in a corner,
  //                   3 small rings, 4 wake ripples, 5 rain, 6 a grid of dots, 7 three bands, 8 a net, 9 a V
  let paint = {};
  try {
    const [weaveTex, wetTex, resistTex] = await Promise.all([
      ctx.tex('art/reach/cloth.webp', { data: true, repeat: true }), ctx.tex('art/reach/cloth_wet.webp', { data: true, repeat: true }), ctx.tex('art/reach/resist.webp', { data: true }),
    ]);
    wetTex.wrapT = THREE.ClampToEdgeWrapping; wetTex.needsUpdate = true;
    // (fifth look: the weave's picture is laid three times as large and half as strong again (was 0.35 m, 0.6): at its true size it
    // could be seen only within two metres, and from a boat's length a smooth cloth with runs of dye was a board of veneer;
    // its slubs now show at four or five metres: raw silk. &wf=0.35&ws=0.6: as it was)
    paint = { weave: { map: weaveTex, fine: QS.has('wf') ? +QS.get('wf') : 1.0, broad: 3.6, strength: QS.has('ws') ? +QS.get('ws') : 0.9, mottle: 0.48 }, wetMap: { map: wetTex, width: 2.4, height: 2.4, line: 0.607 }, resist: { map: resistTex, grid: [3, 3], color: C.cream, strength: QS.has('marks5') ? 0.64 : 0.9, tint: 0.7, ...(QS.has('marks5') ? {} : { lift: QS.has('ml') ? +QS.get('ml') : 2.2, soft: QS.has('ms') ? +QS.get('ms') : 1.3, thru: 0.5 }) } };      // (sixth look: a mark is paler cloth, read soft, never lighter than twice the cloth beside it, and glows a little against the light: the engine's resist.lift, soft, thru)
  } catch (e) { console.error('reach/kit.js: the painted cloth did not load: the bolts hang unpainted', e); }
  if (QS.has('nopaint')) paint = {};                                   // (&nopaint=1: without the painted textures, for measuring)
  // draped: only the bolts that say so carry a rod; a cloth thrown over its line lies over the frames' rail (kit_frames.js:
  // a rail's axis is plan.frames.rise above the top edges, its radius 0.11 to 0.135 m)
  const DRAPE = { rod: false, line: 0.15, lineAt: (plan.frames && plan.frames.rise) ?? 0.035 };
  // (second look) wet cloth clings to itself in narrow pleats, painted: streaks of light and dark down every bolt; and soaked
  // cloth lets MORE of the light behind it through (it was a brown band across a glowing cloth)
  // (third look) the pleats are quiet (0.85 drew every bolt as a striped plank from any distance): the real folds carry the
  // form now, creased at the pegs, and are PAINTED as a painter models drapery (`form`); torn hems carry a FRINGE of tatters
  // and threads (`fringe`). &pleat=0.85, &noform=1, &nofringe=1: for looking
  // (sixth look) the form of a fold is painted a third stronger (dark 1.2, lobe 0.18, deep 0.7, thru 0.75; were 0.9, 0.12, 0.5, 0.65): the
  // key painting's near cloth runs from a lit lobe to a valley three times as dark, ours ran to half as dark again. The pale
  // dyes cannot follow it into planks: light.js floors their shade (faceFloor). &formdark=0.9&formlobe=0.12&formdeep=0.5&formthru=0.65: as it was
  const LOOK = {
    ...(QS.has('nopleat') ? {} : { pleat: { amount: QS.has('pleat') ? +QS.get('pleat') : 0.4, every: 1.5, edge: 0.07 } }), thru: 0.85,
    ...(QS.has('noform') ? {} : { form: { dark: QS.has('formdark') ? +QS.get('formdark') : 1.2, lobe: QS.has('formlobe') ? +QS.get('formlobe') : 0.18, deep: QS.has('formdeep') ? +QS.get('formdeep') : 0.7, thru: QS.has('formthru') ? +QS.get('formthru') : 0.75, lobeThru: 0.2, hem: 0.5, tatter: 0.6 } }),
    ...(QS.has('nobleed') ? {} : { bleed: { width: QS.has('bw') ? +QS.get('bw') : 1.6, runs: QS.has('br') ? +QS.get('br') : 1.1, stain: 0.16 } }),      // (fifth look: a dip that BLED: the second dye begins over metres, in runs and fingers: it was a ruled line, a flag's stripe; &nobleed=1: the line)
    ...(QS.has('nofringe') ? {} : { fringe: QS.has('threads') ? { count: 14, length: 0.6, width: 0.045 } : { count: QS.has('fc') ? +QS.get('fc') : 26, length: QS.has('fl') ? +QS.get('fl') : 0.8, width: QS.has('fw') ? +QS.get('fw') : 0.06 } }),      // (fifth look: more of them, a little wider than the third look's threads. Tried and thrown away: tatters to read from the nave's length, 0.6 to 1.25 m long and 9 to 15 cm wide: from a boat's length they are a row of fangs. From far off a hem is read by its slant and its bites, near to by its threads; &threads=1: the third look's)
  };
  const SEGS = QS.has('segs') ? QS.get('segs').split('x').map(Number) : [36, 20];      // columns and rows of a draped bolt (&segs=24x16 tries others); the water's soft mirror takes 14 by 10
  // (fifth look: a rod in a hem is peeled wood, a thumb thick: the engine's default, a dark plum line, floated under the narthex's
  // cream cloth like a stroke of ink)
  const ROD = DRAPED ? { color: '#9A7862', thick: 0.05, past: 0.07 } : true;
  const cloth = makeCloth(ctx, bolts, {
    ...paint,
    wind: shared.wind, backlight: 0.9, sway: 0.35, speed: 0.5, part: true, segments: DRAPED ? SEGS : [10, 24], steps: 16, wet: 0.5, hem: true, rod: ROD, heading: 10, selvedge: 0.5,
    water: { current: [0, -1], strength: 0.25, wake: 0.6, float: 0.5 }, mirror: 'half', mirrorSegments: [14, 10],
    drape: DRAPED ? DRAPE : null, ...(DRAPED ? LOOK : {}),
  });
  if (sun) sun.cloth(cloth, bolts);
  // ---- the loft (our half of the passage out): four ranks of seven indigo bolts, hems 0.4 m above the water. A cloth of
  // its own, because the sun's coin must show in its first rank although three more hang behind it (light.js, `mask`)
  const main = bolts.length, loftBolts = [];
  { const T = plan.loft; for (const s of T.ranks) for (let i = 0; i < T.bolts; i++) across(s + (i % 2 ? 0.05 : -0.05), (i - (T.bolts - 1) / 2) * T.width, T.tie, T.hem, T.width + 0.12, INDIGO, { kind: 'loft' }); }      // (each overlaps its neighbour a hand, a hand in front of it or behind: a wall with no sliver of light, and no two cloths in one plane)
  while (bolts.length > main) loftBolts.unshift(bolts.pop());
  groups.loft = [main, loftBolts.length]; counts['bolts: loft'] = loftBolts.length;
  const loftCloth = makeCloth(ctx, loftBolts, {
    ...paint, wind: shared.wind, backlight: 0.9, sway: 0.3, speed: 0.45, part: true, segments: DRAPED ? SEGS : [10, 24], steps: 16, wet: 0.5, hem: true, rod: true, heading: 10, selvedge: 0.5, mirror: 'half', mirrorSegments: [14, 10],
    drape: DRAPED ? DRAPE : null, ...(DRAPED ? LOOK : {}),
  });
  loftCloth.mesh.name = 'cloth loft';
  // (sixth look: the loft's coin is its own: stronger, gold over most of its disc, a wider halo in the indigo: light.js, sun.cloth's `coin`. &coin5=1: as it was)
  if (sun) sun.cloth(loftCloth, loftBolts, { mask: false, ...(QS.has('coin5') ? {} : { coin: { gain: QS.has('cg') ? +QS.get('cg') : 1.7, heart: 1, heartPow: QS.has('cp') ? +QS.get('cp') : 0.9, edge: 0.15, gold: '#FF9428', halo: QS.has('ch') ? +QS.get('ch') : 1.8 } }) });
  shared.cloth = { handle: cloth, bolts, groups, loft: loftCloth, loftBolts };
  // FOR THE CAST: where every hem drips. Two tips to each bolt whose hem hangs clear of the water: the lowest points of its
  // torn hem at rest, found by the same function the shader cuts the hem by (cloth.hemPoints). { x, y, z, color (the dye
  // there), wet 0..1, bolt (its index in shared.cloth.bolts, or in loftBolts when `loft`), loft }
  {
    const drips = [], tips = (handle, list, loft) => list.forEach((b, i) => {
      if (b.position[1] - b.length < 0.15 || typeof handle.hemPoints !== 'function') return;
      for (const q of handle.hemPoints(i, 2)) drips.push({ x: q.x, y: q.y, z: q.z, color: b.hem || b.color, wet: b.wet ?? 0.5, bolt: i, loft });
    });
    tips(cloth, bolts, false); tips(loftCloth, loftBolts, true);
    shared.cloth.drips = drips; counts['hem tips (for drips)'] = drips.length;
  }
  counts['bolts in all'] = bolts.length + loftBolts.length;

  // ================================================================================================ frames and masts
  const mastHeads = [];                                              // where flying silks are tied: [x, y, z, s]
  // ---- STAND-IN for `narthex frame` (Blender kit, 2): two pale masts 12.5 m and the line the cloth hangs from
  {
    const p = new Pile(), N = plan.narthex;
    for (const f of N.frames) {
      for (const side of [-1, 1]) p.cyl(kit.at(f.s, side * N.mast.d, -1), [N.mast.thick, N.mast.height + 1, N.mast.thick * 0.7], C.oakNew, 8);
      p.stick(kit.at(f.s, -N.mast.d, f.line), kit.at(f.s, N.mast.d, f.line), 0.09, C.oakNew, 4);
    }
    build(p, 'narthex frames');
  }
  // ---- STAND-IN for `nave frame` (Blender kit, 6 in 3 variants): masts 19.5 to 21 m outside the channel edge, the tie, the wall plates
  {
    const p = new Pile(), N = plan.nave, F = plan.westFront;
    const feet = N.frames.map((f) => ({ s: f.s, d: hw(f.s) + N.mast.out, h: f.mast, line: f.line }));
    feet.forEach((f, i) => {
      for (const side of [-1, 1]) {
        const lean = (rnd() - 0.5) * 0.4, foot = kit.at(f.s, side * f.d, -1.2), top = kit.at(f.s + lean * 0.3, side * (f.d + lean), f.h);
        p.stick(foot, top, [N.mast.thick, N.mast.thick * 0.62], C.oak, 8);
        p.stick(kit.at(f.s, side * f.d, 0.5), kit.at(f.s, side * f.d, -0.4), N.mast.thick + 0.16, C.oakWet, 8);      // tarred rope at the waterline
        mastHeads.push([top.x, top.y, top.z, f.s, side]);
        // the wall plate to the next mast (the last bay's runs to the west front)
        const g = i < feet.length - 1 ? feet[i + 1] : { s: F.s, d: F.mast.d };
        p.stick(kit.at(f.s, side * f.d, N.aisle.plate), kit.at(g.s, side * g.d, N.aisle.plate), 0.22, C.oak, 4);
      }
      p.stick(kit.at(f.s, -f.d, f.line), kit.at(f.s, f.d, f.line), 0.16, C.oak, 4);                                  // the tie the rank hangs from
    });
    shared.naveFeet = feet;
    build(p, 'nave frames');
  }
  // ---- STAND-IN for `aisle masts and posts` (Blender kit, 62 in 4 variants): the outer aisles, the yards, the terrace line
  {
    const p = new Pile(), O = plan.nave.outer;
    const mast = (s, d, h, t = 0.3) => p.cyl(kit.at(s, d, 0), [t, h + 0, t * 0.6], C.oak, 6);
    for (const s of O.stations) for (const side of [-1, 1]) {
      const b = shared.reach ? shared.reach.bank(side, s) : null, y0 = (d) => (b ? (Math.abs(d) - hw(s) > b.out[2] ? b.y[2] : Math.abs(d) - hw(s) > b.out[1] ? b.y[1] : b.y[0]) : 2);
      const a = kit.at(s, side * O.mast.d, y0(O.mast.d)), c = kit.at(s, side * O.post.d, y0(O.post.d));
      p.stick(a, [a.x, O.mast.height, a.z], [0.32, 0.2], C.oak, 6); p.stick(c, [c.x, O.post.height, c.z], [0.26, 0.18], C.oak, 6);
      p.stick([a.x, O.mast.height - 0.6, a.z], [c.x, O.post.height - 0.6, c.z], 0.07, C.oakWet, 4);
    }
    // the blue yard's eight masts, 11 m, standing in the water
    const Y = plan.blueYard, ym = [];
    for (let i = 0; i <= 3; i++) ym.push([Y.back.s, Y.back.d[0] - i * 5.4]);
    for (let i = 1; i <= 3; i++) ym.push([Y.south.s[1] - i * 5.4, Y.south.d]);
    ym.push([Y.ret.s, Y.ret.d[0]]);
    for (const [s, d] of ym) mast(s, d, Y.mast, 0.3);
    p.stick(kit.at(Y.back.s, Y.back.d[0], Y.mast - 0.6), kit.at(Y.back.s, Y.back.d[1], Y.mast - 0.6), 0.07, C.oakWet, 4);
    p.stick(kit.at(Y.south.s[0], Y.south.d, Y.mast - 0.6), kit.at(Y.south.s[1], Y.south.d, Y.mast - 0.6), 0.07, C.oakWet, 4);
    p.stick(kit.at(Y.ret.s, Y.ret.d[0], Y.mast - 0.6), kit.at(Y.ret.s, Y.ret.d[1], Y.mast - 0.6), 0.07, C.oakWet, 4);
    // the red yard: three posts to a line, 13.6 m
    const RY = plan.redYard;
    for (const d of RY.d) { for (const s of [RY.s[0], (RY.s[0] + RY.s[1]) / 2, RY.s[1]]) { const f = kit.at(s, d, 2.6); p.stick(f, [f.x, RY.top + 0.6, f.z], [0.3, 0.2], C.oak, 6); } p.stick(kit.at(RY.s[0], d, RY.top), kit.at(RY.s[1], d, RY.top), 0.07, C.oakWet, 4); }
    // the right terrace's drying line
    const B = plan.rightTerrace.bolts;
    for (let i = 0; i < 4; i++) { const s = B.s[0] - 1.5 + (B.s[1] - B.s[0] + 3) * i / 3, f = kit.at(s, B.d, 3); p.stick(f, [f.x, 3 + B.top + 0.6, f.z], [0.26, 0.18], C.oak, 6); }
    p.stick(kit.at(B.s[0] - 1.5, B.d, 3 + B.top), kit.at(B.s[1] + 1.5, B.d, 3 + B.top), 0.07, C.oakWet, 4);
    build(p, 'aisle masts and posts');
  }
  // ---- STAND-IN for `door mast` (Blender kit, 2): 23 m, one on the pier's north end, one on the right bank; the door's line
  {
    const p = new Pile(), W = plan.westDoor;
    for (const [x, z] of W.masts) { p.stick([x, -1, z], [x, W.mast, z], [0.6, 0.38], C.oak, 8); mastHeads.push([x, W.mast, z, 209, x > 20 ? 1 : -1]); }
    p.stick([W.masts[0][0], W.line, W.z], [W.masts[1][0], W.line, W.z], 0.2, C.oak, 4);
    build(p, 'door masts');
  }
  shared.mastHeads = mastHeads;

  // ================================================================================================ the vault and the flying silks
  // ---- the vault: twelve swags, silks 1.2 by 26 m from each mast head to the opposite mast head of the next frame (the engine's makeSwags)
  {
    const N = plan.nave, F = plan.westFront, heads = shared.naveFeet.map((f) => ({ s: f.s, d: f.d, h: f.h })).concat([{ s: F.s, d: F.mast.d, h: F.mast.height }]);
    const swags = [];
    for (let i = 0; i < heads.length - 1; i++) for (const side of [-1, 1]) {
      const a = heads[i], b = heads[i + 1], pa = kit.at(a.s, side * a.d, a.h - 0.4), pb = kit.at(b.s, -side * b.d, b.h - 0.4);
      const zone = a.s < 48 ? SAFFRON : a.s < 70 ? (side > 0 ? MADDER : SAFFRON) : (side > 0 ? CRIMSON : MADDER);
      // (no two alike: its width, its sag, a deeper dye toward one end)
      const c = dyed(zone, 1, rd);
      swags.push({ from: [pa.x, pa.y, pa.z], to: [pb.x, pb.y, pb.z], sag: N.swags.sag * (side > 0 ? 0.72 : 1.18) * (0.9 + 0.25 * rd()), width: N.swags.width * (0.95 + 0.45 * rd()), color: c, tip: deep(c, 0.62 + 0.25 * rd()) });      // (second look: the two of a bay hang a metre apart where they cross: they passed through one another)
    }
    // slung silk: gathered to a rope where it is tied, full between, its fullness lying in deep folds along it, its edges curled up
    const SW6 = !QS.has('swags5');                                    // (&swags5=1: the swags as the fifth look left them)
    const sw = makeSwags(ctx, swags, { wind: shared.wind, width: N.swags.width, backlight: 0.9, fold: SW6 ? 0.15 : 0.13, cup: 0.85, gather: 0.05, segments: SW6 ? [20, 56] : [12, 48] });      // (second look: slung silk hangs in a deep trough, not as a flat strap: cup 0.85)
    if (typeof sw.look === 'function' && !QS.has('plainswags')) sw.look({ pleat: 0.85, wet: 0.7, twist: QS.has('twist') ? +QS.get('twist') : 0.55, bunch: 0.22, ...(SW6 ? { taper: QS.has('swt') ? +QS.get('swt') : 1.1, folds: 1, deep: QS.has('swd') ? +QS.get('swd') : 0.3 } : {}) });      // (sixth look: it pulls itself narrow toward its ties, its fullness lies along it in folds as deep in its belly as at its ties, and it is heavy with dye: the engine's taper, folds, deep)
         // (fourth look: a silk 26 m long turns over as it hangs and bunches here and there: from under it narrows to a line and opens again; it was a flat tape)
           // (second look: heavy wet silk: pleats along it, a dark belly; the light comes through between its pleats)
    if (sun) sun.drape(sw);
    counts.swags = swags.length;
  }
  // ---- STAND-IN for the cast's flying silks (26, the engine's makeRibbons): tethered to the mast heads, streaming west.
  // (Staging lets them go in the unpegging; the cast makes its own and removes this: removeStandIn(ctx, 'flying silks').)
  {
    const F = plan.westFront, items = [], tie = (x, y, z, len, dye) => items.push({ at: [x, y, z], length: len, width: 0.8, color: dyed(dye), tip: dyed(dye) });
    for (const side of [-1, 1]) { const h = kit.at(F.s, side * F.mast.d, F.mast.height); mastHeads.push([h.x, h.y, h.z, F.s, side]); }
    for (const [s, d, h] of plan.silkMasts) { const q = kit.at(s, d, h); mastHeads.push([q.x, q.y, q.z, s, Math.sign(d)]); }
    for (const [x, z] of plan.tenter.masts) mastHeads.push([x, plan.tenter.mast, z, 300, Math.sign(x)]);
    for (const [x, y, z, s] of mastHeads) tie(x, y - 0.2, z, 22 + rnd() * 14, s < 70 ? SAFFRON : rnd() < 0.3 ? MADDER : SAFFRON);      // saffron: the flying silks are the gold of the works
    const silks = makeRibbons(ctx, { kind: 'silk', items, wind: shared.wind, seed: 26 });
    silks.object.name = 'standin:flying silks';
    if (sun) sun.drape(silks);
    shared.silkTies = items; shared.silks = silks;
    counts['flying silks'] = items.length;
  }

  // ================================================================================================ the works
  // Where the land stands at (s, d): the level of the step that point is on (set.js lays the banks).
  const ground = (s, d) => {
    if (!shared.reach) return 0;
    const side = d < 0 ? -1 : 1, b = shared.reach.bank(side, Math.min(s, side < 0 ? 139 : 400)), out = Math.abs(d) - hw(s);
    return out > b.out[2] ? b.y[2] : out > b.out[1] ? b.y[1] : out > b.out[0] ? b.y[0] : -0.4;
  };
  const on = (s, d, lift = 0) => kit.at(s, d, ground(s, d) + lift);
  const vats = [], spouts = [];                                      // for the cast: where steam rises and dye falls
  // a wheel as a stand-in: two rims, spokes, paddles; `axis` is the way its axle lies
  const wheelInto = (p, c, radius, axis, color, spokes = 8, wide = 1.2, paddles = 0) => {
    const ax = new THREE.Vector3(axis[0], axis[1], axis[2]).normalize(), u = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize(), v = new THREE.Vector3(0, 1, 0);
    for (const k of [-wide / 2, wide / 2]) p.ring([c.x + ax.x * k, c.y + ax.y * k, c.z + ax.z * k], radius, [ax.x, ax.y, ax.z], Math.max(0.12, radius * 0.07), color, 32);
    for (let i = 0; i < spokes; i++) { const a = i / spokes * Math.PI * 2, e = [c.x + (u.x * Math.cos(a) + v.x * Math.sin(a)) * radius, c.y + Math.sin(a) * radius, c.z + (u.z * Math.cos(a)) * radius]; p.stick([c.x, c.y, c.z], e, Math.max(0.1, radius * 0.06), color, 4); }
    for (let i = 0; i < paddles; i++) { const a = (i + 0.5) / paddles * Math.PI * 2, r = radius + 0.15, m = [c.x + u.x * Math.cos(a) * r, c.y + Math.sin(a) * r, c.z + u.z * Math.cos(a) * r]; p.stick([m[0] - ax.x * wide / 2, m[1], m[2] - ax.z * wide / 2], [m[0] + ax.x * wide / 2, m[1], m[2] + ax.z * wide / 2], 0.3, color, 4); }
    p.stick([c.x - ax.x * (wide / 2 + 0.3), c.y, c.z - ax.z * (wide / 2 + 0.3)], [c.x + ax.x * (wide / 2 + 0.3), c.y, c.z + ax.z * (wide / 2 + 0.3)], Math.max(0.16, radius * 0.1), C.iron, 6);
  };

  // ---- STAND-IN for `vat` (Blender kit, 46 in 4 variants, 3 m and 2.4 m across, 1.3 m tall) and the causeway's 7 pans.
  // (The indigo house's six sunk vats are stood in with the house: heroes_b.js.)
  {
    const p = new Pile(), N = plan.nave.terraces, vat = (s, d, across = 3, dye = MADDER) => { const f = on(s, d); p.cyl(f, [across, 1.3, across * 0.94], C.stoneLocal, 14); vats.push({ x: f.x, y: f.y + 1.3, z: f.z, across, dye, s, d }); };
    for (const side of [-1, 1]) {                                     // the side aisles: eleven a bank on the three steps
      const dye = (s) => (s < 48 ? SAFFRON : side < 0 && s > 70 ? INDIGO : s < 70 ? MADDER : CRIMSON);
      for (const s of [30, 44, 58, 72]) vat(s, side * (hw(s) + N.out[0] + 2.5), 3, dye(s));
      for (const s of [36, 52, 68, 84]) vat(s, side * (hw(s) + N.out[1] + 3), 3, dye(s));
      for (const s of [42, 62, 82]) vat(s, side * (hw(s) + N.out[2] + 2.5), 2.4, dye(s));
    }
    const M = plan.madderSteps;                                       // the madder steps: ten under half-lids
    for (const s of [100, 114, 122]) vat(s, hw(s) + M.out[0] + 2, 3, MADDER);
    for (const s of [99, 113, 119, 126]) vat(s, hw(s) + M.out[1] + 2, 3, MADDER);
    for (const s of [98, 116, 124]) vat(s, hw(s) + M.out[2] + 2.5, 2.4, CRIMSON);
    const R = plan.rightTerrace;                                      // the right terrace: eight
    for (const s of [219, 224.5]) vat(s, hw(s) + R.out[0] + 2.2, 2.4, VIOLET);
    for (const s of [215, 233, 238]) vat(s, hw(s) + R.out[1] + 2.5, 3, VIOLET);
    for (const s of [218, 224, 231]) vat(s, hw(s) + R.out[2] + 2.5, 3, INDIGO);
    counts.vats = vats.length + plan.indigoHouse.vats;
    const K = plan.causeway;                                          // the causeway's seven shallow dye pans, 1 m tall
    // (page: 1 m tall. From an eye 1.1 m up a pan 1 m tall on the 0.5 m apron hides the sun, which the page wants bare over
    // them: they stand 0.45 m proud of the apron, their rims below the eye)
    for (const s of [214, 217.5, 221, 228.5, 232, 235.5, 238.5]) { const f = kit.at(s, -(hw(s) + 3.2 + (s - 212) * 0.12), K.top); p.cyl(f, [3.4, K.panHeight, 3.2], C.stoneLocal, 14); vats.push({ x: f.x, y: f.y + K.panHeight, z: f.z, across: 3.4, dye: INDIGO, pan: true, s }); }
    counts.pans = 7;
    build(p, 'vats and pans');
  }
  // ---- STAND-IN for `spout` (Blender kit, 26 in 5 variants): a half-log trough 1.2 to 2 m on a forked post
  {
    const p = new Pile(), sp = (s, d, y, dye, len = 1.6) => {
      const side = d < 0 ? -1 : 1, a = kit.at(s, d, y), b = kit.at(s, d - side * len, y - 0.12);
      p.stick(a, b, 0.34, C.oakWet, 4); p.stick(kit.at(s, d - side * len * 0.55, Math.min(y - 0.3, ground(s, d - side * len * 0.55))), kit.at(s, d - side * len * 0.55, y - 0.1), 0.14, C.oak, 4);
      spouts.push({ x: b.x, y: b.y, z: b.z, fall: b.y, dye, side, s });
    };
    const N = plan.nave.terraces;
    for (const s of [34, 52, 76, 86]) sp(s, hw(s) + N.out[0] + 0.3, N.height[0] + 0.25, s < 48 ? SAFFRON : MADDER);       // (34, 15.5), (52, 15.5), (76, 15.5): madder from the right bank
    for (const s of [34, 58, 76, 88]) sp(s, -(hw(s) + N.out[0] + 0.3), N.height[0] + 0.25, s < 48 ? SAFFRON : s < 70 ? MADDER : INDIGO);      // indigo from the left bank from bay 5
    for (const s of [112, 124, 136]) sp(s, -(hw(s) + 3.2), 0.8 + 0.2, INDIGO, 1.4);                                       // three on the indigo quay
    for (const s of [102, 114, 120, 126]) sp(s, hw(s) + plan.madderSteps.out[0] + 0.3, 1.15, MADDER);
    for (const s of [215, 219.5, 229, 233, 237]) sp(s, -(hw(s) + 0.9), plan.causeway.top + 0.4, INDIGO, 1.2);              // the causeway's five, 0.9 m falls
    [216, 220, 224.5, 228.5, 232.5, 237].forEach((s, i) => sp(s, hw(s) + plan.rightTerrace.out[i % 2 ? 1 : 0] + 0.3, i % 2 ? 2.6 : 1.3, VIOLET, i % 2 ? 4.8 : 1.4));      // the right terrace's six, falls of 1.2 to 2.6 m
    counts.spouts = spouts.length;
    build(p, 'spouts');
  }
  shared.vats = vats; shared.spouts = spouts;
  // ---- STAND-IN for `skein rack` (Blender kit, 14 in 3 variants) and their hanks (150, instanced, 120 triangles each)
  {
    const p = new Pile(), h = new Pile(), racks = [];
    for (const side of [-1, 1]) for (const s of [31, 44, 58, 70, 84]) racks.push([s, side * (hw(s) + 2.6), s < 48 ? SAFFRON : side < 0 && s > 66 ? INDIGO : s < 66 ? MADDER : CRIMSON]);      // standing in the ford (perches: (44, -13), (58, 13))
    racks.push([141, hw(141) + 2.2, CRIMSON], [181, hw(181) + 2.4, CRIMSON], [217.5, hw(217.5) + 3.6, VIOLET], [233.5, hw(233.5) + 3.6, VIOLET]);
    let hanks = 0;
    for (const [s, d, dye] of racks) {
      const y0 = Math.max(-0.5, ground(s, d)), a = kit.at(s - 2, d, y0), b = kit.at(s + 2, d, y0);
      p.stick(a, [a.x, y0 + 2.5, a.z], 0.14, C.oak, 5); p.stick(b, [b.x, y0 + 2.5, b.z], 0.14, C.oak, 5); p.stick([a.x, y0 + 2.2, a.z], [b.x, y0 + 2.2, b.z], 0.09, C.oak, 5);
      const n = hanks < 140 ? 11 : 5;
      for (let i = 0; i < n; i++) { const q = a.clone().lerp(b, (i + 0.7) / (n + 0.4)); h.box([q.x, y0 + 2.18 - 1.25 - rnd() * 0.2, q.z], [0.2, 1.25 + rnd() * 0.2, 0.2], dyed(dye), rnd() * 3); hanks++; }
    }
    counts['skein racks'] = racks.length; counts.hanks = hanks;
    build(p, 'skein racks'); build(h, 'hanks', { label: false });
    shared.racks = racks;
  }
  // ---- STAND-IN for `wringer` (Blender kit, 9): a wheel 3.2 m on a trestle 3.6 m, a fixed post 2.6 m off, the skein between
  {
    const p = new Pile(), sk = new Pile();
    const wringer = (f, toward, dye) => {                              // f: where its trestle stands; toward: unit x, z the skein runs (out over the water)
      const hub = new THREE.Vector3(f.x, f.y + 2.3, f.z), post = new THREE.Vector3(f.x + toward[0] * 2.6, f.y + 2.3, f.z + toward[1] * 2.6);
      wheelInto(p, hub, 1.6, [toward[0], 0, toward[1]], C.oak, 8, 0.3, 0);
      for (const k of [-1, 1]) p.stick([f.x - toward[1] * k * 1.1 - toward[0] * 0.5, f.y, f.z + toward[0] * k * 1.1 - toward[1] * 0.5], [hub.x - toward[0] * 0.3, hub.y + 1.3, hub.z - toward[1] * 0.3], 0.22, C.oak, 4);
      p.stick([post.x, Math.min(f.y, -0.6) , post.z], [post.x, post.y + 0.5, post.z], 0.2, C.oak, 5);
      sk.stick(hub, post, [0.42, 0.3], dyed(dye), 7);
    };
    const side = (s, d) => { const t = tangent(s), k = d > 0 ? -1 : 1; return [t[2] * k, t[3] * k]; };      // toward the water
    wringer(on(66, 15.5), side(66, 15.5), CRIMSON); wringer(on(78, -15.5), side(78, -15.5), CRIMSON);
    if (shared.gallery) for (let i = 0; i < 5; i++) { const f = shared.gallery.frame(-16 + i * 8, -1.2, shared.gallery.floor), t = tangent(plan.gallery.at[0]); wringer(f, [-t[2], -t[3]], i % 2 ? MADDER : CRIMSON); }
    wringer(on(214, 12), side(214, 12), VIOLET); wringer(on(236, 12), side(236, 12), VIOLET);
    counts.wringers = 9;
    build(p, 'wringers'); build(sk, 'skeins', { label: false });
  }
  // ---- STAND-IN for `dipping beam` (Blender kit, 6): post 4.5 m, beam 9 m, a cradle of cloth, a stone counterweight
  {
    const p = new Pile(), cl = new Pile(), H = plan.indigoHouse;
    const beam = (f, dir, dye, tilt) => {                              // dir: unit x, z from the counterweight toward the cradle
      const top = new THREE.Vector3(f.x, f.y + 4.5, f.z), a = new THREE.Vector3(top.x + dir[0] * 5.2, top.y + tilt * 5.2, top.z + dir[1] * 5.2), b = new THREE.Vector3(top.x - dir[0] * 3.8, top.y - tilt * 3.8, top.z - dir[1] * 3.8);
      p.stick(f, top, 0.36, C.oak, 4); p.stick(b, a, [0.34, 0.24], C.oak, 4); p.box([b.x, b.y - 0.9, b.z], [0.8, 0.8, 0.8], C.stoneLocal);
      p.stick(a, [a.x, a.y - 1.2, a.z], 0.06, C.oakWet, 4);
      cl.box([a.x, a.y - 1.2 - 3.0, a.z], [2.2, 3.0, 0.16], dye, Math.atan2(dir[0], dir[1]) + Math.PI / 2);
    };
    const t = tangent(H.at[0]);
    for (let i = 0; i < H.beams; i++) { const f = kit.at(H.at[0] - 10.5 + i * 7, H.at[1] + 9.2, H.floor); beam(f, [t[2], t[3]], i === 1 ? C.freshVat : i === 2 ? C.teal : C.indigo, i === 1 ? 0.28 : i === 0 ? -0.1 : 0.3); }      // four at the indigo house, over the water; the second is the one that lifts green
    for (const [s, d] of plan.dippingBeams.terrace) { const tt = tangent(s); beam(on(s, d), [tt[0], tt[1]], C.violet, 0.25); }
    counts['dipping beams'] = 6;
    build(p, 'dipping beams'); build(cl, 'dipping cloths', { label: false });
  }
  // ---- STAND-IN for `undershot wheel with gears` (Blender kit, 2): 6 m across, 1.6 m wide, its floats in the channel's edge;
  // and its far version (5): the small wheels down the sun road, turned a little toward the lagoon so that they read as wheels
  {
    const p = new Pile(), U = plan.undershot;
    for (const [s, d] of plan.rightTerrace.wheels) {
      const t = tangent(s), c = kit.at(s, d, U.across / 2 - 0.4);
      wheelInto(p, c, U.across / 2, [t[2], 0, t[3]], C.oakWet, 8, U.wide, 12);
      const k = d > 0 ? 1 : -1;
      p.stick(kit.at(s, d + k * 1.2, -1), kit.at(s, d + k * 1.2, U.across / 2 + 0.2), 0.34, C.oak, 4); p.stick(kit.at(s, d - k * 1.1, -1.2), kit.at(s, d - k * 1.1, U.across / 2 - 0.2), 0.3, C.oak, 4);
      wheelInto(p, kit.at(s, d + k * 2.2, U.across / 2 - 0.4), 1.6, [t[2], 0, t[3]], C.oak, 6, 0.3, 0);       // the crown gear
    }
    build(p, 'undershot wheels');
    const f = new Pile();
    for (const [x, z, across] of plan.farWheels) { const k = x < 0 ? 1 : -1; wheelInto(f, new THREE.Vector3(x + k * 1.2, across / 2 - 0.3, z), across / 2, [0.82, 0, k * 0.57], C.oakWet, 8, 0.9, 10); f.stick([x, -1, z - 1.4], [x + k * 1.2, across / 2 - 0.3, z - 0.9], 0.24, C.oak, 4); f.stick([x, -1, z + 1.4], [x + k * 1.2, across / 2 - 0.3, z + 0.9], 0.24, C.oak, 4); }
    build(f, 'far wheels');
  }
  // ---- STAND-IN for `launder and trestle` (Blender kit, 22): a trough on trestles 7.5 m tall along the right bank, s 100 to 236
  {
    const p = new Pile(), Ld = plan.launder;
    let n = 0;
    for (let s = Ld.from; s < Ld.to - 0.1; s += Ld.trestleEvery) {
      const s1 = Math.min(Ld.to, s + Ld.trestleEvery), d0 = hw(s) + Ld.out, d1 = hw(s1) + Ld.out, a = kit.at(s, d0, Ld.height + 0.5), b = kit.at(s1, d1, Ld.height + 0.5);
      p.stick(a, b, 0.62, C.oakWet, 4);
      const g = ground(s, d0);
      for (const k of [-0.9, 0.9]) p.stick(kit.at(s, d0 + k, g), kit.at(s, d0 + k * 0.2, Ld.height + 0.3), 0.24, C.oak, 4);
      p.stick(kit.at(s, d0 - 0.75, g + (Ld.height - g) * 0.45), kit.at(s, d0 + 0.75, g + (Ld.height - g) * 0.45), 0.16, C.oak, 4);
      n++;
    }
    counts['launder trestles'] = n;
    build(p, 'launder');
  }
  // ---- STAND-IN for `boom baulk` (Blender kit): chained baulks 0.4 m thick, floating; a collider every 3 m, 1.3 m behind them
  {
    const p = new Pile(), B = plan.wheel.boom;
    for (let i = 0; i < B.length - 1; i++) {
      const a = new THREE.Vector3(B[i][0], 0.06, B[i][1]), b = new THREE.Vector3(B[i + 1][0], 0.06, B[i + 1][1]), d = b.clone().sub(a), len = d.length(); d.normalize();
      p.stick(a.clone().addScaledVector(d, 0.35), b.clone().addScaledVector(d, -0.35), 0.42, C.oakWet, 7);
      if (i % 2 === 0) p.stick([b.x, -1.2, b.z], [b.x, 1.3, b.z], 0.24, C.oak, 6);                   // a post at every second joint (the swallows' perches)
      const nx = d.z, nz = -d.x, sign = (nx * (W0[0] - a.x) + nz * (W0[2] - a.z)) > 0 ? 1 : -1;      // toward the wheel
      for (let t = 0; t < len; t += 3) ctx.addCollider({ x: a.x + d.x * t + nx * sign * 1.3, z: a.z + d.z * t + nz * sign * 1.3, r: 1.6 });
    }
    counts['boom baulks'] = B.length - 1;
    build(p, 'boom');
  }
  // ---- STAND-IN for `rinsing posts` (Blender kit, 2): three posts 1.5 m out of the water each, in the channel: colliders
  // and the cast's underwater cloth: six streaming bolts 2.2 by 25 m made fast to them, four lost bolts on the bed
  {
    const p = new Pile(), items = [];
    for (const R of plan.rinsing) {
      const c = kit.at(R.at[0], R.at[1]);
      [[0, 0], [0.9, 0.5], [-0.8, 0.6]].forEach(([dx, dz], i) => { p.stick([c.x + dx, -1.6, c.z + dz], [c.x + dx + 0.1, 1.5 - i * 0.15, c.z + dz], 0.28, C.oakWet, 6); items.push({ at: [c.x + dx, -0.25 - i * 0.1, c.z + dz - 0.3], length: 25, width: 2.2, color: dyed(R.dyes[i]), direction: [0, 0, -1] }); });
      ctx.addCollider({ x: c.x, z: c.z + 0.3, r: R.collide });
    }
    build(p, 'rinsing posts');
    for (const [s, d] of plan.lostBolts) { const q = kit.at(s, d, -0.95); items.push({ at: [q.x, q.y, q.z], length: 9, width: 2.2, color: dyed(s < 70 ? SAFFRON : s < 100 ? CRIMSON : s < 150 ? MADDER : VIOLET), direction: [0.2, 0, -1] }); }
    for (const it of items) { _a.set(it.color).multiplyScalar(0.55); it.color = '#' + _a.getHexString(); }      // wet, and under a metre of silty water
    const under = makeRibbons(ctx, { kind: 'cloth', items, wind: shared.wind, seed: 77 });
    under.object.name = 'standin:underwater cloth';
    counts['underwater cloth'] = items.length;
  }
  // ---- STAND-IN for `tenter fence` (Blender kit, 28, instanced): 24 by 2 m (1.6 m north of the sun road), in rows every
  // 16 m, cloth stretched broadside to the sun; and the six tenter masts and the four bank masts that fly a silk
  {
    const posts = new Pile(), cloths = new Pile(), T = plan.tenter, R = plan.sunRoad;
    let n = 0;
    for (let i = 0; i < T.rows; i++) {
      const z = T.from - i * T.every;
      for (const side of [-1, 1]) {
        let x0 = side < 0 ? R.x[0] - T.gap : R.x[1] + T.gap, x1 = x0 + side * T.length;
        // North of the sun road the fences stand only far off and stop short of the loft's line (plan.tenter.north): from an
        // eye 1.1 m up a fence 1.6 m tall on the 0.5 m ground hides the low sun unless it is a hundred metres away, and the
        // sun's line from the terraces and the loft (world x 21 to 37) must stay open
        if (side > 0) { if (z > T.north.from) continue; x1 = Math.min(x1, T.north.to); }
        if (Math.abs(x1 - x0) < 6) continue;
        const h = side < 0 ? T.height : T.heightNorth, y0 = side < 0 ? 0.6 : plan.causeway.top, dye = [SAFFRON, MADDER, VIOLET, MADDER, SAFFRON, CRIMSON][(i + (side > 0 ? 2 : 0)) % 6];
        for (let x = x0; side * (x - x1) <= 0.01; x += side * 3) posts.stick([x, y0, z], [x, y0 + h + 0.15, z], 0.1, C.oak, 4);
        const g = new THREE.BoxGeometry(Math.abs(x1 - x0), h - 0.35, 0.04); g.translate((x0 + x1) / 2, y0 + 0.3 + (h - 0.35) / 2, z);
        cloths.geo(g, dyed(dye)); n++;
      }
    }
    for (const [x, z] of T.masts) posts.stick([x, 0.5, z], [x, T.mast, z], [0.3, 0.18], C.oak, 6);
    for (const [s, d, h] of plan.silkMasts) posts.stick(on(s, d), kit.at(s, d, h), [0.4, 0.24], C.oak, 6);
    counts['tenter fences'] = n;
    build(posts, 'tenter posts and silk masts');
    const mat = kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.5, backlight: 0.9, side: THREE.DoubleSide });
    const mesh = cloths.build(ctx, 'tenter fences', { material: mat });
    if (sun && mesh) sun.drape({ material: mat, object: mesh });
  }
  // ---- STAND-IN for `chimney` (Blender kit): 30 m, octagonal, 3.2 m at the base, a darker cap
  {
    const p = new Pile(), K = plan.chimney;
    p.cyl([K.at[0], 0.4, K.at[1]], [K.base, K.height - 1.2, K.base * 0.62], C.brick, 8); p.cyl([K.at[0], 0.4 + K.height - 1.2, K.at[1]], [K.base * 0.7, 1.2, K.base * 0.7], C.oakWet, 8);
    build(p, 'chimney');
  }
  // ---- STAND-IN for `props` (Blender kit, about 120 instanced: baskets, cloth stacks, ladders, barrow, bucket, peg bag...)
  // and `mud nest cluster` (10). A scatter of small solids on the steps, the quay, the pier, the gallery and the loft's walk.
  {
    const p = new Pile(), W = plan.wheel, H = plan.indigoHouse;
    const prop = (f, kind) => {
      if (kind === 0) p.cyl(f, [0.7, 0.5, 0.9], '#7A5A4A', 8);                                         // a basket
      else if (kind === 1) p.box(f, [0.9, 0.3 + rnd() * 0.7, 0.6], dyed([CREAM, SAFFRON, MADDER, CRIMSON, VIOLET, INDIGO][Math.floor(rnd() * 6)]), rnd() * 3);      // a stack of folded cloth under a board
      else if (kind === 2) { p.stick([f.x - 0.25, f.y, f.z], [f.x - 0.25 + 0.5, f.y + 3.2, f.z + 0.7], 0.07, C.oak, 4); p.stick([f.x + 0.25, f.y, f.z], [f.x + 0.25 + 0.5, f.y + 3.2, f.z + 0.7], 0.07, C.oak, 4); }      // a ladder
      else p.box(f, [0.7, 0.55, 1.3], '#6A4A48', rnd() * 3);                                            // a barrow
    };
    let n = 0;
    for (const side of [-1, 1]) for (let s = 30; s < 92; s += 5.5) { const b = shared.reach ? shared.reach.bank(side, s) : null; if (!b) continue; const st = n % 3; prop(kit.at(s + rnd() * 2, side * (hw(s) + b.out[st] + 0.9 + rnd() * 2.4), b.y[st]), n % 4); n++; }
    for (let s = 98; s < 128; s += 4) { const b = shared.reach.bank(1, s), st = n % 3; prop(kit.at(s, hw(s) + b.out[st] + 0.8 + rnd() * 2, b.y[st]), n % 4); n++; }
    for (let i = 0; i < 12; i++) { prop(kit.at(H.at[0] - 12 + i * 2.2, H.at[1] - 5 + rnd() * 9, H.floor), n % 4); n++; }
    for (let i = 0; i < 8; i++) { prop(new THREE.Vector3(W.pier.x[0] + 3 + i * 4.1, W.pier.top, W.pier.z[i % 2] + (i % 2 ? 0.9 : -0.9)), n % 4); n++; }
    for (let s = 213; s < 240; s += 3) { const b = shared.reach.bank(1, s), st = n % 3; prop(kit.at(s, hw(s) + b.out[st] + 0.8 + rnd() * 2, b.y[st]), n % 4); n++; }
    for (let s = 214; s < 238; s += 4.5) { prop(kit.at(s, -(hw(s) + 1.4 + rnd() * 3), plan.causeway.top), n % 4); n++; }
    if (shared.gallery) for (let i = 0; i < 9; i++) { prop(shared.gallery.frame(-17 + i * 4.2, 0.8 + rnd(), shared.gallery.floor), n % 4); n++; }
    counts.props = n;
    build(p, 'props', { label: false });
    const m = new Pile();
    for (let i = 0; i < 8; i++) m.cyl(kit.at(H.at[0] - 12 + i * 3.4, H.at[1] + H.size[1] / 2 + 0.5, H.eaves - 0.55), [0.5, 0.4, 0.3], '#6A5048', 6);      // under the indigo house's eaves
    for (const d of [-3.1, 4.4]) m.cyl(kit.at(plan.loft.from, d, plan.loft.tie - 0.5), [0.5, 0.4, 0.3], '#6A5048', 6);                               // on the loft's first beam
    counts['mud nests'] = 10;
    build(m, 'mud nests', { label: false });
  }

  ctx.state.counts = counts;
  if (QS.has('counts')) fetch('/__shot/reach_counts.json', { method: 'POST', body: JSON.stringify(counts, null, 1) }).catch(() => {});      // &counts=1: what was grown, to .shots/reach_counts.json
  shared.kit = { counts, dyed, across, build };
  return {};
}
