/**
 * The hero video (components/HeroVideo.astro). The file starts loading once the page has loaded,
 * then plays muted on a loop from the poster's moment, and pauses while the hero is off screen.
 * Pause and Sound buttons; browsers allow sound because pressing the button is a user gesture.
 * Reduced motion or Data Saver: nothing loads or plays until Play is pressed.
 */
const fig = document.querySelector<HTMLElement>('[data-hv]');

if (fig) {
  const video = fig.querySelector<HTMLVideoElement>('video')!;
  const playBtn = fig.querySelector<HTMLButtonElement>('[data-hv-play]')!;
  const soundBtn = fig.querySelector<HTMLButtonElement>('[data-hv-sound]')!;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const auto =
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !nav.connection?.saveData;

  // `wanted`: playing unless the visitor paused it (or, without autoplay, until they press Play).
  let wanted = auto;
  let onScreen = true;

  const load = () => {
    if (video.src) return;
    video.src = video.dataset.hvSrc!;
    video.preload = 'auto';
    const start = Number(video.dataset.hvStart ?? 0);
    if (start > 0) {
      video.addEventListener('loadedmetadata', () => (video.currentTime = start), { once: true });
    }
  };

  const sync = () => {
    fig.classList.toggle('is-paused', !wanted);
    playBtn.setAttribute('aria-label', wanted ? 'Pause video' : 'Play video');
    fig.classList.toggle('has-sound', !video.muted);
    soundBtn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    if (wanted && onScreen) {
      load();
      void video.play().catch(() => {
        // Refused (rare when muted): show it as paused so Play is one press away.
        wanted = false;
        fig.classList.add('is-paused');
        playBtn.setAttribute('aria-label', 'Play video');
      });
    } else if (!video.paused) {
      video.pause();
    }
  };

  playBtn.addEventListener('click', () => {
    wanted = !wanted;
    sync();
  });
  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) wanted = true;
    sync();
  });

  new IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    if (video.src || !auto) sync();
  }).observe(fig);

  // Show the right buttons at once; start loading only after the page has loaded.
  fig.classList.toggle('is-paused', !wanted);
  playBtn.setAttribute('aria-label', wanted ? 'Pause video' : 'Play video');
  if (auto) {
    const go = () => sync();
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }
}
