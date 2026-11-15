/**
 * The "CVs and applicant tracking systems" section on /portfolio/ (draft copy, 2026-11-15).
 * Honesty rules (docs/02, CLAUDE.md): never promise jobs, interviews, an ATS score or "ATS-proof".
 * Only offer what docs/02 prices: the PDF CV in every tier and the CV rewrite add-on.
 */
import { cvRewrite } from './pricing';

export const ats = {
  label: 'CVs and applicant tracking systems',
  title: 'Read by software first. Then by a person.',
  text: [
    'Many employers run CVs through an applicant tracking system (ATS) before anyone reads them. The software pulls your CV apart as plain text, so a CV that looks good can come through as a jumble, and the words it is looking for can go missing.',
    'There is no single “ATS score”. Every employer’s system and every online checker works differently, so the aim is a CV any of them can read, and that still reads well to a person.',
  ],
  tripsTitle: 'What usually trips it up',
  trips: [
    {
      title: 'Layouts it can’t read',
      text: 'Columns, tables, text boxes, and words inside images or graphics.',
    },
    {
      title: 'Missing words',
      text: 'The skills and job titles in the advert, written differently or not at all.',
    },
    {
      title: 'Odd headings and files',
      text: 'Creative section names, or a file the system can’t open.',
    },
  ],
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
