/**
 * The About hero's opening, over the video frame only (components/HeroVideo.astro with `intro`):
 * square tiles in the brand neons drop into a grid (assemble), a thin Signal green line sweeps
 * across (scan), and as it passes each column that column's tiles flip to show a slice of the
 * video's poster (flip). Then the seams close, the tile layer goes, and the video starts.
 *
 * Plain Web Animations on `translate`, `opacity`, `transform` and `scale`, so it stays off the
 * main thread; at most 32 tiles, built once. The page's h1 and lede never animate (LCP). Runs
 * once per browser session; hero-video.ts only calls it when motion is allowed (not reduced
 * motion, not Data Saver). Any click or key press finishes it at once.
 */
const KEY = 'hm-about-intro';
/** Session keys: each page's intro plays once per browser session. */
export const INTRO_KEYS = { tiles: KEY, cv: 'hm-portfolio-intro' } as const;
const MAX_TILES = 32;

// Brand neons. Signal is the main colour; the others are one or two tiles each.
const SIGNAL = '#39ff14';
const SCAN = '#14dcb2';
const SPARKS = ['#df00ff', '#ff5f1f', '#e7ff00'];

const ASSEMBLE_STEP = 36; // ms between columns
const DROP = 260; // ms for one tile to land
const SCAN_AT = 500; // ms: the line starts
const SCAN_FOR = 400; // ms: the line's sweep
const FLIP = 450; // ms for one tile to turn over
const SEAL = 140; // ms for the seams to close
const GAP = 0.93; // tile scale while the seams are open

const HARD = 'cubic-bezier(0.7, 0, 0.2, 1)';
const SNAP = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

/** Whether the intro should run in this browser session (and mark it as seen). */
export function introWanted(key: string = KEY): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked: still run it, once per page view.
  }
  return true;
}

function gridFor(width: number, height: number): { cols: number; rows: number } {
  let cols = Math.min(6, Math.max(3, Math.round(width / 130)));
  let rows = Math.max(2, Math.ceil((cols * height) / width));
  while (cols * rows > MAX_TILES && cols > 3) {
    cols -= 1;
    rows = Math.max(2, Math.ceil((cols * height) / width));
  }
  return { cols, rows };
}

/** Tile colours in reading order: mostly Signal, a few Scan, one each of the sparks. */
function colours(n: number): string[] {
  const out = Array<string>(n).fill(SIGNAL);
  const at = (f: number) => Math.min(n - 1, Math.floor(n * f));
  const used = new Set<number>();
  const put = (f: number, colour: string) => {
    let i = at(f);
    while (used.has(i)) i = (i + 1) % n;
    used.add(i);
    out[i] = colour;
  };
  if (n < 12) {
    // A small grid (phones): mostly Signal, one Scan and one spark.
    put(0.5, SCAN);
    put(0.15, SPARKS[0]);
  } else {
    put(0.07, SCAN);
    put(0.52, SCAN);
    put(0.86, SCAN);
    put(0.3, SPARKS[0]);
    put(0.66, SPARKS[1]);
    put(0.93, SPARKS[2]);
  }
  return out;
}

/**
 * Builds the tile layer in `frame` (above the video, below the controls) and returns a promise
 * that settles when it has finished and been removed. It starts once the frame is on screen, so a
 * phone's video, below the text, doesn't play its intro unseen.
 */
export function runIntro(frame: HTMLElement, video: HTMLVideoElement): Promise<void> {
  const box = frame.getBoundingClientRect();
  const poster = video.poster;
  if (!poster || box.width < 100 || box.height < 60) return Promise.resolve();

  const { cols, rows } = gridFor(box.width, box.height);
  const n = cols * rows;
  const palette = colours(n);

  const layer = document.createElement('div');
  layer.className = 'hv-intro';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--cols', String(cols));
  layer.style.setProperty('--rows', String(rows));

  const cells: HTMLElement[] = [];
  const tiles: HTMLElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // The cell lands (translate, opacity) and closes the seams (scale); the tile inside it flips.
      // An opacity animation flattens 3D, so it can't sit on the element that rotates.
      const cell = document.createElement('span');
      cell.className = 'hv-cell';
      const tile = document.createElement('span');
      tile.className = 'hv-tile';
      const front = document.createElement('span');
      front.className = 'hv-tile__face hv-tile__front';
      front.style.background = palette[r * cols + c];
      const back = document.createElement('span');
      back.className = 'hv-tile__face hv-tile__back';
      // Each back face shows its own slice of the poster, so the flipped tiles join up into one
      // picture: the image is cols x rows times the tile, shifted to this cell.
      back.style.backgroundImage = `url("${poster}")`;
      back.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      back.style.backgroundPosition = `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${
        rows > 1 ? (r / (rows - 1)) * 100 : 0
      }%`;
      tile.append(front, back);
      cell.append(tile);
      cell.style.gridColumn = String(c + 1);
      cell.style.gridRow = String(r + 1);
      layer.append(cell);
      cells.push(cell);
      tiles.push(tile);
    }
  }
  const line = document.createElement('span');
  line.className = 'hv-scan';
  layer.append(line);
  video.after(layer);

  const animations: Animation[] = [];
  const add = (el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = el.animate(keyframes, { fill: 'both', ...options });
    a.pause();
    animations.push(a);
    return a;
  };

  const lastFlip = { end: 0 };
  tiles.forEach((tile, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    // Assemble: down from slightly above, a column at a time, with a little row stagger.
    add(
      cells[i],
      [
        { translate: `0 -${Math.round(box.height / rows)}px`, opacity: 0 },
        { translate: '0 0', opacity: 1 },
      ],
      { duration: DROP, delay: c * ASSEMBLE_STEP + r * 12, easing: SNAP },
    );
    // Flip: as the scan line reaches this column.
    const flipAt = SCAN_AT + (SCAN_FOR * (c + 0.5)) / cols;
    add(
      tile,
      [
        { transform: 'perspective(700px) rotateY(0deg)' },
        { transform: 'perspective(700px) rotateY(180deg)' },
      ],
      { duration: FLIP, delay: flipAt, easing: HARD },
    );
    lastFlip.end = Math.max(lastFlip.end, flipAt + FLIP);
  });

  // The seams close once every tile has turned over.
  cells.forEach((cell) =>
    add(cell, [{ scale: String(GAP) }, { scale: '1' }], {
      duration: SEAL,
      delay: lastFlip.end,
      easing: 'ease-out',
    }),
  );

  // The line is only there while it sweeps, and fades at the far edge.
  add(
    line,
    [
      { translate: '0 0', opacity: 0, offset: 0 },
      { opacity: 1, offset: 0.02 },
      { opacity: 1, offset: 0.92 },
      { translate: `${Math.round(box.width)}px 0`, opacity: 0, offset: 1 },
    ],
    { duration: SCAN_FOR, delay: SCAN_AT, easing: 'linear' },
  );

  return playWhenSeen(frame, layer, animations, lastFlip.end + SEAL);
}

/**
 * Shared by every intro variant: waits until the frame is 40% on screen (a phone's video sits
 * below the text), plays the paused animations, and settles when they end. Any click or key press
 * finishes it at once (it never blocks the buttons underneath). The layer is removed, not hidden.
 */
export function playWhenSeen(
  frame: HTMLElement,
  layer: HTMLElement,
  animations: Animation[],
  total: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener('pointerdown', finish);
      document.removeEventListener('keydown', finish);
      animations.forEach((a) => a.cancel());
      layer.remove();
      resolve();
    };

    const begin = () => {
      animations.forEach((a) => a.play());
      window.setTimeout(finish, total + 60);
      document.addEventListener('pointerdown', finish, { once: true });
      document.addEventListener('keydown', finish, { once: true });
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        begin();
      },
      { threshold: 0.4 },
    );
    io.observe(frame);
  });
}
