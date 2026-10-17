# Identity

## Logo

The wordmark is fixed artwork; never retype it. Four versions live in the Logos asset group: `logo-signal.svg` (primary, on Ink), `logo-ink.svg`, `logo-paper.svg`, and `logo-ridge.jpg` (the fingerprint-filled hero version). Clear space is half the cap height on every side. Minimum width is 96 px on screen and 20 mm in print. Full rules: the Logo component.

## Colour

Four neons on near-black. Ink and Paper carry the layout; the neons are the light coming off it.

| Role | Token | Hex | Share of a layout |
| --- | --- | --- | --- |
| Ink | `brand-ink` / `surface` (dark) | #0B0D0A | 40 to 60% |
| Paper | `brand-paper` / `surface` (light) | #F2F2EC | 20 to 40% |
| Signal, neon green | `signal` | #39FF14 | 15 to 25%, in every layout |
| Pulse, neon purple | `pulse` | #DF00FF | one block, under 10% |
| Flare, neon orange | `flare` | #FF5F1F | one block, under 10% |
| Volt, neon yellow | `volt` | #E7FF00 | sparks only, under 5% |
| Scan, teal | `scan` | #14DCB2 | data only, under 5% |
| Concrete | `concrete` | #8E908A | photo mid-tones, the odd neutral block |
| Night, dark blue | `night` | #0A1033 | website section grounds, alternating with Ink (added 2026-10-17) |
| Plum, dark purple | `plum` | #1B0A2E | website section grounds, alternating with Ink (added 2026-10-17) |

The logo's own gradient runs `signal-hi` #B2FF58 to `signal-lo` #6DFF5A, top to bottom.

**Where the palette came from**: Gurman chose the four neons. Pulse and Flare take the purple and orange roles of the NAVIS posters; Volt is the spark; Scan, the teal from the Figma palettes, stays for data.

**Combining them**
- Ink and Paper carry every layout. Signal appears in every layout. Add up to two more neons per layout, one block each.
- **Night and Plum** (website only, added 2026-10-17 at Gurman's request) are dark grounds that alternate with Ink so a long page isn't one black slab. Treat them like Ink: Paper text, Signal in every band, neons allowed on them. Every pair checked for AA.
- **Two neons never touch.** Ink or Paper always sits between them. One exception (2026-10-17): the website's hover glitch on project tiles flashes a Pulse band and a Signal band over the same image for a third of a second. Side by side they blur into each other (green and yellow are only 1.2:1; purple and orange 1.2:1).
- Neons live on Ink. On Paper they lose their glow (green and yellow drop to about 1:1), so on Paper use a neon only as a filled block with Ink text on it.

**Making them pop on every screen**
- The darker the ground, the brighter a neon looks. Keep neons on `brand-ink` #0B0D0A: near-black reads as black on OLED and AMOLED and avoids the grey haze of pure #000000 on LCD backlights.
- On wide-gamut screens (most OLED and QLED phones, recent laptops and TVs) `components/bundle.css` swaps the neons for Display P3 versions, more saturated than any sRGB screen can show. Standard LCD screens keep the hex values. Edit both together.
- For video and social exports, export in sRGB with the hex values, and keep neon blocks large: a 1:1 block of neon beside Ink glows; thin neon lines on a busy image do not.
- Print can't reach these colours in CMYK. Use fluorescent Pantone inks (for example, ask the printer for 802 green, 804 orange, 803 yellow and a purple match) and approve a proof.

**Contrast**: Ink on Signal 14.4:1, on Volt 17:1, on Flare 6.4:1, on Pulse 5.2:1. Text on every neon is Ink. Never white: white on Pulse is 3.8:1 and on Signal 1.4:1.

**The logo** keeps its original gradient artwork, a softer green than Signal. It can be recoloured to #39FF14 if you want an exact match.

## Typography

The logo is the typeface reference: wide, geometric capitals with flat terminals.

| Role | Family | Use |
| --- | --- | --- |
| Display | Montserrat 800 and 700 | Headlines in capitals, numerals. Its geometric forms match the wordmark. |
| Text | Archivo 400 to 700 | Paragraphs, UI, documents. A neutral grotesk that keeps the Swiss feel. |
| Mono | IBM Plex Mono 400 and 500 | Labels, rails, data, before-and-after numbers. The "software" voice. |

**Scale** (styles in tokens): `numeral` 200, `display-xl` 120, `display-l` 72, `display-m` 44, `headline` 28, `title` 20, `body-l` 18, `body` 16, `small` 14, `label` 12 (mono, +0.14em tracking), `data` 14 (mono).

**Rules**
- Display is always capitals with tight tracking (-0.01 to -0.02em) and leading under 1.
- Big contrast: pair a headline of 72 px or more with labels of 12 to 14 px, and almost nothing in between.
- Set text flush left, ragged right. Centre only single words in square cells.
- Numerals are graphics: let them run off the edge of their cell.
