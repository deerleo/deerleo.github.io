// 潮汐战线：战役《黑潮》的界面（window.AWCampaignUI(G)）。数据在 campaign.js（AWCampaign），格式见 tools/CAMPAIGN.md。
// 画面：选关页（按幕分组，每幕一条横向的关卡带）→ 幕前旁白（黑底大字）→ 关前页（目标、失败条件、指挥官 / 席位）→ 对局（开场、关中、结尾对话；
//       左上一条目标；地图上的目标标记）→ 结算页（用了几天、解锁了什么）→ 尾声 → 回到选关页。
// 核心的战役接口（C.newCampaignGame、C.objectives、s.events 里的 talk、C.factionOf）接好了就用；没接好的部分这里按 CAMPAIGN.md 的格式自己做一份：
//   开局：按 sides / rules / units / owners 用 C.newGame + C.spawn 摆出来；目标：下面的 WIN / LOSE 判定；关中对话：下面的触发器。
// 进度：有 campaign-run.js（AWCampaignRun）就由它记通关和解锁；这里的 localStorage（steel-tide.campaign）只多记一样——看过哪几幕的幕前旁白。
// AWCampaignRun 缺席时通关记录和图鉴条目也记在这里。
(function (root) {
  'use strict';
  root.AWCampaignUI = function (G) {
    const A = root.AWCampaign; if (!A || !Array.isArray(A.levels)) return null;
    const { D, C, Kit, sfx } = G, esc = Kit.esc, Nav = Kit.Nav, T = Kit.t, $ = id => document.getElementById(id);
    Kit.css(`
    /* 选关 */
    .cpsel { flex:1; min-height:0; width:100%; padding:104r 40r 10r; display:flex; flex-direction:column; gap:10r; }
    .cpact { flex:none; display:flex; align-items:stretch; gap:16r; } .cpact .an { flex:none; width:300r; display:flex; flex-direction:column; justify-content:center; padding:0 18r; background:linear-gradient(90deg, var(--pc), var(--pcd)); color:#fff; font-size:max(20px,30r); font-weight:900; line-height:1.2; text-shadow:0 3r 0 rgba(0,0,0,.4); clip-path:polygon(0 0, calc(100% - 26r) 0, 100% 50%, calc(100% - 26r) 100%, 0 100%); }
    .cpact .an small { font-size:max(20px,22r); font-weight:700; opacity:.9; display:flex; gap:6r; align-items:center; margin-top:4r; } .cpact .an .ic { width:34r; height:34r; }
    .cpact .lv { flex:1; min-width:0; display:flex; gap:12r; }
    .cplv { flex:1 1 0; min-width:0; max-width:330r; height:128r; padding:8r 14r; display:flex; flex-direction:column; justify-content:center; gap:2r; background:rgba(14,18,32,.7); box-shadow:inset 0 0 0 3r var(--line); text-align:left; position:relative; clip-path:polygon(10r 0, calc(100% - 10r) 0, 100% 10r, 100% calc(100% - 10r), calc(100% - 10r) 100%, 10r 100%, 0 calc(100% - 10r), 0 10r); }
    .cplv .no { display:flex; align-items:center; gap:8r; font-size:max(20px,22r); color:var(--gold); } .cplv .no .ic { width:30r; height:30r; } .cplv .no i { font-style:normal; margin-left:auto; color:var(--green); font-weight:900; }
    .cplv b { font-size:max(20px,34r); font-weight:900; line-height:1.15; white-space:nowrap; } .cplv span { font-size:max(20px,22r); color:var(--mut); white-space:nowrap; overflow:hidden; }
    .cplv.lock { opacity:.5; } .cplv.lock b { color:#8a93ad; } .cplv.nav.focus span, .cplv.nav.focus .no, .cplv.nav.focus .no i { color:var(--ink); }
    body.narrow .cpsel { padding:104r 12r 10r; overflow-y:auto; } body.narrow .cpact { flex-direction:column; gap:6r; } body.narrow .cpact .an { width:auto; min-height:64r; flex-direction:row; align-items:center; justify-content:flex-start; gap:14r; } body.narrow .cpact .lv { flex-wrap:wrap; } body.narrow .cplv { flex:1 1 44%; max-width:none; height:110r; }
    /* 带插图的章节牌和关卡格子：插图做底，文字压在下方的暗条上 */
    .cpact .an.art { background:linear-gradient(90deg, rgba(8,12,24,.25), rgba(8,12,24,.8)), linear-gradient(transparent 35%, rgba(8,12,24,.85)), var(--im) center/cover no-repeat, var(--pcd); justify-content:flex-end; padding-bottom:10r; } .cpsel.arts .cpact .an { width:340r; }
    .cpsel.arts .cplv { height:176r; } .cplv.art { justify-content:flex-end; padding-bottom:10r; background:linear-gradient(transparent 22%, rgba(8,12,24,.9) 62%), var(--im) center/cover no-repeat, #141a2c; } .cplv.art .no { position:absolute; left:12r; right:12r; top:8r; text-shadow:0 2r 0 #000, 0 0 8r #000; }
    .cplv.art.nav.focus { background:linear-gradient(transparent 22%, rgba(8,12,24,.9) 62%), var(--im) center/cover no-repeat, #141a2c; box-shadow:inset 0 0 0 7r var(--gold), 0 0 0 4r var(--gold); transform:scale(1.04); z-index:2; } .cplv.art.nav.focus b { color:var(--gold2); } .cplv.art.nav.focus span { color:#e9edf8; } .cplv.art.nav.focus .no { color:var(--gold); } .cplv.art.nav.focus .no i { color:var(--green); }
    body.narrow .cpsel.arts .cplv { height:190r; } body.narrow .cpact .an.art { min-height:120r; }
    /* 关前页顶部的插图横幅 */
    .cpbrief .bn.art { flex:none; margin:-26r -34r 0; padding:190r 34r 16r; background:linear-gradient(transparent 20%, rgba(30,37,58,.97)), var(--im) center 30%/cover no-repeat; } body.narrow .cpbrief .bn.art { margin:-16r -18r 0; padding:200r 18r 12r; } body.small:not(.narrow) .cpbrief .bn.art { padding-top:90r; }
    /* 幕前旁白、尾声 */
    .cpnar { background:#05070d !important; justify-content:center; padding:0 12%; gap:26r; } .cpnar::before { display:none; } .cpnar h2 { margin:0 0 20r; font-size:max(30px,64r); color:var(--gold); font-weight:900; align-self:flex-start; }
    .cpnar p { margin:0; align-self:flex-start; font-size:max(22px,44r); line-height:1.6; font-weight:800; animation:narIn .6s ease-out both; } @keyframes narIn { from { opacity:0; transform:translateY(16r); } }
    body.narrow .cpnar { padding:0 6%; } body.narrow .cpnar p { font-size:max(18px,36r); }
    /* 关前页 */
    .cpbrief { flex:1; min-height:0; width:100%; display:flex; gap:30r; padding:104r 60r 20r; align-items:stretch; justify-content:center; }
    .cpbrief .lf { flex:1; max-width:1080r; padding:26r 34r; display:flex; flex-direction:column; gap:14r; } .cpbrief h2 { margin:0; font-size:max(36px,84r); line-height:1.05; color:#fff3d0; font-weight:900; } .cpbrief h2 small { font-size:max(20px,30r); color:var(--gold); margin-right:20r; }
    .cpbrief .wh { font-size:max(20px,30r); color:var(--mut); } .cpbrief h4 { margin:8r 0 0; font-size:max(20px,26r); color:var(--gold); display:flex; gap:8r; align-items:center; } .cpbrief p { margin:0; font-size:max(20px,32r); line-height:1.4; } .cpbrief p.bad { color:#ffb0a0; font-size:max(20px,28r); }
    .cpbrief .rt { width:660r; padding:22r 26r; display:flex; flex-direction:column; gap:12r; } .cpbrief .sd { display:flex; align-items:center; gap:14r; padding:8r 12r; background:linear-gradient(90deg, var(--pc), var(--pcd) 70%, transparent); font-size:max(20px,28r); color:#fff; font-weight:900; } .cpbrief .sd .hd { width:84r; height:84r; } .cpbrief .sd em { font-style:normal; font-size:max(20px,22r); padding:0 10r; background:var(--gold); color:var(--ink); } .cpbrief .sd small { font-size:max(20px,22r); font-weight:700; opacity:.9; display:block; }
    .cpbrief .pick { display:flex; gap:22r; flex-wrap:wrap; padding:14r 14r 10r; } .cpbrief .pick .hsel { width:110r; height:110r; } .cpbrief .go { margin-top:auto; flex:none; align-self:flex-end; width:auto; justify-content:center; padding:0 70r 0 90r; }
    body.narrow .cpbrief { flex-direction:column; padding:104r 14r 10r; overflow-y:auto; gap:14r; } body.narrow .cpbrief .lf, body.narrow .cpbrief .rt { flex:none; width:auto; max-width:none; padding:16r 18r; } body.narrow .cpbrief h2 { font-size:60r; }
    /* 对话 */
    #dlg { position:fixed; inset:0; z-index:36; background:linear-gradient(transparent 30%, rgba(6,8,16,.72)); animation:none; padding:0; display:block; } #dlg::before { display:none; }
    #dlg .pt { position:absolute; bottom:250r; height:640r; max-width:46%; transition:opacity .15s; } #dlg .pt.l { left:5%; } #dlg .pt.r { right:5%; transform:scaleX(-1); } #dlg .pt.in { animation:dlgIn .22s ease-out both; } @keyframes dlgIn { from { opacity:0; translate:0 30r; } }
    #dlg .box { position:absolute; left:6%; right:6%; bottom:110r; min-height:200r; padding:34r 44r 26r; font-size:max(22px,42r); line-height:1.5; font-weight:800; cursor:pointer; }
    #dlg .nm { position:absolute; top:-46r; padding:4r 34r; font-size:max(20px,34r); font-weight:900; color:#fff; background:linear-gradient(var(--pc), var(--pcd)); box-shadow:0 0 0 4r var(--line); text-shadow:0 3r 0 rgba(0,0,0,.4); } #dlg .nm.l { left:30r; } #dlg .nm.r { right:30r; }
    #dlg .box.nar { text-align:center; background:rgba(8,10,20,.86); color:#e9edf8; font-style:italic; } #dlg .more { position:absolute; right:26r; bottom:10r; color:var(--gold); animation:bob .5s ease-in-out infinite alternate; }
    body.narrow #dlg .pt { height:520r; max-width:70%; bottom:330r; } body.narrow #dlg .box { left:3%; right:3%; bottom:max(70px,130r); min-height:260r; padding:30r 26r 22r; font-size:max(18px,36r); }
    #dlg .skip { display:none; position:absolute; right:20r; top:-52r; min-height:44px; padding:0 26r; align-items:center; font-size:max(20px,26r); font-style:normal; color:var(--txt); background:rgba(14,18,32,.9); box-shadow:0 0 0 3r var(--line); cursor:pointer; } body[data-dev=touch] #dlg .skip, body[data-dev=mouse] #dlg .skip { display:flex; }
    body[data-dev=touch] #dlg .box, body[data-dev=mouse] #dlg .box { bottom:30r; } body[data-dev=touch] #dlg .pt, body[data-dev=mouse] #dlg .pt { bottom:170r; }
    body.dlg-on .hud, body.dlg-on #toast { opacity:0; pointer-events:none; }
    /* 结算 */
    .cpres .rt { min-width:0; flex:1; max-width:980r; } .cpres .un { display:flex; flex-wrap:wrap; gap:10r; align-items:center; font-size:max(20px,28r); } .cpres .un .hd { width:76r; height:76r; }
    `);
    const lsGet = () => { try { return JSON.parse(localStorage.getItem('steel-tide.campaign') || 'null') || {}; } catch (e) { return {}; } };
    const P = Object.assign({ done: {}, acts: [], codex: [] }, lsGet());
    const save = () => { try { localStorage.setItem('steel-tide.campaign', JSON.stringify(P)); } catch (e) { } };
    const Run = () => root.AWCampaignRun || null;
    const isDone = id => { const R = Run(); try { if (R) return !!R.isDone(id); } catch (e) { } return !!P.done[id]; };
    const bestDays = id => { const R = Run(); try { if (R) { const r = R.record(id); return r ? r.days : 0; } } catch (e) { } return P.done[id] || 0; };
    const codexOpen = () => { const R = Run(); try { if (R) return R.unlockedCodex() || []; } catch (e) { } return P.codex.slice(); };
    const LV = A.levels, lvOf = id => LV.find(l => l.id === id), co = id => D.COS.find(c => c.id === id);
    const mapDef = l => l.map && !l.map.need ? D.MAPS.find(m => m.name === l.map.name) : null;
    const unlocked = i => i === 0 || isDone(LV[i - 1].id);
    const playerSide = (l, seat) => l.sides.find(s => seat ? s.seat === seat : s.role === 'player') || l.sides[0];
    const seatsOf = l => (Array.isArray(l.playerSeats) && l.playerSeats.length ? l.playerSeats : [playerSide(l).seat]);
    const TN = k => k === 'income' ? T('收入建筑') : (D.TERRAIN[k] && D.TERRAIN[k].name) || k;   // 建筑名读数据（已是当前语言）
    const loseText = c => c.type === 'loseHq' ? T('己方司令部被占领') : c.type === 'routed' ? T('己方单位全部被击毁') : c.type === 'timeout' ? T('第 {day} 天结束时还没有达成目标', { day: c.day }) : c.type === 'unitLost' ? T('目标单位被击毁') : c.type === 'ownBelow' ? T('指定建筑中己方占有不足 {n} 座', { n: c.count }) : c.type === 'enemyOwn' ? T('敌方同时占有 {n} 座{kind}', { n: c.count, kind: TN(c.kind) }) : c.type === 'allyDefeated' ? T('友方阵营败北') : '';

    // ───────── 选关：按幕分组，每幕一条横向的关卡带 ─────────
    let selScr = null, World = null;
    // 揭晓之前不露面的指挥官（lore.js 里 hidden + reveal：通关 reveal 那一关才显示真名和立绘）
    const coOpen = id => { const lo = (root.AWLore && root.AWLore.cos && root.AWLore.cos[id]) || null; return !(lo && lo.hidden && lo.reveal && !isDone(lo.reveal)); };
    const coName = id => { const c = co(id); return !c ? '' : coOpen(id) ? c.name : '？？？'; };
    // 战役入口：世界地图（world.js 和 campaign.js 的 world 数据都在时）；否则是下面的关卡一览
    function select(focusId) {
      if (!World && root.AWWorldUI) World = root.AWWorldUI(G, { LV, lvOf, isDone, unlocked, playerSide, coOpen, P, save, brief, list });
      if (World) return World.open(focusId);
      list(focusId);
    }
    // 关卡一览：按幕分组的列表（世界地图右下角的入口进来；没有世界地图时就是选关页）
    const CGA = () => (root.AWCG && root.AWCGPlayer && root.AWCGPlayer.levelArt) ? root.AWCGPlayer : null;   // 关卡、章节插图（cg.js 没到位就是 null，各处照原样显示）
    function list(focusId) {
      if (!(World && World.on)) { Kit.closeAll(); Nav.stack = []; G.showTitle(); }   // 没有世界地图垫着时，标题页垫在下面
      // 只列进得去的：还没解锁的关卡不出现，一关都没解锁的幕整行不出现（进度的分母仍按这一幕的总关数算）
      const row = a => { const all = LV.map((l, i) => [l, i]).filter(x => x[0].act === a.id), ls = all.filter(x => unlocked(x[1]));
        if (!ls.length) return '';
        const aim = CGA() ? CGA().actArt(a.id, true) : '';
        return `<div class="cpact" style="${Kit.pcs((a.pov || [])[0] || 0)}"><div class="an${aim ? ' art' : ''}" style="${aim ? `--im:url('${aim}')` : ''}">${esc(a.name)}<small>${(a.pov || []).map(f => Kit.emblem(f)).join('')}${T('{a}/{b}', { a: all.filter(x => isDone(x[0].id)).length, b: all.length })}</small></div><div class="lv">` +
          ls.map(([l, i]) => { const ok = unlocked(i), ps = playerSide(l); const im = ok && CGA() ? CGA().levelArt(l.id, true) : ''; return `<button class="nav cplv${ok ? '' : ' lock'}${im ? ' art' : ''}" data-id="${l.id}" style="${im ? `--im:url('${im}')` : ''}"><div class="no">${Kit.emblem(ps.faction || ps.seat)}${esc(l.no)}${isDone(l.id) ? `<i>✓ ${esc(T('通关'))}</i>` : ok ? '' : '<i style="color:#8a93ad">🔒</i>'}</div><b>${ok ? esc(l.title) : '？？？'}</b><span>${ok ? esc(l.where || '') + '　' + '★'.repeat(l.difficulty || 1) : esc(T('通关上一关后解锁'))}</span></button>`; }).join('') + `</div></div>`; };
      selScr = Kit.screen({ id: 'cpSel', html: `<div class="crumb pn">${esc(T('战役'))}<em>|</em><span>${esc(A.title || '')}</span></div><div class="cpsel sc${CGA() ? ' arts' : ''}">${A.acts.map(row).join('')}</div>`,
        onCancel: () => { sfx.back(); selScr.close(true); selScr = null; }, flow: true, hints: [['a', '进入'], ['b', '返回'], ['dpad', '选关']] });
      selScr.el.querySelectorAll('.cplv').forEach(b => { b.onclick = () => { const i = LV.findIndex(l => l.id === b.dataset.id); if (!unlocked(i)) { sfx.no(); return Kit.note(T('通关上一关后解锁')); } sfx.ok(); enter(LV[i]); }; });
      const want = focusId || (LV.find((l, i) => unlocked(i) && !isDone(l.id)) || LV[0]).id, f = selScr.el.querySelector(`[data-id="${want}"]`);
      if (root.AWRankUI) root.AWRankUI.levelList(selScr.el);   // 每一关的评级徽章（ui-rank.js）
      selScr.el.querySelectorAll('.cplv b, .cplv span').forEach(e => Kit.fit(e));   // 单行的标题、地点：其他语言放不下就缩字（中文下不动）
      if (f) { Nav.top().f = null; Nav.focus(f); }
    }
    // 进一关：第一次进这一幕先播幕前旁白
    function enter(l) { const a = A.acts.find(x => x.id === l.act); if (a && a.narration && !P.acts.includes(a.id)) narrate(a.name, a.narration, () => { P.acts.push(a.id); save(); brief(l); }); else brief(l); }

    // ───────── 旁白：黑底大字，一句一句出；确定下一句，Start / Y 或长按跳过 ─────────
    function narrate(title, text, done) {
      const cut = Array.isArray(text) ? text : Kit.sentences(text), parts = cut.length || Array.isArray(text) ? cut : [String(text)]; let i = 0, t0 = 0;
      const fin = () => { scr.close(true); done(); };
      const next = () => { if (i >= parts.length) return fin(); const p = document.createElement('p'); p.textContent = parts[i++]; scr.el.appendChild(p); sfx.tick(); while (scr.el.querySelectorAll('p').length > 5) scr.el.querySelector('p').remove(); Kit.paintHints(true); };
      const scr = Kit.screen({ id: 'cpNar', cls: 'cpnar', html: title ? `<h2>${esc(title)}</h2>` : '', onCancel: fin, keys: { ok: next, start: fin, y: fin }, hints: () => [['a', i >= parts.length ? '继续' : '下一句'], ['b', '跳过']] });
      scr.el.addEventListener('pointerdown', () => { t0 = performance.now(); }); scr.el.addEventListener('click', () => { if (performance.now() - t0 > 600) fin(); else next(); });
      next();
    }

    // ───────── 关前页 ─────────
    function brief(l) {
      const def = mapDef(l), seats = seatsOf(l); let seat = seats[0], pick = (playerSide(l, seat).cos || [playerSide(l, seat).co])[0];
      const scr = Kit.screen({ id: 'cpBrief', html: `<div class="crumb pn">${esc((A.acts.find(a => a.id === l.act) || {}).name || T('战役'))}</div><div class="cpbrief"><div class="lf pn sc" id="cbL"></div><div class="rt pn sc" id="cbR"></div></div>`,
        keys: { lb: () => chSeat(-1), rb: () => chSeat(1), ok: () => { const f = Nav.top().f; if (f && f.dataset.co) { f.click(); return; } go(); } },
        flow: true, hints: () => [['a', '开始作战', !def], ['b', '返回'], seats.length > 1 && ['lbrb', '切换阵营']] });   // 主操作固定在右下角
      function paint() {
        const ps = playerSide(l, seat), cos = ps.cos || [ps.co];
        const bim = CGA() ? CGA().levelArt(l.id) : '';
        $('cbL').innerHTML = `<div class="bn${bim ? ' art' : ''}" style="${bim ? `--im:url('${bim}')` : ''}"><h2><small>${esc(l.no)}</small>${esc(l.title)}</h2><div class="wh">${esc([l.where, l.when].filter(Boolean).join('　·　'))}　${'★'.repeat(l.difficulty || 1)}</div></div>` +
          `<h4>${Kit.ic('flag', 's')}${esc(T('目标'))}</h4><p>${esc(l.goal || '')}</p><h4>${esc(T('失败条件'))}</h4>${(l.lose || []).map(c => `<p class="bad">${esc(loseText(c))}</p>`).join('')}` +
          (l.teach && l.teach.length ? `<h4>${esc(T('本关要点'))}</h4><div class="chips">${l.teach.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '') + (def ? '' : `<p class="bad">${esc(T('这一关的地图「{name}」还没做好。', { name: T(l.map.name, null, 'map') }))}</p>`);
        $('cbR').innerHTML = (seats.length > 1 ? `<h4>${esc(T('选择阵营'))}</h4><div class="tabs">${seats.map(s => { const x = playerSide(l, s); return `<span class="tab${s === seat ? ' on' : ''}" data-seat="${s}" style="${Kit.pcs(x.faction || s)}">${Kit.emblem(x.faction || s)}${esc(Kit.pname(x.faction || s))}</span>`; }).join('')}</div>` : '') +
          `<h4>${esc(cos.length > 1 ? T('选择指挥官') : T('指挥官'))}</h4><div class="pick">${cos.map(id => `<div class="nav hsel${id === pick ? ' on' : ''}" data-co="${id}">${Kit.head(id, ps.faction || seat, 0)}</div>`).join('')}</div><p class="t-b">${esc(G.coLabel(co(pick) || {}))}</p>` +
          `<h4>${esc(T('参战阵营'))}</h4>${l.sides.map(s => { const me = s.seat === seat, id0 = me ? pick : (s.co || (s.cos || [])[0]), id = coOpen(id0) ? id0 : 'rand', role = me ? T('玩家') : seats.includes(s.seat) || s.role === 'ally' || s.team === ps.team ? T('友方') : T('敌方'); return `<div class="sd" style="${Kit.pcs(s.faction || s.seat)}">${Kit.head(id, s.faction || s.seat, 84)}<div>${esc(Kit.pname(s.faction || s.seat))} <em>${esc(role)}</em><small>${esc(id === 'rand' ? '？？？' : G.coLabel(co(id) || {}))}</small></div></div>`; }).join('')}` +
          '';
        $('cbL').insertAdjacentHTML('beforeend', `<button class="nav item go" id="cbGo" style="display:none"${def ? '' : ' disabled'}>${esc(Kit.t('开始作战'))}</button>`);   // “开始作战”在右下角固定的主按钮上（提示条的流程样式）；这个按钮留着给脚本和旧入口用，不显示
        Kit.hydrate(scr.el);
        $('cbR').querySelectorAll('.hsel').forEach(b => { b.onclick = () => { if (b.dataset.co !== pick) { pick = b.dataset.co; sfx.tick(); paint(); } else go(); }; });
        $('cbR').querySelectorAll('.tab').forEach(b => { b.onclick = () => { seat = +b.dataset.seat; pick = (playerSide(l, seat).cos || [playerSide(l, seat).co])[0]; sfx.tick(); paint(); }; });
        $('cbGo').onclick = go; Nav.top().f = null; Nav.focus($('cbR').querySelector('.hsel.on') || $('cbGo')); Kit.paintHints(true);
      }
      function chSeat(d) { if (seats.length < 2) return false; seat = seats[(seats.indexOf(seat) + d + seats.length) % seats.length]; pick = (playerSide(l, seat).cos || [playerSide(l, seat).co])[0]; sfx.tick(); paint(); }
      function go() { if (!def) { sfx.no(); return Kit.note(T('这一关的地图还没做好')); } start(l, seat, pick); }
      paint();
    }

    // ───────── 开局 ─────────
    function build(l, seat, pick) {
      if (C.newCampaignGame) { try { const s = C.newCampaignGame(l, { seat, co: pick }); if (s) return s; } catch (e) { console.error(e); } }
      const def = mapDef(l), cos = [null], teams = [0], ai = [null], fo = [null];
      for (const s of l.sides) { cos[s.seat] = s.seat === seat ? pick : (s.co || (s.cos || [])[0]); teams[s.seat] = s.team || s.seat; ai[s.seat] = s.ai || null; fo[s.seat] = s.faction || s.seat; }
      const rules = Object.assign({}, G.RDEF, l.rules || {});
      const s = C.newGame(def, { cos, teams, co1: cos[1], co2: cos[2], funds: rules.startFunds || 0, rules, aiLevels: ai });
      for (const sd of l.sides) if (sd.funds != null) s.funds[sd.seat] = sd.funds;
      for (const u of l.units || []) { try { if (C.unitAt(s, u.at[0], u.at[1])) continue; const q = C.spawn(s, u.type, u.seat, u.at[0], u.at[1]); q.moved = false; if (u.tag) q.tag = u.tag; if (u.hp) q.hp = u.hp * 10; } catch (e) { console.error(e); } }
      for (const o of l.owners || []) { try { s.map.owner[o.at[1]][o.at[0]] = o.seat; } catch (e) { } }
      if (!s.factionOf) s.factionOf = fo;
      return s;
    }
    let L = null;                                   // 现在这一关
    function start(l, seat, pick) {
      let s = null; try { s = build(l, seat, pick); } catch (e) { console.error(e); }
      if (!s) { sfx.no(); return Kit.note(T('这一关暂时不能开始')); }
      // 核心建的对局自带 s.camp（id、seat、roles…）；这里补上界面要的几样。核心没建的（退回上面的 build）整份自己记
      s.camp = Object.assign({ id: l.id, seat, fired: [], hb: {}, via: {} }, s.camp || {}, { co: pick, title: l.no + ' ' + l.title, goal: l.goal || '' });
      seat = s.camp.seat;
      L = l; snap = null;
      const hum = [false]; for (let p = 1; p <= (s.players || 2); p++) hum[p] = p === seat && !G.DEMO;
      if (G.defaultFunds) G.defaultFunds(s, p => hum[p]);   // 玩家的研究经费默认“低”档
      // 开场：先播这一关的过场（有的话），再是开场对话（带插画的行用插画当背景）
      G.startCampaign(s, hum, async () => { if (CGP() && CGP().has('before:' + l.id)) await CGP().playKey('before:' + l.id); await talk((l.dialog || {}).intro, null, CGP() ? CGP().lineArt(l.id, 'intro') : null); });
    }
    function attach() { const S = G.S; L = S && S.camp ? lvOf(S.camp.id) : null; snap = null; }

    // ───────── 对话 ─────────
    // 行：{ who: 指挥官 id | 'narrator', mood, text }。逐字出；确定：没出完先出完，出完下一句；Start / Y、长按：跳过整段
    let dlgOn = null, waiters = [];
    // 回标题、换一局时：没播完的对话作废（否则下一段对话会排在一个永远不结束的后面）
    const abort = () => { dlgOn = null; document.body.classList.remove('dlg-on'); const w = waiters; waiters = []; w.forEach(f => f()); };
    const idle = () => dlgOn ? new Promise(r => waiters.push(r)) : Promise.resolve();
    const CGP = () => root.AWCGPlayer || null;
    // 关中对话第 i 个事件里带插画的行（cg.js：scenes[关卡].at.events[事件下标] = { 行号: 图 }）
    const evArt = i => { try { const P = CGP(), ev = P && L && P.lineArt(L.id, 'events'); if (!ev) return null; const A = root.AWCG.scenes[L.id].at.events[i]; if (!A) return null; const o = {}; for (const n in A) o[n] = P.src(A[n]); return o; } catch (e) { return null; } };
    function talk(lines, at, art) {
      if (!lines || !lines.length || G.DEMO) return Promise.resolve();
      if (dlgOn) return dlgOn = dlgOn.then(() => talk(lines, at, art));
      if (at && G.S) { try { G.centerOn(at[0], at[1]); } catch (e) { } }
      const S = G.S, seatOf = id => { if (!S) return 0; for (let p = 1; p <= (S.players || 2); p++) if (S.co[p] === id) return p; return 0; };
      const me = S && S.camp ? S.camp.seat : 1, myTeam = S && S.team ? S.team[me] : me;
      return dlgOn = new Promise(res => {
        let i = -1, n = 0, full = '', timer = 0, t0 = 0; const shown = { l: '', r: '' };
        document.body.classList.add('dlg-on');
        const fin = () => { clearInterval(timer); scr.close(true); dlgOn = null; document.body.classList.remove('dlg-on'); res(); const w = waiters; waiters = []; w.forEach(f => f()); };
        const scr = Kit.screen({ id: 'dlg', cls: 'clear', html: `<img class="pt l" data-s="l" alt=""><img class="pt r" data-s="r" alt=""><div class="box pn"><span class="nm"></span><span class="tx"></span><span class="more">▼</span><span class="skip">${esc(Kit.t('跳过'))}</span></div>`,
          onCancel: () => adv(), keys: { ok: () => adv(), start: fin, y: fin }, hints: () => Kit.ptr() ? [] : [['a', '继续'], ['y', '跳过']] });   // 鼠标、触屏：点对话框继续，右上角一个“跳过”
        scr.el.querySelector('.skip').onclick = e => { e.stopPropagation(); fin(); };
        const box = scr.el.querySelector('.box'), nm = box.querySelector('.nm'), tx = box.querySelector('.tx'), more = box.querySelector('.more');
        box.addEventListener('pointerdown', () => { t0 = performance.now(); }); scr.el.addEventListener('click', () => { if (performance.now() - t0 > 700) fin(); else adv(); });
        function show() {
          if (art) { const u = art[i]; if (u && scr.el.dataset.art !== u) { scr.el.dataset.art = u; const put = () => { if (scr.el.dataset.art === u) scr.el.style.background = `#000 url("${u}") center/cover no-repeat`; }; const P = root.AWCGPlayer && root.AWCGPlayer.pre; if (P) P(u).then(put); else put(); } }   // 这一行带插画：插画铺满当背景（盖住战场），之后的行沿用到下一张
          const ln = lines[i], nar = !ln.who || ln.who === 'narrator', c = nar ? null : co(ln.who);
          const seat = c ? seatOf(c.id) : 0, f = c ? (seat ? G.fac(seat) : c.faction) : 0;
          // 站位：玩家这一队在左，其余在右；不在场的人按阵营是不是玩家的阵营
          const side = !c ? '' : (seat ? (S.team ? S.team[seat] === myTeam : seat === me) : c.faction === G.fac(me)) ? 'l' : 'r';
          box.classList.toggle('nar', nar); nm.style.display = nar ? 'none' : ''; nm.className = 'nm ' + side; nm.textContent = c ? coName(c.id) : ''; nm.style.cssText += ';' + Kit.pcs(f);
          for (const sd of ['l', 'r']) { const im = scr.el.querySelector('.pt.' + sd); if (sd === side) { const key = c.id + '|' + (ln.mood || 'normal'); if (shown[sd] !== key) { shown[sd] = key; im.dataset.co = c.id; im.dataset.mood = ln.mood || 'normal'; im._co = ''; im.classList.add('pt'); im.classList.remove('in'); void im.offsetWidth; im.classList.add('in'); Kit.hydrate(scr.el); } im.style.opacity = 1; } else im.style.opacity = shown[sd] ? 1 : 0; im.style.filter = (shown[sd] && !coOpen(shown[sd].split('|')[0]) ? 'brightness(0) drop-shadow(0 0 3px #9ab) ' : '') + (sd === side ? '' : 'brightness(.4) saturate(.6)'); }
          full = ln.text || ''; n = 0; tx.textContent = ''; more.style.display = 'none'; clearInterval(timer);
          timer = setInterval(() => { n += 1; tx.textContent = [...full].slice(0, n).join(''); if (n % 3 === 1) sfx.tick(); if (n >= [...full].length) { clearInterval(timer); more.style.display = ''; } }, 28);
        }
        function adv() { if (n < [...full].length) { clearInterval(timer); n = [...full].length; tx.textContent = full; more.style.display = ''; return; } if (++i >= lines.length) return fin(); show(); }
        adv();
      });
    }

    // ───────── 目标：进度文字、地图标记、判定（核心没有 C.objectives 时用这里的）─────────
    const S_ = () => G.S, mine = (p, by) => { const S = S_(), me = S.camp.seat; return by === 'team' && S.team ? S.team[p] === S.team[me] : p === me; };
    const ownerAt = at => S_().map.owner[at[1]][at[0]];
    const markAt = name => { const d = L && mapDef(L); return d && d.marks && d.marks[name]; };
    const spots = c => (c.at ? (Array.isArray(c.at[0]) ? c.at : [c.at]) : (c.marks || []).map(markAt).filter(Boolean));
    const countKind = (kind, test) => { const S = S_(), m = S.map; let n = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = m.t[y][x], T = D.TERRAIN[t]; if (!T || !T.prop || !test(m.owner[y][x])) continue; if (kind === 'income' ? T.income : t === kind) n++; } return n; };
    const tagged = tag => { const S = S_(); for (const q of S.units) { if (q.tag === tag) return { u: q, in: false }; for (const c of q.cargo || []) if (c.tag === tag) return { u: q, in: true }; } return null; };
    const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    // 一行进度：[文字, 进度]
    function progOf(c) {
      const S = S_(), k = S.camp;
      if (c.type === 'hold') return [T('坚守至第 {days} 天结束', { days: c.days }), T('第 {a}/{b} 天', { a: Math.min(S.day, c.days), b: c.days })];
      if (c.type === 'capture') { const sp = spots(c); return [T('占领目标建筑'), T('{a}/{b}', { a: sp.filter(a => mine(ownerAt(a), c.by)).length, b: sp.length })]; }
      if (c.type === 'holdBuilding') return [T('连续占有目标建筑 {days} 天', { days: c.days }), T('已守 {a}/{b} 天', { a: k.hb[c.at.join()] || 0, b: c.days })];
      if (c.type === 'own') return [T('同时占有 {n} 座{kind}', { n: c.count, kind: TN(c.kind) }), T('{a}/{b}', { a: countKind(c.kind, o => o === k.seat), b: c.count })];
      if (c.type === 'escort') { const via = c.via || [], got = k.via[c.tag] || 0; return [got < via.length ? T('目标单位前往途经点') : T('目标单位到达目的地'), via.length ? T('途经 {a}/{b}', { a: got, b: via.length }) : '']; }
      if (c.type === 'funds') return [T('持有资金 {amount}', { amount: c.amount }), T('{a}/{b}', { a: S.funds[k.seat] || 0, b: c.amount })];
      if (c.type === 'hq') return [T('占领敌方司令部'), '']; if (c.type === 'rout') return [T('击毁全部敌方单位'), ''];
      return ['', ''];
    }
    const coreObj = () => { try { return C.objectives ? C.objectives(S_()) : null; } catch (e) { return null; } };
    // 目标条的内容：{ any 胜利条件不止一条（达成任一即胜利）, win: [行], lose: [行] }；行 = { text, prog, tone }
    function goalLines() {
      const S = S_(); if (!S || !S.camp || !L) return null;
      const O = coreObj(), t = Kit.t;
      // 进度的写法：守到某天 / 限期写“第 5/12 天”（现在是第几天，核心给的 have 是已经过完的天数）；连续占有写“已守 1/3 天”；其余“2/3”
      if (O) { const it = x => { const p = x.progress; return { text: x.text, tone: x.done ? 'good' : x.type === 'timeout' && p && S.day >= p.need - 1 ? 'bad' : '',
        prog: !p ? '' : (x.type === 'hold' || x.type === 'timeout') ? t('第 {a}/{b} 天', { a: Math.min(S.day, p.need), b: p.need }) : x.type === 'holdBuilding' ? t('已守 {a}/{b} 天', { a: p.have, b: p.need }) : t('{a}/{b}', { a: p.have, b: p.need }) }; };
        const win = (O.win || []).filter(x => x.text).map(it), lose = (O.lose || []).filter(x => x.text).map(it);
        if (win.length) { let fi = null; try { fi = C.floodInfo ? C.floodInfo(S) : null; } catch (e) { }
          if (fi) lose.unshift({ text: fi.nextDay == null ? t('涨水已停止') : t('下一次涨水'), prog: fi.nextDay == null ? '' : fi.gates ? t('第 {n} 天　闸房 {a}/{b}', { n: fi.nextDay, a: fi.held || 0, b: fi.gates }) : t('第 {n} 天', { n: fi.nextDay }), tone: 'flood' });
          return { any: win.length > 1, win, lose, flood: !!fi }; } }
      const win = [], lose = [];
      for (const c of L.win || []) { const [tx, p] = progOf(c); if (tx) win.push({ text: tx, prog: p }); }
      for (const c of L.lose || []) { const tx = loseText(c); if (tx) lose.push({ text: tx, prog: c.type === 'timeout' ? t('第 {a}/{b} 天', { a: Math.min(S.day, c.day), b: c.day }) : '', tone: c.type === 'timeout' && S.day >= c.day - 1 ? 'bad' : '' }); }
      return { any: win.length > 1, win, lose };
    }
    function marks() {
      const S = S_(); if (!S || !S.camp || !L) return [];
      const out = [], k = S.camp, O = coreObj();
      if (O) { for (const c of O.cells || []) out.push({ x: c[0], y: c[1] }); for (const id of O.units || []) { const q = S.units.find(u => u.id === id); if (q && G.unitSeen(q)) out.push({ x: q.x, y: q.y, unit: true }); } return out; }
      for (const c of L.win || []) {
        if (c.type === 'capture') for (const a of spots(c)) { if (!mine(ownerAt(a), c.by)) out.push({ x: a[0], y: a[1] }); }
        else if (c.type === 'holdBuilding') out.push({ x: c.at[0], y: c.at[1] });
        else if (c.type === 'escort') { const via = c.via || [], got = k.via[c.tag] || 0, to = got < via.length ? via[got] : c.to; out.push({ x: to[0], y: to[1] }); const t = tagged(c.tag); if (t && G.unitSeen(t.u)) out.push({ x: t.u.x, y: t.u.y, unit: true }); }
      }
      for (const c of L.lose || []) if (c.type === 'unitLost') { const t = tagged(c.tag); if (t && !out.some(o => o.unit && o.x === t.u.x && o.y === t.u.y)) out.push({ x: t.u.x, y: t.u.y, unit: true }); }
      return out;
    }
    // 判定。返回 'win' / 'lose' / ''
    function judge(why) {
      const S = S_(), k = S.camp, me = k.seat, turnStart = why === 'turn', newDay = turnStart && S.day !== k.lastDay;
      if (newDay) { // 一天结束时的累计：连续占有
        if (k.lastDay != null) for (const c of L.win || []) if (c.type === 'holdBuilding') { const key = c.at.join(); k.hb[key] = mine(ownerAt(c.at), c.by) ? (k.hb[key] || 0) + 1 : 0; }
        k.lastDay = S.day;
      }
      for (const c of L.win || []) if (c.type === 'escort') { const t = tagged(c.tag), via = c.via || []; if (t && !t.in) { const got = k.via[c.tag] || 0; if (got < via.length && dist([t.u.x, t.u.y], via[got]) <= 1) k.via[c.tag] = got + 1; } }
      for (const c of L.lose || []) {
        if (c.type === 'timeout' && S.day > c.day) return 'lose';
        if (c.type === 'unitLost' && !tagged(c.tag)) return 'lose';
        if (c.type === 'ownBelow' && (c.kind ? countKind(c.kind, o => o === me) : spots(c).filter(a => ownerAt(a) === me).length) < c.count) return 'lose';
        if (c.type === 'enemyOwn') for (let p = 1; p <= (S.players || 2); p++) if (G.isEnemy(me, p) && countKind(c.kind, o => o === p) >= c.count) return 'lose';
        if (c.type === 'allyDefeated') for (let p = 1; p <= (S.players || 2); p++) if (p !== me && !G.isEnemy(me, p) && !G.isAlive(p)) return 'lose';
      }
      if (!G.isAlive(me)) return 'lose';
      for (const c of L.win || []) {
        if (c.type === 'hold' && S.day > c.days) return 'win';
        if (c.type === 'capture') { const sp = spots(c); if (sp.length && sp.every(a => mine(ownerAt(a), c.by))) return 'win'; }
        if (c.type === 'holdBuilding' && (k.hb[c.at.join()] || 0) >= c.days) return 'win';
        if (c.type === 'own' && countKind(c.kind, o => o === me) >= c.count) return 'win';
        if (c.type === 'escort') { const t = tagged(c.tag); if (t && !t.in && (k.via[c.tag] || 0) >= (c.via || []).length && dist([t.u.x, t.u.y], c.to) <= (c.radius || 0)) return 'win'; }
        if (c.type === 'funds' && turnStart && S.turn === me && (S.funds[me] || 0) >= c.amount) return 'win';
      }
      return '';
    }
    // 关中对话的触发器（每个只触发一次）
    let snap = null;
    function triggers(why, arg) {
      const S = S_(), k = S.camp, me = k.seat, evs = (L.dialog || {}).events || [], m = S.map;
      const isBy = (p, by) => by === 'player' ? p === me : by === 'enemy' ? p && G.isEnemy(me, p) : by === 'team' ? p && !G.isEnemy(me, p) : p === by;
      const now = { own: m.owner.map(r => r.slice()), ids: new Map(S.units.map(q => [q.id, q])) }, old = snap || now; snap = now;
      const caps = []; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (old.own[y] && old.own[y][x] !== now.own[y][x] && now.own[y][x]) caps.push({ x, y, p: now.own[y][x], t: m.t[y][x] });
      const dead = []; for (const [id, q] of old.ids) if (!now.ids.has(id) && !S.units.some(u => (u.cargo || []).includes(q))) dead.push(q);
      evs.forEach((e, i) => {
        if (k.fired.includes(i)) return; const w = e.when || {}; let hit = false, at = null;
        if (w.type === 'day') hit = why === 'turn' && S.turn === me && S.day >= w.day;
        else if (w.type === 'capture' || w.type === 'captureAny') { const c = caps.find(c => isBy(c.p, w.by == null ? 'player' : w.by) && (!w.at || (c.x === w.at[0] && c.y === w.at[1])) && (!w.kind || (w.kind === 'income' ? D.TERRAIN[c.t].income : c.t === w.kind))); hit = !!c; if (c) at = [c.x, c.y]; }
        else if (w.type === 'destroyed') { const q = dead.find(q => (w.side === 'player' ? q.owner === me : G.isEnemy(me, q.owner)) && (!w.unit || q.type === w.unit) && (!w.tag || q.tag === w.tag)); hit = !!q; if (q) at = [q.x, q.y]; }
        else if (w.type === 'power') hit = why === 'power' && arg === w.co;
        else if (w.type === 'reach') { const t = tagged(w.tag); hit = !!t && !t.in && dist([t.u.x, t.u.y], w.at) <= 1; if (hit) at = w.at; }
        else if (w.type === 'funds') hit = (S.funds[me] || 0) >= w.amount;
        if (hit) { k.fired.push(i); talk(e.lines, at, evArt(i)); }
      });
    }
    // ui.js 在每次行动之后（'act'）、每个回合开始（'turn'）、发动技能（'power'）时叫一下
    function tick(why, arg) {
      const S = S_(); if (!S || !S.camp || S.winner) return; if (!L) attach(); if (!L) return;
      // 核心报的关中对话：C.takeTalks(s) 取走触发了的 dialog.events 下标（每个动作之后、每次换手之后各取一次）
      const evs = (L.dialog || {}).events || [];
      if (C.takeTalks) { try { for (const ix of C.takeTalks(S) || []) if (evs[ix] && evs[ix].lines) talk(evs[ix].lines, null, evArt(ix)); } catch (e) { console.error(e); } }
      // 回合开始和技能带来的事件（s.events）：涨水、增援、收购、挑拨——提示一句，镜头过去
      try { for (const e of S.events || []) { if (!e || e._ui) continue; e._ui = true; const t = Kit.t;
        if (e.type === 'flood' && (e.cells || []).length) { const mv = (e.moved || []).length, lost = (e.lost || []).length, v = { name: e.by ? G.pname(e.by) : '', cells: e.cells.length, pushed: mv, lost };   // 八种组合各一个整句键
          Kit.note(e.by ? (mv ? (lost ? t('{name}开闸放水：{cells} 格变为海洋，{pushed} 个单位被推开，{lost} 个单位被击毁', v) : t('{name}开闸放水：{cells} 格变为海洋，{pushed} 个单位被推开', v)) : (lost ? t('{name}开闸放水：{cells} 格变为海洋，{lost} 个单位被击毁', v) : t('{name}开闸放水：{cells} 格变为海洋', v)))
            : (mv ? (lost ? t('涨潮：{cells} 格变为海洋，{pushed} 个单位被推开，{lost} 个单位被击毁', v) : t('涨潮：{cells} 格变为海洋，{pushed} 个单位被推开', v)) : (lost ? t('涨潮：{cells} 格变为海洋，{lost} 个单位被击毁', v) : t('涨潮：{cells} 格变为海洋', v))), 3200); G.centerOn(e.cells[0][0], e.cells[0][1]); }
        else if (e.type === 'reinforce' && (e.units || []).length) { const u = e.units[0]; G.centerOn(u.x, u.y); Kit.note(t('{name}的增援到达：{n} 个单位', { name: G.pname(e.player), n: e.units.length }), 3200); }
        else if (e.type === 'buyout') { G.centerOn(e.x, e.y); Kit.note(t('{a}收购了{b}的一个单位', { a: G.pname(e.player), b: G.pname(e.from) }), 2800); }
        else if (e.type === 'frame' && (e.pairs || []).length) Kit.note(t('{name}挑拨：{n} 对单位互相开火', { name: G.pname(e.player), n: e.pairs.length }), 2800);
      } } catch (e) { console.error(e); }
      if (C.objectives && coreObj()) return;        // 目标由核心判定
      const coreTalk = !!C.takeTalks;
      try { if (!coreTalk) triggers(why, arg); const r = judge(why); if (r) { const me = S.camp.seat, team = p => (S.team ? S.team[p] : p);
        if (r === 'win') { S.winner = team(me); S.winners = G.plist().filter(p => team(p) === team(me)); } else { const foe = G.plist().find(p => G.isEnemy(me, p)) || 0; S.winner = team(foe); S.winners = G.plist().filter(p => team(p) === team(foe)); }
        S.reason = 'goal'; } } catch (e) { console.error(e); }
    }

    // ───────── 结算：结尾 / 失败对话 → 结算页 → （终章）尾声 → 回选关页 ─────────
    // 结算页上的一句原因：按核心给的 s.reason 取（显示的时候再取文字）
    const why = () => { const r = S_() && S_().reason, t = Kit.t; return ({ hq: t('占领敌方司令部'), rout: t('击毁敌方全部单位'), hold: t('坚守到了最后一天'), capture: t('占领了目标建筑'), holdBuilding: t('守住了目标建筑'), own: t('占有了足够的建筑'), escort: t('目标单位抵达目的地'), funds: t('资金达到目标'),
      timeout: t('限期已到'), unitLost: t('目标单位被击毁'), ownBelow: t('失去了必须守住的建筑'), enemyOwn: t('敌方抢先占有了足够的建筑'), allyDefeated: t('友方阵营败北'), loseHq: t('己方司令部被占领'), routed: t('己方单位全部被击毁'), resign: t('认输') })[r] || ''; };
    async function finish(won) {
      const S = S_(), l = L || lvOf(S.camp.id), days = S.day, g = G.gid; G.clearSave();
      await talk(won ? (l.dialog || {}).outro : (l.dialog || {}).fail, null, CGP() ? CGP().lineArt(l.id, won ? 'outro' : 'fail') : null); if (g !== G.gid) return;
      if (won && CGP() && CGP().has('after:' + l.id)) { await CGP().playKey('after:' + l.id); if (g !== G.gid) return; }
      const was = bestDays(l.id), un = l.unlock || {}; let first = won && !isDone(l.id), newCodex = won ? (un.codex || []).filter(id => A.codex && A.codex[id] && !codexOpen().includes(id)) : [], newCos = won && first ? (un.cos || []) : [];
      if (won) { const R = Run(); let r = null; try { if (R) r = R.complete(l.id, { days, seat: S.camp.seat, co: S.camp.co }); } catch (e) { console.error(e); }
        if (r) { first = !!r.first; newCodex = r.codex || newCodex; newCos = r.cos || newCos; } else if (!R) { P.done[l.id] = Math.min(P.done[l.id] || 999, days); P.codex.push(...newCodex); }
        save(); }
      const i = LV.indexOf(l), nextL = won && LV[i + 1], last = won && i === LV.length - 1, me = S.camp.seat;
      const back = () => { if (last && CGP() && CGP().has('ending')) CGP().playKey('ending').then(() => select(l.id)); else if (last && A.epilogue && A.epilogue.length) narrate(T('尾声'), A.epilogue.map(x => x.text), () => select(l.id)); else select(nextL ? nextL.id : l.id); };
      const scr = Kit.screen({ id: 'over', cls: 'over cpres' + (won ? '' : ' lost'), html: `<div class="ps">${Kit.port(S.camp.co, won ? 'power' : 'lose')}</div><div class="rt"><div class="big ol" style="font-size:max(60px,170r)">${esc(won ? T('作战成功') : T('作战失败'))}</div>` +
        `<div class="who ol">${esc(l.no)}　${esc(l.title)}</div>${why() ? `<div class="why">${esc(why())}</div>` : ''}<div class="tiles">${Kit.tile(days, T('用时（天）'), Kit.ic('day', 's'))}${Kit.tile(S.units.filter(u => u.owner === me).length, T('剩余单位'))}${Kit.tile(C.props(S, me), T('建筑'))}${won && was && was < days ? Kit.tile(was, T('最快纪录')) : ''}</div>` +
        (won && (newCos.length || newCodex.length) ? `<h4 style="margin:0;color:var(--gold)">${esc(T('解锁'))}</h4><div class="un">${newCos.filter(co).map(id => Kit.head(id, co(id).faction, 76)).join('')}${newCodex.map(id => `<span class="tag">${esc(T('档案：{name}', { name: A.codex[id].title }))}</span>`).join('')}</div>` : '') +
        `<div class="btns" style="display:none"><button class="nav item" id="cpNext">${esc(won ? (last ? T('尾声') : T('下一关')) : T('重试'))}</button><button class="nav item" id="cpBack">${esc(T('返回选关'))}</button></div></div>`,
        onCancel: () => { sfx.back(); select(l.id); }, keys: { ok: () => $('cpNext').click() },
        flow: true, hints: [['a', won ? (last ? '尾声' : '下一关') : '重试'], ['b', '返回选关']] });   // 和自由对局结算页一致：右下金色主按钮，左下次级按钮；面板里那两个按钮留给脚本，不显示
      scr.el.style.cssText = Kit.pcs(won ? G.fac(me) : 0);
      if (won && root.AWRankUI) { const hm = []; hm[me] = true; root.AWRankUI.result(scr.el.querySelector('.rt'), { S, human: hm }); }   // 三项分和评级章（ui-rank.js）
      $('cpNext').onclick = () => { sfx.ok(); if (won) back(); else { select(l.id); enter(l); } };
      $('cpBack').onclick = () => { sfx.ok(); select(l.id); };
    }

    return { abort, list, coOpen, coName, levelOpen: id => { const i = LV.findIndex(l => l.id === id); return i >= 0 && unlocked(i); }, get world() { return World; }, select, enter, narrate, brief, start, attach, talk, idle, tick, goalLines, marks, finish, progress: P, get level() { return L; }, get talking() { return !!dlgOn; },
      get any() { return LV.some(l => isDone(l.id)); }, unlockedCodex: codexOpen, isDone, reset() { P.done = {}; P.acts = []; P.codex = []; save(); try { if (Run()) Run().reset(); } catch (e) { } } };
  };
})(window);
