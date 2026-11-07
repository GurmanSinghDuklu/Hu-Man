# /portfolio gallery: more concepts, live previews (2026-11-07)

Gurman wants /portfolio to be a flagship: many concept portfolio sites for ordinary jobs (not only
designers and developers), shown as a sprawling wall where each concept plays its own motion as it
scrolls into view and reacts to the mouse.

## Approach agreed in chat
Gurman sent 11 Awwwards references and asked for concepts that keep 75-80% of their design. We keep
the **interaction mechanics and general feel** (techniques are nobody's property) but every concept
has its own layout, type, colours, art and copy. We never copy their code, images, logos, wordmarks
or text. Reason: the studios' visual work is theirs, the Awwwards community spots lookalikes, and
"designed around the person, not a template" must stay true.

## Reference research (built-in browser, 7 Nov 2026)
Three links were dead (404 on Awwwards): `interaction`, `charbel`, `doctor-romeu-psicologos`.
Hoyer's live site has been redesigned since its award, so its notes come from the award entry.

| Ref | What it is | Mechanics worth keeping |
|---|---|---|
| sobra.be | Creative technologist, Antwerp | Cream page, huge hand-lettered wordmark, a coral dot that follows you ("follow the dot"), a pinned dark section "I build *interfaces*." where the italic serif word and its colour change per step with progress dashes, side tab changes colour per section, a "break the logo" toy at the end |
| morevolume.com | NY fabrication studio | One-screen hero: duotone (red) full-bleed video, big serif wordmark, thin marquee band of services, giant outline condensed nav words that fill solid on hover and swap the background clip, rotating circular text badge; work page = stacked full-width bands with condensed caps names |
| mcreativeindustries.com | Personal brand of a speaker/trainer | Full-bleed video hero with the name centred; orange band with "SPEAKER · TRAINER · CONSULTANT · AUTHOR" in one line; photos rising over it in parallax; broadcast icon + one big sentence; image grid; Lenis + GSAP |
| labellavista.es | Production company | Plane-cabin hero, "please lower your window shade": scrolling lowers the shade and dives through the window into the reel; DM Mono labels, live clock; project mosaic of video tiles with mono chips |
| hoyermotors.com (award version) | Electric motors | Black / #9C9C9C / white; 3D motor sequences in fixed camera angles with hard light moving across the metal; those sequences used as chapter breaks |
| varsity.vc | Seed VC | Photo hero with thin grid lines and huge flared serif caps; photo breaks into a 3 x 2 grid of colour blocks (plum, lime, pink); then colour tag chips (RISK, SEED, GROWTH...) floating at different depths around a centred serif statement; lime CTA |
| addviso.com | Digital agency | Near-black with grain, four coloured shapes (leaf, diamond, star, circle) = four service pillars; ruled list rows with the shapes; tilted, tinted case cards; floating bottom dock with the four shapes |
| crosemont.qc.ca | College | Coral striped monogram, "find your programme" finder with colour-coded categories |

## The eight new concepts (all "Concept", fictional people, fictional `.example` employers)
| Slug | Person | Job | Built from |
|---|---|---|---|
| priya | Priya Nair | Operations manager, Leeds | SoBra mechanics |
| dan | Dan Okafor | Construction site manager, Bradford | Volume mechanics |
| grace | Grace Whitfield | Nurse educator, Sheffield | M Creative mechanics |
| sofia | Sofia Marín | Travel consultant, Manchester | La Bella Vista mechanics, real cabin video, airport terminal language |
| ryan | Ryan Holt | Vehicle technician, Wakefield | Hoyer mechanics |
| hannah | Hannah Cole | Bookkeeper, York | Bookcase career (library.jjangik.kr feel); replaced the Varsity build on 7 Nov |
| kai | Kai Thompson | Restaurant general manager, Liverpool | Addviso look and feel (rebuilt 7 Nov) |
| amira | Amira Hussain | Biomedical science graduate, Nottingham | Crosemont mechanics |

## Rules for every concept page
Same as the first three (CLAUDE.md "Concept portfolios"), plus the preview contract:
- `public/concepts/<slug>/index.html`, one file, inline CSS and JS, `noindex,nofollow`, no outside hosts.
  Fonts from `../fonts/` (woff2 copied from `@fontsource`), GSAP only from `../vendor/`.
- The `.badge` back link exactly like the others.
- `<script src="../preview.js" defer></script>` before `</body>`.
- The hero moves on its own (an idle loop) so a preview tile is alive with no input.
- Mouse effects read `clientX/clientY` from `pointermove` or `mousemove` on `window` or `document`
  (the preview sends synthetic events there).
- Honest content: no testimonials, ratings, real employer names or logos, no statistics presented as
  real results. Sample figures read as sample (e.g. a rota, a route map), never as claims.
- `prefers-reduced-motion`: no loops, no scroll-jacking. WCAG AA contrast. Works at 360px.
- No photos (none we own yet): art is CSS, SVG or canvas. Photography can be added later with muapi.

## Gallery on /portfolio
- Data in `src/data/portfolioConcepts.ts` (all 11), one poster per concept in
  `src/assets/portfolio-concepts/` (Playwright, `npm run concept-posters`).
- A wall of tiles in offset columns that drift at different speeds while scrolling. Each tile shows its
  poster; when it comes near the viewport an iframe of `/concepts/<slug>/?preview` mounts over it, and
  it unmounts when far away (max 4 live). The preview script auto-scrolls the concept, moves a ghost
  cursor, and follows the real cursor while it is over the tile.
- Reduced motion, Data Saver or no JS: posters only. Every tile links to the full concept.
- `_headers`: `/concepts/*` gets `frame-ancestors 'self'`; the global CSP meta gets `frame-src 'self'`.
