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
  | 'index'
  | 'services'
  | 'pricing'
  | 'work'
  | 'about'
  | 'how-we-build'
  | 'agentic-ai-ready'
  | 'free-ai-check'
  | 'contact'
  | 'thanks'
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'user-agreement'
  | '404';

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
  schemaType: 'WebPage' | 'AboutPage' | 'CollectionPage' | 'FAQPage' | 'ContactPage';
  /** Kept out of search results, the sitemap and llms.txt (404, the form's thank-you page). */
  noindex?: boolean;
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
  'agentic-ai-ready': {
    key: 'agentic-ai-ready',
    path: '/agentic-ai-ready/',
    title: 'What is an agentic AI-ready website? | Hu/man',
    description:
      'An agentic AI-ready website is one people, search engines and AI agents can read, trust and act on. What it means, what it takes, and how to check yours.',
    label: 'Agentic AI-ready',
    ogHeadline: 'What is an agentic AI-ready website?',
    schemaType: 'FAQPage',
  },
  'free-ai-check': {
    key: 'free-ai-check',
    path: '/free-ai-check/',
    title: 'Free AI check: is AI recommending you? | Hu/man',
    description:
      'Find out whether ChatGPT, Perplexity, Gemini and Google’s AI Overviews recommend your business, and what to fix. Free, no obligation, checked by a person.',
    label: 'Free AI check',
    ogHeadline: 'Is AI recommending your competitors?',
    schemaType: 'FAQPage',
  },
  contact: {
    key: 'contact',
    path: '/contact/',
    title: 'Contact Hu/man Software Agency, Leeds',
    description:
      'Tell us about your website, app or idea. A real person reads every message and replies by email. Or call or WhatsApp. Based in Leeds, working UK-wide.',
    label: 'Contact',
    ogHeadline: 'Talk to a human.',
    schemaType: 'ContactPage',
  },
  thanks: {
    key: 'thanks',
    path: '/thanks/',
    title: 'Thanks for your message | Hu/man',
    description: 'Your message has been sent. A real person will reply by email.',
    label: 'Thanks',
    ogHeadline: 'Talk to a human.',
    schemaType: 'WebPage',
    noindex: true,
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
  cookies: {
    key: 'cookies',
    path: '/cookies/',
    title: 'Cookie policy | Hu/man Software Agency',
    description:
      'The Hu/man website sets no cookies and runs no analytics or tracking. What that means, and the one security cookie our host may set.',
    label: 'Cookie policy',
    ogHeadline: 'Cookie policy.',
    schemaType: 'WebPage',
  },
  terms: {
    key: 'terms',
    path: '/terms/',
    title: 'Terms and conditions | Hu/man Software Agency',
    description:
      'How working with Hu/man works: fixed quotes, a 50% deposit, three revision rounds, who owns the work, cancelling and what we don’t promise.',
    label: 'Terms and conditions',
    ogHeadline: 'Terms and conditions.',
    schemaType: 'WebPage',
  },
  'user-agreement': {
    key: 'user-agreement',
    path: '/user-agreement/',
    title: 'User agreement | Hu/man Software Agency',
    description:
      'The rules for using the Hu/man website, its forms and its enquiry endpoint, including what crawlers and AI assistants may do with our content.',
    label: 'User agreement',
    ogHeadline: 'User agreement.',
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
    noindex: true,
  },
};
