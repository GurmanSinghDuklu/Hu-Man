/**
 * Scroll reveals: sections fade up once as they come into view (they play by themselves, never
 * scrubbed by scrolling). Content is visible without JS (the `.js` class gates the hidden state)
 * and reduced motion shows everything at once.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function reveal(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

reveal();
