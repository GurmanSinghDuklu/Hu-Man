/**
 * Effects that follow the mouse, on every page. Mouse and trackpad only; never under reduced
 * motion (index.ts decides). One rAF loop that sleeps once everything has settled.
 * - Magnetic buttons: buttons and calls to action lean towards the pointer (at most 8px).
 * - Tilting cards: cards tilt up to 5 degrees in 3D under the pointer, with a soft light that
 *   follows it (.tilt-glare, base.css). Wide rows (over 720px) don't tilt: it reads as a wobble.
 * Elements that already carry their own transform or translate are left alone, so nothing that is
 * positioned or animated by a transform is ever moved.
 */
const MAGNET = '.btn, .pill-btn, .lp__cta, .cwall__next-btn, .ticker__toggle';
const TILT = [
  '[data-pin-steps] > *',
  '.card',
  '.cards__grid > *',
  '.ptiers__list > li',
  '.pextras__list > li',
  '.faq__item',
  '.next__card',
  '.contact__other',
  '.hcard__list > li',
].join(', ');

interface Moving {
  el: HTMLElement;
  x: number; // current
  y: number;
  tx: number; // target
  ty: number;
  kind: 'magnet' | 'tilt';
  glare?: HTMLElement;
}

const free = (el: HTMLElement, prop: 'transform' | 'translate') => {
  const value = getComputedStyle(el)[prop];
  return value === 'none' || value === '' || el.dataset.fxOwned === '1';
};

export function startPointerFx(): void {
  const moving = new Map<HTMLElement, Moving>();
  let magnetEl: HTMLElement | null = null;
  let tiltEl: HTMLElement | null = null;
  let raf = 0;

  const entry = (el: HTMLElement, kind: Moving['kind']): Moving => {
    let m = moving.get(el);
    if (!m) {
      m = { el, x: 0, y: 0, tx: 0, ty: 0, kind };
      if (kind === 'tilt') {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        m.glare = document.createElement('span');
        m.glare.className = 'tilt-glare';
        m.glare.setAttribute('aria-hidden', 'true');
        el.append(m.glare);
      }
      el.dataset.fxOwned = '1';
      moving.set(el, m);
    }
    return m;
  };

  const frame = () => {
    raf = 0;
    let busy = false;
    for (const m of moving.values()) {
      m.x += (m.tx - m.x) * 0.18;
      m.y += (m.ty - m.y) * 0.18;
      const settled = Math.abs(m.tx - m.x) < 0.01 && Math.abs(m.ty - m.y) < 0.01;
      if (m.kind === 'magnet') {
        m.el.style.translate =
          settled && m.tx === 0 && m.ty === 0 ? '' : `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      } else {
        m.el.style.transform =
          settled && m.tx === 0 && m.ty === 0
            ? ''
            : `perspective(900px) rotateX(${(-m.y).toFixed(2)}deg) rotateY(${m.x.toFixed(2)}deg)`;
      }
      if (!settled) busy = true;
    }
    if (busy) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const release = (el: HTMLElement | null) => {
    const m = el && moving.get(el);
    if (!m) return;
    m.tx = 0;
    m.ty = 0;
    m.glare?.classList.remove('is-on');
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const target = e.target instanceof Element ? e.target : null;

      const btn = target?.closest<HTMLElement>(MAGNET) ?? null;
      if (btn !== magnetEl) release(magnetEl);
      magnetEl = btn && free(btn, 'translate') ? btn : null;
      if (magnetEl) {
        const r = magnetEl.getBoundingClientRect();
        const m = entry(magnetEl, 'magnet');
        m.tx = Math.max(-8, Math.min(8, (e.clientX - (r.left + r.width / 2)) * 0.22));
        m.ty = Math.max(-8, Math.min(8, (e.clientY - (r.top + r.height / 2)) * 0.3));
      }

      const card = target?.closest<HTMLElement>(TILT) ?? null;
      if (card !== tiltEl) release(tiltEl);
      tiltEl =
        card && card.getBoundingClientRect().width <= 720 && free(card, 'transform') ? card : null;
      if (tiltEl) {
        const r = tiltEl.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const m = entry(tiltEl, 'tilt');
        m.tx = (px - 0.5) * 10;
        m.ty = (py - 0.5) * 10;
        m.glare?.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        m.glare?.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
        m.glare?.classList.add('is-on');
      }
      wake();
    },
    { passive: true },
  );

  const releaseAll = () => {
    release(magnetEl);
    release(tiltEl);
    magnetEl = tiltEl = null;
    wake();
  };
  document.documentElement.addEventListener('pointerleave', releaseAll);
  window.addEventListener('blur', releaseAll);
}
