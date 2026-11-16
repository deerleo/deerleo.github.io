/* Challenges: timed dialogue battles (pitch, bridge, Sega) and the chip routing puzzle. */
LC.Games = (() => {
  const UI = () => LC.UI;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* o: {title, who, meter, start, pass, rounds:[{q, a:[{t,d,r?}]}], time} ; cb(ok, meter, picks) */
  function battle(o, cb) {
    let m = o.start, r = 0, timer = null, tleft = 0, locked = false;
    const picks = [];
    const react = d => d >= 15 ? 'leans forward, clearly impressed.' : d >= 6 ? 'nods.' : d > 0 ? 'makes a small note.' : d === 0 ? 'says nothing.' : d > -15 ? 'frowns.' : 'glances at the clock.';
    function render() {
      const R = o.rounds[r], opts = LC.Sim.shuffle(R.a.slice());
      tleft = o.time; locked = false;
      UI().show(`<div class="yr">${esc(o.title)} · ${r + 1} / ${o.rounds.length}</div>
        <div class="meter"><span>${o.meter}</span><div class="bar"><i id="bm" style="width:${m}%"></i><em style="left:${o.pass}%"></em></div><b id="bv">${m}</b></div>
        <p class="who">${esc(o.who)}</p><h3 class="q">${esc(R.q)}</h3>
        <div class="tbarq"><i id="bt"></i></div>
        <div class="acts" id="ba">${opts.map((a, i) => `<button class="act" data-i="${i}"><b>${i + 1}.</b> ${esc(a.t)}</button>`).join('')}</div>
        <p class="mut small">Need ${o.pass} to win. Tap or click an answer, or press 1–${opts.length}. Hesitate too long and it counts against you.</p>`,
        { closable: false, keys: e => { const n = parseInt(e.key); if (n >= 1 && n <= opts.length) { choose(opts[n - 1]); return true; } } });
      document.querySelectorAll('#ba [data-i]').forEach(b => b.onclick = () => choose(opts[+b.dataset.i]));
      clearInterval(timer);
      timer = setInterval(() => { if (LC.Sim.get().dead) return clearInterval(timer); tleft -= .1; const bt = document.getElementById('bt'); if (bt) bt.style.width = Math.max(0, tleft / o.time * 100) + '%'; if (tleft <= 0) choose({ t: '(You hesitate too long.)', d: -15 }); }, 100);
    }
    function choose(a) {
      if (locked) return; locked = true; clearInterval(timer);
      picks.push(a); m = Math.max(0, Math.min(100, m + a.d));
      const line = a.r ? a.r : `${o.who.split(',')[0]} ${react(a.d)}`;
      UI().show(`<div class="yr">${esc(o.title)}</div>
        <div class="meter"><span>${o.meter}</span><div class="bar"><i style="width:${m}%"></i><em style="left:${o.pass}%"></em></div><b>${m}</b></div>
        <p class="you">You: ${esc(a.t)}</p><p class="react ${a.d > 0 ? 'good' : a.d < 0 ? 'bad' : ''}">${esc(line)}</p>
        <button id="bn" class="big">${r + 1 < o.rounds.length ? 'Next question' : 'See the outcome'} (Enter)</button>`,
        { closable: false, keys: e => { if (e.key === 'Enter' || e.key === ' ') { next(); return true; } } });
      document.getElementById('bn').onclick = next;
    }
    function next() { r++; if (r < o.rounds.length) render(); else { UI().close(); cb(m >= o.pass, m, picks); } }
    render();
  }

  /* ---------- routing puzzle (Flow-style): connect each pin pair, fill every cell ---------- */
  const COLS = ['#ff4d4d', '#4da3ff', '#ffd24a', '#5ad15a', '#ff8c1a', '#c46bff', '#3fe0d0', '#ff6bc1', '#d0d0d0', '#a0703a'];
  function generate(n, k) {
    let path = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push([r, r % 2 ? n - 1 - c : c]);
    for (let it = 0; it < n * n * 40; it++) {
      const endFirst = Math.random() < .5, L = path.length - 1, [r, c] = path[endFirst ? 0 : L];
      const nb = [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n);
      const [a, b] = nb[Math.floor(Math.random() * nb.length)];
      const i = path.findIndex(p => p[0] === a && p[1] === b);
      if (endFirst) { if (i <= 1) continue; path = path.slice(0, i).reverse().concat(path.slice(i)); }
      else { if (i >= L - 1) continue; path = path.slice(0, i + 1).concat(path.slice(i + 1).reverse()); }
    }
    const lens = Array(k).fill(3); let rem = n * n - 3 * k;
    while (rem-- > 0) lens[Math.floor(Math.random() * k)]++;
    const pins = {}, segs = []; let idx = 0;
    lens.forEach((len, color) => { const seg = path.slice(idx, idx + len); idx += len; segs.push(seg.map(([r, c]) => r * n + c)); pins[seg[0][0] * n + seg[0][1]] = color; pins[seg[len - 1][0] * n + seg[len - 1][1]] = color; });
    return { pins, segs };
  }
  function routing(o, cb) {
    const n = o.n, k = o.k, gen = generate(n, k), pins = gen.pins;
    const paths = Array.from({ length: k }, () => []);
    let drawing = -1, tleft = o.time, done = false, timer;
    UI().show(`<div class="yr">SKILL CHALLENGE</div><h2>${esc(o.title)}</h2>
      <p class="small">Drag from a pin to its matching pin. Wires can't cross, and <b>every cell must be used</b>. Drawing over a wire cuts it.</p>
      <div class="tbarq"><i id="rt"></i></div><div class="mt" id="rs"></div>
      <canvas id="rc" width="480" height="480"></canvas>
      <div class="row"><button class="ghost" id="rq">Give up (Esc)</button></div>`,
      { closable: false, keys: e => { if (e.key === 'Escape') { finish(false); return true; } } });
    const cv = document.getElementById('rc'), ctx = cv.getContext('2d'), W = cv.width, s = W / n;
    document.getElementById('rq').onclick = () => finish(false);
    const owner = cell => paths.findIndex(p => p.includes(cell));
    const adj = (a, b) => Math.abs(Math.floor(a / n) - Math.floor(b / n)) + Math.abs(a % n - b % n) === 1;
    const connected = c => { const p = paths[c]; return p.length >= 2 && pins[p[0]] === c && pins[p[p.length - 1]] === c && p[0] !== p[p.length - 1]; };
    function cellAt(e) { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * W; const c = Math.floor(x / s), rr = Math.floor(y / s); return c >= 0 && rr >= 0 && c < n && rr < n ? rr * n + c : -1; }
    function down(cell) {
      if (cell < 0) return;
      const pin = pins[cell];
      if (pin !== undefined) { paths[pin] = [cell]; drawing = pin; }
      else { const o2 = owner(cell); if (o2 >= 0) { paths[o2] = paths[o2].slice(0, paths[o2].indexOf(cell) + 1); drawing = o2; } }
      draw();
    }
    function move(cell) {
      if (drawing < 0 || cell < 0) return;
      const p = paths[drawing], head = p[p.length - 1];
      if (cell === head || !adj(cell, head)) return;
      const inIdx = p.indexOf(cell);
      if (inIdx >= 0) { paths[drawing] = p.slice(0, inIdx + 1); draw(); return; }
      if (p.length > 1 && pins[head] === drawing) return; // already reached partner
      const pin = pins[cell]; if (pin !== undefined && pin !== drawing) return;
      const o2 = owner(cell); if (o2 >= 0 && o2 !== drawing) { const j = paths[o2].indexOf(cell); paths[o2] = paths[o2].slice(0, j); }
      p.push(cell); draw();
    }
    function up() { drawing = -1; check(); }
    function check() {
      let filled = 0; paths.forEach(p => filled += p.length);
      const conn = paths.filter((_, c) => connected(c)).length;
      const rs = document.getElementById('rs'); if (rs) rs.textContent = `${conn} / ${k} connected · ${Math.round(filled / (n * n) * 100)}% of the die used`;
      if (conn === k && filled === n * n) finish(true);
    }
    function draw() {
      ctx.fillStyle = '#0f1418'; ctx.fillRect(0, 0, W, W);
      paths.forEach((p, c) => { ctx.fillStyle = COLS[c] + (connected(c) ? '44' : '22'); p.forEach(cell => ctx.fillRect(cell % n * s, Math.floor(cell / n) * s, s, s)); });
      ctx.strokeStyle = '#ffffff1a'; ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, W); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(W, i * s); ctx.stroke(); }
      paths.forEach((p, c) => {
        if (p.length < 2) return; ctx.strokeStyle = COLS[c]; ctx.lineWidth = s * .32; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        p.forEach((cell, i) => { const x = cell % n * s + s / 2, y = Math.floor(cell / n) * s + s / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      });
      for (const cell in pins) { const c = pins[cell], x = cell % n * s + s / 2, y = Math.floor(cell / n) * s + s / 2; ctx.fillStyle = COLS[c]; ctx.beginPath(); ctx.arc(x, y, s * .33, 0, 7); ctx.fill(); }
    }
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); down(cellAt(e)); });
    cv.addEventListener('pointermove', e => { if (drawing >= 0) move(cellAt(e)); });
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    function finish(ok) {
      if (done) return; done = true; clearInterval(timer);
      UI().show(`<div class="yr">${ok ? 'ROUTED' : 'FAILED'}</div><h2>${ok ? 'Clean layout. Every signal connected.' : tleft <= 0 ? 'Out of time.' : 'You walked away from the block.'}</h2>
        <button id="rok" class="big">Continue (Enter)</button>`, { closable: false, keys: e => { if (e.key === 'Enter') { go(); return true; } } });
      const go = () => { UI().close(); cb(ok); };
      document.getElementById('rok').onclick = go;
    }
    timer = setInterval(() => { if (LC.Sim.get().dead) return clearInterval(timer); tleft -= .1; const rt = document.getElementById('rt'); if (rt) rt.style.width = Math.max(0, tleft / o.time * 100) + '%'; if (tleft <= 0) finish(false); }, 100);
    draw(); check();
    LC.Games._debug = { segs: gen.segs, down, move, up }; // used by automated tests only
  }

  return { battle, routing, generate };
})();
