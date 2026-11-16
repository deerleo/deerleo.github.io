// 断龙岭：一道斜贯全图的山脉，三处隘口。红方在西南谷地，蓝方在东北谷地。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '断龙岭', size: '30×18 · 一道山脉三处隘口，关城攻防', order: 20,
    blurb: '断龙岭斜贯全境，把两片河谷隔开。中央公路穿过旧关城，城墙、碉堡和山顶雷达塔都在这里；北边沿山溪有一条窄谷，轮式车开不进去；南边山脚的荒地路绕得远，路中间有一座陨星矿。火炮和狙击手上碉堡守关，飞机可以直接翻山。',
    rows: [
      'fff..mmmmmmmf....ff.fff..ffmmm',
      'f.cc.mmmwi*mff.uu.fufff.ff.fmm',
      '.rrrrrfffusffrrrrrr.ff....fffm',
      '.ffrvvvvvvvvmff..cr.f..xch.ff.',
      '..hrvmmmm~~mmmff..rrrrrrH..f..',
      'vvvbv.mmm~~mmmmmmu#h..xrc.ff..',
      '..urffwummmmmmmmmmucx.cr.a....',
      'ff.rffww..##mmgc*m##rrrrrrr.ff',
      'f..rf.*u#..lFutrrrrrru#.ffr.ff',
      '..frf...urrrrrrkuku..#u*f.r..f',
      '.ffrrrrrrr##m*ccmm##..ww.frff.',
      '.ff.P.rKuxu.mmmmmmmmmwuw.frff.',
      'ff...KrB.rh.fmmmmmmmmvvvv.r.f.',
      'ff..DHrrrrrr.fu.mmmmm.ffvvbvvv',
      'mff..KB.ff.ru..ffmmmmm.ff.rhss',
      'mmfff..fff.rrrrrw.mmmmw.rrr.fs',
      'mmmff..ff....u.rwww*wwwww.ccff',
      'mmmmf..f...ff..uwuwwgwuw....ff',
    ],
    p2: [[24, 4], [25, 3], [23, 3], [24, 3], [22, 5], [24, 5], [22, 6], [25, 6], [17, 9]],
    units: [['inf', 6, 12], ['inf', 6, 13], ['bik', 7, 13], ['art', 8, 13]],
    units2: [['inf', 23, 5], ['inf', 23, 4], ['bik', 22, 4], ['art', 21, 4]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
