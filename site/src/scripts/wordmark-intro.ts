/**
 * Hero wordmark loop, Spider-Verse misprint style: every 1 s HU/MAN glitches
 * into the next alternate typeface (plates slip, strips tear, ~12 fps stutter).
 * After the last one it glitches back to the brand logo and holds it, clean,
 * for 30 s, then runs again. Pauses while off screen or in a hidden tab.
 * Reduced motion: the static brand logo only.
 *
 * Each glitch uses a random transition effect (tear, misprint, wave,
 * interlace, CRT, shake, dropout, roll, burst, datamosh, streak, echo, punch),
 * never the same twice in a row.
 *
 * Flash safety (WCAG 2.3.1): each glitch swaps the universe (and its
 * background) once, and the colour bars show for at most two frames, so no
 * more than three flashes in any second.
 */
const STEP_MS = 1000; // one alternate style, glitch included
const FRAME_MS = 83; // ~12 fps, animated "on twos"
const INTRO_HOLD_MS = 1500; // brand logo before the first glitch
const LOGO_HOLD_MS = 30000; // clean brand logo after the run
const FIT_WIDTH = 0.86; // share of the column the word may fill
const FIT_HEIGHT = 1.2; // multiple of the stage height a glyph line may fill

const root = document.querySelector<HTMLElement>('[data-wordmark]');

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const em = (n: number) => `${n.toFixed(3)}em`;

function run(el: HTMLElement): void {
  const count = Number(el.dataset.styles) || 0;
  const stage = el.querySelector<HTMLElement>('.wm__stage');
  const measure = el.querySelector<HTMLElement>('[data-wordmark-measure]');
  const strips = [...el.querySelectorAll<HTMLElement>('[data-wordmark-strip]')];
  const bars = el.querySelector<HTMLElement>('[data-wordmark-bars]');
  if (!stage || !measure) return;

  // Scale the current style so every typeface fills the column about equally.
  const fit = () => {
    const w = measure.offsetWidth;
    const h =
      measure.offsetHeight * Number(getComputedStyle(el).getPropertyValue('--stretch') || 1);
    if (!w || !h) return;
    const scale = Math.min(
      (stage.clientWidth * FIT_WIDTH) / w,
      (stage.clientHeight * FIT_HEIGHT) / h,
    );
    el.style.setProperty('--fit', scale.toFixed(3));
  };

  // 0 = brand logo, 1..count = alternate styles.
  const setStyle = (n: number) => {
    if (n === 0) delete el.dataset.style;
    else el.dataset.style = String(n);
    fit();
  };

  new ResizeObserver(fit).observe(stage);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void document.fonts?.ready.then(fit);
    return;
  }

  // Only animate while the wordmark is on screen and the tab is visible.
  let onScreen = true;
  let wake: (() => void) | null = null;
  const active = () => onScreen && !document.hidden;
  const resumeIfActive = () => {
    if (active() && wake) {
      wake();
      wake = null;
    }
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    resumeIfActive();
  }).observe(el);
  document.addEventListener('visibilitychange', resumeIfActive);
  const whenActive = () =>
    active() ? Promise.resolve() : new Promise<void>((resolve) => (wake = resolve));
  const pause = async (ms: number) => {
    await wait(ms);
    await whenActive();
  };

  const VARS = ['--jx', '--jy', '--cx', '--cy', '--mx', '--my', '--yx', '--yy'];
  const set = (name: string, value: string) => el.style.setProperty(name, value);
  const plates = (cx: number, cy: number, mx: number, my: number, yx: number, yy: number) => {
    set('--cx', em(cx));
    set('--cy', em(cy));
    set('--mx', em(mx));
    set('--my', em(my));
    set('--yx', em(yx));
    set('--yy', em(yy));
  };
  const shiftStrip = (i: number, x: number, y = 0) => {
    const strip = strips[i];
    if (strip) strip.style.transform = x || y ? `translate(${em(x)}, ${em(y)})` : '';
  };

  const settle = () => {
    VARS.forEach((v) => set(v, '0em'));
    set('--sk', '0deg');
    set('--sx', '1');
    set('--sy', '1');
    set('--ps', '1');
    set('--zp', '1');
    delete el.dataset.bars;
    if (bars) bars.style.transform = '';
    strips.forEach((strip) => {
      strip.style.transform = '';
      strip.style.opacity = '';
    });
    delete el.dataset.fx;
  };

  /*
   * Transition effects. Each draws one stuttered frame from `t` (0 to 1 through
   * the glitch), `p` (strength, eased down for the last frames) and `d` (a
   * random direction, fixed for the whole glitch). `fx` picks CSS variants:
   * "plates" shows only the halftone dots, "clean" hides them.
   */
  interface Effect {
    fx?: 'plates' | 'clean' | 'echo' | 'streak';
    frames: [number, number]; // min/max frame count for a 1 s step
    swapAt?: number; // share of the way through to change style (default 0.5)
    draw: (t: number, p: number, d: number, i: number) => void;
  }

  const EFFECTS: Effect[] = [
    // Tear: random strips rip sideways, plates slip.
    {
      frames: [4, 5],
      draw: (_t, p) => {
        const r = (n: number) => rand(-n, n) * p;
        plates(r(0.06), r(0.02), r(0.06), r(0.02), r(0.04), r(0.03));
        set('--jx', em(r(0.02)));
        set('--sk', `${r(4).toFixed(2)}deg`);
        strips.forEach((_, i) => shiftStrip(i, Math.random() < 0.4 ? r(0.14) : 0));
      },
    },
    // Misprint: only the dot plates, sliding together from far out of register.
    {
      fx: 'plates',
      frames: [4, 5],
      draw: (t, p, d) => {
        const o = (1 - t) * 0.16 * p + 0.01;
        plates(
          o * d,
          rand(-0.01, 0.01),
          -o * d,
          rand(-0.01, 0.01),
          rand(-0.03, 0.03) * p,
          -o * 0.3,
        );
      },
    },
    // Wave: strips ripple like a warped tape, no colour.
    {
      fx: 'clean',
      frames: [4, 5],
      draw: (t, p, d, i) => {
        strips.forEach((_, k) => shiftStrip(k, Math.sin(k * 0.9 + i * 1.4 * d) * 0.12 * p));
        set('--jy', em(Math.sin(t * 6) * 0.015 * p));
      },
    },
    // Interlace: alternate strips slide in from opposite sides.
    {
      frames: [3, 4],
      draw: (t, p, d) => {
        const o = (1 - t) * 0.4 * p;
        strips.forEach((_, k) => shiftStrip(k, (k % 2 ? o : -o) * d));
        plates(0.02 * d, 0, -0.02 * d, 0, 0, 0.01);
      },
    },
    // CRT: the word collapses to a line, then springs back as the new style.
    {
      fx: 'clean',
      frames: [4, 4],
      swapAt: 0.34,
      draw: (_t, _p, _d, i) => {
        const sy = [0.12, 0.02, 1.18, 0.96][i] ?? 1;
        const sx = [1.12, 1.35, 0.94, 1.01][i] ?? 1;
        set('--sy', sy.toFixed(3));
        set('--sx', sx.toFixed(3));
      },
    },
    // Shake: the whole word judders and skews hard.
    {
      frames: [3, 5],
      draw: (_t, p, d, i) => {
        const side = i % 2 ? 1 : -1;
        set('--jx', em(side * 0.045 * p));
        set('--sk', `${(side * d * 10 * p).toFixed(2)}deg`);
        plates(-side * 0.03 * p, 0, side * 0.03 * p, 0, 0, 0);
      },
    },
    // Dropout: chunks of the word blink out while the plates bloom.
    {
      frames: [4, 5],
      draw: (_t, p) => {
        strips.forEach((strip, k) => {
          strip.style.opacity = Math.random() < 0.35 * p ? '0' : '';
          shiftStrip(k, Math.random() < 0.25 ? rand(-0.05, 0.05) * p : 0);
        });
        set('--ps', (1 + rand(0.04, 0.14) * p).toFixed(3));
        plates(rand(-0.02, 0.02), 0, rand(-0.02, 0.02), 0, 0, 0);
      },
    },
    // Roll: the picture loses vertical hold and jumps up and down.
    {
      frames: [4, 5],
      draw: (t, p, d) => {
        set('--jy', em(Math.cos(t * 9) * 0.12 * (1 - t) * p * d));
        plates(0, 0.05 * p, 0, -0.05 * p, 0.02 * p, 0);
        strips.forEach((_, k) =>
          shiftStrip(k, 0, k === 0 || k === strips.length - 1 ? 0 : rand(-0.04, 0.04) * p),
        );
      },
    },
    // Burst: plates blow out from the centre and snap back in.
    {
      fx: 'plates',
      frames: [3, 4],
      draw: (t, p) => {
        set('--ps', (1 + (1 - t) * 0.3 * p).toFixed(3));
        set('--sx', (1 + (1 - t) * 0.04 * p).toFixed(3));
        set('--sy', (1 + (1 - t) * 0.04 * p).toFixed(3));
        plates(0.015, 0, -0.015, 0.01, 0, -0.01);
      },
    },
    // Datamosh: colour bars smear across the whole frame for two frames.
    {
      frames: [4, 5],
      draw: (_t, p, d, i) => {
        const on = i === 1 || i === 2;
        if (on) el.dataset.bars = '';
        else delete el.dataset.bars;
        if (bars && on) {
          bars.style.transform = `translateX(${rand(-25, 25).toFixed(1)}%) scaleX(${rand(0.6, 2.6).toFixed(2)})`;
        }
        strips.forEach((_, k) => shiftStrip(k, Math.random() < 0.5 ? rand(-0.2, 0.2) * p : 0));
        plates(0.05 * d * p, 0, -0.05 * d * p, 0, 0, 0.02 * p);
      },
    },
    // Streak: the word squashes into a hot line of light, then opens out.
    {
      fx: 'streak',
      frames: [4, 4],
      swapAt: 0.34,
      draw: (_t, _p, _d, i) => {
        set('--sy', ([0.25, 0.04, 1.12, 1][i] ?? 1).toFixed(3));
        set('--sx', ([1.4, 2.2, 0.97, 1][i] ?? 1).toFixed(3));
      },
    },
    // Echo: outlined copies spring apart vertically and stack back up.
    {
      fx: 'echo',
      frames: [4, 5],
      draw: (t, p, d) => {
        const o = (1 - t) * 0.22 * p + 0.02;
        plates(-0.03 * d, -o, 0.03 * d, o, 0.06 * d, o * 2);
      },
    },
    // Punch: the camera slams in on the word and pulls back.
    {
      frames: [3, 4],
      draw: (t, p, d) => {
        set('--zp', (1 + (1 - t) * 1.6 * p).toFixed(3));
        set('--jx', em((1 - t) * 0.3 * d * p));
        plates(0.03, 0, -0.03, 0, 0, 0.02);
      },
    },
  ];

  let lastEffect = -1;
  const pickEffect = () => {
    let n = Math.floor(Math.random() * EFFECTS.length);
    if (n === lastEffect) n = (n + 1) % EFFECTS.length;
    lastEffect = n;
    return EFFECTS[n]!;
  };

  // Glitch into style `to` with a random effect. Returns its
  // length so the step can keep to 1 s. The final glitch chains two effects.
  const glitch = async (to: number, final = false): Promise<number> => {
    el.classList.add('is-glitch');
    const chain = final ? [pickEffect(), pickEffect()] : [pickEffect()];
    let elapsed = 0;
    for (const [c, effect] of chain.entries()) {
      const [lo, hi] = effect.frames;
      const frames = lo + Math.floor(Math.random() * (hi - lo + 1));
      const swap = Math.round((frames - 1) * (effect.swapAt ?? 0.5));
      const d = Math.random() < 0.5 ? -1 : 1;
      settle();
      if (effect.fx) el.dataset.fx = effect.fx;
      for (let i = 0; i < frames; i++) {
        const t = frames > 1 ? i / (frames - 1) : 1;
        effect.draw(t, i < frames - 1 ? 1 : 0.35, d, i);
        if (i === swap && c === chain.length - 1) setStyle(to);
        await wait(FRAME_MS);
        elapsed += FRAME_MS;
      }
    }
    settle();
    el.classList.remove('is-glitch');
    return elapsed;
  };

  const loop = async () => {
    await document.fonts?.ready;
    setStyle(0);
    settle();
    await pause(INTRO_HOLD_MS);
    for (;;) {
      for (let n = 1; n <= count; n++) {
        const took = await glitch(n);
        await pause(STEP_MS - took);
      }
      await glitch(0, true);
      await pause(LOGO_HOLD_MS);
    }
  };

  void loop();
}

if (root) run(root);

export {};
