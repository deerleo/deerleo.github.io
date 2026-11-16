// 潮汐战线：存档（localStorage + JSON）。state 是 core.js 的纯数据对局状态，meta 由界面层决定存什么。
(function (root) {
  const KEY = 'steel-tide.save.v1';
  const KEEP = 'steel-tide.save.v1.mods-keep';
  function store() { try { return root.localStorage || null; } catch (e) { return null; } }
  root.AWSave = {
    save(state, meta) {
      try {
        const ls = store(); if (!ls) return false;
        // state.ai 是电脑的临时缓存（里面有类型化数组等不可序列化的东西），不进存档
        const st = Object.assign({}, state, { ai: null });
        // 原来的存档要用现在没启用的扩展：覆盖前先挪到备用位置，装回扩展后还能接着打（见 load）
        try { const old = ls.getItem(KEY), oo = old && JSON.parse(old); if (oo && root.AWMods && root.AWMods.missing(oo.mods).length) ls.setItem(KEEP, old); } catch (e) { }
        // mods：存档时正在起作用的扩展（id 和版本）。读档时缺了哪个就不让继续，见 load()
        ls.setItem(KEY, JSON.stringify({ v: 1, at: Date.now(), state: st, meta: meta || {}, mods: root.AWMods ? root.AWMods.active() : [] }));
        return true;
      } catch (e) { return false; }
    },
    load() {
      try {
        const ls = store(); if (!ls) return null;
        let raw = ls.getItem(KEY);
        // 没有现行存档、备用位置里有一份、它要的扩展现在齐了：拿回来用
        if (!raw && root.AWMods) { try { const k = ls.getItem(KEEP), ko = k && JSON.parse(k); if (ko && !root.AWMods.missing(ko.mods).length) { ls.setItem(KEY, k); ls.removeItem(KEEP); raw = k; } } catch (e) { } }
        if (!raw) return null;
        const o = JSON.parse(raw);
        if (!o || o.v !== 1 || !o.state || typeof o.state !== 'object') return null;
        // 存档用到的扩展现在没启用：不读（存档留着不动，装回扩展就能接着打）。原因记在 AWSave.blocked，界面据此提示
        const miss = root.AWMods ? root.AWMods.missing(o.mods) : (o.mods || []);
        root.AWSave.blocked = miss.length ? { missing: miss } : null;
        if (miss.length) return null;
        o.state.ai = null;
        return { state: o.state, meta: o.meta || {} };
      } catch (e) { return null; }
    },
    // 不读档，只看一眼存档能不能用：{ has, missing: [{ id, version }] }
    check() {
      try {
        const ls = store(), raw = ls && ls.getItem(KEY); if (!raw) return { has: false, missing: [] };
        const o = JSON.parse(raw);
        return { has: true, missing: root.AWMods ? root.AWMods.missing(o && o.mods) : ((o && o.mods) || []) };
      } catch (e) { return { has: false, missing: [] }; }
    },
    blocked: null,
    clear() { try { const ls = store(); if (ls) ls.removeItem(KEY); } catch (e) { } },
  };
})(typeof window !== 'undefined' ? window : globalThis);
