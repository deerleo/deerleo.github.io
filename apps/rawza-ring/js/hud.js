import { fmtTime, ORDINAL, clamp } from './util.js';

const $ = (id) => document.getElementById(id);
const css = (c) => '#' + c.toString(16).padStart(6, '0');

export class Hud {
  constructor(map, track, cars, laps) {
    this.map = map; this.track = track; this.cars = cars; this.laps = laps;
    this.el = {
      hud: $('hud'), pos: $('pos'), posSuf: $('posSuf'), lap: $('lap'), time: $('time'), lapTime: $('lapTime'), best: $('best'),
      board: $('board'), street: $('street'), streetNative: $('streetNative'), cp: $('cp'), msg: $('msg'), warn: $('warn'),
      hint: $('hint'), fps: $('fps'), finish: $('finish'), results: $('results'), finishTitle: $('finishTitle'),
      menu: $('menu'), status: $('status'), startBtn: $('startBtn'), pause: $('pause'),
    };
    this.msgTimer = 0;
    this.lastBoard = '';
    this.lastStreet = null;
    this._minimap();
    this._speedo();
    this.el.board.innerHTML = cars.map((_, i) => `<div class="row" id="row${i}"><span class="p"></span><span class="dot"></span><span class="n"></span><span class="g"></span></div>`).join('');
    this.rows = cars.map((_, i) => {
      const r = $('row' + i);
      return { r, p: r.children[0], dot: r.children[1], n: r.children[2], g: r.children[3] };
    });
  }

  // ---------------------------------------------------------------- minimap
  _minimap() {
    const t = this.track, map = this.map;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < t.n; i++) {
      x0 = Math.min(x0, t.cx[i]); x1 = Math.max(x1, t.cx[i]);
      z0 = Math.min(z0, t.cz[i]); z1 = Math.max(z1, t.cz[i]);
    }
    const pad = 75;
    x0 -= pad; x1 += pad; z0 -= pad; z1 += pad;
    const W = 310, H = Math.round((W * (z1 - z0)) / (x1 - x0));
    const dpr = 2;
    const cv = $('minimap');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const k = (W * dpr) / (x1 - x0);
    this.mm = { cv, ctx: cv.getContext('2d'), x0, z0, k, W: W * dpr, H: H * dpr };
    const bg = document.createElement('canvas');
    bg.width = W * dpr; bg.height = H * dpr;
    const g = bg.getContext('2d');
    const X = (x) => (x - x0) * k, Z = (z) => (z - z0) * k;
    const path = (p, close) => {
      g.beginPath();
      for (let i = 0; i < p.length; i += 2) (i ? g.lineTo(X(p[i]), Z(p[i + 1])) : g.moveTo(X(p[i]), Z(p[i + 1])));
      if (close) g.closePath();
    };
    g.fillStyle = 'rgba(16,20,32,0.82)';
    g.fillRect(0, 0, bg.width, bg.height);
    g.fillStyle = 'rgba(110,160,90,0.45)';
    for (const gr of map.greens) { path(gr.pts, true); g.fill(); }
    g.fillStyle = 'rgba(235,215,180,0.20)';
    for (const b of map.buildings) {
      const p = b.pts;
      if (p[0] < x0 - 40 || p[0] > x1 + 40 || p[1] < z0 - 40 || p[1] > z1 + 40) continue;
      path(p, true); g.fill();
    }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const r of map.roads) {
      g.strokeStyle = r.t === 'footway' ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.34)';
      g.lineWidth = Math.max(1, r.w * k * 0.9);
      path(r.pts, false); g.stroke();
    }
    // the race route
    const loop = [];
    for (let i = 0; i < t.n; i++) loop.push(t.cx[i], t.cz[i]);
    g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 9; path(loop, true); g.stroke();
    g.strokeStyle = '#ffd166'; g.lineWidth = 5; path(loop, true); g.stroke();
    // shrine
    g.fillStyle = '#35c7e6'; g.strokeStyle = '#eaffff'; g.lineWidth = 2;
    g.shadowColor = '#35c7e6'; g.shadowBlur = 16;
    path(map.shrine.pts, true); g.fill(); g.stroke();
    g.shadowBlur = 0;
    // start line
    const c0 = t.checkpoints[0];
    g.strokeStyle = '#fff'; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(X(c0.x - c0.tz * 16), Z(c0.z + c0.tx * 16));
    g.lineTo(X(c0.x + c0.tz * 16), Z(c0.z - c0.tx * 16));
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = `${11 * dpr}px system-ui, sans-serif`;
    g.fillText('N', bg.width - 16 * dpr, 16 * dpr);
    g.beginPath(); g.moveTo(bg.width - 12 * dpr, 20 * dpr); g.lineTo(bg.width - 8 * dpr, 28 * dpr); g.lineTo(bg.width - 16 * dpr, 28 * dpr); g.fill();
    this.mm.bg = bg;
  }

  drawMinimap(player, nextCp) {
    const m = this.mm, g = m.ctx;
    g.drawImage(m.bg, 0, 0);
    const X = (x) => (x - m.x0) * m.k, Z = (z) => (z - m.z0) * m.k;
    if (nextCp) {
      g.strokeStyle = '#7ff3ff'; g.lineWidth = 3;
      g.beginPath(); g.arc(X(nextCp.x), Z(nextCp.z), 9, 0, 7); g.stroke();
    }
    for (const c of this.cars) {
      if (c === player) continue;
      g.fillStyle = css(c.color); g.strokeStyle = '#000'; g.lineWidth = 2;
      g.beginPath(); g.arc(X(c.x), Z(c.z), 8, 0, 7); g.fill(); g.stroke();
    }
    g.save();
    g.translate(X(player.x), Z(player.z));
    g.rotate(player.psi);
    g.fillStyle = css(player.color); g.strokeStyle = '#fff'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(15, 0); g.lineTo(-10, 9); g.lineTo(-5, 0); g.lineTo(-10, -9); g.closePath();
    g.fill(); g.stroke();
    g.restore();
  }

  // ------------------------------------------------------------ speedometer
  _speedo() {
    const cv = $('speedo');
    const S = 440;
    cv.width = cv.height = S;
    const bg = document.createElement('canvas');
    bg.width = bg.height = S;
    const g = bg.getContext('2d');
    const c = S / 2, R = 190;
    g.fillStyle = 'rgba(16,20,32,0.78)';
    g.beginPath(); g.arc(c, c, R + 22, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 3;
    g.beginPath(); g.arc(c, c, R + 21, 0, 7); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let v = 0; v <= 240; v += 10) {
      const a = this._ang(v), big = v % 40 === 0;
      g.strokeStyle = v >= 200 ? '#ff6b5e' : 'rgba(255,255,255,0.8)';
      g.lineWidth = big ? 5 : 2;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * (R - (big ? 24 : 12)), c + Math.sin(a) * (R - (big ? 24 : 12)));
      g.lineTo(c + Math.cos(a) * R, c + Math.sin(a) * R);
      g.stroke();
      if (big) {
        g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = '600 24px system-ui, sans-serif';
        g.fillText(String(v), c + Math.cos(a) * (R - 48), c + Math.sin(a) * (R - 48));
      }
    }
    this.sp = { cv, ctx: cv.getContext('2d'), bg, c, R };
  }

  _ang(v) { return Math.PI * 0.75 + (clamp(v, 0, 240) / 240) * Math.PI * 1.5; }

  drawSpeedo(kmh, gear, rpm) {
    const { ctx: g, bg, c, R } = this.sp;
    g.clearRect(0, 0, 440, 440);
    g.drawImage(bg, 0, 0);
    const a = this._ang(kmh);
    g.lineCap = 'round';
    g.strokeStyle = '#35c7e6'; g.lineWidth = 9;
    g.beginPath(); g.arc(c, c, R + 9, Math.PI * 0.75, a); g.stroke();
    g.strokeStyle = rpm > 0.93 ? '#ff6b5e' : '#ffd166'; g.lineWidth = 6;
    g.beginPath(); g.arc(c, c, 92, Math.PI * 0.75, Math.PI * 0.75 + clamp(rpm, 0, 1) * Math.PI * 1.5); g.stroke();
    g.strokeStyle = '#ff5a4d'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(c + Math.cos(a) * 100, c + Math.sin(a) * 100); g.lineTo(c + Math.cos(a) * (R - 8), c + Math.sin(a) * (R - 8)); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 84px system-ui, sans-serif';
    g.fillText(String(Math.round(kmh)), c, c - 4);
    g.font = '500 22px system-ui, sans-serif'; g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillText('km/h', c, c + 50);
    g.font = '700 44px system-ui, sans-serif'; g.fillStyle = '#ffd166';
    g.fillText(gear === 0 ? 'R' : String(gear), c, c + 128);
  }

  // ------------------------------------------------------------------ text
  show(on) { this.el.hud.classList.toggle('hidden', !on); }

  message(text, cls = '', dur = 1.6) {
    const m = this.el.msg;
    m.textContent = text;
    m.className = 'show ' + cls;
    this.msgTimer = dur;
  }

  warn(text) {
    const w = this.el.warn;
    if (w.textContent !== text) w.textContent = text;
    w.classList.toggle('show', !!text);
  }

  update(dt, s) {
    const e = this.el, p = s.player;
    if (this.msgTimer > 0) {
      this.msgTimer -= dt;
      if (this.msgTimer <= 0) e.msg.classList.remove('show');
    }
    const place = s.order.indexOf(p);
    e.pos.textContent = String(place + 1);
    e.posSuf.textContent = ORDINAL[place].slice(1);
    e.lap.textContent = `${Math.min(this.laps, Math.max(1, p.lapCount))} / ${this.laps}`;
    e.time.textContent = fmtTime(p.finished ? p.finishTime : s.raceTime);
    e.lapTime.textContent = fmtTime(p.finished ? p.lapTimes[p.lapTimes.length - 1] : Math.max(0, s.raceTime - p.lapStart));
    e.best.textContent = p.lapTimes.length ? fmtTime(Math.min(...p.lapTimes)) : '--:--.---';
    e.cp.textContent = `Checkpoint ${p.nextCp === 0 ? this.track.checkpoints.length : p.nextCp} / ${this.track.checkpoints.length}`;
    // leaderboard
    const lead = s.order[0];
    s.order.forEach((c, i) => {
      const r = this.rows[i];
      const gap = c.finished ? fmtTime(c.finishTime) : i === 0 ? 'leader' : `+${Math.max(0, lead.progress - c.progress).toFixed(0)} m`;
      const key = `${c.index}|${gap}`;
      if (r.key !== key) {
        r.key = key;
        r.p.textContent = String(i + 1);
        r.dot.style.background = css(c.color);
        r.n.textContent = c.name;
        r.g.textContent = gap;
        r.r.classList.toggle('me', c === p);
      }
    });
    const nm = this.track.nameAt(p.ti);
    if (nm !== this.lastStreet) {
      this.lastStreet = nm;
      e.street.textContent = nm.en || (nm.name ? '' : 'Unnamed street');
      e.streetNative.textContent = nm.name || '';
    }
    this.drawSpeedo(Math.abs(p.speed) * 3.6, p.gear, p.rpm);
    this.drawMinimap(p, s.nextCp);
  }

  showFinish(order, player, laps) {
    const e = this.el;
    const place = order.indexOf(player);
    e.finishTitle.textContent = place === 0 ? 'You won the Rawza Ring!' : `You finished ${ORDINAL[place]}`;
    this.updateFinish(order, player);
    e.finish.classList.remove('hidden');
  }

  updateFinish(order, player) {
    const rows = order.map((c, i) => {
      const best = c.lapTimes.length ? fmtTime(Math.min(...c.lapTimes)) : '--';
      const total = c.finished ? fmtTime(c.finishTime) : 'still racing…';
      const laps = c.lapTimes.map((t) => fmtTime(t)).join('  ·  ');
      return `<tr class="${c === player ? 'me' : ''}"><td>${ORDINAL[i]}</td><td><span class="dot" style="background:${css(c.color)}"></span>${c.name}</td><td>${total}</td><td>${best}</td><td class="laps">${laps}</td></tr>`;
    }).join('');
    const html = `<tr><th>Place</th><th>Driver</th><th>Race time</th><th>Best lap</th><th>Laps</th></tr>${rows}`;
    if (html !== this.lastResults) { this.lastResults = html; this.el.results.innerHTML = html; }
  }

  hideFinish() { this.el.finish.classList.add('hidden'); }
}
