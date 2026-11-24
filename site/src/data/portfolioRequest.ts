/**
 * The portfolio request form on /portfolio/ (spec: docs/superpowers/specs/2026-11-23-self-serve-
 * portfolios-design.md): what a CV builder asks, minus anything we don't need (no street address).
 * One list drives the page (components/account/RequestForm.astro), the Worker's checks
 * (worker/accounts/requests.js), the admin view and the instant templates.
 *
 * Plain, erasable TypeScript with no imports, so Node's tests and wrangler can load it directly.
 */
export type RequestRoute = 'details' | 'chat';

export interface RequestPart {
  id: string;
  label: string;
  /** 'image': an uploaded picture, kept as its file id (worker/accounts/files.js, field 'image'). */
  kind: 'text' | 'textarea' | 'month' | 'check' | 'image';
  max?: number;
  hint?: string;
  required?: boolean;
}

export interface RequestField {
  id: string;
  label: string;
  kind: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'repeat' | 'consent' | 'image';
  section: 'you' | 'links' | 'story' | 'experience' | 'education' | 'design' | 'more' | 'send';
  required?: boolean;
  max?: number;
  hint?: string;
  autocomplete?: string;
  /** For 'repeat': the parts of each entry, and the most entries. */
  parts?: RequestPart[];
  maxItems?: number;
  /** For 'repeat': what one entry is called ("Job"), and the add button's words. */
  noun?: string;
  add?: string;
  /**
   * Only asked when one of these designs (portfolioConcepts slugs) is chosen for an instant build:
   * the parts of that design's page the CV questions don't cover. Each design's renderer
   * (worker/accounts/concepts/) uses them, and leaves a part of the page out when they're empty.
   */
  designs?: string[];
}

export const requestRoutes: { value: RequestRoute; label: string; text: string }[] = [
  {
    value: 'details',
    label: 'Fill in details now',
    text: 'Your details and CV in one go. A real person reads it and replies within 48 hours.',
  },
  {
    value: 'chat',
    label: 'Chat with us instead',
    text: 'Not ready to fill it all in? Send a short message or WhatsApp us, and we’ll talk it through first.',
  },
];

export const requestSections: { id: RequestField['section']; title: string }[] = [
  { id: 'you', title: 'About you' },
  { id: 'links', title: 'Links' },
  { id: 'story', title: 'Your story' },
  { id: 'experience', title: 'Work history' },
  { id: 'education', title: 'Education' },
  { id: 'design', title: 'For your design' },
  { id: 'more', title: 'Anything else' },
  { id: 'send', title: 'Check and send' },
];

export const requestFields: RequestField[] = [
  {
    id: 'firstName',
    label: 'First name',
    kind: 'text',
    section: 'you',
    required: true,
    max: 60,
    autocomplete: 'given-name',
  },
  {
    id: 'surname',
    label: 'Surname',
    kind: 'text',
    section: 'you',
    required: true,
    max: 60,
    autocomplete: 'family-name',
  },
  {
    id: 'email',
    label: 'Email',
    kind: 'email',
    section: 'you',
    required: true,
    max: 200,
    autocomplete: 'email',
    hint: 'The one employers should use. It can differ from your login.',
  },
  {
    id: 'phone',
    label: 'Phone',
    kind: 'tel',
    section: 'you',
    max: 40,
    autocomplete: 'tel',
    hint: 'Optional. Only shown on your site if you want it there.',
  },
  {
    id: 'town',
    label: 'Town or city',
    kind: 'text',
    section: 'you',
    max: 80,
    autocomplete: 'address-level2',
    hint: 'Optional. We never need your street address.',
  },
  { id: 'linkedin', label: 'LinkedIn', kind: 'url', section: 'links', max: 300, hint: 'Optional.' },
  { id: 'website', label: 'Website', kind: 'url', section: 'links', max: 300, hint: 'Optional.' },
  {
    id: 'otherLinks',
    label: 'Other links',
    kind: 'textarea',
    section: 'links',
    max: 1000,
    hint: 'Optional. GitHub, Behance, Instagram… one per line.',
  },
  {
    id: 'jobTitle',
    label: 'Job title',
    kind: 'text',
    section: 'story',
    required: true,
    max: 100,
    hint: 'What you do, or the role you want. For example: Product designer.',
  },
  {
    id: 'summary',
    label: 'A short summary',
    kind: 'textarea',
    section: 'story',
    max: 1200,
    hint: 'Two or three sentences about you. We can help with the words.',
  },
  {
    id: 'skills',
    label: 'Skills',
    kind: 'textarea',
    section: 'story',
    max: 1500,
    hint: 'One per line.',
  },
  {
    id: 'experience',
    label: 'Jobs',
    kind: 'repeat',
    section: 'experience',
    maxItems: 15,
    noun: 'Job',
    add: 'Add a job',
    parts: [
      { id: 'title', label: 'Job title', kind: 'text', max: 120 },
      { id: 'employer', label: 'Employer', kind: 'text', max: 120 },
      { id: 'place', label: 'Town or city', kind: 'text', max: 80 },
      { id: 'from', label: 'From', kind: 'month' },
      { id: 'to', label: 'To', kind: 'month', hint: 'Leave empty if you still work there.' },
      { id: 'current', label: 'I work here now', kind: 'check' },
      {
        id: 'did',
        label: 'What you did',
        kind: 'textarea',
        max: 2000,
        hint: 'One point per line.',
      },
    ],
  },
  {
    id: 'education',
    label: 'Qualifications',
    kind: 'repeat',
    section: 'education',
    maxItems: 10,
    noun: 'Qualification',
    add: 'Add a qualification',
    parts: [
      { id: 'qualification', label: 'Qualification', kind: 'text', max: 160 },
      { id: 'where', label: 'School, college or university', kind: 'text', max: 160 },
      { id: 'year', label: 'Year', kind: 'text', max: 20 },
    ],
  },
  // ---------- for your design (only the chosen design's questions show) ----------
  {
    id: 'headline',
    label: 'One line under your name',
    kind: 'text',
    section: 'design',
    max: 160,
    hint: 'For example: Six years designing money and health apps.',
    designs: ['noor', 'theo'],
  },
  {
    id: 'heroWords',
    label: 'Three words for your work',
    kind: 'text',
    section: 'design',
    max: 80,
    hint: 'Shown huge at the top, separated by commas. For example: Planned, Delivered, Handed over.',
    designs: ['leah'],
  },
  {
    id: 'belief',
    label: 'What you believe about your work',
    kind: 'text',
    section: 'design',
    max: 160,
    hint: 'One sentence, shown large. For example: Software should fail loudly and recover quietly.',
    designs: ['theo'],
  },
  {
    id: 'availability',
    label: 'What you’re open to',
    kind: 'text',
    section: 'design',
    max: 120,
    hint: 'For example: Open to roles from January 2027. Leave empty to leave it off.',
    designs: ['noor', 'theo'],
  },
  {
    id: 'photo',
    label: 'A photo',
    kind: 'image',
    section: 'design',
    hint: 'Of you, or of your work. JPG, PNG or WebP, up to 10 MB. Without one we show your initials.',
    designs: ['leah'],
  },
  {
    id: 'facts',
    label: 'Three short facts',
    kind: 'repeat',
    section: 'design',
    maxItems: 3,
    noun: 'Fact',
    add: 'Add a fact',
    designs: ['noor'],
    parts: [
      { id: 'title', label: 'In a few words', kind: 'text', max: 40 },
      { id: 'text', label: 'A sentence about it', kind: 'textarea', max: 200 },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    kind: 'repeat',
    section: 'design',
    maxItems: 6,
    noun: 'Project',
    add: 'Add a project',
    designs: ['noor', 'leah', 'theo'],
    parts: [
      { id: 'title', label: 'Project name', kind: 'text', max: 80 },
      { id: 'what', label: 'What it is, in a line', kind: 'text', max: 120 },
      { id: 'role', label: 'Your role', kind: 'text', max: 100 },
      { id: 'year', label: 'Year', kind: 'text', max: 20 },
      { id: 'tools', label: 'Tools or skills used', kind: 'text', max: 120 },
      { id: 'link', label: 'Link', kind: 'text', max: 300, hint: 'Optional.' },
      { id: 'problem', label: 'The problem', kind: 'textarea', max: 600 },
      { id: 'built', label: 'What you did', kind: 'textarea', max: 600 },
      { id: 'outcome', label: 'What changed', kind: 'textarea', max: 600 },
      {
        id: 'image',
        label: 'A picture of it',
        kind: 'image',
        hint: 'A screenshot or photo. JPG, PNG or WebP, up to 10 MB. Optional.',
      },
    ],
  },
  {
    id: 'services',
    label: 'What you do',
    kind: 'repeat',
    section: 'design',
    maxItems: 6,
    noun: 'Area',
    add: 'Add an area',
    designs: ['leah'],
    parts: [
      { id: 'title', label: 'Area', kind: 'text', max: 40, hint: 'For example: Budgets.' },
      { id: 'text', label: 'A sentence about it', kind: 'textarea', max: 300 },
      { id: 'points', label: 'Details', kind: 'textarea', max: 600, hint: 'One per line.' },
    ],
  },
  {
    id: 'steps',
    label: 'How you work',
    kind: 'repeat',
    section: 'design',
    maxItems: 4,
    noun: 'Step',
    add: 'Add a step',
    designs: ['noor', 'leah'],
    parts: [
      { id: 'title', label: 'Step', kind: 'text', max: 40, hint: 'For example: Listen.' },
      { id: 'text', label: 'What happens', kind: 'textarea', max: 300 },
    ],
  },
  {
    id: 'faqs',
    label: 'Questions people ask you',
    kind: 'repeat',
    section: 'design',
    maxItems: 6,
    noun: 'Question',
    add: 'Add a question',
    designs: ['leah'],
    parts: [
      { id: 'question', label: 'Question', kind: 'text', max: 160 },
      { id: 'answer', label: 'Your answer', kind: 'textarea', max: 600 },
    ],
  },
  {
    id: 'anything',
    label: 'Anything else we should know',
    kind: 'textarea',
    section: 'more',
    max: 3000,
  },
  {
    id: 'consent',
    label: 'Everything I’ve given is mine or I have permission to use it, and it’s accurate.',
    kind: 'consent',
    section: 'send',
    required: true,
  },
];

export type RequestAnswers = Record<string, unknown>;

const maxOf = (f: { kind: string; max?: number }) =>
  f.max ?? (f.kind === 'textarea' ? 2000 : f.kind === 'url' ? 300 : 200);

function clean(value: unknown, kind: string): string {
  if (typeof value !== 'string') return '';
  const text =
    kind === 'textarea'
      ? // Removing control characters is the point (text areas keep line breaks).
        // eslint-disable-next-line no-control-regex
        value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      : // eslint-disable-next-line no-control-regex
        value.replace(/[\u0000-\u001f\u007f]+/g, ' ');
  return text.trim();
}

const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Cleans answers: unknown keys dropped, text trimmed and capped. `errors` lists text over its limit,
 * a bad email or link, and, when `sending`, required fields left empty.
 */
export function validateRequest(
  raw: unknown,
  { sending = false }: { sending?: boolean } = {},
): { answers: RequestAnswers; errors: Record<string, string> } {
  const input =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as RequestAnswers) : {};
  const answers: RequestAnswers = {};
  const errors: Record<string, string> = {};
  for (const field of requestFields) {
    const value = input[field.id];
    if (field.kind === 'consent') {
      if (value === true) answers[field.id] = true;
    } else if (field.kind === 'image') {
      if (typeof value === 'string' && FILE_ID.test(value)) answers[field.id] = value;
    } else if (field.kind === 'repeat') {
      if (Array.isArray(value)) {
        const entries = value
          .slice(0, field.maxItems ?? 10)
          .map((entry) => {
            const out: Record<string, string | boolean> = {};
            for (const part of field.parts ?? []) {
              const v = (entry as Record<string, unknown> | null)?.[part.id];
              if (part.kind === 'check') {
                if (v === true) out[part.id] = true;
              } else if (part.kind === 'image') {
                if (typeof v === 'string' && FILE_ID.test(v)) out[part.id] = v;
              } else {
                let text = clean(v, part.kind);
                if (part.kind === 'month' && text && !MONTH.test(text)) text = '';
                if (text.length > maxOf(part))
                  errors[field.id] = `Please keep “${part.label}” under ${maxOf(part)} characters.`;
                if (text) out[part.id] = text.slice(0, maxOf(part));
              }
            }
            return out;
          })
          .filter((e) => Object.keys(e).some((k) => k !== 'current' && k !== 'image'));
        if (entries.length) answers[field.id] = entries;
      }
    } else {
      let text = clean(value, field.kind);
      if (text.length > maxOf(field)) {
        errors[field.id] = `Please keep this under ${maxOf(field)} characters.`;
        text = text.slice(0, maxOf(field));
      }
      if (text && field.kind === 'email' && !EMAIL.test(text))
        errors[field.id] = 'Please check this email address.';
      if (text && field.kind === 'url' && !/^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(text)) {
        errors[field.id] = 'Please check this link.';
      }
      if (text) answers[field.id] = text;
    }
    if (sending && field.required && answers[field.id] === undefined) {
      errors[field.id] =
        field.kind === 'consent' ? 'Please tick this to send.' : 'Please fill this in.';
    }
  }
  return { answers, errors };
}

/** One answer as plain text, for the studio's email and the admin page. */
export function requestAnswerText(field: RequestField, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (field.kind === 'consent') return value === true ? 'Yes' : '';
  if (field.kind === 'image') return 'A picture (in the files)';
  if (field.kind === 'repeat' && Array.isArray(value)) {
    return value
      .map((entry, i) => {
        const e = entry as Record<string, string | boolean>;
        const parts = (field.parts ?? [])
          .filter((p) => e[p.id] !== undefined && p.kind !== 'check')
          .map((p) => (p.kind === 'image' ? `${p.label}: in the files` : `${p.label}: ${e[p.id]}`));
        if (e.current) parts.push('Current');
        return `${i + 1}. ${parts.join(' · ')}`;
      })
      .join('\n');
  }
  return String(value);
}
