/**
 * Single source of truth for the studio's identity and contact details.
 *
 * "Hu/man" is the working brand (chosen 2026-09-23; styled variants Gurman
 * floated: Hu.man, Hu_man, Hu/man, HUMAN, Hu-man). `name` is the plain
 * text form used in titles and schema; `wordmark` is the display form used in
 * the hero and footer. Change both here and they update everywhere.
 *
 * Email is the business address (humansoftwareagency@gmail.com, 2026-10-19); the phone is still
 * Gurman's personal number until a business one is confirmed (docs/09 item 2). Swap them here
 * when that happens.
 */
import { productionUrl } from './domain';

export const site = {
  name: 'Hu/man',
  /** The full name for titles, schema and llms.txt, so every source names the same entity. Not a
   * legal name: the business is not registered yet. */
  fullName: 'Hu/man Software Agency',
  /** Other spellings people (and AI tools) may use, listed in the schema as alternate names. */
  alternateNames: ['Human Software Agency', 'HU/MAN', 'Hu/man'],
  /** "Est. 2026" in the hero collage. */
  founded: '2026',
  wordmark: 'HU/MAN',
  descriptor: 'Studio',
  nameIsPlaceholder: true,
  /** The one headline across the site (change list, Nov 2026); also the schema slogan. */
  tagline: 'Got an idea? We’ll build it, and build it to be found by AI.',
  founder: 'Gurman Singh Duklu',
  /** How the founder is named in the footer and on /about ("Founded by Gurman Singh and team"). */
  founderShort: 'Gurman Singh and team',
  // Leeds became the base on 2026-10-19 (final designs). The name stays off the marketing
  // pages; since 2026-10-27 (Gurman's choice) it appears in the footer's trading line and on
  // the legal pages, which the E-Commerce Regulations 2002 ask to say who runs the site. No
  // address yet: one goes in once Gurman has a business address (never the home address).
  location: {
    town: 'Leeds',
    region: 'West Yorkshire',
    country: 'GB',
  },
  // Shown as "Leeds, West Yorkshire / UK · Global" (Gurman, 2026-10-27): in person around Leeds,
  // remote across the UK and worldwide. No town-by-town list.
  areasServed: ['Leeds', 'Manchester'],
  /** Shown as "Leeds · Manchester" in the footer and on /about (change list, Nov 2026). */
  locations: ['Leeds', 'Manchester'],
  reach: ['UK', 'Global'],
  contact: {
    email: 'humansoftwareagency@gmail.com',
    phone: '+44 7988 450280',
    phoneIntl: '447988450280',
    github: 'https://github.com/GurmanSinghDuklu',
    linkedin: 'https://www.linkedin.com/in/gurman-singh-duklu',
    // The studio's own profile (approved 2026-10-25). GitHub and LinkedIn are personal, so they
    // stay off the pages and out of the schema.
    instagram: 'https://www.instagram.com/humansoftwareagency/',
  },
  // Follows astro.config.mjs `site` (productionUrl unless a preview build sets SITE_URL).
  url: import.meta.env.SITE ?? productionUrl,
} as const;

export type Site = typeof site;
