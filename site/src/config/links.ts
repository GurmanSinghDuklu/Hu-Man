/**
 * Contact links. Every contact button leads to a form (contact page or free AI check page), which
 * posts to /api/enquiry; the contact page's form is prefilled from the query string
 * (scripts/enquiry-form.ts), e.g. contactPath({ tier: 'Launch' }). Wrap in withBase().
 */
export const contactPath = (params: Record<string, string> = {}): string => {
  const query = new URLSearchParams(params).toString();
  return `/contact/${query ? `?${query}` : ''}`;
};

/**
 * The one booking link behind every "Book a free 1-hour call" button (60 minutes, free, with a
 * short intake form: name, business or idea, current site URL).
 *
 * TODO: replace with Cal.com 60-min event URL
 *
 * Until the event exists it points at the contact page. A root path ('/contact/') gets the site's
 * base path added; a full https:// URL is used as it is and opens in a new tab (every link to
 * another site does, see CLAUDE.md).
 */
export const bookingUrl = '/contact/';

/** The label on every primary booking button. */
export const bookingLabel = 'Book a free 1-hour call';
