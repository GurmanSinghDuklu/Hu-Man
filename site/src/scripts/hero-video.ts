/**
 * The hero video (components/HeroVideo.astro). The file starts loading once the page has loaded,
 * then plays muted on a loop from the poster's moment, and pauses while the hero is off screen.
 * Pause and Sound buttons; browsers allow sound because pressing the button is a user gesture.
 * Reduced motion or Data Saver: nothing loads or plays until Play is pressed.
 */
import { INTRO_KEYS, introWanted, runIntro } from './hero-intro';
import { runCvIntro } from './hero-intro-cv';
import { runReceiptIntro } from './hero-intro-receipt';

const fig = document.querySelector<HTMLElement>('[data-hv]');

if (fig) {
  const video = fig.querySelector<HTMLVideoElement>('video')!;
  const playBtn = fig.querySelector<HTMLButtonElement>('[data-hv-play]')!;
  const soundBtn = fig.querySelector<HTMLButtonElement>('[data-hv-sound]')!;
  const cue = fig.querySelector<HTMLButtonElement>('[data-hv-cue]')!;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  const auto =
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !nav.connection?.saveData;

  // `wanted`: playing unless the visitor paused it (or, without autoplay, until they press Play).
  let wanted = auto;
  let onScreen = true;
  // `holding`: the opening (About or Portfolio) are still playing; the video starts when they end.
  let holding = false;

  const load = () => {
    if (video.src) return;
    video.src = video.dataset.hvSrc!;
    video.preload = 'auto';
    const start = Number(video.dataset.hvStart ?? 0);
    if (start > 0) {
      video.addEventListener('loadedmetadata', () => (video.currentTime = start), { once: true });
    }
  };

  // The "Click here for audio" pop-up: appears once the video is really playing muted, goes after
  // 14 s, when sound is on, or when the video is paused. Once dismissed it stays away this visit.
  let cueDone = false;
  let cueTimer = 0;
  const hideCue = (done = false) => {
    cue.hidden = true;
    window.clearTimeout(cueTimer);
    if (done) cueDone = true;
  };
  video.addEventListener('playing', () => {
    if (cueDone || !video.muted || !cue.hidden) return;
    cue.hidden = false;
    cueTimer = window.setTimeout(() => hideCue(true), 14000);
  });
  video.addEventListener('pause', () => hideCue());
  cue.addEventListener('click', () => soundBtn.click());

  const sync = () => {
    fig.classList.toggle('is-paused', !wanted);
    playBtn.setAttribute('aria-label', wanted ? 'Pause video' : 'Play video');
    fig.classList.toggle('has-sound', !video.muted);
    if (!video.muted) hideCue(true);
    soundBtn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    if (wanted && onScreen) {
      load();
      if (holding) return;
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

  // A page's opening runs over the frame first: 'tiles' (About), 'cv' (Portfolio) or 'receipt' (Pricing). Never under
  // reduced motion or Data Saver, and once per browser session for each.
  const variant =
    fig.dataset.hvIntro === 'cv' ? 'cv' : fig.dataset.hvIntro === 'receipt' ? 'receipt' : 'tiles';
  if (auto && fig.hasAttribute('data-hv-intro') && introWanted(INTRO_KEYS[variant])) {
    const frame = fig.querySelector<HTMLElement>('.hv__frame');
    if (frame) {
      holding = true;
      const run =
        variant === 'cv'
          ? runCvIntro(frame)
          : variant === 'receipt'
            ? runReceiptIntro(frame)
            : runIntro(frame, video);
      void run
        .catch(() => undefined)
        .then(() => {
          holding = false;
          sync();
        });
    }
  }

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
