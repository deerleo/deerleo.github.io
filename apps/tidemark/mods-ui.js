// 潮汐战线：扩展的界面部分。只做三件小事，都不碰别的界面文件：
//   1. 标题画面左下角的版本号读 AWMods.GAME_VERSION；
//   2. 右下角一个小标记（列表里有扩展时才出现）；点开是只读的扩展列表：名字、版本、作者、加了什么、有没有被跳过和原因；
//   3. 存档用到的扩展现在没启用时，提示一句（存档不动）。
// 别的界面想放入口，调 AWModsUI.open() 就行。
(function (root) {
  const M = root.AWMods, doc = root.document;
  if (!M || !doc) return;
  const T = (s, v) => { const I = root.AWI18n; return I && I.t ? I.t(s, v) : s.replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m)); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 样式跟全游戏的钢板皮肤走（ui-skin2.js 的材质变量；没有皮肤时退回纯色）。面板是对局内弹窗那种暗红钢板，列表是一张沙色纸（只展示，不是按钮）；
  // “关闭”是右下角的金色主按钮（Kit 的流程式提示条，键盘、手柄、鼠标、触屏都能关）。
  // 右下角的小标记只在标题画面上显示；对局画面上不放（战场一格都不占），对局里在回合菜单最下面有一行同样内容的文字，点它打开同一个列表
  const css = doc.createElement('style');
  css.textContent = '.tt .tver::after{content:"Ver. ' + M.GAME_VERSION.replace(/[^0-9A-Za-z.\- ]/g, '') + '" !important}' +
    '#awmods-tag{display:none;position:fixed;right:calc(14 * var(--r,1px));bottom:calc(12 * var(--r,1px));z-index:12;font:800 max(12px,calc(18 * var(--r,1px)))/1 var(--font,system-ui,sans-serif);color:#fff0d6;padding:calc(9 * var(--r,1px)) calc(14 * var(--r,1px)) calc(12 * var(--r,1px));cursor:pointer;user-select:none;-webkit-user-select:none;white-space:nowrap;opacity:.82;' +
    'background:rgba(40,12,10,.86);border:0 solid transparent;border-image:var(--sk-cd, none) 32 32 38 32 fill / calc(12 * var(--r,1px)) calc(12 * var(--r,1px)) calc(14 * var(--r,1px)) calc(12 * var(--r,1px)) / 0 stretch}' +
    '#awmods-tag:hover{opacity:1}#awmods-tag.warn{color:#ffd470}' +
    // 有钢板皮肤时整块就是那张深色小牌（border-image 的 fill 画满中间）：底色去掉，不然方形的暗底会从牌子的斜角外面露出来
    '#awmods-tag.sk{background:none;opacity:1}#awmods-tag.sk:hover{filter:brightness(1.15)}' +
    'body:has(#title):not(:has(.scr:not(#title))) #awmods-tag{display:block}' +
    '.modline{margin:calc(10 * var(--r,1px)) calc(8 * var(--r,1px)) 0;text-align:center;font-size:max(20px,calc(24 * var(--r,1px)));font-weight:800;color:#f0d8c8;cursor:pointer}.modline.warn{color:#ffd470}.modline::after{content:" ›"}' +
    '.modp{margin:auto;width:calc(1000 * var(--r,1px));max-width:94vw;max-height:calc(100% - 24 * var(--r,1px));padding:calc(24 * var(--r,1px)) calc(34 * var(--r,1px)) calc(26 * var(--r,1px));display:flex;flex-direction:column;gap:calc(12 * var(--r,1px));' +
    'background:linear-gradient(rgba(78,14,11,.3),rgba(44,6,5,.62)),var(--sk-steel, none) center/320% 320% no-repeat #6a1512}' +
    '.modp h2{flex:none;margin:0;font-size:max(24px,calc(48 * var(--r,1px)));font-weight:900;font-style:italic;color:#fff0d6;line-height:1.15;text-shadow:0 calc(4 * var(--r,1px)) 0 rgba(40,6,4,.75)}' +
    '.modp .sub{flex:none;font-size:max(20px,calc(24 * var(--r,1px)));font-weight:800;color:#f0d8c8}' +
    '.modp .lt{font-size:max(20px,calc(28 * var(--r,1px)));line-height:1.5}' +
    '.modp .m{padding:calc(12 * var(--r,1px)) 0;border-top:calc(3 * var(--r,1px)) solid rgba(110,70,30,.3)}.modp .m:first-child{border-top:0;padding-top:0}' +
    '.modp .n{font-weight:900;color:#2e1a10}.modp .v{font-weight:700;color:#6a5644;margin-left:calc(12 * var(--r,1px))}' +
    '.modp .lt .bad{color:#a8241a}.modp .lt .ok{color:#1f6e2a}.modp .lt .w{color:#8a5a00}' +
    '.modp .txt{font-size:max(20px,calc(30 * var(--r,1px)));line-height:1.5;font-weight:800;color:#fff0d6}' +
    'body.narrow .modp{width:auto;margin:auto calc(16 * var(--r,1px))}';
  (doc.head || doc.documentElement).appendChild(css);

  function addsText(a) {
    const out = [];
    if (a.maps) out.push(T('地图 {n} 张', { n: a.maps }));
    if (a.cos) out.push(T('指挥官 {n} 位', { n: a.cos }));
    if (a.units || a.damage) out.push(T('数值调整 {n} 处', { n: (a.units || 0) + (a.damage || 0) }));
    if (a.langs) out.push(T('语言 {n} 种', { n: a.langs }));
    if (a.words) out.push(T('词条 {n} 条', { n: a.words }));
    return out.length ? out.join(T('、')) : T('没有添加内容');
  }
  // 弹出一块钢板面板。有 Kit 就用它的整屏层（进导航栈：确定 / 取消 / 点空白处都能关，右下角一个金色主按钮）；没有 Kit（界面没加载）时退回一个最简单的层
  let scr = null;
  function panel(inner, okText) {
    close();
    const K = root.AWKit, html = '<div class="modp pn">' + inner + '</div>';
    if (K && K.screen) {
      scr = K.screen({ id: 'awmods-box', dim: true, pop: true, flow: true, html, keys: { ok: () => { close(); }, up: () => { K.scrollText && K.scrollText(-1); }, down: () => { K.scrollText && K.scrollText(1); } }, hints: [['a', okText]] });
      return;
    }
    const box = doc.createElement('div'); box.id = 'awmods-box'; box.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(16,8,8,.6);display:flex;padding:16px';
    box.innerHTML = html; box.addEventListener('click', () => close()); doc.body.appendChild(box);
  }
  function open() {
    const ls = M.list(), K = root.AWKit;
    let h = '';
    if (!ls.length) h += '<div class="m">' + esc(T('没有启用扩展。')) + '</div>';
    for (const m of ls) {
      h += '<div class="m"><div class="n">' + esc(m.name) + '<span class="v">' + esc(m.version) + (m.author ? ' · ' + esc(m.author) : '') + '</span></div>';
      if (m.state === 'ok') h += '<div class="ok">' + esc(T('已启用')) + ' · ' + esc(addsText(m.adds)) + '</div>';
      else h += '<div class="bad">' + esc(T('已跳过')) + ' · ' + esc(M.text ? M.text(m.whyT != null ? m.whyT : m.why, T) : m.why) + '</div>';
      if (m.desc) h += '<div>' + esc(m.desc) + '</div>';
      (m.notesT && m.notesT.length && M.text ? m.notesT.map(n => M.text(n, T)) : m.notes).forEach(n => { h += '<div class="w">' + esc(n) + '</div>'; });
      h += '</div>';
    }
    panel('<h2>' + esc(T('扩展')) + '</h2><div class="sub">' + esc(T('游戏版本 {v}', { v: M.GAME_VERSION })) + '</div>' + (K && K.longText ? K.longText(h) : '<div class="ltw"><div class="lt">' + h + '</div></div>'), '关闭');
  }
  function close() { if (scr && scr.on) { const s = scr; scr = null; s.close(); return; } scr = null; const b = doc.getElementById('awmods-box'); if (b) b.remove(); }
  function tagText() { const ls = M.list(), bad = ls.filter(m => m.state !== 'ok').length; return (M.changesRules() ? T('已启用扩展') : T('扩展')) + ' ' + (ls.length - bad) + (bad ? ' · ' + T('跳过 {n}', { n: bad }) : ''); }
  // 回合菜单（ui-battle.js 的 #pmenu，里面有“结束回合”那一项）一出现，就在最下面接一行状态文字
  function watchMenu() {
    if (!M.list().length || !root.MutationObserver) return;
    new root.MutationObserver(() => {
      const pm = doc.getElementById('pmenu'); if (!pm || pm.querySelector('.modline') || !pm.querySelector('.item[data-id="end"]')) return;
      const el = doc.createElement('div'); el.className = 'modline' + (M.list().some(m => m.state !== 'ok') ? ' warn' : ''); el.textContent = tagText();
      el.addEventListener('click', e => { e.stopPropagation(); open(); }); pm.appendChild(el);
    }).observe(doc.body, { childList: true });
  }
  function tag() {
    const ls = M.list();
    if (!ls.length) return;
    const el = doc.createElement('div'), bad = ls.filter(m => m.state !== 'ok').length;
    el.id = 'awmods-tag';
    if (bad) el.className = 'warn';
    try { if (root.getComputedStyle(doc.documentElement).getPropertyValue('--sk-cd').trim()) el.classList.add('sk'); } catch (e) { /* 没有皮肤：保留纯色底 */ }
    el.textContent = tagText();
    el.title = T('点击查看扩展列表');
    el.addEventListener('click', e => { e.stopPropagation(); open(); });
    doc.body.appendChild(el);
  }
  function saveNote() {
    try {
      const A = root.AWSave; if (!A || !A.check) return;
      const c = A.check(); if (!c.has || !c.missing.length) return;
      panel('<h2>' + esc(T('存档需要扩展')) + '</h2><div class="txt">' + esc(T('上一局使用了这些扩展，现在没有启用，所以不能继续：{list}。存档仍然保留，重新启用这些扩展后可以继续。', { list: c.missing.map(x => x.id + ' ' + (x.version || '')).join(T('、')) })) + '</div>', '知道了');
    } catch (e) { /* 忽略 */ }
  }
  // 地图列表里标出哪张图是扩展带来的：接在简介后面。换语言时数据表会重新翻一遍，所以每次换完再接一次
  function markMaps() {
    for (const m of root.AWMaps || []) {
      if (!m || !m.mod) continue;
      const tail = T('（扩展：{name}）', { name: T(m.modName) });
      if (String(m.blurb || '').slice(-tail.length) !== tail) m.blurb = (m.blurb || '') + tail;
    }
  }
  markMaps();
  if (root.AWI18n && root.AWI18n.onChange) root.AWI18n.onChange(() => { markMaps(); root.setTimeout(markMaps, 0); });
  function boot() { tag(); watchMenu(); saveNote(); }
  if (doc.body) boot(); else doc.addEventListener('DOMContentLoaded', boot);
  root.AWModsUI = { open, close };
})(window);
