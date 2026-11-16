// うしろのハニワ ― 一人称視点の描画（レイキャスティング。壁・床・天井・立て看板式のスプライト）
(function () {
  'use strict';
  var TS = 128, PLANE = 1.12; // 視野はおよそ96度。斜め前のマスまで画面に入る

  function create(W, H) {
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(W, H);
    var buf = new Uint32Array(img.data.buffer);
    var zbuf = new Float32Array(W);
    var S = W / (2 * PLANE), half = H >> 1;
    var AR = 9, AG = 11, AB = 24; // 闇の色（青み）
    var WG = 0.90, WB = 0.70;   // ランタンの光の色（暖色）

    function shadeOf(d, light) {
      var f = light / (1 + d * d * 0.11);
      if (f > 1) f = 1; if (f < 0.045) f = 0.045;
      return (f * 256) | 0;
    }

    function draw(cam, scene) {
      var a = cam.ang, dx = Math.sin(a), dy = -Math.cos(a);
      var rx = Math.cos(a), ry = Math.sin(a);
      var px = rx * PLANE, py = ry * PLANE;
      var light = scene.light, x, y;
      var floorT = scene.floor, ceilT = scene.ceil;

      // 床と天井
      for (y = half; y < H; y++) {
        var p = y - half + 0.5;
        var rowDist = (0.5 * S) / p;
        var f = shadeOf(rowDist, light), g = 256 - f;
        var stepX = rowDist * 2 * px / W, stepY = rowDist * 2 * py / W;
        var fx = cam.x + rowDist * (dx - px), fy = cam.y + rowDist * (dy - py);
        var rowF = y * W, rowC = (H - 1 - y) * W;
        var aR = (AR * g) >> 8, aG = (AG * g) >> 8, aB = (AB * g) >> 8;
        var fc = (f * 0.82) | 0, fG = (f * WG) | 0, fB = (f * WB) | 0, fcG = (fc * WG) | 0, fcB = (fc * WB) | 0;
        for (x = 0; x < W; x++) {
          var tx = ((fx - Math.floor(fx)) * TS) | 0, ty = ((fy - Math.floor(fy)) * TS) | 0;
          var ti = ty * TS + tx;
          var c = floorT[ti];
          buf[rowF + x] = 0xff000000 |
            ((((c >> 16 & 255) * fB >> 8) + aB) << 16) | ((((c >> 8 & 255) * fG >> 8) + aG) << 8) | (((c & 255) * f >> 8) + aR);
          c = ceilT[ti];
          buf[rowC + x] = 0xff000000 |
            ((((c >> 16 & 255) * fcB >> 8) + aB) << 16) | ((((c >> 8 & 255) * fcG >> 8) + aG) << 8) | (((c & 255) * fc >> 8) + aR);
          fx += stepX; fy += stepY;
        }
      }

      // 壁
      var wallAt = scene.wallAt;
      for (x = 0; x < W; x++) {
        var camX = 2 * x / W - 1;
        var rdx = dx + px * camX, rdy = dy + py * camX;
        var mapX = Math.floor(cam.x), mapY = Math.floor(cam.y);
        var ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
        var stepx, stepy, sdx, sdy, side = 0, tex = null;
        if (rdx < 0) { stepx = -1; sdx = (cam.x - mapX) * ddx; } else { stepx = 1; sdx = (mapX + 1 - cam.x) * ddx; }
        if (rdy < 0) { stepy = -1; sdy = (cam.y - mapY) * ddy; } else { stepy = 1; sdy = (mapY + 1 - cam.y) * ddy; }
        for (var n = 0; n < 64; n++) {
          if (sdx < sdy) { sdx += ddx; mapX += stepx; side = 0; } else { sdy += ddy; mapY += stepy; side = 1; }
          tex = wallAt(mapX, mapY);
          if (tex) break;
        }
        if (!tex) { zbuf[x] = 99; continue; }
        var perp = side === 0 ? sdx - ddx : sdy - ddy;
        if (perp < 0.02) perp = 0.02;
        zbuf[x] = perp;
        var lineH = S / perp;
        var wx = side === 0 ? cam.y + perp * rdy : cam.x + perp * rdx;
        wx -= Math.floor(wx);
        var texX = (wx * TS) | 0;
        if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) texX = TS - 1 - texX;
        var y0 = Math.floor(half - lineH / 2), y1 = Math.floor(half + lineH / 2);
        var tStep = TS / lineH, tPos = 0;
        if (y0 < 0) { tPos = -y0 * tStep; y0 = 0; }
        if (y1 > H) y1 = H;
        var wf = shadeOf(perp, light);
        if (side === 1) wf = (wf * 0.78) | 0;
        var wg = 256 - wf, bR = (AR * wg) >> 8, bG = (AG * wg) >> 8, bB = (AB * wg) >> 8, wfG = (wf * WG) | 0, wfB = (wf * WB) | 0;
        for (y = y0; y < y1; y++) {
          var cc = tex[((tPos | 0) & 127) * TS + texX];
          tPos += tStep;
          buf[y * W + x] = 0xff000000 |
            ((((cc >> 16 & 255) * wfB >> 8) + bB) << 16) | ((((cc >> 8 & 255) * wfG >> 8) + bG) << 8) | (((cc & 255) * wf >> 8) + bR);
        }
      }

      // スプライト（遠いものから）
      var list = [], sp, i;
      for (i = 0; i < scene.sprites.length; i++) {
        sp = scene.sprites[i];
        var sx = sp.x - cam.x, sy = sp.y - cam.y;
        var depth = sx * dx + sy * dy;
        if (depth < 0.12) continue;
        list.push({ sp: sp, depth: depth, lat: sx * rx + sy * ry });
      }
      list.sort(function (p, q) { return q.depth - p.depth; });
      for (i = 0; i < list.length; i++) {
        var it = list[i]; sp = it.sp;
        var unit = S / it.depth, size = unit * (sp.scale || 1);
        var scx = W / 2 + (it.lat / it.depth) * S + (sp.sway || 0) * unit;
        var bottom = half + unit / 2 - (sp.z || 0) * unit;
        var top = bottom - size, left = scx - size / 2;
        var xs = Math.max(0, Math.floor(left)), xe = Math.min(W, Math.ceil(left + size));
        var ys = Math.max(0, Math.floor(top)), ye = Math.min(H, Math.ceil(bottom));
        if (xs >= xe || ys >= ye) continue;
        var sf = shadeOf(it.depth, light), br = sp.bright || 0;
        sf = (sf + (256 - sf) * br) | 0;
        var sg = 256 - sf, cR = (AR * sg) >> 8, cG = (AG * sg) >> 8, cB = (AB * sg) >> 8;
        var sfG = (sf * (WG + (1 - WG) * br)) | 0, sfB = (sf * (WB + (1 - WB) * br)) | 0;
        var data = sp.data, inv = TS / size, alpha = sp.alpha === undefined ? 1 : sp.alpha;
        for (x = xs; x < xe; x++) {
          if (it.depth >= zbuf[x]) continue;
          var u = ((x - left) * inv) | 0;
          if (u < 0 || u >= TS) continue;
          for (y = ys; y < ye; y++) {
            var v = ((y - top) * inv) | 0;
            if (v < 0 || v >= TS) continue;
            var sc = data[v * TS + u], al = sc >>> 24;
            if (al < 40) continue;
            var o = y * W + x;
            var r = ((sc & 255) * sf >> 8) + cR, gg = ((sc >> 8 & 255) * sfG >> 8) + cG, b = ((sc >> 16 & 255) * sfB >> 8) + cB;
            var k = (al / 255) * alpha;
            if (k < 0.98) {
              var d = buf[o];
              r = (r * k + (d & 255) * (1 - k)) | 0;
              gg = (gg * k + (d >> 8 & 255) * (1 - k)) | 0;
              b = (b * k + (d >> 16 & 255) * (1 - k)) | 0;
            }
            buf[o] = 0xff000000 | (b << 16) | (gg << 8) | r;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    return { canvas: canvas, draw: draw, W: W, H: H };
  }
  window.HB_RENDER = { create: create, PLANE: PLANE };
})();
