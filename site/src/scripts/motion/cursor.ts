/**
 * A fingerprint that trails the cursor, in the logo's flowing colours (.logo-led, base.css). It is
 * decoration only: the real cursor stays, the print never takes clicks (pointer-events: none) and
 * is aria-hidden. Mouse and trackpad only; never under reduced motion (index.ts decides).
 * - Grows over anything clickable, and pulses on press.
 * - Hides over text fields (it would sit on the caret), over iframes (their events never reach
 *   this page, so it would freeze) and when the pointer leaves the window.
 * The animation loop stops once the print has caught up, so an idle page costs nothing.
 */
// A complete line print (whorl), drawn for small sizes; the brand scan turns to mush this small.
import printMask from '../../assets/brand/fingerprint-full.svg?url';

const CLICKABLE =
  'a, button, summary, label, select, [role="button"], [role="tab"], input[type="range"]';
const HIDE_OVER =
  'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, iframe, [contenteditable="true"]';

export function startCursor(): void {
  if (document.querySelector('.print-cursor')) return;
  const el = document.createElement('div');
  el.className = 'print-cursor logo-led';
  el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--logo-mask', `url("${printMask}")`);
  document.body.append(el);

  let x = -100;
  let y = -100;
  let tx = x;
  let ty = y;
  let raf = 0;
  let shown = false;

  const tick = () => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    el.style.translate = `${x}px ${y}px`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const show = (on: boolean) => {
    if (on === shown) return;
    shown = on;
    el.classList.toggle('is-on', on);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return show(false);
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        // Appear in place rather than flying in from the corner.
        x = tx;
        y = ty;
      }
      const target = e.target instanceof Element ? e.target : null;
      show(!target?.closest(HIDE_OVER));
      el.classList.toggle('is-over', Boolean(target?.closest(CLICKABLE)));
      wake();
    },
    { passive: true },
  );
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    el.classList.remove('is-press');
    void el.offsetWidth; // restart the pulse
    el.classList.add('is-press');
  });
  document.documentElement.addEventListener('pointerleave', () => show(false));
  window.addEventListener('blur', () => show(false));
}
