/**
 * Shared by the /contact/ falling-tiles intro and the scripts that must wait for it (the landing
 * video, smooth scrolling). The class is set before first paint by the inline script in
 * components/landing/ContactIntro.astro, only on the first contact visit in a browser session.
 */
export const INTRO_CLASS = 'contact-intro';
export const INTRO_DONE = 'hm:intro-done';

export const introPlaying = (): boolean => document.documentElement.classList.contains(INTRO_CLASS);

/** Resolves at once when no intro is playing, otherwise when it has finished or been skipped. */
export const introDone = (): Promise<void> =>
  introPlaying()
    ? new Promise((resolve) => window.addEventListener(INTRO_DONE, () => resolve(), { once: true }))
    : Promise.resolve();
