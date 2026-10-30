# 工单：EduLab 视觉工艺重做试点（cell + micro）——沉淀可复用工艺模板

> 执行者：本地 Claude Code（dangerously-skip-permissions）
> 工作目录：`/Users/leo/milulab/edulab/`
> 参考资料（只读，学习工艺用）：`/tmp/wedulab_ref/dec/cell.js`（219K）、`/tmp/wedulab_ref/dec/micro.js`（303K）
> 授权约束（背景读 `edulab/README.md`）：**只学工艺思想与参数调性，禁止复制原版代码结构/函数/文案原句**。产出必须是全新自研代码。

## 背景：为什么要重做

功能层（章节/交互/知识点）自研版已达标，但视觉工艺与原版差距大（用户截图对比确认）。根因分析定位出三层结构性缺失，本次重做就是补齐这三层，并把它们沉淀为**共享工艺模块**，作为后续 37 个实验的工艺标准模板。

## 三层工艺要求（以原版为基准的调性，非复制实现）

### 第 1 层：电影级后处理管线 → 沉淀为 `assets/js/edu-vfx.js`（共享模块，本次新增）

新建共享后处理模块（基于 three/addons 的 EffectComposer 全套，three r170 本地已有 addons：`assets/lib/three/addons/` 下有 postprocessing 全家桶 EffectComposer/RenderPass/UnrealBloomPass/OutputPass/ShaderPass）：

- `createVFX(renderer, scene, camera)` 返回 `{ composer, setMode(mode), resize(), render(dt) }`
- 内置管线：RenderPass → UnrealBloomPass → 自定义 ShaderPass（暗角 + 胶片颗粒 + 色差，一个 shader 全做）→ OutputPass
- 预置两种模式（参考原版调性自行调参，达到同等观感即可）：
  - `illus` 科学插画模式：低曝光、柔和 bloom、轻暗角、极轻颗粒、无色差、深色渐变背景
  - `fluor` 荧光显微模式：高曝光、强 bloom 低阈值、重暗角、明显颗粒、轻微色差、纯黑背景
- 参数参考（可微调）：illus ≈ exposure 1.05 / bloom [.45,.6,.86] / vignette .38 / grain .022；fluor ≈ exposure 1.2 / bloom [.85,.7,.08] / vignette .55 / grain .05 / aberration .0016
- renderer 要求：antialias、pixelRatio≤2、ACESFilmicToneMapping、SRGBColorSpace、localClippingEnabled
- 教育成本考虑：模块带完整 JSDoc；两实验接完后，其他实验只需 3 行接入

### 第 2 层：材质与几何工艺（重做 cell 的细胞器）

- **材质升级**：细胞质/核质用 MeshPhysicalMaterial + sheen（绒面感）；所有膜结构用 clearcoat（双层膜高光）；发光细胞器（核仁、线粒体基质）用 emissive 配合 fluor 模式
- **配色系统**：建立自研的「科学插画色板」（参考原版调性自行设计：暖膜色 + 深青细胞质 + 紫核系 + 橙黄能压器官系，深色背景上高对比），色板放 edu-vfx.js 导出
- **有机几何雕刻**：细胞轮廓用顶点噪声位移的球体（非正球），核膜双层+核孔阵列，线粒体为胶囊体+内部嵴片（用 clippingPlanes 做剖面），内质网/高尔基体用管状缠绕（TubeGeometry + CatmullRom 曲线），核糖体 InstancedMesh 小球群
- **剖开效果**：clippingPlanes 切开细胞，剖面用 stencil 或双材质封边（参考 three.js clipping 示例思路自研）
- **相机**：透视相机 + 阻尼 OrbitControls + 章节切换时的目标插值动画（缓动函数 cubic）

### 第 3 层：场景叙事与程序化纹理（重做 micro 的实验台）

- **场景叙事**：木纹实验桌（程序化 canvas 木纹纹理：底色+长条纹理+噪声，做 2-3 变体）、桌面道具阵列（试剂瓶若干个：LatheGeometry 瓶身+瓶盖，标签用 CanvasTexture 写化学式；载玻片盒、擦镜纸盒等简单道具），显微镜为绝对主角居中
- **显微镜本体精修**：金属材质（metalness/roughness 分层：镜臂哑光漆、旋钮橡胶纹、镜筒高光），目镜/物镜镜片用 transmission 或 envMap 反光，转动部件（粗/细准焦螺旋、转换器）与真实联动动画保留
- **目镜视野升级**：视场圆形遮罩内：样品 CanvasTexture 矢量绘制密度提升（洋葱表皮细胞画全细胞壁+液泡纹理、草履虫画纤毛摆动动画帧、血涂片 RBC 双凹圆盘形态+WBC 分叶核）；明场/暗场/相差三种照明真实区分（明场=亮底暗样本、暗场=黑底亮边缘散射、相差=亮底+相位光晕）；离焦 blur 用 ctx.filter 且强度与焦距差非线性；油镜加油后视野折射率变化（对比度提升+视野变亮）
- **灯光**：主 DirectionalLight（暖色 16774374 类调性）+ 补光 + 环境光，illus 模式带渐变背景

## 交付物

1. `assets/js/edu-vfx.js`：共享工艺模块（后处理管线 + 色板 + 通用工具如渐变背景/ canvas 纹理生成器），**这是后续 37 个实验的工艺标准模板**
2. `assets/js/lab-cell.js`：视觉层完全重做（保留既有章节结构/交互逻辑/quiz，只升级渲染与模型；若交互逻辑也要微调可动）
3. `assets/js/lab-micro.js`：同上
4. `docs/CRAFT-STANDARD.md`：工艺标准文档——写清楚「任何实验接入 edu-vfx 的 3 行接入代码示例、色板使用规范、材质分级规范（主体用 Physical+sheen/clearcoat、次要用 Standard）、程序化纹理生成规范」，供后续批次遵循

## 验收（自查后逐项报告）

- [ ] node --check 三文件零错误
- [ ] 本地服务起 8901，playwright 打开 /edulab/cell/ 与 /edulab/micro/，**截图与用户提供的原版截图对照**（原版截图特征：cell=深青底暖橙光细胞器+剖面；micro=木桌场景+写实镜身+圆形视野），观感达到同级别（自查标准：有 bloom 辉光、有暗角、有颗粒质感、无「素模感」）
- [ ] cell 的 illus/fluor 双模式切换可用；micro 三照明模式区分明显
- [ ] console 零报错；375px 不溢出
- [ ] 既有章节/交互/quiz 全部保留可用（每章切换实测）
- [ ] 性能：pixelRatio 上限 2、几何体合计 < 200 draw call、帧循环无内存增长（30 秒帧率不跌）
- [ ] **工艺合规自查**：随机抽 10 段新代码与原版对应段对比，确认无复制（结构/命名/文案均不同，仅工艺思想一致）

## 报告要求

输出：edu-vfx.js 模块 API 说明、cell/micro 各自的重做点清单、与原版截图的对比自查结论、CRAFT-STANDARD.md 内容摘要、下一步推广到其他 37 个实验的工时估计。
