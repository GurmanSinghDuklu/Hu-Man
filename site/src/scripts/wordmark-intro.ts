/**
 * Hero wordmark loop, Spider-Verse misprint style: every 2 s HU/MAN glitches
 * into the next alternate typeface (plates slip, strips tear, ~12 fps stutter).
 * After the last one it glitches back to the brand logo and holds it, clean,
 * for 30 s, then runs again. Pauses while off screen or in a hidden tab.
 * Reduced motion: the static brand logo only.
 *
 * Flash safety (WCAG 2.3.1): each glitch swaps the style at most three times,
 * and glitches are 2 s apart, so never more than three flashes in a second.
 */
const STEP_MS = 2000; // one alternate style, glitch included
const FRAME_MS = 83; // ~12 fps, animated "on twos"
const GLITCH_FRAMES = 6;
const FINAL_GLITCH_FRAMES = 10;
const INTRO_HOLD_MS = 1500; // brand logo before the first glitch
const LOGO_HOLD_MS = 30000; // clean brand logo after the run
const FIT_WIDTH = 0.86; // share of the column the word may fill
const FIT_HEIGHT = 1.3; // multiple of the stage height a glyph line may fill

const root = document.querySelector<HTMLElement>('[data-wordmark]');

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const em = (n: number) => `${n.toFixed(3)}em`;

function run(el: HTMLElement): void {
  const count = Number(el.dataset.styles) || 0;
  const stage = el.querySelector<HTMLElement>('.wm__stage');
  const measure = el.querySelector<HTMLElement>('[data-wordmark-measure]');
  const strips = [...el.querySelectorAll<HTMLElement>('[data-wordmark-strip]')];
  if (!stage || !measure) return;

  // Scale the current style so every typeface fills the column about equally.
  const fit = () => {
    const w = measure.offsetWidth;
    const h =
      measure.offsetHeight * Number(getComputedStyle(el).getPropertyValue('--stretch') || 1);
    if (!w || !h) return;
    const scale = Math.min(
      (stage.clientWidth * FIT_WIDTH) / w,
      (stage.clientHeight * FIT_HEIGHT) / h,
    );
    el.style.setProperty('--fit', scale.toFixed(3));
  };

  // 0 = brand logo, 1..count = alternate styles.
  const setStyle = (n: number) => {
    if (n === 0) delete el.dataset.style;
    else el.dataset.style = String(n);
    fit();
  };

  new ResizeObserver(fit).observe(stage);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void document.fonts?.ready.then(fit);
    return;
  }

  // Only animate while the wordmark is on screen and the tab is visible.
  let onScreen = true;
  let wake: (() => void) | null = null;
  const active = () => onScreen && !document.hidden;
  const resumeIfActive = () => {
    if (active() && wake) {
      wake();
      wake = null;
    }
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    resumeIfActive();
  }).observe(el);
  document.addEventListener('visibilitychange', resumeIfActive);
  const whenActive = () =>
    active() ? Promise.resolve() : new Promise<void>((resolve) => (wake = resolve));
  const pause = async (ms: number) => {
    await wait(ms);
    await whenActive();
  };

  const settle = () => {
    for (const v of ['--jx', '--jy', '--cx', '--cy', '--mx', '--my', '--yx', '--yy']) {
      el.style.setProperty(v, '0em');
    }
    el.style.setProperty('--sk', '0deg');
    el.style.setProperty('--sy', '1');
    strips.forEach((strip) => (strip.style.transform = ''));
  };

  // One stuttered frame: random plate slip, torn strips, jolt of the whole word.
  const frame = (power: number) => {
    const s = el.style;
    const p = (n: number) => em(rand(-n, n) * power);
    s.setProperty('--cx', p(0.06));
    s.setProperty('--cy', p(0.02));
    s.setProperty('--mx', p(0.06));
    s.setProperty('--my', p(0.02));
    s.setProperty('--yx', p(0.04));
    s.setProperty('--yy', p(0.03));
    s.setProperty('--jx', p(0.02));
    s.setProperty('--jy', p(0.01));
    s.setProperty('--sk', `${(rand(-4, 4) * power).toFixed(2)}deg`);
    s.setProperty('--sy', Math.random() < 0.2 ? (1 + rand(-0.06, 0.08) * power).toFixed(3) : '1');
    strips.forEach((strip) => {
      strip.style.transform =
        Math.random() < 0.4 ? `translateX(${em(rand(-0.14, 0.14) * power)})` : '';
    });
  };

  // Glitch from style `from` to style `to`: a flicker of the new style early
  // on, back to the old one, then the real swap, settling into place.
  const glitch = async (from: number, to: number, frames: number) => {
    el.classList.add('is-glitch');
    for (let i = 0; i < frames; i++) {
      frame(i < frames - 2 ? 1 : 0.35);
      if (i === 1) setStyle(to);
      if (i === 2) setStyle(from);
      if (i === Math.floor(frames / 2)) setStyle(to);
      await wait(FRAME_MS);
    }
    settle();
    el.classList.remove('is-glitch');
  };

  const loop = async () => {
    await document.fonts?.ready;
    setStyle(0);
    settle();
    await pause(INTRO_HOLD_MS);
    for (;;) {
      let current = 0;
      for (let n = 1; n <= count; n++) {
        await glitch(current, n, GLITCH_FRAMES);
        current = n;
        await pause(STEP_MS - GLITCH_FRAMES * FRAME_MS);
      }
      await glitch(current, 0, FINAL_GLITCH_FRAMES);
      await pause(LOGO_HOLD_MS);
    }
  };

  void loop();
}

if (root) run(root);

export {};
