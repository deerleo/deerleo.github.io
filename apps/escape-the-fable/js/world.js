// Builds the three.js scene for a level: room shell, lighting and all props.
import * as THREE from 'three';
import { CATALOG, rectOf } from './catalog.js';
import { THEMES } from './themes.js';
import { RNG, hashStr } from './rng.js';
import { propById, thingsAt, placeTops } from './levelops.js';
import { buildProp } from './props.js';
import * as TX from './textures.js';

const ease = (t) => t * t * (3 - 2 * t);

export class World {
  constructor(level) {
    this.level = level;
    this.theme = THEMES[level.theme];
    this.scene = new THREE.Scene();
    this.props = new Map();
    this.tweens = [];
    this.colliders = [];
    this.hovered = null;
    placeTops(level);
    this.buildRoom();
    for (const def of level.props) this.addProp(def);
  }

  buildRoom() {
    const { w, d } = this.level.room, h = 3, pal = this.theme.pal, s = this.scene;
    const rng = new RNG(hashStr('room' + (this.level.seed || this.level.name)));
    s.background = new THREE.Color(0x0d0c0b);
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; s.add(m); return m; };
    add(new THREE.PlaneGeometry(w, d), std({ map: TX.floorTex(this.theme.floorStyle, pal, w, d, rng), roughness: this.theme.floorStyle === 'wood' ? 0.6 : 0.5 }), 0, 0, 0, -Math.PI / 2);
    add(new THREE.PlaneGeometry(w, d), std({ color: pal.ceil }), 0, h, 0, Math.PI / 2);
    const low = std({ color: pal.wallLow, roughness: 0.75 }), trim = std({ color: pal.trim, roughness: 0.6 });
    const walls = [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]];
    for (const [x, z, ry, len] of walls) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; s.add(g);
      const part = (geo, mat, y, zz) => { const m = new THREE.Mesh(geo, mat); m.position.set(0, y, zz); m.receiveShadow = true; g.add(m); };
      part(new THREE.PlaneGeometry(len, h), std({ map: TX.wallTex(this.theme.wallStyle, pal, len, rng) }), h / 2, 0);
      part(new THREE.BoxGeometry(len, 0.95, 0.03), low, 0.475, 0.015);
      part(new THREE.BoxGeometry(len, 0.06, 0.05), trim, 0.97, 0.025);
      part(new THREE.BoxGeometry(len, 0.12, 0.045), trim, 0.06, 0.022);
      part(new THREE.BoxGeometry(len, 0.1, 0.08), trim, h - 0.05, 0.04);
    }
    // lighting: soft ambient + one shadow-casting ceiling pendant
    s.add(new THREE.HemisphereLight(pal.light, pal.floorB, 1.15));
    s.add(new THREE.AmbientLight(0xffffff, 0.35));
    const lamp = new THREE.PointLight(pal.light, 26 + w * d * 0.9, 0, 1.6);
    lamp.position.set(0, h - 0.55, 0);
    lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.002; lamp.shadow.radius = 4;
    s.add(lamp);
    const fix = new THREE.Group(); fix.position.set(0, h, 0); s.add(fix);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3), trim); rod.position.y = -0.15; fix.add(rod);
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: pal.light, emissiveIntensity: 1.6 })); shade.position.y = -0.42; fix.add(shade);
    this.lampCount = 0;
  }

  addProp(def) {
    const cat = CATALOG[def.type], level = this.level;
    const shown = thingsAt(level, def.id, 'shown')[0] || null;
    const lock = shown ? propById(level, shown.for).lock : null;
    const ctx = { level, theme: this.theme, rng: new RNG(hashStr(def.id + def.type + (level.seed || 0))), shown, lock };
    const g = buildProp(def, ctx);
    let y = cat.y || 0;
    if (cat.place === 'top') { const host = propById(level, def.on); y = host ? CATALOG[host.type].h : 0; }
    g.position.set(def.x, y, def.z);
    g.rotation.y = (def.rot * Math.PI) / 2;
    g.traverse((o) => { o.userData.propId = def.id; });
    this.scene.add(g);
    if (g.userData.lightAt && this.lampCount < 3) {
      this.lampCount++;
      const l = new THREE.PointLight(0xffc880, 3.2, 5, 1.8);
      l.position.set(...g.userData.lightAt);
      g.add(l);
    }
    if (cat.place === 'floor') this.colliders.push(rectOf(def));
    this.props.set(def.id, { def, cat, group: g, state: 0 });
  }

  // animate a prop's lid / door / hiding spot open
  animate(id, kind, instant) {
    const p = this.props.get(id);
    const parts = p.group.userData[kind];
    if (!parts) return;
    for (const part of parts) {
      const o = part.obj;
      const from = { p: o.position.clone(), r: o.rotation.clone() };
      const to = { p: o.position.clone().add(new THREE.Vector3(...(part.pos || [0, 0, 0]))), r: new THREE.Euler(o.rotation.x + (part.rot ? part.rot[0] : 0), o.rotation.y + (part.rot ? part.rot[1] : 0), o.rotation.z + (part.rot ? part.rot[2] : 0)) };
      this.tweens.push({ o, from, to, t: instant ? 1 : 0, dur: 0.7 });
    }
    if (kind === 'open' && p.group.userData.lockMesh && ['digits', 'key'].includes(p.def.lock.type) && p.def.lock.type === 'digits') p.group.userData.lockMesh.visible = false;
  }

  update(dt) {
    for (const tw of this.tweens) {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = ease(tw.t);
      tw.o.position.lerpVectors(tw.from.p, tw.to.p, k);
      tw.o.rotation.set(tw.from.r.x + (tw.to.r.x - tw.from.r.x) * k, tw.from.r.y + (tw.to.r.y - tw.from.r.y) * k, tw.from.r.z + (tw.to.r.z - tw.from.r.z) * k);
    }
    this.tweens = this.tweens.filter((tw) => tw.t < 1);
  }

  // which prop is under the given ray (within reach)?
  pick(raycaster, reach = 2.7) {
    raycaster.far = reach;
    const hits = raycaster.intersectObjects([...this.props.values()].map((p) => p.group), true);
    for (const h of hits) if (h.object.visible && h.object.userData.propId) return this.props.get(h.object.userData.propId);
    return null;
  }

  highlight(id) {
    if (this.hovered === id) return;
    const set = (pid, v) => { const p = this.props.get(pid); if (p) for (const m of p.group.userData.kit.mats) { if (m.userData.baseE === undefined) { m.userData.baseE = m.emissive.getHex(); m.userData.baseI = m.emissiveIntensity; } if (v) { if (!m.emissiveMap && m.userData.baseE === 0) { m.emissive.setHex(0x6b4a12); m.emissiveIntensity = 0.55; } } else { m.emissive.setHex(m.userData.baseE); m.emissiveIntensity = m.userData.baseI; } } };
    if (this.hovered) set(this.hovered, false);
    this.hovered = id;
    if (id) set(id, true);
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) for (const m of [].concat(o.material)) { for (const k of ['map', 'emissiveMap']) if (m[k]) m[k].dispose(); m.dispose(); }
    });
  }
}

export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}
