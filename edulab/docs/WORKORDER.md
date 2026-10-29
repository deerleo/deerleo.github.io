# 工单：EduLab 平台骨架 + P1 首批实验（earth / tide / water）

> 执行者：本地 Claude Code（dangerously-skip-permissions）
> 工作目录：`/Users/leo/milulab/edulab/`
> 背景与合规约束先读：`/Users/leo/milulab/edulab/README.md`

## 目标

在 milulab.com 的 `/edulab` 子目录下自研重造一个交互式教学实验平台。本次工单交付 **P0 平台骨架 + P1 三个 3D 实验**（地球运动 / 潮汐 / 水循环），代码全部新写，只复用已授权的 3D 资源。

## 硬约束（违反任何一条即为验收失败）

1. **不碰仓库其他文件**：只允许在 `/Users/leo/milulab/edulab/` 内新建/修改文件；`git status` 里不允许出现 edulab 之外的变更（工作区已有未提交的博客改动，绝对不要动）。
2. **不使用原站任何 JS/CSS 产物**（`/tmp/wedulab_src/assets/*.js` 仅可作行为参考阅读，禁止复制进项目）。
3. **署名**：目录首页与每个实验页页脚必须含 `3D 资源来源：WeduLab © WY · wedulab.com`（超链接 https://wedulab.com ）。
4. **noindex**：edulab 下所有 HTML 加 `<meta name="robots" content="noindex,nofollow">`。
5. **首页不加链接**：不得修改 `/Users/leo/milulab/index.html`、导航、sitemap 或其他任何现有文件来暴露 edulab 入口。
6. 资源直接用 `assets/textures/` 下现有文件（带 vite 风格 hash 的文件名保留原样引用即可）。
7. 所有相对路径按「站点子目录 /edulab/」设计，构建产物也从 /edulab/ 根起算（用相对路径 `../assets/...` 或运行时以 `import.meta.env.BASE_URL` 解析）。

## 交付物

### P0 平台骨架

- `edulab/index.html`：实验目录首页
  - 按学科分组的实验卡片（39 个，数据从 `assets/docs/labs.json` + `fullnames.json` + `sections.json` 读取，构建时内联或运行时 fetch 均可）
  - 卡片：实验名 + 副标题 + 学科色标 + 简介 + 知识点标签；未实现的实验置灰标「建设中」（39 个里本次只做 3 个，其余全部置灰但可点击进入占位页）
  - 学科筛选 tab + 关键词搜索；深浅色主题（跟随 prefers-color-scheme + 手动切换）；移动端可用
  - 风格：与 milulab 品牌站协调（简洁、留白、圆角卡片），但要有自己的实验室气质（可参考原站 W 字 logo 思路换成一个烧瓶/原子图标）
- 占位页模板 `edulab/<slug>/index.html`：统一「建设中」页 + 返回目录链接 + 署名页脚
- 资源预加载规范：写一个 `assets/js/` 下的共享工具模块（贴图加载器、HDR 加载器、通用场景脚手架、控制条 UI 组件）

### P1 三个实验（完整可交互）

规格见 `assets/docs/sections.json`（章节即功能模块），页面内需实现章节切换侧栏/顶栏：

1. **`edulab/earth/`** 地球运动课堂
   - 章节：地球运动总览 / 地球自转 / 昼夜交替与晨昏线 / 地球公转 / 太阳直射点的移动 / 昼夜长短 / 正午太阳高度 / 四季更替 / 随堂检测
   - 3D：贴图球（用 `textures/earth/` 下 day/night/clouds/normal/specular），自转公转动画、晨昏线明暗半球、直射点标记、可调日期观察昼夜长短与正午太阳高度
   - 随堂检测：3-5 道选择题（自拟题目，知识点对即可）
2. **`edulab/tide/`** 潮汐的形成
   - 章节：潮起潮落 / 引潮力 / 两次涨落 / 大潮与小潮 / 日潮不等
   - 3D：地球+月球系统，引潮力箭头分解（惯性离心力+月球引力），潮汐隆起随月球位置移动，海岸小窗显示水尺涨落与昼夜
3. **`edulab/water/`** 水循环三维沙盘
   - 章节：水循环环节（蒸发/水汽输送/降水/径流/下渗/地下径流）/ 三类水循环 / 海绵城市 / 水量平衡
   - 3D：剖面地形沙盘（海洋-城市-水库-高山-内陆湖），粒子演示水循环各环节，可切换城市场景对比海绵城市效果

### 构建

- 用 Vite 多页应用（MPA）模式：`edulab/` 内自建 `package.json` + `vite.config.js`，`base: '/edulab/'`
- 构建产物输出到 `edulab/dist/`，但**最终提交进 git 的形态**需要满足 GitHub Pages 直出：把 dist 内容同步回各 `edulab/<slug>/` 静态 HTML（或直接不用构建步骤、手写原生 ESM + importmap 引 three.js CDN 本地副本——二选一，以「push 后 GitHub Pages 能直接打开」为准）
- three.js 依赖本地化（npm 安装后打包，或 vendor 进 `edulab/assets/vendor/`），不依赖公网 CDN 运行时
- 首页卡片数据生成脚本：`edulab/tools/build-cards.mjs`（从 assets/docs/*.json 生成 cards.json）

## 验收标准（完成后自查并报告）

- [ ] `python3 -m http.server -d /Users/leo/milulab 8901` 起服务后，浏览器可打开 `/edulab/`、`/edulab/earth/`、`/edulab/tide/`、`/edulab/water/`
- [ ] 三个实验 3D 渲染正常、章节切换可用、控制条交互可用、无 console 报错
- [ ] 贴图资源加载全部 200（引用路径正确）
- [ ] 每页有署名页脚与 noindex meta
- [ ] `git status` 仅 edulab/ 下有新增
- [ ] 目录首页在手机宽度（375px）下布局正常

## 报告要求

完成后输出：实现方式摘要、文件清单、自查结果（逐项验收标准）、遗留问题。
