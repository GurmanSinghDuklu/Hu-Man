/**
 * Copy for the repeatable list/table sections of the home page, taken
 * verbatim from docs/03-site-spec.md. Edit that doc first if the copy
 * changes, then mirror it here.
 */

export interface Service {
  title: string;
  description: string;
}

export const services: Service[] = [
  {
    title: 'Website redesign and launch',
    description:
      'Fast, mobile-first sites for businesses stuck on old or unloved Squarespace, Wix or WordPress setups. Moves your content and redirects your old addresses so you keep the search rankings you have earned.',
  },
  {
    title: 'Booking and online payments',
    description:
      'Customers book, pay a deposit or order straight from your site through providers such as Stripe, Square and SumUp. Card details never touch my code.',
  },
  {
    title: 'AI enquiry assistant',
    description:
      'Answers questions from your own prices, hours and FAQs at any time, collects details and hands over to you. I test it against real questions before launch.',
  },
  {
    title: 'Local and AI-search visibility',
    description:
      'Google Business Profile, service pages, reviews and structured data, plus a monthly check on whether Google and ChatGPT mention you. Nobody can promise placement in AI answers, so I focus on the fundamentals Google says matter.',
  },
  {
    title: 'Automations',
    description:
      'Missed-call text-back, quote follow-ups, payment reminders and a weekly summary of what needs your attention.',
  },
  {
    title: 'Care plans',
    description: 'Hosting, updates, backups and small edits every month.',
  },
];

export interface ProcessStep {
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    title: 'Free presence audit',
    description:
      'I review your site on a phone, your speed, your Google Business Profile, your reviews and whether Google and ChatGPT recommend you.',
  },
  {
    title: 'Concept',
    description: 'You see a mock-up of your new site before any build starts.',
  },
  {
    title: 'Build and test',
    description: 'I build it and test it on real phones.',
  },
  {
    title: 'Launch',
    description: 'Your old addresses are redirected, and I hand over with a short video.',
  },
  {
    title: 'Grow',
    description: 'Reviews, visibility and automations, month by month.',
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'How much does a website cost?',
    answer:
      'Introductory prices start at £1,125 for a redesign and £2,100 with online booking and an AI enquiry assistant. You get a fixed quote after a free call.',
  },
  {
    question: 'Will I lose my Google rankings if you move me off Squarespace?',
    answer:
      'I keep your page addresses where possible and redirect any that change, then check them after launch. No migration can promise identical rankings, but this protects what you have earned.',
  },
  {
    question: 'Can you get me into Google AI Overviews or ChatGPT recommendations?',
    answer:
      'No one can guarantee that. Google says the same fundamentals apply as for search: pages that are indexed and helpful, plus a strong reputation. I set those up, then check monthly whether you appear and report the result.',
  },
  {
    question: "Is an AI assistant safe for my customers' data?",
    answer:
      'It only uses the information you give it, tells people they are talking to an assistant, hands over to you when unsure, and is set up to collect as little personal data as needed. I explain which providers process data before launch.',
  },
  {
    question: 'How long does a project take?',
    answer:
      'Typically two to three weeks for Launch and four to six for Growth, depending on how quickly you send content.',
  },
  {
    question: 'Do I own my website?',
    answer:
      'Yes. After final payment the site and content are yours, and your domain and accounts stay in your name.',
  },
  {
    question: 'Where do you work?',
    answer:
      "I'm based in Bradford and meet in person across West Yorkshire, including Leeds, Halifax, Huddersfield, Keighley, Shipley, Bingley and Ilkley. I also work remotely across the UK.",
  },
];

export interface RealProject {
  name: string;
  description: string;
  href?: string;
}

export const realProjects: RealProject[] = [
  {
    name: 'Essence Hair Treatment',
    description: 'Live React website, built for a family business.',
    href: 'https://essencehairtreatment.com',
  },
  {
    name: 'Arm Learning Paths',
    description: 'macOS setup guide for the "AI Agent on CPU" path, submitted as a pull request.',
  },
  {
    name: 'Lloyds Banking Group placement',
    description: 'Live mortgage web pages built in a React and TypeScript Agile team.',
  },
];

export interface Credential {
  text: string;
  inProgress?: boolean;
}

export const credentials: Credential[] = [
  { text: 'T Level in Digital Production, Design and Development (Pass), Calderdale College' },
  {
    text: 'Industry placement, Lloyds Banking Group, 2024: built and shipped two live mortgage web pages with TypeScript and React inside Agile sprints',
  },
  { text: 'CS50x: Introduction to Computer Science, Harvard University (edX), completed' },
  { text: 'PCEP: Python Certified Entry-Level Programmer (active)' },
  {
    text: 'Open source: macOS/Apple Silicon setup section for Arm\'s "AI Agent on CPU" Learning Path, submitted as a pull request',
  },
  {
    text: 'FinBERT financial sentiment analysis (2025): fine-tuned BERT-based model with Hugging Face and PyTorch',
  },
  {
    text: 'Spring Boot REST API test-automation project (2026): CRUD service with MongoDB, Docker, automated API tests, CI in Azure DevOps and GitHub Actions',
  },
  { text: 'Essence Hair Treatment website (2026): live React website built for a family business' },
  { text: 'Claude Certified Architect, Foundations', inProgress: true },
  { text: 'AWS Cloud Practitioner Essentials (self-study)', inProgress: true },
  { text: 'Azure DevOps for CI/CD (self-study)', inProgress: true },
  { text: 'C++ Foundations (Udemy)' },
  { text: 'COBOL Basics (IBM, 2026)' },
];
