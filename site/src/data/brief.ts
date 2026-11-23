/**
 * The project brief a client fills in at /account/brief/ (spec:
 * docs/superpowers/specs/2026-11-23-client-accounts-design.md). One list drives both the page
 * (components/account/BriefForm.astro) and the Worker's checks (worker/accounts/briefs.js), so a
 * question changes here and nowhere else.
 *
 * Written in plain, erasable TypeScript with no imports, so Node's tests and wrangler can load it
 * directly. Tier names in `in` must match src/data/pricing.ts (a test checks): a feature whose
 * option lists tiers, on a project whose tier isn't one of them, shows "We'll talk about this on a
 * call". No prices appear in the brief.
 */
export type ProjectType = 'business' | 'portfolio' | 'custom';

export type FieldKind =
  'text' | 'textarea' | 'url' | 'date' | 'choice' | 'checks' | 'files' | 'repeat' | 'consent';

export interface BriefOption {
  value: string;
  label: string;
  /** Tier names (pricing.ts, portfolio ones as "Portfolio: <name>") that include this feature. */
  in?: string[];
}

export interface BriefField {
  id: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  required?: boolean;
  /** Most characters for text kinds (defaults: 200 for one line, 2000 for a text area). */
  max?: number;
  options?: BriefOption[];
  /** Project types that see this field (all when left out). */
  types?: ProjectType[];
  /** For 'repeat': the parts of each card (text, textarea or url) and the most cards. */
  fields?: BriefField[];
  maxItems?: number;
}

export interface BriefStep {
  id: string;
  title: string;
  intro?: string;
  fields: BriefField[];
}

export const projectTypeLabels: Record<ProjectType, string> = {
  business: 'Business website',
  portfolio: 'Portfolio or CV website',
  custom: 'Custom software or app',
};

const BUSINESS: ProjectType[] = ['business'];
const PORTFOLIO: ProjectType[] = ['portfolio'];
const CUSTOM: ProjectType[] = ['custom'];
const SITES: ProjectType[] = ['business', 'portfolio'];

const FROM_START = ['Start', 'Launch', 'Growth'];
const FROM_LAUNCH = ['Launch', 'Growth'];
const GROWTH = ['Growth'];
const FROM_PORTFOLIO = ['Portfolio: Portfolio', 'Portfolio: Portfolio Pro'];
const PRO = ['Portfolio: Portfolio Pro'];
const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

export const briefSteps: BriefStep[] = [
  {
    id: 'about',
    title: 'About you',
    fields: [
      { id: 'businessName', label: 'Business name', kind: 'text', required: true, types: BUSINESS },
      {
        id: 'whatYouDo',
        label: 'What you do, in one line',
        kind: 'text',
        hint: 'For example: electrician covering Leeds and Bradford.',
        required: true,
        types: BUSINESS,
      },
      {
        id: 'where',
        label: 'Where you work',
        kind: 'text',
        hint: 'Towns or areas you cover.',
        types: BUSINESS,
      },
      { id: 'customers', label: 'Who your customers are', kind: 'textarea', types: BUSINESS },
      {
        id: 'displayName',
        label: 'Your name as it should appear',
        kind: 'text',
        required: true,
        types: PORTFOLIO,
      },
      { id: 'jobTitle', label: 'Job title', kind: 'text', required: true, types: PORTFOLIO },
      { id: 'aiming', label: 'Roles you’re aiming for', kind: 'textarea', types: PORTFOLIO },
      { id: 'cv', label: 'Your CV', kind: 'files', hint: 'A PDF is best.', types: PORTFOLIO },
      {
        id: 'problem',
        label: 'The problem it solves',
        kind: 'textarea',
        required: true,
        types: CUSTOM,
      },
      { id: 'users', label: 'Who will use it', kind: 'textarea', required: true, types: CUSTOM },
    ],
  },
  {
    id: 'want',
    title: 'What you want',
    intro: 'Tick everything that matters. Anything outside your tier, we talk through on a call.',
    fields: [
      {
        id: 'goals',
        label: 'What should the site do for you?',
        kind: 'checks',
        types: BUSINESS,
        options: [
          { value: 'enquiries', label: 'Bring in enquiries' },
          { value: 'bookings', label: 'Take bookings' },
          { value: 'sell', label: 'Sell online' },
          { value: 'found', label: 'Be found on Google and AI tools' },
          { value: 'trust', label: 'Look professional and trustworthy' },
        ],
      },
      {
        id: 'portfolioGoals',
        label: 'What should the site do for you?',
        kind: 'checks',
        types: PORTFOLIO,
        options: [
          { value: 'work', label: 'Show my work' },
          { value: 'jobs', label: 'Help me apply for jobs' },
          { value: 'clients', label: 'Bring in freelance clients' },
        ],
      },
      {
        id: 'pages',
        label: 'Pages you want',
        kind: 'checks',
        types: BUSINESS,
        options: [
          { value: 'home', label: 'Home' },
          { value: 'about', label: 'About' },
          { value: 'services', label: 'Services' },
          { value: 'prices', label: 'Prices' },
          { value: 'gallery', label: 'Gallery' },
          { value: 'reviews', label: 'Reviews' },
          { value: 'faq', label: 'Questions (FAQ)' },
          { value: 'contact', label: 'Contact' },
        ],
      },
      {
        id: 'portfolioPages',
        label: 'Pages you want',
        kind: 'checks',
        types: PORTFOLIO,
        options: [
          { value: 'home', label: 'Home' },
          { value: 'about', label: 'About' },
          { value: 'projects', label: 'Projects' },
          { value: 'experience', label: 'Experience' },
          { value: 'skills', label: 'Skills' },
          { value: 'writing', label: 'Writing or blog' },
          { value: 'contact', label: 'Contact' },
        ],
      },
      { id: 'pagesOther', label: 'Any other pages', kind: 'text', types: SITES },
      {
        id: 'features',
        label: 'Features you want',
        kind: 'checks',
        types: BUSINESS,
        options: [
          { value: 'contact-form', label: 'Contact form' },
          { value: 'business-profile', label: 'Google Business Profile set up', in: FROM_START },
          { value: 'dashboard', label: 'A dashboard so you can edit it yourself', in: FROM_LAUNCH },
          {
            value: 'move',
            label: 'Move from Wix or Squarespace, keeping your addresses',
            in: FROM_LAUNCH,
          },
          { value: 'motion', label: 'Motion and interactive touches', in: FROM_LAUNCH },
          { value: 'booking', label: 'Online booking', in: GROWTH },
          { value: 'payments', label: 'Payments (Stripe, Square or SumUp)', in: GROWTH },
          { value: 'ai-agent', label: 'An AI assistant that answers enquiries', in: GROWTH },
          { value: 'reviews', label: 'Collecting reviews', in: GROWTH },
          { value: 'shop', label: 'An online shop', in: [] },
          { value: 'blog', label: 'News or blog', in: [] },
        ],
      },
      {
        id: 'portfolioFeatures',
        label: 'Features you want',
        kind: 'checks',
        types: PORTFOLIO,
        options: [
          { value: 'pdf-cv', label: 'A downloadable PDF CV' },
          {
            value: 'case-studies',
            label: 'Project case studies with images and files',
            in: FROM_PORTFOLIO,
          },
          { value: 'testimonials', label: 'Testimonials', in: FROM_PORTFOLIO },
          { value: 'analytics', label: 'Visitor numbers (analytics)', in: FROM_PORTFOLIO },
          { value: 'video', label: 'Video or a showreel', in: PRO },
          { value: 'social', label: 'Social media feeds', in: PRO },
          { value: 'blog', label: 'A writing or blog section', in: PRO },
          { value: 'dashboard', label: 'A dashboard so you can edit it yourself', in: PRO },
        ],
      },
      { id: 'mustHaves', label: 'Must-have features', kind: 'textarea', types: CUSTOM },
      {
        id: 'systems',
        label: 'Tools or systems it needs to work with',
        kind: 'textarea',
        hint: 'For example: Xero, Google Sheets, your booking software.',
        types: CUSTOM,
      },
    ],
  },
  {
    id: 'look',
    title: 'Look and feel',
    fields: [
      {
        id: 'concept',
        label: 'The concept you chose',
        kind: 'text',
        hint: 'Leave it empty if you haven’t picked one.',
        max: 60,
        types: SITES,
      },
      {
        id: 'likes',
        label: 'Sites you like',
        kind: 'repeat',
        hint: 'Up to three, and what you like about each.',
        maxItems: 3,
        fields: [
          { id: 'url', label: 'Address', kind: 'url' },
          { id: 'why', label: 'What you like about it', kind: 'textarea', max: 600 },
        ],
      },
      {
        id: 'colours',
        label: 'Brand colours',
        kind: 'text',
        hint: 'Names or colour codes, if you have them.',
      },
      { id: 'feel', label: 'Three words for how it should feel', kind: 'text', max: 100 },
      { id: 'brandFiles', label: 'Logo and brand files', kind: 'files' },
    ],
  },
  {
    id: 'content',
    title: 'Your content',
    intro:
      'This is what we need from you to build it. Send what you have; we can fill gaps together.',
    fields: [
      { id: 'photos', label: 'Photos', kind: 'files', types: SITES },
      {
        id: 'words',
        label: 'The words on the site',
        kind: 'choice',
        types: SITES,
        options: [
          { value: 'self', label: 'I’ll write them' },
          { value: 'help', label: 'Help me write them' },
          { value: 'unsure', label: 'Not sure yet' },
        ],
      },
      {
        id: 'services',
        label: 'Services and prices',
        kind: 'textarea',
        hint: 'One per line.',
        types: BUSINESS,
      },
      { id: 'hours', label: 'Opening hours', kind: 'textarea', max: 600, types: BUSINESS },
      {
        id: 'contactShow',
        label: 'Contact details to show on the site',
        kind: 'textarea',
        max: 600,
        types: BUSINESS,
      },
      {
        id: 'projects',
        label: 'Projects to show',
        kind: 'repeat',
        maxItems: 12,
        types: PORTFOLIO,
        fields: [
          { id: 'title', label: 'Project title', kind: 'text', max: 120 },
          { id: 'did', label: 'What you did', kind: 'textarea', max: 1200 },
          { id: 'link', label: 'Link, if there is one', kind: 'url' },
        ],
      },
      {
        id: 'projectFiles',
        label: 'Project images and files',
        kind: 'files',
        hint: 'Name each file after its project.',
        types: PORTFOLIO,
      },
      { id: 'skills', label: 'Skills', kind: 'textarea', types: PORTFOLIO },
      { id: 'socials', label: 'Social links', kind: 'textarea', hint: 'One per line.', max: 1000 },
      {
        id: 'reviews',
        label: 'Reviews or testimonials',
        kind: 'textarea',
        hint: 'Only real ones you have permission to use, with the name as the person agreed to show it.',
        max: 4000,
        types: SITES,
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical',
    intro:
      'We never ask for passwords here. If we need access to anything, we set it up safely with you on a call.',
    fields: [
      { id: 'currentSite', label: 'Your current website', kind: 'url' },
      { id: 'domain', label: 'Do you own a domain name?', kind: 'choice', options: YES_NO },
      {
        id: 'domainWhere',
        label: 'If you do, who is it with?',
        kind: 'text',
        hint: 'For example: GoDaddy, 123-reg, Cloudflare.',
        max: 100,
      },
      {
        id: 'businessProfile',
        label: 'Do you have a Google Business Profile?',
        kind: 'choice',
        options: YES_NO,
        types: BUSINESS,
      },
    ],
  },
  {
    id: 'timing',
    title: 'Timing and anything else',
    fields: [
      { id: 'byDate', label: 'When you’d like it by', kind: 'date' },
      { id: 'why', label: 'Why that date?', kind: 'text' },
      { id: 'anything', label: 'Anything else', kind: 'textarea', max: 4000 },
    ],
  },
  {
    id: 'send',
    title: 'Check and send',
    intro:
      'Check your answers below. Once you send, the brief is locked; ask us if you need to change it.',
    fields: [
      {
        id: 'consent',
        label: 'Everything I’ve given is mine or I have permission to use it, and it’s accurate.',
        kind: 'consent',
        required: true,
      },
    ],
  },
];

/** The steps and fields a project type sees (steps with nothing left are dropped). */
export function stepsFor(type: ProjectType): BriefStep[] {
  return briefSteps
    .map((step) => ({
      ...step,
      fields: step.fields.filter((f) => !f.types || f.types.includes(type)),
    }))
    .filter((step) => step.fields.length > 0);
}

export const fieldsFor = (type: ProjectType): BriefField[] =>
  stepsFor(type).flatMap((s) => s.fields);

/** The ids of the upload fields a project type has. */
export const fileFieldsFor = (type: ProjectType): string[] =>
  fieldsFor(type)
    .filter((f) => f.kind === 'files')
    .map((f) => f.id);

const defaultMax = (field: BriefField) =>
  field.max ?? (field.kind === 'textarea' ? 2000 : field.kind === 'url' ? 300 : 200);

function cleanText(value: unknown, field: BriefField): string {
  if (typeof value !== 'string') return '';
  // Removing control characters is the point of these two patterns (text areas keep line breaks).
  const kept =
    field.kind === 'textarea'
      ? // eslint-disable-next-line no-control-regex
        value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      : // eslint-disable-next-line no-control-regex
        value.replace(/[\u0000-\u001f\u007f]+/g, ' ');
  return kept.trim();
}

export type BriefAnswers = Record<string, unknown>;

/**
 * Cleans a client's answers for a project type: unknown keys and invalid choices are dropped, text
 * is trimmed. `errors` lists text over its limit, and, when `sending`, required fields left empty.
 */
export function validateBrief(
  type: ProjectType,
  raw: unknown,
  { sending = false }: { sending?: boolean } = {},
): { answers: BriefAnswers; errors: Record<string, string> } {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as BriefAnswers) : {};
  const answers: BriefAnswers = {};
  const errors: Record<string, string> = {};

  for (const field of fieldsFor(type)) {
    const value = input[field.id];
    if (field.kind === 'files') continue; // uploads live in the files table
    if (field.kind === 'consent') {
      if (value === true) answers[field.id] = true;
    } else if (field.kind === 'choice') {
      if (field.options?.some((o) => o.value === value)) answers[field.id] = value;
    } else if (field.kind === 'checks') {
      if (Array.isArray(value)) {
        const allowed = new Set(field.options?.map((o) => o.value));
        const picked = [...new Set(value.filter((v) => typeof v === 'string' && allowed.has(v)))];
        if (picked.length) answers[field.id] = picked;
      }
    } else if (field.kind === 'repeat') {
      if (Array.isArray(value)) {
        const cards = value
          .slice(0, field.maxItems ?? 10)
          .map((card) => {
            const out: Record<string, string> = {};
            for (const part of field.fields ?? []) {
              const text = cleanText((card as Record<string, unknown> | null)?.[part.id], part);
              if (text.length > defaultMax(part))
                errors[field.id] =
                  `Please keep “${part.label}” under ${defaultMax(part)} characters.`;
              if (text) out[part.id] = text.slice(0, defaultMax(part));
            }
            return out;
          })
          .filter((card) => Object.keys(card).length > 0);
        if (cards.length) answers[field.id] = cards;
      }
    } else {
      let text = cleanText(value, field);
      if (field.kind === 'date' && text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) text = '';
      if (text.length > defaultMax(field)) {
        errors[field.id] = `Please keep this under ${defaultMax(field)} characters.`;
        text = text.slice(0, defaultMax(field));
      }
      if (text) answers[field.id] = text;
    }
    if (sending && field.required && answers[field.id] === undefined) {
      errors[field.id] =
        field.kind === 'consent' ? 'Please tick this to send your brief.' : 'Please fill this in.';
    }
  }
  return { answers, errors };
}

/** One answer as plain text, for the studio's email and the admin page. */
export function answerText(field: BriefField, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (field.kind === 'consent') return value === true ? 'Yes' : '';
  if (field.kind === 'choice') return field.options?.find((o) => o.value === value)?.label ?? '';
  if (field.kind === 'checks' && Array.isArray(value)) {
    return value.map((v) => field.options?.find((o) => o.value === v)?.label ?? v).join(', ');
  }
  if (field.kind === 'repeat' && Array.isArray(value)) {
    return value
      .map((card, i) =>
        [
          `${i + 1}.`,
          ...(field.fields ?? [])
            .filter((p) => (card as Record<string, string>)[p.id])
            .map((p) => `${p.label}: ${(card as Record<string, string>)[p.id]}`),
        ].join(' '),
      )
      .join('\n');
  }
  return String(value);
}
