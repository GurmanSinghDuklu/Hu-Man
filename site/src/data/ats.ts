/**
 * The "CVs and applicant tracking systems" section on /portfolio/ (draft copy, 2026-11-15; the
 * three-stage guide is Gurman's content, reworded, 2026-11-16).
 * Honesty rules (docs/02, CLAUDE.md): never promise jobs, interviews, an ATS score or "ATS-proof".
 * Only offer what docs/02 prices: the PDF CV in every tier and the CV rewrite add-on.
 */
import { cvRewrite } from './pricing';

export const ats = {
  label: 'CVs and applicant tracking systems',
  title: 'Read by software first. Then by a person.',
  text: [
    'Many employers run CVs through an applicant tracking system (ATS) before a person sees them. It usually does three things: turns your CV into plain text, scores it against the words in the job advert, and, in newer systems, looks at how you used each skill. A CV that looks good can come through as a jumble, and the words it is looking for can go missing.',
    'There is no single “ATS score”. Every employer’s system and every online checker works differently, so the aim is a CV any of them can read, and that still reads well to a person.',
  ],
  guideTitle: 'How to get your CV through all three',
  stages: [
    {
      stage: 'Reading it',
      title: 'Keep the layout simple',
      tips: [
        {
          title: 'One column',
          text: 'Tables, text boxes, side-by-side columns, graphics and icons can scramble the order your CV is read in once it’s turned into plain text.',
        },
        {
          title: 'Standard headings',
          text: 'Call your sections Summary, Work experience, Skills and Education, not creative alternatives.',
        },
        {
          title: 'Contact details in the page itself',
          text: 'Put your name, phone number, email and location at the top of the page, never in the header or footer: many systems skip those.',
        },
        {
          title: 'The right file',
          text: 'Send a .docx unless the advert asks for a PDF. If you do send a PDF, make it a normal one with real text, never a scan or an image.',
        },
      ],
    },
    {
      stage: 'Matching it',
      title: 'Use the advert’s own words',
      tips: [
        {
          title: 'The exact phrasing',
          text: 'Use the job titles, software and hard skills exactly as the advert writes them. If it says “stakeholder engagement”, write that, not “stakeholder management”.',
        },
        {
          title: 'The term and its short form',
          text: 'The first time you use one, write both: “Know Your Customer (KYC)”, “search engine optimisation (SEO)”. Then a search for either finds you.',
        },
        {
          title: 'Spread them naturally',
          text: 'Work your main skills into your summary, your skills list and your experience bullet points, rather than piling them into one block.',
        },
      ],
    },
    {
      stage: 'Weighing it',
      title: 'Back every skill with a result',
      tips: [
        {
          title: 'Skills with outcomes',
          text: 'Newer screening systems look at how and where you used a skill, not just how many times the word appears.',
        },
        {
          title: 'Action + skill + number',
          text: 'Swap lists of duties for proof of what changed. For example: “Automated compliance reporting using Python, cutting weekly audit processing time by 40%.”',
        },
      ],
    },
  ],
  check: {
    title: 'Last check: the plain-text test',
    text: 'Before you send it, copy your whole CV into Notepad or TextEdit. If the text runs in the order a person would read it, with no lines missing, an ATS will most likely read it cleanly too.',
  },
  offers: [
    {
      tag: 'In every tier',
      title: 'A CV software can read',
      text: 'Your downloadable PDF CV comes in a plain one-column layout with standard headings (Experience, Education, Skills) and real text, not images.',
    },
    {
      tag: `Add-on · ${cvRewrite.price}`,
      title: 'A CV rewrite for the roles you want',
      text: 'We rewrite your CV to match your site and the jobs you are applying for, using the words those adverts use, honestly and without keyword stuffing.',
    },
    {
      tag: 'Your portfolio',
      title: 'Somewhere to send the person',
      text: 'Once a person picks up your CV, your portfolio shows the work behind it. We put its link at the top of your CV.',
    },
  ],
  note: 'We don’t promise an ATS score, interviews or jobs. Every system is different, and the decision is always a person’s.',
  button: 'Ask about a CV rewrite',
};
