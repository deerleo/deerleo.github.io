// Word-wheel logic: a code book lists candidate words; constraint clues eliminate all but one.
const VOWELS = 'AEIOU';
const vowelCount = (w) => [...w].filter((c) => VOWELS.includes(c)).length;
const hasRepeat = (w) => new Set(w).size < w.length;
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

export function testC(c, w) {
  switch (c.t) {
    case 'has': return w.includes(c.l);
    case 'lacks': return !w.includes(c.l);
    case 'vowels': return vowelCount(w) === c.n;
    case 'len': return w.length === c.n;
    case 'first': return (w[0] <= 'M') === (c.half === 1);
    case 'endv': return VOWELS.includes(w[w.length - 1]) === c.v;
    case 'rep': return hasRepeat(w) === c.v;
  }
  return true;
}

export function textC(c) {
  switch (c.t) {
    case 'has': return `The word contains the letter ${c.l}.`;
    case 'lacks': return `The word has no letter ${c.l} in it.`;
    case 'vowels': return `The word has exactly ${NUM[c.n]} vowel${c.n === 1 ? '' : 's'} (A, E, I, O, U).`;
    case 'len': return `The word is ${NUM[c.n]} letters long.`;
    case 'first': return c.half === 1 ? 'Its first letter comes from the first half of the alphabet (A to M).' : 'Its first letter comes from the second half of the alphabet (N to Z).';
    case 'endv': return c.v ? 'The word ends with a vowel.' : 'The word ends with a consonant.';
    case 'rep': return c.v ? 'One letter appears in the word more than once.' : 'No letter appears twice in the word.';
  }
  return '';
}

// Every statement that is true of the answer, removes at least one decoy, but not all of them.
function usefulConstraints(answer, decoys) {
  const all = [];
  for (const l of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') all.push(answer.includes(l) ? { t: 'has', l } : { t: 'lacks', l });
  all.push({ t: 'vowels', n: vowelCount(answer) }, { t: 'len', n: answer.length }, { t: 'first', half: answer[0] <= 'M' ? 1 : 2 },
    { t: 'endv', v: VOWELS.includes(answer[answer.length - 1]) }, { t: 'rep', v: hasRepeat(answer) });
  return all.filter((c) => { const k = decoys.filter((d) => !testC(c, d)).length; return k > 0 && k < decoys.length; });
}

export function remaining(candidates, constraints) {
  return candidates.filter((w) => constraints.every((c) => testC(c, w)));
}

function pickConstraints(rng, answer, decoys, want) {
  const pool = usefulConstraints(answer, decoys);
  for (let tries = 0; tries < 400; tries++) {
    const set = rng.shuffle(pool).slice(0, want);
    // avoid two letter-clues dominating: at most 2 has/lacks per set
    if (set.filter((c) => c.t === 'has' || c.t === 'lacks').length > 2) continue;
    if (new Set(set.map((c) => c.t + (c.l || ''))).size < set.length) continue;
    if (remaining(decoys, set).length) continue;
    // every clue must be necessary
    if (set.some((_, i) => !remaining(decoys, set.filter((__, j) => j !== i)).length)) continue;
    return set;
  }
  return null;
}

function wheelLetters(rng, words) {
  const need = {};
  for (const w of words) {
    const cnt = {};
    for (const c of w) cnt[c] = (cnt[c] || 0) + 1;
    for (const c in cnt) need[c] = Math.max(need[c] || 0, cnt[c]);
  }
  const out = [];
  for (const c in need) for (let i = 0; i < need[c]; i++) out.push(c);
  return rng.shuffle(out).join('');
}

// Build a complete wheel lock: answer, decoys that share letters with it, minimal clue set, wheel letters.
export function buildWheel(rng, pool, nCands, nCons, forceWord) {
  pool = [...new Set(pool.map((w) => w.toUpperCase()))];
  for (let tries = 0; tries < 60; tries++) {
    const answer = forceWord || rng.pick(pool);
    // prefer decoys that add few new letters so the wheel stays compact
    const scored = rng.shuffle(pool.filter((w) => w !== answer)).map((w) => ({ w, s: [...new Set(w)].filter((c) => !answer.includes(c)).length + rng.next() * 2.5 }));
    scored.sort((a, b) => a.s - b.s);
    const decoys = scored.slice(0, nCands - 1).map((o) => o.w);
    if (decoys.length < 2) return null;
    const words = [answer, ...decoys];
    const letters = wheelLetters(rng, words);
    if (letters.length > 13) continue;
    for (const k of [nCons, nCons + 1, nCons - 1]) {
      if (k < 1) continue;
      const constraints = pickConstraints(rng, answer, decoys, k);
      if (constraints) return { word: answer, candidates: rng.shuffle(words).sort(), constraints, letters };
    }
  }
  return null;
}

export const isWord = (w) => /^[A-Z]{3,7}$/.test(w);
