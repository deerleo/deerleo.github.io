# 报告：R01 atlas 疆域变迁 三栏布局 + 全元素折叠改造

> 轮次：R01（实验：atlas）｜ 工单：`docs/WORKORDER-LAYOUT-TEMPLATE.md`
> 验收：playwright 实测 **47/47 全过**，三组上下文（1440 / 1000 / 375）console 零报错
> 验收脚本：`/tmp/edulab-r01-verify/verify.js`（临时目录）；截图 `/tmp/edulab-r01-shots/atlas-*.png`（9 张，重启即失）
> 改动文件：`atlas/index.html` ＋ `assets/css/lab-atlas.css`（新建）＋ `assets/js/lab-atlas.js`（与工单范围一致，edu-core/lab.css/edu-vfx 零改动）

## 改造点清单

### 1. 三栏布局（骨架重写）

- `body.lab.atlas` 改 block + `.atlas-shell` 三栏 grid：左 `lab-chapters` 246px（16 期竖排列表）/ 中地图画布 / 右 `lab-detail` 352px；顶栏细条横贯（`?v=2` 防 cache）
- 章节驱动改造：弃用 `createSections`，改 micro 同款左栏列表驱动 + `applyChapterUI()/selectChapter()` 两层——**时间轴拖动/自动播放时右栏联动跟随**（高亮、`detailNo/detailTitle`、详解、竖条信息随 `Math.round(state.time)` 变化刷新，不重置播放状态）；点左栏则 `selectChapter()` 强刷 UI + `enter()`（时间轴归位、停播）
- 右栏收纳：**知识点详解**（原 `lab-desc` 悬浮卡）、**实验控件**（原底部悬浮控制条：自动播放/时间轴/都城/政权名/地形注记）、**数据读数**（HUD 时期/年代——原版 `makeHUD(stage)` 创建后即 `show(false)` 永久隐藏，本次迁入右栏并启用，随 `syncCaption()` 滚动更新）
- 中栏浮动重排：字幕条贴底居中（原 bottom:96px 让位旧控制条，改 14px）；面积曲线窗叠于字幕条上方（bottom:112px；≤1100px 170px），**实测与字幕条零重叠**（验证脚本含 overlap=0 断言）

### 2. 全元素折叠

- 左右栏独立折叠（`atlas.foldL / foldR`）+ 专注模式（同 micro 语义：双栏同折、进入保存退出恢复、专注中点竖条先退专注再翻转）+ 右栏三块手风琴（`atlas.accLesson / accControls / accData`，切期不重置）——实现与 analysis 同构
- **面积曲线窗折叠**（本实验的"目镜窗"对应物）：窗头折叠钮，收成 40px 圆形「积」徽标（贴原位左下），徽标 scale-in/展开淡入，`atlas.foldArea` 记忆（首访不落盘、≤1100px 首访默认折）
- ≤1100px 首访清爽态：面积窗默认折 + 数据读数默认收 + 顶栏一行；≤860px 纵向堆叠，面积窗（含徽标态）整体隐藏、字幕条全宽贴底

### 3. 视觉工艺接入（edu-vfx）

- **N/A，按实验特性裁剪**：atlas 为纯 2D canvas 实验（程序化高程底图 + 多边形变形），无 three.js app，`attachVFX` 不适用；地形/疆域绘制、时间轴、战斗沙盘链接全部保留。`draw call < 200` 项 N/A（零 WebGL 调用）

### 修复的两个布局碰撞（本轮实测抓出）

1. **字幕条 × 面积窗重叠**：字幕条贴底后与 bottom:56px 的面积窗在 1440 宽下垂直交叠、z-index 高的一侧拦截点击（playwright click 超时暴露）——面积窗上移至字幕条最高情形（含战役链接行）之上，补「字幕条与面积窗零重叠」断言
2. **共享 `.lab-stage canvas` 规则误伤面积窗画布**：面积窗画布在 `#stage.lab-stage` 内，命中共享 `position:absolute; inset:0` 规则盖住窗头折叠钮（旧版靠内联 `position:relative` 压制，样式迁 CSS 时丢失致回归）——`.coastal-window.aw canvas` 补 `position: relative`
3. **移动端徽标泄漏**：`.coastal-window.aw.folded` 的 `display:flex`（0,3,0）压过媒体查询 `display:none`（0,2,0）——移动端隐藏规则一并写入 `.folded` 态

## 验收结果（工单清单逐项）

| 项 | 结果 |
|---|---|
| node --check 全过；console 零报错（宽屏/1000px/375px 三组） | ✅ 三组 0 error/pageerror；ESM `node --check` 过 |
| 三栏同显（246/842/352）；左列表点击切期、高亮迁移、右栏联动 | ✅ 16 期列表；切期 on/no/详解/竖条同步；相机飞行 N/A（2D，疆域多边形变形即视觉切换）；时间轴/自动播放时右栏联动跟随 ✅ |
| 左/右折叠 + 面积窗折叠 + 手风琴全可用；极限态画布独占 | ✅ 折左/折右 28px 竖条、双折 1384px；面积窗→「积」徽标→点击恢复；字幕×面积窗零重叠 |
| localStorage 刷新保持；≤1100px 首访清爽态；375px 纵向堆叠 | ✅ 双折刷新恢复；面积窗折叠记忆落盘；1000px 面积窗默认折+读数默认收；375 单列、面积窗（含徽标）隐藏、无横向滚动 |
| 章节全遍历无报错；quiz 保留可用 | ✅ 16 期遍历 0 报错；quiz 项 N/A（本实验无随堂检测，三国→战役沙盘外链保留可用 ✅） |
| noindex + 署名保留；不改 cards.json；未 git push | ✅ `noindex,nofollow` 在；页脚 EduLab · milulab.com；未 push |

## 截图清单（/tmp/edulab-r01-shots/）

| 文件 | 态 |
|---|---|
| `atlas-1-all-expanded.png` | 全展开三栏：左 16 期列表 / 中秦朝疆域+面积窗+字幕 / 右详解+控件+读数 |
| `atlas-1-area-folded.png` | 面积窗收成「积」徽标 |
| `atlas-2-fold-left.png` / `atlas-6-fold-right.png` | 折左 / 折右 28px 竖条 |
| `atlas-3-both-folded.png` | 双折极限：地图独占 1384px |
| `atlas-5-focus-mode.png` | 专注模式 |
| `atlas-7-narrow-1000.png` | 1000×800 首访清爽态（面积窗折 + 读数收） |
| `atlas-8-mobile-375.png` | 375 纵向堆叠（面积窗隐藏、字幕全宽贴底） |

## 遗留说明（非本轮引入）

- 面积曲线 y 轴刻度文字（1000万/500万）在画布内左缘轻微裁切——旧版内联样式同参数即存在，属画布内绘图边距问题，非布局改造引入，留待后续绘图轮处理
