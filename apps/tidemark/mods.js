// 潮汐战线：扩展（全局 AWMods）。给做扩展的人看的说明在 mods/README.md。
// 约定：mods/mods.js 写 window.AWModList = ['扩展 id', …]；每个扩展在 mods/<id>/mod.js 里调 AWMods.register({...})。
// 加载点（file:// 下可用，不用 fetch）：
//   1. index.html 最前面加载本文件和 mods/mods.js，再用 AWMods.writeTags() 同步写出各扩展的 <script>；
//   2. maps.js 汇总地图前调 AWMods.applyMaps()；data.js 末尾调 AWMods.applyData(D)（core.js 还没加载，它的各种表会带上扩展的内容）；
//   3. 词典加载后、数据表本地化前调 AWMods.applyText()（词条、新指挥官的故事）。
// 一个扩展出错只跳过它自己。node 里（测试）用 AWMods.loadNode() 代替第 1 步。
(function (root) {
  const M = {};
  M.GAME_VERSION = '1.0';      // 游戏版本号的唯一来源（标题画面左下角的 Ver. 也读它）
  M.GAME_ID = 'dsh-game-tidemark';
  const list = [];             // 按 AWModList 的顺序：{ id, state: 'ok' | 'skipped', why, def, adds: {…}, notes: [] }
  const byId = {};
  const notes = [];            // 全局提示（同名冲突等）
  let cur = null;              // 正在加载的扩展 id
  const say = t => { try { if (root.console) root.console.warn('[扩展] ' + t); } catch (e) { /* 忽略 */ } };
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const str = v => typeof v === 'string' && v.length > 0;

  function entry(id) { return byId[id] || (byId[id] = list[list.push({ id, state: 'pending', why: '', def: null, adds: {}, notes: [] }) - 1]); }
  // 给玩家看的文字（跳过原因、提示）存成 { src, vars }：src 是带 {占位符} 的中文原文，界面显示时再按当前语言拼（M.text(x, t)）；
  // vars 的值也可以是这种对象。zh(x) 直接拼成中文（控制台、没有翻译函数时用）。
  const tx = (src, vars) => ({ src, vars: vars || null });
  const fillT = (x, t) => { if (!x || typeof x !== 'object' || !x.src) return x == null ? '' : String(x); const v = {}; for (const k in x.vars || {}) v[k] = fillT(x.vars[k], t); return t ? t(x.src, v) : x.src.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)); };
  const zh = x => fillT(x, null);
  function E(src, vars) { const e = new Error(zh(tx(src, vars))); e.tx = tx(src, vars); return e; }
  const errT = err => (err && err.tx ? err.tx : err && err.message ? err.message : String(err));
  M.text = fillT;
  function skip(id, why) { const e = entry(id); e.state = 'skipped'; e.whyT = why; e.why = zh(why); e.def = null; say(id + ' 已跳过：' + e.why); }

  // 版本：'1.0'（正好这一版）、'1.x'（1 开头的都行）、'*'（都行）；也可以给数组，对上一个就算
  M.versionOk = function (want) {
    if (Array.isArray(want)) return want.some(M.versionOk);
    if (!str(want)) return false;
    if (want === '*') return true;
    const a = want.split('.'), b = M.GAME_VERSION.split('.');
    if (a[0] !== b[0]) return false;
    return a[1] === undefined || a[1] === 'x' || a[1] === '*' || a[1] === b[1];
  };

  // 效果字段的白名单（指挥官的 mods / rules / fx 能写什么）。applyData 时按现有 29 位指挥官和科技用到的键补全
  const MOD_KEYS = ['on', 'not', 'atk', 'def', 'move', 'vision', 'range', 'cost', 'capture', 'hold', 'repair', 'carry', 'counterAtk', 'counterCut', 'defOn', 'atkOn', 'vs', 'repairOn'];
  const CLASSES = ['all', 'inf', 'land', 'vehicle', 'direct', 'indirect', 'tank', 'tread', 'air', 'heli', 'plane', 'ship', 'melee', 'wheel'];
  let RULE_KEYS = null, FX_KEYS = null;
  M.effectKeys = () => ({ mods: MOD_KEYS.slice(), classes: CLASSES.slice(), rules: RULE_KEYS ? Object.keys(RULE_KEYS).sort() : [], fx: FX_KEYS ? Object.keys(FX_KEYS).sort() : [] });

  // ── 登记 ──
  // 扩展在自己的 mod.js 里调。字段见 mods/README.md。这里只做检查和存下来，真正并进游戏在 apply* 里
  M.register = function (def) {
    const id = cur || (def && def.id);
    try {
      if (!isObj(def)) throw E('register 要传一个对象');
      if (!str(def.id) || !/^[a-z0-9][a-z0-9-]*$/.test(def.id)) throw E('id 只能用小写字母、数字和连字符');
      if (cur && def.id !== cur) throw E('id「{a}」和文件夹名「{b}」不一致', { a: def.id, b: cur });
      if (byId[def.id] && byId[def.id].state !== 'pending') throw E('同一个 id 重复登记');
      if (!str(def.name)) throw E('缺 name');
      if (!str(def.version)) throw E('缺 version');
      if (!M.versionOk(def.gameVersion)) throw E('适用版本 {a} 和游戏版本 {b} 对不上', { a: JSON.stringify(def.gameVersion), b: M.GAME_VERSION });
      check(def);
      const e = entry(def.id); e.def = def; e.state = 'ok';
    } catch (err) { skip(id || '(no id)', errT(err)); }
  };
  function check(def) {
    for (const k of ['maps', 'cos', 'langs']) if (def[k] != null && !Array.isArray(def[k])) throw E('{a} 必须是数组', { a: k });
    for (const k of ['i18n', 'balance', 'lore']) if (def[k] != null && !isObj(def[k])) throw E('{a} 必须是对象', { a: k });
    for (const m of def.maps || []) {
      if (!isObj(m) || !str(m.name)) throw E('地图缺 name');
      const rows = m.rows || m.half;
      if (!Array.isArray(rows) || !rows.length || rows.some(r => typeof r !== 'string' || r.length !== rows[0].length)) throw E('地图「{a}」的 rows / half 必须是等宽的字符串数组', { a: m.name });
    }
    for (const c of def.cos || []) {
      if (!isObj(c) || !str(c.id) || !/^[a-z0-9_]+$/.test(c.id)) throw E('指挥官缺 id（小写字母、数字、下划线）');
      for (const k of ['name', 'title', 'power', 'desc', 'passive']) if (!str(c[k])) throw E('指挥官「{a}」缺 {b}', { a: c.id, b: k });
      if (!(c.faction >= 1 && c.faction <= 5)) throw E('指挥官「{a}」的 faction 必须是 1–5', { a: c.id });
      if (c.mods != null && !Array.isArray(c.mods)) throw E('指挥官「{a}」的 mods 必须是数组', { a: c.id });
      for (const md of c.mods || []) {
        if (!isObj(md) || md.on == null) throw E('指挥官「{a}」的 mods 每项要有 on', { a: c.id });
        for (const k in md) if (!MOD_KEYS.includes(k)) throw E('指挥官「{a}」的 mods 里有无法识别的字段 {b}', { a: c.id, b: k });
        for (const sel of [md.on, md.not]) if (typeof sel === 'string' && !CLASSES.includes(sel)) throw E('指挥官「{a}」的 mods 里有无法识别的兵种类别 {b}', { a: c.id, b: sel });
      }
      for (const k of ['rules', 'fx']) if (c[k] != null && !isObj(c[k])) throw E('指挥官「{a}」的 {b} 必须是对象', { a: c.id, b: k });
      // 技能里的攻击、防御、移动要写成 [{ on, v }]（和游戏自带的一样）；写成一个数的话游戏不认，这里直接拦下
      for (const k of ['atk', 'def', 'move']) if (c.fx && c.fx[k] != null) {
        if (!Array.isArray(c.fx[k]) || c.fx[k].some(x => !isObj(x) || x.on == null || typeof x.v !== 'number')) throw E('指挥官「{a}」的 fx.{b} 要写成 [{ on, v }]', { a: c.id, b: k });
        for (const x of c.fx[k]) if (typeof x.on === 'string' && !CLASSES.includes(x.on)) throw E('指挥官「{a}」的 fx.{b} 里有无法识别的兵种类别 {c}', { a: c.id, b: k, c: x.on });
      }
    }
    for (const l of def.langs || []) if (!isObj(l) || !str(l.id) || !str(l.name)) throw E('语言缺 id 或 name');
    const b = def.balance;
    if (b) {
      for (const k in b) if (!['units', 'damage'].includes(k)) throw E('balance 里有无法识别的字段 {a}', { a: k });
      for (const u in b.units || {}) for (const f in b.units[u]) if (!['cost', 'move', 'vision', 'range', 'ore'].includes(f)) throw E('balance.units.{a} 里不能改 {b}', { a: u, b: f });
    }
  }

  // ── 浏览器：写出各扩展的 <script> ──
  M._begin = id => { cur = id; entry(id); };
  M._fail = id => skip(id, tx('找不到 mods/{id}/mod.js', { id }));
  M._end = id => { cur = null; const e = entry(id); if (e.state === 'pending') skip(id, tx('mod.js 没有调用 AWMods.register（脚本出错，或者 id 不一致）')); };
  M.base = 'mods/';
  M.ids = () => (Array.isArray(root.AWModList) ? root.AWModList.filter((x, i, a) => str(x) && a.indexOf(x) === i) : []);
  M.writeTags = function () {
    if (!root.document || !root.document.write) return;
    for (const id of M.ids()) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) { skip(id, tx('扩展 id 里有不能使用的字符')); continue; }
      root.document.write('<script>AWMods._begin(' + JSON.stringify(id) + ')<\/script><script src="' + M.base + id + '/mod.js" onerror="AWMods._fail(' + JSON.stringify(id).replace(/"/g, '&quot;') + ')"><\/script><script>AWMods._end(' + JSON.stringify(id) + ')<\/script>');
    }
  };
  // node（测试）：dir 是放 mods.js 和各扩展文件夹的目录
  M.loadNode = function (dir) {
    const fs = require('fs'), path = require('path');
    const lf = path.join(dir, 'mods.js');
    root.window = root.window || root;
    if (fs.existsSync(lf)) { try { delete require.cache[require.resolve(lf)]; require(lf); } catch (e) { say('mods.js 读不了：' + e.message); } }
    for (const id of M.ids()) {
      const f = path.join(dir, id, 'mod.js');
      M._begin(id);
      if (!fs.existsSync(f)) M._fail(id);
      else { try { delete require.cache[require.resolve(f)]; require(f); } catch (e) { skip(id, tx('mod.js 出错：{msg}', { msg: e.message })); } }
      M._end(id);
    }
  };

  const live = () => list.filter(e => e.state === 'ok' && e.def);
  function guard(e, what, fn) { try { fn(); } catch (err) { e.adds = {}; dropMaps(e.id); skip(e.id, tx('{what}时出错：{msg}', { what: tx(what), msg: errT(err) })); } }
  // 后面的步骤才查出毛病的扩展：它已经并进来的地图也拿掉（被它顶掉的同名图不会回来）
  function dropMaps(id) { for (const arr of [root.AWMaps, root.AWMapList]) if (Array.isArray(arr)) for (let i = arr.length - 1; i >= 0; i--) if (arr[i] && arr[i].mod === id) arr.splice(i, 1); }
  function note(e, t) { const z = zh(t); e.notes.push(z); (e.notesT || (e.notesT = [])).push(t); notes.push(e.def.name + '：' + z); say(e.id + '：' + z); }
  const add = (e, k, n) => { e.adds[k] = (e.adds[k] || 0) + n; };

  // ── 地图：maps.js 汇总前调 ──
  M.applyMaps = function (mapList) {
    if (!mapList) return;
    for (const e of live()) guard(e, '加地图', () => {
      for (const m of e.def.maps || []) {
        const def = Object.assign({}, m, { mod: e.id, modName: e.def.name });
        if (def.order == null) def.order = 200;
        const i = mapList.findIndex(x => x.name === def.name);
        if (i >= 0) { note(e, mapList[i].mod ? tx('地图「{name}」和扩展「{mod}」的名字相同，已换成这一张', { name: def.name, mod: mapList[i].modName }) : tx('地图「{name}」和游戏自带的名字相同，已换成这一张', { name: def.name })); mapList[i] = def; } else mapList.push(def);
        add(e, 'maps', 1);
      }
    });
  };

  // ── 数据：data.js 末尾调（core.js 之前）──
  M.applyData = function (D) {
    if (!D || M._dataDone === D) return;
    M._dataDone = D;
    RULE_KEYS = {}; FX_KEYS = {};
    for (const c of D.COS) { for (const k in c.rules || {}) RULE_KEYS[k] = 1; for (const k in c.fx || {}) FX_KEYS[k] = 1; for (const k in c.fxAlt || {}) FX_KEYS[k] = 1; }
    for (const t of D.TECH || []) { for (const k in t.rules || {}) RULE_KEYS[k] = 1; for (const k in t.fx || {}) FX_KEYS[k] = 1; }
    for (const e of live()) guard(e, '改数据', () => {
      const def = e.def, b = def.balance || {};
      // 先整个查一遍，查不过就什么都不改
      for (const u in b.units || {}) if (!D.UNITS[u]) throw E('balance.units 里没有这个兵种：{a}', { a: u });
      for (const a in b.damage || {}) { if (!D.DMG[a]) throw E('balance.damage 里没有这个兵种：{a}', { a: a }); for (const t in b.damage[a]) if (!(t in D.DMG[a])) throw E('balance.damage.{a} 里没有这个兵种：{b}', { a: a, b: t }); }
      for (const c of def.cos || []) {
        for (const k in c.rules || {}) if (!RULE_KEYS[k]) throw E('指挥官「{a}」的 rules 里有无法识别的效果 {b}', { a: c.id, b: k });
        for (const k in c.fx || {}) if (!FX_KEYS[k]) throw E('指挥官「{a}」的 fx 里有无法识别的效果 {b}', { a: c.id, b: k });
        for (const md of c.mods || []) for (const sel of [md.on, md.not]) if (Array.isArray(sel)) for (const u of sel) if (!D.UNITS[u]) throw E('指挥官「{a}」的 mods 里没有这个兵种：{b}', { a: c.id, b: u });
        for (const u of (c.good || []).concat(c.bad || [])) if (!D.UNITS[u]) throw E('指挥官「{a}」的 good / bad 里没有这个兵种：{b}', { a: c.id, b: u });
      }
      for (const u in b.units || {}) { for (const f in b.units[u]) D.UNITS[u][f] = b.units[u][f]; add(e, 'units', 1); }
      for (const a in b.damage || {}) for (const t in b.damage[a]) { D.DMG[a][t] = b.damage[a][t]; add(e, 'damage', 1); }
      for (const c of def.cos || []) {
        const co = { id: c.id, name: c.name, title: c.title, group: c.group || '奇策', faction: c.faction, power: c.power, desc: c.desc, passive: c.passive,
          good: c.good || [], bad: c.bad || [], mods: c.mods || [], mod: e.id, modName: def.name };
        if (c.rules) co.rules = c.rules; if (c.ai) co.ai = c.ai;
        co.fx = Object.assign({ ai: 'attack' }, c.fx || {}); // 没写电脑什么时候放技能的，按「够多的部队打得到人时」
        const i = D.COS.findIndex(x => x.id === c.id);
        if (i >= 0) { note(e, D.COS[i].mod ? tx('指挥官「{name}」和扩展「{mod}」的 id 相同，已换成这一位', { name: c.id, mod: D.COS[i].modName }) : tx('指挥官「{name}」和游戏自带的 id 相同，已换成这一位', { name: c.id })); D.COS[i] = co; } else D.COS.push(co);
        if (c.portrait) portraits[c.id] = { base: M.base + e.id + '/', set: typeof c.portrait === 'string' ? { normal: c.portrait } : c.portrait };
        add(e, 'cos', 1);
      }
    });
  };

  // ── 文字：词典加载之后、数据表本地化之前调 ──
  M.langs = () => { const out = []; for (const e of live()) for (const l of e.def.langs || []) out.push(Object.assign({ html: l.id, wide: 1.8, font: 'sans-serif' }, l, { mod: e.id })); return out; };
  M.applyText = function () {
    const I = root.AWI18n, L = root.AWLore;
    for (const e of live()) guard(e, '加文字', () => {
      const t = e.def.i18n || {};
      if (I && I.add) for (const lang in t) { I.add(lang, t[lang]); add(e, 'words', Object.keys(t[lang]).length); }
      for (const l of e.def.langs || []) add(e, 'langs', 1);
      if (L && L.cos) for (const c of e.def.cos || []) L.cos[c.id] = Object.assign({ quote: '', bio: '', style: '', role: '', ties: [] }, L.cos[c.id] || {}, c.lore || {});
    });
  };

  // ── 头像：portraits.js 是后加载的，等它一出现就接上扩展自带的图 ──
  const portraits = {}, imgs = {};
  function modPortrait(id, mood) {
    const p = portraits[id]; if (!p || !root.Image) return undefined;
    const file = p.set[mood] || p.set.normal; if (!file) return null;
    const k = id + '|' + file;
    let im = imgs[k];
    if (!im) { im = imgs[k] = new root.Image(); im.src = p.base + file; }
    return im.complete && im.naturalWidth ? im : null;
  }
  function wrapPortraits(P) {
    if (!P || P._mods) return P;
    const get = P.get, hi = P.hi;
    P.get = function (id, mood) { const r = modPortrait(id, mood); return r === undefined ? get.call(P, id, mood) : r; };
    P.hi = function (id, mood) { const r = modPortrait(id, mood); return r === undefined ? hi.call(P, id, mood) : r; };
    if (Array.isArray(P.ids)) for (const id in portraits) if (!P.ids.includes(id)) P.ids.push(id);
    if (P.own) { const own = P.own; P.own = function (id) { return portraits[id] ? false : own.call(P, id); }; }   // 扩展换过图的指挥官走上面的 get / hi，不走按需加载的地址
    P._mods = true;
    return P;
  }
  try {
    let held = root.AWPortraits;
    Object.defineProperty(root, 'AWPortraits', { configurable: true, enumerable: true, get() { return held; }, set(v) { held = wrapPortraits(v); } });
    if (held) wrapPortraits(held);
  } catch (e) { /* 定义不了就算了：扩展的指挥官用游戏的默认头像 */ }

  // ── 查询 ──
  // 全部扩展（界面的列表用）：[{ id, name, version, author, desc, state: 'ok' | 'skipped', why, adds: { maps, cos, words, langs, units, damage }, notes }]
  M.list = () => list.map(e => ({ id: e.id, name: e.def ? e.def.name : e.id, version: e.def ? e.def.version : '', author: e.def ? e.def.author || '' : '', desc: e.def ? e.def.desc || '' : '',
    state: e.state === 'ok' ? 'ok' : 'skipped', why: e.why, whyT: e.whyT, adds: Object.assign({}, e.adds), notes: e.notes.slice(), notesT: (e.notesT || []).slice() }));
  M.notes = () => notes.slice();
  // 正在起作用的扩展：[{ id, version }]（存档里记的就是它）
  M.active = () => live().map(e => ({ id: e.id, version: e.def.version }));
  // 有没有改规则的扩展（指挥官、数值）：对局里要不要挂“已启用扩展”的标记看它
  M.changesRules = () => live().some(e => (e.adds.cos || 0) + (e.adds.units || 0) + (e.adds.damage || 0) > 0);
  M.coIds = () => { const out = []; for (const e of live()) for (const c of e.def.cos || []) out.push(c.id); return out; };
  // 存档里记着的扩展现在还在不在：返回缺的那些 [{ id, version }]
  M.missing = function (saved) { const have = {}; for (const a of M.active()) have[a.id] = 1; return (saved || []).filter(x => x && !have[x.id]); };

  root.AWMods = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
