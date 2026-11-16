// 潮汐战线：地图总表。每张图一个文件，放在 maps/ 下，各自 push 进 AWMapList。
// 浏览器里由 index.html 在本文件之前用 <script> 逐个加载；node 里（模拟、测试）自动读取 maps/ 目录。
(function (root) {
  if (typeof module !== 'undefined' && typeof require !== 'undefined') {
    const fs = require('fs'), path = require('path'), dir = path.join(__dirname, 'maps');
    root.AWMapList = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
      delete require.cache[require.resolve(path.join(dir, f))];
      require(path.join(dir, f));
    }
  }
  // 扩展的地图在这里并进来（浏览器里 AWMods 已经由 index.html 加载好；node 里现读 mods/ 目录，AW_MODS_DIR 可以换目录）
  if (typeof module !== 'undefined' && typeof require !== 'undefined') {
    const M = require('./mods.js');
    if (!M._nodeLoaded) { M._nodeLoaded = true; M.loadNode(process.env.AW_MODS_DIR || require('path').join(__dirname, 'mods')); }
  }
  if (root.AWMods) root.AWMods.applyMaps(root.AWMapList = root.AWMapList || []);
  const MAPS = (root.AWMapList || []).slice().sort((a, b) => (a.order || 50) - (b.order || 50));
  root.AWMaps = MAPS;
  if (typeof module !== 'undefined') module.exports = MAPS;
})(typeof window !== 'undefined' ? window : globalThis);
