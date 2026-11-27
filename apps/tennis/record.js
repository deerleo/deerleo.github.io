// Recording: videos of the page's canvas and its sound, for posting. Open the page with ?record and a red button
// sits top-right. Click it and it records for 30 seconds (?record=45 for 45), counting down under the button as it
// pulses, then saves the file and is ready for another. Click it while it's recording to throw that one away. The
// page carries on as normal throughout, and never sees the button's clicks. Add &size=1920x1080 to render the
// canvas at that size whatever the window, shrunk to fit on screen. The button is page, not canvas, so like the
// bar and badge it's never in the video.
//
// So the first can catch the very start, the page pauses on its first frame, once the shell's preloader is done,
// until the first click: every requestAnimationFrame waits, then runs as if no time had passed. Later ones record
// from wherever it's got to.
//
// A project wires it in main.js, before its animation loop starts:
//   recorder(canvas, { sound: async () => ({ ctx, node }) });   // does nothing without ?record
// `sound` starts the project's sound if it can and gives its audio context and the last node before the
// speakers, or null for silence. It's asked at every recording. rec.waiting is true while it's paused at the
// start, and rec.recording while it records. Mouse positions are off with &size.
//
// Chrome and Safari save MP4, H.264 and AAC, which X takes as it is. Firefox saves WebM: convert it with
//   ffmpeg -i in.webm -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out.mp4

const TYPES = [
    'video/mp4;codecs=avc1.640028,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
];

export function recorder(canvas, { sound = null } = {}) {
    const query = new URLSearchParams(location.search);
    if (!query.has('record')) return null;
    const rec = { seconds: Number(query.get('record')) || 30, waiting: true, recording: false, take: null, starting: false };
    const size = query.get('size')?.match(/^(\d+)x(\d+)$/);
    if (size) fit(canvas, +size[1], +size[2]);
    rec.button = button(rec.seconds);
    pause(rec);

    const press = async () => {
        if (rec.take) return rec.take.cancel();
        if (rec.starting) return;
        rec.starting = true;
        let audio = null;
        try {
            audio = await sound?.();
        } catch (err) {
            console.error(err);
        }
        rec.starting = false;
        record(canvas, rec, audio);
    };

    // The button's clicks are caught on the way down and kept: the page never sees them.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick']) {
        addEventListener(type, e => {
            if (!e.target.closest?.('#rec')) return;
            e.stopImmediatePropagation();
            if (type === 'click') press();
        }, true);
    }
    return rec;
}

// Paused once the page is up: the shell's preloader done, so its first frame is on screen. Every animation frame
// asked for after that waits, and when the first recording starts they all run, with their clocks set back by
// however long they waited, so nothing jumps.
function pause(rec) {
    const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
    const held = new Map(), up = () => document.getElementById('loader')?.classList.contains('done') ?? true;
    let id = -1, since = 0, lost = 0;
    window.requestAnimationFrame = cb => {
        if (!rec.waiting || !up()) return raf(t => cb(t - lost));
        if (!held.size) since = performance.now();
        held.set(id, cb);
        return id--;
    };
    window.cancelAnimationFrame = n => (held.has(n) ? held.delete(n) : cancel(n));
    rec.play = () => {
        rec.waiting = false;
        if (held.size) lost += performance.now() - since;
        const waiting = [...held.values()];
        held.clear();
        for (const cb of waiting) raf(t => cb(t - lost));
    };
}

// The red button, and the seconds under it.
function button(seconds) {
    const style = document.createElement('style');
    style.textContent = `
#rec { position: fixed; top: max(6px, env(safe-area-inset-top)); right: max(6px, env(safe-area-inset-right)); z-index: 50;
    display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 10px; border: 0; background: none;
    cursor: pointer; font: 600 15px/1 ui-monospace, Menlo, monospace; color: #fff; text-shadow: 0 1px 3px #000; }
#rec i { width: 24px; height: 24px; border-radius: 50%; background: #ff2b2b; box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.45), 0 0 6px #000; transition: transform 0.15s; }
#rec:hover i { transform: scale(1.15); }
#rec.on i { animation: rec-pulse 1s ease-in-out infinite; }
@keyframes rec-pulse { 50% { opacity: 0.35; } }`;
    const el = document.createElement('button');
    el.id = 'rec';
    el.type = 'button';
    el.title = 'Record';
    el.setAttribute('aria-label', 'Record');
    el.innerHTML = '<i></i><span></span>';
    el.lastChild.textContent = seconds;
    document.head.append(style);
    document.body.append(el);
    return el;
}

// The canvas drawn at w by h pixels, scaled down on screen to fit the window.
function fit(canvas, w, h) {
    const place = () => {
        const s = Math.min(innerWidth / w, innerHeight / h, 1);
        Object.assign(canvas.style, { width: `${w}px`, height: `${h}px`, right: 'auto', bottom: 'auto', transformOrigin: '0 0', transform: `scale(${s})` });
    };
    place();
    addEventListener('resize', place);
}

// One recording: saved when its time is up, or thrown away if cancelled. Either way the button's ready again.
function record(canvas, rec, audio) {
    const stream = canvas.captureStream(60);
    let tap = null, kept = true;
    if (audio?.ctx && audio.node) {
        tap = audio.ctx.createMediaStreamDestination();
        audio.node.connect(tap);
        for (const track of tap.stream.getAudioTracks()) stream.addTrack(track);
    }
    const type = TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
    const media = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 20e6, audioBitsPerSecond: 192e3 });
    const chunks = [], left = rec.button.lastChild, from = performance.now();
    const stop = () => media.state !== 'inactive' && media.stop();
    const tick = setInterval(() => (left.textContent = Math.max(0, Math.ceil(rec.seconds - (performance.now() - from) / 1000))), 200);
    const end = setTimeout(stop, rec.seconds * 1000);
    media.ondataavailable = e => e.data.size && chunks.push(e.data);
    media.onstop = () => {
        clearInterval(tick);
        clearTimeout(end);
        if (tap) audio.node.disconnect(tap);
        for (const track of stream.getTracks()) track.stop();
        rec.take = null;
        rec.recording = false;
        rec.button.classList.remove('on');
        left.textContent = rec.seconds;
        if (!kept) return;
        const blob = new Blob(chunks, { type: media.mimeType || type });
        const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        save(blob, `${document.title.toLowerCase().replace(/\W+/g, '-')}-${stamp}.${/mp4/.test(blob.type) ? 'mp4' : 'webm'}`);
    };
    rec.take = {
        cancel: () => {
            kept = false;
            stop();
        }
    };
    media.start(1000);
    rec.recording = true;
    rec.button.classList.add('on');
    // The first lets go of the first frame only now, so the video starts on it.
    if (rec.waiting) rec.play();
}

function save(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}
