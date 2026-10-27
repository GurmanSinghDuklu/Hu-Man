/**
 * Boots the site's motion. Reveals start straight away (they are cheap). The libraries never
 * compete with first paint:
 * - GSAP (heading line reveals) loads when the page is idle;
 * - Lenis (smooth wheel scrolling) loads when idle too, but only with a mouse or trackpad: touch
 *   screens keep native scrolling, so it would be dead weight there;
 * - Paper Shaders start on the first scroll, tap, pointer move or key press. Compiling the shaders
 *   is the heaviest step (~270 ms of script on a throttled phone), and until it runs each panel
 *   shows its own CSS gradient, so nothing looks missing.
 * Under reduced motion none of them load.
 */
import { startReveals, useGsap } from './reveals';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

startReveals(reduceMotion);

const whenIdle = (fn: () => void): void => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 600);
};

/** Runs `fn` once, on the visitor's first interaction with the page. */
const onFirstInteraction = (fn: () => void): void => {
  const events = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'keydown', 'touchstart'];
  const run = () => {
    events.forEach((e) => window.removeEventListener(e, run));
    fn();
  };
  events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
};

if (!reduceMotion) {
  whenIdle(async () => {
    const [{ gsap }, { SplitText }] = await Promise.all([import('gsap'), import('gsap/SplitText')]);
    await document.fonts.ready;
    useGsap(gsap, SplitText);
    if (finePointer) {
      const { startSmoothScroll } = await import('./smooth');
      startSmoothScroll();
    }
  });
  onFirstInteraction(async () => {
    const { startShaders } = await import('./shaders');
    startShaders();
  });
}
