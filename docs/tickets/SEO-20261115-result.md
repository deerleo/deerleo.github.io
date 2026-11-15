# SEO-20261115 执行结果：lu.wiki 权威域切换 + 收录优化

- 执行时间：2026-11-15 晚（headless 派发，日志 `/Users/leo/repos-local/dispatch/seo-luwiki-20261115-201558.log`）
- 结论：**全部改动完成，8 项验收全过，未 commit（按工单要求等指挥官校验统一提交）**
- 建议提交信息：`seo: 权威域切换 lu.wiki + sitemap/robots/llms 同步，页面渲染零改动`

## 一、改动文件清单（6 个，git diff --stat 实测）

| 文件 | 改动 |
|---|---|
| `_config.yml` | `url: 'https://milulab.com'` → `url: 'https://lu.wiki'`（仅此一行） |
| `robots.txt` | Sitemap 行改 `https://lu.wiki/sitemap.xml`；按现有注释风格追加 `Meta-ExternalAgent` / `MistralAI-User` / `omgili` 三段显式放行（各 `User-agent:` + `Allow: /`） |
| `llms.txt` | 8 处站内链接 `https://milulab.com/...` → `https://lu.wiki/...` |
| `llms-full.txt` | 12 处站内链接同上替换 |
| `_includes/head.html` | 第 77 行 JSON-LD `"alternateName": "milulab.com"` → `"lu.wiki"`（见「head.html 说明」） |
| `404.html` | `<meta name="robots" content="noindex">` → `content="noindex, nofollow"`（工单要求的补齐，仅此一行） |

### head.html 说明（工单条款 4 的例外）

工单预期 head.html 零改动；实测发现一处硬编码 `milulab.com`：首页 WebSite JSON-LD 的 `"alternateName": "milulab.com"`——是站点别名字符串、非 URL，canonical/og:url/og:image/JSON-LD url/面包屑等其余全部走 `site.url` 自动跟随。按工单「发现硬编码才改」条款改为 `lu.wiki`，改动仅在 head 元数据内，不影响任何渲染（该字符串不进可见文本）。

## 二、验收证据（逐项）

### 1. 构建成功、无新告警 ✓

- 改动后构建 `done in 2.59 seconds`，无 ERROR；告警仅存量 `_sass/_base.scss` lighten() 弃用警告（工单注明可忽略），全量扫描无其他 warn。

### 2. _site 抽查 5 页 canonical / og:url / JSON-LD ✓（附存量说明）

- `/index.html`：`rel="canonical" href="https://lu.wiki/"`、`og:url content="https://lu.wiki/"`、JSON-LD `@id: https://lu.wiki/#person`、`url: https://lu.wiki/` ✓；head 内 milulab.com 残留 0。
- `/blog/index.html`、`/work/index.html`、`/books/index.html`、`/course/coding-plans/index.html`：4 页均为 **`layout: null` 独立静态页、自带 head，基线中就无 canonical/og:url**（基线=新构建=0，存量状况非本次引入）；其 JSON-LD 内 `url` 字段已全部为 `https://lu.wiki/...`，head 内 milulab.com 残留 0。courses 的 JSON-LD `url` 字段本就不存在（存量）。
- 全站复核：非禁动目录所有页面 head 区域 milulab.com 出现数 = 0。

### 3. sitemap.xml ✓

- 126 个 `<loc>` 全部为 lu.wiki（`grep '<loc>' | grep -vc lu.wiki` = 0）；books 子页在列（ai-fitness / ai-auto-repair / ai-water-environment / ai-grassroots-health / ai-factory 等）。

### 4. robots.txt ✓

- `_site/robots.txt` 末行 `Sitemap: https://lu.wiki/sitemap.xml`；三个新爬虫段（Meta-ExternalAgent / MistralAI-User / omgili）均在 Amazonbot 之后按原风格排列。

### 5. feed.xml ✓

- `<id>https://lu.wiki/</id>`、`<link href="https://lu.wiki/"/>`、entry link/id 全为 lu.wiki；`https://milulab.com` 在 feed 中出现数 = 0。

### 6. llms.txt / llms-full.txt ✓

- `_site/llms.txt` 8 处、`_site/llms-full.txt` 12 处站内链接全为 `https://lu.wiki/...`，`https://milulab.com` 出现数均 = 0；外部链接不动（`github.com/deerleo`、`maudelclaw.ai` 原样）；两文件第 5 行正文描述「个人官网（milulab.com）」为叙述文字非链接，按工单「描述文字一字不动」保留。

### 7. 视觉零改动（核心验收）✓

基线 `/tmp/site-baseline-seo`（改动前构建）vs 新 `_site`，6 页（5 代表页 + 404.html）：

- **剥离全部 HTML 标签后的可见文本逐页 diff：全部为空**（index / blog / work / books / course / 404 六页 TEXT-IDENTICAL）。
- `<body>` HTML diff：初测 blog/work/books 三页有 diff，**逐行定位全部来自页面内嵌 `<script type="application/ld+json">` 数据块的 URL 字段跟随 site.url（milulab.com → lu.wiki）**——即工单验收项 2 明确要求的 JSON-LD url 切换，是权威域切换的预期必要变化，非可见 DOM 变化。**剥离 script 数据块后 body 结构 diff 全部为空**（六页 BODY-STRUCT-IDENTICAL）。
- 404.html 仅 head 增加 nofollow（允许项），body 不变 ✓。

### 8. git 汇总 ✓

- 6 个文件改动：`404.html(2±1) _config.yml(2±1) _includes/head.html(2±1) llms-full.txt(24) llms.txt(16) robots.txt(11+1-)`，33 insertions / 24 deletions，与工单预期 6 个一致；无未跟踪新文件（本报告除外）。

## 三、确认项结果（只验证不改动）

| 页面 | 结果 |
|---|---|
| `bio.html` | ✓ noindex 在：front matter `hidden: true` → head.html 输出 `<meta name="robots" content="noindex, nofollow">`（基线实测） |
| `print.html` | ⚠️ **基线中无 noindex**（`_site/print.html` 无 robots meta）——其 front matter 只有 `layout: print` + `theme_freeze: light`，**没有** `noindex: true`/`hidden`，与工单预期不符。按工单「确认项无改动则不动」未动，列入遗留问题 |

## 四、排查项清单（只报告不改动，均为可见正文/内容，属禁改范围）

| 位置 | 出现处 | 性质 |
|---|---|---|
| `index.html` | 2 处（正文 459 行 FAQ 答案 + 470 行 FAQPage JSON-LD answer text） | 正文叙述「迷鹿 MiLu 是什么」中的品牌/域名文案，可见文本 |
| `personal/baby-3d.html` | 1 处（188 行） | footer `<a href="/">milulab.com</a>`——相对链接 + 域名品牌字样，可见文本 |
| `course/ai-data-analyse/dify.html` | 1 处（753 行） | 页面 JS 展示字符串 `https://milulab.com/project/dsh-research-lab`，属页面内容 |
| `edulab/` 下 13 个 `index.html` | 13~26 处（每页 1~2 处：header 按钮 + footer） | `<a href="/">milulab.com</a>` 相对链接 + 品牌文字，可见文本；实际跳转是相对路径不受域名切换影响 |

以上全部为**可见文本或页面内容**，链接本身多为相对路径（`href="/"`），域名切换后行为不受影响；仅文字字样保留旧域名，属正文内容未动。

## 五、遗留问题与建议

1. **print.html 缺 noindex**（本工单新发现）：打印版简历页内容与 `/bio/` 高度重复且可被收录。建议后续给 `print.html` front matter 加一行 `noindex: true`（head.html 已支持，改动 1 行），本次未授权未动。
2. **CNAME 文件仍为 `milulab.com`**（仅检查未动，工单未授权）：GitHub Pages custom domain 仍是 milulab.com，lu.wiki 经阿里云 CDN 回源。若 CDN 回源请求不改写 Host 为 milulab.com，GitHub Pages 会把 lu.wiki 请求 301 回 milulab.com，抵消 canonical 切换效果。现状 lu.wiki 可访问（备案页脚工单已上线）说明链路当前可用，建议 Leo 或运维确认 CDN 回源 Host 改写配置，切换生效期内可抽查 `curl -sI https://lu.wiki/ | grep -i location` 应无 301 到 milulab.com。
3. `index.html` FAQPage JSON-LD 的 answer 文本中含「milulab.com」字样：属 FAQ 可见文案（正文内容），未动；该 JSON-LD 的 url 类字段已全切 lu.wiki。
4. 搜索引擎侧后续动作（本工单范围外）：Google Search Console / Bing Webmaster 验证 lu.wiki 并提交新 sitemap；观察 milulab.com 信号合并（canonical 已指 lu.wiki，无需 301 也能合并，但 301 更快）。

## 六、验证脚本存档

- 基线：`/tmp/site-baseline-seo`（改动前完整构建副本）
- 可见文本/body 结构 diff 脚本逻辑见 dispatch 日志；核心判据：剥标签文本 diff 空 + 剥 script 后 body diff 空（原始 body diff 仅 JSON-LD URL 跟随）。
