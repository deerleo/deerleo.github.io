/* EduLab 主题切换（浅/深）：默认跟随 prefers-color-scheme，手动切换后记忆到 localStorage */
(function () {
  'use strict';
  var KEY = 'edulab-theme';

  function current() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* 隐私模式下不可用 */ }
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
  }

  // 首帧即应用（本脚本在各页面 <head> 内同步加载）
  apply(current());

  // 系统主题变化时，若用户未手动锁定则跟随
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) {
      var saved = null;
      try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
      if (saved !== 'light' && saved !== 'dark') apply(e.matches ? 'dark' : 'light');
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // 绑定切换按钮（按 id 查找，找不到则静默）
  window.eduBindThemeToggle = function (btn) {
    if (!btn) return;
    var icons = { sun: '☀', moon: '☾' };
    function paint() {
      var t = current();
      btn.textContent = t === 'dark' ? icons.sun : icons.moon;
      btn.title = t === 'dark' ? '切换到浅色' : '切换到深色';
      btn.setAttribute('aria-label', btn.title);
    }
    paint();
    btn.addEventListener('click', function () {
      var t = current() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, t); } catch (e) { /* ignore */ }
      apply(t);
      paint();
      btn.dispatchEvent(new CustomEvent('edulabtheme', { bubbles: true, detail: { theme: t } }));
    });
    window.addEventListener('edulabtheme', paint);
  };
})();
