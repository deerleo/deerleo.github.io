#!/usr/bin/env node
/**
 * 为「建设中」实验生成占位页 <slug>/index.html
 *
 * 已实现（earth/tide/water）的实验跳过，不动已有目录。
 * 产物为纯静态 HTML（无 YAML front matter，Jekyll 原样拷贝，不经 Liquid 处理）。
 *
 * 用法：node tools/gen-placeholder.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cards = JSON.parse(readFileSync(join(root, 'assets', 'data', 'cards.json'), 'utf8'));
const sections = JSON.parse(readFileSync(join(root, 'assets', 'docs', 'wedulab_sections.json'), 'utf8'));

const SKIP = new Set(cards.implemented);

const LOGO_SVG = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19 6h10M21 6v12.5L9.8 37.2A4 4 0 0 0 13.3 43h21.4a4 4 0 0 0 3.5-5.8L27 18.5V6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 30h17" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="36.5" r="1.8" fill="currentColor"/><circle cx="27.5" cy="34.5" r="1.4" fill="currentColor"/><path d="M24 6v-2" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;


function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

let made = 0;
for (const lab of cards.labs) {
  if (SKIP.has(lab.slug)) continue;
  const dir = join(root, lab.slug);
  mkdirSync(dir, { recursive: true });
  const chapters = sections[lab.slug] || [];
  const chapterList = chapters.length
    ? `<div class="placeholder-points">${chapters
        .slice(0, 6)
        .map((c) => `<span class="tag">${esc(c)}</span>`)
        .join('')}${chapters.length > 6 ? `<span class="tag">…共 ${chapters.length} 章</span>` : ''}</div>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(lab.fullname)} · 建设中 — EduLab</title>
<script>
/* 主题首帧应用（浅/深，默认跟随系统） */
(function(){try{var t=localStorage.getItem('edulab-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>
<link rel="stylesheet" href="../assets/css/edu.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath d='M19 6h10M21 6v12.5L9.8 37.2A4 4 0 0 0 13.3 43h21.4a4 4 0 0 0 3.5-5.8L27 18.5V6' stroke='%23e8674a' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
</head>
<body>
<header class="edu-header">
  <a class="edu-logo" href="../">${LOGO_SVG}<span>EduLab<span class="logo-sub">教学实验平台</span></span></a>
  <span class="spacer"></span>
  <a class="edu-header-btn" href="../">← 返回实验目录</a>
  <button class="edu-header-btn" id="themeBtn" type="button" aria-label="切换主题">☾</button>
</header>

<main class="placeholder-wrap">
  <div class="placeholder-icon">
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M19 6h10M21 6v12.5L9.8 37.2A4 4 0 0 0 13.3 43h21.4a4 4 0 0 0 3.5-5.8L27 18.5V6" stroke="#e8674a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 30h17" stroke="#e8674a" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="36.5" r="1.8" fill="#e8674a"/><circle cx="27.5" cy="34.5" r="1.4" fill="#e8674a"/></svg>
  </div>
  <h1>${esc(lab.fullname || lab.name || lab.subtitle)}</h1>
  <div class="sub">${esc(lab.subtitle || '')} · ${esc(lab.subject || '')}</div>
  <p class="desc">${esc(lab.desc || '')}</p>
  ${chapterList}
  <div class="placeholder-points">${(lab.points || []).map((p) => `<span class="tag">${esc(p)}</span>`).join('')}</div>
  <div class="badge-building"><span class="pulse"></span>该实验正在建设中，敬请期待</div>
</main>

<footer class="edu-footer">
  <span>EduLab · <a href="/">milulab.com</a></span>
</footer>

<script src="../assets/js/edu-theme.js"></script>
<script>eduBindThemeToggle(document.getElementById('themeBtn'));</script>
</body>
</html>
`;
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  made++;
}
console.log(`placeholder pages: ${made} written (skipped implemented: ${[...SKIP].join(', ')})`);
