// 由 tools/world-embed.js 生成，不要手改。战役世界地图的各层图（说明见 tools/WORLD-ART.md）
// AWWorldArt.base / tide[0..3] / hidden / cloud 都是 { img, w, h }；ready() 全部解码完返回 true；
// 所有整幅图层同尺寸、同原点，按 world.size（1000×700）等比铺满即可；px(x, y) 把 world 坐标换成底图像素。
(function (root) {
  const S = {"base":"world/base.webp","tide-1":"world/tide-1.webp","tide-2":"world/tide-2.webp","tide-3":"world/tide-3.webp","tide-4":"world/tide-4.webp","hidden":"world/hidden.webp","cloud":"world/cloud.webp"};
  // 图是懒的：第一次读 .img 才建 Image、开始取
  const mk = (k, w, h) => { let img = null; return { get img() { if (!img) { img = new Image(); img.decoding = 'async'; img.src = S[k]; } return img; }, w, h }; };
  const A = {
    w: 1499, h: 1049, world: [1000, 700],
    base: mk('base', 1499, 1049),
    tide: [mk('tide-1', 1499, 1049), mk('tide-2', 1499, 1049), mk('tide-3', 1499, 1049), mk('tide-4', 1499, 1049)],
    tideAt: [0, 1 / 3, 2 / 3, 1],          // 四档对应的 tide 值：坑里 / 三分之一 / 三分之二 / 回满
    hidden: mk('hidden', 1499, 1049),      // 铁轨环线、绞盘塔、井架下的光（透明底，整幅对位）
    cloud: mk('cloud', 768, 768),          // 四方连续的云雾纹理（透明底）
    eye: { at: [477, 323], rx: 100, ry: 71 },   // 潮眼坑沿（world 坐标的椭圆）
    px(x, y) { return [x * 1.499, y * 1049 / 700]; },
    // tide（0–1）→ 每档潮水层的不透明度：低档全显，下一档按比例淡入
    tideAlpha(t) { const f = Math.max(0, Math.min(1, t)) * 3, i = Math.floor(f); return [1, i >= 1 ? 1 : f - i, i >= 2 ? 1 : i === 1 ? f - 1 : 0, i >= 3 ? 1 : i === 2 ? f - 2 : 0]; },
    ready() { return [A.base, A.hidden, A.cloud].concat(A.tide).every(l => l.img.complete && l.img.naturalWidth > 0); },
    preload() { return A.ready(); },        // 提前开始取（进战役菜单时、标题画面空闲时调）
  };
  root.AWWorldArt = A;
})(typeof window !== 'undefined' ? window : globalThis);
