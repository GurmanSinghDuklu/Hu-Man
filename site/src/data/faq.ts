/**
 * The FAQ on the pricing page. One copy feeds the page, its FAQPage schema and llms-full.txt, so
 * the answer an AI tool reads is always the one a visitor sees.
 */
import { fromPrice, priceOf } from './pricing';

export interface FaqItem {
  q: string;
  a: string;
  /** Show "See every tier" under the answer. */
  linkTiers?: boolean;
}

export const faq: FaqItem[] = [
  {
    q: 'How much does a website cost?',
    a: `Sites start from ${fromPrice} (standard) or ${priceOf('spark')} (agentic AI-ready) and go up in tiers to ${priceOf('full-presence')}, with custom work priced on request.`,
    linkTiers: true,
  },
  {
    q: 'Will I lose my Google rankings?',
    a: 'We keep page addresses where we can and set up redirects. No one can guarantee rankings.',
  },
  {
    q: 'Can you get me into AI answers?',
    a: 'No one can guarantee it. We run a thorough, extensive check and work to get you found and cited across ChatGPT, Perplexity, Claude, Gemini, Grok and Google AI Overviews.',
  },
  { q: 'How long does it take?', a: 'About 2 to 3 weeks for Launch, 4 to 6 for Growth.' },
  {
    q: 'Do I own my website?',
    a: 'Yes, after final payment. Domain and accounts stay in your name.',
  },
  {
    q: 'Where do you work?',
    a: 'Leeds. In person across West Yorkshire, remote across the UK and worldwide.',
  },
];
