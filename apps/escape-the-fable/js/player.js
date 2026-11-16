// First-person controller: WASD / arrows to walk, mouse to look (pointer lock, with drag-look fallback).
import * as THREE from 'three';

const R = 0.25, EYE = 1.62;

export class Player {
  constructor(camera, dom) {
    this.cam = camera; this.dom = dom;
    this.pos = new THREE.Vector3(0, EYE, 0);
    this.yaw = 0; this.pitch = 0;
    this.keys = new Set();
    this.enabled = false;
    this.bob = 0;
    this.drag = false;
    this.quiet = 0;
    this.on = [];
    const listen = (t, ev, fn) => { t.addEventListener(ev, fn); this.on.push(() => t.removeEventListener(ev, fn)); };
    listen(document, 'keydown', (e) => { if (this.enabled) this.keys.add(e.code); });
    listen(document, 'keyup', (e) => this.keys.delete(e.code));
    listen(window, 'blur', () => this.keys.clear());
    listen(document, 'mousemove', (e) => {
      if (!this.enabled) return;
      const locked = document.pointerLockElement === dom;
      if ((!locked && !this.drag) || performance.now() < this.quiet) return;
      // browsers can report one huge jump right after the pointer locks; ignore outliers
      if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return;
      const k = locked ? 0.0022 : -0.004;
      this.yaw -= e.movementX * k;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * k));
    });
    listen(document, 'pointerlockchange', () => { this.quiet = performance.now() + 150; });
    listen(dom, 'mousedown', () => { this.drag = true; });
    listen(document, 'mouseup', () => { this.drag = false; });
  }
  get locked() { return document.pointerLockElement === this.dom; }
  lock() { if (this.dom.requestPointerLock) { try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* drag-look still works */ } } }
  unlock() { if (this.locked) document.exitPointerLock(); }

  // spawn = {x,z,rot} with rot the direction the door faces (into the room)
  place(spawn) {
    this.pos.set(spawn.x, EYE, spawn.z);
    this.yaw = (spawn.rot * Math.PI) / 2 + Math.PI; // face into the room
    this.pitch = -0.05;
    this.apply();
  }

  update(dt, room, colliders) {
    if (this.enabled) {
      const k = this.keys;
      let f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      let s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      if (k.has('ArrowLeft')) this.yaw += dt * 1.9;
      if (k.has('ArrowRight')) this.yaw -= dt * 1.9;
      if (f || s) {
        const len = Math.hypot(f, s), speed = (k.has('ShiftLeft') || k.has('ShiftRight') ? 3.4 : 2.3) * dt / len;
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        const dx = (-sin * f + cos * s) * speed, dz = (-cos * f - sin * s) * speed;
        const free = (x, z) => Math.abs(x) <= room.w / 2 - R - 0.03 && Math.abs(z) <= room.d / 2 - R - 0.03 && !colliders.some((c) => x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R);
        if (free(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
        if (free(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
        this.bob += dt * 9;
      }
    }
    this.apply();
  }
  apply() {
    this.cam.position.set(this.pos.x, EYE + Math.sin(this.bob) * 0.018, this.pos.z);
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  dispose() { this.on.forEach((off) => off()); this.unlock(); }
}
