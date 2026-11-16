// 潮汐战线：图鉴（window.AWCodex）。主机式的分页图鉴，版式照科技树（ui-tech.js）：一次只看一样东西、大图大字、方向键和肩键走完。
// 每一页有且只有一个主操作（右下金色，A / 回车），“返回”在左下（见 tools/UI-PRIMARY.md）。
//   首页：九块大图块（插图 + 标题），聚焦放大；
//   世界 / 档案：翻页式，一页一图一段字——左侧斜切面板放插图和标题，右侧是可上下滚动的长文本，确定 = 下一页；
//   阵营：左侧斜切面板（阵营色底：徽记、阵营名、座右铭、定位、特性标签、代表指挥官），右侧完整长文本，LB / RB 切阵营；
//   指挥官：复用选指挥官那一屏（ui-front.js 的 coScreen，只看不选），确定 = 背景故事（coBio：同一套斜切版式）；
//   兵种：LB / RB 切类别，左边大图标，右边展示台（大号像素图、四个大数字、强化、擅长 / 不敌各三条）；X 更多，Y 克制，确定 = 攻击演示；
//   克制：选一个兵种看它打谁强、怕谁的两列条形图；Y 切到完整表格；
//   地形 / 建筑：左边图块，右边大图 + 一句说明 + 关键数字；确定 = 更多（移动消耗表）；
//   科技 / 规则：左边章节列表，右边一次一节；确定 = 下一节；
//   画廊：一页一张大图，底下一条缩略图，确定 = 播放。
// 数值全部现读 AWData / AWCore，兵种、地形按数据遍历，不写死数量。界面文字一律 Kit.t()，显示时再取。
(function (root) {
  'use strict';
  const Kit = root.AWKit, T = Kit.t, esc = Kit.esc, Nav = Kit.Nav, $ = id => document.getElementById(id);
  const D = () => root.AWData || {}, C = () => root.AWCore || null, L = () => root.AWLore || {};
  const arr = v => Array.isArray(v) ? v : [];
  const UN = () => D().UNITS || {}, TR = () => D().TERRAIN || {};
  const order = () => arr(D().ORDER).length ? D().ORDER.filter(k => UN()[k]) : Object.keys(UN());
  const uname = k => (UN()[k] && UN()[k].name) || k, tname = k => (TR()[k] && TR()[k].name) || k;
  const namesOf = keys => Kit.join(keys.map(uname));
  const HIDE_T = ['forest', 'ruins', 'reef'];
  const pal = f => Kit.pal(f), facName = f => Kit.fname(f);
  const dmg = (a, d) => { const r = D().DMG && D().DMG[a]; return r && r[d] != null ? r[d] : null; };
  const sfx = () => Kit.sfx;
  const Run = () => root.AWCampaignRun || null;
  // 数据里有几个阵营算几个；带 hidden 的（黑潮）要等战役里揭晓（lore 里的 reveal 关卡通关）或解锁之后才出现
  const facIds = () => arr(D().FACTIONS).map((f, i) => (f ? i : 0)).filter(i => { if (!i) return false; const F = D().FACTIONS[i]; if (!F.hidden) return true; const lf = (L().factions || {})[i] || {}, G = X.G; try { return !!((G && G.facOpen && G.facOpen(i)) || (lf.reveal && G && G.camp && G.camp.isDone(lf.reveal))); } catch (e) { return false; } });
  // 指挥官露没露面：战役里揭晓之前（lore 的 hidden + reveal）不显示真名和立绘；自由对局解锁了的也算露面
  const coSeen = id => { const G = X.G; try { const R = Run(); if (R && R.unlockedCos && R.unlockedCos().includes(id)) return true; if (G && G.camp && !G.camp.coOpen(id)) return false; } catch (e) { } return true; };
  // 黑潮的精锐兵种这一组开没开：按 AWCampaignRun 的解锁状态
  const darkInfo = () => { try { const R = Run(); return R && R.unlockInfo ? R.unlockInfo(5) : { open: true, reasons: [] }; } catch (e) { return { open: true, reasons: [] }; } };
  const isInf = k => { try { const c = C(); if (c && c.isInfantry) return !!c.isInfantry({ type: k }); } catch (e) { } const u = UN()[k] || {}; return u.mt === 'foot' || u.mt === 'mech'; };
  // 黑潮没解锁（AWCampaignRun.unlockedFactions() 里没有 5）时，图鉴各处都不出现黑潮专属的兵种；keep = 例外的那一个（对局里从详情卡点过来看的）
  const darkOpen = () => { try { const R = Run(); return !R || !R.unlockedFactions || R.unlockedFactions().includes(5); } catch (e) { return true; } };
  const isDark = k => { const u = UN()[k] || {}; return u.faction === 5 || u.only === 5; };
  const vis = keep => { const o = order(); return darkOpen() ? o : o.filter(k => !isDark(k) || k === keep || (keep && isDark(keep))); };
  const first = t => (Kit.sentences(t)[0] || String(t || '')).trim();

  Kit.css(`
  /* 首页：大图块 */
  .cxhome { flex:1; min-height:0; display:flex; flex-wrap:wrap; gap:22r; align-content:safe center; justify-content:center; padding:16r 10r; overflow-y:auto; scrollbar-width:none; }
  .cxt { position:relative; flex:none; width:330r; height:350r; padding:0; overflow:hidden; background:#141a2c; box-shadow:inset 0 0 0 5r var(--line); color:#fff; text-align:left; transition:transform .12s; }
  .cxt .im { position:absolute; inset:5r; background:#1b2338 center/cover no-repeat; transition:transform .25s, filter .2s; filter:saturate(.8) brightness(.72); display:flex; align-items:center; justify-content:center; gap:6r; }
  .cxt .im.g { background:linear-gradient(#8fc45a, #4f8a34); padding-bottom:90r; } .cxt .im.t { background:linear-gradient(#27304c, #141927); padding-bottom:90r; }
  .cxt .cap { position:absolute; left:5r; right:5r; bottom:5r; padding:70r 22r 16r; display:flex; flex-direction:column; gap:2r; background:linear-gradient(transparent, rgba(8,12,24,.94) 62%); }
  .cxt .cap b { font-size:max(26px,50r); font-weight:900; line-height:1.1; text-shadow:0 3r 0 rgba(0,0,0,.5); } .cxt .cap small { font-size:max(20px,24r); font-weight:700; color:#cfd6ea; min-height:1.3em; }
  .cxt.nav.focus { background:var(--gold); transform:scale(1.08); z-index:3; box-shadow:0 0 0 6r var(--gold), 0 0 0 10r var(--line), 0 0 40r 8r rgba(242,182,50,.45), 0 14r 0 rgba(0,0,0,.45); color:#fff; }
  .cxt.nav.focus .im { filter:none; transform:scale(1.08); } .cxt.nav.focus .cap b { color:var(--gold2); } .cxt.nav.focus .cap small { color:#fff; }
  body.narrow .cxhome { gap:16r; align-content:flex-start; } body.narrow .cxt { width:330r; height:250r; } body.small:not(.narrow) .cxt { height:330r; }
  /* 斜切版式：左侧斜切信息栏 + 右侧可滚动长文本（阵营、指挥官背景、世界、档案共用） */
  .lore { background:#0b0f1c !important; padding:0; display:block; } .lore::before { display:none; }
  .lore .ls { position:absolute; left:0; top:0; bottom:0; width:46%; animation:loreL .32s cubic-bezier(.2,1,.3,1) both; } @keyframes loreL { from { transform:translateX(-12%); opacity:0; } }
  .lore .ls::before { content:""; position:absolute; inset:0; background:var(--gold); clip-path:polygon(0 0, 100% 0, calc(100% - 180r) 100%, 0 100%); }
  .lore .lsi { position:absolute; left:0; top:0; bottom:0; right:12r; clip-path:polygon(0 0, 100% 0, calc(100% - 180r) 100%, 0 100%); background:linear-gradient(165deg, var(--pc), var(--pcd) 72%); overflow:hidden; }
  .lore .lsi .bg { position:absolute; inset:0; background:center/cover no-repeat; opacity:.3; mix-blend-mode:luminosity; } .lore .lsi.pic .bg { opacity:1; mix-blend-mode:normal; }
  .lore .lsi::after { content:""; position:absolute; inset:0; background:repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 2r, transparent 2r 26r); pointer-events:none; } .lore .lsi.pic::after { background:linear-gradient(transparent 45%, rgba(8,12,24,.93)); }
  .lore .lsc { position:absolute; left:70r; right:210r; top:96r; bottom:150r; display:flex; flex-direction:column; justify-content:center; gap:16r; z-index:1; } .lore .lsi.pic .lsc { justify-content:flex-end; right:240r; }
  .lore .sw { animation:loreIn .24s ease-out both; } @keyframes loreIn { from { opacity:0; transform:translateY(18r); } }
  .lore .lem { display:flex; align-items:center; gap:22r; } .lore .lem .ic { width:170r; height:170r; filter:drop-shadow(0 8r 0 rgba(0,0,0,.35)); }
  .lore .flag { display:flex; flex-direction:column; gap:4r; min-width:0; } .lore .flag b { font-size:max(44px,112r); font-weight:900; line-height:1.05; color:#fff; } .lore .flag span { font-size:max(20px,30r); font-weight:800; color:var(--gold2); }
  .lore .mo { font-size:max(26px,52r); font-weight:900; line-height:1.25; color:var(--gold2); text-shadow:0 4r 0 rgba(0,0,0,.4); }
  html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .lore .flag b { font-size:max(34px,76r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .lore .mo { font-size:max(24px,42r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .lore .cu { font-size:max(20px,26r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .lore .lem .ic { width:130r; height:130r; } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .lore .lh .hsel { width:92r; height:92r; }
  .lore .cu { margin:0; font-size:max(20px,30r); line-height:1.45; font-weight:800; color:#fff; }
  .lore .lsc .chips .chip { background:rgba(10,14,28,.6); }
  .lore .lh { display:flex; flex-direction:column; gap:10r; margin-top:6r; } .lore .lh > span { font-size:max(20px,24r); font-weight:800; color:var(--pcl); } .lore .lh > div { display:flex; flex-wrap:wrap; gap:18r; padding:8r 6r; }
  .lore .lh .hsel { width:108r; height:108r; } .lore .lh .hsel.un .hd { filter:brightness(0) drop-shadow(0 0 2r #9ab); }
  .lore .lpt { position:absolute; left:-30r; right:120r; top:60r; bottom:0; display:flex; align-items:flex-end; justify-content:center; pointer-events:none; } .lore .lpt img { height:100%; max-width:none; }
  .lore .lsi.co .lsc { justify-content:flex-end; bottom:150r; } .lore .lsi.co::after { background:linear-gradient(transparent 50%, rgba(8,12,24,.9)); }
  .lore .ttl { font-size:max(36px,84r); font-weight:900; line-height:1.08; color:#fff3d0; } .lore .ttl small { display:block; font-size:max(20px,30r); font-weight:800; color:var(--gold); margin-bottom:6r; }
  .lore .pgn { font-size:max(20px,28r); font-weight:900; color:var(--gold2); }
  .lore .lkbig { align-self:center; font-size:220r; color:rgba(255,255,255,.28); margin-bottom:60r; }
  .lore .lr { position:absolute; left:46%; right:0; top:0; bottom:128r; padding:26r 60r 0 44r; display:flex; flex-direction:column; gap:18r; }
  .lore .lrt { flex:none; display:flex; align-items:center; gap:10r; min-height:76r; padding-right:110r; overflow:hidden; } .lore .lrt .ctabs { flex-wrap:wrap; row-gap:8r; gap:6r; } .lore .lrt { padding-right:96r; } .lore .lrt .ctab { padding:0 14r; gap:8r; font-size:max(20px,28r); } .lore .lrt .ctab .ic { width:34r; height:34r; }
  .lore .ctab.on { background:linear-gradient(var(--pc, var(--gold)), var(--pcd, #dc9a1e)); color:#fff; box-shadow:inset 0 0 0 4r var(--gold); text-shadow:0 3r 0 rgba(0,0,0,.4); }
  .lore .tr1 { display:flex; gap:24r; padding:10r 0; border-bottom:3r solid #232a40; } .lore .tr1 b { flex:none; width:250r; color:var(--gold); }
  .lore .tie { display:flex; align-items:center; gap:20r; margin:0 0 16r; } .lore .tie .hd { width:96r; height:96r; cursor:pointer; flex:none; } .lore .tie b { color:var(--gold2); cursor:pointer; border-bottom:3r solid var(--gold); }
  .lore .cond { display:flex; align-items:flex-start; gap:14r; margin:0 0 10r; } .lore .cond i { flex:none; font-style:normal; width:1.3em; text-align:center; color:#6f7892; font-weight:900; } .lore .cond.ok { color:#b6f08a; } .lore .cond.ok i { color:#8fd45a; }
  body.narrow .lore { display:flex; flex-direction:column; padding-bottom:max(74px,150r); } body.narrow .lore .ls { position:relative; width:auto; flex:none; min-height:330r; }
  body.narrow .lore .ls::before, body.narrow .lore .lsi { clip-path:polygon(0 0, 100% 0, 100% calc(100% - 50r), 0 100%); } body.narrow .lore .lsi { right:0; bottom:8r; }
  body.narrow .lore .lsi .lsc, body.narrow .lore .lsi.pic .lsc, body.narrow .lore .lsi.co .lsc { position:relative; left:auto; right:auto; top:auto; bottom:auto; padding:96r 24r 70r; gap:10r; } body.narrow .lore .ls, body.narrow .lore .lr { align-self:stretch; } body.narrow .lore .lsi { position:relative; }
  body.narrow .lore .lem .ic { width:110r; height:110r; } body.narrow .lore .flag b { font-size:max(34px,76r); } body.narrow .lore .mo { font-size:max(20px,38r); } body.narrow .lore .cu, body.narrow .lore .lsc .chips { display:none; } body.narrow .lore .lh .hsel { width:92r; height:92r; }
  body.narrow .lore .lr { position:relative; left:auto; bottom:auto; flex:1; min-height:0; padding:10r 20r 0 24r; gap:8r; } body.narrow .lore .lrt { padding-right:0; overflow-x:auto; } body.narrow .lore .lrt .ctabs { flex-wrap:nowrap; }
  body.narrow .lore .lpt { left:0; right:0; top:20r; opacity:.9; } body.narrow .lore .lsi.co .lsc, body.narrow .lore .lsi.pic .lsc { padding-top:300r; } body.narrow .lore .ttl { font-size:max(28px,60r); } body.narrow .lore .lkbig { margin:0; font-size:150r; }
  body.small:not(.narrow) .lore .lsc { top:30r; bottom:64px; gap:8r; } body.small:not(.narrow) .lore .lr { bottom:58px; padding-top:8r; gap:6r; } body.small:not(.narrow) .lore .lem .ic { width:120r; height:120r; } body.small:not(.narrow) .lore .cu { display:none; } body.small:not(.narrow) .lore .lrt { min-height:0; }
  /* 兵种 / 地形：左边大图标，右边展示台 */
  .ugrid { display:grid; grid-template-columns:1fr 1fr; gap:10r; align-content:start; } .cs .cl.ug { gap:0; }
  .ucell { height:136r; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,24r); font-weight:800; color:var(--txt); overflow:hidden; white-space:nowrap; padding:0 4r; }
  .ucell span { max-width:100%; overflow:hidden; } .ucell.nav.focus { transform:scale(1.08); } .ucell.un canvas, .sil { filter:brightness(0) drop-shadow(0 0 3r #9ab); }
  .ush { flex:1 1 0; min-height:0; display:flex; gap:36r; }
  .ust { flex:none; width:470r; position:relative; display:flex; align-items:center; justify-content:center; background:linear-gradient(#8fc45a 0 62%, #5d9a3c 62%); box-shadow:inset 0 0 0 5r var(--line), inset 0 -34r 0 rgba(0,0,0,.14); overflow:hidden; }
  .ust.sea { background:linear-gradient(#a8d8f8 0 45%, #3f86d6 45%); } .ust.air { background:linear-gradient(#bfe4fb, #6fb0e8); } .ust.dk { background:linear-gradient(#27304c, #10141f); } .ust.tr { background:linear-gradient(#27304c, #141927); }
  .ust canvas.tc { image-rendering:pixelated; } .ust.fire { animation:uFire .2s steps(2) 2; } @keyframes uFire { 50% { filter:brightness(1.5); } }
  .ust .yb { position:absolute; left:0; right:0; bottom:0; padding:8r 0; display:flex; align-items:center; justify-content:center; gap:10r; font-size:max(20px,24r); font-weight:800; color:#fff; background:rgba(8,12,24,.62); }
  .usi { flex:1; min-width:0; display:flex; flex-direction:column; gap:14r; justify-content:center; }
  .usi .nm { display:flex; align-items:baseline; flex-wrap:wrap; gap:6r 20r; font-size:max(34px,76r); font-weight:900; line-height:1.1; color:#fff3d0; } .usi .nm small { font-size:max(20px,28r); font-weight:800; color:var(--gold); }
  .usi .ro { margin:0; font-size:max(20px,32r); line-height:1.4; font-weight:800; }
  .big4 { display:flex; gap:14r; } .big4 > div { flex:1 1 0; min-width:0; display:flex; flex-direction:column; align-items:center; padding:12r 6r 10r; background:var(--bg2); box-shadow:inset 0 0 0 3r var(--line), inset 0 6r 0 rgba(255,255,255,.07); }
  .big4 b { display:flex; align-items:center; gap:8r; font-size:max(30px,64r); font-weight:900; line-height:1.1; color:var(--gold); white-space:nowrap; } .big4 b .ic { width:44r; height:44r; } .big4 b .stars { font-size:max(20px,38r); letter-spacing:0; line-height:1.7; } .big4 b em { font-style:normal; font-size:max(20px,36r); line-height:1.8; } .big4 > div > span { font-size:max(20px,24r); font-weight:700; color:var(--mut); white-space:nowrap; }
  .uore { display:flex; align-items:center; flex-wrap:wrap; gap:10r; font-size:max(20px,28r); font-weight:800; } .uore > span:first-child { color:#bff2ff; display:flex; align-items:center; gap:8r; }
  .uvs { flex:none; display:flex; gap:36r; } .uvs > div { flex:1 1 0; min-width:0; display:flex; flex-direction:column; gap:8r; } .uvs h4 { margin:0; display:flex; align-items:center; gap:10r; font-size:max(20px,28r); font-weight:900; color:var(--mut); }
  .vb { display:flex; align-items:center; gap:14r; min-height:max(40px,60r); padding:0 16r 0 8r; background:rgba(0,0,0,.28); box-shadow:inset 0 0 0 3r var(--line); font-size:max(20px,28r); font-weight:800; cursor:pointer; }
  .vb canvas { flex:none; } .vb .n { flex:none; width:210r; white-space:nowrap; overflow:hidden; } .vb .b { flex:1; min-width:30r; height:22r; background:#0c1222; box-shadow:inset 0 0 0 3r var(--line); position:relative; } .vb .b i { position:absolute; left:3r; top:3r; bottom:3r; background:linear-gradient(#b6f08a, #6fbf3a); }
  html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .vb .n { width:300r; white-space:normal; overflow:visible; line-height:1.05; font-size:max(20px,24r); hyphens:none; overflow-wrap:normal; } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ucell { white-space:normal; text-align:center; line-height:1.02; font-size:max(20px,21r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .ucell canvas { flex:none; } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .cit { white-space:normal; line-height:1.05; font-size:max(20px,28r); } html[data-lang]:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"]) .cit b { overflow:visible; }
  .vb.r .b i { background:linear-gradient(#ffa08c, #e8573f); } .vb > b { flex:none; width:96r; text-align:right; color:var(--green); font-weight:900; } .vb.r > b { color:#ff8a78; } .vb.none { justify-content:center; color:var(--mut); cursor:default; }
  .ulock { flex:1; display:flex; flex-direction:column; justify-content:center; gap:10r; font-size:max(20px,30r); font-weight:800; } .ulock h3 { margin:0 0 10r; font-size:max(30px,60r); color:#fff3d0; } .ulock .cond { display:flex; gap:14r; } .ulock .cond i { font-style:normal; color:#6f7892; width:1.3em; text-align:center; flex:none; } .ulock .cond.ok { color:#b6f08a; } .ulock .cond.ok i { color:#8fd45a; }
  body.narrow .ugrid { display:flex; gap:10r; } body.narrow .ucell { flex:none; width:150r; height:126r; } body.narrow .ush { flex-direction:column; gap:14r; flex:none; } body.narrow .ust { width:auto; height:330r; } body.narrow .uvs { flex-direction:column; gap:14r; } body.narrow .cs .cm.sco { overflow-y:auto; } body.narrow .big4 b { font-size:max(24px,48r); }
  body.small:not(.narrow) .ucell { height:150r; } body.small:not(.narrow) .ust { width:330r; } body.small:not(.narrow) .usi { gap:6r; } body.small:not(.narrow) .usi .ro, body.small:not(.narrow) .uore { display:none; } body.small:not(.narrow) .ush { gap:20r; } body.small:not(.narrow) .big4 > div { padding:4r; } body.small:not(.narrow) .uvs h4 { display:none; } body.small:not(.narrow) .uvs { gap:16r; } body.small:not(.narrow) .vb .n { width:150r; }
  /* 更多：压暗的整屏上一块可滚动的面板 */
  .umore { margin:auto; width:1320r; max-width:96%; height:82%; padding:30r 44r 24r; display:flex; flex-direction:column; gap:10r; } .umore h2 { flex:none; margin:0; display:flex; align-items:center; gap:18r; font-size:max(28px,56r); font-weight:900; color:var(--gold); } .umore .who { flex-wrap:wrap; margin-bottom:14r; } .umore .vs { margin-bottom:14r; }
  .umore .cols2 { display:grid; grid-template-columns:1fr 1fr; gap:8r 30r; } body.narrow .umore { height:auto; max-height:100%; flex:1; padding:20r; margin:10r; width:auto; } body.narrow .umore .cols2 { grid-template-columns:1fr; }
  /* 克制 */
  .cxv { flex:1; min-height:0; display:flex; flex-direction:column; gap:14r; } .cxv .hd0 { flex:none; display:flex; align-items:center; gap:22r; } .cxv .hd0 b { font-size:max(30px,64r); font-weight:900; color:#fff3d0; } .cxv .hd0 span { font-size:max(20px,26r); font-weight:800; color:var(--mut); }
  .cxv .two { flex:1; min-height:0; display:flex; gap:40r; } .cxv .two > div { flex:1 1 0; min-width:0; display:flex; flex-direction:column; gap:8r; overflow:hidden auto; scrollbar-width:none; } .cxv .two h4 { margin:0 0 4r; font-size:max(22px,34r); font-weight:900; display:flex; align-items:center; gap:10r; }
  body.narrow .cxv .two { flex-direction:column; overflow-y:auto; } body.narrow .cxv .two > div { flex:none; overflow:visible; }
  .cxm { flex:1; min-height:0; width:100%; padding:104r 40r 16r; display:flex; } .cxm .wrap { flex:1; overflow:auto; background:var(--bg2); box-shadow:inset 0 0 0 4r var(--line); scrollbar-width:none; } .cxm .wrap::-webkit-scrollbar { display:none; }
  .cxm table { border-collapse:separate; border-spacing:0; font-size:max(20px,22r); font-weight:800; } .cxm td, .cxm th { min-width:62r; height:54r; text-align:center; padding:0; border-right:2r solid var(--line); border-bottom:2r solid var(--line); }
  .cxm th { position:sticky; top:0; background:var(--panel); z-index:2; } .cxm td:first-child, .cxm th:first-child { position:sticky; left:0; background:var(--panel); z-index:1; padding:0 12r; white-space:nowrap; text-align:left; } .cxm th:first-child { z-index:3; }
  .cxm .h { background:rgba(95,202,108,.38); } .cxm .m { background:rgba(242,182,50,.22); } .cxm .l { color:var(--mut); } .cxm .n { color:#55607e; } body.narrow .cxm { padding:104r 8r 8r; }
  /* 科技一览、规则：右边一次一节 */
  .cxs h2 { flex:none; margin:0; display:flex; align-items:center; gap:18r; font-size:max(30px,60r); font-weight:900; color:#fff3d0; line-height:1.15; } .cxs h2 .ic, .cxs h2 .hd { width:84r; height:84r; flex:none; } .cxs h2 small { font-size:max(20px,26r); font-weight:800; color:var(--pcl, var(--mut)); white-space:normal; line-height:1.3; }
  .cxs .lt p { position:relative; padding-left:38r; } .cxs .lt p::before { content:""; position:absolute; left:4r; top:.62em; width:16r; height:16r; background:var(--gold); box-shadow:0 0 0 3r var(--line); } .cxs .lt p i { font-style:normal; color:var(--pcl); margin-right:14r; font-weight:900; }
  .cxs .lt p.cond::before { display:none; } .cxs .lt p.cond { padding-left:0; display:flex; gap:14r; } .cxs .lt p.cond > i { color:#6f7892; width:1.3em; text-align:center; margin:0; flex:none; } .cxs .lt p.cond.ok { color:#b6f08a; } .cxs .lt p.cond.ok > i { color:#8fd45a; }
  .ttr { display:flex; align-items:flex-start; gap:18r; padding:12r 18r; margin:0 0 10r; background:rgba(0,0,0,.28); box-shadow:inset 0 0 0 3r var(--line); } .ttr .tv { flex:none; width:64r; height:64r; display:flex; align-items:center; justify-content:center; background:var(--pc); color:#fff; font-size:max(20px,34r); font-weight:900; box-shadow:inset 0 0 0 3r var(--line); }
  .ttr > div { flex:1; min-width:0; } .ttr b { display:flex; align-items:baseline; gap:14r; font-size:max(22px,34r); font-weight:900; line-height:1.3; } .ttr b em { font-style:normal; margin-left:auto; font-size:max(20px,26r); color:var(--gold); white-space:nowrap; } .ttr span { display:block; font-size:max(20px,28r); line-height:1.45; font-weight:700; color:#e3e8f6; }
  /* 画廊：一页一张大图 + 底下一条缩略图 */
  #cxGal { background:#000 !important; padding:0; display:block; } #cxGal::before { display:none; }
  #cxGal .gbig { position:absolute; left:0; right:0; top:0; bottom:300r; background:#05070d center/contain no-repeat; transition:background-image .2s; } #cxGal .gbig::after { content:""; position:absolute; inset:60% 0 0; background:linear-gradient(transparent, #000); }
  #cxGal .gcap { position:absolute; left:60r; right:60r; bottom:310r; z-index:2; display:flex; align-items:baseline; gap:20r; font-size:max(28px,60r); font-weight:900; color:#fff3d0; text-shadow:0 4r 0 #000; } #cxGal .gcap small { font-size:max(20px,28r); color:var(--gold); }
  #cxGal .lkbig { position:absolute; left:50%; top:34%; font-size:200r; color:#39425e; transform:translateX(-50%); }
  .cxgal { position:absolute; left:0; right:0; bottom:128r; height:170r; display:flex; align-items:center; gap:14r; padding:0 40r; overflow:auto hidden; scrollbar-width:none; } .cxgal::-webkit-scrollbar { display:none; }
  .cxgal .g1 { flex:none; width:240r; height:135r; padding:0; background:#141a2c center/cover no-repeat; box-shadow:inset 0 0 0 4r var(--line); color:#6f7892; font-size:max(20px,30r); display:flex; align-items:center; justify-content:center; } .cxgal .g1 span { display:none; } .cxgal .g1.lock span { display:block; }
  .cxgal .gh { flex:none; margin:0 4r 0 16r; font-size:max(20px,26r); font-weight:900; color:var(--gold); white-space:nowrap; writing-mode:vertical-rl; max-height:150r; overflow:hidden; } html:not([data-lang="zh-CN"]):not([data-lang="zh-TW"]):not([data-lang="ja"]):not([data-lang="ko"])[data-lang] .cxgal .gh { writing-mode:horizontal-tb; }
  .cxgal .g1.nav.focus { background-color:#141a2c; box-shadow:0 0 0 6r var(--gold), 0 0 0 10r var(--line); transform:scale(1.1); z-index:2; }
  body.narrow #cxGal .gbig { bottom:max(190px,420r); } body.narrow #cxGal .gcap { bottom:max(196px,432r); left:20r; right:20r; flex-wrap:wrap; font-size:max(22px,44r); } body.narrow .cxgal { bottom:max(74px,150r); padding:0 16r; } body.small:not(.narrow) .cxgal { bottom:60px; height:150r; } body.small:not(.narrow) #cxGal .gbig { bottom:calc(60px + 150r); } body.small:not(.narrow) #cxGal .gcap { bottom:calc(64px + 150r); }
  `);

  const scrs = [];                                 // 图鉴里打开着的页面（从首页一层层往下）
  const X = { G: null, get isOpen() { return scrs.some(s => s.on); }, get el() { const s = scrs[scrs.length - 1]; return s ? s.el : null; } };
  const track = s => { scrs.push(s); const oc = s.o.onClose; s.o.onClose = () => { const i = scrs.indexOf(s); if (i >= 0) scrs.splice(i, 1); if (oc) oc(); }; return s; };
  const push = o => track(Kit.screen(Object.assign({ dim: false }, o)));
  const page = o => track(Kit.page(o));
  const back = s => () => { sfx().back(); s.close(); };
  const cond = (r, tag) => `<${tag || 'div'} class="cond${r.done ? ' ok' : ''}"><i>${r.done ? '✓' : '○'}</i><span>${esc(r.text)}</span></${tag || 'div'}>`;
  const LOCK = '<i class="lkic"></i>';

  // ───────── 首页 ─────────
  const PAGES = [['world', '世界', '中央海与陨星碎片', 'cg/op-01.webp'], ['faction', '阵营', '', 'cg/op-03.webp'], ['co', '指挥官', '', 'cg/op-05.webp'], ['unit', '兵种', '', ''], ['terrain', '地形', '', ''], ['tech', '科技', '', 'cg/act1-01.webp'], ['rules', '规则', '', 'cg/lv-a1_2.webp'], ['files', '档案', '', 'cg/op-02.webp'], ['gallery', '画廊', '', 'cg/act0-01.webp'], ['rank', '战绩', '', '']];
  function home() {
    const cnt = { faction: T('{n} 个', { n: facIds().length }), co: T('{n} 位', { n: arr(D().COS).filter(c => coSeen(c.id) && facIds().includes(c.faction)).length }), unit: T('{n} 种', { n: vis().length }), terrain: T('{n} 种', { n: Object.keys(TR()).length }), rules: T('对局规则'), tech: T('{n} 项', { n: arr(D().TECH).length }), files: FILES() ? T('{a}/{b} 份', { a: filesOpen().length, b: Object.keys(FILES()).length }) : '' };
    const P = root.AWCGPlayer, gl = P ? P.gallery() : []; if (gl.length) cnt.gallery = T('{a}/{b}', { a: gl.filter(g => g.open).length, b: gl.length });
    const RK = root.AWRankUI; if (RK) cnt.rank = RK.homeSub();
    const pic = (k, im) => k === 'rank' ? RK.homePic() : k === 'unit' ? `<div class="im g">${Kit.unit('tnk', 1, 120, 'data-anim')}${Kit.unit('med', 2, 150, 'data-anim')}${Kit.unit('atk', 4, 120, 'data-anim')}</div>` : k === 'terrain' ? `<div class="im t">${Kit.terr('forest', 0, 100)}${Kit.terr('city', 1, 120)}${Kit.terr('mountain', 0, 100)}</div>` : `<div class="im" style="background-image:url('${im}')"></div>`;
    const list = PAGES.filter(p => (p[0] !== 'tech' || arr(D().TECH).length) && (p[0] !== 'files' || FILES()) && (p[0] !== 'gallery' || gl.length) && (p[0] !== 'rank' || RK));
    const s = page({ id: 'codex', icon: Kit.ic('codex'), title: T('图鉴', null, 'tab'),
      body: `<div class="cxhome">${list.map(([k, t, sub, im]) => `<button class="nav cxt" data-k="${k}">${pic(k, im)}<span class="cap"><b>${esc(T(t, null, 'tab'))}</b><small>${esc((sub && T(sub)) || cnt[k] || '')}</small></span></button>`).join('')}</div>`,
      hints: [['a', '查看'], ['b', '返回'], ['dpad', '选择']] });
    s.el.querySelectorAll('.cxt').forEach(b => { b.onclick = () => { sfx().ok(); go(b.dataset.k); }; });
    return s;
  }
  function go(k, o) { o = o || {}; return ({ world, faction, co: coPage, unit: unitPage, terrain: terrPage, tech: techPage, rules: rulesPage, files: filesPage, gallery: galleryPage, rank: o => track(root.AWRankUI.overview(o)) })[k](o); }
  // 档案：战役里解锁的条目（AWCampaign.codex）；解锁记录问战役模块
  const FILES = () => (root.AWCampaign && root.AWCampaign.codex) || null;
  const filesOpen = () => { try { return (X.G && X.G.camp ? X.G.camp.unlockedCodex() : (Run() ? Run().unlockedCodex() : [])) || []; } catch (e) { return []; } };

  // ───────── 斜切版式的骨架：左侧斜切信息栏 + 右侧可滚动长文本 ─────────
  // o：Kit.screen 的字段（id、keys、hints…）。返回 { scr, set({ f 阵营色, bg, pic 插图铺满, co 立绘版, left, top, text }) }
  function lore(o) {
    const keys = Object.assign({ up: () => { Kit.scrollText(-1); }, down: () => { Kit.scrollText(1); } }, o.keys || {});
    const scr = push(Object.assign({}, o, { cls: 'lore ' + (o.cls || ''), flow: true, keys,
      html: `<div class="ls"><div class="lsi"><div class="bg"></div><div class="lpt"></div><div class="lsc"></div></div></div><div class="lr"><div class="lrt"></div>${Kit.longText('')}</div>` }));
    const q = s => scr.el.querySelector(s);
    function set(v) {
      scr.el.style.cssText = v.f != null ? Kit.pcs(v.f) : '--pc:#46527a;--pcd:#232a40;--pcl:#cfd6ea';
      q('.lsi').className = 'lsi' + (v.pic ? ' pic' : '') + (v.co ? ' co' : '');
      q('.bg').style.backgroundImage = v.bg ? `url('${v.bg}')` : '';
      q('.lpt').innerHTML = v.co || '';
      for (const [sel, html] of [['.lsc', v.left || ''], ['.lt', v.text || '']]) { const e = q(sel); e.innerHTML = html; e.classList.remove('sw'); void e.offsetWidth; e.classList.add('sw'); }
      q('.lrt').innerHTML = v.top || ''; q('.lt').scrollTop = 0;
      Kit.hydrate(scr.el); Kit.paintHints(true);
    }
    return { scr, set, q };
  }
  const sec = (h, body) => body ? `<h3>${esc(h)}</h3>${body}` : '';
  const ps = v => (Array.isArray(v) ? v : v ? [v] : []).map(t => `<p>${esc(t)}</p>`).join('');

  // ───────── 世界：一页一图一段字 ─────────
  function world() {
    const W = L().world || { title: T('世界', null, 'tab'), text: [] }, art = root.AWTitleArt && root.AWTitleArt.img ? root.AWTitleArt.img.src : '';
    const IM = ['cg/op-01.webp', 'cg/op-02.webp', 'cg/op-03.webp', 'cg/op-04.webp'];
    const pages = [{ head: W.title || T('世界', null, 'tab'), html: ps(W.text) }];
    arr(W.sections).forEach(s => pages.push({ head: s.title, html: ps(s.text) }));
    if (arr(W.timeline).length) pages.push({ head: T('年表'), html: W.timeline.map(t => `<div class="tr1"><b>${esc(t.when)}</b><span>${esc(t.what)}</span></div>`).join(''), art: true });
    let i = 0;
    const V = lore({ id: 'cxWorld', keys: { left: () => mv(-1), right: () => mv(1), lb: () => mv(-1), rb: () => mv(1), ok: () => (i < pages.length - 1 ? mv(1) : back(V.scr)()) },
      hints: () => [['a', i < pages.length - 1 ? '下一页' : '完成'], ['b', '返回'], ['lbrb', '翻页'], ['ud', '滚动']] });
    function paint() {
      const p = pages[i];
      V.set({ pic: true, bg: p.art ? art : (IM[i] || art), left: `<span class="pgn">${T('{a}/{b}', { a: i + 1, b: pages.length })}</span><div class="ttl"><small>${esc(T('世界', null, 'tab'))}</small>${esc(p.head)}</div>`,
        top: Kit.tabsHtml(pages.map((x, k) => [String(k), x.head]), String(i)), text: p.html });
      V.q('.lrt').querySelectorAll('.ctab').forEach(t => { t.onclick = () => { if (+t.dataset.tab !== i) { i = +t.dataset.tab; sfx().tick(); paint(); } }; });
    }
    function mv(d) { i = (i + d + pages.length) % pages.length; sfx().tick(); paint(); }
    paint(); return V.scr;
  }

  // ───────── 阵营：左侧斜切面板 + 右侧完整长文本 ─────────
  function faction(o) {
    const fs = facIds(); let i = Math.max(0, fs.indexOf(o.faction || 1));
    const V = lore({ id: 'cxFac', keys: { lb: () => mv(-1), rb: () => mv(1) },
      hints: () => [['a', '查看指挥官', !document.querySelector('#cxFac .hsel.nav')], ['b', '返回'], ['lbrb', '切换阵营'], ['ud', '滚动']] });
    function paint() {
      const f = fs[i], F = D().FACTIONS[f], LF = (L().factions || {})[f] || {}, A = root.AWUIAssets || {};
      const cos = arr(D().COS).filter(c => c.faction === f).sort((a, b) => (coSeen(a.id) ? 0 : 1) - (coSeen(b.id) ? 0 : 1));   // 露过面的排前面，没露面的是剪影
      const left = `<div class="lem">${Kit.emblem(f)}<div class="flag"><b class="ol">${esc(F.name)}</b><span>${esc(LF.seat || '')}</span></div></div>` +
        (LF.motto ? `<div class="mo">${esc(T('“{text}”', { text: LF.motto }))}</div>` : '') + (F.culture ? `<p class="cu">${esc(F.culture)}</p>` : '') +
        `<div class="chips">${Kit.modChipsHtml(F.mods, null, f, 4)}${F.cityIncome ? Kit.chip(Kit.ic('coin', 's'), T('城市收入'), Kit.pct(F.cityIncome), 'good') : ''}</div>` +
        `<div class="lh"><span>${esc(T('代表指挥官'))}</span><div>${cos.map(c => coSeen(c.id) ? `<div class="nav hsel" data-v="${c.id}">${Kit.head(c.id, f, 0)}</div>` : `<div class="hsel un">${Kit.head(c.id, f, 0)}</div>`).join('')}</div></div>`;
      const text = sec(T('来历'), ps(LF.story)) + sec(T('政体'), ps(LF.polity)) + sec(T('军队'), ps(LF.army)) +
        arr(LF.rifts).map(r => sec(T('内部两派 · {name}', { name: r.name }), ps(r.text))).join('') +
        (LF.views ? sec(T('对其他阵营的看法'), Object.keys(LF.views).map(k => `<p><b style="color:${pal(+k).h}">${esc(facName(+k))}</b>　${esc(LF.views[k])}</p>`).join('')) : '') +
        sec(T('谚语'), arr(LF.sayings).map(t => `<p class="q">${esc(T('“{text}”', { text: t }))}</p>`).join('')) + sec(T('所求'), ps(LF.wants)) + sec(T('所惧'), ps(LF.fears)) + sec(T('徽记'), ps(LF.emblem)) +
        sec(T('阵营特性'), ps(F.trait)) + (F.research ? sec(T('研究方式 · {name}', { name: F.research.name }), ps(F.research.desc)) : '');
      V.set({ f, bg: A['bg' + f] || '', left, text, top: Kit.tabsHtml(fs.map(x => [String(x), facName(x), Kit.emblem(x)]), String(f)) });
      V.q('.lrt').querySelectorAll('.ctab').forEach(t => { t.style.cssText = Kit.pcs(+t.dataset.tab); t.onclick = () => { const k = fs.indexOf(+t.dataset.tab); if (k !== i) { i = k; sfx().tick(); paint(); } }; });
      V.q('.lsc').querySelectorAll('.hsel.nav').forEach(b => { b.onclick = () => { sfx().ok(); coPage({ co: b.dataset.v }); }; });
      Nav.top().f = null; const h = V.q('.lsc .hsel.nav'); if (h) Nav.focus(h);
    }
    function mv(d) { if (fs.length < 2) return; i = (i + d + fs.length) % fs.length; sfx().tick(); paint(); }
    paint(); return V.scr;
  }

  // ───────── 指挥官：和选指挥官同一屏，只看不选；确定 = 背景故事 ─────────
  function coPage(o) {
    const G = X.G, F = G && G.front; if (!F) return null;
    const fs5 = facIds().filter(f => arr(D().COS).some(c => c.faction === f));
    const s = F.coScreen({ standalone: true, id: 'cxCo', fs: fs5, coLock: id => (coSeen(id) ? null : { text: T('推进战役后揭晓。') }), sel: o.co || (D().COS[0] && D().COS[0].id), p: 1, onBack: () => s.close() });
    return track(s);
  }
  // 指挥官背景：斜切版式。左边大立绘 + 名字、称号、台词；右边背景、战法、人物关系、在战役中、喜欢与讨厌。
  // ids = 同一组里可以翻的指挥官（确定 = 下一位）；onGo(id) = 点了人物关系里的人
  X.coBio = (id, o) => {
    o = o || {}; const cos = arr(D().COS), ids = arr(o.ids).length ? o.ids.slice() : [id]; let i = Math.max(0, ids.indexOf(id));
    const V = lore({ id: 'coBio', onClose: o.onClose, keys: { lb: () => mv(-1), rb: () => mv(1), left: () => mv(-1), right: () => mv(1), ok: () => (ids.length > 1 ? mv(1) : back(V.scr)()) },
      hints: () => [['a', ids.length > 1 ? '下一位' : '完成'], ['b', '返回'], ids.length > 1 && ['lbrb', '切换指挥官'], ['ud', '滚动']] });
    function paint() {
      const co = cos.find(c => c.id === ids[i]) || {}, lo = (L().cos || {})[co.id] || {}, f = co.faction || 0;
      const left = `<div class="ttl"><small>${Kit.emblem(f, 's')} ${esc(facName(f))}${co.title ? ' · ' + esc(co.title) : ''}</small>${esc(co.name || '')}</div>` + (lo.quote ? `<div class="mo">${esc(T('“{text}”', { text: lo.quote }))}</div>` : '');
      const ties = arr(lo.ties).map(t => { const c = cos.find(q => q.id === t.co), ok = c && coSeen(c.id); return `<div class="tie">${ok ? `<span data-go="${c.id}">${Kit.head(c.id, c.faction, 96)}</span>` : ''}<span>${ok ? `<b data-go="${c.id}">${esc(c.name)}</b>　` : ''}${esc(t.text)}</span></div>`; }).join('');
      const text = sec(T('背景'), ps(lo.bio)) + sec(T('战法'), ps(lo.style)) + sec(T('人物关系'), ties) + sec(T('在战役中'), ps(lo.role)) +
        sec(T('喜欢与讨厌'), (lo.like ? `<p><span class="good">${esc(T('喜欢'))}</span>　${esc(lo.like)}</p>` : '') + (lo.hate ? `<p><span class="bad">${esc(T('讨厌'))}</span>　${esc(lo.hate)}</p>` : '')) +
        sec(T('特长'), ps(co.passive)) + sec(T('技能「{name}」', { name: co.power || '' }), ps(co.desc));
      V.set({ f, co: Kit.port(co.id, 'normal'), left, text: text || `<p class="mut">${esc(T('暂无档案。'))}</p>`, top: ids.length > 1 ? `<span class="kcw">${Kit.cap('lb')}</span><span class="pgn">${T('{a}/{b}', { a: i + 1, b: ids.length })}</span><span class="kcw">${Kit.cap('rb')}</span>` : '' });
      V.q('.lt').querySelectorAll('[data-go]').forEach(a => { a.style.cursor = 'pointer'; a.onclick = () => { const to = a.dataset.go; sfx().ok(); if (ids.includes(to)) { i = ids.indexOf(to); return paint(); } if (o.onGo) { V.scr.close(); o.onGo(to); } else { ids.push(to); i = ids.length - 1; paint(); } }; });
    }
    function mv(d) { if (ids.length < 2) return; i = (i + d + ids.length) % ids.length; sfx().tick(); paint(); }
    paint(); return V.scr;
  };

  // ───────── 兵种：LB / RB 切类别，左边大图标，右边展示台 ─────────
  const UCATS = [['inf', '步兵类', 'inf'], ['veh', '车辆', 'tnk'], ['air', '航空', 'atk'], ['sea', '舰船', 'dst'], ['dark', '黑潮精锐', 'bht']];
  const ucat = k => { const U = UN()[k] || {}; return (U.faction === 5 || U.only === 5) ? 'dark' : U.air ? 'air' : U.ship ? 'sea' : isInf(k) ? 'inf' : 'veh'; };
  const uown = k => (ucat(k) === 'dark' ? 5 : 1);
  const vbar = (t, v, cls, own) => `<div class="vb ${cls}" data-gou="${t}">${Kit.unit(t, own, 52)}<span class="n">${esc(uname(t))}</span><span class="b"><i style="width:calc(${Math.min(100, Math.round(v / 1.3))}% - 6 * var(--r))"></i></span><b>${v}%</b></div>`;
  // 擅长 / 不敌：按基础伤害排（≥ 55 才算）；黑潮精锐没解锁时不出现在别的兵种的列表里
  const matchups = (k, n) => { const all = vis(k), rank = l => l.filter(x => x[1] != null && x[1] >= 55).sort((a, b) => b[1] - a[1]).slice(0, n); return { good: rank(all.map(t => [t, dmg(k, t)])), bad: rank(all.map(t => [t, dmg(t, k)])) }; };
  const vnone = () => `<div class="vb none">${esc(T('无'))}</div>`;
  function unitText(k) {
    const U = UN()[k], TT = TR(), out = [U.desc || ''], hide = HIDE_T.filter(t => TT[t]).map(tname);
    if (U.range && U.range[1] > 1) out.push(U.lob ? T('抛射：移动后仍可攻击。') : T('远程：移动后不可攻击，只有不移动时才可以攻击。'));
    if (U.range && U.range[0] > 1) out.push(T('不可攻击相邻的敌方单位，受到相邻敌方单位攻击时也不可反击。'));
    if (U.cover != null && U.cover < 1) out.push(U.cover <= 0 ? T('攻击时无视目标的地形防御。') : T('攻击时，目标的地形防御按 {pct}% 计算。', { pct: Math.round(U.cover * 100) }));
    if (U.reveal) out.push(hide.length ? T('迷雾开启时，可发现周围 8 格{list}中的隐蔽单位。', { list: Kit.join(hide) }) : T('迷雾开启时，可发现周围 8 格中的隐蔽单位。'));
    if (U.carry) out.push(U.carry.kind === 'ground' ? T('可搭载 {n} 个陆上单位。', { n: U.carry.n }) : T('可搭载 {n} 个步兵类单位。', { n: U.carry.n }));
    const no = vis(k).filter(t => dmg(k, t) == null); if (U.range && no.length) out.push(no.length > 8 ? T('可攻击：{list}。', { list: namesOf(vis(k).filter(t => dmg(k, t) != null).slice(0, 12)) }) : T('不可攻击：{list}。', { list: namesOf(no) }));
    if (D().RES && U.ore) { const fx = Kit.oreFx(k); if (fx.length) out.push(T('强化生产（多花 {n} 份{res}）：{list}。', { n: U.ore, res: D().RES.short || D().RES.name, list: Kit.join(fx.map(e => e.text)) })); }
    return out.filter(Boolean);
  }
  // “更多”浮层：标题 + 一块可滚动的内容；确定 / 返回都是关闭
  function more(title, html, o) {
    const s = track(Kit.screen({ id: 'cxMore', dim: true, pop: true, flow: true, html: `<div class="umore pn"><h2>${title}</h2>${Kit.longText(html)}</div>`,
      keys: Object.assign({ up: () => { Kit.scrollText(-1); }, down: () => { Kit.scrollText(1); }, ok: () => back(s)(), x: () => back(s)() }, (o && o.keys) || {}), hints: [['a', '关闭'], ['b', '返回'], ['ud', '滚动']] }));
    return s;
  }
  function unitMore(k) {
    const U = UN()[k], own = uown(k), all = vis(k), foe = own === 1 ? 2 : 1;
    const out = all.map(t => [t, dmg(k, t)]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]), inn = all.map(t => [t, dmg(t, k)]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]);
    const mtName = { foot: '步兵', mech: '步兵', tread: '履带', wheel: '轮式', ship: '舰船', air: '航空' }[U.air ? 'air' : U.ship ? 'ship' : U.mt] || '';
    const html = sec(T('说明'), ps(unitText(k))) +
      sec(T('数值'), `<div class="chips" style="margin-bottom:calc(14 * var(--r))">${Kit.chip(Kit.ic('coin', 's'), T('造价'), U.cost)}${D().RES && U.ore ? Kit.chip(Kit.ic('ore', 's'), T('强化价'), U.ore) : ''}${Kit.chip(Kit.ic('boot', 's'), T('移动力'), U.move)}${mtName ? Kit.chip('', T('移动类型'), T(mtName, null, 'move')) : ''}${Kit.chip(Kit.ic('aim', 's'), T('射程'), Kit.rangeText(U))}${Kit.chip(Kit.ic('eye', 's'), T('视野'), U.vision || 0)}${U.from ? Kit.chip('', T('生产建筑'), tname(U.from)) : ''}${Kit.unitTags(k).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`) +
      sec(T('攻击各兵种的基础伤害'), `<div class="cols2">${out.map(x => vbar(x[0], x[1], 'g', foe)).join('') || vnone()}</div>`) +
      sec(T('受到各兵种攻击的基础伤害'), `<div class="cols2">${inn.map(x => vbar(x[0], x[1], 'r', foe)).join('') || vnone()}</div>`);
    sfx().ok(); return more(Kit.unit(k, own, 84) + esc(U.name), html);
  }
  function unitPage(o) {
    const U = UN(), all = order(), dk = darkInfo();
    const cats = UCATS.filter(c => all.some(k => ucat(k) === c[0])), keysOf = c => all.filter(k => ucat(k) === c);
    let cat = o.unit && U[o.unit] ? ucat(o.unit) : cats[0][0], cur = '', firing = false;
    const lockedCat = c => c === 'dark' && !darkOpen() && !(o.unit && ucat(o.unit) === 'dark');   // 对局里从详情卡跳过来看的那个精锐兵种照常显示
    const tabs = () => Kit.tabsHtml(cats.map(c => [c[0], lockedCat(c[0]) ? T('？？？') : T(c[1], null, 'tab'), lockedCat(c[0]) ? LOCK : '', lockedCat(c[0])]), cat);
    const s = page({ id: 'cxUnit', icon: Kit.ic('unit'), title: T('兵种', null, 'tab'), right: tabs(), body: `<div class="cl ug"><div class="ugrid" id="cxgrid"></div></div><div class="cm sco" id="cxcard"></div>`,
      onFocus: b => { if (b.dataset.k && b.dataset.k !== cur) show(b.dataset.k); },
      keys: { lb: () => chCat(-1), rb: () => chCat(1), ok: fire, x: () => { if (cur && !lockedCat(cat)) unitMore(cur); else sfx().no(); }, y: () => { if (cur && !lockedCat(cat)) { sfx().ok(); vsPage({ unit: cur }); } else sfx().no(); } },
      hints: () => [['a', lockedCat(cat) ? '未解锁' : '攻击演示', lockedCat(cat) || !(U[cur] && U[cur].range)], ['b', '返回'], ['x', '更多', lockedCat(cat)], ['y', '克制', lockedCat(cat)], ['lbrb', '切换类别']] });
    const wireTabs = () => s.el.querySelectorAll('.ch .ctab').forEach(t => { t.onclick = () => { if (t.dataset.tab !== cat) { cat = t.dataset.tab; sfx().tick(); grid(); } }; });
    function grid(focusK) {
      s.el.querySelector('.cr').innerHTML = tabs(); wireTabs();
      const lk = lockedCat(cat);
      $('cxgrid').innerHTML = keysOf(cat).map(k => `<div class="nav ucell${lk ? ' un' : ''}" data-k="${k}">${Kit.unit(k, uown(k), 84)}<span>${lk ? esc(T('？？？')) : esc(uname(k))}</span></div>`).join('');
      Kit.hydrate($('cxgrid')); cur = ''; Nav.top().f = null; Nav.focus($('cxgrid').querySelector(`[data-k="${focusK}"]`) || $('cxgrid').firstChild);
    }
    function show(k) {
      cur = k; const u = U[k], own = uown(k), cc = ucat(k), el = $('cxcard');
      if (lockedCat(cat)) {
        el.innerHTML = `<div class="ush"><div class="ust dk"><span class="sil">${Kit.unit(k, own, 380)}</span></div><div class="ulock"><h3>${LOCK} ${esc(T('？？？'))}</h3><p style="margin:0 0 calc(10 * var(--r))">${esc(T('解锁黑潮后可查看。完成任意一组条件就能解锁：'))}</p>${Kit.unlockHtml(dk, 5)}</div></div>`;
        Kit.hydrate(el); Kit.paintHints(true); return;
      }
      const mu = matchups(k, 3), fx = D().RES && u.ore ? Kit.oreFx(k) : [], foe = own === 1 ? 2 : 1;
      el.innerHTML = `<div class="ush"><div class="ust ${cc === 'dark' ? (u.air ? 'air' : u.ship ? 'sea' : '') : cc === 'air' ? 'air' : cc === 'sea' ? 'sea' : ''}" id="ust">${Kit.unit(k, own, 380, 'data-anim id="ustcv"')}${u.range ? `<span class="yb">${Kit.cap('a')}${esc(T('攻击演示'))}</span>` : ''}</div>` +
        `<div class="usi"><div class="nm">${esc(u.name)}<small>${esc(T((UCATS.find(c => c[0] === cc) || [])[1] || '', null, 'tab'))}</small></div><p class="ro">${esc(first(u.desc))}</p>` +
        `<div class="big4"><div><b>${Kit.ic('coin', 's')}${u.cost}</b><span>${esc(T('造价'))}</span></div><div><b>${Kit.ic('boot', 's')}${u.move}</b><span>${esc(T('移动力'))}</span></div><div><b>${Kit.ic('aim', 's')}${Kit.rangeText(u)}</b><span>${esc(T('射程'))}</span></div><div><b>${Kit.ic('eye', 's')}${u.vision || 0}</b><span>${esc(T('视野'))}</span></div></div>` +
        (fx.length ? `<div class="uore"><span>${Kit.ic('ore', 's')}${esc(T('强化 {n} 份{res}', { n: u.ore, res: D().RES.short || D().RES.name }))}</span>${fx.map(e => Kit.chip(Kit.ic(e.icon, 's'), e.text, '', 'good')).join('')}</div>` : '') + `</div></div>` +
        `<div class="uvs"><div><h4><span class="good">▲</span>${esc(T('擅长'))}</h4>${mu.good.map(x => vbar(x[0], x[1], 'g', foe)).join('') || vnone()}</div><div><h4><span class="bad">▼</span>${esc(T('不敌'))}</h4>${mu.bad.map(x => vbar(x[0], x[1], 'r', foe)).join('') || vnone()}</div></div>`;
      Kit.hydrate(el); el.scrollTop = 0;
      el.querySelectorAll('[data-gou]').forEach(b => { b.onclick = () => jump(b.dataset.gou); });
      const st = $('ust'); if (st) st.onclick = fire;
      Kit.paintHints(true);
    }
    function jump(k) { if (!U[k]) return; sfx().tick(); if (ucat(k) !== cat) { if (lockedCat(ucat(k))) return; cat = ucat(k); grid(k); } else Nav.focus($('cxgrid').querySelector(`[data-k="${k}"]`)); }
    function chCat(d) { const i = cats.findIndex(c => c[0] === cat); cat = cats[(i + d + cats.length) % cats.length][0]; sfx().tick(); grid(); }
    // 攻击演示：把攻击的三帧放两遍，放完回到待机
    function fire() {
      const cv = $('ustcv'), k = cur, Art = root.AWArt; if (!cv || firing || lockedCat(cat)) return; if (!U[k].range) { sfx().no(); return Kit.note(T('无武装')); }
      firing = true; cv.removeAttribute('data-anim'); sfx().ok(); let i = 0;
      const step = () => {
        if (!cv.isConnected || cur !== k) { firing = false; return; }
        if (i >= 6) { firing = false; cv.setAttribute('data-anim', ''); return; }
        let sp = null; try { sp = Art.unit(k, uown(k), false, cv.width, i % 3, { state: 'attack', i: i % 3 }); } catch (e) { }
        if (sp) { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(sp, 0, 0, cv.width, cv.height); }
        if (i % 3 === 1) { const st = $('ust'); if (st) { st.classList.remove('fire'); void st.offsetWidth; st.classList.add('fire'); } }
        i++; setTimeout(step, 120);
      };
      step();
    }
    wireTabs(); grid(o.unit); return s;
  }

  // ───────── 克制：选一个兵种，看它打谁强、怕谁；Y = 完整表格 ─────────
  function vsPage(o) {
    const all = vis(o && o.unit); let i = Math.max(0, all.indexOf(o && o.unit));
    const s = page({ id: 'cxVs', icon: Kit.ic('sword'), title: T('克制'), right: `<span class="kcw">${Kit.cap('lb')}</span><span id="cxvn"></span><span class="kcw">${Kit.cap('rb')}</span>`, body: `<div class="cm"><div class="cxv" id="cxv"></div></div>`,
      keys: { lb: () => mv(-1), rb: () => mv(1), left: () => mv(-1), right: () => mv(1), up: () => true, down: () => true, ok: () => mv(1), y: () => { sfx().ok(); matrix(); } },
      hints: [['a', '下一个兵种'], ['b', '返回'], ['lbrb', '切换兵种'], ['y', '完整表格']] });
    function paint() {
      const k = all[i], own = uown(k), foe = own === 1 ? 2 : 1, mu = matchups(k, 7);
      $('cxvn').textContent = T('{a}/{b}', { a: i + 1, b: all.length });
      $('cxv').innerHTML = `<div class="hd0">${Kit.unit(k, own, 120, 'data-anim')}<b>${esc(uname(k))}</b><span>${esc(T('数值为基础伤害（%），70 以上为克制'))}</span></div><div class="two"><div><h4><span class="good">▲</span>${esc(T('克制的兵种'))}</h4>${mu.good.map(x => vbar(x[0], x[1], 'g', foe)).join('') || vnone()}</div><div><h4><span class="bad">▼</span>${esc(T('处于劣势的兵种'))}</h4>${mu.bad.map(x => vbar(x[0], x[1], 'r', foe)).join('') || vnone()}</div></div>`;
      Kit.hydrate($('cxv')); $('cxv').querySelectorAll('[data-gou]').forEach(b => { b.onclick = () => { const j = all.indexOf(b.dataset.gou); if (j >= 0) { i = j; sfx().tick(); paint(); } }; });
    }
    function mv(d) { i = (i + d + all.length) % all.length; sfx().tick(); paint(); }
    paint(); return s;
  }
  // 完整克制表：行 = 攻击方，列 = 防守方，可滚动
  function matrix() {
    const all = vis();
    const s = push({ id: 'cxMx', flow: true, html: `<div class="crumb pn">${esc(T('克制表　行为攻击方，列为防守方，数值为基础伤害（%）'))}</div><div class="cxm"><div class="wrap" id="cxmw"><table><tr><th>${esc(T('攻 ＼ 守'))}</th>${all.map(t => `<th>${Kit.unit(t, 2, 46)}</th>`).join('')}</tr>` +
      all.map(a => `<tr><td>${Kit.unit(a, 1, 46)} ${esc(uname(a))}</td>${all.map(d => { const v = dmg(a, d); return `<td class="${v == null ? 'n' : v >= 70 ? 'h' : v > 25 ? 'm' : 'l'}">${v == null ? '·' : v}</td>`; }).join('')}</tr>`).join('') + `</table></div></div>`,
      keys: { up: () => sc(0, -1), down: () => sc(0, 1), left: () => sc(-1, 0), right: () => sc(1, 0), lb: () => sc(0, -4), rb: () => sc(0, 4), ok: () => back(s)(), y: () => back(s)() }, hints: [['a', '关闭'], ['b', '返回'], ['dpad', '滚动']] });
    const sc = (dx, dy) => { const w = $('cxmw'); w.scrollLeft += dx * 180 * Kit.s; w.scrollTop += dy * 162 * Kit.s; };
    return s;
  }

  // ───────── 地形 / 建筑：左边图块，右边大图 + 一句说明 + 关键数字 ─────────
  function terrMore(t) {
    const TT = TR()[t], made = vis().filter(k => UN()[k].from === t), inc = TT.income ? Math.round(TT.income * (((C() || {}).defaultRules || {}).income || 100) / 100) : 0;
    const MT = [['foot', '步兵', 'inf'], ['tread', '履带', 'tnk'], ['wheel', '轮式', 'rec'], ['ship', '舰船', 'dst'], ['air', '航空', 'atk']];
    const html = sec(T('说明'), ps(Kit.terrNote(t, inc))) +
      sec(T('移动消耗'), `<div class="who">${MT.map(([mt, name, rep]) => { const c = Kit.moveCost(mt, t); return `<span class="w1${c ? '' : ' no'}">${Kit.unit(rep, 1, 60)}${c ? c : '✕'}<small>${esc(T(name, null, 'move'))}</small></span>`; }).join('')}</div>`) +
      (made.length ? sec(T('可生产单位'), `<div class="vs mk">${made.map(k => `<span class="v1">${Kit.unit(k, 1, 46)}</span>`).join('')}</div><p>${esc(namesOf(made))}</p>`) : '');
    sfx().ok(); return more(esc(TT.name), html);
  }
  function terrPage(o) {
    const TT = TR(), keys = Object.keys(TT), cats = [['terrain', '地形'], ['prop', '建筑']], keysOf = c => keys.filter(k => !!TT[k].prop === (c === 'prop'));
    let cat = o.terrain && TT[o.terrain] && TT[o.terrain].prop ? 'prop' : 'terrain', cur = '';
    const tabs = () => Kit.tabsHtml(cats.map(c => [c[0], T(c[1], null, 'tab')]), cat);
    const s = page({ id: 'cxTerr', icon: Kit.ic('terrain'), title: T('地形', null, 'tab'), right: tabs(), body: `<div class="cl ug"><div class="ugrid" id="cxgrid"></div></div><div class="cm sco" id="cxcard"></div>`,
      onFocus: b => { if (b.dataset.k && b.dataset.k !== cur) show(b.dataset.k); },
      keys: { lb: () => chCat(), rb: () => chCat(), ok: () => { if (cur) terrMore(cur); }, x: () => { if (cur) terrMore(cur); } },
      hints: [['a', '更多'], ['b', '返回'], ['lbrb', '地形 / 建筑'], ['dpad', '选择']] });
    const wireTabs = () => s.el.querySelectorAll('.ch .ctab').forEach(t => { t.onclick = () => { if (t.dataset.tab !== cat) { cat = t.dataset.tab; sfx().tick(); grid(); } }; });
    function grid(focusK) {
      s.el.querySelector('.cr').innerHTML = tabs(); wireTabs();
      $('cxgrid').innerHTML = keysOf(cat).map(k => `<div class="nav ucell" data-k="${k}">${Kit.terr(k, k === 'hq' ? 1 : 0, 70)}<span>${esc(tname(k))}</span></div>`).join('');
      Kit.hydrate($('cxgrid')); cur = ''; Nav.top().f = null; Nav.focus($('cxgrid').querySelector(`[data-k="${focusK}"]`) || $('cxgrid').firstChild);
    }
    function show(t) {
      cur = t; const X0 = TT[t], own = t === 'hq' ? 1 : 0, made = vis().filter(k => UN()[k].from === t);
      const inc = X0.income ? Math.round(X0.income * (((C() || {}).defaultRules || {}).income || 100) / 100) : 0, a = X0.aura && typeof X0.aura === 'object' ? X0.aura : null;
      const fix = !X0.prop ? '' : t === 'airport' ? T('航空单位') : t === 'port' ? T('舰船') : (t === 'hq' || t === 'city' || t === 'factory') ? T('陆上单位') : T('步兵类');
      const tile = (v, label) => `<div><b>${v}</b><span>${esc(label)}</span></div>`;
      $('cxcard').innerHTML = `<div class="ush"><div class="ust tr">${Kit.terr(t, own, 300)}</div><div class="usi"><div class="nm">${esc(X0.name)}<small>${esc(X0.prop ? T('建筑', null, 'tab') : T('地形', null, 'tab'))}</small></div><p class="ro">${esc(first(Kit.terrNote(t, inc)))}</p>` +
        `<div class="big4">${tile(X0.def ? Kit.stars(X0.def) : '—', T('地形防御'))}${X0.prop ? tile(inc ? Kit.ic('coin', 's') + '+' + inc : '—', T('每回合收入')) : ''}${X0.prop ? tile(made.length ? Kit.unit(made[0], 1, 56) + made.length : '—', T('可生产')) : ''}${X0.prop ? tile(`<em>${esc(fix)}</em>`, T('修理')) : ''}${a && a.atk ? tile(Kit.pct(a.atk), T('范围内攻击')) : ''}${X0.research ? tile(Kit.ic('tech', 's') + '+' + X0.research.pts, T('研究点')) : ''}</div></div></div>`;
      Kit.hydrate($('cxcard'));
    }
    function chCat() { cat = cat === 'prop' ? 'terrain' : 'prop'; sfx().tick(); grid(); }
    wireTabs(); grid(o.terrain); return s;
  }

  // 左边章节列表 + 右边一次一节（科技一览、规则共用）。o：{ id, icon, title, groups: [[组名, [键…]]], item(k) → [图标 html, 名字], render(k) → { icon, title, sub, html, f }, sel }
  function listPage(o) {
    let cur = '';
    const s = page({ id: o.id, cls: 'cxs', icon: o.icon, title: o.title, linear: true,
      body: `<div class="cl" id="cxls">${o.groups.map(([g, ks]) => (g ? `<div class="cg">${esc(g)}</div>` : '') + ks.map(k => { const it = o.item(k); return `<button class="nav cit" data-k="${esc(k)}" style="${it[2] || ''}">${it[0] || ''}<b>${esc(it[1])}</b></button>`; }).join('')).join('')}</div><div class="cm" id="cxsp"></div>`,
      onFocus: b => { if (b.dataset.k != null && b.dataset.k !== cur) show(b.dataset.k); },
      keys: { ok: () => { Nav.move('down'); } }, hints: [['a', o.next || '下一节'], ['b', '返回'], ['ud', '选择']] });
    function show(k) { cur = k; const v = o.render(k), el = $('cxsp'); el.style.cssText = v.f ? Kit.pcs(v.f) : ''; el.innerHTML = `<h2 class="sw">${v.icon || ''}<span>${esc(v.title)}${v.sub ? `<br><small>${esc(v.sub)}</small>` : ''}</span></h2>${Kit.longText(v.html)}`; const lt = el.querySelector('.lt'); lt.classList.add('sw'); Kit.hydrate(el); }
    Kit.hydrate($('cxls')); Nav.top().f = null; Nav.focus($('cxls').querySelector(`[data-k="${o.sel}"]`) || $('cxls').querySelector('.cit')); return s;
  }
  // ───────── 科技一览（只读）：左边选通用 / 各阵营 / 某位指挥官，右边是那棵树的几条科技线，每条三级。读 D.TECH ─────────
  function techPage(o) {
    const TE = arr(D().TECH), LN = D().TECH_LINES || {}, cos = arr(D().COS).filter(c => coSeen(c.id)), F = D().FACTIONS || [];
    const fs = facIds().filter(f => TE.some(t => t.tree === f));
    const itemsOf = k => k === 'common' ? TE.filter(t => t.tree === 'common') : k[0] === 'f' ? TE.filter(t => t.tree === +k.slice(1)) : TE.filter(t => t.tree === 'co' && t.co === k.slice(3));
    const titleOf = k => { if (k === 'common') return [T('通用科技'), T('所有阵营都能研究。'), 0]; if (k[0] === 'f') { const f = +k.slice(1); return [T('{name}科技', { name: F[f] ? F[f].name : '' }), (F[f] && F[f].research ? T('{name}：{text}', { name: F[f].research.name, text: F[f].research.desc }) + ' ' : '') + T('两条科技线的第 3 级只能选一条。'), f]; }
      const c = cos.find(q => q.id === k.slice(3)) || {}; return [T('{name}专属', { name: c.name || '' }), T('第 3 级强化指挥官技能「{name}」。', { name: c.power || '' }), c.faction || 0]; };
    return listPage({ id: 'cxTech', icon: Kit.ic('tech'), title: T('科技', null, 'tab'), sel: o.co ? 'co:' + o.co : o.faction ? 'f' + o.faction : 'common', next: '下一项',
      groups: [[T('通用与阵营'), ['common'].concat(fs.map(f => 'f' + f))]].concat(fs.map(f => [T('{name}指挥官', { name: F[f] ? F[f].name : '' }), cos.filter(c => c.faction === f && TE.some(t => t.co === c.id)).map(c => 'co:' + c.id)]).filter(g => g[1].length)),
      item: k => k === 'common' ? [Kit.ic('tech'), T('通用科技')] : k[0] === 'f' ? [Kit.emblem(+k.slice(1)), facName(+k.slice(1)), Kit.pcs(+k.slice(1))] : (c => [Kit.head(c.id, c.faction, 56), c.name, Kit.pcs(c.faction)])(cos.find(c => c.id === k.slice(3)) || {}),
      render: k => { const its = itemsOf(k), lines = [...new Set(its.map(t => t.line))].sort((a, b) => ((LN[a] || {}).order || 9) - ((LN[b] || {}).order || 9)), [title, sub, f] = titleOf(k);
        return { f, icon: k === 'common' ? Kit.ic('tech') : k[0] === 'f' ? Kit.emblem(f) : Kit.head(k.slice(3), f, 84), title, sub,
          html: lines.map(l => (LN[l] && LN[l].name && k.slice(0, 2) !== 'co' ? `<h3>${esc(LN[l].name)}</h3>` : '') + its.filter(t => t.line === l).sort((a, b) => a.tier - b.tier).map(t => `<div class="ttr"><span class="tv">${t.tier}</span><div><b>${esc(t.name)}<em>${esc(T('{n} 研究点', { n: t.pts }))}</em></b><span>${esc(t.desc || '')}</span></div></div>`).join('')).join('') }; } });
  }

  // ───────── 规则：左边章节，右边一次一节。每章 [标题, [段落…], 图标] ─────────
  function ruleList() {
    const d = D(), U = UN(), TT = TR(), c = C() || {}, all = vis(), tk = Object.keys(TT);
    const R = c.defaultRules || {}, per = R.income || 100;
    const has = k => !!TT[k], tn = k => TT[k].name, un = k => U[k].name;
    const incs = tk.filter(k => TT[k].income), noInc = tk.filter(k => TT[k].prop && !TT[k].income);
    const mult = k => (TT[k].income === true ? 1 : TT[k].income / 100);
    const caps = all.filter(k => U[k].cap), carriers = all.filter(k => U[k].carry);
    const ranged = all.filter(k => U[k].range && U[k].range[1] > 1), lob = ranged.filter(k => U[k].lob), far = ranged.filter(k => U[k].range[0] > 1);
    const half = all.filter(k => U[k].cover != null && U[k].cover > 0 && U[k].cover < 1), zero = all.filter(k => U[k].cover != null && U[k].cover <= 0);
    const reveal = all.filter(k => U[k].reveal), hide = HIDE_T.filter(has).map(tn);
    const fixLand = Kit.join(['hq', 'city', 'factory'].filter(has).map(tn));
    const facs = arr(d.FACTIONS).map((f, i) => [i, f]).filter(x => x[1] && x[1].trait && facIds().includes(x[0]));
    const players = arr(d.PLAYERS).filter(Boolean).slice(0, 4);
    const funds = arr(d.FUNDS).filter(f => !f.only);
    const rules = [];
    // 每一段是一个完整的句子键；按有没有某种建筑 / 兵种分出来的几种说法，各写一个整句
    const add = (t, ls, ic) => { const l = ls.filter(Boolean); if (l.length) rules.push([t, l, ic || 'rules']); };
    add(T('胜负', null, 'tab'), [
      T('一个阵营的司令部被占领，或者全部单位被击毁时，这个阵营败北。只剩一支队伍时，这支队伍获胜。'),
      T('司令部被占领时，败北阵营的单位全部消失，建筑归占领方所有。全部单位被击毁时，这个阵营的建筑全部变为中立。'),
      T('设有天数上限时，到期后先比较各队的收入建筑数，再比较单位总造价。'),
    ], 'flag');
    add(T('收入', null, 'tab'), [
      T('每座收入建筑每回合提供 {n} 资金，在回合开始时获得。这个数值可以在开局设置里调整。', { n: per }),
      incs.length ? T('收入建筑：{list}。', { list: Kit.join(incs.map(k => (mult(k) !== 1 ? T('{name}（×{n}）', { name: tn(k), n: mult(k) }) : tn(k)))) }) : '',
      noInc.length ? T('{list}不提供收入。', { list: Kit.join(noInc.map(tn)) }) : '',
    ], 'coin');
    add(T('占领', null, 'tab'), [
      caps.length ? T('{list}可占领建筑。', { list: namesOf(caps) }) : '',
      T('每座建筑有 20 点占领值，每次占领减去单位当前的 HP。满 HP 的单位需 2 回合完成占领。'),
      T('占领中的单位离开或被击毁时，占领值恢复为 20。不可占领友方的建筑。'),
    ], 'cap');
    add(T('合并', null, 'tab'), [T('把单位移动到同兵种、HP 未满的己方单位所在的格子，选择“合并”。'), T('两个单位的 HP 相加，超过 10 的部分按造价返还资金。'), d.RES ? T('两个单位都是强化单位，合并后才保留强化。') : ''], 'join');
    add(T('伤害', null, 'tab'), [
      T('伤害 =（基础伤害 × 攻击加成 + 运气）× 攻击方 HP 比例 ×（1 − 防御）。基础伤害见“兵种”页的克制。'),
      has('tower') ? T('攻击加成：位于己方{tower} 5 格范围内时 +10%，单位每 1 星 +5%，再加上指挥官的修正。', { tower: tn('tower') }) : T('攻击加成：单位每 1 星 +5%，再加上指挥官的修正。'),
      T('地形防御每 1 星使受到的伤害减少 10%，效果随单位当前 HP 等比降低（5 HP 时减半）；航空单位不享受地形防御。'),
      T('防御加成：单位每 1 星 +5%，再加上指挥官的修正，最高 70%。'),
      half.length ? T('{list}攻击时，目标的地形防御仅部分生效。', { list: namesOf(half) }) : '',
      zero.length ? T('{list}攻击时，无视目标的地形防御。', { list: namesOf(zero) }) : '',
    ], 'sword');
    add(T('反击', null, 'tab'), [
      T('受到相邻敌方单位攻击的单位如果没有被击毁，会反击，伤害按受到攻击后的 HP 计算。'),
      far.length ? T('受到不相邻的敌方单位攻击时不可反击。{list}受到相邻敌方单位攻击时也不可反击。', { list: namesOf(far) }) : T('受到不相邻的敌方单位攻击时不可反击。'),
      T('不可攻击对方兵种的单位也不可反击。'),
      has('fort') ? T('位于己方或中立{fort}的单位，受到的反击伤害减半。', { fort: tn('fort') }) : '',
    ], 'shield');
    add(T('远程', null, 'tab'), [
      ranged.length ? T('射程大于 1 的单位：{list}。', { list: namesOf(ranged) }) : '',
      !ranged.length ? '' : lob.length ? T('远程单位移动后不可攻击，只有不移动时才可以攻击。{list}例外，移动后仍可攻击。', { list: namesOf(lob) }) : T('远程单位移动后不可攻击，只有不移动时才可以攻击。'),
      has('fort') && has('mountain') ? T('{fort}上的远程单位、{mountain}上的步兵类远程单位射程 +1，两者不叠加。', { fort: tn('fort'), mountain: tn('mountain') })
        : has('fort') ? T('{fort}上的远程单位射程 +1，两者不叠加。', { fort: tn('fort') })
        : has('mountain') ? T('{mountain}上的步兵类远程单位射程 +1，两者不叠加。', { mountain: tn('mountain') }) : '',
    ], 'aim');
    add(T('修理', null, 'tab'), [
      T('回合开始时，停留在己方建筑的单位恢复 2 HP，每恢复 1 HP 需支付造价 10% 的资金；资金不足时只恢复 1 HP。'),
      has('airport') && has('port') ? T('车辆在{land}修理，航空单位在{airport}修理，舰船在{port}修理。步兵类单位可在任意己方建筑修理。', { land: fixLand, airport: tn('airport'), port: tn('port') })
        : has('airport') ? T('车辆在{land}修理，航空单位在{airport}修理。步兵类单位可在任意己方建筑修理。', { land: fixLand, airport: tn('airport') })
        : has('port') ? T('车辆在{land}修理，舰船在{port}修理。步兵类单位可在任意己方建筑修理。', { land: fixLand, port: tn('port') })
        : T('车辆在{land}修理。步兵类单位可在任意己方建筑修理。', { land: fixLand }),
      U.rep ? T('与{name}相邻的己方车辆、航空单位、舰船每回合恢复 1 HP（无需支付资金）。', { name: un('rep') }) : '',
      U.mdc ? T('与{name}相邻的己方步兵类单位每回合恢复 2 HP（无需支付资金）。多名{name}的效果不叠加。', { name: un('mdc') }) : '',
      has('hospital') && TT.hospital.note ? T('{name}：{text}', { name: tn('hospital'), text: TT.hospital.note }) : '',
    ], 'fix');
    if (has('tower')) add(tn('tower'), [T('己方雷达塔 5 格范围内的己方单位攻击 +10%。多座雷达塔的效果不叠加。'), T('迷雾开启时，己方雷达塔可看见周围 5 格。'), T('不提供收入。')], 'eye');
    if (has('silo')) add(tn('silo'), [TT.silo.note || T('可占领建筑的兵种进入后可发射一次：指定一格为中心，2 格内所有单位各损失 3 HP。'), T('每座只能使用一次，敌我单位都受影响。运输单位搭载的单位不受影响。')], 'silo');
    add(T('星级', null, 'tab'), [T('每击毁一个敌方单位，星级 +1，最高 3 星。'), T('每 1 星攻击 +5%、防御 +5%。')], 'star');
    if (carriers.length) add(T('运输', null, 'tab'), [
      // 运输兵种有几个算几个：每个兵种一个分句，分句之间用“{a}，{b}”连起来，最后套上句号
      T('{text}。', { text: carriers.map(k => (U[k].carry.kind === 'ground' ? T('{name}可搭载 {n} 个陆上单位', { name: un(k), n: U[k].carry.n }) : T('{name}可搭载 {n} 个步兵类单位', { name: un(k), n: U[k].carry.n }))).reduce((a, b) => T('{a}，{b}', { a, b })) }),
      T('把单位移动到己方运输单位所在的格子就能搭载。友方的运输单位不能搭载己方单位。'),
      T('运输单位移动后选择“卸载”，将搭载的单位放置到相邻且可进入的空格。卸载的单位本回合不可再行动。'),
    ], 'load');
    add(T('指挥官技能', null, 'tab'), [T('攻击和受到攻击都能积累技能槽，积累量按损失的造价计算，受到攻击时是攻击时的 2 倍。'), T('技能槽积满后，可在己方回合发动技能，效果持续至己方下回合开始。'), T('技能仅对己方阵营生效。各指挥官的技能见“指挥官”页。')], 'power');
    add(T('特长与阵营特性', null, 'tab'), [
      T('每位指挥官拥有一项特长，开局即生效。'),
      facs.length ? T('指挥官同时具有所属阵营的特性，与本局军队的颜色无关。') : '',
      ...facs.map(([i, f]) => `<i style="--pcl:${pal(i).h}">${esc(f.name || facName(i))}</i>${esc(f.trait)}`),
    ], 'co');
    if (c.techLines) add(T('科技研究', null, 'tab'), [
      has('hq') && has('lab') ? T('在己方{a}或{b}可以研究科技。', { a: tn('hq'), b: tn('lab') }) : has('hq') || has('lab') ? T('在己方{a}可以研究科技。', { a: tn(has('hq') ? 'hq' : 'lab') }) : T('在己方回合可以研究科技。'),
      T('每个阵营可研究 6 条科技线：通用 3 条、阵营 2 条、指挥官 1 条。每条科技线分 3 级，要按顺序解锁。'),
      T('解锁科技需要研究点。研究点在每回合开始时获得，可以一直攒着。'),
      T('研究点够一项科技所需的点数时，就能在己方回合立即解锁，当回合生效；一回合可以连续解锁多项。'),
      T('研究经费分为{list}{n}档，每回合按所选档位支付资金，获得研究点。', { list: Kit.join(funds.map(f => f.name)), n: funds.length }),
      T('研究点来源：研究经费、己方科研所，以及各阵营的研究方式（见“阵营”页）。'),
      has('lab') && TT.lab.research ? T('每座己方{lab}每回合提供 {pts} 研究点，最多计 {max} 座。', { lab: tn('lab'), pts: TT.lab.research.pts, max: TT.lab.research.max }) : '',
      T('阵营 2 条科技线的第 3 级只能选一条。'),
    ], 'tech');
    if (d.RES && c.oreOf) { const R = d.RES; add(R.name, [
      R.mineText ? T('{name}：{text}。', { name: R.mine, text: R.mineText }) : '',
      T('陆上单位结束移动停留在{shard}上就能拾取，获得 {min}–{max} 份（每个碎片堆在开局时随机决定），这一格变为{pit}。航空单位不拾取。', { shard: R.shard, min: R.shardMin, max: R.shardMax, pit: R.pit || '' }),
      T('击毁敌方的强化单位时，获得它强化价的一半（向上取整）。运输单位搭载的强化单位各自计算。'),
      T('生产时每个兵种都有两种方式：常规生产只需支付资金；强化生产另需支付{res}，单位更强。', { res: R.name }),
      T('强化的效果和所需份数按兵种不同，见“兵种”页。生产列表中按左右键切换。'),
      T('两个单位合并时，只要有一方是强化单位，合并后就是强化单位。双方都是强化单位时，返还其中一个单位的强化价。'),
      T('可以在开局规则里关闭{res}。', { res: R.name }),
    ], 'ore'); }
    add(T('撤回', null, 'tab'), [T('刚生产的单位，在做下一个动作之前可以按取消键撤回，资金和{res}全额返还。', { res: (d.RES && d.RES.name) || '' }), T('单位移动后如果没有遇伏，也没有发现新的敌方单位，可以按取消键撤回这一步。'), T('做了下一个动作之后不能撤回。')], 'wait');
    const mt = has('mountain') ? tn('mountain') : '', hq = has('hq') ? tn('hq') : '', tw = has('tower') ? tn('tower') : '';
    add(T('战争迷雾', null, 'tab'), [
      T('迷雾开启时，只能看见己方和友方的单位、建筑周围的格子。'),
      has('mountain')
        ? (has('hq') && has('tower') ? T('步兵类单位在{mountain}上视野 +3。己方建筑可看见所在的一格，{hq}可看见周围 2 格，{tower}可看见周围 5 格。', { mountain: mt, hq, tower: tw })
          : has('hq') ? T('步兵类单位在{mountain}上视野 +3。己方建筑可看见所在的一格，{hq}可看见周围 2 格。', { mountain: mt, hq })
          : has('tower') ? T('步兵类单位在{mountain}上视野 +3。己方建筑可看见所在的一格，{tower}可看见周围 5 格。', { mountain: mt, tower: tw })
          : T('步兵类单位在{mountain}上视野 +3。己方建筑可看见所在的一格。', { mountain: mt }))
        : (has('hq') && has('tower') ? T('己方建筑可看见所在的一格，{hq}可看见周围 2 格，{tower}可看见周围 5 格。', { hq, tower: tw })
          : has('hq') ? T('己方建筑可看见所在的一格，{hq}可看见周围 2 格。', { hq })
          : has('tower') ? T('己方建筑可看见所在的一格，{tower}可看见周围 5 格。', { tower: tw })
          : T('己方建筑可看见所在的一格。')),
      hide.length ? T('位于{list}的单位（航空单位除外）处于隐蔽状态，只有相邻时才会被发现。', { list: Kit.join(hide) }) : '',
      !U.sub ? '' : U.dst ? T('{sub}在任何位置都只有相邻时才会被发现，{dst}可以在 2 格内发现它。', { sub: un('sub'), dst: un('dst') }) : T('{sub}在任何位置都只有相邻时才会被发现。', { sub: un('sub') }),
      reveal.length ? T('{list}可发现周围 8 格内的隐蔽单位。', { list: namesOf(reveal) }) : '',
      T('只能攻击看得见的目标。移动中遇到没有发现的敌方单位时停止移动（遇伏），这个单位本回合行动结束。'),
    ], 'fog');
    add(T('多阵营与结盟', null, 'tab'), [
      players.length ? T('每张地图有 2–4 个阵营，按{list}的顺序行动。各阵营可以各自为战，也可以结盟组队。', { list: Kit.join(players) }) : T('每张地图有 2–4 个阵营。各阵营可以各自为战，也可以结盟组队。'),
      T('同队阵营不可互相攻击，不可占领友方的建筑。可穿过友方单位所在的格子，但不可停留。'),
      T('迷雾开启时，同队阵营共享视野。'),
      c.lootParams ? T('战利品：三支及以上队伍对战时，击毁敌方单位可立即获得它造价 {pct}% 的资金。', { pct: Math.round(c.lootParams.rate * 100) }) : '',
      c.teamHandicap ? T('人数补偿：队伍的阵营数每比阵营最多的队伍少一个，开局资金 +{n}。', { n: c.teamHandicap.funds }) : '',
    ], 'faction');
    // 黑潮的解锁：条件和进度读 AWCampaignRun.unlockInfo(5)（现成的句子）
    { const dk = darkInfo(), F5 = arr(d.FACTIONS)[5]; if (F5 && F5.hidden && arr(dk.reasons).length) add(T('{name}的解锁', { name: F5.name }), [
      T('{name}阵营、指挥官和精锐兵种要解锁后才能在自由对局中使用。完成下面任意一组条件就能解锁。', { name: F5.name }),
      Kit.unlockHtml(dk, 5),
      dk.open ? T('已解锁。') : '',
    ], 'f5'); }
    return rules;
  }
  function rulesPage() {
    const rules = ruleList();
    return listPage({ id: 'cxRules', icon: Kit.ic('rules'), title: T('规则', null, 'tab'), sel: '0', groups: [['', rules.map((_, i) => String(i))]],
      item: k => [Kit.ic(rules[+k][2]) || Kit.ic('rules'), rules[+k][0]],
      render: k => { const r = rules[+k]; return { icon: Kit.ic(r[2]) || Kit.ic('rules'), title: r[0], html: r[1].map(l => l.startsWith('<div class="ulk"') ? l : `<p>${l.startsWith('<i') ? l : esc(l)}</p>`).join('') }; } });
  }

  // ───────── 档案：战役解锁的条目，一页一份；没解锁的显示“？？？” ─────────
  const FILE_IM = { steel: 'cg/op-02.webp', eye: 'cg/op-01.webp', xuanyuan: 'cg/sc-1_5-xuanyuan.webp', wrench: 'cg/sc-1_5-vow.webp', gate: 'cg/sc-2_3-gate.webp', blackfleet: 'cg/act2-01.webp', moon: 'cg/sc-2_5-moon.webp', candle: 'cg/sc-3_2-candle.webp', coin: 'cg/sc-4_2-xuanzhu.webp', train: 'cg/sc-e1-train.webp', tide: 'cg/sc-e2-flood.webp', promise: 'cg/ed-03.webp' };
  function filesPage(o) {
    const F = FILES() || {}, ids = Object.keys(F), open = filesOpen(), art = root.AWTitleArt && root.AWTitleArt.img ? root.AWTitleArt.img.src : '';
    let i = Math.max(0, o && o.file ? ids.indexOf(o.file) : ids.findIndex(id => open.includes(id)));
    const V = lore({ id: 'cxFiles', keys: { left: () => mv(-1), right: () => mv(1), lb: () => mv(-1), rb: () => mv(1), ok: () => mv(1) },
      hints: [['a', '下一份'], ['b', '返回'], ['lbrb', '翻页'], ['ud', '滚动']] });
    function paint() {
      const id = ids[i], ok = open.includes(id), f = F[id] || {};
      V.set({ pic: ok, bg: ok ? (FILE_IM[id] || art) : '', left: (ok ? '' : `<span class="lkbig">${LOCK}</span>`) + `<span class="pgn">${T('{a}/{b}', { a: i + 1, b: ids.length })}</span><div class="ttl"><small>${esc(T('档案　{a}/{b}', { a: open.length, b: ids.length }))}</small>${ok ? esc(f.title) : esc(T('？？？'))}</div>`,
        top: `<span class="kcw">${Kit.cap('lb')}</span><div class="ctabs">${ids.map((x, k) => `<span class="ctab${k === i ? ' on' : ''}${open.includes(x) ? '' : ' lock'}" data-tab="${k}">${k + 1}</span>`).join('')}</div><span class="kcw">${Kit.cap('rb')}</span>`,
        text: ok ? ps(f.text) : `<p class="mut">${esc(T('推进战役后解锁。'))}</p>` });
      V.q('.lrt').querySelectorAll('.ctab').forEach(t => { t.onclick = () => { if (+t.dataset.tab !== i) { i = +t.dataset.tab; sfx().tick(); paint(); } }; });
    }
    function mv(d) { if (!ids.length) return; i = (i + d + ids.length) % ids.length; sfx().tick(); paint(); }
    paint(); return V.scr;
  }
  // ───────── 画廊：一页一张大图，底下一条缩略图；确定 = 播放。没看过的锁着 ─────────
  function galleryPage() {
    const P = root.AWCGPlayer, list = P ? P.gallery() : [];
    const big = g => { try { const m = /^level:(.+)$/.exec(g.key); if (m) return P.levelArt(m[1]) || g.img; const sh = P.get(g.key).find(x => x.img); return sh ? P.src(sh.img) : g.img; } catch (e) { return g.img; } };
    const s = push({ id: 'cxGal', linear: true, flow: true,
      html: `<div class="gbig" id="cxgb"></div><div class="crumb pn">${esc(T('画廊　{a}/{b}', { a: list.filter(g => g.open).length, b: list.length }))}</div><div class="gcap" id="cxgc"></div><div class="cxgal">${list.map((g, i) => (g.group && g.group !== (list[i - 1] || {}).group ? `<h4 class="gh">${esc(g.group)}</h4>` : '') + `<button class="nav g1${g.open ? '' : ' lock'}" data-i="${i}" style="${g.open && g.img ? `background-image:url('${g.img}')` : ''}"><span>${LOCK}</span></button>`).join('')}</div>`,
      onFocus: b => { const g = list[+b.dataset.i]; if (!g) return; $('cxgb').style.backgroundImage = g.open ? `url('${big(g)}')` : ''; $('cxgb').innerHTML = g.open ? '' : `<span class="lkbig">${LOCK}</span>`; $('cxgc').innerHTML = `${g.open ? esc(g.title) : esc(T('？？？'))}<small>${T('{a}/{b}', { a: +b.dataset.i + 1, b: list.length })}${g.open ? '' : '　' + esc(T('推进战役后解锁'))}</small>`; Kit.paintHints(true); },
      hints: () => { const f = Nav.top() && Nav.top().f, g = f && list[+f.dataset.i]; return [['a', '播放', !(g && g.open)], ['b', '返回'], ['lr', '选择']]; } });
    s.el.querySelectorAll('.g1').forEach(b => { b.onclick = () => { const g = list[+b.dataset.i]; if (!g.open) { sfx().no(); return Kit.note(T('推进战役后解锁')); } sfx().ok(); P.playKey(g.key); }; });
    Nav.top().f = null; Nav.focus(s.el.querySelector('.g1:not(.lock)') || s.el.querySelector('.g1'));
    return s;
  }
  // o：{ page, unit, co, terrain, faction } 直接打开某一页；不给就是首页。对局里从详情卡跳过来时，关掉那一页就回到对局
  X.open = o => {
    if (X.isOpen) return;
    if (o && o.page) { try { go(o.page, o); } catch (e) { console.error(e); } return; }
    home();
  };
  X.close = () => { for (const s of scrs.slice().reverse()) s.close(true); scrs.length = 0; };
  X.pages = PAGES.map(p => p[0]); X.go = go; X.matrix = matrix; X.vs = vsPage; X.rules = ruleList;
  root.AWCodex = X;
})(window);
