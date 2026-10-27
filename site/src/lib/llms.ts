/**
 * The text of /llms.txt and /llms-full.txt (the llmstxt.org format): a plain Markdown account of
 * the studio for AI tools, built from the same data as the pages so it can never say something the
 * site doesn't. llms.txt is the short guide with links; llms-full.txt has every fact in one file.
 */
import { site } from '../config/site';
import { withBase } from '../config/paths';
import { pages, tierCount, type PageKey } from '../data/pages';
import { serviceAreas } from '../data/services';
import { tiers, addOns, fromPrice, priceOf } from '../data/pricing';
import { faq, agenticFaq, checkFaq } from '../data/faq';
import { definition, ingredients } from '../data/agentic';
import { stages, checklist, compare, bonnet } from '../data/process';
import { projects } from '../data/projects';
import { mission, rules, promises } from '../data/about';

const abs = (path: string) => new URL(withBase(path), site.url).toString();
const plus = (text: string) => text.replace(/\s\+\s/g, ' and ');
const link = (key: PageKey) => `[${pages[key].label}](${abs(pages[key].path)})`;

const summary = `${site.fullName} is a software studio in ${site.location.town}, ${site.location.region}, UK. It designs and builds websites, e-commerce stores, mobile apps and custom software for individuals and small businesses, and looks after them after launch. Every site from the ${priceOf('spark')} Spark tier up is agentic AI-ready as standard: fast, secure, and structured so people, search engines and AI agents can read it and act on it. A real person works with each client from the first call to long after launch.`;

const keyFacts = [
  `Name: ${site.fullName} (also written ${site.alternateNames.join(', ')})`,
  `Based in: ${site.location.town}, ${site.location.region}, United Kingdom (a service-area business; no public street address)`,
  'Works: in person in Leeds and West Yorkshire, remotely across the UK and worldwide',
  `Founded: ${site.founded}`,
  `Website prices: from ${fromPrice} to ${priceOf('full-presence')} in ${tierCount} fixed tiers; custom apps and portals priced on application`,
  `Contact: ${site.contact.email}, ${site.contact.phone}, WhatsApp ${site.contact.whatsapp}`,
  `Instagram: ${site.contact.instagram}`,
  'Free offer: a free AI check of an existing website, reviewed by a person, with a reply within 48 hours',
];

const pageKeys: PageKey[] = [
  'index',
  'services',
  'pricing',
  'agentic-ai-ready',
  'free-ai-check',
  'how-we-build',
  'work',
  'about',
  'contact',
];

/** How a person or an AI agent can make an enquiry without a mail app. */
const actions = () => [
  `- Send an enquiry: POST ${abs('/api/enquiry')} with JSON or form fields name, email and message (optional: topic, website, phone, tier). topic is one of ai-check, website, idea, tier, other; for ai-check, website is required and message is optional. A person reads every enquiry and replies by email. GET the same URL for the full field list.`,
  `- Ask for a free AI check: the same endpoint with topic "ai-check" and website, or the form at ${abs('/free-ai-check/')}.`,
  `- Contact page with a form, phone, WhatsApp and email: ${abs('/contact/')}`,
];

export function llmsTxt(): string {
  return [
    `# ${site.fullName}`,
    '',
    `> ${summary}`,
    '',
    ...keyFacts.map((fact) => `- ${fact}`),
    '',
    '## Pages',
    '',
    ...pageKeys.map(
      (key) =>
        `- ${link(key)}: ${pages[key].description} Markdown: ${abs(`${pages[key].path}index.html.md`)}`,
    ),
    '',
    '## Services',
    '',
    ...serviceAreas.map((area) => `- ${plus(area.title)}: ${area.short}`),
    '',
    '## Actions',
    '',
    ...actions(),
    '',
    '## Optional',
    '',
    `- [Full details for AI tools](${abs('/llms-full.txt')}): every service, price, build stage and answer, then the full text of every page, in one file`,
    `- ${link('privacy')}: no cookies and no tracking on this site`,
    '',
  ].join('\n');
}

export function llmsFullTxt(): string {
  const out: string[] = [
    `# ${site.fullName}`,
    '',
    `> ${summary}`,
    '',
    `Source: ${abs('/')}. Everything here is also on the website; prices are in pounds sterling (GBP) and are the current published prices.`,
    '',
    '## Key facts',
    '',
    ...keyFacts.map((fact) => `- ${fact}`),
    '',
    '## Actions',
    '',
    ...actions(),
    '',
    `## What is an agentic AI-ready website? (${link('agentic-ai-ready')})`,
    '',
    definition,
    '',
    'What it takes:',
    '',
    ...ingredients.map((item, i) => `${i + 1}. ${item.title}: ${item.text}`),
    '',
    `Every website from the ${priceOf('spark')} Spark tier up is agentic AI-ready as standard; the ${fromPrice} Essential tier is a standard website without it.`,
    '',
    ...agenticFaq.flatMap((item) => [`### ${item.q}`, '', item.a, '']),
    `## Free AI check (${link('free-ai-check')})`,
    '',
    'A free, no-obligation check, done by a person, of whether ChatGPT, Perplexity, Gemini, Claude, Copilot and Google’s AI Overviews recommend a business for its main search, who they recommend instead, whether AI crawlers can reach the site, whether its facts are clear and machine-readable, mobile speed and security basics. The findings and what to fix first come back by email within 48 hours.',
    '',
    ...checkFaq.flatMap((item) => [`### ${item.q}`, '', item.a, '']),
    '## About',
    '',
    `Our mission: give everyone, from sole traders to growing businesses, high-performing software and the kind of care you only get from a person who knows the project. AI helps us build faster. People make sure it’s right. (${link('about')})`,
    '',
    ...mission.map((m) => `- ${m.title}: ${m.text}`),
    '',
    '### Four rules we build by',
    '',
    ...rules.map((r) => `- ${r.title}: ${r.text}`),
    '',
    '### Our promise: if we get it wrong, we put it right',
    '',
    ...promises.map((p) => `- ${p.title}: ${p.text}`),
    '',
    `## Services (${link('services')})`,
    '',
    'Projects are paid once and the client owns them. Ongoing work marked "care plan" is covered by a monthly care plan.',
    '',
  ];
  for (const area of serviceAreas) {
    out.push(`### ${plus(area.title)}`, '', area.short, '');
    for (const item of area.items) out.push(`- ${item.text}${item.care ? ' (care plan)' : ''}`);
    out.push('');
  }
  out.push(
    `## Pricing (${link('pricing')})`,
    '',
    'Pay once. Every tier includes a person from first call to launch, three revision rounds and full ownership. Move up a tier any time and only pay the difference.',
    '',
    '| Tier | Price | What is included |',
    '| --- | --- | --- |',
    ...tiers.map(
      (t) =>
        `| ${t.name} | ${t.price === 'POA' ? 'Price on application' : t.price} | ${t.includes.replace(/ · /g, '; ')} |`,
    ),
    '',
    `Add-ons: ${addOns.join('; ')}.`,
    '',
    'Monthly care plans (hosting, security, backups, updates, small fixes and support) are being reworked; the current draft prices are on the pricing page.',
    '',
    `## How we build (${link('how-we-build')})`,
    '',
    'Six stages. A person signs off each one.',
    '',
    ...stages.map((s, i) => `${i + 1}. ${plus(s.title)}: ${s.text}`),
    '',
    '### What is under the bonnet',
    '',
    ...bonnet.map((b) => `- ${b.title}: ${b.text}`),
    '',
    '### Every site passes this checklist before go-live (checked by a person, not just automated)',
    '',
    ...checklist.map((c) => `- ${c}`),
    '',
    '### One-prompt AI site compared with a Hu/man build',
    '',
    ...compare.map(
      ([what, prompt, us]) =>
        `- ${plus(what)}: a one-prompt site is "${prompt}"; a Hu/man build is "${us}".`,
    ),
    '',
    'AI tools are useful, and we use them too. The difference is the work around them. No one can guarantee a place in AI answers; we do the groundwork properly.',
    '',
    `## Our work (${link('work')})`,
    '',
    ...projects.map(
      (p) =>
        `- ${p.name}${p.url ? ` (${p.url})` : ''}: ${p.summary} ${p.live ? 'Live.' : 'Concept design, not live.'}`,
    ),
    '',
    '## Frequently asked questions',
    '',
  );
  for (const item of faq) out.push(`### ${item.q}`, '', item.a, '');
  out.push(
    '## Contact',
    '',
    `- Email: ${site.contact.email}`,
    `- Phone: ${site.contact.phone}`,
    `- WhatsApp: ${site.contact.whatsapp}`,
    `- Instagram: ${site.contact.instagram}`,
    `- Website: ${abs('/')}`,
    '',
  );
  return out.join('\n');
}
