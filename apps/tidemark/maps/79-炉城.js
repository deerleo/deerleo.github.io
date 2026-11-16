// 炉城：赤焰的首都，一座被四方瓜分的工业巨城。40×40，四个阵营各守一角的郊区营地，各自为战。陆军和空军的图，没有海。
// 阵营位置：1 赤焰西北（矿山营地，离炼钢区近），2 苍蓝东北（水库边，离码头区近），3 翠林西南（林地，离编组站近），4 金沙东南（沙地，离商业区近）。
// 分区：正中老城（城墙 x14–25 / y14–25，四座两格宽的城门加四处废墟缺口，中心广场是中立机场）；
//       北炼钢区（y5–12，厂街 y7、铁路式直道 y9、矿场围在厂墙里）；东码头仓储区（x28–33，沿运河的码头路 x30，两座起重机 = 雷达塔）；
//       南商业区（y27–33，棋盘街 y28 / y30 / y32 × x17 / x19–20 / x23 / x26）；西编组站和工人新村（x6–12，三股道 x7 / x9 / x11，碉堡和信号塔）；
//       外圈郊区（森林公园、水库、小山、村镇、农田），四角是营地。
// 路网：环路 x13 / x26 / y13 / y26（四处被废墟打断）；四条两格宽的放射大道从城门通到郊区；每家一条郊区公路通到下一条大道。
// 运河从北郊水库沿老城东墙外（x27）穿城向南，11 格桥、10 处过河点；步兵能蹚水。
// 中立兵工厂 12 座（每个城区 3 座），矿场 4 座（每家附近一座），雷达塔 6 座（老城 2、码头 2、编组站 2）。
// 本文件由 tools/gen-炉城.js 从手写分段拼出（只做拼接和 owner 网格转换）。检查：node tools/check-炉城.js；模拟：DAYS=90 node tools/sim-炉城.js 40；平衡实验：tools/exp-炉城.js
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '炉城', size: '40×40 · 4 个阵营 · 城市巷战，十二座中立兵工厂', order: 79,
    blurb: '赤焰首都炉城被四支军队各占一角。老城墙里有中立机场、雷达塔和医院，城外是炼钢区、码头、商业区和编组站，每个城区三座中立兵工厂。占一座厂，前线就往前挪一条街；运河上的桥和城墙的缺口是巷战里最贵的几格。',
    players: 4,
    rows: [
      'mmmmwwmmffff.mmm...c..fffmm.v.ffff..fff.', // 0
      'mmwcxwwmfffff.mm..crc.ffff.vvvfff.c..ff.', // 1
      'mwHrrrarc.ff.......r.l.ff..vvv.*.xrrrH.f', // 2
      'm#rwwrw*#.f..rrrrrrr...ff...v.....r..rcf', // 3
      'wcrrrrrrrrrrrrww...r...ff..rbrrrrrrrrrxf', // 4
      'w#rxwwrw#wwwwwwvvwur*wwff...vv.ffr..ar..', // 5
      'mwrw.wrrrrcw#g#vvuwrwc##gww..v.ffrc..rff', // 6
      'mfr...wwrrrxrrrruwrrrrxrrrrrrbrrrr...rff', // 7
      'ffr....wrrwcw##ucwwrrwcwcrwvvv..r.ff.r.f', // 8
      'fcr.ffwwrrrrrrrrrrrrrrurrrrbrrrrr.ff.r..', // 9
      'f.c.ffuwwrwcwrc#wucrrc##wcwvuurcw.ff.rc.', // 10
      'ff..ffwmmrw#wrrrxrrrrruwcwwvwcrrxwf..rc.', // 11
      '.fff..umwrwuwrwcwcurrcwucwuvuwrruw..rr.f', // 12
      '.fff..wuwrwwurrrurrrrrrrrrrbrrrcu.mmr.ff', // 13
      '.vvv..wwkrtcwr#####rr##u##rvutrcuwmmrc.f', // 14
      'fvvvc.uwwrrrrr#cuucrrcurc#rvvuruwu..r.ff', // 15
      'ff.vc.wuwrccururrchrcurrt#uvvcrxru..r...', // 16
      'mff..wwxrrwhcr#crrcrcurcc#rvvcruc...r.mm', // 17
      'mmff.wwwurcwur#hcrrrrrruc#rvuwrcuwffr.mm', // 18
      'mmfl.*wwwrrrrrrrcuracrrrrrrbrrrrrrrrr.lm', // 19
      'm.rrrrrrrrrrrrrrrrrchrucrrrbrrrru*ff....', // 20
      '..fr.wwrwrwrur#currrrrrch#rvcurcu.ff..c.', // 21
      'fffr.wururwrwr#ucrccrcrrc#rvwuruxw.f..c.', // 22
      'ff.rc.wrwruxru#trrucrhcrrurvucrrru...ff.', // 23
      'f..rc.krurtrwr#crcurrccuc#rbrrrwu..vv.ff', // 24
      '..frffwrwrurwr##u##rr#####rvctruw.fvvv.f', // 25
      '..frffwrrrrrrrrrrrrrrrrurrrvuwrcw.ff.v..', // 26
      '.ffr.uurgrwcwwchcrcrrcurcurvwcrgw..ff..e', // 27
      '..rr.wwxrruwurrrrrrrrruxrrrvuwruw...f.ee', // 28
      'ffr.ffwwurwwwucucrcrrhcrucrvwurw....c.e.', // 29
      'ffrc..wwwrrrrrrrrrrrrrrrrrrbrrrr....e.we', // 30
      'ffrc...rrrw.wwccurcrrcurccrv...rrw.w.cew', // 31
      'ffr*ssrrfff.urrrrxrrrrrruxrbbrrrrr#c*r.e', // 32
      'mfarrrrfffff.wwucrc*rchru.r.ve..wrrrrrwe', // 33
      'mmr..rcffff...mm....r.ff.wr.vvewcw#.xrwe', // 34
      'mxrrrrrf...ff.m.....r.ff..rrrbrrrrrrrrce', // 35
      'mcrffxff..ff.c.....crrrrrrr.evvwwr.#.rwe', // 36
      'mmHrrfsffff........lrc.ee.c.e.ve.awrrHwe', // 37
      'mmffcfssfmff.ff.....c.eew..e.evewwwxcwee', // 38
      'mmmffmmffmmf.fff.......ew.e.e.veeewwweee', // 39
    ],
    owner: [
      '........................................',
      '...11.............................2.....',
      '..1...1..........................2...2..',
      '......................................2.',
      '.1....................................2.',
      '...1................................2...',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '..3.....................................',
      '....................................4...',
      '.3....................................4.',
      '.3...3..................................',
      '..3..............................4...4..',
      '....3..............................44...',
      '........................................',
    ],
    armies: {
      1: [['inf', 3, 2], ['inf', 2, 3], ['tnk', 4, 2]],
      2: [['inf', 36, 2], ['inf', 37, 3], ['tnk', 35, 2]],
      3: [['inf', 3, 37], ['inf', 2, 36], ['tnk', 4, 37]],
      4: [['inf', 36, 37], ['inf', 37, 36], ['tnk', 35, 37]],
    },
    // 后手补贴减半（默认 0 / 3000 / 6000 / 9000）：图大、四家相隔三十多步，先手占不到便宜，默认补贴下一号位胜率偏低
    handicap: [0, 0, 150, 300, 450],
    rules: { dayLimit: 90 },
  });
})(typeof window !== 'undefined' ? window : globalThis);
