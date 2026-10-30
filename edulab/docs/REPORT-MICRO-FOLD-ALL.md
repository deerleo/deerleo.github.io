# 报告：micro 全元素折叠体系（目镜视野窗 + 右栏三块手风琴 + 小屏清爽态）

> 工单：`WORKORDER-MICRO-FOLD-ALL.md` ｜ 验收：playwright 实测 **46/46 全过**，三组上下文 console 零报错
> 截图存档：`/tmp/edulab-fold-all-test/shots/`（临时目录，重启即失；验收脚本 `/tmp/edulab-fold-all-test/verify.js`）
> 改动文件：`micro/index.html` ＋ `assets/css/lab-micro.css` ＋ `assets/js/lab-micro.js`（与工单范围一致）

## 实现

### 1. 目镜视野窗折叠（收成 40px 圆形「目」徽标）

- **折叠钮**：窗体头部 `.sec-h` 右侧加 `fold-btn` 同款 22px 小钮（`−`），hover 高亮，带 `aria-expanded` / `aria-controls`。
- **折叠态**：`.micro-eye.folded` —— 头部与 body `display:none`，整窗 `width:auto`、去底色/边框/阴影，仅剩 40px 圆形「目」徽标（暗色目镜质感 radial 渐变＋3px 深环＋hover accent），`align-items: flex-end` 使徽标贴右上角、与原窗体同锚点；徽标 scale-in 0.25s，展开时窗体内容 0.25s 淡入。
- **放大态守卫**：`applyEyeFold()` 折叠时若正处 `.expanded` 自动调 `setEyeExpanded(false)` 退出放大（放大视野按钮文案同步还原）。
- **记忆**：`micro.foldEye`（`'1'/'0'`），读写 try/catch；**首访默认不落盘**——无记忆时按视口给默认（≤1100px 折叠），用户手动操作后才写入，此后记忆优先。

### 2. 右栏三块手风琴（详解 / 控件 / 读数）

- **结构**：`detail-body` 内三块各自包进 `<section class="acc">`＝标题行按钮（`知识点详解`/`实验控件`/`数据读数` ＋ 右侧 `▾` 箭头）＋ body；原 `#lesson`/`#controls`/`#lcData` 元素与 ID 原样保留，章节渲染逻辑零改动。
- **动画**：CSS `grid-template-rows 1fr → 0fr` 过渡 0.25s，免 JS 量高；箭头 `rotate(-90deg)` 同步转向（收起为 ▸）。playwright 实测收起后 body 高度 = 0（收得干净）。
- **记忆**：`micro.accLesson` / `micro.accControls` / `micro.accData` 三键独立；`selectChapter()` 不触碰手风琴状态——**切章不重置用户偏好**（实测切第 3 章后 详解开/控件开/读数收 原样保持）。
- **空块收走**：本章无控件（`#controls` 空）时 `selectChapter` 给控件块加 `.acc-empty` 整块隐藏；数据读数随 `hud.visibleNow` 在帧循环里同步——不出现空壳标题行。

### 3. 小屏联动（≤1100px 首访清爽态）

- **JS 判据**：`window.innerWidth <= 1100` 且无 localStorage 记忆时 → 目镜默认折叠、数据读数默认收起（详解/控件仍展开）；用户手动展开/收起后写入记忆，此后按记忆走（不随视口变）。
- **顶栏收窄**：≤1100px 隐藏副标题与「← 实验目录」链接（返回走 logo），仅 logo＋标题一行＋功能钮。
- **既有 ≤860px 守卫不受影响**：纵向堆叠、桌面折叠钮/竖条隐藏的规则保持；375px 实测无横向滚动。

### 4. 顺手修的一处既有小缺陷

- ≤860px 展开态目镜浮窗内容高度超出舞台（底部「放大视野」按钮被舞台 `overflow:hidden` 裁半）——浮窗加 `max-height: calc(100% - 16px); overflow-y: auto`，超高时浮窗内部滚动，徽标折叠态不受影响（`.folded` 特异性更高）。

## 验收清单对照（工单 7 项）

| 项 | 结果 |
|---|---|
| 目镜窗折叠→圆形徽标；点击恢复；放大态折叠自动退出放大 | ✅ A2/A3/A4（截图 1/2） |
| 右栏三块手风琴收起/展开，箭头方向正确 | ✅ A5 三块 closed＋aria＋rotate(-90°)＋body 高 0（截图 3） |
| localStorage 记忆：目镜＋手风琴各 key 刷新保持 | ✅ A6 刷新后四态原样（截图 4） |
| ≤1100px 首访自动清爽态（清 storage 窄屏） | ✅ B1-B4 新上下文 1000×800：目镜折＋读数收＋顶栏一行（截图 7）；手动展开后记忆落盘 B5（截图 7b） |
| 「所有都折」极限态：只剩 3D＋两条竖条 | ✅ A11 专注模式＋目镜折：左右各 28px、徽标悬浮（截图 6） |
| 章节切换/quiz/旋钮联动不受影响；console 零报错；node --check 过 | ✅ A8/A9/A10；A/B/C 三上下文零 error/pageerror；ESM `node --check` 通过 |
| 375px 正常 | ✅ C1-C5：无横向滚动、堆叠布局、清爽态默认、浮窗内部滚动不裁切（截图 8/9） |

## 截图说明

| 文件 | 态 |
|---|---|
| `1-eye-folded.png` | 目镜窗收成 40px「目」徽标（右上原位），右栏三块手风琴带标题行与箭头 |
| `2-eye-fold-from-zoom.png` | 放大态下点折叠 → 自动退出放大收成徽标 |
| `3-accordions-closed.png` | 三块手风琴全收起：右栏只剩三个标题行，目镜窗展开对照 |
| `4-refresh-persist.png` | 目镜折叠＋三块收起态刷新后原样恢复 |
| `5-chapter-switch.png` | 切第 3 章后：手风琴偏好未重置，新章控件/正文已重建 |
| `6-extreme-all-folded.png` | 极限全折：3D 独占全宽＋左右 28px 竖条＋「目」徽标 |
| `7-narrow-1000-clean.png` | 1000×800 首访清爽态（目镜折＋读数收＋顶栏一行） |
| `7b-narrow-1000-after-expand.png` | 同上下文手动展开目镜后（记忆落盘） |
| `8-mobile-375.png` / `9-mobile-375-eye-open.png` | 375px 堆叠布局清爽态 ／ 展开浮窗内部滚动不裁切 |
