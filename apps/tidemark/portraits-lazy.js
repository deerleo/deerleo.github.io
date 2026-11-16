// 指挥官立绘，按需加载版。由 tools/build-portraits-lazy.js 生成，不要手改。图在 portraits/（高清）和 portraits/thumb/（小图）。
(function runtime(root, HI, TH) {
  'use strict';
  // 接口和内嵌版（portraits.js）一样：get(id, mood) 小图、hi(id, mood) 高清大图，返回已加载好的 Image，还没到就返回 null（同时开始取）。
  // 另外多了：src(id, mood, big) 图的地址（不等加载，直接给 <img> / 背景用）；own(id) 是不是清单里的指挥官；
  //           when(id, mood, big, fn) 这张图到了以后叫一声；prefetch(ids, moods, big) 空闲时排队预取（一次两张，不抢带宽）。
  const BASE = 'portraits/', cache = {}, seen = new Set(), queue = [];
  let busy = 0;
  // 小图清单里没有的表情：沿用高清图（和内嵌版一致）；表情没有就退回 normal
  const pick = (id, mood, big) => {
    const hi = HI[id] || [], th = TH[id] || [];
    if (!hi.length && !th.length) return null;
    const md = (big ? hi : th.concat(hi)).includes(mood) ? mood : 'normal';
    if (big) return hi.includes(md) ? BASE + id + '-' + md + '.webp' : pick(id, mood, false);
    return th.includes(md) ? BASE + 'thumb/' + id + '-' + md + '.webp' : hi.includes(md) ? BASE + id + '-' + md + '.webp' : null;
  };
  const image = url => { let im = cache[url]; if (!im) { im = cache[url] = new Image(); im.decoding = 'async'; im.src = url; } return im; };
  const load = (id, mood, big) => { const u = pick(id, mood || 'normal', big); if (!u) return null; seen.add(id); const im = image(u); return im.complete && im.naturalWidth ? im : null; };
  function pump() {
    while (busy < 2 && queue.length) {
      const u = queue.shift(); if (cache[u]) continue;
      const im = image(u); if (im.complete) continue;
      busy++; const done = () => { busy--; pump(); }; im.addEventListener('load', done); im.addEventListener('error', done);
    }
  }
  const P = {
    ids: Object.keys(Object.assign({}, TH, HI)), lazy: true,
    get(id, mood) { return load(id, mood, false); },
    hi(id, mood) { return load(id, mood, true); },
    src(id, mood, big) { const u = pick(id, mood || 'normal', !!big); if (u) seen.add(id); return u || ''; },
    own(id) { return !!(HI[id] || TH[id]); },
    when(id, mood, big, fn) { const u = pick(id, mood || 'normal', !!big); if (!u) return; const im = image(u); if (im.complete && im.naturalWidth) fn(u); else im.addEventListener('load', () => fn(u)); },
    prefetch(ids, moods, big) { for (const id of ids || P.ids) for (const md of moods || ['normal']) { const u = pick(id, md, !!big); if (u && !cache[u] && !queue.includes(u)) queue.push(u); } pump(); },
    // 内嵌版的 preload / preloadHi 是“全部解码一遍”。按需版只管这一局露过面的指挥官，排队慢慢取
    preload() { P.prefetch([...seen], ['normal', 'power', 'lose'], false); },
    preloadHi(mood) { P.prefetch([...seen], [mood || 'normal'], true); },
  };
  root.AWPortraits = P;
})(window, {"abyss":["lose","normal","power"],"anvil":["lose","normal","power"],"blitz":["lose","normal","power"],"bolt":["lose","normal","power"],"candle":["lose","normal","power"],"coin":["lose","normal","power"],"dice":["lose","normal","power"],"ember":["lose","normal","power"],"forge":["lose","normal","power"],"frost":["lose","normal","power"],"gold":["lose","normal","power"],"guard":["lose","normal","power"],"hawk":["lose","normal","power"],"heli":["lose","normal","power"],"iron":["lose","normal","power"],"medic":["lose","normal","power"],"militia":["lose","normal","power"],"moon":["lose","normal","power"],"nomad":["lose","normal","power"],"owl":["lose","normal","power"],"pyro":["lose","normal","power"],"rider":["lose","normal","power"],"shark":["lose","normal","power"],"sky":["lose","normal","power"],"storm":["lose","normal","power"],"tide":["lose","normal","power"],"toll":["lose","normal","power"],"wall":["lose","normal","power"],"wheel":["lose","normal","power"]}, {"abyss":["lose","normal","power"],"anvil":["lose","normal","power"],"blitz":["lose","normal","power"],"bolt":["lose","normal","power"],"candle":["lose","normal","power"],"coin":["lose","normal","power"],"dice":["lose","normal","power"],"ember":["lose","normal","power"],"forge":["lose","normal","power"],"frost":["lose","normal","power"],"gold":["lose","normal","power"],"guard":["lose","normal","power"],"hawk":["lose","normal","power"],"heli":["lose","normal","power"],"iron":["lose","normal","power"],"medic":["lose","normal","power"],"militia":["lose","normal","power"],"moon":["lose","normal","power"],"nomad":["lose","normal","power"],"owl":["lose","normal","power"],"pyro":["lose","normal","power"],"rider":["lose","normal","power"],"shark":["lose","normal","power"],"sky":["lose","normal","power"],"storm":["lose","normal","power"],"tide":["lose","normal","power"],"toll":["lose","normal","power"],"wall":["lose","normal","power"],"wheel":["lose","normal","power"]});
