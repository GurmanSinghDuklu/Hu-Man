/**
 * The concept portfolio sites on /portfolio (each lives in public/concepts/<slug>/).
 * All are concepts for fictional people. The line under each name says only what the page shows:
 * no results, no clients, no awards. Order here is the order on the wall.
 *
 * `device` picks how the live tile shows it: 'desktop' renders the page at 1440x900, 'phone' at
 * 390x844 inside a phone frame. Posters come from `npm run concept-posters` (src/assets/portfolio-concepts/).
 */
export interface PortfolioConcept {
  slug: string;
  name: string;
  /** Role and city of the person shown. */
  role: string;
  /** Short job label for the filter chips. */
  field:
    | 'Creative'
    | 'Tech'
    | 'Operations'
    | 'Trades'
    | 'Care'
    | 'Hospitality'
    | 'Finance'
    | 'Graduate'
    | 'Marketing'
    | 'Engineering'
    | 'Pets';
  /** One factual line about what the page shows. */
  shows: string;
  /** Alt text for the poster: what is in the picture. */
  alt: string;
  /** The fictional address shown in the tile's browser bar. */
  domain: string;
  device: 'desktop' | 'phone';
}

export const portfolioConceptsIntro = {
  label: 'Concept portfolios',
  title: 'The level we build to.',
  text: 'Not just for designers. Portfolio sites for every kind of job, each designed around the person, not a template. Move your mouse over any of them: they are running live.',
  /** Shown on every card. */
  note: 'Concept',
  linkText: 'View the concept',
  staticNote: 'Showing still previews. Open any concept to see it move.',
  /** The last tile on the wall: a call to start your own. */
  next: {
    label: 'Your page',
    title: 'Yours next.',
    text: 'Tell us what you do. On a free 1-hour call we sketch the page that shows it, then build it.',
    button: 'Book a free 1-hour call',
  },
};

export const portfolioConcepts: PortfolioConcept[] = [
  {
    slug: 'priya',
    name: 'Priya Nair',
    role: 'Operations manager, Leeds',
    field: 'Operations',
    shows:
      'A dot that follows your cursor, and a pinned "I run…" section that changes colour as you scroll.',
    alt: 'The Priya Nair concept portfolio: her name in a huge serif on warm paper, with a coloured dot as the full stop.',
    domain: 'priyanair.example',
    device: 'desktop',
  },
  {
    slug: 'noor',
    name: 'Noor Haddad',
    role: 'Product and UX designer, Leeds',
    field: 'Creative',
    shows: 'Fanned app-screen cards that re-deal on hover.',
    alt: 'The Noor Haddad concept portfolio: her name in huge black capitals over four fanned phone screens in blue, yellow, grey and green.',
    domain: 'noorhaddad.example',
    device: 'desktop',
  },
  {
    slug: 'chloe',
    name: 'Chloe Park',
    role: 'Marketing executive, Manchester',
    field: 'Marketing',
    shows:
      'A video inside the headline that grows to full screen, and skill tiles that fall and pile up.',
    alt: 'The Chloe Park concept portfolio: a huge white headline on black with a small video playing inside one line.',
    domain: 'chloepark.example',
    device: 'desktop',
  },
  {
    slug: 'dan',
    name: 'Dan Okafor',
    role: 'Construction site manager, Bradford',
    field: 'Trades',
    shows: 'Giant outline menu words that fill in and change the moving site scene behind them.',
    alt: 'The Dan Okafor concept portfolio: a duotone construction scene behind his name and huge outlined menu words.',
    domain: 'danokafor.example',
    device: 'desktop',
  },
  {
    slug: 'sofia',
    name: 'Sofia Marín',
    role: 'Travel consultant, Manchester',
    field: 'Hospitality',
    shows:
      'A real window seat with a plane passing, then a split-flap departures board of her trips.',
    alt: 'The Sofia Marín concept portfolio: the view from an aircraft window seat, a distant plane leaving a contrail.',
    domain: 'sofiamarin.example',
    device: 'desktop',
  },
  {
    slug: 'ellie',
    name: 'Ellie Brooks',
    role: 'Dog walker and pet sitter, Harrogate',
    field: 'Pets',
    shows: "Throw a ball to get in, then a dog's red lead draws itself down the page.",
    alt: 'The Ellie Brooks concept portfolio: tomato-red capitals on cream above a hand-drawn scruffy dog holding a red lead.',
    domain: 'elliebrooks.example',
    device: 'phone',
  },
  {
    slug: 'maya',
    name: 'Maya Okonkwo',
    role: 'Short-form video creator, London',
    field: 'Creative',
    shows: 'Short-video reels in phone frames, and service stickers you can drag around.',
    alt: 'The Maya Okonkwo concept portfolio: her name in chunky teal letters with a pink shadow beside three phone frames on pink and yellow shapes.',
    domain: 'mayaokonkwo.example',
    device: 'phone',
  },
  {
    slug: 'ryan',
    name: 'Ryan Holt',
    role: 'Vehicle technician, Wakefield',
    field: 'Trades',
    shows: 'A 3D brake assembly that turns under a moving light and tilts with your cursor.',
    alt: 'The Ryan Holt concept portfolio: a black and grey page with a 3D-shaded mechanical part under hard light.',
    domain: 'ryanholt.example',
    device: 'desktop',
  },
  {
    slug: 'marcus',
    name: 'Marcus Reid',
    role: 'Mechanical design engineer, Rotherham',
    field: 'Engineering',
    shows:
      'A spinning red-and-white 3D sphere on a red circle that travels from section to section.',
    alt: 'The Marcus Reid concept portfolio: his name in black beside a red-and-white ribbon sphere on a big red circle.',
    domain: 'marcusreid.example',
    device: 'desktop',
  },
  {
    slug: 'grace',
    name: 'Grace Whitfield',
    role: 'Nurse educator, Sheffield',
    field: 'Care',
    shows: 'A heartbeat line behind her name, then panels rising over one bold band of colour.',
    alt: 'The Grace Whitfield concept portfolio: her name in white capitals over a deep colour field with a heartbeat line.',
    domain: 'gracewhitfield.example',
    device: 'desktop',
  },
  {
    slug: 'hannah',
    name: 'Hannah Cole',
    role: 'Bookkeeper, York',
    field: 'Finance',
    shows: 'A bookcase where every book is a past job: pull one out and it opens on that chapter.',
    alt: 'The Hannah Cole concept portfolio: a lamp-lit bookcase at night, each book spine named after a workplace.',
    domain: 'hannahcole.example',
    device: 'desktop',
  },
  {
    slug: 'leah',
    name: 'Leah Morgan',
    role: 'Project manager, Bristol',
    field: 'Operations',
    shows: 'A looping project timeline in the hero, and a contact area you can click anywhere on.',
    alt: 'The Leah Morgan concept portfolio: bold black capitals on pale grey beside an animated project timeline.',
    domain: 'leahmorgan.example',
    device: 'desktop',
  },
  {
    slug: 'theo',
    name: 'Theo Lindqvist',
    role: 'Backend and platform engineer, Manchester',
    field: 'Tech',
    shows: 'A map drawn in text characters that parts around your cursor.',
    alt: 'The Theo Lindqvist concept portfolio: his name in large pale capitals on a dark page, over a map drawn in grey and amber text characters.',
    domain: 'theolindqvist.example',
    device: 'desktop',
  },
  {
    slug: 'kai',
    name: 'Kai Thompson',
    role: 'Restaurant general manager, Liverpool',
    field: 'Hospitality',
    shows:
      'Four shapes for four strengths that regroup as you scroll, and venue panels that unfold into a carousel.',
    alt: 'The Kai Thompson concept portfolio: a dark grainy page with a big centred headline over a giant K and four coloured shapes.',
    domain: 'kaithompson.example',
    device: 'desktop',
  },
  {
    slug: 'tom',
    name: 'Tom Ashworth',
    role: 'UX design student, Leeds',
    field: 'Graduate',
    shows: 'Full-screen black-and-white projects that slice apart as you move between them.',
    alt: 'The Tom Ashworth concept portfolio: a dark full-screen black-and-white photo with a large project title and a 01 / 06 counter.',
    domain: 'tomashworth.example',
    device: 'desktop',
  },
  {
    slug: 'amira',
    name: 'Amira Hussain',
    role: 'Biomedical science graduate, Nottingham',
    field: 'Graduate',
    shows:
      'A striped monogram that bends to your cursor, and a skills finder that re-sorts itself.',
    alt: 'The Amira Hussain concept portfolio: a striped AH monogram beside colour-coded skill chips.',
    domain: 'amirahussain.example',
    device: 'desktop',
  },
];
