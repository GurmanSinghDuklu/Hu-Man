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
