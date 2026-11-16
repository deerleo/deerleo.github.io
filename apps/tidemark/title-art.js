// 由 tools/embed-image.js 生成：key-a.png（1672×941）；tools/split-load.js 把图拆到 ui-assets/lazy/title-art.webp（index.html 的 <link rel="preload"> 让它和脚本一起下）
(function (root) { const im = new Image(); im.decoding = 'async'; im.src = "ui-assets/lazy/title-art.webp"; root.AWTitleArt = { img: im, w: 1672, h: 941, ready: () => im.complete && im.naturalWidth > 0 }; })(window);
