# 报告：R01 analysis 化学分析实验台 三栏布局 + 全元素折叠改造

> 轮次：R01（实验：analysis）｜ 工单：`docs/WORKORDER-LAYOUT-TEMPLATE.md`
> 验收：playwright 实测 **40/40 全过**，三组上下文（1440 / 1000 / 375）console 零报错
> 验收脚本：`/tmp/edulab-r01-verify/verify.js`（临时目录）；截图 `/tmp/edulab-r01-shots/analysis-*.png`（8 张，重启即失）
> 改动文件：`analysis/index.html` ＋ `assets/css/lab-analysis.css`（新建）＋ `assets/js/lab-analysis.js`（与工单范围一致，edu-core/lab.css/edu-vfx 零改动）

## 改造点清单

### 1. 三栏布局（骨架重写）

- `body.lab.analysis` 改 block + `.anl-shell` 三栏 grid：左 `lab-chapters` 246px（9 章竖排列表，序号+标题，当前章 `.on` 高亮 + `aria-current` + `scrollIntoView`）/ 中 `lab-stage3d` flex（2D 画布台）/ 右 `lab-detail` 352px（详解+控件+读数）；顶栏细条横贯（返回/标题/主题切换，`?v=2` 防 cache 新 CSS）
- 章节驱动改造：弃用 `createSections`（旧侧栏抽屉+悬浮说明卡），改 micro 同款 `selectChapter()` 左栏列表驱动——高亮迁移、`chapCount`、右栏 `detailNo/detailTitle`、`lessonEl.innerHTML`、折叠竖条序号/竖排标题同步刷新；`sec.enter()` 相机飞行项 N/A（本实验为 2D 画布，切章场景重绘即视觉切换）
- 右栏收纳三块（原悬浮元素全部迁入）：**知识点详解**（原 `lab-desc` 悬浮卡）、**实验控件**（原底部悬浮 `lab-controls` 条，`createControlsPanel` 渲染目标不变仅容器换位）、**数据读数**（原右上悬浮 `lab-hud`，`setHud(rows)` 入口不变，`setHud(null)` 时整块 `acc-empty` 收走）
- 画布自适应：`#stage` 上既有 ResizeObserver 在栏宽变化时重设画布并重跑 `fitView()`（1280×760 设计坐标 letterbox），折叠全程画布无拉伸

### 2. 全元素折叠

- 左右栏独立折叠（`analysis.foldL / foldR`，'1'/'0'，try/catch 降级会话态）：`grid-template-columns` 0.3s ease 组合类轨道（28px 竖条，左显当前章序号、右显竖排标题），内容固有宽度淡出防挤压，首访不写、操作后落盘
- 专注模式：双栏同折复用 fold 类，进入保存 `[foldL, foldR]` 退出恢复（不污染独立记忆）；专注中点竖条 = 先退专注再翻转该侧
- 右栏三块手风琴（`analysis.accLesson / accControls / accData` 独立 key）：grid-rows 1fr→0fr 0.25s + 箭头转向；切章不重置偏好；本章无控件/读数时整块 `acc-empty` 隐藏
- ≤1100px 首访清爽态：数据读数默认收起；≤860px 纵向堆叠（章节横滚条 / 画布 42dvh / 详解在下），折叠控件隐藏、折叠 storage 内容透明度强制复原
- 浮窗折叠项：N/A——analysis 无浮窗类元素（HUD/控件已按 micro 模式收进右栏，实测页面无 `lab-desc/lab-controls/lab-hud` 残留）

### 3. 视觉工艺接入（edu-vfx）

- **N/A，按实验特性裁剪**：analysis 为纯 2D canvas 实验（无 three.js app），`attachVFX(app, ...)` 三行接入依赖 `createApp` 的 WebGL 管线，不适用；已有仪器矢量绘制/交互/quiz 全部保留。`draw call < 200` 项对应 N/A（零 WebGL 调用，2D 绘制指令受绘图代码边界约束）

### 顺手修正

- 删除旧版动态注入的 `.lab-controls:empty` 样式与失效的 import（`createSections`）

## 验收结果（工单清单逐项）

| 项 | 结果 |
|---|---|
| node --check 全过；console 零报错（宽屏/1000px/375px 三组） | ✅ 三组 0 error/pageerror；ESM `node --check` 过 |
| 三栏同显（246/842/352）；左列表点击切章、高亮迁移、右栏联动 | ✅ 切第 3 章 on=2/no=03、详解 244B、控件 6 枚、HUD 在右栏；相机飞行 N/A（2D） |
| 左/右折叠 + 手风琴全可用；极限折叠态画布独占 | ✅ 折左 28px 导轨+画布跟随（1060=stage）、折右同、双折 1384px 全宽；浮窗折叠 N/A（无浮窗） |
| localStorage 刷新保持；≤1100px 首访清爽态；375px 纵向堆叠 | ✅ 双折刷新恢复；1000px 读数默认收+顶栏一行；375 单列横滚无横向滚动 |
| 章节全遍历无报错；quiz 保留可用 | ✅ 9 章遍历 0 报错；第 9 章随堂检测面板 + 答题交互可用 |
| noindex + 署名保留；不改 cards.json；未 git push | ✅ `noindex,nofollow` 在；页脚 EduLab · milulab.com；未 push |

## 截图清单（/tmp/edulab-r01-shots/）

| 文件 | 态 |
|---|---|
| `analysis-1-all-expanded.png` | 全展开三栏：左 9 章列表 / 中滴定台画布 / 右详解+控件+读数 |
| `analysis-2-fold-left.png` | 折左：28px 竖条（› + 序号），画布扩至 1060px |
| `analysis-6-fold-right.png` | 折右：28px 竖条（‹ + 竖排章题） |
| `analysis-3-both-folded.png` | 双折极限：画布独占 1384px |
| `analysis-5-focus-mode.png` | 专注模式（退出专注按钮态） |
| `analysis-7-narrow-1000.png` | 1000×800 首访清爽态 |
| `analysis-8-mobile-375.png` | 375 纵向堆叠 |
