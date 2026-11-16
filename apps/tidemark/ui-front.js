// 潮汐战线：对局之外的画面（window.AWFront(G)）：标题、开局流程（战场 → 阵营与指挥官 → 规则 → 开战）、设置、操作说明。
// 每一步一屏，A 进下一步，B 回上一步；顶部一条步骤指示。部件都来自 ui-kit.js。
(function (root) {
  'use strict';
  root.AWFront = function (G) {
    const { D, C, Kit, sfx, opt } = G, esc = Kit.esc, Nav = Kit.Nav, T = Kit.t, $ = id => document.getElementById(id);
    Kit.css(`
    /* 标题 */
    .logo { position:relative; margin-top:70r; font-size:max(90px,236r); font-weight:900; line-height:1.1; letter-spacing:8r; transform:skewX(-7deg) rotate(-2deg); white-space:nowrap; animation:scrPop .5s both; color:transparent; }
    .logo span { position:absolute; left:0; top:0; }
    .logo .l1 { color:#1a2148; -webkit-text-stroke:34r #1a2148; text-shadow:0 18r 0 #0c1030, 0 30r 0 rgba(0,0,0,.35); }
    .logo .l2 { color:#f0b23c; -webkit-text-stroke:12r #f0b23c; }
    .logo .l3 { background:linear-gradient(#fffbe8 10%, #f6dc9a 34%, #e0b068 49%, #a8743e 52%, #e6c07a 72%, #fff2c8 92%); -webkit-background-clip:text; background-clip:text; color:transparent; }
    .logoimg { display:block; flex:none; width:1180r; max-width:94vw; margin-top:36r; animation:scrPop .5s both; filter:drop-shadow(0 14r 0 rgba(8,12,40,.45)); }
    /* 标题：“钢板与潮线”（成品图 concepts/title/sel-1..5.png）。分层，从后到前：大背景（铺满，不拉伸）和海眼的光 → 云 → 草坡 → 人物组（锚左下）→ 右侧组 .tside（钢板 → 浪花带 → 铭牌，锚右）→ 标志（锚左上）→ 角按钮。
       各层的位置和大小由 title() 里的 layout() 按窗口算。视差：#title 上的 --px / --py（-1…1，鼠标、摇杆）× 每层的 --a（像素），走 translate 属性、带过渡；常驻的慢摆动是 transform 动画——都只动合成层，不重画大图 */
    #title.tt { display:block; padding:0; background:#1f63c8; overflow:clip; animation:none; --px:0; --py:0; }
    .tt .tL { position:absolute; left:0; top:0; max-width:none; pointer-events:none; translate:calc(var(--px) * var(--a, 0) * 1px) calc(var(--py) * var(--a, 0) * .5px); transition:translate .7s cubic-bezier(.2,.7,.3,1); will-change:translate; }
    .tt img.fill { position:absolute; left:0; top:0; width:100%; height:100%; max-width:none; display:block; }
    .tt .tbg { --a:5; animation:scrFade .9s both; } .tt .tbg > img { animation:ttDrift 23s ease-in-out infinite alternate; } @keyframes ttDrift { from { transform:translate(-2px, 1px); } to { transform:translate(2px, -1px); } }
    .tt .teye { position:absolute; width:17%; height:15%; border-radius:50%; background:radial-gradient(closest-side, rgba(170,252,255,.8), rgba(60,210,255,.28) 50%, transparent); animation:ttEye 3.6s ease-in-out infinite alternate; pointer-events:none; } @keyframes ttEye { from { opacity:.15; transform:translate(-50%, -50%) scale(.9); } to { opacity:.9; transform:translate(-50%, -50%) scale(1.08); } }
    .tt .tcl { --a:8; opacity:.9; animation:scrFade 1.4s both; } .tt .tcl > i { position:absolute; inset:0; background:url('ui-assets/title/L-cloud.webp') 0 0/var(--tw) 100% repeat-x; animation:ttCloud 260s linear infinite; } @keyframes ttCloud { to { transform:translateX(calc(var(--tw) * -1)); } }
    .tt .tsl { --a:11; z-index:1; animation:scrFade .9s .1s both; }
    .tt .tfig { --a:14; z-index:1; animation:scrFade .9s .2s both; } .tt .tfig > img { transform-origin:30% 100%; animation:ttBob 5.2s ease-in-out infinite alternate; } @keyframes ttBob { from { transform:translateY(2px) rotate(-.25deg); } to { transform:translateY(-3px) rotate(.3deg); } }
    .tt .tside { --a:4; inset:0; z-index:2; transform:translateX(70%); transition:transform .5s cubic-bezier(.2,1,.3,1), translate .7s cubic-bezier(.2,.7,.3,1); } .tt.open .tside { transform:none; }
    .tt .tpan { position:absolute; } .tt .twv { --a:16; z-index:1; filter:drop-shadow(-8r 6r 0 rgba(8,30,60,.28)); animation:ttWave 4.2s ease-in-out infinite alternate; } @keyframes ttWave { from { transform:translate(-3px, 4px); } to { transform:translate(4px, -5px); } }
    .tt .twv.surge > img { animation:ttSurge .5s cubic-bezier(.2,.8,.3,1); } @keyframes ttSurge { 30% { transform:translate(-1.2%, -.6%) scale(1.025); } }
    .tt .tlogo { --a:8; z-index:3; filter:drop-shadow(0 12r 0 rgba(8,12,40,.5)); } .tt .logoimg { display:block; width:100%; margin:0; animation:none; filter:none; } .tt .logo { margin:0; font-size:max(70px,190r); animation:none; } .tt .lname { margin-top:-10r; text-align:left; padding-left:40r; font-size:max(20px,34r); } .tt .lname.big { margin-top:-6r; font-size:max(30px,64r); letter-spacing:4r; } .tt .ltag { margin:2r 26r 0 0; font-size:max(20px,27r); font-weight:700; font-style:italic; letter-spacing:1r; line-height:1.25; color:#fff3d0; text-align:right; text-wrap:balance; }
    .tt.intro .tlogo { animation:ttSlam .5s .45s cubic-bezier(.3,0,.2,1.4) both; } @keyframes ttSlam { from { transform:translateY(-140%) scale(1.6); opacity:0; } 70% { opacity:1; } }
    .tt.shake { animation:ttShake .32s !important; } @keyframes ttShake { 20% { transform:translate(0, 14r); } 45% { transform:translate(-8r, -8r); } 70% { transform:translate(6r, 5r); } }
    .tt .tpress { position:absolute; left:0; right:0; bottom:10%; z-index:5; text-align:center; font-size:max(24px,46r); font-weight:900; letter-spacing:8r; color:#fff; display:none; } .tt.wait .tpress { display:block; animation:ttBlink 1.1s 1.3s steps(2) infinite both; } @keyframes ttBlink { 0% { opacity:0; } 50% { opacity:1; } }
    .tmenu { position:absolute; inset:0; z-index:2; pointer-events:none; }
    /* 铭牌组块 */
    .tpl { position:absolute; padding:0; background:none; pointer-events:auto; cursor:pointer; transition:left .23s cubic-bezier(.3,1.5,.5,1), top .23s cubic-bezier(.3,1.5,.5,1), width .23s cubic-bezier(.3,1.5,.5,1), height .23s cubic-bezier(.3,1.5,.5,1); }
    .tpl.nav.focus { background:none; box-shadow:none; transform:none; z-index:3; } .tpl > .r, .tpl > .g { position:absolute; left:0; top:0; width:100%; height:100%; transition:opacity .16s; }
    .tpl > .g { opacity:0; } .tpl.focus > .g { opacity:1; } .tpl.focus > .r { opacity:0; }
    .tpl .gen { display:flex; align-items:center; justify-content:center; background:var(--plate) center/100% 100% no-repeat; filter:drop-shadow(0 .12em 0 rgba(40,6,4,.45)); } .tpl .g.gen { background-image:url('ui-assets/title/plate-gold.webp'); left:10%; width:84%; top:8%; height:80%; }
    .tpl .gen b { display:block; white-space:nowrap; font-size:1em; font-weight:900; letter-spacing:.1em; transform:skewX(-11deg); color:#ffe9d0; -webkit-text-stroke:.05em currentColor; text-shadow:0 .06em 0 #4a0d0a, .06em 0 0 #4a0d0a, -.06em 0 0 #4a0d0a, 0 -.06em 0 #4a0d0a, .05em .05em 0 #4a0d0a, -.05em .05em 0 #4a0d0a, .05em -.05em 0 #4a0d0a, -.05em -.05em 0 #4a0d0a, 0 .14em 0 rgba(40,6,4,.5); }
    .tpl .g.gen b { font-size:1.3em; color:#3a1c06; text-shadow:0 .05em 0 #fff1b8, .05em 0 0 #fff1b8, -.05em 0 0 #fff1b8, 0 -.05em 0 #fff1b8, 0 .12em 0 rgba(120,70,10,.45); }
    .tpl .cur { position:absolute; left:-11%; top:50%; margin-top:-.6em; border:.6em solid transparent; border-left:.9em solid #39d6e6; border-right:0; filter:drop-shadow(.05em 0 0 #0e1220) drop-shadow(-.05em 0 0 #0e1220) drop-shadow(0 .05em 0 #0e1220) drop-shadow(0 -.05em 0 #0e1220); }
    /* 说明文字：贴在选中那块牌子下面的一行纯文字（没有底板、铆钉——它不能点） */
    .tpl .tinfo { position:absolute; left:12%; top:96%; display:flex; align-items:center; gap:.3em; font-size:max(20px,.5em); font-weight:900; color:#fff; white-space:nowrap; text-shadow:0 .08em 0 #3a0c08, .08em 0 0 #3a0c08, -.08em 0 0 #3a0c08, 0 -.08em 0 #3a0c08; opacity:0; transition:opacity .16s; pointer-events:none; } .tpl.focus .tinfo { opacity:1; } .tpl .tinfo .ic { width:1.1em; height:1.1em; }
    /* 浪花：选中时从牌子下缘溅起（晚 60 毫秒），失去选中时落下消散。金牌图里本身画着浪花的（简体中文的战役、自由对局），这个通用浪花只在动效里闪一下 */
    .tpl .spl { position:absolute; right:-4%; bottom:-6%; width:46%; opacity:0; pointer-events:none; transform-origin:60% 100%; transition:transform .26s ease-in, opacity .26s ease-in; transform:translateY(46%) scale(.8); z-index:2; }
    .tpl:not(.focus) > img.g ~ .spl { transition:none; } .tpl.focus .spl { opacity:1; transform:none; transition:transform .24s cubic-bezier(.3,1.7,.5,1) .06s, opacity .12s .06s; } .tpl.focus > img.g ~ .spl { animation:ttSplOut .5s .3s both; } @keyframes ttSplOut { to { opacity:0; } }
    .tpl.go > .g { animation:tplGo .19s ease-out; } @keyframes tplGo { 35% { filter:brightness(4) saturate(0); transform:scale(1.08); } } .tpl.go .spl { animation:ttBurst .19s ease-out both !important; } @keyframes ttBurst { from { opacity:1; transform:none; } to { opacity:0; transform:translateY(-40%) scale(1.9); } }
    .tmenu.in .tpl { animation:plateIn .3s cubic-bezier(.3,1.6,.5,1) both; animation-delay:calc(var(--d0, 0s) + var(--i, 0) * .09s); } .tmenu.in .tpl:nth-child(2) { --i:1; } .tmenu.in .tpl:nth-child(3) { --i:2; } .tmenu.in .tpl:nth-child(4) { --i:3; } .tmenu.in .tpl:nth-child(5) { --i:4; } .tt.intro .tmenu { --d0:.3s; }   /* 第一次进场：等钢板切进来再钉牌子 */
    body.nofx .tpl, body.nofx .tpl > *, body.nofx .tpl .spl { transition:none !important; animation:none !important; } .tt.wait .tmenu { visibility:hidden; }
    .tt .tver { position:absolute; left:24r; bottom:14r; z-index:4; font-size:max(12px,20r); font-weight:800; font-style:italic; color:#fff; text-shadow:0 2r 0 #0e1220, 2r 0 0 #0e1220, -2r 0 0 #0e1220, 0 -2r 0 #0e1220; opacity:.9; min-height:1em; } .tt .tver::after { content:"Ver. 1.0"; } .tt .tcred { position:absolute; left:calc(24r + max(12px,20r) * 5.6); bottom:11r; z-index:4; font-size:max(20px,20r); font-weight:800; line-height:1.2; white-space:nowrap; color:#fff; text-shadow:0 2r 0 #0e1220, 2r 0 0 #0e1220, -2r 0 0 #0e1220, 0 -2r 0 #0e1220, 0 1px 0 #0e1220, 1px 0 0 #0e1220, -1px 0 0 #0e1220, 0 -1px 0 #0e1220; opacity:.92; pointer-events:none; }
    /* 右上角的语言、喇叭：钢板小牌 */
    #title .tlang, body.tt-on #snd { border:0 !important; border-image:none !important; filter:drop-shadow(0 5r 0 rgba(40,6,4,.45)); background:radial-gradient(circle 5r at 12r 12r, #7a4a10 60%, transparent 62%), radial-gradient(circle 5r at calc(100% - 12r) 12r, #7a4a10 60%, transparent 62%), radial-gradient(circle 5r at 12r calc(100% - 12r), #7a4a10 60%, transparent 62%), radial-gradient(circle 5r at calc(100% - 12r) calc(100% - 12r), #7a4a10 60%, transparent 62%), linear-gradient(#f6cf74, #d59a34 55%, #a8721a) !important; box-shadow:inset 0 0 0 4r #3a1c06, inset 0 9r 0 rgba(255,244,200,.5), inset 0 -8r 0 rgba(90,50,8,.45) !important; color:#3a1c06; font-weight:900; border-radius:12r; } #title .tlang svg { stroke:#3a1c06; } #title .tlang { height:max(48px,88r) !important; top:38r !important; right:32r !important; padding:0 20r 0 14r !important; font-size:max(20px,28r) !important; z-index:5 !important; } body.tt-on #snd { width:max(48px,88r); height:max(48px,88r); top:38r; right:32r; }
    /* 标题画面不放喇叭按钮（声音在“设置”里开关，键盘 V 也行）：标题页在最上面时藏起来，右上角只剩语言按钮；标题页上面盖着别的页面（开局、设置、图鉴）时照旧显示 */
    body:has(#title):not(:has(#title ~ .scr)) #snd { display:none !important; }
    /* 竖屏：上半是背景、标志和人物，下半是钢板和牌子，分界仍是斜向的浪花（浪花带由 layout() 转过来） */
    body.narrow .tt .tside { transform:translateY(62%); } body.narrow .tt.open .tside { transform:none; }
    body.narrow .tt .tpan { clip-path:polygon(0 52%, 100% 40%, 100% 100%, 0 100%); background:#8f1f1a url('ui-assets/title/L-ptex.webp') center 80%/cover no-repeat; } body.narrow .tt .tpan > img { display:none; } body.narrow .tt .lname { text-align:center; padding-left:0; } body.narrow .tt .ltag { text-align:center; margin:4r 0 0 !important; }
    /* 设置里关了“转场动画”：没有视差、没有常驻摆动，进场全部淡入 */
    body.nofx .tt .tL { translate:none; transition:none; animation:none; } body.nofx .tt .tL > img, body.nofx .tt .tL > i, body.nofx .tt .teye { animation:none; } body.nofx .tt .teye { transform:translate(-50%, -50%); opacity:.5; }
    body.nofx .tt .tside { transform:none; opacity:0; transition:opacity .3s; } body.nofx .tt.open .tside { opacity:1; } body.nofx .tt.intro .tlogo { animation:scrFade .4s both; }
    .lname { flex:none; margin-top:-12r; font-size:max(20px,30r); font-weight:900; line-height:1.1; letter-spacing:6r; color:#fff3d0; text-align:center; }
    /* 语言：标题右上角的入口（喇叭图标左边，不进方向键的焦点顺序）、语言列表 */
    #title .tlang { position:absolute; right:calc(max(48px,72r) + 40r); top:20r; z-index:3; height:max(48px,72r); padding:0 18r 0 12r; display:flex; align-items:center; gap:10r; font-size:max(20px,26r); color:var(--txt); white-space:nowrap; cursor:pointer; } #title .tlang svg { flex:none; width:40r; height:40r; } #title .tlang:hover { background:var(--panel2); }
    body.narrow #title .tlang span { display:none; } body.narrow #title .tlang { padding:0 12r; }
    .lgp { margin:auto; width:900r; max-width:100%; padding:26r 30r 22r; } .lgp h2 { margin:0 0 12r; text-align:center; font-size:max(26px,44r); font-weight:900; color:var(--gold); }
    .lgp .ls { display:grid; grid-template-columns:1fr 1fr; gap:0 16r; } .lgp .item { min-height:max(56px,76r); } .lgp .item.auto { grid-column:1 / -1; }
    body.narrow .lgp { width:auto; align-self:stretch; margin:auto 20r; }
    /* 选战场 */
    .mgrp { display:flex; gap:12r; align-items:center; } .mgrp .g { height:56r; padding:0 26r; display:flex; align-items:center; border-radius:28r; background:var(--bg2); color:var(--mut); font-size:max(20px,28r); box-shadow:inset 0 0 0 3r var(--line); cursor:pointer; } .mgrp .g.on { background:var(--txt); color:var(--ink); }
    .mhead { display:flex; align-items:center; gap:24r; height:110r; margin-top:6r; } .mhead .nm { font-size:max(44px,88r); font-weight:900; line-height:1; color:#fff3d0; } .mhead .chip { height:max(44px,64r); font-size:max(22px,34r); padding:0 24r; box-shadow:inset 0 0 0 4r var(--gold), inset 0 0 0 7r var(--line); }
    .mrow { flex:1; min-height:0; position:relative; width:100%; display:flex; align-items:center; justify-content:center; }
    .mrow .mid { padding:14r; display:flex; cursor:pointer; } .mrow canvas { display:block; border-radius:6r; }
    .mrow .nb { position:absolute; top:50%; transform:translateY(-50%); padding:10r; opacity:.5; cursor:pointer; } .mrow .nb.l { left:-170r; } .mrow .nb.r { right:-170r; }
    .mrow .side.l { left:calc(50% - 640r); } .mrow .side.r { right:calc(50% - 640r); }
    .mblurb { flex:none; min-height:76r; max-width:1560r; padding:8r 24r; display:flex; align-items:center; text-align:center; font-size:max(20px,28r); line-height:1.4; color:var(--txt); } .mblurb i { font-style:normal; color:var(--mut); font-size:max(20px,26r); }
    /* 谁来打 */
    .seats { flex:1; min-height:0; display:flex; gap:36r; align-items:center; justify-content:center; width:100%; }
    .seat { width:400r; padding:30r 26r 26r; display:flex; flex-direction:column; align-items:center; gap:14r; cursor:pointer; opacity:.9; } .seat.nav.focus { background:linear-gradient(var(--pc), var(--pcd)); color:var(--txt); opacity:1; transform:scale(1.07); box-shadow:inset 0 0 0 6r var(--gold), inset 0 12r 0 rgba(255,255,255,.2), 0 0 0 5r var(--line), 0 14r 0 rgba(0,0,0,.45); text-shadow:0 3r 0 rgba(0,0,0,.45); }
    .seat { position:relative; overflow:hidden; } .seat .pic { position:absolute; left:0; right:0; top:0; height:230r; background:center/cover no-repeat; -webkit-mask-image:linear-gradient(#000 55%, transparent); mask-image:linear-gradient(#000 55%, transparent); opacity:.9; } .seat > *:not(.pic) { position:relative; }
    .seat .fn { font-size:max(34px,64r); font-weight:900; line-height:1.1; color:#fff; text-shadow:0 4r 0 rgba(0,0,0,.4); } .seat .ic.xl { width:150r; height:150r; filter:drop-shadow(0 6r 0 rgba(0,0,0,.35)); }
    .seat .val { display:flex; flex-direction:column; align-items:center; width:100%; padding:6r 0; border-radius:14r; background:rgba(10,14,28,.5); font-size:max(26px,46r); font-weight:900; color:var(--gold2); line-height:1.2; } .seat .val i { font-style:normal; font-size:max(20px,23r); opacity:.35; line-height:1; cursor:pointer; padding:4r 40r; } .seat.focus .val i { opacity:1; color:#fff; }
    .seat .team { height:54r; padding:0 26r; display:flex; align-items:center; gap:10r; border-radius:27r; background:var(--gold); color:var(--ink); font-size:max(20px,30r); font-weight:900; text-shadow:none; cursor:pointer; }
    .seat .who { display:flex; align-items:center; gap:14r; font-size:max(20px,30r); color:#fff; cursor:pointer; } .seat .who .hd { width:84r; height:84r; color:#fff; font-size:50r; font-weight:900; }
    /* 选指挥官 */
    .copick { background:linear-gradient(115deg, var(--pcd) 0 30%, var(--bg) 30.1%) !important; }
    .copick .emb { position:absolute; left:40r; top:260r; width:420r; height:420r; opacity:.22; background:center/contain no-repeat; pointer-events:none; }
    .copick .big { position:absolute; left:-40r; bottom:0; width:800r; height:860r; display:flex; align-items:flex-end; justify-content:center; pointer-events:none; } .copick .big img { height:100%; max-width:none; } .copick .big .qm { font-size:500r; font-weight:900; color:rgba(255,255,255,.35); line-height:1.3; }
    .copick .info { position:absolute; left:690r; right:40r; top:112r; bottom:206r; display:flex; flex-direction:column; gap:14r; }
    .copick .nm { display:flex; align-items:baseline; gap:26r; white-space:nowrap; flex:none; } .copick .nm b { font-size:max(52px,108r); font-weight:900; line-height:1.05; color:#fff3d0; } .copick .nm span { font-size:max(26px,50r); font-weight:900; font-style:italic; color:var(--gold); } .copick .nm span::before { content:"/ "; }
    .copick .nm em { font-style:normal; font-size:max(20px,26r); padding:2r 16r; border-radius:8r; background:var(--bg2); color:var(--gold); box-shadow:inset 0 0 0 3r var(--line); align-self:center; }
    .copick .qt { flex:none; align-self:flex-start; padding:8r 36r; font-size:max(22px,38r); border-radius:14r; background:rgba(120,40,50,.35); background:color-mix(in srgb, var(--pcd) 55%, transparent); box-shadow:inset 0 0 0 4r var(--pcd); }
    .copick .sk { flex:none; display:flex; flex-direction:column; gap:8r; } .copick h4 { margin:0; display:flex; align-items:center; gap:12r; font-size:max(20px,30r); color:var(--gold); }
    .copick .bx { flex:none; padding:14r 22r 16r; display:flex; flex-direction:column; gap:6r; } .copick .bx p { margin:0; font-size:max(20px,28r); line-height:1.4; }
    .copick .bx .pw { font-size:max(24px,40r); font-weight:900; color:#fff; margin-left:10r; }
    .copick .gd { flex:none; display:flex; align-items:center; gap:10r; font-size:max(20px,28r); color:var(--mut); } .copick .gd .u { width:88r; height:76r; display:flex; align-items:center; justify-content:center; border-radius:12r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); }
    .copick .heads { position:absolute; left:700r; right:40r; bottom:100r; display:flex; gap:22r; align-items:center; height:104r; }
    .hsel { position:relative; flex:none; width:104r; height:104r; border-radius:14r; } .hsel .hd { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:90r; font-weight:900; color:#fff; } .hsel.on::after { content:"✓"; position:absolute; right:-10r; top:-14r; width:48r; height:48r; border-radius:50%; background:var(--green); color:#fff; font-size:32r; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 4r var(--line); }
    .hsel.nav.focus { background:none; transform:scale(1.22); box-shadow:0 0 0 6r var(--gold), 0 0 0 10r var(--line), 0 16r 0 rgba(0,0,0,.4); }
    body.narrow .copick .big { left:0; top:100r; bottom:auto; width:100%; height:480r; } body.narrow .copick .emb { display:none; } body.narrow .copick .info { left:20r; right:20r; top:590r; bottom:330r; }
    body.narrow .copick .heads { left:20r; right:20r; bottom:200r; gap:14r; justify-content:center; } body.narrow .copick .crumb { display:none; } body.narrow .copick .tab { padding:0 14r; height:64r; } body.narrow .copick .nm b { font-size:84r; }
    body.narrow .vsw { flex-wrap:wrap; align-content:center; align-items:flex-end; gap:10r; padding:0 10r; overflow-y:auto; } body.narrow .vsc { order:-1; width:100%; gap:6r; } body.narrow .vsc .v { font-size:130r; }
    body.narrow .vsp { flex:1 1 44%; height:auto; } body.narrow .vsp img, body.narrow .vsp .qm { height:430r; } body.narrow .vsp .qm { font-size:260r; } body.narrow .vsp .pl { margin:-20r 0 10r; padding:6r 14r; } body.narrow .vsp .pl b { font-size:max(18px,34r); } body.narrow .vsp .pl span { white-space:normal; }
    /* 规则 */
    .rec { font-size:max(20px,26r); color:var(--mut); margin-top:10r; max-width:900r; line-height:1.4; }
    /* 对阵 */
    .vsw { flex:1; min-height:0; width:100%; display:flex; align-items:flex-end; justify-content:center; gap:20r; padding:0 40r; position:relative; }
    .vsp { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; flex:1; min-width:0; } .vsp img, .vsp .qm { height:78%; max-width:100%; animation:portIn .45s ease-out both; } .vsp.flip img { transform:scaleX(-1); animation-name:portInR; } @keyframes portIn { from { transform:translateX(-50vw); } } @keyframes portInR { from { transform:translateX(50vw) scaleX(-1); } }
    .vsp .qm { display:flex; align-items:center; font-size:420r; font-weight:900; color:rgba(255,255,255,.3); }
    #wzVs .vsbg, #wzVs .vsdim { position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; } #wzVs .vsbg { object-fit:cover; } #wzVs .vsdim { background:radial-gradient(ellipse 70% 60% at 50% 46%, rgba(14,7,7,.42), rgba(10,5,5,.72)); }
    .vsp::before { content:""; position:absolute; left:4%; right:4%; bottom:0; height:92%; background:radial-gradient(ellipse 50% 58% at 50% 100%, var(--pc), transparent 72%); opacity:.5; pointer-events:none; }
    .vsp .pl { position:relative; margin:-30r 0 26r; padding:12r 90r 14r; text-align:center; z-index:2; background:linear-gradient(90deg, transparent, var(--pcd) 16%, var(--pc) 50%, var(--pcd) 84%, transparent); border-top:4r solid var(--pcl); border-bottom:4r solid rgba(0,0,0,.45); border-image:linear-gradient(90deg, transparent, var(--pcl) 20%, var(--pcl) 80%, transparent) 1; }
    .vsp .pl b { display:flex; align-items:center; justify-content:center; gap:10r; } .vsp .pl b .ic { width:52r; height:52r; }
    .vsp .pl b { font-size:max(26px,48r); font-size:max(26px,48r); font-weight:900; color:#fff; text-shadow:0 3r 0 rgba(0,0,0,.4); white-space:nowrap; } .vsp .pl span { font-size:max(20px,30r); color:#fff; opacity:.9; white-space:nowrap; }
    .vsc { flex:none; align-self:center; display:flex; flex-direction:column; align-items:center; gap:14r; width:520r; } .vsc .v { font-size:max(100px,280r); font-weight:900; font-style:italic; line-height:1; color:var(--gold); animation:scrPop .4s .3s both; } .vsc .chips { justify-content:center; }
    /* 选指挥官：右侧一行一项（图标 + 小标签 + 大字短句）；未解锁的是剪影加解锁条件 */
    .copick .info { bottom:262r; gap:8r; } .copick .nm b { font-size:max(44px,88r); } .copick .qt { padding:4r 28r; font-size:max(20px,30r); } .copick .heads { bottom:144r; } .copick .crumb { bottom:calc(140 * var(--r)) !important; }
    .crow { flex:none; display:flex; align-items:center; gap:16r; min-height:58r; padding:6r 20r 6r 12r; background:rgba(10,14,28,.6); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,24r); line-height:1.3; font-weight:700; }
    .crow > .ic { width:44r; height:44r; flex:none; } .crow .lb { flex:none; width:196r; font-size:max(20px,26r); line-height:1.2; font-weight:900; color:var(--gold); white-space:normal; } .crow .tx { flex:1; min-width:0; } .crow .tx b { font-weight:900; color:#fff; margin-right:14r; font-size:max(20px,31r); }
    .info.tight { gap:5r !important; } .info.tight .crow { min-height:0; padding:3r 16r 3r 10r; line-height:1.22; } .info.tight .nm b { font-size:max(34px,70r); }
    .crow.cond { color:var(--txt); } .crow.cond .lb { width:auto; font-size:max(22px,34r); color:#6f7892; } .crow.cond.ok { color:#b6f08a; } .crow.cond.ok .lb { color:#8fd45a; }
    .copick .tab.lock { background:#0b0e16; color:#6f7892; box-shadow:inset 0 0 0 4r #232a40; } .copick .tab.lock .ic { filter:brightness(0) drop-shadow(0 0 2r #9ab); } .copick .tab.lock.on { box-shadow:inset 0 0 0 4r var(--gold); transform:scale(1.06); color:#cfd6ea; text-shadow:none; }
    .hsel.un .hd { filter:brightness(0) drop-shadow(0 0 2r #9ab); } .hsel.un::after { content:""; position:absolute; right:-8r; top:-10r; width:40r; height:40r; border-radius:50%; background:#232a40; box-shadow:0 0 0 4r var(--line); }
    .copick .big .lkbig { font-size:300r; color:rgba(255,255,255,.25); margin-bottom:260r; }
    body.narrow .copick .info { bottom:340r; } body.narrow .copick .heads { bottom:210r; } body.narrow .crow .lb { width:150r; }
    body.small:not(.narrow) .copick .info { top:120r; bottom:calc(62px + 120r); } body.small:not(.narrow) .copick .heads { bottom:66px; } body.small:not(.narrow) .copick .nm b { font-size:max(30px,108r); } body.small:not(.narrow) .copick .crumb { display:none; }
    /* 谁来打：黑潮未解锁时的剪影牌 */
    .seat { flex:0 1 400r; min-width:0; } .seat.lockc { flex:0 0 250r; align-self:center; background:#0b0e16 !important; color:#6f7892; gap:10r; padding:26r 12r; } .seat.lockc .ic.xl { filter:brightness(0) drop-shadow(0 0 3r #9ab); } .seat.lockc .fn { color:#8f99b5; font-size:max(28px,52r); }
    .seat.lockc small { font-size:max(20px,24r); font-weight:800; text-align:center; line-height:1.3; } .seat.lockc.nav.focus { background:#141a2c !important; color:#cfd6ea; box-shadow:inset 0 0 0 6r var(--gold), 0 0 0 5r var(--line), 0 14r 0 rgba(0,0,0,.45); text-shadow:none; }
    /* 开局第 2 步“阵营与指挥官”（.cosel = 选指挥官那一屏 + 一排席位小卡 + 竖排的阵营页签） */
    .cosel .sstrip { position:absolute; left:690r; right:40r; top:132r; height:108r; z-index:2; display:flex; gap:16r; align-items:stretch; } .cosel.s4 .sstrip { left:150r; }
    .scard { flex:1 1 0; min-width:0; max-width:620r; display:flex; align-items:center; gap:14r; padding:8r 16r 8r 12r; border-radius:14r; background:linear-gradient(var(--pc), var(--pcd)); color:#fff; box-shadow:inset 0 0 0 4r var(--line); cursor:pointer; filter:saturate(.7) brightness(.72); }
    .scard.cur { filter:none; box-shadow:inset 0 0 0 5r var(--gold), inset 0 10r 0 rgba(255,255,255,.18), 0 6r 0 rgba(0,0,0,.4); } .scard.nav.focus { background:linear-gradient(var(--pc), var(--pcd)); color:#fff; transform:none; filter:none; box-shadow:inset 0 0 0 5r var(--gold), 0 0 0 5r var(--line), 0 8r 0 rgba(0,0,0,.45); }
    .scard .hd { flex:none; width:84r; height:84r; display:flex; align-items:center; justify-content:center; font-size:60r; font-weight:900; color:#fff; } .scard .sr { flex:1; min-width:0; display:flex; flex-direction:column; gap:6r; }
    .scard .sx { display:flex; align-items:baseline; gap:12r; white-space:nowrap; overflow:hidden; } .scard .sx b { min-width:0; overflow:hidden; text-overflow:ellipsis; font-size:max(20px,32r); font-weight:900; line-height:1.15; text-shadow:0 3r 0 rgba(0,0,0,.4); } .scard .sx em { flex:none; display:flex; align-items:center; gap:4r; font-style:normal; font-size:max(20px,22r); font-weight:800; line-height:1.15; opacity:.92; } .scard .sx em .ic { width:1.1em; height:1.1em; }
    .scard .sb { display:flex; gap:8r; min-width:0; } .scard .sv, .scard .st { height:max(28px,40r); padding:0 14r; border-radius:20r; display:flex; align-items:center; font-size:max(20px,24r); font-weight:900; line-height:1; white-space:nowrap; cursor:pointer; }
    .scard .sv { display:block; line-height:max(28px,40r); min-width:0; overflow:hidden; text-overflow:ellipsis; background:rgba(10,14,28,.6); color:var(--gold2); box-shadow:inset 0 0 0 3r rgba(255,255,255,.28); } .scard .st { flex:none; background:var(--gold); color:var(--ink); text-shadow:none; }
    .cosel .ctop { position:absolute; left:20r; top:256r; z-index:2; width:auto; height:auto; padding:0; flex-direction:column; align-items:flex-start; gap:8r; } .cosel .ctop .tabs { flex-direction:column; align-items:stretch; gap:8r; } .cosel .ctop .tab { height:64r; padding:0 18r 0 12r; font-size:max(20px,28r); } .cosel .ctop .tab.on { transform:translateX(12r); } .cosel .ctop .kcw { margin-left:14r; }
    .cosel .info { top:256r; } .cosel .emb { left:150r; } body[data-dev=touch].small:not(.narrow) .cosel .ctop .tab { min-height:32px; }
    body.narrow .cosel .top .steps { gap:4r; } body.narrow .cosel .top .step { white-space:nowrap; padding:0 10r; gap:6r; } body.narrow .cosel .hsel { width:92r; height:92r; } body.narrow .cosel .heads { gap:12r; }
    body.narrow .cosel .sstrip { left:16r; right:16r; top:128r; height:auto; flex-wrap:wrap; gap:10r; } body.narrow .scard { flex:1 1 40%; max-width:none; padding:8r 10r; gap:10r; } body.narrow .scard .hd { width:76r; height:76r; } body.narrow .cosel.s3 .scard .hd, body.narrow .cosel.s4 .scard .hd { width:56r; height:56r; font-size:40r; } body.narrow .cosel.s3 .scard, body.narrow .cosel.s4 .scard { gap:6r; padding:8r 6r; } body.narrow .cosel.s3 .scard .sb, body.narrow .cosel.s4 .scard .sb { gap:4r; } body.narrow .cosel.s3 .scard .sv, body.narrow .cosel.s3 .scard .st, body.narrow .cosel.s4 .scard .sv, body.narrow .cosel.s4 .scard .st { padding:0 7r; }
    body.narrow .cosel .ctop { left:0; right:0; top:242r; width:100%; flex-direction:row; justify-content:center; } body.narrow .cosel .ctop .tabs { flex-direction:row; gap:4r; } body.narrow .cosel .ctop .tab { padding:0 7r; gap:5r; } body.narrow .cosel .ctop .tab .ic { width:38r; height:38r; } body.narrow .cosel .ctop .tab.on { transform:none; } body.narrow .cosel .ctop .kcw { display:none; }
    body.narrow .cosel .big { top:300r; height:390r; } body.narrow .cosel .info { top:700r; } body.narrow .cosel.s3 .ctop, body.narrow .cosel.s4 .ctop { top:350r; } body.narrow .cosel.s3 .big, body.narrow .cosel.s4 .big { top:410r; height:320r; } body.narrow .cosel.s3 .info, body.narrow .cosel.s4 .info { top:740r; }
    body.small:not(.narrow) .cosel .sstrip { height:auto; top:96r; left:40r; right:260r; } body.small:not(.narrow) .scard .hd { width:76r; height:76r; } body.small:not(.narrow) .cosel .ctop { top:250r; } body.small:not(.narrow) .cosel .ctop .tab { height:56r; } body.small:not(.narrow) .cosel .info { top:250r; left:760r; } body.small:not(.narrow) .cosel .ctop .kcw { display:none; }
    #lockpop { position:absolute; z-index:6; width:980r; max-width:92vw; padding:22r 30r; display:flex; flex-direction:column; gap:8r; font-size:max(20px,28r); font-weight:800; animation:scrPop .14s both; } #lockpop h4 { margin:0 0 6r; font-size:max(22px,36r); color:var(--gold); }
    #lockpop .cond { display:flex; gap:14r; } #lockpop .cond i { flex:none; width:1.3em; text-align:center; font-style:normal; color:#6f7892; } #lockpop .cond.ok { color:#b6f08a; } #lockpop .cond.ok i { color:#8fd45a; }
    body.narrow .seat { flex:none; } body.narrow .seat.lockc { flex:0 0 340r; }
    /* 设置：大行高 + 分段选择器，右边一块说明 */
    .setl { flex:1; min-width:0; min-height:0; overflow:hidden auto; scrollbar-width:none; padding:14r 30r 14r 26r; display:flex; flex-direction:column; } .setl::-webkit-scrollbar { display:none; }
    .setl .orow { flex:none; min-height:max(56px,84r); margin:5r 0; } .setl .orow .lb { flex:none; margin-right:20r; }
    .orow .sg { margin-left:auto; display:flex; flex:none; box-shadow:0 0 0 3r var(--line); } .orow .sg i { font-style:normal; display:flex; align-items:center; justify-content:center; min-width:76r; min-height:max(36px,56r); padding:0 20r; font-size:max(20px,28r); font-weight:800; color:var(--mut); background:var(--bg2); border-left:3r solid var(--line); cursor:pointer; white-space:nowrap; } .orow .sg i:first-child { border-left:0; }
    .orow .sg i.on { background:linear-gradient(var(--gold2), var(--gold)); color:var(--ink); font-weight:900; } .orow.focus .sg { box-shadow:0 0 0 3r var(--ink); } .orow.focus .sg i { background:rgba(60,26,10,.78); color:#e8c98c; border-left-color:var(--ink); } .orow.focus .sg i.on { background:#fff7d8; color:var(--ink); box-shadow:inset 0 0 0 4r var(--ink); }
    .orow .go { margin-left:auto; display:flex; align-items:center; gap:14r; color:var(--gold); font-weight:900; font-size:max(20px,28r); } .orow.focus .go { color:var(--ink); }
    .setd { flex:none; width:560r; padding:34r 38r; display:flex; flex-direction:column; gap:18r; background:rgba(0,0,0,.22); border-left:5r solid var(--line); } .setd h3 { margin:0; font-size:max(26px,44r); font-weight:900; color:var(--gold); } .setd p { margin:0; font-size:max(20px,30r); line-height:1.55; font-weight:700; }
    body.narrow .setd { width:auto; border-left:0; border-top:5r solid var(--line); padding:14r 22r; gap:6r; max-height:26%; overflow-y:auto; } body.narrow .setd h3 { font-size:max(20px,32r); } body.narrow .setl { padding:10r 12r; } body.narrow .setl .orow { flex-wrap:wrap; padding:8r 14r 8r 20r; white-space:normal; } body.narrow .setl .orow.focus::before { display:none; } body.narrow .sg { margin:6r 0 0 auto; max-width:100%; overflow-x:auto; }
    body.small:not(.narrow) .setd { width:520r; padding:16r 22r; } body.small:not(.narrow) .setl .orow { min-height:44px; }
    /* 操作说明：示意图配标注 */
    .hwrap { flex:1; min-height:0; display:flex; align-items:center; justify-content:center; position:relative; }
    .hdia { position:relative; flex:none; } .hdia svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; } .hdia .ln path { fill:none; stroke:#ffe08a; stroke-width:3; } .hdia .dot circle { fill:#ffe08a; stroke:#0e1220; stroke-width:4; } .hdia .dot text { font:900 17px sans-serif; fill:#1a1d2b; text-anchor:middle; dominant-baseline:central; }
    .hdia .hl { position:absolute; width:27%; transform:translateY(-50%); display:flex; align-items:center; gap:12r; font-size:max(20px,28r); line-height:1.25; font-weight:800; } .hdia .hl.l { left:0; flex-direction:row-reverse; text-align:right; } .hdia .hl.r { right:0; }
    .hdia .hl .no, .hlist .no { flex:none; display:inline-flex; align-items:center; justify-content:center; width:max(26px,40r); height:max(26px,40r); border-radius:50%; background:#ffe08a; color:var(--ink); font-size:max(20px,24r); font-weight:900; box-shadow:0 0 0 3r var(--line); } .hl b, .hlist b { color:var(--gold2); font-weight:900; white-space:nowrap; }
    .hlist { display:none; flex-direction:column; gap:8r; width:100%; padding:10r 6r; font-size:max(18px,30r); font-weight:800; } .hlist > div { display:flex; align-items:center; gap:12r; padding:8r 12r; background:rgba(0,0,0,.28); box-shadow:inset 0 0 0 3r var(--line); }
    .hkb { flex:1; min-height:0; width:100%; display:flex; flex-direction:column; gap:16r; align-items:center; } .hkb svg { flex:1 1 0; min-height:0; width:100%; } .hkb svg text { font:800 22px sans-serif; fill:#1a1d2b; text-anchor:middle; dominant-baseline:central; } .hkb svg .k { fill:#39425e; stroke:#0e1220; stroke-width:3; } .hkb svg .kt { fill:#8f99b5; }
    .hleg { flex:none; display:grid; grid-template-columns:repeat(3, auto); gap:10r 40r; font-size:max(20px,28r); font-weight:800; } .hleg > div { display:flex; align-items:center; gap:12r; } .hleg u { flex:none; width:34r; height:34r; box-shadow:0 0 0 3r var(--line); } .hleg .kc { margin-right:2r; }
    body.narrow .hwrap { flex-direction:column; justify-content:flex-start; overflow-y:auto; } body.narrow .hdia .ln, body.narrow .hdia .hl { display:none; } body.narrow .hlist { display:flex; } body.narrow .hleg { grid-template-columns:1fr; gap:8r; } body.narrow .hkb svg { flex:none; height:260r; } body.narrow .hkb { overflow-y:auto; }
    body.small:not(.narrow) .hleg { gap:4r 30r; }
    `);

    // ───────── 标题 ─────────
    // 标题标志：图片（ui-assets.js 的 logo，铆钉钢板字）；图片缺席时退回 CSS 画的字
    // 标志按界面语言取：简体、繁体、日文、韩文各一块，其余语言共用拉丁字母的 Tidemark；查不到退回拉丁那块
    const LOGO = () => { const A = root.AWUIAssets || {}, l = Kit.lang(); return A['logo-' + ({ 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', ja: 'ja', ko: 'ko' }[l] || 'latin')] || A['logo-latin'] || A.logo || ''; };
    // ───────── 语言：列表（设置页的“语言”一行、标题右上角的入口、标题画面按 L 都开这一张）─────────
    const I18N = () => root.AWI18n || null;
    const canLang = () => { const I = I18N(); return !!(I && I.list && I.info && typeof G.switchLang === 'function'); };
    const langName = id => { try { return (I18N().info(id) || {}).name || ''; } catch (e) { return ''; } };   // 语言名用各自语言写，不翻译
    const langNow = () => { const name = langName(); return I18N().auto ? T('自动（{name}）', { name }) : name; };
    const GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="#f4efe0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.4 3.2 3.4 14.8 0 18M12 3c-3.4 3.2-3.4 14.8 0 18"/></svg>';
    function langPick() {
      if (!canLang() || $('langPick')) return null;
      const I = I18N(), cur = I.auto ? 'auto' : I.lang, fromTitle = !!(Nav.top() && Nav.top().el.id === 'title');   // 从标题右上角打开的：换完回到标题，不进设置
      let det = ''; try { det = I.detect ? langName(I.detect()) : ''; } catch (e) { }
      const item = (id, text) => `<button class="nav item${id === 'auto' ? ' auto' : ''}" data-lang="${esc(id)}">${esc(text)}${id === cur ? '<span class="c">✓</span>' : ''}</button>`;
      const scr = Kit.screen({
        id: 'langPick', dim: true, pop: true, flow: true, hints: [['a', '确定'], ['b', '返回']],
        html: `<div class="lgp pn"><h2>${esc(T('语言'))} / Language</h2><div class="ls">${item('auto', det ? T('自动（{name}）', { name: det }) : T('自动'))}${I.list().map(l => item(l.id, l.name)).join('')}</div></div>`,
      });
      scr.el.querySelectorAll('[data-lang]').forEach(b => { b.onclick = () => { const id = b.dataset.lang; sfx.ok(); if (id === cur) return scr.close(); G.switchLang(id, fromTitle ? 'title' : ''); }; });   // 选了现在这一项：只关掉，不重载
      Nav.focus(scr.el.querySelector(`[data-lang="${cur}"]`) || scr.el.querySelector('[data-lang]'));
      return scr;
    }
    let langKey = false;                             // 标题画面：键盘 L 打开语言列表（只挂一次；只在标题页在栈顶时算）
    function bindLangKey() {
      if (langKey) return; langKey = true;
      addEventListener('keydown', e => {
        if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || (e.key !== 'l' && e.key !== 'L')) return;
        const t = Nav.top(); if (!t || t.el.id !== 'title' || !canLang()) return;
        e.preventDefault(); Kit.setDev('key'); sfx.ok(); langPick();
      });
    }

    // 标题：斜向构图。左边是全幅主视觉（缓慢漂移），右边是深色斜切钢板面板，菜单是面板上一摞斜放的钢板条（Kit.slabMenu）；
    // 选中哪一项，面板和主视觉交界处就斜着切入对应的立绘 / 插图和一句短字。标题页没有右下角的主按钮：选中的那一条就是主操作。
    // 进场（只在第一次）：黑场 → 主视觉淡入 → 标志砸下、画面一震 → “按任意键” → 面板切入、菜单条一条条甩进来。设置里关了“转场动画”就全部用淡入
    let introDone = false;
    function title() {
      const sv = G.loadSave(), zh = Kit.lang() === 'zh-CN' || Kit.lang() === 'zh-TW', name = esc(T('潮汐战线')), TAG = T('潮水到过的地方，都会留下痕迹。');   // 标志下面的一行标语（名字本身画在标志图里）   // 英文名 Tidemark 的标语，只在英文界面显示
      const CREDIT = /^zh-(CN|TW)$/.test(Kit.lang()) ? 'by 赛博禅心' : '';   // 底部的开发者署名：只在两种中文界面显示，所以是常量、不进翻译目录
      const art = root.AWTitleArt && root.AWTitleArt.img && root.AWTitleArt.img.src || '', first = !introDone; introDone = true;
      document.body.classList.toggle('nofx', G.cfg && G.cfg.wipe === false); document.body.classList.add('tt-on');
      const pressText = () => Kit.dev === 'pad' ? T('按任意键开始') : Kit.dev === 'key' ? T('按任意键开始') : T('点击屏幕开始');
      let waiting = first;
      const scr = Kit.screen({
        id: 'title', cls: 'clear tt' + (first ? ' intro wait' : ''), onCancel: null, linear: true, onClose: () => document.body.classList.remove('tt-on'),
        onFocus: b => { if (b.dataset.sid) preview(b.dataset.sid); },   // 光标移动只响一声（Nav 自己响的那一声）；原来这里隔 40 毫秒又补一声，作者听着像响了两次，去掉了   // 光标的“咔”：Nav 自己响一声，这里隔 40 毫秒再补一声，叠成金属的两连音
        keys: { ok: () => { if (waiting && !(Nav.top() && Nav.top().f && Nav.top().f.getClientRects().length)) return reveal(); return false; }, cancel: () => { if (waiting) reveal(); }, start: () => { if (waiting) reveal(); else return false; } },
        hints: [],   // 标题页不放提示条：选中的那块金色铭牌就是主操作
        html: `<div class="tL tbg"><img class="fill" alt="" src="ui-assets/title/L-bg.webp"><i class="teye"></i></div><div class="tL tcl"><i></i></div><div class="tL tsl"><img class="fill" alt="" src="ui-assets/title/L-slope.webp" onerror="this.remove()"></div><div class="tL tfig"><img class="fill" alt="" src="ui-assets/title/fg.webp" onerror="this.remove()"></div>` +
          `<div class="tL tside"><div class="tpan"><img class="fill" alt="" src="ui-assets/title/L-panel.webp"></div><div class="tL twv"><img class="fill" alt="" src="ui-assets/title/L-wave.webp" onerror="this.remove()"></div><div class="tmenu" id="tmenu"></div></div><div class="tver"></div>${CREDIT ? `<div class="tcred">${esc(CREDIT)}</div>` : ''}` +
          (canLang() ? `<button class="tlang" id="tLang" title="${esc(T('语言'))} / Language">${GLOBE}<span>${esc(langName())}</span></button>` : '') +
          `<div class="tL tlogo">` + (LOGO() ? `<img class="logoimg" src="${LOGO()}" alt="${name}">` + (TAG ? `<div class="ltag ol">${esc(TAG)}</div>` : '') : `<div class="logo">${name}<span class="l1">${name}</span><span class="l2">${name}</span><span class="l3">${name}</span></div>`) + `</div>` +
          `<div class="tpress ol" id="tpress">${esc(pressText())}</div>`,
      });
      const go = f => () => { G.audio(); sfx.ok(); f(); };
      const items = [];
      if (G.camp) items.push({ id: 'tCamp', label: G.camp.any ? T('继续战役') : T('战役'), info: (() => { try { const pr = root.AWCampaignRun.progress(); return Kit.ic('flag') + esc(T('{a}/{b}', { a: pr.done, b: pr.total })); } catch (e) { return ''; } })(), onPick: go(() => G.camp.select()) });
      items.push({ id: 'tStart', label: G.camp ? T('自由对局') : T('开始作战'), info: esc(T('2–4 个阵营')), onPick: go(wizard) });
      // 顺序照成品图：战役、自由对局、继续（有存档才有；打开时默认选中它）、图鉴、设置
      if (sv) items.push({ id: 'resume', label: T('继续'), info: esc(T('{map} · 第 {day} 天', { map: T(sv.state.map.name || '', null, 'map'), day: sv.state.day })), onPick: G.resumeGame });
      if (root.AWCodex) items.push({ id: 'tCodex', label: T('图鉴'), onPick: go(() => G.openCodex()) });
      items.push({ id: 'tSet', label: T('设置'), onPick: go(() => settings(false)) });
      scr.el.style.setProperty('--plate', `url('ui-assets/title/plate.webp')`); scr.el.style.setProperty('--plate-on', `url('ui-assets/title/plate-on.webp')`);
      // 画面是分层的（大背景、云、草坡、人物组、钢板、浪花带、标志各一张图），按窗口大小各自定位，见下面的 layout()
      // 菜单：铭牌组块。每块两种状态叠在一起——没选中的小红牌、选中的大金牌（带光标和溅上来的浪花），都是从 Codex 画的成品图里裁出来的；
      // 简体中文直接用图里画好的字，其他语言（和还没有专属金牌图的项）用空白牌子 + 程序排的斜粗体字。光标移动：旧的缩小褪成红牌、浪花落下；新的放大变金牌、浪花溅起；其余牌子让位
      const ART = { tCamp: 'rg', tStart: 'rg', resume: 'rg', tCodex: 'rg', tSet: 'rg' }, zhCN = Kit.lang() === 'zh-CN', T0 = 'ui-assets/title/';
      const host = $('tmenu'); host.innerHTML = '';
      const btns = items.map((it, i) => {
        const b = document.createElement('button'); b.className = 'nav tpl'; b.id = it.id; b.dataset.sid = it.id; const a = zhCN ? (ART[it.id] || '') : '';
        const txt = `<b>${esc(it.label)}</b>`;
        b.innerHTML = (a.includes('r') ? `<img class="r" alt="" src="${T0}c-${it.id}-r.webp">` : `<span class="r gen">${txt}</span>`) +
          (a.includes('g') ? `<img class="g" alt="" src="${T0}c-${it.id}-g.webp">` : `<span class="g gen">${txt}<i class="cur"></i></span>`) +
          `<img class="spl" alt="" src="${T0}splash.webp">` + (it.info ? `<span class="tinfo">${it.info}</span>` : '');
        b.setAttribute('aria-label', it.label);
        let busy = false; b.onclick = () => { if (busy) return; if (document.body.classList.contains('nofx')) return it.onPick && it.onPick(); busy = true; b.classList.add('go'); setTimeout(() => { busy = false; b.classList.remove('go'); if (it.onPick) it.onPick(); }, 190); };
        host.appendChild(b); return b;
      });
      // 分层排布。成品图 concepts/title/sel-N.png 的坐标系是 1672×941。统一缩放 k 以窗口高度为主（窗口很窄时按宽度收），各层按自己的锚点摆、互相之间的距离随窗口变：
      // 大背景铺满（等比放大、多出来的裁掉，不拉伸），并把海眼放到人物和钢板之间；人物组、草坡锚左下；钢板、浪花带、铭牌锚右；标志锚左上。
      // 窗口变宽 → 背景多露出、人物和钢板之间的海床变宽；变窄 → 人物组缩小、被浪花压住一部分（钢板、牌子、标志优先完整）；竖屏 → 上下排。
      // 牌子动态排：每块有没选中 / 选中两种尺寸（取自成品图里红牌、金牌的实际大小），从上到下累加算 y，选中的那块更高、带一行说明时再多留一行，上下邻居跟着让位；x 沿钢板的斜线按 y 插值
      const SW = 1672, SH = 941, RS = { tCamp: [450, 132], tStart: [464, 125], resume: [465, 134], tCodex: [470, 135], tSet: [477, 138] }, GS = { tCamp: [530, 215], tStart: [550, 190], resume: [512, 166], tCodex: [526, 166], tSet: [512, 156] };
      const BG = { w: 2508, h: 1411, ex: 0.374, ey: 0.446, cw: 0.377 }, CLR = 330 / 1672;   // 背景图：原始宽高、海眼中心（占比）、海眼的宽度（占图宽）
      const q1 = s => scr.el.querySelector(s), LY = { bg: q1('.tbg'), eye: q1('.teye'), cl: q1('.tcl'), sl: q1('.tsl'), fig: q1('.tfig'), pan: q1('.tpan'), wv: q1('.twv'), logo: q1('.tlogo') };
      const box = (e, x, y, w, h) => { if (!e) return; const s = e.style; s.left = x + 'px'; s.top = y + 'px'; s.width = w + 'px'; s.height = h == null ? '' : h + 'px'; };
      LY.eye.style.left = (BG.ex * 100) + '%'; LY.eye.style.top = (BG.ey * 100) + '%';
      function layout() {
        const W = innerWidth, H = innerHeight, nar = Kit.narrow, f = Math.max(0, btns.findIndex(b => b.classList.contains('focus'))), M = 24;   // M：每层四周多出来的一圈，视差和震动时不露边
        // 背景：海眼中心放到 (tx, ty)、海眼宽 cw；先保证铺满窗口，再尽量满足这两条
        const bgAt = (tx, ty, cw) => { const s = Math.max(cw / (BG.cw * BG.w), (W + 2 * M) / BG.w, (H + 2 * M) / BG.h), w = BG.w * s, h = BG.h * s; box(LY.bg, Math.min(-M, Math.max(W + M - w, tx - BG.ex * w)), Math.min(-M, Math.max(H + M - h, ty - BG.ey * h)), w, h); return s; };
        const cloud = (tw, cy) => { box(LY.cl, -M, cy - tw * CLR * 0.6, W + 2 * M + tw, tw * CLR); LY.cl.style.setProperty('--tw', tw + 'px'); };   // 云：一条横向平铺的云带（tw 是一组云的宽度），慢慢向左飘，飘完一组正好接上
        let k, at, y, y0;
        if (nar) {
          k = Math.min(W * 0.6 / 465, H * 0.42 / 735); bgAt(W * 0.6, H * 0.27, W * 0.62);
          const kf = Math.min(H * 0.3 / 724, W * 0.72 / 740), fy = H * 0.545 - SH * kf; box(LY.fig, -8, fy, 1671 * kf, SH * kf); box(LY.sl, -20, fy + (SH - 481 * 0.9) * kf + 10, SW * 0.9 * kf, 481 * 0.9 * kf);
          box(LY.pan, -8, 0, W + 16, H + 8);
          const ws = 1.35 * Math.hypot(W, H * 0.12) / 1113; box(LY.wv, W / 2 - 1097 * ws, H * 0.47 - 470 * ws, SW * ws, SH * ws); LY.wv.style.transformOrigin = '65.6% 50%'; LY.wv.style.rotate = (Math.atan2(H * 0.12, -W) * 180 / Math.PI - 122.3) + 'deg';
          box(LY.logo, W * 0.08, Math.max(64, H * 0.085), W * 0.84); cloud(W * 1.5, H * 0.2);
          y0 = 197; y = y0; at = (x, top, w) => [(W - w * k) / 2 - (top - y0) * 0.03 * k, H * 0.56 + (top - y0) * k];
        } else {
          k = Math.min(H / SH, W / 1180); const kp = H / SH, Wd = W / k, sx = W - SW * k, oy = (H - SH * k) / 2;
          bgAt((720 * k + W - 560 * k) / 2, H * 0.43, 500 * k);
          const kf = k * 0.93 * Math.max(0.72, Math.min(1, (Wd - 560) / 700));   /* 人物组比成品图小一点：头发不顶到标志 */ box(LY.fig, -18, H - SH * kf + 12, 1671 * kf, SH * kf); box(LY.sl, -26, H - 481 * 0.9 * kf + 18, SW * 0.9 * kf, 481 * 0.9 * kf);
          const pw = SW * kp * 1.03, ph = SH * kp * 1.03, px = W + 10 - pw, py = (H - ph) / 2; box(LY.pan, px, py, pw, ph);
          box(LY.wv, px - 1150 * kp * 0.04, py - 470 * kp * 0.04, SW * kp * 1.07, SH * kp * 1.07); LY.wv.style.transformOrigin = ''; LY.wv.style.rotate = '';
          const lw = Math.min(740, Wd - 470), lx = Math.max(24, Math.min(135, (Wd - 420 - lw) / 2)); box(LY.logo, lx * k, 24 * k, lw * k);
          { const tg = LY.logo.querySelector('.ltag'); if (tg) tg.style.marginLeft = Math.max(0, 440 * kf - 18 - lx * k) + 'px'; }   // 标语靠右排在标志下面，左边让开燕烽的头发和抬起的手
          cloud(Math.max(W * 0.8, 1100 * k), 200 * k);
          y0 = btns.length >= 5 ? 197 : 250; y = y0; at = (x, top) => [sx + x * k, oy + top * k];
        }
        btns.forEach((b, i) => { const on = i === f, id = b.dataset.sid, q = (on ? GS : RS)[id] || (on ? [520, 170] : [460, 130]), tf = b.querySelector('.tinfo'), info = on && tf ? 40 : 0;
          const top = on ? y - 14 : y, p = at(1171 - (y - 208) * 0.2166 - (on ? 46 : 0), top, q[0]);
          b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px'; b.style.width = (q[0] * k) + 'px'; b.style.height = (q[1] * k) + 'px'; b.style.fontSize = (62 * k) + 'px';
          if (tf) { tf.style.left = ''; const over = p[0] + q[0] * k * 0.12 + tf.offsetWidth - (W - 10); if (over > 0) tf.style.left = (q[0] * k * 0.12 - over) + 'px'; }   // 说明文字不伸出窗口右边
          y += (on ? q[1] - 22 + info : q[1] - 14); });
      }
      const menu = { fit() { btns.forEach(b => b.querySelectorAll('.gen b').forEach(t => { t.style.transform = ''; const k = (t.parentNode.clientWidth * 0.74) / Math.max(1, t.scrollWidth); if (k < 1) t.style.transform = `skewX(-11deg) scale(${Math.max(0.45, k)})`; })); } };
      const surge = () => { const w = LY.wv; if (!w || waiting) return; w.classList.remove('surge'); void w.offsetWidth; w.classList.add('surge'); };   // 切换菜单项：浪花带轻轻涌一下
      scr.nav.onFocus = b => { if (b.dataset.sid) { layout(); surge(); if (!waiting) setTimeout(() => sfx.tick(), 40); } };
      const onRz = () => { if (!scr.on) return removeEventListener('resize', onRz); layout(); menu.fit(); }; addEventListener('resize', onRz);
      layout(); setTimeout(() => { layout(); menu.fit(); }, 0);
      // 视差：鼠标位置、手柄摇杆 → --px / --py（各层自己乘幅度，CSS 过渡跟过去）；没有输入时这里什么都不做（常驻的慢摆动是 CSS 动画）。设置里关了“转场动画”就不做
      let pxT = 0, padOn = false; const setP = (x, y) => { scr.el.style.setProperty('--px', (+x).toFixed(3)); scr.el.style.setProperty('--py', (+y).toFixed(3)); }, noFx = () => document.body.classList.contains('nofx');
      const onPtr = e => { if (!scr.on) return stopPx(); if (noFx() || e.pointerType === 'touch') return; const now = performance.now(); if (now - pxT < 60) return; pxT = now; setP(1 - 2 * e.clientX / innerWidth, 1 - 2 * e.clientY / innerHeight); };
      const padT = setInterval(() => { if (!scr.on) return stopPx(); if (noFx() || document.hidden || !navigator.getGamepads) return; let ax = 0, ay = 0;
        for (const p of navigator.getGamepads()) { if (!p || !p.connected) continue; const a = p.axes || [], l = Math.hypot(a[0] || 0, a[1] || 0), r = Math.hypot(a[2] || 0, a[3] || 0), i = r > l ? 2 : 0; if (Math.max(l, r) > 0.2) { ax = a[i] || 0; ay = a[i + 1] || 0; } break; }
        if (ax || ay) { padOn = true; setP(-ax, -ay); } else if (padOn) { padOn = false; setP(0, 0); } }, 120);
      function stopPx() { clearInterval(padT); removeEventListener('pointermove', onPtr); }
      addEventListener('pointermove', onPtr, { passive: true });
      if ($('tLang')) { $('tLang').onclick = () => { G.audio(); sfx.ok(); langPick(); }; bindLangKey(); }
      function preview() { }   // 左下角的小字幕牌已去掉（长得像按钮却点不了）：附带信息是紧挨着选中那块牌子的一行纯文字（.tinfo）
      function reveal() {
        if (!waiting) return; waiting = false; scr.el.classList.remove('wait'); scr.el.classList.add('open'); $('tmenu').classList.add('in'); G.audio(); (sfx.stomp || sfx.ok)(); if (!document.body.classList.contains('nofx')) items.forEach((_, i) => setTimeout(() => { if (scr.on) sfx.tick(); }, 300 + i * 90));   // 铭牌一块块钉上去的铆钉声
        Nav.top().f = null; Nav.focus($('resume') || $('tCamp') || $('tStart')); Kit.paintHints(true);
      }
      if (first) {
        if (!document.body.classList.contains('nofx')) setTimeout(() => { if (scr.on && sfx.stomp) { sfx.stomp(); scr.el.classList.add('shake'); } }, 900);
        const any = e => { if (!scr.on) return off(); if (!waiting) return off(); if (e.target && e.target.closest && e.target.closest('#tLang, #snd')) return; if (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) return; reveal(); off(); };
        const off = () => { removeEventListener('keydown', any, true); removeEventListener('pointerup', any, true); };
        addEventListener('keydown', any, true); addEventListener('pointerup', any, true);
        Nav.top().f = null; scr.el.querySelectorAll('.nav.focus').forEach(x => x.classList.remove('focus'));
      } else { scr.el.classList.add('open'); $('tmenu').classList.add('in'); Nav.top().f = null; Nav.focus($('resume') || $('tCamp') || $('tStart')); }
    }

    // ───────── 开局流程 ─────────
    const STEPS = ['战场', '阵营与指挥官', '规则', '开战'];
    let wz = null;                                  // 现在这一步的整屏页
    const swap = (o, back) => { const old = wz; wz = Kit.screen(Object.assign({ back: !!back }, o)); if (old && old.on) old.close(true); return wz; };
    const top = i => `<div class="top">${Kit.steps(STEPS.map(t => T(t, null, 'tab')), i)}</div>`;
    const N = () => G.mapN(D.MAPS[opt.map]);
    const isAI = p => G.DEMO || opt.ctl[p] !== 'human';
    const humans = () => { const a = []; for (let p = 1; p <= N(); p++) if (!isAI(p)) a.push(p); return a; };
    // 开局前各席位的阵营 = 这个席位所选指挥官的阵营（随机指挥官按席位号的默认阵营，开局时也从这个阵营里抽）。
    // 同一个阵营的第二个席位起用副配色（D.PALETTES[阵营][变体]，变体按席位顺序数），名字后面带席位标记
    const SEATMK = ['', '①', '②', '③', '④'];
    const randFac = [0, 0, 0, 0, 0];                 // 选了“随机指挥官”的席位从哪个阵营里抽（0 = 按席位号的默认阵营）；开战那一刻才抽人（见 stepVs）
    const randOf = p => { const f = randFac[p]; return opt.cos[p] === 'rand' && f && G.coFactions().concat(hidFacs()).includes(f) && !facLock(f) ? f : 0; };
    const seatFacs = () => { const cos = [null]; for (let p = 1; p <= N(); p++) cos[p] = opt.cos[p]; let fs = null; try { fs = C.factionsFromCos ? C.factionsFromCos(cos) : null; } catch (e) { }
      if (!fs) { fs = [0]; for (let p = 1; p <= N(); p++) { const c = D.COS.find(q => q.id === cos[p]); fs[p] = c && c.faction ? c.faction : p; } }
      fs = fs.slice(); for (let p = 1; p <= N(); p++) if (randOf(p)) fs[p] = randOf(p); return fs; };
    const seatFac = p => seatFacs()[p] || p;
    const seatVar = p => { const fs = seatFacs(); let v = 0; for (let q = 1; q < p; q++) if (fs[q] === fs[p]) v++; return Math.min(3, v); };
    const seatPcs = p => { const f = seatFac(p), v = seatVar(p), P = v && D.PALETTES && D.PALETTES[f] && D.PALETTES[f][v]; return P ? `--pc:${P.main};--pcd:${P.dark};--pcl:${P.light}` : Kit.pcs(f); };
    const seatName = p => { const fs = seatFacs(), f = fs[p] || p; let k = 0; for (let q = 1; q <= N(); q++) if (fs[q] === f) k++; return Kit.fname(f) + (k > 1 ? ' ' + (SEATMK[p] || p) : ''); };
    const seatHead = (id, p, px) => Kit.head(id, seatFac(p), px).replace(Kit.pcs(seatFac(p)), seatPcs(p));
    function wizard() { if (wz && wz.on) return; G.selectMap(opt.map, true); stepMap(false); }
    function quit() { sfx.back(); if (wz) wz.close(true); wz = null; const t = $('tStart'); if (t) Nav.focus(t); }

    // 1 选战场：中间一张大预览，左右露出相邻的地图
    function drawThumb(cv, i, bw, bh) {
      bw = Math.min(bw, innerWidth * 0.88);
      const t = G.thumb(i), dpr = root.devicePixelRatio || 1, k = Math.min(bw / t.width, bh / t.height);
      cv.width = Math.max(1, Math.round(t.width * k * dpr)); cv.height = Math.max(1, Math.round(t.height * k * dpr)); cv.style.width = (cv.width / dpr) + 'px'; cv.style.height = (cv.height / dpr) + 'px';
      const c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(t, 0, 0, cv.width, cv.height);
    }
    function stepMap(back) {
      const GN = ['小型', '中型', '大型', '多阵营'], order = [];           // 按分组排好的地图下标
      for (let g = 0; g < 4; g++) D.MAPS.forEach((m, i) => { if (!m.campaign && G.mapGroup(m) === g) order.push(i); });   // 战役专用图不进普通对局的列表
      let at = Math.max(0, order.indexOf(opt.map));
      const scr = swap({
        id: 'wzMap', html: top(0) + `<div class="mgrp" id="mgrp"></div><div class="mhead" id="mhead"></div><div class="mrow" id="mrow"></div><div class="mblurb" id="mblurb"></div>`,
        onCancel: quit,
        keys: { left: () => go(-1), right: () => go(1), lb: () => go(-1), rb: () => go(1), up: () => grp(-1), down: () => grp(1), ok: next, x: more },
        flow: true,
        hints: () => [['a', '下一步'], ['b', '返回'], !Kit.ptr() && ['x', '推荐设置'], ['lbrb', '切换地图'], ['ud', '切换分组']],
      }, back);
      function paint() {
        const i = order[at], def = D.MAPS[i], d = G.mapDims(def), n = G.mapN(def), g = G.mapGroup(def), bad = !G.mapOk(def), s = Kit.s;
        const inG = order.filter(j => G.mapGroup(D.MAPS[j]) === g);
        $('mgrp').innerHTML = GN.map((t, k) => order.some(j => G.mapGroup(D.MAPS[j]) === k) ? `<span class="g${k === g ? ' on' : ''}" data-g="${k}">${esc(T(t, null, 'size'))}</span>` : '').join('') + `<span class="mut t-s">${inG.indexOf(i) + 1} / ${inG.length}</span>`;
        const kind = def.size ? String(def.size).replace(/^\s*\d+\s*[×x]\s*\d+\s*·?\s*/, '') : '';
        $('mhead').innerHTML = `<span class="nm ol">${esc(T(def.name, null, 'map'))}</span>${Kit.chip('', d.w + '×' + d.h)}${Kit.chip('', ['', '', T('1v1'), T('3 人混战'), T('4 人混战')][n] || T('{n} 人混战', { n }))}${bad ? Kit.chip('', T('暂不可用'), '', 'bad') : ''}`;
        $('mblurb').innerHTML = `<span>${esc(def.blurb || kind)}</span>`;   // 简介完整显示；地图预览按剩下的高度摆
        const prev = order[(at - 1 + order.length) % order.length], nxt = order[(at + 1) % order.length];
        $('mrow').innerHTML = `<div class="nb l pn"><canvas data-i="${prev}"></canvas></div><span class="side l">‹</span><div class="mid pn gold"><canvas data-i="${i}"></canvas></div><span class="side r">›</span><div class="nb r pn"><canvas data-i="${nxt}"></canvas></div>`;
        const H = $('mrow').clientHeight - 60 * s;
        $('mrow').querySelectorAll('canvas').forEach(cv => { const mid = +cv.dataset.i === i && cv.parentNode.classList.contains('mid'); drawThumb(cv, +cv.dataset.i, (mid ? 1040 : 520) * s, mid ? H : H * 0.62); });
        $('mrow').querySelector('.nb.l').onclick = $('mrow').querySelector('.side.l').onclick = () => go(-1);
        $('mrow').querySelector('.nb.r').onclick = $('mrow').querySelector('.side.r').onclick = () => go(1);
        $('mrow').querySelector('.mid').onclick = next;
        $('mgrp').querySelectorAll('.g').forEach(b => { b.onclick = () => { const j = order.findIndex(q => G.mapGroup(D.MAPS[q]) === +b.dataset.g); if (j >= 0) { at = j; pick(); } }; });
        if (root.AWRankUI) root.AWRankUI.mapPage({ el: scr.el, i, order, again: paint, go: j => { const k = order.indexOf(j); if (k >= 0) { at = k; pick(); } } });   // 评级徽章和这张图的记录（ui-rank.js）
      }
      function pick() { G.selectMap(order[at]); sfx.tick(); paint(); }
      function go(d) { at = (at + d + order.length) % order.length; pick(); }
      function grp(d) { const g = G.mapGroup(D.MAPS[order[at]]); for (let k = 1; k <= 4; k++) { const ng = (g + d * k + 8) % 4, j = order.findIndex(q => G.mapGroup(D.MAPS[q]) === ng); if (j >= 0) { at = j; return pick(); } } }
      function more() { const def = D.MAPS[order[at]]; sfx.ok(); Kit.pager(T(def.name, null, 'map'), Kit.pages(def.blurb || T('这张地图没有简介。'), 90).map(t => ({ html: `<p>${esc(t)}</p>` })).concat(G.mapRecText(def).length ? [{ title: T('推荐设置'), html: `<div class="chips">${G.mapRecText(def).map(t => Kit.chip('', t)).join('')}</div>` }] : [])); }
      function next() { if (!G.mapOk(D.MAPS[order[at]])) { sfx.no(); return Kit.note(T('这张地图暂时不能使用，请选择其他地图。')); } sfx.ok(); stepSeats(false); }
      G.selectMap(order[at], true); paint();
    }

    // 2a 谁来打：每个阵营一张大牌。左右选牌，上下改“玩家 / 电脑（难度）”，X 换队伍，Y 给这个席位指定指挥官
    const SEATV = [['human', '玩家'], ['easy', '电脑 · 简单'], ['normal', '电脑 · 普通'], ['hard', '电脑 · 困难']];
    const seatVal = p => !isAI(p) ? 'human' : (opt.ai[p] || opt.rules.aiLevel || 'normal');
    // 2 阵营与指挥官：一页定下“谁参战、谁是玩家 / 电脑和难度、各用哪位指挥官”。版式就是选指挥官那一屏（coScreen 的 live 模式）：
    //   上面一排席位小卡（地图几方就几张）——选中哪张，下面就在给哪个席位选人；卡上的“玩家 / 电脑 · 难度”“几队”两块小牌可以直接点；
    //   左边一列阵营页签（换页签 = 给这个席位换阵营），下面一排这个阵营的指挥官头像（第一个是“随机”）：光标停在谁身上就是选了谁（鼠标、触屏是点一下）。
    //   主操作只有一个“下一步”（进规则）。键盘 / 手柄：左右在一排里移动，上下在席位和头像两排之间换，LB RB 换阵营，X 玩家 / 电脑，Y 换队，Select（键盘 N）看背景故事
    function stepSeats(back, focusP) {
      const n = N(), open = G.coFactions().length ? G.coFactions() : [0], fsAll = open[0] ? [...new Set(open.concat(hidFacs()))].sort((a, b) => a - b) : open;
      let cur = Math.min(n, Math.max(1, focusP || 1)), scr = null;
      const ctlText = p => G.DEMO ? T('演示') : T((SEATV.find(q => q[0] === seatVal(p)) || SEATV[0])[1]);
      const card = p => { const id = opt.cos[p], co = D.COS.find(c => c.id === id);
        return `${seatHead(co ? id : 'rand', p, 0)}<span class="sr"><span class="sx"><b>${co ? esc(co.name) : esc(T('随机'))}</b><em>${Kit.emblem(seatFac(p), 's')}${esc(seatName(p))}</em></span>` +
          `<span class="sb"><span class="sv" data-act="ctl">${esc(ctlText(p))}</span>${n > 2 ? `<span class="st" data-act="team">${esc(T('{t} 队', { t: 'ABCD'[opt.teams[p] - 1] || '?' }))}</span>` : ''}</span></span>`; };
      function paint(p) { const e = $('seat' + p); if (!e) return; for (const kv of seatPcs(p).split(';')) { const i = kv.indexOf(':'); if (i > 0) e.style.setProperty(kv.slice(0, i), kv.slice(i + 1)); } e.classList.toggle('cur', p === cur); e.innerHTML = card(p); if (!D.COS.some(c => c.id === opt.cos[p])) { const h = e.querySelector('.hd'); if (h) h.textContent = '?'; } Kit.hydrate(e); }
      const paintAll = () => { for (let q = 1; q <= n; q++) paint(q); };   // 换一位指挥官，阵营、配色、席位标记都可能跟着变，所以整排重画
      function setCur(p, keepFocus) { cur = p; o.p = p; o.sel = opt.cos[p]; paintAll(); scr.co.setTab(seatFac(p), opt.cos[p], keepFocus); Kit.paintHints(true); }
      function chg(d) {
        if (G.DEMO) return; const p = cur, i = SEATV.findIndex(q => q[0] === seatVal(p)), v = SEATV[(i + d + SEATV.length) % SEATV.length][0];
        if (v === 'human') opt.ctl[p] = 'human'; else { opt.ctl[p] = 'ai'; opt.ai[p] = v; G.saveRules(); }
        sfx.tick(); paint(p);
      }
      function team() { if (n <= 2) return false; opt.teams[cur] = opt.teams[cur] % n + 1; sfx.tick(); paint(cur); }
      function next() {
        const teams = new Set(); for (let p = 1; p <= n; p++) teams.add(opt.teams[p]);
        if (teams.size < 2) { sfx.no(); return Kit.note(T('所有阵营都在同一队，至少要分成两队。')); }
        sfx.ok(); stepRules(false);
      }
      const F = () => Nav.top() && Nav.top().f, heads = () => [...$('cheads').querySelectorAll('.hsel')], seats = () => [...$('seats').querySelectorAll('.scard')];
      const lr = d => { const f = F(); if (!f || !f.isConnected) return Nav.focus($('seat' + cur)); const row = f.dataset.p ? seats() : heads(), b = row[row.indexOf(f) + d]; if (!b) return; Nav.focus(b); if (b.dataset.p) setCur(+b.dataset.p, true); else scr.co.pick(b.dataset.v); };   // 用方向键移过去才算选（鼠标悬停不算，要点一下）
      const o = {
        live: true, id: 'wzSeats', cls: 'cosel s' + n, p: cur, sel: opt.cos[cur], tab0: seatFac(cur), rand: true, back, fs: fsAll, facLock, coLock,
        top: top(1) + `<div class="sstrip" id="seats"></div>`,
        pcsOf: f => (f === seatFac(cur) ? seatPcs(cur) : Kit.pcs(f)),
        onPick: (id, f) => { opt.cos[cur] = id; if (id === 'rand') randFac[cur] = f; paintAll(); },
        // 换页签 = 换这个席位的阵营：原来是随机就还是随机（改成从新阵营里抽），原来点了名就换成新阵营的第一位；没解锁的阵营只看条件、不改选择
        onTab: f => { if (facLock(f)) return null; let id = 'rand'; if (opt.cos[cur] === 'rand') randFac[cur] = f; else { id = (G.cosOf(f).map(c => c.id).find(x => !coLock(x))) || null; if (!id) return null; opt.cos[cur] = id; } o.sel = id; paintAll(); return id; },
        onBack: () => stepMap(true),
        keys: { ok: next, x: () => chg(1), y: team, mini: () => scr.co.bio(), left: () => lr(-1), right: () => lr(1),
          up: () => { const f = F(); if (f && f.dataset.v) Nav.focus($('seat' + cur)); else Kit.scrollPanel(-0.4); },
          down: () => { const f = F(); if (!f || !f.isConnected || f.dataset.p) { const h = $('cheads').querySelector('.hsel.on') || $('cheads').firstChild; if (h) Nav.focus(h); } else Kit.scrollPanel(0.4); } },
        hints: () => [['a', '下一步'], ['b', '上一步'], !G.DEMO && ['x', '玩家 / 电脑'], n > 2 && ['y', '切换队伍'], fsAll.length > 1 && ['lbrb', '切换阵营'], ['sel', '背景故事', !(scr && scr.co.canBio)]],
      };
      scr = coScreen(o);
      const box = $('seats');
      for (let p = 1; p <= n; p++) {
        const e = document.createElement('div'); e.className = 'nav scard'; e.id = 'seat' + p; e.dataset.p = p; box.appendChild(e);
        e.onclick = ev => { const a = ev.target.closest('[data-act]'); if (p !== cur) setCur(p, true); if (a) { if (a.dataset.act === 'ctl') chg(1); else team(); } };
      }
      paintAll(); Kit.paintHints(true);
    }

    // 2b 选指挥官：左侧大立绘，右侧名字 / 称号、口头禅、特长和技能两块牌子、擅长兵种；下面一排头像，LB RB 换阵营，X 看档案
    function coPages(co, p) {
      const L = G.loreCo(co.id) || {}, F = D.FACTIONS && D.FACTIONS[co.faction], pages = [];
      Kit.pages(L.bio || '', 96).filter(Boolean).forEach((t, i) => pages.push({ title: i ? T('背景（续）') : T('背景'), html: `<p>${esc(t)}</p>` }));
      const all = Kit.modChips(co.mods, co.rules);
      pages.push({ title: T('特长'), html: `<div class="chips" style="margin-bottom:calc(18 * var(--r))">${all.map(c => Kit.chip(c.unit ? Kit.unit(c.unit, p, 44) : '', c.text, c.val, c.tone)).join('')}</div>` + Kit.pages(co.passive, 80).slice(0, 2).map(t => `<p>${esc(t)}</p>`).join('') });
      let pw = null; try { pw = null; } catch (e) { }
      pages.push({ title: T('技能「{name}」', { name: co.power }), html: Kit.pages(co.desc, 90).map(t => `<p>${esc(t)}</p>`).join('') + (F && F.trait ? `<p class="mut">${esc(T('{name}阵营特性：{trait}', { name: F.name, trait: F.trait }))}</p>` : '') });
      if (L.style) pages.push({ title: T('战法'), html: Kit.pages(L.style, 110).map(t => `<p>${esc(t)}</p>`).join('') });
      // 人物关系：头像和名字都能点，跳到那一位
      if (Array.isArray(L.ties) && L.ties.length) pages.push({ title: T('人物关系'), html: L.ties.map(t => { const c = D.COS.find(q => q.id === t.co); return `<div class="tie">${c ? `<span data-go="${c.id}">${Kit.head(c.id, c.faction, 96)}</span>` : ''}<span>${c ? `<b class="lk" data-go="${c.id}">${esc(c.name)}</b>　` : ''}${esc(t.text)}</span></div>`; }).join('') });
      if (L.role) pages.push({ title: T('在战役中'), html: `<p>${esc(L.role)}</p>` });
      if (L.like || L.hate) pages.push({ title: T('喜欢与讨厌'), html: `${L.like ? `<p><span class="good">${esc(T('喜欢'))}</span>　${esc(L.like)}</p>` : ''}${L.hate ? `<p><span class="bad">${esc(T('讨厌'))}</span>　${esc(L.hate)}</p>` : ''}${L.quote ? `<p class="gold">${esc(T('“{text}”', { text: L.quote }))}</p>` : ''}` });
      return pages;
    }
    // 选指挥官这一屏也给图鉴用（只看不选）。o：{ p, sel, fs 阵营页签, rand, onPick(id) 给了就是“选定”, onBack, standalone,
    //   facLock(f) / coLock(id)：没解锁时返回 { reasons: [{ text, done }] } 或 { text }，画成带锁的剪影并列出解锁条件 }
    // 主操作（右下金色）：选人时“选定”，图鉴里“背景故事”；X 也是背景故事
    // o.live（开局第 2 步“阵营与指挥官”用）：不带“选定”这一下——光标停在哪位就是选了哪位（鼠标、触屏是点一下），每次都回调 onPick(id, 阵营)；
    //   换页签回调 onTab(阵营) → 返回要选中的头像；keys / hints / onFocus / pcsOf 由调用方给；返回的页面带 .co = { setTab(阵营, 头像, 不动焦点), tab }
    const LOCK = '<i class="lkic"></i>';
    const condRow = r => `<div class="crow cond${r.done ? ' ok' : ''}"><span class="lb">${r.done ? '✓' : '○'}</span><span class="tx">${esc(r.text)}</span></div>`;
    function coScreen(o) {
      const fs = o.fs && o.fs.length ? o.fs : G.coFactions().length ? G.coFactions() : [0], p = o.p || 1;   // o.fs：阵营页签（图鉴：战役里揭晓了的隐藏阵营也算；自由对局：没解锁的黑潮是一张带锁的牌）
      const facLock = f => (o.facLock && o.facLock(f)) || null, coLock = id => (id && id !== 'rand' && o.coLock && o.coLock(id)) || null;
      const cur0 = D.COS.find(c => c.id === o.sel);
      let tab = o.tab0 && fs.includes(o.tab0) ? o.tab0 : cur0 && fs.includes(cur0.faction) ? cur0.faction : fs.includes(p) ? p : fs[0], shown = null;
      const pcsOf = f => (o.pcsOf ? o.pcsOf(f) : Kit.pcs(f || p));
      const livePick = id => { o.sel = id; $('cheads').querySelectorAll('.hsel').forEach(h => h.classList.toggle('on', h.dataset.v === id)); o.onPick(id, tab); scr.el.style.cssText = pcsOf(tab); };
      const lockNow = () => facLock(tab) || coLock(shown);
      const scr = swapOrOpen(o, {
        id: o.id || 'wzCo', cls: 'copick' + (o.cls ? ' ' + o.cls : ''), flow: true, html: (o.top || '') + `<div class="top ctop"${o.live ? '' : ' style="position:absolute;left:0;top:0"'}><span class="kcw">${Kit.cap('lb')}</span><div class="tabs" id="ctabs"></div><span class="kcw">${Kit.cap('rb')}</span></div>` +
          (o.crumb ? `<div class="crumb pn" style="${o.pcs || Kit.pcs(p)};top:auto;left:calc(24 * var(--r))">${o.crumb}</div>` : '') +
          `<div class="emb" id="cemb"></div><div class="big" id="cbig"></div><div class="info sc" id="cinfo"></div><div class="heads" id="cheads"></div>`,
        onCancel: () => { sfx.back(); o.onBack(); },
        onFocus: b => { if (o.onFocus) o.onFocus(b); if (!b.dataset.v) return; if (o.live) return; if (b.dataset.v !== shown) show(b.dataset.v); },
        keys: Object.assign({ lb: () => chTab(-1), rb: () => chTab(1), ok: primary, x: bio, up: () => { Kit.scrollPanel(-0.4); }, down: () => { Kit.scrollPanel(0.4); } }, o.keys || {}),
        hints: o.hints || (() => [['a', o.onPick ? '选定' : '背景故事', !!lockNow() || !shown || (!o.onPick && shown === 'rand')], ['b', o.onPick && !o.standalone ? '上一步' : '返回'], o.onPick && ['x', '背景故事', !!lockNow() || shown === 'rand'], fs.length > 1 && ['lbrb', '切换阵营']]),
      });
      function primary() { if (lockNow() || !shown) { sfx.no(); return Kit.note(T('未解锁')); } if (o.onPick) { sfx.ok(); return o.onPick(shown); } bio(); }
      // 背景故事：图鉴的斜切版式（codex.js 的 coBio）；图鉴没加载时退回翻页卡
      function bio() {
        const co = D.COS.find(c => c.id === shown); if (!co || lockNow()) { sfx.no(); return; }
        sfx.ok(); const CX = root.AWCodex, ids = G.cosOf(tab).map(c => c.id).filter(id => !coLock(id));
        if (CX && CX.coBio) CX.coBio(co.id, { ids }); else Kit.pager(G.coLabel(co), coPages(co, p));
      }
      function lockView(lk, isFac) {
        const rs = lk.reasons || [], dn = rs.filter(r => r.done).length;
        $('cbig').innerHTML = isFac ? `<span class="lkbig">${LOCK}</span>` : Kit.port(shown, 'normal', 'filter:brightness(0) drop-shadow(0 0 3px #9ab)');
        $('cinfo').innerHTML = `<div class="nm"><b class="ol">${esc(T('？？？'))}</b><em>${LOCK} ${esc(T('未解锁'))}</em></div><div class="qt">${esc(lk.text || (isFac ? T('完成任意一组条件就能解锁：') : T('解锁条件：')))}</div>${isFac ? Kit.unlockHtml(lk, tab) : rs.map(condRow).join('')}`;
        Kit.hydrate($('cbig')); $('cinfo').scrollTop = 0; Kit.paintHints(true);
      }
      function show(id) {
        shown = id; const co = D.COS.find(c => c.id === id), q = co ? G.quoteOf(id) : '', lk = coLock(id);
        if (lk) return lockView(lk, false);
        const tech = co ? (D.TECH || []).filter(t => t.co === id).sort((a, b) => a.tier - b.tier) : [];
        const row = (ic, lb, html) => `<div class="crow">${Kit.ic(ic)}<span class="lb">${esc(lb)}</span><span class="tx">${html}</span></div>`;
        $('cbig').innerHTML = co ? Kit.port(id, 'normal') : '<span class="qm">?</span>';
        $('cinfo').innerHTML = co ? `<div class="nm"><b class="ol">${esc(co.name)}</b><span>${esc(co.title || '')}</span>${co.group ? `<em>${esc(T(co.group, null, 'group'))}</em>` : ''}</div>${q ? `<div class="qt">${esc(T('“{text}”', { text: q }))}</div>` : ''}` +
          row('star', T('特长'), esc(co.passive || '')) + row('power', co.power || T('技能'), esc(co.desc || '')) +
          tech.map(t => row('tech', t.name || T('科技 {n}', { n: t.tier }), esc(t.desc || ''))).join('')
          : `<div class="nm"><b class="ol">${esc(T('随机'))}</b><span>${esc(T('开局时决定'))}</span></div><div class="qt">${esc(T('开局时从这个阵营里随机选出一位指挥官。'))}</div>`;
        Kit.hydrate($('cbig')); Kit.hydrate($('cinfo')); $('cinfo').scrollTop = 0; Kit.paintHints(true);
        // 内容必须一屏显示完：放不下时先收掉台词那一行，再不够就把行距收紧一档
        const ci = $('cinfo'), over = () => ci.scrollHeight > ci.clientHeight + 2; ci.classList.remove('tight');
        if (over()) { const q2 = ci.querySelector('.qt'); if (q2) q2.style.display = 'none'; } if (over()) ci.classList.add('tight');
      }
      function fill(focusId, keepFocus) {
        const fl = facLock(tab), f0 = Nav.top().f, keep = !!(keepFocus && f0 && f0.isConnected && !$('cheads').contains(f0));   // keep：焦点留在原处（席位卡上），只换下面的内容
        scr.el.style.cssText = fl ? '--pc:#2c3644;--pcd:#10141f;--pcl:#cfe6ee' : pcsOf(tab);
        $('cemb').style.backgroundImage = !fl && Kit.icUrl('f' + tab) ? `url(${Kit.icUrl('f' + tab)})` : '';
        $('ctabs').innerHTML = fs.filter(Boolean).map(f => { const lk = facLock(f); return `<span class="tab${f === tab ? ' on' : ''}${lk ? ' lock' : ''}" data-f="${f}" style="${Kit.pcs(f)}">${Kit.emblem(f)}${lk ? esc(T('？？？')) + ' ' + LOCK : esc(Kit.fname(f))}</span>`; }).join('');
        $('ctabs').querySelectorAll('.tab').forEach(t => { t.onclick = () => { if (+t.dataset.f !== tab) { tab = +t.dataset.f; sfx.tick(); fill(o.onTab ? o.onTab(tab) : undefined, !!o.live); } }; });
        const box = $('cheads'); box.innerHTML = ''; shown = null; if (!keep) Nav.top().f = null;
        if (fl) return lockView(fl, true);
        // 已解锁的排前面，没解锁的排后面（剪影）
        const list = G.cosOf(tab).map(c => c.id).filter(id => !o.coOk || o.coOk(id)).sort((a, b) => (coLock(a) ? 1 : 0) - (coLock(b) ? 1 : 0)); if (o.rand) list.unshift('rand');
        for (const id of list) {
          const b = document.createElement('div'); b.className = 'nav hsel' + (id === o.sel ? ' on' : '') + (coLock(id) ? ' un' : ''); b.dataset.v = id; if (!o.live) b.dataset.tap2 = '';
          b.innerHTML = Kit.head(id, tab || p, 0); if (id === 'rand') b.firstChild.textContent = '?';
          b.onclick = () => { if (o.live) { if (shown !== id) show(id); if (coLock(id)) sfx.no(); else if (o.sel !== id) { sfx.tick(); livePick(id); } return; } if (shown !== id) show(id); primary(); };
          box.appendChild(b);
        }
        Kit.hydrate(box);
        const want = box.querySelector(`[data-v="${focusId || o.sel}"]`) || (o.live ? null : box.firstChild);
        if (o.live) { if (want) show(want.dataset.v); else if (box.firstChild) show(box.firstChild.dataset.v); if (!keep) Nav.focus(want || box.firstChild); } else Nav.focus(want);
      }
      function chTab(d) { if (fs.length < 2) return; tab = fs[(fs.indexOf(tab) + d + fs.length) % fs.length]; sfx.tick(); fill(o.onTab ? o.onTab(tab) : undefined); }
      scr.co = { setTab(f, id, keepFocus) { if (fs.includes(f)) tab = f; fill(id, keepFocus); }, get tab() { return tab; }, pick(id) { if (shown !== id) show(id); if (!coLock(id) && o.sel !== id) livePick(id); }, bio, get canBio() { return !!shown && shown !== 'rand' && !lockNow(); } };
      fill(o.sel); return scr;
    }
    let free = null;                                 // 流程之外打开的选人屏（图鉴用）
    function swapOrOpen(o, def) { if (o.standalone) { free = Kit.screen(def); return free; } return swap(def, o.back); }
    // 自由对局里隐藏阵营（黑潮）的解锁：阵营没开放 → 一张带锁的牌和解锁条件；开放以后只列已解锁的指挥官，其余是剪影和各自的条件
    const RUN = () => root.AWCampaignRun || null;
    const hidFacs = () => (D.FACTIONS || []).map((F, f) => (F && F.hidden ? f : 0)).filter(f => f && D.COS.some(c => c.faction === f));
    const facLock = f => { const F = D.FACTIONS && D.FACTIONS[f]; if (!F || !F.hidden) return null; try { const R = RUN(), inf = R && R.unlockInfo ? R.unlockInfo(f) : null; if (inf) return inf.open ? null : inf; } catch (e) { } return G.facOpen(f) ? null : { reasons: [] }; };
    const coLock = id => {
      const c = D.COS.find(q => q.id === id), F = c && D.FACTIONS && D.FACTIONS[c.faction]; if (!c || !F || !F.hidden) return null;
      try { const R = RUN(); if (!R || !R.unlockedCos || R.unlockedCos().includes(id)) return null;
        if (R.unlockInfoCo) { const one = R.unlockInfoCo(id); if (one) return one.open ? null : { reasons: one.reason ? [one.reason] : [] }; }   // 这一位自己的条件
        const rs = (R.unlockInfo(c.faction).reasons || []), mine = rs.filter(r => (r.co != null ? r.co === id : String(r.text).includes(c.name)));   // 条件带 co 字段就按它找；没有时按句子里有没有这位的名字（只用来挑显示哪几条）
        return { reasons: mine.length ? mine : rs }; } catch (e) { return null; }
    };
    // 3 规则：竖排大字列表，上下选、左右改；右边一块说明
    const RDESC = {
      fog: '仅可看见己方单位和建筑周围的格子。森林、礁石、废墟中的敌方单位仅在相邻时可被发现，视野范围再大也看不到。', startFunds: '开局时各阵营持有的资金。', income: '每座收入建筑每回合提供的资金，陨星矿为 2 倍。',
      dayLimit: '到达天数上限时，按建筑数和单位总造价判定胜负。选择“无”则不设上限。', powers: '攻击和受到攻击均可积累技能槽，积满后可发动指挥官技能。', coPassives: '指挥官的特长与阵营特性。关闭后各阵营的数值相同。',
      get ore() { const R = D.RES || {}; return (R.mineText ? T('{name}：{text}。', { name: R.mine, text: R.mineText }) : '') + T('陆上单位停留在{shard}上可拾取 {min}–{max} 份（每个碎片堆在开局时随机决定）。击毁敌方的强化单位，获得它强化价的一半。只用于强化生产，效果按兵种不同。', { shard: R.shard, min: R.shardMin, max: R.shardMax }); },
      tech: '支付研究经费获得研究点，解锁通用、阵营、指挥官三类科技。', handicap: '阵营数较少的队伍开局资金增加，每回合收入也略有增加。', loot: '三支及以上队伍对战时，击毁敌方单位可获得其造价的一部分资金。',
    };
    function stepRules(back) {
      const def = D.MAPS[opt.map], n = N(), rec = G.mapRecText(def);
      const scr = swap({
        id: 'wzRules', html: top(2) + `<div class="cols"><div><div class="olist" id="rules"></div>${rec.length ? `<div class="rec">${esc(T('这张地图的推荐设置：{list}', { list: rec.join('　') }))}</div>` : ''}</div><div class="odesc pn sc" id="rdesc"></div></div>`,
        linear: true, onCancel: () => { sfx.back(); stepSeats(true); },
        onFocus: b => { if (onF) onF(b); },
        keys: { ok: () => { sfx.ok(); stepVs(false); }, y: () => { G.resetRec(); sfx.ok(); Kit.note(T('已恢复推荐设置')); build(); } },
        flow: true,
        hints: [['a', '下一步'], ['b', '上一步'], ['lr', '更改'], ['y', '恢复推荐设置']],
      }, back);
      let onF = null;
      function build() {
        const rows = [], lab = c => [c[0], typeof c[0] === 'boolean' ? T(c[1], null, 'toggle') : T(c[1])];   // G.RULES 里存原文，这里显示时再翻（陨星矿的名字读 D.RES，已经是当前语言）
        for (const [k, name, ch] of G.RULES) {
          if (k === 'aiLevel' || !(k in opt.rules) || ((k === 'handicap' || k === 'loot') && n < 3)) continue;
          const rv = G.mapRec(def)[k], ch2 = (rv !== undefined && !ch.some(c => c[0] === rv)) ? ch.concat([[rv, String(rv)]]).sort((a, c) => (typeof a[0] === 'number' && typeof c[0] === 'number') ? a[0] - c[0] : 0) : ch;
          rows.push({ k, label: k === 'ore' ? name : T(name), choices: ch2.map(lab), get: () => opt.rules[k], set: v => G.setRule(k, v), desc: k === 'ore' ? RDESC.ore : T(RDESC[k] || '') });
        }
        onF = Kit.optList($('rules'), rows, $('rdesc'));
        Nav.top().f = null; Nav.focus($('rules').firstChild);
      }
      build();
    }

    // 4 确认开战：各阵营的指挥官立绘对峙，中间大字 VS
    function stepVs(back) {
      const def = D.MAPS[opt.map], n = N(), R = opt.rules;
      // 阵营牌只是说明（不能点）：一条阵营色的横幅，徽记、名字、颜色都按这个席位所选指挥官的阵营；同阵营的第二个席位是副配色、名字后带席位标记
      const one = (p, flip) => {
        const id = opt.cos[p], co = D.COS.find(c => c.id === id), f = seatFac(p);
        return `<div class="vsp${flip ? ' flip' : ''}" data-p="${p}" data-f="${f}" data-v="${seatVar(p)}" style="${seatPcs(p)}">${co ? Kit.port(id, 'normal') : '<span class="qm">?</span>'}<div class="pl"><b>${Kit.emblem(f, 's')}${esc(seatName(p))}${n > 2 ? ' · ' + esc(T('{t} 队', { t: 'ABCD'[opt.teams[p] - 1] })) : ''}</b><span>${co ? esc(G.coLabel(co)) : esc(T('随机指挥官'))} · ${esc(isAI(p) ? T('电脑') : T('玩家'))}</span></div></div>`;
      };
      const chips = [Kit.chip(Kit.ic('fog', 's'), T('迷雾'), R.fog ? T('开', null, 'toggle') : T('关', null, 'toggle')), Kit.chip(Kit.ic('coin', 's'), T('收入'), R.income), Kit.chip(Kit.ic('day', 's'), T('天数'), R.dayLimit || T('不限'))].join('');
      const mid = `<div class="vsc"><div class="t-xl ol" style="color:#fff3d0">${esc(T(def.name, null, 'map'))}</div><div class="v ol">VS</div><div class="chips">${chips}</div></div>`;
      let h = ''; if (n === 2) h = one(1) + mid + one(2, true); else { for (let p = 1; p <= n; p++) h += one(p, p > n / 2); }
      const scr = swap({
        id: 'wzVs', html: `<canvas class="vsbg" id="vsbg"></canvas><i class="vsdim"></i>` + top(3) + (n > 2 ? `<div class="t-xl ol" style="color:#fff3d0">${esc(T(def.name, null, 'map'))}</div><div class="chips" style="margin-top:calc(10 * var(--r))">${chips}</div>` : '') + `<div class="vsw">${h}</div>`,
        onCancel: () => { sfx.back(); stepRules(true); },
        // 开战：选了“随机”并指定了阵营的席位，这一刻从那个阵营已解锁的指挥官里抽一位（抽完把“随机”放回去，下一局还是随机）
        keys: { ok: () => { const keep = opt.cos.slice(); for (let p = 1; p <= n; p++) { const f = randOf(p); if (!f) continue; const pool = G.cosOf(f).filter(c => !coLock(c.id)); if (pool.length) opt.cos[p] = pool[Math.floor(Math.random() * pool.length)].id; } try { return G.startGame(); } finally { for (let p = 1; p <= n; p++) opt.cos[p] = keep[p]; } } },
        flow: true,
        hints: [['a', G.DEMO ? '开始演示' : humans().length ? '开始作战' : '开始观战'], ['b', '上一步']],
      }, back);
      // 背景：这一局所选地图的预览铺满整屏（cover），先在小画布上糊一遍再放大，上面压一层暗色，立绘和 VS 叠在上面
      try { const t = G.thumb(opt.map), cv = scr.el.querySelector('#vsbg'), k = Math.min(1, 640 / t.width); cv.width = Math.max(2, Math.round(t.width * k)); cv.height = Math.max(2, Math.round(t.height * k));
        const c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; try { c.filter = 'blur(2px)'; } catch (e) { } c.drawImage(t, 0, 0, cv.width, cv.height); } catch (e) { }
    }

    // ───────── 设置：科技树那套面板——大行高、分段选择器；改了立即保存，“完成”和“返回”都是关掉 ─────────
    function settings(inGame, onClose) {
      const cfg = G.cfg, ON = [[true, '开'], [false, '关']].map(c => [c[0], T(c[1], null, 'toggle')]), keep = (k, v) => G.lsSet('steel-tide.' + k, String(v));
      // 战场信息：精简 / 完整（localStorage 键 steel-tide.hud，值 slim / full，默认精简；对局内界面读它）
      const hudGet = () => { try { if (G.hudMode) return G.hudMode() === 'full' ? 'full' : 'slim'; } catch (e) { } return G.lsGet && G.lsGet('steel-tide.hud') === 'full' ? 'full' : 'slim'; };
      const hudSet = v => { try { if (G.setHudMode) { G.setHudMode(v); if (G.S && G.updateHud) G.updateHud(); return; } } catch (e) { } keep('hud', v); };
      const rows = [
        { k: 'sound', label: T('声音'), choices: ON, get: () => G.soundOn, set: v => G.setSound(v), desc: T('也可以点右上角的喇叭图标开关。') },
        { k: 'vol', label: T('音乐音量'), choices: [0, 25, 50, 75, 100].map(v => [v, String(v)]), get: () => cfg.vol, set: v => { cfg.vol = v; keep('vol', v); G.applyVol(); }, desc: T('背景音乐的音量，不影响音效。') },
        { k: 'speed', label: T('动画速度'), choices: [[1.4, '慢'], [1, '标准'], [0.6, '快']].map(c => [c[0], T(c[1], null, 'speed')]), get: () => cfg.speed, set: v => { cfg.speed = v; keep('speed', v); }, desc: T('移动、攻击等动画的播放速度。') },
        { k: 'fast', label: T('电脑加速'), choices: ON, get: () => cfg.fast, set: v => { cfg.fast = v; keep('fast', v ? '1' : '0'); }, desc: T('电脑回合以 4 倍速播放。') },
        { k: 'follow', label: T('镜头跟随电脑'), choices: ON, get: () => cfg.follow, set: v => { cfg.follow = v; keep('follow', v ? '1' : '0'); }, desc: T('电脑行动时，镜头自动跟随。') },
        { k: 'hud', label: T('战场信息'), choices: [['slim', T('精简')], ['full', T('完整')]], get: hudGet, set: hudSet, desc: T('精简：对局中只显示阵营牌和光标所在格的要点。完整：同时显示详细数值、加成来源和按键提示。') },
        { k: 'grid', label: T('显示格线'), choices: ON, get: () => cfg.grid, set: v => { cfg.grid = v; keep('grid', v ? '1' : '0'); }, desc: T('在地图上显示格线。') },
        { k: 'wipe', label: T('转场动画'), choices: ON, get: () => cfg.wipe, set: v => { cfg.wipe = v; keep('wipe', v ? '1' : '0'); }, desc: T('开战、回合切换、胜负时的阵营色横条和大字。关闭后回合切换改为普通横幅。') },
        { k: 'cap', label: T('占领演出'), choices: [['full', T('完整')], ['short', T('简短')], ['off', T('关闭', null, 'toggle')]], get: () => cfg.cap, set: v => { cfg.cap = v; keep('cap', v); }, desc: T('完整：每次占领弹出小窗，演出步兵占领建筑的过程；占领司令部时为整屏演出。简短：只在地图上显示跳减的占领值和换色。开启“电脑加速”时，电脑回合自动使用简短演出。') },
        { k: 'hints', label: T('常显按键提示'), choices: ON, get: () => cfg.hints, set: v => { cfg.hints = v; keep('hints', v ? '1' : '0'); }, desc: T('关：仅在菜单、选择目标等场合显示按键提示。开：对局中始终显示。') },
        { k: 'zoom', label: T('地图缩放'), choices: [[0, T('自动')]].concat(G.ZOOMS.map(z => [z, String(z)])), get: () => G.zoomPref, set: v => G.setZoomPref(v), desc: T('每格的显示大小。选择“自动”时，一屏约显示 15×10 格。') },
      ];
      // 语言：不做左右切换（每换一次都要整页重载），按确定弹出语言列表；标签固定带“/ Language”，误切到看不懂的语言也找得回来
      if (canLang()) rows.push({ k: 'lang', label: T('语言') + ' / Language', right: langNow(), action: () => { sfx.ok(); langPick(); }, desc: T('界面语言。“自动”跟随浏览器的语言设置。更改后会重新加载画面。') });
      if (inGame && G.S && G.fogOn() && !G.plist().some(p => G.human[p])) rows.push({ k: 'spec', label: T('观战视角'), choices: [[0, T('全图')]].concat(G.plist().map(p => [p, G.pname(p)])), get: () => cfg.spec, set: v => { cfg.spec = v; G.refreshVis(); }, desc: T('观看电脑对战时，按所选阵营的视野显示迷雾。') });
      rows.push({ k: 'help', label: T('操作说明'), right: '', action: () => { sfx.ok(); help(); }, desc: T('手柄、键盘、鼠标的操作方法。') });
      if (inGame) rows.push({ k: 'title', label: T('返回标题'), right: '', action: () => { sfx.ok(); G.autosave(); G.showTitle(); }, desc: T('对局进度会自动保存，可以在标题画面选“继续”接着进行。') });
      const rowOf = () => { const t = Nav.top(), f = t && t.f; return (f && f._row) || null; };
      const scr = Kit.page({
        id: 'settings', dim: !!inGame, icon: Kit.ic('set'), title: T('设置'), linear: true, onClose,
        body: `<div class="setl" id="setRows"></div><div class="setd sc" id="setDesc"></div>`,
        onFocus: b => { const r = b._row; if (r) $('setDesc').innerHTML = `<h3>${esc(r.label)}</h3><p>${esc(r.desc || '')}</p>`; Kit.paintHints(true); },
        keys: { ok: () => { const r = rowOf(); if (r && r.action) return r.action(); sfx.back(); scr.close(); } },
        hints: () => { const r = rowOf(); return [['a', r && r.action ? r.label : T('完成'), false, true], ['b', '返回'], r && r.choices && ['lr', '更改']]; },
      });
      const host = $('setRows');
      for (const r of rows) {
        const b = document.createElement('div'); b.className = 'nav orow'; b.dataset.k = r.k || '';
        const sync = () => { b.innerHTML = `<span class="lb">${esc(r.label)}</span>` + (r.choices ? `<span class="sg">${r.choices.map((q, i) => `<i class="${q[0] === r.get() ? 'on' : ''}" data-i="${i}">${esc(q[1])}</i>`).join('')}</span>` : `<span class="go">${esc(r.right || '')}<i class="kc sq" style="font-style:normal">▶</i></span>`); b.dataset.v = r.choices ? String(r.get()) : ''; };
        const setI = i => { const q = r.choices[i]; if (!q || q[0] === r.get()) return; r.set(q[0]); sfx.tick(); sync(); };
        b._lr = r.choices ? d => { const i = r.choices.findIndex(q => q[0] === r.get()); setI(((i < 0 ? 0 : i) + d + r.choices.length) % r.choices.length); } : null; b._row = r; b._sync = sync;   // 喇叭图标、V 键改了声音时，ui.js 靠它把这一行刷新
        b.onclick = e => { if (r.action) return r.action(); const a = e.target.closest('i[data-i]'); if (a) setI(+a.dataset.i); else b._lr(1); };
        sync(); host.appendChild(b);
      }
      Nav.top().f = null; Nav.focus(host.firstChild);
      return scr;
    }

    // ───────── 操作说明：手柄 / 键盘 / 鼠标触屏三页，示意图配标注（LB RB 或左右换页，确定 = 下一页）─────────
    // 示意图 1200×600：中间画设备，两侧是标注（HTML，能换行），细线连到图上的点；手机竖屏放不下两侧标注，改成图在上、编号列表在下
    function diagram(svg, list) {
      const W = 1200, H = 600;
      const line = a => `<path d="M${a.side === 'l' ? 330 : 870} ${a.y}${a.via ? ` L${a.via[0]} ${a.via[1]}` : ''} L${a.to[0]} ${a.to[1]}"/>`;
      return `<div class="hwrap"><div class="hdia"><svg viewBox="0 0 ${W} ${H}">${svg}<g class="ln">${list.map(line).join('')}</g><g class="dot">${list.map((a, i) => `<circle cx="${a.to[0]}" cy="${a.to[1]}" r="13"/><text x="${a.to[0]}" y="${a.to[1]}">${i + 1}</text>`).join('')}</g></svg>` +
        list.map((a, i) => `<div class="hl ${a.side}" style="top:${a.y / H * 100}%"><span class="no">${i + 1}</span><span>${a.key ? `<b>${esc(a.key)}</b>　` : ''}${esc(a.text)}</span></div>`).join('') + `</div>` +
        `<div class="hlist">${list.map((a, i) => `<div><span class="no">${i + 1}</span><span>${a.key ? `<b>${esc(a.key)}</b>　` : ''}${esc(a.text)}</span></div>`).join('')}</div></div>`;
    }
    const PAD_SVG = `<g stroke="#0e1220" stroke-width="7" stroke-linejoin="round"><rect x="432" y="96" width="92" height="50" rx="12" fill="#8a93ad"/><rect x="676" y="96" width="92" height="50" rx="12" fill="#8a93ad"/><rect x="412" y="138" width="136" height="50" rx="14" fill="#aab3cc"/><rect x="652" y="138" width="136" height="50" rx="14" fill="#aab3cc"/>
      <path d="M420 172 Q600 150 780 172 Q852 186 882 330 Q908 474 852 504 Q800 524 760 446 Q740 404 690 404 L510 404 Q460 404 440 446 Q400 524 348 504 Q292 474 318 330 Q348 186 420 172Z" fill="#e9e4d4"/>
      <path d="M432 280h34v-34h30v34h34v30h-34v34h-30v-34h-34z" fill="#39425e"/><circle cx="545" cy="388" r="38" fill="#39425e"/><circle cx="655" cy="388" r="38" fill="#39425e"/>
      <rect x="548" y="252" width="36" height="20" rx="9" fill="#737d9c"/><rect x="616" y="252" width="36" height="20" rx="9" fill="#737d9c"/>
      <circle cx="745" cy="236" r="25" fill="#e0a81c"/><circle cx="702" cy="279" r="25" fill="#3b82e6"/><circle cx="788" cy="279" r="25" fill="#d94a3a"/><circle cx="745" cy="322" r="25" fill="#35a852"/></g>
      <g font-family="sans-serif" font-weight="900" font-size="24" fill="#fff" text-anchor="middle" dominant-baseline="central"><text x="745" y="237">Y</text><text x="702" y="280">X</text><text x="788" y="280">B</text><text x="745" y="323">A</text><text x="480" y="164" fill="#1a1d2b" font-size="20">LB</text><text x="720" y="164" fill="#1a1d2b" font-size="20">RB</text><text x="478" y="118" fill="#1a1d2b" font-size="18">LT</text><text x="722" y="118" fill="#1a1d2b" font-size="18">RT</text></g>
      <circle cx="545" cy="388" r="22" fill="#55607e"/><circle cx="655" cy="388" r="22" fill="#55607e"/>`;
    const MOUSE_SVG = `<g stroke="#0e1220" stroke-width="7" stroke-linejoin="round"><rect x="400" y="150" width="170" height="290" rx="85" fill="#e9e4d4"/><path d="M400 262 V235 Q400 150 485 150 V262Z" fill="#4c9cf0"/><path d="M570 262 V235 Q570 150 485 150 V262Z" fill="#d94a3a"/><rect x="470" y="182" width="30" height="58" rx="15" fill="#39425e"/>
      <rect x="650" y="110" width="200" height="380" rx="26" fill="#39425e"/><rect x="666" y="130" width="168" height="340" rx="8" fill="#5d9a3c"/><rect x="676" y="140" width="72" height="34" fill="#f2b632"/><rect x="676" y="424" width="148" height="34" rx="8" fill="#27304c"/></g>
      <circle cx="745" cy="270" r="26" fill="none" stroke="#fff" stroke-width="6"/><circle cx="705" cy="350" r="14" fill="#fff"/><circle cx="790" cy="330" r="14" fill="#fff"/>`;
    function help() {
      const pad = [
        { side: 'l', y: 90, to: [428, 162], key: 'LB · RB', text: T('上 / 下一个单位 · 翻页') }, { side: 'l', y: 205, to: [566, 262], key: '⧉', text: T('小地图') },
        { side: 'l', y: 330, to: [440, 300], key: T('十字键 / 左摇杆'), text: T('移动光标 / 焦点') }, { side: 'l', y: 460, to: [520, 410], key: 'L3', text: T('声音开关') },
        { side: 'r', y: 70, to: [756, 106], key: 'LT · RT', text: T('缩放') }, { side: 'r', y: 160, to: [764, 218], key: 'Y / ☰', text: T('菜单') }, { side: 'r', y: 250, to: [808, 262], key: 'B', text: T('取消 · 查看单位的范围') },
        { side: 'r', y: 340, to: [766, 338], key: 'A', text: T('确定') }, { side: 'r', y: 430, via: [702, 430], to: [702, 306], key: 'X', text: T('详情') }, { side: 'r', y: 520, to: [680, 412], key: T('右摇杆'), text: T('滚动长文本') },
      ];
      const ptr = [
        { side: 'l', y: 130, to: [442, 215], key: T('左键'), text: T('选择；再次点击确定') }, { side: 'l', y: 270, to: [485, 210], key: T('滚轮'), text: T('平移地图；Ctrl + 滚轮缩放') }, { side: 'l', y: 410, via: [528, 410], to: [528, 215], key: T('右键'), text: T('取消 · 点击单位查看范围') },
        { side: 'r', y: 110, to: [712, 157], key: T('阵营牌'), text: T('点击打开菜单；点击信息牌查看详情') }, { side: 'r', y: 240, to: [745, 270], key: T('轻点'), text: T('选择；再次点击确定') },
        { side: 'r', y: 370, to: [790, 330], key: T('双指'), text: T('平移和缩放地图') }, { side: 'r', y: 500, to: [750, 441], key: T('底部提示条'), text: T('每个提示都可以点击') },
      ];
      // 键盘：按功能上色的示意图 + 图例
      const GR = [['#4c9cf0', ['↑', '↓', '←', '→', 'W', 'A', 'S', 'D'], [T('方向键'), 'WASD'], T('移动光标 / 焦点')], ['#35a852', ['Enter', 'Space', 'Z'], [T('回车'), T('空格'), 'Z'], T('确定')], ['#e8573f', ['Esc', 'X'], ['Esc', 'X'], T('取消 · 查看单位的范围')],
        ['#b06ae0', ['F', 'C'], ['F', 'C'], T('详情')], ['#e0a81c', ['M', 'E'], ['M', 'E'], T('菜单')], ['#e8873f', ['Q', 'Tab'], ['Q', 'Tab'], T('上 / 下一个单位')],
        ['#3fb8b0', ['[', ']'], ['[', ']'], T('翻页（或 Q / E）')], ['#cfd6ea', ['=', '-', '0'], ['+', '−', '0'], T('缩放 / 自动')], ['#e86aa6', ['N'], ['N'], T('小地图')], ['#7fd0ff', ['V'], ['V'], T('声音开关')]];
      const col = {}; GR.forEach(g => g[1].forEach(k => { col[k] = g[0]; }));
      const ROWS = [[['Esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['', 2]], [['Tab', 1.5], ['Q', 1], ['W', 1], ['E', 1], ['R', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['O', 1], ['P', 1], ['[', 1], [']', 1], ['', 1.5]],
        [['', 1.8], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['K', 1], ['L', 1], ['', 1], ['', 1], ['Enter', 2.2]], [['', 2.3], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], ['', 1], ['', 1], ['', 1], ['', 2.7]], [['', 1.5], ['', 1.5], ['', 1.5], ['Space', 6], ['', 1.5], ['', 1.5], ['', 1.5]]];
      const U = 56, key = (x, y, w, lab) => { const c = col[lab], show = lab === '-' ? '−' : lab === '=' ? '+' : lab === 'Space' ? T('空格') : lab === 'Enter' ? T('回车') : lab; return `<rect class="k" x="${x + 3}" y="${y + 3}" width="${w * U - 6}" height="${U - 6}" rx="7" ${c ? `style="fill:${c}"` : ''}/>` + (lab ? `<text x="${x + w * U / 2}" y="${y + U / 2}" ${c ? '' : 'class="kt"'}>${esc(show)}</text>` : ''); };
      let kb = ''; ROWS.forEach((r, ri) => { let x = 40; r.forEach(([lab, w]) => { kb += key(x, 20 + ri * U, w, lab); x += w * U; }); });
      kb += key(940 + U, 20 + 3 * U, 1, '↑') + key(940, 20 + 4 * U, 1, '←') + key(940 + U, 20 + 4 * U, 1, '↓') + key(940 + 2 * U, 20 + 4 * U, 1, '→');
      const kbHtml = `<div class="hkb"><svg viewBox="0 0 1150 320">${kb}</svg><div class="hleg">${GR.map(g => `<div><u style="background:${g[0]}"></u>${g[2].map(k => `<i class="kc key">${esc(k)}</i>`).join('')}<span>${esc(g[3])}</span></div>`).join('')}</div></div>`;
      const pages = [['pad', T('手柄'), () => diagram(PAD_SVG, pad)], ['key', T('键盘'), () => kbHtml], ['ptr', T('鼠标 / 触屏'), () => diagram(MOUSE_SVG, ptr)]];
      let i = Kit.dev === 'pad' ? 0 : Kit.dev === 'key' ? 1 : 2;
      const scr = Kit.page({
        id: 'help', dim: !!G.S, icon: Kit.ic('pad') || Kit.ic('set'), title: T('操作说明'), right: '<span id="helpTabs" style="display:contents"></span>', body: `<div class="cm" id="helpB"></div>`,
        keys: { lb: () => mv(-1), rb: () => mv(1), left: () => mv(-1), right: () => mv(1), up: () => true, down: () => true, ok: () => mv(1) },
        hints: [['a', '下一页'], ['b', '返回'], ['lbrb', '切换设备']],
      });
      // 示意图按 2:1 摆在剩下的空间里（两侧标注按百分比定位，得跟图一起缩放）
      function size() { const w = scr.el.querySelector('.hwrap'), d = w && w.querySelector('.hdia'); if (!d) return; const cw = w.clientWidth, ch = Kit.narrow ? cw / 2 : w.clientHeight, k = Math.min(cw, ch * 2); d.style.width = k + 'px'; d.style.height = (k / 2) + 'px'; }
      function paint() {
        $('helpTabs').innerHTML = Kit.tabsHtml(pages.map(p => [p[0], p[1]]), pages[i][0]);
        $('helpTabs').querySelectorAll('.ctab').forEach(t => { t.onclick = () => { const k = pages.findIndex(p => p[0] === t.dataset.tab); if (k !== i) { i = k; sfx.tick(); paint(); } }; });
        $('helpB').innerHTML = pages[i][2](); size();
      }
      function mv(d) { i = (i + d + pages.length) % pages.length; sfx.tick(); paint(); }
      const onR = () => { if (scr.on) size(); else removeEventListener('resize', onR); }; addEventListener('resize', onR);
      paint(); return scr;
    }

    return { title, wizard, settings, help, coScreen, coPages, steps: { map: stepMap, seats: stepSeats, co: stepSeats, rules: stepRules, vs: stepVs }, get step() { return wz && wz.on ? wz.el.id : ''; } };
  };
})(window);
