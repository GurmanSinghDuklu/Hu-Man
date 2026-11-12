/**
 * The /contact/ intro (components/landing/ContactIntro.astro): the contact page holds for a moment,
 * cracks into tiles on the site's grid, the tiles fall into black, the screen stays black for a
 * beat, then the landing switches on like an old TV (a dot, a bright line, the picture springing
 * open from it) and its video starts. Only transform and opacity move. Scrolling stays locked until the landing
 * shows; a click, Escape or Enter skips straight to it (a swipe or wheel does nothing).
 *
 * Each tile is a live copy of the cover page, shifted into place, so the pieces look exactly like
 * the page at any window size with no screenshot to download. CSS animations in the copies (the
 * flowing logo, the collage) are frozen at the same moment as the original, so the seams never
 * show a jump.
 */
import { INTRO_CLASS, INTRO_DONE, INTRO_ON, introPlaying } from './contact-intro-state';

const root = document.documentElement;
const cover = document.querySelector<HTMLElement>('[data-intro]');
const page = cover?.querySelector<HTMLElement>('[data-intro-page]');

/** How long the contact page shows before it breaks, counted from the start of the page load. */
const HOLD_MS = 1300;
/** Seconds of black between the last tile falling and the TV switching on. */
const BLACK = 1.6;
/** Tiles at most (each is a copy of the page): fewer on phones, which have less to spare. */
const maxTiles = (width: number) => (width < 640 ? 32 : 48);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

if (introPlaying() && cover && page) void play(cover, page);
else cover?.remove();

async function play(cover: HTMLElement, page: HTMLElement): Promise<void> {
  root.dataset.introRunning = '';
  const main = document.getElementById('main');
  if (main) main.inert = true;
  window.scrollTo(0, 0);

  // ---- no scrolling: overflow is hidden on <html>; touch and keys are stopped here too ----
  const keys = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
  const stopScroll = (event: Event) => event.preventDefault();
  const stopKeys = (event: KeyboardEvent) => {
    if (keys.has(event.key)) event.preventDefault();
    if (event.key === 'Escape' || event.key === 'Enter') skip();
  };
  window.addEventListener('wheel', stopScroll, { passive: false });
  window.addEventListener('touchmove', stopScroll, { passive: false });
  window.addEventListener('keydown', stopKeys);
  window.addEventListener('click', skip);

  let on = false;
  let finished = false;
  let timeline: gsap.core.Timeline | null = null;

  /** The TV switches on: the landing shows through and its video starts (scripts/landing.ts). */
  function switchOn(): void {
    if (on) return;
    on = true;
    root.classList.add('crt-on');
    cover.classList.add('is-on');
    if (main) main.inert = false;
    window.dispatchEvent(new Event(INTRO_ON));
  }

  /** The intro is over: unlock scrolling and let Lenis and the scroll effects start. */
  function finish(): void {
    if (finished) return;
    finished = true;
    switchOn();
    window.removeEventListener('wheel', stopScroll);
    window.removeEventListener('touchmove', stopScroll);
    window.removeEventListener('keydown', stopKeys);
    window.removeEventListener('click', skip);
    root.classList.remove(INTRO_CLASS, 'crt-on');
    cover.remove();
    delete root.dataset.introRunning;
    window.dispatchEvent(new Event(INTRO_DONE));
  }

  function skip(): void {
    if (timeline) timeline.progress(1);
    else finish();
  }

  try {
    // The tiles are built while the contact page is still on show.
    await Promise.race([document.fonts.ready, wait(800)]);
    const [{ gsap }, tiles] = await Promise.all([
      import('gsap'),
      buildTiles(cover, page),
      wait(HOLD_MS - performance.now()),
    ]);
    if (finished) return;
    await showTiles(page, tiles);
    if (finished) return;
    timeline = animate(gsap, tiles, cover, switchOn, finish);
  } catch {
    finish();
  }
}

interface Tiles {
  els: HTMLElement[];
  cols: number;
  rows: number;
  size: number;
  height: number;
}

/**
 * Cuts the page into square tiles (two grid units on desktop, one on smaller screens) while the
 * contact page is still on show. The tiles stay hidden and are built a row per frame, so no single
 * task holds up the page; `showTiles` swaps them in.
 */
async function buildTiles(cover: HTMLElement, page: HTMLElement): Promise<Tiles> {
  const width = cover.clientWidth;
  const height = cover.clientHeight;

  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;width:var(--u);height:0';
  page.append(probe);
  const unit = probe.offsetWidth || width / 16;
  probe.remove();

  // Nobody sees the closed menus and other hidden parts: leave them out of every copy.
  // (HTML only: SVG gradient and mask definitions report no box but are still in use.)
  page.querySelectorAll('*').forEach((el) => {
    if (el instanceof HTMLElement && el.isConnected && getComputedStyle(el).display === 'none')
      el.remove();
  });
  const master = page.cloneNode(true) as HTMLElement;
  master.removeAttribute('data-intro-page');
  master.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  Object.assign(master.style, { width: `${width}px`, height: `${height}px` });

  let size = width >= 1024 ? unit * 2 : unit;
  size = Math.max(size, Math.sqrt((width * height) / maxTiles(width)));
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);

  const layer = document.createElement('div');
  layer.className = 'intro__tiles';
  cover.append(layer);
  const els: HTMLElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement('div');
      tile.className = 'intro__tile';
      Object.assign(tile.style, {
        left: `${c * size}px`,
        top: `${r * size}px`,
        width: `${size + 0.5}px`,
        height: `${size + 0.5}px`,
      });
      const copy = master.cloneNode(true) as HTMLElement;
      Object.assign(copy.style, { left: `${-c * size}px`, top: `${-r * size}px` });
      tile.append(copy);
      layer.append(tile);
      els.push(tile);
    }
    await frame();
  }

  // Wait for the copies' images, so no tile shows a blank square.
  const images = [...layer.querySelectorAll('img')];
  await Promise.race([Promise.all(images.map((img) => img.decode().catch(() => {}))), wait(400)]);

  return { els, cols, rows, size, height };
}

/**
 * Swaps the tiles in for the page. Every CSS animation (the flowing logo, the collage) is frozen at
 * the page's current moment, in the page and in each copy, so the seams never show a jump.
 */
async function showTiles(page: HTMLElement, { els }: Tiles): Promise<void> {
  const originals = page.getAnimations({ subtree: true });
  originals.forEach((a) => a.pause());
  els.forEach((tile) => {
    tile.getAnimations({ subtree: true }).forEach((a, i) => {
      a.pause();
      const time = originals[i]?.currentTime;
      if (time != null) a.currentTime = time;
    });
  });
  els[0]?.parentElement?.classList.add('is-ready');
  await frame();
  page.style.visibility = 'hidden';
}

function animate(
  gsap: typeof import('gsap').gsap,
  { els, cols, rows, size, height }: Tiles,
  cover: HTMLElement,
  switchOn: () => void,
  finish: () => void,
): gsap.core.Timeline {
  const random = gsap.utils.random;

  // Each tile's drop delay: from the centre outwards, with a little chance in it.
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const far = Math.hypot(cx, cy) || 1;
  const delays = els.map((_, i) => {
    const d = Math.hypot((i % cols) - cx, Math.floor(i / cols) - cy) / far;
    return d * 0.75 + random(0, 0.22);
  });
  const lastDrop = Math.max(...delays);

  const tl = gsap.timeline({ onComplete: finish });

  // 1. Crack: every tile shrinks a hair, so black seams open along the grid, and twitches.
  tl.to(els, {
    scale: 0.968,
    rotation: () => random(-1.4, 1.4),
    x: () => random(-2.5, 2.5),
    y: () => random(-2.5, 2.5),
    duration: 0.24,
    ease: 'power3.out',
    stagger: { amount: 0.16, from: 'center', grid: [rows, cols] },
  });
  // 2. A short shudder before they go.
  tl.to(els, {
    x: '+=random(-3, 3)',
    y: '+=random(-2, 2)',
    duration: 0.05,
    repeat: 3,
    yoyo: true,
    ease: 'none',
  });

  // 3. Fall: each tile drops off the bottom of the screen, turning and shrinking into the black.
  const fall = 'fall';
  tl.addLabel(fall, '+=0.05');
  tl.to(
    els,
    {
      y: () => height + size * 1.5 + random(0, height * 0.35),
      x: () => random(-70, 70),
      rotation: () => random(-38, 38),
      scale: () => random(0.62, 0.86),
      duration: () => random(0.95, 1.3),
      ease: 'power2.in',
      stagger: (i: number) => delays[i] ?? 0,
    },
    fall,
  );
  tl.to(
    els,
    {
      opacity: 0.25,
      duration: 1.1,
      ease: 'power3.in',
      stagger: (i: number) => delays[i] ?? 0,
    },
    fall,
  );

  // 4. Black for a beat or two, then the TV switches on.
  const tv = 'tv';
  const fallen = `${fall}+=${lastDrop + 1.3}`;
  // Every tile is off the screen by now: drop them, so the black and the switch-on cost nothing.
  tl.set(els, { display: 'none' }, fallen);
  tl.addLabel(tv, `${fallen}+=${BLACK}`);
  switchOnTv(gsap, tl, tv, cover, switchOn);
  return tl;
}

/**
 * The old-TV switch-on, without the static: a dot of light in the middle of the black, stretched
 * into a thin bright line, then the picture (the landing screen, squashed to that line) springs
 * open top and bottom under a white flash that fades as it settles. The white beam is one
 * full-screen element scaled down, so only transform and opacity change.
 */
function switchOnTv(
  gsap: typeof import('gsap').gsap,
  tl: gsap.core.Timeline,
  at: string,
  cover: HTMLElement,
  switchOn: () => void,
): void {
  const screen = document.querySelector<HTMLElement>('.lp');
  const beam = cover.querySelector<HTMLElement>('[data-intro-beam]');
  const skipButton = cover.querySelector<HTMLElement>('[data-intro-skip]');
  const height = window.innerHeight;
  const line = 3 / height; // the bright line, about 3px tall
  const dot = 8 / window.innerWidth; // the first dot, about 8px wide

  if (skipButton) tl.to(skipButton, { opacity: 0, duration: 0.3 }, `${at}-=0.4`);
  if (!screen || !beam) {
    tl.call(switchOn, [], at);
    return;
  }

  // The picture waits squashed to a line in the middle of the window, out of sight.
  tl.set(screen, { scaleY: 0.004, opacity: 0, transformOrigin: `50% ${height / 2}px` }, at);
  // A dot of light, then the line stretching out to both edges.
  tl.fromTo(
    beam,
    { scaleX: dot, scaleY: line, opacity: 0 },
    { opacity: 1, duration: 0.08, ease: 'none' },
    at,
  );
  tl.to(beam, { scaleX: 1, duration: 0.24, ease: 'power4.out' }, `${at}+=0.16`);
  // The picture opens from the line, overshooting a touch the way old tubes did, under a flash.
  const open = `${at}+=0.5`;
  tl.call(switchOn, [], open);
  tl.to(screen, { opacity: 1, duration: 0.05, ease: 'none' }, open);
  tl.to(screen, { scaleY: 1, duration: 0.55, ease: 'back.out(1.6)', clearProps: 'all' }, open);
  // The flash opens with the picture but fades fast, so the picture is seen springing open.
  tl.to(beam, { scaleY: 0.6, duration: 0.4, ease: 'expo.out' }, open);
  tl.fromTo(beam, { opacity: 1 }, { opacity: 0, duration: 0.32, ease: 'power3.out' }, open);
}
