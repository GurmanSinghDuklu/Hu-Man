# Light-first modernised redesign — design spec

Status: approved by Gurman, 2026-09-22. Supersedes the palette/some layout guidance in
`docs/03-site-spec.md` (that doc's copy, sector data, concept-renderer spec, technical
requirements and hard rules are unchanged — only the "Design direction" section's palette and
card treatment are superseded by this spec).

## Why

Gurman reviewed the built site (Phases 0–4) and asked for a more modern, higher-end look,
referencing an Instagram post of an agency site ("LUME Agency") with a dark canvas, bold
condensed type, pill tags and a tight brand-swatch panel. Two directions were mocked up as a
comparison artifact: **A** (light-first, modernised: warm off-white ground, terracotta accent,
bolder type, pill tags, rounded-card grid) and **B** (dark-first: near-black ground, teal/mint
accent, glow effects). Gurman chose **Option A, light-first**, keeping dark mode as the toggle
option rather than the default (unchanged from the current site's behaviour).

## Palette

| Token | Hex | Role | Replaces |
|---|---|---|---|
| Chalk | `#FAF9F6` | page background | `--color-chalk` `#F1F2EE` |
| Surface | `#F1EFEA` | card/row backgrounds, table header row | derived `color-mix` surface |
| Ink | `#14120F` | text, headings | `--color-ink` `#0E1116` |
| Muted | `#5C574E` | secondary text (warm-biased, not neutral grey) | `--color-muted` `#4C5563` |
| Terracotta | `#C4471F` | primary accent: buttons, links, tags, focus ring | `--color-klein` `#1F3BD6` |
| Sage | `#7A8B5C` | sparing highlight: slider knob, "Introductory" tag only | `--color-highlighter` `#FFE94A` |
| Stone | `#E4E0D8` | hairline borders/dividers | `--color-stone` `#D9DBD3`, warmed to match the new chalk |

Contrast, computed (WCAG 2.2 relative luminance formula):

| Pair | Ratio | Verdict |
|---|---|---|
| Ink on Chalk | 17.76 | AA (normal + large) |
| Muted on Chalk | 6.81 | AA (normal + large) |
| Terracotta on Chalk | 4.67 | AA (normal text) |
| White on Terracotta | 4.92 | AA (normal text) — use white text on terracotta buttons/tags |
| Ink on Terracotta | 3.80 | AA large text only — do not use ink-on-terracotta for body-size text |
| Ink on Sage | 5.05 | AA (normal text) — **use ink, not white, as the sage tag's text colour** |
| White on Sage | 3.70 | **fails AA for normal text** — do not use white on sage |
| Sage on Chalk | 3.51 | AA large text only — fine for the slider knob (a shape, not text) but do not set body-size text directly in sage on chalk |
| Ink on Surface | 16.27 | AA (normal + large) |
| Muted on Surface | 6.24 | AA (normal + large) |

**Action for implementation**: the "Introductory" price tag (sage background) must use **ink**
text, not white — this is the opposite of the current yellow tag, which also uses ink, so no
regression there, just confirming it stays correct with the new sage value.

Dark theme: derive a parallel dark palette (background near `#14120F`-adjacent but not identical
— keep the warm bias), don't naively invert. Terracotta and sage both need dark-mode variants
checked for contrast the same way, before shipping. This is implementation work, not decided
here — the implementer computes and records the dark-mode ratios the same way as above before
committing.

## Type

Unchanged typefaces: Bricolage Grotesque (display), Newsreader (body) — both already installed
via `@fontsource-variable`, no new dependency.

Changes from current tokens:
- Headline weight: 700 (was 600 for H1 specifically; other headings already 700)
- Letter-spacing on display type: `-0.03em` (was `-0.02em`)
- New: a pill-badge type treatment (small, 700 weight, `font-size: 0.7–0.75rem`, used for tier
  names on pricing, service category tags, "in progress" credential flags)

## Layout: rounded-card grid replaces bordered rows

Current pattern (Phases 0–4): repeated content (services, pricing table rows, credentials,
concept gallery captions) uses **hairline-bordered rows** — a horizontal line between each item,
no card shape.

New pattern, applied **consistently** across every repeated-content section (per Gurman's
answer — not limited to the hero/services):
- **Services**: a grid of rounded cards (border-radius ~10–12px), each with a pill tag (service
  category — e.g. "Launch", "Growth", "Full presence", matching the pricing tier it belongs to)
  and a heading + one-line description. Cards share a 1px hairline seam between them (as in the
  Option A mockup), not individual drop shadows — keeps it restrained, not "everything is a
  card" per the studio's own anti-pattern list.
- **Pricing**: existing desktop table stays a table (structurally correct for comparison data —
  do not convert to cards on desktop, that would lose the comparison-at-a-glance value).
  Mobile's existing stacked-card view already matches this new visual language closely; update
  its corner radius, tag colour and border treatment to match the new tokens.
- **Concept gallery**: tiles already have `border-radius: var(--radius-md)` from Phase 2 — update
  the token value and the caption typography (pill treatment for the sector type label) rather
  than restructuring.
- **Credentials list**: currently plain hairline-separated rows (Phase 1). Convert to the same
  card treatment; the "in progress" flag becomes a pill badge instead of the current bordered
  text badge.
- **FAQ**: stays as native `<details>` — this is a disclosure pattern, not a comparison or
  gallery grid, so the card treatment does not apply. Only the open/close indicator and hairline
  colour update to match new tokens.

**What does NOT change**: page structure/section order, all copy (hero, services descriptions,
FAQ answers, credentials text, pricing text) is unchanged — this is a visual system change only.
The compare slider's mechanics (tabs, keyboard operation, one-time nudge, `aria-hidden` mocks)
are unchanged; only its knob colour (sage, was yellow highlighter) and frame border-radius update.
The six sector mock palettes (`src/data/sectors.ts`) are unchanged — those are each fictional
business's own brand, independent of the studio's own site palette.

## What is explicitly out of scope for this change

- No new fonts.
- No new dependencies.
- No copy changes.
- No changes to the concept-renderer sector data, the chat demo script, or any hard-rule content
  (credentials, prices, honesty labelling) — only the visual system.
- No deploy — this stays local until Gurman reviews the rebuilt site, per the project's standing
  rule to ask before deploying or publishing.

## Acceptance criteria

1. All tokens in `src/styles/tokens.css` updated to the new palette (light + dark), both manual
   toggle and `prefers-color-scheme` paths.
2. Every repeated-content section (services, concept gallery, credentials) uses the rounded-card
   grid pattern; pricing table/mobile-cards and FAQ updated to match colours/radii without
   restructuring.
3. Contrast re-verified computationally (same method as above) for every text/background pair
   actually used in the rebuilt components, including the dark theme — not just the pairs listed
   in this spec, since components may combine tokens in ways not enumerated here.
4. Lighthouse accessibility stays 100 (or the specific regression is found and fixed, as happened
   in Phase 2 with the sector-mock booking cards).
5. axe: 0 violations, both themes, all pages (home, privacy, 404).
6. Screenshots at 360/768/1280, both themes, reviewed before reporting done.
7. Honesty check re-run (no copy changed, but confirms nothing broke while touching every
   component file).
