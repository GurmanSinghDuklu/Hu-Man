/**
 * The videos behind the page heroes (public/landing/, the same files the contact and /start/
 * landing plays). One list feeds the player (HeroVideo.astro), the VideoObject in each page's
 * schema (src/data/schema.ts) and, through that schema, the video entries in the sitemap
 * (src/integrations/ai-readable.mjs). seo-check fails if a page plays a video its schema doesn't
 * describe, or describes one it doesn't play.
 *
 * Descriptions say only what is on screen. `seconds` was measured with ffmpeg: re-measure it if a
 * file is re-cut (`node_modules/ffmpeg-static/ffmpeg -i public/landing/<file>.mp4`).
 */
import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import reelPoster from '../assets/hero-video/reel.jpg';
import foundPoster from '../assets/hero-video/found.jpg';
import seenPoster from '../assets/hero-video/portfolio-seen.jpg';
import adPoster from '../assets/hero-video/portfolio-ad.jpg';
import pricingPoster from '../assets/hero-video/pricing.jpg';
import type { PageKey } from './pages';

export interface HeroVideo {
  src: string;
  w: number;
  h: number;
  poster: ImageMetadata;
  /** Seconds: where playback starts (the poster's moment). Loops go back to 0. */
  start: number;
  /** The player's accessible name, and the video's title in schema and the sitemap. */
  label: string;
  /** What the video shows, for schema and the sitemap. */
  description: string;
  /** Length in seconds. */
  seconds: number;
}

export const heroVideos = {
  reel: {
    src: '/landing/reel.mp4',
    w: 1920,
    h: 1080,
    poster: reelPoster,
    start: 9.3,
    label: 'The Hu/man showreel',
    description:
      'The Hu/man showreel: real developers and the software behind every site, concept portfolio websites, builds that are secure, fast and built to be found, the aftercare that follows launch, and an invitation to book a free 1-hour call.',
    seconds: 81.81,
  },
  found: {
    src: '/landing/found.mp4',
    w: 1920,
    h: 1080,
    poster: foundPoster,
    start: 0,
    label: 'Built to be found, by Hu/man',
    description:
      'A short brand film from Hu/man about branding and work that lasts: people, places and businesses, with the words of the studio’s approach over them.',
    seconds: 51.23,
  },
  'portfolio-seen': {
    src: '/landing/portfolio-seen.mp4',
    w: 1080,
    h: 1920,
    poster: seenPoster,
    start: 0,
    label: 'Be seen: portfolio sites by Hu/man, from £156',
    description:
      'Hu/man builds portfolio sites that show who you are: a run through concept portfolio and CV websites designed for everyone, from graduates to nurses.',
    seconds: 28.39,
  },
  'portfolio-ad': {
    src: '/landing/portfolio-ad.mp4',
    w: 1080,
    h: 1920,
    poster: adPoster,
    start: 2.3,
    label: 'Portfolio pages by Hu/man, from £156',
    description: 'An advert for Hu/man portfolio and CV websites, from £156.',
    seconds: 48.2,
  },
  pricing: {
    src: '/landing/pricing.mp4',
    w: 1080,
    h: 1920,
    poster: pricingPoster,
    start: 6.5,
    label: 'Hu/man pricing: websites from £318, care plans from £29 a month, portfolios from £156',
    description:
      'Hu/man prices in one run: five website tiers from Essential at £318 to Custom, quoted after a call; care plans from £29 a month; portfolio and CV sites from £156. Pay once and you own it.',
    seconds: 43.7,
  },
} satisfies Record<string, HeroVideo>;

export type HeroVideoKey = keyof typeof heroVideos;

/**
 * Which hero video each page plays (the page passes the same key to InnerHero or HomeHero).
 * The schema reads this; seo-check compares it with the built pages.
 */
export const pageHeroVideo: Partial<Record<PageKey, HeroVideoKey>> = {
  index: 'reel',
  about: 'found',
  portfolio: 'portfolio-seen',
  pricing: 'pricing',
};

/** Videos a page plays in a section below its hero (the portfolio request form beside a video). */
export const pageSectionVideos: Partial<Record<PageKey, HeroVideoKey[]>> = {
  portfolio: ['portfolio-ad'],
};

/** The poster as the page ships it (also the schema's and sitemap's thumbnail). */
export function heroPoster(key: HeroVideoKey) {
  const v: HeroVideo = heroVideos[key];
  return getImage({ src: v.poster, width: v.w > v.h ? 1280 : 720, format: 'webp', quality: 72 });
}

/** ISO 8601 duration, e.g. 81.81 -> "PT1M22S". */
export function isoDuration(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `PT${m ? `${m}M` : ''}${s}S`;
}
