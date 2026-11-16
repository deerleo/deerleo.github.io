/* fx.js — hit sparks, dust, slash arcs, floating text, screen flashes. All drawn as hard pixels. */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, cam = BD.cam;
  const px = (x, y) => { const s = cam.toScreen(x, y), k = BD.pixelScale; return [s[0] * k, s[1] * k]; };

  const FX = (BD.FX = {
    p: [], stars: [], rings: [], arcs: [], texts: [], ghosts: [],
    flashA: 0, flashC: '#ffffff', lines: 0, dark: 0,
    clear() { this.p.length = this.stars.length = this.rings.length = this.arcs.length = this.texts.length = this.ghosts.length = 0; this.flashA = 0; this.lines = 0; this.dark = 0; },
    add(x, y, vx, vy, life, size, color, grav, drag) { if (this.p.length < 400) this.p.push({ x, y, vx, vy, life, max: life, size, color, grav: grav || 0, drag: drag || 0 }); },
    spark(x, y, n, color, sp, up) {
      sp = sp || 420;
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, U.TAU), s = U.rand(0.25, 1) * sp;
        this.add(x, y, Math.cos(a) * s, Math.sin(a) * s - (up || 0), U.rand(0.14, 0.4), U.rand(1, 3) | 0, color, 900, 2);
      }
    },
    /** impact: white star + directional sparks */
    hit(x, y, power, dir, color) {
      this.stars.push({ x, y, life: 0.1, max: 0.1, size: 5 + power * 6 });
      const n = 4 + ((power * 6) | 0);
      for (let i = 0; i < n; i++) {
        const a = U.rand(-0.9, 0.9), s = U.rand(200, 620) * (0.6 + power * 0.5);
        this.add(x, y, Math.cos(a) * s * dir, Math.sin(a) * s - 80, U.rand(0.12, 0.34), U.rand(1, 3) | 0, i % 3 ? color || '#ffe9a0' : '#ffffff', 700, 3);
      }
    },
    dust(x, y, n, col) {
      for (let i = 0; i < (n || 5); i++) this.add(x + U.rand(-14, 14), y - 2, U.rand(-120, 120), U.rand(-90, -10), U.rand(0.25, 0.55), U.rand(2, 4) | 0, col || '#d9cfbb', -40, 4);
    },
    ring(x, y, color, r) { this.rings.push({ x, y, life: 0.26, max: 0.26, r: r || 70, color: color || '#ffffff' }); },
    text(x, y, str, color, scale) { this.texts.push({ x, y, str, color: color || '#ffffff', scale: scale || 1, life: 0.95, max: 0.95 }); },
    /** crescent swoosh; angles in radians, mirrored when face = -1 */
    arc(x, y, r, a0, a1, face, color, life) { this.arcs.push({ x, y, r, a0, a1, face, color: color || '#ffffff', life: life || 0.13, max: life || 0.13 }); },
    flash(a, c) { if (a > this.flashA) { this.flashA = a; this.flashC = c || '#ffffff'; } },
    update(dt) {
      const upd = (arr) => { for (let i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); } };
      for (let i = this.p.length - 1; i >= 0; i--) {
        const q = this.p[i];
        q.life -= dt;
        if (q.life <= 0) { this.p.splice(i, 1); continue; }
        q.vy += q.grav * dt; q.vx -= q.vx * q.drag * dt; q.vy -= q.vy * q.drag * dt * 0.5;
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.y > 0 && q.grav > 0) { q.y = 0; q.vy *= -0.3; q.vx *= 0.6; }
      }
      upd(this.stars); upd(this.rings); upd(this.arcs); upd(this.ghosts);
      for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y -= 70 * dt * (t.life / t.max); if (t.life <= 0) this.texts.splice(i, 1); }
      this.flashA = Math.max(0, this.flashA - dt * 4.5);
      this.lines = Math.max(0, this.lines - dt * 1.4);
    },
    /** call with an identity transform (framebuffer pixels) */
    drawWorld(g) {
      for (const q of this.p) {
        const s = px(q.x, q.y), z = q.life / q.max < 0.35 ? Math.max(1, q.size - 1) : q.size;
        g.fillStyle = q.color; g.fillRect(s[0] | 0, s[1] | 0, z, z);
      }
      for (const r of this.rings) {
        const s = px(r.x, r.y), t = 1 - r.life / r.max, rad = r.r * (0.3 + t * 0.9) * cam.zoom * BD.pixelScale;
        g.strokeStyle = r.color; g.lineWidth = Math.max(1, 3 * (1 - t)); g.globalAlpha = 1 - t * 0.6;
        g.beginPath(); g.ellipse(s[0], s[1], rad, rad * 0.9, 0, 0, U.TAU); g.stroke(); g.globalAlpha = 1;
      }
      for (const a of this.arcs) {
        const s = px(a.x, a.y), t = 1 - a.life / a.max, rad = a.r * cam.zoom * BD.pixelScale;
        let a0 = a.a0 + (a.a1 - a.a0) * Math.max(0, t - 0.35), a1 = a.a0 + (a.a1 - a.a0) * Math.min(1, t * 2.2 + 0.25);
        if (a.face < 0) { a0 = Math.PI - a0; a1 = Math.PI - a1; }
        g.strokeStyle = a.color; g.lineCap = 'round'; g.lineWidth = Math.max(1, 4 * (1 - t));
        g.beginPath(); g.arc(s[0], s[1], rad, a0, a1, a1 < a0); g.stroke();
        g.lineCap = 'butt';
      }
      for (const st of this.stars) {
        const s = px(st.x, st.y), k = st.life / st.max, z = Math.round(st.size * (0.6 + k * 0.6));
        const x = s[0] | 0, y = s[1] | 0;
        g.fillStyle = '#ffd24a';
        for (let i = 1; i <= z >> 1; i++) { g.fillRect(x - i, y - i, 2, 2); g.fillRect(x + i - 1, y - i, 2, 2); g.fillRect(x - i, y + i - 1, 2, 2); g.fillRect(x + i - 1, y + i - 1, 2, 2); }
        g.fillStyle = '#ffffff';
        g.fillRect(x - z, y - 1, z * 2, 2); g.fillRect(x - 1, y - z, 2, z * 2);
        g.fillRect(x - (z >> 1), y - 2, z, 4); g.fillRect(x - 2, y - (z >> 1), 4, z);
      }
      for (const t of this.texts) {
        const s = px(t.x, t.y), k = t.life / t.max;
        if (k < 0.25 && ((BD.time * 30) | 0) % 2) continue;
        BD.Text.draw(g, t.str, s[0], s[1], { align: 'center', color: t.color, outline: '#14101a', scale: t.scale });
      }
    },
    drawScreen(g) {
      const W = BD.FBW, H = BD.FBH;
      if (this.dark > 0) { g.fillStyle = 'rgba(8,6,14,' + this.dark.toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
      if (this.lines > 0) { // speed lines for specials
        const r = U.seeded(((BD.time * 24) | 0) + 7);
        g.fillStyle = '#ffffff';
        for (let i = 0; i < 26; i++) {
          const y = (r() * H) | 0, w = 40 + r() * 160 * this.lines, x = r() < 0.5 ? 0 : W - w;
          g.fillRect(x | 0, y, w | 0, r() < 0.3 ? 2 : 1);
        }
      }
      if (this.flashA > 0.01) { g.globalAlpha = Math.min(1, this.flashA); g.fillStyle = this.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    },
  });
})();
