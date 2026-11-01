/**
 * Prices come only from docs/02-offer-and-pricing.md ("Draft pricing"). Do not invent, round or
 * add prices here: edit that doc first, then mirror the change here.
 *
 * One set of five tiers (site change list, Nov 2026), shown identically on the home page and
 * /pricing. Gurman is still deciding, so they are drafts: every page reads them from this one file.
 */

export interface Tier {
  id: string;
  name: string;
  price: string;
  /** What the tier is, in one line. */
  what: string;
  /** What is in it, one item per line on the cards. */
  includes: string[];
  timeline: string;
  /** The pill on the card, if any. */
  tag?: string;
}

export const tiers: Tier[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: '£318',
    what: 'One-page site, agentic AI-ready',
    includes: [
      '1 page',
      'Mobile-first',
      'Contact form',
      'Basic SEO',
      'Agentic AI-ready, so AI crawlers can read it',
    ],
    timeline: 'Live in 1 week',
  },
  {
    id: 'start',
    name: 'Start',
    price: '£446',
    what: 'A full website, up to 10 pages',
    includes: [
      'Up to 10 pages',
      'Mobile-first',
      'Contact form',
      'On-page SEO',
      'Business Profile setup',
      'Agentic AI-ready',
    ],
    timeline: '2 weeks',
  },
  {
    id: 'launch',
    name: 'Launch',
    price: '£932',
    what: 'A full interactive, multi-page build',
    includes: [
      'Multi-page full build',
      'Custom design',
      'Motion and interactive elements',
      'Your own owner dashboard',
      'Move off Wix or Squarespace, with redirects',
      'Speed work',
      'Agentic AI-ready',
    ],
    timeline: '2 to 3 weeks',
    // Nobody has bought yet, so it is "Our pick", never "Most picked".
    tag: 'Our pick',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '£2,240',
    what: 'The full build with bookings, payments and AI',
    includes: [
      'Everything in Launch',
      'Online booking',
      'Payments through Stripe, Square or SumUp',
      'AI enquiry agent',
      'Reviews',
      'Service pages',
    ],
    timeline: '4 to 6 weeks',
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 'Bespoke',
    what: 'Apps, portals, software',
    includes: ['Web apps, client portals and marketplaces', 'Call answering and automations'],
    timeline: 'Quoted after the call',
  },
];

/**
 * Care plans have no published prices until they are final (change list, Nov 2026). The working
 * figures stay in docs/02-offer-and-pricing.md and must not be copied here.
 */
export const carePlansNote =
  'Monthly care plans for hosting, security, backups and updates are launching soon.';

/** A tier's price by id, for copy such as "from our £446 Start tier up". */
export const priceOf = (id: string): string => {
  const tier = tiers.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown tier: ${id}`);
  return tier.price;
};

/** The lowest fixed price, for copy such as "Start at £318". */
export const fromPrice = tiers[0].price;

/** The quiet Fast Track line on /pricing (docs/02 "Fast Track"). No derived prices: only "+50%". */
export const fastTrack = {
  title: 'Need it sooner? Fast Track',
  text: 'Fast Track is +50% on the tier price and delivered in about half the standard timeline. It is priority scheduling: the same build, moved to the front of the queue. We take 2 Fast Track slots a month, and if we miss a Fast Track date through our own delay, the Fast Track fee is refunded. Ask about it on the call.',
};

/** Portfolio and CV websites for individuals (/portfolio; docs/02 "Portfolio and CV websites"). */
export interface PortfolioTier {
  id: string;
  name: string;
  price: string;
  timeline: string;
  /** One line on what the tier is. */
  summary: string;
  includes: string[];
  tag?: string;
}

export const portfolioTiers: PortfolioTier[] = [
  {
    id: 'profile',
    name: 'Profile',
    price: '£156',
    timeline: '5 working days',
    summary: 'A single static page',
    includes: [
      'One static page: intro, experience, skills, contact',
      'A downloadable PDF CV',
      'Mobile-first',
      'Person structured data, so search and AI can read it',
      'Connected to your own domain (domain cost extra)',
    ],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    price: '£264',
    timeline: '7 to 10 working days',
    tag: 'Our pick',
    summary: 'A full portfolio website',
    includes: [
      'Everything in Profile',
      'Unlimited project case studies with images and files',
      'A full multi-page site',
      'Light motion and interactive touches',
      'Testimonials',
      'Links to LinkedIn, GitHub, Behance or Dribbble',
      'Analytics',
    ],
  },
  {
    id: 'portfolio-pro',
    name: 'Portfolio Pro',
    price: '£932',
    timeline: '2 to 3 weeks',
    summary: 'The full build',
    includes: [
      'Everything in Portfolio',
      'Custom design and graphics',
      'Motion graphics',
      'Video built in (showreels, YouTube and other embeds)',
      'Social media integration: Instagram, TikTok, LinkedIn and YouTube feeds',
      'Media and third-party integrations',
      'A writing or blog section',
      'An owner dashboard, so you edit it yourself',
    ],
  },
];

export const portfolioAddOns = [
  'CV rewrite to match the site £54',
  'Keep-it-live hosting and two content updates a year £64/year',
];

/** 48-hour Express, Profile only (docs/02). */
export const portfolioExpress = {
  title: '48-hour Express',
  price: '+£110',
  text: 'Available on Profile, for interview deadlines. The same site, moved to the front of the queue.',
};
