/* UI: panels, menus, dialogue, HUD, toasts. */
LC.UI = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let open = false, keyH = null, closable = true;

  function show(html, o) {
    o = o || {};
    const S = LC.Sim && LC.Sim.get && LC.Sim.get(); if (S && S.dead && !o.force) return; /* nothing may cover the game-over screen */
    if (document.body.classList.contains('touch')) html = String(html).replace(/ \((?:Esc|Enter|Esc \/ J|M)\)/g, ''); /* no keyboard on phones */
    $('pbox').innerHTML = html; $('panel').classList.remove('hidden'); $('pbox').scrollTop = 0;
    open = true; keyH = o.keys || null; closable = o.closable !== false;
    const x = $('pbox').querySelector('[data-x]'); if (x && !x.onclick) x.onclick = close;
  }
  function close() { $('panel').classList.add('hidden'); open = false; keyH = null; }
  function key(e) {
    if (!open) return false;
    if (keyH && keyH(e)) return true;
    if (e.key === 'Escape' && closable) { close(); return true; }
    return true; // swallow other keys while a panel is open
  }

  function menu(o) {
    const acts = o.actions || [], canClose = o.closable !== false;
    const pick = i => { const a = acts[i]; if (!a || a.disabled || !a.fn) return; close(); a.fn(); };
    show(`<div class="yr">${esc(o.sub || '')}</div><h2>${esc(o.title)}</h2>${o.text ? `<p>${esc(o.text)}</p>` : ''}
      <div class="acts">${acts.map((a, i) => `<button class="act" data-i="${i}" ${a.disabled ? 'disabled' : ''}><b>${i + 1}. ${esc(a.label)}</b>${a.desc ? `<small>${esc(a.desc)}</small>` : ''}</button>`).join('')}</div>
      ${canClose ? '<button class="ghost" data-x>Leave (Esc)</button>' : ''}`,
      { closable: canClose, keys: e => { const n = parseInt(e.key); if (n >= 1 && n <= acts.length) { pick(n - 1); return true; } if (!canClose && acts.length === 1 && e.key === 'Enter') { pick(0); return true; } } });
    $('pbox').querySelectorAll('[data-i]').forEach(b => b.onclick = () => pick(+b.dataset.i));
  }

  /* lines: [{who,text}] ; end: {choices:[{label,fn}], onEnd} */
  function dialog(lines, end) {
    end = end || {}; let i = 0;
    const render = () => {
      const L = lines[i], last = i === lines.length - 1, ch = last && end.choices;
      show(`<div class="who">${esc(L.who)}</div><p class="say">${esc(L.text)}</p>
        ${ch ? `<div class="acts">${end.choices.map((c, j) => `<button class="act" data-c="${j}"><b>${j + 1}.</b> ${esc(c.label)}</button>`).join('')}</div>` : `<button class="big" id="dn">${last ? 'Done' : 'Continue'} (Enter)</button>`}`,
        { closable: !ch, keys: e => {
          if (ch) { const n = parseInt(e.key); if (n >= 1 && n <= end.choices.length) { choose(n - 1); return true; } return false; }
          if (e.key === 'Enter' || e.key === ' ') { nxt(); return true; }
        } });
      if (ch) $('pbox').querySelectorAll('[data-c]').forEach(b => b.onclick = () => choose(+b.dataset.c));
      else $('dn').onclick = nxt;
    };
    const nxt = () => { if (i < lines.length - 1) { i++; render(); } else { close(); end.onEnd && end.onEnd(); } };
    const choose = j => { close(); end.choices[j].fn(); };
    render();
  }

  function toast(msg, kind) {
    const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; $('toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), kind === 'note' ? 6500 : 4200); setTimeout(() => t.remove(), kind === 'note' ? 7200 : 4900);
  }
  function prompt(t) { const p = $('prompt'); if (!t) p.classList.add('hidden'); else { p.textContent = t; p.classList.remove('hidden'); } }

  function bar(v, cls) { return `<div class="sb ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`; }
  function hud(S, obj) {
    const Sim = LC.Sim;
    $('date').textContent = Sim.dateStr();
    $('phase').textContent = Sim.PHASES[S.phase] || '';
    $('obj').innerHTML = `<span>OBJECTIVE</span>${esc(obj.text)}`;
    const h = Sim.hudHTML(S, bar);
    $('stats').innerHTML = h;
    document.documentElement.style.setProperty('--sth', $('stats').offsetHeight + 'px'); /* phones stack the objective under the stats */
  }

  function journal(S) {
    const D = LC.DATA;
    show(`<div class="yr">JOURNAL</div><h2>${esc(LC.Sim.PHASES[S.phase])}</h2>
      <p><b>Now:</b> ${esc(LC.Sim.objective().text)}</p>
      <h3>Hints from people you've met (${S.hints.length}/${Object.keys(D.hints).length})</h3>
      ${S.hints.length ? `<ul>${S.hints.map(h => `<li>${esc(D.hints[h])}</li>`).join('')}</ul>` : '<p class="mut small">Talk to people around the valley. Some of them know things that will save you.</p>'}
      <h3>Memories (${S.notes.length}/${D.notes.length})</h3>
      ${S.notes.length ? `<ul>${S.notes.map(i => `<li>${esc(D.notes[i].t)}</li>`).join('')}</ul>` : '<p class="mut small">Glowing green crystals around the map hold real moments from Jensen\'s life.</p>'}
      <button class="ghost" data-x>Close (Esc / J)</button>`, { keys: e => { if (e.key.toLowerCase() === 'j') { close(); return true; } } });
  }

  return { show, close, key, menu, dialog, toast, prompt, hud, journal, isOpen: () => open };
})();
