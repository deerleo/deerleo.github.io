// 潮汐战线：评分和记录的界面（规则和数据在 rank.js，说明在 tools/RANK-SPEC.md）。
// 这里只有显示：评级徽章、战场页上的记录、结算页的三项分和评级章、图鉴里的“战绩”总览、战役选关页和世界地图上的徽章。
// 别的界面文件里各留一个很小的钩子调过来（window.AWRankUI 不在时什么都不显示）：
//   ui-front.js 选战场 paint() → mapPage；ui-battle.js over() / ui-campaign.js finish() → result；
//   ui-campaign.js list() → levelList；ui-world.js 小卡和据点 → levelBadge / drawPin；codex.js 首页 → overview / homeSub / homePic
(function (root) {
  'use strict';
  const Kit = root.AWKit, R = root.AWRank, D = root.AWData;
  if (!Kit || !R || !D) return;
  const T = Kit.t, esc = Kit.esc, Nav = Kit.Nav;
  const G = () => (root.AWCodex && root.AWCodex.G) || (root.__game && root.__game.G) || null;
  const U = { fast: false, last: null };
  const LVN = ['简单', '普通', '困难'];

  // ───────── 评级徽章 ─────────
  // 图是 Codex 画的（源图 ui-assets/src/rank/，tools/cut-rank.py 切成 ui-assets/rank/*.webp），独立文件、用到才加载。
  // ri：-1 没打过（空槽）、0 C、1 B、2 A、3 S；o.hard：困难难度下拿到的 S（带星的那一枚）；o.cls：xs / s / m / l / xl
  // 形状各不一样（不只靠颜色）：S 十二角金章，A 八角红章，B 圆的钢蓝章，C 盾形铜章，空槽是和 S 同形的凹槽
  const DIR = 'ui-assets/rank/', FILES = ['c', 'b', 'a', 's'];
  const fileOf = (ri, hard) => !(ri >= 0) ? 'none' : (ri === 3 && hard ? 's-hard' : FILES[ri]);
  const srcOf = (ri, hard, big) => DIR + fileOf(ri, hard) + (big ? '' : '-96') + '.webp';
  U.badge = function (ri, o) {
    o = o || {}; const cls = o.cls || 'm', big = cls === 'l' || cls === 'xl', ch = ri >= 0 ? R.RANKS[ri] : '';
    return `<span class="rkb ${cls}${ri >= 0 ? ' r' + ch.toLowerCase() : ' none'}${o.hard && ri === 3 ? ' hard' : ''}" data-rank="${ch}"><img src="${srcOf(ri, o.hard, big)}" alt="${ch}" draggable="false" decoding="async"></span>`;
  };
  const badgeOf = (rec, cls) => U.badge(R.top(rec), { cls, hard: R.hardS(rec) });

  Kit.css(`
  .rkb { position:relative; display:inline-block; flex:none; width:72r; height:72r; vertical-align:middle; } .rkb img { display:block; width:100%; height:100%; object-fit:contain; pointer-events:none; }
  .rkb.xs { width:max(22px,34r); height:max(22px,34r); } .rkb.s { width:max(30px,50r); height:max(30px,50r); } .rkb.l { width:max(64px,120r); height:max(64px,120r); } .rkb.xl { width:max(120px,250r); height:max(120px,250r); }
  .rkb.rs { filter:drop-shadow(0 0 10r rgba(255,208,80,.55)); } .rkb.xs.rs, .rkb.s.rs { filter:drop-shadow(0 0 5r rgba(255,208,80,.6)); }
  /* 数字牌：只展示，凹底 */
  .rkn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2r; min-width:120r; } .rkn b { font-size:max(24px,44r); font-weight:900; line-height:1.05; color:var(--gold2); white-space:nowrap; } .rkn b em { font-style:normal; font-size:.6em; color:var(--mut); } .rkn span { font-size:max(20px,22r); font-weight:700; color:var(--mut); white-space:nowrap; }
  .rkbar { position:relative; display:block; height:18r; min-width:60r; background:rgba(20,6,5,.7); box-shadow:inset 0 0 0 2r rgba(255,226,196,.2); } .rkbar u { position:absolute; left:3r; top:3r; bottom:3r; max-width:calc(100% - 6r); background:linear-gradient(#ffe08a, #f2b632); } .rkbar.full u { background:linear-gradient(#fff6cf, #ffd24a); box-shadow:0 0 10r rgba(255,214,90,.8); }

  /* ───── 战场页：选中这张图的记录 ───── */
  #mpips { flex:none; display:flex; align-items:center; gap:10r; min-height:max(34px,58r); margin-top:8r; max-width:100%; overflow:auto hidden; scrollbar-width:none; padding:6r 6r 0; } #mpips::-webkit-scrollbar { display:none; }
  #mpips .pp { position:relative; flex:none; padding:0 0 10r; cursor:pointer; opacity:.82; } #mpips .pp.on { opacity:1; } #mpips .pp.on::after { content:""; position:absolute; left:10%; right:10%; bottom:0; height:5r; background:var(--sk-cur, #39d6e6); box-shadow:0 0 0 2r #0e1220; }
  #mgrp #mpips { margin:0 0 0 18r; padding:0; min-height:0; overflow:visible; } #mgrp #mpips .pp { padding:0 0 8r; margin-bottom:-8r; }
  #mpips .cnt { flex:none; margin-left:10r; font-size:max(20px,24r); font-weight:800; color:var(--mut); white-space:nowrap; } #mpips .cnt b { color:var(--gold2); }
  .mrow .mid { position:relative; } .mrow .rkc { position:absolute; right:-30r; top:-14r; z-index:2; pointer-events:none; } .mrow .nb .rkc { right:-14r; top:-18r; }
  #mrank { flex:none; display:flex; align-items:center; justify-content:center; gap:14r 34r; flex-wrap:wrap; min-height:max(60px,104r); margin-top:8r; padding:8r 30r; background:linear-gradient(rgba(78,14,11,.3), rgba(44,6,5,.62)), var(--sk-steel, none) center/320% 320% no-repeat #6a1512; box-shadow:inset 0 0 0 3r #2a0806, inset 0 0 0 5r rgba(255,226,196,.2), 0 6r 0 rgba(10,4,4,.4); }
  #mrank .none { font-size:max(20px,28r); color:#e6cfc0; font-weight:800; }
  body.narrow #mrank { gap:8r 18r; padding:8r 10r; } body.narrow #mrank .rkn { min-width:0; }
  body.small:not(.narrow) #mrank { min-height:0; padding:2r 20r; } body.small:not(.narrow) #mpips { display:none; }

  /* ───── 结算页：三项分一条条涨上来，最后盖章 ───── */
  .rkres { position:relative; align-self:stretch; display:flex; align-items:center; gap:30r; padding:30r 40r 32r; border:0 solid transparent; border-image:var(--sk-fr, none) 96 / 40r / 0 round; background:linear-gradient(rgba(78,14,11,.3), rgba(44,6,5,.62)), var(--sk-steel, none) center/320% 320% no-repeat #6a1512; filter:drop-shadow(0 8r 0 rgba(10,4,4,.45)); }
  .rkres .rkbar { background:rgba(40,8,6,.7); }
  .rkres .rows { flex:1; min-width:0; display:grid; grid-template-columns:auto minmax(120r, 1fr) auto; align-items:center; gap:8r 18r; font-size:max(20px,30r); font-weight:900; }
  .rkres .rows > span { color:var(--sk-cream, #fff0d6); white-space:nowrap; } .rkres .rows > b { min-width:2.4em; text-align:right; font-size:max(24px,40r); color:var(--gold2); } .rkres .rows .rkbar { height:24r; }
  .rkmore { display:inline-flex; align-items:center; gap:8r; min-height:max(34px,46r); padding:0 20r 3r; font-size:max(20px,24r); font-weight:900; color:var(--sk-cream, #fff0d6); border:0 solid transparent; border-image:var(--sk-cr, none) 32 32 38 32 fill / 16r 16r 19r 16r / 0 stretch; cursor:pointer; text-shadow:0 2r 0 rgba(40,6,4,.7); } .rkmore:hover { filter:brightness(1.15); }
  .rkdet { display:none; position:absolute; left:26r; right:26r; top:22r; bottom:24r; z-index:3; flex-direction:column; justify-content:center; gap:14r; padding:20r 34r; background:linear-gradient(#f1e3bd, #dfca99); box-shadow:inset 0 0 0 3r #6a4a22, inset 0 0 46r rgba(130,86,30,.32), 0 7r 0 rgba(20,4,4,.4); color:#2e1a10; font-size:max(20px,28r); font-weight:800; line-height:1.3; cursor:pointer; } .rkres.more .rkdet { display:flex; }
  .rkdet p { margin:0; display:flex; gap:18r; } .rkdet p b { flex:none; color:#8a1f14; font-weight:900; }
  .rknote { display:flex; align-items:center; flex-wrap:wrap; gap:8r 16r; } .rknote .why { display:none; flex:1 1 100%; margin:0; padding:12r 20r; background:linear-gradient(#f1e3bd, #dfca99); box-shadow:inset 0 0 0 3r #6a4a22; color:#2e1a10; font-weight:800; } .rknote.more .why { display:block; } .rkres .rows .sum { grid-column:1 / -1; display:flex; align-items:baseline; justify-content:flex-end; gap:12r; padding-top:6r; border-top:3r solid rgba(255,226,196,.2); }
  .rkres .rows .sum span { color:var(--mut); font-size:max(20px,26r); } .rkres .rows .sum b { font-size:max(30px,58r); color:#fff; line-height:1; } .rkres .rows .sum em { font-style:normal; color:var(--mut); font-size:max(20px,24r); }
  .rkres .rr { opacity:.25; transition:opacity .2s; } .rkres .rr.on { opacity:1; }
  .rkres .stp { position:relative; flex:none; width:max(120px,250r); height:max(120px,250r); display:flex; align-items:center; justify-content:center; }
  .rkres .stp .slot { position:absolute; inset:0; } .rkres .stp .slot .rkb { width:100%; height:100%; }
  .rkres .stp .in { position:absolute; inset:0; opacity:0; transform:scale(3.2) rotate(-24deg); } .rkres .stp .in .rkb { width:100%; height:100%; }
  .rkres.done .stp .in { opacity:1; transform:scale(1) rotate(-8deg); transition:transform .22s cubic-bezier(.3,1.6,.5,1), opacity .08s; } .rkres.fast .stp .in { transition:none; }
  .rkres .new { position:absolute; right:-14r; top:-6r; z-index:2; padding:16r 44r 20r; font-size:max(20px,30r); font-weight:900; font-style:italic; color:#fff; text-shadow:0 3r 0 rgba(60,8,4,.8); background:url(ui-assets/rank/tag.webp) center/100% 100% no-repeat; filter:drop-shadow(0 6r 0 rgba(0,0,0,.4)); transform:rotate(6deg) scale(0); white-space:nowrap; }
  .rkres.done .new.on { transform:rotate(6deg) scale(1); transition:transform .25s .35s cubic-bezier(.3,1.7,.5,1); } .rkres.fast .new.on { transition:none; }
  .rkres .newl { display:flex; align-items:center; justify-content:flex-end; gap:16r; } .rkres .newl { grid-column:1 / -1; font-size:max(20px,22r); font-weight:800; color:var(--gold2); text-align:right; }
  .rknote { align-self:flex-start; font-size:max(20px,24r); font-weight:700; color:var(--mut); }
  @keyframes rkShake { 0% { transform:translate(0,0); } 25% { transform:translate(-7r,5r); } 50% { transform:translate(6r,-4r); } 75% { transform:translate(-3r,2r); } 100% { transform:none; } } .rkres.hit { animation:rkShake .22s linear; }
  .over.rk .rt { gap:10r; } .over.rk .tiles .tile { padding:4r 18r; } .over.rk .tiles .tile b { font-size:max(22px,36r); } .over.rk:not(.cpres) .big { font-size:max(60px,120r); } .over.rk:not(.cpres) .q { display:none; } .over.rk.cpres .big { font-size:max(50px,130r) !important; }
  body.narrow .rkres { gap:14r; padding:26r 28r; } body.narrow .over .rt { align-self:stretch; }
  body.small:not(.narrow) .rkres { padding:20r 30r; gap:14r; border-image-width:26r; } body.small:not(.narrow) .rkres .rows { gap:0 12r; } body.small:not(.narrow) .rkres .stp { width:110px; height:110px; }
  body.small:not(.narrow) .over.rk .tiles, body.small:not(.narrow) .over.rk .q { display:none; } body.small:not(.narrow) .over.rk .big { font-size:max(40px,120r) !important; } body.small:not(.narrow) .over.rk .rt { gap:8r; }

  /* ───── 战役：选关页、世界地图小卡上的徽章 ───── */
  .cplv { position:relative; } .cplv .rkc { position:absolute; right:10r; bottom:12r; z-index:2; pointer-events:none; } #wcard .no .rkb { margin-left:auto; } #wcard .no { gap:10r; }

  /* ───── 战绩总览（图鉴 → 战绩） ───── */
  .rko { flex:1; min-width:0; min-height:0; display:flex; flex-direction:column; gap:14r; padding:16r 22r 10r; }
  .rkp { flex:none; display:grid; grid-template-columns:repeat(4, 1fr); gap:14r; }
  .rkp > div { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:2r 14r; padding:10r 18r 12r; background:rgba(52,14,11,.62); box-shadow:inset 0 0 0 2r rgba(255,225,200,.2), inset 0 6r 0 rgba(30,6,4,.35); }
  .rkp .rkb { grid-row:1 / 3; } .rkp span { font-size:max(20px,24r); font-weight:800; color:var(--mut); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .rkp b { font-size:max(26px,46r); font-weight:900; line-height:1; color:var(--gold2); white-space:nowrap; } .rkp b em { font-style:normal; font-size:.55em; color:var(--mut); margin-left:6r; }
  .rkp .rkbar { grid-column:1 / -1; margin-top:6r; height:14r; } .rkp > div.all b { color:#fff; text-shadow:0 0 14r rgba(255,214,90,.9); }
  .rkt { flex:1; min-height:0; overflow:auto; scrollbar-width:none; } .rkt::-webkit-scrollbar { display:none; }
  .rkg { margin:12r 0 6r; font-size:max(20px,26r); font-weight:900; color:var(--gold2); display:flex; align-items:center; gap:14r; } .rkg:first-child { margin-top:0; } .rkg small { font-size:max(20px,22r); font-weight:700; color:var(--mut); } .rkg::after { content:""; flex:1; height:3r; background:rgba(255,226,196,.18); }
  .rkrow { display:grid; grid-template-columns:76r minmax(0, 1.5fr) 150r 170r 250r 230r 190r; align-items:center; gap:0 16r; min-height:max(52px,84r); padding:4r 14r; border-bottom:2r solid rgba(40,8,6,.55); } .rkrow:nth-child(even) { background:rgba(40,8,6,.18); }
  .rkrow.hh { min-height:0; padding-top:0; padding-bottom:6r; position:sticky; top:0; z-index:2; background:#6a261f; font-size:max(20px,22r); font-weight:800; color:var(--mut); border-bottom:3r solid rgba(40,8,6,.8); } .rkrow.hh > * { text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .rkrow.hh > :nth-child(2) { text-align:left; }
  .rkrow .nm { min-width:0; display:flex; flex-direction:column; } .rkrow .nm b { font-size:max(22px,34r); font-weight:900; color:var(--sk-cream, #fff0d6); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .rkrow .nm small { font-size:max(20px,20r); font-weight:700; color:var(--mut); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rkrow .v { text-align:center; font-size:max(22px,36r); font-weight:900; color:var(--gold2); white-space:nowrap; } .rkrow .v em { font-style:normal; font-size:.62em; color:var(--mut); margin-left:4r; } .rkrow .v.no { color:rgba(255,226,196,.28); }
  .rkrow .t3 { display:flex; justify-content:center; gap:12r; font-size:max(20px,24r); font-weight:900; color:var(--txt); } .rkrow .t3 i { font-style:normal; min-width:2em; text-align:center; } .rkrow .t3 i.no { color:rgba(255,226,196,.28); } .rkrow .t3 i.full { color:var(--gold2); }
  .rkrow .l3 { display:flex; justify-content:center; gap:14r; } .rkrow.hh .t3 { font-size:inherit; font-weight:inherit; color:inherit; } .rkrow.hh .t3 i { min-width:2.4em; } .rkrow.hh .l3 i { font-style:normal; min-width:max(30px,50r); text-align:center; } .rkrow .cs1 { display:flex; flex-direction:column; gap:4r; align-items:stretch; font-size:max(20px,24r); font-weight:900; text-align:center; color:var(--txt); } .rkrow .cs1 em { font-style:normal; color:var(--mut); font-size:.8em; }
  .rkrow.lock .nm b { color:rgba(255,226,196,.4); }
  /* 指挥官表：一行一张地图，一列一位指挥官 */
  .rkm { border-collapse:separate; border-spacing:0; } .rkm th, .rkm td { padding:5r 4r; text-align:center; border-bottom:2r solid rgba(40,8,6,.55); } .rkm th { position:sticky; top:0; z-index:2; background:#6a261f; padding-bottom:8r; } .rkm th .hd { width:max(34px,58r); height:max(34px,58r); display:block; margin:0 auto; }
  .rkm td:first-child, .rkm th:first-child { position:sticky; left:0; z-index:1; background:#6a261f; text-align:left; padding:0 16r 0 6r; white-space:nowrap; font-size:max(20px,28r); font-weight:900; color:var(--sk-cream, #fff0d6); } .rkm th:first-child { z-index:3; font-size:max(20px,22r); color:var(--mut); }
  .rkm td.n { font-size:max(20px,24r); font-weight:900; color:var(--gold2); padding:0 10r; white-space:nowrap; } .rkm td.n em { font-style:normal; color:var(--mut); font-size:.8em; } .rkm th.q { font-size:max(22px,36r); font-weight:900; color:rgba(255,226,196,.4); }
  body.narrow .rko { padding:10r 6r 4r; gap:10r; } body.narrow .rkp { grid-template-columns:repeat(2, 1fr); gap:8r; } body.narrow .rkp > div { padding:6r 10r 8r; } body.narrow .rkp span { white-space:normal; line-height:1.1; } body.narrow .rkrow.hh > * { white-space:normal; line-height:1.1; } body.narrow .rkrow.hh .l3 { gap:6r; }
  body.narrow .rkrow { grid-template-columns:64r minmax(0, 1fr) 110r 130r 150r; gap:0 8r; padding:4r 6r; } body.narrow .rkrow > .t3, body.narrow .rkrow > .cs1, body.narrow .rkrow.hh > :nth-child(5), body.narrow .rkrow.hh > :nth-child(7) { display:none; } body.narrow .rkrow .l3 { gap:6r; }
  body.small:not(.narrow) .rko { padding:4r 10r 0; gap:6r; } body.small:not(.narrow) .rkp > div { padding:2r 12r 4r; } body.small:not(.narrow) .rkp .rkbar { display:none; } body.small:not(.narrow) .rkp .rkb { width:max(30px,50r); height:max(30px,50r); }
  body.small:not(.narrow) .rkrow { grid-template-columns:64r minmax(0, 1.2fr) 130r 150r 200r 190r; } body.small:not(.narrow) .rkrow > .t3, body.small:not(.narrow) .rkrow.hh > :nth-child(5) { display:none; }
  /* 图鉴首页的“战绩”牌子 */
  .cxt .im.rk { background:radial-gradient(circle at 50% 38%, #a8412f, #4a1712 72%); padding-bottom:90r; gap:0; } .cxt .im.rk .rkb { width:104r; height:104r; } .cxt .im.rk .rkb + .rkb { margin-left:-22r; } .cxt .im.rk .rkb:nth-child(2) { width:156r; height:156r; z-index:1; }
  `);

  // ───────── 公共 ─────────
  const freeMaps = () => (D.MAPS || []).filter(m => !m.campaign && !m.test);
  const cosAll = () => (D.COS || []).filter(c => !c.mod);
  const levels = () => { const A = root.AWCampaign; return (A && A.levels ? A.levels : []).filter(l => !(l.map && l.map.need)); };
  const progress = () => R.progress(freeMaps().map(m => m.name), cosAll().map(c => c.id), levels().map(l => l.id));
  const coS = rec => rec ? cosAll().filter(c => rec.cos[c.id] && rec.cos[c.id][0] === 3).length : 0;
  const bar = (a, b) => `<i class="rkbar${b > 0 && a >= b ? ' full' : ''}"><u style="width:${b > 0 ? Math.round(Math.min(1, a / b) * 100) : 0}%"></u></i>`;
  const num = (v, label, sub) => `<div class="rkn"><b>${v}${sub ? `<em>${sub}</em>` : ''}</b><span>${esc(label)}</span></div>`;
  U.progress = progress;

  // ───────── 战场页（ui-front.js 的 stepMap → paint 每次重画后调）─────────
  // o：{ el 这一页, i 选中的地图下标, order 列表里全部地图的下标, go(下标) 跳到那张图 }
  U.mapPage = function (o) {
    try {
      const el = o.el, def = D.MAPS[o.i], rec = R.record('map', def.name), g = G();
      const row = el.querySelector('#mrow'), blurb = el.querySelector('#mblurb'), grp = el.querySelector('#mgrp');
      if (!row || !blurb) return;
      // 三张预览图的右上角：最高评级（没打过是空槽）
      row.querySelectorAll('.mid, .nb').forEach(b => { const cv = b.querySelector('canvas'), j = cv ? +cv.dataset.i : -1, m = D.MAPS[j]; if (!m) return; const old = b.querySelector('.rkc'); if (old) old.remove(); const s = document.createElement('span'); s.className = 'rkc'; s.innerHTML = badgeOf(R.record('map', m.name), b.classList.contains('mid') ? 'l' : 'm'); b.appendChild(s); });
      // 这一组全部地图的小徽章：一眼看到哪几张还空着，点一下跳过去
      let pips = el.querySelector('#mpips');
      // 宽屏：接在分组页签那一行后面（那一行每次重画都会清空，所以每次重新放进去）；手机竖屏：页签下面单独一行
      let fresh = false; const wide = !Kit.narrow;
      if (pips && (pips.parentNode === grp) !== wide) { pips.remove(); pips = null; }
      if (!pips) { pips = document.createElement('div'); pips.id = 'mpips'; if (wide) grp.appendChild(pips); else { grp.parentNode.insertBefore(pips, grp.nextSibling); fresh = true; } }
      const grpOf = m => (g && g.mapGroup ? g.mapGroup(m) : 0), inG = o.order.filter(j => grpOf(D.MAPS[j]) === grpOf(def));
      const P = progress();
      pips.innerHTML = inG.map(j => `<span class="pp${j === o.i ? ' on' : ''}" data-j="${j}" title="${esc(T(D.MAPS[j].name, null, 'map'))}">${badgeOf(R.record('map', D.MAPS[j].name), 's')}</span>`).join('') +
        `<span class="cnt">${esc(T('S 评价'))} <b>${P.s}</b>/${P.maps}</span>`;
      pips.querySelectorAll('.pp').forEach(p => { p.onclick = () => { if (+p.dataset.j !== o.i && o.go) o.go(+p.dataset.j); }; });
      const on = pips.querySelector('.pp.on'); if (on && on.scrollIntoView) { try { pips.scrollLeft = Math.max(0, on.offsetLeft - pips.clientWidth / 2); } catch (e) { } }
      // 选中这张图的记录
      let box = el.querySelector('#mrank');
      if (!box) { box = document.createElement('div'); box.id = 'mrank'; blurb.parentNode.insertBefore(box, blurb); fresh = true; }
      const par = R.parOfMap(def.name), nCo = cosAll().length;
      // 只留一眼能懂的：徽章、最高分、最少天数、拿过 S 的指挥官。三项最好成绩、各难度的评级在图鉴的“战绩”里看
      if (!rec) box.innerHTML = `${U.badge(-1, { cls: 'l' })}<span class="none">${esc(T('还没有记录'))}</span>${num(par, T('标准天数'))}`;
      else {
        const b = rec.best;
        box.innerHTML = `${badgeOf(rec, 'l')}${num(b.total, T('最高分'), '/300')}${num(rec.days, T('最少天数'), '/' + par)}${num(coS(rec), T('获得 S 评价的指挥官'), '/' + nCo)}`;
      }
      if (fresh && o.again) o.again();
    } catch (e) { console.error(e); }
  };

  // ───────── 结算页（自由对局 ui-battle.js over()、战役 ui-campaign.js finish()）─────────
  // host：结算页右边那一栏；o：{ S, human: 数组（下标 = 席位）, lost }。只有玩家赢了电脑才出现；不计分时写一行原因
  const WHY = { humans: '只有一名玩家对战电脑的对局才评分。', days: '按天数上限判定的胜利不评分。', mods: '启用了改变规则的扩展，这一局不评分。', rules: '开局资金、建筑收入、人数补偿使用这张地图的默认设置时才评分。', teams: '队伍使用这张地图的默认分法时才评分。', nostat: '这份存档来自旧版本，这一局不评分。' };
  function detail(box) {
    const tog = () => { box.classList.toggle('more'); try { ((G() && G().sfx) || Kit.sfx).tick(); } catch (e) { } };
    box.querySelectorAll('.rkmore, .rkdet').forEach(b => { b.onclick = e => { e.stopPropagation(); tog(); }; });
    const top = Nav.top(); if (!top || !top.el.contains(box)) return;
    const h0 = top.hints; top.keys = Object.assign({}, top.keys, { x: tog });
    top.hints = () => { const h = typeof h0 === 'function' ? h0() : (h0 || []); return h.concat([['x', '详情']]); };
    Kit.paintHints(true);
  }
  U.result = function (host, o) {
    try {
      U.last = null;
      const S = o.S; if (!host || !S || o.lost) return null;
      const j = R.judge(S, o.human);
      if (!j.ok) { U.last = { judge: j }; if (j.why === 'lost' || !(o.human || []).some(Boolean)) return null; if (!WHY[j.why]) return null;
        const n = document.createElement('div'); n.className = 'rknote'; n.innerHTML = `<span>${esc(T('这一局不评分'))}</span><button class="rkmore" type="button">${Kit.cap('x')}${esc(T('详情'))}</button><p class="why">${esc(T(WHY[j.why]))}</p>`; host.appendChild(n);
        detail(n); return null; }
      // 一局只记一次（结算页可能重画）
      let sub = S.rk.sent || null;
      if (!sub) { sub = R.submit(j); S.rk.sent = { isNew: sub.isNew, rec: sub.rec }; }
      U.last = { judge: j, isNew: sub.isNew };
      const N = sub.isNew || {}, news = [];
      if (N.total && !N.first) news.push(T('最高分')); if (N.days && !N.first) news.push(T('最少天数')); if (N.co && !N.first && j.ri === 3) news.push(T('这位指挥官首次获得 S 评价')); if (N.hard) news.push(T('在困难难度获得 S 评价'));
      if (j.ri < 3) news.push(T('距离 S 评价还差 {n} 分', { n: R.K.S - j.total }));
      const isNew = !!(N.first || N.total || N.rank || N.days || N.hard);
      const fast = U.fast || !!(G() && G().DEMO), hard = j.ri === 3 && j.lvI === 2;
      const box = document.createElement('div'); box.className = 'rkres' + (fast ? ' fast' : ''); const dl = [];
      const rowH = (k, name, val, sub) => { dl.push([name, sub]); return rowH0(k, name, val); };
      const rowH0 = (k, name, val) => `<span class="rr" data-k="${k}">${esc(name)}</span><i class="rkbar rr" data-k="${k}"><u style="width:0%"></u></i><b class="rr" data-k="${k}" data-v="${val}">0</b>`;
      box.innerHTML = `<div class="rows">` +
        rowH('speed', T('速度'), j.speed, T('第 {d} 天获胜，标准天数 {p} 天', { d: j.days, p: j.par })) +
        rowH('power', T('火力'), j.power, T('击毁敌方单位造价 {a}，己方全部单位造价 {b}', { a: j.kill, b: j.put })) +
        rowH('tech', T('技术'), j.tech, T('己方被击毁 {n} 个单位，造价 {a}', { n: j.lostN, a: j.lost })) +
        `<div class="sum rr" data-k="sum"><span>${esc(T('总分'))}</span><b data-v="${j.total}">0</b><em>/ 300</em></div><div class="newl"><span>${esc(news.join(' · '))}</span><button class="rkmore" type="button">${Kit.cap('x')}${esc(T('详情'))}</button></div></div>` +
        `<div class="stp"><div class="slot">${U.badge(-1, { cls: 'xl' })}</div><div class="in">${U.badge(j.ri, { cls: 'xl', hard })}</div></div>` +
        `<div class="new${isNew ? ' on' : ''}">${esc(N.first ? T('第一次评级') : T('新纪录'))}</div>`;
      // 详情：每一项是怎么算出来的。默认收着，X 键 / 点“详情”打开，再按一次或点一下收起
      const det = document.createElement('div'); det.className = 'rkdet'; det.innerHTML = dl.map(([a, b]) => `<p><b>${esc(a)}</b>${esc(b)}</p>`).join(''); box.appendChild(det);
      const tiles = host.querySelector('.tiles'); if (tiles && tiles.nextSibling) host.insertBefore(box, tiles.nextSibling); else host.appendChild(box);
      const scr = host.closest('.scr'); if (scr) scr.classList.add('rk');
      detail(box);
      const sfx = (G() && G().sfx) || Kit.sfx, alive = () => box.isConnected;
      const setRow = (k, f) => { const b = box.querySelector(`b[data-k="${k}"], .sum[data-k="${k}"] b`), v = +b.dataset.v, u = box.querySelector(`.rkbar[data-k="${k}"] u`); b.textContent = Math.round(v * f); if (u) { u.style.width = Math.round(v * f) + '%'; if (f >= 1 && v >= 100) u.parentNode.classList.add('full'); } };
      const show = k => box.querySelectorAll(`[data-k="${k}"]`).forEach(e => e.classList.add('on'));
      const finish = () => { ['speed', 'power', 'tech', 'sum'].forEach(k => { show(k); setRow(k, 1); }); box.classList.add('done'); };
      if (fast) { finish(); return j; }
      const run = (k, ms) => new Promise(res => { show(k); const t0 = performance.now(); let lastTick = 0; const step = t => { if (!alive()) return res(); const f = Math.min(1, (t - t0) / ms); setRow(k, f); if (t - lastTick > 70 && f < 1) { lastTick = t; try { sfx.tick(); } catch (e) { } } if (f < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      const wait = ms => new Promise(r => setTimeout(r, ms));
      (async () => {
        await wait(500);
        for (const k of ['speed', 'power', 'tech']) { await run(k, 620); await wait(160); }
        await run('sum', 500); await wait(320); if (!alive()) return;
        box.classList.add('done'); await wait(200); if (!alive()) return;
        box.classList.add('hit'); try { (sfx.cap || sfx.ok)(); } catch (e) { }
      })();
      return j;
    } catch (e) { console.error(e); return null; }
  };

  // ───────── 战役：选关页、世界地图 ─────────
  U.levelBadge = (id, cls) => { const rec = R.record('camp', id); return rec ? badgeOf(rec, cls || 's') : ''; };
  U.levelList = function (el) {
    try { el.querySelectorAll('.cplv[data-id]').forEach(b => { if (b.classList.contains('lock') || b.querySelector('.rkc')) return; const s = document.createElement('span'); s.className = 'rkc'; s.innerHTML = badgeOf(R.record('camp', b.dataset.id), 'm'); b.appendChild(s); }); } catch (e) { console.error(e); }
  };
  // 世界地图据点右上角的小圆章（画在画布上）
  const pinImg = {};
  U.drawPin = function (c, x, y, r, id) {
    try {
      const rec = R.record('camp', id); if (!rec) return; const ri = R.top(rec); if (ri < 0) return;
      const src = srcOf(ri, R.hardS(rec), false); let im = pinImg[src];
      if (!im) { im = pinImg[src] = new Image(); im.onload = () => { try { Kit.wake(); } catch (e) { } }; im.src = src; }
      if (!im.complete || !im.naturalWidth) return;
      const q = Math.max(22, r * 1.7); c.drawImage(im, x + r * 0.95 - q / 2, y - r * 0.95 - q / 2, q, q);
    } catch (e) { }
  };

  // ───────── 图鉴首页的牌子 ─────────
  U.homeSub = () => { const P = progress(); return T('S 评价 {a}/{b}', { a: P.s, b: P.maps }); };
  U.homePic = () => `<div class="im rk">${U.badge(2, { cls: 'l' })}${U.badge(3, { cls: 'l' })}${U.badge(1, { cls: 'l' })}</div>`;

  // ───────── 战绩总览 ─────────
  U.overview = function (o) {
    o = o || {};
    const g = G(), tabs = [['map', T('地图')], ['co', T('指挥官')]].concat(levels().length ? [['camp', T('战役')]] : []);
    let tab = tabs.some(t => t[0] === o.tab) ? o.tab : 'map';
    const sfx = (g && g.sfx) || Kit.sfx;
    const GN = ['小型', '中型', '大型', '多阵营'], grpOf = m => (g && g.mapGroup ? g.mapGroup(m) : 0);
    const n = v => v == null ? '–' : v;
    const coOpen = id => { try { const Rn = root.AWCampaignRun, c = D.COS.find(q => q.id === id), F = c && D.FACTIONS && D.FACTIONS[c.faction]; if (!F || !F.hidden) return true; return !!(Rn && Rn.unlockedCos && Rn.unlockedCos().includes(id)); } catch (e) { return true; } };
    const lvOpen = id => { try { return !g || !g.camp || g.camp.levelOpen(id); } catch (e) { return true; } };
    function top() {
      const P = progress(), blk = (ri, hard, label, a, b) => `<div class="${b > 0 && a >= b ? 'all' : ''}">${U.badge(a > 0 ? ri : -1, { cls: 'm', hard: hard && a > 0 })}<span>${esc(label)}</span><b>${a}<em>/ ${b}</em></b>${bar(a, b)}</div>`;
      return `<div class="rkp">${blk(3, false, T('S 评价的地图'), P.s, P.maps)}${blk(3, true, T('困难难度 S 的地图'), P.hardS, P.maps)}${blk(3, false, T('全部地图全部指挥官 S'), P.coS, P.cells)}${P.levels ? blk(3, false, T('S 评价的战役关卡'), P.campS, P.levels) : blk(0, false, T('完成过对局的地图'), P.played, P.maps)}</div>`;
    }
    const H3 = `<span class="t3">${['速度', '火力', '技术'].map(x => `<i>${esc(T(x))}</i>`).join('')}</span>`;
    const three = rec => `<div class="t3">${['speed', 'power', 'tech'].map(k => `<i class="${!rec ? 'no' : rec[k] >= 100 ? 'full' : ''}">${rec ? rec[k] : '–'}</i>`).join('')}</div>`;
    function row(kind, key, name, sub, par, open) {
      const rec = open ? R.record(kind, key) : null, b = rec && rec.best;
      return `<div class="rkrow${open ? '' : ' lock'}" data-key="${esc(key)}">${badgeOf(rec, 'm')}<div class="nm"><b>${esc(name)}</b><small>${esc(sub)}</small></div>` +
        `<div class="v${b ? '' : ' no'}">${b ? b.total : '–'}</div><div class="v${rec ? '' : ' no'}">${rec ? rec.days : '–'}<em>/ ${n(par || '–')}</em></div>${three(rec)}` +
        (kind === 'camp' ? '' : `<div class="l3">${[0, 1, 2].map(i => U.badge(rec ? rec.lv[i] : -1, { cls: 's', hard: i === 2 && rec && rec.lv[2] === 3 })).join('')}</div><div class="cs1"><span>${coS(rec)}<em> / ${cosAll().length}</em></span>${bar(coS(rec), cosAll().length)}</div>`) + `</div>`;
    }
    function mapTab() {
      const ms = freeMaps(), hd = `<div class="rkrow hh"><span></span><span>${esc(T('地图'))}</span><span>${esc(T('最高分'))}</span><span>${esc(T('最少天数 / 标准'))}</span>${H3}<span class="l3">${LVN.map(x => `<i>${esc(T(x, null, 'diff'))}</i>`).join('')}</span><span>${esc(T('获得 S 评价的指挥官'))}</span></div>`;
      let h = hd;
      for (let k = 0; k < 4; k++) { const inG = ms.filter(m => grpOf(m) === k); if (!inG.length) continue;
        h += `<div class="rkg">${esc(T(GN[k], null, 'size'))}<small>${esc(T('S 评价 {a}/{b}', { a: inG.filter(m => R.top(R.record('map', m.name)) === 3).length, b: inG.length }))}</small></div>`;
        for (const m of inG) { const d = g && g.mapDims ? g.mapDims(m) : null, np = m.players || 2; h += row('map', m.name, T(m.name, null, 'map'), (d ? d.w + '×' + d.h + '　' : '') + (['', '', T('1v1'), T('3 人混战'), T('4 人混战')][np] || ''), R.parOfMap(m.name), true); } }
      return h;
    }
    function coTab() {
      const ms = freeMaps(), cs = cosAll();
      return `<table class="rkm"><tr><th>${esc(T('地图 ＼ 指挥官'))}</th><th></th>${cs.map(c => coOpen(c.id) ? `<th title="${esc(c.name)}">${Kit.head(c.id, c.faction, 0)}</th>` : `<th class="q">?</th>`).join('')}</tr>` +
        ms.map(m => { const rec = R.record('map', m.name); return `<tr><td>${esc(T(m.name, null, 'map'))}</td><td class="n">${coS(rec)}<em>/${cs.length}</em></td>${cs.map(c => { const e = rec && rec.cos[c.id]; return `<td>${U.badge(e ? e[0] : -1, { cls: 'xs', hard: e && e[0] === 3 && e[1] === 2 })}</td>`; }).join('')}</tr>`; }).join('') + `</table>`;
    }
    function campTab() {
      const A = root.AWCampaign, ls = levels(); let h = `<div class="rkrow hh"><span></span><span>${esc(T('关卡'))}</span><span>${esc(T('最高分'))}</span><span>${esc(T('最少天数 / 标准'))}</span>${H3}<span></span><span></span></div>`;
      for (const a of (A && A.acts) || [{ id: null, name: '' }]) { const inA = ls.filter(l => a.id == null || l.act === a.id); if (!inA.length) continue;
        h += `<div class="rkg">${esc(a.name || '')}<small>${esc(T('S 评价 {a}/{b}', { a: inA.filter(l => R.top(R.record('camp', l.id)) === 3).length, b: inA.length }))}</small></div>`;
        for (const l of inA) { const op = lvOpen(l.id); h += row('camp', l.id, op ? l.no + '　' + l.title : l.no + '　' + T('？？？'), op ? (l.where || '') : T('通关上一关后解锁'), R.parOfLevel(l.id), op); } }
      return h;
    }
    const scr = Kit.page({ id: 'cxRank', icon: Kit.ic('codex'), title: T('战绩'), right: Kit.tabsHtml(tabs, tab),
      body: `<div class="rko"><div id="rkTop"></div><div class="rkt sc" id="rkT"></div></div>`,
      keys: { lb: () => mv(-1), rb: () => mv(1), ok: () => mv(1), up: () => sc(0, -1), down: () => sc(0, 1), left: () => sc(-1, 0), right: () => sc(1, 0) },
      onCancel: () => { sfx.back(); scr.close(); },
      hints: () => [['a', '下一页'], ['b', '返回'], ['lbrb', '切换'], ['dpad', '滚动']] });
    function sc(dx, dy) { const w = scr.el.querySelector('#rkT'); w.scrollLeft += dx * 200 * Kit.s; w.scrollTop += dy * 170 * Kit.s; Kit.cues(); }
    function mv(d) { tab = tabs[(tabs.findIndex(t => t[0] === tab) + d + tabs.length) % tabs.length][0]; sfx.tick(); paint(); }
    function paint() {
      scr.el.querySelector('#rkTop').innerHTML = top();
      const t = scr.el.querySelector('#rkT'); t.innerHTML = tab === 'map' ? mapTab() : tab === 'co' ? coTab() : campTab(); t.scrollTop = 0; t.scrollLeft = 0;
      const cr = scr.el.querySelector('.cr'); if (cr) { cr.innerHTML = Kit.tabsHtml(tabs, tab); cr.querySelectorAll('.ctab').forEach(x => { x.onclick = () => { if (x.dataset.tab !== tab) { tab = x.dataset.tab; sfx.tick(); paint(); } }; }); }
      Kit.hydrate(scr.el); Kit.cues(); Kit.paintHints(true);
    }
    paint();
    return scr;
  };

  root.AWRankUI = U;
})(window);
