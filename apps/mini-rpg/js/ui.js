// =====================================================================
// ui.js  -  Menus and message boxes.
// The UI is a "stack": the newest box is on top and receives the keys.
// Opening a sub-menu pushes onto the stack; cancelling pops it off.
// =====================================================================

const MENU_ROWS = 17;        // the most lines a menu shows at once; longer lists scroll

const UI = {
  stack: [],
  get active() { return this.stack.length > 0; },
  get top() { return this.stack[this.stack.length - 1]; },

  // A list of choices.
  //   items: [{ label, right, disabled, desc, pick(item, menu) }]
  //          (desc = help text shown at the bottom of the screen while highlighted)
  //   options: x, y, w, title, cur (cursor start), onCancel, extra (extra drawing),
  //            maxBottom (lowest pixel the menu may reach),
  //            rows (how many lines to show at once; longer lists scroll), line (line height),
  //            hideWhenTargeting (not drawn while a list of monsters to target is open on top of it)
  openMenu(m) {
    m.type = 'menu';
    m.cur = clamp(m.cur || 0, 0, m.items.length - 1);
    this.stack.push(m);
    return m;
  },

  // A message box. "text" can be one string or a list of pages.
  say(text, then) {
    this.stack.push({ type: 'say', pages: Array.isArray(text) ? text : [text], page: 0, then });
  },

  // Anything else: give it your own draw() function. Any key closes it.
  openCustom(draw) { this.stack.push({ type: 'custom', draw }); },

  pop() { this.stack.pop(); },
  clear() { this.stack.length = 0; },

  key(action) {
    const t = this.top;
    if (!t) return;
    const confirm = action === 'ok' || action === 'cancel';
    if (t.type === 'say') {
      if (!confirm) return;
      Sfx.play('cursor');
      if (++t.page >= t.pages.length) {
        this.stack.splice(this.stack.indexOf(t), 1);
        if (t.then) t.then();
      }
    } else if (t.type === 'custom') {
      if (confirm) this.pop();
    } else {
      const n = t.items.length;
      if (action === 'up') t.cur = (t.cur + n - 1) % n;
      if (action === 'down') t.cur = (t.cur + 1) % n;
      if ((action === 'up' || action === 'down') && n > 1) Sfx.play('cursor');
      if (action === 'ok') {
        const it = t.items[t.cur];
        if (it && !it.disabled && it.pick) { Sfx.play('ok'); it.pick(it, t); }
        else Sfx.play('buzz');
      }
      if (action === 'cancel') {
        Sfx.play('cancel');
        if (t.onCancel) t.onCancel();
        else this.pop();
      }
    }
  },

  // ---- mouse ----
  // which menu line is under the mouse? (-1 = none)
  rowAt(m, x, y) {
    const b = m.box;                                   // remembered by drawMenu
    if (!b || x < b.x || x > b.x + b.w) return -1;
    let r = Math.floor((y - b.itemsY) / b.line);
    if (b.scrolls) {                                   // a scrolling list has a "more" line above and below
      if (r === 0) return 'up';
      if (r === b.rows + 1) return 'down';
      r--;
      if (r < 0 || r >= b.rows) return -1;
    }
    const i = r + (m.scroll || 0);
    return r >= 0 && i < m.items.length ? i : -1;
  },
  hover(x, y) {                                        // moving the mouse moves the cursor
    const t = this.top;
    if (!t || t.type !== 'menu') return;
    const i = this.rowAt(t, x, y);
    if (i >= 0) t.cur = i;
  },
  // Scroll a long list by "lines" (mouse wheel, or a click on its "more" line).
  scrollBy(m, lines) {
    if (!m || m.type !== 'menu' || !m.box || !m.box.scrolls) return;
    const before = m.scroll;
    m.scroll = clamp(m.scroll + lines, 0, m.items.length - m.box.rows);
    m.cur = clamp(m.cur, m.scroll, m.scroll + m.box.rows - 1);     // the cursor stays on a line you can see
    if (m.scroll !== before) Sfx.play('cursor');
  },
  wheel(lines) { this.scrollBy(this.top, lines); },
  click(x, y) {
    const t = this.top;
    if (!t) return;
    if (t.type !== 'menu') return this.key('ok');      // message box: click = continue
    const i = this.rowAt(t, x, y);
    if (i === 'up' || i === 'down') return this.scrollBy(t, i === 'up' ? -3 : 3);   // click "more" = scroll
    if (i >= 0) { t.cur = i; this.key('ok'); }         // click a line = choose it
    else this.key('cancel');                           // click outside = go back
  },

  draw() {
    for (const t of this.stack) {
      if (t.type === 'menu' && this.top.enemyList && t.hideWhenTargeting) continue;   // choosing a monster: keep the view clear
      if (t.type === 'menu') this.drawMenu(t);
      else if (t.type === 'say') drawMessage(t.pages[t.page]);
      else t.draw();
    }
    // help text for the highlighted line, in a small box at the bottom
    const t = this.top;
    const it = t && t.type === 'menu' && t.items[t.cur];
    if (it && it.desc) {
      drawWindow(8, 212, 304, 22);
      drawText(it.desc, 16, 219, '#ffe9a8');
    }
  },

  drawMenu(m) {
    const LINE = m.line || 11;                  // height of one line of text
    let w = m.w;
    if (!w) {                                   // no width given: fit the longest line
      w = m.title ? textWidth(m.title) + 20 : 40;
      for (const it of m.items) w = Math.max(w, textWidth(it.label + (it.right ? '   ' + rightText(it) : '')) + 26);
    }
    // Long lists scroll: only "rows" lines show, with a "more" line above and below them.
    const n = m.items.length, rows = Math.min(n, m.rows || MENU_ROWS), scrolls = n > rows;
    if (scrolls) m.scroll = clamp(m.scroll || 0, Math.max(0, m.cur - rows + 1), Math.min(m.cur, n - rows));   // keep the cursor in view
    else m.scroll = 0;
    const h = (rows + (scrolls ? 2 : 0) + (m.title ? 1 : 0)) * LINE + 10;
    const y = Math.min(m.y, (m.maxBottom || SCREEN_H - 4) - h);   // never hang off the bottom of the screen
    drawWindow(m.x, y, w, h);
    let ty = y + 6;
    if (m.title) { drawText(m.title, m.x + 8, ty, '#ffd75e'); ty += LINE; }
    m.box = { x: m.x, w, itemsY: ty - 1, line: LINE, rows, scrolls };   // where the lines are, for the mouse
    const more = (count, up) => {                        // e.g. "^ 5 more"  (click it, or use the mouse wheel)
      if (count > 0) {
        const ax = m.x + 16, ay = ty + 1;
        for (let i = 0; i < 3; i++) R(ctx, '#ffd75e', ax + 2 - i, ay + (up ? i : 2 - i) * 2, 1 + i * 2, 2);   // little arrow
        drawText(count + ' more', m.x + 26, ty, '#ffd75e');
      }
      ty += LINE;
    };
    if (scrolls) more(m.scroll, true);
    for (let i = m.scroll; i < m.scroll + rows; i++) {
      const it = m.items[i];
      const color = it.disabled ? '#8088a8' : '#fff';
      if (i === m.cur) drawText('>', m.x + 6, ty, m === this.top ? '#ffd75e' : '#8088a8');
      drawText(it.label, m.x + 14, ty, color);
      if (it.right) drawText(rightText(it), m.x + w - 8, ty, color, 'right');
      ty += LINE;
    }
    if (scrolls) more(n - m.scroll - rows, false);
    if (m.extra) m.extra();
  },
};

// The text on the right of a menu line. It may be a function, so it can change while the menu is open (ON / OFF).
const rightText = it => typeof it.right === 'function' ? it.right() : it.right;

// the big message box at the bottom of the screen
function drawMessage(text) {
  drawWindow(8, 176, 304, 58);
  wrapText(text, 284).slice(0, 4).forEach((line, i) => drawText(line, 18, 184 + i * 11));
}
