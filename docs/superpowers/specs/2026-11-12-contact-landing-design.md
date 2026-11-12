# Contact page becomes the landing page, with a falling-tiles intro

Date: 2026-11-12. Branch `contact-landing`. Approved in chat by Gurman ("build").

## What the visitor sees
1. First contact visit in a browser session (sessionStorage `hm-contact-intro`): `/contact/` opens looking
   like the old contact page (site header, "Talk to a human." hero). The page cannot scroll (wheel, touch,
   keys).
2. After about 1.3 s from the start of the load it cracks into square tiles on the site grid (2 units on
   desktop, 1 below; at most 48 tiles, 32 on phones), shudders, and the tiles fall into black from the
   centre outwards.
3. 1.6 s of black, then the landing switches on like an old TV (Gurman, 2026-11-12, "without the fuzz"):
   a dot of light, stretched into a thin bright line, then the picture springs open from it, overshooting
   a touch, under a white flash that fades fast. The video starts as it opens; scrolling unlocks after.
   A "Skip intro" button shows while it plays (the intro runs about 6.5 s).
4. Below the video: the full contact form ("Tell us more"), "Or reach us directly", "What happens
   next", the free AI check card and the contact FAQ, in the landing's look (Ink ground, 22px rounded
   white and dark boxes, pill fields, flowing send button), then the site footer.

Later visits in the session, reduced motion and no JavaScript go straight to the landing screen. A click,
Escape or Enter skips the intro; a swipe or wheel does nothing.

## Decisions
- `/start/` stays as it is (no intro, corner legal links, no footer). Both pages use
  `components/landing/Landing.astro`; behaviour in `scripts/landing.ts`.
- `/contact/`'s white box keeps the contact wording ("Talk to a human." + the contact lede), so the
  headline that breaks is the one that comes back and the two indexed pages don't share an h1.
- No site header after the intro (landing page); the logo links home, the footer carries the nav.
- Pricing buttons' `?tier=` prefills the long form as before and rides along with the short form too
  (hidden `tier` field). The short form sends `via: "Contact page"`.

## How it works
- `ContactIntro.astro` (in BaseLayout's header slot, outside `<main>`): the cover sits in a `<template>`.
  An inline script (`scripts/inline/contact-intro-gate.js`, inlined verbatim and hashed into the CSP by
  `astro.config.mjs`) stamps it before first paint and sets `html.contact-intro` (overflow hidden).
  A 6 s failsafe uncovers the page if the animation script never starts.
- `scripts/contact-intro.ts`: builds the tiles a row per frame while the page is on show, each a live
  copy of the cover shifted into place (hidden parts stripped, ids removed), freezes CSS animations in
  page and copies at the same moment, then runs a GSAP timeline (transform and opacity only).
- `hm:intro-done` (`scripts/contact-intro-state.ts`) starts the video, Lenis and scroll-fx, which all
  wait for it.
- The decorative hero uses `<InnerHero as="div">` so the page has one h1.

## Checks
`motion-check` covers the intro (plays once, locked during, scrolls after, video starts, not under
reduced motion); `axe` waits for the cover to go before scanning. Lighthouse /contact/ 95 (first-visit
intro included), /start/ 99.
