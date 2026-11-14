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
 *   Each wheel or trackpad gesture, and each press of an arrow, Page or Space key, moves exactly
 *   one item (Gurman, 2026-11-14): the first move into the runway lands on the first item, each
 *   next one glides to the next item, and one more past the last item carries on down the page. The rest of a gesture (a
 *   trackpad's inertia) is swallowed, so one swipe never skips items. The scrollbar and touch
 *   still scroll freely, and the items light by position as before.
 * - Decorative shapes (.orb, free-standing .sparkle) drift at their own speed: depth. Any shape
 *   whose own animation already moves it is left alone.
 */
import { scroller } from './scroller';

const WIDE = window.matchMedia('(min-width: 64rem)');
const STEP_MS = 650; // after a step, wheel input is held this long before the next one counts
const GESTURE_GAP_MS = 140; // a pause this long, then a push at least as hard, is a new gesture
const RUNWAY_PER_ITEM = 0.3; // window heights of scrolling per item while pinned
const FITS = 0.82; // a list pins only if it is at most this share of the window height

interface Pin {
  runway: HTMLElement;
  stage: HTMLElement;
  bar: HTMLElement;
  list: HTMLElement;
  items: HTMLElement[];
  /** The section's label and headline (and anything between them and the list), held in place
   * with the list when they fit the window together; empty when the headline sits elsewhere. */
  head: HTMLElement[];
  on: boolean;
}

/** The label, headline and anything else between them and the list, if the headline is one of the
 * list's earlier siblings. */
function headOf(list: HTMLElement): HTMLElement[] {
  const before: HTMLElement[] = [];
  for (let n = list.previousElementSibling; n; n = n.previousElementSibling) {
    if (!(n instanceof HTMLElement)) continue;
    before.unshift(n);
    if (n.matches('h2')) {
      const label = n.previousElementSibling;
      if (label instanceof HTMLElement && label.matches('.label')) before.unshift(label);
      return before;
    }
  }
  return [];
}

function makePin(list: HTMLElement): Pin {
  const runway = document.createElement('div');
  runway.className = 'pin-runway';
  const stage = document.createElement('div');
  stage.className = 'pin-stage';
  const bar = document.createElement('span');
  bar.className = 'pin-bar';
  bar.setAttribute('aria-hidden', 'true');
  const head = headOf(list);
  list.before(runway);
  stage.append(bar, list);
  runway.append(stage);
  const items = [...list.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
  return { runway, stage, bar, list, items, head, on: false };
}

/** Page offset of an element from layout alone, so a moving ancestor (a handoff's sink and
 * shrink, a reveal) never shifts it. */
function layoutTop(el: HTMLElement): number {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    top += n.offsetTop;
  }
  return top;
}

/**
 * Scroll offsets where a pin starts (first item current) and ends (last item current). Item i is
 * current at start + (end - start) * i / (items - 1).
 */
function pinSpan(pin: Pin): { start: number; end: number } {
  const start = layoutTop(pin.runway) - parseFloat(pin.stage.style.top);
  return { start, end: start + pin.runway.offsetHeight - pin.stage.offsetHeight };
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
    // The stage sits clear of the header, which comes back when you scroll up.
    const clear = (document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 72) + 16;
    const fits = (h: number) => h <= Math.min(vh * FITS, vh - clear - 16);
    for (const pin of pins) {
      pin.runway.classList.remove('is-on');
      pin.runway.style.height = '';
      pin.stage.style.top = '';
      // Hold the headline with the list when both fit; otherwise the headline scrolls by as before.
      if (pin.head.length) {
        // After the progress line, which then runs above the label like a rule.
        pin.bar.after(...pin.head);
        if (!fits(pin.stage.offsetHeight)) pin.runway.before(...pin.head);
      }
      const h = pin.stage.offsetHeight;
      pin.on = WIDE.matches && fits(h) && pin.items.length > 1;
      if (!pin.on && pin.head[0]?.parentElement === pin.stage) pin.runway.before(...pin.head);
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
        pin.stage.style.top = `${Math.max(clear, (vh - h) / 2)}px`;
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
      const { start, end } = pinSpan(pin);
      const p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
      pin.bar.style.setProperty('--p', p.toFixed(4));
      // Item i is current at its own step position (pinSpan), switching halfway between.
      const lit = Math.round(p * (pin.items.length - 1)) + 1;
      pin.items.forEach((s, i) => {
        s.classList.toggle('is-lit', i < lit);
        s.classList.toggle('is-current', i === lit - 1);
      });
    }

    for (const d of drifters) {
      // A headline held with its pinned list stays square with its label.
      if (d.el.closest('.pin-runway.is-on')) {
        if (d.cur) d.el.style.translate = '';
        d.cur = 0;
        continue;
      }
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

  // Wheel and key stepping through pinned lists.
  let gesture = 0; // counts wheel gestures
  let lastWheel = 0;
  let lastAbs = 0;
  let stepGesture = -1;
  let stepAt = -Infinity;
  let aimY = 0; // where the last step is gliding to (the page may not be there yet)

  const go = (y: number, now: number) => {
    aimY = y;
    stepAt = now;
    stepGesture = gesture;
    scroller.to(y);
  };

  /**
   * Where a move of `delta` px from `y` should go if it touches a pinned list: a page offset to
   * glide to, `'hold'` to stay put, or null to let the page scroll as normal. `held` is true while
   * the last step is still settling (or it is the same gesture), so nothing moves twice.
   */
  const decide = (y: number, delta: number, held: boolean): number | 'hold' | null => {
    const dir = Math.sign(delta);
    for (const pin of pins) {
      if (!pin.on) continue;
      const { start, end } = pinSpan(pin);
      const last = pin.items.length - 1;
      let to: number;
      if (y < start - 2) {
        if (dir > 0 && y + delta >= start)
          to = start; // arriving from above: the first item
        else continue;
      } else if (y > end + 2) {
        if (dir < 0 && y + delta <= end)
          to = end; // arriving from below: the last item
        else continue;
      } else {
        const at = Math.round(((y - start) / Math.max(1, end - start)) * last);
        const next = at + dir;
        // Past either end: let the page carry on, unless this is still the move that stepped.
        if (next < 0 || next > last) return held ? 'hold' : null;
        to = start + ((end - start) * next) / last;
      }
      return held ? 'hold' : to;
    }
    return null;
  };
  const aim = (now: number) => (now - stepAt < 900 ? aimY : scroller.target());

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
    const now = performance.now();
    const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    const delta = e.deltaY * unit;
    const abs = Math.abs(delta);
    // A new gesture: a long pause, a short pause followed by a push at least as hard (a wheel
    // notch, a fresh swipe), or a sudden harder push during a trackpad's fading inertia. A short
    // pause in a fading push is the same gesture: a busy page (a shader compiling) can delay
    // inertia events.
    const gap = now - lastWheel;
    if (gap > 400 || (gap > GESTURE_GAP_MS && abs >= lastAbs) || abs > lastAbs * 1.4 + 4) {
      gesture += 1;
    }
    lastWheel = now;
    lastAbs = abs;

    const to = decide(aim(now), delta, gesture === stepGesture || now - stepAt < STEP_MS);
    if (to === null) return;
    // Lenis skips events flagged like this; the page doesn't move by itself either.
    (e as WheelEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
    e.preventDefault();
    if (to !== 'hold') go(to, now);
  };

  // Keys: one press of an arrow, Page Up/Down or Space moves one item. Holding a key down moves
  // one item per settle time rather than racing through.
  const KEY_MOVES: Record<string, (vh: number) => number> = {
    ArrowDown: () => 120,
    ArrowUp: () => -120,
    PageDown: (vh) => vh * 0.85,
    PageUp: (vh) => -vh * 0.85,
    ' ': (vh) => vh * 0.85,
  };
  const onKey = (e: KeyboardEvent) => {
    const move = KEY_MOVES[e.key];
    if (!move || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    // Leave keys alone where they do something else: fields, buttons, links (Space), menus.
    if (
      t?.closest(
        'input, textarea, select, button, a, [contenteditable], [role="menu"], [role="listbox"], [role="tablist"], [role="slider"], .site-header, dialog, [popover]',
      )
    ) {
      return;
    }
    const now = performance.now();
    const delta = move(window.innerHeight) * (e.key === ' ' && e.shiftKey ? -1 : 1);
    const to = decide(aim(now), delta, e.repeat && now - stepAt < STEP_MS);
    if (to === null) return;
    e.preventDefault();
    if (to !== 'hold') go(to, now);
  };
  window.addEventListener('keydown', onKey);
  // Capture on window runs before Lenis's own wheel listener (bubble, on window).
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
}
