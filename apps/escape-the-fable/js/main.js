// App shell: menu, routing between menu / play / workshop, loading and sharing levels.
import * as THREE from 'three';
import { generate } from './generator.js';
import { THEMES, THEME_IDS } from './themes.js';
import { parseLevel, decodeShare, checkLevel } from './manifest.js';
import { randomSeed } from './rng.js';
import { World, makeRenderer } from './world.js';
import { Game } from './game.js';
import { el, $, toast, closeModal, setMuted, muted } from './ui.js';

// Slow pan around a generated room behind the menu.
class MenuScene {
  constructor(app) {
    this.app = app;
    this.world = new World(generate({ difficulty: 'medium' }));
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 60);
    this.t = Math.random() * 6;
  }
  frame(dt) {
    const { w, h } = this.app.size;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.t += dt * 0.07;
    this.camera.position.set(Math.sin(this.t * 0.7) * 0.5, 1.62, Math.cos(this.t * 0.5) * 0.4);
    this.camera.rotation.set(-0.08, this.t, 0, 'YXZ');
    this.app.renderer.render(this.world.scene, this.camera);
  }
  dispose() { this.world.dispose(); }
}

class App {
  constructor() {
    this.canvas = $('#view');
    this.renderer = makeRenderer(this.canvas);
    this.size = { w: 1, h: 1 };
    this.mode = null;
    this.editor = null;
    this.resize();
    addEventListener('resize', () => this.resize());
    this.bindMenu();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (this.mode) this.mode.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    this.route();
  }
  resize() {
    this.size = { w: innerWidth, h: innerHeight };
    this.renderer.setSize(innerWidth, innerHeight, false);
  }
  setMode(mode) { if (this.mode) this.mode.dispose(); this.mode = mode; }

  bindMenu() {
    const sel = $('#sel-theme');
    sel.append(el('option', { value: '' }, 'Any setting'), ...THEME_IDS.map((id) => el('option', { value: id }, `${THEMES[id].name} (${THEMES[id].year})`)));
    $('#btn-surprise').onclick = () => this.surprise();
    $('#btn-play').onclick = () => {
      const seed = parseInt($('#inp-seed').value, 10);
      this.playGenerated({ seed: Number.isFinite(seed) ? seed : randomSeed(), theme: sel.value || undefined, difficulty: $('#sel-diff').value || undefined });
    };
    $('#btn-editor').onclick = () => this.openEditor();
    $('#btn-load').onclick = () => $('#file-load').click();
    $('#file-load').onchange = async (e) => {
      const f = e.target.files[0]; e.target.value = '';
      if (f) this.loadText(await f.text());
    };
    $('#btn-mute').onclick = () => { setMuted(!muted); $('#btn-mute').textContent = 'Sound: ' + (muted ? 'off' : 'on'); };
    addEventListener('dragover', (e) => e.preventDefault());
    addEventListener('drop', async (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !$('#menu').hidden) this.loadText(await f.text()); });
    addEventListener('hashchange', () => this.route());
  }
  loadText(text) {
    try {
      const level = parseLevel(text);
      const res = checkLevel(level);
      if (!res.ok) { toast('This level has problems, so it opens in the workshop: ' + res.errors[0], 6000); return this.openEditor(level); }
      this.play(level);
    } catch (err) { toast(err.message, 5000); }
  }
  async route() {
    const h = location.hash.slice(1);
    if (!h) return this.showMenu();
    const q = new URLSearchParams(h);
    try {
      if (q.get('level')) return this.play(await decodeShare(q.get('level')));
      if (q.get('seed')) return this.playGenerated({ seed: parseInt(q.get('seed'), 10) || 1, theme: q.get('theme'), difficulty: q.get('diff') });
    } catch (err) { toast('That shared link could not be opened: ' + err.message, 6000); }
    this.showMenu();
  }

  showMenu() {
    if (location.hash) history.replaceState(null, '', location.pathname);
    closeModal();
    $('#editor').hidden = true;
    $('#menu').hidden = false;
    this.canvas.hidden = false;
    this.setMode(null);
    this.setMode(new MenuScene(this));
  }
  surprise() { this.playGenerated({ seed: randomSeed() }); }
  playGenerated(opts) {
    try { this.play(generate(opts)); } catch (err) { toast(err.message, 5000); }
  }
  play(level, opts = {}) {
    $('#menu').hidden = true;
    $('#editor').hidden = true;
    this.canvas.hidden = false;
    this.setMode(null); // tear the previous mode down before the new one builds its HUD
    this.setMode(new Game(this, level, { onExit: () => (opts.fromEditor ? this.openEditor() : this.showMenu()), ...opts }));
  }
  async openEditor(level) {
    const { Editor } = await import('./editor.js');
    this.setMode(null);
    $('#menu').hidden = true;
    this.canvas.hidden = true;
    if (!this.editor) this.editor = new Editor(this);
    this.editor.show(level);
  }
}

window.app = new App();
