/** Hero collage filter: chips show only tiles in that category. */
const root = document.querySelector<HTMLElement>('[data-collage]');
if (root) {
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-collage-filter]'));
  const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-cats]'));
  const collage = root.querySelector<HTMLElement>('.hero__collage');
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.collageFilter ?? 'all';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      collage?.classList.toggle('is-filtered', filter !== 'all');
      for (const tile of tiles) {
        const cats = (tile.dataset.cats ?? '').split(' ');
        tile.hidden = filter !== 'all' && !cats.includes(filter);
      }
    });
  }
}

export {};
