// 雾港：港口都市，河从东北丘陵穿城入海。红方北岸新城，蓝方南岸高地，江心岛是中央争夺点。
// 检查：node tools/check-雾港.js；预览：tools/preview-雾港.html；平衡实验：tools/exp-雾港.js、tools/trace-雾港.js
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '雾港', size: '28×18 · 港口都市，江心岛兵工厂，海军炮击桥头', order: 10,
    blurb: '雾河从东北丘陵穿城入海，北岸新城归赤焰军，南岸高地归苍蓝军。江心岛上的兵工厂和陨星矿离两军一样远，港桥、东桥、上游渡口和绕过河源的山间公路各是一条进攻路线。内港里的战列舰够得着码头路、港桥和江心岛。',
    rows: [
      '~~~~fff..ff...fffmmmmmmmmmmm',
      '~~~*ff....rrrP.ff.rrrrirmmmm',
      '~~~.f.KrB.r.f..ffmrmmmmrfmmm',
      '~~e..crHrKr.fff..mrlmvmrffmm',
      '~~~.rrrrrrrrrrrrrrrrvv.rr.fm',
      '~~~~S.ff.curu.ru*rcevsf.rffm',
      '~~~~eff..ucruhrwurvvvsffr.fm',
      '~~~e.crrrrrr.vbvvbve.fcrrfmm',
      '~o~#~~~~~ecruvxgvruc.ff.rfmm',
      '~~o#~~~~~.urlvbvvrcu.frrr.fm',
      '~o~~~~~~~~vbvvrhcru.ffrw.ffm',
      '~~o~~#~~~pcrucrrrruc.fr*.fmm',
      '~~~o~#~ewg*ruuru.r..ffr.fmmm',
      '~~~~~e.fw..rrrrrrrrrrrr.ffmm',
      '~ef~~~efff..ffr.f.crHr.ffmmm',
      '~cte~~~~~~~prrr.ff.xrc.fmmmm',
      '~~e~~~~~~~~~e.a..ff...fmmmmm',
      '~~~~~~~~~~~~~e.ff.ff.ffmmmmm',
    ],
    p2: [[20, 14], [18, 14], [19, 15], [21, 15], [14, 16], [11, 15]],
    units: [['inf', 6, 3], ['inf', 8, 3], ['bik', 7, 4]],
    units2: [['inf', 19, 14], ['inf', 21, 14], ['bik', 20, 13]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
