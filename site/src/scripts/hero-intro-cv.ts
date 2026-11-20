/**
 * The Portfolio hero's opening, over the video frame only (components/HeroVideo.astro with
 * `intro="cv"`): the page's story in about 1.6 s. A plain Paper CV sheet covers the frame, its
 * bars drawing on left to right (no words), a thin Signal green line scans down it like a
 * document scanner, then the sheet cuts into vertical strips that fall away under gravity, centre
 * first, with the video's poster already showing behind. The video starts as the layer goes.
 *
 * Web Animations on `translate`, `scale` and `opacity` only. The sheet is built once and copied
 * into each strip (5 on phones, 8 elsewhere), so the element count stays small. The page's h1 and
 * lede never animate (LCP) and the frame's box never changes (no layout shift). The gating
 * (every visit by link, 40% on screen, click or key to finish, layer removed) is shared in hero-intro.ts.
 */
import { playWhenSeen } from './hero-intro';

// Bar widths as a share of the sheet's text column (80cqw), in reading order. `h` marks a heading.
const BARS: { w: number; h?: boolean }[] = [
  { w: 34, h: true },
  { w: 100 },
  { w: 94 },
  { w: 100 },
  { w: 62 },
  { w: 30, h: true },
  { w: 100 },
  { w: 88 },
  { w: 100 },
  { w: 96 },
  { w: 54 },
  { w: 74 },
];

const DRAW_STEP = 22; // ms between bars
const DRAW_FOR = 190; // ms for one bar to draw on (all done by about 450)
const SCAN_AT = 480;
const SCAN_FOR = 300;
const CUT_AT = SCAN_AT + SCAN_FOR + 70; // the sheet becomes strips
const FALL = 640;
const FALL_STEP = 55; // ms between rings of strips, centre outwards

const GRAVITY = 'cubic-bezier(0.55, 0.05, 0.9, 0.55)';

/** One copy of the sheet: a name bar, a small sub-line and twelve text-line bars. */
function sheet(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cv-sheet';
  const bar = (cls: string, top: number, w: number) => {
    const b = document.createElement('span');
    b.className = `cv-bar ${cls}`;
    b.style.top = `${top}cqh`;
    b.style.width = `${(w * 80) / 100}cqw`;
    el.append(b);
    return b;
  };
  bar('cv-bar--name', 7, 58);
  bar('cv-bar--sub', 12.4, 36);
  BARS.forEach((b, i) => bar(b.h ? 'cv-bar--head' : 'cv-bar--line', 20 + i * 6, b.w));
  return el;
}

export function runCvIntro(frame: HTMLElement): Promise<void> {
  const box = frame.getBoundingClientRect();
  if (box.width < 80 || box.height < 120) return Promise.resolve();

  const n = box.width < 300 ? 5 : 8;
  const mid = (n - 1) / 2;

  const layer = document.createElement('div');
  layer.className = 'hv-cv';
  layer.setAttribute('aria-hidden', 'true');

  // Strips first (underneath), each carrying its slice of a finished sheet.
  const strips: HTMLElement[] = [];
  for (let i = 0; i < n; i++) {
    const strip = document.createElement('div');
    strip.className = 'hv-cv__strip';
    // A half pixel over, so no hairline shows between strips before they part.
    strip.style.left = `${(i * 100) / n}%`;
    strip.style.width = `calc(${100 / n}% + 0.5px)`;
    const copy = sheet();
    // Each strip's copy is full sheet width, shifted so this strip shows its own slice.
    copy.style.left = `calc(-100cqw * ${i} / ${n})`;
    strip.append(copy);
    layer.append(strip);
    strips.push(strip);
  }
  // The whole sheet on top: this is what draws on, then it gives way to the strips beneath.
  const top = sheet();
  top.style.left = '0';
  layer.append(top);
  const line = document.createElement('span');
  line.className = 'hv-cv__scan';
  layer.append(line);
  frame.querySelector('video')!.after(layer);

  const animations: Animation[] = [];
  const add = (el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = el.animate(keyframes, { fill: 'both', ...options });
    a.pause();
    animations.push(a);
  };

  // 1. Draw on: each bar grows from the left, staggered by line.
  top.querySelectorAll<HTMLElement>('.cv-bar').forEach((b, i) => {
    add(b, [{ scale: '0 1' }, { scale: '1 1' }], {
      duration: DRAW_FOR,
      delay: i * DRAW_STEP,
      easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    });
  });

  // 2. Scan: a thin Signal green line, top to bottom, there only while it moves.
  add(
    line,
    [
      { translate: '0 0', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.04 },
      { opacity: 1, offset: 0.92 },
      { translate: `0 ${Math.round(box.height)}px`, opacity: 0, offset: 1 },
    ],
    { duration: SCAN_FOR, delay: SCAN_AT, easing: 'linear' },
  );

  // 3. Cut: the top sheet goes at once (the strips under it look the same), and each strip drops
  //    with a slight turn, the middle ones first.
  add(top, [{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: CUT_AT, easing: 'linear' });
  let total = 0;
  strips.forEach((strip, i) => {
    const d = Math.abs(i - mid);
    const side = i < mid ? -1 : 1;
    const delay = CUT_AT + d * FALL_STEP;
    add(
      strip,
      [
        { translate: '0 0', rotate: '0deg' },
        {
          translate: `0 ${Math.round(box.height * 1.2)}px`,
          rotate: `${(side * (2 + d * 0.9)).toFixed(1)}deg`,
        },
      ],
      { duration: FALL, delay, easing: GRAVITY },
    );
    total = Math.max(total, delay + FALL);
  });

  return playWhenSeen(frame, layer, animations, total);
}
