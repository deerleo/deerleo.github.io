// LUMEN REEL — ルール本体（描画や音に依存しない純粋なシミュレーション）
// ブラウザでは window.LR、node では module.exports として使う。
(function (root) {
  'use strict';
  const LR = {};

  // ---------- 乱数（状態に種を持たせ、保存・再現できるようにする） ----------
  LR.rand = function (s) {
    s.rs = (s.rs + 0x6D2B79F5) | 0;
    let t = s.rs;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  LR.randInt = (s, n) => Math.floor(LR.rand(s) * n);
  LR.pick = (s, arr) => arr[LR.randInt(s, arr.length)];

  // ---------- 部品 ----------
  LR.COMP = {
    blank: { name: '素通しガラス', desc: '光をそのまま通す。' },
    flame: { name: '炎', desc: '通る光を強める。光が来なくても、自分で灯る。' },
    lens: { name: 'レンズ', desc: '通る光を何倍かにする。光が来なければ何も起きない。' },
    up: { name: '上向きの鏡', desc: '光をひとつ上の海路へ曲げる。' },
    down: { name: '下向きの鏡', desc: '光をひとつ下の海路へ曲げる。' },
    prism: { name: 'プリズム', desc: '光を上下の海路にも分ける。' },
    ember: { name: '種火', desc: '炎と同じはたらき。自分の数字以上の光が通ると、ひとつ育つ。' },
  };
  LR.MAXLV = { flame: 3, lens: 3 };
  LR.EMBER_MAX = 9;
  LR.GULL_SHOO = 3;
  LR.MIN_STRIP = 5;

  LR.cell = function (t, lv) {
    const c = { t: t, lv: lv || 1 };
    if (t === 'ember') c.n = 1;
    return c;
  };
  const B = () => LR.cell('blank');
  const strip = (str) => str.split('').map(ch => LR.cell({ _: 'blank', F: 'flame', L: 'lens', U: 'up', D: 'down', P: 'prism', E: 'ember' }[ch]));

  // ---------- 船 ----------
  LR.SHIP = {
    boat: { name: '小舟', desc: '数字のぶんだけ光を浴びると、港へ帰れる。光は何回かに分けて届けてもよい。', speed: 1, coin: 2 },
    fast: { name: '早舟', desc: '一度に2マス進む。浴びる光は小舟と同じく、ためていける。', speed: 2, coin: 3 },
    fog: { name: '霧の船', desc: '濃い霧をまとっている。一度に数字以上の光を当てないと届かず、弱い光は霧に飲まれる。', speed: 1, coin: 3 },
    cargo: { name: '貨物船', desc: '導くと、積み荷の部品をひとつ分けてくれる。', speed: 1, coin: 2 },
    liner: { name: '客船ひかり丸', desc: '三つの海路にまたがる大きな船。三か所すべてに光を届けきれば帰れる。ゆっくり進む。', speed: 0.5, coin: 0 },
  };
  LR.DIST = 6;

  // ---------- 夜の定義 [出現ターン, 種類, 必要な光] ----------
  LR.NIGHTS = [
    { name: '凪の夜', sub: '迷った舟に、灯台の光を届けよう。',
      ships: [[0, 'boat', 3], [1, 'boat', 3], [3, 'boat', 4], [4, 'boat', 4], [6, 'boat', 5], [6, 'boat', 5], [8, 'cargo', 8], [9, 'boat', 6]], gulls: [] },
    { name: 'うねりの夜', sub: '足の速い舟がまじっている。',
      ships: [[0, 'boat', 7], [0, 'boat', 6], [2, 'fast', 3], [3, 'boat', 9], [4, 'cargo', 13], [6, 'boat', 10], [6, 'fast', 4], [8, 'boat', 10], [9, 'boat', 10], [10, 'fast', 5], [11, 'boat', 11]], gulls: [] },
    { name: '霧の夜', sub: '霧の船には、まとまった光でなければ届かない。',
      ships: [[0, 'boat', 10], [0, 'fog', 5], [2, 'boat', 12], [3, 'fog', 6], [4, 'fast', 7], [5, 'cargo', 20], [7, 'fog', 8], [7, 'boat', 14], [9, 'boat', 14], [10, 'fog', 9], [11, 'fast', 8], [12, 'boat', 16]], gulls: [[4, 1], [9, 1]] },
    { name: '風の夜', sub: '灯室に四本目のリールが据えつけられた。',
      ships: [[0, 'boat', 18], [0, 'fast', 9], [1, 'fog', 10], [3, 'boat', 22], [4, 'cargo', 30], [5, 'fast', 12], [6, 'fog', 13], [8, 'boat', 26], [8, 'boat', 22], [10, 'fog', 15], [11, 'fast', 14], [12, 'boat', 30], [13, 'fog', 16]], gulls: [[3, 1], [7, 1], [11, 1]] },
    { name: '嵐の夜', sub: '沖に、大きな船の影が見える。',
      ships: [[0, 'boat', 30], [0, 'fog', 16], [1, 'fast', 16], [3, 'boat', 36], [4, 'fog', 20], [5, 'liner', 110], [6, 'fast', 18], [8, 'boat', 40], [9, 'fog', 22], [11, 'fast', 20], [12, 'boat', 44], [14, 'fog', 24]], gulls: [[2, 1], [6, 2], [10, 1], [13, 1]] },
  ];

  // ---------- ゲーム開始 ----------
  LR.newGame = function (seed, hard) {
    const s = {
      v: 1, rs: seed | 0, hard: !!hard, night: 1, src: 1,
      tokens: 3, maxTokens: 3, hearts: 3, coins: 0, stars: 0,
      guided: 0, wrecks: 0, bestShot: 0, zoros: 0, retries: 0,
      reels: [
        { strip: strip('F___F___'), pos: 0 },
        { strip: strip('_L___F__'), pos: 0 },
        { strip: strip('__F___L_'), pos: 0 },
      ],
      ships: [], sched: [], gullSched: [], turn: 0, nextId: 1,
      offers: [], wickLv: 0, zenLv: 0, linerDone: false,
    };
    return s;
  };

  LR.startNight = function (s) {
    const def = LR.NIGHTS[s.night - 1];
    s.hearts = 3; s.tokens = s.maxTokens; s.wind = 0; s.turn = 0; s.ships = []; s.linerDone = false;
    if (s.night >= 4 && s.reels.length < 4) s.reels.push({ strip: strip('_F___L__'), pos: 0 });
    for (const r of s.reels) for (const c of r.strip) delete c.gull;
    const mul = s.hard ? 1.5 : 1;
    // 同じターンに同じ海路へ重ならないよう、海路を割り振る
    const byTurn = {};
    s.sched = def.ships.map(([turn, type, need]) => {
      const used = byTurn[turn] || (byTurn[turn] = []);
      let lane = 0;
      if (type !== 'liner') {
        const free = [0, 1, 2].filter(l => used.indexOf(l) < 0);
        lane = LR.pick(s, free.length ? free : [0, 1, 2]);
        used.push(lane);
      }
      return { turn: turn, type: type, lane: lane, need: Math.round(need * mul) };
    });
    s.gullSched = def.gulls.map(g => ({ turn: g[0], n: g[1] }));
    LR.spawn(s);
  };

  LR.spawn = function (s) {
    const out = [];
    for (let i = 0; i < s.sched.length; i++) {
      const e = s.sched[i];
      if (e.turn !== s.turn) continue;
      const sh = { id: s.nextId++, type: e.type, lane: e.lane, dist: LR.DIST };
      if (e.type === 'liner') { sh.parts = [e.need, e.need, e.need]; sh.max = e.need; }
      else if (e.type === 'fog') { sh.thr = e.need; }
      else { sh.need = e.need; sh.max = e.need; }
      s.ships.push(sh); out.push(sh);
    }
    s.sched = s.sched.filter(e => e.turn !== s.turn);
    return out;
  };

  // ---------- リール ----------
  LR.cellAt = function (reel, row, off) {
    const n = reel.strip.length;
    return reel.strip[(((reel.pos + (off || 0) + row) % n) + n) % n];
  };
  // 今見えている窓（列×3行）。offs は各リールの仮のずらし量。
  LR.windowOf = function (s, offs) {
    return s.reels.map((r, c) => [0, 1, 2].map(row => LR.cellAt(r, row, offs ? offs[c] : 0)));
  };
  LR.spin = function (s, holds) {
    s.reels.forEach((r, c) => {
      if (holds && holds[c]) { s.tokens--; return; }
      r.pos = LR.randInt(s, r.strip.length);
    });
  };

  // ---------- 光の計算 ----------
  // 返り値：exits（各海路へ出る光）、cols（各列の入力と行き先）、grow / shoo（照射時に起きる変化）、zoro
  LR.compute = function (win, src) {
    let inp = [src, src, src];
    const cols = [], grow = [], shoo = [];
    for (let c = 0; c < win.length; c++) {
      const out = [0, 0, 0], links = [];
      for (let r = 0; r < 3; r++) {
        const p = inp[r], cell = win[c][r];
        let o = 0, to = [r], op = '';
        if (cell.gull) {
          if (p >= LR.GULL_SHOO) shoo.push({ c: c, r: r });
          to = []; op = p > 0 ? 'x' : '';
        } else switch (cell.t) {
          case 'flame': o = p + cell.lv; op = '+' + cell.lv; break;
          case 'ember': o = p + cell.n; op = '+' + cell.n; if (p >= cell.n && cell.n < LR.EMBER_MAX) grow.push({ c: c, r: r }); break;
          case 'lens': o = p * (cell.lv + 1); op = p > 0 ? '×' + (cell.lv + 1) : ''; break;
          case 'up': o = p; if (r > 0) to = [r - 1]; break;
          case 'down': o = p; if (r < 2) to = [r + 1]; break;
          case 'prism': o = p; to = [r - 1, r, r + 1].filter(x => x >= 0 && x <= 2); break;
          default: o = p;
        }
        if (o > 0) for (const t of to) out[t] += o;
        links.push({ p: p, o: o, to: o > 0 ? to : [], op: op });
      }
      cols.push({ inp: inp, links: links });
      inp = out;
    }
    // ゾロ目：横一列がすべて同じ部品（素通しガラスと、カモメのいる列は除く）
    const zoro = [];
    for (let r = 0; r < 3; r++) {
      const t0 = win[0][r].t;
      if (t0 === 'blank') continue;
      if (win.every(col => col[r].t === t0 && !col[r].gull)) zoro.push(r);
    }
    const zmul = Math.pow(win.length >= 4 ? 3 : 2, zoro.length);
    const raw = inp;
    return { exits: inp.map(v => v * zmul), raw: raw, cols: cols, grow: grow, shoo: shoo, zoro: zoro, zmul: zmul };
  };

  // 船に光を当てた結果を調べる（mutate=false なら予測だけ）
  LR.hitLanes = function (s, exits, mutate) {
    const lanes = [], guided = [];
    let stars = 0;
    const ships = s.ships.slice().sort((a, b) => a.dist - b.dist);
    const linerLeft = {};
    for (let l = 0; l < 3; l++) {
      let p = exits[l];
      const hits = [];
      for (const sh of ships) {
        if (p <= 0) break;
        if (sh.type === 'liner') {
          const cur = sh.parts[l];
          if (cur <= 0) continue;
          const take = Math.min(p, cur);
          hits.push({ id: sh.id, take: take, before: cur, after: cur - take });
          if (mutate) sh.parts[l] = cur - take; else linerLeft[l] = cur - take;
          p -= take;
        } else if (sh.lane !== l) {
          continue;
        } else if (sh.type === 'fog') {
          if (p >= sh.thr) { hits.push({ id: sh.id, take: sh.thr, guided: true }); guided.push(sh); p -= sh.thr; }
          else { hits.push({ id: sh.id, take: 0, swallowed: p }); p = 0; }
        } else {
          const take = Math.min(p, sh.need);
          const after = sh.need - take;
          hits.push({ id: sh.id, take: take, before: sh.need, after: after, guided: after === 0 });
          if (mutate) sh.need = after;
          if (after === 0) guided.push(sh);
          p -= take;
        }
      }
      stars += p;
      lanes.push({ power: exits[l], hits: hits, left: p });
    }
    const liner = s.ships.find(x => x.type === 'liner');
    if (liner) {
      const done = [0, 1, 2].every(l => (mutate ? liner.parts[l] : (l in linerLeft ? linerLeft[l] : liner.parts[l])) <= 0);
      if (done) guided.push(liner);
    }
    return { lanes: lanes, guided: guided, stars: stars };
  };

  // 照射：ずらしを確定し、光を放つ。演出用のイベントを返す。
  LR.fire = function (s, offs) {
    let cost = 0;
    if (offs) s.reels.forEach((r, c) => {
      const n = r.strip.length;
      cost += Math.abs(offs[c] || 0);
      r.pos = (((r.pos + (offs[c] || 0)) % n) + n) % n;
    });
    s.tokens -= cost;
    const win = LR.windowOf(s);
    const res = LR.compute(win, s.src);
    for (const g of res.grow) win[g.c][g.r].n++;
    for (const g of res.shoo) delete win[g.c][g.r].gull;
    const hit = LR.hitLanes(s, res.exits, true);
    let coins = 0, cargo = 0;
    for (const sh of hit.guided) {
      coins += LR.SHIP[sh.type].coin;
      if (sh.type === 'cargo') cargo++;
      if (sh.type === 'liner') s.linerDone = true;
    }
    s.ships = s.ships.filter(sh => hit.guided.indexOf(sh) < 0);
    s.guided += hit.guided.length;
    s.coins += coins; s.stars += hit.stars;
    const total = res.exits[0] + res.exits[1] + res.exits[2];
    if (total > s.bestShot) s.bestShot = total;
    let tok = 0;
    if (hit.guided.length >= 2) tok++;
    if (res.zoro.length) { tok++; s.zoros++; }
    tok = Math.min(tok, s.maxTokens - s.tokens);
    s.tokens += tok;
    return { res: res, lanes: hit.lanes, guided: hit.guided, coins: coins, stars: hit.stars, cargo: cargo, tokens: tok, total: total };
  };

  // 船が進み、新しい船が現れる。
  LR.advance = function (s) {
    const moves = [], wrecks = [];
    for (const sh of s.ships) {
      const from = sh.dist;
      sh.dist -= LR.SHIP[sh.type].speed;
      moves.push({ id: sh.id, from: from, to: sh.dist });
      if (sh.dist <= 0.01) wrecks.push(sh);
    }
    let linerLost = false;
    for (const sh of wrecks) {
      s.wrecks++;
      if (sh.type === 'liner') { s.hearts = 0; linerLost = true; } else s.hearts--;
    }
    s.ships = s.ships.filter(sh => wrecks.indexOf(sh) < 0);
    s.turn++;
    // ゼンマイは一手ごとに半分ずつ巻き戻る
    let wound = false;
    if (s.tokens < s.maxTokens) { s.wind = (s.wind || 0) + 1; if (s.wind >= 2) { s.wind = 0; s.tokens++; wound = true; } } else s.wind = 0;
    const spawns = LR.spawn(s);
    // カモメ：見えている窓のどこかに降りる
    const gulls = [];
    for (const g of s.gullSched) {
      if (g.turn !== s.turn) continue;
      for (let i = 0; i < g.n; i++) {
        for (let tries = 0; tries < 12; tries++) {
          const c = LR.randInt(s, s.reels.length), r = LR.randInt(s, 3);
          const cell = LR.cellAt(s.reels[c], r);
          if (!cell.gull) { cell.gull = true; gulls.push({ c: c, r: r }); break; }
        }
      }
    }
    const failed = s.hearts <= 0;
    const over = !failed && s.ships.length === 0 && s.sched.length === 0;
    return { moves: moves, wrecks: wrecks, spawns: spawns, gulls: gulls, wound: wound, failed: failed, over: over, linerLost: linerLost };
  };

  LR.nightBonus = s => 3 + s.hearts;
  LR.RETRY_GIFT = 5;

  // ---------- 工房 ----------
  LR.PRICE = { flame: 3, up: 2, down: 2, lens: 6, prism: 7, ember: 5 };
  LR.wickPrice = s => 10 + s.wickLv * 8;
  LR.zenPrice = s => 6 + s.zenLv * 4;
  LR.SWAP_PRICE = 1; LR.REMOVE_PRICE = 4; LR.REROLL_PRICE = 1;
  LR.MAX_TOKENS = 6; LR.MAX_SRC = 4;

  LR.offerPool = function (s) {
    const pool = ['flame', 'flame', 'lens', 'up', 'down'];
    if (s.night >= 2) pool.push('prism', 'lens');
    if (s.night >= 3) pool.push('ember', 'ember', 'prism');
    return pool;
  };
  LR.rollOffers = function (s, n) {
    const pool = LR.offerPool(s), out = [];
    n = n || 4;
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const t = LR.pick(s, pool);
      if (out.filter(x => x === t).length >= (n > 3 ? 2 : 1)) continue;
      out.push(t);
    }
    s.offers = out.map(t => ({ t: t, sold: false }));
    return s.offers;
  };
  // 置けるか・置いたらどうなるか
  LR.placeResult = function (cell, t) {
    if (cell.t === t && LR.MAXLV[t]) {
      if (cell.lv >= LR.MAXLV[t]) return null;
      return 'upgrade';
    }
    return 'replace';
  };
  LR.place = function (s, c, i, t) {
    const cell = s.reels[c].strip[i];
    const kind = LR.placeResult(cell, t);
    if (!kind) return null;
    if (kind === 'upgrade') cell.lv++;
    else s.reels[c].strip[i] = LR.cell(t);
    return kind;
  };
  LR.swap = function (s, c1, i1, c2, i2) {
    const a = s.reels[c1].strip[i1];
    s.reels[c1].strip[i1] = s.reels[c2].strip[i2];
    s.reels[c2].strip[i2] = a;
  };
  LR.canRemove = (s, c) => s.reels[c].strip.length > LR.MIN_STRIP;
  LR.remove = function (s, c, i) {
    const r = s.reels[c];
    r.strip.splice(i, 1);
    r.pos = r.pos % r.strip.length;
  };

  LR.rank = function (s) {
    const w = s.wrecks;
    if (w === 0) return '伝説の灯台守';
    if (w <= 2) return '名うての灯台守';
    if (w <= 5) return '頼れる灯台守';
    return '見習い灯台守';
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LR;
  else root.LR = LR;
})(typeof window !== 'undefined' ? window : globalThis);
