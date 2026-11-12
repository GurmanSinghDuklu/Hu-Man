/**
 * The landing page's video, playlist, sound and fold button (components/landing/Landing.astro,
 * used by /start/ and /contact/). On /contact/ the intro (contact-intro.ts) may be covering the
 * page: the video then waits for its old-TV switch-on (`screenOn()`) before it starts.
 */
import './enquiry-form.ts';
import { screenOn } from './contact-intro-state';

const video = document.querySelector<HTMLVideoElement>('[data-lp-video]');
const playBtn = document.querySelector<HTMLButtonElement>('[data-lp-play]');
const soundBtn = document.querySelector<HTMLButtonElement>('[data-lp-sound]');

// ---- fold the boxes away (desktop) ----
const boxes = document.querySelector<HTMLElement>('[data-lp-boxes]');
const fold = document.querySelector<HTMLButtonElement>('[data-lp-fold]');
const foldLabel = document.querySelector<HTMLElement>('[data-lp-fold-label]');
const panels = document.getElementById('lp-panels');
if (boxes && fold && panels) {
  fold.hidden = false;
  const setFolded = (folded: boolean) => {
    boxes.classList.toggle('is-folded', folded);
    fold.setAttribute('aria-expanded', String(!folded));
    if (foldLabel) foldLabel.textContent = folded ? 'Show the form' : 'Hide the form';
    panels.inert = folded; // folded fields can't be tabbed into
  };
  fold.addEventListener('click', () => setFolded(!boxes.classList.contains('is-folded')));
  // Phones show the boxes below the video and have no fold button: never leave them folded.
  const phone = matchMedia('(max-width: 40rem)');
  phone.addEventListener('change', () => phone.matches && setFolded(false));
}

if (video && playBtn && soundBtn) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  let soundChosen = false; // the visitor used the sound button: never override their choice

  const showPlaying = () => {
    const playing = !video.paused;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', String(!playing));
  };
  const hint = document.querySelector<HTMLElement>('[data-lp-hint]');
  const hintText = document.querySelector<HTMLElement>('[data-lp-hint-text]');
  if (hintText && matchMedia('(hover: none)').matches)
    hintText.textContent = 'Tap anywhere for sound';
  const showSound = () => {
    soundBtn.textContent = video.muted ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    if (hint && !video.muted) hint.hidden = true;
  };
  video.addEventListener('play', showPlaying);
  video.addEventListener('pause', showPlaying);
  video.addEventListener('volumechange', showSound);

  // ---- the playlist: each video in turn, then from the top ----
  type Item = { src: string; w: number; h: number; label: string };
  const list = JSON.parse(video.dataset.playlist ?? '[]') as Item[];
  let index = 0;
  let preloader: HTMLVideoElement | null = null;
  const show = (i: number) => {
    const item = list[i];
    if (!item) return;
    index = i;
    video.removeAttribute('poster'); // the last frame stays up while the next one loads
    video.style.setProperty('--ar', `${item.w} / ${item.h}`);
    video.dataset.shape = item.h > item.w ? 'tall' : 'wide';
    video.setAttribute('aria-label', item.label);
    video.src = item.src;
    void video.play().catch(() => {});
  };
  video.addEventListener('ended', () => show((index + 1) % list.length));
  // Warm the next video's first seconds while this one finishes, so the handover is quick.
  video.addEventListener('timeupdate', () => {
    const next = list[(index + 1) % list.length];
    if (preloader || !next || list.length < 2 || !video.duration) return;
    if (video.currentTime < video.duration - 8) return;
    preloader = document.createElement('video');
    preloader.muted = true;
    preloader.preload = 'auto';
    preloader.src = next.src;
    video.addEventListener('ended', () => (preloader = null), { once: true });
  });

  /** Play with sound if the browser allows it; otherwise muted, with sound on the first gesture. */
  // Phones and tablets: start muted (always allowed there; an attempt with sound is often
  // refused and on some Android browsers leaves the video paused), sound on at the first tap.
  // Desktop: try with sound first.
  const touch = matchMedia('(hover: none)').matches;
  const start = async () => {
    let withSound = false;
    if (!touch) {
      video.muted = false;
      withSound = await video.play().then(
        () => true,
        () => false,
      );
    }
    if (!withSound) {
      video.muted = true;
      await video.play().catch(() => {});
      if (hint) hint.hidden = false;
      // Unmute only on a real tap, click or key press. Unmuting without one (e.g. the
      // pointerdown that starts a scroll on a phone) makes Chrome pause the video.
      const unmute = (event: Event) => {
        if (soundChosen || (event.target as Element | null)?.closest('[data-lp-sound]')) return;
        const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } })
          .userActivation;
        if (activation && !activation.isActive) return;
        video.muted = false;
        if (video.paused) void video.play().catch(() => {});
        gestures.forEach((g) => removeEventListener(g, unmute, true));
      };
      const gestures = ['click', 'keydown', 'touchend'];
      gestures.forEach((g) => addEventListener(g, unmute, true));
    }
    showPlaying();
    showSound();
  };

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      if (video.currentTime === 0 && !video.played.length) void start();
      else void video.play();
    } else video.pause();
  });
  soundBtn.addEventListener('click', () => {
    soundChosen = true;
    if (hint) hint.hidden = true;
    video.muted = !video.muted;
    if (!video.muted && video.paused) void video.play();
  });

  if (reduce || saveData) {
    video.muted = true;
    showPlaying();
    showSound();
  } else {
    // On /contact/ the intro may still be playing: start as its old-TV switch-on begins.
    void screenOn().then(start);
  }
}

// ---- /contact/: a pricing button's ?tier= rides along with the short form too ----
const tierField = document.querySelector<HTMLInputElement>('[data-lp-tier]');
const tier = new URLSearchParams(location.search).get('tier');
if (tierField && tier) tierField.value = tier.slice(0, 60);
