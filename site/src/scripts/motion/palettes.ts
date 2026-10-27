/**
 * Colours for the moving shader gradients, drawn from the palette in src/styles/tokens.css. Text
 * sits on two panels, so every colour there keeps that text at WCAG AA (tests/palettes.test.mjs);
 * that is why the indigo and deep orange of the static --grad-talk are left out of `talk`.
 */
export type ShaderKey = 'ideas' | 'talk' | 'arch';

export interface ShaderPalette {
  colors: string[];
  /** The text colour drawn over the panel, or null when there is no text on it. */
  text: string | null;
  /** Paper Shaders speed: 0.15-0.4 keeps a background calm. */
  speed: number;
}

export const palettes: Record<ShaderKey, ShaderPalette> = {
  ideas: { colors: ['#2a3875', '#4c29dd', '#5c48dd', '#3b2fb4'], text: '#f1f2ec', speed: 0.2 },
  talk: { colors: ['#f8cea2', '#e79569', '#e85e8f', '#d9545a'], text: '#0b0d0a', speed: 0.25 },
  arch: { colors: ['#2c4377', '#3f7fa3', '#4a9bb0', '#edd1a8'], text: null, speed: 0.2 },
};

const channel = (hex: string, i: number): number => {
  const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);

/** WCAG 2 contrast ratio of two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
