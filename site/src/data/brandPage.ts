/**
 * Copy for /brand/ that isn't the 74 directions (src/data/brandStudio.ts): the 14 deliverables, the
 * five steps, the Pura case study's palette and the board's mood words and logo types. Draft copy
 * awaiting Gurman's sign-off. Brand identity has no prices yet, so none appear here.
 */

export interface Deliverable {
  id: string;
  title: string;
  text: string;
  /** Which Pura asset the tile crops (see BrandGet.astro). */
  asset: string;
}

export const deliverables: Deliverable[] = [
  {
    id: 'logo',
    title: 'Primary logo',
    text: 'The main mark, drawn once and set in your colours.',
    asset: 'logo',
  },
  {
    id: 'mark',
    title: 'Logomark',
    text: 'The small version, for icons, avatars and stamps.',
    asset: 'mark',
  },
  {
    id: 'space',
    title: 'Clear space',
    text: 'The room the logo needs, and the smallest it can go.',
    asset: 'space',
  },
  {
    id: 'typeface',
    title: 'Primary typeface',
    text: 'One display face and one reading face, chosen together.',
    asset: 'typeface',
  },
  {
    id: 'hierarchy',
    title: 'Type hierarchy',
    text: 'Sizes and weights for headings, text and captions.',
    asset: 'hierarchy',
  },
  {
    id: 'palette',
    title: 'Colour palette',
    text: 'Five colours with jobs, checked for contrast.',
    asset: 'palette',
  },
  {
    id: 'imagery',
    title: 'Brand imagery',
    text: 'The kind of photography that sits right with your brand.',
    asset: 'imagery',
  },
  {
    id: 'patterns',
    title: 'Graphic patterns',
    text: 'A repeatable pattern for packaging, walls and backgrounds.',
    asset: 'pattern',
  },
  {
    id: 'social',
    title: 'Social creatives',
    text: 'Post templates you can reuse without a designer.',
    asset: 'social',
  },
  {
    id: 'banners',
    title: 'Social banners',
    text: 'Profile and cover banners sized for each platform.',
    asset: 'banner',
  },
  {
    id: 'mockups',
    title: 'Brand mockups',
    text: 'Your identity shown on real, photographed objects.',
    asset: 'mockups',
  },
  {
    id: 'cards',
    title: 'Business cards',
    text: 'Print-ready cards with the details that matter.',
    asset: 'cards',
  },
  {
    id: 'signage',
    title: 'Billboard and signage',
    text: 'Shopfront, vehicle and large-format layouts.',
    asset: 'signage',
  },
  {
    id: 'merch',
    title: 'Merch',
    text: 'Tote bags, tees, cups and packaging that carry the brand.',
    asset: 'merch',
  },
];

export const brandSteps = [
  {
    title: 'Send your board',
    text: 'Collect what you love, pick colours, a direction and a typeface, then sign in to send it.',
  },
  {
    title: 'Free 1-hour call',
    text: 'A person goes through your board with you and agrees what you need.',
  },
  {
    title: '2 to 3 directions',
    text: 'We draw two or three routes from your brief, not from a prompt.',
  },
  { title: 'Refine together', text: 'You choose one. We refine it with you until it feels right.' },
  {
    title: 'Guidelines handover',
    text: 'Files, formats and a guidelines sheet so the brand stays consistent.',
  },
];

export const boardMoods = [
  'Warm',
  'Bold',
  'Calm',
  'Playful',
  'Premium',
  'Friendly',
  'Modern',
  'Classic',
  'Quiet',
  'Loud',
  'Natural',
  'Handmade',
  'Techy',
  'Fresh',
  'Retro',
  'Minimal',
  'Trusted',
  'Energetic',
];

export const logoTypes = [
  { id: 'wordmark', label: 'Wordmark', text: 'Your name, set as the logo.' },
  { id: 'lettermark', label: 'Lettermark', text: 'Initials in a compact shape.' },
  { id: 'mascot', label: 'Mascot', text: 'A character that stands for you.' },
  { id: 'emblem', label: 'Emblem or badge', text: 'Name and symbol locked inside a shape.' },
  { id: 'combination', label: 'Combination', text: 'A symbol and a wordmark, side by side.' },
  { id: 'abstract', label: 'Abstract mark', text: 'A shape that carries a feeling.' },
];

/** Font ids grouped for the typeface step (the data file's `kind` is one-off per face). */
export const fontGroups: { title: string; ids: string[] }[] = [
  {
    title: 'Round and friendly',
    ids: ['bagel', 'titan', 'fredoka', 'cherry-bomb', 'comfortaa', 'righteous'],
  },
  {
    title: 'Serif and refined',
    ids: ['bodoni', 'abril', 'gloock', 'italiana', 'poiret', 'limelight'],
  },
  {
    title: 'Modern and technical',
    ids: [
      'unbounded',
      'space-grotesk',
      'bricolage',
      'syne',
      'michroma',
      'syncopate',
      'big-shoulders',
      'josefin',
    ],
  },
  { title: 'Loud and handmade', ids: ['shrikhand', 'rye', 'bungee', 'marker', 'gochi'] },
];
