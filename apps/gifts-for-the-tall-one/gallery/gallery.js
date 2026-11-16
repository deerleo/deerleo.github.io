// Renders the run cards from runs/manifest.json (built by `npm run manifest`).
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = (id) => document.getElementById(id);
let manifest = null;
let sort = 'date';

function card(run, rubric) {
  const href = `runs/${encodeURIComponent(run.slug)}/`;
  const game = run.game || {};
  const scored = typeof run.scoreTotal === 'number';
  const chips = [run.vendor, run.harness, run.date, `brief v${run.brief}`].filter(Boolean).map((c) => `<span class="chip">${esc(c)}</span>`);
  if (run.check) chips.push(`<span class="chip ${run.check.pass ? 'pass' : 'fail'}" title="${esc(run.check.failed.join(', '))}">${run.check.pass ? 'check passed' : `check failed: ${esc(run.check.failed.join(', '))}`}</span>`);
  else chips.push('<span class="chip">not checked</span>');
  if (run.session && run.session.humanInterventions > 0) chips.push(`<span class="chip">${run.session.humanInterventions} human nudges</span>`);
  const scores = scored
    ? `<div class="scores">${rubric.map((k) => `<div>${esc(k)} ${run.score[k]}<i><b style="width:${(run.score[k] / 5) * 100}%"></b></i></div>`).join('')}</div>${run.score.notes ? `<p class="verdict">“${esc(run.score.notes)}”</p>` : ''}`
    : '';
  return `<article class="run">
    <a class="cover" href="${run.playable ? href : '#'}" aria-label="Play ${esc(game.title || run.slug)}">
      ${run.cover ? `<img src="${href}${esc(run.cover)}" alt="" loading="lazy">` : '<span class="none">no picture yet</span>'}
      ${scored ? `<span class="total">${run.scoreTotal}<small>/${run.scoreMax}</small></span>` : ''}
      ${run.playable ? '<span class="play">Play</span>' : ''}
    </a>
    <div class="body">
      <h3>${esc(run.model || run.slug)}</h3>
      <p class="game">${esc(game.title || 'Untitled')}</p>
      ${game.tagline ? `<p class="tag">${esc(game.tagline)}</p>` : ''}
      <div class="chips">${chips.join('')}</div>
      ${scores}
      ${game.controls ? `<p class="tag">${esc(game.controls)}</p>` : ''}
      <div class="links">${run.playable ? `<a href="${href}">Play</a>` : ''}<a href="${href}NOTES.md">The model’s notes</a><a href="${href}run.json">run.json</a></div>
    </div>
  </article>`;
}

function render() {
  const runs = [...manifest.runs];
  if (sort === 'score') runs.sort((a, b) => (b.scoreTotal ?? -1) - (a.scoreTotal ?? -1) || String(b.date).localeCompare(String(a.date)));
  $('count').textContent = `${runs.length} run${runs.length === 1 ? '' : 's'}`;
  $('empty').hidden = runs.length > 0;
  $('runs').innerHTML = runs.map((r) => card(r, manifest.rubric)).join('');
}

for (const b of document.querySelectorAll('.sort button')) {
  b.addEventListener('click', () => {
    sort = b.dataset.sort;
    for (const o of document.querySelectorAll('.sort button')) o.setAttribute('aria-pressed', String(o === b));
    if (manifest) render();
  });
}

try {
  const res = await fetch('runs/manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(String(res.status));
  manifest = await res.json();
  render();
} catch {
  $('error').hidden = false;
  $('count').textContent = 'Runs';
}
