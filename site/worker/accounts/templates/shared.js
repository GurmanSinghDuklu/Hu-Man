/**
 * Shared by the instant portfolio templates (leah.js, noor.js, theo.js): the form's answers made
 * into one tidy profile, HTML escaping (everything a person typed goes through esc()), fonts from
 * the main site, and the page head with Person structured data (the Profile tier promises it).
 */
export const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthName = (ym) => {
  const m = String(ym ?? '').match(/^(\d{4})-(\d{2})$/);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
};
const lines = (text) =>
  String(text ?? '')
    .split('\n')
    .map((l) => l.replace(/^[\s•\-*·]+/, '').trim())
    .filter(Boolean);

/** A link people typed, as a safe https URL, or null. */
export function safeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

const linkLabel = (url) => {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.includes('linkedin.')) return 'LinkedIn';
  if (host.includes('github.')) return 'GitHub';
  if (host.includes('behance.')) return 'Behance';
  if (host.includes('dribbble.')) return 'Dribbble';
  if (host.includes('instagram.')) return 'Instagram';
  return host;
};

/** The form's answers as one profile for the templates. */
export function profile(answers, { cvUrl = null } = {}) {
  const a = answers ?? {};
  const name = [a.firstName, a.surname].filter(Boolean).join(' ').trim() || 'Your name';
  const links = [a.linkedin, a.website, ...lines(a.otherLinks)]
    .map(safeUrl)
    .filter(Boolean)
    .slice(0, 8)
    .map((url) => ({ url, label: linkLabel(url) }));
  const jobs = (Array.isArray(a.experience) ? a.experience : []).map((j) => ({
    title: j.title ?? '',
    employer: j.employer ?? '',
    place: j.place ?? '',
    dates: [monthName(j.from), j.current ? 'Now' : monthName(j.to)].filter(Boolean).join(' – '),
    points: lines(j.did),
  }));
  const education = (Array.isArray(a.education) ? a.education : []).map((e) => ({
    qualification: e.qualification ?? '',
    where: e.where ?? '',
    year: e.year ?? '',
  }));
  return {
    name,
    firstName: a.firstName || name,
    jobTitle: a.jobTitle ?? '',
    town: a.town ?? '',
    summary: a.summary ?? '',
    email: a.email ?? '',
    phone: a.phone ?? '',
    links,
    skills: lines(a.skills).slice(0, 40),
    jobs,
    education,
    cvUrl,
  };
}

/** @font-face rules for fonts on the main site (they allow cross-site use for published sites). */
export const fontFaces = (base, faces) =>
  faces
    .map(
      ([family, weight, file]) =>
        `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:swap;src:url(${base}/concepts/fonts/${file}) format('woff2')}`,
    )
    .join('');

/** <head> contents: title, description, Person structured data. */
export function head(p, { css }) {
  const description = [p.jobTitle, p.town].filter(Boolean).join(' in ') || `${p.name}'s portfolio`;
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    ...(p.jobTitle && { jobTitle: p.jobTitle }),
    ...(p.town && { address: { '@type': 'PostalAddress', addressLocality: p.town } }),
    ...(p.links.length && { sameAs: p.links.map((l) => l.url) }),
  };
  // JSON in a script tag: "<" escaped so text can never close the tag.
  const ld = JSON.stringify(person).replace(/</g, '\\u003c');
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.name)}${p.jobTitle ? ` · ${esc(p.jobTitle)}` : ''}</title>
<meta name="description" content="${esc(`${p.name}: ${description}.`)}">
<script type="application/ld+json">${ld}</script>
<style>${css}</style>`;
}

/** Contact items shared by every template: email, phone, links, CV. */
export const contactItems = (p) => [
  ...(p.email ? [{ href: `mailto:${p.email}`, text: p.email }] : []),
  ...(p.phone ? [{ href: `tel:${p.phone.replace(/[^\d+]/g, '')}`, text: p.phone }] : []),
  ...p.links.map((l) => ({ href: l.url, text: l.label, external: true })),
  ...(p.cvUrl ? [{ href: p.cvUrl, text: 'Download my CV (PDF)' }] : []),
];

export const linkAttrs = (item) =>
  item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
export const credit = `<a href="https://humansoftwareagency.com/portfolio/" target="_blank" rel="noopener">Site by Hu/man</a>`;
