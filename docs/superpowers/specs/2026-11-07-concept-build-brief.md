# Brief for building one concept portfolio page (shared by every concept)

Read first: `docs/superpowers/specs/2026-11-07-portfolio-gallery.md` (rules + preview contract) and
look at `site/public/concepts/noor/index.html` for the conventions (head, @font-face from `../fonts/`,
the `.badge` markup and CSS at the end, GSAP from `../vendor/`).

## Deliverable
`site/public/concepts/<slug>/index.html`: one self-contained file (inline CSS + JS), 35–70 kB.
Touch nothing else except adding woff2 files to `site/public/concepts/fonts/` if you need a font that is
not there. To get a font: `mkdir -p /tmp/fonts-<slug> && cd /tmp/fonts-<slug> && npm init -y >/dev/null &&
npm i @fontsource/<name>` then copy only the latin woff2 weights you use. Never run npm inside `site/`.
Do not commit; do not edit other concepts, `preview.js`, or any Astro file.

## Must
1. `<html lang="en-GB">`, `<meta name="robots" content="noindex,nofollow">`, title "<Name>, <job> (concept portfolio)".
2. No outside hosts at all (no CDNs, no Google Fonts, no remote images). GSAP/ScrollTrigger/Draggable only via
   `../vendor/*.min.js` if you need them. No three.js: use CSS 3D, SVG or canvas 2D.
3. Badge, exactly as in noor (same markup and the "HU/MAN concept badge" CSS block), linking `../../portfolio/`.
4. `<script src="../preview.js" defer></script>` as the last script before `</body>`.
5. The hero is alive on its own (an idle loop runs without any input) so a small preview tile shows motion.
6. Mouse effects read `clientX/clientY` from `pointermove`/`mousemove` listeners on `window` or `document`.
   Hover effects that matter visually must ALSO be driven from JS (`mouseover`/`mouseout` listeners that
   toggle a class), because the preview sends synthetic events and CSS `:hover` will not fire from them.
7. Scroll-driven effects use native scroll (ScrollTrigger or your own `scroll` listener). No smooth-scroll
   libraries, no wheel hijacking.
8. `prefers-reduced-motion: reduce`: no loops, no pinning/scrubbing; everything visible and readable.
9. Responsive from 360px to 1920px, no sideways scroll (`overflow-x: clip` on the page wrapper).
10. WCAG AA contrast for all text (check accent-on-colour pairs). Visible focus. Semantic headings, one h1.
11. Honest content: the person and employers are fictional (`.example` domains, e.g. `hello@priyanair.example`).
    No testimonials, star ratings, review counts, real company names or logos, awards, or "increased X by
    40%" style claims. Experience, skills, sample work and a contact block are fine. UK English, sentence case
    in body copy.
12. Art is CSS, SVG or canvas unless your brief lists generated photos/video in `<slug>/img/` (made with muapi for
    us, so we own them). Use only those files, by relative path; give every `<img>` a real alt and size attributes.
13. Do NOT copy the reference site: keep the interaction mechanic and the general feel described in your
    brief, but the layout, type, colours, art and words are your own.

## Test before you report
Playwright is in `site/node_modules` (run `npx playwright install chromium` from `site/` if the browser is
missing). Serve with `cd site/public && python3 -m http.server 4410` (pick a free port: 4410–4417 are
reserved per concept, use the one in your brief) and check:
- 1440x900 and 360x800 screenshots of the top and of 3–4 scroll positions; look at them and fix problems.
- `/concepts/<slug>/?preview` at 1440x900: wait 8 s, take 3 screenshots 3 s apart; the page should be
  scrolling itself and the hero/cursor effects visibly moving.
- Zero console errors; no request to any other host; `document.documentElement.scrollWidth <= innerWidth` at 360.
- Reduced motion (`reducedMotion: 'reduce'` context): page fully readable.
Save your final screenshots to `/tmp/concept-shots/<slug>-*.png`.

## Report back (short)
File size, fonts added, the interaction list as built, anything you could not do, and the screenshot paths.
