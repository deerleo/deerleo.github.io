# EduLab — 交互式教学实验平台（自研重造）

milulab.com 的二级教学实验平台，位于 `/edulab`。**首页不加任何入口链接**，`noindex`。

## 授权与署名（重要）

- 3D 资源（PBR 贴图 / HDR 天空盒 / 地球贴图）经作者 WY 书面授权使用（2026-10，Leo 口头确认授权存在，要求：不做纯镜像、代码自研重造）。
- 所有实验页面必须保留页脚署名：`3D 资源来源：WeduLab © WY · wedulab.com`
- **禁止**：纯镜像原站代码、删除署名、商用、改名声称自创资源。
- 原实验核心代码为 AES-GCM 加密（.enc + 服务端下发密钥），无法也不应获取；本项目全部代码为自研实现。

## 目录结构

```
edulab/
  index.html          # 实验目录首页（自研，noindex）
  <slug>/index.html   # 39 个实验页（分阶段实现）
  assets/
    textures/pbr/     # 66 个 PBR 材质贴图（arm/diff/nor 三件套）
    textures/sky/     # 6 个天空资源（3 HDR + 3 webp 预览）
    textures/earth/   # 10 个地球贴图（昼/夜/云/水/法线/高光等）
    textures/ui/      # 3 个 UI 图（公众号/微信/小红书，可不复用）
    docs/             # 重造需求规格（labs.json 等）
```

## 实验清单（39 个 live）

见 `assets/docs/labs.json`（id/name/subtitle/subject/desc/points/status）+ `sections.json`（各实验章节结构）+ `fullnames.json`（完整显示名）。

学科分布：物理 10 · 生物 7 · 化学 7 · 地理 6 · 数学 6 · 历史 2 · 信息技术 1

## 分阶段实施

- **P0 平台骨架**：目录首页（学科分组卡片、搜索筛选、深浅主题）、路由约定、Three.js 引入方式（npm 构建，不用原站产物）。
- **P1 首批实验**（验证管线，含 3D）：earth（地球运动）、tide（潮汐）、water（水循环）——地球贴图/天空资源直接复用。
- **P2 批量铺开**：按学科分批实现剩余实验，每批过浏览器实测。

## 技术约定

- Three.js + 原生 ES Modules（或 Vite 构建），不引 React 以外的重运行时也可，尊重原站技术选型但代码全新。
- 实验页统一模板：顶栏（返回/标题/章节切换）+ 主画布 + 底部控制条。
- 移动端可用，适合投屏。

## Tongjiang Lab 拓展线（2026-10-30）

- 来源：https://github.com/smithjohn78390/tongjiang-lab （54 个实验：物理 10 / 化学 25 / 生物 5 / 地理 14）
- 署名：已获作者书面授权（2026-10-30，Leo），页面署名展示已移除
- 许可：上游许可为 CC BY-NC 4.0，非商业使用的法律条款继续有效并遵守
- 书面授权文件应存档于 edulab/docs/（待 Leo 归档）
- 每个实验为单文件自包含 HTML（three.js 内嵌），位于 edulab/<slug>/index.html
- 原始 catalog 备份：assets/data/tongjiang-catalog.json
- 与 WeduLab 自研线并存，卡片 source=tongjiang 区分
