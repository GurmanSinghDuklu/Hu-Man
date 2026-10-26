/**
 * Contact links. Every contact button leads to a form (contact page or free AI check page), which
 * posts to /api/enquiry; the contact page's form is prefilled from the query string
 * (scripts/enquiry-form.ts), e.g. contactPath({ tier: 'Launch' }). Wrap in withBase().
 */
export const contactPath = (params: Record<string, string> = {}): string => {
  const query = new URLSearchParams(params).toString();
  return `/contact/${query ? `?${query}` : ''}`;
};
