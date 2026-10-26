import { execFileSync } from 'node:child_process';

/**
 * When a page last changed: the newest commit touching the page itself or the shared data,
 * components and config it is built from. Used for the sitemap's lastmod and the schema's
 * dateModified. Search engines only trust these dates when they are accurate, so they come from
 * git, never the build time. Returns undefined outside a git checkout (the field is then left out).
 */
export function lastModified(pageFile: string): string | undefined {
  try {
    const date = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', pageFile, 'src/data', 'src/components', 'src/config'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
}

/** The source file of a page key, e.g. "about" -> "src/pages/about.astro". */
export const pageFile = (key: string): string => `src/pages/${key}.astro`;
