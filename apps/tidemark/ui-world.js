// 潮汐战线：战役的世界地图选关（window.AWWorldUI(G, api)）。数据在 campaign.js 的 AWCampaign.world（regions / places / routes / acts / reveals），
// 图在 world.js（AWWorldArt：底图、四档潮水、隐藏层、云雾），叠放顺序见 tools/WORLD-ART.md。
// 一张衡海全图铺满屏幕：据点是图上的节点（可打的有脉冲光圈和阵营旗，通关的插胜方小旗），路线按通关顺序画出，没到过的区域盖云雾，潮线随进度上涨。
// 光标在据点间跳（方向键找那个方向上最近的据点，鼠标触屏直接点），选中弹一张小卡，确定进关前页。进新的一幕：镜头平移过去，旁白叠在地图上。
// 四角只放：左上战役名和当前幕、右上进度、右下“关卡一览”（旧的列表）。
(function (root) {
  'use strict';
  root.AWWorldUI = function (G, api) {
    const { D, Kit, sfx } = G, esc = Kit.esc, Nav = Kit.Nav, t = Kit.t, $ = id => document.getElementById(id);
    const A = root.AWCampaign, W = A && A.world; if (!W || !Array.isArray(W.places)) return null;
    const ART = () => root.AWWorldArt || null;
    const ZMAX = 1.6;                                   // 底图只有 1499 宽，再放大就糊
    Kit.css(`
    #world { background:#0a1422 !important; padding:0; } #world::before { display:none; } #world canvas { position:absolute; left:0; top:0; width:100%; height:100%; touch-action:none; cursor:grab; }
    #world .crumb { z-index:5; } #world .prog { position:absolute; right:120r; top:22r; z-index:5; padding:8r 22r; font-size:max(20px,30r); font-weight:900; color:var(--gold2); display:flex; align-items:center; gap:10r; }
    #world .agoal { position:absolute; left:36r; top:112r; z-index:5; max-width:760r; padding:6r 20r; display:flex; align-items:center; gap:10r; font-size:max(20px,26r); line-height:1.3; color:var(--txt); } body.narrow #world .agoal { max-width:62vw; }
    #world .lst { position:absolute; right:24r; bottom:108r; z-index:5; padding:10r 24r; font-size:max(20px,28r); font-weight:900; display:flex; align-items:center; gap:10r; cursor:pointer; color:var(--txt); }
    #world .lst { display:none; } body.narrow #world .lst { display:flex; }   /* “关卡一览”平时在底部那一排里；手机竖屏那一排只留主次两个按钮，这个入口单独放在右上 */
    /* 小卡顶部的关卡插图（16:9）：下缘压一条暗渐变，放关卡编号和难度；选中时轻微推近 */
    #wcard.art { width:max(640r, 32vw); padding-top:0; } #wcard .im { position:relative; margin:0 -20r 4r; aspect-ratio:16/9; overflow:hidden; background:#0c1020; } #wcard .im img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; animation:wcPush 6s ease-out both; } @keyframes wcPush { from { transform:scale(1); } to { transform:scale(1.12); } }
    #wcard .im::after { content:""; position:absolute; inset:45% 0 0; background:linear-gradient(transparent, rgba(8,12,24,.92)); } #wcard .im .no { position:absolute; left:20r; right:20r; bottom:8r; z-index:1; text-shadow:0 2r 0 #000; } #wcard .im.noart { display:none; }
    body.narrow #wcard .im { aspect-ratio:21/9; } body.small:not(.narrow) #wcard .im { aspect-ratio:3/1; } body.small:not(.narrow) #wcard.art { width:320px; }
    /* 左上角的章节横幅：这一幕的插图缩略图 + 战役名、幕名、进度 + 一句话目标 */
    #world .chap { position:absolute; left:36r; top:22r; z-index:5; display:flex; align-items:stretch; gap:14r; max-width:62vw; } #world .chap .col { display:flex; flex-direction:column; gap:10r; align-items:flex-start; min-width:0; } #world .chap .crumb, #world .chap .agoal { position:static; } #world .chap .crumb small { font-size:max(20px,26r); color:var(--gold2); margin-left:6r; }
    #world .chap .th { flex:none; align-self:flex-start; height:150r; aspect-ratio:16/9; object-fit:cover; border-radius:10r; box-shadow:0 0 0 5r var(--line), 0 0 0 8r var(--gold), 0 8r 0 rgba(0,0,0,.4); } body.narrow #world .chap { left:12r; max-width:74vw; flex-direction:column; gap:8r; } body.narrow #world .chap .th { height:110r; } body.small:not(.narrow) #world .chap .th { height:120r; }
    #chapBig { position:fixed; z-index:9; left:50%; top:46%; width:min(62vw, 110vh); aspect-ratio:16/9; translate:-50% -50%; background:#0c1020 center/cover no-repeat; border-radius:14r; box-shadow:0 0 0 6r var(--line), 0 0 0 10r var(--gold), 0 30r 80r rgba(0,0,0,.7); display:flex; align-items:flex-end; pointer-events:none; } #chapBig b { width:100%; padding:60r 40r 22r; font-size:max(28px,64r); font-weight:900; color:#fff3d0; background:linear-gradient(transparent, rgba(8,12,24,.92)); border-radius:0 0 14r 14r; }
    #wcard { position:absolute; z-index:6; width:620r; padding:14r 20r 16r; display:flex; flex-direction:column; gap:8r; cursor:pointer; animation:scrPop .14s both; }
    #wcard .no { display:flex; align-items:center; gap:10r; font-size:max(20px,24r); color:var(--gold); } #wcard .no .ic { width:36r; height:36r; } #wcard .no i { font-style:normal; margin-left:auto; color:var(--green); font-weight:900; } #wcard .no i.lk { color:var(--mut); }
    #wcard b.tt { font-size:max(26px,46r); font-weight:900; line-height:1.1; color:#fff3d0; } #wcard .pl { font-size:max(20px,24r); color:var(--mut); line-height:1.3; } #wcard .hl { font-size:max(20px,26r); line-height:1.35; }
    #wcard .vs2 { display:flex; align-items:center; gap:10r; font-size:max(20px,24r); color:var(--gold); font-weight:900; } #wcard .hd { width:72r; height:72r; } #wcard .hd.sil { filter:brightness(0) drop-shadow(0 0 2r #8ab); }
    #wnar { position:absolute; left:8%; right:8%; bottom:110r; z-index:8; padding:22r 36r 26r; display:flex; flex-direction:column; gap:10r; cursor:pointer; background:rgba(8,12,24,.88) !important; }
    #wnar h2 { margin:0; font-size:max(24px,40r); color:var(--gold); } #wnar p { margin:0; font-size:max(20px,34r); line-height:1.5; font-weight:800; animation:narIn .5s ease-out both; }
    body.narrow #wcard { width:auto; left:12r !important; right:12r; top:auto !important; bottom:max(64px,130r); } body.narrow #world .lst { bottom:auto; top:120r; right:12r; } body.narrow #world .prog { right:110r; } body.narrow #wnar { left:3%; right:3%; bottom:max(64px,130r); }
    body.small:not(.narrow) #wcard { width:300px; }
    `);
    const placeOf = id => W.places.find(p => p.id === id), done = id => !id || api.isDone(id);
    const LV = api.LV, lvAt = pid => LV.filter(l => l.place === pid);
    // 这个据点现在该打哪一关：第一关没通关的已解锁关卡，都通关了就是最后一关；一关都没解锁返回 null
    const levelAt = pid => { const ls = lvAt(pid).filter(l => api.unlocked(LV.indexOf(l))); return ls.find(l => !api.isDone(l.id)) || ls[ls.length - 1] || null; };
    const nextLevel = () => LV.find((l, i) => api.unlocked(i) && !api.isDone(l.id)) || null;
    const curAct = () => { const n = nextLevel(); return n ? n.act : (LV[LV.length - 1] || {}).act; };
    const tideNow = () => { const n = nextLevel(); if (!n) return W.tideEnd != null ? W.tideEnd : 1; const a = (W.acts || []).find(x => x.act === n.act); return a ? a.tide : 0; };
    const facColor = f => (f ? Kit.pal(f) : { d: '#555c70', m: '#8a93ad', l: '#c9d0e4', h: '#f4efe0', o: '#1a1d2b' });

    let scr = null, cv = null, c = null, raf = 0, cam = { x: 500, y: 350, z: 1 }, camTo = null, sel = null, tide = 0, tideFrom = 0, tideT0 = 0, hidA = 0, fog = null, fogKey = '', busy = false, born = 0;
    const size = () => W.size || [1000, 700];
    // 屏幕 ↔ 世界：zoom 1 = 整张图刚好盖满屏幕
    const fit = () => Math.max(innerWidth / size()[0], innerHeight / size()[1]);
    const zmin = () => Math.min(innerWidth / size()[0], innerHeight / size()[1]) / fit() * 0.96;   // 全景：整张图都看得见
    const k = () => fit() * cam.z;
    const toS = (x, y) => [(x - cam.x) * k() + innerWidth / 2, (y - cam.y) * k() + innerHeight / 2];
    const toW = (sx, sy) => [(sx - innerWidth / 2) / k() + cam.x, (sy - innerHeight / 2) / k() + cam.y];
    function clampCam(q) {
      q.z = Math.max(zmin(), Math.min(ZMAX, q.z)); const kk = fit() * q.z, hw = innerWidth / 2 / kk, hh = innerHeight / 2 / kk;
      // 全景（比“盖满”还小）时那个方向上放不满：居中，四周留深色边
      q.x = hw * 2 >= size()[0] ? size()[0] / 2 : Math.max(hw, Math.min(size()[0] - hw, q.x)); q.y = hh * 2 >= size()[1] ? size()[1] / 2 : Math.max(hh, Math.min(size()[1] - hh, q.y)); return q;
    }
    function moveCam(x, y, z, ms) { const to = clampCam({ x, y, z: z == null ? cam.z : z }); if (!ms) { cam = to; camTo = null; return; } camTo = { fx: cam.x, fy: cam.y, fz: cam.z, x: to.x, y: to.y, z: to.z, t0: performance.now(), ms }; }
    // 这一幕的取景：这一幕所有据点的包围盒（数据里的镜头参数放大倍数超过上限，位置也不一定对，所以自己算）
    function frameAct(act, ms) {
      const ps = LV.filter(l => l.act === act).map(l => placeOf(l.place)).filter(Boolean); if (!ps.length) return;
      const xs = ps.map(p => p.at[0]), ys = ps.map(p => p.at[1]), x0 = Math.min(...xs) - 90, x1 = Math.max(...xs) + 90, y0 = Math.min(...ys) - 90, y1 = Math.max(...ys) + 90;
      const z = Math.min(innerWidth / fit() / (x1 - x0), innerHeight / fit() / (y1 - y0));
      moveCam((x0 + x1) / 2, (y0 + y1) / 2, z, ms);
    }
    // 看得见的据点：有已解锁的关卡；或者是当前这一幕里还没解锁的（画成暗点）。hiddenUntil 没到的不出现
    function nodes() {
      const act = curAct(), out = [];
      for (const p of W.places) {
        if (p.hiddenUntil && !done(p.hiddenUntil)) continue;
        const ls = lvAt(p.id); if (!ls.length) continue;
        const l = levelAt(p.id);
        if (l) out.push({ p, l, open: !api.isDone(l.id), done: ls.some(x => api.isDone(x.id)) });
        // 还进不去的据点不画（原来画成暗点，能选中却进不去）
      }
      return out;
    }
    const revealed = () => { const s = new Set(); for (const r of W.reveals || []) if (done(r.after)) (r.regions || []).forEach(id => s.add(id)); return s; };

    // ── 云雾：没揭开的区域盖一层缓慢漂移的云；看得见的据点周围挖一个洞 ──
    function drawFog(now) {
      const art = ART(), rv = revealed(), hide = (W.regions || []).filter(r => !rv.has(r.id) && !(r.hiddenUntil && !done(r.hiddenUntil)) && (r.poly || r.radius));
      if (!hide.length || !art || !art.cloud.img.naturalWidth) return;
      // 云雾本来就是糊的：在四分之一分辨率的小画布上画（羽化的 blur 滤镜在全分辨率上每帧跑会把整个页面拖卡），再放大贴回去
      const FQ = 0.25, fw = Math.max(2, Math.round(innerWidth * FQ)), fh = Math.max(2, Math.round(innerHeight * FQ));
      if (!fog || fog.width !== fw || fog.height !== fh) { fog = document.createElement('canvas'); fog.width = fw; fog.height = fh; }
      const g = fog.getContext('2d'), dpr = FQ; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fog.width, fog.height); g.globalCompositeOperation = 'source-over';
      const path = (r) => { g.beginPath(); if (r.poly) r.poly.forEach((q, i) => { const s = toS(q[0], q[1]); if (i) g.lineTo(s[0] * dpr, s[1] * dpr); else g.moveTo(s[0] * dpr, s[1] * dpr); }); else { const s = toS(r.center[0], r.center[1]); g.arc(s[0] * dpr, s[1] * dpr, r.radius * k() * dpr, 0, 7); } g.closePath(); };
      // 先画出要盖的区域（带羽化），再只在这些区域里铺云
      g.filter = `blur(${Math.max(1, Math.round(14 * k() * dpr / fit()))}px)`; g.fillStyle = '#000'; for (const r of hide) { path(r); g.fill(); }
      // 已揭开的区域（比如海床中间的潮眼）和看得见的据点周围不盖
      g.globalCompositeOperation = 'destination-out';
      for (const r of W.regions || []) if (rv.has(r.id) && (r.poly || r.radius)) { path(r); g.fill(); }
      for (const n of nodes()) { const s = toS(n.p.at[0], n.p.at[1]), rad = (n.dim ? 26 : 62) * k() * dpr; const gr = g.createRadialGradient(s[0] * dpr, s[1] * dpr, rad * 0.3, s[0] * dpr, s[1] * dpr, rad); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(s[0] * dpr, s[1] * dpr, rad, 0, 7); g.fill(); }
      g.filter = 'none'; g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#c9d6e8'; g.fillRect(0, 0, fog.width, fog.height);
      g.globalCompositeOperation = 'source-atop';
      for (const [sp, a, sc] of [[0.006, 0.9, 0.5], [-0.011, 0.6, 0.8]]) { const pt = g.createPattern(art.cloud.img, 'repeat'), kk = k() * dpr * sc; pt.setTransform(new DOMMatrix([kk, 0, 0, kk, (-cam.x * k() + now * sp) * dpr, (-cam.y * k() + now * sp * 0.4) * dpr])); g.globalAlpha = a; g.fillStyle = pt; g.fillRect(0, 0, fog.width, fog.height); }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      c.globalAlpha = 0.94; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(fog, 0, 0, innerWidth, innerHeight); c.globalAlpha = 1;
    }
    function label(text, x, y, px, col, a) { c.font = '900 ' + px + 'px ' + Kit.font(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = a == null ? 1 : a; c.lineJoin = 'round'; c.lineWidth = Math.max(3, px / 5); c.strokeStyle = 'rgba(10,14,28,.85)'; c.strokeText(text, x, y); c.fillStyle = col; c.fillText(text, x, y); c.globalAlpha = 1; }
    function flag(x, y, P, s, wave) { // 小旗：旗杆 + 阵营色旗面
      c.fillStyle = '#0e1220'; c.fillRect(x - s * 0.08, y - s * 1.25, s * 0.2, s * 1.3); c.fillStyle = '#e9edf8'; c.fillRect(x - s * 0.04, y - s * 1.2, s * 0.1, s * 1.2);
      c.beginPath(); c.moveTo(x + s * 0.06, y - s * 1.2); c.lineTo(x + s * 0.95, y - s * (0.95 + wave * 0.06)); c.lineTo(x + s * 0.06, y - s * 0.62); c.closePath(); c.fillStyle = P.m; c.fill(); c.lineWidth = Math.max(2, s * 0.09); c.strokeStyle = '#0e1220'; c.stroke();
    }
    let bgc = null, bgKey = '';
    function draw(now) {
      const art = ART(), dpr = root.devicePixelRatio || 1, Wd = innerWidth, Hd = innerHeight;
      if (cv.width !== Math.round(Wd * dpr) || cv.height !== Math.round(Hd * dpr)) { cv.width = Math.round(Wd * dpr); cv.height = Math.round(Hd * dpr); clampCam(cam); }
      if (camTo) { const u = Math.min(1, (now - camTo.t0) / camTo.ms), e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u); const z = camTo.fz + (camTo.z - camTo.fz) * e, q = camTo.fz / z * (1 - e); cam = { x: camTo.x - (camTo.x - camTo.fx) * q, y: camTo.y - (camTo.y - camTo.fy) * q, z };   /* 边推近边平移：目标点在屏幕上走直线到中心（位置和缩放各自线性插值时，竖屏上目标会先滑出屏幕再回来） */ if (u >= 1) camTo = null; }
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0a1422'; c.fillRect(0, 0, Wd, Hd); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      const o = toS(0, 0), mw = size()[0] * k(), mh = size()[1] * k(), layer = (L, a) => { if (!L || !L.img.naturalWidth || a <= 0) return; c.globalAlpha = a; c.drawImage(L.img, o[0], o[1], mw, mh); c.globalAlpha = 1; };
      if (art) {
        // 潮水：换了进度就用 2.6 秒涨过去
        const tg = tideNow(); if (tg !== tideFrom.to) { tideFrom = { from: tide, to: tg }; tideT0 = now; } const u = Math.min(1, (now - tideT0) / 2600); tide = tideFrom.from + (tg - tideFrom.from) * (u * u * (3 - 2 * u));
        const ta = art.tideAlpha(tide), hid = (W.regions || []).some(r => r.hiddenUntil && done(r.hiddenUntil)); hidA += ((hid ? 1 : 0) - hidA) * 0.03;
        // 底图和潮水层很大：镜头和水位不动时先合成到一张和屏幕一样大的缓存里，之后每帧只贴这一张
        const ready = art.base.img.naturalWidth && art.tide.every(L => !L || L.img.naturalWidth), still = !camTo && u >= 1 && ready;
        const bkey = still ? [cv.width, cv.height, cam.x.toFixed(2), cam.y.toFixed(2), cam.z.toFixed(4), tide.toFixed(3)].join('|') : '';
        if (still) {
          if (bgKey !== bkey) {
            if (!bgc || bgc.width !== cv.width || bgc.height !== cv.height) { bgc = document.createElement('canvas'); bgc.width = cv.width; bgc.height = cv.height; }
            const g2 = bgc.getContext('2d'); g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.fillStyle = '#0a1422'; g2.fillRect(0, 0, Wd, Hd); g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high';
            const put = (L, al) => { if (!L || !L.img.naturalWidth || al <= 0) return; g2.globalAlpha = al; g2.drawImage(L.img, o[0], o[1], mw, mh); g2.globalAlpha = 1; };
            put(art.base, 1); for (let i = 0; i < 4; i++) put(art.tide[i], ta[i]); bgKey = bkey;
          }
          c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(bgc, 0, 0); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        } else { bgKey = ''; c.imageSmoothingQuality = 'low'; layer(art.base, 1); for (let i = 0; i < 4; i++) layer(art.tide[i], ta[i]); c.imageSmoothingQuality = 'high'; }
        // 隐藏层（铁轨、绞盘塔、青白光）是立在水面上的东西：画在潮水之上；水漫过海床以后整层压到六成（图层分不出哪些像素在水下）
        layer(art.hidden, hidA * (0.8 + 0.2 * Math.sin(now / 500)) * (1 - 0.4 * Math.min(1, ta[1] * 1.5)));
      } else label(t('载入地图…'), Wd / 2, Hd / 2, 30, '#f4efe0');
      const ns = nodes(), rv = revealed(), r1 = Kit.s;
      // 区域名：画在各区域中心，淡一点
      for (const r of W.regions || []) { if (r.hiddenUntil && !done(r.hiddenUntil)) continue; if (!rv.has(r.id)) continue; const s = toS(r.center[0], r.center[1] - (r.radius ? r.radius + 14 : 0)); label(r.name, s[0], s[1], Math.max(18, 30 * r1) * Math.sqrt(cam.z), r.faction ? facColor(r.faction).h : '#dfe6f4', 0.78); }
      // 路线：通关一关画出一段，虚线往前走
      c.lineCap = 'round';
      const shownR = (W.routes || []).filter(rt => done(rt.after) && placeOf(rt.from) && placeOf(rt.to) && !(placeOf(rt.to).hiddenUntil && !done(placeOf(rt.to).hiddenUntil)));
      shownR.forEach((rt, ri) => { const a = placeOf(rt.from), b = placeOf(rt.to), old = ri < shownR.length - 3;   // 走过很久的路线画细画淡，最近三段是亮的、会动
        const p = toS(a.at[0], a.at[1]), q = toS(b.at[0], b.at[1]), mx = (p[0] + q[0]) / 2 + (q[1] - p[1]) * 0.12, my = (p[1] + q[1]) / 2 - (q[0] - p[0]) * 0.12;
        for (const [col, w, dash] of old ? [['rgba(255,236,170,.38)', 2.5, [6, 10]]] : [['rgba(10,14,28,.8)', 9, null], ['#ffe08a', 4.5, [14, 12]]]) { c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(mx, my, q[0], q[1]); c.strokeStyle = col; c.lineWidth = w * r1 * Math.sqrt(cam.z); c.setLineDash(dash ? dash.map(v => v * r1) : []); c.lineDashOffset = dash && !old ? -now / 45 : 0; c.stroke(); } });
      c.setLineDash([]);
      drawFog(now);
      // 小卡到据点的连线
      const cd = $('wcard'), sn = cd && !Kit.narrow && ns.find(n => n.p.id === sel);
      if (sn) { const r = cd.getBoundingClientRect(), s = toS(sn.p.at[0], sn.p.at[1]), ex = cd.dataset.side === 'r' ? r.left : r.right, ey = Math.max(r.top + 20, Math.min(r.bottom - 20, s[1]));
        for (const [col, w] of [['rgba(10,14,28,.85)', 6], ['#ffe08a', 2.5]]) { c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(ex, ey); c.strokeStyle = col; c.lineWidth = w * r1; c.stroke(); } }
      // 据点
      for (const n of ns) {
        const s = toS(n.p.at[0], n.p.at[1]), on = sel === n.p.id, R = (n.dim ? 8 : 15) * r1 * Math.sqrt(cam.z);
        if (n.dim) { c.beginPath(); c.arc(s[0], s[1], R, 0, 7); c.fillStyle = 'rgba(20,26,44,.8)'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(200,210,230,.5)'; c.stroke(); continue; }
        const ps = api.playerSide(n.l), turned = n.p.turns && done(n.p.turns.after) ? n.p.turns.faction : 0, P = facColor(turned || ps.faction || ps.seat);
        if (n.open) for (let i = 0; i < 2; i++) { const u = ((now / 1400) + i * 0.5) % 1; c.beginPath(); c.arc(s[0], s[1], R * (1 + u * 2.4), 0, 7); c.lineWidth = 4 * r1; c.strokeStyle = `rgba(255,214,90,${(1 - u) * 0.9})`; c.stroke(); }
        c.beginPath(); c.arc(s[0], s[1], R + 4 * r1, 0, 7); c.fillStyle = '#0e1220'; c.fill(); c.beginPath(); c.arc(s[0], s[1], R, 0, 7); c.fillStyle = n.open ? '#ffd24a' : P.m; c.fill(); c.beginPath(); c.arc(s[0], s[1], R * 0.45, 0, 7); c.fillStyle = n.open ? '#fff' : P.h; c.fill();
        if (n.done || n.open) flag(s[0], s[1] - R * 0.6, P, R * 1.9, Math.sin(now / 300 + n.p.at[0]));
        if (on) { const q = R + (10 + 3 * Math.sin(now / 160)) * r1; c.lineWidth = 5 * r1; c.strokeStyle = '#fff'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(s[0], s[1], q, i * Math.PI / 2 + 0.25 + now / 900, i * Math.PI / 2 + 1.3 + now / 900); c.stroke(); } }
        if (root.AWRankUI && n.l) root.AWRankUI.drawPin(c, s[0], s[1], R, n.l.id);   // 这一关的评级（ui-rank.js）
        label(n.p.name, s[0], s[1] + R + 20 * r1, Math.max(16, 24 * r1), on ? '#ffe08a' : '#f4efe0');
      }
    }
    // 空闲降耗：镜头不动、潮水不在涨落、没有输入时每秒画 12 帧；页面不可见时不画
    let lastDrawT = 0, lastSig = '';
    function loop(now) {
      if (!scr || !scr.on || !scr.el.isConnected) return;   // 页面已经被换掉（同名的新页面顶替了旧的）：这条循环就此停下，不再对着看不见的画布重画
      raf = requestAnimationFrame(loop); if (document.hidden) return;
      const sig = [cam.x.toFixed(2), cam.y.toFixed(2), cam.z.toFixed(4), (+tide || 0).toFixed(3), hidA.toFixed(2), sel].join('|');   // 上一帧画完以后镜头、水位、隐藏层有没有变
      if (!(camTo || busy || !Kit.idle(now) || sig !== lastSig) && now - lastDrawT < Kit.IDLE_MS) return;
      lastSig = sig; lastDrawT = now; root.AWWorldUI.draws = (root.AWWorldUI.draws || 0) + 1; try { draw(now); } catch (e) { console.error(e); }
    }

    // ── 小卡 ──
    function card() {
      const old = $('wcard'); if (old) old.remove(); if (!sel || busy) return;
      const n = nodes().find(x => x.p.id === sel); if (!n) return;
      const e = document.createElement('div'); e.id = 'wcard'; e.className = 'pn gold'; const CGP = root.AWCG && root.AWCGPlayer && root.AWCGPlayer.levelArt ? root.AWCGPlayer : null, im = !n.dim && CGP ? CGP.levelArt(n.l.id, true) : '';
      if (n.dim) e.innerHTML = `<div class="no">${esc(n.p.name)}<i class="lk">${esc(t('未解锁'))}</i></div><div class="pl">${esc(n.p.note || '')}</div>`;
      else { const l = n.l, ps = api.playerSide(l), foes = l.sides.filter(s => s.team !== ps.team), all = lvAt(n.p.id), hd = s => { const id = s.co || (s.cos || [])[0], show = api.coOpen(id); return Kit.head(show ? id : 'rand', s.faction || s.seat, 72).replace('class="hd"', 'class="hd' + (show ? '' : ' q') + '"'); };
        const no = `<div class="no" style="${Kit.pcs(ps.faction || ps.seat)}">${Kit.emblem(ps.faction || ps.seat)}${esc(l.no)}　${'★'.repeat(l.difficulty || 1)}${all.length > 1 ? '　' + t('{a}/{b}', { a: all.indexOf(l) + 1, b: all.length }) : ''}${api.isDone(l.id) ? `<i>✓ ${esc(t('通关'))}</i>` : ''}${root.AWRankUI ? root.AWRankUI.levelBadge(l.id, 's') : ''}</div>`;
        if (im) e.classList.add('art');
        e.innerHTML = (im ? `<div class="im"><img alt="" src="${esc(im)}">${no}</div>` : no) + `<b class="tt">${esc(l.title)}</b>` +
          `<div class="pl">${esc(n.p.name)}　${esc(n.p.note || '')}</div>${l.highlight ? `<div class="hl">${esc(l.highlight)}</div>` : ''}<div class="vs2">${hd(ps)}VS${foes.slice(0, 3).map(hd).join('')}</div>`; }
      const ig = e.querySelector('.im img'); if (ig) ig.onerror = () => { const b = e.querySelector('.im'), nn = b.querySelector('.no'); e.insertBefore(nn, b); b.remove(); e.classList.remove('art'); };   // 图没到位：退回没有插图的样子
      scr.el.appendChild(e); Kit.hydrate(e); e.querySelectorAll('.hd.q').forEach(h => { h.textContent = '?'; h.style.cssText += ';display:inline-flex;align-items:center;justify-content:center;font-size:calc(44 * var(--r));font-weight:900;color:#fff'; });
      e.onclick = ev => { ev.stopPropagation(); go(); };
      // 停靠在屏幕一侧：据点在左半屏卡片靠右，反之靠左；画一条细线连到据点（见 draw）
      const sp = toFinal(n.p.at), w = e.offsetWidth, h = e.offsetHeight, m = 28 * Kit.s, right = sp[0] < innerWidth / 2;
      e.style.left = Math.round(right ? innerWidth - w - m : m) + 'px'; e.style.top = Math.round(Math.max(120 * Kit.s, Math.min(innerHeight - Kit.barH() - 24 * Kit.s - h - 12, sp[1] - h / 2))) + 'px'; e.dataset.side = right ? 'r' : 'l';
    }
    const toFinal = at => { const q = camTo ? { x: camTo.x, y: camTo.y, z: camTo.z } : cam, kk = fit() * q.z; return [(at[0] - q.x) * kk + innerWidth / 2, (at[1] - q.y) * kk + innerHeight / 2]; };
    function pick(id, quiet) {
      sel = id; const p = placeOf(id); if (!p) return;
      // 选中的据点离屏幕边太近就把镜头带过去
      const s = toFinal(p.at), mx = innerWidth * 0.22, my = innerHeight * 0.24; if (s[0] < mx || s[0] > innerWidth - mx || s[1] < my || s[1] > innerHeight - my) moveCam(p.at[0], p.at[1], null, 380);
      if (!quiet) sfx.tick(); card(); Kit.paintHints(true);
    }
    // 方向键：那个方向上（±60° 的扇面里）最近的据点
    function step(dx, dy) {
      const ns = nodes(), me = placeOf(sel); if (!me) { const n = ns.find(x => x.open) || ns[0]; if (n) pick(n.p.id); return; }
      let best = null, bs = Infinity; for (const n of ns) { if (n.p.id === sel) continue; const vx = n.p.at[0] - me.at[0], vy = n.p.at[1] - me.at[1], along = vx * dx + vy * dy, side = Math.abs(vx * dy - vy * dx); if (along <= 0 || side > along * 1.75) continue; const sc = along + side * 1.6; if (sc < bs) { bs = sc; best = n; } }
      if (best) pick(best.p.id);
    }
    function go() { const n = nodes().find(x => x.p.id === sel); if (!n || busy) return; if (n.dim) { sfx.no(); return Kit.note(t('通关上一关后解锁')); } sfx.ok(); api.brief(n.l); }

    // ── 叠在地图上的旁白（幕前、开场）──
    function narrate(title, parts, doneCb) {
      busy = true; card(); let i = 0; const e = document.createElement('div'); e.id = 'wnar'; e.className = 'pn'; e.innerHTML = title ? `<h2>${esc(title)}</h2>` : ''; scr.el.appendChild(e);
      const fin = () => { busy = false; ov.close(true); e.remove(); doneCb(); };
      const next = () => { if (i >= parts.length) return fin(); const p = document.createElement('p'); p.textContent = parts[i++]; e.appendChild(p); while (e.querySelectorAll('p').length > 3) e.querySelector('p').remove(); sfx.tick(); Kit.paintHints(true); };
      const ov = Kit.screen({ id: 'wNarOv', cls: 'clear', html: '', onCancel: fin, keys: { ok: next, start: fin, y: fin }, hints: () => [['a', i >= parts.length ? '继续' : '下一句'], ['b', '跳过']] });
      ov.el.style.animation = 'none'; ov.el.onclick = next; e.onclick = next; next();
    }
    const sentences = s => Kit.sentences(s);
    // 进地图之后该演什么：第一次进 → 开场（远景推到第一关）；进了新的一幕 → 镜头过去 + 幕前旁白；隐藏层刚揭开 → 推到潮眼
    function stage(focusId) {
      const P = api.P, n = nextLevel(), act = curAct(), a = A.acts.find(x => x.id === act), land = () => { const id = focusId && lvAt((api.lvOf(focusId) || {}).place).length ? api.lvOf(focusId).place : (n ? n.place : null); const tgt = (n && n.place) || id; if (tgt) pick(tgt, true); };
      // 过场动画（cg.js）：第一次进战役播开场，每幕第一次进入播那一幕的；播完回到这里接着演地图上的部分
      const CGP = root.AWCGPlayer, ck = n && !P.acts.length && CGP && CGP.has('opening') && !CGP.seen('opening') ? 'opening' : n && CGP && !P.acts.includes(act) && CGP.has('act:' + act) && !CGP.seen('act:' + act) ? 'act:' + act : '';
      if (ck) { busy = true; return void CGP.playKey(ck).then(() => { busy = false; if (scr && scr.on) stage(focusId); }); }
      const hidR = (W.regions || []).find(r => r.hiddenUntil && done(r.hiddenUntil));
      if (hidR && !P.seenHidden) { P.seenHidden = true; api.save(); hidA = 0; busy = true; moveCam(hidR.center[0], hidR.center[1], ZMAX, 1800); const rv = (W.reveals || []).find(r => (r.regions || []).includes(hidR.id));
        return setTimeout(() => { if (!scr || !scr.on) return; narrate('', sentences(t('海眼中心亮起一圈灯。那不是任何一国的灯。')), () => stage(focusId)); }, 1500); }
      if (n && a && !P.acts.includes(act)) {
        chapIn(a);
        const first = !P.acts.length, WL = (root.AWLore && root.AWLore.world) || {}, cgDone = CGP && (CGP.seen('opening') || CGP.seen('act:' + act)), lines = (first && !(CGP && CGP.seen('opening')) ? (A.logline ? sentences(A.logline) : (WL.text || []).slice(0, 2)) : []).concat(CGP && CGP.seen('act:' + act) ? [] : sentences(a.narration));   // 第一次进战役：先说一句话的故事（logline），再接序章旁白
        if (first) { moveCam(size()[0] / 2, size()[1] / 2, zmin(), 0); const p0 = placeOf(n.place); setTimeout(() => { if (scr && scr.on) moveCam(p0.at[0], p0.at[1], ZMAX, 9000); }, 400); } else frameAct(act, 1600);
        if (!lines.length) { P.acts.push(act); api.save(); if (first) frameAct(act, 1200); return land(); }   // 这一幕的过场已经讲过了
        return narrate(first ? (A.title || '') : a.name, lines, () => { P.acts.push(act); api.save(); frameAct(act, 900); land(); });
      }
      if (!camTo) frameAct(act, 0); land();
    }
    // 换幕：这一幕的插图先以大图入场（带幕名），停一下，再缩到左上角的章节横幅里
    function chapIn(a) {
      const th = $('wchth'), CGP = root.AWCGPlayer, im = th && CGP && CGP.actArt ? CGP.actArt(a.id) : ''; if (!im || !th) return;
      const old = $('chapBig'); if (old) old.remove();
      const e = document.createElement('div'); e.id = 'chapBig'; e.style.backgroundImage = `url('${im}')`; e.innerHTML = `<b>${esc(a.name)}</b>`; scr.el.appendChild(e); th.style.visibility = 'hidden';
      const end = () => { th.style.visibility = ''; e.remove(); };
      if (!e.animate) return void setTimeout(end, 1600);
      e.animate([{ opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1 }], { duration: 320, easing: 'ease-out' });
      setTimeout(() => { if (!e.isConnected) return; const r = e.getBoundingClientRect(), q = th.getBoundingClientRect(), k = q.width / r.width;
        e.querySelector('b').style.opacity = 0; const an = e.animate([{ transform: 'none' }, { transform: `translate(${q.left + q.width / 2 - (r.left + r.width / 2)}px, ${q.top + q.height / 2 - (r.top + r.height / 2)}px) scale(${k})` }], { duration: 560, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }); an.onfinish = end; setTimeout(end, 700); }, 1700);
    }
    function open(focusId) {
      Kit.closeAll(); Nav.stack = []; G.showTitle(); sel = null; busy = false; born = performance.now();
      const total = LV.length, dn = LV.filter(l => api.isDone(l.id)).length, a = A.acts.find(x => x.id === curAct()), inAct = a ? LV.filter(l => l.act === a.id) : [];
      const CGP = root.AWCG && root.AWCGPlayer && root.AWCGPlayer.actArt ? root.AWCGPlayer : null, aim = a && CGP ? CGP.actArt(a.id, true) : '';
      scr = Kit.screen({ id: 'world', html: `<canvas></canvas><div class="chap">${aim ? `<img class="th" id="wchth" alt="" src="${esc(aim)}" onerror="this.remove()">` : ''}<div class="col"><div class="crumb pn">${esc(A.title || t('战役'))}<em>|</em><span>${esc(a ? a.name : '')}</span>${a ? `<small>${t('{a}/{b}', { a: inAct.filter(l => api.isDone(l.id)).length, b: inAct.length })}</small>` : ''}</div>${a && a.goal ? `<div class="agoal pn">${Kit.ic('flag', 's')}${esc(a.goal)}</div>` : ''}</div></div><div class="prog pn">${Kit.ic('flag', 's')}${t('{a}/{b}', { a: dn, b: total })}</div><div class="lst pn" id="wlist">${Kit.cap('x')}${esc(t('关卡一览'))}</div>`,
        onCancel: () => { sfx.back(); close(); },
        keys: { up: () => step(0, -1), down: () => step(0, 1), left: () => step(-1, 0), right: () => step(1, 0), ok: go, x: () => { sfx.ok(); api.list(sel && levelAt(sel) ? levelAt(sel).id : null); }, lb: () => zoom(-0.2), rb: () => zoom(0.2), y: pano },
        // 底部一排：右下金色主按钮“进入”，左下灰色“返回”，“关卡一览”“全景”是中间的次级按钮（tools/UI-PRIMARY.md）
        flow: true, hints: () => busy ? [] : [['a', '进入', !sel], ['b', '返回'], ['x', '关卡一览'], ['lbrb', '缩放'], ['y', '全景']] });
      cv = scr.el.querySelector('canvas'); c = cv.getContext('2d'); tide = tideNow(); tideFrom = { from: tide, to: tide }; hidA = (W.regions || []).some(r => r.hiddenUntil && done(r.hiddenUntil)) && api.P.seenHidden ? 1 : 0;
      // 上一次看到的潮位比现在低：进来先停在旧潮位，再涨上去
      if (api.P.tide != null && api.P.tide < tide) { tide = api.P.tide; tideFrom = { from: tide, to: tide - 1 }; } api.P.tide = tideNow(); api.save();
      $('wlist').onclick = e => { e.stopPropagation(); sfx.ok(); api.list(null); };
      wire(); frameAct(curAct(), 0); stage(focusId); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    // 全景：缩到整张图可见；再按一次回到这一幕的取景
    function pano() { if (busy) return; sfx.tick(); if (cam.z > zmin() + 0.01) moveCam(size()[0] / 2, size()[1] / 2, zmin(), 500); else frameAct(curAct(), 500); const cd = $('wcard'); if (cd) cd.remove(); setTimeout(card, 520); }
    function close() { if (scr) { scr.close(true); scr = null; } cancelAnimationFrame(raf); }
    function zoom(d, sx, sy) { const w0 = sx != null ? toW(sx, sy) : [cam.x, cam.y]; const z = Math.max(zmin(), Math.min(ZMAX, cam.z + d)); if (z === cam.z) return; camTo = null; cam.z = z; if (sx != null) { const w1 = toW(sx, sy); cam.x += w0[0] - w1[0]; cam.y += w0[1] - w1[1]; } clampCam(cam); card(); }
    // 指针：拖动平移、滚轮 / 双指缩放、点据点选中（已选中的再点一下进入）
    function wire() {
      const pts = new Map(); let drag = null, pin = 0;
      const hit = (x, y) => { let best = null, bd = 44 * Math.max(1, Kit.s); for (const n of nodes()) { const s = toS(n.p.at[0], n.p.at[1]), d = Math.hypot(s[0] - x, s[1] - y); if (d < bd) { bd = d; best = n; } } return best; };
      cv.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const a = [...pts.values()]; pin = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); drag = null; return; } drag = { x: e.clientX, y: e.clientY, moved: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
      cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
        if (pts.size === 2 && pin) { const a = [...pts.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); zoom((d / pin - 1) * cam.z, (a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2); pin = d; return; }
        if (!drag || busy) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) < 8) return; drag.moved = true; camTo = null; cam.x -= dx / k(); cam.y -= dy / k(); clampCam(cam); drag.x = e.clientX; drag.y = e.clientY; const cd = $('wcard'); if (cd) cd.remove(); });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pin = 0; const d = drag; drag = null; if (!d || e.type !== 'pointerup' || busy) return; if (d.moved) return card(); const n = hit(e.clientX, e.clientY); if (!n) return; if (sel === n.p.id && $('wcard')) go(); else pick(n.p.id); };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', e => { e.preventDefault(); if (!busy) zoom(e.deltaY < 0 ? 0.12 : -0.12, e.clientX, e.clientY); }, { passive: false });
    }
    return { open, close, get on() { return !!(scr && scr.on); }, get sel() { return sel; }, get cam() { return Object.assign({}, cam); }, get busy() { return busy; }, nodes: () => nodes().map(n => ({ id: n.p.id, level: n.l && n.l.id, open: !!n.open, done: !!n.done, dim: !!n.dim, at: toS(n.p.at[0], n.p.at[1]) })), get tide() { return tide; }, get hidden() { return hidA; }, pick, step, go, pano, ZMAX, get zmin() { return zmin(); } };
  };
})(window);
