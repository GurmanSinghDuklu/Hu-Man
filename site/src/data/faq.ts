/**
 * The FAQs on the pricing, agentic AI-ready, free AI check and contact pages. One copy feeds each page, its
 * FAQPage schema and llms-full.txt, so the answer an AI tool reads is always the one a visitor sees.
 * The two newer lists are drafts (2026-10-26) awaiting Gurman's sign-off.
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

/** "What is an agentic AI-ready website?" (/agentic-ai-ready/). */
export const agenticFaq: FaqItem[] = [
  {
    q: 'What does agentic AI-ready mean?',
    a: 'An agentic AI-ready website is built so people, search engines and AI agents can all read it, trust it and act on it. Its facts are in plain text and structured data, AI crawlers are let in, it is fast and secure, and actions such as enquiring or booking can be completed by a person or by an AI agent working for them.',
  },
  {
    q: 'What is an AI agent?',
    a: 'Software that carries out tasks for a person: searching, comparing options, filling in forms. Assistants such as ChatGPT, Gemini, Claude, Perplexity and Copilot can already browse the web and act on what they find.',
  },
  {
    q: 'Is it the same as SEO?',
    a: 'It builds on SEO. Search engines and AI tools read many of the same signals. Agentic AI-ready adds what AI tools rely on most: open crawler access, machine-readable facts, plain-text copies of pages and actions an agent can complete.',
  },
  {
    q: 'Does it guarantee I will appear in AI answers?',
    a: 'No. No one can guarantee a place in AI answers. Being agentic AI-ready removes the reasons an AI tool would skip you, and we can check whether you appear.',
  },
  {
    q: 'Which of your websites are agentic AI-ready?',
    a: `Every tier from Spark (${priceOf('spark')}) up. Essential (${fromPrice}) is a standard website without the agentic AI-ready setup.`,
  },
  {
    q: 'Can my current website be made agentic AI-ready?',
    a: 'Often, yes, without starting again. The free AI check shows what is missing and what to fix first.',
  },
];

/** The free AI check (/free-ai-check/). */
export const checkFaq: FaqItem[] = [
  {
    q: 'Is it really free?',
    a: 'Yes. No payment and no obligation. If you want help afterwards we will quote a fixed price; if not, the findings are yours to keep.',
  },
  {
    q: 'What do you need from me?',
    a: 'Your website address and an email to reply to. It helps to tell us the main thing customers search for, such as “electrician in Leeds”.',
  },
  {
    q: 'How long does it take?',
    a: 'We reply within 48 hours.',
  },
  {
    q: 'Is it automated?',
    a: 'No. Tools gather some of the data, but a person runs the AI searches, reads the results and writes your findings.',
  },
  {
    q: 'Can you guarantee AI will recommend me afterwards?',
    a: 'No one can guarantee that. We show you what is holding you back and what to fix, and we can check again after the fixes are in.',
  },
];

/** The contact page (/contact/). Draft, 2026-10-27, awaiting Gurman's sign-off. */
export const contactFaq: FaqItem[] = [
  {
    q: 'How quickly will you reply?',
    a: 'Within 48 hours, by email. A person reads every message.',
  },
  {
    q: 'Do I need to know exactly what I want?',
    a: 'No. Tell us the problem or the idea in your own words, and we will ask the questions.',
  },
  {
    q: 'Does it cost anything to talk?',
    a: 'No. Messages and the first call are free, with no obligation. If you go ahead, you get a fixed price before any work starts.',
  },
  {
    q: 'Can we meet in person?',
    a: 'Yes, in Leeds and across West Yorkshire. We also work by video call across the UK and worldwide.',
  },
  {
    q: 'What happens to my details?',
    a: 'We use them only to answer you. The form emails your message to us; the website stores nothing. The privacy notice has the details.',
  },
];
