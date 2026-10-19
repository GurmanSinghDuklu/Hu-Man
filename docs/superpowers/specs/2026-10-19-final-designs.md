# Final designs build (2026-10-19, branch `agency-redesign`)

Gurman supplied three final page designs and asked for the site to match them exactly in fonts,
images, colours and structure: `reference/final-designs/home.jpg`, `services.jpg`, `pricing.jpg`,
plus `portrait.jpg` (the hero face; Gurman confirmed he has the rights). This replaces the neon,
glitch and module look of 2026-10-17.

## Decisions (Gurman, 2026-10-19)
- **Prices**: the design's 8 tiers, 4 care plans and 6 add-ons are built, but are still drafts and may
  change. They live in one file (`site/src/data/pricing.ts`, mirrored in docs/02 "Draft pricing").
- **Portrait**: used as designed; the "Placeholder AI model" caption is dropped.
- **Name and city**: Leeds is the base. No personal name on the pages: "Gurman, by name" became "A real
  person you can name", "a reply from Gurman" became "a reply from a real person", "Book a 15-minute
  call with Gurman" became "Book a 15-minute call". No GitHub or LinkedIn in the footer. The privacy
  notice still names him, because it must name who handles the data.
- **Removed**: the /work case-study pages, concept lab, chat demo, render sheet and walkthrough videos.

## Pages
- `/` Home: hero collage (Lens 01), facts strip, Be honest (Ink) with the free AI check, Human in the
  loop steps, owner dashboard mock-up, Agentic AI-ready cards, Our work (Essence, Eldeva concept, The
  Calculator App, windows cut by `site/scripts/crop-work.mjs`), price arches, Your move, Talk to a human.
- `/services/`: hero (Lens 02), eight services, Website builder vs Hu/man, Our promise, Five steps.
- `/pricing/`: hero (Lens 03), 8 price arches, Tier by tier, Care plans (Draft badge), add-ons, FAQ.

## Changes from the design, for honesty
- "Most picked" on the Launch + Dashboard arch became "Our pick": nobody has bought yet.
- The free check form has no backend; it opens an email with the address filled in, and says so.
- "Build my site" and "Not yet" open emails (no booking tool or mailing-list service yet).
- The vertical "humansoftwareagency.com" text in the hero is left out: no domain has been chosen.

## Need Gurman's confirmation before launch
- "1 day: reply on working days" (the design noted "set your own target").
- 3 revision rounds (docs/02 said two).
- Prices and care plans (drafts).

## Build notes
- Grid unit `--u` = 1/16 of the page (max 100px); desktop layouts and headline sizes are in units,
  measured from the designs, so the page keeps the design's proportions at any desktop width.
- Colours were sampled from the design images (`site/src/styles/tokens.css`).
- Fonts unchanged (Montserrat 800, Archivo, IBM Plex Mono) plus Newsreader italic for the hero line.

Checks: Lighthouse home 98, services 99, pricing 100 (100 on the other three scores everywhere);
axe 0 violations on all five pages; keyboard order and focus rings checked; reduced motion shows all.
