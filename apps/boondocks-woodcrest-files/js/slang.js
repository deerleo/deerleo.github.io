/* slang.js: the show's characters use one word constantly as a casual term of address.
 * Scripts never spell it; they write {n} / {N} (capitalised) / {ns} / {Ns} (plural), and the game
 * swaps in the word below, on screen and in speech. Change it here, or run: dev/set-word.sh <word> */
(() => {
  const BD = (window.BD = window.BD || {});
  BD.WORD = 'homie';
  BD.slang = (s) => String(s).replace(/\{(n|N)(s?)\}/g, (m, c, pl) => {
    const w = (BD.WORD || 'homie') + (pl ? 's' : '');
    return c === 'N' ? w[0].toUpperCase() + w.slice(1) : w;
  });
})();
