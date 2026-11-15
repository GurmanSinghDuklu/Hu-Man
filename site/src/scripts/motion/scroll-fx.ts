/**
 * Scroll-linked motion for every page, driven by one passive scroll listener and one rAF loop that
 * sleeps when the page is still. Loaded on idle by index.ts, never under reduced motion.
 *
 * - Progress line along the top of the window (.scroll-line, base.css).
 * - [data-zoom] frames: the picture eases from 1.12 to 1 as the frame crosses the viewport.
 * - .ticker__run: tickers speed up with scroll speed, then settle back.
 * - Decorative shapes (.orb, free-standing .sparkle) drift at their own speed: depth. Any shape
 *   whose own animation already moves it is left alone.
 */
function movesItself(el: Element): boolean {
  return el.getAnimations().some((a) => {
    const frames = (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
    return frames.some((f) => 'translate' in f || 'transform' in f);
  });
}

export function startScrollFx(): void {
  const root = document.documentElement;

  const line = document.createElement('div');
  line.className = 'scroll-line';
  line.setAttribute('aria-hidden', 'true');
  document.body.append(line);

  const zooms = [...document.querySelectorAll<HTMLElement>('[data-zoom]')];
  const tickers = [...document.querySelectorAll<HTMLElement>('.ticker__run')].flatMap((el) =>
    el.getAnimations(),
  );
  // Parallax. Each mover has an axis, a speed (k) and a cap. Anything in the first window when the
  // page opens moves by scroll distance (so it starts exactly in place); the rest move by their
  // distance from the middle of the window, so they settle as they pass the centre.
  const startY = window.scrollY;
  const vh0 = window.innerHeight;
  const mover = (el: HTMLElement, axis: 'x' | 'y', k: number, cap: number) => ({
    el,
    axis,
    k,
    cap,
    cur: 0,
    fromTop: el.getBoundingClientRect().top + startY < vh0,
  });
  const usable = (el: HTMLElement) => getComputedStyle(el).translate === 'none' && !movesItself(el);
  const drifters = [
    // Decorative shapes.
    ...[
      ...document.querySelectorAll<HTMLElement>(
        'main .orb, main .sparkle:not(a .sparkle, button .sparkle, li .sparkle, .ticker .sparkle)',
      ),
    ]
      .filter(usable)
      .map((el, i) => mover(el, 'y', [0.1, -0.08, 0.16, -0.12, 0.07][i % 5], 70)),
    // Hero collage pieces (home and inner pages): each cell at its own speed, for depth.
    ...[...document.querySelectorAll<HTMLElement>('.collage__cell, .collage__ring, .collage__pill')]
      .filter(usable)
      .map((el, i) => mover(el, 'y', [-0.06, 0.1, -0.13, 0.05, 0.15, -0.09, 0.08][i % 7], 50)),
    // Section headlines slide a little sideways as they pass, alternating direction. Only
    // headings whose reveal doesn't use translate (plain or line-split ones).
    ...[...document.querySelectorAll<HTMLElement>('main section h2.display')]
      .filter((el) => !el.dataset.reveal || el.dataset.reveal === 'lines')
      .map((el, i) => mover(el, 'x', i % 2 ? -0.07 : 0.07, 48)),
  ];

  let lastY = window.scrollY;
  let speed = 1;
  let raf = 0;

  const frame = () => {
    raf = 0;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    line.style.setProperty('--progress', String(max > 0 ? y / max : 0));

    for (const el of zooms) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      // 0 as the frame's top enters at the bottom, 1 once its middle reaches the top third.
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.66 + r.height * 0.5)));
      el.style.setProperty('--zoom', (1.12 - 0.12 * t).toFixed(4));
    }

    // Tickers: boost by scroll speed (px per frame), easing back to normal.
    const target = 1 + Math.min(6, Math.abs(y - lastY) / 6);
    speed += (target - speed) * (target > speed ? 0.35 : 0.06);
    for (const a of tickers) a.playbackRate = speed;
    lastY = y;

    for (const d of drifters) {
      const r = d.el.getBoundingClientRect();
      // Where the element would be without its own drift, so the offset never feeds back on itself.
      const top = d.axis === 'y' ? r.top - d.cur : r.top;
      if (top + r.height < -200 || top > vh + 200) continue;
      const raw = d.fromTop ? -(y - startY) * d.k : (top + r.height / 2 - vh / 2) * d.k;
      // Sideways moves scale with the window, so a headline never slides past a phone's margin.
      const cap = d.axis === 'x' ? Math.min(d.cap, window.innerWidth * 0.025) : d.cap;
      d.cur = Math.max(-cap, Math.min(cap, raw));
      d.el.style.translate = d.axis === 'y' ? `0 ${d.cur.toFixed(1)}px` : `${d.cur.toFixed(1)}px 0`;
    }

    if (Math.abs(speed - 1) > 0.01) wake();
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  window.addEventListener('scroll', wake, { passive: true });
  wake();
}
