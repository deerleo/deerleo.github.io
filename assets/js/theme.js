/* theme.js — milulab 三态主题交互（浅色/深色/自动）
   配套 _includes/theme-init.html 与 assets/css/theme.css。幂等：脚本执行两次不报错。 */
(function () {
  'use strict';
  var KEY = 'milu-theme';
  var root = document.documentElement;

  /* 冻结页（data-theme-frozen）：主题固定，不接入切换系统 */
  if (root.hasAttribute('data-theme-frozen')) { return; }
  /* 幂等守卫 */
  if (root.dataset.themeBound === '1') { return; }
  root.dataset.themeBound = '1';

  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var switchTimer = null;

  function normalize(pref) {
    return (pref === 'light' || pref === 'dark' || pref === 'auto') ? pref : 'auto';
  }

  function resolve(pref) {
    if (pref === 'auto') {
      try { return mq && mq.matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
    }
    return pref;
  }

  function updateMeta(theme) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'theme-color';
      (document.head || root).appendChild(m);
    }
    m.setAttribute('content', theme === 'dark' ? '#0b1611' : '#f1f2ec');
  }

  function updateButtons(pref) {
    var buttons = document.querySelectorAll('.theme-switch [data-theme-set]');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-set') === pref ? 'true' : 'false');
    }
  }

  function apply(pref, opts) {
    opts = opts || {};
    pref = normalize(pref);
    var theme = resolve(pref);
    root.dataset.theme = theme;
    root.dataset.themePref = pref;
    try { root.style.colorScheme = theme; } catch (e) {}
    updateMeta(theme);
    updateButtons(pref);
    if (opts.persist) {
      try { localStorage.setItem(KEY, pref); } catch (e) {}
    }
    try {
      document.dispatchEvent(new CustomEvent('milu:themechange', { detail: { theme: theme, pref: pref } }));
    } catch (e) {}
  }

  function startSwitchTransition() {
    root.classList.add('theme-switching');
    if (switchTimer) { clearTimeout(switchTimer); }
    switchTimer = setTimeout(function () { root.classList.remove('theme-switching'); }, 240);
  }

  /* 初始化：同步按钮态（data-theme / color-scheme 已由 theme-init 预置） */
  apply(root.dataset.themePref || 'auto', {});

  /* 点击切换（事件委托，天然幂等且支持任意数量的切换器） */
  document.addEventListener('click', function (ev) {
    var target = ev.target;
    if (!target || !target.closest) { return; }
    var btn = target.closest('.theme-switch [data-theme-set]');
    if (!btn) { return; }
    startSwitchTransition();
    apply(btn.getAttribute('data-theme-set'), { persist: true });
  });

  /* 系统外观变化：仅 auto 时实时跟随 */
  function onSystemChange() {
    if (normalize(root.dataset.themePref) === 'auto') { apply('auto', {}); }
  }
  if (mq) {
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onSystemChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(onSystemChange);
    }
  }

  /* 跨标签页同步 */
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) { return; }
    apply(e.newValue, {});
  });
})();
