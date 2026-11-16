// 潮汐战线：战役进度（通关记录、解锁的指挥官 / 地图 / 图鉴条目）和开关卡的入口。界面只调这里的接口。
// 进度存在 localStorage（没有或写不进去时只留在内存里，不报错）。依赖 campaign.js（AWCampaign）和 core.js（AWCore）。
(function (root) {
  const KEY = 'steel-tide.campaign.v1';
  const CAMP = () => root.AWCampaign || (typeof require !== 'undefined' ? require('./campaign.js') : null);
  const CORE = () => root.AWCore || (typeof require !== 'undefined' ? require('./core.js') : null);
  let mem = null;
  function store() { try { return root.localStorage || null; } catch (e) { return null; } }
  function blank() { return { v: 1, done: {}, cos: [], maps: [], codex: [], free: {} }; }
  function read() {
    if (mem) return mem;
    let o = null;
    try { const ls = store(), raw = ls && ls.getItem(KEY); if (raw) o = JSON.parse(raw); } catch (e) { o = null; }
    if (!o || o.v !== 1 || typeof o.done !== 'object') o = blank();
    for (const k of ['cos', 'maps', 'codex']) if (!Array.isArray(o[k])) o[k] = [];
    if (!o.free || typeof o.free !== 'object') o.free = {}; // 自由对局里用哪些阵营赢过电脑（普通难度以上）
    return mem = o;
  }
  function write() { try { const ls = store(); if (!ls) return false; ls.setItem(KEY, JSON.stringify(mem)); return true; } catch (e) { return false; } }
  const levels = () => (CAMP() ? CAMP().levels : []);
  const DATA = () => root.AWData || (typeof require !== 'undefined' ? require('./data.js') : null);
  const T = (src, vars) => { const I = root.AWI18n; if (I && I.t) return I.t(src, vars); return src.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m)); };
  const FAC_NAMES = () => { const D = DATA(); return (D && D.PLAYERS) || []; };
  // 黑潮五位大将各自的 Boss 关：通关就解锁这一位。前四位取“他是敌方的第一个 Boss 关”，首领（最后一关的那位）要通关整个战役
  const DARK_BOSS = { moon: 'a2_5', candle: 'a3_6', coin: 'a4_4', anvil: 'e1' }; // 玄朔「等潮」、玄烛「一个都别丢」、玄铢「孤城」、玄砧「黑潮号」；关卡 id 变了就退回按 boss 标记找
  function darkCos() {
    const D = DATA(), ls = levels(), p = read(), out = [];
    if (!D || !ls.length) return out;
    const last = ls[ls.length - 1], boss = {};
    const lastCo = (last.sides.find(sd => sd.faction === 5 && sd.role === 'enemy') || {}).co;
    for (const co in DARK_BOSS) { const l = ls.find(x => x.id === DARK_BOSS[co]); if (l && co !== lastCo) boss[co] = l; } // 先按写定的那几关
    for (const l of ls) if (l.boss) for (const sd of l.sides) if (sd.faction === 5 && sd.role === 'enemy' && sd.co && sd.co !== lastCo && !boss[sd.co]) boss[sd.co] = l;
    if (lastCo) boss[lastCo] = last;
    for (const c of D.COS) if (c.faction === 5 && boss[c.id]) out.push({ co: c.id, name: c.name, level: boss[c.id].id, title: boss[c.id].title, done: !!p.done[boss[c.id].id] });
    return out.sort((a, b) => ls.findIndex(l => l.id === a.level) - ls.findIndex(l => l.id === b.level)); // 按关卡先后
  }
  const API = {
    // 关卡数据（campaign.js 里的原样）
    level(id) { return levels().find(l => l.id === id) || null; },
    // 全部关卡的概况，按幕和顺序：[{ id, act, no, title, when, where, difficulty, done, open, ready }]
    //   done 通关过；open 现在能不能打（第一关，或前一关已通关）；ready 地图是不是已经有了（“需新图”的关是 false）
    list() {
      const p = read(), ls = levels();
      return ls.map((l, i) => ({ id: l.id, act: l.act, no: l.no, title: l.title, when: l.when, where: l.where, difficulty: l.difficulty,
        done: !!p.done[l.id], open: i === 0 || !!p.done[ls[i - 1].id] || !!p.done[l.id], ready: !(l.map && l.map.need) }));
    },
    isDone(id) { return !!read().done[id]; },
    // 通关记录：{ 关卡 id: { at, days, seat, co, times } }
    record(id) { return read().done[id] || null; },
    // 开一关：返回对局状态（core 的 state），地图还没有时返回 null。opts：{ seat, co }
    start(id, opts) { const l = API.level(id), C = CORE(); return l && C ? C.newCampaignGame(l, opts) : null; },
    // 记一次通关。info：{ days, seat, co }（可省）。返回这次新解锁的东西 { first, cos: [], maps: [], codex: [] }
    complete(id, info) {
      const p = read(), l = API.level(id), out = { first: false, cos: [], maps: [], codex: [] };
      if (!l) return out;
      const old = p.done[id];
      out.first = !old;
      p.done[id] = { at: Date.now(), days: (info && info.days) || (old && old.days) || 0, seat: (info && info.seat) || 0, co: (info && info.co) || '', times: ((old && old.times) || 0) + 1 };
      const un = l.unlock || {};
      for (const k of ['cos', 'maps', 'codex']) for (const x of un[k] || []) if (!p[k].includes(x)) { p[k].push(x); out[k].push(x); }
      write();
      return out;
    },
    // 已解锁的指挥官（含一开始就有的 startCos）、地图、图鉴条目
    unlockedCos() {
      const c = CAMP(), out = new Set(((c && c.startCos) || []).concat(read().cos));
      const dark = darkCos().filter(x => x.done).map(x => x.co);
      for (const id of dark) out.add(id);
      if (!dark.length && API.unlockedFactions().includes(5)) out.add('anvil');
      try { const M = root.AWMods; if (M && M.coIds) for (const id of M.coIds()) out.add(id); } catch (e) { /* 忽略 */ } // 扩展加的指挥官直接能用 // 靠自由对局开放了黑潮、却一位大将都没解锁：先给玄砧
      return [...out];
    },
    unlockedMaps() { return read().maps.slice(); },
    unlockedCodex() { return read().codex.slice(); },
    // 自由对局里能选的阵营：四国，最后一关通关以后加上玄潮（5）
    // 自由对局里能选的阵营：四国；黑潮（5）两条路开放——通关任意一位黑潮大将的 Boss 关（或整个战役），或者在自由对局里用四国各赢电脑一局（普通难度以上）
    unlockedFactions() { return API.unlockInfo(5).open ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]; },
    // 某个阵营的解锁条件和进度：{ open, reasons: [{ text, done }] }。四国恒为开放
    unlockInfo(faction) {
      if (faction !== 5) return { open: true, reasons: [] };
      const p = read(), dk = darkCos(), names = FAC_NAMES();
      const reasons = dk.map(x => ({ text: T('通关「{level}」：解锁 {co}', { level: x.title, co: x.name }), done: x.done, kind: 'boss', co: x.co, level: x.level }));
      const free = [1, 2, 3, 4].map(f => ({ text: T('自由对局：用{faction}在一场对局中击败电脑（普通难度以上）', { faction: names[f] || f }), done: !!p.free[f], kind: 'free', faction: f }));
      return { open: dk.some(x => x.done) || free.every(x => x.done), reasons: reasons.concat(free) };
    },
    // 某位指挥官的解锁条件：{ open, reason: { text, done, level } | null }。黑潮的大将看他的 Boss 关；别的指挥官看 unlockedCos（没有单独的条件，reason 是 null）
    unlockInfoCo(coId) {
      const x = darkCos().find(d => d.co === coId);
      if (!x) return { open: API.unlockedCos().includes(coId), reason: null };
      return { open: API.unlockedCos().includes(coId), reason: { text: T('通关「{level}」：解锁 {co}', { level: x.title, co: x.name }), done: x.done, level: x.level } };
    },
    // 自由对局赢了电脑一局：faction 是玩家用的阵营（1–4），aiLevel 是对手里最弱的电脑的难度。新手难度不算。返回这一局有没有让黑潮开放
    recordFreeWin(faction, aiLevel) {
      const p = read(), was = API.unlockInfo(5).open;
      if (!(faction >= 1 && faction <= 4) || aiLevel === 'easy' || !aiLevel) return false;
      p.free[faction] = (p.free[faction] || 0) + 1;
      write();
      return !was && API.unlockInfo(5).open;
    },
    // 下一关的 id（最后一关返回 null）
    next(id) { const ls = levels(), i = ls.findIndex(l => l.id === id); return i >= 0 && i + 1 < ls.length ? ls[i + 1].id : null; },
    // 通关了几关 / 一共几关
    progress() { const p = read(), ls = levels(); return { done: ls.filter(l => p.done[l.id]).length, total: ls.length }; },
    reset() { mem = blank(); try { const ls = store(); if (ls) ls.removeItem(KEY); } catch (e) { /* 忽略 */ } },
  };
  root.AWCampaignRun = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
