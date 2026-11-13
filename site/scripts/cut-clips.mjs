/**
 * Cuts the site's short loops and stills from our own reels, as listed in src/data/clips.ts.
 *   npm run cut-clips            every clip
 *   npm run cut-clips -- cove    one or more by id
 * Output: public/clips/<id>.mp4 (H.264, silent, faststart) and src/assets/clips/<id>.jpg (the
 * still: the clip's first frame). A contact sheet of each clip lands in reports/clips/<id>.jpg:
 * look at it to check that no burned-in words crept into the crop.
 */
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { clips } from '../src/data/clips.ts';

const root = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
await mkdir(path('public/clips/'), { recursive: true });
await mkdir(path('src/assets/clips/'), { recursive: true });
await mkdir(path('reports/clips/'), { recursive: true });

const only = process.argv.slice(2);
const run = (args, what) => {
  const r = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error(`${what}: ffmpeg failed`);
};

for (const c of clips) {
  if (only.length && !only.includes(c.id)) continue;
  const source = path(`public/landing/${c.source}.mp4`);
  const [x, y, w, h] = c.crop;
  const frame = `crop=${w}:${h}:${x}:${y},scale=${c.width}:-2:flags=lanczos`;

  // The still: the first frame at full quality.
  run(
    [
      ...['-ss', String(c.start), '-i', source, '-frames:v', '1', '-vf', frame],
      ...['-q:v', '2', path(`src/assets/clips/${c.id}.jpg`)],
    ],
    c.id,
  );
  if (c.still) {
    console.log(`${c.id}: still`);
    continue;
  }

  const filter =
    c.loop === 'pingpong'
      ? `[0:v]${frame},fps=30,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]`
      : `[0:v]${frame},fps=30[v]`;
  const out = path(`public/clips/${c.id}.mp4`);
  run(
    [
      ...['-ss', String(c.start), '-t', String(c.length), '-i', source],
      ...['-filter_complex', filter, '-map', '[v]', '-an'],
      ...['-c:v', 'libx264', '-preset', 'slow', '-crf', String(c.crf ?? 27), '-pix_fmt', 'yuv420p'],
      ...['-profile:v', 'high', '-movflags', '+faststart'],
      out,
    ],
    c.id,
  );
  run(
    [
      '-i',
      out,
      '-vf',
      'fps=3,scale=320:-2,tile=6x3',
      '-frames:v',
      '1',
      path(`reports/clips/${c.id}.jpg`),
    ],
    c.id,
  );
  console.log(`${c.id}: ${((await stat(out)).size / 1024).toFixed(0)} kB`);
}
