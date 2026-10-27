# Motion across the site ("B · Alive")

Date: 2026-10-27. Status: approved and built (branch `motion`). See "As built" at the end.

## Goal

The site feels static. Make it catch the eye and hold attention with motion that is smooth, on
brand and never laggy, without losing Lighthouse 95+ or WCAG 2.2 AA.

Chosen level: **B · Alive**. Entrance moves play once as each section comes into view, and gentle
ambient movement keeps going while people read (shifting gradients, drifting shapes, a services
ticker, hover lifts). Not chosen: A (entrances only), C (kinetic type, word swaps).

## Rules (all pages)

1. Scrolling only scrolls. No scroll-scrubbed or pinned effects; reveals play by themselves when a
   section enters the viewport (IntersectionObserver / ScrollTrigger `once: true`, no `scrub`).
2. **Top-of-page headlines never animate** (home hero h1, every InnerHero h1): they are the LCP
   element, and animating the hero headline cost ~10 performance points before.
3. Only `transform` and `opacity` animate. No animated `clip-path` or filters on large elements.
4. Reduced motion: everything shown at once, no Lenis, no loops, shaders draw one still frame, the
   logo stays ink.
5. No JavaScript: all content visible (hidden states gated on the `.js` class, as now).

## Tools

Installed from npm and bundled by Astro (served from our domain; still no third-party scripts):

| Package | Version | Use |
|---|---|---|
| `gsap` | 3.15.0 (pinned) | Entrance timelines, SplitText line reveals, staggers, the pricing arches growing |
| `lenis` | 1.3.26 (pinned) | Smooth wheel/trackpad scrolling; touch keeps native scrolling |
| `@paper-design/shaders` | 0.0.81 (pinned, pre-1.0) | WebGL mesh-gradient backgrounds on up to 3 panels per page |

Ambient loops (drift, float, spin, ticker, hover lifts, button sweeps) are plain CSS.

## Code layout

- `src/scripts/motion/index.ts`: boots after first paint (`requestIdleCallback`, fallback
  `setTimeout`); does nothing beyond showing content under reduced motion. Replaces
  `src/scripts/motion.ts`.
- `src/scripts/motion/reveals.ts`: GSAP + SplitText. Keeps `data-reveal` and adds variants:
  `data-reveal` (fade up, default), `="lines"` (split h2 into lines, slide up from a mask),
  `="stagger"` (direct children rise one after another), `="grow"` (children scale up from the
  bottom, used by the pricing arches), `="slide"` (children slide in from the right), `="scan"`
  (rows appear one by one, tags pop).
- `src/scripts/motion/smooth.ts`: Lenis, with in-page anchor links and the sticky header offset
  handled; touch devices keep their native scrolling (Lenis's default), and it is off under reduced motion.
- `src/scripts/motion/shaders.ts`: mounts a Paper Shaders mesh gradient on `[data-shader]`
  (`ideas`, `talk`, `arch`), colours from the palette tokens, speed 0.15-0.4, max 3 per page,
  device pixel ratio capped at 1.5. The element's current CSS gradient stays as the poster until
  the shader is ready, then the canvas fades in. Runs only while on screen; pauses when the tab is
  hidden. Skipped (CSS gradient stays) without WebGL, with Data Saver on, or with
  `navigator.deviceMemory <= 2`.
- `src/components/Ticker.astro`: a running strip of the service area titles from
  `src/data/services.ts`. `aria-hidden` (the words are on the page already), pauses on hover, and
  has a visible pause button (WCAG 2.2.2: moving content over 5 s needs a way to stop it).
- `src/styles/base.css`: utility classes for loops (`.amb-drift`, `.amb-float`, `.amb-spin`,
  `.amb-pulse`), hover lifts, the button fill-sweep and nav underline sweep, all inside
  `@media (prefers-reduced-motion: no-preference)`.

## What moves where

### Navbar logo: RGB colour cycle

The header logo's fill cycles through every hue like an LED strip, smoothly and continuously:
`oklch(0.6 0.2 var(--hue))` with `--hue` registered via `@property` (`<number>`) and animated
0 to 360 over 12 s, linear, infinite (about 30 degrees of hue a second, so a new colour roughly
every second with no visible steps). The artwork is unchanged (fixed paths from
`logo-ink.svg`); only its fill is overridden in `SiteHeader.astro`. The existing hover glitch
bands stay. The footer logo does not change. Reduced motion: ink. Browsers without `@property`
keep the ink logo.

### Home

| Section | Motion |
|---|---|
| Hero | Collage tiles snap in cell by cell; orb drifts; sparkle turns; gradient arch becomes a shader (`arch`). Headline static. |
| Below the stats | New `Ticker` of service areas. |
| Bringing your ideas to life | Panel is a shader (`ideas`, indigo/lilac/sky); step cards `stagger`. |
| Pretty isn't enough | Heading `lines`; stacked pills `slide`. |
| Free AI check | Sample rows `scan`; the "Sample result · Example only" label stays. |
| Agentic AI-ready | Orb floats; a ring pulses. |
| Everything under one roof | Tiles `stagger`; hover lift plus a slow gradient shift. |
| Our work | Cards `stagger`; hover zooms the screenshot slightly inside its frame. |
| At the centre | Circles drift slowly; "HUMAN" pulses gently. |
| Pricing arches | Arches `grow` from the baseline in price order. |
| Talk to a human | Banner is a shader (`talk`, orange/pink/indigo); sparkle turns. |

### Inner pages

Services, Pricing, Work, About, How we build, Agentic AI-ready, Free AI check, Contact: hero
collages assemble the same way; section headings use `lines`; card and step grids use `stagger`;
the Talk banner shader wherever the banner appears. Legal pages, thanks and 404: default fade only.

### Everywhere

Buttons get a fill sweep on hover; nav links an underline sweep.

## Performance and accessibility budget

- New JavaScript: one deferred bundle, target 60-75 kB gzipped, loaded after first paint.
- Lighthouse 95+ (all four scores) on every page; if a page drops below, cut motion on that page
  rather than relax the target. axe 0 violations (the axe script keeps forcing reveals visible).
- Keyboard focus is never hidden or moved by an animation.
- CSP: bundled scripts are same-origin; check WebGL/blob needs against `security.csp` and
  `public/_headers` before shipping.

## Testing

Build, typecheck, `npm test`, Lighthouse on every page, axe on every page, a reduced-motion pass
(screenshots with `reducedMotion: 'reduce'`), keyboard walk, screenshots at 360/768/1280px, and
the shaders and logo checked in Chromium, Firefox and WebKit.

## Out of scope

Kinetic headline word swaps and giant outline marquees (level C). A contact page video (parked).
Changes to copy.

## As built (2026-10-27)

Differences from the design above, all made to keep performance at 95+:
- **Shaders start on the first interaction** (scroll, pointer, key, touch), not on idle: compiling
  them cost ~270 ms of script on Lighthouse's throttled phone and took home to 94. Until then each
  panel shows its own CSS gradient.
- **Lenis loads only with a mouse or trackpad** (`(hover: hover) and (pointer: fine)`): touch keeps
  native scrolling anyway, and Lenis cost ~410 ms there.
- **In-page links are handled by our own code**, not Lenis's `anchors`: a not-yet-revealed target
  sits 28px low, so we measure where it will settle. Focus moves to the target.
- **Keyboard focus reveals its section at once** (a focused link must never be invisible).
- **No separate `stagger` variant**: grids keep per-item `data-reveal` with `--reveal-delay`.
  `grow` and `scan` are CSS-only; GSAP is used for SplitText line headings.
- **CSP**: Paper Shaders inserts one `<style>`; its hash is allowed in `astro.config.mjs`.

Results: Lighthouse performance 97-100 on all ten content pages, accessibility, best practices
and SEO 100; axe 0 violations on 15 pages; `npm run motion-check` clear in Chromium, Firefox and
WebKit. Motion JavaScript 44 kB gzipped in total, 1.6 kB of it loaded up front.
