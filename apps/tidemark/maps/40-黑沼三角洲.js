// 黑沼三角洲：大河从西北流向东南，入海前分成东西两条汊流，夹着一座沼泽岛。红方在西岸，蓝方在北岸；车辆只能走上堤、海堤两条公路的四座桥。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '黑沼三角洲', size: '26×18 · 两条堤坝路四座桥，步兵蹚河钻沼泽', order: 40,
    blurb: '大河入海前分成两条汊流，夹着一座沼泽岛，渔村、医院、旧堤防碉堡和海边的炼油厂都在岛上。车辆只能走上堤、海堤两条公路过桥；步兵可以蹚河钻芦苇荡，直升机哪里都能去，炮艇能贴着河口和潮沟打海堤上的部队。',
    rows: [
      'mmmffsvsfff.mmm.ffff.wmmmm',
      'mmmwwsvsffwwgmf.c.ff.wuwmm',
      'mfwgwfvvsfwrrff.*c....a.fm',
      'mffrffsvsfcru.ff.rrrrrr.ff',
      'ff.rr.fvvssrrrrrfr..H.fuwf',
      'fc..r.fsvssff..rfrx.r.fcw.',
      'mffurr.svvssfs.rrrrrrrffe~',
      'mmff.r.fsvsffvvbvsff.rce~~',
      'mmff.rrfsvvvvvurvvvvsrp~~~',
      'mff.K.rrrbrrrrrrsssvvb~~~~',
      'mf.P..rffvvs##k#uffssr~~~~',
      'ff....rB.svssffchc.srre~~~',
      'fK.ff.rffsvvssfs*lurre~~~~',
      'ff...Hrrrrrbrrrrrrrr*~~~~~',
      'mf.c..rffe~~eff~wxge~~~~~~',
      'mmff..rc.*~~~ee~eee~~ef~~~',
      'mffee.pe~~~~o~~~~~~~ote~~~',
      'fee~~~~~~~~~~~~~~~~~~o~~~~',
    ],
    p2: [[20, 4], [17, 2], [22, 2], [18, 5], [23, 5]],
    units: [['inf', 4, 13], ['inf', 6, 12], ['bik', 6, 11]],
    units2: [['inf', 20, 3], ['inf', 19, 5], ['bik', 19, 6]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
