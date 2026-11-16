// 雾松林：战役《回潮》3-2「看错了」专用图。26×18，迷雾。1 号席位赤焰（北，进山口），2 号席位翠林（南，玩家）。
// 地理：北面一道山，正中是进山口（赤焰司令部）；东西各一道矮山；山溪从进山口西侧的山里出来，向东南流出图外。
// 山路成环：进山口 → 西北寨 → 西南寨 → 翠林司令部 → 南浅滩 → 东南寨 → 东北寨 → 进山口；中寨在环心，向西过木桥、向东各接一段。
// 溪上三处能过车：北浅滩 (8,4)、木桥 (10,9)、南浅滩 (17,13)（浅滩用沙滩表示，履带和轮式都能过）。步兵可以直接蹚溪。
// 五个寨子（marks）：village1 西北寨 (4,5，带碉堡 6,5)  village2 东北寨 (19,5)  village3 中寨 (13,8，旁边 14,9 是雷达塔)
//                  village4 西南寨 (4,11)  village5 东南寨 (21,11，带医院 22,11)。烧过的旧林地（废墟）在进山口南面 (12,5)(13,5)(13,6) 和东南 (17,10)。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '雾松林', size: '26×18 · 迷雾 · 林间五寨', order: 82,
    blurb: '翠林腹地的老林子，五个寨子散在林间，用一圈山路连着。赤焰的喷火兵从北边的山口进来，轮式车只能走山路，过溪要找浅滩和木桥。翠林人少，靠森林隐蔽、伏击、拖时间。',
    players: 2,
    campaign: true,
    rules: { fog: true },
    rows: [
      'mmmmmmmmmmf.r..fmmmmmmmmmm', // 0
      'mmmmmmfmm.cHrx.fmmfmmmmmmm', // 1
      'mmmmffmvf.xrrrc.ffmmffmmmm', // 2
      'mmfffffvvf..r.*ffffffffmmm', // 3
      'mmfffrrrerrrrrrffffffffmmm', // 4
      'mmf.crkfvvffuurrrrrc.ffmmm', // 5
      'mff..rfffvfffurffffr*ffmmm', // 6
      'mffffrfffvvff.r*fffrffffmm', // 7
      'mmfffrff*fvrrcrrrrrrffffmm', // 8
      'mmff.rrrrrbr..tffffrfffmmm', // 9
      'mffffrffffvvfffffufr*..fmm', // 10
      'mff.cr.ffffvvvffffrrrchfmm', // 11
      'mmf..rrfff*.fvvvfrrf..ffmm', // 12
      'mmffffrrff.ffffvvevfffffmm', // 13
      'mffffffrrr.c.ffffrvvvffffm', // 14
      'mmfffffffrxrHrrrrrffvvvffm', // 15
      'mmmffffff...rc.fffffffvvfm', // 16
      'mmmmfffffff.r.ffffffffmvmm', // 17
    ],
    owner: [
      '..........................', // 0
      '..........11.1............', // 1
      '..........1...1...........', // 2
      '..........................', // 3
      '..........................', // 4
      '....2.2............2......', // 5
      '..........................', // 6
      '..........................', // 7
      '.............2............', // 8
      '..........................', // 9
      '..........................', // 10
      '....2................22...', // 11
      '..........................', // 12
      '..........................', // 13
      '...........2..............', // 14
      '..........2.2.............', // 15
      '.............2............', // 16
      '..........................', // 17
    ],
    marks: {
      village1: [4, 5], village2: [19, 5], village3: [13, 8], village4: [4, 11], village5: [21, 11],
    },
    armies: {
      // 赤焰：喷火兵 ×3、破甲兵 ×2、轻型坦克 ×2、自行火炮 ×1，堆在进山口
      1: [['flm', 11, 3], ['flm', 12, 3], ['flm', 13, 3], ['mech', 9, 2], ['mech', 15, 2], ['tnk', 11, 2], ['tnk', 13, 2], ['art', 12, 1]],
      // 翠林：步兵 ×4（西北寨、东北寨、中寨、司令部北面）、狙击手 ×1（中寨南）、投弹手 ×1（西北寨碉堡）、摩托兵 ×1（司令部旁）
      2: [['inf', 4, 5], ['inf', 19, 5], ['inf', 13, 8], ['inf', 12, 14], ['snp', 13, 9], ['grn', 6, 5], ['bik', 13, 15]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
