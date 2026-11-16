/*
 * Circular Tic Tac Toe - user interface.
 *
 * This file owns everything the player sees and touches. The rules and the AI live in
 * engine.js (window.CTTT); sound effects live in audio.js (window.Sfx).
 *
 * HOW IT FITS TOGETHER
 *
 *   state (G)  --recompute()-->  bitboards / winner  --render()-->  SVG + panels
 *        ^                                                              |
 *        +---- play() / undo() / redo() / newGame()  <---- clicks, keys -+
 *
 * - STATE. A game is just the list of moves played (G.moves) plus a pointer into it (G.ptr).
 *   Everything else (who is to move, the two bitboards, the winner) is derived from those two
 *   by recompute(). That makes undo/redo trivial: move the pointer and recompute.
 * - BOARD. One <svg> with a 200x200 viewBox centred on (0,0). Each of the 32 cells is an
 *   annular-sector <path>; marks, the win line, hover ghosts and hints are drawn in layers above.
 * - AI. Moves (and hints) are requested from a Web Worker (ai-worker.js) so the page stays
 *   responsive while the engine thinks. If workers are unavailable (file://) the engine runs
 *   on the main thread instead. Every request carries an id; a reply whose id is no longer
 *   current (because the player hit undo, new game, ...) is ignored.
 * - SCREENS. Menu, setup and game are three <main> elements; show() toggles which is active.
 *   Help, settings and the confirm dialog are modals layered on top.
 * - SETTINGS. Theme, light/dark mode, sound, difficulty and side are saved in localStorage.
 */
(function () {
  'use strict';
  var E = window.CTTT, Sfx = window.Sfx;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // ====================================================================== geometry
  // All numbers are in SVG user units (the board is a circle of radius 90 in a 200x200 box).
  var R = [0, 24, 46, 68, 90];        // ring boundaries: ring i lies between R[i] and R[i+1]
  var MID = [16, 35, 57, 79];         // radius at which a ring's marks are centred
  var MARK = [3.2, 4.6, 5.2, 5.6];    // half-size of an X per ring (sized to stay inside the cell)

  /**
   * Polar -> SVG coordinates. Angles are in degrees, counter-clockwise from the +x axis
   * (maths convention); SVG's y axis points down, hence the minus sign.
   */
  function pt(radius, deg) {
    var a = deg * Math.PI / 180;
    return [+(radius * Math.cos(a)).toFixed(3), +(-radius * Math.sin(a)).toFixed(3)];
  }
  /** Mid-angle of a cell. Sector s spans (-90 + 45s)..(-90 + 45(s+1)) degrees, so cell 0 sits at the bottom. */
  function cellAngle(c) { return -90 + 45 * (c & 7) + 22.5; }
  /** Centre point of cell c (cell = ring * 8 + sector). */
  function cellCenter(c) { return pt(MID[c >> 3], cellAngle(c)); }
  /** SVG path for the annular sector of cell c (a pie wedge for the innermost ring). */
  function cellPath(c) {
    var ring = c >> 3, s = c & 7, a0 = -90 + 45 * s, a1 = a0 + 45;
    var ri = R[ring], ro = R[ring + 1];
    var o0 = pt(ro, a0), o1 = pt(ro, a1);
    if (ri === 0) return 'M0 0L' + o0 + 'A' + ro + ' ' + ro + ' 0 0 0 ' + o1 + 'Z';
    var i0 = pt(ri, a0), i1 = pt(ri, a1);
    return 'M' + o0 + 'A' + ro + ' ' + ro + ' 0 0 0 ' + o1 + 'L' + i1 + 'A' + ri + ' ' + ri + ' 0 0 1 ' + i0 + 'Z';
  }
  /** Path through the four cell centres of win line `li`: an arc for half rings, a polyline otherwise. */
  function linePath(li) {
    var cells = E.LINE_CELLS[li], p = cells.map(cellCenter);
    if (E.LINE_KIND[li] === 'ring') {
      var rad = MID[cells[0] >> 3];
      return 'M' + p[0] + 'A' + rad + ' ' + rad + ' 0 0 0 ' + p[3];
    }
    return 'M' + p[0] + 'L' + p[1] + 'L' + p[2] + 'L' + p[3];
  }
  /** Create an SVG element with attributes, optionally appending it to a parent. */
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  /**
   * Draw an X (player 0) or O (player 1) centred in cell c.
   * The mark is rotated to the cell's own axis so an X always points along/across its ring,
   * which keeps it inside the wedge in every sector.
   */
  function markNode(c, player, parent, extraClass) {
    var ctr = cellCenter(c), h = MARK[c >> 3];
    var g = el('g', {
      'class': 'mark ' + (player ? 'o' : 'x') + (extraClass ? ' ' + extraClass : ''),
      transform: 'translate(' + ctr + ') rotate(' + (-cellAngle(c)) + ')'
    }, parent);
    g.style.setProperty('--sw', (h * 0.44).toFixed(2));          // stroke width scales with the mark
    if (player === 0) {
      el('path', { d: 'M' + (-h) + ' ' + (-h) + 'L' + h + ' ' + h, pathLength: 1 }, g);
      el('path', { d: 'M' + h + ' ' + (-h) + 'L' + (-h) + ' ' + h, pathLength: 1 }, g);
    } else {
      el('circle', { r: (h * 1.1).toFixed(2), pathLength: 1 }, g);
    }
    return g;
  }
  /** Draw the empty board (cells + grid lines) into an <svg>. Returns the 32 cell <path> elements. */
  function drawBoard(svg, interactive) {
    svg.textContent = '';
    var gCells = el('g', { 'class': 'cells' }, svg), cells = [];
    for (var c = 0; c < E.N; c++) {
      // checkerboard shading helps the eye follow rings and sectors
      var p = el('path', { d: cellPath(c), 'class': 'cell' + ((((c >> 3) + (c & 7)) & 1) ? ' shade' : ''), 'data-cell': c }, gCells);
      if (interactive) { p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); }
      cells.push(p);
    }
    var gGrid = el('g', { 'class': 'grid' }, svg);
    for (var i = 1; i <= 4; i++) el('circle', { r: R[i] }, gGrid);
    for (var s = 0; s < 8; s++) { var q = pt(R[4], 45 * s); el('line', { x1: 0, y1: 0, x2: q[0], y2: q[1] }, gGrid); }
    return cells;
  }

  // ====================================================================== settings + state
  var LEVEL_DESC = {
    easy: 'Plays mostly at random and often misses threats. Good for learning the patterns.',
    medium: 'Always takes a win and blocks a three, but only plans one move ahead.',
    hard: 'Looks several moves ahead and sets up double threats.',
    master: 'Perfect play. Unbeatable when it moves first; if you move first a win exists, but one slip and it is gone.'
  };
  var THEMES = ['chalk', 'neon', 'sunset'];

  /** localStorage wrapper that never throws (private browsing, blocked storage, ...). */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('cttt.' + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('cttt.' + k, v); } catch (e) {} }
  };

  var prefs = {
    theme: THEMES.indexOf(store.get('theme', '')) >= 0 ? store.get('theme', '') : 'chalk',
    mode: store.get('mode', 'system')      // 'system' | 'light' | 'dark'
  };

  /** The whole game state. Only moves/ptr (and the mode settings) are primary; the rest is derived. */
  var G = {
    mode: 'single',                         // 'single' (vs computer) | 'two' (hot-seat)
    level: store.get('level', 'medium'),
    sidePref: store.get('side', 'x'),       // 'x' | 'o' | 'random'
    human: 0,                               // single-player: which side the human plays (0 = X, 1 = O)
    moves: [], ptr: 0,                      // history and the undo/redo position inside it
    x: 0, o: 0,                             // bitboards (derived)
    over: false, winner: -1, winLines: [],  // result (derived)
    thinking: false,                        // the computer is choosing its move
    hinting: false, hint: -1,               // a hint is being computed / the cell being suggested
    scored: null,                           // which result ('x'|'o'|'d') this game has added to the scoreboard
    scores: { x: 0, o: 0, d: 0 }
  };

  var boardSvg = $('#board'), cellEls, gMarks, gWin, gGhost, gHint, gLast, marks = {};
  var worker = null, workerBusy = false, localSearcher = null, localProver = null;
  var reqId = 0, reqKind = '', reqStart = 0, resultTimer = 0;

  /** Whose turn it is: 0 = X, 1 = O. X always moves first, so it is just the parity of the move count. */
  function turn() { return G.ptr & 1; }
  /** True when a human may place a mark right now. */
  function isHumanTurn() { return !G.over && !G.thinking && (G.mode === 'two' || turn() === G.human); }
  /** True while a game is under way (something would be lost by abandoning it). */
  function inProgress() { return G.ptr > 0 && !G.over; }

  /** Rebuild all derived state from G.moves[0..G.ptr) and keep the scoreboard in sync. */
  function recompute() {
    G.x = 0; G.o = 0;
    for (var i = 0; i < G.ptr; i++) { if (i & 1) G.o |= (1 << G.moves[i]); else G.x |= (1 << G.moves[i]); }
    var wx = E.allWins(G.x), wo = E.allWins(G.o);
    G.winLines = wx.concat(wo);
    G.winner = wx.length ? 0 : (wo.length ? 1 : -1);
    G.over = G.winner >= 0 || G.ptr === E.N;
    // A finished game counts once. Undoing out of a finished position takes the point back,
    // redoing into it gives the point again - so the scoreboard always matches what is on screen.
    var res = !G.over ? null : (G.winner === 0 ? 'x' : (G.winner === 1 ? 'o' : 'd'));
    if (res !== G.scored) {
      if (G.scored) G.scores[G.scored]--;
      if (res) G.scores[res]++;
      G.scored = res;
    }
  }

  // ====================================================================== rendering
  function playerName(p) {
    if (G.mode === 'two') return p === 0 ? 'Player 1' : 'Player 2';
    return p === G.human ? 'You' : 'Computer';
  }

  /**
   * Bring the DOM in line with the state. Marks are diffed (only added/removed where the board
   * changed) so existing marks do not re-animate; `animateLast` draws the newest one with a stroke animation.
   */
  function render(animateLast) {
    var c;
    for (c = 0; c < E.N; c++) {
      var want = (G.x >>> c) & 1 ? 0 : ((G.o >>> c) & 1 ? 1 : -1);
      var have = marks[c];
      if (have && have.player !== want) { have.node.remove(); delete marks[c]; have = null; }
      if (!have && want >= 0) {
        marks[c] = { player: want, node: markNode(c, want, gMarks, animateLast && G.moves[G.ptr - 1] === c ? 'pop' : '') };
      }
      cellEls[c].classList.toggle('taken', want >= 0);
      cellEls[c].classList.toggle('hint', G.hint === c);
      cellEls[c].setAttribute('aria-label', 'Ring ' + ((c >> 3) + 1) + ', sector ' + ((c & 7) + 1) + ', ' + (want < 0 ? 'empty' : (want ? 'O' : 'X')));
    }

    // thin ring around the most recent move
    gLast.textContent = '';
    if (G.ptr > 0 && !G.over) {
      var lc = G.moves[G.ptr - 1], lp = cellCenter(lc);
      el('circle', { cx: lp[0], cy: lp[1], r: (MARK[lc >> 3] * 1.68).toFixed(2), 'class': 'last-ring' }, gLast);
    }

    // hint: dashed ring + translucent mark on the suggested cell
    gHint.textContent = '';
    if (G.hint >= 0) {
      var hp = cellCenter(G.hint);
      el('circle', { cx: hp[0], cy: hp[1], r: (MARK[G.hint >> 3] * 1.68).toFixed(2), 'class': 'hint-ring' }, gHint);
      markNode(G.hint, turn(), gHint, 'ghost');
    }

    // winning line(s)
    gWin.textContent = '';
    var winCells = {};
    G.winLines.forEach(function (li) {
      E.LINE_CELLS[li].forEach(function (k) { winCells[k] = 1; });
      el('path', { d: linePath(li), 'class': 'winline', pathLength: 1 }, gWin);
    });
    for (c = 0; c < E.N; c++) {
      cellEls[c].classList.toggle('win', !!winCells[c]);
      if (marks[c]) marks[c].node.classList.toggle('dim', G.winner >= 0 && !winCells[c]);
    }

    boardSvg.classList.toggle('locked', !isHumanTurn());
    boardSvg.classList.toggle('turn-o', turn() === 1);
    boardSvg.classList.toggle('over', G.over);
    if (!isHumanTurn()) gGhost.textContent = '';

    // player panels + scoreboard
    $('#name-x').textContent = playerName(0);
    $('#name-o').textContent = playerName(1);
    $('#score-x').textContent = G.scores.x;
    $('#score-o').textContent = G.scores.o;
    $('#score-d').textContent = G.scores.d;
    $('#card-x').classList.toggle('active', !G.over && turn() === 0);
    $('#card-o').classList.toggle('active', !G.over && turn() === 1);
    $('#card-x').classList.toggle('winner', G.winner === 0);
    $('#card-o').classList.toggle('winner', G.winner === 1);

    // status line
    var st = $('#status');
    if (G.over) {
      st.textContent = G.winner < 0 ? 'Draw' : (playerName(G.winner) === 'You' ? 'You win!' : playerName(G.winner) + ' wins!');
    } else if (G.thinking) {
      st.innerHTML = '<span class="spinner"></span>Computer is thinking<span class="dots"><i>.</i><i>.</i><i>.</i></span>';
    } else if (G.hinting) {
      st.innerHTML = '<span class="spinner"></span>Finding the best move<span class="dots"><i>.</i><i>.</i><i>.</i></span>';
    } else if (G.mode === 'single') {
      st.innerHTML = 'Your turn &mdash; you are <b class="' + (G.human ? 'co">O' : 'cx">X') + '</b>';
    } else {
      st.innerHTML = playerName(turn()) + '&rsquo;s turn (<b class="' + (turn() ? 'co">O' : 'cx">X') + '</b>)';
    }

    $('#btn-undo').disabled = !canUndo();
    $('#btn-redo').disabled = !canRedo();
    $('#btn-hint').disabled = !isHumanTurn() || G.hinting;
    $('#game-title').textContent = G.mode === 'two' ? 'Two players' : E.LEVELS[G.level].name;
  }

  /** Show (after a short pause, so the win animation is seen first) or hide the result card. */
  function showResult() {
    clearTimeout(resultTimer);
    var box = $('#result');
    if (!G.over) { box.hidden = true; $('.controls').hidden = false; return; }
    var kind = G.winner >= 0 ? E.LINE_KIND[G.winLines[0]] : '';
    var how = { ring: 'a half ring', line: 'a line from the centre', spiral: 'a spiral' }[kind];
    var txt, sub;
    if (G.winner < 0) { txt = 'It’s a draw'; sub = 'The board is full and nobody made four in a row.'; }
    else if (G.mode === 'single' && G.winner === G.human) { txt = 'You win!'; sub = 'Four in a row with ' + how + '.'; }
    else if (G.mode === 'single') { txt = 'Computer wins'; sub = 'It completed ' + how + '. Undo to try another move.'; }
    else { txt = playerName(G.winner) + ' wins!'; sub = 'Four in a row with ' + how + '.'; }
    $('#result-text').textContent = txt;
    $('#result-text').className = 'result-text ' + (G.winner < 0 ? '' : (G.winner ? 'co' : 'cx'));
    $('#result-sub').textContent = sub;
    resultTimer = setTimeout(function () { box.hidden = false; $('.controls').hidden = true; }, 700);
  }

  function endEffects() {
    if (G.winner < 0) Sfx.play('draw');
    else if (G.mode === 'single' && G.winner !== G.human) Sfx.play('lose');
    else { Sfx.play('win'); confetti(); }
  }

  // ====================================================================== moves, undo, redo
  /** Place a mark for the side to move on cell c. Used for both human and computer moves. */
  function play(c, fromAI) {
    if (G.over || ((G.x | G.o) >>> c) & 1) { if (!fromAI) Sfx.play('error'); return; }
    cancelAI();                      // drops a pending hint request, if any
    G.hint = -1;
    G.moves.length = G.ptr;          // a new move discards the redo branch
    G.moves.push(c); G.ptr++;
    Sfx.play(turn() === 1 ? 'placeX' : 'placeO');
    recompute();
    render(true);
    if (G.over) { endEffects(); showResult(); }
    else maybeAI();
  }

  /** How many of the first `ptr` moves were made by a human. */
  function humanMovesBefore(ptr) {
    if (G.mode === 'two') return ptr;
    return G.human === 0 ? (ptr + 1) >> 1 : ptr >> 1;
  }
  function canUndo() { return humanMovesBefore(G.ptr) > 0; }
  function canRedo() { return G.ptr < G.moves.length; }

  /**
   * Undo. Two players: one move. Single player: back to the human's previous turn, i.e. the
   * computer's reply is taken back too (or just the human's move if the computer is still thinking).
   */
  function undo() {
    if (!canUndo()) return;
    cancelAI(); G.hint = -1;
    if (G.mode === 'two') G.ptr--;
    else { do { G.ptr--; } while (G.ptr > 0 && (G.ptr & 1) !== G.human); }
    Sfx.play('undo');
    recompute(); render(false); showResult();
    maybeAI();                       // only fires if the human plays O and everything was undone
  }
  /** Redo, mirroring undo(): single player replays the human's move and the computer's stored reply. */
  function redo() {
    if (!canRedo()) return;
    cancelAI(); G.hint = -1;
    G.ptr++;
    if (G.mode === 'single') {
      recompute();
      while (!G.over && G.ptr < G.moves.length && (G.ptr & 1) !== G.human) { G.ptr++; recompute(); }
    }
    Sfx.play('redo');
    recompute(); render(false); showResult();
    maybeAI();                       // if the redo stack ran out on the computer's turn, let it think
  }

  function newGame() {
    cancelAI(); G.hint = -1;
    if (G.mode === 'single') G.human = G.sidePref === 'random' ? (Math.random() < 0.5 ? 0 : 1) : (G.sidePref === 'o' ? 1 : 0);
    G.moves = []; G.ptr = 0; G.scored = null;
    recompute(); render(false); showResult();
    Sfx.play('start');
    maybeAI();
  }

  // ====================================================================== AI + hints
  /** Lazily create the AI worker. Returns false when workers cannot be used (e.g. file://). */
  function getWorker() {
    if (worker) return worker;
    try {
      worker = new Worker('js/ai-worker.js');
      worker.onmessage = function (ev) { workerBusy = false; onAIResult(ev.data); };
      worker.onerror = function () {           // could not load: fall back to the main thread and retry
        worker = false; workerBusy = false;
        if (G.thinking || G.hinting) requestAI(reqKind);
      };
    } catch (e) { worker = false; }
    return worker;
  }
  /** If it is the computer's turn, start it thinking. */
  function maybeAI() {
    if (G.mode !== 'single' || G.over || turn() === G.human) return;
    G.thinking = true; render(false);
    requestAI('move');
  }
  /** Ask for the best move for the side to move and highlight it. */
  function requestHint() {
    if (!isHumanTurn() || G.hinting) return;
    G.hinting = true; G.hint = -1; render(false);
    requestAI('hint');
  }
  /**
   * Send the current position to the engine. kind = 'move' (computer's turn, at the chosen
   * difficulty) or 'hint' (perfect-play engine with a shorter time limit).
   */
  function requestAI(kind) {
    var id = ++reqId, me = turn() ? G.o : G.x, opp = turn() ? G.x : G.o;
    var level = kind === 'hint' ? 'hint' : G.level;
    reqKind = kind; reqStart = Date.now();
    var w = getWorker();
    if (w) { workerBusy = true; w.postMessage({ id: id, level: level, me: me, opp: opp }); }
    else {
      setTimeout(function () {                 // main-thread fallback; the timeout lets the spinner paint first
        if (id !== reqId) return;
        if (!localSearcher) { localSearcher = new E.Searcher(20); localProver = new E.Searcher(20); }
        var res = E.chooseMove(level, me, opp, localSearcher, localProver);
        onAIResult({ id: id, move: res.move });
      }, 60);
    }
  }
  function onAIResult(d) {
    if (d.id !== reqId) return;                // stale: the position changed while the engine was thinking
    var kind = reqKind;
    // never answer instantly - a short minimum "thinking" time reads better
    var wait = Math.max(0, (kind === 'hint' ? 250 : 600) - (Date.now() - reqStart));
    setTimeout(function () {
      if (d.id !== reqId) return;
      if (kind === 'hint') {
        G.hinting = false; G.hint = d.move;
        Sfx.play('hint'); render(false);
      } else {
        G.thinking = false;
        play(d.move, true);
      }
    }, wait);
  }
  /** Abandon any pending engine request. A busy worker is terminated (a fresh one is made on demand). */
  function cancelAI() {
    reqId++;
    G.thinking = false; G.hinting = false;
    if (worker && workerBusy) { worker.terminate(); worker = null; workerBusy = false; }
  }

  // ====================================================================== board interaction
  function cellOf(target) {
    var v = target && target.getAttribute && target.getAttribute('data-cell');
    return v === null || v === undefined ? -1 : +v;
  }
  var hoverCell = -1;
  /** Show a translucent preview of the current player's mark on the hovered / focused empty cell. */
  function setGhost(c) {
    if (c === hoverCell) return;
    hoverCell = c;
    gGhost.textContent = '';
    if (c >= 0 && c !== G.hint && isHumanTurn() && !(((G.x | G.o) >>> c) & 1)) {
      markNode(c, turn(), gGhost, 'ghost');
      Sfx.play('hover');
    }
  }
  function initBoard() {
    cellEls = drawBoard(boardSvg, true);
    gWin = el('g', {}, boardSvg);        // layers, bottom to top
    gLast = el('g', {}, boardSvg);
    gMarks = el('g', {}, boardSvg);
    gHint = el('g', {}, boardSvg);
    gGhost = el('g', {}, boardSvg);

    boardSvg.addEventListener('click', function (ev) {
      var c = cellOf(ev.target);
      if (c >= 0 && isHumanTurn()) { hoverCell = -1; gGhost.textContent = ''; play(c, false); }
    });
    boardSvg.addEventListener('pointermove', function (ev) { if (ev.pointerType !== 'touch') setGhost(cellOf(ev.target)); });
    boardSvg.addEventListener('pointerleave', function () { setGhost(-1); });
    boardSvg.addEventListener('focusin', function (ev) { if (ev.target.matches(':focus-visible')) setGhost(cellOf(ev.target)); });
    // keyboard play: arrows move around (left/right) and across (up/down) the rings
    boardSvg.addEventListener('keydown', function (ev) {
      var c = cellOf(ev.target); if (c < 0 || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var ring = c >> 3, s = c & 7, k = ev.key;
      if (k === 'Enter' || k === ' ') { ev.preventDefault(); if (isHumanTurn()) play(c, false); return; }
      if (k === 'ArrowLeft') s = (s + 7) & 7;
      else if (k === 'ArrowRight') s = (s + 1) & 7;
      else if (k === 'ArrowUp') ring = Math.min(3, ring + 1);
      else if (k === 'ArrowDown') ring = Math.max(0, ring - 1);
      else return;
      ev.preventDefault();
      cellEls[ring * 8 + s].focus();
    });
  }

  // ====================================================================== themes
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  /** Apply prefs.theme / prefs.mode to <html>. 'system' resolves to the OS light/dark setting. */
  function applyTheme() {
    var root = document.documentElement;
    var mode = prefs.mode === 'light' || prefs.mode === 'dark' ? prefs.mode : (darkQuery && darkQuery.matches ? 'dark' : 'light');
    root.setAttribute('data-theme', prefs.theme);
    root.setAttribute('data-mode', mode);
    var meta = $('meta[name="theme-color"]');      // browser chrome colour follows the theme
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  }
  if (darkQuery) {
    var onSystemChange = function () { if (prefs.mode === 'system') applyTheme(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
  }

  // ====================================================================== screens, modals, menus
  function show(screen) {
    $$('.screen').forEach(function (n) { n.classList.toggle('active', n.id === 'screen-' + screen); });
    if (screen !== 'game') { cancelAI(); clearTimeout(resultTimer); $('#result').hidden = true; $('.controls').hidden = false; }
  }
  /** Reflect a value in a segmented control (radio-style button group). */
  function syncSeg(id, value) {
    $$('#' + id + ' button').forEach(function (b) {
      var on = b.getAttribute('data-value') === value;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    });
  }
  /** Push all settings into the setup screen, settings dialog and sound buttons. */
  function syncUI() {
    syncSeg('seg-level', G.level); syncSeg('seg-side', G.sidePref);
    syncSeg('seg-mode', prefs.mode); syncSeg('seg-sound', Sfx.isEnabled() ? 'on' : 'off');
    $('#level-desc').textContent = LEVEL_DESC[G.level];
    $$('.theme-card').forEach(function (b) {
      var on = b.getAttribute('data-theme') === prefs.theme;
      b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    });
    $$('.sound-toggle').forEach(function (b) {
      b.textContent = Sfx.isEnabled() ? '🔊' : '🔇';
      b.title = (Sfx.isEnabled() ? 'Sound on' : 'Sound off') + ' (Alt+M)';
    });
  }
  function toggleSound() { Sfx.toggle(); syncUI(); }

  var returnFocus = {};
  function openModal(id) {
    var m = $('#' + id);
    returnFocus[id] = document.activeElement;
    m.hidden = false;
    var f = m.querySelector('.primary, .modal-close');
    if (f) f.focus();
  }
  function closeModal(m) {
    m.hidden = true;
    var f = returnFocus[m.id];
    if (f && f.focus && document.contains(f)) f.focus();
  }
  function openModals() { return $$('.modal').filter(function (m) { return !m.hidden; }); }

  /** Ask before doing something that throws the current game away. */
  var confirmFn = null;
  function confirmThen(title, text, okLabel, fn) {
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    $('#confirm-ok').textContent = okLabel;
    confirmFn = fn;
    openModal('confirm');
  }
  function restartClicked() {
    if (inProgress()) confirmThen('Start a new game?', 'The current game will be abandoned.', 'New game', newGame);
    else newGame();
  }
  function menuClicked() {
    if ($('#screen-game').classList.contains('active') && inProgress()) {
      confirmThen('Leave this game?', 'The current game will be abandoned.', 'Leave', function () { show('menu'); });
    } else show('menu');
  }
  function startGame(mode) {
    G.mode = mode; G.scores = { x: 0, o: 0, d: 0 };
    show('game'); newGame();
  }

  /** Every clickable control declares data-action="..."; this table says what each one does. */
  var ACTIONS = {
    single: function () { syncUI(); show('setup'); },
    two: function () { startGame('two'); },
    'start-single': function () { startGame('single'); },
    menu: menuClicked,
    help: function () { openModal('help'); },
    settings: function () { syncUI(); openModal('settings'); },
    'close-modal': function (btn) { closeModal(btn.closest('.modal')); },
    'confirm-ok': function () { closeModal($('#confirm')); var fn = confirmFn; confirmFn = null; if (fn) fn(); },
    sound: toggleSound,
    undo: undo, redo: redo, hint: requestHint, restart: restartClicked
  };
  var SILENT = { undo: 1, redo: 1, restart: 1, 'start-single': 1, two: 1, hint: 1, 'confirm-ok': 1 };   // these make their own sound

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var seg = t.closest && t.closest('.seg button');
    if (seg) {
      var v = seg.getAttribute('data-value'), group = seg.parentNode.id;
      if (group === 'seg-level') { G.level = v; store.set('level', v); }
      else if (group === 'seg-side') { G.sidePref = v; store.set('side', v); }
      else if (group === 'seg-mode') { prefs.mode = v; store.set('mode', v); applyTheme(); }
      else if (group === 'seg-sound') { if ((v === 'on') !== Sfx.isEnabled()) Sfx.toggle(); }
      Sfx.play('click'); syncUI(); return;
    }
    var card = t.closest && t.closest('.theme-card');
    if (card) {
      prefs.theme = card.getAttribute('data-theme'); store.set('theme', prefs.theme);
      applyTheme(); Sfx.play('click'); syncUI(); return;
    }
    var b = t.closest && t.closest('[data-action]');
    if (b && !b.disabled) {
      var a = b.getAttribute('data-action');
      if (!SILENT[a]) Sfx.play('click');
      ACTIONS[a](b);
      return;
    }
    if (t.classList && t.classList.contains('modal')) closeModal(t);   // click on the backdrop
  });
  document.addEventListener('pointerover', function (ev) {
    var b = ev.target.closest && ev.target.closest('.btn, .seg button, .theme-card');
    if (b && !b.disabled && ev.pointerType === 'mouse' && !(ev.relatedTarget && b.contains(ev.relatedTarget))) Sfx.play('hover');
  });

  /*
   * Keyboard shortcuts. Single letters on their own are deliberately NOT used - they fire by
   * accident. Everything needs a modifier:
   *   Ctrl/Cmd+Z undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redo   (the universal convention)
   *   Alt+H hint, Alt+N new game, Alt+M mute                 (ev.code, so any keyboard layout works)
   * Game shortcuts are ignored while a dialog is open; Escape closes the top dialog.
   */
  document.addEventListener('keydown', function (ev) {
    var open = openModals();
    if (ev.key === 'Escape') { if (open.length) closeModal(open[open.length - 1]); return; }
    var mod = ev.ctrlKey || ev.metaKey;
    if (ev.altKey && !mod && !ev.shiftKey && ev.code === 'KeyM') { ev.preventDefault(); toggleSound(); return; }
    if (open.length || !$('#screen-game').classList.contains('active')) return;
    var k = ev.key.toLowerCase();
    if (mod && !ev.altKey && k === 'z' && !ev.shiftKey) { ev.preventDefault(); undo(); }
    else if (mod && !ev.altKey && (k === 'y' || (k === 'z' && ev.shiftKey))) { ev.preventDefault(); redo(); }
    else if (ev.altKey && !mod && !ev.shiftKey && ev.code === 'KeyN') { ev.preventDefault(); restartClicked(); }
    else if (ev.altKey && !mod && !ev.shiftKey && ev.code === 'KeyH') { ev.preventDefault(); requestHint(); }
  });

  // ====================================================================== decorations
  /** The four example diagrams in "How to play". */
  function drawPatterns() {
    var demo = { ring: [16, 17, 18, 19], line: [1, 9, 17, 25], spiralL: [2, 11, 20, 29], spiralR: [2, 9, 16, 31] };
    $$('.mini').forEach(function (svg) {
      drawBoard(svg, false);
      var cells = demo[svg.getAttribute('data-pattern')], g = el('g', {}, svg);
      for (var li = 0; li < E.LINE_CELLS.length; li++) {
        if (E.LINE_CELLS[li].slice().sort().join() === cells.slice().sort().join()) el('path', { d: linePath(li), 'class': 'winline static' }, g);
      }
      cells.forEach(function (c) { var p = cellCenter(c); el('circle', { cx: p[0], cy: p[1], r: 3 + (c >> 3) * 1.6, 'class': 'dot' }, g); });
    });
  }
  /** The animated mini board on the main menu. */
  function drawLogo() {
    var svg = $('#logo-board');
    drawBoard(svg, false);
    var g = el('g', {}, svg);
    [[26, 0], [18, 0], [10, 0], [2, 0], [20, 1], [29, 1], [13, 1], [7, 0], [23, 1], [16, 1]].forEach(function (m, i) {
      markNode(m[0], m[1], g, 'pop').style.animationDelay = (0.25 + i * 0.12) + 's';
    });
    el('path', { d: linePath(32 + 2), 'class': 'winline', pathLength: 1, style: 'animation-delay:1.6s' }, svg);
  }

  /** A short burst of confetti in the current theme's colours (skipped for reduced-motion users). */
  var confettiRAF = 0;
  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var cv = $('#confetti'), c2 = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
    var cs = getComputedStyle(document.documentElement);
    var cols = ['--x', '--o', '--win', '--hint', '--accent'].map(function (v) { return cs.getPropertyValue(v).trim() || '#888'; });
    var ps = [], i, t0 = performance.now();
    for (i = 0; i < 130; i++) ps.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 3,
      s: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length]
    });
    cancelAnimationFrame(confettiRAF);
    (function frame(now) {
      var age = now - t0;
      c2.clearRect(0, 0, W, H);
      if (age > 2600) return;
      c2.globalAlpha = Math.min(1, (2600 - age) / 600);
      ps.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.fillStyle = p.c;
        c2.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c2.restore();
      });
      confettiRAF = requestAnimationFrame(frame);
    })(t0);
  }

  // ====================================================================== boot
  applyTheme();
  initBoard(); drawPatterns(); drawLogo(); syncUI();
  recompute(); render(false);
  getWorker();   // warm up so the first computer move is not delayed by loading the worker

  // Offline support (see sw.js). Service workers need http(s); skipped when opened from file://.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
