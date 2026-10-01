/**
 * Hero collage: filter chips show only tiles in that category, and walkthrough
 * clips play over their stills while on screen. Clips load only after the page
 * has finished loading, and never under reduced motion or Data Saver.
 */
const root = document.querySelector<HTMLElement>('[data-collage]');
if (root) {
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-collage-filter]'));
  const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-cats]'));
  const collage = root.querySelector<HTMLElement>('.hero__collage');
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.collageFilter ?? 'all';
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      collage?.classList.toggle('is-filtered', filter !== 'all');
      for (const tile of tiles) {
        const cats = (tile.dataset.cats ?? '').split(' ');
        tile.hidden = filter !== 'all' && !cats.includes(filter);
      }
    });
  }

  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>('video[data-src]'));
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  if (videos.length && !calm && !saveData && 'IntersectionObserver' in window) {
    const start = () => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const video = entry.target as HTMLVideoElement;
            if (entry.isIntersecting) {
              if (!video.src && video.dataset.src) video.src = video.dataset.src;
              video.muted = true;
              void video.play().catch(() => {});
            } else {
              video.pause();
            }
          }
        },
        { rootMargin: '120px' },
      );
      for (const video of videos) {
        video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
        io.observe(video);
      }
    };
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(start, { timeout: 3000 });
      } else {
        window.setTimeout(start, 1500);
      }
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
  }
}

export {};
