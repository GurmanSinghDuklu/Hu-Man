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
