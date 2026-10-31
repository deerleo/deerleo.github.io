# 报告：R01 earth 地球运动课堂 建模深度精修（Micro 级标准）+ 三栏布局收口

> 轮次：R01（实验：earth）｜ 工单：`docs/WORKORDER-LAYOUT-TEMPLATE.md`（含 3+ 建模深度精修节）
> 验收：playwright 实测 **12/12 全过** + 建模细节专项 **4/4 全过**（数值验证），三组上下文（1440 / 1000 / 375）console 零报错
> 验收脚本：`/tmp/edulab-r01-earth/{verify,detail,probe,taildebug,tailbisect,comet-side}.py`（临时目录）；截图 `/tmp/edulab-r01-earth/*.png`（17 张，重启即失）
> 改动文件：`earth/index.html` ＋ `assets/css/lab-earth.css`（新建）＋ `assets/js/lab-earth.js`（edu-core/lab.css/edu-vfx 零改动）

## 体量与性能

| 项 | 前 | 后 |
|---|---|---|
| `lab-earth.js` | 49,073 B | **92,380 B**（基准 ≥85K，目标带 90-120K ✅，+88%） |
| `lab-earth.css` | —（新文件） | 12,679 B（三栏骨架 + 折叠 + 手风琴 + 断点） |
| draw calls | ~30 | **45**（<200 ✅） |
| 三角形 | ~49k | 55,127（<200k ✅） |
| 帧率（GPU） | 60fps | **60.2fps** 稳定 |

## 一、三栏布局与全元素折叠（收口本轮入库）

- `earth/index.html` 骨架：`.earth-shell` 三栏 grid（左 `lab-chapters` 246px 章节列表 / 中 `lab-stage3d` flex / 右 `lab-detail` 352px），顶栏细条横贯；新 CSS 以 `?v=2` 引入
- 左栏 9 章竖排按钮（序号+标题），点击切章：高亮迁移 `.on` + `aria-current` + `scrollIntoView`、右栏 `detailNo/detailTitle/lesson` 联动、切章相机飞行（attachVFX cubic 运镜）
- 左右栏独立折叠（`earth.foldL/foldR`，28px 竖条：左显当前章序号、右显竖排章题），`grid-template-columns` 0.3s ease 过渡，canvas 由 ResizeObserver 跟随（实测折叠态 `cv 1384 = stage 1384`）
- 专注模式：双栏同折复用 fold 类，进入保存 `[foldL, foldR]` 退出恢复（不污染独立记忆）；右栏三块手风琴（详解/控件/读数，`earth.accLesson/accControls/accData`，切章不重置偏好，无读数章节数据块 `acc-empty` 整块收走）
- ≤1100px 首访清爽态（读数默认收）；≤860px 纵向堆叠（章节横滚 / 3D / 详解），折叠控件隐藏

## 二、建模深度精修（六项工艺逐条对账）

### 1. 主体建模（CatmullRom/车削放样 + 部件独立造型 + 材质分层）✅

- **太阳总装 `buildSunAssembly`**：光球自绘 shader（程序化米粒组织贴图 + 双级正弦 uv 扰动翻滚 + **临边昏暗**：边缘变暗转橙）+ 色球边缘壳（BackSide 加色 fresnel）+ 双层日冕射线 sprite 反向慢旋；太阳成为双模式常驻总装（近景远处 / 公转中心放大 1.12）
- **地轴总装 `buildAxisAssembly`**：替换旧细线——钢质轴杆（metalness 0.92）+ 北极**黄铜车削端**（LatheGeometry 车削轮廓 14 点：轴环→颈→鼓腹→球→尖顶）+ 南极配重尾锥 + 极区轴环 ×2（车削件观感由轮廓转折建立）；环境反射来自程序化摄影棚
- **纬线环实体化 `latRing`**：赤道/回归线/极圈由细线升级为 Torus 管环（emissive 分色）+ 内侧虚线伴随环 + 赤道 36 枚度数刻 Tick（InstancedMesh 单 draw call）
- **方向弧工厂 `makeDirArc`**：弧管 TubeGeometry + 雪佛龙 ×3 + 端头箭锥，自转/公转箭头共用；走向与真实转向一致（见「三、修复记录」第 1 条）
- **教具图钉 `makeMapPin`**：北京/直射点升级锥杆 + 发光珠头 + 切面光环图钉，径向朝外摆放（直射点每帧拨四元数 + 光环脉动）

### 2. 场景叙事（环境语境道具阵列）✅

- **彗星道具**：开普勒椭圆轨道（牛顿迭代 4 步解 E，近日点加速可见）+ 彗核（Icosahedron 脏冰材质）+ 彗发（近日增亮呼吸）+ **双尾粒子**——离子尾（青蓝、反日向）+ 尾芯（窄锥高亮）+ 尘埃尾（暖色、沿轨道滞后弯曲）；尾长随日距变化 `clamp(52/dist)`；标注「彗星（示意轨道）」
- **深空叙事阵列**：银河带 fbm 星云 sprite ×5（倾斜大圆带、tint 渐变）+ 旋涡星系 ×3（对数螺臂点阵 + 核球暖晕 + HII 区点缀）+ 四针衍射亮星 ×6（色温各异）
- **公转教具组**：黄铜车削月份针 ×4（底座+针杆+顶珠）、近日点/远日点金菱标记

### 3. 材质工艺（PAL + 四级材质工厂）✅

- 新增材质全部走 edu-vfx 工厂：`matStd`（钢杆/黄铜/图钉杆/彗核，metalness 分区 0.85-1）、`matCoat`（黄道/赤道面盘）、`matGlow`（图钉珠头/弧管）；金属件复用 `PAL.brass`
- 本实验本地太空族色板 `SKY`（深空黑背景高对比；与 PAL 通用金属色配合；登记路径：待后续统一进 PAL 的实验本地族，micro 的 M_PAINT 系本地材质同例）
- 发光部件 emissive 与观感联动：管环/图钉/月份珠 emissive 分档；本实验无 fluor 章节，illus 单模式

### 4. 光照氛围 ✅

- `makeStudioEnvironment(renderer)` 程序化摄影棚（金属件 PBR 反射；地球自绘 shader 与云层 Lambert 不受影响）
- 低环境 0.42 + 冷色银河补光 `starFill`（夜侧金属件不死黑）+ 半球环境

### 5. 程序化纹理（CanvasTexture 密度对齐 micro）✅

- `sunGranulationTexture`：1024×512 等距圆柱——2600 米粒胞元（亮核/暗缘两遍）+ 60 超米粒 + 3 组黑子（本影椭圆 + 半影晕 + 伴生微孔）+ 50 光斑，同 seed 可复现
- `coronaRayTexture`：140 条随机长度软射线 + 内核晕 + 中层辉光（双 seed 双层）
- `orbitGraduatedTexture`：2048² 环面——12 月名（月中位置）+ 365 日刻（每 10 日加强 + 二分二至金刻）+ 内圈度数环；角度映射经 rotate(π/2−φ) 推导并与世界方位对齐（俯视截图实测月份与地球位置吻合）
- `spiralGalaxyTexture` / `nebulaTexture` / `softDotTexture` / `diffractionStarTexture`（星系旋臂点阵 / fbm 团块 / 柔粒子 / 衍射星芒）

### 6. 互动可视反馈 ✅

- 太阳米粒翻滚与日冕慢旋由 `dt × state.speed` 驱动（暂停即凝滞、调速即变速）
- 彗星开普勒运动随全局播放/速度；日期滑杆与相机飞行逻辑零改动
- 黄赤交角演示装置（黄道面盘 + 赤道面盘 + 二分线 + ε=23°26′ 交角弧）接入总览/公转/直射点三章「黄道面与交角」开关，帧循环指数缓动淡入淡出（切章不生硬）
- 直射点光环脉动；暮光带随晨昏面同转

## 三、修复记录（自查发现并修复）

1. **自转方向箭头走向与实际自转相反（存量 bug）**：旧弧线参数 t 递增走向，隐含角速度 −ŷ，与 `spinG.rotation.y` 递增（+ŷ，北极上空逆时针）相反。重写为 `makeDirArc`（t 递减 + 切向 (sin t, 0, −cos t)），数值验证：770ms 实测 Δrotation.y=+0.44 且箭头隐含 ω 轴与自转轴同向（detail.py D1）。
2. **彗尾坐标系错位（本轮自引入，特写截图发现）**：`updateTail` 误以世界坐标写入 Points 顶点，而 Points 是 cometG 子组 → 渲染位被二次平移至 2× 彗星距离（大红灯实验实锤：强制 size 1.2 纯红仍不可见）。改为彗星本地系写入（cometG 仅平移，方向量直用），双尾随即正确呈现。
3. **暮光带几何轴向 90° 错位（本轮自引入）**：球面纬带带轴 +Y 与晨昏环面法向 +Z 相差 90°，暮光带横躺。`geometry.rotateX(π/2)` 修正后数值验证 |dot(带法向, 太阳方向)| = 1（detail.py D3）。

## 四、验收结果（工单清单逐项）

| 项 | 结果 |
|---|---|
| node --check 全过；console 零报错（宽屏/1000/375 三组） | ✅ 三组 0 error/pageerror；ESM 语法过 |
| 三栏同显（246/842/352）；左列表切章、高亮迁移、相机飞行、右栏联动 | ✅ A2/A3：切第 2 章 on=1、标题联动、机位移动 >0.5 |
| 建模体量 ≥85K；draw call <200；GPU 60fps | ✅ **92.4K**；45 calls / 55,127 tris / 60.2fps |
| 左/右折叠 + 手风琴全可用；极限折叠 3D 独占 | ✅ A7/A8/A10：28px 竖条 ×2、canvas 跟随、专注模式、手风琴 body 高 0 |
| localStorage 刷新保持；≤1100px 清爽态；375px 纵向堆叠 | ✅ A9/B1/C1：双折刷新恢复、1000px 读数默认收、375 单列无横滚 |
| 章节全遍历零报错；quiz 保留可用 | ✅ A4/A5：9 章遍历 0 报错、quiz 面板 4 选项可答 |
| 建模细节截图放大自查 | ✅ 6 张特写逐项过目（见下表）+ 4 项数值验证全过 |
| 工艺合规零命中原版 | ✅ 22 个新标识符（keplerPoint/sunGranulationTexture/makeDirArc/latRing 等）对 `/tmp/wedulab_ref/dec/earth.js` 逐一 grep **0 命中**（唯一 "SKY" 命中为原版 2D 面板标题「SKY PLAN」子串，非标识符）；「近日点（1 月初）」等措辞与原版 DOM 标签已作标点区分，纬线名称（北回归线 23°26′N 等）为教材通用定名 |
| noindex + 署名保留；不改 cards.json；未 git push | ✅ `noindex,nofollow` 在、页脚 EduLab · milulab.com、cards.json 未动、未 push |

## 五、建模细节特写清单（/tmp/edulab-r01-earth/）

| 文件 | 内容 | 结论 |
|---|---|---|
| `10-detail-axis-finial.png` | 地轴北极特写：黄铜车削端（轴环→颈→鼓腹→球→尖顶）+ 极区轴环 + 钢杆 + 环境反射 | 车削件观感成立，轮廓转折清晰 |
| `11-detail-sun.png` | 光球特写：米粒胞元 + 黑子对本影/半影/伴生微孔 | 近距放大不穿帮 |
| `12-detail-ring-top.png` | 全轨道俯视：刻度环 12 月名与地球位置吻合、二分二至金刻、近日点/远日点金菱、公转方向箭头与实际走向一致（逆时针）、彗星轨道虚线、地球带黄道/赤道面盘 | 教学正确性全景证据 |
| `13-detail-comet.png` / `16-detail-comet-side.png` | 彗核 Icosahedron + 彗发 + 标注；侧视双尾（青蓝离子尾 + 暖色尘埃尾） | 双尾形态读得出 |
| `14-detail-plane-demo.png` | 黄道面盘 + 赤道面盘 + 二分线 + 回归线/极圈管环标签 + 直射点图钉 | 装置齐整 |
| `15-detail-twilight-fixed.png` | 晨昏线虚线主环 + 暮光带贴合晨昏面 + 标注 | 修复后对齐 |
| `01~07-*.png` | 四态（全展开/折左/折右+双折/专注）+ 各章全景 + 375px | 布局四态全过 |

## 六、备注

- 教学内容（SECTIONS 讲义/quiz/HUD 公式）零改动；控件仅新增「黄道面与交角」开关（总览/公转/直射点三章）。
- 「黄道面与交角」开关、太阳标签、彗星、深空道具均为新增教具层，不影响既有章节切换/quiz/读数回归面。
