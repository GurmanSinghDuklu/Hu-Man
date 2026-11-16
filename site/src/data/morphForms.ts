/**
 * The brand shapes as single SVG paths in a 0-100 box, so MorphSVG can turn one into another
 * (MorphShape.astro draws the first; scripts/motion/play.ts morphs through the rest).
 */
export const morphForms = {
  circle:
    'M50 8C73.2 8 92 26.8 92 50C92 73.2 73.2 92 50 92C26.8 92 8 73.2 8 50C8 26.8 26.8 8 50 8Z',
  arch: 'M14 92L14 48C14 28.1 30.1 12 50 12C69.9 12 86 28.1 86 48L86 92Z',
  sparkle:
    'M50 2C53.4 37 63 46.6 98 50C63 53.4 53.4 63 50 98C46.6 63 37 53.4 2 50C37 46.6 46.6 37 50 2Z',
  pill: 'M30 30L70 30C81 30 90 39 90 50C90 61 81 70 70 70L30 70C19 70 10 61 10 50C10 39 19 30 30 30Z',
  square: 'M14 14L86 14L86 86L14 86Z',
  drop: 'M50 6C50 6 84 44 84 64C84 82.8 68.8 94 50 94C31.2 94 16 82.8 16 64C16 44 50 6 50 6Z',
} as const;

export type MorphForm = keyof typeof morphForms;
