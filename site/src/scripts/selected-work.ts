/**
 * Selected work (components/SelectedWork.astro): choosing a project (click, tap, hover with a
 * mouse, or arrow keys between the names) shows its window. Never driven by scrolling.
 *
 * The chosen window's walkthrough loads only once the section is near the screen, plays only while
 * it is on screen, and pauses when another project is chosen. Under reduced motion or Data Saver
 * nothing loads or plays: the posters stay.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  ?.saveData;
const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');

for (const root of document.querySelectorAll<HTMLElement>('[data-sw]')) {
  const picks = [...root.querySelectorAll<HTMLButtonElement>('[data-sw-pick]')];
  const medias = [...root.querySelectorAll<HTMLElement>('[data-sw-media]')];
  let current = picks[0]?.dataset.swPick ?? '';
  let onScreen = false;

  const videoOf = (id: string) =>
    root.querySelector<HTMLVideoElement>(`[data-sw-media="${id}"] video`);

  const play = () => {
    for (const media of medias) {
      const video = media.querySelector('video');
      if (!video) continue;
      const wanted = media.dataset.swMedia === current && onScreen && !reduce && !saveData;
      if (wanted) {
        if (!video.src && video.dataset.src) video.src = video.dataset.src;
        void video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }
  };

  const choose = (id: string) => {
    if (id === current) return;
    current = id;
    for (const pick of picks) {
      const on = pick.dataset.swPick === id;
      pick.setAttribute('aria-pressed', String(on));
      pick.closest('.sw__item')?.classList.toggle('is-active', on);
    }
    for (const media of medias) media.classList.toggle('is-active', media.dataset.swMedia === id);
    const video = videoOf(id);
    if (video && video.currentTime > 0) video.currentTime = 0;
    play();
  };

  picks.forEach((pick, i) => {
    const id = pick.dataset.swPick ?? '';
    pick.addEventListener('click', () => choose(id));
    pick.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && mouse.matches) choose(id);
    });
    pick.addEventListener('keydown', (event) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = picks[(i + step + picks.length) % picks.length];
      next?.focus();
      if (next?.dataset.swPick) choose(next.dataset.swPick);
    });
  });

  new IntersectionObserver(
    ([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      play();
    },
    { rootMargin: '120px 0px' },
  ).observe(root);
}

export {};
