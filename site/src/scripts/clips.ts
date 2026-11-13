/**
 * Plays the site's reel clips (components/Clip.astro). Nothing loads until the page has settled;
 * then each clip's file loads as its frame comes near the screen, and it plays only while on
 * screen. At most three play at once (the most visible ones), so a page with many clips stays
 * smooth. Reduced motion or Data Saver: nothing loads, the stills stay.
 */
const MAX_PLAYING = 3;

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  ?.saveData;

function start(): void {
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-clip-src]')];
  if (!videos.length) return;

  const ratio = new Map<HTMLVideoElement, number>();

  const choose = () => {
    const wanted = new Set(
      [...ratio.entries()]
        .filter(([v, r]) => r > 0 && v.src && !document.hidden)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_PLAYING)
        .map(([v]) => v),
    );
    for (const v of videos) {
      if (wanted.has(v)) {
        if (v.paused) void v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    }
  };

  for (const v of videos) {
    v.addEventListener('playing', () => v.parentElement?.classList.add('is-playing'), {
      once: true,
    });
  }

  // Load each file once its frame is within a screen of the window.
  const loader = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target as HTMLVideoElement;
        loader.unobserve(v);
        v.src = v.dataset.clipSrc!;
        v.preload = 'auto';
        choose();
      }
    },
    { rootMargin: '100% 0px' },
  );

  const watcher = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratio.set(e.target as HTMLVideoElement, e.intersectionRatio);
      choose();
    },
    { threshold: [0, 0.15, 0.35, 0.6, 0.9] },
  );

  for (const v of videos) {
    loader.observe(v);
    watcher.observe(v);
  }
  document.addEventListener('visibilitychange', choose);
}

if (!reduce && !saveData) {
  const go = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2500 });
    else setTimeout(start, 1200);
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
}
