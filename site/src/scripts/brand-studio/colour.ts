/**
 * Colour maths for the Brand Board: conversions, WCAG contrast, the palette generator's modes, role
 * assignment and k-means colour extraction from an uploaded image. No dependencies.
 */

export type RGB = [number, number, number];
export type HSL = [number, number, number]; // h 0-360, s 0-100, l 0-100

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const wrap = (h: number) => ((h % 360) + 360) % 360;

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]: RGB): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

export function rgbToHsl([r, g, b]: RGB): HSL {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rr) h = ((gg - bb) / d) % 6;
  else if (max === gg) h = (bb - rr) / d + 2;
  else h = (rr - gg) / d + 4;
  return [wrap(h * 60), s * 100, l * 100];
}

export function hslToRgb([h, s, l]: HSL): RGB {
  const ss = s / 100;
  const ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Ink or white, whichever reads better on this colour. */
export function readableOn(hex: string): string {
  return contrast(hex, '#0B0D0A') >= contrast(hex, '#FFFFFF') ? '#0B0D0A' : '#FFFFFF';
}

export interface Verdict {
  ratio: number;
  label: string;
  pass: boolean;
}

/** WCAG AA for body text is 4.5:1, for large text 3:1. */
export function verdict(fg: string, bg: string): Verdict {
  const ratio = contrast(fg, bg);
  const text = `${ratio.toFixed(1)}:1`;
  if (ratio >= 4.5) return { ratio, label: `${text} AA pass`, pass: true };
  if (ratio >= 3)
    return { ratio, label: `${text} AA fail for body text, large text only`, pass: false };
  return { ratio, label: `${text} AA fail`, pass: false };
}

// ---------- generator ----------

export const MODES = [
  'Random',
  'Analogous',
  'Complementary',
  'Triadic',
  'Split',
  'Monochrome',
  'Pastel',
  'Earthy',
  'Neon',
] as const;
export type Mode = (typeof MODES)[number];

/** Lightness steps spread across the range, in a shuffled order, so a palette always has a dark and a light. */
function spread(n: number, lo: number, hi: number): number[] {
  const out = Array.from(
    { length: n },
    (_, i) => lo + ((hi - lo) * i) / Math.max(1, n - 1) + rnd(-4, 4),
  );
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function scheme(mode: Mode, n: number, baseHue: number): HSL[] {
  const ls = spread(n, 12, 92);
  const out: HSL[] = [];
  for (let i = 0; i < n; i++) {
    let h = baseHue;
    let s = rnd(40, 80);
    let l = ls[i];
    switch (mode) {
      case 'Random':
        h = rnd(0, 360);
        break;
      case 'Analogous':
        h = baseHue + (i - (n - 1) / 2) * rnd(18, 28);
        break;
      case 'Complementary':
        h = baseHue + (i % 2 ? 180 : 0) + rnd(-12, 12);
        break;
      case 'Triadic':
        h = baseHue + (i % 3) * 120 + rnd(-10, 10);
        break;
      case 'Split':
        h = baseHue + [0, 150, 210][i % 3] + rnd(-8, 8);
        break;
      case 'Monochrome':
        h = baseHue + rnd(-5, 5);
        s = rnd(18, 70);
        break;
      case 'Pastel':
        s = rnd(45, 80);
        l = rnd(78, 92);
        h = baseHue + i * rnd(35, 70);
        if (i === n - 1) {
          s = rnd(20, 40);
          l = rnd(14, 24);
        }
        break;
      case 'Earthy': {
        const hues = [14, 24, 34, 46, 72, 96, 140];
        h = hues[Math.floor(Math.random() * hues.length)] + rnd(-6, 6);
        s = rnd(22, 55);
        break;
      }
      case 'Neon':
        h = baseHue + i * rnd(50, 90);
        s = rnd(92, 100);
        l = rnd(50, 62);
        if (n >= 4 && i === n - 1) {
          s = rnd(10, 30);
          l = rnd(6, 11);
        }
        break;
    }
    out.push([wrap(h), clamp(s, 0, 100), clamp(l, 4, 96)]);
  }
  if (mode === 'Monochrome') out.sort((a, b) => b[2] - a[2]);
  return out;
}

const dist = (a: string, b: string) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
};

/**
 * A new palette of `colours.length` colours. Locked colours stay where they are and set the base
 * hue (except in Random mode); the rest are replaced from a freshly drawn scheme.
 */
export function generate(mode: Mode, colours: string[], locked: boolean[]): string[] {
  const n = colours.length;
  const firstLocked = colours.find((_, i) => locked[i]);
  const baseHue = firstLocked && mode !== 'Random' ? hexToHsl(firstLocked)[0] : rnd(0, 360);
  const pool = scheme(mode, n + 2, baseHue).map(hslToHex);
  const keep = colours.filter((_, i) => locked[i]);
  const fresh = pool.filter((c) => keep.every((k) => dist(c, k) > 40));
  const queue = [...fresh, ...pool];
  return colours.map((c, i) => (locked[i] ? c : (queue.shift() as string)));
}

// ---------- roles ----------

export const ROLES = ['Primary', 'Secondary', 'Accent', 'Dark', 'Light'] as const;
export type Role = (typeof ROLES)[number];

/** A first guess at each colour's job: the darkest is Dark, the lightest Light, the boldest Primary. */
export function autoRoles(colours: string[]): Role[] {
  const idx = colours.map((_, i) => i);
  const roles: (Role | undefined)[] = colours.map(() => undefined);
  const take = (role: Role, pick: (a: number, b: number) => number) => {
    const free = idx.filter((i) => !roles[i]);
    if (!free.length) return;
    roles[free.sort(pick)[0]] = role;
  };
  const lum = (i: number) => luminance(colours[i]);
  const sat = (i: number) => {
    const [, s, l] = hexToHsl(colours[i]);
    return s * (1 - Math.abs(l - 50) / 60);
  };
  if (colours.length >= 3) take('Dark', (a, b) => lum(a) - lum(b));
  if (colours.length >= 2) take('Light', (a, b) => lum(b) - lum(a));
  take('Primary', (a, b) => sat(b) - sat(a));
  take('Accent', (a, b) => sat(b) - sat(a));
  take('Secondary', (a, b) => sat(b) - sat(a));
  return roles.map((r, i) => r ?? ROLES[i % ROLES.length]);
}

// ---------- names ----------

const NAMES: [string, string][] = [
  ['Ink', '#0B0D0A'],
  ['Charcoal', '#2B2B2B'],
  ['Graphite', '#4A4D4A'],
  ['Slate', '#5F6B76'],
  ['Stone', '#9C9B94'],
  ['Mist', '#C9CAC2'],
  ['Paper', '#F1F2EC'],
  ['Cream', '#F3ECDD'],
  ['Ivory', '#FBF6E9'],
  ['Snow', '#FFFFFF'],
  ['Bone', '#E4DCCB'],
  ['Sand', '#E0CDA7'],
  ['Wheat', '#D9B96E'],
  ['Butter', '#F7E39A'],
  ['Lemon', '#F6E234'],
  ['Sunflower', '#F2B600'],
  ['Marigold', '#EBA02D'],
  ['Amber', '#D98A12'],
  ['Apricot', '#F4B27A'],
  ['Peach', '#F8C7A2'],
  ['Tangerine', '#F28A30'],
  ['Pumpkin', '#D6621C'],
  ['Rust', '#B4501F'],
  ['Terracotta', '#C8613F'],
  ['Clay', '#B07A5C'],
  ['Cinnamon', '#8F4B26'],
  ['Chestnut', '#6B3A22'],
  ['Mocha', '#6B4A3A'],
  ['Coffee', '#3E2A20'],
  ['Espresso', '#241812'],
  ['Blush', '#F2C7C4'],
  ['Rose', '#E58BA0'],
  ['Coral', '#F26B5B'],
  ['Salmon', '#F58E7A'],
  ['Tomato', '#E0412C'],
  ['Cherry', '#C8203A'],
  ['Crimson', '#A8142F'],
  ['Wine', '#6D1B34'],
  ['Burgundy', '#4A1424'],
  ['Raspberry', '#C2185B'],
  ['Magenta', '#D81E8C'],
  ['Hot pink', '#FF3E9B'],
  ['Orchid', '#C77DDB'],
  ['Lilac', '#CDB4F2'],
  ['Lavender', '#B6A6F0'],
  ['Violet', '#7B4FE0'],
  ['Indigo', '#4E28DF'],
  ['Plum', '#5A2A62'],
  ['Aubergine', '#33193B'],
  ['Midnight', '#14163A'],
  ['Navy', '#1F2F66'],
  ['Cobalt', '#2347C6'],
  ['Cornflower', '#6E8DE8'],
  ['Sky', '#8CB8E6'],
  ['Ice', '#D3E8F3'],
  ['Cyan', '#17B4D4'],
  ['Teal', '#14808A'],
  ['Lagoon', '#0E5D6B'],
  ['Aqua', '#6FDCCB'],
  ['Mint', '#A8EBC9'],
  ['Seafoam', '#7FBB9E'],
  ['Jade', '#1FA37A'],
  ['Emerald', '#0F8F55'],
  ['Forest', '#1F4D33'],
  ['Pine', '#173826'],
  ['Moss', '#6B7A3A'],
  ['Olive', '#4F5B2A'],
  ['Fern', '#718355'],
  ['Sage', '#B7C09A'],
  ['Pistachio', '#C5E08A'],
  ['Lime', '#B7E02A'],
  ['Chartreuse', '#C6FF3D'],
  ['Khaki', '#B8A86A'],
  ['Taupe', '#8B7D6F'],
  ['Dune', '#B9A488'],
];

export function colourName(hex: string): string {
  let best = NAMES[0][0];
  let bestD = Infinity;
  const [r, g, b] = hexToRgb(hex);
  for (const [name, h] of NAMES) {
    const [r2, g2, b2] = hexToRgb(h);
    // Redmean-weighted distance: closer to how colours look than plain RGB.
    const rm = (r + r2) / 2;
    const d =
      (2 + rm / 256) * (r - r2) ** 2 + 4 * (g - g2) ** 2 + (2 + (255 - rm) / 256) * (b - b2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

// ---------- extraction ----------

/** Five dominant colours of an image (k-means on a small copy), biggest cluster first. */
export function extractColours(data: Uint8ClampedArray, k = 5): string[] {
  const px: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (px.length === 0) return [];
  // Spread the starting centres through the brightness range.
  const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let centres: RGB[] = Array.from(
    { length: k },
    (_, i) => [...sorted[Math.floor(((i + 0.5) / k) * sorted.length)]] as RGB,
  );
  let sizes: number[] = [];
  for (let iter = 0; iter < 12; iter++) {
    const sums: number[][] = centres.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0;
      let bd = Infinity;
      for (let c = 0; c < centres.length; c++) {
        const d =
          (p[0] - centres[c][0]) ** 2 + (p[1] - centres[c][1]) ** 2 + (p[2] - centres[c][2]) ** 2;
        if (d < bd) {
          bd = d;
          bi = c;
        }
      }
      sums[bi][0] += p[0];
      sums[bi][1] += p[1];
      sums[bi][2] += p[2];
      sums[bi][3]++;
    }
    sizes = sums.map((s) => s[3]);
    centres = centres.map((c, i) =>
      sums[i][3] ? [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]] : c,
    );
  }
  const ranked = centres
    .map((c, i) => ({ hex: rgbToHex(c), n: sizes[i] }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((c) => c.hex);
  const unique: string[] = [];
  for (const h of ranked) if (unique.every((u) => dist(u, h) > 24)) unique.push(h);
  return unique;
}
