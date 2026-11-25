/**
 * Lazy font loading for /brand/. The 98 display faces and two body faces live in
 * public/brand-studio/fonts and are never in a stylesheet: each is fetched with the FontFace API
 * the first time something needs it (the type step, a mockup, the gallery viewer). font-src 'self'
 * in the page's CSP covers it.
 */
import { studioFonts, studioBodyFonts } from '../../data/brandStudio';

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/brand-studio/fonts/`;

const all = [...studioFonts, ...studioBodyFonts];
const loading = new Map<string, Promise<boolean>>();

export const familyFor = (id: string): string => {
  const f = all.find((x) => x.id === id);
  return f ? `bs-${f.id}` : 'inherit';
};

/** CSS font-family value with a fallback, for the given font id. */
export const cssFamily = (id: string): string => {
  const f = all.find((x) => x.id === id);
  return f
    ? `'bs-${f.id}', ${studioFonts.some((s) => s.id === id) ? 'var(--font-display)' : 'var(--font-text)'}`
    : 'inherit';
};

export function loadFont(id: string): Promise<boolean> {
  const hit = loading.get(id);
  if (hit) return hit;
  const f = all.find((x) => x.id === id);
  if (!f || !('FontFace' in window)) return Promise.resolve(false);
  const face = new FontFace(`bs-${f.id}`, `url(${BASE}${f.file}) format('woff2')`, {
    weight: String(f.weight),
    display: 'swap',
  });
  const p = face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      return true;
    })
    .catch(() => false);
  loading.set(id, p);
  return p;
}

export const loadFonts = (ids: string[]) => Promise.all(ids.map(loadFont));
