# Hu/man rebrand and visual redesign (2026-09-23)

## Brief (from Gurman)
Rename the studio "Hu man" (styles floated: Hu.man, Hu_man, Hu/man, HUMAN, Hu-man) and rebuild the
site to match the design language of these references, as closely as copyright allows:

- https://dribbble.com/shots/27363742-Software-Development-Agency-Services-Page (primary: "LUME Agency")
- https://dribbble.com/ronasit (grid of app mock-ups on coloured tiles)
- https://www.pixelbeard.co/, https://codex-soft.com/, https://higgsfield.ai/marketing-studio

Requirements: highly visual, minimal text, a collection of project renders (app mock-ups featured),
the service suite legible at a glance, very high-end graphic and UI/UX quality.

## Decisions
- **Brand**: "Hu/man" (text) and "HU/MAN" (wordmark) + "Studio" descriptor, all in `src/config/site.ts`.
- **Art direction** (from the LUME shot's own branding sheet): near-black `#050810`, magenta `#9C0D7C`,
  blue `#1C6CDC`, white. Magenta radial glow behind the hero. Inter, mixing 800 upright with 200 italic
  in headlines. Pill tags, outline pill buttons, white "paper" band for the work gallery, gradient
  discipline panels with `+` accordions.
- **Single dark theme.** The light/dark toggle was removed: the reference is one art direction and
  a light variant would not match it. (Supersedes the light-first palette of 2026-09-22.)
- **Renders, not images.** No reference imagery is reused. Every mock-up is drawn in HTML/CSS/SVG
  (`src/components/renders/`, devices in `src/components/devices/`) with flat illustrations for
  people, food, ceramics, flowers and landscapes. They scale with container query units.
- **Honesty rules unchanged.** Every render is a fictional business (`.example` domains), labelled
  "Concept" on the tile or caption, and the gallery states they are not client work. Sample
  figures inside renders are sample content. Prices, credentials, FAQ and audit copy are unchanged
  from docs/01–03. The studio voice avoids "we" so it does not imply a team.
- **Dependencies**: added `@fontsource-variable/inter`; removed `@fontsource-variable/bricolage-grotesque`.
  Newsreader is kept for serif type inside the renders.

## Page structure
Header (wordmark, centred nav, audit pill, 4-dot menu) → hero (wordmark, discipline pills, lede,
four concept tiles) → services marquee → studio statement with render collage → concept work
(white, editorial grid + real projects) → Design / Development / AI and automation / Visibility
and care panels → assistant demo in a phone → how it works → pricing cards → about + credentials
→ FAQ (white) → free audit CTA with shape row → footer with oversized wordmark.

## Verification (at time of writing)
Lighthouse 97/100/100/100. axe 0 violations on home, privacy, 404 (renders included, no
exclusions). No horizontal overflow at 360/390/768/1280. Keyboard order checked; reduced motion
stops the marquee and badge.

## Revision 2 (same day): own identity, Webelix structure
Gurman liked the structure and content but did not want a like-for-like LUME copy. New reference:
a Webelix agency concept (green hero, centred uppercase "DESIGN.DEVELOP.DELIVER.", floating work
cards, client-logo row, centred about heading, big uppercase services list) plus codex-soft.com's
"hook" elements. Changes:
- **Palette**: deep emerald (`#072219` → `#17664b`) fading into warm white `#f4f5f0`, electric lime
  `#d4f25a` as the single accent. **Font**: Plus Jakarta Sans (Inter removed).
- **Hero**: sticky header with dot-separated uppercase nav; availability pill with pulsing dot;
  "DESIGN. BUILD. GROW."; three floating concept cards with "Concept work" and "Scroll down" labels.
- **Tools strip** replaces the client-logo row: tools and platforms from docs/01–02 as plain text,
  headed "Built with tools you and your customers already use" (never presented as clients).
- **Studio intro with count-up facts**, all from docs/02 or the site itself: £1,125 from, 2 revision
  rounds, 30-day quotes, 0 tracking cookies. No client statistics.
- **Services**: big uppercase list; on desktop the active row swaps a concept render in a sticky
  preview and auto-cycles while on screen.
- **Concept work**: filterable bento grid (All, Websites, Apps, Dashboards, AI) of nine renders.
- **Motion**: scroll reveals (JS-gated, so content shows without JS), floating cards, marquees,
  count-ups, scroll-driven process line, rotating audit badge, hover lifts. All off under reduced
  motion.
Lighthouse 99/100/100/100; axe 0 violations on all three pages with every reveal forced visible.

## Revision 3 (same day): neon on near-black
Gurman supplied two colour references (kept in `reference/colour/`): a Botanica visual identity and
an arrow-mark brand. Colours sampled from the images' pixels:
- **Neon green `#00FF30`** (reference2): the brand colour. Logo mark, heading highlights, active tab
  buttons, services active state, process numbers and line, eyebrow dots, pulse, audit badge,
  featured pricing card.
- **Acid / neon yellow `#ADFF00`** (reference1): the energy colour. Primary buttons, the moving audit
  ticker, "Introductory" and "In progress" tags.
- The two meet only as a gradient: the hero's "GROW." and the footer wordmark.
- **Background** near-black `#07080A` with graphite surfaces (`#0E1013`, `#15181C`) and hairline
  white borders; soft neon glows instead of flat colour fields.
- **White bands** for concept work and FAQ (`.light`), where highlights become a neon highlighter
  swipe behind black text (neon text on white would fail contrast).
Layout, renders and copy unchanged. Lighthouse 99/100/100/100; axe 0 violations on all pages.

## Revision 4 (2026-09-27): "see, don't explain" hero and real work
- **Hero**: "The software agency of the future." (Gurman's slogan) beside a tilted 3D wall of work
  that scrolls in three columns in alternating directions. Real sites are tagged neon "Live"; all
  other tiles are tagged "Concept". Wall images are rasterised from the concept renders
  (`npm run concept-images`) and captured from the live sites (`npm run capture-sites`), then
  served as resized WebP by `astro:assets`.
- **Real work** section (`#real-work`), placed straight after the tools strip: The Calculator App
  and Essence Hair Treatment, each with a laptop whose screen auto-scrolls the live site, a phone
  with the mobile view, the brief, what was built and a link to the live site.
- **Honesty**: Gurman asked for copy saying the redesigns "helped generate more sales and use".
  That is an outcome claim that needs evidence under the CAP Code, so it is not on the site yet.
  Essence stays "built for a family business". He also asked for AI-generated designs presented
  as work "for X company"; any generated designs must be labelled as concepts for fictional brands.
  Higgsfield MCP tools were not available in the session, so no images were generated.

## Revision 5 (2026-09-27): About section removed
Gurman: "We are a software agency so no need to get personal." The About section (intro paragraph,
photo slot, credentials list) is gone, along with its nav link; the intro's "More about me" button
now reads "Explore services". The `credentials` data is kept in `src/data/content.ts` for reuse.
This supersedes docs/03's About and credentials section and the open photo question in docs/09.

## Revision 6 (2026-09-28): Higgsfield-style collage hero
Reference: higgsfield.ai/marketing-studio "Explore templates" wall. The hero is now a compact
headline strip, filter chips (All, Live projects, Websites, Apps, Dashboards, AI) and a dense,
edge-to-edge justified collage filling the rest of the first screen. Live site screenshots pan
like screen recordings; concept tiles drift and zoom. Every tile is tagged "Live" or "Concept",
with a key beside the chips. Filtering switches to an even grid. Tiles accept video later.

## Revision 7 (2026-09-28): no text on collage tiles
Gurman asked for no text over the images. Tile captions are now screen-reader only; live sites
carry a small neon dot, explained by a key beside the filter chips ("Live sites I've built.
Everything else is a concept for a fictional brand."). That key is the concept label for the
wall and must stay while the wall mixes real and concept work.

## Revision 8 (2026-09-28): animated wordmark intro
A full-width "HU?MAN" wordmark tops the hero (`WordmarkIntro.astro`, `scripts/wordmark-intro.ts`).
The neon separator cycles slot-machine style through / . * _ - + & : × ~ | # • (22 steps, easing
from 55 ms to ~475 ms), lands on a random one with a glow flash, then disappears while HU and MAN
close up and the weight animates 560 → 800, ending on "HUMAN". Built in CSS/JS rather than a
video file so it stays sharp and weighs ~1 kB. Runs once per load; reduced motion shows the
final HUMAN immediately; without JS it stays HU/MAN. The slogan h1 sits below it.

## Revision 9 (2026-09-28): slower, green, looping wordmark
Each separator now holds ~2 s and they run in a fixed order starting with "/". After the last one
the word merges, turns bold and sweeps from white to neon green (a two-tone gradient whose
background-position slides), holds ~3 s, then reopens on "/" in white and loops (~31 s cycle).
Reduced motion: static green HUMAN.

## Revision 10 (2026-09-28): wordmark ends on HU/MAN
"/" is no longer in the cycle (. * _ - + & : × ~ | # •). The final state keeps the slash: the last
separator swaps to "/", the slot tightens to the slash's natural width (0.46em at weight 800) and
the whole word, slash included, turns bold green, matching the footer wordmark. Loops back to ".".
Reduced motion: static green HU/MAN.

## Revision 11 (2026-10-01): Spider-Verse misprint glitch
Replaces the separator slide-swap with a glitch modelled on the studio-logo opening of *Spider-Man:
Into the Spider-Verse*. White HU?MAN (faint Ben-Day dot texture, plates slightly off register)
holds ~2 s with one small blip, then a ~1.2 s burst at ~12 fps: cyan, magenta and acid halftone
plates slip apart, seven horizontal strips tear sideways, the word jolts and skews, and the
separator flickers through the variants before snapping to the bold green HU/MAN. Holds ~3.4 s,
then a short burst returns it to white on the next separator. Only transforms and opacity change
per frame (strip clip-paths are static). The white/green swap happens at most three times per
burst, inside WCAG 2.3.1's three-flashes-a-second limit. Pauses off screen and in hidden tabs.
Reduced motion: static green HU/MAN without plates.

## Revision 12 (2026-10-01): alternate-universe typefaces
No more separator symbols: the word is always HU/MAN (or Hu/Man / hu/man). Every 2 s (now 1 s, see below) it glitches
into the next of 20 typeface treatments (Newsreader italic, mono, outline, Impact, Didot, comic,
typewriter, script, Copperplate, Futura, hairline, chrome, halftone, Rockwell, rounded, LCD,
Georgia, condensed, marker, WordArt), then glitches back to the bold green brand logo and holds it
with no effect for 30 s (~72 s cycle). Styles live as data in `WordmarkIntro.astro`; fonts are
self-hosted or system faces with generic fallbacks (no new downloads), and each style also differs
in fill, stroke or case so a missing system font still reads as a new version. The script scales
each style to fill the column and the stage has a fixed height, so nothing below shifts. Use
`data-styles`, not `data-count`, on the wordmark: `motion.ts` turns any `[data-count]` element into
a number count-up.

Revision 12b (same day): 1 s per style (4-frame glitch, ~0.67 s readable). Only the final glitch
back to the logo flickers, keeping colour swaps under three flashes a second. Cycle ~52 s.

Revision 12c (same day): each glitch picks one of nine transition effects at random (tear, dots-only
misprint, wave, interlace, CRT collapse, shake, dropout, vertical roll, plate burst), never the same
twice running; the final glitch back to the logo chains three. Effects live in `EFFECTS` in
`wordmark-intro.ts`.

## Revision 13 (2026-10-01): Spider-Verse universes
Reference: the *Into/Across the Spider-Verse* opening logos (YouTube SyIVY7Hl46E), where every logo
cut changes the whole frame, not just the type. The wordmark is now a full-width band (negative
margins out to the viewport, matching padding so the word keeps the column size, `overflow: clip`
so crops never cause sideways scroll). Each of the 20 "universes" in `WordmarkIntro.astro` sets a
typeface and treatment plus a CSS-drawn background world (sunset, neon grid, Marvel-red rays, comic
dots, paper, violet, halftone storm, lens flare, teal, blue disc, CMY dots, graffiti, acid) and a
camera (close-up crops, tilts); two use outlined echo copies. New glitch effects: colour-bar
datamosh (max two frames), light streak, echo burst and camera punch, alongside the earlier nine.
The brand-logo hold has a transparent band, so it sits on the plain hero with no effects for 30 s.
Flash safety: one universe swap per glitch, no flicker, colour bars at most two frames.

## Revision 14 (2026-10-01): real work only in the collage
Gurman asked to remove the fictional-brand concept tiles from the hero collage and use his own
projects. The 24 tiles now come from four projects: The Calculator App (two new pages, compound
interest and retirement, from his screenshots) and Essence, both Live; Eldeva (a mock-up for a
family member's real candle business, not live) and an unofficial Tesla fan site, both tagged
Concept on the tile. Eldeva and Tesla frames were extracted from his screen recordings with
AVFoundation and cropped below the browser chrome (no tabs, address bar or menu bar). Filter
chips are now All, Live sites, Concepts and one per project. The key line spells out what each
concept is and that the Tesla site is not affiliated with Tesla, Inc. The render JPEGs in
`src/assets/concepts/` are no longer used on the site.
