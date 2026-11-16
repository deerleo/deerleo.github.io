// What a hosted ride has to put up with that a local one never meets: a request that does not come back (a phone
// between two masts, a train in a tunnel, a server that says "later"). docs/build/hosting.md.
//
// Importing this file (src/main.js does, before anything else) makes every file the ride asks its own server for be
// asked for again when it does not arrive: twice, a little later each time, and while the browser says there is no
// connection at all it waits for the connection to come back first. That covers the models, the pictures, the
// tables and the music, whoever asks for them and however (fetch itself is what is wrapped: three's loaders and
// every area's own fetch go through it). A file is taken whole before it is handed on, so one that breaks off in
// the middle is asked for again too.
//
// It is also where the files the page asked for ahead of time are handed over (index.html asks for the whole first
// place at once, before this file has arrived; `window.__first.take(address)` gives one up, once).
//
// What still did not arrive is noted in `missed`, and the ride decides what that means (src/main.js: a first place
// with parts missing is not shown; the opening card says so and offers to try again). A file that is simply not
// there (404) is not the connection's doing: it is handed on as it is, once, and whoever asked logs it, as before.
//
//   import { missed, again, unfetched } from './net.js';
//   const mod = await again(() => import('./part.js'), 'part', unfetched);   // a part of the ride's code, asked for again
export const missed = [];                    // what never arrived: the paths, in the order they were given up
const WAITS = [700, 2200];                   // ms before the second and the third asking
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const note = (what) => { if (what && !missed.includes(what)) missed.push(what); };
const later = (status) => status === 408 || status === 425 || status === 429 || status >= 500;

/** With no connection at all, wait for it to come back (25 s at most) rather than ask into the dark. */
function connection(ms = 25000) {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener('online', done); clearTimeout(timer); resolve(); };
    const timer = setTimeout(done, ms);
    window.addEventListener('online', done);
  });
}

/** A request that failed on the way (not an answer: there was none), or was answered "later". */
export const lost = (err) => !!err && (err.status ? later(err.status) : err instanceof TypeError);
/** A part of the ride's code that was not fetched (every browser words it its own way; a mistake inside the part is not this). */
export const unfetched = (err) => /dynamically imported module|importing a module script failed/i.test(String((err && err.message) || err));

/** Do `ask` (it returns a promise). If it fails in a way `test` accepts, ask again, twice; then note `what` and give up. */
export async function again(ask, what, test = lost) {
  for (let i = 0; ; i++) {
    try { return await ask(); } catch (err) {
      if (!test(err)) throw err;
      if (i >= WAITS.length) { note(what); throw err; }
      await wait(WAITS[i]);
      await connection();
    }
  }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !window.__fetchAgain) {
  const plain = window.fetch.bind(window);
  window.__fetchAgain = true;
  window.fetch = function (input, init) {
    let url = null;
    try { url = new URL(typeof input === 'string' ? input : (input && input.url) || String(input), location.href); } catch (err) { /* not an address we can read: left alone */ }
    const method = String((init && init.method) || (input && typeof input === 'object' && input.method) || 'GET').toUpperCase();
    if (!url || method !== 'GET' || url.origin !== location.origin) return plain(input, init);
    // (the page asked for the first place's files all at once, before any of this was loaded: index.html, "the
    //  opening". One of those is handed over here, with no second asking; if it did not come, it is asked for now)
    const ahead = window.__first && window.__first.take(url.href);
    if (ahead) return ahead.then((got) => (got ? new Response(got.body, { status: 200, statusText: 'OK', headers: got.type ? { 'content-type': got.type } : {} }) : window.fetch(input, init)));
    return again(async () => {
      const r = await plain(input, init);
      if (later(r.status)) { const err = new Error(`${url.pathname}: ${r.status}`); err.status = r.status; err.answer = r; throw err; }
      if (r.status === 401 || r.status === 403) note(url.pathname);      // (the server will not give it: asking again changes nothing, but the ride should know)
      if (!r.ok || r.status === 204 || r.status === 205 || !r.body) return r;
      const body = await r.arrayBuffer();      // (the whole of it, here: one that breaks off in the middle fails here, and is asked for again)
      const headers = new Headers(r.headers);
      headers.delete('content-encoding'); headers.delete('content-length');      // (they described the file as it travelled, not as it is now)
      return new Response(body, { status: r.status, statusText: r.statusText, headers });
    }, url.pathname).catch((err) => { if (err && err.answer) return err.answer; throw err; });      // (answered "later" three times: the answer is handed on, as it would have been)
  };
}
