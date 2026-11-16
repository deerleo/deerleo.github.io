// 潮汐战线：战役《黑潮》的过场插画（CG）数据。只放数据，不写逻辑；图片不内嵌，只写相对路径（file:// 下 <img src="cg/xx.webp"> 可直接加载）。
// 全局 AWCG；file:// 下直接 <script src="cg.js"> 加载，node 里 require('./cg.js')。检查：node tools/check-cg.js
// 每张图的分镜说明和状态见 tools/CG-LIST.md，提示词见 tools/cg-shots.js。
//
// 字段：
//   opening  [{ img, lines: [{ who, text }] }]   开始新战役时依次播放；who 用 campaign.js 的写法（'narrator' 或指挥官 id）
//   acts     { 幕 id（0–5，同 AWCampaign.acts[].id）: [{ img, lines }] }   进入该幕时播放，可叠在幕前旁白之前
//   scenes   { 关卡 id: { before: [{ img, lines }], after: [{ img, lines }], at: {…} } }
//            before / after：关卡对话之前 / 结尾对话之后加播的整页插画（目前都空着，留给以后）
//            at：把插画挂到现有对话的某一行上，界面从这一行起把背景换成这张图，直到同一段对话里的下一张或这段对话结束
//                at.intro  { 行号: img }              行号是 levels[].dialog.intro 的下标（从 0 起）
//                at.outro  { 行号: img }              levels[].dialog.outro 的下标
//                at.events { 事件下标: { 行号: img } }  levels[].dialog.events 的下标，再是该事件 lines 的下标
//   levels   { 关卡 id: { img, thumb } }   世界地图上每关的插图：img 1600×900，thumb 480×270（地图小卡用）。画的是这一关开打前后的一刻，不剧透结尾
//   actThumbs { 幕 id: img }   每幕开头图的 480×270 小图
//   ending   [{ img, lines }]   通关后播放，台词和 AWCampaign.epilogue 一致（可以直接代替它，也可以只取 img 当背景）
//   misc     { win, lose, power }   通用背景：胜利、失败、技能发动。power 是 { 阵营编号 1–5: img }（赤焰橙红、苍蓝蓝、翠林绿、金沙金、黑潮黑青）
(function (root) {
  const N = text => ({ who: 'narrator', text });
  const CG = {
    dir: 'cg/',
    size: [1600, 900],

    opening: [
      { img: 'cg/op-01.webp', lines: [N('很久以前，一颗陨星砸进了中央海的正中。'), N('砸出来的大坑叫海眼。海水从这里进，也从这里出。')] },
      { img: 'cg/op-02.webp', lines: [N('每过三十年，海水从海眼退下去一次。'), N('海床露出来，上面是成片的陨星碎片。')] },
      { img: 'cg/op-03.webp', lines: [N('谁挖得多，往后三十年谁说了算。'), N('所以每退一次潮，四国就打一次仗。')] },
      { img: 'cg/op-04.webp', lines: [N('今年又退潮了。'), N('这一次，海眼里开出来一支黑色的军队。')] },
      { img: 'cg/op-05.webp', lines: [N('赤焰的新人燕烽，头一回带兵。'), { who: 'blitz', text: '到了再说！' }] },
    ],

    acts: {
      0: [{ img: 'cg/act0-01.webp', lines: [N('晨曦镇外，今年第一座陨星矿露了头。'), N('燕烽只有一个念头：第一个到。')] }],
      1: [{ img: 'cg/act1-01.webp', lines: [N('最大的一片矿在海床正中，海眼的边上。'), N('炉城的命令很简单：赶到那里，占住它。')] }],
      2: [{ img: 'cg/act2-01.webp', lines: [N('去海眼要走水路，船在苍蓝手里。'), N('一支没有旗的黑色舰队，开进了内海。')] }],
      3: [{ img: 'cg/act3-01.webp', lines: [N('翠林的寨子正被人一座一座地烧。'), N('放火的人，打着赤焰的旗。')] }],
      4: [{ img: 'cg/act4-01.webp', lines: [N('打海眼要粮、要炮、要钱，这些只有金沙有。'), N('水已经漫出了海眼。')] }],
      5: [{ img: 'cg/act5-01.webp', lines: [N('赤焰、苍蓝、翠林、金沙，四国的兵头一回站到了一起。'), N('水涨到了岸边，再涨就要进城。')] }],
    },

    scenes: {
      a1_5: { before: [], after: [], at: {
        intro: { 3: 'cg/op-04.webp', 4: 'cg/sc-1_5-xuanyuan.webp' },
        outro: { 3: 'cg/sc-1_5-niujun.webp', 6: 'cg/sc-1_5-vow.webp' },
      } },
      a2_1: { before: [], after: [], at: { intro: { 2: 'cg/sc-2_1-rescue.webp' } } },
      a2_3: { before: [], after: [], at: { events: { 4: { 0: 'cg/sc-2_3-gate.webp' } } } },
      a2_5: { before: [], after: [], at: { events: { 2: { 3: 'cg/sc-2_5-now.webp' } }, outro: { 0: 'cg/sc-2_5-moon.webp', 5: 'cg/sc-2_5-canglan.webp' } } },
      a3_1: { before: [], after: [], at: { outro: { 4: 'cg/sc-3_1-rice.webp' } } },
      a3_2: { before: [], after: [], at: { intro: { 2: 'cg/sc-3_2-candle.webp' } } },
      a3_6: { before: [], after: [], at: {
        events: { 2: { 0: 'cg/sc-3_6-ship.webp' } },
        outro: { 6: 'cg/sc-3_6-qinghe.webp' },
      } },
      a4_2: { before: [], after: [], at: { intro: { 2: 'cg/sc-4_2-xuanzhu.webp' }, outro: { 1: 'cg/sc-4_2-qianduoduo.webp' } } },
      a4_4: { before: [], after: [], at: { events: { 2: { 1: 'cg/sc-4_4-wall.webp' } } } }, // 孤城（第四幕 Boss，关卡 id 是 a4_4）
      e1: { before: [], after: [], at: { intro: { 0: 'cg/sc-e1-train.webp' }, outro: { 1: 'cg/sc-e1-anvil.webp' } } },
      e2: { before: [], after: [], at: { outro: { 4: 'cg/sc-e2-flood.webp', 7: 'cg/sc-e2-low.webp' } } },
      e3: { before: [], after: [], at: {
        intro: { 0: 'cg/sc-e3-fire.webp', 4: 'cg/sc-e3-gate.webp' },
        events: { 2: { 0: 'cg/sc-e3-30years.webp' }, 5: { 1: 'cg/sc-e3-ember.webp' } },
        outro: { 4: 'cg/sc-e3-wrench.webp', 10: 'cg/sc-e3-arrived.webp' },
      } },
    },

    // 世界地图上每关一张插图（27 关都有）。img 是大图（新画的 lv-<关卡 id>，或复用的场面图），thumb 是 480×270 的小图
    levels: {
      p01: { img: 'cg/lv-p01.webp', thumb: 'cg/thumb/lv-p01.webp' }, // 序-1 第一仗
      p02: { img: 'cg/lv-p02.webp', thumb: 'cg/thumb/lv-p02.webp' }, // 序-2 对头
      a1_1: { img: 'cg/lv-a1_1.webp', thumb: 'cg/thumb/lv-a1_1.webp' }, // 1-1 别停车
      a1_2: { img: 'cg/lv-a1_2.webp', thumb: 'cg/thumb/lv-a1_2.webp' }, // 1-2 先算再打
      a1_3: { img: 'cg/lv-a1_3.webp', thumb: 'cg/thumb/lv-a1_3.webp' }, // 1-3 雾里的黑船
      a1_4: { img: 'cg/lv-a1_4.webp', thumb: 'cg/thumb/lv-a1_4.webp' }, // 1-4 加班
      a1_5: { img: 'cg/op-04.webp', thumb: 'cg/thumb/lv-a1_5.webp' }, // 1-5 海眼
      a2_1: { img: 'cg/sc-2_1-rescue.webp', thumb: 'cg/thumb/lv-a2_1.webp' }, // 2-1 抬头
      a2_2: { img: 'cg/lv-a2_2.webp', thumb: 'cg/thumb/lv-a2_2.webp' }, // 2-2 误会
      a2_3: { img: 'cg/lv-a2_3.webp', thumb: 'cg/thumb/lv-a2_3.webp' }, // 2-3 不急
      a2_4: { img: 'cg/lv-a2_4.webp', thumb: 'cg/thumb/lv-a2_4.webp' }, // 2-4 十二港
      a2_5: { img: 'cg/sc-2_5-now.webp', thumb: 'cg/thumb/lv-a2_5.webp' }, // 2-5 等潮
      a3_1: { img: 'cg/lv-a3_1.webp', thumb: 'cg/thumb/lv-a3_1.webp' }, // 3-1 又是你
      a3_2: { img: 'cg/lv-a3_2.webp', thumb: 'cg/thumb/lv-a3_2.webp' }, // 3-2 看错了
      a3_3: { img: 'cg/lv-a3_3.webp', thumb: 'cg/thumb/lv-a3_3.webp' }, // 3-3 断龙岭
      a3_4: { img: 'cg/lv-a3_4.webp', thumb: 'cg/thumb/lv-a3_4.webp' }, // 3-4 背水
      a3_5: { img: 'cg/lv-a3_5.webp', thumb: 'cg/thumb/lv-a3_5.webp' }, // 3-5 三岔口
      a3_6: { img: 'cg/lv-a3_6.webp', thumb: 'cg/thumb/lv-a3_6.webp' }, // 3-6 一个都别丢
      a4_1: { img: 'cg/lv-a4_1.webp', thumb: 'cg/thumb/lv-a4_1.webp' }, // 4-1 加急件
      a4_2: { img: 'cg/lv-a4_2.webp', thumb: 'cg/thumb/lv-a4_2.webp' }, // 4-2 这笔账
      a4_3: { img: 'cg/lv-a4_3.webp', thumb: 'cg/thumb/lv-a4_3.webp' }, // 4-3 押大
      a4_5: { img: 'cg/lv-a4_5.webp', thumb: 'cg/thumb/lv-a4_5.webp' }, // 4-4 金库
      a4_4: { img: 'cg/sc-4_4-wall.webp', thumb: 'cg/thumb/lv-a4_4.webp' }, // 4-5 孤城
      a4_6: { img: 'cg/lv-a4_6.webp', thumb: 'cg/thumb/lv-a4_6.webp' }, // 终-1 回家
      e1: { img: 'cg/sc-e1-train.webp', thumb: 'cg/thumb/lv-e1.webp' }, // 终-2 黑潮号
      e2: { img: 'cg/lv-e2.webp', thumb: 'cg/thumb/lv-e2.webp' }, // 终-3 水漫上来了
      e3: { img: 'cg/sc-e3-gate.webp', thumb: 'cg/thumb/lv-e3.webp' }, // 终-4 到了
    },
    // 世界地图上每幕的小图（480×270）；大图就是 acts[幕 id][0].img
    actThumbs: { 0: 'cg/thumb/act0.webp', 1: 'cg/thumb/act1.webp', 2: 'cg/thumb/act2.webp', 3: 'cg/thumb/act3.webp', 4: 'cg/thumb/act4.webp', 5: 'cg/thumb/act5.webp' },

    ending: [
      { img: 'cg/ed-01.webp', lines: [N('海眼关上了。'), N('海水回到了原来的岸边，不多也不少。')] },
      { img: 'cg/ed-02.webp', lines: [N('四国按出兵的人头分了这一次挖到的陨星碎片。吵了三天，没有打。'), N('玄渊的黑船队还泊在海眼外面。愿意上岸的，都上了岸。')] },
      { img: 'cg/ed-03.webp', lines: [N('秋收前，燕烽去禾寨吃了那顿新米饭。四个人，吃了两锅。'), { who: 'tide', text: '燕烽。三十年后那一架，你可别迟到。' }, { who: 'blitz', text: '我？我肯定第一个到。到了等你。' }] },
      { img: 'cg/ed-04.webp', lines: [N('下一次退潮在三十年后。那时候人会不会再打起来？'), N('到了再说。')] },
    ],

    misc: {
      win: 'cg/misc-win.webp', lose: 'cg/misc-lose.webp',
      // 按阵营编号取（1 赤焰 2 苍蓝 3 翠林 4 金沙 5 黑潮）；取不到时用 power[1]
      power: { 1: 'cg/misc-power.webp', 2: 'cg/misc-power-2.webp', 3: 'cg/misc-power-3.webp', 4: 'cg/misc-power-4.webp', 5: 'cg/misc-power-5.webp' },
    },
  };

  root.AWCG = CG;
  if (typeof module !== 'undefined') module.exports = CG;
})(typeof window !== 'undefined' ? window : globalThis);
