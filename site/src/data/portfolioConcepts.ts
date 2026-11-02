/**
 * The three concept portfolio sites on /portfolio (they live in public/concepts/<slug>/).
 * All three are fictional people. The line under each name says only what the page shows: no
 * results, no clients, no awards. Order here is the order on the page: Noor, Theo, Maya.
 */
export interface PortfolioConcept {
  slug: 'noor' | 'theo' | 'maya';
  name: string;
  /** Role and city of the fictional person. */
  role: string;
  /** One factual line about what the page shows. */
  shows: string;
  /** Alt text for the hero screenshot: what is in the picture. */
  alt: string;
}

export const portfolioConceptsIntro = {
  label: 'Concept portfolios',
  title: 'The level we build to.',
  text: 'Three concept portfolios for fictional people. Every Profile, Portfolio and Portfolio Pro site is designed around the person, not a template.',
  /** Shown on every card. */
  note: 'Concept design for a fictional person',
  linkText: 'View the concept',
};

export const portfolioConcepts: PortfolioConcept[] = [
  {
    slug: 'noor',
    name: 'Noor Haddad',
    role: 'Product and UX designer, Leeds',
    shows: 'Fanned app-screen cards that re-deal on hover.',
    alt: 'The Noor Haddad concept portfolio: her name in huge black capitals over four fanned phone screens in blue, yellow, grey and green.',
  },
  {
    slug: 'theo',
    name: 'Theo Lindqvist',
    role: 'Backend and platform engineer, Manchester',
    shows: 'A map drawn in text characters that parts around your cursor.',
    alt: 'The Theo Lindqvist concept portfolio: his name in large pale capitals on a dark page, over a map drawn in grey and amber text characters.',
  },
  {
    slug: 'maya',
    name: 'Maya Okonkwo',
    role: 'Short-form video creator, London',
    shows: 'Short-video reels in phone frames, and service stickers you can drag around.',
    alt: 'The Maya Okonkwo concept portfolio: her name in chunky teal letters with a pink shadow beside three phone frames on pink and yellow shapes.',
  },
];
