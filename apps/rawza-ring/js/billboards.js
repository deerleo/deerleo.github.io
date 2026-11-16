/*
 * Roadside billboards. ADDED AFTER THE TEST by Future AI (Hashmatullah Zaher), 15 Nov 2026. NOT written by Claude Fable 5.2.
 * Big screens on poles beside the race loop, mostly at the turns, angled toward the drivers coming at them.
 * Video boards play short silent clips from the Dari video about this test; picture boards show the social accounts,
 * the YouTube channel and the free WhatsApp community. Click or tap a board to open its link.
 * Fable's game code is untouched: this file uses the handle the game already exposes (window.__game).
 */
import * as THREE from 'three';
import { ROAD_Y } from './world.js';

const YT = 'https://youtu.be/B9HkGEtEdtA';
const CHANNEL = 'https://www.youtube.com/@HashmatullahZaher-m8i';
const BOARDS = [
  { video: 'media/bb_presenter.mp4', poster: 'media/bb_presenter.jpg', link: YT + '?t=348' },
  { image: 'media/bb_social.jpg', link: CHANNEL },
  { video: 'media/bb_game.mp4', poster: 'media/bb_game.jpg', link: YT + '?t=389' },
  { image: 'media/bb_subscribe.jpg', link: CHANNEL + '?sub_confirmation=1' },
  { video: 'media/bb_website.mp4', poster: 'media/bb_website.jpg', link: YT + '?t=479' },
  { image: 'media/bb_whatsapp.jpg', link: 'https://chat.whatsapp.com/FxvV7hCQ6VX2Us5txFlH5N' },
  { video: 'media/bb_promo.mp4', poster: 'media/bb_promo.jpg', link: YT + '?t=720' },
  { image: 'media/bb_social.jpg', link: CHANNEL },
];
const W = 22, H = 12.375, LIFT = 5, SETBACK = 6;   // metres: screen size, height of its bottom edge, distance from the road edge
const PLAY_DIST = 320;                         // videos play only when the player is this close

function pickSpots(track, count) {
  const n = track.n, step = track.step;
  const minGap = Math.floor(track.length / count / step * 0.75);
  const used = [];
  const free = (i) => used.every((j) => Math.min(Math.abs(i - j), n - Math.abs(i - j)) >= minGap);
  // first board: on the start straight, ahead of the grid
  used.push(track.wrap(Math.round(190 / step)));
  // then the sharpest turns, spread round the lap
  const order = [...Array(n).keys()].sort((a, b) => track.curv[b] - track.curv[a]);
  for (const i of order) { if (used.length >= count) break; if (free(i)) used.push(i); }
  for (let i = 0; used.length < count && i < n; i += 7) if (free(i)) used.push(i);
  return used.sort((a, b) => a - b);
}

function place(track, i) {
  const n = track.n;
  // the board stands a little before the spot, so drivers see it as they approach the turn
  const look = Math.round(35 / track.step);
  const a = track.wrap(i - look), b = track.wrap(i + look);
  const turn = track.tx[a] * track.tz[b] - track.tz[a] * track.tx[b];        // >0: the road bends one way, <0 the other
  // (-tz, tx) points to the driver's LEFT; turn > 0 means the road bends left
  const side = Math.abs(turn) > 0.08 ? -Math.sign(turn) : -1;                // outside of the bend; right-hand side on straights
  const nx = -track.tz[i] * side, nz = track.tx[i] * side;                    // unit vector from the road toward the board
  const off = track.hw[i] + SETBACK;
  const x = track.cx[i] + nx * off, z = track.cz[i] + nz * off;
  // face back along the road toward oncoming cars, turned a little toward the road
  let fx = -track.tx[i] * 0.8 - nx * 0.6, fz = -track.tz[i] * 0.8 - nz * 0.6;
  const l = Math.hypot(fx, fz); fx /= l; fz /= l;
  return { x, z, yaw: Math.atan2(fx, fz), i, n };
}

function buildBoard(spec, pos, loader) {
  const g = new THREE.Group();
  g.position.set(pos.x, ROAD_Y, pos.z);
  g.rotation.y = pos.yaw;
  const dark = new THREE.MeshStandardMaterial({ color: 0x14161f, roughness: 0.6, metalness: 0.4 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, H + 0.8, 0.5), dark);
  frame.position.set(0, LIFT + H / 2, -0.3);
  g.add(frame);
  for (const px of [-W * 0.3, W * 0.3]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, LIFT + 0.5, 10), dark);
    pole.position.set(px, (LIFT + 0.5) / 2, -0.35);
    g.add(pole);
  }
  // picture boards show their image; video boards show the clip's still picture until the video is really playing
  const still = loader.load(spec.image || spec.poster);
  still.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: still, toneMapped: false });
  let video = null;
  if (spec.video) {
    video = document.createElement('video');
    Object.assign(video, { src: spec.video, muted: true, loop: true, playsInline: true, preload: 'metadata' });
    video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
    const vt = new THREE.VideoTexture(video);
    vt.colorSpace = THREE.SRGBColorSpace;
    video.addEventListener('playing', () => { mat.map = vt; mat.needsUpdate = true; });
  }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  screen.position.set(0, LIFT + H / 2, 0.0);
  screen.userData.link = spec.link;
  g.add(screen);
  // a thin glowing rim so the screens read as lit at sunset
  const rim = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.5, H + 0.5), new THREE.MeshBasicMaterial({ color: 0xffd166, toneMapped: false }));
  rim.position.set(0, LIFT + H / 2, -0.02);
  g.add(rim);
  return { group: g, screen, video, x: pos.x, z: pos.z };
}

function waitForGame() {
  return new Promise((resolve) => {
    const t = setInterval(() => { const g = window.__game; if (g && g.scene && g.track && g.player) { clearInterval(t); resolve(g); } }, 300);
  });
}

async function main() {
  const game = await waitForGame();
  const { scene, track, camera, renderer } = game;
  const loader = new THREE.TextureLoader();
  const spots = pickSpots(track, BOARDS.length);
  const boards = spots.map((i, k) => buildBoard(BOARDS[k], place(track, i), loader));
  for (const b of boards) scene.add(b.group);
  window.__billboards = boards.map((b, k) => ({ x: Math.round(b.x), z: Math.round(b.z), link: BOARDS[k].link, video: !!b.video }));

  // play only the videos near the player (phones cannot decode many at once)
  setInterval(() => {
    const p = game.player;
    const paused = game.G && game.G.paused;
    for (const b of boards) {
      if (!b.video) continue;
      const near = !paused && Math.hypot(p.x - b.x, p.z - b.z) < PLAY_DIST;
      if (near && b.video.paused) { b.video.preload = 'auto'; b.video.play().catch(() => {}); }
      else if (!near && !b.video.paused) b.video.pause();
    }
  }, 500);

  // click or tap a board to open its link
  const ray = new THREE.Raycaster();
  const screens = boards.map((b) => b.screen);
  function openAt(ndcX, ndcY) {
    ray.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const hit = ray.intersectObjects(screens, false)[0];
    if (hit && hit.distance < 600 && hit.object.userData.link) { window.open(hit.object.userData.link, '_blank', 'noopener'); return true; }
    return false;
  }
  // x, y are screen (client) coordinates; works when the touch layer has turned the page sideways too
  window.__billboardTap = (x, y) => {
    const r = renderer.domElement.getBoundingClientRect();
    if (document.body.classList.contains('rot')) {
      const u = y - r.top, v = r.right - x;          // the page is turned 90 degrees on an upright phone
      return openAt((u / r.height) * 2 - 1, -((v / r.width) * 2 - 1));
    }
    return openAt(((x - r.left) / r.width) * 2 - 1, -(((y - r.top) / r.height) * 2 - 1));
  };
  renderer.domElement.addEventListener('click', (e) => window.__billboardTap(e.clientX, e.clientY));
}

main().catch((e) => console.warn('billboards off:', e && e.message));
