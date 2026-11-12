/* EduLab · 元素周期表（periodic）— Micro 级深改
 * 章节：认识周期表 / 电子层与周期 / 原子半径和电负性 / 电离能与熔点 / 物态与温度 /
 *       元素发现史 / 三种布局与同族连线 / 随堂检测
 * 渲染架构（draw call 预算内做满细节）：
 *   118 个元素格 = 顶板贴图集（2 张 2048² CanvasTexture，8×8 格/张，合并 BufferGeometry，
 *     顶点色控制亮度与发现史残影）+ 柱身 InstancedMesh（固/液/气三分桶：线框气态、透明液态）；
 *   升温白炽 = 加色 InstancedMesh 叠加层（按金属熔点推算的发光强度）+ 暖色点光源；
 *   Bohr 电子层 = 车削展台 + 核子团簇（质子/中子双桶 InstancedMesh）+ 精饰轨道环 + 电子拖尾。
 * 场景叙事：木质实验台（车削桌腿 + 横撑）+ 斜面展台（台面刻周期/族标尺与接触阴影）+
 *   试剂瓶架（钠/铁/汞/硫四瓶：放样瓶身、弯月面高光、卷纹瓶盖、标签纹理）+
 *   立式温度计（刻度筒 + 发光液柱）+ 铜放大镜 + 手册书堆 + 门捷列夫手稿卡（黄铜镇纸）。
 * 交互：属性柱高 / 类别点亮（图例可点）/ 周期聚焦 / 电离能锯齿折线图窗 / 熔点柱 /
 *   温度扫描（气态浮沉、金属白炽）/ 发现史时间轴（残影空位可数）/ 三布局变形 /
 *   同族连线光束（变形时隐去、落定后重建）/ 元素特写卡（含用途）/ 随堂检测。
 * 布局：真·三栏（章节目录 / 3D 舞台 / 详解+控件+读数），左右栏独立折叠 + 专注模式 +
 *   右栏三块手风琴（localStorage 记忆）；键盘 ←→ 切章、R 复位视角、F 全屏、] 折右栏、空格播放。
 * 数据：紧凑数据块（118 元素 × 13 字段）+ 元素用途 + 发现史大事记（0/空值显示「—」不编造）。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText,
  createControlsPanel,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlow, matGlass,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment,
} from './edu-vfx.js';

/* ---------------- 数据 ---------------- */

// 118 个标准中文元素名（104 号起无通行简体译名，按公约用符号）
const CN = [
  '氢', '氦', '锂', '铍', '硼', '碳', '氮', '氧', '氟', '氖',
  '钠', '镁', '铝', '硅', '磷', '硫', '氯', '氩',
  '钾', '钙', '钪', '钛', '钒', '铬', '锰', '铁', '钴', '镍', '铜', '锌',
  '镓', '锗', '砷', '硒', '溴', '氪',
  '铷', '锶', '钇', '锆', '铌', '钼', '锝', '钌', '铑', '钯', '银', '镉', '铟', '锡', '锑', '碲', '碘', '氙',
  '铯', '钡',
  '镧', '铈', '镨', '钕', '钷', '钐', '铕', '钆', '铽', '镝', '钬', '铒', '铥', '镱', '镥',
  '铪', '钽', '钨', '铼', '锇', '铱', '铂', '金', '汞', '铊', '铅', '铋', '钋', '砹', '氡',
  '钫', '镭',
  '锕', '钍', '镤', '铀', '镎', '钚', '镅', '锔', '锫', '锎', '锿', '镄', '钔', '锘', '铹',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
];

// 元素用途（教学特写卡「用途」行；人工合成元素附命名/来源说明）
const USES = [
  '合成氨与炼油、火箭燃料、燃料电池的干净能源',
  '磁共振成像冷却、气球飞艇、深潜呼吸混合气',
  '锂电池、玻璃陶瓷、铝合金添加剂',
  'X 射线窗口、航天器合金、核反应堆中子反射层',
  '耐热硼硅玻璃、洗涤剂硼砂、半导体掺杂源',
  '钻石与铅笔芯、钢铁冶炼、碳纤维与石墨烯',
  '合成氨化肥、食品充氮保鲜、液氮冷冻',
  '呼吸与医疗供氧、炼钢助燃、火箭氧化剂',
  '含氟牙膏、不粘锅涂层、制冷剂与灭火剂',
  '霓虹灯招牌、激光器、深低温制冷液',
  '食盐的主要成分、路灯钠灯、化工还原剂',
  '轻量镁合金构件、烟花与照明弹、叶绿素的核心原子',
  '易拉罐与箔纸、飞机蒙皮、门窗型材',
  '芯片和太阳能电池板、玻璃与石英、有机硅材料',
  '安全火柴、磷肥、DNA 与 ATP 的骨架原子',
  '硫酸制造、橡胶硫化、火药与医药',
  '自来水消毒、PVC 塑料、漂白与杀菌',
  '焊接保护气、灯泡填充气、中空玻璃夹层',
  '钾肥、肥皂与玻璃、维持神经与心肌电信号',
  '水泥与石膏、骨骼牙齿、造纸漂白',
  '铝钪合金、体育场照明灯、燃料电池陶瓷',
  '钛合金人工关节、飞机发动机、钛白颜料',
  '工具钢增硬、化工催化剂、钒液流电池',
  '不锈钢与电镀、皮革鞣制、绿色颜料',
  '炼钢脱氧剂、干电池、高锰酸钾消毒剂',
  '钢铁骨架、血红蛋白载氧、电磁铁芯',
  '高温合金与强磁体、蓝色玻璃与陶瓷',
  '不锈钢与电镀、动力电池正极、硬币',
  '电线电缆、水管与铜器、抗菌表面',
  '镀锌防锈、干电池、防晒霜与橡胶',
  '蓝光 LED 与激光器、掌心一捂就熔的金属',
  '光纤与红外光学、卫星太阳能电池、半导体',
  '砷化镓半导体、合金硬化（剧毒需严管）',
  '光伏薄膜、复印机感光鼓、玻璃脱色剂',
  '阻燃剂、胶片感光乳剂、钻井液',
  '节能灯与高压试验、激光与闪光灯',
  '原子钟、光电管、催化剂（活泼易燃）',
  '红色烟花与信号弹、磁铁铁氧体、骨质疏松药',
  'LED 黄色荧光粉、高温超导、激光晶体',
  '核燃料包壳、陶瓷假牙、化工耐蚀设备',
  '超导谐振腔、桥梁用钢、珠宝镀膜',
  '不锈钢与高温合金、润滑油钼剂、电极',
  '医学影像示踪剂（第一个人造元素）',
  '硬盘磁记录层、电触点、化工催化剂',
  '三元催化器、首饰镜面镀层、电极',
  '汽车尾气催化、氢气提纯膜、电子浆料',
  '感光胶片、导电银浆、抗菌涂层与首饰',
  '镍镉电池、量子点显示、黄色颜料（需严管）',
  '触摸屏透明电极、低温焊料、红外探测器',
  '焊锡与青铜、食品罐头马口铁、玻璃镀层',
  '阻燃剂、铅字与轴承合金、玻璃澄清剂',
  '薄膜太阳能、半导体合金、钢铁添加剂',
  '碘伏消毒、加碘盐、甲状腺显像',
  '氙气大灯、离子推进器、麻醉与 CT 成像',
  '原子钟定义「秒」、光电倍增管、钻井液',
  '钡餐造影、烟花绿色、钻井加重剂',
  '镍氢电池负极、光学镜头、储氢材料',
  '打火石、抛光粉、汽车尾气净化催化剂',
  '钕磁体配料、焊工护目镜、陶瓷着色',
  '钕铁硼强磁体、激光器、耳机单元',
  '发光涂料与核电池（人造放射性元素）',
  '钐钴磁体、核反应堆控制棒、红外激光',
  '红色荧光粉、纸币防伪油墨、荧光灯粉',
  '核磁共振造影剂、中子屏蔽、荧光粉',
  '绿色荧光粉、磁致伸缩材料、传感器',
  '电动车电机磁体、硬盘与激光',
  '医用激光器、磁通聚焦、量子研究',
  '光纤信号放大器、粉色玻璃、激光',
  '便携 X 光机、金属卤素灯、激光',
  '光纤激光器、原子钟、半导体掺杂',
  'PET 闪烁晶体、激光与催化剂',
  '核反应堆控制棒、芯片栅极材料',
  '手机钽电容、人工关节、手术器械',
  '灯丝、硬质合金刀具、穿甲弹芯',
  '喷气发动机高温合金、化工催化剂',
  '仪器轴尖、钢笔尖（铱锇合金极硬）',
  '火花塞触点、坩埚、国际标准砝码',
  '三元催化、首饰、实验室电极与坩埚',
  '首饰与储备资产、芯片键合线、航天镀层',
  '温度计与气压计、荧光灯（汞蒸气严管）',
  '红外光学玻璃、光电探测器（剧毒严管）',
  '铅酸蓄电池、防辐射屏蔽、焊料',
  '胃药铋剂、低熔点合金、珠光化妆品',
  '静电消除器、航天热源（剧毒放射性）',
  '仅实验室合成，用于基础研究',
  '地质找矿测氡与室内通风防护（放射性）',
  '仅见于实验研究，量以原子个数计',
  '曾用于夜光涂料与早期放疗（已淘汰）',
  '中子源材料、放射治疗研究',
  '钍基核燃料储备、旧式煤气灯罩',
  '仅实验室合成，基础研究对象',
  '核燃料、历史玻璃着色剂',
  '中子探测器、核研究靶材',
  '核燃料、深空探测器用核电池',
  '烟雾报警器的电离源',
  '航天器热电电源、科研靶材',
  '仅实验室合成，痕量研究',
  '强中子源：探矿、金属疲劳检测',
  '以爱因斯坦命名，氢弹残骸中觅得',
  '以费米命名，仅原子数量级合成',
  '以门捷列夫命名，最初只得 17 个原子',
  '以诺贝尔命名，仅见于实验室',
  '以劳伦斯命名，实验室痕量合成',
  '以卢瑟福命名，人工合成元素',
  '以杜布纳实验室命名',
  '以西博格命名（命名时他仍在世）',
  '兼致敬玻尔与德国黑森州',
  '以黑森州命名，人工合成元素',
  '以迈特纳命名，实验室合成',
  '得名于达姆施塔特，人工合成元素',
  '以伦琴命名，实验室合成',
  '以哥白尼命名，人工合成元素',
  '由日本理研发现并命名',
  '得名于弗廖罗夫实验室',
  '以莫斯科州命名，人工合成元素',
  '得名于利弗莫尔实验室',
  '得名于美国田纳西州',
  '以奥加涅相命名，目前最重的元素',
];

// 发现史大事记（年份升序；发现史章按当前年份滚动到最近一条）
const TIMELINE = [
  [1669, '布兰德从尿液里蒸出磷，这是第一个记下发现者的元素'],
  [1789, '拉瓦锡整理出第一张元素清单，收录 33 种「简单物质」'],
  [1807, '戴维用电解法撬出钾与钠，随后钙、钡、镁接连现身'],
  [1860, '本生与基尔霍夫发明光谱分析，从谱线里揪出铯和铷'],
  [1869, '门捷列夫排出首版周期表：已知 63 种，却为未知元素留了空位'],
  [1875, '镓、钪、锗相继出现，性质与预言吻合，空位被一个个填上'],
  [1894, '瑞利与拉姆齐从空气里逮到氩——谁也没想到还有一整族'],
  [1898, '氖、氪、氙归队，居里夫妇发现钋和镭，稀有气体成列'],
  [1913, '莫塞莱用 X 射线证明：元素的座次由原子序数决定'],
  [1937, '锝问世——第一个人造元素，补上了 43 号空位'],
  [1940, '镎与钚合成成功，超铀元素时代开启'],
  [1945, '钷被确认，1 到 94 号之间的空位全部补齐'],
  [1955, '钔合成，以门捷列夫命名，最初只得到 17 个原子'],
  [1974, '美苏实验室竞逐 104 到 106 号，命名之争闹了许多年'],
  [1996, '德国达姆施塔特连成 107 至 112 号，再往后各方接力'],
  [2016, '113、115、117、118 号获正式命名，第七周期就此填满'],
];

// 每元素字段：[符号, 英文名, 相对原子质量, 原子半径pm, 电负性, 第一电离能kJ/mol,
//              熔点K, 沸点K, 电子排布, 分类idx, 发现年份(0=古代), 标况状态(0固1液2气-1未知), 密度]
const ELS = JSON.parse('[["H","Hydrogen","1.00794",37,2.2,1312,14,20,"1s1",6,1766,2,0.0000899],["He","Helium","4.002602",32,null,2372,null,4,"1s2",8,1868,2,0.0001785],["Li","Lithium","6.941",134,0.98,520,454,1615,"[He] 2s1",0,1817,0,0.535],["Be","Beryllium","9.012182",90,1.57,900,1560,2743,"[He] 2s2",1,1798,0,1.848],["B","Boron","10.811",82,2.04,801,2348,4273,"[He] 2s2 2p2",5,1807,0,2.46],["C","Carbon","12.0107",77,2.55,1087,3823,4300,"[He] 2s2 2p2",6,0,0,2.26],["N","Nitrogen","14.0067",75,3.04,1402,63,77,"[He] 2s2 2p3",6,1772,2,0.001251],["O","Oxygen","15.9994",73,3.44,1314,55,90,"[He] 2s2 2p4",6,1774,2,0.001429],["F","Fluorine","18.9984032",71,3.98,1681,54,85,"[He] 2s2 2p5",7,1670,2,0.001696],["Ne","Neon","20.1797",69,null,2081,25,27,"[He] 2s2 2p6",8,1898,2,0.0009],["Na","Sodium","22.98976928",154,0.93,496,371,1156,"[Ne] 3s1",0,1807,0,0.968],["Mg","Magnesium","24.3050",130,1.31,738,923,1363,"[Ne] 3s2",1,1808,0,1.738],["Al","Aluminum","26.9815386",118,1.61,578,933,2792,"[Ne] 3s2 3p1",null,0,0,2.7],["Si","Silicon","28.0855",111,1.9,787,1687,3173,"[Ne] 3s2 3p2",5,1854,0,2.33],["P","Phosphorus","30.973762",106,2.19,1012,317,554,"[Ne] 3s2 3p3",6,1669,0,1.823],["S","Sulfur","32.065",102,2.58,1000,388,718,"[Ne] 3s2 3p4",6,0,0,1.96],["Cl","Chlorine","35.453",99,3.16,1251,172,239,"[Ne] 3s2 3p5",7,1774,2,0.003214],["Ar","Argon","39.948",97,null,1521,84,87,"[Ne] 3s2 3p6",8,1894,2,0.001784],["K","Potassium","39.0983",196,0.82,419,337,1032,"[Ar] 4s1",0,1807,0,0.856],["Ca","Calcium","40.078",174,1,590,1115,1757,"[Ar] 4s2",1,0,0,1.55],["Sc","Scandium","44.955912",144,1.36,633,1814,3103,"[Ar] 3d1 4s2",2,1876,0,2.985],["Ti","Titanium","47.867",136,1.54,659,1941,3560,"[Ar] 3d2 4s2",2,1791,0,4.507],["V","Vanadium","50.9415",125,1.63,651,2183,3680,"[Ar] 3d3 4s2",2,1803,0,6.11],["Cr","Chromium","51.9961",127,1.66,653,2180,2944,"[Ar] 3d5 4s1",2,0,0,7.14],["Mn","Manganese","54.938045",139,1.55,717,1519,2334,"[Ar] 3d5 4s2",2,1774,0,7.47],["Fe","Iron","55.845",125,1.83,763,1811,3134,"[Ar] 3d6 4s2",2,0,0,7.874],["Co","Cobalt","58.933195",126,1.88,760,1768,3200,"[Ar] 3d7 4s2",2,0,0,8.9],["Ni","Nickel","58.6934",121,1.91,737,1728,3186,"[Ar] 3d8 4s2",2,1751,0,8.908],["Cu","Copper","63.546",138,1.9,746,1358,3200,"[Ar] 3d10 4s1",2,0,0,8.92],["Zn","Zinc","65.38",131,1.65,906,693,1180,"[Ar] 3d10 4s2",2,1746,0,7.14],["Ga","Gallium","69.723",126,1.81,579,303,2477,"[Ar] 3d10 4s2 4p1",null,1875,0,5.904],["Ge","Germanium","72.64",122,2.01,762,1211,3093,"[Ar] 3d10 4s2 4p2",5,1886,0,5.323],["As","Arsenic","74.92160",119,2.18,947,1090,887,"[Ar] 3d10 4s2 4p3",5,0,0,5.727],["Se","Selenium","78.96",116,2.55,941,494,958,"[Ar] 3d10 4s2 4p4",6,1817,0,4.819],["Br","Bromine","79.904",114,2.96,1140,266,332,"[Ar] 3d10 4s2 4p5",7,1826,1,3.12],["Kr","Krypton","83.798",110,null,1351,116,120,"[Ar] 3d10 4s2 4p6",8,1898,2,0.00375],["Rb","Rubidium","85.4678",211,0.82,403,312,961,"[Kr] 5s1",0,1861,0,1.532],["Sr","Strontium","87.62",192,0.95,550,1050,1655,"[Kr] 5s2",1,1790,0,2.63],["Y","Yttrium","88.90585",162,1.22,600,1799,3618,"[Kr] 4d1 5s2",2,1794,0,4.472],["Zr","Zirconium","91.224",148,1.33,640,2128,4682,"[Kr] 4d2 5s2",2,1789,0,6.511],["Nb","Niobium","92.90638",137,1.6,652,2750,5017,"[Kr] 4d4 5s1",2,1801,0,8.57],["Mo","Molybdenum","95.96",145,2.16,684,2896,4912,"[Kr] 4d5 5s1",2,1778,0,10.28],["Tc","Technetium","98",156,1.9,702,2430,4538,"[Kr] 4d5 5s2",2,1937,0,11.5],["Ru","Ruthenium","101.07",126,2.2,710,2607,4423,"[Kr] 4d7 5s1",2,1827,0,12.37],["Rh","Rhodium","102.90550",135,2.28,720,2237,3968,"[Kr] 4d8 5s1",2,1803,0,12.45],["Pd","Palladium","106.42",131,2.2,804,1828,3236,"[Kr] 4d10",2,1803,0,12.023],["Ag","Silver","107.8682",153,1.93,731,1235,2435,"[Kr] 4d10 5s1",2,0,0,10.49],["Cd","Cadmium","112.411",148,1.69,868,594,1040,"[Kr] 4d10 5s2",2,1817,0,8.65],["In","Indium","114.818",144,1.78,558,430,2345,"[Kr] 4d10 5s2 5p1",null,1863,0,7.31],["Sn","Tin","118.710",141,1.96,709,505,2875,"[Kr] 4d10 5s2 5p2",null,0,0,7.31],["Sb","Antimony","121.760",138,2.05,834,904,1860,"[Kr] 4d10 5s2 5p3",5,0,0,6.697],["Te","Tellurium","127.60",135,2.1,869,723,1261,"[Kr] 4d10 5s2 5p4",5,1782,0,6.24],["I","Iodine","126.90447",133,2.66,1008,387,457,"[Kr] 4d10 5s2 5p5",7,1811,0,4.94],["Xe","Xenon","131.293",130,null,1170,161,165,"[Kr] 4d10 5s2 5p6",8,1898,2,0.0059],["Cs","Cesium","132.9054519",225,0.79,376,302,944,"[Xe] 6s1",0,1860,0,1.879],["Ba","Barium","137.327",198,0.89,503,1000,2143,"[Xe] 6s2",1,1808,0,3.51],["La","Lanthanum","138.90547",169,1.1,538,1193,3737,"[Xe] 5d1 6s2",3,1839,0,6.146],["Ce","Cerium","140.116",null,1.12,534,1071,3633,"[Xe] 4f1 5d1 6s2",3,1803,0,6.689],["Pr","Praseodymium","140.90765",null,1.13,527,1204,3563,"[Xe] 4f3 6s2",3,1885,0,6.64],["Nd","Neodymium","144.242",null,1.14,533,1294,3373,"[Xe] 4f4 6s2",3,1885,0,7.01],["Pm","Promethium","145",null,1.13,540,1373,3273,"[Xe] 4f5 6s2",3,1947,0,7.264],["Sm","Samarium","150.36",null,1.17,545,1345,2076,"[Xe] 4f6 6s2",3,1853,0,7.353],["Eu","Europium","151.964",null,1.2,547,1095,1800,"[Xe] 4f7 6s2",3,1901,0,5.244],["Gd","Gadolinium","157.25",null,1.2,593,1586,3523,"[Xe] 4f7 5d1 6s2",3,1880,0,7.901],["Tb","Terbium","158.92535",null,1.2,566,1629,3503,"[Xe] 4f9 6s2",3,1843,0,8.219],["Dy","Dysprosium","162.500",null,1.22,573,1685,2840,"[Xe] 4f10 6s2",3,1886,0,8.551],["Ho","Holmium","164.93032",null,1.23,581,1747,2973,"[Xe] 4f11 6s2",3,1878,0,8.795],["Er","Erbium","167.259",null,1.24,589,1770,3141,"[Xe] 4f12 6s2",3,1842,0,9.066],["Tm","Thulium","168.93421",null,1.25,597,1818,2223,"[Xe] 4f13 6s2",3,1879,0,9.321],["Yb","Ytterbium","173.054",null,1.1,603,1092,1469,"[Xe] 4f14 6s2",3,1878,0,6.57],["Lu","Lutetium","174.9668",160,1.27,524,1936,3675,"[Xe] 4f14 5d1 6s2",3,1907,0,9.841],["Hf","Hafnium","178.49",150,1.3,659,2506,4876,"[Xe] 4f14 5d2 6s2",2,1923,0,13.31],["Ta","Tantalum","180.94788",138,1.5,761,3290,5731,"[Xe] 4f14 5d3 6s2",2,1802,0,16.65],["W","Tungsten","183.84",146,2.36,770,3695,5828,"[Xe] 4f14 5d4 6s2",2,1783,0,19.25],["Re","Rhenium","186.207",159,1.9,760,3459,5869,"[Xe] 4f14 5d5 6s2",2,1925,0,21.02],["Os","Osmium","190.23",128,2.2,840,3306,5285,"[Xe] 4f14 5d6 6s2",2,1803,0,22.61],["Ir","Iridium","192.217",137,2.2,880,2739,4701,"[Xe] 4f14 5d7 6s2",2,1803,0,22.65],["Pt","Platinum","195.084",128,2.28,870,2041,4098,"[Xe] 4f14 5d9 6s1",2,0,0,21.09],["Au","Gold","196.966569",144,2.54,890,1337,3129,"[Xe] 4f14 5d10 6s1",2,0,0,19.3],["Hg","Mercury","200.59",149,2,1007,234,630,"[Xe] 4f14 5d10 6s2",2,0,1,13.534],["Tl","Thallium","204.3833",148,2.04,589,577,1746,"[Xe] 4f14 5d10 6s2 6p1",null,1861,0,11.85],["Pb","Lead","207.2",147,2.33,716,601,2022,"[Xe] 4f14 5d10 6s2 6p2",null,0,0,11.34],["Bi","Bismuth","208.98040",146,2.02,703,544,1837,"[Xe] 4f14 5d10 6s2 6p3",null,0,0,9.78],["Po","Polonium","209",null,2,812,527,1235,"[Xe] 4f14 5d10 6s2 6p4",5,1898,0,9.196],["At","Astatine","210",null,2.2,920,575,null,"[Xe] 4f14 5d10 6s2 6p5",7,1940,0,null],["Rn","Radon","222",145,null,1037,202,211,"[Xe] 4f14 5d10 6s2 6p6",8,1900,2,0.00973],["Fr","Francium","223",null,0.7,380,null,null,"[Rn] 7s1",0,1939,0,null],["Ra","Radium","226",null,0.9,509,973,2010,"[Rn] 7s2",1,1898,0,5],["Ac","Actinium","227",null,1.1,499,1323,3473,"[Rn] 6d1 7s2",4,1899,0,10.07],["Th","Thorium","232.03806",null,1.3,587,2023,5093,"[Rn] 6d2 7s2",4,1828,0,11.724],["Pa","Protactinium","231.03588",null,1.5,568,1845,4273,"[Rn] 5f2 6d1 7s2",4,1913,0,15.37],["U","Uranium","238.02891",null,1.38,598,1408,4200,"[Rn] 5f3 6d1 7s2",4,1789,0,19.05],["Np","Neptunium","237",null,1.36,605,917,4273,"[Rn] 5f4 6d1 7s2",4,1940,0,20.45],["Pu","Plutonium","244",null,1.28,585,913,3503,"[Rn] 5f6 7s2",4,1940,0,19.816],["Am","Americium","243",null,1.3,578,1449,2284,"[Rn] 5f7 7s2",4,1944,0,null],["Cm","Curium","247",null,1.3,581,1618,3383,"[Rn] 5f7 6d1 7s2",4,1944,0,13.51],["Bk","Berkelium","247",null,1.3,601,1323,null,"[Rn] 5f9 7s2",4,1949,0,14.78],["Cf","Californium","251",null,1.3,608,1173,null,"[Rn] 5f10 7s2",4,1950,0,15.1],["Es","Einsteinium","252",null,1.3,619,1133,null,"[Rn] 5f11 7s2",4,1952,0,null],["Fm","Fermium","257",null,1.3,627,1800,null,"[Rn] 5f12 7s2",4,1952,-1,null],["Md","Mendelevium","258",null,1.3,635,1100,null,"[Rn] 5f13 7s2",4,1955,-1,null],["No","Nobelium","259",null,1.3,642,1100,null,"[Rn] 5f14 7s2",4,1957,-1,null],["Lr","Lawrencium","262",null,1.3,null,1900,null,"[Rn] 5f14 7s2 7p1",4,1961,-1,null],["Rf","Rutherfordium","267",null,null,null,null,null,"[Rn] 5f14 6d2 7s2",2,1969,-1,null],["Db","Dubnium","268",null,null,null,null,null,"[Rn] 5f14 6d3 7s2",2,1967,-1,null],["Sg","Seaborgium","271",null,null,null,null,null,"[Rn] 5f14 6d4 7s2",2,1974,-1,null],["Bh","Bohrium","272",null,null,null,null,null,"[Rn] 5f14 6d5 7s2",2,1976,-1,null],["Hs","Hassium","270",null,null,null,null,null,"[Rn] 5f14 6d6 7s2",2,1984,-1,null],["Mt","Meitnerium","276",null,null,null,null,null,"[Rn] 5f14 6d7 7s2",2,1982,-1,null],["Ds","Darmstadtium","281",null,null,null,null,null,"[Rn] 5f14 6d9 7s1",2,1994,-1,null],["Rg","Roentgenium","280",null,null,null,null,null,"[Rn] 5f14 6d10 7s1",2,1994,-1,null],["Cn","Copernicium","285",null,null,null,null,null,"[Rn] 5f14 6d10 7s2",2,1996,-1,null],["Nh","Nihonium","284",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p1",9,2003,-1,null],["Fl","Flerovium","289",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p2",9,1998,-1,null],["Mc","Moscovium","288",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p3",9,2003,-1,null],["Lv","Livermorium","293",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p4",9,2000,-1,null],["Ts","Tennessine","294",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p5",9,2010,-1,null],["Og","Oganesson","294",null,null,null,null,null,"[Rn] 5f14 6d10 7s2 7p6",8,2002,-1,null]]');

const CAT_NAMES = ['碱金属', '碱土金属', '过渡金属', '镧系', '锕系', '类金属', '非金属', '卤素', '稀有气体', '其他金属'];
const CAT_COLORS = ['#e0684b', '#e59b3c', '#4a90c4', '#8e6fc8', '#c25e93', '#3aa88f', '#58b558', '#c9a53a', '#5f63c9', '#7d8794'];
const STATE_NAMES = ['固态', '液态', '气态', '未知'];
const STATE_COLORS = ['#4a90c4', '#3aa88f', '#e59b3c', '#7d8794'];
const FONT = '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
const METAL_CAT = new Set([0, 1, 2, 3, 4, 9]); // 白炽发光的金属族

// 电子排布字符串 → Bohr 电子层分布（按主量子数 n 求和，稀有气体芯展开）
const CORE = { He: [2], Ne: [2, 8], Ar: [2, 8, 8], Kr: [2, 8, 18, 8], Xe: [2, 8, 18, 18, 8], Rn: [2, 8, 18, 32, 18, 8] };
function parseShells(conf) {
  const out = [];
  const m = conf.match(/\[(\w+)\]/);
  if (m && CORE[m[1]]) CORE[m[1]].forEach((c, i) => { out[i] = c; });
  conf.replace(/(\d)([spdf])(\d+)/g, (_, n, l, cnt) => {
    const i = +n - 1;
    out[i] = (out[i] || 0) + +cnt;
    return '';
  });
  return out;
}
const SHELLS = ELS.map((d) => parseShells(d[8]));

/* ---------------- 位置映射 ---------------- */

// 长式周期表（18 列）：返回 [行, 列]；镧系行 8.6 / 锕系行 9.7（下方独立两行）
function gridRowCol(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z === 55) return [6, 1];
  if (z === 56) return [6, 2];
  if (z <= 71) return [8.6, z - 54];   // La..Lu → 第 3..17 列
  if (z <= 86) return [6, z - 68];     // Hf..Rn → 第 4..18 列
  if (z === 87) return [7, 1];
  if (z === 88) return [7, 2];
  if (z <= 103) return [9.7, z - 86];  // Ac..Lr → 第 3..17 列
  return [7, z - 100];                 // Rf..Og → 第 4..18 列
}
function periodOf(z) {
  const r = gridRowCol(z)[0];
  if (r === 8.6) return 6;
  if (r === 9.7) return 7;
  return r;
}
const GROUP_LABELS = ['ⅠA', 'ⅡA', 'ⅢB', 'ⅣB', 'ⅤB', 'ⅥB', 'ⅦB', 'Ⅷ族', 'Ⅷ族', 'Ⅷ族', 'ⅠB', 'ⅡB', 'ⅢA', 'ⅣA', 'ⅤA', 'ⅥA', 'ⅦA', '0族'];
function groupLabel(z) {
  const rc = gridRowCol(z);
  if (rc[0] === 8.6) return '镧系';
  if (rc[0] === 9.7) return '锕系';
  return GROUP_LABELS[rc[1] - 1];
}

const CELL_S = 1.02, ROW_S = 1.08;
const Z_ROW0 = -3.7; // 第 1 周期的台面 z 原点（展台中心略靠后，给前方道具留台面）
function gridPos(z) {
  const [r, c] = gridRowCol(z);
  return new THREE.Vector3((c - 9.5) * CELL_S, 0, (r - 1) * ROW_S + Z_ROW0);
}
// 三维螺旋：等弧长阿基米德螺线，按原子序数上升
function spiralPos(z) {
  const i = z - 1, S = 8.43;
  const ang = Math.sqrt(i * S);
  const rad = 0.274 * ang + 0.55;
  return new THREE.Vector3(Math.cos(ang) * rad, (i / 117) * 5.6 + 0.15, Math.sin(ang) * rad);
}
// 同心环：每周期一圈，镧系/锕系单独两小环（略升高避免穿插）
function ringMeta(ring) {
  if (ring === 10) return { rad: 3.1, y: 0.55 };
  if (ring === 11) return { rad: 3.9, y: 1.1 };
  return { rad: 1.7 + ring * 0.82, y: (ring - 1) * 0.16 };
}
const RING_OF = [];
{
  const counters = {};
  for (let z = 1; z <= 118; z++) {
    let ring;
    if (z >= 57 && z <= 71) ring = 10;
    else if (z >= 89 && z <= 103) ring = 11;
    else ring = gridRowCol(z)[0];
    RING_OF[z] = [ring, counters[ring] || 0];
    counters[ring] = (counters[ring] || 0) + 1;
  }
}
const RING_COUNT = { 1: 2, 2: 8, 3: 8, 4: 18, 5: 18, 6: 17, 7: 17, 10: 15, 11: 15 };
function ringsPos(z) {
  const [ring, idx] = RING_OF[z];
  const meta = ringMeta(ring);
  const ang = -Math.PI / 2 + (idx / RING_COUNT[ring]) * TAU;
  return new THREE.Vector3(Math.cos(ang) * meta.rad, meta.y, Math.sin(ang) * meta.rad);
}
const POS = { grid: [], spiral: [], rings: [] };
for (let z = 1; z <= 118; z++) {
  POS.grid.push(gridPos(z));
  POS.spiral.push(spiralPos(z));
  POS.rings.push(ringsPos(z));
}

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺设元素周期表…');

const HOME = { pos: [0, 14.8, 24], tgt: [0, 0.1, 0.6] };
const app = createApp({
  container: stage,
  fov: 50, near: 0.1, far: 400,
  cameraPos: HOME.pos,
  target: HOME.tgt,
  minDistance: 4, maxDistance: 46,
  keepBackground: true,
});
const vfx = attachVFX(app, 'illus');
const { scene, camera, controls } = app;
scene.environment = makeStudioEnvironment(app.renderer);

// 主暖光 + 冷补光 + 前沿反弹光 + 半球环境；白炽暖点光默认熄灭（升温章点亮）
scene.add(new THREE.HemisphereLight(0xcdd6e0, 0x2c2418, 0.85));
const keyLight = new THREE.DirectionalLight(0xfff0dc, 1.55);
keyLight.position.set(6, 14, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x91a3c0, 0.5);
fillLight.position.set(-8, 6, -6);
scene.add(fillLight);
const bounceLight = new THREE.DirectionalLight(0xe8b98a, 0.28);
bounceLight.position.set(0, 1.5, 11);
scene.add(bounceLight);
const emberLight = new THREE.PointLight(0xff9440, 0, 34, 2);
emberLight.position.set(0, 3.2, 0);
scene.add(emberLight);

const world = new THREE.Group();
scene.add(world);

/* ---------------- 程序化纹理工厂 ---------------- */

const rnd = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

function makeShadowTexture() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(5,8,12,0.52)');
  g.addColorStop(0.55, 'rgba(5,8,12,0.26)');
  g.addColorStop(1, 'rgba(5,8,12,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const shadowTex = makeShadowTexture();
function makeContactShadow(w, l, opacity = 0.9) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, l),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

// 发光点精灵（同族连线端点 / Bohr 核心光晕共用）
function makeGlowSprite(color) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.28, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 台面雕刻纹理：暗色石面 + 逐格接触阴影 + 周期/族标尺刻线 + 正面饰线
function makePlatformTexture() {
  const S = 1024, C = S / 2;
  const px = (gx, gz) => [C + (gx / 19.6) * S, C - (gz / -12.6) * S];
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const rg = ctx.createRadialGradient(C, C, S * 0.1, C, C, S * 0.62);
  rg.addColorStop(0, '#2e3a46');
  rg.addColorStop(0.7, '#26313c');
  rg.addColorStop(1, '#1a232d');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, S, S);
  // 拉丝纹（横向细线）
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * S;
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.006 + 0.01 * Math.random()).toFixed(3) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S, y + (Math.random() - 0.5) * 6); ctx.stroke();
  }
  // 逐格接触阴影
  for (let z = 1; z <= 118; z++) {
    const p = POS.grid[z - 1];
    const [x, y] = px(p.x, p.z);
    const g = ctx.createRadialGradient(x, y, 2, x, y, S * 0.026);
    g.addColorStop(0, 'rgba(0,0,0,0.42)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, S * 0.026, 0, TAU); ctx.fill();
  }
  // 周期标尺（左侧 1..7 + 镧系/锕系）
  ctx.textAlign = 'center';
  for (let r = 1; r <= 7; r++) {
    const [x, y] = px(-9.9, (r - 1) * ROW_S + Z_ROW0);
    ctx.fillStyle = 'rgba(173,196,216,0.5)';
    ctx.font = '600 17px ' + FONT;
    ctx.fillText(String(r), x - 4, y + 5);
    ctx.strokeStyle = 'rgba(173,196,216,0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 16, y); ctx.stroke();
  }
  ['镧系', '锕系'].forEach((t, i) => {
    const [x, y] = px(-9.9, (i === 0 ? 7.6 : 8.7) * ROW_S + Z_ROW0);
    ctx.fillStyle = 'rgba(173,196,216,0.44)';
    ctx.font = '500 13px ' + FONT;
    ctx.fillText(t, x - 2, y + 4);
  });
  // 族标尺（顶部 ⅠA..0族）
  GROUP_LABELS.forEach((t, i) => {
    const [x, y] = px((i + 1 - 9.5) * CELL_S, Z_ROW0 - 0.95);
    ctx.fillStyle = 'rgba(173,196,216,0.5)';
    ctx.font = '600 14px ' + FONT;
    ctx.fillText(t, x, y - 4);
    ctx.strokeStyle = 'rgba(173,196,216,0.22)';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 7); ctx.stroke();
  });
  // 四角螺孔装饰
  [[-9.3, 5.3], [9.3, 5.3], [-9.3, -5.2], [9.3, -5.2]].forEach(([gx, gz]) => {
    const [x, y] = px(gx, gz);
    ctx.strokeStyle = 'rgba(160,180,200,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 10, 0.3, 1.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 10, Math.PI + 0.3, Math.PI + 1.6); ctx.stroke();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// 展台正面铭牌
function makePlaqueTexture() {
  const tex = makeLabelTexture(['元素周期表', 'PERIODIC TABLE OF ELEMENTS · 1869—2016'], { w: 512, h: 128, accent: '#d8c088', paper: '#1c2530', lineSizes: [44, 15] });
  return tex;
}

// 温度计刻度筒：竖向刻线 + 关键温度标注（77/298/1811/3695 K）
function makeThermoTexture() {
  const W = 128, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#dfe7ee';
  ctx.fillRect(0, 0, W, H);
  const marks = [[3695, '钨熔点'], [1811, '铁熔点'], [298, '室温'], [77, '液氮'], [10, '10 K']];
  const yOf = (k) => H - 26 - (clamp(k, 0, 4200) / 4200) * (H - 60);
  ctx.strokeStyle = 'rgba(60,74,88,0.85)';
  ctx.fillStyle = 'rgba(45,58,72,0.95)';
  ctx.textAlign = 'left';
  marks.forEach(([k, label]) => {
    const y = yOf(k);
    ctx.lineWidth = k === 298 ? 2.2 : 1.3;
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(40, y); ctx.stroke();
    ctx.font = (k === 298 ? '600 ' : '500 ') + '13px ' + FONT;
    ctx.fillText(label, 44, y - 3);
    ctx.font = '400 11px ' + FONT;
    ctx.fillText(k + ' K', 44, y + 10);
  });
  for (let k = 0; k <= 4200; k += 300) {
    const y = yOf(k);
    ctx.strokeStyle = 'rgba(60,74,88,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(24, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 门捷列夫手稿卡：做旧纸面 + 手写感周期表片段（含问号空位）
function makeCardTexture() {
  const W = 320, H = 224;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#e9dfc4');
  g.addColorStop(0.55, '#e2d5b4');
  g.addColorStop(1, '#d9c9a2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 咖啡渍斑点
  const rr = rnd(20231104);
  for (let i = 0; i < 7; i++) {
    const x = rr() * W, y = rr() * H, r0 = 4 + rr() * 16;
    const st = ctx.createRadialGradient(x, y, 1, x, y, r0);
    st.addColorStop(0, 'rgba(122,92,50,' + (0.05 + rr() * 0.09).toFixed(3) + ')');
    st.addColorStop(1, 'rgba(122,92,50,0)');
    ctx.fillStyle = st;
    ctx.beginPath(); ctx.arc(x, y, r0, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(92,64,28,0.55)';
  ctx.strokeRect(7, 7, W - 14, H - 14);
  ctx.fillStyle = 'rgba(70,48,20,0.85)';
  ctx.font = '700 20px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText('1869 · 手稿片段', 16, 30);
  // 小周期表：两行主族 + 问号空位
  const rows = [
    ['H', '?', '', '', '', '', '', '', 'He'],
    ['Li', 'Be', '?', 'B', 'C', 'N', 'O', 'F', '?'],
    ['Na', 'Mg', '?', 'Al', 'Si', 'P', 'S', 'Cl', '?'],
  ];
  const cw = 32, ch = 34, x0 = 18, y0 = 44;
  rows.forEach((row, ri) => {
    row.forEach((t, ci) => {
      const x = x0 + ci * cw, y = y0 + ri * ch;
      if (t === '') return;
      ctx.strokeStyle = t === '?' ? 'rgba(160,40,30,0.85)' : 'rgba(92,64,28,0.6)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, cw - 5, ch - 8);
      ctx.fillStyle = t === '?' ? 'rgba(160,40,30,0.95)' : 'rgba(70,48,20,0.9)';
      ctx.font = '600 15px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(t, x + (cw - 5) / 2, y + ch / 2 - 4);
    });
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(70,48,20,0.65)';
  ctx.font = 'italic 500 13px ' + FONT;
  ctx.fillText('问号 = 预言的空位', x0, y0 + 3 * ch + 12);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 瓶签（试剂名 + 元素符号角标）
function makeVialLabel(name, sub) {
  return makeLabelTexture([name, sub], { w: 256, h: 140, accent: '#20565e', lineSizes: [30, 14] });
}

/* ---------------- 元素格：贴图集顶板 + 实例化柱身 ---------------- */

const FLAT_H = 0.34;
const SLAB_T = 0.06;          // 顶板厚度
const HOVER_LIFT = 0.085;     // 悬停抬起量

// —— 贴图集：2 张 2048²，每张 8×8 格（每格 256²）——
const AT_CELL = 256, AT_COLS = 8, AT_W = 2048;
const atlases = [];
for (let i = 0; i < 2; i++) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = AT_W;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  atlases.push({ cv, ctx: cv.getContext('2d'), tex });
}
function atlasOf(z) { return Math.floor((z - 1) / (AT_COLS * AT_COLS)); }
function regionOf(z) {
  const k = (z - 1) % (AT_COLS * AT_COLS);
  return { idx: atlasOf(z), x: (k % AT_COLS) * AT_CELL, y: Math.floor(k / AT_COLS) * AT_CELL };
}

// —— 顶面取值/配色（数据驱动，画进贴图集）——
const st = {
  mode: 'grid',
  barProp: null,        // null=平铺 / number / radius / eneg / ie / mp / density
  faceMode: 'mass',     // 顶面数值行：mass / radius / eneg / ie / mp / year / state
  colorMode: 'cat',     // cat / eneg / state
  hover: -1, selected: -1,
  bohrZ: 11, spin: true, shellsMarker: true,
  iePeriod: 2, ieProp: 'ie',
  temp: 298, tempMode: false, tempPlaying: false, tempSlider: null, hudTemp: null, gasList: [],
  year: 1650, yearPlaying: false, yearSpeed: 1, yearSlider: null, hudYear: null,
  legendOn: false, trendOn: false, catHighlight: -1,
  morphSpeed: 1,
  beamGroup: 0,
  flashes: [],
};

function enegColor(v) { return `hsl(${Math.round(215 - (v / 3.98) * 215)}, 62%, 46%)`; }
function catIdx(z) { const c = ELS[z - 1][9]; return c == null ? 9 : c; } // null 分类归入「其他金属」
function faceBgHex(z) {
  const d = ELS[z - 1];
  if (st.colorMode === 'cat') return CAT_COLORS[catIdx(z)];
  if (st.colorMode === 'eneg') return d[4] == null ? '#6f7680' : enegColor(d[4]);
  return STATE_COLORS[d[11] + 1];
}
function faceValueText(z) {
  const d = ELS[z - 1];
  switch (st.faceMode) {
    case 'radius': return d[3] == null ? '—' : d[3] + ' pm';
    case 'eneg': return d[4] == null ? '—' : d[4].toFixed(2);
    case 'ie': return d[5] == null ? '—' : String(d[5]);
    case 'mp': return d[6] == null ? '—' : d[6] + ' K';
    case 'density': return d[12] == null ? '—' : d[12] + ' g/cm³';
    case 'year': return d[10] === 0 ? '古代' : String(d[10]);
    case 'state': return STATE_NAMES[d[11] + 1];
    default: return d[2];
  }
}
// 单格绘制：渐变底 + 双层描边 + 角标类别点 + 序数/符号/中文名/数值
function paintCell(z) {
  const reg = regionOf(z);
  const ctx = atlases[reg.idx].ctx;
  const d = ELS[z - 1];
  ctx.save();
  ctx.translate(reg.x, reg.y);
  const bg = faceBgHex(z);
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, shadeHex(bg, 1.18));
  grad.addColorStop(0.55, bg);
  grad.addColorStop(1, shadeHex(bg, 0.82));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, AT_CELL, AT_CELL);
  ctx.strokeStyle = 'rgba(0,0,0,0.32)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(9, 9, 238, 238);
  // 类别角标点（着色不是族时保留族识别）
  if (st.colorMode !== 'cat') {
    ctx.fillStyle = CAT_COLORS[catIdx(z)];
    ctx.beginPath();
    ctx.arc(232, 24, 6.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.93)';
  ctx.font = '600 46px ' + FONT;
  ctx.fillText(String(z), 13, 48);
  ctx.textAlign = 'center';
  ctx.font = '700 92px ' + FONT;
  ctx.fillText(d[0], 128, 122);
  ctx.font = '500 40px ' + FONT;
  ctx.fillText(CN[z - 1], 128, 178);
  ctx.font = '400 27px ' + FONT;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(faceValueText(z), 128, 224);
  ctx.restore();
  atlases[reg.idx].tex.needsUpdate = true;
}
function shadeHex(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => clamp(Math.round(v * f), 0, 255);
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
function paintAll() { for (let z = 1; z <= 118; z++) paintCell(z); }

// —— 顶板合并几何：每格 = 顶面四边形 + 四条侧裙；顶点色控制亮度/残影 ——
const slabMeshes = [];
const slabCellInfo = [];   // [z-1] = {mesh, vStart, triStart}
const slabTriZ = [];       // [meshIndex][triIndex] = z
function buildTopSlabs() {
  const tmpV = [], tmpUv = [], tmpIdx = [], tmpCol = [], tmpNor = [];
  for (let a = 0; a < 2; a++) { tmpV[a] = []; tmpUv[a] = []; tmpIdx[a] = []; tmpCol[a] = []; tmpNor[a] = []; slabTriZ[a] = []; }
  const half = 0.46;
  const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
  const UVI = 3; // 贴图内缩，防 mipmap 渗色
  // 侧裙法线（按边序：北 -z / 东 +x / 南 +z / 西 -x）——缺 normal attribute 会让 lit 材质
  // 在 normalize(0) 处产生 NaN 写进 HalfFloat RT，UnrealBloom 读到 NaN 后整帧输出黑
  const SIDE_N = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]];
  for (let z = 1; z <= 118; z++) {
    const reg = regionOf(z);
    const a = reg.idx;
    const vStart = tmpV[a].length / 3;
    const u0 = (reg.x + UVI) / AT_W, u1 = (reg.x + AT_CELL - UVI) / AT_W;
    const v1 = 1 - (reg.y + UVI) / AT_W, v0 = 1 - (reg.y + AT_CELL - UVI) / AT_W;
    const triStart = slabTriZ[a].length;
    slabCellInfo[z - 1] = { mesh: a, vStart, triStart };
    // 每格布局位置必须烘进顶点（118 格叠原点会让 bloom 炸成黑屏；morph 时由 updateSlabXZ 重写）
    const gp = POS.grid[z - 1];
    const px = gp.x, pz = gp.z;
    // 顶面 4 点（yOff=0，法线朝上）
    corners.forEach(([x, zz], ci) => {
      tmpV[a].push(px + x, 0, pz + zz);
      tmpUv[a].push(ci === 0 || ci === 3 ? u0 : u1, ci === 0 || ci === 1 ? v1 : v0);
      tmpCol[a].push(1, 1, 1);
      tmpNor[a].push(0, 1, 0);
    });
    tmpIdx[a].push(vStart, vStart + 2, vStart + 1, vStart, vStart + 3, vStart + 2);
    slabTriZ[a].push(z, z);
    // 四条侧裙（上沿用顶面角，下沿 yOff=-SLAB_T，UV 取贴图底缘细条）
    const sv = vStart + 4;
    const uvSliverV0 = 1 - (reg.y + AT_CELL - 2) / AT_W, uvSliverV1 = 1 - (reg.y + AT_CELL - UVI) / AT_W;
    for (let e = 0; e < 4; e++) {
      const c1 = corners[e], c2 = corners[(e + 1) % 4];
      const b1 = vStart + e, b2 = vStart + (e + 1) % 4;
      const base = sv + e * 4;
      const su0 = e === 3 ? u1 : u0, su1 = e === 1 ? u0 : u1;
      const n = SIDE_N[e];
      // 上沿两点（复用位置，独立 UV）
      tmpV[a].push(px + c1[0], 0, pz + c1[1]); tmpUv[a].push(su0, uvSliverV1); tmpCol[a].push(1, 1, 1); tmpNor[a].push(n[0], n[1], n[2]);
      tmpV[a].push(px + c2[0], 0, pz + c2[1]); tmpUv[a].push(su1, uvSliverV1); tmpCol[a].push(1, 1, 1); tmpNor[a].push(n[0], n[1], n[2]);
      // 下沿两点
      tmpV[a].push(px + c1[0], -SLAB_T, pz + c1[1]); tmpUv[a].push(su0, uvSliverV0); tmpCol[a].push(1, 1, 1); tmpNor[a].push(n[0], n[1], n[2]);
      tmpV[a].push(px + c2[0], -SLAB_T, pz + c2[1]); tmpUv[a].push(su1, uvSliverV0); tmpCol[a].push(1, 1, 1); tmpNor[a].push(n[0], n[1], n[2]);
      tmpIdx[a].push(base, base + 1, base + 3, base, base + 3, base + 2);
      slabTriZ[a].push(z, z);
    }
  }
  for (let a = 0; a < 2; a++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tmpV[a]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(tmpUv[a]), 2));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(tmpCol[a]), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(tmpNor[a]), 3));
    geo.setIndex(tmpIdx[a]);
    const mat = new THREE.MeshPhysicalMaterial({
      map: atlases[a].tex, vertexColors: true,
      roughness: 0.4, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.42,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    slabMeshes.push(mesh);
    world.add(mesh);
  }
}
// 每格顶点 yOff 表（顶面 0，侧裙下沿 -SLAB_T）
const slabYOff = (() => {
  // 每格 20 顶点：0-3 顶面；4-19 为四条侧裙（每条 4 顶点 [上沿1,上沿2,下沿1,下沿2]）
  const arr = [0, 0, 0, 0];
  for (let e = 0; e < 4; e++) arr.push(0, 0, -SLAB_T, -SLAB_T);
  return arr;
})();
function updateSlabHeight(z, h) {
  const info = slabCellInfo[z - 1];
  const attr = slabMeshes[info.mesh].geometry.attributes.position;
  const base = info.vStart;
  for (let v = 0; v < 20; v++) attr.array[(base + v) * 3 + 1] = h + slabYOff[v];
  attr.needsUpdate = true;
}

// 布局变形：把每格顶点 x/z 写到插值位置（顶点 20 个的角点序：顶面 0-3，侧裙 4-19 每条 [c1,c2,c1,c2]）
const slabCornerIdx = [0, 1, 2, 3, 0, 1, 0, 1, 1, 2, 1, 2, 2, 3, 2, 3, 3, 0, 3, 0];
const slabCorners = [[-0.46, -0.46], [0.46, -0.46], [0.46, 0.46], [-0.46, 0.46]];
function updateSlabXZ(z, x, zpos) {
  const info = slabCellInfo[z - 1];
  const attr = slabMeshes[info.mesh].geometry.attributes.position;
  const base = info.vStart;
  for (let v = 0; v < 20; v++) {
    const c = slabCorners[slabCornerIdx[v]];
    attr.array[(base + v) * 3] = x + c[0];
    attr.array[(base + v) * 3 + 2] = zpos + c[1];
  }
  attr.needsUpdate = true;
}
function setSlabTint(z, r, g, b) {
  const info = slabCellInfo[z - 1];
  const attr = slabMeshes[info.mesh].geometry.attributes.color;
  const base = info.vStart;
  for (let v = 0; v < 20; v++) {
    attr.array[(base + v) * 3] = r;
    attr.array[(base + v) * 3 + 1] = g;
    attr.array[(base + v) * 3 + 2] = b;
  }
  attr.needsUpdate = true;
}

// —— 柱身实例化：固/液/气三分桶（液=透明高光、气=线框）+ 白炽叠加层 ——
const bodyGeo = new THREE.BoxGeometry(0.92, 1, 0.92);
bodyGeo.translate(0, 0.5, 0);
const bodySolid = new THREE.InstancedMesh(bodyGeo, matStd(0xffffff, { roughness: 0.5, metalness: 0.16 }), 118);
const bodyLiquid = new THREE.InstancedMesh(bodyGeo, matStd(0xffffff, { roughness: 0.14, metalness: 0.42, opacity: 0.72, transparent: true }), 118);
const bodyGas = new THREE.InstancedMesh(bodyGeo, matStd(0xffffff, { roughness: 0.5, metalness: 0.1, wireframe: true }), 118);
const emberGeo = new THREE.BoxGeometry(0.86, 1, 0.86);
emberGeo.translate(0, 0.5, 0);
const bodyEmber = new THREE.InstancedMesh(
  emberGeo,
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
  118
);
const _instZero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001); // 未赋阵实例折叠为点：防 identity 盒叠在原点（曾致加色叠加炸 bloom 成黑屏）
for (const im of [bodySolid, bodyLiquid, bodyGas, bodyEmber]) {
  im.frustumCulled = false;
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < 118; i++) { im.setColorAt(i, new THREE.Color(1, 1, 1)); im.setMatrixAt(i, _instZero); }
  im.instanceMatrix.needsUpdate = true;
  world.add(im);
}
bodyEmber.renderOrder = 2;
// 桶分配：bucketOf(z) = 0 固 / 1 液 / 2 气；非温度章全部 0
const bucketOf = new Int8Array(118);
const instToZ = [[], [], []]; // 桶 → 实例序号对应 z（拾取用）
const _m4 = new THREE.Matrix4();
const _m4b = new THREE.Matrix4();
const _q0 = new THREE.Quaternion();
const _v3 = new THREE.Vector3();
const _s3 = new THREE.Vector3();

// 每格当前状态
const heights = new Float32Array(118).fill(FLAT_H);
const brightness = new Float32Array(118).fill(1);
const ghosted = new Uint8Array(118);
const curPos = [];            // 当前布局位置（变形动画写入）
for (let z = 1; z <= 118; z++) curPos.push(POS.grid[z - 1].clone());
const GHOST_SLAB = new THREE.Color(0.13, 0.14, 0.16);

function bucketMatrix(z, out) {
  const p = curPos[z - 1];
  const lift = st.hover === z ? HOVER_LIFT : 0;
  out.makeScale(1, Math.max(0.02, heights[z - 1]), 1);
  out.premultiply(_m4.makeTranslation(p.x, lift, p.z));
  return out;
}
function updateBodyBucket(z) {
  const b = bucketOf[z - 1];
  const list = [bodySolid, bodyLiquid, bodyGas][b];
  const i = instToZ[b].indexOf(z);
  if (i < 0) return;
  list.setMatrixAt(i, bucketMatrix(z, _m4b));
  const c = cellsBaseColor[z - 1].clone().multiplyScalar(brightness[z - 1] * (ghosted[z - 1] ? 0.24 : 1));
  if (b === 2) c.lerp(new THREE.Color(1, 1, 1), 0.22);
  if (ghosted[z - 1]) c.set(0x1d232b);
  list.setColorAt(i, c);
  list.instanceMatrix.needsUpdate = true;
  if (list.instanceColor) list.instanceColor.needsUpdate = true;
}
function bucketAssign(mode) {
  // mode=null → 全部固桶；否则按 stateAt 分桶
  instToZ[0] = []; instToZ[1] = []; instToZ[2] = [];
  for (let z = 1; z <= 118; z++) {
    const b = mode ? { solid: 0, liquid: 1, gas: 2, unknown: 0 }[stateAt(z, st.temp)] : 0;
    bucketOf[z - 1] = b;
    instToZ[b].push(z);
  }
  [bodySolid, bodyLiquid, bodyGas].forEach((im, b) => {
    im.count = instToZ[b].length;
    instToZ[b].forEach((z, i) => im.setColorAt(i, new THREE.Color(1, 1, 1)));
  });
  refreshAllBodies();
}
function refreshAllBodies() {
  for (let b = 0; b < 3; b++) {
    const im = [bodySolid, bodyLiquid, bodyGas][b];
    instToZ[b].forEach((z, i) => {
      im.setMatrixAt(i, bucketMatrix(z, new THREE.Matrix4()));
      const c = cellsBaseColor[z - 1].clone().multiplyScalar(brightness[z - 1]);
      if (ghosted[z - 1]) c.set(0x1d232b).multiplyScalar(0.55);
      else if (st.tempMode && stateAt(z, st.temp) === 'unknown') c.set(0x6f7680);
      if (b === 2 && !ghosted[z - 1]) c.lerp(new THREE.Color(1, 1, 1), 0.22);
      im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
}
function setCellHeight(z, h, skipSlab) {
  heights[z - 1] = h;
  updateBodyBucket(z);
  if (!skipSlab) updateSlabHeight(z, h + (st.hover === z ? HOVER_LIFT : 0));
}
function applyBright(pred) {
  for (let z = 1; z <= 118; z++) brightness[z - 1] = pred(z) ? 1 : 0.3;
  refreshAllBodies();
  for (let z = 1; z <= 118; z++) {
    const k = brightness[z - 1] * (ghosted[z - 1] ? 0.24 : 1);
    setSlabTint(z, k, k, k);
  }
}
function setGhost(z, on) {
  ghosted[z - 1] = on ? 1 : 0;
  if (on) setCellHeight(z, 0.05, true);
  else if (heights[z - 1] <= 0.06) setCellHeight(z, FLAT_H, true);
  updateSlabHeight(z, heights[z - 1]);
  const k = on ? 0.15 : brightness[z - 1];
  setSlabTint(z, k, k * 1.04, k * 1.12);
  updateBodyBucket(z);
}

// —— 悬停 / 选中描框（两个独立 LineSegments，随 hover/selected 移动）——
const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.96, 1, 0.96));
frameGeo.translate(0, 0.5, 0);
const hoverFrame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
const selectFrame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.95 }));
for (const f of [hoverFrame, selectFrame]) { f.visible = false; world.add(f); }
function syncFrames() {
  const place = (f, z) => {
    if (z < 1 || ghosted[z - 1]) { f.visible = false; return; }
    f.visible = true;
    const p = curPos[z - 1];
    f.position.set(p.x, st.hover === z ? HOVER_LIFT : 0, p.z);
    f.scale.set(1, heights[z - 1], 1);
  };
  place(hoverFrame, st.hover);
  place(selectFrame, st.selected);
}

// —— 发现闪光池（复用 6 张加色面片）——
const flashPool = [];
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 0.94),
    new THREE.MeshBasicMaterial({ color: 0xfff2cf, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.visible = false;
  m.renderOrder = 3;
  world.add(m);
  flashPool.push(m);
}
let flashCursor = 0;
function spawnFlash(z) {
  const m = flashPool[flashCursor++ % flashPool.length];
  const p = curPos[z - 1];
  m.position.set(p.x, heights[z - 1] + 0.05, p.z);
  m.visible = true;
  m.userData.t0 = performance.now() * 0.001;
}

/* ---------------- Bohr 电子层模型（车削展台 + 核子团簇 + 精饰轨道） ---------------- */

const BOHR_POS = new THREE.Vector3(-11.2, 0, -7.2);
const bohrG = new THREE.Group();
bohrG.position.set(BOHR_POS.x, 5.7, BOHR_POS.z);
bohrG.scale.setScalar(0.72);
bohrG.visible = false;
world.add(bohrG);

// 核子团簇：质子（暖橙）/ 中子（冷灰）双桶实例化，斐波那契球堆积
const nucleonGeo = new THREE.SphereGeometry(0.17, 14, 10);
const nucleonP = new THREE.InstancedMesh(nucleonGeo, matStd(PAL.mitoShell, { roughness: 0.42, metalness: 0.2, emissive: 0x662211, emissiveIntensity: 0.5 }), 60);
const nucleonN = new THREE.InstancedMesh(nucleonGeo, matStd(PAL.steel, { roughness: 0.5, metalness: 0.55 }), 60);
for (const nm of [nucleonP, nucleonN]) { nm.frustumCulled = false; bohrG.add(nm); }
const coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowSprite('rgba(255,190,120,0.5)'), transparent: true, depthWrite: false, opacity: 0.85,
}));
coreHalo.scale.setScalar(2.6);
bohrG.add(coreHalo);

// 轨道环：黄铜细 torus + 淡色导圈（层内电子拖尾弧线随章内自转点亮）
const SHELL_R = Array.from({ length: 7 }, (_, s) => 1.35 + s * 0.62);
const bohrRings = SHELL_R.map((r) => {
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.022, 8, 120),
    matStd(PAL.brass, { metalness: 0.82, roughness: 0.32 })
  );
  torus.rotation.x = Math.PI / 2;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.055, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.rotation.x = Math.PI / 2;
  const g = new THREE.Group();
  g.add(torus, halo);
  bohrG.add(g);
  return g;
});
// 电子 + 每层一条加色拖尾圈
const electronMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.095, 12, 9),
  new THREE.MeshBasicMaterial({ color: 0xeaf4ff }),
  118
);
electronMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
electronMesh.frustumCulled = false;
bohrG.add(electronMesh);
const shellTrail = SHELL_R.map((r) => {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  bohrG.add(line);
  return line;
});
// 层数标注 + 标题铭牌
const shellLabels = SHELL_R.map((r) => {
  const sp = makeTextSprite('0', { fontSize: 38, color: '#d6e6ff', scale: 0.021 });
  sp.position.set(r + 0.42, 0.14, 0);
  bohrG.add(sp);
  return sp;
});
const bohrTitle = makeTextSprite('', { fontSize: 52, color: '#eaf2ff', scale: 0.02 });
bohrTitle.position.set(0, 6.15, 0);
bohrG.add(bohrTitle);

// 展台（车削底座 + 立柱 + 托盘），常驻场景（Bohr 章点亮模型）
const bohrPodium = new THREE.Group();
{
  const baseProf = [
    [1.62, 0.02], [1.55, 0], [1.4, 0.06], [1.3, 0.26], [1.24, 0.5], [1.22, 0.72], [1.18, 0.84], [1.1, 0.92],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const base = new THREE.Mesh(
    new THREE.LatheGeometry(baseProf, 48),
    new THREE.MeshStandardMaterial({ map: makeWoodTexture({ base: '#4e3520', dark: '#36240f', light: '#66492a', streaks: 30, bands: 3, seed: 41 }), roughness: 0.55 })
  );
  bohrPodium.add(base);
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 3.6, 24),
    matStd(PAL.brass, { metalness: 0.82, roughness: 0.34 })
  );
  column.position.y = 0.92 + 1.8;
  bohrPodium.add(column);
  for (const [y, r] of [[1.24, 0.19], [4.28, 0.19]]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 40), matStd(PAL.brass, { metalness: 0.85, roughness: 0.3 }));
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y;
    bohrPodium.add(collar);
  }
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.1, 32), matStd(0x1a232d, { roughness: 0.42, metalness: 0.4 }));
  tray.position.y = 4.62;
  bohrPodium.add(tray);
  const psh = makeContactShadow(4.6, 4.6, 0.8);
  psh.position.y = 0.02;
  bohrPodium.add(psh);
  bohrPodium.position.set(BOHR_POS.x, 0, BOHR_POS.z);
  world.add(bohrPodium);
}

function updateBohr(z) {
  st.bohrZ = z;
  const d = ELS[z - 1];
  const shells = SHELLS[z - 1];
  const nucleons = Math.min(60, Math.max(1, Math.round(z * 1.15)));
  const nP = Math.ceil(nucleons / 2), nN = nucleons - nP;
  const R = 0.34 + Math.pow(z, 0.33) * 0.1;
  let ip = 0, iN = 0;
  for (let i = 0; i < nucleons; i++) {
    // 斐波那契球堆积
    const k = i + 0.5, phi = Math.acos(1 - 2 * k / nucleons), theta = Math.PI * (1 + Math.sqrt(5)) * k;
    const x = Math.sin(phi) * Math.cos(theta) * R, y = Math.cos(phi) * R, zz = Math.sin(phi) * Math.sin(theta) * R;
    _m4.makeTranslation(x, y, zz);
    if (i % 2 === 0) nucleonP.setMatrixAt(ip++, _m4);
    else nucleonN.setMatrixAt(iN++, _m4);
  }
  _m4.makeScale(0.0001, 0.0001, 0.0001);
  while (ip < 60) nucleonP.setMatrixAt(ip++, _m4);
  while (iN < 60) nucleonN.setMatrixAt(iN++, _m4);
  nucleonP.instanceMatrix.needsUpdate = true;
  nucleonN.instanceMatrix.needsUpdate = true;
  bohrRings.forEach((ring, s) => { ring.visible = s < shells.length; });
  shellTrail.forEach((line, s) => { line.visible = s < shells.length && st.shellsMarker; });
  shellLabels.forEach((sp, s) => {
    const on = s < shells.length && st.shellsMarker;
    sp.visible = on;
    if (s < shells.length) setSpriteText(sp, String(shells[s]), { fontSize: 38, color: '#d6e6ff', scale: 0.021 });
  });
  setSpriteText(bohrTitle, `${d[0]} · ${CN[z - 1]}`, { fontSize: 52, color: '#eaf2ff', scale: 0.02 });
  if (st.hudBohr) {
    st.hudBohr.set('elem', `${CN[z - 1]} ${d[0]}（${z} 号）`);
    st.hudBohr.set('shell', `${shells.join('·')}（${shells.length} 层）· 第${periodOf(z)}周期 ${groupLabel(z)}`);
  }
}

/* ---------------- 实验台 + 展台 + 道具 ---------------- */

const BENCH_TOP = -0.24;
function buildBench() {
  const g = new THREE.Group();
  // 台面（木纹 + 前缘倒角条）
  const wood = makeWoodTexture({ base: '#4a3620', dark: '#332414', light: '#5f4830', streaks: 90, bands: 7, planks: 6, seed: 31 });
  wood.repeat.set(6, 4);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(27.6, 0.28, 17.6),
    new THREE.MeshStandardMaterial({ map: wood, roughness: 0.68, metalness: 0.03 })
  );
  top.position.set(0, BENCH_TOP - 0.14, -0.3);
  g.add(top);
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(27.2, 0.1, 17.2),
    new THREE.MeshStandardMaterial({ map: (() => { const t = makeWoodTexture({ base: '#38281a', dark: '#261a0e', light: '#4d3823', streaks: 60, bands: 4, seed: 57 }); t.repeat.set(8, 1); return t; })(), roughness: 0.7 })
  );
  skirt.position.set(0, BENCH_TOP - 0.3, -0.3);
  g.add(skirt);
  // 四条车削桌腿（鼓形 + 环饰）+ 两根横撑
  const legProf = [
    [0.3, 0], [0.26, 0.1], [0.22, 0.3], [0.3, 0.62], [0.32, 0.8], [0.24, 1.0], [0.2, 1.3], [0.26, 1.62], [0.3, 1.8],
  ].map(([r, y]) => new THREE.Vector2(r * 1.4, y * 1.5));
  const legGeo = new THREE.LatheGeometry(legProf, 20);
  const legMat = new THREE.MeshStandardMaterial({ map: (() => { const t = makeWoodTexture({ base: '#40301f', dark: '#2c2013', light: '#54402a', streaks: 40, bands: 3, seed: 71 }); t.repeat.set(2, 2); return t; })(), roughness: 0.62 });
  [[-12.6, -7.6], [12.6, -7.6], [-12.6, 7.0], [12.6, 7.0]].forEach(([x, zz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, BENCH_TOP - 0.35, zz);
    g.add(leg);
  });
  [[0, -7.6], [0, 7.0]].forEach(([x, zz]) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(24.6, 0.14, 0.24), legMat);
    bar.position.set(x, BENCH_TOP - 2.6, zz);
    g.add(bar);
  });
  world.add(g);
}

const PLAT = { w: 19.8, d: 12.6, cz: -0.3 };
function buildPlatform() {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(PLAT.w, 0.24, PLAT.d),
    matStd(0x1a232d, { roughness: 0.5, metalness: 0.42 })
  );
  slab.position.set(0, -0.12, PLAT.cz);
  g.add(slab);
  // 台面雕刻层（标尺 + 接触阴影 + 拉丝）
  const topTex = makePlatformTexture();
  const topPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(PLAT.w - 0.2, PLAT.d - 0.2),
    new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.52, metalness: 0.3 })
  );
  topPlane.rotation.x = -Math.PI / 2;
  topPlane.position.set(0, 0.005, PLAT.cz);
  g.add(topPlane);
  // 正面铭牌
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.62, 0.06),
    new THREE.MeshStandardMaterial({ map: makePlaqueTexture(), roughness: 0.6, metalness: 0.15 })
  );
  plaque.position.set(-4.4, 0.06, PLAT.cz + PLAT.d / 2 + 0.03);
  plaque.rotation.x = -0.32;
  g.add(plaque);
  // 四角黄铜包角
  [[-PLAT.w / 2 + 0.14, -PLAT.d / 2 + 0.14], [PLAT.w / 2 - 0.14, -PLAT.d / 2 + 0.14],
   [-PLAT.w / 2 + 0.14, PLAT.d / 2 - 0.14], [PLAT.w / 2 - 0.14, PLAT.d / 2 - 0.14]].forEach(([x, zz]) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), matStd(PAL.brass, { metalness: 0.85, roughness: 0.3 }));
    cap.position.set(x, 0.1, PLAT.cz + zz);
    g.add(cap);
  });
  world.add(g);
}

function buildProps() {
  const g = new THREE.Group();
  // —— 试剂瓶架（木质横条 + 四只放样玻璃瓶：钠/铁/汞/硫）——
  const rackX = -11.4, rackZ = 5.6;
  const rackMat = new THREE.MeshStandardMaterial({ map: (() => { const t = makeWoodTexture({ base: '#503823', dark: '#382615', light: '#6a4e30', streaks: 36, bands: 3, seed: 83 }); t.repeat.set(2, 1); return t; })(), roughness: 0.6 });
  const rackBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 1.7), rackMat);
  rackBase.position.set(rackX, BENCH_TOP + 0.11, rackZ);
  g.add(rackBase);
  const rackBack = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.0, 0.18), rackMat);
  rackBack.position.set(rackX, BENCH_TOP + 0.62, rackZ + 0.72);
  g.add(rackBack);
  const vialSpecs = [
    ['金属钠 · Na', '浸于煤油封存', 0xc9d2da, 'solid'],
    ['铁屑 · Fe', 'Fe 55.8', 0x8a94a0, 'solid'],
    ['汞 · Hg', '唯一液态金属', 0xd9e2ea, 'liquid'],
    ['硫粉 · S', 'S 32.1', 0xe8d26a, 'solid'],
  ];
  const glassMat = matCoat(0xdfeef2, { roughness: 0.08, transmission: 0.86, thickness: 0.4, ior: 1.5, opacity: 0.4, side: THREE.DoubleSide });
  const vialGeoProf = [
    [0.17, 0.02], [0.15, 0], [0.14, 0.05], [0.17, 0.2], [0.19, 0.42], [0.185, 0.62], [0.14, 0.74], [0.12, 0.8], [0.15, 0.84], [0.16, 0.88],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const vialGeo = new THREE.LatheGeometry(vialGeoProf, 24);
  const capGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.1, 20);
  const capMat = matStd(PAL.brass, { metalness: 0.8, roughness: 0.34 });
  const liquidMat = matCoat(0xbfd4de, { roughness: 0.15, metalness: 0.05, opacity: 0.82, transparent: true });
  vialSpecs.forEach(([name, sub, col, kind], i) => {
    const x = rackX - 1.72 + i * 1.15;
    const bottle = new THREE.Group();
    const body = new THREE.Mesh(vialGeo, glassMat);
    bottle.add(body);
    if (kind === 'solid') {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.13), matStd(col, { roughness: kind === 'solid' && i === 0 ? 0.85 : 0.4, metalness: i === 1 ? 0.7 : 0.25 }));
      chip.position.y = 0.1;
      chip.rotation.y = 0.6;
      bottle.add(chip);
    } else {
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.3, 20), matStd(0xd4dde4, { roughness: 0.05, metalness: 0.92 }));
      pool.position.y = 0.15;
      bottle.add(pool);
      const gleam = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
      gleam.rotation.x = -Math.PI / 2;
      gleam.position.y = 0.3;
      bottle.add(gleam);
    }
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.92;
    bottle.add(cap);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.22),
      new THREE.MeshStandardMaterial({ map: makeVialLabel(name, sub), roughness: 0.85 })
    );
    label.position.set(0, 0.42, 0.185);
    label.rotation.x = -0.06;
    bottle.add(label);
    bottle.position.set(x, BENCH_TOP + 0.22, rackZ);
    bottle.rotation.y = 0.16;
    g.add(bottle);
    const sh = makeContactShadow(0.9, 0.9, 0.7);
    sh.position.set(x, BENCH_TOP + 0.005, rackZ);
    g.add(sh);
  });
  // —— 立式温度计（刻度筒 + 发光液柱 + 黄铜端帽）——
  const thX = 11.4, thZ = 4.4;
  const th = new THREE.Group();
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 3.4, 20, 1, true),
    matGlass(0xdfeef2, { roughness: 0.1, transmission: 0.9, thickness: 0.3, opacity: 0.34 })
  );
  tube.position.y = 1.7;
  th.add(tube);
  const scale = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.165, 3.0, 20, 1, true, Math.PI * 0.7, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ map: makeThermoTexture(), roughness: 0.6, side: THREE.DoubleSide })
  );
  scale.position.y = 1.72;
  th.add(scale);
  const liquidCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.3, 12),
    matGlow(0xe85540, 1.4)
  );
  liquidCol.position.y = 1.45;
  th.add(liquidCol);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), matGlass(0xdfeef2, { roughness: 0.08, transmission: 0.92, opacity: 0.4 }));
  bulb.position.y = 0.14;
  th.add(bulb);
  const bulbCore = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), matGlow(0xe85540, 1.6));
  bulbCore.position.y = 0.14;
  th.add(bulbCore);
  [[3.46, 0.2], [0.06, 0.26]].forEach(([y, r]) => {
    const capM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 20), capMat);
    capM.position.y = y;
    th.add(capM);
  });
  th.position.set(thX, BENCH_TOP, thZ);
  th.rotation.y = -0.5;
  g.add(th);
  const thSh = makeContactShadow(1.3, 1.3, 0.7);
  thSh.position.set(thX, BENCH_TOP + 0.005, thZ);
  g.add(thSh);
  // —— 铜放大镜（斜倚展台右缘）——
  const mgX = 10.6, mgZ = -1.6;
  const mg = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 10, 44), matStd(PAL.brass, { metalness: 0.85, roughness: 0.3 }));
  mg.add(rim);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.4, 36), matGlass(0xe8f2f6, { roughness: 0.05, transmission: 0.94, opacity: 0.32 }));
  mg.add(lens);
  const handleProf = [[0.06, 0], [0.075, 0.3], [0.05, 0.7], [0.07, 1.0], [0.05, 1.15]].map(([r, y]) => new THREE.Vector2(r, y));
  const handle = new THREE.Mesh(new THREE.LatheGeometry(handleProf, 18), matStd(PAL.brass, { metalness: 0.82, roughness: 0.34 }));
  handle.position.y = -0.46;
  handle.rotation.z = 0.2;
  mg.add(handle);
  mg.position.set(mgX, BENCH_TOP + 0.52, mgZ);
  mg.rotation.set(0.9, 0.3, 0.15);
  g.add(mg);
  const mgSh = makeContactShadow(1.3, 1.3, 0.6);
  mgSh.position.set(mgX + 0.3, BENCH_TOP + 0.005, mgZ + 0.5);
  g.add(mgSh);
  // —— 手册书堆（两本 + 手稿卡 + 黄铜镇纸）——
  const roundedRectShape = (w, d, r) => {
    const s = new THREE.Shape();
    const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + d - r);
    s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + d);
    s.absarc(x + r, y + d - r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  };
  const bkX = 11.2, bkZ = -4.6;
  const pageTex = (() => {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ece4cf';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(122,106,80,0.5)';
    ctx.lineWidth = 1;
    for (let y = 4; y < S; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * 0.7) * 0.8);
      ctx.lineTo(S, y + Math.cos(y * 0.5) * 0.6);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.6, 1);
    return t;
  })();
  const books = [
    { w: 2.5, d: 1.8, h: 0.24, y: 0.12, ry: 0.18, cover: '#25344a', lines: ['无机化学 · 下册', 'INORGANIC CHEMISTRY'] },
    { w: 2.2, d: 1.6, h: 0.2, y: 0.34, ry: -0.12, cover: '#5a2830', lines: ['元素周期表 · 手册', 'PERIODIC HANDBOOK'] },
  ];
  books.forEach(({ w, d, h, y, ry, cover, lines }) => {
    const coverGeo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, 0.07), { depth: h, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 8 });
    const coverMesh = new THREE.Mesh(coverGeo, matCoat(cover, { roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.4 }));
    coverMesh.rotation.x = -Math.PI / 2;
    const coverLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.8, d * 0.6),
      new THREE.MeshStandardMaterial({ map: makeLabelTexture(lines, { w: 240, h: 100, accent: '#e8d9b0', paper: cover }), roughness: 0.7 })
    );
    coverLabel.rotation.x = -Math.PI / 2;
    coverLabel.position.y = h + 0.012;
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.88, h * 0.7, d * 0.92),
      new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.8 })
    );
    const grp = new THREE.Group();
    grp.add(coverMesh, coverLabel, pages);
    grp.position.set(bkX, BENCH_TOP + y, bkZ);
    grp.rotation.y = ry;
    g.add(grp);
  });
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.015, 1.35),
    new THREE.MeshStandardMaterial({ map: makeCardTexture(), roughness: 0.9 })
  );
  card.position.set(bkX - 0.4, BENCH_TOP + 0.455, bkZ + 1.9);
  card.rotation.y = 0.28;
  g.add(card);
  const weight = new THREE.Mesh(
    new THREE.LatheGeometry([[0.24, 0], [0.26, 0.05], [0.22, 0.14], [0.14, 0.2], [0.13, 0.24], [0.1, 0.28]].map(([r, y]) => new THREE.Vector2(r, y)), 28),
    matStd(PAL.brass, { metalness: 0.86, roughness: 0.32 })
  );
  weight.position.set(bkX + 0.9, BENCH_TOP + 0.46, bkZ + 2.2);
  g.add(weight);
  const bkSh = makeContactShadow(3.4, 4.6, 0.75);
  bkSh.position.set(bkX + 0.2, BENCH_TOP + 0.005, bkZ + 0.6);
  g.add(bkSh);
  world.add(g);
}

/* ---------------- 布局导引线（螺旋导轨 / 同心环刻线） ---------------- */

const spiralGuide = (() => {
  const pts = [];
  for (let z = 1; z <= 118; z += 2) {
    const p = spiralPos(z);
    pts.push(new THREE.Vector3(p.x, 0.02, p.z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 180, 0.018, 6, false);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.visible = false;
  world.add(mesh);
  return mesh;
})();
const ringGuides = (() => {
  const grp = new THREE.Group();
  [1, 2, 3, 4, 5, 6, 7, 10, 11].forEach((ring) => {
    const meta = ringMeta(ring);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(meta.rad, 0.012, 6, 110),
      new THREE.MeshBasicMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    torus.rotation.x = Math.PI / 2;
    torus.position.y = 0.02;
    grp.add(torus);
  });
  grp.visible = false;
  world.add(grp);
  return grp;
})();

/* ---------------- 布局变形 ---------------- */

const ringLabels = [
  ['周期 1', 1], ['周期 2', 2], ['周期 3', 3], ['周期 4', 4], ['周期 5', 5], ['周期 6', 6], ['周期 7', 7],
  ['镧系', 10], ['锕系', 11],
].map(([txt, ring]) => {
  const sp = makeTextSprite(txt, { fontSize: 34, color: '#b9c8da', scale: 0.018 });
  const meta = ringMeta(ring);
  const ang = -Math.PI / 2 + (ring >= 10 ? ring + 0.4 : ring) * 0.55; // 各环标签错开角度，避免堆叠
  sp.position.set(Math.cos(ang) * (meta.rad + 0.55), meta.y + 0.5, Math.sin(ang) * (meta.rad + 0.55));
  sp.visible = false;
  world.add(sp);
  return sp;
});
function ringLabelsVisible(v) { ringLabels.forEach((sp) => { sp.visible = v; }); }

const tweens = [];
function addTween(dur, fn, onDone) { tweens.push({ t: 0, dur, fn, onDone }); }
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

let morphing = false;
function morphTo(mode, dur = 1.2) {
  st.mode = mode;
  ringLabelsVisible(mode === 'rings');
  spiralGuide.visible = mode === 'spiral';
  ringGuides.visible = mode === 'rings';
  const targets = POS[mode];
  const from = curPos.map((p) => p.clone());
  morphing = true;
  fadeBeamOut();
  addTween(dur, (k) => {
    const e = ease(k);
    for (let i = 0; i < 118; i++) {
      curPos[i].lerpVectors(from[i], targets[i], e);
      updateSlabXZ(i + 1, curPos[i].x, curPos[i].z);
    }
    refreshAllBodies();
    if (st.hover > 0 || st.selected > 0) syncFrames();
  }, () => {
    morphing = false;
    if (st.beamGroup > 0) rebuildBeam();
  });
}

/* ---------------- 同族连线光束 ---------------- */

const beamG = new THREE.Group();
beamG.visible = false;
world.add(beamG);
let beamTube = null, beamDots = null;
function beamMembers(g) {
  const list = [];
  for (let z = 1; z <= 118; z++) {
    const rc = gridRowCol(z);
    if (rc[0] <= 7 && rc[1] === g) list.push(z);
  }
  return list;
}
function rebuildBeam() {
  clearBeamObjects();
  const g = st.beamGroup;
  if (!g || morphing) return;
  const members = beamMembers(g);
  if (members.length < 2) return;
  const pts = members.map((z) => {
    const p = curPos[z - 1];
    return new THREE.Vector3(p.x, heights[z - 1] + 0.42, p.z);
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
  const color = new THREE.Color(CAT_COLORS[catIdx(members[Math.floor(members.length / 2)])]);
  beamTube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, 0.042, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  beamG.add(beamTube);
  const dotPos = new Float32Array(members.length * 3);
  pts.forEach((p, i) => { dotPos[i * 3] = p.x; dotPos[i * 3 + 1] = p.y; dotPos[i * 3 + 2] = p.z; });
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  beamDots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    map: makeGlowSprite('rgba(255,235,190,0.85)'), color, size: 0.34, sizeAttenuation: true,
    transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  beamG.add(beamDots);
  beamG.visible = true;
  beamTube.material.opacity = 0;
  addTween(0.4, (k) => {
    if (beamTube) beamTube.material.opacity = 0.42 * ease(k);
    if (beamDots) beamDots.material.opacity = 0.9 * ease(k);
  });
}
function clearBeamObjects() {
  if (beamTube) { beamTube.geometry.dispose(); beamTube.material.dispose(); beamG.remove(beamTube); beamTube = null; }
  if (beamDots) { beamDots.geometry.dispose(); beamDots.material.dispose(); beamG.remove(beamDots); beamDots = null; }
  while (beamG.children.length) {
    const c = beamG.children[beamG.children.length - 1];
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
    beamG.remove(c);
  }
}
function fadeBeamOut() {
  if (!beamG.visible) return;
  const t0 = beamTube, d0 = beamDots;
  beamG.visible = false;
  beamTube = null; beamDots = null;
  addTween(0.25, (k) => {
    if (t0) t0.material.opacity = 0.42 * (1 - k);
    if (d0) d0.material.opacity = 0.9 * (1 - k);
  }, () => clearBeamObjects2(t0, d0));
}
function clearBeamObjects2(t, d) {
  if (t) { t.geometry.dispose(); t.material.dispose(); }
  if (d) { d.geometry.dispose(); d.material.dispose(); }
}
function setBeamGroup(g) {
  st.beamGroup = g;
  if (!g) {
    fadeBeamOut();
  } else if (!morphing) {
    rebuildBeam();
  }
}

/* ---------------- 帧循环 ---------------- */

const _zeroM = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
const _bm4 = new THREE.Matrix4();
let bohrT = 0;
let labReady = false;

app.onFrame((dt) => {
  if (!labReady) return; // 帧循环就绪守卫（公约 2.1）
  const now = performance.now() * 0.001;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(tw.t / tw.dur, 1);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
  }

  if (bohrG.visible) {
    bohrT += dt;
    if (st.spin) bohrG.rotation.y += dt * 0.5;
    const shells = SHELLS[st.bohrZ - 1];
    let idx = 0;
    for (let s = 0; s < shells.length; s++) {
      const R = SHELL_R[s], n = shells[s], sp = 1.7 - s * 0.18;
      for (let j = 0; j < n; j++) {
        const a = bohrT * sp + (j / n) * TAU + s * 0.8;
        _bm4.makeTranslation(Math.cos(a) * R, 0, Math.sin(a) * R);
        electronMesh.setMatrixAt(idx++, _bm4);
      }
    }
    while (idx < 118) electronMesh.setMatrixAt(idx++, _zeroM);
    electronMesh.instanceMatrix.needsUpdate = true;
    shellTrail.forEach((line, s) => {
      if (line.visible) line.rotation.y = -bohrT * (1.7 - s * 0.18) * 0.55;
    });
    coreHalo.material.opacity = 0.7 + Math.sin(now * 2.4) * 0.15;
  }

  if (st.yearPlaying) {
    st.year = Math.min(2016, st.year + dt * 12.2 * st.yearSpeed);
    if (st.yearSlider) st.yearSlider.set(Math.round(st.year));
    applyYear(Math.round(st.year), true);
    if (st.year >= 2016) setYearPlaying(false);
  }

  if (st.tempPlaying) {
    st.temp = Math.min(6000, st.temp + dt * 260);
    if (st.tempSlider) st.tempSlider.set(Math.round(st.temp));
    applyTempState();
    if (st.temp >= 6000) setTempPlaying(false);
  }

  if (st.tempMode && st.gasList.length) {
    for (const z of st.gasList) {
      const i = instToZ[2].indexOf(z);
      if (i >= 0) {
        bodyGas.getMatrixAt(i, _bm4);
        _bm4.elements[13] += Math.sin(now * 2.1 + z * 1.7) * 0.05;
        bodyGas.setMatrixAt(i, _bm4);
      }
    }
    bodyGas.instanceMatrix.needsUpdate = true;
  }

  flashPool.forEach((m) => {
    if (!m.visible) return;
    const k = (now - m.userData.t0) / 1.1;
    if (k >= 1) { m.visible = false; m.material.opacity = 0; return; }
    m.material.opacity = (1 - k) * 0.75;
    const s = 1 + k * 0.4;
    m.scale.set(s, s, 1);
  });
});

function setYearPlaying(v) {
  st.yearPlaying = v;
  if (st.yearPlayBtn) {
    st.yearPlayBtn.textContent = v ? '⏸ 暂停' : '▶ 播放发现史';
    st.yearPlayBtn.classList.toggle('active', v);
  }
  if (!v && st.year >= 2016 && st.yearSlider) st.yearSlider.set(2016);
}
function setTempPlaying(v) {
  st.tempPlaying = v;
  if (st.tempPlayBtn) {
    st.tempPlayBtn.textContent = v ? '⏸ 暂停升温' : '▶ 播放升温（0→6000 K）';
    st.tempPlayBtn.classList.toggle('active', v);
  }
}

/* ---------------- 柱高 / 温度物态 / 发现史 ---------------- */

function barHeight(z) {
  const d = ELS[z - 1];
  switch (st.barProp) {
    case 'number': return 0.35 + (z / 118) * 2.0;
    case 'radius': return d[3] == null ? 0.28 : 0.35 + clamp((d[3] - 30) / 181, 0, 1) * 1.9;
    case 'eneg': return d[4] == null ? 0.28 : 0.35 + (d[4] / 3.98) * 1.9;
    case 'ie': return d[5] == null ? 0.28 : 0.35 + (d[5] / 2372) * 1.9;
    case 'mp': return d[6] == null ? 0.28 : 0.35 + (d[6] / 3695) * 1.9;
    case 'density': return d[12] == null ? 0.28 : 0.35 + clamp((Math.log10(Math.max(d[12], 1e-4)) + 4.05) / 5.4, 0, 1) * 1.9; // 密度跨 5 个数量级，按对数取高（H 8.99e-5 → Os 22.6）
    default: return FLAT_H;
  }
}
function setHeights(fn, animate = true, dur = 0.9) {
  const targets = [];
  for (let z = 1; z <= 118; z++) targets.push(fn(z));
  if (!animate) {
    for (let z = 1; z <= 118; z++) setCellHeight(z, targets[z - 1]);
    return;
  }
  const from = Array.from(heights);
  addTween(dur, (k) => {
    const e = ease(k);
    for (let z = 1; z <= 118; z++) setCellHeight(z, from[z - 1] + (targets[z - 1] - from[z - 1]) * e);
  });
}

function stateAt(z, T) {
  const d = ELS[z - 1];
  const melt = d[6], boil = d[7];
  if (boil != null && T >= boil) return 'gas';          // He 熔点缺失但沸点 4K：298K 判为气态
  if (melt != null && T < melt) return 'solid';
  if (melt != null && boil != null) return 'liquid';
  return 'unknown';
}
// 白炽发光：金属按「当前温度越过自身熔点多少」推算亮度，非金属不发光
function emberLevel(z, T) {
  const d = ELS[z - 1];
  if (!METAL_CAT.has(catIdx(z)) || d[6] == null) return 0;
  const k = (T - d[6] * 0.62) / (d[6] * 0.75);
  return clamp(k, 0, 1);
}
function applyTempState() {
  st.gasList = [];
  const counts = { solid: 0, liquid: 0, gas: 0, unknown: 0 };
  for (let z = 1; z <= 118; z++) counts[stateAt(z, st.temp)]++;
  bucketAssign(true);
  for (let z = 1; z <= 118; z++) {
    if (stateAt(z, st.temp) === 'gas') st.gasList.push(z);
    const unk = stateAt(z, st.temp) === 'unknown';
    const k = unk ? 0.42 : brightness[z - 1];
    setSlabTint(z, k, k, k);
  }
  // 白炽叠加层
  let emberSum = 0;
  for (let i = 0; i < 118; i++) {
    const z = i + 1;
    const lv = st.temp > 700 ? emberLevel(z, st.temp) : 0;
    emberSum += lv;
    const p = curPos[z - 1];
    if (lv > 0.02 && !ghosted[z - 1]) {
      _m4b.makeTranslation(p.x, 0, p.z);
      _m4.makeScale(1, heights[z - 1], 1);
      _m4.premultiply(_m4b);
      bodyEmber.setMatrixAt(i, _m4);
      const heat = new THREE.Color(0xff5a1e).lerp(new THREE.Color(0xffe8b0), lv * 0.8);
      heat.multiplyScalar(lv * 0.95);
      bodyEmber.setColorAt(i, heat);
    } else {
      bodyEmber.setMatrixAt(i, _zeroM);
    }
  }
  bodyEmber.instanceMatrix.needsUpdate = true;
  if (bodyEmber.instanceColor) bodyEmber.instanceColor.needsUpdate = true;
  emberLight.intensity = Math.min(2.2, emberSum * 0.05);
  if (st.hudTemp) {
    st.hudTemp.set('temp', `${Math.round(st.temp)} K / ${(st.temp - 273).toFixed(0)} ℃`);
    st.hudTemp.set('count', `固 ${counts.solid} · 液 ${counts.liquid} · 气 ${counts.gas} · 未知 ${counts.unknown}`);
  }
}

function discoveredAt(z, y) {
  const yr = ELS[z - 1][10];
  return yr === 0 || yr <= y;
}
function currentEvent(y) {
  let ev = null;
  for (const e of TIMELINE) if (e[0] <= y) ev = e;
  return ev;
}
function applyYear(y, withFlash) {
  st.year = y;
  let count = 0;
  const now = performance.now() * 0.001;
  let flashBudget = 6;
  for (let z = 1; z <= 118; z++) {
    const vis = discoveredAt(z, y);
    if (vis) count++;
    const was = !ghosted[z - 1];
    if (vis && !was) {
      if (withFlash && flashBudget > 0) { spawnFlash(z); flashBudget--; }
      setGhost(z, false);
    } else if (!vis && was) {
      setGhost(z, true);
    }
  }
  if (st.hudYear) {
    st.hudYear.set('year', y + ' 年');
    st.hudYear.set('found', count + ' / 118');
  }
  const ev = currentEvent(y);
  if (tlYearEl && tlTextEl) {
    if (ev) {
      tlYearEl.textContent = ev[0] + ' 年';
      tlTextEl.textContent = ev[1];
      timelineEl.style.display = 'block';
    } else {
      timelineEl.style.display = 'none';
    }
  }
}

/* ---------------- DOM 覆盖层：HUD / 图例 / 趋势 / 电离能折线窗 / 信息卡 / 时间轴 / chips ---------------- */

const lcData = document.getElementById('lcData');
let hud = null;
function buildHud(rows) {
  lcData.innerHTML = '';
  hud = makeHUD(lcData, rows);
  return hud;
}

const legendEl = document.createElement('div');
legendEl.className = 'pt-legend';
stage.appendChild(legendEl);
let legendPick = null; // 图例点选回调（章内注入）
function legendRow(color, text, opts = {}) {
  const r = document.createElement(opts.onClick ? 'button' : 'div');
  r.type = 'button';
  r.className = 'lg-row' + (opts.onClick ? ' clickable' : '') + (opts.on ? ' on' : '');
  const sw = document.createElement('span');
  sw.className = 'sw';
  sw.style.background = color;
  r.appendChild(sw);
  r.appendChild(document.createTextNode(text));
  if (opts.onClick) r.addEventListener('click', opts.onClick);
  return r;
}
function renderLegend() {
  legendEl.innerHTML = '';
  if (st.colorMode === 'cat') {
    CAT_NAMES.forEach((n, i) => legendEl.appendChild(legendRow(CAT_COLORS[i], n, {
      clickable: true,
      on: st.catHighlight === i,
      onClick: () => {
        st.catHighlight = st.catHighlight === i ? -1 : i;
        applyBright((z) => st.catHighlight < 0 || catIdx(z) === st.catHighlight);
        renderLegend();
        if (hud && hud.set && currentSection === 0) hud.set('cat', st.catHighlight < 0 ? '—' : CAT_NAMES[st.catHighlight]);
        if (legendPick) legendPick(st.catHighlight);
      },
    })));
    if (st.catHighlight >= 0) {
      const hint = document.createElement('div');
      hint.className = 'lg-hint';
      hint.textContent = '再点一次取消点亮';
      legendEl.appendChild(hint);
    }
  } else if (st.colorMode === 'eneg') {
    const r = document.createElement('div');
    r.className = 'lg-row';
    const g = document.createElement('span');
    g.className = 'grad';
    g.style.background = `linear-gradient(90deg, ${enegColor(0.5)}, ${enegColor(2)}, ${enegColor(3.98)})`;
    r.appendChild(g);
    r.appendChild(document.createTextNode('电负性 小 → 大'));
    legendEl.appendChild(r);
    legendEl.appendChild(legendRow('#6f7680', '无数据（稀有气体 / 人工合成）'));
  } else {
    STATE_NAMES.forEach((n, i) => legendEl.appendChild(legendRow(STATE_COLORS[i], n)));
  }
}

const trendBox = document.createElement('div');
trendBox.className = 'pt-legend';
stage.appendChild(trendBox);
function renderTrend() {
  const rad = st.barProp === 'radius';
  trendBox.innerHTML = '';
  trendBox.appendChild(legendRow(rad ? 'linear-gradient(90deg,#e5e9ee,#9aa6b2)' : 'linear-gradient(90deg,#9aa6b2,#e5e9ee)',
    rad ? '→ 同周期 左→右：半径减小' : '→ 同周期 左→右：电负性增大'));
  trendBox.appendChild(legendRow(rad ? 'linear-gradient(0deg,#9aa6b2,#e5e9ee)' : 'linear-gradient(0deg,#e5e9ee,#9aa6b2)',
    rad ? '↓ 同族 上→下：半径增大' : '↓ 同族 上→下：电负性减小'));
  if (rad) trendBox.appendChild(legendRow('#6f7680', '注：稀有气体半径测法口径不同，比较需留意'));
}

// 电离能 / 电负性折线图窗（coastal-window 样式；锯齿处红圈标注）
const ieWindow = document.createElement('div');
ieWindow.className = 'coastal-window';
ieWindow.style.display = 'none';
const ieHeadB = document.createElement('b');
{
  const head = document.createElement('div');
  head.className = 'cw-head';
  head.appendChild(ieHeadB);
  ieWindow.appendChild(head);
}
const ieCanvas = document.createElement('canvas');
ieCanvas.width = 560;
ieCanvas.height = 300;
ieWindow.appendChild(ieCanvas);
const ieCap = document.createElement('div');
ieCap.className = 'pt-ie-cap';
ieWindow.appendChild(ieCap);
stage.appendChild(ieWindow);
const ieCtx = ieCanvas.getContext('2d');

function drawIEWindow() {
  const per = st.iePeriod;
  const z0 = per === 2 ? 3 : 11;
  const list = [];
  for (let z = z0; z < z0 + 8; z++) list.push(z);
  const propIdx = st.ieProp === 'ie' ? 5 : 4;
  const vals = list.map((z) => ELS[z - 1][propIdx]);
  const max = Math.max(...vals.map((v) => (v == null ? 0 : v)));
  const W = 280, H = 150;
  ieCtx.setTransform(2, 0, 0, 2, 0, 0);
  ieCtx.clearRect(0, 0, W, H);
  const base = 116, top = 26, x0 = 26, x1 = W - 22;
  // 横向参考线
  for (let i = 0; i <= 3; i++) {
    const y = base - (i / 3) * (base - top);
    ieCtx.strokeStyle = 'rgba(140,160,180,0.16)';
    ieCtx.lineWidth = 1;
    ieCtx.beginPath(); ieCtx.moveTo(x0, y); ieCtx.lineTo(x1, y); ieCtx.stroke();
    if (i > 0) {
      ieCtx.fillStyle = 'rgba(140,160,180,0.4)';
      ieCtx.font = '400 8.5px ' + FONT;
      ieCtx.textAlign = 'right';
      ieCtx.fillText(String(Math.round((max * i) / 3)), x0 - 4, y + 3);
    }
  }
  const xOf = (i) => x0 + ((x1 - x0) * i) / (list.length - 1);
  const yOf = (v) => base - (v / max) * (base - top);
  // 折线 + 渐变填充
  ieCtx.beginPath();
  let started = false;
  vals.forEach((v, i) => {
    if (v == null) return;
    const x = xOf(i), y = yOf(v);
    if (!started) { ieCtx.moveTo(x, y); started = true; } else ieCtx.lineTo(x, y);
  });
  ieCtx.strokeStyle = '#e8a15c';
  ieCtx.lineWidth = 2;
  ieCtx.stroke();
  ieCtx.lineTo(xOf(vals.length - 1), base - 1);
  ieCtx.lineTo(xOf(0), base - 1);
  ieCtx.closePath();
  const fill = ieCtx.createLinearGradient(0, top, 0, base);
  fill.addColorStop(0, 'rgba(232,161,92,0.24)');
  fill.addColorStop(1, 'rgba(232,161,92,0.02)');
  ieCtx.fillStyle = fill;
  ieCtx.fill();
  // 数据点 + 符号 + 数值
  vals.forEach((v, i) => {
    const x = xOf(i);
    ieCtx.textAlign = 'center';
    ieCtx.fillStyle = 'rgba(140,152,166,0.95)';
    ieCtx.font = '600 11px ' + FONT;
    ieCtx.fillText(ELS[list[i] - 1][0], x, base + 15);
    if (v == null) {
      ieCtx.fillStyle = 'rgba(140,152,166,0.55)';
      ieCtx.beginPath(); ieCtx.arc(x, base - 2, 2.4, 0, TAU); ieCtx.fill();
      return;
    }
    const y = yOf(v);
    ieCtx.fillStyle = faceBgHex(list[i]);
    ieCtx.beginPath(); ieCtx.arc(x, y, 4, 0, TAU); ieCtx.fill();
    ieCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    ieCtx.lineWidth = 1.2; ieCtx.stroke();
    ieCtx.fillStyle = 'rgba(205,216,228,0.95)';
    ieCtx.font = '500 9.5px ' + FONT;
    ieCtx.fillText(String(v), x, y - 8);
  });
  // 锯齿红圈：Be＞B / N＞O（第 3 周期 Mg＞Al / P＞S）
  if (st.ieProp === 'ie') {
    ieCtx.strokeStyle = '#e0684b';
    ieCtx.lineWidth = 1.6;
    [1, 2, 4, 5].forEach((i) => {
      const x = xOf(i), y = yOf(vals[i]);
      ieCtx.beginPath(); ieCtx.arc(x, y, 7.5, 0, TAU); ieCtx.stroke();
    });
  }
  ieHeadB.textContent = `第 ${per} 周期 · ${st.ieProp === 'ie' ? '第一电离能 kJ/mol' : '电负性'}`;
  ieCap.textContent = st.ieProp === 'ie'
    ? (per === 2
      ? '红圈：Be＞B、N＞O 的「锯齿」——2s/2p 全满或半满结构更稳定，失电子反而更难'
      : '红圈：Mg＞Al、P＞S，同样是全满/半满更稳造成的锯齿')
    : '电负性从左到右持续增大（稀有气体通常不标数值）';
}

// 发现史时间轴字幕
const timelineEl = document.createElement('div');
timelineEl.className = 'pt-timeline';
const tlYearEl = document.createElement('div');
tlYearEl.className = 'tl-year';
const tlTextEl = document.createElement('div');
tlTextEl.className = 'tl-text';
timelineEl.appendChild(tlYearEl);
timelineEl.appendChild(tlTextEl);
stage.appendChild(timelineEl);

// 元素信息卡（含用途行）
const infoEl = document.createElement('div');
infoEl.className = 'pt-info';
stage.appendChild(infoEl);
function fmtYear(y) { return y === 0 ? '古代' : y + ' 年'; }
function showInfo(z) {
  st.selected = z;
  const d = ELS[z - 1];
  const bg = faceBgHex(z);
  const shells = SHELLS[z - 1];
  const rows = [
    ['相对原子质量', d[2] == null ? '—' : d[2]],
    ['电子层分布', `${shells.join(' · ')}（${shells.length} 层）`],
    ['电子排布', d[8]],
    ['周期 / 族', `第 ${periodOf(z)} 周期 · ${groupLabel(z)}`],
    ['原子半径', d[3] == null ? '—' : d[3] + ' pm'],
    ['电负性', d[4] == null ? '—' : d[4]],
    ['第一电离能', d[5] == null ? '—' : d[5] + ' kJ/mol'],
    ['熔点 / 沸点', d[6] == null && d[7] == null ? '—' : `${d[6] == null ? '—' : d[6] + ' K'} / ${d[7] == null ? '—' : d[7] + ' K'}`],
    ['常温状态', { solid: '固态', liquid: '液态', gas: '气态', unknown: '—' }[stateAt(z, 298)]],
    ['发现', fmtYear(d[10])],
    ['密度', d[12] == null ? '—' : d[12] + ' g/cm³'],
  ];
  infoEl.innerHTML = `
    <div class="pt-info-head" style="background:${bg}">
      <span class="sym"></span>
      <span class="nm"></span>
      <button class="pt-info-x" type="button">✕</button>
    </div>
    <div class="pt-info-body"></div>`;
  infoEl.querySelector('.sym').textContent = d[0];
  const nm = infoEl.querySelector('.nm');
  nm.innerHTML = '';
  nm.appendChild(document.createTextNode(`${CN[z - 1]} · ${d[1]}`));
  const em = document.createElement('em');
  em.textContent = `原子序数 ${z} · ${CAT_NAMES[d[9]]}`;
  nm.appendChild(em);
  const body = infoEl.querySelector('.pt-info-body');
  rows.forEach(([k, v]) => {
    const r = document.createElement('div');
    r.className = 'r';
    const s = document.createElement('span');
    s.textContent = k;
    const b = document.createElement('b');
    b.textContent = v;
    r.appendChild(s);
    r.appendChild(b);
    body.appendChild(r);
  });
  const div = document.createElement('div');
  div.className = 'div';
  body.appendChild(div);
  const useRow = document.createElement('div');
  useRow.className = 'r use';
  const useS = document.createElement('span');
  useS.textContent = '用途';
  const useB = document.createElement('b');
  useB.textContent = USES[z - 1] || '—';
  useRow.appendChild(useS);
  useRow.appendChild(useB);
  body.appendChild(useRow);
  infoEl.querySelector('.pt-info-x').addEventListener('click', hideInfo);
  infoEl.style.display = 'block';
  syncFrames();
}
function hideInfo() {
  st.selected = -1;
  infoEl.style.display = 'none';
  syncFrames();
}

// 速选 chips（章内快捷动作）
const chipsEl = document.createElement('div');
chipsEl.className = 'pt-chips';
stage.appendChild(chipsEl);
function setChips(defs) {
  chipsEl.innerHTML = '';
  defs.forEach((d, i) => {
    if (d === '|') {
      const sep = document.createElement('i');
      chipsEl.appendChild(sep);
      return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d.label;
    if (d.id) b.dataset.chip = d.id;
    b.addEventListener('click', d.onClick);
    chipsEl.appendChild(b);
  });
}
function chipOn(id, on) {
  const b = chipsEl.querySelector(`[data-chip="${id}"]`);
  if (b) b.classList.toggle('on', !!on);
}

/* ---------------- 拾取与点击 ---------------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pickCell(ev) {
  const r = app.dom.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const objs = [...slabMeshes, bodySolid, bodyLiquid, bodyGas];
  const hits = raycaster.intersectObjects(objs, false);
  if (!hits.length) return -1;
  const h = hits[0];
  if (h.object.isInstancedMesh) {
    const b = h.object === bodySolid ? 0 : h.object === bodyLiquid ? 1 : 2;
    const list = instToZ[b];
    return list[h.instanceId] !== undefined ? list[h.instanceId] : -1;
  }
  const mi = slabMeshes.indexOf(h.object);
  const tri = h.faceIndex | 0;
  const z = slabTriZ[mi][tri];
  return z || -1;
}
let downPos = null;
app.dom.addEventListener('pointerdown', (e) => {
  downPos = [e.clientX, e.clientY, performance.now()];
});
app.dom.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const dx = e.clientX - downPos[0], dy = e.clientY - downPos[1];
  const dtp = performance.now() - downPos[2];
  downPos = null;
  if (dx * dx + dy * dy > 36 || dtp > 450) return;
  const z = pickCell(e);
  if (z > 0) {
    showInfo(z);
    if (currentSection === 1) selectBohr(z);
    if (currentSection === 0 && hud) hud.set('sel', `${CN[z - 1]} ${ELS[z - 1][0]}`);
  } else {
    hideInfo();
  }
});
app.dom.addEventListener('pointermove', (e) => {
  if (!labReady || morphing) return;
  const z = pickCell(e);
  if (z !== st.hover) {
    const prev = st.hover;
    st.hover = z;
    if (prev > 0) { updateBodyBucket(prev); updateSlabHeight(prev, heights[prev - 1]); }
    if (z > 0) { updateBodyBucket(z); updateSlabHeight(z, heights[z - 1] + HOVER_LIFT); }
    syncFrames();
    app.dom.style.cursor = z > 0 ? 'pointer' : '';
  }
});

/* ---------------- 章节状态复位 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;
let currentSection = 0;

function resetWorld() {
  tweens.length = 0;
  st.hover = -1;
  hideInfo();
  bohrG.visible = false;
  bohrG.rotation.y = 0;
  ieWindow.style.display = 'none';
  trendBox.style.display = 'none';
  timelineEl.style.display = 'none';
  legendEl.style.display = 'none';
  st.yearPlaying = false;
  st.tempPlaying = false;
  st.tempMode = false;
  st.barProp = null;
  st.faceMode = 'mass';
  st.colorMode = 'cat';
  st.catHighlight = -1;
  emberLight.intensity = 0;
  // 白炽叠加层复位：全部实例折叠为点（identity 实例叠加会以加色混合炸 bloom）
  for (let i = 0; i < 118; i++) bodyEmber.setMatrixAt(i, _instZero);
  bodyEmber.instanceMatrix.needsUpdate = true;
  // 残影复位
  for (let z = 1; z <= 118; z++) if (ghosted[z - 1]) setGhost(z, false);
  bucketAssign(false);
  applyBright(() => true);
  paintAll();
  if (st.mode !== 'grid') {
    st.mode = 'grid';
    spiralGuide.visible = false;
    ringGuides.visible = false;
    ringLabelsVisible(false);
    for (let i = 0; i < 118; i++) curPos[i].copy(POS.grid[i]);
    refreshAllBodies();
  } else {
    for (let i = 0; i < 118; i++) curPos[i].copy(POS.grid[i]);
    refreshAllBodies();
  }
  // 顶板顶点 x/z 同步回长式网格（morph 到螺旋/同心环后切章，顶板不能留在旧布局）
  for (let i = 0; i < 118; i++) updateSlabXZ(i + 1, curPos[i].x, curPos[i].z);
  for (let z = 1; z <= 118; z++) setCellHeight(z, FLAT_H);
  syncFrames();
  if (st.beamGroup) { st.beamGroup = 0; fadeBeamOut(); }
}

function setPropertyMode(v) {
  st.barProp = v;
  st.faceMode = v === 'number' ? 'mass' : v;
  paintAll();
  setHeights(barHeight, true, 0.9);
  if (currentSection === 0 && hud) hud.set('val', { number: '柱高 = 原子序数', radius: '柱高 = 原子半径 (pm)', eneg: '柱高 = 电负性', ie: '柱高 = 第一电离能', mp: '柱高 = 熔点 (K)', density: '柱高 = 密度 (g/cm³ · 对数高度)' }[v]);
}

/* ---------------- 章节定义 ---------------- */

const SIDE_CAM = { pos: [14.5, 6.5, 14.5], tgt: [0, 1.4, 0] };
const BOHR_CAM = { pos: [-3.0, 8.0, -0.4], tgt: [BOHR_POS.x, 5.6, BOHR_POS.z] };

const SECTIONS = [
  {
    group: '基础认知',
    title: '认识周期表',
    html: `<p>迄今确认的元素共 <b>118 种</b>，依原子序数排入同一张表：横行叫<b>周期</b>（共 7 个），纵列叫<b>族</b>（16 个族，其中第 8/9/10 列合称第 Ⅷ 族）。表下方独立两行是 <span class="hl">镧系（57–71）</span>与 <span class="hl">锕系（89–103）</span>。</p>
<p>颜色代表元素分类（碱金属、过渡金属、非金属、稀有气体……）。<b>点左下图例可单独点亮某一类</b>；把鼠标移到方格上会<b>高亮</b>，<b>点击</b>任意方格可打开元素档案（含用途）。</p>
<p>切换「属性柱高」，让整张表按原子序数 / 原子半径 / 电负性 / 电离能 / 熔点<b>升起成柱</b>，直观看数据在表上的分布规律。</p>`,
    enter() {
      resetWorld();
      currentSection = 0;
      st.barProp = 'number';
      app.setCamera(HOME.pos, HOME.tgt);
      buildHud([['sel', '选中'], ['val', '属性'], ['cat', '点亮']]);
      hud.set('sel', '点击方格查看');
      hud.set('val', '柱高 = 原子序数');
      hud.set('cat', '—');
      ctl.clear();
      ctl.seg({
        options: [
          { label: '原子序数', value: 'number' },
          { label: '原子半径', value: 'radius' },
          { label: '电负性', value: 'eneg' },
          { label: '电离能', value: 'ie' },
          { label: '熔点', value: 'mp' },
          { label: '密度', value: 'density' },
        ],
        value: 'number',
        onChange: (v) => setPropertyMode(v),
      });
      ctl.sep();
      ctl.toggle({
        label: '族图例', value: false,
        onChange: (v) => { st.legendOn = v; legendEl.style.display = v ? 'flex' : 'none'; if (v) renderLegend(); },
      });
      ctl.button({ label: '⌂ 复位视角', onClick: () => app.setCamera(HOME.pos, HOME.tgt) });
      setChips([
        { id: 'am', label: '点亮碱金属', onClick: () => highlightCat(0) },
        { id: 'ng', label: '点亮稀有气体', onClick: () => highlightCat(8) },
        { id: 'au', label: '金的特写', onClick: () => { showInfo(79); hud.set('sel', 'Au 金'); } },
        '|',
        { label: '清除点亮', onClick: () => highlightCat(-1) },
      ]);
      setHeights(barHeight, true, 1.1);
    },
  },
  {
    group: '基础认知',
    title: '电子层与周期',
    html: `<p>核外电子按能量高低<b>分层排布</b>（K、L、M……层），用 Bohr 模型表示：原子核在中心，电子在同心的电子层上运动。</p>
<p><span class="hl">周期数 = 电子层数</span>：钠的电子层分布是 2、8、1，共 3 层，所以在第 3 周期。稀有气体最外层 8 电子（He 为 2）是<b>稳定结构</b>，所以化学性质很不活泼。</p>
<p>拖动滑杆或<b>点击表中任意方格</b>选择元素，左侧展台上的原子模型会切换到它；每层旁的数字是该层电子数。</p>`,
    enter() {
      resetWorld();
      currentSection = 1;
      app.setCamera(BOHR_CAM.pos, BOHR_CAM.tgt);
      bohrG.visible = true;
      st.hudBohr = buildHud([['elem', '元素'], ['shell', '电子层']]);
      updateBohr(st.bohrZ);
      applyBright((z) => z === st.bohrZ);
      setHeights((z) => (z === st.bohrZ ? 2.3 : FLAT_H), false);
      ctl.clear();
      st.zSlider = ctl.slider({
        label: '原子序数', min: 1, max: 118, value: st.bohrZ,
        fmt: (v) => `${v} · ${CN[v - 1]} ${ELS[v - 1][0]}`,
        onInput: (v) => selectBohr(v),
      });
      ctl.button({ label: '🎲 随机元素', onClick: () => selectBohr(1 + Math.floor(Math.random() * 118)) });
      ctl.toggle({
        label: '层数标注', value: true,
        onChange: (v) => { st.shellsMarker = v; updateBohr(st.bohrZ); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { st.spin = v; },
      });
      setChips([
        { label: '钠原子', onClick: () => selectBohr(11) },
        { label: '钾原子', onClick: () => selectBohr(19) },
        { label: '氯原子', onClick: () => selectBohr(17) },
        { label: '氦原子', onClick: () => selectBohr(2) },
      ]);
    },
  },
  {
    group: '周期性规律',
    title: '原子半径和电负性',
    html: `<p><b>原子半径</b>：同一周期里自左向右，核电荷数增大、原子核对电子的吸引变强，半径<span class="hl">逐渐减小</span>；同一族从上到下，电子层数增多，半径<span class="hl">逐渐增大</span>。</p>
<p><b>电负性</b>（原子吸引电子能力的度量）：同周期自左向右<span class="hl">增大</span>，同族从上到下<span class="hl">减小</span>——所以右上角的氟（3.98）是"最抢电子"的元素。稀有气体通常不列数值。</p>
<p>用「周期聚焦」只点亮某一个周期，趋势一目了然；点「侧视角」从侧面看柱高的起伏。注：本数据集中稀有气体半径与相邻卤素口径不同（测法差异），横向比较时需留意。</p>`,
    enter() {
      resetWorld();
      currentSection = 2;
      st.barProp = 'radius';
      st.faceMode = 'radius';
      paintAll();
      app.setCamera(HOME.pos, HOME.tgt);
      buildHud([['prop', '属性'], ['focus', '聚焦']]);
      hud.set('prop', '原子半径');
      hud.set('focus', '全部周期');
      ctl.clear();
      ctl.seg({
        options: [
          { label: '原子半径', value: 'radius' },
          { label: '电负性', value: 'eneg' },
        ],
        value: 'radius',
        onChange: (v) => {
          st.barProp = v;
          st.faceMode = v;
          paintAll();
          setHeights(barHeight, true, 0.9);
          renderTrend();
          hud.set('prop', v === 'radius' ? '原子半径' : '电负性');
        },
      });
      ctl.sep();
      st.focusSlider = ctl.slider({
        label: '周期聚焦', min: 0, max: 7, value: 0,
        fmt: (v) => (v === 0 ? '全部' : `第 ${v} 周期`),
        onInput: (v) => {
          applyBright(z => v === 0 || periodOf(z) === v);
          hud.set('focus', v === 0 ? '全部' : `第 ${v} 周期`);
        },
      });
      ctl.toggle({
        label: '趋势标注', value: false,
        onChange: (v) => { st.trendOn = v; trendBox.style.display = v ? 'flex' : 'none'; if (v) renderTrend(); },
      });
      ctl.button({ label: '▶ 升起动画', onClick: () => setHeights(barHeight, true, 0.9) });
      ctl.button({
        label: '显示全部周期',
        onClick: () => { applyBright(() => true); if (st.focusSlider) st.focusSlider.set(0); hud.set('focus', '全部'); },
      });
      setChips([
        { label: '侧视角', onClick: () => app.setCamera(SIDE_CAM.pos, SIDE_CAM.tgt) },
        { label: '俯视角', onClick: () => app.setCamera(HOME.pos, HOME.tgt) },
        { label: '氟特写', onClick: () => showInfo(9) },
        { label: '铯特写', onClick: () => showInfo(55) },
      ]);
      setHeights(barHeight, true, 1.0);
    },
  },
  {
    group: '周期性规律',
    title: '电离能与熔点',
    html: `<p><b>第一电离能</b>：使气态原子丢掉一个电子所耗费的最低能量，反映原子"守"电子的能力。总体上随原子序数增大呈<b>周期性变化</b>：同周期自左向右总体增大。</p>
<p>但曲线不是平滑的——右下图窗画出第 2 / 3 周期的<b>折线</b>，<span class="hl">Be＞B、N＞O</span>（第 3 周期是 Mg＞Al、P＞S）出现"锯齿"：2s / 2p 能级<b>全满或半满</b>的结构更稳定，失电子反而更难。</p>
<p>3D 表里每根柱子按电离能升起，He（2372 kJ/mol）最高——稀有气体满层结构最难失电子。换成<b>熔点</b>柱，是另一种周期性：每个周期都从低熔点的碱金属爬到高熔点的过渡金属，再跌回稀有气体的谷底。</p>`,
    enter() {
      resetWorld();
      currentSection = 3;
      st.barProp = 'ie';
      st.faceMode = 'ie';
      paintAll();
      app.setCamera(SIDE_CAM.pos, SIDE_CAM.tgt);
      buildHud([['prop', '属性'], ['peak', '峰值']]);
      hud.set('prop', '第一电离能');
      hud.set('peak', 'He 2372 kJ/mol');
      ieWindow.style.display = '';
      drawIEWindow();
      ctl.clear();
      ctl.seg({
        options: [
          { label: '第 2 周期', value: 2 },
          { label: '第 3 周期', value: 3 },
        ],
        value: 2,
        onChange: (v) => { st.iePeriod = v; drawIEWindow(); },
      });
      ctl.sep();
      ctl.seg({
        options: [
          { label: '电离能', value: 'ie' },
          { label: '电负性', value: 'eneg' },
          { label: '熔点', value: 'mp' },
        ],
        value: 'ie',
        onChange: (v) => {
          st.barProp = v;
          st.faceMode = v;
          paintAll();
          setHeights(barHeight, true, 0.9);
          if (v === 'mp') { ieWindow.style.display = 'none'; }
          else { ieWindow.style.display = ''; drawIEWindow(); }
          hud.set('prop', { ie: '第一电离能', eneg: '电负性', mp: '熔点' }[v]);
          hud.set('peak', v === 'ie' ? 'He 2372 kJ/mol' : v === 'eneg' ? 'F 3.98（最大）' : 'W 钨 3695 K');
        },
      });
      ctl.toggle({
        label: '折线图窗', value: true,
        onChange: (v) => { ieWindow.style.display = v && st.barProp !== 'mp' ? '' : 'none'; },
      });
      ctl.button({ label: '▶ 升起动画', onClick: () => setHeights(barHeight, true, 0.9) });
      ctl.button({ label: '⌂ 俯视角', onClick: () => app.setCamera(HOME.pos, HOME.tgt) });
      setChips([
        { label: '氦特写', onClick: () => showInfo(2) },
        { label: '氮特写', onClick: () => showInfo(7) },
        { label: '氧特写', onClick: () => showInfo(8) },
      ]);
      setHeights(barHeight, true, 1.0);
    },
  },
  {
    group: '周期性规律',
    title: '物态与温度',
    html: `<p>温度决定单质的物态：<b>T 低于熔点 → 固态</b>；<span class="hl">熔点 ≤ T ＜ 沸点 → 液态</span>；<b>T ≥ 沸点 → 气态</b>（图中气态画成线框并微微升起）。</p>
<p>室温（298 K ≈ 25 ℃）下只有<b>2 种液态单质</b>：汞（唯一液态金属）和溴；<b>11 种气体</b>：H、He、N、O、F、Ne、Cl、Ar、Kr、Xe、Rn。降到 <b>10 K</b>，除氦之外全部凝固——常压下氦永远不凝固；升到 <b>303 K</b>，镓和铯也熔化了（镓搁在掌心就能熔化）。</p>
<p>再往上，3000 K 往上，金属会发出白炽的光（表上的金属柱会渐渐烧红）；<span class="hl">钨（3695 K）熔点居金属之首</span>，所以用它做灯丝。拖动温度滑杆、点快捷温度档或播放升温扫描，看整张表"熔化又沸腾"。</p>
<p>熔沸点数据不足以判断物态的元素（多为人工合成元素）显示为灰色「未知」。</p>`,
    enter() {
      resetWorld();
      currentSection = 4;
      st.tempMode = true;
      st.temp = 298;
      app.setCamera(HOME.pos, HOME.tgt);
      st.hudTemp = buildHud([['temp', '温度'], ['count', '统计']]);
      applyTempState();
      ctl.clear();
      st.tempSlider = ctl.slider({
        label: '温度', min: 0, max: 6000, step: 1, value: 298,
        fmt: (v) => `${Math.round(v)} K / ${(v - 273).toFixed(0)} ℃`,
        onInput: (v) => { st.temp = v; setTempPlaying(false); applyTempState(); syncTempChips(); },
      });
      ctl.sep();
      const setTemp = (t) => { st.temp = t; setTempPlaying(false); if (st.tempSlider) st.tempSlider.set(t); applyTempState(); syncTempChips(); };
      ctl.button({ label: '10 K · 全凝固', onClick: () => setTemp(10) });
      ctl.button({ label: '液氮 77 K', onClick: () => setTemp(77) });
      ctl.button({ label: '室温 298 K', onClick: () => setTemp(298) });
      ctl.button({ label: '镓熔化 303 K', onClick: () => setTemp(303) });
      ctl.button({ label: '铁熔化 1811 K', onClick: () => setTemp(1811) });
      ctl.button({ label: '太阳表层 5800 K', onClick: () => setTemp(5800) });
      st.tempPlayBtn = ctl.button({
        label: '▶ 播放升温（0→6000 K）',
        onClick: () => {
          if (st.tempPlaying) { setTempPlaying(false); return; }
          if (st.temp >= 6000) { st.temp = 0; if (st.tempSlider) st.tempSlider.set(0); }
          setTempPlaying(true);
        },
      });
      ctl.toggle({
        label: '统计窗', value: true,
        onChange: (v) => { if (hud) hud.show(v); },
      });
      ctl.button({
        label: '↺ 回到 298 K',
        onClick: () => setTemp(298),
      });
      function syncTempChips() {
        chipOn('t10', st.temp <= 10);
        chipOn('t77', st.temp === 77);
        chipOn('t298', st.temp === 298);
        chipOn('t303', st.temp === 303);
        chipOn('t1811', st.temp === 1811);
        chipOn('t5800', st.temp >= 5800);
      }
      setChips([
        { id: 't10', label: '10 K', onClick: () => setTemp(10) },
        { id: 't77', label: '液氮 77 K', onClick: () => setTemp(77) },
        { id: 't298', label: '室温 298 K', onClick: () => setTemp(298) },
        { id: 't303', label: '303 K', onClick: () => setTemp(303) },
        { id: 't1811', label: '1811 K', onClick: () => setTemp(1811) },
        { id: 't5800', label: '5800 K', onClick: () => setTemp(5800) },
      ]);
      syncTempChips();
    },
  },
  {
    group: '沿革与视角',
    title: '元素发现史',
    html: `<p>人类认识元素用了几千年：古代就会使用<b>金、银、铜、铁、硫、碳</b>等（方格上标「古代」）；1669 年起化学家陆续发现新元素；<span class="hl">1860 年前后</span>光谱分析让新元素的发现速度陡增；<b>1940 年以后</b>的元素几乎全靠核反应人工合成。</p>
<p>两个关键年份：<span class="hl">1869 年</span>，门捷列夫排成这张表时人类手中只有 63 种元素，他大胆为未知元素留空并预言其性质，后来发现的镓、钪、锗证实了预言；<b>1898 年</b>前后氖、氪、氙相继出现，周期表多出了一整列稀有气体。</p>
<p>拖动年份滑杆回放：只有「发现年份 ≤ 当前年份」的元素立在台面上，<b>还没发现的位置留着灰色空位</b>——停在 1869 年数一数空位，正是门捷列夫预言的底气。左上角字幕跟着年份滚到对应大事记。</p>`,
    enter() {
      resetWorld();
      currentSection = 5;
      st.faceMode = 'year';
      paintAll();
      app.setCamera(HOME.pos, HOME.tgt);
      st.hudYear = buildHud([['year', '年份'], ['found', '已发现']]);
      applyYear(1650, false);
      ctl.clear();
      st.yearSlider = ctl.slider({
        label: '年份', min: 1650, max: 2016, step: 1, value: 1650,
        fmt: (v) => v + ' 年',
        onInput: (v) => { setYearPlaying(false); applyYear(v, false); },
      });
      st.yearPlayBtn = ctl.button({
        label: '▶ 播放发现史',
        onClick: () => {
          if (st.yearPlaying) { setYearPlaying(false); return; }
          if (st.year >= 2016) { applyYear(1650, false); if (st.yearSlider) st.yearSlider.set(1650); }
          setYearPlaying(true);
        },
      });
      ctl.slider({
        label: '速度', min: 0.5, max: 3, step: 0.5, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { st.yearSpeed = v; },
      });
      ctl.button({
        label: '↺ 重置',
        onClick: () => { setYearPlaying(false); applyYear(1650, false); if (st.yearSlider) st.yearSlider.set(1650); },
      });
      setChips([
        { label: '▶ 播放', onClick: () => st.yearPlayBtn.click() },
        { label: '1869 门捷列夫', onClick: () => { setYearPlaying(false); applyYear(1869, false); if (st.yearSlider) st.yearSlider.set(1869); } },
        { label: '1898 稀有气体', onClick: () => { setYearPlaying(false); applyYear(1898, true); if (st.yearSlider) st.yearSlider.set(1898); } },
        { label: '2016 填满', onClick: () => { setYearPlaying(false); applyYear(2016, false); if (st.yearSlider) st.yearSlider.set(2016); } },
      ]);
    },
  },
  {
    group: '沿革与视角',
    title: '三种布局与同族连线',
    html: `<p>同一张周期表的三种视角：</p>
<p><b>长式网格</b>——最常用，突出族的相似性；<b>三维螺旋</b>——依原子序数盘成一条上升的螺线，转满一圈恰好对应一个周期，<span class="hl">同族元素沿同一根"辐条"排列</span>，点出性质沿原子序数<b>周期重现</b>的规律；<b>同心环</b>——每个周期画成一圈、一圈比一圈大，第 n 圈就是第 n 周期，每圈的格数依次是 <b>2、8、8、18、18、32、32</b>，恰好等于各周期容纳的元素个数（镧系、锕系单独成两个小环）。</p>
<p>选一个族开<b>同族连线</b>：一道光束把同族元素连成一线——再切换布局，看这束光随形态如何变形（螺旋上是辐条、同心环上是同一圈上的一段）。</p>`,
    enter() {
      resetWorld();
      currentSection = 6;
      app.setCamera([2.5, 9.8, 20.2], [0, 2.8, -0.3]); // 斜视角：螺旋的高度与环的椭圆都能看清
      buildHud([['layout', '布局'], ['color', '着色'], ['beam', '同族连线']]);
      hud.set('layout', '长式网格');
      hud.set('color', '族分类');
      hud.set('beam', '—');
      legendEl.style.display = 'flex';
      renderLegend();
      ctl.clear();
      ctl.seg({
        options: [
          { label: '长式网格', value: 'grid' },
          { label: '三维螺旋', value: 'spiral' },
          { label: '同心环', value: 'rings' },
        ],
        value: 'grid',
        onChange: (v) => {
          morphTo(v, 1.2 / st.morphSpeed);
          hud.set('layout', { grid: '长式网格', spiral: '三维螺旋', rings: '同心环' }[v]);
        },
      });
      ctl.sep();
      ctl.slider({
        label: '变形速度', min: 0.5, max: 2.5, step: 0.5, value: 1,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { st.morphSpeed = v; },
      });
      ctl.sep();
      ctl.seg({
        options: [
          { label: '族', value: 'cat' },
          { label: '电负性', value: 'eneg' },
          { label: '物态', value: 'state' },
        ],
        value: 'cat',
        onChange: (v) => {
          st.colorMode = v;
          st.faceMode = v === 'cat' ? 'mass' : v;
          paintAll();
          renderLegend();
          hud.set('color', { cat: '族分类', eneg: '电负性', state: '标况物态' }[v]);
        },
      });
      ctl.sep();
      const groupBtns = [];
      const syncBeamUi = () => {
        groupBtns.forEach(({ b, g }) => b.classList.toggle('active', g === st.beamGroup));
        hud.set('beam', st.beamGroup ? `第 ${st.beamGroup} 列（${GROUP_LABELS[st.beamGroup - 1]}）` : '—');
        chipOn('beam-hal', st.beamGroup === 17);
        chipOn('beam-alk', st.beamGroup === 1);
        chipOn('beam-off', !st.beamGroup);
      };
      const GROUP_OPTS = [1, 2, 17, 18, 11, 0];
      const rowWrap = document.createElement('div');
      rowWrap.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
      GROUP_OPTS.forEach((g) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ctl-btn';
        b.textContent = g === 0 ? '✕ 关闭连线' : `第 ${g} 列 · ${GROUP_LABELS[g - 1]}`;
        b.addEventListener('click', () => { setBeamGroup(g); syncBeamUi(); });
        groupBtns.push({ b, g });
        rowWrap.appendChild(b);
      });
      controlsEl.appendChild(rowWrap);
      setChips([
        { label: '三维螺旋', onClick: () => { morphTo('spiral', 1.2 / st.morphSpeed); hud.set('layout', '三维螺旋'); } },
        { label: '同心环', onClick: () => { morphTo('rings', 1.2 / st.morphSpeed); hud.set('layout', '同心环'); } },
        { label: '长式网格', onClick: () => { morphTo('grid', 1.2 / st.morphSpeed); hud.set('layout', '长式网格'); } },
        '|',
        { id: 'beam-hal', label: '串起卤素', onClick: () => { setBeamGroup(17); syncBeamUi(); } },
        { id: 'beam-alk', label: '串起碱金属', onClick: () => { setBeamGroup(1); syncBeamUi(); } },
        { id: 'beam-off', label: '关闭连线', onClick: () => { setBeamGroup(0); syncBeamUi(); } },
      ]);
      syncBeamUi();
    },
  },
  {
    group: '沿革与视角',
    title: '随堂检测',
    html: `<p>5 道选择题，检验周期律这一节的掌握情况。</p>`,
    enter() {
      resetWorld();
      currentSection = 7;
      app.setCamera([0, 14.5, 16.5], [0, 2, -0.3]);
      lcData.innerHTML = '';
      hud = null;
      ctl.clear();
      setChips([]);
      showQuiz();
    },
  },
];

function highlightCat(idx) {
  st.catHighlight = idx;
  applyBright((z) => st.catHighlight < 0 || catIdx(z) === st.catHighlight);
  if (hud && hud.set) hud.set('cat', st.catHighlight < 0 ? '—' : CAT_NAMES[st.catHighlight]);
  if (st.legendOn) renderLegend();
  chipOn('am', idx === 0);
  chipOn('ng', idx === 8);
}

function selectBohr(z) {
  if (st.zSlider) st.zSlider.set(z);
  updateBohr(z);
  applyBright((w) => w === z);
  setHeights((w) => (w === z ? 2.3 : FLAT_H), true, 0.35);
  showInfo(z);
}

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '氯原子的电子层分布是 2、8、7。它位于周期表的第几周期？',
    opts: ['第一周期', '第二周期', '第三周期', '第四周期'],
    a: 2,
    ex: '周期数 = 原子的电子层数。氯有 3 个电子层，所以位于第 3 周期；最外层 7 个电子，位于第 ⅦA 族（卤素）。',
  },
  {
    q: '同一周期里，元素自左向右排过去（稀有气体除外），原子半径和电负性各自如何变化？',
    opts: ['半径增大，电负性减小', '半径减小，电负性增大', '两者都增大', '两者都减小'],
    a: 1,
    ex: '同周期从左到右核电荷数增大、核对电子吸引更强：原子半径逐渐减小，得电子能力增强、电负性逐渐增大。',
  },
  {
    q: '0 族（稀有气体）元素化学性质很不活泼，原因是？',
    opts: ['最外层达到稳定结构（8 电子，He 为 2 电子）', '原子半径最小', '核电荷数最大', '电子层数最少'],
    a: 0,
    ex: '稀有气体最外层 8 电子（氦为 2 电子）属于稳定结构，既不容易失电子也不容易得电子，所以化学性质稳定。',
  },
  {
    q: '第 2 周期第一电离能出现 Be＞B、N＞O 的"锯齿"，原因是？',
    opts: ['测定仪器误差', '2s、2p 能级全满或半满的结构更稳定，失电子更难', '相对原子质量不同', '它们的电负性相同'],
    a: 1,
    ex: 'Be（2s²全满）、N（2p³半满）的结构特别稳定，拿走一个电子要付出更多能量，所以电离能反而比右边相邻元素高。第 3 周期的 Mg＞Al、P＞S 同理。',
  },
  {
    q: '室温（约 298 K）下呈液态的金属单质是？',
    opts: ['溴', '汞', '水', '酒精'],
    a: 1,
    ex: '汞（Hg）是唯一在室温下呈液态的金属单质；溴是液态非金属单质；水和酒精是化合物，不是单质。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);

  function renderQ() {
    const item = QUIZ[idx];
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="q-progress">第 ${idx + 1} / ${QUIZ.length} 题</div>
      <h3></h3>
      <div class="q-opts"></div>
      <div class="q-explain"></div>
      <div class="q-foot"><span class="q-score">得分：${score}</span></div>`;
    card.querySelector('h3').textContent = item.q;
    const optsBox = card.querySelector('.q-opts');
    item.opts.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      b.addEventListener('click', () => {
        const correct = i === item.a;
        if (correct) score++;
        optsBox.querySelectorAll('.quiz-opt').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) bb.classList.add('correct');
          else if (j === i) bb.classList.add('wrong');
        });
        const ex = card.querySelector('.q-explain');
        ex.textContent = (correct ? '✓ 回答正确。' : '✗ 再想想。') + item.ex;
        ex.classList.add('show');
        card.querySelector('.q-score').textContent = `得分：${score}`;
        const foot = card.querySelector('.q-foot');
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'ctl-btn active';
        next.textContent = idx < QUIZ.length - 1 ? '下一题 →' : '查看成绩 →';
        next.addEventListener('click', () => {
          idx++;
          if (idx < QUIZ.length) renderQ();
          else renderResult();
        });
        foot.appendChild(next);
      });
      optsBox.appendChild(b);
    });
    panel.appendChild(card);
  }

  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，周期律你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panel.remove(); selectChapter(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键） ================= */

const ptShell = document.getElementById('ptShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;

/* 左栏章节列表：编组行 + 章节按钮 */
const chapBtns = [];
{
  let gi = 0;
  while (gi < SECTIONS.length) {
    const sec = SECTIONS[gi];
    const gh = document.createElement('div');
    gh.className = 'chap-group';
    gh.textContent = sec.group;
    chapNav.appendChild(gh);
    while (gi < SECTIONS.length && SECTIONS[gi].group === sec.group) {
      const i = gi;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chap-btn';
      b.dataset.idx = String(i);
      const n = document.createElement('span');
      n.className = 'chap-n';
      n.textContent = String(i + 1).padStart(2, '0');
      const tt = document.createElement('span');
      tt.className = 'chap-t';
      tt.textContent = SECTIONS[i].title;
      b.append(n, tt);
      b.addEventListener('click', () => selectChapter(i));
      chapNav.appendChild(b);
      chapBtns.push(b);
      gi++;
    }
  }
}

function selectChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) {
      b.setAttribute('aria-current', 'true');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      b.removeAttribute('aria-current');
    }
  });
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  history.replaceState(null, '', '#' + (chapterIdx + 1));
  if (st.quizPanel) { st.quizPanel.remove(); st.quizPanel = null; }
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !hud || !document.querySelector('#lcData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'periodic.foldL', r: 'periodic.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  ptShell.classList.toggle('fold-l', foldL);
  ptShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  ptShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyShellFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyShellFold();

/* 右栏三块手风琴（详解 / 控件 / 读数），localStorage 记忆、切章不重置 */
const ACC_KEYS = { lesson: 'periodic.accLesson', controls: 'periodic.accControls', data: 'periodic.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec2 = accSecs[name];
  sec2.classList.toggle('closed', accClosed[name]);
  sec2.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
function toggleAcc(name) {
  accClosed[name] = !accClosed[name];
  try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyAcc(name);
}
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => toggleAcc(name));
  applyAcc(name);
}

/* 舞台工具：视角 / 全屏 + 键盘 ←→ R F Space ] */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const viewBtn = document.getElementById('viewBtn');
const fsBtn = document.getElementById('fsBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
viewBtn.addEventListener('click', () => {
  app.setCamera(HOME.pos, HOME.tgt);
  toast('视角已复位。', 'ok');
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => toast('浏览器拒绝了全屏请求。', 'ok'));
});
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') { app.setCamera(HOME.pos, HOME.tgt); toast('视角已复位（R）。', 'ok'); }
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (currentSection === 4) { if (st.tempPlayBtn) st.tempPlayBtn.click(); }
    else if (currentSection === 5) { if (st.yearPlayBtn) st.yearPlayBtn.click(); }
  }
});

/* 提示条 */
function toast(text, kind = 'ok') {
  const old = stage.querySelector('.pt-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'pt-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

/* ================= 启动 ================= */

// 基础色缓存（实例化柱身的 per-instance 色 = 类别色 × 亮度）
const cellsBaseColor = [];
for (let z = 1; z <= 118; z++) cellsBaseColor.push(new THREE.Color(faceBgHex(z)));

function buildAll() {
  buildTopSlabs();
  buildBench();
  buildPlatform();
  buildProps();
  paintAll();
  bucketAssign(false);
  for (let z = 1; z <= 118; z++) {
    updateSlabHeight(z, FLAT_H);
    setSlabTint(z, 1, 1, 1);
  }
  refreshAllBodies();
  syncFrames();
}

function boot() {
  buildAll();
  labReady = true;
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__ptDebug = {
    vfx, app, st,
    stats: () => vfx.stats(),
    chips: () => chipsEl,
    beam: () => beamG,
    /* QA 辅助：按客户端坐标拾取元素（playwright 用，不影响页面逻辑） */
    pickTest: (cx, cy) => pickCell({ clientX: cx, clientY: cy }),
    heights: () => heights.slice(),
    slab: () => slabMeshes,
    atlasInfo: () => atlases.map((a) => {
      const d = a.ctx.getImageData(128, 128, 1, 1).data;
      const d2 = a.ctx.getImageData(8, 8, 1, 1).data;
      return { mid: [d[0], d[1], d[2]], corner: [d2[0], d2[1], d2[2]], size: [a.cv.width, a.cv.height] };
    }),
  };
  const h = parseInt(location.hash.slice(1), 10);
  const start = Number.isFinite(h) && h >= 1 && h <= SECTIONS.length ? h - 1 : 0;
  selectChapter(start);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
