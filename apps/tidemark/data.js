// 潮汐战线：兵种、地形、地图数据
(function (root) {
  const D = {};

  D.PLAYERS = [null, '赤焰', '苍蓝', '翠林', '金沙', '黑潮']; // 下标即阵营编号，0 是中立。黑潮（5）是战役里的第五方：黑色系、点缀冷青白，自由对局默认不可选
  D.METER_MAX = 400; // 自己损失 4000 资金的兵力（或打掉对面 8000）攒满一次；原来 150 太快

  // 军队配色：D.PALETTES[阵营][变体] = { main, light, dark }（界面色）。变体 0 是阵营主色；同一局里有几个席位用同一个阵营时，
  // 按席位顺序第一个用主色，后面的依次用变体 1、2、3（同一色相的明显变体，同屏两两分得开，也不和别的阵营的主色混）。
  // 给素材的编码：owner = 阵营 + 10 × 变体（见 C.colorOf / C.colorCode）
  D.PALETTES = [null, // 色值和素材（AWArt.PAL 等）实际用的一致
    [{ main: '#e03828', light: '#f06848', dark: '#a82018' }, { main: '#fa6137', light: '#ff8155', dark: '#c14424' }, { main: '#881e3e', light: '#b04a66', dark: '#69142e' }, { main: '#ff92b6', light: '#ffb4cc', dark: '#d17494' }], // 赤焰：正红 / 橙红 / 暗红酒色 / 粉红
    [{ main: '#2c70e0', light: '#58a0f4', dark: '#1c4cb0' }, { main: '#24b4cb', light: '#5cd4e6', dark: '#168a9a' }, { main: '#181c88', light: '#4a52c0', dark: '#0f1369' }, { main: '#8ccdff', light: '#b8e0ff', dark: '#6ca4cd' }], // 苍蓝：正蓝 / 青 / 藏青 / 天蓝
    [{ main: '#2cac4c', light: '#60d070', dark: '#1c7c38' }, { main: '#9acb29', light: '#bce25c', dark: '#759a1a' }, { main: '#136d43', light: '#3c9a6c', dark: '#0c5432' }, { main: '#90f4d9', light: '#bcfaea', dark: '#6fc2ab' }], // 翠林：翠绿 / 黄绿 / 墨绿 / 薄荷
    [{ main: '#e8b020', light: '#f8d048', dark: '#b07c10' }, { main: '#c1780b', light: '#e09a30', dark: '#905602' }, { main: '#88592c', light: '#b88858', dark: '#69421f' }, { main: '#f8e9a3', light: '#fff4b4', dark: '#c5b77e' }], // 金沙：金黄 / 深琥珀 / 棕 / 米黄
    [{ main: '#343c4c', light: '#56667c', dark: '#1c222c', glow: '#b8f0f8' }, { main: '#707982', light: '#a0aab4', dark: '#535a61', glow: '#b8f0f8' }, { main: '#603888', light: '#9470c4', dark: '#482869', glow: '#b8f0f8' }, { main: '#dce3e9', light: '#f2f6fa', dark: '#abb2b6', glow: '#b8f0f8' }], // 黑潮：炭黑青 / 铁灰 / 墨紫 / 灰白；glow 是四套共用的点缀发光色（青白）
  ];

  // 第二种资源。玩家看得到的名字都集中在这里，别处的说明文字引用它，改名只改这一处。
  // 来源三种：陨星矿产出、拾取碎片堆、击毁敌方的强化单位（击毁方得它强化价的一半，向上取整；core.js 的 oreBounty）。用途只有一种：强化建造。
  // mine_：矿的产出 { every: 每几回合, amount: 产出几份, min / max: 每座矿一共能产出几份的范围 }。每座矿的储量、每个碎片堆的拾取量（shardMin–shardMax）
  //   都在开局时用 C.rand 各掷一次，存进 s.mineLeft / s.shardAmt（镜像位置取同一个值，见 core.js 的 oreRoll）；查询用 C.mineLeft / C.shardLeft。
  //   占几座算几座，不设上限；自由对局里采完的矿变成普通山地（战役里留着、只给资金）。现成的说明文字在 mineText、shardText
  D.RES = { name: '陨星碎片', short: '碎片', mine: '陨星矿', shard: '碎片堆', pit: '碎片坑', mine_: { every: 1, amount: 1, min: 5, max: 10 }, shardMin: 1, shardMax: 3, atk: 0.2, def: 0.2, heal: 10, repair: 10, move: 1 };
  // 强化价写在每个兵种的 ore 上（1–5，按造价和战场价值分档），也是强化的“档”：攻防加成只对强化价不高于自己的敌方单位生效（core.js 的 oreVs）。
  // 强化建造的效果：有武器的单位攻击 +atk、防御 +def；没有武器的单位防御 +def，另按用途加——医护兵每回合治疗量 +heal（内部 HP，10 = 1 点），维修车每回合修理量 +repair，运输单位移动力 +move
  D.RES.mineText = (D.RES.mine_.every === 1 ? '每回合' : '每 ' + D.RES.mine_.every + ' 回合') + '产出 ' + D.RES.mine_.amount + ' 份' + D.RES.name + '，一共可产出 ' + D.RES.mine_.min + '–' + D.RES.mine_.max + ' 份（每座矿在开局时随机决定），自由对局中采完后变为山地';
  D.RES.shardText = '获得 ' + D.RES.shardMin + '–' + D.RES.shardMax + ' 份' + D.RES.name + '（每个碎片堆在开局时随机决定）'; // 碎片堆的拾取量，界面、图鉴直接用 // 界面、图鉴直接用这一句，别自己拿数字拼
  D.TERRAIN = {
    plain: { name: '平原', def: 1 },
    forest: { name: '森林', def: 2, note: '迷雾开启时，森林中的单位只有相邻时才会被发现。' },
    mountain: { name: '山地', def: 4, note: '只有步兵类单位可以进入。狙击手、投弹手在山地上射程 +1。迷雾开启时，步兵类单位在山地上视野 +3。' },
    road: { name: '道路', def: 0 },
    bridge: { name: '桥梁', def: 0 },
    river: { name: '河流', def: 0 },
    sea: { name: '海洋', def: 0 },
    ruins: { name: '废墟', def: 2 },
    waste: { name: '荒地', def: 1, note: '轮式车辆的移动消耗为 3。' },
    swamp: { name: '沼泽', def: 0, note: '陆上单位的移动消耗增加，轮式车辆不可进入。' },
    beach: { name: '沙滩', def: 0, lander: 1, note: '登陆艇可以进入。陆上单位可以在这里搭乘登陆艇；登陆艇可以在这里把搭载的单位卸载到相邻的格子。' },
    reef: { name: '礁石', def: 2, note: '只有舰船可以进入，移动消耗 2，地形防御 2 星。' },
    wall: { name: '城墙', def: 0, note: '陆上单位与舰船不可通过，航空单位可飞越。' },
    // income：每回合收入金额（没有就不写）。全局金额在第三轮缩小到了十分之一：步兵 100、城市每回合 100。所有金额保持 10 的整数倍。note：给界面和图鉴看的特殊效果说明。
    hq: { name: '司令部', def: 4, prop: true, income: 100, note: '每回合提供 100 资金。停留的己方陆上单位每回合恢复 2 HP（需支付资金）。被敌方占领时，己方败北。' },
    city: { name: '城市', def: 3, prop: true, income: 100, note: '每回合提供 100 资金。停留的己方陆上单位每回合恢复 2 HP（需支付资金）。' },
    factory: { name: '兵工厂', def: 3, prop: true, income: 100, note: '每回合提供 100 资金。可生产陆上单位。停留的己方陆上单位每回合恢复 2 HP（需支付资金）。' },
    airport: { name: '机场', def: 3, prop: true, income: 100, note: '每回合提供 100 资金。可生产航空单位。停留的己方航空单位与步兵类单位每回合恢复 2 HP（需支付资金）。' },
    port: { name: '港口', def: 3, prop: true, income: 100, note: '每回合提供 100 资金。可生产舰船。停留的己方舰船与步兵类单位每回合恢复 2 HP（需支付资金）。' },
    // aura：范围增益。建筑主人的单位站在曼哈顿距离 r 格内时攻击 +atk；几座重叠不叠加
    tower: { name: '雷达塔', def: 3, prop: true, aura: { r: 5, atk: 0.1 }, note: '停留的己方步兵类单位每回合恢复 2 HP（需支付资金）。己方雷达塔 5 格范围内的己方单位攻击 +10%。多座雷达塔的效果不叠加。' },
    mine: { name: D.RES.mine, def: 3, prop: true, income: 200, note: '每回合提供 200 资金；' + D.RES.mineText + '。停留的己方步兵类单位每回合恢复 2 HP（需支付资金）。' },
    // 可拾取的地面物件：陆上单位结束移动停在上面即拾取，这一格变成荒地。移动消耗和荒地一样，没有地形防御
    shard: { name: D.RES.shard, def: 0, note: '陆上单位结束移动停在这一格时拾取，' + D.RES.shardText + '，这一格变为' + D.RES.pit + '（与荒地相同）。轮式车辆的移动消耗为 3。' },
    // 拾取以后留下的空坑：和荒地一样（1 星防御、同样的移动消耗），不能再拾取
    shard_used: { name: D.RES.pit, def: 1, note: '已被拾取的' + D.RES.shard + '，与荒地相同。轮式车辆的移动消耗为 3。' },
    hospital: { name: '医院', def: 3, prop: true, note: '停留的己方步兵类单位每回合恢复 4 HP，相邻四格内的己方步兵类单位每回合恢复 2 HP（需支付资金）。' },
    // 潮闸：可占领，没有收入。战役里它的归属决定涨水快慢（rules.flood.gates）；别的对局里只是一座 4 星防御的建筑
    gate: { name: '闸房', def: 4, prop: true, note: '大闸的机房。停留的己方步兵类单位每回合恢复 2 HP（需支付资金）。在会涨水的关卡中，每占有一座闸房，下一次涨水推迟 1 天；全部占有时停止涨水。' },
    fort: { name: '碉堡', def: 4, prop: true, note: '停留的己方步兵类单位每回合恢复 2 HP（需支付资金）。位于己方或中立碉堡的单位受到的反击伤害减半，其中远程单位（含投弹手）射程 +1。' },
    // research：每座己方科研所每回合白给多少研究点（停档也给），每方最多算几座。rules.tech 关掉时它只是一座有防御的建筑
    lab: { name: '科研所', def: 3, prop: true, research: { pts: 3, max: 3 }, note: '每回合提供 3 研究点（每个阵营最多计 3 座）。停留的己方步兵类单位每回合恢复 2 HP（需支付资金）。可以在这里研究科技。' },
    silo: { name: '导弹井', def: 3, note: '可占领建筑的兵种（步兵、破甲兵、摩托兵）进入后可发射一次：指定一格为中心，2 格内所有单位各损失 3 HP（最低保留 1 HP）。' },
    silo_used: { name: '导弹井（已发射）', def: 3 },
  };

  // 移动消耗，0 表示无法进入
  // 陆军进建筑（prop）一律 1，不用写在表里；表里没写的地形（礁石、城墙）= 进不去
  D.MOVE = {
    foot: { plain: 1, forest: 1, mountain: 2, road: 1, bridge: 1, river: 2, sea: 0, ruins: 1, waste: 1, swamp: 2, beach: 1, silo: 1, silo_used: 1, shard: 1, shard_used: 1 },
    mech: { plain: 1, forest: 1, mountain: 1, road: 1, bridge: 1, river: 1, sea: 0, ruins: 1, waste: 1, swamp: 2, beach: 1, silo: 1, silo_used: 1, shard: 1, shard_used: 1 },
    tread: { plain: 1, forest: 2, mountain: 0, road: 1, bridge: 1, river: 0, sea: 0, ruins: 2, waste: 2, swamp: 3, beach: 1, silo: 1, silo_used: 1, shard: 2, shard_used: 2 },
    wheel: { plain: 2, forest: 3, mountain: 0, road: 1, bridge: 1, river: 0, sea: 0, ruins: 2, waste: 3, swamp: 0, beach: 2, silo: 1, silo_used: 1, shard: 3, shard_used: 3 },
    // 船。登陆艇（能装陆军的船）另外能进带 lander 标记的地形（沙滩），消耗见 D.TERRAIN
    ship: { sea: 1, port: 1, reef: 2 },
    // 轨道（装甲列车）：只走道路、桥梁和建筑格
    rail: { road: 1, bridge: 1 },
  };

  D.ORDER = ['inf', 'mech', 'snp', 'grn', 'flm', 'mdc', 'bik', 'rec', 'tnk', 'med', 'hvy', 'art', 'rkt', 'aa', 'sam', 'rep', 'apc',
    'cop', 'tcp', 'atk', 'bmb', 'ftr', 'gbt', 'dst', 'sub', 'bsh', 'lnd'];

  // vision：迷雾下的视野（曼哈顿距离），规则见 tools/MULTI-SPEC.md“对局选项与迷雾”
  D.UNITS = {
    // 陆军
    inf: { name: '步兵', cost: 100, ore: 1, move: 3, vision: 2, mt: 'foot', range: [1, 1], cap: true, from: 'factory', desc: '造价低廉，可占领建筑，可进入山地与河流。' },
    mech: { name: '破甲兵', cost: 300, ore: 1, move: 2, vision: 2, mt: 'mech', range: [1, 1], cap: true, from: 'factory', desc: '装备火箭筒的步兵，可占领建筑，对坦克伤害较高，在山地、河流上的移动消耗为 1。' },
    snp: { name: '狙击手', cost: 300, ore: 1, move: 3, vision: 3, mt: 'foot', range: [2, 4], from: 'factory', desc: '射程 2–4 的远程步兵，擅长攻击步兵类单位，也可攻击轻型车辆和直升机。在山地上射程 +1。移动后不可攻击。' },
    // lob：抛射，移动后也能攻击；打 2 格外的目标不挨反击，打贴身的照常挨。cover：目标的地形防御按几成算（不写 = 1）
    grn: { name: '投弹手', cost: 350, ore: 1, move: 3, vision: 2, mt: 'foot', range: [1, 2], lob: true, cover: 0.5, from: 'factory', desc: '射程 1–2，移动后仍可攻击。攻击时目标的地形防御减半，擅长攻击位于建筑、森林、山地的步兵类单位。攻击 2 格外的目标时不受反击。在山地上射程 +1。不可攻击航空单位和舰船，不可占领。' },
    // reveal：开迷雾时，周围 8 格（含斜角）森林、废墟、礁石里的隐蔽单位对己方可见
    flm: { name: '喷火兵', cost: 400, ore: 1, move: 3, vision: 2, mt: 'mech', range: [1, 1], cover: 0, reveal: true, from: 'factory', desc: '射程 1，攻击时无视目标的地形防御，擅长攻击位于建筑、山地的步兵类单位。迷雾开启时，可发现周围 8 格森林、废墟中的隐蔽单位。不敌远程单位和车辆，不可攻击航空单位和舰船，不可占领。' },
    // 医护兵：没有武器、不能占领；治疗规则在 core.js 的 C.startTurn
    mdc: { name: '医护兵', cost: 300, ore: 1, move: 3, vision: 2, mt: 'foot', range: null, from: 'factory', desc: '无武装。相邻的己方步兵类单位每回合恢复 2 HP（无需支付资金）。多名医护兵的效果不叠加。' },
    bik: { name: '摩托兵', cost: 250, ore: 1, move: 5, vision: 3, mt: 'tread', range: [1, 1], cap: true, from: 'factory', desc: '乘坐摩托车的步兵，可占领建筑，移动力高，适合占领远处的建筑。不可进入山地。' },
    rec: { name: '侦察车', cost: 400, ore: 2, move: 8, vision: 5, mt: 'wheel', range: [1, 1], from: 'factory', desc: '陆上单位中移动力最高，擅长攻击步兵类单位和无掩护的火炮，不敌坦克。' },
    tnk: { name: '轻型坦克', cost: 700, ore: 2, move: 6, vision: 3, mt: 'tread', range: [1, 1], from: 'factory', desc: '陆上主力，造价较低，攻击与防御均衡。' },
    med: { name: '中型坦克', cost: 1200, ore: 3, move: 5, vision: 3, mt: 'tread', range: [1, 1], from: 'factory', desc: '攻击与防御高于轻型坦克，造价适中。' },
    hvy: { name: '重型坦克', cost: 1800, ore: 4, move: 4, vision: 2, mt: 'tread', range: [1, 1], from: 'factory', desc: '陆上单位中攻击与防御最高，造价高，移动力低。' },
    art: { name: '自行火炮', cost: 600, ore: 2, move: 5, vision: 2, mt: 'tread', range: [2, 3], from: 'factory', desc: '射程 2–3，可攻击舰船。移动后不可攻击，不可攻击相邻的敌方单位。' },
    rkt: { name: '火箭炮', cost: 1100, ore: 3, move: 5, vision: 1, mt: 'wheel', range: [3, 5], from: 'factory', desc: '射程 3–5，射程长于自行火炮，擅长攻击重型车辆。移动后不可攻击。' },
    aa: { name: '防空车', cost: 800, ore: 2, move: 6, vision: 3, mt: 'tread', range: [1, 1], from: 'factory', desc: '射程 1，擅长攻击航空单位，对步兵类单位伤害也较高。' },
    sam: { name: '防空导弹', cost: 1000, ore: 3, move: 4, vision: 2, mt: 'wheel', range: [3, 6], from: 'factory', desc: '射程 3–6，只能攻击航空单位，伤害极高。移动后不可攻击。' },
    rep: { name: '维修车', cost: 500, ore: 2, move: 6, vision: 1, mt: 'tread', range: null, from: 'factory', desc: '无武装。相邻的己方车辆、航空单位、舰船每回合恢复 1 HP（无需支付资金）。' },
    apc: { name: '运兵车', cost: 500, ore: 2, move: 6, vision: 1, mt: 'tread', range: null, carry: { n: 2, kind: 'foot' }, from: 'factory', desc: '无武装。可搭载 2 个徒步的步兵类单位（摩托兵除外），运送至前线后卸载。' },
    // 空军
    cop: { name: '武装直升机', cost: 900, ore: 3, move: 6, vision: 3, mt: 'air', air: true, range: [1, 1], from: 'airport', desc: '移动不受地形影响，擅长攻击陆上单位，不敌防空车。' },
    tcp: { name: '运输直升机', cost: 500, ore: 2, move: 6, vision: 3, mt: 'air', air: true, range: null, carry: { n: 1, kind: 'foot' }, from: 'airport', desc: '无武装。可搭载 1 个徒步的步兵类单位（摩托兵除外），飞越山地与海洋。' },
    atk: { name: '攻击机', cost: 1500, ore: 4, move: 7, vision: 4, mt: 'air', air: true, range: [1, 1], from: 'airport', desc: '可攻击陆上单位和直升机，造价低于轰炸机。' },
    bmb: { name: '轰炸机', cost: 2200, ore: 5, move: 7, vision: 4, mt: 'air', air: true, range: [1, 1], from: 'airport', desc: '对陆上单位和舰船伤害极高，不可攻击航空单位。' },
    ftr: { name: '战斗机', cost: 1800, ore: 4, move: 9, vision: 5, mt: 'air', air: true, range: [1, 1], from: 'airport', desc: '只能攻击航空单位，用于争夺制空权。' },
    // 海军
    gbt: { name: '炮艇', cost: 600, ore: 2, move: 7, vision: 3, mt: 'ship', ship: true, range: [1, 1], from: 'port', desc: '造价低廉的小型舰船，可攻击岸边的陆上单位，擅长攻击登陆艇。' },
    dst: { name: '驱逐舰', cost: 1400, ore: 3, move: 6, vision: 3, mt: 'ship', ship: true, range: [1, 1], from: 'port', desc: '兼具防空与反潜能力，擅长攻击潜艇和航空单位。' },
    sub: { name: '潜艇', cost: 1200, ore: 3, move: 5, vision: 5, mt: 'ship', ship: true, range: [1, 1], from: 'port', desc: '只能攻击舰船，擅长攻击战列舰。航空单位和战列舰不可攻击潜艇。不敌驱逐舰。' },
    bsh: { name: '战列舰', cost: 2200, ore: 5, move: 5, vision: 2, mt: 'ship', ship: true, range: [2, 6], from: 'port', desc: '射程 2–6，可攻击陆上单位和舰船，伤害较高。移动后不可攻击。' },
    // 装甲列车：只走道路、桥梁和建筑格（mt: 'rail'）；射程 1–3，移动后只能打相邻的目标（moveShot）；能装 2 个步兵类；only：只有这个阵营能造
    trn: { name: '装甲列车', cost: 2800, ore: 5, move: 9, vision: 3, mt: 'rail', range: [1, 3], moveShot: { range: [1, 1] }, carry: { n: 2, kind: 'foot' }, from: 'factory', only: 5, desc: '只能在道路、桥梁和建筑上移动。射程 1–3，移动后只能攻击相邻目标。可搭载 2 个徒步的步兵类单位（摩托兵除外）。攻击与防御介于中型坦克和重型坦克之间。' },
    // ── 黑潮的精锐兵种（faction: 5：只有扮演黑潮的席位造得出来；四国的普通兵种黑潮照常能造）。比对应的普通兵种贵、强，各带一个特色 ──
    // after：攻击后还能再移动几格（不能再打、不能占领）；cloak：true = 不相邻就看不见（不开迷雾也算），'idle' = 上一个自己的回合没开过火时才这样
    bgd: { name: '黑甲兵', cost: 300, ore: 2, move: 3, vision: 2, mt: 'foot', range: [1, 1], cap: true, from: 'factory', faction: 5, desc: '黑潮阵营的重装步兵，可占领建筑。对步兵类单位和轻型车辆的伤害高于步兵，受到坦克的伤害明显低于步兵。' },
    bht: { name: '深渊战车', cost: 2600, ore: 5, move: 5, vision: 2, mt: 'tread', range: [1, 1], after: 1, from: 'factory', faction: 5, desc: '黑潮阵营的重型坦克，攻击和防御都高于重型坦克。攻击后可再移动 1 格（不可再次攻击）。' },
    btc: { name: '潮汐炮', cost: 2000, ore: 4, move: 4, vision: 1, mt: 'tread', range: [3, 7], from: 'factory', faction: 5, desc: '射程 3–7 的远程单位，伤害略高于火箭炮。移动后不可攻击。' },
    bnv: { name: '夜鸦', cost: 2600, ore: 5, move: 9, vision: 4, mt: 'air', air: true, range: [1, 1], cloak: true, from: 'airport', faction: 5, desc: '隐形的航空单位：敌方只有相邻时才能发现（迷雾关闭时也有效）。对航空单位伤害高，对陆上单位伤害中等。' },
    bds: { name: '潜渊舰', cost: 3000, ore: 5, move: 5, vision: 3, mt: 'ship', ship: true, range: [2, 5], cloak: 'idle', from: 'port', faction: 5, desc: '射程 2–5 的舰船，移动后不可攻击。上一个己方回合没有攻击时处于下潜状态：敌方只有相邻时才能发现（迷雾关闭时也有效）。' },
    lnd: { name: '登陆艇', cost: 1000, ore: 2, move: 6, vision: 1, mt: 'ship', ship: true, range: null, carry: { n: 2, kind: 'ground' }, from: 'port', desc: '无武装。可搭载 2 个陆上单位，靠岸后卸载。' },
  };

  // 基础伤害表（%）：行 = 攻击方，列 = 防守方（陆 17 | 空 5 | 海 5），- 表示打不了
  // 投弹手 grn、喷火兵 flm 打不了飞机和船（停在港口里的船也不行）
  const N17 = '- - - - - - - - - - - - - - - - -', N5 = '- - - - -';
  const rows = {
    //     inf mech snp grn flm mdc bik rec tnk med hvy art rkt  aa sam rep apc | cop tcp atk bmb ftr | gbt dst sub bsh lnd
    inf: ' 55  45  50  45  45  60  45  12   5   3   1  15  25   5  25  14  14 |   7  30   -   -   - | ' + N5,
    mech: ' 60  55  60  55  50  65  60  75  55  35  25  70  85  65  85  75  75 |   9  35   -   -   - | ' + N5,
    snp: ' 85  75  75  75  85  90  80  45   8   4   2  45  50  25  50  40  40 |  35  40   -   -   - | ' + N5,
    grn: ' 65  55  70  55  55  70  55  40  15   8   4  45  50  20  50  40  40 | ' + N5 + ' | ' + N5,
    flm: ' 90  80  90  85  60  95  80  55  30  15   8  55  60  30  60  50  50 | ' + N5 + ' | ' + N5,
    bik: ' 60  45  70  50  50  65  50  18   6   3   1  20  35   5  35  20  20 |  10  35   -   -   - | ' + N5,
    rec: ' 80  70  85  75  80  85  70  40   6   3   1  60  70  10  70  45  45 |  10  35   -   -   - | ' + N5,
    tnk: ' 75  70  70  70  80  80  75  75  55  30  15  70  85  65  85  75  75 |  10  40   -   -   - |  20   5   1   1  10',
    med: '105  95 105 100 105 110 100  95  75  55  35 105 105 105 105 105 105 |  12  45   -   -   - |  35  30   5  10  35',
    hvy: '125 115 125 120 125 125 120 125  95  70  55 115 125 115 125 125 125 |  22  55   -   -   - |  50  40  10  15  40',
    art: ' 90  85  90  85  95  95  85  70  60  45  35  75  80  75  80  70  70 | ' + N5 + ' |  50  50  25  30  55',
    rkt: ' 95  90  95  90 100 100  90  90  85  75  65  85  85  85  90  80  80 | ' + N5 + ' |  60  60  35  45  60',
    aa: ' 95  90 100  95 100 100  95  60  25  15   8  50  55  45  55  50  50 |  95 120  70  75  65 | ' + N5,
    sam: N17 + ' | 120 120 100 100 100 | ' + N5,
    rep: N17 + ' | ' + N5 + ' | ' + N5,
    apc: N17 + ' | ' + N5 + ' | ' + N5,
    cop: ' 75  75  80  75  80  80  75  55  60  40  20  70  70  30  65  60  60 |  65  95   -   -   - |  25  25   -  10  25',
    tcp: N17 + ' | ' + N5 + ' | ' + N5,
    atk: '100  95 100  95 100 105  95  90  80  65  45  85  85  55  80  85  85 |  85  95   -   -   - |  60  30   -  30  60',
    bmb: '110 110 110 110 110 110 110 105 105 100  90 105 105  95 105 105 105 | ' + N5 + ' |  85  85   -  75  95',
    ftr: N17 + ' | 100 100  80 100  55 | ' + N5,
    gbt: ' 40  35  40  40  40  45  40  35  20  10   5  35  40  30  40  35  35 | ' + N5 + ' |  55  25  20  10  75',
    dst: N17 + ' | 115 115  85  65  55 |  75  45  90  20  70',
    sub: N17 + ' | ' + N5 + ' |  65  35  55  85  95',
    bsh: ' 95  90  95  90  95 100  90  90  85  75  65  80  85  85  90  80  80 | ' + N5 + ' |  90  80   -  50  95',
    mdc: N17 + ' | ' + N5 + ' | ' + N5,
    lnd: N17 + ' | ' + N5 + ' | ' + N5,
  };
  D.DMG = {};
  for (const a of D.ORDER) {
    const vals = rows[a].replace(/\|/g, ' ').trim().split(/\s+/);
    if (vals.length !== D.ORDER.length) throw new Error('伤害表列数不对：' + a + ' ' + vals.length);
    D.DMG[a] = {};
    D.ORDER.forEach((d, i) => { D.DMG[a][d] = vals[i] === '-' ? null : +vals[i]; });
  }
  // 装甲列车 trn 排在最后：打别人和挨打都取中型坦克、重型坦克的平均（打不了的照旧打不了）
  {
    const mid = (x, y) => (x == null || y == null ? null : Math.round((x + y) / 2));
    for (const a of D.ORDER) D.DMG[a].trn = mid(D.DMG[a].med, D.DMG[a].hvy);
    D.DMG.trn = {};
    for (const d2 of D.ORDER) D.DMG.trn[d2] = mid(D.DMG.med[d2], D.DMG.hvy[d2]);
    D.DMG.trn.trn = mid(D.DMG.med.med, D.DMG.hvy.hvy);
    D.ORDER.push('trn');
  }
  // 黑潮的精锐兵种排在 trn 后面。伤害按对应的普通兵种折算（上限 125，打不了的照旧打不了）：
  //   挨打：别人打它 = 打 like 的伤害 × def（黑甲兵挨坦克类的另算 × tank）
  //   进攻：它打别人 = src 打别人的伤害 × atk（黑甲兵打步兵类、轻型车辆 × soft；夜鸦打飞机按战斗机、打别的按武装直升机）
  {
    const EL = {
      bgd: { like: 'inf', def: 0.77, tank: 0.6, src: 'inf', atk: 1.15, soft: 1.3 },
      bht: { like: 'hvy', def: 0.8, src: 'hvy', atk: 1.15 },
      btc: { like: 'rkt', def: 0.9, src: 'rkt', atk: 1.1 },
      bnv: { like: 'ftr', def: 0.85, src: 'cop', atk: 0.9, airSrc: 'ftr', airAtk: 1.1 },
      bds: { like: 'bsh', def: 0.85, src: 'bsh', atk: 1 },
    };
    const TANKS = ['tnk', 'med', 'hvy', 'trn'], SOFT = ['inf', 'mech', 'snp', 'grn', 'flm', 'mdc', 'bik', 'rec', 'apc', 'rep', 'art', 'aa', 'sam', 'rkt'];
    const sc = (v, k) => (v == null ? null : Math.max(1, Math.min(125, Math.round(v * k))));
    const old = D.ORDER.slice(), nu = Object.keys(EL);
    for (const a of old) for (const k of nu) D.DMG[a][k] = sc(D.DMG[a][EL[k].like], EL[k].tank && TANKS.includes(a) ? EL[k].tank : EL[k].def);
    const rowOf = (k, dd) => { const e = EL[k], air = D.UNITS[dd].air; return e.airSrc && air ? sc(D.DMG[e.airSrc][dd], e.airAtk) : sc(D.DMG[e.src][dd], e.soft && (SOFT.includes(dd) || dd === 'bgd') ? e.soft : e.atk); };
    for (const k of nu) { D.DMG[k] = {}; for (const dd of old.concat(nu)) D.DMG[k][dd] = rowOf(k, dd); }
    for (const k of nu) D.ORDER.push(k);
  }

  // 四个阵营的文化底色（下标 = 阵营编号）。偏好跟着指挥官走：选了哪位指挥官，就带上他所属阵营（D.COS[i].faction）的偏好，
  // 和这一局军队用什么颜色无关。幅度都很小（5% 量级），指挥官个人的加成才是主体。mods 和指挥官的 mods 同一套结构；
  // cityIncome：每座城市的收入多几成（整回合收入取整到 100）。s.rules.coPassives = false 时一并关闭。
  D.FACTIONS = [null,
    { name: '赤焰', research: { name: '工时制', desc: '每座兵工厂每回合额外提供 1 研究点，最多 4 研究点；研究经费选“停”档时仍然有效。', factoryPts: 1, factoryMax: 4 }, culture: '钢铁与工厂的工业强国，信奉火力与装甲。', trait: '履带车辆防御 +5%；陆上单位在兵工厂的修理费 −20%。',
      mods: [{ on: 'tread', def: 0.05 }, { on: 'land', repairOn: { factory: 0.8 } }] },
    { name: '苍蓝', research: { name: '议会表决', desc: '每回合额外获得 5 研究点（研究经费选“停”档时没有）。各档研究经费 +20%。', sub: 5, costMul: 1.2 }, culture: '海洋与天空的联邦，重视技术与后勤。', trait: '航空单位和舰船视野 +1；航空单位在机场、舰船在港口的修理费 −20%。',
      mods: [{ on: 'air', vision: 1, repairOn: { airport: 0.8 } }, { on: 'ship', vision: 1, repairOn: { port: 0.8 } }] },
    { name: '翠林', research: { name: '口口相传', desc: '各档研究经费 −50%，每回合研究点 −2；上回合新占领过建筑时（每座建筑每局只算一次），本回合研究点 +4。', costMul: 0.5, ptsAdj: -2, expand: 4 }, culture: '山林与雪原的游击之民，擅长地形与隐蔽。', trait: '步兵类单位造价 −5%；位于森林、山地的步兵类单位防御 +10%；中型坦克、重型坦克、火箭炮造价 +5%。',
      mods: [{ on: 'inf', cost: -0.05, defOn: { forest: 0.1, mountain: 0.1 } }, { on: ['med', 'hvy', 'rkt'], cost: 0.05 }] },
    { name: '金沙', research: { name: '明码标价', desc: '可选用独有的“特高”档研究经费：每回合支付 900 资金，获得 30 研究点。', top: true }, culture: '商路与黄金的城邦联盟，凭借财力与城墙作战。', trait: '城市收入 +10%；位于建筑的单位防御 +5%，位于平原的单位防御 −5%。',
      cityIncome: 0.1, mods: [{ on: 'all', defOn: { prop: 0.05, plain: -0.05 } }] },
    // 黑潮：战役里的第五方（hidden：自由对局默认不可选，通关后由 AWCampaignRun.unlockedFactions() 放开）
    { name: '黑潮', hidden: true, research: { name: '拆解', desc: '每击毁一个敌方单位，下回合额外获得 2 研究点，每回合最多 6 研究点。', killPts: 2, killMax: 6 }, culture: '从海眼里出来的黑色军队，没有海岸线，靠矿井、铁路和大闸作战。', trait: '全军攻击 +5%；位于荒地、废墟、沙滩的单位防御 +10%；全军视野 +1（迷雾开启时有效）。',
      mods: [{ on: 'all', atk: 0.05, vision: 1, defOn: { waste: 0.1, ruins: 0.1, beach: 0.1 } }] },
  ];

  // 指挥官。power / desc：技能；title：称号；passive：常驻效果（给玩家看）；good / bad：擅长 / 不擅长的兵种（界面画图标用）；
  // group：'基础' / '专精' / '奇策'（卡片上的小标签）；faction：所属阵营 1–4（界面按它分页，阵营偏好见 D.FACTIONS）。
  // mods：机器可读的常驻修正，一条一组 { on, not?, … }。on / not 是兵种类别或兵种 id 数组（not = 排除）：
  //   all 全部 | inf 步兵类（徒步的和摩托兵）| vehicle 陆军车辆 | direct 直射车辆（rec tnk med hvy aa）| indirect 远程和抛射（射程上限 > 1）
  //   tank 坦克 | tread 履带车辆 | land 陆军 | air 飞机 | heli 直升机 | plane 固定翼 | ship 船
  // 数值字段：atk / def 攻防（0.15 = +15%，直接加在攻击、防御系数上）；move / vision / range 加减格数；cost 造价（-0.1 = 便宜一成）；
  //   capture 占领值倍数；hold 站在 2 星及以上地形或建筑上时额外的防御；repair 修理费倍数（0 = 免费）；
  //   defOn { 地形: 防御增减 }（prop = 任何建筑）；repairOn { 建筑: 修理费倍数 }。
  //   carry 运输单位多装几个；vs { 目标类别: 攻击增减 } 只对这一类目标生效；atkOn { 地形: 攻击增减 } 站在这种地形上进攻时生效。
  // 前 8 位技能的数值在 core.js 的 PW 里（C.powerParams），改了要同步这里的 desc。s.rules.coPassives = false 时 mods、rules 全部不生效。
  // rules：改变常规机制的常驻标志（核心里的通用钩子，谁带了哪个标志就按哪个规则走）：
  //   stealth 没开迷雾时己方在森林、废墟、礁石里的单位也隐蔽 | noAmbush 撞上隐蔽的敌人不算遇伏 | luck [lo, hi] 攻击运气区间
  //   freshBuild 新造的单位当回合能动 | hitRun 兵种类别：打完还能用剩下的移动力再移动 | regen 每回合开始全军自动回多少 HP
  //   firstCounter 被贴身攻击时先手反击 | atkInit 主动进攻时的攻击增减 | fullAtk 攻击力不随 HP 下降
  //   moveFire 兵种 id 数组：这些远程兵种也能移动后开火 | killAgain 兵种 id 数组：击毁目标后可以再行动一次（每回合一次）| subSneak 潜艇只有贴身才会被发现（驱逐舰 2 格内也看不见）
  //   flatMove 能进的地形移动消耗一律按 1 算 | capBonus / capBonusFoe 占下建筑立刻拿多少钱 / 占的是敌方建筑再多拿多少
  //   cityBuild 兵种 id 数组：己方城市里也能造这些兵种
  // fx：技能开着时（到自己下回合开始前）生效的效果：
  //   atk / def / move：[{ on, v }] 按兵种类别加攻击、防御、移动力 | again 兵种类别：打完还能再移动（满移动力）
  //   noCounter 兵种类别：进攻不挨反击 | sure 兵种 id 数组：运气取最高、无视目标地形 | luckBest 掷几次取高
  //   costMul 造价倍数 | buildCap 每座生产建筑本回合能造几次 | blackout 敌方视野降为 1（没开迷雾时敌方只看得见贴身的己方单位）
  //   counterMul 反击伤害倍数 | heal 全军立刻回多少 HP | revive 救回最近阵亡的单位（值 = 它回来时的 HP） | hurtAtk HP 不满的单位加多少攻击
  //   killMeter 这次技能里第一次击毁敌方单位，返还几成技能槽 | overwatch 兵种 id 数组：敌机移动后落进这些单位的射程就自动挨一发
  //   pass 兵种 id 数组：能穿过敌方单位所在的格子 | burn 兵种 id 数组：攻击后烧掉目标脚下的森林 | splash 溅射的 HP | splashR 溅射范围（默认 1 = 四邻）
  //   chill { move, vision }：敌方单位的移动力、视野增减（最低 1）| incomeNow 立刻多拿几成本回合收入 | sell 可以把己方单位原地卖掉，拿回造价的几成
  //   ai：电脑什么时候放——now 槽满就放 | sell 残血单位够多时 | attack 够多的部队打得到人时 | heal 回的血够多时 | endturn 自己走完、敌人贴得近时 | build 走完、钱够、准备造兵时
  D.COS = [
    { id: 'blitz', name: '燕烽', title: '闪击', group: '基础', faction: 1, power: '闪击', desc: '本回合：全军移动力 +3（徒步的步兵类单位 +1）、攻击 +30%。',
      passive: '车辆移动力 +1。步兵类单位攻击 −10%。', good: ['rec', 'tnk', 'med', 'hvy', 'aa'], bad: ['inf', 'mech', 'snp', 'grn', 'flm', 'bik'],
      mods: [{ on: 'vehicle', move: 1 }, { on: 'inf', atk: -0.1 }] },
    { id: 'wall', name: '石敢当', title: '铁壁', group: '基础', faction: 4, power: '铁壁', desc: '全军立即恢复 2 HP。己方下回合开始前：全军防御 +20%。',
      passive: '位于 2 星及以上地形或建筑的单位防御 +20%。全军攻击 −10%。', good: ['inf', 'mech', 'snp', 'grn', 'art'], bad: ['rec', 'cop', 'atk', 'bmb'],
      mods: [{ on: 'all', hold: 0.2, atk: -0.1 }] },
    { id: 'gold', name: '钱多多', title: '军费', group: '基础', faction: 4, power: '军费', desc: '立即获得「己方建筑数 × 80」的资金，再加回合收入的 20%。',
      passive: '所有单位造价 −10%。全军攻击 −10%。', good: ['inf', 'tnk', 'art'], bad: ['hvy', 'bmb', 'bsh'],
      mods: [{ on: 'all', cost: -0.1, atk: -0.1 }] },
    { id: 'storm', name: '雷铮', title: '炮火', group: '专精', faction: 1, power: '炮火覆盖', desc: '所有敌方单位各损失 1 HP（不会被击毁）。有两个敌方阵营时各 0.8 HP，三个时各 0.7 HP。本回合：己方远程单位攻击 +30%。',
      passive: '自行火炮、火箭炮攻击 +40%。其他远程单位攻击 +20%。', good: ['art', 'rkt', 'bsh', 'snp', 'grn', 'sam'], bad: ['rec', 'tnk', 'med', 'hvy', 'aa'],
      mods: [{ on: ['art', 'rkt'], atk: 0.4 }, { on: 'indirect', not: ['art', 'rkt'], atk: 0.2 }], fx: { atk: [{ on: 'indirect', v: 0.3 }] } },
    { id: 'tide', name: '沧澜', title: '怒潮', group: '专精', faction: 2, power: '怒潮', desc: '全军立即恢复 2 HP（舰船 3 HP）。本回合：全军移动力 +1（舰船 +2），舰船对陆上单位伤害 +30%。己方下回合开始前：全军防御 +10%。',
      passive: '舰船攻击 +30%、防御 +20%、移动力 +1、造价 −15%，在港口修理免费。步兵类单位攻击 +10%。', good: ['gbt', 'dst', 'sub', 'bsh', 'lnd'], bad: ['cop', 'atk', 'bmb'],
      mods: [{ on: 'ship', atk: 0.3, def: 0.2, move: 1, repair: 0, cost: -0.15 }, { on: 'inf', atk: 0.1 }] },
    { id: 'sky', name: '云隼', title: '制空', group: '专精', faction: 2, power: '俯冲', desc: '本回合：航空单位移动力 +2、攻击 +50%，攻击时不受反击。其他单位移动力 +2、攻击 +30%。',
      passive: '攻击机、轰炸机、战斗机攻击 +30%、造价 −20%。', good: ['atk', 'bmb', 'ftr'], bad: ['rec', 'tnk', 'med', 'hvy', 'art'],
      mods: [{ on: 'plane', atk: 0.3, cost: -0.2 }] },
    { id: 'iron', name: '牛钧', title: '装甲', group: '专精', faction: 1, power: '履带洪流', desc: '本回合：各型坦克移动力 +2、攻击 +50%，攻击后可再移动。己方下回合开始前：各型坦克防御 +20%。',
      passive: '各型坦克攻击 +30%、防御 +10%。其他单位攻击 −15%。', good: ['tnk', 'med', 'hvy'], bad: ['inf', 'mech', 'art', 'cop', 'atk', 'gbt'],
      mods: [{ on: 'tank', atk: 0.3, def: 0.1 }, { on: 'land', not: 'tank', atk: -0.15 }, { on: 'air', atk: -0.15 }, { on: 'ship', atk: -0.15 }] },
    { id: 'militia', name: '青禾', title: '民兵', group: '专精', faction: 3, power: '全民皆兵', desc: '最多 4 座没有单位的己方城市各出现一个满 HP 的步兵，当回合可行动。本回合：步兵类单位攻击 +30%、移动力 +1。',
      passive: '步兵类单位攻击 +30%、防御 +10%、占领值 ×1.5、视野 +1。车辆造价 +10%。', good: ['inf', 'mech', 'snp', 'grn', 'flm', 'bik'], bad: ['rec', 'tnk', 'med', 'hvy', 'art', 'rkt', 'aa', 'sam'],
      mods: [{ on: 'inf', atk: 0.3, def: 0.1, capture: 1.5, vision: 1 }, { on: 'vehicle', cost: 0.1 }], fx: { atk: [{ on: 'inf', v: 0.3 }], move: [{ on: 'inf', v: 1 }] } },
    // ── 第二批 ──
    { id: 'heli', name: '风翎', title: '旋翼', group: '专精', faction: 2, power: '蜂群', desc: '本回合：全军移动力 +2。直升机攻击 +40%，其他单位攻击 +20%。直升机攻击后可再移动。',
      passive: '武装直升机攻击 +40%、防御 +20%、造价 −20%。运输直升机移动力 +2、搭载数 +1。舰船攻击和防御 −20%。', good: ['cop', 'tcp'], bad: ['rec', 'tnk', 'med', 'hvy', 'art', 'gbt', 'dst', 'sub', 'bsh'],
      mods: [{ on: ['cop'], atk: 0.4, def: 0.2, cost: -0.2 }, { on: ['tcp'], move: 2, carry: 1 }, { on: 'ship', atk: -0.2, def: -0.2 }],
      fx: { again: 'heli', atk: [{ on: 'heli', v: 0.2 }, { on: 'all', v: 0.2 }], move: [{ on: 'all', v: 2 }], ai: 'attack' } },
    { id: 'hawk', name: '苍柏', title: '狙击', group: '专精', faction: 3, power: '一击', desc: '本回合：狙击手、投弹手攻击时，运气取最大值，并无视目标的地形防御。全军攻击 +30%。',
      passive: '狙击手射程 +1、攻击 +40%、造价 −20%，移动后可攻击，击毁目标后可再行动（每回合一次）。投弹手攻击 +25%，其他步兵类单位攻击 +15%。全军视野 +1。位于森林、山地的己方单位防御 +15%。', good: ['snp', 'grn'], bad: ['rec', 'tnk', 'med', 'hvy', 'art', 'rkt', 'aa'],
      mods: [{ on: ['snp'], range: 1, atk: 0.4, cost: -0.2 }, { on: ['grn'], atk: 0.25 }, { on: 'inf', not: ['snp', 'grn'], atk: 0.15 }, { on: 'all', vision: 1, defOn: { forest: 0.15, mountain: 0.15 } }],
      rules: { killAgain: ['snp'], moveFire: ['snp'] }, ai: { goodW: 1.6 },
      fx: { sure: ['snp', 'grn'], atk: [{ on: 'all', v: 0.3 }], ai: 'attack' } },
    { id: 'owl', name: '夜棠', title: '潜行', group: '奇策', faction: 3, power: '灯火管制', desc: '本回合：全军攻击 +20%。己方下回合开始前：敌方单位视野降为 1。迷雾关闭时，敌方只能发现自己单位 2 格内的己方单位。',
      passive: '位于森林、废墟、礁石的己方单位攻击 +20%、防御 +20%，迷雾关闭时也处于隐蔽状态。位于平原、道路、桥梁、沙滩的己方单位防御 −5%。迷雾开启时全军视野 +2。己方单位移动中遇到隐蔽的敌方单位时停止移动，但行动不结束。', good: ['inf', 'mech', 'snp', 'grn', 'art'], bad: ['hvy', 'med'],
      mods: [{ on: 'all', vision: 2, defOn: { forest: 0.2, ruins: 0.2, reef: 0.2, plain: -0.05, road: -0.05, bridge: -0.05, beach: -0.05 }, atkOn: { forest: 0.2, ruins: 0.2, reef: 0.2 } }], rules: { stealth: true, noAmbush: true },
      fx: { blackout: true, atk: [{ on: 'all', v: 0.2 }], ai: 'endturn' } },
    { id: 'dice', name: '金不换', title: '运气', group: '奇策', faction: 4, power: '梭哈', desc: '本回合：己方攻击的运气判定三次，取最高值。全军攻击 +30%。第一次击毁敌方单位时，返还 50% 技能槽。',
      passive: '己方攻击的运气范围变为 0 至 +40（原来 0–9）。运气超过 9 的部分按比例计入伤害：计入量 = 超出部分 × 基础伤害 ÷ 100（基础伤害超过 100 时按 100 计算）。', good: ['inf', 'rec', 'cop', 'gbt'], bad: ['hvy', 'bmb', 'bsh'],
      mods: [], rules: { luck: [0, 40] },
      fx: { luckBest: 3, atk: [{ on: 'all', v: 0.3 }], killMeter: 0.5, ai: 'attack' } },
    { id: 'forge', name: '柳锻', title: '速建', group: '奇策', faction: 1, power: '加班', desc: '本回合：单位造价 −30%，每座生产建筑可生产 2 次。生产第二个单位前，要先把第一个单位移出建筑。',
      passive: '新生产的单位当回合可行动。所有单位造价 +10%。', good: ['inf', 'bik', 'tnk', 'cop'], bad: ['hvy', 'bmb', 'bsh'],
      mods: [{ on: 'all', cost: 0.1 }], rules: { freshBuild: true },
      fx: { costMul: 0.7, buildCap: 2, ai: 'build' } },
    { id: 'rider', name: '野荆', title: '游击', group: '奇策', faction: 3, power: '风驰', desc: '本回合：全军移动力 +2，攻击时不受反击。',
      passive: '直射单位攻击 +5%，攻击后可用剩余移动力再移动，但不能再攻击或占领。', good: ['rec', 'bik', 'tnk', 'cop'], bad: ['art', 'rkt', 'hvy'],
      mods: [{ on: 'melee', atk: 0.05 }], rules: { hitRun: 'melee' },
      fx: { move: [{ on: 'all', v: 2 }], noCounter: 'all', ai: 'attack' } },
    { id: 'medic', name: '汀鹭', title: '军医', group: '奇策', faction: 2, power: '急救', desc: '全军立即恢复 2 HP。最近被击毁的一个己方单位以 1 HP 在司令部相邻的空格复活；没有空格时不复活。',
      passive: '己方单位每回合开始时恢复 1 HP，在建筑上修理免费。全军攻击 −10%。', good: ['med', 'hvy', 'bsh', 'bmb'], bad: ['inf', 'rec'],
      mods: [{ on: 'all', atk: -0.1, repair: 0 }], rules: { regen: 10, mdcPlus: 10 },
      fx: { heal: 20, revive: 10, ai: 'heal' } },
    { id: 'guard', name: '岳钢', title: '反击', group: '奇策', faction: 1, power: '架盾', desc: '己方下回合开始前：己方反击伤害 ×2，全军防御 +20%。',
      passive: '己方单位被相邻的敌方单位攻击时先手反击：先反击，敌方再按剩余 HP 攻击。己方主动攻击时攻击 −10%。', good: ['inf', 'mech', 'tnk', 'med', 'hvy'], bad: ['art', 'rkt', 'snp'],
      mods: [], rules: { firstCounter: true, atkInit: -0.1 },
      fx: { counterMul: 2, def: [{ on: 'all', v: 0.2 }], ai: 'endturn' } },
    // ── 第三批 ──
    { id: 'bolt', name: '霁羽', title: '防空', group: '专精', faction: 2, power: '天网', desc: '己方下回合开始前：敌方航空单位移动后进入己方防空车、防空导弹、战斗机的射程时，自动受到一次攻击（每个己方单位一次）。全军防御 +30%。',
      passive: '防空车、防空导弹、战斗机对航空单位伤害 +40%、视野 +2、造价 −25%。防空车对陆上单位伤害 +40%、防御 +15%、移动力 +1。直升机、攻击机、轰炸机攻击 −15%。', good: ['aa', 'sam', 'ftr'], bad: ['cop', 'atk', 'bmb'],
      mods: [{ on: ['aa', 'sam', 'ftr'], vs: { air: 0.4 }, vision: 2, cost: -0.25 }, { on: ['aa'], vs: { land: 0.4 }, def: 0.15, move: 1 }, { on: ['cop', 'atk', 'bmb'], atk: -0.15 }],
      ai: { goodW: 1, w: { aa: 2.2 } },
      fx: { overwatch: ['aa', 'sam', 'ftr'], def: [{ on: 'all', v: 0.3 }], ai: 'endturn' } },
    { id: 'shark', name: '溟舟', title: '潜航', group: '专精', faction: 2, power: '狼群', desc: '本回合：全军移动力 +2。潜艇攻击 +50%，其他单位攻击 +30%。潜艇攻击时不受反击。',
      passive: '潜艇攻击 +40%、造价 −20%，只有相邻时才会被发现。驱逐舰、炮艇攻击 +20%、造价 −15%。步兵类单位攻击 +25%，车辆攻击 +10%。', good: ['sub', 'dst', 'gbt', 'inf', 'mech'], bad: ['bsh'],
      mods: [{ on: ['sub'], atk: 0.4, cost: -0.2 }, { on: ['dst', 'gbt'], atk: 0.2, cost: -0.15 }, { on: 'inf', atk: 0.25 }, { on: 'vehicle', atk: 0.1 }], rules: { subSneak: true }, ai: { goodW: 1 },
      fx: { move: [{ on: 'all', v: 2 }], atk: [{ on: ['sub'], v: 0.2 }, { on: 'all', v: 0.3 }], noCounter: ['sub'], ai: 'attack' } },
    { id: 'wheel', name: '万里行', title: '轻骑', group: '专精', faction: 4, power: '穿插', desc: '本回合：全军移动力 +1。侦察车、摩托兵攻击 +40%，其他单位攻击 +20%。侦察车、摩托兵、运兵车可以穿过敌方单位，但不能停在敌方单位所在的格子。',
      passive: '侦察车、摩托兵、运兵车移动力 +3。侦察车、摩托兵攻击 +60%，攻击后可用剩余移动力再移动。中型、重型坦克造价 +10%。', good: ['rec', 'bik', 'apc'], bad: ['med', 'hvy'],
      mods: [{ on: ['rec', 'bik', 'apc'], move: 3 }, { on: ['rec', 'bik'], atk: 0.6 }, { on: ['med', 'hvy'], cost: 0.1 }], rules: { hitRun: ['rec', 'bik'] },
      fx: { pass: ['rec', 'bik', 'apc'], atk: [{ on: ['rec', 'bik'], v: 0.2 }, { on: 'all', v: 0.2 }], move: [{ on: 'all', v: 1 }], ai: 'attack' } },
    { id: 'pyro', name: '祝炎', title: '烈焰', group: '专精', faction: 1, power: '燎原', desc: '本回合：步兵类单位攻击 +40%，其他单位攻击 +20%。喷火兵攻击后，目标所在的森林变为荒地，周围 2 格内的敌方单位各损失 3 HP（不会被击毁）。',
      passive: '喷火兵、破甲兵攻击 +50%、移动力 +1、造价 −20%。远程单位攻击 −10%。', good: ['flm', 'mech'], bad: ['art', 'rkt', 'snp', 'grn', 'bsh', 'sam'],
      mods: [{ on: ['flm', 'mech'], atk: 0.5, move: 1, cost: -0.2 }, { on: 'indirect', atk: -0.1 }], ai: { w: { flm: 2.5, mech: 1.8 } },
      fx: { burn: ['flm'], splash: 30, splashR: 2, atk: [{ on: 'inf', v: 0.2 }, { on: 'all', v: 0.2 }], ai: 'attack' } },
    { id: 'frost', name: '雪杉', title: '雪原', group: '奇策', faction: 3, power: '寒潮', desc: '己方下回合开始前：敌方单位移动力 −3（最低 1）、视野 −2，己方全军防御 +20%。',
      passive: '己方单位在能进入的地形上移动消耗都是 1。步兵类单位移动力 +1。', good: ['rec', 'tnk', 'art', 'rkt', 'inf'], bad: ['cop', 'atk', 'bmb'],
      mods: [{ on: 'inf', move: 1 }], rules: { flatMove: true },
      fx: { chill: { move: -3, vision: -2 }, def: [{ on: 'all', v: 0.2 }], ai: 'endturn' } },
    { id: 'toll', name: '商有余', title: '征收', group: '奇策', faction: 4, power: '加征', desc: '立即获得相当于一个回合的收入。本回合：步兵类单位移动力 +1。',
      passive: '占领值 ×1.5。每占领一座建筑，获得 150 资金；占领的是敌方建筑时，再获得 150 资金。全军攻击 −10%。', good: ['inf', 'mech', 'bik'], bad: ['hvy', 'bmb', 'bsh'],
      mods: [{ on: 'inf', capture: 1.5 }, { on: 'all', atk: -0.1 }], rules: { capBonus: 150, capBonusFoe: 150 },
      fx: { incomeNow: 1, move: [{ on: 'inf', v: 1 }], ai: 'now' } },
    { id: 'ember', name: '枯桐', title: '死战', group: '奇策', faction: 3, power: '背水', desc: '本回合：HP 未满的己方单位攻击 +50%，全军移动力 +1。',
      passive: '己方单位的攻击不随 HP 减少而降低。修理费 ×2。', good: ['tnk', 'med', 'hvy', 'inf'], bad: ['rep'],
      mods: [{ on: 'all', repair: 2 }], rules: { fullAtk: true },
      fx: { hurtAtk: 0.5, move: [{ on: 'all', v: 1 }], ai: 'attack' } },
    { id: 'nomad', name: '满庭芳', title: '集市', group: '奇策', faction: 4, power: '黑市', desc: '本回合：可以出售任意己方单位，返还造价的 90%（与剩余 HP 无关）。',
      passive: '己方城市也可以生产步兵类单位。步兵类单位造价 −20%、攻击 +10%。', good: ['inf', 'mech', 'bik', 'snp', 'grn', 'flm'], bad: ['tnk', 'med', 'hvy'],
      mods: [{ on: 'inf', cost: -0.2, atk: 0.1 }], rules: { cityBuild: ['inf', 'mech', 'snp', 'grn', 'flm', 'mdc', 'bik'] },
      fx: { sell: 0.9, ai: 'sell' } },
    // ── 黑潮（阵营 5，战役专用）。新规则键：regenAt { 地形: 每回合恢复 }、seeOn [地形]（迷雾下这些地形上的敌方单位只要在视野范围内就可见，礁石的隐蔽无效；潜艇除外）、killBonus 击毁返还造价的几成、
    //    roadRun 回合开始时在道路、桥梁上的车辆本回合移动力加几、offRoad { on, atk } 不在道路、桥梁、建筑上时的攻击增减、hideProp 位于建筑时隐蔽的兵种类别
    //    新技能效果：surge 涨水一级、ebb 压制敌方舰船、buyout 收购、chill.road 敌方在道路和桥梁上的移动消耗增加、frame 让两家敌方互相打（fxAlt：只有一家敌方时换成这一组效果）
    { id: 'abyss', name: '玄渊', title: '井长', group: '奇策', faction: 5, power: '开闸', desc: '打开大闸，涨水一级。与海洋相邻的沙滩、荒地、礁石、废墟变为海洋。位于这些格子的陆上单位被移到最近的空格，其中敌方单位损失 3 HP（不会被击毁）。己方下回合开始前：全军防御 +20%。每局最多涨水 2 次。不能涨水时，改为所有敌方单位各损失 1 HP（不会被击毁）。',
      passive: '各型坦克、深渊战车、装甲列车攻击 +15%。位于陨星矿、荒地、废墟的己方单位防御 +20%，每回合恢复 1 HP。己方陨星矿收入 +50%。', good: ['hvy', 'med', 'art', 'mech', 'trn'], bad: ['cop', 'atk', 'bmb'],
      mods: [{ on: 'all', defOn: { mine: 0.2, waste: 0.2, ruins: 0.2 } }, { on: ['tnk', 'med', 'hvy', 'bht', 'trn'], atk: 0.15 }], rules: { regenAt: { mine: 10, waste: 10, ruins: 10 }, mineBonus: 0.5 },
      fx: { surge: { dmg: 30, max: 2, fallback: 10 }, def: [{ on: 'all', v: 0.2 }], ai: 'endturn' } },
    { id: 'moon', name: '玄朔', title: '算潮', group: '专精', faction: 5, power: '大潮', desc: '本回合：全军攻击 +20%（舰船 +40%）、移动力 +2。己方下回合开始前：敌方舰船移动力 −3（最低 1），不能在港口修理。',
      passive: '舰船攻击 +20%、移动力 +1。远程单位攻击 +15%。己方单位在沙滩上的移动消耗为 1。迷雾开启时，视野范围内海洋、沙滩、礁石上的敌方单位都可见，礁石的隐蔽对其无效（潜艇除外）。', good: ['bsh', 'dst', 'gbt', 'lnd', 'inf'], bad: ['hvy', 'rkt'],
      mods: [{ on: 'ship', atk: 0.2, move: 1 }, { on: 'indirect', atk: 0.15 }], rules: { seeOn: ['sea', 'beach', 'reef'], flatOn: { all: ['beach'] } },
      fx: { ebb: { move: -3, noRepair: true }, atk: [{ on: 'ship', v: 0.2 }, { on: 'all', v: 0.2 }], move: [{ on: 'all', v: 2 }], ai: 'attack' } },
    { id: 'coin', name: '玄铢', title: '掌柜', group: '奇策', faction: 5, power: '收购', desc: '买下与己方单位相邻的敌方车辆，最多 2 个，从价格高的开始买。买下的单位立即归己方所有，当回合不能行动。价格 = 造价 × 剩余 HP ÷ 10 × 50%。资金不够支付的单位不会买下。以下单位不能买：带标记的单位、搭载着单位的运输单位、位于司令部的单位、敌方阵营的最后一个单位。一个单位都没有买下时，改为获得回合收入的 50%。',
      passive: '所有单位造价 −15%。每击毁一个敌方单位，获得它造价 30% 的资金。', good: ['tnk', 'art', 'rec', 'aa'], bad: ['bsh', 'bmb'],
      mods: [{ on: 'all', cost: -0.15 }], rules: { killBonus: 0.3 },
      fx: { buyout: { max: 2, price: 0.5, fallback: 0.5 }, ai: 'buyout' } },
    { id: 'anvil', name: '玄砧', title: '铺路', group: '专精', faction: 5, power: '封路', desc: '己方下回合开始前：敌方单位在道路、桥梁上的移动消耗 +2（航空单位除外）。本回合：己方车辆攻击 +30%。',
      passive: '车辆攻击 +10%，在道路、桥梁上防御 +15%。回合开始时位于道路、桥梁的车辆本回合移动力 +2。装甲列车造价 −20%。', good: ['trn', 'tnk', 'med', 'rec', 'art'], bad: ['cop', 'sub', 'inf'],
      mods: [{ on: 'vehicle', atk: 0.1, defOn: { road: 0.15, bridge: 0.15 } }, { on: ['trn'], cost: -0.2 }], rules: { roadRun: 2 },
      fx: { chill: { road: 2 }, atk: [{ on: 'vehicle', v: 0.3 }], ai: 'endturn' } },
    { id: 'candle', name: '玄烛', title: '点灯', group: '奇策', faction: 5, power: '点灯', desc: '相邻且分属不同敌方阵营的两个单位互相攻击一次，最多 2 对，每个单位只算进一对。这次攻击不会击毁单位，也不积累技能槽。没有符合条件的单位时，改为以下效果。本回合：己方攻击 +20%，攻击时不受反击。己方下回合开始前：敌方视野 −2。',
      passive: '位于建筑的己方步兵类单位处于隐蔽状态，迷雾关闭时也有效。步兵类单位攻击 +15%、占领值 ×1.5。迷雾开启时全军视野 +1。', good: ['inf', 'mech', 'snp', 'gbt', 'sub'], bad: ['hvy', 'med', 'bsh'],
      mods: [{ on: 'inf', capture: 1.5, atk: 0.15 }, { on: 'all', vision: 1 }], rules: { hideProp: 'inf' },
      fx: { frame: { pairs: 2 }, ai: 'attack' }, fxAlt: { chill: { vision: -2 }, atk: [{ on: 'all', v: 0.2 }], noCounter: 'all', ai: 'attack' } },
  ];

  // ── 科技 ──（规则见 tools/TECH-SPEC.md，接口见 tools/MULTI-SPEC.md“科技”一节）
  // 研究经费档位（标准档；实际花费乘地图系数和阵营的研究方式，见 C.fundLevels）。top 只有金沙有
  D.FUNDS = [
    { id: 'stop', name: '停', cost: 0, pts: 3 },
    { id: 'low', name: '低', cost: 100, pts: 10 },
    { id: 'mid', name: '中', cost: 250, pts: 16 },
    { id: 'high', name: '高', cost: 500, pts: 22 },
    { id: 'top', name: '特高', cost: 900, pts: 30, only: 4 },
  ];
  // 科技线：tree 是 'common'（通用）或阵营编号 1–4；指挥官线的 id 是 co_<指挥官 id>，不在这张表里
  D.TECH_LINES = {
    arm: { name: '军备', tree: 'common', order: 1 }, log: { name: '后勤', tree: 'common', order: 2 }, int: { name: '情报', tree: 'common', order: 3 },
    red_h: { name: '重工', tree: 1, order: 4 }, red_f: { name: '火力', tree: 1, order: 5 },
    blue_n: { name: '航海', tree: 2, order: 4 }, blue_a: { name: '航空', tree: 2, order: 5 },
    green_m: { name: '山林', tree: 3, order: 4 }, green_f: { name: '农闲', tree: 3, order: 5 },
    gold_t: { name: '商路', tree: 4, order: 4 }, gold_w: { name: '城防', tree: 4, order: 5 },
    dark_d: { name: '井下', tree: 5, order: 4 }, // 黑潮这一轮只有一条简化的阵营线，指挥官线留空
  };
  // 每项科技：pts 是标准档的研究点（实际需求乘地图系数）。mods 同指挥官的 mods（追加在后面，同类相加）；rules 合并进 C.coRules。
  // 科技用到的 rules 字段：
  //   gang { per, max } 攻击时目标四邻每有一个己方单位攻击加多少、最多加多少 | repairPlus 在建筑上修理每回合多回多少 HP
  //   roadMarch 回合开始时站在道路、桥上的单位本回合移动加几 | capNoFog 没开迷雾时占领值的倍数 | meterGain 自己的技能槽多涨几成
  //   meterFoe 敌方技能槽少涨几成（负数）| spy 战况页能看到对手的资金、研究点和已解锁的科技 | seeProps 开迷雾时看得见敌方建筑周围几格
  //   pierce { on, stars } 这类兵种攻击时目标的地形防御少算几星 | splashBy / splashPct 这类兵种攻击后溅射主伤害的几成给目标四邻的敌方单位
  //   buildCapOn { 建筑: 次数 } 这种生产建筑每回合能造几次 | fleet { atk, def } 船挨着己方的船时的攻防加成
  //   carrierAir { r, atk } 飞机在己方的船几格内时的攻击加成 | flatOn { 兵种类别: [地形] } 这些地形的移动消耗按 1 算
  //   regenOn { 兵种类别: HP } 这类兵种每回合开始自动回多少 | levy { every, max } 每隔几个自己的回合，空着的己方城市各出一个步兵、一次最多几个
  //   cityTax 每座城市每回合多收多少 | mineBonus 陨星矿收入多几成 | capBonus 占下建筑立刻拿多少钱 | bornStars 新造的单位自带几颗星
  //   cityGun 每个自己的回合开始时，己方城市、司令部、碉堡对相邻的敌方单位各造成多少伤害（不会打死）
  // moot：{ 指挥官 id: 原因 }，这位指挥官本来就有同样的能力，界面标“已具备”
  D.TECH = [
    // 通用 · 军备
    { id: 'arm1', tree: 'common', line: 'arm', tier: 1, pts: 40, name: '标准弹药', desc: '全军攻击 +5%。', flavor: '口径统一之后，前线再也没领错过炮弹。',
      mods: [{ on: 'all', atk: 0.05 }] },
    { id: 'arm2', tree: 'common', line: 'arm', tier: 2, pts: 70, name: '复合装甲', desc: '车辆、舰船、航空单位防御 +10%。', flavor: '多夹一层，多活一回。',
      mods: [{ on: 'vehicle', def: 0.1 }, { on: 'ship', def: 0.1 }, { on: 'air', def: 0.1 }] },
    { id: 'arm3', tree: 'common', line: 'arm', tier: 3, pts: 120, name: '联合火力', desc: '攻击时，目标相邻四格内每有一个其他己方单位，攻击 +5%，最多 +15%。', flavor: '一个人打不过，就三个人一起打。',
      rules: { gang: { per: 0.05, max: 0.15 } } },
    // 通用 · 后勤
    { id: 'log1', tree: 'common', line: 'log', tier: 1, pts: 40, name: '野战修理', desc: '在建筑上修理时每回合额外恢复 1 HP，修理费 −30%。', flavor: '扳手比子弹便宜。',
      mods: [{ on: 'all', repair: 0.7 }], rules: { repairPlus: 10 }, moot: { medic: '汀鹭的修理本来就免费，只有“额外恢复 1 HP”有效' } },
    { id: 'log2', tree: 'common', line: 'log', tier: 2, pts: 70, name: '预制构件', desc: '所有单位造价 −8%。', flavor: '零件先做好，到了再拼。',
      mods: [{ on: 'all', cost: -0.08 }] },
    { id: 'log3', tree: 'common', line: 'log', tier: 3, pts: 120, name: '机械化行军', desc: '回合开始时位于道路或桥梁的单位，本回合移动力 +1。', flavor: '路修到哪，兵就到哪。',
      rules: { roadMarch: 1 } },
    // 通用 · 情报
    { id: 'int1', tree: 'common', line: 'int', tier: 1, pts: 40, name: '侦察条例', desc: '全军视野 +1；迷雾关闭的对局中改为占领值 +10%。', flavor: '先看清楚，再迈腿。',
      mods: [{ on: 'all', vision: 1 }], rules: { capNoFog: 1.1 } },
    { id: 'int2', tree: 'common', line: 'int', tier: 2, pts: 70, name: '无线电网', desc: '己方技能槽积累量 +25%。', flavor: '命令到得快，机会才抓得住。',
      rules: { meterGain: 0.25 } },
    { id: 'int3', tree: 'common', line: 'int', tier: 3, pts: 120, name: '密码破译', desc: '战况页可查看敌方的资金、研究点和已解锁的科技；敌方技能槽积累量 −15%；迷雾开启时，可看见敌方建筑周围 1 格。', flavor: '他们的电报，我们比他们的将军先看到。',
      rules: { spy: true, meterFoe: -0.15, seeProps: 1 } },
    // 赤焰 · 重工
    { id: 'red_h1', tree: 1, line: 'red_h', tier: 1, pts: 40, name: '流水线', desc: '车辆造价 −10%。', flavor: '一个人只拧一颗螺丝，拧一万遍。',
      mods: [{ on: 'vehicle', cost: -0.1 }] },
    { id: 'red_h2', tree: 1, line: 'red_h', tier: 2, pts: 70, name: '淬火钢', desc: '各型坦克防御 +15%。', flavor: '烧红，浸冷，再烧红。',
      mods: [{ on: 'tank', def: 0.15 }] },
    { id: 'red_h3', tree: 1, line: 'red_h', tier: 3, pts: 120, name: '巨炉', desc: '每座兵工厂每回合可生产 2 个单位（要先把第一个单位移出建筑）；重型坦克造价 −20%。', flavor: '第一百四十一座高炉点火那天，炉城放了半天假。',
      mods: [{ on: ['hvy'], cost: -0.2 }], rules: { buildCapOn: { factory: 2 } } },
    // 赤焰 · 火力
    { id: 'red_f1', tree: 1, line: 'red_f', tier: 1, pts: 40, name: '射表修订', desc: '自行火炮、火箭炮、战列舰攻击 +10%。', flavor: '上次打偏的那一发，已经算进去了。',
      mods: [{ on: ['art', 'rkt', 'bsh'], atk: 0.1 }] },
    { id: 'red_f2', tree: 1, line: 'red_f', tier: 2, pts: 70, name: '高爆弹', desc: '远程单位攻击时，目标的地形防御 −1 星。', flavor: '墙厚不厚，要看拿什么敲。',
      rules: { pierce: { on: 'indirect', stars: 1 } } },
    { id: 'red_f3', tree: 1, line: 'red_f', tier: 3, pts: 120, name: '弹幕', desc: '远程单位攻击后，目标相邻四格内的敌方单位各受到本次伤害的 20%（不会被击毁；每个单位每回合因溅射最多损失 5 HP）。', flavor: '不用瞄，那一片都是。',
      rules: { splashBy: 'indirect', splashPct: 0.2 } },
    // 苍蓝 · 航海
    { id: 'blue_n1', tree: 2, line: 'blue_n', tier: 1, pts: 40, name: '潮汐表', desc: '舰船移动力 +1。', flavor: '领航员家的孩子，先会看潮，后会走路。',
      mods: [{ on: 'ship', move: 1 }] },
    { id: 'blue_n2', tree: 2, line: 'blue_n', tier: 2, pts: 70, name: '船坞标准化', desc: '舰船在港口修理免费；舰船造价 −10%。', flavor: '十二座港，终于用上了同一种螺栓。',
      mods: [{ on: 'ship', repair: 0, cost: -0.1 }], moot: { tide: '沧澜的舰船在港口修理本来就免费，只有“舰船造价 −10%”有效' } },
    { id: 'blue_n3', tree: 2, line: 'blue_n', tier: 3, pts: 120, name: '联合舰队', desc: '舰船与其他己方舰船相邻时，防御 +15%、攻击 +10%。', flavor: '各港的船头一次朝着同一个方向。',
      rules: { fleet: { atk: 0.1, def: 0.15 } } },
    // 苍蓝 · 航空
    { id: 'blue_a1', tree: 2, line: 'blue_a', tier: 1, pts: 40, name: '气象站', desc: '航空单位视野 +2、防御 +5%。', flavor: '起飞之前，先问问风。',
      mods: [{ on: 'air', vision: 2, def: 0.05 }] },
    { id: 'blue_a2', tree: 2, line: 'blue_a', tier: 2, pts: 70, name: '空中加油', desc: '航空单位移动力 +1。', flavor: '油管对上的那一下，两个飞行员都不敢喘气。',
      mods: [{ on: 'air', move: 1 }] },
    { id: 'blue_a3', tree: 2, line: 'blue_a', tier: 3, pts: 120, name: '舰载协同', desc: '航空单位位于己方舰船 2 格内时，攻击 +20%。', flavor: '船是飞机的眼睛，飞机是船的拳头。',
      rules: { carrierAir: { r: 2, atk: 0.2 } } },
    // 翠林 · 山林
    { id: 'green_m1', tree: 3, line: 'green_m', tier: 1, pts: 40, name: '山路暗号', desc: '步兵类单位在森林、山地、沼泽上的移动消耗都是 1。', flavor: '树皮上三道刻痕，意思是往左。',
      rules: { flatOn: { inf: ['forest', 'mountain', 'swamp'] } }, moot: { frost: '雪杉的单位在可进入地形上的移动消耗本来就都是 1' } },
    { id: 'green_m2', tree: 3, line: 'green_m', tier: 2, pts: 70, name: '伪装', desc: '位于森林、废墟的己方单位防御 +10%。', flavor: '你看见一棵树。树也看见了你。',
      mods: [{ on: 'all', defOn: { forest: 0.1, ruins: 0.1 } }] },
    { id: 'green_m3', tree: 3, line: 'green_m', tier: 3, pts: 120, name: '猎户营', desc: '狙击手、投弹手造价 −25%、射程 +1（各项射程加成合计最多 +2）。', flavor: '寨里最好的猎户，一年只下山一次。',
      mods: [{ on: ['snp', 'grn'], cost: -0.25, range: 1 }] },
    // 翠林 · 农闲
    { id: 'green_f1', tree: 3, line: 'green_f', tier: 1, pts: 40, name: '互助', desc: '步兵类单位造价 −15%。', flavor: '你家的田我帮着收，我家的仗你帮着打。',
      mods: [{ on: 'inf', cost: -0.15 }] },
    { id: 'green_f2', tree: 3, line: 'green_f', tier: 2, pts: 70, name: '草药', desc: '步兵类单位每回合开始时恢复 1 HP。', flavor: '嚼碎了敷上，明天还能走。',
      rules: { regenOn: { inf: 10 } } },
    { id: 'green_f3', tree: 3, line: 'green_f', tier: 3, pts: 120, name: '全寨出征', desc: '每经过 4 个己方回合，没有单位的己方城市各免费出现一个步兵，每次最多 4 个，当回合可行动。', flavor: '木牌上写着：这一季，每户出一个人。',
      rules: { levy: { every: 4, max: 4 } } },
    // 金沙 · 商路
    { id: 'gold_t1', tree: 4, line: 'gold_t', tier: 1, pts: 40, name: '关税', desc: '每座城市每回合收入 +10 资金。', flavor: '进城收一道，出城再收一道。',
      rules: { cityTax: 10 } },
    { id: 'gold_t2', tree: 4, line: 'gold_t', tier: 2, pts: 70, name: '驼队', desc: '运兵车、运输直升机、登陆艇移动力 +2；轮式车辆在荒地、沙滩上的移动消耗为 1。', flavor: '沙原上没有路，驼队走过的地方就是路。',
      mods: [{ on: ['apc', 'tcp', 'lnd'], move: 2 }], rules: { flatOn: { wheel: ['waste', 'beach'] } } },
    { id: 'gold_t3', tree: 4, line: 'gold_t', tier: 3, pts: 120, name: '专营权', desc: '陨星矿收入 +50%；每占领一座建筑，立即获得 50 资金。', flavor: '这座矿，从今天起只卖给我们。',
      rules: { mineBonus: 0.5, capBonus: 50 } },
    // 金沙 · 城防
    { id: 'gold_w1', tree: 4, line: 'gold_w', tier: 1, pts: 40, name: '厚墙', desc: '位于建筑的己方单位防御 +10%。', flavor: '多砌一层，少赔一座城。',
      mods: [{ on: 'all', defOn: { prop: 0.1 } }] },
    { id: 'gold_w2', tree: 4, line: 'gold_w', tier: 2, pts: 70, name: '雇佣合同', desc: '支付资金生产的单位初始为 1 星。', flavor: '老兵贵一点，但不用教。',
      rules: { bornStars: 1 } },
    { id: 'gold_w3', tree: 4, line: 'gold_w', tier: 3, pts: 120, name: '城防炮', desc: '每个己方回合开始时，己方城市、司令部、碉堡使相邻且可见的敌方单位各损失 1 HP（不会被击毁；每个单位每回合只受一次）。', flavor: '城墙上的炮不用发饷。',
      rules: { cityGun: 10 } },
    // 黑潮 · 井下（简化的一条线）
    { id: 'dark_d1', tree: 5, line: 'dark_d', tier: 1, pts: 40, name: '矿灯', desc: '全军视野 +1。', flavor: '灯不用太亮，够看见下一步就行。', mods: [{ on: 'all', vision: 1 }] },
    { id: 'dark_d2', tree: 5, line: 'dark_d', tier: 2, pts: 70, name: '旧坑道', desc: '位于荒地、废墟、沙滩的己方单位防御再 +10%。', flavor: '三十年前挖的坑道，图纸只有他们还留着。', mods: [{ on: 'all', defOn: { waste: 0.1, ruins: 0.1, beach: 0.1 } }] },
    { id: 'dark_d3', tree: 5, line: 'dark_d', tier: 3, pts: 120, name: '铁轨延伸', desc: '己方车辆攻击 +10%。', flavor: '铁轨铺到哪里，潮就涨到哪里。', mods: [{ on: 'vehicle', atk: 0.1 }] },
  ];

  // ───────── 指挥官线：每位指挥官一条，三级，研究点 30 / 50 / 100（乘地图系数）─────────
  // id = co_<指挥官 id>_<级>，tree: 'co'，line = 'co_<指挥官 id>'。一、二级的 mods / rules 叠在常驻上（rules.coPassives 关掉就不能研究）；
  // 三级把技能升级成“原名 · 极”：fx 合并进技能效果（数组相接、对象逐项合并、单个数值以这里为准），pw 覆盖 C.powerParams 里的同名参数（rules.powers 关掉就不能研究）
  const CO_PTS = [0, 40, 70, 130];
  const coTech = (co, tier, name, desc, flavor, x) => D.TECH.push(Object.assign({ id: 'co_' + co + '_' + tier, tree: 'co', co, line: 'co_' + co, tier, pts: CO_PTS[tier], name, desc, flavor }, x));
  const POWER = {}; for (const c of D.COS) POWER[c.id] = c.power;
  const ex = (co, desc, flavor, x) => coTech(co, 3, POWER[co] + ' · 极', desc, flavor, x);
  // 赤焰
  coTech('blitz', 1, '试车道', '侦察车、轻型坦克、防空车移动力再 +1。', '试车道全长四公里。她跑完的时候，计时员还在上发条。', { mods: [{ on: ['rec', 'tnk', 'aa'], move: 1 }] });
  coTech('blitz', 2, '回头车', '运兵车移动力 +1、搭载数 +1。步兵类单位的攻击减益减为 −5%。', '后勤跟不上的时候，她掉头把后勤装上车。', { mods: [{ on: ['apc'], move: 1, carry: 1 }, { on: 'inf', atk: 0.05 }] });
  ex('blitz', '强化技能「闪击」，其他效果保留。本回合：侦察车、防空车和各型坦克击毁目标后可再行动一次，全军最多 4 次。', '计划写的是打到河边。她问了一句，河对面归谁管。', { fx: { killAgain: ['rec', 'tnk', 'med', 'hvy', 'aa'], killAgainCap: 4 } });
  coTech('storm', 1, '方位角', '远程单位的运气范围变为 5–9（原来 0–9）。自行火炮、火箭炮视野 +2。', '院长的梦话都是方位角。有学生记下来核对过，是对的。', { rules: { luckOn: { indirect: [5, 9] } }, mods: [{ on: ['art', 'rkt'], vision: 2 }] });
  coTech('storm', 2, '试射', '自行火炮移动后可以攻击距离 2 格的目标，这次攻击 −30%。', '第一发是问路的。', { rules: { moveFire: ['art'], moveShot: { art: { atk: -0.3, range: [2, 2] } } } });
  ex('storm', '强化技能「炮火覆盖」，其他效果保留。本回合：己方远程单位射程 +1。', '全线先降一格血，再把射表往后翻一页。', { pw: { stormRange: 1 } });
  coTech('iron', 1, '新履带', '各型坦克在森林、废墟、荒地上的移动消耗为 1。', '新履带的味道他闻得出来。泥地的味道也闻得出来，所以沼泽没算进去。', { rules: { flatOn: { tank: ['forest', 'ruins', 'waste'] } } });
  coTech('iron', 2, '跟车走', '与己方坦克相邻的其他陆上单位，攻击和反击时没有攻击 −15% 的减益。', '步兵的事他不太懂。他的办法是让步兵站到他懂的东西旁边。', { rules: { buddy: { near: 'tank', on: 'land', not: 'tank', atk: 0.15 } } });
  ex('iron', '强化技能「履带洪流」，其他效果保留。发动时，最多 2 座没有单位的己方兵工厂各出现一辆 5 HP 的轻型坦克，当回合可行动。', '“再来一个连，要带履带的。”这次车间提前听见了。', { fx: { spawn: { at: 'factory', unit: 'tnk', hp: 50, max: 2 } } });
  coTech('forge', 1, '热车', '新生产的单位当回合移动力 +1。', '出厂那一脚油门，她让试车员直接踩到前线。', { rules: { freshMove: 1 } });
  coTech('forge', 2, '回炉', '己方单位被敌方击毁时，返还它造价的 10%。', '料费得多。能捡回来的，她都捡回来了。', { rules: { scrap: 0.1 } });
  ex('forge', '强化技能「加班」，其他效果保留。本回合：单位造价 −40%，每座生产建筑可生产 3 次。', '“明天早上给你。”说这话的时候是夜里十一点。', { fx: { costMul: 0.6, buildCap: 3 } });
  coTech('guard', 1, '抱架', '己方单位反击时攻击 +15%。', '手抬到下巴的高度，然后等。', { mods: [{ on: 'all', counterAtk: 0.15 }] });
  coTech('guard', 2, '补拳', '主动攻击 HP 比自己低的敌方单位时，没有攻击 −10% 的减益。', '对面先出的手。后面的事，按拳台的规矩算。', { rules: { initWaive: true } });
  ex('guard', '强化技能「架盾」，其他效果保留。己方下回合开始前：敌方陆上单位、舰船移动到与己方直射单位相邻的格子时，先受到 50% 伤害的攻击（不会被击毁）。每个己方单位只攻击一次，敌方单位每次移动最多受到 2 次。', '“你先。”这次他把对方迈步的那一下也算进去了。', { fx: { parry: { mul: 0.5, max: 2 } } });
  coTech('pyro', 1, '贴脸', '破甲兵攻击时，目标的地形防御减半。', '离近点。近到墙也帮不上忙。', { rules: { coverOn: { mech: 0.5 } } });
  coTech('pyro', 2, '点火', '不发动技能时，喷火兵攻击后也会把目标所在的森林变为荒地。', '树林里藏了多少人，烧完就能数清楚。', { rules: { burn: ['flm'] } });
  ex('pyro', '强化技能「燎原」，其他效果保留。本回合：破甲兵攻击也有溅射。每个敌方单位每回合因溅射最多损失 5 HP。', '下雨天她不出门。这天没下雨。', { fx: { splashBy: ['mech'] } });
  // 苍蓝
  coTech('tide', 1, '领航', '舰船在礁石上的移动消耗为 1。位于礁石、港口的舰船防御 +10%。', '礁石的位置她六岁就背下来了，和潮汐表印在同一页。', { rules: { flatOn: { ship: ['reef'] } }, mods: [{ on: 'ship', defOn: { reef: 0.1, port: 0.1 } }] });
  coTech('tide', 2, '抢滩', '登陆艇搭载数 +1。位于沙滩的己方陆上单位防御 +20%。', '陆地上的事她交给别人。交接地点在沙滩上。', { mods: [{ on: ['lnd'], carry: 1 }, { on: 'land', defOn: { beach: 0.2 } }] });
  ex('tide', '强化技能「怒潮」，其他效果保留。本回合：战列舰移动后可以攻击，射程 2–4。', '命令只有两个字。潮到了，后面的事炮手都知道。', { fx: { moveFire: ['bsh'], moveShot: { bsh: { range: [2, 4] } } } });
  coTech('sky', 1, '抢高度', '攻击机、轰炸机、战斗机主动攻击时，受到的反击伤害 −30%。', '飞得够高，地面上的麻烦都会变小。这一条后来写进了教材。', { mods: [{ on: 'plane', counterCut: 0.3 }] });
  coTech('sky', 2, '迫降场', '攻击机、轰炸机、战斗机也可以在己方城市修理。', '迫降记录全联邦最高。城里人看见他往下落，会先把晾的衣服收了。', { rules: { repairAt: { plane: ['city'] } } });
  ex('sky', '强化技能「俯冲」，其他效果保留。己方下回合开始前：只有敌方战斗机、防空导弹、防空车能攻击己方攻击机、轰炸机、战斗机。', '“上面天气不错。”这句话的意思是高炮够不着。', { fx: { highAlt: ['ftr', 'sam', 'aa'] } });
  coTech('heli', 1, '低飞', '直升机可以发现周围 8 格森林、废墟中的隐蔽单位。武装直升机对步兵类单位伤害 +10%。', '她飞得很低。低到林子里的人能看清她在嚼泡泡糖，她也能看清他们。', { rules: { revealBy: ['cop', 'tcp'] }, mods: [{ on: ['cop'], vs: { inf: 0.1 } }] });
  coTech('heli', 2, '索降', '回合开始时已在运输直升机上的步兵类单位，卸载后当回合还能攻击或占领，但不能移动。', '救援队的老手艺。以前把人吊上来，现在往下放。', { rules: { dropAct: ['tcp'] } });
  ex('heli', '强化技能「蜂群」，其他效果保留。本回合：武装直升机攻击时，目标每与一架己方直升机相邻，攻击 +10%，最多 +30%。', '下面的，抬头。抬头也数不过来。', { fx: { gang: { by: ['cop'], near: 'heli', per: 0.1, max: 0.3 } } });
  coTech('medic', 1, '分诊', '回合开始时，HP 不高于 4 的单位多恢复 1 HP。', '伤重的先看。逞强的排最后，他记得每一个。', { rules: { regenLow: { hp: 40, add: 10 } } });
  coTech('medic', 2, '按时吃饭', '满 HP 的己方单位没有攻击 −10% 的减益。', '查房的时候他会顺便问你吃了没有。答案影响出院时间。', { rules: { fullHpAtk: 0.1 } });
  ex('medic', '强化技能「急救」，其他效果保留。恢复量提高到 3 HP。复活最近被击毁的 2 个单位，各 4 HP。每个单位每局只能复活一次。', '送到他手上的人，都要活着下手术台。这次台子加了一张。', { fx: { heal: 30, revive: { n: 2, hp: 40 } } });
  coTech('bolt', 1, '回波', '防空导弹射程 +1。防空车、防空导弹、战斗机视野再 +1。', '她从回波里听得出型号和挂载。远一格的那种，声音闷一点。', { mods: [{ on: ['sam'], range: 1 }, { on: ['aa', 'sam', 'ftr'], vision: 1 }] });
  coTech('bolt', 2, '打招呼', '每个敌方回合，第一个移动后进入己方防空导弹射程的敌方航空单位自动受到一次攻击。', '鸟可以过。别的要先打招呼，没打的她替它打。', { rules: { overwatch: { by: ['sam'], perTurn: 1 } } });
  ex('bolt', '强化技能「天网」，其他效果保留。被“天网”攻击的敌方航空单位立即结束行动。', '听见了，三点钟方向。然后三点钟方向就安静了。', { fx: { owStop: true } });
  coTech('shark', 1, '坐底', '上回合没有移动的潜艇，本回合第一次攻击 +20%。', '他在敌港外面趴了十九天。第二十天的事，报告里只写了一行。', { rules: { stillAtk: { on: ['sub'], atk: 0.2 } } });
  coTech('shark', 2, '下潜', '潜艇攻击后可用剩余移动力再移动。', '打完就往下走。上面的人还在找是哪个方向来的。', { rules: { hitRun: ['sub'] } });
  ex('shark', '强化技能「狼群」，其他效果保留。本回合：潜艇可以穿过敌方舰船所在的格子。', '不急。等上面的船都排好了，他从底下过去。', { fx: { pass: ['sub'] } });
  // 翠林
  coTech('militia', 1, '赶集', '步兵、破甲兵移动力 +1。', '赶集练出来的。去晚了，好位置就让邻寨占了。', { mods: [{ on: ['inf', 'mech'], move: 1 }] });
  coTech('militia', 2, '小路', '只有步兵这一个兵种可以穿过敌方单位所在的格子，但不能停在上面。', '山洪那天她带全寨人走的那条路，地图上到现在也没有。', { rules: { pass: ['inf'] } });
  ex('militia', '强化技能「全民皆兵」，其他效果保留。出现步兵的城市增加到最多 6 座，步兵初始为 1 星。', '木牌上原来写四户出一个人。她拿炭笔改了个数。', { pw: { militiaMax: 6 }, fx: { spawnStars: 1 } });
  coTech('hawk', 1, '多带五发', '投弹手击毁目标后也可再行动（每回合一次）。', '听说要打四个月，他回去多带了五发。分给投弹手两发。', { rules: { killAgain: ['grn'] } });
  coTech('hawk', 2, '猎刀', '狙击手被相邻的敌方单位攻击时可以反击，伤害是正常的 50%。', '猎户随身带刀。平时剥皮用。', { rules: { closeCounter: { snp: 0.5 } } });
  ex('hawk', '强化技能「一击」，其他效果保留。本回合：每个狙击手击毁目标后可连续再行动，最多 3 次。', '三天里他说了两句话，都是报距离。这一回合他报了四次。', { fx: { killAgainMax: { snp: 3 } } });
  coTech('owl', 1, '藏兵', '位于山地、沼泽的己方单位也处于隐蔽状态，规则与森林、废墟、礁石相同。', '每一片林子能藏多少人，她有数。现在山和泥塘也入了账。', { rules: { hideOn: ['mountain', 'swamp'] } });
  coTech('owl', 2, '看错了', '敌方单位遇伏时，伏击它的己方单位先攻击一次，不受反击。每个己方单位每个敌方回合一次。', '你看见的，是她想让你看见的。没看见的那个，离你一格。', { rules: { ambushShot: true } });
  ex('owl', '强化技能「灯火管制」，其他效果保留。持续时间延长到 2 个敌方回合。迷雾关闭时，敌方只能发现相邻的己方单位。生效期间技能槽不积累。', '没有月亮的夜晚她最喜欢。这次她订了两晚。', { fx: { turns: 2, blackoutR: 1 } });
  coTech('rider', 1, '下坡路', '攻击后再移动时，剩余移动力 +1。', '回程他都挑下坡走。省油，也省得回头看。', { rules: { hitRunPlus: 1 } });
  coTech('rider', 2, '掉头', '攻击后再移动过的单位，己方下回合开始前防御 +15%。', '东西放这儿了，走了。挨打的机会留给还站在原地的人。', { rules: { ranDef: 0.15 } });
  ex('rider', '强化技能「风驰」，其他效果保留。本回合：全军移动力提高到 +3，直射单位攻击后可用全部移动力再移动。', '去的路和回的路他分开算。两条都跑满。', { fx: { move: [{ on: 'all', v: 1 }], again: 'melee' } });
  coTech('frost', 1, '踏雪', '回合开始时位于森林、山地、荒地、沼泽的己方单位，本回合移动力 +1（航空单位除外）。', '她的人到了平地上觉得太空。从林子里出发，步子反倒大。', { rules: { roughMarch: { on: ['forest', 'mountain', 'waste', 'swamp'], v: 1 } } });
  coTech('frost', 2, '冰面', '履带车辆可以进入河流，轮式车辆可以进入沼泽，移动消耗都是 2。', '结冰的湖面她走了四十年。河在她眼里，是一条还没冻上的路。', { rules: { moveOver: { tread: { river: 2 }, wheel: { swamp: 2 } } } });
  ex('frost', '强化技能「寒潮」，其他效果保留。生效期间：敌方单位在森林、山地、荒地、沼泽、河流上的移动消耗 +1（航空单位除外）。', '南边的寨子说她冷。她说那是你们没见过真的冷。这回见到了。', { fx: { chill: { rough: 1 } } });
  coTech('ember', 1, '站得住', '己方单位的地形防御也不随 HP 减少而降低。', '身上的伤够写一页纸。没有一处让他挪过地方。', { rules: { fullCover: true } });
  coTech('ember', 2, '咬牙', '每个敌方回合，第一个要被击毁的己方单位保留 1 HP。受攻击前 HP 至少为 5 才有效，每个单位每局一次。', '年轻人劝他撤。他说等插完这季秧。', { rules: { grit: { minHp: 50, perTurn: 1 } } });
  ex('ember', '强化技能「背水」，其他效果保留。攻击加成改为每损失 1 HP +10%，最多 +90%。己方下回合开始前：“咬牙”每个敌方回合可触发 3 次。', '那一仗寨子出了六十个人，回来七个。阵地是那七个人带回来的。', { fx: { hurtAtk: 0, hurtAtkPer: 0.1, gritMax: 3 } });
  // 金沙
  coTech('wall', 1, '勾缝', '位于己方建筑的单位每回合免费恢复 1 HP（航空单位除外）。', '砖缝要每年勾一遍。站在墙上的人，顺便也勾了。', { rules: { regenProp: 10 } });
  coTech('wall', 2, '垛口', '位于 2 星及以上地形或建筑的单位反击时，没有攻击 −10% 的减益。', '垛口的宽度刚好够架一支枪。', { rules: { holdCounter: 0.1 } });
  ex('wall', '强化技能「铁壁」，其他效果保留。恢复量提高到 3 HP。己方下回合开始前：敌方的占领不会减少己方建筑的占领值。', '墙在，人在。门他也顺手闩上了。', { pw: { wallHeal: 30 }, fx: { noCapture: true } });
  coTech('gold', 1, '抹零', '所有单位造价再 −5%，结果向下取整到 10 的倍数。', '他讨厌零头。八十五的东西，他只肯付八十。', { mods: [{ on: 'all', cost: -0.05 }], rules: { costFloor: true } });
  coTech('gold', 2, '利息', '回合开始时，每持有 500 资金获得 20 资金，最多 200（上限随地图规模变化）。', '这笔账，我们慢慢算。慢的那部分叫利息。', { rules: { interest: { per: 500, gain: 20, max: 200 } } });
  ex('gold', '强化技能「军费」，其他效果保留。每座建筑的资金提高到 100。本回合：单位造价再 −20%。', '发火不挣钱。发钱的时候顺便砍价，两头都挣。', { pw: { goldPer: 100 }, fx: { costMul: 0.8 } });
  coTech('dice', 1, '加注', '运气范围变为 −5 至 +55（原来 0 至 +40）。', '押大。桌上的筹码看着少，他又添了一摞。', { rules: { luck: [-5, 55] } });
  coTech('dice', 2, '头彩', '每回合第一次主动攻击时，运气判定两次，取较高值。', '每晚第一把他都认真打。后面的看心情。', { rules: { firstLuck: 2 } });
  ex('dice', '强化技能「梭哈」，其他效果保留。本回合：运气范围 ×1.5。', '作战计划写在一张扑克牌背面。正面是什么牌，他说打完再翻。', { fx: { luckMul: 1.5 } });
  coTech('wheel', 1, '新轮胎', '侦察车在平原上的移动消耗为 1。', '议事会嫌他费轮胎。他申请了一批新的，理由栏写的是“旧的没了”。', { rules: { flatOn: { rec: ['plain'] } } });
  coTech('wheel', 2, '加急件', '侦察车可以占领建筑，占领值减半。不能使用导弹井。', '加急件送到，顺手把城门钥匙也签收了。', { rules: { capBy: ['rec'] }, mods: [{ on: ['rec'], capture: 0.5 }] });
  ex('wheel', '强化技能「穿插」，其他效果保留。被侦察车、摩托兵、运兵车穿过的敌方陆上单位各损失 1 HP（不会被击毁），每回合最多 2 HP。', '借过，赶时间。没让开的那几位，车漆上留了点纪念。', { fx: { runOver: 10 } });
  coTech('toll', 1, '封账', '己方单位正在占领的敌方建筑，本回合不给敌方提供收入。', '他认为占领的意思就是开始收税。对面的税，从他进门那天起停收。', { rules: { freeze: true } });
  coTech('toll', 2, '收据', '每占领一座建筑，技能槽 +10%，每回合最多 +20%。每座建筑每局只算一次，技能生效期间不算。', '占一座，盖一个章。章攒够了可以换东西。', { rules: { capMeter: { per: 0.1, max: 0.2 } } });
  ex('toll', '强化技能「加征」，其他效果保留。获得的收入提高到 150%。本回合：占领中立建筑时占领值 ×2。', '入城费，一位十块。这个月收两次，告示昨晚贴了。', { fx: { incomeNow: 1.5, capMul: 2 } });
  coTech('nomad', 1, '看货', '己方城市还可以生产侦察车和运兵车。', '来都来了，看看货。新到了两样能开走的。', { rules: { cityBuild: ['rec', 'apc'] } });
  coTech('nomad', 2, '还价', '不发动技能时，每回合也可以出售 1 个位于己方建筑的单位，返还造价的 40%。', '她讨厌一口价。四成是让了三轮之后的数。', { rules: { sell: { rate: 0.4, perTurn: 1 } } });
  ex('nomad', '强化技能「黑市」，其他效果保留。本回合：在己方城市生产的单位当回合可行动。', '军营开成了集市。这天的规矩是当场提货，开了就走。', { fx: { freshBuild: 'city' } });

  // 地图系数：研究点需求和各档经费都乘它。由 tools/econ.js 量出来的对局长度定（系数 = 对局长度 ÷ 26，夹在 0.5–1.8：低档经费在对局长度的六成多研究完一条线）；
  // 电脑互打分不出胜负的几张图（碎星群岛、中央海、十二港、退潮海床）按大小给。表里没有的地图按每个阵营摊到的格子数分档（core.js 的 C.techTiers）；地图也可以自己写 def.techK
  D.TECH_K = { 晨曦镇: 0.5, 灯塔岬: 0.9, 雾港: 1.2, 断龙岭: 0.9, 千屿: 1, 黑沼三角洲: 1.1, 金砂矿谷: 0.7, 练兵场: 0.7, 双桥镇: 0.8, 山口要塞: 0.7, 碧湾海峡: 1.4, 碎星群岛: 1.1,
    鹰愁走廊: 1.3, 聚宝盆地: 0.7, 镜湖会战: 1.4, 双子湖会战: 1.2, 中央海: 1.8, 三岔口: 1.6, 同盟走廊: 1.8, 孤城: 0.8, 十二港: 1.8, 炉城: 1.8, 退潮海床: 1.8, 四方演习: 1.6,
    雾松林: 1.2, 旧矿井: 0.7, 大闸: 1.6 }; // 后两张是战役专用图（def.campaign）

  D.CHARS = {
    '.': 'plain', f: 'forest', m: 'mountain', r: 'road', b: 'bridge', v: 'river', '~': 'sea',
    c: 'city', x: 'factory', a: 'airport', t: 'tower',
    p: 'port', H: 'hq', K: 'city', B: 'factory', P: 'airport', S: 'port',
    // 新地形
    u: 'ruins', w: 'waste', s: 'swamp', e: 'beach', o: 'reef', '#': 'wall',
    // 新建筑：小写中立，大写一号玩家开局自有（core.js newGame 里的 OWNED 字符串要同步）
    g: 'mine', h: 'hospital', k: 'fort', i: 'silo', G: 'mine', D: 'hospital', F: 'fort',
    l: 'lab', L: 'lab', // 科研所：l 中立，L 一号玩家开局自有
    '*': 'shard', // 碎片堆（D.RES.shard）
    j: 'gate', // 潮闸：中立；要开局归某一方就写在 owner 网格或关卡的 owners 里
  };

  D.MAPS = root.AWMaps || require('./maps.js');

  if (root.AWMods) root.AWMods.applyData(D); // 扩展的指挥官、数值调整在这里并进来（core.js 还没加载）
  root.AWData = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
