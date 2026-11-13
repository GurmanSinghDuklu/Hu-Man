/**
 * Short silent loops and stills cut from our own reels (public/landing/reel.mp4 and found.mp4),
 * used as moving pictures across the site (components/Clip.astro). Gurman, 2026-11-13: the whole
 * site should feel like the contact page, with footage from the reels we already use there.
 *
 * `npm run cut-clips` turns this list into public/clips/<id>.mp4 and src/assets/clips/<id>.jpg
 * (the still, shown before the clip loads and instead of it under reduced motion or Data Saver).
 * Re-run it after changing an entry.
 *
 * Crops are in the source's pixels (both reels are 1920 x 1080). Several shots have words burned
 * in (captions, corner labels): every crop here is chosen to leave them out, so check a new crop
 * with the contact sheet the script prints. Footage is mood only: never caption a person in it as
 * a client, and never cut a moment showing a price, a review or a rating.
 */
export interface ClipSpec {
  id: string;
  /** Which reel the shot comes from (public/landing/<source>.mp4). */
  source: 'reel' | 'found';
  /** Start and length in seconds. */
  start: number;
  length: number;
  /** [x, y, width, height] in source pixels. */
  crop: [number, number, number, number];
  /** Output width in pixels (height follows the crop). */
  width: number;
  /** H.264 quality (lower is better and bigger); 27 by default. Busy shots (water) need more. */
  crf?: number;
  /** 'pingpong' plays forwards then backwards, so a short shot loops with no jump. */
  loop: 'pingpong' | 'plain';
  /** A still only: no video is cut, just the picture at `start`. */
  still?: boolean;
}

export const clips = [
  // Brand footage (reel.mp4)
  {
    id: 'head',
    source: 'reel',
    start: 76,
    length: 4,
    crop: [90, 240, 420, 540],
    width: 420,
    loop: 'pingpong',
  },
  {
    id: 'constellation',
    source: 'reel',
    start: 46.5,
    length: 9,
    crop: [880, 150, 980, 700],
    width: 980,
    loop: 'pingpong',
  },
  {
    id: 'software',
    source: 'reel',
    start: 39.2,
    length: 0,
    crop: [120, 180, 1770, 560],
    width: 1280,
    loop: 'plain',
    still: true,
  },
  {
    id: 'wireframe',
    source: 'reel',
    start: 59.2,
    length: 5.4,
    crop: [780, 180, 1050, 540],
    width: 1050,
    loop: 'pingpong',
  },
  // Cinematic footage (found.mp4)
  {
    id: 'cafe',
    source: 'found',
    start: 0,
    length: 2.9,
    crop: [60, 30, 1800, 520],
    width: 1280,
    loop: 'pingpong',
  },
  {
    id: 'mirror',
    source: 'found',
    start: 12.6,
    length: 0,
    crop: [110, 70, 1700, 930],
    width: 1280,
    loop: 'plain',
    still: true,
  },
  {
    id: 'cove',
    source: 'found',
    start: 15.6,
    length: 3.8,
    crop: [60, 50, 1800, 980],
    width: 800,
    crf: 31,
    loop: 'pingpong',
  },
  {
    id: 'shop',
    source: 'found',
    start: 20.1,
    length: 3.6,
    crop: [60, 30, 1800, 580],
    width: 1280,
    loop: 'pingpong',
  },
  {
    id: 'map',
    source: 'found',
    start: 33.0,
    length: 0,
    crop: [110, 70, 1700, 930],
    width: 1280,
    loop: 'plain',
    still: true,
  },
  {
    id: 'tuscany',
    source: 'found',
    start: 36.7,
    length: 2.8,
    crop: [60, 40, 1800, 450],
    width: 1280,
    loop: 'pingpong',
  },
  // Small square versions for the hero collage's one-unit cells (about 100px wide).
  {
    id: 'cove-tile',
    source: 'found',
    start: 15.6,
    length: 3.8,
    crop: [470, 50, 980, 980],
    width: 240,
    crf: 29,
    loop: 'pingpong',
  },
  {
    id: 'veil-tile',
    source: 'found',
    start: 45.0,
    length: 1.5,
    crop: [700, 120, 860, 860],
    width: 240,
    loop: 'pingpong',
  },
] as const satisfies readonly ClipSpec[];

export type ClipId = (typeof clips)[number]['id'];
