// 潮汐战线：规则核心 + 电脑 AI（不依赖浏览器，可在 node 里跑模拟）
// 2–4 个阵营、可结盟，接口约定见 tools/MULTI-SPEC.md。state 是纯数据（s.ai 是电脑的临时缓存，存档时去掉）。
(function (root) {
  const D = root.AWData || require('./data.js');
  const C = { rand: Math.random };
  // 给玩家看的文字统一走 tr()：有 AWI18n 就查当前语言，没有（node 里跑模拟、测试）就原样返回中文并填 {占位符}。见 tools/I18N.md。
  const tr = (src, vars, ctx) => { const I = root.AWI18n; if (I && I.t) return I.t(src, vars, ctx); return vars ? src.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : src; };
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const INF = Infinity;
  // 指挥官技能数值（改这里要同步改 data.js 里 D.COS 的 desc）
  const PW = {
    blitzMove: 3, blitzFoot: 1, blitzAtk: 0.3, wallHeal: 20, wallDef: 0.2, goldPer: 80, goldIncome: 0.2, stormDmg: 10, stormRange: 0,
    stormFold: [0, 10, 8, 7], // 炮火覆盖：敌对阵营有 1 / 2 / 3 家时每个单位掉多少 HP
    tideHeal: 30, tideAll: 20, tideMove: 2, tideAllMove: 1, tideShore: 0.3, tideDef: 0.1, // 怒潮：船 / 其余单位回血，船 / 其余单位加移动力，船打陆军加伤害，到下回合前全军加防御
    skyMove: 2, skyAtk: 0.5, skyAll: 0.3, skyAllMove: 2, // 俯冲：飞机加移动力和攻击、本回合打谁都不挨反击；其余单位也加一点攻击和移动力
    militiaHp: 100, militiaMax: 4, // 全民皆兵：最多几座空城各出一个步兵、出来时的 HP
    ironAtk: 0.5, ironMove: 2, ironDef: 0.2, // 履带洪流另加：到下回合前坦克防御 // 履带洪流：坦克攻击加成；另外坦克打完一次后 u.fired = true、u.moved 变回 false，可以再移动，不能再打
  };
  C.powerParams = PW;
  // 后手补贴：按行动顺序第 k 个行动的阵营开局多拿多少资金（下标 = 阵营编号）。地图可用 def.handicap 覆盖
  const HANDICAP = { 2: [0, 0, 300], 3: [0, 0, 300, 600], 4: [0, 0, 300, 600, 900] };
  C.handicap = HANDICAP;
  // 人数补偿（s.rules.handicap）：队伍比人数最多的队伍每少一个阵营，队里每个阵营开局多 funds 资金、
  // 每回合固定多拿相当于 cities 座城市的收入（固定额度，不随建筑数膨胀）。
  // cap > 0 时再加一道封顶：补完以后的收入不超过“最大那支敌对队伍全队收入之和”的 cap 成；默认 0 = 不用这道封顶
  const TEAM_HC = { funds: 1200, cities: 10, cap: 0 };
  C.teamHandicap = TEAM_HC;
  const DEFAULT_CO = [null, 'blitz', 'wall', 'gold', 'storm'];
  // 对局选项的默认值（s.rules）。旧存档没有 s.rules，一律按默认值
  const RULES = { fog: false, startFunds: 0, income: 100, powers: true, dayLimit: 0, aiLevel: 'normal', handicap: true, coPassives: true, loot: true, tech: true, ore: true };
  C.defaultRules = RULES;
  const rulesOf = s => s.rules || RULES;
  const fogOn = s => !!(s.rules && s.rules.fog);
  // “有东西看不见”：开了迷雾，或者场上有潜行的指挥官（rules.stealth）、有人开着灯火管制（fx.blackout）。
  // 凡是“看不看得见单位”的判断都用它；“格子亮不亮”只看迷雾。定义在后面（要用到指挥官表）
  let veilOn = fogOn;
  C.aiLevel = function (s, p) { return (s.aiLevels && s.aiLevels[p]) || rulesOf(s).aiLevel || 'normal'; };

  // ── 阵营与队伍 ──
  const nP = s => s.players || (s.funds ? s.funds.length - 1 : 2);
  const aliveP = (s, p) => !s.alive || s.alive[p] !== false;
  const teamOf = (s, p) => (s.team ? s.team[p] : p);
  // 两个阵营是否敌对（0 是中立，和谁都不敌对）
  C.isEnemy = function (s, p, q) { return p !== q && p > 0 && q > 0 && teamOf(s, p) !== teamOf(s, q); };
  C.alivePlayers = function (s) {
    const out = [];
    for (let p = 1, n = nP(s); p <= n; p++) if (aliveP(s, p)) out.push(p);
    return out;
  };
  C.enemiesOf = function (s, p) { return C.alivePlayers(s).filter(q => C.isEnemy(s, p, q)); };
  // 下一个行动的阵营：1→2→…→N 循环，跳过已淘汰的
  C.nextPlayer = function (s) {
    const n = nP(s);
    for (let i = 1; i <= n; i++) { const q = (s.turn - 1 + i) % n + 1; if (aliveP(s, q)) return q; }
    return s.turn;
  };
  // 旧存档（两方时代）读进来缺多阵营字段，用到时补上
  function ensure(s) {
    if (s.alive && s.team && s.players) return s;
    const n = nP(s);
    s.players = n;
    if (!s.team) { s.team = [0]; for (let p = 1; p <= n; p++) s.team.push(p); }
    if (!s.alive) { s.alive = [false]; for (let p = 1; p <= n; p++) s.alive.push(true); }
    if (!s.winners) s.winners = s.winner ? [s.winner] : [];
    if (!s.log) s.log = [];
    return s;
  }

  // ── 指挥官常驻修正 ──
  // D.COS[i].mods 按兵种展开成一张表：MODS[指挥官][兵种] = { atk, def, move, vision, range, cost, capture, hold, repair }
  const CLS = {
    all: () => true,
    inf: (k, U) => U.mt === 'foot' || U.mt === 'mech' || k === 'bik',
    land: (k, U) => !U.air && !U.ship,
    vehicle: (k, U) => !U.air && !U.ship && !CLS.inf(k, U),
    direct: (k, U) => CLS.vehicle(k, U) && !!U.range && U.range[1] === 1,
    indirect: (k, U) => !!U.range && U.range[1] > 1,
    tank: k => k === 'tnk' || k === 'med' || k === 'hvy',
    tread: (k, U) => U.mt === 'tread' && k !== 'bik',
    air: (k, U) => !!U.air,
    heli: k => k === 'cop' || k === 'tcp',
    plane: (k, U) => !!U.air && k !== 'cop' && k !== 'tcp', // 固定翼
    ship: (k, U) => !!U.ship,
    melee: (k, U) => !!U.range && U.range[1] === 1, // 直射单位：射程只有 1 的（步兵、坦克、直升机、炮艇……）
    wheel: (k, U) => U.mt === 'wheel', // 轮式车辆
  };
  // on 可以是类别名，或兵种 id 的数组；数组里以 @ 开头的是类别名（合并指挥官和科技的规则时会出现，如 ['@melee', 'snp']）
  const inCls = (on, k, U) => {
    if (!Array.isArray(on)) return CLS[on](k, U);
    for (let i = 0; i < on.length; i++) { const x = on[i]; if (x === k || (x.charCodeAt(0) === 64 && CLS[x.slice(1)](k, U))) return true; }
    return false;
  };
  // defOn：{ 地形: 防御增减 }（prop = 任何建筑）；repairOn：{ 建筑: 修理费倍数 }。没有就是 null
  const NOMOD = Object.freeze({ atk: 0, def: 0, move: 0, vision: 0, range: 0, cost: 0, capture: 1, hold: 0, repair: 1, carry: 0, counterAtk: 0, counterCut: 0, defOn: null, repairOn: null, vs: null, atkOn: null });
  // 把一串 mods 按兵种展开成表
  function buildTable(list) {
    const tb = {};
    for (const k of D.ORDER) {
      const U = D.UNITS[k], m = Object.assign({}, NOMOD);
      for (const md of list) {
        if (!inCls(md.on, k, U) || (md.not && inCls(md.not, k, U))) continue;
        for (const f in md) {
          if (f === 'on' || f === 'not') continue;
          if (f === 'capture' || f === 'repair') m[f] *= md[f];
          else if (f === 'defOn') { m.defOn = Object.assign({}, m.defOn); for (const t in md.defOn) m.defOn[t] = (m.defOn[t] || 0) + md.defOn[t]; }
          else if (f === 'atkOn') { m.atkOn = Object.assign({}, m.atkOn); for (const t in md.atkOn) m.atkOn[t] = (m.atkOn[t] || 0) + md.atkOn[t]; }
          else if (f === 'vs') { m.vs = Object.assign({}, m.vs); for (const t in md.vs) m.vs[t] = (m.vs[t] || 0) + md.vs[t]; }
          else if (f === 'repairOn') { m.repairOn = Object.assign({}, m.repairOn); for (const t in md.repairOn) m.repairOn[t] = (m.repairOn[t] == null ? 1 : m.repairOn[t]) * md.repairOn[t]; }
          else m[f] += md[f];
        }
      }
      tb[k] = Object.freeze(m);
    }
    return tb;
  }
  const MODS = {}, COFLAG = {}; // COFLAG[指挥官] = { cityIncome }：按阵营算的、不分兵种的东西
  for (const co of D.COS) {
    const fac = (D.FACTIONS && D.FACTIONS[co.faction]) || null;
    COFLAG[co.id] = { cityIncome: (fac && fac.cityIncome) || 0 };
    MODS[co.id] = buildTable(((fac && fac.mods) || []).concat(co.mods || [])); // 阵营底色 + 指挥官个人
  }
  const COBY = {}; for (const co of D.COS) COBY[co.id] = co;
  const NOR = Object.freeze({});
  // ── 科技：已完成的科技把 mods / rules 叠在指挥官的后面 ──
  const TECH = {}; for (const t of D.TECH || []) TECH[t.id] = t;
  const techOn = s => !!D.TECH && !(s.rules && s.rules.tech === false);
  // 两份 rules 合并：数字相加（capNoFog 相乘）、数组相接、对象逐项合并（buildCapOn 取大）、选择器（hitRun 等）并成一个列表、luck 以后者为准
  const SELKEYS = { hitRun: 1, killAgain: 1, moveFire: 1, splashBy: 1, pass: 1, burn: 1, capBy: 1, revealBy: 1, dropAct: 1 };
  const selList = v => (Array.isArray(v) ? v : ['@' + v]);
  function mergeRules(a, b, mode) {
    const o = Object.assign({}, a);
    for (const k in b) {
      const x = o[k], y = b[k];
      if (x == null) o[k] = y;
      else if (k === 'luck') o[k] = y;
      else if (SELKEYS[k]) o[k] = selList(x).concat(selList(y));
      else if (typeof x === 'number' && typeof y === 'number') o[k] = mode === 'max' ? Math.max(x, y) : k === 'capNoFog' ? x * y : x + y;
      else if (Array.isArray(x) && Array.isArray(y)) o[k] = x.concat(y);
      else if (typeof x === 'object' && typeof y === 'object') o[k] = mergeRules(x, y, k === 'buildCapOn' ? 'max' : mode);
      else o[k] = x || y;
    }
    return o;
  }
  // 技能效果（fx）的合并：选择器并成一个列表、[{ on, v }] 数组相接、对象逐项合并、单个数值以后者为准
  const FXSEL = { again: 1, noCounter: 1, pass: 1, burn: 1, sure: 1, splashBy: 1, killAgain: 1, moveFire: 1, overwatch: 1 };
  function mergeFx(a, b) {
    const o = Object.assign({}, a);
    for (const k in b) {
      const x = o[k], y = b[k];
      if (x == null) o[k] = y;
      else if (FXSEL[k]) o[k] = selList(x).concat(selList(y));
      else if (Array.isArray(x) && Array.isArray(y)) o[k] = x.concat(y);
      else if (typeof x === 'object' && typeof y === 'object' && !Array.isArray(y)) o[k] = Object.assign({}, x, y);
      else o[k] = y;
    }
    return o;
  }
  // 这个阵营“指挥官 + 已完成科技”合起来的修正表、规则、技能效果和技能参数。没有完成任何科技（或没开科技）时返回 null，走原来的静态表
  const TCACHE = new WeakMap(); // s.tech[p] → { n, last, co, cp, pw, mods, rules, fx, PW, ex }
  function techPack(s, p) {
    const t = s.tech && s.tech[p];
    if (!t) return null;
    const n = t.done.length;
    if (!n || !techOn(s)) return null;
    const cp = !(s.rules && s.rules.coPassives === false), pw = !(s.rules && s.rules.powers === false), co = s.co[p];
    let e = TCACHE.get(t);
    const fq = (s.factionOf && s.factionOf[p]) || 0;
    if (e && e.n === n && e.last === t.done[n - 1] && e.co === co && e.cp === cp && e.pw === pw && e.fq === fq) return e;
    const c = COBY[co], fac = c && D.FACTIONS && D.FACTIONS[facOf(s, p)];
    let list = cp ? ((fac && fac.mods) || []).concat((c && c.mods) || []) : [], rules = cp && c && c.rules ? c.rules : null, cnt = 0;
    let fx = (c && c.fx) || null, P = null, ex = null;
    for (const id of t.done) {
      const T = TECH[id];
      if (!T) continue;
      if (T.tree === 'co' && (T.co !== co || (T.tier < 3 ? !cp : !pw))) continue; // 指挥官线：一、二级跟常驻开关走，三级跟技能开关走
      cnt++;
      if (T.mods) list = list.concat(T.mods);
      if (T.rules) rules = rules ? mergeRules(rules, T.rules) : T.rules;
      if (T.fx) fx = fx ? mergeFx(fx, T.fx) : T.fx;
      if (T.pw) P = Object.assign(P || Object.assign({}, PW), T.pw);
      if (T.tree === 'co' && T.tier === 3) ex = T;
    }
    e = { n, last: t.done[n - 1], co, cp, pw, fq, mods: cnt || cp ? buildTable(list) : null, rules: rules || NOR, fx: fx || NOR, PW: P || PW, ex };
    TCACHE.set(t, e);
    return e;
  }
  // 技能参数：研究了“· 极”的阵营可能和 C.powerParams 不一样
  function pwOf(s, p) { const e = s.tech ? techPack(s, p) : null; return e ? e.PW : PW; }
  // 这个阵营现在的技能叫什么、说明是什么（研究了指挥官线三级就是“原名 · 极”）
  C.powerInfo = function (s, p) {
    const c = COBY[s.co[p]], e = s.tech ? techPack(s, p) : null;
    if (!c) return { name: '', desc: '', extreme: false };
    return e && e.ex ? { name: e.ex.name, desc: e.ex.desc, extreme: true } : { name: c.power, desc: c.desc, extreme: false };
  };
  // 没有科技时的修正表。席位指定的阵营和指挥官所属的阵营不一样（战役里的客座指挥官）时，阵营底色按席位的算
  const MODS2 = {};
  function staticMods(s, p) {
    const co = s.co[p], f = s.factionOf && s.factionOf[p], c = COBY[co];
    if (!f || !c || c.faction === f) return MODS[co];
    const k = co + '|' + f;
    return MODS2[k] || (MODS2[k] = buildTable(((D.FACTIONS[f] && D.FACTIONS[f].mods) || []).concat(c.mods || [])));
  }
  function modOf(s, p, type) {
    const e = s.tech ? techPack(s, p) : null;
    if (e) return (e.mods && e.mods[type]) || NOMOD;
    if (s.rules && s.rules.coPassives === false) return NOMOD;
    const tb = staticMods(s, p);
    return (tb && tb[type]) || NOMOD;
  }
  // 指挥官的规则标志（D.COS[i].rules，常驻）和技能效果（D.COS[i].fx，技能开着时生效）。都是只读的纯数据。已完成的科技的 rules 合并在里面
  function ruleOf(s, p) {
    const e = s.tech ? techPack(s, p) : null;
    if (e) return e.rules;
    if (s.rules && s.rules.coPassives === false) return NOR;
    const c = COBY[s.co[p]];
    return (c && c.rules) || NOR;
  }
  function fxOf(s, p) {
    if (!s.powerOn[p]) return NOR;
    if (s.powerOn[p] === 'alt') { const c0 = COBY[s.co[p]]; return (c0 && c0.fxAlt) || NOR; } // 技能走了“换成另一组效果”的那条路（点灯找不到可挑拨的一对时）
    const e = s.tech ? techPack(s, p) : null;
    if (e) return e.fx;
    const c = COBY[s.co[p]];
    return (c && c.fx) || NOR;
  }
  veilOn = function (s) {
    if (s.rules && s.rules.fog) return true;
    if (!s.co) return false;
    for (let p = 1, n = nP(s); p <= n; p++) {
      if (!aliveP(s, p)) continue;
      if (ruleOf(s, p).stealth || ruleOf(s, p).hideProp || fxOf(s, p).blackout) return true;
    }
    return !!s.cloak;
  };
  C.veilOn = function (s) { return veilOn(s); };
  C.coRules = function (s, p) { return ruleOf(s, p); };
  C.powerFx = function (s, p) { return fxOf(s, p); };
  // fx / rules 里按兵种类别给的数值：[{ on, v }, …] 里所有匹配项相加
  function fxSum(list, k, U) {
    if (!list) return 0;
    let v = 0;
    for (const e of list) if (inCls(e.on, k, U)) v += e.v;
    return v;
  }
  const fxHas = (on, k) => !!on && inCls(on, k, D.UNITS[k]);
  // p 的指挥官给这个兵种的常驻修正（只读）。没有指挥官、或 rules.coPassives 关闭时全是中性值
  C.coMods = function (s, p, type) { return modOf(s, p, type); };
  // p 造这个兵种的实际价格（指挥官可能加减造价）。界面的造兵菜单、修理费都按它算
  C.costOf = function (s, p, type) {
    const c = D.UNITS[type].cost, m = modOf(s, p, type).cost, k = fxOf(s, p).costMul || 1; // costMul：技能开着时造兵打折
    if (!m && k === 1) return c;
    const v = c * Math.max(0.6, (1 + m) * k) / 10; // 各种折扣合计最低到原价的六成
    return (ruleOf(s, p).costFloor ? Math.floor(v + 1e-9) : Math.round(v)) * 10; // 抹零：向下取整
  };
  const powerIs = (s, p, id) => s.powerOn[p] && s.co[p] === id;
  // 人数补偿：{ funds: 开局多拿的资金, income: 收入多几成 }。rules.handicap 不是 true（含旧存档）时都是 0
  C.handicapOf = function (s, p) {
    if (!s.rules || s.rules.handicap !== true || !s.team) return { funds: 0, income: 0 };
    const n = nP(s), size = {};
    let mx = 0;
    for (let q = 1; q <= n; q++) { const t = s.team[q]; size[t] = (size[t] || 0) + 1; if (size[t] > mx) mx = size[t]; }
    const d = mx - (size[s.team[p]] || mx);
    if (!d) return { funds: 0, income: 0 };
    // 收入补偿：固定金额，有上限
    const per = rulesOf(s).income, byTeam = {};
    let foe = 0;
    for (let q = 1; q <= n; q++) if (aliveP(s, q) && C.isEnemy(s, p, q)) { const t = s.team[q]; byTeam[t] = (byTeam[t] || 0) + rawIncome(s, q); if (byTeam[t] > foe) foe = byTeam[t]; }
    const room = TEAM_HC.cap > 0 ? Math.max(0, TEAM_HC.cap * foe - rawIncome(s, p)) : INF; // cap = 0：不按对面收入封顶，只有固定额度
    return { funds: d * TEAM_HC.funds, income: Math.floor(Math.min(d * TEAM_HC.cities * per, room) / 10) * 10 };
  };

  // ───────── 科技：状态、经费、结算、查询、操作（接口见 tools/MULTI-SPEC.md“科技”一节） ─────────
  // 研究点是一种攒着用的资源，存在 s.rp[p]；s.tech[p] 只记已解锁的科技（done）和经费档位（fund），外加几样记账
  // 经费档位默认是“停”：玩家没选之前不扣钱（“停”档每回合也有一点研究点）
  const newTech = () => ({ done: [], fund: 'stop' });
  const NOTECH = Object.freeze({ done: Object.freeze([]), fund: 'stop' });
  const rpHave = (s, p) => (s.rp && s.rp[p]) || 0;
  function rpAdd(s, p, n) { if (!s.rp) s.rp = [0]; while (s.rp.length <= nP(s)) s.rp.push(0); s.rp[p] += n; }
  // 旧存档（有研究队列的那一版）：队列里已经灌进去的点数、已经付过钱还没到账的点数，都退回池子
  function techFix(s) {
    if (!s.tech || s.techV === 2) return;
    for (let p = 1; p < s.tech.length; p++) {
      const t = s.tech[p]; if (!t) continue;
      let back = t.bank || 0;
      for (const q of t.queue || []) back += q.pts || 0;
      if (back) rpAdd(s, p, back);
      delete t.queue; delete t.bank; delete t.subBank; delete t.bankLv; delete t.paid; delete t.boostPts;
    }
    if (!s.rp) s.rp = [0]; while (s.rp.length <= nP(s)) s.rp.push(0);
    s.techV = 2;
  }
  const techGet = (s, p) => { techFix(s); return (s.tech && s.tech[p]) || NOTECH; }; // 只读；旧存档没有 s.tech 时按“什么都没研究”
  function techMut(s, p) {
    techFix(s);
    if (!s.tech) s.tech = [null];
    while (s.tech.length <= nP(s)) s.tech.push(newTech());
    return s.tech[p] || (s.tech[p] = newTech());
  }
  // 规则上按哪个阵营算（阵营特性、阵营科技树、研究方式）：席位指定了阵营就按席位的，否则按指挥官所属的阵营
  const facOf = (s, p) => { const f = s.factionOf && s.factionOf[p]; if (f) return f; const c = COBY[s.co[p]]; return c ? c.faction : 0; };
  const researchOf = (s, p) => { const f = D.FACTIONS && D.FACTIONS[facOf(s, p)]; return (f && f.research) || NOR; };
  // 地图系数：研究点需求和经费都乘它。地图可以用 def.techK 指定；没指定就按“每个阵营摊到多少格”分档（数值由 tools/econ.js 量出来的对局长度定）
  const TECHK = [[100, 0.6], [180, 0.9], [320, 1.2], [500, 1.4], [Infinity, 1.8]];
  function autoTechK(s) {
    const per = s.map.w * s.map.h / nP(s);
    for (const [lim, k] of TECHK) if (per <= lim) return k;
    return 1;
  }
  C.techScale = function (s) { return s.techK > 0 ? s.techK : 1; };
  C.techTiers = TECHK;
  const needOf = (s, T) => Math.max(5, Math.round(T.pts * C.techScale(s)));
  // p 能看到的科技：通用树 + 指挥官所属阵营的树 + 指挥官线
  function techsOf(s, p) {
    const f = facOf(s, p), co = s.co[p];
    return (D.TECH || []).filter(T => T.tree === 'common' || T.tree === f || (T.tree === 'co' && T.co === co));
  }
  // 状态和原因：done 已解锁 / open 现在就能解锁 / short 前置够了、研究点不够 / locked 上一级还没解锁 / barred 被二选一锁死 / off 被对局选项关掉
  function techState(s, p, T, t) {
    if (!techOn(s)) return ['off', tr('这一局没有开启科技')];
    if (T.tree === 'co') {
      if (T.tier < 3 && s.rules && s.rules.coPassives === false) return ['off', tr('这一局关闭了指挥官特长')];
      if (T.tier === 3 && s.rules && s.rules.powers === false) return ['off', tr('这一局关闭了指挥官技能')];
    }
    if (t.done.includes(T.id)) return ['done', ''];
    if (typeof T.tree === 'number' && T.tier === 3) { // 阵营树两条线的三级二选一
      const o = D.TECH.find(X => X.tree === T.tree && X.tier === 3 && X.line !== T.line);
      if (o && t.done.includes(o.id)) return ['barred', tr('和「{name}」只能选一个', { name: o.name })];
    }
    if (T.tier > 1) {
      const prev = D.TECH.find(X => X.line === T.line && X.tier === T.tier - 1);
      if (prev && !t.done.includes(prev.id)) return ['locked', tr('要先解锁「{name}」', { name: prev.name })];
    }
    const lack = needOf(s, T) - rpHave(s, p);
    return lack > 0 ? ['short', tr('研究点不足（还需 {n}）', { n: lack })] : ['open', ''];
  }
  // 经费档位（已算地图系数和阵营的研究方式）
  function fundsOf(s, p) {
    const r = researchOf(s, p), K = C.techScale(s), f = facOf(s, p);
    return (D.FUNDS || []).filter(x => !x.only || x.only === f).map(x => ({ id: x.id, name: x.name, cost: Math.round(x.cost * K * (r.costMul || 1) / 10) * 10, pts: Math.max(0, x.pts + (r.ptsAdj || 0)) }));
  }
  C.fundLevels = function (s, p) {
    if (!techOn(s)) return [];
    const t = techGet(s, p), ls = fundsOf(s, p), cur = ls.some(x => x.id === t.fund) ? t.fund : 'stop';
    return ls.map(x => Object.assign(x, { current: x.id === cur, ok: s.funds[p] >= x.cost }));
  };
  // 付得起的最高档（不超过玩家设定的那一档）
  function fundPick(s, p, t, funds) {
    const ls = fundsOf(s, p);
    let i = ls.findIndex(x => x.id === t.fund);
    if (i < 0) i = 0;
    const want = i;
    while (i > 0 && ls[i].cost > funds) i--;
    return { lv: ls[i], down: i < want };
  }
  // 阵营白给的点数：赤焰每座兵工厂、翠林上回合有新占的建筑
  // 科研所：每座己方科研所每回合白给研究点（D.TERRAIN.lab.research = { pts, max }），停档也给
  function labPts(s, p) {
    const L = D.TERRAIN.lab && D.TERRAIN.lab.research;
    if (!L) return 0;
    const n = CTX && CTX.s === s ? CTX.props.reduce((k, pr) => k + (pr.t === 'lab' && pr.owner === p ? 1 : 0), 0) : C.count(s, p, 'lab');
    return Math.min(L.max, n) * L.pts;
  }
  // 研究的入口：这一格是 p 的司令部或科研所时为真（界面在这两种建筑上开科技菜单；下单和调档本身不看位置）
  C.canOpenTech = function (s, p, x, y) {
    const m = s.map;
    if (!techOn(s) || x < 0 || y < 0 || x >= m.w || y >= m.h || m.owner[y][x] !== p) return false;
    return m.t[y][x] === 'hq' || m.t[y][x] === 'lab';
  };
  function freeParts(s, p, t) {
    const r = researchOf(s, p), parts = [];
    if (r.factoryPts) { const n = C.count(s, p, 'factory'), pts = Math.min(r.factoryMax, n * r.factoryPts); if (pts) parts.push({ label: tr('{name}：{n} 座兵工厂', { name: r.name, n }), pts }); }
    if (r.expand && t.capNew) parts.push({ label: tr('{name}：新占领建筑', { name: r.name }), pts: r.expand });
    if (r.killPts && t.kill) parts.push({ label: tr('{name}：击毁敌方单位', { name: r.name }), pts: t.kill });
    const lab = labPts(s, p);
    if (lab) parts.push({ label: D.TERRAIN.lab ? D.TERRAIN.lab.name : tr('科研所'), pts: lab, lab: true });
    return parts;
  }
  // 回合开始（发完收入以后）：按经费档位扣钱换研究点（钱不够自动降档；“停”不扣钱），加上阵营和科研所白给的，全部进池子
  function rpIncome(s, p) {
    if (!techOn(s) || !s.tech) return;
    const t = techMut(s, p);
    if (t.cmTurn) t.cmTurn = 0;
    if (t.boost != null) delete t.boost; // 旧存档：以前投碎片加速研究时的记账
    const { lv, down } = fundPick(s, p, t, s.funds[p]), r = researchOf(s, p);
    const parts = [{ label: tr('研究经费（{lv}）', { lv: lv.name }), pts: lv.pts }];
    if (r.sub && lv.id !== 'stop') parts.push({ label: tr('{name}：议会拨款', { name: r.name }), pts: r.sub });
    for (const f of freeParts(s, p, t)) parts.push(f);
    t.capNew = false; if (t.kill) t.kill = 0;
    let total = 0; for (const x of parts) total += x.pts;
    s.funds[p] -= lv.cost;
    rpAdd(s, p, total);
    s.events.push(Object.assign({ type: 'fund', player: p, level: lv.id, cost: lv.cost, pts: lv.pts, gain: total, total: s.rp[p] }, down ? { down: true } : null));
  }
  // 翠林的“口口相传”：占下建筑记一笔（每座建筑每局只算第一次），下个回合开始结算时加点，只加一次
  function techOnCapture(s, p, idx) {
    if (!techOn(s) || !s.tech || !researchOf(s, p).expand) return;
    const t = techMut(s, p), seen = t.capSeen || (t.capSeen = {});
    if (seen[idx]) return;
    seen[idx] = 1; t.capNew = true;
  }
  // 收据（rules.capMeter）：占下建筑涨技能槽，每座建筑每局只算第一次，每回合有上限，技能开着时不加
  function capMeter(s, p, idx) {
    if (!s.tech || !techOn(s) || rulesOf(s).powers === false || s.powerOn[p]) return;
    const cm = ruleOf(s, p).capMeter;
    if (!cm) return;
    const t = techMut(s, p), seen = t.cmSeen || (t.cmSeen = {});
    if (seen[idx]) return;
    seen[idx] = 1;
    const add = Math.min(cm.per, cm.max - (t.cmTurn || 0));
    if (add <= 0) return;
    t.cmTurn = (t.cmTurn || 0) + add;
    s.meter[p] = Math.min(D.METER_MAX, s.meter[p] + D.METER_MAX * add);
  }
  // 回合开始时的科技效果：全寨出征、城防炮
  function techTurnStart(s, p, rl) {
    const m = s.map;
    if (rl.levy && s.tech && s.tech[p]) {
      const t = s.tech[p];
      t.levyN = (t.levyN || 0) + 1;
      if (t.levyN >= rl.levy.every) {
        t.levyN = 0;
        const out = [];
        for (const [x, y] of C.militiaSpots(s, p, rl.levy.max)) { const u = C.spawn(s, 'inf', p, x, y); u.moved = false; out.push({ id: u.id, type: u.type, x, y }); }
        if (out.length) s.events.push({ type: 'spawn', player: p, units: out });
      }
    }
    if (rl.cityGun) { // 己方城市、司令部、碉堡打相邻的、看得见的敌方单位；每个单位每回合只挨一次，不会打死
      const hit = {}, hits = [];
      for (const u of s.units.slice()) {
        if (!C.isEnemy(s, p, u.owner) || hit[u.id] || u.hp <= 10) continue;
        let near = false;
        for (const [dx, dy] of DIRS) { const x = u.x + dx, y = u.y + dy; if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.owner[y][x] === p && (m.t[y][x] === 'city' || m.t[y][x] === 'hq' || m.t[y][x] === 'fort')) { near = true; break; } }
        if (!near || !C.canSee(s, p, u)) continue;
        const dmg = Math.min(rl.cityGun, u.hp - 10);
        u.hp -= dmg; hit[u.id] = 1; hits.push({ id: u.id, x: u.x, y: u.y, dmg });
      }
      if (hits.length) s.events.push({ type: 'gun', player: p, hits });
    }
  }
  // 研究点的账：现在有多少、下个回合开始会进多少、各来自哪里
  //   { rp, total, parts: [{ label, pts }], fund: { id, name, cost, pts } }
  C.techRate = function (s, p) {
    const out = { rp: 0, total: 0, parts: [], fund: null };
    if (!techOn(s)) return out;
    const t = techGet(s, p), r = researchOf(s, p);
    out.rp = rpHave(s, p);
    out.fund = fundPick(s, p, t, s.funds[p] + C.income(s, p)).lv; // 下个回合开始时按哪一档扣（按现在的资金加一回合收入估）
    out.parts.push({ label: tr('研究经费（{lv}）', { lv: out.fund.name }), pts: out.fund.pts });
    if (r.sub && out.fund.id !== 'stop') out.parts.push({ label: tr('{name}：议会拨款', { name: r.name }), pts: r.sub });
    for (const f of freeParts(s, p, t)) out.parts.push(f);
    for (const x of out.parts) out.total += x.pts;
    return out;
  };
  // 这个阵营能看到的全部科技。每项：{ id, tree, line, tier, name, desc, flavor, state, why, need（价格）, lack（还差多少研究点，够了是 0）, moot?, mootWhy? }
  C.techList = function (s, p) {
    const t = techGet(s, p), co = s.co[p], have = rpHave(s, p);
    return techsOf(s, p).map(T => {
      const [state, why] = techState(s, p, T, t), need = needOf(s, T);
      const it = { id: T.id, tree: T.tree, line: T.line, tier: T.tier, name: T.name, desc: T.desc, flavor: T.flavor, state, why, need, lack: state === 'done' ? 0 : Math.max(0, need - have) };
      if (T.moot && T.moot[co]) { it.moot = true; it.mootWhy = T.moot[co]; }
      return it;
    });
  };
  C.techLines = function (s, p) {
    const items = C.techList(s, p), by = {}, out = [], c = COBY[s.co[p]];
    for (const it of items) {
      let g = by[it.line];
      if (!g) {
        const L = D.TECH_LINES[it.line];
        g = by[it.line] = { line: it.line, name: L ? L.name : c ? tr('{co} · 指挥官线', { co: c.name }) : tr('指挥官线'), tree: it.tree, order: L ? L.order : 9, items: [] };
        out.push(g);
      }
      g.items.push(it);
    }
    for (const g of out) g.items.sort((a, b) => a.tier - b.tier);
    return out.sort((a, b) => a.order - b.order).map(g => ({ line: g.line, name: g.name, tree: g.tree, items: g.items }));
  };
  C.techDone = function (s, p, id) { return techOn(s) && techGet(s, p).done.includes(id); };
  // 能不能解锁：能返回空串，不能返回一句原因
  C.canUnlock = function (s, p, id) {
    if (!techOn(s)) return tr('这一局没有开启科技');
    if (p !== s.turn) return tr('只能在己方回合解锁科技');
    const T = TECH[id];
    if (!T || !techsOf(s, p).includes(T)) return tr('这项科技不在己方的科技树里');
    const [state, why] = techState(s, p, T, techGet(s, p));
    return state === 'open' ? '' : state === 'done' ? tr('这项科技已解锁') : why;
  };
  // 解锁一项科技：研究点够、前置满足就立即扣点、立即生效。一回合可以连着解锁几项
  C.unlockTech = function (s, p, id) {
    if (C.canUnlock(s, p, id)) return false;
    const t = techMut(s, p), T = TECH[id];
    s.rp[p] -= needOf(s, T);
    t.done.push(id);
    if (T.rules && T.rules.levy) t.levyN = 0;
    (s.events || (s.events = [])).push({ type: 'tech', player: p, id });
    (s.log || (s.log = [])).push({ type: 'tech', player: p, id, day: s.day });
    visCache.delete(s);
    return true;
  };
  // 旧名字：下单 = 解锁。取消、排队已经没有了（返回 false）
  C.canResearch = C.canUnlock;
  C.research = C.unlockTech;
  C.cancelResearch = function () { return false; };
  C.reorderResearch = function () { return false; };
  C.setFund = function (s, p, id) {
    if (!techOn(s) || p !== s.turn || !fundsOf(s, p).some(x => x.id === id)) return false;
    techMut(s, p).fund = id;
    return true;
  };

  // ───────── 战役：席位的阵营、关卡开局、目标系统、触发事件、涨潮（数据格式见 tools/CAMPAIGN.md，接口见 MULTI-SPEC“战役”） ─────────
  // 这个席位在这一局里扮演哪个阵营（1 赤焰 2 苍蓝 3 翠林 4 金沙）。界面取颜色、徽记、名字一律用它。
  // 开局时用 opts.factions（下标 = 席位）指定；没指定就是席位号（1 赤焰、2 苍蓝……）
  C.factionOf = function (s, p) { return (s.factionOf && s.factionOf[p]) || (p >= 1 && p <= 4 ? p : 0); };
  // 从各席位的指挥官推出各席位的阵营：[0, 阵营, …]（下标 = 席位）。认不出的指挥官按席位号
  C.factionsFromCos = function (cos) {
    const out = [0];
    for (let p = 1; p < cos.length; p++) { const c = COBY[cos[p]]; out.push(c && c.faction ? c.faction : p >= 1 && p <= 4 ? p : 0); }
    return out;
  };
  // 这个席位的军队用什么颜色：{ faction, variant }。同一个阵营被几个席位用时，按席位顺序第一个是主色（variant 0），后面的依次 1、2、3
  // 颜色只是为了分清谁是谁，和敌我无关：敌我按席位和队伍算（C.isEnemy）
  C.colorOf = function (s, p) {
    const f = C.factionOf(s, p);
    let v = 0;
    for (let q = 1; q < p; q++) if (C.factionOf(s, q) === f) v++;
    return { faction: f, variant: Math.min(3, v) };
  };
  // 给素材的编码：阵营 + 10 × 变体（赤焰主色 1，赤焰第二套 11，黑潮第三套 25……）
  C.colorCode = function (s, p) { const c = C.colorOf(s, p); return c.faction + 10 * c.variant; };
  // 这个席位的界面色 { main, light, dark }
  C.paletteOf = function (s, p) { const c = C.colorOf(s, p), P = D.PALETTES && D.PALETTES[c.faction]; return (P && (P[c.variant] || P[0])) || null; };
  // 目标说明里的建筑名：现取 D.TERRAIN 的名字（多语言下已是当前语言）
  const kindName = kind => (kind === 'income' ? tr('收入建筑') : D.TERRAIN[kind] ? D.TERRAIN[kind].name : kind);
  const isKind = (t, kind) => (kind === 'income' ? !!D.TERRAIN[t].income : t === kind);
  function countKind(s, p, kind) {
    let n = 0; const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.owner[y][x] === p && isKind(m.t[y][x], kind)) n++;
    return n;
  }
  // 带标记的单位（在地图上或在运输单位里）
  function tagged(s, tag) {
    for (const u of s.units) { if (u.tag === tag) return { u, carried: false }; for (const c of u.cargo) if (c.tag === tag) return { u: c, carried: true, by: u }; }
    return null;
  }
  const campCells = (s, c) => (c.at ? (Array.isArray(c.at[0]) ? c.at : [c.at]) : (c.marks || []).map(k => (s.camp.marks || {})[k]).filter(Boolean));
  const ownedBy = (s, o, seat, team) => o > 0 && (team ? s.team[o] === s.team[seat] : o === seat);
  // 按关卡开一局。opts：{ seat?: 玩家坐哪个席位（终章从 level.playerSeats 里选）, co?: 玩家选的指挥官 }
  // 地图还没画好（level.map.need）或找不到时返回 null。玩家的席位记在 s.camp.seat，其余席位由电脑操作
  C.newCampaignGame = function (level, opts) {
    opts = opts || {};
    const def = level.map && !level.map.need ? (D.MAPS || []).find(m => m.name === level.map.name) : null;
    if (!def) return null;
    const sides = level.sides, first = sides.find(x => x.role === 'player');
    const seat = opts.seat && sides.some(x => x.seat === opts.seat && x.role === 'player') ? opts.seat : (level.playerSeats && level.playerSeats[0]) || (first && first.seat) || 1;
    const NM = def.players || 2, N = Math.max(NM, ...sides.map(x => x.seat)); // NM：地图上有几个阵营；席位号更大的是没有基地的席位（noBase）
    const cos = [null], teams = [0], lv = [null], funds = [null], fac = [0], roles = [null];
    const rules = Object.assign({ handicap: false }, level.rules || {});
    for (let p = 1; p <= N; p++) {
      const sd = sides.find(x => x.seat === p) || {};
      const me = p === seat;
      cos.push(me ? opts.co || (sd.cos && sd.cos[0]) || sd.co : sd.co || (sd.cos && sd.cos[0]));
      teams.push(sd.team || p); lv.push(sd.ai || 'normal');
      funds.push(sd.funds != null ? sd.funds : rules.startFunds || 0);
      fac.push(sd.faction || p);
      roles.push(me ? 'player' : sd.role === 'player' ? 'ally' : sd.role || 'enemy'); // 终章里没被选中的可选席位算友方
    }
    const s = C.newGame(def, { cos: cos.slice(0, NM + 1), teams: teams.slice(0, NM + 1), aiLevels: lv.slice(0, NM + 1), funds: funds.slice(0, NM + 1), rules, factions: fac.slice(0, NM + 1) });
    const m = s.map;
    for (let p = NM + 1; p <= N; p++) { // 没有基地的席位：只有单位，没有司令部和建筑；全灭才出局，增援到场之前不算被打光
      s.players = p; s.team.push(teams[p]); s.alive.push(true); s.funds.push(funds[p]); s.co.push(cos[p]); s.meter.push(0); s.powerOn.push(false); s.aiLevels.push(lv[p]); s.ore.push(rules.startOre || 0);
      s.factionOf.push(fac[p]); if (s.tech) s.tech.push(newTech()); if (s.rp) s.rp.push(0);
    }
    const dlg = ((level.dialog && level.dialog.events) || []).map(e => e.when);
    // 触发器表：前面是对话的，后面接着增援的（下标 ≥ talkN 的是 reinforce[下标 − talkN]）
    s.camp = { id: level.id, seat, roles, marks: def.marks || null, triggers: dlg.concat((level.reinforce || []).map(r => r.when)), talkN: dlg.length, fired: {},
      reinforce: (level.reinforce || []).map(r => ({ seat: r.seat, units: r.units.map(u => ({ type: u.as && D.UNITS[u.as] ? u.as : u.type, at: u.at, tag: u.tag, hp: u.hp })) })), noBase: {}, waiting: {} };
    for (const sd of sides) if (sd.noBase || sd.seat > NM) { s.camp.noBase[sd.seat] = 1; if ((level.reinforce || []).some(r => r.seat === sd.seat)) s.camp.waiting[sd.seat] = 1; }
    s.talks = [];
    for (const o of level.owners || []) { const [x, y] = o.at; if (D.TERRAIN[m.t[y][x]].prop) { m.owner[y][x] = o.seat; m.cap[y][x] = 20; } }
    for (const d of level.units || []) {
      if (d.ifPlayer && d.seat !== seat) continue; // ifPlayer：只有玩家坐这个席位时才放（终-3 的沉箱车队）
      const ty = d.as && D.UNITS[d.as] ? d.as : d.type; // as：核心有了这个兵种就换成它（装甲列车）
      let [x, y] = d.at;
      if (d.ifPlayer && (C.unitAt(s, x, y) || !C.moveCost({ type: ty }, m.t[y][x]))) { // 跟着席位走的单位：那一格站不了就放到最近的能站的空格
        let spot = null;
        for (let r = 1; r <= 6 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (const dx of [-(r - Math.abs(dy)), r - Math.abs(dy)]) {
          const nx = d.at[0] + dx, ny = d.at[1] + dy;
          if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && C.moveCost({ type: ty }, m.t[ny][nx]) && !C.unitAt(s, nx, ny)) { spot = [nx, ny]; break; }
        }
        if (spot) [x, y] = spot;
      }
      if (C.unitAt(s, x, y)) continue; // 数据错误：那一格已经有单位了（tools/test-campaign.js 会报）
      const u = C.spawn(s, ty, d.seat, x, y); u.moved = false;
      if (d.hp != null) u.hp = Math.max(1, Math.min(100, d.hp * 10));
      if (d.tag) u.tag = d.tag;
      if (d.ore) u.ore = true; // 关卡里指定的强化单位
    }
    for (const u of s.units) if (u.type === 'trn' && fac[u.owner] === 5) u.ore = true; // 黑潮的装甲列车在战役里默认是强化的
    // 只守不攻：电脑的单位不离开开局位置 4 格。rules.aiStance 管全体电脑，sides[].stance 管单个席位
    for (const u of s.units) if (u.owner !== seat && (rules.aiStance === 'defend' || (sides.find(x => x.seat === u.owner) || {}).stance === 'defend')) u.home = [u.x, u.y];
    s.objectives = { win: (level.win || [{ type: 'hq' }, { type: 'rout' }]).map(c => Object.assign({}, c)), lose: (level.lose || []).map(c => Object.assign({}, c)), state: { hold: {}, via: {} } };
    visCache.delete(s);
    if (s.turn === seat) campTurnStart(s);
    campCheck(s);
    return s;
  };
  // 触发器：发一条 { type: 'talk', index }（index 是 level.dialog.events 的下标）。同时记进 s.talks，界面用 C.takeTalks 取走；每个只发一次
  function fire(s, i) {
    if (s.camp.fired[i]) return;
    s.camp.fired[i] = 1;
    if (i >= (s.camp.talkN == null ? Infinity : s.camp.talkN)) return reinforce(s, s.camp.reinforce[i - s.camp.talkN]);
    (s.events || (s.events = [])).push({ type: 'talk', index: i });
    (s.talks || (s.talks = [])).push(i);
  }
  // 增援：在指定格放单位，格子被占（或这个兵种站不上去）就放到最近的能站的空格；当回合就能动
  function reinforce(s, r) {
    if (!r || !s.alive[r.seat]) return;
    const m = s.map, out = [];
    for (const d of r.units) {
      let spot = null;
      for (let rad = 0; rad <= 6 && !spot; rad++) for (let dy = -rad; dy <= rad && !spot; dy++) for (const dx of rad === Math.abs(dy) ? [0] : [-(rad - Math.abs(dy)), rad - Math.abs(dy)]) {
        const x = d.at[0] + dx, y = d.at[1] + dy;
        if (x < 0 || y < 0 || x >= m.w || y >= m.h || !C.moveCost({ type: d.type }, m.t[y][x]) || C.unitAt(s, x, y)) continue;
        spot = [x, y]; break;
      }
      if (!spot) continue;
      const u = C.spawn(s, d.type, r.seat, spot[0], spot[1]); u.moved = false;
      if (d.hp != null) u.hp = Math.max(1, Math.min(100, d.hp * 10));
      if (d.tag) u.tag = d.tag;
      out.push({ id: u.id, type: u.type, x: u.x, y: u.y });
    }
    if (s.camp.waiting) delete s.camp.waiting[r.seat];
    visCache.delete(s);
    if (out.length) (s.events || (s.events = [])).push({ type: 'reinforce', player: r.seat, units: out });
  }
  // 取走还没播的对话（level.dialog.events 的下标，按触发顺序）。s.events 每个回合开始会清，这个队列不会
  C.takeTalks = function (s) { const t = s.talks || []; s.talks = []; return t; };
  const byMatch = (s, by, p) => { const me = s.camp.seat; return by === 'player' ? p === me : by === 'team' ? s.team[p] === s.team[me] : by === 'enemy' ? C.isEnemy(s, me, p) : by === p; };
  function campTrig(s, type, fn) {
    if (!s.camp || s.winner) return;
    const tr = s.camp.triggers;
    for (let i = 0; i < tr.length; i++) if ((!type || tr[i].type === type) && !s.camp.fired[i] && fn(tr[i])) fire(s, i);
  }
  function campOnCapture(s, p, x, y) {
    if (!s.camp) return;
    const t = s.map.t[y][x];
    // 两种触发器放在一遍里查：同一时刻触发几个时按数组顺序
    campTrig(s, null, w => (w.type === 'capture' ? byMatch(s, w.by, p) && (w.at ? w.at[0] === x && w.at[1] === y : isKind(t, w.kind)) : w.type === 'captureAny' ? byMatch(s, w.by, p) && (!w.kind || isKind(t, w.kind)) : false));
    const st = s.objectives && s.objectives.state; // 目标建筑易主：连续占有的天数从头算
    if (st) s.objectives.win.forEach((c, i) => { if (c.type === 'holdBuilding' && c.at[0] === x && c.at[1] === y && !ownedBy(s, p, s.camp.seat, c.by === 'team')) st.hold[i] = 0; });
    campCheck(s);
  }
  function campOnKill(s, dead) {
    if (!s.camp) return;
    const me = s.camp.seat, mine = dead.owner === me;
    const hit = (w, u) => (w.side === 'player' ? mine : C.isEnemy(s, me, u.owner)) && (!w.unit || w.unit === u.type) && (!w.tag || w.tag === u.tag);
    campTrig(s, 'destroyed', w => hit(w, dead) || dead.cargo.some(c => hit(w, c)));
  }
  function campTurnStart(s) {
    if (!s.camp || s.turn !== s.camp.seat) return;
    campTrig(s, 'day', w => s.day >= w.day);
  }
  const near = (u, at, r) => Math.abs(u.x - at[0]) + Math.abs(u.y - at[1]) <= r;
  function campEnd(s, won, reason) {
    const me = s.camp.seat;
    let tm = s.team[me];
    if (!won) { tm = 0; for (let p = 1; p <= s.players && !tm; p++) if (s.alive[p] && C.isEnemy(s, me, p)) tm = s.team[p]; if (!tm) tm = -1; }
    s.winner = tm; s.reason = reason; s.winners = [];
    for (let p = 1; p <= s.players; p++) if (s.team[p] === tm) s.winners.push(p);
    s.camp.result = won ? 'win' : 'lose';
  }
  // 每种条件现在成不成立。dayEnd：这是不是“一天结束”的那次判定（hold / timeout 只在那时看）
  function condMet(s, c, i, win, dayEnd) {
    const me = s.camp.seat, m = s.map, st = s.objectives.state, team = c.by === 'team';
    switch (c.type) {
      case 'hold': return dayEnd && s.day >= c.days && s.alive[me];
      case 'capture': { if (c.fromDay && s.day < c.fromDay) return false; const cs = campCells(s, c); return cs.length > 0 && cs.every(([x, y]) => ownedBy(s, m.owner[y][x], me, team)); } // fromDay：从这一天起才算
      case 'holdBuilding': return (st.hold[i] || 0) >= c.days;
      case 'own': return countKind(s, me, c.kind) >= c.count;
      case 'escort': {
        const t = tagged(s, c.tag);
        if (!t || t.carried) return false;
        const via = c.via || [];
        let k = st.via[i] || 0;
        while (k < via.length && near(t.u, via[k], 1)) k++;
        st.via[i] = k;
        const to = c.to || campCells(s, c)[0]; // 目的地可以写坐标，也可以写地图上的标记
        return !!to && k >= via.length && near(t.u, to, c.radius || 0);
      }
      case 'funds': return s.turn === me && s.funds[me] >= c.amount;
      case 'destroy': return !tagged(s, c.tag); // 带标记的敌方单位被击毁
      case 'loseHq': case 'routed': return false; // 走核心原有的淘汰，见 campCheck
      case 'timeout': return dayEnd && s.day >= c.day;
      case 'unitLost': return !tagged(s, c.tag);
      case 'ownBelow': {
        if (c.kind) return countKind(s, me, c.kind) < c.count;
        const cs = campCells(s, c); return cs.length > 0 && cs.filter(([x, y]) => m.owner[y][x] === me).length < c.count;
      }
      case 'enemyOwn': { for (let p = 1; p <= s.players; p++) if (s.alive[p] && C.isEnemy(s, me, p) && countKind(s, p, c.kind) >= c.count) return true; return false; }
      case 'allyDefeated': { for (let p = 1; p <= s.players; p++) if (p !== me && s.team[p] === s.team[me] && !s.alive[p] && !s.camp.noBase[p]) return true; return false; } // 没有基地的友方全灭不算
    }
    return false; // hq / rout：敌方全部出局时核心自己结算
  }
  // 对局已经结束（不管是哪条路：全歼、占司令部、天数用完、认输）而 s.camp.result 还没写：按获胜的队伍补上
  function campStamp(s) {
    if (!s.camp || !s.winner || s.camp.result) return;
    const won = s.winner === s.team[s.camp.seat];
    s.camp.result = won ? 'win' : 'lose';
    if (!won && !s.alive[s.camp.seat] && (s.reason === 'hq' || s.reason === 'rout')) s.reason = s.reason === 'hq' ? 'loseHq' : 'routed'; // 玩家自己出局：原因换成失败条件的名字
  }
  function campCheck(s, dayEnd) {
    campStamp(s);
    if (!s.camp || !s.objectives || s.winner) return;
    const me = s.camp.seat, ob = s.objectives;
    campTrig(s, 'funds', w => s.funds[me] >= w.amount);
    campTrig(s, 'reach', w => { const t = tagged(s, w.tag); return !!t && !t.carried && near(t.u, w.at, 1); });
    if (!s.alive[me]) { // 玩家出局：司令部被占或被打光
      const lg = (s.log || []).filter(e => e.type === 'defeat' && e.player === me).pop();
      return campEnd(s, false, lg && lg.reason === 'hq' ? 'loseHq' : 'routed');
    }
    for (let i = 0; i < ob.win.length; i++) if (condMet(s, ob.win[i], i, true, dayEnd)) return campEnd(s, true, ob.win[i].type);
    for (let i = 0; i < ob.lose.length; i++) if (condMet(s, ob.lose[i], i, false, dayEnd)) return campEnd(s, false, ob.lose[i].type);
  }
  // 认输（战役和普通对局都能用）：p 这一方出局；战役里玩家认输记 s.reason = 'resign'
  C.resign = function (s, p) {
    if (s.winner || !s.alive[p]) return false;
    if (s.camp && p === s.camp.seat) { campEnd(s, false, 'resign'); return true; }
    eliminate(s, p, 0, 'resign'); campStamp(s);
    return true;
  };
  // 一天结束（当天最后一个阵营结束回合之后、天数加一之前）：连续占有的天数、守到第几天、限期
  function campDayEnd(s) {
    if (!s.camp || !s.objectives || s.winner) return;
    const me = s.camp.seat, m = s.map, st = s.objectives.state;
    s.objectives.win.forEach((c, i) => { if (c.type === 'holdBuilding') st.hold[i] = ownedBy(s, m.owner[c.at[1]][c.at[0]], me, c.by === 'team') ? (st.hold[i] || 0) + 1 : 0; });
    campCheck(s, true);
  }
  // 给界面的目标列表。没有战役目标的对局返回 null。
  //   { seat, win: [item…], lose: [item…], cells: [[x, y]…], units: [单位 id…] }
  //   item：{ type, text, done, progress: { have, need } | null, cells: [[x, y]…], tag? }
  //   cells / units 是地图上要标出来的目标格和带标记的单位
  C.objectives = function (s) {
    if (!s.camp || !s.objectives) return null;
    const me = s.camp.seat, m = s.map, st = s.objectives.state, allCells = [], units = [];
    const item = (c, i, win) => {
      const o = { type: c.type, text: '', done: false, progress: null, cells: [] }, team = c.by === 'team';
      const P = (have, need) => { o.progress = { have: Math.max(0, Math.min(have, need)), need }; };
      switch (c.type) {
        case 'hq': o.text = tr('占领所有敌方司令部'); break;
        case 'rout': o.text = tr('击毁全部敌方单位'); break;
        case 'hold': o.text = tr('守到第 {days} 天结束', { days: c.days }); P(s.day - 1, c.days); break;
        case 'destroy': o.text = tr('击毁带标记的敌方单位'); o.tag = c.tag; break;
        case 'capture': { o.cells = campCells(s, c); o.text = c.fromDay && s.day < c.fromDay ? tr(team ? '第 {day} 天起，己方队伍占领目标建筑' : '第 {day} 天起，占领目标建筑', { day: c.fromDay }) : tr(team ? '己方队伍占领目标建筑' : '占领目标建筑'); P(o.cells.filter(([x, y]) => ownedBy(s, m.owner[y][x], me, team)).length, o.cells.length); break; }
        case 'holdBuilding': o.cells = [c.at]; o.text = tr(team ? '己方队伍连续 {days} 天占有目标建筑' : '连续 {days} 天占有目标建筑', { days: c.days }); P(st.hold[i] || 0, c.days); break;
        case 'own': o.text = tr('同时占有 {n} 座{kind}', { n: c.count, kind: kindName(c.kind) }); P(countKind(s, me, c.kind), c.count); break;
        case 'escort': { o.cells = (c.via || []).concat(c.to ? [c.to] : campCells(s, c).slice(0, 1)); o.tag = c.tag; o.text = (c.via && c.via.length ? tr('带标记的单位先到途经点，再到目的地') : tr('把带标记的单位送到目的地')); if (c.via && c.via.length) P(st.via[i] || 0, c.via.length); break; }
        case 'funds': o.text = tr('持有资金达到 {n}', { n: c.amount }); P(s.funds[me], c.amount); break;
        case 'loseHq': o.text = tr('己方司令部被占领'); break;
        case 'routed': o.text = tr('己方单位全部被击毁'); break;
        case 'timeout': o.text = tr('第 {day} 天结束时还没有达成目标', { day: c.day }); P(s.day, c.day); break;
        case 'unitLost': o.text = tr('带标记的单位被击毁'); o.tag = c.tag; break;
        case 'ownBelow': { if (c.kind) { o.text = tr('占有的{kind}不足 {n} 座', { kind: kindName(c.kind), n: c.count }); P(countKind(s, me, c.kind), c.count); } else { o.cells = campCells(s, c); o.text = tr('指定的建筑里归己方的不足 {n} 座', { n: c.count }); P(o.cells.filter(([x, y]) => m.owner[y][x] === me).length, c.count); } break; }
        case 'enemyOwn': { let mx = 0; for (let p = 1; p <= s.players; p++) if (s.alive[p] && C.isEnemy(s, me, p)) mx = Math.max(mx, countKind(s, p, c.kind)); o.text = tr('任一敌方同时占有 {n} 座{kind}', { n: c.count, kind: kindName(c.kind) }); P(mx, c.count); break; }
        case 'allyDefeated': o.text = tr('友方败北'); break;
      }
      o.done = s.winner ? s.reason === c.type && (s.camp.result === 'win') === win : false;
      if (o.tag) { const t = tagged(s, o.tag); if (t) units.push(t.carried ? t.by.id : t.u.id); }
      for (const c2 of o.cells) if (!allCells.some(a => a[0] === c2[0] && a[1] === c2[1])) allCells.push(c2);
      return o;
    };
    return { seat: me, win: s.objectives.win.map((c, i) => item(c, i, true)), lose: s.objectives.lose.map((c, i) => item(c, i, false)), cells: allCells, units: [...new Set(units)] };
  };
  // 战役里电脑要盯的格子（目标建筑、护送的目的地）；没有战役就是空数组
  function campGoalCells(s) {
    if (!s.camp || !s.objectives) return [];
    const out = [];
    for (const c of s.objectives.win) if (c.type === 'capture' || c.type === 'holdBuilding') for (const a of campCells(s, c)) out.push(a);
    for (const c of s.objectives.lose) if (c.type === 'ownBelow' && c.marks) for (const a of campCells(s, c)) out.push(a);
    return out;
  }
  // 涨潮（rules.flood = { fromDay, every }）：从第 fromDay 天起每 every 天涨一级。每一级把挨着海的沙滩、礁石、荒地、废墟格变成海；
  // 格上的陆上单位掉 3 点 HP（至少留 1 点）并被推到最近的能站的空格，没有就被击毁。建筑、道路、桥和别的地形不淹。飞机不受影响
  const FLOODABLE = { beach: 1, reef: 1, waste: 1, ruins: 1, shard: 1, shard_used: 1 };
  // 涨一级。by：谁放的水（玄渊的技能；0 = 自然涨潮）。by 不为 0 时只伤它的敌方、不会击毁；自然涨潮不分敌我，没处站的被击毁。
  // 返回事件 { type: 'flood', cells, moved, lost, by? }，没有可淹的格子返回 null
  function floodRise(s, by, dmg) {
    const m = s.map, w = m.w, h = m.h, cells = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!FLOODABLE[m.t[y][x]]) continue;
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h && m.t[ny][nx] === 'sea') { cells.push([x, y]); break; } }
    }
    if (!cells.length) return null;
    for (const [x, y] of cells) m.t[y][x] = 'sea';
    visCache.delete(s); seaCache.delete(m.t);
    const moved = [], lost = [];
    for (const [x, y] of cells) {
      const u = C.unitAt(s, x, y);
      if (!u || D.UNITS[u.type].air || D.UNITS[u.type].ship) continue;
      if (!by || C.isEnemy(s, by, u.owner)) u.hp = Math.max(10, u.hp - (dmg || 30));
      // 最近的能站的空格（按直线格数一圈一圈找，8 格以内；技能放的水找不到就再找远一点，保证不击毁）
      let spot = null;
      for (let r = 1; r <= (by ? Math.max(w, h) : 8) && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (const dx of [-(r - Math.abs(dy)), r - Math.abs(dy)]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !C.moveCost(u, m.t[ny][nx]) || C.unitAt(s, nx, ny)) continue;
        spot = [nx, ny]; break;
      }
      if (spot) { moved.push({ id: u.id, from: [x, y], to: spot }); u.x = spot[0]; u.y = spot[1]; }
      else { lost.push({ id: u.id, type: u.type, owner: u.owner, x, y }); if (C.onKill) C.onKill(s, u, null); campOnKill(s, u); C.removeUnit(s, u); }
    }
    const ev = { type: 'flood', cells, moved, lost };
    if (by) ev.by = by;
    if (lost.length) C.checkWin(s, 0);
    return ev;
  }
  // 涨潮（rules.flood = { fromDay, every, gates? }）：从第 fromDay 天起每 every 天，在新的一天开始时涨一级。
  // gates（地图标记名）：玩家一方每占有一座潮闸，下一次涨水推迟 1 天；全部占有时停涨。下一次涨水的日子记在 s.floodNext
  function floodStep(s) {
    const f = s.rules && s.rules.flood;
    if (!f) return;
    if (s.floodNext == null) s.floodNext = f.fromDay;
    if (s.day < s.floodNext) return;
    if (f.gates && s.camp) {
      const me = s.camp.seat, cs = f.gates.map(k => (s.camp.marks || {})[k]).filter(Boolean);
      const n = cs.filter(([x, y]) => ownedBy(s, s.map.owner[y][x], me, true)).length;
      if (cs.length && n >= cs.length) return; // 全占：停涨（丢了一座以后，下一天接着涨）
      if (n && s.floodHeld !== s.floodNext) { s.floodNext += n; s.floodHeld = s.floodNext; if (s.day < s.floodNext) return; } // 每座推迟 1 天，每次涨水只推一回
    }
    const ev = floodRise(s, 0, 30);
    s.floodNext = s.day + f.every;
    if (ev) s.events.push(ev);
  }
  // 给界面：下一次涨水在第几天（没有涨潮规则或已经停涨时是 null）
  C.floodInfo = function (s) {
    const f = s.rules && s.rules.flood;
    if (!f) return null;
    const next = s.floodNext == null ? f.fromDay : s.floodNext;
    let held = 0, total = 0;
    if (f.gates && s.camp) { const cs = f.gates.map(k => (s.camp.marks || {})[k]).filter(Boolean); total = cs.length; held = cs.filter(([x, y]) => ownedBy(s, s.map.owner[y][x], s.camp.seat, true)).length; }
    return { nextDay: total && held >= total ? null : Math.max(next, s.day + 1), gates: total, held };
  };

  // ───────── 第二种资源（名字见 D.RES；rules.ore 关掉时没有这种资源，一切和以前一样） ─────────
  const oreOn = s => !!D.RES && !(s.rules && s.rules.ore === false);
  const oreHave = (s, p) => (s.ore && s.ore[p]) || 0;
  function oreAdd(s, p, n) { if (!s.ore) s.ore = [0]; while (s.ore.length <= nP(s)) s.ore.push(0); s.ore[p] += n; }
  // 强化建造这个兵种要多少（不受指挥官折扣影响；没开这种资源时是 0）。常规建造一律不要
  C.oreOf = function (s, p, type) { return oreOn(s) ? D.UNITS[type].ore || 0 : 0; };
  // 强化的攻防加成只对“强化价不高于自己”的敌方单位生效：便宜的单位强化了也只压得住同级和更低级的对手，去打贵的单位没有加成。
  // a：强化的单位；otherType：对面的兵种（不知道对面是谁时不给加成）
  const oreTier = type => (D.UNITS[type] && D.UNITS[type].ore) || 0;
  const oreVs = (a, otherType) => !!(a.ore && otherType && oreTier(otherType) <= oreTier(a.type));
  C.oreApplies = function (u, otherType) { return oreVs(u, otherType); };
  // 强化建造给这个兵种什么：[{ kind: 'atk' | 'def' | 'heal' | 'repair' | 'move', value, text }]。text 是给玩家看的短句。
  // 有武器的：攻击、防御；没有武器的：防御，再按用途加（医护兵治疗量、维修车修理量、运输单位移动力）。界面的兵种卡、详情卡、图鉴都按它显示
  C.oreEffects = function (type) {
    const U = D.UNITS[type], R = D.RES, out = [], pct = v => Math.round(v * 100);
    if (!U || !R) return out;
    const k = U.ore || 0; // 攻防加成只对强化价不高于 k 的敌方单位生效（见 oreVs）
    if (U.range) out.push({ kind: 'atk', value: R.atk, vs: k, text: tr('攻击 +{n}%（敌方强化价不高于 {k} 时）', { n: pct(R.atk), k }) });
    out.push({ kind: 'def', value: R.def, vs: k, text: tr('防御 +{n}%（敌方强化价不高于 {k} 时）', { n: pct(R.def), k }) });
    if (type === 'mdc') out.push({ kind: 'heal', value: R.heal / 10, text: tr('每回合治疗量 +{n}', { n: R.heal / 10 }) });
    if (type === 'rep') out.push({ kind: 'repair', value: R.repair / 10, text: tr('每回合修理量 +{n}', { n: R.repair / 10 }) });
    if (!U.range && U.carry) out.push({ kind: 'move', value: R.move, text: tr('移动力 +{n}', { n: R.move }) });
    return out;
  };
  // 为什么造不了：能造返回空串。界面的造兵列表按它置灰并显示原因
  // opts.ore：问的是强化建造（资金 + 第二种资源）；不传是常规建造
  C.buildBlock = function (s, x, y, type, opts) {
    const p = s.turn;
    if (s.map.owner[y][x] !== p || !C.buildList(s, x, y).includes(type)) return tr('这里不能生产这个兵种');
    if (C.unitAt(s, x, y)) return tr('这一格有单位');
    if (C.buildLeft(s, x, y) <= 0) return tr('这座建筑本回合已经生产过了');
    if (s.funds[p] < C.costOf(s, p, type)) return tr('资金不足');
    if (opts && opts.ore) {
      if (!oreOn(s)) return tr('这一局不能这样做');
      if (oreHave(s, p) < C.oreOf(s, p, type)) return tr('{res}不足', { res: D.RES.name });
    }
    return '';
  };
  // 储量和拾取量：每座矿一共能产出几份（D.RES.mine_.min–max）、每个碎片堆能拾取几份（D.RES.shardMin–shardMax），开局时各掷一次（oreRoll），
  // 存在 s.mineLeft[格子编号]（剩余量，产一份减一）、s.shardAmt[格子编号]。没有记录的格子（旧存档、手搭的局面）按格子坐标取一个固定值，不动随机数
  const oreFixed = (lo, hi, x, y) => lo + (((x * 7 + y * 13 + (x ^ y) * 5) % (hi - lo + 1)) + (hi - lo + 1)) % (hi - lo + 1);
  // 一座陨星矿还能产出几份（不是矿 = null）。自由对局里采完的矿变成山地（mineGone），这里就返回 null；
  // 战役里采完的矿留着（关卡目标要占它），返回 0，只提供资金
  C.mineLeft = function (s, x, y) {
    if (!s.map.t[y] || s.map.t[y][x] !== 'mine') return null;
    const k = y * s.map.w + x, R = D.RES.mine_;
    return s.mineLeft && s.mineLeft[k] != null ? s.mineLeft[k] : oreFixed(R.min, R.max, x, y);
  };
  // 一个碎片堆能拾取几份（不是碎片堆 = null）
  C.shardLeft = function (s, x, y) {
    if (!s.map.t[y] || s.map.t[y][x] !== 'shard') return null;
    const k = y * s.map.w + x, R = D.RES;
    return s.shardAmt && s.shardAmt[k] != null ? s.shardAmt[k] : oreFixed(R.shardMin, R.shardMax, x, y);
  };
  // 开局：给每座矿、每个碎片堆掷储量 / 拾取量（C.rand，结果入档）。为了公平，镜像位置（旋转 180°、左右翻、上下翻；方形地图再加两条对角线）
  // 上同一种地形的格子取同一个值：对称地图上各方拿到的一样多，不对称的地图（战役）基本各掷各的。关掉碎片的对局不掷，随机数和以前一样
  function oreRoll(s) {
    if (!oreOn(s)) return;
    const m = s.map, w = m.w, h = m.h, R = D.RES, done = {};
    const kinds = { mine: [R.mine_.min, R.mine_.max, 'mineLeft'], shard: [R.shardMin, R.shardMax, 'shardAmt'] };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = m.t[y][x], K = kinds[t], k = y * w + x;
      if (!K || done[k]) continue;
      const group = [[x, y]]; done[k] = 1;
      for (let i = 0; i < group.length; i++) {
        const [gx, gy] = group[i], img = [[w - 1 - gx, h - 1 - gy], [w - 1 - gx, gy], [gx, h - 1 - gy]];
        if (w === h) img.push([gy, gx], [w - 1 - gy, h - 1 - gx]);
        for (const [nx, ny] of img) { const nk = ny * w + nx; if (!done[nk] && m.t[ny][nx] === t) { done[nk] = 1; group.push([nx, ny]); } }
      }
      const v = K[0] + Math.floor(C.rand() * (K[1] - K[0] + 1)), store = s[K[2]] || (s[K[2]] = {});
      for (const [gx, gy] of group) store[gy * w + gx] = v;
    }
  }
  C.oreRoll = oreRoll; // 测试和地图工具用：给手搭的局面补掷一次
  // 采完的矿变成普通山地：不再是建筑，没有收入和归属，不能占领；站在上面的单位留在原地，按山地算。
  // 事件 { type: 'mineGone', x, y, player: 原来的主人 }，界面据此重画这一格并提示一句
  function mineGone(s, x, y) {
    const m = s.map, was = m.owner[y][x];
    m.t[y][x] = 'mountain'; m.owner[y][x] = 0; m.cap[y][x] = 20;
    if (s.mineLeft) delete s.mineLeft[y * m.w + x];
    visCache.delete(s); seaCache.delete(m.t);
    (s.events || (s.events = [])).push({ type: 'mineGone', x, y, player: was });
  }
  // 回合开始：己方的矿产出
  function oreTurnStart(s, p) {
    if (!oreOn(s)) return;
    // 每座矿每 D.RES.mine_.every 回合产出 amount 份（零头记在 s.oreFrac 里攒着），占几座算几座；产完的矿不算
    const R = D.RES.mine_, m = s.map, live = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'mine' && m.owner[y][x] === p) {
      const l = C.mineLeft(s, x, y);
      if (l > 0) live.push([x, y]); else if (!s.camp) mineGone(s, x, y); // 旧存档里已经采完的矿：现在才变山
    }
    const mines = live.length;
    if (!mines) return;
    const fr = s.oreFrac || (s.oreFrac = [0]);
    while (fr.length <= nP(s)) fr.push(0); // 不留空位：存档往返后要逐字段相同
    const acc = (fr[p] || 0) + mines * R.amount / R.every;
    let n = Math.floor(acc + 1e-9);
    fr[p] = acc - n;
    { // 轮流从每座矿里扣（剩得多的先扣，一样多时按格子顺序），扣不出来的就不产；扣到 0 的矿记下来
      const order = live.map(([x, y]) => [x, y, C.mineLeft(s, x, y)]).sort((a, b) => b[2] - a[2]);
      let got = 0;
      for (let i = 0, miss = 0; got < n && miss < order.length; i++) {
        const c = order[i % order.length];
        if (c[2] <= 0) { miss++; continue; }
        miss = 0; c[2]--; got++;
        (s.mineLeft || (s.mineLeft = {}))[c[1] * m.w + c[0]] = c[2];
      }
      n = got;
      if (n > 0) { oreAdd(s, p, n); s.events.push({ type: 'ore', player: p, amount: n, total: s.ore[p] }); }
      if (!s.camp) for (const c of order) if (c[2] <= 0) mineGone(s, c[0], c[1]); // 战役里不变山：关卡目标要占这些矿
    }
  }
  // 陆上单位停在碎块上：拾取，这一格变成荒地。返回拾到多少（0 = 没有）
  function orePickup(s, u) {
    const m = s.map;
    if (m.t[u.y][u.x] !== 'shard' || !oreOn(s) || !(u.owner > 0) || D.UNITS[u.type].air || D.UNITS[u.type].ship) return 0;
    const n = C.shardLeft(s, u.x, u.y);
    if (s.shardAmt) delete s.shardAmt[u.y * m.w + u.x];
    m.t[u.y][u.x] = 'shard_used'; visCache.delete(s); // 留下一个空坑（等同荒地）
    oreAdd(s, u.owner, n);
    (s.events || (s.events = [])).push({ type: 'pickup', player: u.owner, x: u.x, y: u.y, amount: n, total: s.ore[u.owner] });
    return n;
  }
  // 击毁敌方的强化单位：击毁方立即得到它强化价的一半（向上取整）；运输单位里搭载的强化单位各自算。被击毁方什么都不收回。
  // 友方之间、没有击毁方（自然涨潮淹掉的）、关掉碎片时不算。记一条 s.events（type: 'bounty'），r 上记 oreGain / oreTo
  function oreBounty(s, dead, by, r) {
    if (!oreOn(s) || !by || !(by.owner > 0) || !C.isEnemy(s, dead.owner, by.owner)) return 0;
    let n = 0;
    const add = u => { const k = u.ore ? (D.UNITS[u.type] && D.UNITS[u.type].ore) || 0 : 0; n += Math.ceil(k / 2); (u.cargo || []).forEach(add); };
    add(dead);
    if (!n) return 0;
    oreAdd(s, by.owner, n);
    (s.events || (s.events = [])).push({ type: 'bounty', player: by.owner, x: dead.x, y: dead.y, unit: dead.type, amount: n, total: s.ore[by.owner] });
    if (r) { r.oreGain = (r.oreGain || 0) + n; r.oreTo = by.owner; }
    return n;
  }

  C.newGame = function (def, opts) {
    opts = opts || {};
    // 地图写法：
    //   half：只写左半，旋转 180° 镜像（两方）
    //   rows + 大写字符（归一号）+ p2（二号自有建筑格）+ units / units2：整张图手写（两方）
    //   rows + owner 归属网格 + armies：多阵营写法，建筑归属只看 owner 网格（'.' 中立，'1'–'4'）
    const N = def.players || 2;
    if (N < 2 || N > 4) throw new Error('players must be 2–4');
    const full = def.rows, half = full || def.half, hw = half[0].length, h = half.length, w = full ? hw : hw * 2;
    const grid = full ? def.owner : null;
    if (!full && N !== 2) throw new Error('half maps are two-player only');
    const t = [], owner = [], cap = [];
    for (let y = 0; y < h; y++) { t.push(new Array(w)); owner.push(new Array(w).fill(0)); cap.push(new Array(w).fill(20)); }
    for (let y = 0; y < h; y++) for (let x = 0; x < hw; x++) {
      if (half[y].length !== hw) throw new Error('map row width mismatch at row ' + y);
      const ch = half[y][x], ty = D.CHARS[ch];
      if (!ty) throw new Error('bad map char ' + ch);
      const own = !grid && 'HKBPSGDFL'.includes(ch); // 一号玩家开局自有的建筑字符
      t[y][x] = ty; owner[y][x] = own ? 1 : 0;
      if (!full) { t[h - 1 - y][w - 1 - x] = ty; owner[h - 1 - y][w - 1 - x] = own ? 2 : 0; }
    }
    if (grid) {
      if (grid.length !== h) throw new Error('owner grid height mismatch');
      for (let y = 0; y < h; y++) {
        if (grid[y].length !== w) throw new Error('owner grid width mismatch at row ' + y);
        for (let x = 0; x < w; x++) {
          const ch = grid[y][x];
          if (ch === '.') continue;
          const p = +ch;
          if (!(p >= 1 && p <= N)) throw new Error('bad owner char ' + ch + ' at ' + x + ',' + y);
          if (!D.TERRAIN[t[y][x]].prop) throw new Error('owner tile is not a building: ' + x + ',' + y);
          owner[y][x] = p;
        }
      }
      const hqN = new Array(N + 1).fill(0);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (t[y][x] === 'hq') { if (!owner[y][x]) throw new Error('hq without owner at ' + x + ',' + y); hqN[owner[y][x]]++; }
      for (let p = 1; p <= N; p++) if (hqN[p] !== 1) throw new Error('player ' + p + ' must have exactly one hq, got ' + hqN[p]);
    }
    if (full) for (const [x, y] of def.p2 || []) { if (!D.TERRAIN[t[y][x]].prop) throw new Error('p2 tile is not a building: ' + x + ',' + y); owner[y][x] = 2; }

    const teams = opts.teams || def.teams, hc = def.handicap || HANDICAP[N];
    const rules = Object.assign({}, RULES, def.rules || {}, opts.rules || {});
    const s = {
      map: { w, h, t, owner, cap, name: def.name }, units: [], players: N, rules, aiLevels: [null], turn: 1, day: 1,
      team: [0], alive: [false], funds: [0], co: [null], meter: [0], powerOn: [false],
      winner: 0, winners: [], reason: '', log: [], nextId: 1, ai: null, ore: [0],
    };
    for (let p = 1; p <= N; p++) {
      s.team.push(teams && teams[p] ? teams[p] : p);
      s.alive.push(true);
      // 资金：opts.funds 是数组时按阵营给准数；opts.funds1 / funds2 同样是准数（显式的 0 也算）；
      // 都没给：opts.funds 是数字就当作所有人的底数，再加后手补贴
      const exact = Array.isArray(opts.funds) && opts.funds[p] != null ? opts.funds[p] : opts['funds' + p];
      s.funds.push(exact != null ? +exact : (typeof opts.funds === 'number' ? opts.funds : rules.startFunds || 0) + ((hc && hc[p]) || 0));
      s.aiLevels.push((opts.aiLevels && opts.aiLevels[p]) || rules.aiLevel || 'normal');
      s.co.push((opts.cos && opts.cos[p]) || opts['co' + p] || DEFAULT_CO[p]);
      s.meter.push(0); s.powerOn.push(false); s.ore.push(rules.startOre || 0);
    }
    for (let p = 1; p <= N; p++) { // 人数补偿的开局资金（给了准数的阵营不加）
      const exact = Array.isArray(opts.funds) && opts.funds[p] != null ? opts.funds[p] : opts['funds' + p];
      if (exact == null) s.funds[p] += C.handicapOf(s, p).funds;
    }
    for (const [ty, x, y] of def.units || []) { C.spawn(s, ty, 1, x, y); if (!full) C.spawn(s, ty, 2, w - 1 - x, h - 1 - y); }
    if (full) for (const [ty, x, y] of def.units2 || []) C.spawn(s, ty, 2, x, y);
    // armies 每项 [兵种, x, y, 开局 HP?, 强化?]：第四项是显示 HP（1–10），不写（或 null）就是满的；第五项为真是强化的单位
    if (def.armies) for (let p = 1; p <= N; p++) for (const [ty, x, y, hp, ore] of def.armies[p] || []) { const u = C.spawn(s, ty, p, x, y); if (hp != null) u.hp = Math.max(1, Math.min(100, hp * 10)); if (ore) u.ore = true; }
    s.units.forEach(u => { u.moved = false; });
    s.tech = [null]; s.rp = [0]; for (let p = 1; p <= N; p++) { s.tech.push(newTech()); s.rp.push(0); }
    s.techV = 2;
    // 每个席位扮演的阵营：opts.factions 指定（战役）；没指定就跟着所选的指挥官走（rules.factionByCo === false 时不推，按席位号）
    if (!opts.factions && rules.factionByCo !== false) s.factionOf = C.factionsFromCos(s.co);
    if (opts.factions) s.factionOf = opts.factions.slice(); // 每个席位扮演的阵营（下标 = 席位）；不给就是席位号。阵营特性、阵营科技树、研究方式都跟着它走
    if (opts.aiTech) s.aiTech = opts.aiTech.slice(); // 电脑的研究打法（下标 = 阵营编号）：'none' | 'balanced' | 'heavy'
    s.techK = def.techK > 0 ? def.techK : (D.TECH_K && D.TECH_K[def.name]) || autoTechK(s);
    s.events = [];
    oreRoll(s); // 每座矿的储量、每个碎片堆的拾取量
    C.startTurn(s);
    return s;
  };

  C.spawn = function (s, type, owner, x, y) {
    const u = { id: s.nextId++, type, owner, x, y, hp: 100, moved: true, stars: 0, cargo: [] };
    if (D.UNITS[type].cloak && !s.cloak) s.cloak = true; // 场上出现过隐形的兵种：从此“有东西看不见”
    s.units.push(u); return u;
  };

  // 对外的 unitAt 每次都按当前数据查，界面直接改 u.x / u.y 也不会查错。
  // 核心内部的热路径（reach、电脑）用 occGrid 一次建好的按格索引。
  C.unitAt = function (s, x, y) {
    const us = s.units;
    for (let i = 0; i < us.length; i++) if (us[i].x === x && us[i].y === y) return us[i];
    return null;
  };
  function occGrid(s) {
    const w = s.map.w, g = new Array(w * s.map.h), us = s.units;
    for (let i = 0; i < us.length; i++) g[us[i].y * w + us[i].x] = us[i];
    return g;
  }
  // ── 视野（迷雾） ──
  // 森林、礁石、废墟里的单位（飞机除外）和潜艇是隐蔽的：敌对方要有单位贴着才看得见
  const HIDE = { forest: 1, reef: 1, ruins: 1 };
  const TYPE_ID = {}; D.ORDER.forEach((k, i) => { TYPE_ID[k] = i + 1; });
  const visCache = new WeakMap(); // state → { sig, occ, vis: {队伍: Uint8Array} }，不入档
  let ONES = new Uint8Array(0);
  // 取这个状态的视野缓存。每次都先算一遍“单位 + 建筑归属”的校验和，变了就作废，
  // 所以不管谁、用什么办法动了单位或建筑，都拿不到旧结果
  function techSig(s) { // 各阵营完成了几项科技
    if (!s.tech) return '';
    let k = '';
    for (let p = 1; p < s.tech.length; p++) k += ',' + (s.tech[p] ? s.tech[p].done.length : 0);
    return k;
  }
  function visState(s) {
    const m = s.map, us = s.units;
    let h = us.length | 0;
    for (let i = 0; i < us.length; i++) { const u = us[i]; h = (Math.imul(h, 31) + u.x * 257 + u.y * 65537 + u.owner * 16777259 + (TYPE_ID[u.type] || 0)) | 0; }
    for (let y = 0; y < m.h; y++) { const row = m.owner[y]; for (let x = 0; x < m.w; x++) if (row[x]) h = (Math.imul(h, 131) + (y * m.w + x) * 8 + row[x]) | 0; }
    const ck = (s.rules && s.rules.coPassives === false ? '-' : '+') + (s.rules && s.rules.fog ? 'F' : 'f') + s.co.join() + s.powerOn.join() + techSig(s); // 指挥官、技能、科技会改视野
    let c = visCache.get(s);
    if (!c || c.sig !== h || c.w !== m.w || c.h !== m.h || c.ck !== ck) { c = { sig: h, w: m.w, h: m.h, ck, occ: null, vis: {} }; visCache.set(s, c); }
    return c;
  }
  function paint(v, w, h, cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= h) continue;
      const k = r - Math.abs(dy), x0 = Math.max(0, cx - k), x1 = Math.min(w - 1, cx + k);
      for (let x = x0; x <= x1; x++) v[y * w + x] = 1;
    }
  }
  function teamVision(s, st, tm) {
    let v = st.vis[tm];
    if (v) return v;
    const m = s.map, w = m.w, h = m.h;
    if (!fogOn(s)) { // 没开迷雾：格子全亮（看不看得见单位另算，见 canSeeIn）
      if (ONES.length !== w * h) ONES = new Uint8Array(w * h).fill(1);
      return st.vis[tm] = ONES;
    }
    v = st.vis[tm] = new Uint8Array(w * h);
    // 灯火管制：敌对阵营开着这个技能时，这支队伍的单位视野降为 1
    let dark = false;
    const chill = {};
    for (let q = 1, n = nP(s); q <= n; q++) if (aliveP(s, q) && teamOf(s, q) !== tm && fxOf(s, q).blackout) dark = true;
    for (const u of s.units) {
      if (u.owner <= 0 || teamOf(s, u.owner) !== tm) continue;
      let r = (D.UNITS[u.type].vision || 1) + modOf(s, u.owner, u.type).vision;
      if (m.t[u.y][u.x] === 'mountain' && C.isInfantry(u)) r += 3;
      if (chill[u.owner] == null) chill[u.owner] = chillOn(s, u.owner, 'vision');
      paint(v, w, h, u.x, u.y, dark ? 1 : Math.max(1, r + chill[u.owner]));
    }
    for (let y = 0; y < h; y++) {
      const row = m.owner[y];
      for (let x = 0; x < w; x++) {
        const o = row[x];
        if (!o || teamOf(s, o) !== tm) continue;
        const t = m.t[y][x];
        if (t === 'tower') paint(v, w, h, x, y, 5); else if (t === 'hq') paint(v, w, h, x, y, 2); else v[y * w + x] = 1;
      }
    }
    // 密码破译（rules.seeProps）：看得见敌方建筑周围几格
    let see = 0;
    for (let q = 1, n = nP(s); q <= n; q++) if (aliveP(s, q) && teamOf(s, q) === tm) see = Math.max(see, ruleOf(s, q).seeProps || 0);
    if (see) for (let y = 0; y < h; y++) {
      const row = m.owner[y];
      for (let x = 0; x < w; x++) if (row[x] && teamOf(s, row[x]) !== tm) paint(v, w, h, x, y, see);
    }
    return v;
  }
  function seeOnOf(s, st, tm) {
    const c = st.seeOn || (st.seeOn = {});
    if (c[tm] !== undefined) return c[tm];
    let out = null;
    for (let q = 1, n = nP(s); q <= n; q++) if (aliveP(s, q) && teamOf(s, q) === tm) { const so = ruleOf(s, q).seeOn; if (so) out = out ? out.concat(so) : so; }
    return c[tm] = out;
  }
  function canSeeIn(s, st, p, u) {
    if (!C.isEnemy(s, p, u.owner)) return true;
    const m = s.map, w = m.w, h = m.h, sub = u.type === 'sub', fog = fogOn(s);
    // 隐蔽：开迷雾时人人适用；没开迷雾时只有潜行指挥官的单位适用。没开迷雾而对方开着灯火管制：它的单位一律贴身才看得见
    const rlU = ruleOf(s, u.owner);
    // 算潮（rules.seeOn）：迷雾下，这些地形上的敌方单位只要在己方（和队友）的视野范围内就可见，礁石的隐蔽对它无效；视野外照样看不见。潜艇除外
    if (fog && !sub) { const so = seeOnOf(s, st, teamOf(s, p)); if (so && so.includes(m.t[u.y][u.x])) return teamVision(s, st, teamOf(s, p))[u.y * w + u.x] === 1; }
    const hp = rlU.hideProp && !D.UNITS[u.type].air && D.TERRAIN[m.t[u.y][u.x]].prop && inCls(rlU.hideProp, u.type, D.UNITS[u.type]); // 点灯人：位于建筑的这类单位隐蔽，不开迷雾也算
    const UK = D.UNITS[u.type].cloak, ck = UK === true || (UK === 'idle' && !u.shot); // 隐形的兵种（夜鸦；潜渊舰没开过火时）：不相邻就看不见，不开迷雾也算
    const cloak = fog || rlU.stealth || hp || ck;
    const hideOn = cloak ? ruleOf(s, u.owner).hideOn : null; // 藏兵：这个阵营的单位在这些地形里也算隐蔽
    const hide = cloak && (sub || hp || ck || ((fog || rlU.stealth) && !D.UNITS[u.type].air && (HIDE[m.t[u.y][u.x]] || (hideOn && hideOn.includes(m.t[u.y][u.x])))));
    if (!hide) {
      if (fog) return teamVision(s, st, teamOf(s, p))[u.y * w + u.x] === 1;
      if (!fxOf(s, u.owner).blackout) return true;
      // 没开迷雾时的灯火管制：对方只看得见自己单位 2 格以内的
      const occ = st.occ || (st.occ = occGrid(s)), R = fxOf(s, u.owner).blackoutR || 2;
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const d = Math.abs(dx) + Math.abs(dy), x = u.x + dx, y = u.y + dy;
        if (!d || d > R || x < 0 || y < 0 || x >= w || y >= h) continue;
        const o = occ[y * w + x];
        if (o && o.owner > 0 && !C.isEnemy(s, p, o.owner)) return true;
      }
      return false;
    }
    const occ = st.occ || (st.occ = occGrid(s)), r = sub ? 2 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.abs(dx) + Math.abs(dy), x = u.x + dx, y = u.y + dy;
      if (!d || x < 0 || y < 0 || x >= w || y >= h) continue;
      const o = occ[y * w + x];
      if (!o || o.owner <= 0 || C.isEnemy(s, p, o.owner)) continue;
      if (d === 1 || (d === 2 && o.type === 'dst' && sub && !ruleOf(s, u.owner).subSneak)) return true; // 贴着的任何单位；潜艇另外怕 2 格内的驱逐舰（rules.subSneak 的潜艇只怕贴身的）
      if (!sub && d === 2 && (D.UNITS[o.type].reveal || fxHas(ruleOf(s, o.owner).revealBy, o.type))) return true; // 喷火兵：斜角那四格也看得见（潜艇除外）
    }
    return false;
  }
  // ── 预演 ──
  // 界面让玩家“先摆到终点、再选动作”时，单位的坐标已经改成了终点，但行动还没定下来。按规则，行动定下来才揭示：
  // 预演期间一切“看不看得见”的判断都按出发格算。界面在摆动单位前调 C.setPreview(s, u, 出发格 x, y)，确认或取消后调 C.clearPreview(s)。
  // 记在 state 之外（不入档）。没调就是按单位当前坐标算，和以前一样。
  const PREVIEW = new WeakMap();
  // 可以撤回的上一个动作（刚造的兵、一次纯移动）。记在 state 之外，不入档；下一个动作一开始就丢掉。电脑执行动作时不记
  const UNDO = new WeakMap(), TRAPPED = new WeakMap();
  let NOUNDO = false;
  C.setPreview = function (s, u, x, y) { PREVIEW.set(s, { u, x, y }); };
  C.clearPreview = function (s) { PREVIEW.delete(s); };
  function atOrigin(s, fn) {
    const pv = PREVIEW.get(s);
    if (!pv || (pv.u.x === pv.x && pv.u.y === pv.y) || !s.units.includes(pv.u)) return fn();
    const u = pv.u, x = u.x, y = u.y;
    u.x = pv.x; u.y = pv.y;
    try { return fn(); } finally { u.x = x; u.y = y; }
  }
  // p（和队友）看得见的格子：Uint8Array，下标 y*w+x。迷雾关闭时全是 1。只读
  C.vision = function (s, p) {
    if (!fogOn(s)) {
      const n = s.map.w * s.map.h;
      if (ONES.length !== n) ONES = new Uint8Array(n).fill(1);
      return ONES;
    }
    return atOrigin(s, () => teamVision(s, visState(s), teamOf(s, p)));
  };
  // p 能不能看见这个单位（含隐蔽规则）
  C.canSee = function (s, p, u) { return !veilOn(s) || !C.isEnemy(s, p, u.owner) || atOrigin(s, () => canSeeIn(s, visState(s), p, u)); };
  // 敌方单位沿 path 走的时候，p 在每一格看不看得见它（界面播移动动画用）。返回和 path 等长的布尔数组；不改单位坐标
  C.pathSeen = function (s, p, u, path) {
    if (!veilOn(s) || !C.isEnemy(s, p, u.owner)) return path.map(() => true);
    const x = u.x, y = u.y, out = [];
    try { for (const c of path) { u.x = c[0]; u.y = c[1]; out.push(canSeeIn(s, visState(s), p, u)); } } finally { u.x = x; u.y = y; }
    return out;
  };
  C.visibleUnits = function (s, p) {
    if (!veilOn(s)) return s.units.slice();
    return atOrigin(s, () => { const st = visState(s); return s.units.filter(u => canSeeIn(s, st, p, u)); });
  };
  // ── 看得见单位的格子（界面画迷雾用；只读，不改规则，判断全走 canSeeIn）──
  // 一格算“看得见”：假设每个敌对阵营各有一个普通地面单位（步兵；不隐形、不是潜艇）站在这一格，p 都看得见它。
  // 所以开迷雾时，视野里但没有己方单位贴着的森林、礁石、废墟（以及对手藏兵、点灯人这类规则加上的隐蔽地形）不算看得见；
  // 视野半径、山地、雷达塔都不能看穿隐蔽地形，喷火兵、算潮这类规则照核心原样生效。
  // 这一格上已经站着 p 看得见的单位（自己的、队友的、看得见的敌人）也算看得见。隐形兵种和潜艇另有规则，不按它们算。
  // lim：只算 lim 里为 1 的格子（单个单位版用）。
  function seeFill(s, st, p, out, lim) {
    const w = s.map.w, n = w * s.map.h, foes = [];
    for (let q = 1, N = nP(s); q <= N; q++) if (aliveP(s, q) && C.isEnemy(s, p, q)) foes.push(q);
    const pr = { type: 'inf', owner: 0, x: 0, y: 0, hp: 100, shot: false };
    for (let i = 0; i < n; i++) {
      if (lim && !lim[i]) continue;
      pr.x = i % w; pr.y = (i - pr.x) / w;
      let ok = 1;
      for (const q of foes) { pr.owner = q; if (!canSeeIn(s, st, p, pr)) { ok = 0; break; } }
      out[i] = ok;
    }
    for (const o of s.units) { const i = o.y * w + o.x; if ((!lim || lim[i]) && (!C.isEnemy(s, p, o.owner) || canSeeIn(s, st, p, o))) out[i] = 1; }
    return out;
  }
  // p 在每一格看不看得见单位：Uint8Array，下标 y*w+x。没有“看不见的单位”（C.veilOn 为假）时全是 1。
  // 和视野共用一份缓存（单位、建筑、指挥官、技能、科技变了才重算）。只读，别改返回的数组
  C.seeCells = function (s, p) {
    const n = s.map.w * s.map.h;
    if (!veilOn(s)) { if (ONES.length !== n) ONES = new Uint8Array(n).fill(1); return ONES; }
    return atOrigin(s, () => {
      const st = visState(s), c = st.see || (st.see = {});
      return c[p] || (c[p] = seeFill(s, st, p, new Uint8Array(n), null));
    });
  };
  // 单个单位版：只靠 u 自己（视野半径 = C.unitMods 的 vision、贴身才看得见隐蔽地形），按它现在的坐标算。
  // 没有“看不见的单位”时就是视野半径的菱形。每次调用都新算一张
  C.unitSeeCells = function (s, u) {
    const w = s.map.w, h = s.map.h, n = w * h, dia = new Uint8Array(n);
    paint(dia, w, h, u.x, u.y, unitSight(s, u));
    if (!veilOn(s) || u.owner <= 0) return dia;
    const occ = new Array(n); occ[u.y * w + u.x] = u;
    const st = { vis: { [teamOf(s, u.owner)]: dia }, occ };
    return seeFill(s, st, u.owner, new Uint8Array(n), dia);
  };
  // 迷雾下真正移动前过一遍：路径上撞到看不见的敌对单位，就停在它前面最近的能停的格子，本回合行动结束
  C.resolveMove = function (s, u, path) { return atOrigin(s, () => resolveMove0(s, u, path)); };
  const passOn = (s, u) => u.owner > 0 && (fxHas(fxOf(s, u.owner).pass, u.type) || fxHas(ruleOf(s, u.owner).pass, u.type));
  function resolveMove0(s, u, path) {
    if (!veilOn(s) || !path || path.length < 2) return { path, trapped: false };
    const st = visState(s), w = s.map.w, occ = st.occ || (st.occ = occGrid(s));
    const through = passOn(s, u); // 能穿过敌人的单位：路上的不拦，只看终点
    for (let k = through ? path.length - 1 : 1; k < path.length; k++) {
      const o = occ[path[k][1] * w + path[k][0]];
      if (!o || o === u || !C.isEnemy(s, u.owner, o.owner) || canSeeIn(s, st, u.owner, o)) continue;
      let e = k - 1;
      while (e > 0) { const b = occ[path[e][1] * w + path[e][0]]; if (!b || b === u) break; e--; }
      // 潜行指挥官（rules.noAmbush）的单位撞上隐蔽的敌人只是停下，不算遇伏：trapped 为 false、bumped 为 true，这次行动还能接着做
      if (ruleOf(s, u.owner).noAmbush) { TRAPPED.set(s, u); return { path: path.slice(0, e + 1), trapped: false, bumped: true }; }
      // by：拦住它的那个单位（夜棠“看错了”要用，见 C.ambushShot）。不可枚举：不进 JSON，也不影响按内容比较返回值的老代码
      TRAPPED.set(s, u); // 这次移动被拦停了：不能撤回
      return Object.defineProperty({ path: path.slice(0, e + 1), trapped: true }, 'by', { value: o, enumerable: false });
    }
    return { path, trapped: false };
  }

  // 电脑算一步棋期间的只读快照（按格索引、建筑表、各方雷达塔数……）。只在 C.aiNext 里有效
  let CTX = null;

  C.dispHp = u => Math.ceil(u.hp / 10);
  C.count = function (s, p, type) {
    let n = 0; const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.owner[y][x] === p && m.t[y][x] === type) n++;
    return n;
  };
  C.props = function (s, p, all) {
    let n = 0; const m = s.map;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const T = D.TERRAIN[m.t[y][x]];
      if (m.owner[y][x] === p && (all ? T.prop : T.income)) n++;
    }
    return n;
  };
  // 每回合实际收入：各建筑 income 金额相加（矿场 200，其余收入建筑 100）
  // s.rules.income 是普通收入建筑的金额，矿场按倍数
  const incOf = (T, per) => (T.income ? (T.income === true ? 100 : T.income) / 100 * per : 0);
  // 建筑收入 + 阵营的城市收入加成（不含人数补偿）
  function rawIncome(s, p) {
    let n = 0, cities = 0, mines = 0, frz = null; const m = s.map, per = rulesOf(s).income;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.owner[y][x] !== p) continue;
      if (s.tech && s.co && m.cap && m.cap[y] && m.cap[y][x] < 20) { // 封账：正被带这项科技的敌方单位占着的建筑，这回合不交收入
        if (frz === null) { frz = false; for (let q = 1, N = nP(s); q <= N; q++) if (q !== p && aliveP(s, q) && C.isEnemy(s, p, q) && ruleOf(s, q).freeze) frz = true; }
        if (frz) { const o = C.unitAt(s, x, y); if (o && C.isEnemy(s, p, o.owner) && ruleOf(s, o.owner).freeze) continue; }
      }
      n += incOf(D.TERRAIN[m.t[y][x]], per);
      if (m.t[y][x] === 'city') cities++; else if (m.t[y][x] === 'mine') mines += incOf(D.TERRAIN.mine, per);
    }
    const fq = s.co && s.factionOf && s.factionOf[p] && D.FACTIONS[s.factionOf[p]];
    const fl = fq ? { cityIncome: fq.cityIncome || 0 } : s.co && COFLAG[s.co[p]], ci = fl && !(s.rules && s.rules.coPassives === false) ? fl.cityIncome : 0; // 阵营偏好：城市收入
    const rl = s.co ? ruleOf(s, p) : NOR;
    if (rl.cityTax) n += cities * rl.cityTax; // 关税
    if (rl.mineBonus) n += mines * rl.mineBonus; // 专营权
    return ci || rl.cityTax || rl.mineBonus ? Math.round((n + cities * per * ci) / 10) * 10 : n; // 金额保持 10 的整数倍
  }
  C.income = function (s, p) { return rawIncome(s, p) + C.handicapOf(s, p).income; }; // 人数补偿：固定金额、有上限，见 C.handicapOf

  C.moveCost = function (u, terr) {
    const U = D.UNITS[u.type];
    if (U.air) return 1;
    if (U.ship) { // 船：海、港口 1，礁石 2；登陆艇（能装陆军的船）还能开上沙滩
      const c = D.MOVE.ship[terr] || 0;
      return c || (U.carry && U.carry.kind === 'ground' ? D.TERRAIN[terr].lander || 0 : 0);
    }
    if (D.TERRAIN[terr].prop) return 1;
    return D.MOVE[U.mt][terr] || 0;
  };
  // 每个兵种的地形消耗表，按需算一次
  const COSTS = {};
  function costTable(type) {
    let ct = COSTS[type];
    if (!ct) { ct = COSTS[type] = {}; for (const k in D.TERRAIN) ct[k] = C.moveCost({ type }, k); }
    return ct;
  }
  // 带上规则的地形消耗表：rules.flatMove（能进的地形一律按 1 算）、rules.flatOn（{ 兵种类别: [地形] }，这些地形按 1 算）
  const FLATC = new WeakMap(); // rules 对象 → { 兵种: 表 }
  function moveTable0(s, u) {
    if (!(u.owner > 0)) return costTable(u.type);
    const rl = ruleOf(s, u.owner);
    if (!rl.flatMove && !rl.flatOn && !rl.moveOver) return costTable(u.type);
    let m = FLATC.get(rl);
    if (!m) FLATC.set(rl, m = {});
    let ct = m[u.type];
    if (ct) return ct;
    ct = m[u.type] = {};
    const b = costTable(u.type), U = D.UNITS[u.type];
    for (const k in b) ct[k] = b[k] && rl.flatMove ? 1 : b[k];
    // flatOn 的键可以是兵种类别，也可以是兵种 id
    if (rl.flatOn) for (const cls in rl.flatOn) if (CLS[cls] ? CLS[cls](u.type, U) : cls === u.type) for (const terr of rl.flatOn[cls]) if (ct[terr]) ct[terr] = 1;
    // moveOver：{ 移动方式: { 地形: 消耗 } }，原来进不去的也能进（冰面），不受 flatMove 影响
    const ov = rl.moveOver && !U.air && !U.ship ? rl.moveOver[U.mt] : null;
    if (ov) for (const terr in ov) ct[terr] = ov[terr];
    return ct;
  }
  // 寒潮 · 极（fx.chill.rough）：敌对阵营的单位进这几种地形多花移动力（飞机不算）
  const ROUGH = ['forest', 'mountain', 'waste', 'swamp', 'river'], ROUGHC = new WeakMap();
  function moveTable(s, u) {
    const ct = moveTable0(s, u);
    if (!(u.owner > 0) || !s.tech || D.UNITS[u.type].air) return ct;
    const rough = chillOn(s, u.owner, 'rough'), road = chillOn(s, u.owner, 'road'); // road：封路，敌方在道路和桥梁上多花移动力
    if (!rough && !road) return ct;
    let m = ROUGHC.get(ct);
    if (!m) ROUGHC.set(ct, m = {});
    const key = rough + '|' + road;
    let rt = m[key];
    if (!rt) {
      rt = m[key] = Object.assign({}, ct);
      if (rough) for (const terr of ROUGH) if (rt[terr]) rt[terr] += rough;
      if (road) for (const terr of ['road', 'bridge']) if (rt[terr]) rt[terr] += road;
    }
    return rt;
  }
  // 带上指挥官和科技规则的地形消耗（界面显示“这格要花几点移动力”用它；C.moveCost 是不看这些的基础值）
  C.moveCostOf = function (s, u, terr) { return moveTable(s, u)[terr] || 0; };
  // 敌对阵营开着的“减速 / 减视野”技能（fx.chill = { move, vision }）对 p 的合计
  function chillOn(s, p, key) {
    let v = 0;
    for (let q = 1, n = nP(s); q <= n; q++) if (q !== p && aliveP(s, q) && C.isEnemy(s, p, q)) { const c = fxOf(s, q).chill; if (c && c[key]) v += c[key]; }
    return v;
  }
  // 敌对阵营开着的“大潮”（fx.ebb = { move, noRepair }）
  function ebbOn(s, p) {
    for (let q = 1, n = nP(s); q <= n; q++) if (q !== p && s.powerOn[q] && aliveP(s, q) && C.isEnemy(s, p, q)) { const e = fxOf(s, q).ebb; if (e) return e; }
    return null;
  }
  C.movePts = function (s, u) {
    const U = D.UNITS[u.type]; let m = U.move;
    if (u.dropped) return 0; // 索降：卸下来的单位还能打、能占，不能再走
    if (u.fired && u.left != null) return u.left; // 打完还能动的单位：只剩这么多移动力（rules.hitRun）
    m += modOf(s, u.owner, u.type).move;
    if (s.powerOn[u.owner]) {
      m += fxSum(fxOf(s, u.owner).move, u.type, U);
      const co = s.co[u.owner], P = pwOf(s, u.owner);
      if (co === 'blitz') m += (U.mt === 'foot' || U.mt === 'mech') ? P.blitzFoot : P.blitzMove;
      else if (co === 'tide') m += U.ship ? P.tideMove : P.tideAllMove;
      else if (co === 'sky') m += U.air ? P.skyMove : P.skyAllMove;
      else if (co === 'iron' && CLS.tank(u.type)) m += P.ironMove;
    }
    if (u.march) m += u.march; // 机械化行军、踏雪：回合开始时站在某些地形上
    if (u.ore && U.carry && !U.range) m += D.RES.move; // 强化的运输单位
    if (u.fresh) m += ruleOf(s, u.owner).freshMove || 0; // 热车：刚造出来的那个回合
    if (U.ship && m > U.move + 3) m = U.move + 3; // 船的移动力加成合计最多 +3
    const ch = chillOn(s, u.owner, 'move');
    if (ch) m = Math.max(1, m + ch);
    if (U.ship) { const eb = ebbOn(s, u.owner); if (eb) m = Math.max(1, m + eb.move); } // 大潮：敌方舰船移动力下降
    return m;
  };

  // Dijkstra（二叉堆）。unlimited：不限移动力；ignoreUnits：无视单位阻挡；sx/sy：起点
  // 敌对阵营的单位挡路，自己和队友的单位可以穿过（能不能停下看 C.canStop）
  let HK = new Float64Array(1024), HV = new Int32Array(1024); // 堆：键（距离）和值（格子下标），reach 不会重入，全局复用
  let CC = new Int8Array(0); // 本次调用里每格的移动消耗 +1（0 = 还没查）
  const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
  C.reach = function (s, u, unlimited, ignoreUnits, sx, sy) { return dijkstra(s, u, unlimited, ignoreUnits, sx, sy, null); };
  // extra：每格额外的进入代价（电脑绕路用），没有就传 null
  function dijkstra(s, u, unlimited, ignoreUnits, sx, sy, extra) {
    const m = s.map, w = m.w, h = m.h, n = w * h, t = m.t;
    const dist = new Array(n).fill(INF), prev = new Array(n).fill(-1);
    const start = (sy == null ? u.y : sy) * w + (sx == null ? u.x : sx);
    const mp = unlimited ? INF : C.movePts(s, u), ct = moveTable(s, u);
    const pass = passOn(s, u); // fx.pass / rules.pass：能穿过敌方单位所在的格子（不能停在上面）
    const inCtx = CTX && CTX.s === s;
    const occ = ignoreUnits ? null : (inCtx ? CTX.occ : occGrid(s));
    const me = u.owner, tm = occ ? teamOf(s, me) : 0;
    // 迷雾：看不见的敌对单位不算障碍（电脑的快照里本来就只有它看得见的单位）
    const fst = occ && !inCtx && veilOn(s) ? visState(s) : null;
    if (CC.length < n) CC = new Int8Array(n); else CC.fill(0, 0, n);
    if (HK.length < 4 * n + 4) { HK = new Float64Array(4 * n + 4); HV = new Int32Array(4 * n + 4); } // 每条边最多进堆一次
    dist[start] = 0;
    let hn = 1; HK[0] = 0; HV[0] = start;
    while (hn) {
      const cd = HK[0], cur = HV[0];
      hn--;
      if (hn) { // 堆顶出堆，末尾元素下沉
        const k = HK[hn], v = HV[hn]; let i = 0;
        for (;;) {
          let c = 2 * i + 1;
          if (c >= hn) break;
          if (c + 1 < hn && HK[c + 1] < HK[c]) c++;
          if (HK[c] >= k) break;
          HK[i] = HK[c]; HV[i] = HV[c]; i = c;
        }
        HK[i] = k; HV[i] = v;
      }
      if (cd > dist[cur]) continue; // 过期条目
      const cx = cur % w, cy = (cur - cx) / w;
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        let c = CC[ni];
        if (!c) c = CC[ni] = ct[t[ny][nx]] + 1;
        if (c === 1) continue; // 进不去
        const nd = cd + c - 1 + (extra ? extra[ni] : 0);
        if (nd > mp || nd >= dist[ni]) continue;
        if (occ && !pass) { const o = occ[ni]; if (o && o.owner !== me && o.owner > 0 && me > 0 && teamOf(s, o.owner) !== tm && (!fst || canSeeIn(s, fst, me, o))) continue; }
        dist[ni] = nd; prev[ni] = cur;
        let i = hn++;
        while (i > 0) { const pa = (i - 1) >> 1; if (HK[pa] <= nd) break; HK[i] = HK[pa]; HV[i] = HV[pa]; i = pa; }
        HK[i] = nd; HV[i] = ni;
      }
    }
    return { dist, prev };
  }
  C.path = function (prev, i, w) {
    const p = [];
    while (i !== -1) { p.push([i % w, (i - i % w) / w]); i = prev[i]; }
    return p.reverse();
  };
  C.canStop = function (s, u, r, x, y) {
    if (r.dist[y * s.map.w + x] === INF) return false;
    const o = C.unitAt(s, x, y);
    return !o || o === u || (veilOn(s) && !C.canSee(s, u.owner, o)); // 迷雾里看不见的敌人不拦着你选这一格
  };

  // “这次行动走过没有”：C.moveUnit 走过会记 u.mvd（回合结束清）；界面预演时按 C.setPreview 记的出发格判断
  function ranNow(s, u) {
    if (u.mvd) return true;
    const pv = PREVIEW.get(s);
    return !!pv && pv.u === u && (pv.x !== u.x || pv.y !== u.y);
  }
  // 移动后开火的特别规定（rules.moveShot / fx.moveShot：{ 兵种: { atk?, range? } }）
  function moveShotOf(s, u) {
    const own = D.UNITS[u.type].moveShot; // 兵种自带的（装甲列车：移动后只能打相邻的）
    if (own) return own;
    if (!s.tech || !(u.owner > 0)) return null;
    const a = ruleOf(s, u.owner).moveShot, b = fxOf(s, u.owner).moveShot;
    return (a && a[u.type]) || (b && b[u.type]) || null;
  }
  // a 打不打得了 d：伤害表里有数，而且没被“俯冲 · 极”挡住（fx.highAlt：这个阵营的固定翼飞机只有这几种兵种打得到）
  function canHit(s, a, d) {
    if (D.DMG[a.type][d.type] == null) return false;
    if (!s.tech) return true;
    const h = fxOf(s, d.owner).highAlt;
    return !(h && CLS.plane(d.type, D.UNITS[d.type]) && !h.includes(a.type));
  }
  C.canHit = canHit;
  C.rangeOf = function (s, u) {
    const U = D.UNITS[u.type];
    if (!U.range) return null;
    const ms = moveShotOf(s, u);
    if (ms && ms.range && ranNow(s, u)) return ms.range.slice(); // 试射、怒潮 · 极：移动后的这一发射程另算，不吃别的射程加成
    let [mn, mx] = U.range;
    if (mx > 1 && s.powerOn[u.owner] && s.co[u.owner] === 'storm') mx += pwOf(s, u.owner).stormRange;
    // 高地：碉堡上的远程单位、山地上的步兵类远程 / 抛射单位（狙击手、投弹手）射程 +1，两样不叠加
    if (mx > 1 && (C.fortified(s, u) || (s.map.t[u.y][u.x] === 'mountain' && C.isInfantry(u)))) mx += 1;
    mx += modOf(s, u.owner, u.type).range;
    if (mx > U.range[1] + 2) mx = U.range[1] + 2; // 各种射程加成合计最多 +2
    return [mn, mx];
  };
  // 移动之后还能不能攻击：近战单位和抛射单位（lob，投弹手）可以，其余远程单位不行
  // 传了 s 才会算上指挥官的规则（rules.moveFire：这些兵种也能移动后开火，苍柏的狙击手）；界面请一律传 s
  C.canMoveFire = function (u, s) {
    const U = D.UNITS[u.type];
    if (!U.range) return false;
    return U.range[1] === 1 || !!U.lob || !!U.moveShot || (!!s && u.owner > 0 && (fxHas(ruleOf(s, u.owner).moveFire, u.type) || fxHas(fxOf(s, u.owner).moveFire, u.type)));
  };
  // 单位是否站在己方或中立的碉堡上（飞机不算）
  C.fortified = function (s, u) {
    if (D.UNITS[u.type].air || s.map.t[u.y][u.x] !== 'fort') return false;
    const o = s.map.owner[u.y][u.x];
    return o === u.owner || o === 0;
  };
  // 步兵类：徒步的（foot / mech）和摩托兵。医院只治这些
  C.isInfantry = function (u) {
    const U = D.UNITS[u.type];
    return U.mt === 'foot' || U.mt === 'mech' || u.type === 'bik';
  };
  // 单位站在当前 x,y 时能打到谁（只有敌对阵营的单位）；moved：这次行动是否移动过
  C.targets = function (s, u, moved) {
    let rg = C.rangeOf(s, u);
    if (!rg) return [];
    if (u.fired || (moved && !C.canMoveFire(u, s))) return []; // u.fired：履带洪流里已经打过一次
    if (moved) { const ms = moveShotOf(s, u); if (ms && ms.range) rg = ms.range; }
    // 看不看得见按出发格算（预演期间），够不够得着按现在的位置算
    const seen = veilOn(s) ? atOrigin(s, () => { const st = visState(s), m = new Set(); for (const e of s.units) if (C.isEnemy(s, u.owner, e.owner) && canSeeIn(s, st, u.owner, e)) m.add(e); return m; }) : null;
    return s.units.filter(e => {
      if (!C.isEnemy(s, u.owner, e.owner) || !canHit(s, u, e)) return false;
      const d = Math.abs(e.x - u.x) + Math.abs(e.y - u.y);
      return d >= rg[0] && d <= rg[1] && (!seen || seen.has(e));
    });
  };

  // ── 建筑的范围增益（D.TERRAIN[建筑].aura = { r, atk }）：建筑主人的单位站在曼哈顿距离 r 格内时生效；只算自己阵营的建筑，几座重叠不叠加 ──
  const AURA = []; for (const k in D.TERRAIN) if (D.TERRAIN[k].aura) AURA.push(k);
  const AURA_R = AURA.reduce((r, k) => Math.max(r, D.TERRAIN[k].aura.r), 0);
  // (x,y) 上属于 p 的单位吃到的增益：{ atk, x, y }（x,y 是给它增益的那座建筑）或 null
  function auraAt(s, p, ux, uy) {
    if (!AURA_R || !(p > 0)) return null;
    const m = s.map, w = m.w, h = m.h;
    let best = null;
    for (let dy = -AURA_R; dy <= AURA_R; dy++) {
      const y = uy + dy;
      if (y < 0 || y >= h) continue;
      const tr = m.t[y], or = m.owner[y], k = AURA_R - Math.abs(dy);
      for (let x = Math.max(0, ux - k), x1 = Math.min(w - 1, ux + k); x <= x1; x++) {
        if (or[x] !== p) continue;
        const au = D.TERRAIN[tr[x]].aura;
        if (au && Math.abs(x - ux) + Math.abs(dy) <= au.r && (!best || au.atk > best.atk)) best = { atk: au.atk, x, y };
      }
    }
    return best;
  }
  function auraAtk(s, u) {
    if (CTX && CTX.s === s) { // 电脑算棋：每个阵营一张格子表，用到才建
      if (!CTX.tower[u.owner]) return 0;
      let g = CTX.aura[u.owner];
      if (!g) {
        const m = s.map; g = CTX.aura[u.owner] = new Float32Array(m.w * m.h);
        for (const pr of CTX.props) {
          const au = pr.owner === u.owner ? D.TERRAIN[pr.t].aura : null;
          if (!au) continue;
          for (let dy = -au.r; dy <= au.r; dy++) for (let dx = -au.r + Math.abs(dy); dx <= au.r - Math.abs(dy); dx++) {
            const x = pr.x + dx, y = pr.y + dy;
            if (x >= 0 && y >= 0 && x < m.w && y < m.h && g[y * m.w + x] < au.atk) g[y * m.w + x] = au.atk;
          }
        }
      }
      return g[u.y * s.map.w + u.x];
    }
    const a = auraAt(s, u.owner, u.x, u.y);
    return a ? a.atk : 0;
  }
  // (x,y) 这座建筑的作用格 [[x,y], …]（含它自己那一格）；不是带范围增益的建筑就返回空数组
  C.auraCells = function (s, x, y) {
    const m = s.map, au = D.TERRAIN[m.t[y][x]].aura, out = [];
    if (!au) return out;
    for (let dy = -au.r; dy <= au.r; dy++) for (let dx = -au.r + Math.abs(dy); dx <= au.r - Math.abs(dy); dx++) {
      const cx = x + dx, cy = y + dy;
      if (cx >= 0 && cy >= 0 && cx < m.w && cy < m.h) out.push([cx, cy]);
    }
    return out;
  };
  // 这个单位现在吃到的建筑增益：{ atk, from: [x, y] }，没有就是 null。C.damage、C.forecast、C.damageRange、C.unitMods 都已经算进去了
  C.auraOf = function (s, u) {
    const a = auraAt(s, u.owner, u.x, u.y);
    return a ? { atk: a.atk, from: [a.x, a.y] } : null;
  };
  // 进攻方的攻击系数（1 = 没有任何加减）。dType：目标兵种（null = 不看目标）；counter：是不是反击
  // (x,y) 四邻里属于 p 的单位（不算 skip）。电脑算棋时走快照，别处逐个查
  function ownNear(s, p, x, y, skip, pred) {
    const w = s.map.w, h = s.map.h, occ = CTX && CTX.s === s ? CTX.occ : null;
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const nx = x + DX[i], ny = y + DY[i];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const o = occ ? occ[ny * w + nx] : C.unitAt(s, nx, ny);
      if (o && o !== skip && o.owner === p && (!pred || pred(o))) n++;
    }
    return n;
  }
  const isShipU = o => !!D.UNITS[o.type].ship;
  // d：目标单位（要按它的位置算“联合火力”时才传）
  function atkMul(s, a, dType, counter, d) {
    const aura = auraAtk(s, a); // 雷达塔：只管范围内的己方单位，几座重叠也只算一次
    const A = D.UNITS[a.type], Dd = dType ? D.UNITS[dType] : null, ma = modOf(s, a.owner, a.type);
    const fxA = fxOf(s, a.owner), rA = ruleOf(s, a.owner);
    let atk = 1 + aura + 0.05 * a.stars + ma.atk + fxSum(fxA.atk, a.type, A) + (oreVs(a, dType) ? D.RES.atk : 0); // 强化建造的单位：只对强化价不高于自己的目标加攻击
    if (!counter && rA.atkInit && !(rA.initWaive && d && C.dispHp(d) < C.dispHp(a))) atk += rA.atkInit; // 补拳：打 HP 比自己低的不吃这个惩罚
    if (counter) atk += ma.counterAtk; // 反击时的攻击增减（mods 的 counterAtk 字段）
    if (Dd && ma.vs) for (const cls in ma.vs) if (inCls(cls, dType, Dd)) atk += ma.vs[cls]; // 对某一类目标的攻击增减（mods 的 vs 字段）
    if (fxA.hurtAtk && a.hp < 100) atk += fxA.hurtAtk; // 技能：HP 不满的单位加攻击
    if (fxA.hurtAtkPer && a.hp < 100) atk += fxA.hurtAtkPer * (10 - C.dispHp(a)); // 背水 · 极：每缺 1 点 HP 加一份
    if (ma.atkOn && !A.air) atk += ma.atkOn[s.map.t[a.y][a.x]] || 0; // 站在某种地形上进攻时的攻击增减（mods 的 atkOn 字段）
    if (d && !counter && (rA.gang || fxA.gang)) { // 联合火力（rules.gang）、蜂群 · 极（fx.gang，限定出手兵种和算数的邻居）：两样合计不超过较大的那个上限
      let g = 0, gm = 0;
      if (rA.gang) { g += Math.min(rA.gang.max, rA.gang.per * ownNear(s, a.owner, d.x, d.y, a)); gm = rA.gang.max; }
      const fg = fxA.gang;
      if (fg && inCls(fg.by, a.type, A)) { g += Math.min(fg.max, fg.per * ownNear(s, a.owner, d.x, d.y, a, o => inCls(fg.near, o.type, D.UNITS[o.type]))); gm = Math.max(gm, fg.max); }
      atk += Math.min(g, gm);
    }
    const bd = rA.buddy; // 跟车走：自己挨着一个己方的某类单位
    if (bd && inCls(bd.on, a.type, A) && !inCls(bd.not, a.type, A) && ownNear(s, a.owner, a.x, a.y, a, o => inCls(bd.near, o.type, D.UNITS[o.type]))) atk += bd.atk;
    if (rA.fullHpAtk && a.hp >= 100) atk += rA.fullHpAtk; // 按时吃饭
    if (rA.offRoad && inCls(rA.offRoad.on, a.type, A)) { const ta = s.map.t[a.y][a.x]; if (ta !== 'road' && ta !== 'bridge' && !D.TERRAIN[ta].prop) atk += rA.offRoad.atk; } // 铺路：离了路手生
    if (!counter && a.still && rA.stillAtk && inCls(rA.stillAtk.on, a.type, A)) atk += rA.stillAtk.atk; // 坐底
    if (counter && rA.holdCounter && !A.air && D.TERRAIN[s.map.t[a.y][a.x]].def >= 2) atk += rA.holdCounter; // 垛口
    if (!counter && s.tech) { const ms = moveShotOf(s, a); if (ms && ms.atk && ranNow(s, a)) atk += ms.atk; } // 试射：移动后的这一发
    if (rA.fleet && A.ship && ownNear(s, a.owner, a.x, a.y, a, isShipU)) atk += rA.fleet.atk; // 联合舰队
    if (rA.carrierAir && A.air) { // 舰载协同：几格内有己方的船
      const R = rA.carrierAir.r;
      for (const o of s.units) if (o.owner === a.owner && D.UNITS[o.type].ship && Math.abs(o.x - a.x) + Math.abs(o.y - a.y) <= R) { atk += rA.carrierAir.atk; break; }
    }
    if (s.powerOn[a.owner]) {
      const co = s.co[a.owner], P = pwOf(s, a.owner);
      if (co === 'blitz') atk += P.blitzAtk;
      else if (co === 'sky') atk += A.air ? P.skyAtk : P.skyAll;
      else if (co === 'iron' && CLS.tank(a.type)) atk += P.ironAtk;
      else if (co === 'tide' && A.ship && Dd && !Dd.air && !Dd.ship) atk += P.tideShore;
    }
    return atk;
  }
  // 防守方的防御系数（0–0.7）。cover：进攻方把地形防御算几成（投弹手 0.5、喷火兵 0、其余 1）
  // aType：进攻方的兵种（强化的防御加成看它；不传 = 不看进攻方，不含强化加成）
  function defFrac(s, d, cover, pierce, aType) {
    const Dd = D.UNITS[d.type], md = modOf(s, d.owner, d.type), fxD = fxOf(s, d.owner), rD = ruleOf(s, d.owner);
    const dTerr = s.map.t[d.y][d.x], tStars = Dd.air ? 0 : Math.max(0, D.TERRAIN[dTerr].def - (pierce || 0));
    const def = 0.1 * tStars * cover * (rD.fullCover ? 10 : C.dispHp(d)) / 10 + 0.05 * d.stars + md.def + // rules.fullCover：地形防御不随 HP 下降
      (d.ran && rD.ranDef ? rD.ranDef : 0) + // 掉头：打完又走开的单位
      (oreVs(d, aType) ? D.RES.def : 0) + // 强化建造的单位：只在进攻方强化价不高于自己时加防御
      (rD.fleet && Dd.ship && ownNear(s, d.owner, d.x, d.y, d, isShipU) ? rD.fleet.def : 0) +
      (md.hold && tStars >= 2 ? md.hold : 0) +
      (md.defOn && !Dd.air ? (md.defOn[dTerr] || 0) + (D.TERRAIN[dTerr].prop ? md.defOn.prop || 0 : 0) : 0) +
      (s.powerOn[d.owner] ? (s.co[d.owner] === 'wall' ? pwOf(s, d.owner).wallDef : s.co[d.owner] === 'tide' ? pwOf(s, d.owner).tideDef : s.co[d.owner] === 'iron' && CLS.tank(d.type) ? pwOf(s, d.owner).ironDef : 0) : 0) +
      fxSum(fxD.def, d.type, Dd);
    return Math.min(def, 0.7); // 上限 70%：碉堡 + 石敢当 + 厚墙 + 老兵 + 强化叠到 90% 时一两辆车打不动（2026-11-14 下调）
  }
  // counter：这一下是不是反击（rules.atkInit 只管主动进攻）
  C.damage = function (s, a, d, luck, counter) {
    const base = D.DMG[a.type][d.type];
    if (base == null || !canHit(s, a, d)) return 0;
    const A = D.UNITS[a.type], rA = ruleOf(s, a.owner);
    // 地形防御：投弹手只算一半、喷火兵完全不算（兵种的 cover 字段，rules.coverOn 可以按兵种再压低）；fx.sure：无视目标地形
    let cover = fxHas(fxOf(s, a.owner).sure, a.type) ? 0 : A.cover == null ? 1 : A.cover;
    if (rA.coverOn && rA.coverOn[a.type] != null) cover = Math.min(cover, rA.coverOn[a.type]);
    const ahEff = rA.fullAtk ? 10 : C.dispHp(a); // rules.fullAtk：攻击力不随 HP 下降
    const pierce = rA.pierce && inCls(rA.pierce.on, a.type, A) ? rA.pierce.stars : 0; // 高爆弹：目标的地形防御少算几星
    // 运气是直接加在伤害上的。普通的 0–9 照加；超过 9 的部分（金不换的大运气）按伤害表折算：伤害表 50 只算一半，伤害表 2 几乎不算。
    // 不这样的话，本来打不动的组合（狙击手打重型坦克，伤害表 2）掷出 +40、+83 就能打掉大半条命
    const lk = luck > LUCK[1] ? LUCK[1] + (luck - LUCK[1]) * Math.min(100, base) / 100 : luck;
    const dmg = (base * atkMul(s, a, d.type, counter, d) + lk) * (ahEff / 10) * (1 - defFrac(s, d, cover, pierce, a.type));
    return Math.max(0, Math.min(d.hp, Math.floor(dmg)));
  };
  // 这个单位站在现在这一格、在现在这个回合的实际修正（指挥官常驻、阵营底色、技能、地形、军衔、雷达塔全算上）。界面的信息面板只用它
  C.unitMods = function (s, u) {
    const U = D.UNITS[u.type], r4 = v => Math.round(v * 10000) / 10000, m = modOf(s, u.owner, u.type), rl = ruleOf(s, u.owner);
    const rg = C.rangeOf(s, u), terr = s.map.t[u.y][u.x], stars = U.air ? 0 : D.TERRAIN[terr].def, sight = unitSight(s, u), mp = C.movePts(s, u);
    return {
      atk: U.range ? r4(atkMul(s, u, null, false) - 1) : 0, // 主动进攻时的攻击增减合计（0.3 = +30%）；不含只对某类目标生效的 vs和强化（强化只对强化价不高于自己的对手生效，见 C.oreEffects）
      counterAtk: U.range ? r4(atkMul(s, u, null, true) - 1) : 0, // 反击时的（和 atk 的差别只在 rules.atkInit）
      vs: m.vs, // { 目标类别: 攻击增减 } 或 null
      def: r4(defFrac(s, u, 1)), // 防御合计（0–0.7）：地形 + 军衔 + 指挥官 + 技能。投弹手、喷火兵打它时地形那部分要打折，见 C.damage
      terrain: r4(0.1 * stars * C.dispHp(u) / 10), // 其中地形防御那一部分
      move: mp, moveBonus: mp - U.move, // 现在的移动力 / 比兵种基础值多多少（打完再移动的单位是剩余移动力）
      range: rg, rangeBonus: rg ? rg[1] - U.range[1] : 0,
      vision: sight, visionBonus: sight - (U.vision || 1), // 迷雾下的视野半径
      capture: U.cap ? C.capPower(s, u) : 0, // 占领一次扣多少占领值
      carry: C.carryCap(s, u), cost: C.costOf(s, u.owner, u.type),
      luck: C.luckRange(s, u.owner, u.type), fullAtk: !!rl.fullAtk, // 运气区间；攻击力是否不随 HP 下降
    };
  };
  // 这个单位现在的视野半径（迷雾下）
  function unitSight(s, u) {
    let r = (D.UNITS[u.type].vision || 1) + modOf(s, u.owner, u.type).vision;
    if (s.map.t[u.y][u.x] === 'mountain' && C.isInfantry(u)) r += 3;
    for (let q = 1, n = nP(s); q <= n; q++) if (aliveP(s, q) && C.isEnemy(s, u.owner, q) && fxOf(s, q).blackout) return 1;
    return Math.max(1, r + chillOn(s, u.owner, 'vision'));
  }
  // 反击：只在贴身（距离 1）时发生，防守方得是最小射程为 1 的兵种（近战单位和投弹手）
  C.canCounter = function (s, d, a) {
    const U = D.UNITS[d.type];
    if (powerIs(s, a.owner, 'sky') && D.UNITS[a.type].air) return false; // 俯冲：飞机不挨反击
    if (fxHas(fxOf(s, a.owner).noCounter, a.type)) return false; // fx.noCounter：这些兵种本回合不挨反击
    const cc = ruleOf(s, d.owner).closeCounter; // 猎刀：这些兵种被贴身时也能反击
    return !!U.range && (U.range[0] === 1 || !!(cc && cc[d.type])) && canHit(s, d, a) &&
      Math.abs(a.x - d.x) + Math.abs(a.y - d.y) === 1;
  };
  // d 反击 a 的伤害；a 站在己方或中立碉堡上时减半
  C.counterDamage = function (s, d, a, luck) {
    let c = C.damage(s, d, a, luck, true);
    const k = fxOf(s, d.owner).counterMul; // fx.counterMul：反击伤害倍数
    if (k) c = Math.min(a.hp, Math.floor(c * k));
    if (s.tech) {
      const cc = ruleOf(s, d.owner).closeCounter, cut = modOf(s, a.owner, a.type).counterCut;
      if (cc && cc[d.type] && D.UNITS[d.type].range[0] > 1) c = Math.floor(c * cc[d.type]);
      if (cut) c = Math.floor(c * (1 - cut)); // 抢高度：进攻方挨的反击打折
    }
    return C.fortified(s, a) ? Math.floor(c / 2) : c;
  };
  // 运气：默认 0–9 的整数。rules.luck = [lo, hi] 改区间；fx.luckBest = n 掷 n 次取高；fx.sure 里的兵种必定取最高
  // type（可选）：兵种。rules.luckOn 按兵种类别给区间（方位角）；fx.luckMul 把区间放大（梭哈 · 极）
  C.luckRange = function (s, p, type) {
    const rl = ruleOf(s, p);
    let r = rl.luck || LUCK;
    if (type && rl.luckOn) for (const cls in rl.luckOn) if (inCls(cls, type, D.UNITS[type])) r = rl.luckOn[cls];
    const k = s.powerOn[p] ? fxOf(s, p).luckMul : 0;
    return k ? [Math.round(r[0] * k), Math.round(r[1] * k)] : r;
  };
  const LUCK = [0, 9];
  // best：至少掷几次取高（头彩）
  function rollLuck(s, u, best) {
    const [lo, hi] = C.luckRange(s, u.owner, u.type), fx = fxOf(s, u.owner);
    if (fxHas(fx.sure, u.type)) return hi;
    let v = lo + Math.floor(C.rand() * (hi - lo + 1));
    for (let i = 1, n = Math.max(fx.luckBest || 1, best || 1); i < n; i++) v = Math.max(v, lo + Math.floor(C.rand() * (hi - lo + 1)));
    return v;
  }
  // 头彩（rules.firstLuck）：这个回合还没主动进攻过时，第一次进攻掷几次
  const firstLuck = (s, u) => (s.tech && !(s.firstAtk && s.firstAtk[u.owner]) ? ruleOf(s, u.owner).firstLuck || 1 : 1);
  // 预估用的平均运气（掷 n 次取高的期望 ≈ lo + (hi−lo)·n/(n+1)）
  function meanLuck(s, u, atk) {
    const [lo, hi] = C.luckRange(s, u.owner, u.type), fx = fxOf(s, u.owner), n = Math.max(fx.luckBest || 1, atk ? firstLuck(s, u) : 1);
    if (fxHas(fx.sure, u.type)) return hi;
    return lo + (hi - lo) * n / (n + 1);
  }
  function luckSpan(s, u) { const [lo, hi] = C.luckRange(s, u.owner, u.type); return fxHas(fxOf(s, u.owner).sure, u.type) ? [hi, hi] : [lo, hi]; }
  // a 打 d 的伤害上下限（内部 HP，10 = 界面上的 1 点）。运气区间、必定最高运气、先手反击后剩下的 HP 都算进去了。界面的伤害预览只用它：
  //   { lo, hi, counterLo, counterHi, first }
  //   lo / hi：a 对 d 造成的伤害范围；counterLo / counterHi：d 反击 a 的伤害范围（不能反击就都是 0）；first：d 是不是先手反击
  // “掷多次取高”（fx.luckBest）不改上下限，只是更容易掷到高的
  C.damageRange = function (s, a, d) {
    const [al, ah] = luckSpan(s, a), [dl, dh] = luckSpan(s, d);
    const withHp = (u, hp, fn) => { const k = u.hp; u.hp = hp; try { return fn(); } finally { u.hp = k; } };
    if (C.countersFirst(s, d, a)) {
      const cLo = C.counterDamage(s, d, a, dl), cHi = C.counterDamage(s, d, a, dh);
      const after = (cnt, luck) => (cnt >= a.hp ? 0 : withHp(a, a.hp - cnt, () => C.damage(s, a, d, luck)));
      return { lo: after(cHi, al), hi: after(cLo, ah), counterLo: cLo, counterHi: cHi, first: true };
    }
    const lo = C.damage(s, a, d, al), hi = C.damage(s, a, d, ah);
    let cLo = 0, cHi = 0;
    if (C.canCounter(s, d, a)) {
      cHi = lo >= d.hp ? 0 : withHp(d, d.hp - lo, () => C.counterDamage(s, d, a, dh));
      cLo = hi >= d.hp ? 0 : withHp(d, d.hp - hi, () => C.counterDamage(s, d, a, dl));
    }
    return { lo, hi, counterLo: cLo, counterHi: cHi, first: false };
  };
  // d 是不是先手反击 a（rules.firstCounter：被贴身攻击时先打回去，对方再按剩下的 HP 进攻）
  C.countersFirst = function (s, d, a) { return !!ruleOf(s, d.owner).firstCounter && C.canCounter(s, d, a); };
  // 预估：{ dmg, counter, first? }。first 为 true 时是“先挨反击 counter，再按剩下的 HP 打出 dmg”；反击把进攻方打死则 dmg = 0
  C.forecast = function (s, a, d) {
    const la = meanLuck(s, a, true), ld = meanLuck(s, d);
    if (C.countersFirst(s, d, a)) {
      const counter = C.counterDamage(s, d, a, ld);
      let dmg = 0;
      if (counter < a.hp) { const keep = a.hp; a.hp -= counter; dmg = C.damage(s, a, d, la); a.hp = keep; }
      return { dmg, counter, first: true };
    }
    const dmg = C.damage(s, a, d, la);
    let counter = 0;
    if (dmg < d.hp && C.canCounter(s, d, a)) {
      const keep = d.hp; d.hp -= dmg; counter = C.counterDamage(s, d, a, ld); d.hp = keep;
    }
    return { dmg, counter };
  };

  // 技能槽涨得快慢：自己的无线电网（rules.meterGain）加，敌对阵营的密码破译（rules.meterFoe，负数）减，最少两成
  function meterMul(s, p) {
    if (!s.tech) return 1;
    let k = 1 + (ruleOf(s, p).meterGain || 0);
    for (let q = 1, n = nP(s); q <= n; q++) if (q !== p && aliveP(s, q) && C.isEnemy(s, p, q)) k += ruleOf(s, q).meterFoe || 0;
    return Math.max(0.2, k);
  }
  // 技能槽：挨打的一方按损失涨，打人的一方涨一半
  function addMeter(s, victim, dmg, by) {
    if (rulesOf(s).powers === false) return;
    const val = D.UNITS[victim.type].cost * dmg / 100;
    // 两队对局：挨打的涨全额、打人的涨一半。三支以上队伍的混战反过来（打人的全额、挨打的一半），免得缩着挨打的人技能反而放得最勤
    const multi = C.lootRate(s) > 0, kv = multi ? METER.multiVictim : 1, ka = multi ? METER.multiAttacker : 0.5;
    // 技能槽按损失的资金折算：每 10 资金涨 1 点（金额缩小到十分之一以后系数跟着 ×10，节奏不变）
    // 技能持续不止一个回合的（s.powerOn 是数字，灯火管制 · 极），开着的时候槽不涨
    if (typeof s.powerOn[victim.owner] !== 'number') s.meter[victim.owner] = Math.min(D.METER_MAX, s.meter[victim.owner] + val / 10 * kv * meterMul(s, victim.owner));
    if (by && by !== victim.owner && typeof s.powerOn[by] !== 'number') s.meter[by] = Math.min(D.METER_MAX, s.meter[by] + val / 10 * ka * meterMul(s, by));
  }
  C.removeUnit = function (s, u) {
    const i = s.units.indexOf(u);
    if (i >= 0) s.units.splice(i, 1);
    if (D.TERRAIN[s.map.t[u.y][u.x]].prop) s.map.cap[u.y][u.x] = 20;
  };
  // 多方混战的战利品：开局时有三支以上队伍的对局里，击毁敌对单位的一方拿到它造价的一部分（rules.loot 可关）
  const LOOT = { rate: 0.3 };
  const METER = { multiVictim: 0.5, multiAttacker: 1 }; // 多方混战里技能槽的涨法（跟着 rules.loot 一起开关）
  C.meterParams = METER;
  C.lootParams = LOOT;
  C.lootRate = function (s) {
    if (!s.rules || s.rules.loot !== true || !s.team) return 0;
    const seen = {}; let n = 0;
    for (let p = 1, N = nP(s); p <= N; p++) if (!seen[s.team[p]]) { seen[s.team[p]] = 1; n++; }
    return n >= 3 ? LOOT.rate : 0;
  };
  function onKill(s, dead, by, r) {
    if (C.onKill) C.onKill(s, dead, by); // 评分统计（rank.js）：谁的单位被谁击毁
    campOnKill(s, dead);
    C.removeUnit(s, dead);
    oreBounty(s, dead, by, r); // 击毁敌方的强化单位：拿到它强化价的一半
    if (!dead.revived) { // 每个阵营最近阵亡的单位（军医的技能要用）；被救回来过的不再记
      (s.lost || (s.lost = {}))[dead.owner] = { type: dead.type, day: s.day };
      if (s.tech) { const q = s.lostQ || (s.lostQ = {}); q[dead.owner] = [{ type: dead.type, day: s.day }].concat(q[dead.owner] || []).slice(0, 2); } // 最近两个（急救 · 极）
    }
    if (by && by.owner > 0 && C.isEnemy(s, dead.owner, by.owner)) {
      const kb = ruleOf(s, by.owner).killBonus; // 掌柜：击毁敌方单位拿它造价的几成
      if (kb) { const g = Math.round(D.UNITS[dead.type].cost * kb / 10) * 10; s.funds[by.owner] += g; r.bonus = (r.bonus || 0) + g; r.bonusTo = by.owner; }
      const rs = s.tech && techOn(s) ? researchOf(s, by.owner) : NOR; // 玄潮的研究方式“拆解”：击毁敌方单位攒研究点，下个回合开始时进池子
      if (rs.killPts) { const t = techMut(s, by.owner); t.kill = Math.min(rs.killMax, (t.kill || 0) + rs.killPts); }
    }
    const sc = s.tech && dead.owner > 0 ? ruleOf(s, dead.owner).scrap : 0; // 回炉：被敌方击毁，拿回原价的一部分
    if (sc && by && C.isEnemy(s, dead.owner, by.owner)) { const g = Math.round(D.UNITS[dead.type].cost * sc / 10) * 10; s.funds[dead.owner] += g; r.scrap = (r.scrap || 0) + g; r.scrapTo = dead.owner; }
    const rate = C.lootRate(s);
    if (rate && by.owner !== dead.owner) { const g = Math.round(D.UNITS[dead.type].cost * rate / 10) * 10; s.funds[by.owner] += g; r.loot = (r.loot || 0) + g; r.lootTo = by.owner; }
  }
  // 溅射：不会打死（至少留 10 HP）；每个单位每回合因溅射最多掉 SPLASH_CAP（记在 u.sp，每次回合结束清掉）
  const SPLASH_CAP = 50;
  function splashHit(s, a, o, amt, r) {
    const sp = Math.max(0, Math.min(amt, o.hp - 10, SPLASH_CAP - (o.sp || 0)));
    if (sp <= 0) return;
    o.hp -= sp; o.sp = (o.sp || 0) + sp; addMeter(s, o, sp, a.owner);
    (r.splash || (r.splash = [])).push({ unit: o, dmg: sp });
  }
  // 返回 { dmg, counter, killedDef, killedAtt, first?, again?, loot?, lootTo? }
  //   first：防守方先手反击（先结算 counter，再结算 dmg）
  //   again：进攻方打完还能再移动（u.moved 已是 false、u.fired 为 true；不能再打、不能占领）
  //   loot / lootTo：这次击毁给了 lootTo 多少战利品资金
  C.attack = function (s, a, d) {
    const r = { dmg: 0, counter: 0, killedDef: false, killedAtt: false };
    const first = firstLuck(s, a);
    const hit = () => {
      r.dmg = C.damage(s, a, d, rollLuck(s, a, first));
      if (r.dmg >= d.hp && s.tech) { // 咬牙：本该被击毁的单位留 1 点 HP（每个单位每局一次；每个敌方回合 perTurn 次，背水 · 极期间 fx.gritMax 次）
        const g = ruleOf(s, d.owner).grit;
        if (g && d.hp >= g.minHp && !d.gritUsed) {
          const used = (s.grit && s.grit[d.owner]) || 0;
          if (used < (fxOf(s, d.owner).gritMax || g.perTurn)) { r.dmg = d.hp - 10; d.gritUsed = true; (s.grit || (s.grit = {}))[d.owner] = used + 1; r.saved = true; }
        }
      }
      d.hp -= r.dmg; addMeter(s, d, r.dmg, a.owner);
      if (d.hp <= 0) { r.killedDef = true; onKill(s, d, a, r); a.stars = Math.min(3, a.stars + 1); }
      const fx = fxOf(s, a.owner), rlA = ruleOf(s, a.owner);
      if (fxHas(fx.burn, a.type) || fxHas(rlA.burn, a.type)) { // 燎原 / 点火：烧掉目标脚下的森林
        const m = s.map;
        if (m.t[d.y][d.x] === 'forest') { m.t[d.y][d.x] = 'waste'; r.burned = [d.x, d.y]; visCache.delete(s); seaCache.delete(m.t); }
      }
      if (fxHas(fx.burn, a.type) || fxHas(fx.splashBy, a.type)) { // 燎原：溅到目标周围的敌对单位（不会烧死）
        const R = fx.splashR || 1; // 溅射范围（曼哈顿距离），默认只到四邻
        for (const o of s.units.slice()) {
          const dd = Math.abs(o.x - d.x) + Math.abs(o.y - d.y);
          if (o === d || dd < 1 || dd > R || !C.isEnemy(s, a.owner, o.owner)) continue;
          splashHit(s, a, o, fx.splash || 0, r);
        }
      }
      if (rlA.splashBy && r.dmg > 0 && fxHas(rlA.splashBy, a.type) && !(a.mvd && moveShotOf(s, a))) { // 试射那一发不溅 // 弹幕：远程和抛射单位攻击后，目标四邻的敌方单位各受这一发伤害的几成
        const amt = Math.round(r.dmg * rlA.splashPct);
        for (const o of s.units.slice()) {
          if (o === d || Math.abs(o.x - d.x) + Math.abs(o.y - d.y) !== 1 || !C.isEnemy(s, a.owner, o.owner)) continue;
          splashHit(s, a, o, amt, r);
        }
      }
      if (r.killedDef && fx.killMeter && !(s.refund && s.refund[a.owner])) { // 梭哈：这次技能里第一次击毁，返还一部分技能槽
        (s.refund || (s.refund = {}))[a.owner] = 1;
        s.meter[a.owner] = Math.min(D.METER_MAX, s.meter[a.owner] + D.METER_MAX * fx.killMeter); r.refund = true;
      }
    };
    if (first > 1 || (s.tech && ruleOf(s, a.owner).firstLuck)) (s.firstAtk || (s.firstAtk = {}))[a.owner] = 1;
    const back = () => {
      r.counter = C.counterDamage(s, d, a, rollLuck(s, d));
      a.hp -= r.counter; addMeter(s, a, r.counter, d.owner);
      if (a.hp <= 0) { r.killedAtt = true; onKill(s, a, d, r); d.stars = Math.min(3, d.stars + 1); }
    };
    if (C.countersFirst(s, d, a)) { r.first = true; back(); if (!r.killedAtt) hit(); }
    else { hit(); if (!r.killedDef && C.canCounter(s, d, a)) back(); }
    a.moved = true;
    // 打完还能再移动（不能再打、不能占领）：履带洪流的坦克、fx.again 里的兵种走满移动力；rules.hitRun 里的兵种只走剩下的移动力
    if (!r.killedAtt && !a.fired) {
      const fx = fxOf(s, a.owner), rl = ruleOf(s, a.owner);
      let again = (powerIs(s, a.owner, 'iron') && CLS.tank(a.type)) || fxHas(fx.again, a.type), left = null;
      if (!again && D.UNITS[a.type].after) { left = D.UNITS[a.type].after; again = true; } // 兵种自带的“攻击后还能再走几格”（深渊战车）
      if (!again && fxHas(rl.hitRun, a.type)) { left = C.movePts(s, a) - (a.used || 0) + (rl.hitRunPlus || 0); again = left > 0; } // hitRunPlus：下坡路
      if (again) { a.fired = true; a.moved = false; if (left != null) a.left = left; r.again = true; }
      // rules.killAgain 里的兵种击毁目标后可以整个再行动一次（每回合一次，fx.killAgainMax 可以放宽；能再打，所以不置 u.fired）
      // fx.killAgain（闪击 · 极）：技能开着时这些兵种也行，每个单位一次，全军 fx.killAgainCap 次
      else if (r.killedDef) {
        const n = a.kills || 0, used = (s.kaUsed && s.kaUsed[a.owner]) || 0;
        if (fxHas(rl.killAgain, a.type) && n < ((fx.killAgainMax && fx.killAgainMax[a.type]) || 1)) { a.kills = n + 1; a.moved = false; r.again = true; r.full = true; }
        else if (!n && fxHas(fx.killAgain, a.type) && used < (fx.killAgainCap || 99)) { a.kills = 1; (s.kaUsed || (s.kaUsed = {}))[a.owner] = used + 1; a.moved = false; r.again = true; r.full = true; }
      }
    }
    if (a.still) delete a.still; // 坐底只加这回合的第一次攻击
    if (D.UNITS[a.type].cloak === 'idle' && s.units.includes(a)) { a.shot = true; visCache.delete(s); } // 潜渊舰开过火：到它下个回合开始前浮在水面上
    C.checkWin(s, r.killedAtt ? d.owner : a.owner);
    return r;
  };

  // path（可选）：实际走的路 [[x,y], …]（含起点和终点）。“穿插 · 极”要按它结算路上的敌人，界面和电脑都请传
  // 返回 null 或 { shots: [{ by, dmg }], killed, stopped?, trample?: [{ unit, dmg }] }
  // 移动前的记号：撤回时要恢复的东西，以及用来判断“这一步有没有副作用”的几样
  function moveMark(s, u) {
    const m = s.map, st = s.objectives && s.objectives.state;
    const mk = { kind: 'move', unit: u, from: [u.x, u.y], keep: {}, cap: D.TERRAIN[m.t[u.y][u.x]].prop ? m.cap[u.y][u.x] : null,
      ev: (s.events || []).length, talks: (s.talks || []).length, fired: s.camp ? Object.keys(s.camp.fired).length : 0, st: st ? JSON.stringify(st) : '', vis: null, seen: null };
    for (const k of ['moved', 'used', 'mvd', 'ran']) mk.keep[k] = u[k];
    if (veilOn(s)) { // 有东西看不见的对局：记下移动前看得见的格子和敌方单位
      const vs = visState(s), tm = teamOf(s, u.owner);
      mk.vis = fogOn(s) ? teamVision(s, vs, tm).slice() : null;
      mk.seen = {}; for (const e of s.units) if (C.isEnemy(s, u.owner, e.owner) && canSeeIn(s, vs, u.owner, e)) mk.seen[e.id] = 1;
    }
    return mk;
  }
  // 这一步是不是“纯移动”：没有自动射击、拾取、碾压，没有触发对话、增援、目标进度，没有被拦停；有东西看不见时还得没有新看见任何格子和敌方单位
  function movePure(s, u, mk, out) {
    if (out || s.winner || u.fired || TRAPPED.get(s) === u || !s.units.includes(u)) return false;
    const st = s.objectives && s.objectives.state;
    if ((s.events || []).length !== mk.ev || (s.talks || []).length !== mk.talks || (s.camp ? Object.keys(s.camp.fired).length : 0) !== mk.fired || (st ? JSON.stringify(st) : '') !== mk.st) return false;
    if (mk.seen) {
      const vs = visState(s), tm = teamOf(s, u.owner);
      if (mk.vis) { const v = teamVision(s, vs, tm); for (let i = 0; i < v.length; i++) if (v[i] && !mk.vis[i]) return false; }
      for (const e of s.units) if (C.isEnemy(s, u.owner, e.owner) && !mk.seen[e.id] && canSeeIn(s, vs, u.owner, e)) return false;
    }
    return true;
  }
  C.moveUnit = function (s, u, x, y, path) {
    if (x === u.x && y === u.y) return;
    const mk = NOUNDO || u.owner !== s.turn ? null : moveMark(s, u);
    if (D.TERRAIN[s.map.t[u.y][u.x]].prop) s.map.cap[u.y][u.x] = 20;
    const rl = ruleOf(s, u.owner);
    // 游击（rules.hitRun）：记下这一步花了多少移动力，打完以后只能用剩下的
    if (!u.fired && fxHas(rl.hitRun, u.type)) { const c = C.reach(s, u).dist[y * s.map.w + x]; u.used = (u.used || 0) + (c < INF ? c : C.movePts(s, u)); }
    let tr = null;
    if (D.UNITS[u.type].moveShot) u.mvd = true; // 装甲列车：走过以后只能打相邻的（不管开没开科技）
    if (s.tech && techOn(s)) {
      u.mvd = true; // 这回合走过（回合结束清）
      if (u.fired && rl.ranDef) u.ran = true; // 掉头：打完又走开
      const fx = fxOf(s, u.owner);
      if (path && fx.runOver && fxHas(fx.pass, u.type)) { // 穿插 · 极：路上穿过的敌方陆军各掉一点（不会死，每个单位每回合最多两次，不涨技能槽）
        const w = s.map.w, occ = occGrid(s);
        for (let k = 1; k < path.length - 1; k++) {
          const o = occ[path[k][1] * w + path[k][0]], O = o && D.UNITS[o.type];
          if (!o || !C.isEnemy(s, u.owner, o.owner) || O.air || O.ship || (o.ro || 0) >= 2) continue;
          const dmg = Math.min(fx.runOver, o.hp - 10);
          if (dmg <= 0) continue;
          o.hp -= dmg; o.ro = (o.ro || 0) + 1; (tr || (tr = [])).push({ unit: o, dmg });
        }
      }
    }
    u.x = x; u.y = y;
    let out = overwatch(s, u);
    if (!(out && out.killed)) { const got = orePickup(s, u); if (got) { out = out || { shots: [], killed: false }; out.pickup = got; } }
    if (s.camp) campCheck(s);
    if (tr) { out = out || { shots: [], killed: false }; out.trample = tr; }
    if (mk && movePure(s, u, mk, out)) { mk.to = [x, y]; UNDO.set(s, mk); }
    TRAPPED.delete(s);
    return out;
  };
  // 移动后的自动射击。返回 null 或 { shots: [{ by, dmg }], killed, stopped? }；killed 为真时这个单位已经被打掉（不在 s.units 里了）
  //   天网（fx.overwatch）：敌机落在己方防空单位的射程里，每个防空单位自动打它一次（每次技能每个单位只打一发，不挨反击）；fx.owStop：挨了就停，这次行动结束
  //   打招呼（rules.overwatch = { by, perTurn }）：常驻版，每个敌方回合只打 perTurn 发；天网开着时按天网算
  //   架盾 · 极（fx.parry = { mul, max }）：敌方陆军、船停在己方直射单位旁边先挨一记（伤害打折、不会打死，每个己方单位一次，一次移动最多 max 记）
  function overwatch(s, u) {
    const air = !!D.UNITS[u.type].air;
    let out = null, stop = false;
    for (let q = 1, n = nP(s); q <= n && !(out && out.killed); q++) {
      if (!aliveP(s, q) || !C.isEnemy(s, u.owner, q)) continue;
      const fx = fxOf(s, q);
      if (air) {
        const rw = s.tech && !fx.overwatch ? ruleOf(s, q).overwatch : null, by = fx.overwatch || (rw && rw.by);
        if (!by) continue;
        for (const o of s.units.slice()) {
          if (rw && ((s.owUsed && s.owUsed[q]) || 0) >= rw.perTurn) break;
          if (o.owner !== q || (!rw && o.ow) || !fxHas(by, o.type) || !canHit(s, o, u)) continue;
          const rg = C.rangeOf(s, o), d = Math.abs(o.x - u.x) + Math.abs(o.y - u.y);
          if (d < rg[0] || d > rg[1] || !C.canSee(s, q, u)) continue;
          const dmg = C.damage(s, o, u, rollLuck(s, o));
          if (dmg <= 0) continue;
          if (rw) (s.owUsed || (s.owUsed = {}))[q] = ((s.owUsed && s.owUsed[q]) || 0) + 1; else { o.ow = true; if (fx.owStop) stop = true; }
          u.hp -= dmg; addMeter(s, u, dmg, q);
          out = out || { shots: [], killed: false };
          out.shots.push({ by: o, dmg });
          if (u.hp <= 0) { const r = {}; onKill(s, u, o, r); o.stars = Math.min(3, o.stars + 1); out.killed = true; if (r.loot) { out.loot = r.loot; out.lootTo = r.lootTo; } C.checkWin(s, q); break; }
        }
      } else if (fx.parry) {
        let cnt = 0;
        for (const o of s.units.slice()) {
          if (cnt >= fx.parry.max) break;
          const O = D.UNITS[o.type];
          if (o.owner !== q || o.pr || !O.range || O.range[1] !== 1 || Math.abs(o.x - u.x) + Math.abs(o.y - u.y) !== 1 || !canHit(s, o, u) || !C.canSee(s, q, u)) continue;
          const dmg = Math.min(Math.floor(C.damage(s, o, u, rollLuck(s, o)) * fx.parry.mul), u.hp - 10);
          if (dmg <= 0) continue;
          o.pr = true; cnt++; u.hp -= dmg; addMeter(s, u, dmg, q);
          out = out || { shots: [], killed: false };
          out.shots.push({ by: o, dmg });
        }
      }
    }
    if (stop && out && !out.killed) { u.moved = true; out.stopped = true; }
    return out;
  }
  // 看错了（rules.ambushShot）：u 遇伏停下以后，拦住它的那个隐蔽单位 by（C.resolveMove 返回值里的 by）先打它一次，不挨反击，可以打死。
  // 每个单位每个敌方回合一次；得挨着、得是能打贴身目标的兵种。界面在遇伏的移动播完后调；返回 null 或 { shots: [{ by, dmg }], killed }
  C.ambushShot = function (s, u, by) {
    if (!s.tech || !by || !u || !s.units.includes(u) || !s.units.includes(by) || by.amb || !C.isEnemy(s, u.owner, by.owner) || !ruleOf(s, by.owner).ambushShot) return null;
    const B = D.UNITS[by.type];
    if (!B.range || B.range[0] !== 1 || Math.abs(by.x - u.x) + Math.abs(by.y - u.y) !== 1 || !canHit(s, by, u)) return null;
    const dmg = C.damage(s, by, u, rollLuck(s, by));
    if (dmg <= 0) return null;
    by.amb = true; u.hp -= dmg; addMeter(s, u, dmg, by.owner);
    const out = { shots: [{ by, dmg }], killed: false };
    if (u.hp <= 0) { const r = {}; onKill(s, u, by, r); by.stars = Math.min(3, by.stars + 1); out.killed = true; if (r.loot) { out.loot = r.loot; out.lootTo = r.lootTo; } C.checkWin(s, by.owner); }
    return out;
  };
  // 能占领：中立建筑，或敌对阵营的建筑（队友的不行）
  C.canCapture = function (s, u) {
    if (u.fired || !D.TERRAIN[s.map.t[u.y][u.x]].prop) return false; // 打完再移动的单位不能占领
    if (!D.UNITS[u.type].cap && !(u.owner > 0 && fxHas(ruleOf(s, u.owner).capBy, u.type))) return false; // rules.capBy：加急件，这些兵种也能占
    // 战役里的固定兵力关（rules.noBuild）：胜利条件没写“占司令部”时，玩家一方占不了敌方司令部，只能照目标打
    if (s.camp && s.rules.noBuild && s.map.t[u.y][u.x] === 'hq' && s.team[u.owner] === s.team[s.camp.seat] && !s.objectives.win.some(w => w.type === 'hq')) return false;
    const o = s.map.owner[u.y][u.x];
    return o === 0 || C.isEnemy(s, u.owner, o);
  };
  // 占领一次扣多少占领值：显示 HP × 指挥官的占领倍数（四舍五入，最少 1）
  C.capPower = function (s, u) {
    const k = ruleOf(s, u.owner).capNoFog; // 侦察条例：没开迷雾的对局里占领值多一成
    const m = s.map, o = m.owner[u.y][u.x];
    let mul = 1;
    if (s.tech) {
      if (o > 0 && C.isEnemy(s, u.owner, o) && fxOf(s, o).noCapture) return 0; // 铁壁 · 极：这座建筑现在占不动
      const cm = fxOf(s, u.owner).capMul; // 加征 · 极：只对中立建筑，司令部不算
      if (cm && o === 0 && m.t[u.y][u.x] !== 'hq' && D.TERRAIN[m.t[u.y][u.x]].prop) mul = cm;
    }
    return Math.max(1, Math.round(C.dispHp(u) * modOf(s, u.owner, u.type).capture * (k && !fogOn(s) ? k : 1) * mul));
  };
  // u 在脚下这座建筑上占领成功时会拿到多少资金（征收的指挥官才有，其余是 0）。占领前调，用来飘字
  C.captureGain = function (s, u) {
    if (!C.canCapture(s, u)) return 0;
    const rl = ruleOf(s, u.owner), o = s.map.owner[u.y][u.x];
    return rl.capBonus ? rl.capBonus + (o && C.isEnemy(s, u.owner, o) ? rl.capBonusFoe || 0 : 0) : 0;
  };
  C.capture = function (s, u) {
    const m = s.map;
    m.cap[u.y][u.x] -= C.capPower(s, u);
    u.moved = true;
    if (m.cap[u.y][u.x] <= 0) {
      const wasHq = m.t[u.y][u.x] === 'hq', prevOwner = m.owner[u.y][u.x];
      m.cap[u.y][u.x] = 20; m.owner[u.y][u.x] = u.owner;
      techOnCapture(s, u.owner, u.y * m.w + u.x);
      capMeter(s, u.owner, u.y * m.w + u.x);
      const campXY = [u.x, u.y];
      const rl = ruleOf(s, u.owner); // 征收：占下建筑立刻拿钱，占的是敌方建筑再多拿一份
      if (rl.capBonus) s.funds[u.owner] += rl.capBonus + (prevOwner && C.isEnemy(s, u.owner, prevOwner) ? rl.capBonusFoe || 0 : 0);
      if (wasHq) { // 司令部被占：变成占领者的一座普通城市，原主出局
        m.t[u.y][u.x] = 'city';
        ensure(s);
        if (prevOwner && s.alive[prevOwner]) eliminate(s, prevOwner, u.owner, 'hq');
        else settle(s, 'hq');
      }
      campOnCapture(s, u.owner, campXY[0], campXY[1]);
      return true;
    }
    return false;
  };

  // ── 淘汰与胜负 ──
  // reason 'hq'：司令部被 by 占领 → 单位全部消失，建筑全归 by；
  // reason 'rout'：被打光 → 建筑全部变中立（司令部一并变成中立城市，免得留下一座没人的司令部）
  function eliminate(s, q, by, reason) {
    ensure(s);
    if (!s.alive[q]) return;
    const m = s.map;
    s.alive[q] = false; s.meter[q] = 0; s.powerOn[q] = false;
    if (s.tech && s.tech[q]) { s.tech[q] = newTech(); if (s.rp) s.rp[q] = 0; } // 被淘汰：科技和研究点全部作废
    if (reason === 'hq') {
      for (let i = s.units.length - 1; i >= 0; i--) {
        const u = s.units[i];
        if (u.owner !== q) continue;
        s.units.splice(i, 1);
        if (D.TERRAIN[m.t[u.y][u.x]].prop) m.cap[u.y][u.x] = 20;
      }
    }
    const occ = occGrid(s);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.owner[y][x] !== q) continue;
      if (m.t[y][x] === 'hq') m.t[y][x] = 'city';
      m.owner[y][x] = reason === 'hq' ? by : 0;
      // 正在占这座建筑的单位：新主人是自己或队友就作废，仍是敌对或中立就接着占
      const o = occ[y * m.w + x];
      if (o && m.cap[y][x] < 20 && reason === 'hq' && !C.isEnemy(s, o.owner, by)) m.cap[y][x] = 20;
    }
    s.log.push({ type: 'defeat', player: q, by: by || 0, day: s.day, reason });
    settle(s, reason);
  }
  // 只剩一支队伍还有存活阵营：该队获胜
  function settle(s, reason) {
    ensure(s);
    if (s.winner) return;
    const live = C.alivePlayers(s);
    if (!live.length) return;
    const tm = s.team[live[0]];
    if (live.some(p => s.team[p] !== tm)) return;
    s.winner = tm; s.reason = reason; s.winners = [];
    for (let p = 1; p <= s.players; p++) if (s.team[p] === tm) s.winners.push(p);
  }
  // 检查有没有阵营被打光。by：造成这次淘汰的阵营（C.attack 内部传入）
  C.checkWin = function (s, by) {
    if (s.winner) return s.winner;
    ensure(s);
    const has = new Array(s.players + 1).fill(false);
    for (const u of s.units) has[u.owner] = true;
    for (let p = 1; p <= s.players && !s.winner; p++) if (s.alive[p] && !has[p] && !(s.camp && s.camp.waiting && s.camp.waiting[p])) eliminate(s, p, by && by !== p ? by : 0, 'rout'); // 增援还没到的席位不算被打光
    campCheck(s);
    return s.winner;
  };

  // ── 导弹井 ──
  // u 站在当前 x,y 时能否发射：能占领的步兵类单位 + 脚下是未发射的导弹井
  C.canLaunch = function (s, u) {
    return !!D.UNITS[u.type].cap && s.map.t[u.y][u.x] === 'silo';
  };
  // 以 (cx,cy) 为中心会波及的格子（曼哈顿距离 ≤ 2，出界的不算）
  C.siloArea = function (s, cx, cy) {
    const out = [], m = s.map;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 2) continue;
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < m.w && y < m.h) out.push([x, y]);
    }
    return out;
  };
  const SILO_DMG = 30, SILO_FLOOR = 10;
  const siloHit = u => Math.max(0, Math.min(SILO_DMG, u.hp - SILO_FLOOR));
  // 发射：范围内所有单位（不分敌我，运输单位里的乘客不受影响）各掉 30 HP，最少剩 10；导弹井变成已发射
  C.launchSilo = function (s, u, cx, cy) {
    if (!C.canLaunch(s, u)) return null;
    const hits = [];
    for (const o of s.units) {
      if (Math.abs(o.x - cx) + Math.abs(o.y - cy) > 2) continue;
      const dmg = siloHit(o);
      if (dmg <= 0) continue;
      o.hp -= dmg; hits.push({ unit: o, dmg });
    }
    s.map.t[u.y][u.x] = 'silo_used';
    u.moved = true;
    return { hits };
  };
  // 对 owner 最有利的中心点：敌对阵营损失的资金 − 自己损失的资金 − 队友损失的资金（三种各有权重）
  const SILO_W = { enemy: 1, own: -1, ally: -1 };
  C.bestSiloTarget = function (s, owner) {
    const m = s.map, w = m.w, h = m.h, sc = new Array(w * h).fill(0);
    const st = veilOn(s) ? visState(s) : null;
    for (const o of s.units) {
      if (st && !canSeeIn(s, st, owner, o)) continue; // 迷雾：只按看得见的单位算
      const v = D.UNITS[o.type].cost * siloHit(o) / 100 * (o.owner === owner ? SILO_W.own : C.isEnemy(s, owner, o.owner) ? SILO_W.enemy : SILO_W.ally);
      if (!v) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 2) continue;
        const x = o.x + dx, y = o.y + dy;
        if (x >= 0 && y >= 0 && x < w && y < h) sc[y * w + x] += v;
      }
    }
    let bi = 0;
    for (let i = 1; i < sc.length; i++) if (sc[i] > sc[bi]) bi = i;
    return { x: bi % w, y: (bi - bi % w) / w, score: sc[bi] };
  };

  // ── 运输 ──
  // 运输单位能装几个（指挥官可能加座位）
  C.carryCap = function (s, tr) {
    const T = D.UNITS[tr.type];
    return T.carry ? T.carry.n + modOf(s, tr.owner, tr.type).carry : 0;
  };
  // 只能上自己阵营的运输单位（队友的不行）
  C.canLoad = function (s, u, tr) {
    const T = D.UNITS[tr.type], U = D.UNITS[u.type];
    if (!T.carry || tr === u || tr.owner !== u.owner || tr.cargo.length >= C.carryCap(s, tr)) return false;
    if (U.air || U.ship) return false;
    return T.carry.kind === 'ground' || U.mt === 'foot' || U.mt === 'mech'; // 只装“陆上单位”的登陆艇什么都装；其余运输单位只装徒步的步兵类，摩托兵（步兵类，但骑着车）上不去
  };
  // 移动范围内，这个格子上有没有能上的运输单位
  C.loadTarget = function (s, u, r, x, y) {
    if (r.dist[y * s.map.w + x] === INF) return null;
    const o = C.unitAt(s, x, y);
    return o && o !== u && C.canLoad(s, u, o) ? o : null;
  };
  // ── 合并：同一阵营、同一兵种，走到受伤的那个身上并成一个。HP 相加（按显示的 1–10 算），超过 10 的部分按造价折成资金退回 ──
  C.canJoin = function (s, u, o) {
    if (!o || o === u || o.owner !== u.owner || o.type !== u.type) return false;
    if (u.tag || o.tag) return false; // 战役里带标记的单位不合并
    if (o.hp >= 100) return false; // 对方满血就没什么可并的
    if ((u.cargo && u.cargo.length) || (o.cargo && o.cargo.length)) return false; // 载着人的运输单位不并
    return true;
  };
  // 移动范围内，这个格子上有没有能并进去的友军
  C.joinTarget = function (s, u, r, x, y) {
    if (r.dist[y * s.map.w + x] === INF) return null;
    const o = C.unitAt(s, x, y);
    return C.canJoin(s, u, o) ? o : null;
  };
  // 合并后多出来的 HP 能退多少钱
  C.joinGain = function (s, u, o) {
    const over = Math.max(0, C.dispHp(u) + C.dispHp(o) - 10);
    return Math.round(over * C.costOf(s, u.owner, u.type) / 10 / 10) * 10;
  };
  // 合并时退回多少碎片：两个都是强化单位时，退回一个单位的强化价
  C.joinOreBack = function (s, u, o) { return u.ore && o.ore ? (D.UNITS[o.type].ore || 0) : 0; };
  // u 并进 o：u 消失，o 本回合行动结束。返回 { gain, oreBack }
  C.join = function (s, u, o) {
    if (!C.canJoin(s, u, o)) return null;
    const gain = C.joinGain(s, u, o);
    if (D.TERRAIN[s.map.t[u.y][u.x]].prop) s.map.cap[u.y][u.x] = 20;
    s.units.splice(s.units.indexOf(u), 1);
    o.hp = Math.min(100, (C.dispHp(o) + C.dispHp(u)) * 10);
    o.stars = Math.max(o.stars || 0, u.stars || 0);
    const oreBack = C.joinOreBack(s, u, o); // 强化：任一方是强化单位，合并后就是强化单位；两个都是强化单位时退回一个单位的强化价
    if (u.ore && !o.ore) o.ore = u.ore;
    if (oreBack) oreAdd(s, o.owner, oreBack);
    o.moved = true;
    s.funds[u.owner] += gain;
    return { gain, oreBack };
  };
  C.load = function (s, u, tr) {
    if (D.TERRAIN[s.map.t[u.y][u.x]].prop) s.map.cap[u.y][u.x] = 20;
    s.units.splice(s.units.indexOf(u), 1);
    u.moved = true; tr.cargo.push(u);
    if (s.tech) u.late = true; // 这回合才上的车（回合结束清）：索降不算
  };
  // from（可选）：[x, y]，运输单位这次行动的出发格。界面预演“走到这儿再卸”时 tr.x / tr.y 已经是终点，
  // 传了 from 就按出发时的视野判断看不看得见（不然一贴上去就看见了，等于提前泄露）
  C.unloadSpots = function (s, tr, i, from) {
    const c = tr.cargo[i], out = [], m = s.map, fog = veilOn(s);
    const cells = [];
    for (const [dx, dy] of DIRS) {
      const x = tr.x + dx, y = tr.y + dy;
      if (x < 0 || y < 0 || x >= m.w || y >= m.h || !C.moveCost(c, m.t[y][x])) continue;
      cells.push([x, y, C.unitAt(s, x, y)]);
    }
    const tx = tr.x, ty = tr.y;
    if (fog && from) { tr.x = from[0]; tr.y = from[1]; }
    try {
      for (const [x, y, o] of cells) {
        // 迷雾：格子上只有看不见的敌对单位时照常列出（否则等于泄露位置），真卸的时候再判定遇伏
        if (!o || o === tr || (fog && !(from ? canSeeIn(s, visState(s), tr.owner, o) || !C.isEnemy(s, tr.owner, o.owner) : C.canSee(s, tr.owner, o)))) out.push([x, y]);
      }
    } finally { tr.x = tx; tr.y = ty; }
    return out;
  };
  // 卸到 (x,y)。那一格被（看不见的）单位占着：卸载失败，返回 null，运输单位这回合行动结束（遇伏），乘客留在车上
  C.unload = function (s, tr, i, x, y) {
    if (C.unitAt(s, x, y)) { tr.moved = true; return null; }
    const c = tr.cargo.splice(i, 1)[0];
    c.x = x; c.y = y; c.moved = true; s.units.push(c); tr.moved = true;
    // 索降（rules.dropAct）：从这些运输单位上卸下的步兵类，回合开始时就在车上的，当回合还能打、能占，不能再走
    if (s.tech && !c.late && C.isInfantry(c) && fxHas(ruleOf(s, tr.owner).dropAct, tr.type)) { c.moved = false; c.dropped = true; }
    orePickup(s, c);
    if (s.camp) campCheck(s);
    return c;
  };

  C.buildList = function (s, x, y) {
    if (s.rules && s.rules.noBuild) return [];
    const t = s.map.t[y][x], o = s.map.owner[y][x];
    const extra = t === 'city' && o > 0 ? ruleOf(s, o).cityBuild : null; // 集市：己方城市里能造这些兵种
    const fo = o > 0 ? facOf(s, o) : 0, ok = k => { const need = D.UNITS[k].only || D.UNITS[k].faction; return !need || need === fo; }; // only / faction：只有这个阵营能造（装甲列车、黑潮的精锐兵种）
    if (extra) return D.ORDER.filter(k => extra.includes(k) && ok(k));
    return D.ORDER.filter(k => D.UNITS[k].from === t && ok(k));
  };
  // 黑市（fx.sell）：把己方单位原地卖掉，拿回造价的几成。能不能卖 / 卖多少钱 / 卖
  C.sellValue = function (s, u) {
    let rate = fxOf(s, u.owner).sell;
    if (!rate && s.tech) { // 还价（rules.sell）：平时每回合卖 perTurn 个，得站在己方建筑上
      const r = ruleOf(s, u.owner).sell;
      if (r && ((s.sold && s.sold[u.owner]) || 0) < r.perTurn && s.map.owner[u.y][u.x] === u.owner && D.TERRAIN[s.map.t[u.y][u.x]].prop) rate = r.rate;
    }
    if (!rate || u.owner !== s.turn || !s.units.includes(u) || u.cargo.length || u.tag) return 0; // 带标记的单位不能卖
    return Math.round(C.costOf(s, u.owner, u.type) * rate / 10) * 10;
  };
  C.sell = function (s, u) {
    const v = C.sellValue(s, u);
    if (!v) return 0;
    if (!fxOf(s, u.owner).sell) (s.sold || (s.sold = {}))[u.owner] = ((s.sold && s.sold[u.owner]) || 0) + 1;
    C.removeUnit(s, u); s.funds[u.owner] += v;
    C.checkWin(s, 0);
    return v;
  };
  // opts.ore：强化建造，多花 C.oreOf 份第二种资源，造出来的单位带 u.ore = true（攻击、防御各 +D.RES.atk / def，永久）
  C.build = function (s, x, y, type, opts) {
    const p = s.turn, U = D.UNITS[type];
    const cost = C.costOf(s, p, type);
    const strong = !!(opts && opts.ore), oc = strong ? C.oreOf(s, p, type) : 0;
    if (strong && !oreOn(s)) return null;
    if (s.map.owner[y][x] !== p || !C.buildList(s, x, y).includes(type) || C.unitAt(s, x, y) || s.funds[p] < cost || oreHave(s, p) < oc || C.buildLeft(s, x, y) <= 0) return null;
    const undo = NOUNDO ? null : { kind: 'build', x, y, funds: s.funds[p], ore: oreHave(s, p), nextId: s.nextId, built: (s.built && s.built[y * s.map.w + x]) || 0 };
    s.funds[p] -= cost; if (oc) s.ore[p] -= oc; // 卖掉、合并都不退这一项
    const k = y * s.map.w + x;
    (s.built || (s.built = {}))[k] = (s.built[k] || 0) + 1;
    const u = C.spawn(s, type, p, x, y);
    const rl = ruleOf(s, p);
    if (rl.freshBuild || (s.tech && fxOf(s, p).freshBuild === s.map.t[y][x])) u.moved = false; // 速建：造出来当回合就能动（黑市 · 极：只限城市里造的）
    if (s.tech && techOn(s)) u.fresh = true; // 这回合刚造的（回合结束清）
    if (rl.bornStars) u.stars = Math.min(3, rl.bornStars); // 雇佣合同：花钱造的单位自带星
    if (strong) u.ore = true;
    if (undo) { undo.unit = u; UNDO.set(s, undo); }
    return u;
  };
  // 这座生产建筑本回合还能造几次：平时 1 次，技能 fx.buildCap 可以加（造出来的单位要先移开才能造下一个）
  C.buildLeft = function (s, x, y) {
    if (s.rules && s.rules.noBuild) return 0; // 这一局谁都不能生产
    const on = ruleOf(s, s.turn).buildCapOn; // 巨炉：{ 建筑: 次数 }。各来源取最大值，不相加
    const cap = Math.max(fxOf(s, s.turn).buildCap || 1, (on && on[s.map.t[y][x]]) || 1), n = (s.built && s.built[y * s.map.w + x]) || 0;
    return Math.max(0, cap - n);
  };

  // 收购能买谁：挨着 p 的单位的敌方车辆（不含带标记的、载着人的、站在司令部上的），按价钱从高到低。[{ unit, price }]
  // price = 造价 × 剩余 HP 比例 × 一半（取整到 10）。发动时从头往下买，买得起的最多买数据里写的那么多个
  C.buyoutTargets = function (s, p) {
    const c = COBY[s.co[p]], bo = c && c.fx && c.fx.buyout, out = [];
    if (!bo) return out;
    for (const u of s.units) {
      if (!C.isEnemy(s, p, u.owner) || u.tag || u.cargo.length || !CLS.vehicle(u.type, D.UNITS[u.type]) || s.map.t[u.y][u.x] === 'hq') continue;
      if (!s.units.some(o => o.owner === p && Math.abs(o.x - u.x) + Math.abs(o.y - u.y) === 1)) continue;
      if (veilOn(s) && !C.canSee(s, p, u)) continue;
      out.push({ unit: u, price: Math.max(10, Math.round(D.UNITS[u.type].cost * u.hp / 100 * bo.price / 10) * 10) });
    }
    return out.sort((a, b) => b.price - a.price || a.unit.id - b.unit.id);
  };
  // 技能只作用于自己这一个阵营；炮火覆盖打所有敌对阵营的单位
  C.usePower = function (s, p) {
    if (rulesOf(s).powers === false || s.meter[p] < D.METER_MAX) return false;
    s.meter[p] = 0; s.powerOn[p] = true;
    const co = s.co[p], P = pwOf(s, p);
    campTrig(s, 'power', w => w.co === co);
    if (fxOf(s, p).turns > 1) s.powerOn[p] = fxOf(s, p).turns; // 持续不止一个回合的技能：存剩下几个己方回合开始（C.startTurn 里减）
    if (co === 'wall') s.units.forEach(u => { if (u.owner === p) u.hp = Math.min(100, u.hp + P.wallHeal); });
    if (co === 'gold') s.funds[p] += P.goldPer * C.props(s, p, true) + Math.round(C.income(s, p) * P.goldIncome / 10) * 10; // 外加两成回合收入：建筑多、对局长的时候也跟得上
    if (co === 'storm') { // 敌对阵营越多，每家掉得越少
      const dmg = C.stormDamage(s, p);
      s.units.forEach(u => { if (C.isEnemy(s, p, u.owner)) u.hp = Math.max(Math.min(u.hp, 10), u.hp - dmg); });
    }
    if (co === 'tide') s.units.forEach(u => { if (u.owner === p) u.hp = Math.min(100, u.hp + (D.UNITS[u.type].ship ? P.tideHeal : P.tideAll)); });
    const fx = fxOf(s, p);
    if (fx.incomeNow) s.funds[p] += Math.round(C.income(s, p) * fx.incomeNow / 10) * 10; // 加征：立刻多拿一部分收入
    if (s.refund) delete s.refund[p];
    if (fx.heal) s.units.forEach(u => { if (u.owner === p) u.hp = Math.min(100, u.hp + fx.heal); });
    if (typeof fx.revive === 'object') { // 急救 · 极：救回最近阵亡的 n 个，同一个单位每局只救一次
      const q = (s.lostQ && s.lostQ[p]) || [];
      for (let i = 0; i < fx.revive.n && q.length; i++) {
        const spot = C.reviveSpot(s, p, q[0].type);
        if (!spot) break;
        const u = C.spawn(s, q.shift().type, p, spot[0], spot[1]); u.hp = fx.revive.hp; u.revived = true;
      }
      if (s.lost) delete s.lost[p];
    } else if (fx.revive && s.lost && s.lost[p]) { // 把最近阵亡的那个单位救回来，放在司令部旁边（没空位就不救）
      const spot = C.reviveSpot(s, p, s.lost[p].type);
      if (spot) { const u = C.spawn(s, s.lost[p].type, p, spot[0], spot[1]); u.hp = fx.revive; delete s.lost[p]; if (s.lostQ && s.lostQ[p]) s.lostQ[p].shift(); }
    }
    if (co === 'militia') C.militiaSpots(s, p, P.militiaMax).forEach(([x, y]) => { const u = C.spawn(s, 'inf', p, x, y); u.hp = P.militiaHp; u.moved = false; if (fx.spawnStars) u.stars = fx.spawnStars; });
    if (fx.surge) { // 开闸：涨水一级（每局有次数上限），只伤敌方、不会击毁；涨不了就全体敌方掉一点
      const used = (s.surges && s.surges[p]) || 0;
      const ev = used < fx.surge.max ? floodRise(s, p, fx.surge.dmg) : null;
      if (ev) { (s.surges || (s.surges = {}))[p] = used + 1; s.events.push(ev); }
      else s.units.forEach(u => { if (C.isEnemy(s, p, u.owner)) u.hp = Math.max(Math.min(u.hp, 10), u.hp - fx.surge.fallback); });
    }
    if (fx.buyout) { // 收购：买下最多几个挨着己方单位的敌方车辆（先买贵的），各付造价（按剩余 HP 折算）的一部分；一个都买不了就拿一部分回合收入
      let n = 0;
      for (const t of C.buyoutTargets(s, p)) {
        if (n >= fx.buyout.max) break;
        if (t.price > s.funds[p] || !s.units.includes(t.unit)) continue;
        const u = t.unit, from = u.owner;
        if (!s.units.some(o => o !== u && o.owner === from)) continue; // 不买对方最后一个单位
        s.funds[p] -= t.price; n++;
        u.owner = p; u.moved = true; if (u.home) delete u.home; if (u.fired) delete u.fired;
        if (D.TERRAIN[s.map.t[u.y][u.x]].prop) s.map.cap[u.y][u.x] = 20;
        s.events.push({ type: 'buyout', player: p, from, id: u.id, x: u.x, y: u.y, price: t.price });
      }
      if (n) { visCache.delete(s); C.checkWin(s, p); }
      else s.funds[p] += Math.round(C.income(s, p) * fx.buyout.fallback / 10) * 10;
    }
    if (fx.frame) { // 点灯：最多几对相邻的、分属不同敌方阵营的单位互相打一次（不会击毁、不涨技能槽、每个单位只进一对）；找不到就换成 fxAlt
      const used = {}, pairs = [];
      for (const a of s.units) {
        if (pairs.length >= fx.frame.pairs) break;
        if (used[a.id] || !C.isEnemy(s, p, a.owner)) continue;
        for (const b of s.units) {
          if (used[b.id] || b === a || b.owner === a.owner || !C.isEnemy(s, p, b.owner) || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) continue;
          if (!canHit(s, a, b) && !canHit(s, b, a)) continue;
          const ok = u => { const U = D.UNITS[u.type]; return !!U.range && U.range[0] === 1; };
          const da = ok(a) ? Math.min(C.damage(s, a, b, 0), b.hp - 10) : 0, db = ok(b) ? Math.min(C.damage(s, b, a, 0), a.hp - 10) : 0;
          if (da <= 0 && db <= 0) continue;
          used[a.id] = used[b.id] = 1;
          b.hp -= Math.max(0, da); a.hp -= Math.max(0, db);
          pairs.push({ a: a.id, b: b.id, dmgA: Math.max(0, db), dmgB: Math.max(0, da) });
          break;
        }
      }
      if (pairs.length) s.events.push({ type: 'frame', player: p, pairs });
      else if (COBY[co] && COBY[co].fxAlt) s.powerOn[p] = 'alt';
    }
    if (fx.spawn) C.militiaSpots(s, p, fx.spawn.max, fx.spawn.at).forEach(([x, y]) => { const u = C.spawn(s, fx.spawn.unit, p, x, y); u.hp = fx.spawn.hp; u.moved = false; }); // 履带洪流 · 极：空着的兵工厂开出坦克
    return true;
  };
  // 急救会把人救到哪一格：离司令部最近的、这个兵种能站的空格（4 格以内），没有就返回 null
  C.reviveSpot = function (s, p, type) {
    const m = s.map; let hq = null;
    for (let y = 0; y < m.h && !hq; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'hq' && m.owner[y][x] === p) { hq = [x, y]; break; }
    if (!hq) return null;
    let best = null, bd = 5;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const d = Math.abs(x - hq[0]) + Math.abs(y - hq[1]);
      if (d < 1 || d >= bd || !C.moveCost({ type }, m.t[y][x]) || C.unitAt(s, x, y)) continue;
      bd = d; best = [x, y];
    }
    return best;
  };
  // 炮火覆盖现在每个敌对单位掉多少 HP（内部 HP，10 = 界面上的 1 点）
  C.stormDamage = function (s, p) {
    const n = C.enemiesOf(s, p).length;
    const P = pwOf(s, p);
    return P.stormFold[Math.min(n, P.stormFold.length - 1)] || P.stormDmg;
  };
  // 全民皆兵会在哪些城市出兵：己方的、空着的城市，离敌对司令部近的优先，最多 PW.militiaMax 座
  // max：最多几座（不传按 C.powerParams.militiaMax）；terr：哪种建筑（不传是城市）
  C.militiaSpots = function (s, p, max, terr) {
    const m = s.map, out = [], hqs = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'hq' && C.isEnemy(s, p, m.owner[y][x]) && aliveP(s, m.owner[y][x])) hqs.push([x, y]);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (m.t[y][x] !== (terr || 'city') || m.owner[y][x] !== p || C.unitAt(s, x, y)) continue;
      let d = 0;
      if (hqs.length) { d = INF; for (const [hx, hy] of hqs) d = Math.min(d, Math.abs(hx - x) + Math.abs(hy - y)); }
      out.push([x, y, d]);
    }
    return out.sort((a, b) => a[2] - b[2] || a[1] - b[1] || a[0] - b[0]).slice(0, max > 0 ? max : pwOf(s, p).militiaMax).map(c => [c[0], c[1]]);
  };

  C.startTurn = function (s) {
    const p = s.turn, m = s.map;
    // 顺序写死：关技能 → 结算研究（完成的科技此刻生效）→ 利息 → 收入 → 扣研究经费 → 回血、修理和其他回合开始的效果
    s.events = [];
    if (typeof s.powerOn[p] === 'number' && s.powerOn[p] > 1) s.powerOn[p]--; else s.powerOn[p] = false; // 灯火管制 · 极：数字是还剩几个己方回合开始
    s.built = {};
    for (const u of s.units) if (u.owner === p) { if (u.shot) { delete u.shot; visCache.delete(s); } if (u.ow) delete u.ow; if (u.pr) delete u.pr; if (u.amb) delete u.amb; if (u.ran) delete u.ran; }
    if (s.grit) delete s.grit; // 咬牙、打招呼：按“每个敌方回合”计数的，谁的回合开始都清
    if (s.owUsed) delete s.owUsed;
    if (s.kaUsed) delete s.kaUsed[p];
    if (s.firstAtk) delete s.firstAtk[p];
    if (s.sold) delete s.sold[p];
    techFix(s);
    const itr = s.tech ? ruleOf(s, p).interest : null; // 利息：按这一刻的存款算，上限乘地图系数
    if (itr) {
      const g = Math.min(Math.round(itr.max * C.techScale(s) / 10) * 10, Math.floor(s.funds[p] / itr.per) * itr.gain);
      if (g > 0) { s.funds[p] += g; s.events.push({ type: 'interest', player: p, amount: g }); }
    }
    s.funds[p] += C.income(s, p);
    oreTurnStart(s, p);
    rpIncome(s, p);
    const rl = ruleOf(s, p), regen = rl.regen, regenOn = rl.regenOn; // 军医：所有单位在任何地方每回合自动恢复；草药：某一类兵种
    if (regen || regenOn || rl.regenProp || rl.regenAt) {
      let n = 0;
      for (const u of s.units) {
        if (u.owner !== p || u.hp >= 100) continue;
        let h = regen || 0;
        if (h && rl.regenLow && u.hp <= rl.regenLow.hp) h += rl.regenLow.add; // 分诊：伤重的多回一点
        if (rl.regenProp && !D.UNITS[u.type].air && m.owner[u.y][u.x] === p && D.TERRAIN[m.t[u.y][u.x]].prop) h += rl.regenProp; // 勾缝：站在己方建筑上
        if (rl.regenAt && !D.UNITS[u.type].air) h += rl.regenAt[m.t[u.y][u.x]] || 0; // 井长：站在这些地形上
        if (regenOn) for (const cls in regenOn) if (CLS[cls] && CLS[cls](u.type, D.UNITS[u.type])) h += regenOn[cls];
        if (h) { u.hp = Math.min(100, u.hp + h); n++; }
      }
      if (n) s.events.push({ type: 'heal', player: p, n });
    }
    if (rl.roadMarch) for (const u of s.units) if (u.owner === p && !D.UNITS[u.type].air && (m.t[u.y][u.x] === 'road' || m.t[u.y][u.x] === 'bridge')) u.march = rl.roadMarch; // 机械化行军
    if (rl.roadRun) for (const u of s.units) if (u.owner === p && CLS.vehicle(u.type, D.UNITS[u.type]) && (m.t[u.y][u.x] === 'road' || m.t[u.y][u.x] === 'bridge')) u.march = Math.max(u.march || 0, rl.roadRun); // 铺路：回合开始时在道路、桥梁上的车辆
    if (rl.roughMarch) for (const u of s.units) if (u.owner === p && !D.UNITS[u.type].air && rl.roughMarch.on.includes(m.t[u.y][u.x])) u.march = Math.max(u.march || 0, rl.roughMarch.v); // 踏雪
    techTurnStart(s, p, rl);
    if (s.camp) { campTurnStart(s); campCheck(s); }
    // 回合开始的修理和治疗。几种来源取最大的一种，不相加：
    //   花钱的（按造价比例，钱不够就少修或不修）：步兵类站在任何己方建筑上 20 HP，站在己方医院上 40，挨着己方医院 20；
    //     车辆只在司令部 / 城市 / 兵工厂，船在港口，飞机在机场，各 20
    //   免费的：四邻有己方医护兵的步兵类 20（几个医护兵不叠加；医护兵治不了自己，能被别的医护兵治）
    const mdcHeal = s.units.some(u => u.owner === p && u.type === 'mdc') ? 20 + (rl.mdcPlus || 0) : 0; // rules.mdcPlus：医护兵多治多少
    const plus = rl.repairPlus || 0; // 野战修理：花钱修的多回一点
    let occ = null;
    for (const u of s.units) {
      if (u.owner !== p || u.hp >= 100) continue;
      const U = D.UNITS[u.type], t = m.t[u.y][u.x], mineHere = m.owner[u.y][u.x] === p, inf = C.isInfantry(u);
      let paid = 0, free = 0;
      if (inf) {
        if (mineHere && D.TERRAIN[t].prop) paid = t === 'hospital' ? 40 : 20;
        if (!paid) for (const [dx, dy] of DIRS) {
          const x = u.x + dx, y = u.y + dy;
          if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.t[y][x] === 'hospital' && m.owner[y][x] === p) { paid = 20; break; }
        }
        if (mdcHeal) {
          occ = occ || occGrid(s);
          for (const [dx, dy] of DIRS) {
            const x = u.x + dx, y = u.y + dy;
            if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
            const o = occ[y * m.w + x];
            if (o && o.owner === p && o.type === 'mdc') free = Math.max(free, mdcHeal + (o.ore ? D.RES.heal : 0)); // 强化的医护兵多治一点；几个医护兵取最多的，不相加
          }
        }
      } else if (mineHere && (U.air ? t === 'airport' : U.ship ? t === 'port' && !(ebbOn(s, p) || NOR).noRepair : (t === 'hq' || t === 'city' || t === 'factory'))) paid = 20; // 大潮期间舰船不能在港口修理
      else if (mineHere && rl.repairAt) { for (const cls in rl.repairAt) if (CLS[cls] && CLS[cls](u.type, U) && rl.repairAt[cls].includes(t)) paid = 20; } // 迫降场：这类兵种多几种能修的建筑
      const miss = 100 - u.hp, freeHeal = Math.min(free, miss);
      let done = false;
      if (paid) {
        const md = modOf(s, p, u.type), mul = md.repair * (md.repairOn && md.repairOn[t] != null ? md.repairOn[t] : 1);
        for (const want of paid > 20 ? [paid + plus, 20 + plus, 10 + plus, 10] : [20 + plus, 10 + plus, 10]) {
          const heal = Math.min(want, miss);
          if (heal <= freeHeal) break; // 免费的不比它少，就用免费的
          const cost = Math.round(C.costOf(s, p, u.type) * heal / 100 * mul / 10) * 10; // 修理费取整到 10
          if (s.funds[p] >= cost) { s.funds[p] -= cost; u.hp += heal; done = true; break; }
        }
      }
      if (!done && freeHeal) u.hp += freeHeal;
    }
    // 维修车：给相邻的己方非步兵类单位各修 10 HP
    for (const r of s.units) {
      if (r.owner !== p || r.type !== 'rep') continue;
      occ = occ || occGrid(s);
      for (const [dx, dy] of DIRS) {
        const x = r.x + dx, y = r.y + dy;
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        const o = occ[y * m.w + x];
        if (o && o.owner === p && o.hp < 100 && !C.isInfantry(o)) o.hp = Math.min(100, o.hp + 10 + (r.ore ? D.RES.repair : 0)); // 强化的维修车多修一点
      }
    }
  };
  C.endTurn = function (s) {
    const p = s.turn;
    if (s.tech) {
      const st = ruleOf(s, p).stillAtk; // 坐底：这回合没走过、也不是刚造的，下回合第一次攻击有加成
      for (const u of s.units) {
        if (u.owner === p) {
          if (st && inCls(st.on, u.type, D.UNITS[u.type]) && !u.mvd && !u.fresh) u.still = true; else if (u.still) delete u.still;
          if (u.mvd) delete u.mvd; if (u.fresh) delete u.fresh; if (u.dropped) delete u.dropped;
          for (const c of u.cargo) if (c.late) delete c.late;
        }
        if (u.ro) delete u.ro; // 穿插 · 极的每回合上限
      }
    }
    s.units.forEach(u => { if (u.owner === p) { u.moved = false; if (u.fired) delete u.fired; if (u.left != null) delete u.left; if (u.used != null) delete u.used; if (u.kills) delete u.kills; if (u.march) delete u.march; if (u.bump) delete u.bump; u.cargo.forEach(c => { c.moved = false; }); } });
    for (const u of s.units) if (u.sp) delete u.sp; // 溅射的每回合上限
    const nx = C.nextPlayer(s);
    if (nx <= p) { // 轮回到当天第一个存活阵营
      const lim = rulesOf(s).dayLimit;
      if (s.camp) { campDayEnd(s); if (s.winner) return; }
      if (lim > 0 && s.day >= lim && !s.winner) { judgeByDays(s); campStamp(s); return; }
      s.day++;
      s.turn = nx;
      C.startTurn(s);
      if (!s.winner) floodStep(s); // 涨潮：新的一天开始时（事件记在这个回合的 s.events 里）
      return;
    }
    s.turn = nx;
    C.startTurn(s);
  };
  // 天数用完还没分胜负：按队伍比收入建筑数，再比兵力总价值，仍相同则行动顺序靠后的队伍胜
  function judgeByDays(s) {
    ensure(s);
    const sc = {};
    for (const p of C.alivePlayers(s)) {
      const tm = s.team[p], e = sc[tm] || (sc[tm] = { tm, props: 0, val: 0, last: 0 });
      e.props += C.props(s, p); e.last = Math.max(e.last, p);
    }
    const add = u => { const e = sc[s.team[u.owner]]; if (e) e.val += D.UNITS[u.type].cost * u.hp / 100; u.cargo.forEach(add); };
    s.units.forEach(add);
    const best = Object.values(sc).sort((a, b) => b.props - a.props || b.val - a.val || b.last - a.last)[0];
    s.winner = best.tm; s.reason = 'days'; s.winners = [];
    for (let p = 1; p <= s.players; p++) if (s.team[p] === best.tm) s.winners.push(p);
  }

  // ───────── 电脑 AI：每次返回一个动作，由界面（或模拟器）执行 ─────────
  const NOBUILD = { apc: 1, tcp: 1, lnd: 1 }; // 运输单位不参加造兵打分，要不要造另外判断（见 aiBuild）
  const isInd = U => !!U.range && U.range[1] > 1 && !U.lob; // 站桩远程：移动后不能开火的（投弹手不算）
  const MS = 10; // 电脑打分里的常数（靠近目标每格 120 分、占领 6000 分……）是按旧的金额量级定的：造价进打分公式前乘回 10，行为和缩放前一致
  let A = null; // 当前这步棋用的参数：普通 / 新手用 AI，高手用 AIH（C.aiNext 里设）
  const man = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  // 性价比矩阵：k 先手打 e 一次（双方满血、平原）净赚多少资金，按需计算一次
  let EFF = null;
  function effTable() {
    if (EFF) return EFF;
    EFF = {};
    const hit = (a, d, ahp) => {
      const b = D.DMG[a][d]; if (b == null) return 0;
      const cv = D.UNITS[a].cover == null ? 1 : D.UNITS[a].cover;
      const def = (D.UNITS[d].air || D.UNITS[d].ship) ? 0 : 0.1 * cv;
      return Math.min(100, (b + 4.5) * ahp / 100 * (1 - def));
    };
    for (const a of D.ORDER) {
      EFF[a] = {};
      for (const d of D.ORDER) {
        const A = D.UNITS[a], B = D.UNITS[d];
        if (!A.range || D.DMG[a][d] == null) { EFF[a][d] = 0; continue; }
        const dmg = hit(a, d, 100);
        // 远程和抛射单位按隔着打算，不挨反击；近战打近战、近战打投弹手都挨反击
        const back = (A.range[1] === 1 && B.range && B.range[0] === 1 && dmg < 100) ? hit(d, a, 100 - dmg) : 0;
        EFF[a][d] = dmg / 100 * B.cost - back / 100 * A.cost;
      }
    }
    return EFF;
  }

  // 一步棋的只读快照：全图只扫一遍，单位只过一遍。AI 内层循环里要的全图统计都从这里拿
  // 迷雾下电脑不作弊：快照里只有它看得见的单位（occ、foes），外加记忆里最近见过的敌人（ghost，只用来判断往哪走、防着谁）
  function buildCtx(s) {
    const m = s.map, w = m.w, h = m.h, N = nP(s), p = s.turn, per = rulesOf(s).income, fog = veilOn(s);
    const st = fog ? visState(s) : null;
    const ctx = {
      s, fog, lvl: C.aiLevel(s, p), vis: fog ? teamVision(s, st, teamOf(s, p)) : null,
      occ: fog ? new Array(w * h) : occGrid(s), props: [], silos: [], hq: new Array(N + 1).fill(-1),
      tower: new Array(N + 1).fill(0), income: new Array(N + 1).fill(0), val: new Array(N + 1).fill(0),
      mine: [], foes: [], silo: null, fb: null, aura: {}, goal: null, oreOn: oreOn(s), shards: [],
    };
    for (let y = 0; y < h; y++) {
      const tr = m.t[y], or = m.owner[y];
      for (let x = 0; x < w; x++) {
        const t = tr[x], T = D.TERRAIN[t];
        if (t === 'shard') ctx.shards.push(y * w + x);
        if (T.prop) {
          const o = or[x];
          ctx.props.push({ i: y * w + x, x, y, t, owner: o });
          if (o > 0 && o <= N) {
            if (t === 'hq') ctx.hq[o] = y * w + x;
            else if (t === 'tower') ctx.tower[o]++;
            ctx.income[o] += incOf(T, per);
          }
        } else if (t === 'silo') ctx.silos.push(y * w + x);
      }
    }
    // 兵力按“造价 × HP”算，再乘上指挥官给这个兵种的攻防修正：攻击打了折的大军（比如军费）不该被当成全场最强、招来所有人围攻
    const worth = u => { if (!D.UNITS[u.type].range) return 0; const md = modOf(s, u.owner, u.type); return D.UNITS[u.type].cost * u.hp / 100 * Math.max(0.5, 1 + md.atk + md.def) * (u.ore ? AI.oreWorth : 1); };
    for (const u of s.units) {
      if (fog) { if (!canSeeIn(s, st, p, u)) continue; ctx.occ[u.y * w + u.x] = u; }
      if (u.owner === p) ctx.mine.push(u); else if (C.isEnemy(s, p, u.owner)) ctx.foes.push(u);
      ctx.val[u.owner] += worth(u);
    }
    // 潜行指挥官的兵力多半藏着看不见：按它的收入估一个下限，免得把它当成没兵的软柿子（或者干脆不管它）
    for (let q = 1; q <= N; q++) if (q !== p && aliveP(s, q) && C.isEnemy(s, p, q) && ruleOf(s, q).stealth) { ctx.stealthFoe = true; ctx.val[q] = Math.max(ctx.val[q], ctx.income[q] * A.stealthVal); }
    if (fog) { // 记忆：看得见的记下来；记忆里的，过期了、或者那一格现在看得清却没人，就忘掉
      const mem = s.ai && s.ai.mem && s.ai.mem[p];
      if (mem) {
        const seen = mem.seen || (mem.seen = {}), now = {};
        for (const e of ctx.foes) { now[e.id] = 1; seen[e.id] = { id: e.id, type: e.type, owner: e.owner, x: e.x, y: e.y, hp: e.hp, stars: e.stars, cargo: [], day: s.day, ghost: true }; }
        for (const id in seen) {
          if (now[id]) continue;
          const g = seen[id], hide = g.type === 'sub' || (!D.UNITS[g.type].air && HIDE[m.t[g.y][g.x]]);
          if (s.day - g.day > A.memDays * (hide && ruleOf(s, g.owner).stealth ? A.stealthMem : 1) || !aliveP(s, g.owner) || (ctx.vis[g.y * w + g.x] && !hide)) { delete seen[id]; continue; }
          ctx.foes.push(g); ctx.val[g.owner] += worth(g);
        }
      }
    }
    if (s.camp) { const gc = campGoalCells(s); if (gc.length) { ctx.goal = {}; for (const [x, y] of gc) ctx.goal[y * w + x] = 1; } }
    return ctx;
  }
  function ctxSilo(ctx) { return ctx.silo || (ctx.silo = C.bestSiloTarget(ctx.s, ctx.s.turn)); }

  function aiMemo(s) {
    const tag = s.day + '-' + s.turn;
    if (!s.ai || s.ai.tag !== tag) {
      const mem = (s.ai && s.ai.mem) || {}, p = s.turn;
      if (!mem[p]) mem[p] = { style: STYLES[Math.floor(C.rand() * STYLES.length)], saved: -9, focus: null, decap: {} };
      const ctx = CTX && CTX.s === s ? CTX : buildCtx(s);
      const focus = pickFocus(s, ctx, p, mem[p]);
      const [mv, ev] = teamValues(s, p, ctx.val, focus);
      s.ai = { tag, claims: {}, threat: null, gd: {}, mem, focus, push: aiStance(s, p, focus, ctx), ahead: mv >= ev * A.aheadRatio && s.day > A.aheadDay, crush: mv >= ev * A.crushRatio && s.day > A.crushDay, plan: null, weak: null, rc: {}, combo: null, search: null };
    }
    return s.ai;
  }
  // 每局随机一种造兵偏好，免得每盘都是同一套部队
  const STYLES = [
    {},
    { tnk: 1.4, med: 1.4, hvy: 1.3, rec: 1.3 },
    { cop: 1.4, atk: 1.4, bmb: 1.3, ftr: 1.2 },
    { art: 1.3, rkt: 1.5, snp: 1.5, bsh: 1.5 },
    { rec: 1.5, tnk: 1.3, cop: 1.3, aa: 1.3, snp: 1.3, gbt: 1.3 },
    { dst: 1.4, sub: 1.5, bsh: 1.5, gbt: 1.4, rkt: 1.2 },
  ];
  // 我方队伍的兵力，和对手的兵力（都取自快照：迷雾下只算知道的）。对手：有主攻对象就算它所在的队伍，没有就算最强的那支敌对队伍
  function teamValues(s, p, val, focus) {
    const N = nP(s), byTeam = {};
    let mv = 0, mx = 0;
    for (let q = 1; q <= N; q++) {
      if (!aliveP(s, q)) continue;
      const v = val[q];
      if (!C.isEnemy(s, p, q)) mv += v;
      else { const tm = teamOf(s, q); byTeam[tm] = (byTeam[tm] || 0) + v; if (byTeam[tm] > mx) mx = byTeam[tm]; }
    }
    return [mv, focus ? byTeam[teamOf(s, focus)] || 0 : mx];
  }
  const PUSH_POWER = { blitz: 1, storm: 1, sky: 1, iron: 1 }; // 这些技能开着的回合，电脑一律压上去
  // 这回合是压上去还是先稳住：兵力占优、技能开着、或者拖到后期，就压上去
  function aiStance(s, p, focus, ctx) {
    const [mv, ev] = teamValues(s, p, ctx.val, focus);
    if (s.powerOn[p] && (PUSH_POWER[s.co[p]] || fxOf(s, p).ai === 'attack') && C.enemiesOf(s, p).length < 2) return true; // 多方混战时不因为开了技能就猛冲，免得便宜第三家
    let thr = Math.max(A.pushMin, A.pushStart - A.pushDecay * s.day);
    if (A.hardCons && mv < ev) thr += A.hardCons; // 高手：落后时更沉得住气
    return mv >= ev * thr;
  }
  // 多个敌对阵营时先打谁。每个电脑选一个“主攻对象”，几天内不换，兵力往它那边集中；
  // 其余敌对阵营照样防、送上门的照样打，只是不主动跑过去。打分（越低越该打，单位是“格”）：
  //   离得近的（两座司令部的距离）、比我弱的、正在逼近我家的优先；实力占比明显领先的要扣分，免得没人管它。
  // 四方各自为战时，各家的主攻对象多半是各自的邻居，不会全体围着一家打。只有一个敌对阵营时不起作用。
  function pickFocus(s, ctx, p, mem) {
    const foes = C.enemiesOf(s, p);
    if (foes.length < 2) return foes[0] || 0;
    const cur = mem.focus;
    if (cur && aliveP(s, cur.q) && C.isEnemy(s, p, cur.q) && s.day - cur.day < A.focusDays) return cur.q;
    const w = s.map.w, hq = ctx.hq[p], str = q => ctx.val[q] + A.incW * ctx.income[q];
    const ramp = Math.min(1, s.day / 10); // 开局几天各家实力差不多（后手还没来得及造兵），主要看远近
    const mine = Math.max(1, str(p));
    let all = mine, nAll = 1;
    for (const q of foes) { all += str(q); nAll++; }
    const thr = {};
    for (const q of foes) thr[q] = 0;
    if (hq >= 0) for (const e of ctx.foes) {
      const d = Math.abs(e.x - hq % w) + Math.abs(e.y - (hq - hq % w) / w);
      if (d <= A.homeR && D.UNITS[e.type].range) thr[e.owner] += D.UNITS[e.type].cost * e.hp / 100;
    }
    let best = foes[0], bs = INF;
    for (const q of foes) {
      const qh = ctx.hq[q];
      const d = hq >= 0 && qh >= 0 ? Math.abs(qh % w - hq % w) + Math.abs((qh - qh % w) / w - (hq - hq % w) / w) : 0;
      let sc = d * A.focusDistW + A.focusStrW * ramp * Math.min(2, str(q) / mine);
      sc -= A.threatW * Math.min(1, thr[q] / (0.3 * mine));
      sc -= A.leadW * ramp * Math.max(0, str(q) / all * nAll - 1.25); // 实力占比超过平均的 1.25 倍才算领先
      if (cur && cur.q === q) sc -= A.focusStick;
      sc += C.rand() * 2;
      if (sc < bs) { bs = sc; best = q; }
    }
    mem.focus = { q: best, day: s.day };
    return best;
  }
  // 每个阵营的偏好修正（负数 = 更想打，和距离相加）：主攻对象减，其他敌对阵营加
  function foeBias(s, ctx, p) {
    if (ctx.fb) return ctx.fb;
    const fb = ctx.fb = new Array(nP(s) + 1).fill(0), foes = C.enemiesOf(s, p);
    if (foes.length < 2) return fb;
    const focus = aiMemo(s).focus;
    for (const q of foes) fb[q] = q === focus ? -A.focusW : A.offW;
    return fb;
  }
  // 单位 e 下回合能打到哪些格子（格子下标 y*w+x 的数组）。界面画威胁范围也可以用
  let TSEEN = new Int32Array(0), TSTAMP = 0;
  C.threatCells = function (s, e) {
    const E = D.UNITS[e.type], cells = [];
    if (!E.range) return cells;
    const w = s.map.w, h = s.map.h, n = w * h, rg = C.rangeOf(s, e), mx = rg[1], mn = rg[0];
    if (!C.canMoveFire(e, s)) {
      for (let dy = -mx; dy <= mx; dy++) for (let dx = -mx; dx <= mx; dx++) {
        const d = Math.abs(dx) + Math.abs(dy), x = e.x + dx, y = e.y + dy;
        if (d >= mn && d <= mx && x >= 0 && y >= 0 && x < w && y < h) cells.push(y * w + x);
      }
      return cells;
    }
    const dist = C.reach(s, e).dist;
    if (TSEEN.length < n) TSEEN = new Int32Array(n);
    const seen = TSEEN, stamp = ++TSTAMP;
    const add = i => { if (seen[i] !== stamp) { seen[i] = stamp; cells.push(i); } };
    for (let i = 0; i < n; i++) {
      if (dist[i] === INF) continue;
      const x = i % w, y = (i - x) / w;
      if (mx <= 1) {
        if (x > 0) add(i - 1);
        if (x < w - 1) add(i + 1);
        if (y > 0) add(i - w);
        if (y < h - 1) add(i + w);
      } else for (let dy = -mx; dy <= mx; dy++) for (let dx = -mx; dx <= mx; dx++) {
        const d = Math.abs(dx) + Math.abs(dy), xx = x + dx, yy = y + dy;
        if (d >= 1 && d <= mx && xx >= 0 && yy >= 0 && xx < w && yy < h) add(yy * w + xx);
      }
    }
    return cells;
  };
  // 敌对阵营每个单位下回合能打到哪些格子（稀疏存：格子下标列表）。每回合算一次
  // 射程一律用 C.rangeOf（含碉堡、山地、指挥官的加成）：站桩远程按现在的位置算；近战和抛射单位按“走到哪、从那儿能打到哪”算
  function aiThreats(s, ctx) {
    const ai = aiMemo(s);
    if (ai.threat) return ai.threat;
    const zs = [];
    for (const e of ctx.foes) if (D.UNITS[e.type].range) zs.push({ e, cells: C.threatCells(s, e) });
    return ai.threat = zs;
  }
  // 敌对司令部守得严不严：周围 A.decapR 格内敌对战斗单位的总价值不到 A.decapVal 就算空虚。每回合算一次
  function hqWeak(s, ctx) {
    const ai = aiMemo(s);
    if (ai.weak) return ai.weak;
    const w = s.map.w, weak = ai.weak = {};
    for (const q of C.enemiesOf(s, s.turn)) {
      const hq = ctx.hq[q];
      if (hq < 0) continue;
      const hx = hq % w, hy = (hq - hx) / w;
      let v = 0;
      for (const e of ctx.foes) {
        if (Math.abs(e.x - hx) + Math.abs(e.y - hy) > A.decapR || !D.UNITS[e.type].range) continue;
        v += D.UNITS[e.type].cost * e.hp / 100 * (e.x === hx && e.y === hy ? 2 : 1); // 压在司令部上的算双份
      }
      weak[hq] = v < A.decapVal;
    }
    return weak;
  }
  // 高手的集火计划：这回合哪些敌人凑得出击杀。每个还没动的战斗单位这回合够得着谁、大概打多少，
  // 按伤害从大到小加起来超过目标的 HP，就把这几个单位记成“这个目标的集火组”，它们打这个目标时加分（见 aiUnit）。
  // 每个单位的可达范围一回合只算一次（别的单位动过以后略有出入，只影响加分，不影响真正能不能打）
  function comboPlan(s, ctx, mine) {
    const ai = aiMemo(s), w = s.map.w, h = s.map.h, occ = ctx.occ, p = s.turn, per = {};
    for (const u of mine) {
      const U = D.UNITS[u.type];
      if (!U.range || u.fired) continue;
      const rg = C.rangeOf(s, u), still = !C.canMoveFire(u, s), mp = still ? 0 : C.movePts(s, u);
      let dist = null;
      for (const e of ctx.foes) {
        if (e.ghost || D.DMG[u.type][e.type] == null) continue;
        const d0 = Math.abs(e.x - u.x) + Math.abs(e.y - u.y);
        if (d0 > mp + rg[1]) continue;
        let ok = false;
        if (still) ok = d0 >= rg[0] && d0 <= rg[1];
        else {
          if (!dist) dist = ai.rc[u.id] || (ai.rc[u.id] = C.reach(s, u).dist);
          const R = rg[1];
          for (let dy = -R; dy <= R && !ok; dy++) for (let dx = -R; dx <= R; dx++) {
            const d = Math.abs(dx) + Math.abs(dy), x = e.x + dx, y = e.y + dy;
            if (d < rg[0] || d > R || x < 0 || y < 0 || x >= w || y >= h) continue;
            const i = y * w + x, o = occ[i];
            if (dist[i] < INF && (!o || o === u)) { ok = true; break; }
          }
        }
        if (!ok) continue;
        const dmg = C.damage(s, u, e, 4.5);
        if (dmg > 0) (per[e.id] || (per[e.id] = { e, list: [] })).list.push([dmg, u.id]);
      }
    }
    const combo = {};
    for (const id in per) {
      const { e, list } = per[id];
      if (list.length < 2) continue;
      list.sort((a, b) => b[0] - a[0]);
      let sum = 0, k = 0;
      while (k < list.length && k < A.comboMax && sum < e.hp) sum += list[k++][0];
      if (sum < e.hp * A.comboNeed || k < 2) continue; // 一个人就能打死的不用凑
      const need = {};
      for (let j = 0; j < k; j++) need[list[j][1]] = 1;
      combo[id] = need;
    }
    return combo;
  }
  // 对手里有潜行的指挥官：它的建筑和“钻进林子不见了的兵”周围的森林、废墟、礁石，是该去贴身搜一搜的地方。每回合算一次
  function searchCells(s, ctx) {
    const ai = aiMemo(s);
    if (ai.search) return ai.search;
    const m = s.map, w = m.w, h = m.h, p = s.turn, out = [], seen = {};
    const around = (cx, cy, r) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx, y = cy + dy, i = y * w + x;
        if (Math.abs(dx) + Math.abs(dy) > r || x < 0 || y < 0 || x >= w || y >= h || seen[i] || !HIDE[m.t[y][x]]) continue;
        seen[i] = 1;
        if (ctx.occ[i]) continue; // 看得见上面有人，不用搜
        let near = false; // 旁边已经有自己人贴着：里面有没有人一目了然
        for (const [ax, ay] of DIRS) { const o = ctx.occ[(y + ay) * w + x + ax]; if (x + ax >= 0 && x + ax < w && o && !C.isEnemy(s, p, o.owner)) near = true; }
        if (!near) out.push(i);
      }
    };
    for (const pr of ctx.props) if (pr.owner && C.isEnemy(s, p, pr.owner) && aliveP(s, pr.owner) && ruleOf(s, pr.owner).stealth) around(pr.x, pr.y, 2);
    for (const e of ctx.foes) if (e.ghost && ruleOf(s, e.owner).stealth) around(e.x, e.y, 2);
    return ai.search = out;
  }
  // 高手的占领分工：每回合开始时把能占领的单位和建筑配对，按“几回合能占下来 − 建筑价值”从小到大贪心分配，一座建筑只派一个
  function capPlan(s, ctx, ai) {
    if (ai.plan) return ai.plan;
    const plan = ai.plan = {}, p = s.turn, m = s.map, w = m.w, occ = ctx.occ, pairs = [];
    const fb = foeBias(s, ctx, p);
    const targets = ctx.props.filter(pr => pr.t !== 'hq' && (pr.owner === 0 || C.isEnemy(s, p, pr.owner)));
    for (const u of ctx.mine) {
      const U = D.UNITS[u.type];
      if (!U.cap) continue;
      const i0 = u.y * w + u.x;
      if (m.cap[u.y][u.x] < 20 && C.canCapture(s, u)) { plan[u.id] = i0; continue; } // 正在占的接着占
      const dist = C.reach(s, u, true, true).dist, mp = C.movePts(s, u), cp = C.capPower(s, u);
      for (const pr of targets) {
        const d = dist[pr.i];
        if (d === INF) continue;
        const o = occ[pr.i];
        if (o && o !== u && !C.isEnemy(s, p, o.owner)) continue;
        let c = Math.ceil(d / mp) + Math.ceil(20 / cp) - 1;
        c -= pr.t === 'mine' ? A.planMine + (ctx.oreOn ? A.planOre * (C.mineLeft(s, pr.i % w, (pr.i - pr.i % w) / w) || 0) / 7.5 : 0) : // 矿的碎片按剩余量算（7.5 份算一倍）
           pr.t === 'factory' || pr.t === 'airport' || pr.t === 'port' ? A.planProd : pr.t === 'tower' ? (nearFront(ctx, pr) ? A.planTower : 0) : pr.t === 'lab' && techOn(s) ? A.planLab : 0;
        if (ctx.goal && ctx.goal[pr.i]) c -= A.planGoal; // 战役的目标建筑：和司令部一样要紧 // 雷达塔只管周围 5 格：离敌人近的才值得先占
        if (pr.owner) c += A.planFoe + fb[pr.owner] * 0.2; // 敌人的建筑有人守，往后排
        pairs.push([c + (u.type === 'mech' ? 0.5 : 0), u.id, pr.i]);
      }
    }
    pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    const taken = {};
    for (const k in plan) taken[plan[k]] = 1;
    for (const [, id, i] of pairs) { if (plan[id] != null || taken[i]) continue; plan[id] = i; taken[i] = 1; }
    return plan;
  }
  const seaCache = new WeakMap();
  // 每个格子离最近的海有多远（曼哈顿距离），多源 BFS
  function seaDist(m) {
    let sd = seaCache.get(m.t);
    if (sd) return sd;
    const w = m.w, h = m.h;
    sd = new Array(w * h).fill(99);
    let q = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m.t[y][x] === 'sea') { sd[y * w + x] = 0; q.push(y * w + x); }
    while (q.length) {
      const nq = [];
      for (const i of q) {
        const x = i % w, y = (i - x) / w, d = sd[i] + 1;
        if (d >= 99) continue;
        if (x > 0 && sd[i - 1] > d) { sd[i - 1] = d; nq.push(i - 1); }
        if (x < w - 1 && sd[i + 1] > d) { sd[i + 1] = d; nq.push(i + 1); }
        if (y > 0 && sd[i - w] > d) { sd[i - w] = d; nq.push(i - w); }
        if (y < h - 1 && sd[i + w] > d) { sd[i + w] = d; nq.push(i + w); }
      }
      q = nq;
    }
    seaCache.set(m.t, sd);
    return sd;
  }
  // 这座建筑离敌方单位或敌方司令部够不够近（范围增益用得上）
  function nearFront(ctx, pr) {
    const w = ctx.s.map.w, R = AURA_R + 4;
    for (const e of ctx.foes) if (Math.abs(e.x - pr.x) + Math.abs(e.y - pr.y) <= R) return true;
    for (let q = 1; q < ctx.hq.length; q++) { const i = ctx.hq[q]; if (i >= 0 && C.isEnemy(ctx.s, ctx.s.turn, q) && Math.abs(i % w - pr.x) + Math.abs((i - i % w) / w - pr.y) <= R + 4) return true; }
    return false;
  }
  function repairSpot(s, u, x, y) {
    const m = s.map, U = D.UNITS[u.type], t = m.t[y][x];
    if (m.owner[y][x] !== u.owner) return false;
    if (U.air) return t === 'airport';
    if (U.ship) return t === 'port';
    if (t === 'city' || t === 'hq') return true;
    return C.isInfantry(u) && !!D.TERRAIN[t].prop && t !== 'factory' && t !== 'airport' && t !== 'port'; // 步兵类在任何己方建筑上都能修；不去堵造兵的地方
  }

  function aiWantPower(s, p, mine, ctx) {
    const co = s.co[p];
    const own = ctx.mine, en = ctx.foes;
    if (co === 'gold') return true;
    // 第二批起的指挥官：按 fx.ai 的提示放技能
    const fx = COBY[co] && COBY[co].fx;
    if (fx && fx.ai) {
      if (fx.ai === 'now') return true;
      if (fx.ai === 'buyout') { // 收购：有买得起、值得买的目标才放。有两个以上就马上放；只有一个就等自己的单位都动完（也许还能再贴上一个）
        const ts = C.buyoutTargets(s, p).filter(t => t.price <= s.funds[p] && t.price >= A.buyMin);
        return ts.length >= 2 || (ts.length === 1 && !mine.length);
      }
      if (fx.ai === 'sell') { // 黑市：残血单位卖掉比留着值的时候
        let gain = 0;
        for (const u of own) if (!u.cargo.length && u.hp <= A.sellHp) gain += D.UNITS[u.type].cost * (fx.sell - u.hp / 100);
        return own.length > 3 && gain >= A.sellMin;
      }
      if (fx.ai === 'heal') {
        let heal = 0;
        for (const u of own) heal += Math.min(fx.heal || 0, 100 - u.hp) * D.UNITS[u.type].cost / 100;
        return heal >= A.wallMinHeal;
      }
      if (fx.ai === 'endturn') { // 自己走完了、敌人贴得近：留给对面的回合用
        if (mine.length) return false;
        const close = own.filter(u => en.some(e => man(e, u) <= 6)).length;
        return close >= Math.max(2, own.length * 0.3);
      }
      if (fx.ai === 'build') { // 走完了、钱够、有空着的生产建筑
        if (mine.length) return false;
        return s.funds[p] >= A.forgeFunds && ctx.props.some(pr => pr.owner === p && (pr.t === 'factory' || pr.t === 'airport' || pr.t === 'port') && !ctx.occ[pr.i]);
      }
      if (!en.length || mine.length < own.length * A.freshFrac) return false;
      const multi = C.enemiesOf(s, p).length > 1, focus = multi ? aiMemo(s).focus : 0;
      const fighters = mine.filter(u => D.UNITS[u.type].range);
      let ready = 0;
      for (const u of fighters) {
        const U = D.UNITS[u.type];
        const rng = isInd(U) ? C.rangeOf(s, u)[1] : C.movePts(s, u) + fxSum(fx.move, u.type, U) + C.rangeOf(s, u)[1] - 1;
        if (en.some(e => (!multi || e.owner === focus) && D.DMG[u.type][e.type] != null && man(e, u) <= rng)) ready++;
      }
      return ready >= Math.max(2, fighters.length * A.blitzFrac);
    }
    if (co === 'militia') { // 全民皆兵：有两座以上空城（或者总共就一座）就放，冒出来的步兵马上能动
      const n = C.militiaSpots(s, p).length;
      return n >= Math.min(2, PW.militiaMax) || (n === 1 && ctx.props.filter(pr => pr.owner === p && pr.t === 'city').length === 1);
    }
    if (co === 'tide') { // 怒潮：回的血够多就开（回合一开始开，船还能吃到移动力和对岸加成）
      let heal = 0;
      for (const u of own) heal += Math.min(D.UNITS[u.type].ship ? PW.tideHeal : PW.tideAll, 100 - u.hp) * D.UNITS[u.type].cost / 100;
      return heal >= A.wallMinHeal;
    }
    if (co === 'wall') { // 铁壁：自己这回合打完再开，反击掉的血也能补上
      if (mine.length) return false;
      let heal = 0;
      for (const u of own) heal += Math.min(PW.wallHeal, 100 - u.hp) * D.UNITS[u.type].cost / 100;
      const close = own.filter(u => en.some(e => man(e, u) <= 6)).length;
      return heal >= A.wallMinHeal || close >= Math.max(3, own.length * 0.4);
    }
    if (!en.length) return false;
    const fresh = mine.length >= own.length * A.freshFrac; // 回合刚开始时用，全军都吃得到加成
    if (!fresh) return false;
    if (co === 'storm') return en.length >= A.stormMin;
    // 闪击 / 俯冲 / 履带洪流 / 怒潮：吃得到加成的部队里，够多的这回合能打到人再开
    const gets = co === 'blitz' || co === 'sky' ? () => true : co === 'iron' ? (U, k) => CLS.tank(k) : null;
    if (gets) {
      const fighters = mine.filter(u => D.UNITS[u.type].range && gets(D.UNITS[u.type], u.type));
      // 多方混战：只数够得着主攻对象的——为了打别家开技能，多半是替第三家做嫁衣
      const multi = C.enemiesOf(s, p).length > 1, focus = multi ? aiMemo(s).focus : 0;
      const extra = co === 'blitz' ? A.blitzReach : 0;
      let ready = 0;
      for (const u of fighters) {
        const U = D.UNITS[u.type];
        const rng = isInd(U) ? C.rangeOf(s, u)[1] : C.movePts(s, u) + extra + C.rangeOf(s, u)[1] - 1;
        if (en.some(e => (!multi || e.owner === focus) && D.DMG[u.type][e.type] != null && man(e, u) <= rng)) ready++;
      }
      return ready >= Math.max(co === 'iron' ? 1 : 2, fighters.length * A.blitzFrac);
    }
    return true;
  }

  // AI 可调参数
  const AI = {
    wallMinHeal: 300, blitzReach: 3, blitzFrac: 0.4,
    dangerFight: 0.15, dangerHold: 0.5, dangerCap: 0.05, pushStart: 1.3, pushDecay: 0.015, pushMin: 0.9, foeExp: 0, indLoss: 1, indShare: 4, dangerInd: 1.0, dangerRetreat: 1.2,
    retreatHp: 4, alpha: 0.7, counterW: 0.7, gainFloor: 0, priorW: 0.35, dup: 0.45, saveRatio: 1.35,
    // 多阵营选主攻对象（见 pickFocus，单位：格）
    focusDays: 5, focusDistW: 0.5, focusStrW: 12, threatW: 12, leadW: 12, focusStick: 3, focusW: 6, offW: 4, incW: 2, homeR: 9,
    maxCand: 80, // 每个单位最多细算多少个落脚格（可达格按粗分排序取前 N）
    memDays: 3, // 迷雾：见过的敌人记几天
    hardCons: 0, hardFlank: false, hardRaid: false, hardRide: false, hardPick: 0, hardPlan: false, // 高手的本事（普通电脑全关，见 AIH）
    rideMin: 12, // 高手：步兵的目标比这更远（或走不到）就找车坐
    rideCut: 2, rideDay: 8, rideFrom: 6, rideSpare: 400, islandRide: true, // 第几天起才考虑造运输单位、造完手里至少还剩多少钱 // 高手：有这么多座中立建筑走不到才造运输单位；敌人司令部走不到时，过了这一天也造
    aheadRatio: 1.3, aheadDay: 5, crushRatio: 2.5, crushDay: 12, // 兵力是对手的多少倍、第几天以后算“占优”
    decapR: 3, decapVal: 500, decapTurns: 3, decapW: 9, decapDays: 2, // 斩首：敌方司令部周围几格内兵力不到多少、己方步兵类几回合内能到，就直取司令部
    softCover: 40, dangerSoft: 0.35, coverUnitW: 0.35, coverUnitBase: 1.2, flmNear: 12, // 投弹手、喷火兵、狙击手：更爱站掩体、更怕挨打；对面躲在掩体里的步兵越多越值得造
    holdCover: 0, auraW: 40, shardW: 1500, oreWant: 4, oreCore: 3, oreSpare: 5, oreIdle: 8, oreWorth: 1.3, eliteW: 1.35, eliteFoot: 0.6, rpCap: 5, buyMin: 200, planW: 8, planMine: 1.5, planOre: 1.5, planProd: 1, planTower: 0.5, planLab: 0.7, planGoal: 3, planFoe: 1.5,
    noise: 8, buildLo: 0.7, buildHi: 1.3, styleOn: true, footMax: 6, footLate: 3, focusKill: 0.15, killBonus: 0.3,
    freshFrac: 0.6, stormMin: 3, richPer: 1200, richMin: 1,
    waitDng: 0, comboW: 0, comboMax: 4, comboNeed: 0.95, comboLoss: 1500, // 高手的集火：凑得出击杀的目标加多少分（× 目标造价）、最多几个人凑、伤害要凑够目标 HP 的几成、为凑击杀最多亏多少
    forgeFunds: 800, hideW: 150, sellHp: 40, sellMin: 250, stealthMem: 3, stealthHq: 3, stealthVal: 5, searchBias: 1, goodW: 1.4, badW: 0.8,
    sweepMax: 2, // 迷雾清剿：知道位置的敌人不超过这么多个时，战斗单位分头去搜没照到的地方
  };
  C.aiParams = AI;
  // 高手电脑的参数：没写的沿用 AI
  const AIH = Object.assign(Object.create(AI), {
    hardCons: 0.15, hardFlank: true, hardRaid: true, hardRide: true, hardPick: 6, hardPlan: true,
    noise: 2, buildLo: 0.9, buildHi: 1.1, holdCover: 30, comboW: 0.3,
    blitzFrac: 0.15, wallMinHeal: 150, // 技能放得勤：槽满了攒着不用，后面挨的打都白挨
    retreatHp: 6, dup: 0.3, footMax: 8, footLate: 4, alpha: 0.6, // 残血早撤、同一兵种敢多造、步兵多带、更看重单位本身的强度
  });
  C.aiHardParams = AIH;

  // 约定：返回的动作里有 path 就一定是走路的路径（至少两格，含起点）；原地不动的动作不带 path
  C.aiNext = function (s) {
    const a = aiNext0(s);
    if (a.path && a.path.length < 2) delete a.path;
    return a;
  };
  // ── 电脑的研究 ──
  // 打法（s.aiTech[p]，开局用 opts.aiTech 指定；不指定时“简单”不研究，其余“均衡”）：
  //   'none' 不研究；'balanced' 经费不超过收入的一成多，一条线一条线来；'heavy' 经费到收入的三成，照样的顺序
  // 顺序：指挥官线一、二级 → 军备一级 → 指挥官线三级 → 军备二级 → 一条和擅长兵种对口的阵营线一、二级 → 军备三级、阵营线三级 → 后勤 → 情报 → 另一条阵营线一、二级
  const AITECH = { balanced: 0.13, heavy: 0.3, lowMax: 0.25 };
  C.aiTechParams = AITECH;
  function aiTechPlan(s, p) {
    const c = COBY[s.co[p]], f = facOf(s, p), co = s.co[p];
    const lines = Object.keys(D.TECH_LINES).filter(k => D.TECH_LINES[k].tree === f);
    const good = (c && c.good) || [];
    const fit = k => { let n = 0; for (const T of D.TECH) if (T.line === k && T.mods) for (const md of T.mods) for (const g of good) if (inCls(md.on, g, D.UNITS[g])) n++; return n; };
    lines.sort((a, b) => fit(b) - fit(a));
    const L = (k, a, b) => { const out = []; for (let t = a; t <= b; t++) { const T = D.TECH.find(x => x.line === k && x.tier === t); if (T && !(T.moot && T.moot[co])) out.push(T.id); } return out; };
    const me = 'co_' + co, A1 = lines[0], B1 = lines[1];
    return [].concat(L(me, 1, 2), L('arm', 1, 1), L(me, 3, 3), L('arm', 2, 2), A1 ? L(A1, 1, 2) : [], L('arm', 3, 3), A1 ? L(A1, 3, 3) : [], L('log', 1, 3), L('int', 1, 3), B1 ? L(B1, 1, 2) : []);
  }
  function aiTech(s, p, ctx) {
    if (!s.tech || !techOn(s)) return null;
    const style = (s.aiTech && s.aiTech[p]) || (ctx.lvl === 'easy' ? 'none' : 'balanced');
    if (style === 'none') return null;
    const t = techGet(s, p), have = rpHave(s, p);
    // 攒够就买：按计划的顺序找第一项现在能解锁的。高手遇到点数还不够的三级会先憋着，手里的点数超过 A.rpCap 倍的一级价就不憋了
    const cap = needOf(s, { pts: 40 }) * A.rpCap;
    for (const id of aiTechPlan(s, p)) {
      const T = TECH[id];
      if (!T || t.done.includes(id)) continue;
      const why = C.canUnlock(s, p, id);
      if (!why) return { type: 'research', id };
      if (ctx.lvl === 'hard' && T.tier === 3 && needOf(s, T) > have && have < cap && techState(s, p, T, t)[0] === 'short') break;
    }
    // 档位：只看收入，回合里不会来回变
    const inc = C.income(s, p), ls = fundsOf(s, p), share = AITECH[style] || AITECH.balanced;
    let want = ls[0].id;
    for (const x of ls) if (x.cost <= inc * (x.id === 'low' ? AITECH.lowMax : share)) want = x.id;
    if (want !== t.fund) return { type: 'fund', level: want };
    return null;
  }
  function aiNext0(s) {
    const p = s.turn;
    A = C.aiLevel(s, p) === 'hard' ? AIH : AI;
    const ctx = CTX = buildCtx(s);
    try {
      aiMemo(s);
      const mine = ctx.mine.filter(u => !u.moved);
      if (ctx.lvl !== 'easy' && rulesOf(s).powers !== false && s.meter[p] >= D.METER_MAX && !s.powerOn[p] && aiWantPower(s, p, mine, ctx)) return { type: 'power' };
      const sellFx = fxOf(s, p).sell;
      if (sellFx && ctx.mine.length > 3) { // 黑市开着：把残血的单位卖掉
        for (const u of ctx.mine) if (!u.cargo.length && u.hp <= A.sellHp && C.sellValue(s, u) > 0) return { type: 'unit', u, x: u.x, y: u.y, act: 'sell', path: [[u.x, u.y]] };
      }
      if (mine.length) {
        if (A.comboW) aiMemo(s).combo = comboPlan(s, ctx, mine);
        const pri = u => {
          const U = D.UNITS[u.type];
          if (U.cap && s.map.cap[u.y][u.x] < 20 && C.canCapture(s, u)) return 0;
          if (isInd(U) && !C.canMoveFire(u, s)) return C.targets(s, u, false).length ? 1 : 5;
          if (u.type === 'rep' || !U.range) return 6;
          if (U.cap) return 4;
          return (U.air ? 2 : 3) - U.cost * MS / 100000;
        };
        let b = mine[0], bp = pri(b);
        for (let i = 1; i < mine.length; i++) { const v = pri(mine[i]); if (v < bp) { bp = v; b = mine[i]; } }
        // 高手：轮到近战部队出手时，先比较几个单位各自最好的一击，挑最赚的那一击先打（能打死的优先，后面的人就不用挨那份反击）
        if (A.hardPick && bp >= 1.5 && bp < 4) {
          const pool = mine.filter(u => { const U = D.UNITS[u.type]; return U.range && !U.cap && !isInd(U); }).sort((x, y) => pri(x) - pri(y)).slice(0, A.hardPick);
          let ba = null;
          for (const u of pool) { const a = aiUnit(s, u, ctx); if (a.act === 'attack' && (!ba || a.score > ba.score)) ba = a; }
          if (ba) return ba;
        }
        return aiUnit(s, b, ctx);
      }
      return aiBuild(s, ctx) || aiTech(s, p, ctx) || { type: 'end' }; // 研究放在回合最后：单位动完、兵造完再下单和调档
    } finally { CTX = null; }
  }

  // 执行电脑给出的动作。返回 { path, trapped, result }：实际走的路、是否被迷雾里的敌人拦停、战斗 / 占领 / 发射 / 卸载的结果
  C.aiApply = function (s, a) {
    const out = { path: a.path || null, trapped: false, result: null };
    if (a.type === 'research') out.result = C.research(s, s.turn, a.id);
    else if (a.type === 'fund') out.result = C.setFund(s, s.turn, a.level);
    else if (a.type === 'power') C.usePower(s, s.turn);
    else if (a.type === 'build') out.result = C.build(s, a.x, a.y, a.unit, a.ore ? { ore: true } : null);
    else if (a.type === 'unit') {
      const u = a.u, from = [u.x, u.y], mv = C.resolveMove(s, u, a.path || [from]);
      out.path = a.path ? mv.path : null; out.trapped = mv.trapped;
      if (mv.bumped) { const e = mv.path[mv.path.length - 1]; C.moveUnit(s, u, e[0], e[1]); out.bumped = true; u.bump = (u.bump || 0) + 1; if (mv.path.length < 2 || u.bump >= 2) u.moved = true; return out; } // 一回合里撞两次就停下，免得在两个隐蔽单位之间来回撞 // 潜行：停下但没遇伏，下一步重新盘算（原地没动就算了）
      if (a.act === 'sell') { out.result = C.sell(s, u); return out; }
      if (mv.trapped) {
        const e = mv.path[mv.path.length - 1]; out.shot = C.moveUnit(s, u, e[0], e[1], mv.path); u.moved = true;
        if (!(out.shot && out.shot.killed)) out.ambush = C.ambushShot(s, u, mv.by); // 看错了：拦住它的隐蔽单位先打一下
        return out;
      }
      if (a.act === 'load') { // 走到运输单位那一格 = 上车
        if (a.target && s.units.includes(a.target) && C.canLoad(s, u, a.target)) C.load(s, u, a.target); else u.moved = true;
        return out;
      }
      out.shot = C.moveUnit(s, u, a.x, a.y, mv.path); // 天网：飞机可能在落点被打（out.shot.killed 为真就没有后续了）
      if (out.shot && (out.shot.killed || out.shot.stopped)) return out; // stopped：天网 · 极，挨了就停
      if (a.act === 'attack') {
        // 迷雾：抛射单位走开以后，原来靠它贴身才看得见的目标可能又看不见了，那就不打
        // 开着科技时再核一遍够不够得着、打不打得了（试射的射程、俯冲 · 极）
        const tg = a.target, rg = s.tech ? C.rangeOf(s, u) : null, dd = tg ? Math.abs(tg.x - u.x) + Math.abs(tg.y - u.y) : 0;
        if ((veilOn(s) && !C.canSee(s, u.owner, tg)) || (rg && (dd < rg[0] || dd > rg[1] || !s.units.includes(tg) || !canHit(s, u, tg)))) u.moved = true; else out.result = C.attack(s, u, tg);
      }
      else if (a.act === 'capture') out.result = C.capture(s, u);
      else if (a.act === 'silo') out.result = C.launchSilo(s, u, a.cx, a.cy);
      else if (a.act === 'unload') {
        // 卸货点按出发格的视野判断（出发时看不见的敌人占着也照常去卸），真卸时被占就是遇伏：C.unload 返回 null、运输单位停下
        if (u.cargo[a.cargo] && C.unloadSpots(s, u, a.cargo, from).some(c => c[0] === a.ux && c[1] === a.uy)) { out.result = C.unload(s, u, a.cargo, a.ux, a.uy); if (!out.result) out.ambushed = true; }
        else u.moved = true; // 出发时就看得见那一格被占了：这回合先停下
      } else u.moved = true;
    }
    return out;
  };

  const moveClass = U => (U.air ? 'air' : U.ship ? (U.carry && U.carry.kind === 'ground' ? 'lnd' : 'ship') : U.mt);
  const SILO_MIN = 300; // 导弹井：敌方损失比己方损失多出这么多资金才值得发射
  function aiUnit(s, u, ctx) {
    const p = u.owner, U = D.UNITS[u.type], m = s.map, w = m.w, h = m.h, n = w * h, ai = aiMemo(s), occ = ctx.occ;
    const r = C.reach(s, u);
    const full = C.reach(s, u, true, true);
    const easy = ctx.lvl === 'easy';
    const rideOn = A.hardRide || (A.islandRide && !easy); // 普通电脑只在“敌人司令部陆路走不到”时用运输单位（见 aiBuild）
    if (rideOn && U.carry && u.cargo.length) return aiCarry(s, u, ctx, r, full);
    const enemies = ctx.foes, fb = foeBias(s, ctx, p);
    const lob = !!U.range && U.range[1] > 1 && C.canMoveFire(u, s); // 能走完再打的远程：投弹手，和苍柏的狙击手
    const indirect = isInd(U) && !lob;
    const soft = !!U.range && !U.cap && C.isInfantry(u); // 狙击手、投弹手、喷火兵：不能占领的步兵类
    const cover = U.cover == null ? 1 : U.cover;
    const myHq = ctx.hq[p];
    const hqDist = (e, hq) => hq < 0 ? 99 : Math.abs(e.x - hq % w) + Math.abs(e.y - (hq - hq % w) / w);
    // 从 u 现在的位置走到能贴上 (x,y) 的最近距离
    const adjDist = (x, y) => {
      let b = full.dist[y * w + x];
      if (x > 0) b = Math.min(b, full.dist[y * w + x - 1] + 1);
      if (x < w - 1) b = Math.min(b, full.dist[y * w + x + 1] + 1);
      if (y > 0) b = Math.min(b, full.dist[y * w + x - w] + 1);
      if (y < h - 1) b = Math.min(b, full.dist[y * w + x + w] + 1);
      return b;
    };
    const freeFor = i => { const o = occ[i]; return !o || o === u; };
    const mp = C.movePts(s, u), mem = ai.mem[p], decap = mem.decap || (mem.decap = {});
    const decapOn = i => decap[i] != null && s.day - decap[i] <= A.decapDays;
    const ox = u.x, oy = u.y;
    // 站在 (x,y) 时的实际射程（碉堡、山地、指挥官加成都算）
    const rangeAt = (x, y) => { u.x = x; u.y = y; const rg = C.rangeOf(s, u); u.x = ox; u.y = oy; return rg; };
    const rgNow = U.range ? C.rangeOf(s, u) : null;

    // 选目标：[格子, 距离, 偏好]
    const goals = [];
    const enemyGoals = () => {
      const dm = D.DMG[u.type];
      for (const e of enemies) {
        const b = dm[e.type];
        if (b == null || b < (cover === 0 ? 40 : 25)) continue; // 喷火兵不追坦克
        // 按目标脚下的地形折算：躲在掩体里的没那么好打（投弹手只算一半、喷火兵不算）
        const ts = D.UNITS[e.type].air ? 0 : D.TERRAIN[m.t[e.y][e.x]].def;
        let bias = -b * (1 - 0.1 * ts * cover) / 40 + fb[e.owner];
        if (cover < 1 && ts >= 2 && C.isInfantry(e)) bias -= 2; // 投弹手、喷火兵：专找掩体里的步兵
        if (!e.ghost && m.cap[e.y][e.x] < 20) bias -= 3;
        if (e.ghost && HIDE[m.t[e.y][e.x]] && (U.cap || u.type === 'rec' || U.reveal)) bias -= 3; // 钻进林子不见了的敌人：步兵、侦察车、喷火兵去贴身搜
        if (D.UNITS[e.type].cap && hqDist(e, myHq) <= 4) bias -= 5; // 有人摸到家门口了
        goals.push([e.y * w + e.x, adjDist(e.x, e.y), bias]);
      }
      // 敌对司令部：平时排在后面；有步兵正在去斩首时，其余部队跟过去掩护
      // 兵力碾压时（ai.crush）全军直扑主攻对象的司令部，别在外围磨蹭
      // 缺第二种资源时，侦察车和摩托兵专门去捡碎片堆（别的陆上单位只是顺路捡）
      if (ctx.oreOn && ctx.shards.length && (u.type === 'rec' || u.type === 'bik') && oreHave(s, p) < A.oreWant) for (const k of ctx.shards) if (full.dist[k] < INF) goals.push([k, full.dist[k], -1 - C.shardLeft(s, k % w, (k - k % w) / w) / 2]); // 份数多的先去
      if (ctx.goal) for (const k in ctx.goal) { const o = m.owner[(k - k % w) / w][k % w]; if (o !== p && teamOf(s, o) !== teamOf(s, p)) goals.push([+k, full.dist[+k], -1]); } // 战役的目标建筑：当成敌方司令部那样去抢
      for (const q of C.enemiesOf(s, p)) if (ctx.hq[q] >= 0) goals.push([ctx.hq[q], full.dist[ctx.hq[q]], (decapOn(ctx.hq[q]) ? -1 : ai.crush && (q === ai.focus || !ai.focus) ? 0 : 4 - (ruleOf(s, q).stealth ? A.stealthHq : 0)) + fb[q]]);
      // 对手会潜行：去它建筑周围、它的兵消失的地方贴着林子搜（侦察车、喷火兵、步兵优先；新手不会）
      if (ctx.stealthFoe && !easy && U.range && !indirect) {
        const pref = u.type === 'rec' || U.reveal || U.cap ? 0 : 3;
        for (const i of searchCells(s, ctx)) goals.push([i, adjDist(i % w, (i - i % w) / w), A.searchBias + pref + (ai.claims['s' + i] || 0) * 6]);
      }
      // 迷雾清剿：知道位置的敌人没几个了，分头去看没照到的敌方建筑和空地
      if (ctx.fog && !easy && enemies.length <= A.sweepMax) {
        for (const pr of ctx.props) if (!ctx.vis[pr.i] && pr.owner && C.isEnemy(s, p, pr.owner)) goals.push([pr.i, full.dist[pr.i], 1 + (ai.claims['s' + pr.i] || 0) * 6]);
        for (let y = 1; y < h; y += 3) for (let x = 1 + (u.id + s.day) % 3; x < w; x += 3) {
          const i = y * w + x;
          if (!ctx.vis[i] && full.dist[i] < INF) goals.push([i, full.dist[i], 3 + (ai.claims['s' + i] || 0) * 6]);
        }
      }
    };
    const raider = A.hardRaid && ai.ahead && U.cap && u.id % 2 === 0;
    const onRepair = repairSpot(s, u, u.x, u.y);
    const hurt = !U.cap && U.range && (C.dispHp(u) <= A.retreatHp || (onRepair && u.hp < (U.air || U.ship ? 60 : 80)));
    let retreat = false;
    const plan = A.hardPlan && U.cap ? capPlan(s, ctx, ai) : null;
    if (u.type === 'rep' || u.type === 'mdc') { // 维修车跟着车辆，医护兵跟着步兵类；优先去受伤的旁边
      const med = u.type === 'mdc';
      for (const f of ctx.mine) if (f !== u && f.type !== u.type && C.isInfantry(f) === med) goals.push([f.y * w + f.x, adjDist(f.x, f.y), f.hp < 100 ? -6 : -D.UNITS[f.type].cost * MS / 5000]);
      if (!goals.length && myHq >= 0) goals.push([myHq, adjDist(myHq % w, (myHq - myHq % w) / w), 0]);
    } else if (!U.range) {
      if (myHq >= 0) goals.push([myHq, adjDist(myHq % w, (myHq - myHq % w) / w), 0]);
    } else if (hurt) {
      for (const pr of ctx.props) {
        if (pr.owner !== p || !repairSpot(s, u, pr.x, pr.y) || !freeFor(pr.i)) continue;
        goals.push([pr.i, full.dist[pr.i], 0]);
      }
      if (goals.some(g => g[1] < INF)) retreat = true; else { goals.length = 0; enemyGoals(); }
    } else if (U.cap) {
      const weak = easy ? null : hqWeak(s, ctx);
      for (const pr of ctx.props) {
        // 自己的、队友的建筑不占
        if (pr.owner === p || (pr.owner && !C.isEnemy(s, p, pr.owner))) continue;
        const o = occ[pr.i];
        if (o && o !== u && !C.isEnemy(s, p, o.owner)) continue; // 自己人或队友已经站在上面
        const i = pr.i;
        let bias = (ai.claims[i] || 0) * 6;
        if (pr.t === 'hq') {
          bias = (ai.claims[i] || 0) * 1 + 2;
          // 斩首：司令部守得松、两三回合内走得到，就直奔司令部（摩托兵优先）
          if (weak && weak[i] && full.dist[i] <= mp * A.decapTurns) bias = (ai.claims[i] || 0) * 2 - A.decapW - (u.type === 'bik' ? 2 : 0);
          else if (ai.crush && (pr.owner === ai.focus || !ai.focus)) bias = (ai.claims[i] || 0) * 2 - 4; // 碾压局：步兵跟着大部队去拿司令部
        }
        if (pr.t === 'factory' || pr.t === 'airport') bias -= 1.5;
        if (pr.t === 'mine') bias -= 2.5; // 矿场收入翻倍，优先抢
        if (u.type === 'mech') bias += 1;
        if (pr.owner) bias += fb[pr.owner] * 0.5;
        if (raider && pr.owner && pr.t !== 'hq') bias -= 5; // 高手占优时：一半的步兵专门去偷对面后方的建筑
        if (plan && pr.t !== 'hq') { if (plan[u.id] === i) bias -= A.planW; }
        goals.push([i, full.dist[i], bias]);
      }
      // 导弹井：现在发射划得来，就把没人站的未发射导弹井也当目标
      if (ctx.silos.length && ctxSilo(ctx).score >= (raider ? SILO_MIN / 2 : SILO_MIN)) for (const i of ctx.silos) {
        if (!freeFor(i)) continue;
        goals.push([i, full.dist[i], 1]);
      }
      if (u.type === 'mech' || !goals.some(g => g[1] < INF)) enemyGoals();
    } else enemyGoals();
    // 迷雾：侦察车顺路去看看还没照到的建筑（敌人多半在那儿）
    if (ctx.fog && u.type === 'rec' && !retreat) for (const pr of ctx.props) {
      if (!ctx.vis[pr.i] && (pr.owner === 0 || C.isEnemy(s, p, pr.owner))) goals.push([pr.i, full.dist[pr.i], 3]);
    }

    let goal = -1, gbest = INF;
    for (const [i, d, bias] of goals) { if (d < INF && d + bias < gbest) { gbest = d + bias; goal = i; } }
    if (goal >= 0) {
      const gt = m.t[(goal - goal % w) / w][goal % w];
      if (U.cap && D.TERRAIN[gt].prop) {
        ai.claims[goal] = (ai.claims[goal] || 0) + 1;
        if (gt === 'hq' && goal !== myHq && !easy && hqWeak(s, ctx)[goal]) decap[goal] = s.day; // 记下来：其余部队这两天往这座司令部靠
      } else if (ctx.fog && (!U.cap || !D.TERRAIN[gt].prop)) ai.claims['s' + goal] = (ai.claims['s' + goal] || 0) + 1; // 清剿：别都去搜同一处
    }
    // 高手：目标太远（或者走不到）而附近有空座的运输单位，就上车；这回合够不着就先往车那边走
    if (rideOn && U.cap && !retreat && m.cap[u.y][u.x] === 20 && (goal < 0 || full.dist[goal] >= A.rideMin) &&
      ctx.props.some(pr => (pr.owner === 0 || C.isEnemy(s, p, pr.owner)) && !occ[pr.i] && full.dist[pr.i] >= A.rideMin) &&
      ctx.mine.filter(f => D.UNITS[f.type].cap).length >= 3) { // 前线至少留两个能占领的，多出来的才去坐车
      let far = null;
      for (const tr of ctx.mine) {
        const ti = tr.y * w + tr.x;
        if (tr === u || tr.cargo.length || !D.UNITS[tr.type].carry || !C.canLoad(s, u, tr)) continue; // 一趟只送一个
        if (!tr.moved && r.dist[ti] < INF) return { type: 'unit', u, x: tr.x, y: tr.y, act: 'load', target: tr, path: C.path(r.prev, ti, w) };
        if (goal < 0 && full.dist[ti] < INF && (!far || full.dist[ti] < full.dist[far])) far = ti;
      }
      if (far != null) goal = far;
    }
    const prey = goal < 0 && U.range ? enemies.filter(e => D.DMG[u.type][e.type] >= 25) : [];
    const shootable = indirect || lob ? enemies.filter(e => D.DMG[u.type][e.type] != null && !e.ghost) : [];
    const stop = indirect ? rgNow[1] - 1 : U.carry ? 2 : 0; // 空的运输单位在司令部旁边等人，不压在司令部上

    // 站在某格下回合大概要挨多少打：敌对单位的威胁范围叠成一张图
    const hits = new Float32Array(n);
    if (!easy) for (const z of aiThreats(s, ctx)) { // 新手不看威胁图
      const e = z.e, b = D.DMG[e.type][u.type];
      if (!b || e.hp <= 0 || (!e.ghost && occ[e.y * w + e.x] !== e)) continue; // 打不了我的、已经不在场上的不算
      const v = b * C.dispHp(e) / 10 * (1 + modOf(s, e.owner, e.type).atk), cells = z.cells;
      for (let k = 0; k < cells.length; k++) hits[cells[k]] += v;
    }
    const dangerAt = (i, tdef) => {
      let sum = hits[i];
      if (!sum) return 0;
      sum *= 1 - 0.1 * tdef * C.dispHp(u) / 10;
      return Math.min(u.hp, sum) / 100 * U.cost * MS;
    };
    // 从目标反推的距离图：同一回合里同一类移动方式、同一个目标只算一次。
    // 高手压上去时，三分之一的地面近战部队把敌人火力范围算成难走的路，绕开正面从侧路过去
    let gd = null;
    if (goal >= 0) {
      const flank = A.hardFlank && ai.push && !U.cap && !U.air && !U.ship && !indirect && U.range && u.id % 3 === 0;
      if (flank) {
        const extra = new Float32Array(n);
        for (let i = 0; i < n; i++) if (hits[i] > 0) extra[i] = 2;
        gd = dijkstra(s, u, true, true, goal % w, (goal - goal % w) / w, extra).dist;
      } else {
        const key = moveClass(U) + ':' + goal;
        gd = ai.gd[key] || (ai.gd[key] = C.reach(s, u, true, true, goal % w, (goal - goal % w) / w).dist);
      }
    }
    const pushing = ai.push || s.powerOn[p];
    const melee0 = !!U.range && !indirect && !lob;
    let dW = retreat ? A.dangerRetreat : (indirect || !U.range) ? A.dangerInd : U.cap ? A.dangerCap : pushing ? A.dangerFight : A.dangerHold;
    if (u.fired) dW = A.dangerRetreat; // 打完还能动：往敌人打不到的地方撤
    if (soft && lob) dW = Math.max(dW, A.dangerSoft); // 投弹手金贵又不经打，隔着扔就行；喷火兵得贴上去，照常冲
    if (A.hardCons && !pushing) dW *= 1.4; // 高手：没把握时站位更小心
    const tW = 20 + (soft ? (melee0 ? A.softCover / 2 : A.softCover) : 0) + (!pushing && !U.cap && U.range ? A.holdCover : 0); // 每颗地形防御星值多少分
    const melee = U.range && rgNow[0] === 1 && rgNow[1] === 1 && !lob, dmgRow = D.DMG[u.type];
    // (x,y) 四邻里的敌对单位
    const foesNear = (x, y, out) => {
      out.length = 0;
      let o;
      if (x > 0 && (o = occ[y * w + x - 1]) && o !== u && C.isEnemy(s, p, o.owner)) out.push(o);
      if (x < w - 1 && (o = occ[y * w + x + 1]) && o !== u && C.isEnemy(s, p, o.owner)) out.push(o);
      if (y > 0 && (o = occ[y * w + x - w]) && o !== u && C.isEnemy(s, p, o.owner)) out.push(o);
      if (y < h - 1 && (o = occ[y * w + x + w]) && o !== u && C.isEnemy(s, p, o.owner)) out.push(o);
      return out;
    };
    const canHitFrom = (x, y) => { // 抛射单位：站这儿有没有打得到的
      for (const e of shootable) { const d = Math.abs(e.x - x) + Math.abs(e.y - y); if (d >= 1 && d <= rgNow[1] + 1) return true; }
      return false;
    };
    const emptyLander = !!U.carry && !!U.ship && !u.cargo.length;
    const stealthy = !!ruleOf(s, p).stealth;

    // 第一遍：所有能停的格子算个粗分（靠近目标、地形、危险、有没有事可做），多了就只留前 N 个
    const near = [];
    let cands = [];
    for (let i = 0; i < n; i++) {
      if (r.dist[i] === INF || !freeFor(i)) continue;
      const x = i % w, y = (i - x) / w;
      if (u.home && Math.abs(x - u.home[0]) + Math.abs(y - u.home[1]) > 4 && !(x === ox && y === oy)) continue; // 只守不攻（rules.aiStance = 'defend'）：不离开开局位置 4 格
      const terr = m.t[y][x], T = D.TERRAIN[terr], tdef = U.air ? 0 : T.def;
      let app = 0; // 靠近目标
      if (gd) app = gd[i] === INF ? -50000 : -Math.max(0, gd[i] - stop) * (u.fired ? 30 : 120);
      else if (prey.length) { // 走不到目标（比如船打岸上）：尽量靠近能打的敌人
        let md = INF;
        for (const e of prey) md = Math.min(md, Math.abs(e.x - x) + Math.abs(e.y - y));
        app = -Math.max(0, md - (indirect ? rgNow[1] - 1 : 1)) * 100;
      }
      const dng = dangerAt(i, tdef);
      let quick = app + tdef * tW - dng * dW;
      if (x === ox && y === oy) quick += 1e7; // 原地永远保留
      else if (melee && foesNear(x, y, near).some(e => dmgRow[e.type] != null)) quick += 4000;
      else if (lob && canHitFrom(x, y)) quick += 4000;
      if (U.cap && (terr === 'silo' || (T.prop && m.owner[y][x] !== p && (m.owner[y][x] === 0 || C.isEnemy(s, p, m.owner[y][x]))))) quick += 6000;
      if (terr === 'shard' && !U.air && ctx.oreOn) quick += 3000; // 碎块所在的格子别在粗筛里被刷掉
      cands.push({ i, x, y, terr, T, tdef, app, dng, quick });
    }
    if (cands.length > A.maxCand) { cands.sort((a, b) => b.quick - a.quick); cands = cands.slice(0, A.maxCand); }

    let best = null;
    const noise = easy ? 500 : A.noise; // 新手的判断带很大的随机
    const consider = c => { c.score += C.rand() * noise; if (!best || c.score > best.score) best = c; };
    for (const c of cands) {
      const { i, x, y, terr, T, tdef, app, dng } = c;
      const moved = !(x === ox && y === oy);
      let pos = app + tdef * tW;
      pos -= dng * dW;
      const po = m.owner[y][x], own = po === p, ally = po > 0 && !own && !C.isEnemy(s, p, po);
      const prod = terr === 'factory' || terr === 'airport' || terr === 'port';
      if (stealthy && HIDE[terr] && !U.air) pos += A.hideW;
      if (terr === 'shard' && !U.air && ctx.oreOn) pos += A.shardW * C.shardLeft(s, x, y) / 2; // 顺路把碎块捡了（按这一堆的实际份数，2 份算一倍）
      if (U.range && ctx.tower[p] && auraAtk(s, { owner: p, x, y }) > 0) pos += A.auraW; // 己方雷达塔的范围里：攻击有加成，略偏好 // 潜行指挥官：往树林、废墟里钻
      if (emptyLander) pos += terr === 'beach' ? 800 : terr === 'port' ? 300 : 0; // 空登陆艇靠在沙滩或港口等人上船
      else if (prod && own && !(retreat && repairSpot(s, u, x, y))) pos -= 1500; // 别堵自家兵工厂
      if (prod && ally) pos -= 1500; // 也别堵队友的
      if (prod && !own && !ally && po && !U.cap && !indirect && U.range) pos += 250; // 堵对面的
      if (T.prop && !own && !ally && !U.cap && !prod) pos -= terr === 'hq' ? 400 : 120; // 把位置留给能占领的
      if (indirect) { // 远程：下回合站这儿有东西可打（射程按站在这一格算）
        const rg = rangeAt(x, y);
        let shot = 0;
        for (const e of shootable) {
          const d = Math.abs(e.x - x) + Math.abs(e.y - y);
          if (d >= rg[0] && d <= rg[1]) shot = Math.max(shot, dmgRow[e.type] / 100 * D.UNITS[e.type].cost * MS);
        }
        pos += Math.min(shot, 8000) * 0.2;
      }
      if (ctx.fog && indirect && moved && !ctx.vis[i]) pos -= 400; // 迷雾：远程单位不往看不见的地方瞎走
      foesNear(x, y, near);
      if (indirect || !U.range) {
        for (const e of near) if (D.DMG[e.type][u.type] != null) pos -= 400;
      }
      // 高手：不打人就别停在敌人的火力范围里——等对面走进来，先手归我
      // 喷火兵：没东西可烧时不在敌人的火力范围里干站着
      consider({ score: pos - (A.waitDng && U.range && !U.cap && !retreat ? dng * A.waitDng : 0) - (soft && melee0 ? dng * A.dangerSoft : 0), x, y, act: 'wait', i });
      u.x = x; u.y = y;
      if (C.canCapture(s, u)) {
        const cp = C.capPower(s, u);
        let sc = 6000 + (terr === 'hq' ? 30000 : 0) + (20 - m.cap[y][x]) * 200;
        if (m.cap[y][x] - cp <= 0) sc += 5000;
        consider({ score: sc, x, y, act: 'capture', i });
      }
      if (C.canLaunch(s, u)) { // 站在导弹井上：净赚够多就发射
        const bt = ctxSilo(ctx);
        if (bt.score >= SILO_MIN) consider({ score: 7000 + bt.score * MS, x, y, act: 'silo', cx: bt.x, cy: bt.y, i });
      }
      // 能打谁只从快照里找（迷雾下快照里只有看得见的敌人；不调 C.targets，免得按“假如站到那儿”的视野算）
      let tg = [];
      if (U.range && !u.fired) {
        if (melee) tg = near.filter(e => dmgRow[e.type] != null);
        else if (!moved || lob) {
          const rg = C.rangeOf(s, u);
          tg = shootable.filter(e => {
            const d = Math.abs(e.x - x) + Math.abs(e.y - y);
            if (d < rg[0] || d > rg[1]) return false;
            // 迷雾：隐蔽的目标得贴身才看得见。隔着扔之前，确认除了自己还有别的友军贴着它
            if (ctx.fog && d > 1 && moved && (e.type === 'sub' || (!D.UNITS[e.type].air && HIDE[m.t[e.y][e.x]]))) {
              let ok = false;
              for (const [dx, dy] of DIRS) { const xx = e.x + dx, yy = e.y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const o = occ[yy * w + xx]; if (o && o !== u && !C.isEnemy(s, p, o.owner)) ok = true; }
              if (!ok) return false;
            }
            return true;
          });
        }
      }
      for (const t of tg) {
        const f = C.forecast(s, u, t);
        if (f.dmg <= 0) continue;
        const kill = f.dmg >= t.hp, tc = D.UNITS[t.type].cost * MS * (t.tag ? 4 : 1) * (t.ore ? A.oreWorth : 1); // 战役里带标记的单位：按四倍身价算
        if (soft && melee0 && dmgRow[t.type] < 40 && !kill && m.cap[t.y][t.x] === 20) continue; // 喷火兵只烧步兵和软皮，不拿脸去蹭坦克
        const trade = f.dmg / 100 * tc - f.counter / 100 * U.cost * MS * 0.8;
        const capping = m.cap[t.y][t.x] < 20;
        const ti = t.y * w + t.x;
        const atHq = capping && ti === myHq;
        const inCombo = ai.combo && ai.combo[t.id] && ai.combo[t.id][u.id]; // 这回合凑得出击杀的目标
        if (trade < -300 && !kill && !atHq && !(inCombo && trade > -A.comboLoss)) continue;
        let sc = 800 + trade + (kill ? tc * A.killBonus + 500 : 0) + app * 0.2 + tdef * tW - dng * dW * 0.6;
        if (!easy) sc += (100 - t.hp) / 100 * tc * A.focusKill; // 集中火力：优先打已经受伤的（新手不会）
        sc -= fb[t.owner] * 60; // 多个敌对阵营：同样的买卖，先打更该打的那家
        if (capping) sc += 2500 + (20 - m.cap[t.y][t.x]) * 150 + (atHq ? 20000 : 0);
        if (inCombo) sc += tc * A.comboW;
        if (decapOn(ti)) sc += 3000; // 斩首掩护：先清掉压在敌方司令部上的
        consider({ score: sc, x, y, act: 'attack', target: t, i });
      }
      u.x = ox; u.y = oy;
    }
    return { type: 'unit', u, x: best.x, y: best.y, act: best.act, target: best.target, cx: best.cx, cy: best.cy, path: C.path(r.prev, best.i, w), score: best.score };
  }

  // 高手的运输单位（车 / 飞机 / 登陆艇里有人）：挑一座步兵自己走不到或要走很久的建筑，开到能把人卸在它上面或它附近的地方；够不着就先往那边开。
  // 先挑中立建筑；一座都没有时（比如群岛图上双方隔海对峙）才送去敌人的建筑和司令部
  function aiCarry(s, u, ctx, r, full) {
    const p = u.owner, m = s.map, w = m.w, h = m.h, n = w * h, ai = aiMemo(s), occ = ctx.occ, c = u.cargo[0];
    const here = { type: 'unit', u, x: u.x, y: u.y, act: 'wait', path: [[u.x, u.y]] };
    const nb = i => { const x = i % w, y = (i - x) / w, o = []; if (x > 0) o.push(i - 1); if (x < w - 1) o.push(i + 1); if (y > 0) o.push(i - w); if (y < h - 1) o.push(i + w); return o; };
    const free = i => !occ[i] || occ[i] === u;
    const ct = costTable(c.type), tAt = i => m.t[(i - i % w) / w][i % w];
    // 运输单位没有武器：路上不停在敌人的火力范围里；卸人的位置在火力范围里要扣分
    const foot = dijkstra(s, { type: c.type, owner: p, x: u.x, y: u.y }, true, true, null, null, null).dist;
    const hot = new Uint8Array(n);
    for (const z of aiThreats(s, ctx)) for (let k = 0; k < z.cells.length; k++) hot[z.cells[k]] = 1;
    const pool = [];
    for (const pr of ctx.props) {
      if (!(pr.owner === 0 || C.isEnemy(s, p, pr.owner)) || !ct[pr.t]) continue;
      const o = occ[pr.i];
      if (o && !C.isEnemy(s, p, o.owner)) continue;
      if (foot[pr.i] < A.rideMin) continue; // 近处的让步兵自己走
      const d = Math.abs(pr.x - u.x) + Math.abs(pr.y - u.y) + (ai.claims[pr.i] || 0) * 8 + (pr.owner ? 40 - (pr.t === 'hq' ? 6 : 0) : hot[pr.i] ? 12 : 0) -
        (pr.t === 'mine' ? 2.5 : pr.t === 'factory' || pr.t === 'airport' ? 1.5 : 0);
      pool.push([d, pr]);
    }
    pool.sort((a, b) => a[0] - b[0]);
    const mp = C.movePts(s, u), cm = D.UNITS[c.type].move;
    let best = null;
    for (const [d0, pr] of pool.slice(0, 4)) {
      const fd = dijkstra(s, { type: c.type, owner: p, x: pr.x, y: pr.y }, true, true, null, null, null).dist; // 从建筑反推的步行距离
      for (let j = 0; j < n; j++) {
        if (full.dist[j] === INF || !free(j) || (hot[j] && !pr.owner)) continue;
        const tj = tAt(j);
        if (m.owner[(j - j % w) / w][j % w] === p && (tj === 'factory' || tj === 'airport') && j !== u.y * w + u.x) continue;
        for (const k of nb(j)) {
          if (!ct[tAt(k)] || occ[k] || fd[k] === INF) continue;
          const cost = Math.ceil(full.dist[j] / mp) + fd[k] / cm + (hot[k] ? 1.5 : 0) + (hot[j] ? 2 : 0) + (d0 - Math.abs(pr.x - u.x) - Math.abs(pr.y - u.y)) / 8;
          if (!best || cost < best.cost) best = { cost, j, k, pr };
        }
      }
    }
    if (!best) { // 没有值得送的地方了：就地把人放下
      const sp = C.unloadSpots(s, u, 0).filter(([x, y]) => !occ[y * w + x]);
      return sp.length ? { type: 'unit', u, x: u.x, y: u.y, act: 'unload', cargo: 0, ux: sp[0][0], uy: sp[0][1], path: [[u.x, u.y]] } : here;
    }
    ai.claims[best.pr.i] = (ai.claims[best.pr.i] || 0) + 1;
    const j = best.j, jx = j % w, jy = (j - jx) / w;
    if (r.dist[j] < INF) return { type: 'unit', u, x: jx, y: jy, act: 'unload', cargo: 0, ux: best.k % w, uy: (best.k - best.k % w) / w, path: C.path(r.prev, j, w) };
    const gd = dijkstra(s, u, true, true, jx, jy, null).dist;
    let bi = -1, bd = gd[u.y * w + u.x] + 0.5; // 至少得比原地更近
    for (let i = 0; i < n; i++) {
      if (r.dist[i] === INF || !free(i) || gd[i] >= bd || (hot[i] && i !== u.y * w + u.x)) continue;
      const t = tAt(i);
      if (m.owner[(i - i % w) / w][i % w] === p && (t === 'factory' || t === 'airport' || t === 'port')) continue;
      bd = gd[i]; bi = i;
    }
    if (bi < 0) return here;
    return { type: 'unit', u, x: bi % w, y: (bi - bi % w) / w, act: 'wait', path: C.path(r.prev, bi, w) };
  }

  const PRIOR = ['inf', 'inf', 'inf', 'mech', 'bik', 'tnk', 'art', 'aa', 'med'];
  function aiBuild(s, ctx) {
    const p = s.turn, m = s.map, w = m.w, E = effTable(), occ = ctx.occ, easy = ctx.lvl === 'easy';
    const my = ctx.mine, en = ctx.foes;
    const cnt = {};
    for (const u of my) cnt[u.type] = (cnt[u.type] || 0) + 1;
    const foot = my.filter(u => D.UNITS[u.type].cap).length;
    const costOf = k => C.costOf(s, p, k);
    let need = 0;
    const sites = [], cityBuild = !!ruleOf(s, p).cityBuild; // 集市：己方城市也能出步兵类
    for (const pr of ctx.props) {
      if (pr.owner === 0 || C.isEnemy(s, p, pr.owner)) need++; // 还能去占的建筑（队友的不算）
      // 自家工厂上有没有东西按实际情况查：被（看不见的）单位占着就造不出来，这一点玩家自己点一下也会知道
      if (pr.owner === p && (pr.t === 'factory' || pr.t === 'airport' || pr.t === 'port' || (pr.t === 'city' && cityBuild)) && !(ctx.fog ? C.unitAt(s, pr.x, pr.y) : occ[pr.i]) && C.buildLeft(s, pr.x, pr.y) > 0) sites.push([pr.x, pr.y]);
    }
    if (!sites.length) return null;
    let footWant = Math.min(A.footMax, 2 + Math.floor(need / 2));
    if (s.day > 12) footWant = Math.min(footWant, A.footLate);
    const focus = aiMemo(s).focus;
    const [mv, ev] = teamValues(s, p, ctx.val, focus);
    const winning = mv >= ev * 1.6 && s.day > 8;
    if (winning) footWant = Math.max(footWant, 4); // 占了上风：多带几个能占领的去拿司令部
    const enemyArmor = en.some(e => !D.UNITS[e.type].cap && !D.UNITS[e.type].air && !D.UNITS[e.type].ship);
    // 离最近的敌对司令部近的工厂优先出兵
    const foeHqs = C.enemiesOf(s, p).map(q => ctx.hq[q]).filter(i => i >= 0).map(i => [i % w, (i - i % w) / w]);
    const front = ([x, y]) => { let b = foeHqs.length ? INF : 0; for (const [ex, ey] of foeHqs) b = Math.min(b, Math.abs(x - ex) + Math.abs(y - ey)); return b; };
    sites.sort((a, b) => front(a) - front(b));
    const funds = s.funds[p], income = ctx.income[p];

    // 对手的兵种配置（按资金算），外加一份“常见部队”垫底，免得只盯着眼前几个兵
    const sd = seaDist(m);
    const foes = [];
    let enCover = 0, coverNear = INF; // 躲在 2 星及以上地形里的敌对步兵类：有几个、离我最近的兵工厂多远
    for (const e of en) {
      foes.push([e.type, 1, sd[e.y * w + e.x]]);
      if (C.isInfantry(e) && D.TERRAIN[m.t[e.y][e.x]].def >= 2) {
        enCover++;
        for (const [x, y] of sites) if (m.t[y][x] === 'factory') coverNear = Math.min(coverNear, Math.abs(e.x - x) + Math.abs(e.y - y));
      }
    }
    const pw = A.priorW * Math.max(4, en.length) / PRIOR.length;
    for (const k of PRIOR) foes.push([k, pw, 99]);
    let wsum = 0;
    for (const f of foes) wsum += f[1];
    const myShips = my.filter(u => D.UNITS[u.type].ship), enShips = en.filter(u => D.UNITS[u.type].ship);
    const shipVal = us => us.reduce((a, u) => a + D.UNITS[u.type].cost, 0);
    const myVal = my.reduce((a, u) => a + D.UNITS[u.type].cost, 0);
    const myShipVal = shipVal(myShips), enShipVal = shipVal(enShips);
    const indN = my.filter(u => isInd(D.UNITS[u.type])).length;
    const frontN = my.filter(u => { const U = D.UNITS[u.type]; return U.range && !isInd(U) && !U.cap; }).length;
    const softN = (cnt.grn || 0) + (cnt.flm || 0) + (cnt.snp || 0);
    const enAir = en.filter(e => D.UNITS[e.type].air).length;
    const enInd = en.filter(e => isInd(D.UNITS[e.type]) && D.UNITS[e.type].range[1] < 5).length;
    const enHeavy = en.filter(e => e.type === 'med' || e.type === 'hvy').length;
    const mem = aiMemo(s).mem[p], style = A.styleOn ? mem.style : STYLES[0];
    const myAA = (cnt.aa || 0) + (cnt.sam || 0) + (cnt.ftr || 0) + (cnt.dst || 0);
    // 敌对部队按兵种合并，评分时每个兵种只算一次
    const foeAgg = {};
    for (const [t, wt, dsea] of foes) { const k = t + '|' + dsea; if (foeAgg[k]) foeAgg[k][1] += wt; else foeAgg[k] = [t, wt, dsea]; }
    const foeList = Object.values(foeAgg);
    // 指挥官：自己的常驻加成算进打分；对手的按主攻对象（没有就取第一个敌对阵营）的指挥官算
    const foeP = focus || C.enemiesOf(s, p)[0] || 0;
    const myCo = rulesOf(s).coPassives === false ? null : COBY[s.co[p]], spec = myCo && myCo.group === '专精'; // 只有专精型按擅长 / 不擅长调整造兵
    const coGood = spec && myCo.good, coBad = spec && myCo.bad;

    // 钱多得花不完时（工厂一回合只出一个兵），少看性价比、多看单位本身强不强
    const rich = funds / Math.max(1, sites.length * A.richPer);
    const alpha = A.alpha * (rich > 1 ? Math.max(A.richMin, 1 / rich) : 1);
    const score = k => {
      const K = D.UNITS[k];
      const mk = modOf(s, p, k), kc = costOf(k);
      // 能占领的兵种平时不参加打分（另有补步兵的逻辑）；指挥官给它加了两成以上攻击时，破甲兵、摩托兵也当战斗单位造
      if (NOBUILD[k] || !K.range || (K.cap && (k === 'inf' || mk.atk < 0.2))) return 0;
      let sum = 0;
      for (const [t, wt, dsea] of foeList) {
        const mt = foeP ? modOf(s, foeP, t) : NOMOD;
        let gain = E[k][t] * (1 + mk.atk - mt.def), loss = E[t][k] * (1 + mt.atk - mk.def);
        if (K.ship && !D.UNITS[t].ship && !D.UNITS[t].air) { // 船打岸上：只算离海近的
          const reachSea = isInd(K) ? K.range[1] - 2 : 1;
          gain = dsea <= reachSea ? gain * 0.6 : 0;
        }
        if (!K.ship && D.UNITS[t].ship) gain *= isInd(K) || K.air ? 0.6 : 0.15; // 陆军基本够不着船
        if (K.ship && !D.UNITS[t].ship && !D.UNITS[t].air) loss *= 0.3;
        if (isInd(K) && isInd(D.UNITS[t])) { // 远程对远程：射程长的先开火
          if (K.range[1] > D.UNITS[t].range[1]) loss *= 0.3; else if (K.range[1] < D.UNITS[t].range[1]) gain *= 0.5;
        }
        if (isInd(K)) loss *= A.indLoss; // 远程躲在后面，挨打少
        gain *= Math.pow(100 / D.UNITS[t].cost, A.foeExp); // 便宜的兵人多、还能占领，杀它们比账面值钱
        sum += wt * (Math.max(gain, -K.cost * A.gainFloor) - A.counterW * Math.max(0, loss));
      }
      let sc = sum / wsum / Math.pow(kc, alpha);
      if (sc <= 0) return 0;
      sc /= 1 + A.dup * (cnt[k] || 0);
      sc *= style[k] || 1;
      if (myCo && myCo.ai && myCo.ai.w && myCo.ai.w[k]) sc *= myCo.ai.w[k]; // 指挥官给电脑的造兵提示：这个兵种的权重
      else if (coGood && coGood.includes(k)) sc *= (myCo.ai && myCo.ai.goodW) || A.goodW; else if (coBad && coBad.includes(k)) sc *= A.badW; // 指挥官擅长的兵种多造、不擅长的少造
      if (isInd(K) && k !== 'sam') {
        if ((indN + 1) * A.indShare > my.length + 1 && !(coGood && coGood.includes(k))) sc *= 0.4; // 远程别太多（指挥官专精的远程兵种不受这条限制）
        if (indN >= frontN + 1) sc *= 0.5; // 前面得有人顶着
      }
      if (K.cover != null) { // 投弹手、喷火兵：对面躲在掩体里的步兵越多越值；这类兵别超过全军的四分之一
        sc *= A.coverUnitBase + A.coverUnitW * Math.min(4, enCover);
        if ((softN + 1) * 4 > my.length + 1) sc *= 0.4;
        if (!K.lob && !(myCo && myCo.ai && myCo.ai.w && myCo.ai.w[k])) sc *= coverNear > A.flmNear ? 0.5 : 1.6; // 喷火兵走得慢：掩体里的敌人离兵工厂近才值得造，远了多半走不到
      }
      if (k === 'rkt' && (enInd >= 2 || enHeavy >= 2)) sc *= 1.6; // 对面火炮多或重甲多：用射程压它
      if (enAir && myAA * 2 < enAir && (k === 'aa' || k === 'sam' || k === 'ftr' || k === 'dst')) sc *= 1.5;
      if (K.ship) { // 船再强也占不了建筑：数量和总价都封顶（海军指挥官靠加成后的打分自然多造一些，上限不放宽）
        if (myShips.length >= enShips.length + 2) sc *= 0.25;
        if (myShipVal + kc > Math.max(enShipVal * 1.3 + 2400, myVal * 0.3)) sc *= 0.4;
      }
      return sc * (easy ? 0.2 + C.rand() * 1.6 : A.buildLo + C.rand() * (A.buildHi - A.buildLo)); // 新手造兵随意得多
    };

    // 先看要不要补步兵
    const fac = sites.filter(([x, y]) => m.t[y][x] === 'factory' || m.t[y][x] === 'city');
    const cInf = costOf('inf'), cBik = costOf('bik'), cMech = costOf('mech');
    const darkP = facOf(s, p) === 5 && fac.length > 0 && C.buildList(s, fac[0][0], fac[0][1]).includes('bgd');
    const pickFoot = () => {
      const rr = C.rand();
      if (darkP && funds >= costOf('bgd') && rr < A.eliteFoot) return 'bgd'; // 黑潮：一部分步兵换成黑甲兵
      if (winning && funds >= cBik) return 'bik';
      return (enemyArmor && funds >= cMech && rr < 0.25) ? 'mech' : (funds >= cBik && rr > 0.7) ? 'bik' : 'inf';
    };
    if (fac.length && foot < Math.min(2, footWant) && funds >= cInf) return { type: 'build', x: fac[0][0], y: fac[0][1], unit: pickFoot() };
    // 高手：运输单位只在明显划算时造一个——有 A.rideCut 座以上的中立建筑步兵走不到；或者敌人的司令部走不到、僵持到了第 A.rideDay 天。
    // 有机场造运输直升机，没有机场有港口就造登陆艇；运兵车不造（陆路走得到的地方，坐车省不下几回合）
    const hq0 = ctx.hq[p];
    if ((A.hardRide || (A.islandRide && !easy)) && !cnt.apc && !cnt.tcp && !cnt.lnd && foot >= 2 && s.day >= A.rideFrom && hq0 >= 0) {
      const memo = aiMemo(s);
      const fd = memo.gd.footHQ || (memo.gd.footHQ = dijkstra(s, { type: 'inf', owner: p, x: hq0 % w, y: (hq0 - hq0 % w) / w }, true, true, null, null, null).dist);
      let cut = 0, cutHq = 0;
      for (const pr of ctx.props) {
        if (fd[pr.i] !== INF) continue;
        if (pr.owner === 0) cut++; else if (pr.t === 'hq' && C.isEnemy(s, p, pr.owner)) cutHq++;
      }
      if ((A.hardRide && cut >= A.rideCut) || (cutHq && cutHq === foeHqs.length && s.day >= A.rideDay)) {
        const air = sites.find(([x, y]) => m.t[y][x] === 'airport'), port = sites.find(([x, y]) => m.t[y][x] === 'port');
        if (air && funds >= costOf('tcp') + A.rideSpare) return { type: 'build', x: air[0], y: air[1], unit: 'tcp' };
        if (!air && port && cutHq && cutHq === foeHqs.length && funds >= costOf('lnd') + A.rideSpare) return { type: 'build', x: port[0], y: port[1], unit: 'lnd' };
      }
    }

    // 每个空着的工厂/机场/港口挑最合适的兵种，取全场最高分
    let bk = null, bs = 0, bsite = null, dream = 0, dreamCost = 0;
    const seen = {};
    for (const [x, y] of sites) {
      const t = m.t[y][x];
      if (seen[t]) continue;
      seen[t] = 1;
      for (const k of C.buildList(s, x, y)) {
        const kc = costOf(k);
        if (kc > funds + income) continue;
        const sc = score(k) * (D.UNITS[k].faction === 5 || D.UNITS[k].only === 5 ? A.eliteW : 1); // 黑潮的精锐：按每块钱的效率算会吃亏（贵四成），补一点权重
        if (kc > funds) { if (sc > dream) { dream = sc; dreamCost = kc; } continue; }
        if (sc > bs) { bs = sc; bk = k; bsite = [x, y]; }
      }
    }
    // 家门口有没有敌人：直接量到自己司令部的距离（以前按“敌方司令部的镜像”推算，不对称的图上是错的）
    let threatened = false;
    const hq = ctx.hq[p];
    if (hq >= 0) { const hx = hq % w, hy = (hq - hx) / w; for (const e of en) if (Math.abs(e.x - hx) + Math.abs(e.y - hy) <= 6) { threatened = true; break; } }
    const saving = !easy && !threatened && s.day - mem.saved !== 1 && dream > bs * A.saveRatio && funds + income >= dreamCost;
    if (saving) mem.saved = s.day; // 下回合能买到明显更好的，先攒着
    if (bk && !saving) {
      // 强化建造：新手不用。强化的加成只对强化价不高于自己的敌人生效，所以只有主力（强化价不低于 A.oreCore）够就强化；
      // 强化价 2 的有武器兵种要手里比强化价多 A.oreSpare 份；步兵类和没有武器的兵种（医护兵、维修车、运输单位）要多 A.oreIdle 份，基本不强化
      const oc = C.oreOf(s, p, bk), have = oreHave(s, p), K = D.UNITS[bk];
      const strong = !easy && oc > 0 && have >= oc && (K.range && oc >= A.oreCore || have >= oc + (K.range && oc >= 2 ? A.oreSpare : A.oreIdle));
      return strong ? { type: 'build', x: bsite[0], y: bsite[1], unit: bk, ore: true } : { type: 'build', x: bsite[0], y: bsite[1], unit: bk };
    }
    if (fac.length && foot < footWant && funds >= cInf) {
      const k = saving ? 'inf' : pickFoot();
      return { type: 'build', x: fac[0][0], y: fac[0][1], unit: k };
    }
    if (!saving && fac.length && funds >= costOf('mdc') && !cnt.mdc && foot >= 4 && C.rand() < 0.15) return { type: 'build', x: fac[0][0], y: fac[0][1], unit: 'mdc' };
    if (!saving && fac.length && funds >= costOf('rep') && !cnt.rep && my.length - foot >= 4 && C.rand() < 0.3) return { type: 'build', x: fac[0][0], y: fac[0][1], unit: 'rep' };
    return null;
  }

  // ───────── 撤回（防呆）：只有两件事能撤——刚造的兵，和一次没有任何副作用的移动；下一个动作一开始就不能撤了 ─────────
  // C.undoInfo(s) → null 或 { kind: 'build' | 'move', unit, from: [x, y], to: [x, y] }
  C.undoInfo = function (s) {
    const k = UNDO.get(s);
    if (!k || s.winner || !s.units.includes(k.unit) || k.unit.owner !== s.turn) return null;
    return k.kind === 'build' ? { kind: 'build', unit: k.unit, from: [k.x, k.y], to: [k.x, k.y] } : { kind: 'move', unit: k.unit, from: k.from.slice(), to: k.to.slice() };
  };
  C.canUndoBuild = function (s) { const i = C.undoInfo(s); return !!i && i.kind === 'build'; };
  C.canUndoMove = function (s) { const i = C.undoInfo(s); return !!i && i.kind === 'move' && (i.unit.x === i.to[0] && i.unit.y === i.to[1]) && !C.unitAt2(s, i.from[0], i.from[1], i.unit); };
  // 取消刚造的兵：单位消失，资金和第二种资源全额退回，这座建筑本回合的生产次数恢复，单位编号也退回去
  C.undoBuild = function (s) {
    if (!C.canUndoBuild(s)) return false;
    const k = UNDO.get(s), p = s.turn, key = k.y * s.map.w + k.x;
    UNDO.delete(s);
    s.units.splice(s.units.indexOf(k.unit), 1);
    s.funds[p] = k.funds; if (s.ore) s.ore[p] = k.ore;
    if (k.built) s.built[key] = k.built; else if (s.built) delete s.built[key];
    s.nextId = k.nextId;
    visCache.delete(s);
    return true;
  };
  // 撤回刚才那一步移动：单位回到原位、恢复成没行动过，出发格的占领进度等和移动前一致
  C.undoMove = function (s) {
    if (!C.canUndoMove(s)) return false;
    const k = UNDO.get(s), u = k.unit;
    UNDO.delete(s);
    u.x = k.from[0]; u.y = k.from[1];
    for (const f in k.keep) { if (k.keep[f] === undefined) delete u[f]; else u[f] = k.keep[f]; }
    if (k.cap != null) s.map.cap[u.y][u.x] = k.cap;
    visCache.delete(s);
    return true;
  };
  // (x,y) 上除了 skip 以外有没有别的单位
  C.unitAt2 = function (s, x, y, skip) { for (const o of s.units) if (o !== skip && o.x === x && o.y === y) return o; return null; };
  // 下面这些都算“下一个动作”：一调就把可撤回的记录丢掉（造兵和移动会在做完以后记上自己的）
  for (const name of ['moveUnit', 'attack', 'capture', 'load', 'unload', 'join', 'sell', 'launchSilo', 'build', 'research', 'unlockTech', 'setFund', 'usePower', 'endTurn', 'resign', 'ambushShot']) {
    const f = C[name];
    if (typeof f !== 'function') continue;
    C[name] = function (s) { if (s && typeof s === 'object') UNDO.delete(s); return f.apply(this, arguments); };
  }
  // 电脑执行动作时不记可撤回的东西（省掉迷雾下每一步的视野对比）
  { const f = C.aiApply; C.aiApply = function (s, a) { const k = NOUNDO; NOUNDO = true; try { return f.call(this, s, a); } finally { NOUNDO = k; } }; }

  root.AWCore = C;
  if (typeof module !== 'undefined') module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
