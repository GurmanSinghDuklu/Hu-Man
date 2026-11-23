# Duklu Digital: project memory

Gurman Singh Duklu's web, AI and local-search studio (public line: "Gurman Singh and team") (Leeds, UK; Bradford before 2026-10-19). Working brand since 2026-09-23: **Hu/man** (wordmark "HU/MAN"), replacing "Duklu Digital". Still a working name: keep it in `src/config/site.ts` (`name`, `wordmark`, `descriptor`) so it is easy to change.

## Current goal
Build the studio's own marketing website: high-end, fast, local-SEO-ready, with concept before/after renders, services, pricing, credentials, FAQ and a free-audit contact path. Build it in the phases in `docs/08-roadmap.md`. Do not deploy, buy domains or publish anything without asking first.

## Who you are working with
- Gurman, 18, Bradford. Finished a T Level in Digital Production, Design and Development (Calderdale College). Placement at Lloyds Banking Group. Strong in JavaScript, TypeScript, React, Python and Java; comfortable with Git, Docker, REST APIs and Azure DevOps.
- Wants this as his full-time income, not a side job. Wants to grow aggressively but honestly.
- Has no employer, apprenticeship or benefits conflicts. Sole-trader registration is parked until nearer launch (see `docs/05-compliance-and-claims.md`).
- Explain things plainly and show your plan before big changes.

## Hard rules (never break)
1. No invented proof. No fake testimonials, ratings, review counts, client logos, awards, statistics or "as seen in". Concept work is labelled just "Concept" wherever it appears (Gurman, 2 Nov 2026: no "fictional person", "fictional business" or "concept design" on the site or in ads). Fictional domains use `.example`.
2. Credentials appear exactly as listed under "Verified credentials" in `docs/01-business-context.md`. Essence Hair Treatment was built unpaid for his aunt's business: never call it a paid client, and do not mention family on the public site (client request, Nov 2026). Claude Certified Architect is in progress: show it only as "in progress" until he confirms a pass. The Arm contribution is a submitted pull request unless he says it was merged.
3. No guarantees: not rankings, not Google AI Overviews or ChatGPT recommendations, not sales. State what is done and what is measured.
4. Publish only the contact details listed under "Public contact details". Never publish a home address.
5. UK English, sentence case, plain verbs. Buttons say what happens ("Get your free presence audit").
6. Prices come only from `docs/02-offer-and-pricing.md`. Do not invent, round or add prices.

## Stack (decided)
- Astro + TypeScript, static output.
- Plain CSS with design tokens (custom properties), from the Hu/man brand system in `docs/brand/` (since 2026-10-13). Ink `#0B0D0A` page, Signal green `#39FF14` in every layout; Pulse `#DF00FF` (offers), Flare `#FF5F1F` (dates), Volt `#E7FF00` (sparks) one block each at most; Scan `#14DCB2` data only; Paper `#F2F2EC` for the `.light` bands (concept work, FAQ). Square corners, no shadows or glows, no gradients except the logo's own. No theme toggle. Legacy token names (`--neon`, `--acid`, `--graphite-*`, `--color-*`) are aliases in `tokens.css`.
- Self-hosted fonts from the brand pack in `src/fonts/` (Montserrat 700/800 display capitals, Archivo 400/700 text, IBM Plex Mono 500 labels). Concept renders keep `@fontsource` Plus Jakarta Sans and Newsreader via `--font-render`/`--font-serif`, swapped in only after page load (`.render-fonts`). No Google Fonts requests.
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
7. **After deleting components, restart `astro dev`.** (Bit again 2026-10-17: Gurman reviewed a stale dev
   server with new scoped styles missing, so judge layouts from a fresh server or `npm run build`.) It kept serving a stale module graph (all
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
Revision 6 (2026-09-28) made the hero a Higgsfield-style collage wall with filter chips
(`src/scripts/hero-collage.ts`). Keep the Live/Concept tag on every tile.
Revision 7 (2026-10-01) replaced every fictional-brand tile in the hero collage with real work
only (`src/assets/projects/`, frames cropped from Gurman's screen recordings, browser chrome
removed): The Calculator App and Essence (Live, green dot) plus two Concepts with a visible tag.
Eldeva is a mock-up, not live (no mention of family on the site): tag "Concept", never "Live".
The Tesla fan site is Gurman's unofficial redesign of a real brand (his decision to show it): tag
"Unofficial concept" and keep "not affiliated with Tesla, Inc." in the key line. Never use Eldeva
frames showing its mock reviews or star ratings. Filters are by project, not service type.
Four tiles also play muted walkthrough clips cut from those recordings (`public/video/*.mp4`,
~0.6-1.5 MB each, made with `scripts/make-clip.swift`). The still stays as the poster; a clip
loads only after the page is idle, plays only while its tile is on screen, and never under
reduced motion or Data Saver. `scripts/serve.mjs` now answers byte-range requests: Safari will
not play video without them, so test video in WebKit through it, not by opening files.
Lighthouse 95/100/100/100, axe 0 violations on all three pages.
Revision 8 (2026-10-05) added Gurman's unofficial Spider-Man: Miles Morales fan site (8 stills +
3 clips, `spiderman-*`), handled like Tesla: tag "Unofficial concept", key line says not affiliated
with Marvel, Insomniac Games or Sony. It uses game imagery from PlayStation.com, not his own.

## Brand system rebuild (2026-10-13, branch `brand-system`)
Site restyled to the Hu/man brand pack (copied to `docs/brand/`: identity, graphic language,
applications, tokens). Logo is fixed artwork (`src/assets/brand/logo-*.svg`, inlined by `Logo.astro`),
never retyped: the separator-cycle wordmark animation was removed for that reason. `Module.astro` is a
build-time port of the pack's `HuMan.module()` (16 square modules). The Ridge kinds (`ridge`, `field`)
use the real fingerprint scan from the Brand Builder PDF (`src/assets/brand/fingerprint.webp`, 480px
greyscale, ~58 kB) as a CSS luminance mask, so one file takes any colourway. Keep `luminance` inside the
`mask` shorthand: a separate `mask-mode` line was dropped by the minifier and the cells went solid.
The favicon keeps the older line-drawn print, since the scan turns to mush at 16px. Hero is a module band (logo, Paper headline block,
Ridge field and print, hex, Volt spark). Motion snaps: `[data-cells]` grids cut on cell by cell
(`motion.ts`), no floats, no scroll-scrubbed effects. Things worth knowing:
1. **Hero LCP must not animate.** An opacity animation on the headline cell stops Chrome counting it as
   LCP and dropped performance to ~90. Only the pattern cells and status cell stagger.
2. **Render fonts are deferred on purpose** (see Stack). Loading Jakarta/Newsreader up front put ~250 kB
   before first paint (performance 88). Don't use `content-visibility` to fix that: it made Lighthouse
   and axe read wrong backgrounds (false contrast failures).
3. **Collage images are all `loading="lazy"`**: below the band they're off-screen on mobile, and eager
   ones landed in the first-paint graph.
4. Brand voice copy rewrite is approved in principle but not built: draft in `docs/brand/copy-draft.md`
   needs Gurman's sign-off before `docs/03` and the components change.
Lighthouse 100/100/100/100, axe 0 violations on all three pages.

## Agency redesign (2026-10-17, branch `agency-redesign`)
Restructured from a one-person CV into an agency site (spec: `docs/superpowers/specs/2026-10-17-agency-redesign.md`).
"We" voice from the approved `docs/brand/copy-draft.md`; nothing personal on the pages (no About, no
credentials, no GitHub/LinkedIn). Order: hero mosaic, What we do (Night), Selected work, Concept lab
(Paper), chat demo (Plum), How it works (Night), Pricing, FAQ (Paper), audit (Plum). Night `#0A1033` and
Plum `#1B0A2E` are new section grounds (`.night`, `.plum` in `tokens.css`). Things worth knowing:
1. **Every project label comes from `src/data/projects.ts`**: the home grid (`WorkGrid.astro`), `/work/`
   and the case pages `/work/<slug>/`. Add a project there, never in a component.
2. **The hero mosaic has no project screenshots** (Gurman removed them, 2026-10-18): fingerprint, colour
   blocks and kit modules only. Projects live in the labelled work grid.
3. **Transparent `Module` fills can't cut holes**: nested shapes (rings, hex) just paint over each other,
   so don't lay modules over photos. What we do marks each area with one column-wide square that glitches
   through five kit images (photos cut by shapes, then 3 x 2 posters, were tried and rejected).
4. **Video posters download with the page** even with `preload="none"`: ship them through `getImage()`
   as WebP. As JPEGs they cost 250 kB and dropped a case page to 91.
5. **Glitches run everywhere in all the neons** (Gurman's call, 2026-10-17): hero mosaic, `ModuleBand.astro`
   strips between sections, work tiles, What we do squares, navbar logo (on hover), footer wordmark. Opacity/transform in hard
   steps; reduced motion stops all of them. Module bands use kit patterns only, never the brand
   posters' sample wording (false offices, scores, offers).
6. `npm run screenshots` now covers home, /work/ and two case pages, and forces reveals on first (the old
   full-page shots were mostly blank). `npm run lighthouse -- work/tesla/` tests one page.
Lighthouse home 99/100/100/100, case pages 98-100 performance. axe 0 violations on all 9 pages.

## Final designs build (2026-10-19, branch `agency-redesign`)
The site now matches Gurman's three final designs (`reference/final-designs/`; spec
`docs/superpowers/specs/2026-10-19-final-designs.md`). This replaces the 2026-10-17 neon/glitch look:
light Paper page on a fine grid, Ink type, gradient arches, a portrait collage. Pages: `/`, `/services/`,
`/pricing/`, `/privacy/`, 404. Leeds is the base; no personal name on the pages (privacy notice only).
Prices are drafts in `site/src/data/pricing.ts` (mirrors docs/02 "Draft pricing"). Things worth knowing:
1. **Grid unit `--u`** is 1/16 of the page (max 100px). Desktop layouts and headline sizes are in units,
   measured from the designs; check changes side by side against the design at its own width.
2. **Design measurements include the 1u header**, so subtract one row when placing hero content.
3. **Our work images** are crops of the real captures (`node scripts/crop-work.mjs`). Never crop
   Essence's "What our clients say" section.
4. **Honesty swaps** from the design: "Most picked" is "Our pick"; the check form opens an email.
5. **Full-page screenshots can show lazy images blank** before they decode; force `loading=eager` first.
Lighthouse 98-100 / 100 / 100 / 100, axe 0 violations on all five pages.

## Final designs v2 (2026-10-25, branch `agency-redesign`)
Seven new designs (`reference/final-designs-v2/`, spec `docs/superpowers/specs/2026-10-25-final-designs-v2.md`).
New pages `/about/`, `/how-we-build/`, `/work/`; home and services rebuilt; Essential £295 tier added.
1. **Shared sections take a number** (`components/sections/`, e.g. `<AgentReady n="04" />`), since the
   same section is numbered differently on each page. Service areas live in `src/data/services.ts`.
2. **Headlines on phones are capped by `vw`** in `base.css`: unit-based sizes let long words
   ("recommending") overflow at 360px.
3. **A child component's root isn't reached by a scoped `> *` rule**: position it with `:global()`
   (the About shape group's `RingOrb` sat in the flow until fixed).
Lighthouse 98-100 / 100 / 100 / 100 on all six content pages, axe 0 violations on all eight pages.

## Launch readiness: SEO and GEO (2026-10-26, branch `agency-redesign`)
Deploy-ready for humansoftwareagency.com (`src/config/domain.ts`, the one place the domain lives);
the runbook for the account-side steps is `docs/10-launch.md`. Things worth knowing:
1. **Every page's title, description, OG headline and schema type live in `src/data/pages.ts`**;
   pages pass only `page="key"` to BaseLayout. Content shared by pages, schema and llms.txt lives in
   `src/data/` (faq, process, projects, about, services, pricing): never copy it into a component.
2. **Schema is one linked @graph per page** (`src/data/schema.ts`): business, website, page and
   breadcrumb on every page, plus the page's own subject. Only state what the page shows.
3. **`/llms.txt` and `/llms-full.txt` are generated** (`src/lib/llms.ts`); robots.txt names and allows
   the AI crawlers. **`npm run seo-check`** fails the build's CI on any SEO regression; it caught the
   header "Free audit" link pointing at a missing #audit on privacy and 404.
4. **CSP**: Astro's `security.csp` hashes every inline script and style into a meta tag; style
   attributes are allowed via `style-src-attr`. `public/_headers` adds HSTS, frame-ancestors etc.
   Any new inline `<script>` is hashed automatically; anything external must be added to the policy.
5. Social cards: `npm run og-images` (renders `/og-card/<key>/` only while OG_RENDER=1); icons:
   `npm run icons`. The favicon's print was a solid blob at stroke-width 14; it is 6 now.
6. Sitemap lastmod and schema dateModified come from git (`src/lib/lastModified.ts`), so CI checks
   out full history.
7. **Everything visible reaches AI tools**: `src/integrations/ai-readable.mjs` (after the sitemap)
   writes a Markdown copy of each page's <main> to `<page>/index.html.md`, appends every page's full
   text to llms-full.txt and adds an image sitemap. aria-hidden and empty-alt content is skipped.
   `seo-check` fails if a price or FAQ answer in llms-full.txt differs from the page, robots.txt
   disallows anything, or a page lacks its Markdown copy.
8. **Cloudflare blocks AI crawlers by default**: the runbook's "Let every crawler in" step must be
   done before launch, then verified with its curl loop.
Lighthouse 98-100 / 100 / 100 / 100 on all six pages, axe 0 violations on all eight.

## Enquiry form and the two GEO pages (2026-10-26, branch `agency-redesign`)
New pages `/agentic-ai-ready/` (the brand's term defined; DefinedTerm schema), `/free-ai-check/`,
`/contact/` and `/thanks/` (noindex). Copy on all three is a draft awaiting Gurman's sign-off.
1. **Hosting is now Cloudflare Workers, not Pages** (`site/wrangler.toml`): Pages can't send email.
   Static files come from dist/; `site/worker/` only handles `/api/enquiry`.
2. **Every contact button leads to a form** that posts to `/api/enquiry`, which emails the inbox via
   Cloudflare's send_email binding (Email Routing must be set up: docs/10-launch.md). Nothing is
   stored. The same endpoint takes JSON from AI agents; GET returns its field list; llms.txt and the
   schema (`potentialAction`) document it. Links prefill the contact form: `contactPath({ tier })`
   in `src/config/links.ts`.
3. **Works without JavaScript** (plain post -> 303 to /thanks/, errors back to /contact/?error=1).
   With JS it sends in place and offers a ready-written email if sending fails.
4. **The GitHub Pages preview has no server**, so it builds with `PUBLIC_FORM_MODE=mailto`.
5. `npm test` runs the endpoint's tests (worker/enquiry.test.js, Node's test runner, fake mailbox).
   Noindex pages are flagged `noindex: true` in src/data/pages.ts.
Lighthouse 98-100 / 100 / 100 / 100, axe 0 violations on all twelve pages.

## Contact page and enquiry emails (2026-10-27)
`/contact/` is in the header nav and now has "What happens next", a free AI check card and its own
FAQ (`contactFaq` in `src/data/faq.ts`; draft copy). The phone number is off the footer (Gurman,
2026-10-27) and stays on the contact page and in the schema; `seo-check` expects it on /contact/ only.
1. **The enquiry email to the studio** adds the source page, a reply-by time (48 hours) and, when a
   website is given, an automatic look at it (`worker/site-look.js`: public hostnames only, 3.5 s
   timeout, 256 kB cap, never throws). The privacy notice says so.
2. **The auto-reply to the sender is built but off**: it needs Cloudflare Workers Paid + Email
   Sending (beta), and the commented `REPLY_EMAIL` binding in `wrangler.toml`. It echoes nothing the
   sender typed. Steps: docs/10-launch.md "Auto-reply". Don't enable it without Gurman's go-ahead.
3. A contact video is wanted later (parked 2026-10-27).

## Legal pages (2026-10-27)
Footer "Legal" column: `/terms/` (client work), `/user-agreement/` (using the site, forms, endpoint;
crawlers welcome), `/privacy/`, `/cookies/` (the site sets no cookies; recheck before adding any
script). All four use `LegalDoc.astro`, which names who runs the site. Gurman chose (2026-10-27) to
show his name in the footer trading line and on these pages; there is no address yet, so the
E-Commerce Regulations' geographic address is still missing: add a business address (never the home
address) when he has one. Terms: 50% deposit, 50% before launch (his choice); three revision rounds,
"pay once" and "pay the difference" match the pricing page. Drafts, awaiting a solicitor's review;
the 30-day quote validity, 30-days-late termination and liability cap are my defaults to confirm.
Added 2026-11-17 (drafts, same review): terms 4 (client confirms CV content is accurate and consented;
we don't verify), 7 (example designs stay ours and are non-exclusive; a custom design is the
client's), 11 "Hosting and care" (no uptime promise, files handed over when hosting ends, takedown
for fraud or unlawful use; later sections renumbered 12 to 15); privacy "If you become a client"
(contract basis, Gmail/private GitHub/Cloudflare, 12-month retention defaults, one-month replies).
Those storage claims must be true before the first client: client repos private, laptops encrypted.

## Motion (2026-10-27, "B · Alive", branch `motion`)
Spec `docs/superpowers/specs/2026-10-27-motion-design.md` (see its "As built"), plan
`docs/superpowers/plans/2026-10-27-motion.md`. `src/scripts/motion/` starts reveals at once, loads GSAP
(SplitText line headings) on idle, Lenis on idle with a fine pointer only, and Paper Shaders on the first
interaction; none load under reduced motion. Things worth knowing:
1. **Reveal variants** via `data-reveal="lines|slide|grow|scan"`; plain `data-reveal` fades up. Animate
   the individual `translate`/`scale`/`rotate` properties, never `transform`, so existing centring
   transforms survive. Section `h2`s use `lines`; page `h1`s never animate (LCP).
2. **Shaders**: `<span class="shader-layer" data-shader="ideas|talk|arch">` inside a panel with
   `isolation: isolate`; max 3 per page; colours in `src/scripts/motion/palettes.ts`, contrast-tested by
   `npm test`. Paper Shaders' one `<style>` is allowed by hash in `astro.config.mjs`: after upgrading
   `@paper-design/shaders`, rerun `npm run motion-check` and update the hash if it reports a CSP error.
3. **Loading shaders on idle cost ~4 performance points on home** (shader compile on a throttled
   phone); first interaction keeps it at 97-98. Don't move them earlier.
4. **The navbar and footer logos flow with the site's palette** (`.logo-led` in base.css): a 720px
   repeating horizontal gradient of `--led-colours` moves behind the logo, which is the mask
   (`--logo-mask`, the real SVG via `?url`; keep the url() quoted, Vite inlines it as a data URI with
   quotes). Header: deeper colours for the pale ground; footer (`.site-footer__led`): lighter ones for
   Ink. Keeps running under reduced motion (a colour change, not movement; Gurman, 2026-10-27). The
   navbar logo's hover glitch was removed at his request.
5. `npm run motion-check` (Playwright; `BROWSER=webkit|firefox` for other engines) checks the logo,
   ticker pause, shader count, reduced motion and console errors against `dist/`. In WebKit it strips
   `upgrade-insecure-requests`, which breaks the plain-http test server only.
Lighthouse 97-100 / 100 / 100 / 100 on ten pages, axe 0 violations on 15. Motion JS 44 kB gz (1.6 kB eager).

## Work cards, external links, copyright (2026-10-28)
- Home work cards show each project's `blurb` (Gurman's wording, in `src/data/projects.ts`); Essence
  ends with a "Live site" link. Eldeva's line (2026-10-28) calls it a "pre-production" rebuild from
  Shopify: still not live, never say "live". The Calculator line says its iOS and Android apps are in development.
- **Every link to another site opens in a new tab** (`target="_blank" rel="noopener noreferrer"` plus a
  visually hidden "(opens in a new tab)"), so visitors keep our site open. Do the same for any new one.
- Footer base line: "Copyright © year Hu/man Software Agency. All rights reserved." Keep it one template
  string: an expression at a line end loses the following space.
- **WhatsApp**: was "none anywhere on the site" (Gurman, 2026-10-30); reversed 2026-11-11 (confirmed in
  chat): the footer Contact column has "Contact on WhatsApp" (wa.me/447988450280, new tab, small green
  glyph), the only place outside /contact/ the number appears. Full presence's "WhatsApp + call
  answering" is a client service and stays.

## Concept portfolios (2026-11-02, branch `portfolio-concepts`)
Three standalone concept sites (Noor Haddad, Theo Lindqvist, Maya Okonkwo) live in `site/public/concepts/<slug>/index.html` and are shown as cards on `/portfolio` (data in `src/data/portfolioConcepts.ts`, screenshots in `src/assets/portfolio-concepts/`). They are plain HTML copied as is, not Astro pages: fonts are self-hosted woff2 in `public/concepts/fonts/` (from `@fontsource`, not added to package.json) and GSAP 3.15.0 (gsap, ScrollTrigger, Draggable) is copied from `node_modules` into `public/concepts/vendor/`, all via relative paths so the `/Hu-Man` preview base works. Gotchas: Astro's meta CSP does not cover public files, so `public/_headers` has a `/concepts/*` rule that detaches the global CSP (`! Content-Security-Policy`) and sets one that allows their inline scripts and styles; the pages are `noindex,nofollow`, not in the sitemap and not in `llms-full.txt`, and `seo-check.mjs` checks them separately (noindex, no outside hosts, assets exist, back link); ESLint and Prettier skip `public/concepts`. Each page has a fixed badge with a back link to `../../portfolio/` (static at the foot on phones). Maya's contrast failures were fixed 2026-11-20 (nav pills on cream, deeper ink on the pink cards). The home Portfolio section (`WorkCards.astro`) shows the real projects from `projects.ts`, not these concepts (Gurman, 2026-11-02: the concept version was reverted).

## Live concept wall (2026-11-07, branch `portfolio-gallery`)
/portfolio now opens with the concept portfolios (sixteen since 9 Nov) on a dark live wall (`ConceptWall.astro`,
`src/scripts/concept-wall.ts`; spec `docs/superpowers/specs/2026-11-07-portfolio-gallery.md`). Eight new
concepts for ordinary jobs (priya, dan, grace, sofia, ryan, hannah, kai, amira) borrow interaction
mechanics from Gurman's Awwwards references but never their layouts, art or words. Things worth knowing:
1. **Every concept loads `../preview.js`** (seo-check fails without it). With `?preview` it hides the
   badge, scrolls the page in a loop and sends synthetic pointer events; the wall forwards the real cursor
   by `postMessage` (`hm-pointer`, `hm-pause`). CSS `:hover` can't fire from synthetic events, so concept
   hover effects that matter are also driven from JS.
2. **At most 4 iframes live** (2 on phones), mounted near the viewport after idle, removed when far away.
   Reduced motion, Data Saver: posters only, with a note.
3. **Posters** come from `npm run concept-posters [slug]` into `src/assets/portfolio-concepts/<slug>.jpg`.
   Re-run after changing a concept. Concepts and wall order live in `src/data/portfolioConcepts.ts`;
   seo-check matches pages to that file.
4. **Framing**: `frame-src 'self'` in the CSP; `/concepts/*` drops `X-Frame-Options: DENY` for
   `SAMEORIGIN` and `frame-ancestors 'self'` in `_headers`.
5. Concept pages say "Concept" and "sample", never "fictional" (hard rule 1).
6. **Revision 2 (same night, Gurman's notes):** Hannah is now a bookcase (each book = a workplace that
   opens into its history; for people with many employers), Sofia uses a real muapi cabin clip
   (`sofia/img/cabin.mp4`, kling-v3.0-pro from an imagen4-ultra frame) and an old-school terminal (split-flap
   board, boarding passes, luggage tags), Kai follows the Addviso look (dark grain, mint, giant K, four
   shapes). Their photos are muapi-generated and live in `<slug>/img/`. The muapi key stays in
   `~/.muapi/key`, never in the repo.
7. **Batch 3 (2026-11-09):** five more concepts, sixteen in all: ellie (dog walker; ball-throw entry gate,
   skipped in preview/reduced motion, so its poster is shot with `?preview`), marcus (manufacturing
   engineer; red-circle brand-book system, muapi sphere turntable `img/sphere.mp4`), chloe (marketing
   executive; video pill in the headline grows full-bleed, hand-written 2D physics pills), leah (project
   manager; Swiss minimal, looping SVG Gantt, click-anywhere contact), tom (UX student; sticky canvas
   slideshow driven by scroll so the preview plays every slide).

## GitHub and preview deploy
Repo: github.com/GurmanSinghDuklu/Hu-Man (public; default branch `hu-man-rebrand`). Every push to
`hu-man-rebrand` deploys a preview to https://gurmansinghduklu.github.io/Hu-Man/ via
`.github/workflows/pages.yml`. It builds with `SITE_URL`, `SITE_BASE=/Hu-Man` and `PUBLIC_NOINDEX`
(noindex on every page, no canonical) because the site lives under a sub-path and isn't launched.
Any hardcoded root path (`/privacy`, `/video/...`, `/favicon-96.png`) must go through
`withBase()` from `src/config/paths.ts`, and homepage checks through `isHomePath()`, or it breaks on
Pages. A plain `npm run build` is unchanged (base `/`, example.com).

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

## Heroes fit one window, indigo buttons (2026-11-01)
- **Every hero fits the browser window** (Gurman). Desktop: `.hero`/`.ihero` set their own `--u`
  (with `--pad`, `--sheet`) from the window height, so the whole layout shrinks, centred, never below
  70% of the page unit; their grid lines are centred on the sheet so collage cells stay on them.
  Phones: tighter stack, and `--collage-h` caps the collage's height. Inner heroes are 7.5 rows now.
- **Buttons use `--btn`** (tokens.css, the logo's indigo `#4e28df`). TalkBanner sets it back to Ink
  (its gradient runs through indigo and pink); the dark-ground buttons style their own colours.
- **No sideways scroll**: `main` has `overflow-x: clip` (body's own overflow passes to the viewport,
  which iOS Safari still pans), because slide reveals start 48px to the right. Clipping only hides
  it: also fix real overflows (a 2-column grid needs `minmax(0, 1fr)`, long headline words need a
  `vw` cap up to tablet width). Check every width from 360 to 1280px, reveals done and not.

## Cookie button (2026-11-02)
`CookieButton.astro` (in BaseLayout, after the footer): a fixed fingerprint button, bottom right, that
opens a native `popover` cookie panel (no script; a tiny fallback sends old browsers to /cookies/).
The site sets no cookies, so the panel says so: no toggles or "Accept" button, which would imply
cookies that don't exist. If analytics or any non-essential cookie is ever added, this panel becomes
the real consent UI (with storage for the choice) and the policy changes first. The print is
`src/assets/brand/fingerprint-line.svg` as a `.logo-led` mask; on phones the footer's last line
keeps 60px clear of it.

## Nav dropdowns: Services and Work (2026-11-02)
The header's "Services" and "Work" links now open a menu on hover (desktop) or an arrow button
(keyboard/touch): Services lists every service area and its items (`src/data/services.ts`, each
area got an `id` used as its anchor on `/services/#id`); Work lists every project with its status
and first sentence (`src/data/projects.ts`, linking to `/work/#id`). The mobile burger menu shows
the same lists as a plain sub-list under each link, no JS needed. Esc, a click outside, or
following a link closes an open menu; focus returns to the toggle on Esc. `scroll-padding-top` on
`html` keeps anchored targets clear of the sticky header.
1. **A descendant selector leaks into nested menus.** `.site-header__nav ul` (meant only for the
   top-level link row) matched every `<ul>` inside the header, including the dropdown's own grid
   lists, and silently forced them to `display: flex` — collapsing the 6-column services grid into
   one wide row and overflowing the page by ~1700px sideways (invisible panels still count toward
   `scrollWidth`). Fixed by scoping the original rule to `.site-header__nav > ul` (direct children
   only). Check this again before adding another nested list inside the header.

## Landing page and site-wide interactivity (2026-11-10, uncommitted)
- **`/start/`** (landing page for ads and links; indexed since 2026-11-11 at Gurman's request, so it has a
  canonical, sitemap entry, `public/og/start.png` and the business email under the form; rebuilt on Shopify's start-page
  layout): a playlist of four videos in `public/landing/` (all H.264 + AAC, play everywhere), in this
  order (2026-11-11) then looping: `portfolio-seen.mp4` ("Be seen", 28 s, 9:16, 10.4 MB, from 16.8 MB at
  crf 26), `found.mp4` (51 s, 16:9, 25.5 MB, from 143 MB at crf 27), `reel.mp4` (82 s, 16:9, 20 MB) and
  `portfolio-ad.mp4` (48 s, 9:16, 13 MB). The poster is playlist[0]'s first frame
  (`src/assets/landing/seen-poster.jpg`): recapture it if the first video changes. The list is `playlist` in `components/landing/Landing.astro` (shared with /contact/); the
  frame takes each video's shape (--ar), so vertical ones show as a tall screen, uncropped (full bleed on
  phones). Compress new videos with `npm run compress-video -- in.mp4 out.mp4 [crf]` (ffmpeg-static,
  dev dependency added 2026-11-11 with approval; crf 27 looked identical to the original for Found).
  Flowing logo top centre, two boxes bottom left (they overlay the left of wide videos; a round
  down-arrow folds them away to a "Got an idea? Tell us." pill on desktop): pitch
  and a short form (full name, email, service) that posts to `/api/enquiry`. No link to /contact/.
  `npm run og-images` now runs Astro via Node (npx failed on Windows); it rewrites every card, so
  commit only the cards you meant to change.
  Browsers refuse sound on autoplay, so it starts muted when refused and unmutes on the first click,
  tap or key press; Pause and Sound buttons always. Reduced motion or Data Saver: nothing plays until
  pressed. Poster = the reel's first frame, set as the video's own `poster` (a separate still behind
  a fading-in video once made the video the LCP). The endpoint takes an optional `service`; a
  message is optional when one is given. It also takes `via` (the landing form sends "Landing page"):
  the email subject starts "[Landing page]" and its first line is "Came from: Landing page". The form
  can't send from `npm run dev` (no /api/enquiry there; it falls back to the email link): test it
  deployed, or through the Worker's own tests. `npm run axe` waits for `load` (the reel keeps the network
  busy) and turns transitions off before scanning.
  Live host and video ranges: Cloudflare's static assets ignore `Range` (always 200, whole file), but
  the landing videos play on iPhone Safari anyway (checked on a real iPhone, 2026-11-11), so no
  range-serving Worker or R2 is needed. Phones: the video is a square block at the top, starts muted,
  and unmutes only on real user activation (unmuting on a scroll's pointerdown made Chrome pause it).
- **Fingerprint cursor** (`scripts/motion/cursor.ts`): mouse only, never under reduced motion; decoration
  only (the real cursor stays). Hides over text fields and iframes.
- **Scroll effects** (`scripts/motion/scroll-fx.ts`, loaded on idle): progress line, `[data-zoom]` image
  frames, ticker speed-up, drifting `.orb`/`.sparkle` shapes, and **`data-pin-steps`** on any list: on
  wide screens it pins and lights up its items in turn, but only if it fits 82% of the window (the
  services grid doesn't, so it stays still). Unlit items use `filter`, never `opacity`, so reveals
  keep working. Sticky needs no `overflow: hidden` ancestor: use `overflow: clip` (IdeasToLife).
- Image reveal variant `data-reveal="unmask"` (work page windows).
- **Header fix**: a desktop-dropdown rule gave `.site-header__nav` `display: flex`, overriding its phone
  `display: none`, so every phone page was ~865px wide. The nav is now only flex at 64rem and up.
- **Pointer effects** (`scripts/motion/pointer-fx.ts`, mouse only, loaded with the cursor): magnetic
  buttons (`.btn`, `.pill-btn`, max 8px) and tilting cards (list in `TILT`, max 5 degrees, a
  `.tilt-glare` light; rows over 720px wide don't tilt). Cursor is a full drawn print,
  `src/assets/brand/fingerprint-full.svg`, 22x26px.
- **Parallax** (in scroll-fx): hero collage pieces at their own speeds (max 50px) and section `h2.display`
  sliding sideways (max 48px, 2.5% of the window width on phones). Anything in the first window moves by
  scroll distance, so nothing jumps when the script starts. Elements with their own translate are skipped.
- Home Portfolio: with exactly two projects the second card sits in the third column (right edge).
- **Dev server and public folders**: Astro's dev server doesn't serve `public/<folder>/index.html` for a
  folder address, so every concept (and the /portfolio wall's frames) showed the 404 page under
  `npm run dev`. `src/integrations/dev-folder-index.mjs` fixes that in dev only; builds are untouched.
- **Fingerprint head** (2026-11-11): the profile drawn in fingerprint ridges from the reel (0:47), cut out
  as `site/src/assets/brand/fingerprint-head.png` (white ridges on transparency; no source file exists in
  the brand pack, so it was taken from the reel frame). `HeadMark.astro` shows it as a transparent mark
  in the flowing colours (.logo-led, colours from the parent's `--led-colours`), shipped as 22 kB WebP.
  In the header, footer and /start/ the logo and head are ONE element, `BrandMark.astro`: a single moving
  gradient cut by a two-layer mask (logo left, head right), so the colours run from the text into the
  head in step (two separate .logo-led elements drift apart). Parent sets --lw, --hh, --gap,
  --led-colours. The footer's is `.site-footer__mark` (`.site-footer__brand` is the footer column).
  The cookie button uses `HeadMark.astro` alone. If a vector or higher-resolution original turns up,
  swap the PNG. `npm run motion-check` now works on Windows (it used URL.pathname, so every page 404'd).

## SEO audit fixes (2026-11-11)
- `public/_redirects`: each page without its final slash 301s to the page (Cloudflare's own handling
  is a temporary 307). Exact-match rules, no loops. **Add a line when you add a page.** `/portfolio` used
  to go to /work/ (stale rule from before /portfolio/ existed, and the "Be seen" ad prints that address).
- `docs/04-seo-plan.md` targets Leeds (and Manchester) now, not Bradford.
- Speed: Lighthouse's simulated mobile LCP is 2.0-2.7 s on long pages, but measured first paint is
  ~0.35 s at 4x CPU throttling; the gap is the slow-4G model. Judge by Search Console's Core Web
  Vitals (real visitors) before reworking CSS for it.

## Contact page = landing page, falling-tiles intro (2026-11-12, branch `contact-landing`)
Spec `docs/superpowers/specs/2026-11-12-contact-landing-design.md`. /contact/ is now the landing screen
(`components/landing/Landing.astro`, shared with /start/; behaviour in `scripts/landing.ts`) with the full
contact form, direct details, "What happens next", AI check card and FAQ below in the landing's look, then
the footer. No site header. Each visit by link (not a refresh or Back/Forward) opens with the old contact page
breaking into tiles that fall into black, 1.6 s of black, then the landing switching on like an old TV
(dot, bright line, picture springing open under a fading flash; no static), with a Skip intro button
(`ContactIntro.astro`, `scripts/contact-intro.ts`). Things worth knowing:
1. **`is:inline` scripts are not hashed into the CSP by Astro.** The intro's gate script lives in
   `src/scripts/inline/` and `astro.config.mjs` hashes that file (`inlineHash`); inline it verbatim with
   `set:html`. BaseLayout's `.js` class script works the same way (`inline/js-class.js`, 2026-11-20).
2. **Scripts that scroll or measure wait for `introDone()`** (`scripts/contact-intro-state.ts`): the
   landing video, Lenis (it scrolls by script, which `overflow: hidden` doesn't stop) and scroll-fx (its
   first pass was a 250 ms long task during the intro).
3. **Each tile is a live copy of the cover**, so the tile count is capped (48, 32 on phones) and tiles are
   built a row per frame during the hold; one big build cost Lighthouse 20 points.
4. The cover's hero is `<InnerHero as="div">`: an h1 inside the `<template>` still counts for seo-check.
5. **Two events**: `screenOn()` (the TV moment: the video starts) and `introDone()` (scroll unlocks;
   Lenis and scroll-fx start). Fallen tiles are set to `display: none` before the black.
6. **Software GL crawls through the intro** (about a frame a second; GSAP stretches the timeline to
   match), so motion-check runs the intro checks in a normal Chromium, not its swiftshader one.
7. Tests: `motion-check` has intro checks; `axe` waits for the cover to go. Reload the page to
   skip it (a refresh never plays it).
Lighthouse /contact/ 95 (intro included), /start/ 99, home 96; axe 0 violations; motion-check clear in
Chromium, WebKit and Firefox.

## Scroll story, 3D projects, hero videos (2026-11-12/13, branch `scroll-story`)
- **Scroll story** (`scripts/motion/scroll-story.ts`): hanusek-style motion under the hybrid rule.
  `[data-handoff]` sections sink and dim as the next slides over (start is `clamp()`ed, so a hero
  shorter than the window isn't half-shaded at load), `[data-scrub="words"]` darkens text as you read,
  `[data-rise]` lifts cards in, `[data-draw]` builds SVG line drawings.
- **Home projects = a 3D laptop** (`components/home/ProjectsStage.astro`, `scripts/projects-stage/`,
  three.js 0.186): the one place scrolling switches content. Plain cards for reduced motion, Data
  Saver, low memory or no WebGL.
- **One video per hero on Home, About, Work and Pricing** (Gurman, 2026-11-13), in place of the
  collage. Those heroes are Ink with white text, and the video sits on the right with no frame (a
  wide one fades into the Ink at its edges; a tall one runs the full hero height): `HeroVideo.astro` + `scripts/hero-video.ts`, the landing videos (Home: reel, About:
  found, Work: portfolio-seen, Pricing: pricing, a 43.7 s 9:16 ad made for the page; portfolio-ad stays for /start/ and /contact/). Muted loop from the poster's moment, starts
  after page load, pauses off screen, Pause and Sound buttons; nothing loads under reduced motion or
  Data Saver until Play. Posters: `src/assets/hero-video/`. Other pages keep the collage. Clips
  scattered through sections were tried and rejected (same day): keep video to the heroes.
- **Heroes never shrink on scroll** (Gurman, 2026-11-13): no `data-handoff` on HomeHero or InnerHero;
  other bands may still use it.
- **Header hides while scrolling down** (Gurman, 2026-11-13; script in `SiteHeader.astro`): it slides
  up once you scroll past it and returns after scrolling up 60px, at the top, or when keyboard focus
  or an open menu is in it. Nav label "CV portfolio" for /portfolio/; between 64 and 80rem the nav
  tightens so every link stays on one line.

## Card lists step one per swipe; method block moved to About (2026-11-14, branch `scroll-story`)
- **Pinned lists (`data-pin-steps`) step one item per wheel or trackpad gesture and per press of
  an arrow, Page or Space key** (Gurman; he scrolls with the arrow keys and didn't want to hold one
  down): the first move into the runway lands on the first item, each next one glides to the next,
  and one more past the last carries on down the page (`scripts/motion/scroll-fx.ts`). A held key
  steps once per 650 ms. Keys in fields, buttons, links, menus and the header are left alone. The
  scrollbar and touch still scroll freely. It highlights cards that are all visible; it never
  swaps content.
  1. **Measure pins from layout (`offsetTop`), not `getBoundingClientRect`**: a `data-handoff`
     section sinks and shrinks while its pinned list is still stuck, which threw the steps off.
  2. **A busy page delays wheel events** (the indigo panel's shader), so a short gap in a fading
     push is still the same gesture; only a gap followed by an equal or harder push is a new one.
  3. Script scrolls go through `scripts/motion/scroller.ts`, which Lenis takes over when it starts.
  4. **The section's label and headline are held with the cards** (Gurman, 2026-11-14) when they
     are earlier siblings of the list and everything fits the window below the header; otherwise
     only the list is held. The progress line then sits above the label, and held headlines skip
     the sideways parallax so they stay square with their label.
- **"From idea to online business" (`IdeasToLife`) is off the home page and on /about/ as 04**
  (Gurman); /services/ keeps it. Home sections renumbered 01 to 07.

## About + FAQ, care plans live, About intro (2026-11-14, branch `about-faq`)
- **Care plans are live on /pricing** (five plans, rules line and fix promise from docs/02; data in
  `carePlans`, `careRules`, `careFixPromise` in `src/data/pricing.ts`). They feed the page, llms output,
  an OfferCatalog (UnitPriceSpecification, monthly) in the pricing schema, and the "from £29/mo" mentions
  on /about/ and /services/. Buttons link `contactPath({ tier: 'Care plan: <name>' })`. Edit docs/02 first.
- **The FAQ lives at the foot of /about/ (`#faq`)**; /pricing keeps one "Questions? Read our FAQ" line.
  Header, footer, `smooth.ts`, FAQPage schema (About is typed `['AboutPage', 'FAQPage']`) and the
  seo-check FAQ comparison all point at /about/.
- **About hero intro** (`scripts/hero-intro.ts`, opt-in with `intro` on `InnerHero`/`HeroVideo`): neon tiles
  drop in, a scan line sweeps, each column flips to its slice of the poster, seams close, layer removed,
  then the video plays. On every visit by link (not on refresh or Back/Forward); not under reduced motion or Data Saver; any
  click or key finishes it. `hero-video.ts` holds playback (`holding`) until it ends.
  1. **An opacity animation flattens 3D.** The cell wrapper animates translate/opacity/scale; the tile
     inside only rotates. With both on one element the back faces never showed.
  2. Slices line up because each back face is the poster at cols x rows size shifted to its cell, and
     cells are exact grid cells (the seam is a `scale` of 0.93, not a gap). Back faces overlap by 0.5px.
  3. Tile count is derived from the frame (5 x 3 on desktop, 3 x 2 on phones; max 32); colours are
     mostly Signal with one or two each of the other neons. Starts when the frame is 40% on screen.

## Portfolio hero + CV intro, header FAQ link gone (2026-11-14, branch `portfolio-hero`)
- **The header has no FAQ link** (Gurman): "About" covers it; the FAQ stays at /about/#faq and in the footer.
- **/portfolio's hero plays the "Be seen" video** (`video="portfolio-seen"`, h1 and lede unchanged) with its
  own opening, `intro="cv"` (`scripts/hero-intro-cv.ts`; About keeps `intro` / `'tiles'`). A plain Paper CV
  sheet (name bar and twelve grey bars, no words) draws on, a Signal scan line passes down it, then it
  cuts into 8 strips (5 on phones) that fall under gravity, centre first, over the poster; the video
  starts after (~1.7 s in all). Transform, scale and opacity only.
  1. **Gating is shared**: `playWhenSeen()` and `introWanted()` in `hero-intro.ts` (every visit by
     link, not refresh or Back/Forward; 40% on screen; click or key finishes; layer removed). `hero-video.ts`
     picks the variant from `data-hv-intro`.
  2. **Sizes are container units**: `.hv-cv` is a size container and every bar uses `cqw`/`cqh`, so each
     strip's copy of the sheet lines up with the whole sheet. The full sheet sits on top and vanishes at
     the cut, revealing identical strips beneath.
  3. **Phone hero**: the four-line headline pushed the hero past one window, so portfolio.astro sets
     `--hv-h: 46svh` up to tablet width (`.ihero.ihero--video` needed for specificity).
Lighthouse /portfolio/ 99/100/100/100, axe 0 violations, motion-check clear.

## Pricing hero video + receipt intro (2026-11-15, branch `pricing-video`)
- /pricing's hero plays `public/landing/pricing.mp4` (the pricing ad, 7.8 MB, faststart, loops whole; poster is the settled Essential £318 card at 6.5 s, `src/assets/hero-video/pricing.jpg`, `start: 6.5`). Phones and tablets set `--hv-h: 49svh` in pricing.astro so the hero fits one window.
- **`intro="receipt"`** (`scripts/hero-intro-receipt.ts`, same shared gating as 'tiles' and 'cv'): a Paper receipt feeds down, prints a header bar and five rows (label bar plus a price that rolls like an odometer, then a Signal total bar), a Signal scan line passes, then it tears along a zigzag and the halves leave up and down over the poster; about 1.6 s.
  1. **Only real tier prices appear**: each row rolls through the prices before it (£318, £446, £932, £2,240, "Quote"); if tier prices change in `pricing.ts`, change `PRICES` in the script too.
  2. The halves are clones of the finished receipt (default CSS state is the final state; animations supply the printing), clipped with a zigzag `clip-path` and shown only from the tear on. Sizes are container units (`.hv-rc` is a size container).

## Audio pop-up and scroll cue on every hero video (2026-11-15, branch `hero-audio-cue`)
- **"Click here for audio"** (`.hv__cue` in `HeroVideo.astro`, logic in `hero-video.ts`): a bordered pop-up beside the
  Sound button, shown once the muted video is really playing; gone after 14 s, on sound, or on pause, and not shown
  again this page view once dismissed. Clicking it presses Sound. The Sound button now comes before Pause so the
  pop-up points at it. On narrow tall frames (phones) it wraps to four short lines and drops the icon, to stay in the corner.
- **Scroll cue** (`ScrollCue.astro`: "Scroll down" and a dropping arrow, links to `#after-hero`): `InnerHero` adds it
  to every video hero unless the page fills the `after` slot itself (Portfolio's "See all 16 concepts below" does);
  Home sets it beside the buttons (`.hero__cue`). Video heroes end with an empty `#after-hero` anchor.

## About gets Our work, Business websites page, back to top, click-to-pick cards (2026-11-15, branch `about-work-nav`)
- **/work/ is gone**: its content (Selected work walkthroughs and the project windows) is section 05 on /about/ (`#work`);
  `/work` and `/projects` redirect to `/about/#work` in `public/_redirects`; the header "Work" link and its dropdown are removed.
- **"Business websites" (/business-websites/)** is in the header (page key `business-websites`): the right-fit message
  (too basic, too much, just right; human contact first). Gurman adds before/after concepts in `src/data/businessConcepts.ts`;
  the "Before and after" section appears once the list has an entry. Copy is a draft awaiting his sign-off.
- **Pinned scroll lists are removed** (scroll-fx no longer pins or steps). `data-pick` lists (about, services, how-we-build,
  free-ai-check, agentic-ai-ready, method) show every card; one click (or an arrow key on a focused card) highlights it and
  softens the others, a second click clears it (`scripts/card-pick.ts`, loaded on every page, works under reduced motion).
  Cards are `tabindex=0` list items with `aria-current` on the picked one (a `role` on `li` fails axe).
- **Back to the top** (`BackToTop.astro`): fixed bottom-right, appears after 400px of scroll; the cookie button sits just above it.
  `main` has `tabindex="-1"` so the button can return focus to the top.

## Business websites laid out like /portfolio (2026-11-16, branch `business-wall`)
/business-websites/ now follows /portfolio's order (Gurman): hero with "See all 6 concepts below",
an Ink live concept wall, a guide in the ATS layout (intro and the three fit cards, then the three
steps and "Our check: the phone test"), the five tiers (`HeadlineCards`), then care plans and Fast
Track, then TalkBanner. Copy is a draft awaiting his sign-off.
1. **Business concepts have their own wall list**: `businessSiteConcepts` and `businessConceptsIntro`
   in `src/data/portfolioConcepts.ts` (kept in that file so seo-check and concept-posters find every
   slug). `ConceptWall` takes `concepts` and `intro` props; /portfolio uses the defaults. Ellie is on
   both walls, borrowed by reference: seo-check fails if a slug is written twice.
2. Business concept pages link back to `../../business-websites/` (seo-check accepts either page).
3. `src/data/businessConcepts.ts` is now only for real before-and-after pairs; the section stays
   hidden until an entry has a `before`.

## Play: gsap.com-style shapes, no pinning (2026-11-16, branch `gsap-play`)
Gurman asked for gsap.com's moving shapes and animations, made from Hu/man's own assets, on every page,
without its pinned sideways strip. Pieces live in `src/components/play/` and `scripts/motion/play.ts`
(loaded on idle after GSAP, never under reduced motion; each part imports its plugin only if the page has it):
- `Shape` (sparkle, orb, arch, pill, ring, square in the brand gradients) sits inline in section headlines
  and loops by CSS (spin, bob, squash, wobble, pulse). It has no text, so a headline's words and SplitText
  label are unchanged. Line reveals open their masks when done (`reveals.ts`) so shapes can move past the line.
- `Sticker`: tilted tag that pops on with its label. Put it in the `.label` line, never in a headline
  (SplitText builds the headline's aria-label from all its text). Repeats words already in the section;
  aria-hidden.
- `[data-land]` on a phrase: a sparkle flies to it on a curve (MotionPath), bursts, and underlines it.
- `WordLine`: big line of words that unscramble (ScrambleText), shapes pop between, a curve draws (DrawSVG).
  Size is capped from its longest entry so each entry fits one line at every width. Words state activities,
  not outcomes (hard rule 3).
- `MorphShape` (forms in `src/data/morphForms.ts`): changes form on arrival, every few seconds on screen and
  on card hover (MorphSVG). On service cards and home's What we do tiles.
- Talk banner toys: throwable shapes (Draggable + Inertia), mouse and trackpad only.
1. **Never let GSAP transform an element that has a CSS `scale`/`rotate` animation.** GSAP folds the CSS
   individual transforms into its own transform when it first touches the element, so a shape caught at
   its pop-in start froze at scale 0. Drag or animate a plain wrapper instead (see TalkBanner).
2. The banner copy passes pointer presses through to the toys behind it (buttons and links stay clickable).
Lighthouse 96-99 / 100 / 100 / 100 (home, services, about, pricing); axe 0 on 17 pages; motion-check clear.

## Six everyday-job CV concepts, business concepts removed (2026-11-16, branch `cv-concepts`)
- **Six new CV concepts on /portfolio** (22 in all), first on the wall: imran (customer service team leader),
  lucia (sales account manager), ivy (payroll administrator), nadia (data analyst), aiko (facilities manager),
  clara (store manager). Each is a one-page CV built from a reference PDF/template layout (kept ~75%; colours and
  design language moved further from the reference and tied to the job: queue tickets, deal stages, payslip,
  spreadsheet, building signage, boutique). Fields `Sales` and `Retail` added.
- **People are muapi avatars** (flux-2-pro, then flux-2-pro-edit for extra shots of the same face) in
  `<slug>/img/`; styled like the reference, never lookalikes of the real models.
- **Motion is GSAP scroll animation** (gsap.com style, no floating toys): SplitText masked reveals, scrubbed
  opposite-direction type bands, hero push-out, pinned sideways tracks, stacked cards, clip-path image wipes
  with parallax, scrubbed word fill, counters and draws, batch reveals, progress bar. `SplitText.min.js` added
  to `public/concepts/vendor/`. All under `gsap.matchMedia()`: reduced motion gets no pins, scrubs or loops.
- **The six business concepts (offcut, ember, plump, fernlea, linework) are deleted** and Ellie is off the
  business wall (still on /portfolio). `businessSiteConcepts` is empty; /business-websites/ hides its wall
  section and scroll cue until it has an entry.

## No browser storage (2026-11-17, branch `security-hardening`)
The site stores nothing in the browser: no cookies, no localStorage, no sessionStorage (UK PECR
covers all of them, and /cookies/ promises none). The hero and /contact/ intros used session flags
to play once per visit; they now play on every visit by link and skip on a refresh or Back/Forward,
read from the browser's navigation record (`introWanted()` in `hero-intro.ts`, and the same rule in
`scripts/inline/contact-intro-gate.js`). `motion-check` fails if any page stores anything. If
something ever needs storage, change the cookies page first and ask whether it needs consent.
Exception since 2026-11-23: the client area sets one strictly necessary login cookie
(`__Host-hm_session`), only from `/api/auth/*`; public pages still set none (a worker test checks).

## CV concepts FAQ on /portfolio (2026-11-18)
Eight questions about the CV concepts, under the ATS section (`#faq`, same open-card style as the About FAQ).
Copy is a draft awaiting Gurman's sign-off: `portfolioFaq` in `src/data/faq.ts`, which feeds the page, a
FAQPage `mainEntity` on the portfolio schema and llms-full.txt. Prices and timelines come from `pricing.ts`
(`portfolioTiers`, `portfolioExpress`, new `keepLive`). Header and footer FAQ links still
mean /about/#faq. Run tools as `./node_modules/.bin/astro` etc.: the `:` in "Hu:Man" breaks npm's PATH.

## Backend SEO: IndexNow on deploy, video schema, Markdown on request (2026-11-19)
- **Deploy command is `npm run deploy`** (`scripts/deploy.mjs`; Workers Builds deploy command, set in the
  Cloudflare dashboard, docs/10-launch.md section 1). It reads the live sitemap, runs `npx wrangler deploy`,
  then sends IndexNow every page whose lastmod changed. Page dates include shared components and data, so
  most deploys send every page; that's accurate. `npm run indexnow` still sends all pages by hand.
- **Hero videos have VideoObject schema and `<video:video>` sitemap entries.** One list,
  `src/data/heroVideos.ts` (player data, description, measured `seconds`, `pageHeroVideo` map); uploadDate
  is the mp4's first git commit. The sitemap entries are read back from each page's JSON-LD. seo-check
  fails if a page plays a video its schema doesn't describe, or the reverse. Re-measure `seconds` if a file
  is re-cut. Google may still not show them as video results (hero videos aren't a page's main content).
- **The Worker serves the 15 indexable pages first** (`run_worker_first` in wrangler.toml, exact paths):
  `worker/pages.js` returns the page's Markdown copy for `Accept: text/markdown`, and adds `Link` headers
  (Markdown copy + font preloads for Cloudflare Early Hints) and the site-wide security headers.
  `worker/pages.json` is written by the build (`src/integrations/worker-manifest.mjs`, base `/` builds
  only) from the built pages and `public/_headers`' `/*` block: commit it after a build changes it.
  **Adding a page: add it to `run_worker_first`** (seo-check fails otherwise). Tested in `wrangler dev`.
- Dashboard-only steps (docs/10-launch.md): switch the deploy command, turn Early Hints on, look at AI
  Crawl Control monthly.

## CI browser cache, Maya contrast (2026-11-20, branch `security-hardening`)
- **CI keeps Playwright's Chromium between runs** (`actions/cache`, keyed by the Playwright version in the
  lock file) and tries each browser or system-package install twice, so one slow download doesn't fail the
  run. The `npm ci` failure before it was a lock file written by an older npm: refresh the lock with the npm
  that CI's Node ships (`npx npm@<version> install --package-lock-only`) if `npm ci` reports missing packages.
- `npm run axe` and a scan of every concept page are now clean; Maya's ink on pink is `#04262C` (4.9:1).

## Before and after under Agentic AI-ready (2026-11-20, branch `before-after`, awaiting sign-off)
The wireframe line drawing (`DrawWireframe.astro`, deleted) is replaced on Home and Services by
`BeforeAfter.astro`: the docs/03 sample electrician (Ashby Electrical, `.example`, tagged "Concept")
as a dated site and a rebuilt one, plus a phone view and "What an AI agent reads". Six numbered
changes (secure address, phones, next step, prices, speed, AI-readable), all standard on every tier;
picking or hovering one lights its markers in both windows (`card-pick.ts` + CSS `:has`, no new JS).
Windows are aria-hidden; the list carries the content. Marker positions are % of each window
(the pages inside scale with cqw, so they hold at every width): re-measure if the mock layout changes.
The phone's screen and body are separate elements (an element can't size its font from its own cqw).
The after window is a sample page that plays itself (Gurman, 2026-11-21: animated and detailed like
the CV concepts, but not clickable): `scripts/before-after.ts` loads GSAP when it's near, scrolls the
page inside the window (a `--sy` CSS variable in em, so it holds at every width) through hero,
services, steps, quote form and footer, animating each part, and loops while 35% on screen. Picking a
change jumps the tour to its part and holds (`PART_FOR_CHANGE`); the data panel lights the rows for the
part on show (`data-am-on`). The phone scrolls by a CSS animation while the tour plays. Reduced motion
and Data Saver: nothing plays, a pick just shows the part. `pointer-events: none` on the mock.
Copy is a draft awaiting Gurman's sign-off.

## Six business concepts and the city pages (2026-11-21, branch `business-concepts`, awaiting sign-off)
- **/business-websites/ wall is back** with six drawn concepts (no photos, Gurman's choice), the docs/03
  sample businesses: spiceroute (Essential, phone), ashby (Start), northgate (Launch), movewell (Launch,
  Manchester), atelierrose (Growth, phone), brightsquare (Growth). Each `shows` line names its tier, so the
  wall runs Essential to Growth. Fields `Food`, `Health`, `Beauty` added. Same rules as the CV concepts
  (Atelier Rose uses Kalnia and Instrument Sans: Gurman found Cormorant "slop", 2026-11-21) (badge back to `../../business-websites/`, `preview.js`, GSAP under matchMedia, JS-driven hover). Sample
  phone numbers are Ofcom drama numbers (0113 496 0xxx, 0161 496 0xxx, 01632 960xxx). Forms send nothing.
- **City pages `/web-design-leeds/` and `/web-design-manchester/`** (`CityPage.astro`, words in
  `src/data/cities.ts`, each with its own sections and FAQ, never a swapped-name copy). Gurman confirmed
  (2026-11-21) in-person meetings in Manchester and, around Leeds, in Leeds, Bradford, Shipley, Keighley,
  Wakefield, Huddersfield, Halifax, Harrogate and York. Schema: a Service with areaServed cities, an
  AggregateOffer from the tiers, and FAQPage. Footer "Leeds · Manchester" link to them; `/leeds` and
  `/manchester` redirect. Copy is a draft awaiting his sign-off.
Lighthouse 95/100/100/100 on both city pages and /business-websites/, axe 0 on 19 pages and the six concepts.

## Client accounts: login and the brief (2026-11-23, branch `client-accounts`)
Parts 1 and 2 of Gurman's "access before payment" plan (spec
`docs/superpowers/specs/2026-11-23-client-accounts-design.md`, plan in `docs/superpowers/plans/`).
Invite-only: an admin creates a client at `/admin/` and pastes the one-time setup link (7 days) into
an email; the client sets a password, fills in the brief at `/account/brief/` (saves to the server as
they go) with uploads, and sends it; the studio inbox gets a summary. Parts 3 (watermarked preview)
and 4 (Stripe, then publish) are next and plug into `projects.status` and the "Your preview" box.
1. **API in the Worker** (`site/worker/accounts/`, JSON, no new npm dependencies): D1 (`DB`,
   migrations in `site/migrations/`), R2 (`FILES`, private). Changes need our own `Origin`; anything
   a user may not see is 404. Tests run on `node:sqlite` with the real migrations (`npm test`).
2. **`"/api/*"` is in `run_worker_first`.** Without it the static-asset handler answered every API
   path itself (404 page, 405 for POST), the enquiry endpoint included. seo-check requires it.
3. **The brief's questions are data** (`src/data/brief.ts`, plain erasable TypeScript with no imports,
   so the Worker and Node import it directly). Feature options list the tiers that include them
   (`in`); a test checks the names against `pricing.ts`. No prices in the brief.
4. **Pages are static shells** (noindex, out of the sitemap, llms files and Markdown copies; listed
   in seo-check's `NOINDEX_FILES`); scripts in `src/scripts/account/` build everything with
   `textContent`, never HTML. Styles are global under `acct-` in `AccountShell.astro`.
5. **Admins are made only by `npm run make-admin -- <email> "<name>" [--remote]`**; no screen makes
   admins. PBKDF2 at 100,000 iterations (the Workers maximum); tokens stored as SHA-256 hashes.
6. Setup steps: `docs/10-launch.md` "Client accounts". Steps 1-3 done 2026-11-23 (D1 `hm_accounts`
   and private R2 `hm-client-files`, both Western Europe; R2 switched on with a card, free tier).
   Live since 2026-11-23 (deployed from `client-accounts` with `npm run deploy`, version 575310b6);
   admins: humansoftwareagency@gmail.com (Gurman) and mandeepduklu@googlemail.com (Mandeep).
7. Footer Legal column has "Client login"; the footer line says "No tracking" (was "No cookies").

## Enquiries list in /admin/ (2026-11-23, branch `client-accounts`)
Every valid form send (contact, landing, free AI check, "Choose this concept", agents' JSON) is
saved to D1 (`enquiries`, migration 0002) before its email goes out, and listed at the top of
`/admin/` (`worker/accounts/enquiries.js`, `src/scripts/account/admin.ts`). The page checks every 30
seconds while visible (and on returning to the tab), re-renders only when something changed, shows
the count of new ones in the tab title and announces arrivals. Statuses: new, replied, not a fit,
client. "Make client" fills the New client form (type guessed from tier, service or concept) and
links the enquiry to the account. Kept 12 months unless it became a client (deleted when the list
loads). If saving works, a failed email still answers "sent", since the team sees it in /admin/.
The privacy notice ("If you use a form") and the contact FAQ say a copy is kept; the honeypot
spam field still means nothing is saved.
**Deleting** (Gurman, 2026-11-23): each enquiry has Delete; each client page has "Remove this
client", which deletes the account, sessions, setup links, projects, briefs, file records, their R2
uploads and every enquiry from that account or email (`deleteClient` in admin.js; child rows are
deleted explicitly, not left to cascades). Admin accounts can't be deleted there (404). Both ask to
confirm first. Use it for deletion requests under the privacy notice.
