/**
 * The concept sites on the live walls (each lives in public/concepts/<slug>/): portfolios on
 * /portfolio, business sites (businessSiteConcepts, below) on /business-websites/.
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
    | 'Pets'
    | 'Sales'
    | 'Retail'
    | 'Food'
    | 'Health'
    | 'Beauty';
  /** One factual line about what the page shows. */
  shows: string;
  /** Alt text for the poster: what is in the picture. */
  alt: string;
  /** The fictional address shown in the tile's browser bar. */
  domain: string;
  device: 'desktop' | 'phone';
  /**
   * Set on designs that can be built instantly from a CV (worker/accounts/templates/): the pricing
   * tier (src/data/pricing.ts portfolioTiers) that "Pay now and publish" charges. Team's call.
   */
  instantTier?: 'Profile' | 'Portfolio';
}

export const portfolioConceptsIntro = {
  label: 'Portfolio designs',
  title: 'The level we build to.',
  text: 'Not just for designers. Portfolio sites for every kind of job, each designed around the person, not a template. Move your mouse over any of them: they are running live.',
  /** Shown on every card. */
  note: 'Concept',
  linkText: 'View the design',
  /** The cream button beside it: opens the contact form with this concept already chosen.
   *  null hides it (the business wall). */
  chooseText: 'Choose this design' as string | null,
  staticNote: 'Showing still previews. Open any design to see it move.',
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
    slug: 'imran',
    name: 'Imran Shah',
    role: 'Customer service team leader, Bradford',
    field: 'Operations',
    shows:
      'A scrapbook of speech bubbles and queue tickets, with moving type bands and a before-and-after script.',
    alt: 'The Imran Shah example portfolio: his name in chunky black type on sage dotted paper, with his photo in queue-ticket frames and tomato-red tags.',
    domain: 'imranshah.example',
    device: 'desktop',
  },
  {
    slug: 'lucia',
    name: 'Lucía Ferro',
    role: 'Sales account manager, Manchester',
    field: 'Sales',
    shows:
      'Giant italic type that slides as you scroll, a deal-stage pipeline and a pinned sideways run through her jobs.',
    alt: 'The Lucía Ferro example portfolio: ACCOUNTS in huge cream letters on aubergine beside a black and white cut-out portrait and tangerine bars.',
    domain: 'luciaferro.example',
    device: 'desktop',
  },
  {
    slug: 'ivy',
    name: 'Ivy Laurent',
    role: 'Payroll administrator, Brighton',
    field: 'Finance',
    shows:
      'A résumé laid out like a payslip: tear-off sections, pay-reference bands that scroll past and dials that fill.',
    alt: 'The Ivy Laurent example portfolio: IVY in huge white letters on navy over a coral RESUME block, beside a warm photo of her.',
    domain: 'ivylaurent.example',
    device: 'desktop',
  },
  {
    slug: 'nadia',
    name: 'Nadia Kerr',
    role: 'Data analyst, Leeds',
    field: 'Tech',
    shows:
      'A spreadsheet-style CV: a cell cursor that walks the cover, a ring chart that draws and cards that stack as you scroll.',
    alt: 'The Nadia Kerr example portfolio: .ANAL-YSIS in heavy black letters on a graph-paper grid with electric blue and mint panels.',
    domain: 'nadiakerr.example',
    device: 'desktop',
  },
  {
    slug: 'aiko',
    name: 'Aiko Tan',
    role: 'Facilities manager, Bristol',
    field: 'Operations',
    shows:
      'Building signage throughout: floor numbers, a directory board, an LED notice band and an exit sign.',
    alt: 'The Aiko Tan example portfolio: SPACES THAT WORK in black and orange capitals beside her portrait on a safety-orange panel.',
    domain: 'aikotan.example',
    device: 'desktop',
  },
  {
    slug: 'clara',
    name: 'Clara Voss',
    role: 'Store manager, York',
    field: 'Retail',
    shows:
      'A boutique look: her portrait in a shop-window arch, swing-tag project cards and a timeline printed like a receipt.',
    alt: 'The Clara Voss example portfolio: I run stores people love in cream and brass serif on navy beside her portrait in a brass arch.',
    domain: 'claravoss.example',
    device: 'desktop',
  },
  {
    slug: 'priya',
    name: 'Priya Nair',
    role: 'Operations manager, Leeds',
    field: 'Operations',
    shows:
      'A dot that follows your cursor, and a pinned "I run…" section that changes colour as you scroll.',
    alt: 'The Priya Nair example portfolio: her name in a huge serif on warm paper, with a coloured dot as the full stop.',
    domain: 'priyanair.example',
    device: 'desktop',
  },
  {
    slug: 'noor',
    instantTier: 'Profile',
    name: 'Noor Haddad',
    role: 'Product and UX designer, Leeds',
    field: 'Creative',
    shows: 'Fanned app-screen cards that re-deal on hover.',
    alt: 'The Noor Haddad example portfolio: her name in huge black capitals over four fanned phone screens in blue, yellow, grey and green.',
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
    alt: 'The Chloe Park example portfolio: a huge white headline on black with a small video playing inside one line.',
    domain: 'chloepark.example',
    device: 'desktop',
  },
  {
    slug: 'dan',
    name: 'Dan Okafor',
    role: 'Construction site manager, Bradford',
    field: 'Trades',
    shows: 'Giant outline menu words that fill in and change the moving site scene behind them.',
    alt: 'The Dan Okafor example portfolio: a duotone construction scene behind his name and huge outlined menu words.',
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
    alt: 'The Sofia Marín example portfolio: the view from an aircraft window seat, a distant plane leaving a contrail.',
    domain: 'sofiamarin.example',
    device: 'desktop',
  },
  {
    slug: 'ellie',
    name: 'Ellie Brooks',
    role: 'Dog walker and pet sitter, Harrogate',
    field: 'Pets',
    shows: "Throw a ball to get in, then a dog's red lead draws itself down the page.",
    alt: 'The Ellie Brooks example portfolio: tomato-red capitals on cream above a hand-drawn scruffy dog holding a red lead.',
    domain: 'elliebrooks.example',
    device: 'phone',
  },
  {
    slug: 'maya',
    name: 'Maya Okonkwo',
    role: 'Short-form video creator, London',
    field: 'Creative',
    shows: 'Short-video reels in phone frames, and service stickers you can drag around.',
    alt: 'The Maya Okonkwo example portfolio: her name in chunky teal letters with a pink shadow beside three phone frames on pink and yellow shapes.',
    domain: 'mayaokonkwo.example',
    device: 'phone',
  },
  {
    slug: 'ryan',
    name: 'Ryan Holt',
    role: 'Vehicle technician, Wakefield',
    field: 'Trades',
    shows: 'A 3D brake assembly that turns under a moving light and tilts with your cursor.',
    alt: 'The Ryan Holt example portfolio: a black and grey page with a 3D-shaded mechanical part under hard light.',
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
    alt: 'The Marcus Reid example portfolio: his name in black beside a red-and-white ribbon sphere on a big red circle.',
    domain: 'marcusreid.example',
    device: 'desktop',
  },
  {
    slug: 'grace',
    name: 'Grace Whitfield',
    role: 'Nurse educator, Sheffield',
    field: 'Care',
    shows: 'A heartbeat line behind her name, then panels rising over one bold band of colour.',
    alt: 'The Grace Whitfield example portfolio: her name in white capitals over a deep colour field with a heartbeat line.',
    domain: 'gracewhitfield.example',
    device: 'desktop',
  },
  {
    slug: 'hannah',
    name: 'Hannah Cole',
    role: 'Bookkeeper, York',
    field: 'Finance',
    shows: 'A bookcase where every book is a past job: pull one out and it opens on that chapter.',
    alt: 'The Hannah Cole example portfolio: a lamp-lit bookcase at night, each book spine named after a workplace.',
    domain: 'hannahcole.example',
    device: 'desktop',
  },
  {
    slug: 'leah',
    instantTier: 'Profile',
    name: 'Leah Morgan',
    role: 'Project manager, Bristol',
    field: 'Operations',
    shows: 'A looping project timeline in the hero, and a contact area you can click anywhere on.',
    alt: 'The Leah Morgan example portfolio: bold black capitals on pale grey beside an animated project timeline.',
    domain: 'leahmorgan.example',
    device: 'desktop',
  },
  {
    slug: 'theo',
    instantTier: 'Profile',
    name: 'Theo Lindqvist',
    role: 'Backend and platform engineer, Manchester',
    field: 'Tech',
    shows: 'A map drawn in text characters that parts around your cursor.',
    alt: 'The Theo Lindqvist example portfolio: his name in large pale capitals on a dark page, over a map drawn in grey and amber text characters.',
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
    alt: 'The Kai Thompson example portfolio: a dark grainy page with a big centred headline over a giant K and four coloured shapes.',
    domain: 'kaithompson.example',
    device: 'desktop',
  },
  {
    slug: 'tom',
    name: 'Tom Ashworth',
    role: 'UX design student, Leeds',
    field: 'Graduate',
    shows: 'Full-screen black-and-white projects that slice apart as you move between them.',
    alt: 'The Tom Ashworth example portfolio: a dark full-screen black-and-white photo with a large project title and a 01 / 06 counter.',
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
    alt: 'The Amira Hussain example portfolio: a striped AH monogram beside colour-coded skill chips.',
    domain: 'amirahussain.example',
    device: 'desktop',
  },
];

/**
 * The business concept sites on /business-websites/, on the same live wall. Same rules: "Concept"
 * only, `.example` domains, no reviews, ratings or results. `shows` here says why the site is the
 * right fit for that kind of business.
 */
export const businessConceptsIntro = {
  ...portfolioConceptsIntro,
  label: 'Business site designs',
  title: 'The right fit, running live.',
  chooseText: null,
  text: 'Six kinds of business, six different answers. Each site is built around what its customers need, and no bigger. Move your mouse over any of them: they are running live.',
  next: {
    label: 'Your business',
    title: 'Yours next.',
    text: 'Tell us what you do and who your customers are. On a free 1-hour call we work out the right fit, then build it.',
    button: 'Book a free 1-hour call',
  },
};

/**
 * Six sample businesses from docs/03's sector table (names, domains, headlines and prices), drawn
 * with no photos (Gurman, 21 Nov 2026). Each `shows` line names the tier it's built on, so the wall
 * runs from Essential to Growth: the right fit, not the biggest.
 */
export const businessSiteConcepts: PortfolioConcept[] = [
  {
    slug: 'spiceroute',
    name: 'Spice Route Kitchen',
    role: 'Takeaway, Bradford',
    field: 'Food',
    shows:
      'Built on Essential: one page with tonight’s favourites, prices, allergens, hours and a big call button.',
    alt: 'The Spice Route Kitchen concept: “Order direct. Skip the app fees.” in cream and orange on dark brown, beside a drawn orange cooking pot with steam and chillies.',
    domain: 'spice-route-kitchen.example',
    device: 'phone',
  },
  {
    slug: 'ashby',
    name: 'Ashby Electrical',
    role: 'Electricians, Leeds',
    field: 'Trades',
    shows:
      'Built on Start: services with prices, a quote form that takes a photo, how it works and the areas covered.',
    alt: 'The Ashby Electrical concept: “Certified electricians. Fixed quotes within 24 hours.” in navy capitals on a blueprint grid, beside a quote card with a drawn fuse board and light bulb.',
    domain: 'ashby-electrical.example',
    device: 'desktop',
  },
  {
    slug: 'northgate',
    name: 'Northgate Barbers',
    role: 'Barbershop, Leeds',
    field: 'Beauty',
    shows:
      'Built on Launch: a who’s-in board and next free chair the shop updates from its phone, prices and styles.',
    alt: 'The Northgate Barbers concept: “Sharp cuts. No waiting around.” in huge cream and gold capitals on near-black, beside a turning barber’s pole.',
    domain: 'northgate-barbers.example',
    device: 'desktop',
  },
  {
    slug: 'movewell',
    name: 'Move Well Physio',
    role: 'Physiotherapy clinic, Manchester',
    field: 'Health',
    shows:
      'Built on Launch: a body map to pick where it hurts, prices, and exercise plans sent by message.',
    alt: 'The Move Well Physio concept: “Back to moving well.” in white and lime on deep green, above a line-drawn figure stretching inside a dotted ring.',
    domain: 'move-well-physio.example',
    device: 'desktop',
  },
  {
    slug: 'atelierrose',
    name: 'Atelier Rose',
    role: 'Hair salon, York',
    field: 'Beauty',
    shows:
      'Built on Growth: a board of saved looks, prices, and booking with a stylist and a deposit online.',
    alt: 'The Atelier Rose concept: “Book the look you’ve been saving.” in a fine, wide serif with “saving” in heavy rose letters of the same face, over a pale drawn rose on blush pink.',
    domain: 'atelier-rose.example',
    device: 'phone',
  },
  {
    slug: 'brightsquare',
    name: 'Bright Square Dental',
    role: 'Dental practice, Harrogate',
    field: 'Health',
    shows:
      'Built on Growth: online booking, text reminders, prices, and an assistant that answers questions any time.',
    alt: 'The Bright Square Dental concept: “Calm, modern dentistry near you.” in dark green on pale mint, beside a grid of rounded teal squares with a drawn tooth.',
    domain: 'bright-square-dental.example',
    device: 'desktop',
  },
];
