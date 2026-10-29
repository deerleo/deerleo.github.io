# 工单：EduLab P2 批量实验实现（通用模板 + 批次规格）

> 执行者：本地 Claude Code（dangerously-skip-permissions）
> 工作目录：`/Users/leo/milulab/edulab/`
> 本文件是通用规范；本批具体实验清单与章节结构在同目录 `workorder-<批次>.json`。

## 使命

把批次内每个实验从「建设中」占位页升级为**完整可交互的教学实验**。这是自研重造项目（背景读 `edulab/README.md`）：3D 资源已授权可用，代码全部新写。**质量标准与已上线的 earth/tide/water 三个实验一致**（实现参考 `assets/js/lab-earth.js` / `lab-tide.js` / `lab-water.js` 的架构与代码风格）。

## 冻结区（禁止修改）

- `edulab/index.html`、`assets/js/edu-core.js`、`edu-theme.js`、`lab-earth.js`、`lab-tide.js`、`lab-water.js`、`lab.css`、`edu.css`（共享文件；若确有缺陷需要小改，在报告中单独列出，不要直接改）
- `edulab/` 之外的任何文件
- 已上线的 `earth/`、`tide/`、`water/` 目录
- `assets/textures/`、`assets/lib/`（只读引用）

## 每个实验的交付物

1. `edulab/<slug>/index.html`：覆盖占位页。结构复制 earth/index.html 的骨架：顶栏（返回目录/标题/章节导航）、章节侧栏（移动端抽屉）、说明卡、画布区、底部控制条、署名页脚（`3D 资源来源：WeduLab © WY · wedulab.com`）、`<meta name="robots" content="noindex,nofollow">`。
2. `assets/js/lab-<slug>.js`：实验逻辑。用 `edu-core.js` 的现有工具（场景脚手架/贴图加载器/控制条组件/章节管理器），不要重复造轮子；缺的工具写进本实验文件内，不改共享文件。
3. **交互要求**（每个实验都必须满足）：
   - 所有章节（见批次 JSON 的 `chapters`）均有对应内容与切换，不少于 chapters 数
   - 3D 主体可拖拽旋转缩放（OrbitControls），有至少 3 个可操作控件（滑杆/开关/按钮）
   - 章节含「随堂检测」的：3-5 道自拟选择题（知识点正确即可），计分 + 解析
   - 有进度反馈的加载态；移动端 (375px) 不横向溢出
4. **物理/化学/生物/地理实验**优先 3D 或 2D canvas 仿真；**数学实验**可用 canvas 2D（坐标系/几何作图）；**历史地图类**用 2D canvas 地图；**neuro**（机器学习识别手写数字）用 canvas 画板 + 浏览器内实现的小型网络（可用预置权重或简单感知机/最近邻演示，重点是教学演示流程完整）。

## 资源约定

- 贴图库在 `assets/textures/{pbr,sky,earth}/`（PBR 三件套命名 `<name>_arm/_diff/_nor-<hash>.webp`，66 套；天空 HDR/webp；地球全套）。引用前先 `ls` 确认实际文件名（带 hash 后缀），用相对路径 `../assets/textures/...` 或按 earth 现有写法。
- 场景背景/环境光：室内实验用 `sky_court`，港口/海岸用 `sky_harbor`，工地/野外用 `sky_site`（hdr 用于环境贴图，webp 用于背景）。
- 没有 3D 模型文件（无 glb）——所有几何体用 three.js 程序化建模（BoxGeometry/CylinderGeometry/LatheGeometry/Shape+ExtrudeGeometry 等），参考 lab-tide.js 的做法。

## 技术约束

- 原生 ESM + importmap（复制 earth/index.html 里的 importmap 配置），three.js 从 `../assets/lib/three/` 本地加载，禁公网 CDN
- 不新增任何 npm 依赖、不引入构建步骤
- 单实验 JS 控制在 ~40KB 内，数学仿真循环用 requestAnimationFrame，注意性能（粒子/物体总数给上限）
- 每个实验页加载后 console 必须零报错零警告

## 验收自查（每个实验逐项过，最后汇总报告）

- [ ] 页面 200，无 404 资源引用（贴图路径逐一 ls 核对）
- [ ] 全章节切换可用，交互控件可用
- [ ] canvas/WebGL 实际渲染出内容（写一个 puppeteer 或 playwright 无头截图自查；无环境则用 node --check 语法检查 + 手动代码走查并在报告注明）
- [ ] 署名页脚 + noindex 在
- [ ] console 零报错
- [ ] 375px 布局正常

## 报告要求

按实验逐个输出：实现方式（3D/2D、核心交互点）、控件清单、自查结果、备注。最后给出整批文件清单与共享工具的改进建议（如发现 edu-core 缺口）。

## 执行顺序建议

先做批次内最简单的 1 个打通管线，再并行铺开；每个实验完成即自查，不要攒到最后。
