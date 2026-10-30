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

## 验收清单（playwright 实测，全过才算完成）

- [ ] node --check 全过；console 零报错（宽屏/1000px/375px 三组）
- [ ] 三栏同显；左列表点击切章、高亮迁移、3D 相机飞行、右栏内容联动
- [ ] 左/右折叠 + 浮窗折叠 + 手风琴全可用；极限折叠态 3D 独占
- [ ] localStorage 刷新保持；≤1100px 首访清爽态；375px 纵向堆叠
- [ ] 章节全遍历无报错；quiz 保留可用；draw call < 200
- [ ] 全部页面 noindex + WeduLab © WY 署名保留；不改 cards.json；**不 git push**（由调度统一收口）

## 报告

输出：改造点清单、四态截图（全展开/折左/折右/极限）、375px 截图、验收结果表。
