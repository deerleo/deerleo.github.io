# EduLab periodic（元素周期表）Micro 级深改 · 改造报告

> 收口 commit `51c28d9`（未 push）。V3 五关全过，playwright 44/44，console 零报错零警告。
> 本轮接手状态：前序派发实例已产出 131K 版 lab-periodic.js（三栏/建模/交互主体完整）但从未质检、未提交——本轮按 V3 五关全量实测后收口，期间揪出 **5 个前段遗留 bug（含 1 个全帧黑屏级）** 全部修复。

## 一、体量数据（V3 第 2 关）

| 项 | 数值 | 基准 |
|---|---|---|
| `lab-periodic.js` | **132,870 B ≈ 129.8 KB**（2,913 行） | 原版 80 KB → **1.62×**（要求 ≥1.0 ✓） |
| `lab-periodic.css` | 20,128 B（723 行，新文件） | — |
| `periodic/index.html` | 6,924 B（三栏骨架 246/flex/352） | — |
| 顶层函数/构建器 | 92 个 | 原版 269 函数（含混淆内部结构，体量以 KB 口径为准） |
| CanvasTexture 矢量绘制 | fillStyle 25 处 / canvas 工厂 16 处 | 密度证据 ✓（118 格贴图集×2 张 2048²、族标尺、温度计刻度、试剂瓶标签、门捷列夫手稿卡、展台铭牌、接触阴影） |
| 材质节点 | 27 处 Material（四级工厂 matStd/matCoat/matGlow/matGlass 全用） | ✓ |

## 二、功能 1:1 映射表（V3 第 1 关，原版 7 个教学文案块全覆盖）

| 原版课题块（title 提取） | 自研实现 | 状态 |
|---|---|---|
| 认识周期表 | 第 1 章：118 格贴图集展台、属性柱 6 项 seg（原子序数/半径/电负性/电离能/熔点/密度）、族图例点亮（10 行可点）、hover 高亮+点击特写卡（含用途行）、chips（点亮碱金属/稀有气体/金的特写） | ✓ |
| 电子层与周期 | 第 2 章：Bohr 车削展台+核子团簇（质子/中子双桶 InstancedMesh）+轨道环+电子拖尾+层数标注，滑杆选元素/随机/自转 | ✓ |
| 原子半径与电负性 | 第 3 章：半径/电负性柱切换、周期聚焦滑杆、趋势标注、侧视角/俯视角 | ✓ |
| 电离能的锯齿 | 第 4 章：锯齿折线图窗（Canvas 折线+红圈标注 Be＞B、N＞O，第 2/3 周期切换）、电离能/电负性/熔点柱切换（He 2372 峰值 HUD） | ✓ |
| 物态与温度 | 第 5 章：温度滑杆 0-6000K、6 个快捷档（10K/液氮77/室温298/镓303/铁1811/太阳表层5800）、播放升温扫描、固液气三分桶渲染（气态线框升起）、金属白炽叠加层（加色 InstancedMesh+暖光）、统计 HUD（298K=固89·液2·气11·未知16）、未知灰显 | ✓ |
| 元素发现史 | 第 6 章：年份滑杆+播放、残影空位（未发现格灰色立牌，1869 年 65/118 可数）、大事记字幕随年份滚动、门捷列夫/稀有气体/2016 满点 chips | ✓ |
| 螺旋与同心环 | 第 7 章：三布局 morph（长式网格/三维螺旋/同心环）、变形速度、族/电负性/物态着色、同族连线光束（morph 时隐去落定重建）、族图例 | ✓ |
| （原版无 quiz） | 第 8 章：随堂检测 5 题（判分/解析/成绩单/重测/返回一章） | 自研加强 ✓ |

全局：顶部细条/主题切换保留、noindex 保留、键盘 ←→/R/F/]/空格。

## 三、本轮修复的前段遗留 bug（playwright + 帧缓冲取证揪出）

1. **顶板缺 normal attribute → UnrealBloom 全帧黑屏**（致命，本轮主案）：buildTopSlabs 只建 position/uv/color——MeshPhysical 材质在 normalize(0) 处产生 NaN 写进 HalfFloat RT，bloom 读到 NaN 后**整个画面输出黑**（headless/Metal 全中招，draw call 停在 37/7111 即此因）。取证路径：手动 renderer.render() 直渲有画面 → composer 全黑 → 逐 pass 隔离（noBloom 正常）→ world 逐对象二分锁定两张顶板 → 材质矩阵全排除 → 几何换元实锤 → computeVertexNormals() 复验恢复。修复：构建时手写精确法线（顶面 (0,1,0)、四条侧裙按边序水平朝外）。
2. **118 格顶板全部叠在原点**（同源 bug，L770 注释记录过同款「identity 实例炸 bloom」但顶板未修）：格子局部坐标（±0.46）未烘入 gridPos 平移，bbox 实测全叠原点上方 0.92² 区域。修复：构建时烘入 POS.grid 平移。
3. **morph 时顶板不同步**：morphTo 只更新 instanced 柱身，顶板 x/z 顶点留在旧布局——三布局切换撕裂错位。修复：新增 updateSlabXZ（20 顶点角点表驱动），morph tween 逐帧同步 + resetWorld 归位 grid。
4. **图例/趋势/时间轴/信息卡四个 overlay 开关失效**：CSS `.pt-legend/.pt-timeline/.pt-info` 各有 `display:none`，JS 打开时 `style.display=''` 清空行内后回退 CSS 的 none——特写卡/大事记字幕/族图例用户永远看不到（此前 DOM 层测试假阳性）。修复：JS 显示值改显式 `flex`/`block`，CSS 删三处 display:none（初始隐藏由 JS 行内管理）。
5. **合规 4 处原版文案逐字命中**：「同一族的元素落在同一条」「看这条线怎样跟着变化」「光谱分析法带来一波发现高峰」「太阳表面 5800 K」→ 全部改述（语义保持）；29 段原版长文案滑窗复验零命中。

另按 pea 轮「同类 bug 提示」复核：本实验无 mergeStatics、无双重 `.tex` 写法，干净。

## 四、构图终审重调（V3 第 3 关）

- HOME（0,11.8,13.4）太近：整表左右满溢裁切 → 改 **(0, 14.8, 24)/tgt(0,0.1,0.6)**，整表完整入画+台面呼吸空间+场景叙事道具全入画（cam-a/b/c 三档实测取 c）
- SIDE_CAM（15.2,2.0,1.6）太低太近且右下穿帮 → 改 **(14.5,6.5,14.5)/tgt(0,1.4,0)**，45° 侧俯视可读柱高起伏
- 8 章逐章截图目检：Bohr 特写/折线窗/温度扫描/发现史残影/三布局 morph/quiz 全部构图合理

## 五、V3 五关实测结果（playwright `/tmp/periodic-gate.mjs`，44/44）

| 关 | 结果 | 证据 |
|---|---|---|
| 1 功能 1:1 | **通过** | 8 章注册/切章高亮联动；属性柱切换柱高实测变化（34,34,34→37,38,40）；图例 10 行点亮；chips 点亮；特写卡（用途行+关闭）；Bohr 选钠 2·8·1；锯齿图窗+周期切换+换熔点柱隐藏；298K 液2气11；303K/5800K/播放升温；1869 年 65/118 残影、2016 满 118；三布局 morph+卤素光束；quiz 判分/解析/成绩/重测 |
| 2 体量密度 | **通过** | 129.8 KB = 1.62×；fillStyle 25 / canvas 工厂 16 / 材质 27 |
| 3 视觉终审 | **通过** | 直读 20+ 截图（/tmp/periodic-shots/）：1440/1280/1100/860/375 五档、折叠四态、专注模式 3D 独占构图居中、375 纵向堆叠无横滚、8 章构图逐章目检、贴图小字（符号/原子量）可辨 |
| 4 运行品质 | **通过** | console 零报错零警告（五档宽度+全章节遍历）；draw call **124**<200（修复后顶板入画）/ tris 27,487；**GPU 60fps×4 段全平**；堆 19.3MB 恒定 |
| 5 合规 | **通过** | 原版中文文案 29 段滑窗逐字命中清零；noindex 保留；EduLab·milulab 署名保留；共享文件零改动（commit 仅含 periodic 三件） |

## 六、交付物

- `edulab/periodic/index.html` + `edulab/assets/css/lab-periodic.css` + `edulab/assets/js/lab-periodic.js`（commit `51c28d9`，仅 periodic 三件；plant/pythagoras 通道文件未动、未暂存）
- `periodic.done` 已落 `/Users/leo/.cache/edulab-layout/`；测试服务器（:8901）保留供主控终审复用
- 截图留档 `/tmp/periodic-shots/`（gate 逐项截图 + 8 章构图 + 折叠四态 + 375）

## 七、给主控终审的提示

- 本实验与 pea 同批产出，**pea 点名的两类公共风险（mergeStatics 双重变换/双重 .tex）本实验核实不存在**
- 顶板「缺 normal → bloom 全帧黑」是**成批写法风险**：自研合并 BufferGeometry + lit 材质（Physical/Standard）的组合若忘建 normal 都会中招，建议后续轮次（plant/pythagoras 同批）终审时用「直渲 readPixels 有画面、composer 全黑」这一指纹快速排查
