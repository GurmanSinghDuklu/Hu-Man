/**
 * Slot-machine cycle through separator variants, land on a random one,
 * pause, then merge into HUMAN. Reduced motion: jump straight to the end.
 */
const SEPARATORS = ['/', '.', '*', '_', '-', '+', '&', ':', '×', '~', '|', '#', '•'];
const STEPS = 22;

const root = document.querySelector<HTMLElement>('[data-wordmark]');
const sep = root?.querySelector<HTMLElement>('[data-wordmark-sep]');

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function run(el: HTMLElement, glyph: HTMLElement): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('is-merged');
    return;
  }
  await document.fonts?.ready;
  await wait(500);

  let last = glyph.textContent ?? '/';
  for (let i = 0; i < STEPS; i++) {
    let next = last;
    while (next === last) next = SEPARATORS[Math.floor(Math.random() * SEPARATORS.length)]!;
    last = next;
    glyph.textContent = next;
    glyph.classList.remove('is-tick');
    void glyph.offsetWidth; // restart the tick animation
    glyph.classList.add('is-tick');
    // Ease out: fast at first, slowing like a reel coming to rest.
    const t = i / (STEPS - 1);
    await wait(55 + Math.pow(t, 3) * 420);
  }

  el.classList.add('is-landed');
  await wait(900);
  el.classList.remove('is-landed');
  el.classList.add('is-merged');
}

if (root && sep) void run(root, sep);

export {};
