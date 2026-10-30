---
layout: whitepaper
permalink: /whitepaper/
title: Leo Lu｜个人白皮书
description: Leo Lu（迷鹿 MiLu）个人白皮书：个人定位、内容支柱、经历与作品、课程体系、技能证书、做事方法论、精选文章与媒体报道，一站速览。内容自动取自站点数据，附 PDF 下载。
og_image: /assets/images/profile.jpg
css: whitepaper
theme_freeze: light
---
{% assign wp = site.data.whitepaper %}
{% assign cv = site.data.data %}
{% assign milu = site.data.milu %}
{% capture wp_nl %}
{% endcapture %}
<div class="wp-toolbar">
  <span class="wp-toolbar-brand">迷鹿 MiLu<small>个人白皮书</small></span>
  <span class="wp-toolbar-actions">
    <a href="{{ '/' | relative_url }}">← 返回首页</a>
    <a class="wp-btn" href="{{ '/assets/whitepaper.pdf' | relative_url }}">下载 PDF ↓</a>
  </span>
</div>

<article class="wp-doc">

  <!-- 封面 -->
  <header class="wp-cover">
    <div class="wp-cover-top">
      <span class="wp-cover-mark">鹿</span>
      <span>{{ wp.meta.brand }} · {{ wp.meta.tagline }}</span>
    </div>
    <div class="wp-cover-mid">
      <h1>{{ wp.meta.name }}</h1>
      <span class="wp-cover-sub">{{ wp.meta.label }}</span>
      <p>{{ wp.positioning }}</p>
      <p class="wp-cover-motto">「{{ wp.meta.motto }}」</p>
    </div>
    <div class="wp-cover-bottom">
      <span><b>{{ wp.meta.site }}</b>{{ wp.meta.brand }} 主阵地 · 本文档内容由站点数据自动生成</span>
      <span><b>生成日期</b>{{ site.time | date: "%Y-%m-%d" }}</span>
    </div>
  </header>

  <!-- 目录 -->
  <nav class="wp-toc" aria-label="目录">
    <header class="wp-sec-head">
      <span class="wp-sec-no">CONTENTS</span>
      <h2>目录</h2>
    </header>
    <ol>
      <li><a href="#wp-positioning">个人定位</a></li>
      <li><a href="#wp-pillars">内容支柱</a></li>
      <li><a href="#wp-journey">经历与作品</a></li>
      <li><a href="#wp-courses">课程体系</a></li>
      <li><a href="#wp-skills">技能与证书</a></li>
      <li><a href="#wp-method">做事方法论</a></li>
      <li><a href="#wp-posts">精选文章</a></li>
      <li><a href="#wp-media">媒体报道</a></li>
      <li><a href="#wp-contact">联系方式</a></li>
    </ol>
  </nav>

  <!-- 01 个人定位 -->
  <section class="wp-section" id="wp-positioning">
    <header class="wp-sec-head">
      <span class="wp-sec-no">01</span>
      <h2>个人定位</h2>
    </header>
    <p class="wp-positioning-text">{{ wp.positioning }}</p>
    <div class="wp-factline">
      <b>关键词</b>　AI Agent 与企业级落地 · 舆情大数据与融媒体 · 教育与科研工具 · 产品创业与团队管理<br>
      <b>现状</b>　青矩技术研究院 AI 总监 ｜ 摩豆智能创始人 ｜ 十余年主导上线 30 余款产品 ｜ 四门 AI 实战课
    </div>
  </section>

  <!-- 02 内容支柱 -->
  <section class="wp-section" id="wp-pillars">
    <header class="wp-sec-head">
      <span class="wp-sec-no">02</span>
      <h2>内容支柱</h2>
      <p class="wp-sec-lead">迷鹿 MiLu 的内容与业务围绕三条主线展开。</p>
    </header>
    <div class="wp-cards">
      {% for card in milu.about.cards %}
      <div class="wp-card">
        <h4>{{ card.title }}</h4>
        <p>{{ card.text }}</p>
      </div>
      {% endfor %}
    </div>
  </section>

  <!-- 03 经历与作品 -->
  <section class="wp-section" id="wp-journey">
    <header class="wp-sec-head">
      <span class="wp-sec-no">03</span>
      <h2>经历与作品</h2>
    </header>

    <h3>教育背景</h3>
    {% for edu in cv.education.info %}
    <div class="wp-xp-item wp-avoid">
      <span class="wp-xp-line1">
        <span class="wp-xp-time">{{ edu.time }}</span>
        <span class="wp-xp-role">{{ edu.degree }}</span>
        <span class="wp-xp-co">　{{ edu.university }}</span>
      </span>
      {% assign edu_lines = edu.details | split: wp_nl %}
      {% capture edu_prose %}{% for line in edu_lines %}{% assign t = line | strip %}{% assign head = t | slice: 0, 2 %}{% if t != '' and head != '- ' %}{{ t }} {% endif %}{% endfor %}{% endcapture %}
      {% unless edu_prose == '' %}<p class="wp-xp-prose">{{ edu_prose | strip }}</p>{% endunless %}
      <ul class="wp-xp-detail">
        {% for line in edu_lines %}{% assign t = line | strip %}{% assign head = t | slice: 0, 2 %}{% if head == '- ' %}
        <li>{{ t | slice: 2, 999 }}</li>
        {% endif %}{% endfor %}
      </ul>
    </div>
    {% endfor %}

    <h3>经历时间线</h3>
    <div class="wp-xp">
      {% for xp in cv.experiences.info %}
      <div class="wp-xp-item wp-avoid">
        <span class="wp-xp-line1">
          <span class="wp-xp-time">{{ xp.time }}</span>
          <span class="wp-xp-role">{{ xp.role }}</span>
          <span class="wp-xp-co">　{{ xp.company }}</span>
        </span>
        {% assign xp_lines = xp.details | split: wp_nl %}
        {% capture xp_prose %}{% for line in xp_lines %}{% assign t = line | strip %}{% assign head = t | slice: 0, 2 %}{% if t != '' and head != '- ' %}{{ t }} {% endif %}{% endfor %}{% endcapture %}
        {% unless xp_prose == '' %}<p class="wp-xp-prose">{{ xp_prose | strip }}</p>{% endunless %}
        <ul class="wp-xp-detail">
          {% for line in xp_lines %}{% assign t = line | strip %}{% assign head = t | slice: 0, 2 %}{% if head == '- ' %}
          <li>{{ t | slice: 2, 999 }}</li>
          {% endif %}{% endfor %}
        </ul>
      </div>
      {% endfor %}
    </div>

    <h3>代表作品与实验项目</h3>
    <table class="wp-table">
      <thead>
        <tr><th>名称</th><th>一句话</th><th>领域</th><th>链接</th></tr>
      </thead>
      <tbody>
        {% for group in milu.projects %}{% for item in group.items %}
        <tr>
          <td class="wp-td-title">{{ item.title }}</td>
          <td>{{ item.text }}</td>
          <td class="wp-td-tag">{{ item.tag }}</td>
          <td>{% if item.link %}<a href="{{ item.link | absolute_url }}">查看 ↗</a>{% else %}—{% endif %}</td>
        </tr>
        {% endfor %}{% endfor %}
      </tbody>
    </table>
    <p class="wp-note" style="margin-top:2.5mm">完整作品列表见 milulab.com/work/。</p>
  </section>

  <!-- 04 课程体系 -->
  <section class="wp-section" id="wp-courses">
    <header class="wp-sec-head">
      <span class="wp-sec-no">04</span>
      <h2>课程体系</h2>
      <p class="wp-sec-lead">面向高校与企业的四门实战课，全部内容来自真实项目，先建立直觉，再当堂动手实验。</p>
    </header>
    {% for t in milu.tutorials %}
    <div class="wp-course wp-avoid">
      <div class="wp-course-head">
        <span class="wp-course-meta">{{ t.kicker }} · {{ t.level }} · <b>{{ t.progress.done }}/{{ t.progress.total }} 讲已发布</b></span>
        <h4>{{ t.title }}</h4>
      </div>
      <p class="wp-course-desc">{{ t.description }}</p>
      <ul class="wp-episodes">
        {% for ep in t.episodes %}
        <li><b>{{ ep.title }}</b><span>{{ ep.text }} · {{ ep.status }}</span></li>
        {% endfor %}
      </ul>
    </div>
    {% endfor %}
    <p class="wp-note" style="margin-top:2.5mm">课程入口见 milulab.com/tutorials/，可按需定制企业专场。</p>
  </section>

  <!-- 05 技能与证书 -->
  <section class="wp-section" id="wp-skills">
    <header class="wp-sec-head">
      <span class="wp-sec-no">05</span>
      <h2>技能与证书</h2>
    </header>

    <h3>专业方向</h3>
    <div class="wp-skill-cols">
      <div class="wp-skill-col">
        {% for s in cv.skills.toolset %}{% assign idx = forloop.index0 | modulo: 2 %}
        {% if idx == 0 %}
        <span class="wp-skill wp-avoid">
          <span class="wp-skill-name">{{ s.name }}</span>
          <span class="wp-skill-track"><span class="wp-skill-fill" style="width: {{ s.level }}"></span></span>
        </span>
        {% endif %}
        {% endfor %}
      </div>
      <div class="wp-skill-col">
        {% for s in cv.skills.toolset %}{% assign idx = forloop.index0 | modulo: 2 %}
        {% if idx == 1 %}
        <span class="wp-skill wp-avoid">
          <span class="wp-skill-name">{{ s.name }}</span>
          <span class="wp-skill-track"><span class="wp-skill-fill" style="width: {{ s.level }}"></span></span>
        </span>
        {% endif %}
        {% endfor %}
      </div>
    </div>

    <h3>语言</h3>
    <p>{% for lang in cv.sidebar.languages.info %}{{ lang.idiom }}（{{ lang.level }}）{% unless forloop.last %} · {% endunless %}{% endfor %}</p>

    <h3>认证与著作权</h3>
    <ul class="wp-cert-list">
      {% for c in cv.certifications.list %}
      <li class="wp-avoid"><b>{{ c.name }}</b> — {{ c.organization }}{% if c.details %}<br><span class="wp-note">{{ c.details | strip }}</span>{% endif %}</li>
      {% endfor %}
      <li class="wp-avoid">另有工信部教育与考试中心、阿里达摩院、科大讯飞、魔搭 ModelScope 等多项专业认证，证书列表见 milulab.com/#certificates。</li>
    </ul>
  </section>

  <!-- 06 做事方法论 -->
  <section class="wp-section" id="wp-method">
    <header class="wp-sec-head">
      <span class="wp-sec-no">06</span>
      <h2>做事方法论</h2>
      <p class="wp-sec-lead">从需求到交付的一条工作线。</p>
    </header>
    {% for m in wp.methodology %}
    <div class="wp-method wp-avoid">
      <h4>{{ forloop.index }}. {{ m.title }}</h4>
      <p>{{ m.text }}</p>
    </div>
    {% endfor %}
    <p class="wp-motto-line">「{{ wp.meta.motto }}」</p>
  </section>

  <!-- 07 精选文章 -->
  <section class="wp-section" id="wp-posts">
    <header class="wp-sec-head">
      <span class="wp-sec-no">07</span>
      <h2>精选文章</h2>
      <p class="wp-sec-lead">只写亲手做过、验证过的事。以下取自博客最新文章。</p>
    </header>
    {% for post in site.posts limit:6 %}
    <div class="wp-post wp-avoid">
      <span class="wp-post-line">
        <span class="wp-post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
        <a class="wp-post-title" href="{{ post.url | absolute_url }}">{{ post.title }}</a>
      </span>
      {% if post.description %}<p class="wp-post-desc">{{ post.description }}</p>{% endif %}
    </div>
    {% endfor %}
    <p class="wp-note" style="margin-top:2.5mm">全部文章见 milulab.com/blog/。</p>
  </section>

  <!-- 08 媒体报道 -->
  <section class="wp-section" id="wp-media">
    <header class="wp-sec-head">
      <span class="wp-sec-no">08</span>
      <h2>媒体报道</h2>
      <p class="wp-sec-lead">产品与实践被主流媒体记录的瞬间（精选）。</p>
    </header>
    {% for m in wp.media_highlights %}
    <div class="wp-media-item wp-avoid">
      <span class="wp-media-line"><b>{{ m.source }}</b> · {{ m.date }}</span>
      <a class="wp-media-title" href="{{ m.url }}">{{ m.title }}</a>
      <span class="wp-media-url">{{ m.url | remove: 'https://' | remove: 'http://' | split: '/' | first }}</span>
    </div>
    {% endfor %}
    <p class="wp-note" style="margin-top:2.5mm">完整报道列表与视频存档见 milulab.com/#media。</p>
  </section>

  <!-- 09 联系方式 -->
  <section class="wp-section" id="wp-contact">
    <header class="wp-sec-head">
      <span class="wp-sec-no">09</span>
      <h2>联系方式</h2>
    </header>
    <div class="wp-contact">
      <p><b>邮箱</b>　<a href="mailto:{{ cv.sidebar.email }}">{{ cv.sidebar.email }}</a></p>
      <p><b>GitHub</b>　<a href="https://github.com/{{ cv.sidebar.github }}">github.com/{{ cv.sidebar.github }}</a></p>
      <p><b>产品</b>　<a href="https://maudelclaw.ai">maudelclaw.ai</a>（摩豆智能 · 企业级 AI Agent 平台）</p>
      <p><b>网站</b>　<a href="{{ cv.sidebar.website }}">{{ wp.meta.site }}</a>（迷鹿 MiLu 主阵地）</p>
    </div>
    <p class="wp-closing">欢迎聊聊 AI 应用、产品原型、科研与教育工具，或任何值得认真解决的问题。<br>{{ wp.meta.brand }} · {{ wp.meta.tagline }} · 「{{ wp.meta.motto }}」</p>
  </section>

</article>
