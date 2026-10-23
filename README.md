# 迷鹿 MiLu · 个人品牌网站

基于 Jekyll 构建的个人网站，用于呈现「AI 有鹿」的品牌定位、内容支柱、个人经历叙事与合作方向。

## 本地预览

```bash
bundle install
bundle exec jekyll server --host 0.0.0.0
```

打开 <http://127.0.0.1:4000> 预览。

如需生成静态文件：

```bash
bundle exec jekyll build
```

## 主要内容维护

- 站点标题、描述与域名：`_config.yml`
- 原履历页：`bio.html`，访问路径为 `/bio/`；首页不展示入口，并已设置 `noindex`
- 首页结构与文案：`index.html`
- 品牌视觉与响应式样式：`assets/css/milu.css`
- 头像：`assets/images/avatar.jpg`
- 项目、Blog、教程与自媒体内容：`_data/milu.yml`
- 教程支持 `mode: single` 和 `mode: series`；系列教程可在 `episodes` 中维护章节与状态
- 网站 favicon：`assets/images/favicon.svg`
- 二级、三级教程与项目页的顶部及页脚规范：[`docs/subpage-visual-standard.md`](docs/subpage-visual-standard.md)，共享组件见 `_includes/subpage-shell.html` 与 `assets/css/subpage-shell.css`
