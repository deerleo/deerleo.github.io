/* Composition: Chrome Circuit (Qwen via Strata) - 32 bars @150bpm, seamless loop
 * Original three-channel SID-style player. No samples, dependencies or network.
 * PAL SID frequency registers and ADSR periods; replay effects tick at 60 Hz.
 * $7Fxx/$C0xx/$D0xx below are replay commands, not SID hardware addresses.
 * This is a software approximation of SID, including its digital waveforms,
 * 23-bit noise, exponential envelopes and a shared state-variable filter.
 */
(function () {
  'use strict';
  if (window.__SID) return;
  var CLOCK = 985248, FRAME = 60;
  // SID envelope rate-counter periods, measured in chip clocks.
  var RATE = [9, 32, 63, 95, 149, 220, 267, 313, 392, 977, 1954,
    3126, 3907, 11720, 19532, 31251];
  var PULSE = [1024,1152,1280,1408,1536,1664,1792,1920,
    2048,2176,2304,2432,2560,2688,2816,2944,
    3072,2944,2816,2688,2560,2432,2304,2176,
    2048,1920,1792,1664,1536,1408,1280,1152];
  var FILTER = [520,660,850,1100,1460,1950,2600,3400,
    4400,5600,6500,5600,4200,2900,1750,950];
  // Frame tables: frequency offsets are SID register units, volume is 0..15.
  var SWEEP = [[0,15],[180,15],[370,15],[620,14],[910,13],
    [1250,12],[1640,11],[2090,9],[2600,7],[3180,5],[3820,3],[4520,0]];
  // The $FF flag ends the triangle table and holds its final pitch.
  var TRIANGLE = [0,12,7,0,-12,0,7,0,255];
  var MIDI = new Float64Array(128);
  for (var n = 0; n < 128; n++) MIDI[n] = Math.round(
    440 * Math.pow(2, (n - 69) / 12) * 16777216 / CLOCK);
  var INSTRUMENTS = [
    {wave:'pulse', ad:0x08, sr:0xa5, arp:[0,4,7], pwm:1, vibrato:18, filter:true},
    {wave:'pulse', ad:0x02, sr:0x83, arp:[0,0,0], pwm:2, vibrato:0, filter:true},
    {wave:'triangle', ad:0x03, sr:0x94, arp:[0,0,0], pwm:0, vibrato:0, filter:false},
    {wave:'pulse', ad:0x06, sr:0x94, arp:[0,3,7], pwm:2, vibrato:12, filter:true}
  ];
  var ctx = null, node = null, musicEnabled = true, sfxEnabled = true;
  var currentTrack = -1, musicFrame = 0, framePhase = 0, globalFrame = 0;
  var low = 0, band = 0, dcIn = 0, dcOut = 0, filterCoefficient = 0;
  var fxQueue = null, fxAge = 0, fxIndex = 0;
  function voice() {
    return {phase:0, reg:0, noise:0x7ffff8, env:0, counter:0,
      expCounter:0, state:3, gate:false, wave:'pulse', width:2048,
      ad:0x08, sr:0x84, volume:1, age:0, note:48, arp:[0,0,0],
      pwm:0, vibrato:0, vib:null, filtered:false, sweep:0, tri:false, end:0, active:false};
  }
  var voices = [voice(), voice(), voice()];
  function gate(v, on) {
    if (on && !v.gate) v.state = 0;
    if (!on && v.gate) v.state = 3;
    v.gate = on;
  }
  function trigger(v, note, instrument, length, command) {
    var p = INSTRUMENTS[instrument];
    gate(v, false);
    v.note = note; v.wave = p.wave; v.ad = p.ad; v.sr = p.sr;
    v.arp = p.arp; v.pwm = p.pwm; v.vibrato = p.vibrato; v.vib = null;
    v.filtered = p.filter; v.age = 0; v.volume = 0.58;
    v.sweep = 0; v.tri = false; v.active = true;
    v.end = length - 1;
    // $A0 = major triad, $C0 = minor triad, $7F = sweep,
    // $FF triangle flag, $D0 = packed attack/decay override.
    if (command) {
      if (command.arp) v.arp = command.arp;
      if (command.code === 0xa0) v.arp = [0,4,7];
      if (command.code === 0xc0) v.arp = [0,3,7];
      if (command.code === 0x7f) v.sweep = command.direction || 1;
      if (command.code === 0xff) { v.wave = 'triangle'; v.tri = true; }
      if (command.code === 0xd0) v.ad = command.value & 255;
    }
    // Additive extras: vibrato is [semitone amplitude, period in frames].
    if (command && command.vib) { v.vib = command.vib; v.vibrato = 0; }
    if (command && command.preset === 'pluck') {
      v.ad = 0x02; v.sr = 0x02; v.env = 255; v.state = 1;
      v.counter = 0; v.expCounter = 0; v.vibrato = 0; v.vib = null;
    }
    if (command && command.volume !== undefined) v.volume = command.volume;
    if (note === 0) {
      v.env = 0; v.reg = 0; v.volume = 0; v.active = false;
      return;
    }
    gate(v, true);
    if (command && command.preset === 'pluck') v.state = 1;
  }
  // Events: [MIDI note (0 = rest), duration in 60 Hz frames, instrument, extras].
  // One sixteenth slot = 6 frames; 512 slots = 3072 frames = 51.2 seconds.
  // Harmony 1-slot runs encode the arpeggio triples directly, without pitch overlays.
  var chromeCircuit = [[
      [67,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[76,18,2,{"arp":[0,0,0]}],
      [0,6,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],
      [76,24,1,{"arp":[0,0,0],"code":127}],[0,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],
      [69,12,2,{"arp":[0,0,0]}],[67,24,1,{"arp":[0,0,0],"code":127}],[67,18,2,{"arp":[0,0,0]}],[69,18,2,{"arp":[0,0,0]}],
      [71,18,2,{"arp":[0,0,0]}],[74,18,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],
      [76,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[74,24,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],
      [67,24,1,{"arp":[0,0,0],"code":127}],[69,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],
      [76,12,2,{"arp":[0,0,0]}],[79,18,2,{"arp":[0,0,0]}],[0,6,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],
      [74,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[78,12,2,{"arp":[0,0,0]}],
      [76,12,2,{"arp":[0,0,0]}],[74,24,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],[67,24,1,{"arp":[0,0,0],"code":127}],
      [69,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],
      [74,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[67,12,2,{"arp":[0,0,0]}],
      [0,24,1,{"arp":[0,0,0]}],[74,18,2,{"arp":[0,0,0]}],[71,18,2,{"arp":[0,0,0]}],[67,12,2,{"arp":[0,0,0]}],
      [76,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[67,12,2,{"arp":[0,0,0]}],
      [0,12,2,{"arp":[0,0,0]}],[67,12,2,{"arp":[0,0,0]}],[69,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],
      [74,24,1,{"arp":[0,0,0],"code":127}],[0,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],
      [81,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[69,18,2,{"arp":[0,0,0]}],
      [72,18,2,{"arp":[0,0,0]}],[76,18,2,{"arp":[0,0,0]}],[79,18,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],
      [76,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[79,24,1,{"arp":[0,0,0],"code":127}],
      [76,24,1,{"arp":[0,0,0],"code":127}],[74,24,1,{"arp":[0,0,0],"code":127}],[74,36,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],
      [67,36,1,{"arp":[0,0,0],"code":127}],[69,36,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],[74,36,1,{"arp":[0,0,0],"code":127}],
      [76,36,1,{"arp":[0,0,0],"code":127}],[79,24,1,{"arp":[0,0,0],"code":127}],[81,36,1,{"arp":[0,0,0],"code":127}],[83,12,2,{"arp":[0,0,0],"vib":[1.5,5]}],
      [0,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],[79,24,1,{"arp":[0,0,0],"code":127}],[76,24,1,{"arp":[0,0,0],"code":127}],
      [74,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],[83,12,2,{"arp":[0,0,0]}],
      [79,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[83,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],
      [79,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[79,24,1,{"arp":[0,0,0],"code":127}],
      [83,24,1,{"arp":[0,0,0],"code":127}],[81,24,1,{"arp":[0,0,0],"code":127}],[83,18,2,{"arp":[0,0,0]}],[81,18,2,{"arp":[0,0,0]}],
      [79,18,2,{"arp":[0,0,0]}],[76,18,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],
      [71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],
      [81,18,2,{"arp":[0,0,0]}],[0,6,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],
      [83,24,1,{"arp":[0,0,0],"code":127}],[0,12,2,{"arp":[0,0,0]}],[83,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],
      [79,36,1,{"arp":[0,0,0],"code":127}],[76,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],
      [83,12,2,{"arp":[0,0,0],"vib":[1.5,5]}],[84,24,1,{"arp":[0,0,0],"code":127,"vib":[1.5,5]}],[83,24,1,{"arp":[0,0,0],"code":127,"vib":[1.5,5]}],[84,12,2,{"arp":[0,0,0]}],
      [0,12,2,{"arp":[0,0,0]}],[83,24,1,{"arp":[0,0,0],"code":127}],[81,24,1,{"arp":[0,0,0],"code":127}],[79,24,1,{"arp":[0,0,0],"code":127}],
      [76,24,1,{"arp":[0,0,0],"code":127}],[74,24,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],[67,24,1,{"arp":[0,0,0],"code":127}],
      [67,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[76,18,2,{"arp":[0,0,0]}],
      [0,6,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],
      [76,24,1,{"arp":[0,0,0],"code":127}],[0,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[71,24,1,{"arp":[0,0,0],"code":127}],
      [67,24,1,{"arp":[0,0,0],"code":127}],[69,18,2,{"arp":[0,0,0]}],[71,18,2,{"arp":[0,0,0]}],[74,18,2,{"arp":[0,0,0]}],
      [76,18,2,{"arp":[0,0,0]}],[0,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],
      [0,12,2,{"arp":[0,0,0]}],[76,24,1,{"arp":[0,0,0],"code":127}],[74,24,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],
      [74,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],
      [83,24,1,{"arp":[0,0,0],"code":127}],[0,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],[83,12,2,{"arp":[0,0,0]}],
      [0,12,2,{"arp":[0,0,0]}],[81,12,2,{"arp":[0,0,0]}],[79,12,2,{"arp":[0,0,0]}],[76,12,2,{"arp":[0,0,0]}],
      [74,12,2,{"arp":[0,0,0]}],[71,24,1,{"arp":[0,0,0],"code":127}],[74,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],
      [69,12,2,{"arp":[0,0,0]}],[67,12,2,{"arp":[0,0,0]}],[71,12,2,{"arp":[0,0,0]}],[74,12,2,{"arp":[0,0,0]}],
      [67,24,1,{"arp":[0,0,0],"code":127}],[69,24,1,{"arp":[0,0,0],"code":127}],[71,24,1,{"arp":[0,0,0],"code":127}],[67,24,1,{"arp":[0,0,0],"code":127}],
      [0,24,1,{"arp":[0,0,0]}]
    ],[
      [60,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[60,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],
      [59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [71,6,1,{"arp":[0,0,0],"volume":0.4}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[62,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[62,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [60,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[52,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [52,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[60,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [67,6,1,{"arp":[0,0,0],"volume":0.4}],[60,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [67,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [67,6,1,{"arp":[0,0,0],"volume":0.4}],[60,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],[71,6,1,{"arp":[0,0,0],"volume":0.4}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[67,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],
      [64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,6,1,{"arp":[0,0,0],"volume":0.4}],[61,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[57,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [62,6,1,{"arp":[0,0,0],"volume":0.4}],[64,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],[67,6,1,{"arp":[0,0,0],"volume":0.4}],
      [57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [55,6,1,{"arp":[0,0,0],"volume":0.4}],[59,6,1,{"arp":[0,0,0],"volume":0.4}],[55,6,1,{"arp":[0,0,0],"volume":0.4}],[62,6,1,{"arp":[0,0,0],"volume":0.4}],
      [60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,12,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[0,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [60,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[60,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[64,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [57,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[57,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[61,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[62,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],
      [55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[59,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[55,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}],[0,24,1,{"arp":[0,0,0],"volume":0.4,"vib":[1,15]}]
    ],[
      [48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[50,18,1,{"arp":[0,0,0],"preset":"pluck"}],[52,18,1,{"arp":[0,0,0],"preset":"pluck"}],[53,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],[47,18,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [43,18,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[47,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [47,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[47,18,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,48,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[53,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,18,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [47,18,1,{"arp":[0,0,0],"preset":"pluck"}],[48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [47,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[47,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [52,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[52,24,1,{"arp":[0,0,0],"preset":"pluck"}],[53,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [52,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[53,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[53,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[47,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [43,18,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],[48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[50,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[53,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [52,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[47,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[47,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[50,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [52,18,1,{"arp":[0,0,0],"preset":"pluck"}],[53,18,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [47,18,1,{"arp":[0,0,0],"preset":"pluck"}],[45,18,1,{"arp":[0,0,0],"preset":"pluck"}],[43,18,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,12,1,{"arp":[0,0,0],"preset":"pluck"}],[47,12,1,{"arp":[0,0,0],"preset":"pluck"}],[50,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[47,24,1,{"arp":[0,0,0],"preset":"pluck"}],[48,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [50,24,1,{"arp":[0,0,0],"preset":"pluck"}],[50,18,1,{"arp":[0,0,0],"preset":"pluck"}],[48,18,1,{"arp":[0,0,0],"preset":"pluck"}],[47,18,1,{"arp":[0,0,0],"preset":"pluck"}],
      [45,24,1,{"arp":[0,0,0],"preset":"pluck"}],[43,18,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,12,1,{"arp":[0,0,0],"preset":"pluck"}],[43,24,1,{"arp":[0,0,0],"preset":"pluck"}],[45,24,1,{"arp":[0,0,0],"preset":"pluck"}],
      [48,24,1,{"arp":[0,0,0],"preset":"pluck"}],[0,24,1,{"arp":[0,0,0],"preset":"pluck"}]
    ]];
  var tracks = [chromeCircuit, chromeCircuit, chromeCircuit];
  var positions = [0,0,0], remaining = [0,0,0];
  function resetSong() {
    positions = [0,0,0]; remaining = [0,0,0]; musicFrame = 0;
  }
  // SFX occupy voice 3, as on a three-channel game driver. The bass resumes
  // at its current song position when the effect finishes.
  function effect(note, duration, wave, arp, sweep, ad) {
    return {note:note,duration:duration,wave:wave,arp:arp || [0,0,0],
      sweep:sweep || 0,ad:ad === undefined ? 0x02 : ad};
  }
  var effects = {
    jump:[effect(52,12,'pulse',null,1)],
    gem:[effect(88,6,'triangle',[0,7,12]),effect(95,7,'triangle',[0,4,7])],
    stomp:[effect(34,5,'noise',null,-1)],
    hit:[effect(53,4,'noise',[0,1,6]),effect(35,7,'noise',[0,6,1],-1)],
    powerup:[effect(60,6,'pulse',[0,4,7]),effect(65,6,'pulse',[0,4,7]),
      effect(69,6,'triangle',[0,4,7]),effect(76,10,'triangle',[0,7,12])],
    die:[effect(80,12,'triangle',null,-1),effect(65,12,'pulse',null,-1),
      effect(43,15,'triangle',null,-1)],
    clear:[effect(72,7,'pulse',[0,4,7]),effect(76,7,'pulse',[0,4,7]),
      effect(79,7,'pulse',[0,4,7]),effect(84,20,'triangle',[0,4,7])]
  };
  function startEffectStep(e) {
    var v = voices[2];
    trigger(v,e.note,1,e.duration,{arp:e.arp});
    v.wave = e.wave; v.sweep = e.sweep; v.ad = e.ad; v.sr = 0x83;
    v.filtered = false; v.volume = 0.8;
  }
  function tick() {
    globalFrame++;
    if (currentTrack >= 0 && musicEnabled) {
      var song = tracks[currentTrack];
      for (var c = 0; c < 3; c++) {
        if (remaining[c] <= 0) {
          var e = song[c][positions[c]];
          positions[c] = (positions[c]+1) % song[c].length;
          remaining[c] = e[1];
          if (!(c === 2 && fxQueue)) trigger(voices[c],e[0],e[2],e[1],e[3]);
        }
        remaining[c]--;
      }
      musicFrame++;
    }
    if (fxQueue) {
      if (fxAge === 0) startEffectStep(fxQueue[fxIndex]);
      if (++fxAge >= fxQueue[fxIndex].duration) {
        fxAge = 0;
        if (++fxIndex >= fxQueue.length) {
          fxQueue = null; gate(voices[2],false);
          if (currentTrack >= 0 && musicEnabled) {
            var pattern = tracks[currentTrack][2];
            var previous = pattern[(positions[2]+pattern.length-1)%pattern.length];
            trigger(voices[2],previous[0],previous[2],Math.max(2,remaining[2]),previous[3]);
          }
        }
      }
    }
    for (var i = 0; i < 3; i++) {
      var v = voices[i];
      if (!v.active) continue;
      var pitch = v.note + v.arp[v.age % 3];
      if (v.tri) {
        var t = TRIANGLE[Math.min(v.age,TRIANGLE.length-1)];
        if (t !== 255) pitch += t;
      }
      pitch = Math.max(0,Math.min(127,pitch));
      var reg = MIDI[pitch];
      if (v.sweep) {
        var sw = SWEEP[Math.min(v.age,SWEEP.length-1)];
        reg += sw[0] * v.sweep;
        v.volume = sw[1] / 15 * 0.8;
      }
      if (v.vibrato && v.age > 5) reg += Math.sin(v.age * Math.PI / 4) * v.vibrato;
      if (v.vib && v.vib[0]) {
        reg *= Math.pow(2, Math.sin(v.age * 2 * Math.PI / v.vib[1]) * v.vib[0] / 12);
      }
      v.reg = Math.max(32,Math.min(65535,reg));
      v.width = PULSE[(v.age * v.pwm) & 31];
      if (v.age++ >= v.end) gate(v,false);
      if (!v.gate && v.env === 0) v.active = false;
    }
    if (ctx) filterCoefficient = 2*Math.sin(Math.PI*Math.min(
      FILTER[(globalFrame >> 1)&15],ctx.sampleRate*0.18)/ctx.sampleRate);
  }
  function envelope(v, clocks) {
    v.counter += clocks;
    while (v.counter >= RATE[v.state === 0 ? v.ad >> 4 : v.state === 3 ? v.sr & 15 : v.ad & 15]) {
      v.counter -= RATE[v.state === 0 ? v.ad >> 4 : v.state === 3 ? v.sr & 15 : v.ad & 15];
      if (v.state === 0) {
        if (++v.env >= 255) { v.env = 255; v.state = 1; v.expCounter = 0; }
      } else {
        var period = v.env > 93 ? 1 : v.env > 54 ? 2 : v.env > 26 ? 4 :
          v.env > 14 ? 8 : v.env > 6 ? 16 : 30;
        if (++v.expCounter >= period) {
          v.expCounter = 0;
          var sustain = (v.sr >> 4) * 17;
          if (v.env > 0 && (v.state === 3 || v.env > sustain)) v.env--;
        }
      }
    }
    return v.env / 255;
  }
  function render(event) {
    var output = event.outputBuffer.getChannelData(0);
    var clocks = CLOCK/ctx.sampleRate;
    for (var s = 0; s < output.length; s++) {
      framePhase += FRAME;
      if (framePhase >= ctx.sampleRate) { framePhase -= ctx.sampleRate; tick(); }
      var dry = 0, wet = 0;
      for (var c = 0; c < 3; c++) {
        var v = voices[c];
        var old = v.phase;
        var advance = v.reg * clocks;
        v.phase = (old + advance) % 16777216;
        // Clock the SID noise shift register on rising accumulator bit 19.
        var edges = Math.floor((old+advance+524288)/1048576) -
          Math.floor((old+524288)/1048576);
        while (edges-- > 0) v.noise = ((v.noise << 1) |
          (((v.noise >> 22) ^ (v.noise >> 17)) & 1)) & 0x7fffff;
        var x;
        if (v.wave === 'noise') {
          var r = v.noise;
          var bits = ((r>>15)&128)|((r>>14)&64)|((r>>11)&32)|((r>>9)&16)|
            ((r>>8)&8)|((r>>5)&4)|((r>>3)&2)|((r>>2)&1);
          x = bits / 127.5 - 1;
        } else if (v.wave === 'triangle') {
          var p = (v.phase / 4096) | 0;
          x = ((p & 2048) ? 4095-p : p) / 1023.5 - 1;
        } else x = v.phase / 4096 < v.width ? 1 : -1;
        x *= envelope(v,clocks) * v.volume;
        if (v.filtered) wet += x; else dry += x;
      }
      // Two substeps keep the resonant, shared low-pass stable at low rates.
      for (var f = 0; f < 2; f++) {
        low += filterCoefficient*0.5*band;
        band += filterCoefficient*0.5*(wet-low-0.85*band);
      }
      var mixed = (dry+low)*0.23;
      var dc = mixed-dcIn+0.995*dcOut;
      dcIn = mixed; dcOut = dc;
      output[s] = Math.max(-0.95,Math.min(0.95,dc));
    }
  }
  function initialize() {
    if (!ctx) {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return false;
      try {
        ctx = new AudioCtor();
        node = ctx.createScriptProcessor(2048,0,1);
        node.onaudioprocess = render;
        node.connect(ctx.destination);
        framePhase = ctx.sampleRate;
      } catch (e) {
        try { if (ctx && ctx.close) { var c = ctx.close(); if (c && c.catch) c.catch(function(){}); } } catch (e2) {}
        ctx = null; node = null; return false;
      }
    }
    if (ctx.state === 'suspended' && ctx.resume) {
      try { var r = ctx.resume(); if (r && r.catch) r.catch(function(){}); } catch (e) {}
    }
    return true;
  }
  window.__SID = {
    get ready() { return !!initialize(); },
    startMusic:function(index) {
      if (!Number.isInteger(index) || index < 0 || index >= tracks.length) return;
      if (!initialize()) return;
      currentTrack = index; resetSong();
      for (var c = 0; c < 3; c++) if (!(c === 2 && fxQueue)) gate(voices[c],false);
    },
    stopMusic:function() {
      currentTrack = -1;
      for (var c = 0; c < 3; c++) if (!(c === 2 && fxQueue)) gate(voices[c],false);
    },
    playSFX:function(name) {
      if (!sfxEnabled || !Object.prototype.hasOwnProperty.call(effects,name)) return;
      if (!initialize()) return;
      fxQueue = effects[name]; fxAge = 0; fxIndex = 0;
    },
    setMusicEnabled:function(b) {
      var was = musicEnabled;
      musicEnabled = !!b;
      if (!musicEnabled) {
        for (var c = 0; c < 3; c++) if (!(c === 2 && fxQueue)) gate(voices[c],false);
      } else if (!was && currentTrack >= 0) { resetSong(); initialize(); }
    },
    setSfxEnabled:function(b) {
      sfxEnabled = !!b;
      if (!sfxEnabled && fxQueue) {
        fxQueue = null; fxAge = 0; fxIndex = 0; gate(voices[2],false);
        if (currentTrack >= 0 && musicEnabled) remaining[2] = 0;
      }
    }
  };
  // Autoplay-policy unlock: resume the context on the first user gesture.
  ['keydown','pointerdown','touchend'].forEach(function (t) {
    try { window.addEventListener(t, function () { initialize(); }, { once: true, capture: true }); } catch (e) {}
  });
})();
