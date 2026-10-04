/**
 * Single source of truth for the studio's identity and contact details.
 *
 * "Hu/man" is the working brand (chosen 2026-09-23; styled variants Gurman
 * floated: Hu.man, Hu_man, Hu/man, HUMAN, Hu-man). `name` is the plain
 * text form used in titles and schema; `wordmark` is the display form used in
 * the hero and footer. Change both here and they update everywhere.
 *
 * Contact details are Gurman's personal email/phone for now (docs/09 item 2:
 * business email and number to be confirmed before launch). Swap them here
 * when that happens.
 */
export const site = {
  name: 'Hu/man',
  wordmark: 'HU/MAN',
  descriptor: 'Studio',
  nameIsPlaceholder: true,
  tagline: 'Websites that turn local searches into bookings',
  founder: 'Gurman Singh Duklu',
  location: {
    town: 'Bradford',
    region: 'West Yorkshire',
    country: 'GB',
  },
  areasServed: [
    'Bradford',
    'Leeds',
    'Halifax',
    'Huddersfield',
    'Keighley',
    'Shipley',
    'Bingley',
    'Ilkley',
  ],
  contact: {
    email: 'gurmanduklu@gmail.com',
    phone: '+44 7988 450280',
    phoneIntl: '447988450280',
    whatsapp: 'https://wa.me/447988450280',
    github: 'https://github.com/GurmanSinghDuklu',
    linkedin: 'https://www.linkedin.com/in/gurman-singh-duklu',
  },
  // Set to the real domain before deploying (docs/09 item 8). Follows
  // astro.config.mjs `site`, which a preview build can override via SITE_URL.
  url: import.meta.env.SITE ?? 'https://example.com',
} as const;

export type Site = typeof site;
