/**
 * Single source of truth for the studio's identity and contact details.
 *
 * "Duklu Digital" is a working name (see CLAUDE.md, docs/09-open-questions.md
 * item 1) — not decided yet. Change it here and it updates everywhere.
 *
 * Contact details are Gurman's personal email/phone for now (docs/09 item 2:
 * business email and number to be confirmed before launch). Swap them here
 * when that happens.
 */
export const site = {
  name: 'Duklu Digital',
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
  // Set to the real domain before deploying (docs/09 item 8).
  url: 'https://example.com',
} as const;

export type Site = typeof site;
