/**
 * Re-encodes a video for the web: H.264 (plays everywhere, iPhones included) at constant quality,
 * AAC audio, and the index at the front (+faststart) so it starts playing before it has finished
 * downloading. Uses ffmpeg-static (a dev dependency; nothing here ships to visitors).
 *   npm run compress-video -- <input.mp4> <output.mp4> [crf]
 * crf: 18 = near-lossless, 23 = default (good for 1080p web), 28 = small. Size is capped at 1920px
 * on the long side.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const [input, output, crf = '23'] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: npm run compress-video -- <input.mp4> <output.mp4> [crf]');
  process.exit(1);
}

execFileSync(
  ffmpeg,
  [
    ...['-y', '-hide_banner', '-loglevel', 'error', '-i', input],
    // Fit within 1920 on the long side, keep the shape, even dimensions for H.264.
    ...['-vf', "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))'"],
    ...['-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p'],
    ...['-profile:v', 'high', '-movflags', '+faststart'],
    ...['-c:a', 'aac', '-b:a', '128k'],
    output,
  ],
  { stdio: 'inherit' },
);
const mb = (f) => (statSync(f).size / 1e6).toFixed(1);
console.log(`${input} (${mb(input)} MB) -> ${output} (${mb(output)} MB)`);
