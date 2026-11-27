import { ready, holdable, track } from './shell.js';
import { recorder } from './record.js';
import { createRenderer } from './js/render.js';
import { Sound } from './js/audio.js';
import { Show } from './js/show.js';

// Tennis. It starts at once, as plain as it looks, and loads everything else behind your back: the break waits
// for the first of it, and each later part for its own.

const $ = id => document.getElementById(id);
const canvas = $('view');
const query = new URLSearchParams(location.search);
const CHANNELS = ['mecha', 'kungfu', 'cats', 'chrome', 'rave', 'shrine', 'fish'];

async function start() {
    const renderer = createRenderer(canvas);

    function fit() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (w === canvas.width && h === canvas.height) return;
        canvas.width = w;
        canvas.height = h;
        renderer.resize(w, h);
        show?.resize(w / h);
    }

    // ------------------------------------------------------------ sound

    // The first touch, click or key anywhere starts it. ?mute starts it muted, for a test tab.
    let sound = null;
    try {
        sound = new Sound({ muted: query.has('mute') });
        const unlock = () => sound.unlock();
        for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown']) addEventListener(ev, unlock, { capture: true });

        const mute = $('mute'), vol = $('volume').querySelector('input');
        const paint = () => {
            mute.querySelector('use').setAttribute('href', sound.muted ? '#i-mute' : '#i-sound');
            mute.classList.toggle('on', sound.muted);
        };
        paint();
        // A tap mutes; holding the button (or a right-click) opens the volume, remembered in this browser.
        try { const v = localStorage.getItem('tennis-volume'); if (v !== null) sound.volume = +v; } catch {}
        vol.value = sound.volume;
        vol.addEventListener('input', () => {
            sound.volume = +vol.value;
            if (sound.muted && +vol.value > 0) { sound.muted = false; paint(); }
            try { localStorage.setItem('tennis-volume', vol.value); } catch {}
        });
        holdable(mute, $('volume'), () => { sound.muted = !sound.muted; paint(); });
    } catch (err) {
        console.error(err);
        $('mute').hidden = true;
    }
    // Nothing plays on in a tab that's been left.
    document.addEventListener('visibilitychange', () => {
        if (!sound || !show.started) return;
        if (document.hidden) sound.ctx.suspend().catch(() => {});
        else sound.ctx.resume().catch(() => {});
    });
    const rec = recorder(canvas, { sound: async () => { sound?.unlock(); return sound ? { ctx: sound.ctx, node: sound.out } : null; } });

    // ------------------------------------------------------------ everything else, as it arrives

    const media = { ready: false, channels: [] };

    const picture = async name => {
        const img = new Image();
        img.src = `media/img/${name}.jpg`;
        await img.decode();
        renderer.setTexture(name, img, name === 'panels' ? { wrap: renderer.gl.REPEAT } : {});
    };

    // The fist's shape: two counts, the points as 16-bit numbers, then the triangles. Its normals are made here.
    async function fist() {
        const data = await (await fetch('media/fist.bin')).arrayBuffer();
        const [points, corners] = new Uint32Array(data, 0, 2);
        const packed = new Int16Array(data, 8, points * 3), index = new Uint16Array(data, 8 + Math.ceil((points * 3) / 2) * 4, corners);
        const position = Float32Array.from(packed, v => v / 32767), normal = new Float32Array(points * 3);
        for (let i = 0; i < corners; i += 3) {
            const [a, b, c] = [index[i] * 3, index[i + 1] * 3, index[i + 2] * 3];
            const ux = position[b] - position[a], uy = position[b + 1] - position[a + 1], uz = position[b + 2] - position[a + 2];
            const vx = position[c] - position[a], vy = position[c + 1] - position[a + 1], vz = position[c + 2] - position[a + 2];
            const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            for (const k of [a, b, c]) { normal[k] += nx; normal[k + 1] += ny; normal[k + 2] += nz; }
        }
        for (let i = 0; i < normal.length; i += 3) {
            const l = Math.hypot(normal[i], normal[i + 1], normal[i + 2]) || 1;
            normal[i] /= l; normal[i + 1] /= l; normal[i + 2] /= l;
        }
        renderer.setFist({ position, normal, index });
    }

    // A television channel: the video, and its soundtrack out of the same file.
    async function channel(name) {
        const data = await (await fetch(`media/video/${name}.mp4`)).arrayBuffer();
        const el = document.createElement('video');
        el.muted = true;
        el.loop = true;
        el.playsInline = true;
        el.src = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
        await new Promise((yes, no) => {
            el.addEventListener('loadeddata', yes, { once: true });
            el.addEventListener('error', no, { once: true });
            el.load();
        });
        media.channels.push({ name, el, audio: sound ? await sound.track(data) : null });
    }

    const quiet = p => p.catch(err => console.error(err));
    (async () => {
        await Promise.all([quiet(Promise.all(['eyes', 'fist'].map(picture))), sound ? quiet(sound.load()) : null]);
        media.ready = true;
        await Promise.all([quiet(picture('panels')), quiet(fist())]);
        for (const name of CHANNELS) await quiet(channel(name));
    })();

    // ------------------------------------------------------------ the show

    const show = new Show({ sound, media, track });
    window.tennis = show;
    // For testing from the console: run it on by hand, with a bat that never misses if asked.
    show.step = (n = 1, dt = 1 / 60, auto = false) => {
        for (let i = 0; i < n; i++) {
            if (auto) {
                const c = show.court, b = c.balls.filter(b => b.vx < 0).sort((a, b) => a.x - b.x)[0];
                if (b) c.move(b.y, b.z);
            }
            renderer.draw(show.frame(dt, renderer));
        }
        return show.stage;
    };
    canvas.width = canvas.height = 0;
    fit();
    addEventListener('resize', fit);

    // The mouse puts the bat where it points. A finger drags it from wherever it is, so the hand isn't over it.
    const spot = { x: 0, y: 0 }, fingers = new Map();
    const place = e => {
        const r = canvas.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2];
    };
    canvas.addEventListener('pointermove', e => {
        const [x, y] = place(e);
        if (e.pointerType === 'mouse') { spot.x = x; spot.y = y; } else {
            const last = fingers.get(e.pointerId);
            if (!last) return;
            spot.x = Math.max(-1, Math.min(1, spot.x + (x - last[0]) * 1.5));
            spot.y = Math.max(-1, Math.min(1, spot.y + (y - last[1]) * 1.5));
            fingers.set(e.pointerId, [x, y]);
        }
        show.pointer = spot;
    });
    canvas.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse') fingers.set(e.pointerId, place(e));
        show.start();
    });
    for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, e => fingers.delete(e.pointerId));

    const KEYS = { ArrowUp: [0, 1], KeyW: [0, 1], ArrowDown: [0, -1], KeyS: [0, -1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    const down = new Set();
    const steer = () => {
        show.keys.x = show.keys.y = 0;
        for (const code of down) { show.keys.x += KEYS[code][0]; show.keys.y += KEYS[code][1]; }
    };
    addEventListener('keydown', e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (KEYS[e.code]) { down.add(e.code); steer(); e.preventDefault(); }
        if (KEYS[e.code] || e.code === 'Space' || e.code === 'Enter') show.start();
    });
    addEventListener('keyup', e => { if (down.delete(e.code)) steer(); });
    addEventListener('blur', () => { down.clear(); steer(); });

    $('again').addEventListener('click', () => {
        show.court.score = [0, 0];
        show.reset();
    });

    if (query.has('at')) {
        // Straight to a part, once what it needs is in.
        const wait = setInterval(() => {
            if (!media.ready || (query.get('at') === 'zap' && media.channels.length < 2)) return;
            clearInterval(wait);
            show.jump(query.get('at'));
        }, 100);
    }

    // ------------------------------------------------------------ the loop

    await renderer.built();
    let last = 0, frames = 0;
    function frame(now) {
        requestAnimationFrame(frame);
        const dt = last ? (now - last) / 1000 : 0;
        last = now;
        fit();
        renderer.draw(show.frame(dt, renderer));
        // A frame after the first draw: the driver can still stall on that one.
        if (++frames === 2) ready();
    }
    requestAnimationFrame(frame);
    return rec;
}

start().catch(e => {
    console.error(e);
    $('sorry').hidden = false;
    ready();
});
