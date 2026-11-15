/* 微信二维码弹层交互（复用 .archive-modal 的开关与滚动锁写法，见 media-archive.js） */
(function () {
  var entry = document.querySelector('.wechat-entry');
  var modal = document.getElementById('wechatModal');
  if (!entry || !modal) return;

  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var closeBtn = modal.querySelector('.archive-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  entry.addEventListener('click', open);
  modal.querySelectorAll('[data-wechat-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();
