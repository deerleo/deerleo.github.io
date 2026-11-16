// EMBERDEEP — data: tiles, weapons, charms, enemies, maps. No DOM here (also runs in node).
(function (root) {
  'use strict';
  const EMB = root.EMB = root.EMB || {};
  const T = EMB.T = { ROCK: 0, FLOOR: 1, PIT: 2, SHELF: 3 };

  EMB.WEAPONS = {
    sword: { id: 'sword', name: '見習いの剣', desc: '素早い三連撃。三撃目は強く弾き飛ばす。', mult: 1, range: 1.55, arc: 1.95, wu: 0.08, rc: 0.3, cancel: 0.2, combo: 3, kb: 5, lunge: 2.2, power: 1 },
    spear: { id: 'spear', name: '火かき槍', desc: '細く長い二連突き。列の敵を貫き、離れた火鉢にも届く。', mult: 1.25, range: 2.65, arc: 0.5, wu: 0.12, rc: 0.36, cancel: 0.26, combo: 2, kb: 4, lunge: 3.2, power: 1, pierce: true },
    hammer: { id: 'hammer', name: '坑夫の大槌', desc: '遅いが重い一撃。盾を割り、ひび割れた壁を砕く。', mult: 2.3, range: 1.75, arc: 2.7, wu: 0.3, rc: 0.4, cancel: 0.3, combo: 1, kb: 13, lunge: 1.2, power: 3, hammer: true }
  };

  EMB.CHARMS = {
    magnet: { id: 'magnet', name: '集め火の護符', desc: '火の粉と鉱晶を遠くから引き寄せる。鉱晶 +25%。' },
    leech: { id: 'leech', name: '吸い火の護符', desc: 'カゲを倒すたびに HP が 1 回復する。' },
    iron: { id: 'iron', name: '鉄芯の護符', desc: '受けるダメージを 1 減らす。' },
    tempo: { id: 'tempo', name: '早鐘の護符', desc: '閃火のゲージが 1.6 倍速く溜まる。' },
    trail: { id: 'trail', name: '追い火の護符', desc: '回避の軌跡に火が残り、触れたカゲを焼く。' },
    retort: { id: 'retort', name: '返し火の護符', desc: '攻撃を受けると周囲に火が爆ぜ、カゲを吹き飛ばす。' }
  };

  EMB.ITEMS = {
    flask: { name: '癒やしの油瓶 +1', desc: '油瓶の所持数が 1 つ増える。大燈で休むと満たされる。' },
    flare: { name: '灯の心臓', desc: '攻撃を当ててゲージを溜め、【閃火】で周囲を焼き払えるようになった。' }
  };

  // base stats (tier 1). hp/dmg scale with zone tier.
  EMB.ENEMIES = {
    blob: { name: 'カゲダマ', hp: 10, dmg: 3, r: 0.36, speed: 2.3, xp: 4, cry: 2, mass: 1, poise: 0 },
    flit: { name: 'ヒラカゲ', hp: 6, dmg: 2, r: 0.3, speed: 3.6, xp: 4, cry: 2, mass: 0.8, poise: 0, fly: true },
    spitter: { name: 'ハキカゲ', hp: 12, dmg: 4, r: 0.38, speed: 1.9, xp: 6, cry: 3, mass: 1.2, poise: 0 },
    shell: { name: 'カラカゲ', hp: 24, dmg: 5, r: 0.46, speed: 1.5, xp: 10, cry: 5, mass: 3, poise: 2 },
    knight: { name: 'カゲ騎士', hp: 110, dmg: 5, r: 0.48, speed: 2.7, xp: 40, cry: 25, mass: 4, poise: 2, elite: true },
    brood: { name: 'カゲヌシ', hp: 320, dmg: 4, r: 1.1, speed: 2.0, xp: 60, cry: 50, mass: 30, poise: 9, boss: true, abs: true },
    eater: { name: '灯喰い', hp: 900, dmg: 9, r: 0.95, speed: 2.9, xp: 0, cry: 0, mass: 30, poise: 9, boss: true, abs: true }
  };
  EMB.TIER_HP = [1, 3.4, 5.4];
  EMB.TIER_DMG = [1, 1.7, 2.4];

  EMB.FORGE = {
    blade: { name: '刃を鍛える', desc: '攻撃力 +2', cost: [40, 90, 160, 250] },
    cloak: { name: '外套を繕う', desc: '最大HP +4', cost: [35, 80, 140, 220] }
  };

  EMB.xpNeed = function (lvl) { return 16 + (lvl - 1) * 14; };

  // ---------------------------------------------------------------- map builder
  function MB(id, name, w, h, tier) {
    this.id = id; this.name = name; this.w = w; this.h = h; this.tier = tier;
    this.tiles = new Uint8Array(w * h);
    this.rooms = []; this.spawns = []; this.n = 0;
  }
  MB.prototype.rect = function (x, y, w, h, t) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.tiles[j * this.w + i] = t === undefined ? T.FLOOR : t;
    return this;
  };
  MB.prototype.room = function (id, x, y, w, h, o) {
    this.rect(x, y, w, h);
    this.rooms.push(Object.assign({ id: id, x: x, y: y, w: w, h: h, group: 'none', name: '' }, o || {}));
    return this;
  };
  MB.prototype.hall = function (x, y, w, h) { return this.rect(x, y, w, h); };
  MB.prototype.pit = function (x, y, w, h) { return this.rect(x, y, w, h, T.PIT); };
  MB.prototype.shelf = function (x, y, w, h) { return this.rect(x, y, w, h, T.SHELF); };
  MB.prototype.put = function (k, x, y, props) {
    const s = Object.assign({ k: k, x: x, y: y, id: this.id + '.' + k + (this.n++) }, props || {});
    this.spawns.push(s); return this;
  };
  MB.prototype.en = function (type, x, y) { return this.put('enemy', x, y, { type: type }); };
  MB.prototype.door = function (tiles, mode, props) {
    for (const t of tiles) this.tiles[t[1] * this.w + t[0]] = T.FLOOR;
    return this.put('door', tiles[0][0], tiles[0][1], Object.assign({ tiles: tiles, mode: mode }, props || {}));
  };
  MB.prototype.done = function () {
    const ra = this.roomAt = new Int8Array(this.w * this.h).fill(-1);
    this.rooms.forEach((r, i) => { for (let j = r.y; j < r.y + r.h; j++) for (let k = r.x; k < r.x + r.w; k++) ra[j * this.w + k] = i; });
    for (const s of this.spawns) {
      const ri = ra[s.y * this.w + s.x];
      if (s.room === undefined) s.room = ri >= 0 ? this.rooms[ri].id : null;
    }
    return this;
  };

  EMB.buildZones = function () {
    // ============================ ZONE 0: 上層・廃坑道
    const a = new MB('z0', '上層 ― 廃坑道', 94, 46, 0);
    a.room('camp', 2, 18, 11, 9, { group: 'camp', name: '入口の野営' });
    a.put('lamp', 7, 21, { lamp: 'L1', name: '入口の野営', lit: true, group: 'camp' });
    a.put('crate', 11, 25).put('crate', 12, 25).put('crate', 12, 24);
    a.hall(13, 21, 5, 2);
    a.room('r1', 18, 16, 15, 12, { group: 'upper' });
    a.put('brazier', 25, 21);
    a.en('blob', 28, 19).en('blob', 29, 24);
    a.put('crate', 19, 17).put('crate', 20, 17).put('crate', 31, 26).put('crate', 32, 26);
    a.rect(22, 15, 2, 1); a.put('crack', 22, 15).put('crack', 23, 15);
    a.room('sec1', 20, 10, 6, 5, { group: 'upper', secret: true });
    a.put('chest', 22, 11, { item: 'charm:iron' }).put('crate', 25, 10).put('crate', 25, 11).put('crate', 24, 10);
    a.hall(33, 21, 4, 2);
    a.room('r2', 37, 17, 13, 10, { group: 'upper' });
    a.put('brazier', 45, 20);
    a.en('blob', 46, 23).en('blob', 47, 18).en('flit', 40, 24);
    a.put('crate', 49, 17).put('crate', 48, 17).put('crate', 37, 26);
    a.hall(42, 12, 2, 5);
    a.room('rn', 35, 3, 17, 9, { group: 'upper' });
    a.put('brazier', 37, 5).put('brazier', 49, 9);
    a.en('blob', 40, 6).en('blob', 46, 5).en('blob', 47, 8).en('spitter', 44, 4);
    a.door([[52, 6], [52, 7]], 'seal', { cond: 'lit:rn' });
    a.room('rnA', 53, 5, 4, 4, { group: 'upper', secret: true });
    a.put('chest', 55, 6, { item: 'charm:magnet' });
    a.hall(38, 27, 2, 4);
    a.room('rs', 34, 31, 19, 10, { group: 'upper' });
    a.pit(44, 31, 1, 10); a.pit(47, 37, 6, 4);
    a.put('brazier', 50, 39, { far: true }).put('brazier', 40, 38);
    a.en('flit', 48, 33).en('flit', 50, 35).en('flit', 41, 35).en('blob', 36, 37);
    a.put('crate', 34, 40).put('crate', 35, 40);
    a.put('chest', 52, 31, { item: 'crystal:35' });
    a.door([[47, 30], [48, 30]], 'seal', { cond: 'lit:rs' });
    a.room('rsA', 46, 28, 4, 2, { group: 'upper', secret: true });
    a.put('chest', 46, 28, { item: 'flask' });
    a.hall(53, 35, 3, 2);
    a.door([[56, 35], [56, 36]], 'arena', { arena: 'ra' });
    a.room('ra', 57, 30, 13, 12, {
      group: 'upper', arena: true, waves: [
        [['blob', 60, 33], ['blob', 66, 33], ['blob', 63, 39], ['flit', 63, 31]],
        [['spitter', 58, 31], ['spitter', 68, 40], ['blob', 60, 38], ['blob', 66, 36], ['flit', 64, 34]]]
    });
    a.put('brazier', 59, 39).put('brazier', 67, 32);
    a.put('chest', 63, 35, { item: 'charm:leech', hidden: 'clear:ra' });
    a.hall(62, 27, 2, 2);
    a.door([[62, 29], [63, 29]], 'arena', { arena: 'ra' });
    a.room('rl', 55, 18, 11, 9, { group: 'upper', name: '上層の大燈' });
    a.put('lamp', 60, 21, { lamp: 'L2', name: '上層の大燈', group: 'upper' });
    a.put('crate', 55, 18).put('crate', 56, 18).put('crate', 65, 26);
    a.hall(50, 21, 2, 2); a.hall(53, 21, 2, 2);
    a.door([[52, 21], [52, 22]], 'oneway', { side: 'e' });
    a.hall(66, 21, 2, 2);
    a.door([[68, 21], [68, 22]], 'arena', { arena: 'boss1' });
    a.room('boss1', 69, 14, 17, 16, { group: 'upper', arena: true, boss: true, waves: [[['brood', 77, 21]]], name: 'カゲヌシの広間' });
    a.put('brazier', 72, 17).put('brazier', 82, 17).put('brazier', 72, 26).put('brazier', 82, 26);
    a.hall(87, 21, 2, 2);
    a.door([[86, 21], [86, 22]], 'seal', { cond: 'clear:boss1' });
    a.room('st1', 89, 19, 4, 6, { group: 'upper' });
    a.put('stairs', 91, 21, { to: [1, 49.5, 26.6], down: true });
    a.done();

    // ============================ ZONE 1: 中層
    const b = new MB('z1', '中層 ― 茸の洞と沈黙の書庫', 100, 54, 1);
    b.room('hub', 42, 24, 15, 11, { group: 'hub', name: '中層の大燈' });
    b.put('stairs', 49, 24, { to: [0, 90.5, 21.5], down: false });
    b.put('lamp', 49, 29, { lamp: 'L3', name: '中層の大燈', group: 'hub' });
    b.put('crate', 42, 34).put('crate', 43, 34).put('crate', 56, 24);
    // --- west: fungus caves
    b.hall(36, 28, 6, 2);
    b.room('a1', 20, 23, 16, 12, { group: 'fungus' });
    b.pit(20, 31, 5, 4);
    b.put('brazier', 21, 33, { far: true }).put('brazier', 29, 26);
    b.en('shell', 25, 27).en('blob', 31, 32).en('blob', 30, 24);
    b.put('crate', 35, 34).put('crate', 34, 34);
    b.hall(14, 28, 2, 2); b.hall(17, 28, 3, 2);
    b.door([[16, 28], [16, 29]], 'seal', { cond: 'lit:a1' });
    b.hall(26, 17, 2, 6);
    b.room('a2', 18, 6, 18, 11, { group: 'fungus' });
    b.pit(22, 6, 1, 11); b.pit(31, 6, 1, 7);
    b.put('brazier', 26, 9).put('brazier', 34, 14);
    b.en('spitter', 20, 8).en('spitter', 33, 8).en('flit', 28, 8).en('flit', 29, 12).en('blob', 20, 14);
    b.put('chest', 19, 11, { item: 'weapon:spear' });
    b.put('chest', 35, 6, { item: 'crystal:50' });
    b.rect(36, 9, 1, 2); b.put('crack', 36, 9).put('crack', 36, 10);
    b.room('sec2', 37, 7, 5, 5, { group: 'fungus', secret: true });
    b.put('chest', 39, 8, { item: 'charm:trail' }).put('crate', 41, 7).put('crate', 41, 11).put('crate', 40, 11);
    b.room('a3', 2, 22, 12, 14, {
      group: 'fungus', arena: true, name: '茸の洞の大燈', waves: [
        [['shell', 4, 24], ['spitter', 11, 33], ['blob', 10, 24], ['blob', 4, 33]],
        [['shell', 3, 33], ['shell', 12, 24], ['flit', 7, 24], ['flit', 7, 33]]]
    });
    b.put('lamp', 7, 28, { lamp: 'L4', name: '茸の洞の大燈', group: 'fungus' });
    b.put('brazier', 4, 29).put('brazier', 11, 27);
    b.put('chest', 7, 31, { item: 'charm:tempo', hidden: 'clear:a3' });
    // --- east: archive
    b.hall(57, 28, 6, 2);
    b.room('b1', 63, 23, 16, 12, { group: 'archive' });
    b.shelf(67, 25, 1, 3); b.shelf(71, 24, 1, 3); b.shelf(71, 30, 1, 4); b.shelf(75, 25, 1, 3); b.shelf(75, 31, 1, 2);
    b.pit(63, 31, 4, 4);
    b.put('brazier', 64, 33, { far: true }).put('brazier', 65, 24);
    b.en('spitter', 77, 24).en('spitter', 77, 33).en('blob', 69, 26).en('blob', 73, 32).en('flit', 69, 31);
    b.door([[72, 22], [73, 22]], 'seal', { cond: 'lit:b1' });
    b.room('b1A', 71, 20, 4, 2, { group: 'archive', secret: true });
    b.put('chest', 71, 20, { item: 'charm:retort' });
    b.hall(70, 35, 2, 5);
    b.room('b2', 62, 40, 18, 11, { group: 'archive' });
    b.shelf(66, 42, 1, 3); b.shelf(75, 46, 1, 3);
    b.pit(68, 45, 5, 1);
    b.put('brazier', 63, 41).put('brazier', 78, 49);
    b.en('shell', 65, 47).en('shell', 76, 43).en('blob', 72, 43).en('blob', 68, 49).en('spitter', 78, 41);
    b.put('chest', 70, 49, { item: 'weapon:hammer' });
    b.put('chest', 79, 40, { item: 'crystal:50' });
    b.hall(79, 28, 2, 2); b.hall(82, 28, 2, 2);
    b.rect(81, 28, 1, 2); b.put('crack', 81, 28).put('crack', 81, 29);
    b.room('b3', 84, 22, 13, 14, { group: 'archive', arena: true, name: '書庫の大燈', waves: [[['knight', 90, 25]]] });
    b.put('lamp', 90, 29, { lamp: 'L5', name: '書庫の大燈', group: 'archive' });
    b.put('brazier', 86, 24).put('brazier', 94, 33);
    b.put('chest', 90, 32, { item: 'flask', hidden: 'clear:b3' });
    // --- south: gate
    b.hall(48, 35, 2, 6);
    b.door([[48, 37], [49, 37]], 'gate', { cond: 'lamps:L4,L5' });
    b.room('pre', 43, 41, 12, 7, { group: 'hub' });
    b.put('stairs', 49, 46, { to: [2, 30.5, 4.6], down: true });
    b.put('crate', 43, 41).put('crate', 44, 41).put('crate', 54, 47).put('crate', 53, 47);
    b.done();

    // ============================ ZONE 2: 炉心
    const c = new MB('z2', '深層 ― 炉心', 60, 56, 2);
    c.room('top', 24, 2, 12, 7, { group: 'coretop', name: '深層の入口' });
    c.put('lamp', 27, 5, { lamp: 'L6', name: '深層の入口', group: 'coretop' });
    c.put('stairs', 30, 2, { to: [1, 49.5, 44.5], down: false });
    c.hall(29, 9, 2, 4);
    c.room('g1', 20, 13, 20, 12, { group: 'core' });
    c.pit(26, 16, 1, 5); c.pit(33, 17, 1, 5);
    c.put('brazier', 23, 20).put('brazier', 36, 16).put('brazier', 30, 23);
    c.en('knight', 30, 20).en('spitter', 38, 23).en('shell', 36, 21).en('flit', 23, 23).en('flit', 28, 15);
    c.put('chest', 38, 14, { item: 'crystal:90' });
    c.hall(29, 25, 2, 3);
    c.room('lr', 24, 28, 12, 7, { group: 'core', name: '炉心前の大燈' });
    c.put('lamp', 30, 30, { lamp: 'L7', name: '炉心前の大燈', group: 'core' });
    c.put('crate', 24, 28).put('crate', 25, 28).put('crate', 35, 34).put('crate', 34, 34).put('crate', 24, 34);
    c.hall(29, 35, 2, 2);
    c.door([[29, 37], [30, 37]], 'arena', { arena: 'final' });
    c.room('final', 18, 38, 24, 14, { group: 'final', arena: true, boss: true, waves: [[['eater', 30, 45]]], name: '炉心' });
    c.put('brazier', 22, 41, { relight: true }).put('brazier', 37, 41, { relight: true }).put('brazier', 22, 48, { relight: true }).put('brazier', 37, 48, { relight: true });
    c.put('heart', 30, 50);
    c.done();
    return [a, b, c];
  };

  EMB.LAMP_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];
  EMB.START = { zone: 0, x: 4.5, y: 23.5 };

  if (typeof module !== 'undefined') module.exports = EMB;
})(typeof window !== 'undefined' ? window : globalThis);
