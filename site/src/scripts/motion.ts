/**
 * Site-wide motion: scroll reveals, number count-ups and the header's
 * scrolled state. Everything is progressive: content is visible without JS
 * (the `.js` class gates the hidden state) and reduced motion skips it all.
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

function countUp(): void {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  const format = (el: HTMLElement, n: number) => {
    el.textContent = `${el.dataset.prefix ?? ''}${Math.round(n).toLocaleString('en-GB')}${el.dataset.suffix ?? ''}`;
  };
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const target = Number(el.dataset.count);
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          format(el, target * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(tick);
        };
        format(el, 0);
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => io.observe(el));
}

function header(): void {
  const el = document.querySelector<HTMLElement>('.site-header');
  if (!el) return;
  const update = () => el.classList.toggle('is-scrolled', window.scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

reveal();
countUp();
header();
