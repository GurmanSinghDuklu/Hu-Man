/**
 * The portfolio: every project shown on the home page grid, /work/ and its own
 * case-study page (/work/<slug>/). One source, so a label can never drift.
 *
 * Honesty rules (CLAUDE.md, docs/05):
 * - Only The Calculator App and Essence are live. Essence was built unpaid for a
 *   family business: never call it a client.
 * - Eldeva is a mock-up for a family business's real shop. It is not live: status
 *   "concept", never "live". Never use Eldeva frames that show its mock reviews or
 *   star ratings.
 * - Tesla and Spider-Man are unofficial fan redesigns of real brands. Keep the
 *   "not affiliated" line wherever they appear. Spider-Man uses game imagery from
 *   PlayStation.com, not our own.
 * - Copy says what was built. No outcome claims (more sales, more users) without
 *   evidence.
 */
import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/{work,projects,concepts}/*.jpg',
  {
    eager: true,
  },
);

/** `projectImage('work/essence-mobile')` -> the bundled image. Throws if missing. */
export function projectImage(path: string): ImageMetadata {
  const found = images[`../assets/${path}.jpg`];
  if (!found) throw new Error(`Missing project image: ${path}`);
  return found.default;
}

export type ProjectStatus = 'live' | 'concept' | 'unofficial';

export const statusLabel: Record<ProjectStatus, string> = {
  live: 'Live',
  concept: 'Concept',
  unofficial: 'Unofficial concept',
};

export interface Shot {
  src: string;
  alt: string;
  /** "tall" shots are full-page captures shown in a scrolling frame. */
  kind?: 'wide' | 'tall' | 'phone';
  pos?: string;
}

export interface Project {
  slug: string;
  name: string;
  status: ProjectStatus;
  /** Plain statement of what the project is to us. Shown under the title. */
  relationship: string;
  type: string;
  scope: string[];
  year?: number;
  /** One sentence for the grid tile and the page description. */
  summary: string;
  brief: string;
  built: string;
  /** Required for unofficial work: who it is not affiliated with. */
  disclaimer?: string;
  href?: string;
  cover: string;
  coverPos?: string;
  shots: Shot[];
  /** Muted walkthrough clips in public/video/, played on the case-study page. */
  videos?: { src: string; poster: string; label: string }[];
}

export const projects: Project[] = [
  {
    slug: 'calculator-app',
    name: 'The Calculator App',
    status: 'live',
    relationship: 'Redesign',
    type: 'Web app',
    scope: ['UI/UX', 'Development', 'SEO'],
    year: 2026,
    summary:
      '130+ free UK and US calculators and unit converters, redesigned from a basic, functional site.',
    brief:
      'Take a basic, functional calculator site and turn it into something that catches people and keeps them using it.',
    built:
      'A bold dark interface with instant search across 130+ UK and US calculators, featured tools, category hubs and answers to the money questions people search for most.',
    href: 'https://www.thecalculatorapp.org',
    cover: 'work/calculator-desktop',
    coverPos: 'left top',
    shots: [
      {
        src: 'work/calculator-scroll',
        alt: 'The Calculator App home page, top to bottom',
        kind: 'tall',
      },
      {
        src: 'work/calculator-compound',
        alt: 'A compound interest calculator with a results chart',
        kind: 'wide',
        pos: 'top',
      },
      {
        src: 'work/calculator-mobile',
        alt: 'The Calculator App home page on a phone',
        kind: 'phone',
      },
      {
        src: 'work/calculator-retirement',
        alt: 'A retirement calculator page',
        kind: 'wide',
        pos: 'top',
      },
    ],
  },
  {
    slug: 'essence',
    name: 'Essence Hair Treatment',
    status: 'live',
    relationship: 'Built for a family business',
    type: 'Salon website',
    scope: ['Design', 'Development', 'Booking'],
    year: 2026,
    summary: 'A photo-led salon website with booking one tap away on every screen.',
    brief:
      'Turn a basic, functional salon website into one that draws people in and gets them booking.',
    built:
      'An editorial, photo-led design with clear services, top tips, a gallery, FAQs and an academy page, with booking one tap away on every screen.',
    href: 'https://www.essencehairtreatment.com',
    cover: 'work/essence-desktop',
    coverPos: 'left top',
    shots: [
      {
        src: 'work/essence-scroll',
        alt: 'Essence Hair Treatment home page, top to bottom',
        kind: 'tall',
      },
      {
        src: 'work/essence-mobile',
        alt: 'Essence Hair Treatment home page on a phone',
        kind: 'phone',
      },
      {
        src: 'work/essence-thumb',
        alt: 'Essence Hair Treatment services section',
        kind: 'wide',
      },
    ],
  },
  {
    slug: 'eldeva',
    name: 'Eldeva',
    status: 'concept',
    relationship: 'Mock-up for a family business. Not live.',
    type: 'Shop concept',
    scope: ['Design', 'E-commerce', 'Motion'],
    summary:
      'A candle and home-fragrance shop concept for a family business, built around scent and mood.',
    brief:
      'Show a small candle and home-fragrance business how its online shop could feel: warm, unhurried and easy to buy from.',
    built:
      'A mock-up shop with a full-bleed opening, a showcase for each candle and diffuser, a scent picker sorted by mood and an evening ritual kit. It is a concept and is not live.',
    cover: 'projects/eldeva-hero',
    shots: [
      { src: 'projects/eldeva-light-it-slowly', alt: 'Eldeva candle feature section' },
      { src: 'projects/eldeva-scents', alt: 'Eldeva scent picker sorted by mood' },
      { src: 'projects/eldeva-sweet-plum', alt: 'Eldeva Sweet Plum candle showcase' },
      { src: 'projects/eldeva-velvet-peony', alt: 'Eldeva Velvet Peony diffuser showcase' },
      { src: 'projects/eldeva-ritual', alt: 'Eldeva evening ritual kit' },
      { src: 'projects/eldeva-footer', alt: 'Eldeva footer with the wordmark' },
    ],
    videos: [
      {
        src: 'eldeva-products',
        poster: 'projects/eldeva-velvet-peony',
        label: 'Eldeva product showcase walkthrough',
      },
      {
        src: 'eldeva-scents',
        poster: 'projects/eldeva-scents',
        label: 'Eldeva scent picker walkthrough',
      },
    ],
  },
  {
    slug: 'tesla',
    name: 'Tesla (unofficial)',
    status: 'unofficial',
    relationship: 'Unofficial redesign.',
    type: 'Fan site',
    scope: ['Design', 'Development', 'Motion'],
    summary:
      "An unofficial redesign that tells Tesla's story through its cars, its plan and its timeline.",
    brief: 'A design study: take a brand everyone knows and tell its story in a new way.',
    built:
      'A dark, cinematic site with a model-by-model showroom, the Secret Master Plan, a year-by-year timeline, the charging network and a look under the skin.',
    disclaimer: 'Not affiliated with Tesla, Inc.',
    cover: 'projects/tesla-hero',
    coverPos: 'left',
    shots: [
      { src: 'projects/tesla-model-s', alt: 'Model S in the showroom carousel' },
      { src: 'projects/tesla-master-plan', alt: 'The Secret Master Plan section' },
      { src: 'projects/tesla-timeline', alt: 'Year-by-year timeline' },
      { src: 'projects/tesla-network', alt: 'Charging network section' },
      { src: 'projects/tesla-under-the-skin', alt: 'What is under the skin section' },
      { src: 'projects/tesla-semi', alt: 'Semi and Cybertruck in the showroom carousel' },
    ],
    videos: [
      {
        src: 'tesla-models',
        poster: 'projects/tesla-model-s',
        label: 'Tesla showroom walkthrough',
      },
      {
        src: 'tesla-timeline',
        poster: 'projects/tesla-timeline',
        label: 'Tesla timeline walkthrough',
      },
    ],
  },
  {
    slug: 'spider-man',
    name: 'Spider-Man: Miles Morales (unofficial)',
    status: 'unofficial',
    relationship: 'Unofficial fan site. Uses game imagery from PlayStation.com.',
    type: 'Fan site',
    scope: ['Design', 'Development', 'Motion'],
    summary: "An unofficial fan site for Marvel's Spider-Man: Miles Morales.",
    brief: 'A design study: build a fan site with the pace and punch of the game itself.',
    built:
      'A bold, comic-paced site with character spotlights, a section on Venom powers and a gallery carousel.',
    disclaimer: 'Not affiliated with Marvel, Insomniac Games or Sony.',
    cover: 'projects/spiderman-hero',
    coverPos: 'left',
    shots: [
      { src: 'projects/spiderman-rogues', alt: 'Rhino and Roxxon character spotlight' },
      { src: 'projects/spiderman-tinkerer', alt: 'The Tinkerer character spotlight' },
      { src: 'projects/spiderman-venom', alt: 'Venom powers section' },
      { src: 'projects/spiderman-gallery', alt: 'Gallery carousel' },
      { src: 'projects/spiderman-winter', alt: 'Story section' },
      { src: 'projects/spiderman-outro', alt: 'Closing section' },
    ],
    videos: [
      {
        src: 'spiderman-intro',
        poster: 'projects/spiderman-hero',
        label: 'Spider-Man fan site opening walkthrough',
      },
      {
        src: 'spiderman-venom',
        poster: 'projects/spiderman-venom',
        label: 'Venom powers section walkthrough',
      },
      {
        src: 'spiderman-gallery',
        poster: 'projects/spiderman-gallery',
        label: 'Gallery carousel walkthrough',
      },
    ],
  },
];

/** "LIVE · WEB APP · 2026" style metadata line. */
export const metaLine = (p: Project) =>
  [statusLabel[p.status], p.type, p.year].filter(Boolean).join(' · ');
