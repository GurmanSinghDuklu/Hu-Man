/**
 * Hero wordmark loop: show each separator variant (Hu.Man, Hu*Man, Hu_Man...)
 * for ~2 s, then settle on the brand form: the separator becomes "/", the gap
 * tightens and the word turns bold green (HU/MAN). Hold, reopen on the
 * starting separator and go again. Reduced motion: static green HU/MAN.
 */
const SEPARATORS = ['.', '*', '_', '-', '+', '&', ':', '×', '~', '|', '#', '•'];
const FINAL = '/';
const HOLD_MS = 2000; // each separator
const SWAP_MS = 260; // slide out before the glyph changes
const MERGED_HOLD_MS = 3200; // green HUMAN on screen
const MERGE_MS = 1200; // matches the CSS merge transition

const root = document.querySelector<HTMLElement>('[data-wordmark]');
const sep = root?.querySelector<HTMLElement>('[data-wordmark-sep]');

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

async function swapTo(glyph: HTMLElement, text: string): Promise<void> {
  glyph.classList.add('is-out');
  await wait(SWAP_MS);
  glyph.textContent = text;
  glyph.classList.remove('is-out');
}

async function loop(el: HTMLElement, glyph: HTMLElement): Promise<void> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    glyph.textContent = FINAL;
    el.classList.add('is-merged');
    return;
  }
  await document.fonts?.ready;
  glyph.textContent = SEPARATORS[0]!;

  for (;;) {
    // Starting separator is already showing; hold it, then step through the rest.
    await wait(HOLD_MS);
    for (const s of SEPARATORS.slice(1)) {
      await swapTo(glyph, s);
      await wait(HOLD_MS - SWAP_MS);
    }

    await swapTo(glyph, FINAL);
    el.classList.add('is-merged');
    await wait(MERGE_MS + MERGED_HOLD_MS);

    // Reopen in white on the starting separator.
    el.classList.remove('is-merged');
    await swapTo(glyph, SEPARATORS[0]!);
    await wait(MERGE_MS - SWAP_MS);
  }
}

if (root && sep) void loop(root, sep);

export {};
