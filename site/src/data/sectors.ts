/**
 * Sector data for the concept renderer (MockSite). All sample content for
 * fictional businesses, per docs/03-site-spec.md. Domains use .example
 * only. Do not add real business names, prices outside this sample data,
 * or anything that could be mistaken for a real client.
 */

export type HeroVariant = 'split' | 'center' | 'trust';

export interface SectorService {
  name: string;
  price: string;
}

export interface Sector {
  id: 'barber' | 'electrician' | 'dental' | 'physio' | 'takeaway' | 'salon';
  name: string;
  /** Business-type label shown on tabs and gallery captions, e.g. "Electrician". */
  typeLabel: string;
  domain: string;
  /** bg / fg / accent / ink-on-accent */
  palette: {
    bg: string;
    fg: string;
    accent: string;
    inkOnAccent: string;
  };
  beforeHeaderColor: string;
  heroVariant: HeroVariant;
  headline: string;
  sub: string;
  button: string;
  services: SectorService[];
  bookingCard: string;
  /** What the concept gallery caption lists as included. */
  galleryIncludes: string;
}

export const sectors: Sector[] = [
  {
    id: 'barber',
    name: 'Northgate Barbers',
    typeLabel: 'Barber',
    domain: 'northgate-barbers.example',
    palette: { bg: '#101114', fg: '#F2EFE8', accent: '#D9A441', inkOnAccent: '#16130B' },
    beforeHeaderColor: '#7A1F1F',
    heroVariant: 'split',
    headline: 'Sharp cuts. No waiting around.',
    sub: 'Pick your barber and time in 30 seconds. Pay a deposit, get a reminder, turn up.',
    button: 'Book a chair',
    services: [
      { name: 'Skin fade', price: '£18' },
      { name: 'Beard sculpt', price: '£12' },
      { name: 'Cut and beard', price: '£28' },
    ],
    bookingCard: 'Next free chair: today, 4:30 pm',
    galleryIncludes: 'Online booking, deposits, AI assistant',
  },
  {
    id: 'electrician',
    name: 'Ashby Electrical',
    typeLabel: 'Electrician',
    domain: 'ashby-electrical.example',
    palette: { bg: '#F3F6FA', fg: '#0B2545', accent: '#FFB703', inkOnAccent: '#0B2545' },
    beforeHeaderColor: '#1A3D7C',
    heroVariant: 'trust',
    headline: 'Certified electricians. Fixed quotes within 24 hours.',
    sub: 'Tell us about the job and send a photo. We reply with a fixed price, not a guess.',
    button: 'Get a fixed quote',
    services: [
      { name: 'Safety inspection', price: 'from £120' },
      { name: 'Consumer unit upgrade', price: 'fixed quote' },
      { name: 'EV charger install', price: 'from £799' },
    ],
    bookingCard: 'We reply within 24 hours',
    galleryIncludes: 'Fixed-quote form, photo upload, AI assistant',
  },
  {
    id: 'dental',
    name: 'Bright Square Dental',
    typeLabel: 'Dental practice',
    domain: 'bright-square-dental.example',
    palette: { bg: '#F7FBFA', fg: '#12332F', accent: '#2A9D8F', inkOnAccent: '#06211D' },
    beforeHeaderColor: '#2A6B5A',
    heroVariant: 'split',
    headline: 'Calm, modern dentistry near you.',
    sub: 'New patients welcome. Book online, get reminders by text, and ask questions any time.',
    button: 'Book a check-up',
    services: [
      { name: 'Check-up', price: '£55' },
      { name: 'Hygiene visit', price: '£65' },
      { name: 'Whitening', price: '£295' },
    ],
    bookingCard: 'New patients: appointments this week',
    galleryIncludes: 'Online booking, reminders, AI assistant',
  },
  {
    id: 'physio',
    name: 'Move Well Physio',
    typeLabel: 'Physiotherapist',
    domain: 'move-well-physio.example',
    palette: { bg: '#0F2A24', fg: '#ECF5EF', accent: '#A6E36E', inkOnAccent: '#0F2A24' },
    beforeHeaderColor: '#1F4D3D',
    heroVariant: 'center',
    headline: 'Back to moving well.',
    sub: 'Book an assessment online, get your exercise plan by message, and rebook in a tap.',
    button: 'Book an assessment',
    services: [
      { name: 'Assessment', price: '£60' },
      { name: 'Follow-up', price: '£45' },
      { name: 'Sports massage', price: '£40' },
    ],
    bookingCard: 'Next assessment: tomorrow, 9:15 am',
    galleryIncludes: 'Online booking, exercise-plan messages, AI assistant',
  },
  {
    id: 'takeaway',
    name: 'Spice Route Kitchen',
    typeLabel: 'Takeaway',
    domain: 'spice-route-kitchen.example',
    palette: { bg: '#1A0F0A', fg: '#FFF1E3', accent: '#FF7A1A', inkOnAccent: '#1A0F0A' },
    beforeHeaderColor: '#7A2E12',
    heroVariant: 'split',
    headline: 'Order direct. Skip the app fees.',
    sub: 'Fresh from our kitchen to your door, or ready for collection in 20 minutes.',
    button: 'Order now',
    services: [
      { name: 'Chicken karahi', price: '£9.50' },
      { name: 'Paneer tikka wrap', price: '£6.50' },
      { name: 'Family feast', price: '£24' },
    ],
    bookingCard: 'Collection in about 20 minutes',
    galleryIncludes: 'Direct ordering, no commission, AI assistant',
  },
  {
    id: 'salon',
    name: 'Atelier Rose',
    typeLabel: 'Salon',
    domain: 'atelier-rose.example',
    palette: { bg: '#FBF2F1', fg: '#2B1B22', accent: '#B5446E', inkOnAccent: '#FFFFFF' },
    beforeHeaderColor: '#7A2E44',
    heroVariant: 'center',
    headline: "Book the look you've been saving.",
    sub: 'Colour, cut and treatments with the stylist you love. Book and pay a deposit online.',
    button: 'Book an appointment',
    services: [
      { name: 'Cut and finish', price: '£45' },
      { name: 'Full colour', price: 'from £85' },
      { name: 'Treatment', price: '£35' },
    ],
    bookingCard: 'Next appointment: Thursday, 11:00 am',
    galleryIncludes: 'Online booking, deposits, AI assistant',
  },
];

/** Sector ids used by the compare-slider tabs (a subset of the full gallery). */
export const sliderSectorIds: Sector['id'][] = ['barber', 'electrician', 'dental'];

export function getSector(id: Sector['id']): Sector {
  const sector = sectors.find((s) => s.id === id);
  if (!sector) throw new Error(`Unknown sector: ${id}`);
  return sector;
}
