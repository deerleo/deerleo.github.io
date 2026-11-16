// Prop models built from primitives. Local origin: centre of the footprint, y=0 at the base, front = +z.
// Builders register: U.open (lid/door/drawer animation), U.search (hiding-spot animation),
// U.plate (where the lock is mounted) and U.lightAt (lamp glow position).
import * as THREE from 'three';
import { CATALOG } from './catalog.js';
import { BOOK_COLORS } from './levelops.js';
import { thingInfo, clockText } from './manifest.js';
import { TIER_COLORS } from './mergepuzzle.js';
import * as TX from './textures.js';

const mesh = (g, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
const box = (g, m, w, h, d, x = 0, y = 0, z = 0) => mesh(g, new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);
const cyl = (g, m, rTop, rBot, h, x = 0, y = 0, z = 0, seg = 20, open = false) => mesh(g, new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), m, x, y + h / 2, z);
const sph = (g, m, r, x = 0, y = 0, z = 0, seg = 18) => mesh(g, new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0)), m, x, y, z);
const plane = (g, m, w, h, x = 0, y = 0, z = 0) => { const o = mesh(g, new THREE.PlaneGeometry(w, h), m, x, y, z); o.castShadow = false; return o; };
const grp = (g, x = 0, y = 0, z = 0) => { const o = new THREE.Group(); o.position.set(x, y, z); g.add(o); return o; };
const facing = (o) => { o.rotation.x = Math.PI / 2; return o; }; // turn a cylinder's axis towards +z
const legs = (g, m, w, d, h, r = 0.025, inset = 0.05) => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, m, r, r * 0.7, h, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), 8); };

export function makeKit(pal) {
  const mats = [];
  const M = (color, r = 0.78, m = 0, extra) => { const mat = new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m, ...extra }); mats.push(mat); return mat; };
  const T = (map, extra) => { const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.85, ...extra }); mats.push(mat); return mat; };
  return { M, T, mats, pal, wood: M(pal.wood, 0.7), dark: M(pal.woodDark, 0.7), metal: M(pal.metal, 0.5, 0.55), steel: M(0x4a5154, 0.45, 0.7), brass: M(0xb8923a, 0.38, 0.75), fabric: M(pal.fabric, 0.95), accent: M(pal.accent, 0.7), black: M(0x1b1b1d, 0.55), cream: M(0xeee6d0, 0.85), void: M(0x0b0a09, 1) };
}

const B = {};

B.door = (g, K, c, U) => {
  box(g, K.dark, 0.09, 2.14, 0.16, -0.555); box(g, K.dark, 0.09, 2.14, 0.16, 0.555); box(g, K.dark, 1.2, 0.1, 0.16, 0, 2.08);
  plane(g, K.M(0xfff3cf, 1, 0, { emissive: 0xffe9b0, emissiveIntensity: 1.4 }), 1.02, 2.08, 0, 1.04, -0.06);
  const leaf = grp(g, -0.51, 0, 0.0);
  box(leaf, K.wood, 1.02, 2.07, 0.055, 0.51, 0, 0);
  for (const y of [0.18, 1.12]) for (const x of [0.27, 0.75]) box(leaf, K.dark, 0.36, 0.78, 0.02, x, y, 0.025);
  sph(leaf, K.brass, 0.045, 0.92, 1.02, 0.07);
  U.open = [{ obj: leaf, rot: [0, -1.85, 0] }];
  U.plate = { parent: leaf, pos: [0.76, 1.3, 0.045] };
};

B.window = (g, K, c, U, ctx) => {
  const view = ctx.theme.view === 'none' ? null : TX.viewTex(ctx.theme.view, ctx.rng);
  plane(g, view ? K.T(view, { emissive: 0xffffff, emissiveMap: view, emissiveIntensity: 0.55 }) : K.M(0x9fb6b8, 0.3), 1.18, 1.18, 0, 0.65, -0.03);
  for (const x of [-0.62, 0.62]) box(g, K.cream, 0.07, 1.3, 0.1, x, 0);
  for (const y of [0, 1.23]) box(g, K.cream, 1.3, 0.07, 0.1, 0, y);
  box(g, K.cream, 0.035, 1.2, 0.05, 0, 0.05); box(g, K.cream, 1.2, 0.035, 0.05, 0, 0.63);
  box(g, K.cream, 1.42, 0.04, 0.16, 0, -0.03, 0.03);
  if (view) for (const x of [-0.6, 0.6]) box(g, K.fabric, 0.22, 1.42, 0.05, x, -0.06, 0.06);
  if (view) cyl(g, K.brass, 0.012, 0.012, 1.5, 0, 0, 0, 8).rotation.z = Math.PI / 2, g.children[g.children.length - 1].position.set(0, 1.38, 0.06);
};

B.desk = (g, K, c, U) => {
  box(g, K.wood, 1.5, 0.05, 0.75, 0, 0.73);
  box(g, K.dark, 0.48, 0.71, 0.66, 0.46, 0.02); // drawer pedestal
  box(g, K.dark, 0.04, 0.73, 0.66, -0.7, 0); box(g, K.dark, 1.0, 0.4, 0.03, -0.22, 0.33, -0.3);
  const dr = grp(g, 0.46, 0.5, 0.33);
  box(dr, K.wood, 0.42, 0.19, 0.03, 0, -0.095, 0.015); box(dr, K.dark, 0.38, 0.15, 0.5, 0, -0.085, -0.25);
  cyl(dr, K.brass, 0.012, 0.012, 0.14, 0, -0.01, 0.045, 8).rotation.z = Math.PI / 2;
  for (const y of [0.08, 0.27]) { box(g, K.wood, 0.42, 0.17, 0.02, 0.46, y, 0.33); sph(g, K.brass, 0.016, 0.46, y + 0.085, 0.35, 8); }
  U.open = [{ obj: dr, pos: [0, 0, 0.34] }];
  U.plate = { parent: dr, pos: [0.13, 0.0, 0.032], s: 0.7 };
};

B.filing_cabinet = (g, K, c, U) => {
  box(g, K.metal, 0.5, 1.32, 0.6, 0, 0, -0.01);
  for (let i = 0; i < 3; i++) {
    const y = 0.05 + i * 0.42, dr = grp(g, 0, y, 0.3);
    box(dr, K.M(K.pal.metal, 0.5, 0.4), 0.44, 0.38, 0.025, 0, 0, 0.0); box(dr, K.steel, 0.16, 0.025, 0.03, 0, 0.26, 0.02); box(dr, K.cream, 0.12, 0.05, 0.01, 0, 0.16, 0.016);
    if (i === 2) { box(dr, K.steel, 0.4, 0.3, 0.5, 0, 0.02, -0.26); U.open = [{ obj: dr, pos: [0, 0, 0.36] }]; U.plate = { parent: dr, pos: [0.15, 0.3, 0.02], s: 0.75 }; }
  }
};

B.safe = (g, K, c, U) => {
  const body = K.M(0x2f3a3d, 0.5, 0.6);
  box(g, body, 0.75, 0.9, 0.62, 0, 0.05, -0.04);
  for (const x of [-0.3, 0.3]) for (const z of [-0.27, 0.2]) box(g, K.black, 0.1, 0.05, 0.1, x, 0, z);
  plane(g, K.void, 0.6, 0.76, 0, 0.5, 0.272);
  const door = grp(g, -0.33, 0.1, 0.275);
  box(door, K.M(0x3b484b, 0.45, 0.65), 0.66, 0.8, 0.06, 0.33, 0, 0.03);
  box(door, K.brass, 0.05, 0.2, 0.04, 0.56, 0.3, 0.08);
  for (const y of [0.12, 0.62]) cyl(door, K.steel, 0.025, 0.025, 0.12, 0.0, y, 0.03, 8);
  U.open = [{ obj: door, rot: [0, -1.9, 0] }];
  U.plate = { parent: door, pos: [0.3, 0.42, 0.062], s: 1.5 };
};

B.trunk = (g, K, c, U) => {
  const hide = K.M(0x5a3a26, 0.85);
  box(g, hide, 1.05, 0.38, 0.6);
  const lid = grp(g, 0, 0.38, -0.3);
  box(lid, hide, 1.05, 0.2, 0.6, 0, 0, 0.3);
  for (const x of [-0.3, 0.3]) { box(g, K.dark, 0.07, 0.385, 0.61, x); box(lid, K.dark, 0.07, 0.205, 0.61, x, 0, 0.3); }
  for (const x of [-0.5, 0.5]) for (const z of [-0.27, 0.27]) box(g, K.brass, 0.07, 0.07, 0.07, x, 0, z);
  box(lid, K.brass, 0.1, 0.07, 0.02, 0, 0, 0.605);
  for (const x of [-0.53, 0.53]) box(g, K.dark, 0.02, 0.04, 0.16, x, 0.24);
  U.open = [{ obj: lid, rot: [-1.25, 0, 0] }];
  U.plate = { parent: g, pos: [0, 0.24, 0.302], s: 1.1 };
};

B.crate = (g, K, c, U) => {
  const pine = K.M(0xb89462, 0.9), pineD = K.M(0x8f6f43, 0.9);
  box(g, pine, 0.7, 0.7, 0.7, 0, 0.01);
  for (const s of [-1, 1]) { box(g, pineD, 0.75, 0.09, 0.03, 0, 0.04, s * 0.36); box(g, pineD, 0.75, 0.09, 0.03, 0, 0.6, s * 0.36); box(g, pineD, 0.03, 0.09, 0.75, s * 0.36, 0.04); box(g, pineD, 0.03, 0.09, 0.75, s * 0.36, 0.6); box(g, pineD, 0.09, 0.7, 0.03, s * 0.3, 0.01, 0.36); }
  const lid = grp(g, 0, 0.71, -0.375);
  for (let i = 0; i < 4; i++) box(lid, i % 2 ? pine : pineD, 0.75, 0.035, 0.18, 0, 0, 0.095 + i * 0.187);
  for (const x of [-0.33, 0.33]) for (const z of [0.05, 0.7]) cyl(lid, K.steel, 0.012, 0.012, 0.01, x, 0.035, z, 6);
  U.open = [{ obj: lid, rot: [-1.3, 0, 0] }];
};

B.wardrobe = (g, K, c, U) => {
  box(g, K.dark, 1.15, 1.83, 0.56, 0, 0.08, -0.02); box(g, K.wood, 1.21, 0.06, 0.62, 0, 1.89); legs(g, K.dark, 1.1, 0.5, 0.08, 0.035);
  plane(g, K.void, 1.04, 1.7, 0, 1.0, 0.262);
  const open = [];
  for (const s of [-1, 1]) {
    const d = grp(g, s * 0.555, 0.12, 0.27);
    box(d, K.wood, 0.545, 1.74, 0.035, -s * 0.275, 0, 0.018); box(d, K.dark, 0.38, 1.4, 0.012, -s * 0.275, 0.17, 0.04); sph(d, K.brass, 0.022, -s * 0.5, 0.9, 0.06, 8);
    open.push({ obj: d, rot: [0, s * 1.7, 0] });
    if (s === 1) U.plate = { parent: d, pos: [-0.44, 1.05, 0.04] };
  }
  U.open = open;
};

B.locker = (g, K, c, U) => {
  const paint = K.M(K.pal.fabric, 0.55, 0.3);
  box(g, paint, 0.5, 1.8, 0.46, 0, 0, -0.02); plane(g, K.void, 0.42, 1.66, 0, 0.92, 0.212);
  const d = grp(g, -0.24, 0.04, 0.215);
  box(d, paint, 0.48, 1.72, 0.025, 0.24, 0, 0.013);
  for (let i = 0; i < 4; i++) box(d, K.black, 0.26, 0.012, 0.01, 0.24, 1.45 + i * 0.045, 0.028);
  box(d, K.steel, 0.03, 0.14, 0.03, 0.42, 0.85, 0.035);
  U.open = [{ obj: d, rot: [0, -1.8, 0] }];
  U.plate = { parent: d, pos: [0.3, 1.02, 0.027] };
};

B.curio = (g, K, c, U) => {
  box(g, K.dark, 0.5, 0.06, 0.5); box(g, K.wood, 0.36, 0.68, 0.36, 0, 0.06); box(g, K.dark, 0.56, 0.05, 0.56, 0, 0.74);
  box(g, K.dark, 0.52, 0.24, 0.52, 0, 0.79);
  for (const s of [-1, 1]) for (const t of [-1, 1]) box(g, K.brass, 0.04, 0.25, 0.04, s * 0.25, 0.79, t * 0.25);
  const lid = grp(g, 0, 1.03, -0.27);
  box(lid, K.wood, 0.54, 0.05, 0.54, 0, 0, 0.27);
  mesh(lid, new THREE.DodecahedronGeometry(0.06), K.brass, 0, 0.11, 0.27);
  U.open = [{ obj: lid, rot: [-1.2, 0, 0] }];
  U.plate = { parent: g, pos: [0, 0.91, 0.262], s: 1.5 };
};

B.wall_cabinet = (g, K, c, U) => {
  box(g, K.cream, 0.65, 0.7, 0.24, 0, 0, -0.02); plane(g, K.void, 0.56, 0.6, 0, 0.35, 0.102);
  const d = grp(g, -0.31, 0.03, 0.105);
  box(d, K.M(0xf4efe0, 0.6), 0.62, 0.64, 0.025, 0.31, 0, 0.013); sph(d, K.steel, 0.02, 0.56, 0.3, 0.04, 8);
  U.open = [{ obj: d, rot: [0, -1.8, 0] }];
  U.plate = { parent: d, pos: [0.3, 0.36, 0.027] };
};

B.vent = (g, K, c, U) => {
  plane(g, K.void, 0.5, 0.35, 0, 0.2, -0.02);
  const cover = grp(g, 0, 0, 0);
  for (const x of [-0.26, 0.26]) box(cover, K.metal, 0.03, 0.4, 0.03, x, 0, 0); for (const y of [0, 0.37]) box(cover, K.metal, 0.55, 0.03, 0.03, 0, y, 0);
  for (let i = 0; i < 6; i++) box(cover, K.metal, 0.5, 0.012, 0.035, 0, 0.055 + i * 0.058, 0).rotation.x = 0.5;
  for (const x of [-0.26, 0.26]) for (const y of [0.015, 0.385]) facing(cyl(cover, K.brass, 0.012, 0.012, 0.01, x, y - 0.005, 0.018, 6));
  U.open = [{ obj: cover, pos: [0.12, -0.19, 0.12], rot: [1.35, 0, 0.3] }];
};

B.lockbox = (g, K, c, U) => {
  const m = K.M(0x7a2e2a, 0.45, 0.45);
  box(g, m, 0.34, 0.11, 0.24);
  const lid = grp(g, 0, 0.11, -0.12);
  box(lid, m, 0.34, 0.05, 0.24, 0, 0, 0.12); box(lid, K.steel, 0.1, 0.015, 0.02, 0, 0.05, 0.12);
  U.open = [{ obj: lid, rot: [-1.3, 0, 0] }];
  U.plate = { parent: g, pos: [0, 0.055, 0.122], s: 0.62 };
};

B.rug = (g, K, c, U, ctx) => {
  const r = grp(g);
  const m = box(r, K.T(TX.rugTex(K.pal, ctx.rng), { roughness: 1 }), c.w, 0.016, c.d);
  m.castShadow = false;
  U.search = [{ obj: r, pos: [0.45, 0.0, 0.2], rot: [0, 0.3, 0] }];
};

B.painting = (g, K, c, U, ctx) => {
  plane(g, K.void, 0.5, 0.4, 0, 0.375, -0.028);
  const p = grp(g, -0.475, 0, 0);
  box(p, K.M(0x8a6a2f, 0.5, 0.4), 0.95, 0.75, 0.05, 0.475, 0, 0);
  plane(p, K.T(TX.paintingTex(K.pal, ctx.rng)), 0.8, 0.6, 0.475, 0.375, 0.027);
  U.search = [{ obj: p, rot: [0, -1.1, 0] }];
};

B.plant = (g, K, c, U, ctx) => {
  cyl(g, K.M(0xb5562f, 0.9), 0.22, 0.15, 0.34); cyl(g, K.M(0x3a2a1c, 1), 0.2, 0.2, 0.02, 0, 0.32);
  const top = grp(g, 0, 0.33, 0), leaf = K.M(0x3f7d3f, 0.8), leaf2 = K.M(0x2f6a35, 0.8);
  cyl(top, K.M(0x5a4a2a), 0.02, 0.03, 0.5, 0, 0, 0, 6);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + ctx.rng.next(), tilt = 0.5 + ctx.rng.next() * 0.6, h = 0.25 + (i % 3) * 0.18;
    const l = mesh(top, new THREE.SphereGeometry(0.2, 8, 6), i % 2 ? leaf : leaf2, Math.cos(a) * 0.17, h + 0.12, Math.sin(a) * 0.17);
    l.scale.set(0.42, 1, 0.12); l.rotation.set(Math.sin(a) * tilt, -a, -Math.cos(a) * tilt, 'YXZ');
  }
  const l = mesh(top, new THREE.SphereGeometry(0.2, 8, 6), leaf, 0, 0.72, 0); l.scale.set(0.4, 1, 0.14);
  U.search = [{ obj: top, rot: [0, 0, 0.3], pos: [0.05, 0, 0] }];
};

function seat(g, K, w, cushions, U) {
  box(g, K.dark, w, 0.12, 0.8, 0, 0.1, 0); legs(g, K.dark, w, 0.8, 0.1, 0.03, 0.07);
  box(g, K.fabric, w, 0.2, 0.74, 0, 0.2, -0.02);
  box(g, K.fabric, w, 0.5, 0.18, 0, 0.4, -0.32).rotation.x = -0.12;
  for (const s of [-1, 1]) box(g, K.fabric, 0.14, 0.42, 0.78, s * (w / 2 - 0.07), 0.22, 0);
  const cw = (w - 0.3) / cushions, soft = K.M(new THREE.Color(K.pal.fabric).multiplyScalar(1.18).getHex(), 0.95);
  for (let i = 0; i < cushions; i++) {
    const cu = grp(g, -w / 2 + 0.15 + cw * (i + 0.5), 0.4, -0.26);
    box(cu, soft, cw - 0.02, 0.1, 0.56, 0, 0, 0.3);
    if (i === ((cushions / 2) | 0)) U.search = [{ obj: cu, rot: [-0.7, 0, 0], pos: [0, 0.04, 0] }];
  }
}
B.armchair = (g, K, c, U) => seat(g, K, 0.9, 1, U);
B.sofa = (g, K, c, U) => seat(g, K, 1.8, 3, U);

B.bed = (g, K, c, U) => {
  box(g, K.dark, 2.0, 0.22, 0.95, 0, 0.1); legs(g, K.dark, 2.0, 0.95, 0.1, 0.04, 0.06);
  box(g, K.cream, 1.92, 0.16, 0.89, 0, 0.32); box(g, K.fabric, 1.3, 0.18, 0.93, 0.33, 0.325);
  box(g, K.wood, 0.06, 0.95, 0.95, -0.97, 0); box(g, K.wood, 0.06, 0.6, 0.95, 0.97, 0);
  const pil = grp(g, -0.9, 0.48, 0);
  box(pil, K.M(0xffffff, 0.95), 0.42, 0.11, 0.66, 0.25, 0, 0);
  U.search = [{ obj: pil, rot: [0, 0, 0.75], pos: [0, 0.03, 0] }];
};

B.coat_rack = (g, K, c, U) => {
  cyl(g, K.dark, 0.2, 0.23, 0.04); cyl(g, K.dark, 0.022, 0.028, 1.75, 0, 0.04, 0, 10); sph(g, K.dark, 0.04, 0, 1.8, 0, 10);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4, h = cyl(g, K.dark, 0.012, 0.012, 0.22, Math.cos(a) * 0.09, 1.55, Math.sin(a) * 0.09, 6); h.rotation.set(0, -a, -0.9, 'YXZ'); }
  const coat = grp(g, 0, 1.6, 0.12);
  const body = cyl(coat, K.M(0x4a3f33, 0.95), 0.1, 0.21, 0.95, 0, -0.98, 0.02, 10); body.scale.z = 0.5;
  for (const s of [-1, 1]) { const a = cyl(coat, K.M(0x443a2f, 0.95), 0.05, 0.06, 0.6, s * 0.2, -0.68, 0.02, 8); a.rotation.z = s * 0.16; }
  cyl(g, K.M(0x2b2b2b, 0.9), 0.13, 0.13, 0.015, -0.13, 1.66, -0.02, 14); cyl(g, K.M(0x2b2b2b, 0.9), 0.075, 0.085, 0.09, -0.13, 1.67, -0.02, 14);
  U.search = [{ obj: coat, rot: [0, 0, 0.28] }];
};

B.waste_bin = (g, K, c, U, ctx) => {
  const m = K.M(K.pal.metal, 0.6, 0.4, { side: THREE.DoubleSide });
  cyl(g, m, 0.17, 0.13, 0.4, 0, 0, 0, 16, true); cyl(g, m, 0.13, 0.13, 0.015);
  const p = grp(g, 0, 0.2, 0), paper = K.M(0xf1ead6, 1, 0, { flatShading: true });
  for (let i = 0; i < 5; i++) mesh(p, new THREE.IcosahedronGeometry(0.055, 0), paper, (ctx.rng.next() - 0.5) * 0.14, i * 0.04, (ctx.rng.next() - 0.5) * 0.14).rotation.set(i, i * 2, 0);
  U.search = [{ obj: p, pos: [0.08, 0.14, 0.05], rot: [0, 1, 0.3] }];
};

function globe(g, K, ctx, r, y, U) {
  const m = K.T(TX.globeTex(ctx.rng), { roughness: 0.5 });
  const tilt = grp(g, 0, y, 0); tilt.rotation.z = 0.25;
  mesh(tilt, new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m, 0, 0, 0);
  const top = grp(tilt, 0, 0, -r);
  mesh(top, new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 0, r);
  const ring = mesh(tilt, new THREE.TorusGeometry(r + 0.015, 0.008, 6, 30), K.brass, 0, 0, 0);
  ring.rotation.x = Math.PI / 2;
  if (U) U.search = [{ obj: top, rot: [-1.0, 0, 0] }];
}
B.floor_globe = (g, K, c, U, ctx) => {
  for (let i = 0; i < 3; i++) { const a = i * 2.094, l = cyl(g, K.dark, 0.02, 0.025, 0.75, Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15, 8); l.rotation.set(0, -a, 0.22, 'YXZ'); }
  cyl(g, K.dark, 0.1, 0.1, 0.03, 0, 0.7); globe(g, K, ctx, 0.25, 0.85, U);
};
B.desk_globe = (g, K, c, U, ctx) => { cyl(g, K.dark, 0.08, 0.1, 0.03); cyl(g, K.brass, 0.012, 0.012, 0.1, 0, 0.03, 0, 8); globe(g, K, ctx, 0.11, 0.24, null); };

B.gramophone = (g, K, c, U) => {
  box(g, K.wood, 0.5, 0.2, 0.5, 0, 0.62); legs(g, K.dark, 0.5, 0.5, 0.62, 0.025, 0.05); box(g, K.dark, 0.44, 0.03, 0.44, 0, 0.3);
  cyl(g, K.M(0x7a2e2a, 0.9), 0.17, 0.17, 0.012, -0.02, 0.82, 0.04, 24);
  const rec = grp(g, -0.02, 0.835, 0.04);
  cyl(rec, K.M(0x111111, 0.3), 0.16, 0.16, 0.006, 0, 0, 0, 28); cyl(rec, K.accent, 0.05, 0.05, 0.008, 0, 0, 0, 16);
  const horn = cyl(g, K.M(0xb8923a, 0.35, 0.75, { side: THREE.DoubleSide }), 0.24, 0.02, 0.5, 0.12, 0.92, -0.12, 20, true);
  horn.rotation.set(0.5, 0, -0.45);
  cyl(g, K.brass, 0.015, 0.015, 0.14, 0.19, 0.82, -0.18, 8);
  U.search = [{ obj: rec, pos: [-0.05, 0.16, 0.05], rot: [0.5, 0, 0.4] }];
};

function writing(K, ctx, opts) {
  const info = ctx.shown ? thingInfo(ctx.level, ctx.shown) : null;
  return K.T(TX.textTex({ ...opts, rng: ctx.rng, lines: info && info.lines, symbol: info && info.symbol }));
}
B.blackboard = (g, K, c, U, ctx) => {
  box(g, K.wood, 1.7, 1.05, 0.04, 0, 0, -0.02);
  plane(g, writing(K, ctx, { w: 1024, h: 600, bg: '#2f4a3c', fg: '#f4f1e6', chalk: true, size: 58, font: '"Segoe Print", "Comic Sans MS", cursive' }), 1.58, 0.93, 0, 0.525, 0.002);
  box(g, K.wood, 1.7, 0.03, 0.08, 0, -0.01, 0.0); box(g, K.cream, 0.08, 0.02, 0.02, 0.4, 0.02, 0.02);
};
B.noticeboard = (g, K, c, U, ctx) => {
  box(g, K.wood, 0.9, 0.7, 0.03, 0, 0, -0.015); plane(g, K.M(0xb98a56, 1), 0.82, 0.62, 0, 0.35, 0.001);
  const p = plane(g, writing(K, ctx, { w: 512, h: 400, size: 36 }), 0.5, 0.39, 0.12, 0.36, 0.006); p.rotation.z = 0.03;
  plane(g, K.M(0xe9dfb6, 1), 0.2, 0.26, -0.27, 0.42, 0.005).rotation.z = -0.08; plane(g, K.M(0xd9e4e0, 1), 0.2, 0.14, -0.27, 0.16, 0.005).rotation.z = 0.05;
  for (const [x, y] of [[0.12, 0.535], [-0.27, 0.53], [-0.27, 0.215]]) sph(g, K.accent, 0.012, x, y, 0.012, 8);
};
B.typewriter = (g, K, c, U, ctx) => {
  const m = K.M(0x26352f, 0.45, 0.3);
  box(g, m, 0.4, 0.07, 0.36); box(g, m, 0.36, 0.07, 0.16, 0, 0.07, -0.09);
  const keys = box(g, K.black, 0.34, 0.02, 0.16, 0, 0.08, 0.09); keys.rotation.x = 0.3;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) cyl(g, K.cream, 0.012, 0.012, 0.012, -0.14 + i * 0.035 + r * 0.008, 0.085 + (2 - r) * 0.016, 0.045 + r * 0.045, 8);
  cyl(g, K.black, 0.03, 0.03, 0.44, 0, 0, 0, 12).rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(0, 0.17, -0.1);
  const p = plane(g, writing(K, ctx, { w: 400, h: 400, size: 34, font: '"Courier New", monospace' }), 0.26, 0.26, 0, 0.32, -0.115); p.rotation.x = -0.18;
  p.material.side = THREE.DoubleSide;
};
B.ledger = (g, K, c, U, ctx) => {
  box(g, K.M(0x4a2b22, 0.8), 0.42, 0.012, 0.3);
  box(g, K.cream, 0.2, 0.02, 0.28, -0.102, 0.012).rotation.z = 0.04;
  box(g, K.cream, 0.2, 0.02, 0.28, 0.102, 0.012).rotation.z = -0.04;
  const p = plane(g, writing(K, ctx, { w: 512, h: 360, size: 38, font: '"Segoe Script", "Brush Script MT", cursive' }), 0.38, 0.265, 0, 0.037, 0); p.rotation.x = -Math.PI / 2;
};

const clockFace = (K, ctx) => K.T(TX.clockTex(ctx.shown ? clockText(ctx.lock.code) : null, ctx.shown && ctx.lock.symbol, ctx.rng), { roughness: 0.4 });
B.wall_clock = (g, K, c, U, ctx) => {
  facing(cyl(g, K.dark, 0.23, 0.23, 0.07, 0, 0.195, 0, 32));
  const f = mesh(g, new THREE.CircleGeometry(0.205, 32), clockFace(K, ctx), 0, 0.23, 0.037); f.castShadow = false;
};
B.grandfather_clock = (g, K, c, U, ctx) => {
  box(g, K.dark, 0.55, 0.45, 0.38); box(g, K.wood, 0.42, 1.0, 0.3, 0, 0.45); box(g, K.dark, 0.55, 0.52, 0.38, 0, 1.45); box(g, K.dark, 0.62, 0.08, 0.42, 0, 1.97);
  plane(g, K.void, 0.26, 0.82, 0, 0.95, 0.152);
  cyl(g, K.brass, 0.008, 0.008, 0.6, 0, 0.75, 0.16, 6); facing(cyl(g, K.brass, 0.07, 0.07, 0.015, 0, 0.7, 0.16, 20));
  const f = mesh(g, new THREE.CircleGeometry(0.21, 32), clockFace(K, ctx), 0, 1.71, 0.192); f.castShadow = false;
};

B.bookshelf = (g, K, c, U, ctx) => {
  const W = 1.3, H = 2.0, D = 0.38;
  for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) box(g, K.dark, 0.04, H, D, x);
  box(g, K.dark, W, 0.04, D, 0, H - 0.04); box(g, K.dark, W, 0.1, D); box(g, K.M(K.pal.woodDark, 0.9), W - 0.04, H - 0.1, 0.02, 0, 0.08, -D / 2 + 0.01);
  const shelves = [0.1, 0.5, 0.88, 1.26, 1.62];
  shelves.slice(1).forEach((y) => box(g, K.dark, W - 0.08, 0.03, D - 0.03, 0, y - 0.03, 0.005));
  const dull = [0x5b4636, 0x8a7f6a, 0x2f2f33, 0xcfc6b0, 0x6e6250, 0x40382c];
  const clue = ctx.shown && ctx.lock.colors;
  // lay out slots first so we know how many books fit, then deal the counted colours among fillers
  const slots = [];
  for (const y of shelves) { let x = -W / 2 + 0.06; while (x < W / 2 - 0.13) { const t = 0.05 + ctx.rng.next() * 0.03; slots.push({ x: x + t / 2, y, t, h: 0.22 + ctx.rng.next() * 0.1 }); x += t + 0.004; } }
  let cols = [];
  if (clue) ctx.lock.colors.forEach((cn, i) => { for (let k = 0; k < +ctx.lock.code[i]; k++) cols.push(new THREE.Color(BOOK_COLORS[cn]).getHex()); });
  while (cols.length < slots.length) cols.push(ctx.rng.pick(dull));
  cols = ctx.rng.shuffle(cols);
  const mats = {};
  slots.forEach((s, i) => { const col = cols[i]; mats[col] = mats[col] || K.M(col, 0.8); box(g, mats[col], s.t, s.h, 0.24, s.x, s.y, 0.02); });
  if (clue) { const p = plane(g, K.T(TX.plaqueTex(ctx.lock.colors, ctx.lock.symbol, BOOK_COLORS), { roughness: 0.5 }), 0.4, 0.1, 0, 0.855, D / 2 + 0.012); box(g, K.brass, 0.42, 0.115, 0.01, 0, 0.798, D / 2); p.renderOrder = 1; }
};

const dial = (K, ctx) => K.T(TX.radioTex(ctx.shown ? +ctx.lock.code : 0, ctx.shown && ctx.lock.symbol, ctx.rng), { emissive: 0xffe0a0, emissiveIntensity: 0.25 });
B.radio = (g, K, c, U, ctx) => {
  box(g, K.wood, 0.45, 0.24, 0.22); cyl(g, K.wood, 0.11, 0.11, 0.45, 0, 0, 0, 16).rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(0, 0.2, 0);
  plane(g, K.M(0xb89a62, 1), 0.36, 0.11, 0, 0.21, 0.112); for (let i = 0; i < 5; i++) box(g, K.dark, 0.36, 0.006, 0.01, 0, 0.17 + i * 0.02, 0.113);
  plane(g, dial(K, ctx), 0.3, 0.1, 0, 0.085, 0.112);
  for (const x of [-0.19, 0.19]) facing(cyl(g, K.dark, 0.022, 0.022, 0.03, x, 0.07, 0.115, 12));
};
B.radio_console = (g, K, c, U, ctx) => {
  box(g, K.wood, 0.9, 0.9, 0.45, 0, 0.15); legs(g, K.dark, 0.9, 0.45, 0.15, 0.03, 0.06); box(g, K.dark, 0.94, 0.03, 0.47, 0, 1.03);
  plane(g, K.M(0xb89a62, 1), 0.7, 0.42, 0, 0.42, 0.227); for (let i = 0; i < 7; i++) box(g, K.dark, 0.02, 0.42, 0.012, -0.3 + i * 0.1, 0.21, 0.228);
  plane(g, dial(K, ctx), 0.6, 0.2, 0, 0.84, 0.227);
  for (const x of [-0.36, 0.36]) facing(cyl(g, K.brass, 0.03, 0.03, 0.04, x, 0.82, 0.235, 14));
};

B.side_table = (g, K) => { box(g, K.wood, 0.55, 0.035, 0.55, 0, 0.565); legs(g, K.dark, 0.55, 0.55, 0.565, 0.022, 0.06); box(g, K.wood, 0.42, 0.02, 0.42, 0, 0.2); };
B.lab_bench = (g, K) => {
  box(g, K.M(0x2c3033, 0.5), 1.8, 0.05, 0.7, 0, 0.85); box(g, K.metal, 1.7, 0.03, 0.6, 0, 0.25);
  for (const x of [-0.85, 0.85]) for (const z of [-0.3, 0.3]) box(g, K.metal, 0.05, 0.85, 0.05, x, 0, z);
  box(g, K.metal, 1.7, 0.14, 0.03, 0, 0.7, 0.32); for (const x of [-0.5, 0, 0.5]) box(g, K.steel, 0.14, 0.02, 0.02, x, 0.76, 0.34);
};
B.chair = (g, K) => {
  box(g, K.wood, 0.44, 0.04, 0.44, 0, 0.44); legs(g, K.dark, 0.44, 0.44, 0.44, 0.02, 0.04);
  for (const x of [-0.19, 0.19]) box(g, K.dark, 0.035, 0.46, 0.035, x, 0.46, -0.2);
  box(g, K.wood, 0.42, 0.14, 0.03, 0, 0.74, -0.2); box(g, K.wood, 0.42, 0.05, 0.03, 0, 0.6, -0.2);
};
B.stool = (g, K) => { cyl(g, K.wood, 0.18, 0.18, 0.04, 0, 0.56); for (let i = 0; i < 3; i++) { const a = i * 2.094, l = cyl(g, K.metal, 0.015, 0.015, 0.58, Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12, 8); l.rotation.set(0, -a, 0.12, 'YXZ'); } mesh(g, new THREE.TorusGeometry(0.13, 0.008, 6, 20), K.metal, 0, 0.22, 0).rotation.x = Math.PI / 2; };
B.floor_lamp = (g, K, c, U) => {
  cyl(g, K.brass, 0.15, 0.17, 0.03); cyl(g, K.brass, 0.014, 0.014, 1.4, 0, 0.03, 0, 8);
  cyl(g, K.M(0xf2dfb0, 0.9, 0, { emissive: 0xffd58a, emissiveIntensity: 0.9, side: THREE.DoubleSide }), 0.13, 0.2, 0.28, 0, 1.4, 0, 20, true).castShadow = false;
  U.lightAt = [0, 1.45, 0];
};
B.desk_lamp = (g, K, c, U) => {
  cyl(g, K.brass, 0.08, 0.09, 0.02); cyl(g, K.brass, 0.01, 0.01, 0.3, 0, 0.02, 0, 8);
  const sh = cyl(g, K.M(0x2f7d4f, 0.4, 0, { emissive: 0x2f7d4f, emissiveIntensity: 0.45 }), 0.06, 0.06, 0.22, 0, 0, 0, 14); sh.rotation.z = Math.PI / 2; sh.position.set(0, 0.34, 0.03); sh.castShadow = false;
  U.lightAt = [0, 0.28, 0.06];
};
B.mic_stand = (g, K) => {
  cyl(g, K.steel, 0.17, 0.19, 0.03); cyl(g, K.steel, 0.012, 0.012, 1.35, 0, 0.03, 0, 8);
  mesh(g, new THREE.TorusGeometry(0.08, 0.008, 6, 20), K.steel, 0, 1.45, 0); box(g, K.M(0xc9ced0, 0.35, 0.8), 0.07, 0.13, 0.05, 0, 1.385);
  box(g, K.accent, 0.2, 0.06, 0.02, 0, 1.2, 0.02);
};
B.calendar = (g, K, c, U, ctx) => { box(g, K.cream, 0.4, 0.55, 0.012, 0, 0, -0.008); plane(g, K.T(TX.calendarTex(ctx.rng)), 0.38, 0.53, 0, 0.275, 0.001); };
B.telephone = (g, K) => {
  box(g, K.black, 0.22, 0.05, 0.2); box(g, K.black, 0.16, 0.05, 0.14, 0, 0.05, -0.01);
  const d = cyl(g, K.cream, 0.055, 0.055, 0.01, 0, 0.075, 0.04, 20); d.rotation.x = 0.5;
  for (const x of [-0.07, 0.07]) box(g, K.black, 0.02, 0.04, 0.05, x, 0.1, -0.03);
  const h = cyl(g, K.black, 0.016, 0.016, 0.2, 0, 0, 0, 8); h.rotation.z = Math.PI / 2; h.position.set(0, 0.15, -0.03);
  for (const x of [-0.1, 0.1]) sph(g, K.black, 0.03, x, 0.14, -0.03, 10);
};
B.microscope = (g, K) => {
  box(g, K.black, 0.16, 0.025, 0.2); box(g, K.black, 0.03, 0.26, 0.03, 0, 0.025, -0.07).rotation.x = 0.15; box(g, K.steel, 0.1, 0.012, 0.1, 0, 0.11, 0.0);
  const t = cyl(g, K.brass, 0.018, 0.022, 0.2, 0, 0.16, -0.02, 10); t.rotation.x = 0.35; t.position.z = -0.03;
};
B.flasks = (g, K) => {
  const glass = (col) => K.M(col, 0.15, 0, { transparent: true, opacity: 0.75 });
  cyl(g, glass(0x4fb0c6), 0.015, 0.06, 0.12, -0.16, 0, 0, 14); cyl(g, glass(0xd8e8ea), 0.015, 0.015, 0.06, -0.16, 0.12, 0, 10);
  cyl(g, glass(0xc8473c), 0.045, 0.045, 0.1, 0, 0, 0.02, 14); sph(g, glass(0xe0a526), 0.055, 0.17, 0.055, 0, 14); cyl(g, glass(0xd8e8ea), 0.015, 0.015, 0.12, 0.17, 0.09, 0, 10);
};
B.microphone = (g, K) => { cyl(g, K.steel, 0.07, 0.08, 0.02); cyl(g, K.steel, 0.01, 0.01, 0.14, 0, 0.02, 0, 8); box(g, K.M(0xc9ced0, 0.35, 0.8), 0.07, 0.12, 0.045, 0, 0.16); for (let i = 0; i < 4; i++) box(g, K.black, 0.072, 0.006, 0.047, 0, 0.18 + i * 0.022); };

// ---- the lock hardware mounted on a container, always showing the lock's symbol
function lockMesh(K, lock) {
  const g = new THREE.Group();
  const sym = () => new THREE.MeshStandardMaterial({ map: TX.symbolTex(lock.symbol), roughness: 0.6 });
  const stick = (r, x, y, z) => { const s = mesh(g, new THREE.CircleGeometry(r, 24), sym(), x, y, z); s.castShadow = false; return s; };
  if (lock.type === 'key') {
    box(g, K.brass, 0.07, 0.12, 0.012, 0, -0.1, 0.006); facing(cyl(g, K.void, 0.012, 0.012, 0.004, 0, -0.035, 0.014, 10)); box(g, K.void, 0.01, 0.035, 0.004, 0, -0.075, 0.013);
    stick(0.045, 0, 0.07, 0.004);
  } else if (lock.type === 'digits') {
    box(g, K.brass, 0.1, 0.085, 0.035, 0, -0.085, 0.02);
    const sh = mesh(g, new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI), K.steel, 0, 0.0, 0.02);
    for (let i = 0; i < lock.code.length; i++) cyl(g, K.cream, 0.014, 0.014, 0.018, (i - (lock.code.length - 1) / 2) * 0.022, -0.085, 0.04, 10).rotation.z = Math.PI / 2;
    stick(0.045, 0, 0.09, 0.004); void sh;
  } else if (lock.type === 'dial') {
    facing(cyl(g, K.black, 0.075, 0.075, 0.03, 0, -0.015, 0.015, 28)); facing(cyl(g, K.steel, 0.035, 0.04, 0.03, 0, -0.015, 0.045, 20));
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; box(g, K.cream, 0.004, 0.014, 0.002, Math.sin(a) * 0.063, Math.cos(a) * 0.063 - 0.007, 0.031).rotation.z = -a; }
    stick(0.04, 0, 0.135, 0.004);
  } else if (lock.type === 'wheel') {
    const d = mesh(g, new THREE.CircleGeometry(0.1, 32), new THREE.MeshStandardMaterial({ map: TX.wheelPlateTex(lock.letters, lock.symbol), roughness: 0.45, metalness: 0.3 }), 0, 0, 0.012); d.castShadow = false;
    facing(cyl(g, K.brass, 0.105, 0.105, 0.012, 0, -0.006, 0.006, 32));
  } else if (lock.type === 'merge') {
    box(g, K.brass, 0.2, 0.12, 0.01, 0, -0.06, 0.005);
    [new THREE.TetrahedronGeometry(0.028), new THREE.BoxGeometry(0.036, 0.036, 0.036), new THREE.OctahedronGeometry(0.028)].forEach((geo, i) => mesh(g, geo, new THREE.MeshStandardMaterial({ color: TIER_COLORS[i + 1], flatShading: true }), -0.06 + i * 0.06, 0, 0.035).rotation.set(0.5, 0.6, 0));
    stick(0.04, 0, 0.12, 0.004);
  }
  return g;
}

export function buildProp(def, ctx) {
  const cat = CATALOG[def.type], g = new THREE.Group(), K = makeKit(ctx.theme.pal), U = {};
  B[def.type](g, K, cat, U, ctx);
  if (def.lock && U.plate && def.lock.symbol) {
    const lm = lockMesh(K, def.lock);
    lm.position.set(...U.plate.pos);
    lm.scale.setScalar(U.plate.s || 1);
    U.plate.parent.add(lm);
    U.lockMesh = lm;
    lm.traverse((o) => { if (o.material && !K.mats.includes(o.material)) K.mats.push(o.material); });
  }
  g.userData = { ...U, kit: K };
  return g;
}

export function shapeGeometry(tier, r = 0.3) {
  return [null, new THREE.TetrahedronGeometry(r * 1.15), new THREE.BoxGeometry(r * 1.3, r * 1.3, r * 1.3), new THREE.OctahedronGeometry(r * 1.05), new THREE.DodecahedronGeometry(r), new THREE.IcosahedronGeometry(r), new THREE.SphereGeometry(r * 0.95, 24, 16)][tier];
}
