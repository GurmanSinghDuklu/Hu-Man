/**
 * The Pricing hero's opening, over the video frame only (components/HeroVideo.astro with
 * `intro="receipt"`): the page's story in about 1.6 s, echoing the ad's receipt and odometer. A
 * narrow Paper receipt feeds down from the top of the frame and prints line by line: a header
 * bar, then five rows, each a grey label bar and a price that rolls up like an odometer (only our
 * real tier prices, in IBM Plex Mono: £318, £446, £932, £2,240 and "Quote"), then a Signal green
 * total bar. A thin Signal line scans down it, then the receipt tears across a zigzag: the top
 * half lifts away and the bottom half drops, with the video's poster already showing behind.
 * The video starts as the pieces leave.
 *
 * Web Animations on `translate`, `rotate`, `scale` and `opacity` only. The receipt is built once
 * and cloned for the two halves, so the element count stays small. The page's h1 and lede never
 * animate (LCP) and the frame's box never changes (no layout shift). Gating (every visit by link, 40% on
 * screen, click or key to finish, layer removed) is shared in hero-intro.ts.
 */
import { playWhenSeen } from './hero-intro';

// Real tier prices only (docs/02-offer-and-pricing.md). Each rolls through the ones before it.
const PRICES = ['£318', '£446', '£932', '£2,240', 'Quote'];
const LINE = 1.25; // em: one odometer line

const FEED = 600; // the receipt feeds in from above
const SCAN_AT = 800;
const SCAN_FOR = 250;
const TEAR_AT = SCAN_AT + SCAN_FOR + 20;
const FALL = 500;

const SETTLE = 'cubic-bezier(0.2, 0.9, 0.3, 1)';
const GRAVITY = 'cubic-bezier(0.55, 0.05, 0.9, 0.55)';

// The tear's zigzag, as clip-path points along the receipt's middle (percent of its height).
const TEAR_Y = 52;
const zig = (): string[] =>
  Array.from(
    { length: 13 },
    (_, i) => `${((i * 100) / 12).toFixed(2)}% ${TEAR_Y + (i % 2 ? 2.4 : -2.4)}%`,
  );

/** One copy of the finished receipt (every bar full, every price at its final line). */
function receipt(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'rc-paper';
  const head = document.createElement('span');
  head.className = 'rc-bar rc-bar--head';
  el.append(head);
  PRICES.forEach((price, i) => {
    const row = document.createElement('div');
    row.className = 'rc-row';
    row.style.top = `${12 + i * 11}cqh`;
    const label = document.createElement('span');
    label.className = 'rc-bar rc-bar--label';
    label.style.width = `${[26, 20, 24, 22, 18][i]}cqw`;
    const sub = document.createElement('span');
    sub.className = 'rc-bar rc-bar--sub';
    sub.style.width = `${[16, 14, 18, 15, 12][i]}cqw`;
    const win = document.createElement('span');
    win.className = 'rc-win';
    const roll = document.createElement('span');
    roll.className = 'rc-roll';
    const lines = ['£0', ...PRICES.slice(0, i + 1)].slice(-4);
    lines.forEach((t) => {
      const l = document.createElement('span');
      l.textContent = t;
      roll.append(l);
    });
    roll.style.translate = `0 ${-(lines.length - 1) * LINE}em`;
    roll.dataset.steps = String(lines.length - 1);
    win.append(roll);
    row.append(label, sub, win);
    el.append(row);
  });
  const total = document.createElement('span');
  total.className = 'rc-bar rc-bar--total';
  el.append(total);
  return el;
}

export function runReceiptIntro(frame: HTMLElement): Promise<void> {
  const box = frame.getBoundingClientRect();
  if (box.width < 80 || box.height < 120) return Promise.resolve();

  const layer = document.createElement('div');
  layer.className = 'hv-rc';
  layer.setAttribute('aria-hidden', 'true');

  // The two halves first (underneath): each is a full copy cut along the zigzag.
  const topHalf = receipt();
  const bottomHalf = receipt();
  const points = zig();
  topHalf.style.clipPath = `polygon(0 0, 100% 0, ${[...points].reverse().join(', ')})`;
  bottomHalf.style.clipPath = `polygon(${points.join(', ')}, 100% 100%, 0 100%)`;
  const paper = receipt();
  const line = document.createElement('span');
  line.className = 'hv-rc__scan';
  layer.append(topHalf, bottomHalf, paper, line);
  frame.querySelector('video')!.after(layer);

  const animations: Animation[] = [];
  const add = (el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = el.animate(keyframes, { fill: 'both', ...options });
    a.pause();
    animations.push(a);
  };

  // 1. Feed: the receipt comes down from above the frame.
  add(paper, [{ translate: `0 ${-Math.round(box.height)}px` }, { translate: '0 0' }], {
    duration: FEED,
    easing: SETTLE,
  });

  // 2. Print: the header bar, each row's bars and rolling price, then the total, line by line.
  const grow = (el: HTMLElement, delay: number, duration: number) =>
    add(el, [{ scale: '0 1' }, { scale: '1 1' }], { duration, delay, easing: SETTLE });
  grow(paper.querySelector<HTMLElement>('.rc-bar--head')!, 80, 160);
  paper.querySelectorAll<HTMLElement>('.rc-row').forEach((row, i) => {
    const delay = 160 + i * 80;
    grow(row.querySelector<HTMLElement>('.rc-bar--label')!, delay, 160);
    grow(row.querySelector<HTMLElement>('.rc-bar--sub')!, delay + 40, 140);
    const roll = row.querySelector<HTMLElement>('.rc-roll')!;
    const steps = Number(roll.dataset.steps);
    add(roll, [{ translate: '0 0' }, { translate: `0 ${-steps * LINE}em` }], {
      duration: 300,
      delay,
      easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)',
    });
  });
  grow(paper.querySelector<HTMLElement>('.rc-bar--total')!, 560, 220);

  // 3. Scan: a thin Signal green line down the receipt, there only while it moves.
  add(
    line,
    [
      { translate: '0 0', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.05 },
      { opacity: 1, offset: 0.92 },
      { translate: `0 ${Math.round(box.height * 0.8)}px`, opacity: 0, offset: 1 },
    ],
    { duration: SCAN_FOR, delay: SCAN_AT, easing: 'linear' },
  );

  // 4. Tear: the whole receipt gives way at once to its two halves, which leave up and down.
  add(paper, [{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: TEAR_AT, easing: 'linear' });
  const out = Math.round(box.height * 1.1);
  add(
    topHalf,
    [
      { translate: '0 0', rotate: '0deg' },
      { translate: `0 ${-out}px`, rotate: '-3deg' },
    ],
    {
      duration: FALL,
      delay: TEAR_AT,
      easing: 'cubic-bezier(0.5, 0, 0.9, 0.4)',
    },
  );
  add(
    bottomHalf,
    [
      { translate: '0 0', rotate: '0deg' },
      { translate: `0 ${out}px`, rotate: '2.5deg' },
    ],
    {
      duration: FALL,
      delay: TEAR_AT + 40,
      easing: GRAVITY,
    },
  );
  // The halves are only there from the tear on (before it, the paper covers the same place).
  [topHalf, bottomHalf].forEach((h) =>
    add(h, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: TEAR_AT, easing: 'linear' }),
  );

  return playWhenSeen(frame, layer, animations, TEAR_AT + 40 + FALL);
}
