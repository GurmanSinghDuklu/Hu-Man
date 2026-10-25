/**
 * The six service areas from the final designs (2026-10-25, reference/final-designs-v2/). The home
 * page shows them as tiles ("Everything under one roof"); the services page lists every item.
 * No prices here: tiers live in pricing.ts, and these areas are quoted per project.
 */

/** The fill of the tile and of the card's header band, as in the designs. */
export type ServiceStyle = 'lilac' | 'rose' | 'indigo' | 'peach' | 'dusk' | 'teal';

export interface ServiceItem {
  text: string;
  /** Ongoing work covered by a monthly care plan (the "Care plan" pill). */
  care?: boolean;
}

export interface ServiceArea {
  title: string;
  short: string;
  style: ServiceStyle;
  items: ServiceItem[];
}

export const serviceAreas: ServiceArea[] = [
  {
    title: 'Website design + development',
    short: 'Sites that look right and work properly.',
    style: 'lilac',
    items: [
      { text: 'Business websites' },
      { text: 'Landing pages' },
      { text: 'Custom websites' },
      { text: 'Website redesigns' },
      { text: 'Moves from WordPress, Shopify, Wix or Squarespace' },
      { text: 'Portfolio sites for creators' },
      { text: 'Online CV pages' },
      { text: 'Website maintenance', care: true },
    ],
  },
  {
    title: 'E-commerce',
    short: 'Stores that sell, and keep selling.',
    style: 'rose',
    items: [
      { text: 'E-commerce websites' },
      { text: 'Shopify stores' },
      { text: 'WooCommerce stores' },
      { text: 'Store improvements: speed, checkout, product pages' },
      { text: 'Store maintenance', care: true },
    ],
  },
  {
    title: 'Mobile apps',
    short: 'Apps for iPhone, Android and the web.',
    style: 'indigo',
    items: [
      { text: 'iOS apps' },
      { text: 'Android apps' },
      { text: 'Cross-platform apps' },
      { text: 'Web-powered apps (PWAs)' },
      { text: 'App maintenance', care: true },
    ],
  },
  {
    title: 'Graphic design + branding',
    short: 'A look people remember.',
    style: 'peach',
    items: [
      { text: 'Logo design' },
      { text: 'Brand identity' },
      { text: 'Social media posts' },
      { text: 'Posters + flyers' },
      { text: 'Packaging design' },
      { text: 'Brand and design strategy' },
    ],
  },
  {
    title: 'Custom software',
    short: 'Tools built around how you work.',
    style: 'dusk',
    items: [
      { text: 'Business software' },
      { text: 'CRM systems' },
      { text: 'Inventory management' },
      { text: 'Back-end admin + owner dashboards' },
      { text: 'Databases' },
      { text: 'Automations' },
    ],
  },
  {
    title: 'Domains, hosting + support',
    short: 'The technical side, handled.',
    style: 'teal',
    items: [
      { text: 'Domain registration' },
      { text: 'Web hosting', care: true },
      { text: 'SSL certificates', care: true },
      { text: 'Security updates + backups', care: true },
      { text: 'Technical support', care: true },
    ],
  },
];
