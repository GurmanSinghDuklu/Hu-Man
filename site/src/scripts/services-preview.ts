/**
 * Services list: the active row swaps the concept render beside it.
 * Hover or focus-within picks a row; otherwise it cycles every few seconds
 * while the section is on screen. Reduced motion: no auto-cycle.
 */
const root = document.querySelector<HTMLElement>('[data-services]');
if (root) {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-service]'));
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let paused = false;
  let visible = false;

  const setActive = (i: number) => {
    active = i;
    items.forEach((el, n) => el.classList.toggle('is-active', n === i));
    slides.forEach((el, n) => el.classList.toggle('is-active', n === i));
  };

  items.forEach((el, i) => {
    el.addEventListener('mouseenter', () => {
      paused = true;
      setActive(i);
    });
    el.addEventListener('mouseleave', () => {
      paused = false;
    });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    }).observe(root);
  }

  if (!reduce) {
    window.setInterval(() => {
      if (!paused && visible) setActive((active + 1) % items.length);
    }, 3200);
  }
}

export {};
