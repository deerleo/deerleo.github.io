// 潮汐战线：全游戏统一皮肤（覆盖层）。放在所有 ui*.js 之后加载，只换材质、配色和背景，不改各页面的结构和逻辑。
// 风格以标题画面为准（concepts/skin/skin-A/B/C.png）：红色铆钉钢框、暗红钢牌按钮、金色钢牌表示选中、深炭哑光的内容区、压暗的背景图。
// 材质图在 ui-assets/skin/（tools/build-skin.js 从标题画面的原画拼出来的九宫格，背景图是 Codex 画的），相对路径加载。
// 规则：只有能点 / 能选的东西才用钢牌；纯展示的信息（数字牌、标签、说明）用深色凹底或普通文字。
// 写法：SK(css) 里每条规则的选择器前面自动加 html body（比各页面自己的规则优先），数字后面的 r 是基准像素（同 Kit.css）。
(function (root) {
  'use strict';
  const A = 'ui-assets/skin/';
  const el = document.createElement('style'); el.id = 'aw-skin2';
  const rpx = t => t.replace(/(-?\d*\.?\d+)r(?![\w%.(])/g, 'calc($1 * var(--r))');
  // 逗号分开的选择器逐个加前缀（括号里的逗号不算）；以 :root 开头的原样保留；以 body / html 开头的接到前缀上
  const pre = sel => { const out = []; let d = 0, cur = ''; for (const ch of sel) { if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur);
    return out.map(s => { s = s.trim(); if (!s) return ''; if (s.startsWith(':root')) return s; if (s.startsWith('html')) return s.replace(/^html(\S*)\s+(?:body(\S*))?/, (m, a, b) => 'html' + a + ' body' + (b || '') + ' '); if (s.startsWith('body')) return 'html ' + s; return 'html body ' + s; }).filter(Boolean).join(', '); };
  let buf = '';
  const SK = css => { buf += rpx(css.replace(/\/\*[\s\S]*?\*\//g, '')).replace(/([^{}]+)\{([^{}]*)\}/g, (m, s, b) => pre(s) + ' {' + b + '}\n'); };
  const RAW = css => { buf += rpx(css) + '\n'; };
  const OCT = c => `polygon(${c} 0, calc(100% - ${c}) 0, 100% ${c}, 100% calc(100% - ${c}), calc(100% - ${c}) 100%, ${c} 100%, 0 calc(100% - ${c}), 0 ${c})`;
  // 钢牌（大）：四角带铆钉；小牌：没有铆钉
  const PLATE = n => `border:0 solid transparent; border-image:var(--sk-${n}) 60 60 70 60 fill / 30r 30r 35r 30r / 0 stretch; background:none; box-shadow:none; border-radius:0; clip-path:none;`;
  const CHIP = n => `border:0 solid transparent; border-image:var(--sk-${n}) 32 32 38 32 fill / 16r 16r 19r 16r / 0 stretch; background:none; box-shadow:none; border-radius:0; clip-path:none;`;
  const OL = c => `0 3r 0 ${c}, 3r 0 0 ${c}, -3r 0 0 ${c}, 0 -3r 0 ${c}, 2r 2r 0 ${c}, -2r 2r 0 ${c}, 2r -2r 0 ${c}, -2r -2r 0 ${c}`;
  // ───── 把各页面样式里的藏青色系（旧皮肤的深蓝面板、蓝灰字）整体换成暖炭色：色相 205°–255°、饱和度不高的颜色，色相转到 12°、饱和度减半，明度不变。
  // 阵营蓝、海和天空这些鲜艳的蓝不动；标题画面的规则不动（它有自己的一套）。之后才加进来的样式（Kit.css 被包了一层）同样处理。
  const EX = /\.tt\b|#title|\.tpl\b|\.logo|\.tmenu|\.tprev|\.slab|\.tlang/;
  const warm = (r, g, b) => {
    const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2, d = mx - mn; if (d < 0.012) return null;
    const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r / 255 ? ((g - b) / 255 / d) % 6 : mx === g / 255 ? (b - r) / 255 / d + 2 : (r - g) / 255 / d + 4; h = (h * 60 + 360) % 360;
    if (h < 205 || h > 255 || !(s <= 0.5 || l <= 0.12 || (l >= 0.9 && s <= 0.6))) return null;
    const S = s * 0.5, C = (1 - Math.abs(2 * l - 1)) * S, H = 12 / 60, X = C * (1 - Math.abs(H % 2 - 1)), m = l - C / 2;
    return [C + m, X + m, m].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255));
  };
  const fixVal = v => v.replace(/#([0-9a-f]{6})\b/gi, (m, x) => { const n = parseInt(x, 16), w = warm(n >> 16 & 255, n >> 8 & 255, n & 255); return w ? '#' + w.map(c => c.toString(16).padStart(2, '0')).join('') : m; })
    .replace(/rgba\((\d+),\s*(\d+),\s*(\d+),/g, (m, r, g, b) => { const w = warm(+r, +g, +b); return w ? 'rgba(' + w.join(',') + ',' : m; });
  const remap = css => css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, s, b) => EX.test(s) ? m : s + '{' + fixVal(b) + '}');
  try { const K = root.AWKit, st = document.getElementById('aw-kit');
    if (st) for (const n of [...st.childNodes]) if (n.nodeType === 3) n.textContent = remap(n.textContent);
    if (K && K.css) { const css0 = K.css; K.css = txt => css0(remap(txt)); }
  } catch (e) { }

  const WELL = `background:#171213; box-shadow:inset 0 0 0 2r rgba(255,232,205,.13), inset 0 6r 0 rgba(0,0,0,.35); border-radius:6r; clip-path:none;`;

  RAW(`:root:root { --bg:#1d1617; --bg2:#151011; --panel:#221a1b; --panel2:#2c2223; --line:#160b0a; --hi:#7d655f; --lo:#0d0808; --mut:#c9b7aa; --ink:#32160a; --txt:#f7ecd6;
    --sk-pr:url(${A}plate-red.webp); --sk-pg:url(${A}plate-gold.webp); --sk-px:url(${A}plate-grey.webp); --sk-pd:url(${A}plate-dark.webp);
    --sk-cr:url(${A}chip-red.webp); --sk-cg:url(${A}chip-gold.webp); --sk-cd:url(${A}chip-dark.webp);
    --sk-fr:url(${A}frame-red.webp); --sk-fb:url(${A}frame-big.webp); --sk-fc:url(${A}frame-card.webp); --sk-fg:url(${A}frame-gold.webp); --sk-fd:url(${A}frame-dark.webp); --sk-ft:url(${A}frame-thin.webp);
    --sk-bar:url(${A}bar-red.webp); --sk-steel:url(${A}bg-steel.webp); --sk-ops:url(${A}bg-ops.webp); --sk-codex:url(${A}bg-codex.webp); --sk-wave:url(${A}wave.webp);
    --sk-cur:#39d6e6; --sk-cream:#fff0d6; --sk-dk:#3a0c08; }
  @keyframes skBob { to { transform:translateX(7r); } }`);

  SK(`
  /* ───── 整屏页的底：压暗的背景图 ───── */
  .scr { background:linear-gradient(rgba(60,20,14,.25), rgba(20,6,5,.55)), var(--sk-steel) center/cover no-repeat #1a0d0d; }
  .scr::before { display:none; }
  .cs { background:linear-gradient(rgba(16,8,8,.3), rgba(10,5,5,.5)), var(--sk-ops) center/cover no-repeat #150c0c; }
  .cs#codex, .cs[id^="cx"], .lore { background:linear-gradient(rgba(14,8,6,.28), rgba(10,5,4,.5)), var(--sk-codex) center/cover no-repeat #150c0a !important; }

  /* ───── 面板：钢框 + 深炭哑光底 ───── */
  .pn, #snd { border-image:var(--sk-fd) 80 / 30r / 0 round !important; filter:drop-shadow(0 8r 0 rgba(10,4,4,.45)); }
  .pn.gold, .detail, #toast, .mrow .mid, .pn.nav.focus { border-image:var(--sk-fg) 80 / 30r / 0 round !important; }
  #menu, .pause, #hudF, .modp { border-image:var(--sk-fr) 96 / 40r / 0 round !important; }
  #hints { border-image:var(--sk-fd) 80 / 30r / 0 round !important; background:linear-gradient(#2c2223, #171112); }
  .well { background:#151011; }

  /* 整屏页的大框：厚的红钢框（带铆钉和高光），框里是暗红钢板底，左下、右下两朵浪花；标题是压在框左上角的一块大钢牌 */
  .cs .cp.pn { border-image:var(--sk-fb) 152 / 64r / 0 round !important; padding:24r; background:linear-gradient(rgba(168,92,66,.4), rgba(132,62,46,.32)), var(--sk-steel) center/260% 260% no-repeat #7a2c24;
    --bg2:#4a1a15; --bg:#6a261f; --panel:#5e221c; --panel2:#6e2a22; --mut:#e6cfc0; }
  .cs .cp::after, .cs .cp::before { content:""; position:absolute; bottom:-34r; width:190r; height:78r; background:var(--sk-wave) center/contain no-repeat; pointer-events:none; z-index:6; }
  .cs .cp::after { right:-30r; } .cs .cp::before { left:-30r; transform:scaleX(-1); }
  body.narrow .cs .cp::before, body.small .cs .cp::before, body.narrow .cs .cp::after, body.small .cs .cp::after { display:none; }
  body.narrow .cs .cp.pn, body.small .cs .cp.pn { border-image-width:40r !important; padding:12r; }
  .cs .ch { border-bottom:0; min-height:92r; margin-top:-30r; padding-left:0; color:var(--sk-cream); z-index:3; }
  .cs .ch .ct { ${PLATE('pr')} display:flex; align-items:center; align-self:stretch; margin:0 0 6r -30r; padding:8r 56r 16r 44r; font-size:max(26px,54r); font-style:italic; letter-spacing:3r; text-shadow:${OL('var(--sk-dk)')}, 0 6r 0 rgba(30,4,4,.5); filter:drop-shadow(0 6r 0 rgba(20,4,4,.45)); }
  .cs .ch > .ic { position:relative; z-index:2; width:68r; height:68r; margin:0 -104r 8r 6r; filter:drop-shadow(0 4r 0 rgba(20,4,4,.5)); } .cs .ch > .ic + .ct { padding-left:118r; }
  body.narrow .cs .ch, body.small .cs .ch { margin-top:-12r; } body.narrow .cs .ch .ct, body.small .cs .ch .ct { margin-left:-10r; padding-top:4r; padding-bottom:10r; }
  .cs .ch .cc { ${WELL} background:rgba(20,6,6,.6); }
  /* 内容区：深炭哑光（左边选择列、右边正文），和红钢框分开 */
  .cs .cb { background:none; box-shadow:none; }
  .cs .cl { background:rgba(50,10,8,.3); border-right:5r solid rgba(40,8,6,.7); }
  /* 整屏页里只展示的格子：比钢板底暗一档的凹槽（不是黑块） */
  .cs .tile, .cs .chip, .cs .big4 > div { background:rgba(52,14,11,.62); box-shadow:inset 0 0 0 2r rgba(255,225,200,.2), inset 0 6r 0 rgba(30,6,4,.35); }
  .cs .vb { background:rgba(52,14,11,.5); box-shadow:inset 0 0 0 2r rgba(255,225,200,.14); } .cs .vb .b { background:#2e0f0c; }
  .cs .sc.more-dn::after { background:linear-gradient(transparent, #6a261f 70%); } .cs .sc.more-up::before { background:linear-gradient(#6a261f 30%, transparent); }

  /* ───── 能点的：钢牌 ───── */
  .item, .orow { ${PLATE('pr')} color:var(--sk-cream); text-shadow:0 3r 0 rgba(40,6,4,.75); }
  .item:disabled, .item.off { border-image-source:var(--sk-px); color:#a39a94; text-shadow:none; }
  .item.focus, .orow.focus { border-image-source:var(--sk-pg); color:var(--ink); text-shadow:0 2r 0 rgba(255,244,200,.6); }
  .item.focus::before, .orow.focus::before, .arrow::before { border-left-color:var(--sk-cur); filter:drop-shadow(2r 0 0 #0e1220) drop-shadow(-2r 0 0 #0e1220) drop-shadow(0 2r 0 #0e1220) drop-shadow(0 -2r 0 #0e1220); }
  .cit { ${PLATE('pr')} border-left:0 solid transparent; padding-left:34r; }
  .cit::before { content:""; position:absolute; left:13r; top:16r; bottom:21r; width:9r; background:var(--pc, #a8968c); box-shadow:0 0 0 2r var(--line); }
  .cit.focus { border-image-source:var(--sk-pg); color:var(--ink); }
  .ucell { ${CHIP('cr')} color:var(--sk-cream); text-shadow:0 2r 0 rgba(40,6,4,.7); padding-bottom:4r; }
  .ucell.focus { border-image-source:var(--sk-cg); color:var(--ink); text-shadow:none; }
  .ucell.un { border-image-source:var(--sk-cd); }
  /* 页签：小钢牌，选中金色；边框画在图里，沿切角闭合 */
  .ctab { ${CHIP('cr')} color:var(--sk-cream); text-shadow:0 2r 0 rgba(40,6,4,.7); padding-bottom:3r; }
  .ctab.on, .lore .ctab.on { border-image-source:var(--sk-cg); background:none; box-shadow:none; color:var(--ink); text-shadow:none; }
  .ctab.lock { border-image-source:var(--sk-cd); color:#8d827c; text-shadow:none; }
  /* 阵营页签：带阵营色，所以用两层切角（外层是边、里层是底），任何状态下边都沿切角闭合 */
  .tab { position:relative; isolation:isolate; clip-path:${OCT('11r')}; background:var(--pcd); box-shadow:none; border-radius:0; color:var(--pcl); }
  .tab::before { content:""; position:absolute; inset:4r; z-index:-1; clip-path:${OCT('9r')}; background:linear-gradient(#2a2021, #171112); }
  .tab.on { background:var(--gold); box-shadow:none; color:#fff; }
  .tab.on::before { background:linear-gradient(var(--pc), var(--pcd)); box-shadow:inset 0 9r 0 rgba(255,255,255,.2); }
  .tab.lock { background:#3a3231; color:#8d827c; }

  /* ───── 只展示的：深色凹底，不是钢牌 ───── */
  .tile, .chip, .big4 > div { ${WELL} }
  .tag { background:#4a2f1c; box-shadow:inset 0 0 0 2r rgba(255,232,205,.16); border-radius:6r; }
  .step { background:#171213; box-shadow:inset 0 0 0 2r rgba(255,232,205,.13); } .step b { background:#6b5a55; } .steps > i { color:#6b5a55; }
  .kc { background:#6b5a55; } .kc.sq { background:#8a7a72; }
  .dots i { background:#6b5a55; }
  .stars i { color:#5d4c48; }
  .sc.more-dn::after { background:linear-gradient(transparent, #1d1617 70%); } .sc.more-up::before { background:linear-gradient(#221a1b 30%, transparent); }
  .ltbar { background:rgba(0,0,0,.45); }

  /* ───── 底部：右下金色主按钮、左下暗红返回、中间的小按钮 ───── */
  #hints.flow .fa { ${PLATE('pg')} color:var(--ink); font-style:italic; text-shadow:0 2r 0 rgba(255,244,200,.7); filter:drop-shadow(0 0 14r rgba(242,182,50,.35)); }
  #hints.flow .fa:hover, #hints.flow .fa:active { background:none; filter:brightness(1.1) drop-shadow(0 0 16r rgba(255,214,90,.6)); }
  #hints.flow .fa.off { border-image-source:var(--sk-px); background:none; color:#b3aaa4; text-shadow:none; filter:none; box-shadow:none; }
  #hints.flow .fb { ${PLATE('pr')} color:var(--sk-cream); font-style:italic; text-shadow:0 3r 0 rgba(40,6,4,.75); }
  #hints.flow .fb:hover { filter:brightness(1.15); }
  #hints.flow .mid .h { ${CHIP('cd')} color:var(--sk-cream); padding-bottom:3r; }
  #hints.flow .mid .h:hover { border-image-source:var(--sk-cr); }
  #hints .bt { ${CHIP('cd')} color:var(--sk-cream); } #hints .bt:hover { border-image-source:var(--sk-cg); background:none; color:var(--ink); }
  #hints .sep { background:#5d4c48; }

  /* 图鉴兵种 / 地形页：展示台镶钢框，名字用斜体描边的大字 */
  .ust.tr, .ust.dk { background:linear-gradient(#4e1c16, #3c130f); }
  .ust { box-shadow:none; } .ust::after { content:""; position:absolute; inset:0; border:0 solid transparent; border-image:var(--sk-fc) 80 / 34r / 0 round; pointer-events:none; }
  .usi .nm { font-style:italic; text-shadow:${OL('#1c0907')}, 0 7r 0 rgba(0,0,0,.4); } .usi .nm small { font-style:normal; text-shadow:none; }
  /* ───── 图鉴首页：镶在钢框里的图片牌 ───── */
  .cxt { background:#1a1213; box-shadow:none; clip-path:${OCT('10r')}; }
  .cxt::after { content:""; position:absolute; inset:0; z-index:2; border:0 solid transparent; border-image:var(--sk-fc) 80 / 40r / 0 round; pointer-events:none; }
  .cxt .im { inset:12r; filter:saturate(.95) brightness(.92); } .cxt .cap { left:12r; right:12r; bottom:12r; background:linear-gradient(transparent, rgba(22,8,8,.95) 62%); }
  .cxt .cap b { font-size:max(28px,58r); font-style:italic; color:var(--sk-cream); text-shadow:${OL('#2a0806')}, 0 6r 0 rgba(20,4,4,.5); } .cxt .cap small { color:#f3e6d4; font-weight:800; text-shadow:0 2r 0 #2a0806; }
  .cxt.nav.focus { clip-path:none; overflow:visible; background:#e9a92c; box-shadow:0 0 36r 8r rgba(242,182,50,.45), 0 12r 0 rgba(0,0,0,.45); }
  .cxt.nav.focus .im { transform:none; filter:none; }
  .cxt.nav.focus::after { border-image:var(--sk-fg) 80 / 40r / 0 round; }
  .cxt.nav.focus::before { content:""; position:absolute; left:-22r; top:50%; margin-top:-24r; z-index:3; border:24r solid transparent; border-left:34r solid var(--sk-cur); border-right:0; filter:drop-shadow(2r 0 0 #0e1220) drop-shadow(-2r 0 0 #0e1220) drop-shadow(0 2r 0 #0e1220) drop-shadow(0 -2r 0 #0e1220); animation:skBob .5s ease-in-out infinite alternate; }

  /* ───── 回合菜单、暂停菜单：一块红钢板，左上、右下浪花 ───── */
  #menu, .pause { background:linear-gradient(rgba(70,10,8,.25), rgba(40,4,4,.6)), var(--sk-steel) center/320% 320% no-repeat #6a1512; }
  .pause .item, #menu .item { font-style:italic; text-shadow:${OL('var(--sk-dk)')}; } .pause .item.focus, #menu .item.focus { text-shadow:0 2r 0 rgba(255,244,200,.7); } .pause .item:disabled, #menu .item:disabled, .pause .item.off, #menu .item.off { text-shadow:none; }
  .pause h2, #menu h2 { font-size:max(28px,54r); color:var(--sk-cream); font-style:italic; text-shadow:${OL('var(--sk-dk)')}, 0 6r 0 rgba(30,4,4,.5); }
  .pause::before, .pause::after { content:""; position:absolute; width:170r; height:70r; background:var(--sk-wave) center/contain no-repeat; pointer-events:none; z-index:6; }
  .pause::before { left:-48r; top:-40r; transform:scaleX(-1); } .pause::after { right:-44r; bottom:-34r; }
  body.small .pause::before, body.small .pause::after { display:none; }
  body.small #menu, body.small .pause { border-image-width:26r !important; } body.small .pause h2, body.small #menu h2 { font-size:max(20px,40r); } body.small .pause .inote, body.small #menu .inote { margin-top:0; margin-bottom:6r; }
  .pause .inote, #menu .inote { margin-top:6r; margin-bottom:14r; background:#191213; color:#f1e6d6; box-shadow:inset 0 0 0 2r rgba(255,232,205,.1); }
  `);

  SK(`
  /* ───── 开局流程 ───── */
  #wzMap, #wzSeats, #wzRules, #langPick { background:linear-gradient(rgba(196,116,80,.2), rgba(70,26,18,.3)), var(--sk-ops) center/cover no-repeat #150c0c; }
  .copick { background:linear-gradient(115deg, var(--pcd) 0 30%, transparent 30.1%), linear-gradient(rgba(196,116,80,.18), rgba(70,26,18,.34)), var(--sk-ops) center/cover no-repeat #150c0c !important; }
  /* 只是说明的小牌子（选指挥官页左下“谁在选”）：阵营色的一条标签，不是钢牌 */
  .crumb.pn { border:0 solid transparent !important; border-left:10r solid var(--pc) !important; border-image:none !important; background:rgba(18,9,9,.82) !important; filter:none; }
  /* 只是说明的牌子（世界地图的章节目标、进度，浮动提示）：一圈细线的深色标签，没有铆钉，不是钢牌 */
  .agoal.pn, .prog.pn, #note, #wnar { border-image:var(--sk-ft) 48 / 14r / 0 round !important; filter:none; background:rgba(22,12,12,.9); }
  /* 战况页的数字牌：五个并排时左右留白收一点，“每回合收入”不折行 */
  .stcard .tiles .tile { padding-left:4r; padding-right:4r; }
  /* 画廊、解锁演出、战役旁白：压暗的档案室 / 钢板背景，不留纯黑 */
  #cxGal { background:linear-gradient(rgba(12,7,6,.35), rgba(8,4,4,.6)), var(--sk-codex) center/cover no-repeat #120a09 !important; } #cxGal .gbig { background-color:transparent; }
  .unlk, .cpnar { background:radial-gradient(ellipse 70% 60% at 50% 45%, rgba(40,10,8,.55), rgba(8,4,4,.92)), var(--sk-steel) center/cover no-repeat #150a0a !important; }
  /* ───── 科技研究（对局里打开）：战场透出来；大框、标题栏、左侧页签、解锁按钮 ───── */
  #tech { background:rgba(14,7,7,.62); }
  #tech .tp.pn { border-image:var(--sk-fb) 152 / 36r / 0 round !important; padding:8r; background:linear-gradient(#241b1c, #1a1314); }
  body.narrow #tech .tp.pn, body.small #tech .tp.pn { border-image-width:30r !important; padding:4r; }
  .tp .th { background:var(--sk-bar) center/cover no-repeat; }
  .tp .th .hb { ${CHIP('cr')} color:var(--sk-cream); text-shadow:0 2r 0 rgba(40,6,4,.7); padding-bottom:3r; }
  .ttab { ${PLATE('pd')} border-left:0 solid transparent; padding-left:34r; }
  .ttab::before { content:""; position:absolute; left:13r; top:16r; bottom:21r; width:9r; background:var(--pc, #a8968c); box-shadow:0 0 0 2r var(--line); }
  .ttab.on { border-image-source:var(--sk-pg); background:none; box-shadow:none; color:var(--ink); }
  .tdesc .go { ${PLATE('pg')} color:var(--ink); font-style:italic; text-shadow:0 2r 0 rgba(255,244,200,.7); padding-bottom:6r; }
  .tdesc .go.no { border-image-source:var(--sk-px); color:#b3aaa4; text-shadow:none; } .tdesc .go.cancel { border-image-source:var(--sk-pr); color:var(--sk-cream); text-shadow:0 3r 0 rgba(40,6,4,.75); }
  /* 世界地图：地图没铺到的边上露出来的底，换成压暗的钢板 */
  #world { background:linear-gradient(rgba(10,14,22,.55), rgba(8,8,12,.8)), var(--sk-steel) center/cover no-repeat #10141c !important; }
  /* 长文本（规则、科技一览、世界、阵营、档案、指挥官背景、兵种“更多”）：一张沙色的纸，深色字；标题和小方块暗红。纸的高度跟着文字走，文字多了才撑满、在纸里滚动 */
  .ltw { flex:0 1 auto; min-height:0; padding:26r 14r 18r 40r; background:linear-gradient(#f1e3bd, #dfca99); box-shadow:inset 0 0 0 3r #6a4a22, inset 0 0 46r rgba(130,86,30,.32), 0 7r 0 rgba(20,4,4,.4); }
  .lt { flex:1 1 auto; min-height:min(150r, 100%); padding-bottom:26r; color:#2e1a10; font-weight:800; text-shadow:none; }
  .lt h3 { color:#8a1f14; } .lt h3::before { background:#b3261a; box-shadow:0 0 0 2r #3a1c06; } .lt .q { color:#7a4a10; }
  .cxs .lt p::before { background:#b3261a; box-shadow:0 0 0 2r #3a1c06; } .cxs .lt p i { color:#8a1f14; }
  .lt .gold, .lt .lk { color:#7a3a08; } .lt .lk { border-bottom-color:#b3261a; } .lt .good { color:#1f6e2a; } .lt .bad { color:#a8241a; } .lt .mut { color:#6a5644; }
  .lore .lt .tr1 { border-bottom-color:rgba(110,70,30,.35); } .lore .lt .tr1 b { color:#8a1f14; }
  .lore .lt .tie b { color:#8a1f14; border-bottom-color:#b3261a; }
  .lt .cond i, .cxs .lt p.cond > i { color:#8a7862; } .lt .cond.ok, .cxs .lt p.cond.ok { color:#1f6e2a; } .lt .cond.ok i, .cxs .lt p.cond.ok > i { color:#1f6e2a; }
  .lt .ulk h5 { color:#8a1f14; } .lt .ulk h5 small { color:#6a5644; } .lt .ulk .ulf span { background:rgba(110,70,30,.16); box-shadow:inset 0 0 0 2r rgba(110,70,30,.45); color:#6a5644; } .lt .ulk .ulf span.ok { color:#1f6e2a; box-shadow:inset 0 0 0 3r #1f6e2a; }
  .lt .ttr { background:rgba(120,78,30,.13); box-shadow:inset 0 0 0 2r rgba(110,70,30,.4); } .lt .ttr span:not(.tv) { color:#3a2416; } .lt .ttr b em { color:#8a1f14; }
  /* 纸上的深色小格子（数值、克制）：里面的字照旧是浅色 */
  .lt :is(.chip, .tile, .v1, .w1, .tag) { color:#f7ecd6; } .lt :is(.chip, .tile, .v1, .w1) small, .lt .tile span { color:#e6cfc0; }
  .cs .setd { background:rgba(56,12,9,.4); }
  .ltbar { background:rgba(70,36,10,.22); box-shadow:none; } .ltbar u { background:#8a1f14; }
  body.narrow .ltw, body.small .ltw { padding:14r 8r 10r 20r; }
  /* 对局外各页上的面板（规则说明、关前页、翻页卡……）：红褐钢板底，凹槽比底暗一档 */
  .scr:not(.dim):not(.clear) .pn:not(.fac):not(.gold):not(.cp):not(.crumb):not(.agoal):not(.prog):not(.nav):not(.tp), .umore.pn, .pager.pn { background:linear-gradient(#70291f, #5a2019); --bg2:#431712; --mut:#e6cfc0; }
  .umore h2, .pager h2 { color:var(--sk-cream); }
  /* 操作说明的键盘图：没用到的键是钢灰色 */
  .hkb svg .k { fill:#8f8580; stroke:#2a1410; } .hkb svg .kt { fill:#3a2c28; }
  /* 对局里的详情卡、造兵列表右侧的兵种详情：和回合菜单同一种暗红钢板，里面的数字牌是凹槽 */
  .detail.pn, .build .cd.pn { background:linear-gradient(rgba(78,14,11,.3), rgba(44,6,5,.62)), var(--sk-steel) center/320% 320% no-repeat #6a1512; --bg2:#3c120e; --mut:#e6cfc0; }
  .detail .tile, .detail .chip, .build .cd .tile, .build .cd .chip, .detail .v1, .build .cd .v1, .detail .w1, .build .cd .w1 { background:rgba(40,8,6,.6); box-shadow:inset 0 0 0 2r rgba(255,225,200,.18), inset 0 6r 0 rgba(20,4,3,.35); }
  /* 对局里弹出来的整屏层：半透明，战场透出来 */
  .scr.dim { background:rgba(16,8,8,.52); }
  `);

  el.textContent = buf; (document.head || document.documentElement).appendChild(el);
  // 别的模块以后再往 <head> 里加样式表时，皮肤仍排在最后
  root.AWSkin2 = { el, SK, RAW, flush() { el.textContent = buf; document.head.appendChild(el); } };
})(window);
