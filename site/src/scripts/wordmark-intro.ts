/**
 * Hero wordmark loop, Spider-Verse misprint style: hold white HU?MAN on an
 * alternate separator, glitch (plates slip, strips tear, separators flicker
 * through variants at ~12 fps), snap to bold green HU/MAN, hold, glitch back
 * to white on the next separator. Pauses while off screen or in a hidden tab.
 * Reduced motion: static green HU/MAN.
 *
 * Flash safety (WCAG 2.3.1): the white/green swap happens at most twice per
 * glitch, never more than three times in any second. Per-frame changes are
 * position only.
 */
const SEPARATORS = ['.', '*', '_', '-', '+', '&', ':', '×', '~', '|', '#', '•'];
const FINAL = '/';
const FRAME_MS = 83; // ~12 fps, animated "on twos"
const WHITE_HOLD_MS = 2200;
const GREEN_HOLD_MS = 3400;
const BIG_GLITCH_FRAMES = 14;
const SMALL_GLITCH_FRAMES = 6;

const root = document.querySelector<HTMLElement>('[data-wordmark]');

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]!;
const em = (n: number) => `${n.toFixed(3)}em`;

function run(el: HTMLElement): void {
  const seps = [...el.querySelectorAll<HTMLElement>('[data-wordmark-sep]')];
  const strips = [...el.querySelectorAll<HTMLElement>('[data-wordmark-strip]')];

  const setSep = (glyph: string) => seps.forEach((s) => (s.textContent = glyph));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setSep(FINAL);
    el.classList.add('is-merged');
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

  // Plate register at rest: a faint misprint that never fully lines up.
  const settle = () => {
    const s = el.style;
    s.setProperty('--jx', '0em');
    s.setProperty('--jy', '0em');
    s.setProperty('--sk', '0deg');
    s.setProperty('--sy', '1');
    s.setProperty('--cx', em(0.012));
    s.setProperty('--cy', '0em');
    s.setProperty('--mx', em(-0.012));
    s.setProperty('--my', em(0.006));
    s.setProperty('--yx', '0em');
    s.setProperty('--yy', em(-0.008));
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
    if (Math.random() < 0.6) setSep(pick(SEPARATORS.concat(FINAL)));
  };

  // A glitch burst that lands on `merged` (green HU/MAN) or white with `endSep`.
  // The colour flips once mid-burst (and once early on big bursts), so it never
  // flashes faster than WCAG allows.
  const glitch = async (frames: number, merged: boolean, endSep: string) => {
    el.classList.add('is-glitch');
    const flipAt = Math.floor(frames * 0.6);
    const earlyAt = frames > 10 ? 2 : -1;
    for (let i = 0; i < frames; i++) {
      const power = i < frames - 2 ? 1 : 0.35; // ease into the snap
      frame(power);
      if (i === earlyAt) el.classList.toggle('is-merged', merged);
      if (i === earlyAt + 4 && earlyAt >= 0) el.classList.toggle('is-merged', !merged);
      if (i === flipAt) el.classList.toggle('is-merged', merged);
      await wait(FRAME_MS);
    }
    setSep(endSep);
    settle();
    el.classList.remove('is-glitch');
  };

  // Tiny blip while holding: two frames of plate slip, no colour change.
  const blip = async () => {
    el.classList.add('is-glitch');
    frame(0.4);
    await wait(FRAME_MS);
    frame(0.25);
    await wait(FRAME_MS);
    settle();
    el.classList.remove('is-glitch');
  };

  const loop = async () => {
    await document.fonts?.ready;
    let i = 0;
    setSep(SEPARATORS[i]!);
    settle();
    for (;;) {
      await pause(WHITE_HOLD_MS * 0.55);
      await blip();
      await pause(WHITE_HOLD_MS * 0.45);
      await glitch(BIG_GLITCH_FRAMES, true, FINAL);
      await pause(GREEN_HOLD_MS);
      i = (i + 1) % SEPARATORS.length;
      await glitch(SMALL_GLITCH_FRAMES, false, SEPARATORS[i]!);
    }
  };

  void loop();
}

if (root) run(root);

export {};
