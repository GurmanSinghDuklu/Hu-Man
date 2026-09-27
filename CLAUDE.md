# Duklu Digital: project memory

Gurman Singh Duklu's solo web, AI and local-search studio (Bradford, UK). Working brand since 2026-09-23: **Hu/man** (wordmark "HU/MAN"), replacing "Duklu Digital". Still a working name: keep it in `src/config/site.ts` (`name`, `wordmark`, `descriptor`) so it is easy to change.

## Current goal
Build the studio's own marketing website: high-end, fast, local-SEO-ready, with concept before/after renders, services, pricing, credentials, FAQ and a free-audit contact path. Build it in the phases in `docs/08-roadmap.md`. Do not deploy, buy domains or publish anything without asking first.

## Who you are working with
- Gurman, 18, Bradford. Finished a T Level in Digital Production, Design and Development (Calderdale College). Placement at Lloyds Banking Group. Strong in JavaScript, TypeScript, React, Python and Java; comfortable with Git, Docker, REST APIs and Azure DevOps.
- Wants this as his full-time income, not a side job. Wants to grow aggressively but honestly.
- Has no employer, apprenticeship or benefits conflicts. Sole-trader registration is parked until nearer launch (see `docs/05-compliance-and-claims.md`).
- Explain things plainly and show your plan before big changes.

## Hard rules (never break)
1. No invented proof. No fake testimonials, ratings, review counts, client logos, awards, statistics or "as seen in". Concept work is labelled "Concept design for a fictional business" wherever it appears. Fictional domains use `.example`.
2. Credentials appear exactly as listed under "Verified credentials" in `docs/01-business-context.md`. Essence Hair Treatment was built unpaid for his aunt's business: call it "built for a family business", never a paid client. Claude Certified Architect is in progress: show it only as "in progress" until he confirms a pass. The Arm contribution is a submitted pull request unless he says it was merged.
3. No guarantees: not rankings, not Google AI Overviews or ChatGPT recommendations, not sales. State what is done and what is measured.
4. Publish only the contact details listed under "Public contact details". Never publish a home address.
5. UK English, sentence case, plain verbs. Buttons say what happens ("Get your free presence audit").
6. Prices come only from `docs/02-offer-and-pricing.md`. Do not invent, round or add prices.

## Stack (decided)
- Astro + TypeScript, static output.
- Plain CSS with design tokens (custom properties). Single art direction: near-black `#07080A` page, neon green `#00FF30` (brand) and acid yellow `#ADFF00` (CTAs, banners, tags), two white `.light` bands (concept work, FAQ). No theme toggle. Legacy token names (`--forest-*`, `--lime`, `--paper*`) are aliases onto this palette in `tokens.css`.
- Self-hosted fonts (`@fontsource`: Plus Jakarta Sans for UI/display, Newsreader for serif type inside renders), no Google Fonts requests.
- Small vanilla TypeScript islands only where needed: motion (reveals, count-ups, header state), services preview, gallery filter, chat demo, header menu close.
- No tracking, no cookies, no third-party scripts. Ask before adding any other dependency.
- Project lives in `site/` (Astro app root). Astro 7, TypeScript 6, Node 24.
- Commands (run from `site/`):
  - `npm run dev` — dev server.
  - `npm run build` — static build to `site/dist/`.
  - `npm run preview` — Astro's own preview (a singleton daemon; use `astro preview stop` if a port conflict shows up).
  - `npm run typecheck` — `astro check`.
  - `npm run lint` — ESLint (flat config, astro + typescript-eslint plugins) + `prettier --check`.
  - `npm run format` — `prettier --write .`.
  - `npm run check` — typecheck + lint + build, in one go.
  - `npm run lighthouse` — builds nothing itself (run `build` first); serves `dist/` on a throwaway static server (`scripts/serve.mjs`, not `astro preview`, to avoid its singleton-daemon port issue) and runs Lighthouse headless. Reports land in `reports/lighthouse/`.
  - `npm run axe` — same static-server approach, runs `@axe-core/playwright` against `dist/`, tags `wcag2a wcag2aa wcag22aa`.
  - `npm run screenshots` — Playwright screenshots of `dist/` at 360/768/1280px in light and dark (`colorScheme` emulation), saved to `reports/screenshots/`.
  - `npm run og-image` — rasterises `public/og-image.svg` to `public/og-image.png` (1200×630) via Playwright Chromium. Re-run and commit the PNG whenever the SVG changes; the PNG is what ships (most platforms don't render SVG for `og:image`).
  - `npm run concept-images` — rasterises every concept render on the internal `/render-sheet/` page to `src/assets/concepts/*.jpg` for the hero wall. Needs a fresh `dist/`: run `build`, then this, then `build` again.
  - `npm run capture-sites` — screenshots the two live projects (The Calculator App, Essence) into `src/assets/work/`. Re-run when either site changes.
  - Run `npm run build` before `lighthouse`, `axe` or `screenshots` — they all serve the built `dist/`, not the dev server.
  - Never put files in `dist/`: every build deletes it. Reference images go in `reference/`.

## Phase 1 status (done)
Static home page built: header/nav (with mobile `<details>` menu), hero with a labelled
before/after placeholder (slider itself is Phase 2), services, chat demo placeholder (Phase 2),
concept work gallery placeholders + real real-projects list, how-it-works, pricing comparison
table (desktop) / stacked cards (mobile, price first per tier), about + credentials, FAQ
(`<details>`), audit/contact, footer. Copy is verbatim from `docs/03-site-spec.md`. Reusable data
lives in `src/data/content.ts` (services, process, FAQ, credentials, real projects) and
`src/data/pricing.ts` (mirrors `docs/02-offer-and-pricing.md` — edit the doc first, then this
file). Lighthouse 99/100/100/100 (the one lost performance point is a diagnostic-only "cache
lifetime" insight from the throwaway test server with no cache headers; not a real regression).
axe: 0 violations on both themes.

## Phase 2 status (done)
Concept renderer built: `MockSite.astro` renders a before or after mock from `src/data/sectors.ts`
(all 6 sectors: barber, electrician, dental, physio, takeaway, salon — sample content for
fictional businesses, `.example` domains only). `CompareSlider.astro` + `src/scripts/compare-
slider.ts` drive the hero's draggable before/after (tabs: barber/electrician/dental, native range
input, one-time 50→35→50 nudge on first scroll into view, skipped under reduced motion).
`ChatDemo.astro` + `src/scripts/chat-demo.ts` is the real scripted chat (no network calls, script
verbatim from docs/03, ~700ms typing indicator, `aria-live="polite"`). `ConceptWork.astro` now
renders all 6 sectors as real `MockSite` "after" tiles instead of placeholders.

Two real bugs found and fixed during this phase, worth knowing about if you touch this code:
1. **CSS container query units and font-size**: an element cannot use its own `cqw`/`cqh` etc.
   for `font-size` if it is the element that establishes `container-type` — spec disallows it
   (circular dependency risk), and browsers silently fall back to the inherited size instead of
   erroring. `MockSite.astro` therefore splits into an outer `.mock-frame` (establishes the
   container) and an inner `.mock` (uses `font-size: 1.25cqw`). This bug only showed up in the
   narrow concept-gallery tiles, not the full-width slider, so test cqw-scaled components at
   their *smallest* rendered width, not just their largest.
2. **The native `hidden` attribute loses to any class rule that sets `display`** on the same
   element (specificity). `ChatDemo.astro`'s typing indicator had `display: flex` on its class,
   which silently defeated `hidden`. Fixed with an explicit `.chat-demo__typing[hidden] { display:
   none; }` override. Anywhere `el.hidden = true/false` is toggled from script, check for this.

Lighthouse 98/100/100/100 (accessibility briefly dropped to 97 from a contrast issue in the
booking-card price text on two sector palettes — accent-on-opacity dropped below AA on
dental/salon; fixed by using solid `--after-ink-on-accent` there instead of an opacity mute).
axe: 0 violations on both themes. Total inline JS ~3.2 kB (well under the ~50 kB budget; Astro
inlines these small islands directly into the HTML rather than emitting separate .js files for a
static build this size).

## Phase 3 status (done)
SEO/meta layer: `Seo.astro` (canonical, Open Graph, Twitter card, JSON-LD ProfessionalService)
included via `BaseLayout.astro`. JSON-LD is emitted once, homepage-only (`structuredData` prop on
BaseLayout) — repeating identical business schema on every page is redundant. Canonical link is
omitted on noindex pages (currently just 404). `public/og-image.svg` is the source; `npm run
og-image` (script: `scripts/generate-og-image.mjs`) rasterises it to `public/og-image.png`
(1200×630, committed) via the Playwright Chromium already installed for testing — most social
platforms don't reliably render SVG for `og:image`, so re-run this whenever the SVG changes.
`@astrojs/sitemap` added and configured (`astro.config.mjs`); `src/pages/robots.txt.ts` is
generated (not a static `public/` file) so its `Sitemap:` line can never drift from `site.url`.
New pages: `/404` (index={false} on BaseLayout, so noindex + no canonical) and `/privacy`
(indexable, draft flag at the top, describes the real no-tracking/mailto-only state honestly —
update before any paid work or new data collection).

Real bug found by `/seo-audit` and fixed: `SiteHeader.astro`'s nav anchors (`#services` etc.)
were hardcoded hash-only links, which do nothing from any page except the homepage (no matching
element exists on `/privacy` or `/404`). Fixed by prefixing with `/` when not on the homepage
(`Astro.url.pathname === '/'`). Check this pattern again if more pages are added — anything
linking to a homepage section from elsewhere needs the `/` prefix, not a bare `#anchor`.

Domain-dependent items are correctly still open (all `site.url`/`astro.config.mjs` `site` still
`https://example.com` per docs/09 item 8): GSC/Bing sitemap submission, JSON-LD `url` and every
canonical/OG URL will need the real domain once chosen — update `src/config/site.ts` and
`astro.config.mjs` together, then rebuild.

Lighthouse 98/100/100/100 (unchanged from Phase 2 — SEO metadata additions cost nothing).
axe: 0 violations across all three pages (home, privacy, 404). JSON-LD validated against
Schema.org's ProfessionalService requirements. `/seo-audit` passes on every buildable item; see
the audit output in this phase's report for the couple of domain-dependent items still open.

## Phase 4 status (done)
Full QA pass, no new features. Fixed a non-deterministic Prettier formatting bug in
`MockSite.astro`: a wrapped two-line CSS comment kept growing its indentation on every
`--write` run (never converged). Rewrote it as a single physical line — stable now. If Prettier
ever reports the same file dirty right after formatting it, suspect a wrapped comment and check
for this.

Cross-browser: installed Firefox and WebKit for Playwright (`npx playwright install firefox
webkit`, not installed by default) and ran the same functional checks (cqw font scaling, theme
toggle, slider drag, chat demo, console errors) across Chromium/Firefox/WebKit — identical
behaviour, zero console errors, on all three. Full keyboard tab-order walk (40 stops) confirmed
correct order and roving-tabindex on the sector tabs. Confirmed the compare slider resets to 50%
and switches panels correctly via arrow keys, matching the spec.

Full honesty check across the whole built site (all pages, all data files): 0 violations. Every
credential, price and concept label verified against docs/01, 02 and 03 source tables directly
(not just spot-checked) — sector sample prices in `src/data/sectors.ts` all trace verbatim to the
docs/03 table, no personal detail beyond the approved contact list appears anywhere, JSON-LD
address has no street-level detail.

Lighthouse 98/100/100/100, axe 0 violations on all 3 pages × both themes (6 combinations tested).
This is the end of the planned build phases (0–4) from `docs/08-roadmap.md`. Phase 5 (deploy,
domain, Search Console, first real content) needs decisions from Gurman and is not started.

## Redesign status (done)
Re-skinned the site to the palette in `docs/superpowers/specs/2026-09-22-light-redesign-
design.md`: warm off-white/terracotta/sage replacing the original chalk/klein/highlighter tokens,
kept light-first (dark stays the toggle option, not the default — Gurman's choice after
reviewing a two-direction comparison artifact). Services and the credentials list moved from
hairline-separated rows to a shared-seam rounded-card grid (`gap: 1px` plus a border-colour
background, so cards appear to share a hairline seam). The concept gallery only picked up the
pill-tag treatment on its sector-label caption, not the shared-seam grid — its tiles were already
`border-radius`-rounded from an earlier phase. Pricing table/mobile-cards, the compare slider and
the concept-renderer sector mocks were already token-driven so they picked up the new palette
without structural changes. No copy changed — the one data addition is a `tag` field on each
`Service` entry naming its pricing tier, sourced directly from docs/02's own "Includes" column.

Found and fixed one real bug while migrating: `Pricing.astro`'s "Introductory" tag used a
hardcoded `var(--color-ink)` for its text colour, which isn't redefined in dark mode — it would
have silently shown the light-mode ink colour on the dark-mode sage background instead of
tracking the theme. Added an explicit `--color-highlight-ink` token and fixed the reference.

All contrast pairs re-verified computationally (`site/scripts/check-contrast.mjs`, kept in the
repo for future palette changes). Lighthouse: 98/100/100/100 (performance/accessibility/best-
practices/seo), matching the Phase 4 baseline exactly. axe: 0 violations across all 3 pages ×
both themes (6 combinations).

## Hu/man redesign status (done, branch `hu-man-rebrand`)
Full visual rebuild to match the LUME Agency Dribbble shot and Ronas IT's mock-up grid (spec:
`docs/superpowers/specs/2026-09-23-hu-man-rebrand.md`). The before/after slider, `MockSite`,
`sectors.ts` and the theme toggle were removed. Concept work is now ten HTML/CSS/SVG renders in
`src/components/renders/` built on device frames in `src/components/devices/` (phone, laptop,
browser, tablet). Things worth knowing:
1. **Render styles are `<style is:global>` with a unique class prefix per render** (`bb-`, `sa-`,
   `td-`…). Astro's scoped styles do not reach a `class` passed into a child component, so scoped
   position rules on `<Phone class="x">` silently never applied (phones rendered at zero width).
2. **Devices scale with container query units**: the frame is the container and its inner body
   sets `font-size` from `cqw` (the Phase 2 rule still applies). Phone screen = 30em wide.
3. **Render text is held to AA contrast too.** Lighthouse and axe both scan it; the renders pass
   with no exclusions. Check `.ui-muted` and accent-on-white pairs when adding a render.
4. **The hero glow needs `isolation: isolate` + `overflow-x: clip` on `.hero`**: without the first
   the body background paints over it; without the second it causes horizontal scroll on phones.
5. **CSS is inlined** (`build.inlineStylesheets: 'always'`) and the Inter latin woff2 is preloaded,
   for first paint. `scripts/serve.mjs` now gzips text like a real host, so Lighthouse measures
   realistic transfer sizes. `scripts/axe.mjs` now scans home, privacy and 404.
Revision 2 (same day) swapped the LUME look for an own identity on a Webelix-style structure:
emerald/lime, Plus Jakarta Sans, tools strip instead of client logos, count-up facts, swapping
services preview, filterable bento gallery, scroll reveals. Two more gotchas:
6. **Scroll reveals hide content at opacity 0, and axe skips invisible elements.** `scripts/axe.mjs`
   forces every `[data-reveal]` visible before scanning; keep it that way. The hidden state is gated
   on the `.js` class so content shows without JS.
7. **After deleting components, restart `astro dev`.** It kept serving a stale module graph (all
   hero styles missing) until restarted; the production build was fine.
Revision 3 recoloured to neon on near-black from Gurman's references (`reference/colour/`, colours
sampled from the pixels). Neon text only on dark; on `.light` bands `.hl` becomes a highlighter swipe.
Lighthouse's mobile run treats ~17px bold as normal text, so greys in marquees need 4.5:1.
Revision 4 (2026-09-27) rebuilt the hero ("The software agency of the future." + a moving 3D wall of
Live and Concept tiles) and added a Real work section for The Calculator App and Essence. Wall and
case-study images live in `src/assets/` and go through `astro:assets` `<Image format="webp">`: as
plain JPEGs in `public/` they cost 1.4 MB and dropped Lighthouse performance to 77 (the wall image
became the LCP). Do not add outcome claims ("more sales") to case studies without evidence.
Revision 5 (2026-09-27) removed the About section at Gurman's request (no personal section on an
agency site). Credentials no longer appear on the site; the data stays in `content.ts`.
Lighthouse 96/100/100/100, axe 0 violations on all three pages.

## Working agreements
- Plan first with `/plan-site`, get approval, then build one phase at a time with `/build-phase N`.
- After each phase: build, typecheck, Lighthouse (aim for 95+ on all four scores), an axe accessibility check, a keyboard test, a reduced-motion test, and screenshots at 360, 768 and 1280px. Critique the screenshots and fix problems before reporting.
- Make small commits with clear messages. Never commit secrets.
- If a doc and this file disagree, ask. Update the docs when a decision changes.

## Read on demand
`docs/04-seo-plan.md`, `docs/06-go-to-market.md`, `docs/07-vertical-research.md`, `docs/09-open-questions.md`, `reference/`

## Imported context
@docs/01-business-context.md
@docs/02-offer-and-pricing.md
@docs/03-site-spec.md
@docs/05-compliance-and-claims.md
