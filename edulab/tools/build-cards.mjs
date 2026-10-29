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

// 本次（P1）已实现的实验；其余进入「建设中」占位页
const IMPLEMENTED = new Set(['earth', 'tide', 'water']);

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
      implemented: IMPLEMENTED.has(slug),
    };
  });

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
