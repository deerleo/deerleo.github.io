// 潮汐战线：过场动画播放器（window.AWCGPlayer）。插画在 cg/ 目录（webp，按相对路径加载），编排在 cg.js（全局 AWCG）：
//   { opening: [镜], acts: { 幕 id: [镜] }, scenes: { 关卡 id: { before: [镜], after: [镜], at: { 对话段: { 行号: 图 } } } }, ending: [镜] }
//   镜 = { img, lines: [一句话 | { who: 指挥官 id, text }] }
// 全屏插画慢慢推拉摇移（每张 6 秒上下），底部字幕一句一句出：旁白居中，人物台词带名字牌。图与图之间交叉淡入；图没到位的镜头只播文字（黑底）。
// 确定：下一句；Start / Y、长按：跳过整段。手机竖屏时插画上下留黑、字幕在下方。看过的段落记在 localStorage，图鉴“画廊”里能回看。
(function (root) {
  'use strict';
  const Kit = root.AWKit, esc = Kit.esc, t = Kit.t;
  Kit.css(`
  #cg { background:#000 !important; padding:0; display:block; } #cg::before { display:none; }
  #cg .im { position:absolute; inset:0; overflow:hidden; opacity:0; transition:opacity .5s; } #cg .im.on { opacity:1; } #cg .im.now { transition:none; } #cg .im img { position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; transform-origin:var(--ox, 50%) var(--oy, 50%); animation:cgKB var(--dur, 7s) ease-out both; }
  @keyframes cgKB { from { transform:scale(var(--z0, 1.02)) translate(var(--x0, 0), var(--y0, 0)); } to { transform:scale(var(--z1, 1.12)) translate(var(--x1, 0), var(--y1, 0)); } }
  #cg .sub { position:absolute; left:0; right:0; bottom:0; min-height:280r; padding:120r 10% 130r; display:flex; align-items:flex-end; justify-content:center; text-align:center; font-size:max(22px,42r); line-height:1.5; font-weight:800; color:#fff; background:linear-gradient(transparent, rgba(0,0,0,.5) 45%, rgba(0,0,0,.82)); text-shadow:0 3r 0 #000, 0 0 12r #000; cursor:pointer; }
  #cg .sub.say { left:6%; right:6%; bottom:120r; min-height:150r; padding:26r 40r; align-items:center; justify-content:flex-start; text-align:left; background:rgba(52,16,13,.9); box-shadow:0 0 0 4r var(--line); } #cg .nm { position:absolute; left:30r; top:-44r; padding:4r 30r; font-size:max(20px,32r); font-weight:900; color:#fff; background:linear-gradient(var(--pc), var(--pcd)); box-shadow:0 0 0 4r var(--line); }
  #cg .sub p { margin:0; animation:narIn .45s ease-out both; } #cg .skip { position:absolute; left:24r; top:24r; min-height:44px; padding:0 26r; display:none; align-items:center; font-size:max(20px,26r); color:#fff; background:rgba(52,16,13,.85); box-shadow:0 0 0 3r var(--line); cursor:pointer; z-index:3; }
  body[data-dev=touch] #cg .skip, body[data-dev=mouse] #cg .skip { display:flex; } body[data-dev=touch] #cg .sub, body[data-dev=mouse] #cg .sub { padding-bottom:50r; } body[data-dev=touch] #cg .sub.say, body[data-dev=mouse] #cg .sub.say { bottom:30r; padding-bottom:26r; }
  body.narrow #cg .im img { object-fit:contain; } body.narrow #cg .sub { padding:80r 6% max(70px,140r); font-size:max(18px,36r); } body.narrow #cg .sub.say { left:3%; right:3%; bottom:max(70px,140r); padding:26r 40r; }
  .cxgal { flex:1; min-height:0; width:100%; padding:110r 60r 20r; display:grid; grid-template-columns:repeat(auto-fill, minmax(420r, 1fr)); gap:22r; align-content:start; overflow-y:auto; }
  .cxgal .g1 { aspect-ratio:16/9; display:flex; align-items:flex-end; padding:0; background:#0c1020 center/cover no-repeat; box-shadow:inset 0 0 0 4r var(--line); font-size:max(20px,28r); font-weight:900; color:#fff; overflow:hidden; } .cxgal .g1 span { width:100%; padding:8r 16r; background:rgba(0,0,0,.6); text-align:left; } .cxgal .g1.lock { color:var(--mut); }
  .cxgal .gh { grid-column:1 / -1; margin:14r 0 0; font-size:max(22px,34r); color:var(--gold); font-weight:900; }
  .cxgal .g1.nav.focus { box-shadow:0 0 0 6r var(--gold); transform:scale(1.04); } body.narrow .cxgal { grid-template-columns:1fr 1fr; padding:104r 14r 10r; }
  `);
  const CG = () => root.AWCG || null;
  const seen = (() => { try { return new Set(JSON.parse(localStorage.getItem('steel-tide.cg') || '[]')); } catch (e) { return new Set(); } })();
  const mark = k => { if (!k || seen.has(k)) return; seen.add(k); try { localStorage.setItem('steel-tide.cg', JSON.stringify([...seen])); } catch (e) { } };
  const src = im => !im ? '' : /[\/.]/.test(im) ? im : 'cg/' + im + '.webp';
  // 图片预加载：同一张只取一次。过场开始前先把整段的图取回来，画面之间不留黑
  const PRE = {}; const pre = u => !u ? Promise.resolve(false) : PRE[u] || (PRE[u] = new Promise(r => { const im = new Image(); im.onload = () => r(true); im.onerror = () => r(false); im.src = u; }));
  const wait = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
  const shots = v => (Array.isArray(v) ? v : v ? [v] : []).map(s => typeof s === 'string' ? { img: s, lines: [] } : s).filter(Boolean);
  // 某一段：'opening' | 'ending' | 'act:1' | 'before:p01' | 'after:p01'
  function get(key) {
    const A = CG(); if (!A) return [];
    const [k, id] = String(key).split(':');
    if (k === 'opening' || k === 'ending') return shots(A[k]);
    if (k === 'act') return shots(A.acts && A.acts[id]);
    const sc = A.scenes && A.scenes[id]; return sc ? shots(sc[k]) : [];
  }
  // 对话某一段里带插画的行：{ 行号: 图地址 }
  function lineArt(levelId, seg) { const A = CG(), sc = A && A.scenes && A.scenes[levelId], at = sc && sc.at && sc.at[seg]; if (!at) return null; const o = {}; for (const i in at) o[i] = src(at[i]); return o; }
  const KB = [['1.02', '1.14', '0', '0', '-2%', '-1%', '30% 40%'], ['1.14', '1.03', '2%', '0', '0', '0', '70% 50%'], ['1.05', '1.16', '-2%', '1%', '1%', '-1%', '50% 30%'], ['1.12', '1.02', '0', '-2%', '0', '0', '40% 70%']];
  // 播一段。key 给了就记“看过”。返回 Promise（播完或跳过）
  function play(list, key) {
    list = shots(list); if (!list.length) return Promise.resolve(false);
    list.reduce((p, s) => p.then(() => pre(src(s.img))), Promise.resolve());   // 按顺序一张一张取：慢线路上第一张最先到，不和后面的图抢带宽
    // 第一张图到了再切画面（最多等 2.5 秒），等的时候停在上一个画面，不黑屏
    return wait(pre(src(list[0].img)), 2500).then(() => new Promise(res => {
      let si = -1, li = -1, t0 = 0, cur = null, timer = 0;
      const fin = () => { clearTimeout(timer); mark(key); scr.close(true); res(true); };
      const scr = Kit.screen({ id: 'cg', cls: 'clear', html: `<span class="skip">${esc(t('跳过'))}</span><div class="sub" id="cgsub"></div>`, onCancel: () => next(), keys: { ok: () => next(), start: fin, y: fin }, hints: () => Kit.ptr() ? [] : [['a', '继续'], ['y', '跳过']] });
      scr.el.style.animation = 'none';
      scr.el.querySelector('.skip').onclick = e => { e.stopPropagation(); fin(); };
      scr.el.addEventListener('pointerdown', () => { t0 = performance.now(); }); scr.el.addEventListener('click', () => { if (performance.now() - t0 > 700) fin(); else next(); });
      const sub = scr.el.querySelector('#cgsub');
      function shot() {
        const s = list[si], u = src(s.img), old = cur;
        const box = document.createElement('div'); box.className = 'im'; cur = box; scr.el.insertBefore(box, sub);
        if (u) { const im = new Image(), kb = KB[si % KB.length], n = Math.max(1, (s.lines || []).length); im.alt = '';
          im.style.cssText = `--z0:${kb[0]};--z1:${kb[1]};--x0:${kb[2]};--y0:${kb[3]};--x1:${kb[4]};--y1:${kb[5]};--ox:${kb[6].split(' ')[0]};--oy:${kb[6].split(' ')[1]};--dur:${Math.max(6, Math.min(16, n * 3.5))}s`;
          const drop = () => { if (old) setTimeout(() => old.remove(), 600); };   // 新图盖上来之后才撤掉旧图：中间不露黑底
          im.onload = () => { box.appendChild(im); if (!old) { box.classList.add('now', 'on'); return; } requestAnimationFrame(() => { box.classList.add('on'); drop(); }); }; im.onerror = () => { box.classList.add('on'); drop(); };   // 图取不到：黑底只播文字
          im.src = u; } else { box.classList.add('on'); if (old) setTimeout(() => old.remove(), 600); }
      }
      function line() {
        const s = list[si], l = (s.lines || [])[li], say = l && typeof l === 'object' && l.who && l.who !== 'narrator', txt = l == null ? '' : typeof l === 'string' ? l : l.text || '';
        const D = root.AWData, co = say && D ? D.COS.find(c => c.id === l.who) : null, camp = root.__game && root.__game.G && root.__game.G.camp, nm = co ? (camp && camp.coName ? camp.coName(co.id) : co.name) : '';
        sub.className = 'sub' + (co ? ' say' : ''); sub.style.cssText = co ? Kit.pcs(co.faction) : ''; sub.style.display = txt ? '' : 'none';
        sub.innerHTML = (co ? `<span class="nm">${esc(nm)}</span>` : '') + `<p>${esc(txt)}</p>`; Kit.sfx.tick();
        clearTimeout(timer); if (!(s.lines || []).length) timer = setTimeout(next, 5200);   // 没有字的镜头自己往下走
      }
      function next() { const s = list[si]; if (s && li + 1 < (s.lines || []).length) { li++; return line(); } if (si + 1 >= list.length) return fin(); si++; li = (list[si].lines || []).length ? 0 : -1; shot(); line(); }
      next();
    }));
  }
  // 关卡插图、章节插图（世界地图小卡、章节横幅、关卡一览、关前页用）。thumb = 要缩略图。
  // 关卡：AWCG.levels[id] = { img, thumb }；还没画的退到这一关对话里挂的第一张插画，再退到这一幕的开头图；都没有返回空串，界面照原样显示
  function actArt(act, thumb) { const A = CG(); if (!A) return ''; const th = A.actThumbs && A.actThumbs[act], s = shots(A.acts && A.acts[act]).find(x => x.img); return thumb && th ? src(th) : s ? src(s.img) : th ? src(th) : ''; }
  function levelArt(id, thumb) {
    const A = CG(), K = root.AWCampaign; if (!A) return '';
    const L = A.levels && A.levels[id]; if (L && (L.img || L.thumb)) return src(thumb ? (L.thumb || L.img) : (L.img || L.thumb));
    const sc = A.scenes && A.scenes[id]; if (sc) { const b = shots(sc.before).find(x => x.img); if (b) return src(b.img); for (const seg of ['intro', 'outro']) { const at = sc.at && sc.at[seg]; if (at) for (const i in at) return src(at[i]); } }
    const l = K && (K.levels || []).find(x => x.id === id); return l ? actArt(l.act, thumb) : '';
  }
  const hasLevelArt = id => { const A = CG(), L = A && A.levels && A.levels[id]; return !!(L && (L.img || L.thumb)); };
  // 画廊里的条目：[{ key, title, img, open, group }]
  function gallery() {
    const A = CG(), K = root.AWCampaign, out = []; if (!A) return out;
    const add = (key, title) => { const l = get(key); if (l.length) out.push({ key, title, img: src((l.find(s => s.img) || {}).img), open: seen.has(key) }); };
    add('opening', t('开场'));
    for (const a of (K && K.acts) || []) add('act:' + a.id, a.name);
    for (const l of (K && K.levels) || []) { add('before:' + l.id, l.no + ' ' + l.title); add('after:' + l.id, t('{title} · 战后', { title: l.no + ' ' + l.title })); }
    add('ending', t('结局'));
    // 关卡插图：按幕分组，解锁了的关卡才收录
    const camp = root.__game && root.__game.G && root.__game.G.camp;
    for (const a of (K && K.acts) || []) for (const l of (K.levels || []).filter(x => x.act === a.id)) if (hasLevelArt(l.id)) out.push({ key: 'level:' + l.id, title: l.no + ' ' + l.title, img: levelArt(l.id, true), open: !!(camp && camp.levelOpen && camp.levelOpen(l.id)), group: a.name });
    return out;
  }
  root.AWCGPlayer = { play, get, preload: key => get(key).forEach(s => pre(src(s.img))), pre, has: key => get(key).length > 0, seen: k => seen.has(k), playKey: key => { const m = /^level:(.+)$/.exec(key); if (m) { const l = ((root.AWCampaign || {}).levels || []).find(x => x.id === m[1]); return play([{ img: levelArt(m[1]), lines: l ? [l.no + '　' + l.title] : [] }]); } return play(get(key), key); }, lineArt, gallery, src, actArt, levelArt, hasLevelArt, reset() { seen.clear(); try { localStorage.removeItem('steel-tide.cg'); } catch (e) { } } };
  // 开场还没看过：空闲时先把开场的图取回来，点“战役”时不用等
  try { setTimeout(() => { /* 开场图的预取交给 ui-lazy.js（排在单位素材和图标后面，只取前两张）；没有 ui-lazy.js 时才在这里取 */ if (!root.AWLazy && !seen.has('opening')) get('opening').slice(0, 2).forEach(s => pre(src(s.img))); }, 1500); } catch (e) { }
})(window);
