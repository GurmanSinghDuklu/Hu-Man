Hu/man is a software agency run by Gurman, with Mandeep as adviser. It rebuilds websites for small businesses, makes them findable on Google and in AI search, and stays on to look after them. The identity joins two ideas: **the human** (a fingerprint, the one mark nobody can fake) and **the machine** (Swiss modular grids, op-art geometry, signal green on black). The look sits between Swiss modernism, brutalist poster design and contemporary tech minimalism: flush grids, hard edges, loud blocks, very few words.

## The system in one minute

- **Ground**: dark first. `surface` is Ink (`#0B0D0A`) in the home theme; the Paper theme (`#F2F2EC`) is for documents and print proofs.
- **Colour**: four neons on near-black. Signal green (#39FF14) is in every layout; Pulse purple (#DF00FF), Flare orange (#FF5F1F) and Volt yellow (#E7FF00) are accents, one block each at most. Two neons never touch. Scan (teal) is for data only.
- **Type**: Montserrat ExtraBold capitals for display (it matches the logo's geometric letterforms), Archivo for reading, IBM Plex Mono capitals for labels and rails.
- **Layout**: every piece is a flush grid of square modules; each module holds one thing.
- **Signature**: the Ridge. Fingerprint lines, and the rings, squares and hexagons that echo them, appear in every layout.
- **Angle**: the logo's slash, 68° from horizontal, is the only diagonal in the system.

## Using the tokens

- Set page grounds in `surface`; panels and fields in `surface-raised`; text in `ink`, secondary text in `ink-muted`.
- Fill primary actions and the hero block with `signal`; put `on-signal` text on it. Green text uses `signal-text`, which turns darker on Paper so it stays readable.
- Use `pulse` (purple) for the Hu/man Gift and offers, `flare` (orange) for dates and events, `volt` (yellow) for small sparks: a sparkle, a numeral, a label strip. One block of each at most; text on every neon is Ink (`on-pulse`, `on-flare`, `on-volt`).
- Use `scan` only for data: scores, charts, before-and-after numbers.
- Social posts, posters, cards and any module art use `brand-ink` and `brand-paper`, which stay the same in both themes, so the art never flips.
- `signal-hi` and `signal-lo` exist only for the logo gradient and the Signal glow behind it.
- Corners are `radius-0` everywhere. `radius-1` is for form fields; `radius-pill` is for status tags.
- Grid rules are `border-hairline` in `line`. Control borders are `border-rule` in `line-strong`.
- Focus is a 2px `focus-ring` outline with a 2px gap.

## Using the components

`components/bundle.css` holds the classes (`hm-btn`, `hm-tag`, `hm-label`, `hm-rail`, `hm-grid`, `hm-cell`). `components/bundle.js` defines `window.HuMan`: `HuMan.module(kind, {fg, bg, alt})` returns a square SVG module, and `HuMan.asset` holds the logo and Ridge file URLs. No framework is needed.

## Never

- Gradients other than the logo's own; drop shadows; rounded cards; glassmorphism.
- Diagonals at any angle except 68°.
- Text on top of a pattern module.
- Two neon blocks touching; more than one block of any accent neon in a layout.
- Neon text or thin neon lines on Paper.
- Stock photos of handshakes, laptops on desks or smiling teams.
- Emoji in brand materials.
