/*
 * Circular Tic Tac Toe - rules + AI engine.
 * Plain script (no modules) so it can be loaded both by the page and by a Web Worker.
 * Everything is exported on the global `CTTT` object (see the bottom of the file).
 *
 * BOARD
 *   4 rings x 8 sectors = 32 cells. cell = ring * 8 + sector, ring 0 is the centre.
 *   Geometrically the board is a 4 x 8 grid whose long side wraps around (a cylinder):
 *     - "half ring" = 4 horizontal neighbours (with wrap-around)   -> 4 rings x 8 starts = 32 lines
 *     - "line"      = one full column (all 4 rings of a sector)    -> 8 lines
 *     - "spiral"    = a diagonal, one sector over per ring         -> 8 left + 8 right = 16 lines
 *   56 winning lines in total; every cell lies on exactly 7 of them.
 *
 * REPRESENTATION
 *   Because there are exactly 32 cells, one player's stones fit in a single 32-bit integer
 *   (bit c set = stone on cell c). A position is two such "bitboards". Each winning line is a
 *   4-bit mask, so "has this player completed line L?" is `(stones & L) === L` - one AND.
 *   Throughout the search the two boards are passed as (me, opp): `me` is always the side to move.
 *
 * AI IN ONE PARAGRAPH
 *   Searcher.search() is a negamax alpha-beta search with a transposition table. Forced moves
 *   (blocking a three) are searched for free and threat-making moves are cheap, so forcing
 *   sequences are followed very deeply. Searcher.bestMove() wraps it in iterative deepening with a
 *   heuristic evaluation (used by Medium / Hard and as Master's fallback). Searcher.prove() runs
 *   the same search with NO heuristics, looking only for forced wins - that is how the game was
 *   solved (first player wins) and how Master plays perfectly, helped by a small opening book
 *   (book.js) for the few positions whose proof is too slow to redo during play.
 */
(function (root) {
  'use strict';

  var RINGS = 4, SECTORS = 8, N = 32;

  // ---------------------------------------------------------------- lines
  var LINE_CELLS = [];   // 56 arrays of 4 cells
  var LINE_KIND = [];    // 'ring' | 'line' | 'spiral'
  var r, s, k, cells;

  for (r = 0; r < RINGS; r++) {           // 32 half rings
    for (s = 0; s < SECTORS; s++) {
      cells = [];
      for (k = 0; k < 4; k++) cells.push(r * 8 + ((s + k) % 8));
      LINE_CELLS.push(cells); LINE_KIND.push('ring');
    }
  }
  for (s = 0; s < SECTORS; s++) {         // 8 lines from the centre
    cells = [];
    for (r = 0; r < RINGS; r++) cells.push(r * 8 + s);
    LINE_CELLS.push(cells); LINE_KIND.push('line');
  }
  for (s = 0; s < SECTORS; s++) {         // 16 spirals
    var a = [], b = [];
    for (r = 0; r < RINGS; r++) {
      a.push(r * 8 + ((s + r) % 8));
      b.push(r * 8 + ((s - r + 8) % 8));
    }
    LINE_CELLS.push(a); LINE_KIND.push('spiral');
    LINE_CELLS.push(b); LINE_KIND.push('spiral');
  }

  var NL = LINE_CELLS.length; // 56
  var LINES = new Int32Array(NL);
  var CELL_LINES = [];
  for (k = 0; k < N; k++) CELL_LINES.push([]);
  for (k = 0; k < NL; k++) {
    var m = 0;
    for (r = 0; r < 4; r++) { m |= (1 << LINE_CELLS[k][r]); CELL_LINES[LINE_CELLS[k][r]].push(k); }
    LINES[k] = m;
  }
  // flat per-cell line masks (7 per cell) for the hot loops
  var CL = new Int32Array(N * 7);
  for (k = 0; k < N; k++) for (r = 0; r < 7; r++) CL[k * 7 + r] = LINES[CELL_LINES[k][r]];

  // ---------------------------------------------------------------- bit helpers
  function pc(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24);
  }
  function ctz(x) { return 31 - Math.clz32(x & -x); }

  /** Bitmask of empty cells where `p` would complete a line. */
  function winCells(p, empty) {
    var res = 0, i, t;
    for (i = 0; i < NL; i++) {
      t = LINES[i] & ~p;
      if ((t & (t - 1)) === 0) res |= t;
    }
    return res & empty;
  }

  /** Index of a completed line for bitboard `p`, or -1. */
  function findWin(p) {
    for (var i = 0; i < NL; i++) if ((p & LINES[i]) === LINES[i]) return i;
    return -1;
  }
  function allWins(p) {
    var out = [];
    for (var i = 0; i < NL; i++) if ((p & LINES[i]) === LINES[i]) out.push(i);
    return out;
  }

  // ---------------------------------------------------------------- search
  /*
   * SCORES are always from the point of view of the side to move.
   *   WIN - ply   : a forced win (sooner is better, so the engine picks the fastest win and,
   *                 when losing, the longest resistance)
   *   |score| > WIN_T  means "proven win/loss"; anything smaller is a heuristic estimate
   *   0           : draw (or "nothing proven" in proof mode)
   */
  var WIN = 10000, WIN_T = 9000, INF = 30000;
  // Transposition-table entry kinds: the stored score is exact, a lower bound, or an upper bound.
  var EXACT = 1, LOWER = 2, UPPER = 3;
  // Heuristic value of a line that only one player occupies, indexed by how many stones they have on it.
  var EVAL_W = [0, 1, 5, 25, 0];
  // Move-ordering bonuses per line through the candidate cell, indexed by stones already on that line.
  // ORD_ME: my stones on a line the opponent has not touched. 2 of mine -> this move makes a three
  //         (a threat); the huge value 1000 doubles as the "is a threat move" flag (score >= 1000).
  // ORD_OP: the opponent's stones on a line I have not touched (playing here spoils it).
  var ORD_ME = [1, 4, 1000, 0, 0];
  var ORD_OP = [0, 3, 14, 0, 0];

  /**
   * Static evaluation for the side to move: every line still winnable by exactly one player
   * scores for that player, weighted by how full it is. Lines containing both colours are dead.
   */
  function evaluate(me, opp) {
    var sc = 0, i, a, b;
    for (i = 0; i < NL; i++) {
      a = LINES[i] & me; b = LINES[i] & opp;
      if (b === 0) sc += EVAL_W[pc(a)];
      else if (a === 0) sc -= EVAL_W[pc(b)];
    }
    return sc + 2;
  }

  /**
   * A search instance: owns a transposition table (TT) of 2^ttBits entries and the search settings.
   *
   * The TT caches results of positions already searched, because the same position is reached
   * through many different move orders. It is a fixed-size hash table stored in parallel typed
   * arrays (no per-entry objects, so no garbage): the full key (kMe, kOpp) is kept to rule out
   * hash collisions, plus the score, the depth it was searched to, the bound kind and the best move.
   * A newer result simply overwrites whatever was in its slot.
   */
  function Searcher(ttBits) {
    this.bits = ttBits || 20;
    var size = 1 << this.bits;
    this.kMe = new Int32Array(size);
    this.kOpp = new Int32Array(size);
    this.tScore = new Int16Array(size);
    this.tDepth = new Int8Array(size);
    this.tFlag = new Uint8Array(size);
    this.tMove = new Int8Array(size);
    this.nodes = 0;
    this.abort = false;
    this.deadline = 0;
    this.useEval = true;
    this.nodeLimit = 0;
    this.tc = 1; this.qc = 2;   // search-depth cost of threat-making / quiet moves
    // per-ply move buffers (avoid allocation)
    this.mv = []; this.ms = [];
    for (var i = 0; i < 40; i++) { this.mv.push(new Int32Array(32)); this.ms.push(new Int32Array(32)); }
  }

  Searcher.prototype.clear = function () { this.tFlag.fill(0); };

  /**
   * Negamax alpha-beta search. Returns the score of the position for the side to move (`me`).
   *
   *   depth       remaining search budget. A quiet move costs `qc`, a threat-making move costs
   *               `tc`, and a forced block costs nothing - so forcing lines extend automatically.
   *   alpha/beta  the window of scores that still matter; anything outside is cut off.
   *   ply         distance from the root (used for "win in N" scores and per-ply buffers).
   *
   * Order of business at each node:
   *   1. I can complete a line           -> win.
   *   2. Board full                      -> draw.
   *   3. Opponent has two winning cells  -> loss (I can only block one).
   *      Opponent has one                -> the block is forced; recurse without spending depth.
   *   4. Out of depth                    -> heuristic evaluate() (or 0 in proof mode).
   *   5. Transposition-table lookup      -> maybe an immediate answer or a tighter window.
   *   6. Generate moves, best-looking first (TT move, then threat makers, then line potential),
   *      search each, keep the best, stop as soon as alpha >= beta, store the result.
   *
   * Soundness: a score beyond WIN_T can only originate from steps 1/3, i.e. from a real
   * four-in-a-row, never from a depth cut-off. So a win/loss score is a proof whatever the depth.
   */
  Searcher.prototype.search = function (me, opp, depth, alpha, beta, ply) {
    if ((++this.nodes & 8191) === 0 && ((this.deadline && Date.now() > this.deadline) || (this.nodeLimit && this.nodes > this.nodeLimit))) this.abort = true;
    if (this.abort) return 0;

    var empty = ~(me | opp);
    if (winCells(me, empty) !== 0) return WIN - ply;
    if (empty === 0) return 0;
    var ow = winCells(opp, empty);
    if (ow !== 0) {
      if ((ow & (ow - 1)) !== 0) return -(WIN - ply - 1);       // two threats: cannot stop both
      return -this.search(opp, me | ow, depth, -beta, -alpha, ply + 1); // forced block (free)
    }
    if (depth <= 0) return this.useEval ? evaluate(me, opp) : 0;

    // ---- transposition table
    var idx = (Math.imul(me, 0x9E3779B1) ^ Math.imul(opp, 0x85EBCA6B) ^ (me >>> 15) ^ (opp >>> 13)) >>> (32 - this.bits);
    var ttMove = -1, f = this.tFlag[idx], sc;
    if (f !== 0 && this.kMe[idx] === me && this.kOpp[idx] === opp) {
      ttMove = this.tMove[idx];
      sc = this.tScore[idx];
      // a proven win/loss is valid at any depth; other scores only if searched at least this deep
      var proven = (sc > WIN_T && f !== UPPER) || (sc < -WIN_T && f !== LOWER);
      if (this.tDepth[idx] >= depth || proven) {
        // win scores are stored relative to the node ("win in N from here"); convert back to root-relative
        if (sc > WIN_T) sc -= ply; else if (sc < -WIN_T) sc += ply;
        if (f === EXACT) return sc;
        if (f === LOWER) { if (sc > alpha) alpha = sc; }
        else if (sc < beta) beta = sc;
        if (alpha >= beta) return sc;
      }
    }

    // ---- generate + order moves
    var mv = this.mv[ply], ms = this.ms[ply], n = 0, e = empty, c, i, j, base, l, a, o, score;
    while (e !== 0) {
      c = 31 - Math.clz32(e & -e); e &= e - 1;
      score = 0; base = c * 7;
      for (i = 0; i < 7; i++) {
        l = CL[base + i]; a = l & me; o = l & opp;
        if (o === 0) score += ORD_ME[pc(a)];
        if (a === 0) score += ORD_OP[pc(o)];
      }
      if (c === ttMove) score += 100000;
      // insertion sort, descending
      j = n++;
      while (j > 0 && ms[j - 1] < score) { ms[j] = ms[j - 1]; mv[j] = mv[j - 1]; j--; }
      ms[j] = score; mv[j] = c;
    }

    var best = -INF, bestMove = -1, a0 = alpha, cost, sm;
    for (i = 0; i < n; i++) {
      c = mv[i];
      sm = ms[i]; if (sm >= 100000) sm -= 100000;
      cost = sm >= 1000 ? this.tc : this.qc;               // threat-making moves are cheaper to search
      sc = -this.search(opp, me | (1 << c), depth - cost, -beta, -alpha, ply + 1);
      if (this.abort) return 0;
      if (sc > best) {
        best = sc; bestMove = c;
        if (sc > alpha) { alpha = sc; if (alpha >= beta) break; }
      }
    }

    this.kMe[idx] = me; this.kOpp[idx] = opp;
    this.tDepth[idx] = depth > 127 ? 127 : depth;
    this.tFlag[idx] = best <= a0 ? UPPER : (best >= beta ? LOWER : EXACT);
    this.tMove[idx] = bestMove;
    this.tScore[idx] = best > WIN_T ? best + ply : (best < -WIN_T ? best - ply : best);
    return best;
  };

  /**
   * Find a move for the side `me`.
   * opts: { maxDepth, timeMs, noise, useEval, onDepth }
   * returns { move, score, depth, nodes, proven }
   */
  Searcher.prototype.bestMove = function (me, opp, opts) {
    opts = opts || {};
    var empty = ~(me | opp);
    var w = winCells(me, empty);
    if (w !== 0) return { move: ctz(w), score: WIN, depth: 0, nodes: 0, proven: true };
    var ow = winCells(opp, empty);
    var forced = (ow !== 0 && (ow & (ow - 1)) === 0) ? ctz(ow) : -1;

    var moves = [], e = empty, c, i, noise = opts.noise || 0;
    while (e !== 0) {
      c = ctz(e); e &= e - 1;
      var score = 0, base = c * 7;
      for (i = 0; i < 7; i++) {
        var l = CL[base + i], a = l & me, o = l & opp;
        if (o === 0) score += ORD_ME[pc(a)];
        if (a === 0) score += ORD_OP[pc(o)];
      }
      moves.push({ c: c, ord: score + Math.random() * (0.9 + noise), threat: score >= 1000 });
    }
    if (ow !== 0 && forced < 0) {             // lost anyway: block one of them
      return { move: ctz(ow), score: -WIN, depth: 0, nodes: 0, proven: true };
    }
    if (forced >= 0) moves = moves.filter(function (mm) { return mm.c === forced; });
    moves.sort(function (x, y) { return y.ord - x.ord; });
    if (moves.length === 1 && !opts.analyse) return { move: moves[0].c, score: 0, depth: 0, nodes: 0, proven: false };

    this.nodes = 0; this.abort = false;
    this.useEval = opts.useEval !== false;
    this.deadline = opts.timeMs ? Date.now() + opts.timeMs : 0;
    var maxDepth = opts.maxDepth || 64;
    var full = 2 * pc(empty) + 2;              // deep enough to reach the end of the game
    var result = { move: moves[0].c, score: 0, depth: 0, nodes: 0, proven: false };

    for (var d = 2; d <= maxDepth; d += 2) {
      var alpha = -INF, best = -INF, bestC = -1;
      for (i = 0; i < moves.length; i++) {
        c = moves[i].c;
        var cost = forced >= 0 ? 0 : (moves[i].threat ? 1 : 2);
        var sc = -this.search(opp, me | (1 << c), d - cost, -INF, -alpha, 1);
        if (this.abort) break;
        if (noise) sc += Math.round((Math.random() - 0.5) * noise);
        moves[i].sc = sc;
        if (sc > best) { best = sc; bestC = c; if (sc > alpha) alpha = sc; }
      }
      if (this.abort) break;
      result = { move: bestC, score: best, depth: d, nodes: this.nodes, proven: Math.abs(best) > WIN_T || d >= full };
      if (opts.onDepth) opts.onDepth(result);
      if (result.proven) break;
      // best first for the next iteration
      moves.sort(function (x, y) { return (y.c === bestC) - (x.c === bestC) || y.sc - x.sc; });
    }
    result.nodes = this.nodes;
    return result;
  };

  /**
   * Proof search: look for a *forced* win for `me` (no heuristics, threat moves are free).
   * opts: { maxBudget (quiet moves allowed), timeMs, nodeLimit }
   * returns { move, budget, nodes } or null if no win was proven within the limits.
   */
  Searcher.prototype.prove = function (me, opp, opts) {
    opts = opts || {};
    var empty = ~(me | opp), w = winCells(me, empty);
    if (w !== 0) return { move: ctz(w), budget: 0, nodes: 0 };
    var ow = winCells(opp, empty);
    if ((ow & (ow - 1)) !== 0) return null;
    var moves = [], e = empty, c, i;
    while (e !== 0) {
      c = ctz(e); e &= e - 1;
      if (ow !== 0 && (ow >>> c & 1) === 0) continue;       // must block
      var score = 0, base = c * 7;
      for (i = 0; i < 7; i++) {
        var l = CL[base + i], a = l & me, o = l & opp;
        if (o === 0) score += ORD_ME[pc(a)];
        if (a === 0) score += ORD_OP[pc(o)];
      }
      moves.push({ c: c, ord: score, cost: (ow !== 0 || score >= 1000) ? 0 : 1 });
    }
    moves.sort(function (x, y) { return y.ord - x.ord; });
    var sTc = this.tc, sQc = this.qc, sEv = this.useEval, found = null;
    this.tc = 0; this.qc = 1; this.useEval = false; this.nodes = 0; this.abort = false;
    this.deadline = opts.timeMs ? Date.now() + opts.timeMs : 0;
    this.nodeLimit = opts.nodeLimit || 0;
    var maxB = opts.maxBudget === undefined ? 12 : opts.maxBudget;
    for (var d = 0; d <= maxB && !found && !this.abort; d++) {
      for (i = 0; i < moves.length; i++) {
        if (d < moves[i].cost) continue;
        var sc = -this.search(opp, me | (1 << moves[i].c), d - moves[i].cost, -INF, -WIN_T, 1);
        if (this.abort) break;
        if (sc > WIN_T) { found = { move: moves[i].c, budget: d }; break; }
      }
    }
    this.tc = sTc; this.qc = sQc; this.useEval = sEv; this.nodeLimit = 0; this.deadline = 0;
    if (found) found.nodes = this.nodes;
    return found;
  };

  // ---------------------------------------------------------------- symmetries (32 of them)
  // rotate the sectors, mirror them, and/or swap inner <-> outer rings: all map win lines to win lines
  var SYM = [], SYM_INV = [];
  (function () {
    for (var inv = 0; inv < 2; inv++) for (var mir = 0; mir < 2; mir++) for (var rot = 0; rot < 8; rot++) {
      var p = new Int8Array(N), q = new Int8Array(N);
      for (var c = 0; c < N; c++) {
        var rr = c >> 3, ss = c & 7;
        var t = (inv ? 3 - rr : rr) * 8 + (((mir ? 8 - ss : ss) + rot) & 7);
        p[c] = t; q[t] = c;
      }
      SYM.push(p); SYM_INV.push(q);
    }
  })();
  function mapBits(perm, bits) {
    var out = 0;
    while (bits !== 0) { out |= 1 << perm[31 - Math.clz32(bits & -bits)]; bits &= bits - 1; }
    return out;
  }
  function bookKey(x, o) { return (x >>> 0).toString(36) + '.' + (o >>> 0).toString(36); }
  /** Smallest symmetric image of a position: { key, g } (g = index of the symmetry used). */
  function canonical(x, o) {
    var bx = 0, bo = 0, bg = -1;
    for (var g = 0; g < SYM.length; g++) {
      var mx = mapBits(SYM[g], x) >>> 0, mo = mapBits(SYM[g], o) >>> 0;
      if (bg < 0 || mx < bx || (mx === bx && mo < bo)) { bx = mx; bo = mo; bg = g; }
    }
    return { key: bookKey(bx, bo), g: bg };
  }
  /** Opening-book move for the side to move, or -1. Book keys are (first player, second player). */
  function bookMove(x, o) {
    var book = root.CTTT_BOOK;
    if (!book) return -1;
    var cn = canonical(x, o), m = book[cn.key];
    return m === undefined ? -1 : SYM_INV[cn.g][m];
  }

  // ---------------------------------------------------------------- difficulty levels
  // maxDepth: search budget (see Searcher.search), timeMs: time limit for the heuristic search,
  // noise: random jitter added to scores (makes weaker levels less predictable),
  // proveMs: time limit for the forced-win proof search that Master runs first.
  var LEVELS = {
    easy:   { name: 'Easy' },
    medium: { name: 'Medium', maxDepth: 2, noise: 6 },
    hard:   { name: 'Hard', maxDepth: 6, timeMs: 1500, noise: 0 },
    master: { name: 'Master', maxDepth: 64, timeMs: 2500, noise: 0, proveMs: 4000 },
    hint:   { name: 'Hint', maxDepth: 64, timeMs: 1200, noise: 0, proveMs: 1500 }     // Master's brain, shorter clock
  };

  function randomBit(mask) {
    var n = pc(mask), k = Math.floor(Math.random() * n);
    while (k-- > 0) mask &= mask - 1;
    return ctz(mask);
  }

  /**
   * Pick a move for `me` at the given level.
   * `searcher` (heuristic play) and `prover` (forced-win proofs) are reused between calls.
   */
  function chooseMove(level, me, opp, searcher, prover) {
    var empty = ~(me | opp);
    if (level === 'easy') {
      var w = winCells(me, empty), ow = winCells(opp, empty);
      if (w !== 0 && Math.random() < 0.8) return { move: randomBit(w) };
      if (ow !== 0 && Math.random() < 0.5) return { move: randomBit(ow) };
      return { move: randomBit(empty) };
    }
    var cfg = LEVELS[level] || LEVELS.master;
    if (level === 'master' || level === 'hint') {
      // The game is a proven first-player win starting from the innermost (or, by symmetry, outermost) ring.
      if ((me | opp) === 0) return { move: (Math.random() < 0.5 ? 0 : 24) + Math.floor(Math.random() * 8), proven: true };
      var first = pc(me) === pc(opp);           // am I the first player (X)?
      var bm = first ? bookMove(me, opp) : -1;
      if (bm >= 0 && (empty >>> bm & 1)) return { move: bm, proven: true, book: true };
      var pr = (prover || searcher).prove(me, opp, { timeMs: cfg.proveMs });
      if (pr) return { move: pr.move, proven: true, score: WIN, nodes: pr.nodes };
    }
    return searcher.bestMove(me, opp, cfg);
  }

  root.CTTT = {
    RINGS: RINGS, SECTORS: SECTORS, N: N,
    LINES: LINES, LINE_CELLS: LINE_CELLS, LINE_KIND: LINE_KIND, CELL_LINES: CELL_LINES,
    WIN: WIN, WIN_T: WIN_T, SYM: SYM, SYM_INV: SYM_INV,
    pc: pc, ctz: ctz, winCells: winCells, findWin: findWin, allWins: allWins,
    mapBits: mapBits, canonical: canonical, bookKey: bookKey, bookMove: bookMove,
    evaluate: evaluate, Searcher: Searcher, LEVELS: LEVELS, chooseMove: chooseMove
  };
})(typeof self !== 'undefined' ? self : this);
