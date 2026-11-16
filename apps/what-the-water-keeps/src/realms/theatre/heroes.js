// The theatre of leaves: the monument and the hero pieces.
//
// STAGE 1 (layout): every hero piece of the page's model list (section 9) stands here as a STAND-IN of the true size in
// the true place, one draw call each, carrying the triangles of its allowance (lib.js, &ballast=0 for plain solids).
// Whoever models a piece replaces its block with kit.model(..., { ...H.dress('gilt') }) and deletes the stand-in.
// The numbers are in plan.js; the house's light (H = shared.house) is explained in lib.js.
import * as THREE from 'three';
import { NOISE_GLSL } from '../../engine/kit.js';
import { at, house, solid, grid, wallAcross } from './lib.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  const H = house(ctx, plan, shared), V = (s, d, y) => at(ctx, s, d, y), show = shared.show || { c: -1 };
  const B = plan.beech, rnd = ctx.rng(44);

  // ---- STAND-IN for royal_wall.glb (22,000): the arch wall, 27 m wide and 2.4 m thick, three arches 7 m wide and 9 m high;
  // above them the royal box, an opening 6.6 m wide from 9.6 to 16 m under a carved canopy 8 m wide. Its top is the cornice.
  {
    const W = plan.archWall, R = W.royal;
    const wall = wallAcross(ctx, { s: W.s[0], thick: W.s[1] - W.s[0], width: W.width + 0.6, y0: -1.7, y1: W.top,
      openings: W.arches.map((d) => ({ d, w: W.archWidth, h: W.archHeight })), holes: [[[-R.width / 2, R.y[0]], [R.width / 2, R.y[0]], [R.width / 2, R.y[1]], [-R.width / 2, R.y[1]]]] });
    solid(ctx, shared, { name: 'royal_wall: arch wall and royal box', paint: 'gilt', tris: 22000, at: [W.s[1], 0, W.archHeight], high: 1.2, parts: [
      { mesh: wall },
      { box: [R.width + 1.6, R.y[1] - R.y[0] + 1.2, 0.35], at: [W.s[0] + 0.1, 0, R.y[0] - 0.6] },          // the back of the royal box
      { box: [R.canopy, 1.3, 0.9], at: [W.s[1] + 0.35, 0, R.y[1] - 0.1] },                                  // its canopy of carved drapery
      { box: [R.width, 0.55, 0.5], at: [W.s[1] + 0.2, 0, R.y[0] - 0.25] },                                  // and its front
    ] });
  }

  // ---- STAND-IN for proscenium.glb (30,000): 30 m wide (drawn 34, into the corners) and 19.6 m tall; the opening 24 by 16 m,
  // springing at 11 m; a reveal 1.6 m deep; plinths that go under the water.
  {
    const P = plan.proscenium, hole = [[-12, -1.69], [12, -1.69], [12, P.springing]];
    for (let i = 1; i < 24; i++) { const a = i / 24 * Math.PI; hole.push([12 * Math.cos(a), P.springing + 5 * Math.sin(a)]); }
    hole.push([-12, P.springing]);
    const wall = wallAcross(ctx, { s: P.s[0], thick: P.reveal, width: 34, y0: -1.7, y1: P.height, holes: [hole] });
    solid(ctx, shared, { name: 'proscenium', paint: 'gilt', tris: 30000, at: [P.s[0], 0, 16.5], high: 1.5, parts: [
      { mesh: wall }, { box: [3.2, 2.2, 2.0], at: [(P.s[0] + P.s[1]) / 2, -13.7, -1.5] }, { box: [3.2, 2.2, 2.0], at: [(P.s[0] + P.s[1]) / 2, 13.7, -1.5] },
      { box: [3.4, 2.4, 0.5], at: [P.s[0] - 0.2, 0, 16.6] },                                                // the blank shield in its wreath at the crown
    ] });
  }

  // ---- STAND-IN for stage_box.glb (14,000, mirrored): 8 m wide, 20 m tall, five levels over a parterre level, s 84 to 90
  {
    const parts = [];
    for (const sign of [-1, 1]) {
      const b = plan.stageBoxLevels.find((q) => q.side === sign), ns = -Math.cos(b.turn), nd = Math.sin(b.turn);
      parts.push({ box: [7.4, 21.4, 2.2], at: [b.s - ns * 2.6, b.d - nd * 2.6, -1.6], turn: b.turn });      // the body behind the openings
      for (const e of [-1, 1]) parts.push({ box: [0.7, 21.2, 2.4], at: [b.s - ns * 1.2 + nd * e * 3.5, b.d - nd * 1.2 - ns * e * 3.5, -1.6], turn: b.turn });   // its two piers
    }
    solid(ctx, shared, { name: 'stage_box x 2', paint: 'gilt', tris: 28000, parts, at: [87, -14.5, 20], high: 1 });
  }

  // ---- STAND-IN for dome.glb (26,000): a saucer 34 m across, 26 to 36 m, with the tear; the ceiling painting on its panels.
  // (The painting is the `dome` picture of the page's list, which the kit's builder generates; until then: cloud drawn in code.)
  {
    const D = plan.dome, T = plan.tear, rows = [], rings = 56, seg = 232, inside = [];
    const high = (r) => D.ring + (D.crown - D.ring) * Math.cos(Math.min(1, r / D.radius) * Math.PI / 2);
    for (let j = 0; j <= rings; j++) {
      const r = D.radius * j / rings, row = [], ins = [];
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2; let s = D.s + Math.cos(a) * r, d = D.d + Math.sin(a) * r; const torn = plan.inTear(s, d);
        if (torn) {                                                        // a point the tear has taken is drawn out to the torn edge (or to the dome's ring, where the tear goes beyond it): the rim follows the tear, not the grid
          const ux = s - T.s, uz = d - T.d, l = Math.hypot(ux, uz) || 1; let lo = l, hi = 20;
          for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (plan.inTear(T.s + ux / l * m, T.d + uz / l * m)) lo = m; else hi = m; }
          s = T.s + ux / l * hi; d = T.d + uz / l * hi;
          const rr = Math.hypot(s - D.s, d - D.d); if (rr > D.radius) { s = D.s + (s - D.s) / rr * D.radius; d = D.d + (d - D.d) / rr * D.radius; }
        }
        row.push(V(s, d, high(Math.hypot(s - D.s, d - D.d)))); ins.push(torn);
      }
      rows.push(row); inside.push(ins);
    }
    // a cell is dropped only when the tear has taken all four of its corners
    const n = seg + 1, pos = [], idx = [];
    for (const r of rows) for (const p of r) pos.push(p.x, p.y, p.z);
    for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { if (inside[j][i] && inside[j][i + 1] && inside[j + 1][i] && inside[j + 1][i + 1]) continue; const a = j * n + i, b = a + 1, d = a + n, e = d + 1; idx.push(a, d, b, b, d, e); }
    const mesh = new THREE.BufferGeometry(); mesh.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mesh.setIndex(idx); mesh.computeVertexNormals();
    const painted = H.paint({ color: '#ffffff', side: THREE.DoubleSide, take: [0, 0, 2.4, 5], brush: 0.9, extend: {
      fragmentPars: NOISE_GLSL,
      albedo: /* glsl */`{ vec2 q = vWPos.xz * 0.13; float n = fbm(q) * 0.6 + fbm(q * 2.7 + 3.1) * 0.4, m = fbm(q * 0.55 + 9.0);
        vec3 depth = vec3(0.070, 0.150, 0.165), cloud = mix(vec3(0.50, 0.58, 0.55), vec3(0.50, 0.36, 0.38), smoothstep(0.42, 0.7, m));
        albedo = mix(depth, cloud, smoothstep(0.40, 0.58, n)) * (0.82 + 0.3 * fbm(q * 9.0)); }` } });
    solid(ctx, shared, { name: 'dome (with the tear)', paint: painted, parts: [{ mesh }], at: [D.s, 6, D.crown - 2], high: 1 });
  }

  // ---- beech_trunk.glb and beech_crown.glb STAND in tree.js (the monument's own module: src/realms/theatre/tree.js,
  // docs/build/theatre/2-monument.md). Their stand-ins, and the fire in the tree, were here.
  // ---- mound.glb and tree_chandelier.glb STAND in tree.js too (their stand-ins were here).

  // ---- STAND-IN for pelmet.glb (9,000): 25 by 2.4 m, seven swags of carved drapery; the curtain's lines pass behind it
  solid(ctx, shared, { name: 'pelmet', paint: 'gilt', tris: 9000, parts: [{ box: [plan.curtain.width, plan.curtain.pelmet, 0.45], at: [plan.curtain.s - 0.45, 0, 16 - plan.curtain.pelmet] }], at: [plan.curtain.s - 0.5, 4, 16], high: 0.3 });

  // ---- STAND-INS for cloud_car_a.glb (7,500) and cloud_car_b.glb (5,500, twice, one mirrored): scalloped boards on four ropes.
  // A follows the show (it starts down at c 20); B is shown low and C high. Their real travel is the cast's (a 60 s cycle each).
  const cars = plan.cloudCars.map((car, i) => {
    const w = car.width, m = solid(ctx, shared, { name: `cloud_car_${car.name.toLowerCase()}`, paint: 'pearl', tris: i ? 5500 : 7500, at: [car.s, 0, 0], high: 2, parts: [
      { box: [w, 1.5, 0.12], at: [car.s, 0, -0.4] }, { box: [w * 0.82, 1.9, 0.12], at: [car.s + 0.25, 0, -0.3] }, { box: [w * 0.6, 2.3, 0.12], at: [car.s + 0.5, 0, -0.2] },
      ...[-1, 1].flatMap((e) => [0.1, 0.45].map((k) => ({ pole: [0.02, 0.02], from: [car.s + k, e * w * 0.42, 1.2], to: [car.s + k, e * w * 0.42, 13] }))),
    ] });
    return { car, m, home: m.position.clone() };
  });
  const placeCar = (q, u) => { const d = q.car.from[0] + (q.car.to[0] - q.car.from[0]) * u, y = q.car.from[1] + (q.car.to[1] - q.car.from[1]) * u, p = V(q.car.s, d, y); q.m.position.set(q.home.x + (p.x - V(q.car.s, 0, 0).x), y, q.home.z); };
  placeCar(cars[1], 1); placeCar(cars[2], 0.1);

  // ---- STAND-IN for moon_box.glb (3,000): a tin drum 2.4 m across with a parchment face, on its wire from (117, -13.5, 2.0)
  // to (-2.5, 12.5). It begins to rise at c 20 and takes 80 s. Pearl, never yellow, never a face.
  const SM = plan.stageMoon;
  const moon = solid(ctx, shared, { name: 'moon_box', paint: H.paint('pearl', { emissive: '#C4D6D0', emissiveIntensity: 0 }), tris: 3000, at: [SM.s, 0, 0], high: 1.6,
    parts: [{ cyl: [SM.across / 2, SM.across / 2, 0.35], at: [SM.s, 0, 0], axis: 's', radial: 40 }] });
  const moonHome = moon.position.clone(), moonLight = ctx.light({ position: V(SM.s, SM.from[0], SM.from[1]), color: '#C4D6D0', radius: 17, intensity: 0 });
  solid(ctx, shared, { name: 'moon wire', paint: 'iron', parts: [{ pole: [0.012, 0.012], from: [SM.s, SM.from[0] - 2.2, SM.from[1] - 2.1], to: [SM.s, SM.to[0] + 3, SM.to[1] + 2.9] }], at: [SM.s, -8, 8], high: 0.5 });

  // ---- STAND-INS for harp.glb (6,000), bass.glb (3,500), timpani.glb (3,000), rostrum.glb (1,500): what stands out of the orchestra's water
  {
    const O = plan.orchestra, fl = plan.levels.orchestra;
    solid(ctx, shared, { name: 'harp', paint: 'gilt', tris: 6000, at: [O.harp[0], O.harp[1], 0.7], high: 0.3, parts: [{ pole: [0.09, 0.07], from: [O.harp[0], O.harp[1], fl], to: [O.harp[0] + 0.1, O.harp[1], fl + 1.9] }, { bar: [0.07, 0.16], from: [O.harp[0] + 0.1, O.harp[1], fl + 1.85], to: [O.harp[0] - 0.75, O.harp[1], fl + 1.5] }, { bar: [0.1, 0.3], from: [O.harp[0] - 0.8, O.harp[1], fl + 1.5], to: [O.harp[0] - 0.25, O.harp[1], fl] }] });
    solid(ctx, shared, { name: 'bass', paint: 'timber', tris: 3500, at: [O.bass[0], O.bass[1], 0.8], high: 0.3, parts: [{ box: [0.7, 1.15, 0.3], at: [O.bass[0], O.bass[1], fl] }, { pole: [0.05, 0.035], from: [O.bass[0], O.bass[1], fl + 1.1], to: [O.bass[0] + 0.1, O.bass[1], fl + 2.0] }] });
    solid(ctx, shared, { name: 'timpani', paint: 'copper', tris: 3000, at: [O.timpani[0], O.timpani[1], 0.2], high: 0.3, parts: [{ cyl: [0.3, 0.42, 1.3], at: [O.timpani[0] - 0.5, O.timpani[1], fl] }, { cyl: [0.26, 0.38, 1.28], at: [O.timpani[0] + 0.45, O.timpani[1] + 0.2, fl] }] });
    solid(ctx, shared, { name: 'rostrum (under water)', paint: 'timber', tris: 1500, at: [O.rostrum[0], O.rostrum[1], 0], high: 0.3, only: 'direct', parts: [{ box: [1.4, 0.5, 1.2], at: [O.rostrum[0], O.rostrum[1], fl] }, { bar: [0.6, 0.04], from: [O.rostrum[0] + 0.4, 0, fl + 0.9], to: [O.rostrum[0] + 0.75, 0, fl + 1.0] }, { pole: [0.03, 0.03], from: [O.rostrum[0] + 0.5, 0, fl + 0.5], to: [O.rostrum[0] + 0.55, 0, fl + 0.95] }] });
  }

  // ---- STAND-IN for foyer_stairs.glb (7,000, mirrored): twin stairs 2.2 m wide, from the first-tier corridor at s 9 down the
  // walls; the last ten steps, under the water, sweep in to the floor at s 23, d +-6.5.
  {
    const St = plan.foyer.stairs, parts = [];
    for (const sign of [-1, 1]) for (let i = 1; i < St.line.length; i++) { const a = St.line[i - 1], b = St.line[i]; parts.push({ bar: [St.width, 0.7], from: [a[0], sign * a[1], a[2] - 0.35], to: [b[0], sign * b[1], b[2] - 0.35] }); }
    for (const sign of [-1, 1]) parts.push({ box: [St.width, 0.4, 3.2], at: [7.6, sign * St.line[0][1], St.line[0][2] - 0.4] });        // the landing at the first-tier corridor
    solid(ctx, shared, { name: 'foyer_stairs x 2', paint: 'plaster', tris: 14000, parts, at: [14, -8.9, 2.5], high: 0.5 });
  }

  return {
    update() {
      const c = show.c;
      placeCar(cars[0], smooth(20, 38, c));
      const u = smooth(0, 1, Math.min(1, Math.max(0, (c - 20) / 80))), d = SM.from[0] + (SM.to[0] - SM.from[0]) * u, y = SM.from[1] + (SM.to[1] - SM.from[1]) * u, p = V(SM.s, d, y);
      moon.position.set(moonHome.x + (p.x - V(SM.s, 0, 0).x), y, moonHome.z);
      const on = smooth(19, 23, c);
      moon.material.uniforms.uEmissive.value.set('#93a39e').multiplyScalar(2.5 * on);      // (a plain disc at pearl x 2.5 burns out white: the real face is parchment with grey seas)
      moonLight.position.copy(p); moonLight.intensity = 0.55 * on;
    },
  };
}
