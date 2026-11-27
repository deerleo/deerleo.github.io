// Draws a frame from a plain description of it (see show.js, which writes one every frame). The order:
// the sky, a video or the desktop, everything again upside down under the floor, the floor over that as a mirror, the walls,
// the boxes, balls and fist, then the trails. That goes through a glow, a trail of the frame before, and out to
// the screen with the cut-in on top.

import { compile, built } from './gl.js';
import * as SH from './shaders.js';
import { createDesk } from './desk.js';
import { perspective, lookAt, mul4, invert, project, norm, sub } from './m4.js';

const BOX_FLOATS = 20, BALL_FLOATS = 8;

// A list of boxes for one frame: where, how big, what colour, how much it glows, and which way it's turned.
export class Boxes {
    constructor(max = 6000) {
        this.data = new Float32Array(max * BOX_FLOATS);
        this.max = max;
        this.n = 0;
    }

    clear() { this.n = 0; }

    // rot is the three columns of a rotation, or nothing for square-on.
    add(x, y, z, sx, sy, sz, r, g, b, e = 0, rot = null) {
        if (this.n >= this.max) return;
        const d = this.data, o = this.n++ * BOX_FLOATS;
        if (rot) {
            d[o] = rot[0] * sx; d[o + 1] = rot[1] * sx; d[o + 2] = rot[2] * sx;
            d[o + 4] = rot[3] * sy; d[o + 5] = rot[4] * sy; d[o + 6] = rot[5] * sy;
            d[o + 8] = rot[6] * sz; d[o + 9] = rot[7] * sz; d[o + 10] = rot[8] * sz;
        } else {
            d[o] = sx; d[o + 1] = 0; d[o + 2] = 0;
            d[o + 4] = 0; d[o + 5] = sy; d[o + 6] = 0;
            d[o + 8] = 0; d[o + 9] = 0; d[o + 10] = sz;
        }
        d[o + 3] = d[o + 7] = d[o + 11] = 0;
        d[o + 12] = x; d[o + 13] = y; d[o + 14] = z; d[o + 15] = 1;
        d[o + 16] = r; d[o + 17] = g; d[o + 18] = b; d[o + 19] = e;
    }
}

export class Balls {
    constructor(max = 4000) {
        this.data = new Float32Array(max * BALL_FLOATS);
        this.max = max;
        this.n = 0;
    }

    clear() { this.n = 0; }

    add(x, y, z, radius, r, g, b, a = 0) {
        if (this.n >= this.max) return;
        this.data.set([x, y, z, radius, r, g, b, a], this.n++ * BALL_FLOATS);
    }
}

function cube() {
    const v = [], idx = [];
    const faces = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    faces.forEach((n, f) => {
        const u = [n[1], n[2], n[0]], w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            v.push((n[0] + u[0] * a + w[0] * b) / 2, (n[1] + u[1] * a + w[1] * b) / 2, (n[2] + u[2] * a + w[2] * b) / 2, ...n);
        }
        idx.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3);
    });
    return { v: new Float32Array(v), idx: new Uint16Array(idx) };
}

function sphere(across = 28, down = 18) {
    const v = [], idx = [];
    for (let j = 0; j <= down; j++) {
        const a = (j / down) * Math.PI;
        for (let i = 0; i <= across; i++) {
            const b = (i / across) * Math.PI * 2;
            v.push(Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b));
        }
    }
    for (let j = 0; j < down; j++) {
        for (let i = 0; i < across; i++) {
            const p = j * (across + 1) + i, q = p + across + 1;
            idx.push(p, p + 1, q, p + 1, q + 1, q);
        }
    }
    return { v: new Float32Array(v), idx: new Uint16Array(idx) };
}

export function createRenderer(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('no WebGL2');

    const P = {};
    for (const name of ['sky', 'video', 'box', 'ball', 'mesh', 'sheet', 'bright', 'blur', 'mixdown', 'screen', 'cutin', 'splash']) {
        P[name] = compile(gl, SH[name].vs, SH[name].fs);
    }

    // ------------------------------------------------------------ shapes

    const empty = gl.createVertexArray();

    const instanced = (shape, floats, layout) => {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, shape.v, gl.STATIC_DRAW);
        layout();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, shape.idx, gl.STATIC_DRAW);
        const each = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, each);
        return { vao, each, count: shape.idx.length, floats };
    };
    const perInstance = (first, count, stride) => {
        for (let i = 0; i < count; i++) {
            gl.enableVertexAttribArray(first + i);
            gl.vertexAttribPointer(first + i, 4, gl.FLOAT, false, stride * 4, i * 16);
            gl.vertexAttribDivisor(first + i, 1);
        }
    };

    const boxShape = instanced(cube(), BOX_FLOATS, () => {
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    });
    perInstance(2, 5, BOX_FLOATS);
    const ballShape = instanced(sphere(), BALL_FLOATS, () => {
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    });
    perInstance(1, 2, BALL_FLOATS);
    gl.bindVertexArray(null);

    function instances(shape, list) {
        if (!list?.n) return;
        gl.bindVertexArray(shape.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.each);
        gl.bufferData(gl.ARRAY_BUFFER, list.data.subarray(0, list.n * shape.floats), gl.DYNAMIC_DRAW);
        gl.drawElementsInstanced(gl.TRIANGLES, shape.count, gl.UNSIGNED_SHORT, 0, list.n);
    }

    // The fist, once it's loaded: one mesh.
    let fist = null;
    function setFist(part) {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        for (const [loc, data] of [[0, part.position], [1, part.normal]]) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, part.index, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        fist = { vao, count: part.index.length, type: part.index instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT };
    }

    // ------------------------------------------------------------ pictures

    const textures = {};
    const blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, blank);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    function setTexture(name, image, { wrap = gl.MIRRORED_REPEAT, mips = true, crisp = false } = {}) {
        const t = (textures[name] ??= { tex: gl.createTexture(), aspect: 1 });
        gl.bindTexture(gl.TEXTURE_2D, t.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, crisp ? gl.NEAREST : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : crisp ? gl.NEAREST : gl.LINEAR);
        if (mips) gl.generateMipmap(gl.TEXTURE_2D);
        t.aspect = (image.videoWidth || image.width) / (image.videoHeight || image.height);
        return t;
    }

    // A video's current frame. It's sent again every frame it's on screen.
    function videoFrame(el) {
        if (el.readyState < 2 || el.seeking) return null;
        try {
            return setTexture('video', el, { wrap: gl.CLAMP_TO_EDGE, mips: false });
        } catch {
            return null;
        }
    }

    // The desktop: painted small with the 2D canvas, and sent whole every frame it's up.
    const desk = createDesk();

    // ------------------------------------------------------------ buffers

    let W = 0, H = 0, ms = null, scene = null, half = null, quarter = [], comp = [], flip = 0;

    function target(w, h, filter = gl.LINEAR) {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { fbo, tex, w, h };
    }

    function drop(t) {
        if (!t) return;
        gl.deleteFramebuffer(t.fbo);
        if (t.tex) gl.deleteTexture(t.tex);
        for (const rb of t.rbs ?? []) gl.deleteRenderbuffer(rb);
    }

    function resize(w, h) {
        W = w; H = h;
        [ms, scene, half, ...quarter, ...comp].forEach(drop);
        const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
        const fbo = gl.createFramebuffer(), colour = gl.createRenderbuffer(), depth = gl.createRenderbuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.bindRenderbuffer(gl.RENDERBUFFER, colour);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colour);
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        ms = { fbo, rbs: [colour, depth] };
        scene = target(w, h);
        const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1), qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
        half = target(hw, hh);
        quarter = [target(qw, qh), target(qw, qh)];
        comp = [target(w, h), target(w, h)];
        for (const c of comp) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, c.fbo);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    const bind = (unit, tex) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex ?? blank);
    };
    const full = () => {
        gl.bindVertexArray(empty);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const into = t => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
        gl.viewport(0, 0, t ? t.w : W, t ? t.h : H);
    };
    const cover = (aspect, screen) => (screen > aspect ? [1, aspect / screen] : [screen / aspect, 1]);

    // ------------------------------------------------------------ a frame

    const cam = { vp: new Float32Array(16), inv: new Float32Array(16), eye: [0, 0, 1] };

    function draw(v) {
        if (!W || !H) return;
        const aspect = W / H;
        const view = lookAt(v.eye, v.target, v.up ?? [0, 1, 0]);
        cam.vp = mul4(perspective(v.fov, aspect, 0.1, 500), view);
        cam.inv = invert(cam.vp);
        cam.eye = v.eye;

        const floor = v.floor;
        const skyU = {
            uTime: v.time, uSky: v.sky, uBass: v.bass, uTripA: v.trip.a, uTripB: v.trip.b,
            uFloor: [floor.y, floor.a, floor.scroll, floor.cell], uFloorA: floor.A, uFloorB: floor.B, uFog: v.fog
        };
        const common = { uVP: cam.vp, uEye: v.eye, uFloorY: floor.y };

        gl.bindFramebuffer(gl.FRAMEBUFFER, ms.fbo);
        gl.viewport(0, 0, W, H);
        gl.depthMask(true);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        // Behind everything.
        if (v.desk) {
            const t = setTexture('desk', desk.paint(v.desk, W, H), { wrap: gl.CLAMP_TO_EDGE, mips: false, crisp: true });
            bind(0, t.tex);
            P.video.use().set({ uTex: 0, uFit: [1, 1], uSnow: v.desk.snow, uRoll: v.desk.roll, uTime: v.time, uGain: 1 });
            full();
        } else if (v.video) {
            const t = videoFrame(v.video.el);
            bind(0, t?.tex);
            P.video.use().set({ uTex: 0, uFit: cover(t?.aspect ?? 1.75, aspect), uSnow: t ? v.video.snow : 1, uRoll: v.video.roll, uTime: v.time, uGain: v.video.gain });
            full();
        } else if (v.sky[0] + v.sky[1] + v.sky[2] + v.sky[3] > 0) {
            P.sky.use().set({ ...skyU, uInvVP: cam.inv, uEye: v.eye });
            full();
        }

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        const things = mirror => {
            P.box.use().set({ ...common, uMirror: mirror, uLit: v.lit, uGlow: v.flatGlow, uFog: v.fog, uFogK: v.fogK });
            instances(boxShape, v.boxes);
            P.ball.use().set({ ...common, ...skyU, uMirror: mirror, uGhost: 0 });
            instances(ballShape, v.balls);
            if (fist && v.fist) {
                P.mesh.use().set({ ...common, ...skyU, uMirror: mirror, uModel: v.fist.model, uTint: v.fist.tint, uHot: v.fist.hot });
                gl.bindVertexArray(fist.vao);
                gl.drawElements(gl.TRIANGLES, fist.count, fist.type, 0);
            }
        };

        gl.enable(gl.CULL_FACE);
        if (floor.a > 0.01) {
            // Everything upside down under the floor, then the floor over it, a little see-through: a mirror.
            gl.cullFace(gl.FRONT);
            things(1);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
            P.sheet.use().set({
                uVP: cam.vp, uEye: v.eye, uO: [-300, floor.y, -300], uU: [600, 0, 0], uV: [0, 0, 600], uStyle: 0, uBlend: 1,
                uAlpha: floor.a * (1 - floor.mirror), uSlide: [floor.scroll, 0], uCell: floor.cell, uA: floor.A, uB: floor.B, uFog: v.fog, uFogK: v.fogK
            });
            gl.bindVertexArray(empty);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.disable(gl.BLEND);
        }

        // The tunnel: four walls of signs.
        if (v.walls && v.walls.a > 0.01) {
            const w = v.walls, x0 = w.x0, len = w.x1 - w.x0;
            gl.disable(gl.CULL_FACE);
            if (w.a < 0.99) {
                gl.enable(gl.BLEND);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
            }
            bind(0, textures.panels?.tex);
            P.sheet.use().set({
                uVP: cam.vp, uEye: v.eye, uTex: 0, uStyle: 1, uBlend: w.a < 0.99 ? 1 : 0, uAlpha: w.a, uPulse: w.pulse,
                uTexScale: [1 / 9, 1 / 6], uA: w.light, uFog: v.fog, uFogK: v.fogK
            });
            gl.bindVertexArray(empty);
            // Each wall's signs the right way up and the right way round from inside, all sliding back past you.
            const x1 = w.x1, s = w.scroll;
            for (const [o, u, across, slide, edge] of [
                [[x0, w.hy, -w.hz], [len, 0, 0], [0, -2 * w.hy, 0], [s, 0], 0],
                [[x1, w.hy, w.hz], [-len, 0, 0], [0, -2 * w.hy, 0], [-s, 0], 0],
                [[x1, -w.hy, -w.hz], [0, 0, 2 * w.hz], [-len, 0, 0], [0, -s], 1],
                [[x0, w.hy, -w.hz], [0, 0, 2 * w.hz], [len, 0, 0], [0, s], 1]
            ]) {
                P.sheet.set({ uO: o, uU: u, uV: across, uSlide: slide, uEdge: edge });
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            }
            gl.disable(gl.BLEND);
        }

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        things(0);

        // Trails: soft blobs, added on.
        if (v.ghosts?.n) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
            gl.depthMask(false);
            P.ball.use().set({ ...common, ...skyU, uMirror: 0, uGhost: 1 });
            instances(ballShape, v.ghosts);
            gl.depthMask(true);
            gl.disable(gl.BLEND);
        }

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        // Out of the multisampled buffer into one that can be read.
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, ms.fbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, scene.fbo);
        gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        // The glow.
        into(half);
        bind(0, scene.tex);
        P.bright.use().set({ uTex: 0 });
        full();
        let from = half;
        for (let i = 0; i < 4; i++) {
            const to = quarter[i % 2];
            into(to);
            bind(0, from.tex);
            P.blur.use().set({ uTex: 0, uStep: i % 2 ? [0, 1 / to.h] : [1 / to.w, 0] });
            full();
            from = to;
        }

        // The picture, its glow and the frame before.
        const now = comp[flip], last = comp[1 - flip];
        flip = 1 - flip;
        into(now);
        bind(0, scene.tex);
        bind(1, from.tex);
        bind(2, last.tex);
        P.mixdown.use().set({ uScene: 0, uBloom: 1, uLast: 2, uTime: v.time, uBloomK: v.bloom, uGlitch: v.glitch, uSplit: v.split, uTrail: v.trail });
        full();

        into(null);
        bind(0, now.tex);
        P.screen.use().set({ uTex: 0, uShake: v.shake, uBox: v.box, uBack: v.back, uLift: v.lift, uFlash: v.flash, uInvert: v.invert, uDim: v.dim, uAspect: aspect });
        full();

        if (v.cutin || v.splash) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            if (v.cutin) {
                bind(0, textures.eyes?.tex);
                P.cutin.use().set({ uTex: 0, uAspect: aspect, uIn: v.cutin.in, uOpen: v.cutin.open, uTime: v.time, uPan: v.cutin.pan, uJolt: v.cutin.jolt });
                full();
            }
            if (v.splash) {
                const t = textures[v.splash.tex];
                bind(0, t?.tex);
                P.splash.use().set({ uTex: 0, uFit: cover(t?.aspect ?? 1.5, aspect), uZoom: v.splash.zoom, uInvert: v.splash.invert, uWhite: v.splash.white, uAlpha: v.splash.alpha, uJolt: v.splash.jolt });
                full();
            }
            gl.disable(gl.BLEND);
        }
    }

    // The ray under a point of the window, x and y from -1 to 1 with y up.
    function ray(nx, ny) {
        const far = project(cam.inv, [nx, ny, 1]);
        return { from: cam.eye, dir: norm(sub(far, cam.eye)) };
    }

    return { gl, draw, resize, ray, cam, setTexture, setFist, built: () => built(gl), get hasFist() { return !!fist; } };
}
