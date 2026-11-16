// Small seeded random number generator (mulberry32) so every level is reproducible from its seed.
export class RNG {
  constructor(seed) { this.s = (seed >>> 0) || 1; }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  range(a, b) { return a + this.next() * (b - a); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = this.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const randomSeed = () => Math.floor(Math.random() * 899999) + 100000;
