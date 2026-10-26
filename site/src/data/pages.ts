/**
 * Every page's search and sharing details in one place: the <title>, meta description, the
 * breadcrumb label, the headline on its social image, and the schema type. The pages, the schema,
 * the social images (scripts/generate-og-images.mjs) and llms.txt all read from here.
 *
 * Titles stay under 60 characters and descriptions near 150, so search results show them whole.
 */
import { fromPrice, priceOf, tiers } from './pricing';
import { checklist } from './process';

export type PageKey =
  'index' | 'services' | 'pricing' | 'work' | 'about' | 'how-we-build' | 'privacy' | '404';

export interface PageInfo {
  key: PageKey;
  /** Path from the site root, with the trailing slash. */
  path: string;
  title: string;
  description: string;
  /** Breadcrumb and llms.txt link text. */
  label: string;
  /** The headline on the page's social image. */
  ogHeadline: string;
  /** The schema.org type of the page itself. */
  schemaType: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'FAQPage';
}

const words = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];
export const tierCount = words[tiers.length] ?? String(tiers.length);

export const pages: Record<PageKey, PageInfo> = {
  index: {
    key: 'index',
    path: '/',
    // Gurman's chosen home title (2026-10-13).
    title: 'Hu/man Software Agency | Your human in the loop.',
    description:
      'Leeds studio for websites, apps and software: agentic AI-ready as standard, with a real person from first call to long after launch. Free AI check.',
    label: 'Home',
    ogHeadline: 'Got an idea? Let’s build it.',
    schemaType: 'WebPage',
  },
  services: {
    key: 'services',
    path: '/services/',
    title: 'Websites, apps and software in Leeds | Hu/man',
    description:
      'Websites, e-commerce, mobile apps, branding and custom software from a Leeds studio, plus domains, hosting and support. A real person, start to finish.',
    label: 'Services',
    ogHeadline: 'Everything under one roof.',
    schemaType: 'WebPage',
  },
  pricing: {
    key: 'pricing',
    path: '/pricing/',
    title: `Website prices from ${fromPrice} | Hu/man, Leeds`,
    description: `Website prices from ${fromPrice} to ${priceOf('full-presence')} in ${tierCount} fixed tiers, plus custom apps and portals. Pay once, own it, and move up a tier by paying the difference.`,
    label: 'Pricing',
    ogHeadline: `Start at ${fromPrice}. Grow from there.`,
    schemaType: 'FAQPage',
  },
  work: {
    key: 'work',
    path: '/work/',
    title: 'Our work: websites and web apps | Hu/man',
    description:
      'Live websites and concepts from Hu/man: Essence Hair (built for a family business), The Calculator App and the Eldeva Candles concept design.',
    label: 'Our work',
    ogHeadline: 'Real projects. Real people.',
    schemaType: 'CollectionPage',
  },
  about: {
    key: 'about',
    path: '/about/',
    title: 'About Hu/man, a software studio in Leeds',
    description:
      'Hu/man is a software studio in Leeds building fast, secure, agentic AI-ready websites and apps, with a real person beside you long after launch.',
    label: 'About',
    ogHeadline: 'Built by humans. Made to last.',
    schemaType: 'AboutPage',
  },
  'how-we-build': {
    key: 'how-we-build',
    path: '/how-we-build/',
    title: 'How we build fast, secure, AI-ready sites | Hu/man',
    description: `Not AI slop: six stages a human signs off, the technology under every build, and the ${checklist.length}-point checklist every site passes before it goes live.`,
    label: 'How we build',
    ogHeadline: 'Not AI slop.',
    schemaType: 'WebPage',
  },
  privacy: {
    key: 'privacy',
    path: '/privacy/',
    title: 'Privacy notice | Hu/man Software Agency',
    description:
      'How the Hu/man website handles your information: no cookies, no tracking, and what happens when you email, call or message us.',
    label: 'Privacy notice',
    ogHeadline: 'Privacy notice.',
    schemaType: 'WebPage',
  },
  '404': {
    key: '404',
    path: '/404/',
    title: 'Page not found | Hu/man Software Agency',
    description: 'This page could not be found.',
    label: 'Page not found',
    ogHeadline: 'Got an idea? Let’s build it.',
    schemaType: 'WebPage',
  },
};
