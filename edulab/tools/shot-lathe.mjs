#!/usr/bin/env node
/**
 * shot-lathe.mjs — lathe 车床仿真页确定性截图与交互冒烟
 *
 * 用法：
 *   node tools/shot-lathe.mjs            # 截图（15 still 机位 + 主题/移动端），输出 tools/shots-lathe/
 *   node tools/shot-lathe.mjs --smoke    # 交互冒烟（切章/卡盘/滑块/完整走刀/答题），输出 smoke-*.png 与报告
 *
 * 说明：
 *   - playwright 仅作截图工具（工单红线允许），经绝对路径引用本机既有安装，本仓零新依赖；
 *   - 页面为 ES Module + importmap，file:// 下无法加载，工具内自起静态服务器（127.0.0.1:8917）；
 *   - still 协议：?still=1&shot=front|side|left|right|top|near|far|ch1..ch8[&theme=light|dark]。
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'tools', 'shots-lathe');
const PW = '/Users/leo/repos-local/airpurifier-3d-showcase/node_modules/playwright/index.mjs';
const PORT = 8917;
const BASE = `http://127.0.0.1:${PORT}/edulab/lathe/index.html`;
const SMOKE = process.argv.includes('--smoke');

mkdirSync(OUT, { recursive: true });

// —— 静态服务器（edulab 为 /edulab，与线上路径一致） ——
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', dirname(root)], { stdio: 'ignore' });
const waitServer = async () => {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}?probe=1`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('static server failed to start');
};

const { chromium } = await import(PW);
await waitServer();

const browser = await chromium.launch();
const report = { shots: [], errors: [], smoke: {} };

function watch(page, tag) {
  page.on('console', (m) => {
    if (m.type() === 'error') report.errors.push(`[${tag}] console.error: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => report.errors.push(`[${tag}] pageerror: ${String(e).slice(0, 200)}`));
}

async function newPage(viewport = { width: 1600, height: 900 }, dsf = 2) {
  const p = await browser.newPage({ viewport, deviceScaleFactor: dsf });
  return p;
}

async function ready(p, url, tag, timeout = 25000) {
  watch(p, tag);
  await p.goto(url, { waitUntil: 'load', timeout });
  await p.waitForFunction('window.__lathe && window.__lathe.ready === true', null, { timeout });
  await p.waitForTimeout(600); // 首帧纹理/布局稳定
}

if (!SMOKE) {
  // ============ 截图模式 ============
  const views = ['front', 'side', 'left', 'right', 'top', 'near', 'far', 'headstock-near', 'chuck-jaw-near', 'tailstock-near', 'carriage-near', 'dynamics-near', ...Array.from({ length: 8 }, (_, i) => `ch${i + 1}`)];
  for (const v of views) {
    const p = await newPage();
    await ready(p, `${BASE}?still=1&shot=${v}`, v);
    await p.screenshot({ path: join(OUT, `${v}.png`) });
    report.shots.push(`${v}.png`);
    await p.close();
    console.log(`shot ${v} ok`);
  }
  // 深色主题两张
  for (const v of ['front', 'ch6']) {
    const p = await newPage();
    await ready(p, `${BASE}?still=1&shot=${v}&theme=dark`, `${v}-dark`);
    await p.screenshot({ path: join(OUT, `${v}-dark.png`) });
    report.shots.push(`${v}-dark.png`);
    await p.close();
    console.log(`shot ${v}-dark ok`);
  }
  // 移动端窄屏（非 still，纵向堆叠布局）
  {
    const p = await newPage({ width: 390, height: 844 }, 2);
    await ready(p, `${BASE}`, 'mobile');
    await p.screenshot({ path: join(OUT, `mobile-home.png`), fullPage: false });
    report.shots.push('mobile-home.png');
    await p.close();
    console.log('shot mobile ok');
  }
} else {
  // ============ 交互冒烟模式 ============
  const p = await newPage({ width: 1600, height: 900 }, 2);
  await ready(p, `${BASE}`, 'smoke');
  const api = () => p.evaluate(() => window.__lathe.getState());

  // 1) 8 章逐章切换
  const chapLog = [];
  for (let i = 1; i <= 8; i++) {
    await p.evaluate((i) => window.__lathe.gotoChapter(i - 1), i);
    await p.waitForTimeout(1300); // 相机飞行
    const st = await api();
    chapLog.push(`${st.chapter}`);
    if (i === 3) await p.screenshot({ path: join(OUT, 'smoke-ch3.png') });
  }
  report.smoke.chapters = chapLog.join('→');

  // 2) ch3 卡盘开合动画
  await p.evaluate(() => { window.__lathe.gotoChapter(2); window.__lathe.chuckAction(true); });
  await p.waitForTimeout(2200);
  let st = await api();
  report.smoke.chuckOpen = st.jawPos > 0.9 ? 'ok' : `fail(jawPos=${st.jawPos})`;
  await p.screenshot({ path: join(OUT, 'smoke-chuck-open.png') });
  await p.evaluate(() => window.__lathe.chuckAction(false));
  await p.waitForFunction('window.__lathe.getState().jawPos < 0.1', null, { timeout: 40000 }).catch(() => {});
  st = await api();
  report.smoke.chuckClose = st.jawPos < 0.1 ? 'ok' : `fail(jawPos=${st.jawPos})`;

  // 3) ch5 滑块联动读数
  await p.evaluate(() => { window.__lathe.gotoChapter(4); window.__lathe.setParams({ v: 300, f: 0.6, ap: 5 }); });
  await p.waitForTimeout(500);
  st = await api();
  report.smoke.sliders = (st.n === 1400 && st.pw > 10) ? `ok(n=${st.n}(钳到上限),P=${st.pw}kW→闷车参数)` : `fail(n=${st.n},P=${st.pw})`;
  await p.evaluate(() => window.__lathe.setParams({ v: 80, f: 0.25, ap: 1.5 }));

  // 4) ch6 完整走一刀：选参→启动主轴→进给→成形→评价
  await p.evaluate(() => { window.__lathe.gotoChapter(5); window.__lathe.startSpindle(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => window.__lathe.beginPass('turn'));
  await p.waitForFunction('window.__lathe.getState().feeding === false', null, { timeout: 40000 });
  await p.waitForTimeout(400);
  st = await api();
  report.smoke.pass = st.cutVol > 1000 ? `ok(cutVol=${st.cutVol}mm³, φ后=${st.dia})` : `fail(cutVol=${st.cutVol})`;
  await p.screenshot({ path: join(OUT, 'smoke-ch6-pass.png') });

  // 5) ch7 端面+倒角
  await p.evaluate(() => { window.__lathe.gotoChapter(6); window.__lathe.beginPass('face'); });
  await p.waitForFunction('window.__lathe.getState().feeding === false', null, { timeout: 40000 });
  await p.evaluate(() => window.__lathe.beginPass('chamfer'));
  await p.waitForFunction('window.__lathe.getState().feeding === false', null, { timeout: 40000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(OUT, 'smoke-ch7-face-chamfer.png') });

  // 6) ch8 随堂检测全对流程
  await p.evaluate(() => { window.__lathe.gotoChapter(7); window.__lathe.quizOpen(); });
  for (let q = 0; q < 6; q++) {
    const correct = await p.evaluate((q) => window.__lathe.question(q).correct, q);
    await p.evaluate((c) => {
      const card = document.querySelector('#latheQuiz .quiz-card');
      card.querySelectorAll('.quiz-opt')[c].click();
    }, correct);
    await p.waitForTimeout(150);
    await p.evaluate(() => window.__lathe.quizNext());
    await p.waitForTimeout(150);
  }
  const quizState = await p.evaluate(() => window.__lathe.quiz());
  report.smoke.quiz = quizState.score === 6 ? 'ok(6/6)' : `fail(${quizState.score}/6)`;
  await p.screenshot({ path: join(OUT, 'smoke-ch8-quiz.png') });

  // 7) 重做按钮复位验证
  await p.evaluate(() => document.getElementById('resetBtn').click());
  await p.waitForTimeout(400);
  st = await api();
  report.smoke.reset = st.cutVol === 0 && st.passes === 0 ? 'ok' : `fail(vol=${st.cutVol})`;

  await p.close();
}

await browser.close();
server.kill();

console.log('\n==== shot-lathe report ====');
console.log('shots:', report.shots.length);
if (report.errors.length) console.log('ERRORS:\n' + report.errors.join('\n'));
else console.log('errors: none');
if (SMOKE) console.log('smoke:', JSON.stringify(report.smoke, null, 1));
process.exit(report.errors.length ? 2 : 0);
