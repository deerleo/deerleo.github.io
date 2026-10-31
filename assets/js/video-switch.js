/* 文章内嵌视频切换组件（横版/竖版，手机端默认竖版）
 * 2026-10-31 定版。依赖：文章 video 标签带 data-vsrc（竖版地址）。
 * 行为：
 *  - 竖屏视口（≤768px）：默认切竖版源；横屏默认横版源
 *  - 视频右上角一个半透明纯图标按钮（⇄）切换，不抢视觉
 *  - 切换保留播放进度与播放状态
 */
(function () {
  var MOBILE_BP = 768;

  function isMobile() {
    return window.matchMedia('(max-width:' + MOBILE_BP + 'px)').matches;
  }

  function applySource(v, useVertical) {
    var vsrc = v.getAttribute('data-vsrc');
    var hsrc = v.getAttribute('data-hsrc') || v.getAttribute('src');
    if (useVertical && !vsrc) return; // 无竖版，保持横版
    var target = useVertical ? vsrc : hsrc;
    var cur = v.currentSrc || v.getAttribute('src') || '';
    if (!target || cur.indexOf(target.split('?')[0]) !== -1) return;

    var t = v.currentTime || 0;
    var wasPlaying = !v.paused && !v.ended && v.readyState > 2;
    v.setAttribute('src', target);
    // 同步 poster：竖版用竖版封面（若登记）
    var vp = v.getAttribute('data-vposter');
    if (useVertical && vp) v.setAttribute('poster', vp);
    v.addEventListener('loadedmetadata', function onMeta() {
      v.removeEventListener('loadedmetadata', onMeta);
      try { if (t > 0 && t < v.duration) v.currentTime = t; } catch (e) {}
      if (wasPlaying) v.play().catch(function () {});
    });
    v.load();
  }

  function makeToggle(v) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'vswitch-btn';
    btn.setAttribute('aria-label', '切换横竖版视频');
    btn.title = '切换横/竖版';
    btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="13" height="11" rx="2"/><path d="M16 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-1"/><path d="M9 11V4M6 7l3-3 3 3"/></svg>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var vsrc = v.getAttribute('data-vsrc');
      if (!vsrc) { btn.style.display = 'none'; return; }
      var cur = v.currentSrc || v.getAttribute('src') || '';
      applySource(v, cur.indexOf(vsrc.split('?')[0]) === -1);
    });
    return btn;
  }

  function init() {
    var videos = document.querySelectorAll('article video, .post-content video, main video');
    Array.prototype.forEach.call(videos, function (v) {
      if (v.getAttribute('data-vswitch') === 'on') return;
      v.setAttribute('data-vswitch', 'on');
      // 记录原始横版地址
      if (!v.getAttribute('data-hsrc')) v.setAttribute('data-hsrc', v.getAttribute('src'));
      // 包一层定位容器 + 挂按钮
      var wrap = document.createElement('span');
      wrap.className = 'vswitch-wrap';
      v.parentNode.insertBefore(wrap, v);
      wrap.appendChild(v);
      var btn = makeToggle(v);
      wrap.appendChild(btn);
      // 无竖版：按钮仍显示（点了提示隐藏），手机端保持横版
      if (!v.getAttribute('data-vsrc')) btn.style.display = 'none';
      // 初始源：竖屏默认竖版
      applySource(v, isMobile());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
