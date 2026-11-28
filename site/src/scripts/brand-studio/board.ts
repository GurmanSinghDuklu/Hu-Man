/**
 * The Brand Board shell: step rail and collapsible step cards, basics, logo direction, mockups and
 * guidelines sheet, the review step, and the preview (sticky column on desktop, sheet on phones).
 * Loaded when the board nears the screen. Colour, inspiration, type and sending are in their own modules.
 */
import { gallery, moods, mockupBases } from '../../data/brandStudio';
import { boardMoods } from '../../data/brandPage';
import { brandStudioConfig as cfg } from '../../config/brandStudio';
import { get, update, subscribe, announce, brandName, roleColour, DEFAULT_NAME } from './store';
import { cssFamily } from './fonts';
import { buildMockup, paintMockup } from './mockups';
import { mountPreview } from './preview';
import { startSignIn } from './account';
import { readableOn } from './colour';
import './colour-ui';
import './inspiration';
import { loadAll as loadTypeFonts } from './type-ui';

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)!;
const $$ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const STEPS = 7;

// ---------- steps ----------
function openStep(n: number, scroll = false) {
  for (let i = 1; i <= STEPS; i++) {
    const head = $<HTMLButtonElement>(`#bs-head-${i}`);
    const open = i === n;
    head.setAttribute('aria-expanded', String(open));
    $(`#bs-body-${i}`).hidden = !open;
    $(`#bs-step-${i}`).classList.toggle('is-open', open);
  }
  $$('.bs-rail__btn').forEach((b) =>
    b.toggleAttribute('aria-current', Number(b.dataset.goto) === n),
  );
  if (n === 5) loadTypeFonts();
  if (n === 6) {
    update('mockups', (s) => (s.touched.mockups = true));
    paintMockups();
  }
  if (n === 7) renderSummary();
  if (scroll)
    $(`#bs-step-${n}`).scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
}
for (let i = 1; i <= STEPS; i++) {
  $(`#bs-head-${i}`).addEventListener('click', () => {
    const open = $(`#bs-head-${i}`).getAttribute('aria-expanded') === 'true';
    if (open) {
      $(`#bs-head-${i}`).setAttribute('aria-expanded', 'false');
      $(`#bs-body-${i}`).hidden = true;
      $(`#bs-step-${i}`).classList.remove('is-open');
    } else openStep(i);
  });
}
$$('[data-goto]').forEach((b) =>
  b.addEventListener('click', () => openStep(Number(b.dataset.goto), true)),
);
$$('[data-next]').forEach((b) =>
  b.addEventListener('click', () => openStep(Number(b.dataset.next), true)),
);

function isDone(n: number): boolean {
  const s = get();
  return [
    s.basics.name.trim().length > 0,
    s.saved.length + s.uploads.length + s.links.length > 0,
    s.touched.colour,
    s.logo.directions.length + s.logo.types.length > 0,
    s.touched.type,
    s.touched.mockups,
    s.touched.sent,
  ][n - 1];
}
function paintDone() {
  let count = 0;
  for (let i = 1; i <= STEPS; i++) {
    const d = isDone(i);
    if (d) count++;
    $(`#bs-step-${i}`).classList.toggle('is-done', d);
    $(`.bs-rail__btn[data-goto="${i}"]`).dataset.done = String(d);
    $(`#bs-status-${i}`).textContent = d ? 'Done' : i === 2 || i === 4 ? 'Optional' : 'To do';
  }
  $('#bs-progress').textContent = `${count} of ${STEPS} steps done`;
}

// ---------- 1 basics ----------
const bind = (id: string, key: 'name' | 'does' | 'audience') => {
  const el = $<HTMLInputElement>(id);
  el.addEventListener('input', () => update('basics', (s) => (s.basics[key] = el.value)));
};
bind('#bs-name', 'name');
bind('#bs-does', 'does');
bind('#bs-audience', 'audience');
$('#bs-moods').innerHTML = boardMoods
  .map(
    (m) =>
      `<button type="button" class="bs-pill" data-moodword="${m}" aria-pressed="false">${m}</button>`,
  )
  .join('');
$('#bs-moods').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-moodword]');
  if (!b) return;
  const word = b.dataset.moodword ?? '';
  const on = get().basics.moods.includes(word);
  if (!on && get().basics.moods.length >= 3) {
    $('#bs-mood-msg').textContent = 'Three words is plenty. Remove one first.';
    return announce('Three words is plenty. Remove one first.');
  }
  $('#bs-mood-msg').textContent = '';
  update(
    'basics',
    (s) =>
      (s.basics.moods = on ? s.basics.moods.filter((x) => x !== word) : [...s.basics.moods, word]),
  );
  b.setAttribute('aria-pressed', String(!on));
});

// ---------- 4 logo direction ----------
let dirMood = 'All';
function renderDirections() {
  const s = get();
  const list = gallery.filter((g) => dirMood === 'All' || g.mood === dirMood);
  $('#bs-dirs').innerHTML = list
    .map((g) => {
      const on = s.logo.directions.includes(g.slug);
      const thumb =
        document.querySelector<HTMLElement>(`.bs-tile[data-slug="${g.slug}"]`)?.dataset.thumb ?? '';
      return `<li><button type="button" class="bs-dir" data-dir="${g.slug}" aria-pressed="${on}" aria-label="${g.name}, ${g.style}">
        <img src="${thumb}" alt="" width="120" height="150" loading="lazy"><span>${g.name}</span></button></li>`;
    })
    .join('');
  $('#bs-dir-count').textContent = `${s.logo.directions.length} of ${cfg.maxDirections} chosen`;
}
$('#bs-dir-filter').innerHTML = ['All', ...moods]
  .map(
    (m) =>
      `<button type="button" class="bs-pill" data-dirmood="${m}" aria-pressed="${m === 'All'}">${m}</button>`,
  )
  .join('');
$('#bs-dir-filter').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-dirmood]');
  if (!b) return;
  dirMood = b.dataset.dirmood ?? 'All';
  $$('#bs-dir-filter button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderDirections();
});
$('#bs-dirs').addEventListener('click', (e) => {
  const slug = (e.target as HTMLElement).closest<HTMLElement>('[data-dir]')?.dataset.dir;
  if (!slug) return;
  const on = get().logo.directions.includes(slug);
  if (!on && get().logo.directions.length >= cfg.maxDirections)
    return announce('Three is the limit. Remove one first.');
  update('logo', (s) => {
    s.logo.touched = true;
    s.logo.directions = on
      ? s.logo.directions.filter((x) => x !== slug)
      : [...s.logo.directions, slug];
  });
});
$('#bs-logo-types').addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-logo-type]')?.dataset.logoType;
  if (!t) return;
  update(
    'logo',
    (s) =>
      (s.logo.types = s.logo.types.includes(t)
        ? s.logo.types.filter((x) => x !== t)
        : [...s.logo.types, t]),
  );
});
$<HTMLInputElement>('#bs-logo-file').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null;
  update('logo', (s) => (s.logo.existing = f));
  $('#bs-logo-file-name').textContent = f
    ? `${f.name} (kept in your browser until you send)`
    : 'No file chosen';
});
$<HTMLTextAreaElement>('#bs-logo-notes').addEventListener('input', (e) => {
  get().logo.notes = (e.target as HTMLTextAreaElement).value;
});

function paintLogoTypes() {
  const s = get();
  const name = brandName();
  const fam = cssFamily(s.type.display);
  const p = roleColour('Primary');
  const l = roleColour('Light');
  const a = roleColour('Accent');
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const demos: Record<string, string> = {
    wordmark: `<span style="font-family:${fam};color:${p}">${esc(name)}</span>`,
    lettermark: `<span class="bs-ld bs-ld--sq" style="font-family:${fam};background:${p};color:${l}">${esc(initials)}</span>`,
    mascot: `<svg viewBox="0 0 60 60" width="56" height="56" aria-hidden="true"><circle cx="30" cy="30" r="26" fill="${p}"/><circle cx="21" cy="26" r="4.5" fill="${l}"/><circle cx="39" cy="26" r="4.5" fill="${l}"/><circle cx="22" cy="27" r="2" fill="#0B0D0A"/><circle cx="38" cy="27" r="2" fill="#0B0D0A"/><path d="M19 38q11 11 22 0" stroke="${l}" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
    emblem: `<span class="bs-ld bs-ld--ring" style="font-family:${fam};border-color:${p};color:${p}">${esc(name.slice(0, 14))}</span>`,
    combination: `<span class="bs-ld bs-ld--combo" style="font-family:${fam};color:${p}"><i style="background:${a}"></i>${esc(name)}</span>`,
    abstract: `<svg viewBox="0 0 70 50" width="70" height="50" aria-hidden="true"><circle cx="22" cy="26" r="18" fill="${p}"/><rect x="30" y="8" width="32" height="32" fill="${a}" style="mix-blend-mode:multiply"/><path d="M12 48a24 24 0 0 1 48 0z" fill="${readableOn(p)}" opacity=".25"/></svg>`,
  };
  $$('[data-logo-type]').forEach((b) => {
    const id = b.dataset.logoType ?? '';
    b.setAttribute('aria-pressed', String(s.logo.types.includes(id)));
    $('.bs-ltype__demo', b).innerHTML = demos[id] ?? '';
  });
}

// ---------- 6 mockups and guidelines ----------
let mocksBuilt = false;
function paintMockups() {
  const host = $('#bs-mockups');
  if (!mocksBuilt) {
    mocksBuilt = true;
    host.innerHTML = mockupBases
      .map(
        (b) =>
          `<figure class="bs-mockfig" data-fig="${b.id}"><div data-slot></div><figcaption class="label">${b.label}</figcaption></figure>`,
      )
      .join('');
    mockupBases.forEach((b) =>
      $(`[data-fig="${b.id}"] [data-slot]`, host).appendChild(buildMockup(b)),
    );
  }
  $$('.bs-mock', host).forEach((m) => void paintMockup(m));
  renderGuide();
}

function renderGuide() {
  const s = get();
  const dark = roleColour('Dark');
  const light = roleColour('Light');
  const prim = roleColour('Primary');
  const fam = cssFamily(s.type.display);
  const body = cssFamily(s.type.body);
  const name = esc(brandName());
  $('#bs-guide').innerHTML = `
    <div class="bs-g__cell bs-g__cell--logo" style="background:${light};color:${prim}"><span class="label" style="color:${dark}">01 Wordmark</span><p style="font-family:${fam}">${name}</p></div>
    <div class="bs-g__cell bs-g__cell--space" style="background:#fff;color:${dark}">
      <span class="label">02 Clear space</span>
      <div class="bs-g__box"><i>x</i><p style="font-family:${fam};color:${prim}">${name}</p></div>
    </div>
    <div class="bs-g__cell bs-g__cell--pal"><span class="label">03 Colour</span>
      <ul>${s.palette.colours.map((c, i) => `<li style="background:${c};color:${readableOn(c)}"><b>${s.palette.roles[i]}</b><span>${c}</span></li>`).join('')}</ul></div>
    <div class="bs-g__cell bs-g__cell--type" style="background:${dark};color:${light}"><span class="label">04 Type</span>
      <p style="font-family:${fam};font-size:1.6rem;line-height:1">Aa ${name}</p><p style="font-family:${body}">Body text in ${s.type.body === 'dm-sans' ? 'DM Sans' : 'Figtree'}.</p></div>`;
}

// ---------- 7 review ----------
function renderSummary() {
  const s = get();
  const rows: [string, string][] = [
    [
      'Brand',
      `${brandName() === DEFAULT_NAME ? 'Not named yet' : brandName()}${s.basics.does ? `: ${s.basics.does}` : ''}`,
    ],
    ['Moods', s.basics.moods.join(', ') || 'None chosen'],
    [
      'Inspiration',
      `${s.saved.length} saved directions, ${s.uploads.length} files, ${s.links.length} links`,
    ],
    ['Palette', s.palette.colours.map((c, i) => `${s.palette.roles[i]} ${c}`).join(' · ')],
    [
      'Logo directions',
      s.logo.directions.map((x) => gallery.find((g) => g.slug === x)?.name).join(', ') ||
        'None chosen',
    ],
    ['Logo types', s.logo.types.join(', ') || 'None chosen'],
    [
      'Typeface',
      `${cssFamily(s.type.display).split(',')[0].replace(/'/g, '').replace('bs-', '')} and ${s.type.body === 'dm-sans' ? 'DM Sans' : 'Figtree'}`,
    ],
  ];
  $('#bs-summary').innerHTML = rows
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join('');
}

const fields: ['name' | 'email' | 'business' | 'goal' | 'timeline', string][] = [
  ['name', '#bs-r-name'],
  ['email', '#bs-r-email'],
  ['business', '#bs-r-business'],
  ['goal', '#bs-r-goal'],
  ['timeline', '#bs-r-timeline'],
];
for (const [key, sel] of fields) {
  const el = $<HTMLInputElement>(sel);
  el.addEventListener('input', () => (get().review[key] = el.value));
}
$<HTMLInputElement>('#bs-r-consent').addEventListener(
  'change',
  (e) => (get().review.consent = (e.target as HTMLInputElement).checked),
);

$('#bs-send').addEventListener('click', () => {
  const r = get().review;
  const problems: string[] = [];
  if (!r.name.trim()) problems.push('your name');
  if (!/^\S+@\S+\.\S+$/.test(r.email.trim())) problems.push('a valid email');
  if (!r.consent) problems.push('your agreement to share this board');
  const err = $('#bs-review-err');
  err.textContent = problems.length ? `Before we can send: add ${problems.join(', ')}.` : '';
  if (problems.length) {
    announce(err.textContent ?? '');
    (!r.name.trim()
      ? $('#bs-r-name')
      : !/^\S+@\S+\.\S+$/.test(r.email.trim())
        ? $('#bs-r-email')
        : $('#bs-r-consent')
    ).focus();
    return;
  }
  startSignIn();
});

// ---------- preview ----------
mountPreview($('#bs-preview-main'));
mountPreview($('#bs-preview-sheet-body'));
const sheet = $<HTMLDialogElement>('#bs-sheet');
$('#bs-open-preview').addEventListener('click', () => sheet.showModal());
$('#bs-close-preview').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (e) => e.target === sheet && sheet.close());

// ---------- redraw ----------
subscribe((what) => {
  paintDone();
  if (['logo', 'saved'].includes(what)) renderDirections();
  if (['type', 'palette', 'basics', 'logo'].includes(what)) paintLogoTypes();
  if (['type', 'palette', 'basics'].includes(what) && mocksBuilt) paintMockups();
  if (
    ['type', 'palette', 'basics', 'logo', 'saved', 'uploads', 'links'].includes(what) &&
    !$('#bs-body-7').hidden
  )
    renderSummary();
});
renderDirections();
paintLogoTypes();
paintDone();
openStep(1);
document.addEventListener('bs-sent', () => update('sent', () => undefined));
document.documentElement.dataset.board = 'ready';
