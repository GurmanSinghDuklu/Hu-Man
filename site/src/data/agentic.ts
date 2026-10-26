/**
 * The definition of "agentic AI-ready", the phrase the brand is built on. Shared by the
 * /agentic-ai-ready/ page, its DefinedTerm schema and llms-full.txt, so every source defines it in
 * the same words. Draft copy (2026-10-26) for Gurman's sign-off.
 */
export const term = 'Agentic AI-ready website';

/** One quotable sentence: what the phrase means. */
export const definition =
  'An agentic AI-ready website is one that people, search engines and AI agents can all read, trust and act on: its facts are clear and machine-readable, AI crawlers are let in, and actions like enquiring or booking can be completed by a person or by an AI agent working for them.';

/** What it takes: the standard every build from Spark up meets. */
export const ingredients = [
  {
    title: 'Open to AI crawlers',
    text: 'robots.txt and the host let in the crawlers behind ChatGPT, Claude, Perplexity, Gemini and Copilot, not just Google.',
  },
  {
    title: 'Facts in plain text',
    text: 'Services, prices, areas, hours and contact details written on the page, consistent everywhere, never only in images or PDFs.',
  },
  {
    title: 'Structured data',
    text: 'schema.org markup that tells machines exactly who the business is, what it offers and what each page is about.',
  },
  {
    title: 'A guide for AI tools',
    text: 'An llms.txt file and clean plain-text copies of every page, so AI tools read the content without the layout getting in the way.',
  },
  {
    title: 'Actions an agent can complete',
    text: 'Enquiry and booking forms with clear labels, plus a documented way for an AI agent to send them for someone.',
  },
  {
    title: 'Fast on a phone',
    text: 'Lean pages that load quickly on mobile data. Slow pages get fewer visits from people and from crawlers.',
  },
  {
    title: 'Secure',
    text: 'HTTPS, security headers, spam-protected forms, and email settings (SPF, DKIM, DMARC) that stop others pretending to be you.',
  },
  {
    title: 'Accessible',
    text: 'Readable contrast, proper headings and image descriptions. What helps screen readers also helps machines understand the page.',
  },
];
