// 潮汐战线：评分和记录（规则见 tools/RANK-SPEC.md，自测 tools/test-rank.js）。
// 三件事：① 对局里累计统计（记在 state.rk 里，随存档走）；② 打完算速度、火力、技术三项分和评级；③ 把最好成绩记进 localStorage。
// 浏览器里是全局 AWRank（index.html 里排在 core.js 之后）；node 里 require('./rank.js') 会顺带加载 data.js、core.js。
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && typeof require !== 'undefined';
  const D = root.AWData || (node ? require('./data.js') : null);
  const C = root.AWCore || (node ? require('./core.js') : null);
  const Mods = () => root.AWMods || null;
  const R = {};

  // ───────── 一、对局里的统计 ─────────
  // state.rk = { v, put, lost, kill, putN, lostN, killN, mods }（数组下标 = 席位）
  //   put  这个席位上过场的单位的造价总和（开局部队 + 生产 + 增援 + 复活）
  //   lost 这个席位被击毁的单位的造价总和（搭载的单位一起算；司令部被占后消失的不算）
  //   kill 这个席位击毁的敌方单位的造价总和
  // 没有 state.rk 的对局（旧存档、测试里手搭的状态）不评分。
  const cost = type => (D.UNITS[type] && D.UNITS[type].cost) || 0;
  const add = (a, p, v) => { a[p] = (a[p] || 0) + v; };
  function begin(s) {
    const rk = { v: 1, put: [0], lost: [0], kill: [0], putN: [0], lostN: [0], killN: [0], mods: !!(Mods() && Mods().changesRules && Mods().changesRules()) };
    for (const u of s.units) { add(rk.put, u.owner, cost(u.type)); add(rk.putN, u.owner, 1); for (const c of u.cargo || []) { add(rk.put, u.owner, cost(c.type)); add(rk.putN, u.owner, 1); } }
    s.rk = rk;
    return s;
  }
  R.begin = begin;
  if (C && !C._rankHooked) {
    C._rankHooked = true;
    const newGame = C.newGame;
    C.newGame = function () { const s = newGame.apply(this, arguments); if (s) begin(s); return s; };
    const spawn = C.spawn;
    C.spawn = function (s, type, owner) { const u = spawn.apply(this, arguments); if (s.rk && u) { add(s.rk.put, owner, cost(type)); add(s.rk.putN, owner, 1); } return u; };
    // 取消生产：刚造出来的那个单位不算上过场
    const undoBuild = C.undoBuild;
    if (undoBuild) C.undoBuild = function (s) {
      const before = s && s.rk ? s.units.slice() : null, ok = undoBuild.apply(this, arguments);
      if (ok && before) for (const u of before) if (!s.units.includes(u)) { add(s.rk.put, u.owner, -cost(u.type)); add(s.rk.putN, u.owner, -1); }
      return ok;
    };
    const prev = C.onKill;
    C.onKill = function (s, dead, by) {
      if (prev) prev(s, dead, by);
      const rk = s.rk; if (!rk || !dead) return;
      let v = cost(dead.type), n = 1;
      for (const c of dead.cargo || []) { v += cost(c.type); n++; }
      add(rk.lost, dead.owner, v); add(rk.lostN, dead.owner, n);
      if (by && by.owner > 0 && C.isEnemy(s, dead.owner, by.owner)) { add(rk.kill, by.owner, v); add(rk.killN, by.owner, n); }
    };
  }

  // ───────── 二、标准天数 ─────────
  // 自带的 24 张地图和 27 关战役各有一个定好的数（tools/rank-calib.js 让电脑对打量出来的，见 RANK-SPEC.md）。
  // 表里没有的地图（扩展带来的）按地图大小和司令部距离估一个。
  R.PAR = {
    晨曦镇: 13, 灯塔岬: 19, 雾港: 15, 断龙岭: 14, 千屿: 18, 黑沼三角洲: 14, 金砂矿谷: 14, 练兵场: 11,
    双桥镇: 14, 山口要塞: 12, 碧湾海峡: 16, 碎星群岛: 30, 鹰愁走廊: 18, 聚宝盆地: 13, 镜湖会战: 15, 双子湖会战: 20,
    中央海: 35, 三岔口: 21, 同盟走廊: 24, 孤城: 17, 十二港: 38, 炉城: 32, 退潮海床: 42, 四方演习: 27,
  };
  R.PAR_CAMP = {
    // 守 N 天的关 = N；有期限的关 = 期限的四分之三；其余 = 电脑代打最快的一局再减一成（a2_3 电脑打不过，是估的）
    p01: 12, p02: 15, a1_1: 9, a1_2: 11, a1_3: 12, a1_4: 11, a1_5: 12,
    a2_1: 9, a2_2: 10, a2_3: 14, a2_4: 16, a2_5: 14,
    a3_1: 9, a3_2: 10, a3_3: 14, a3_4: 11, a3_5: 14, a3_6: 6,
    a4_1: 9, a4_2: 15, a4_3: 9, a4_5: 9, a4_4: 20, a4_6: 23, e1: 12, e2: 21, e3: 18,
  };
  // 估算：司令部之间最近的直线格数（曼哈顿距离）和地图边长
  R.estimatePar = function (def) {
    let hq = [], w = 0, h = 0;
    try {
      const s = C.newGame(def, {}); w = s.map.w; h = s.map.h;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (s.map.t[y][x] === 'hq') hq.push([x, y]);
    } catch (e) { return 20; }
    let dist = w + h;
    for (let i = 0; i < hq.length; i++) for (let j = i + 1; j < hq.length; j++) dist = Math.min(dist, Math.abs(hq[i][0] - hq[j][0]) + Math.abs(hq[i][1] - hq[j][1]));
    const n = def.players || 2;
    return Math.max(8, Math.round(EST.base + EST.perCell * dist + EST.perSeat * (n - 2)));
  };
  const EST = R.EST = { base: 3, perCell: 0.5, perSeat: 5.5 };
  const mapDef = name => (D.MAPS || []).find(m => m.name === name) || null;
  const parCache = {};
  R.parOf = function (s) {
    if (s.camp && R.PAR_CAMP[s.camp.id]) return R.PAR_CAMP[s.camp.id];
    const name = s.map.name;
    if (!s.camp && R.PAR[name]) return R.PAR[name];
    const def = mapDef(name);
    if (!def) return 20;
    const base = R.PAR[name] || parCache[name] || (parCache[name] = R.estimatePar(def));
    return base;
  };
  R.parOfMap = name => R.PAR[name] || (mapDef(name) ? (parCache[name] || (parCache[name] = R.estimatePar(mapDef(name)))) : 20);
  R.parOfLevel = id => R.PAR_CAMP[id] || 0;

  // ───────── 三、算分 ─────────
  // 速度：天数不超过标准天数 100 分，每超出标准天数的 1% 扣 1 分（两倍标准天数 0 分）。
  // 火力：己方击毁的敌方单位造价 ÷ 己方全部单位的造价。达到 100%（战役是 60%）就是 100 分，不到按比例给。
  // 技术：己方被击毁单位的造价 ÷ 己方全部单位的造价。不超过 10% 是 100 分，到 60% 是 0 分。
  const K = R.K = { powerFull: 1, powerFullCamp: 0.6, techFull: 0.10, techZero: 0.60, S: 270, A: 230, B: 180 };
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  R.RANKS = ['C', 'B', 'A', 'S'];
  R.rankIdx = total => total >= K.S ? 3 : total >= K.A ? 2 : total >= K.B ? 1 : 0;
  R.speedScore = (days, par) => clamp(days <= par ? 100 : 100 - (days - par) * 100 / par);
  R.powerScore = (kill, target) => target > 0 ? clamp(kill * 100 / target) : 100;
  R.techScore = (lost, put) => { if (!(put > 0)) return 100; const f = lost / put; return clamp(f <= K.techFull ? 100 : 100 - (f - K.techFull) * 100 / (K.techZero - K.techFull)); };
  // 这一局、这个席位的三项分（不管该不该计分；该不该计分看 R.judge）
  R.score = function (s, seat) {
    const rk = s.rk; if (!rk) return null;
    const par = R.parOf(s), days = s.day;
    const kill = rk.kill[seat] || 0, lost = rk.lost[seat] || 0, put = rk.put[seat] || 0;
    const target = Math.round(put * (s.camp ? K.powerFullCamp : K.powerFull));
    const speed = R.speedScore(days, par), power = R.powerScore(kill, target), tech = R.techScore(lost, put);
    const total = speed + power + tech, ri = R.rankIdx(total);
    return { speed, power, tech, total, rank: R.RANKS[ri], ri, days, par, kill, target, lost, put, killN: rk.killN[seat] || 0, lostN: rk.lostN[seat] || 0, putN: rk.putN[seat] || 0 };
  };

  // ───────── 四、这一局计不计分 ─────────
  // human：数组，下标 = 席位，true 是玩家。返回 { ok:true, seat, key, kind, co, lv, fog, …三项分 } 或 { ok:false, why }
  //   why：'nostat' 没有统计（旧存档） | 'lost' 没赢 | 'humans' 不是一个玩家对电脑 | 'days' 按天数上限判的胜负 |
  //        'mods' 启用了改规则的扩展 | 'rules' 开局资金、建筑收入、人数补偿不是这张地图的默认值 | 'teams' 队伍不是这张地图的默认分法
  const LV = R.LV = ['easy', 'normal', 'hard'];
  const sameTeams = (a, b, n) => { for (let p = 1; p <= n; p++) for (let q = p + 1; q <= n; q++) if ((a[p] === a[q]) !== (b[p] === b[q])) return false; return true; };
  R.judge = function (s, human) {
    const no = why => ({ ok: false, why });
    if (!s || !s.winner) return no('lost');
    const N = s.players, hs = []; for (let p = 1; p <= N; p++) if (human && human[p]) hs.push(p);
    if (hs.length !== 1) return no('humans');
    const seat = hs[0];
    if (s.camp ? s.camp.result !== 'win' || s.camp.seat !== seat : !(s.winners || []).includes(seat)) return no('lost');
    if (!s.rk || s.rk.v !== 1) return no('nostat');
    if (s.rk.mods || (Mods() && Mods().changesRules && Mods().changesRules())) return no('mods');
    const foes = []; for (let p = 1; p <= N; p++) if (C.isEnemy(s, seat, p)) foes.push(p);
    if (!foes.length) return no('humans');
    let key, kind;
    if (s.camp) { key = s.camp.id; kind = 'camp'; }
    else {
      if (s.reason !== 'hq' && s.reason !== 'rout') return no('days');
      key = s.map.name; kind = 'map';
      const def = mapDef(key);
      if (def) {
        const want = defaultsOf(def);
        if (want) {
          for (const k of ['startFunds', 'income', 'handicap']) if (want.rules[k] !== undefined && (s.rules || {})[k] !== want.rules[k]) return no('rules');
          if (!sameTeams(s.team, want.team, N)) return no('teams');
        }
      }
    }
    const lvI = Math.min.apply(null, foes.map(p => { const i = LV.indexOf(C.aiLevel(s, p)); return i < 0 ? 1 : i; }));
    const sc = R.score(s, seat);
    return Object.assign({ ok: true, seat, key, kind, co: s.co[seat] || '', lv: LV[lvI], lvI, fog: !!(s.rules && s.rules.fog) }, sc);
  };
  const defCache = {};
  function defaultsOf(def) {
    if (defCache[def.name]) return defCache[def.name];
    try { const s = C.newGame(def, {}); return (defCache[def.name] = { rules: s.rules, team: s.team.slice() }); } catch (e) { return null; }
  }

  // ───────── 五、记录 ─────────
  // localStorage 的 steel-tide.rank.v1：
  // { v: 1, maps: { 地图名: 一份记录 }, camp: { 关卡 id: 一份记录 } }
  // 一份记录：{ n 计分的胜利次数,
  //   best: { total, ri, speed, power, tech, days, co, lv, fog, at }   总分最高的那一局
  //   days: 最少天数, daysCo, speed / power / tech: 三项各自的最好成绩（可以来自不同的对局）,
  //   lv: [简单, 普通, 困难 下的最高评级，-1 是没打过], fog: 开着迷雾拿过的最高评级,
  //   cos: { 指挥官 id: [最高评级, 拿到这个评级时的最高难度] } }
  // 每一项都只升不降。
  const KEY = 'steel-tide.rank.v1';
  let mem = null;
  const blank = () => ({ v: 1, maps: {}, camp: {} });
  const store = () => { try { return root.localStorage || null; } catch (e) { return null; } };
  function load() {
    if (mem) return mem;
    try { const ls = store(), o = ls && JSON.parse(ls.getItem(KEY) || 'null'); if (o && o.v === 1 && o.maps && o.camp) return (mem = o); } catch (e) { }
    return (mem = blank());
  }
  function save() { try { const ls = store(); if (ls) ls.setItem(KEY, JSON.stringify(mem)); } catch (e) { } }
  R.KEY = KEY;
  R.reload = () => { mem = null; return load(); };
  R.reset = () => { mem = blank(); save(); };
  R.all = () => load();
  R.record = (kind, key) => { const o = load()[kind === 'camp' ? 'camp' : 'maps'][key]; return o || null; };
  // 把一局的结果（R.judge 的返回值，ok 为真）记进去。返回 { rec, isNew: { first, total, rank, days, speed, power, tech, co, hard }, was }
  R.submit = function (j) {
    if (!j || !j.ok) return null;
    const all = load(), tab = all[j.kind === 'camp' ? 'camp' : 'maps'];
    const old = tab[j.key] || null, was = old ? JSON.parse(JSON.stringify(old)) : null;
    const r = old || (tab[j.key] = { n: 0, best: null, days: 0, daysCo: '', speed: 0, power: 0, tech: 0, lv: [-1, -1, -1], fog: -1, cos: {} });
    const isNew = { first: !old };
    r.n++;
    const b = r.best;
    if (!b || j.total > b.total || (j.total === b.total && (j.lvI > LV.indexOf(b.lv) || (j.lvI === LV.indexOf(b.lv) && j.days < b.days)))) {
      isNew.total = !b || j.total > b.total; isNew.rank = !b || j.ri > b.ri;
      r.best = { total: j.total, ri: j.ri, speed: j.speed, power: j.power, tech: j.tech, days: j.days, co: j.co, lv: j.lv, fog: j.fog, at: Date.now() };
    }
    if (!r.days || j.days < r.days) { isNew.days = true; r.days = j.days; r.daysCo = j.co; }
    for (const k of ['speed', 'power', 'tech']) if (j[k] > r[k]) { isNew[k] = !!old; r[k] = j[k]; }
    if (j.ri > r.lv[j.lvI]) { if (j.lvI === 2 && j.ri === 3) isNew.hard = true; r.lv[j.lvI] = j.ri; }
    if (j.fog && j.ri > r.fog) r.fog = j.ri;
    if (j.co) { const c = r.cos[j.co]; if (!c || j.ri > c[0]) { isNew.co = true; r.cos[j.co] = [j.ri, j.lvI]; } else if (j.ri === c[0] && j.lvI > c[1]) c[1] = j.lvI; }
    save();
    return { rec: r, isNew, was };
  };
  // 这份记录的最高评级（-1 没打过）；困难下拿过 S 没有
  R.top = r => !r ? -1 : Math.max(r.lv[0], r.lv[1], r.lv[2]);
  R.hardS = r => !!r && r.lv[2] === 3;
  // 总进度。maps：计入的地图名数组；cos：计入的指挥官 id 数组；levels：战役关卡 id 数组
  R.progress = function (maps, cos, levels) {
    const all = load(), out = { maps: maps.length, played: 0, s: 0, hardS: 0, byRank: [0, 0, 0, 0], cells: maps.length * cos.length, coS: 0, coAny: 0, levels: (levels || []).length, campS: 0, campPlayed: 0, campByRank: [0, 0, 0, 0] };
    for (const m of maps) {
      const r = all.maps[m]; if (!r) continue;
      const t = R.top(r); if (t >= 0) { out.played++; out.byRank[t]++; } if (t === 3) out.s++; if (R.hardS(r)) out.hardS++;
      for (const c of cos) { const e = r.cos[c]; if (e) { out.coAny++; if (e[0] === 3) out.coS++; } }
    }
    for (const id of levels || []) { const r = all.camp[id]; if (!r) continue; const t = R.top(r); if (t >= 0) { out.campPlayed++; out.campByRank[t]++; } if (t === 3) out.campS++; }
    return out;
  };

  root.AWRank = R;
  if (node) module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
