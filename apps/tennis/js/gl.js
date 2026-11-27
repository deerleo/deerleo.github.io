// Small WebGL2 helpers, from Closedown: programs that build in the background, with their uniforms looked up once.

// Asking whether a program worked blocks until it's finished, which on Windows can take seconds, so nothing asks
// until built() says they're all done.
const programs = [];
const parallel = gl => gl.getExtension('KHR_parallel_shader_compile');

export function compile(gl, vs, fs) {
    parallel(gl);
    const shader = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return [s, src];
    };
    const prog = gl.createProgram();
    const shaders = [shader(gl.VERTEX_SHADER, vs), shader(gl.FRAGMENT_SHADER, fs)];
    for (const [s] of shaders) gl.attachShader(prog, s);
    gl.linkProgram(prog);

    const cache = {};
    const loc = name => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(prog, name)));
    let types = null;

    function check() {
        if (types) return;
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            for (const [s, src] of shaders) {
                if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) continue;
                const lines = src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
                throw new Error(`${gl.getShaderInfoLog(s)}\n${lines}`);
            }
            throw new Error(gl.getProgramInfoLog(prog));
        }
        types = {};
        for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) {
            const info = gl.getActiveUniform(prog, i);
            types[info.name.replace(/\[0\]$/, '')] = info.type;
        }
    }

    const p = {
        prog,
        check,
        use() { check(); gl.useProgram(prog); return this; },
        // p.set({ uGlow: 0.2, uDir: [1, 0, 0.75, 0.25] }) picks the call from the uniform's declared type.
        set(values) {
            check();
            for (const name in values) {
                const l = loc(name);
                if (l === null) continue;
                const v = values[name];
                switch (types[name]) {
                    case gl.FLOAT: gl.uniform1f(l, v); break;
                    case gl.FLOAT_VEC2: gl.uniform2fv(l, v); break;
                    case gl.FLOAT_VEC3: gl.uniform3fv(l, v); break;
                    case gl.FLOAT_VEC4: gl.uniform4fv(l, v); break;
                    case gl.FLOAT_MAT4: gl.uniformMatrix4fv(l, false, v); break;
                    case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: gl.uniform1i(l, v); break;
                }
            }
            return this;
        }
    };
    programs.push(p);
    return p;
}

// Resolves once every program is built, checking once a frame so the page keeps moving meanwhile.
// Without the extension it just waits for them.
export async function built(gl) {
    const ext = parallel(gl);
    if (ext) {
        while (!programs.every(p => gl.getProgramParameter(p.prog, ext.COMPLETION_STATUS_KHR))) await new Promise(requestAnimationFrame);
    }
    programs.forEach(p => p.check());
}
