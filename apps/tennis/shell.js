// The Six Finger Punch shell, shared by every project: the preloader, the badge and its info window,
// long-press menus for the bar, and analytics. Copied in by bin/new from templates/shell. Improvements go back there.
const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------- the preloader

// Fades the preloader out. Call it once everything has loaded and the first frame is up, and when it fails,
// so whatever went wrong can be seen.
export function ready() {
    const el = $('loader');
    if (!el || el.classList.contains('done')) return;
    el.classList.add('done');
    setTimeout(() => el.remove(), 600);
}

// ---------------------------------------------------------------- menus

// A tap does the button's job. Holding it, or right-clicking it, opens its menu.
let menu = null;

export function closeMenu() {
    if (menu) menu.el.hidden = true;
    menu = null;
}

export function openMenu(el, button) {
    closeMenu();
    el.hidden = false;
    const r = button.getBoundingClientRect();
    const half = el.offsetWidth / 2 + 8;
    el.style.left = `${clamp(r.left + r.width / 2, half, innerWidth - half)}px`;
    menu = { el, button };
}

export function holdable(button, el, tap) {
    let timer = 0, held = false;
    button.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        held = false;
        clearTimeout(timer);
        timer = setTimeout(() => {
            held = true;
            openMenu(el, button);
        }, 400);
    });
    button.addEventListener('pointerup', e => {
        clearTimeout(timer);
        // Sliding onto a choice and letting go picks it.
        if (held) document.elementFromPoint(e.clientX, e.clientY)?.closest('.menu button')?.click();
    });
    button.addEventListener('pointercancel', () => clearTimeout(timer));
    button.addEventListener('contextmenu', e => {
        e.preventDefault();
        clearTimeout(timer);
        held = true;
        openMenu(el, button);
    });
    button.addEventListener('click', () => {
        if (held) {
            held = false;
            return;
        }
        closeMenu();
        tap();
    });
}

document.addEventListener('pointerdown', e => {
    if (menu && !menu.el.contains(e.target) && !menu.button.contains(e.target)) closeMenu();
}, true);
window.addEventListener('resize', closeMenu);

// ---------------------------------------------------------------- analytics

// Counts an event in Fathom. The script only sends from the live domain, so local runs count nothing, and
// if a blocker stops it loading this does nothing.
export const track = name => window.fathom?.trackEvent(name);

// ---------------------------------------------------------------- feedback

// Swaps a button's icon for a moment: a tick when it worked, a cross when it didn't.
export function flash(button, icon) {
    const use = button.querySelector('use');
    button.dataset.icon ??= use.getAttribute('href');
    use.setAttribute('href', `#i-${icon}`);
    clearTimeout(button.timer);
    button.timer = setTimeout(() => use.setAttribute('href', button.dataset.icon), 1600);
}

// ---------------------------------------------------------------- the info window

const about = $('about');

// The project can listen for 'open' on #about to tuck its own panels away.
export function openAbout() {
    closeMenu();
    about.hidden = false;
    about.dispatchEvent(new Event('open'));
}

export const closeAbout = () => (about.hidden = true);

$('badge').addEventListener('click', e => {
    e.preventDefault();
    openAbout();
});
about.addEventListener('click', e => {
    if (e.target === about) closeAbout();
});

// While it's open the keys are its own: Escape closes it, and the project's shortcuts wait.
window.addEventListener('keydown', e => {
    if (about.hidden) return;
    if (e.key === 'Escape') closeAbout();
    e.stopImmediatePropagation();
}, true);
