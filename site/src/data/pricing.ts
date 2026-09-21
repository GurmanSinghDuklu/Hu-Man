/**
 * Prices come only from docs/02-offer-and-pricing.md. Do not invent, round
 * or add prices here — edit that doc first, then mirror the change here.
 */
export interface PricingTier {
  id: 'launch' | 'growth' | 'full-presence';
  name: string;
  for: string;
  includes: string[];
  introFrom: string;
  monthly: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'launch',
    name: 'Launch',
    for: 'Outdated site that needs a modern, mobile-first, enquiry-ready rebuild',
    includes: [
      '5-page redesign',
      'Migration with redirects',
      'Speed and on-page SEO',
      'Google Business Profile tune-up',
      'Enquiry form and FAQ chatbot',
    ],
    introFrom: '£1,125',
    monthly: '£99',
  },
  {
    id: 'growth',
    name: 'Growth',
    for: 'Wants bookings or orders and more enquiries handled automatically',
    includes: [
      'Everything in Launch',
      'Online booking or ordering',
      'Payments through hosted checkout (Stripe, Square, SumUp)',
      'AI enquiry assistant',
      'Social feed',
      'Review collection',
      'Structured data and service pages',
      'Analytics',
    ],
    introFrom: '£2,100',
    monthly: '£199',
  },
  {
    id: 'full-presence',
    name: 'Full presence',
    for: 'Wants the site to handle enquiries, follow-up and reporting',
    includes: [
      'Everything in Growth',
      'AI call and WhatsApp answering',
      'Quote and invoice follow-up automation',
      'Monthly owner digest',
    ],
    introFrom: '£3,375',
    monthly: '£349 and up',
  },
];
