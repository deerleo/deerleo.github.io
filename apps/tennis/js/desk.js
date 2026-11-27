// The desktop: a mid-nineties PC, painted with the 2D canvas at the size screens were then and blown up in whole
// pixels. show.js says where the bats and the ball are; here they're two windows and a compact disc. Nothing is
// repainted behind them as they move, so they smear, the way a window did when the machine had hung.

const GREY = '#c0c0c0', SHADE = '#808080', LIGHT = '#dfdfdf', NAVY = '#000080', TEAL = '#008080';
const FONT = '11px Tahoma, "MS Sans Serif", Geneva, Arial, sans-serif', BOLD = `bold ${FONT}`;
const MONO = '13px Menlo, Consolas, "Lucida Console", "DejaVu Sans Mono", monospace', SMALL = '10px Menlo, Consolas, "Lucida Console", "DejaVu Sans Mono", monospace';

// The seven strokes of a counter's digit: top, top left, top right, middle, bottom left, bottom right, bottom.
const STROKES = ['1110111', '0010010', '1011101', '1011011', '0111010', '1101011', '1101111', '1010010', '1111111', '1111011'];

const sheet = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d', { willReadFrequently: true })];
};

// A picture worked out a pixel at a time, so its edges are hard. `at(x, y)` gives a colour or nothing.
function pixels(w, h, at) {
    const [c, g] = sheet(w, h), d = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const p = at(x, y);
            if (p) d.data.set([p[0], p[1], p[2], 255], (y * w + x) * 4);
        }
    }
    g.putImageData(d, 0, 0);
    return c;
}

const rainbow = h => [0, 0.33, 0.67].map(o => Math.round(255 * (0.5 + 0.5 * Math.cos(6.2832 * (h + o)))));

export function createDesk() {
    const [canvas, g] = sheet(4, 4);
    const [smear, sg] = sheet(4, 4);
    const words = new Map(), discs = new Map(), bits = {};
    let wiped = -1, W = 0, H = 0;

    // Text as it was then: no soft edges. Drawn once, each pixel cut to on or off, and kept.
    function text(g, str, x, y, colour = '#000', font = FONT) {
        const key = font + colour + str;
        let c = words.get(key);
        if (!c) {
            const [m, k] = sheet(4, 4);
            k.font = font;
            m.width = Math.ceil(k.measureText(str).width) + 2;
            m.height = 18;
            k.font = font;
            k.fillStyle = colour;
            k.fillText(str, 1, 13);
            const d = k.getImageData(0, 0, m.width, m.height);
            for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 105 ? 255 : 0;
            k.putImageData(d, 0, 0);
            if (words.size > 300) words.clear();
            words.set(key, (c = m));
        }
        g.drawImage(c, x - 1, y - 13);
        return c.width - 2;
    }

    // A raised or sunken box, with the two-pixel edge everything had.
    function box(g, x, y, w, h, style = 'up', fill = GREY) {
        const [a, b, c, d] = style === 'up' ? [LIGHT, '#000', '#fff', SHADE] : style === 'button' ? ['#fff', '#000', LIGHT, SHADE] : [SHADE, '#fff', '#000', LIGHT];
        g.fillStyle = fill; g.fillRect(x, y, w, h);
        g.fillStyle = a; g.fillRect(x, y, w - 1, 1); g.fillRect(x, y, 1, h - 1);
        g.fillStyle = b; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
        g.fillStyle = c; g.fillRect(x + 1, y + 1, w - 3, 1); g.fillRect(x + 1, y + 1, 1, h - 3);
        g.fillStyle = d; g.fillRect(x + 1, y + h - 2, w - 2, 1); g.fillRect(x + w - 2, y + 1, 1, h - 2);
    }

    // A window: its frame, title bar and close button. Gives back the room inside.
    function win(g, x, y, w, h, title, active = true) {
        box(g, x, y, w, h);
        g.fillStyle = active ? NAVY : SHADE;
        g.fillRect(x + 3, y + 3, w - 6, 18);
        g.save();
        g.beginPath();
        g.rect(x + 3, y + 3, w - 26, 18);
        g.clip();
        text(g, title, x + 6, y + 16, active ? '#fff' : GREY, BOLD);
        g.restore();
        box(g, x + w - 21, y + 5, 16, 14, 'button');
        g.fillStyle = '#000';
        for (let i = 0; i < 7; i++) {
            g.fillRect(x + w - 17 + i, y + 8 + i, 2, 1);
            g.fillRect(x + w - 11 - i, y + 8 + i, 2, 1);
        }
        return [x + 4, y + 23, w - 8, h - 27];
    }

    // The ball: a compact disc, its rainbow turning.
    function disc(r, turn) {
        const step = ((Math.round((turn / (Math.PI * 2)) * 24) % 24) + 24) % 24, key = r * 100 + step;
        if (!discs.has(key)) {
            const a0 = (step / 24) * Math.PI * 2;
            discs.set(key, pixels(2 * r + 1, 2 * r + 1, (x, y) => {
                const dx = x - r, dy = y - r, d = Math.hypot(dx, dy);
                if (d > r + 0.4 || d < r * 0.13) return null;
                if (d > r - 0.7 || d < r * 0.13 + 1) return [0, 0, 0];
                if (d < r * 0.34) return d > r * 0.34 - 1 ? [128, 128, 128] : [226, 226, 236];
                const a = Math.atan2(dy, dx) + a0, shine = Math.cos(a * 2);
                if (shine > 0.5) return rainbow(d / r * 1.3 + a0 * 0.3);
                const v = Math.round(196 + 44 * Math.cos(a * 2 + 2.4));
                return [v, v, Math.min(255, v + 10)];
            }));
        }
        return discs.get(key);
    }

    // The face between the counters: fine, surprised when the ball's hit, dark glasses when you score, and
    // crosses for eyes when they do.
    function face(mood) {
        return (bits[mood] ??= (() => {
            const c = pixels(17, 17, (x, y) => {
                const d = Math.hypot(x - 8, y - 8);
                return d > 8.4 ? null : d > 7.4 ? [0, 0, 0] : [255, 255, 0];
            });
            const k = c.getContext('2d'), dot = (x, y, w = 1, h = 1) => k.fillRect(x, y, w, h);
            k.fillStyle = '#000';
            if (mood === 'dead') {
                for (const x of [4, 10]) for (let i = 0; i < 3; i++) { dot(x + i, 5 + i); dot(x + 2 - i, 5 + i); }
                dot(5, 12); dot(6, 11, 5); dot(11, 12);
            } else if (mood === 'cool') {
                dot(3, 6, 11, 1); dot(4, 7, 4, 2); dot(9, 7, 4, 2); dot(2, 7); dot(14, 7);
                dot(5, 11); dot(6, 12, 5); dot(11, 11);
            } else {
                dot(5, 5, 2, 2); dot(10, 5, 2, 2);
                if (mood === 'oh') { dot(7, 10, 3); dot(6, 11, 1, 2); dot(10, 11, 1, 2); dot(7, 13, 3); }
                else { dot(4, 10); dot(5, 11); dot(6, 12, 5); dot(11, 11); dot(12, 10); }
            }
            return c;
        })());
    }

    // A red counter, three digits, as on the game that came with it.
    function counter(g, x, y, value) {
        box(g, x, y, 41, 25, 'sunk', '#000');
        [...String(Math.min(999, value)).padStart(3, '0')].forEach((ch, n) => {
            const on = STROKES[+ch], ox = x + 2 + n * 13, oy = y + 2;
            const bar = (i, bx, by, w, h) => { g.fillStyle = on[i] === '1' ? '#f00' : '#500'; g.fillRect(ox + bx, oy + by, w, h); };
            bar(0, 2, 0, 7, 2); bar(1, 0, 2, 2, 8); bar(2, 9, 2, 2, 8); bar(3, 2, 9, 7, 2); bar(4, 0, 11, 2, 8); bar(5, 9, 11, 2, 8); bar(6, 2, 19, 7, 2);
        });
    }

    // What sits on the desktop. Each is a few boxes: nobody looks at them twice.
    const ICONS = [
        ['My Bat', k => { box(k, 5, 3, 22, 17); k.fillStyle = TEAL; k.fillRect(8, 6, 16, 11); box(k, 3, 22, 26, 6); k.fillStyle = '#0f0'; k.fillRect(23, 24, 2, 2); }],
        ['The Net', k => {
            for (const [x, y] of [[2, 3], [15, 13]]) { box(k, x, y, 15, 12); k.fillStyle = NAVY; k.fillRect(x + 3, y + 3, 9, 6); }
            k.fillStyle = '#000'; k.fillRect(9, 15, 1, 8); k.fillRect(9, 22, 7, 1);
        }],
        ['Recycle Bin', k => {
            box(k, 8, 9, 16, 20); k.fillStyle = SHADE;
            for (const x of [12, 15, 18]) k.fillRect(x, 13, 1, 12);
            box(k, 6, 5, 20, 4); k.fillStyle = '#fff'; k.fillRect(13, 1, 8, 5); k.fillStyle = '#000'; k.fillRect(13, 1, 8, 1); k.fillRect(13, 1, 1, 5); k.fillRect(20, 1, 1, 5);
        }],
        ['Balls', k => {
            k.fillStyle = '#000'; k.fillRect(3, 7, 26, 20); k.fillRect(4, 4, 11, 4);
            k.fillStyle = '#ffd84a'; k.fillRect(4, 8, 24, 18); k.fillRect(5, 5, 9, 3);
            k.fillStyle = '#fff5a8'; k.fillRect(4, 8, 24, 1); k.fillRect(4, 8, 1, 18);
        }]
    ];
    const icon = n => (bits[`icon${n}`] ??= (() => { const [c, k] = sheet(32, 32); ICONS[n][1](k); return c; })());

    const stop = () => (bits.stop ??= pixels(32, 32, (x, y) => {
        const d = Math.hypot(x - 15.5, y - 15.5);
        if (d > 15.5) return null;
        if (d > 14.3) return [0, 0, 0];
        const u = x - y, v = x + y - 31;
        return (Math.abs(u) < 3 || Math.abs(v) < 3) && Math.abs(u) < 17 && Math.abs(v) < 17 && d < 10 ? [255, 255, 255] : [255, 0, 0];
    }));

    // A bat. Yours is the window in front, with something half written in it; theirs is a DOS box.
    function bat(g, right, y, h, mine) {
        const w = 54, x = mine ? right - w : right;
        const [cx, cy, cw, ch] = win(g, x, y, w, h, mine ? 'Bat' : 'DOS', mine);
        if (ch < 8) return;
        box(g, cx, cy, cw, ch, 'sunk', mine ? '#fff' : '#000');
        if (mine) {
            g.fillStyle = '#000';
            for (let i = 0; i * 6 + 9 < ch; i++) g.fillRect(cx + 4, cy + 5 + i * 6, [26, 18, 28, 12, 22, 27, 9][i % 7], 1);
        } else text(g, 'C:\\>', cx + 3, cy + 13, GREY, SMALL);
    }

    function dialog(g, d, n) {
        const w = 232, h = 104, x = Math.round(Math.min(W - w - 4, Math.max(4, W * d.x - w / 2))), y = Math.round(Math.min(H - h - 34, Math.max(48, H * d.y - h / 2)));
        win(g, x, y, w, h, 'Tennis', n);
        g.drawImage(stop(), x + 14, y + 32);
        d.lines.forEach((line, i) => text(g, line, x + 58, y + 44 + i * 14 - (d.lines.length - 1) * 7 + 7));
        box(g, x + w / 2 - 36, y + h - 32, 72, 23, 'button');
        g.fillStyle = '#000';
        g.fillRect(x + w / 2 - 37, y + h - 33, 74, 1); g.fillRect(x + w / 2 - 37, y + h - 9, 74, 1);
        g.fillRect(x + w / 2 - 37, y + h - 33, 1, 25); g.fillRect(x + w / 2 + 36, y + h - 33, 1, 25);
        text(g, 'OK', x + w / 2 - 8, y + h - 16);
    }

    function taskbar(g, d) {
        const y = H - 28;
        g.fillStyle = GREY; g.fillRect(0, y, W, 28);
        g.fillStyle = '#fff'; g.fillRect(0, y + 1, W, 1);
        box(g, 2, y + 4, 56, 22, 'button');
        g.fillStyle = '#000'; g.fillRect(7, y + 8, 14, 14);
        g.fillStyle = '#fffc00'; g.fillRect(8, y + 9, 12, 12);
        g.fillStyle = '#000'; g.fillRect(10, y + 12, 8, 2); g.fillRect(10, y + 15, 8, 4);
        text(g, 'Start', 25, y + 19, '#000', BOLD);
        if (W > 300) {
            box(g, 64, y + 4, Math.min(140, W - 150), 22, 'sunk', '#e4e4e4');
            text(g, 'Tennis', 70, y + 19, '#000', BOLD);
        }
        box(g, W - 66, y + 4, 64, 22, 'sunk');
        text(g, d.clock, W - 58, y + 19);
    }

    // The blue screen everybody knew.
    function blue(g) {
        g.fillStyle = '#0000aa';
        g.fillRect(0, 0, W, H);
        const font = W < 400 ? SMALL : MONO, wide = W < 400 ? 6 : 7.8, lines = [
            ['A fatal exception 0E has occurred at', '0028:C0FFEE15 in VXD BAT(01) + 00001972.', 'The current rally will be terminated.'],
            ['*  Press any key to return the ball.', '*  Press CTRL+ALT+DEL to lose every', '   ball you have not saved.']
        ];
        const left = Math.max(4, Math.round(W / 2 - wide * 21)), top = Math.round(H * 0.3);
        g.fillStyle = '#aaaaaa';
        g.fillRect(Math.round(W / 2 - wide * 4.5), top - 12, Math.round(wide * 9), 16);
        text(g, 'Tennis', Math.round(W / 2 - wide * 3), top, '#0000aa', font);
        let y = top + 34;
        for (const para of lines) {
            for (const line of para) { text(g, line, left, y, '#fff', font); y += 16; }
            y += 16;
        }
        text(g, 'Press any key to continue _', Math.round(W / 2 - wide * 13.5), y + 4, '#fff', font);
    }

    // d: what show.js wrote for the frame. w and h: the window, in its own pixels.
    function paint(d, w, h) {
        const scale = Math.max(1, Math.round(h / 480));
        const cw = Math.ceil(w / scale), ch = Math.ceil(h / scale);
        if (cw !== W || ch !== H) {
            W = canvas.width = smear.width = cw;
            H = canvas.height = smear.height = ch;
            wiped = -1;
        }
        if (d.blue) { blue(g); return canvas; }

        const unit = (d.fill * H) / 3, px = x => Math.round(W / 2 + x * unit), py = y => Math.round(H / 2 - y * unit);

        g.fillStyle = TEAL;
        g.fillRect(0, 0, W, H);
        const column = Math.max(8, px(d.bat.x) + 14);
        ICONS.forEach(([name], n) => {
            const y = 50 + n * 62;
            if (y + 50 > H - 28) return;
            g.drawImage(icon(n), column + 16, y);
            g.font = FONT;
            text(g, name, Math.round(column + 32 - g.measureText(name).width / 2), y + 45, '#fff');
        });
        d.dialogs.forEach((it, n) => dialog(g, it, n === d.dialogs.length - 1));

        // The net: a dotted line, on the march.
        const crawl = Math.floor(d.time * 12) % 8;
        for (let y = 40 - crawl; y < H - 30; y += 8) { g.fillStyle = '#fff'; g.fillRect(W / 2 - 1 | 0, y, 2, 4); }

        // The bats and the ball go onto a sheet nothing wipes until the next hit.
        if (d.wipe !== wiped) { sg.clearRect(0, 0, W, H); wiped = d.wipe; }
        for (const [b, mine] of [[d.cpu, false], [d.bat, true]]) {
            if (b.gone) continue;
            const hh = Math.round(b.hh * unit);
            bat(sg, px(b.x), py(b.y) - hh, hh * 2, mine);
        }
        const r = Math.max(6, Math.round(d.r * unit));
        for (const b of d.balls) sg.drawImage(disc(r, d.time * 7), px(b[0]) - r, py(b[1]) - r);
        g.drawImage(smear, 0, 0);

        // The score: two counters and a face.
        const sx = Math.round(W / 2) - 62;
        box(g, sx, 5, 124, 37);
        counter(g, sx + 6, 11, d.score[0]);
        counter(g, sx + 77, 11, d.score[1]);
        box(g, sx + 49, 10, 26, 26, 'button');
        g.drawImage(face(d.face), sx + 54, 15);

        taskbar(g, d);
        return canvas;
    }

    return { paint };
}
