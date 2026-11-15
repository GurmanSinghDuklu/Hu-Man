/**
 * Pick lists ([data-pick]): one click on a card highlights it (and softens the others); one more
 * click on the same card clears it. Cards are focusable, and an arrow key moves the highlight to
 * the next or previous card, one press each. The page scrolls normally throughout (Gurman,
 * 2026-11-15: replaces the pinned, scroll-stepped lists).
 */
for (const list of document.querySelectorAll<HTMLElement>('[data-pick]')) {
  const items = [...list.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  const pick = (item: HTMLElement | null) => {
    for (const el of items) el.classList.toggle('is-picked', el === item);
    list.classList.toggle('has-pick', Boolean(item));
    for (const el of items) {
      if (el === item) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }
  };
  for (const item of items) {
    item.tabIndex = 0;
    item.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a, button, input, select, textarea')) return;
      pick(item.classList.contains('is-picked') ? null : item);
    });
    item.addEventListener('keydown', (e) => {
      if (e.target !== item || e.altKey || e.ctrlKey || e.metaKey) return;
      const i = items.indexOf(item);
      const step =
        e.key === 'ArrowRight' || e.key === 'ArrowDown'
          ? 1
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
            ? -1
            : 0;
      if (step) {
        const next = items[i + step];
        if (!next) return; // past either end: let the page scroll
        e.preventDefault();
        next.focus({ preventScroll: false });
        pick(next);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(item.classList.contains('is-picked') ? null : item);
      }
    });
  }
}
