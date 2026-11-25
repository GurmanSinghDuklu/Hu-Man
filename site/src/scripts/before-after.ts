/**
 * The "after" window under Agentic AI-ready (components/BeforeAfter.astro): a sample site that
 * plays itself while it's on screen. The page scrolls inside the window through the hero, services,
 * how it works, the quote form and the footer, each part animating as it arrives, then loops.
 * The data panel beside it lights the rows an AI agent reads from the part on show.
 *
 * Picking a change in the list below jumps the tour to the part that shows it and holds there;
 * clearing the pick carries on. Nothing in the window is clickable: it's a sketch of the work.
 * GSAP loads only when the window comes near. Under reduced motion or Data Saver nothing plays,
 * and a pick just shows the right part.
 */
type Gsap = typeof import('gsap').gsap;
type Timeline = ReturnType<Gsap['timeline']>;

type Part = 'hero' | 'services' | 'steps' | 'form' | 'foot';

/** Which part of the page shows each numbered change. */
const PART_FOR_CHANGE: Record<string, Part> = {
  '1': 'hero',
  '2': 'hero',
  '3': 'form',
  '4': 'services',
  '5': 'hero',
  '6': 'foot',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(
  (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
);

for (const col of document.querySelectorAll<HTMLElement>('.ba__col--after')) setUp(col);

function setUp(col: HTMLElement): void {
  const page = col.querySelector<HTMLElement>('[data-am-page]');
  const view = col.querySelector<HTMLElement>('.am__view');
  const list = col.closest('.ba')?.querySelector<HTMLElement>('.ba__changes');
  if (!page || !view) return;

  /** Where each part sits, in em from the top of the page (holds at every width). */
  const offsets = (): Record<Part, number> => {
    const em = parseFloat(getComputedStyle(page).fontSize) || 1;
    const nav = parseFloat(getComputedStyle(page).paddingTop) || 0;
    const max = Math.max(0, (page.offsetHeight - view.clientHeight) / em);
    const at = (part: Part) => {
      const el = page.querySelector<HTMLElement>(`[data-am-at="${part}"]`);
      // Skip most of the section's top padding, so the whole part fits the window.
      return el ? Math.min(max, Math.max(0, (el.offsetTop - nav) / em + 1.6)) : 0;
    };
    return { hero: 0, services: at('services'), steps: at('steps'), form: at('form'), foot: max };
  };

  let pickedPart: Part | null = null;
  let onPick: (part: Part | null) => void = (part) => {
    // Without the tour: just show the part, no movement.
    page.style.setProperty('--sy', String(part ? offsets()[part] : 0));
    col.dataset.amOn = part ?? '';
  };

  if (list)
    new MutationObserver(() => {
      const picked = list.querySelector<HTMLElement>('li.is-picked');
      const part = picked ? (PART_FOR_CHANGE[picked.dataset.mark ?? ''] ?? null) : null;
      if (part === pickedPart) return;
      pickedPart = part;
      onPick(part);
    }).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'] });

  if (reduceMotion || saveData || !('IntersectionObserver' in window)) return;

  // Load GSAP when the window is near, then play only while it's mostly on screen.
  const near = new IntersectionObserver(
    async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      const { gsap } = await import('gsap');
      await document.fonts.ready;
      const tl = buildTour(gsap, col, page, offsets());

      let visible = false;
      const update = () => {
        const play = visible && !document.hidden && !pickedPart;
        if (play) tl.play();
        else tl.pause();
        col.toggleAttribute('data-am-play', visible && !document.hidden);
      };
      new IntersectionObserver(
        (seen) => {
          visible = seen.some((e) => e.isIntersecting);
          update();
        },
        { threshold: 0.35 },
      ).observe(view);
      document.addEventListener('visibilitychange', update);

      onPick = (part) => {
        if (part) {
          tl.pause();
          gsap.to(tl, {
            time: tl.labels[`${part}-done`] ?? 0,
            duration: 0.9,
            ease: 'power2.inOut',
            overwrite: true,
          });
        } else {
          gsap.killTweensOf(tl);
          update();
        }
      };
      if (pickedPart) onPick(pickedPart);
    },
    { rootMargin: '300px 0px' },
  );
  near.observe(view);
}

function buildTour(
  gsap: Gsap,
  col: HTMLElement,
  page: HTMLElement,
  y: Record<Part, number>,
): Timeline {
  const q = <T extends Element = HTMLElement>(sel: string) => [...col.querySelectorAll<T>(sel)];
  const one = (sel: string) => col.querySelector<HTMLElement>(sel);

  const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: 'power3.out' } });
  const scrollTo = (part: Part, at?: string) =>
    tl.to(page, { '--sy': y[part], duration: 1.1, ease: 'power3.inOut' }, at);
  const show = (part: Part) => tl.set(col, { attr: { 'data-am-on': part } });
  const hold = (seconds: number) => tl.to({}, { duration: seconds });
  const draw = (paths: Element[], duration: number, at?: string | number) =>
    tl.fromTo(
      paths,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration, ease: 'power2.inOut' },
      at,
    );

  /** Typing: the text grows letter by letter (onUpdate also runs when the tour seeks). */
  const type = (el: HTMLElement, duration: number) => {
    const full = el.dataset.amType ?? '';
    const state = { n: 0 };
    tl.fromTo(
      state,
      { n: 0 },
      {
        n: full.length,
        duration,
        ease: 'none',
        onUpdate: () => {
          el.textContent = full.slice(0, Math.round(state.n));
        },
      },
    );
  };

  /** Prices count up from zero to the sample price. */
  const count = (el: HTMLElement, at: string) => {
    const to = Number(el.dataset.amCount ?? 0);
    const state = { v: 0 };
    tl.fromTo(
      state,
      { v: 0 },
      {
        v: to,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = String(Math.round(state.v));
        },
      },
      at,
    );
  };

  // Hero: headline lines rise out of their masks, then the rest, then the picture draws itself.
  tl.set(page, { '--sy': 0 });
  show('hero');
  tl.addLabel('hero');
  tl.fromTo(q('[data-am-line]'), { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.12 });
  tl.fromTo(
    q('[data-am-fade]'),
    { autoAlpha: 0, y: '0.8em' },
    { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
    'hero+=0.45',
  );
  // The fuse board: each switch drops and flips back on in turn, and its light comes on.
  tl.fromTo(
    q('[data-lw-toggle]'),
    { y: '0.55em' },
    { y: 0, duration: 0.16, stagger: 0.13, ease: 'back.out(3)' },
    'hero+=0.25',
  );
  tl.fromTo(
    q('[data-lw-led]'),
    { backgroundColor: '#3a3d36', boxShadow: '0 0 0em 0em rgba(228,255,26,0)' },
    {
      backgroundColor: '#e4ff1a',
      boxShadow: '0 0 0.5em 0em rgba(228,255,26,0.9)',
      duration: 0.08,
      stagger: 0.13,
    },
    'hero+=0.33',
  );
  // Then the wire draws down to the bulb, which lights.
  draw(q('.am__art [data-am-draw]'), 0.9, 'hero+=1.05');
  tl.fromTo(
    one('[data-lw-glow]'),
    { autoAlpha: 0, scale: 0.4 },
    { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power2.out' },
    'hero+=1.85',
  );
  tl.fromTo(
    one('[data-am-float]'),
    { autoAlpha: 0, y: '1em', rotate: 8 },
    { autoAlpha: 1, y: 0, rotate: -4, duration: 0.7, ease: 'back.out(2)' },
    'hero+=1.6',
  );
  tl.addLabel('hero-done');
  // The quote button gives a nudge: this is the next step.
  tl.to(one('[data-am-cta]'), { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1 }, '+=0.3');
  hold(1.4);

  // Services: cards rise one after another and their prices count up.
  tl.addLabel('services-go');
  scrollTo('services');
  show('services');
  tl.addLabel('services', '-=0.35');
  tl.fromTo(
    q('[data-am-card]'),
    { autoAlpha: 0, y: '2em' },
    { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 },
    'services',
  );
  // A scan line sweeps across each card as it lands.
  tl.fromTo(
    q('[data-lw-scan]'),
    { xPercent: -110 },
    { xPercent: 110, duration: 0.8, stagger: 0.12, ease: 'power2.inOut' },
    'services+=0.15',
  );
  q('[data-am-count]').forEach((el, i) => count(el, `services+=${0.25 + i * 0.24}`));
  tl.addLabel('services-done', 'services+=1.2');
  hold(1.8);

  // How it works: the line draws across and each step pops on as it's reached.
  scrollTo('steps');
  tl.addLabel('steps', '-=0.3');
  draw(q('.am__track [data-am-draw]'), 1.2, 'steps');
  // A pulse of current travels along the line from step to step.
  tl.fromTo(
    one('[data-lw-pulse]'),
    { autoAlpha: 1, '--p': 0 },
    { '--p': 1, duration: 1.2, ease: 'power2.inOut' },
    'steps',
  );
  tl.to(one('[data-lw-pulse]'), { autoAlpha: 0, duration: 0.3 }, 'steps+=1.3');
  tl.fromTo(
    q('[data-am-step]'),
    { autoAlpha: 0, y: '1em' },
    { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.4 },
    'steps',
  );
  tl.addLabel('steps-done', 'steps+=1.4');
  hold(1.5);

  // Quote form: the fields fill in, a photo is added, the button is pressed, and it's sent.
  scrollTo('form');
  show('form');
  tl.addLabel('form', '-=0.2');
  tl.set(q('[data-am-chip], [data-am-toast]'), { autoAlpha: 0 }, 'form');
  q('[data-am-type]').forEach((el, i) => type(el, [0.6, 0.35, 1][i] ?? 0.6));
  tl.fromTo(
    one('[data-am-chip]'),
    { autoAlpha: 0, scale: 0.8 },
    { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' },
  );
  tl.to(one('[data-am-send]'), { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1 }, '+=0.25');
  tl.fromTo(
    one('[data-am-toast]'),
    { autoAlpha: 0, y: '0.6em' },
    { autoAlpha: 1, y: 0, duration: 0.45 },
  );
  tl.addLabel('form-done');
  hold(1.8);

  // Footer: the areas and hours an agent reads.
  scrollTo('foot');
  show('foot');
  tl.addLabel('foot', '-=0.3');
  tl.fromTo(
    q('[data-am-area]'),
    { autoAlpha: 0, scale: 0.85 },
    { autoAlpha: 1, scale: 1, duration: 0.35, stagger: 0.08, ease: 'back.out(2)' },
    'foot',
  );
  tl.addLabel('foot-done', 'foot+=0.6');
  hold(1.6);

  // Back to the top, and round again.
  tl.to(page, { '--sy': 0, duration: 1.2, ease: 'power3.inOut' });
  show('hero');
  return tl;
}
