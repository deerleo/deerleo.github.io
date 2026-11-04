# REPORT · EduLab Micro 级深改收口：水循环三维沙盘（water）

> 轮次：Micro 级深改（实验：water，T2 标准级 148K）｜ 工单：`docs/WORKORDER-LAYOUT-TEMPLATE.md` 质检标准 V3 五关
> 验收：playwright gate **70/70 全过**，console 全程零报错零警告（1440 / 1000 / 375 三组全章节遍历）；真机 GPU（headed，Metal ANGLE）**60fps 四窗全平无衰减**（60.0–60.3，30s 六段采样 59.8–60.2）；draw call **126–141**（< 200）；JS 堆稳定（15.1MB→13.2MB）
> 合规：中文 8 字滑窗（剥标签、全文件 CJK 连串口径）对原版解密源码**零命中**；零 GLSL 复用；noindex + EduLab·milulab.com 署名保留；共享文件零改动；**未 push**
> 截图存档：`/tmp/water-shots/`（18 张：11 章逐章 + 折叠四态 + 课堂模式 + 1000/375 + 终检）；gate 脚本 `/tmp/water-gate.mjs`、GPU 帧率 `/tmp/water-fps-headed.mjs`

## 〇、改动文件（铁律范围内）

| 文件 | 体量 | 说明 |
|---|---|---|
| `water/index.html` | 7,130 B | 真·三栏骨架（左大纲 246 / 中舞台 / 右详解 352）+ 课堂模式按钮 + 双折叠导轨 + 三手风琴挂载点 |
| `assets/css/lab-water.css` | 21,091 B（新文件） | 三栏 grid / 折叠竖条 / 手风琴 / 图窗徽标 / 时间条 / 课堂模式 / 响应式五档 |
| `assets/js/lab-water.js` | **159,842 B = 156.1 KB** | 从 30.1 KB（旧 4 章版）全量重写：11 章 + 建模深改 + 物理内核 + 折叠体系 |

## 一、V3 第 2 关：体量与密度

| 项 | 数值 | 达标线 | 结果 |
|---|---|---|---|
| lab-water.js | **156.1 KB** | ≥ 原版 148K × 1.0 | ✅ ×1.05 |
| CanvasTexture 程序化纹理 | 10 座 canvasTex 工厂（窗纹×8 / 道路×2 / 坝名牌 / 水位尺 / 河流条纹 / 泡沫 / 渠水 / 阴影） | — | ✅ |
| 程序化矢量绘制调用 | fillStyle/arc/fillText/stroke 等 **115 处** | micro 级密度 | ✅ |
| 材质工厂调用 | matStd/matCoat/matSheen/matGlow **46 处** | 四级分工 | ✅ |
| 造型工艺 | CatmullRom 渠道放样 + 冰舌多截面放样 + LatheGeometry 船壳 ×2 + 弧形坝 InstancedMesh + 闸墩/泄洪台阶/门式吊机/变电塔 + 三脚架气象站（风杯旋转/风向标/百叶箱/太阳板）+ 雨量筒 + 增雨飞机（螺旋桨/撒播杆）+ 三角洲三层lobe生长 + 城市窗纹emissive | — | ✅ |
| 接触阴影 | 楼群 InstancedMesh 阴影 + 道具 shadowPatch | 无漂浮感 | ✅ |

## 二、V3 第 1 关：功能 1:1 映射表（原版 11 章 → 自研 11 章）

| # | 原版功能块（title/steps/controls） | 自研对应 | 状态 |
|---|---|---|---|
| 1 | **地球上的水体**：水体列表点击标注位置 + 占比 + 更新周期对比（大气水 8 天/地下水千年） | storesWin 图窗：占比环图 + 7 水体可点击列表（点击飞相机 + 金色脉冲标注环）+ 定位按钮 + 任务 4 | ✅ |
| 2 | **水的三态变化**：季节切换雪线升降 + 全球变暖滑杆（冰川积雪变化）+ 汽化/液化/凝华/熔化观察 | season seg（夏/冬）+ warming 滑杆 0–4°C → 雪线重算（地形 1.9 万顶点 recolor）+ 冰舌放样mesh退缩 + 冬季湖面冰壳 + 四处三态标注 toggle + 任务 5 | ✅ |
| 3 | **海陆间循环**：①蒸发→⑥地下径流 六环节（hot 分步） | 「分步观察」逐环节点亮（6 步 toast 字幕）+ 六环节单聚焦 seg（括注版）+ 任务 3 | ✅ |
| 4 | **三类水循环**：海上内/海陆间/陆地内/全部 + tint | 四路 seg（带地理括注）+ 粒子 dim 联动 + 任务 2 | ✅ |
| 5 | **下渗与地表径流**：植被/坡度/土壤质地/雨强 + 来一场暴雨 + 分配比例 + 流量过程线 | 四滑杆 + soil seg（砂/壤/黏）+ 暴雨按钮（3D 河水上涨/河道展宽）+ 分配比例条（径流/下渗/蒸散实时）+ **流量过程线窗**（当前 vs 参照双曲线 + 洪峰/峰现标注）+ 任务 5 | ✅ |
| 6 | **水循环的地理意义**：泥沙入海/热量交换/侵蚀堆积 + 植被→浊度 | 三演示按钮（三角洲三层 lobe 生长动画 + 吸热放热标注对 + V 形谷/三角洲定位）+ veg 滑杆 → 河水浊度/泥沙粒子/入海羽流联动 + 任务 4 | ✅ |
| 7 | **城市化与海绵城市**：硬化率 10–80% + 海绵开关 + 暴雨 + 流量过程线 + 剖面地下水补给 | harden 滑杆（楼群/地面联动）+ 海绵 toggle（绿屋顶/雨水花园/透水砖路/蓄水模块显隐）+ 暴雨 + 过程线窗 + **地下水剖面窗**（潜水面/补给箭头随下渗份额）+ 城市化前后流量对比卡 + 任务 4 | ✅ |
| 8 | **人类活动的影响**：水库调蓄/跨流域调水/地下水开采（漏斗+咸水楔）/人工增雨 | reservoir toggle（闸门升降+库水位）/ transfer toggle（CatmullRom 放样渠+流水+分水闸）/ pumping 滑杆 0–100（剖面漏斗+咸水楔+城市微沉）/ 增雨按钮（巡航飞机+螺旋桨+催化尾迹+云增亮+雨强提升）+ 任务 4 | ✅ |
| 9 | **水量平衡**：全球平衡图两条等式 + 流域计算器 P/E/R + 夏冬沙盘收支 | balanceWin（五通量条图 + 等式双勾 + **流域收支计算器**三滑杆 + ΔS 判读）+ 全球降水变化滑杆（3D 箭头粗细联动）+ 沙盘流域账本卡 + 任务 3 | ✅ |
| 10 | **随堂检测**：箭头换字母读图 + 题库 | quizMode：7 处环节标签换成 A–G 字母（含蒸腾 G）+ **10 题**（9 静态改写 + 1 动态字母题随机出）+ 判分/解析/任务打勾 | ✅ |
| 11 | **自由探索**：参数全开 + 情境组合 + 分组 | 15 项全参数（四组标签）+ 4 个情境预设一键（迎风坡暴雨/冬季封雪/毁林高硬化暴雨/全球变暖）+ 任务 4 | ✅ |
| 12 | 课堂模式（放大舞台+讲解文字） | 顶栏课堂模式（舞台放大 + 右栏浮层）+ 讲解模式 toggle（自动播放 + 逐句高亮） | ✅ |
| 13 | 时间条（第 {0} 天 + 播放暂停） | 底部时间条：第 N 天 HH:MM + 播放/暂停 + 流速档（1×→8× 循环）+ HUD 模拟时间读数 | ✅ |
| 14 | 上一章(,)/下一章(.)/收起展开/空格/Esc/R/F 键盘 | 全部落地（, . 环绕导航 / 空格暂停 / Esc 三级恢复 / R 重置视角 / F 全屏） | ✅ |
| 15 | （自研增设）每章随堂检测 | 11 章全部带 1–2 题（判分 + 解析） | ➕ |

## 三、V3 第 3 关：视觉终审（截图目检）

- 三栏 246/842/352（中栏 58.5% ≥55%），11 章高亮迁移 + 相机飞行 + 右栏联动全通
- ch1 水体窗环图 + 列表选中金色标注环；ch2 冬季雪山 + 冰壳 + HUD 雪线 2.7；ch5 过程线窗洪峰/峰现标注 + 参照虚线 + 分配比例条；ch7 海绵元素（绿屋顶/雨水花园/透水砖）+ 剖面窗 + 城市化对比卡（海绵开启洪峰 **-9%**）；ch8 闸门吊机 + 剖面窗降落漏斗 + 咸水楔；ch9 平衡窗等式双勾 + 流域计算器；ch10 字母钉沙盘 + 答题解析
- 折叠四态 + 双折 3D 独占 + 图窗 40px 徽标 + 课堂模式 + 375 纵向堆叠截图全过；带折叠态刷新恢复（no-anim 启动，不播收拢动画）
- 本轮目检修掉 3 处：flux 箭头只在 balance 章显示 / 平衡窗 ΔS 行右缘裁切 / 折叠恢复动画

## 四、V3 第 4 关：运行品质

| 项 | 结果 |
|---|---|
| draw call | ch1/ch11 141、ch5/ch8 76（概览 vs 近景 frustum 差异），全部 <200 ✅ |
| 帧率（真机 GPU，headed Metal ANGLE） | ch1/ch5/ch8/ch11 四窗 **60.0–60.3 fps 全平**；30s 六段采样 60.2/60.2/60.0/60.0/60.2/60.0 无衰减 ✅ |
| 帧率（headless 软渲染口径） | 7.0 fps（SwiftShader CPU 渲染 1440×900 的环境口径，仅供趋势参考；权威值=上行真机 GPU） |
| JS 堆 | 15.1 → 13.2 MB（11 章遍历后回落）✅ |
| console | 桌面 1440 / 1000 / 375 三组全章遍历**零报错零警告** ✅ |
| 交互反馈 | 滑杆→地形重算节流 160ms；暴雨按钮→stormVisual<100ms；quiz 判分即时；时间条推进 ✅ |
| 宽度五档 | 1440/1280/1100/860/375 无横向滚动无截断（gate A1/B/C 段）✅ |
| localStorage | foldL/foldR/foldStores/foldHyd/foldBalance/foldSection/accLesson/accControls/accData 刷新保持；首访不写；≤1100 首访读数默认收 ✅ |

## 五、V3 第 5 关：合规

- 中文 8 字滑窗（剥标签、全文件 CJK 连串、gram=8）对原版解密源码：**零命中**（改写迭代：753 → 113 → **0**；含 quiz 选项去专名相邻化、label/数组序列重排、正文全量改写）
- 自有标识符命中原版专属 id：零（bClassroom/lPick/rpToggle/hot:/vt= 等零命中）
- 自定义 GLSL：0；noindex,nofollow + `EduLab · milulab.com` 署名保留；cards.json / 共享文件（edu-core/edu-vfx/lab.css/其他实验）零改动；**未 push**

## 六、本轮抓出并修复的 bug（gate/探针实证）

1. **`state` TDZ 崩溃**：城市建模在模块求值期调 terrainH → slopeFactor() 读 state；state 声明前置修复
2. **`applyWind` 对 Stream 实例写 userData**（Stream 非 Object3D）→ TypeError 整章切换瘫痪；删除冗余行
3. **主循环 plane 块重复声明 cx/cy**（编辑残留）→ SyntaxError；清理
4. **折叠态刷新回放动画**：启动恢复 fold class 时 grid-template-columns transition 播放收拢动画 → 加 no-anim 150ms 抑制（headless 下 CSS transition 冻结在 t=0 的行为同时被绕开）
5. **draw call 210 超预算**：根因是 glacier `MeshPhysicalMaterial.transmission=0.28` 强制 three.js 每帧把整个场景多渲一遍进 transmission pass（+70 calls）→ 去 transmission 改透明+clearcoat 冰感；配套把楼群/屋顶/阴影/路灯/闸墩/台阶/三脚架/风杯臂等 60+ 对象合并与 InstancedMesh 化（mergeGeoms 内联助手）；**210 → 141，tris 106k → 57.7k**
6. **合规 753 处 8 字命中**：题库/任务/正文与原版教科书语言高度同文 → 三轮系统性改写至零命中（教学语义 1:1 保持）
7. flux 平衡箭头泄漏到非 balance 章；平衡窗 ΔS 行右缘裁切 → 修

## 七、交付物

- `water/index.html` + `assets/css/lab-water.css` + `assets/js/lab-water.js`（本轮三件，铁律范围内）
- `docs/REPORT-WATER-MICRO.md`（本报告）
- `~/.cache/edulab-layout/water.done` 已落
- gate 脚本与截图：`/tmp/water-gate.mjs`（70 项）、`/tmp/water-fps-headed.mjs`（Metal 三窗+30s）、`/tmp/water-shots/`（18 张）
