/**
 * Smooth, weighty wheel and trackpad scrolling (Lenis). Touch devices keep their native scrolling
 * (Lenis's default). Not started under reduced motion (index.ts never imports this then).
 *
 * In-page links (#check, #faq…) are handled here rather than by Lenis's own `anchors` option: a
 * target that hasn't been revealed yet still sits 28px low (its reveal translate), so Lenis would
 * land it under the sticky header once the reveal plays. We measure where it will settle instead.
 */
import Lenis from 'lenis';

/** The element's page offset once every pending reveal on it or its ancestors has played. */
function settledTop(el: HTMLElement): number {
  let top = el.getBoundingClientRect().top + window.scrollY;
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (node.matches('[data-reveal]:not(.is-in)')) {
      const [, y = '0'] = getComputedStyle(node).translate.split(' ');
      top -= parseFloat(y) || 0;
    }
  }
  return top;
}

function targetOf(hash: string): HTMLElement | null {
  try {
    return hash.length > 1 ? document.querySelector<HTMLElement>(hash) : null;
  } catch {
    return null; // Not a valid selector (e.g. "#1"): leave it to the browser.
  }
}

export function startSmoothScroll(): void {
  const lenis = new Lenis({ autoRaf: true });
  const headerHeight = () => document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
  const go = (target: HTMLElement, immediate = false) =>
    lenis.scrollTo(settledTop(target) - headerHeight(), { immediate });

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.origin !== location.origin || link.pathname !== location.pathname) return;
    const target = targetOf(link.hash);
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    go(target);
    // Keep the browser's own behaviour for keyboard users: the next Tab starts from the target.
    if (!target.matches('a, button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  });

  // Arriving on /pricing/#faq from another page: land below the header too.
  const arrived = targetOf(location.hash);
  if (arrived) go(arrived, true);
}
