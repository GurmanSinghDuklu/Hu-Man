/**
 * The projects on the site (home cards, /work/), with the facts the schema and llms-full.txt state
 * about them. Keep every line provable: Essence was built unpaid for a family business, Eldeva is
 * a concept for a family member's business and has never been live.
 */
export interface Project {
  id: 'essence' | 'eldeva' | 'calculator';
  name: string;
  /** The sentence under the name on the home cards (Gurman's wording, 2026-10-28). */
  blurb: string;
  /** When set, the home card ends with a link to `url` with this text. */
  linkText?: string;
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
    blurb: 'Bedfordshire’s premium hair salon. Specialists in Balayage and Keratin treatment.',
    linkText: 'Live site',
    live: true,
    url: 'https://essencehairtreatment.com',
    summary:
      'A live website for Essence Hair & Academy, a hair studio, built for a family business: design, services and booking links.',
  },
  {
    id: 'eldeva',
    name: 'Eldeva Candles',
    blurb:
      'Pre-production full site rebuild and integration from Shopify. Full inventory, booking, ordering and bespoke customisation system.',
    live: false,
    summary:
      'A concept design for an online candle shop, made for a family member’s business. It has not launched.',
  },
  {
    id: 'calculator',
    name: 'The Calculator App',
    blurb:
      '100+ financial tools, calculators and guides. Web-powered app. iOS and Android app custom build in development.',
    live: true,
    url: 'https://thecalculatorapp.org',
    summary:
      'A live web app with more than 130 free UK and US calculators and unit converters, redesigned from a basic, functional site.',
  },
];
