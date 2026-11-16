// 晨曦镇：河边小镇。小河从东北角矿山脚下流向西南，镇子跨河而建。
// 红方西北角，蓝方东南角。骨架按中心旋转对称，河两端（矿山 / 河口湿地）和两岸细节各画各的。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '晨曦镇', size: '16×12 · 河边小镇，新手图', order: 1,
    blurb: '小河斜穿麦田，镇子跨河而建。两座桥通坦克，步兵可以从西南的浅滩蹚过去，东北的矿山是第三条路。先抢桥头的兵工厂和医院，再过河。',
    rows: [
      'f...ff*..f.mmmmf',
      '.Hrrrrrrrrrwg*f.',
      '.B.K.r.fvvvvmrc.',
      'fK.ufr.cvxlf.r.f',
      '..ff.rrrbrrrrr..',
      'f.fffrcvvcr.ff.*',
      'f....rcvucr.ff.f',
      '..rrrrrbrrr.....',
      'f.r.f.hvc.rfu.cf',
      '.crsvvvvf.r.c.x.',
      'ffr*verrrrrrrrH.',
      '.f.svs.ff..f...f',
    ],
    p2: [[14, 10], [14, 9], [12, 9], [14, 8]],
    units: [['inf', 2, 1], ['inf', 2, 2], ['tnk', 1, 0]],
    units2: [['inf', 13, 10], ['inf', 13, 9], ['tnk', 14, 11]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
