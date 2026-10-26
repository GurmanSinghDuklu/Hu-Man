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
  tagline: 'Made by hand. Built by machine.',
  founder: 'Gurman Singh Duklu',
  // Leeds became the base on 2026-10-19 (final designs). The name stays off the pages at
  // Gurman's request; `founder` is used only by the privacy notice, which must name the
  // person responsible for the data.
  location: {
    town: 'Leeds',
    region: 'West Yorkshire',
    country: 'GB',
  },
  areasServed: ['Leeds', 'Halifax', 'Huddersfield', 'Keighley', 'Shipley', 'Bingley', 'Ilkley'],
  contact: {
    email: 'humansoftwareagency@gmail.com',
    phone: '+44 7988 450280',
    phoneIntl: '447988450280',
    whatsapp: 'https://wa.me/447988450280',
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
