/**
 * Scroll-linked motion for every page, driven by one passive scroll listener and one rAF loop that
 * sleeps when the page is still. Loaded on idle by index.ts, never under reduced motion.
 *
 * - Progress line along the top of the window (.scroll-line, base.css).
 * - [data-zoom] frames: the picture eases from 1.12 to 1 as the frame crosses the viewport.
 * - .ticker__run: tickers speed up with scroll speed, then settle back.
 * - [data-pin-steps] lists: on wide screens the list is wrapped in a taller runway and pins in the
 *   middle of the window while its items light up one by one, with a progress bar. A list that is
 *   too tall to fit the window is left as it is. Items are lit cumulatively and unlit ones stay
 *   readable (a light filter, base.css), so nothing is hidden from anyone who scrolls fast.
 * - Decorative shapes (.orb, free-standing .sparkle) drift at their own speed: depth. Any shape
 *   whose own animation already moves it is left alone.
 */
const WIDE = window.matchMedia('(min-width: 64rem)');
const RUNWAY_PER_ITEM = 0.3; // window heights of scrolling per item while pinned
const FITS = 0.82; // a list pins only if it is at most this share of the window height

interface Pin {
  runway: HTMLElement;
  stage: HTMLElement;
  bar: HTMLElement;
  list: HTMLElement;
  items: HTMLElement[];
  on: boolean;
}

function makePin(list: HTMLElement): Pin {
  const runway = document.createElement('div');
  runway.className = 'pin-runway';
  const stage = document.createElement('div');
  stage.className = 'pin-stage';
  const bar = document.createElement('span');
  bar.className = 'pin-bar';
  bar.setAttribute('aria-hidden', 'true');
  list.before(runway);
  stage.append(bar, list);
  runway.append(stage);
  const items = [...list.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  return { runway, stage, bar, list, items, on: false };
}

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
  const pins = [...document.querySelectorAll<HTMLElement>('[data-pin-steps]')].map(makePin);
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

  /** Measure every pin: pin it only on wide screens and when it fits in the window. */
  const layoutPins = () => {
    const vh = window.innerHeight;
    for (const pin of pins) {
      pin.runway.classList.remove('is-on');
      pin.runway.style.height = '';
      pin.stage.style.top = '';
      const h = pin.stage.offsetHeight;
      pin.on = WIDE.matches && h <= vh * FITS && pin.items.length > 1;
      // Side-by-side items get a small lift on the current one; full-width rows don't (it would
      // push past the page edge).
      const [first, second] = pin.items;
      pin.stage.classList.toggle(
        'pin-stage--grid',
        Boolean(second && first.offsetTop === second.offsetTop),
      );
      if (pin.on) {
        pin.runway.classList.add('is-on');
        pin.runway.style.height = `${h + pin.items.length * RUNWAY_PER_ITEM * vh}px`;
        pin.stage.style.top = `${Math.max(72, (vh - h) / 2)}px`;
      } else {
        pin.items.forEach((s) => s.classList.remove('is-lit', 'is-current'));
      }
    }
  };
  layoutPins();
  let resizeTimer = 0;
  const relayout = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      layoutPins();
      wake();
    }, 150);
  };
  WIDE.addEventListener('change', relayout);
  window.addEventListener('resize', relayout, { passive: true });
  // Fonts and lazy images change heights after start.
  window.addEventListener('load', relayout, { once: true });

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

    for (const pin of pins) {
      if (!pin.on) continue;
      const r = pin.runway.getBoundingClientRect();
      const runway = r.height - pin.stage.offsetHeight;
      const p = Math.min(1, Math.max(0, (parseFloat(pin.stage.style.top) - r.top) / runway));
      pin.bar.style.setProperty('--p', p.toFixed(4));
      const lit = Math.min(pin.items.length, Math.floor(p * pin.items.length * 0.999) + 1);
      pin.items.forEach((s, i) => {
        s.classList.toggle('is-lit', i < lit);
        s.classList.toggle('is-current', i === lit - 1);
      });
    }

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
