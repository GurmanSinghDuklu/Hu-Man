/**
 * Before and after concepts for /business-websites/ (Gurman adds these). Each pairs a business's
 * current-style site with the right-fit rebuild. Label them just "Concept" (hard rule 1), use
 * `.example` domains, no invented reviews, ratings or results. The page shows the "Before and
 * after" section only for entries with a real `before`. Concepts without one go on the live wall
 * instead (`businessSiteConcepts` in portfolioConcepts.ts), as the six business concepts do.
 */
import type { ImageMetadata } from 'astro';

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

export const businessConcepts: BusinessConcept[] = [];
