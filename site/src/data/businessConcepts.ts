/**
 * Before and after concepts for /business-websites/ (Gurman adds these). Each pairs a business's
 * current-style site with the right-fit rebuild. Label them just "Concept" (hard rule 1), use
 * `.example` domains, no invented reviews, ratings or results. The page shows the concepts section
 * only once this list has an entry.
 */
import type { ImageMetadata } from 'astro';
import ellie from '../assets/portfolio-concepts/ellie.jpg';

export interface BusinessConcept {
  id: string;
  /** Kind of business, e.g. "Independent garage". Not a real client. */
  business: string;
  /** One plain sentence: what fit means for this business. */
  fit: string;
  /** The current-style site. Leave out until there is a real before to show. */
  before?: { src: ImageMetadata; alt: string };
  after: { src: ImageMetadata; alt: string };
  /** Page to open the live concept, from the site root (e.g. /concepts/ellie/). */
  href?: string;
  hrefLabel?: string;
}

export const businessConcepts: BusinessConcept[] = [
  {
    id: 'dog-walker',
    business: 'Dog walker and pet sitter',
    fit: 'A small, friendly business that needs to feel trustworthy and easy to book. So the site is warm, quick and simple, with one playful touch (throw a ball to get in) and nothing heavier.',
    after: {
      src: ellie,
      alt: 'The dog walker concept on a phone: a dark green Long walks. Muddy paws. Happy dogs. headline on cream, a lime booking button and a hand-drawn scruffy dog.',
    },
    href: '/concepts/ellie/',
    hrefLabel: 'Open the concept',
  },
];
