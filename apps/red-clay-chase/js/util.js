'use strict';
/* Shared helpers: RNG, noise, geometry utilities. Everything hangs off the global G. */
var G = {};
(function () {
  const U = G.U = {};

  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  U.clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  U.bump = x => { x = Math.abs(x); if (x >= 1) return 0; const k = 1 - x * x; return k * k; };
  U.angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  /* Perlin gradient noise, optional period for tileable textures. */
  U.makeNoise = function (seed) {
    const r = U.rng(seed);
    const p = new Uint8Array(512);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const g = (h, x, y) => {
      switch (h & 7) {
        case 0: return x + y; case 1: return x - y; case 2: return -x + y; case 3: return -x - y;
        case 4: return x * 1.4142; case 5: return -x * 1.4142; case 6: return y * 1.4142; default: return -y * 1.4142;
      }
    };
    function n2(x, y, per) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      let X0, X1, Y0, Y1;
      if (per) {
        X0 = ((xi % per) + per) % per; X1 = (X0 + 1) % per;
        Y0 = ((yi % per) + per) % per; Y1 = (Y0 + 1) % per;
      } else { X0 = xi & 255; X1 = (X0 + 1) & 255; Y0 = yi & 255; Y1 = (Y0 + 1) & 255; }
      const u = fade(xf), v = fade(yf);
      const aa = p[p[X0] + Y0], ab = p[p[X0] + Y1], ba = p[p[X1] + Y0], bb = p[p[X1] + Y1];
      const x1 = g(aa, xf, yf) + (g(ba, xf - 1, yf) - g(aa, xf, yf)) * u;
      const x2 = g(ab, xf, yf - 1) + (g(bb, xf - 1, yf - 1) - g(ab, xf, yf - 1)) * u;
      return x1 + (x2 - x1) * v;
    }
    function fbm(x, y, oct, per) {
      let a = 0.5, f = 1, s = 0, n = 0;
      for (let i = 0; i < oct; i++) { s += a * n2(x * f, y * f, per ? per * f : 0); n += a; a *= 0.5; f *= 2; }
      return s / n;
    }
    return { n2, fbm };
  };

  /* ---------- geometry helpers ---------- */
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  U.tf = function (geo, px, py, pz, rx, ry, rz, sx, sy, sz) {
    _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e);
    _v.set(px || 0, py || 0, pz || 0);
    _s.set(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz);
    _m.compose(_v, _q, _s);
    geo.applyMatrix4(_m);
    return geo;
  };
  U.paint = function (geo, r, g, b) {
    const n = geo.attributes.position.count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = g; c[i * 3 + 2] = b; }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return geo;
  };
  U.constAttr = function (geo, name, v) {
    const n = geo.attributes.position.count, c = new Float32Array(n).fill(v);
    geo.setAttribute(name, new THREE.BufferAttribute(c, 1));
    return geo;
  };
  /* remap uvs into an atlas rect [u0,v0,u1,v1] */
  U.uvRect = function (geo, r) {
    const uv = geo.attributes.uv; if (!uv) return geo;
    for (let i = 0; i < uv.count; i++) {
      let u = uv.getX(i), v = uv.getY(i);
      u = u - Math.floor(u); v = v - Math.floor(v);
      uv.setXY(i, r[0] + (r[2] - r[0]) * u, r[1] + (r[3] - r[1]) * v);
    }
    return geo;
  };

  /* Merge geometries (position, normal, uv, color, optional aWind) into one indexed geometry. */
  U.merge = function (geos, withWind) {
    let nv = 0, ni = 0;
    for (const g of geos) { const c = g.attributes.position.count; nv += c; ni += g.index ? g.index.count : c; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = new Float32Array(nv * 3);
    const wind = withWind ? new Float32Array(nv) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let vo = 0, io = 0;
    for (const g of geos) {
      const a = g.attributes, c = a.position.count;
      pos.set(a.position.array.subarray(0, c * 3), vo * 3);
      if (a.normal) nor.set(a.normal.array.subarray(0, c * 3), vo * 3);
      if (a.uv) uv.set(a.uv.array.subarray(0, c * 2), vo * 2);
      if (a.color) col.set(a.color.array.subarray(0, c * 3), vo * 3); else col.fill(1, vo * 3, (vo + c) * 3);
      if (wind && a.aWind) wind.set(a.aWind.array.subarray(0, c), vo);
      if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo; io += ia.length; }
      else { for (let i = 0; i < c; i++) idx[io + i] = vo + i; io += c; }
      vo += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (wind) out.setAttribute('aWind', new THREE.BufferAttribute(wind, 1));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  };

  /* Box with rounded edges (segments concentrated in the corners). */
  U.roundedBox = function (w, h, d, r, cs) {
    cs = cs || 2;
    const S = cs * 2 + 1;
    const g = new THREE.BoxGeometry(w, h, d, S, S, S);
    const p = g.attributes.position, n = g.attributes.normal;
    const hx = w / 2, hy = h / 2, hz = d / 2;
    r = Math.min(r, hx, hy, hz);
    const remap = (v, hh) => {
      // v on uniform grid -hh..hh with S segments; move so first/last cs segments span the radius
      const k = Math.round((v + hh) / (2 * hh) * S);
      if (k <= cs) return -hh + r * (k / cs);
      if (k >= S - cs) return hh - r * ((S - k) / cs);
      return -hh + r + (2 * hh - 2 * r) * ((k - cs) / (S - 2 * cs));
    };
    for (let i = 0; i < p.count; i++) {
      const x = remap(p.getX(i), hx), y = remap(p.getY(i), hy), z = remap(p.getZ(i), hz);
      const cx = U.clamp(x, -hx + r, hx - r), cy = U.clamp(y, -hy + r, hy - r), cz = U.clamp(z, -hz + r, hz - r);
      let dx = x - cx, dy = y - cy, dz = z - cz;
      const l = Math.hypot(dx, dy, dz);
      if (l > 1e-6) {
        dx /= l; dy /= l; dz /= l;
        p.setXYZ(i, cx + dx * r, cy + dy * r, cz + dz * r);
        n.setXYZ(i, dx, dy, dz);
      } else p.setXYZ(i, x, y, z);
    }
    return g;
  };

  /* Recompute normals with a crease angle. Returns a non-indexed geometry. */
  U.crease = function (geo, angle) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const pos = g.attributes.position.array, nv = pos.length / 3, nf = nv / 3;
    const fn = new Float32Array(nf * 3);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < nf; f++) {
      a.fromArray(pos, f * 9); b.fromArray(pos, f * 9 + 3); c.fromArray(pos, f * 9 + 6);
      b.sub(a); c.sub(a); b.cross(c); // area-weighted
      fn[f * 3] = b.x; fn[f * 3 + 1] = b.y; fn[f * 3 + 2] = b.z;
    }
    const map = new Map();
    for (let i = 0; i < nv; i++) {
      const k = Math.round(pos[i * 3] * 2000) + '_' + Math.round(pos[i * 3 + 1] * 2000) + '_' + Math.round(pos[i * 3 + 2] * 2000);
      let l = map.get(k); if (!l) { l = []; map.set(k, l); } l.push(i);
    }
    const cosT = Math.cos(angle);
    const out = new Float32Array(nv * 3);
    for (const l of map.values()) {
      for (const i of l) {
        const f = (i / 3) | 0;
        const fx = fn[f * 3], fy = fn[f * 3 + 1], fz = fn[f * 3 + 2];
        const fl = Math.hypot(fx, fy, fz) || 1;
        let sx = 0, sy = 0, sz = 0;
        for (const j of l) {
          const f2 = (j / 3) | 0;
          const gx = fn[f2 * 3], gy = fn[f2 * 3 + 1], gz = fn[f2 * 3 + 2];
          const gl = Math.hypot(gx, gy, gz) || 1;
          if ((fx * gx + fy * gy + fz * gz) / (fl * gl) >= cosT) { sx += gx; sy += gy; sz += gz; }
        }
        const sl = Math.hypot(sx, sy, sz) || 1;
        out[i * 3] = sx / sl; out[i * 3 + 1] = sy / sl; out[i * 3 + 2] = sz / sl;
      }
    }
    g.setAttribute('normal', new THREE.BufferAttribute(out, 3));
    return g;
  };

  /* Sweep a 2D profile ([lateral, height] points) along frames {x,y,z,rx,rz,bank,v}.
     sharp=true gives each profile segment its own vertices (hard edges). */
  U.sweep = function (frames, prof, opt) {
    opt = opt || {};
    const sharp = !!opt.sharp, closed = !!opt.closed;
    const segs = [];
    const np = prof.length;
    if (sharp) { for (let i = 0; i < (closed ? np : np - 1); i++) segs.push([prof[i], prof[(i + 1) % np]]); }
    else segs.push(closed ? prof.concat([prof[0]]) : prof);
    const nf = frames.length;
    let nv = 0, nq = 0;
    for (const s of segs) { nv += s.length * nf; nq += (s.length - 1) * (nf - 1); }
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    const idx = nv > 65535 ? new Uint32Array(nq * 6) : new Uint16Array(nq * 6);
    let vo = 0, io = 0;
    const uS = opt.uScale || 1, vS = opt.vScale || 1;
    for (const s of segs) {
      const m = s.length;
      let ul = 0; const us = [0];
      for (let j = 1; j < m; j++) { ul += Math.hypot(s[j][0] - s[j - 1][0], s[j][1] - s[j - 1][1]); us.push(ul); }
      for (let i = 0; i < nf; i++) {
        const f = frames[i];
        for (let j = 0; j < m; j++) {
          const d = s[j][0], h = s[j][1];
          const k = (vo + i * m + j);
          pos[k * 3] = f.x + f.rx * d; pos[k * 3 + 1] = f.y + h + (f.bank || 0) * d; pos[k * 3 + 2] = f.z + f.rz * d;
          uv[k * 2] = (opt.uNorm ? us[j] / (ul || 1) : us[j] * uS); uv[k * 2 + 1] = f.v * vS;
        }
      }
      for (let i = 0; i < nf - 1; i++) for (let j = 0; j < m - 1; j++) {
        const a = vo + i * m + j, b = a + 1, c = a + m, d2 = c + 1;
        // default winding: a profile listed left-to-right (increasing lateral) faces up
        if (!opt.flip) { idx[io++] = a; idx[io++] = b; idx[io++] = c; idx[io++] = b; idx[io++] = d2; idx[io++] = c; }
        else { idx[io++] = a; idx[io++] = c; idx[io++] = b; idx[io++] = b; idx[io++] = c; idx[io++] = d2; }
      }
      vo += m * nf;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    return g;
  };
})();
