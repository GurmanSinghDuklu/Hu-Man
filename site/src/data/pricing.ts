/**
 * Prices come only from docs/02-offer-and-pricing.md ("Draft pricing"). Do not invent, round or
 * add prices here: edit that doc first, then mirror the change here.
 *
 * These are the prices from the final designs (2026-10-19, Essential added 2026-10-25; headline cards, Fast Track and portfolio tiers added Nov 2026). Gurman is
 * still deciding, so they are drafts: every page reads them from this one file.
 */

/** How a tier's arch and row marker are filled (the colours in the designs). */
export type TierStyle = 'stone' | 'outline' | 'peach' | 'lilac' | 'dusk' | 'ink' | 'rose';

export interface Tier {
  id: string;
  name: string;
  price: string;
  /** Short line under the price on the arches. */
  short: string;
  /** The "Tier by tier" line. */
  includes: string;
  style: TierStyle;
  /** The pill on the arch, if any. */
  tag?: string;
}

export const tiers: Tier[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: '£295',
    short: 'Standard website',
    includes: '1 page · mobile-first · contact form · basic SEO · not agentic AI-ready',
    style: 'stone',
  },
  {
    id: 'start',
    name: 'Start',
    price: '£395',
    short: 'AI-ready one-page site',
    includes:
      '1 page · mobile-first · contact form · Business Profile setup · agentic AI-ready setup',
    style: 'outline',
    tag: 'Start here',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '£595',
    short: 'Small business basics',
    includes: 'Up to 3 pages · everything in Start · on-page SEO',
    style: 'outline',
  },
  {
    id: 'launch',
    name: 'Launch',
    price: '£895',
    short: 'Replace an old site',
    includes: 'Up to 5 pages · move off Wix or Squarespace · redirects · speed work',
    style: 'peach',
    // Launch is the pick on the headline cards (change list, Nov 2026); nobody has bought yet, so
    // it is "Our pick", never "Most picked".
    tag: 'Our pick',
  },
  {
    id: 'launch-dashboard',
    name: 'Launch + Dashboard',
    price: '£1,195',
    short: 'Edit it yourself',
    includes: 'Everything in Launch · your own owner dashboard',
    style: 'lilac',
  },
  {
    id: 'booking',
    name: 'Booking',
    price: '£1,595',
    short: 'Take bookings and deposits',
    includes: 'Everything above · booking · Stripe, Square or SumUp',
    style: 'outline',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '£2,195',
    short: 'Answer enquiries 24/7',
    includes: 'Everything above · AI enquiry agent · reviews · service pages',
    style: 'dusk',
  },
  {
    id: 'full-presence',
    name: 'Full presence',
    price: '£3,375',
    short: 'Hands-off growth',
    includes: 'Everything above · WhatsApp + call answering · follow-ups · owner digest',
    style: 'ink',
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 'Bespoke',
    short: 'Apps and portals',
    includes: 'Web apps, client portals, marketplaces',
    style: 'rose',
  },
];

/**
 * Care plans have no published prices until they are final (change list, Nov 2026). The working
 * figures stay in docs/02-offer-and-pricing.md and must not be copied here.
 */
export const carePlansNote =
  'Monthly care plans for hosting, security, backups and updates are launching soon.';

/** A tier's price by id, for copy such as "from our £395 Start tier up". */
export const priceOf = (id: string): string => {
  const tier = tiers.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown tier: ${id}`);
  return tier.price;
};

/** The lowest fixed price, for copy such as "Start at £295". */
export const fromPrice = tiers[0].price;

/**
 * The five headline cards on the home page and /pricing (docs/02 "Headline cards and timelines").
 * Prices come from the ladder above, so they cannot drift; timelines are from the change list.
 */
export interface HeadlineCard {
  id: string;
  name: string;
  price: string;
  what: string;
  timeline: string;
  tag?: string;
}

export const headlineCards: HeadlineCard[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: priceOf('essential'),
    what: 'Standard website: mobile-first, contact form and basic SEO',
    timeline: 'Live in 1 week',
  },
  {
    id: 'start',
    name: 'Start',
    price: priceOf('start'),
    what: 'AI-ready one-page site',
    timeline: 'Live in 1 week',
  },
  {
    id: 'launch',
    name: 'Launch',
    price: priceOf('launch'),
    what: 'Up to 5 pages. Move off Wix or Squarespace.',
    timeline: '2 to 3 weeks',
    tag: 'Our pick',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: priceOf('growth'),
    what: 'Booking, payments and an AI enquiry agent',
    timeline: '4 to 6 weeks',
  },
  {
    id: 'custom',
    name: 'Custom',
    price: priceOf('custom'),
    what: 'Apps, portals and software',
    timeline: 'Quoted after the call',
  },
];

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
    price: '£149',
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
    price: '£249',
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
    price: '£395',
    timeline: '2 weeks',
    summary: 'The full build',
    includes: [
      'Everything in Portfolio',
      'Custom design and graphics',
      'Motion graphics',
      'Video built in (showreels, embeds)',
      'Social media integration: feeds and links for content creators, marketers and ad people',
      'Media and third-party integrations',
      'A writing or blog section',
      'An owner dashboard, so you edit it yourself',
    ],
  },
];

export const portfolioAddOns = [
  'CV rewrite to match the site £49',
  'Keep-it-live hosting and two content updates a year £60/year',
];

/** 48-hour Express, Profile only (docs/02). */
export const portfolioExpress = {
  title: '48-hour Express',
  price: '+£100',
  text: 'Available on Profile, for interview deadlines. The same site, moved to the front of the queue.',
};
