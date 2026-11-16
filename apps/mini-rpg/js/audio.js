// =====================================================================
// audio.js  -  Music and sound effects.
//
// MUSIC: plays the .wav files from the Music folder. Each place (Town,
//        World, Battle, Dungeon, Boss) can have ANY number of tracks:
//        Town1.wav, Town2.wav, Town3.wav... Number them from 1 with no
//        gaps. One is picked at random; when it ends, another is picked.
//        With a single track, that one simply repeats.
// SOUND: retro "beeps" made on the fly by the browser's sound chip
//        (square / triangle waves and noise, like the NES), so no
//        sound files are needed.
//
// Browsers only allow sound after the player presses a key, which is
// why main.js calls unlock() on every key press.
// =====================================================================

const Music = {
  folder: 'Music/',
  maxTracks: 20,        // the most tracks it will look for per place
  volume: 1,
  muted: false,
  place: null,          // 'Town', 'World', 'Battle', 'Dungeon', 'Boss', 'Title' or null (silence)
  places: ['Town', 'World', 'Battle', 'Dungeon', 'Boss', 'Tower', 'TowerBoss'],     // the names the music files start with
  // What plays on the TITLE SCREEN (chosen under Options > Title music):
  //   'Random'   any track of the whole game
  //   'Town'     any Town track  (or 'World', 'Battle', 'Dungeon', 'Boss')
  //   'Battle1'  exactly that file  (Battle1.wav)
  titleTrack: 'Town',
  source: null,         // which place's files the current track came from
  counts: {},           // how many tracks each place has, once counted
  current: null,        // the <audio> that is playing now
  lastPlayed: {},       // remembers the last track per place, to avoid repeats
  loaded: {},           // every track we have opened so far
  // A place with no files of its own borrows another place's music.
  // (Tower = the Endless Tower's floors, TowerBoss = its own bosses; with no such files they use Dungeon and Boss music)
  fallback: { Dungeon: 'World', Boss: 'Battle', Tower: 'Dungeon', TowerBoss: 'Boss' },
  counting: {},         // how many tracks each place has (worked out the first time it is needed)
  fadeSeconds: 3.5,     // how long the music takes to fade out after a battle
  fadeAfter: ['Battle', 'Boss', 'TowerBoss'],   // leaving these places fades the music out; everything else switches at once
  fading: null,         // the timer of a fade that is under way

  // Count the tracks of a place: is there a Town1.wav? a Town2.wav? ... until one is missing.
  // Checking a file takes a moment, so this gives back a "promise" of the number.
  countTracks(place) {
    if (!this.counting[place]) this.counting[place] = new Promise(resolve => {
      const done = count => { this.counts[place] = count; resolve(count); };
      const check = n => {
        if (n > this.maxTracks) return done(n - 1);
        const probe = new Audio();
        probe.preload = 'metadata';                           // only peek at the start of the file
        probe.onloadedmetadata = () => check(n + 1);          // it exists: look for the next one
        probe.onerror = () => done(n - 1);                    // missing: we have counted them all
        probe.src = `${this.folder}${place}${n}.mp3`;
      };
      check(1);
    });
    return this.counting[place];
  },

  // Call this as often as you like: it only does something when the place changes.
  // Battle music cuts in at once; when a battle ends, its music fades out first.
  want(place) {
    if (place === this.place) return;
    const leaving = this.place;
    this.place = place;
    const abrupt = this.fadeAfter.includes(place);                         // a fight starts with a jolt
    // Title screen <-> game: if the right kind of music is already playing, let it play on
    // (e.g. the title plays Town music and the game starts in a town).
    const playing0 = this.current && !this.current.paused && !this.fading;
    if (playing0 && leaving === 'Title' && this.source === place) return;
    if (playing0 && place === 'Title' && this.source === this.titleTrack) return;
    if (this.fading && !abrupt) return;                                    // already fading: the new place plays when it is done
    const playing = this.current && !this.current.paused;
    if (this.fadeAfter.includes(leaving) && !abrupt && playing) this.fadeOut();
    else { this.stopFade(); this.playRandom(); }
  },

  // Turn the current track down a little at a time, then start the music of wherever we are by then.
  fadeOut() {
    const audio = this.current, start = performance.now();
    this.fading = setInterval(() => {
      const left = 1 - (performance.now() - start) / (this.fadeSeconds * 1000);   // 1 = full volume ... 0 = silent
      if (left > 0) { audio.volume = this.volume * left; return; }
      this.stopFade();
      this.playRandom();
    }, 40);
  },
  stopFade() {
    if (this.fading) { clearInterval(this.fading); this.fading = null; }
  },

  async playRandom() {
    if (this.current) { this.current.pause(); this.current = null; }
    const place = this.place;
    if (!place) return;

    // whose files do we play? our own, or the fallback's if we have none
    let source = place, fixed = 0;                            // fixed = one exact track number
    const exact = /^([A-Za-z]+)(\d+)$/.exec(place);           // Music.want('TowerBoss1') asks for that very file
    if (exact) { source = exact[1]; fixed = Number(exact[2]); }
    if (place === 'Title') {
      const wanted = this.titleTrack;
      if (wanted === 'Random') {                              // any track of any place
        const all = [];
        for (const p of this.places) { const c = await this.countTracks(p); for (let i = 1; i <= c; i++) all.push([p, i]); }
        if (all.length > 1) all.splice(all.findIndex(([p, i]) => p + i === this.lastPlayed.Title), 1);   // (-1 removes the last one: harmless)
        [source, fixed] = all.length ? all[Math.floor(Math.random() * all.length)] : ['Town', 0];
      } else {
        const parts = /^([A-Za-z]+)(\d*)$/.exec(wanted) || [0, 'Town', ''];    // 'Battle1' -> 'Battle' and 1
        source = parts[1]; fixed = Number(parts[2]) || 0;
      }
    }
    let count = await this.countTracks(source);
    while (!count && this.fallback[source]) { source = this.fallback[source]; fixed = 0; count = await this.countTracks(source); }   // Tower -> Dungeon -> World
    if (!count && place === 'Title' && source !== 'Town') { source = 'Town'; fixed = 0; count = await this.countTracks(source); }   // no such file: Town music
    if (this.place !== place || !count) return;               // we moved on while counting, or there is no music at all
    if (this.current) this.current.pause();

    let n = fixed <= count ? fixed : 0;
    if (!n) {
      do { n = 1 + Math.floor(Math.random() * count); }
      while (count > 1 && n === this.lastPlayed[place]);      // not the same one twice in a row
    }
    this.lastPlayed[place] = place === 'Title' ? source + n : n;
    this.source = source;

    const file = `${this.folder}${source}${n}.mp3`;
    let audio = this.loaded[file];
    if (!audio) {
      audio = this.loaded[file] = new Audio(file);
      audio.preload = 'none';                                 // the files are big: only load when needed
      audio.addEventListener('ended', () => { if (this.current === audio && !this.fading) this.playRandom(); });
    }
    try { audio.currentTime = 0; } catch (e) { /* not loaded yet: it starts at 0 anyway */ }
    audio.volume = this.volume;
    audio.muted = this.muted;
    this.current = audio;
    audio.play().catch(() => {});                             // blocked until the first key press
  },

  // Options menu: change the title-screen music (and hear it straight away if we are on the title screen).
  setTitleTrack(track) {
    this.titleTrack = track;
    if (this.place === 'Title') { this.stopFade(); this.playRandom(); }
  },

  unlock() {
    if (this.current && this.current.paused) this.current.play().catch(() => {});
  },
};

const Sfx = {
  ac: null,             // the browser's AudioContext (our "sound chip")
  volume: 0.2,
  muted: false,

  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!this.ac && AC) this.ac = new AC();
    if (this.ac && this.ac.state === 'suspended') this.ac.resume();
  },

  // One beep. start/length in seconds. slideTo makes the pitch glide.
  tone(freq, start, length, type = 'square', vol = 1, slideTo = 0) {
    const t = this.ac.currentTime + start;
    const osc = this.ac.createOscillator(), gain = this.ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);
    gain.gain.setValueAtTime(vol * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);  // quick fade out
    osc.connect(gain).connect(this.ac.destination);
    osc.start(t); osc.stop(t + length + 0.02);
  },

  // A burst of hiss, used for hits and explosions.
  noise(start, length, vol = 1) {
    const t = this.ac.currentTime + start;
    const buffer = this.ac.createBuffer(1, Math.ceil(this.ac.sampleRate * length), this.ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource(), gain = this.ac.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(vol * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    src.connect(gain).connect(this.ac.destination);
    src.start(t);
  },

  // play a list of notes one after another: [[frequency, length], ...]
  melody(notes, type = 'square', vol = 1) {
    let t = 0;
    for (const [freq, len] of notes) { if (freq) this.tone(freq, t, len * 0.95, type, vol); t += len; }
  },

  play(name) {
    if (!this.ac || this.muted || !SOUNDS[name]) return;
    SOUNDS[name](this);
  },
};

// Note frequencies, to make the little tunes easier to read.
const N = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
            C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988, C6: 1047, E6: 1319 };

// Every sound effect in the game. Try changing the numbers!
const SOUNDS = {
  cursor:    s => s.tone(N.A5, 0, 0.04, 'square', 0.6),
  ok:        s => s.melody([[N.E5, 0.05], [N.B5, 0.08]]),
  cancel:    s => s.melody([[N.A4, 0.05], [N.E4, 0.08]]),
  buzz:      s => s.tone(110, 0, 0.15, 'sawtooth', 0.8),
  door:      s => s.melody([[N.C4, 0.06], [N.G4, 0.1]], 'triangle', 1.5),
  chest:     s => s.melody([[N.G5, 0.07], [N.B5, 0.07], [N.D5 * 2, 0.07], [N.G5 * 2, 0.3]]),
  buy:       s => s.melody([[N.B5, 0.07], [N.E6, 0.25]]),
  warp:      s => { for (let i = 0; i < 8; i++) s.tone(300 + i * 140, i * 0.045, 0.09, 'triangle', 1.3, 600 + i * 220); },
  save:      s => s.melody([[N.C5, 0.08], [N.E5, 0.08], [N.G5, 0.08], [N.C6, 0.25]], 'triangle', 1.5),
  inn:       s => s.melody([[N.E5, 0.2], [N.D5, 0.2], [N.C5, 0.2], [N.D5, 0.2], [N.E5, 0.2], [N.G5, 0.2], [N.C5, 0.5]], 'triangle', 1.5),
  encounter: s => { for (let i = 0; i < 6; i++) s.tone(i % 2 ? 330 : 494, i * 0.07, 0.07, 'square', 0.9); s.tone(660, 0.42, 0.3, 'sawtooth', 0.8, 110); },
  hit:       s => { s.noise(0, 0.12); s.tone(220, 0, 0.1, 'square', 0.8, 70); },
  hurt:      s => { s.noise(0, 0.2, 0.9); s.tone(130, 0, 0.2, 'sawtooth', 0.9, 45); },
  spell:     s => { for (let i = 0; i < 6; i++) s.tone(400 + i * 160, i * 0.05, 0.07, 'triangle', 1.4); s.noise(0.3, 0.25, 0.7); },
  heal:      s => s.melody([[N.C5, 0.07], [N.E5, 0.07], [N.G5, 0.07], [N.C6, 0.07], [N.E6, 0.2]], 'triangle', 1.5),
  buff:      s => s.tone(300, 0, 0.35, 'square', 0.7, 1200),
  item:      s => s.melody([[N.G5, 0.06], [N.C6, 0.12]], 'triangle', 1.5),
  run:       s => { for (let i = 0; i < 4; i++) s.tone(700, i * 0.08, 0.07, 'square', 0.6, 250); },
  victory:   s => s.melody([[N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.3], [N.A4, 0.3], [N.B4, 0.3], [N.C5, 0.2], [N.B4, 0.1], [N.C5, 0.6]]),
  levelup:   s => s.melody([[N.G4, 0.08], [N.C5, 0.08], [N.E5, 0.08], [N.G5, 0.08], [N.C6, 0.08], [N.E6, 0.3]]),
  defeat:    s => s.melody([[N.E5, 0.25], [N.D5, 0.25], [N.C5, 0.25], [N.B4, 0.25], [N.A4, 0.7]], 'triangle', 1.5),
};

function toggleMute() {
  Music.muted = Sfx.muted = !Music.muted;
  if (Music.current) Music.current.muted = Music.muted;
}
