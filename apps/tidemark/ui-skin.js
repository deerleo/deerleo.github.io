// 潮汐战线：像素界面的画法（window.AWSkin）。面板、条、图标、像素数字、硬边文字、标题字都在这里，ui.js 各处复用。
// 坐标单位是“界面像素”：调用方先把 ctx 缩放成 1 单位 = U 个物理像素（U 为整数），这里只用整数坐标 fillRect。
// 配色取自 tools/ART-SPEC.md 的调色板。
(function (root) {
  'use strict';
  const INK = '#25272c';
  const COL = {
    ink: INK, body: '#3a3f47', body2: '#4a4f58', edge: '#b8afa2', edgeLo: '#625d57', txt: '#f3f0ea', mut: '#b8afa2', dim: '#857f77',
    gold: '#ffc24a', goldHi: '#fff2a8', goldLo: '#b98250', red: '#ff8a5c', blue: '#6fc3ff', green: '#8fd45a', shadow: 'rgba(18,20,26,.35)',
  };
  // 文字一律用 12 像素点阵字体 FusionPixel（index.html 里 @font-face 声明）；字号只取 12 的整数倍物理像素，不加粗。
  // 字体没加载出来时退回系统字体（照样二值化成硬边）
  const SYS_STACK = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  let fontOk = false;
  const fam = () => (fontOk ? '"FusionPixel",' : '') + SYS_STACK;
  // 字号档：'s' 小字（一个字体像素 = 半个界面像素，取整）、1 正文（一个字体像素 = 一个界面像素）、2 / 3… 放大
  const fpx = size => size === 's' ? 12 * Math.max(1, Math.round(U / 2)) : 12 * U * (size || 1);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
  const R = (c, x, y, w, h, col) => { if (col) c.fillStyle = col; c.fillRect(x, y, w, h); };
  let u = 2, U = 2, dpr = 1;

  // ───────── 面板 ─────────
  // 2 像素深色描边（四角各缺 1 像素）+ 1 像素亮边（左上亮、右下暗）+ 实心底。o：{ body, edge, edgeLo, out, shadow }
  function panel(c, x, y, w, h, o) {
    o = o || {};
    if (o.shadow !== false) R(c, x + 2, y + 2, w, h, COL.shadow);
    const out = o.out || INK;
    R(c, x + 1, y, w - 2, h, out); R(c, x, y + 1, w, h - 2, out);
    R(c, x + 2, y + 2, w - 4, h - 4, o.edge || COL.edge);
    R(c, x + 3, y + 3, w - 5, h - 5, o.edgeLo || COL.edgeLo);
    R(c, x + 3, y + 3, w - 6, h - 6, o.body || COL.body);
  }
  // 面板里的一条凹槽底（放数值、小图用）
  function well(c, x, y, w, h, col) { R(c, x, y, w, h, INK); R(c, x + 1, y + 1, w - 1, h - 1, col || COL.body2); R(c, x + 1, y + 1, w - 2, h - 2, col || '#30343b'); }
  // 进度条：frac 0–1；pal 用阵营色阶或 { d, m, l, h }；flash 为真时整条提亮（满槽闪烁）
  function bar(c, x, y, w, h, frac, pal, flash) {
    pal = pal || { d: '#b0741c', m: COL.gold, l: '#ffe066', h: COL.goldHi };
    frac = Math.max(0, Math.min(1, frac || 0));
    R(c, x + 1, y, w - 2, h, INK); R(c, x, y + 1, w, h - 2, INK);
    R(c, x + 1, y + 1, w - 2, h - 2, '#4a4f58'); R(c, x + 1, y + 1, w - 2, 1, '#30343b');
    const fw = Math.round((w - 2) * frac);
    if (fw > 0) {
      R(c, x + 1, y + 1, fw, h - 2, flash ? pal.h : pal.m); R(c, x + 1, y + 1, fw, 1, pal.h);
      if (h > 4) R(c, x + 1, y + h - 2, fw, 1, flash ? pal.l : pal.d);
    }
    for (let i = 1; i < 3; i++) R(c, x + 1 + Math.round((w - 2) * i / 3) - 1, y + h - 3, 1, 2, INK);
  }

  // ───────── 5×7 像素字 ─────────
  const GL = {
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'], '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'], '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'], 'x': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
    ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'], '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], 'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], 'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], 'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  };
  function stamp(c, g, x, y, col) {
    c.fillStyle = col;
    for (let j = 0; j < g.length; j++) { const r = g[j]; for (let i = 0; i < r.length; i++) if (r[i] === '#') { let n = 1; while (r[i + n] === '#') n++; c.fillRect(x + i, y + j, n, 1); i += n - 1; } }
  }
  const numW = t => { t = String(t == null ? '' : t); let w = 0; for (let i = 0; i < t.length; i++) w += GL[t[i]] ? 6 : 4; return Math.max(0, w - 1); };
  // 从 (x, y) 起画一行像素字（高 7）。outline 传 null 不描边。返回宽度
  function num(c, text, x, y, col, outline) {
    const s = String(text == null ? '' : text), ol = outline === undefined ? INK : outline;
    for (let pass = ol ? 0 : 1; pass < 2; pass++) {
      let px = x;
      for (let i = 0; i < s.length; i++) {
        const g = GL[s[i]]; if (!g) { px += 4; continue; }
        if (pass === 0) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) stamp(c, g, px + dx, y + dy, ol); }
        else stamp(c, g, px, y, col || COL.txt);
        px += 6;
      }
    }
    return numW(s);
  }

  // ───────── 图标（字符画 + 调色板）─────────
  const PALS = {
    k: INK, g: COL.gold, G: COL.goldHi, d: '#b0741c', r: '#e0453a', R: '#ff8a5c', q: '#a3263c', b: '#3b82f0', B: '#6fc3ff', n: '#2a4bb0',
    w: '#e9e6df', s: '#b8afa2', m: '#857f77', c: '#b98250', C: '#e0b070', o: '#8a5a3c', e: '#5bb04a', E: '#8fd45a', a: '#3b8ae6', t: '#f3f0ea',
  };
  const ICONS = {
    coin: ['..kkkk..', '.kGGGgk.', 'kGgkggdk', 'kGgkggdk', 'kGgkggdk', 'kggkggdk', '.kgdddk.', '..kkkk..'],
    star: ['...k...', '..kGk..', 'kkkgkkk', 'kGggggk', '.kgggk.', 'kggkgdk', 'kkk.kkk'],
    starOff: ['...k...', '..kmk..', 'kkkmkkk', 'kmmmmmk', '.kmmmk.', 'kmmkmmk', 'kkk.kkk'],
    heart: ['.kk.kk.', 'kRrkrrk', 'kRrrrrk', 'krrrrqk', '.krrqk.', '..kqk..', '...k...'],
    sword: ['.....kk', '....kwk', '...kwsk', 'kk.kwk.', 'kokwk..', '.kok...', 'kokkk..', 'kk.....'],
    shield: ['kkkkkkk', 'kBBBbbk', 'kBbbbnk', 'kBbbbnk', '.kbbnk.', '..kbk..', '...k...'],
    crate: ['kkkkkkk', 'kCCCCck', 'kCkckck', 'kCckcok', 'kckckok', 'kcoooock'.slice(0, 7), 'kkkkkkk'],
    flag: ['kkkkk..', 'kRrrrk.', 'kRrrrrk', 'krrrrk.', 'kkkkk..', 'kk.....', 'kk.....', 'kk.....'],
    arrow: ['kk...', 'kGk..', 'kGgk.', 'kGggk', 'kggk.', 'kgk..', 'kk...'],
    map: ['kkkkkkkkkkk', 'keeeakkaaak', 'keEeaaaaaak', 'kkeeeaarrak', 'keeEeeakkak', 'keeeeeeaaak', 'kbbkeeEeaak', 'kbbeeeeeeak', 'kkkkkkkkkkk'],
    fold: ['kkkkkkk', 'ktttttk', '.ktttk.', '..ktk..', '...k...'],
    day: ['.kkkkk.', 'kGgGgGk', 'kgGGGgk', 'kGGGGGk', 'kgGGGgk', 'kGgGgGk', '.kkkkk.'],
    move: ['..kkk..', '.kwwwk.', 'kkkwkkk', 'kwwwwwk', '.kwwwk.', '..kwk..', '...k...'],
    eye: ['.kkkkk.', 'kwwkwwk', 'kwkBkwk', 'kwwkwwk', '.kkkkk.'],
    // 加成 / 惩罚的小箭头：↑ 绿、↓ 红
    up: ['..k..', '.kEk.', 'kEEEk', 'kkEkk', '.kek.', '.kek.', '.kkk.'],
    dn: ['.kkk.', '.kRk.', '.kRk.', 'kkRkk', 'kRrrk', '.krk.', '..k..'],
    // 喇叭：开着带金色声波，关着带红叉
    spkOn: ['....kk.....', '...kwk..g..', 'kkkwwk...g.', 'kwwwwk.g.g.', 'kwwwwk.g.g.', 'kwwwwk.g.g.', 'kkkwwk...g.', '...kwk..g..', '....kk.....'],
    spkOff: ['....kk.....', '...ksk.....', 'kkkssk.....', 'kssssk.R.R.', 'kssssk..R..', 'kssssk.R.R.', 'kkkssk.....', '...ksk.....', '....kk.....'],
    // 射程（准星）
    aim: ['..kkk..', '.kwkwk.', 'kwk.kwk', 'kk.r.kk', 'kwk.kwk', '.kwkwk.', '..kkk..'],
  };
  const icSize = n => { const g = ICONS[n]; return g ? [g[0].length, g.length] : [0, 0]; };
  function icon(c, name, x, y, tint) {
    const g = ICONS[name]; if (!g) return 0;
    for (let j = 0; j < g.length; j++) { const r = g[j]; for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; let n = 1; while (r[i + n] === ch) n++; c.fillStyle = (tint && ch !== 'k' && tint[ch]) || PALS[ch] || INK; c.fillRect(x + i, y + j, n, 1); i += n - 1; } }
    return g[0].length;
  }
  // 阵营徽记：一面带尖角的小旗牌，16×20；tag 是队伍字母（可省，省略时画一颗星）
  function emblem(c, x, y, pal, tag, dead) {
    const P = dead ? { o: '#3a3550', d: '#6d6a85', m: '#a5a3b8', l: '#d3d2de', h: '#f3f0ea' } : pal;
    R(c, x + 1, y, 14, 16, P.o); R(c, x, y + 1, 16, 14, P.o);
    for (let i = 0; i < 5; i++) R(c, x + 1 + i, y + 15 + i, 14 - i * 2, 1, P.o);
    R(c, x + 1, y + 1, 14, 14, P.m); R(c, x + 1, y + 1, 14, 2, P.l); R(c, x + 1, y + 1, 2, 14, P.l); R(c, x + 2, y + 2, 3, 1, P.h);
    R(c, x + 13, y + 3, 2, 12, P.d); R(c, x + 3, y + 13, 12, 2, P.d);
    for (let i = 0; i < 4; i++) R(c, x + 2 + i, y + 15 + i, 12 - i * 2, 1, i < 2 ? P.d : P.o);
    if (tag && GL[tag]) { stamp(c, GL[tag], x + 6, y + 5, P.o); stamp(c, GL[tag], x + 5, y + 4, P.h); }
    else { R(c, x + 7, y + 4, 2, 8, P.h); R(c, x + 4, y + 7, 8, 2, P.h); R(c, x + 6, y + 6, 4, 4, P.h); R(c, x + 7, y + 7, 2, 2, P.d); }
  }

  // ───────── 喷火（地图特效，画在 32×32 的格子坐标里）─────────
  // 一道从本格喷向相邻格的像素火焰条：(dx, dy) 是方向（各取 −1 / 0 / 1），t 是 0–1 的进度。
  // 先一节节伸出去，烧一阵（每帧抖一下），最后从根上熄掉；离喷口越远火团越大、颜色越红。会画到相邻格里。
  const FLAME = [['#fff2a8', '#ffc24a'], ['#ffc24a', '#ff7a2e'], ['#ff7a2e', '#d43a2a']];
  function flame(c, t, dx, dy) {
    t = Math.max(0, Math.min(1, t)); dx = dx || 0; dy = dy || 0; if (!dx && !dy) dx = 1;
    const n = 9, a0 = c.globalAlpha, grow = Math.min(1, t / 0.22), die = t > 0.7 ? (t - 0.7) / 0.3 : 0, fr = Math.floor(t * 18);
    const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, list = [];
    // 一串火团：从喷口（格心往外 10 像素）排到目标格心，越远越大；每帧左右抖、大小跳一下，隔一个火团往上窜一点（火舌）
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n; if (k > grow || k < die) continue;
      const j = (((i * 5 + fr * 3) % 7) - 3) * k * 0.9, r = 1 + Math.round(k * 3.4) + ((i * 3 + fr) % 3 === 0 ? 1 : 0), lick = ((i + fr) & 1) ? Math.round(1 + k * 3) : 0;
      list.push({ k, r, x: Math.round(16 + ux * (10 + k * 24) - uy * j), y: Math.round(15 + uy * (10 + k * 24) + ux * j) - lick });
    }
    for (const p of list) R(c, p.x - p.r - 1, p.y - p.r - 1, p.r * 2 + 2, p.r * 2 + 2, '#7a1f2e');
    for (const p of list) R(c, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2, FLAME[p.k > 0.7 ? 2 : p.k > 0.35 ? 1 : 0][1]);
    for (const p of list) { const h = Math.max(1, p.r - 2); R(c, p.x - h, p.y - h, h * 2, h * 2, FLAME[p.k > 0.7 ? 2 : p.k > 0.35 ? 1 : 0][0]); }
    // 几颗溅出去的火星
    for (let i = 0; i < 4; i++) { const k = ((i * 0.27 + t * 1.7) % 1); if (k > grow || k < die) continue; const o = ((i * 7 + fr) % 9) - 4; R(c, Math.round(16 + ux * (12 + k * 26) - uy * o * 1.6), Math.round(13 + uy * (12 + k * 26) + ux * o * 1.6 - k * 5), 1, 1, '#fff2a8'); }
    if (die > 0 && die < 1) { c.globalAlpha = a0 * (1 - die) * 0.6; R(c, Math.round(16 + ux * 32) - 4, Math.round(9 + uy * 32 - die * 8) - 3, 8, 6, '#625d57'); R(c, Math.round(16 + ux * 32) - 1, Math.round(6 + uy * 32 - die * 10) - 3, 5, 4, '#857f77'); c.globalAlpha = a0; } // 熄火时目标格上一小团烟
    c.fillStyle = INK;
  }

  // “还能再动”的标记（画在单位那一格的右上角，32 逻辑像素坐标）：深色底的小牌子上两道绿色箭头，f 是动画帧，箭头一闪一闪往右顶。
  // full = 整个再行动一次（还能再打）：箭头换成金色
  function againBadge(c, f, full) {
    const hi = full ? '#ffe066' : '#d6f7a8', mid = full ? COL.gold : '#8fd45a', lo = full ? '#b0741c' : '#1f7a4a', o = (f & 1) ? 1 : 0;
    R(c, 20, 0, 12, 9, INK); R(c, 19, 1, 14, 7, INK);
    R(c, 20, 1, 12, 7, lo); R(c, 20, 1, 12, 1, mid);
    for (const bx of [21 + o, 26 + o]) for (let i = 0; i < 3; i++) { R(c, bx + i, 2 + i, 2, 1, hi); R(c, bx + i, 6 - i, 2, 1, hi); }
    c.fillStyle = INK;
  }
  // 格子缩得很小时（一格不到 44 屏幕像素）单位身上的简化标记。c 已平移到格子左上角，1 单位 = 1 个物理像素，tp 是格子边长。
  // 血量牌换成实心色块（白底、5 以下琥珀、3 以下红）配深色数字，比平时的深色小牌显眼；载员、军衔只留色点，占领是顶上一道细条，
  // “可再行动”是右上角一块会闪的色块。o：{ hp, cargo, stars, cap（-1 = 没在占领，否则 0–1）, pal, again, full, f }
  function miniMarks(c, tp, o) {
    const k = Math.max(1, Math.floor(tp / 22)), a0 = c.globalAlpha;
    if (o.hp >= 1 && o.hp <= 9) {
      const w = 9 * k, h = 11 * k, x = tp - w, y = tp - h, g = GL[String(o.hp)];
      R(c, x, y, w, h, INK); R(c, x + k, y + k, w - 2 * k, h - 2 * k, o.hp <= 3 ? '#ff5a4a' : o.hp <= 5 ? COL.gold : '#ffffff');
      c.fillStyle = INK;
      for (let j = 0; j < g.length; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '#') c.fillRect(x + (2 + i) * k, y + (2 + j) * k, k, k);
    }
    if (o.cargo > 0) { R(c, 0, tp - 6 * k, 6 * k, 6 * k, INK); R(c, k, tp - 5 * k, 4 * k, 4 * k, '#e0b070'); }
    for (let i = 0; i < Math.min(3, o.stars || 0); i++) { R(c, i * 4 * k, 0, 4 * k, 4 * k, INK); R(c, i * 4 * k + k, k, 2 * k, 2 * k, COL.gold); }
    if (o.cap >= 0) { // 占领进度：格子左侧竖着的一根杆，小旗随进度往上升（不用横条，免得像血条）
      const top = (o.stars ? 5 : 1) * k, bot = tp - (o.cargo > 0 ? 7 : 1) * k, h = bot - top, fh = 4 * k;
      R(c, 0, top, 3 * k, h, INK); R(c, k, top + k, k, h - 2 * k, '#d9dee8');
      const fy = Math.round(bot - k - fh - (h - 2 * k - fh) * Math.max(0, Math.min(1, o.cap)));
      R(c, k, fy - k, 6 * k, fh + 2 * k, INK); R(c, 2 * k, fy, 4 * k, fh, (o.pal && (o.pal.m || o.pal.l)) || COL.txt);
    }
    if (o.again) { R(c, tp - 6 * k, 0, 6 * k, 6 * k, INK); R(c, tp - 5 * k, k, 4 * k, 4 * k, (o.f & 1) ? (o.full ? '#ffe066' : '#d6f7a8') : (o.full ? COL.gold : '#8fd45a')); }
    c.globalAlpha = a0; c.fillStyle = INK;
  }
  // 森林烧起来：几簇往上窜的火苗，后半段换成往上飘的烟。t 是 0–1 的进度，画在本格里
  function burn(c, t, seed) {
    t = Math.max(0, Math.min(1, t)); seed = seed || 0;
    const a0 = c.globalAlpha, fr = Math.floor(t * 20);
    for (let i = 0; i < 6; i++) {
      const bx = 4 + ((i * 11 + seed) % 24), ph = (i * 0.17 + t * 2.2) % 1, life = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      if (life <= 0) break;
      const hgt = Math.round((5 + (i * 7 + seed) % 6) * life * (0.6 + 0.4 * Math.sin((fr + i * 2) * 1.3))), by = 28 - ((i * 5 + seed) % 9);
      R(c, bx - 2, by - hgt - 1, 6, hgt + 2, '#7a1f2e'); R(c, bx - 1, by - hgt, 4, hgt, '#ff7a2e'); R(c, bx, by - Math.round(hgt * 0.6), 2, Math.round(hgt * 0.6), '#ffc24a');
      if (hgt > 4) R(c, bx, by - 2, 1, 2, '#fff2a8');
      R(c, bx + ((fr + i) % 3) - 1, by - hgt - 3 - Math.round(ph * 5), 1, 1, '#fff2a8');
    }
    if (t > 0.45) { // 烟
      c.globalAlpha = a0 * Math.min(1, (t - 0.45) / 0.2) * (t > 0.85 ? (1 - t) / 0.15 : 1) * 0.75;
      for (let i = 0; i < 4; i++) { const sx = 6 + ((i * 9 + seed) % 20), sy = 16 - Math.round((t - 0.45) * 26) - (i % 2) * 4; R(c, sx, sy, 6, 4, '#625d57'); R(c, sx + 1, sy - 1, 4, 1, '#857f77'); }
      c.globalAlpha = a0;
    }
    c.fillStyle = INK;
  }

  // ───────── 硬边文字（系统字体，按物理像素渲染后把透明度二值化，边缘不发虚）─────────
  const tcache = new Map();
  function textCanvas(str, px, col) {
    const key = str + '|' + px + '|' + col;
    let e = tcache.get(key); if (e) return e;
    if (tcache.size > 600) tcache.clear();
    // 点阵字体：一律按 12 像素画（一个字体像素 = 一个像素），二值化后再整数倍最近邻放大，任何倍数都是实心方块
    if (fontOk && px > 12 && px % 12 === 0) {
      const b = textCanvas(str, 12, col), k = px / 12, cv2 = mk(b.cv.width * k, b.cv.height * k), c2 = cv2.getContext('2d');
      c2.imageSmoothingEnabled = false; c2.drawImage(b.cv, 0, 0, cv2.width, cv2.height);
      const e2 = { cv: cv2, w: b.w * k, h: cv2.height, off: k }; tcache.set(key, e2); return e2;
    }
    const m = mk(8, 8).getContext('2d'); m.font = px + 'px ' + fam();
    const w = Math.max(1, Math.ceil(m.measureText(str).width) + 2), h = Math.ceil(px * 1.25) + 2;
    const cv = mk(w, h), c = cv.getContext('2d');
    c.font = m.font; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(str, 1, Math.round(px * 11 / 12) + 1);
    try {
      const img = c.getImageData(0, 0, w, h), d = img.data;
      const th = fontOk ? 250 : 112; // 点阵字体只留实心的字体像素，周围那圈淡淡的晕边去掉
      for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= th ? 255 : 0;
      c.putImageData(img, 0, 0);
    } catch (er) { /* 取不到像素就保留抗锯齿版 */ }
    e = { cv, w: w - 2, h, off: 1 }; tcache.set(key, e); return e;
  }
  // size 是字号档（见 fpx）。(x, y) 是字框左上角；坐标按当前变换换成物理像素后取整再贴。返回宽度（界面像素）
  function text(c, str, x, y, o) {
    o = o || {}; str = String(str);
    const px = fpx(o.size), k = px / 12;
    const e = textCanvas(str, px, o.color || COL.txt), w = e.w / U;
    if (o.align === 'right') x -= w; else if (o.align === 'center') x -= w / 2;
    const t = c.getTransform(), X = Math.round(t.e + x * t.a) - e.off, Y = Math.round(t.f + y * t.d) - e.off;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (o.shadow !== false) { const s = textCanvas(str, px, o.shadow || INK); c.drawImage(s.cv, X + k, Y + k); if (o.outline) { c.drawImage(s.cv, X - k, Y); c.drawImage(s.cv, X + k, Y); c.drawImage(s.cv, X, Y - k); c.drawImage(s.cv, X - k, Y + k); c.drawImage(s.cv, X + k, Y - k); c.drawImage(s.cv, X - k, Y - k); c.drawImage(s.cv, X, Y + k); } }
    c.drawImage(e.cv, X, Y);
    c.restore();
    return w;
  }
  // 一段字画出来有多少个实心像素（检查用：字号翻倍，像素数应当正好是 4 倍）
  function textInk(str, size) { const e = textCanvas(String(str), fpx(size), '#ffffff'), d = e.cv.getContext('2d').getImageData(0, 0, e.cv.width, e.cv.height).data; let on = 0, mid = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] === 255) on++; else if (d[i] > 0) mid++; } return { px: fpx(size), on, mid }; }
  const textW = (str, size) => textCanvas(String(str), fpx(size), COL.txt).w / U;
  const textH = size => fpx(size) / U;
  // 图文混排的一行：segs = [{ t: 文字, c }, { n: 像素数字, c }, { i: 图标名 }, { gap: n }]。size 是文字字号
  function richW(segs, size) {
    let w = 0; for (const s of segs) w += s.t != null ? textW(s.t, s.size || size) : s.i ? icSize(s.i)[0] : (s.gap || 0);
    return w;
  }
  function rich(c, segs, x, y, size, o) {
    o = o || {};
    if (o.align === 'center') x -= richW(segs, size) / 2; else if (o.align === 'right') x -= richW(segs, size);
    x = Math.round(x);
    const mid = y + textH(size) * 0.5;
    for (const s of segs) {
      if (s.t != null) x += text(c, s.t, x, y + (textH(size) - textH(s.size || size)) * 0.6, { size: s.size || size, color: s.c, shadow: o.shadow, outline: o.outline });
      else if (s.i) { const z = icSize(s.i); icon(c, s.i, Math.round(x), Math.round(mid - z[1] / 2)); x += z[0]; }
      else x += s.gap || 0;
      x = Math.round(x);
    }
    return x;
  }

  // ───────── 标题字：系统字体小字号渲染 → 二值化成点阵 → 上半钢色、下半潮水色，中间一道波浪 → 描边 + 投影 ─────────
  // 返回点阵画布（1 像素 = 1 个像素块），由调用方按整数倍最近邻放大。o：{ px 字高, gap 字距, top/bottom 色阶 }
  function logo(str, o) {
    o = o || {};
    const px = o.px || 12, gap = o.gap == null ? 2 : o.gap;
    const m = mk(8, 8).getContext('2d'); const font = px + 'px ' + fam(); m.font = font;
    const ws = [...str].map(ch => Math.ceil(m.measureText(ch).width));
    const W = ws.reduce((a, b) => a + b + gap, 0) - gap + 6, H = Math.ceil(px * 1.22) + 6;
    const src = mk(W, H), sc = src.getContext('2d'); sc.font = font; sc.textBaseline = 'alphabetic'; sc.fillStyle = '#fff';
    let x = 2; [...str].forEach((ch, i) => { sc.fillText(ch, x, Math.round(px * 11 / 12) + 2); x += ws[i] + gap; });
    let d; try { d = sc.getImageData(0, 0, W, H).data; } catch (er) { return src; }
    const on = new Uint8Array(W * H); let y0 = H, y1 = 0;
    for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] >= (fontOk ? 250 : 104)) { on[i] = 1; const y = (i / W) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const out = mk(W + 2, H + 3), c = out.getContext('2d');
    const top = o.top || ['#f3f0ea', '#e9e6df', '#b8afa2', '#857f77'], bot = o.bottom || ['#eafcff', '#9fe6f7', '#5fc0f0', '#3b8ae6'];
    const at = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < H && on[yy * W + xx] === 1;
    const hgt = Math.max(1, y1 - y0 + 1), wave = xx => y0 + Math.round(hgt * 0.5 + Math.sin(xx * 0.55) * 1.2);
    // 投影、描边
    c.fillStyle = 'rgba(18,20,26,.55)'; for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (at(xx, yy)) c.fillRect(xx + 2, yy + 3, 1, 1);
    c.fillStyle = o.out || '#25272c';
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (at(xx, yy)) c.fillRect(xx, yy, 3, 3);
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (at(xx, yy)) {
      const wv = wave(xx); let col;
      if (yy < wv) { const k = (yy - y0) / Math.max(1, wv - y0); col = top[Math.min(top.length - 1, Math.floor(k * top.length))]; if (!at(xx, yy - 1) || !at(xx - 1, yy)) col = top[0]; }
      else { const k = (yy - wv) / Math.max(1, y1 - wv + 1); col = yy === wv ? bot[0] : bot[Math.min(bot.length - 1, 1 + Math.floor(k * (bot.length - 1)))]; }
      c.fillStyle = col; c.fillRect(xx + 1, yy + 1, 1, 1);
    }
    return out;
  }

  // ───────── 标题页大字：点阵字白色实心 + 深蓝粗描边 + 向下的投影（不做渐变）─────────
  // 字按 12 像素点阵取样；描边和投影在“半个字体像素”的网格上画（sub = 2），外角因此是切过的，不是方砖。
  // 返回的画布 1 像素 = 1/sub 个字体像素，由调用方按整数倍最近邻放大。o：{ gap 字距（字体像素）, sub, ol 描边粗细, drop 投影长度, bold 笔画加粗（这三个单位是子像素）, fill, out, shade, rim 最外圈细边的颜色 }
  function title(str, o) {
    o = o || {};
    const px = 12, gap = o.gap == null ? 1 : o.gap, sub = o.sub || 2, ol = o.ol == null ? sub : o.ol, drop = o.drop == null ? sub : o.drop;
    const m = mk(8, 8).getContext('2d'); const font = px + 'px ' + fam(); m.font = font;
    const chars = [...String(str)], ws = chars.map(ch => Math.ceil(m.measureText(ch).width));
    const W = Math.max(1, ws.reduce((a, b) => a + b + gap, 0) - gap) + 1, H = px + 4; // 右边多留一列，给加粗用
    const src = mk(W, H), sc = src.getContext('2d'); sc.font = font; sc.textBaseline = 'alphabetic'; sc.fillStyle = '#fff';
    let x = 0; chars.forEach((ch, i) => { sc.fillText(ch, x, Math.round(px * 11 / 12) + 1); x += ws[i] + gap; });
    let d; try { d = sc.getImageData(0, 0, W, H).data; } catch (er) { return src; }
    let y0 = H, y1 = -1; const on = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] >= (fontOk ? 250 : 104)) { on[i] = 1; const y = (i / W) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (y1 < y0) { y0 = 0; y1 = H - 1; }
    const gh = y1 - y0 + 1, SW = W * sub, SH = gh * sub, OW = SW + ol * 2, OH = SH + ol * 2 + drop;
    const out = mk(OW, OH), c = out.getContext('2d');
    // 描边形状：字形按半径 ol 的圆盘膨胀
    const disc = []; for (let dy = -ol; dy <= ol; dy++) for (let dx = -ol; dx <= ol; dx++) if (dx * dx + dy * dy <= ol * ol + ol) disc.push([dx, dy]);
    const EH = SH + ol * 2, edge = new Uint8Array(OW * EH), ink = new Uint8Array(OW * EH), bold = o.bold || 0;
    for (let y = 0; y < gh; y++) for (let xx = 0; xx < W; xx++) if (on[(y + y0) * W + xx]) {
      for (let b = 0; b < sub + bold; b++) for (let a = 0; a < sub + bold; a++) { const px2 = xx * sub + a + ol, py2 = y * sub + b + ol; if (px2 < OW - ol && py2 < EH - ol) ink[py2 * OW + px2] = 1; }
    }
    for (let y = 0; y < EH; y++) for (let xx = 0; xx < OW; xx++) if (ink[y * OW + xx]) for (const [dx, dy] of disc) edge[(y + dy) * OW + xx + dx] = 1;
    c.fillStyle = o.shade || '#101c4c'; for (let y = 0; y < EH; y++) for (let xx = 0; xx < OW; xx++) if (edge[y * OW + xx]) c.fillRect(xx, y + 1, 1, drop);
    c.fillStyle = o.out || '#1f3f96'; for (let y = 0; y < EH; y++) for (let xx = 0; xx < OW; xx++) if (edge[y * OW + xx]) c.fillRect(xx, y, 1, 1);
    c.fillStyle = o.fill || '#ffffff'; for (let y = 0; y < EH; y++) for (let xx = 0; xx < OW; xx++) if (ink[y * OW + xx]) c.fillRect(xx, y, 1, 1);
    out._sub = sub;
    if (!o.rim) return out;
    // 最外面一圈 1 子像素的深色细边：把上面画好的整块再往四周各挪一格垫在下面
    const out2 = mk(OW + 2, OH + 2), c2 = out2.getContext('2d'), sil = mk(OW, OH), sc2 = sil.getContext('2d');
    sc2.drawImage(out, 0, 0); sc2.globalCompositeOperation = 'source-in'; sc2.fillStyle = o.rim; sc2.fillRect(0, 0, OW, OH);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]]) c2.drawImage(sil, dx, dy);
    c2.drawImage(out, 1, 1); out2._sub = sub; return out2;
  }
  // k：一个字体像素对应的屏幕像素数。放大倍数取整到物理像素
  function titleEl(str, k, o) {
    const src = title(str, o), kk = Math.max(1, Math.round(k * dpr / (src._sub || 1))), cv = mk(src.width * kk, src.height * kk);
    cv.style.width = (cv.width / dpr) + 'px'; cv.style.height = (cv.height / dpr) + 'px'; cv.className = 'px-cv';
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0, cv.width, cv.height);
    cv.textContent = str; cv.dataset.k = String(kk * (src._sub || 1) / dpr); return cv;
  }

  // ───────── DOM 用的小画布（菜单里的图标、数字、条）─────────
  // w、h 是界面像素；draw(c) 里 1 单位 = 1 界面像素
  function el(w, h, draw, cls) {
    const cv = mk(Math.round(w * U), Math.round(h * U)); cv.style.width = (w * u) + 'px'; cv.style.height = (h * u) + 'px'; cv.className = 'px-cv' + (cls ? ' ' + cls : '');
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.setTransform(U, 0, 0, U, 0, 0);
    try { draw(c); } catch (er) { if (root.console) console.error(er); }
    return cv;
  }
  const iconEl = (name, cls) => { const z = icSize(name); return el(z[0], z[1], c => icon(c, name, 0, 0), cls); };
  // 把一张现成的像素画布按整数倍贴进小画布（兵种小图等）
  function spriteEl(src, sx, sy, sw, sh, cls) {
    const k = Math.max(1, Math.ceil(U / 2)), cv = mk(sw * k, sh * k); cv.style.width = (sw * k / dpr) + 'px'; cv.style.height = (sh * k / dpr) + 'px'; cv.className = 'px-cv' + (cls ? ' ' + cls : '');
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, sx, sy, sw, sh, 0, 0, sw * k, sh * k); return cv;
  }
  // 把一张按物理像素取好的图（新的单位素材，平滑的高清图）1:1 拷进小画布，不放大。屏幕上的边长 = 图的像素数 / dpr
  function squareEl(src, cls) {
    const cv = mk(src.width, src.height); cv.style.width = (src.width / dpr) + 'px'; cv.style.height = (src.height / dpr) + 'px'; cv.className = 'px-cv' + (cls ? ' ' + cls : '');
    cv.getContext('2d').drawImage(src, 0, 0); return cv;
  }
  function logoEl(str, block, o) {
    const src = logo(str, o), k = Math.max(1, Math.round(block * dpr)), cv = mk(src.width * k, src.height * k);
    cv.style.width = (cv.width / dpr) + 'px'; cv.style.height = (cv.height / dpr) + 'px'; cv.className = 'px-cv';
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(src, 0, 0, cv.width, cv.height);
    cv.textContent = str; return cv;
  }

  // ───────── 安装：算好界面像素倍数，把九宫格边框、选中箭头做成图片交给 CSS 变量 ─────────
  // o.glass：面板底换成半透明的颜色（边框照旧），标题页压在插画上的菜单用
  function slice(o) {
    const s = 9, cv = mk(s * U, s * U), c = cv.getContext('2d'); c.setTransform(U, 0, 0, U, 0, 0); panel(c, 0, 0, s, s, Object.assign({ shadow: false }, o));
    if (o && o.glass) { c.clearRect(3, 3, 3, 3); c.fillStyle = o.glass; c.fillRect(3, 3, 3, 3); }
    return 'url(' + cv.toDataURL() + ')';
  }
  function install(cssPerUi, devicePixelRatio) {
    dpr = devicePixelRatio || 1; U = Math.max(1, Math.round(cssPerUi * dpr)); u = U / dpr;
    tcache.clear();
    try { fontOk = !!(document.fonts && document.fonts.check('12px FusionPixel')); } catch (er) { fontOk = false; }
    const st = document.documentElement.style;
    st.setProperty('--u', u + 'px'); st.setProperty('--fs', (12 * u) + 'px'); st.setProperty('--fs-s', (fpx('s') / dpr) + 'px'); st.setProperty('--px-slice', String(3 * U));
    st.setProperty('--px-panel', slice());
    st.setProperty('--px-inset', slice({ body: '#30343b', edge: '#25272c', edgeLo: '#4a4f58' }));
    st.setProperty('--px-glass', slice({ glass: 'rgba(28,30,34,.8)' }));
    st.setProperty('--px-gold', slice({ body: COL.gold, edge: COL.goldHi, edgeLo: COL.goldLo }));
    const a = mk(5 * U, 7 * U), c = a.getContext('2d'); c.setTransform(U, 0, 0, U, 0, 0); icon(c, 'arrow', 0, 0);
    st.setProperty('--px-arrow', 'url(' + a.toDataURL() + ')');
    return { u, U };
  }

  root.AWSkin = {
    COL, install, get font() { return fam(); }, get fontOk() { return fontOk; }, fpx, textH, get u() { return u; }, get U() { return U; },
    panel, well, bar, icon, icSize, emblem, num, numW, text, textW, textInk, rich, richW, logo, flame, burn, againBadge, miniMarks,
    el, iconEl, spriteEl, squareEl, logoEl, title, titleEl,
  };
})(window);
