/**
 * Prices come only from docs/02-offer-and-pricing.md ("Draft pricing, 2026-10-19"). Do not invent,
 * round or add prices here: edit that doc first, then mirror the change here.
 *
 * These are the prices from the final designs. Gurman is still deciding (2026-10-19), so they
 * are drafts: every page reads them from this one file, so a change is a single edit.
 */

/** How a tier's arch and row marker are filled (the colours in the designs). */
export type TierStyle = 'outline' | 'peach' | 'lilac' | 'dusk' | 'ink' | 'rose';

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
    id: 'spark',
    name: 'Spark',
    price: '£395',
    short: 'One-page site',
    includes: '1 page · mobile-first · contact form · Business Profile setup · AI-readable basics',
    style: 'outline',
    tag: 'Start here',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '£595',
    short: 'Small business basics',
    includes: 'Up to 3 pages · everything in Spark · on-page SEO',
    style: 'outline',
  },
  {
    id: 'launch',
    name: 'Launch',
    price: '£895',
    short: 'Replace an old site',
    includes: 'Up to 5 pages · move off Wix or Squarespace · redirects · speed work',
    style: 'peach',
  },
  {
    id: 'launch-dashboard',
    name: 'Launch + Dashboard',
    price: '£1,195',
    short: 'Edit it yourself',
    includes: 'Everything in Launch · your own owner dashboard',
    style: 'lilac',
    // The design said "Most picked"; nobody has bought yet, so that would be invented proof.
    tag: 'Our pick',
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
    price: 'POA',
    short: 'Apps and portals',
    includes: 'Web apps, client portals, marketplaces',
    style: 'rose',
  },
];

export interface CarePlan {
  name: string;
  price: string;
  includes: string;
  style: 'outline' | 'peach' | 'lilac' | 'ink';
}

/** Marked "Draft · being researched and reworked" on the site, as in the design. */
export const carePlans: CarePlan[] = [
  { name: 'Basic', price: '£29', includes: 'Hosting, security, backups', style: 'outline' },
  { name: 'Care', price: '£59', includes: '+ updates, 30 min edits a month', style: 'peach' },
  {
    name: 'Grow',
    price: '£119',
    includes: '+ monthly AI visibility check, 2 hrs work',
    style: 'lilac',
  },
  {
    name: 'Partner',
    price: '£249',
    includes: '+ priority replies, monthly report, 5 hrs work',
    style: 'ink',
  },
];

export const addOns = [
  'Extra page £75',
  'Logo + brand pack £195',
  'Copywriting £95/page',
  'Photo shoot (Leeds) £195',
  'Google Ads setup £245',
  'Extra AI check £49',
];

/** Lowest and highest fixed prices, for copy such as "From £395". */
export const fromPrice = tiers[0].price;
