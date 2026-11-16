// 潮汐战线：主机式界面的公共部件（window.AWKit）。
// 一屏只做一件事：每个画面是一张 .scr 整屏页，压进导航栈（Nav）；栈顶的页面决定方向键、A / B / X / Y / LB / RB 各做什么，
// 以及底部按键提示条（#hints）显示什么。提示条按最近用过的输入设备换键帽（手柄 / 键盘 / 鼠标触屏），本身也是可以点的大按钮。
// 尺寸：以 1920×1080 为基准，--r = 1 个基准像素对应的屏幕像素（按窗口等比缩放，最小 2/3）；样式表里写 30r 就是 30 个基准像素。
// 字体：系统自带的粗体无衬线。fonts/ 下如果放了新的粗体字体文件，把文件名填进 BOLD_FONT，就优先用它（加载失败照旧用系统字体）。
(function (root) {
  'use strict';
  const D = root.AWData, C = root.AWCore, Art = root.AWArt;
  const BOLD_FONT = '';                       // 例如 'fonts/ui-bold.woff2'
  const Kit = {};
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  Kit.esc = esc;
  // 界面文字的统一入口：显示的那一刻再取（多语言接入后走 AWI18n.t；现在原样返回，{名字} 占位符照填）
  Kit.t = (src, vars, ctx) => { const I = root.AWI18n; if (I && I.t) { try { return I.t(src, vars, ctx); } catch (e) { } } return vars ? String(src).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : src; };
  const $ = id => document.getElementById(id);
  // 当前语言（没有 AWI18n 时就是简体中文）
  const ZH = 'zh-CN', ZH_FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  Kit.lang = () => { const I = root.AWI18n; return (I && I.lang) || ZH; };
  // 并列：中日文顿号，其他语言逗号（元素先各自翻好再传进来）
  Kit.join = list => { const I = root.AWI18n; if (I && I.joinList) { try { return I.joinList(list); } catch (e) { } } return list.join('、'); };
  // 当前语言的字体回退栈（canvas 上画字用它，别写死中文字体名）
  Kit.font = () => { const I = root.AWI18n, first = BOLD_FONT ? '"SteelTideBold"' : ''; if (I && I.fontStack) { try { return I.fontStack(first); } catch (e) { } } return (first ? first + ',' : '') + ZH_FONT; };
  // 切句。简体中文：和原来各处的写法一样（按 。！？ 切，标点留在句尾）。
  // 其他语言：按 。！？!?… 以及“后面跟空白或结尾的 .”切，连着的标点和紧跟的右引号、右括号留在句尾；semi = 分号也算（Kit.pages 用）
  const cutText = (text, semi) => String(text || '').match(semi
    ? /[\s\S]+?(?:[。！？!?…；;]+|\.+(?=\s|$|[”’"'»」』）)\]]))[”’"'»」』）)\]]*\s*|[\s\S]+$/g
    : /[\s\S]+?(?:[。！？!?…]+|\.+(?=\s|$|[”’"'»」』）)\]]))[”’"'»」』）)\]]*\s*|[\s\S]+$/g) || [];
  Kit.sentences = text => Kit.lang() === ZH ? (String(text || '').match(/[^。！？]+[。！？]?/g) || []) : cutText(text).map(x => x.trim()).filter(Boolean);
  // 单行、不能换行的地方：内容比盒子宽（scrollWidth > clientWidth）就逐级缩小字号，最小缩到原来的 min 倍（默认 0.7）。返回最后的倍数。
  // 简体中文下什么都不做（版面是按中文排的）。el 得是有宽度的盒子（块、inline-block、flex 子项），纯 inline 元素量不出宽度
  Kit.fit = (el, min) => {
    if (!el || !el.style || Kit.lang() === ZH) return 1;
    el.style.fontSize = ''; if (!el.clientWidth) return 1;
    const base = parseFloat(getComputedStyle(el).fontSize) || 0, lo = min || 0.7; if (!base) return 1;
    const floor = base >= 20 ? 20 : 14;   // 缩字不低于界面的最小字号（桌面 20px、手机 14px），再放不下就让它省略或换行
    let k = 1; while (el.scrollWidth > el.clientWidth + 1 && k - 0.05 >= lo - 1e-6 && base * (k - 0.05) >= floor) { k = Math.round((k - 0.05) * 100) / 100; el.style.fontSize = (base * k) + 'px'; }
    return k;
  };

  // ───────── 样式表 ─────────
  // 写法：数字后面跟 r = 基准像素（30r → calc(30 * var(--r))）
  let styleEl = null;
  Kit.css = txt => {
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'aw-kit'; document.head.appendChild(styleEl); }
    styleEl.appendChild(document.createTextNode(txt.replace(/max\((\d+)px,/g, 'max(calc($1px * var(--fk)),').replace(/(-?\d*\.?\d+)r(?![\w%.(])/g, 'calc($1 * var(--r))')));
  };
  Kit.s = 1;
  // 横屏按 1920×1080 等比缩放；竖屏（手机）按 760 宽排单栏。字号下限平时 20 像素，小屏（缩放不到 2/3）降到 14
  Kit.scale = () => {
    const W = innerWidth, H = innerHeight, narrow = H > W * 1.15;
    const s = narrow ? W / 760 : Math.min(W / 1920, H / 1080), small = Math.min(W, H) < 560;
    Kit.s = small ? s : Math.max(2 / 3, s); Kit.narrow = narrow;
    const st = document.documentElement.style; st.setProperty('--r', Kit.s + 'px'); st.setProperty('--fk', small ? '0.7' : '1');
    if (document.body) { document.body.classList.toggle('narrow', narrow); document.body.classList.toggle('small', small); }
    return Kit.s;
  };
  Kit.barH = () => Math.round(100 * Kit.s);   // 底部按键提示牌占的高度（面板摆放时让开它）
  if (BOLD_FONT) { try { const f = new FontFace('SteelTideBold', 'url(' + BOLD_FONT + ')', { weight: '100 900' }); f.load().then(x => { document.fonts.add(x); }, () => { }); } catch (e) { } }

  Kit.css(`
  :root { --bg:#1c2233; --bg2:#141927; --panel:#2a3248; --panel2:#37415e; --line:#0e1220; --hi:#6a7aa6; --lo:#1a2033; --gold:#f2b632; --gold2:#ffe08a; --goldd:#a06a14;
    --txt:#f4efe0; --mut:#aab3cc; --ink:#1a1d2b; --red:#e8573f; --green:#5fca6c; --blue:#4c9cf0; --yel:#f2c230; --pc:#b84a42; --pcd:#933b3a; --pcl:#e89078;
    --font:"SteelTideBold",var(--font-i18n, ${ZH_FONT}); }
  html, body { font-family:var(--font) !important; font-weight:800; font-size:max(20px,30r) !important; line-height:1.3 !important; color:var(--txt); -webkit-font-smoothing:antialiased !important; font-smooth:auto !important; text-rendering:auto !important; }
  .scr, #hints, #menu, .hud, button { font-family:var(--font); font-weight:800; }
  button { letter-spacing:0; }
  /* 字号三档：标题 / 正文 / 小字（最小 20 像素） */
  .t-xl { font-size:max(40px,72r); font-weight:900; line-height:1.1; } .t-l { font-size:max(30px,48r); font-weight:900; line-height:1.15; } .t-m { font-size:max(22px,36r); } .t-b { font-size:max(20px,30r); } .t-s { font-size:max(20px,24r); font-weight:700; }
  .mut { color:var(--mut); } .gold { color:var(--gold); } .good { color:var(--green); } .bad { color:var(--red); }
  .ol { text-shadow:0 3r 0 var(--line), 3r 0 0 var(--line), -3r 0 0 var(--line), 0 -3r 0 var(--line), 2r 2r 0 var(--line), -2r 2r 0 var(--line), 2r -2r 0 var(--line), -2r -2r 0 var(--line), 0 7r 0 rgba(0,0,0,.45); }
  /* 面板：厚边、亮边 + 暗边的浮雕、下沉投影 */
  .pn { background:linear-gradient(var(--panel2), var(--panel) 30%); border:5r solid var(--line); border-radius:18r; box-shadow:inset 0 4r 0 var(--hi), inset 0 -5r 0 var(--lo), 0 9r 0 rgba(0,0,0,.4); }
  .pn.gold { border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); }
  .pn.fac { background:linear-gradient(var(--pc), var(--pcd)); box-shadow:inset 0 4r 0 var(--pcl), inset 0 -5r 0 rgba(0,0,0,.35), 0 9r 0 rgba(0,0,0,.4); }
  .well { background:var(--bg2); border-radius:12r; box-shadow:inset 0 4r 0 rgba(0,0,0,.45); }
  /* 整屏页 */
  .scr { position:fixed; left:0; top:0; right:0; bottom:0; padding-bottom:100r; z-index:10; overflow:hidden; display:flex; flex-direction:column; align-items:center; background:radial-gradient(120% 90% at 50% 0, #2b3552, var(--bg) 60%, var(--bg2)); animation:scrIn .2s ease-out both; }
  .scr.dim { background:rgba(12,15,26,.74); } .scr.clear { background:none; } .scr.back { animation-name:scrBack; } .scr.pop { animation-name:scrPop; }
  @keyframes scrIn { from { opacity:0; transform:translateX(60r); } } @keyframes scrBack { from { opacity:0; transform:translateX(-60r); } } @keyframes scrPop { from { opacity:0; transform:scale(.94); } }
  .scr::before { content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; background:repeating-linear-gradient(135deg, #fff 0 2r, transparent 2r 28r); } .scr.dim::before, .scr.clear::before { display:none; }
  .scr > * { position:relative; }
  .hidden { display:none !important; }
  /* 可选项：选中整块金色、略微放大、左边一个会动的箭头 */
  .nav { cursor:pointer; position:relative; transition:transform .08s; }
  .item { display:flex; align-items:center; gap:18r; width:100%; min-height:max(64px,84r); padding:0 30r 0 64r; font-size:max(22px,36r); font-weight:800; color:var(--txt); text-align:left; white-space:nowrap; border-radius:12r; background:rgba(14,18,32,.55); margin:6r 0; text-shadow:0 3r 0 rgba(0,0,0,.5); }
  .item .c { margin-left:auto; padding-left:36r; color:var(--gold); display:flex; align-items:center; gap:10r; font-size:max(20px,30r); }
  .item:disabled, .item.off { color:#7c849c; text-shadow:none; } .item:disabled .c { color:#7c849c; } .item:disabled .ic, .item:disabled canvas { opacity:.4; filter:grayscale(1); }
  .nav.focus { background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e); color:var(--ink); text-shadow:none; box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 rgba(255,255,255,.45), 0 6r 0 rgba(0,0,0,.4); transform:scale(1.04); z-index:2; }
  .nav.focus .c, .nav.focus .mut, .nav.focus .gold { color:var(--ink); }
  .item.focus::before, .arrow::before { content:""; position:absolute; left:20r; top:50%; margin-top:-16r; border:16r solid transparent; border-left:24r solid var(--ink); border-right:0; animation:bob .5s ease-in-out infinite alternate; }
  @keyframes bob { to { transform:translateX(8r); } }
  /* 图标、数值小牌子 */
  .ic { display:inline-block; flex:none; width:48r; height:48r; background:center/contain no-repeat; vertical-align:middle; image-rendering:auto; } .ic.s { width:36r; height:36r; } .ic.l { width:72r; height:72r; } .ic.xl { width:120r; height:120r; }
  canvas.uc, canvas.tc, canvas.mc { display:inline-block; flex:none; vertical-align:middle; } canvas.tc { image-rendering:pixelated; }
  .chip { display:inline-flex; align-items:center; gap:8r; height:max(40px,56r); padding:0 16r 0 10r; border-radius:10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line), inset 0 6r 0 rgba(255,255,255,.07); font-size:max(20px,28r); white-space:nowrap; }
  .chip b { font-weight:900; color:var(--gold); } .chip.good b { color:var(--green); } .chip.bad b { color:var(--red); } .chips { display:flex; flex-wrap:wrap; gap:10r; align-items:center; }
  .tag { display:inline-flex; align-items:center; height:max(34px,44r); padding:0 16r; border-radius:8r; background:#5a4a2a; color:#fff2a8; box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,24r); white-space:nowrap; }
  .tile { display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:150r; padding:10r 18r; border-radius:12r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line), inset 0 6r 0 rgba(255,255,255,.07); }
  .tile b { font-size:max(26px,44r); font-weight:900; color:var(--gold); line-height:1.1; display:flex; align-items:center; gap:8r; } .tile span { font-size:max(20px,24r); color:var(--mut); font-weight:700; }
  .tiles { display:flex; gap:14r; flex-wrap:wrap; }
  .stars { color:var(--gold); letter-spacing:2r; text-shadow:0 3r 0 var(--line); } .stars i { color:#55607e; font-style:normal; }
  .hd { display:inline-block; flex:none; width:96r; height:96r; border-radius:12r; background:var(--pc) top center/auto 170% no-repeat; box-shadow:inset 0 0 0 4r var(--line), 0 0 0 0 transparent; border:4r solid var(--line); }
  img.pt { display:block; object-fit:contain; object-position:bottom center; filter:drop-shadow(0 10r 0 rgba(0,0,0,.35)); }
  .bar { position:relative; height:26r; min-width:160r; border-radius:8r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); overflow:hidden; } .bar > i { position:absolute; left:3r; top:3r; bottom:3r; border-radius:5r; background:linear-gradient(var(--gold2), var(--gold)); }
  .bar.full > i { animation:blink .5s steps(2) infinite; } @keyframes blink { 50% { filter:brightness(1.5); } }
  .bar.seg::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(90deg, transparent 0 calc(20% - 3r), var(--line) calc(20% - 3r) 20%); }
  /* 顶部条：标题 / 步骤 / 页签 */
  .top { flex:none; display:flex; align-items:center; justify-content:center; gap:18r; height:110r; width:100%; padding:0 150r 0 40r; }
  .crumb { position:absolute; left:36r; top:22r; z-index:3; display:flex; align-items:center; gap:14r; padding:8r 26r; font-size:max(22px,36r); font-weight:900; color:var(--gold); border-radius:14r; }
  .crumb span { color:var(--txt); } .crumb em { font-style:normal; color:var(--hi); }
  .steps { display:flex; align-items:center; gap:10r; } .step { display:flex; align-items:center; gap:10r; height:60r; padding:0 24r; border-radius:30r; background:var(--bg2); color:var(--mut); font-size:max(20px,28r); box-shadow:inset 0 0 0 3r var(--line); }
  .step b { display:inline-flex; align-items:center; justify-content:center; width:38r; height:38r; border-radius:50%; background:#55607e; color:var(--bg2); font-size:max(20px,24r); } .step.on { background:var(--gold); color:var(--ink); } .step.on b { background:var(--ink); color:var(--gold); } .step.done { color:var(--txt); } .step.done b { background:var(--green); }
  .steps > i { font-style:normal; color:#55607e; }
  .tabs { display:flex; align-items:center; gap:14r; } .tab { display:flex; align-items:center; gap:12r; height:76r; padding:0 30r; border-radius:14r; font-size:max(22px,36r); font-weight:900; color:var(--pcl); background:var(--bg2); box-shadow:inset 0 0 0 4r var(--pcd); cursor:pointer; white-space:nowrap; }
  .tab.on { background:linear-gradient(var(--pc), var(--pcd)); color:#fff; box-shadow:inset 0 0 0 4r var(--gold), inset 0 9r 0 rgba(255,255,255,.2), 0 6r 0 rgba(0,0,0,.4); transform:scale(1.06); text-shadow:0 3r 0 rgba(0,0,0,.45); }
  /* 键帽 */
  .kc { display:inline-flex; align-items:center; justify-content:center; flex:none; min-width:52r; height:52r; padding:0 12r; border-radius:26r; font-size:max(20px,28r); font-weight:900; font-style:normal; color:#fff; background:#55607e; box-shadow:inset 0 -5r 0 rgba(0,0,0,.3), inset 0 4r 0 rgba(255,255,255,.3), 0 0 0 3r var(--line); text-shadow:0 2r 0 rgba(0,0,0,.4); line-height:1; }
  .kc.a { background:#35a852; } .kc.b { background:#d94a3a; } .kc.x { background:#3b82e6; } .kc.y { background:#e0a81c; }
  .kc.sq { border-radius:10r; background:#737d9c; } .kc.key { border-radius:10r; background:#e9e4d4; color:var(--ink); text-shadow:none; box-shadow:inset 0 -6r 0 #b9b29c, 0 0 0 3r var(--line); padding:0 14r; font-size:max(20px,24r); }
  /* 按键提示：屏幕底部居中的一块小牌子（不做通栏），只在有面板打开时出现；对局空闲时不显示，地图铺满全屏 */
  #hints { position:fixed; left:50%; bottom:14r; transform:translateX(-50%); height:76r; z-index:40; display:flex; align-items:center; justify-content:center; gap:10r; padding:0 16r; border-radius:22r; background:linear-gradient(#27304c, #161b2c); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 #46527a, 0 8r 0 rgba(0,0,0,.4); white-space:nowrap; transition:opacity .35s; }
  #hints.off { opacity:0; pointer-events:none; }
  #hints .h { display:flex; align-items:center; gap:10r; height:60r; padding:0 16r; border-radius:14r; font-size:max(20px,30r); font-weight:800; color:var(--txt); cursor:pointer; }
  #hints .h:hover, #hints .h:active { background:rgba(255,255,255,.12); } #hints .h.off { opacity:.35; pointer-events:none; }
  #hints .sep { width:4r; height:32r; background:#46527a; border-radius:2r; }
  #hints .bt { background:linear-gradient(#46527a, #333d5c); box-shadow:inset 0 0 0 3r var(--line), inset 0 6r 0 rgba(255,255,255,.14); padding:0 26r; } #hints .bt:hover { background:linear-gradient(var(--gold2), var(--gold)); color:var(--ink); }
  #hints .bt.ar { padding:0 18r; font-size:max(26px,40r); } #hints .lab { font-size:max(20px,28r); color:var(--mut); padding:0 4r; }
  #hints.corner { left:auto; right:20r; transform:none; }
  #hints.flow { left:24r; right:24r; bottom:16r; transform:none; height:auto; justify-content:space-between; align-items:flex-end; gap:16r; padding:0; background:none !important; box-shadow:none !important; border:0 !important; border-image:none !important; filter:none; pointer-events:none; flex-wrap:nowrap !important; }
  #hints.flow .h, #hints.flow .mid { pointer-events:auto; } #hints.flow .mid { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:8r; min-width:0; flex:1; }
  #hints.flow .mid .h { background:rgba(22,27,44,.92); box-shadow:inset 0 0 0 3r var(--line); }
  #hints.flow .fa { flex:none; min-width:max(150px,340r); height:max(52px,96r); justify-content:center; gap:14r; padding:0 34r; border-radius:18r; font-size:max(24px,40r); font-weight:900; color:var(--ink); background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e); box-shadow:inset 0 0 0 5r var(--line), 0 8r 0 rgba(0,0,0,.45), 0 0 30r rgba(242,182,50,.35); }
  #hints.flow .fa:hover, #hints.flow .fa:active { background:linear-gradient(#fff3c4, var(--gold2)); } #hints.flow .fa.off { background:#39425e; color:#aab3cc; box-shadow:inset 0 0 0 5r var(--line); opacity:1; }
  #hints.flow .fb { flex:none; min-width:max(96px,200r); height:max(44px,72r); justify-content:center; padding:0 24r; border-radius:14r; font-size:max(20px,28r); color:#cfd6ea; background:linear-gradient(#3a4466, #2a3248); box-shadow:inset 0 0 0 4r var(--line), 0 6r 0 rgba(0,0,0,.4); } #hints.flow .fb0 { flex:none; min-width:max(96px,200r); }
  body.narrow #hints.flow { left:10px; right:10px; bottom:10px; } body.narrow #hints.flow .mid { display:none; } body.small:not(.narrow) #hints.flow .mid .h { font-size:max(20px,24r); }
  body[data-dev=touch] #hints { height:auto; min-height:max(56px,76r); padding:6px 10px; } body[data-dev=touch] #hints .bt { min-height:44px; min-width:44px; justify-content:center; }
  /* 手机竖屏：面板改成单栏，超出的往下滚 */
  body.narrow #hints { left:2vw; right:2vw; transform:none; flex-wrap:wrap; height:auto; padding:6px 10px; background:none; box-shadow:none; } body.narrow #hints.corner { left:auto; }
  body.narrow .scr { padding-bottom:max(64px,120r); } body.small .scr { padding-bottom:76px; } body.narrow.hint-on #hudI { bottom:max(72px,150r,calc(var(--hintTop, 0px) + 8px)); }
  body.narrow .cols, body.narrow .build, body.narrow .cxg, body.narrow .cxr, body.narrow .tech, body.narrow .statw, body.narrow .cxw { flex-direction:column; align-items:stretch; justify-content:flex-start; overflow-y:auto; padding-left:24r; padding-right:24r; gap:20r; }
  body.narrow .olist, body.narrow .odesc, body.narrow .build .ls, body.narrow .build .cd, body.narrow .cxg .grid, body.narrow .cxg .card, body.narrow .cxr .ls, body.narrow .cxr .pg, body.narrow .tech .rt, body.narrow .tech .lf, body.narrow .stcard, body.narrow .pager, body.narrow .detail, body.narrow .pause { width:auto; max-width:100%; flex:none; align-self:stretch; }
  body.narrow .pager, body.narrow .detail, body.narrow .pause { margin:auto 20r; } body.narrow .build .ls, body.narrow .cxr .ls { max-height:38vh; } body.narrow .cxg .grid { max-height:34vh; grid-template-columns:repeat(6, 1fr); }
  body.narrow .seats { flex-wrap:wrap; gap:20r; align-content:center; } body.narrow .seat { width:340r; padding:18r 14r; } body.narrow .cxhome { grid-template-columns:repeat(2, 340r); gap:20r; } body.narrow .cxt { height:250r; }
  body.narrow .logo { font-size:150r; margin-top:120r; } body.narrow .mrow .nb { display:none; } body.narrow .mrow .side.l { left:0; } body.narrow .mrow .side.r { right:0; } body.narrow .mhead { flex-wrap:wrap; justify-content:center; height:auto; } body.narrow .mhead .nm { font-size:70r; }
  body.narrow .over { flex-direction:column; align-items:center; padding:20r; overflow-y:auto; } body.narrow .over .ps img { height:520r; } body.narrow .over .rt { min-width:0; } body.narrow .over .big { font-size:150r; }
  body.narrow .top { padding:0 calc(max(48px,72r) + 30r) 0 10r; } body.narrow .step { white-space:nowrap; } body.narrow .step:not(.on):has(> b) > .sn { display:none; } body.narrow .step { padding:0 14r; height:52r; } body.narrow .tiles { gap:8r; } body.narrow .tile { min-width:120r; padding:8r 10r; }
  body.narrow .ucard .hdx { flex-wrap:wrap; } body.narrow .keys { grid-template-columns:1fr; } body.narrow .tline { flex-wrap:wrap; } body.narrow .tline .ln { width:100%; } body.narrow .tnode { min-height:90r; }
  body.narrow .tfund { flex-wrap:wrap; white-space:normal; }
  #snd { position:fixed; right:20r; top:20r; z-index:45; width:max(48px,72r); height:max(48px,72r); border-radius:16r; display:flex; align-items:center; justify-content:center; background:var(--panel); border:4r solid var(--line); box-shadow:inset 0 4r 0 var(--hi), 0 6r 0 rgba(0,0,0,.4); cursor:pointer; }
  #snd svg { width:60%; height:60%; } #snd:hover { background:var(--panel2); }
  /* 竖排的设置行：一行一项，左右改值；右边一块说明 */
  .olist { display:flex; flex-direction:column; width:900r; max-height:100%; overflow:hidden; }
  /* 开局“规则”一步：放不下（手机横屏）时规则列表在自己框里上下滚，不被上下裁掉 */ #wzRules .cols > div:first-child { display:flex; flex-direction:column; max-height:100%; min-height:0; } #wzRules .olist { flex:0 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; } #wzRules .olist::-webkit-scrollbar { display:none; }
  .orow { display:flex; align-items:center; min-height:max(64px,80r); padding:0 26r 0 64r; margin:5r 0; border-radius:12r; background:rgba(14,18,32,.55); font-size:max(22px,34r); white-space:nowrap; }
  .orow .v { margin-left:auto; display:flex; align-items:center; gap:16r; color:var(--gold); font-weight:900; } .orow .v i { font-style:normal; font-size:max(20px,27r); opacity:.6; padding:8r 10r; } .orow.focus .v i { opacity:1; }
  .orow.focus .v { color:var(--ink); } .orow.focus::before { content:""; position:absolute; left:20r; top:50%; margin-top:-16r; border:16r solid transparent; border-left:24r solid var(--ink); border-right:0; animation:bob .5s ease-in-out infinite alternate; }
  .odesc { width:620r; align-self:stretch; padding:34r 38r; display:flex; flex-direction:column; gap:18r; } .odesc h3 { margin:0; font-size:max(26px,44r); font-weight:900; color:var(--gold); } .odesc p { margin:0; font-size:max(20px,30r); line-height:1.5; }
  .cols { flex:1; min-height:0; display:flex; gap:36r; align-items:center; justify-content:center; width:100%; padding:10r 60r 30r; }
  /* 详情翻页卡 */
  .pager { width:1240r; min-height:520r; max-height:100%; margin:auto; padding:44r 60r; display:flex; flex-direction:column; gap:22r; } .pager h2 { margin:0; font-size:max(30px,56r); font-weight:900; color:var(--gold); } .pager h2 small { font-size:max(20px,31r); color:var(--mut); margin-left:18r; }
  .pager .pg { flex:1; min-height:0; font-size:max(22px,34r); line-height:1.6; } .pager .pg p { margin:0 0 14r; } .dots { display:flex; gap:14r; justify-content:center; } .dots i { width:20r; height:20r; border-radius:50%; background:#55607e; box-shadow:0 0 0 3r var(--line); } .dots i.on { background:var(--gold); }
  .side { position:absolute; top:50%; margin-top:-70r; width:90r; height:140r; display:flex; align-items:center; justify-content:center; font-size:90r; color:var(--gold); text-shadow:0 6r 0 var(--line); cursor:pointer; z-index:4; animation:bob .6s ease-in-out infinite alternate; } .side.l { left:16r; animation-direction:alternate-reverse; } .side.r { right:16r; }
  .pager .lk { color:var(--gold2); border-bottom:3r solid var(--gold); } .pager .tie { display:flex; align-items:center; gap:18r; margin-bottom:14r; } .pager .tie .hd { width:96r; height:96r; cursor:pointer; }
  /* 单位 / 地形详情卡（对局里的详情、造兵菜单右侧、图鉴兵种页共用） */
  .ucard { display:flex; flex-direction:column; gap:16r; min-width:0; } .ucard .hdx { display:flex; align-items:center; gap:26r; } .ucard .pic { flex:none; display:flex; align-items:center; justify-content:center; width:230r; height:230r; border-radius:16r; background:linear-gradient(#8fc45a, #5d9a3c); box-shadow:inset 0 0 0 5r var(--line), inset 0 -40r 0 rgba(0,0,0,.12); }
  .ucard .pic.sea { background:linear-gradient(#5aa6e8, #2f6fc0); } .ucard .pic.air { background:linear-gradient(#a8d8f8, #6fb0e8); } .ucard.compact .pic { width:170r; height:170r; }
  .ucard .nm { font-size:max(30px,56r); font-weight:900; line-height:1.1; } .ucard .sub { display:flex; align-items:center; gap:14r; margin-top:8r; font-size:max(20px,30r); color:var(--mut); } .ucard .sub .own { color:var(--pcl); }
  .ucard .ds { font-size:max(20px,30r); line-height:1.4; } .ucard h4 { margin:6r 0 0; font-size:max(20px,26r); color:var(--mut); font-weight:800; display:flex; align-items:center; gap:10r; }
  .vs { display:flex; gap:10r; flex-wrap:wrap; } .vs .v1 { display:flex; flex-direction:column; align-items:center; width:118r; padding:6r 0 8r; border-radius:10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,26r); font-weight:900; }
  .vs .v1.g { color:var(--green); } .vs .v1.r { color:var(--red); } .vs .v1.here { box-shadow:inset 0 0 0 4r var(--gold); } .vs .v1 small { font-size:max(20px,18r); color:var(--mut); font-weight:700; max-width:100%; overflow:hidden; }
  .who { display:flex; gap:12r; } .who .w1 { position:relative; display:flex; flex-direction:column; align-items:center; gap:2r; width:120r; padding:8r 0; border-radius:10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,26r); font-weight:900; color:var(--gold); }
  .who .w1 small { font-size:max(20px,20r); color:var(--mut); font-weight:700; } .who .w1.no { color:var(--red); } .who .w1.no .ic, .who .w1.no canvas { opacity:.35; filter:grayscale(1); }
  .vs.mk { gap:6r; } .vs.mk .v1 { width:70r; padding:4r 0; }
  /* 可滚动的详情面板：内容超出时能滚（滚轮、拖动、PageUp / PageDown、手柄右摇杆）；上下还有内容时，边上一条渐隐加一个箭头 */
  .sc { overflow-y:auto; overflow-x:hidden; scrollbar-width:none; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; } .sc::-webkit-scrollbar { display:none; }
  .sc.more-dn::after { content:"▼"; position:sticky; bottom:-2r; display:block; flex:none; height:70r; margin-top:-70r; line-height:96r; text-align:center; color:var(--gold); font-size:max(20px,30r); background:linear-gradient(transparent, #232a40 70%); pointer-events:none; z-index:5; }
  .sc.more-up::before { content:"▲"; position:sticky; top:-2r; display:block; flex:none; height:56r; margin-bottom:-56r; line-height:40r; text-align:center; color:var(--gold); font-size:max(20px,30r); background:linear-gradient(#2c3550 30%, transparent); pointer-events:none; z-index:5; }
  /* 全局一套金属边框：面板、提示牌、喇叭按钮都是切角钢边 + 四角金色角饰（九宫格图由下面的 frame9 画出来）；按钮、页签、数字牌用切角 */
  .pn, #hints, #snd { border:12r solid transparent !important; border-radius:0 !important; border-image:var(--pn9) 72 / 32r / 0 stretch !important; background-clip:padding-box !important; box-shadow:none !important; filter:drop-shadow(0 8r 0 rgba(0,0,0,.42)); }
  .pn.gold, #hudS, #hudI, #menu, .pause, .detail, #toast, .mrow .mid { border-image-source:var(--pn9g) !important; } #hudF { border-image-source:var(--pn9r) !important; } .pn.nav.focus { border-image-source:var(--pn9f) !important; }
  body.narrow #hints { border-image:none !important; border:0 !important; filter:none; }
  .item, .orow, .tab, .tile, #hints .bt { border-radius:0; clip-path:polygon(10r 0, calc(100% - 10r) 0, 100% 10r, 100% calc(100% - 10r), calc(100% - 10r) 100%, 10r 100%, 0 calc(100% - 10r), 0 10r); }
  /* 浮动提示 */
  #note { position:fixed; left:50%; bottom:110r; transform:translateX(-50%); z-index:38; padding:14r 34r; font-size:max(20px,30r); color:var(--gold2); border-radius:14r; pointer-events:none; animation:scrPop .15s both; }
  `);
  // 多语言版面兜底：<html data-lang> 由 AWI18n 写；简体中文（zh-CN，或者没有 AWI18n）下面这些规则一条都不生效
  {
    const L = 'html:is([data-lang="en"],[data-lang="es"],[data-lang="fr"],[data-lang="de"],[data-lang="pt-BR"],[data-lang="ru"])', J = 'html:is([data-lang="ja"],[data-lang="ko"],[data-lang="zh-TW"])';
    Kit.css(`
  /* 西文、俄文：正文降一档字重；按钮和标签可以换行、略缩字 */
  ${L}, ${L} body, ${L} :is(.scr, #hints, #menu, .hud, button, .item, #hints .h) { font-weight:700; }
  ${L} :is(button, .item, .orow, .tab, .tag, .chip, .step, .tile span, .vs .v1 small, .who .w1 small) { white-space:normal; overflow-wrap:break-word; hyphens:auto; -webkit-hyphens:auto; line-height:1.15; }
  /* 数字、价格、强化标记这类小格子不拆行（名字换行时别把 300 挤成两行） */
  ${L} :is(#build .c, #build .md, .item .c, .md, .num, .cost) { white-space:nowrap; flex-shrink:0; overflow-wrap:normal; }
  ${L} :is(.tab, .tag, .chip, .step) { height:auto; padding-top:4r; padding-bottom:4r; }
  ${L} .tab { min-height:76r; } ${L} .tag { min-height:max(34px,44r); } ${L} .chip { min-height:max(40px,56r); } ${L} .step { min-height:60r; }
  ${L} .item { font-size:max(20px,31r); } ${L} .orow { font-size:max(20px,29r); } ${L} .tab { font-size:max(20px,30r); } ${L} .chip { font-size:max(20px,24r); } ${L} .step { font-size:max(20px,24r); }
  ${L} .tag, ${L} .tile span { font-size:max(20px,21r); } ${L} .kc.key { font-size:max(20px,21r); } ${L} #hints:not(.flow) .h, ${L} #hints.flow .mid .h { font-size:max(20px,26r); } ${L} #hints:not(.flow) .lab { font-size:max(20px,24r); }
  /* 流程式提示条的金色主按钮、返回按钮：保持原来的大小关系（主按钮更大），长词时允许按钮变宽、不换行 */
  ${L} #hints.flow .fa, ${L} #hints.flow .fb { white-space:nowrap; }
  ${L} .vs .v1 small, ${L} .who .w1 small { font-size:max(20px,17r); text-align:center; max-width:100%; } ${L} .tile span { text-align:center; }
  /* 结算页的大字标题（“作战成功”是四个字，西文是两个长词）：缩一档，免得被立绘右边的版面截断、把按钮顶到提示条下面 */
  ${L} .over .big { font-size:max(44px,96r) !important; line-height:1.02; }
  /* 回合菜单里“发动「技能名」”这一项：技能名长，缩字不拆成三行 */
  ${L} #menu .item, ${L} .menu .item { line-height:1.1; }
  /* 造兵列表：兵种名是长词（Scharfschütze、Francotirador），缩一档字、只在空格处换行，不在词中间加连字符拆开 */
  ${L} #build .item { font-size:max(20px,25r); } ${L} #build .item > span:not(.c) { hyphens:manual; -webkit-hyphens:manual; overflow-wrap:normal; }
  /* 选指挥官 / 图鉴指挥官页的条目：左边的小标题（“科技 1”译出来更长）给宽一点、允许两行，别压到右边的正文 */
  ${L} .crow .lb { width:190r; white-space:normal; line-height:1.1; font-size:max(20px,22r); }
  /* 科技界面左侧页签：名字长，缩字并允许两行，不截断 */
  ${L} .ttab b { white-space:normal; overflow:visible; font-size:max(20px,24r); line-height:1.08; overflow-wrap:break-word; hyphens:auto; -webkit-hyphens:auto; }
  /* 图鉴首页的大格子、兵种格子、克制条里的名字：缩字、允许两行 */
  ${L} .cxt .cap b { font-size:max(22px,36r); overflow-wrap:break-word; }
  ${L} .ucell { white-space:normal; text-align:center; line-height:1.05; font-size:max(20px,20r); }
  /* 开局选指挥官页顶部的阵营页签：一行放不下四个长阵营名时缩字 */
  ${L} .tab { line-height:1.05; }
  /* 选指挥官页：顶部阵营页签不换行（换行会被顶边裁掉），缩字；左下“阵营 | 玩家：选择指挥官”的牌子限宽、可两行，别盖住头像条 */
  ${L} .copick .tab { white-space:nowrap; min-height:60r; font-size:max(20px,22r); padding-left:14r; padding-right:14r; }
  ${L} .copick .crumb { max-width:32vw; font-size:max(20px,24r); line-height:1.1; flex-wrap:wrap; row-gap:2r; }
  /* 图鉴阵营页的大字阵营名（Purpurflamme、Нефритовый Лес）：缩一档、可换行，别被斜切的色块右边裁掉 */
  ${L} .flag b { font-size:max(36px,72r); overflow-wrap:break-word; hyphens:auto; -webkit-hyphens:auto; }
  /* 日文、韩文、繁体：正文降一档字重；韩文不在词中间断行 */
  ${J}, ${J} body, ${J} :is(.scr, #hints, #menu, .hud, button, .item, #hints .h) { font-weight:700; }
  html[data-lang="ko"] body { word-break:keep-all; }
  `);
  }

  // ───────── 金属边框的九宫格图：2 像素深色描边 + 亮暗两道斜面 + 钢色边条，四角切掉一块、里侧压一片带铆钉的角饰 ─────────
  // 54×54（每边 18 一格）画在 3 倍的画布上，缩放后边缘仍然利落
  function frame9(hi, mid, lo, orn, ornLo) {
    const N = 72, C = 6, B = 9, K = 3,   // 每边 24 一格：9 是边条，里侧 15 留给角饰
    cv = document.createElement('canvas'); cv.width = cv.height = N * K;
    const c = cv.getContext('2d'), put = (x, y, col) => { c.fillStyle = col; c.fillRect(x * K, y * K, K, K); };
    // 到切角矩形外沿的“层数”（0 = 最外一圈），在外面返回 -1
    const depth = (x, y) => { const dx = Math.min(x, N - 1 - x), dy = Math.min(y, N - 1 - y); if (dx + dy < C) return -1; return Math.min(dx, dy, Math.floor((dx + dy - C) / 1.42)); };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = depth(x, y); if (d < 0) continue;
      const dx = Math.min(x, N - 1 - x), dy = Math.min(y, N - 1 - y), tl = (dy <= dx ? y < N / 2 : x < N / 2);   // 这一点属于上 / 左边（受光）还是下 / 右边
      if (d < B) { put(x, y, d < 2 ? '#0e1220' : d === 2 ? (tl ? hi : lo) : d < 7 ? mid : d === 7 ? (tl ? lo : hi) : '#0e1220'); continue; }
      // 角饰：边条里侧一片三角形的金属片，斜边描深色，中间一颗铆钉
      const ax = dx - B, ay = dy - B, k = ax + ay; if (dx >= 24 || dy >= 24 || k > 14) continue;
      const rivet = Math.abs(ax - 3) + Math.abs(ay - 3);   // 铆钉：深色一圈，中间一点高光
      put(x, y, k === 14 ? '#0e1220' : k >= 12 ? ornLo : rivet === 0 ? '#fff' : rivet <= 1 ? '#0e1220' : (ax === 0 || ay === 0) ? '#fff6c8' : orn);
    }
    return 'url(' + cv.toDataURL() + ')';
  }
  try {
    const st = document.documentElement.style;
    st.setProperty('--pn9', frame9('#93a3cf', '#55638d', '#2c3552', '#f2b632', '#a06a14'));    // 钢边 + 金角
    st.setProperty('--pn9g', frame9('#fff0b0', '#f2b632', '#a06a14', '#e9edf8', '#8a93ad'));   // 金边 + 钢角（要紧的面板：阵营牌、信息牌、菜单、详情）
    st.setProperty('--pn9r', frame9('#ffb8a4', '#e8573f', '#8a2a1c', '#f2b632', '#a06a14'));   // 红边（伤害预览）
    st.setProperty('--pn9f', frame9('#ffffff', '#ffe08a', '#dc9a1e', '#1a1d2b', '#1a1d2b'));   // 选中
  } catch (e) { }

  // ───────── 输入设备：最近一次用的是什么（手柄 pad / 键盘 key / 鼠标 mouse / 触屏 touch）─────────
  // 页面刚打开：触屏设备（手机、平板）按 touch，否则按 mouse；之后谁有输入就切到谁。手柄键帽只在真的收到手柄输入之后才出现
  Kit.dev = ((navigator.maxTouchPoints || 0) > 0 && root.matchMedia && matchMedia('(pointer: coarse)').matches) ? 'touch' : 'mouse';
  if (document.body) document.body.dataset.dev = Kit.dev;
  Kit.ptr = () => Kit.dev === 'mouse' || Kit.dev === 'touch';
  Kit.onDev = null;                           // 输入设备换了：ui.js 接上（对局里把按键提示闪出来一下）
  Kit.setDev = d => { if (d === Kit.dev) return; Kit.dev = d; document.body.dataset.dev = d; Kit.paintHints(true); if (Kit.onDev) Kit.onDev(d); };
  Kit.sfx = { tick() { }, ok() { }, no() { }, back() { } };
  // 空闲降耗：最近一次输入的时刻。各处的重画循环（对局、标题、世界地图）在没有输入、没有动画时降到每秒 12 帧，页面不可见时停画
  Kit.wakeT = performance.now(); Kit.wake = () => { Kit.wakeT = performance.now(); }; Kit.idle = (now, ms) => now - Kit.wakeT > (ms || 700); Kit.IDLE_MS = 83;
  for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'keyup', 'touchstart', 'touchmove']) addEventListener(ev, Kit.wake, { capture: true, passive: true });
  document.addEventListener('visibilitychange', Kit.wake);
  Kit.onAct = () => { };                      // ui.js 接上：提示条上的按钮点了之后走它

  // ───────── 导航栈 ─────────
  let tapWas = null;                          // 触屏：这一下点下去之前已经选中的那一项
  const Nav = Kit.Nav = {
    stack: [],
    top() { return this.stack[this.stack.length - 1]; },
    items() { const t = this.top(); return t ? [...t.el.querySelectorAll('.nav')].filter(b => !b.disabled && b.getClientRects().length > 0) : []; },
    // o：{ onCancel, onFocus, linear, keys: { 动作名: fn（返回 false = 没处理，走默认）}, hints: [[键, 文字], …] 或返回它的函数 }
    push(el, onCancel, onFocus, linear, o) {
      const e = Object.assign({ el, onCancel, onFocus, f: null, linear: !!linear, keys: null, hints: null }, o || {});
      this.stack.push(e); const it = this.items(); if (it.length) this.focus(it[0]); Kit.paintHints(); return e;
    },
    pop(el) { const i = this.stack.findIndex(s => s.el === el); if (i >= 0) this.stack.splice(i, 1); Kit.paintHints(); },
    focus(b) {
      const t = this.top(); if (!t || !b || !t.el.contains(b)) return;
      if (t.f === b && b.classList.contains('focus')) return;
      t.el.querySelectorAll('.nav.focus').forEach(x => x.classList.remove('focus'));
      b.classList.add('focus'); t.f = b;
      if (b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (t.onFocus) t.onFocus(b);
    },
    move(dir) {
      const t = this.top(), it = this.items(); if (!it.length) return;
      if (!t.f || !it.includes(t.f)) return this.focus(it[0]);
      if (t.linear) { const n = it[(it.indexOf(t.f) + (dir === 'down' || dir === 'right' ? 1 : -1) + it.length) % it.length]; if (n && n !== t.f) { this.focus(n); Kit.sfx.tick(); } return; } // 首尾相接
      const r = t.f.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, hz = dir === 'left' || dir === 'right';
      let best = null, bs = Infinity;
      for (const pass of [0, 1, 2]) {
        for (const b of it) {
          if (b === t.f) continue;
          const q = b.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy;
          const pri = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
          const sec = hz ? Math.max(0, Math.abs(dy) - (q.height + r.height) / 2) : Math.max(0, Math.abs(dx) - (q.width + r.width) / 2);
          if (pri < 4) continue;
          let sc;
          if (pass === 0) {
            const ahead = dir === 'left' ? q.right <= r.left + 2 : dir === 'right' ? q.left >= r.right - 2 : dir === 'up' ? q.bottom <= r.top + 2 : q.top >= r.bottom - 2;
            const lap = hz ? Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) : Math.min(q.right, r.right) - Math.max(q.left, r.left);
            if (!ahead || lap < Math.min(hz ? q.height : q.width, hz ? r.height : r.width) * 0.5) continue;
            sc = pri + (hz ? Math.abs(dy) : Math.abs(dx)) * 0.3;
          } else if (pass === 1) { if (sec > pri * 2.5 + 30) continue; sc = pri + sec * 2.5 + (hz ? Math.abs(dy) : Math.abs(dx)) * 0.02; }
          else sc = pri * 4 + sec;
          if (sc < bs) { bs = sc; best = b; }
        }
        if (best) break;
      }
      if (!best) { // 到头了：绕回另一头
        let far = 0;
        for (const b of it) {
          if (b === t.f) continue;
          const q = b.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy, back = dir === 'left' ? dx : dir === 'right' ? -dx : dir === 'up' ? dy : -dy;
          const lap = hz ? Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top) : Math.min(q.right, r.right) - Math.max(q.left, r.left);
          if (back < 4 || lap < Math.min(hz ? q.height : q.width, hz ? r.height : r.width) * 0.5) continue;
          if (back > far) { far = back; best = b; }
        }
      }
      if (best) { this.focus(best); Kit.sfx.tick(); }
    },
    ok() { const t = this.top(); if (t && t.f && !t.f.disabled) { tapWas = t.f; t.f.click(); } },
    cancel() { const t = this.top(); if (t && t.onCancel) t.onCancel(); },
    // 一次输入交给栈顶的页面：页面自己接了（keys）就算数，否则走默认的移动 / 确定 / 取消。返回是否有页面在
    act(a) {
      const t = this.top(); if (!t) return false;
      if (t.keys && t.keys[a] && t.keys[a]() !== false) return true;
      const f = t.f;
      if ((a === 'left' || a === 'right') && f && f._lr && !f.disabled) { f._lr(a === 'left' ? -1 : 1); return true; }
      if (a === 'pgup' || a === 'pgdn') { Kit.scrollPanel(a === 'pgup' ? -0.8 : 0.8); return true; }
      if (a === 'up' || a === 'down' || a === 'left' || a === 'right') this.move(a); else if (a === 'ok') this.ok(); else if (a === 'cancel') this.cancel();
      return true;
    },
  };
  document.addEventListener('mouseover', e => { const b = e.target.closest && e.target.closest('.nav'); if (b && !b.disabled && Kit.dev === 'mouse') Nav.focus(b); });
  document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button')) e.preventDefault(); });
  // 触屏没有悬停：第一下只选中，第二下才确定
  let downEl = null, downTouch = false;      // 这一下手指按在哪个元素上（防“幽灵点击”用）
  document.addEventListener('pointerdown', e => {
    downEl = e.target; downTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    Kit.setDev(e.pointerType === 'touch' || e.pointerType === 'pen' ? 'touch' : 'mouse');
    const b = e.target.closest && e.target.closest('.nav'); tapWas = b && b.classList.contains('focus') ? b : null;
    if (b && !b.disabled) Nav.focus(b);
  }, true);
  document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && (e.movementX || e.movementY)) Kit.setDev('mouse'); }, true);
  document.addEventListener('click', e => {
    // 触屏的“幽灵点击”：手指在地图上点一下（松手时就打开了造兵列表、行动菜单……），浏览器随后补发的 click 会落到刚弹出来、正好在手指底下的按钮上。
    // 手指按下时不在这个按钮里 = 不是点它的，吞掉（按下的元素被重画掉了的不算）
    const hit = e.isTrusted && downTouch && e.target.closest && e.target.closest('.nav, [data-a], button');
    if (hit && downEl && downEl.isConnected && !hit.contains(downEl)) { e.stopPropagation(); e.preventDefault(); return; }
    const b = e.target.closest && e.target.closest('.nav');
    if (Kit.dev === 'touch' && b && b.dataset.tap2 != null && tapWas !== b) { e.stopPropagation(); e.preventDefault(); Kit.sfx.tick(); }
  }, true);

  // 触屏：在页面上左右一划 = 翻页（页面自己接了 左 / 右 就走它，否则走 LB / RB）
  let sw = null;
  document.addEventListener('touchstart', e => { const t = e.touches[0]; sw = e.touches.length === 1 && e.target.closest && e.target.closest('.scr') ? { x: t.clientX, y: t.clientY, t: performance.now() } : null; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!sw) return; const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y, quick = performance.now() - sw.t < 600; sw = null;
    if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const top = Nav.top(); if (!top || !top.keys) return;
    const a = dx < 0 ? (top.keys.right ? 'right' : 'rb') : (top.keys.left ? 'left' : 'lb'); if (top.keys[a]) top.keys[a]();
  }, { passive: true });

  // ───────── 底部按键提示条 ─────────
  const CAP = {
    pad: { a: '<i class="kc a">A</i>', b: '<i class="kc b">B</i>', x: '<i class="kc x">X</i>', y: '<i class="kc y">Y</i>', lb: '<i class="kc sq">LB</i>', rb: '<i class="kc sq">RB</i>', start: '<i class="kc sq">☰</i>', sel: '<i class="kc sq">⧉</i>', dpad: '<i class="kc sq">✥</i>', lr: '<i class="kc sq">◀▶</i>', ud: '<i class="kc sq">▲▼</i>' },
  };
  // 键盘键帽上的字：画的时候再翻（回车、方向键）
  const KEYCAP = { a: '回车', b: 'Esc', x: 'F', y: 'M', lb: 'Q', rb: 'E', start: 'M', sel: 'N', dpad: '方向键', lr: '◀▶', ud: '▲▼' };
  const capsOf = dev => { if (dev === 'pad') return CAP.pad; const o = {}; for (const k in KEYCAP) o[k] = `<i class="kc key">${esc(Kit.t(KEYCAP[k]))}</i>`; return o; };
  const ACT = { a: 'ok', b: 'cancel', x: 'x', y: 'y', lb: 'lb', rb: 'rb', start: 'start', sel: 'mini', end: 'endturn', undo: 'undo' };
  // 鼠标直接点选项就行，这些“确定”类的提示不用再给一个按钮。表里存的是原文（词典的键）：判断在翻译之前、拿调用方传进来的原文比；
  // 调用方已经自己翻好再传的，再拿各项的译文比一次，所以哪种语言下行为都一样
  const GENERIC = ['确定', '选择', '查看', '选定', '生产', '研究', '查看指挥官'], SKIPLR = ['改', '换人', '选择'];
  const isGeneric = text => GENERIC.includes(text) || (Kit.lang() !== ZH && GENERIC.some(g => Kit.t(g) === text));
  let baseHints = [], hintKey = '';
  Kit.setHints = list => { baseHints = list || []; Kit.paintHints(); };
  Kit.cap = k => Kit.ptr() ? '' : (capsOf(Kit.dev)[k] || '');
  // 提示条上沿离屏幕底边多远（--hintTop）：手机竖屏上提示条会折成两行，底部信息条按它让位，不叠在一起
  const markHints = () => { const bar = $('hints'); const off = !bar || bar.classList.contains('off'); const t = off ? 0 : Math.max(0, innerHeight - bar.getBoundingClientRect().top); document.documentElement.style.setProperty('--hintTop', Math.round(t) + 'px'); };
  addEventListener('resize', () => setTimeout(markHints, 60));
  Kit.paintHints = force => { const k0 = hintKey; paintHints0(force); if (force || hintKey !== k0) markHints(); };
  const paintHints0 = force => {
    const bar = $('hints'); if (!bar) return;
    const t = Nav.top(); let list = t ? (typeof t.hints === 'function' ? t.hints() : t.hints) : baseHints;
    list = (list || []).filter(Boolean);
    const key = Kit.dev + '|' + JSON.stringify(list) + (t && t.flow ? '|flow' : ''); if (key === hintKey && !force) return; hintKey = key;
    // 多步流程（开局向导、关前页……）：整条提示固定成同一个样子——左下角灰色的次级操作（上一步 / 返回），右下角金色的主操作（下一步 / 开始作战），
    // 其余操作排在中间。四种设备位置都一样；键盘、手柄带键帽，鼠标、触屏就是两个按钮
    const flow = !!(t && t.flow); bar.classList.toggle('flow', flow); document.body.classList.toggle('flow-on', flow);
    if (flow) {
      const ptr = Kit.ptr(), caps = ptr ? {} : capsOf(Kit.dev), txt = h => h[3] ? h[1] : Kit.t(h[1]), A = list.find(h => h[0] === 'a' && h[1]), B = list.find(h => h[0] === 'b' && h[1]);
      const mid = list.filter(h => h !== A && h !== B && h[1] && !(ptr && (h[2] || !ACT[h[0]] || isGeneric(h[1])))).map(h => h[0] === 'lbrb' && !ptr ? `<span class="h" data-a="rb">${caps.lb.replace('<i ', '<i data-a="lb" ')}${caps.rb}${esc(txt(h))}</span>` : `<span class="h${ptr ? ' bt' : ''}${h[2] ? ' off' : ''}" ${ACT[h[0]] ? `data-a="${ACT[h[0]]}"` : ''}>${caps[h[0]] || ''}${esc(txt(h))}</span>`).join('');
      bar.classList.remove('off', 'corner'); document.body.classList.add('hint-on');
      bar.innerHTML = (B ? `<span class="h fb" data-a="cancel">${caps.b || ''}${esc(txt(B))}</span>` : '<span class="fb0"></span>') + `<span class="mid">${mid}</span>` + (A ? `<span class="h fa${A[2] ? ' off' : ''}" data-a="ok">${caps.a || ''}${esc(txt(A))}</span>` : '<span class="fb0"></span>');
      return;
    }
    // 四套：键盘键帽、手柄键帽；鼠标和触屏不画键帽，能做的事直接是按钮（触屏的按钮更大）
    if (Kit.ptr()) {
      const btn = (a, t, cls) => `<span class="h bt ${cls || ''}" data-a="${a}">${esc(t)}</span>`, out = [];
      for (const [k, src, off, done] of list) {
        if (off || !src) continue;
        const text = done ? src : Kit.t(src);   // 提示文字在这里统一翻；第四项为真 = 调用方已经翻好
        if (k === 'undo') { out.push(btn('undo', text)); continue; }
        if (k === 'lr' || k === 'lbrb' || k === 'ud') continue;   // 翻页、换阵营、改值：画面上本身就有可点的箭头 / 页签 / 头像（触屏还能左右滑）
        if (k === 'lbrb' || k === 'lr') out.push(btn(k === 'lr' ? 'left' : 'lb', '‹', 'ar') + `<span class="lab">${esc(text)}</span>` + btn(k === 'lr' ? 'right' : 'rb', '›', 'ar'));
        else if (k === 'ud') out.push(btn('up', '▲', 'ar') + `<span class="lab">${esc(text)}</span>` + btn('down', '▼', 'ar'));
        else if (k === 'dpad' || k === '') { if (k === '') out.push(`<span class="lab">${esc(text)}</span>`); }
        else if (k === 'a' && Kit.dev === 'mouse' && isGeneric(src)) continue;
        else if (ACT[k]) out.push(btn(ACT[k], text));
      }
      bar.classList.toggle('off', !out.length); document.body.classList.toggle('hint-on', !!out.length); bar.classList.toggle('corner', !t);
      if (out.length) bar.innerHTML = out.join('');
      return;
    }
    const caps = capsOf(Kit.dev);
    bar.classList.toggle('off', !list.length); document.body.classList.toggle('hint-on', !!list.length); bar.classList.remove('corner');
    if (!list.length) return;                  // 淡出时留着原来的内容
    bar.innerHTML = list.map(([k, src, off, done], i) => {
      const sep = i ? '<span class="sep"></span>' : '', text = done ? src : Kit.t(src);
      // LB / RB 是一组：两个键帽并排，后面一个说明
      if (k === 'undo') return sep + `<span class="h" data-a="undo">${caps.b}${esc(text)}</span>`;
      if (k === 'lbrb') return sep + `<span class="h${off ? ' off' : ''}" data-a="rb">${caps.lb.replace('<i ', '<i data-a="lb" ')}${caps.rb}${esc(text)}</span>`;
      return sep + `<span class="h${off ? ' off' : ''}" ${ACT[k] ? `data-a="${ACT[k]}"` : ''}>${caps[k] || ''}${esc(text)}</span>`;
    }).join('');
  };
  Kit.note = (text, ms) => {
    let e = $('note'); if (e) e.remove(); if (!text) return;
    e = document.createElement('div'); e.id = 'note'; e.className = 'pn'; e.textContent = text; document.body.appendChild(e);
    const mine = e; setTimeout(() => { if (mine.parentNode) mine.remove(); }, ms || 1600);
  };
  Kit.noteText = () => { const e = $('note'); return e ? e.textContent : ''; };

  // ───────── 整屏页 ─────────
  // o：{ id, cls, html, dim, back（从左边滑入：返回上一步时用）, pop（缩放弹出）, onCancel, onFocus, linear, keys, hints }。返回 { el, close(), on }
  const screens = [];
  Kit.screen = o => {
    const el = document.createElement('div'); el.className = 'scr ' + (o.cls || '') + (o.dim ? ' dim' : '') + (o.back ? ' back' : '') + (o.pop ? ' pop' : '');
    if (o.id) { const old = $(o.id); if (old) old.remove(); el.id = o.id; }
    el.innerHTML = o.html || ''; document.body.appendChild(el);
    const scr = { el, on: true, o, close(silent) { if (!scr.on) return; scr.on = false; Nav.pop(el); el.remove(); const i = screens.indexOf(scr); if (i >= 0) screens.splice(i, 1); if (o.onClose && !silent) o.onClose(); } };
    screens.push(scr); Kit.hydrate(el);
    scr.nav = Nav.push(el, o.onCancel === undefined ? () => { Kit.sfx.back(); scr.close(); } : o.onCancel, o.onFocus, o.linear, { keys: o.keys, hints: o.hints, flow: !!o.flow });
    // 点在整屏页的空白处（压暗的那一层）= 取消
    const born = performance.now();   // 刚弹出来的半秒内不算（长按弹出详情卡，松手那一下落在空白处）
    if (o.dim) el.addEventListener('click', e => { if (e.target === el && performance.now() - born > 500 && Nav.top() && Nav.top().el === el) Nav.cancel(); });   // 用 click：在空白处滑动（翻页）不算
    return scr;
  };
  Kit.closeAll = () => { for (const s of screens.slice()) s.close(true); };
  Kit.screens = screens;

  // ───────── 可滚动面板的“还有内容”提示 ─────────
  Kit.cues = () => { document.querySelectorAll('.sc').forEach(e => { e.classList.toggle('more-up', e.scrollTop > 4); e.classList.toggle('more-dn', e.scrollTop + e.clientHeight < e.scrollHeight - 4); }); };
  // 滚栈顶页面里那块超出的详情面板。k：几页（0.8 = 大半页）；px 给了就按像素
  Kit.scrollPanel = (k, px) => { const t = Nav.top(); if (!t) return false; for (const e of t.el.querySelectorAll('.sc')) if (e.scrollHeight > e.clientHeight + 4) { e.scrollTop += px != null ? px : e.clientHeight * k; Kit.cues(); return true; } return false; };
  document.addEventListener('scroll', () => Kit.cues(), true); addEventListener('resize', () => setTimeout(Kit.cues, 50)); setInterval(() => { if (!document.hidden) Kit.cues(); }, 400);

  // ───────── 图标 ─────────
  // 有 ui-assets.js（图像模型画的那套）就用它，缺哪个用 ui-skin.js 里代码画的像素图标顶上，再没有就是一个字
  const ICFB = { coin: 'coin', sword: 'sword', shield: 'shield', boot: 'move', aim: 'aim', eye: 'eye', heart: 'heart', star: 'star', cap: 'flag', crate: 'crate', atk: 'sword' };
  const icCache = {};
  function icUrl(name) {
    if (name in icCache) return icCache[name];
    const A = root.AWUIAssets; let url = (A && A[name]) || '';
    if (!url && ICFB[name] && root.AWSkin) { try {
      const S = root.AWSkin, z = S.icSize(ICFB[name]), k = 6, cv = document.createElement('canvas'); cv.width = (z[0] + 2) * k; cv.height = (z[1] + 2) * k;
      const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.setTransform(k, 0, 0, k, k, k); S.icon(c, ICFB[name], 0, 0); url = cv.toDataURL();
    } catch (e) { url = ''; } }
    return (icCache[name] = url);
  }
  Kit.icUrl = icUrl;
  Kit.ic = (name, cls) => { const u = icUrl(name); return u ? `<i class="ic ${cls || ''}" style="background-image:url(${u})"></i>` : ''; };

  // ───────── 阵营色 ─────────
  const deep = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0'); return '#' + c(n >> 16 & 255) + c(n >> 8 & 255) + c(n & 255); };
  const PAL5 = { 5: { d: '#1a202c', m: '#2c3644', l: '#7f97a8', h: '#cfe6ee' } };   // 玄潮：带蓝的炭黑 + 冷青白（美术的调色板里有第五套时用它的）
  Kit.pal = p => { const B = (Art.BPAL && Art.BPAL[p]) || PAL5[p] || (Art.BPAL && Art.BPAL[0]) || { d: '#666', m: '#888', l: '#aaa', h: '#ddd' }; return { o: deep(B.d, 0.4), d: B.d, m: B.m, l: B.l, h: B.h }; };
  Kit.pcs = p => { const P = Kit.pal(p); return `--pc:${P.m};--pcd:${P.d};--pcl:${P.h}`; };
  Kit.pname = p => (D.PLAYERS && D.PLAYERS[p]) || Kit.t('阵营 {n}', { n: p });
  Kit.fname = f => (D.FACTIONS && D.FACTIONS[f] && D.FACTIONS[f].name) || Kit.pname(f);
  Kit.emblem = (f, cls) => Kit.ic('f' + f, cls) || `<i class="ic ${cls || ''}" style="background:${Kit.pal(f).m};border-radius:50%"></i>`;

  // ───────── 画布占位符：写 HTML 时放 <canvas class="uc" data-u="tnk" data-o="1" data-px="96">，插进页面后 hydrate 统一画 ─────────
  Kit.unit = (type, owner, px, extra) => `<canvas class="uc" data-u="${type}" data-o="${owner || 0}" data-px="${px || 64}" ${extra || ''}></canvas>`;
  Kit.terr = (t, owner, px, xy) => `<canvas class="tc" data-t="${t}" data-o="${owner || 0}" data-px="${px || 96}" ${xy ? `data-xy="${xy[0]},${xy[1]}"` : ''}></canvas>`;
  // 指挥官所属阵营和头像底色的阵营（席位的阵营）不一致时，头像右下角加一个所属阵营的小徽记（例：苍蓝席位上的翠林指挥官青禾）
  Kit.coBadge = (id, p) => { const c = (D.COS || []).find(q => q.id === id), f = c && c.faction; return f && p >= 1 && D.FACTIONS && D.FACTIONS[p] && f !== p ? `<i class="cofb" style="background-image:url(${icUrl('f' + f)})"></i>` : ''; };
  Kit.head = (id, p, px, mood) => `<span class="hd" data-co="${esc(id)}" data-mood="${mood || 'normal'}" style="${Kit.pcs(p)};${px ? `width:calc(${px} * var(--r));height:calc(${px} * var(--r))` : ''}">${Kit.coBadge(id, p)}</span>`;
  Kit.port = (id, mood, style) => `<img class="pt" data-co="${esc(id)}" data-mood="${mood || 'normal'}" alt="" style="${style || ''}">`;
  const PT = () => root.AWPortraits || null;
  // big = 大立绘用高清图（AWPortraits.hi），小头像用缩略图（get）
  function portSrc(id, mood, cb, n, big) {
    const A = PT(); if (!A) { if ((n || 0) < 120) setTimeout(() => portSrc(id, mood, cb, (n || 0) + 1, big), 100); else cb(''); return; }   // portraits.js 排在最后加载
    if (!(A.ids || []).includes(id)) return cb('');
    let im = null; try { im = big && A.hi ? (A.hi(id, mood) || A.get(id, mood)) : A.get(id, mood); } catch (e) { }
    if (im) return cb(im.src);
    // 按需加载的立绘（portraits-lazy.js）：直接把地址交出去，图自己慢慢到。大立绘先垫上小图，高清的到了再换
    if (A.src && A.own && A.own(id)) {
      const u = A.src(id, mood, !!big); if (!u) return cb('');
      if (!big) return cb(u);
      const t = A.src(id, mood, false); if (t && t !== u) cb(t);
      if (A.when) A.when(id, mood, true, () => cb(u)); else cb(u);
      return;
    }
    if ((n || 0) < 40) setTimeout(() => portSrc(id, mood, cb, (n || 0) + 1, big), 80); else cb('');
  }
  Kit.liveState = null;                       // ui.js 给：对局里的 S（地形小图按真实格子画）
  function paintUnit(cv, frame) {
    const px = +cv.dataset.px || 64, dpr = root.devicePixelRatio || 1, size = Math.max(8, Math.round(px * Kit.s * dpr));
    let sp = null; try { sp = Art.unit(cv.dataset.u, +cv.dataset.o || 0, cv.dataset.dim === '1', size, frame || 0); } catch (e) { }
    if (!sp) return;
    if (cv.width !== sp.width || cv.height !== sp.height) { cv.width = sp.width; cv.height = sp.height; }
    cv.style.width = (px * Kit.s) + 'px'; cv.style.height = (px * Kit.s * sp.height / sp.width) + 'px';
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(sp, 0, 0);
  }
  // 一格地形：32×48 的点阵（上面 16 是探出格子的部分）。有 data-xy 就画对局里那一格，否则摆一个 3×3 的小场景画中间那格
  function terrState(t, owner) {
    const T = D.TERRAIN, P = 'plain', S = 'sea', g = (a, b, c) => [a, b, c];
    let m = [g(P, P, P), g(P, t, P), g(P, P, P)];
    if (t === 'sea' || t === 'reef') m = [g(S, S, S), g(S, t, S), g(S, S, S)];
    else if (t === 'road' || t === 'river') m = [g(P, P, P), g(t, t, t), g(P, P, P)];
    else if (t === 'bridge') m = [g(P, 'river', P), g('road', t, 'road'), g(P, 'river', P)];
    else if (t === 'beach' || t === 'port') m = [g(S, S, S), g(P, t, P), g(P, P, P)];
    m = m.map(r => r.map(x => (T[x] ? x : t)));
    return { map: { w: 3, h: 3, t: m, owner: [[0, 0, 0], [0, owner || 0, 0], [0, 0, 0]], cap: [[20, 20, 20], [20, 20, 20], [20, 20, 20]] } };
  }
  // 高出格子的地形（建筑、树、山）连上面探出去的部分一起画；平的地形只取格子本身（正方形）
  const TALL = { forest: 1, mountain: 1, silo: 1, silo_used: 1, wall: 1 };
  function paintTerr(cv, frame) {
    const tile = Art.TILE || 32, top = Art.TOP == null ? 16 : Art.TOP, px = +cv.dataset.px || 96, t = cv.dataset.t, xy = cv.dataset.xy;
    const tall = (D.TERRAIN[t] && D.TERRAIN[t].prop) || TALL[t], cut = tall ? 0 : top;
    const tmp = document.createElement('canvas'); tmp.width = tile; tmp.height = tile + top;
    const c = tmp.getContext('2d'); c.save(); c.translate(0, top); c.scale(tile, tile);
    try {
      const TL = root.AWTiles;   // 图鉴里的建筑图标统一从新素材取（AWTiles.canvas，按阵营换色）
      if (tall && D.TERRAIN[t].prop && TL && TL.canvas && (!TL.has || TL.has(t))) { const im = TL.canvas(t, +cv.dataset.o || 0); if (im) { c.restore(); c.save(); c.imageSmoothingEnabled = false; const k = Math.min(tile / im.width, (tile + top) / im.height); c.drawImage(im, (tile - im.width * k) / 2, tile + top - im.height * k, im.width * k, im.height * k); c.restore(); c.save(); } else Art.terrain(c, terrState(t, +cv.dataset.o || 0), 1, 1, frame || 0); }
      else if (xy && Kit.liveState) { const [x, y] = xy.split(',').map(Number); Art.terrain(c, Kit.liveState, x, y, frame || 0); }
      else Art.terrain(c, terrState(t, +cv.dataset.o || 0), 1, 1, frame || 0);
    } catch (e) { c.fillStyle = '#5a5a78'; c.fillRect(0, 0, 1, 1); }
    c.restore();
    cv.width = tile; cv.height = tile + top - cut; cv.style.width = (px * Kit.s) + 'px'; cv.style.height = (px * Kit.s * cv.height / tile) + 'px';
    cv.getContext('2d').drawImage(tmp, 0, -cut);
  }
  Kit.hydrate = scope => {
    scope = scope || document;
    setTimeout(Kit.cues, 0);
    scope.querySelectorAll('canvas.uc').forEach(cv => paintUnit(cv, 0));
    scope.querySelectorAll('canvas.tc').forEach(cv => paintTerr(cv, 0));
    scope.querySelectorAll('.hd[data-co]').forEach(e => { if (e._co === e.dataset.co + e.dataset.mood) return; e._co = e.dataset.co + e.dataset.mood; portSrc(e.dataset.co, e.dataset.mood, src => { if (src) e.style.backgroundImage = `url(${src})`; else if (!e.textContent) { e.style.display = 'inline-flex'; e.style.alignItems = 'center'; e.style.justifyContent = 'center'; e.textContent = e.dataset.co === 'rand' ? '?' : ''; } }); });
    scope.querySelectorAll('img.pt[data-co]').forEach(e => { if (e._co === e.dataset.co + e.dataset.mood) return; e._co = e.dataset.co + e.dataset.mood; portSrc(e.dataset.co, e.dataset.mood, src => { if (src) e.src = src; }, 0, true); });
  };
  // 待机动画：带 data-anim 的单位小图两帧来回
  setInterval(() => { if (document.hidden) return; const f = Math.floor(performance.now() / 450) & 1; document.querySelectorAll('canvas.uc[data-anim]').forEach(cv => paintUnit(cv, f)); }, 450);

  // ───────── 小部件 ─────────
  // 陨星强化给这个兵种什么：按核心的 C.oreEffects 逐项列（图标 + 现成的短句）；核心没有这个接口时退回“攻击、防御”
  const OREIC = { atk: 'sword', def: 'shield', heal: 'heart', repair: 'fix', move: 'boot' };
  Kit.oreFx = type => { const C = root.AWCore, D = root.AWData, R = D && D.RES; if (!R) return []; let l = null; try { l = C.oreEffects ? C.oreEffects(type) : null; } catch (e) { }
    if (!l) { const pc = v => Math.round((v || 0) * 100); l = [{ kind: 'atk', text: Kit.t('攻击 +{n}%', { n: pc(R.atk) }) }, { kind: 'def', text: Kit.t('防御 +{n}%', { n: pc(R.def) }) }]; }
    return l.map(e => ({ kind: e.kind, value: e.value, text: e.text, icon: OREIC[e.kind] || 'ore' })); };
  Kit.oreChips = type => Kit.oreFx(type).map(e => Kit.chip(Kit.ic(e.icon, 's'), e.text, '', 'good')).join('');
  Kit.chip = (icon, label, val, tone) => `<span class="chip ${tone || ''}">${icon || ''}${esc(label)}${val != null && val !== '' ? ` <b>${esc(val)}</b>` : ''}</span>`;
  Kit.tile = (val, label, icon) => `<div class="tile"><b>${icon || ''}${val}</b><span>${esc(label)}</span></div>`;
  Kit.stars = (n, max) => `<span class="stars">${'★'.repeat(n)}${max ? `<i>${'★'.repeat(Math.max(0, max - n))}</i>` : ''}</span>`;
  Kit.bar = (frac, cls) => `<span class="bar ${cls || ''}${frac >= 1 ? ' full' : ''}"><i style="width:calc(${Math.round(Math.max(0, Math.min(1, frac)) * 100)}% - ${frac > 0 ? 6 : 0} * var(--r))"></i></span>`;
  Kit.steps = (names, cur) => `<div class="steps">${names.map((n, i) => `${i ? '<i>›</i>' : ''}<span class="step${i === cur ? ' on' : i < cur ? ' done' : ''}">${i < names.length - 1 ? `<b>${i < cur ? '✓' : i + 1}</b>` : ''}<span class="sn">${esc(n)}</span></span>`).join('')}</div>`;
  const pct = v => (v > 0 ? '+' : '−') + Math.round(Math.abs(v) * 100) + '%';
  Kit.pct = pct;
  // 把一句话截成不超过 n 个字的一句（取第一句；还长就截断加省略号）
  // 说明文字一律完整显示，不截断、不加省略号（保留这个函数名给各处调用）
  Kit.short = t => String(t || '').trim();
  // 把长文字按句子切成每页不超过 n 个字的几页
  Kit.pages = (t, n) => {
    const zh = Kit.lang() === ZH, parts = zh ? (String(t || '').match(/[^。！？；]+[。！？；]?/g) || []) : cutText(t, true), out = []; let cur = '';
    // 其他语言：一页的字数上限按这种语言比中文长多少放宽（AWI18n.info().wide）
    let max = n || 96; if (!zh) { try { max = Math.round(max * (root.AWI18n.info().wide || 1)); } catch (e) { } }
    for (const p of parts) { if (cur && [...(cur + p)].length > max) { out.push(zh ? cur : cur.trim()); cur = ''; } cur += p; }
    if (cur) out.push(zh ? cur : cur.trim()); return out.length ? out : [''];
  };

  // ───────── 兵种类别 ─────────
  const U = () => D.UNITS, ORDER = () => D.ORDER || Object.keys(D.UNITS);
  const isInf = k => { try { if (C.isInfantry) return !!C.isInfantry({ type: k }); } catch (e) { } const u = U()[k] || {}; return u.mt === 'foot' || u.mt === 'mech'; };
  const CLS = { all: ['全军', ''], inf: ['步兵类', 'inf'], vehicle: ['车辆', 'tnk'], direct: ['直射车辆', 'tnk'], indirect: ['远程单位', 'art'], tank: ['坦克', 'med'], tread: ['履带车辆', 'tnk'], land: ['陆上单位', 'tnk'], air: ['航空单位', 'atk'], heli: ['直升机', 'cop'], plane: ['固定翼', 'ftr'], ship: ['舰船', 'dst'], melee: ['直射单位', 'tnk'] };
  // 一组修正作用在谁身上：[名字（当前语言）, 代表兵种]。CLS 里存原文，这里（显示的时候）再翻
  const clsT = c => (c ? [Kit.t(c[0]), c[1]] : null);
  function clsOf(on) {
    if (Array.isArray(on)) { const k = on.filter(x => U()[x]); if (!k.length) return clsT(CLS[on[0]]) || ['', '']; return [k.length <= 2 ? Kit.join(k.map(x => U()[x].name)) : Kit.t('{name}等', { name: U()[k[0]].name }), k[0]]; }
    return clsT(CLS[on]) || [String(on || ''), ''];
  }
  // 指挥官（或阵营）的常驻修正 → 小牌子：[{ unit 代表兵种, who, label, val, tone, text }]，好的排前面
  // who、label、val 都已经是当前语言；text = “谁 + 哪一项”连成的整句（没有 who 时就是 label），不画代表兵种小图的地方用它，别自己拿 who + ' ' + label 拼
  Kit.modChips = (mods, rules) => {
    const out = [], add = (on, label, val, good) => { const c = clsOf(on); out.push({ unit: c[1], who: c[0], label, val, tone: good ? 'good' : 'bad', text: c[0] ? Kit.t('{who} {stat}', { who: c[0], stat: label }) : label }); };
    const T = Kit.t, place = k => (D.TERRAIN[k] || {}).name || k;
    for (const m of mods || []) {
      if (m.atk) add(m.on, T('攻击'), pct(m.atk), m.atk > 0); if (m.def) add(m.on, T('防御'), pct(m.def), m.def > 0);
      if (m.move) add(m.on, T('移动力'), (m.move > 0 ? '+' : '−') + Math.abs(m.move), m.move > 0); if (m.range) add(m.on, T('射程'), '+' + m.range, m.range > 0);
      if (m.vision) add(m.on, T('视野'), '+' + m.vision, m.vision > 0); if (m.cost) add(m.on, T('造价'), pct(m.cost), m.cost < 0);
      if (m.capture) add(m.on, T('占领值'), '×' + m.capture, m.capture > 1); if (m.hold) add(m.on, T('据守防御'), pct(m.hold), m.hold > 0);
      if (m.repair != null) add(m.on, T('修理费'), m.repair === 0 ? T('免费') : '×' + m.repair, m.repair < 1); if (m.carry) add(m.on, T('搭载数'), '+' + m.carry, true);
      if (m.vs) for (const k in m.vs) add(m.on, k === 'air' ? T('对空') : k === 'land' ? T('对地') : k === 'ship' ? T('对舰') : T('对{kind}', { kind: k }), pct(m.vs[k]), m.vs[k] > 0);
      if (m.defOn) { const ks = Object.keys(m.defOn).filter(k => m.defOn[k] > 0); if (ks.length) add(m.on, T('{place}防御', { place: ks[0] === 'prop' ? T('建筑') : place(ks[0]) }), pct(m.defOn[ks[0]]), true); }
      if (m.atkOn) { const ks = Object.keys(m.atkOn); if (ks.length) add(m.on, T('{place}攻击', { place: place(ks[0]) }), pct(m.atkOn[ks[0]]), m.atkOn[ks[0]] > 0); }
    }
    const R = rules || {}, flag = (label, val) => out.unshift({ unit: '', who: '', label, val: val || '', tone: 'good', text: label });
    if (R.luck) flag(T('运气'), T('{a} 至 +{b}', { a: R.luck[0], b: R.luck[1] })); if (R.freshBuild) flag(T('新生产单位当回合可行动')); if (R.hitRun) flag(T('攻击后可再次移动')); if (R.regen) flag(T('每回合恢复 HP'), '+' + R.regen / 10);
    if (R.firstCounter) flag(T('先手反击')); if (R.fullAtk) flag(T('攻击不随 HP 降低')); if (R.flatMove) flag(T('移动消耗都是 1')); if (R.stealth) flag(T('迷雾关闭时隐蔽')); if (R.capBonus) flag(T('占领奖金'), '+' + R.capBonus);
    if (R.cityBuild) flag(T('城市可生产步兵类单位')); if (R.moveFire) flag(T('移动后可攻击')); if (R.subSneak) flag(T('潜艇仅相邻时可被发现'));
    return out.sort((a, b) => (a.tone === 'good' ? 0 : 1) - (b.tone === 'good' ? 0 : 1));
  };
  Kit.modChipsHtml = (mods, rules, owner, max) => {
    const all = Kit.modChips(mods, rules), list = max ? all.slice(0, max) : all;   // 默认全部列出，不折叠
    return list.map(c => Kit.chip(c.unit ? Kit.unit(c.unit, owner, 44) : '', c.unit ? c.label : c.text, c.val, c.tone)).join('') + (all.length > list.length ? `<span class="chip mut">+${all.length - list.length}</span>` : '');
  };

  // ───────── 单位卡（对局详情、造兵菜单、图鉴兵种页共用）─────────
  const dmg = (a, d) => { const r = D.DMG && D.DMG[a]; return r && r[d] != null ? r[d] : null; };
  const catCls = k => { const u = U()[k] || {}; return u.air ? 'air' : u.ship ? 'sea' : ''; };
  Kit.catCls = catCls;
  Kit.rangeText = u => !u.range ? '—' : u.range[1] <= 1 ? '1' : u.range[0] + '–' + u.range[1];
  Kit.unitTags = k => {
    const u = U()[k] || {}, out = [];
    if (u.cap) out.push(Kit.t('可占领')); if (u.carry) out.push(u.carry.kind === 'ground' ? Kit.t('搭载 {n} 个陆上单位', { n: u.carry.n }) : Kit.t('搭载 {n} 个步兵类单位', { n: u.carry.n }));
    if (u.range && u.range[1] > 1) out.push(u.lob ? Kit.t('移动后可攻击') : Kit.t('移动后不可攻击')); if (!u.range) out.push(Kit.t('无武装'));
    if (u.cover === 0.5) out.push(Kit.t('目标地形防御减半')); else if (u.cover === 0) out.push(Kit.t('无视地形防御')); if (u.reveal) out.push(Kit.t('可发现隐蔽单位'));
    return out;
  };
  // 擅长打 / 害怕：按基础伤害排；present（场上出现的兵种）排前面。返回 [[兵种, 百分比, 是否在场], …]
  Kit.matchups = (k, n, present) => {
    const all = ORDER(), pr = present || new Set(), rank = (list) => list.sort((a, b) => (pr.has(b[0]) ? 1 : 0) - (pr.has(a[0]) ? 1 : 0) || b[1] - a[1]).slice(0, n).map(x => [x[0], x[1], pr.has(x[0])]);
    const good = rank(all.map(t => [t, dmg(k, t)]).filter(x => x[1] != null && x[1] >= 55));
    const bad = rank(all.map(t => [t, dmg(t, k)]).filter(x => x[1] != null && x[1] >= 55));
    return { good, bad };
  };
  const vsRow = (list, owner, cls) => list.length ? `<div class="vs">${list.map(([t, v, here]) => `<span class="v1 ${cls}${here ? ' here' : ''}" data-gou="${t}">${Kit.unit(t, owner, 64)}${v}%</span>`).join('')}</div>` : `<span class="mut t-s">${esc(Kit.t('无'))}</span>`;
  // o：{ owner, compact（造兵菜单右侧：擅长 / 害怕各三个）, unit（场上的那个单位：带 HP、星级、当前加成）, S, cost, mods（C.coMods 的结果）, present }
  Kit.unitCard = (k, o) => {
    o = o || {};
    const u = U()[k]; if (!u) return '';
    const own = o.owner || (o.unit && o.unit.owner) || 1, n = o.compact ? 3 : 5, mu = Kit.matchups(k, n, o.present), md = o.mods || {};
    const mv = u.move + (+md.move || 0), rb = +md.range || 0, vb = +md.vision || 0, cost = o.cost != null ? o.cost : u.cost;
    const rg = !u.range ? '—' : (u.range[1] + rb) <= 1 ? '1' : u.range[0] + '–' + (u.range[1] + rb);
    const arrow = v => v > 0 ? '<span class="good">▲</span>' : v < 0 ? '<span class="bad">▼</span>' : '';
    const q = o.unit, hp = q && C.dispHp ? C.dispHp(q) : null;
    const tags = Kit.unitTags(k).concat(o.tags || []);
    return `<div class="ucard${o.compact ? ' compact' : ''}" style="${Kit.pcs(own)}"><div class="hdx"><div class="pic ${catCls(k)}">${Kit.unit(k, own, o.compact ? 150 : 200, 'data-anim')}</div><div>` +
      `<div class="nm">${esc(u.name)}</div><div class="sub">${q ? `<span class="own">${esc(Kit.pname(own))}</span>${Kit.ic('heart', 's')}<b class="${hp <= 3 ? 'bad' : ''}">${hp}</b>${q.stars ? Kit.stars(q.stars) : ''}` : esc(u.air ? Kit.t('航空单位') : u.ship ? Kit.t('舰船') : Kit.t('陆上单位'))}</div>` +
      `<div class="tiles" style="margin-top:calc(14 * var(--r))">${Kit.tile(mv + arrow(+md.move || 0), Kit.t('移动力'), Kit.ic('boot', 's'))}${Kit.tile(rg + arrow(rb), Kit.t('射程'), Kit.ic('aim', 's'))}${Kit.tile((u.vision || 0) + vb + arrow(vb), Kit.t('视野'), Kit.ic('eye', 's'))}${Kit.tile(cost + (cost !== u.cost ? arrow(u.cost - cost) : ''), Kit.t('造价'), Kit.ic('coin', 's'))}${(o.ore != null ? o.ore : (D.RES && u.ore) || 0) ? Kit.tile(o.ore != null ? o.ore : u.ore, D.RES.short, Kit.ic('ore', 's')) : ''}</div></div></div>` +
      `<div class="ds">${esc(u.desc || '')}</div>` +
      (tags.length || o.buffs ? `<div class="chips">${o.buffs || ''}${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '') +
      `<h4><span class="good">▲</span>${esc(Kit.t('擅长攻击'))}</h4>${vsRow(mu.good, own === 1 ? 2 : 1, 'g')}<h4><span class="bad">▼</span>${esc(Kit.t('不敌'))}</h4>${vsRow(mu.bad, own === 1 ? 2 : 1, 'r')}</div>`;
  };
  // 克制小标：基础伤害 ≥ 70 克制，≤ 25 吃亏，其余一般。返回 [原文标签, 类别 good / bad / mut, 符号]：
  // 第一项是原文（词典的键），显示时 Kit.t(e[0])；要判断克制还是劣势，比第二项，别比第一项的文字
  Kit.edge = (a, d) => { const v = dmg(a, d); return v == null ? null : v >= 70 ? ['克制', 'good', '▲'] : v <= 25 ? ['劣势', 'bad', '▼'] : ['一般', 'mut', '●']; };

  // ───────── 地形 / 建筑卡 ─────────
  // 移动类型：[类型, 名字（场合 move）, 代表兵种]。显示的时候现取
  const MTS = () => [['foot', Kit.t('步兵', null, 'move'), 'inf'], ['tread', Kit.t('履带', null, 'move'), 'tnk'], ['wheel', Kit.t('轮式', null, 'move'), 'rec'], ['ship', Kit.t('舰船', null, 'move'), 'dst'], ['air', Kit.t('航空', null, 'move'), 'atk']];
  Kit.moveCost = (mt, t) => {
    const rep = ORDER().find(k => U()[k].mt === mt) || (mt === 'air' ? ORDER().find(k => U()[k].air) : null);
    if (C.moveCost && rep) { try { return C.moveCost({ type: rep }, t) || 0; } catch (e) { } }
    const R = rep ? U()[rep] : {}; if (R.air) return 1; if (R.ship) return ((D.MOVE || {}).ship || {})[t] || 0; if (D.TERRAIN[t].prop) return 1; return ((D.MOVE || {})[mt] || {})[t] || 0;
  };
  Kit.terrNote = (t, income) => {
    const T = D.TERRAIN[t] || {}; if (T.note) return T.note;
    if (T.prop && T.income) return Kit.t('每回合提供 {n} 资金。', { n: income || T.income });
    const s = ({ plain: '开阔地形，陆上单位都能进入，地形防御 1 星。', road: '陆上单位的移动消耗都是 1，没有地形防御。', bridge: '跨越河流的道路，陆上单位的移动消耗都是 1，没有地形防御。', river: '徒步的步兵类单位可以进入，车辆和摩托兵不能进入。', sea: '只有舰船和航空单位可以进入。', ruins: '地形防御 2 星，车辆的移动消耗是 2。' })[t];
    return s ? Kit.t(s) : '';
  };
  // 建筑的区域效果（数据里的 aura：{ r 范围, atk / def 增减 }，字段没有就不显示）
  const auraTiles = T => { const a = T && T.aura; if (!a || typeof a !== 'object') return ''; const r = a.r != null ? a.r : a.range; return (r != null ? Kit.tile(r, Kit.t('作用范围')) : '') + (a.atk ? Kit.tile(pct(a.atk), Kit.t('范围内攻击'), Kit.ic('sword', 's')) : '') + (a.def ? Kit.tile(pct(a.def), Kit.t('范围内防御'), Kit.ic('shield', 's')) : ''); };
  // o：{ owner, xy（对局里的格子）, cap（占领值，20 满）, capBy, income, S }
  Kit.terrCard = (t, o) => {
    o = o || {};
    const T = D.TERRAIN[t]; if (!T) return '';
    const own = o.owner || 0, made = ORDER().filter(k => U()[k].from === t), fix = t === 'airport' ? Kit.t('航空单位') : t === 'port' ? Kit.t('舰船') : (t === 'hq' || t === 'city' || t === 'factory') ? Kit.t('陆上单位') : '';
    const inc = o.income != null ? o.income : (T.income || 0), note = Kit.terrNote(t, inc);
    // 说明里已经讲过修理 / 恢复的就不再补一句：按数据里的原文判断（T.note 在别的语言下已经换成译文了），代码拼出来的那几句都不含这层意思
    const I = root.AWI18n, zhNote = T.note ? String((I && I.zh ? I.zh(T, 'note') : T.note) || '') : '', healed = /修|恢复/.test(zhNote);
    return `<div class="ucard" style="${Kit.pcs(own)}"><div class="hdx"><div class="pic" style="background:var(--bg2)">${Kit.terr(t, own, 150, o.xy)}</div><div>` +
      `<div class="nm">${esc(T.name)}</div><div class="sub">${T.prop ? `<span class="own">${own ? esc(Kit.pname(own)) : esc(Kit.t('中立'))}</span>` : esc(Kit.t('地形'))}</div>` +
      `<div class="tiles" style="margin-top:calc(14 * var(--r))">${Kit.tile(T.def ? Kit.stars(T.def) : '—', Kit.t('地形防御'))}${T.prop && inc ? Kit.tile('+' + inc, Kit.t('每回合收入'), Kit.ic('coin', 's')) : ''}${auraTiles(T)}${T.prop ? Kit.tile(o.cap != null && o.cap < 20 ? o.cap + '/20' : '20/20', Kit.t('占领值'), Kit.ic('cap', 's')) : ''}</div></div></div>` +
      `<div class="ds">${esc(note)}${fix && !healed ? ' ' + esc(Kit.t('停留的己方{kind}每回合恢复 2 HP（需支付资金）。', { kind: fix })) : ''}${(t === 'hq' || t === 'lab') && C.techLines ? ' ' + esc(Kit.t('可以在这里研究科技。')) : ''}</div>` +
      `<h4>${esc(Kit.t('移动消耗'))}</h4><div class="who">${MTS().map(([mt, name, rep]) => { const c = Kit.moveCost(mt, t); return `<span class="w1${c ? '' : ' no'}">${Kit.unit(rep, own || 1, 60)}${c ? c : '✕'}<small>${esc(name)}</small></span>`; }).join('')}</div>` +
      (made.length ? `<h4>${esc(Kit.t('可生产单位'))}</h4><div class="vs mk">${made.map(k => `<span class="v1" data-gou="${k}">${Kit.unit(k, own || 1, 46)}</span>`).join('')}</div>` : '') + `</div>`;
  };

  // ───────── 详情翻页卡：标题 + 几页大字，左右翻页 ─────────
  // pages：[{ title?, html }]。返回 screen
  Kit.pager = (title, pages, o) => {
    o = o || {}; let i = Math.max(0, Math.min(pages.length - 1, o.at || 0));
    const scr = Kit.screen({
      cls: 'pg', dim: true, pop: true, html: `<div class="pager pn"></div>`, onClose: o.onClose,
      keys: { left: () => go(-1), right: () => go(1), lb: () => go(-1), rb: () => go(1), ok: () => { Kit.sfx.back(); scr.close(); }, x: () => { Kit.sfx.back(); scr.close(); } },
      hints: () => [pages.length > 1 && ['lr', '翻页'], ['b', '关闭']],
    });
    const box = scr.el.firstChild;
    function paint() {
      const p = pages[i];
      box.innerHTML = `<h2>${esc(title)}${p.title ? `<small>${esc(p.title)}</small>` : ''}</h2><div class="pg sc">${p.html}</div>` + (pages.length > 1 ? `<div class="dots">${pages.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><span class="side l">‹</span><span class="side r">›</span>` : '');
      box.style.position = 'relative'; Kit.hydrate(box);
      box.querySelectorAll('.side').forEach(s => { s.onclick = () => go(s.classList.contains('l') ? -1 : 1); });
      // 页里带 data-go 的词（人物关系里的人名）：点了关掉这张卡，交给 o.onGo 跳过去
      box.querySelectorAll('[data-go]').forEach(a => { a.style.cursor = 'pointer'; a.onclick = e => { e.stopPropagation(); if (!o.onGo) return; Kit.sfx.ok(); scr.close(); o.onGo(a.dataset.go); }; });
    }
    function go(d) { if (pages.length < 2) return; i = (i + d + pages.length) % pages.length; Kit.sfx.tick(); paint(); }
    paint(); return scr;
  };

  // ───────── 竖排设置列表：一行一项，上下选、左右改值；右边说明区 ─────────
  // rows：[{ k, label, choices: [[值, 文字]], get, set, desc } 或 { k, label, action, right, desc }]
  Kit.optList = (host, rows, descEl) => {
    host.innerHTML = '';
    for (const r of rows) {
      const b = document.createElement('div'); b.className = 'nav orow'; b.dataset.k = r.k || '';
      const sync = () => { const c = r.choices && r.choices.find(q => q[0] === r.get()); b.innerHTML = `<span>${esc(r.label)}</span><span class="v">${r.choices ? `<i data-d="-1">◀</i>${esc(c ? c[1] : String(r.get()))}<i data-d="1">▶</i>` : esc(r.right || '')}</span>`; b.dataset.v = r.choices ? String(r.get()) : ''; };
      const step = d => { if (!r.choices) return; const i = r.choices.findIndex(q => q[0] === r.get()); r.set(r.choices[((i < 0 ? 0 : i) + d + r.choices.length) % r.choices.length][0]); Kit.sfx.tick(); sync(); if (r.after) r.after(); };
      b._lr = r.choices ? step : null; b._row = r; b._sync = sync;
      b.onclick = e => { const a = e.target.closest('i[data-d]'); if (r.action) { r.action(); return; } step(a ? +a.dataset.d : 1); };
      sync(); host.appendChild(b);
    }
    return b => { if (descEl && b && b._row) descEl.innerHTML = `<h3>${esc(b._row.label)}</h3><p>${esc(typeof b._row.desc === 'function' ? b._row.desc() : b._row.desc || '')}</p>`; };
  };

  // 喇叭图标（开 / 关）
  Kit.spk = on => `<svg viewBox="0 0 24 24" fill="none" stroke="${on ? '#f4efe0' : '#8a93ad'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="${on ? '#f4efe0' : '#8a93ad'}"/>${on ? '<path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>' : '<path d="M17 9l5 6M22 9l-5 6" stroke="#e8573f"/>'}</svg>`;

  // ───────── 主机式整屏页（图鉴、设置、操作说明共用，版式照科技树）─────────
  // 一块带标题栏的大面板：标题栏（图标 + 金色标题 + 小牌子 + 右侧页签）/ 主体（左边竖排选择列 + 右边一次只看一样东西）。
  // 底部一律是流程式提示：右下金色主操作，左下灰色“返回”（见 tools/UI-PRIMARY.md）
  Kit.css(`
  .cs { background:#0a0e1a; padding:26r 32r 128r; align-items:stretch; } .cs::before { display:none; }
  .cs .cp { flex:1; min-height:0; display:flex; flex-direction:column; position:relative; }
  .cs .ch { flex:none; display:flex; align-items:center; gap:16r; min-height:84r; padding:0 150r 0 30r; font-size:max(22px,40r); font-weight:900; color:var(--gold); border-bottom:5r solid var(--line); white-space:nowrap; }
  .cs .ch > .ic { width:56r; height:56r; } .cs .ch .cc { color:var(--txt); font-size:max(20px,28r); padding:2r 18r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); }
  .cs .ch .cr { margin-left:auto; display:flex; align-items:center; gap:12r; font-size:max(20px,28r); color:var(--txt); min-width:0; }
  .cs .cb { flex:1; min-height:0; display:flex; position:relative; }
  .cs .cl { flex:none; width:430r; min-height:0; overflow:hidden auto; scrollbar-width:none; display:flex; flex-direction:column; gap:8r; padding:16r 22r 16r 26r; background:rgba(0,0,0,.22); border-right:5r solid var(--line); } .cs .cl::-webkit-scrollbar { display:none; }
  .cs .cm { flex:1; min-width:0; min-height:0; display:flex; flex-direction:column; padding:22r 40r 18r; gap:14r; position:relative; }
  .cs .cg { flex:none; margin-top:14r; font-size:max(20px,24r); font-weight:800; color:var(--pcl, var(--mut)); white-space:nowrap; } .cs .cg:first-child { margin-top:0; }
  .cit { flex:none; display:flex; align-items:center; gap:14r; min-height:max(48px,78r); padding:0 18r; border-left:10r solid var(--pc, #7f8db8); background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-size:max(22px,34r); font-weight:900; color:var(--txt); text-align:left; white-space:nowrap; overflow:hidden; }
  .cit > .ic, .cit > canvas, .cit > .hd { flex:none; width:56r; height:56r; } .cit b { flex:1; min-width:0; overflow:hidden; font-weight:900; } .cit small { flex:none; font-size:max(20px,24r); color:var(--mut); } .cit.focus small { color:var(--ink); } .cit.off { color:#7c849c; }
  .ctabs { display:flex; align-items:center; gap:8r; min-width:0; } .ctab { flex:none; display:flex; align-items:center; gap:10r; min-height:max(40px,60r); padding:0 24r; background:var(--bg2); color:var(--mut); font-size:max(20px,30r); font-weight:900; box-shadow:inset 0 0 0 3r var(--line); cursor:pointer; white-space:nowrap; }
  .ctab .ic { width:40r; height:40r; } .ctab.on { background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e); color:var(--ink); } .ctab.lock { color:#6f7892; }
  /* 长文本：上下滚动（方向键 / 右摇杆 / 滚轮 / 拖动），上下渐隐，右边一条细滚动条 */
  .ltw { position:relative; flex:1; min-height:0; display:flex; }
  .lt { flex:1; min-width:0; padding:6r 44r 40r 0; font-size:max(20px,32r); line-height:1.75; font-weight:700; --mt:#000; --mb:#000; -webkit-mask-image:linear-gradient(var(--mt), #000 80r, #000 calc(100% - 110r), var(--mb)); mask-image:linear-gradient(var(--mt), #000 80r, #000 calc(100% - 110r), var(--mb)); }
  .lt.more-up { --mt:transparent; } .lt.more-dn { --mb:transparent; } .lt.sc.more-dn::after, .lt.sc.more-up::before { display:none; }
  .lt h3 { margin:34r 0 6r; display:flex; align-items:center; gap:14r; font-size:max(22px,34r); font-weight:900; color:var(--gold); line-height:1.3; } .lt h3:first-child { margin-top:0; } .lt h3::before { content:""; flex:none; width:12r; height:34r; background:var(--pc, var(--gold)); box-shadow:0 0 0 3r var(--line); }
  .lt p { margin:0 0 14r; } .lt .q { color:var(--gold2); font-weight:900; }
  .ltbar { flex:none; width:10r; margin:8r 0 8r 6r; background:rgba(0,0,0,.35); box-shadow:inset 0 0 0 2r var(--line); position:relative; opacity:0; transition:opacity .2s; } .ltbar.on { opacity:1; } .ltbar u { position:absolute; left:0; right:0; min-height:30r; background:var(--gold); }
  /* 小锁（未解锁的阵营、兵种、档案）：跟着字号和文字颜色走 */
  .lkic { position:relative; display:inline-block; flex:none; width:.8em; height:.6em; margin:.45em .1em 0; background:currentColor; border-radius:.1em; vertical-align:baseline; } .lkic::before { content:""; position:absolute; left:16%; right:16%; bottom:92%; height:75%; border:.13em solid currentColor; border-bottom:0; border-radius:.4em .4em 0 0; }
  body.narrow .cs { padding:10r 10r max(74px,150r); } body.small:not(.narrow) .cs { padding:10r 20r 62px; }
  body.narrow .cs .cb { flex-direction:column; } body.narrow .cs .cl { width:auto; flex-direction:row; align-items:center; overflow:auto hidden; border-right:0; border-bottom:5r solid var(--line); padding:12r 14r; } body.narrow .cs .cg { margin:0 6r 0 14r; } body.narrow .cs .cg:first-child { margin-left:0; }
  body.narrow .cs .cm { padding:18r 20r 12r; } body.narrow .cs .ch { padding:0 120r 0 18r; flex-wrap:wrap; min-height:0; padding-top:10r; padding-bottom:10r; } body.narrow .cs .ch .cr { margin-left:0; flex:1 1 100%; overflow-x:auto; scrollbar-width:none; }
  body.small:not(.narrow) .cs .ch { min-height:0; height:auto; padding-top:4r; padding-bottom:4r; } body.small:not(.narrow) .cs .cm { padding:10r 30r 8r; }
  `);
  // 隐藏阵营（黑潮）的解锁条件：两组，走通一组就开放——战役（打败任意一位大将，逐位打勾）/ 自由对局（四国各赢电脑一局，四个徽记打勾）。
  // inf = AWCampaignRun.unlockInfo(f)；reasons 没有 kind 字段时退回逐条平铺
  Kit.css(`
  .ulk { display:flex; flex-direction:column; gap:8r; font-size:max(20px,28r); font-weight:800; line-height:1.35; } .ulk h5 { margin:10r 0 2r; font-size:max(20px,30r); font-weight:900; color:var(--gold); } .ulk h5:first-child { margin-top:0; } .ulk h5 small { display:block; font-size:max(20px,24r); font-weight:700; color:var(--mut); }
  .ulk .cond { display:flex; gap:14r; } .ulk .cond i { flex:none; width:1.3em; text-align:center; font-style:normal; color:#6f7892; } .ulk .cond.ok { color:#b6f08a; } .ulk .cond.ok i { color:#8fd45a; }
  .ulk .ulf { display:flex; flex-wrap:wrap; gap:16r; } .ulk .ulf span { display:flex; align-items:center; gap:8r; padding:6r 16r 6r 10r; background:rgba(0,0,0,.3); box-shadow:inset 0 0 0 3r var(--line); color:#6f7892; } .ulk .ulf .ic { width:56r; height:56r; opacity:.45; } .ulk .ulf i { font-style:normal; font-weight:900; } .ulk .ulf span.ok { color:#8fd45a; box-shadow:inset 0 0 0 3r #8fd45a; } .ulk .ulf span.ok .ic { opacity:1; }
  `);
  Kit.unlockHtml = (inf, f) => {
    const rs = (inf && inf.reasons) || [], boss = rs.filter(r => r.kind === 'boss'), free = rs.filter(r => r.kind === 'free'), T = Kit.t, name = Kit.fname(f || 5);
    const row = r => `<div class="cond${r.done ? ' ok' : ''}"><i>${r.done ? '✓' : '○'}</i><span>${esc(r.text)}</span></div>`;
    if (!boss.length && !free.length) return `<div class="ulk">${rs.map(row).join('')}</div>`;
    return `<div class="ulk">` + (boss.length ? `<h5>${esc(T('战役：击败任意一位{name}大将', { name }))}<small>${esc(T('通关下面任意一关，同时解锁这位指挥官。'))}</small></h5>${boss.map(row).join('')}` : '') +
      (free.length ? `<h5>${esc(T('自由对局：用四国各在一场对局中击败电脑（已完成 {a}/{b}）', { a: free.filter(r => r.done).length, b: free.length }))}<small>${esc(T('电脑要在普通难度以上。'))}</small></h5><div class="ulf">${free.map(r => `<span class="${r.done ? 'ok' : ''}" style="${Kit.pcs(r.faction)}">${Kit.emblem(r.faction)}${esc(Kit.fname(r.faction))}<i>${r.done ? '✓' : '○'}</i></span>`).join('')}</div>` : '') + `</div>`;
  };
  Kit.css(`
  .hd { position:relative; } .hd .cofb { position:absolute; right:-8%; bottom:-8%; width:42%; height:42%; min-width:22px; min-height:22px; background:#0e1220 center/78% no-repeat; border-radius:50%; box-shadow:0 0 0 2px var(--gold); pointer-events:none; }
  /* 主按钮：最宽约屏宽的四分之一，字多了先缩字（Kit.paintHints 之后量）、再不行换两行；高度不变，所以各页右下留的安全区对任何语言都够 */
  #hints.flow .fa { max-width:25vw; white-space:normal; line-height:1.05; text-align:center; overflow:hidden; } #hints.flow .fa .kc { flex:none; } #hints.flow .fb { max-width:22vw; white-space:normal; line-height:1.05; text-align:center; overflow:hidden; }
  body.narrow #hints.flow .fa { max-width:60vw; } body.narrow #hints.flow .fb { max-width:34vw; }
  #hints.flow .mid { overflow:hidden; max-height:max(52px,96r); }
  `);
  { const paint0 = Kit.paintHints; Kit.paintHints = force => { paint0(force); const bar = $('hints'); if (!bar || !bar.classList.contains('flow')) return;
    for (const e of bar.querySelectorAll('.fa, .fb')) { if (e._fit === e.textContent) continue; e._fit = e.textContent; e.style.fontSize = ''; const base = parseFloat(getComputedStyle(e).fontSize) || 0; let k = 1;
      const floor = document.body.classList.contains('small') ? 14 : 20;   // 缩字不低于界面的最小字号（桌面 20px、手机 14px）；还放不下就靠两行
      while ((e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && k > 0.74 && base * (k - 0.04) >= floor) { k -= 0.04; e.style.fontSize = (base * k) + 'px'; } } }; }
  // ───────── 斜切钢板菜单（标题画面用；回合菜单、暂停菜单以后也用这一套）─────────
  // 一摞斜放、沿斜线错开的钢板条：没选中的是暗色钢板 + 浅色字；选中的那条向外弹出，变成高饱和的红 + 白色粗体大字 + 黑描边，后面扫入一道金色色带。
  // Kit.slabMenu(host, items, o)：items = [{ id, label, sub, onPick }]；o = { deg 斜线角度（默认 13）, sound }。
  // 条目是 .nav.slab（方向键、鼠标、触屏照常走 Nav）；确定时整条闪白、沿斜线飞出，过 170 毫秒再调 onPick。返回 { el, items, focus(id) }
  Kit.css(`
  .slabs { display:flex; flex-direction:column; align-items:flex-start; gap:14r; --deg:13deg; --step:27r; }
  .slab { position:relative; flex:none; display:flex; flex-direction:column; justify-content:center; min-width:560r; max-width:100%; min-height:max(56px,104r); padding:6r 70r 6r 54r; margin-left:calc(var(--i) * var(--step) * -1); color:#d5dbee; text-align:left;
    background:linear-gradient(#3a4466, #252d45 55%, #1b2135); box-shadow:inset 0 0 0 4r var(--line), inset 0 9r 0 rgba(255,255,255,.1), 0 8r 0 rgba(0,0,0,.45); transform:skewX(calc(var(--deg) * -1)); transition:transform .16s cubic-bezier(.2,1.9,.4,1), background-color .1s; cursor:pointer; }
  .slab::before { content:""; position:absolute; left:14r; top:50%; width:14r; height:14r; margin-top:-7r; border-radius:50%; background:#8a93ad; box-shadow:0 0 0 3r var(--line), inset 0 -3r 0 rgba(0,0,0,.35); }
  .slab::after { content:""; position:absolute; z-index:-1; left:-46r; right:30r; top:16r; bottom:-12r; background:var(--gold); box-shadow:0 0 0 4r var(--line); transform:scaleX(0); transform-origin:left; transition:transform .18s cubic-bezier(.2,1.2,.3,1); }
  .slab b { display:block; font-size:max(30px,60r); font-weight:900; line-height:1.1; letter-spacing:5r; white-space:nowrap; } .slab small { display:block; font-size:max(20px,26r); font-weight:800; letter-spacing:1r; opacity:.9; white-space:nowrap; overflow:hidden; }
  .slab.nav.focus { background:linear-gradient(#ff7a5c, #e8472f 45%, #b8291c); color:#fff; transform:skewX(calc(var(--deg) * -1)) translateX(-64r) scale(1.08); z-index:2; box-shadow:inset 0 0 0 5r var(--line), inset 0 10r 0 rgba(255,255,255,.28), 0 10r 0 rgba(0,0,0,.5); }
  .slab.nav.focus::before { background:#fff; } .slab.nav.focus::after { transform:scaleX(1); }
  .slab.nav.focus b { text-shadow:0 4r 0 var(--line), 4r 0 0 var(--line), -4r 0 0 var(--line), 0 -4r 0 var(--line), 3r 3r 0 var(--line), -3r 3r 0 var(--line), 3r -3r 0 var(--line), -3r -3r 0 var(--line), 0 9r 0 rgba(0,0,0,.4); }
  .slab.go { animation:slabGo .2s ease-in forwards; } @keyframes slabGo { 0% { filter:brightness(1); } 30% { filter:brightness(4) saturate(0); } 100% { filter:brightness(2); transform:skewX(calc(var(--deg) * -1)) translate(140%, 0); opacity:0; } }
  .slabs.in .slab { animation:slabIn .34s cubic-bezier(.2,1.5,.4,1) both; animation-delay:calc(var(--i) * 70ms); } @keyframes slabIn { from { transform:skewX(calc(var(--deg) * -1)) translateX(120%); opacity:0; } }
  body.nofx .slabs.in .slab { animation:scrFade .3s both; } body.nofx .slab.go { animation:none; } @keyframes scrFade { from { opacity:0; } }
  body.narrow .slab { min-width:0; width:86%; min-height:max(50px,96r); } body.narrow .slabs { --step:18r; gap:10r; } body.small:not(.narrow) .slab { min-height:max(40px,96r); } body.small:not(.narrow) .slabs { gap:8r; }
  `);
  // 皮肤 plate：钢板铭牌（标题画面；以后回合菜单、暂停菜单也用）。铭牌底图由 --plate / --plate-on 两个变量给（没选中 / 选中），
  // 选中的换成金色铭牌、字变深色粗体、左边一个青色三角光标；铭牌不倾斜，只沿斜线错位
  Kit.css(`
  .slabs.plate { gap:0; --step:22r; } .slabs.plate .slab { transform:none; align-items:center; text-align:center; min-width:610r; min-height:max(60px,168r); padding:4r 64r 18r; margin-top:-6r; color:#ffe9d0; background:var(--plate) center/100% 100% no-repeat; box-shadow:none; filter:drop-shadow(0 8r 0 rgba(40,6,4,.45)); text-shadow:0 4r 0 rgba(40,6,4,.75); }
  .slabs.plate .slab::after { display:none; } .slabs.plate .slab::before { left:-34r; top:50%; width:0; height:0; margin-top:-30r; border-radius:0; background:none; box-shadow:none; border:30r solid transparent; border-left:44r solid #39d6e6; border-right:0; filter:drop-shadow(0 0 0 #0e1220) drop-shadow(3r 0 0 #0e1220) drop-shadow(-3r 0 0 #0e1220) drop-shadow(0 3r 0 #0e1220) drop-shadow(0 -3r 0 #0e1220); opacity:0; }
  .slabs.plate .slab b { font-size:max(32px,84r); letter-spacing:10r; transform:skewX(-12deg); -webkit-text-stroke:4r currentColor; paint-order:stroke fill; text-shadow:0 4r 0 #4a0d0a, 4r 0 0 #4a0d0a, -4r 0 0 #4a0d0a, 0 -4r 0 #4a0d0a, 3r 3r 0 #4a0d0a, -3r 3r 0 #4a0d0a, 3r -3r 0 #4a0d0a, -3r -3r 0 #4a0d0a, 0 9r 0 rgba(40,6,4,.5); } .slabs.plate .slab small { font-size:max(20px,28r); font-weight:900; transform:skewX(-12deg); margin-top:-4r; }
  .slabs.plate .slab.nav.focus { background:var(--plate-on) center/100% 100% no-repeat; color:#3a1c06; transform:translateX(-44r) scale(1.13); box-shadow:none; text-shadow:0 3r 0 rgba(255,244,200,.7); filter:drop-shadow(0 10r 0 rgba(40,6,4,.5)) drop-shadow(0 0 22r rgba(255,214,90,.55)); }
  .slabs.plate .slab.nav.focus b { text-shadow:0 3r 0 #fff1b8, 3r 0 0 #fff1b8, -3r 0 0 #fff1b8, 0 -3r 0 #fff1b8, 0 7r 0 rgba(120,70,10,.45); font-size:max(36px,94r); } .slabs.plate .slab.nav.focus::before { opacity:1; background:none; animation:bob .5s ease-in-out infinite alternate; }
  .slabs.plate .slab.go { animation:plateGo .2s ease-out forwards; } @keyframes plateGo { 30% { filter:brightness(4) saturate(0); transform:translateX(-44r) scale(1.2); } 100% { filter:brightness(1.6); transform:translateX(-44r) scale(1.13); } }
  .slabs.plate.in .slab { animation:plateIn .3s cubic-bezier(.3,1.6,.5,1) both; animation-delay:calc(var(--i) * 90ms + 260ms); } @keyframes plateIn { from { transform:scale(1.6) translateY(-30r); opacity:0; } }
  body.narrow .slabs.plate .slab { width:auto; min-width:540r; min-height:max(54px,124r); padding-left:60r; padding-right:60r; } body.narrow .slabs.plate .slab b { font-size:max(28px,62r); } body.narrow .slabs.plate { --step:14r; gap:2r; }
  body.small:not(.narrow) .slabs.plate .slab { min-height:max(40px,150r); } body.small:not(.narrow) .slabs.plate { gap:0; }
  `);
  Kit.slabMenu = (host, items, o) => {
    o = o || {}; host.classList.add('slabs'); if (o.skin) host.classList.add(o.skin); if (o.deg) host.style.setProperty('--deg', o.deg + 'deg'); host.innerHTML = '';
    const out = { el: host, items: [], focus(id) { const b = out.items.find(x => x.dataset.sid === id); if (b) Nav.focus(b); } }; let busy = false;
    items.forEach((it, i) => {
      const b = document.createElement('button'); b.className = 'nav slab'; if (it.id) b.id = it.id; b.dataset.sid = it.id || String(i); b.style.setProperty('--i', i);
      b.innerHTML = `<b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}`;
      b.onclick = () => { if (busy) return; if (document.body.classList.contains('nofx') || !b.getClientRects().length) return it.onPick && it.onPick();
        busy = true; b.classList.add('go'); setTimeout(() => { busy = false; b.classList.remove('go'); if (it.onPick) it.onPick(); }, 170); };
      host.appendChild(b); out.items.push(b);
    });
    // 单行的大字：别的语言放不下就缩字（中文下不动）
    out.fit = () => out.items.forEach(b => { const t = b.firstChild; if (!t || Kit.lang() === ZH) return; t.style.fontSize = ''; const base = parseFloat(getComputedStyle(t).fontSize); let k = 1; while (t.scrollWidth > t.clientWidth + 1 && k > 0.5) { k -= 0.06; t.style.fontSize = (base * k) + 'px'; } });
    return out;
  };
  // o：{ id, cls, icon, title, sub, right（标题栏右侧，一般是页签）, body, …Kit.screen 的其余字段 }。hints 照常给，A = 主操作、B = 返回
  Kit.page = o => Kit.screen(Object.assign({}, o, { cls: 'cs ' + (o.cls || ''), flow: true,
    html: `<div class="cp pn"><div class="ch">${o.icon || ''}<span class="ct">${esc(o.title || '')}</span>${o.sub ? `<span class="cc">${esc(o.sub)}</span>` : ''}<div class="cr">${o.right || ''}</div></div><div class="cb">${o.body || ''}</div></div>` }));
  // 页签条：[[值, 文字, 图标 html?, 锁?]]，带 LB / RB 键帽（鼠标、触屏下没有键帽，页签本身能点）
  Kit.tabsHtml = (list, cur) => `<span class="kcw">${Kit.cap('lb')}</span><div class="ctabs">${list.map(t => `<span class="ctab${t[0] === cur ? ' on' : ''}${t[3] ? ' lock' : ''}" data-tab="${esc(t[0])}">${t[2] || ''}${esc(t[1])}</span>`).join('')}</div><span class="kcw">${Kit.cap('rb')}</span>`;
  // 长文本块：返回 html；内容区是 .lt（也是 .sc，所以右摇杆、PageUp / PageDown 照常能滚）
  Kit.longText = (html, id) => `<div class="ltw"><div class="lt sc"${id ? ` id="${id}"` : ''}>${html}</div><i class="ltbar"><u></u></i></div>`;
  // 方向键滚栈顶页面的长文本（d = ±1）。滚得动返回 true
  Kit.scrollText = d => { const t = Nav.top(), e = t && [...t.el.querySelectorAll('.lt')].find(x => x.getClientRects().length); if (!e || e.scrollHeight <= e.clientHeight + 4) return false; const y0 = e.scrollTop; e.scrollBy({ top: d * Math.max(80, e.clientHeight * 0.3), behavior: 'smooth' }); if ((d < 0 && y0 > 0) || (d > 0 && y0 + e.clientHeight < e.scrollHeight - 2)) Kit.sfx.tick(); return true; };
  { const cues0 = Kit.cues; Kit.cues = () => { cues0(); document.querySelectorAll('.ltw').forEach(w => { const e = w.querySelector('.lt'), b = w.querySelector('.ltbar'); if (!e || !b) return; const over = e.scrollHeight > e.clientHeight + 4; b.classList.toggle('on', over); if (!over) return; const u = b.firstChild, k = e.clientHeight / e.scrollHeight; u.style.height = (k * 100) + '%'; u.style.top = (e.scrollTop / e.scrollHeight * 100) + '%'; }); }; }

  root.AWKit = Kit;
})(window);
