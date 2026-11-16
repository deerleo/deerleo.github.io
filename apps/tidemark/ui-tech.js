// 潮汐战线：科技研究画面（window.AWTech）。入口在战场上（己方司令部 / 科研所按确定 → 研究），整屏不透明，关掉回到原处。
// 接口按 tools/MULTI-SPEC.md“科技”一节，全部判空；数字一律显示核心给的，不自己算。
// 版面（主机游戏的升级画面）：一次只看一条线、一次只读一段字。
//   左：竖排的科技线页签（通用 / 阵营 / 指挥官三组），每个页签 = 图标 + 线名 + 三个进度点；在研的那条有脉冲光
//   中：当前这条线的三张大卡片（一、二、三级），粗箭头相连；卡片上只有图标、名称、研究点、状态角标
//   卡片下：所选卡片的效果（大字）、风味句、一个跟着状态变的按钮
//   底：一行状态栏——研究中的项目 | 研究经费分段选择
// 操作：上下 = 切线，左右 = 切卡片，确定 = 研究 / 加入队列 / 取消研究，LB RB = 调经费，X = 说明浮层（研究点来源、阵营研究方式），B 关闭。
(function (root) {
  'use strict';
  const Kit = root.AWKit, esc = Kit.esc, Nav = Kit.Nav, $ = id => document.getElementById(id);
  const tt = Kit.t;   // 界面文字走翻译（这个文件里 T 已经是模块对象的名字，所以叫 tt）
  Kit.css(`
  #tech { background:#0a0e1a; padding:30r 36r 104r; align-items:stretch; justify-content:stretch; }
  #tech .tp { flex:1; min-height:0; display:flex; flex-direction:column; position:relative; animation:tpIn .26s cubic-bezier(.2,1.3,.4,1); }
  #tech.out .tp { animation:tpOut .16s ease-in forwards; }
  @keyframes tpIn { from { opacity:0; transform:scale(.9); } } @keyframes tpOut { to { opacity:0; transform:scale(.92); } }
  .tp .th { white-space:nowrap; flex:none; display:flex; align-items:center; gap:16r; height:76r; padding:0 30r; font-size:max(22px,38r); font-weight:900; color:var(--gold); border-bottom:5r solid var(--line); }
  .tp .th span { color:var(--txt); font-size:max(20px,30r); padding:2r 18r; border-radius:10r; background:var(--pcd); box-shadow:inset 0 0 0 3r var(--line); }
  .tp .th .hb { display:none; font-style:normal; margin-left:auto; min-height:max(36px,56r); padding:0 24r; align-items:center; border-radius:12r; font-size:max(20px,28r); color:var(--txt); background:linear-gradient(#46527a, #333d5c); box-shadow:inset 0 0 0 3r var(--line); cursor:pointer; white-space:nowrap; } .tp .th .hb + .hb { margin-left:0; }
  body[data-dev=mouse] .tp .th .hb, body[data-dev=touch] .tp .th .hb { display:flex; } body[data-dev=mouse] .tp .th, body[data-dev=touch] .tp .th { padding-right:max(64px,130r); } body[data-dev=mouse] #tech, body[data-dev=touch] #tech { padding-bottom:30r; }
  .tp .th .res { margin-left:auto; display:flex; align-items:center; gap:22r; font-size:max(20px,28r); color:var(--txt); font-weight:800; } .tp .th .res span { display:flex; align-items:center; gap:8r; padding:0; background:none; box-shadow:none; font-size:inherit; } .tp .th .res b { color:var(--gold2); font-size:max(20px,32r); } .tp .th .res .cost { color:var(--mut); } .tp .th .res .cost b { color:#ffb35c; } .tp .th .res + .hb { margin-left:10r; }
  /* 当前研究：标题栏下面一条 */
  .tnow { flex:none; display:flex; align-items:center; gap:18r; min-height:92r; padding:8r 30r; background:linear-gradient(90deg, #22345c, #1a2440 70%); border-bottom:5r solid var(--line); font-size:max(20px,28r); font-weight:800; white-space:nowrap; cursor:pointer; }
  .tnow .ic { width:60r; height:60r; flex:none; } .tnow .lb { color:var(--mut); flex:none; } .tnow .nm { font-size:max(22px,38r); font-weight:900; color:#fff; flex:none; } .tnow .rt { flex:none; color:var(--gold2); display:flex; align-items:center; gap:8r; } .tnow .eta { flex:none; color:#bff2ff; } .tnow .q { flex:none; color:var(--mut); }
  .tnow .big { flex:1 1 200r; min-width:120r; height:max(30px,52r); position:relative; border-radius:12r; background:#0c1222; box-shadow:inset 0 0 0 4r var(--line); overflow:hidden; } .tnow .big u { position:absolute; left:0; top:0; bottom:0; min-width:10r; background:linear-gradient(#ffe08a, #f2b632 55%, #dc9a1e); border-radius:10r; } .tnow .big u::after, .tcd .pb.run u::after { content:""; position:absolute; inset:0; background:linear-gradient(100deg, transparent 30%, rgba(255,255,255,.55) 50%, transparent 70%); background-size:220% 100%; animation:tFlow 1.4s linear infinite; } @keyframes tFlow { from { background-position:160% 0; } to { background-position:-60% 0; } }
  .tnow .big em { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-style:normal; font-size:max(20px,28r); font-weight:900; color:#fff; text-shadow:0 2r 0 #000, 0 0 6r #000; }
  .tnow.none { cursor:default; } .tnow.none .nm { color:var(--gold); animation:blink 1.2s steps(2) infinite; }
  .tp .tb { flex:1; min-height:0; display:flex; }
  /* 左：科技线页签 */
  .ttabs { flex:none; width:400r; min-height:0; overflow:hidden auto; scrollbar-width:none; display:flex; flex-direction:column; justify-content:safe center; gap:8r; padding:16r 24r 16r 28r; background:rgba(0,0,0,.22); border-right:5r solid var(--line); }
  .ttabs .tg { display:flex; align-items:center; gap:10r; margin-top:22r; font-size:max(20px,24r); font-weight:800; color:var(--pcl); white-space:nowrap; } .ttabs .tg:first-child { margin-top:0; }
  .ttabs .tg .ic, .ttabs .tg .hd { width:36r; height:36r; } .ttabs .tg span { min-width:0; overflow:hidden; }
  .ttabs .tg .q { flex:none; margin-left:auto; width:max(26px,40r); height:max(26px,40r); line-height:max(26px,40r); text-align:center; border-radius:50%; font-style:normal; font-weight:900; color:var(--ink); background:var(--pcl); cursor:pointer; }
  .ttab { flex:none; display:flex; align-items:center; gap:14r; min-height:82r; padding:0 18r; border-radius:14r; border-left:10r solid var(--pc); background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); cursor:pointer; position:relative; }
  .ttab .ic, .ttab .hd { width:56r; height:56r; flex:none; } .ttab b { flex:1; min-width:0; font-size:max(22px,34r); font-weight:900; white-space:nowrap; overflow:hidden; }
  .ttab .dots { flex:none; display:flex; gap:5r; } .ttab .dots i { position:relative; width:max(14px,30r); height:max(8px,16r); border-radius:4r; background:#0c1222; box-shadow:inset 0 0 0 2r #6a7aa6; overflow:hidden; } .ttab .dots i u { position:absolute; left:0; top:0; bottom:0; background:var(--gold); } .ttab .dots i.done u { background:#8fd45a; }
  .ttab.on { background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e); color:var(--ink); box-shadow:inset 0 0 0 4r var(--line), 0 6r 0 rgba(0,0,0,.4); } .ttab.on .dots i { box-shadow:inset 0 0 0 2r var(--ink); background:rgba(0,0,0,.25); } .ttab.on .dots i.done u { background:#2f7a1c; } .ttab.on .dots i u { background:#7a4a00; }
  .ttab.pulse::after { content:""; position:absolute; inset:-4r; border-radius:16r; border:5r solid var(--blue); animation:tPulse 1.3s ease-in-out infinite; pointer-events:none; }
  @keyframes tPulse { 50% { opacity:.15; transform:scale(1.03); } }
  /* 中：三张卡片 */
  .tmain { flex:1; min-width:0; min-height:0; display:flex; flex-direction:column; padding:20r 40r 16r; gap:14r; }
  .tmain .gsub { flex:none; margin:-8r 0 6r; font-size:max(20px,24r); line-height:1.35; font-weight:700; color:var(--mut); } body.small:not(.narrow) .tmain .gsub { display:none; }
  .tmain h2 { margin:0 0 6r; flex:none; display:flex; align-items:baseline; gap:16r; font-size:max(24px,46r); font-weight:900; color:#fff; } .tmain h2 small { font-size:max(20px,26r); font-weight:800; color:var(--pcl); }
  .tcards { flex:1 1 0; min-height:max(120px,250r); display:flex; align-items:stretch; }
  .tarw { flex:none; width:90r; align-self:center; height:22r; background:#3a4466; position:relative; margin-right:26r; } .tarw::after { content:""; position:absolute; right:-28r; top:-21r; border:32r solid transparent; border-left:30r solid #3a4466; border-right:0; } .tarw.lit { background:var(--gold); } .tarw.lit::after { border-left-color:var(--gold); }
  .tcd { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10r; padding:18r 14r; border-radius:20r; background:linear-gradient(var(--panel2), var(--panel)); border:6r solid var(--line); box-shadow:inset 0 5r 0 var(--hi), 0 8r 0 rgba(0,0,0,.4); position:relative; text-align:center; cursor:pointer; transition:transform .12s; }
  .tcd .ic { width:min(170r, 46%); height:auto; aspect-ratio:1; flex:0 1 auto; min-height:0; } .tcd .n { font-size:max(22px,38r); font-weight:900; line-height:1.15; } .tcd .pt { font-size:max(20px,28r); font-weight:800; color:var(--gold); white-space:nowrap; }
  .tcd .pb { flex:none; width:82%; height:max(10px,20r); margin-top:4r; position:relative; border-radius:8r; background:#0c1222; box-shadow:inset 0 0 0 3r var(--line); overflow:hidden; } .tcd .pb u { position:absolute; left:0; top:0; bottom:0; background:linear-gradient(#ffe08a, #f2b632); } .tcd.done .pb u { background:linear-gradient(#b6f08a, #6fbf3a); } .tcd.locked .pb, .tcd.off .pb, .tcd.barred .pb { opacity:.4; }
  .tcd .pt { display:flex; align-items:center; gap:6r; } .tcd .pt .ic { width:max(20px,34r); height:max(20px,34r); } .tcd .pt.lack { color:#ff8a78; } .tcd .lk { font-size:max(20px,24r); font-weight:800; color:#ff8a78; } .tcd.nav.focus .pt.lack, .tcd.nav.focus .lk { color:#a8201a; }
  .tcd.open { border-color:var(--gold); box-shadow:inset 0 5r 0 var(--hi), 0 0 0 4r rgba(242,182,50,.55), 0 0 34r 6r rgba(242,182,50,.35), 0 8r 0 rgba(0,0,0,.4); } .tcd.short { border-color:#55638d; }
  .tcd.unlock { animation:tUnlock .9s ease-out; } @keyframes tUnlock { 0% { transform:scale(.9) rotateY(90deg); filter:brightness(3); } 35% { transform:scale(1.14) rotateY(0); filter:brightness(2.2); } 100% { transform:scale(1); filter:none; } }
  .tdesc .ef.pop { animation:tPop .5s cubic-bezier(.2,1.6,.4,1); } @keyframes tPop { from { transform:scale(1.25); color:var(--gold2); } }
  .tnow .rp { flex:none; font-size:max(30px,60r); line-height:1; font-weight:900; color:var(--gold2); text-shadow:0 4r 0 rgba(0,0,0,.45); } .tnow .tip { margin-left:auto; flex:0 1 auto; min-width:0; overflow:hidden; color:var(--mut); } .tnow .tip.can { color:var(--gold); animation:blink 1.2s steps(2) infinite; }
  .tbar .seg span em { font-style:normal; font-size:max(20px,22r); color:#bff2ff; } .tbar .seg span.on em { color:#1d4a12; }
  .tcd .tier { position:absolute; left:14r; top:10r; font-size:max(20px,26r); font-weight:900; color:var(--mut); }
  .tcd .bdg { position:absolute; right:-14r; top:-14r; width:max(34px,72r); height:max(34px,72r); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:max(20px,36r); font-weight:900; font-style:normal; box-shadow:0 0 0 5r var(--line); background:#39425e; color:#cfd6ea; }
  .tcd .bdg.ok { background:#8fd45a; color:#12300a; } .tcd .bdg.go { background:var(--gold); color:var(--ink); } .tcd .bdg.x { background:var(--red); color:#fff; }
  .tcd .bdg.ring { background:radial-gradient(#16203a 54%, transparent 56%), conic-gradient(#7fd0ff var(--pg), #2a3a66 0); color:#fff; }
  .tcd .bdg.lock i { position:relative; width:46%; height:34%; margin-top:22%; border-radius:3r; background:#cfd6ea; } .tcd .bdg.lock i::before { content:""; position:absolute; left:16%; right:16%; bottom:92%; height:80%; border:max(3px,5r) solid #cfd6ea; border-bottom:0; border-radius:99r 99r 0 0; }
  .tcd .alt { position:absolute; left:50%; top:-20r; transform:translateX(-50%); padding:2r 18r; border-radius:10r; font-size:max(20px,24r); font-weight:900; white-space:nowrap; background:#b06ae0; color:#fff; box-shadow:0 0 0 4r var(--line); }
  .tcd.done { background:linear-gradient(#56683a, #3c4a2a); border-color:#8fd45a; } .tcd.doing { background:linear-gradient(#34466e, #283556); border-color:#7fd0ff; } .tcd.open { border-color:var(--gold); }
  .tcd.locked, .tcd.off, .tcd.barred { background:#1e2538; box-shadow:none; } .tcd.locked .ic, .tcd.off .ic, .tcd.barred .ic { filter:grayscale(1); opacity:.45; } .tcd.locked .n, .tcd.off .n, .tcd.barred .n { color:#8f99b5; } .tcd.locked .pt, .tcd.off .pt, .tcd.barred .pt { color:#8f99b5; } .tcd.barred .n { text-decoration:line-through; }
  .tcd.nav.focus .n, .tcd.nav.focus .pt, .tcd.nav.focus .tier { color:var(--ink); text-decoration:none; } .tcd.nav.focus { background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e);
  } .tcd.nav.focus { transform:scale(1.06); z-index:2; border-color:#fff; box-shadow:0 0 0 7r var(--gold), 0 0 40r 8r rgba(242,182,50,.45), 0 10r 0 rgba(0,0,0,.4); }
  /* 卡片下：效果大字 + 风味句 + 按钮 */
  .tdesc { flex:none; display:flex; align-items:center; gap:30r; min-height:max(96px,212r); padding:14r 26r; border-radius:16r; background:rgba(0,0,0,.28); box-shadow:inset 0 0 0 3r var(--line); }
  .tdesc .tx { flex:1; min-width:0; } .tdesc .ef { margin:0; font-size:max(22px,32r); line-height:1.38; font-weight:800; color:#fff; } .tdesc .fl { margin:8r 0 0; font-size:max(20px,22r); font-style:italic; font-weight:700; color:var(--mut); }
  .tdesc .wy { margin:8r 0 0; font-size:max(20px,26r); font-weight:800; color:#ffb35c; } .tdesc .wy.bad { color:var(--red); }
  .tdesc .go { flex:none; min-width:300r; min-height:max(44px,88r); display:flex; align-items:center; justify-content:center; gap:12r; padding:0 26r; border-radius:16r; font-size:max(22px,36r); font-weight:900; color:var(--ink); white-space:nowrap; background:linear-gradient(var(--gold2), var(--gold) 45%, #dc9a1e); box-shadow:inset 0 0 0 4r var(--line), 0 6r 0 rgba(0,0,0,.4); cursor:pointer; }
  .tdesc .go.cancel { background:linear-gradient(#f08a78, #d94a3a); color:#fff; } .tdesc .go.no { background:#39425e; color:#aab3cc; box-shadow:inset 0 0 0 4r var(--line); cursor:default; }
  /* 底：一行状态栏 */
  .tbar { justify-content:center; flex:none; display:flex; align-items:center; gap:26r; min-height:96r; padding:6r 26r; border-top:5r solid var(--line); background:rgba(0,0,0,.3); font-size:max(20px,28r); font-weight:800; white-space:nowrap; }
  .tbar .now { flex:1 1 0; min-width:0; display:flex; align-items:center; gap:14r; cursor:pointer; } .tbar .now .lb { color:var(--mut); flex:none; } .tbar .now b { font-size:max(20px,32r); font-weight:900; flex:none; } .tbar .now .bar { flex:1 1 60r; max-width:240r; min-width:40r; } .tbar .now em { font-style:normal; color:var(--gold2); flex:none; } .tbar .now.none b { color:var(--gold); animation:blink 1.2s steps(2) infinite; } .tbar .now .ic { width:44r; height:44r; }
  .tbar .fd { flex:none; display:flex; align-items:center; gap:12r; padding:0 24r; } .tbar .fd > .lbl { color:var(--mut); }
  .tbar .seg { display:flex; border-radius:14r; overflow:hidden; box-shadow:0 0 0 4r var(--line); } .tbar .seg span { display:flex; align-items:baseline; gap:8r; height:max(34px,64r); line-height:max(34px,64r); padding:0 20r; background:var(--bg2); color:var(--mut); cursor:pointer; border-left:3r solid var(--line); } .tbar .seg span:first-child { border-left:0; } .tbar .seg span b { color:var(--gold); font-size:max(20px,24r); }
  .tbar .seg span.on { background:linear-gradient(var(--gold2), var(--gold)); color:var(--ink); font-weight:900; } .tbar .seg span.on b { color:var(--ink); } .tbar .seg span.no:not(.on) { opacity:.45; }
  .tbar .fd small { font-size:max(20px,22r); color:var(--txt); cursor:pointer; display:flex; align-items:center; gap:8r; } .tbar .fd small b { color:var(--gold); }
  .tdesc .go.shake { animation:tShake .32s; } @keyframes tShake { 20% { transform:translateX(-10r); } 50% { transform:translateX(9r); } 80% { transform:translateX(-5r); } }
  .tp .th { overflow:hidden; } .tp .th .res { min-width:0; flex-shrink:1; overflow:hidden; white-space:nowrap; } .tp .th .hb { flex:none; }
  html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ttabs { width:470r; } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ttab b { white-space:normal; overflow:visible; hyphens:none; -webkit-hyphens:none; overflow-wrap:normal; line-height:1.05; font-size:max(20px,26r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ttab .dots i { width:max(10px,20r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ttabs .tg { white-space:normal; }
  /* X：说明浮层 */
  .tpop { position:absolute; left:50%; bottom:112r; transform:translateX(-50%); z-index:6; width:min(1100r, 92%); padding:22r 30r; border-radius:18r; background:#141a2c; box-shadow:0 0 0 5r var(--gold), 0 14r 40r rgba(0,0,0,.7); animation:tpIn .18s ease-out; } .tpop[hidden] { display:none; }
  .tpop h4 { margin:0 0 8r; font-size:max(22px,32r); color:var(--gold); } .tpop h4 + p { margin-top:0; } .tpop p { margin:6r 0 14r; font-size:max(20px,28r); line-height:1.4; font-weight:700; } .tpop .row { display:flex; justify-content:space-between; gap:20r; font-size:max(20px,28r); padding:4r 0; border-bottom:2r dashed #39425e; } .tpop .row b { color:var(--gold); } .tpop .row.sum { border-bottom:0; font-weight:900; }
  /* 720p 这类矮屏：状态栏去掉“研究经费”四个字，进度条收短 */
  #tech.compact .tbar .fd > .lbl { display:none; } #tech.compact .tbar { gap:16r; padding:6r 18r; } #tech.compact .tbar .fd { padding:0 16r; } #tech.compact .tbar .now .bar { max-width:120r; }
  #tech.compact .tnow { min-height:72r; } #tech.compact .tp .th .res .cost { display:none; }
  /* 手机横屏 */
  body.small:not(.narrow) .tnow { min-height:0; padding:4r 20r; gap:12r; } body.small:not(.narrow) .tnow .rp { font-size:max(26px,60r); } body.small:not(.narrow) .tnow .q, body.small:not(.narrow) .tp .th .res .cost { display:none; } body.small:not(.narrow) .tnow .ic { width:44r; height:44r; } body.small:not(.narrow) .tcd .pb { height:max(8px,14r); }
  body.small:not(.narrow) #tech { padding:14r 30r 14r !important; } body.small:not(.narrow) .tbar .fd small, body.small:not(.narrow) .tbar .fd > .lbl { display:none; } body.small:not(.narrow) .ttabs { width:430r; gap:6r; padding:8r 14r; } body.small:not(.narrow) .ttabs .tg { margin-top:8r; } body.small:not(.narrow) .ttabs .tg .ic, body.small:not(.narrow) .ttabs .tg .hd { display:none; }
  body.small:not(.narrow) .tmain { padding:44r 60r 8r 40r; gap:16r; } body.small:not(.narrow) .tcards { min-height:0; } body.small:not(.narrow) .tcd { padding:8r; gap:4r; } body.small:not(.narrow) .tmain h2 { display:none; } body.small:not(.narrow) .tdesc { min-height:0; padding:8r 20r; } body.small:not(.narrow) .tdesc .fl { display:none; } body.small:not(.narrow) .tp .th { height:auto; min-height:60r; }
  body.small:not(.narrow) .tbar { gap:14r; padding:4r 14r; } body.small:not(.narrow) .tbar .fd { padding:0 12r; } body.small:not(.narrow) .tbar .seg span { padding:0 12r; } body.small:not(.narrow) .tcd .tier { display:none; }
  body.narrow .tnow { flex-wrap:wrap; white-space:normal; gap:6r 14r; padding:10r 16r; } body.narrow .tnow .tip { flex:1 1 100%; margin-left:0; white-space:normal; } body.narrow .tnow .q, body.narrow .tp .th .res .cost { display:none; } body.narrow .tnow .big { flex:1 1 100%; order:9; } body.narrow .tnow .ic { width:48r; height:48r; } body.narrow .tp .th .res { display:none; }
  /* 手机竖屏：页签变成顶部横向滚动条；状态栏折成三行 */
  body.narrow #tech { padding:12r 12r 16r; } body.narrow .tp .tb { flex-direction:column; }
  body.narrow .ttabs { width:auto; flex-direction:row; align-items:center; justify-content:flex-start; overflow-x:auto; gap:10r; padding:12r 14r; border-right:0; border-bottom:5r solid var(--line); scrollbar-width:none; } body.narrow .ttabs::-webkit-scrollbar { display:none; }
  body.narrow .ttabs .tg { margin:0 0 0 14r; flex:none; } body.narrow .ttabs .tg:first-child { margin-left:0; } body.narrow .ttabs .tg span { display:none; } body.narrow .ttab { min-height:92r; padding:0 16r; border-left-width:8r; } body.narrow .ttab b { flex:none; }
  body.narrow .tmain { padding:16r 16r 10r; overflow-y:auto; } body.narrow .tcards { flex:1 1 330r; min-height:330r; max-height:560r; } body.narrow .tp .th { gap:10r; padding-left:16r; } body.narrow .tp .th > span { display:none; } body.narrow .tarw { width:20r; height:14r; margin-right:20r; } body.narrow .tarw::after { right:-20r; top:-13r; border-width:20r; border-left-width:20r; } body.narrow .tcd { padding:26r 6r 14r; border-width:4r; } body.narrow .tcd .ic { width:54%; } body.narrow .tcd .bdg { right:-8r; top:-12r; } body.narrow .tcd .tier { display:none; }
  body.narrow .tdesc { flex-direction:column; align-items:stretch; gap:14r; padding:16r 18r; } body.narrow .tdesc .go { min-width:0; }
  body.narrow .tbar { flex-wrap:wrap; gap:10r 14r; padding:10r 16r; white-space:normal; } body.narrow .tbar .now { flex:1 1 100%; } body.narrow .tbar .fd { flex:1 1 100%; flex-wrap:wrap; border:0; padding:0; } body.narrow .tbar .fd > .lbl { display:none; } body.narrow .tbar .fd small { flex:1 1 100%; justify-content:center; } body.narrow .tbar .seg { flex:1; } body.narrow .tbar .seg span { flex:1; justify-content:center; padding:0 6r; } body.narrow .tpop { bottom:20r; }
  `);
  const T = {};
  T.open = (G, onClose) => {
    const C = G.C, D = G.D, sfx = G.sfx, p = G.S.turn;
    const safe = (f, d) => { try { const v = f(); return v == null ? d : v; } catch (e) { console.error(e); return d; } };
    let lines = [], all = {}, rate = null, funds = [], li = -1, sel = {}, pop = '', closing = false, justId = '';
    Kit.note('');   // 打开时清掉上一个画面留下的浮动提示
    const curIt = () => { const ln = lines[li]; return ln && (ln.items || [])[sel[ln.line] || 0]; };
    const rpNow = () => rate && rate.rp != null ? rate.rp : safe(() => G.S.rp[p], 0);
    function close() { if (closing) return; closing = true; sfx.back(); scr.el.classList.add('out'); setTimeout(() => scr.close(), 150); }
    const scr = Kit.screen({
      id: 'tech', html: `<div class="tp pn"><div class="th" style="${Kit.pcs(p)}">${Kit.ic('tech')}${esc(tt('科技研究'))}<span>${esc(G.pname(p))}</span><div class="res" id="tres"></div><i class="hb" id="thpop">${esc(tt('研究点来源'))}</i><i class="hb" id="thx">${esc(tt('关闭'))}</i></div><div class="tnow" id="tnow"></div><div class="tb"><div class="ttabs" id="ttabs"></div><div class="tmain" id="tmain"></div></div><div class="tbar" id="tbar"></div><div class="tpop" id="tpop" hidden></div></div>`, onClose,
      onCancel: () => { if (pop) { sfx.back(); setPop(''); } else close(); },
      onFocus: b => { if (!b.dataset.id) return; Kit.note(''); const ln = lines[li]; if (ln) sel[ln.line] = Math.max(0, (ln.items || []).findIndex(x => x.id === b.dataset.id)); desc(); Kit.paintHints(true); },
      keys: { up: () => line(-1), down: () => line(1), left: () => { setPop(''); Nav.move('left'); }, right: () => { setPop(''); Nav.move('right'); }, lb: () => fund(-1), rb: () => fund(1), x: () => { sfx.tick(); setPop(pop ? '' : 'all'); } },
      // 上下（键盘另有 Tab / Shift+Tab）在左边的科技线之间移动；Q / E（手柄 LB / RB）调研究经费的档位；左右在这一条线的各级之间移动
      hints: () => Kit.ptr() ? [] : [['a', actOf(curIt())[1], false, true], ['b', '关闭'], ['x', '研究点来源'], ['ud', Kit.dev === 'key' ? '切换科技线（或 Tab）' : '切换科技线'], ['lbrb', '研究经费']],   // 鼠标、触屏：按钮都在面板上（右上角“研究点来源”“关闭”）
    });
    // Tab 在全局是“下一个”（和 E 一样映射成 rb，见 ui.js 的 KEYS），到这一页会变成调经费。这里抢在全局映射之前把 Tab 单独接住：
    // Tab = 下一条科技线，Shift+Tab = 上一条；Q / E 照旧走 lb / rb 调经费。页面关掉（或被别的页面盖住）就不管
    const onTab = e => {
      if (!scr.on) { removeEventListener('keydown', onTab, true); return; }
      if (e.key !== 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = Nav.top(); if (!t || t.el !== scr.el) return;
      e.preventDefault(); e.stopImmediatePropagation(); Kit.setDev('key'); Kit.wake();
      if (!closing) line(e.shiftKey ? -1 : 1);
    };
    addEventListener('keydown', onTab, true);
    $('thx').onclick = close; $('thpop').onclick = () => { sfx.tick(); setPop(pop ? '' : 'all'); };
    // 科技是“攒研究点、点数够了立即解锁”。这张卡片按确定会做什么：[样式, 按钮文字]
    function actOf(it) {
      if (!it) return ['no', ''];
      if (it.state === 'open') return ['', tt('解锁（{n} 研究点）', { n: it.need })];
      if (it.state === 'short') return ['no', tt('还需 {n} 研究点', { n: it.lack != null ? it.lack : Math.max(0, it.need - rpNow()) })];
      return ['no', it.state === 'done' ? tt('已解锁') : it.state === 'barred' ? tt('不可解锁') : it.state === 'off' ? tt('已关闭') : tt('未解锁')];
    }
    // 卡片图标：按这项科技改的是什么（攻击、防御、移动、视野、造价、修理、占领、技能……）
    const RIC = { gang: 'sword', splashBy: 'sword', pierce: 'aim', fleet: 'ship', carrierAir: 'plane', cityGun: 'aim', luckOn: 'aim', repairPlus: 'fix', regenOn: 'heart', roadMarch: 'boot', flatOn: 'boot', capNoFog: 'cap', levy: 'flag', meterGain: 'power', meterFoe: 'power', spy: 'eye', seeProps: 'eye', cityTax: 'coin', mineBonus: 'coin', capBonus: 'coin', buildCapOn: 'crate', bornStars: 'star' };
    const MIC = [['atk', 'sword'], ['def', 'shield'], ['defOn', 'shield'], ['move', 'boot'], ['range', 'aim'], ['vision', 'eye'], ['cost', 'coin'], ['repair', 'fix'], ['carry', 'load']];
    function iconOf(it) {
      const T0 = safe(() => (D.TECH || []).find(x => x.id === it.id), null) || {}, m = {};
      if (it.tree === 'co' && it.tier === 3) return 'power';
      (T0.mods || []).forEach(o => Object.keys(o).forEach(k => { m[k] = 1; }));
      for (const [k, ic] of MIC) if (m[k]) return ic;
      for (const k in T0.rules || {}) if (RIC[k]) return RIC[k];
      return 'tech';
    }
    const colOf = tree => tree === 'co' ? Kit.pcs(p) : typeof tree === 'number' ? Kit.pcs(tree) : '--pc:#7f8db8;--pcd:#2e3855;--pcl:#cfd6ea';
    function groups() {
      const co = G.coOf(p), fac = (lines.find(l => typeof l.tree === 'number') || {}).tree || 0, F = D.FACTIONS && D.FACTIONS[fac];
      return [['common', tt('通用科技'), Kit.ic('tech'), tt('所有阵营均可研究。')],
        [fac, tt('{name}科技', { name: F ? F.name : tt('阵营') }), Kit.emblem(fac), (F && F.research ? tt('{name}：{desc}', { name: F.research.name, desc: F.research.desc }) + ' ' : '') + tt('两条科技线的第 3 级只能选一条。')],
        ['co', tt('{name}专属', { name: co ? co.name : tt('指挥官') }), co ? Kit.head(co.id, p, 36) : '', tt('第 3 级强化指挥官技能。')]];
    }
    function tabs() {
      const co = G.coOf(p);
      let h = '';
      for (const [tree, title, icon] of groups()) {
        const ls = lines.map((l, i) => [l, i]).filter(x => x[0].tree === tree); if (!ls.length) continue;
        h += `<div class="tg" style="${colOf(tree)}">${icon}<span>${esc(title)}</span></div>`;
        for (const [ln, i] of ls) {
          const its = ln.items || [], ic = tree === 'co' && co ? Kit.head(co.id, p, 56) : Kit.ic(iconOf(its[0] || {}));
          // 三段小进度条：每段一级，解锁了就填满；这条线上有买得起的科技时页签有脉冲光
          h += `<div class="ttab${i === li ? ' on' : ''}${its.some(it => it.state === 'open') ? ' pulse' : ''}" data-l="${i}" style="${colOf(tree)}">${ic}<b>${esc(tree === 'co' ? tt('专属') : String(ln.name))}</b><span class="dots">${its.map(it => `<i class="${it.state === 'done' ? 'done' : ''}"><u style="width:${it.state === 'done' ? 100 : 0}%"></u></i>`).join('')}</span></div>`;
        }
      }
      $('ttabs').innerHTML = h; Kit.hydrate($('ttabs'));
      $('ttabs').querySelectorAll('.ttab').forEach(b => { b.onclick = () => { if (+b.dataset.l !== li) { sfx.tick(); li = +b.dataset.l; setPop(''); tabs(); main(); } }; });
      const on = $('ttabs').querySelector('.ttab.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    function cardHtml(it) {
      const st = it.state;
      const bdg = st === 'done' ? '<i class="bdg ok">✓</i>' : st === 'open' ? '<i class="bdg go">＋</i>' : st === 'short' ? '' : st === 'barred' ? '<i class="bdg x">✕</i>' : '<i class="bdg lock"><i></i></i>';
      const alt = typeof it.tree === 'number' && it.tier === 3 && lines.filter(l => l.tree === it.tree).length > 1 ? `<span class="alt">${esc(tt('二选一'))}</span>` : '';
      const pts = st === 'done' ? `<span class="pt">${esc(tt('已解锁'))}</span>` : `<span class="pt${st === 'short' ? ' lack' : ''}">${Kit.ic('tech', 's')}${it.need}</span>` + (st === 'short' ? `<span class="lk">${esc(tt('还需 {n} 点', { n: it.lack }))}</span>` : '');
      return `<div class="nav tcd ${st}${it.id === justId ? ' unlock' : ''}" data-id="${esc(it.id)}"><span class="tier">${esc(tt('第 {n} 级', { n: it.tier }))}</span>${alt}${bdg}${Kit.ic(iconOf(it), 'xl')}<span class="n">${esc(it.name)}</span>${pts}</div>`;
    }
    function main() {
      const ln = lines[li]; if (!ln) { $('tmain').innerHTML = `<h2>${esc(tt('这一局没有开启科技'))}</h2>`; return; }
      const its = ln.items || [], g = groups().find(x => x[0] === ln.tree) || [];
      $('tmain').style.cssText = colOf(ln.tree);
      $('tmain').innerHTML = `<h2>${esc(ln.tree === 'co' ? g[1] : String(ln.name))}<small>${esc(ln.tree === 'co' ? '' : g[1] || '')}</small></h2>${g[3] ? `<p class="gsub">${esc(g[3])}</p>` : ''}<div class="tcards">` + its.map((it, i) => (i ? `<span class="tarw${its[i - 1].state === 'done' ? ' lit' : ''}"></span>` : '') + cardHtml(it)).join('') + `</div><div class="tdesc" id="tdesc"></div>`;
      Kit.hydrate($('tmain'));
      $('tmain').querySelectorAll('.tcd').forEach(b => { b.dataset.tap2 = ''; b.onclick = () => pick(all[b.dataset.id]); });   // 触屏：第一下只选中，第二下（或下面的按钮）才解锁
      const cards = $('tmain').querySelectorAll('.tcd'); let i = sel[ln.line];
      if (i == null) { i = its.findIndex(x => x.state === 'open'); if (i < 0) i = its.findIndex(x => x.state === 'short'); if (i < 0) i = 0; }
      Nav.top().f = null; if (cards[i]) Nav.focus(cards[i]); else desc();
    }
    function desc() {
      const it = curIt(), el = $('tdesc'); if (!el) return; if (!it) { el.innerHTML = ''; return; }
      const a = actOf(it), why = it.state === 'locked' || it.state === 'barred' || it.state === 'off' ? (it.why || tt('要先解锁前一级')) : '';
      el.innerHTML = `<div class="tx"><p class="ef${it.id === justId ? ' pop' : ''}">${esc(it.desc || '')}</p>${why ? `<p class="wy${it.state === 'barred' ? ' bad' : ''}">${esc(why)}</p>` : ''}${it.moot && it.mootWhy ? `<p class="wy">${esc(it.mootWhy)}</p>` : ''}${it.flavor ? `<p class="fl">${esc(it.flavor)}</p>` : ''}</div><div class="go ${a[0]}" id="tgo">${a[0] === 'no' ? '' : Kit.cap('a')}${esc(a[1])}</div>`;
      $('tgo').onclick = () => pick(it);
    }
    function bar() {
      const cf = funds.find(f => f.current) || {}, fundsNow = safe(() => G.S.funds[p], 0);
      const its = Object.values(all), can = its.filter(it => it.state === 'open'), near = its.filter(it => it.state === 'short').sort((a, b) => a.lack - b.lack)[0];
      // 顶部右侧：金币、这一档每回合花多少
      $('tres').innerHTML = `<span>${Kit.ic('coin', 's')}<b>${fundsNow}</b></span><span class="cost" title="${esc(tt('每回合研究经费'))}">${Kit.ic('tech', 's')}<b>${esc(tt('−{n}/回合', { n: (rate && rate.fund ? rate.fund.cost : cf.cost) || 0 }))}</b></span>`;
      // 标题栏下面：现有研究点（大数字）、每回合进账（X 看来源）、现在买得起几项 / 离最近的一项还差多少
      $('tnow').className = 'tnow';
      $('tnow').innerHTML = `${Kit.ic('tech')}<span class="lb">${esc(tt('研究点'))}</span><b class="rp" id="trp">${rpNow()}</b><span class="rt" id="trate">${esc(tt('每回合 +{n}', { n: rate ? rate.total : (cf.pts || 0) }))}${Kit.cap('x')}</span>` +
        `<span class="tip${can.length ? ' can' : ''}">${esc(can.length ? tt('可解锁 {n} 项科技', { n: can.length }) : near ? tt('再积累 {n} 研究点可解锁「{name}」', { n: near.lack, name: near.name }) : '')}</span>`;
      $('tnow').onclick = e => { if (e.target.closest('#trate')) { sfx.tick(); setPop(pop ? '' : 'all'); } };
      // 底栏：经费档位（每回合花多少资金、换多少研究点）
      $('tbar').innerHTML = `<div class="fd"><span class="lbl">${esc(tt('研究经费'))}</span>${Kit.cap('lb')}<div class="seg">${funds.map(f => `<span class="${f.current ? 'on' : ''}${f.ok === false ? ' no' : ''}" data-f="${esc(f.id)}">${esc(f.name)}<b>${f.cost}</b><em>+${f.pts}</em></span>`).join('')}</div>${Kit.cap('rb')}</div>`;
      $('tbar').querySelectorAll('.seg span').forEach(b => { b.onclick = () => { if (safe(() => C.setFund(G.S, p, b.dataset.f), false)) { sfx.tick(); paint(); } else sfx.no(); }; });
    }
    // 说明浮层：研究点每回合从哪里来 + 这条线所在组的说明
    function setPop(k) {
      pop = k; const el = $('tpop'); if (!el) return; if (!k) { el.hidden = true; return; }
      const gs = groups(), ln = lines[li], g = gs.find(x => ln && x[0] === ln.tree);
      const part = x => { const l = String(x.label || ''); return `<div class="row"><span>${esc(l.replace(/\s*[+＋]\s*\d+\s*$/, ''))}</span><b>+${x.pts}</b></div>`; };
      let h = `<h4>${esc(tt('研究点来源'))}</h4>` + ((rate && rate.parts) || []).map(part).join('') + `<div class="row sum"><span>${esc(tt('每回合开始时获得'))}</span><b>+${rate ? rate.total : 0}</b></div><p>${esc(tt('研究点够一项科技所需的点数时就能立即解锁，一回合可以连续解锁多项。'))}</p>`;
      if (g) h += `<h4>${esc(g[1])}</h4><p>${esc(g[3])}</p>`;
      el.innerHTML = h; el.hidden = false;
    }
    function paint() {
      scr.el.classList.toggle('compact', innerHeight < 900 && !document.body.classList.contains('small'));
      lines = safe(() => C.techLines(G.S, p), []); funds = safe(() => C.fundLevels(G.S, p), []); rate = safe(() => C.techRate(G.S, p), null);
      all = {}; lines.forEach(ln => (ln.items || []).forEach(it => { if (it.lack == null) it.lack = Math.max(0, (it.need || 0) - rpNow()); all[it.id] = it; }));
      if (li < 0 || li >= lines.length) { li = Math.max(0, lines.findIndex(l => (l.items || []).some(it => it.state === 'open'))); }
      tabs(); main(); bar(); if (pop) setPop(pop);
    }
    function line(d) { if (!lines.length) return; setPop(''); li = (li + d + lines.length) % lines.length; sfx.tick(); tabs(); main(); }
    function pick(it) {
      if (!it) return;
      const unlock = C.unlockTech || C.research;
      if (it.state === 'open' && unlock && safe(() => unlock(G.S, p, it.id), false)) {
        // 解锁演出：卡片翻亮、号角、效果文字弹一下；焦点移到同一条线的下一级
        (sfx.fanfare || sfx.ok)(); justId = it.id; paint();
        const ln = lines[li], i = ln ? ln.items.findIndex(x => x.id === it.id) : -1, was = it.id;
        setTimeout(() => { if (!scr.on || justId !== was) return; justId = ''; if (ln && lines[li] === ln && ln.items[i + 1] && ln.items[i + 1].state !== 'barred') { sel[ln.line] = i + 1; main(); } else { const c = scr.el.querySelector('.tcd.unlock'); if (c) c.classList.remove('unlock'); } }, 900);
        return;
      }
      sfx.no();
      // 点数不够：按钮上已经写着“还差 N 研究点”，不再另弹一条提示（那条提示会留一秒多，焦点换到别的卡片后就浮在“解锁”按钮旁边）；按钮抖一下
      if (it.state === 'short') { const g = $('tgo'); if (g) { g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake'); } return; }
      Kit.note(it.why || safe(() => C.canUnlock ? C.canUnlock(G.S, p, it.id) : C.canResearch && C.canResearch(G.S, p, it.id), '') || (it.state === 'done' ? tt('这项科技已解锁') : tt('现在不能解锁这项科技')));
    }
    function fund(d) {
      const i = funds.findIndex(f => f.current), n = funds[Math.max(0, Math.min(funds.length - 1, (i < 0 ? 0 : i) + d))];
      if (n && !n.current && safe(() => C.setFund(G.S, p, n.id), false)) { sfx.tick(); paint(); } else sfx.no();
    }
    paint(); return scr;
  };
  root.AWTech = T;
})(window);
