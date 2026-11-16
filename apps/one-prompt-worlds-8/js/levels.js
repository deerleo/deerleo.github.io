/*
 * ひつじが いっぴき — 牧場のならび（朝から夜までの一日）
 *   sheep / goats : はじめの位置      walls : 柵 [x1,y1,x2,y2]
 *   ponds : 池 {x,y,rx,ry}            grass : クローバー {x,y,r}
 *   pens  : 小屋 {x,y,w,h,gate:'L|R|T|B',gpos,gw,accept:'any|sheep|goat'}
 *   par   : [星3つの秒数, 星2つの秒数]
 */
(function (root) {
  'use strict';
  function cluster(cx, cy, n, r, seed) {
    var out = [], a = seed || 1;
    for (var i = 0; i < n; i++) {
      a = (a * 9301 + 49297) % 233280;
      var ang = i * 2.39996 + a / 233280, rad = r * Math.sqrt((i + 0.6) / n);
      out.push([Math.round(cx + Math.cos(ang) * rad), Math.round(cy + Math.sin(ang) * rad)]);
    }
    return out;
  }
  var L = [
    {
      name: 'はじめの五ひき', time: 'morning',
      hint: ['ひつじは コロから はなれようとする。', 'うしろに まわって、小屋のほうへ おしていこう。'],
      dog: [250, 420],
      sheep: cluster(600, 400, 5, 45, 3),
      pens: [{ x: 1060, y: 300, w: 180, h: 170, gate: 'L', gw: 96 }],
      par: [20, 40]
    },
    {
      name: 'せまい門', time: 'morning',
      hint: ['クリックを おしているあいだ、コロは 走る。', '走るコロに ひつじは おどろいて ちってしまう。遠まわりに使おう。'],
      dog: [120, 400],
      sheep: cluster(330, 430, 8, 60, 5),
      walls: [[700, 78, 700, 310], [700, 430, 700, 690]],
      pens: [{ x: 1040, y: 100, w: 200, h: 165, gate: 'B', gw: 90 }],
      par: [35, 70]
    },
    {
      name: 'クローバー', time: 'noon',
      hint: ['クローバーを 食べはじめた ひつじは、', '歩くコロを 気にしない。……走るコロなら？'],
      dog: [130, 390],
      sheep: cluster(300, 400, 5, 45, 7).concat([[610, 370], [640, 410], [600, 420]]),
      grass: [{ x: 620, y: 395, r: 82 }, { x: 900, y: 580, r: 62 }],
      pens: [{ x: 1060, y: 290, w: 180, h: 180, gate: 'L', gw: 96 }],
      par: [60, 110]
    },
    {
      name: 'いけのむこう', time: 'noon',
      hint: ['ひつじは 水に入れない。コロは 泳げる（ゆっくり）。', 'ふた手に わかれた群れを、ひとつに。'],
      dog: [640, 150],
      sheep: cluster(930, 200, 5, 45, 2).concat(cluster(960, 590, 5, 45, 9)),
      ponds: [{ x: 640, y: 400, rx: 200, ry: 118 }],
      grass: [{ x: 360, y: 610, r: 60 }],
      pens: [{ x: 40, y: 290, w: 180, h: 190, gate: 'R', gw: 96 }],
      par: [105, 190]
    },
    {
      name: 'まがりみち', time: 'noon',
      hint: ['まがりくねった 柵のあいだを、いちばん 下の小屋まで。', 'あわてず いくか、いっきに 走りぬけるか。'],
      dog: [80, 180],
      sheep: cluster(300, 185, 10, 62, 12),
      walls: [[34, 290, 900, 290], [340, 480, 1246, 480]],
      grass: [{ x: 640, y: 425, r: 50 }],
      pens: [{ x: 1060, y: 506, w: 180, h: 178, gate: 'L', gw: 96 }],
      par: [70, 120]
    },
    {
      name: 'やぎ', time: 'evening',
      hint: ['やぎは がんこ。歩くコロでは うごかない。', '走って おどろかすと、コロと 反対へ まっすぐ 走る。'],
      dog: [640, 420],
      sheep: cluster(330, 330, 6, 50, 4),
      goats: [[260, 580], [1010, 540], [700, 610]],
      pens: [{ x: 530, y: 100, w: 230, h: 160, gate: 'B', gw: 100 }],
      par: [60, 110]
    },
    {
      name: 'わける', time: 'evening',
      hint: ['ひつじは 左の小屋、やぎは 右の小屋。', 'まざった群れを、どう わけよう？'],
      dog: [640, 600],
      sheep: [[600, 340], [650, 330], [690, 370], [620, 400], [580, 380], [670, 420]],
      goats: [[640, 365], [610, 430], [700, 400], [570, 345]],
      pens: [
        { x: 40, y: 280, w: 180, h: 190, gate: 'R', gw: 96, accept: 'sheep' },
        { x: 1070, y: 280, w: 170, h: 190, gate: 'L', gw: 96, accept: 'goat' }
      ],
      par: [80, 150]
    },
    {
      name: '門番', time: 'dusk',
      hint: ['門の クローバーに、やぎが いすわっている。', 'いままでの しくみを ぜんぶ 使って。'],
      dog: [150, 560],
      sheep: cluster(300, 300, 8, 60, 6),
      goats: [[640, 370], [630, 410], [655, 395]],
      walls: [[640, 78, 640, 320], [640, 460, 640, 690]],
      grass: [{ x: 640, y: 390, r: 66 }],
      pens: [{ x: 1050, y: 280, w: 190, h: 200, gate: 'L', gw: 100 }],
      par: [80, 150]
    },
    {
      name: 'みんな、おかえり', time: 'night',
      hint: ['もうすぐ 夜。のこっているのは これで ぜんぶ。', 'ひつじは 上の小屋、やぎは 下の小屋へ。'],
      dog: [640, 120],
      sheep: cluster(200, 190, 5, 42, 8).concat(cluster(280, 560, 4, 40, 11), cluster(560, 330, 3, 30, 13)),
      goats: [[440, 600], [600, 170], [930, 330], [960, 380]],
      walls: [[820, 78, 820, 290], [820, 420, 820, 690]],
      ponds: [{ x: 500, y: 470, rx: 120, ry: 70 }],
      grass: [{ x: 200, y: 185, r: 70 }, { x: 700, y: 600, r: 55 }],
      pens: [
        { x: 1030, y: 100, w: 210, h: 185, gate: 'L', gw: 96, accept: 'sheep' },
        { x: 1070, y: 520, w: 170, h: 164, gate: 'L', gw: 96, accept: 'goat' }
      ],
      par: [150, 260]
    }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  root.LEVELS = L;
})(typeof window !== 'undefined' ? window : globalThis);
