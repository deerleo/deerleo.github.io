# 工单模板：单实验三栏布局 + 全元素折叠改造（每轮执行方必读）

> 本文件是 38 个实验逐个改造的**通用工艺工单**。每小时调度任务会指派 1-2 个实验，执行方先读本文件，再读指派的实验名。
> 工作目录：`/Users/leo/milulab/edulab/`
> 工艺基准（真源，先读）：`docs/CRAFT-STANDARD.md` + `docs/REPORT-MICRO-LAYOUT3.md` + `docs/REPORT-MICRO-FOLD.md` + `docs/REPORT-MICRO-FOLD-ALL.md`
> 参考实现（照着做）：`micro/index.html` + `assets/css/lab-micro.css` + `assets/js/lab-micro.js`
> 铁律：只改指派的实验文件（`<slug>/index.html`、`assets/css/lab-<slug>.css`、`assets/js/lab-<slug>.js`、可选扩 `assets/js/edu-vfx.js` 且必须向后兼容）。**严禁改动 micro 及其他实验、共享文件 edu-core/lab.css。**

## 改造内容（对 micro 已验证的三件套，按实验特性裁剪）

### 1. 三栏布局
- 页面骨架改为三栏 grid：左 `lab-chapters`（246px，章节大纲列表：序号+标题，竖排可滚动，当前章 `.on` 高亮）/ 中 `lab-stage3d`（3D 画布，flex:1）/ 右 `lab-detail`（352px，知识点详解 + 本章控件 + 数据读数）
- 交互语义：点左栏章节 → 高亮迁移 + 3D 相机飞到该章部位（实验现有 enter()/setCamera 逻辑保留）→ 右栏内容随章切换
- 顶栏细条保留；CSS 写 `assets/css/lab-<slug>.css`（新文件），HTML 加 link（带 `?v=2` 防缓存）
- 若实验原本章节较少或无分章：左栏列表照常做（至少显示该实验全部教学单元）

### 2. 全元素折叠
- 左右栏各带折叠钮（‹/›），折叠态 28px 竖条（左显当前章序号、右显竖排标题），`grid-template-columns` 0.3s ease 过渡，3D canvas 由 ResizeObserver 自动跟随
- 目镜/浮窗类元素（若实验有类似浮窗如数据分析窗）：头部折叠钮，收成 40px 圆形徽标，放大态下折叠自动退出放大
- 右栏内部块（详解/控件/读数）手风琴折叠（grid-rows 1fr→0fr，0.25s），偏好 localStorage 独立记忆，切章不重置
- 折叠状态 localStorage：键名 `<slug>.foldL / foldR / fold<Float>`，首访不写、用户操作后落盘
- ≤1100px 首访清爽态（浮窗默认折、读数默认收）；≤860px 纵向堆叠（列表收顶部横滚、3D 42dvh、详解在下），折叠控件隐藏
- 专注模式按钮：双栏同折/恢复，与独立折叠状态互通

### 3. 视觉工艺接入（轻量）
- 接入 `edu-vfx.js`：`attachVFX(app, 'illus')` 三行接入（API 见 CRAFT-STANDARD.md），色板用 PAL，材质按四级分工
- 该实验已有的建模/交互/quiz 全部保留；**不要求**重做建模（建模深度按后续批次另行安排，本轮只做布局+折叠+轻接入）

### 3+. 建模深度精修（Micro 级标准，Leo 2026-10-31 定：不允许打折）

**每个实验的 3D 主体建模必须达到 lab-micro.js（113K）的工艺密度**。做法参照 `docs/REPORT-MICRO-REFINE.md` + `REPORT-MICRO-REFINE2.md` 两轮精修的全部手法：

1. **主体建模**：核心物体用 CatmullRomCurve3 曲线放样变宽截面（非基础几何拼装）；每个可见部件独立造型+材质分层（烤漆 clearcoat / 金属 metalness 分区 / 橡胶 roughness 0.9 / 玻璃 transmission）；装饰线/倒角/滚花等细节到位
2. **场景叙事**：实验台/环境语境道具阵列（参考 micro 的试剂瓶+玻片盒+培养皿），道具带标签纹理/液面色/接触阴影
3. **材质工艺**：全走 edu-vfx 的 PAL 色板与四级材质工厂；主体 sheen/clearcoat；发光部件 emissive 与 fluor 联动
4. **光照氛围**：主暖光+补光+bounce，程序化环境反射（makeStudioEnvironment），接触阴影贴片
5. **程序化纹理**：需要贴图的部位（标签/木纹/刻度）用 CanvasTexture 程序化生成，密度参照 micro（fillStyle/arc 大量矢量绘制）
6. **互动可视反馈**：可动部件（旋钮/滑杆对应物）拖拽时 3D 同步转动；焦距类参数与视觉模糊/景深非线性联动

**体量基准**：改造后该实验 lab-<slug>.js 应达到 90-120K 量级（当前多数 45-65K），低于 85K 视为未达标，需继续加深。

**JS 逻辑零回归**：建模加码不得破坏既有章节切换/quiz/数据读数；每章遍历验证。

### 4. 质检标准（Leo 定：与 micro 完全一致，不打折扣）

- [ ] 主控独立截图抽检（不只依赖执行方自检）：三栏布局、建模细节、材质质感逐项过目
- [ ] 建模体量 ≥ 85K；draw call < 200；GPU 60fps
- [ ] 全章节遍历 console 零报错；quiz/交互全保留
- [ ] 四态折叠 + 375px + localStorage 全过
- [ ] 工艺合规零命中原版

## 验收清单（playwright 实测，全过才算完成）

- [ ] node --check 全过；console 零报错（宽屏/1000px/375px 三组）
- [ ] 三栏同显；左列表点击切章、高亮迁移、3D 相机飞行、右栏内容联动
- [ ] 左/右折叠 + 浮窗折叠 + 手风琴全可用；极限折叠态 3D 独占
- [ ] localStorage 刷新保持；≤1100px 首访清爽态；375px 纵向堆叠
- [ ] 章节全遍历无报错；quiz 保留可用；draw call < 200
- [ ] 全部页面 noindex + WeduLab © WY 署名保留；不改 cards.json；**不 git push**（由调度统一收口）

## 报告

输出：改造点清单、四态截图（全展开/折左/折右/极限）、375px 截图、验收结果表。
