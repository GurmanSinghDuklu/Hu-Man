/**
 * Root-relative links that respect Astro's `base` (e.g. "/Hu-Man" on GitHub
 * Pages, "" on a real domain). Use for every hardcoded "/..." path; Astro
 * already handles bundled assets and `astro:assets` images itself.
 */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** `withBase('/privacy')` -> "/Hu-Man/privacy" on Pages, "/privacy" otherwise. */
export const withBase = (path: string) => `${base}${path}`;

/** True on the homepage, with or without a trailing slash after the base. */
export const isHomePath = (pathname: string) => pathname.replace(/\/$/, '') === base;
