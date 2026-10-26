/**
 * The projects on the site (home cards, /work/), with the facts the schema and llms-full.txt state
 * about them. Keep every line provable: Essence was built unpaid for a family business, Eldeva is
 * a concept for a family member's business and has never been live.
 */
export interface Project {
  id: 'essence' | 'eldeva' | 'calculator';
  name: string;
  /** The line under the name on the home cards. */
  tags: string;
  live: boolean;
  /** The live site, when there is one. */
  url?: string;
  /** One plain sentence for the schema and llms-full.txt. */
  summary: string;
}

export const projects: Project[] = [
  {
    id: 'essence',
    name: 'Essence Hair',
    tags: 'Built for a family business · Live',
    live: true,
    url: 'https://essencehairtreatment.com',
    summary:
      'A live website for Essence Hair & Academy, a hair studio, built for a family business: design, services and booking links.',
  },
  {
    id: 'eldeva',
    name: 'Eldeva Candles',
    tags: 'Concept design · Not live',
    live: false,
    summary:
      'A concept design for an online candle shop, made for a family member’s business. It has not launched.',
  },
  {
    id: 'calculator',
    name: 'The Calculator App',
    tags: 'Web app · Live',
    live: true,
    url: 'https://thecalculatorapp.org',
    summary:
      'A live web app with more than 130 free UK and US calculators and unit converters, redesigned from a basic, functional site.',
  },
];
