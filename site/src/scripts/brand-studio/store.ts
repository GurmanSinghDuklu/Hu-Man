/**
 * The Brand Board's one in-memory state object. Nothing here touches localStorage, sessionStorage
 * or cookies (the site stores nothing in the browser; motion-check fails if a page does): refresh
 * the page and the board is empty, which the review step says plainly.
 */
import { brandStudioConfig as cfg } from '../../config/brandStudio';
import { gallery, palettes } from '../../data/brandStudio';
import { autoRoles, type Role } from './colour';

export interface UploadItem {
  id: string;
  file: File;
  url: string;
  kind: 'image' | 'video';
  note: string;
  colours: string[];
}

export interface BoardState {
  basics: { name: string; does: string; audience: string; moods: string[] };
  saved: string[];
  uploads: UploadItem[];
  links: string[];
  palette: { colours: string[]; locked: boolean[]; roles: Role[]; name: string };
  logo: {
    directions: string[];
    types: string[];
    existing: File | null;
    notes: string;
    touched: boolean;
  };
  type: { display: string; body: string };
  review: {
    name: string;
    email: string;
    business: string;
    goal: string;
    timeline: string;
    consent: boolean;
  };
  touched: { colour: boolean; type: boolean; mockups: boolean; sent: boolean };
}

export const DEFAULT_NAME = 'Your brand';

const start = palettes.find((p) => p.name === 'Desert Bloom') ?? palettes[0];

const state: BoardState = {
  basics: { name: '', does: '', audience: '', moods: [] },
  saved: [],
  uploads: [],
  links: [],
  palette: {
    colours: [...start.colours],
    locked: start.colours.map(() => false),
    roles: autoRoles(start.colours),
    name: start.name,
  },
  logo: { directions: [], types: [], existing: null, notes: '', touched: false },
  type: { display: 'fredoka', body: 'figtree' },
  review: { name: '', email: '', business: '', goal: '', timeline: '', consent: false },
  touched: { colour: false, type: false, mockups: false, sent: false },
};

type Listener = (what: string) => void;
const listeners = new Set<Listener>();

export const get = (): BoardState => state;
export const subscribe = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
/** Change state through here so every view (the board, the preview, the counters) redraws. */
export function update(what: string, change: (s: BoardState) => void) {
  change(state);
  listeners.forEach((fn) => fn(what));
}

export const brandName = () => state.basics.name.trim() || DEFAULT_NAME;

/** Tell screen readers something (counters, limits). One polite live region for the whole page. */
export function announce(message: string) {
  const el = document.getElementById('bs-live');
  if (!el) return;
  el.textContent = '';
  // A changed text node is what makes a live region speak again with the same words.
  requestAnimationFrame(() => (el.textContent = message));
}

export function toggleSaved(slug: string): boolean {
  const on = state.saved.includes(slug);
  const item = gallery.find((g) => g.slug === slug);
  if (!on && state.saved.length >= cfg.maxSaved) {
    announce(
      `${['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][cfg.maxSaved]} is the limit. Remove one from your board first.`,
    );
    return false;
  }
  update('saved', (s) => {
    s.saved = on ? s.saved.filter((x) => x !== slug) : [...s.saved, slug];
    if (!s.logo.touched) s.logo.directions = s.saved.slice(0, cfg.maxDirections);
  });
  announce(
    `${item?.name ?? 'Direction'} ${on ? 'removed from' : 'saved to'} your board. ${state.saved.length} of ${cfg.maxSaved} saved.`,
  );
  return true;
}

export function setPalette(name: string, colours: string[]) {
  update('palette', (s) => {
    s.palette = {
      colours: colours.slice(0, 5),
      locked: colours.slice(0, 5).map(() => false),
      roles: autoRoles(colours.slice(0, 5)),
      name,
    };
    s.touched.colour = true;
  });
  announce(`${name} palette loaded into the colour bar.`);
}

export function setDisplayFont(id: string) {
  update('type', (s) => {
    s.type.display = id;
    s.touched.type = true;
  });
}

/** Role colours with sensible fallbacks, for mockups and previews. */
export function roleColour(role: Role): string {
  const { colours, roles } = state.palette;
  const i = roles.indexOf(role);
  if (i >= 0) return colours[i];
  const fallback: Record<Role, string> = {
    Primary: colours[0] ?? '#4E28DF',
    Secondary: colours[1] ?? '#B7C09A',
    Accent: colours[2] ?? '#E85E8F',
    Dark: '#0B0D0A',
    Light: '#F1F2EC',
  };
  return fallback[role];
}
