#!/usr/bin/env node
/**
 * 从 assets/docs/wedulab_*.json 生成首页卡片数据 assets/data/cards.json
 *
 * 输入：
 *   wedulab_labs.json      实验清单（id/name/subtitle/subject/desc/points/href）
 *   wedulab_fullnames.json 完整显示名
 *   wedulab_sections.json  各实验章节（功能模块）结构
 * 输出：
 *   ../assets/data/cards.json
 *
 * 用法：node tools/build-cards.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'assets', 'docs');

const labs = JSON.parse(readFileSync(join(docs, 'wedulab_labs.json'), 'utf8'));
const fullnames = JSON.parse(readFileSync(join(docs, 'wedulab_fullnames.json'), 'utf8'));
const sections = JSON.parse(readFileSync(join(docs, 'wedulab_sections.json'), 'utf8'));

const cards = labs
  .filter((l) => l.status === 'live')
  .map((l) => {
    const slug = (l.href || `/${l.id.replace(/-lab$/, '')}`).split('/').pop();
    return {
      slug,
      name: l.name,
      subtitle: l.subtitle,
      subject: l.subject,
      desc: l.desc,
      points: l.points,
      fullname: fullnames[slug] || l.name || l.subtitle,
      chapters: sections[slug] ? sections[slug].length : 0,
      // 2026-10-30 P2 全量实装后所有 live 实验均已上线，全部置 true（labs 过滤 status==='live' 已保证都是真实验）
      implemented: true,
    };
  });

// Tongjiang Lab 拓展线（CC BY-NC 4.0，署名 Tongjiang Lab · lab.tongjiang.app）：
// 上游 catalog 备份在 assets/data/tongjiang-catalog.json，追加在 WeduLab 条目之后，不打乱现有排序
const TJ_SUBJECT = { phys: '物理', chem: '化学', bio: '生物', geo: '地理' };
let tongjiang = [];
const tjCatalogPath = join(root, 'assets', 'data', 'tongjiang-catalog.json');
try {
  const tj = JSON.parse(readFileSync(tjCatalogPath, 'utf8'));
  const wedulabSlugs = new Set(cards.map((c) => c.slug));
  tongjiang = tj.map((c) => {
    // 与现有目录重名时上游 slug 加 -tj 后缀（与导入时目录名一致）
    const slug = wedulabSlugs.has(c.slug) ? `${c.slug}-tj` : c.slug;
    return {
      slug,
      name: c.title,
      subtitle: c.type,
      subject: TJ_SUBJECT[c.subject] || c.subject,
      desc: c.question,
      points: (c.steps || []).slice(0, 4),
      fullname: `${c.title} · Tongjiang Lab`,
      chapters: (c.steps || []).length,
      implemented: true,
      source: 'tongjiang',
    };
  });
} catch {
  console.warn('tongjiang-catalog.json 缺失或不可读，本次仅生成 WeduLab 条目');
}

cards.push(...tongjiang);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  total: cards.length,
  implemented: cards.filter((c) => c.implemented).map((c) => c.slug),
  subjects: [...new Set(cards.map((c) => c.subject))],
  labs: cards,
};

const outDir = join(root, 'assets', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'cards.json'), JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log(`cards.json: ${out.total} labs (${out.implemented.length} implemented), subjects: ${out.subjects.join(' / ')}`);
