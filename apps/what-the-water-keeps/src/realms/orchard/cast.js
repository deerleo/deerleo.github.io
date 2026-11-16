// The orchard in flood: everything alive and moving (stage 3). NOTHING LIVES YET. Stage 1 leaves here only still
// stand-ins of the animals that the postcards are composed round (so that scale and sight lines can be judged), and,
// with &crowd=1, the multitudes as still stand-ins at the planned counts (so that the cost can be measured).
//
// WHAT THE PAGE PUTS HERE (docs/art/orchard.md, section 5: read it for speeds, periods, answers, anatomy notes):
//   small   falling petals: 6,000 in a box 40 x 16 x 40 m that follows the boat, born only under blossom; a pin ring and a
//             tick where one lands near the boat; 60 at most on the foredeck                         (docs/life: falls)
//           fireflies: 7,000, and 2,500 larger ones for the mirror; none before s 140; sixty scouts from s 140; the waves
//             from s 160 (stage.js drives the fronts); dark within 5 m of the hull, 7 m of the kept lamp, 4 m of the stag,
//             2 m of an egret. MESHES on layer 0 (not kit.particles), so that the mirror draws them        (lights)
//           bats: 16; fourteen leave the loft at s 14; beats over each stretch; skimmers dip and write a pin ring   (birds)
//           midge columns: 6 of 250 at plan.midges, 2 to 4 m up, fading out between s 120 and 170              (insects)
//           bees coming home: 40 in the air, 12 on the boards, at the hives (152, +13.5); none after s 170     (insects)
//           lamp moths: 4, the engine's (already there, with the kept lamp in heroes.js)
//   middle  egrets: 6 (plan.egrets: four low ones with two or three stations in turn, two that roost in the oldest tree at
//             15 and 20 m); they flush at 14 m and land at the next station ahead, never nearer than 30 m    (waders)
//           carp: 24 in five groups (plan.carp), all dark; a weak trace over each back lifts the skin         (fish)
//           the stag: 1, on one unbroken walk west (plan.stag.walk), 30 to 45 m ahead of the boat, then across its bow,
//             then drinking at (207.5, +12.5); a lane behind him in the petals, a V at his chest            (beasts)
//           boughs and blossom: sway above 3 m only (the gouache's `sway`), sprays tremble, labels turn
//           things left: the crate, the loose plank, the fallen ladder and five baskets bob, drift and knock
//           roosted starlings: 300 on the upper limbs of the oldest tree, after the roost                     (birds)
//   vast    the murmuration: 12,000 starlings to start with (16,000 the ceiling), 3,000 (4,000) larger ones drawn only in
//             the mirror; from s 26 at 300 m, 25 degrees right of the axis; from s 70 at 140 m; at s 98 the roost  (birds)
//           the great petal fall: a second pool of 9,000 petals under the oldest tree's crown, for 16 s; it closes the
//             pond (shared.skin.set('pond', 0.2, 10)) and puts out the lamp's reflection
//           the dusk: set.js has it (shared.hour, 0 afterglow .. 1 blue hour; it advances only with travel)
//
// WHAT THEY WRITE ON THE WATER (page section 7) and what stage 1 leaves them:
//   ctx.water.ripple / ctx.water.trace as docs/water.md says. set.js writes up to 300 lines a frame into the trace (the
//   standing leads and the lane); the water takes 512: the cast has about 200 a frame. A lane or a window written over
//   a standing lead heals back down to it; written over the skin, it heals shut in plan.water.lane.close seconds.
//   shared.frame.at(s, d, y) is the page's frame; shared.here is the boat in it; shared.tree has the crown's lobes.
import * as THREE from 'three';
import { nameAt, Pile } from './standins.js';

const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, M = shared.mat;

  // ---- STAND-IN for `egret` (0.95 m tall standing; rigged on the ride's shared wader skeleton): the four low birds at
  // their first stations, the two that roost in the oldest tree. White shaded with lilac. They do not move yet.
  {
    const p = new Pile(), white = '#ece6ea';
    const bird = (s, d, y) => {
      p.box([s, d, y + 0.5], [0.16, 0.2, 0.42], white, 0.4, [0.5, 0]);                                  // body
      p.limb({ line: [[s, d, y + 0.56], [s + 0.07, d + 0.02, y + 0.78], [s + 0.02, d, y + 0.95]], thick: 0.05, radial: 5 }, white);       // the neck in its S
      p.limb({ line: [[s, d, y - 0.1], [s, d, y + 0.5]], thick: 0.02, smooth: false, radial: 4 }, '#2a1e2c');                              // legs
    };
    for (const stations of plan.egrets.low) bird(stations[0][0], stations[0][1], stations[0][0] === 216 ? plan.left.wall.showing : 0);
    for (const [s, d, y] of plan.egrets.roost) bird(s, d, y);
    // (for composing the gate, postcard 9: the white bird on the wall to the left)
    bird(216, -12, plan.left.wall.showing + 0.16);
    p.build(ctx, 'egret x6 (and one on the wall for postcard 9)', M.wood);
  }

  // ---- STAND-IN for `stag` (2.1 m long, 1.35 m at the withers; in a metre of water he shows 0.35 m of back as a low
  // island 1.2 m long, the neck rising at 45 degrees, the head carried level with the muzzle 1.0 m above the water,
  // antlers to 1.9 m). Dark plum. He does not walk yet: he is SET DOWN where the page's table puts him for a boat left
  // to the current (30 to 45 m ahead on the left; across the avenue during the tide; drinking at the gate), so that
  // every postcard he belongs to can be composed. Stage 3 replaces this with the rig and his one unbroken walk.
  {
    const p = new Pile(), dark = '#2a1e2c';
    p.box([0, 0, -0.5], [0.5, 0.85, 1.25], dark);                                                       // the back, awash
    p.limb({ line: [[0.5, 0, 0.2], [0.95, 0, 0.72], [1.35, 0, 0.98]], thick: [0.3, 0.16], radial: 6 }, dark);                              // neck and head
    for (const side of [-1, 1]) {
      p.limb({ line: [[1.05, side * 0.1, 0.95], [0.75, side * 0.3, 1.45], [0.5, side * 0.38, 1.9]], thick: [0.045, 0.03], radial: 4 }, '#5a4a48');
      for (let k = 0; k < 4; k++) p.limb({ line: [[0.98 - k * 0.14, side * (0.14 + k * 0.07), 1.06 + k * 0.24], [1.02 - k * 0.1, side * (0.2 + k * 0.08), 1.3 + k * 0.2]], thick: 0.028, smooth: false, radial: 4 }, '#5a4a48');
    }
    const stag = p.build(ctx, null, M.wood);                  // built round the page's (0, 0): moved as a whole below
    stag.name = 'standin:stag';
    const walk = plan.stag.walk, seg = [], tmp = new THREE.Vector3();
    let total = 0; for (let i = 0; i < walk.length - 1; i++) { const l = Math.hypot(walk[i + 1][0] - walk[i][0], walk[i + 1][1] - walk[i][1]); seg.push(l); total += l; }
    const along = (u) => { u = Math.min(total, Math.max(0, u)); for (let i = 0; i < seg.length; i++) { if (u <= seg[i] || i === seg.length - 1) { const t = Math.min(1, u / seg[i]); return [walk[i][0] + (walk[i + 1][0] - walk[i][0]) * t, walk[i][1] + (walk[i + 1][1] - walk[i][1]) * t, Math.atan2(walk[i + 1][1] - walk[i][1], walk[i + 1][0] - walk[i][0])]; } u -= seg[i]; } };
    // the page's table: how far along his walk he is when a boat left to the current is at each s
    const table = [[60, 0], [96, 20.2], [134, 37], [160, 65], [172, 80], [180, 93.5], [189, 104], [204, total], [260, total]];
    const whereFor = (bs) => { if (bs <= table[0][0]) return 0; for (let i = 0; i < table.length - 1; i++) if (bs <= table[i + 1][0]) return table[i][1] + (table[i + 1][1] - table[i][1]) * (bs - table[i][0]) / (table[i + 1][0] - table[i][0]); return total; };
    shared.stagStandIn = { mesh: stag, at: new THREE.Vector3() };
    ctx.onUpdate(() => {
      const [s, d, a] = along(whereFor(shared.here.s));
      // (the stand-in was built round the page's origin, facing west: set it down and turn it to his heading)
      stag.position.copy(F.at(s, d, 0, tmp)); stag.rotation.y = -a + plan.heading(s);
      shared.stagStandIn.at.copy(tmp);
    });
    nameAt(ctx, 'stag (set down by the boat\'s place; see cast.js)', [207.5, 12.5, 1.6]);
  }

  // ---- &crowd=1: the multitudes as STILL stand-ins at the planned starting counts, so that their weight can be
  // measured before any of them exists (the roost seen from under the arch is the page's heaviest view): starlings in
  // their ribbon over the crown and their larger twins for the mirror, both pools of petals, the fireflies.
  if (Q.has('crowd')) {
    const rnd = ctx.rng(98), C = plan.count, tree = shared.tree, n = (v) => kit.count(v);
    // a starling: 6 triangles (a body and two wings of two planes each)
    const bird = new THREE.BufferGeometry();
    bird.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.1, 0.03, 0, 0.1, -0.03, 0, 0.1, 0, 0, -0.1, 0.03, 0.02, 0.1, -0.03, 0.02, 0.1,
      0.02, 0, -0.03, 0.1, 0.03, 0, 0.02, 0, 0.05, 0.1, 0.03, 0, 0.19, 0, 0.03, 0.02, 0, 0.05, -0.02, 0, -0.03, -0.02, 0, 0.05, -0.1, 0.03, 0, -0.1, 0.03, 0, -0.02, 0, 0.05, -0.19, 0, 0.03], 3));
    bird.computeVertexNormals();
    const dark = shared.paint({ color: plan.chip.plum, brush: 0, side: THREE.DoubleSide });
    const flock = (count, scale) => Array.from({ length: n(count) }, () => { const u = rnd(), a = u * 5.4, r = 36 - u * 26 + (rnd() - 0.5) * 9, y = 36 - u * 16 + (rnd() - 0.5) * 8; return { position: [tree.top.x + Math.cos(a) * r, y, tree.top.z + Math.sin(a) * r], rotation: [rnd(), rnd() * 6.283, rnd()], scale }; });
    kit.instances(bird, dark, flock(C.starlings, 1)).name = 'crowd:starling_fly';
    ctx.only(kit.instances(bird, dark, flock(C.starlingsMirror, 2)), 'mirror').name = 'crowd:starling_fly (mirror)';
    const petal = new THREE.BufferGeometry();
    petal.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.03, 0.02, 0.006, 0, 0, 0, 0.03, 0, 0, -0.03, 0, 0, 0.03, -0.02, 0.006, 0, 0, 0, -0.03, 0.02, 0.006, 0, 0.012, 0.01, -0.02, 0, 0, 0.03, -0.02, 0.006, 0, -0.012, 0.01, 0.02], 3));
    petal.computeVertexNormals();
    const pale = shared.paint({ color: plan.chip.white, brush: 0, side: THREE.DoubleSide, shade: 0.5 });
    const b = ctx.boat;
    ctx.only(kit.instances(petal, pale, Array.from({ length: n(C.petalsFall) }, () => ({ position: [b.x + (rnd() - 0.5) * 40, rnd() * 16, b.z + (rnd() - 0.5) * 40], rotation: [rnd() * 6, rnd() * 6, rnd() * 6], scale: 1 }))), 'direct').name = 'crowd:petal_fall';
    ctx.only(kit.instances(petal, pale, Array.from({ length: n(C.petalsGreatFall) }, () => { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 29; return { position: [tree.centre.x + Math.cos(a) * r, rnd() * 26, tree.centre.z + Math.sin(a) * r], rotation: [rnd() * 6, rnd() * 6, rnd() * 6], scale: 1 }; })), 'direct').name = 'crowd:petal_fall (the great fall)';
    const fly = new THREE.PlaneGeometry(0.06, 0.06);
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(plan.chip.firefly).multiplyScalar(3.5), side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false, fog: true });
    const flies = (count, scale) => Array.from({ length: n(count) }, () => { const s = 120 + rnd() * 96, row = [-28, -19, -10, 10, 19, 28][Math.floor(rnd() * 6)], p = plan.xz(s, row + (rnd() - 0.5) * 6); return { position: [p[0], 0.2 + Math.pow(rnd(), 2) * 6, p[1]], rotation: [rnd() * 6, rnd() * 6, 0], scale }; });
    ctx.only(kit.instances(fly, glow, flies(C.fireflies, 1)), 'direct').name = 'crowd:firefly';
    ctx.only(kit.instances(fly, glow, flies(C.firefliesMirror, 1.8)), 'mirror').name = 'crowd:firefly (mirror)';
  }
  return {};
}
