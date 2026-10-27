/**
 * Boots the site's motion. Reveals start straight away (they are cheap). The libraries load when
 * the page is idle, after first paint, so they never delay the LCP: GSAP for heading line
 * reveals, Lenis for smooth wheel scrolling, Paper Shaders for the moving gradients. Under
 * reduced motion none of them load.
 */
import { startReveals, useGsap } from './reveals';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

startReveals(reduceMotion);

const whenIdle = (fn: () => void): void => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 2000 });
  else setTimeout(fn, 600);
};

if (!reduceMotion) {
  whenIdle(async () => {
    const [{ gsap }, { SplitText }] = await Promise.all([import('gsap'), import('gsap/SplitText')]);
    await document.fonts.ready;
    useGsap(gsap, SplitText);
    const { startSmoothScroll } = await import('./smooth');
    startSmoothScroll();
    const { startShaders } = await import('./shaders');
    startShaders();
  });
}
