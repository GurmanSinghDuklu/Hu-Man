# /brand/ — Brand Studio (spec, 24 Nov 2026)

Owner: Gurman / founder. Status: build on branch `brand-studio` (local only, do not push).

## Why this page exists
HU/MAN now sells brand identity (logo, logomark, clear space, type, palette, imagery, patterns,
social creatives, banners, mockups, business cards, signage, billboard, merch, guidelines).
The page is two things at once:
1. **Proof**: a gallery of 44 original Concept identities and one complete case study (Pura).
2. **A Brand Board**: a step-by-step builder where a visitor collects inspiration and chooses
   palette, logo direction, typeface and sees real photo mockups of their own name. To SEND it
   they create an account / sign in (Cloudflare Access), so it lands in our backend and a human
   picks it up. This is the "human in the loop" promise: the board is a brief, not a generator.

The founder rejected a first prototype as "AI slop": generic thick serif + italic script, too few
options, cartoon mockups. Quality bar: world class, first of its kind, keeps people on the page.
**Never** pair a heavy serif headline with an italic calligraphy line. No emoji. No blue-purple
gradient backgrounds, no left-border cards (Lens rules).

## Look and feel: the live site (Lens)
Use the site's own system: `src/styles/tokens.css`, `base.css`, `BaseLayout`, `SiteHeader`,
`SiteFooter`, `InnerHero`, `TalkBanner`, `ScrollCue`, `play/Shape`, `play/Sticker`, `.band`, `.sheet`,
`.label`, `.display`, `.pill-btn`, `data-reveal`, `data-rise`, the `--u` grid. Paper ground, Ink
type, Montserrat display capitals, Archivo text, IBM Plex Mono labels, one gradient accent per
section. Copy existing patterns from `portfolio.astro`, `business-websites.astro`, `about.astro`
rather than inventing new chrome. Read the WHOLE of `../CLAUDE.md` first and obey every hard rule
(no browser storage, CSP-hashed inline scripts, UK English, sentence case, buttons say what
happens, "Concept" tag on concept work, no invented proof, no prices that aren't in pricing.ts —
brand identity has NO prices yet, show none).

## Assets (already in the repo)
- `src/assets/brand-studio/gallery/<slug>.webp` — 44 posters, 1120×1400 (4:5). Use `astro:assets`
  `<Image>` (webp, responsive widths, `loading="lazy"`).
- `src/assets/brand-studio/pura/` — `pura-logo.svg` (single path, `fill="currentColor"`, viewBox
  0 0 2599 1158), `pura-hero.jpg` (logo over olive branches), and 13 photo mockups:
  pura-bottle, pura-tin, pura-shopfront, pura-billboard, pura-cards, pura-tote, pura-apron,
  pura-van, pura-cup, pura-bag, pura-giftbox, pura-menu, pura-tee (.jpg).
  Logomark = the same SVG with viewBox `642 0 670 1042` (the U with its two leaves).
- `public/brand-studio/bases/*.webp` — 6 neutral photo bases for live mockups.
- `public/brand-studio/fonts/*.woff2` — 25 display faces + Figtree/DM Sans (OFL, via Fontsource).
  Load them lazily with the FontFace API only when the type step / mockups come near the viewport.
  Never @import them globally. Add `public/brand-studio/fonts/README.md` naming them as SIL OFL 1.1.
- `src/data/brandStudio.ts` — `studioFonts`, `studioBodyFonts`, `moods`, `gallery` (slug, name,
  style, mood, tags, font id, palette), `palettes` (159, with `theme`), `paletteThemes`,
  `mockupBases` (print area as % x,y,w,h; `surface` 'fill' = paint whole area in brand colour,
  'print' = ink the name onto fabric/paper).

## Page structure (`src/pages/brand.astro`, page key `brand`)
Register the page everywhere CLAUDE.md says a new page needs: `src/data/pages.ts` (title +
description, no prices), `run_worker_first` in `wrangler.toml`, `public/_redirects` (`/brand 301`),
sitemap/seo-check, llms.txt if pages are listed there, header nav (add "Brand identity" next to
"CV portfolio") and footer if it lists services.

1. **Hero** (`InnerHero`, no video): label "Brand identity". Title (display caps):
   "Anyone can prompt a logo. Not everyone should." Lede: "Brand identities built by people:
   logo, type, colour, mockups and the guidelines to keep it all consistent. Start with what you
   love. Finish with a human." ScrollCue → `#gallery` ("See 44 directions below").
   Add two buttons: "Start your brand board" (#board) and "Book a free 1-hour call" (contactPath).
2. **Gallery `#gallery`** — "44 directions. Pick the ones that feel like you."
   Filter chips by mood (All + `moods`), a count, and a dense, editorial 4:5 grid (4 cols desktop,
   2 tablet, 2 phone). Each tile: image, name, style, a small "Concept" tag, and two actions:
   ♡-style "Save to board" toggle (text button, not emoji; max 6 saved, counter in the board) and
   "View". View opens an accessible dialog (`<dialog>`) with the large image, its palette swatches
   (with "Use this palette"), its suggested typeface rendered live ("Use this type") and
   prev/next. Saved items appear in the board's Inspiration step and drive suggestions.
3. **Pura case study `#pura`** — treat as a real client launch, tagged "Concept" once in the
   header line. Sequence (each a band, editorial layout, generous whitespace):
   - Cover: `pura-hero.jpg` full-bleed with "Pura. Olive oil, deli, kitchen." and a 4-line brief
     ("A Puglian olive oil house opening a deli and kitchen. Warm, generous, never stuffy.").
   - Primary logo on Olive and on Cream (inline SVG via `set:html` of the file with colour).
   - Logomark + app icon tile + favicon size.
   - Clear space: logo inside a dashed box, margin = "x" (height of the leaves), labelled, plus
     minimum sizes (logo 24 mm / 120 px, mark 8 mm / 24 px).
   - Palette: Olive Grove #4F5B2A, Cream Press #F3ECDD, Terracotta Sun #C8613F, Sage Leaf #B7C09A,
     Pit #1F2414, with roles and AA notes (compute real contrast ratios).
   - Type: Fredoka 700 display, Figtree body; hierarchy sample (Display / H1 / H2 / Body / Caption)
     using the woff2 files in public/brand-studio/fonts.
   - Graphic pattern: an SVG repeat of the leaf-pair and olive drops in Sage on Olive.
   - Social: three 4:5 posts built in HTML/CSS (photo crop of pura-hero + type + palette),
     and a profile banner strip.
   - Mockups: all 13 photos in a rhythmic editorial grid (mix of tall/wide, captions in mono:
     "Bottle label", "1 L tin", "Shopfront", "Billboard, 48-sheet", "Business cards", "Tote",
     "Apron", "Delivery van", "Takeaway cup", "Kraft bag", "Tasting box", "Lunch menu", "Tee").
     Click opens the same dialog viewer.
   - Close: "This is what you get" → links to #get and #board.
4. **Brand Board `#board`** — the heart. A two-column layout on desktop: steps on the left,
   a sticky LIVE PREVIEW on the right (name in chosen font, palette bar, one rotating photo
   mockup, saved gallery thumbs). On phones the preview is a bottom "Preview" button opening a
   sheet. A step rail at the top (1–7) with completion ticks; each step is a card that can be
   collapsed; "Next" buttons. All state in one JS object in memory. NO localStorage /
   sessionStorage / cookies (motion-check fails on any storage). Use `src/scripts/brand-studio/*.ts`
   modules imported in a `<script>` (Astro bundles them, CSP-safe).
   1. **Basics** — brand name (default "Your brand"), what you do (one line), who it's for, and up
      to 3 mood words from ~18 chips.
   2. **Inspiration** — drag-and-drop + file input (images and short videos, max 12, thumbnails via
      object URLs, remove, optional note per item), paste links (chips), and the gallery items
      the visitor saved. For each image, extract 5 colours in a canvas (k-means) and show
      "Colours from your uploads" (click to add). Note: "Only upload things you're happy to share.
      No ID or personal documents."
   3. **Colour** — this must feel like Coolors + Figma palettes, not a swatch list:
      - A big generator bar (5 tall columns, hex + name-ish label, lock toggles, copy hex,
        drag/arrow reorder). Space bar (when focus isn't in a text field) or "Generate" button
        makes a new palette; modes: Random, Analogous, Complementary, Triadic, Split,
        Monochrome, Pastel, Earthy, Neon. Locked columns stay.
      - Library: all 159 `palettes`, filter chips by theme ("2026 trending", "Future forward",
        "From our gallery"… ), a search, and a grid of palette strips; click loads into the bar.
      - The bar IS the selection: max 5 colours, roles Primary, Secondary, Accent, Dark, Light
        (re-assignable). Contrast checks (Dark on Light, Light on Primary) with AA pass/fail.
   4. **Logo direction** — pick up to 3 of the 44 gallery directions (filterable grid, smaller
      tiles; saved ones pre-selected) and choose logo types (wordmark, lettermark, mascot,
      emblem/badge, combination, abstract mark). Option to upload an existing logo. Notes box.
      Label: "Directions, not final logos. Our designers draw the real thing."
   5. **Typeface** — all 25 `studioFonts` rendered with the visitor's brand name, grouped by
      `kind`, with "Suggested from your picks" first (fonts of chosen gallery directions). Pick 1
      display + 1 body (Figtree / DM Sans). Show a hierarchy preview in chosen colours.
   6. **Mockups** — the 6 `mockupBases` as real photos with the visitor's name live on them:
      'fill' surfaces get a rectangle in Primary with the name in Light; 'print' surfaces get the
      name in Primary with `mix-blend-mode: multiply`. Re-apply the photo's texture over 'fill'
      areas with a clipped copy of the photo at `mix-blend-mode: multiply; opacity: .35` so it
      reads as printed, not pasted. Font size auto-fits the area (measure + scale). Also a mini
      guidelines sheet (wordmark, palette with roles + hex, type, clear-space diagram).
   7. **Review and send** — summary of everything; fields: name, email, business/website
      (optional), "What should this brand do for you?", timeline; consent checkbox. Primary
      button: "Create an account or sign in to send". Explain: "We use Cloudflare Access: a
      one-time code to your email. No password." Flow in `src/scripts/brand-studio/account.ts`:
      - Config in `src/config/brandStudio.ts`: `accessBase = '/studio/'` (the Access-protected
        path; TBC with Gurman), `submitUrl = '/studio/api/brand-board'`, `whoamiUrl =
        '/studio/api/me'`, `bookingUrl` = the site's existing booking link.
      - Click opens a popup to `${accessBase}signed-in/` (Access shows its own login, then serves
        that page). That page (ship it as `public/studio/signed-in/index.html` + an external
        `signed-in.js`, no inline script) posts `{type:'signed-in'}` on a `BroadcastChannel
        ('hu-man-studio')` and closes itself. COOP is same-origin so `window.opener` is lost
        across the Access redirect: do NOT rely on opener. Also poll `whoamiUrl` (credentials:
        'include') every 2 s while the popup is open, as a fallback.
      - Once signed in: POST `multipart/form-data` to `submitUrl` with the brief JSON + files
        (credentials: 'include'). Success → a confirmation panel ("Your board is with us. A
        person will reply within 48 hours.") + booking button.
      - If the endpoints 404 / fail (not deployed yet): a calm fallback panel offering "Download
        my board (.json)" and "Book a free 1-hour call". Never lose their work.
      - Add the Access sign-in cookie (`CF_Authorization`, strictly necessary, only set when you
        sign in) as a DRAFT line on `/cookies/` and `/privacy/` and flag it in your report.
5. **What you get `#get`** — the 14 deliverables as a grid of tiles, each with a crop of a Pura
   asset (primary logo, logomark, clear space, primary typeface, type hierarchy, colour palette,
   brand imagery, graphic patterns, social creatives, social banners, brand mockups, business
   cards, billboard and signage, merch). Footnote: "Exact deliverables are agreed on your call."
6. **How it works** — Send your board → Free 1-hour call → 2–3 directions → Refine together →
   Guidelines handover. Then: "Need the website too? We build that next, on-brand from day one."
7. **FAQ** (same open-card style as portfolio FAQ, data in `src/data/faq.ts` as `brandFaq`):
   I don't know what I want yet; Can I just upload things I like?; Why do I need an account?
   (so your uploads stay private and we can pick up your board; one-time code, no password);
   Do you use AI? (We use AI tools to explore ideas quickly. Every direction is chosen, drawn and
   refined by a person.); Do I own the final logo? (Ownership and file formats are confirmed in
   your proposal before any work starts.); Are the 44 directions real brands? (No. They're our
   Concept work, so you can see range. Your brand will be your own.); Can you build the website
   too? (Yes — websites, apps and software, built to be found by Google and AI search.)
8. `TalkBanner`, `SiteFooter`.

## Motion
Use the site's existing motion vocabulary only (reveals, rise, Shape in headlines, Sticker in
labels, pin-steps where it fits). Respect reduced motion. Gallery tiles: subtle lift on hover.
Generator: columns snap/flip on generate. No scroll-jacking.

## Accessibility and performance
Every control is a real button/input with a label; dialogs trap focus and close on Esc; colour
chips announce hex; aria-live for counters/limits ("Five is plenty. Unlock or remove one first.").
Images lazy except the hero. Fonts lazy. Keep JS split per feature. Run and pass:
`./node_modules/.bin/astro check`, lint, build, `npm run axe` (add /brand/), `npm run seo-check`
if present, `npm run motion-check` (no storage), and Lighthouse on /brand/ (aim ≥ 90 perf).

## Deliverables of the build
- Working page on branch `brand-studio`, committed locally in logical commits (no push).
- Screenshots at 1440 and 390 wide of every section into `/home/claude/brand-studio-shots/`
  (full page split into several PNGs; also the board with a filled-in example "Saltmarsh",
  a Bold palette, two gallery picks, Unbounded type, mockups visible).
- A CLAUDE.md section "Brand Studio (2026-11-24, branch `brand-studio`)" with gotchas.

## Addendum (24 Nov, late): a second case study, Latte
The founder added a second full identity, **Latte** (an independent coffee shop and roastery),
built the same way as Pura. Present BOTH case studies with ONE reusable component
(`src/components/brand-studio/CaseStudy.astro`) fed by a `caseStudies` array you add to
`src/data/brandStudio.ts`, and a switcher at the top of the section (tabs "Pura · olive oil house"
/ "Latte · coffee shop"; both are also directly linkable as `#pura` and `#latte`). Each case study
must look like a real client launch (tagged "Concept" once).

**Latte** — assets in `src/assets/brand-studio/latte/`:
- `latte-logo.svg` (single path, `fill="currentColor"`, viewBox 0 0 2615 1578). Logomark (the mug
  with steam) = viewBox `366 0 784 741`.
- Photos (jpg): latte-exterior (shopfront, hero cover), latte-interior (counter + menu board),
  latte-paper-cups (3 takeaway sizes), latte-mugs (ceramic mugs), latte-giant-mug, latte-iced
  (iced latte, clear cup), latte-frappe (caramel + matcha frappés), latte-tumbler (insulated),
  latte-pouch-dark (House Blend bag, full label), latte-pouch-cream (Ethiopia single origin),
  latte-bakery-bag, latte-napkins (napkins + pastry bag), latte-carrier (cup carrier, loyalty
  card, sticker), latte-giftbox (The Morning Box), latte-aframe (pavement board), latte-apron.
- Brief: "An independent coffee shop and roastery opening its first site. Warm, a bit cheeky,
  serious about coffee."  Tagline: "Good mornings, made here."
- Palette: Espresso #2A1B14 · Steamed Milk #F3E7D3 · Coffee Cherry #A31F2E · Caramel #C98A4B ·
  Pistachio #A9C49A.
- Type: Bricolage Grotesque 800 for headings (file already in public/brand-studio/fonts),
  Figtree for body. The logo itself is custom lettering.
- Pattern: scattered mug marks and sparkles in Caramel on Espresso.
- Social: three posts (iced latte, house blend bag, "Ten coffees, one on us" loyalty) + banner.

**Pura** keeps its section as specified above (its cover is pura-hero.jpg, tagline "Pressed
slowly. Poured freely.", Fredoka 700 + Figtree).

The "What you get" tiles can now draw from both brands.
