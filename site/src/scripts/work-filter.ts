/** Concept gallery filter: toggles cards by category with aria-pressed buttons. */
const root = document.querySelector<HTMLElement>('[data-work]');
if (root) {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-cat]'));
  const empty = root.querySelector<HTMLElement>('[data-work-empty]');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      let shown = 0;
      for (const card of cards) {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.hidden = !match;
        if (match) {
          shown++;
          card.classList.add('is-in');
        }
      }
      if (empty) empty.hidden = shown > 0;
    });
  }
}

export {};
