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
 * Care plans (docs/02 "Care plans"; prices live from 2026-11-14, agreed by Gurman as launch
 * figures). Monthly, rolling, any time to cancel. Edit the doc first, then mirror it here.
 */
export interface CarePlan {
  id: string;
  name: string;
  price: string;
  /** What is in it, one item per line on the cards. */
  includes: string[];
  /** Who it is for. */
  forWho: string;
}

export const carePlans: CarePlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '£29/mo',
    includes: [
      'Hosting, SSL, security, backups, uptime monitoring and fixes',
      'Up to 15 minutes of small changes a month (a price, hours, a line of text)',
    ],
    forWho: 'Any website',
  },
  {
    id: 'care',
    name: 'Care',
    price: '£49/mo',
    includes: ['Everything in Basic', '1 hour of edits a month'],
    forWho: 'Any website',
  },
  {
    id: 'grow',
    name: 'Grow',
    price: '£99/mo',
    includes: [
      'Everything in Basic',
      '3 hours of edits a month',
      'Monthly Google and AI visibility check',
      'Monthly report',
    ],
    forWho: 'Any website',
  },
  {
    id: 'software-care',
    name: 'Software care',
    price: '£185/mo',
    includes: [
      'Everything in Grow',
      'Up to 3 hours on the software',
      'Dependency and security updates',
      'Error monitoring',
      'Reply within 2 working days',
    ],
    forWho: 'Custom builds only',
  },
  {
    id: 'software-care-plus',
    name: 'Software care plus',
    price: '£350/mo',
    includes: [
      'Software care with up to 6 hours',
      'Next-working-day replies',
      'App store updates if mobile',
    ],
    forWho: 'Custom builds only',
  },
];

/** The rules under the care plans (docs/02 "Rules"). */
export const careRules =
  'Rolling monthly: cancel any time. Included time does not carry over to the next month. Extra work is £45/hr for care plan clients and £55/hr otherwise, always quoted before we start.';

/** The fix promise (docs/02 "Fix promise"); the terms page defines it. */
export const careFixPromise =
  'If something breaks because of our work, we fix it free, care plan or not.';

/** A tier's price by id, for copy such as "from our £446 Start tier up". */
export const priceOf = (id: string): string => {
  const tier = tiers.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown tier: ${id}`);
  return tier.price;
};

/** The cheapest care plan, for copy such as "care plans from £29/mo". */
export const carePlanFrom = carePlans[0].price;

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

/** The CV rewrite add-on (docs/02), also offered in the ATS section on /portfolio/. */
export const cvRewrite = { name: 'CV rewrite to match the site', price: '£54' };

/** Keep-it-live hosting (docs/02 portfolio add-ons), also quoted in the /portfolio/ FAQ. */
export const keepLive = {
  name: 'Keep-it-live hosting and two content updates a year',
  price: '£64/year',
};

export const portfolioAddOns = [
  `${cvRewrite.name} ${cvRewrite.price}`,
  `${keepLive.name} ${keepLive.price}`,
];

/** 48-hour Express, Profile only (docs/02). */
export const portfolioExpress = {
  title: '48-hour Express',
  price: '+£110',
  text: 'Available on Profile, for interview deadlines. The same site, moved to the front of the queue.',
};
