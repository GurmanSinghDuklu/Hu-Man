/**
 * Before and after concepts for /business-websites/ (Gurman adds these). Each pairs a business's
 * current-style site with the right-fit rebuild. Label them just "Concept" (hard rule 1), use
 * `.example` domains, no invented reviews, ratings or results. The page shows the concepts section
 * only once this list has an entry.
 */
import type { ImageMetadata } from 'astro';
import ellie from '../assets/portfolio-concepts/ellie.jpg';
import offcut from '../assets/portfolio-concepts/offcut.jpg';
import ember from '../assets/portfolio-concepts/ember.jpg';
import plump from '../assets/portfolio-concepts/plump.jpg';
import fernlea from '../assets/portfolio-concepts/fernlea.jpg';
import linework from '../assets/portfolio-concepts/linework.jpg';

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
  {
    id: 'offcut',
    business: 'Creative design studio',
    fit: 'A small studio selling taste and process. So the site works like a short deck: what they do, how a project runs and sample work, with one clear way to start a project.',
    after: {
      src: offcut,
      alt: 'The Offcut Studio concept: a heavy black name on cream beside an orange and teal deck graphic, with Start a project and See sample work buttons.',
    },
    href: '/concepts/offcut/',
    hrefLabel: 'Open the concept',
  },
  {
    id: 'ember',
    business: 'Takeaway',
    fit: 'Hungry people on a phone want the menu, the hours and an order button. So the site is bold but short: dishes, how ordering works, when they are open and one big Order now.',
    after: {
      src: ember,
      alt: 'The Ember Street Kitchen concept: white and mint condensed capitals on black beside a violet ESK monogram, with a mint Order now button.',
    },
    href: '/concepts/ember/',
    hrefLabel: 'Open the concept',
  },
  {
    id: 'plump',
    business: 'Bakery and cake shop',
    fit: 'A local bakery with a big personality. So the name is huge and friendly, then the useful parts: what is baked each day, how to order a cake and how much notice it needs.',
    after: {
      src: plump,
      alt: 'The Plump Bakehouse concept: huge pale pink PLUMP letters on deep red beside a drawn celebration cake, with How to order a cake and See the price list buttons.',
    },
    href: '/concepts/plump/',
    hrefLabel: 'Open the concept',
  },
  {
    id: 'fernlea',
    business: 'Dental practice',
    fit: 'Many patients arrive nervous. So the site is calm and plain: what each treatment is, what happens on a first visit, how to get there and a clear Book an appointment button.',
    after: {
      src: fernlea,
      alt: 'The Fernlea Dental concept: Dental care at a calmer pace in a cream serif on forest green, beside an arched FD monogram and a Book an appointment button.',
    },
    href: '/concepts/fernlea/',
    hrefLabel: 'Open the concept',
  },
  {
    id: 'linework',
    business: 'Architecture practice',
    fit: 'People planning an extension want to see the work and know the steps. So the site is a clean drawing-board grid: sample projects, the four stages from brief to build, and a free first chat.',
    after: {
      src: linework,
      alt: 'The Linework Architects concept: Room to draw it better in black and emerald on cream beside a cut-paper LW monogram, with a Book a free first chat button.',
    },
    href: '/concepts/linework/',
    hrefLabel: 'Open the concept',
  },
];
