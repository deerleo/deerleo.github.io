/* 媒体报道本地存档模态框交互 */
(function () {
  var dataEl = document.getElementById('mediaArchiveData');
  if (!dataEl) return;
  var data;
  try {
    data = JSON.parse(dataEl.textContent);
  } catch (e) {
    console.error('mediaArchiveData 解析失败', e);
    return;
  }

  var modal = document.getElementById('archiveModal');
  var body = document.getElementById('archiveModalBody');
  var title = document.getElementById('archiveModalTitle');
  if (!modal || !body || !title) return;

  var lastFocus = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function itemHTML(it) {
    if (it.type === 'video') {
      return '<div class="arch-item">' +
        '<video class="arch-video" controls preload="metadata" poster="' + esc(it.poster || '') + '">' +
        '<source src="' + esc(it.src) + '" type="video/mp4"></video>' +
        (it.caption ? '<p class="arch-cap">' + esc(it.caption) + '</p>' : '') +
        '<a class="arch-dl" href="' + esc(it.src) + '" download>下载视频存档 ↓</a>' +
        '</div>';
    }
    if (it.type === 'pdf') {
      return '<div class="arch-item">' +
        '<iframe class="arch-pdf" src="' + esc(it.src) + '" title="' + esc(it.caption || 'PDF 存档') + '"></iframe>' +
        (it.caption ? '<p class="arch-cap">' + esc(it.caption) + '</p>' : '') +
        '<a class="arch-dl" href="' + esc(it.src) + '" download>下载 PDF 存档 ↓</a>' +
        '</div>';
    }
    return '<div class="arch-item">' +
      '<img class="arch-img" src="' + esc(it.src) + '" alt="' + esc(it.caption || '') + '" loading="lazy">' +
      (it.caption ? '<p class="arch-cap">' + esc(it.caption) + '</p>' : '') +
      '</div>';
  }

  function render(items) {
    // 多张图片 -> 画廊（主图 + 缩略图）
    if (items.length > 1 && items.every(function (i) { return i.type === 'image'; })) {
      var main = items[0];
      var html = '<div class="arch-gallery">' +
        '<img class="arch-img arch-main" id="archMain" src="' + esc(main.src) + '" alt="' + esc(main.caption || '') + '">' +
        '<div class="arch-thumbs">';
      items.forEach(function (it, idx) {
        html += '<button type="button" class="arch-thumb' + (idx === 0 ? ' is-active' : '') +
          '" data-src="' + esc(it.src) + '" data-cap="' + esc(it.caption || '') + '">' +
          '<img src="' + esc(it.src) + '" alt="' + esc(it.caption || '') + '"></button>';
      });
      html += '</div><p class="arch-cap" id="archCap">' + esc(main.caption || '') + '</p></div>';
      return html;
    }
    return items.map(itemHTML).join('');
  }

  function open(cardKey) {
    var items = data[cardKey];
    if (!items) return;
    var card = document.getElementById('media-' + cardKey);
    var h3 = card ? card.querySelector('h3') : null;
    var src = card ? card.querySelector('.media-source') : null;
    title.textContent = (h3 ? h3.textContent : '本地存档') + (src ? ' · ' + src.textContent : '');
    body.innerHTML = render(items);

    var main = document.getElementById('archMain');
    if (main) {
      var cap = document.getElementById('archCap');
      body.querySelectorAll('.arch-thumb').forEach(function (b) {
        b.addEventListener('click', function () {
          main.src = b.getAttribute('data-src');
          if (cap) cap.textContent = b.getAttribute('data-cap');
          body.querySelectorAll('.arch-thumb').forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
        });
      });
    }

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
    body.innerHTML = ''; // 清空以停止视频播放
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
    }
  }

  document.querySelectorAll('.media-archive-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = (btn.getAttribute('data-card') || '').replace(/^media-/, '');
      open(key);
    });
  });
  modal.querySelectorAll('[data-archive-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
})();
