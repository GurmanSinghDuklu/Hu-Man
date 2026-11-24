/**
 * The two city pages, /web-design-leeds/ and /web-design-manchester/ (21 Nov 2026). Each one says
 * what is true for that city, in its own words: docs/04-seo-plan.md rules out pages that only swap
 * the town name. Gurman confirmed (21 Nov 2026) that we meet clients in person in Manchester, and
 * around Leeds in the places listed under `meet`. One copy of each FAQ feeds the page, its FAQPage
 * schema and llms-full.txt. Draft copy awaiting Gurman's sign-off.
 */
import type { FaqItem } from './faq';
import { fromPrice, priceOf, tiers } from './pricing';

export type CityKey = 'web-design-leeds' | 'web-design-manchester';

export interface City {
  key: CityKey;
  name: string;
  /** Hero. */
  label: string;
  title: string;
  lede: string;
  /** Where we meet in person: a heading and groups of places. */
  meet: { title: string; text: string; groups: { name: string; places: string }[]; note: string };
  /** How working with us goes, for someone in this city. */
  how: { title: string; steps: { title: string; text: string }[] };
  /** A section only this city has. */
  extra: { label: string; title: string; paragraphs: string[] };
  /** Concept slugs (businessSiteConcepts) set in or near this city. */
  concepts: string[];
  /** Places for the Service schema's areaServed: the first is the City. */
  areas: string[];
  faq: FaqItem[];
}

const priceLine = `Our prices are the same wherever you are: from ${fromPrice} for a one-page site to ${priceOf('growth')} for the full build with bookings, payments and AI, with custom work quoted after a call. You get a fixed price before any work starts.`;

const timeLine = tiers
  .filter((t) => t.id !== 'custom')
  .map((t) => `${t.name}: ${t.timeline.charAt(0).toLowerCase()}${t.timeline.slice(1)}`)
  .join('. ');

export const cities: Record<CityKey, City> = {
  'web-design-leeds': {
    key: 'web-design-leeds',
    name: 'Leeds',
    label: 'Web design in Leeds',
    title: 'Websites for Leeds businesses, made in Leeds.',
    lede: 'We are a small software studio based in Leeds. We meet you in person, at your business or over a coffee, then build a fast, agentic AI-ready website that fits what you actually need.',
    meet: {
      title: 'Where we meet you.',
      text: 'The first call is free and takes about an hour. Around Leeds we can come to you.',
      groups: [
        {
          name: 'Leeds',
          places:
            'The city centre, Headingley, Chapel Allerton, Roundhay, Horsforth, Morley and the rest of Leeds.',
        },
        {
          name: 'West Yorkshire',
          places: 'Bradford, Shipley, Keighley, Wakefield, Huddersfield and Halifax.',
        },
        { name: 'North Yorkshire', places: 'Harrogate and York.' },
      ],
      note: 'Further away, we work by video call and email, anywhere in the UK.',
    },
    how: {
      title: 'From a first chat to a site that works.',
      steps: [
        {
          title: 'A free call, in person',
          text: 'We come to your shop, office or yard. Seeing how you work tells us more than any form.',
        },
        {
          title: 'A mock-up before the build',
          text: 'You see what your new site will look like before the build starts, and say what to change.',
        },
        {
          title: 'Built and tested on real phones',
          text: 'Most of your customers will find you on a phone, so that is where we test it.',
        },
        {
          title: 'Launch, then a person to call',
          text: 'We show you round the finished site and stay on hand after launch.',
        },
      ],
    },
    extra: {
      label: 'Found by people nearby',
      title: 'Built for the way Leeds searches.',
      paragraphs: [
        'People look for a business near them on Google Maps, in Google’s results and, more and more, by asking an AI assistant. All three read the same things: a clear site, a complete Business Profile, and the areas you cover written down plainly.',
        'We set those up: your services and prices as text, the parts of Leeds and West Yorkshire you cover, your hours, and structured data that names them, so search engines and AI tools can read your business correctly.',
        'No one can promise rankings or a mention in AI answers, and we never will. We do the groundwork, show you how to check where you appear, and tell you honestly what we find.',
      ],
    },
    concepts: ['ashby', 'northgate', 'brightsquare', 'atelierrose'],
    areas: [
      'Leeds',
      'Bradford',
      'Shipley',
      'Keighley',
      'Wakefield',
      'Huddersfield',
      'Halifax',
      'Harrogate',
      'York',
    ],
    faq: [
      {
        q: 'Do you meet in person in Leeds?',
        a: 'Yes. We are based in Leeds and meet clients in person across the city and West Yorkshire, and in Harrogate and York. The first call is free and takes about an hour.',
      },
      {
        q: 'How much does a website cost in Leeds?',
        a: priceLine,
      },
      {
        q: 'Can you come to my business?',
        a: 'Yes, anywhere in the areas on this page. It helps us build the right site when we have seen how you work and who your customers are.',
      },
      {
        q: 'Do you only work with Leeds businesses?',
        a: 'No. Leeds is our base. We also meet clients in person in Manchester, and work by video call with businesses anywhere in the UK.',
      },
      {
        q: 'Can you get my business to the top of Google in Leeds?',
        a: 'No one can promise that, and we will not. We set up what Google and AI tools read (your site, your Business Profile and the areas you cover), show you how to check where you appear, and tell you what we find.',
      },
    ],
  },
  'web-design-manchester': {
    key: 'web-design-manchester',
    name: 'Manchester',
    label: 'Web design in Manchester',
    title: 'Manchester businesses, met in person.',
    lede: 'We are based in Leeds, about an hour away, and we meet Manchester clients in person. Same fixed prices, the same build, and a real person to talk to from the first call to launch and after.',
    meet: {
      title: 'We come to you.',
      text: 'The first call is free and takes about an hour. We meet at your business, or somewhere nearby that suits you.',
      groups: [
        {
          name: 'In Manchester',
          places: 'The first call, and any time a face-to-face conversation will help.',
        },
        {
          name: 'In between',
          places:
            'Video calls and email while we build, so you are never waiting for the next visit.',
        },
      ],
      note: 'If video suits you better from the start, that works too.',
    },
    how: {
      title: 'How it works from across the Pennines.',
      steps: [
        {
          title: 'We meet in Manchester',
          text: 'A free call at your business. We look at what you have now and what your customers need.',
        },
        {
          title: 'You see it as it grows',
          text: 'A mock-up first, then the site in progress at a private link you can open on your phone.',
        },
        {
          title: 'Launch, with us on hand',
          text: 'We show you round the finished site, in person or on a call, and you keep a short video of how it works.',
        },
      ],
    },
    extra: {
      label: 'Why us',
      title: 'Why a Leeds studio for a Manchester business?',
      paragraphs: [
        'There are good studios in Manchester, and one round the corner may suit you. Here is what we offer instead, so you can compare.',
        'Every price is on our site before you call. You see a mock-up before the build starts. Every site is agentic AI-ready as standard, so AI tools as well as people can read it. And one small team takes you from the first call to launch, and stays after.',
        'If you would like to move off Wix or Squarespace, we move your pages and set up redirects so old links keep working. No one can guarantee rankings after a move, but redirects protect what you have built.',
      ],
    },
    concepts: ['movewell'],
    areas: ['Manchester'],
    faq: [
      {
        q: 'Do you really meet in Manchester?',
        a: 'Yes. We meet Manchester clients in person for the first call and whenever it helps, and work by video call and email in between.',
      },
      {
        q: 'Are your prices different in Manchester?',
        a: priceLine,
      },
      {
        q: 'How long does a website take?',
        a: `${timeLine}. It depends on how quickly you send your content.`,
      },
      {
        q: 'Can you move my site off Wix or Squarespace?',
        a: 'Yes, from the Launch tier up. We move your pages and set up redirects so your old links still work. No one can guarantee rankings after a move, but redirects protect what you have earned.',
      },
      {
        q: 'Who do I talk to after launch?',
        a: 'The same small team. You can call or message us, and a care plan covers hosting, updates and small changes each month if you want one.',
      },
    ],
  },
};
