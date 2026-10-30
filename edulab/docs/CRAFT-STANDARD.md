# EduLab 视觉工艺标准（edu-vfx）

> 适用：所有带 3D 场景的实验（首批示范：cell / micro；待推广：其余 37 个）。
> 工艺模块唯一真源：`assets/js/edu-vfx.js`；本文件只写「怎么接入、怎么选材、怎么配色」的使用规范。
> 授权约束沿用 README：工艺思想对标原版调性，代码全部自研，禁止复制。

## 一、三行接入（所有实验统一）

```js
import { attachVFX } from './edu-vfx.js';                 // ① 引入共享工艺模块
const app = createApp({ container: stage, keepBackground: true, /* 相机参数 */ });  // ② keepBackground 必开
const vfx = attachVFX(app, 'illus');                      // ③ 接管渲染循环与相机缓动
```

接入后发生什么（不要自己重做）：

- 渲染循环改为后处理管线输出（RenderPass → Bloom → 精修 → OutputPass），`app._renderHook` 被接管，**不要再调 `cameraTweenTick`**；
- `app.setCamera(pos, target)` 升级为 easeInOutCubic 立方缓动的运镜（1.1s），章节切换直接调用即可；
- 背景由模式管理（illus = 深色渐变棚拍，fluor = 纯黑）；`keepBackground: true` 防主题系统覆盖。

可用 API：

| API | 用途 |
|---|---|
| `vfx.setMode('illus' \| 'fluor')` | 切换观感模式（荧光/暗视野类章节用 fluor） |
| `vfx.flyTo(pos, target, dur)` | 自定义时长的运镜 |
| `vfx.stats()` | `{ calls, tris }` draw call 自查 |
| `vfx.composer` | 需要再加 pass 时用（一般不需要） |

micro 的暖调背景差异：`attachVFX(app, 'illus', { bg: 'studio-warm' })`，其余实验默认 teal 即可。

## 二、观感模式（预置两种，参数集中在 VFX_MODES）

| | illus 科学插画 | fluor 荧光显微 |
|---|---|---|
| 曝光 | 1.05 | 1.2 |
| bloom | 0.45 / 0.6 / 阈值 0.86（柔和高光） | 0.85 / 0.7 / 阈值 0.08（低阈值全画面泛光） |
| 暗角 / 颗粒 | 0.38 / 0.028 | 0.55 / 0.05 |
| 色差 | 无 | 0.0016 |
| 背景 | 深青渐变棚拍 | 纯黑 |

- **什么时候给 fluor 开关**：以"荧光染色/暗视野观察"为教学点的章节（如细胞骨架）；
- 需要配套调暗非发光材质时，用 `registerGlow(list, mat, illusI, fluorI, { illusO, fluorO })` 登记 + `applyGlowMode(list, mode)` 一键切换（发光强度与可选透明度），并在章 `leave()` 里 `setMode('illus')` 复位——**参照 lab-cell 的 `setCellMode`**；
- 只降透明度不降 emissive 会导致荧光模式整画面泛白（cell 首跑实测），两者要一起拨。

## 三、色板规范（PAL）

- **只从 `PAL` 取色**，禁止页面内裸写十六进制（调性一致性是色板存在的意义）；
- 同一器官族有亮/暗两档（如 `membrane` / `membraneHi` / `membraneDeep`）：膜壳用亮档、截面封边用暗档；
- 新增颜色先判断属于哪个族（暖膜 / 深青胞质 / 紫核 / 橙黄能量器官 / 植物绿 / 骨架荧光），都不属于再进 PAL 并在此登记；
- PAL 值全部按「深色背景高对比」挑选，换浅色背景策略时需整体重校。

## 四、材质分级规范（三层）

| 层级 | 工厂 | 适用 | 关键参数 |
|---|---|---|---|
| **主体**（观众视线焦点） | `matSheen` / `matCoat` | 细胞质/核质（绒面）、一切膜壳/镜身漆面（亮面包裹层） | sheen 0.5-0.62 或 clearcoat 0.8-1 + clearcoatRoughness 0.16-0.28 |
| **发光成分** | `matGlow` | 线粒体基质、核仁、染色体、荧光骨架、运输粒子 | illus 0.3-0.5 / fluor 1.6-2.6 两档登记 |
| **次要**（支架/底座/小件） | `matStd` | 桌腿、饰件、玻璃瓶盖、封边条 | 默认 roughness 0.6 |
| **玻璃/镜片** | `matGlass` | 目镜物镜镜片、试剂瓶身、载玻片 | transmission 0.82-0.92 + ior 1.52 |

硬规则：

1. **膜壳一律 ghost 化**（`ghostify(mat, 0.3-0.55)`：transparent + depthWrite false + DoubleSide）——内部构造必须可透视，这是"科学插画"的基本语法；
2. metalness 只给金属件（镀铬/黄铜 ≤1，漆面 ≤0.12）——漆面 metalness 拉高会把 clearcoat 反射变黑（micro 镜身首跑实测）；
3. 金属/玻璃的反射来自 `makeStudioEnvironment(renderer)`（PMREM 程序化摄影棚，按 renderer 缓存零开销），**不要引外部 HDR**。

## 五、程序化纹理与几何规范

- **木纹** `makeWoodTexture({ base, dark, light, streaks, bands, planks, seed })`：所有木面用同族配色 + 不同 seed 出变体；`RepeatWrapping` + repeat 按表面积配（桌面 2.2,1.6 基准）；
- **标签/化学式** `makeLabelTexture(lines, opts)`：纸底 + 边框 + 居中多行，用于试剂瓶/盒子的标识；
- **有机剖壳** `makeCutShell({ radius, thickness, wedge, amp, freq, seed, mats })`：fbm 顶点噪声雕刻 + 剖面封边条（内外壳共享同一位移场，切口严丝合缝）；生物主体（细胞/杆菌）用它，禁止裸 SphereGeometry 素模；
- **剖开胶囊** `makeCutCapsule`：线粒体/杆菌等"两端圆中间直"器官的剖开形态；
- **噪声** `fbm3(x, y, z, seed)`：页面内的轮廓扰动、曲线摆动都用它（同 seed 可复现）；
- 顶点位移类几何构建成本 ≈ 每壳 5-10ms，滑块类交互重建时**整组替换 + 旧几何 dispose**（参照 lab-cell `buildCellShell`）。

## 六、性能预算（验收线）

| 指标 | 预算 | 现状（cell / micro 实测） |
|---|---|---|
| draw call | < 200 | 98 / 171 |
| pixelRatio | ≤ 2 | createApp 已封顶 |
| 三角形 | < 200k | 54.5k（cell） |
| 帧率稳定性 | 30s 无衰减、堆无增长 | 60fps（GPU）分段 10,9,9,10,10,8→不衰减（软渲染口径），堆 13MB 恒定 |
| console | 零报错 | 双页全章节遍历零报错 |

省 draw call 的习惯：同类散点用 `InstancedMesh`（核糖体/核孔/基粒盘）；每帧只更新 instanceMatrix（`needsUpdate = true`）。

## 七、目镜视野类 2D 画布规范（micro 型实验）

- 样品画在**离屏画布**，主画布只做合成：明场=原样、暗场=白场 difference 反相（浅底变黑、样品亮起）、相差=再叠一层 `blur + brightness` 的 lighten 光晕；三种照明必须有肉眼可辨的差别；
- 绘制器一律按**画布坐标（0..S）作画**，外层合成变换必须带中心枢轴 `translate(C)·scale·rotate(π)·translate(−C)`——缺 −C 会把样品画到左上角（新旧两版都踩过）；
- 离焦 blur 与焦距差**非线性**（`(d/10)^1.6`），高倍放大离焦更快；
- 特殊光学条件（油镜缺油变暗、加油提对比度）在合成层做，不污染样品绘制器。

## 八、新实验接入 checklist

- [ ] createApp 加 `keepBackground: true`，删掉自己的 `scene.background` / 灯光调色板复制
- [ ] `attachVFX` 接入，删除自建的渲染循环渲染调用与相机 tween
- [ ] 颜色全部改走 PAL（裸十六进制清零）
- [ ] 主体材质换 matSheen/matCoat + ghost 化，发光成分登记 glowList
- [ ] `vfx.stats()` 抽查 draw call < 200；375px 不溢出；console 零报错
- [ ] fluor 类章节 leave() 复位 illus
