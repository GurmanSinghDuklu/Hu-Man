/**
 * Live concept wall (ConceptWall.astro). Mounts an iframe of each concept in preview mode while its
 * tile is near the viewport (at most MAX_LIVE at once, the most visible win), unmounts it when it
 * leaves, scales the 1440x900 / 390x844 page to the tile, forwards the cursor into the iframe and
 * drifts the columns at different speeds while the page scrolls.
 * Nothing mounts under reduced motion, Data Saver or on very small screens with coarse pointers.
 */

const SPEEDS = [0, -0.07]; // column drift, as a share of the distance scrolled into the wall

type Tile = {
  el: HTMLElement;
  screen: HTMLElement;
  mount: HTMLElement;
  hit: HTMLAnchorElement;
  src: string;
  w: number;
  h: number;
  ratio: number;
  frame: HTMLIFrameElement | null;
  dropTimer: number;
};

export function initConceptWall() {
  const wall = document.querySelector<HTMLElement>('[data-cwall]');
  if (!wall) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = !!conn?.saveData;
  const small = matchMedia('(max-width: 47.99rem)').matches;
  const live = !reduce && !saveData && 'IntersectionObserver' in window;
  const MAX_LIVE = small ? 2 : 4;

  if (!live) {
    wall.querySelector<HTMLElement>('[data-cwall-static]')?.removeAttribute('hidden');
    return;
  }

  const tiles: Tile[] = [...wall.querySelectorAll<HTMLElement>('[data-ctile]')].map((el) => ({
    el,
    screen: el.querySelector<HTMLElement>('[data-ctile-screen]')!,
    mount: el.querySelector<HTMLElement>('[data-ctile-mount]')!,
    hit: el.querySelector<HTMLAnchorElement>('[data-ctile-hit]')!,
    src: el.dataset.src!,
    w: Number(el.dataset.w),
    h: Number(el.dataset.h),
    ratio: 0,
    frame: null,
    dropTimer: 0,
  }));

  const fit = (t: Tile) => {
    if (!t.frame) return;
    const s = t.screen.clientWidth / t.w;
    t.frame.style.transform = `scale(${s})`;
  };

  const mount = (t: Tile) => {
    clearTimeout(t.dropTimer);
    if (t.frame) return;
    const f = document.createElement('iframe');
    f.src = t.src;
    f.width = String(t.w);
    f.height = String(t.h);
    f.style.width = `${t.w}px`;
    f.style.height = `${t.h}px`;
    f.tabIndex = -1;
    f.title = `Live preview: ${t.el.querySelector('h2')?.textContent?.trim() ?? 'concept'}`;
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('inert', '');
    f.setAttribute('referrerpolicy', 'same-origin');
    f.addEventListener('load', () => {
      // Give the concept a beat to paint its first frame before fading it over the poster.
      setTimeout(() => t.frame === f && t.el.classList.add('is-live'), 350);
    });
    t.frame = f;
    t.mount.append(f);
    fit(t);
  };

  const unmount = (t: Tile) => {
    if (!t.frame || t.dropTimer) return;
    t.el.classList.remove('is-live');
    t.dropTimer = window.setTimeout(() => {
      t.frame?.remove();
      t.frame = null;
      t.dropTimer = 0;
    }, 700);
  };

  const reconcile = () => {
    const ranked = tiles.filter((t) => t.ratio > 0).sort((a, b) => b.ratio - a.ratio);
    const keep = new Set(ranked.slice(0, MAX_LIVE));
    for (const t of tiles) {
      if (keep.has(t)) {
        if (t.dropTimer) {
          clearTimeout(t.dropTimer);
          t.dropTimer = 0;
          if (t.frame) t.el.classList.add('is-live');
        }
        mount(t);
      } else unmount(t);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const t = tiles.find((x) => x.screen === e.target);
        if (t) t.ratio = e.isIntersecting ? Math.max(0.001, e.intersectionRatio) : 0;
      }
      reconcile();
    },
    { rootMargin: '20% 0px', threshold: [0, 0.15, 0.35, 0.6, 0.85, 1] },
  );

  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const t = tiles.find((x) => x.screen === e.target);
      if (t) fit(t);
    }
  });

  // Cursor into the concept: normalised position inside the tile.
  for (const t of tiles) {
    const post = (msg: object) => t.frame?.contentWindow?.postMessage(msg, location.origin);
    t.hit.addEventListener('pointermove', (e) => {
      const r = t.screen.getBoundingClientRect();
      post({
        type: 'hm-pointer',
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      });
    });
    t.hit.addEventListener('pointerleave', () => post({ type: 'hm-pointer', x: null }));
  }

  const start = () => {
    for (const t of tiles) {
      io.observe(t.screen);
      ro.observe(t.screen);
    }
  };
  // Live previews wait for the visitor's first scroll, pointer move or key press (then an idle moment),
  // so they never compete with the page's first paint or cost data for someone who just glances.
  let started = false;
  const kick = () => {
    if (started) return;
    started = true;
    for (const ev of ['scroll', 'pointermove', 'pointerdown', 'keydown'] as const)
      removeEventListener(ev, kick);
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 300);
  };
  for (const ev of ['scroll', 'pointermove', 'pointerdown', 'keydown'] as const)
    addEventListener(ev, kick, { passive: true });
  // The wall is the page's hero: with a mouse, start as soon as the page is idle, no input needed.
  if (matchMedia('(pointer: fine)').matches) addEventListener('load', kick, { once: true });

  // Pause previews while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    for (const t of tiles)
      t.frame?.contentWindow?.postMessage(
        { type: 'hm-pause', paused: document.hidden },
        location.origin,
      );
  });

  // Column drift.
  const cols = [...wall.querySelectorAll<HTMLElement>('[data-cwall-col]')];
  const wide = matchMedia('(min-width: 48rem)');
  let ticking = false;
  const drift = () => {
    ticking = false;
    if (!wide.matches) {
      for (const c of cols) c.style.translate = '';
      return;
    }
    // Distance scrolled since the wall's top entered the viewport: no drift before that, so the
    // columns never ride up over the intro text.
    const r = wall.getBoundingClientRect();
    const d = Math.max(0, innerHeight - r.top);
    cols.forEach((c, i) => {
      c.style.translate = `0 ${(d * (SPEEDS[i] ?? 0)).toFixed(1)}px`;
    });
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(drift);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  drift();
}
