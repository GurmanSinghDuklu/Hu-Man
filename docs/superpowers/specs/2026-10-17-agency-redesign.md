# Agency redesign (2026-10-17, branch `agency-redesign`)

Gurman's brief: the site read like a CV. Restructure it like a real software agency: lead with what
the agency focuses on, show the portfolio, nothing personal, keep it professional. Visual references
(in `reference/agency-redesign/`, taken for feel, not copied): pixel-block mosaics over black-and-white
portraits, a face with square cells missing, RGB-split glitch portraits, glitch fragments between two
hands, a torn-paper "Hu/man" collage, Swiss shapes over a photo, a grid of circles revealing a face.
Some sections may be dark blue or dark purple. Fonts unchanged.

Approved decisions (all three "yes"):
1. "We" voice throughout, from `docs/brand/copy-draft.md`, and the hero line "Your site, rebuilt and found."
2. Mosaics built from the fingerprint scan and real project frames, not AI-generated people (the brand
   bans those). Swap in real black-and-white photos (hands, screens) if Gurman shoots them later.
3. Each portfolio project gets its own case-study page.

## Structure

| # | Section | Ground | Notes |
|---|---|---|---|
| 1 | Hero | Ink | Label "Your human in the loop", H1, lede, two buttons, Open status. Right: 9 x 8 cell mosaic of the fingerprint scan in Paper, Signal blocks over it, three Ink cells dropped out, four black-and-white project frames. Cells cut on at load; four blink now and then. |
| 2 | What we do (`#services`) | Night | Three focus areas (Web, AI, Search), each marked by one small square module from the kit. Care plans moved out (they are in the monthly plans in pricing). |
| 3 | Selected work (`#work`) | Ink | `WorkGrid`: five project tiles linking to `/work/<slug>/`, filter All / Live / Concepts. Tiles are black and white with Signal blocks at rest; on hover or focus, colour snaps in and a Pulse/Signal glitch slice runs for 0.36 s. |
| 4 | Concept lab (`#concepts`) | Paper | The ten concept renders, labelled as concept designs for fictional businesses. The old "Real projects" list (Lloyds, Arm) is gone. |
| 5 | Try the enquiry assistant | Plum | Chat demo unchanged; Ink and Paper pixel fragments around the phone. |
| 6 | How it works (`#process`) | Night | Five steps, plus the tools line that replaced the tools marquee. |
| 7 | Pricing | Ink | Unchanged apart from the "we" intro. |
| 8 | Questions (FAQ) | Paper | "We" answers. |
| 9 | Free presence audit (`#audit`) | Plum | "We" copy, Signal ticker (was Volt). |

Removed: the stat tiles (Intro), the tools marquee, the hero collage and its long key line, RealWork,
the services preview, the eyebrow labels and the one-highlighted-word headlines (`.eyebrow`, `.hl`),
GitHub and LinkedIn links in the footer (personal profiles), "Hi Gurman" in mailto bodies.

## Colour glitches and module bands (same day, second round)

Gurman: remove the Essence frames beside the fingerprint; the picture should keep glitching in
different colours, not just green, across the site; use the brand pack's module kit all over the site
(patterns from the Hu/man design-system artifact), with the real fingerprint scan, not the drawn ones.

- Hero mosaic: Essence frames replaced by kit modules (checker, hex, stripes, burst, half disc,
  halftone). Every Signal block flashes Pulse, Flare, Volt, Scan or Paper on its own 2 to 5 s clock;
  every fourth block steps through all the colours continuously; Pulse, Scan and Flare copies of the
  print jump sideways (an RGB split in brand colours); Volt and Paper scan bars flash across.
- `ModuleBand.astro`: a 12-module strip from the kit (3 presets) with neon flashes, placed under the
  hero, between Selected work and the Concept lab, between Pricing and the FAQ, and on every case page.
  Patterns only: the posters' sample wording (offices in London, Toronto and Sydney, "AI score 82",
  "05 rounds of changes", the Gift) isn't true of the business, so none of it is used.
- Work tiles: each has its own block colour and glitch colours, and glitches by itself now and then.
- What we do: photos cut by shapes looked odd, then 3 x 2 modular posters were too big (Gurman), so
  each area now has one small square module (4.5rem) beside a mono label (01 · Web), glitching in
  another colour now and then.
  background colour). Reduced motion stops every one.

## Navbar logo glitch

Hovering or focusing the header logo glitches it every 2 s: two extra copies of the real artwork (the
Paper logo, recoloured Pulse and Paper by CSS) show as clipped bands that jump sideways while the logo
shakes, in hard steps. Transform and opacity only; off under reduced motion. The logo is never retyped.

## Case-study pages

`src/pages/work/[slug].astro` from `src/data/projects.ts` (the single source for every project label),
plus `/work/` (the grid on its own). Each page: meta line, title, summary, relationship, disclaimer for
unofficial work, live link for live sites, cover, The brief / What we built / Scope (Night), screens and
walkthrough clips, next project and audit button (Plum).

Concept copy describes only what the screenshots show. Eldeva is "Mock-up for a family business. Not
live." Tesla and Spider-Man carry their "Not affiliated with..." line on the tile and the page;
Spider-Man also says it uses game imagery from PlayStation.com.

Clips use `preload="none"`, native controls (WCAG 2.2.2 pause), autoplay muted only while on screen,
never under reduced motion or Data Saver (`src/scripts/clips.ts`). Posters ship as 800 px WebP: as the
original JPEGs they cost 250 kB and dropped the Tesla page to 91.

## Copy written for this redesign (not in docs/03 or the copy draft)

- Work: "Selected work" / "Live sites we've designed and built, and concept work that isn't live. Every tile says which. Open one to see how it was made."
- Focus area titles: "Websites, booking and payments", "AI assistants and automations", "Local and AI-search visibility". Service tags read "From Launch" etc. (the tier each first appears in, docs/02).
- Concept lab title: "Concept lab".
- Project summaries, briefs and "What we built" text: `src/data/projects.ts` (live ones from the earlier approved case studies).
- Case page: "The brief", "What we built", "Scope", "Screens", "Next project", "Want something like this for your business?", "Visit the live site".

## Checks at the end of the build

Lighthouse home 99/100/100/100; case pages 98 to 100 performance, 100 on the rest. axe: 0 violations on
all nine pages. Keyboard walk in a sensible order with visible focus everywhere; reduced motion stops
every animation and clip autoplay.
