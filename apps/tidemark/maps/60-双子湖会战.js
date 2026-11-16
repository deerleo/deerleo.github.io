// 双子湖会战：32×20，全游戏最大的图。南北两座大湖夹着一条走廊平原，运河城横在正中。
// 坐标 x 从左 0 起，y 从上 0 起。大写 = 红方开局自有；蓝方自有建筑写中立字符（司令部写 H）再列进 p2。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '双子湖会战', size: '32×20 · 两湖夹一城，海陆空总决战', order: 60,
    blurb: '北边的雁栖湖和南边的沉星湖夹着一条四格宽的走廊，运河城横在正中：两座桥各接一座船闸港，船只能从船闸进出两湖，步兵站上船闸就能把对方舰队堵在一边。绕湖公路是两条远路，北路过河口桥和山口碉堡，南路过沼泽堤道和陨星矿半岛。战列舰停在湖心够得着城里每条街。',
    rows: [
      //         1111111111222222222233
      //1234567890123456789012345678901
      'mmmfff.ffc.mvmmff*.cla.mmmmmmmmm', // 0
      'mmfffrrrrrrrbrrfffrrrrrrkrrmmmmm', // 1  北绕湖公路：河口桥、山口碉堡
      'mff.fr.ff.c.verrrrre~~~emfrmmfmm', // 2
      'ff.rrrffe~~~~~e*iwe~~~~~efrrrfmm', // 3  导弹井半岛
      'fw*r.ffe~~~cf~~~e~~o~~~~~effrffm', // 4
      'wGwrrrrS~~~e~~o~~~~~o~~~prrrrffm', // 5
      'fw.r.ffffe~~~~~~~o~~~~~ewwffr.mm', // 6
      'f.Kr.ffwwiee~~~~~~~~~ewwgwu.r.mm', // 7
      '...rB.ff.rrrrrrbprrrrrrwwu..ra.m', // 8  北桥 + 北船闸
      '.HrrrrFrrrcuxrc~~urcthruu.x.r..m', // 9
      '...r.Bfffrthcru~~crxucrrrkrrrrH.', // 10
      'f.Pr..fw.rrrrrrpbrrrrrruw..xr..m', // 11 南船闸 + 南桥
      'ff.r.fwgwfee~~~~~~effeiwwuffrc.m', // 12
      'mffr.ffsse~~~~o~~~~~~~~e.ff.r.wm', // 13
      'mffrrrrp~~~o~~~~~~ue~~~~prrrrwgw', // 14
      'mmfrf.se~~~eo~~~~efce~~~ef.rr*wm', // 15
      'mmfr.fsse~~~~~eg*~~~~~eeff.r.fmm', // 16 矿场半岛
      'mm.rrmfmmsse~rrrrres.c.ff.rr.fmm', // 17
      'mmf.rrrkrrrrrr*wwrrrrrrrrrrfffmm', // 18 南绕湖公路：山口碉堡、沼泽堤道
      'mmmffmmmmsalcffwwfsss.c.ff.fffmm', // 19
    ],
    p2: [[30, 10], [26, 9], [27, 11], [29, 8], [24, 14], [30, 14], [29, 12], [25, 10]],
    units: [['inf', 2, 8], ['inf', 1, 10], ['bik', 2, 10], ['tnk', 4, 9]],
    units2: [['inf', 29, 11], ['inf', 30, 9], ['bik', 29, 9], ['tnk', 27, 10]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
