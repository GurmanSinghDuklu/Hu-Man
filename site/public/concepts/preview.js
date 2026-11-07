/*
 * Preview mode for the concept portfolios, used by the live wall on /portfolio.
 * Only runs when the page is opened with ?preview (inside the wall's iframes). It:
 *  - hides the back badge and scrollbars,
 *  - scrolls the page by itself in a loop (dwell on the hero, glide down, glide back up),
 *  - moves a ghost cursor by sending synthetic pointermove/mousemove events, and
 *  - follows the real cursor while the parent page reports it over the tile (postMessage).
 * Nothing runs under prefers-reduced-motion. No network, no storage.
 */
(() => {
  if (!new URLSearchParams(location.search).has('preview')) return;

  const root = document.documentElement;
  root.classList.add('is-preview');
  const css = document.createElement('style');
  css.textContent =
    '.badge{display:none!important}html{scroll-behavior:auto!important;scrollbar-width:none}' +
    '::-webkit-scrollbar{display:none}';
  document.head.append(css);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const HERO_DWELL = 4500; // ms on the hero before scrolling
  const END_DWELL = 1600; // ms at the bottom
  const SPEED = 0.32; // viewport heights per second, going down
  const RETURN = 1400; // ms to glide back to the top
  const REAL_HOLD = 1800; // ms the real cursor keeps control after its last move

  let paused = false;
  let real = null;
  let realAt = 0;
  let ghost = { x: innerWidth * 0.5, y: innerHeight * 0.45 };
  let lastEl = null;

  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    const d = e.data;
    if (d.type === 'hm-pointer') {
      if (typeof d.x !== 'number') {
        real = null;
        return;
      }
      real = { x: d.x * innerWidth, y: d.y * innerHeight };
      realAt = performance.now();
    } else if (d.type === 'hm-pause') {
      paused = !!d.paused;
    }
  });

  const send = (x, y) => {
    const el = document.elementFromPoint(x, y) || document.body;
    const init = {
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
    };
    if (el !== lastEl) {
      if (lastEl) {
        lastEl.dispatchEvent(new PointerEvent('pointerout', { ...init, relatedTarget: el, pointerType: 'mouse' }));
        lastEl.dispatchEvent(new MouseEvent('mouseout', { ...init, relatedTarget: el }));
      }
      el.dispatchEvent(new PointerEvent('pointerover', { ...init, relatedTarget: lastEl, pointerType: 'mouse' }));
      el.dispatchEvent(new MouseEvent('mouseover', { ...init, relatedTarget: lastEl }));
      lastEl = el;
    }
    el.dispatchEvent(new PointerEvent('pointermove', { ...init, pointerType: 'mouse', isPrimary: true }));
    el.dispatchEvent(new MouseEvent('mousemove', init));
  };

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Scroll loop phases: 'hero' -> 'down' -> 'end' -> 'up' -> 'hero'
  let phase = 'hero';
  let phaseAt = performance.now();
  let upFrom = 0;
  let last = performance.now();
  let y = 0;

  const maxScroll = () =>
    Math.max(0, (document.scrollingElement || root).scrollHeight - innerHeight);

  const frame = (now) => {
    const dt = Math.min(64, now - last);
    last = now;
    if (paused || document.hidden) {
      phaseAt += dt;
      requestAnimationFrame(frame);
      return;
    }

    const max = maxScroll();
    const elapsed = now - phaseAt;
    if (phase === 'hero' && elapsed > HERO_DWELL && max > 0) {
      phase = 'down';
      phaseAt = now;
      y = scrollY;
    } else if (phase === 'down') {
      y += (SPEED * innerHeight * dt) / 1000;
      if (y >= max) {
        y = max;
        phase = 'end';
        phaseAt = now;
      }
      scrollTo(0, y);
    } else if (phase === 'end' && elapsed > END_DWELL) {
      phase = 'up';
      phaseAt = now;
      upFrom = scrollY;
    } else if (phase === 'up') {
      const t = Math.min(1, elapsed / RETURN);
      scrollTo(0, upFrom * (1 - ease(t)));
      if (t >= 1) {
        phase = 'hero';
        phaseAt = now;
      }
    }

    // Ghost cursor: a slow Lissajous path over the middle of the page.
    const s = now / 1000;
    const target =
      real && now - realAt < REAL_HOLD
        ? real
        : {
            x: innerWidth * (0.5 + 0.34 * Math.sin(s * 0.53)),
            y: innerHeight * (0.48 + 0.26 * Math.sin(s * 0.79 + 1.1)),
          };
    const k = real && now - realAt < REAL_HOLD ? 0.35 : 0.06;
    ghost.x += (target.x - ghost.x) * k;
    ghost.y += (target.y - ghost.y) * k;
    send(ghost.x, ghost.y);

    requestAnimationFrame(frame);
  };

  const start = () => requestAnimationFrame((t) => {
    last = t;
    phaseAt = t;
    frame(t);
  });
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
