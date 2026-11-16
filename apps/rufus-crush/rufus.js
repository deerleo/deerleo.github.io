// The few browser things the Rust side can't reach through macroquad:
// saved progress, haptics, safe-area insets, the loading splash and the
// offline service worker. Registered as a miniquad plugin.
(function () {
  "use strict";
  var SAVE_KEY = "rufus-crush-save-v1";
  var enc = new TextEncoder();
  var dec = new TextDecoder();

  function bytes(ptr, len) {
    return new Uint8Array(wasm_memory.buffer, ptr, len);
  }
  function put(str, ptr, cap) {
    var b = enc.encode(str);
    var n = Math.min(b.length, cap);
    bytes(ptr, n).set(b.subarray(0, n));
    return n;
  }
  function inset(i) {
    var el = document.getElementById("safe");
    if (!el) return 0;
    var cs = getComputedStyle(el);
    var v = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft][i];
    return parseFloat(v) || 0;
  }

  miniquad_add_plugin({
    name: "rufus",
    version: 1,
    register_plugin: function (importObject) {
      var env = importObject.env;
      env.rufus_save = function (ptr, len) {
        try {
          // slice(): decode() may not take a view onto growable wasm memory
          localStorage.setItem(SAVE_KEY, dec.decode(bytes(ptr, len).slice()));
        } catch (e) { /* private mode, storage full: play on without saving */ }
      };
      env.rufus_load = function (ptr, cap) {
        try {
          var s = localStorage.getItem(SAVE_KEY);
          return s ? put(s, ptr, cap) : 0;
        } catch (e) { return 0; }
      };
      env.rufus_query = function (ptr, cap) {
        return put(location.search || "", ptr, cap);
      };
      env.rufus_vibrate = function (ms) {
        try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
      };
      env.rufus_inset = function (i) { return inset(i); };
      env.rufus_now = function () { return Date.now(); };
      env.rufus_ready = function () {
        var s = document.getElementById("splash");
        if (s) {
          s.classList.add("gone");
          setTimeout(function () { s.remove(); }, 500);
        }
      };
    },
  });

  // Sound follows the screen: silent in the background, back when visible.
  // Browsers also refuse to start audio until a tap, and some suspend it
  // again later, so every touch gives suspended audio another nudge.
  function audio(run) {
    (window.rufusAudio || []).forEach(function (ctx) {
      try {
        if (run && ctx.state === "suspended") ctx.resume();
        if (!run && ctx.state === "running") ctx.suspend();
      } catch (e) {}
    });
  }
  document.addEventListener("visibilitychange", function () { audio(!document.hidden); });
  ["pointerdown", "touchend", "keydown"].forEach(function (type) {
    document.addEventListener(type, function () { if (!document.hidden) audio(true); }, { passive: true });
  });
  // No long-press menus or text selection over the game.
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  // If the wasm never starts, say so instead of bouncing the ball forever.
  window.addEventListener("error", function () {
    var m = document.getElementById("splash-msg");
    if (m) m.textContent = "Something went wrong loading the game. Try reloading.";
  });

  // Offline support. Service workers only exist on https:// or localhost, so
  // over plain http on the LAN the game still plays, it just isn't cached.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
