// 潮汐战线：对局里的面板（window.AWBattle(G)）。G 是 ui.js 交过来的对局数据和函数。
// 常驻的三块（HUD）：左上阵营牌、右下信息牌、选目标时的伤害预览牌；另有横幅、淘汰提示。
// 菜单：贴着单位的行动菜单、屏幕中央的回合菜单、造兵、战况、详情卡、换人、胜负。全部用 ui-kit.js 的部件，一屏只做一件事。
(function (root) {
  'use strict';
  root.AWBattle = function (G) {
    // 对局里的颜色、徽记、头像底色、单位贴图一律按“这个席位扮演的阵营”取（G.fac）
    // 徽记、阵营名按阵营（G.fac）；颜色按席位（G.pcs / G.pal：同阵营对打时第二个席位是变体色）；单位、建筑小图把席位的颜色编码交给素材（G.artCode）
    const pcs = p => G.pcs(p), palS = p => G.pal(p), embS = (p, c) => Kit.emblem(G.fac(p), c), headS = (id, p, px, mood) => { const f = G.fac(p); return Kit.head(id, f, px, mood).replace(Kit.pcs(f), G.pcs(p)); }, unitS = (t, o, px, ex) => Kit.unit(t, G.artCode(o), px, ex);
    const { D, C, Kit, sfx } = G, esc = Kit.esc, Nav = Kit.Nav, $ = id => document.getElementById(id);
    const tt = Kit.t;   // 界面文字走翻译（这个文件里 T 已经是地形表的局部变量名，所以叫 tt）
    // 一句话中间夹着 HTML：占位符先填 \u0001、\u0002…，整句翻完、esc 之后再换成拼好的 HTML；wrap 给两边的固定文字套标签
    const th = (s, html, wrap) => esc(s).split(/([\u0001-\u0008])/).map(x => x.length === 1 && x.charCodeAt(0) < 9 ? html[x.charCodeAt(0) - 1] : wrap ? wrap(x) : x).join('');
    const mutWrap = x => x.replace(/^(\s*)([\s\S]*?)(\s*)$/, (m, a, b, c) => b ? `${a}<span class="mut">${b}</span>${c}` : m);
    Kit.css(`
    .hud { position:fixed; z-index:5; }
    #hudS:not(.hbar) { left:24r; top:24r; display:flex; align-items:center; gap:22r; padding:16r 30r 16r 16r; min-width:470r; cursor:pointer; border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); }
    #hudS:not(.hbar).r { left:auto; right:116r; } #hudS:not(.hbar) .hd { width:150r; height:150r; }
    #hudS:not(.hbar) .fn { font-size:max(26px,46r); font-weight:900; color:var(--pcl); line-height:1.1; display:flex; align-items:center; gap:12r; text-shadow:0 3r 0 var(--line); } #hudS:not(.hbar) .fn em { font-style:normal; font-size:max(20px,28r); padding:2r 12r; border-radius:8r; background:var(--gold); color:var(--ink); text-shadow:none; }
    #hudS:not(.hbar) .dy { font-size:max(20px,30r); margin:4r 0; } #hudS:not(.hbar) .fd { display:flex; align-items:center; gap:10r; font-size:max(24px,40r); font-weight:900; color:var(--gold2); }
    #hudS:not(.hbar) .mt { display:flex; align-items:center; gap:10r; margin-top:6r; } #hudS:not(.hbar) .bar { width:230r; }
    #hudS:not(.hbar) .ti { position:absolute; right:-10r; top:-24r; display:flex; align-items:center; gap:6r; padding:2r 16r 2r 8r; border-radius:12r; background:var(--line); color:var(--gold2); font-size:max(20px,24r); animation:blink 1.2s steps(2) infinite; }
    #hudS:not(.hbar) .fd .ore { display:flex; align-items:center; gap:6r; margin-left:22r; color:#9fe8ff; } #hudS .flt { position:absolute; left:55%; bottom:20r; display:flex; align-items:center; gap:6r; font-size:max(24px,40r); font-weight:900; color:#9fe8ff; text-shadow:0 3r 0 var(--line); animation:fltUp 1.6s ease-out both; pointer-events:none; } @keyframes fltUp { from { opacity:0; transform:translateY(20r); } 20% { opacity:1; } to { opacity:0; transform:translateY(-70r); } }
    #hudA { left:24r; top:236r; padding:10r 26r; font-size:max(20px,30r); color:var(--gold2); animation:blink 1s steps(2) infinite; } #hudA.r { left:auto; right:116r; }
    #hudO { left:24r; top:250r; max-width:640r; padding:8r 18r 10r; cursor:pointer; font-size:max(20px,28r); line-height:1.35; } #hudO.r { left:auto; right:116r; } #hudO.low { top:320r; }
    #hudO b { display:flex; align-items:center; gap:8r; color:var(--gold); font-size:max(20px,24r); } #hudO b i { font-style:normal; margin-left:auto; padding-left:20r; color:var(--mut); } #hudO em { font-style:normal; color:var(--gold2); margin-left:14r; font-weight:900; white-space:nowrap; } #hudO b small { font-size:max(20px,20r); color:var(--mut); font-weight:700; margin-left:8r; } #hudO b.ls { margin-top:6r; padding-top:6r; border-top:3r solid var(--line); color:#ffb0a0; } #hudO .lz { color:#d9c2bc; font-size:max(20px,24r); } #hudO .flood { color:#9fd4ff; font-size:max(20px,24r); } #hudO .bad { color:#ffb0a0; } #hudO .good { color:var(--green); }
    body.narrow #hudO { top:270r; max-width:92vw; }
    #hudI:not(.hbar) { right:24r; bottom:24r; display:flex; flex-direction:column; gap:10r; padding:18r 22r; min-width:400r; max-width:620r; cursor:pointer; border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); }
    body.hint-on #hudI:not(.hbar) { bottom:104r; } body[data-dev=touch].hint-on #hudI:not(.hbar) { bottom:max(100px,112r,calc(var(--hintTop, 0px) + 8px)); } #hudI:not(.hbar).l { right:auto; left:24r; } #hudI:not(.hbar) .rw { display:flex; align-items:center; gap:18r; } #hudI:not(.hbar) .rw + .rw { border-top:4r solid var(--line); padding-top:10r; }
    #hudI:not(.hbar) .bx { flex:none; width:104r; height:104r; display:flex; align-items:flex-end; justify-content:center; border-radius:12r; background:var(--bg2); box-shadow:inset 0 0 0 4r var(--line); overflow:hidden; }
    #hudI:not(.hbar) .n { font-size:max(24px,42r); font-weight:900; line-height:1.15; display:flex; align-items:baseline; gap:14r; white-space:nowrap; } #hudI:not(.hbar) .n small { font-size:max(20px,26r); color:var(--pcl); }
    #hudI:not(.hbar) .d { display:flex; align-items:center; gap:10r; font-size:max(20px,32r); white-space:nowrap; min-height:44r; } #hudI:not(.hbar) .chips { max-width:580r; }
    #hudI:not(.hbar) .tip { display:flex; gap:8r; align-items:flex-start; max-width:560r; font-size:max(20px,24r); line-height:1.3; color:#9fe8ff; }
    #hudI:not(.hbar) .xh { position:absolute; right:14r; top:-34r; display:flex; align-items:center; gap:8r; padding:4r 16r 4r 8r; border-radius:12r; background:var(--line); font-size:max(20px,24r); color:var(--txt); } #hudI:not(.hbar) .xh .kc { min-width:40r; height:40r; font-size:max(20px,22r); }
    #hudF { padding:16r 24r; display:flex; flex-direction:column; align-items:center; gap:6r; border-color:var(--red); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); pointer-events:none; z-index:6; }
    #hudF .fx { display:flex; align-items:center; gap:14r; } #hudF .ar { font-size:44r; color:var(--gold); } #hudF .dm { font-size:max(40px,80r); font-weight:900; color:#ff8a5c; line-height:1; text-shadow:0 5r 0 var(--line); min-width:190r; text-align:center; white-space:nowrap; }
    #hudF .ct { display:flex; align-items:center; gap:14r; font-size:max(20px,32r); white-space:nowrap; } #hudF .ct b { color:#6fc3ff; font-weight:900; }
    #hudF .eg { padding:2r 16r; border-radius:10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-weight:900; } #hudF .ft { font-size:max(20px,30r); color:var(--gold); font-weight:900; }
    /* 精简的战场信息（默认）：顶边一条窄栏（阵营、天数、资金、碎片、研究点、技能槽），底边一条信息条（地形 ｜ 单位）。半透明、下缘切角，不用厚边框。
       光标或选中的单位靠近时整条滑到另一侧。完整的大牌子在设置里换（steel-tide.hud = full） */
    .hbar { left:0; right:auto; display:flex; align-items:center; gap:18r; height:80r; padding:0 30r 0 0; white-space:nowrap; cursor:pointer; isolation:isolate; font-size:max(24px,38r); font-weight:900; line-height:1; color:var(--txt); transition:transform .22s cubic-bezier(.2,.8,.2,1), opacity .15s; filter:drop-shadow(0 5r 0 rgba(0,0,0,.35)); }
    .hbar::before { content:""; position:absolute; inset:0; z-index:-1; background:linear-gradient(rgba(42,50,76,.9), rgba(14,18,32,.88)); box-shadow:inset 0 -4r 0 var(--pc, var(--gold)); }
    #hudS.hbar { top:0; } #hudS.hbar::before { clip-path:polygon(0 0, 100% 0, 100% calc(100% - 18r), calc(100% - 18r) 100%, 18r 100%, 0 calc(100% - 18r)); }
    #hudI.hbar { bottom:0; padding:0 22r 0 14r; gap:12r; min-width:0; max-width:none; flex-direction:row; } #hudI.hbar::before { box-shadow:inset 0 4r 0 var(--gold); clip-path:polygon(18r 0, calc(100% - 18r) 0, 100% 18r, 100% 100%, 0 100%, 0 18r); }
    body.hint-on #hudI.hbar { bottom:104r; } body[data-dev=touch].hint-on #hudI.hbar { bottom:max(100px,112r,calc(var(--hintTop, 0px) + 8px)); } body.narrow.hint-on #hudI.hbar { bottom:max(72px,150r,calc(var(--hintTop, 0px) + 8px)); }
    .hbar .ic.s { width:42r; height:42r; } body.narrow .hbar { height:60r; gap:16r; padding:0 26r 0 0; font-size:max(20px,28r); } body.narrow .hbar .ic.s { width:32r; height:32r; } .hbar .sp { flex:none; width:3r; height:38r; background:rgba(255,255,255,.18); }
    .hbar .who { display:flex; align-items:center; gap:12r; align-self:stretch; padding:0 30r 0 10r; background:linear-gradient(90deg, var(--pc), var(--pcd)); clip-path:polygon(0 0, 100% 0, calc(100% - 18r) 100%, 0 100%); color:#fff; text-shadow:0 3r 0 rgba(0,0,0,.45); }
    .hbar .who .hd { width:46r !important; height:46r !important; border-radius:50%; border-width:3r; } .hbar .who .ic { width:44r; height:44r; } .hbar .who em { font-style:normal; font-size:max(20px,22r); padding:2r 10r; background:var(--gold); color:var(--ink); text-shadow:none; }
    .hbar .dy { color:var(--mut); font-weight:800; } .hbar .fd, .hbar .ore, .hbar .mt, .hbar .o1, .hbar .sg { display:flex; align-items:center; gap:6r; } .hbar .fd { color:var(--gold2); } .hbar .ore { position:relative; color:#9fe8ff; } .hbar .ore.rp { color:#b8f0a0; }
    .hbar .ore.can { color:var(--gold2); } .hbar .ore .nb { font-style:normal; display:inline-flex; align-items:center; justify-content:center; min-width:28r; height:28r; margin-left:2r; border-radius:50%; background:var(--gold); color:var(--ink); font-size:max(20px,22r); animation:blink 1s steps(2) infinite; }
    .hbar .mt .bar { width:120r; min-width:0; height:16r; border-radius:0; } .hbar .mt .bar > i { left:2r; top:2r; bottom:2r; border-radius:0; } .hbar .mt b { color:var(--gold2); } .hbar .mt.full { filter:drop-shadow(0 0 8r var(--gold)); } .hbar .mt.full .ic { animation:blink .5s steps(2) infinite; }
    .hbar .oth { display:flex; align-items:center; gap:14r; padding-left:14r; border-left:3r solid rgba(255,255,255,.18); font-size:max(20px,24r); } .hbar .o1 { gap:4r; color:var(--pcl); } .hbar .o1 .ic { width:26r; height:26r; }
    .hbar .ai { color:var(--gold2); font-size:max(20px,24r); animation:blink 1s steps(2) infinite; }
    #hudS.hbar .flt { left:38%; top:100%; bottom:auto; margin-top:6r; animation-name:fltDn; } @keyframes fltDn { from { opacity:0; transform:translateY(-14r); } 20% { opacity:1; } to { opacity:0; transform:translateY(40r); } }
    body.narrow #hudI.hbar { max-width:100%; } body.narrow #hudI.hbar .sg { min-width:0; overflow:hidden; } body.narrow #hudI.hbar .sg > * { flex:none; } body.narrow #hudI.hbar .more, body.narrow #hudI.hbar .sp { flex:none; }
    /* 窄屏顶栏放不下“电脑行动中…”：挂在顶栏下面 */ body.narrow #hudS.hbar .ai { position:absolute; left:0; top:100%; margin-top:6r; padding:6r 16r; background:rgba(14,18,32,.88); }
    .hbar .sg b { color:var(--pcl); } .hbar .sg.tr b { color:var(--txt); } .hbar .sg small { font-size:max(20px,22r); color:var(--pcl); font-weight:800; } .hbar .sg canvas { height:46r !important; width:auto !important; } .hbar .stars { font-size:max(20px,24r); }
    .hbar .cp { display:flex; align-items:center; gap:4r; color:var(--gold); } .hbar .hp { color:var(--txt); } .hbar .hp.bad { color:#ff8a5c; } .hbar .tip { display:flex; align-items:center; gap:4r; color:#9fe8ff; font-size:max(20px,24r); font-weight:800; }
    .hbar .mk { display:inline-flex; align-items:center; gap:2r; height:34r; padding:0 8r; background:rgba(10,14,28,.7); box-shadow:inset 0 0 0 2r var(--line); font-size:max(20px,22r); font-weight:800; color:#fff2a8; } .hbar .mk.good { color:var(--green); } .hbar .mk.bad { color:#ff8a5c; } .hbar .mk.ore { color:#ffd0a0; } .hbar .mk.vl { color:#9fe8ff; } .hbar .mk .ic.s { width:24r; height:24r; }
    .hbar .more { color:var(--gold); font-size:max(20px,30r); }
    /* 运输单位里装着的单位：底条上接在单位后面，一个箱子图标领着，逐个列出 */
    .cg1 { display:inline-flex; align-items:center; gap:6r; white-space:nowrap; } .cg1 b { color:var(--pcl); font-weight:900; } .cg1 .hp.bad { color:#ff8a5c; } .cg1 .stars { font-size:max(20px,24r); }
    .hbar .cg { display:flex; align-items:center; gap:12r; padding-left:12r; border-left:3r solid rgba(255,255,255,.18); font-size:max(20px,24r); } .hbar .cg canvas { height:40r !important; width:auto !important; } .hbar .cg .cg1 + .cg1 { padding-left:12r; border-left:2r dotted rgba(255,255,255,.25); }
    body.narrow .hbar .cg .cg1 b { display:none; } body.narrow .hbar .cg { gap:8r; padding-left:8r; }
    #hudI:not(.hbar) .cgl { display:flex; flex-wrap:wrap; align-items:center; gap:8r 18r; border-top:4r solid var(--line); padding-top:10r; font-size:max(20px,28r); }
    .detail .dcg { display:flex; flex-direction:column; gap:10r; } .detail .dcg h4 { margin:0; display:flex; align-items:center; gap:10r; font-size:max(20px,26r); color:var(--mut); font-weight:800; } .detail .dcg h4 em { font-style:normal; color:var(--gold); }
    .detail .dcg .cgl { display:flex; flex-wrap:wrap; gap:12r; } .detail .dcg .cg1 { gap:10r; padding:8r 20r 8r 10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,30r); }
    .hbar.thru { opacity:.38; }
    body.hud-slim #hudA { display:none; } body.hud-slim #hudO { top:76r; } body.hud-slim #hudO.low { top:76r; } body.hud-slim.narrow #hudO { top:76r; }
    body.narrow .hbar { gap:10r; height:64r; padding-right:18r; } body.narrow .hbar .oth, body.narrow .hbar .mt b, body.narrow .hbar .sp { display:none; } body.narrow .hbar .mt .bar { width:70r; } body.narrow .hbar .who { padding:0 22r 0 6r; gap:8r; }
    /* 横幅 */
    #banner { position:fixed; left:0; right:0; top:30%; z-index:30; height:250r; pointer-events:none; }
    #banner .band { position:absolute; inset:0; background:linear-gradient(var(--pcl) 0 8r, var(--pc) 8r 70%, var(--pcd) 70%); box-shadow:0 -8r 0 var(--line), 0 8r 0 var(--line), 0 26r 0 rgba(0,0,0,.35); animation:bandIn var(--tin) ease-out both; overflow:hidden; }
    #banner .band::after { content:""; position:absolute; inset:0; opacity:.16; background:repeating-linear-gradient(120deg, #000 0 26r, transparent 26r 70r); animation:slide 1.2s linear infinite; }
    @keyframes slide { to { background-position:140r 0; } } @keyframes bandIn { from { transform:scaleY(0); } }
    #banner .bt { position:absolute; left:0; right:0; top:22r; display:flex; align-items:baseline; justify-content:center; gap:30r; animation:txtIn var(--tin) ease-out both; white-space:nowrap; }
    #banner .bt b { font-size:max(56px,130r); font-weight:900; line-height:1; color:#fff; } #banner .bt span { font-size:max(28px,54r); font-weight:900; color:var(--gold2); } #banner .bt em { font-style:normal; font-size:max(24px,44r); padding:0 20r; border-radius:12r; background:var(--gold); color:var(--ink); align-self:center; }
    #banner .bs { position:absolute; left:4%; right:4%; bottom:16r; text-align:center; font-size:max(20px,32r); line-height:1.3; color:#fff2c0; animation:txtIn var(--tin) ease-out both; } #banner.pw { height:330r; } #banner.pw .bs { left:32%; text-align:left; }
    #banner .bgx { position:fixed; inset:0; z-index:-1; background:#05070e center/cover no-repeat; animation:bgxIn .3s ease-out both; } @keyframes bgxIn { from { opacity:0; transform:scale(1.08); } }
    @keyframes txtIn { from { transform:translateX(50vw); opacity:0; } }
    #banner .bp { position:absolute; left:6%; bottom:0; height:460r; animation:portIn var(--tin) ease-out both; } #banner.pw .bp { height:560r; } @keyframes portIn { from { transform:translateX(-60vw); } }
    #banner .bq { position:absolute; left:calc(6% + 330r); bottom:270r; padding:12r 30r; font-size:max(22px,38r); color:var(--txt); animation:scrPop .2s .25s both; white-space:nowrap; }
    #banner.out { animation:fadeOut var(--out) ease-in both; } @keyframes fadeOut { to { opacity:0; transform:translateX(-8vw); } }
    /* 转场：阵营色的斜条从左扫到右，中间压一行大字。full = 盖满全屏（开战、胜负）；否则是一条横带（回合切换，不超过 0.8 秒） */
    #wipe { position:fixed; inset:0; z-index:34; pointer-events:none; overflow:hidden; }
    #wipe i { position:absolute; left:-30%; width:160%; top:32%; height:300r; transform:skewX(-18deg) translateX(-110%); animation:wipeBar var(--ms) cubic-bezier(.2,.8,.2,1) both; }
    #wipe.full i { top:-10%; height:120%; }
    #wipe .a { background:var(--line); animation-delay:0s; } #wipe .b { background:var(--gold); animation-delay:calc(var(--ms) * .04); } #wipe .c { background:linear-gradient(var(--pcl) 0 10r, var(--pc) 10r 68%, var(--pcd) 68%); animation-delay:calc(var(--ms) * .08); }
    #wipe .c::after { content:""; position:absolute; inset:0; opacity:.14; background:repeating-linear-gradient(120deg, #000 0 30r, transparent 30r 80r); }
    @keyframes wipeBar { 0% { transform:skewX(-18deg) translateX(-110%); } 28%, 70% { transform:skewX(-18deg) translateX(0); } 100% { transform:skewX(-18deg) translateX(110%); } }
    #wipe .t { position:absolute; left:0; right:0; top:32%; height:300r; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6r; animation:wipeTxt var(--ms) ease-out both; white-space:nowrap; }
    #wipe.full .t { top:0; height:100%; }
    #wipe .t .l1 { display:flex; align-items:baseline; gap:28r; } #wipe .t b { font-size:max(56px,140r); font-weight:900; line-height:1.05; color:#fff; } #wipe.full .t b { font-size:max(72px,220r); letter-spacing:12r; } #wipe .t span { font-size:max(28px,56r); font-weight:900; color:var(--gold2); } #wipe .t em { font-style:normal; font-size:max(24px,44r); padding:0 20r; background:var(--gold); color:var(--ink); align-self:center; }
    #wipe .t small { font-size:max(20px,34r); color:#fff2c0; max-width:80%; white-space:normal; text-align:center; }
    @keyframes wipeTxt { 0%, 12% { opacity:0; transform:translateX(-14vw) scale(1.15); } 30%, 68% { opacity:1; transform:none; } 100% { opacity:0; transform:translateX(30vw); } }
    #toast { position:fixed; left:50%; top:26r; transform:translateX(-50%); z-index:32; display:flex; align-items:center; gap:24r; padding:18r 36r; border-color:var(--gold); pointer-events:none; animation:scrPop .2s both; }
    #toast .ln { font-size:max(24px,40r); font-weight:900; white-space:nowrap; } #toast .hd { width:110r; height:110r; filter:grayscale(.5); }
    /* 行动菜单：贴着单位 */
    #menu { position:fixed; z-index:20; min-width:330r; padding:12r 14r; animation:scrPop .12s both; border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); }
    #menu { max-width:60vw; max-height:calc(100% - 16px - 100r); overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; } .pause { width:auto; min-width:760r; max-width:60vw; } body.narrow #menu, body.narrow .pause { max-width:none; min-width:0; }
    html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) #menu .item, html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .pause .item { white-space:normal; hyphens:none; -webkit-hyphens:none; overflow-wrap:normal; text-wrap:balance; } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) #menu .item > span:not(.c), html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .pause .item > span:not(.c) { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    #menu .item { min-height:max(64px,78r); margin:5r 0; } #menu .ic { width:54r; height:54r; }
    /* 回合菜单：屏幕中央 */
    .pause { margin:auto; width:760r; padding:26r 30r 22r; border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); } .pause h2 { margin:0 0 12r; text-align:center; font-size:max(26px,44r); font-weight:900; color:var(--gold); }
    .pause .item { min-height:max(64px,82r); font-size:max(24px,40r); } .pause .inote, #menu .inote { margin:-2r 6r 8r; padding:10r 18r 12r 86r; font-size:max(20px,24r); line-height:1.45; color:#e9edf8; background:rgba(8,12,26,.55); border-left:5r solid var(--gold); border-radius:0 0 10r 10r; white-space:normal; } .pause .ic { width:58r; height:58r; } .pause .bar { width:170r; min-width:0; } .pause .item .c { flex-shrink:1 !important; min-width:0; padding-left:16r; } .pause .item .c .bar { flex:0 1 170r; width:auto; min-width:24r; }
    /* 矮屏（手机横屏）：回合菜单放不下时在框里上下滚，不伸到底部提示条下面 */ body.small .pause { max-height:100%; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; } body.small .pause::-webkit-scrollbar { display:none; }
    /* 造兵 */
    .build { flex:1; min-height:0; width:100%; display:flex; gap:30r; align-items:stretch; justify-content:center; padding:110r 60r 30r; }
    .build .ls { width:800r; padding:14r 16r; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; } .build .ls::-webkit-scrollbar { display:none; }
    .build .item { min-height:max(64px,88r); padding-left:60r; padding-right:14r; } .build .item .c { padding-left:10r; gap:8r; font-size:max(20px,28r); } .build .item.off { color:#7c849c; } .build .item.off .c { color:#c0705e; } .build .item.off canvas { filter:grayscale(1); opacity:.5; }
    .build .item .md { display:inline-flex; align-items:center; gap:4r; padding:2r 12r; min-height:52r; background:rgba(10,14,28,.6); box-shadow:inset 0 0 0 3r var(--line); color:var(--mut); cursor:pointer; } .build .item .md.on { color:var(--gold2); box-shadow:inset 0 0 0 4r var(--gold); } .build .item .md[data-m=ore].on { color:#ffd0a0; box-shadow:inset 0 0 0 4r #ff8a3c; } .build .item .md.no { opacity:.5; } .build .item.focus .md { background:rgba(10,14,28,.82); }
    .build .item .orec { display:inline-flex; align-items:center; gap:4r; color:#9fe8ff; margin-right:14r; } .build .item .why { position:absolute; right:24r; bottom:2r; font-size:max(20px,20r); color:#ff9c88; font-weight:700; } .build .item.off { padding-bottom:22r; }
    .build .cd { width:900r; padding:26r 32r; }
    .build .grp { display:flex; align-items:center; gap:10r; margin:14r 4r 4r; padding:6r 14r; font-size:max(20px,26r); font-weight:900; color:var(--pcl); background:linear-gradient(90deg, var(--pcd), transparent); border-left:6r solid var(--pcl); }
    .build .item .eb { position:absolute; left:50r; top:4r; display:flex; pointer-events:none; } .build .item .eb .ic { width:30r; height:30r; filter:drop-shadow(0 2r 0 var(--line)); }
    /* 战况 */
    .statw { flex:1; min-height:0; display:flex; gap:40r; align-items:center; justify-content:center; padding:110r 80r 20r; width:100%; }
    .stcard { width:800r; padding:26r 30r; display:flex; flex-direction:column; gap:18r; } .stcard.dead { filter:grayscale(.9); opacity:.75; } .stcard .h { display:flex; align-items:center; gap:24r; } .stcard .hd { width:190r; height:190r; }
    .stcard .fn { font-size:max(30px,60r); font-weight:900; color:#fff; line-height:1.1; text-shadow:0 4r 0 rgba(0,0,0,.4); display:flex; align-items:center; gap:14r; } .stcard .fn em { font-style:normal; font-size:max(20px,30r); padding:2r 14r; border-radius:8r; background:var(--gold); color:var(--ink); text-shadow:none; }
    .stcard .cn { font-size:max(22px,36r); color:#fff; opacity:.9; } .stcard .tiles .tile { flex:1; min-width:0; } .stcard .army { display:flex; flex-wrap:wrap; gap:6r 18r; min-height:70r; align-items:center; font-size:max(20px,28r); } .stcard .army span { display:flex; align-items:center; }
    .stcard .mt { display:flex; align-items:center; gap:14r; font-size:max(20px,30r); } .stcard .mt .bar { flex:1; }
    .stall { width:1500r; max-width:100%; padding:14r 26r 18r; display:flex; flex-direction:column; gap:8r; }
    .strow { display:grid; grid-template-columns:2.2fr repeat(var(--cols, 5), 1fr); align-items:center; min-height:96r; padding:0 18r; font-size:max(22px,38r); font-weight:900; text-align:center; background:linear-gradient(90deg, var(--pc), var(--pcd) 34%, rgba(14,18,32,.55) 34.1%); } .strow.cur { box-shadow:inset 0 0 0 4r var(--gold); } .strow.dead { filter:grayscale(.9); opacity:.7; }
    .strow .who2 { display:flex; align-items:center; gap:14r; text-align:left; color:#fff; text-shadow:0 3r 0 rgba(0,0,0,.4); } .strow .who2 em { font-style:normal; font-size:max(20px,23r); padding:0 10r; background:var(--gold); color:var(--ink); text-shadow:none; } .strow .dd { grid-column:2 / -1; color:var(--mut); }
    .strow.hd3 { min-height:56r; background:none; font-size:max(20px,24r); color:var(--mut); font-weight:800; } .strow.hd3 .who2 { color:var(--mut); text-shadow:none; } .strow.hd3 span { display:flex; align-items:center; justify-content:center; gap:6r; } .strow.hd3 .who2 { justify-content:flex-start; }
    body.narrow .statw { padding:104r 12r 10r; } body.narrow .statw .side { display:none; } body.narrow .stcard .hd { width:130r; height:130r; } body.narrow .stcard .tiles .tile { flex:1 1 40%; }
    body.narrow .stall { width:auto; padding:8r 10r; } body.narrow .strow { grid-template-columns:1.4fr repeat(var(--cols, 5), minmax(0, 1fr)); padding:0 6r; font-size:max(16px,28r); min-height:84r; } body.narrow .strow .who2 .hd { display:none; } body.narrow .strow.hd3 { font-size:max(17px,24r); line-height:1.15; } body.narrow .strow.hd3 span { text-align:center; overflow-wrap:anywhere; } body.narrow .strow.hd3 .ic { display:none; }
    /* 详情卡 */
    .detail { margin:auto; width:1280r; max-height:100%; padding:24r 40r 30r; display:flex; flex-direction:column; gap:14r; border-color:var(--gold); box-shadow:inset 0 0 0 4r var(--line), inset 0 8r 0 var(--hi), 0 0 0 4r var(--line), 0 12r 0 rgba(0,0,0,.4); }
    .detail .tabs { justify-content:center; } .detail .tab { height:64r; font-size:max(20px,30r); --pc:#46527a; --pcd:#2e3855; --pcl:var(--txt); }
    /* 胜负 */
    .over { background:linear-gradient(100deg, rgba(8,12,26,.12), rgba(8,12,26,.5) 55%, rgba(8,12,26,.72)), var(--ovbg, none) center / cover no-repeat, linear-gradient(160deg, var(--pc), var(--pcd) 55%, var(--bg2)) !important; flex-direction:row; align-items:stretch; justify-content:center; gap:40r; padding:40r 80r 30r; }
    .over .ps { display:flex; align-items:flex-end; } .over .ps img { height:860r; max-width:760r; animation:portIn .5s ease-out both; } .over .ps img + img { margin-left:-180r; height:700r; }
    .over .rt { display:flex; flex-direction:column; justify-content:center; gap:22r; min-width:780r; } .over .big { font-size:max(80px,230r); font-weight:900; line-height:1; color:var(--gold2); letter-spacing:10r; animation:scrPop .4s .2s both; }
    .over.lost .big { color:#c8d0e6; } .over .who { font-size:max(28px,52r); font-weight:900; } .over .why { font-size:max(20px,32r); color:#fff; opacity:.85; } .over .q { font-size:max(22px,36r); padding:14r 30r; align-self:flex-start; }
    .over .btns { display:flex; gap:24r; margin-top:10r; } .over .btns .item { width:auto; padding:0 50r 0 70r; }
    .over .ul { display:flex; align-items:center; flex-wrap:wrap; gap:6r 14r; align-self:flex-start; padding:10r 20r; font-size:max(20px,28r); line-height:1.3; background:rgba(8,12,26,.6); border-left:6r solid var(--pcl); } .over .ul b { color:var(--pcl); font-weight:900; } .over .ul.open { border-left-color:var(--gold); } .over .ul.open b, .over .ul.open span { color:var(--gold2); }
    /* 解锁新阵营 */
    .unlk { background:#05070e !important; justify-content:center; } .unlk .ubg { position:absolute; inset:0; background:center/cover no-repeat, radial-gradient(90% 70% at 50% 40%, var(--pcd), #05070e 75%); opacity:.85; animation:bgxIn .5s ease-out both; } .unlk .ubg::after { content:""; position:absolute; inset:0; background:linear-gradient(rgba(5,7,14,.25), rgba(5,7,14,.82)); }
    .unlk .ups { position:absolute; left:4%; bottom:0; display:flex; align-items:flex-end; } .unlk .ups img { height:900r; max-width:820r; animation:portIn .6s .5s ease-out both; } .unlk .ups img + img { margin-left:-260r; height:760r; }
    .unlk .uct { display:flex; flex-direction:column; align-items:center; gap:14r; margin:auto 8% auto auto; width:900r; max-width:92%; text-align:center; } .unlk .uem .ic { width:300r; height:300r; filter:drop-shadow(0 0 40r var(--pcl)); animation:unlkPop .7s .15s cubic-bezier(.2,1.6,.4,1) both; } @keyframes unlkPop { from { opacity:0; transform:scale(.2) rotate(-25deg); } }
    .unlk .u1 { font-size:max(26px,54r); font-weight:900; color:var(--gold2); letter-spacing:6r; animation:txtIn .4s .5s ease-out both; } .unlk .u2 { font-size:max(72px,210r); font-weight:900; line-height:1; color:#fff; letter-spacing:16r; animation:scrPop .4s .7s both; }
    .unlk .u3 { padding:14r 30r; font-size:max(20px,32r); line-height:1.5; animation:scrPop .3s 1s both; }
    body.narrow .unlk .ups { left:0; right:0; justify-content:center; opacity:.45; } body.narrow .unlk .ups img { height:760r; } body.narrow .unlk .uct { margin:auto; } body.narrow .unlk .u2 { font-size:150r; letter-spacing:8r; }
    .hand { justify-content:center; gap:30r; background:var(--bg2) !important; } .hand .ic { width:200r; height:200r; } .hand .item { width:auto; padding:0 60r 0 80r; }
    `);

    // ───────── 常驻三块 ─────────
    const el = (id, cls) => { let e = $(id); if (!e) { e = document.createElement('div'); e.id = id; e.className = cls; document.body.appendChild(e); } return e; };
    const keys = {}; let goalOpen = true, loseOpen = false, floodSeen = false;
    const hide = id => { const e = $(id); if (e && !e.classList.contains('hidden')) e.classList.add('hidden'); keys[id] = ''; };
    function paint(id, cls, key, html, side) {
      const e = el(id, cls); e.classList.remove('hidden');
      if (keys[id] !== key) { keys[id] = key; e.innerHTML = html(); Kit.hydrate(e); }
      return e;
    }
    const pct = Kit.pct;
    function statusHtml(s) {
      return headS(s.co, s.p, 150) + `<div><div class="fn">${esc(s.name)}${s.tag ? `<em>${esc(tt('{name} 队', { name: s.tag }))}</em>` : ''}</div><div class="dy">${esc(tt('第 {n} 天', { n: s.day }))}</div>` +
        `<div class="fd">${Kit.ic('coin')}${s.funds}${s.ore != null ? `<span class="ore" title="">${Kit.ic('ore')}${s.ore}</span>` : ''}${s.rp != null ? `<span class="ore rp" title="">${Kit.ic('tech')}${s.rp}</span>` : ''}</div>${s.powers ? `<div class="mt">${Kit.ic('power', 's')}${Kit.bar(s.meter, 'seg')}</div>` : ''}</div>${s.techIdle ? `<span class="ti">${Kit.ic('tech', 's')}${esc(tt('可研究'))}</span>` : ''}`;
    }
    function infoHtml(M) {
      const u = M.unit;
      let h = `<div class="xh">${Kit.cap('x')}${esc(tt('详情'))}${Kit.ptr() ? ' ›' : ''}</div><div class="rw" style="${pcs(M.owner)}"><div class="bx">${Kit.terr(M.t, G.artCode(M.owner), 100, [G.cur.x, G.cur.y])}</div><div><div class="n">${esc(M.name)}${M.prop ? `<small>${M.owner ? esc(G.pname(M.owner)) : esc(tt('中立'))}</small>` : ''}</div>` +
        `<div class="d">${M.def ? Kit.stars(M.def) : `<span class="mut">${esc(tt('无地形防御'))}</span>`}${M.cap != null ? `${Kit.ic('cap', 's')}<b class="gold">${M.cap}/20${M.capBy ? ' −' + M.capBy : ''}</b>` : ''}</div></div></div>${M.tip ? `<div class="tip">${Kit.ic('ore', 's')}${esc(M.tip)}</div>` : ''}`;
      if (u) {
        const B = u.buff || {}, chips = [];
        const add = (ic, v, t) => chips.push(Kit.chip(Kit.ic(ic, 's'), '', t, v > 0 ? 'good' : 'bad'));
        if (B.atk) add('sword', B.atk, pct(B.atk)); if (B.def) add('shield', B.def, pct(B.def)); if (B.move) add('boot', B.move, (B.move > 0 ? '+' : '−') + Math.abs(B.move));
        if (B.range) add('aim', B.range, '+' + B.range); if (B.vision) add('eye', B.vision, '+' + B.vision);
        for (const t of u.aura || []) chips.push(`<span class="tag">${esc(t)}</span>`);
        if (u.ore) chips.unshift(Kit.chip(Kit.ic('ore', 's'), tt('强化'), '', 'good') + Kit.oreChips(u.type));
        if (u.again) chips.push(`<span class="tag">${esc(tt('可再次行动'))}</span>`); else if (u.fired && !u.moved && u.left != null) chips.push(`<span class="tag">${esc(tt('可再次移动 {n}', { n: u.left }))}</span>`);
        h += `<div class="rw" style="${pcs(u.owner)}"><div class="bx">${unitS(u.type, u.owner, 100, u.moved ? 'data-dim="1"' : '')}</div><div><div class="n" style="color:var(--pcl)">${esc(u.name)}</div>` +
          `<div class="d">${Kit.ic('heart', 's')}<b class="${u.hp <= 3 ? 'bad' : ''}">${u.hp}</b>${u.stars ? Kit.stars(u.stars) : ''}${u.cargo ? Kit.ic('crate', 's') + u.cargo : ''}${u.vision ? Kit.ic('eye', 's') + u.vision : ''}</div></div></div>` +
          ((u.cargoList || []).length ? `<div class="cgl">${Kit.ic('crate', 's')}${u.cargoList.map(c => cargoHtml(c, 56)).join('')}</div>` : '') +
          (chips.length ? `<div class="chips">${chips.slice(0, 5).join('')}</div>` : '');
      }
      return h;
    }
    // 运输单位里的一个乘客：小图标 + 名字 + HP（和单位自己的 HP 同一种写法），有军衔、强化的带上。px 是图标边长
    const cargoHtml = (c, px) => `<span class="cg1" style="${pcs(c.owner)}">${unitS(c.type, c.owner, px)}<b>${esc(c.name)}</b>${Kit.ic('heart', 's')}<span class="hp${c.hp <= 3 ? ' bad' : ''}">${c.hp}</span>${c.stars ? Kit.stars(c.stars) : ''}${c.ore ? Kit.ic('ore', 's') : ''}</span>`;
    // ── 精简的战场信息 ──
    const slimOn = () => !(G.hudMode && G.hudMode() === 'full');
    // 顶栏：阵营色的斜角签（小圆头像 / 徽记 + 阵营名）｜第 N 天｜资金、碎片、研究点（有买得起的科技时研究点变金色、带一个“!”）｜技能槽（满了发光并写技能名）｜其余阵营的徽记 + 资金
    function slimStatus(s) {
      const oth = (s.others || []).map(o => `<span class="o1" style="${pcs(o.p)}">${embS(o.p, 's')}${o.funds}</span>`).join('');
      return `<span class="who">${s.co ? headS(s.co, s.p, 46) : embS(s.p)}<span>${esc(s.name)}</span>${s.tag ? `<em>${esc(tt('{name} 队', { name: s.tag }))}</em>` : ''}</span>` +
        `<span class="dy">${esc(tt('第 {n} 天', { n: s.day }))}</span><span class="fd">${Kit.ic('coin', 's')}${s.funds}</span>` +
        (s.ore != null ? `<span class="ore">${Kit.ic('ore', 's')}${s.ore}</span>` : '') + (s.rp != null ? `<span class="ore rp${s.techIdle ? ' can' : ''}">${Kit.ic('tech', 's')}${s.rp}${s.techIdle ? '<i class="nb">!</i>' : ''}</span>` : '') +
        (s.powers ? `<span class="mt${s.full ? ' full' : ''}">${Kit.ic('power', 's')}${Kit.bar(s.meter, 'seg')}${s.full && s.power ? `<b>${esc(s.power)}</b>` : ''}</span>` : '') +
        (oth ? `<span class="oth">${oth}</span>` : '') + (s.ai ? `<span class="ai">${esc(s.demo ? tt('演示对局') : tt('电脑行动中…'))}</span>` : '');
    }
    // 底条：地形图标 + 名称 + 防御星（占领中写占领值）｜单位图标 + 名称 + HP + 几个小标记（强化、攻防增减、范围增益、隐蔽、可再次行动）。完整内容在详情卡里
    function slimInfo(M) {
      const u = M.unit, mk = (cls, h) => `<span class="mk ${cls}">${h}</span>`;
      let h = `<span class="sg tr" style="${pcs(M.owner)}">${Kit.terr(M.t, G.artCode(M.owner), 46, [G.cur.x, G.cur.y])}<b>${esc(M.name)}</b>${M.prop && M.owner ? `<small>${esc(G.pname(M.owner))}</small>` : ''}${M.def ? Kit.stars(M.def) : ''}` +
        `${M.cap != null ? `<span class="cp">${Kit.ic('cap', 's')}${M.cap}/20${M.capBy ? ' −' + M.capBy : ''}</span>` : ''}${M.tip ? `<span class="tip">${Kit.ic('ore', 's')}${esc(M.tipShort || M.tip)}</span>` : ''}</span>`;
      if (u) {
        const B = u.buff || {}, ms = [];
        if (u.ore) ms.push(mk('ore', Kit.ic('ore', 's') + esc(tt('强化'))));
        if (B.atk) ms.push(mk(B.atk > 0 ? 'good' : 'bad', Kit.ic('sword', 's') + esc(pct(B.atk))));
        if (B.def) ms.push(mk(B.def > 0 ? 'good' : 'bad', Kit.ic('shield', 's') + esc(pct(B.def))));
        for (const n of u.auraNames || []) ms.push(mk('', esc(n)));
        if (u.veil) ms.push(mk('vl', esc(u.veil)));
        if (u.again) ms.push(mk('good', esc(tt('可再次行动')))); else if (u.fired && !u.moved && u.left != null) ms.push(mk('good', esc(tt('可再次移动 {n}', { n: u.left }))));
        h += `<i class="sp"></i><span class="sg" style="${pcs(u.owner)}">${unitS(u.type, u.owner, 46, u.moved ? 'data-dim="1"' : '')}<b>${esc(u.name)}</b>${Kit.ic('heart', 's')}<span class="hp${u.hp <= 3 ? ' bad' : ''}">${u.hp}</span>${u.stars ? Kit.stars(u.stars) : ''}${ms.slice(0, 4).join('')}</span>` +
          ((u.cargoList || []).length ? `<span class="cg">${Kit.ic('crate', 's')}${u.cargoList.map(c => cargoHtml(c, 40)).join('')}</span>` : '');
      }
      return h + (Kit.ptr() ? '<span class="more">›</span>' : '');
    }
    // 条放左边还是右边：看的那几格（光标、选中的单位）进到这一侧条子下面（底条是上面）两格以内，就滑到另一侧；另一侧也被占着就不动。
    // 位置用 transform 横移，带过渡；顶栏在右边时让开右上角的喇叭按钮
    const sideAt = { hudS: 'l', hudI: 'r' };
    function slide(e, id, m, top) {
      const W = innerWidth, w = e.offsetWidth, r = e.getBoundingClientRect(), g = m.ts || 48, pts = m.pts || [];
      const snd = top ? $('snd') : null, inset = snd ? Math.max(0, W - snd.getBoundingClientRect().left + 10 * Kit.s) : 0, xR = Math.max(0, W - inset - w);
      const near = x0 => pts.some(p => p.x + p.w > x0 - g * 0.5 && p.x < x0 + w + g * 0.5 && (top ? p.y < r.bottom + 2 * g : p.y + p.h > r.top - 2 * g));
      let sd = sideAt[id]; const nL = near(0), nR = near(xR);
      if (sd === 'l' && nL && !nR) sd = 'r'; else if (sd === 'r' && nR && !nL) sd = 'l';
      sideAt[id] = sd; const tf = `translateX(${Math.round(sd === 'l' ? 0 : xR)}px)`; if (e.style.transform !== tf) e.style.transform = tf;
      e.classList.toggle('thru', sd === 'l' ? nL : nR);   // 两边都让不开（手机竖屏，条子几乎和屏幕一样宽）：变淡，透出下面的格子
      return sd;
    }
    function fcHtml(F) {
      if (F.silo) return `<div class="ct">${Kit.ic('silo')}${th(tt('敌方 {enemy}　己方 {own}', { enemy: '\u0001', own: '\u0002' }), [`<b style="color:#ff8a5c">${F.silo.en}</b>`, `<b>${F.silo.fr}</b>`])}</div><div class="ft">${esc(tt('范围内单位各损失 3 HP'))}</div>`;
      // 克制关系按 F.edgeKind（good / bad / mut）判断；老数据没有这个字段时退回按中文原文比
      const eg = F.edgeKind ? ({ good: ['good', '▲'], bad: ['bad', '▼'] }[F.edgeKind] || ['mut', '●']) : F.edge === '克制' ? ['good', '▲'] : F.edge === '劣势' ? ['bad', '▼'] : ['mut', '●'];
      return `<div class="fx">${unitS(F.a, F.ao, 96)}<span class="ar">➜</span><b class="dm">${esc(F.dmgT)}</b>${unitS(F.d, F.dow, 96)}</div>` +
        `<div class="ct">${Kit.ic('shield', 's')}${th(F.first ? tt('先手反击 {n}', { n: '\u0001' }) : tt('反击 {n}', { n: '\u0001' }), [`<b>${esc(F.cntT)}</b>`])}${F.edge ? `<span class="eg ${eg[0]}">${eg[1]} ${esc(tt(F.edge))}</span>` : ''}</div>` + (F.foot ? `<div class="ft">${esc(F.foot)}</div>` : '');
    }
    // 伤害预览牌贴在目标旁边：上、下、右、左挨个试，不出屏、不压出手的单位
    function placeFc(e, m) {
      const a = m.fcAt, r = (m.fc.r || 0) * m.ts, w = e.offsetWidth, h = e.offsetHeight, W = innerWidth, H = innerHeight - Kit.barH(), g = 18 * Kit.s;
      const A = { x: a.x - r, y: a.y - r, w: a.w + 2 * r, h: a.h + 2 * r }, cx = A.x + A.w / 2, cy = A.y + A.h / 2;
      const hit = (p, q) => q && p.x < q.x + q.w && p.x + w > q.x && p.y < q.y + q.h && p.y + h > q.y;
      let best = null;
      for (const [x, y] of [[cx - w / 2, A.y - h - g], [cx - w / 2, A.y + A.h + g], [A.x + A.w + g, cy - h / 2], [A.x - w - g, cy - h / 2]]) {
        const p = { x, y }; if (x < 8 || y < 8 || x + w > W - 8 || y + h > H - 8) continue; if (!r && hit(p, m.from)) continue; best = p; break;
      }
      if (!best) best = { x: Math.max(8, Math.min(W - w - 8, cx - w / 2)), y: Math.max(8, Math.min(H - h - 8, A.y - h - g)) };
      e.style.left = Math.round(best.x) + 'px'; e.style.top = Math.round(best.y) + 'px';
    }
    const hud = {
      frame(m) {
        if (!m || !G.S) { for (const id of ['hudS', 'hudA', 'hudI', 'hudF', 'hudO']) hide(id); if (!m || !m.loading) Kit.loadingOn && (Kit.loadingOn = false); return; }
        const s = m.status, slim = slimOn();
        if (document.body.classList.contains('hud-slim') !== slim) { document.body.classList.toggle('hud-slim', slim); keys.hudS = keys.hudI = ''; for (const id of ['hudS', 'hudI']) { const x = $(id); if (x) x.style.transform = ''; } }
        const e = paint('hudS', 'hud', (slim ? 'S' : 'F') + JSON.stringify(s), () => (slim ? slimStatus(s) : statusHtml(s)) + [...(($('hudS') || {}).querySelectorAll ? $('hudS').querySelectorAll('.flt') : [])].map(f => f.outerHTML).join(''));
        if (slim) { if (!e.classList.contains('hbar')) e.className = 'hud hbar'; const pc = pcs(s.p); if (e._pc !== pc) { e._pc = pc; for (const kv of pc.split(';')) { const i = kv.indexOf(':'); if (i > 0) e.style.setProperty(kv.slice(0, i), kv.slice(i + 1)); } } m.left = slide(e, 'hudS', m, true) === 'l'; }
        const side = m.left ? '' : ' r';
        if (!slim) { e.className = 'hud pn' + side; e.style.cssText = pcs(s.p); e._pc = ''; }
        if (!e._c) { e._c = 1; e.onclick = () => G.act('y'); }
        if (s.ai && !slim) { const a = paint('hudA', 'hud pn', s.demo ? 'd' : 'a', () => esc(s.demo ? tt('演示对局') : tt('电脑行动中…'))); a.className = 'hud pn' + side; } else hide('hudA');
        if (m.info) {
          const M = m.info, key = (slim ? 'S' : 'F') + JSON.stringify([M.tip, M.t, M.owner, M.cap, M.capBy, M.unit && [M.unit.type, M.unit.owner, M.unit.hp, M.unit.stars, M.unit.cargo, M.unit.cargoList, M.unit.moved, M.unit.fired, M.unit.again, M.unit.vision, M.unit.left, M.unit.aura, M.unit.ore, M.unit.veil, M.unit.buff && [M.unit.buff.atk, M.unit.buff.def, M.unit.buff.move, M.unit.buff.range, M.unit.buff.vision]], G.cur.x, G.cur.y, Kit.dev]);
          const i = paint('hudI', 'hud', key, () => slim ? slimInfo(M) : infoHtml(M));
          if (slim) { if (!i.classList.contains('hbar')) i.className = 'hud hbar'; m.right = slide(i, 'hudI', m, false) === 'r'; } else i.className = 'hud pn' + (m.right ? '' : ' l');
          if (!i._c) { i._c = 1; i.onclick = () => G.openDetail(); }
        } else hide('hudI');
        // 目标条：胜利条件一组（不止一条时写明“达成任一即胜利”），失败条件一组（默认收起）。点标题收起 / 展开
        if (m.goal && m.goal.win && m.goal.win.length) {
          if (m.goal.flood && !floodSeen) { floodSeen = true; loseOpen = true; }
          const g = m.goal, t = tt, row = l => `<div class="${l.tone || ''}">${esc(l.text)}${l.prog ? `<em>${esc(l.prog)}</em>` : ''}</div>`;
          const o = paint('hudO', 'hud pn', JSON.stringify(g) + goalOpen + loseOpen, () => `<b data-g="win">${Kit.ic('flag', 's')}${esc(t('目标'))}${g.any && goalOpen ? `<small>${esc(t('达成任一即胜利'))}</small>` : ''}<i>${goalOpen ? '▲' : '▼'}</i></b>` + (goalOpen ? g.win.map(row).join('') +
            (g.lose && g.lose.length ? `<b class="ls" data-g="lose">${esc(t('失败条件'))}<i>${loseOpen ? '▲' : '▼'}</i></b>` + (loseOpen ? g.lose.map(l => row(Object.assign({}, l, { tone: l.tone || 'lz' }))).join('') : '') : '') : ''));
          o.className = 'hud pn' + side + (s.ai ? ' low' : '');
          if (!o._c) { o._c = 1; o.onclick = e => { const b = e.target.closest('[data-g]'); if (b && b.dataset.g === 'lose') loseOpen = !loseOpen; else goalOpen = !goalOpen; }; }
        } else hide('hudO');
        if (m.fc) { const f = paint('hudF', 'hud pn', JSON.stringify([m.fc.text, m.fc.a, m.fc.d, m.fc.silo]), () => fcHtml(m.fc)); placeFc(f, m); } else hide('hudF');
        if (m.loading !== !!Kit.loadingOn) { Kit.loadingOn = !!m.loading; if (m.loading) Kit.note(tt('载入地图…'), 60000); else Kit.note(''); }
      },
      rect(k) { const e = $({ status: 'hudS', info: 'hudI', fc: 'hudF' }[k]); if (!e || e.classList.contains('hidden')) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; },
      clear() { sideAt.hudS = 'l'; sideAt.hudI = 'r'; for (const id of ['hudS', 'hudA', 'hudI', 'hudF', 'hudO']) hide(id); for (const id of ['banner', 'toast', 'wipe']) { const e = $(id); if (e) e.remove(); } Kit.note(''); Kit.loadingOn = false; Kit.setHints([]); },
      // 横幅：阵营色条带上下张开，大字从右边滑进来，立绘从左边滑进来；停一会儿整体滑走
      banner(o) {
        let e = $('banner'); if (e) e.remove();
        e = document.createElement('div'); e.id = 'banner'; if (o.power) e.className = 'pw';
        e.style.cssText = pcs(o.p) + `;--tin:${Math.round(o.tin)}ms;--out:${Math.round(o.out)}ms`;
        e.innerHTML = (o.bg ? `<div class="bgx" style="background-image:url(${esc(o.bg)})"></div>` : '') + `<div class="band"></div>` + (o.co ? Kit.port(o.co.id, o.co.mood || 'normal', '') .replace('class="pt"', 'class="pt bp"') : '') +
          `<div class="bt ol">${o.pre ? `<span>${esc(o.pre)}</span>` : ''}<b>${esc(o.big)}</b>${o.tag ? `<em>${esc(o.tag)}</em>` : ''}</div>${o.sub ? `<div class="bs ol">${esc(o.sub)}</div>` : ''}` +
          (o.co && o.co.quote ? `<div class="bq pn">“${esc(o.co.quote)}”</div>` : '');
        document.body.appendChild(e); Kit.hydrate(e);
        const mine = e; setTimeout(() => { if (mine.parentNode) mine.classList.add('out'); }, o.hold); setTimeout(() => { if (mine.parentNode) mine.remove(); }, o.hold + o.out);
      },
      // 阵营牌上飘一个数字（回合开始的资源产出）
      float(text, icon) { const e = $('hudS'); if (!e || e.classList.contains('hidden')) return; const f = document.createElement('span'); f.className = 'flt'; f.innerHTML = (icon ? Kit.ic(icon, 's') : '') + esc(text); e.appendChild(f); setTimeout(() => { if (f.parentNode) f.remove(); }, 1600); },
      // 转场：o = { p, pre, big, tag, sub, full, ms }
      wipe(o) {
        let e = $('wipe'); if (e) e.remove();
        e = document.createElement('div'); e.id = 'wipe'; if (o.full) e.className = 'full';
        e.style.cssText = pcs(o.p || 0) + `;--ms:${Math.round(o.ms)}ms`;
        e.innerHTML = `<i class="a"></i><i class="b"></i><i class="c"></i><div class="t ol"><div class="l1">${o.pre ? `<span>${esc(o.pre)}</span>` : ''}<b>${esc(o.big)}</b>${o.tag ? `<em>${esc(o.tag)}</em>` : ''}</div>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;
        document.body.appendChild(e);
        const mine = e; setTimeout(() => { if (mine.parentNode) mine.remove(); }, o.ms + 60);
      },
      toast(o) {
        let e = $('toast'); if (e) e.remove();
        e = document.createElement('div'); e.id = 'toast'; e.className = 'pn';
        e.innerHTML = (o.cos || []).filter(c => c && c.id).map(c => headS(c.id, c.p, 110, 'lose')).join('') + `<div>${(o.lines || []).map(l => { const who = `<span style="color:${palS(l.p).h}">${esc(G.pname(l.p))}</span> ${esc(l.word)}`; return `<div class="ln">${l.by ? th(tt('{who} 败给 {by}', { who: '\u0001', by: '\u0002' }), [who, `<span style="color:${palS(l.by).h}">${esc(G.pname(l.by))}</span>`], mutWrap) : who}</div>`; }).join('')}</div>`;
        document.body.appendChild(e); Kit.hydrate(e);
        const mine = e; setTimeout(() => { if (mine.parentNode) mine.remove(); }, 3200);
      },
    };

    // ───────── 菜单 ─────────
    let menuEl = null, menuScr = null;
    function closeMenu() {
      if (menuScr) { const s = menuScr; menuScr = null; s.close(true); }
      if (menuEl) { Nav.pop(menuEl); menuEl.remove(); menuEl = null; }
    }
    const itemHtml = it => `${it.icon ? Kit.ic(it.icon) : ''}<span>${esc(it.label)}</span>${it.right != null || it.bar != null ? `<span class="c">${it.bar != null && it.bar < 1 ? Kit.bar(it.bar) : ''}${it.right != null ? esc(it.right) : ''}</span>` : ''}`;
    function menu(items, onCancel, o) {
      closeMenu(); o = o || {};
      const fill = box => {
        for (const it of items) {
          const b = document.createElement('button'); b.className = 'nav item'; b.disabled = !!it.disabled; b.dataset.id = it.id || it.icon || ''; b.innerHTML = itemHtml(it);
          b.onclick = () => { sfx.ok(); it.fn(); }; box.appendChild(b);
          if (it.note) { const n = document.createElement('div'); n.className = 'inote'; n.textContent = it.note; box.appendChild(n); }   // 这一项的说明（比如技能效果），完整显示
        }
      };
      const cancel = () => { sfx.back(); onCancel(); };
      if (o.center) {
        menuScr = Kit.screen({ id: 'pause', dim: true, pop: true, html: `<div class="pause pn" id="pmenu">${o.title ? `<h2>${esc(o.title)}</h2>` : ''}${o.note ? `<div class="inote" style="padding-left:18r;text-align:center;border-left:0">${esc(o.note)}</div>` : ''}</div>`, onCancel: cancel, linear: true,
          keys: { y: cancel, start: cancel }, hints: [['a', '确定'], ['b', '返回']] });
        const box = menuScr.el.firstChild; fill(box);
        const it = Nav.items(), f = (o.focus && it.find(q => q.dataset.id === o.focus)) || it[0]; if (f) Nav.focus(f);
        return;
      }
      const e = document.createElement('div'); e.id = 'menu'; e.className = 'pn'; fill(e); document.body.appendChild(e); menuEl = e;
      Nav.push(e, cancel, null, true, { hints: [['a', '确定'], ['b', '返回']] });
      if (o.focus) { const b = Nav.items().find(q => q.dataset.id === o.focus); if (b) Nav.focus(b); }
      // 贴着单位：优先放右边，放不下放左边；上下夹在画面里
      const a = o.at || { x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0 }, r = e.getBoundingClientRect(), W = innerWidth, H = innerHeight - Kit.barH(), g = 18 * Kit.s;
      let x = a.x + a.w + g; if (x + r.width > W - 8) x = a.x - r.width - g; if (x < 8) x = 8;
      let y = a.y + a.h / 2 - r.height / 2; if (y + r.height > H - 8) y = H - 8 - r.height; if (y < 8) y = 8;
      e.style.left = Math.round(x) + 'px'; e.style.top = Math.round(y) + 'px';
    }

    // ───────── 造兵：左边兵种列表（图标 + 名称 + 造价，买不起的变灰），右边单位卡 ─────────
    function build(m, onPick, onCancel) {
      const T = D.TERRAIN[m.terrain] || {};
      const scr = Kit.screen({
        id: 'build', dim: true, html: `<div class="crumb pn" style="${pcs(m.p)}">${esc(T.name || tt('生产'))}<em>|</em><span>${Kit.ic('coin', 's')} ${m.funds}</span></div><div class="build"><div class="ls pn" id="bls"></div><div class="cd pn sc" id="bcd"></div></div>`,
        linear: true, onCancel: () => { sfx.back(); scr.close(true); onCancel(); },
        onFocus: b => { const it = m.list.find(q => q.k === b.dataset.k); if (it) card(it); },
        keys: {
          x: () => { const f = Nav.top().f; if (f) unitDetail(f.dataset.k, m.p, m.present); },
          lb: () => jump(-4), rb: () => jump(4),
        },
        hints: [['a', '生产'], ['b', '返回'], m.list.some(q => q.ore) && ['lr', '常规 / 强化'], ['x', '完整资料'], m.list.length > 6 && ['lbrb', '翻页']],
      });
      // 右边的单位卡：选了强化就写出强化后的变化
      function card(it) { const R = D.RES || {}, c = $('bcd'); c.innerHTML = Kit.unitCard(it.k, { owner: G.artCode(m.p), compact: true, ore: it.strong ? it.ore : 0, cost: it.cost, mods: it.mods, present: m.present,
        // 强化花几份、得到什么：没选强化时也列出来（灰色），选了变成绿色
        buffs: it.ore ? Kit.chip(Kit.ic('ore', 's'), it.strong ? tt('陨星强化') : tt('强化价 {n}', { n: it.ore }), '', it.strong ? 'good' : '') + Kit.oreFx(it.k).map(e => Kit.chip(Kit.ic(e.icon, 's'), e.text, '', it.strong ? 'good' : '')).join('') : '' }); Kit.hydrate(c); }
      const jump = d => { const it = Nav.items(), i = it.indexOf(Nav.top().f), n = it[Math.max(0, Math.min(it.length - 1, i + d))]; if (n) { Nav.focus(n); sfx.tick(); } };
      const ls = $('bls');
      // 每一行两种造法：常规（只花资金）和强化（多花 D.RES，造出来攻击、防御更高）。左右键 / 点行尾的两块在两者间切换，确定按当前造法生产
      const R = D.RES, pc = v => Math.round((v || 0) * 100);
      // 只有某个阵营造得出来的兵种（D.UNITS[x].faction / only）排在最后，前面加一行组名，图标左上角带那个阵营的徽记
      const eliteOf = k => { const U = D.UNITS[k] || {}; return U.faction || U.only || 0; }; let grp = 0;
      for (const it of m.list) {
        const ef = eliteOf(it.k);
        if (ef && ef !== grp) { grp = ef; const h = document.createElement('div'); h.className = 'grp'; h.style.cssText = Kit.pcs(ef); h.innerHTML = Kit.emblem(ef, 's') + `<span>${esc(tt('{name}精锐', { name: Kit.fname(ef) }))}</span>`; ls.appendChild(h); }
        const b = document.createElement('button'); b.className = 'nav item' + (ef ? ' elite' : ''); b.dataset.k = it.k; it.strong = false;
        const draw = () => { const why = it.strong ? it.whyS : it.why; b.classList.toggle('off', !!why); b.dataset.mode = it.strong ? 'ore' : 'std';
          b.innerHTML = `${unitS(it.k, m.p, 76)}${ef ? `<i class="eb">${Kit.emblem(ef, 's')}</i>` : ''}<span>${esc(D.UNITS[it.k].name)}</span><span class="c"><span class="md${it.strong ? '' : ' on'}${it.why ? ' no' : ''}" data-m="std">${Kit.ic('coin', 's')}${it.cost}</span>` +
            (it.ore ? `<span class="md${it.strong ? ' on' : ''}${it.whyS ? ' no' : ''}" data-m="ore">${Kit.ic('ore', 's')}${esc(tt('强化 +{n}', { n: it.ore }))}</span>` : '') + `</span>${why ? `<small class="why">${esc(why)}</small>` : ''}`; Kit.hydrate(b); };
        const set = v => { if (!it.ore || it.strong === v) return; it.strong = v; sfx.tick(); draw(); if (Nav.top().f === b) card(it); };
        b._lr = it.ore ? d => set(d > 0) : null; b._it = it;
        b.onclick = e => { const md = e.target.closest('.md'); if (md && it.ore && (md.dataset.m === 'ore') !== it.strong) return set(md.dataset.m === 'ore'); const why = it.strong ? it.whyS : it.why; if (why) { sfx.no(); Kit.note(why); return; } scr.close(true); onPick(it.k, it.strong); };
        draw(); ls.appendChild(b);
      }
      Kit.hydrate(ls); const first = (m.focus && Nav.items().find(q => q.dataset.k === m.focus)) || Nav.items()[0]; if (first) { Nav.top().f = null; Nav.focus(first); }   // 默认停在上次造的兵种
    }

    // ───────── 详情卡：这一格的单位 / 地形（LB RB 切换）─────────
    function unitExtra(q) {
      const VS = { air: '对空', land: '对地', ship: '对舰', inf: '对步兵', vehicle: '对车辆', sub: '对潜' };   // 这几个是键，显示处 tt()
      const B = G.unitBuff(q), chips = [], add = (ic, v, t) => chips.push(Kit.chip(Kit.ic(ic, 's'), '', t, v > 0 ? 'good' : 'bad'));
      if (B.atk) add('sword', B.atk, pct(B.atk)); if (B.defAll) add('shield', B.defAll, pct(B.defAll));
      for (const [k, v] of B.vs || []) chips.push(Kit.chip('', (VS[k] ? tt(VS[k]) : tt('对{name}', { name: k })), pct(v), v > 0 ? 'good' : 'bad'));
      const tags = []; try { const a = G.auraText ? G.auraText(q) : []; tags.push(...a); } catch (e) { }
      if (q.ore && D.RES) chips.unshift(Kit.chip(Kit.ic('ore', 's'), tt('陨星强化'), '', 'good') + Kit.oreChips(q.type));
      if (G.canAgain(q)) tags.push(tt('可再次行动')); else if (q.moved && q.owner === G.S.turn) tags.push(tt('已行动'));
      if (B.mods && B.mods.fullAtk) tags.push(tt('攻击不随 HP 降低'));
      return { buffs: chips.join(''), tags, mods: { move: B.move, range: B.range, vision: B.vision } };
    }
    function detail(o) {
      const S = G.S, m = S.map, t = m.t[o.y][o.x], T = D.TERRAIN[t], q = o.unit, own = m.owner[o.y][o.x];
      let tab = q ? 'unit' : 'terr';
      const inc = T.income ? Math.round(T.income * ((S.rules && S.rules.income) || G.INC) / (G.RDEF.income || 100)) : 0;
      const body = () => {
        if (tab === 'unit') { const x = unitExtra(q), cg = G.cargoOf ? G.cargoOf(q) : []; let cap = 0; try { cap = C.carryCap ? C.carryCap(S, q) : 0; } catch (e) { }
          const cgH = cg.length ? `<div class="dcg"><h4>${Kit.ic('crate', 's')}${esc(tt('搭载的单位'))}<em>${cg.length}${cap ? '/' + cap : ''}</em></h4><div class="cgl">${cg.map(c => cargoHtml(c, 72)).join('')}</div></div>` : '';
          return Kit.unitCard(q.type, { unit: q, owner: G.artCode(q.owner), cost: G.costOf(q.owner, q.type), mods: x.mods, buffs: x.buffs, tags: x.tags, present: G.presentTypes(q.owner) }) + cgH; }
        let capBy = 0; try { if (q && m.cap[o.y][o.x] < 20 && C.canCapture(S, q)) capBy = G.capPow(q); } catch (e) { }
        return Kit.terrCard(t, { owner: G.artCode(own), xy: [o.x, o.y], cap: m.cap[o.y][o.x], income: inc });
      };
      const sw = () => { if (!q) return false; tab = tab === 'unit' ? 'terr' : 'unit'; sfx.tick(); draw(); };
      const scr = Kit.screen({
        id: 'detail', dim: true, pop: true, html: '<div class="detail pn sc"></div>',
        keys: { lb: sw, rb: sw, left: sw, right: sw, x: () => { sfx.back(); scr.close(); }, ok: () => { sfx.ok(); scr.close(); G.openCodex(tab === 'unit' ? { page: 'unit', unit: q.type } : { page: 'terrain', terrain: t }); } },
        hints: () => [['a', '在图鉴中查看'], ['b', '关闭'], q && ['lbrb', tab === 'unit' ? '查看地形' : '查看单位']],
      });
      function draw() {
        const box = scr.el.firstChild;
        box.innerHTML = (q ? `<div class="tabs"><span class="tab${tab === 'unit' ? ' on' : ''}" data-t="unit">${esc(tt('单位', null, 'tab'))}</span><span class="tab${tab === 'terr' ? ' on' : ''}" data-t="terr">${esc(T.prop ? tt('建筑', null, 'tab') : tt('地形', null, 'tab'))}</span></div>` : '') + body();
        Kit.hydrate(box); box.querySelectorAll('.tab').forEach(b => { b.onclick = () => { if (b.dataset.t !== tab) sw(); }; });
        box.querySelectorAll('[data-gou]').forEach(b => { b.style.cursor = 'pointer'; b.onclick = () => { scr.close(); G.openCodex({ page: 'unit', unit: b.dataset.gou }); }; });
        Kit.paintHints(true);
      }
      draw(); return scr;
    }
    // 造兵菜单里按 X：这个兵种的完整单位卡
    function unitDetail(k, owner, present) {
      sfx.ok();
      const scr = Kit.screen({ id: 'detail', dim: true, pop: true, html: `<div class="detail pn sc">${Kit.unitCard(k, { owner: G.artCode(owner), cost: G.S ? G.costOf(owner, k) : null, present })}</div>`,
        keys: { x: () => { sfx.back(); scr.close(); }, ok: () => { sfx.back(); scr.close(); } }, hints: [['b', '关闭']] });
      return scr;
    }

    // ───────── 战况：一屏一个阵营的大卡片（两方时左右并排）─────────
    function statusCard(p) {
      const ore = !!(D.RES && G.S.ore && !(G.S.rules && G.S.rules.ore === false));
      const S = G.S, dead = !G.isAlive(p), co = G.coOf(p), mm = Math.min(1, (S.meter[p] || 0) / D.METER_MAX), teams = G.NP() > 2 || G.hasTeams();
      const cnt = {}; for (const q of S.units) if (q.owner === p && G.unitSeen(q)) cnt[q.type] = (cnt[q.type] || 0) + 1;
      const ks = (D.ORDER || Object.keys(D.UNITS)).filter(t => cnt[t]), n = S.units.filter(q => q.owner === p).length;
      let pw = null; try { pw = C.powerInfo ? C.powerInfo(S, p) : null; } catch (e) { }
      return `<div class="stcard pn fac${dead ? ' dead' : ''}" data-p="${p}" style="${pcs(p)}"><div class="h">${co ? headS(co.id, p, 190, dead ? 'lose' : 'normal') : ''}<div><div class="fn">${esc(G.pname(p))}${teams ? `<em>${esc(tt('{name} 队', { name: G.teamTag(p) }))}</em>` : ''}${S.turn === p && !dead ? `<em>${esc(tt('行动中'))}</em>` : ''}</div><div class="cn">${co ? esc(G.coLabel(co)) : ''}</div></div></div>` +
        (dead ? `<div class="fn">${esc(tt('已败北'))}</div>` : `<div class="tiles">${Kit.tile(S.funds[p] || 0, tt('资金'), Kit.ic('coin', 's'))}${ore ? Kit.tile((S.ore[p] || 0), D.RES.short, Kit.ic('ore', 's')) : ''}${Kit.tile('+' + C.income(S, p), tt('每回合收入'))}${Kit.tile(C.props(S, p), tt('建筑'))}${Kit.tile(n, tt('单位数'))}</div>` +
          (G.powersOn() ? `<div class="mt">${Kit.ic('power', 's')}${esc((pw && pw.name) || (co ? co.power : ''))}${Kit.bar(mm, 'seg')}${Math.floor(mm * 100)}%</div>` : '') +
          `<div class="army">${ks.map(t => `<span data-t="${t}">${unitS(t, p, 60)}×${cnt[t]}</span>`).join('') || `<span class="mut">${esc(tt('无单位'))}</span>`}</div>`) + `</div>`;
    }
    // 多方时的总览：每家一行——回合收入、资金、单位数、建筑数、已完成科技数
    function statusAll(ps) {
      const S = G.S, teams = G.NP() > 2 || G.hasTeams(), tech = !!(C.techLines && S.tech), ore = !!(D.RES && S.ore && !(S.rules && S.rules.ore === false));
      const row = p => { const dead = !G.isAlive(p), co = G.coOf(p), n = S.units.filter(q => q.owner === p).length, done = tech && S.tech[p] && S.tech[p].done ? S.tech[p].done.length : 0;
        return `<div class="strow${dead ? ' dead' : ''}${S.turn === p && !dead ? ' cur' : ''}" style="${pcs(p)}"><span class="who2">${co ? headS(co.id, p, 76, dead ? 'lose' : 'normal') : ''}<b>${esc(G.pname(p))}</b>${teams ? `<em>${esc(tt('{name} 队', { name: G.teamTag(p) }))}</em>` : ''}</span>` +
          (dead ? `<span class="dd">${esc(tt('已败北'))}</span>` : `<span>+${C.income(S, p)}</span><span class="gold">${S.funds[p] || 0}</span>${ore ? `<span style="color:#9fe8ff">${S.ore[p] || 0}</span>` : ''}<span>${n}</span><span>${C.props(S, p)}</span>${tech ? `<span>${done}</span>` : ''}`) + `</div>`; };
      return `<div class="stall pn" style="--cols:${3 + (ore ? 1 : 0) + 1 + (tech ? 1 : 0)}"><div class="strow hd3"><span class="who2">${esc(tt('阵营', null, 'tab'))}</span><span>${esc(tt('回合收入'))}</span><span>${Kit.ic('coin', 's')}${esc(tt('资金'))}</span>${ore ? `<span>${Kit.ic('ore', 's')}${esc(D.RES.short)}</span>` : ''}<span>${esc(tt('单位数'))}</span><span>${esc(tt('建筑'))}</span>${tech ? `<span>${Kit.ic('tech', 's')}${esc(tt('已完成科技'))}</span>` : ''}</div>${ps.map(row).join('')}</div>`;
    }
    function status(onClose) {
      const ps = G.plist(), two = ps.length <= 2; let i = two ? 0 : -1;   // 多方：第一页（-1）是总览，之后一家一页
      const scr = Kit.screen({ id: 'status', dim: true, html: `<div class="crumb pn">${esc(tt('战况'))}<em>|</em><span>${esc(tt('第 {n} 天', { n: G.S.day }))}</span></div><div class="statw" id="statw"></div>`, onClose,
        keys: two ? {} : { lb: () => go(-1), rb: () => go(1), left: () => go(-1), right: () => go(1) }, hints: () => [['b', '返回'], !two && ['lbrb', i < 0 ? '查看各阵营' : '切换阵营']] });
      const draw = () => { const w = $('statw'); w.innerHTML = two ? ps.map(statusCard).join('') : `<span class="side l">‹</span>${i < 0 ? statusAll(ps) : statusCard(ps[i])}<span class="side r">›</span>`; Kit.hydrate(w); w.querySelectorAll('.side').forEach(s => { s.onclick = () => go(s.classList.contains('l') ? -1 : 1); }); Kit.paintHints(true); };
      const go = d => { i = (i + 1 + d + ps.length + 1) % (ps.length + 1) - 1; sfx.tick(); draw(); };
      draw(); return scr;
    }

    // ───────── 换人（多人同屏 + 迷雾）─────────
    function handoff(p, done) {
      const scr = Kit.screen({ id: 'handoff', cls: 'hand', html: `<div style="flex:1"></div>${embS(p)}<div class="t-xl ol">${th(tt('轮到 {who} 行动', { who: '\u0001' }), [`<span style="color:${palS(p).h}">${esc(G.pname(p))}</span>`])}</div><div class="t-b mut">${esc(tt('请将手柄交给下一位玩家，准备完毕后继续。'))}</div><div><button class="nav item" id="hoGo">${esc(tt('开始行动'))}</button></div><div style="flex:1"></div>`,
        onCancel: null, hints: [['a', '开始行动']] });
      $('hoGo').onclick = () => { sfx.ok(); scr.close(true); done(); };
    }

    // ───────── 胜负：胜方立绘 + 大字 + 几个战绩数字 ─────────
    function over(m) {
      const tz = $('toast'); if (tz) tz.remove();
      const S = G.S, win = m.win, ps = G.plist(), p0 = win[0] || ps[0], anyHuman = ps.some(p => G.human[p] || G.quit.has(p));
      const shown = m.lost ? ps.filter(p => (G.human[p] || G.quit.has(p))).slice(0, 2) : win.slice(0, 2), mood = m.lost ? 'lose' : 'power';
      const names = Kit.join(win.map(p => `<span style="color:${palS(p).h}">${esc(G.pname(p))}</span>`)) || esc(tt('无人')), q = !m.lost && S.co[p0] ? G.quoteOf(S.co[p0]) : '';
      const scr = Kit.screen({
        id: 'over', cls: 'over' + (m.lost ? ' lost' : ''), html: `<div class="ps">${shown.filter(p => S.co[p]).map(p => Kit.port(S.co[p], mood)).join('')}</div><div class="rt"><div class="big ol">${esc(m.lost ? tt('失败') : anyHuman ? tt('胜利') : tt('对局结束'))}</div>` +
          `<div class="who ol">${th(tt('{who} {team}获胜', { who: '\u0001', team: win.length > 1 ? tt('{name} 队', { name: G.teamTag(win[0]) }) : '' }), [names])}</div><div class="why">${esc(tt('第 {n} 天，{why}', { n: m.day, why: m.why }))}</div>${q ? `<div class="q pn">“${esc(q)}”</div>` : ''}` +
          `<div class="tiles">${Kit.tile(m.day, tt('天数'), Kit.ic('day', 's'))}${Kit.tile(C.props(S, p0), tt('建筑'))}${Kit.tile(S.units.filter(u => u.owner === p0).length, tt('单位数'))}${Kit.tile(S.funds[p0] || 0, tt('资金'), Kit.ic('coin', 's'))}</div>` +
          (m.unlock && m.unlock.text ? `<div class="ul${m.unlock.open ? ' open' : ''}" style="${Kit.pcs(m.unlock.faction)}">${Kit.emblem(m.unlock.faction, 's')}<b>${esc(m.unlock.open ? m.unlock.name : tt('解锁{name}', { name: m.unlock.name }))}</b><span>${esc(m.unlock.text)}</span></div>` : '') + `</div>`,
        // 主操作“再来一局”固定在右下角（金色），“返回标题”在左下，和开局流程一个样子；确定键 = 主操作
        flow: true, keys: { ok: () => { sfx.ok(); G.startGame(); } }, onCancel: () => { sfx.back(); G.showTitle(); }, hints: [['a', '再来一局'], ['b', '返回标题']],
      });
      scr.el.style.cssText = pcs(m.lost ? 0 : p0);
      if (root.AWRankUI) root.AWRankUI.result(scr.el.querySelector('.rt'), { S, human: ps.map(p => !!(G.human[p] || G.quit.has(p))).reduce((a, v, i) => { a[ps[i]] = v; return a; }, []), lost: m.lost });   // 三项分和评级章（ui-rank.js）
      // 背景图：胜利、失败各一张（cg.js 的 misc），没加载到就是原来的阵营色渐变
      try { const M = window.AWCG && window.AWCG.misc, src = M && (m.lost ? M.lose : M.win); if (src && scr && scr.el) scr.el.style.setProperty('--ovbg', `url("${src}")`); } catch (e) { }
    }
    // ───────── 解锁新阵营：整屏演出（阵营主视觉 + 徽记 + 已解锁指挥官的立绘）。o = { faction, cos: [指挥官 id…], bg } ─────────
    function unlockShow(o, done) {
      const f = o.faction, name = Kit.fname(f), cos = (o.cos || []).slice(0, 3), cn = cos.map(id => { const c = D.COS.find(q => q.id === id); return c ? G.coLabel(c) : ''; }).filter(Boolean);
      const close = () => { sfx.ok(); scr.close(true); if (done) done(); };
      const scr = Kit.screen({
        id: 'unlock', cls: 'unlk', html: `<div class="ubg" style="${o.bg ? `background-image:url(${esc(o.bg)})` : ''}"></div><div class="ups">${cos.map(id => Kit.port(id, 'normal')).join('')}</div>` +
          `<div class="uct"><div class="uem">${Kit.emblem(f, 'xl')}</div><div class="u1 ol">${esc(tt('解锁新阵营'))}</div><div class="u2 ol">${esc(name)}</div>` +
          `<div class="u3 pn">${esc(tt('自由对局中可选用{name}。', { name }))}${cn.length ? '<br>' + esc(tt('可用指挥官：{list}', { list: Kit.join(cn) })) : ''}</div></div>`,
        flow: true, keys: { ok: close }, onCancel: close, hints: [['a', '继续']],
      });
      scr.el.style.cssText = Kit.pcs(f);
      return scr;
    }

    return { hud, menu, closeMenu, build, status, handoff, over, detail, unitDetail, unlockShow };
  };
})(window);
