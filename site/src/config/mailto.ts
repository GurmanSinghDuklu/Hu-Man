import { site } from './site';

/**
 * Email links: there is no form backend, so every contact button opens an email to the studio
 * with the subject (and a prompt for the body) filled in.
 */
export const mailto = (subject: string, body?: string): string =>
  `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}${
    body ? `&body=${encodeURIComponent(body)}` : ''
  }`;

/** "Tell us your idea" (home hero and the ideas block). */
export const ideaMailto = mailto('My idea', 'Hi,\n\nThe idea is...\n\n');
