/*
 * Live player counter. ADDED AFTER THE TEST by Future AI (Hashmatullah Zaher), 15 Nov 2026. NOT written by Claude Fable 5.2.
 * Real numbers only: every open copy of the game counts as one player online, and Firebase removes it by itself
 * when the game is closed or the connection drops. Nothing personal is stored: a random id and a time.
 * Also counts real visits and races (total and per Kabul day) for the stats page (stats.html).
 */
import { FIREBASE_CONFIG } from './live-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
export const kabulDay = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

async function main() {
  if (!FIREBASE_CONFIG || !document.getElementById('startBtn')) return;   // only the game page counts (not stats.html)
  const [{ initializeApp }, { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, runTransaction, connectDatabaseEmulator }] =
    await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-database.js')]);
  const db = getDatabase(initializeApp(FIREBASE_CONFIG));
  if (FIREBASE_CONFIG.emulator) { const [h, p] = FIREBASE_CONFIG.emulator.split(':'); connectDatabaseEmulator(db, h, +p); }

  // ---- badge on the start and finish cards
  const css = document.createElement('style');
  css.textContent = `.liveBadge { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 5px 14px; border-radius: 999px;
    background: rgba(46,158,91,.18); border: 1px solid rgba(125,255,155,.45); color: #c9ffd7; font-weight: 700; font-size: 14px; }
    .liveBadge i { width: 9px; height: 9px; border-radius: 50%; background: #3ddc84; box-shadow: 0 0 0 0 rgba(61,220,132,.7); animation: livePulse 1.6s infinite; }
    @keyframes livePulse { 70% { box-shadow: 0 0 0 9px rgba(61,220,132,0); } 100% { box-shadow: 0 0 0 0 rgba(61,220,132,0); } }`;
  document.head.appendChild(css);
  const badges = [];
  for (const sel of ['#startBtn', '#restartBtn']) {
    const btn = document.querySelector(sel);
    if (!btn) continue;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<span class="liveBadge" hidden><i></i><span></span></span>';
    btn.after(wrap);
    badges.push(wrap.firstChild);
  }
  const show = (n) => {
    const text = n === 1 ? '1 player online now' : `${n.toLocaleString('en')} players online now`;
    for (const b of badges) { b.hidden = false; b.lastChild.textContent = text; }
  };

  // ---- presence: this open game = one player online; removed by the server when the game closes
  const id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).replace(/-/g, '').slice(0, 20);
  const me = ref(db, 'online/' + id);
  onValue(ref(db, '.info/connected'), (s) => {
    if (s.val() !== true) return;
    onDisconnect(me).remove().then(() => set(me, { t: serverTimestamp() })).catch(() => {});
  });
  // the peak can only rise one step per write (the database rules allow nothing else), so it climbs to the real number
  let climbing = false;
  async function raisePeak(n) {
    if (climbing) return;
    climbing = true;
    try {
      for (let i = 0; i < 50; i++) {
        const r = await runTransaction(ref(db, 'stats/peak'), (cur) => (!cur || cur.n < n ? { n: (cur ? cur.n : 0) + 1, t: Date.now() } : undefined));
        if (!r.committed) break;
      }
    } catch (_) {} finally { climbing = false; }
  }
  onValue(ref(db, 'online'), (s) => {
    const n = s.size;
    show(n);
    raisePeak(n);
  });

  // ---- real visits and races
  const bump = (path) => runTransaction(ref(db, path), (v) => (v || 0) + 1).catch(() => {});
  const count = (what) => { bump('stats/' + what); bump('daily/' + kabulDay() + '/' + what); };
  count('visits');
  for (const sel of ['#startBtn', '#restartBtn']) {
    const b = document.querySelector(sel);
    if (b) b.addEventListener('click', () => count('races'));
  }
  const vis = (id) => { const el = document.getElementById(id); return !!el && !el.classList.contains('hidden'); };
  window.addEventListener('keydown', (e) => {   // Enter also starts a race in the game
    if (e.code === 'Enter' && !e.repeat && (vis('menu') || vis('finish'))) count('races');
  });
}

main().catch((e) => console.warn('live counter off:', e && e.message));
