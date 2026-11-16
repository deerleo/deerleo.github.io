// The landing: the place and its light (stage 2d's module). docs/art/landing.md, sections 2, 3 (the vista) and 7.
//
//   the sky        one dome, drawn before everything: the gradient (PLAN.sky), the painted western sky (image 2) in a
//                  window 99 degrees wide whose cloud tower stands at bearing +9 and whose bloom is on the sun, the
//                  quiet east in code, the cloud ceiling (image 6) drifting over all of it, and the sun: a soft spot
//                  of light with no disc, no edge and no rays. Solid things are drawn after it and so cut into it,
//                  in the direct view and in the water alike. THE SKY IS PAINTED IN SCREEN COLOURS: its shader
//                  undoes the final pass's curve (asPainted), so a colour typed for the sky is the colour seen;
//                  and it is held under the bloom's threshold, so that only the sun shines.
//   the far planes the hills, the flood bank with its pollard willows, the far dye works (image 3), on curved rails
//   the ground     the bed of the backwater and the mere, the ford, the reed bed, the cut fen and its turf bank and
//                  hard, the revetted banks of the last straight: one mesh from PLAN.ground
//   the air        the gold mist on the water is the height fog of look.light; the mist cards (PLAN.mist) are off
//   the lamp       its daylight halo, core and stroke (see below): what makes the kept lamp read from 16 m off
//   the sun's bloom  the sky's spot is hidden behind forty metres of reed from almost everywhere on the water. So:
//                  one soft light IN the reed bed on the line from the eye to the sun (depth-tested: the outer stems,
//                  the bridge and the traps stand against it), a wide heartless swell of light on the cloth when
//                  the sun is behind the cloth, and a faint veil of the same light over everything (PLAN.sunGlow)
//   by distance    the current (PLAN.currentAt), the sun sinking 0.6 of a degree, the sky warming, the sun's path on the
//                  last 26 m. The two light states themselves (look -> lookEnd, water -> waterEnd) are the engine's blend.
//
// shared.set = { sky, skyU (the dome's uniforms), far, ground, lampAids, sunBloom }.   &at_s=70 holds the sky and
// sun of that place (not the engine's own blend of look and water, which goes by where the boat is).
import * as THREE from 'three';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180;

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, P = plan, L = shared.landing, C = P.C, S = ctx.engine.shared;
  const QS = new URLSearchParams(location.search);
  const tex = (url, opts) => (url ? ctx.tex(url, opts).catch((err) => { console.warn(`landing: ${url} did not load (${err && err.message}); drawn without it`); return null; }) : Promise.resolve(null));
  const [pano, ceil, farTex] = await Promise.all([tex(P.art.sky), tex(P.art.ceiling, { repeat: true }), tex(P.art.far)]);

  // ============================================================================================ the sky
  const SK = P.sky, SUN = P.sun, PN = SK.pano, col = (c) => new THREE.Color(c);
  if (pano) { pano.wrapS = pano.wrapT = THREE.ClampToEdgeWrapping; pano.needsUpdate = true; }
  const aspect = pano ? (pano.userData.aspect || 3) : 3, span = PN.span * RAD;
  // the painting keeps its shapes (Mercator heights, as kit.sky does): it stands in a window `span` wide whose sun's
  // bloom is on the sun, its foot at `lo` degrees
  const panoCentre = L.sunAz - (PN.sunAt - 0.5) * span, lo = Math.atanh(Math.sin(PN.lo * RAD));
  const skyU = {
    uTop: { value: col(SK.top) }, uMid: { value: col(SK.mid) }, uHorizon: { value: col(SK.horizon) }, uBelow: { value: col(SK.below) }, uEast: { value: col(SK.east) }, uEastBelt: { value: col(SK.eastBelt ?? SK.east) }, uEastBand: { value: col(SK.eastBand ?? SK.east).multiplyScalar(SK.eastBand ? 1 : 0.86) },
    uStops: { value: new THREE.Vector2(SK.stops[0] * RAD, SK.stops[1] * RAD) }, uVeil: S.uVeil, uVeilColor: S.uVeilColor, uTime: S.uTime,
    tPano: { value: pano }, uPano: { value: new THREE.Vector4(panoCentre, span, lo, span / aspect) }, uPanoGlow: { value: SK.panoramaGlow }, uPanoTint: { value: col(PN.tint) },
    uFade: { value: new THREE.Vector3(PN.fadeSide, PN.fadeBottom, PN.fadeTop) },
    tCeil: { value: ceil }, uCeil: { value: ceil ? SK.ceiling : 0 }, uCeilMove: { value: new THREE.Vector4(0, 0, SK.ceilingScale, 0) },
    uSun: { value: L.toSun }, uSunShape: { value: new THREE.Vector4(SUN.core, SUN.radius * RAD, SUN.coreAcross * 0.5 * RAD * 1.6, 1) },
    uSunCore: { value: col(SUN.coreColor) }, uSunRim: { value: col(SUN.auraColor ?? SUN.rimColor) }, uSunAura: { value: new THREE.Vector2(SUN.aura ?? 0.9, SUN.auraTake ?? 0.8) },
    uGrade: { value: new THREE.Vector4(1, 1, 1, P.look.grade.toe ?? 0) },
  };
  { const g = col(P.look.grade.tint).multiplyScalar(P.look.exposure); skyU.uGrade.value.set(g.r, g.g, g.b, P.look.grade.toe ?? 0); }
  { // the ceiling drifts from the sun's quarter toward the east: 0.4 degrees a second overhead
    const v = SK.ceilingDrift * RAD * skyU.uCeilMove.value.z;
    skyU.uCeilMove.value.x = Math.sin(L.sunAz) * v; skyU.uCeilMove.value.y = -Math.cos(L.sunAz) * v;      // the picture slides toward the sun, so the cloud moves away from it
  }
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    defines: { ...(pano ? { PANO: '' } : {}), ...(ceil ? { CEILING: '' } : {}) },
    vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTop, uMid, uHorizon, uBelow, uEast, uEastBelt, uEastBand, uVeilColor, uSun, uSunCore, uSunRim, uPanoTint, uFade;
      uniform float uVeil, uTime, uPanoGlow, uCeil;
      uniform vec2 uStops, uSunAura; uniform vec4 uSunShape, uCeilMove, uPano, uGrade; uniform sampler2D tPano, tCeil;
      varying vec3 vDir;
      // The sky is painted in the colours it should have ON SCREEN. The ride's final pass (src/engine/post.js) puts
      // every colour through exposure, a tint and a filmic curve, which would show this painting a step lighter and
      // yellower than it is; asPainted gives the light that the final pass shows as the colour y (it undoes the
      // curve: a closed form for each channel, then three Newton steps for the curve's hue-keeping half).
      float lInv(float y, float t) { float a = 2.51 - 2.43 * y, b = t - 0.59 * y; return (-b + sqrt(max(b * b + 0.56 * a * y, 0.0))) / (2.0 * max(a, 1e-3)); }
      vec3 lCurve(vec3 x) { vec3 t = mix(vec3(0.03), vec3(0.14), uGrade.a * (1.0 - smoothstep(0.0, 0.25, x))); return (x * (2.51 * x + t)) / (x * (2.43 * x + 0.59) + 0.14); }
      vec3 asPainted(vec3 y) {
        y = clamp(y, 0.0, 0.985);
        vec3 x = vec3(lInv(y.r, 0.03), lInv(y.g, 0.03), lInv(y.b, 0.03));
        vec3 t = mix(vec3(0.03), vec3(0.14), uGrade.a * (1.0 - smoothstep(0.0, 0.25, x)));
        x = vec3(lInv(y.r, t.r), lInv(y.g, t.g), lInv(y.b, t.b));
        float yp = max(y.r, max(y.g, y.b)), xp = max(max(x.r, max(x.g, x.b)), 1e-5);
        for (int i = 0; i < 3; i++) {
          vec3 cv = lCurve(x), dcv = (lCurve(x * 1.02 + 1e-4) - cv) / (x * 0.02 + 1e-4);
          x = max(x - (0.45 * yp * x / xp + 0.55 * cv - y) / (0.45 * yp / xp + 0.55 * dcv), 0.0);
        }
        return x / uGrade.rgb;
      }
      void main() {
        vec3 d = normalize(vDir);
        float e = asin(clamp(d.y, -1.0, 1.0));                         // elevation, radians
        vec3 c = mix(mix(uHorizon, uMid, smoothstep(0.0, uStops.x, e)), uTop, smoothstep(uStops.x, uStops.y, e));
        // the quiet side: away from the sun the sky is putty and grey-green, with a darker low band
        float away = 0.5 - 0.5 * dot(normalize(d.xz + vec2(1e-5)), normalize(uSun.xz));
        // (stage 2: from the water up: a darker low band, a pale warm belt of the day's last light above it, putty, the
        // grey-green of the top. As laid out it was one putty from the band to the top: an overcast, where the page has a quiet sky)
        // (the band stands to about ten degrees: the height of the bridge as the last straight sees it, so that the bridge,
        // front-lit, and the lit reeds of the far bank are LIGHT ON DARK; with the pale belt behind them they were grey on grey)
        vec3 quiet = mix(uEastBand, uEastBelt, smoothstep(0.13, 0.28, e));
        quiet = mix(quiet, uEast, smoothstep(0.30, 0.52, e));
        quiet = mix(quiet, uTop, smoothstep(0.45, 0.90, e));
        c = mix(c, quiet, smoothstep(0.35, 0.95, away) * 0.92);
        c = mix(c, uBelow, smoothstep(0.0, -0.12, e));
        #ifdef PANO
        {
          float da = mod(atan(d.x, -d.z) - uPano.x + 3.14159265, 6.2831853) - 3.14159265;      // bearing from the painting's middle
          float u = da / uPano.y + 0.5, v = (0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y)) - uPano.z) / uPano.w;
          if (u > 0.0 && u < 1.0 && v > 0.0 && v < 1.0) {
            float a = smoothstep(0.0, uFade.x, u) * smoothstep(0.0, uFade.x, 1.0 - u) * smoothstep(0.0, uFade.y, v) * (1.0 - smoothstep(1.0 - uFade.z, 1.0, v));
            c = mix(c, texture2D(tPano, vec2(u, v)).rgb * uPanoTint, a);
          }
        }
        #endif
        #ifdef CEILING
        if (d.y > 0.03) {
          // a level sheet of cloud far overhead, seen from below: it slides, and thins toward the horizon
          vec2 q = d.xz / (d.y + 0.1) * uCeilMove.z + uCeilMove.xy * uTime;
          vec3 k = texture2D(tCeil, q).rgb;
          float cloud = smoothstep(0.37, 0.52, dot(k, vec3(0.2126, 0.7152, 0.0722)));      // the gold undersides; the openings between them stay the sky's own
          c = mix(c, k, cloud * uCeil * smoothstep(0.2, 0.55, d.y));
        }
        #endif
        c = asPainted(c) * uPanoGlow;
        // ...but never so bright that the bloom takes the sky for a light, or the water grows columns under a cloud:
        // above the threshold only the sun shines (the page: what glows)
        c *= min(1.0, 0.86 / max(max(dot(c, vec3(0.2126, 0.7152, 0.0722)), dot(c, vec3(0.3, 0.55, 0.15))), 1e-4));
        // the sun: light on the sky, not an object. No disc, no edge, no rays: a core that falls smoothly to nothing.
        // Its aureole is GOLD, not pale: the sky within nine degrees of it is drawn toward honey and orange (uSunAura:
        // how bright that gold, how much of the sky it takes), and only the small heart is pale and above 1.
        // (Stage 2. As first laid out the whole spot was added to the sky in cream, 3.5 times over: a white ball with a
        // milk round it, where the key painting has a deep yellow glow: #FABE50.)
        float ang = acos(clamp(dot(d, uSun), -1.0, 1.0));
        float core = exp(-pow(ang / uSunShape.z, 2.0)), wide = pow(clamp(1.0 - ang / uSunShape.y, 0.0, 1.0), 2.5);
        c = mix(c, mix(uSunRim, uSunCore, clamp(core + wide * 0.35, 0.0, 1.0)) * uSunAura.x, clamp(wide * uSunAura.y, 0.0, 1.0) * uSunShape.w);
        c += uSunCore * (uSunShape.x * core * uSunShape.w);
        gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat);
  sky.name = 'sky'; sky.renderOrder = -1000; sky.frustumCulled = false; ctx.add(sky);
  const skyFrom = { top: col(SK.top), mid: col(SK.mid), horizon: col(SK.horizon), glow: SK.panoramaGlow };
  const skyTo = { top: col(SK.end.top ?? SK.top), mid: col(SK.end.mid ?? SK.mid), horizon: col(SK.end.horizon ?? SK.horizon), glow: SK.end.panoramaGlow ?? SK.panoramaGlow };

  // ============================================================================================ the far planes
  // Image 3 ('far'): the hills, the flood bank with its pollard willows, the far dye works: each a strip of the
  // picture laid on a curved rail about the mere (PLAN.far.strips), solid where it is solid and soft at its painted top.
  const far = [];
  if (farTex && P.far.strips) {
    for (const st of P.far.strips) {
      const centre = L.at(st.about[0], st.about[1], 0), arc = (st.bearings[1] - st.bearings[0]) * RAD;
      const n = st.copies ?? 1, each = arc / n;
      for (let i = 0; i < n; i++) {
        const b = st.bearings[0] * RAD + each * (i + 0.5), x = centre.x + Math.sin(b) * st.r, z = centre.z - Math.cos(b) * st.r;
        const flat = kit.flat(farTex, { uv: st.uv, width: st.r * each * 1.004, height: st.high, position: [x, st.y ?? -0.3, z], face: Math.atan2(centre.x - x, centre.z - z), curve: each,
          cutout: st.cutout ?? 'both', fog: st.fog ?? 0.4, tint: st.tint ?? '#ffffff', mirror: !!(st.flip && i % 2) });
        flat.name = 'far:' + st.name; far.push(flat);
      }
    }
  }

  // ============================================================================================ the ground
  // One mesh; heights and kinds from PLAN.ground. Its grid is 0.8 m where the boat can come, 1.6 m round that, 6 m
  // beyond. The grid gives the land its SHAPE and each place its KIND (bed, sand, fen, turf, peat, hard); what is LAID
  // ON it is painted in the shader, in the world's own space, so that nothing follows the grid (stage 2: as first laid
  // out it was one tint a vertex, and the bed beside the staithe, a metre under the rider's eye, was flat amber):
  //   sand     ripple marks a hand apart across the current, silt in their troughs, dark bits of reed and leaf
  //   bed      silt, mottled
  //   peat     (the reeds' feet) dark mud, reed litter lying on it, and where the water has washed it, just under the
  //            surface, the pale roots
  //   fen      (14 cm of water over the cut) peat strewn with cut straw
  //   turf     two greens and dry tips; the hard: trodden, strewn with straw
  // and for all of it: kinds meet in ragged edges, land is dark where it is wet, and where the sun reaches shallow
  // water its light plays on the bed (PLAN.groundPaint).
  {
    const GP = P.groundPaint || {};
    const stepAt = (v, zones, coarse) => { let st = coarse; for (const [a, b, w] of zones) if (v >= a - 1e-6 && v < b - 1e-6) st = Math.min(st, w); return st; };
    const lines = (a, b, zones, coarse) => { const out = []; let v = a; while (v < b - 1e-6) { out.push(v); v += stepAt(v, zones, coarse); } out.push(b); return out; };
    const xs = lines(-156, 96, [[-66, 60, 1.6], [-18, 36.4, 0.8]], 6), zs = lines(-196, 74, [[-116, 22, 1.6], [-77.6, 12, 0.8]], 6), nx = xs.length, nz = zs.length;
    const pos = new Float32Array(nx * nz * 3), cols = new Float32Array(nx * nz * 3), kinds = new Float32Array(nx * nz * 4), edges = new Float32Array(nx * nz * 3), g = {}, bedAt = {}, k = new THREE.Color();
    const tone = { bed: col(C.bed), sand: col(C.sand), fen: col(C.fenBed), turf: col(C.turf), peat: col(C.mud), hard: col(C.turf).lerp(col(C.straw), 0.35) };
    const slot = { sand: 0, fen: 1, turf: 2, hard: 2, peat: 3 };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], q = P.ground(path, x, z, g), n = kit.fbm(x * 0.13, z * 0.13, 3);
      let y = q.y + (q.kind === 'fen' ? (n - 0.5) * 0.07 : q.y > 0 ? (n - 0.5) * 0.1 : 0);
      if (q.kind === 'fen' && y > -0.03) y = -0.03;
      k.copy(tone[q.kind] || tone.bed);
      if (q.kind === 'sand') k.lerp(tone.bed, sm(0.35, 0.75, -q.y));
      k.multiplyScalar(0.86 + 0.28 * n);
      const v = j * nx + i, o = v * 3;
      pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; cols[o] = k.r; cols[o + 1] = k.g; cols[o + 2] = k.b;
      // (turf and the hard are kinds of dry land: where the same bank runs on under the water it is peat)
      const kind = (q.kind === 'turf' || q.kind === 'hard') && y < -0.03 ? 'peat' : q.kind;
      if (kind !== q.kind) { k.copy(tone.peat).multiplyScalar(0.86 + 0.28 * n); cols[o] = k.r; cols[o + 1] = k.g; cols[o + 2] = k.b; }
      if (slot[kind] !== undefined) kinds[v * 4 + slot[kind]] = 1;
      // (metres outside the channel's edge; the hard; and whether reeds stand here: the roots show only at a reed bed's own margin)
      const rb = P.reedBed(path, x, z, bedAt);
      edges[v * 3] = Math.max(-12, Math.min(12, Math.abs(q.d) - q.hw)); edges[v * 3 + 1] = q.kind === 'hard' ? 1 : 0; edges[v * 3 + 2] = rb && rb.e > -1.2 ? 1 : 0;
    }
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.setAttribute('aLKind', new THREE.BufferAttribute(kinds, 4)); geo.setAttribute('aLEdge', new THREE.BufferAttribute(edges, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    // (the decks that stand over shallow water: the staithe along the path, the jetty across it)
    const decks = [[(P.staithe.s[0] + P.staithe.s[1]) / 2, (P.staithe.d[0] + P.staithe.d[1]) / 2, (P.staithe.s[1] - P.staithe.s[0]) / 2, Math.abs(P.staithe.d[1] - P.staithe.d[0]) / 2, 0],
      [P.jetty.s, (P.jetty.d[0] + P.jetty.d[1]) / 2, Math.abs(P.jetty.d[1] - P.jetty.d[0]) / 2, P.jetty.width / 2, 1]].map(([ds, dd, hl, hw, across]) => {
      const f = L.frame(ds, {}); return { x: f.x + f.rx * dd, z: f.z + f.rz * dd, tx: across ? f.rx : f.tx, tz: across ? f.rz : f.tz, hl, hw }; });
    const laid = {
      uniforms: { uGStraw: { value: col(GP.straw || '#C2A050') }, uGRoot: { value: col(GP.root || '#D9C79A') }, uGSilt: { value: col(GP.silt || C.bed) },
        uGPlay: { value: new THREE.Vector4(GP.play ?? 0.55, GP.playShade ?? 0.25, GP.ripple ?? 0.2, GP.litter ?? 1) }, uGPlayColor: { value: col(GP.playColor || '#FFD890') },
        // (the sky's own light on a shallow bed, and the decks that keep it off: each deck as [centre x, z, its long axis x, z] and [half length, half width])
        uGSky: { value: col(GP.skyColor || '#FFD9A0').multiplyScalar(GP.sky ?? 0) }, uGDeck: { value: decks.map((k) => new THREE.Vector4(k.x, k.z, k.tx, k.tz)) }, uGDeckSize: { value: decks.map((k) => new THREE.Vector3(k.hl, k.hw, GP.deck ?? 0.6)) } },
      vertexPars: /* glsl */`attribute vec4 aLKind; attribute vec3 aLEdge; varying vec4 vLKind; varying vec3 vLEdge;`,
      vertexLocal: /* glsl */`vLKind = aLKind; vLEdge = aLEdge;`,
      fragmentPars: /* glsl */`varying vec4 vLKind; varying vec3 vLEdge; uniform vec3 uGStraw, uGRoot, uGSilt, uGPlayColor, uGSky; uniform vec4 uGPlay; uniform vec4 uGDeck[2]; uniform vec3 uGDeckSize[2];
        // short straws lying every way, one or none to a cell (p in cells; w: half a straw's width in cells; len: its
        // length, 1 = a straw, 0 = a round thing: a pebble, a shell, a leaf; fill: the share of cells that have one): 1 on it
        float gStraw(vec2 p, float w, float len, float fill) {
          vec2 base = floor(p - 0.5); float m = 0.0;
          for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
            vec2 cell = base + vec2(float(i), float(j));
            float h1 = lHash(cell), h2 = lHash(cell + 17.3), h3 = lHash(cell + 41.7);
            if (h3 > fill) continue;                                         // an empty cell
            vec2 mid = cell + 0.5 + (vec2(h1, h2) - 0.5) * 0.4, dir = vec2(cos(h3 * 31.4), sin(h3 * 31.4));
            vec2 r = p - mid; float reach = 0.3 * (0.4 + 0.6 * h2) * len, along = clamp(dot(r, dir), -reach, reach);
            float ww = w * (0.6 + 0.8 * h1 * (1.0 - len));                   // round things are of every size
            m = max(m, 1.0 - smoothstep(ww, ww * 1.7, length(r - dir * along)));
          }
          return m;
        }`,
      // (What cannot be seen is not painted: deeper than 1.2 m the tea water has taken everything, and further than
      // 60 m a straw is far less than a pixel. Each kind is painted only where it lies. The ground is under every
      // pixel of the water in two of the frame's three pictures: painted whole everywhere it cost 4 ms a frame.)
      albedo: /* glsl */`
        { vec2 q = vWPos.xz; float gy = vWPos.y, gd = length(vViewPos);
          float n1 = lNoise(q * 0.9);
          vec3 laid = albedo * (0.8 + 0.4 * n1);
          float n2 = 0.5;
          if (gy > -1.2 && gd < 60.0) {
            n2 = lNoise(q * 3.7 + 11.0);
            float n3 = lNoise(q * 14.0 + 5.0);
            float near = 1.0 - smoothstep(6.0, 16.0, gd), mid = 1.0 - smoothstep(10.0, 32.0, gd);
            // the kinds meet in ragged edges, not along the grid
            vec4 k = clamp((vLKind + (n2 - 0.5) * 0.7 * step(0.02, vLKind) * step(vLKind, vec4(0.98)) - 0.5) * 3.0 + 0.5, 0.0, 1.0);
            // the bed: silt, mottled
            laid = albedo * (0.8 + 0.4 * n1) * (0.92 + 0.16 * n3 * near);
            float warp = 0.0;
            if (near > 0.0 && k.x + k.w > 0.01) warp = lNoise(q * 0.8) * 2.6 + n2 * 0.8;
            if (k.x > 0.01) {
              // sand: ripple marks across the current, silt in their troughs, dark bits of reed and leaf
              // (the marks come and go in patches, fork and run out: a sine alone is a hatching)
              vec3 sand = albedo * (0.9 + 0.2 * n1);
              if (near > 0.0) {
                float rip = sin((q.y * 0.96 + q.x * 0.28) * 45.0 + warp * 6.0 + 2.6 * lNoise(q * vec2(2.0, 9.0))), ripK = near * (0.35 + 0.65 * smoothstep(0.2, 0.55, lNoise(q * 0.55 + 23.0)));
                sand *= 1.0 + uGPlay.z * rip * ripK;
                sand = mix(sand, uGSilt * 1.7, (1.0 - smoothstep(-0.9, -0.1, rip)) * 0.45 * ripK);
                sand = mix(sand, sand * 0.4, gStraw(q / 0.16, 0.05, 1.0, 0.7) * near * 0.8);
                // what lies on it: pale mussel shells and pebbles, dark sodden leaves
                sand = mix(sand, uGRoot * 1.05, gStraw(q / 0.34 + 3.3, 0.085, 0.0, 0.3) * near * 0.85);
                sand = mix(sand, uGSilt * 1.2, gStraw(q / 0.47 + 9.1, 0.13, 0.25, 0.28) * near * 0.8);
              }
              laid = mix(laid, sand, k.x);
            }
            if (k.y + k.z + k.w > 0.01) {
              // reed litter: short pale straws lying every way
              float litter = mid > 0.0 ? max(gStraw(q / 0.36, 0.022, 1.0, 0.7), 0.8 * gStraw(q / 0.15 + 7.7, 0.045, 1.0, 0.7)) * mid * uGPlay.w : 0.0;
              vec3 straw = uGStraw * (0.7 + 0.5 * n3);
              if (k.y > 0.01) {
                // the fen's floor: peat strewn with cut straw
                vec3 fen = albedo * (0.75 + 0.5 * n1);
                laid = mix(laid, mix(fen, straw, max(litter, smoothstep(0.6, 0.75, n2) * 0.5 * mid) * 0.7), k.y);
              }
              if (k.w > 0.01) {
                // peat, at the reeds' feet: dark mud, litter thick on it above the water and thin under it; where the water
                // has washed a reed bed's own margin, the pale roots: fibres running down the slope of the bank into the water
                vec3 peat = albedo * (0.8 + 0.35 * n1);
                peat = mix(peat, straw, litter * (0.25 + 0.6 * smoothstep(-0.02, 0.05, gy)));
                if (near > 0.0 && vLEdge.z > 0.3 && gy < 0.02 && gy > -0.26) {
                  vec2 gDown = N.xz; float gDl = length(gDown); gDown = gDl > 0.02 ? gDown / gDl : vec2(1.0, 0.0);
                  float root = smoothstep(0.62, 0.70, lNoise(vec2(dot(q, vec2(-gDown.y, gDown.x)) * 70.0 + 3.0 * lNoise(q * 5.0), dot(q, gDown) * 3.0) + 31.0));
                  root *= (1.0 - smoothstep(-0.04, 0.02, gy)) * smoothstep(-0.26, -0.08, gy) * smoothstep(0.02, 0.06, gDl) * near * smoothstep(0.3, 0.7, vLEdge.z);
                  peat = mix(peat, uGRoot, root * 0.5);
                }
                laid = mix(laid, peat, k.w);
              }
              if (k.z > 0.01) {
                // turf: olive and straw, never a lawn (in the evening sun a plain green is the one colour here that
                // shouts); the hard: trodden, strewn with straw
                vec3 turf = albedo * mix(vec3(0.74, 0.76, 0.66), vec3(1.25, 1.06, 0.74), smoothstep(0.25, 0.75, n2)) * (0.86 + 0.3 * n3 * mid);
                turf = mix(turf, straw * 0.9, 0.3 * smoothstep(0.5, 0.8, lNoise(q * 1.7 + 51.0)) + litter * 0.35);
                turf = mix(turf, straw, vLEdge.y * (0.25 + 0.5 * smoothstep(0.35, 0.7, n1)));
                laid = mix(laid, turf, k.z);
              }
            }
          }
          // land is dark where it is wet: the hand's breadth above the water, and all that is under it
          albedo = laid * (1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.07 + 0.05 * n2, gy))); }`,
      // the light of the water plays on the bed where it is shallow: strong where the sun reaches, faint in the shade
      light: /* glsl */`
        { float gUnder = (1.0 - smoothstep(-0.05, 0.0, vWPos.y)) * smoothstep(-1.5, -0.45, vWPos.y);
          if (gUnder > 0.0) {
            // (it follows the water: quiet under still water, lively where a wake or a ring is passing over the bed)
            vec2 gR = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
            float gLive = (gR.x > 0.0 && gR.x < 1.0 && gR.y > 0.0 && gR.y < 1.0) ? clamp(texture2D(tRipple, gR).a * 4.0, 0.0, 1.0) : 0.0;
            // THE SKY'S OWN LIGHT ON A SHALLOW BED (stage 2, second holder). At this hour no sun reaches the water of the
            // backwater at all (the reeds' shade is 55 m long): what lights the sand beside the staithe is the whole gold
            // western sky, a great soft lamp. It was missing: the bed there was lit as a thing in shade on dry land, and
            // "over the side" was brown murk. Where a deck stands over the water (the staithe, the jetty) that light is
            // kept off: a soft dark under the planks, which is what makes the lit sand beside it read as lit.
            float gDeck = 0.0;
            for (int i = 0; i < 2; i++) { vec2 r = vWPos.xz - uGDeck[i].xy, t = uGDeck[i].zw; float d = max(abs(dot(r, t)) - uGDeckSize[i].x, abs(dot(r, vec2(-t.y, t.x))) - uGDeckSize[i].y); gDeck = max(gDeck, 1.0 - smoothstep(-0.2, 0.45, d)); }
            float gOpen = 1.0 - gDeck * uGDeckSize[0].z;
            c += uGPlayColor * (min(causticAt(vWPos.xz * 0.9, uTime * 0.45), 3.0) * gUnder * uGPlay.x * (0.55 + 0.9 * gLive) * mix(uGPlay.y, 1.0, lSun)) * (0.3 + 0.7 * albedo) * gOpen;
            c += albedo * uGSky * (gUnder * gOpen * (1.0 - 0.7 * lSun));
            c *= 1.0 - 0.45 * gDeck * uGDeckSize[0].z * gUnder;
          } }`,
    };
    const ground = new THREE.Mesh(geo, kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.9, extend: [L.extend({ rim: 0.2, soft: 0.6 }), laid] }));
    ground.name = 'ground'; ground.frustumCulled = false; ctx.add(ground);
    shared.set = { ground };

    // ---- the grass on the turf (stage 2). Bare, a turf bank is a smooth olive mound: the tongue of bank where the
    // left palisade begins, as the fen sees it, was a putting green. Tufts of grass stand on every turf bank the boat
    // comes near (thick), and on the far turf bank at the bridge's left end and the hard (thin, larger), so that the
    // land has an edge of blades against the light. They are plants: the area's wind and rim (L.plant).
    const TG = P.turfGrass;
    if (TG && TG.near > 0) {
      const rnd = ctx.rng(57), list = [], geoT = new L.Geo(), base = '#3E4222', tip = '#A89850';
      // (eight thin blades to a tuft, each one tapering strip, leaning every way; some dry. Four broad ones, as first
      // tried, were a row of yellow agaves on the bank a metre from the eye. Two triangles a blade: 16 a tuft.)
      for (let b = 0; b < 8; b++) {
        const a = b / 8 * Math.PI * 2 + rnd() * 1.2, lean = 0.08 + rnd() * 0.42, h = 0.45 + rnd() * 0.55, w = 0.009 + rnd() * 0.007, r = 0.005 + rnd() * 0.05, dry = rnd() < 0.3;
        const dx = Math.cos(a), dz = Math.sin(a), px = -dz * w, pz = dx * w, ct = dry ? '#C2AA62' : tip, cb = dry ? '#6A5E30' : base;
        const p0 = [dx * r, 0, dz * r], p2 = [dx * (r + lean), h, dz * (r + lean)];
        geoT.quad([p0[0] - px, 0, p0[2] - pz], [p0[0] + px, 0, p0[2] + pz], [p2[0] + px * 0.12, p2[1], p2[2] + pz * 0.12], [p2[0] - px * 0.12, p2[1], p2[2] - pz * 0.12], [cb, cb, ct, ct]);
      }
      const gq = {}, tints = ['#ffffff', '#E4D8B0', '#C8C8A0', '#F0E2BC', '#B4B490'];
      const sow = (s0, s1, d0, d1, perM2, size) => {
        const n = Math.round(Math.abs(s1 - s0) * Math.abs(d1 - d0) * perM2);
        for (let i = 0; i < n; i++) {
          const s = s0 + (s1 - s0) * rnd(), d = d0 + (d1 - d0) * rnd(), p = P.at(path, s, d, 0), q = P.ground(path, p[0], p[2], gq), keep = rnd(), sc = size * (0.7 + 0.6 * rnd());
          if ((q.kind !== 'turf' && q.kind !== 'hard') || q.y < 0.04 || (q.kind === 'hard' && keep > 0.5)) continue;
          list.push({ x: p[0], y: q.y - 0.02, z: p[2], turn: rnd() * 6.283, tiltX: (rnd() - 0.5) * 0.3, tiltZ: (rnd() - 0.5) * 0.3, scale: [sc, sc * (0.8 + 0.5 * rnd()), sc], color: tints[Math.floor(rnd() * tints.length)] });
        }
      };
      const hw = (s) => path.at(Math.min(path.length, s)).halfWidth;
      for (let s = 55; s < 84; s += 1) { sow(s, s + 1, -(hw(s) + 0.25), -(hw(s) + 5.6), TG.near, TG.height); sow(s, s + 1, hw(s) + 0.25, hw(s) + 5.2, TG.near, TG.height); }
      sow(P.bridge.s - 4.5, P.bridge.s + 4.5, P.bridge.left.bank + 1.5, P.bridge.left.bank - 34, TG.far, TG.height * 2.2);
      for (const [rs, rd] of P.farRicks.at) sow(rs - 8, rs + 8, rd - 8, rd + 8, TG.far, TG.height * 2.0);
      const geo2 = geoT.build();
      shared.set.turfGrass = L.grow('turf grass', geo2, L.plant({ tall: 0.9, backlight: 0.25, rim: 0.6 }), list, { cell: 64, margin: 0.4, mirror: false });
      for (const m of shared.set.turfGrass) m.name = 'turf grass';      // (it is real, not a stand-in: L.grow names what it makes 'standin:')
      if (shared.counts) shared.counts['turf grass'] = { count: list.length, triangles: list.length * geoT.triangles };
    }
  }

  // ============================================================================================ the air
  // A little gold mist lying on the water (the page: start state). The height fog of look.light is that mist. The
  // cards that were to give it body over the mere and the fen are off (PLAN.mist.opacity 0): they were the area's milk.
  if (P.mist && P.mist.opacity > 0) kit.mist({ ...P.mist });

  // ============================================================================================ the lamp in daylight
  // The engine's lamp, unchanged, is a glass six pixels wide from the mooring, 16 m off, and three pixels of the
  // water's mirror: in daylight it is lost, and the water has nothing to grow a stroke from (1-layout.md, with
  // pictures). So, from far off only: a wider halo and a small bright core in the direct view, and a halo given to
  // the mirror alone, from which the water draws the stroke. All three go as the boat comes near (gone by 6 m),
  // where the lamp's own halo is large enough.
  const aids = [];
  if (shared.lamp && P.lamp.daylight) {
    const K = P.lamp, D = K.daylight, p = L.at(K.at[0], K.at[1], 2.26), at = [p.x, p.y, p.z];
    const add = (o, where) => { const g = kit.glow({ position: at, color: o.color, size: o.size, intensity: 1 }); if (where) ctx.only(g, where); g.name = 'lamp in daylight: ' + o.name; aids.push({ glow: g, base: new THREE.Color(o.color).multiplyScalar(o.intensity) }); };
    add({ name: 'halo', color: D.halo[2] || '#FFB45E', size: D.halo[0], intensity: D.halo[1] }, 'direct');
    add({ name: 'core', color: D.core[2] || '#FFE2A8', size: D.core[0], intensity: D.core[1] }, 'direct');
    add({ name: 'stroke (mirror only)', color: D.stroke[2] || '#FFB45E', size: D.stroke[0], intensity: D.stroke[1] }, 'mirror');
    aids.at = p; aids.fade = D.fade;
  }

  // ============================================================================================ the sun in the reeds, and behind the cloth
  // The sun stands behind reed beds forty metres deep and, on the last straight, behind the cloth: its spot on the sky
  // (above) is hidden wherever something solid stands in front of it, which from the water is nearly everywhere. So
  // its bloom is put where the eye can have it: one soft light IN the reeds (or just in front of the cloth) on the
  // line from the eye to the sun, 2.5 m inside the bed. It tests depth, so the bank's outer stems, the bridge, the
  // traps and the pilings stand dark against it and everything behind them burns; the water mirrors it, broken by the
  // same stems. No disc, no edge, no rays; wide and soft, so that no stem crossing it can make the picture flicker.
  // (The first layout lit the reeds' own surfaces instead, near and far alike: a bank of pale fog. 1-layout.md)
  const G = P.sunGlow, bloomGeo = new THREE.PlaneGeometry(2, 2);
  /**
   * One soft light. o: gain, radius (degrees), heart (the share of the radius its pale heart takes; 0 = none: a plain
   * soft swell), core, rim (colours), depthTest; and, for a GLARE: take (0..1: how much of what stands behind it the
   * light takes at its middle) and heartGain (the brightness of the heart, above 1).
   * (Stage 2. A light that is only ADDED to what stands behind it takes that thing's colour into itself: cream added to
   * forty metres of olive-brown reed was a bank of grey-white fog. A glare takes the place of what is behind it: where
   * the sun stands, the far reeds are gone into gold, and the near stems, drawn before it, stand black against it.)
   */
  const makeBloom = (name, o) => {
    const u = { uCentre: { value: new THREE.Vector3(0, -99, 0) }, uSize: { value: 1 }, uGain: { value: new THREE.Vector2(0, 0) }, uCore: { value: col(o.core ?? G.core) }, uRim: { value: col(o.rim ?? G.rim) }, uVeil: S.uVeil,
      uAcross: { value: new THREE.Vector3(...(o.across || [1, 0, 0])) }, uTake: { value: o.take ?? 0 }, uTop: { value: 99 } };      // (uTop: the height above which the light fades out: the tops of the reeds it stands in)
    // (it faces the eye; with `across` it lies instead in an upright plane along that direction: the light on the cloth
    // lies in the cloth's own plane, or the side of it that leans away from the eye is cut off by the cloth)
    // (blending: the light is added, and what is behind it is kept by (1 - alpha); the picture's own alpha, which carries
    // the marks of thin things for the painter's filter, is left as it is)
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, depthTest: o.depthTest !== false, fog: false,
      // (through: the light comes THROUGH what is behind it and takes its drawing: out = behind x (1 + light). Added to
      // a cloth it lays one flat light over fold and ridge alike, and the lit cloth is a blank board; multiplied, every
      // fold keeps its own dark, and the gaps between the bolts, where the sky is, brighten with them.)
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: o.through ? THREE.DstColorFactor : THREE.OneFactor, blendDst: o.through ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      // (vY: the height above the water of each point of it. The light stops at the water: the water writes no depth, so
      // the half of the light that hangs below the surface would be drawn over the far water, and over the boat's bow.
      // What the water shows of it is its mirror image, which the mirror pass draws.)
      vertexShader: /* glsl */`uniform vec3 uCentre, uAcross; uniform float uSize; varying vec2 vQ; varying float vY;
        void main() { vQ = position.xy;
          ${o.across ? 'vY = uCentre.y + position.y * uSize; gl_Position = projectionMatrix * viewMatrix * vec4(uCentre + uAcross * (position.x * uSize) + vec3(0.0, position.y * uSize, 0.0), 1.0);'
            : 'vY = uCentre.y + (viewMatrix[1][0] * position.x + viewMatrix[1][1] * position.y) * uSize; vec4 mv = viewMatrix * vec4(uCentre, 1.0); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv;'} }`,
      fragmentShader: /* glsl */`uniform vec3 uCore, uRim; uniform vec2 uGain; uniform float uVeil, uTake, uTop; varying vec2 vQ; varying float vY;
        void main() {
          float r = length(vQ); if (r >= 1.0 || vY <= 0.0) discard;
          float core = ${o.heart > 0 ? `exp(-pow(r / ${o.heart.toFixed(3)}, 2.0))` : '0.0'};
          float swell = 1.0 - r * r; swell = swell * swell * swell;                // (rounded at its top: a pointed one is a star)
          // orange at its edge, gold in its body, pale only at its heart. (A strong narrow heart on a weak skirt is a ball
          // of light, and where few reeds stand in front of it, on low quality for one, a ball is a disc: the body carries it.)
          vec3 c = ${o.heart > 0 ? 'mix(uRim, uCore, clamp(core + swell * 0.3, 0.0, 1.0)) * (uGain.x * swell + uGain.y * core)' : 'mix(uRim, uCore, swell) * swell * uGain.x'};
          // (third holder: THE LIGHT IS IN THE REEDS, NOT OVER THEM. From the mooring the line to the sun meets the bed 43 m
          // off at the height of its plumes: the upper half of the light stood in the open sky above the reeds and the
          // bridge's deck, a pale ball resting on the bridge, the one thing the page forbids (a disc), and a second point
          // of light beside the kept lamp. It fades out over the tops of the reeds it stands in (uTop): what the sky has
          // of the sun is its own gold aureole.)
          float k = (1.0 - uVeil) * smoothstep(0.0, 0.3, vY) * (1.0 - smoothstep(uTop - 0.9, uTop + 0.7, vY));
          gl_FragColor = vec4(c * k, clamp(uTake * (swell * 1.5 + core), 0.0, 0.97) * k);
        }` });
    const mesh = new THREE.Mesh(bloomGeo, m); mesh.name = 'sun: ' + name; mesh.frustumCulled = false; mesh.renderOrder = 3; ctx.add(mesh);
    return { mesh, u, w: 0, D: 30, gain: o.gain, heartGain: o.heartGain ?? 0, take: o.take ?? 0, radius: (o.radius ?? G.radius) * RAD };
  };
  const inReeds = makeBloom('its bloom in the reeds', { gain: G.reeds, heartGain: G.reedsHeart ?? 0, heart: G.heart, take: G.take ?? 0 });
  // behind the cloth it is a wide plain swell of light with no heart at all: cloth scatters, and a bright heart there is
  // a disc (the page: no disc anywhere; the sun's coin through cloth is the reach's)
  const gate = L.frame(P.gate.s, {});
  // ---- THE LIGHT THROUGH THE DOOR'S CLOTH (PLAN.doorLight). Linen with the sun behind it is seen from its own shaded
  // side: what the eye gets is the light that comes THROUGH it, and cloth throws that light on, mostly straight ahead.
  // So how bright a place on the cloth is depends on one thing: the angle between the eye's ray to that place and the
  // way to the sun. Along the line to the sun the linen burns cream; a hand's width round it, honey; the far bolts and
  // the tops, nine metres up, stand in their own shade. One sheet in the door's plane, a step this side of the line,
  // does it to whatever is behind it (the cloth with all its folds, the slots of sky between the bolts, the far cloths
  // in the haze): out = behind x F(angle) + cream x glare(angle). It needs no knowledge of where the boat is: from the
  // mooring the cloth in the bridge's span glows toward the sun; on the straight the heart stands in it, low, where the
  // wet hems are; in the water it is mirrored as it must be (the mirror's own eye gives the mirror's own angle).
  // (As it was: a soft disc MULTIPLIED onto the cloth, 0.5 strong and 0.6 at its heart, on a cloth that was honey from
  // end to end: postcard I was nine flat mustard boards with a pale thumbprint. shared.set.sunBloom.onCloth is still
  // there for whoever reads it: its mesh and uniforms are this sheet's.)
  const DL = P.doorLight || {}, dSk = DL.skirt || [1.0, 24], dHt = DL.heart || [1.2, 7], dCr = DL.cream || [0.5, 9, '#FFF0D0'], dHz = DL.haze || [0, 26], dOff = DL.off ?? 0.8;
  const doorU = { uSun: { value: L.toSun }, uVeil: S.uVeil, uHeartW: { value: 0 },      // (uHeartW: how much of the sun stands behind the cloth, 0..1: its heart is the cloth's only then; beside the masts the reeds have it)
    uDoor: { value: new THREE.Vector4(DL.shade ?? 0.62, 0, P.gate.mast, P.gate.line) },                       // x: the cloth's own shaded side; y: its weight now; z, w: the masts, the line
    uLobe: { value: new THREE.Vector4(dSk[0], 1 / (dSk[1] * RAD), dHt[0], 1 / (dHt[1] * RAD)) },
    uShadeTint: { value: new THREE.Vector3(...(DL.shadeTint || [1, 1, 1])) }, uSkirtTint: { value: new THREE.Vector3(...(DL.skirtTint || [1, 1, 1])) }, uHeartTint: { value: new THREE.Vector3(...(DL.heartTint || [1, 1, 1])) },
    uGlare: { value: new THREE.Vector4(dCr[0], 1 / (dCr[1] * RAD), dHz[0], 1 / (dHz[1] * RAD)) }, uGlareColor: { value: col(dCr[2] || '#FFF0D0') } };
  const doorMeshes = (() => {
    const half = P.gate.mast + 1.6, top = P.gate.line + 1.0, cx = gate.x - gate.tx * dOff, cz = gate.z - gate.tz * dOff, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([cx - gate.rx * half, 0, cz - gate.rz * half, cx + gate.rx * half, 0, cz + gate.rz * half, cx + gate.rx * half, top, cz + gate.rz * half, cx - gate.rx * half, top, cz - gate.rz * half], 3));
    g.setAttribute('aD', new THREE.Float32BufferAttribute([-half, 0, half, 0, half, top, -half, top], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
    // Two sheets in one place: the first MULTIPLIES what is behind it (so every fold keeps its own dark, and the shade
    // can be warmer than the light: tea brown, not the khaki that honey linen turns when it is only dimmed); the second
    // ADDS the glare. (The picture's own alpha, which carries the painter's marks, is left as it is by both.)
    const make = (name, glare) => {
      const m = new THREE.ShaderMaterial({ uniforms: doorU, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, defines: glare ? { GLARE: '' } : {},
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: glare ? THREE.OneFactor : THREE.DstColorFactor, blendDst: glare ? THREE.OneFactor : THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
        vertexShader: /* glsl */`attribute vec2 aD; varying vec3 vP; varying vec2 vD;
          void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; vD = aD; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform vec3 uSun, uGlareColor, uShadeTint, uSkirtTint, uHeartTint; uniform vec4 uDoor, uLobe, uGlare; uniform float uVeil, uHeartW; varying vec3 vP; varying vec2 vD;
          void main() {
            if (vD.y <= 0.0) discard;                                    // (it stops at the water: what the water shows of it is its mirror image)
            float ang = acos(clamp(dot(normalize(vP - cameraPosition), normalize(uSun)), -1.0, 1.0));
            // (to the masts, and up to the line as it sags, no higher: above the line there is only sky, and the sky is not cloth)
            float top = uDoor.w - ${(+P.gate.sag).toFixed(3)} * (1.0 - min(1.0, (vD.x * vD.x) / (uDoor.z * uDoor.z)));
            float mask = (1.0 - smoothstep(uDoor.z - 0.5, uDoor.z + 0.6, abs(vD.x))) * (1.0 - smoothstep(top - 0.08, top + 0.07, vD.y)) * smoothstep(0.0, 0.3, vD.y);
            float v2 = uVeil * uVeil, k = mask * uDoor.y * (1.0 - v2 * v2);
            #ifdef GLARE
              gl_FragColor = vec4(uGlareColor * ((uGlare.x * uHeartW * exp(-pow(ang * uGlare.y, 2.0)) + uGlare.z * exp(-pow(ang * uGlare.w, 2.0))) * k), 1.0);
            #else
              vec3 F = uShadeTint * uDoor.x + uSkirtTint * (uLobe.x * exp(-pow(ang * uLobe.y, 2.0))) + uHeartTint * (uLobe.z * uHeartW * exp(-pow(ang * uLobe.w, 2.0)));
              gl_FragColor = vec4(mix(vec3(1.0), F, k), 1.0);
            #endif
          }` });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'sun: ' + name; mesh.frustumCulled = false; mesh.renderOrder = glare ? 3.1 : 3; ctx.add(mesh);
      return mesh;
    };
    return [make('its light through the cloth', false), make('its glare through the cloth', true)];
  })();
  const doorMesh = doorMeshes[0];
  const onCloth = { mesh: doorMesh, u: doorU, w: 0, heart: 0 };
  // ---- THE SAME LIGHT, IN THE CLOTH ITSELF (third holder). The two sheets above stand half a metre this side of the
  // cloth and reach to the line: from a low eye their top stands a hand to half a metre ABOVE the cloth against the sky
  // (parallax), and they darken the sky in every scallop between two pegs: a dark bar from mast to mast (the Reeds
  // group's finding, 2-kit-reeds.md). Light that comes through linen belongs to the linen. So, once the kit has hung the
  // door (shared.kit.cloth), the same rule (F by the angle to the sun, the cream glare) is written into the cloth's own
  // fragment shader, after its lamps and before its fog, and the sheets are put away: the sky between the bolts, the
  // masts and the line are no longer touched at all, and every bolt beyond the door takes it too. The engine's cloth has
  // no hook for an area's light (asked in the log): if its shader ever changes so that the line below is not found, the
  // sheets stay, as they were, and a warning says so. (&doorsheet=1: the sheets, to compare.)
  const doorIn = { done: false, tried: 0, k: new THREE.Vector4(DL.shade ?? 0.62, 0, 0, 0) };
  const doorInCloth = () => {
    const cl = shared.kit && shared.kit.cloth, m = cl && cl.material, find = 'c += albedo * lamps;';
    if (!m || typeof m.fragmentShader !== 'string' || !m.uniforms) return false;
    if (QS.get('doorsheet') === '1') { doorIn.tried = 99; return false; }
    if (!m.fragmentShader.includes(find)) { doorIn.tried = 99; console.warn('landing: the door\'s light stays on its sheets (the engine\'s cloth shader has changed: set.js, "THE SAME LIGHT, IN THE CLOTH ITSELF")'); return false; }
    Object.assign(m.uniforms, { uDoorSun: doorU.uSun, uDoorK: { value: doorIn.k }, uDoorLobe: doorU.uLobe, uDoorGlare: doorU.uGlare, uDoorGlareColor: doorU.uGlareColor,
      uDoorShadeTint: doorU.uShadeTint, uDoorSkirtTint: doorU.uSkirtTint, uDoorHeartTint: doorU.uHeartTint });
    m.fragmentShader = 'uniform vec3 uDoorSun, uDoorGlareColor, uDoorShadeTint, uDoorSkirtTint, uDoorHeartTint; uniform vec4 uDoorK, uDoorLobe, uDoorGlare;\n' + m.fragmentShader.replace(find, find + /* glsl */`
        { // (the landing's set.js: the light through the door's cloth, by the angle between the eye's ray and the way to the sun)
          float dAng = acos(clamp(dot(normalize(vWPos - cameraPosition), normalize(uDoorSun)), -1.0, 1.0));
          vec3 dF = uDoorShadeTint * uDoorK.x + uDoorSkirtTint * (uDoorLobe.x * exp(-pow(dAng * uDoorLobe.y, 2.0))) + uDoorHeartTint * (uDoorLobe.z * uDoorK.z * exp(-pow(dAng * uDoorLobe.w, 2.0)));
          c = mix(c, c * dF, uDoorK.y);
          c += uDoorGlareColor * ((uDoorGlare.x * uDoorK.z * exp(-pow(dAng * uDoorGlare.y, 2.0)) + uDoorGlare.z * exp(-pow(dAng * uDoorGlare.w, 2.0))) * uDoorK.y); }`);
    m.needsUpdate = true;
    return true;
  };
  // ...and a faint veil of the same light over everything, where the sun is (no depth test, set far off so that the
  // water mirrors it at the sun's own angle): what the eye sees of a sun it cannot see, wherever the bed is too deep
  // for anything else to show. It must stay faint: it lightens the silhouettes it lies on.
  const veil = makeBloom('its veil', { gain: G.veil, heart: 0, depthTest: false });
  const hit = {}, eye = S.uCameraPos.value;
  /** Where the line from the eye to the sun first meets something that hides it: { t (metres along the ground), kind: 'reeds' | 'cloth' | 'far', edge } */
  const firstHidden = (ex, ey, ez, out) => {
    const sx = L.toSun.x, sz = L.toSun.z, h = Math.hypot(sx, sz) || 1, ux = sx / h, uz = sz / h, rise = L.toSun.y / h;
    out.kind = 'far'; out.t = 150; out.edge = 1; out.top = 4.2;
    // the cloth of the door: a plane across the path at the gate
    const along = ux * gate.tx + uz * gate.tz, go = (ex - gate.x) * gate.tx + (ez - gate.z) * gate.tz;
    let tc = Infinity, gd = 0;
    if (along > 0.05 && go < -0.3) { tc = -go / along; gd = (ex + ux * tc - gate.x) * gate.rx + (ez + uz * tc - gate.z) * gate.rz; if (Math.abs(gd) > P.gate.mast || ey + rise * tc > P.gate.line) tc = Infinity; }
    for (let t = 2; t < 150; t += 1.25) {
      if (t > tc) break;
      const x = ex + ux * t, z = ez + uz * t, bed = P.reedBed(path, x, z, hit);
      if ((bed && bed.e > 0.2) || !P.inner(path, x, z)) { out.kind = bed && bed.e > 0.2 ? 'reeds' : 'far'; out.t = t; out.top = out.kind === 'reeds' ? P.reedHeight(bed, 0.5) : 4.2; return out; }
    }
    if (tc < 150) { out.kind = 'cloth'; out.t = tc; out.edge = sm(P.gate.mast, P.gate.mast - 4, Math.abs(gd)); }
    return out;
  };

  // (in the water the sun's light in the reeds is a part of itself, PLAN.sunGlow.mirror: the water shows a column of gold
  // in the reeds' dark mirror, not a second sun. The water's own hook for a look of the mirror's own: docs/water.md)
  if (ctx.water && ctx.water.onMirror && (G.mirror ?? 1) < 1) {
    const keep = new THREE.Vector2();
    ctx.water.onMirror(ctx.path, () => { keep.copy(inReeds.u.uGain.value); inReeds.u.uGain.value.multiplyScalar(G.mirror); }, () => { inReeds.u.uGain.value.copy(keep); });
  }
  shared.set = { ...shared.set, sky, far, skyU, lampAids: aids, sunBloom: { inReeds, onCloth, veil } };

  // ============================================================================================ by distance
  const holdS = QS.has('at_s') ? +QS.get('at_s') : null;        // &at_s=70: the light and water of that place wherever the boat is (developer)
  const el = { now: SUN.elevation }, hit2 = {};
  return {
    update(dt) {
      const s = holdS ?? ctx.s, t = sm(P.look.blend[0], P.look.blend[1], s / path.length);
      // the current: slow through the backwater and the mere, quicker down the straight
      ctx.look.current = ctx.look.currentNarrow = P.currentAt(s);
      // the sun sinks 0.6 of a degree; the sky warms and the cloud's lit flank brightens
      el.now = SUN.elevation + (SUN.elevationEnd - SUN.elevation) * t;
      L.sunDir(el.now, L.toSun);
      skyU.uTop.value.copy(skyFrom.top).lerp(skyTo.top, t); skyU.uMid.value.copy(skyFrom.mid).lerp(skyTo.mid, t); skyU.uHorizon.value.copy(skyFrom.horizon).lerp(skyTo.horizon, t);
      skyU.uPanoGlow.value = skyFrom.glow + (skyTo.glow - skyFrom.glow) * t;
      // the lamp's daylight halo, core and stroke: whole from far off, gone when the boat is near
      if (aids.length) { const k = sm(aids.fade[0], aids.fade[1], Math.hypot(ctx.boat.x - aids.at.x, ctx.boat.z - aids.at.z)) * (shared.lamp.lit ?? 1); for (const a of aids) a.glow.material.color.copy(a.base).multiplyScalar(k); }
      // the sun's bloom: in the reeds, or behind the cloth, on the line from the eye to the sun
      { const f = firstHidden(eye.x, eye.y, eye.z, hit2), k = 1 - Math.exp(-dt * 5), hsun = Math.hypot(L.toSun.x, L.toSun.z) || 1;
        const place = (b, D, want) => {
          b.D += (D - b.D) * (Math.abs(D - b.D) > 12 ? 1 : k); b.w += (want - b.w) * k;
          const d3 = b.D / hsun; b.u.uCentre.value.set(eye.x + L.toSun.x * d3, eye.y + L.toSun.y * d3, eye.z + L.toSun.z * d3);
          b.u.uSize.value = d3 * Math.tan(b.radius); b.u.uGain.value.set(b.gain * b.w, b.heartGain * b.w); b.u.uTake.value = b.take * b.w;
          b.mesh.visible = b.w > 0.004 && (b.gain > 0 || b.heartGain > 0);
        };
        const cloth = f.kind === 'cloth' ? f.edge : 0;
        // (where the line to the sun finds nothing near, the gap between the door's mast and the bridge's right tower, the
        // light stands far off and bare, with no stem before it: there it is held to a part of itself (sunGlow.far), or it
        // is a ball of white nine degrees across and its copy in the water a white bank: .shots/landing_l2_handover_crop.png)
        const bare = 1 - (1 - (G.far ?? 1)) * sm(38, 62, f.t);
        place(inReeds, f.kind === 'cloth' ? inReeds.D : f.t + (f.kind === 'reeds' ? G.inset : 1), f.kind === 'cloth' ? 1 - cloth : bare);
        if (f.kind !== 'cloth' && (G.inReedsOnly ?? 1)) { const U = inReeds.u.uTop, want = f.top ?? 4.2; U.value = U.value > 50 ? want : U.value + (want - U.value) * k; }      // (sunGlow.inReedsOnly: 0 lets the light stand over the reeds' tops again, as it did)
        // the light through the door's cloth: whole while the eye is this side of the door, gone as the bow comes to the sheet
        if (!doorIn.done && doorIn.tried < 40) { doorIn.tried++; doorIn.done = doorInCloth(); }
        { const go = (eye.x - gate.x) * gate.tx + (eye.z - gate.z) * gate.tz; onCloth.w = sm(dOff + 1.2, dOff + 2.6, -go); doorU.uDoor.value.y = onCloth.w; for (const m of doorMeshes) m.visible = !doorIn.done && onCloth.w > 0.003;
          doorIn.k.y = onCloth.w; doorIn.k.z = onCloth.heart;
          // (its heart is the cloth's only while the sun itself stands behind the cloth; as the line to the sun nears a mast the light in the reeds takes it over: the two together were one great white bank)
          onCloth.heart += (cloth - onCloth.heart) * k; doorU.uHeartW.value = onCloth.heart; }
        // ...and the linen's own glow (the engine's cloth: `backlight`): honey from afar (PLAN.gate.backlight), a wall of
        // light as the bow comes to it (doorLight.near), where the sheet above has to let go
        { const cl = shared.kit && shared.kit.cloth, ub = cl && cl.material && cl.material.uniforms && cl.material.uniforms.uBack, N = DL.near;
          if (ub && N) ub.value = P.gate.backlight + (N.backlight - P.gate.backlight) * sm(N.from, N.to, s); }
        place(veil, 400, 1); }
      // the last 26 m: the sun's path comes up on the water toward its azimuth, so the reach's molten track is forming under the cloth
      const W = ctx.waterLook.sun;
      W.strength = P.sunPath.strength * sm(P.sunPath.from, P.sunPath.to, s);
      W.dir[0] = L.toSun.x; W.dir[1] = 0.08; W.dir[2] = L.toSun.z;
    },
  };
}
