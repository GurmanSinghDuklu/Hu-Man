/**
 * How a build runs (the /how-we-build/ page). Shared with the page's schema and llms-full.txt.
 */
export interface Stage {
  title: string;
  text: string;
  /** The card's shape and fill on the page. */
  style: 'ink' | 'arch' | 'square' | 'lilac';
}

/** "Six stages. A human signs off each one." */
export const stages: Stage[] = [
  {
    title: 'Discovery call',
    text: 'We learn your business, your customers and what the site needs to do.',
    style: 'ink',
  },
  {
    title: 'Design + concept',
    text: 'You see the design before a line of code is written.',
    style: 'arch',
  },
  {
    title: 'Build',
    text: 'AI speeds up the groundwork. A developer writes, reviews and tests every page.',
    style: 'square',
  },
  {
    title: 'Test',
    text: 'Speed, security, accessibility and every device, checked before launch.',
    style: 'square',
  },
  {
    title: 'Launch',
    text: 'Domain, certificates, redirects and search setup done for you.',
    style: 'arch',
  },
  {
    title: 'Still here',
    text: 'After launch, you message a person when you need something.',
    style: 'lilac',
  },
];

/** "Every site passes this checklist", before go-live. */
export const checklist: string[] = [
  'HTTPS certificate active',
  'Security headers set',
  'Forms protected from spam',
  'SPF, DKIM + DMARC on your domain',
  'Images compressed',
  'Mobile speed tested',
  'Structured data validated',
  'Sitemap submitted to Google',
  'AI crawler rules set',
  'Old links redirected',
  'Accessibility checked',
  'Backups in place',
];

/** "One-prompt site vs Hu/man build": [what, one-prompt site, Hu/man build]. */
export const compare: [string, string, string][] = [
  ['Words', 'Generic filler', 'Written for your business, checked by a person'],
  ['Speed', 'Heavy and untested', 'Tested on real phones, built to load fast'],
  ['Security', 'Whatever the default is', 'HTTPS, security headers, spam-protected forms'],
  ['Email + domain', 'Often left unset', 'SPF, DKIM and DMARC so your emails land'],
  ['AI + agents', 'Hard for AI to read', 'Structured data and agent-ready actions'],
  ['When it breaks', 'You’re on your own', 'A person fixes it'],
];

/** "What's under the bonnet." The style is the card's fill on the page. */
export const bonnet: { title: string; text: string; style: string }[] = [
  {
    title: 'Fast by default',
    text: 'Lean code, compressed images and caching, so pages load quickly on mobile data.',
    style: 'lilac',
  },
  {
    title: 'Secure by default',
    text: 'HTTPS certificates, security headers, protected forms and updates kept current.',
    style: 'dusk',
  },
  {
    title: 'Agentic AI-ready',
    text: 'Structured data, clear facts and simple actions AI agents can read and complete.',
    style: 'indigo',
  },
  {
    title: 'Found in search',
    text: 'Sitemaps, clean page structure and Business Profile setup.',
    style: 'rose',
  },
  {
    title: 'Accessible',
    text: 'Readable contrast, keyboard friendly, image descriptions.',
    style: 'paper',
  },
  {
    title: 'Yours to keep',
    text: 'You own the code and domain. No platform lock-in.',
    style: 'teal',
  },
];
