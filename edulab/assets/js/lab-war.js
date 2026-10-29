/* EduLab · 著名战役沙盘（war）
 * 章节：长平 / 巨鹿 / 官渡 / 赤壁 / 淝水 / 温泉关 / 高加米拉 / 坎尼 / 黑斯廷斯
 * 实现：2D canvas 程序化高程地形（fBm 噪声 + 山脉/河流/水体特征 → 着色地貌图），
 *       发光兵点群按阶段推演（行军/交战/火攻/夜袭），字幕逐句解说，兵力变化条。
 */
import {
  makeLoader, createSections, createControlsPanel, makeHUD,
} from './edu-core.js';

/* ---------------- 噪声与地形 ---------------- */

function hash2(x, y, seed) {
  let h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed, oct = 4) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, y * f, seed + i * 101); norm += amp; amp *= 0.5; f *= 2; }
  return s / norm;
}
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function distToPoly(px, py, pts) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, distToSeg(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
  }
  return d;
}
function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* 生成战场地形函数与着色底图 */
function buildBattleMap(map) {
  const W = map.w, Hh = map.h, seed = map.seed;
  const heightAt = (x, y) => {
    let h = 0.24 + fbm(x / 90, y / 90, seed, 4) * 0.34;
    for (const [cx, cy, rx, ry, mh] of map.mountains || []) {
      h += mh * Math.exp(-(((x - cx) ** 2) / (2 * rx * rx) + ((y - cy) ** 2) / (2 * ry * ry)));
    }
    for (const [x1, y1, x2, y2, w, mh] of map.ridges || []) {
      const d = distToSeg(x, y, x1, y1, x2, y2);
      h += mh * Math.exp(-(d * d) / (2 * w * w));
    }
    for (const [pts, w, dd] of map.rivers || []) {
      const d = distToPoly(x, y, pts);
      h -= dd * Math.exp(-(d * d) / (2 * w * w));
    }
    return h;
  };
  const waterAt = (x, y) => (map.water || []).some((pts) => inPoly(x, y, pts));
  // 着色地貌图（分块渲染）
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = Hh;
  const c = cv.getContext('2d');
  const img = c.createImageData(W, Hh);
  const STEP = 2;
  const hcache = new Float32Array(((W / STEP | 0) + 1) * ((Hh / STEP | 0) + 1));
  for (let gy = 0; gy <= Hh / STEP; gy++) {
    for (let gx = 0; gx <= W / STEP; gx++) hcache[gy * ((W / STEP | 0) + 1) + gx] = heightAt(gx * STEP, gy * STEP);
  }
  const hAt = (x, y) => {
    const gx = x / STEP, gy = y / STEP;
    const xi = Math.min(gx | 0, (W / STEP | 0) - 1), yi = Math.min(gy | 0, (Hh / STEP | 0) - 1);
    const fx = gx - xi, fy = gy - yi;
    const i = yi * ((W / STEP | 0) + 1) + xi;
    return hcache[i] * (1 - fx) * (1 - fy) + hcache[i + 1] * fx * (1 - fy) + hcache[i + ((W / STEP | 0) + 1)] * (1 - fx) * fy + hcache[i + ((W / STEP | 0) + 1) + 1] * fx * fy;
  };
  for (let y = 0; y < Hh; y++) {
    for (let x = 0; x < W; x++) {
      const h = hAt(x, y);
      let r, g, b;
      const sea = waterAt(x, y) || h < map.seaLevel;
      if (sea) {
        const deep = Math.max(0, Math.min(1, (map.seaLevel - h) * 3));
        r = 52 - deep * 22; g = 96 - deep * 30; b = 148 - deep * 34;
      } else {
        const t = Math.max(0, Math.min(1, (h - map.seaLevel) / map.hmax));
        if (t < 0.42) { r = 106 + t * 40; g = 140 - t * 22; b = 74; }
        else if (t < 0.72) { r = 136 + (t - 0.42) * 160; g = 110 + (t - 0.42) * 60; b = 74 + (t - 0.42) * 40; }
        else { const s = (t - 0.72) / 0.28; r = 184 - s * 24; g = 176 - s * 16; b = 130 + s * 45; }
        // 森林斑点
        const fo = fbm(x / 22, y / 22, seed + 7, 2);
        if (fo > 0.62 && t < 0.5) { r -= 22; g -= 10; b -= 6; }
      }
      // 山体阴影（西北光）
      const e = 2.2;
      const dh = (hAt(x - e, y - e) - hAt(x + e, y + e)) * map.shade;
      r += dh * 130; g += dh * 130; b += dh * 120;
      const o = (y * W + x) * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  // 河流线
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [pts, w] of map.rivers || []) {
    c.strokeStyle = '#3e78ad';
    c.lineWidth = w;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.strokeStyle = 'rgba(150,205,240,0.55)';
    c.lineWidth = Math.max(1, w * 0.4);
    c.stroke();
  }
  return { canvas: cv, heightAt: hAt, W, Hh };
}

/* ---------------- 战役数据 ---------------- */

const BATTLES = [
  {
    id: 'changping', name: '长平之战', year: '公元前 260 年', place: '长平（今山西高平）',
    sides: [{ name: '秦军（白起）', color: '#e8674a', n: 60, force: 60 }, { name: '赵军（赵括）', color: '#5b9bd5', n: 60, force: 45 }],
    forcesLabel: ['秦军 约 60 万', '赵军 约 45 万'],
    map: {
      seed: 11, w: 1100, h: 720, seaLevel: 0.18, hmax: 0.55, shade: 2.6,
      mountains: [[180, 120, 180, 90, 0.5], [920, 580, 200, 100, 0.45], [560, 90, 150, 70, 0.3]],
      ridges: [[240, 620, 420, 480, 70, 0.34], [820, 220, 980, 90, 60, 0.3]],
      rivers: [[[[550, 40], [545, 200], [560, 380], [540, 560], [555, 700]], 9, 0.06]],
      towns: [[540, 360, '长平'], [430, 250, '韩王山'], [660, 470, '大粮山']],
    },
    phases: [
      { cap: '公元前 260 年，秦赵为争夺上党郡在长平对峙。赵将廉颇坚壁固守，秦军久攻不下。', dur: 5, moves: [{ s: 0, from: [750, 560], to: [640, 470] }, { s: 1, from: [340, 220], to: [450, 300] }] },
      { cap: '秦国施反间计，赵王以"纸上谈兵"的赵括替换廉颇。赵括一到任就改守为攻，倾巢出击。', dur: 5, moves: [{ s: 0, from: [640, 470], to: [600, 430] }, { s: 1, from: [450, 300], to: [570, 400] }], clash: [580, 415] },
      { cap: '白起佯败后退，暗中派出两支奇兵：一支切断赵军退路与粮道，一支直插赵军大后方。', dur: 5.5, moves: [{ s: 0, from: [620, 500], to: [480, 590] }, { s: 0, from: [700, 300], to: [520, 160], ghost: true }], clash: [520, 300] },
      { cap: '赵军被合围在丹河河谷，断粮 46 天，"阴相杀食"。赵括亲率精锐突围，被秦军弩阵射杀。', dur: 5, moves: [{ s: 1, from: [560, 420], to: [560, 300] }], clash: [555, 360], loss: [0.06, 0.5] },
      { cap: '40 万赵军降秦，被白起坑杀。长平之战是战国历史的转折点，六国从此再无力单独抗秦。', dur: 5, loss: [0, 0.44] },
    ],
    result: '秦胜。赵军 40 余万被坑杀。',
    why: '秦反间计换将 + 白起示弱诱敌、断粮道合围；赵括弃守冒进、缺乏实战应变。',
  },
  {
    id: 'julu', name: '巨鹿之战', year: '公元前 207 年', place: '巨鹿（今河北平乡）',
    sides: [{ name: '楚军（项羽）', color: '#e8674a', n: 46, force: 5 }, { name: '秦军（王离·章邯）', color: '#8a9bb5', n: 60, force: 40 }],
    forcesLabel: ['楚军等 约 5 万（破釜沉舟）', '秦军 约 40 万'],
    map: {
      seed: 27, w: 1100, h: 700, seaLevel: 0.18, hmax: 0.5, shade: 2.2,
      mountains: [[180, 560, 190, 100, 0.4]],
      ridges: [[880, 480, 1040, 620, 80, 0.3]],
      rivers: [[[[80, 150], [300, 180], [520, 160], [760, 200], [1040, 170]], 12, 0.05]],
      towns: [[620, 360, '巨鹿'], [380, 250, '漳河'], [850, 420, '棘原']],
    },
    phases: [
      { cap: '秦军王离部围困巨鹿，章邯军驻棘原筑甬道输粮。诸侯救兵皆作壁上观，无人敢战。', dur: 5, moves: [{ s: 1, from: [620, 290], to: [640, 340] }, { s: 1, from: [850, 430], to: [700, 390], ghost: true }] },
      { cap: '项羽杀宋义夺军权，率楚军渡漳河。随后"破釜沉舟"，砸锅沉船，只带三日口粮——以示决死。', dur: 5, moves: [{ s: 0, from: [200, 420], to: [420, 280] }] },
      { cap: '楚军直扑王离军甬道，断其粮草，随后九战九捷，喊杀声震天动地。', dur: 5.5, moves: [{ s: 0, from: [420, 280], to: [600, 330] }], clash: [610, 345], loss: [0.04, 0.14] },
      { cap: '诸侯军见楚军威势，纷纷出营助战。秦军大溃，王离被俘，苏角战死、涉间自焚。', dur: 5, moves: [{ s: 1, from: [640, 340], to: [720, 400] }, { s: 0, from: [480, 350], to: [660, 370], ghost: true }], loss: [0.01, 0.2] },
      { cap: '巨鹿之战确立了项羽的号令地位。项羽召见诸侯将领时，诸将"入辕门，无不膝行而前"。', dur: 5, loss: [0, 0.05] },
    ],
    result: '楚胜。秦军主力覆灭。',
    why: '破釜沉舟的决死之心 + 直击粮道的要害打击；秦军内部章邯、王离互相观望。',
  },
  {
    id: 'guandu', name: '官渡之战', year: '公元 200 年', place: '官渡（今河南中牟）',
    sides: [{ name: '曹军（曹操）', color: '#e8674a', n: 50, force: 3 }, { name: '袁军（袁绍）', color: '#5b9bd5', n: 66, force: 11 }],
    forcesLabel: ['曹军 约 2~3 万', '袁军 约 10 万'],
    map: {
      seed: 42, w: 1100, h: 680, seaLevel: 0.18, hmax: 0.42, shade: 2.0,
      mountains: [[150, 120, 170, 90, 0.34]],
      ridges: [[930, 560, 1080, 660, 70, 0.26]],
      rivers: [[[[60, 320], [280, 300], [500, 330], [720, 310], [1050, 340]], 11, 0.05]],
      towns: [[560, 420, '官渡'], [430, 180, '乌巢'], [800, 220, '延津'], [200, 480, '许都方向']],
    },
    phases: [
      { cap: '袁绍率十万大军南下，曹操仅两万余兵力守官渡。袁军筑楼橹、起土山射曹营，曹军以"霹雳车"还击。', dur: 5, moves: [{ s: 1, from: [820, 240], to: [620, 380] }, { s: 0, from: [300, 480], to: [520, 430] }], clash: [565, 405] },
      { cap: '相持数月，曹军粮草将尽，曹操一度想退守，荀彧写信力谏"此用奇之时，不可失"。', dur: 5 },
      { cap: '袁绍谋士许攸叛投曹操，献计：袁军粮草尽屯乌巢，守备松懈。曹操亲率五千步骑夜袭乌巢。', dur: 5.5, moves: [{ s: 0, from: [540, 400], to: [450, 210], ghost: true }], night: true },
      { cap: '曹军火烧乌巢粮谷，火光冲天。袁军军心大乱，张郃、高览临阵倒戈，袁绍只带八百骑逃回河北。', dur: 5, moves: [{ s: 1, from: [620, 380], to: [830, 240] }], fire: [440, 195], loss: [0, 0.42] },
      { cap: '官渡之战奠定了曹操统一北方的基础。以弱胜强的关键，是奇袭粮道的"攻其必救"。', dur: 5, loss: [0, 0.1] },
    ],
    result: '曹胜。袁绍主力崩溃。',
    why: '曹操善纳奇策、亲冒矢石；袁绍多谋少决、粮道失守后全军瓦解。',
  },
  {
    id: 'chibi', name: '赤壁之战', year: '公元 208 年', place: '赤壁（长江中游）',
    sides: [{ name: '孙刘联军（周瑜）', color: '#e8674a', n: 52, force: 5 }, { name: '曹军（曹操）', color: '#8a9bb5', n: 62, force: 23 }],
    forcesLabel: ['孙刘联军 约 5 万', '曹军 号称 80 万（实际 20 余万）'],
    map: {
      seed: 77, w: 1100, h: 720, seaLevel: 0.30, hmax: 0.5, shade: 2.3,
      mountains: [[170, 580, 190, 110, 0.42], [950, 560, 170, 100, 0.4]],
      ridges: [[300, 640, 520, 560, 70, 0.3]],
      rivers: [[[[0, 330], [200, 300], [420, 330], [640, 300], [860, 330], [1100, 300]], 30, 0.09]],
      water: [[[0, 0], [1100, 0], [1100, 60], [0, 60]]],
      towns: [[520, 430, '赤壁'], [560, 230, '乌林'], [240, 520, '樊口'], [980, 240, '江陵']],
    },
    phases: [
      { cap: '曹操统一北方后挥师南下，号称八十万。孙权与刘备结盟，周瑜率三万水军溯江迎敌。', dur: 5, moves: [{ s: 1, from: [950, 200], to: [620, 260] }, { s: 0, from: [260, 520], to: [500, 420] }] },
      { cap: '曹军多为北方士兵，不习水战，军中已现疫病。曹操令战船首尾相连，人马行于其上如履平地。', dur: 5, moves: [{ s: 1, from: [620, 260], to: [580, 280] }] },
      { cap: '黄盖献诈降计：趁东南风大起，率蒙冲斗舰满载干柴枯油，"中江举帆"，直扑曹军水寨。', dur: 5.5, moves: [{ s: 0, from: [500, 420], to: [560, 290], ghost: true }], night: true },
      { cap: '火攻！风猛火烈，曹军连环船一时俱燃，火势延及岸上营寨，"烟炎张天，人马烧溺死者甚众"。', dur: 5.5, fire: [565, 285], loss: [0, 0.4], night: true },
      { cap: '曹操留曹仁守江陵，自己经华容道狼狈北撤。孙刘联军以弱胜强，三国鼎立的格局自此奠定。', dur: 5, moves: [{ s: 1, from: [580, 260], to: [900, 120], ghost: true }] },
    ],
    result: '孙刘联军胜。曹操北退，统一全国的计划破产。',
    why: '联军善水战、用火攻借地利；曹军疫病缠身、铁索连舟自失机动。',
  },
  {
    id: 'feishui', name: '淝水之战', year: '公元 383 年', place: '淝水（今安徽寿县）',
    sides: [{ name: '东晋军（谢玄）', color: '#e8674a', n: 50, force: 8 }, { name: '前秦军（苻坚）', color: '#8a9bb5', n: 66, force: 80 }],
    forcesLabel: ['东晋北府兵 约 8 万', '前秦 号称百万（先锋 30 万）'],
    map: {
      seed: 91, w: 1100, h: 680, seaLevel: 0.18, hmax: 0.48, shade: 2.3,
      mountains: [[840, 150, 220, 110, 0.46], [300, 620, 180, 80, 0.3]],
      ridges: [[120, 200, 260, 90, 70, 0.3]],
      rivers: [[[[0, 380], [260, 360], [520, 390], [800, 370], [1100, 390]], 14, 0.06]],
      towns: [[640, 300, '寿阳'], [400, 300, '洛涧'], [200, 280, '晋军大营']],
    },
    phases: [
      { cap: '苻坚统一北方后倾国南征，"投鞭于江，足断其流"。晋军只有八万北府兵，朝野震恐。', dur: 5, moves: [{ s: 1, from: [950, 200], to: [700, 310] }, { s: 0, from: [180, 300], to: [330, 330] }] },
      { cap: '晋军先锋刘牢之五千人夜袭洛涧，斩秦将梁成，首战告捷，打开了逼向淝水的通道。', dur: 5, moves: [{ s: 0, from: [330, 330], to: [420, 340] }], clash: [430, 345], loss: [0, 0.05], night: true },
      { cap: '两军隔淝水对峙。谢玄派人提议："请秦军稍退，让晋军渡河决战。"苻坚想乘半渡击之，下令后撤。', dur: 5.5, moves: [{ s: 1, from: [700, 310], to: [780, 330] }] },
      { cap: '秦军一退便不可收拾——朱序在阵后大呼"秦军败矣！"，百万大军自相践踏，晋军趁势抢渡掩杀。', dur: 5.5, moves: [{ s: 0, from: [420, 350], to: [640, 350] }, { s: 1, from: [780, 330], to: [950, 420], ghost: true }], clash: [660, 350], loss: [0.01, 0.3] },
      { cap: '苻坚中箭单骑逃回，一路"风声鹤唳，草木皆兵"。前秦帝国随即瓦解，南北分立延续了一百多年。', dur: 5, moves: [{ s: 1, from: [950, 420], to: [1020, 560], ghost: true }], loss: [0, 0.3] },
    ],
    result: '东晋胜。前秦瓦解，南北朝格局形成。',
    why: '晋军士气高、抓住"半渡而击"反成"击其半渡"；秦军多族杂糅、一退即溃。',
  },
  {
    id: 'thermopylae', name: '温泉关之战', year: '公元前 480 年', place: '温泉关（希腊东海岸）',
    sides: [{ name: '希腊联军（列奥尼达）', color: '#e8674a', n: 34, force: 0.7 }, { name: '波斯军（薛西斯）', color: '#8a9bb5', n: 62, force: 20 }],
    forcesLabel: ['希腊联军 约 7000（核心斯巴达 300）', '波斯军 约 20~30 万'],
    map: {
      seed: 55, w: 1100, h: 660, seaLevel: 0.30, hmax: 0.6, shade: 3.0,
      mountains: [[260, 330, 230, 260, 0.72], [700, 120, 260, 120, 0.5]],
      ridges: [[520, 400, 640, 340, 60, 0.4]],
      water: [[[760, 0], [1100, 0], [1100, 660], [900, 660], [820, 400], [860, 200]]],
      towns: [[600, 470, '温泉关隘口'], [760, 560, '阿尔特米西昂'], [430, 520, '中门']],
      paths: [[[430, 500], [350, 380], [320, 240], [420, 130], [560, 100]]],
    },
    phases: [
      { cap: '薛西斯率大军入侵希腊。列奥尼达率 300 斯巴达精锐与约 7000 希腊联军扼守温泉关——山与海之间仅容一车通过的窄道。', dur: 5.5, moves: [{ s: 1, from: [900, 300], to: [700, 420] }, { s: 0, from: [500, 540], to: [590, 480] }] },
      { cap: '波斯军连攻两天，长枪阵在窄道里以一当十，"薛西斯的万军挡不住三百人的盾墙"。', dur: 5, moves: [{ s: 1, from: [700, 420], to: [640, 470] }], clash: [620, 475], loss: [0.02, 0.1] },
      { cap: '当地叛徒厄菲阿尔特为赏金引波斯军翻山小路（图中虚线），连夜迂回到希腊军背后。', dur: 5, moves: [{ s: 1, from: [560, 100], to: [480, 430], ghost: true }], showPath: true },
      { cap: '列奥尼达遣散联军，亲率 300 斯巴达人与 700 志愿者断后。腹背受敌的斯巴达人战至最后一人。', dur: 5.5, moves: [{ s: 0, from: [590, 480], to: [600, 500] }, { s: 1, from: [480, 430], to: [600, 490], ghost: true }], clash: [600, 495], loss: [0.9, 0.04] },
      { cap: '温泉关虽失，却为希腊赢得了集结时间。一个月后萨拉米斯海战，希腊舰队全歼波斯海军。', dur: 5 },
    ],
    result: '波斯惨胜。斯巴达 300 人全部阵亡，但为希腊争取了时间。',
    why: '地形极窄抵消波斯兵力优势；但小路失守使天险失效——"堡垒最怕从内部攻破"。',
  },
  {
    id: 'gaugamela', name: '高加米拉战役', year: '公元前 331 年', place: '高加米拉（今伊拉克北部平原）',
    sides: [{ name: '马其顿军（亚历山大）', color: '#e8674a', n: 44, force: 4.7 }, { name: '波斯军（大流士三世）', color: '#8a9bb5', n: 66, force: 25 }],
    forcesLabel: ['马其顿军 约 4.7 万', '波斯军 约 20~25 万（含 200 辆战车、15 头战象）'],
    map: {
      seed: 63, w: 1100, h: 640, seaLevel: 0.16, hmax: 0.36, shade: 1.7,
      mountains: [[130, 100, 180, 90, 0.3]],
      ridges: [[880, 520, 1060, 600, 90, 0.2]],
      rivers: [[[[0, 560], [260, 540], [540, 560], [820, 540], [1100, 560]], 8, 0.03]],
      towns: [[550, 330, '高加米拉'], [350, 300, '马其顿大营'], [760, 300, '波斯大营']],
    },
    phases: [
      { cap: '大流士倾尽帝国兵力迎战，并以刀轮战车与战象为先锋。亚历山大只有约四万七千人，却拒绝夜袭——"我不屑于偷窃胜利"。', dur: 5.5, moves: [{ s: 1, from: [800, 260], to: [700, 320] }, { s: 0, from: [330, 320], to: [420, 350] }] },
      { cap: '波斯战车集群冲锋。马其顿方阵让开通道，标枪手专射辕马——两百辆战车几乎全部扑空。', dur: 5.5, moves: [{ s: 1, from: [700, 320], to: [500, 360] }], clash: [520, 365], loss: [0.01, 0.06] },
      { cap: '波斯左翼骑兵迂回过深，阵线中央出现缺口。亚历山大率近卫骑兵以"斜线"直插缺口，直取大流士。', dur: 5.5, moves: [{ s: 0, from: [420, 350], to: [620, 320] }], clash: [630, 320], loss: [0.01, 0.08] },
      { cap: '大流士见御驾濒危，再度弃军而逃，百万大军瞬间崩溃。马其顿骑兵回身横扫波斯军两翼。', dur: 5, moves: [{ s: 1, from: [700, 320], to: [950, 480], ghost: true }, { s: 0, from: [620, 320], to: [760, 400], ghost: true }], loss: [0, 0.3] },
      { cap: '高加米拉之后波斯帝国名存实亡。亚历山大乘胜夺取巴比伦、苏萨与波斯波利斯，建立横跨欧亚的帝国。', dur: 5, loss: [0, 0.12] },
    ],
    result: '马其顿胜。波斯帝国崩溃。',
    why: '斜线战术抓住缺口直击指挥中枢；波斯兵力虽众但指挥体系系于大流士一人，王旗一动全军即溃。',
  },
  {
    id: 'cannae', name: '坎尼会战', year: '公元前 216 年', place: '坎尼（意大利半岛南部）',
    sides: [{ name: '迦太基军（汉尼拔）', color: '#e8674a', n: 42, force: 5 }, { name: '罗马军（瓦罗）', color: '#8a9bb5', n: 60, force: 8.6 }],
    forcesLabel: ['迦太基军 约 5 万', '罗马军 约 8.6 万'],
    map: {
      seed: 38, w: 1100, h: 620, seaLevel: 0.16, hmax: 0.34, shade: 1.6,
      mountains: [[980, 140, 140, 90, 0.28]],
      ridges: [[140, 480, 340, 540, 80, 0.22]],
      rivers: [[[[0, 180], [300, 160], [620, 190], [900, 160], [1100, 180]], 9, 0.04]],
      towns: [[550, 350, '坎尼'], [300, 380, '罗马军营'], [760, 380, '迦太基军营']],
    },
    phases: [
      { cap: '特雷比亚与特拉西梅诺湖两败之后，罗马倾尽全力组建八万六千人的大军，与汉尼拔在坎尼决战。', dur: 5, moves: [{ s: 1, from: [760, 380], to: [640, 360] }, { s: 0, from: [300, 380], to: [440, 360] }] },
      { cap: '汉尼拔布下奇阵：中央步兵呈凸出的弯月形——最弱的部队故意顶在最前面。罗马军团蜂拥扑向弯月。', dur: 5.5, moves: [{ s: 0, from: [440, 360], to: [560, 355] }], clash: [570, 355], loss: [0.04, 0.05] },
      { cap: '弯月中央且战且退，逐渐凹成弧形。八万罗马人被自己的数量压进了一个越挤越紧的"口袋"。', dur: 5.5, moves: [{ s: 1, from: [600, 350], to: [560, 355] }, { s: 0, from: [480, 340], to: [555, 352], ghost: true }], loss: [0.03, 0.04] },
      { cap: '非洲籍重步兵从两翼转入侧击，努米底亚骑兵封死后方——罗马军被双重包围，密得"连刀都举不起来"。', dur: 5.5, moves: [{ s: 1, from: [640, 300], to: [570, 340], ghost: true }, { s: 1, from: [640, 430], to: [570, 375], ghost: true }], clash: [560, 355], loss: [0, 0.5] },
      { cap: '约 5 万罗马军战死，执政官阵亡，这是罗马史上最惨重的单日败仗。但罗马拒绝议和，最终拖垮了汉尼拔。', dur: 5, loss: [0, 0.3] },
    ],
    result: '迦太基胜。罗马损失约 5 万人。',
    why: '中央诱敌、两翼包抄的"双重包围"是西方战史的经典范式；罗马以密集阵形自行走进口袋。',
  },
  {
    id: 'hastings', name: '黑斯廷斯战役', year: '公元 1066 年', place: '黑斯廷斯（英格兰南部）',
    sides: [{ name: '诺曼军（威廉）', color: '#e8674a', n: 52, force: 1 }, { name: '英格兰军（哈罗德）', color: '#5b9bd5', n: 44, force: 0.8 }],
    forcesLabel: ['诺曼军 约 1 万（步兵+弓箭+重骑兵）', '英格兰军 约 8000（几乎全为步兵）'],
    map: {
      seed: 83, w: 1100, h: 640, seaLevel: 0.28, hmax: 0.44, shade: 2.4,
      mountains: [[150, 130, 170, 90, 0.36]],
      ridges: [[480, 300, 700, 250, 80, 0.34], [260, 560, 420, 600, 60, 0.2]],
      water: [[[0, 560], [1100, 560], [1100, 640], [0, 640]]],
      towns: [[590, 270, '森拉克山脊'], [420, 440, '英军山脊阵地'], [640, 430, '诺曼营地'], [900, 500, '黑斯廷斯']],
    },
    phases: [
      { cap: '忏悔者爱德华死后无嗣，威廉宣称继承英格兰王位，率军渡海登陆。哈罗德急行军南下迎战。', dur: 5, moves: [{ s: 0, from: [900, 500], to: [660, 430] }, { s: 1, from: [300, 200], to: [420, 400] }] },
      { cap: '英军据森拉克山脊列盾墙，诺曼步兵仰攻、弓箭手抛射，盾墙岿然不动，诺曼左翼一度溃退。', dur: 5.5, moves: [{ s: 0, from: [660, 430], to: [520, 360] }], clash: [480, 370], loss: [0.06, 0.04] },
      { cap: '诺曼军使出"佯退"之计：队伍假作溃逃，部分英军忍不住冲下山追击，盾墙出现缺口。', dur: 5.5, moves: [{ s: 0, from: [520, 360], to: [680, 420] }, { s: 1, from: [420, 400], to: [560, 420], ghost: true }] },
      { cap: '诺曼重骑兵突然回身，冲垮脱离阵地的英军；随后骑兵反复冲击山脊，弓箭齐射，哈罗德中箭坠马身亡。', dur: 5.5, moves: [{ s: 0, from: [680, 420], to: [480, 380] }], clash: [470, 385], loss: [0.02, 0.4] },
      { cap: '英军崩溃四散。威廉加冕为王，诺曼王朝开始——英语从此混入了上万个法语词，英格兰历史转向。', dur: 5, moves: [{ s: 1, from: [420, 400], to: [250, 520], ghost: true }], loss: [0, 0.2] },
    ],
    result: '诺曼胜。哈罗德战死，威廉征服英格兰。',
    why: '兵种协同（弓箭削盾墙+骑兵机动）与"佯退"心理战；英军步卒缺乏纪律、轻易脱离地形优势。',
  },
];

/* ---------------- 画布与视图 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在绘制战场…');

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;';
stage.appendChild(canvas);
const ctx = canvas.getContext('2d');

const view = { x: 0, y: 0, k: 1, tx: 0, ty: 0, tk: 1 };   // 当前/目标视图
function fitView(m) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = stage.clientWidth, vh = stage.clientHeight;
  const k = Math.min(vw / m.w, vh / m.h) * 0.96;
  view.tx = (vw - m.w * k) / 2;
  view.ty = (vh - m.h * k) / 2;
  view.tk = k;
}
function viewTick(dt) {
  const k = 1 - Math.exp(-8 * dt);
  view.x += (view.tx - view.x) * k;
  view.y += (view.ty - view.y) * k;
  view.k += (view.tk - view.k) * k;
}
function applyView() {
  ctx.setTransform(view.k * DPR, 0, 0, view.k * DPR, view.x * DPR, view.y * DPR);
}
let DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = stage.clientWidth * DPR;
  canvas.height = stage.clientHeight * DPR;
}
new ResizeObserver(resize).observe(stage);
resize();

// 拖拽 / 缩放
let dragging = false, lastX = 0, lastY = 0, pinchD = 0;
canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  view.tx += e.clientX - lastX; view.ty += e.clientY - lastY;
  view.x = view.tx; view.y = view.ty;
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('pointerup', () => { dragging = false; canvas.style.cursor = 'grab'; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const k = view.tk * (e.deltaY < 0 ? 1.12 : 0.89);
  view.tk = Math.max(0.15, Math.min(6, k));
  // 以光标为中心缩放
  const wx = (mx - view.tx) / view.tk, wy = (my - view.ty) / view.tk;
  view.tx = mx - wx * view.tk;
  view.ty = my - wy * view.tk;
}, { passive: false });

/* ---------------- 兵团光点 ---------------- */

function armyDots(n, seedBase) {
  const dots = [];
  let s = seedBase;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const rows = Math.ceil(n / 12);
  for (let i = 0; i < n; i++) {
    const r = (i / 12) | 0, c = i % 12;
    dots.push({ ox: (c - 5.5) * 7.5 + (rnd() - 0.5) * 4, oy: (r - rows / 2) * 7.5 + (rnd() - 0.5) * 4, r: 3.1 + rnd() * 1.1, ph: rnd() * 6.28 });
  }
  return dots;
}
const armyState = [];   // [{side, x, y, fx, fy, dots}]
function initArmies(battle) {
  armyState.length = 0;
  battle.sides.forEach((side, i) => {
    armyState.push({
      side: i, x: 0, y: 0, fx: 0, fy: 0,
      dots: armyDots(side.n, 1234 + i * 77),
      aliveK: 1,
    });
  });
}

/* ---------------- 状态与播放 ---------------- */

const state = {
  battleIdx: 0, t: 0, playing: true, speed: 1,
  showLabels: true, showUnits: true,
  battle: null, mapR: null,
};

function phaseStart(i) {
  const b = state.battle;
  let t = 0;
  for (let k = 0; k < i; k++) t += b.phases[k].dur;
  return t;
}
function totalDur() {
  return state.battle.phases.reduce((s, p) => s + p.dur, 0);
}
function phaseAt(time) {
  let t = 0;
  for (let i = 0; i < state.battle.phases.length; i++) {
    t += state.battle.phases[i].dur;
    if (time < t) return { idx: i, start: t - state.battle.phases[i].dur, local: time - (t - state.battle.phases[i].dur) };
  }
  return { idx: state.battle.phases.length - 1, start: 0, local: 0, end: true };
}

/* ---------------- 渲染 ---------------- */

const sparkParts = [];
const flameParts = [];

function drawFrame(time) {
  const b = state.battle, m = state.mapR;
  if (!b || !m) return;
  const vw = stage.clientWidth, vh = stage.clientHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0c1016';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyView();

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(m.canvas, 0, 0);

  const { idx, local, end } = phaseAt(time);
  const phase = b.phases[idx];
  const k = end ? 1 : Math.min(1, local / phase.dur);
  const ease = k * k * (3 - 2 * k);

  // 小路虚线（温泉关）
  if (phase.showPath && b.map.paths) {
    ctx.strokeStyle = 'rgba(255,220,150,0.8)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 6]);
    for (const pts of b.map.paths) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 阶段位移计算
  armyState.forEach((a) => { a.fx = a.x; a.fy = a.y; });
  if (idx === 0) {
    armyState.forEach((a, i) => { a.x = b.phases[0].moves[i] ? b.phases[0].moves[i].from[0] : 550; a.y = b.phases[0].moves[i] ? b.phases[0].moves[i].from[1] : 360; });
  }
  for (const mv of phase.moves || []) {
    const a = armyState[mv.s];
    if (idx === 0) { a.x = mv.from[0]; a.y = mv.from[1]; }
    const tox = mv.to[0], toy = mv.to[1];
    const nx = a.x + (tox - a.x) * ease * (mv.ghost ? 1 : 1);
    const ny = a.y + (toy - a.y) * ease;
    a.nx = nx; a.ny = ny;
  }
  armyState.forEach((a) => { if (a.nx !== undefined) { a.x = a.nx; a.y = a.ny; a.nx = undefined; } });

  // 行军箭头
  ctx.setLineDash([9, 7]);
  for (const mv of phase.moves || []) {
    const a = armyState[mv.s];
    const sx = a.x - (a.x - mv.to[0]) * ease;
    const sy = a.y - (a.y - mv.to[1]) * ease;
    ctx.strokeStyle = b.sides[mv.s].color + '99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mv.from[0], mv.from[1]);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    // 箭头
    const ang = Math.atan2(mv.to[1] - mv.from[1], mv.to[0] - mv.from[0]);
    ctx.setLineDash([]);
    ctx.fillStyle = b.sides[mv.s].color + 'cc';
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(ang) * 12, sy + Math.sin(ang) * 12);
    ctx.lineTo(sx + Math.cos(ang + 2.5) * 10, sy + Math.sin(ang + 2.5) * 10);
    ctx.lineTo(sx + Math.cos(ang - 2.5) * 10, sy + Math.sin(ang - 2.5) * 10);
    ctx.closePath();
    ctx.fill();
    ctx.setLineDash([9, 7]);
  }
  ctx.setLineDash([]);

  // 兵团光点
  if (state.showUnits) {
    const tsec = time;
    armyState.forEach((a) => {
      const col = b.sides[a.side].color;
      const shrink = 0.35 + 0.65 * a.aliveK;
      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.fillStyle = col;
      for (const d of a.dots) {
        const alive = d.ph / 6.28 < a.aliveK * 1.05;
        if (!alive) continue;
        const wob = Math.sin(tsec * 2 + d.ph) * 1.1;
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(a.x + d.ox * shrink, a.y + d.oy * shrink + wob * 0.4, d.r * shrink, 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
      // 军旗标签
      if (state.showLabels) {
        ctx.font = '600 17px -apple-system,"PingFang SC",sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(b.sides[a.side].name.split('（')[0], a.x, a.y - 55);
        ctx.shadowBlur = 0;
      }
    });
  }

  // 交战火花
  if (phase.clash && k < 0.98) {
    const [cx, cy] = phase.clash;
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9 * (1 - k * 0.5);
    ctx.beginPath();
    ctx.arc(cx, cy, 14 + (k * 26) % 26, 0, 6.28);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff2c8';
    for (let i = 0; i < 7; i++) {
      const a = time * 5 + i * 0.9;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 12, cy + Math.sin(a * 1.3) * 12, 2.2, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();
  }

  // 火攻
  if (phase.fire) {
    const [fx, fy] = phase.fire;
    ctx.save();
    const g = ctx.createRadialGradient(fx, fy, 4, fx, fy, 130);
    g.addColorStop(0, 'rgba(255,170,60,0.9)');
    g.addColorStop(0.4, 'rgba(240,90,30,0.45)');
    g.addColorStop(1, 'rgba(180,40,10,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fx, fy, 130, 0, 6.28);
    ctx.fill();
    ctx.fillStyle = '#ffd97a';
    for (let i = 0; i < 26; i++) {
      const a = i * 2.4 + time * 1.7;
      const rr = 8 + ((i * 37 + time * 46) % 70);
      ctx.globalAlpha = 0.8 * (1 - rr / 78);
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr * 0.7, 2.6, 0, 6.28);
      ctx.fill();
    }
    ctx.restore();
  }

  // 城镇注记
  if (state.showLabels && b.map.towns) {
    ctx.font = '500 15px -apple-system,"PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    for (const [x, y, name] of b.map.towns) {
      ctx.fillStyle = 'rgba(10,14,20,0.72)';
      ctx.beginPath();
      ctx.arc(x, y - 4, 4, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = '#f2e8d5';
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 5;
      ctx.fillText(name, x, y + 16);
      ctx.shadowBlur = 0;
    }
  }

  // 夜战提示
  if (phase.night) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(8,10,30,0.34)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.k * DPR, 0, 0, view.k * DPR, view.x * DPR, view.y * DPR);
  }
}

/* ---------------- 字幕与 HUD ---------------- */

const subtitle = document.createElement('div');
subtitle.className = 'edulab-sub';
{
  const stl = document.createElement('style');
  stl.textContent = '@media (max-width:760px){ .edulab-sub{bottom:132px !important} }';
  document.head.appendChild(stl);
}
subtitle.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);bottom:96px;z-index:12;width:min(680px,calc(100% - 24px));text-align:center;font-size:14.5px;line-height:1.65;color:#f2ede2;background:rgba(12,15,22,0.72);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 16px;pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,0.6);';
subtitle.innerHTML = '<b></b>';
stage.appendChild(subtitle);
const subText = subtitle.querySelector('b');

const hud = makeHUD(stage, [['fa', '兵力'], ['fb', ''], ['ph', '阶段']]);
hud.show(false);

function updateForces(k, idx) {
  const b = state.battle;
  const lossA = [0, 0];
  for (let i = 0; i <= idx; i++) {
    const p = b.phases[i];
    if (p.loss) {
      const kk = i < idx ? 1 : k;
      lossA[0] += p.loss[0] * kk;
      lossA[1] += p.loss[1] * kk;
    }
  }
  armyState.forEach((a, i) => { a.aliveK = Math.max(0.06, 1 - lossA[i]); });
  const pct = (i) => Math.round(b.sides[i].force * (1 - lossA[i]) * 10) / 10;
  hud.set('fa', `${b.sides[0].name.split('（')[0]} 剩 ${pct(0)} 万`);
  hud.set('fb', `${b.sides[1].name.split('（')[0]} 剩 ${pct(1)} 万`);
  hud.set('ph', `第 ${idx + 1}/${b.phases.length} 幕`);
}

/* ---------------- 控制条 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));

let playBtnRef = null;
function buildControls() {
  ctl.clear();
  const b = state.battle;
  const playBtn = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick() {
      state.playing = !state.playing;
      playBtn.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
    },
  });
  playBtnRef = playBtn;
  ctl.button({ label: '⏮ 上一幕', onClick: () => { const { idx } = phaseAt(state.t); jump(Math.max(0, idx - 1)); } });
  ctl.button({ label: '下一幕 ⏭', onClick: () => { const { idx } = phaseAt(state.t); jump(Math.min(b.phases.length - 1, idx + 1)); } });
  ctl.button({ label: '↻ 重演', onClick: () => { jump(0); state.playing = true; } });
  ctl.sep();
  ctl.slider({
    label: '速度', min: 0.4, max: 3, step: 0.2, value: state.speed,
    fmt: (v) => v.toFixed(1) + '×',
    onInput: (v) => { state.speed = v; },
  });
  ctl.sep();
  ctl.toggle({ label: '地名注记', value: true, onChange: (v) => { state.showLabels = v; } });
  ctl.toggle({ label: '兵团', value: true, onChange: (v) => { state.showUnits = v; } });
}
function jump(idx) {
  state.t = phaseStart(idx);
  if (idx === 0) initArmies(state.battle);
  if (playBtnRef) playBtnRef.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
}

/* ---------------- 章节加载 ---------------- */

const terrainCache = new Map();

function loadBattle(i) {
  state.battleIdx = i;
  const b = BATTLES[i];
  state.battle = b;
  state.t = 0;
  state.playing = true;
  loader.setText(`正在绘制「${b.name}」战场…`);
  setTimeout(() => {
    if (!terrainCache.has(b.id)) terrainCache.set(b.id, buildBattleMap(b.map));
    state.mapR = terrainCache.get(b.id);
    initArmies(b);
    fitView(b.map);
    buildControls();
    loader.hide();
  }, 30);
}

const SECTIONS = BATTLES.map((b, i) => ({
  id: b.id,
  title: b.name,
  html: `<p><b>${b.year}</b> · ${b.place}</p>
<p>${b.phases[0].cap.split('。')[0]}。</p>
<p>兵力：${b.forcesLabel.join('；')}。</p>
<p><b>结果</b>：${b.result}<br><b>胜负关键</b>：${b.why}</p>`,
  enter() {
    loadBattle(i);
    hud.show(true);
    subtitle.style.display = '';
  },
}));

/* ---------------- 主循环 ---------------- */

let activeSectionCleanup = () => {};
const sections = createSections({
  nav: document.getElementById('sideNav'),
  descPanel: document.getElementById('descPanel'),
  sections: SECTIONS,
  onSelect(i, sec) {
    activeSectionCleanup();
    activeSectionCleanup = () => {};
    sec.enter();
  },
});
window.__eduSections = sections;
sections.select(0);

let lastTs = 0;
appLoop(0);
function appLoop(ts) {
  requestAnimationFrame(appLoop);
  const dt = Math.min((ts - lastTs) / 1000 || 0.016, 0.1);
  lastTs = ts;
  viewTick(dt);
  if (state.battle && state.mapR) {
    if (state.playing && !phaseAt(state.t).end) state.t += dt * state.speed;
    const { idx, local, end } = phaseAt(state.t);
    const phase = state.battle.phases[idx];
    subText.textContent = phase.cap;
    updateForces(end ? 1 : Math.min(1, local / phase.dur), idx);
    drawFrame(state.t);
    if (end && state.playing) {
      state.playing = false;
      if (playBtnRef) playBtnRef.textContent = '▶ 播放';
    }
  }
}
