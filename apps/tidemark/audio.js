/* 潮汐战线 · 音乐与音效（纯 WebAudio 实时合成，无音频文件、无依赖）
 *
 * window.AWAudio
 *   unlock()                    用户首次操作时调用；重复调用无害
 *   sfx(name)                   tick ok no move shot cannon boom cap captured build turn power win lose
 *   music(track)                'title' | 'p1' | 'p2' | 'battle' | 'off'
 *   setVolume(music01, sfx01)   任一参数传 null/undefined 表示不改
 *   setMuted(bool) / muted      静音状态存 localStorage
 *
 * 未解锁时 music(track) 只记下曲名，unlock() 之后自动开始播放；sfx 直接忽略。
 * 调试用（下划线开头，游戏里不需要）：_info() _state() _renderOffline(opts)
 */
(function (root) {
  'use strict';

  var STORE_KEY = 'steel-tide-audio-muted';
  var DEFAULT_MUSIC_VOL = 0.22;
  var DEFAULT_SFX_VOL = 0.8;
  var FADE = 0.5;          // 切歌淡入淡出秒数
  var LOOKAHEAD = 0.25;    // 前瞻调度窗口（秒）
  var TICK_MS = 40;        // 调度器唤醒间隔，只负责把音符排到 AudioContext 时间轴上

  // ---------------------------------------------------------------- 音高

  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function pitchClass(name) {
    var pc = PC[name.charAt(0)];
    if (name.charAt(1) === '#') pc += 1;
    if (name.charAt(1) === 'b') pc -= 1;
    return (pc + 12) % 12;
  }
  function noteMidi(name) {              // "F#5" "Bb4"
    var m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) return null;
    return 12 * (parseInt(m[2], 10) + 1) + pitchClass(m[1]);
  }
  function midiFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function pcAtOrAbove(pc, low) { return low + ((pc - (low % 12)) + 12) % 12; }
  function parseChord(name) {            // "C" "Am" "Bb" "F#m"
    var m = /^([A-G][#b]?)(m?)$/.exec(name);
    if (!m) return null;
    return { pc: pitchClass(m[1]), third: m[2] ? 3 : 4 };
  }
  function parseNotes(str) {             // "E5/2 -/4" -> [{midi|null, len}]
    var out = [], toks = str.trim().split(/\s+/);
    for (var i = 0; i < toks.length; i++) {
      var p = toks[i].split('/');
      out.push({ midi: p[0] === '-' ? null : noteMidi(p[0]), len: parseFloat(p[1]) });
    }
    return out;
  }

  // ---------------------------------------------------------------- 曲目（全部原创）
  // 每小节 16 步（十六分音符）。melody 每小节一串 "音名/步数"，'-' 为休止。

  var TRACKS = {
    // 标题页：A 小调，沉稳，后半段往上走
    title: {
      bpm: 88,
      lead: { wave: 'triangle', gain: 0.26, gate: 0.94, a: 0.02, s: 0.8, r: 0.08 },
      bass: { style: 'long', gain: 0.24 },
      comp: { style: 'arp', gain: 0.045, wave: 'pulse', pattern: [0, 1, 2, 3, 2, 1, 2, 1], gate: 0.7 },
      chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'F', 'G', 'Am', 'Em', 'F', 'G', 'Am', 'E'],
      melody: [
        'A4/8 C5/4 E5/4',
        'F5/12 E5/2 C5/2',
        'E5/8 G5/4 E5/4',
        'D5/12 -/4',
        'A4/8 C5/4 E5/4',
        'A5/12 G5/2 F5/2',
        'G5/8 D5/4 G5/4',
        'G#5/12 -/4',
        'A5/6 G5/2 F5/4 C5/4',
        'B5/6 A5/2 G5/4 D5/4',
        'C6/8 B5/4 A5/4',
        'G5/12 E5/4',
        'F5/4 A5/4 C6/8',
        'D6/8 B5/4 G5/4',
        'A5/12 E5/4',
        'E5/4 G#5/4 B5/4 E5/2 G#5/2'
      ],
      drums: {
        seq: 'aaaaaaaf bbbbbbbf',
        a: ['K.......k.......', 'h...h...h...h...'],
        b: ['K.......k.....k.', 'h.h.h.h.h.h.h.h.'],
        f: ['K.......k...ssSS', 'h...h...h.......']
      }
    },

    // 红方：C 大调进行曲，A A' B 三段
    p1: {
      bpm: 126,
      lead: { wave: 'square', gain: 0.15, gate: 0.86, a: 0.005, s: 0.65, r: 0.03 },
      bass: { style: 'march', gain: 0.3 },
      comp: { style: 'stab', gain: 0.04, wave: 'pulse', gate: 0.8 },
      chords: [
        'C', 'C', 'F', 'G', 'Am', 'F', 'Dm', 'G',
        'C', 'C', 'F', 'G', 'Am', 'F', 'G', 'C',
        'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'G'
      ],
      melody: [
        'G4/2 C5/2 E5/2 G5/2 E5/4 C5/2 E5/2',
        'D5/3 E5/1 D5/2 C5/2 G4/6 -/2',
        'A4/2 C5/2 F5/2 A5/2 G5/4 F5/2 E5/2',
        'D5/4 B4/2 D5/2 G5/6 -/2',
        'E5/2 A5/2 G5/2 E5/2 C5/4 E5/4',
        'F5/3 E5/1 F5/2 A5/2 C6/4 A5/4',
        'F5/2 E5/2 D5/2 F5/2 A5/2 G5/2 F5/2 D5/2',
        'G5/4 D5/2 B4/2 G4/2 B4/2 D5/2 G5/2',

        'G4/2 C5/2 E5/2 G5/2 E5/4 C5/2 E5/2',
        'D5/3 E5/1 D5/2 C5/2 G4/4 C5/2 E5/2',
        'A4/2 C5/2 F5/2 A5/2 G5/4 F5/2 E5/2',
        'D5/4 B4/2 D5/2 G5/4 A5/2 B5/2',
        'C6/4 A5/2 E5/2 A5/4 G5/2 E5/2',
        'F5/2 A5/2 C6/2 A5/2 F5/4 E5/2 F5/2',
        'G5/3 A5/1 G5/2 F5/2 E5/2 D5/2 B4/2 D5/2',
        'C5/6 -/2 C5/1 C5/1 C5/2 C5/4',

        'A5/6 F5/2 C5/4 F5/4',
        'B5/6 G5/2 D5/4 G5/4',
        'G5/4 E5/2 G5/2 B5/4 G5/4',
        'A5/6 -/2 E5/2 A5/2 C6/4',
        'C6/3 A5/1 F5/2 A5/2 C6/4 A5/4',
        'B5/3 G5/1 D5/2 G5/2 B5/4 D6/4',
        'E6/4 C6/2 G5/2 E5/2 G5/2 C6/4',
        'D6/4 B5/2 G5/2 D5/2 G5/2 B5/2 D5/2'
      ],
      drums: {
        seq: 'aaafaaaf aaafaaaf bbbbbbbf',
        a: ['K...S...K...S.s.', 'h.h.h.h.h.h.h.hh'],
        b: ['K...S..sK.K.S...', 'h.h.h.h.h.h.h.h.'],
        f: ['K...S...K.s.SsSS', 'h.h.h.h.h.......']
      }
    },

    // 蓝方：E 小调，切分低音，冷一些
    p2: {
      bpm: 112,
      lead: { wave: 'pulse', gain: 0.17, gate: 0.82, a: 0.005, s: 0.6, r: 0.04 },
      bass: { style: 'pulse', gain: 0.3 },
      comp: { style: 'arp', gain: 0.04, wave: 'triangle', pattern: [0, 2, 1, 2, 3, 2, 1, 2], gate: 0.5 },
      chords: [
        'Em', 'Em', 'C', 'D', 'Em', 'G', 'Am', 'B',
        'Em', 'Em', 'C', 'D', 'G', 'D', 'B', 'Em',
        'C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B'
      ],
      melody: [
        'E5/3 -/1 B4/2 E5/2 G5/3 F#5/1 E5/4',
        'B4/6 -/2 B4/2 D5/2 E5/4',
        'E5/3 -/1 C5/2 E5/2 G5/3 A5/1 G5/4',
        'F#5/6 -/2 D5/2 F#5/2 A5/4',
        'B5/4 G5/2 E5/2 B4/4 E5/2 G5/2',
        'D5/3 G5/3 B5/2 A5/4 G5/4',
        'A5/2 E5/2 C5/2 E5/2 A5/2 G5/2 E5/2 C5/2',
        'B4/4 D#5/4 F#5/4 B5/2 -/2',

        'E5/3 -/1 B4/2 E5/2 G5/3 F#5/1 E5/4',
        'B4/6 -/2 E5/2 G5/2 B5/4',
        'E5/3 -/1 C5/2 E5/2 G5/3 A5/1 G5/4',
        'F#5/4 A5/4 D6/6 -/2',
        'D6/3 B5/3 G5/2 D5/4 G5/4',
        'A5/3 F#5/3 D5/2 A4/4 D5/4',
        'B4/2 D#5/2 F#5/2 B5/2 A5/2 F#5/2 D#5/2 F#5/2',
        'E5/8 -/4 B4/2 E5/2',

        'G5/8 E5/4 C5/4',
        'A5/8 F#5/4 D5/4',
        'B5/6 A5/2 G5/4 E5/4',
        'E5/2 G5/2 B5/2 E6/2 B5/8',
        'C6/8 G5/4 E5/4',
        'D6/8 A5/4 F#5/4',
        'B5/3 -/1 B5/2 A5/2 F#5/4 D#5/4',
        'B4/2 D#5/2 F#5/2 A5/2 B5/4 -/4'
      ],
      drums: {
        seq: 'aaafaaaf aaafaaaf bbbbbbaf',
        a: ['K.....K.S.....K.', 'H..hH..hH..hH.hh'],
        b: ['K.......S.......', 'H..hH..hH..hH..h'],
        f: ['K.....K.S...S.SS', 'H..hH..hH.......']
      }
    },

    // 交战：D 小调，八分音符推进
    battle: {
      bpm: 150,
      lead: { wave: 'square', gain: 0.15, gate: 0.84, a: 0.004, s: 0.6, r: 0.03 },
      bass: { style: 'drive', gain: 0.28 },
      comp: { style: 'chug', gain: 0.04, wave: 'pulse', gate: 0.9 },
      chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
      melody: [
        'D5/2 D5/1 D5/1 F5/2 D5/2 A5/4 G5/2 F5/2',
        'E5/2 F5/2 D5/4 -/2 A4/2 D5/2 F5/2',
        'Bb4/2 Bb4/1 Bb4/1 D5/2 F5/2 Bb5/4 A5/2 F5/2',
        'G5/2 E5/2 C5/4 -/2 E5/2 G5/2 C6/2',
        'D6/2 D6/1 D6/1 A5/2 F5/2 D5/4 F5/2 A5/2',
        'G5/2 F5/2 E5/2 F5/2 D5/6 -/2',
        'F5/3 D5/3 Bb4/2 D5/3 F5/3 Bb5/2',
        'A5/4 E5/2 C#5/2 A4/2 C#5/2 E5/2 A5/2',
        'Bb5/6 G5/2 D5/4 G5/4',
        'Bb5/2 A5/2 G5/2 A5/2 Bb5/4 D6/4',
        'A5/6 F5/2 D5/4 F5/4',
        'A5/2 G5/2 F5/2 G5/2 A5/4 D6/4',
        'D6/3 Bb5/3 F5/2 Bb5/3 D6/3 F6/2',
        'E6/3 C6/3 G5/2 C6/3 E6/3 G5/2',
        'A5/2 A5/1 A5/1 C#6/2 E6/2 C#6/4 A5/4',
        'E5/2 A5/2 C#6/2 E6/2 A5/1 A5/1 A5/1 A5/1 A5/4'
      ],
      drums: {
        seq: 'aaafaaaf bbbfaaaf',
        a: ['K..K..S.K..K..S.', 'HhHhHhHhHhHhHhHh'],
        b: ['K...S...K.K.S...', 'HhHhHhHhHhHhHhHO'],
        f: ['K..K..S.K.S.SSSS', 'HhHhHhHh........']
      }
    }
  };

  var DRUM_GAIN = { K: 0.5, k: 0.28, S: 0.26, s: 0.11, H: 0.06, h: 0.035, O: 0.06 };

  // 把曲目编译成按步索引的事件表（纯数据，不依赖 AudioContext）
  function compile(def) {
    var bars = def.melody.length, total = bars * 16, steps = [], errors = [], notes = 0, i, b;
    for (i = 0; i < total; i++) steps.push([]);
    function add(step, ev) { steps[step].push(ev); notes++; }

    if (def.chords.length !== bars) errors.push('chords ' + def.chords.length + ' != bars ' + bars);
    var seq = def.drums.seq.replace(/\s+/g, '');
    if (seq.length !== bars) errors.push('drum seq ' + seq.length + ' != bars ' + bars);

    for (b = 0; b < bars; b++) {
      var base = b * 16, pos = 0;

      // 主旋律
      var mel = parseNotes(def.melody[b]);
      for (i = 0; i < mel.length; i++) {
        if (mel[i].midi != null && pos < 16) add(base + pos, { v: 'lead', f: midiFreq(mel[i].midi), len: mel[i].len });
        pos += mel[i].len;
      }
      if (pos !== 16) errors.push('bar ' + (b + 1) + ' melody sums to ' + pos);

      var ch = parseChord(def.chords[b] || 'C');
      if (!ch) { errors.push('bad chord ' + def.chords[b]); ch = parseChord('C'); }

      // 低音：根音落在 E2..D#3
      var r = pcAtOrAbove(ch.pc, 40), fifth = (r - 5 >= 38) ? r - 5 : r + 7;
      var bs = def.bass.style;
      function bass(step, midi, len, g) { add(base + step, { v: 'bass', f: midiFreq(midi), len: len, g: g || 1 }); }
      if (bs === 'long') { bass(0, r, 8); bass(8, fifth, 6); bass(14, r, 2, 0.8); }
      else if (bs === 'march') { bass(0, r, 3); bass(8, fifth, 3); bass(14, r, 2, 0.8); }
      else if (bs === 'pulse') { bass(0, r, 3); bass(6, r, 2, 0.8); bass(8, fifth, 3); bass(14, r + 12, 2, 0.7); }
      else if (bs === 'drive') {
        for (i = 0; i < 16; i += 2) bass(i, (i === 6 || i === 14) ? r + 12 : r, 2, (i % 4) ? 0.8 : 1);
      }

      // 和声：和弦音落在 G3 往上
      var c0 = pcAtOrAbove(ch.pc, 55), tones = [c0, c0 + ch.third, c0 + 7, c0 + 12];
      var cs = def.comp.style;
      function comp(step, midi, len, g) { add(base + step, { v: 'comp', f: midiFreq(midi), len: len, g: g || 1 }); }
      if (cs === 'stab') {
        [4, 12].forEach(function (s) { comp(s, tones[0], 2); comp(s, tones[1], 2); comp(s, tones[2], 2); });
        comp(10, tones[1], 1, 0.7); comp(10, tones[2], 1, 0.7);
      } else if (cs === 'arp') {
        for (i = 0; i < 8; i++) comp(i * 2, tones[def.comp.pattern[i]], 2, i % 2 ? 0.8 : 1);
      } else if (cs === 'chug') {
        [0, 3, 6, 8, 11, 14].forEach(function (s) { comp(s, tones[0], 1.5); comp(s, tones[2], 1.5); });
      }

      // 鼓
      var pat = def.drums[seq.charAt(b)] || def.drums.a;
      for (var line = 0; line < pat.length; line++) {
        if (pat[line].length !== 16) errors.push('drum pattern ' + seq.charAt(b) + ' line ' + line + ' length ' + pat[line].length);
        for (i = 0; i < 16; i++) {
          var c = pat[line].charAt(i);
          if (DRUM_GAIN[c]) add(base + i, { v: 'drum', d: c });
        }
      }
    }

    var stepDur = 60 / def.bpm / 4;
    return { steps: steps, total: total, bars: bars, stepDur: stepDur, seconds: total * stepDur, errors: errors, notes: notes };
  }

  var compiledCache = {};
  function compiled(name) {
    if (!compiledCache[name]) compiledCache[name] = compile(TRACKS[name]);
    return compiledCache[name];
  }

  // ---------------------------------------------------------------- 合成基础

  var noiseBufs = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var pulseWaves = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;

  function noiseBuffer(ac) {
    var buf = noiseBufs && noiseBufs.get(ac);
    if (buf) return buf;
    buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.5), ac.sampleRate);
    var d = buf.getChannelData(0), seed = 20261112;
    for (var i = 0; i < d.length; i++) {       // 固定种子，离线渲染结果可复现
      seed = (seed * 1664525 + 1013904223) >>> 0;
      d[i] = seed / 2147483648 - 1;
    }
    if (noiseBufs) noiseBufs.set(ac, buf);
    return buf;
  }

  var softWaves = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function softWave(ac, kind) {
    var m = softWaves && softWaves.get(ac); if (!m) { m = {}; if (softWaves) softWaves.set(ac, m); }
    if (m[kind]) return m[kind];
    var n = 14, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) {
      var roll = 1 / (1 + Math.pow(k / 4.5, 2));          // 第 5 次泛音以上很快收掉
      if (kind === 'square') im[k] = (k % 2 ? 1 / k : 0) * roll;
      else if (kind === 'sawtooth') im[k] = (1 / k) * roll * 0.8;
      else re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25) * roll;
    }
    return (m[kind] = ac.createPeriodicWave(re, im));
  }
  function pulseWave(ac) {                     // 25% 占空比脉冲波
    var w = pulseWaves && pulseWaves.get(ac);
    if (w) return w;
    var n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (var k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    w = ac.createPeriodicWave(re, im);
    if (pulseWaves) pulseWaves.set(ac, w);
    return w;
  }

  // 一个带包络的振荡器音。o: {type,f,f1,t,dur,g,a,d,s,r}
  function tone(ac, dest, o) {
    var t = o.t, dur = Math.max(0.012, o.dur);
    var a = Math.min(o.a == null ? 0.005 : o.a, dur * 0.25);
    var r = Math.min(o.r == null ? 0.03 : o.r, dur * 0.35);
    var d = Math.min(o.d == null ? 0.06 : o.d, dur - a - r);
    var s = o.s == null ? 0.7 : o.s;
    var osc = ac.createOscillator(), g = ac.createGain();
    // 方波、锯齿波、脉冲波都换成“泛音逐级收小”的柔和版本（原始波形的高次泛音一路不衰减，是刺耳的根源）；三角波、正弦波照旧
    var ty = o.type || 'square';
    if (ty === 'square' || ty === 'sawtooth' || ty === 'pulse') osc.setPeriodicWave(softWave(ac, ty)); else osc.type = ty;
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.g, t + a);
    g.gain.linearRampToValueAtTime(o.g * s, t + a + d);
    g.gain.setValueAtTime(o.g * s, t + dur - r);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // 一段滤波噪声。o: {t,dur,g,type,freq,f1,q,a}
  function noise(ac, dest, o) {
    var t = o.t, dur = Math.max(0.01, o.dur);
    var src = ac.createBufferSource(), flt = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuffer(ac); src.loop = true;
    flt.type = o.type || 'highpass';
    flt.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.f1) flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    if (o.q) flt.Q.value = o.q;
    var a = Math.min(o.a == null ? 0.002 : o.a, dur * 0.3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.g, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(dest);
    src.start(t, (t * 0.37) % 1.2); src.stop(t + dur + 0.02);
  }

  function drumHit(ac, dest, c, t) {
    var g = DRUM_GAIN[c];
    if (c === 'K' || c === 'k') {
      tone(ac, dest, { type: 'sine', f: 150, f1: 45, t: t, dur: 0.15, g: g, a: 0.002, d: 0.08, s: 0.25, r: 0.05 });
    } else if (c === 'S' || c === 's') {
      noise(ac, dest, { t: t, dur: 0.13, g: g, type: 'highpass', freq: 1400 });
      tone(ac, dest, { type: 'triangle', f: 230, f1: 160, t: t, dur: 0.07, g: g * 0.6, a: 0.002, s: 0.3 });
    } else if (c === 'O') {
      noise(ac, dest, { t: t, dur: 0.18, g: g, type: 'highpass', freq: 6500 });
    } else {
      noise(ac, dest, { t: t, dur: 0.04, g: g, type: 'highpass', freq: 7000 });
    }
  }

  // 软限幅：0.6 以下线性，往上平滑压到 0.88 以内，保证输出不削波
  function softClipCurve() {
    var n = 2049, c = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1, ax = Math.abs(x);
      var y = ax <= 0.82 ? ax : 0.82 + 0.16 * tanh((ax - 0.82) / 0.16);
      c[i] = x < 0 ? -y : y;
    }
    return c;
  }
  function tanh(x) { var e = Math.exp(2 * x); return (e - 1) / (e + 1); }

  // music -> pause -> master -> 软限幅 -> 输出； sfx -> master
  function buildGraph(ac, mVol, sVol, isMuted) {
    var g = {
      music: ac.createGain(), pause: ac.createGain(), sfx: ac.createGain(),
      master: ac.createGain(), clip: ac.createWaveShaper(), comp: ac.createDynamicsCompressor(), trim: ac.createGain()
    };
    g.music.gain.value = mVol; g.sfx.gain.value = sVol;
    g.master.gain.value = isMuted ? 0 : 1;
    g.clip.curve = softClipCurve();
    // 刺耳的来源：几路方波叠在一起撞进软限幅（原来 0.6 就开始压，等于一直在失真），鼓的噪声又不过低通。
    // 现在：音乐先降一点 → 压缩器把峰值压平 → 限幅只兜底（见 softClipCurve 的拐点）
    g.trim.gain.value = 0.72;
    g.comp.threshold.value = -20; g.comp.knee.value = 18; g.comp.ratio.value = 5; g.comp.attack.value = 0.004; g.comp.release.value = 0.18;
    g.music.connect(g.pause); g.pause.connect(g.trim); g.trim.connect(g.master);
    g.sfx.connect(g.master); g.master.connect(g.comp); g.comp.connect(g.clip); g.clip.connect(ac.destination);
    return g;
  }

  // 每首曲子一组自己的节点，便于交叉淡入淡出
  function trackNodes(ac, bus) {
    var gain = ac.createGain(), lp = ac.createBiquadFilter();
    // 旋律和声走 2600Hz 低通（方波的高次泛音是“扎耳朵”的那部分），鼓另走一个 6000Hz 低通并压小一点
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.2;
    var dlp = ac.createBiquadFilter(), dg = ac.createGain();
    dlp.type = 'lowpass'; dlp.frequency.value = 6000; dlp.Q.value = 0.2; dg.gain.value = 0.7;
    lp.connect(gain); dlp.connect(dg); dg.connect(gain); gain.connect(bus);
    return { gain: gain, tonal: lp, drums: dlp };
  }

  function playStep(ac, nodes, def, comp, step, t) {
    var evs = comp.steps[step], sd = comp.stepDur;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.v === 'lead') {
        var L = def.lead;
        tone(ac, nodes.tonal, { type: L.wave, f: e.f, t: t, dur: e.len * sd * L.gate, g: L.gain, a: L.a, d: 0.08, s: L.s, r: L.r });
      } else if (e.v === 'bass') {
        tone(ac, nodes.tonal, { type: 'triangle', f: e.f, t: t, dur: e.len * sd * 0.9, g: def.bass.gain * e.g, a: 0.006, d: 0.1, s: 0.75, r: 0.04 });
      } else if (e.v === 'comp') {
        tone(ac, nodes.tonal, { type: def.comp.wave, f: e.f, t: t, dur: e.len * sd * def.comp.gate, g: def.comp.gain * e.g, a: 0.004, d: 0.05, s: 0.5, r: 0.03 });
      } else {
        drumHit(ac, nodes.drums, e.d, t);
      }
    }
  }

  // ---------------------------------------------------------------- 音效

  // 用同一套 "音名/时值" 记法排一串音
  function phrase(ac, out, t, unit, str, o) {
    var ns = parseNotes(str), pos = 0;
    for (var i = 0; i < ns.length; i++) {
      if (ns[i].midi != null) {
        tone(ac, out, {
          type: o.type, f: midiFreq(ns[i].midi), t: t + pos * unit, dur: ns[i].len * unit * (o.gate || 0.9),
          g: o.g, a: o.a, d: o.d, s: o.s, r: o.r
        });
      }
      pos += ns[i].len;
    }
  }

  var SFX = {
    tick: function (ac, out, t, k) {
      tone(ac, out, { type: 'square', f: 1320, t: t, dur: 0.022, g: 0.075 * k, a: 0.001, s: 0.4, r: 0.01 });
    },
    ok: function (ac, out, t, k) {
      phrase(ac, out, t, 0.055, 'E5/1 B5/2', { type: 'square', g: 0.16 * k, s: 0.5 });
    },
    no: function (ac, out, t, k) {
      phrase(ac, out, t, 0.07, 'G3/1 D3/2', { type: 'square', g: 0.17 * k, s: 0.8, gate: 0.8 });
    },
    move: function (ac, out, t, k) {
      tone(ac, out, { type: 'triangle', f: 190, f1: 110, t: t, dur: 0.07, g: 0.26 * k, a: 0.003, s: 0.4 });
      noise(ac, out, { t: t, dur: 0.05, g: 0.06 * k, type: 'lowpass', freq: 900 });
    },
    shot: function (ac, out, t, k) {
      for (var i = 0; i < 3; i++) {
        var tt = t + i * 0.065;
        noise(ac, out, { t: tt, dur: 0.05, g: 0.32 * k, type: 'bandpass', freq: 2400, q: 0.7 });
        tone(ac, out, { type: 'square', f: 420, f1: 140, t: tt, dur: 0.035, g: 0.12 * k, a: 0.001, s: 0.3 });
      }
    },
    cannon: function (ac, out, t, k) {
      tone(ac, out, { type: 'sine', f: 120, f1: 38, t: t, dur: 0.34, g: 0.42 * k, a: 0.003, d: 0.2, s: 0.3, r: 0.1 });
      noise(ac, out, { t: t, dur: 0.36, g: 0.3 * k, type: 'lowpass', freq: 1600, f1: 180 });
      noise(ac, out, { t: t, dur: 0.03, g: 0.14 * k, type: 'highpass', freq: 3000 });
    },
    boom: function (ac, out, t, k) {
      tone(ac, out, { type: 'sine', f: 95, f1: 28, t: t, dur: 0.7, g: 0.42 * k, a: 0.004, d: 0.35, s: 0.3, r: 0.25 });
      noise(ac, out, { t: t, dur: 0.95, g: 0.32 * k, type: 'lowpass', freq: 2200, f1: 90 });
      noise(ac, out, { t: t + 0.09, dur: 0.22, g: 0.1 * k, type: 'bandpass', freq: 1100, q: 1.2 });
      noise(ac, out, { t: t + 0.24, dur: 0.3, g: 0.07 * k, type: 'bandpass', freq: 700, q: 1.2 });
    },
    cap: function (ac, out, t, k) {
      phrase(ac, out, t, 0.07, 'C5/1 E5/2', { type: 'triangle', g: 0.2 * k, s: 0.6 });
    },
    captured: function (ac, out, t, k) {
      phrase(ac, out, t, 0.075, 'C5/1 E5/1 G5/1 C6/4', { type: 'square', g: 0.11 * k, s: 0.6, r: 0.08 });
      phrase(ac, out, t, 0.075, '-/3 E5/4', { type: 'triangle', g: 0.12 * k, s: 0.6, r: 0.08 });
    },
    build: function (ac, out, t, k) {
      phrase(ac, out, t, 0.08, 'A2/1 D3/1 A3/1 D4/2', { type: 'square', g: 0.14 * k, s: 0.5, gate: 0.7 });
      for (var i = 0; i < 3; i++) noise(ac, out, { t: t + i * 0.08, dur: 0.03, g: 0.07 * k, type: 'highpass', freq: 4000 });
      noise(ac, out, { t: t + 0.26, dur: 0.16, g: 0.07 * k, type: 'bandpass', freq: 2600, f1: 5200, q: 2 });
    },
    turn: function (ac, out, t, k) {
      var s = 'G4/1 C5/1 E5/1 G5/2 E5/1 G5/5';
      phrase(ac, out, t, 0.085, s, { type: 'triangle', g: 0.2 * k, s: 0.75, r: 0.06 });
      phrase(ac, out, t, 0.085, s, { type: 'pulse', g: 0.05 * k, s: 0.6, r: 0.06 });
    },
    power: function (ac, out, t, k) {
      tone(ac, out, { type: 'sawtooth', f: 160, f1: 1400, t: t, dur: 0.42, g: 0.07 * k, a: 0.05, d: 0.3, s: 1, r: 0.05 });
      noise(ac, out, { t: t, dur: 0.45, g: 0.05 * k, type: 'bandpass', freq: 500, f1: 6000, q: 3, a: 0.2 });
      ['D5', 'A5', 'D6', 'F#6'].forEach(function (n, i) {
        tone(ac, out, { type: i < 2 ? 'square' : 'triangle', f: midiFreq(noteMidi(n)), t: t + 0.42 + i * 0.03, dur: 0.6, g: 0.06 * k, a: 0.005, d: 0.3, s: 0.4, r: 0.25 });
      });
      tone(ac, out, { type: 'sine', f: 110, f1: 55, t: t + 0.42, dur: 0.3, g: 0.25 * k, s: 0.3 });
    },
    win: function (ac, out, t, k) {
      var u = 0.095;
      phrase(ac, out, t, u, 'G4/1 G4/1 C5/2 E5/1 C5/1 E5/2 G5/2 E5/1 G5/1 C6/8', { type: 'square', g: 0.09 * k, s: 0.65, r: 0.1 });
      phrase(ac, out, t, u, 'E4/1 E4/1 G4/2 C5/1 G4/1 C5/2 E5/2 C5/1 E5/1 G5/8', { type: 'triangle', g: 0.11 * k, s: 0.7, r: 0.1 });
      phrase(ac, out, t, u, 'C3/4 C3/4 G3/4 C3/8', { type: 'triangle', g: 0.18 * k, s: 0.7, gate: 0.8 });
      [0, 4, 8, 12].forEach(function (s) { noise(ac, out, { t: t + s * u, dur: 0.1, g: 0.08 * k, type: 'highpass', freq: 1500 }); });
    },
    lose: function (ac, out, t, k) {
      var u = 0.17;
      phrase(ac, out, t, u, 'E5/2 D5/1 C5/1 B4/2 G#4/2 A4/6', { type: 'triangle', g: 0.2 * k, s: 0.8, r: 0.15, gate: 0.95 });
      phrase(ac, out, t, u, 'A3/4 E3/4 A2/6', { type: 'triangle', g: 0.2 * k, s: 0.8, r: 0.15 });
      phrase(ac, out, t, u, '-/8 C4/6', { type: 'pulse', g: 0.04 * k, s: 0.7, r: 0.2 });
    }
  };

  // 同名音效的最小间隔（秒）；间隔内的调用直接丢弃，刚过间隔的压低音量
  var MIN_GAP = { tick: 0.03, ok: 0.06, no: 0.08, move: 0.06, shot: 0.09, cannon: 0.14, boom: 0.16, cap: 0.1, captured: 0.3, build: 0.2, turn: 0.4, power: 0.4, win: 1, lose: 1 };
  var QUIET_WINDOW = 0.3, QUIET_GAIN = 0.6;

  // ---------------------------------------------------------------- 运行时状态

  var ctx = null, graph = null;
  var musicVol = DEFAULT_MUSIC_VOL, sfxVol = DEFAULT_SFX_VOL;
  var muted = false;
  var wanted = 'off';       // 游戏想听的曲子（未解锁时也记着）
  var cur = null;           // {name, def, comp, nodes, step, nextTime, scheduled}
  var timer = null;
  var paused = false;       // 页面在后台
  var lastSfx = {};

  try { muted = root.localStorage.getItem(STORE_KEY) === '1'; } catch (e) { /* 读不到就按不静音 */ }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function isHidden() { return typeof document !== 'undefined' && !!document.hidden; }

  function ramp(param, value, seconds) {
    var now = ctx.currentTime;
    try {
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
      else { param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); }
      param.linearRampToValueAtTime(value, now + seconds);
    } catch (e) { param.value = value; }
  }

  function tick() {
    if (!ctx || !cur || paused) return;
    var now = ctx.currentTime, sd = cur.comp.stepDur;
    if (cur.nextTime < now) {            // 定时器被拖慢：跳过已过去的步，保持拍点位置
      var skip = Math.ceil((now + 0.03 - cur.nextTime) / sd);
      cur.step += skip; cur.nextTime += skip * sd;
    }
    while (cur.nextTime < now + LOOKAHEAD) {
      playStep(ctx, cur.nodes, cur.def, cur.comp, cur.step % cur.comp.total, cur.nextTime);
      cur.step++; cur.scheduled++;
      cur.nextTime += sd;
    }
  }

  function startTimer() {
    if (timer == null && cur && !paused) { timer = setInterval(tick, TICK_MS); tick(); }
  }
  function stopTimer() {
    if (timer != null) { clearInterval(timer); timer = null; }
  }

  function fadeOutCurrent() {
    if (!cur) return;
    var old = cur; cur = null;
    stopTimer();
    ramp(old.nodes.gain.gain, 0, FADE);
    setTimeout(function () {
      try { old.nodes.tonal.disconnect(); old.nodes.gain.disconnect(); } catch (e) { /* 已断开 */ }
    }, (FADE + LOOKAHEAD + 0.3) * 1000);
  }

  function applyMusic() {
    if (!ctx) return;
    if (cur && cur.name === wanted) return;
    fadeOutCurrent();
    if (wanted === 'off') return;
    var nodes = trackNodes(ctx, graph.music);
    nodes.gain.gain.setValueAtTime(0, ctx.currentTime);
    nodes.gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
    cur = { name: wanted, def: TRACKS[wanted], comp: compiled(wanted), nodes: nodes, step: 0, nextTime: ctx.currentTime + 0.06, scheduled: 0 };
    startTimer();
  }

  function onVisibility() {
    if (!ctx) { paused = isHidden(); return; }
    if (isHidden()) {
      paused = true; stopTimer();
      ramp(graph.pause.gain, 0, 0.08);
    } else {
      paused = false;
      ramp(graph.pause.gain, 1, 0.3);
      if (cur) cur.nextTime = Math.max(cur.nextTime, ctx.currentTime + 0.06);
      startTimer();
    }
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', onVisibility);
  }

  // ---------------------------------------------------------------- 对外接口

  function unlock() {
    try {
      if (!ctx) {
        var AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        graph = buildGraph(ctx, musicVol, sfxVol, muted);
        paused = isHidden();
        if (paused) graph.pause.gain.value = 0;
      }
      if (ctx.state !== 'running' && ctx.resume) {
        var p = ctx.resume();
        if (p && p.catch) p.catch(function () { /* 没有用户手势时会被拒绝，下次再试 */ });
      }
      applyMusic();
    } catch (e) { /* 音频不可用时保持静默 */ }
  }

  function sfx(name) {
    try {
      if (!ctx || ctx.state !== 'running') return;
      if (!Object.prototype.hasOwnProperty.call(SFX, name)) return;
      var now = ctx.currentTime, last = lastSfx[name], k = 1;
      if (last != null) {
        var gap = now - last;
        if (gap < MIN_GAP[name]) return;
        if (gap < QUIET_WINDOW) k = QUIET_GAIN;
      }
      lastSfx[name] = now;
      SFX[name](ctx, graph.sfx, now + 0.005, k);
    } catch (e) { /* 静默 */ }
  }

  function music(track) {
    try {
      if (track !== 'off' && !Object.prototype.hasOwnProperty.call(TRACKS, track)) return;
      if (track === wanted) return;
      wanted = track;
      applyMusic();
    } catch (e) { /* 静默 */ }
  }

  function setVolume(m, s) {
    try {
      if (typeof m === 'number' && isFinite(m)) musicVol = clamp01(m);
      if (typeof s === 'number' && isFinite(s)) sfxVol = clamp01(s);
      if (ctx) { ramp(graph.music.gain, musicVol, 0.05); ramp(graph.sfx.gain, sfxVol, 0.05); }
    } catch (e) { /* 静默 */ }
  }

  function setMuted(b) {
    muted = !!b;
    try { root.localStorage.setItem(STORE_KEY, muted ? '1' : '0'); } catch (e) { /* 存不了就只在本次生效 */ }
    try { if (ctx) ramp(graph.master.gain, muted ? 0 : 1, 0.05); } catch (e2) { /* 静默 */ }
  }

  // ---------------------------------------------------------------- 调试 / 自检

  function info() {
    var out = {};
    Object.keys(TRACKS).forEach(function (n) {
      var c = compiled(n);
      out[n] = { bpm: TRACKS[n].bpm, bars: c.bars, seconds: Math.round(c.seconds * 100) / 100, events: c.notes, errors: c.errors };
    });
    return out;
  }

  function state() {
    return {
      ctx: ctx ? ctx.state : 'none', wanted: wanted, playing: cur ? cur.name : null,
      scheduledSteps: cur ? cur.scheduled : 0, paused: paused, muted: muted,
      musicVol: musicVol, sfxVol: sfxVol, timer: timer != null
    };
  }

  // 用 OfflineAudioContext 按默认音量渲染。opts: {music, seconds, sfx:[{name,t,k}]}
  // 返回 Promise<{seconds, peak, rms, silentRatio}>；silentRatio 是峰值低于 0.001 的 100ms 窗口占比
  function renderOffline(opts) {
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!OAC) return Promise.reject(new Error('no OfflineAudioContext'));
    var sr = 44100, c = opts.music ? compiled(opts.music) : null;
    var seconds = opts.seconds || (c ? c.seconds : 2.5);
    var ac = new OAC(1, Math.ceil(sr * seconds), sr);
    var g = buildGraph(ac, DEFAULT_MUSIC_VOL, DEFAULT_SFX_VOL, false);
    if (c) {
      var nodes = trackNodes(ac, g.music);
      for (var s = 0; s * c.stepDur + 0.02 < seconds; s++) {
        playStep(ac, nodes, TRACKS[opts.music], c, s % c.total, s * c.stepDur + 0.02);
      }
    }
    (opts.sfx || []).forEach(function (e) {
      if (SFX[e.name]) SFX[e.name](ac, g.sfx, (e.t || 0) + 0.02, e.k == null ? 1 : e.k);
    });
    return ac.startRendering().then(function (buf) {
      var d = buf.getChannelData(0), peak = 0, sum = 0, win = Math.floor(sr / 10), silent = 0, wins = 0;
      for (var i = 0; i < d.length; i += win) {
        var wp = 0, end = Math.min(d.length, i + win);
        for (var j = i; j < end; j++) { var v = Math.abs(d[j]); if (v > wp) wp = v; sum += v * v; }
        if (wp > peak) peak = wp;
        if (wp < 0.001) silent++;
        wins++;
      }
      return {
        seconds: Math.round(seconds * 100) / 100,
        peak: Math.round(peak * 10000) / 10000,
        rms: Math.round(Math.sqrt(sum / d.length) * 10000) / 10000,
        silentRatio: Math.round((silent / wins) * 1000) / 1000
      };
    });
  }

  var api = {
    unlock: unlock, sfx: sfx, music: music, setVolume: setVolume, setMuted: setMuted,
    _info: info, _state: state, _renderOffline: renderOffline,
    _sfxNames: Object.keys(SFX), _trackNames: Object.keys(TRACKS)
  };
  Object.defineProperty(api, 'muted', { get: function () { return muted; }, enumerable: true });

  root.AWAudio = api;
})(typeof window !== 'undefined' ? window : globalThis);
