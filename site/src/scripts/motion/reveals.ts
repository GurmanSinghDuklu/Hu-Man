/**
 * Scroll reveals: each [data-reveal] element plays once as it comes into view (never scrubbed by
 * scrolling) by gaining the `is-in` class. CSS does the default fade-up and the `slide`, `grow`
 * and `scan` variants. `lines` headings are split into lines with GSAP SplitText and slide up
 * from a mask, once GSAP has loaded; until then (or if it never loads) they fade like the rest.
 *
 * Content is visible without JS (the `.js` class gates the hidden state), and reduced motion shows
 * everything at once.
 */
type Gsap = typeof import('gsap').gsap;
type SplitTextClass = typeof import('gsap/SplitText').SplitText;

let gsapLib: { gsap: Gsap; SplitText: SplitTextClass } | null = null;

/** Called by index.ts once GSAP has loaded. */
export function useGsap(gsap: Gsap, SplitText: SplitTextClass): void {
  gsap.registerPlugin(SplitText);
  gsapLib = { gsap, SplitText };
}

function playLines(el: HTMLElement): void {
  if (!gsapLib) return;
  const { gsap, SplitText } = gsapLib;
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, { yPercent: 105, duration: 0.9, stagger: 0.09, ease: 'power3.out' }),
  });
}

function play(el: HTMLElement): void {
  if (el.classList.contains('is-in')) return;
  if (el.dataset.reveal === 'lines') playLines(el);
  el.classList.add('is-in');
}

export function startReveals(reduceMotion: boolean): void {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        play(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
  // Keyboard focus can land on a link before its section has scrolled far enough to reveal:
  // show it (and any hidden ancestors) at once, so focus is never on something invisible.
  document.addEventListener('focusin', (event) => {
    for (let node = event.target as HTMLElement | null; node; node = node.parentElement) {
      if (node.matches('[data-reveal]:not(.is-in)')) {
        node.style.transitionDuration = '0s';
        play(node);
        io.unobserve(node);
      }
    }
  });
}
