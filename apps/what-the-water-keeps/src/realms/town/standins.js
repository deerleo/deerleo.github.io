// The town below: a tool for stage 1's stand-ins, so that hundreds of plain solids cost a dozen draw calls and not
// hundreds. It goes when the last stand-in has been replaced by a model (heroes.js and kit.js say which stands for what).
//
//   const b = makeBatch(ctx, light);
//   b.box({ x, y, z, yaw, sx, sy, sz, color }, { lit: 1, where: 'under' | 'awash' })     // a box standing on (x, y, z): sx wide, sy tall, sz deep
//   b.cyl(...), b.cone(...), b.gable(...) (a roof: ridge along its X), b.ball(...)
//   b.beam([x, y, z], [x, y, z], thick, color, opts)                                     // a square rod from one point to another
//   b.flush()                                                                             // builds the instanced meshes
// where: 'under' = wholly under the water (kept out of the mirror); 'awash' = crosses the surface or stands above it
// (drawn in the mirror, and takes the page's water-light near the waterline).
import * as THREE from 'three';

export function makeBatch(ctx, light) {
  const lists = new Map();
  const add = (shape, o, opts = {}) => {
    const lit = opts.lit ?? 1, where = opts.where || 'under', key = `${shape}|${lit}|${where}|${opts.emissive || ''}|${opts.gain || ''}`;
    let l = lists.get(key); if (!l) lists.set(key, l = { shape, lit, where, emissive: opts.emissive, gain: opts.gain, top: opts.top, topGain: opts.topGain, y0: opts.y0, y1: opts.y1, items: [] });
    l.items.push(o);
  };
  const white = (geo) => { const n = geo.attributes.position.count; geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); return geo; };
  const GEO = {
    box: () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    cyl: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12).translate(0, 0.5, 0),
    cone: () => new THREE.ConeGeometry(0.5, 1, 12).translate(0, 0.5, 0),
    pyramid: () => new THREE.ConeGeometry(Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
    ball: () => new THREE.SphereGeometry(0.5, 12, 8).translate(0, 0.5, 0),
    rod: () => new THREE.BoxGeometry(1, 1, 1),                                  // centred, for beams
    gable: () => { const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 0, -0.5, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 1, 0, 0.5, 1, 0,
        -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0, 0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 1, 0], 3)); g.computeVertexNormals(); return g; },
  };
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color(), A = new THREE.Vector3(), B = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  const api = {
    box: (o, opts) => add('box', o, opts), cyl: (o, opts) => add('cyl', o, opts), cone: (o, opts) => add('cone', o, opts), pyramid: (o, opts) => add('pyramid', o, opts),
    ball: (o, opts) => add('ball', o, opts), gable: (o, opts) => add('gable', o, opts),
    /** a square rod from point a to point b ([x, y, z] each), `thick` on a side */
    beam: (a, b, thick, color, opts) => { A.fromArray(a); B.fromArray(b); const len = A.distanceTo(B); add('rod', { quat: new THREE.Quaternion().setFromUnitVectors(X, B.clone().sub(A).normalize()), x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, sx: len, sy: thick, sz: opts && opts.wide ? opts.wide : thick, color }, opts); },
    /** build everything added so far */
    flush() {
      const made = [];
      for (const l of lists.values()) {
        if (!l.items.length) continue;
        const mat = l.emissive ? light.emissive(l.emissive, l.gain ?? 1, { top: l.top, topGain: l.topGain, y0: l.y0, y1: l.y1, gouache: { vertexColors: true } }) : light.mat({ color: '#ffffff', vertexColors: true, lit: l.lit, water: l.where === 'awash' });
        const mesh = new THREE.InstancedMesh(white(GEO[l.shape]()), mat, l.items.length);
        l.items.forEach((o, i) => {
          if (o.quat) Q.copy(o.quat); else Q.setFromEuler(E.set(o.pitch || 0, o.yaw || 0, o.roll || 0, 'YXZ'));
          M.compose(V.set(o.x, o.y, o.z), Q, S.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1)); mesh.setMatrixAt(i, M); mesh.setColorAt(i, C.set(o.color || '#ffffff'));
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; mesh.name = `standins:${l.shape}:${l.where}`;
        ctx.add(mesh);
        if (l.where === 'under') ctx.only(mesh, 'direct');
        made.push(mesh);
      }
      lists.clear();
      return made;
    },
  };
  return api;
}

/** A frame standing at (s, d), turned to the route: at(ls, y, ld) -> [x, y, z], ls metres further down the route and ld metres further right. */
export function frameAt(town, s, d) {
  const [x, z] = town.xz(s, d), yaw = town.along(s), c = Math.cos(yaw), sn = Math.sin(yaw);
  return { x, z, yaw, at: (ls, y, ld) => [x + ls * c + ld * sn, y, z - ls * sn + ld * c] };
}
