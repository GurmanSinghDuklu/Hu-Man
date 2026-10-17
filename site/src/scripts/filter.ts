/**
 * Filter buttons for a grid: inside each [data-filter-root], pressing a [data-filter] button
 * shows only the [data-cat] items whose space-separated categories include it ("all" shows
 * everything). Buttons carry aria-pressed; [data-filter-empty] shows when nothing matches.
 */
document.querySelectorAll<HTMLElement>('[data-filter-root]').forEach((root) => {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-cat]'));
  const empty = root.querySelector<HTMLElement>('[data-filter-empty]');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter ?? 'all';
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      let shown = 0;
      for (const item of items) {
        const match = filter === 'all' || (item.dataset.cat ?? '').split(' ').includes(filter);
        item.hidden = !match;
        if (match) {
          shown++;
          item.classList.add('is-in');
        }
      }
      if (empty) empty.hidden = shown > 0;
    });
  }
});

export {};
