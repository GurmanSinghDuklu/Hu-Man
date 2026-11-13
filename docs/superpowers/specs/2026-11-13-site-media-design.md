# Site media: footage from our reels across the site (2026-11-13)

## Brief
Gurman: the whole site should have the contact page's quality, with videos playing, good animation and
real images. Decisions (2026-11-13):
- **Keep the Paper look.** Pages stay light; footage goes inside the existing sections (collage cells,
  cards, panels), not as full-screen dark heroes.
- **Footage from our own reels only**: `public/landing/reel.mp4` (brand scenes) and `found.mp4`
  (cinematic shots). No new generation.
- Order: finish the 3D projects stage and scroll story first (committed 235cb36), then media.

## Rules
- Mood only. Clips are `aria-hidden`; never caption a person in the footage as a client, never cut a
  moment that shows a price, a review or a rating.
- Burned-in words (captions, corner labels) are cropped out of every clip. Check each new crop with
  the contact sheet `npm run cut-clips` writes to `reports/clips/<id>.jpg`.
- Motion follows the hybrid rule: clips fade in on entry and ease from a slight zoom as you scroll
  (`[data-zoom]`); nothing switches content on scroll.

## As built
- `src/data/clips.ts`: one list of clips (source, start, length, crop, output width, quality, loop).
  `npm run cut-clips [id…]` (`scripts/cut-clips.mjs`, ffmpeg-static) writes `public/clips/<id>.mp4`
  (H.264, silent, faststart; short shots loop forwards then backwards) and the still
  `src/assets/clips/<id>.jpg`. Entries with `still: true` are pictures only.
- `src/components/Clip.astro` shows the still at once (responsive WebP, lazy). `src/scripts/clips.ts`
  waits for the page to settle, loads a clip when its frame is within a screen of the window, plays
  it only while visible, at most three at once (the most visible), and fades it in over the still
  once playing. Reduced motion or Data Saver: no clip loads. `fill` makes a clip fill a sized parent.
- Placements:

| Where | Clip |
|---|---|
| Hero collage, home and inner heroes | `veil-tile`, `cove-tile` in two former Ink cells |
| Ideas to life (home, services) | `cafe`, a pill window under the copy |
| Agent-ready (home, services) | `constellation`, replaces the Ink square by the orb |
| At the centre (home, services) | `head`, an arch under the copy |
| Talk banner (most pages) | `head` inside the paper ring that held the star |
| Services cards | pill windows: constellation, shop, mirror, map, software, tuscany |
| About | `map` still under "Who we are"; `tuscany` strip in the mission band |
| How we build | `wireframe` under the stages; `software` still under "What's under the bonnet" |
| Agentic AI-ready | `constellation` under "Customers are asking AI first" |
| Free AI check | `cove` strip under "Six things AI looks at" |

- Pricing and Portfolio get the collage tiles only, so their tables stay clean.
- Dropped: the leopard (the clean moments are under a second, the rest carry captions).

## Checks (2026-11-13)
Lighthouse 95-98 performance, 100 on the other three, on nine pages. axe 0 violations on all 17.
motion-check clear. Reduced motion: no clip requests, all stills shown. No sideways overflow at 360,
390, 768, 1024 and 1280px.
