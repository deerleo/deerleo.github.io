---
title: "Google 发布 Gemini 4 Carbon：新榜首 59 分，但考卷没护栏，监考是自己家"
description: "Gemini 4 Carbon 三个外部安全基准第一，AA v5.0 拿 59 登顶，接 Opus 5.5 的 58。但分数是 Google 自己填的，模型发布当天普通用户还拿不到。拆一下这份成绩单里哪些是真的，哪些要等。"
tags: [Gemini, Google DeepMind, AI安全, 模型评测]
series: ""
---

![Google DeepMind 品牌实拍（图源 TechCrunch）](/assets/images/2026-10-29-gemini-carbon-cyber-first/cover-deepmind.jpg)

早上那条微头条刚说过，Artificial Analysis 的新版 v5 榜单，闭源榜首是 Claude Opus 5.5，58 分。

那是榜单上线一刻的成绩。同一天晚些时候，Google 把新旗舰 Gemini 4 Carbon 放上了同一个榜：59 分，接管榜首。

三个安全基准，全是"发布时最佳"。SEC-bench Pro 88.2%，测从真实软件里挖漏洞；ExploitGym 54.8%，测能不能把已知漏洞变成可运行的攻击；CWE-bench 71.0%，测把漏洞修在根上。出题方倒是都硬——学界两家加创业公司一家，连 ExploitGym 的论文里都记着 OpenAI 模型越狱沙箱的前科，动的是真格。

![Google 官方 TPU 数据中心实拍（图源 Google 官方博客素材）](/assets/images/2026-10-29-gemini-carbon-cyber-first/tpu-datacenter.webp)

但这份成绩单有个官方自己标注的脚注："Carbon excels across key external benchmarks (evaluated without guardrails)"——无护栏跑分。带护栏的产品内表现是什么样，博客里没有对照数据。

安全数据更微妙。作弊成功率降到 0.0%，间接注入攻击抵抗 0.0%，高危 misalignment 告警降八成。看着漂亮，细看归因：几乎全是 Google 自测。Gray Swan 是真外部公司，出题是它的，可成绩单还是 Google 填的；"Wiz 也观察到 Carbon 领先"——Wiz 是 Google 自家子公司。

还有个细节。Google 公布的对比表格里没列 Kimi K3.1 Pro，而 AA 官网上 Kimi 在 Terminal-Bench 4.0 拿 67%，比 Carbon 的 65.2% 高。据 CellCog 核查，这才是完整的榜单。

![Gemini 品牌标识（图源 the-decoder）](/assets/images/2026-10-29-gemini-carbon-cyber-first/gemini-logo.png)

最狠的一刀是分发节奏。官方原话叫"deliberate approach to rollout"：本周起先给一小撮网络防御者，再经 Fairwind 计划逐步扩大——审批制，背景审查，650 多家伙伴。普通开发者？官方说法是"as soon as possible"，没有日期。发布当天，AA 的 Carbon 页面报错，OpenRouter 上只有上一代 Argon。满分模型，你摸不到，自然也没人能独立复测。

这套玩法有它的逻辑：能挖洞的模型也能造洞，先让防守方拿到手没毛病。但代价是"分数先行、验证缺席"的闭环——榜单第一是真的，验证是缺的。Carbon 到现在连专属安全报告都没有，官方那份责任开发深读只写了 Argon。

定价倒是实在，intro 价 2 美元每百万输入、10 美元每百万输出，缓存再打 95 折。注意脚注：intro 期结束后变 4 美元和 20 美元，截止日期没公布。

![GPU 数据中心机房实拍（图源 ExtremeTech）](/assets/images/2026-10-29-gemini-carbon-cyber-first/gpu-datacenter.jpg)

一个月两个旗舰，榜首只换了一天的人。Vince Cerf 说过互联网考验的是信任工程，模型榜单也一样——分数是一夜的事，验证是慢工。

你信 59 分，还是等别人复测？

---

## 图片使用清单（发布前核验，不对外渲染）

| 文件 | 位置 | 图注 | 来源 | 版权注意 |
|---|---|---|---|---|
| cover-deepmind.jpg | 头图 | Google DeepMind 品牌实拍 | TechCrunch（techcrunch.com，2026-03-24 文章素材） | 媒体图个人博客引用惯例，低风险 |
| tpu-datacenter.webp | 安全基准段后 | Google 官方 TPU 数据中心实拍 | Google 官方博客素材桶（storage.googleapis.com/gweb-uniblog-publish-prod） | 官方素材，风险最低 |
| gemini-logo.png | 榜单段后 | Gemini 品牌标识 | the-decoder.com（2024-08 文章素材） | 媒体图低风险 |
| gpu-datacenter.jpg | 定价段后 | GPU 数据中心机房 | ExtremeTech（extremetech.com） | 媒体图低风险 |

检索与判定过程：`~/media/topics/_daily/20261029-carbon-blog/imgs/`（manifest.json + final.json + 各组 grid 直读记录）。淘汰：freepik AI 生成图整组、dreamstime/alamy/gettyimages 水印图。
