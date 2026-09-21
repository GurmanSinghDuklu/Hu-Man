/**
 * Compare slider: drives the --pos custom property from a native range
 * input, switches sector tabs (resetting the slider to 50), and plays a
 * one-time nudge (50 -> 35 -> 50) when the slider first scrolls into view,
 * skipped entirely under prefers-reduced-motion.
 */
export function initCompareSlider(): void {
  const root = document.querySelector<HTMLElement>('[data-compare-slider]');
  if (!root) return;

  const frameEl = root.querySelector<HTMLElement>('[data-compare-frame]');
  const rangeEl = root.querySelector<HTMLInputElement>('[data-compare-range]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-compare-tab]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-compare-panel]'));
  if (!frameEl || !rangeEl) return;

  const frame = frameEl;
  const range = rangeEl;

  function setPos(value: number): void {
    frame.style.setProperty('--pos', `${value}%`);
  }

  range.addEventListener('input', () => {
    setPos(Number(range.value));
  });

  function activateTab(id: string): void {
    for (const tab of tabs) {
      const isActive = tab.dataset.compareTab === id;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.comparePanel !== id;
    }
    range.value = '50';
    setPos(50);
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const id = tab.dataset.compareTab;
      if (id) activateTab(id);
      tab.focus();
    });

    tab.addEventListener('keydown', (event) => {
      const currentIndex = tabs.indexOf(tab);
      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (nextIndex !== null) {
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        const id = nextTab.dataset.compareTab;
        if (id) activateTab(id);
        nextTab.focus();
      }
    });
  }

  // One-time nudge when the slider first scrolls into view.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    let hasNudged = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasNudged) {
            hasNudged = true;
            frame.classList.add('compare-frame--nudge');
            frame.addEventListener(
              'animationend',
              () => frame.classList.remove('compare-frame--nudge'),
              { once: true },
            );
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(frame);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCompareSlider);
} else {
  initCompareSlider();
}
