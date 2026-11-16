# AT-103 交付结果：milulab 交互应用总览页 /apps-showcase/

**状态：完成（102/102 截图全成功，页面功能与视觉验收通过）**
日期：2026-11-16 · 执行：本地 Claude Code（AT-103 工单）

## 产物清单（全部为新增，未动任何现有文件）

| 路径 | 内容 |
|---|---|
| `apps-showcase.html` | 总览页（permalink `/apps-showcase/`，subpage-shell 头 + theme.css 品牌体系，样式全部 `.showcase-scope` 前缀） |
| `assets/showcase/apps.json` | 102 项数据（94 edulab + 3 独立应用 + 4 专题页 + 1 互动实验），含 shot 字段与第三方署名 |
| `assets/showcase/thumbs/*.jpg` | 102 张真实渲染截图（640×400 JPEG q80，源图 1280×800@2x） |
| `tools/showcase/screenshot_all.py` | 截图流水线（http.server + playwright chromium，4 并发、两段重试、dsf 降载、blank 检测、报告落 shot_report.json） |
| `tools/showcase/build_apps_json.py` | apps.json 生成器（cards.json + 人工条目 + 截图报告合成） |
| `tools/showcase/shot_report.json` | 逐 slug 截图报告（102 条，全部 ok） |
| `tools/showcase/result.md` | 本结果的仓库侧副本 |

## 截图统计

- **成功 102 / 102**，无 shot=false 项（fallback 卡片逻辑已实现并另行目检，见下）
- 视觉抽检 17 张全合格：edulab 随机 8（reaction / immune / coal-gas-step / hou-soda-step / nitric-lab-step / self-induction-step / func / orbital）+ /apps/ 3 全（robotics-bench / saltline / what-the-water-keeps）+ /project/ 4 全 + beaker-mixer + atlas 复检，均为真实 3D 场景或页面 UI，无白屏/加载态

## 过程中的失败与处置（透明记录）

1. **首跑批次被后台时限终止**（跑约 99/102 后进程被杀）：已盘存磁盘产物，缺 atlas / what-the-water-keeps / beaker-mixer 三项，用 `--only` 增量补齐；shot_report 改为增量合并避免覆盖。
2. **atlas（HistoryAtlas）两连败**：`Page.screenshot` 30s/60s 超时——页面为持续 rAF 渲染的 3D 地球仪，CDP 截图等待稳定帧被饿死，产物为加载态白屏。**处置**：脚本加 `--wait` 参数，15s 等待重截 → stddev 14.3→83.0，目检确认完整渲染（秦朝疆域地图 + 数据面板）。
3. **what-the-water-keeps**：@2x 下 WebGL 渲染饱和致截图超时。**处置**：重试段自动降 `device_scale_factor=1` 减半渲染负载 → 成功（stddev 48.8）。
4. 报告文件首跑被杀时未落盘，已按磁盘产物补录为 102 条完整报告。

## 页面验收（本地 http.server + playwright 断言）

- 卡片数=102；筛选钮=28（全部 + 8 学科 + 19 内容标签）；统计行「102 个应用 · 覆盖 8 大学科 · 4 类内容」；JS 错误=0
- 点击「物理」→ 20 张（与 cards.json 学科计数一致）、`aria-pressed=true`、hash 写入 `#tag=物理`
- hash 直达 `#tag=化学`（新开页面模拟刷新）→ 32 张、选中态正确
- 手机 390px → 1 列网格；桌面 4 列（≤1020px 3 列 / ≤760px 2 列）
- fallback 卡片：临时副本上标 shot=false 目检通过（渐变底 + 烧杯图标 + 「截图生成中」，仓库数据未动）

## 验收截图（4 张）

- `/Users/leo/repos-local/dispatch/at103-verify/showcase-desktop-full.png`（桌面全量）
- `/Users/leo/repos-local/dispatch/at103-verify/showcase-filter-physics.png`(筛「物理」)
- `/Users/leo/repos-local/dispatch/at103-verify/showcase-mobile.png`（390px 手机）
- `/Users/leo/repos-local/dispatch/at103-verify/showcase-fallback-card.png`（fallback 卡片单卡）

## 边界与纪律

- **未 commit 未 push**（按要求留给指挥官）；git 工作树仅有 3 个新增未跟踪路径（apps-showcase.html / assets/showcase/ / tools/）
- 遗留 5 文件（_data/whitepaper.yml 等）我全程未触碰；开单时它们的未提交改动在本任务执行期间被指挥官自行提交（397a07c，11:58:15），现工作树中已无其改动——特此说明以对账
- 截图站点用 `bundle exec jekyll build -d /tmp/at103-site`（project 4 页与 beaker-mixer 含 Liquid，必须 serve 构建产物而非源码目录）
- 依赖：playwright+pillow 装于独立 venv `/Users/leo/repos-local/dispatch/at103-venv`（系统 python 无 playwright；仓库零污染）
- 日志：`/Users/leo/repos-local/dispatch/at103-shots.log`；复验脚本 `/Users/leo/repos-local/dispatch/at103-verify_page.py`

## 遗留说明

- 首跑全批约 45 分钟（远超预估 15 分钟）：edulab 重量级实验在 SwiftShader 软渲染下加载慢所致；脚本已有增量模式，后续新应用补截用 `--only slug` 即可秒级完成
- robotics-bench 页面自带 `noindex` meta 与域名守卫（localhost 放行），属该应用自身设定，未改
