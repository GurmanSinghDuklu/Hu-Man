/**
 * gsap.com-style play, built from the Hu/man shapes (Gurman, 2026-11-16). Loaded on idle by
 * index.ts after GSAP, never under reduced motion. Each part loads its plugin only when the page
 * has something for it. Nothing here pins the page or ties content to the scroll position: every
 * piece plays once when it comes into view, loops by itself, or follows the pointer.
 *
 * - [data-land]: a sparkle flies along a curve to the phrase, bursts, and the phrase is underlined
 *   (`.is-landed` on its paragraph, so SplitText rebuilding the words keeps it). MotionPathPlugin.
 * - [data-wordline]: words unscramble in, shapes pop between them, a curve draws itself.
 *   ScrambleTextPlugin, DrawSVGPlugin.
 * - [data-morph]: brand shapes change form as they come into view, every few seconds while on
 *   screen, and when their card is hovered. MorphSVGPlugin.
 * - [data-toy]: shapes in the Talk to a human banner that can be grabbed and thrown (mouse and
 *   trackpad only, so touch scrolling is never caught). Draggable, InertiaPlugin.
 */
import { morphForms, type MorphForm } from '../../data/morphForms';

type Gsap = typeof import('gsap').gsap;
type ScrollTriggerClass = typeof import('gsap/ScrollTrigger').ScrollTrigger;

const SPARKLE =
  'M50 0C53.5 37 63 46.5 100 50C63 53.5 53.5 63 50 100C46.5 63 37 53.5 0 50C37 46.5 46.5 37 50 0Z';
const NS = 'http://www.w3.org/2000/svg';

/** Runs `fn` once, when `el` first reaches `start` in the window. */
function once(ST: ScrollTriggerClass, el: Element, start: string, fn: () => void): void {
  ST.create({ trigger: el, start, once: true, onEnter: fn });
}

// ---------- the flying sparkle ----------
async function startLandings(gsap: Gsap, ST: ScrollTriggerClass, targets: HTMLElement[]) {
  const { MotionPathPlugin } = await import('gsap/MotionPathPlugin');
  gsap.registerPlugin(MotionPathPlugin);

  const fly = (para: HTMLElement) => {
    // Re-find the phrase: the word scrub may have rebuilt the paragraph since.
    const target = para.querySelector<HTMLElement>('[data-land]');
    if (!target) return;
    const r = target.getBoundingClientRect();
    const ex = r.left + window.scrollX + Math.min(r.width, 220) * 0.5;
    const ey = r.top + window.scrollY + r.height * 0.5;
    const sx = Math.min(window.innerWidth - 40, r.right + window.innerWidth * 0.3) + window.scrollX;
    const sy = ey - Math.max(160, window.innerHeight * 0.32);

    const spark = document.createElementNS(NS, 'svg');
    spark.setAttribute('viewBox', '0 0 100 100');
    spark.setAttribute('aria-hidden', 'true');
    spark.classList.add('fly-spark');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', SPARKLE);
    spark.append(path);
    document.body.append(spark);

    const size = 34;
    gsap.set(spark, { x: sx - size / 2, y: sy - size / 2, scale: 0.4, opacity: 0 });
    const tl = gsap.timeline({ onComplete: () => spark.remove() });
    tl.to(spark, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(3)' })
      .to(
        spark,
        {
          duration: 1.15,
          ease: 'power2.inOut',
          rotation: 540,
          motionPath: {
            path: [
              { x: sx - size / 2, y: sy - size / 2 },
              { x: (sx + ex) / 2 + 60 - size / 2, y: sy - 90 - size / 2 },
              { x: (sx + ex) / 2 - 40 - size / 2, y: (sy + ey) / 2 + 40 - size / 2 },
              { x: ex - size / 2, y: ey - size / 2 },
            ],
            curviness: 1.4,
          },
        },
        '<',
      )
      .to(spark, { scale: 0, duration: 0.25, ease: 'power2.in' })
      .add(() => {
        para.classList.add('is-landed');
        burst(gsap, ex, ey);
      }, '<');
  };

  for (const t of targets) {
    const para = (t.closest('p, li, div') as HTMLElement | null) ?? t.parentElement!;
    once(ST, para, 'top 72%', () => fly(para));
  }
}

/** A ring of small dots that flies out from a point and fades: the sparkle landing. */
function burst(gsap: Gsap, x: number, y: number): void {
  const colours = ['#39ff14', '#e85e8f', '#4e28df', '#fad5a8', '#cea4ee', '#4a9bb0'];
  for (let i = 0; i < 8; i++) {
    const dot = document.createElement('span');
    dot.className = 'fly-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.background = colours[i % colours.length];
    document.body.append(dot);
    const a = (i / 8) * Math.PI * 2;
    gsap.fromTo(
      dot,
      { x: x - 4, y: y - 4, scale: 1, opacity: 1 },
      {
        x: x - 4 + Math.cos(a) * 46,
        y: y - 4 + Math.sin(a) * 46,
        scale: 0.2,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        onComplete: () => dot.remove(),
      },
    );
  }
}

// ---------- the line of words ----------
async function startWordLines(gsap: Gsap, ST: ScrollTriggerClass, lines: HTMLElement[]) {
  const [{ ScrambleTextPlugin }, { DrawSVGPlugin }] = await Promise.all([
    import('gsap/ScrambleTextPlugin'),
    import('gsap/DrawSVGPlugin'),
  ]);
  gsap.registerPlugin(ScrambleTextPlugin, DrawSVGPlugin);

  for (const line of lines) {
    const words = [...line.querySelectorAll<HTMLElement>('[data-wl-word]')];
    const shapes = [...line.querySelectorAll<HTMLElement>('[data-wl-shape]')];
    const curve = line.querySelector<SVGPathElement>('[data-wl-curve]');
    // Hold each word's width while it scrambles, so the line never jumps about.
    const texts = words.map((w) => w.textContent?.trim() ?? '');
    gsap.set(words, { opacity: 0 });
    gsap.set(shapes, { scale: 0, rotation: -120 });
    if (curve) gsap.set(curve, { drawSVG: '0%' });

    once(ST, line, 'top 80%', () => {
      words.forEach((w) => (w.style.minWidth = `${w.offsetWidth}px`));
      const tl = gsap.timeline({
        onComplete: () => words.forEach((w) => (w.style.minWidth = '')),
      });
      words.forEach((w, i) => {
        const at = i * 0.42;
        tl.set(w, { opacity: 1 }, at).to(
          w,
          {
            duration: 0.75,
            scrambleText: {
              text: texts[i],
              chars: 'HUMAN/0123456789',
              speed: 0.7,
              revealDelay: 0.15,
            },
          },
          at,
        );
        if (shapes[i]) {
          tl.to(
            shapes[i],
            { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' },
            at + 0.45,
          );
        }
      });
      if (curve) tl.to(curve, { drawSVG: '100%', duration: 0.8, ease: 'power2.inOut' }, '-=0.5');
    });
  }
}

// ---------- shapes that change form ----------
async function startMorphs(gsap: Gsap, ST: ScrollTriggerClass, svgs: SVGSVGElement[]) {
  const { MorphSVGPlugin } = await import('gsap/MorphSVGPlugin');
  gsap.registerPlugin(MorphSVGPlugin);

  for (const svg of svgs) {
    const path = svg.querySelector('path');
    const forms = (svg.dataset.morph ?? '')
      .split(',')
      .filter((f) => f in morphForms) as MorphForm[];
    if (!path || forms.length < 2) continue;
    let i = 0;
    let busy = false;
    const next = () => {
      if (busy) return;
      busy = true;
      i = (i + 1) % forms.length;
      gsap
        .timeline({ onComplete: () => void (busy = false) })
        .to(path, { morphSVG: morphForms[forms[i]], duration: 0.9, ease: 'elastic.out(1, 0.6)' })
        .fromTo(
          svg,
          { rotation: -14, scale: 0.86 },
          {
            rotation: 0,
            scale: 1,
            duration: 0.9,
            ease: 'elastic.out(1, 0.5)',
            transformOrigin: '50% 50%',
          },
          0,
        );
    };

    // Change once on arrival, then every few seconds while it is on screen.
    let timer = 0;
    ST.create({
      trigger: svg,
      start: 'top 88%',
      end: 'bottom 5%',
      onToggle: (self) => {
        window.clearInterval(timer);
        if (!self.isActive) return;
        next();
        timer = window.setInterval(next, 3600 + Math.random() * 1200);
      },
    });
    svg.closest('li, article, a')?.addEventListener('pointerenter', next);
  }
}

// ---------- shapes to throw ----------
async function startToys(gsap: Gsap, toys: HTMLElement[]) {
  const [{ Draggable }, { InertiaPlugin }] = await Promise.all([
    import('gsap/Draggable'),
    import('gsap/InertiaPlugin'),
  ]);
  gsap.registerPlugin(Draggable, InertiaPlugin);

  for (const toy of toys) {
    const bounds = toy.closest<HTMLElement>('[data-toybox]') ?? toy.parentElement!;
    Draggable.create(toy, {
      type: 'x,y',
      bounds,
      inertia: true,
      edgeResistance: 0.7,
      throwResistance: 1200,
      zIndexBoost: false,
      onPress() {
        toy.classList.add('is-held');
        gsap.to(toy, { scale: 1.15, duration: 0.25, ease: 'back.out(3)' });
      },
      onRelease() {
        toy.classList.remove('is-held');
        gsap.to(toy, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      },
    });
  }
}

export async function startPlay(gsap: Gsap, ST: ScrollTriggerClass): Promise<void> {
  const lands = [...document.querySelectorAll<HTMLElement>('[data-land]')];
  const lines = [...document.querySelectorAll<HTMLElement>('[data-wordline]')];
  const morphs = [...document.querySelectorAll<SVGSVGElement>('svg[data-morph]')];
  const toys = [...document.querySelectorAll<HTMLElement>('[data-toy]')];
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  await Promise.all([
    lands.length && startLandings(gsap, ST, lands),
    lines.length && startWordLines(gsap, ST, lines),
    morphs.length && startMorphs(gsap, ST, morphs),
    toys.length && finePointer && startToys(gsap, toys),
  ]);
}
