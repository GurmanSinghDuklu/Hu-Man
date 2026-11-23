/**
 * Shared by the instant portfolio designs (noor.js, leah.js, theo.js…): the form's answers made
 * into one tidy profile, and HTML escaping (everything a person typed goes through esc()).
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

const list = (value) => (Array.isArray(value) ? value : []);

/** The form's answers as one profile for the templates. `images` maps file ids to page paths. */
export function profile(answers, { cvUrl = null, images = new Map() } = {}) {
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
    from: j.from ?? '',
    to: j.current ? '' : (j.to ?? ''),
    current: j.current === true,
    dates: [monthName(j.from), j.current ? 'Now' : monthName(j.to)].filter(Boolean).join(' – '),
    points: lines(j.did),
  }));
  const education = (Array.isArray(a.education) ? a.education : []).map((e) => ({
    qualification: e.qualification ?? '',
    where: e.where ?? '',
    year: e.year ?? '',
  }));
  const picture = (id) => (typeof id === 'string' && images.get(id)) || null;
  const projects = list(a.projects).map((x) => ({
    title: x.title ?? '',
    what: x.what ?? '',
    role: x.role ?? '',
    year: x.year ?? '',
    tools: x.tools ?? '',
    link: safeUrl(x.link),
    problem: x.problem ?? '',
    built: x.built ?? '',
    outcome: x.outcome ?? '',
    image: picture(x.image),
  }));
  return {
    name,
    firstName: a.firstName || name,
    headline: a.headline ?? '',
    heroWords: String(a.heroWords ?? '')
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, 4),
    belief: a.belief ?? '',
    availability: a.availability ?? '',
    photo: picture(a.photo),
    facts: list(a.facts).map((f) => ({ title: f.title ?? '', text: f.text ?? '' })),
    projects,
    services: list(a.services).map((x) => ({
      title: x.title ?? '',
      text: x.text ?? '',
      points: lines(x.points),
    })),
    steps: list(a.steps).map((x) => ({ title: x.title ?? '', text: x.text ?? '' })),
    faqs: list(a.faqs)
      .filter((x) => x.question && x.answer)
      .map((x) => ({ question: x.question, answer: x.answer })),
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
