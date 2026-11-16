// Merge puzzle: polyhedra sit on a tray. Slide one in a direction and it glides until blocked.
// If it bumps into an identical solid the two fuse into the next solid in the ladder.
// Goal: fuse everything into a single piece.
export const TIERS = [null, 'Tetrahedron', 'Cube', 'Octahedron', 'Dodecahedron', 'Icosahedron', 'Sphere'];
export const TIER_COLORS = [null, '#d9792b', '#2f8f9c', '#c9a227', '#7c58a6', '#c8473c', '#e9e2cf'];
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Returns { pieces, moved: {from,to,merged} } or null if the move does nothing.
export function slide(board, pieces, idx, dir) {
  const [dx, dy] = DIRS[dir];
  const p = pieces[idx];
  let x = p.x, y = p.y;
  const blocked = (cx, cy) => cx < 0 || cy < 0 || cx >= board.w || cy >= board.h || board.walls.some((w) => w[0] === cx && w[1] === cy);
  for (;;) {
    const nx = x + dx, ny = y + dy;
    if (blocked(nx, ny)) break;
    const hit = pieces.findIndex((q) => q.x === nx && q.y === ny);
    if (hit >= 0) {
      const q = pieces[hit];
      if (q.t === p.t && p.t < 6) {
        const next = pieces.filter((_, i) => i !== idx && i !== hit);
        next.push({ x: nx, y: ny, t: p.t + 1 });
        return { pieces: next, from: [p.x, p.y], to: [nx, ny], merged: true };
      }
      break;
    }
    x = nx; y = ny;
  }
  if (x === p.x && y === p.y) return null;
  const next = pieces.map((q, i) => (i === idx ? { x, y, t: p.t } : { x: q.x, y: q.y, t: q.t }));
  return { pieces: next, from: [p.x, p.y], to: [x, y], merged: false };
}

// Breadth-first search over compact states. Returns the shortest list of moves [{x,y,dir}] or null.
export function solveMerge(board, pieces, limit = 20000) {
  if (pieces.length === 1) return [];
  const W = board.w, H = board.h, wall = new Uint8Array(W * H);
  for (const w of board.walls) wall[w[0] + w[1] * W] = 1;
  const DL = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
  const start = pieces.map((p) => (p.x + p.y * W) * 8 + p.t).sort((a, b) => a - b);
  const key = (st) => String.fromCharCode(...st);
  const seen = new Map([[key(start), null]]);
  const grid = new Int8Array(W * H);
  let frontier = [start];
  while (frontier.length && seen.size < limit) {
    const next = [];
    for (const st of frontier) {
      grid.fill(0);
      for (const c of st) grid[c >> 3] = c & 7;
      const sk = key(st);
      for (let i = 0; i < st.length; i++) {
        const cell = st[i] >> 3, t = st[i] & 7, x0 = cell % W, y0 = (cell / W) | 0;
        for (const [dir, dx, dy] of DL) {
          let x = x0, y = y0, merged = -1;
          for (;;) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H || wall[nx + ny * W]) break;
            const g = grid[nx + ny * W];
            if (g) { if (g === t && t < 6) merged = nx + ny * W; break; }
            x = nx; y = ny;
          }
          if (merged < 0 && x === x0 && y === y0) continue;
          const ns = [];
          for (let j = 0; j < st.length; j++) { if (j === i) continue; if (merged >= 0 && st[j] >> 3 === merged) continue; ns.push(st[j]); }
          ns.push(merged >= 0 ? merged * 8 + t + 1 : (x + y * W) * 8 + t);
          ns.sort((a, b) => a - b);
          const k = key(ns);
          if (seen.has(k)) continue;
          seen.set(k, { prev: sk, move: { x: x0, y: y0, dir } });
          if (ns.length === 1) {
            const moves = [];
            for (let cur = k; seen.get(cur); cur = seen.get(cur).prev) moves.unshift(seen.get(cur).move);
            return moves;
          }
          next.push(ns);
        }
      }
    }
    frontier = next;
  }
  return null;
}

// level 0..2 → progressively larger ladders and more pieces.
export function genMerge(rng, level = 1, nSockets = 1) {
  const cfg = [{ target: 3, n: [3, 4], w: 4, h: 4, walls: [0, 1], min: 4 }, { target: 4, n: [4, 5], w: 4, h: 4, walls: [1, 2], min: 6 }, { target: 4, n: [5, 6], w: 5, h: 4, walls: [1, 3], min: 7 }][level];
  let best = null;
  for (let tries = 0; tries < 24; tries++) {
    // split the target into n pieces
    const tiers = [cfg.target];
    const n = rng.int(cfg.n[0], cfg.n[1]);
    while (tiers.length < n) {
      const splittable = tiers.map((t, i) => (t > 1 ? i : -1)).filter((i) => i >= 0);
      if (!splittable.length) break;
      const i = rng.pick(splittable);
      tiers.splice(i, 1, tiers[i] - 1, tiers[i] - 1);
    }
    const cells = [];
    for (let y = 0; y < cfg.h; y++) for (let x = 0; x < cfg.w; x++) cells.push([x, y]);
    const sh = rng.shuffle(cells);
    const walls = sh.splice(0, rng.int(cfg.walls[0], cfg.walls[1]));
    const pieces = tiers.map((t, i) => ({ x: sh[i][0], y: sh[i][1], t }));
    const board = { w: cfg.w, h: cfg.h, walls };
    const sol = solveMerge(board, pieces, 5000);
    if (!sol) continue;
    if (!best || sol.length > best.par) best = { ...board, pieces, target: cfg.target, par: sol.length };
    if (best.par >= cfg.min) break;
  }
  if (!best) return null;
  // the lowest-tier pieces are the ones the player has to find around the room
  const order = best.pieces.map((p, i) => i).sort((a, b) => best.pieces[a].t - best.pieces[b].t);
  for (const i of order.slice(0, Math.min(nSockets, best.pieces.length - 1))) best.pieces[i].s = 1;
  return best;
}
