// 灯塔岬：海边岬角。海占东南，岬角从海岸中段伸向东南，顶端的雷达塔当灯塔。
// 红方西南角，蓝方东北角；等距线是西北—东南的斜线：山脊（碉堡隘口、矿场）和岬角都压在这条线上。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '灯塔岬', size: '18×12 · 海边岬角，初识海战', order: 2,
    blurb: '沿海公路最近，但整条路都在舰炮射程里；内陆要翻碉堡把守的隘口。岬角根上是渔村的兵工厂和渔港，顶端是灯塔，登陆艇可以把步兵直接送上岬角的沙滩。',
    rows: [
      'ffmmm.f..mmf..fce~',
      'f..mmlrrrrcrrrrHe~',
      'mf..mkr.fmf.w.xrp~',
      '.*f.frm*mm.*.rrr~~',
      'ff.ffrmm.wf.cre~~~',
      '.rcrrrfmg.rrr~~o~~',
      'frff..f.*xr~~~~~~~',
      '.rfrrrrrrrrr~~~~~~',
      'frBr.fce~~pcu~~~~~',
      'KHrr.e~~~~~~.e~~~~',
      '..S~~~o~~~~~~to~~~',
      'fe~~~~~~~~~~o~~~~~',
    ],
    p2: [[15, 1], [14, 2], [16, 2], [15, 0]],
    units: [['inf', 2, 9], ['inf', 1, 8], ['mech', 0, 10], ['lnd', 3, 10]],
    units2: [['inf', 15, 2], ['inf', 14, 1], ['mech', 16, 0], ['lnd', 17, 2]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
