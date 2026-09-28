/**
 * Hero wordmark loop: show each separator variant (Hu/Man, Hu.Man, Hu*Man...)
 * for ~2 s, then close the gap into a bold green HUMAN, hold, reopen on the
 * starting separator and go again. Reduced motion: static green HUMAN.
 */
const SEPARATORS = ['/', '.', '*', '_', '-', '+', '&', ':', '×', '~', '|', '#', '•'];
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

    el.classList.add('is-merged');
    await wait(MERGE_MS + MERGED_HOLD_MS);

    // Reopen on the starting separator (swap while it is invisible).
    glyph.textContent = SEPARATORS[0]!;
    el.classList.remove('is-merged');
    await wait(MERGE_MS);
  }
}

if (root && sep) void loop(root, sep);

export {};
