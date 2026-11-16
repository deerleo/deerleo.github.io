// 潮汐战线：占领演出（window.AWCapture）。ui.js 在每次占领之后调 AWCapture.play(G, o)，返回 Promise（演完或被跳过）。
// 小窗（约屏幕宽的三分之一，战场压暗）：侧面视角，地面一条，背景取这一格周围地形的颜色；建筑按整数倍放大（像素不糊），
// 占领的步兵在门前一下一下跳起、落下——每落一下建筑抖一下、扬尘、闷响，头顶的占领值跟着跳减。
//   没占完：敬个礼，窗口收起（约 1.2 秒）
//   占完：占领值归零 → 白闪 → 建筑换成占领方的颜色 → 旗子升到杆顶飘起来 → 号角 → 大字“占领！”，窗下一行写这座建筑带来什么（约 2 秒）
//   司令部、战役目标建筑（o.big）：整屏——旧旗降下、新旗升起，两边是双方指挥官的立绘
//   被别人占走自己的建筑（o.role === 'lost'）：同样的演出，结尾是警示音和“××被占领”
// o：{ t 地形, by 占领方, prev 原主, unit 兵种, from, to 占领值, done, big, role: 'mine' | 'lost' | 'other', k 时间系数, sky, gnd 颜色, tname, gain 一行说明,
//      winner, loser 指挥官 id, quote 战败台词 }
// 确定键（任意键、点一下）= 跳过当前演出。
(function (root) {
  'use strict';
  const Kit = root.AWKit, esc = Kit.esc, tt = Kit.t;
  Kit.css(`
  #capw .dimr { position:fixed; inset:0; background:rgba(6,9,18,.62); animation:cwDim .15s ease-out both; } @keyframes cwDim { from { opacity:0; } } #capw.big .dimr { background:#05070e; }
  #capw { background:none !important; padding:0; display:flex; align-items:center; justify-content:center; flex-direction:column; animation:none; z-index:34; } #capw::before { display:none; }
  #capw .cw { position:relative; width:var(--W); animation:cwIn .16s cubic-bezier(.2,1.4,.4,1) both; } #capw.out .cw { animation:cwOut .14s ease-in both; }
  @keyframes cwIn { from { opacity:0; transform:scale(.6); } } @keyframes cwOut { to { opacity:0; transform:scale(.7); } }
  #capw .st { position:relative; height:var(--H); overflow:hidden; border-radius:10r; border:6r solid var(--line); clip-path:polygon(22r 0, calc(100% - 22r) 0, 100% 22r, 100% calc(100% - 22r), calc(100% - 22r) 100%, 22r 100%, 0 calc(100% - 22r), 0 22r); background:var(--gnd) var(--bg) 0 0 / 100% 100% no-repeat; image-rendering:pixelated; box-shadow:0 0 0 5r var(--pc); }
  #capw .gd { position:absolute; left:0; right:0; top:80%; bottom:0; background:var(--gnd) var(--tile) 0 0 / var(--bw) var(--bw) repeat-x; image-rendering:pixelated; box-shadow:inset 0 5r 0 rgba(0,0,0,.22); }
  #capw canvas { image-rendering:pixelated; display:block; }
  #capw .bld { position:absolute; left:50%; bottom:15%; transform:translateX(-50%); } #capw .bld canvas.nw { position:absolute; left:0; top:0; opacity:0; } #capw .bld.sw canvas.nw { opacity:1; } #capw .bld.sw canvas.od { opacity:0; }
  #capw .bld.shake { animation:cwShake .16s linear; } @keyframes cwShake { 25% { transform:translate(calc(-50% - 3px), 2px); } 60% { transform:translate(calc(-50% + 3px), 3px); } }
  #capw .un { position:absolute; bottom:12%; left:calc(50% - var(--bw) * 0.98); z-index:2; } #capw .un.salute { animation:cwSalute .5s ease-out both; } @keyframes cwSalute { 30% { transform:translateY(-8%) rotate(-10deg); } 60% { transform:rotate(6deg); } }
  #capw .dust { position:absolute; bottom:13%; width:calc(var(--bw) * 0.34); height:calc(var(--bw) * 0.16); border-radius:50%; background:rgba(255,250,235,.85); animation:cwDust .36s ease-out both; z-index:3; } @keyframes cwDust { from { transform:scale(.3); opacity:1; } to { transform:scale(1.5) translateY(-30%); opacity:0; } }
  #capw .num { position:absolute; left:0; right:0; top:4%; text-align:center; font-size:calc(var(--W) * 0.15); line-height:1; font-weight:900; color:#fff; -webkit-text-stroke:calc(var(--W) * 0.012) var(--line); paint-order:stroke fill; z-index:4; } #capw .num.pop { animation:cwPop .18s ease-out; } @keyframes cwPop { from { transform:scale(1.5) translateY(-6%); color:var(--gold2); } }
  #capw .num small { font-size:.42em; -webkit-text-stroke-width:calc(var(--W) * 0.007); color:var(--gold2); margin-left:.2em; }
  #capw .fl { position:absolute; inset:0; background:#fff; opacity:0; z-index:6; pointer-events:none; } #capw .fl.on { animation:cwFlash .34s ease-out both; } @keyframes cwFlash { 0% { opacity:0; } 25% { opacity:1; } 100% { opacity:0; } }
  #capw .pole { position:absolute; left:calc(50% + var(--bw) * 0.58); bottom:16%; width:calc(var(--bw) * 0.05); height:52%; background:linear-gradient(90deg, #f4f6ff, #8a93ad); border-radius:99r; box-shadow:0 0 0 3r var(--line); opacity:0; transition:opacity .15s; z-index:1; } #capw .pole.on { opacity:1; }
  #capw .flag { position:absolute; left:100%; bottom:0; width:calc(var(--bw) * 0.62); height:calc(var(--bw) * 0.4); background:linear-gradient(var(--fc1), var(--fc2)); box-shadow:0 0 0 3r var(--line); transform-origin:left center; transition:bottom var(--ft, .45s) ease-out; animation:cwWave .5s ease-in-out infinite alternate; clip-path:polygon(0 0, 100% 8%, 86% 50%, 100% 92%, 0 100%); } #capw .flag.up { bottom:calc(100% - var(--bw) * 0.4); } #capw .flag.gone { opacity:0; }
  @keyframes cwWave { from { transform:skewY(-5deg) scaleX(1); } to { transform:skewY(5deg) scaleX(.93); } }
  #capw .band { position:absolute; left:-10%; right:-10%; top:5%; padding:4r 0; text-align:center; transform:rotate(-6deg) scaleX(0); background:linear-gradient(var(--pcl) 0 8%, var(--pc) 8% 78%, var(--pcd) 78%); box-shadow:0 0 0 5r var(--line); z-index:7; transition:transform .18s cubic-bezier(.2,1.4,.4,1); } #capw .band.on { transform:rotate(-6deg) scaleX(1); }
  #capw .band b { font-size:calc(var(--W) * 0.1); line-height:1.1; font-weight:900; color:#fff; -webkit-text-stroke:calc(var(--W) * 0.01) var(--line); paint-order:stroke fill; white-space:nowrap; } #capw .band.long b { font-size:calc(var(--W) * 0.07); } #capw .band.bad { background:linear-gradient(#ffb8a4 0 8%, #d94a3a 8% 78%, #8a2a1c 78%); }
  #capw .gain { min-height:max(34px,70r); margin-top:14r; padding:8r 30r; max-width:92vw; display:flex; align-items:center; justify-content:center; gap:10r; text-align:center; font-size:max(20px,32r); line-height:1.3; font-weight:900; color:#fff; border-radius:12r; background:rgba(10,14,26,.88); box-shadow:0 0 0 4r var(--line); opacity:0; transform:translateY(-10r); transition:all .2s; } #capw .gain.on { opacity:1; transform:none; }
  /* 关键建筑的专属细节 */
  #capw .sp { position:absolute; pointer-events:none; opacity:0; z-index:3; }
  #capw .sp.mine { left:20%; right:20%; top:30%; bottom:10%; border-radius:50%; background:radial-gradient(#fff, #7fe0ff 30%, transparent 68%); mix-blend-mode:screen; } #capw .sp.mine.on { animation:cwGlow .9s ease-out both; }
  #capw .sp.lab { left:28%; right:28%; top:2%; height:38%; border-radius:50%; background:radial-gradient(#fff, #ffe08a 35%, transparent 70%); mix-blend-mode:screen; } #capw .sp.lab.on { animation:cwGlow .9s ease-out both; animation-iteration-count:2; }
  @keyframes cwGlow { 0% { opacity:0; transform:scale(.4); } 30% { opacity:1; transform:scale(1.15); } 100% { opacity:.25; transform:scale(1); } }
  #capw .sp.gate { left:18%; right:18%; bottom:0; height:0; background:repeating-linear-gradient(90deg, #2a3248 0 12%, #46527a 12% 24%); box-shadow:0 0 0 3r var(--line); opacity:1; transition:height .35s cubic-bezier(.6,0,1,.6); } #capw .sp.gate.on { height:34%; }
  #capw .sp.tower { left:50%; top:8%; width:0; height:0; } #capw .sp.tower.on { opacity:1; } #capw .sp.tower i { position:absolute; left:0; top:0; width:calc(var(--bw) * 1.4); height:calc(var(--bw) * 1.4); margin:calc(var(--bw) * -0.7); border-radius:50%; border:5r solid #b6f08a; opacity:0; } #capw .sp.tower.on i { animation:cwRing 1s ease-out both; } #capw .sp.tower.on i + i { animation-delay:.3s; }
  @keyframes cwRing { from { transform:scale(.1); opacity:1; } to { transform:scale(1); opacity:0; } }
  /* 整屏版：司令部、战役目标 */
  #capw.big { background:#05070e !important; } #capw.big .cw { width:100vw; } #capw.big .st { height:100vh; border:0; border-radius:0; clip-path:none; box-shadow:none; }
  #capw.big .gain { position:absolute; left:50%; bottom:max(60px,120r); transform:translateX(-50%); margin:0; white-space:nowrap; max-width:96vw; } #capw.big .gain.on { transform:translateX(-50%); } #capw.big .band b { font-size:min(calc(var(--W) * 0.1), 15vh); } #capw .gain { flex-wrap:wrap; gap:4r 34r; } #capw .gain .g1 { display:inline-flex; align-items:center; gap:10r; white-space:nowrap; } body.narrow #capw .gain .g1 { white-space:normal; }
  #capw.big .gd { top:74%; } #capw.big .bld { bottom:21%; } #capw.big .un { bottom:18%; } #capw.big .pole { bottom:22%; } #capw.big .dust { bottom:19%; } #capw.big .st { background-size:100% 91%; }
  #capw .pt { image-rendering:auto; position:absolute; bottom:0; height:60vh; z-index:5; transition:transform .35s ease-out, opacity .35s; opacity:0; pointer-events:none; } #capw .pt.w { left:-5%; transform:translateX(-40vw); } #capw .pt.l { right:-5%; transform:translateX(40vw); filter:saturate(.5) brightness(.75); } #capw .pt.on { opacity:1; transform:none; }
  #capw .say { position:absolute; right:calc(2% + 26vh); bottom:50vh; max-width:44vw; padding:14r 30r; font-size:max(20px,36r); line-height:1.35; color:var(--txt); z-index:8; opacity:0; transition:opacity .2s; } #capw .say.on { opacity:1; }
  body.narrow #capw .pt { height:46vh; } body.narrow #capw .say { right:4%; left:4%; max-width:none; bottom:48vh; } body.narrow #capw.big .gain { white-space:normal; width:92vw; }
  `);
  // 远景：一张 160×112 的小像素画（放大贴满窗口）——两阶天空、几朵云、远山，再按周围地形加一层树、丘陵或海
  const bgCache = {};
  function backdrop(near, seed) {
    const has = re => near.some(t => re.test(t)), key = [has(/mountain/), has(/forest/), has(/sea|beach|port|reef/), has(/waste|ruins|shard/), seed % 5].join();
    if (bgCache[key]) return bgCache[key];
    const w = 160, h = 112, gy = 92, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'), R = (x, y, a, b, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(a), Math.round(b)); };
    let sd = seed * 9301 + 49297; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
    R(0, 0, w, 44, '#6fbdf2'); R(0, 44, w, gy - 44, '#a9dcfa'); R(0, 42, w, 2, '#8bcdf6');
    for (let i = 0; i < 4; i++) { const x = 6 + i * 40 + rnd() * 16, y = 6 + rnd() * 26, l = 16 + rnd() * 12; R(x + 3, y, l - 8, 3, '#fff'); R(x, y + 3, l, 4, '#fff'); R(x + 2, y + 7, l - 5, 2, '#dff1fd'); }
    const dry = has(/waste|ruins|shard/), far = dry ? '#c9ab86' : '#8fb0d6', snow = has(/mountain/);
    for (let i = 0; i < 5; i++) { const px = -6 + i * 38 + rnd() * 14, ph = (snow ? 30 : 18) + rnd() * 14; for (let y = 0; y < ph; y++) { const hw = dry && y < 4 ? 5 : y * (snow ? 0.85 : 1.25) + 1; R(px - hw, gy - ph + y, hw * 2, 1, snow && y < 6 ? '#f4f8ff' : far); } }
    if (has(/sea|beach|port|reef/)) { R(0, gy - 9, w, 9, '#3b8ae6'); for (let x = 3; x < w; x += 14) R(x + rnd() * 6, gy - 7 + (x % 3) * 2, 5, 1, '#a9dcfa'); }
    else if (has(/forest/)) { for (let x = -2; x < w; x += 9) { const th = 12 + rnd() * 6, cx = x + rnd() * 3; for (let y = 0; y < th; y++) { const hw = 1 + (y % 5) * 0.9 + y * 0.12; R(cx - hw, gy - th + y, hw * 2, 1, y % 5 === 0 ? '#2f7f45' : '#3f9358'); } } }
    else { const col = dry ? '#b08a5a' : '#6fae62'; for (let i = 0; i < 4; i++) { const px = 10 + i * 46 + rnd() * 12, pw = 30 + rnd() * 16, ph = 8 + rnd() * 5; for (let y = 0; y < ph; y++) { const hw = pw * Math.sqrt(1 - Math.pow(1 - (y + 1) / ph, 2)) / 2; R(px - hw, gy - ph + y, hw * 2, 1, col); } } }
    R(0, gy, w, h - gy, 'rgba(0,0,0,0)');
    return (bgCache[key] = cv.toDataURL());
  }
  // 地面：这一格周围地形的图块（草地、沙地、荒地、道路……），横向平铺
  const tileCache = {};
  function tileUrl(t) {
    if (tileCache[t]) return tileCache[t];
    try { const box = document.createElement('div'); box.innerHTML = Kit.terr(t, 0, 48); Kit.hydrate(box); const cv = box.querySelector('canvas'); if (cv && cv.width) return (tileCache[t] = `url(${cv.toDataURL()})`); } catch (e) { }
    return 'none';
  }
  const Cap = { last: null, on: false };
  Cap.play = (G, o) => new Promise(res => {
    const k = Math.max(0.35, o.k || 1), W = Math.round(o.big ? innerWidth : Kit.narrow ? innerWidth * 0.86 : Math.max(innerWidth / 3, Math.min(innerWidth * 0.9, 420))), H = o.big ? innerHeight : Math.round(W * 0.7);
    const dpr = root.devicePixelRatio || 1, Art = G.Art, tile = Art.TILE || 48, top = Art.TOP == null ? 16 : Art.TOP;
    const mul = Math.max(1, Math.floor(H * (o.big ? 0.62 : 0.72) * dpr / (tile + top))), bw = mul * tile / dpr;   // 建筑：整数倍放大
    const fac = p => G.artCode ? G.artCode(p) : G.fac ? G.fac(p) : p, pcs = p => p ? (G.pcs ? G.pcs(p) : Kit.pcs(fac(p))) : '--pc:#aab3cc;--pcd:#6a7390;--pcl:#e9edf8', fl = p => { if (!p) return '--fc1:#e9edf8;--fc2:#aab3cc'; const P = G.pal ? G.pal(p) : Kit.pal(fac(p)); return `--fc1:${P.l || P.h};--fc2:${P.m}`; };
    const steps = Math.max(1, Math.min(o.from - o.to, o.from - o.to >= 15 ? 5 : o.from - o.to >= 10 ? 4 : 3)), gap = (o.from - o.to >= 15 ? 150 : o.from - o.to >= 10 ? 185 : 225) * k;
    let skip = false, closed = false; const waits = new Set();
    const wait = ms => skip ? Promise.resolve() : new Promise(r => { const t = setTimeout(() => { waits.delete(f); r(); }, ms); const f = () => { clearTimeout(t); r(); }; waits.add(f); });
    const doSkip = () => { if (skip) return; skip = true; for (const f of [...waits]) f(); waits.clear(); };
    const scr = Kit.screen({ id: 'capw', cls: 'clear' + (o.big ? ' big' : ''), onCancel: doSkip, keys: { ok: doSkip, x: doSkip, y: doSkip, start: doSkip, up: doSkip, down: doSkip, left: doSkip, right: doSkip }, hints: () => [['a', '跳过']],
      html: `<div class="dimr"></div><div class="cw" style="--W:${W}px;--H:${H}px;--bw:${bw}px;${pcs(o.by)}"><div class="st" style="--gnd:${o.gnd || '#5bb04a'};--bg:url(${backdrop(o.near || [], o.seed || 0)});--tile:${tileUrl(o.ground || 'plain')}"><div class="gd"></div>` +
        `<div class="pole"><i class="flag old${o.big && o.prev ? ' up' : ' gone'}" style="${fl(o.prev)}"></i><i class="flag new gone" style="${fl(o.by)}"></i></div>` +
        `<div class="bld">${Kit.terr(o.t, o.prev ? fac(o.prev) : 0, 96).replace('class="tc"', 'class="tc od"')}${Kit.terr(o.t, fac(o.by), 96).replace('class="tc"', 'class="tc nw"')}<i class="sp ${esc(o.t)}">${o.t === 'tower' ? '<i></i><i></i>' : ''}</i></div>` +
        `<div class="un">${Kit.unit(o.unit, fac(o.by), 64, 'data-anim="1"')}</div><b class="num">${o.from}</b><i class="fl"></i><div class="band${o.role === 'lost' ? ' bad long' : ''}"><b>${esc(o.role === 'lost' ? tt('{name}被占领', { name: o.tname || '' }) : tt('占领！'))}</b></div>` +
        (o.big ? (o.winner ? Kit.port(o.winner, 'power').replace('class="pt"', 'class="pt w"') : '') + (o.loser ? Kit.port(o.loser, 'lose').replace('class="pt"', 'class="pt l"') : '') + (o.quote ? `<div class="say pn">“${esc(o.quote)}”</div>` : '') : '') +
        `</div><div class="gain">${(o.gains || (o.gain ? [['', o.gain]] : [])).map((g, i) => `<span class="g1">${g[0] ? Kit.ic(g[0], 's') : ''}${esc(g[1])}</span>`).join('')}</div></div>` });
    const el = scr.el, q = s => el.querySelector(s);
    el.addEventListener('pointerdown', doSkip);
    // 建筑和单位按整数倍摆好
    el.querySelectorAll('.bld canvas').forEach(cv => { cv.style.width = bw + 'px'; cv.style.height = (bw * cv.height / cv.width) + 'px'; });
    const ucv = q('.un canvas'); if (ucv) { const uw = bw * 0.8; ucv.dataset.px = String(uw / Kit.s); ucv.style.width = uw + 'px'; ucv.style.height = (uw * (ucv.height / Math.max(1, ucv.width))) + 'px'; Kit.hydrate(q('.un')); }
    const num = q('.num'), bld = q('.bld'), un = q('.un'), sfx = G.sfx;
    const setNum = v => { num.innerHTML = v + (o.done ? '' : `<small>/ 20</small>`); num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); };
    const land = v => { setNum(v); bld.classList.remove('shake'); void bld.offsetWidth; bld.classList.add('shake'); const d = document.createElement('i'); d.className = 'dust'; d.style.left = `calc(50% - ${bw * 0.98 - bw * 0.2}px)`; q('.st').appendChild(d); setTimeout(() => d.remove(), 400); if (sfx.stomp) sfx.stomp(); };
    Cap.on = true; Cap.last = { t: o.t, by: o.by, from: o.from, to: o.to, done: !!o.done, big: !!o.big, role: o.role, steps, gain: o.gain || '', skipped: false };
    (async () => {
      num.innerHTML = o.from + (o.done ? '' : `<small>/ 20</small>`);
      await wait(170 * k); un.style.transformOrigin = '50% 100%';   // 落地压扁时以脚底为准
      for (let i = 1; i <= steps && !skip; i++) {
        // 起跳慢一点、下落快一点（落下时加速），落地那一下才扣数字、出声、扬尘；落地后在地上停一拍再跳下一下，免得看起来是起跳时扣的
        const air = gap * 0.78, rest = gap * 0.42;
        if (un.animate) un.animate([{ transform: 'translateY(0)', easing: 'cubic-bezier(.2,.7,.4,1)' }, { transform: `translateY(${-bw * 0.42}px)`, offset: 0.5, easing: 'cubic-bezier(.6,0,.9,.5)' }, { transform: 'translateY(0) scale(1.08, .9)', offset: 0.96 }, { transform: 'translateY(0)' }], { duration: air });
        await wait(air * 0.96); if (skip) break;
        land(Math.round(o.from - (o.from - o.to) * i / steps));
        await wait(air * 0.04 + rest); if (skip) break;
      }
      setNum(o.to);
      if (!o.done) { un.classList.add('salute'); await wait(330 * k); }
      else {
        await wait(90 * k);
        q('.fl').classList.add('on'); await wait(110 * k); bld.classList.add('sw'); num.style.opacity = 0;          // 白闪到最亮的那一下换色
        const sp = q('.sp'); if (sp) sp.classList.add('on');
        const pole = q('.pole'), oldF = q('.flag.old'), newF = q('.flag.new'); pole.classList.add('on'); const ft = (o.big ? 600 : 450) * k; pole.style.setProperty('--ft', ft + 'ms');
        if (o.big && o.prev) { void oldF.offsetWidth; oldF.classList.remove('up'); await wait(ft + 40); oldF.classList.add('gone'); }
        newF.classList.remove('gone'); void newF.offsetWidth; newF.classList.add('up');
        await wait(ft + 120);                                                             // 旗升到杆顶、飘起来了，再出大字
        if (o.big) { const w = q('.pt.w'), l = q('.pt.l'), say = q('.say'); if (l) l.classList.add('on'); if (say) say.classList.add('on'); await wait(300 * k); if (w) w.classList.add('on'); await wait(200 * k); }
        if (!skip) { if (o.role === 'lost') { if (sfx.alarm) sfx.alarm(); } else if (sfx.fanfare) sfx.fanfare(); else sfx.captured(); }
        q('.band').classList.add('on'); if (o.gain) q('.gain').classList.add('on');
        await wait((o.big ? 1900 : 760) * k);
      }
      if (skip) {   // 跳过：直接摆成结果，停一下再收
        Cap.last.skipped = true; waits.clear(); skip = false;
        if (o.done) { bld.classList.add('sw'); num.style.opacity = 0; q('.pole').classList.add('on'); q('.flag.old').classList.add('gone'); const nf = q('.flag.new'); nf.classList.remove('gone'); nf.classList.add('up'); q('.band').classList.add('on'); if (o.gain) q('.gain').classList.add('on'); el.querySelectorAll('.pt, .say').forEach(e => e.classList.add('on')); }
        await wait(o.done ? 260 : 120); skip = true;
      }
      el.classList.add('out'); await new Promise(r => setTimeout(r, 130));
      if (!closed) { closed = true; scr.close(true); } Cap.on = false; res(true);
    })().catch(e => { console.error(e); if (!closed) { closed = true; scr.close(true); } Cap.on = false; res(false); });
  });
  root.AWCapture = Cap;
})(window);
