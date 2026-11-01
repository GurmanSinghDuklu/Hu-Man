/**
 * How a build runs: one named method with timings (change list, Nov 2026). The home page and
 * /how-we-build/ show this same block, and the page schema and llms-full.txt read it too.
 */
export interface MethodStep {
  title: string;
  /** When it happens. */
  when: string;
  text: string;
  /** The card's shape on the page. */
  shape: 'curve' | 'square' | 'lilac';
}

/** "Talk, Shape, Build, Launch, Stay." */
export const methodName = 'Talk. Shape. Build. Launch. Stay.';

export const method: MethodStep[] = [
  {
    title: 'Talk',
    when: 'Day 1 · free 1-hour call',
    text: 'You leave knowing what to build first.',
    shape: 'curve',
  },
  {
    title: 'Shape',
    when: 'Week 1',
    text: 'A plan and design you approve before any code.',
    shape: 'square',
  },
  {
    title: 'Build',
    when: 'Weeks 2 to 4',
    text: 'Developer-written, and tested on real phones.',
    shape: 'curve',
  },
  {
    title: 'Launch',
    when: 'Go-live',
    text: 'Domain, redirects, search and AI setup done for you.',
    shape: 'square',
  },
  {
    title: 'Stay',
    when: 'Ongoing',
    text: 'A person who knows your site answers.',
    shape: 'lilac',
  },
];

/** Under the method block: the timings above are typical, each tier has its own (/pricing/). */
export const methodNote =
  'Typical timings. Each tier has its own timeline on the pricing page, and we confirm yours on the call.';

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
