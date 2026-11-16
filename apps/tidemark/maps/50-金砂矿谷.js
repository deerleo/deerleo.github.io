// 金砂矿谷：干旱高原上的矿区争夺战。整张图手写，坐标 x 从左 0 起、y 从上 0 起。
(function (root) {
  (root.AWMapList = root.AWMapList || []).push({
    name: '金砂矿谷', size: '26×16 · 五座陨星矿排在干河谷里，绿洲镇只够起步', order: 50,
    blurb: '两端的绿洲镇每天只有 5000 资金，钱都在中间的干河谷：五座陨星矿、选矿厂、东西两座矿工镇和两口导弹井。一条铁路纵贯谷底，两侧山脊各开三处隘口；正面的选矿厂打不下来，就走沙沟绕到另一头的谷口抢陨星矿和雷达塔。',
    rows: [
      'mmmwwwmmmmwuwwwvwmmmwwmmmm',
      'mm*wfwrrrrrrrtgbrrmmwwwmmm',
      'mwffwwrmmw##rwuvvemmwsswwm',
      'wwf..rrmm#gwrwwvveeewsssww',
      'fcBrrrwmm#uwr*wvvmmewwswuu',
      'Krr..rwwmm##rsvvwumeewwwuw',
      '.HrKrr.wmwc*riewummweww.ff',
      'f.rrrrrrrrrlrg*ckmmwewc..f',
      'Pc...rwmmkhuxrrcrrrrrrrra.',
      'ff.wwewmmueereehmmu.rxHc.v',
      'wffweeemmesir###ummwr.c..v',
      'uuwwweemmwv*rwg#wumwr.fcs.',
      'wwmmwweeeevwruw#wmmrrwff.w',
      'wmmwwwmmwevwruu#wmmrwwwfww',
      'mwwwwwmmwgbtrrrrrrrrw*wwwm',
      'mmmwwmmmuwvwwuwwmmmwmwwwmm',
    ],
    p2: [[22, 9], [21, 9], [23, 9], [22, 10], [24, 8]],
    units: [['inf', 2, 6], ['inf', 1, 5], ['bik', 3, 7]],
    units2: [['inf', 21, 8], ['inf', 23, 8], ['bik', 22, 8]],
  });
})(typeof window !== 'undefined' ? window : globalThis);
