// 潮汐战线：对局画面、输入（键盘 / 鼠标 / 触屏 / 手柄）、镜头、动画、音效
// 整个窗口就是游戏画面：地图、单位、范围、特效、小地图画在一张画布上（#cv）。
// 所有面板都是叠在画布上的主机式大号界面：公共部件在 ui-kit.js（AWKit：导航栈、按键提示条、整屏页、图标、单位卡），
// 标题 / 开局流程 / 设置 / 操作说明在 ui-front.js，对局里的阵营牌、信息牌、菜单、造兵、战况、详情卡、胜负在 ui-battle.js，科技树在 ui-tech.js，图鉴在 codex.js。
// 这个文件只管对局流程和画布；要显示什么面板，就把数据交给上面几个模块。
// 地图在“逻辑像素”里画：一格 32 逻辑像素，按 sc = 每个逻辑像素对应的物理像素数放大（最近邻）。
(function () {
  const D = AWData, C = AWCore, Art = AWArt, Skin = AWSkin, COL = Skin.COL;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  // TILE：地图画布上一格多少逻辑像素（读 AWArt.TILE：新素材 48，旧素材 32）；FX：特效、光标、范围、标记这些叠加层一格固定按 32 个单位画（AWArtFx 的坐标系）
  const TOP = 0, TILE = (Art.TILE | 0) || 32, MTOP = Math.round(TILE / 2), FX = 32;
  const Q = new URLSearchParams(location.search);
  const DEMO = Q.get('demo') === '1'; // 调试：所有阵营都由电脑控制，跳过所有动画等待
  const ZOOMS = TILE === 48 ? [36, 48, 72, 96, 120, 144] : [32, 48, 64, 80, 96, 112, 128]; // 缩放档位：一格多少屏幕像素。小于 SMALL_TS 时血量牌等换成简化样式
  const SMALL_TS = 44;
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  // 通用设置（设置页里改，记在 localStorage）
  const cfg = {
    fast: lsGet('steel-tide.fast') === '1',                                     // 电脑回合动画加速（没设过时：64×64 的大图默认开，见 enterGame）
    speed: [1.4, 1, 0.6].includes(+lsGet('steel-tide.speed')) ? +lsGet('steel-tide.speed') : 1, // 动画速度（时间系数）
    grid: lsGet('steel-tide.grid') !== '0',                                     // 显示格线（默认开）
    follow: lsGet('steel-tide.follow') !== '0',                                 // 电脑回合镜头自动跟随
    vol: [0, 25, 50, 75, 100].includes(+lsGet('steel-tide.vol')) && lsGet('steel-tide.vol') != null ? +lsGet('steel-tide.vol') : 50, // 音乐音量
    wipe: lsGet('steel-tide.wipe') !== '0',                                     // 转场动画（开战、回合切换、胜负的阵营色横条 + 大字；默认开）
    hints: lsGet('steel-tide.hints') === '1',                                   // 常显按键提示（默认关：只在有面板打开时显示）
    cap: ['full', 'short', 'off'].includes(lsGet('steel-tide.cap')) ? lsGet('steel-tide.cap') : 'full', // 占领演出：完整（弹小窗）/ 简短（只在地图上跳数字、白闪换色）/ 关闭
    hud: lsGet('steel-tide.hud') === 'full' ? 'full' : 'slim',                  // 战场信息：精简（顶边、底边各一条细条，默认）/ 完整（带头像的大牌子）
    spec: 0,                                                                    // 全电脑观战时用谁的视野（0 = 全图）
  };
  let quiet = false;                  // 电脑在迷雾里的行动：不演出
  // 动画时间系数：演示模式、迷雾里看不见的行动 0；电脑回合开了加速 1/4；再乘动画速度
  let TURBO = false;                  // 测试用：所有动画等待归零（和演示模式一样快），对话照常弹
  const tf = () => (DEMO || quiet || TURBO) ? 0 : ((cfg.fast && S && !human[S.turn]) ? 0.25 : 1) * cfg.speed;
  const sleep = ms => new Promise(r => setTimeout(r, ms * tf()));

  let S = null, gid = 0;
  let ts = 48, ox = 0, oy = 0, dpr = 1;          // ts、ox、oy 是屏幕（CSS）像素
  let zoomPref = ZOOMS.includes(+lsGet('steel-tide.zoom')) ? +lsGet('steel-tide.zoom') : 0; // 玩家选的缩放档位（0 = 自动：一屏约 15×10 格）
  let tp = 48, sc = 1.5, fs = 1.5, oxp = 0, oyp = 0;   // fs：叠加层的放大倍数（tp / FX）       // 物理像素：格子边长、逻辑像素放大倍数、地图原点
  let u = 2, U = 2;                              // 界面像素：u 个屏幕像素 = U 个物理像素
  let camX = 0, camY = 0, scrollX = false, scrollY = false, lastCurKey = '', camAnim = null;
  let cur = { x: 0, y: 0 };
  let mode = 'title'; // title | idle | move | menu | target | unload | silo | inspect | anim | ai | over
  let human = [false, true, false];
  let joinTr = null, hitSet = null; // joinTr：这次行动要并进去的友军；hitSet：选中单位后，这回合打得到的敌人（格子下标集合）
  let sel = null, reach = null, reachMask = null, orig = null, committed = false, acted = false, loadTr = null, movePath = null; // movePath：预演里选好的那条路（行动定下来时才交给 C.resolveMove）
  let targets = [], tIdx = 0, spots = [], sIdx = 0, unloadIdx = 0, inspect = null;
  let aim = null, lastStop = null; // aim：移动范围里光标压在打得到的敌人身上时 { t: 目标, stand: [x, y] 站位 }；lastStop：光标最近停过的可停格
  let anim = null, fx = [], shakeFx = null, frameNo = 0, ghosts = []; // ghosts：已经被核心移出 s.units、但击毁演出还没播完的单位
  let mapCvs = [], mapDirty = true, warmMap = null, warming = false, warmAgain = false, lastWarm = 0, mapSig = 0;
  // 对局选项（选图页里改，记住上次的选择）
  // 金额一律读核心的默认规则（数值会整体调整，界面不写死）：建筑收入的几档是默认值的 0.5 / 1 / 1.5 / 2 倍，开局资金是它的 0 / 5 / 10 / 20 倍
  const RDEF = (() => { try { return Object.assign({}, C.defaultRules || C.newGame(D.MAPS[0], {}).rules || {}); } catch (e) { return {}; } })();
  const INC = RDEF.income > 0 ? RDEF.income : (D.TERRAIN.city && D.TERRAIN.city.income) || 1;
  const amt = k => { const v = INC * k; return [v, String(v)]; };
  const RULES = [
    ['fog', '战争迷雾', [[false, '关'], [true, '开']]],
    ['startFunds', '开局资金', [0, 5, 10, 20].map(amt)],
    ['income', '建筑收入', [0.5, 1, 1.5, 2].map(amt)],
    ['powers', '指挥官技能', [[true, '开'], [false, '关']]],
    ['dayLimit', '天数上限', [[0, '无'], [20, '20'], [30, '30'], [50, '50']]],
    ['aiLevel', '电脑难度', [['easy', '简单'], ['normal', '普通'], ['hard', '困难']]],
    // 下面两项核心支持了才出现（看 C.newGame 出来的 s.rules 里有没有这个字段）
    ['coPassives', '指挥官特长', [[true, '开'], [false, '关']]],
    ['handicap', '人数补偿', [[true, '开'], [false, '关']]],
    ['loot', '战利品', [[true, '开'], [false, '关']]],
    ['tech', '科技', [[true, '开'], [false, '关']]],
    ['ore', (D.RES && D.RES.name) || 'ore', [[true, '开'], [false, '关']]],   // 第二种资源（名字读 D.RES）
  ];
  const AILV = [['', '默认'], ['easy', '简单'], ['normal', '普通'], ['hard', '困难']];
  const opt = {
    map: 0, ctl: [null, 'human', 'ai', 'ai', 'ai'], cos: [null, 'blitz', 'rand', 'rand', 'rand'], teams: [0, 1, 2, 3, 4],
    // 自由对局默认开战争迷雾（存过偏好的按 steel-tide.rules 里的；战役各关用关卡自己的 rules，不走这里）
    rules: { fog: true, startFunds: 0, income: INC, powers: true, dayLimit: 0, aiLevel: 'normal' }, ai: [null, '', '', '', ''],
  };
  for (const k of ['coPassives', 'handicap', 'loot', 'tech', 'ore']) if (typeof RDEF[k] === 'boolean') opt.rules[k] = RDEF[k];
  try {
    const o = JSON.parse(lsGet('steel-tide.rules') || 'null');
    if (o && typeof o === 'object') {
      for (const [k, , ch] of RULES) if (o.rules && k in opt.rules && ch.some(c => c[0] === o.rules[k])) opt.rules[k] = o.rules[k];
      if (Array.isArray(o.ai)) for (let p = 1; p <= 4; p++) if (AILV.some(c => c[0] === o.ai[p])) opt.ai[p] = o.ai[p];
    }
  } catch (e) { }
  // 玩家自己的对局设置（记在 localStorage）和“这张图现在用的设置”分开：地图带推荐规则（def.rules）时，选中它就先套上推荐值，
  // 玩家在这张图上改推荐过的那几项只对这一局生效，不写回自己的习惯
  const myRules = Object.assign({}, opt.rules);
  // 自动对局调试用：?demo=1&fog=1&ai=hard&view=1（迷雾、电脑难度、用哪一方的视野看）
  if (Q.get('fog') === '1') opt.rules.fog = myRules.fog = true;
  if (['easy', 'normal', 'hard'].includes(Q.get('ai'))) opt.rules.aiLevel = myRules.aiLevel = Q.get('ai');
  if (+Q.get('days') > 0) opt.rules.dayLimit = myRules.dayLimit = +Q.get('days');
  if (+Q.get('view') >= 1) cfg.spec = +Q.get('view');
  const saveRules = () => lsSet('steel-tide.rules', JSON.stringify({ rules: myRules, ai: opt.ai }));
  const mapRec = def => (def && def.rules && typeof def.rules === 'object') ? def.rules : {};
  function setRule(k, v) { opt.rules[k] = v; if (!(k in mapRec(D.MAPS[opt.map]))) { myRules[k] = v; saveRules(); } }

  // ───────── 阵营（兼容现在的两方 state 和 MULTI-SPEC.md 的多阵营 state）─────────
  const NAMES = [null, '赤焰', '苍蓝', '翠林', '金沙']; // 只在 D.PLAYERS 缺席时兜底；界面上的阵营名一律读数据
  const mkPal = (o, d, m, l, h) => ({ o, d, m, l, h, main: m, dark: d, light: l });
  const PALFB = [
    mkPal('#3a3550', '#6d6a85', '#a5a3b8', '#d3d2de', '#f4f4f8'), mkPal('#4a1530', '#a3263c', '#e0453a', '#ff8a5c', '#ffd0a0'),
    mkPal('#1a1f5c', '#2a4bb0', '#3b82f0', '#6fc3ff', '#c9f0ff'), mkPal('#143a2e', '#1f7a4a', '#35b55a', '#86e07a', '#d6f7a8'),
    mkPal('#4a3312', '#b0741c', '#eeb42a', '#ffe066', '#fff6c0'),
  ];
  // 界面上的阵营色：用 AWArt.BPAL（和新单位素材、新建筑一套的沉稳颜色：中立暖灰、砖红、钢蓝、军绿偏青、土金，暗 / 主 / 亮 / 高光四级），
  // 轮廓色取“暗”再压深；art.js 没有 BPAL 时退回旧的鲜艳色 AWArt.PAL
  const palCache = {};
  const deep = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0'); return '#' + c(n >> 16 & 255) + c(n >> 8 & 255) + c(n & 255); };
  // 席位在这一局里扮演哪个阵营：听核心的 C.factionOf(s, p)；核心没有就读 s.factionOf[p]；都没有就是席位号（战役里 2 号席位可能是翠林、金沙）
  // 阵营编号有效：数据里有这个阵营（D.FACTIONS / D.PLAYERS 有几个算几个，不写死四个）
  const isFac = f => f >= 1 && !!((D.FACTIONS && D.FACTIONS[f]) || (D.PLAYERS && D.PLAYERS[f]));
  const facOpen = f => { const F = D.FACTIONS && D.FACTIONS[f]; if (!F || !F.hidden) return true; try { const R = window.AWCampaignRun; return !!(R && R.unlockedFactions && R.unlockedFactions().includes(f)); } catch (e) { return false; } };
  const fac = p => { if (!S || !p) return p; try { if (C.factionOf) { const f = C.factionOf(S, p); if (isFac(f)) return f; } } catch (e) { } const f = S.factionOf && S.factionOf[p]; return isFac(f) ? f : p; };
  // 席位的颜色编码（C.colorCode：阵营 + 10 × 变体；同阵营对打时第二个席位是 12、22……）。交给素材的编码：素材还没有这套变体调色板时退回 编码 % 10（阵营主色）
  const codeOf = p => { if (!S || !p) return p; try { if (C.colorCode) { const c = C.colorCode(S, p); if (c > 0) return c; } } catch (e) { } return fac(p); };
  const artHas = c => c <= 10 || !!(Art.hasColor ? Art.hasColor(c) : ((Art.BPAL && Art.BPAL[c]) || (Art.PAL && Art.PAL[c])));
  const artCode = p => { const c = codeOf(p); return artHas(c) ? c : c % 10; };
  const artLeft = c => c > 0 && c % 2 === 0;   // 素材自己把偶数编码的朝左画（art.js）；界面要的朝向按席位定，差出来的用 flip 补
  const facSwap = () => !!S && plist().some(p => artCode(p) !== p);
  // 交给美术画地图用的状态：建筑的归属换成阵营编号（美术按编号取色）。席位和阵营一致时就是 S 本身
  let artSt = null, artSig = 0;
  function artView() {
    if (!S || !facSwap()) return S;
    if (!artSt || artSt.src !== S.map || artSig !== mapSig) { artSig = mapSig; artSt = { src: S.map, map: Object.assign({}, S.map, { owner: S.map.owner.map(r => r.map(o => artCode(o))) }) }; }
    return artSt;
  }
  // 席位的界面色：听核心的 C.paletteOf(s, p)（main / light / dark，同阵营的第二个席位是变体色），补出轮廓和高光两级；核心没有就按阵营取美术的调色板
  const tint = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0'); return '#' + c(n >> 16 & 255) + c(n >> 8 & 255) + c(n & 255); };
  const pal = p => {
    if (S && p) { let P = null; try { P = C.paletteOf ? C.paletteOf(S, p) : null; } catch (e) { }
      if (P && P.main && P.light && P.dark) { const k = 'P' + P.main + P.light + P.dark; return palCache[k] || (palCache[k] = { o: deep(P.dark, 0.45), d: P.dark, m: P.main, l: P.light, h: tint(P.light, 0.45), main: P.main, dark: P.dark, light: P.light, pad: P.light }); } }
    p = fac(p);
    const B = Art.BPAL && Art.BPAL[p], old = (Art.PAL && Art.PAL[p]) || PALFB[p] || PALFB[0];
    if (!B || !B.m) return old;
    const k = p + B.m; if (palCache[k]) return palCache[k];
    const d = B.d || B.m, l = B.l || B.m, h = B.h || l;
    return (palCache[k] = { o: deep(d, 0.4), d, m: B.m, l, h, main: B.m, dark: d, light: l, pad: l });
  };
  const facName = f => (D.PLAYERS && D.PLAYERS[f]) || (NAMES[f] ? tt(NAMES[f]) : tt('阵营 {n}', { n: f }));
  // 席位的名字 = 它扮演的阵营名；这一局里有别的席位也是这个阵营（同阵营对打）时，后面带上席位标记：苍蓝 ①、苍蓝 ②
  const SEAT = ['', '①', '②', '③', '④'];
  const seatMark = p => { if (!S || !p) return ''; const f = fac(p); let n = 0; for (let q = 1; q <= (S.players || 2); q++) if (fac(q) === f) n++; return n > 1 ? SEAT[p] || String(p) : ''; };
  const pname = p => { const n = facName(fac(p)), k = seatMark(p); return k ? n + ' ' + k : n; };
  const NP = s => (s || S).players || 2;
  const plist = s => { const a = []; for (let p = 1; p <= NP(s); p++) a.push(p); return a; };
  const teamOf = (p, s) => { s = s || S; return s.team && s.team[p] != null ? s.team[p] : p; };
  const isAlive = p => !S.alive || S.alive[p] !== false;
  const isEnemy = (p, q) => C.isEnemy ? C.isEnemy(S, p, q) : p !== q;
  const hasTeams = s => { const t = plist(s).map(p => teamOf(p, s)); return new Set(t).size < t.length; };
  // 队伍标记：队伍编号按从小到大对应 A、B、C、D
  const teamTag = (p, s) => { const ids = [...new Set(plist(s).map(q => teamOf(q, s)))].sort((a, b) => a - b); return 'ABCD'[ids.indexOf(teamOf(p, s))] || '?'; };
  // 获胜的阵营：有 s.winners 用它；否则 s.winner 当阵营编号（现在的两方规则）
  const winnersOf = () => !S.winner ? [] : (Array.isArray(S.winners) && S.winners.length) ? S.winners.slice() : S.team ? plist().filter(p => teamOf(p) === S.winner) : [S.winner];
  const turnTrack = () => 'p' + ((S.turn - 1) % 2 + 1);
  const coOf = p => D.COS.find(c => c.id === S.co[p]);
  const coLabel = co => co ? co.name + (co.title ? ' · ' + co.title : '') : ''; // 指挥官一律显示成“名字 · 称号”
  const costOf = (p, k) => { try { if (C.costOf) return C.costOf(S, p, k); } catch (e) { } return D.UNITS[k].cost; }; // 指挥官可能改造价
  // 背景故事（lore.js 的 AWLore）：口头禅、档案、阵营介绍。模块缺席时这些内容都不显示
  const LORE = () => window.AWLore || null;
  const loreCo = id => { const L = LORE(); return (L && L.cos && L.cos[id]) || null; };
  const loreFac = f => { const L = LORE(); return (L && L.factions && L.factions[f]) || null; };
  const quoteOf = id => { const l = loreCo(id); return l && l.quote ? String(l.quote) : ''; };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  // 指挥官按阵营分组（D.COS[*].faction、D.FACTIONS）；核心还没给这些字段时就是一组
  const coFactions = () => { const fs = [...new Set(D.COS.map(c => c.faction).filter(f => isFac(f) && facOpen(f)))].sort((a, b) => a - b); return fs.length > 1 ? fs : []; };
  const cosOf = f => D.COS.filter(c => !f || c.faction === f);
  const coOrder = () => { const fs = coFactions(); return fs.length ? fs.flatMap(f => cosOf(f)) : D.COS.slice(); }; // 和选指挥官页的页签一个顺序：按阵营，阵营内按数据顺序
  const firstCo = p => (cosOf(coFactions().includes(p) ? p : 0)[0] || D.COS[0]).id;
  const powersOn = () => !(S && S.rules && S.rules.powers === false);
  // 移动之后还能不能开火：听核心的 C.canMoveFire（投弹手这类抛射单位可以）；核心没有这个函数时按“射程上限 1 才行”
  const moveFire = q => { try { if (C.canMoveFire) return !!C.canMoveFire(q, S); } catch (e) { } const r = D.UNITS[q.type].range; return !!r && r[1] <= 1; };
  // 兵种的特殊规则小标签（信息面板、造兵菜单用）。只认下面这几个数据字段，别的一律不管
  function unitTags(k) {
    const Un = D.UNITS[k] || {}, out = [];
    if (Un.lob) out.push(tt('移动后可攻击'));
    if (Un.cover === 0.5) out.push(tt('目标地形防御减半')); else if (Un.cover === 0) out.push(tt('无视地形防御'));
    if (Un.reveal) out.push(tt('可发现隐蔽单位'));
    return out;
  }
  // 这个单位站在现在这一格、现在这个回合的实际修正，只读 C.unitMods（指挥官常驻、阵营底色、技能、地形、军衔、雷达塔都在里面）：
  // atk 攻击增减合计；def 地形星数以外的防御增减（地形那部分已经画成星星）；move / range / vision 比兵种基础值多多少；vs 只对某类目标生效的攻击增减
  const VS_NAME = { air: '对空', land: '对地', ship: '对舰', inf: '对步兵', vehicle: '对车辆', sub: '对潜' };
  function unitBuff(q) {
    const out = { atk: 0, def: 0, defAll: 0, move: 0, range: 0, vision: 0, vs: [], mods: null };
    let m = null; try { m = C.unitMods ? C.unitMods(S, q) : null; } catch (e) { }
    if (!m || typeof m !== 'object') return out;
    const num = v => (typeof v === 'number' && isFinite(v) ? v : 0), r2 = v => Math.round(v * 100) / 100;
    out.atk = r2(num(m.atk)); out.defAll = r2(num(m.def)); out.def = r2(num(m.def) - num(m.terrain));
    out.move = (q.fired && !q.moved) ? 0 : num(m.moveBonus); // 打完再移动的单位：核心给的是剩余移动力，不当成惩罚画
    out.range = num(m.rangeBonus); out.vision = darkOn() ? num(m.visionBonus) : 0;
    if (m.vs && typeof m.vs === 'object') for (const k in m.vs) { const v = r2(num(m.vs[k])); if (v) out.vs.push([k, v]); }
    out.mods = m;
    return out;
  }
  const pct = v => (v > 0 ? '+' : '-') + Math.round(Math.abs(v) * 100) + '%';
  // 占领一次扣多少占领值：听核心的 C.capPower（指挥官可能有占领倍数）
  const capPow = q => { try { if (C.capPower) return C.capPower(S, q); } catch (e) { } return C.dispHp(q); };

  // ───────── 音效：有 AWAudio 就用它，没有就用下面的简易合成 ─────────
  const AU = () => window.AWAudio || null;
  // 声音默认是开的（2026-11-13 作者改）：右上角的喇叭图标（#snd）点一下关掉，再点一下打开；键盘 V、手柄左摇杆按下也能切。浏览器要有用户操作才允许出声，所以第一次点击 / 按键之后才真正响。
  // 玩家开过声音会记住（steel-tide.sound = '1'）：下次打开时，他第一次点击 / 按键之后自动恢复出声（浏览器要有用户操作才允许出声）。
  // 没记录或记录是关：一直静音到点图标为止，期间不创建、不恢复 AudioContext（浏览器不会报自动播放的警告）。
  let ac = null, soundOn = lsGet('steel-tide.sound') !== '0', localMuted = !soundOn, wantTrack = 'off', unlocked = false;
  const isMuted = () => !soundOn;
  function applyVol() { const A = AU(); if (A && A.setVolume) { try { A.setVolume(0.22 * cfg.vol / 50, null); } catch (e) { } } }
  // 开 / 关声音（图标、设置页、V 键都走这里）。打开的这一下本身就是用户操作：当场 unlock，按现在该放的曲子（wantTrack）开始播
  function setSound(on) {
    soundOn = !!on; localMuted = !soundOn; lsSet('steel-tide.sound', soundOn ? '1' : '0');
    const A = AU(); if (A) { try { A.setMuted(!soundOn); } catch (e) { console.error(e); } }
    if (soundOn) audio(); else if (ac && ac.state === 'running') { try { ac.suspend(); } catch (e) { } }
    refreshMute();
  }
  const setMuted = v => setSound(!v);
  // 喇叭图标：像素面板上一只喇叭，开着带声波，关着带一个红叉。点击区 24×24 个界面像素（不小于 44 屏幕像素）
  function refreshMute() {
    const b = $('snd'); if (!b) return;
    b.innerHTML = Kit.spk(soundOn); b.classList.toggle('on', soundOn); b.title = soundOn ? tt('声音：开（点击静音，V）') : tt('声音：关（点击开启，V）'); b.setAttribute('aria-label', b.title);
    document.querySelectorAll('.orow[data-k=sound]').forEach(o => { if (o._sync) o._sync(); });
  }
  // 每次用户操作都会调到这里：声音开着才 unlock（第一次时顺带设音量、放曲子）；声音关着什么都不做
  function audio() {
    if (!soundOn) return;
    const A = AU();
    if (A) {
      try { if (A.muted) A.setMuted(false); A.unlock(); if (!unlocked) { unlocked = true; applyVol(); } A.music(wantTrack); } catch (e) { console.error(e); }
      return;
    }
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  // 声音记着“开”时，重新打开页面后浏览器要等到一次真实的点按 / 按键才放行音频。原来只有画布、键盘和标题页的几个按钮会去解锁，
  // 点别的地方（菜单、面板、世界地图、过场）都不算，于是图标显示开着却没有声音，要关一下再开才响。现在任何点按、按键都解锁。
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, () => { if (soundOn) audio(); }, { capture: true, passive: true });
  function music(name) {
    wantTrack = name; const A = AU();
    if (A) { try { A.music(name); } catch (e) { console.error(e); } }
  }
  function tone(f, d, type, v, f2) {
    if (!ac || localMuted) return;
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v || 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d);
  }
  function noise(d, v) {
    if (!ac || localMuted) return;
    const n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = v || 0.12;
    s.connect(g); g.connect(ac.destination); s.start();
  }
  const basic = {
    tick: () => tone(660, 0.04, 'square', 0.02), ok: () => tone(880, 0.08, 'square', 0.035, 1320),
    no: () => tone(220, 0.1, 'sawtooth', 0.03, 160), back: () => tone(520, 0.06, 'square', 0.022, 390), shot: () => noise(0.16, 0.14),
    boom: () => { noise(0.5, 0.22); tone(120, 0.4, 'sawtooth', 0.06, 40); },
    cap: () => { tone(523, 0.1); setTimeout(() => tone(784, 0.16), 100); },
    turn: () => { tone(392, 0.12, 'triangle', 0.06); setTimeout(() => tone(523, 0.12, 'triangle', 0.06), 120); setTimeout(() => tone(784, 0.22, 'triangle', 0.06), 240); },
    power: () => { for (let i = 0; i < 5; i++) setTimeout(() => tone(440 * Math.pow(1.26, i), 0.14, 'sawtooth', 0.05), i * 70); },
  };
  basic.move = basic.tick; basic.cannon = () => { noise(0.3, 0.18); tone(160, 0.25, 'sawtooth', 0.05, 60); };
  basic.captured = basic.cap; basic.build = basic.cap; basic.win = basic.power; basic.lose = basic.no;
  const sfx = {};
  for (const n of ['tick', 'ok', 'no', 'back', 'move', 'shot', 'cannon', 'boom', 'cap', 'captured', 'build', 'turn', 'power', 'win', 'lose']) {
    sfx[n] = () => {
      if (DEMO || !soundOn) return;
      const A = AU();
      try { if (A) A.sfx(n); else basic[n](); } catch (e) { console.error(e); }
    };
  }

  // 占领演出的三个音效（落地的闷响、占下来的号角、被占走的警示音）：音频模块里没有，这里用振荡器直接合成
  const extra = fn => () => { if (DEMO || !soundOn) return; try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); fn(); } catch (e) { } };
  sfx.stomp = extra(() => { noise(0.14, 0.2); tone(95, 0.16, 'sine', 0.12, 45); });
  sfx.fanfare = extra(() => { [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.045), i * 90)); setTimeout(() => { tone(1047, 0.42, 'square', 0.05); tone(784, 0.42, 'triangle', 0.05); }, 290); });
  sfx.alarm = extra(() => { tone(466, 0.14, 'sawtooth', 0.05); setTimeout(() => tone(349, 0.24, 'sawtooth', 0.05), 160); });

  // ───────── 导航栈、按键提示条、整屏页都在 ui-kit.js（AWKit）─────────
  const Kit = window.AWKit, Nav = Kit.Nav, tt = Kit.t;   // 界面文字走翻译（这个文件里 T 已经是地形表、格子边长的局部变量名，所以叫 tt）
  Kit.sfx = sfx;
  Object.defineProperty(Kit, 'liveState', { get: () => artView(), configurable: true });
  let Front = null, BT = null, HUD = null, Camp = null;   // Camp：战役（ui-campaign.js）   // ui-front.js / ui-battle.js 的入口，文件末尾接上
  // 最近一次输入是什么：'mouse' / 'touch' / 'pen'（指针）或 'key'（键盘、手柄）
  let ptrKind = 'mouse';
  document.addEventListener('pointerdown', e => { ptrKind = e.pointerType || 'mouse'; }, true);

  // ───────── 存档 ─────────
  const SV = () => window.AWSave || null;
  function autosave() {
    const A = SV(); if (!A || DEMO || !S || S.winner) return;
    try { A.save(S, { human: human.slice(), map: opt.map, mapName: S.map.name || '', money: INC, camp: S.camp ? S.camp.id : '' }); } catch (e) { console.error(e); }
  }
  function clearSave() { const A = SV(); if (A && !DEMO) { try { A.clear(); } catch (e) { } } }
  // 读档并核对：数据文件改过（兵种、地形、指挥官对不上）的旧档直接作废
  function loadSave() {
    const A = SV(); if (!A || DEMO) return null;
    try {
      const r = A.load(); if (!r || !r.state) return null;
      // 金额量级的标记（存档时核心默认的建筑收入）：没有标记或和现在不一样的是数值调整前的旧档，作废，不显示“继续上一局”
      if (!r.meta || r.meta.money !== INC) { A.clear(); return null; }
      const s = r.state, m = s.map, n = s.players || 2, ps = []; for (let p = 1; p <= n; p++) ps.push(p);
      const good = m && Array.isArray(m.t) && m.t.length === m.h && Array.isArray(s.units) && !s.winner && s.turn >= 1 && s.turn <= n && n <= 4 &&
        m.t.every(row => row.length === m.w && row.every(t => D.TERRAIN[t])) && Array.isArray(m.owner) && Array.isArray(m.cap) &&
        s.units.every(u => D.UNITS[u.type] && u.owner >= 1 && u.owner <= n && u.x >= 0 && u.y >= 0 && u.x < m.w && u.y < m.h && Array.isArray(u.cargo) && u.cargo.every(c => D.UNITS[c.type])) &&
        Array.isArray(s.co) && Array.isArray(s.funds) && Array.isArray(s.meter) && ps.every(p => D.COS.some(c => c.id === s.co[p]) && typeof s.funds[p] === 'number');
      if (!good) { A.clear(); return null; }
      s.ai = null; // 电脑的缓存不进存档，读回来重新算
      return r;
    } catch (e) { return null; }
  }

  // ───────── 图鉴（codex.js）─────────
  const CX = () => window.AWCodex || null;
  // o：{ page: 'world' | 'faction' | 'co' | 'unit' | 'terrain' | 'rules', unit, co, terrain } 直接打开某一页；不给就是首页
  function openCodex(o) { const X = CX(); if (!X) return; try { X.open(o || null); } catch (e) { console.error(e); } }
  function closeOverlays() { closeMenu(); Kit.closeAll(); curtain = false; }

  // ───────── 小地图用的地形色 ─────────
  const MINI = {
    plain: '#5bb04a', forest: '#2f7f45', mountain: '#8a7f96', road: '#7b7c98', bridge: '#b98250', river: '#3b8ae6', sea: '#2a5fc0',
    ruins: '#7a5a48', waste: '#b08a5a', swamp: '#1f5c40', beach: '#f0dc9c', reef: '#1d3f8a', wall: '#3c3552', silo: '#d3d2de', silo_used: '#5d5470', shard: '#7fe0ff', shard_used: '#8a7a66',
  };
  // 把地图画成色块：每格 k 像素，建筑用阵营色（中立浅灰）加深色边
  function paintBlocks(c, m, k) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const t = m.t[y][x], T = D.TERRAIN[t];
      if (T && T.prop) {
        const o = m.owner[y][x], P = pal(o);
        c.fillStyle = P.o; c.fillRect(x * k, y * k, k, k);
        c.fillStyle = o ? P.m : '#d3d2de'; if (k >= 3) c.fillRect(x * k, y * k, k - 1, k - 1); else c.fillRect(x * k, y * k, k, k);
      } else { c.fillStyle = MINI[t] || '#6d6a85'; c.fillRect(x * k, y * k, k, k); }
    }
  }

  // ───────── 标题页 ─────────
  const mapDims = def => { const full = Array.isArray(def.rows) && def.rows.length > 0, r = full ? def.rows : (Array.isArray(def.half) && def.half.length ? def.half : ['']), w = String(r[0]).length; return { w: full ? w : w * 2, h: r.length }; };
  const mapN = def => Math.max(2, Math.min(4, def.players || 2));
  const thumbs = {};
  // core 开不了的图（比如多阵营规则还没接好）：直接按地图定义拼一份只有地形和归属的网格，给预览用
  function defMap(def) {
    const r = (Array.isArray(def.rows) && def.rows.length ? def.rows : Array.isArray(def.half) && def.half.length ? def.half : ['.']).map(String), full = !def.half || !!def.rows, hw = Math.max(1, ...r.map(q => q.length)), h = r.length, w = full ? hw : hw * 2, t = [], owner = [];
    for (let y = 0; y < h; y++) { t.push(new Array(w).fill('plain')); owner.push(new Array(w).fill(0)); }
    for (let y = 0; y < h; y++) for (let x = 0; x < hw; x++) {
      const ch = r[y][x], ty = D.CHARS[ch] || 'plain', own = def.owner && def.owner[y] ? (+def.owner[y][x] || 0) : ('HKBPSGDF'.includes(ch) ? 1 : 0);
      t[y][x] = ty; owner[y][x] = own;
      if (!full) { t[h - 1 - y][w - 1 - x] = ty; owner[h - 1 - y][w - 1 - x] = own ? 2 : 0; }
    }
    for (const [x, y] of def.p2 || []) if (owner[y] && x < w) owner[y][x] = 2;
    return { w, h, t, owner };
  }
  // 所选地图的缩略图：小图用像素渲染，大图（或没有 renderMap）用色块
  function thumb(i) {
    if (thumbs[i]) return thumbs[i];
    const def = D.MAPS[i]; let st = null;
    if (mapOk(def)) { try { st = C.newGame(def, {}); } catch (e) { console.warn('地图预览失败：' + def.name, e); } }
    const out = document.createElement('canvas');
    const m = st ? st.map : defMap(def), c = out.getContext('2d');
    let src = null;
    if (st && Art.renderMap && m.w * m.h <= 1400) { try { src = Art.renderMap(st, 0); } catch (e) { console.error(e); } }
    if (src) {
      const top = Art.TOP || 0, k = Math.min(1, 900 / src.width);
      out.width = Math.round(src.width * k); out.height = Math.round((src.height - top) * k);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(src, 0, top, src.width, src.height - top, 0, 0, out.width, out.height);
    } else {
      const k = Math.max(4, Math.floor(640 / Math.max(m.w, m.h)));
      out.width = m.w * k; out.height = m.h * k; paintBlocks(c, m, k);
    }
    // 开局部队：直接画兵种图（和实机同样的位置、比例）；地图太大、一格不到 16 像素时退成带深色描边的小圆点
    const k = out.width / m.w;
    for (const u of st ? st.units : []) {
      const P = pal(u.owner);
      if (k >= 16 && Art.drawUnit) { try { c.imageSmoothingEnabled = true; Art.drawUnit(c, u.type, u.owner, false, 0, u.x * k, u.y * k, k, 1); continue; } catch (e) { } }
      const r = Math.max(1.5, k * 0.26);
      c.beginPath(); c.arc((u.x + 0.5) * k, (u.y + 0.5) * k, r + 1, 0, Math.PI * 2); c.fillStyle = P.o; c.fill();
      c.beginPath(); c.arc((u.x + 0.5) * k, (u.y + 0.5) * k, r, 0, Math.PI * 2); c.fillStyle = P.m; c.fill();
    }
    return (thumbs[i] = out);
  }
  // 选中一张图：套上它推荐的结盟方式（def.teams）和推荐规则（def.rules，比如天数上限）作为这张图的默认设置，玩家之后可以改；
  // 没有推荐的项用玩家自己的习惯。keep：只是重新打开选图页，这张图已经套过就不再覆盖玩家的改动
  let recFor = -1;
  function selectMap(i, keep) {
    if (!(i >= 0 && i < D.MAPS.length)) i = 0;
    opt.map = i;
    const def = D.MAPS[i], n = mapN(def);
    if (!keep || recFor !== i) {
      recFor = i;
      for (let p = 1; p <= 4; p++) opt.teams[p] = (def.teams && def.teams[p]) || p;
      const rec = mapRec(def);
      for (const k in opt.rules) opt.rules[k] = (k in rec) ? rec[k] : myRules[k];
    }
    for (let p = 1; p <= 4; p++) if (!(opt.teams[p] >= 1 && opt.teams[p] <= n)) opt.teams[p] = Math.min(p, n);
  }
  // 地图列表按规模分组：两方的小 / 中 / 大图，多阵营单独一组
  const MAP_GROUPS = ['两方 · 小型', '两方 · 中型', '两方 · 大型', '多阵营'];
  const mapGroup = def => { const d = mapDims(def), a = d.w * d.h; return mapN(def) > 2 ? 3 : a <= 240 ? 0 : a <= 520 ? 1 : 2; };
  // 这张图现在开不开得了（文件还在改、行列对不上、阵营数不对都算开不了）：列表里置灰，不影响别的图
  const mapOkCache = new WeakMap();
  function mapOk(def) {
    if (mapOkCache.has(def)) return mapOkCache.get(def);
    let ok = false;
    try {
      const st = C.newGame(def, {}), m = st && st.map;
      ok = !!m && (st.players || 2) === mapN(def) && m.w > 0 && m.h > 0 && Array.isArray(m.t) && m.t.length === m.h && m.t.every(r => Array.isArray(r) && r.length === m.w && r.every(t => D.TERRAIN[t])) &&
        Array.isArray(m.owner) && m.owner.length === m.h && Array.isArray(st.units) && st.units.every(u => D.UNITS[u.type] && u.x >= 0 && u.y >= 0 && u.x < m.w && u.y < m.h);
    } catch (e) { console.warn('地图开不了：' + (def && def.name), e); }
    mapOkCache.set(def, ok); return ok;
  }
  // 推荐设置的文字：结盟方式（同队的阵营用 + 连起来，队与队之间写“对”）和推荐规则
  function mapRecText(def) {
    const n = mapN(def), out = [];
    if (n > 2) {
      const tm = p => (def.teams && def.teams[p]) || p, ids = [...new Set(Array.from({ length: n }, (_, i) => tm(i + 1)))].sort((a, b) => a - b);
      out.push(ids.length >= n ? tt('各自为战') : ids.map(t => Array.from({ length: n }, (_, i) => i + 1).filter(p => tm(p) === t).map(pname).join(' + ')).reduce((a, b) => tt('{a} 对 {b}', { a, b })));
    }
    const rec = mapRec(def);
    // RULES 里存的是中文原文：规则名、选项在这里显示时再翻（第二种资源的名字读 D.RES，已经是当前语言；纯数字不翻）
    const optT = (k, c) => /^[\d.]+$/.test(c[1]) ? c[1] : tt(c[1], null, typeof c[0] === 'boolean' ? 'toggle' : k === 'aiLevel' ? 'diff' : undefined);
    for (const [k, name, ch] of RULES) if (k in rec && k in opt.rules) { const c = ch.find(q => q[0] === rec[k]); out.push((k === 'ore' ? name : tt(name)) + ' ' + (c ? optT(k, c) : rec[k] === true ? tt('开', null, 'toggle') : rec[k] === false ? tt('关', null, 'toggle') : String(rec[k]))); }
    return out;
  }

  // ───────── 标题页：背景是主视觉插画（AWTitleArt），标题字在上半部的蓝天上，主菜单在中下部偏右 ─────────
  // 插画没加载好或缺席时退回一张地图的实时画面
  const TA = () => { const A = window.AWTitleArt; try { return A && A.img && (A.ready ? A.ready() : (A.img.complete && A.img.naturalWidth > 0)) ? A : null; } catch (e) { return null; } };
  let bg = null, bgDim = 0, artAt = null, titleT0 = 0;
  // 插画铺满窗口：等比放大到盖住窗口（多放 3%，留给镜头慢慢平移），裁掉的部分横向主要裁右边、纵向主要裁上边，
  // 左下角的坦克和小兵始终在画面里。平滑缩放。
  // 插画在窗口 W×H 里的位置（同一单位）：{ x, y, k 缩放, w, h 原图尺寸 }。t 是秒，镜头按它慢慢来回平移（幅度不到窗口的 1.2%）
  function artGeom(A, W, H, t) {
    const iw = A.w || A.img.naturalWidth, ih = A.h || A.img.naturalHeight;
    const k = Math.max(W / iw, H / ih) * 1.03, ex = iw * k - W, ey = ih * k - H;
    return { x: -Math.min(ex, ex * 0.1 + W * 0.006 * (1 + Math.sin(t / 17))), y: -(ey - Math.min(ey, ey * 0.1 + H * 0.004 * (1 + Math.sin(t / 23 + 1)))), k, w: iw, h: ih };
  }
  function drawArt(A, now) {
    const g = artGeom(A, cv.width, cv.height, now / 1000);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(A.img, g.x, g.y, g.w * g.k, g.h * g.k);
    ctx.imageSmoothingEnabled = false;
    artAt = { x: g.x / dpr, y: g.y / dpr, k: g.k / dpr, w: g.w, h: g.h };
  }
  function bgInit() {
    if (bg) return;
    const pool = D.MAPS.filter(m => { const d = mapDims(m); return d.w * d.h >= 380 && d.w * d.h <= 720 && mapN(m) === 2; });
    const def = pool.length ? pool[Math.floor(Math.random() * pool.length)] : D.MAPS[0];
    try { bg = { S: C.newGame(def, {}), cvs: [] }; } catch (e) { console.warn('标题背景开不了：' + def.name, e); return; }
    (async b => {
      for (let f = 0; f < (Art.FRAMES || 4); f++) {
        if (bg !== b || !Art.renderMap) return;
        try { b.cvs[f] = Art.renderMap(b.S, f); } catch (e) { console.error(e); return; }
        await new Promise(r => setTimeout(r, 30));
      }
    })(bg);
  }
  // 背景：整数倍放大到铺满窗口，镜头慢慢来回平移，上面压一层暗色
  function drawBg(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const A = TA(), want = 0;
    bgDim += (want - bgDim) * 0.25; if (Math.abs(want - bgDim) < 0.02) bgDim = want;
    if (A) { // 上面叠了选图、设置、说明这些页面时把插画压暗
      drawArt(A, now);
      if (bgDim > 0) { ctx.fillStyle = 'rgba(20,22,28,' + (0.66 * bgDim).toFixed(3) + ')'; ctx.fillRect(0, 0, cv.width, cv.height); }
      return;
    }
    artAt = null;
    if (!bg && (!window.AWTitleArt || now - titleT0 > 800)) bgInit();
    ctx.fillStyle = '#1d3f8a'; ctx.fillRect(0, 0, cv.width, cv.height);
    const b = bg, mc = b && (b.cvs[frameNo] || b.cvs[0]);
    if (mc) {
      const m = b.S.map, W = cv.width, H = cv.height, top = Art.TOP || 0;
      let n = Math.max(1, Math.round(1.5 * dpr)); while (m.w * TILE * n < W + TILE * n || m.h * TILE * n < H + TILE * n) n++;
      const px = Math.round((m.w * TILE * n - W) * (0.5 + 0.5 * Math.sin(now / 21000))), py = Math.round((m.h * TILE * n - H) * (0.5 + 0.5 * Math.sin(now / 29000 + 1)));
      ctx.setTransform(n, 0, 0, n, -px, -py);
      const sx = Math.floor(px / n), sy = Math.floor(py / n), sw = Math.min(mc.width - sx, Math.ceil(W / n) + 1), sh = Math.min(mc.height - top - sy, Math.ceil(H / n) + 1);
      ctx.drawImage(mc, sx, sy + top, sw, sh, sx, sy, sw, sh);
      for (const q of b.S.units) {
        if ((q.x + 1) * TILE < sx || q.x * TILE > sx + sw || (q.y + 1) * TILE < sy || q.y * TILE > sy + sh) continue;
        // 单位按放大后的格子取图（Art.drawUnit：有新素材就画完整尺寸，没有就是旧的像素精灵）
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        try { if (Art.drawUnit) Art.drawUnit(ctx, q.type, q.owner, false, frameNo, q.x * TILE * n - px, q.y * TILE * n - py, TILE * n, 1); } catch (e) { }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.fillStyle = 'rgba(20,22,28,.6)'; ctx.fillRect(0, 0, cv.width, cv.height);
  }
  function showTitle() {
    gid++; unstage(); holdReset(); S = null; mode = 'title'; closeOverlays(); Nav.stack = []; if (Camp) Camp.abort();
    sel = reach = reachMask = inspect = anim = movePath = loadTr = joinTr = null; fx = []; ghosts = []; plays.clear(); mapCvs = []; warmMap = null; apron = null; visMask = seeMask = null; quiet = false;
    fcast = null; loadingOn = false; HUD.clear();
    if (!mapOk(D.MAPS[opt.map]) || D.MAPS[opt.map].campaign) { const i = D.MAPS.findIndex(m => !m.campaign && mapOk(m)); if (i >= 0) opt.map = i; } // 默认选中的那张图开不了（文件还在改）：换第一张开得了的
    selectMap(opt.map, true);
    titleT0 = performance.now(); bgDim = 0;
    Front.title(); music('title');
  }
  function enterGame() {
    gid++; fx = []; ghosts = []; plays.clear(); sprLog.last.clear(); sel = reach = reachMask = inspect = anim = camAnim = shakeFx = movePath = loadTr = joinTr = null; camX = camY = 0; lastCurKey = ''; quiet = false; preview(false);
    fcast = null; HUD.clear(); quit.clear(); gaveUp = 0; holdReset();
    if (lsGet('steel-tide.fast') == null) cfg.fast = S.map.w * S.map.h >= 4000; // 没设过“电脑加速”：64×64 的大图默认开
    mapCvs = []; warmMap = null; mapDirty = false; mapSig = sigOf(); snapMap(); seenLog = (S.log && S.log.length) || 0; aliveWas = plist().map(isAlive);
    closeOverlays(); Nav.stack = [];
    lastHuman = human[S.turn] ? S.turn : (plist().find(p => human[p]) || 0);
    resize(); homeCursor(); placeCam(true); lastCurKey = cur.x + ',' + cur.y; refreshVis();
    music(turnTrack());
  }
  // 进场：先把四帧地图渲染好（大图会卡一下，所以先挂“载入地图”），再出回合横幅
  async function openGame(sub, hold, gist) {
    enterGame(); mode = 'anim'; const g = gid, big = S.map.w * S.map.h > 900;
    if (big) { loadingOn = true; await new Promise(r => setTimeout(r, 40)); }
    // 开战：整屏的阵营色转场（地图名 + 简介第一句），地图在它后面渲染；接着是第一个回合的横带。转场关掉时只出回合横幅
    // sub：回合横幅的副标题（“地图名 · 简介第一句”或“继续上一局”）；gist：转场上的小字（只要简介第一句，不带地图名），不给就用 sub
    const first = cfg.wipe && tf() > 0;
    if (first) sfx.turn();
    const b = first ? wipe({ p: S.turn, pre: tt('作战开始'), big: S.map && S.map.name ? tt(S.map.name, null, 'map') : '', sub: gist != null ? gist : sub, full: true, ms: 1500 }) : bannerTurn(sub, hold);
    await warm(); if (g !== gid) return;
    loadingOn = false;
    await b; if (g !== gid) return;
    if (first) { await bannerTurn(tt('收入 +{n}', { n: C.income(S, S.turn) })); if (g !== gid) return; }
    hintUntil = performance.now() + 4000;       // 开局头几秒把按键提示亮出来一次
    if (human[S.turn]) { mode = 'idle'; updateHud(); } else runAI();
  }
  async function startGame() {
    try { const A = window.AWPortraits; if (A && A.preloadHi) { A.preloadHi('power'); A.preloadHi('lose'); } } catch (e) { }   // 技能演出、结算页的大立绘提前解码
    audio();
    const def = D.MAPS[opt.map], n = mapN(def), cos = [null], teams = [0], aiLevels = [null];
    for (let p = 1; p <= n; p++) {
      const pool = cosOf(coFactions().includes(p) ? p : 0).length ? cosOf(coFactions().includes(p) ? p : 0) : D.COS; // 随机优先本色阵营
      cos[p] = opt.cos[p] === 'rand' || !D.COS.some(c => c.id === opt.cos[p]) ? pool[Math.floor(Math.random() * pool.length)].id : opt.cos[p];
      teams[p] = opt.teams[p] || p;
      aiLevels[p] = opt.ai[p] || null;
    }
    let s = null;
    if (!mapOk(def)) { sfx.no(); return Kit.note(tt('这张地图暂时不能使用（地图文件可能正在修改），请选择其他地图。')); }
    try { s = C.newGame(def, { cos, teams, co1: cos[1], co2: cos[2], funds: opt.rules.startFunds, rules: Object.assign({}, opt.rules), aiLevels }); } catch (e) { console.warn('开局失败', e); }
    if (!s || (s.players || 2) !== n) { sfx.no(); return Kit.note(n > 2 ? tt('这张地图需要 {n} 个阵营，现在不能开始对局，请选择其他地图。', { n }) : tt('这张地图暂时不能使用。')); }
    sfx.ok(); S = s;
    human = [false]; for (let p = 1; p <= n; p++) human[p] = !DEMO && opt.ctl[p] === 'human';
    defaultFunds(s, p => human[p]);
    autosave();
    await openGame(mapSub(def), 1900, mapGist(def) || mapSub(def));
  }
  // 地图载入横幅的副标题：地图简介（blurb）的第一句，前面带地图名；没有简介就只写地图名
  // 简介第一句：Kit.sentences 切句（各语言自己的句号），去掉句尾标点
  const mapGist = def => (Kit.sentences(String(def.blurb || '').trim())[0] || '').replace(/[。！？.!?…]+$/, '');
  function mapSub(def) {
    const raw = def.name || (S && S.map.name) || '', name = raw ? tt(raw, null, 'map') : '', g = mapGist(def);
    return g ? (name ? name + ' · ' : '') + g : name;
  }
  async function resumeGame() {
    audio();
    const r = loadSave();
    if (!r) { sfx.no(); return showTitle(); }
    sfx.ok();
    S = r.state;
    const h = r.meta && r.meta.human, n = NP();
    human = [false]; for (let p = 1; p <= n; p++) human[p] = Array.isArray(h) && h.length === n + 1 ? !!h[p] : p === 1;
    const byName = D.MAPS.findIndex(m => m.name === (r.meta && r.meta.mapName || S.map.name));
    if (byName >= 0) opt.map = byName; else if (r.meta && r.meta.map >= 0 && r.meta.map < D.MAPS.length) opt.map = r.meta.map;
    if (S.camp && Camp) Camp.attach();          // 战役里的存档：接着这一关打
    await openGame(tt('继续上一局'));
  }
  // 战役：换上一份已经摆好的对局（ui-campaign.js 按关卡数据建的），开场对话播完再开打
  async function startCampaign(st, hum, intro) {
    audio(); sfx.ok(); Kit.closeAll(); Nav.stack = []; S = st; human = hum; autosave();
    const g = gid + 1; enterGame(); mode = 'anim'; await warm(); if (g !== gid) return;
    if (intro) { await intro(); if (g !== gid) return; }
    const first = cfg.wipe && tf() > 0; if (first) sfx.turn();
    if (first) { await wipe({ p: S.turn, pre: tt('作战开始'), big: (S.camp && S.camp.title) || (S.map.name ? tt(S.map.name, null, 'map') : ''), sub: (S.camp && S.camp.goal) || '', full: true, ms: 1500 }); if (g !== gid) return; }
    await bannerTurn(tt('收入 +{n}', { n: C.income(S, S.turn) })); if (g !== gid) return;
    hintUntil = performance.now() + 4000;
    if (Camp) Camp.tick('turn');
    if (human[S.turn]) { mode = 'idle'; updateHud(); } else runAI();
  }
  function homeCursor() {
    const m = S.map; let found = false;
    for (let y = 0; y < m.h && !found; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'hq' && m.owner[y][x] === S.turn) { cur = { x, y }; found = true; break; }
    if (!found) { const u = S.units.find(q => q.owner === S.turn); if (u) cur = { x: u.x, y: u.y }; }
    cur.x = Math.max(0, Math.min(m.w - 1, cur.x)); cur.y = Math.max(0, Math.min(m.h - 1, cur.y));
  }

  // ───────── 布局与镜头 ─────────
  const viewW = () => innerWidth, viewH = () => Math.max(50, innerHeight);
  function resize() {
    dpr = window.devicePixelRatio || 1;
    const W = innerWidth, H = Math.max(50, innerHeight);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    Kit.scale();
    const r = Skin.install((W >= 1800 && H >= 950) ? 3 : 2, dpr); u = r.u; U = r.U;
    if (S) { pickScale(); placeCam(true); miniLayout(); apronCheck(); }
    Kit.hydrate(document); miniDirty = true;
  }
  // 缩放：一格取 ZOOMS 里的一档（屏幕像素）。玩家没选过就用自动档：
  //   · 一屏大约 15×10 格（窗口宽 / 15、高 / 10 里小的那个），只在“像素地形正好放大整数倍或 1.5 倍”的档位里挑最接近的；
  //   · 小图整图放得下，就取放得下的最大一档（少留边）；退一档就能整图放下、而且地图仍占窗口八成以上的，也退一档——
  //     再小就不退了（四周会空出一大圈），改用镜头。
  const zoomNice = z => { const k = z * dpr / TILE; return Math.abs(k * 2 - Math.round(k * 2)) < 1e-6 && (TILE !== 32 || k <= 1.5 || Math.abs(k - Math.round(k)) < 1e-6); };   // 整数倍或带半的倍数（48、72、96、120、144），像素块大小才匀
  function autoZoom() {
    const W = viewW(), H = viewH(), m = S.map, want = Math.min(W / 15, H / 10);
    let cand = ZOOMS.filter(z => z >= 48 && zoomNice(z)); if (!cand.length) cand = ZOOMS.filter(z => z >= 48);
    let best = cand[0]; for (const z of cand) if (Math.abs(z - want) <= Math.abs(best - want)) best = z;
    const fits = z => z * m.w <= W - 8 && z * m.h <= H - 8 - z / 2;
    const top = cand.filter(fits).pop();
    if (top && top > best) best = top;
    else if (!fits(best)) { const lo = cand[cand.indexOf(best) - 1]; if (lo && fits(lo) && (lo * m.w >= W * 0.8 || lo * m.h >= H * 0.8)) best = lo; }
    return best;
  }
  function pickScale() {
    const z = zoomPref || autoZoom();
    tp = Math.max(8, Math.round(z * dpr)); sc = tp / TILE; fs = tp / FX; ts = tp / dpr;
  }
  // 换一档缩放。z = 0 回到自动。(ax, ay) 是缩放时保持不动的屏幕位置（鼠标、捏合的中心）；不给就用光标格（光标不在画面里时用窗口中心）
  let zoomNote = null;
  function setZoom(z, ax, ay) {
    if (!S) return false;
    const old = ts, cxp = ox + (cur.x + 0.5) * ts, cyp = oy + (cur.y + 0.5) * ts, curIn = cxp >= 0 && cyp >= 0 && cxp <= viewW() && cyp <= viewH(), byCur = ax == null && curIn;
    if (ax == null) { ax = curIn ? cxp : viewW() / 2; ay = curIn ? cyp : viewH() / 2; }
    const mx = (ax - ox) / old, my = (ay - oy) / old;          // 这个位置在地图上是第几格
    zoomPref = ZOOMS.includes(z) ? z : 0; lsSet('steel-tide.zoom', String(zoomPref));
    pickScale();
    camAnim = null; camX = mx * ts - ax; camY = my * ts - ay; placeCam(false); if (byCur) placeCam(true);
    lastCurKey = cur.x + ',' + cur.y; apronCheck(); miniDirty = true; miniKey = '';
    const zv = { z: Math.round(ts), w: Math.min(S.map.w, Math.floor(viewW() / ts)), h: Math.min(S.map.h, Math.floor(viewH() / ts)) };
    Kit.note(zoomPref ? tt('缩放 {z}　一屏 {w}×{h} 格', zv) : tt('自动缩放 {z}　一屏 {w}×{h} 格', zv), 1400);
    return ts !== old;
  }
  const zoomIdx = () => { let b = 0; ZOOMS.forEach((z, i) => { if (Math.abs(z - ts) < Math.abs(ZOOMS[b] - ts)) b = i; }); return b; };
  function zoomStep(d, ax, ay) {
    if (!S) return false;
    const j = Math.max(0, Math.min(ZOOMS.length - 1, zoomIdx() + d));
    if (Math.abs(ZOOMS[j] - ts) < 0.5) { sfx.no(); return false; }
    sfx.tick(); return setZoom(ZOOMS[j], ax, ay);
  }
  // 界面条占掉的高度：顶上的状态条（#hudS）、底下的信息条和菜单按钮（#hudI、#hudO）。地图的第一行、最后一行要能拖到它们外面，不然司令部会被挡住
  let insKey = '';
  function hudInsets() {
    const H = viewH(); let top = 0, bot = 0;
    try { for (const id of ['hudS', 'hudI', 'hudO']) { const e = document.getElementById(id); if (!e) continue; const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue;
      if (q.top < H / 2) top = Math.max(top, q.bottom); else bot = Math.max(bot, H - q.top); } } catch (e) { }
    return [Math.min(top, H * 0.25), Math.min(bot, H * 0.3)];
  }
  // 整图在界面条之间放得下就居中；放不下按镜头位置滚动，follow 时把光标格（留一格半余量）带进画面
  function placeCam(follow) {
    if (!S) return;
    const W = viewW(), H = viewH(), mw = ts * S.map.w, mh = ts * S.map.h, pad = 4, ins = hudInsets();
    // 手机、触屏：四周多留一格半，边上的格子能拖到屏幕里面来点，不用贴着屏幕边、界面条和手指底下操作
    const ex = (Kit.dev === 'touch' || W < 900) ? Math.round(ts * 1.5) : 0, padX = pad + ex;
    const topLo = Math.max(Math.round(ts / 2), Math.round(ins[0])) + ex, botHi = Math.max(pad, Math.round(ins[1])) + ex;   // 顶上至少多留半格，给最上面一行建筑探出来的部分
    scrollX = mw + padX * 2 > W; scrollY = mh + topLo + botHi > H;
    const one = (on, cam, view, size, c, padLo, padHi) => {
      if (!on) return padLo + Math.floor((view - padLo - padHi - size) / 2);
      if (follow) {
        const mg = Math.min(ts * 1.5, (view - ts) / 2), lo = Math.max(mg, Math.min(padLo - ex + ts / 4, (view - ts) / 2)), hi = Math.max(mg, Math.min(padHi - ex + ts / 4, (view - ts) / 2));   // 跟光标时只让开界面条，不算触屏多留的那一圈
        cam = Math.min(cam, c * ts - lo); cam = Math.max(cam, (c + 1) * ts + hi - view);
      }
      return -Math.max(-padLo, Math.min(size + padHi - view, cam));
    };
    oxp = Math.round(one(scrollX, camX, W, mw, cur.x, padX, padX) * dpr); oyp = Math.round(one(scrollY, camY, H, mh, cur.y, topLo, botHi) * dpr);
    ox = oxp / dpr; oy = oyp / dpr;
    if (scrollX) camX = -ox; if (scrollY) camY = -oy;
  }
  // 光标换格后镜头跟上。电脑行动时平滑跟随，离得远（超过大半个屏幕）直接跳
  function followCursor() {
    const fx0 = camX, fy0 = camY;
    placeCam(true);
    if (!(scrollX || scrollY) || tf() <= 0 || !S || human[S.turn]) { camAnim = null; return; }
    const dx = camX - fx0, dy = camY - fy0;
    if ((!dx && !dy) || Math.abs(dx) > viewW() * 0.7 || Math.abs(dy) > viewH() * 0.7) { camAnim = null; return; }
    camAnim = { fx: fx0, fy: fy0, tx: camX, ty: camY, t0: performance.now(), dur: 220 * tf() };
    camX = fx0; camY = fy0; placeCam(false);
  }
  function stepCam(now) {
    if (!camAnim) return;
    const k = Math.min(1, (now - camAnim.t0) / Math.max(1, camAnim.dur)), e = 1 - (1 - k) * (1 - k);
    camX = camAnim.fx + (camAnim.tx - camAnim.fx) * e; camY = camAnim.fy + (camAnim.ty - camAnim.fy) * e;
    if (k >= 1) camAnim = null;
    placeCam(false);
  }
  // 光标刚换格、画面还没刷新时，先把镜头摆到位（菜单、预览条、信息面板要按屏幕位置摆）
  function syncCam() { const k = cur.x + ',' + cur.y; if (k !== lastCurKey) { lastCurKey = k; camAnim = null; placeCam(true); } }
  function panBy(dx, dy) { camAnim = null; camX += dx; camY += dy; placeCam(false); }
  function centerOn(x, y) { camAnim = null; camX = (x + 0.5) * ts - viewW() / 2; camY = (y + 0.5) * ts - viewH() / 2; placeCam(false); }
  addEventListener('resize', resize);
  // 视野内的格子范围
  function visRange() {
    const m = S.map;
    return { x0: Math.max(0, Math.floor(-oxp / tp)), y0: Math.max(0, Math.floor(-oyp / tp)), x1: Math.min(m.w - 1, Math.floor((cv.width - oxp - 1) / tp)), y1: Math.min(m.h - 1, Math.floor((cv.height - oyp - 1) / tp)) };
  }

  // ───────── 地图画布：四帧像素整图，后台分帧渲染 ─────────
  function sigOf() {
    const m = S.map; let h = 7;
    for (let y = 0; y < m.h; y++) { const tr = m.t[y], or = m.owner[y]; for (let x = 0; x < m.w; x++) h = (Math.imul(h, 31) + tr[x].length * 7 + tr[x].charCodeAt(0) + or[x] * 131) | 0; }
    return h;
  }
  // 地形或建筑归属变了（占领、导弹井发射、阵营淘汰）才重画地图
  // 只变了少数几格时就地补画那几格（整图重渲染一帧要 100ms 以上，64×64 要 1 秒多）
  let snapT = null, snapO = null;
  function snapMap() { const m = S.map; snapT = m.t.map(r => r.slice()); snapO = m.owner.map(r => r.slice()); }
  function checkMap() {
    if (!S) return; const g = sigOf(); if (g === mapSig) return;
    mapSig = g; miniDirty = true;
    const m = S.map, ch = [];
    if (snapT && snapT.length === m.h && snapT[0].length === m.w) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (snapT[y][x] !== m.t[y][x] || snapO[y][x] !== m.owner[y][x]) ch.push([x, y]);
    snapMap();
    if (!(TILE === 32 && ch.length && ch.length <= 64 && patchMap(ch))) mapDirty = true;   // 新素材（48 一格）：renderMap 自己把变化的格子补回四帧画布，重新取一遍就行
  }
  // 补画：改动格周围 3×3 整块重画（相邻格的接边可能跟着变），再补上下面一行探进来的部分；裁剪框以外一个像素都不动
  function patchMap(ch) {
    if (!Art.renderMap || !Art.terrain || warming || warmMap !== S.map) return false;
    const n = Art.FRAMES || 4, m = S.map;
    for (let f = 0; f < n; f++) if (!mapCvs[f]) return false;
    try {
      for (let f = 0; f < n; f++) {
        const g = mapCvs[f].getContext('2d'), top = mapCvs[f]._top || 0;
        for (const [cx, cy] of ch) {
          const x0 = Math.max(0, cx - 1), x1 = Math.min(m.w - 1, cx + 1), y0 = Math.max(0, cy - 1), y1 = Math.min(m.h - 1, cy + 1);
          g.save(); g.beginPath(); g.rect(x0 * TILE, top + y0 * TILE, (x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE); g.clip();
          for (let y = y0; y <= Math.min(m.h - 1, y1 + 1); y++) for (let x = x0; x <= x1; x++) {
            g.save(); g.translate(x * TILE, top + y * TILE); g.scale(TILE, TILE);
            Art.terrain(g, artView(), x, y, f);
            g.restore();
          }
          g.restore();
        }
      }
    } catch (e) { console.error(e); return false; }
    return true;
  }
  function legacyMap() {
    const m = S.map, c = document.createElement('canvas'); c.width = m.w * TILE; c.height = m.h * TILE + MTOP;
    const g = c.getContext('2d');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      g.save(); g.translate(x * TILE, MTOP + y * TILE); g.scale(TILE, TILE);
      try { Art.terrain(g, artView(), x, y); } catch (e) { console.error(e); }
      g.restore();
    }
    c._top = MTOP; return c;
  }
  async function warm() {
    mapDirty = false;
    if (warming) { warmAgain = true; return; }
    warming = true; lastWarm = performance.now();
    try {
      do {
        warmAgain = false; const s = S;
        if (!s) break;
        if (warmMap !== s.map) { mapCvs = []; warmMap = s.map; }
        if (!Art.renderMap) { mapCvs = [legacyMap()]; break; }
        const n = DEMO ? 1 : (Art.FRAMES || 4);
        for (let f = 0; f < n && s === S && !warmAgain; f++) {
          try { const c = Art.renderMap(s === S ? artView() : s, f); c._top = Art.TOP || 0; mapCvs[f] = c; } catch (e) { console.error(e); }
          if (f < n - 1 || warmAgain) await new Promise(r => setTimeout(r, 0));
        }
      } while (warmAgain);
    } finally { warming = false; }
    miniDirty = true;
  }

  // ───────── 地图外面的延伸画面 ─────────
  // 地图比窗口小时，四周接着画一圈同风格的地形（边上是海就接海，是陆地就接平原、树林、山，路和河直着延伸出去），整体压暗。
  // 延伸的地形是 (x, y) 的纯函数，所以可以按需要的范围一块一块渲染。
  let apron = null, apronTok = 0;
  const hash2 = (x, y) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function vnoise(x, y, s) {
    const gx = Math.floor(x / s), gy = Math.floor(y / s); let fx2 = x / s - gx, fy = y / s - gy;
    fx2 = fx2 * fx2 * (3 - 2 * fx2); fy = fy * fy * (3 - 2 * fy);
    const a = hash2(gx, gy), b = hash2(gx + 1, gy), c = hash2(gx, gy + 1), d = hash2(gx + 1, gy + 1);
    return (a + (b - a) * fx2) * (1 - fy) + (c + (d - c) * fx2) * fy;
  }
  const WET = { sea: 1, reef: 1, beach: 1, port: 1 };
  function outTerrain(m, x, y) {
    const cx = Math.max(0, Math.min(m.w - 1, x)), cy = Math.max(0, Math.min(m.h - 1, y));
    if (cx === x && cy === y) return m.t[y][x];
    const e = m.t[cy][cx], d = Math.max(Math.abs(x - cx), Math.abs(y - cy)), straight = cx === x || cy === y, h = hash2(x + m.w * 7, y + m.h * 13);
    if (straight && (e === 'road' || e === 'bridge')) return 'road';
    if (straight && e === 'river') return 'river';
    const k = Math.max(0, Math.min(1, (d - 2) / 4));
    const land = (1 - k) * (WET[e] ? 0 : 1) + k * vnoise(x + m.w * 3, y + m.h * 5, 5) > 0.5;
    if (!land) return h < 0.04 && d > 1 ? 'reef' : 'sea';
    if (d === 1 && (e === 'forest' || e === 'mountain' || e === 'waste' || e === 'swamp') && h < 0.75) return e;
    const n = vnoise(x + 91, y + 37, 3);
    return n > 0.7 ? 'mountain' : n > 0.52 ? 'forest' : h < 0.06 ? 'forest' : 'plain';
  }
  function apronNeed() {
    const mw = ts * S.map.w, mh = ts * S.map.h;
    // 滚动时地图能拖出界面条和触屏多留的那一圈，四周的远景要铺到那么宽，不露底色
    const ins = hudInsets(), ex = (Kit.dev === 'touch' || viewW() < 900) ? ts * 1.5 : 0;
    return { mx: scrollX ? Math.ceil((4 + ex) / ts) + 1 : Math.ceil(Math.max(0, (viewW() - mw) / 2) / ts) + 1, my: scrollY ? Math.ceil((Math.max(ins[0], ins[1], ts / 2) + ex) / ts) + 1 : Math.ceil(Math.max(0, (viewH() - mh) / 2) / ts) + 1 };
  }
  function apronCheck() {
    if (!S || !Art.renderMap) return;
    const n = apronNeed();
    if (apron && apron.map === S.map && apron.mx >= n.mx && apron.my >= n.my) return;
    if (apronBuilding && apronBuilding.map === S.map && apronBuilding.mx >= n.mx && apronBuilding.my >= n.my) return;
    buildApron(n.mx, n.my);
  }
  let apronBuilding = null;
  async function buildApron(mx, my) {
    const m = S.map, tok = ++apronTok, total = (m.w + 2 * mx) * (m.h + 2 * my);
    // 范围不大就整块渲染（中间被真地图盖住的部分填成平原，省时间）；大地图只渲染四条边
    const wins = total <= 3200 ? [{ x: -mx, y: -my, w: m.w + 2 * mx, h: m.h + 2 * my }]
      : [{ x: -mx, y: -my, w: m.w + 2 * mx, h: my }, { x: -mx, y: m.h, w: m.w + 2 * mx, h: my }, { x: -mx, y: 0, w: mx, h: m.h }, { x: m.w, y: 0, w: mx, h: m.h }];
    for (const w of wins) { // 每块四周多带一格，接边才对得上；画的时候裁掉
      const t = [], owner = [];
      for (let y = -1; y <= w.h; y++) {
        const r = [];
        for (let x = -1; x <= w.w; x++) { const X = w.x + x, Y = w.y + y; r.push(X >= 2 && Y >= 2 && X < m.w - 2 && Y < m.h - 2 ? 'plain' : outTerrain(m, X, Y)); }
        t.push(r); owner.push(new Array(r.length).fill(0));
      }
      w.st = { map: { w: w.w + 2, h: w.h + 2, t, owner } }; w.cv = [];
    }
    const a = { map: m, mx, my, wins }; apronBuilding = a;
    const n = DEMO ? 1 : (Art.FRAMES || 4);
    for (let f = 0; f < n; f++) {
      for (const w of wins) {
        if (tok !== apronTok || !S || S.map !== m) return;
        try { w.cv[f] = Art.renderMap(w.st, f); } catch (e) { console.error(e); return; }
        await new Promise(r => setTimeout(r, 0));
      }
      if (f === 0) apron = a;
    }
    if (apronBuilding === a) apronBuilding = null;
  }
  function drawApron() {
    const a = apron;
    if (a && a.map === S.map) {
      const top = Art.TOP || 0, oh = Math.min(MTOP, top);
      ctx.setTransform(sc, 0, 0, sc, bx, by);
      for (const w of a.wins) {
        const c = w.cv[frameNo] || w.cv[0]; if (!c) continue;
        ctx.drawImage(c, TILE, top + TILE - oh, w.w * TILE, w.h * TILE + oh, w.x * TILE, w.y * TILE - oh, w.w * TILE, w.h * TILE + oh);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 地图外面是“界外的远景”，不能和战争迷雾长得一样（迷雾是压暗）：这里去色、罩一层冷蓝灰，越靠屏幕边越深，再给棋盘加一圈边框
    const mw = S.map.w * tp, mh = S.map.h * tp, k = Math.max(1, Math.round(sc));
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cv.width, cv.height); ctx.rect(bx, by, mw, mh); ctx.clip('evenodd');
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.globalAlpha = 0.8; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(52,66,96,.46)'; ctx.fillRect(0, 0, cv.width, cv.height);
    const far = 5 * tp, band = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(16,20,34,0)'); g.addColorStop(1, 'rgba(16,20,34,.78)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
    band(bx, 0, bx - far, 0, 0, 0, bx, cv.height); band(bx + mw, 0, bx + mw + far, 0, bx + mw, 0, cv.width - bx - mw, cv.height);
    band(0, by, 0, by - far, bx, 0, mw, by); band(0, by + mh, 0, by + mh + far, bx, by + mh, mw, cv.height - by - mh);
    ctx.restore();
    // 棋盘边框：外面一圈深色粗线，里面贴一条亮线
    const ring = (o, t, c) => { ctx.fillStyle = c; ctx.fillRect(bx - o, by - o, mw + 2 * o, t); ctx.fillRect(bx - o, by + mh + o - t, mw + 2 * o, t); ctx.fillRect(bx - o, by - o, t, mh + 2 * o); ctx.fillRect(bx + mw + o - t, by - o, t, mh + 2 * o); };
    ring(4 * k, 3 * k, '#1a1f30'); ring(k, k, '#f2e6c4');
  }

  // ───────── 战争迷雾：给谁看、看得见哪些格子 ─────────
  let visMask = null, visP = 0, lastHuman = 0;
  // seeMask：核心 C.seeCells 给的“这一格有敌方单位看不看得见”（视野里没有己方单位贴着的森林、礁石、废墟等为 0）。
  // 只在 refreshVis（回合开始、单位动了、状态变了）和 revealAt 里取，不每帧算。画迷雾时视野外和这里为 0 的格子都压灰
  let seeMask = null;
  // 预演期间（单位已经摆到终点、行动还没定）的可见性由核心统一处理：C.setPreview 之后 C.canSee / C.vision / C.targets / C.unloadSpots 都按出发格算
  // 两件事分开问：darkOn = 开没开战争迷雾（画不画暗格、显不显示视野数值）；fogOn = 现在有没有“看不见的单位”（要不要按 C.canSee 过滤单位、
  // 走 C.resolveMove）。后者听核心的 C.veilOn：没开迷雾时，潜行的指挥官、灯火管制也会让单位看不见；核心没有这个函数就等同于前者
  const darkOn = () => !!(S && S.rules && S.rules.fog && C.vision);
  const fogOn = () => { if (!S || !C.vision) return false; try { if (C.veilOn) return !!C.veilOn(S); } catch (e) { } return darkOn(); };
  // 以谁的视角：一个玩家席位就一直是他；多人同屏用当前行动的玩家（电脑行动时沿用上一个玩家）；全电脑观战默认全图
  function viewer() {
    const hs = plist().filter(p => human[p]);
    if (hs.length === 1) return hs[0];
    if (hs.length > 1) return human[S.turn] ? S.turn : (lastHuman || hs[0]);
    return cfg.spec >= 1 && cfg.spec <= NP() ? cfg.spec : 0;
  }
  function refreshVis() {
    visMask = null; seeMask = null; visP = 0;
    if (!fogOn()) return;
    const p = viewer(); if (!p) return;
    try { visMask = Uint8Array.from(C.vision(S, p)); visP = p; } catch (e) { console.error(e); visMask = null; }
    if (visMask && darkOn() && C.seeCells) { try { seeMask = Uint8Array.from(C.seeCells(S, p)); } catch (e) { console.error(e); seeMask = null; } }
    miniDirty = true;
  }
  const seen = (x, y) => !visMask || visMask[y * S.map.w + x] === 1;
  // 这个单位画不画（敌方单位移动途中逐格的可见性另由 C.pathSeen 给，见 animMove / drawUnit）
  function unitSeen(q) {
    if (!visMask || !isEnemy(visP, q.owner)) return true;
    try { return C.canSee ? !!C.canSee(S, visP, q) : seen(q.x, q.y); } catch (e) { return seen(q.x, q.y); }
  }
  const unitAtV = (x, y) => { const q = C.unitAt(S, x, y); return q && unitSeen(q) ? q : null; };
  // 己方单位移动途中：走到哪一格，就把那一格看得到的范围并进来
  function revealAt(q, x, y) {
    if (!visMask || isEnemy(visP, q.owner)) return;
    const kx = q.x, ky = q.y;
    try {
      q.x = x; q.y = y; const v = C.vision(S, visP); for (let i = 0; i < v.length; i++) if (v[i]) visMask[i] = 1;
      if (seeMask) { const sv = C.seeCells(S, visP); for (let i = 0; i < sv.length; i++) if (sv[i]) seeMask[i] = 1; }
    } catch (e) { } finally { q.x = kx; q.y = ky; }
    miniDirty = true;
  }
  // 迷雾遮罩的一格：按八个方向的邻格是否可见，靠近可见格的那一侧从透明渐变到全盖。
  // 渐变宽 FOG_RAMP 个逻辑像素，分成 FOG_LV 级透明度；相邻两级之间再用有序抖动过渡（抖动只差一级，草地上看不出点阵）。
  // 遮罩是蓝灰色，不是纯黑。
  const fogTiles = new Map(), BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const FOG_RAMP = 16, FOG_LV = 8, FOG_RGB = [40, 50, 86], FOG_A = 0.66;
  function fogTile(key) { // 位：1 上 2 右 4 下 8 左 16 左上 32 右上 64 右下 128 左下（置位 = 那一格看得见）
    let c = fogTiles.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = FX;
    const g = c.getContext('2d'), img = g.createImageData(FX, FX), d = img.data, L = FX - 1;
    for (let y = 0; y < FX; y++) for (let x = 0; x < FX; x++) {
      let ds = 99;
      if (key & 1) ds = Math.min(ds, y); if (key & 4) ds = Math.min(ds, L - y); if (key & 8) ds = Math.min(ds, x); if (key & 2) ds = Math.min(ds, L - x);
      if (key & 16) ds = Math.min(ds, Math.hypot(x, y)); if (key & 32) ds = Math.min(ds, Math.hypot(L - x, y));
      if (key & 64) ds = Math.min(ds, Math.hypot(L - x, L - y)); if (key & 128) ds = Math.min(ds, Math.hypot(x, L - y));
      const t = Math.min(1, (ds + 0.5) / FOG_RAMP), e = t * t * (3 - 2 * t);
      const lv = Math.min(FOG_LV, Math.floor(e * FOG_LV + (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16));
      if (lv > 0) { const i = (y * FX + x) * 4; d[i] = FOG_RGB[0]; d[i + 1] = FOG_RGB[1]; d[i + 2] = FOG_RGB[2]; d[i + 3] = Math.round(255 * lv / FOG_LV); }
    }
    g.putImageData(img, 0, 0); fogTiles.set(key, c); return c;
  }
  // 这一格画不画迷雾：视野外，或者视野里但藏得住敌人（seeMask 为 0）
  const lit = i => visMask[i] === 1 && (!seeMask || seeMask[i] === 1);
  function drawFog(v) {
    if (!visMask) return;
    const w = S.map.w, h = S.map.h, vis = (x, y) => x >= 0 && y >= 0 && x < w && y < h && lit(y * w + x);
    ctx.globalAlpha = FOG_A;
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) {
      const i = y * w + x;
      if (lit(i)) continue;
      // 视野里藏得住敌人的格子（森林等）整格压灰、不留渐变边，和视野外的迷雾同一个颜色
      const key = visMask[i] ? 0 : (vis(x, y - 1) ? 1 : 0) | (vis(x + 1, y) ? 2 : 0) | (vis(x, y + 1) ? 4 : 0) | (vis(x - 1, y) ? 8 : 0) |
        (vis(x - 1, y - 1) ? 16 : 0) | (vis(x + 1, y - 1) ? 32 : 0) | (vis(x + 1, y + 1) ? 64 : 0) | (vis(x - 1, y + 1) ? 128 : 0);
      at(x, y); ctx.drawImage(fogTile(key), 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  // ───────── 特效：有 AWArtFx 用它，没有就用下面几个色块替身 ─────────
  const FB = {
    rangeTile(c, kind) { c.fillStyle = kind === 'attack' ? 'rgba(255,70,50,.45)' : kind === 'unload' ? 'rgba(90,220,120,.45)' : kind === 'threat' ? 'rgba(160,40,60,.4)' : 'rgba(70,160,255,.42)'; c.fillRect(1, 1, 30, 30); },
    pathSeg(c, from, to) { c.fillStyle = '#fff3c4'; c.fillRect(13, 13, 6, 6); for (const d of [from, to]) { if (d === 'left') c.fillRect(0, 13, 16, 6); if (d === 'right') c.fillRect(16, 13, 16, 6); if (d === 'up') c.fillRect(13, 0, 6, 16); if (d === 'down') c.fillRect(13, 16, 6, 16); } },
    cursor(c, f, kind) { c.fillStyle = kind === 'attack' ? '#e0453a' : kind === 'unload' ? '#8fd45a' : '#f3f0ea'; const o = [0, 1, 2, 1][f & 3]; for (const [x, y] of [[-o, -o], [23 + o, -o], [-o, 30 + o], [23 + o, 30 + o]]) c.fillRect(x, y, 9, 2); for (const [x, y] of [[-o, -o], [30 + o, -o], [-o, 23 + o], [30 + o, 23 + o]]) c.fillRect(x, y, 2, 9); },
    hpBadge(c, hp) { if (hp < 1 || hp > 9) return; c.fillStyle = '#25272c'; c.fillRect(23, 21, 9, 11); c.fillStyle = hp <= 3 ? '#ff8a5c' : '#f3f0ea'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(hp, 27.5, 27); },
    cargoBadge(c, n) { if (n < 1) return; c.fillStyle = '#e0b070'; c.fillRect(0, 21, 9, 11); c.fillStyle = '#5a3a34'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 4.5, 27); },
    stars(c, n) { c.fillStyle = '#ffc24a'; for (let i = 0; i < n; i++) c.fillRect(1 + i * 6, 1, 4, 4); },
    captureBar(c, p, P) { c.fillStyle = '#25272c'; c.fillRect(2, 0, 28, 6); c.fillStyle = (P && (P.m || P.main)) || '#fff'; c.fillRect(4, 1, Math.round(24 * p), 4); },
    digits(c, text, col) { c.font = 'bold 9px monospace'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillStyle = '#25272c'; c.fillText(text, 1, 1); c.fillStyle = col || '#fff'; c.fillText(text, 0, 0); return String(text).length * 6; },
    explosion(c, t) { const r = Math.round(4 + t * 12); c.globalAlpha *= 1 - t; c.fillStyle = t < 0.4 ? '#fff2a8' : '#ff7a2e'; c.fillRect(16 - r, 16 - r, r * 2, r * 2); },
    hit(c, t) { c.globalAlpha *= 1 - t; c.fillStyle = '#fff2a8'; c.fillRect(0, 0, 32, 32); },
    silo(c, t) { const r = Math.round(10 + t * 60); c.globalAlpha *= 1 - t; c.fillStyle = '#ffc24a'; c.fillRect(16 - r, 16 - r, r * 2, r * 2); },
    shell(c) { c.fillStyle = '#25272c'; c.fillRect(13, 13, 6, 6); c.fillStyle = '#ffc24a'; c.fillRect(14, 14, 4, 4); },
    // 喷火：从本格朝 (dx, dy) 喷到相邻格的一道火焰（AWArtFx 没有 flame 时用 ui-skin.js 里的像素火焰条）
    flame(c, t, dx, dy) { if (Skin.flame) return Skin.flame(c, t, dx, dy); c.globalAlpha *= 1 - t; c.fillStyle = '#ff7a2e'; c.fillRect(12 + dx * 20, 12 + dy * 20, 8 + Math.abs(dx) * 20, 8 + Math.abs(dy) * 20); },
  };
  FB.burn = (c, t, seed) => { if (Skin.burn) return Skin.burn(c, t, seed); c.globalAlpha *= 1 - t; c.fillStyle = '#ff7a2e'; c.fillRect(6, 10, 20, 18); }; // 森林烧起来（燎原）
  FB.digits.width = t => String(t).length * 6;
  const fxFn = name => { const F = window.AWArtFx; return (F && F[name]) || FB[name] || null; };
  // 占领进度旗：竖在格子左侧的旗杆，占领方颜色的小旗从杆底升到杆顶；T 是这一格的逻辑边长
  // 旗杆占格子高度的八成，旗子宽度超过格宽的三分之一；血量牌是右下角的数字牌，两者形状、位置都不一样
  // 占领标记：格子左上角一面三角小旗 + 一块写着“还剩多少占领值”的小牌。
  // 以前是一面沿旗杆上升的长方形旗，看着像横着的血条；现在是三角旗（形状不像条）+ 数字（一眼知道还差多少）
  function capFlag(c, p, P, T, f) {
    const col = (P && (P.m || P.main)) || '#fff', dk = (P && (P.d || P.dark)) || '#333', hi = (P && (P.h || P.l)) || '#fff';
    const left = Math.max(0, Math.min(20, Math.round(20 * (1 - Math.max(0, Math.min(1, p))))));
    const k = T / 32, x = Math.round(1 * k), y = Math.round(1 * k), bw = Math.round(15 * k), bh = Math.round(12 * k);
    // 小牌：深色底、阵营色边
    c.fillStyle = '#0e1220'; c.fillRect(x, y + Math.round(7 * k), bw, bh);
    c.fillStyle = col; c.fillRect(x + 1, y + Math.round(7 * k) + 1, bw - 2, bh - 2);
    c.fillStyle = '#141a2c'; c.fillRect(x + 2, y + Math.round(7 * k) + 2, bw - 4, bh - 4);
    c.save(); c.font = '900 ' + Math.round(9 * k) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText(String(left), x + bw / 2, y + Math.round(7 * k) + bh / 2 + 0.5); c.restore();
    // 牌子上方的三角小旗（随帧摆一下）
    const px = x + Math.round(3 * k), py = y, ph = Math.round(8 * k), w = Math.round(8 * k) + (f % 2 ? 0 : 1);
    c.fillStyle = '#0e1220'; c.fillRect(px - 1, py, 3, ph);
    c.fillStyle = '#e8ecf4'; c.fillRect(px, py + 1, 1, ph - 1);
    c.beginPath(); c.moveTo(px + 1, py); c.lineTo(px + 1 + w, py + Math.round(3 * k)); c.lineTo(px + 1, py + Math.round(6 * k)); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 1; c.strokeStyle = '#0e1220'; c.stroke();
    c.fillStyle = hi; c.fillRect(px + 2, py + Math.round(2 * k), Math.max(1, Math.round(2 * k)), 1);
  }
  function fxDraw(name, a, b, d) { const f = fxFn(name); if (!f) return; try { f(ctx, a, b, d); } catch (e) { console.error(e); } }
  // 往特效队列里加一个。x、y 是格子坐标；dur、delay 是毫秒（会乘动画时间系数）；演示模式不加
  function addFx(type, x, y, dur, extra) {
    const k = tf(); if (k <= 0 || !fxFn(type === 'num' ? 'digits' : type)) return;
    const e = extra || {};
    fx.push(Object.assign({ type, x, y, dur: dur * k, seed: (x * 31 + y * 17 + fx.length * 7 + (performance.now() | 0)) % 9973 }, e, { t0: performance.now() + (e.delay || 0) * k }));
  }
  function shake(amp, dur) { if (tf() > 0) shakeFx = { amp, dur: dur * tf(), t0: performance.now() }; }
  const onWater = (x, y) => { const t = S.map.t[y][x]; return t === 'sea' || t === 'river' || t === 'reef'; };

  // ───────── 绘制 ─────────
  let bx = 0, by = 0;
  const at = (x, y) => ctx.setTransform(fs, 0, 0, fs, bx + Math.round(x * tp), by + Math.round(y * tp));
  function unitPos(u, now) {
    if (anim && anim.u === u && anim.dur > 0) {
      // now 是 rAF 的帧时间，可能比动画开始时取的 performance.now() 还早，所以两头都要夹住
      const n = anim.path.length - 1, f = Math.max(0, Math.min(1, (now - anim.t0) / anim.dur)) * n, i = Math.max(0, Math.min(n - 1, Math.floor(f))), k = f - i;
      const a = anim.path[i], b = anim.path[i + 1];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, f];
    }
    return [u.x, u.y, 0];
  }
  // ───────── 单位素材：朝向、动作、取图 ─────────
  // 素材（AWSprites）解码完才用；没就绪或缺席时 sprOn() 为假，下面全部退回旧画法（32 像素的精灵按最近邻放大），游戏照常能玩
  const sprOn = () => { const A = window.AWSprites; try { return !!A && !!Art.unitSprite && !!A.ready && A.ready(); } catch (e) { return false; } };
  const hasSpr = k => sprOn() && (!Art.hasSprite || Art.hasSprite(k));
  const IV0 = { idle: 450, move: 110, attack: 90, hit: 80 };
  const IV = st => (Art.unitInterval && Art.unitInterval[st]) || IV0[st] || 100;            // 每帧毫秒数
  const defLeft = o => o > 0 && o % 2 === 0;                                                // 素材朝右；偶数编号的阵营默认朝左（和 art.js 一致）
  const faceMap = new WeakMap();                                                            // 单位 → 是否朝左（没记过就是阵营默认）
  const facing = q => { const v = faceMap.get(q); return v == null ? defLeft(q.owner) : v; };
  function faceTo(q, dx) { if (q && dx) faceMap.set(q, dx < 0); }                           // 目标在左边就朝左；正上正下不转
  const plays = new Map();                                                                  // 单位 → 正在播的一段动作 { state, t0, per, seq }
  const DOOR = [0, 1, 2, 2, 2, 1];                                                          // 运输单位、维修车的第三段（开舱门、放跳板、伸吊臂）：打开停一下再收回
  const doorOf = q => !!q && !D.UNITS[q.type].range && (!!D.UNITS[q.type].carry || q.type === 'rep');
  // 让单位播一段动作（attack / hit）。o：{ seq 帧序列, delay 毫秒 }。返回这段动作的总时长（毫秒，没乘动画时间系数；不演出时是 0）
  function play(q, state, o) {
    const k = tf(); if (!q || k <= 0 || !hasSpr(q.type)) return 0;
    o = o || {};
    const n = Art.unitFrames ? Art.unitFrames(q.type, state) : 1, seq = o.seq || Array.from({ length: n }, (_, i) => i);
    plays.set(q, { state, t0: performance.now() + (o.delay || 0) * k, per: IV(state) * k, seq });
    return seq.length * IV(state) + (o.delay || 0);
  }
  const openDoor = (q, delay) => doorOf(q) ? play(q, 'attack', { seq: DOOR, delay }) : 0;
  // 已经被核心移出 s.units 的单位：演出播完之前先留个替身
  function addGhost(q, pos) { if (!q || tf() <= 0 || ghosts.some(g => g.u === q)) return; ghosts.push({ u: q, type: q.type, owner: q.owner, x: pos ? pos.x : q.x, y: pos ? pos.y : q.y }); }
  function dropGhost(q, ms) { const g = gid, cut = () => { if (g === gid) ghosts = ghosts.filter(e => e.u !== q); }; if (ms > 0 && tf() > 0) setTimeout(cut, ms * tf()); else cut(); }
  // 这一帧这个单位画成什么样：状态、第几帧、朝向、是否压暗
  //   移动中 → move（朝向跟着这一段路走：向左翻转，上下保持）；正在播的动作 → attack / hit；
  //   已行动（轮到的阵营）→ 压暗、停在待机第 1 帧；其余 → 待机 2 帧循环，每个单位按编号错开相位
  const look = { state: 'idle', i: 0, left: false, dim: false };
  function unitLook(q, now, moving, fi, gh) {
    const L = look; L.state = 'idle'; L.i = 0; L.dim = false; L.left = facing(q);
    if (moving) {
      L.state = 'move'; L.i = Math.max(0, Math.floor((now - anim.t0) / anim.per));
      const d = anim.dirs; if (d) L.left = d[Math.max(0, Math.min(d.length - 1, Math.floor(fi)))];
      return L;
    }
    const p = plays.get(q);
    if (p) {
      const n = Math.floor((now - p.t0) / p.per);
      if (n >= p.seq.length) plays.delete(q);
      else if (n >= 0) { L.state = p.state; L.i = p.seq[n]; return L; }
    }
    if (!gh && q.moved && q.owner === S.turn && q !== sel) { L.dim = true; return L; }
    L.i = Math.floor((now / cfg.speed + ((q.id | 0) * 7919 % 900 + 900) % 900) / IV('idle')) & 1;
    return L;
  }
  // 测试读：各状态画了多少次、最近的状态切换、每个单位上一帧画的是什么
  const sprLog = { n: { idle: 0, move: 0, attack: 0, hit: 0 }, frames: { idle: new Set(), move: new Set(), attack: new Set(), hit: new Set() }, flip: 0, dim: 0, legacy: 0, ev: [], last: new Map() };
  function sprNote(q, L, sp) {
    sprLog.n[L.state]++; sprLog.frames[L.state].add(L.i); if (L.left !== defLeft(q.owner)) sprLog.flip++; if (L.dim) sprLog.dim++;
    let e = sprLog.last.get(q.id);
    if (!e) { e = { state: '', i: 0, left: false, dim: false, w: 0, h: 0, dx: 0, dy: 0, tp: 0, x: 0, y: 0 }; sprLog.last.set(q.id, e); }
    if (e.state !== L.state || e.left !== L.left) { sprLog.ev.push({ id: q.id, type: q.type, owner: q.owner, state: L.state, left: L.left }); if (sprLog.ev.length > 400) sprLog.ev.shift(); }
    e.state = L.state; e.i = L.i; e.left = L.left; e.dim = L.dim; e.w = sp.width; e.h = sp.height; e.dx = sp.dx; e.dy = sp.dy; e.tp = tp;
  }
  // 还能再动：这回合打过一次、核心又把它放出来的单位。fired = 只能再移动；kills（没有 fired）= 整个再行动一次
  const canAgain = q => !!q && !!S && q.owner === S.turn && !q.moved && !!(q.fired || q.kills);
  // 单位本体。新素材：按格子的物理像素取完整尺寸的图（比格子大一圈），不缩放、贴在整数像素上；没有素材：旧的 32 像素精灵按最近邻放大。
  // 血量牌这些标记不在这里画（下面的格子里的单位会盖住它们），先记进 marks，等所有单位画完再统一画
  const marks = [];
  function drawUnit(q, now, v, gh) {
    const moving = !gh && !!anim && anim.u === q && anim.dur > 0, pos = gh ? null : unitPos(q, now);
    const px = gh ? gh.x : pos[0], py = gh ? gh.y : pos[1], fi = gh ? 0 : pos[2];
    if (px < v.x0 - 1 || px > v.x1 + 1 || py < v.y0 - 1 || py > v.y1 + 1) return 0;
    if (!gh) {
      // 敌方单位移动途中：走到哪一格看不看得见听 C.pathSeen（anim.seen，和路径等长）
      if (moving && anim.seen) { if (!anim.seen[Math.max(0, Math.min(anim.seen.length - 1, Math.round(fi)))]) return 0; }
      else if (!unitSeen(q)) return 0;
    }
    const L = unitLook(q, now, moving, fi, gh), tx = bx + Math.round(px * tp), ty = by + Math.round(py * tp);
    let sp = null;
    // 隐形兵种：夜鸦隐蔽时画成半透明（ghost）；潜渊舰下潜时换成下潜的素材（bds_dive），开火那几帧浮上来
    if (hasSpr(q.type)) { try { const fo = artCode(q.owner), vl = veilOf(q), dive = vl === 'dive' && L.state !== 'attack' && hasSpr(q.type + '_dive'); sp = Art.unitSprite(dive ? q.type + '_dive' : q.type, fo, L.dim, tp, 0, { state: L.state, i: L.i, flip: L.left !== artLeft(fo), ghost: vl === 'ghost' }); } catch (e) { console.error(e); } }
    if (sp) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sp, tx + sp.dx, ty + sp.dy); sprNote(q, L, sp); }
    else {
      ctx.setTransform(sc, 0, 0, sc, tx, ty); sprLog.legacy++;
      let old = null; try { old = Art.unit(q.type, artCode(q.owner), L.dim, TILE, L.dim ? 0 : frameNo); } catch (e) { console.error(e); }
      if (old) { const hh = old.height * TILE / old.width; ctx.drawImage(old, 0, TILE - hh, TILE, hh); } // 精灵比一格高的部分（天线、旋翼）往上探
    }
    if (q.ore) { // 强化单位：脚下一圈炽光（橙白，轻轻呼吸，叠加在单位上），和血量牌、占领旗、增益标记都不在一个位置
      ctx.setTransform(1, 0, 0, 1, 0, 0); const cx = tx + tp / 2, cy = ty + tp * 0.86, a = 0.7 + 0.25 * Math.sin(now / 300 + q.x);
      const g = ctx.createRadialGradient(cx, cy, tp * 0.08, cx, cy, tp * 0.5); g.addColorStop(0, `rgba(255,236,170,${a})`); g.addColorStop(0.5, `rgba(255,138,60,${a * 0.7})`); g.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy); ctx.scale(1, 0.42); ctx.translate(-cx, -cy); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, tp * 0.5, 0, 7); ctx.fill(); ctx.restore(); }
    if (!gh) marks.push(q, tx, ty, moving ? 1 : 0, sp ? 1 : 0);
    return 1;
  }
  // 单位身上的标记：血量牌（右下）、载员牌（左下）、军衔星（左上）、“可再行动”箭头牌（右上）、占领进度条（头顶上方）。
  // 用新素材时单位占了大半格，标记按“标记像素”画：一个标记像素 = K 个物理像素（整数），K 取到一格约 32–40 个标记像素宽，
  // 所以牌子缩在四个角上、不压单位的脸；占领条浮在格子上沿外面一点。旧画法保持原来的比例（K = sc）。
  // 格子小于 SMALL_TS 屏幕像素时换成简化样式（Skin.miniMarks）：实心色块的血量牌，别的只留色点
  function drawMarks() {
    const small = ts < SMALL_TS && !!Skin.miniMarks;
    for (let i = 0; i < marks.length; i += 5) {
      const q = marks[i], tx = marks[i + 1], ty = marks[i + 2], moving = marks[i + 3], spr = marks[i + 4];
      const hp = C.dispHp(q), cap = !moving && S.map.cap[q.y][q.x] < 20 ? (20 - S.map.cap[q.y][q.x]) / 20 : -1, again = !moving && q !== sel && canAgain(q);
      if (hp >= 10 && !q.cargo.length && !q.stars && cap < 0 && !again) continue;
      if (small) {
        ctx.setTransform(1, 0, 0, 1, tx, ty);
        try { Skin.miniMarks(ctx, tp, { hp, cargo: q.cargo.length, stars: q.stars || 0, cap, pal: pal(q.owner), again, full: !q.fired, f: frameNo }); } catch (e) { console.error(e); }
        continue;
      }
      const K = spr ? Math.max(1, Math.round(tp / 38)) : fs, far = tp - FX * K;
      const corner = (r, b) => ctx.setTransform(K, 0, 0, K, tx + (r ? far : 0), ty + (b ? far : 0));
      if (hp < 10) { corner(1, 1); fxDraw('hpBadge', hp); }
      if (q.cargo.length) { corner(0, 1); fxDraw('cargoBadge', q.cargo.length); }
      if (q.stars) { corner(0, 0); fxDraw('stars', q.stars); }
      if (cap >= 0) { ctx.setTransform(K, 0, 0, K, tx, ty); capFlag(ctx, cap, pal(q.owner), Math.round(tp / K), frameNo); } // 占领进度：格子左边一根旗杆，旗子随进度往上升（不再是头顶的横条，免得像血条）
      // 打完还能再动的单位（核心把 moved 置回了 false）：右上角一块一闪一闪的箭头牌，和普通未行动、已行动都分得开
      if (again && Skin.againBadge) { corner(1, 0); try { Skin.againBadge(ctx, frameNo, !q.fired); } catch (e) { } }
    }
    marks.length = 0;
  }
  function edgesOf(has, x, y) {
    return { up: !has(x, y - 1), down: !has(x, y + 1), left: !has(x - 1, y), right: !has(x + 1, y), ul: !has(x - 1, y - 1), ur: !has(x + 1, y - 1), dl: !has(x - 1, y + 1), dr: !has(x + 1, y + 1) };
  }
  function drawMask(v, has, kind) {
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) if (has(x, y)) { at(x, y); fxDraw('rangeTile', kind, frameNo, edgesOf(has, x, y)); }
  }
  function drawList(v, list, kind) {
    const w = S.map.w, set = new Set(list.map(q => q[1] * w + q[0])), has = (x, y) => x >= 0 && y >= 0 && x < w && y < S.map.h && set.has(y * w + x);
    for (const [x, y] of list) if (x >= v.x0 && x <= v.x1 && y >= v.y0 && y <= v.y1) { at(x, y); fxDraw('rangeTile', kind, frameNo, edgesOf(has, x, y)); }
  }
  const dirOf = (a, b) => b[0] > a[0] ? 'right' : b[0] < a[0] ? 'left' : b[1] > a[1] ? 'down' : 'up';
  let stat = { units: 0, tiles: 0, fx: 0 };

  // 查看范围用的轻色铺底：格子里淡淡一层颜色，范围外沿描一圈实线，不把单位和建筑染脏
  function drawZone(v, has, rgb, a) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const lw = Math.max(2, Math.round(tp / 14));
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) {
      if (!has(x, y)) continue;
      const X = bx + x * tp, Y = by + y * tp;
      ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')'; ctx.fillRect(X, Y, tp, tp);
      ctx.fillStyle = 'rgba(' + rgb + ',.92)';
      if (!has(x, y - 1)) ctx.fillRect(X, Y, tp, lw); if (!has(x, y + 1)) ctx.fillRect(X, Y + tp - lw, tp, lw);
      if (!has(x - 1, y)) ctx.fillRect(X, Y, lw, tp); if (!has(x + 1, y)) ctx.fillRect(X + tp - lw, Y, lw, tp);
    }
  }
  // 建筑的区域效果（雷达塔这类，C.auraCells）：光标停在上面时亮出作用范围——阵营色的细虚线描边 + 很淡的填充，和移动 / 攻击范围的样子不同
  let auraKey = '', auraSet = null;
  function drawAura(v) {
    if (!C.auraCells || !(mode === 'idle' || mode === 'inspect' || mode === 'menu')) return;
    const m = S.map, w = m.w, k = cur.x + ',' + cur.y + ',' + m.owner[cur.y][cur.x] + ',' + m.t[cur.y][cur.x];
    if (k !== auraKey) { auraKey = k; auraSet = null; try { const c = C.auraCells(S, cur.x, cur.y); if (Array.isArray(c) && c.length) auraSet = new Set(c.map(q => Array.isArray(q) ? q[1] * w + q[0] : q)); } catch (e) { } }
    if (!auraSet) return;
    const P = pal(m.owner[cur.y][cur.x]), has = (x, y) => x >= 0 && y >= 0 && x < w && y < m.h && auraSet.has(y * w + x), lw = Math.max(2, Math.round(tp / 16)), dash = Math.max(4, Math.round(tp / 6));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) {
      if (!has(x, y)) continue;
      const X = bx + x * tp, Y = by + y * tp;
      ctx.globalAlpha = 0.1; ctx.fillStyle = P.h || P.l; ctx.fillRect(X, Y, tp, tp); ctx.globalAlpha = 1; ctx.fillStyle = P.h || P.l;
      for (let d = 0; d < tp; d += dash * 2) { const n = Math.min(dash, tp - d);
        if (!has(x, y - 1)) ctx.fillRect(X + d, Y, n, lw); if (!has(x, y + 1)) ctx.fillRect(X + d, Y + tp - lw, n, lw);
        if (!has(x - 1, y)) ctx.fillRect(X, Y + d, lw, n); if (!has(x + 1, y)) ctx.fillRect(X + tp - lw, Y + d, lw, n); }
    }
  }
  // 选中单位后，这回合打得到的敌人：脚下一个红色准星框，轻微闪动
  function drawReticles(v, now) {
    if (!hitSet || mode !== 'move') return;
    const w = S.map.w, lw = Math.max(3, Math.round(tp / 10)), len = Math.round(tp * 0.32), o = Math.round(tp * 0.05 * (1 + Math.sin(now / 150))), a = 0.75 + 0.25 * Math.sin(now / 150);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const corners = (X, Y, T, t, col) => { ctx.fillStyle = col; for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const x0 = X + (cx ? T - len : 0), y0 = Y + (cy ? T - len : 0); ctx.fillRect(x0, Y + (cy ? T - t : 0), len, t); ctx.fillRect(X + (cx ? T - t : 0), y0, t, len); } };
    for (const i of hitSet) {
      const x = i % w, y = (i - x) / w; if (x < v.x0 || x > v.x1 || y < v.y0 || y > v.y1) continue;
      const X = bx + x * tp - o, Y = by + y * tp - o, T = tp + 2 * o, e = Math.max(1, Math.round(lw / 3));
      corners(X - e, Y - e, T + 2 * e, lw + 2 * e, 'rgba(14,18,32,.9)'); corners(X, Y, T, lw, 'rgba(255,72,56,' + a.toFixed(2) + ')');
    }
  }
  function draw(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    frameNo = Math.floor(now / 250) % 4;
    if (!S) { drawBg(now); return; }
    ctx.fillStyle = '#1b2a5c'; ctx.fillRect(0, 0, cv.width, cv.height);
    const ck = cur.x + ',' + cur.y;
    if (ck !== lastCurKey) { lastCurKey = ck; if (human[S.turn] || cfg.follow) followCursor(); }
    stepCam(now);
    if (mapDirty && !(DEMO && now - lastWarm < 1500)) warm();
    const m = S.map, w = m.w, h = m.h;
    bx = oxp; by = oyp;
    if (shakeFx) {
      const k = (now - shakeFx.t0) / shakeFx.dur;
      if (k >= 1) shakeFx = null;
      else if (k >= 0) { const a = shakeFx.amp * (1 - k) * fs; bx += Math.round(Math.sin(now / 17) * a); by += Math.round(Math.cos(now / 13) * a); }
    }
    const v = visRange();
    drawApron();
    // 地图：只贴视野内那一块（上面多带 16 逻辑像素，是上一行建筑探出来的部分）
    const mc = mapCvs[frameNo % Math.max(1, mapCvs.length)] || mapCvs[0];
    if (mc && v.x1 >= v.x0 && v.y1 >= v.y0) {
      const top = mc._top || 0, sx = v.x0 * TILE, sy = v.y0 * TILE, sw = (v.x1 - v.x0 + 1) * TILE, sh = (v.y1 - v.y0 + 1) * TILE + top;
      ctx.setTransform(sc, 0, 0, sc, bx, by);
      ctx.drawImage(mc, sx, sy, sw, sh, sx, sy - top, sw, sh);
    }
    stat.tiles = Math.max(0, (v.x1 - v.x0 + 1) * (v.y1 - v.y0 + 1));
    if (cfg.grid) { // 淡格线：每条线 1 个物理像素（高分屏 2 个）
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(18,20,26,.26)';
      const lw = Math.max(1, Math.round(dpr * 0.75)), x0 = bx + v.x0 * tp, y0 = by + v.y0 * tp, gw = (v.x1 - v.x0 + 1) * tp, gh = (v.y1 - v.y0 + 1) * tp;
      for (let x = v.x0; x <= v.x1 + 1; x++) ctx.fillRect(bx + x * tp - (x > v.x0 ? lw : 0), y0, lw, gh);
      for (let y = v.y0; y <= v.y1 + 1; y++) ctx.fillRect(x0, by + y * tp - (y > v.y0 ? lw : 0), gw, lw);
    }
    const inb = (x, y) => x >= 0 && y >= 0 && x < w && y < h;

    drawAura(v);
    if (reachMask && mode === 'move') {
      drawMask(v, (x, y) => inb(x, y) && reachMask[y * w + x] > 0, 'move'); // 范围连成一整片，中间不留缺口
      // 只能路过、不能停的格子（上面站着友军）：再压一层暗色斜纹，一眼看出“到得了但停不下”
      for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) if (inb(x, y) && reachMask[y * w + x] === 2) {
        at(x, y); const T = FX;
        ctx.fillStyle = 'rgba(18,26,48,.34)'; ctx.fillRect(0, 0, T, T);
        ctx.fillStyle = 'rgba(18,26,48,.38)';
        for (let k = -T; k < T; k += 8) for (let j = 0; j < T; j++) { const px = k + j; if (px >= 0 && px < T) ctx.fillRect(px, j, 2, 1); }
      }
    }
    if (hitSet && mode === 'move') drawZone(v, (x, y) => inb(x, y) && hitSet.has(y * w + x), '255,72,56', 0.2);
    if (peek && !S.units.includes(peek.u)) peek = null;   // 查看的单位没了（被击毁、装进运输单位）
    const insp = peek || inspect;                          // 按住查看的那个单位优先；没有就是“范围常显”的那个
    if (insp) {
      drawZone(v, (x, y) => inb(x, y) && insp.mv[y * w + x] === 1, '70,150,255', 0.22);   // 蓝：它能走到的格子
      drawZone(v, (x, y) => inb(x, y) && insp.at[y * w + x] === 1, '255,72,56', 0.16);    // 红：它能打到的格子（远程不能移动后开火的只算原地）
    }
    if (mode === 'target') drawList(v, targets.map(t => [t.x, t.y]), 'attack');
    if (mode === 'unload') drawList(v, spots, 'unload');
    if (mode === 'silo') drawList(v, C.siloArea(S, cur.x, cur.y), 'attack');

    // 路径箭头
    if (mode === 'move' && reach) {
      const i = aim ? aim.stand[1] * w + aim.stand[0] : cur.y * w + cur.x;
      if (reach.dist[i] < Infinity && reach.dist[i] > 0) {
        const p = C.path(reach.prev, i, w);
        for (let k = 0; k < p.length; k++) {
          const q = p[k]; if (q[0] < v.x0 || q[0] > v.x1 || q[1] < v.y0 || q[1] > v.y1) continue;
          at(q[0], q[1]); fxDraw('pathSeg', k ? dirOf(q, p[k - 1]) : null, k < p.length - 1 ? dirOf(q, p[k + 1]) : null, k === p.length - 1);
        }
      }
      // 直接点目标、要先移动才打得到：落点那一格再描一圈亮框，看清会停在哪儿再确认
      if (aim && aim.moves) { const sx = aim.stand[0], sy = aim.stand[1]; drawZone(v, (x, y) => x === sx && y === sy, '255,243,196', 0.3); }
    }
    // 单位：只画视野内、看得见的。单位比格子大一圈，所以按行从上到下画（下面一行的盖住上面一行的），同一行里飞机压在最上面；
    // 正在移动的单位按它此刻所在的行排
    const us = [];
    for (const q of S.units) { if ((anim && anim.u === q) || (q.x >= v.x0 - 1 && q.x <= v.x1 + 1 && q.y >= v.y0 - 1 && q.y <= v.y1 + 1)) us.push(q); }
    const rowOf = q => (anim && anim.u === q && anim.dur > 0) ? unitPos(q, now)[1] : q.y;
    us.sort((a, b) => rowOf(a) - rowOf(b) || (D.UNITS[a.type].air ? 1 : 0) - (D.UNITS[b.type].air ? 1 : 0));
    let n = 0; for (const q of us) n += drawUnit(q, now, v);
    stat.units = n;
    // 被击毁、演出还没播完的单位
    for (const g of ghosts) if (!visMask || !isEnemy(visP, g.owner) || seen(g.x, g.y)) drawUnit(g.u, now, v, g);
    drawMarks();
    drawTechMarks(v, now);
    drawGoalMarks(v, now);
    drawReticles(v, now);
    drawFog(v);
    drawSight(v, insp);   // 它的视野：视野外压暗、边缘一圈虚线

    // 光标
    if (mode !== 'over') {
      at(cur.x, cur.y);
      fxDraw('cursor', frameNo, (mode === 'target' || mode === 'silo') ? 'attack' : mode === 'unload' ? 'unload' : mode === 'ai' ? 'ai' : 'normal');
    }
    // 特效（迷雾里的不画）
    let keep = 0, drawn = 0;
    for (let i = 0; i < fx.length; i++) {
      const f = fx[i], k = (now - f.t0) / f.dur;
      if (k >= 1) continue;
      fx[keep++] = f;
      if (k < 0 || f.type === 'ambush') continue;
      let X = f.x, Y = f.y, a, b;
      if (f.type === 'shell') { // 抛物线：越远弧越高
        const dx = f.tx - f.x, dy = f.ty - f.y, arc = f.arc || 0;
        X = f.x + dx * k; Y = f.y + dy * k - arc * Math.sin(Math.PI * k);
        const vx = dx, vy = dy - arc * Math.PI * Math.cos(Math.PI * k), L = Math.hypot(vx, vy) || 1;
        a = vx / L; b = vy / L;
      }
      if (X < v.x0 - 3 || X > v.x1 + 3 || Y < v.y0 - 3 || Y > v.y1 + 3) continue;
      if (visMask) { const gx = Math.round(f.type === 'shell' ? f.x + (f.tx - f.x) * k : X), gy = Math.round(f.type === 'shell' ? f.y + (f.ty - f.y) * k : Y); if (inb(gx, gy) && !seen(gx, gy)) continue; }
      drawn++;
      if (f.type === 'num') {
        const wd = (fxFn('digits').width || (() => 0))(f.text), z = 2;
        ctx.setTransform(fs * z, 0, 0, fs * z, bx + Math.round(X * tp) + Math.round((16 - wd * z / 2) * fs), by + Math.round(Y * tp) + Math.round((2 - 16 * k) * fs));
        ctx.globalAlpha = Math.min(1, 3 - 3 * k);
        fxDraw('digits', f.text, f.col); ctx.globalAlpha = 1;
      } else {
        if (f.type === 'silo') ctx.setTransform(fs * 2, 0, 0, fs * 2, bx + Math.round(X * tp) - tp / 2, by + Math.round(Y * tp) - tp / 2); // 大爆炸放大一倍，盖住 2 格半径
        else at(X, Y);
        if (f.type === 'tracer') { // 一小段亮线从枪口飞向目标（at() 之后一格是 32 个单位）
          const dx = (f.tx - f.x) * 32, dy = (f.ty - f.y) * 32, h = Math.min(1, k * 1.15), t0 = Math.max(0, h - 0.35);
          ctx.lineCap = 'round';
          for (const [col, wd] of [['rgba(255,170,60,.55)', 4], ['#fff6c8', 1.6]]) { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(16 + dx * t0, 13 + dy * t0); ctx.lineTo(16 + dx * h, 13 + dy * h); ctx.stroke(); }
        } else
        if (f.type === 'shell') fxDraw('shell', k, a, b);
        else if (f.type === 'explosion') fxDraw('explosion', k, f.seed, f.kind);
        else if (f.type === 'muzzle') fxDraw('muzzle', k, f.dir);
        else if (f.type === 'flame') fxDraw('flame', k, f.dx, f.dy);
        else if (f.type === 'capture') fxDraw('capture', k, f.pal);
        else fxDraw(f.type, k, f.seed);
        ctx.globalAlpha = 1;
      }
    }
    fx.length = keep; stat.fx = drawn;
    drawHud(now);
  }

  // ───────── 常驻界面：阵营牌、信息牌、伤害预览、横幅、提示都是叠在画布上的大号面板（ui-battle.js 的 HUD）；
  // 画在画布上的只剩小地图和单位头上的弹牌 ─────────
  const hud = { mini: null, miniPanel: null, miniBtn: null };
  let fcast = null, bnText = '', bnOn = null, loadingOn = false, hudM = null;
  // 单位此刻受到的建筑增益（C.auraOf）：整理成 ['雷达 攻击 +10%', …]。雷达塔在这里用短名“雷达”（单独一个键，不从长名里截字）
  function auraText(q) {
    let a = null; try { a = C.auraOf ? C.auraOf(S, q) : null; } catch (e) { }
    if (!a) return [];
    const one = it => { if (!it || typeof it !== 'object') return ''; const n = it.t === 'tower' ? tt('雷达') : it.name || it.label || (it.t && D.TERRAIN[it.t] && D.TERRAIN[it.t].name) || tt('建筑增益'), ps = []; if (it.atk) ps.push(tt('攻击 {v}', { v: pct(it.atk) })); if (it.def) ps.push(tt('防御 {v}', { v: pct(it.def) })); if (it.text) ps.push(it.text); return ps.length ? String(n) + ' ' + ps.join(' ') : ''; };
    return (Array.isArray(a) ? a.map(one) : [one(a)]).filter(Boolean);
  }
  // 范围增益来自哪些建筑（细条上的小标记只写名字：雷达）
  function auraNames(q) { let a = null; try { a = C.auraOf ? C.auraOf(S, q) : null; } catch (e) { } if (!a) return []; return [...new Set((Array.isArray(a) ? a : [a]).filter(it => it && typeof it === 'object').map(it => it.t === 'tower' ? tt('雷达') : it.name || (it.t && D.TERRAIN[it.t] && D.TERRAIN[it.t].name) || '').filter(Boolean))]; }
  // 隐形兵种此刻的状态：'ghost' = 隐蔽（夜鸦一直是）；'dive' = 下潜（潜渊舰上一个己方回合没开过火）；'' = 没有。和核心 canSee 里的判断一致
  const veilOf = q => { const k = q && D.UNITS[q.type] && D.UNITS[q.type].cloak; return k === true ? 'ghost' : k === 'idle' && !q.shot ? 'dive' : ''; };
  const uiW = () => cv.width / U, uiH = () => cv.height / U;
  const tileCss = (x, y) => ({ x: ox + x * ts, y: oy + y * ts, w: ts, h: ts });
  // 左上角的阵营牌：当前行动方的指挥官头像、阵营名、第几天、资金、技能槽
  // 第二种资源（D.RES）开没开：对局选项 rules.ore，核心没有这种资源时也算没开
  const oreOn = () => !!(S && D.RES && S.ore && !(S.rules && S.rules.ore === false));
  // 回合开始和行动带来的资源事件（s.events）：拾取碎片堆在那一格飘“+N”（闪光 + 拾取音），回合开始的产出在阵营牌上飘“+N”；
  // 击毁敌方的强化单位（bounty）：击毁方分到的在那一格飘“+N 碎片”；陨星矿采完变成山地（mineGone）：重画这一格，飘一句提示
  function oreEvents() {
    if (!S || !Array.isArray(S.events)) return;
    for (const e of S.events) { if (!e || e._ore) continue; if (e.type !== 'pickup' && e.type !== 'ore' && e.type !== 'bounty' && e.type !== 'mineGone') continue; e._ore = true; lastOre = { type: e.type, amount: e.amount, x: e.x, y: e.y };
      if (e.type === 'bounty') { if (tf() <= 0 || (visMask && !seen(e.x, e.y))) continue; fx.push({ type: 'ambush', big: true, rise: true, tone: 'gold', text: '+' + e.amount + ' ' + D.RES.short, x: e.x, y: e.y, dur: 1500 * Math.max(0.3, tf()), t0: performance.now() }); continue; }
      if (e.type === 'mineGone') { checkMap(); if (tf() <= 0 || (visMask && !seen(e.x, e.y))) continue; fx.push({ type: 'ambush', tone: 'warn', text: tt('{name}已采完，变为山地', { name: D.RES.mine }), x: e.x, y: e.y, dur: 1800 * Math.max(0.3, tf()), t0: performance.now() }); continue; }
      if (e.type === 'pickup') { checkMap(); if (tf() <= 0 || (visMask && !seen(e.x, e.y))) continue; sfx.captured(); addFx('levelup', e.x, e.y, 900); addFx('hit', e.x, e.y, 260); fx.push({ type: 'ambush', big: true, rise: true, tone: 'gold', text: '+' + e.amount + ' ' + D.RES.short, x: e.x, y: e.y, dur: 1500 * Math.max(0.3, tf()), t0: performance.now() }); }
      else if (e.player === S.turn && e.amount > 0 && tf() > 0 && (human[S.turn] || !visMask)) HUD.float('+' + e.amount, 'ore'); }
  }
  let lastOre = null;
  function statusModel() {
    const p = S.turn, co = coOf(p); let pw = null; try { pw = C.powerInfo ? C.powerInfo(S, p) : null; } catch (e) { }
    const mm = Math.min(1, (S.meter[p] || 0) / D.METER_MAX);
    return { p, name: pname(p), day: S.day, ore: oreOn() ? ((S.ore && S.ore[p]) || 0) : null, rp: techOn() && S.rp ? (S.rp[p] || 0) : null, funds: S.funds[p] || 0, meter: mm, full: mm >= 1, powers: powersOn(), co: S.co[p], coName: co ? co.name : '', power: (pw && pw.name) || (co ? co.power : ''),
      techIdle: techMark(), ai: !human[p] && !S.winner, demo: DEMO, tag: (NP() > 2 || hasTeams()) ? teamTag(p) : '',
      others: NP() > 2 ? plist().filter(q => q !== p && isAlive(q)).map(q => ({ p: q, funds: S.funds[q] || 0 })) : [] };   // 多方对局：其余阵营的资金（细条上是徽记 + 数字）
  }
  // 运输单位里装着的单位，逐个列出来（信息条、详情卡、卸载菜单共用）：HP 和场上单位一样用显示 HP
  const cargoOf = q => ((q && q.cargo) || []).map(c => ({ type: c.type, owner: c.owner || q.owner, name: D.UNITS[c.type].name, hp: C.dispHp(c), stars: c.stars || 0, ore: !!c.ore }));
  // 光标所在格的内容：地形、防御星、归属；有看得见的单位时再加一行
  function infoModel() {
    const m = S.map, t = m.t[cur.y][cur.x], T = D.TERRAIN[t], q = unitAtV(cur.x, cur.y), cap = m.cap[cur.y][cur.x];
    let unit = null, capBy = 0;
    if (q) {
      // 每一帧都从 state 现读：已行动、已开火、加成都不在界面这边另存一份
      const tags = unitTags(q.type);
      const buff = unitBuff(q), M = buff.mods;
      if (q.fired && !q.moved && q.owner === S.turn) tags.push(tt('已攻击 可再次移动'));
      else if (canAgain(q)) tags.push(tt('可再次行动'));
      if (M && M.fullAtk) tags.push(tt('攻击不随 HP 降低'));
      if (M && Array.isArray(M.luck) && (M.luck[0] !== 0 || M.luck[1] !== 9)) tags.push(tt('运气 {a} 至 +{b}', { a: M.luck[0], b: M.luck[1] }));
      unit = { type: q.type, owner: q.owner, name: D.UNITS[q.type].name, hp: C.dispHp(q), stars: q.stars || 0, cargo: q.cargo.length, moved: !!q.moved, fired: !!q.fired, again: canAgain(q),
        vision: darkOn() ? ((M && M.vision) || D.UNITS[q.type].vision || 0) : 0, left: q.fired && !q.moved && M ? M.move : null, tags, buff };
      try { if (cap < 20 && C.canCapture(S, q)) capBy = capPow(q); } catch (e) { }
      unit.cargoList = cargoOf(q);   // 搭载的每个单位（兵种、HP、军衔、强化）：看得见这个运输单位就看得见里面装了什么，核心对乘客没有另外的隐藏规则
      unit.aura = auraText(q); unit.ore = !!q.ore; unit.auraNames = auraNames(q); unit.veil = veilOf(q) === 'dive' ? tt('下潜') : veilOf(q) ? tt('隐蔽') : '';
    }
    // capBy：占着这一格的单位下次占领会扣多少占领值（C.capPower，指挥官可能有倍数）
    // 陨星矿：还剩几份（C.mineLeft；每座矿的储量有限，自由对局里采完就变成山地，“已采完”只会出现在战役里）
    let mineTip = '';
    if (t === 'mine' && D.RES && C.mineLeft && !(S.rules && S.rules.ore === false)) { const left = C.mineLeft(S, cur.x, cur.y); if (left != null && left !== Infinity) mineTip = left > 0 ? tt('剩余 {n} 份{name}', { n: left, name: D.RES.name }) : tt('已采完'); }
    return { t, name: T.name, def: T.def, tip: t === 'shard' && D.RES ? T.note || '' : mineTip, tipShort: t === 'shard' && D.RES ? tt('可拾取 {n} 份{name}', { n: C.shardLeft ? C.shardLeft(S, cur.x, cur.y) : D.RES.shardMax, name: D.RES.name }) : mineTip, prop: !!T.prop, owner: m.owner[cur.y][cur.x], cap: cap < 20 && q ? cap : null, capBy, unit };
  }
  // ── 小地图：默认收成右下角一个图标；按 N、点图标展开。地图明显比一屏大时默认展开 ──
  let miniK = 3, miniBase = null, miniDirty = true, miniPref = lsGet('steel-tide.mini'), miniKey = '', miniCv = null, miniDown = false;
  // 默认：地图明显比一屏大（宽或高超过窗口的 1.25 倍）才展开；只是差一点点放不下的小图不用小地图
  const miniOpen = () => miniPref === '1';   // 默认收起；Select / N 展开
  function miniLayout() {
    if (!S) return;
    const m = S.map, box = innerWidth < 900 ? 132 : 184, kp = Math.max(1, Math.round(Math.max(2, Math.min(6, Math.floor(box / Math.max(m.w, m.h)))) * dpr));
    miniK = kp / dpr; miniDirty = true; miniKey = '';
  }
  function toggleMini() { miniPref = miniOpen() ? '0' : '1'; lsSet('steel-tide.mini', miniPref); miniDirty = true; miniKey = ''; }
  function drawMini() {
    const m = S.map;
    if (!miniOpen()) {
      hud.miniBtn = hud.miniPanel = hud.mini = null; return;
    }
    const kp = Math.round(miniK * dpr), cw = m.w * kp, chh = m.h * kp;         // 物理像素
    const w = Math.ceil(cw / U) + 6, h = Math.ceil(chh / U) + 6, x = Math.round(uiW() - 6 - w), y = Math.round(110 * Kit.s / u);   // 右上角，喇叭图标下面
    const key = frameNo + '|' + oxp + '|' + oyp + '|' + S.units.length + '|' + S.turn + '|' + kp;
    if (!miniCv || miniCv.width !== cw || miniCv.height !== chh) { miniCv = document.createElement('canvas'); miniCv.width = cw; miniCv.height = chh; miniDirty = true; }
    if (key !== miniKey || miniDirty) {
      miniKey = key;
      const g = miniCv.getContext('2d');
      if (miniDirty || !miniBase || miniBase.width !== cw) {
        miniBase = document.createElement('canvas'); miniBase.width = cw; miniBase.height = chh;
        const bg2 = miniBase.getContext('2d'); paintBlocks(bg2, m, kp);
        if (visMask) { bg2.fillStyle = 'rgba(20,22,28,.55)'; for (let yy = 0; yy < m.h; yy++) for (let xx = 0; xx < m.w; xx++) if (!lit(yy * m.w + xx)) bg2.fillRect(xx * kp, yy * kp, kp, kp); }
        miniDirty = false;
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(miniBase, 0, 0);
      const blink = frameNo & 1;
      for (const q of S.units) { // 单位：阵营亮色小点，当前行动方还没动的会闪；迷雾里看不见的不画
        if (!unitSeen(q)) continue;
        const P = pal(q.owner);
        // 小圆点（带深色描边），不整格涂满
        const cx = (q.x + 0.5) * kp, cy = (q.y + 0.5) * kp, r = Math.max(1, kp * 0.34);
        g.beginPath(); g.arc(cx, cy, r + Math.max(0.6, kp * 0.12), 0, Math.PI * 2); g.fillStyle = P.o; g.fill();
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = (q.owner === S.turn && !q.moved && blink) ? '#ffffff' : P.m; g.fill();
      }
      // 视野框
      const x0 = Math.round(-ox / ts * kp), y0 = Math.round(-oy / ts * kp), vw = Math.round(viewW() / ts * kp), vh = Math.round(viewH() / ts * kp), e = Math.max(1, Math.round(dpr));
      const box = (col, t, o) => { g.fillStyle = col; g.fillRect(x0 - o, y0 - o, vw + 2 * o, t); g.fillRect(x0 - o, y0 + vh + o - t, vw + 2 * o, t); g.fillRect(x0 - o, y0 - o, t, vh + 2 * o); g.fillRect(x0 + vw + o - t, y0 - o, t, vh + 2 * o); };
      box('#25272c', 3 * e, e); box('#fff3c4', e, 0);
      // 战役的目标格：金色方块（闪）
      if (Camp && S.camp && blink) { try { for (const t of Camp.marks()) { g.fillStyle = '#0e1220'; g.fillRect(t.x * kp - e, t.y * kp - e, kp + 2 * e, kp + 2 * e); g.fillStyle = '#ffd24a'; g.fillRect(t.x * kp, t.y * kp, kp, kp); } } catch (er) { } }
    }
    Skin.panel(ctx, x, y, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(miniCv, Math.round((x + 3) * U), Math.round((y + 3) * U)); ctx.setTransform(U, 0, 0, U, 0, 0);
    hud.miniBtn = null; hud.miniPanel = { x, y, w, h }; hud.mini = { x: x + 3, y: y + 3, w: cw / U, h: chh / U };
  }
  function miniJump(e) {
    const r = hud.mini; if (!r || !S) return;
    const m = S.map, x = Math.max(0, Math.min(m.w - 1, Math.floor((e.clientX - r.x * u) / miniK))), y = Math.max(0, Math.min(m.h - 1, Math.floor((e.clientY - r.y * u) / miniK)));
    centerOn(x, y);
    if (mode === 'idle' || mode === 'silo') { cur = { x, y }; lastCurKey = x + ',' + y; if (mode === 'silo') siloInfo(); }
  }
  // 单位头上的弹牌（遇伏！/ 再行动 / 占领 20→11）：粗体字的小牌子，画在画布上，跟着格子走
  function drawPops(now) {
    for (const f of fx) {
      if (f.type !== 'ambush') continue;
      const k = (now - f.t0) / f.dur; if (k < 0 || k >= 1) continue;
      const t = f.text || tt('遇伏！'), col = f.tone === 'go' ? ['#1f7a4a', '#d6f7a8'] : f.tone === 'warn' ? ['#b0741c', '#fff6c0'] : f.tone === 'gold' ? ['#2a3248', '#f2b632'] : ['#a3263c', '#ffd0a0'];
      const fs = Math.round(Math.max(20, 34 * Kit.s) * (f.big ? 1.5 : 1) * dpr), h = Math.round(fs * 1.5), b = Math.max(2, Math.round(4 * Kit.s * dpr));
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = '900 ' + fs + 'px ' + Kit.font(); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      const w = Math.round(ctx.measureText(t).width + fs), bob = k < 0.12 ? (1 - k / 0.12) * fs * 0.5 : 0;
      const cx = (ox + (f.x + 0.5) * ts) * dpr, top = (oy + f.y * ts) * dpr;
      const x = Math.round(Math.max(b * 2, Math.min(cv.width - w - b * 2, cx - w / 2))), y = Math.round(Math.max(b * 2, top - h - 6 * dpr + bob - (f.rise ? k * fs : 0)));
      ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 4));
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x, y + b * 2, w, h);
      ctx.fillStyle = '#0e1220'; ctx.fillRect(x - b, y - b, w + 2 * b, h + 2 * b);
      ctx.fillStyle = col[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, y, w, b);
      ctx.fillStyle = '#0e1220'; ctx.fillText(t, x + w / 2 + b * 0.5, y + h / 2 + b * 0.75); ctx.fillStyle = col[1]; ctx.fillText(t, x + w / 2, y + h / 2);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }
  // 底部提示条在对局里显示什么：跟着现在的操作阶段走
  function battleHints() {
    if (!S || mode === 'over' || mode === 'title' || curtain) return [];
    if (mode === 'ai' || mode === 'anim') return human[S.turn] ? [] : [['', DEMO ? '演示对局' : '电脑行动中…']];
    if (mode === 'move') return [['a', aim ? (aim.moves ? '移动并攻击' : '攻击') : '移动至此'], ['b', '取消'], ['x', '详情']];   // 光标压在打得到的敌人身上：确定 = 原地打，或走过去打
    if (mode === 'target') return [['a', '攻击'], ['b', '返回'], ['lr', '切换目标']];
    if (mode === 'unload') return [['a', '卸载至此'], ['b', '返回'], ['lr', '切换位置']];
    if (mode === 'silo') return [['a', '发射'], ['b', '返回'], ['dpad', '选择目标']];
    if (mode === 'inspect') return [['b', '关闭范围和视野显示'], ['x', '详情']];
    if (mode !== 'idle') return [];
    const q = unitAtV(cur.x, cur.y), mine = q && q.owner === S.turn && !q.moved;
    let fac = false; try { fac = !q && S.map.owner[cur.y][cur.x] === S.turn && C.buildList(S, cur.x, cur.y).length > 0; } catch (e) { }
    const menuA = !mine && !q && !fac, a = mine ? '选择' : q ? '查看范围和视野' : fac ? '生产' : '菜单';   // 同一条提示里不出现两个相同的说明：A 已经是“菜单”时不再列 Y，A 是“看范围”时不再列 B
    return [['a', a], q && ['b', '按住：查看范围和视野'], ['x', '详情'], !menuA && ['y', '菜单'], ['lbrb', '切换单位']];
  }
  function drawHud(now) {
    if (curtain) { HUD.frame(null); Kit.setHints([]); return; }
    if (typeof now !== 'number') now = performance.now();
    drawPops(now);
    ctx.setTransform(U, 0, 0, U, 0, 0); drawMini(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 光标靠近哪块面板，那块面板就换到对角
    const cx = ox + (cur.x + 0.5) * ts, cy = oy + (cur.y + 0.5) * ts, s = Kit.s, W = viewW(), H = viewH();
    const m = { status: statusModel(), info: mode !== 'over' ? infoModel() : null, fc: (fcast && (mode === 'target' || mode === 'silo' || (mode === 'move' && aim))) ? fcast : null, loading: loadingOn, mode,
      left: !(cx < 660 * s && cy < 340 * s), right: !(cx > W - 720 * s && cy > H - 400 * s) };
    if (m.fc) { m.fcAt = tileCss(m.fc.x, m.fc.y); m.from = sel ? tileCss(sel.x, sel.y) : null; }
    m.ts = ts; m.pts = [tileCss(cur.x, cur.y)]; if (sel && S.units.includes(sel)) m.pts.push(tileCss(sel.x, sel.y));   // 正在看的格子：光标和选中的单位（细条据此让到另一侧）
    m.goal = Camp && S.camp ? Camp.goalLines() : null;
    HUD.frame(m); hudM = m;
    { const q = hudInsets(), k = Math.round(q[0]) + ',' + Math.round(q[1]); if (k !== insKey) { insKey = k; placeCam(false); apronCheck(); } }   // 界面条出现或变高之后重新摆镜头：这时才知道要给它们让多少
    // 对局里的按键提示：选目标 / 卸载 / 导弹落点这些要选的时候显示；空闲、选路时不显示（开局头几秒、换输入设备时闪出来一下；设置里可以改成常显）
    const pick = mode === 'target' || mode === 'unload' || mode === 'silo';
    if (Kit.ptr()) {
      // 鼠标：右下角一个“菜单”按钮；触屏再加“结束回合”“详情”。选路、选目标时给“取消 / 返回”
      const mine = human[S.turn] && !S.winner, touch = Kit.dev === 'touch';
      Kit.setHints(mode === 'idle' && mine ? [unitAtV(cur.x, cur.y) && ['', touch ? '长按单位：查看范围和视野' : '按住右键：查看范围和视野'], undoOf() && ['undo', '撤回'], ['y', '菜单'], touch && ['end', '结束回合'], touch && ['x', '详情']] : mode === 'move' ? [touch && aim && ['a', aim.moves ? '移动并攻击' : '攻击'], ['b', '取消']] : pick ? [touch && ['a', mode === 'target' ? '攻击' : mode === 'silo' ? '发射' : '卸载至此'], ['b', '返回']] : mode === 'inspect' ? [['b', '关闭范围和视野显示']] : []);
    } else Kit.setHints(pick || cfg.hints || now < hintUntil ? battleHints() : undoOf() ? [['undo', '撤回']] : []);   // 有能撤回的事：角上一个“撤回”的提示，做了下一个动作就消失
  }
  let hintUntil = 0;
  Kit.onDev = () => { hintUntil = performance.now() + 3000; };
  // 状态变了之后统一刷新一下视野（常驻界面每帧直接读 S，不用另外同步）
  function updateHud() { if (S) refreshVis(); }
  function updateInfo() { }

  // 横幅：横贯屏幕的阵营色大字条带（回合开始、技能）。o：{ p, pre, big, tag, sub, text, co: { id, p, mood, quote }, hold }
  // 新开一局：玩家席位的研究经费默认给“低”档（核心默认是“停”，每回合只有 3 点）。电脑自己会选；读档不动
  function defaultFunds(s, isHuman) {
    try { if (!s || !s.tech || (s.rules && s.rules.tech === false)) return; for (let p = 1; p < s.tech.length; p++) { const t = s.tech[p]; if (!t || !isHuman(p) || (t.fund && t.fund !== 'stop')) continue; if (!(C.setFund && C.setFund(s, p, 'low'))) t.fund = 'low'; } } catch (e) { console.error(e); }
  }
  // 技能演出的背景插画：cg.js 的 misc.power 按阵营编号取（旧写法是一张图的地址，也认）
  function powerBg(p) { try { const m = window.AWCG && window.AWCG.misc, v = m && m.power, im = v && typeof v === 'object' ? v[fac(p)] || v[1] : v; return im ? (window.AWCGPlayer ? window.AWCGPlayer.src(im) : im) : ''; } catch (e) { return ''; } }
  function banner(o) {
    const k = tf(); bnText = o.text || ''; const hold = o.hold || 1150;
    const mine = k > 0 ? { co: o.co || null, sub: o.sub || '', power: !!o.power } : null; bnOn = mine;
    if (mine) HUD.banner(Object.assign({}, o, { tin: 200 * k, hold: hold * k, out: 220 * k }));
    return sleep(hold).then(() => sleep(220)).then(() => { if (bnOn === mine) bnOn = null; });
  }
  // 转场：阵营色斜条扫过 + 大字。full：盖满全屏（开战、胜负）。设置里关掉“转场动画”就不演（回合切换退回上面的横幅）
  function wipe(o) {
    const k = tf(); if (k <= 0 || !cfg.wipe) return Promise.resolve();
    const ms = Math.round(o.ms * Math.max(0.6, Math.min(1, k)));
    HUD.wipe(Object.assign({}, o, { ms }));
    return new Promise(r => setTimeout(r, ms));
  }
  // 回合切换：一条阵营色横带扫过，写“第 N 天 · 阵营”和回合收入，整段不超过 0.8 秒
  function bannerTurn(sub, hold) {
    const p = S.turn, tag = (NP() > 2 || hasTeams()) ? tt('{name} 队', { name: teamTag(p) }) : '', pre = tt('第 {n} 天', { n: S.day }), text = `${tt('第 {n} 天 · {name}', { n: S.day, name: pname(p) })}${tag ? ' ' + tag : ''}${sub ? ' ' + sub : ''}`;
    if (cfg.wipe && tf() > 0) { bnText = text; bnOn = null; return wipe({ p, pre, big: pname(p), tag, sub, ms: 800 }); }
    return banner({ p, pre, big: pname(p), tag, sub, hold, co: S.co[p] ? { id: S.co[p], p, mood: 'normal' } : null, text });
  }
  // 淘汰提示：core 给了 s.log 就读它，没有就自己比对 s.alive
  let seenLog = 0, aliveWas = [], toastText = '', toastUntil = 0;
  function toast(o) { toastText = o.text || ''; toastUntil = performance.now() + (DEMO ? 300 : 3200); if (tf() > 0 || !DEMO) HUD.toast(o); }
  function checkDefeats() {
    if (!S) return;
    const out = [];
    if (Array.isArray(S.log)) { for (; seenLog < S.log.length; seenLog++) { const e = S.log[seenLog]; if (e && e.type === 'defeat') out.push(e); } }
    const now = plist().map(isAlive);
    now.forEach((a, i) => { if (!a && aliveWas[i] && !out.some(e => e.player === i + 1)) out.push({ player: i + 1 }); });
    aliveWas = now;
    if (!out.length) return;
    const word = e => quit.has(e.player) ? tt('认输') : tt('败北');
    const line = e => { const who = pname(e.player), gu = quit.has(e.player); return e.by ? (gu ? tt('{who} 认输（败给 {by}）', { who, by: pname(e.by) }) : tt('{who} 败北（败给 {by}）', { who, by: pname(e.by) })) : gu ? tt('{who} 认输', { who }) : tt('{who} 败北', { who }); };
    toast({ lines: out.map(e => ({ p: e.player, word: word(e), by: e.by || 0 })), text: out.map(line).join('\n'), cos: out.map(e => ({ id: S.co[e.player], p: e.player })) });
    sfx.lose(); checkMap(); updateHud();
  }


  // ───────── 游戏内菜单：贴着单位的大号竖排菜单（ui-battle.js 画）─────────
  // items：{ label, icon, right, bar, disabled, fn }；o.center：屏幕中央的大菜单（回合菜单、确认），背景战场压暗；o.focus 默认选中的项；o.title 菜单标题
  function openMenu(items, onCancel, o) {
    o = o || {}; mode = 'menu'; syncCam();
    BT.menu(items.map(it => Object.assign({}, it, { fn: () => { closeMenu(); it.fn(); } })), () => { closeMenu(); onCancel(); }, Object.assign({ at: tileCss(cur.x, cur.y) }, o));
  }
  function closeMenu() { if (BT) BT.closeMenu(); }
  // 科技：核心接好了（C.techLines）、这一局没关科技，回合菜单里才有这一项
  const techOn = () => { try { return !!(S && C.techLines && window.AWTech && !(S.rules && S.rules.tech === false) && C.techLines(S, S.turn).length); } catch (e) { return false; } };
  // 科技的入口在战场上：己方司令部、科研所（C.canOpenTech；核心没有这个函数时退回“己方司令部”）。电脑回合没有这些入口
  const canTech = (x, y) => { if (!techOn() || !human[S.turn]) return false; try { if (C.canOpenTech) return !!C.canOpenTech(S, S.turn, x, y); } catch (e) { } return S.map.t[y][x] === 'hq' && S.map.owner[y][x] === S.turn; };
  // 科技树是盖在战场上的一层（战场压暗可见），关掉回到原处；back：关掉之后做什么（回到单位的行动菜单）
  function openTech(back) { mode = 'idle'; try { window.AWTech.open(G, () => { techKey = ''; autosave(); if (back) back(); }); } catch (e) { console.error(e); } }
  // 建筑菜单：司令部 / 科研所上按确定
  function openBaseMenu() {
    const back = () => { mode = 'idle'; };
    openMenu([{ label: tt('研究', null, 'cmd'), icon: 'tech', fn: () => openTech() }, { label: tt('回合菜单', null, 'cmd'), icon: 'set', fn: () => openMapMenu() }, { label: tt('取消', null, 'cmd'), icon: 'go', fn: back }], back);
  }
  // 研究队列空着、还有能研究的项目：己方司令部和科研所上亮一个烧瓶标记，状态牌上也有
  let techKey = '', techIdle = false, techCells = [];
  function techMark() {
    if (!S || !human[S.turn] || S.winner) return false;
    const k = S.turn + '|' + S.day + '|' + mapSig + '|' + ((S.rp && S.rp[S.turn]) || 0) + '|' + ((S.tech && S.tech[S.turn] && S.tech[S.turn].done) || []).length;   // 研究点、已解锁的科技变了就重算
    if (k !== techKey) {
      techKey = k; techIdle = false; techCells = [];
      try { if (techOn()) techIdle = (C.techList ? C.techList(S, S.turn) : []).some(it => it.state === 'open'); } catch (e) { techIdle = false; }   // 有买得起的科技：“可研究”标记亮起
      if (techIdle) for (let y = 0; y < S.map.h; y++) for (let x = 0; x < S.map.w; x++) if (D.TERRAIN[S.map.t[y][x]].prop && S.map.owner[y][x] === S.turn && canTech(x, y)) techCells.push([x, y]);
    }
    return techIdle;
  }
  // 战役目标的标记：目标建筑 / 目标格上一个金色的框和往下点的箭头，被护送（带 tag）的单位头上一颗星
  function drawGoalMarks(v, now) {
    if (!Camp || !S.camp) return; let list = null; try { list = Camp.marks(); } catch (e) { return; }
    if (!list || !list.length) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const lw = Math.max(3, Math.round(tp / 12)), bob = Math.round((1 + Math.sin(now / 200)) * tp * 0.08), a = Math.round(tp * 0.22);
    for (const m of list) {
      if (m.x < v.x0 || m.x > v.x1 || m.y < v.y0 || m.y > v.y1) continue;
      const X = bx + m.x * tp, Y = by + m.y * tp, cx = X + tp / 2, top = Y - Math.round(tp * 0.45) - bob;
      if (!m.unit) { for (const [col, o, w] of [['#0e1220', -lw, lw * 3], ['#ffd24a', 0, lw]]) { ctx.fillStyle = col; const d = Math.round(tp / 3); for (const [px, py] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const x0 = X + (px ? tp - d : 0), y0 = Y + (py ? tp - d : 0); ctx.fillRect(x0 + (px ? 0 : o), Y + (py ? tp - lw - o - (w - lw) : o), d - o, w); ctx.fillRect(X + (px ? tp - lw - o - (w - lw) : o), y0 + (py ? 0 : o), w, d - o); } } }
      for (const [col, g] of [['#0e1220', lw], ['#ffd24a', 0]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - a - g, top - g); ctx.lineTo(cx + a + g, top - g); ctx.lineTo(cx, top + a * 1.3 + g * 1.4); ctx.closePath(); ctx.fill(); }
    }
  }
  let flaskImg = null;
  function drawTechMarks(v, now) {
    if (!techMark() || !techCells.length) return;
    if (!flaskImg) { flaskImg = new Image(); flaskImg.src = Kit.icUrl('tech') || ''; }
    if (!flaskImg.complete || !flaskImg.naturalWidth) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    const sz = Math.round(tp * 0.5), bob = Math.round(Math.sin(now / 260) * tp * 0.05);
    for (const [x, y] of techCells) { if (x < v.x0 || x > v.x1 || y < v.y0 || y > v.y1 || C.unitAt(S, x, y)) continue; ctx.drawImage(flaskImg, bx + x * tp + tp - sz, by + y * tp - Math.round(sz * 0.45) + bob, sz, sz); }
    ctx.imageSmoothingEnabled = false;
  }
  // 回合菜单（Y / Start）：屏幕中央的暂停菜单
  function openMapMenu(focus) {
    const p = S.turn, co = coOf(p), mm = Math.min(1, (S.meter[p] || 0) / D.METER_MAX);
    let pw = null; try { pw = C.powerInfo ? C.powerInfo(S, p) : null; } catch (e) { }
    const items = [{ label: tt('结束回合', null, 'cmd'), icon: 'end', fn: endTurn }];
    if (powersOn()) items.push({ label: tt('发动「{name}」', { name: (pw && pw.name) || (co ? co.power : tt('技能')) }, 'cmd'), icon: 'power', disabled: mm < 1, bar: mm, right: mm < 1 ? Math.floor(mm * 100) + '%' : tt('就绪'), note: (pw && pw.desc) || (co && co.desc) || '', fn: firePower });
    items.push({ label: tt('战况', null, 'cmd'), icon: 'stat', fn: openStatus });
    if (CX()) items.push({ label: tt('图鉴', null, 'cmd'), icon: 'codex', fn: () => { mode = 'idle'; openCodex(); } });
    items.push({ label: tt('设置', null, 'cmd'), icon: 'set', fn: () => { mode = 'idle'; openSettings(true); } });
    if (human[p] && !DEMO) items.push({ label: tt('认输', null, 'cmd'), icon: 'flag', fn: () => confirmSurrender(p) });
    // 返回标题：先自动存档（标题页的“继续”能接着打），再确认一次
    if (!DEMO) items.push({ label: tt('返回标题', null, 'cmd'), icon: 'home', id: 'title', fn: () => confirmTitle() });
    // 不再放“继续”这一项：它和底下的“返回”（B / Esc / 点菜单外）是同一件事。
    // 默认焦点：还有没行动的单位停在“战况”（免得一按确定就误结束回合），全部行动完停在“结束回合”（从战况、设置回来时停在原来那一项）
    const todo = S.units.some(q => q.owner === p && !q.moved);
    openMenu(items, () => { mode = 'idle'; }, { focus: focus || (todo ? 'stat' : 'end'), center: true, title: tt('第 {n} 天 · {name}', { n: S.day, name: pname(p) }) });
  }

  // ───────── 认输：二次确认，默认停在“再想想”上 ─────────
  const quit = new Set(); let gaveUp = 0;    // quit：这一局里认输的阵营；gaveUp：刚刚认输、胜负就此分出的那个阵营（胜利页写原因用）
  function confirmTitle() {
    const back = () => openMapMenu('title');
    openMenu([{ label: tt('返回标题', null, 'cmd'), icon: 'home', id: 'title', fn: () => { try { autosave(); } catch (e) { console.error(e); } mode = 'idle'; showTitle(); } }, { label: tt('取消', null, 'cmd'), icon: 'go', fn: back }], back,
      { focus: 'go', center: true, title: tt('要返回标题吗？'), note: tt('对局进度会自动保存，可以在标题画面选“继续”接着进行。') });
  }
  function confirmSurrender(p) {
    const back = () => openMapMenu('flag');
    openMenu([{ label: tt('确认认输（{name}）', { name: pname(p) }), icon: 'flag', fn: () => surrender(p) }, { label: tt('取消', null, 'cmd'), icon: 'go', fn: back }], back, { focus: 'go', center: true, title: tt('要认输吗？') });
  }
  // 认输的阵营按“被淘汰”处理。核心有 C.surrender 就用它；现在没有这个接口，按淘汰逻辑里最接近的“被打光”走：
  // 把这个阵营的单位全部撤出地图（正在占的建筑占领值复原），再让核心照常判定（C.checkWin → 建筑变中立、司令部变城市、只剩一队就分出胜负）
  async function surrender(p) {
    if (!S || S.winner || mode === 'over' || !isAlive(p)) return;
    closeMenu(); unstage(); sel = reach = reachMask = inspect = null; fcast = null; mode = 'anim'; const g = gid;
    quit.add(p); human[p] = false;             // 之后不再轮到他；没有玩家了就是观战
    let k = 0; for (const q of S.units) if (q.owner === p && unitSeen(q)) addFx('dust', q.x, q.y, 520, { delay: (k++ % 12) * 30 });
    try {
      if (typeof C.resign === 'function') C.resign(S, p);          // 核心的认输：战役里记成失败（reason = 'resign'），普通对局是这一方出局
      else if (typeof C.surrender === 'function') C.surrender(S, p);
      else {
        const m = S.map;
        for (let i = S.units.length - 1; i >= 0; i--) { const q = S.units[i]; if (q.owner !== p) continue; S.units.splice(i, 1); if (D.TERRAIN[m.t[q.y][q.x]].prop) m.cap[q.y][q.x] = 20; }
        S.ai = null;                           // 电脑的缓存按现在的局面重算
        C.checkWin(S, 0);
      }
    } catch (e) { console.error(e); }
    checkMap(); checkDefeats(); updateHud();
    await sleep(700); if (g !== gid) return;
    if (S.winner) { gaveUp = p; return over(); }
    if (S.turn === p) return endTurn();         // 还有别的队伍在打：轮到下一个阵营
    mode = human[S.turn] ? 'idle' : 'ai';
  }
  // ───────── 造兵菜单：左边兵种列表，右边一张单位卡（ui-battle.js 画）─────────
  const lastBuilt = {};   // 每种生产建筑上次造的兵种（造兵列表默认停在它上面）
  function openBuild() {
    const p = S.turn, x = cur.x, y = cur.y;
    const list = C.buildList(S, x, y).map(k => {
      let md = null; try { md = C.coMods ? C.coMods(S, p, k) : null; } catch (e) { }
      const cost = costOf(p, k);
      // 两种造法各问一次核心造不造得了（资金不足、碎片不足……）
      let ore = 0, why = '', whyS = ''; try { ore = C.oreOf ? C.oreOf(S, p, k) : 0; why = C.buildBlock ? (C.buildBlock(S, x, y, k) || '') : (cost > S.funds[p] ? tt('资金不足') : ''); whyS = ore && C.buildBlock ? (C.buildBlock(S, x, y, k, { ore: true }) || '') : ''; } catch (e) { }
      return { k, cost, ore, why, whyS, mods: md || {} };   // 造不了的原因听核心的（资金不足、碎片不足……）
    });
    mode = 'menu';
    // C.build 可能拒绝（钱不够、这座建筑本回合造满了……）：返回 null 就只响一声，不当成造好了
    const bt = S.map.t[y][x];
    BT.build({ p, funds: S.funds[p] || 0, list, present: presentTypes(p), terrain: bt, focus: lastBuilt[bt] }, (k, strong) => {
      let nu = null; try { nu = strong ? C.build(S, x, y, k, { ore: true }) : C.build(S, x, y, k); } catch (e) { console.error(e); } (nu ? sfx.build : sfx.no)(); mode = 'idle'; updateHud(); if (nu) { lastBuilt[bt] = k; autosave(); }
    }, () => { mode = 'idle'; });
  }
  // 场上看得见的敌方兵种（单位卡的“擅长打 / 害怕”里排前面）
  function presentTypes(p) { const s = new Set(); if (S) for (const q of S.units) if (isEnemy(p, q.owner) && unitSeen(q)) s.add(q.type); return s; }
  const backToMenu = id => () => { if (S && mode === 'idle' && human[S.turn] && !Nav.stack.length) openMapMenu(id); };   // id：回合菜单里那一项的 id（见 openMapMenu）
  function openStatus() { mode = 'idle'; BT.status(backToMenu('stat')); }
  function openSettings(inGame) { Front.settings(inGame, inGame ? backToMenu('set') : null); }
  // 多人同屏 + 迷雾：换人时先拉黑幕，等下一位接手再揭开
  let curtain = false;
  function handoff(p) { return new Promise(res => { curtain = true; BT.handoff(p, () => { curtain = false; res(); }); }); }
  // 详情卡（X / F / C、点右下角的信息牌）：光标这一格的地形 / 建筑和单位
  function openDetail() {
    if (!S || mode === 'over' || mode === 'title') return;
    sfx.ok(); BT.detail({ x: cur.x, y: cur.y, unit: unitAtV(cur.x, cur.y) });
  }


  // ───────── 单位操作流程 ─────────
  function select(q) { begin(q); sfx.ok(); }
  // 开始（或重新开始）一次行动：以单位现在的位置为出发格
  function begin(q) {
    undoFace.set(q, facing(q));
    sel = q; reach = C.reach(S, q); orig = { x: q.x, y: q.y, left: facing(q) }; committed = false; acted = false; loadTr = joinTr = null; movePath = null; mode = 'move';
    // 走得到的格子都上色：1 = 能停下（空格、能登上的运输单位、能合并的友军），2 = 被友军占着、只能路过不能停（照样显示，只是压暗）。迷雾里看不见的敌人不算占着
    const w = S.map.w, n = w * S.map.h, occ = new Map();
    for (const o of S.units) occ.set(o.y * w + o.x, o);
    reachMask = new Uint8Array(n);
    for (let i = 0; i < n; i++) if (reach.dist[i] < Infinity) {
      const o = occ.get(i);
      reachMask[i] = (!o || o === q || C.canLoad(S, q, o) || (C.canJoin && C.canJoin(S, q, o)) || !unitSeen(o)) ? 1 : 2;
    }
    // 这回合打得到谁：核心给出能打到的格子（站桩远程按原地，其余按走得到的格子），取其中看得见、打得动的敌人
    hitSet = null; aim = null; lastStop = [q.x, q.y];
    try {
      const cells = C.threatCells ? C.threatCells(S, q) : null;
      if (Array.isArray(cells) && cells.length && !(q.fired || acted)) {
        const cs = new Set(cells), hs = new Set();
        for (const e of S.units) {
          const i = e.y * w + e.x;
          if (!cs.has(i) || !unitSeen(e)) continue;
          if (C.isEnemy ? !C.isEnemy(S, q.owner, e.owner) : e.owner === q.owner) continue;
          if (!(C.canHit ? C.canHit(S, q, e) : (D.DMG[q.type] && D.DMG[q.type][e.type] != null))) continue;
          // 核心的 threatCells 是给电脑估威胁用的，把只能路过、停不下的格子（友军占着）也算成出手点；这里再核一遍：真有能站的格子才标红
          if (standFor(e)) hs.add(i);
        }
        if (hs.size) hitSet = hs;
      }
    } catch (e) { hitSet = null; }
  }
  // ── 直接点敌人：移动范围里光标压在打得到的敌人身上时，自动挑一个站位、显示伤害预估；确定 = 走过去打 ──
  // 目标在单位现在这一格就打得到：原地攻击，不挪动（远程、近战都一样）。
  // 要先移动才打得到：站位优先用光标刚经过的那个可停格（玩家自己走出来的路），不行就找离它最近、路程最短的一格；
  // 地上画出落点和路线（见 draw 里的“路径箭头”）。站桩远程只能在原地
  function standFor(t) {
    const q = sel, w = S.map.w, ox = q.x, oy = q.y, ok2 = [];
    const can = (x, y) => { q.x = x; q.y = y; let r = false; try { r = C.targets(S, q, x !== orig.x || y !== orig.y).includes(t); } catch (e) { } return r; };
    preview(true);
    try {
      const ls = lastStop || [orig.x, orig.y];
      if (can(orig.x, orig.y)) ok2.push([orig.x, orig.y, -2]);                       // 原地就打得到：不动
      else if (C.canStop(S, q, reach, ls[0], ls[1]) && can(ls[0], ls[1])) ok2.push([ls[0], ls[1], -1]);
      else for (let i = 0; i < reach.dist.length; i++) {
        if (!(reach.dist[i] < Infinity)) continue; const x = i % w, y = (i - x) / w;
        if (Math.abs(x - t.x) + Math.abs(y - t.y) > 9) continue;                    // 射程最远的也就这么多，省得整张图都试
        if (!C.canStop(S, q, reach, x, y) || !can(x, y)) continue;
        ok2.push([x, y, (Math.abs(x - ls[0]) + Math.abs(y - ls[1])) * 100 + reach.dist[i]]);
      }
    } finally { q.x = ox; q.y = oy; preview(false); }
    if (!ok2.length) return null; ok2.sort((a, b) => a[2] - b[2]); return [ok2[0][0], ok2[0][1]];
  }
  // 点的是看得见、本来打得动的敌人，但这个单位移动后不能开火、目标又不在它现在的射程内：直接点它不攻击，只提示一句
  function outOfRange(x, y) {
    if (!sel || moveFire(sel) || sel.fired || acted || !D.UNITS[sel.type].range) return false;
    const e = unitAtV(x, y); if (!e || !isEnemy(sel.owner, e.owner)) return false;
    try { return C.canHit ? !!C.canHit(S, sel, e) : true; } catch (err) { return false; }
  }
  function updateAim() {
    const had = !!aim; aim = null;
    if (mode !== 'move' || !sel || !reach) return;
    const w = S.map.w, i = cur.y * w + cur.x;
    if (C.canStop(S, sel, reach, cur.x, cur.y)) lastStop = [cur.x, cur.y];
    const t = hitSet && hitSet.has(i) ? unitAtV(cur.x, cur.y) : null, st = t ? standFor(t) : null;
    if (!st) { if (had) fcast = null; return; }
    // 伤害预估按站位算（雷达塔范围、地形加成都看攻击方站在哪）
    const ox = sel.x, oy = sel.y; preview(true); sel.x = st[0]; sel.y = st[1];
    try { targets = [t]; setTarget(0); } catch (e) { console.error(e); } finally { sel.x = ox; sel.y = oy; preview(false); }
    aim = { t, stand: st, moves: st[0] !== sel.x || st[1] !== sel.y };
  }
  // 预演：单位已经摆到终点、行动还没定。核心在这期间一切“看不看得见”都按出发格算（C.setPreview / C.clearPreview）
  function preview(on) { if (!S) return; try { if (on) { if (C.setPreview) C.setPreview(S, sel, orig.x, orig.y); } else if (C.clearPreview) C.clearPreview(S); } catch (e) { console.error(e); } }
  function unstage() { if (sel && orig && !committed && S && S.units.includes(sel)) { sel.x = orig.x; sel.y = orig.y; if (orig.left != null) faceMap.set(sel, orig.left); } preview(false); movePath = null; loadTr = joinTr = null; }
  function deselect() { unstage(); if (aim) fcast = null; aim = null; sel = reach = reachMask = hitSet = null; mode = 'idle'; }
  // 行动定下来。顺序照 MULTI-SPEC 7.2：C.resolveMove（仍在预演里）→ 坐标改回出发格 → C.clearPreview → C.moveUnit 到实际终点。
  // 返回 'ok'（照常执行选好的动作）/ 'stop'（这次行动已经结束：遇伏，或者飞机被天网打掉）/ 'bump'（撞上隐蔽的敌人停在它前面，行动不结束，已经重新弹出行动菜单）
  async function commit() {
    if (committed) return 'ok';
    const q = sel, g = gid, tx = q.x, ty = q.y, tr = loadTr || joinTr;
    let mv = { path: movePath && movePath.length ? movePath : [[orig.x, orig.y]], trapped: false };
    if (movePath && movePath.length > 1 && C.resolveMove) { try { const r = C.resolveMove(S, q, movePath); if (r && r.path && r.path.length) mv = r; } catch (e) { console.error(e); } }
    q.x = orig.x; q.y = orig.y; preview(false);
    const end = mv.path[mv.path.length - 1], short = end[0] !== tx || end[1] !== ty;
    mode = 'anim';
    if (short) { cur = { x: end[0], y: end[1] }; if (orig.left != null) faceMap.set(q, orig.left); await animMove(q, mv.path); if (g !== gid) return 'stop'; } // 没走到选的那一格：从出发格重走一遍，停在被拦下的地方
    let shot = null;
    if (!(tr && !short)) { try { shot = C.moveUnit(S, q, end[0], end[1], mv.path) || null; } catch (e) { console.error(e); } } // 登上运输单位：不挪到那一格，由 C.load 处理
    committed = true; movePath = null; refreshVis();
    if (shot) { await playShots(q, shot); if (g !== gid) return 'stop'; if (shot.killed) { done(); return 'stop'; } }
    if (mv.trapped) { q.moved = true; cur = { x: q.x, y: q.y }; ambush(q); await ambushShot(q, mv); if (g !== gid) return 'stop'; done(); return 'stop'; }
    if (short) { // 撞上隐蔽的敌人（它现在看得见了）：以这一格为出发格重新来，选好的动作作废
      sfx.tick(); popup(q, tt('发现敌方单位！'), 'warn'); begin(q); cur = { x: q.x, y: q.y }; openAction(); return 'bump';
    }
    return 'ok';
  }
  function done() { oreEvents(); preview(false); hitSet = null; sel = reach = reachMask = loadTr = joinTr = movePath = null; fcast = null; mode = 'idle'; checkMap(); checkDefeats(); updateHud(); if (Camp && S.camp) Camp.tick('act'); if (S.winner) over(); else autosave(); }
  // 一次行动收尾。单位还能不能动只看 state（q.moved）：核心把它置回 false 的（返回值带 again），界面不补记已行动，也不替玩家接着走——
  // 它留在原地、头上挂着“还能再动”的牌子，玩家可以先去操作别的单位再回来选它；回合结束没用掉就作废
  function finish(q, res) {
    done();
    if (res && res.again && mode === 'idle' && S && !S.winner && q && S.units.includes(q) && q.owner === S.turn && !q.moved) {
      if (human[S.turn]) cur = { x: q.x, y: q.y };
      popup(q, res.full ? tt('再次行动') : tt('再次移动'), 'go');
    }
  }
  function popup(q, text, tone) { fx.push({ type: 'ambush', text, tone, x: q.x, y: q.y, dur: 1100 * Math.max(0.3, tf()), t0: performance.now() }); lastPop = { id: q.id, text }; }
  let lastPop = null;
  function unloadItems() {
    const out = [];
    // 预演时 sel 已经站在终点：卸载点按这次行动出发时的视野列（预演期间核心自动如此；卸过一个之后预演已经清掉，所以出发格照样传给核心）
    const from = orig ? [orig.x, orig.y] : undefined;
    sel.cargo.forEach((c, i) => { if (C.unloadSpots(S, sel, i, from).length) out.push({ label: tt('卸载 {name}', { name: D.UNITS[c.type].name }, 'cmd'), icon: 'unload', right: 'HP ' + C.dispHp(c), fn: () => { unloadIdx = i; spots = C.unloadSpots(S, sel, i, from); sIdx = 0; cur = { x: spots[0][0], y: spots[0][1] }; mode = 'unload'; } }); });
    return out;
  }
  // gain：这次占下来立刻到手的资金（C.captureGain，占领前问好），飘一个金色的“+金额”
  // 占领之前先记下：这一格是什么建筑、原来归谁、占领值多少、占成会立刻到手多少钱、是不是战役目标
  function capPre(q) {
    const m = S.map; let gain = 0, obj = false; try { gain = C.captureGain ? C.captureGain(S, q) : 0; } catch (e) { }
    try { const o = S.camp && C.objectives ? C.objectives(S) : null, walk = v => { if (!v || typeof v !== 'object') return; if (Array.isArray(v.cells) && v.type && v.cells.some(c => c && c[0] === q.x && c[1] === q.y)) obj = true; for (const k in v) if (k !== 'cells') walk(v[k]); }; walk(o); } catch (e) { }
    return { t: m.t[q.y][q.x], prev: m.owner[q.y][q.x], c0: m.cap[q.y][q.x], gain, obj };
  }
  // 这座建筑带来什么（占领完成时写在窗下的一行）：按建筑类型取现成的数据
  function propGain(t, p) {
    const T = D.TERRAIN[t] || {}, out = [], pct = (S.rules && S.rules.income) || 100;
    if (T.income) out.push(['coin', tt('每回合 +{n} 资金', { n: Math.round(T.income * pct / 100) })]);
    if (t === 'factory') out.push(['crate', tt('可生产陆上单位')]); else if (t === 'airport') out.push(['plane', tt('可生产航空单位')]); else if (t === 'port') out.push(['ship', tt('可生产舰船')]);
    if (t === 'mine' && D.RES && D.RES.mineText && !(S.rules && S.rules.ore === false)) out.push(['ore', D.RES.mineText]);
    if (T.research && !(S.rules && S.rules.tech === false)) out.push(['tech', tt('每回合 +{n} 研究点', { n: T.research.pts })]);
    if (T.aura && T.aura.atk) out.push(['sword', tt('{r} 格内己方单位攻击 +{n}%', { r: T.aura.r != null ? T.aura.r : T.aura.range, n: Math.round(T.aura.atk * 100) })]);
    if (t === 'gate') { let fi = null; try { fi = C.floodInfo ? C.floodInfo(S) : null; } catch (e) { } if (fi && fi.gates) out.push(['shield', fi.held >= fi.gates ? tt('已占有全部闸房，停止涨水') : tt('下一次涨水推迟 1 天')]); }
    if (t === 'hospital') out.push(['heart', tt('停留和相邻的己方步兵类单位每回合恢复 HP')]);
    if (t === 'fort') out.push(['shield', tt('驻守单位受到的反击伤害减半')]);
    if (!out.length && T.note) out.push(['', String(T.note).split('。')[0]]);
    return out.slice(0, 2);   // [[图标, 文字], …]
  }
  const capMode = () => tf() <= 0 || cfg.cap === 'off' ? 'off' : (cfg.cap === 'short' || (cfg.fast && S && !human[S.turn]) || !window.AWCapture) ? 'short' : 'full';
  let lastCapShow = null;
  // 一次占领的演出。完整：弹小窗（司令部、战役目标建筑是整屏）；简短：地图上跳数字、白闪换色；关闭：只有原来的竖旗和飘字
  async function captureShow(q, okc, pre) {
    const cm = capMode(), c1 = okc ? 0 : S.map.cap[q.y][q.x], role = human[q.owner] ? 'mine' : pre.prev > 0 && human[pre.prev] ? 'lost' : 'other';
    lastCapShow = { mode: cm, done: !!okc, big: false, role, t: pre.t, from: pre.c0, to: c1 };
    if (cm !== 'full') { captureFx(q, okc, pre.gain, pre.c0, cm === 'short'); if (cm === 'short') await sleep(520); return; }
    const big = !!okc && (pre.t === 'hq' || pre.obj), m = S.map, T0 = D.TERRAIN[pre.t] || {};
    const near = [[0, 1], [0, -1], [-1, 0], [1, 0]].map(([dx, dy]) => (m.t[q.y + dy] || [])[q.x + dx]).filter(Boolean), land = near.filter(t => MINI[t] && !/sea|reef|river|wall/.test(t) && !(D.TERRAIN[t] && D.TERRAIN[t].prop)), gnd = MINI[land[0]] || MINI.plain, gains = okc && role !== 'lost' ? propGain(pre.t, q.owner) : [];
    lastCapShow.big = big; lastCap = { id: q.id, text: okc ? tt('占领完成') : pre.c0 + '→' + c1 };
    const g = gid;
    await window.AWCapture.play(G, { t: pre.t, by: q.owner, prev: pre.prev, unit: q.type, from: pre.c0, to: c1, done: !!okc, big, role, k: tf(), gnd, ground: land[0] || 'plain', near, seed: q.x * 7 + q.y * 13, tname: T0.name || '',
      gain: gains.map(g => g[1]).join('　'), gains, winner: big ? S.co[q.owner] : null, loser: big && pre.prev > 0 ? S.co[pre.prev] : null, quote: '' });
    if (g !== gid || !S) return;
    if (okc) { addFx('capture', q.x, q.y, 700, { pal: pal(q.owner) }); if (pre.gain > 0) { addFx('num', q.x, q.y, 1300, { text: '+' + pre.gain, col: '#ffc24a' }); lastGain = { id: q.id, gain: pre.gain }; } }
  }
  function captureFx(q, okc, gain, c0, stepped) {
    (okc ? sfx.captured : sfx.cap)();
    if (stepped && c0 != null) {   // 简短演出：占领值在建筑上分三下跳减，每一下一声闷响
      const c1 = okc ? 0 : S.map.cap[q.y][q.x], k = Math.max(0.3, tf()), g = gid;
      for (let i = 1; i <= 2; i++) setTimeout(() => { if (g !== gid) return; sfx.stomp(); fx.push({ type: 'ambush', big: true, tone: 'gold', text: String(Math.round(c0 - (c0 - c1) * i / 3)), x: q.x, y: q.y, dur: 170 * k, t0: performance.now() }); }, (i - 1) * 170 * k);
    }
    if (okc) addFx('capture', q.x, q.y, 1100, { pal: pal(q.owner) });
    // 建筑上飘一个大号的占领进度（20→11）；占下来了写“占领！”
    if (c0 != null) { const text = okc ? tt('占领完成') : c0 + '→' + S.map.cap[q.y][q.x]; lastCap = { id: q.id, text }; if (tf() > 0) fx.push({ type: 'ambush', big: true, rise: true, tone: 'gold', text, x: q.x, y: q.y, dur: 1400 * Math.max(0.3, tf()), t0: performance.now() }); }
    if (okc && gain > 0) { addFx('num', q.x, q.y, 1300, { text: '+' + gain, col: '#ffc24a', delay: 250 }); lastGain = { id: q.id, gain }; }
  }
  let lastCap = null, lastRp = null;
  let lastGain = null, lastShot = null, lastSell = null, lastBurn = null;
  const sellOf = q => { try { return C.sellValue ? (C.sellValue(S, q) || 0) : 0; } catch (e) { return 0; } };
  // 卖单位（黑市）：二次确认，默认停在“不卖”上
  function confirmSell(q, back) {
    const v = sellOf(q); if (!v) return back();
    cur = { x: q.x, y: q.y };
    openMenu([
      { label: tt('确认出售{name}', { name: D.UNITS[q.type].name }), icon: 'sell', right: '+' + v, fn: async () => {
        if (sel === q && await commit() !== 'ok') return;
        const x = q.x, y = q.y; let got = 0; try { got = C.sell(S, q) || 0; } catch (e) { console.error(e); }
        if (got) { sfx.build(); addFx('dust', x, y, 500); addFx('num', x, y, 1200, { text: '+' + got, col: '#ffc24a' }); lastSell = { id: q.id, got }; } else sfx.no();
        done();
      } },
      { label: tt('取消', null, 'cmd'), icon: 'go', fn: back },
    ], back, { focus: 'go', center: true, title: tt('要出售这个单位吗？') });
  }
  // 天网：飞机落进防空单位的射程，挨了 C.moveUnit 返回的那几发。逐发演出；被打掉的飞机核心已经移出 s.units，演出期间先画个替身
  async function playShots(q, shot) {
    const pos = { x: q.x, y: q.y }, list = (shot && shot.shots) || [];
    lastShot = { id: q.id, n: list.length, killed: !!shot.killed, dmg: list.map(h => h.dmg) };
    if (quiet || tf() <= 0 || (visMask && isEnemy(visP, q.owner) && !seen(pos.x, pos.y))) return;
    if (shot.killed) addGhost(q, pos);
    try {
      cur = pos; popup({ x: pos.x, y: pos.y, id: q.id }, tt('天网！'), 'warn');
      for (let i = 0; i < list.length; i++) {
        const by = list[i].by, kill = !!shot.killed && i === list.length - 1;
        await sleep(i ? 260 : 160);
        await volley({ x: by.x, y: by.y }, pos, by.type, by.owner, Math.abs(by.x - pos.x) + Math.abs(by.y - pos.y) > 1, '#6fc3ff', () => ({ dmg: list[i].dmg, killed: kill, victim: q }), S.units.includes(by) ? by : null);
      }
      if (shot.loot > 0) addFx('num', pos.x, pos.y, 1100, { text: '+' + shot.loot, col: '#ffc24a', delay: 380 });
      updateHud(); await sleep(shot.killed ? 620 : 380);
    } finally { ghosts = ghosts.filter(g => g.u !== q); }
  }

  // 遇伏之后，被撞的那个隐蔽单位先打它一次（C.ambushShot，带对应科技才有；返回的格式和天网的自动射击一样）
  async function ambushShot(q, mv) {
    if (!C.ambushShot || !mv || !mv.by || !S.units.includes(q)) return;
    let sh = null; try { sh = C.ambushShot(S, q, mv.by) || null; } catch (e) { console.error(e); }
    if (sh) { await sleep(300); await playShots(q, sh); }
  }
  function ambush(q) { sfx.no(); shake(2.5, 320); addFx('hit', q.x, q.y, 320); fx.push({ type: 'ambush', x: q.x, y: q.y, dur: 1300 * Math.max(0.3, tf()), t0: performance.now() }); lastAmbush = { id: q.id, x: q.x, y: q.y }; }
  let lastAmbush = null;
  function openAction() {
    const q = sel, moved = !(q.x === orig.x && q.y === orig.y), items = [];
    cur = { x: q.x, y: q.y };
    if (joinTr) {
      const gain = C.joinGain ? C.joinGain(S, q, joinTr) : 0, hp2 = Math.min(10, C.dispHp(q) + C.dispHp(joinTr));
      items.push({ label: tt('合并', null, 'cmd'), icon: 'join', right: `HP ${C.dispHp(joinTr)}→${hp2}${gain ? '　+' + gain : ''}${(q.ore || joinTr.ore) && D.RES ? '　' + Kit.t('保留强化') + (C.joinOreBack && C.joinOreBack(S, q, joinTr) ? '　+' + C.joinOreBack(S, q, joinTr) + ' ' + D.RES.short : '') : ''}`, fn: async () => {
        const o = joinTr; if (await commit() !== 'ok') return;
        let r = null; if (S.units.includes(o) && C.canJoin(S, q, o)) r = C.join(S, q, o); else q.moved = true;
        if (r) { sfx.cap ? sfx.cap() : sfx.ok(); addFx('heal', o.x, o.y, 700); if (r.gain) popup(o, '+' + r.gain, 'gold'); if (r.oreBack && D.RES) setTimeout(() => popup(o, '+' + r.oreBack + ' ' + D.RES.short, 'gold'), r.gain ? 450 : 0); }
        done();
      } });
    } else if (loadTr) {
      items.push({ label: tt('搭乘{name}', { name: D.UNITS[loadTr.type].name }, 'cmd'), icon: 'load', fn: async () => { const tr = loadTr; if (await commit() !== 'ok') return; if (S.units.includes(tr) && C.canLoad(S, q, tr)) { C.load(S, q, tr); openDoor(tr); } else q.moved = true; done(); } });
    } else {
      if (!acted) {
        targets = C.targets(S, q, moved);
        if (targets.length) items.push({ label: tt('攻击', null, 'cmd'), icon: 'atk', fn: () => { tIdx = 0; setTarget(0); mode = 'target'; } });
        if (C.canCapture(S, q)) { // 右边写这一下之后还剩多少占领值（C.capPower：指挥官可能有占领倍数）
          const left = S.map.cap[q.y][q.x] - capPow(q);
          items.push({ label: tt('占领', null, 'cmd'), icon: 'cap', right: left <= 0 ? tt('完成') : S.map.cap[q.y][q.x] + '→' + left, fn: async () => {
            if (await commit() !== 'ok') return;
            const pre = capPre(q), r = C.capture(S, q), g = gid;   // 占领前记下建筑、原主、占领值、占成立刻到手的钱（征收的指挥官）
            preview(false); sel = reach = reachMask = null; mode = 'anim'; updateHud();
            await captureShow(q, r, pre); if (g !== gid) return;
            finish(q, r);
          } });
        }
        if (C.canLaunch && C.launchSilo && C.canLaunch(S, q)) items.push({ label: tt('发射导弹', null, 'cmd'), icon: 'silo', fn: () => enterSilo() });
      }
      items.push(...unloadItems());
      if (!acted && canTech(q.x, q.y)) items.push({ label: tt('研究', null, 'cmd'), icon: 'tech', fn: () => openTech(() => openAction()) });   // 单位站在司令部 / 科研所上：行动菜单里也能进科技
      // 黑市开着：多一项“卖掉（+金额）”，点了还要再确认一次
      const sv = acted ? 0 : sellOf(q);
      if (sv) items.push({ label: tt('出售', null, 'cmd'), icon: 'sell', right: '+' + sv, fn: () => confirmSell(q, () => openAction()) });
      // 卸过货的运输单位：已行动由核心在 C.unload 里记，这里不再自己补记
      items.push({ label: acted ? tt('结束', null, 'cmd') : tt('待命', null, 'cmd'), icon: 'wait', fn: async () => { if (await commit() !== 'ok') return; if (!acted) q.moved = true; done(); } });
    }
    // 主操作：能打就停在“攻击”，站在可占领的建筑上停在“占领”，合并 / 搭乘是唯一的那一项，再往后是发射、卸载，都没有就是“待命”
    const main = ['atk', 'cap', 'join', 'load', 'silo', 'unload'].find(k => items.some(it => it.icon === k)) || 'wait';
    openMenu(items, () => {
      if (acted) return done();
      // 行动还没定：单位放回出发格（预演里什么都没揭示，所以开着迷雾也收得回来）
      unstage(); mode = 'move';
    }, { focus: main });
  }
  // 伤害预览只读 C.damageRange：伤害 lo–hi、反击 lo–hi（内部 HP，也就是百分比）、对方是不是先手
  // 克制关系：edge 保持中文原文（ui-battle.js 显示时再翻），edgeKind 是 'good' / 'bad' / 'mut'，判断用它
  function setTarget(i) {
    tIdx = (i + targets.length) % targets.length; const t = targets[tIdx]; cur = { x: t.x, y: t.y };
    let r = null; try { r = C.damageRange ? C.damageRange(S, sel, t) : null; } catch (e) { console.error(e); }
    if (!r) { const f = C.forecast(S, sel, t) || {}; r = { lo: f.dmg || 0, hi: f.dmg || 0, counterLo: f.counter || 0, counterHi: f.counter || 0, first: !!f.first }; }
    const span = (a, b) => a === b ? a + '%' : a + '–' + b + '%', dmg = span(r.lo, r.hi), cnt = span(r.counterLo, r.counterHi);
    const rows = [['sword', tt('伤害'), dmg, '#ff8a5c'], ['shield', r.first ? tt('先手反击') : tt('反击'), cnt, '#6fc3ff']];
    if (r.first) rows.reverse(); // 对方先手反击：先挨打再出手，顺序反过来写
    const kill = r.lo >= t.hp && r.lo > 0;
    const eg = Kit.edge(sel.type, t.type);
    fcast = { x: t.x, y: t.y, a: sel.type, ao: sel.owner, d: t.type, dow: t.owner, dmgT: dmg, cntT: cnt, kill, edge: eg ? eg[0] : '', edgeKind: eg ? eg[1] : '', rows, foot: r.first ? tt('敌方先手反击') : kill ? tt('必定击毁') : '', first: !!r.first, range: r.lo === r.hi ? '' : dmg,
      dmg: { lo: r.lo, hi: r.hi, counterLo: r.counterLo, counterHi: r.counterHi, first: !!r.first },
      text: tt('伤害 {dmg} 反击 {cnt}', { dmg, cnt }) + (r.first ? ' ' + tt('对方先手') : '') + (kill ? ' ' + tt('必定击毁') : '') };
    syncCam();
  }
  // ── 导弹井：选落点 ──
  function enterSilo() {
    let b = null; try { b = C.bestSiloTarget ? C.bestSiloTarget(S, sel.owner) : null; } catch (e) { console.error(e); }
    cur = b && b.score > 0 ? { x: b.x, y: b.y } : { x: sel.x, y: sel.y };
    mode = 'silo'; siloInfo();
  }
  function siloCount(cx, cy, owner) {
    let en = 0, fr = 0;
    for (const q of S.units) if (Math.abs(q.x - cx) + Math.abs(q.y - cy) <= 2 && unitSeen(q)) { if (isEnemy(owner, q.owner)) en++; else fr++; }
    return { en, fr };
  }
  function siloInfo() {
    const n = siloCount(cur.x, cur.y, sel.owner);
    fcast = { x: cur.x, y: cur.y, r: 2, silo: n, rows: [['sword', tt('敌方'), String(n.en), '#ff8a5c'], ['shield', tt('己方'), String(n.fr), '#6fc3ff']], foot: tt('各损失 3 HP'), text: tt('波及敌方 {en} 己方 {fr} 各 -3 HP', { en: n.en, fr: n.fr }) };
    syncCam();
  }
  // staged：预演里的那一段走位（行动还没定，沿路什么都不揭示）
  // 走路时播 move：朝向跟着每一段路（向左走翻转过去，向右走翻回来，上下走保持原来的朝向），到达后朝向留着、回到待机
  const STEP = 90; // 走一格的毫秒数
  async function animMove(q, path, staged) {
    if (path.length < 2) return;
    const dirs = []; let left = facing(q);
    for (let i = 1; i < path.length; i++) { const dx = path[i][0] - path[i - 1][0]; if (dx) left = dx < 0; dirs.push(left); }
    faceMap.set(q, left);
    const k = tf(); if (k <= 0) return;
    const g = gid, Un = D.UNITS[q.type]; plays.delete(q);
    anim = { u: q, path, t0: performance.now(), dur: (path.length - 1) * STEP * k, per: IV('move') * k, dirs, seen: null };
    // 敌方单位：沿路每一格看不看得见，问核心（C.pathSeen，不改单位坐标）
    if (visMask && isEnemy(visP, q.owner) && C.pathSeen) { try { anim.seen = C.pathSeen(S, visP, q, path); } catch (e) { console.error(e); } }
    for (let i = 1; i < path.length; i++) {
      setTimeout(() => { if (g === gid) { sfx.move(); if (!staged) revealAt(q, path[i][0], path[i][1]); } }, i * STEP * k); // 迷雾：走一格揭开一格
      if (!Un.air && !Un.ship && i % 2) addFx('dust', path[i - 1][0], path[i - 1][1], 420, { delay: i * STEP - 40 }); // 陆军走过扬尘
    }
    await new Promise(r => setTimeout(r, anim.dur)); anim = null;
  }
  // 一次开火：炮口闪光 →（远程）炮弹飞过去 → 命中火花、飘字、镜头震动 → 击毁爆炸
  // 兵种自己的出手方式：lob = 抛物线投掷 + 落地爆炸（投弹手，数据里带 lob 的都算）；flame = 一道喷向目标的火焰（喷火兵）
  // rifle = 一道直线的曳光（狙击手，子弹不走抛物线）；rocket = 三发带尾烟的火箭齐射；missile = 一枚又快又直的导弹；bomb = 从目标正上方掉下来的炸弹
  const ATK_STYLE = { grn: 'lob', flm: 'flame', snp: 'rifle', rkt: 'rocket', sam: 'missile', bmb: 'bomb' };
  const atkStyle = k => ATK_STYLE[k] || (D.UNITS[k] && D.UNITS[k].lob ? 'lob' : 'gun');
  const atkLog = []; // 最近几次出手的演出方式（测试读）
  // by：出手的那个单位（可缺）。有新素材时它先转向目标、播 attack：第 1 帧是预备动作，第 2 帧开火——下面的特效从第 2 帧开始；
  // 挨打的一方（apply 返回的 victim）播 hit；被击毁的先播完 hit 再炸（核心已经把它移出 s.units，这段时间画的是替身）
  async function volley(from, to, type, owner, far, color, apply, by) {
    const style = atkStyle(type), d = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
    if (by) faceTo(by, to.x - from.x);
    const dir = to.x > from.x ? 'right' : to.x < from.x ? 'left' : by ? (facing(by) ? 'left' : 'right') : owner === 2 ? 'left' : 'right';
    atkLog.push({ type, style, d }); if (atkLog.length > 12) atkLog.shift();
    if (by && play(by, 'attack')) await sleep(IV('attack'));
    if (style === 'lob') { // 手扔：没有炮口闪光，弧线高，贴身也是抛过去；落地炸一下
      sfx.move();
      const dur = 300 + d * 70;
      addFx('shell', from.x, from.y, dur, { tx: to.x, ty: to.y, arc: Math.min(1.6, 0.45 + d * 0.25) });
      await sleep(dur);
      sfx.cannon(); addFx('explosion', to.x, to.y, 520, { kind: 'small' });
    } else if (style === 'flame') { // 火焰从喷火兵身上一路舔到目标格
      sfx.shot();
      addFx('flame', from.x, from.y, 560, { dx: Math.sign(to.x - from.x), dy: Math.sign(to.y - from.y) });
      await sleep(200); sfx.shot(); await sleep(180);
    } else if (style === 'rifle') { // 狙击：枪口一闪，一道曳光直着过去，没有弧线、落点不炸
      sfx.shot(); addFx('muzzle', from.x, from.y, 200, { dir });
      const dur = 110 + d * 22; addFx('tracer', from.x, from.y, dur, { tx: to.x, ty: to.y }); await sleep(dur);
    } else if (style === 'rocket') { // 火箭炮：三发先后出膛，弧线高
      addFx('muzzle', from.x, from.y, 260, { dir });
      const dur = 300 + d * 60;
      for (let n = 0; n < 3; n++) { setTimeout(() => sfx.shot(), n * 110); addFx('shell', from.x, from.y, dur, { tx: to.x + (n - 1) * 0.18, ty: to.y + (n === 1 ? 0 : 0.12), arc: Math.min(3, 0.9 + d * 0.32) + n * 0.15, delay: n * 110 }); }
      await sleep(dur + 220); sfx.cannon(); addFx('explosion', to.x, to.y, 520, { kind: 'small' });
    } else if (style === 'missile') { // 防空导弹：又快又直
      sfx.cannon(); addFx('muzzle', from.x, from.y, 240, { dir });
      const dur = 160 + d * 34; addFx('shell', from.x, from.y, dur, { tx: to.x, ty: to.y, arc: 0.25, delay: 60 }); await sleep(60 + dur);
    } else if (style === 'bomb') { // 轰炸机：炸弹从目标正上方落下
      sfx.move(); addFx('shell', to.x, to.y - 1.3, 300, { tx: to.x, ty: to.y, arc: 0 }); await sleep(300);
      sfx.cannon(); addFx('explosion', to.x, to.y, 560, { kind: 'big' });
    } else {
      (far ? sfx.cannon : sfx.shot)();
      addFx('muzzle', from.x, from.y, 240, { dir });
      if (far) {
        const dur = 240 + d * 55;
        addFx('shell', from.x, from.y, dur, { tx: to.x, ty: to.y, arc: Math.min(2.4, 0.5 + d * 0.3), delay: 90 });
        await sleep(90 + dur);
      } else await sleep(170);
    }
    const r = apply(), vic = r.victim;
    if (r.killed && !S.units.includes(vic)) addGhost(vic, to);
    const flinch = play(vic, 'hit');
    if (r.killed) dropGhost(vic, flinch);
    const U = D.UNITS[r.victim.type], sea = !U.air && onWater(to.x, to.y);
    addFx('hit', to.x, to.y, 320);
    if (sea) addFx('splash', to.x, to.y, 600);
    addFx('num', to.x, to.y, 950, { text: '-' + r.dmg + '%', col: color });
    shake(r.killed ? 3 : 1.5, r.killed ? 380 : 200);
    if (r.killed) {
      sfx.boom();
      addFx('explosion', to.x, to.y, 760, { kind: C.isInfantry && C.isInfantry(r.victim) ? 'small' : 'big', delay: Math.max(60, flinch) });
      if (sea) addFx('splash', to.x, to.y, 700, { delay: 200 + flinch });
    }
    return r;
  }
  async function doAttack(a, d) {
    const ap = { x: a.x, y: a.y }, dp = { x: d.x, y: d.y };
    const far = Math.abs(ap.x - dp.x) + Math.abs(ap.y - dp.y) > 1, as = a.stars, ds = d.stars;
    // C.attack 只结算一次（在第一下命中的那一刻），返回值里只读认识的字段；不认识的标志不管
    let res = null, first = false;
    // 结算的那一刻双方里谁被打掉了，核心当场就把它移出 s.units：先留替身，等轮到它挨打的那一下演完再撤
    const run = () => { if (!res) { res = C.attack(S, a, d) || {}; if (res.killedAtt) addGhost(a, ap); if (res.killedDef) addGhost(d, dp); } return res; };
    const hitDef = () => ({ dmg: run().dmg || 0, killed: !!res.killedDef, victim: d }), hitAtt = () => ({ dmg: run().counter || 0, killed: !!res.killedAtt, victim: a });
    try { first = !!(C.countersFirst && C.countersFirst(S, d, a)); } catch (e) { }
    // 燎原：目标脚下的森林烧成荒地（s.map.t 已改，重画这一格），火溅到目标四邻的单位，逐个飘字
    const burn = () => {
      if (res.burned) { const [x, y] = res.burned; checkMap(); sfx.cannon(); addFx('burn', x, y, 1300); lastBurn = { x, y, t: S.map.t[y][x] }; }
      (res.splash || []).forEach((h, i) => {
        const o = h.unit; if (!o || !unitSeen(o)) return;
        addFx('flame', dp.x, dp.y, 520, { dx: Math.sign(o.x - dp.x), dy: Math.sign(o.y - dp.y), delay: 80 + i * 120 });
        addFx('hit', o.x, o.y, 320, { delay: 260 + i * 120 }); play(o, 'hit', { delay: 260 + i * 120 });
        addFx('num', o.x, o.y, 1000, { text: '-' + h.dmg + '%', col: '#ff8a5c', delay: 260 + i * 120 });
      });
    };
    if (first) { // 防守方先手反击：先演反击，进攻方没死再出手
      await volley(dp, ap, d.type, d.owner, false, '#6fc3ff', hitAtt, d);
      if (!res.killedAtt) { await sleep(380); await volley(ap, dp, a.type, a.owner, far, '#ff8a5c', hitDef, a); burn(); }
    } else {
      await volley(ap, dp, a.type, a.owner, far, '#ff8a5c', hitDef, a); burn();
      if (res.counter > 0) { await sleep(380); await volley(dp, ap, d.type, d.owner, false, '#6fc3ff', hitAtt, d); }
    }
    if (res.splash && res.splash.length) await sleep(260 + res.splash.length * 120);
    if (res.refund && unitSeen(a)) popup({ x: ap.x, y: ap.y, id: a.id }, tt('返还技能槽'), 'go'); // 梭哈：第一次击毁返还一半技能槽
    if (a.stars > as && !res.killedAtt) addFx('levelup', ap.x, ap.y, 900, { delay: 300 });
    if (d.stars > ds && !res.killedDef) addFx('levelup', dp.x, dp.y, 900, { delay: 300 });
    if (res.bonus > 0) { const who = S.units.find(q => q.owner === res.bonusTo && (q === a || q === d)) || a; addFx('num', who.x, who.y, 1100, { text: '+' + res.bonus, col: '#ffc24a', delay: 520 }); }   // 击毁奖金（玄铢）
    if (res.loot > 0) { const at2 = res.killedDef ? dp : ap; addFx('num', at2.x, at2.y, 1100, { text: '+' + res.loot, col: '#ffc24a', delay: 380 }); } // 战利品资金
    updateHud();
    await sleep(res.killedDef || res.killedAtt ? 620 : 420);
    ghosts = ghosts.filter(g => g.u !== a && g.u !== d);
    return res;
  }
  // 导弹发射：导弹从井里飞到落点 → 大爆炸 → 范围内逐个飘字
  async function doSilo(u, cx, cy) {
    const from = { x: u.x, y: u.y }, d = Math.abs(cx - from.x) + Math.abs(cy - from.y);
    sfx.cannon(); shake(1.5, 300);
    addFx('dust', from.x, from.y, 500);
    const fly = Math.min(1100, 420 + d * 45);
    addFx('shell', from.x, from.y, fly, { tx: cx, ty: cy, arc: Math.min(5, 1.5 + d * 0.35) });
    await sleep(fly * 0.55);
    cur = { x: cx, y: cy };
    await sleep(fly * 0.45);
    const r = C.launchSilo(S, u, cx, cy);
    checkMap(); sfx.boom(); shake(5, 700);
    addFx('silo', cx, cy, 1400);
    const hits = ((r && r.hits) || []).filter(h => unitSeen(h.unit));
    hits.sort((p, q) => (Math.abs(p.unit.x - cx) + Math.abs(p.unit.y - cy)) - (Math.abs(q.unit.x - cx) + Math.abs(q.unit.y - cy)));
    hits.forEach((h, i) => {
      addFx('hit', h.unit.x, h.unit.y, 320, { delay: 260 + i * 110 }); play(h.unit, 'hit', { delay: 260 + i * 110 });
      addFx('num', h.unit.x, h.unit.y, 1000, { text: '-' + h.dmg + '%', col: isEnemy(u.owner, h.unit.owner) ? '#ff8a5c' : '#6fc3ff', delay: 260 + i * 110 });
    });
    updateHud();
    await sleep(1000 + hits.length * 110);
    return r;
  }
  function threat(u) {
    const r = C.reach(S, u), w = S.map.w, h = S.map.h, n = w * h, mv = new Uint8Array(n), at2 = new Uint8Array(n), rg = C.rangeOf(S, u);
    const occ = new Map(); for (const o of S.units) occ.set(o.y * w + o.x, o);
    for (let i = 0; i < n; i++) if (r.dist[i] < Infinity) mv[i] = 1;
    let cells = null; try { if (C.threatCells) cells = C.threatCells(S, u); } catch (e) { cells = null; }
    if (Array.isArray(cells)) { for (const i of cells) if (i >= 0 && i < n) at2[i] = 1; } // 核心算好的：站桩远程按现在的位置，近战和抛射按走得到的格子
    else if (rg) {
      const mark = i => { const x = i % w, y = (i - x) / w; for (let dy = -rg[1]; dy <= rg[1]; dy++) for (let dx = -rg[1]; dx <= rg[1]; dx++) { const d = Math.abs(dx) + Math.abs(dy), nx = x + dx, ny = y + dy; if (d >= rg[0] && d <= rg[1] && nx >= 0 && ny >= 0 && nx < w && ny < h) at2[ny * w + nx] = 1; } };
      if (!moveFire(u)) mark(u.y * w + u.x); // 移动后不能开火的：只算站在原地能打到的
      else for (let i = 0; i < n; i++) if (mv[i]) { const o = occ.get(i); if (!o || o === u) mark(i); }
    }
    // 视野：以这个单位为中心、半径 = 核心算的视野半径（C.unitMods 的 vision：兵种视野 + 指挥官 / 科技 / 山地 / 灯火管制等修正，
    // 和核心画战争迷雾用的是同一个数）的菱形。没开迷雾的对局也照这个数画
    let sr = D.UNITS[u.type].vision || 1; try { const md = C.unitMods ? C.unitMods(S, u) : null; if (md && typeof md.vision === 'number' && md.vision > 0) sr = md.vision; } catch (e) { }
    // 圈里的格子用核心的 C.unitSeeCells：菱形之内再扣掉它贴不着的森林、礁石、废墟等（这些格子里的敌人它看不见）；核心没有就画整个菱形
    let sight = null; try { if (C.unitSeeCells) sight = C.unitSeeCells(S, u); } catch (e) { console.error(e); sight = null; }
    if (!sight || sight.length !== n) {
      sight = new Uint8Array(n);
      for (let dy = -sr; dy <= sr; dy++) { const y = u.y + dy; if (y < 0 || y >= h) continue; const k = sr - Math.abs(dy); for (let x = Math.max(0, u.x - k); x <= Math.min(w - 1, u.x + k); x++) sight[y * w + x] = 1; }
    }
    return { u, mv, at: at2, sight, sr };
  }
  // ── 按住查看：按住取消键（鼠标右键 / Esc / 手柄 B）超过 HOLD_MS、或触屏长按一个单位，就一直显示它的移动范围、攻击范围和视野，松开恢复原样；
  // 短按仍是“取消 / 返回”，但等到松开才执行。peek 只是叠在画面上的一层，不改 mode、不动光标 ──
  const HOLD_MS = 200, TAP_STICKY = true;   // TAP_STICKY：鼠标右键短按一个单位，是否和以前一样进入“范围常显”（再按一次收起）
  let peek = null, hold = null, rLast = 0;
  const canHold = () => !!S && !Nav.stack.length && mode !== 'over' && mode !== 'title' && mode !== 'menu' && !curtain;
  function peekStart(t) {
    if (!canHold() || !t) return false;
    const q = unitAtV(t.x, t.y); if (!q || (anim && anim.u === q)) return false;   // 只能看本来就看得见的单位
    try { peek = threat(q); } catch (e) { console.error(e); peek = null; return false; }
    sfx.tick(); Kit.wake(); return true;
  }
  function peekEnd() { if (peek) { peek = null; Kit.wake(); } }
  // src：'mouse' / 'key' / 'pad'；t：要看的格子（鼠标是按下的位置，键盘和手柄是光标）
  function holdDown(src, t, pos) {
    if (hold) return;
    const h = hold = { src, t, pos: pos || null, long: false, timer: 0 };
    h.timer = setTimeout(() => { if (hold === h && peekStart(h.t)) h.long = true; }, HOLD_MS);   // 按够了时间、那一格上又有看得见的单位，才算“查看”
  }
  // 松开：这一次是查看就收起、不算取消；否则（短按，或按得久但那一格没有可看的单位）执行 tap
  function holdUp(src, tap) {
    const h = hold; if (!h || h.src !== src) return;
    hold = null; clearTimeout(h.timer);
    if (peek) { peekEnd(); return; }
    if (!h.long) tap(h);
  }
  function holdReset() { if (hold) clearTimeout(hold.timer); hold = null; peek = null; }
  // 视野的画法和战争迷雾一个路子：视野外压一层迷雾色（比真迷雾淡），视野边缘一圈浅色虚线。画在单位上面，所以视野外的单位也跟着暗下去
  function drawSight(v, z) {
    if (!z || !z.sight) return;
    const w = S.map.w, h = S.map.h, has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && z.sight[y * w + x] === 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(' + FOG_RGB[0] + ',' + FOG_RGB[1] + ',' + FOG_RGB[2] + ',.38)';
    for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) if (!has(x, y)) ctx.fillRect(bx + x * tp, by + y * tp, tp, tp);
    const lw = Math.max(2, Math.round(tp / 12)), dash = Math.max(4, Math.round(tp / 6));
    const hz = (X, Y) => { for (let k = 0; k < tp; k += dash * 2) ctx.fillRect(X + k, Y, Math.min(dash, tp - k), lw); }, vt = (X, Y) => { for (let k = 0; k < tp; k += dash * 2) ctx.fillRect(X, Y + k, lw, Math.min(dash, tp - k)); };
    for (const [col, o] of [['rgba(14,18,32,.85)', 1], ['#fff3c4', 0]]) {   // 先压一道深色的影子，再画浅色的虚线
      ctx.fillStyle = col;
      for (let y = v.y0 - 1; y <= v.y1 + 1; y++) for (let x = v.x0 - 1; x <= v.x1 + 1; x++) {
        if (!has(x, y)) continue;
        const X = bx + x * tp + o, Y = by + y * tp + o;
        if (!has(x, y - 1)) hz(X, Y); if (!has(x, y + 1)) hz(X, Y + tp - lw);
        if (!has(x - 1, y)) vt(X, Y); if (!has(x + 1, y)) vt(X + tp - lw, Y);
      }
    }
  }

  async function ok(viaMouse) {
    const m = S.map, w = m.w;
    if (mode === 'idle') {
      const q = unitAtV(cur.x, cur.y);
      if (q && q.owner === S.turn && !q.moved) return select(q);
      if (q && q.owner !== S.turn) { inspect = threat(q); mode = 'inspect'; sfx.ok(); return; }
      // 黑市开着：已经行动过的己方单位也能原地卖掉
      if (q && q.owner === S.turn && q.moved && sellOf(q)) {
        sfx.ok(); const back = () => { mode = 'idle'; };
        return openMenu([{ label: tt('出售', null, 'cmd'), icon: 'sell', right: '+' + sellOf(q), fn: () => confirmSell(q, back) }, { label: tt('取消', null, 'cmd'), icon: 'go', fn: back }], back, { focus: 'go' });
      }
      // 这座建筑本回合还能不能造，听核心的（有 C.buildLeft 就问它；造满了就当普通格子，打开回合菜单）
      let left = 1; try { if (C.buildLeft) left = C.buildLeft(S, cur.x, cur.y); } catch (e) { left = 1; }
      const fac = !q && !C.unitAt(S, cur.x, cur.y) && m.owner[cur.y][cur.x] === S.turn && C.buildList(S, cur.x, cur.y).length > 0;
      if (fac && left > 0) { sfx.ok(); return openBuild(); }
      if (fac) { sfx.no(); popup({ x: cur.x, y: cur.y, id: 0 }, tt('本回合已生产'), 'warn'); return; }
      if (!q && canTech(cur.x, cur.y)) { sfx.ok(); return openBaseMenu(); }   // 己方司令部 / 科研所：建筑菜单（研究）
      if (q && q.owner === S.turn && q.moved && canTech(cur.x, cur.y)) { sfx.ok(); return openBaseMenu(); }
      sfx.ok(); openMapMenu();
    } else if (mode === 'inspect') { inspect = null; mode = 'idle'; }
    else if (mode === 'move') {
      const i = cur.y * w + cur.x;
      let tr = C.loadTarget(S, sel, reach, cur.x, cur.y);
      const jn = !tr && C.joinTarget ? C.joinTarget(S, sel, reach, cur.x, cur.y) : null;
      if (!(aim && aim.t.x === cur.x && aim.t.y === cur.y)) updateAim();           // 鼠标、触屏直接点到敌人身上：现算一次
      if (aim && aim.t && S.units.includes(aim.t) && aim.t.x === cur.x && aim.t.y === cur.y) {
        const q = sel, g = gid, t = aim.t, st = aim.stand, path = C.path(reach.prev, st[1] * w + st[0], w), end = path[path.length - 1];
        aim = null; fcast = null; movePath = path; loadTr = joinTr = null; preview(true); mode = 'anim'; sfx.ok();
        await animMove(q, path, true); if (g !== gid || sel !== q) return;
        q.x = end[0]; q.y = end[1];
        if (await commit() !== 'ok' || g !== gid) return;                       // 路上被拦停：这次攻击作废
        let still = false; try { still = S.units.includes(t) && C.targets(S, q, q.x !== orig.x || q.y !== orig.y).includes(t); } catch (e) { }
        if (!still) { openAction(); return; }
        const res = await doAttack(q, t); if (g !== gid) return;
        return finish(q, res);
      }
      if (C.canStop(S, sel, reach, cur.x, cur.y) || tr || jn) {
        // 预演：先把单位摆到终点、弹行动菜单；路上有没有看不见的敌人，等行动定下来（commit）才过 C.resolveMove
        const path = C.path(reach.prev, i, w), end = path[path.length - 1], g = gid, q = sel;
        movePath = path; loadTr = tr; joinTr = jn; preview(true);
        mode = 'anim';
        await animMove(q, path, true); if (g !== gid || sel !== q) return;
        q.x = end[0]; q.y = end[1];
        openAction();
      } else if (outOfRange(cur.x, cur.y)) { sfx.no(); popup({ x: cur.x, y: cur.y, id: 0 }, tt('目标不在射程内'), 'warn'); }
      else if (viaMouse) { sfx.back(); deselect(); } else sfx.no();
    } else if (mode === 'target') {
      const t = targets[tIdx];
      if (cur.x !== t.x || cur.y !== t.y) return;
      const q = sel, g = gid; fcast = null; mode = 'anim';
      if (await commit() !== 'ok' || g !== gid) return; // 被拦停：选好的攻击作废
      const res = await doAttack(q, t); if (g !== gid) return;
      finish(q, res);
    } else if (mode === 'unload') {
      const sp = spots.find(q => q[0] === cur.x && q[1] === cur.y); if (!sp) return;
      const q = sel, g = gid; mode = 'anim';
      if (await commit() !== 'ok' || g !== gid) return;
      const r = C.unload(S, q, unloadIdx, sp[0], sp[1]); refreshVis();
      // 那一格藏着看不见的敌人：没卸成（返回 null），核心已经把运输单位记成已行动、乘客留在车上——按遇伏演出，这次行动结束
      if (!r) { cur = { x: q.x, y: q.y }; ambush(q); return done(); }
      acted = true; sfx.ok(); faceTo(q, sp[0] - q.x); openDoor(q);
      if (unloadItems().length) openAction(); else done();
    } else if (mode === 'silo') {
      const cx = cur.x, cy = cur.y;
      const q = sel, g = gid; fcast = null; mode = 'anim';
      if (await commit() !== 'ok' || g !== gid) return;
      const r = await doSilo(q, cx, cy); if (g !== gid) return;
      finish(q, r);
    }
  }
  // 撤回（防呆）：核心记着最近一次造兵 / 没有副作用的移动（C.undoInfo），下一个动作一做就失效
  const undoOf = () => { if (!S || mode !== 'idle' || !human[S.turn]) return null; try { const i = C.undoInfo ? C.undoInfo(S) : null; if (!i) return null; if (i.kind === 'move' && C.canUndoMove && !C.canUndoMove(S)) return null; return i; } catch (e) { return null; } };
  let lastUndo = null;
  async function undo() {
    const i = undoOf(); if (!i) return;
    const u = i.unit, g = gid, was = { x: u.x, y: u.y };
    let ok = false; try { ok = i.kind === 'build' ? C.undoBuild(S) : C.undoMove(S); } catch (e) { console.error(e); }
    if (!ok) { sfx.no(); return; }
    sfx.back(); lastUndo = { kind: i.kind, id: u.id }; cur = { x: i.from[0], y: i.from[1] };
    if (i.kind === 'build') { addFx('dust', was.x, was.y, 420); popup({ x: was.x, y: was.y, id: 0 }, Kit.t('已取消生产'), 'gold'); }
    else { const left = undoFace.get(u); if (left != null) faceMap.set(u, left); // 朝向是界面自己的状态，一起恢复；倒着滑回去
      if (tf() > 0 && (was.x !== u.x || was.y !== u.y)) { mode = 'anim'; const keep = facing(u); anim = { u, path: [[was.x, was.y], [u.x, u.y]], t0: performance.now(), dur: 160 * tf(), per: IV('move') * tf(), dirs: [keep], seen: null }; await new Promise(r => setTimeout(r, anim.dur)); anim = null; if (g !== gid) return; mode = 'idle'; } }
    checkMap(); updateHud(); autosave();
  }
  const undoFace = new WeakMap();
  function cancel() {
    if (mode === 'move') { sfx.back(); deselect(); } // 打完还能再动的单位也一样：取消 = 放回去，之后还能再选
    else if (mode === 'inspect') { inspect = null; mode = 'idle'; }
    else if (mode === 'idle') {
      // 有可撤回的事（刚造的兵、刚走完的一步）：光标在那个单位上或空地上时，取消 = 撤回；在别的单位上仍是看它的范围
      const q = unitAtV(cur.x, cur.y), ui = undoOf();
      if (ui && (!q || q === ui.unit)) return void undo();
      if (q && !(anim && anim.u === q)) { inspect = threat(q); mode = 'inspect'; sfx.ok(); }
    }
    else if (mode === 'target' || mode === 'silo') { sfx.back(); fcast = null; openAction(); }
    else if (mode === 'unload') { sfx.back(); openAction(); }
  }
  function moveCursor(dx, dy) {
    if (mode === 'target') return setTarget(tIdx + (dx + dy > 0 ? 1 : -1));
    if (mode === 'unload') { sIdx = (sIdx + (dx + dy > 0 ? 1 : -1) + spots.length) % spots.length; cur = { x: spots[sIdx][0], y: spots[sIdx][1] }; return; }
    if (mode === 'inspect') { inspect = null; mode = 'idle'; }
    if (mode !== 'idle' && mode !== 'move' && mode !== 'silo') return;
    const nx = Math.max(0, Math.min(S.map.w - 1, cur.x + dx)), ny = Math.max(0, Math.min(S.map.h - 1, cur.y + dy));
    if (nx !== cur.x || ny !== cur.y) {
      cur = { x: nx, y: ny }; sfx.tick();
      if (mode === 'silo') siloInfo();
      if (mode === 'move') updateAim();
    }
  }
  function nextUnit(d) {
    if (mode !== 'idle') return; d = d || 1;
    const list = S.units.filter(q => q.owner === S.turn && !q.moved); if (!list.length) return sfx.no();
    const i = list.findIndex(q => q.x === cur.x && q.y === cur.y), q = list[((i < 0 ? (d > 0 ? -1 : 0) : i) + d + list.length) % list.length];
    cur = { x: q.x, y: q.y }; sfx.tick();
  }

  // ───────── 回合 ─────────
  async function firePower() {
    const p = S.turn; if (!powersOn() || S.meter[p] < D.METER_MAX) { mode = 'idle'; return; }
    const co = coOf(p);
    const hp = new Map(); for (const q of S.units) hp.set(q, q.hp);
    C.usePower(S, p); sfx.power(); updateHud(); mode = 'anim'; const g = gid; if (Camp && S.camp) Camp.tick('power', S.co[p]);
    let k = 0;
    for (const q of S.units) { // 技能当场改了血量的：回血放治疗特效，掉血放中弹
      const was = hp.get(q);
      if (was == null && unitSeen(q)) { addFx('levelup', q.x, q.y, 900, { delay: 200 + (k % 12) * 40 }); addFx('heal', q.x, q.y, 800, { delay: 200 + (k++ % 12) * 40 }); if (human[p] || !visMask) cur = { x: q.x, y: q.y }; continue; } // 技能放出来的新单位（民兵、军医救回来的）：出场演出
      if (was == null || was === q.hp || !unitSeen(q)) continue;
      if (q.hp < was) play(q, 'hit', { delay: 200 + (k % 12) * 40 });
      addFx(q.hp > was ? 'heal' : 'hit', q.x, q.y, q.hp > was ? 800 : 320, { delay: 200 + (k++ % 12) * 40 });
    }
    let pwi = null; try { pwi = C.powerInfo ? C.powerInfo(S, p) : null; } catch (e) { }
    const pwName = (pwi && pwi.name) || co.power, pwDesc = (pwi && pwi.desc) || co.desc;
    await banner({ p, pre: coLabel(co), big: tt('{name}！', { name: pwName }), sub: Kit.short(pwDesc, 30), power: true, bg: powerBg(p), text: tt('{co}：{name}！ {desc}', { co: coLabel(co), name: pwName, desc: pwDesc }), co: { id: co.id, p, mood: 'power', quote: quoteOf(co.id) }, hold: quoteOf(co.id) ? 1900 : 1500 });
    if (g !== gid) return;
    mode = human[p] ? 'idle' : 'ai'; updateHud(); if (human[p]) autosave();
  }
  async function endTurn() {
    closeMenu(); unstage(); sel = reach = reachMask = inspect = null; fcast = null;
    mode = 'anim'; const g = gid;
    const hp = new Map(); for (const q of S.units) hp.set(q, q.hp);
    C.endTurn(S); checkMap(); checkDefeats();
    if (S.winner) return over();
    // 多人同屏 + 迷雾：下一位是玩家就先拉黑幕，等他接手
    const needCurtain = fogOn() && human[S.turn] && plist().filter(p => human[p]).length > 1 && !DEMO;
    if (needCurtain) curtain = true;
    if (human[S.turn]) lastHuman = S.turn;
    updateHud();
    const keep = cur; homeCursor();
    if (visMask && !human[S.turn] && !seen(cur.x, cur.y)) cur = keep; // 迷雾：电脑的司令部看不见，光标和镜头就不过去
    camAnim = null; placeCam(true); lastCurKey = cur.x + ',' + cur.y;
    autosave();
    if (needCurtain) { await handoff(S.turn); if (g !== gid) return; }
    let k = 0;
    for (const q of S.units) { const was = hp.get(q); if (was != null && q.hp > was && unitSeen(q)) addFx('heal', q.x, q.y, 800, { delay: 250 + (k++ % 10) * 60 }); } // 回合开始的修理、医院、维修车
    // 维修车：旁边有友军这回合开始时回了血，就伸一下吊臂（朝着被修的那个）
    for (const r of S.units) {
      if (r.type !== 'rep' || r.owner !== S.turn || !unitSeen(r)) continue;
      const o = S.units.find(q => q.owner === r.owner && Math.abs(q.x - r.x) + Math.abs(q.y - r.y) === 1 && hp.get(q) != null && q.hp > hp.get(q));
      if (o) { faceTo(r, o.x - r.x); openDoor(r, 250); }
    }
    sfx.turn(); oreEvents();
    // 这个回合开始时完成的科技（s.events）：屏幕上方一块大字提示
    try {
      const done = (S.events || []).filter(e => e && e.type === 'tech' && e.player === S.turn);
      if (done.length && tf() > 0 && human[S.turn]) { // 研究完成：司令部上飘“××研究完成”，响一声
        const m = S.map; let hq = null; for (let y = 0; y < m.h && !hq; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'hq' && m.owner[y][x] === S.turn) { hq = { x, y, id: 0 }; break; }
        const names = done.map(e => { const t = (D.TECH || []).find(q => q.id === e.id); return t ? t.name : e.id; });
        if (hq) { const text = tt('{names} 研究完成', { names: Kit.join(names) }); fx.push({ type: 'ambush', big: true, rise: true, tone: 'go', text, x: hq.x, y: hq.y, dur: 2600, t0: performance.now() + 900 }); lastPop = { id: 0, text }; }
        setTimeout(() => sfx.captured(), 900);
      }
      if (human[S.turn] && tf() > 0) {
        const m = S.map; let hq = null; for (let y = 0; y < m.h && !hq; y++) for (let x = 0; x < m.w; x++) if (m.t[y][x] === 'hq' && m.owner[y][x] === S.turn) { hq = { x, y }; break; }
        const fund = (S.events || []).find(e => e && e.type === 'fund' && e.player === S.turn);
        techKey = '';
        // 回合开始：研究点进账；有买得起的科技时再提示一句（引导到司令部）
        if (hq && fund && fund.gain > 0) { const text = tt('研究点 +{n}（现有 {m}）', { n: fund.gain, m: fund.total != null ? fund.total : (S.rp && S.rp[S.turn]) || 0 }); fx.push({ type: 'ambush', rise: true, tone: 'gold', text, x: hq.x, y: hq.y, dur: 1800, t0: performance.now() + 1300 }); lastRp = { gain: fund.gain, total: fund.total, text }; }
        if (hq && techMark()) fx.push({ type: 'ambush', tone: 'go', text: tt('有可解锁的科技'), x: hq.x, y: hq.y, dur: 2400, t0: performance.now() + (fund && fund.gain > 0 ? 3200 : 1300) });
      }
    } catch (e) { console.error(e); }
    music(turnTrack());
    await bannerTurn(tt('收入 +{n}', { n: C.income(S, S.turn) }));
    if (g !== gid) return;
    if (Camp && S.camp) { Camp.tick('turn'); if (S.winner) return over(); await Camp.idle(); if (g !== gid) return; }
    if (human[S.turn]) { mode = 'idle'; updateHud(); } else runAI();
  }
  // 电脑的一个回合。迷雾里：电脑的单位从头到尾都在看不见的地方，这一步就不演出、镜头也不跟
  async function runAI() {
    mode = 'ai'; updateHud(); const g = gid; let guard = 0;
    await sleep(250);
    while (g === gid && !S.winner && guard++ < 3000) {
      if (Camp && S.camp) { await Camp.idle(); if (g !== gid) return; Camp.tick('act'); if (S.winner) break; }   // 关中对话播完电脑再接着走
      let a = C.aiNext(S);
      if (a.type === 'end') break;
      if (a.type === 'power') { await firePower(); if (g !== gid) return; mode = 'ai'; continue; }
      if (a.type === 'build') {
        quiet = !!visMask && isEnemy(visP, S.turn) && !seen(a.x, a.y);
        if (!quiet) cur = { x: a.x, y: a.y };
        if (a.ore) C.build(S, a.x, a.y, a.unit, { ore: true }); else C.build(S, a.x, a.y, a.unit); sfx.build(); updateHud(); await sleep(320); quiet = false; continue;
      }
      // 界面每一步都从 state 现读（单位还在不在、动没动过），不自己记“已行动”：同一个单位一回合里可能被核心放出来行动好几次
      const redraw = () => { oreEvents(); checkMap(); checkDefeats(); miniDirty = true; updateHud(); };
      // 不认识的动作类型：整个交给核心执行，然后整盘重画
      if (a.type !== 'unit') { try { C.aiApply(S, a); } catch (e) { console.error(e); break; } redraw(); continue; }
      const q = a.u;
      if (q && a.act === 'sell') { // 黑市：电脑把残血的单位原地卖掉
        const x = q.x, y = q.y, show = unitSeen(q); let out = null;
        if (show) { cur = { x, y }; await sleep(160); }
        try { out = C.aiApply(S, a); } catch (e) { console.error(e); q.moved = true; }
        const got = out && typeof out.result === 'number' ? out.result : 0;
        if (got) { lastSell = { id: q.id, got }; if (show) { sfx.build(); addFx('dust', x, y, 500); addFx('num', x, y, 1200, { text: '+' + got, col: '#ffc24a' }); await sleep(420); } }
        else if (S.units.includes(q)) q.moved = true; // 没卖成：别让电脑在这个单位上打转
        if (g !== gid) return; redraw(); continue;
      }
      if (!q) { try { C.aiApply(S, a); } catch (e) { console.error(e); break; } redraw(); continue; }
      // 核心的约定：有 path 就一定是走路的路径（至少两格）；原地不动的动作（原地开炮、接着占领、原地等待）不带 path，x、y 就是单位现在的位置。
      // 原地的动作一样要演出，所以补一条只有起点的路径，走下面同一套流程
      if (!Array.isArray(a.path) || !a.path.length) a = Object.assign({}, a, { path: [[q.x, q.y]], x: a.x != null ? a.x : q.x, y: a.y != null ? a.y : q.y });
      let mv = { path: a.path, trapped: false };
      if (C.resolveMove) { try { const r = C.resolveMove(S, q, a.path); if (r && r.path && r.path.length) mv = r; } catch (e) { console.error(e); } }
      const path = mv.path, end = path[path.length - 1], tg = a.act === 'attack' ? a.target : null, foe = !!visMask && isEnemy(visP, q.owner);
      const known = { wait: 1, attack: 1, capture: 1, silo: 1, unload: 1, load: 1 };
      // 路被截短了但不算遇伏（核心新加的拦停方式）：只走到截短的地方，后面的动作作废，让核心下一步重新盘算；原地没动就算它这回合用掉了
      const cut = !mv.trapped && known[a.act] && a.x != null && (end[0] !== a.x || end[1] !== a.y);
      // 敌方单位沿路每一格看不看得见（C.pathSeen，第一格就是它现在的位置）：从头到尾都看不见、打的也不是看得见的目标，这一步就不演出
      let ps = null; if (foe) { try { ps = C.pathSeen ? C.pathSeen(S, visP, q, path) : null; } catch (e) { console.error(e); } }
      quiet = foe && a.act !== 'silo' && !(ps ? ps.some(Boolean) : unitSeen(q)) && !(tg && unitSeen(tg));
      if (!quiet && (!foe || unitSeen(q))) cur = { x: q.x, y: q.y };
      if (path.length > 1 || a.act !== 'wait') await sleep(110);
      await animMove(q, path); if (g !== gid) return;   // 这期间回了标题 / 换了一局
      // 挪到 (x, y)：C.moveUnit 可能返回天网的自动射击，逐发演出；返回 false = 这架飞机被打掉了（已经不在 s.units 里），这一步到此为止
      const moveTo = async (x, y) => { let shot = null; try { shot = C.moveUnit(S, q, x, y, path) || null; } catch (e) { console.error(e); } refreshVis(); if (shot) await playShots(q, shot); return !(shot && shot.killed); };
      if (mv.trapped) { if (await moveTo(end[0], end[1])) { q.moved = true; if (!quiet) { cur = { x: q.x, y: q.y }; ambush(q); await sleep(500); } await ambushShot(q, mv); } }
      else if (cut) { if (await moveTo(end[0], end[1])) { if (path.length < 2) q.moved = true; if (!quiet && unitSeen(q) && path.length > 1) { cur = { x: q.x, y: q.y }; popup(q, tt('发现敌方单位！'), 'warn'); await sleep(380); } } }
      else if (a.act === 'load') { if (a.target && S.units.includes(a.target) && C.canLoad(S, q, a.target)) { C.load(S, q, a.target); if (!quiet && unitSeen(a.target)) { openDoor(a.target); await sleep(180); } } else q.moved = true; }
      else if (known[a.act] && !(a.act === 'silo' && !C.launchSilo)) {
        if (!(await moveTo(a.x, a.y))) { quiet = false; if (g !== gid) return; redraw(); continue; }
        if (g !== gid) return;
        if (!quiet && (!foe || unitSeen(q))) cur = { x: a.x, y: a.y };
        if (a.act === 'attack') {
          // 目标已经不在了，或者（迷雾）走开以后目标又看不见了：不打，这个单位这回合到此为止（和 C.aiApply 一致）
          let can = !!tg && S.units.includes(tg); try { if (can && fogOn() && C.canSee && !C.canSee(S, q.owner, tg)) can = false; } catch (e) { }
          if (!can) q.moved = true;
          else {
            if (!quiet && (!foe || seen(tg.x, tg.y))) cur = { x: tg.x, y: tg.y };
            await sleep(140);
            const res = await doAttack(q, tg); if (g !== gid) return;
            // 打完还能再动（核心把 moved 置回 false）：这里不补记已行动，电脑下一步会接着让它移动
            if (res && res.again && S.units.includes(q) && !q.moved && !quiet && unitSeen(q)) { cur = { x: q.x, y: q.y }; popup(q, res.full ? tt('再次行动') : tt('再次移动'), 'go'); await sleep(420); }
          }
        }
        else if (a.act === 'capture') { const pre = capPre(q), okc = C.capture(S, q); if (!quiet && unitSeen(q)) { await captureShow(q, okc, pre); if (g !== gid) return; } await sleep(330); }
        else if (a.act === 'silo') { await sleep(200); await doSilo(q, a.cx, a.cy); }
        else if (a.act === 'unload') {
          // 卸载点按出发时的视野判断；那一格藏着看不见的单位时 C.unload 返回 null（遇伏：乘客留在车上，运输单位已行动）
          let spots2 = []; try { spots2 = C.unloadSpots(S, q, a.cargo, path[0]) || []; } catch (e) { console.error(e); }
          if (q.cargo[a.cargo] && spots2.some(c => c[0] === a.ux && c[1] === a.uy)) {
            const r = C.unload(S, q, a.cargo, a.ux, a.uy); refreshVis();
            if (r) { sfx.ok(); if (!quiet && unitSeen(q)) { faceTo(q, a.ux - q.x); openDoor(q); } await sleep(260); } else if (!quiet && unitSeen(q)) { cur = { x: q.x, y: q.y }; ambush(q); await sleep(500); }
          } else q.moved = true;
        } else q.moved = true;
      } else { try { C.aiApply(S, a); } catch (e) { console.error(e); q.moved = true; } } // 不认识的动作交给核心，下面整盘重画
      quiet = false;
      if (g !== gid) return;
      redraw();
    }
    quiet = false;
    if (g !== gid) return;
    if (S.winner) return over();
    endTurn();
  }
  function over() {
    const g0 = gid; mode = 'over'; closeOverlays(); fcast = null; visMask = seeMask = null;
    clearSave(); music('off');
    const win = winnersOf(), ps = plist(), hs = ps.filter(p => human[p] || quit.has(p));
    const lost = hs.length > 0 && hs.length < ps.length && !win.some(p => human[p]); // 有电脑参战、玩家不在获胜队伍里
    (lost ? sfx.lose : sfx.win)();
    const why = gaveUp ? tt('{who} 认输', { who: pname(gaveUp) }) : S.reason === 'hq' ? tt('占领敌方司令部') : S.reason === 'days' ? tt('到达天数上限，按建筑数和单位总造价判定') : tt('击毁敌方全部单位');
    if (S.camp && Camp) { const won = S.camp.result ? S.camp.result === 'win' : win.includes(S.camp.seat); return void wipe({ p: won ? (win.find(p => human[p]) || 0) : 0, big: won ? tt('作战成功') : tt('作战失败'), full: true, ms: 1100 }).then(() => { if (g0 === gid && mode === 'over') Camp.finish(won); }); }
    // 胜负：先一道整屏转场（胜方的阵营色 + “胜利 / 失败”），再出结算页
    const g = gid, anyHuman = hs.length > 0;
let unlock = null; try { unlock = freeWin(win, lost); } catch (e) { console.error(e); }
    lastUnlock = unlock;
    wipe({ p: lost ? 0 : (win[0] || 0), big: lost ? tt('失败') : anyHuman ? tt('胜利') : tt('对局结束'), full: true, ms: 1100 }).then(() => {
      if (g !== gid || mode !== 'over') return;
      BT.over({ win, lost, why, day: S.day, unlock });
      // 这一局让黑潮开放了：结算页出来之后接一段整屏演出，看完回到结算页
      if (unlock && unlock.now) setTimeout(() => { if (g === gid && mode === 'over') { sfx.win(); BT.unlockShow({ faction: unlock.faction, cos: unlock.cos, bg: facBg(unlock.faction) }); } }, TURBO ? 50 : 1300);
    });
  }
  // 自由对局里玩家赢了电脑：告诉进度模块（AWCampaignRun.recordFreeWin，阵营 = 玩家这个席位扮演的阵营，难度 = 对手里最弱的电脑），
  // 并整理结算页上的一行解锁进度。黑潮早就开放了、或这一局不是“玩家赢电脑”时返回 null
  let freeDone = 0, lastUnlock = null;
  function freeWin(win, lost) {
    const R = window.AWCampaignRun, F = 5; if (!R || !R.unlockInfo || !R.recordFreeWin || S.camp || DEMO || lost) return null;
    const me = win.find(p => human[p]); if (!me) return null;
    const foes = plist().filter(p => isEnemy(me, p) && !human[p] && !quit.has(p)); if (!foes.length) return null;
    const rank = { easy: 0, normal: 1, hard: 2 }, lvOf = p => { try { return C.aiLevel ? C.aiLevel(S, p) : (S.rules && S.rules.aiLevel) || 'normal'; } catch (e) { return 'normal'; } };
    const lv = foes.map(lvOf).sort((a, b) => (rank[a] == null ? 1 : rank[a]) - (rank[b] == null ? 1 : rank[b]))[0];
    const was = R.unlockInfo(F).open; let now = false;
    if (freeDone !== gid) { freeDone = gid; now = !!R.recordFreeWin(fac(me), lv); }   // 一局只记一次
    if (was && !now) return null;
    const info = R.unlockInfo(F), name = (D.PLAYERS && D.PLAYERS[F]) || '', free = (info.reasons || []).slice(-4), fn = i => (D.PLAYERS && D.PLAYERS[i + 1]) || String(i + 1);   // 最后四条是四国各赢一局，顺序就是阵营编号
    const got = free.map((r, i) => r.done ? fn(i) : '').filter(Boolean), need = free.map((r, i) => r.done ? '' : fn(i)).filter(Boolean);
    const parts = []; if (got.length) parts.push(tt('已用{list}获胜', { list: Kit.join(got) })); if (need.length) parts.push(tt('还差{list}', { list: Kit.join(need) })); if (lv === 'easy') parts.push(tt('简单难度的对局不计入'));
    let cos = []; try { cos = (R.unlockedCos ? R.unlockedCos() : []).filter(id => D.COS.some(c => c.id === id && c.faction === F)); } catch (e) { }
    return { faction: F, name, now, open: !!info.open, text: info.open ? tt('已解锁，可在自由对局中选用') : parts.join('　'), cos, level: lv, by: fac(me) };
  }
  // 阵营的主视觉：界面素材里的 bg<编号>，没有就用技能演出的那张阵营底图
  function facBg(f) { try { const A = window.AWUIAssets; if (A && A['bg' + f]) return A['bg' + f]; const m = window.AWCG && window.AWCG.misc, v = m && m.power, im = v && typeof v === 'object' ? v[f] : ''; return im ? (window.AWCGPlayer ? window.AWCGPlayer.src(im) : im) : ''; } catch (e) { return ''; } }
  function showHelp() { Front.help(); }

  // ───────── 换语言：记住选择 → 对局中先自动存档 → 整页重新加载 → 回到原来的画面 ─────────
  // lang：语言 id 或 'auto'。语言和“跟随浏览器”都没变就返回 false、不重载。
  // 重载前在 localStorage 记一个一次性标记（steel-tide.afterLang）：'game' = 重载后接着这一局（普通对局和战役关卡都走自动存档），并打开对局内的设置页；
  // 'title' = 回到标题、打开设置页。标记在启动流程末尾读取并清掉（见文件末尾的 afterLang）
  const LANG_FLAG = 'steel-tide.afterLang';
  function switchLang(lang, from) {
    const I = window.AWI18n; if (!I || typeof I.set !== 'function') return false;
    const was = I.lang, wasAuto = !!I.auto;
    try { I.set(lang); } catch (e) { console.error(e); return false; }
    if (I.lang === was && !!I.auto === wasAuto) return false;
    let where = from === 'title' ? 'home' : 'title';   // home：在标题画面换的，重载后停在标题；title：在设置里换的，重载后回到设置
    if (S && !S.winner && mode !== 'title' && mode !== 'over' && !DEMO) {
      unstage();                               // 预演里摆到终点的单位先放回出发格，存下来的才是行动前的局面
      autosave(); if (loadSave()) where = 'game';
    } else {
      // 战役世界地图开着：重载后回到世界地图，光标落回原来的据点
      try { const W = Camp && Camp.world; if (W && W.on) where = 'world:' + (W.sel || ''); } catch (e) { }
    }
    lsSet(LANG_FLAG, where);
    try { location.reload(); } catch (e) { console.error(e); }
    return true;
  }
  async function afterLang() {
    const w = lsGet(LANG_FLAG); if (!w) return;
    try { localStorage.removeItem(LANG_FLAG); } catch (e) { }
    if (w === 'home') return;
    if (w.indexOf('world:') === 0) { try { if (Camp && Camp.select) Camp.select(w.slice(6) || undefined); } catch (e) { console.error(e); } return; }
    if (w !== 'game' || !loadSave()) { if (w === 'game' || w === 'title') openSettings(false); return; }
    const t = TURBO; TURBO = true;             // 接着上一局：不演开场转场和回合横幅，直接回到战场
    try { await resumeGame(); } finally { TURBO = t; }
    if (!S || S.winner) return;
    // 战役关卡：存档里的关卡标题、目标是换语言之前写进去的，按当前语言的关卡数据重写一遍
    try { const l = S.camp && Camp && Camp.level; if (l) { S.camp.title = l.no + ' ' + l.title; S.camp.goal = l.goal || ''; } } catch (e) { }
    if (mode === 'idle' && human[S.turn] && !Nav.stack.length) openSettings(true);
  }

  // ───────── 输入 ─────────
  const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  // 全局统一的操作：方向 移动焦点 / 光标；ok（A）确定；cancel（B）返回；x 详情；y 菜单；lb / rb 切换大类（对局里是上一个 / 下一个单位）；start 暂停菜单
  function act(a, dev) {
    ptrKind = 'key'; if (dev) Kit.setDev(dev); Kit.wake();
    if (a === 'sound') { setSound(!soundOn); if (soundOn) sfx.ok(); return; }   // 任何页面上都能切
    audio();
    if (a === 'next') a = 'rb'; else if (a === 'menu') a = 'y'; else if (a === 'E') a = Nav.stack.length ? 'rb' : 'y';
    if (Nav.stack.length) { Nav.act(a); return; }
    if (a === 'mini') { if (S && mode !== 'over' && mode !== 'title') { toggleMini(); sfx.tick(); } return; }
    if (a === 'undo') { if (undoOf()) undo(); return; }
    if (a === 'endturn') { if (S && mode === 'idle' && human[S.turn]) { sfx.ok(); endTurn(); } return; }
    if (a === 'zoomIn' || a === 'zoomOut' || a === 'zoomAuto') { // 缩放只挪镜头，电脑行动、动画播放时也能用
      if (S && mode !== 'over' && mode !== 'title' && mode !== 'menu') { if (a === 'zoomAuto') { setZoom(0); sfx.tick(); } else zoomStep(a === 'zoomIn' ? 1 : -1); }
      return;
    }
    if (!S || mode === 'over' || mode === 'title' || mode === 'menu') return;
    if (a === 'x') return openDetail();          // 详情随时能看（电脑行动时也行）
    if (mode === 'anim' || mode === 'ai') return;
    if (DIR[a]) moveCursor(DIR[a][0], DIR[a][1]);
    else if (a === 'ok') ok(false);
    else if (a === 'cancel') cancel();
    else if (a === 'rb') nextUnit(1); else if (a === 'lb') nextUnit(-1);
    else if ((a === 'y' || a === 'start') && mode === 'idle') { sfx.ok(); openMapMenu(); }
  }
  const KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
    Enter: 'ok', ' ': 'ok', z: 'ok', j: 'ok', Escape: 'cancel', x: 'cancel', Backspace: 'cancel', k: 'cancel',
    Tab: 'rb', q: 'lb', '[': 'lb', ']': 'rb', e: 'E', m: 'y', f: 'x', c: 'x', p: 'start', n: 'mini', v: 'sound', PageUp: 'pgup', PageDown: 'pgdn',
    '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', '_': 'zoomOut', '0': 'zoomAuto',
  };
  // 空格：地图比窗口大时，按住空格拖鼠标是平移镜头，所以“确定”等松开时再算（没拖过才算）
  let spaceDown = false, spaceDragged = false, drag = null, ptr = null;
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' && S && (scrollX || scrollY) && !Nav.stack.length) {
      e.preventDefault(); if (!e.repeat) { spaceDown = true; spaceDragged = false; cv.style.cursor = 'grab'; } return;
    }
    const a = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    // 对局里的取消键（Esc / X / 退格 / K）：按住 = 查看光标下的单位，短按 = 取消，都等松开才算（见 holdDown / holdUp）。有菜单、页面开着时照旧按下就响应
    if (a === 'cancel' && (canHold() || (hold && hold.src === 'key'))) { e.preventDefault(); if (!e.repeat && canHold()) { ptrKind = 'key'; Kit.setDev('key'); Kit.wake(); holdDown('key', { x: cur.x, y: cur.y }); } return; }
    if (a) { e.preventDefault(); act(a === 'rb' && e.key === 'Tab' && e.shiftKey ? 'lb' : a, 'key'); }
  });
  addEventListener('keyup', e => { if (hold && hold.src === 'key' && KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key] === 'cancel') holdUp('key', () => act('cancel', 'key')); });
  addEventListener('keyup', e => {
    if (e.key !== ' ' || !spaceDown) return;
    spaceDown = false; cv.style.cursor = '';
    if (!spaceDragged && !drag) act('ok', 'key');
  });
  addEventListener('blur', () => { spaceDown = false; drag = null; ptr = null; miniDown = false; cv.style.cursor = ''; holdReset(); });

  function tileAt(e) { const x = Math.floor((e.clientX - ox) / ts), y = Math.floor((e.clientY - TOP - oy) / ts); return (S && x >= 0 && y >= 0 && x < S.map.w && y < S.map.h) ? { x, y } : null; }
  // 鼠标落在哪块常驻面板上（阵营牌、信息、小地图、小地图开关）
  function hudAt(e) {
    if (!S || mode === 'over' || curtain) return null;
    const px = e.clientX / u, py = e.clientY / u, inR = r => r && px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
    return inR(hud.miniBtn) ? 'miniBtn' : inR(hud.mini) ? 'mini' : inR(hud.miniPanel) ? 'miniPanel' : inR(hud.status) ? 'status' : inR(hud.info) ? 'info' : null;
  }
  // 鼠标悬停换格不带动镜头（镜头只跟键盘、手柄和电脑的光标）
  function hover(t) {
    if (mode === 'idle' || mode === 'move' || mode === 'silo') {
      if (t.x !== cur.x || t.y !== cur.y) { cur = t; lastCurKey = t.x + ',' + t.y; if (mode === 'silo') siloInfo(); if (mode === 'move') updateAim(); }
    }
    else if (mode === 'target') { const i = targets.findIndex(q => q.x === t.x && q.y === t.y); if (i >= 0 && i !== tIdx) setTarget(i); }
    else if (mode === 'unload') { const i = spots.findIndex(q => q[0] === t.x && q[1] === t.y); if (i >= 0) { sIdx = i; cur = { x: t.x, y: t.y }; } }
  }
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;   // 触屏另有一套（拖动平移、捏合缩放）
    if (drag) { spaceDragged = true; panBy(drag.x - e.clientX, drag.y - e.clientY); drag.x = e.clientX; drag.y = e.clientY; return; }
    if (miniDown) { miniJump(e); return; }
    ptr = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY - TOP } : null;
    if (Nav.stack.length || !S || hudAt(e)) return; const t = tileAt(e); if (t) hover(t);
  });
  cv.addEventListener('pointerleave', () => { ptr = null; });
  const endDrag = () => { miniDown = false; if (drag) { drag = null; cv.style.cursor = spaceDown ? 'grab' : ''; } };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  // 鼠标停在画布边缘：镜头往那边滚
  function edgeScroll(dt) {
    if (!ptr || drag || miniDown || !S || !(scrollX || scrollY) || Nav.stack.length || mode === 'over' || mode === 'title') return;
    if (hudAt({ clientX: ptr.x, clientY: ptr.y + TOP })) return; // 鼠标停在角上的面板（小地图、阵营牌）上不算靠边
    const W = viewW(), H = viewH(), z = 26;
    const vx = ptr.x < z ? -1 : ptr.x > W - z ? 1 : 0, vy = ptr.y < z ? -1 : ptr.y > H - z ? 1 : 0;
    if (!vx && !vy) return;
    const a = ox, b = oy;
    panBy(vx * ts * 16 * dt, vy * ts * 16 * dt);
    if ((a !== ox || b !== oy) && mode !== 'anim' && mode !== 'ai') { const t = tileAt({ clientX: ptr.x, clientY: ptr.y + TOP }); if (t) hover(t); }
  }
  // 触摸板双指滚动 / 滚轮：地图比窗口大时平移镜头；其余情况吃掉事件，页面不跟着动（菜单、各页面、图鉴内部照常滚动）
  // Ctrl / ⌘ + 滚轮、触摸板双指捏合（浏览器把捏合报成带 ctrlKey 的滚轮事件）：换缩放档位，鼠标所在的位置不动
  let zoomAcc = 0, zoomAccT = 0, zoomLock = 0;
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    if (S && (e.ctrlKey || e.metaKey)) {
      if (Nav.stack.length || mode === 'over' || mode === 'menu') return;
      const now = performance.now(); if (now < zoomLock) return;
      if (now - zoomAccT > 400) zoomAcc = 0; zoomAccT = now;
      zoomAcc += e.deltaY * (e.deltaMode === 1 ? 32 : 1);
      if (Math.abs(zoomAcc) >= 24) { zoomStep(zoomAcc < 0 ? 1 : -1, e.clientX, e.clientY); zoomAcc = 0; zoomLock = now + 220; }
      return;
    }
    if (!S || e.ctrlKey || !(scrollX || scrollY)) return;
    const k = e.deltaMode === 1 ? 32 : 1;
    panBy(e.deltaX * k, e.deltaY * k);
  }, { passive: false });
  // Safari 的触摸板捏合走 gesture 事件：每捏到 1.25 倍（或 0.8 倍）换一档
  let pinch0 = 1;
  addEventListener('gesturestart', e => { e.preventDefault(); pinch0 = 1; }, { passive: false });
  addEventListener('gesturechange', e => {
    e.preventDefault(); if (!S || Nav.stack.length || mode === 'over' || mode === 'menu') return;
    const r = (e.scale || 1) / pinch0;
    if (r >= 1.25 || r <= 0.8) { zoomStep(r > 1 ? 1 : -1, e.clientX, e.clientY); pinch0 = e.scale || 1; }
  }, { passive: false });
  addEventListener('gestureend', e => e.preventDefault(), { passive: false });
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey || !(e.target.closest && e.target.closest('.sc, .ls, .grid, .wrap, #menu'))) e.preventDefault();
  }, { passive: false });
  function press(e) {
    audio();
    if (e.button === 2) return;
    if (S && (e.button === 1 || spaceDown) && (scrollX || scrollY)) { // 中键 / 按住空格：拖动镜头
      e.preventDefault(); drag = { x: e.clientX, y: e.clientY }; cv.style.cursor = 'grabbing';
      try { cv.setPointerCapture(e.pointerId); } catch (er) { }
      return;
    }
    if (e.button === 1) return;
    if (Nav.stack.length) { Nav.cancel(); return; }
    if (!S || mode === 'over') return;
    const h = hudAt(e);
    if (h === 'miniBtn') { toggleMini(); sfx.tick(); return; }
    if (h === 'mini') { miniDown = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { } miniJump(e); e.preventDefault(); return; }
    if (h) return;
    if (mode === 'anim' || mode === 'ai') return;
    const t = tileAt(e);
    if (!t) { if (mode === 'move') cancel(); return; }
    if (mode === 'inspect') { inspect = null; mode = 'idle'; if (!unitAtV(t.x, t.y)) { hover(t); return; } }
    const was = cur.x + ',' + cur.y;
    hover(t);
    if (mode === 'target' || mode === 'unload') {
      if (cur.x !== t.x || cur.y !== t.y) { sfx.no(); return; }
      if (e.pointerType === 'touch' && was !== cur.x + ',' + cur.y) return; // 触摸没有悬停：第一下选目标，第二下确认
    }
    if (mode === 'silo' && e.pointerType === 'touch' && was !== cur.x + ',' + cur.y) return;
    // 触摸没有悬停：选路时第一下点到打得到的敌人只挑站位、显示伤害预估，第二下（或提示条上的“攻击”）才走过去打
    if (mode === 'move' && e.pointerType === 'touch' && was !== cur.x + ',' + cur.y && aim && aim.t.x === t.x && aim.t.y === t.y) { sfx.tick(); return; }
    ok(true);
  }
  // 触屏：单指拖动 = 平移地图，双指捏合 = 缩放，轻点格子 = 光标 + 确定，长按格子 = 详情
  const tps = new Map(); let tch = null, pinch = null;
  const tdist = () => { const a = [...tps.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return press(e);
    audio(); tps.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (tch) clearTimeout(tch.lp);
    if (tps.size >= 2) { tch = null; pinch = { d: tdist() }; return; }
    const st = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, long: false, ev: { clientX: e.clientX, clientY: e.clientY, button: 0, pointerType: 'touch', pointerId: e.pointerId, preventDefault() { } } };
    st.lp = setTimeout(() => { if (tch !== st || st.moved || Nav.stack.length || !S) return; const t = tileAt(st.ev); if (!t) return; st.long = true; if (unitAtV(t.x, t.y) && peekStart(t)) { st.peek = true; return; }   // 长按单位：一直显示它的范围和视野，松手收起（详情用提示条上的“详情”）
      if (mode === 'idle' || mode === 'move') hover(t); else { cur = t; lastCurKey = t.x + ',' + t.y; } openDetail(); }, 520);
    tch = st;
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch' || !tps.has(e.pointerId)) return;
    const p = tps.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pinch && tps.size >= 2) { const d = tdist(), r = d / Math.max(1, pinch.d); if (S && !Nav.stack.length && (r >= 1.25 || r <= 0.8)) { const a = [...tps.values()]; zoomStep(r > 1 ? 1 : -1, (a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2); pinch.d = d; } return; }
    if (!tch || tch.id !== e.pointerId) return;
    if (!tch.moved && Math.hypot(e.clientX - tch.x, e.clientY - tch.y) > 10) { tch.moved = true; clearTimeout(tch.lp); }
    if (tch.moved && S && !Nav.stack.length) panBy(-dx, -dy);
  });
  const touchEnd = e => {
    if (e.pointerType !== 'touch') return;
    tps.delete(e.pointerId); if (tps.size < 2) pinch = null;
    if (tch && tch.id === e.pointerId) { const st = tch; tch = null; clearTimeout(st.lp); if (st.peek) peekEnd(); if (!st.moved && !st.long && e.type === 'pointerup') press(st.ev); }
  };
  cv.addEventListener('pointerup', touchEnd); cv.addEventListener('pointercancel', touchEnd);
  cv.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
  // 右键短按（松开时执行）：有菜单 / 页面开着 = 关掉；对局里走“取消”。pos 是按下时的位置
  function rightTap(pos) {
    if (Nav.stack.length) return Nav.cancel();
    if (!S) return;
    // 右键点在一个单位上：先把光标挪过去，再走“取消”——空闲时就是看这个单位的范围（常显，再按一次收起）
    if (mode === 'inspect') { const t = tileAt(pos), same = t && t.x === cur.x && t.y === cur.y; inspect = null; mode = 'idle'; if (same || !t || !unitAtV(t.x, t.y)) { sfx.back(); return; } hover(t); }   // 正在看范围：右键原处 / 空地 = 收起；右键另一个单位 = 换看它
    else if (mode === 'idle') { const t = tileAt(pos), q = t && unitAtV(t.x, t.y); if (q) { if (!TAP_STICKY && !(undoOf() && undoOf().unit === q)) return; hover(t); } }
    cancel();
  }
  // 以前右键的动作挂在 contextmenu 事件上，而 macOS 的浏览器在右键“按下”时就发这个事件，所以一按就生效。
  // 现在：按下只开始计时；按住超过 HOLD_MS 是查看（松开收起，不算取消）；短按在松开时才执行取消
  addEventListener('mousedown', e => { if (e.button !== 2) return; audio(); Kit.wake(); const pos = { clientX: e.clientX, clientY: e.clientY }; holdDown('mouse', S && !Nav.stack.length && !hudAt(e) ? tileAt(e) : null, pos); }, true);
  addEventListener('mouseup', e => { if (e.button !== 2) return; rLast = performance.now(); holdUp('mouse', h => rightTap(h.pos)); }, true);
  addEventListener('contextmenu', e => {
    e.preventDefault();
    // 鼠标右键已经由上面的按下 / 松开处理；触屏长按也会发这个事件，另有一套。剩下的（Ctrl + 点按、键盘的菜单键）照旧当一次短按
    if ((hold && hold.src === 'mouse') || performance.now() - rLast < 700 || e.pointerType === 'touch' || tps.size) return;
    audio(); rightTap(e);
  });

  // 手柄
  const pad = {};
  function pollPad(now) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const inp = {};
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed), ax = p.axes || [];
      if (b(12) || ax[1] < -0.55) inp.up = 1; if (b(13) || ax[1] > 0.55) inp.down = 1;
      if (b(14) || ax[0] < -0.55) inp.left = 1; if (b(15) || ax[0] > 0.55) inp.right = 1;
      if (b(0)) inp.ok = 1; if (b(1)) inp.cancel = 1; if (b(2)) inp.x = 1; if (b(3)) inp.y = 1; if (b(4)) inp.lb = 1; if (b(5)) inp.rb = 1; if (b(9)) inp.start = 1; if (b(8)) inp.mini = 1; if (b(10)) inp.sound = 1;   // 声音开关：左摇杆按下（Select 已经是小地图）
      if (Nav.stack.length) { if (Math.abs(ax[3] || 0) > 0.3) { Kit.setDev('pad'); Kit.scrollPanel(0, ax[3] * 22); } }   // 面板开着：右摇杆上下滚详情
      else { if (b(7) || ax[3] < -0.6) inp.zoomIn = 1; if (b(6) || ax[3] > 0.6) inp.zoomOut = 1; }   // 缩放：RT / 右摇杆上 放大，LT / 右摇杆下 缩小
    }
    for (const k of ['up', 'down', 'left', 'right', 'ok', 'cancel', 'x', 'y', 'lb', 'rb', 'start', 'mini', 'zoomIn', 'zoomOut', 'sound']) {
      const st = pad[k] || (pad[k] = { down: false, next: 0 });
      if (k === 'cancel') {   // B：对局里按住 = 查看光标下的单位，短按 = 取消（松开时执行）；有菜单开着时按下就响应
        if (inp.cancel) { if (!st.down) { st.down = true; if (canHold()) { ptrKind = 'key'; Kit.setDev('pad'); Kit.wake(); holdDown('pad', { x: cur.x, y: cur.y }); } else act('cancel', 'pad'); } }
        else if (st.down) { st.down = false; holdUp('pad', () => act('cancel', 'pad')); }
        continue;
      }
      if (inp[k]) {
        if (!st.down) { st.down = true; st.next = now + 280; act(k, 'pad'); }
        else if (DIR[k] && now >= st.next) { st.next = now + 95; act(k, 'pad'); }
      } else st.down = false;
    }
  }

  let lastT = 0, held = false; // held：测试截图用，画面停在当前这一帧（逻辑照常走）
  // 空闲降耗：没有输入、没有动画和特效时每秒只画 12 帧（待机呼吸、光标闪动本来就是低帧率的）；有输入或有动画立即恢复全速；页面不可见时不画
  let lastDraw = 0, drawN = 0, viewSig = '';
  function busyNow(now) {
    if (!Kit.idle(now) || DEMO) return true;
    if (!S) return false;                       // 标题画面：只有背景插画的缓慢推移
    return !!peek || fx.length > 0 || plays.size > 0 || !!anim || !!shakeFx || ghosts.length > 0 || !!camAnim || mode === 'anim' || mode === 'ai' || curtain || loadingOn || !!bnOn || now <= toastUntil || mapDirty || warming;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { lastT = now; return; }
    try {
      if ((window.devicePixelRatio || 1) !== dpr) resize(); /* 窗口拖到另一块屏幕上：像素比变了但不一定有 resize 事件 */ pollPad(now); edgeScroll(Math.min(0.05, (now - lastT) / 1000));
      const sig = ox + ',' + oy + ',' + ts + ',' + cur.x + ',' + cur.y + ',' + mode + ',' + cv.width + ',' + cv.height; if (sig !== viewSig) { viewSig = sig; Kit.wake(); }   // 镜头、光标、缩放、状态变了：按有输入算
      if (!held && (busyNow(now) || now - lastDraw >= Kit.IDLE_MS)) { draw(now); lastDraw = now; drawN++; }
    } catch (e) { console.error(e); }
    lastT = now;
  }

  // ───────── 把对局这边的数据和函数交给界面模块 ─────────
  const G = {
    D, C, Art, Kit, Skin, sfx, audio, DEMO, pal, pname, artCode, codeOf, seatMark, pcs: p => { const P = pal(p); return `--pc:${P.m};--pcd:${P.d};--pcl:${P.h}`; }, lsGet, lsSet, esc, act,
    get S() { return S; }, get mode() { return mode; }, set mode(v) { mode = v; }, get cur() { return cur; }, get human() { return human; }, get ts() { return ts; },
    fac, facOpen, isFac, facSwap, defaultFunds, startCampaign, get gid() { return gid; }, over, centerOn(x, y) { cur = { x, y }; lastCurKey = x + ',' + y; centerOn(x, y); }, clearSave,
    opt, cfg, RULES, flashHints(ms) { hintUntil = performance.now() + (ms || 3000); }, AILV, RDEF, INC, myRules, MAP_GROUPS, ZOOMS,
    selectMap, mapOk, mapDims, mapN, mapGroup, thumb, mapRec, mapRecText, setRule, saveRules, resetRec() { recFor = -1; selectMap(opt.map); },
    startGame, resumeGame, loadSave, showTitle, autosave, showHelp,
    coFactions, cosOf, coOrder, firstCo, loreCo, loreFac, quoteOf, coLabel, LORE,
    get soundOn() { return soundOn; }, setSound, applyVol, get zoomPref() { return zoomPref; }, setZoomPref(v) { zoomPref = v; lsSet('steel-tide.zoom', String(v)); if (S) setZoom(v); },
    fogOn, darkOn, plist, NP, teamTag, hasTeams, isAlive, isEnemy, teamOf, powersOn, coOf, costOf, unitBuff, unitTags, unitSeen, unitAtV, capPow, winnersOf, quit, get gaveUp() { return gaveUp; },
    auraText, cargoOf, refreshVis, openCodex, hudMode: () => cfg.hud, setHudMode(v) { cfg.hud = v === 'full' ? 'full' : 'slim'; lsSet('steel-tide.hud', cfg.hud); }, openDetail, openSettings, presentTypes, tileCss, viewW, viewH, canAgain, openMapMenu, updateHud, switchLang,
  };
  Front = window.AWFront(G); BT = window.AWBattle(G); HUD = BT.hud;
  G.front = Front; if (window.AWCodex) window.AWCodex.G = G;
  Camp = window.AWCampaignUI ? window.AWCampaignUI(G) : null; G.camp = Camp;
  Kit.onAct = a => act(a);
  // 底部按键提示条、右上角的喇叭图标：每个画面都在同一个位置
  (() => {
    const bar = document.createElement('div'); bar.id = 'hints'; document.body.appendChild(bar);
    bar.addEventListener('click', e => { const h = e.target.closest('[data-a]'); if (h) { e.stopPropagation(); const d = Kit.dev; act(h.dataset.a); ptrKind = d; } });
    const b = document.createElement('button'); b.id = 'snd'; document.body.appendChild(b);
    b.onclick = e => { e.stopPropagation(); setSound(!soundOn); if (soundOn) sfx.ok(); };
    const A = AU(); if (A) { try { if (A.muted !== !soundOn) A.setMuted(!soundOn); } catch (e) { } }   // 音频模块自己也记了一份静音状态：以界面这份为准
  })();
  try { document.title = tt('潮汐战线'); } catch (e) { }
  resize(); showTitle(); refreshMute(); requestAnimationFrame(frame);
  // 测试入口。sync：测试脚本直接改了 S 之后刷新画面；view：格子到屏幕坐标的换算
  const cssRect = r => r ? { l: r.x * u, t: r.y * u, r: (r.x + r.w) * u, b: (r.y + r.h) * u, w: r.w * u, h: r.h * u } : null;
  window.__game = {
    hitInfo() { return hitSet ? [...hitSet] : []; },
    aimInfo() { return aim ? { t: [aim.t.x, aim.t.y], stand: aim.stand, moves: !!aim.moves, fcast: fcast ? fcast.text : null } : null; },
    reachInfo() { if (!reachMask) return null; let stop = 0, pass = 0; for (const v of reachMask) { if (v === 1) stop++; else if (v === 2) pass++; } return { stop, pass }; },
    get S() { return S; }, get mode() { return mode; }, get cur() { return cur; }, act,
    get sound() { return soundOn; }, setSound,
    get human() { return human; }, get fast() { return cfg.fast; }, get demo() { return DEMO; }, opt, Nav, cfg,
    get fontReady() { return true; }, get fontOk() { return Skin.fontOk; }, get ui() { return { u, U, dpr }; },
    get view() { return { zoom: zoomPref, zooms: ZOOMS.slice(), auto: S ? autoZoom() : 0, cols: viewW() / ts, rows: viewH() / ts, grid: cfg.grid, ts, ox, oy, top: TOP, scrollX, scrollY, tp, sc, dpr, vis: S ? visRange() : null, frames: mapCvs.filter(Boolean).length, pixel: !!Art.renderMap, mini: !!S && !!miniOpen(), miniK, stat: Object.assign({}, stat), fx: fx.length, apron: !!(apron && S && apron.map === S.map), apronFrames: apron ? apron.wins[0].cv.filter(Boolean).length : 0 }; },
    // 常驻界面这一帧的状态：位置换成屏幕像素（rect），内容是画出来的文字 / 数值
    get hud() {
      const m = hudM || {}, f = m.fc;
      return {
        status: S && m.status ? Object.assign({ side: m.left ? 'left' : 'right', rect: HUD.rect('status') }, m.status) : null,
        info: S && m.info ? Object.assign({ side: m.right ? 'right' : 'left', rect: HUD.rect('info') }, m.info) : null,
        forecast: S && f ? { text: f.text, first: f.first, range: f.range, dmg: f.dmg, edge: f.edge, rect: HUD.rect('fc') } : null,
        banner: { text: bnText, show: !!bnOn, co: bnOn && bnOn.co && bnOn.power ? bnOn.co.id : null, quote: bnOn && bnOn.co ? bnOn.co.quote || '' : '', sub: bnOn ? bnOn.sub || '' : '' }, toast: { text: toastText, show: performance.now() <= toastUntil },
        mini: { open: !!S && !!miniOpen(), rect: cssRect(hud.mini), btn: null, panel: cssRect(hud.miniPanel), canvas: miniCv },
        loading: loadingOn, curtain, ambush: lastAmbush, hints: battleHints(),
      };
    },
    get fog() { return { on: fogOn(), viewer: visP, mask: visMask, see: seeMask, quiet, ramp: FOG_RAMP, levels: FOG_LV, rgb: FOG_RGB.slice(), alpha: FOG_A }; },
    fogTile: key => fogTile(key),
    // 标题页背景：art = 插画已画上（x、y、k 是插画左上角的屏幕坐标和缩放），否则是地图背景
    get titleBg() { return { art: !S && !!artAt, at: artAt ? Object.assign({}, artAt) : null, dim: bgDim, map: !!(bg && bg.cvs.length) }; },
    unitSeen: q => unitSeen(q), infoModel: () => S ? infoModel() : null, veilOf: q => veilOf(q), freeWin,
    // 最近几次出手的演出方式、特效队列里现在有哪些、最近一块弹牌（遇伏 / 再移动）、是不是在“再移动”那一段
    get atkLog() { return atkLog.slice(); }, get fxTypes() { return fx.map(f => f.type); }, get fxText() { return fx.filter(f => f.type === 'num').map(f => f.text); }, get fxList() { return fx.map(f => ({ type: f.type, x: f.x, y: f.y, text: f.text, t0: f.t0 })); }, get pop() { return lastPop; }, get again() { return canAgain(sel); }, canAgain: q => canAgain(q), get sel() { return sel; },
    get draws() { return drawN; },   // 对局画布一共重画了多少次（空闲降耗的断言用）
    get peek() { return peek ? { id: peek.u.id, sr: peek.sr, sight: peek.sight } : null; }, get inspect() { return inspect ? { id: inspect.u.id, sr: inspect.sr } : null; }, threat: q => threat(q),
    get undo() { const i = undoOf(); return i ? { kind: i.kind, id: i.unit.id } : null; }, get last() { return { unlock: lastUnlock, built: Object.assign({}, lastBuilt), undo: lastUndo, ore: lastOre, rp: lastRp, capShow: lastCapShow, cap: lastCap, gain: lastGain, shot: lastShot, sell: lastSell, burn: lastBurn }; }, get ghost() { const g = ghosts[0]; return g ? { type: g.type, owner: g.owner, x: g.x, y: g.y } : null; }, get staged() { return !!(sel && orig && !committed && (sel.x !== orig.x || sel.y !== orig.y)); },
    unitTags, unitBuff: q => { const b = unitBuff(q); return Object.assign({}, b); }, runAI,
    sync() { checkMap(); miniDirty = true; updateHud(); },
    // 实际帧率：数 ms 毫秒内浏览器真正刷了多少帧
    fps(ms) { return new Promise(res => { let n = 0; const t0 = performance.now(); const tick = t => { n++; if (t - t0 >= ms) res(n * 1000 / (t - t0)); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }); },
    // 选图页的选项：{ map: 下标或地图名, mode: 'ai' | '2p', co1, co2, rules: {…} }
    setup(o) {
      if (o.map != null) { const i = typeof o.map === 'number' ? o.map : D.MAPS.findIndex(m => m.name === o.map); if (i < 0) throw new Error('没有这张地图：' + o.map); selectMap(i); }
      if (o.mode) for (let p = 2; p <= 4; p++) opt.ctl[p] = o.mode === '2p' ? 'human' : 'ai';
      if (o.co1) opt.cos[1] = o.co1; if (o.co2) opt.cos[2] = o.co2; if (o.cos) for (let p = 1; p <= 4; p++) if (o.cos[p]) opt.cos[p] = o.cos[p];
      if (o.rules) Object.assign(opt.rules, o.rules);
    },
    openMapSel: () => Front.wizard(), startGame, get front() { return Front; }, get battle() { return BT; }, G, openDetail, openCodex,
    // 直接换上一份对局状态（测试大地图、多阵营用）
    async setState(s, h) {
      S = s; human = h || [false, true].concat(new Array(Math.max(0, (s.players || 2) - 1)).fill(false));
      enterGame(); await warm(); mode = human[S.turn] ? 'idle' : 'anim'; updateHud(); miniLayout();
    },
    bannerTurn, toast, checkDefeats, over, centerOn, endTurn, handoff, refreshVis,
    // 单位素材：是否就绪、各状态画了多少次（n）和画过哪几帧（frames）、最近的状态切换（ev）、某个单位上一帧画成什么样（of(id)）；
    // play / face 让测试直接摆一个状态；setZoom / zoomStep 换缩放档位；surrender 认输
    get hold() { return held; }, set hold(v) { held = !!v; },
    get spr() { return { on: sprOn(), n: Object.assign({}, sprLog.n), frames: { idle: [...sprLog.frames.idle], move: [...sprLog.frames.move], attack: [...sprLog.frames.attack], hit: [...sprLog.frames.hit] }, flip: sprLog.flip, dim: sprLog.dim, legacy: sprLog.legacy, ev: sprLog.ev.slice(), plays: plays.size, ghosts: ghosts.length, step: STEP, iv: { idle: IV('idle'), move: IV('move'), attack: IV('attack'), hit: IV('hit') } }; },
    sprOf: id => { const e = sprLog.last.get(id); return e ? Object.assign({}, e) : null; }, sprReset() { for (const k in sprLog.n) { sprLog.n[k] = 0; sprLog.frames[k].clear(); } sprLog.flip = sprLog.dim = sprLog.legacy = 0; sprLog.ev.length = 0; },
    playOf: id => { for (const [q, p] of plays) if (q.id === id) return { state: p.state, t0: p.t0, per: p.per, n: p.seq.length }; return null; },
    get anim() { return anim ? { id: anim.u.id, owner: anim.u.owner, per: anim.per, dur: anim.dur, step: anim.dur / Math.max(1, anim.path.length - 1), dirs: anim.dirs.slice() } : null; },
    pal: p => Object.assign({}, pal(p)), artCode, codeOf, pname,
    play: (q, st, o) => play(q, st, o), facing: q => facing(q), faceTo, setZoom, zoomStep, surrender, mapOk, mapGroup, get quit() { return [...quit]; },
    // 测试用：让电脑替玩家打（战役里验证真实的胜负路径）。on = 开 / 关；turbo = 动画等待归零
    auto(on, turbo) { TURBO = !!turbo; if (!S) return; const seat = S.camp ? S.camp.seat : 1; human[seat] = !on; if (on && mode === 'idle' && S.turn === seat && !S.winner) runAI(); },
    get turbo() { return TURBO; }, get hintsOff() { const h = document.getElementById('hints'); return !h || h.classList.contains('off'); },
    mapCanvas: f => mapCvs[f] || null,
    // 连画 n 帧，返回平均每帧毫秒数
    perf(n) { n = n || 200; const t0 = performance.now(); for (let i = 0; i < n; i++) draw(t0 + i * 16.7); return (performance.now() - t0) / n; },
    switchLang,
  };
  afterLang().catch(e => console.error(e));   // 换语言重载之后：回到原来的画面（没有标记时什么都不做）
})();
