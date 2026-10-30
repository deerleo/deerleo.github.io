# 报告：micro 布局二次重构——真·三栏结构

> 工单：`WORKORDER-MICRO-LAYOUT3.md` ｜ 验收：playwright 实测 **15/15 全过**，console 双端零报错
> 截图存档：`/tmp/micro-shots/`（desktop-ch3-imaging / desktop-camera-fly-eyepiece / desktop-focus-mode / desktop-quiz / mobile-375）

## 布局前后对照

| | 前（第一轮，理解偏差版） | 后（本轮，Leo 语义版） |
|---|---|---|
| 骨架 | 全屏 3D 铺底 + 左下悬浮课题卡 + 右上悬浮目镜栏 | **真·三栏 grid**：左 246px 课程大纲 / 中 flex:1 3D 舞台 / 右 352px 知识点详解，顶栏细条横贯 |
| 章节切换 | 课题卡内 `<select>` 下拉 + 上下章按钮 | **左栏 16 章竖排按钮列表**（序号+标题），点击即切，当前章 `.on` 高亮 + `aria-current`，`scrollIntoView` 保持可见 |
| 知识点正文 | 与控件挤在左下悬浮卡 | **右栏专属**：章节大序号 + 标题头 + 详解正文 + 本章控件 + HUD 读数，随章切换，独立滚动 |
| 3D 舞台 | 全屏背景（被两卡遮角） | 中栏独立舞台，切章相机飞行逻辑原样保留；quiz 浮层/加载遮罩只盖中栏 |
| 目镜视野窗 | 右侧固定栏（与右栏位置冲突） | 浮于**中栏右上**，不与右栏重叠（playwright 实测 noOverlap） |
| 滚动 | 整卡内部滚动 | 左右栏各自独立滚动，100dvh 无页面滚动条 |
| 移动端 375 | 悬浮卡抽屉折叠 | 纵向堆叠：章节列表收**顶部横滚条** → 3D（42dvh）→ 知识点在下，各段内部滚动不出页面滚动条 |
| 新增 | — | **专注模式**按钮（中栏左下）：一键隐藏左右两栏 3D 独占（ResizeObserver 自动重设画布），再点恢复 |

## 改动文件（edu-vfx.js 零改动）

- `micro/index.html`：骨架重写为 `#microShell` 三栏 grid（`aside.lab-chapters` + `main.lab-stage3d>#stage` + `aside.lab-detail`）；顶栏细条保留（含 JS 注入的随堂检测按钮锚点 `.spacer`）；目镜窗迁入中栏
- `assets/css/lab-micro.css`（v→2）：删除悬浮毛玻璃卡样式，改三栏 grid + 独立滚动；当前章 `.on` 高亮态（复用 lab.css `.chap-btn` 基础视觉）；≤860px 断点纵向堆叠；quiz 面板 z-index 提到目镜窗之上
- `assets/js/lab-micro.js`：`selectChapter()` 改为左栏列表驱动（16 个 `<button data-idx>`，高亮迁移 + 右栏标题/序号/正文/控件/读数同步刷新）；删除旧下拉/上下章/折叠逻辑；新增专注模式 toggle。**SECTIONS 数据、enter() 相机飞行、控件生成、quiz 全部原样保留**，仅控件渲染目标随容器换到右栏

## 验收清单（工单逐项）

- [x] 三栏同时可见：左列表 16 项（246px）/ 中 3D（682px）/ 右知识点（352px）
- [x] 点左栏第 3 章 → 高亮迁移 onIdx=2 + 右栏切「03 成像特点」正文 182B；相机飞行以工单示例验证：第 1 章点「目镜与镜筒」→ 机位移动 dist=11.09（各章 enter() 本就飞同一全景机位，数据未动）
- [x] 章节内控件出现在右栏且可用：滑杆×2 + 按钮×5 在 `.lab-detail` 界内，操作后 HUD 读数联动（"偏哪移哪"回填）
- [x] 目镜视野窗正常显示：272px 浮于中栏右上，实测与右栏零重叠
- [x] 1280 / 375px 双端正常；console 零报错（桌面+移动两 page 分别监听）；`node --check`（ESM）通过
- [x] quiz 章保留：顶栏按钮 → `.quiz-panel` 覆盖中栏（682×749，含题目渲染）；16 章切换全遍历无报错
- [x] 截图发 Leo 确认（5 张，见存档目录）

## 截图清单（/tmp/micro-shots/）

| 文件 | 内容 |
|---|---|
| desktop-ch3-imaging.png | 1280 三栏全景：左 16 章列表（03 高亮）/ 中 3D+目镜窗 / 右「成像特点」详解+控件+读数 |
| desktop-camera-fly-eyepiece.png | 第 1 章点「目镜与镜筒」后 3D 飞至镜筒特写（视角按钮 active 态可见） |
| desktop-focus-mode.png | 专注模式：左右栏隐藏，3D 独占 1280px，左下「退出专注」 |
| desktop-quiz.png | 随堂检测浮层盖中栏；背后第 16 章全控件（玻片/倍率/照明/油镜/双滑杆）在右栏齐整 |
| mobile-375.png | 375 纵向堆叠：顶栏 → 章节横滚条（05 高亮）→ 3D+目镜窗 → 知识点详解 |
