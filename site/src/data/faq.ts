/**
 * The FAQs on the About, agentic AI-ready, free AI check and contact pages. One copy feeds each page, its
 * FAQPage schema and llms-full.txt, so the answer an AI tool reads is always the one a visitor sees.
 * The two newer lists are drafts (2026-10-26) awaiting Gurman's sign-off.
 */
import { fromPrice, priceOf, tiers, portfolioTiers, portfolioExpress, keepLive } from './pricing';

export interface FaqItem {
  q: string;
  a: string;
}

export const faq: FaqItem[] = [
  {
    q: 'How much does a website cost?',
    a: `Sites start from ${fromPrice} for a one-page site and go up in five tiers to ${priceOf('growth')}, with custom work priced on request. Every site is agentic AI-ready.`,
  },
  {
    q: 'Will I lose my Google rankings?',
    a: 'We keep page addresses where we can and set up redirects. No one can guarantee rankings.',
  },
  {
    q: 'Can you get me into AI answers?',
    a: 'No one can guarantee it. We run a thorough, extensive check and work to get you found and cited across ChatGPT, Perplexity, Claude, Gemini, Grok and Google AI Overviews.',
  },
  {
    q: 'How long does it take?',
    a: `${tiers
      .map((c) => `${c.name}: ${c.timeline.charAt(0).toLowerCase()}${c.timeline.slice(1)}`)
      .join(
        '. ',
      )}. It depends on how quickly you send content. Need it sooner? Ask about Fast Track on the call.`,
  },
  {
    q: 'Do I own my website?',
    a: 'Yes, after final payment. Domain and accounts stay in your name.',
  },
  {
    q: 'Where do you work?',
    a: 'Leeds. In person across Leeds and West Yorkshire, Harrogate, York and Manchester; remote across the UK and worldwide.',
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
    a: `Every tier, from Essential (${fromPrice}) up.`,
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
    a: 'We use them only to answer you. The form emails your message to us and keeps a copy in our private enquiries list, which only our team can see; we delete it after 12 months. The privacy notice has the details.',
  },
];

/**
 * The CV concepts on /portfolio/ (draft, 2026-11-18, awaiting Gurman's sign-off). Only what docs/02
 * and the terms say: concepts are non-exclusive starting points (terms 7), the client confirms CV
 * content (terms 4), and no promise of jobs, interviews or an ATS score.
 */
export const portfolioFaq: FaqItem[] = [
  {
    q: 'Can I use one of these concepts for my site?',
    a: 'Yes. Any concept on this page can be the starting point for your site. We swap the sample content for your own words, photos, projects and links.',
  },
  {
    q: 'Will anyone else have the same design?',
    a: 'They might. The concepts are not exclusive, so more than one person may pick the same one, and the design stays ours. A design that’s yours alone comes with Portfolio Pro, or ask and we’ll quote it.',
  },
  {
    q: 'Which tier do I need for a concept?',
    a: `It depends on the concept. Some are one page; others have several pages, motion and video. Tell us which one you like and we’ll tell you the tier it needs before you pay anything. Tiers run from ${portfolioTiers[0].price} to ${portfolioTiers[portfolioTiers.length - 1].price}.`,
  },
  {
    q: 'Are the people in the concepts real?',
    a: 'No. Every concept is filled with sample content to show how the design works. Your site shows your own details.',
  },
  {
    q: 'Will my site help me get past an applicant tracking system?',
    a: 'An applicant tracking system reads your CV, not your website. Every tier comes with a downloadable PDF CV in a plain one-column layout that software can read. We don’t promise an ATS score, interviews or jobs.',
  },
  {
    q: 'What do I need to send you?',
    a: 'Your CV, the projects you want to show, any photos, and the links you want on the page. You confirm that what goes on your site is accurate, and that you have permission to share anything about other people or past employers.',
  },
  {
    q: 'How long does it take?',
    a: `${portfolioTiers.map((t) => `${t.name}: ${t.timeline}`).join('. ')}. Need it for an interview? ${portfolioExpress.title} on Profile is ${portfolioExpress.price}.`,
  },
  {
    q: 'Can I change it myself afterwards?',
    a: `With Portfolio Pro you get an owner dashboard to edit it yourself. On any tier, keep-it-live hosting with two content updates a year is ${keepLive.price}.`,
  },
];
