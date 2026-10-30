# 报告：micro 三栏折叠功能（左右栏独立折叠 + 专注模式统一）

> 工单：`WORKORDER-MICRO-FOLD.md` ｜ 验收：playwright 实测 **31/31 全过**，console 零报错
> 截图存档：`/tmp/micro-fold-verify/shots/`（临时目录，重启即失；验收脚本 `/tmp/micro-fold-verify/verify.js`）
> 改动文件：`micro/index.html` ＋ `assets/css/lab-micro.css` ＋ `assets/js/lab-micro.js`（与工单范围一致）

## 实现

### 布局与动画（CSS）

- **栏宽过渡**：`.micro-shell` 加 `transition: grid-template-columns 0.3s ease`，折叠态用组合类切换轨道——
  `.fold-l` = `28px 1fr 352px`、`.fold-r` = `246px 1fr 28px`、`.fold-l.fold-r` = `28px 1fr 28px`。
  轨道数相同且逐轨可插值（px↔px / minmax(0,1fr)↔同），浏览器原生平滑过渡，无 JS 动画。
- **canvas 跟随**：`edu-core.js` 的 `ResizeObserver`（对 stage 容器）逐帧重设 renderer 与 camera.aspect；`edu-vfx.js` 合成器每帧核对渲染尺寸自动 `composer.setSize`——过渡全程 3D 无拉伸、无留白、后处理管线（bloom/暗角/颗粒）同步缩放，均为既有机制，本次验证确认。
- **内容淡出防挤压**：折叠侧原内容保持固有宽度（`min-width: 246px / 352px`）＋ `opacity 0.16s` 淡出，由 aside `overflow: hidden` 裁切——过渡中不出现文字挤压跳动。
- **竖条导轨**：折叠侧显示 28px 导轨（`position: absolute` 覆层，`visibility+opacity` 交叉过渡）——左栏 `›` 展开钮 ＋ 当前章序号（accent 色，如「01」）；右栏 `‹` 展开钮 ＋ 当前章标题竖排（`writing-mode: vertical-rl`，超长省略）。
- **折叠按钮**：栏头各一枚（左 `‹` / 右 `›`，`margin-left: auto` 靠右），22px 圆角小钮，hover 高亮（accent 描边＋浅底），带 `aria-expanded` / `aria-controls` / title。
- **专注模式去 `display:none` 化**：旧实现（`0px` 轨道＋双栏 `display:none`，无法过渡且移动端有特异性隐患）删除；专注模式语义改为「双栏同时折叠」，布局完全复用 fold 类，`.focus-mode` 类仅作按钮态标记。
- **移动端守卫（≤860px）**：fold/focus 的桌面轨道规则全部被媒体查询压回纵向单列，折叠按钮与导轨 `display: none`；localStorage 可能带着折叠态进入移动端，内容透明度强制复原——375px 视觉与改造前一致。

### 状态与交互（JS）

- **localStorage 记忆**：`micro.foldL` / `micro.foldR`（`'1'/'0'`），读写均 try/catch（隐私模式降级为会话内生效）；启动时恢复。
- **独立折叠**：`toggleFold(side)` 翻转对应侧＋持久化。
- **专注模式统一**：`setFocus(on)` 进入时保存当前独立折叠对 `[foldL, foldR]` 并双侧折叠（不写 localStorage，独立记忆不被污染）；退出时恢复进入前状态。因此「左已折＋专注」自然表现为只右栏再折、退出后右栏复原——工单第 5 条语义逐字满足。
- **专注中点竖条展开钮**：先退出专注（恢复原状）再翻转该侧，两套状态机不打架。
- **竖条信息同步**：`selectChapter()` 内同步左栏序号与右栏竖排标题，折叠态切章信息不滞后。

## 四态截图说明

| 文件 | 态 | 要点 |
|---|---|---|
| `1-all-expanded.png` | 全展开 | 左 246 / 右 352，栏头折叠钮就位，版式与改造前一致 |
| `2-fold-left.png` | 折左 | 左栏 28px 竖条（`›` ＋ 序号「01」），3D 扩占至 1060px，canvas 视口=舞台尺寸无变形 |
| `6-fold-right.png` | 折右 | 右栏 28px 竖条（`‹` ＋ 竖排「认识显微镜」），3D 扩占至 1166px |
| `3-both-folded.png` | 双折（专注形态） | 3D 独占 1384px 全宽，两侧竖条可独立展开 |
| `anim-mid-fold-left.png` | 动画中间帧 | 点击后 ~120ms 抓帧：左栏 71px 过渡中、内容已淡出无残影、3D 平滑扩占 |
| `4-refresh-persist.png` | 刷新保持 | 双折态刷新后原样恢复（localStorage 生效） |
| `5-focus-mode.png` | 专注模式 | 双栏折叠＋按钮文案「退出专注」 |
| `7-mobile-375.png` | 375px 移动端 | 纵向堆叠、折叠控件隐藏、预置折叠 localStorage 下内容完整可见 |

## 验收结果（playwright，31/31 PASS）

- [x] 点左折叠钮：左栏收为 28px 竖条、3D 扩满该区域、canvas 视口=舞台尺寸（`cv 1060x849 = stage 1060x849`），绘图缓冲跟随 resize —— 截图 `2-fold-left.png`
- [x] 点右折叠钮：同上（`stage 1166`，canvas 无变形）—— 截图 `6-fold-right.png`
- [x] 双栏都折：3D 独占全宽 1384px（=1440−56）—— 截图 `3-both-folded.png`
- [x] 刷新页面：`micro.foldL/foldR` 保持，双折态原样恢复 —— 截图 `4-refresh-persist.png`
- [x] 动画平滑：中间帧左栏 71px（介于 28~246，grid 轨道插值进行中），内容淡出无挤压；收起/展开对称 —— 截图 `anim-mid-fold-left.png`
- [x] 折叠态切章正常：`__eduSections.select(2)` 后右竖条标题同步「成像特点」、左竖条序号「03」；点 `›` 展开后列表高亮=第 3 章
- [x] console 零报错（桌面全程＋移动全程，仅 WebGL 性能 warning 不计入）
- [x] `node --check` 通过
- [x] 375px 不受影响：单列轨道 375px、折叠按钮/导轨隐藏、带折叠 localStorage 时内容 opacity=1、堆叠顺序正常 —— 截图 `7-mobile-375.png`
- [x] 专注模式统一（附加验证）：进入保存/退出恢复；「左折＋专注」只右栏再折、退出复原；专注中点左竖条=退出专注并展开左栏

## 过程记录

- 初跑 28/31：3 个失败均为验收脚本自身 bug（时序点错按钮、`getComputedStyle` 的 `grid-template-columns` 返回解析像素值而非指定值），产品行为无问题；修脚本后全绿。
- 移动段首跑超时：headless 单 GPU 进程下桌面页未关导致移动页初始化被拖慢，脚本改为移动段前关闭桌面页（非产品问题）。

## 遗留说明

- 截图存于 /tmp（15MB 不入库）；如需留档可拷贝至任意持久位置。
- 折叠竖条在浅色主题下与 3D 暗背景对比明显，深色主题同样适配（左右栏底色均走 `var(--bg-soft)` 主题变量）。
