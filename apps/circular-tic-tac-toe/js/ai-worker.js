/* Runs the AI off the main thread so the UI stays responsive while it thinks. */
importScripts('book.js', 'engine.js');
var searcher = new CTTT.Searcher(21);   // heuristic play
var prover = new CTTT.Searcher(21);     // forced-win proofs (Master)
onmessage = function (ev) {
  var d = ev.data;
  var res = CTTT.chooseMove(d.level, d.me, d.opp, searcher, prover);
  postMessage({ id: d.id, move: res.move, score: res.score, nodes: res.nodes, proven: !!res.proven, book: !!res.book });
};
