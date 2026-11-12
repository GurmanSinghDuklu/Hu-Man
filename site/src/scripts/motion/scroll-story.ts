/**
 * Scroll-story motion in the hanusek.com style (Gurman, 2026-11-12). The rule: motion that only
 * moves or fills follows the scroll; nothing that switches content ever does. GSAP ScrollTrigger,
 * loaded on idle with GSAP by index.ts, after the /contact/ intro, never under reduced motion.
 *
 * - [data-handoff] sections (every page's hero, and the band before some dark bands): as the next
 *   section scrolls up over it, the section sinks at under half speed, shrinks a touch and dims, so
 *   the next one seems to slide over it. Bands are opaque (base.css), so the sinking part is hidden.
 * - [data-scrub="words"] statements darken word by word as they move up the window, from
 *   --scrub-from (a grey that still passes AA on its band) to their own colour.
 * - [data-rise] elements rise and grow into place as they enter. They move through --rise-y and
 *   --rise-s on the `translate` and `scale` properties, so card tilts (a `transform`) still apply.
 *   An element rises or reveals (data-reveal), never both. data-rise="2" travels a little further,
 *   so a row of cards arrives staggered.
 * - [data-draw] SVG drawings: their pathLength="1" strokes draw on as the drawing crosses the
 *   window, and [data-draw-fill] parts fade in once the lines are down.
 *
 * Nothing here changes the opacity of text, so contrast checks pass at every scroll position.
 */
type Gsap = typeof import('gsap').gsap;
type ScrollTriggerClass = typeof import('gsap/ScrollTrigger').ScrollTrigger;
type SplitTextClass = typeof import('gsap/SplitText').SplitText;

export function startScrollStory(
  gsap: Gsap,
  ScrollTrigger: ScrollTriggerClass,
  SplitText: SplitTextClass,
): void {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  document.documentElement.classList.add('scroll-story');

  // ---- hand-offs: the section sinks and dims as the next one slides over it ----
  for (const section of document.querySelectorAll<HTMLElement>('[data-handoff]')) {
    const shade = document.createElement('span');
    shade.className = 'handoff-shade';
    shade.setAttribute('aria-hidden', 'true');
    section.append(shade);
    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      })
      .to(
        section,
        { y: () => Math.min(section.offsetHeight, window.innerHeight) * 0.45, scale: 0.95 },
        0,
      )
      .to(shade, { opacity: 0.35 }, 0);
  }

  // ---- statements that darken word by word ----
  for (const el of document.querySelectorAll<HTMLElement>('[data-scrub="words"]')) {
    const from = getComputedStyle(el).getPropertyValue('--scrub-from').trim();
    if (!from) continue;
    SplitText.create(el, {
      type: 'words',
      wordsClass: 'scrub-word',
      aria: 'none',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { color: from },
          {
            color: getComputedStyle(el).color,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%', end: 'bottom 52%', scrub: true },
          },
        ),
    });
  }

  // ---- elements that rise and grow into place ----
  for (const el of document.querySelectorAll<HTMLElement>('[data-rise]')) {
    const extra = Number(el.dataset.rise) || 0;
    gsap.fromTo(
      el,
      { '--rise-y': `${70 + extra * 28}px`, '--rise-s': 0.94 },
      {
        '--rise-y': '0px',
        '--rise-s': 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 58%', scrub: 0.6 },
      },
    );
  }

  // ---- line drawings that draw themselves ----
  for (const svg of document.querySelectorAll<SVGElement>('[data-draw]')) {
    const lines = svg.querySelectorAll('[pathLength]');
    const fills = svg.querySelectorAll('[data-draw-fill]');
    gsap
      .timeline({
        scrollTrigger: { trigger: svg, start: 'top 88%', end: 'center 50%', scrub: 0.5 },
        defaults: { ease: 'none' },
      })
      .fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.07, duration: 1 })
      .fromTo(fills, { opacity: 0 }, { opacity: 1, stagger: 0.15, duration: 0.6 }, '-=0.4');
  }

  // Layout moves after start (fonts, lazy images, the pinned step lists' runways): re-measure.
  let timer = 0;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);
}
