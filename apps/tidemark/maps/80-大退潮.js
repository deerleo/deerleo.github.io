// 大退潮：64×64，四国各自为战的史诗图。赤焰（1）西北高原，苍蓝（2）东北海岸，翠林（3）西南群山，金沙（4）东南沙原。
// 坐标 x 从左 0 起，y 从上 0 起。骨架由 tools/gen-大退潮.js 生成，再逐区手工修订；这里的 rows / owner 是写死的最终结果。
// 分区：
//   北 铁脊山脉（y 0–14）：外环公路走高原谷地，正中是山口要塞（兵工厂、雷达塔、医院、两座碉堡）；两个山口通向北岸港镇。
//   东 千帆海（x 44–63）：长堤岛上的闸口镇（船闸港、兵工厂、雷达塔），外侧是跨海大桥串起的三座岛（矿场、机场、船闸港）。
//   南 沙原商路（y 49–63）：城墙围着的中城（兵工厂、医院、雷达塔），东集、西集，南岸港和机场。
//   西 雨林大河（x 0–14）：大河两条支流汇进西潟，中寨（兵工厂、雷达塔、医院）、河口镇（港口）、林间机场。
//   中央 潮眼湖：四座船闸把湖和北潟、东潟、南潟、西潟连成一片水域；四片海床各有前进兵站、两座矿场、导弹井、碉堡。
// 路网：外环公路连四国本土；岸边四条公路围成内圈；四条干道从本土斜插到潮眼的环湖路；山口、河桥、商路把内外圈接起来。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '退潮海床', size: '64×64 · 4 个阵营 · 海陆空全开的史诗图', order: 80,
    blurb: '潮水比往年早退了两年，中央海只剩海眼湖和四片浅湖，四座船闸还连着它们。四国各占一角：往中间是露出海床的陨星矿和导弹井，往两边是山口要塞、跨海大桥、沙原商城和雨林大河。前线的兵工厂、机场、港口都能就地补兵，打下来再往前走。',
    players: 4,
    rules: { dayLimit: 100 },
    rows: [
      'mmmmmmmmmmwmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm.ff....ce~~~o~', // 0
      'mmwgwmmwwmwwmmm...mmmmmmmm...mmmmmmmmmmff.mm.m......c.....eee~~~', // 1
      'mwwrrrrrrrrwfmf...wgw.c.ww....mmmm.ff....c.wgw.......rrrrrrrre~~', // 2
      'mwwrwac*wxrwfff....w.c..ww..m#mtm#mmf.....c.w........r.a..x.rce~', // 3
      'mmwr.#k#w.rw.#ff..rrrrrrrf.um#kxk#mmu...rrrrrrr...ff.r..c...ree~', // 4
      'mwcrrrrrrrrrrrrrrrr...rfrffrrrrrrrrrrff.rr....rrrrrrrrrrrrrrrp~~', // 5
      'mmw.wr.wr.w..#....w...rfrrrr.#mhm#mmrrrrrr..ff.......x...r..e~~o', // 6
      'mwwxwr.cr#wwmff.ffmmmmrmmmufffmmmmfffffffrfwww.....c.....r.e~~~~', // 7
      'mmw..rrrHrrwm.f.mmmmmmrmmmmmmmmmmmmmmmfffrfww.mff.ffrrrHrre~~o~~', // 8
      'mw..wr.w.#rw..fmmmmmmmrmmmmmmmmmmmmmmmmmmrmmmmmmm...r....re~~~e~', // 9
      'mmw..rwwgwr..ffmmmmmmmkmmmmmmmmmmmmmmmmmmkmmmmmmmff.r..c.rc*~~ee', // 10
      'mm.w.rmfwwrrrr.fmmmmmmrff.vffwmmmmmmmvmmmrmmmmmmff..r.f..r.e~~~e', // 11
      'm.w..rmff.w.fr.fffffffrwwwvw.c.al.c.mvmffrffffffffrrr.ff.r..e~~~', // 12
      'mm..#r#.f...frrrfffrrrrrrrbrrrrrrrrrrbrrrrrrrrrfffr...f..r.fe~~o', // 13
      '.mmffr...v..fffr.ffrffffffveeeep~e.eev........rfffr......rffe~~~', // 14
      'mmmf.r...v..fffrrrrreewe~~~~~~~~~~o~~~eeeewwwwrrrrr..e.e.reee~~~', // 15
      'mmfffr...vv.fffrwreeeee~~~~~~~~~~~~~~~~eeewwwwwwr.r.e~~~~b~o~~~~', // 16
      'mmfffrfs..v.fffrerrrrrp~~~o~~~~~~~oue~~~eewwwwrrr.ree~~~~b~~~~~~', // 17
      'mmf.frfsssvffffreeereuee~~~~~~~~~~~~~~~~~wwwwwrweerr~~~~~b~~~~~~', // 18
      'mfffrrfsssvffrrreeerrreeee~~~~~~~~~~~~~~~ewwrrrw~eere~~~eree~~~~', // 19
      'ffffr.fssvvssrseeeeeereuuewweee~~eewww.ewweerwr~~e.re~~ecrfg~~~~', // 20
      'ffffr.fsgvss.rfeuuuuurrreueewue~~~eeww##eerrrwr~e..re~~eerfeo~~~', // 21
      'ffffrrrrrbbrrrfeeeueueerxeewwe~~~ewwee#ecereewc~e..r.~~~crfe~~~~', // 22
      'mmffrffsssvfcrfeeeeeeecrrrrrge~~eewgrrrrrrreeee~effro~~~ere~~~~~', // 23
      'mmfcrffsssvfrr.e~o~~euerwreewee~~ewwweuerxeeee~~ff.r~~~~~b~~o~~~', // 24
      'mmffrffsssvfr..e~~~~uuerwrkree.~~eewwerrrewee~~~e..r~e~~obo~~o~~', // 25
      'mmmfrfffffvsrss~~~~~euureeereue~~ewwiwkwrwuee~~~e.rr~u~~~b~~~~~~', // 26
      'mmmfrrrfffvarsso~~~~eewrueirree~eewerrrwrwuuu~~ooere~o~~~b~~~eo~', // 27
      'mmmfffrfffvsrrs~~e~~wwegueeerrrprrrrrwwwgweu~~~~e.rce~~~~b~~~~~~', // 28
      'mmmf..rfffvvvbs~~u~~weeeueeere~~~~erwwwewwee~~~~ecrce~~~ere~~~~~', // 29
      'mmmf.cr.ffsssbv~~~~~ee~~euuer~~~~~~reeeeeuee~~~~~erc~~~ecra.~~~~', // 30
      'mmmf..rxffss.r*~~~~~~~~~~~~er~~te~~p~~~~~~~~~~~~~~p~~~~e*rle~~~~', // 31
      'mmmf.trlfssscrp~~~o~~~~~~~~~p~~eu~~re~~~~~~~w~~~~xre~~~~~p~~~~~~', // 32
      'mmmff.rhffss.re~~~~~e~eeeseer~~~~~~rwee~~eeee~~~eert.~~e.rce~~~~', // 33
      'mmmfffrfsffssrs~~~~~eesseeeere~~~~erwwwwewwee~~~e.re~~oehr.e~~~~', // 34
      'mmmfffrfsfsssrvo~~~~esegeeerrrrrprrrwwwwgwwee~~~~eree~~~ere~~~~~', // 35
      'mmmfffrfffsscbv~~~~~eeererrrweee~eerriwwrwwwe~~~~rree~o~~b~~~e~~', // 36
      'mmmfrrrfffsvvrs~~~~eseerekeiese~~eeeruwwrwwww~~~~reeeue~~b~~ec.~', // 37
      'mmmfrfffsfsvsrs~~~~esserrreeeee~~~eerkrwrwwew~~~~reee~~~~b~~oe~~', // 38
      'mmmcrffsssvvfrse~~~ueuxreesseee~~eewwwrureuwwe~~~reeeo~~~b~o~~~~', // 39
      'mmmfrffsssvcfrfee~ewerrrrrrrge~~~eegrrrrrcwwww~~ereee~o~ere~~~~~', // 40
      'mmmfrrrrrrbrrrfeepewereceewuwwe~~eeeeeuxrewwww~~ereee~~~er.e~~~~', // 41
      'mmmfr.fsgvvffrfeererrreesswwwwu~~eeeeeeerrrwwuu~ereee~~ecrkgo~~~', // 42
      'mmmfrffvvffffrfeerereweeseewuew~~eeeeeeeuwrwwwwe.rre.~~~er.e~~~~', // 43
      'mmmfrrfvsffffrfwerrreeeeeee~~~~~~~~~~~~~ewrrrwww..re~~~~~re~~~~~', // 44
      'mmmfvbvvsffffrfuereeweee~~~~~~~~~~~~~~~~~ewwrwww..ree~~o~b~~~~o~', // 45
      'mmvvvrfffffffrrrrrewwwee~~~euo~~~~~~o~~~~prrrrree.ree~~~~b~~~~~~', // 46
      'mmmffrffffffffsr.ewwwue~~~~~~~~~~~~~~~~~eeeeeeree.ree~~~~b~~o~~~', // 47
      'mmmmfrffffsssrrreewwwwwe~~~~~~~o~~~~~eeeeeeeeerrrereeeeeereeewee', // 48
      'mmmffr.ffffssrwwwweeeeeeeeeeeee~p~eeeeeewwweweeerereeeeeerewwwee', // 49
      'mff.fr.f.fsf.rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrwweweerewwwee', // 50
      'mf.cfrff.f*frrfeeeeeeereeewawweereeeceeeereeeeewwerwecewwrwwewwe', // 51
      'mmf.fr.f.frrr.feee.e.creewwww##crc##eeeerc.ee.ffwwrrrw###r##wwee', // 52
      'mff.xr.fc.r.ff.ee..eeergewwww#h*rex#eeegreeeeffwwew*rw#c.rx#wawe', // 53
      'mmfa.r.ff.rf.ffeeeeeeerrrrrrrrrrrrrrrrrrreeeewwwwewwre#..r.#wwee', // 54
      'mffg.rrrHrrf.swwwweeeereewwww#cert.#eeeereeweewwwwewrrrHrrc#wcww', // 55
      'mmf..r...f.fvswwwweeecrewwwww##krk##eeeerceweeewwwegwx#c.r.kwwee', // 56
      'mmfc.rx.ff.vvsewwweeeerewwrrrrrrrrrrrrreerewwwwwwwwwwe##crc#weww', // 57
      'mmmf.rrrrrrbrrrrrrrreerwwwkwwweeeeeeeekeerewwrrrrrrrrrrrrrwwewwe', // 58
      'mmmff.f.c.vv..eewwwrrrrrrrrwwwweeeeeeerrrrrrrrwweeeewwwweewwwwwe', // 59
      'mmmmf.ff..v...eewwwwwweeeewwwwmeemmmmmemmmwwweeeweewwwuewwweewee', // 60
      'mmmmmfffhvv...eeewwwwweeeewwwwmwwweemmmewwwwwweeeeeeewwwwweewwee', // 61
      'mmmmmmfffvf..feeeewwwweemwwmmmmm*weeeemewwwwwweeeeweeeweemmeemwe', // 62
      'mmmmmmmfvvff.feeeemmwwwwmwemmmmmwweeeeeeeeeewweeeeeweeeewmmmwmee', // 63
    ],
    owner: [
      '................................................................', // 0
      '...1................................................2...........', // 1
      '................................................................', // 2
      '.....1...1.............................................2..2..2..', // 3
      '......1.........................................................', // 4
      '..1..........................................................2..', // 5
      '.....................................................2..........', // 6
      '...1...1...........................................2............', // 7
      '........1..............................................2........', // 8
      '................................................................', // 9
      '..........................................................2.....', // 10
      '................................................................', // 11
      '................................................................', // 12
      '................................................................', // 13
      '................................................................', // 14
      '................................................................', // 15
      '................................................................', // 16
      '......................1.........................................', // 17
      '................................................................', // 18
      '................................................................', // 19
      '................................................................', // 20
      '................................................................', // 21
      '................................................................', // 22
      '................................................................', // 23
      '................................................................', // 24
      '................................................................', // 25
      '................................................................', // 26
      '................................................................', // 27
      '................................................................', // 28
      '................................................................', // 29
      '................................................................', // 30
      '................................................................', // 31
      '................................................................', // 32
      '................................................................', // 33
      '................................................................', // 34
      '................................................................', // 35
      '................................................................', // 36
      '................................................................', // 37
      '................................................................', // 38
      '................................................................', // 39
      '................................................................', // 40
      '.................3..............................................', // 41
      '................................................................', // 42
      '................................................................', // 43
      '................................................................', // 44
      '................................................................', // 45
      '.........................................4......................', // 46
      '................................................................', // 47
      '................................................................', // 48
      '................................................................', // 49
      '................................................................', // 50
      '................................................................', // 51
      '................................................................', // 52
      '....3...3..............................................4..4..4..', // 53
      '...3............................................................', // 54
      '...3....3..............................................4..4.....', // 55
      '.....................................................4.4...4....', // 56
      '...3..3.................................................4.......', // 57
      '................................................................', // 58
      '................................................................', // 59
      '................................................................', // 60
      '........3.......................................................', // 61
      '................................................................', // 62
      '................................................................', // 63
    ],
    armies: {
      1: [['inf',8,7],['inf',7,8],['bik',9,8],['tnk',8,6]],
      2: [['inf',55,7],['inf',54,8],['bik',56,8],['tnk',55,9]],
      3: [['inf',7,55],['inf',9,55],['bik',8,56],['tnk',6,55]],
      4: [['inf',56,55],['inf',54,55],['bik',57,55],['tnk',57,56]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
