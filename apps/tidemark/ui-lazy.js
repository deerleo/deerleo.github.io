// 潮汐战线：延后加载和空闲预取（window.AWLazy）。排在 index.html 最后。
// 标题画面画出第一帧以后才开始，一样一样来，不把带宽一下占满：
//   1. 单位素材 sprites.js（进对局、图鉴、选战场的预览都要；到之前单位先用代码画的旧样子顶着，到了自动换上）
//   2. cg.js（过场编排，只有地址）、world.js（世界地图各层的地址，图要等进战役才取）
//   3. 当前语言的标志（标题页自己也会要，这里只是保证它排在前面），再是界面的小图标（共约 300KB）
//   4. 开场过场的前两张图（没看过开场时）
//   5. 选指挥官页的小头像，再是各阵营第一位指挥官的大立绘
// 本地双击 index.html（file://）走的是同一条路，只是每一步几乎立刻完成。
(function (root) {
  'use strict';
  const doc = root.document, done = {};
  const idle = fn => (root.requestIdleCallback ? root.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
  const script = (src, onload) => new Promise(res => {
    if (done[src]) return res(true); done[src] = 1;
    const s = doc.createElement('script'); s.src = src; s.async = true;
    s.onload = () => { try { if (onload) onload(); } catch (e) { root.console && console.error(e); } res(true); };
    s.onerror = () => res(false);
    doc.body.appendChild(s);
  });
  const image = url => new Promise(res => { if (!url) return res(false); const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = url; });
  const wait = (p, ms) => Promise.race([p, new Promise(r => setTimeout(r, ms))]);
  const lang = () => { try { return (root.AWKit && root.AWKit.lang && root.AWKit.lang()) || (root.AWI18n && root.AWI18n.lang) || 'zh-CN'; } catch (e) { return 'zh-CN'; } };
  const logo = () => { const A = root.AWUIAssets || {}, l = lang(); return A['logo-' + ({ 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', ja: 'ja', ko: 'ko' }[l] || 'latin')] || A['logo-latin'] || ''; };
  // 单位素材到了：页面上已经画出来的单位小图（图鉴、菜单里的）重画一遍
  const spritesIn = () => { try { if (root.AWKit && root.AWKit.hydrate) root.AWKit.hydrate(doc); } catch (e) { } };
  // 预取让路：玩家刚按过键 / 点过屏幕的 2.5 秒内不开新的预取（这时候多半正在进某个画面，带宽留给那个画面要的图）；预取一次只取一样
  let lastInput = -1e9;
  ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => root.addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true, capture: true }));
  const quiet = async () => { while (performance.now() - lastInput < 2500) await new Promise(r => setTimeout(r, 400)); };
  const each = async (urls, ms) => { for (const u of urls) { await quiet(); await wait(image(u), ms || 8000); } };
  const steps = [
    () => script('sprites.js', spritesIn),                      // 这一样不让路：单位素材越早到越好
    () => Promise.all([script('cg.js', () => { if (root.AWI18n && root.AWI18n.localizeCG) root.AWI18n.localizeCG(); }), script('world.js')]),
    () => each([logo()]),
    // 菜单、行动菜单的小图标（每张几 KB）：先取回来，第一次开菜单时图标不用等
    () => { const A = root.AWUIAssets || {}; return each(Object.keys(A).filter(k => !/^(bg\d|logo)/.test(k)).map(k => A[k]), 4000); },
    () => { const P = root.AWCGPlayer; if (!P || !P.get || (P.seen && P.seen('opening'))) return; return each(P.get('opening').slice(0, 2).map(s => (P.src ? P.src(s.img) : s.img)), 15000); },
    () => { const P = root.AWPortraits; if (P && P.src) return each(P.ids.map(id => P.src(id, 'normal', false)), 6000); },
    () => { const P = root.AWPortraits, D = root.AWData; if (!P || !P.src || !D || !D.COS) return; const first = {}; for (const c of D.COS) if (!(c.faction in first)) first[c.faction] = c.id; return each(Object.values(first).map(id => P.src(id, 'normal', true)), 10000); },
  ];
  let started = false;
  async function run() {
    if (started) return; started = true;
    for (const st of steps) { try { await st(); } catch (e) { root.console && console.error(e); } await new Promise(idle); }
    L.ready = true;
  }
  const L = root.AWLazy = { ready: false, run, script, image, sprites: () => script('sprites.js', spritesIn) };
  // 等标题页画出第一帧
  root.requestAnimationFrame(() => setTimeout(run, 60));
})(window);
