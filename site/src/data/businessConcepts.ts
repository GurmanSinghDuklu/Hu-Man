/**
 * Before and after concepts for /business-websites/ (Gurman adds these). Each pairs a business's
 * current-style site with the right-fit rebuild. Label them just "Concept" (hard rule 1), use
 * `.example` domains, no invented reviews, ratings or results. The page shows the concepts section
 * only once this list has an entry.
 */
export interface BusinessConcept {
  id: string;
  /** Kind of business, e.g. "Independent garage". Not a real client. */
  business: string;
  /** One plain sentence: what fit means for this business. */
  fit: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
}

export const businessConcepts: BusinessConcept[] = [];
