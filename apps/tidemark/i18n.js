// 潮汐战线：多语言底层（全局 AWI18n）。说明见 tools/I18N.md。
// 原则：源码里的简体中文原文就是词典的键。t('结束回合') 在 zh-CN 下原样返回，其他语言查 i18n/<lang>.js 里的词典，查不到回退到原文并记进 missing()。
// 加载顺序：data.js、lore.js 之后，界面脚本之前；i18n/<lang>.js 紧跟在 i18n.js 后面。不依赖 fetch、不用 ES module，file:// 下可用。
(function (root) {
  const I = {};
  const SRC = 'zh-CN';          // 源语言：词典的键
  const FALLBACK = 'en';        // 浏览器语言一个都对不上时用它
  const LS_KEY = 'steel-tide.lang';
  const CTX = '||';             // 同一句原文在不同位置要译成不同的词时，键写成 '原文||场合'，见 t()

  // 语言清单。name 用各自语言书写（设置页直接显示）；html 写进 <html lang>；font 是字体回退栈（排在游戏自带字体后面）。
  // wide：译文大约比中文长多少倍（按显示宽度估），界面按它决定要不要缩字、换行，见 tools/I18N.md “排版”。
  const LANGS = [
    { id: 'zh-CN', name: '简体中文', html: 'zh-Hans', wide: 1, cjk: true, font: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Noto Sans SC",sans-serif' },
    { id: 'zh-TW', name: '繁體中文', html: 'zh-Hant', wide: 1, cjk: true, font: '"PingFang TC","Hiragino Sans CNS","Microsoft JhengHei","Noto Sans CJK TC","Noto Sans TC",sans-serif' },
    { id: 'en', name: 'English', html: 'en', wide: 1.8, font: '"Avenir Next","Segoe UI","Helvetica Neue",Roboto,"Noto Sans",Arial,sans-serif' },
    { id: 'ja', name: '日本語', html: 'ja', wide: 1.3, cjk: true, font: '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Yu Gothic",Meiryo,"Noto Sans CJK JP","Noto Sans JP",sans-serif' },
    { id: 'ko', name: '한국어', html: 'ko', wide: 1.2, cjk: true, font: '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans CJK KR","Noto Sans KR",sans-serif' },
    { id: 'es', name: 'Español', html: 'es', wide: 2.2, font: '"Avenir Next","Segoe UI","Helvetica Neue",Roboto,"Noto Sans",Arial,sans-serif' },
    { id: 'fr', name: 'Français', html: 'fr', wide: 2.3, font: '"Avenir Next","Segoe UI","Helvetica Neue",Roboto,"Noto Sans",Arial,sans-serif' },
    { id: 'de', name: 'Deutsch', html: 'de', wide: 2.3, font: '"Avenir Next","Segoe UI","Helvetica Neue",Roboto,"Noto Sans",Arial,sans-serif' },
    { id: 'pt-BR', name: 'Português', html: 'pt-BR', wide: 2.2, font: '"Avenir Next","Segoe UI","Helvetica Neue",Roboto,"Noto Sans",Arial,sans-serif' },
    { id: 'ru', name: 'Русский', html: 'ru', wide: 2.3, font: '"Segoe UI","Helvetica Neue",Roboto,"Noto Sans","PT Sans",Arial,sans-serif' },
  ];
  // 扩展加的语言（mods/README.md）：排在自带的语言后面，同名的不收
  try { if (root.AWMods && root.AWMods.langs) root.AWMods.langs().forEach(l => { if (!LANGS.some(x => x.id === l.id)) LANGS.push(l); }); } catch (e) { /* 忽略 */ }
  const BY_ID = {}; LANGS.forEach(l => { BY_ID[l.id] = l; });

  const dict = {};      // { lang: { 原文或 '原文||场合': 译文（字符串，或 (vars) => 字符串） } }
  const miss = {};      // { lang: { 原文: 次数 } }
  const listeners = [];

  // ---------- 选语言 ----------
  // 把一个浏览器语言码（BCP 47，如 zh-Hant-HK、pt-PT、en-GB）对到语言清单里；对不上返回 null。
  function match(tag) {
    if (!tag) return null;
    const s = String(tag).toLowerCase().replace(/_/g, '-');
    const parts = s.split('-'), main = parts[0];
    if (main === 'zh') {
      if (parts.includes('hant') || parts.includes('tw') || parts.includes('hk') || parts.includes('mo')) return 'zh-TW';
      return 'zh-CN'; // zh、zh-CN、zh-SG、zh-Hans…
    }
    if (main === 'pt') return 'pt-BR';
    for (const l of LANGS) if (l.id.toLowerCase() === s) return l.id;
    for (const l of LANGS) if (l.id.toLowerCase().split('-')[0] === main) return l.id;
    return null;
  }
  // 浏览器语言：navigator.languages 逐个试，第一个对得上的算数；都对不上用英语。
  function detect(list) {
    let tags = list;
    if (!tags) {
      const nav = root.navigator || {};
      tags = (nav.languages && nav.languages.length ? Array.from(nav.languages) : []).concat(nav.language || [], nav.userLanguage || []);
    }
    for (const tag of tags) { const id = match(tag); if (id) return id; }
    return FALLBACK;
  }
  function saved() { try { const v = root.localStorage && root.localStorage.getItem(LS_KEY); return v && BY_ID[v] ? v : null; } catch (e) { return null; } }
  function save(v) { try { if (root.localStorage) { if (v) root.localStorage.setItem(LS_KEY, v); else root.localStorage.removeItem(LS_KEY); } } catch (e) { } }

  I.SOURCE = SRC;
  I.match = match;
  I.detect = detect;
  // 地址栏 ?lang=ja：只在这次打开里用这种语言，不写 localStorage（测试、截图用）
  function fromUrl() { try { const m = /[?&]lang=([\w-]+)/.exec((root.location && root.location.search) || ''); const id = m && (BY_ID[m[1]] ? m[1] : match(m[1])); return id || null; } catch (e) { return null; } }
  I.auto = !saved();               // true：跟着浏览器语言；false：玩家自己选过
  I.lang = fromUrl() || saved() || detect();

  // 设置页用：[{ id, name, current }]，name 是各自语言写的语言名。
  I.list = () => LANGS.map(l => ({ id: l.id, name: l.name, current: l.id === I.lang }));
  I.info = lang => BY_ID[lang || I.lang] || BY_ID[SRC];
  // 当前语言的字体回退栈；first 是游戏自带字体名（如 '"SteelTideBold"'），排在最前。
  I.fontStack = (first, lang) => (first ? first + ',' : '') + I.info(lang).font;

  // 换语言。lang 传 null / 'auto' = 回到“跟随浏览器”。会重新 localize 已登记的数据表，再逐个调 onChange 回调（界面在回调里整体重画）。
  I.set = function (lang, opt) {
    const isAuto = lang == null || lang === 'auto';
    const next = isAuto ? detect() : (BY_ID[lang] ? lang : match(lang));
    if (!next) return false;
    const prev = I.lang;
    I.lang = next; I.auto = isAuto;
    if (!(opt && opt.temp)) save(isAuto ? null : next); // temp：只在这次运行里换（测试、截图用），不写 localStorage
    relocalize();
    applyDoc();
    if (prev !== next || (opt && opt.force)) listeners.slice().forEach(fn => { try { fn(next, prev); } catch (e) { if (root.console) root.console.error(e); } });
    return true;
  };
  // 登记“语言变了”的回调；返回一个取消登记的函数。
  I.onChange = function (fn) { listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; };

  // <html lang>、文档标题、CSS 变量 --font-i18n（界面的 font-family 把它接在自带字体后面）
  function applyDoc() {
    const doc = root.document; if (!doc || !doc.documentElement) return;
    const el = doc.documentElement, info = I.info();
    el.setAttribute('lang', info.html);
    el.setAttribute('data-lang', I.lang);
    if (el.style && el.style.setProperty) el.style.setProperty('--font-i18n', info.font);
  }
  I.applyDoc = applyDoc;

  // ---------- 词典 ----------
  // i18n/<lang>.js 里调用：AWI18n.add('en', { '原文': 'translation', '中||funds': 'Medium', … })。可以分多次 add，后加的覆盖先加的。
  I.add = function (lang, table) {
    const d = dict[lang] || (dict[lang] = {});
    for (const k in table) if (Object.prototype.hasOwnProperty.call(table, k)) d[k] = table[k];
    Object.defineProperty(d, '__n', { value: (d.__n || 0) + 1, enumerable: false, writable: true, configurable: true }); // 词典版本号，isValue 的缓存靠它失效
    if (lang === I.lang && tracked.length) relocalize();
    return I;
  };
  I.dict = lang => dict[lang || I.lang] || {};
  I.has = (src, ctx, lang) => { const d = dict[lang || I.lang]; return !!d && ((ctx != null && d[src + CTX + ctx] != null) || d[src] != null); };

  // {name} 占位符。vars 里没有的名字原样留着，方便一眼看出漏传。
  function fill(str, vars) {
    if (!vars || str.indexOf('{') < 0) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
  }
  I.format = fill;

  // 翻译。src：简体中文原文（带 {name} 占位符的整句）；vars：占位符的值；ctx：场合（可省）。
  //   t('结束回合')                              → 'End Turn'
  //   t('射程 {a}–{b}', { a: 2, b: 4 })           → 'Range 2–4'      数字和固定词拼的串：整句进词典，数字走占位符，别拆开拼
  //   t('中', null, 'funds')                     → 先查 '中||funds'，没有再查 '中'
  // 查不到：返回原文（占位符照填），并记进 missing()。zh-CN 不查词典。
  function t(src, vars, ctx) {
    if (src == null) return '';
    if (typeof src !== 'string') src = String(src);
    if (I.lang === SRC || src === '') return fill(src, vars);
    const d = dict[I.lang];
    let tr = d ? (ctx != null && d[src + CTX + ctx] != null ? d[src + CTX + ctx] : d[src]) : null;
    if (tr == null) {
      if (/[㐀-鿿]/.test(src) && !isValue(src)) { const m = miss[I.lang] || (miss[I.lang] = {}); if (!m[src]) logMiss(src); m[src] = (m[src] || 0) + 1; } // 纯数字、符号不算缺
      return fill(src, vars);
    }
    if (typeof tr === 'function') { try { return String(tr(vars || {}, I)); } catch (e) { return fill(src, vars); } }
    return fill(tr, vars);
  }
  // 已经是当前语言译文的字符串（日文、繁体的译文里也有汉字）又被拿来 t() 一次：原样返回，不算缺词
  const valueSets = {};
  function isValue(s) {
    const d = dict[I.lang]; if (!d) return false;
    let vs = valueSets[I.lang];
    if (!vs || vs.n !== d.__n) { vs = valueSets[I.lang] = { n: d.__n, set: new Set() }; for (const k in d) if (typeof d[k] === 'string') vs.set.add(d[k]); }
    return vs.set.has(s);
  }
  // 调试：localStorage['steel-tide.i18nDebug'] = '1' 时，把查不到的原文累计存进 localStorage['steel-tide.i18nMissing']（跨页面重载保留），
  // 冒烟脚本跑完一遍后读它（环境变量 UILANG，见 tools/cdp.js）。平时不开，不写任何东西。
  let dbg = null;
  function logMiss(src) {
    try {
      const ls = root.localStorage; if (!ls) return;
      if (dbg == null) dbg = ls.getItem('steel-tide.i18nDebug') === '1';
      if (!dbg) return;
      const all = JSON.parse(ls.getItem('steel-tide.i18nMissing') || '{}'); (all[I.lang] || (all[I.lang] = {}))[src] = 1; ls.setItem('steel-tide.i18nMissing', JSON.stringify(all));
    } catch (e) { }
  }
  I.t = t;
  // 带场合的简写：I.tc('funds', '中')
  I.tc = (ctx, src, vars) => t(src, vars, ctx);

  // 运行时查不到的原文：[{ src, n }]，次数多的在前。控制台里 copy(JSON.stringify(AWI18n.missing())) 拿去补词。
  I.missing = function (lang) {
    const m = miss[lang || I.lang] || {};
    return Object.keys(m).map(src => ({ src, n: m[src] })).sort((a, b) => b.n - a.n);
  };
  I.clearMissing = () => { for (const k in miss) delete miss[k]; };

  // ---------- 语言相关的小工具 ----------
  // 复数：plural(n, { one: '{n} unit', other: '{n} units' })（俄语有 few / many）。词典里的函数值会用到它。
  const PR = {};
  I.plural = function (n, forms, lang) {
    lang = lang || I.lang;
    let cat = 'other';
    try { if (typeof Intl !== 'undefined' && Intl.PluralRules) cat = (PR[lang] || (PR[lang] = new Intl.PluralRules(lang))).select(Number(n)); } catch (e) { }
    const s = forms[cat] != null ? forms[cat] : forms.other != null ? forms.other : '';
    return fill(s, { n });
  };
  // 并列：中文日文用顿号，其他语言用逗号。joinList(['步兵', '破甲兵']) → 'Infantry, Bazooka Trooper'（元素要先自己 t() 过）
  I.joinList = function (items, lang) {
    lang = lang || I.lang;
    const sep = lang === 'zh-CN' || lang === 'zh-TW' || lang === 'ja' ? '、' : ', ';
    return items.join(sep);
  };
  // 千分位等数字格式先不动：游戏里的资金都是 100–99990 的整数，全语言统一写成不带分隔符的阿拉伯数字。

  // ---------- 数据层 ----------
  // 把一个对象的若干显示字段换成当前语言。原文留在不可枚举的 _zh 里（for…in、Object.keys、JSON.stringify 都看不到它），可以来回切。
  // 数据在 localize 之后被别的代码改写过（当前值既不是上次的译文也不是原文）时，以新值为新的原文。
  const tracked = [];   // 登记过的 localize 任务，换语言时重跑
  function swap(o, field, ctx) {
    if (!o || typeof o !== 'object') return;
    if (!Object.prototype.hasOwnProperty.call(o, '_zh')) Object.defineProperty(o, '_zh', { value: {}, enumerable: false, writable: true, configurable: true });
    const z = o._zh, cur = o[field];
    if (typeof cur !== 'string' && !(field in z)) return;
    if (!(field in z)) z[field] = cur;
    else if (typeof cur === 'string' && cur !== z[field] && cur !== z['~' + field]) z[field] = cur; // 被外面改过
    const out = t(z[field], null, ctx);
    o[field] = out; z['~' + field] = out;
  }
  function each(coll, fn) {
    if (!coll) return;
    if (Array.isArray(coll)) coll.forEach((o, i) => { if (o) fn(o, i); });
    else Object.keys(coll).forEach(k => { if (coll[k]) fn(coll[k], k); });
  }
  // 字符串数组（D.PLAYERS、lore 的 story 段落）：原文整份存在宿主对象的 _zh[key] 里
  function swapList(host, key, ctx) {
    if (!host || !Array.isArray(host[key])) return;
    if (!Object.prototype.hasOwnProperty.call(host, '_zh')) Object.defineProperty(host, '_zh', { value: {}, enumerable: false, writable: true, configurable: true });
    const z = host._zh, arr = host[key];
    if (!z[key] || z[key].length !== arr.length) z[key] = arr.slice();
    else arr.forEach((v, i) => { if (typeof v === 'string' && v !== z[key][i] && v !== (z['~' + key] || [])[i]) z[key][i] = v; });
    const out = z[key].map(v => (typeof v === 'string' ? t(v, null, ctx) : v));
    out.forEach((v, i) => { arr[i] = v; }); // 原地改：别处拿着这个数组的引用也跟着变
    z['~' + key] = out;
  }

  // 字段表：哪张表的哪些字段是给玩家看的，场合名是什么。check-i18n.js、extract-strings.js 读同一张表（I.FIELDS）。
  // 第三项 'lazy'：这个字段被规则代码拿来做判断（core.js 里 myCo.group === '专精'），不原地替换，显示时 t(c.group, null, 'group')。
  // 没有列进来的字段（id、mods、rules、数值）一律不碰。地图名（D.MAPS[i].name）被 D.TECH_K、存档、战役的 unlock.maps、测试当键用，同样标 'lazy'，显示时 t(m.name, null, 'map')。
  I.FIELDS = {
    data: [
      { table: 'PLAYERS', list: true, ctx: 'faction', cat: '阵营名' },
      { table: 'RES', self: true, fields: { name: ['res', '资源名'], short: ['res', '资源名'], mine: ['res', '资源名'], shard: ['res', '资源名'], pit: ['res', '资源名'], mineText: [null, '资源说明'] } },
      { table: 'TERRAIN', fields: { name: ['terrain', '地形名'], note: [null, '地形说明'] } },
      { table: 'UNITS', fields: { name: ['unit', '兵种名'], desc: [null, '兵种说明'] } },
      { table: 'FACTIONS', fields: { name: ['faction', '阵营名'], culture: [null, '阵营说明'], trait: [null, '阵营说明'] }, sub: { research: { name: ['research', '阵营研究'], desc: [null, '阵营研究'] } } },
      { table: 'COS', fields: { name: ['co', '指挥官名'], title: ['title', '指挥官称号'], group: ['group', '指挥官分组', 'lazy'], power: ['power', '技能名'], desc: [null, '技能说明'], passive: [null, '特长说明'] } },
      { table: 'FUNDS', fields: { name: ['funds', '研究经费档'] } },
      { table: 'TECH_LINES', fields: { name: ['line', '科技线名'] } },
      { table: 'MAPS', fields: { name: ['map', '地图名', 'lazy'], size: [null, '地图简介'], blurb: [null, '地图简介'] } },
      { table: 'TECH', fields: { name: ['tech', '科技名'], desc: [null, '科技说明'], flavor: [null, '科技风味'] }, map: { moot: [null, '科技说明'] } },
    ],
  };
  function runSpec(D, spec) {
    for (const s of spec) {
      if (s.list) { swapList(D, s.table, s.ctx); continue; }
      if (s.self) { if (D[s.table]) for (const f in s.fields) swap(D[s.table], f, s.fields[f][0]); continue; } // 单个对象（D.RES）
      each(D[s.table], o => {
        for (const f in s.fields || {}) if (s.fields[f][2] !== 'lazy') swap(o, f, s.fields[f][0]);
        for (const sk in s.sub || {}) if (o[sk]) for (const f in s.sub[sk]) swap(o[sk], f, s.sub[sk][f][0]);
        for (const mk in s.map || {}) if (o[mk]) for (const k of Object.keys(o[mk])) swap(o[mk], k, s.map[mk][0]); // 键不固定的小表（moot）：每个值都换
      });
    }
  }

  // 把 AWData 的显示字段换成当前语言。调一次就登记在案，以后 AWI18n.set() 会自动重跑。
  I.localize = function (D) {
    D = D || root.AWData; if (!D) return null;
    runSpec(D, I.FIELDS.data);
    if (!tracked.some(x => x.obj === D)) tracked.push({ obj: D, run: () => runSpec(D, I.FIELDS.data) });
    return D;
  };

  // lore.js（AWLore）和 campaign.js（AWCampaign）结构还在变，这里按“形状”走：递归整棵树，凡是字符串、字符串数组，
  // 且键名不在 skip 里的都换。opt.skip：不该翻的键（id、图片名、指挥官 id 列表…）；opt.ctx：{ 键名: 场合 }。
  const LORE_SKIP = { id: 1, co: 1, map: 1, maps: 1, unlock: 1, who: 1, mood: 1, look: 1, reveal: 1, file: 1, sides: 1, rules: 1, win: 1, lose: 1, startCos: 1, region: 1, from: 1, to: 1, after: 1, by: 1, tag: 1, seat: 0, place: 1, act: 1, key: 1, img: 1, art: 1, portrait: 1, bgm: 1, sfx: 1, type: 1, kind: 1, next: 1, prev: 1, faction: 1, unit: 1, units: 1, terrain: 1, script: 1, cond: 1, on: 1, at: 1 };
  // 故事字段的场合：短词容易和界面词撞（燕烽讨厌的“等”和列举收尾的“等”），按字段给场合，词典里写 '等||lore.hate'
  const LORE_CTX = { name: 'lore.name', like: 'lore.like', hate: 'lore.hate', quote: 'lore.quote', motto: 'lore.quote' };
  function walkLore(o, opt, depth, seen) {
    if (!o || typeof o !== 'object' || depth > 12 || seen.indexOf(o) >= 0) return;
    seen.push(o);
    const keys = Array.isArray(o) ? o.map((_, i) => i) : Object.keys(o);
    for (const k of keys) {
      if (!Array.isArray(o) && (opt.skip[k] || String(k).charAt(0) === '_')) continue;
      const v = o[k];
      if (typeof v === 'string') { if (!Array.isArray(o) && /[㐀-鿿]/.test((o._zh && o._zh[k]) || v)) swap(o, k, opt.ctx[k] || null); }
      else if (Array.isArray(v) && v.length && v.every(x => typeof x === 'string')) { if (v.some(x => /[\u3400-\u9fff]/.test(x)) || (o._zh && o._zh[k])) swapList(o, k, opt.ctx[k] || null); }
      else if (v && typeof v === 'object') walkLore(v, opt, depth + 1, seen);
    }
  }
  I.localizeLore = function (L, opt) {
    L = L || root.AWLore; if (!L) return null;
    const o = { skip: Object.assign({}, LORE_SKIP, (opt && opt.skip) || {}), ctx: (opt && opt.ctx) || LORE_CTX };
    const run = () => walkLore(L, o, 0, []);
    run();
    if (!tracked.some(x => x.obj === L)) tracked.push({ obj: L, run });
    return L;
  };
  // 战役（campaign.js 的 AWCampaign）：和 localizeLore 同一套走法，另外不碰关卡的机器字段。
  // 跳过：unlock（里面的 maps 是按地图中文名匹配的键）、map（{ file, name }，name 用来找地图）、who / mood（说话人 id、表情）、
  //       win / lose / sides / rules / units（规则数据）、place / region / from / to / after（据点 id）。
  // 其余含中文的字符串都换：幕名、旁白、关卡的 no / title / when / where / highlight / goal / teach、dialog 各段每句的 text、
  //       epilogue、codex 的 title / text、factionNames、world.regions / places 的 name / note、reveals 的 note。
  // 事件触发条件 when 是对象（{ type, day… }），里面没有中文，不受影响；关卡的 when（“退潮第 41 天”）是字符串，会换。
  I.localizeCampaign = function (C, opt) {
    C = C || root.AWCampaign; if (!C) return null;
    return I.localizeLore(C, { skip: Object.assign({ units: 1, size: 1, center: 1, poly: 1, at: 1, camera: 1, routes: 1, version: 1 }, (opt && opt.skip) || {}), ctx: (opt && opt.ctx) || Object.assign({}, LORE_CTX, { where: 'map', title: 'level' }) });
  };
  // 工具用：某一类数据的跳过表（'lore' / 'campaign'），tools/i18n-story.js 按它生成翻译工作单
  I.loreSkip = kind => Object.assign({}, LORE_SKIP, kind === 'campaign' ? { units: 1, size: 1, center: 1, poly: 1, at: 1, camera: 1, routes: 1, version: 1 } : {});
  // 过场插画（cg.js 的 AWCG）：只有每页 lines 里的 text 是文字，图片路径不碰
  I.localizeCG = function (CG, opt) {
    CG = CG || root.AWCG; if (!CG) return null;
    return I.localizeLore(CG, { skip: Object.assign({ img: 1, dir: 1, size: 1, misc: 1, at: 1 }, (opt && opt.skip) || {}), ctx: (opt && opt.ctx) || LORE_CTX });
  };
  // 词典按需加载：index.html 启动时只加载当前语言的那一个；这里给“运行中换语言”用——插一个 <script src="i18n/<lang>.js">，加载完回调。
  // file:// 下可用。zh-CN 没有词典文件，直接回调。已经加载过的不重复加载。
  I.base = 'i18n/';
  I.loaded = lang => lang === SRC || !!dict[lang];
  I.loadDict = function (lang, cb) {
    if (I.loaded(lang) || !root.document) { if (cb) cb(true); return; }
    const el = root.document.createElement('script');
    el.src = I.base + lang + '.js';
    el.onload = () => { if (cb) cb(true); };
    el.onerror = () => { if (cb) cb(false); };
    (root.document.head || root.document.documentElement).appendChild(el);
  };
  // 启动时由 index.html 调：同步写出当前语言词典的 <script>（document.write 保证它在后面的界面脚本之前执行）
  I.writeDictTag = function () {
    if (I.lang === SRC || dict[I.lang] || !root.document || !root.document.write) return;
    root.document.write('<script src="' + I.base + I.lang + '.js"><\/script>');
  };
  // 一次把所有数据表换成当前语言（index.html 在词典之后调一次；之后 I.set() 会自动重跑）
  I.localizeAll = function () {
    if (root.AWData) I.localize(root.AWData);
    if (root.AWLore) I.localizeLore(root.AWLore);
    if (root.AWCampaign) I.localizeCampaign(root.AWCampaign);
    if (root.AWCG) I.localizeCG(root.AWCG);
  };
  function relocalize() { tracked.forEach(x => { try { x.run(); } catch (e) { if (root.console) root.console.error(e); } }); }

  // 原文：界面里要按原文做判断（或写存档）的地方用它，例如 AWI18n.zh(D.UNITS.inf, 'name') → '步兵'。
  I.zh = (o, field) => (o && o._zh && field in o._zh ? o._zh[field] : o ? o[field] : undefined);

  applyDoc();
  root.AWI18n = I;
  if (typeof module !== 'undefined') module.exports = I;
})(typeof window !== 'undefined' ? window : globalThis);
