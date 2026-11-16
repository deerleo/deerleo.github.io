/* Open world: Silicon Valley 1993–1997. Rendering, player, NPCs, traffic, minimap. */
LC.World = (() => {
  const D = LC.DATA, B = 170; // map half-size
  const ROADS = [-80, 0, 80];
  let renderer, scene, camera, hemi, sun;
  const colliders = [], npcs = [], noteObjs = [], peds = [], cars = [], spin = [];
  let player, pfig;
  const cam = { yaw: 0.35, pitch: 0.5, dist: 20 };
  const lam = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 });

  function box(g, w, h, d, c, x, y, z, e) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c, e)); m.position.set(x, y + h / 2, z); g.add(m); return m; }
  function cyl(g, r1, r2, h, c, x, y, z, seg) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), lam(c)); m.position.set(x, y + h / 2, z); g.add(m); return m; }
  function label(text, color, h) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 160; const x = cv.getContext('2d');
    x.font = '800 80px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 12; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(text, 512, 84); x.fillStyle = color || '#fff'; x.fillText(text, 512, 84);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    s.scale.set(h * 1024 / 160, h, 1); return s;
  }
  function figure(o) {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    const shirt = lam(o.shirt), pants = lam(o.pants || 0x2c2c34), skin = lam(o.skin || 0xe5bf98), hair = lam(o.hair || 0x161616);
    const add = (geo, m, x, y, z, p) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); (p || b).add(me); return me; };
    add(new THREE.BoxGeometry(.9, 1.2, .5), shirt, 0, 1.35, 0);
    add(new THREE.SphereGeometry(.38, 14, 10), skin, 0, 2.3, 0);
    add(new THREE.SphereGeometry(.4, 14, 8), hair, 0, 2.43, -.05).scale.set(1, .65, 1);
    if (o.glasses) add(new THREE.BoxGeometry(.62, .1, .06), lam(0x111111), 0, 2.33, .36);
    const legs = [-.24, .24].map(x => { const p = new THREE.Group(); p.position.set(x, .78, 0); b.add(p); add(new THREE.BoxGeometry(.36, .8, .4), pants, 0, -.4, 0, p); return p; });
    const arms = [-.6, .6].map(x => { const p = new THREE.Group(); p.position.set(x, 1.9, 0); b.add(p); add(new THREE.BoxGeometry(.26, .9, .3), shirt, 0, -.42, 0, p); return p; });
    return { g, b, legs, arms };
  }
  function animFig(f, moving, t, rate) {
    const s = moving ? Math.sin(t * (rate || 10)) * .75 : 0;
    f.legs[0].rotation.x = s; f.legs[1].rotation.x = -s; f.arms[0].rotation.x = -s; f.arms[1].rotation.x = s;
    f.b.position.y = moving ? Math.abs(Math.sin(t * (rate || 10))) * .1 : 0;
  }
  const onRoad = (x, z, m) => ROADS.some(r => Math.abs(x - r) < m || Math.abs(z - r) < m);
  const inBuilding = (x, z, m) => colliders.some(c => x > c.minX - m && x < c.maxX + m && z > c.minZ - m && z < c.maxZ + m);

  function building(id, L) {
    const g = new THREE.Group(); g.position.set(L.x, 0, L.z); scene.add(g);
    const { w, d, h } = L;
    if (L.kind === 'house') {
      box(g, w, h, d, L.col, 0, 0, 0);
      const r = new THREE.Mesh(new THREE.ConeGeometry(w * .78, 4, 4), lam(0x7a3b2e)); r.rotation.y = Math.PI / 4; r.scale.z = d / w; r.position.y = h + 2; g.add(r);
      for (const x of [-4, 4]) box(g, 2, 1.6, .2, 0xfff1a8, x, 2.4, d / 2 + .05, 0x7a6a20);
      box(g, 3, .1, 8, 0x7a7a7a, 0, 0, d / 2 + 4); // driveway
    } else if (L.kind === 'diner') {
      box(g, w, h, d, 0xf1efe9, 0, 0, 0); box(g, w + .2, 1, d + .2, 0xd6332b, 0, h - 1.4, 0); box(g, w + 1, .4, d + 1, 0x444444, 0, h, 0);
      for (const x of [-5.5, -1.8, 1.8, 5.5]) box(g, 2.6, 1.5, .2, 0xfff1a8, x, 1, d / 2 + .05, 0x7a6a20);
      cyl(g, .2, .2, 8, 0x333333, w / 2 + 3, 0, d / 2 + 1); box(g, 4, 2, .5, 0xffd02a, w / 2 + 3, 8, d / 2 + 1, 0x665500);
    } else if (L.kind === 'nvidia') {
      box(g, w, h, d, L.col, 0, 0, 0); box(g, w + .2, .5, d + .2, 0x76b900, 0, h - .6, 0, 0x3a6000);
      for (let y = 1.8; y < h - 2; y += 2.6) box(g, w + .1, 1.2, d + .1, 0x9fc6d8, 0, y, 0, 0x1a2a33);
    } else if (L.kind === 'vc') {
      box(g, w, h, d, L.col, 0, 0, 0); box(g, w + 2, .5, d + 2, 0x3b3128, 0, h, 0);
      for (let x = -w / 2 + 1.5; x < w / 2; x += 2.5) box(g, .4, h, .4, 0x5a4636, x, 0, d / 2 + .3);
      box(g, w - 2, 1.6, .1, 0xcfe6f0, 0, 2, d / 2 + .1, 0x1e2a30);
    } else if (L.kind === 'airport') {
      box(g, w, h, d, L.col, 0, 0, 0); box(g, w + .2, 2, d + .2, 0x8fc0dc, 0, 4, 0, 0x1a3040);
      cyl(g, 1.6, 2, 18, 0xbfc6cc, w / 2 + 5, 0, -4); box(g, 5, 3, 5, 0x6f9fbf, w / 2 + 5, 18, -4, 0x203040);
      colliders.push({ minX: L.x + w / 2 + 2.5, maxX: L.x + w / 2 + 7.5, minZ: L.z - 6.5, maxZ: L.z - 1.5 });
      const pl = new THREE.Group(); pl.position.set(-6, 0, -d / 2 - 14); g.add(pl);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 22, 14), lam(0xf4f4f4)); f.rotation.z = Math.PI / 2; f.position.y = 3; pl.add(f);
      box(pl, 5, .4, 20, 0xdddddd, 0, 2.4, 0); box(pl, .4, 4, 3, 0xd6332b, -10, 3, 0);
      colliders.push({ minX: L.x - 18, maxX: L.x + 6, minZ: L.z - d / 2 - 25, maxZ: L.z - d / 2 - 3 });
    } else if (L.kind === 'expo') {
      box(g, w, h, d, L.col, 0, 0, 0);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(w * .35, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x6a5a9b)); dome.position.y = h; g.add(dome);
      for (const x of [-12, -4, 4, 12]) box(g, 2.4, 7, .2, [0x76b900, 0xffd24a, 0x4da3ff, 0xff6b6b][(x + 12) / 8], x, 2, d / 2 + .15, 0x111111);
    } else if (L.kind === 'campus') {
      box(g, w, h, d, L.col, 0, 0, 0);
      const r = new THREE.Mesh(new THREE.ConeGeometry(w * .72, 4, 4), lam(0xa33a2a)); r.rotation.y = Math.PI / 4; r.scale.z = d / w; r.position.y = h + 2; g.add(r);
      for (let x = -w / 2 + 2; x <= w / 2 - 2; x += 3) cyl(g, .45, .45, h - 1, 0xf2ead8, x, 0, d / 2 + .6, 10);
      for (const x of [-w / 4, w / 4]) box(g, 3, 2, .2, 0x8fb8d8, x, h - 4, d / 2 + .1, 0x1a2a3a);
    } else if (L.kind === 'store') {
      box(g, w, h, d, L.col, 0, 0, 0); box(g, w + .2, 1.6, d + .2, 0x2a6fd6, 0, h - 2, 0, 0x0a2050);
      box(g, w - 4, 2.4, .2, 0xcfe6f0, 0, .4, d / 2 + .1, 0x1e2a30);
    } else {
      box(g, w, h, d, L.col, 0, 0, 0);
      for (let y = 2; y < h - 1; y += 3) box(g, w + .1, 1.3, d + .1, 0xa8c8e8, 0, y, 0, 0x1a2a3a);
      box(g, w + .6, .5, d + .6, 0x444a52, 0, h, 0);
    }
    colliders.push({ minX: L.x - w / 2, maxX: L.x + w / 2, minZ: L.z - d / 2, maxZ: L.z + d / 2 });
    L.door = { x: L.x, z: L.z + d / 2 + 2.6 };
    box(g, 2.4, 3.2, .3, 0x3b2a1a, 0, 0, d / 2 + .05);
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.7, 32), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: .6, side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(0, .06, d / 2 + 2.6); g.add(pad); L.pad = pad;
    const lb = label(L.name, '#ffffff', 2.4); lb.position.set(0, h + (L.kind === 'house' ? 6.5 : 3.5), 0); g.add(lb);
  }

  function tree(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const s = .8 + Math.random() * .7;
    cyl(g, .25 * s, .35 * s, 2.2 * s, 0x6b4a2b, 0, 0, 0, 6);
    if (Math.random() < .5) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.8 * s, 5 * s, 7), lam(0x2f6b3a)); c.position.y = 2.2 * s + 2.4 * s; g.add(c); }
    else { const c = new THREE.Mesh(new THREE.SphereGeometry(1.9 * s, 8, 6), lam(0x3f7d3a)); c.position.y = 2.2 * s + 1.4 * s; g.add(c); }
    colliders.push({ minX: x - .5, maxX: x + .5, minZ: z - .5, maxZ: z + .5, tree: true });
  }

  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2)); /* phones: lighter GPU load */
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ccbe8); scene.fog = new THREE.Fog(0x9ccbe8, 90, 330);
    camera = new THREE.PerspectiveCamera(55, 1, .1, 800);
    hemi = new THREE.HemisphereLight(0xffffff, 0x4a5a40, .9); scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2dd, .75); sun.position.set(80, 140, 60); scene.add(sun);
    addEventListener('resize', resize); resize();

    // ground, roads, park
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), lam(0x5d7a4f)); ground.rotation.x = -Math.PI / 2; ground.position.y = -.02; scene.add(ground);
    for (const r of ROADS) {
      box(scene, 10, .05, 2 * B + 20, 0x3b3e44, r, 0, 0); box(scene, 2 * B + 20, .05, 10, 0x3b3e44, 0, 0, r);
      box(scene, 1.6, .06, 2 * B + 20, 0x9a9a92, r - 6.3, 0, 0); box(scene, 1.6, .06, 2 * B + 20, 0x9a9a92, r + 6.3, 0, 0);
      box(scene, 2 * B + 20, .06, 1.6, 0x9a9a92, 0, 0, r - 6.3); box(scene, 2 * B + 20, .06, 1.6, 0x9a9a92, 0, 0, r + 6.3);
      for (let t = -B; t < B; t += 7) { if (!ROADS.some(q => Math.abs(t - q) < 6)) { box(scene, .3, .07, 3, 0xe8d36a, r, 0, t); box(scene, 3, .07, .3, 0xe8d36a, t, 0, r); } }
    }
    const park = new THREE.Mesh(new THREE.PlaneGeometry(44, 34), lam(0x4f8f45)); park.rotation.x = -Math.PI / 2; park.position.set(-40, .02, 40); scene.add(park);
    const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 24), lam(0x4a86b8, 0x0a1a2a)); pond.rotation.x = -Math.PI / 2; pond.position.set(-48, .05, 36); scene.add(pond);
    colliders.push({ minX: -53, maxX: -43, minZ: 31, maxZ: 41 });
    for (const [x, z] of [[-34, 46], [-26, 34]]) { box(scene, 3, .5, 1, 0x7a5a3a, x, .5, z); colliders.push({ minX: x - 1.5, maxX: x + 1.5, minZ: z - .5, maxZ: z + .5 }); }

    for (const id in D.locations) building(id, D.locations[id]);

    // distant hills
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 260 + Math.random() * 40; const m = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random() * 30, 30 + Math.random() * 40, 6), lam(0x6f7f5e)); m.position.set(Math.cos(a) * r, 10, Math.sin(a) * r); scene.add(m); }
    // trees
    let placed = 0, tries = 0;
    while (placed < 170 && tries++ < 4000) {
      const x = (Math.random() * 2 - 1) * (B - 5), z = (Math.random() * 2 - 1) * (B - 5);
      if (onRoad(x, z, 9) || inBuilding(x, z, 6)) continue;
      if (Object.values(D.locations).some(L => Math.hypot(x - L.door.x, z - L.door.z) < 8)) continue;
      tree(x, z); placed++;
    }
    // filler houses (suburbs)
    for (let i = 0; i < 26; i++) {
      const x = (Math.random() * 2 - 1) * (B - 15), z = (Math.random() * 2 - 1) * (B - 15);
      if (onRoad(x, z, 14) || inBuilding(x, z, 12)) continue;
      const w = 8 + Math.random() * 5, d = 7 + Math.random() * 4, h = 4 + Math.random() * 3, g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      box(g, w, h, d, new THREE.Color().setHSL(.08 + Math.random() * .1, .25, .55 + Math.random() * .2).getHex(), 0, 0, 0);
      const r = new THREE.Mesh(new THREE.ConeGeometry(w * .78, 3, 4), lam(0x6a4a3a)); r.rotation.y = Math.PI / 4; r.scale.z = d / w; r.position.y = h + 1.5; g.add(r);
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }
    // cars
    const cc = [0xc0392b, 0x2980b9, 0xf1c40f, 0xecf0f1, 0x27ae60, 0x34495e, 0x8e44ad, 0xd35400];
    for (let i = 0; i < 16; i++) {
      const g = new THREE.Group(); scene.add(g); const col = cc[i % cc.length];
      box(g, 4.2, 1.1, 2, col, 0, .35, 0); box(g, 2.2, .9, 1.8, 0x223344, -.2, 1.45, 0);
      for (const [x, z] of [[-1.4, 1], [1.4, 1], [-1.4, -1], [1.4, -1]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .3, 10), lam(0x111111)); w.rotation.x = Math.PI / 2; w.position.set(x, .4, z); g.add(w); }
      const axis = i % 2 ? 'x' : 'z', road = ROADS[i % 3], dir = Math.random() < .5 ? 1 : -1;
      cars.push({ g, axis, road, dir, lane: dir * 2.5, pos: (Math.random() * 2 - 1) * B, speed: 9 + Math.random() * 7 });
    }
    // pedestrians on sidewalks
    const sc = [0xb03a2e, 0x2e86c1, 0x239b56, 0xb7950b, 0x6c3483, 0x7f8c8d, 0xd68910];
    for (let i = 0; i < 22; i++) {
      const f = figure({ shirt: sc[i % sc.length], pants: [0x2c3e50, 0x5d4037, 0x37474f][i % 3] }); scene.add(f.g);
      const axis = i % 2 ? 'x' : 'z', road = ROADS[i % 3], side = Math.random() < .5 ? -6.3 : 6.3;
      peds.push({ f, axis, road, side, pos: (Math.random() * 2 - 1) * B, dir: Math.random() < .5 ? 1 : -1, speed: 1.2 + Math.random() * .8 });
    }
    // hint NPCs
    for (const n of D.npcs) addNPC(n.id, n.name, n.x, n.z, { shirt: n.shirt }, n);
    // story NPCs (positions set by syncNPCs from Sim.npcPlacement)
    for (const n of (D.storyNPCs || [])) addNPC(n.id, n.name, 0, 0, n.look);
    // memory notes
    D.notes.forEach((n, i) => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(.7), new THREE.MeshLambertMaterial({ color: 0x9dff4a, emissive: 0x3a7a00 }));
      m.position.set(n.x, 1.6, n.z); scene.add(m); noteObjs.push({ m, i });
    });

    pfig = figure({ shirt: 0x1d2a33, pants: 0x3a3f4a, glasses: true }); player = pfig.g; scene.add(player);

    // objective beacon: light pillar, bobbing arrow, pulsing ring
    beacon = new THREE.Group(); scene.add(beacon);
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 120, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
    pillar.position.y = 60; beacon.add(pillar);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 4), new THREE.MeshBasicMaterial({ color: 0xffd24a })); arrow.rotation.x = Math.PI; beacon.add(arrow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.4, 40), new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .1; beacon.add(ring);
  }
  let beacon = null, target = null;
  function setTarget(id) { target = id && D.locations[id] ? D.locations[id] : null; }
  /* screen-space direction to the objective: angle in degrees (0 = straight ahead/up) and distance in metres */
  function compass() {
    if (!target) return null;
    const dx = target.door.x - player.position.x, dz = target.door.z - player.position.z;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    return { deg: Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI, dist: Math.hypot(dx, dz) };
  }

  function addNPC(id, name, x, z, look, data) {
    const f = figure(look); f.g.position.set(x, 0, z); scene.add(f.g);
    const lb = label(name, '#ffe680', 1.1); lb.position.y = 3.3; f.g.add(lb);
    npcs.push({ id, name, f, data, visible: true });
  }

  function resize() { if (!renderer) return; renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }

  /* story NPC placement depends on phase */
  function syncNPCs(S) {
    const L = D.locations, place = LC.Sim.npcPlacement(S);
    for (const sn of (D.storyNPCs || [])) {
      const n = npcs.find(q => q.id === sn.id), p = place[sn.id];
      if (p && L[p.loc]) { const d = L[p.loc].door; n.f.g.position.set(d.x + (p.dx || 0), 0, d.z + (p.dz || 0)); n.f.g.visible = n.visible = true; }
      else n.f.g.visible = n.visible = false;
    }
    noteObjs.forEach(o => { o.m.visible = !S.notes.includes(o.i); });
  }
  function setMood(phase) { const M = D.moods || {}, m = M[phase] || Object.values(M)[0] || [0x9ccbe8, .9, .75]; skyT = new THREE.Color(m[0]); hemiT = m[1]; sunT = m[2]; }
  let skyT = new THREE.Color(0x9ccbe8), hemiT = .9, sunT = .75;

  function teleport(x, z) { player.position.set(x, 0, z); }
  function resolve(p) {
    for (const c of colliders) {
      const r = .55;
      if (p.x > c.minX - r && p.x < c.maxX + r && p.z > c.minZ - r && p.z < c.maxZ + r) {
        const dl = p.x - (c.minX - r), dr = (c.maxX + r) - p.x, dt = p.z - (c.minZ - r), db = (c.maxZ + r) - p.z;
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) p.x = c.minX - r; else if (m === dr) p.x = c.maxX + r; else if (m === dt) p.z = c.minZ - r; else p.z = c.maxZ + r;
      }
    }
    p.x = Math.max(-B, Math.min(B, p.x)); p.z = Math.max(-B, Math.min(B, p.z));
  }

  let t = 0;
  function update(dt, input) {
    t += dt;
    let f = (input.fwd ? 1 : 0) - (input.back ? 1 : 0), r = (input.right ? 1 : 0) - (input.left ? 1 : 0), amt = 1;
    if (!f && !r && (input.jx || input.jy)) { f = -input.jy; r = input.jx; amt = Math.min(1, Math.hypot(f, r)); } /* touch joystick (analog) */
    let moving = false;
    if (input.active && (f || r)) {
      const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
      let vx = fx * f + rx * r, vz = fz * f + rz * r; const l = Math.hypot(vx, vz); vx /= l; vz /= l;
      const sp = (input.run ? 22 : 12) * (input.run ? 1 : Math.max(.35, amt));
      player.position.x += vx * sp * dt; player.position.z += vz * sp * dt; resolve(player.position);
      const ta = Math.atan2(vx, vz); let da = ta - player.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); player.rotation.y += da * Math.min(1, dt * 12);
      moving = true;
    }
    if (input.turn) cam.yaw += input.turn * dt * 2;
    animFig(pfig, moving, t, input.run ? 18 : 13);
    if (target) {
      beacon.visible = true; beacon.position.set(target.door.x, 0, target.door.z);
      beacon.children[0].material.opacity = .22 + .1 * Math.sin(t * 3);
      beacon.children[1].position.y = 6 + Math.sin(t * 4) * .8; beacon.children[1].rotation.y = t * 2;
      const ring = beacon.children[2], sc = 1 + .25 * ((t * 1.2) % 1); ring.scale.set(sc, sc, sc); ring.material.opacity = .8 * (1 - (t * 1.2) % 1);
    } else beacon.visible = false;

    for (const c of cars) {
      c.pos += c.dir * c.speed * dt; if (c.pos > B + 10) c.pos = -B - 10; if (c.pos < -B - 10) c.pos = B + 10;
      if (c.axis === 'x') { c.g.position.set(c.pos, 0, c.road + c.lane); c.g.rotation.y = c.dir > 0 ? 0 : Math.PI; }
      else { c.g.position.set(c.road - c.lane, 0, c.pos); c.g.rotation.y = c.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
    }
    for (const p of peds) {
      p.pos += p.dir * p.speed * dt; if (Math.abs(p.pos) > B - 5) p.dir *= -1;
      if (p.axis === 'x') { p.f.g.position.set(p.pos, 0, p.road + p.side); p.f.g.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { p.f.g.position.set(p.road + p.side, 0, p.pos); p.f.g.rotation.y = p.dir > 0 ? 0 : Math.PI; }
      animFig(p.f, true, t + p.speed * 7, 6);
    }
    for (const n of npcs) {
      if (!n.visible) continue; const dx = player.position.x - n.f.g.position.x, dz = player.position.z - n.f.g.position.z;
      if (Math.hypot(dx, dz) < 8) n.f.g.rotation.y = Math.atan2(dx, dz);
    }
    for (const o of noteObjs) { o.m.rotation.y = t * 2; o.m.position.y = 1.6 + Math.sin(t * 2 + o.i) * .3; }
    for (const id in D.locations) { const pd = D.locations[id].pad; pd.material.opacity = .4 + .3 * Math.sin(t * 3); }

    scene.background.lerp(skyT, Math.min(1, dt)); scene.fog.color.copy(scene.background);
    hemi.intensity += (hemiT - hemi.intensity) * Math.min(1, dt); sun.intensity += (sunT - sun.intensity) * Math.min(1, dt);

    const tx = player.position.x, tz = player.position.z;
    camera.position.set(tx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, 2 + Math.sin(cam.pitch) * cam.dist, tz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist);
    camera.lookAt(tx, 2.2, tz);
    renderer.render(scene, camera);
  }

  function nearby() {
    const p = player.position; let best = null, bd = 1e9;
    for (const id in D.locations) { const d = D.locations[id].door, dist = Math.hypot(p.x - d.x, p.z - d.z); if (dist < 3.2 && dist < bd) { bd = dist; best = { type: 'loc', id, name: D.locations[id].name }; } }
    for (const n of npcs) { if (!n.visible) continue; const dist = Math.hypot(p.x - n.f.g.position.x, p.z - n.f.g.position.z); if (dist < 3 && dist < bd) { bd = dist; best = { type: 'npc', id: n.id, name: n.name }; } }
    return best;
  }
  function pickNotes(S) {
    const p = player.position, got = [];
    for (const o of noteObjs) if (o.m.visible && Math.hypot(p.x - o.m.position.x, p.z - o.m.position.z) < 2) { o.m.visible = false; got.push(o.i); }
    return got;
  }

  function minimap(ctx, target) {
    const W = ctx.canvas.width, s = W / (2 * B), X = x => (x + B) * s, Z = z => (z + B) * s;
    ctx.fillStyle = '#2f4a2b'; ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = '#55585e'; for (const r of ROADS) { ctx.fillRect(X(r - 5), 0, 10 * s, W); ctx.fillRect(0, Z(r - 5), W, 10 * s); }
    for (const id in D.locations) { const L = D.locations[id]; ctx.fillStyle = id === target ? '#ffd24a' : id === 'nvidia' ? '#76b900' : '#c9ced6'; ctx.fillRect(X(L.x - L.w / 2), Z(L.z - L.d / 2), L.w * s, L.d * s); }
    if (target && D.locations[target]) {
      const L = D.locations[target], pulse = 6 + 3 * Math.sin(t * 5);
      ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(L.door.x), Z(L.door.z), pulse, 0, 7); ctx.stroke();
    }
    ctx.fillStyle = '#9dff4a'; for (const o of noteObjs) if (o.m.visible) ctx.fillRect(X(o.m.position.x) - 1.5, Z(o.m.position.z) - 1.5, 3, 3);
    const p = player.position, a = player.rotation.y;
    ctx.save(); ctx.translate(X(p.x), Z(p.z)); ctx.rotate(-a + Math.PI); ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  return {
    init, update, syncNPCs, setMood, setTarget, compass, teleport, nearby, pickNotes, minimap, cam,
    rotate(dx, dy) { cam.yaw -= dx * .005; cam.pitch = Math.max(.15, Math.min(1.3, cam.pitch + dy * .004)); },
    zoom(d) { cam.dist = Math.max(8, Math.min(40, cam.dist + d * .02)); },
    pos() { return player.position; },
    loc: id => D.locations[id]
  };
})();
