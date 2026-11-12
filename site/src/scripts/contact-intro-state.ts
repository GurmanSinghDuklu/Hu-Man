/**
 * Shared by the /contact/ intro and the scripts that must wait for it. The class is set before
 * first paint by the inline gate script (scripts/inline/contact-intro-gate.js), only on the first
 * contact visit in a browser session.
 * - `screenOn()`: the landing is switching on (the old-TV moment): the video starts here.
 * - `introDone()`: the intro is over and the page can scroll: Lenis and scroll-fx start here.
 * Skipping fires both; the gate's failsafe fires `hm:intro-done`, which settles both too.
 */
export const INTRO_CLASS = 'contact-intro';
export const INTRO_ON = 'hm:intro-on';
export const INTRO_DONE = 'hm:intro-done';

export const introPlaying = (): boolean => document.documentElement.classList.contains(INTRO_CLASS);

const when = (...events: string[]): Promise<void> =>
  introPlaying()
    ? new Promise((resolve) =>
        events.forEach((e) => window.addEventListener(e, () => resolve(), { once: true })),
      )
    : Promise.resolve();

/** Resolves at once when no intro is playing, otherwise when the landing starts to show. */
export const screenOn = (): Promise<void> => when(INTRO_ON, INTRO_DONE);

/** Resolves at once when no intro is playing, otherwise when it has finished or been skipped. */
export const introDone = (): Promise<void> => when(INTRO_DONE);
