# Light-first modernised redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the built Duklu Digital site (Phases 0–4) to the terracotta/sage/warm-off-white
palette and rounded-card grid layout approved in
`docs/superpowers/specs/2026-09-22-light-redesign-design.md`, with zero copy changes and zero
regressions in accessibility, keyboard operation or honesty.

**Architecture:** This is a token-and-component restyle, not a rebuild. Task 1 swaps the palette
in `src/styles/tokens.css` (light + dark), which most components inherit automatically because
they're already written against CSS custom properties, not hardcoded colours. Tasks 2–5 update
the handful of components that need structural changes (rounded-card grid instead of bordered
rows) rather than just inheriting new token values: Services, ConceptWork gallery captions,
About/credentials, and a small data addition (service → tier tag mapping). Task 6 is the full
verification pass (contrast, Lighthouse, axe, keyboard, screenshots, honesty) that the working
agreements in `CLAUDE.md` require after any build phase — treated the same way here even though
this isn't a numbered roadmap phase.

**Tech Stack:** Astro 7, TypeScript 6, plain CSS custom properties (no preprocessor, no
Tailwind), existing Playwright/Lighthouse/axe tooling already in `site/scripts/`.

---

## File map

| File | Change |
|---|---|
| `site/src/styles/tokens.css` | Replace palette tokens (light + dark), update `--radius-md` if needed |
| `site/src/data/content.ts` | Add `tag` field to each `Service` entry (tier name) |
| `site/src/components/Services.astro` | Rounded-card grid + pill tag per service |
| `site/src/components/ConceptWork.astro` | Pill-style sector type label in gallery captions; card radius update |
| `site/src/components/About.astro` | Convert credentials list to rounded-card grid; badge → pill |
| No changes needed | `Pricing.astro`, `CompareSlider.astro`, `MockSite.astro`, `Faq.astro`, `base.css` buttons — all already reference tokens that update automatically. Confirmed by reading each file before writing this plan (see conversation). |

---

### Task 1: Update design tokens (light + dark palette)

**Files:**
- Modify: `site/src/styles/tokens.css:1-70` (entire file)

- [ ] **Step 1: Read the current file to confirm line numbers haven't drifted**

Run: `cat site/src/styles/tokens.css`

Confirm it still matches the 70-line structure with `:root { ... }`, the
`@media (prefers-color-scheme: dark)` block, and the `:root[data-theme='dark']` block.

- [ ] **Step 2: Replace the entire file with the new palette**

Write `site/src/styles/tokens.css`:

```css
/**
 * Design tokens. Light theme is the default and follows prefers-color-scheme.
 * A manual toggle sets [data-theme="light"|"dark"] on <html> and wins over
 * the media query. See docs/superpowers/specs/2026-09-22-light-redesign-design.md
 * for the palette and the computed contrast ratios behind these values.
 */
:root {
  --color-chalk: #faf9f6;
  --color-surface-tint: #f1efea;
  --color-ink: #14120f;
  --color-muted: #5c574e;
  --color-terracotta: #c4471f;
  --color-terracotta-ink: #ffffff;
  --color-sage: #7a8b5c;
  --color-sage-ink: #14120f;
  --color-stone: #e4e0d8;

  --color-bg: var(--color-chalk);
  --color-surface: var(--color-surface-tint);
  --color-text: var(--color-ink);
  --color-text-muted: var(--color-muted);
  --color-accent: var(--color-terracotta);
  --color-accent-ink: var(--color-terracotta-ink);
  --color-border: var(--color-stone);
  --color-highlight: var(--color-sage);
  --color-highlight-ink: var(--color-sage-ink);
  --color-focus-ring: var(--color-terracotta);

  --font-display: 'Bricolage Grotesque Variable', system-ui, sans-serif;
  --font-body: 'Newsreader Variable', Georgia, serif;

  --measure: 65ch;
  --content-max: 1200px;
  --gutter: 1.25rem;

  --radius-sm: 6px;
  --radius-md: 12px;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2.5rem;
  --space-6: 4rem;
  --space-7: 6rem;

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-bg: #1a1713;
    --color-surface: #242019;
    --color-text: #f2eee6;
    --color-text-muted: #b8afa0;
    --color-accent: #e37b4c;
    --color-accent-ink: #1a1713;
    --color-border: #332d24;
    --color-highlight: #a8bb86;
    --color-highlight-ink: #1a1713;
    --color-focus-ring: #e37b4c;
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
  --color-bg: #1a1713;
  --color-surface: #242019;
  --color-text: #f2eee6;
  --color-text-muted: #b8afa0;
  --color-accent: #e37b4c;
  --color-accent-ink: #1a1713;
  --color-border: #332d24;
  --color-highlight: #a8bb86;
  --color-highlight-ink: #1a1713;
  --color-focus-ring: #e37b4c;
  color-scheme: dark;
}
```

Notes on what changed from the previous file:
- `--color-klein*` → `--color-terracotta*`, `--color-highlighter` → `--color-sage`, matching the
  spec's token names so the rename is traceable in git history.
- Added `--color-highlight-ink` (new token — the old file relied on hardcoded
  `color: var(--color-ink)` in `Pricing.astro`'s `.pricing__tag`; this plan's Task 1 keeps that
  working by coincidence since `--color-ink` is unchanged in light mode, but Task 3 will migrate
  `Pricing.astro` to use the new explicit token so dark mode also gets the correct ink-on-sage
  colour instead of accidentally inheriting light-mode ink).
- `--color-surface` is now a flat hex (`--color-surface-tint`) instead of `color-mix()` — the
  spec calls for `#F1EFEA` as a named token, not a derived tint. `color-mix()` is still valid CSS
  and still used elsewhere (`base.css` `.skip-link`? — confirmed not used elsewhere via grep
  below), removing it here just matches the spec table exactly.
- `--radius-sm` 4px→6px, `--radius-md` 8px→12px: the spec's card treatment calls for
  "border-radius ~10–12px" on cards; `--radius-sm` is nudged up proportionally so buttons/tags
  (which use `--radius-sm`) don't look flat next to the new, more rounded cards.

- [ ] **Step 3: Confirm `color-mix` isn't used elsewhere and would be orphaned**

Run: `grep -rn "color-mix" site/src/`

Expected: no results outside `tokens.css` (which no longer uses it after Step 2). If any
component uses `color-mix()` directly, note it — that's fine, `color-mix()` support isn't being
removed from the codebase, just no longer used for `--color-surface`'s definition.

- [ ] **Step 4: Build and confirm no CSS errors**

Run: `cd site && npx astro build 2>&1 | tail -20`
Expected: `[build] Complete!`, 0 errors.

- [ ] **Step 5: Verify every token consumer still resolves (no undefined var fallback)**

Run:
```bash
cd site && npx astro build > /dev/null 2>&1 && grep -o "var(--color-[a-z-]*)" dist/index.html | sort -u
```
Expected: this lists every `--color-*` custom property referenced in the built HTML/inline
styles. Manually cross-check each name against the token list in Step 2 — every name must exist
in `tokens.css`. (This catches a renamed token that a component still references under its old
name, which would silently fall back to `unset`/transparent rather than erroring.)

- [ ] **Step 6: Commit**

```bash
cd site && git add src/styles/tokens.css
git commit -m "Redesign: swap to terracotta/sage palette in design tokens

Light and dark values both computed and contrast-checked against
docs/superpowers/specs/2026-09-22-light-redesign-design.md. Renamed
--color-klein* to --color-terracotta*, --color-highlighter to
--color-sage, added --color-highlight-ink for the ink-on-sage tag
text colour (previously relied on --color-ink coinciding in light
mode only).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Verify contrast for the new tokens computationally

This is the "test" for Task 1 — a computed-contrast check standing in for a unit test, matching
the verification method already used in Phases 0–4 (see `docs/superpowers/specs/2026-09-22-
light-redesign-design.md`'s own table, which this step re-derives independently to catch a
transcription error between the spec and the CSS file).

**Files:**
- Create: `site/scripts/check-contrast.mjs` (temporary verification script — delete after Task 6
  confirms everything passes, or keep if useful for future palette changes; developer's call,
  not required to persist)

- [ ] **Step 1: Write the contrast-checking script**

Write `site/scripts/check-contrast.mjs`:

```js
/**
 * Standalone WCAG contrast checker for the redesign token pairs. Not part of
 * the build; run manually after any tokens.css change. See
 * docs/superpowers/specs/2026-09-22-light-redesign-design.md for the pairs
 * this must satisfy.
 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const chan = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrast(hex1, hex2) {
  const l1 = luminance(hexToRgb(hex1)) + 0.05;
  const l2 = luminance(hexToRgb(hex2)) + 0.05;
  return Math.max(l1, l2) / Math.min(l1, l2);
}

const pairs = [
  // [label, foreground, background, minimum required]
  ['light: ink on chalk', '#14120f', '#faf9f6', 4.5],
  ['light: muted on chalk', '#5c574e', '#faf9f6', 4.5],
  ['light: terracotta on chalk', '#c4471f', '#faf9f6', 4.5],
  ['light: white on terracotta (button/tag text)', '#ffffff', '#c4471f', 4.5],
  ['light: ink on sage (tag text)', '#14120f', '#7a8b5c', 4.5],
  ['light: ink on surface', '#14120f', '#f1efea', 4.5],
  ['light: muted on surface', '#5c574e', '#f1efea', 4.5],
  ['dark: text on bg', '#f2eee6', '#1a1713', 4.5],
  ['dark: muted on bg', '#b8afa0', '#1a1713', 4.5],
  ['dark: terracotta on bg', '#e37b4c', '#1a1713', 4.5],
  ['dark: bg on terracotta (button/tag text)', '#1a1713', '#e37b4c', 4.5],
  ['dark: bg on sage (tag text)', '#1a1713', '#a8bb86', 4.5],
  ['dark: text on surface', '#f2eee6', '#242019', 4.5],
];

let failed = false;
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrast(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}: ${ratio.toFixed(2)} (need ${min})`);
}

if (failed) {
  console.error('\nOne or more pairs failed AA contrast.');
  process.exit(1);
}
console.log('\nAll pairs pass AA.');
```

- [ ] **Step 2: Run it**

Run: `cd site && node scripts/check-contrast.mjs`

Expected: every line says `PASS`, ending with `All pairs pass AA.` and exit code 0. These exact
numbers were pre-computed in the conversation that produced this plan (light pairs: 17.76, 6.81,
4.67→ wait, re-check: terracotta-on-chalk was 4.67 in the earlier computation using `#faf9f6`,
confirm it still reads ≥4.5 with the exact hex in the script above — it should, since these are
the same values). If any line prints `FAIL`, stop — do not proceed to Task 3 with a palette that
fails contrast; adjust the failing token's hex slightly darker/lighter (toward the background for
better contrast) and re-run until it passes, then go back and update `tokens.css` (Task 1) to
match.

- [ ] **Step 3: Commit**

```bash
cd site && git add scripts/check-contrast.mjs
git commit -m "Add standalone contrast checker for the redesign token pairs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Migrate `Pricing.astro`'s tag to the explicit ink-on-sage token

**Files:**
- Modify: `site/src/components/Pricing.astro:184-193`

- [ ] **Step 1: Read the current `.pricing__tag` rule**

Run: `sed -n '184,193p' site/src/components/Pricing.astro`

Expected output:
```css
  .pricing__tag {
    display: inline-block;
    background: var(--color-highlight);
    color: var(--color-ink);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.75rem;
    padding: 0.15em 0.5em;
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-1);
  }
```

- [ ] **Step 2: Change `color: var(--color-ink)` to the new explicit token**

In `site/src/components/Pricing.astro`, change:
```css
    background: var(--color-highlight);
    color: var(--color-ink);
```
to:
```css
    background: var(--color-highlight);
    color: var(--color-highlight-ink);
```

Why: `--color-ink` and `--color-highlight-ink` happen to be the same hex value in light mode
(both `#14120f`), so this change is invisible in light mode — but in dark mode `--color-ink` is
not defined at all (the file only defines `--color-text`, `--color-bg`, etc., not a raw `--color-
ink` override), so without this fix the tag text would silently fall back to whatever `--color-
ink` resolves to outside the dark block (the light value, `#14120f`, on a dark sage background —
wrong, and also outside this plan's verified pairs). Using `--color-highlight-ink` guarantees it
tracks the theme correctly, matching Task 2's dark-mode pair `bg on sage`.

- [ ] **Step 3: Build and check the rule compiled correctly**

Run: `cd site && npx astro build 2>&1 | tail -10 && grep -o "\.pricing__tag[^}]*color:[^;]*" dist/_astro/*.css`

Expected: build completes with 0 errors; the grep shows the tag rule now references
`var(--color-highlight-ink)`.

- [ ] **Step 4: Commit**

```bash
cd site && git add src/components/Pricing.astro
git commit -m "Fix pricing tag text colour to track theme via explicit token

--color-ink isn't redefined in dark mode, so the tag text was
silently using the light-mode ink value even in dark mode. Use the
new --color-highlight-ink token instead, which is defined in both
themes and verified against the sage background in Task 2.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Add tier tags to services data and rebuild Services as a card grid

**Files:**
- Modify: `site/src/data/content.ts:1-42` (the `Service` interface and `services` array)
- Modify: `site/src/components/Services.astro` (entire file)

- [ ] **Step 1: Read the current `Service` interface and array**

Run: `sed -n '1,42p' site/src/data/content.ts`

- [ ] **Step 2: Add a `tag` field to the interface and populate it from docs/02's own tier structure**

In `site/src/data/content.ts`, change:
```ts
export interface Service {
  title: string;
  description: string;
}
```
to:
```ts
export interface Service {
  title: string;
  description: string;
  /** Which pricing tier this first appears in, per docs/02-offer-and-pricing.md's "Includes"
   * column. Care plans is the recurring monthly add-on across all tiers, not one tier, so it
   * uses "Care plan" rather than a tier name. */
  tag: string;
}
```

Then update each entry in the `services` array (the six objects) to add the `tag` field. The
mapping, taken directly from `docs/02-offer-and-pricing.md`'s "Includes" column (do not invent
new tier names):

```ts
export const services: Service[] = [
  {
    title: 'Website redesign and launch',
    tag: 'Launch',
    description:
      'Fast, mobile-first sites for businesses stuck on old or unloved Squarespace, Wix or WordPress setups. Moves your content and redirects your old addresses so you keep the search rankings you have earned.',
  },
  {
    title: 'Booking and online payments',
    tag: 'Growth',
    description:
      'Customers book, pay a deposit or order straight from your site through providers such as Stripe, Square and SumUp. Card details never touch my code.',
  },
  {
    title: 'AI enquiry assistant',
    tag: 'Growth',
    description:
      'Answers questions from your own prices, hours and FAQs at any time, collects details and hands over to you. I test it against real questions before launch.',
  },
  {
    title: 'Local and AI-search visibility',
    tag: 'Growth',
    description:
      'Google Business Profile, service pages, reviews and structured data, plus a monthly check on whether Google and ChatGPT mention you. Nobody can promise placement in AI answers, so I focus on the fundamentals Google says matter.',
  },
  {
    title: 'Automations',
    tag: 'Full presence',
    description:
      'Missed-call text-back, quote follow-ups, payment reminders and a weekly summary of what needs your attention.',
  },
  {
    title: 'Care plans',
    tag: 'Care plan',
    description: 'Hosting, updates, backups and small edits every month.',
  },
];
```

This is a factual cross-reference addition (which tier each service is first listed under in
docs/02), not new copy — no description text changes, satisfying the redesign spec's "no copy
changes" constraint (a tag naming an existing tier is structural metadata, not new marketing
claims).

- [ ] **Step 3: Typecheck**

Run: `cd site && npx astro check 2>&1 | tail -15`
Expected: 0 errors. (This will currently show errors if `Services.astro` hasn't been updated yet
to handle the new required `tag` field in its render — TypeScript itself won't error on an added
field, but do this check again after Step 5 to be sure.)

- [ ] **Step 4: Rewrite `Services.astro` as a rounded-card grid with pill tags**

Write `site/src/components/Services.astro`:

```astro
---
import { services } from '../data/content';
---

<section class="services wrap" id="services" aria-labelledby="services-heading">
  <h2 id="services-heading">What I do</h2>
  <ul class="services__grid">
    {services.map((service) => (
      <li class="services__card">
        <span class="services__tag">{service.tag}</span>
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </li>
    ))}
  </ul>
</section>

<style>
  .services {
    padding-block: var(--space-6);
    border-top: 1px solid var(--color-border);
  }

  .services__grid {
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
    display: grid;
    gap: 1px;
    background: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .services__card {
    background: var(--color-surface);
    padding: var(--space-4);
  }

  .services__tag {
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    color: var(--color-accent-ink);
    background: var(--color-accent);
    padding: 0.2em 0.6em;
    border-radius: 999px;
    margin-bottom: var(--space-2);
  }

  .services__card h3 {
    margin-bottom: var(--space-2);
  }

  .services__card p {
    color: var(--color-text-muted);
    max-width: 60ch;
  }

  @media (min-width: 48rem) {
    .services__grid {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
```

Design notes matching the spec: cards share a 1px hairline seam via the `gap: 1px; background:
var(--color-border)` grid trick (each card's own background shows through, the 1px gaps show the
border colour — this is the same "shared seam, not per-card shadow" technique implied by the
Option A mockup and named explicitly in the spec as "not... individual drop shadows"). The tag
uses `--color-accent`/`--color-accent-ink` (terracotta/white in light mode, already verified in
Task 2) — pricing tier tags are not the same as the "Introductory" sage highlight, which stays
reserved for the slider knob and the pricing tag per the spec's "sparing" instruction.

- [ ] **Step 5: Typecheck again**

Run: `cd site && npx astro check 2>&1 | tail -15`
Expected: 0 errors, 0 unused-field warnings.

- [ ] **Step 6: Lint and format**

Run: `cd site && npx eslint . 2>&1 | tail -20 && npx prettier --write . 2>&1 | tail -20`
Expected: 0 lint errors; Prettier reports the two changed files formatted (or unchanged if
already compliant).

- [ ] **Step 7: Build**

Run: `cd site && npx astro build 2>&1 | tail -15`
Expected: `[build] Complete!`, 0 errors.

- [ ] **Step 8: Commit**

```bash
cd site && git add src/data/content.ts src/components/Services.astro
git commit -m "Redesign: services as a rounded-card grid with tier pill tags

Adds a tag field to each Service entry (the pricing tier it first
appears under, per docs/02's Includes column — structural metadata,
not new copy). Services.astro now renders a shared-seam card grid
instead of hairline-separated rows, per
docs/superpowers/specs/2026-09-22-light-redesign-design.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Update ConceptWork gallery captions to a pill treatment

**Files:**
- Modify: `site/src/components/ConceptWork.astro:75-79` (the `.concept-work__tile figcaption`
  rule and its markup)

The tile frames already have `border-radius: var(--radius-md)` (Phase 2), which picks up the new
12px value automatically from Task 1 — no change needed there. Only the caption's sector-label
needs a pill treatment per the spec ("update the caption typography — pill treatment for the
sector type label").

- [ ] **Step 1: Read the current gallery markup and caption style**

Run: `sed -n '14,27p;75,79p' site/src/components/ConceptWork.astro`

Expected: the figcaption currently renders as one plain sentence:
`{sector.typeLabel} — concept design for a fictional business. {sector.galleryIncludes}.`

- [ ] **Step 2: Split the type label into its own pill span, keep the rest of the sentence plain**

In `site/src/components/ConceptWork.astro`, change:
```astro
          <figcaption>
            {sector.typeLabel} — concept design for a fictional business. {sector.galleryIncludes}.
          </figcaption>
```
to:
```astro
          <figcaption>
            <span class="concept-work__tile-tag">{sector.typeLabel}</span>
            concept design for a fictional business. {sector.galleryIncludes}.
          </figcaption>
```

This is a markup-only change — the visible words are identical (same label, same "concept design
for a fictional business" honesty phrase, same includes text), only how `typeLabel` is wrapped
changes, so the mandatory "concept design for a fictional business" labelling is untouched.

- [ ] **Step 3: Add the pill style, in the same `<style>` block, near the existing figcaption rule**

In `site/src/components/ConceptWork.astro`, change:
```css
  .concept-work__tile figcaption {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: var(--space-2);
  }
```
to:
```css
  .concept-work__tile figcaption {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: var(--space-2);
  }

  .concept-work__tile-tag {
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    color: var(--color-accent-ink);
    background: var(--color-accent);
    padding: 0.15em 0.55em;
    border-radius: 999px;
    margin-right: var(--space-2);
  }
```

- [ ] **Step 4: Typecheck, lint, build**

Run: `cd site && npx astro check 2>&1 | tail -10 && npx eslint . 2>&1 | tail -10 && npx astro build 2>&1 | tail -10`
Expected: 0 errors throughout.

- [ ] **Step 5: Commit**

```bash
cd site && git add src/components/ConceptWork.astro
git commit -m "Redesign: pill treatment for concept gallery sector labels

Markup-only change — same honesty-required 'concept design for a
fictional business' text, sector label now wrapped in a pill span.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Convert the credentials list to a rounded-card grid

**Files:**
- Modify: `site/src/components/About.astro` (entire file)

- [ ] **Step 1: Read the current file**

Run: `cat site/src/components/About.astro`

(Already read in full during planning — reproduced above in this conversation. Confirm it still
matches before editing, since another task in this plan doesn't touch this file, but re-check in
case of drift.)

- [ ] **Step 2: Rewrite the credentials section as a card grid, badge as a pill**

In `site/src/components/About.astro`, change the credentials `<ul>` markup from:
```astro
      <h3>Credentials</h3>
      <ul class="about__credentials">
        {credentials.map((credential) => (
          <li>
            {credential.text}
            {credential.inProgress && <span class="about__badge">In progress</span>}
          </li>
        ))}
      </ul>
```
to:
```astro
      <h3>Credentials</h3>
      <ul class="about__credentials">
        {credentials.map((credential) => (
          <li class="about__credential">
            <span>{credential.text}</span>
            {credential.inProgress && <span class="about__badge">In progress</span>}
          </li>
        ))}
      </ul>
```

(Added `class="about__credential"` to the `<li>` and wrapped the text in a `<span>` so flex
layout — used below — can separate the credential text from the badge without disturbing text
flow when there's no badge.)

- [ ] **Step 3: Replace the credentials list styles**

In `site/src/components/About.astro`, change:
```css
  .about__credentials {
    list-style: none;
    margin: var(--space-3) 0 0;
    padding: 0;
  }

  .about__credentials li {
    padding-block: var(--space-2);
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    max-width: 65ch;
  }

  .about__credentials li:last-child {
    border-bottom: 1px solid var(--color-border);
  }

  .about__badge {
    display: inline-block;
    margin-left: var(--space-2);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.7rem;
    color: var(--color-accent);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    padding: 0.1em 0.5em;
  }
```
to:
```css
  .about__credentials {
    list-style: none;
    margin: var(--space-3) 0 0;
    padding: 0;
    display: grid;
    gap: 1px;
    background: var(--color-border);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .about__credential {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    color: var(--color-text-muted);
  }

  .about__badge {
    flex-shrink: 0;
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    color: var(--color-accent-ink);
    background: var(--color-accent);
    padding: 0.2em 0.6em;
    border-radius: 999px;
  }
```

Same shared-seam grid technique as Task 4's Services card, applied to a single-column list of
rows. The badge switches from an outlined text badge (border + accent text) to a filled pill
(accent background + accent-ink text) to match the pill language used everywhere else in this
redesign — same visual family as the services tag and the concept gallery tag.

- [ ] **Step 4: Typecheck, lint, build**

Run: `cd site && npx astro check 2>&1 | tail -10 && npx eslint . 2>&1 | tail -10 && npx astro build 2>&1 | tail -10`
Expected: 0 errors throughout.

- [ ] **Step 5: Commit**

```bash
cd site && git add src/components/About.astro
git commit -m "Redesign: credentials as a rounded-card grid, badge as a pill

Same shared-seam card technique as the services grid. 'In progress'
badge switches from an outlined text badge to a filled pill to match
the tag language used elsewhere in the redesign. No credential text
changed.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Full verification pass (contrast, Lighthouse, axe, keyboard, screenshots, honesty)

This mirrors the checks CLAUDE.md's "Working agreements" require after any build phase — applied
here even though this redesign isn't a numbered roadmap phase, per the same standing agreement.

**Files:** none modified in this task unless a check fails and a fix is needed (then loop back
to the relevant earlier task's file).

- [ ] **Step 1: Full build**

Run: `cd site && npx astro check 2>&1 | tail -15 && npx eslint . 2>&1 | tail -15 && npx prettier --check . 2>&1 | tail -10 && npx astro build 2>&1 | tail -20`
Expected: 0 typecheck errors, 0 lint errors, Prettier reports all files compliant, build
completes with `[build] Complete!`.

- [ ] **Step 2: Re-run the standalone contrast checker from Task 2**

Run: `cd site && node scripts/check-contrast.mjs`
Expected: `All pairs pass AA.`, exit code 0.

- [ ] **Step 3: Run Lighthouse**

Run: `cd site && node scripts/lighthouse.mjs 2>&1 | tail -15`
Expected: accessibility 100, performance ≥95 (matches Phase 4's 98), best-practices 100, seo 100.
If accessibility drops below 100, find the failing audit the same way Phase 2 did (read
`reports/lighthouse/report.json`, look at `categories.accessibility.auditRefs` for any audit with
`score < 1`) — the most likely culprit given this redesign is a text/background pair not covered
by Task 2's pre-checked list (e.g. `.services__tag` on `--color-surface` rather than on
`--color-bg`, if those differ enough to matter — verify with the same contrast formula before
assuming it's fine).

- [ ] **Step 4: Run axe against all three pages, both themes**

Run:
```bash
cd site && cat > axe-redesign-check.mjs <<'EOF'
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startServer } from './scripts/serve.mjs';
import { fileURLToPath } from 'node:url';

const PORT = 4400;
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
const server = await startServer(distDir, PORT);
const browser = await chromium.launch();

const pages = ['/', '/privacy/', '/404.html'];
const themes = [undefined, 'dark'];
let totalViolations = 0;

for (const theme of themes) {
  for (const path of pages) {
    const context = await browser.newContext(theme ? { colorScheme: theme } : {});
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    console.log(`${path} (${theme ?? 'light'}): ${results.violations.length} violation(s)`);
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    }
    totalViolations += results.violations.length;
    await context.close();
  }
}

await browser.close();
server.close();
if (totalViolations > 0) process.exit(1);
EOF
node axe-redesign-check.mjs
rm axe-redesign-check.mjs
```
Expected: `0 violation(s)` on every line (6 combinations: 3 pages × 2 themes).

- [ ] **Step 5: Keyboard-test the new interactive surfaces (tag pills are decorative, not
      interactive — confirm they aren't accidentally in the tab order)**

Run:
```bash
cd site && cat > kb-redesign-check.mjs <<'EOF'
import { chromium } from 'playwright';
import { startServer } from './scripts/serve.mjs';
import { fileURLToPath } from 'node:url';

const PORT = 4401;
const distDir = fileURLToPath(new URL('./dist/', import.meta.url));
const server = await startServer(distDir, PORT);
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

const tagIsFocusable = await page.evaluate(() => {
  const tag = document.querySelector('.services__tag');
  return tag ? tag.tabIndex >= 0 && tag.matches(':focus-visible, a, button, input, select, textarea, [tabindex]') : null;
});
console.log('services tag accidentally focusable:', tagIsFocusable);

// Confirm the tag element itself has no tabindex attribute at all (the real check)
const tagHasTabindex = await page.evaluate(() => {
  const tag = document.querySelector('.services__tag');
  return tag ? tag.hasAttribute('tabindex') : null;
});
console.log('services tag has explicit tabindex (should be false/null):', tagHasTabindex);

await browser.close();
server.close();
EOF
node kb-redesign-check.mjs
rm kb-redesign-check.mjs
```
Expected: `services tag has explicit tabindex (should be false/null): false`. A `<span>` with no
`tabindex` is never in the tab order regardless of styling, so this should pass trivially — the
check exists to catch a copy-paste mistake if a future edit turns the tag into a `<button>` or
adds a stray `tabindex="0"`.

- [ ] **Step 6: Screenshots at 360/768/1280, both themes**

Run: `cd site && node scripts/screenshots.mjs 2>&1 | tail -10`
Expected: 6 files saved to `reports/screenshots/`.

- [ ] **Step 7: Look at the screenshots and critique**

Read each of the 6 PNGs in `site/reports/screenshots/` (`home-light-360.png`,
`home-light-768.png`, `home-light-1280.png`, `home-dark-360.png`, `home-dark-768.png`,
`home-dark-1280.png`). Check specifically:
- The services grid, concept gallery, and credentials list all show the new rounded-card/pill
  treatment consistently (not just the hero).
- Terracotta and sage read as intentionally different colours next to each other (the price tag
  vs. the CTA buttons) — not muddy or too similar.
- Dark mode: confirm the warm near-black background doesn't read as "broken/wrong colour" —
  it should look like a deliberate warm dark theme, not a bug.
- No layout shift, overflow or clipped text at any width.

If anything looks wrong, fix it in the relevant task's file and re-run from Step 1.

- [ ] **Step 8: Re-run the honesty check**

No copy changed in this plan, but every component file was touched — run the check anyway to
catch a copy-paste error (e.g. accidentally duplicating a credential's text while adding the
`.about__credential` class, or truncating a service description while adding the tag span).

Run:
```bash
cd site && grep -c "T Level in Digital Production\|Lloyds Banking Group\|CS50x\|PCEP\|FinBERT\|Spring Boot REST\|Essence Hair Treatment\|Claude Certified Architect\|AWS Cloud Practitioner\|Azure DevOps for CI\|C++ Foundations\|COBOL Basics" src/components/About.astro
```
Expected: `12` (one occurrence of each of the 12 phrases fragments — confirms no credential text
was dropped or duplicated). If the count is anything else, diff `src/components/About.astro`
against its state before Task 6 (`git diff HEAD~1` if Task 6 was the last commit affecting this
file) and find what changed.

Also re-run:
```bash
cd site && grep -c "£1,125\|£2,100\|£3,375\|£99\|£199\|£349" src/data/pricing.ts
```
Expected: `6` (unchanged from before this plan — pricing data was never touched).

- [ ] **Step 9: Update CLAUDE.md with a short status note**

In `/Users/mandeepduklu/duklu-digital/CLAUDE.md`, add a new section after the existing "Phase 4
status (done)" section (before "## Working agreements"):

```markdown
## Redesign status (done)
Re-skinned the site to the palette in `docs/superpowers/specs/2026-09-22-light-redesign-
design.md`: warm off-white/terracotta/sage replacing the original chalk/klein/highlighter tokens,
kept light-first (dark stays the toggle option, not the default — Gurman's choice after
reviewing a two-direction comparison artifact). Services, the concept gallery captions and the
credentials list moved from hairline-separated rows to a shared-seam rounded-card grid; pricing
table/mobile-cards, the compare slider and the concept-renderer sector mocks were already
token-driven so they picked up the new palette without structural changes. No copy changed — the
one data addition is a `tag` field on each `Service` entry naming its pricing tier, sourced
directly from docs/02's own "Includes" column.

Found and fixed one real bug while migrating: `Pricing.astro`'s "Introductory" tag used a
hardcoded `var(--color-ink)` for its text colour, which isn't redefined in dark mode — it would
have silently shown the light-mode ink colour on the dark-mode sage background instead of
tracking the theme. Added an explicit `--color-highlight-ink` token and fixed the reference.

All contrast pairs re-verified computationally (`site/scripts/check-contrast.mjs`, kept in the
repo for future palette changes). Lighthouse: performance/accessibility/best-practices/seo scores
from Task 7 Step 3's actual console output, in that order (e.g. "98/100/100/100"). axe: total
violation count across all 6 page/theme combinations from Task 7 Step 4's actual output (e.g.
"0 violations across all 3 pages x both themes").
```

(Replace the two result sentences above with the real Lighthouse/axe numbers once Task 7 finishes —
this is the one place in this plan where a value can't be pre-filled, because it depends on the
verification run's outcome.)

- [ ] **Step 10: Commit**

```bash
cd /Users/mandeepduklu/duklu-digital && git add CLAUDE.md
git commit -m "Document redesign status in CLAUDE.md

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-review notes (from writing this plan)

- **Spec coverage**: every acceptance criterion in the design spec maps to a task — palette
  (Task 1), card-grid on services/gallery/credentials (Tasks 4–6), pricing/slider/FAQ "update
  colours without restructuring" (satisfied automatically by Task 1's token swap, verified not
  to need code changes by reading each file during planning), contrast re-verification (Task 2 +
  Task 7 Step 2), Lighthouse/axe/screenshots/honesty (Task 7).
- **No placeholder found** except the one noted above in Task 7 Step 9, which is placeholder by
  necessity (a result that doesn't exist until the run happens), not by laziness — flagged
  explicitly rather than left silent.
- **Type consistency**: `Service.tag` (Task 4) is a plain `string`, used identically in
  `Services.astro`'s `{service.tag}`. No mismatched names across tasks.
