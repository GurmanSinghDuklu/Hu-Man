/**
 * The gallery (/brand/#gallery) and the shared image viewer: mood filter, "Save to board" toggles
 * (max 6), and a <dialog> that shows a direction large with its palette and typeface, or, for the
 * case-study mockups, just the photo and its caption. <dialog>.showModal() traps focus and Esc closes.
 */
import { gallery, studioFonts, type GalleryItem } from '../../data/brandStudio';
import { brandStudioConfig as cfg } from '../../config/brandStudio';
import { get, subscribe, toggleSaved, setPalette, setDisplayFont, announce } from './store';
import { loadFont, cssFamily } from './fonts';

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => [
  ...root.querySelectorAll<T>(sel),
];

const tiles = $$<HTMLLIElement>('.bs-tile');
const viewer = $<HTMLDialogElement>('#bs-viewer');
let current: string | null = null;
let order: string[] = [];
let returnFocus: HTMLElement | null = null;

// ---------- filter ----------
function filter(mood: string) {
  let shown = 0;
  for (const t of tiles) {
    const show = mood === 'All' || t.dataset.mood === mood;
    t.hidden = !show;
    if (show) shown++;
  }
  const count = $('#bs-count');
  if (count) count.textContent = `Showing ${shown} of ${tiles.length}`;
  announce(`Showing ${shown} of ${tiles.length} directions.`);
}
$$<HTMLButtonElement>('[data-mood-filter]').forEach((chip) =>
  chip.addEventListener('click', () => {
    $$<HTMLButtonElement>('[data-mood-filter]').forEach((c) =>
      c.setAttribute('aria-pressed', String(c === chip)),
    );
    filter(chip.dataset.moodFilter ?? 'All');
  }),
);

// ---------- save toggles ----------
function paintSaved() {
  const saved = get().saved;
  for (const t of tiles) {
    const on = saved.includes(t.dataset.slug ?? '');
    t.classList.toggle('is-saved', on);
    const btn = $<HTMLButtonElement>('[data-save]', t);
    if (btn) {
      btn.setAttribute('aria-pressed', String(on));
      const label = $('.bs-tile__save-text', btn);
      if (label) label.textContent = on ? 'Saved to board' : 'Save to board';
    }
  }
  $$('[data-saved-count]').forEach((el) => (el.textContent = `${saved.length} of ${cfg.maxSaved}`));
  if (current) paintViewerSave();
}
tiles.forEach((t) =>
  $('[data-save]', t)?.addEventListener('click', () => toggleSaved(t.dataset.slug ?? '')),
);
subscribe((what) => (what === 'saved' ? paintSaved() : undefined));
paintSaved();

// ---------- viewer ----------
const item = (slug: string): GalleryItem | undefined => gallery.find((g) => g.slug === slug);
const largeFor = (slug: string) =>
  $<HTMLElement>(`.bs-tile[data-slug="${slug}"]`)?.dataset.large ?? '';

function paintViewerSave() {
  const btn = $<HTMLButtonElement>('#bs-v-save');
  if (!btn || !current) return;
  const on = get().saved.includes(current);
  btn.setAttribute('aria-pressed', String(on));
  btn.textContent = on ? 'Saved to board' : 'Save to board';
}

function showDirection(slug: string) {
  const g = item(slug);
  if (!g || !viewer) return;
  current = slug;
  viewer.classList.remove('is-plain');
  const img = $<HTMLImageElement>('#bs-v-img')!;
  img.src = largeFor(slug);
  img.alt = `${g.name}: a ${g.style.toLowerCase()} identity concept poster`;
  $('#bs-v-kicker')!.textContent = `Concept · ${g.mood}`;
  $('#bs-v-title')!.textContent = g.name;
  $('#bs-v-style')!.textContent = g.style;
  const pal = $('#bs-v-pal')!;
  pal.innerHTML = g.palette
    .map(
      (h) =>
        `<li><span class="bs-chip" style="background:${h}"></span><span class="bs-chip__hex">${h}</span></li>`,
    )
    .join('');
  const font = studioFonts.find((f) => f.id === g.font);
  const sample = $('#bs-v-type')!;
  sample.textContent = g.name;
  sample.style.fontFamily = cssFamily(g.font);
  $('#bs-v-typename')!.textContent = font ? `${font.family} · ${font.kind}` : '';
  void loadFont(g.font);
  paintViewerSave();
  order = tiles.filter((t) => !t.hidden).map((t) => t.dataset.slug ?? '');
}

function openViewer(from: HTMLElement | null) {
  if (!viewer) return;
  returnFocus = from;
  if (!viewer.open) viewer.showModal();
}

function step(dir: 1 | -1) {
  if (!current || viewer?.classList.contains('is-plain')) return;
  const i = order.indexOf(current);
  const next = order[(i + dir + order.length) % order.length];
  if (next) showDirection(next);
}

tiles.forEach((t) =>
  $('[data-view]', t)?.addEventListener('click', (e) => {
    showDirection(t.dataset.slug ?? '');
    openViewer(e.currentTarget as HTMLElement);
  }),
);

// Case-study photos open the same viewer, in plain mode.
$$<HTMLButtonElement>('[data-zoom-src]').forEach((b) =>
  b.addEventListener('click', () => {
    if (!viewer) return;
    current = null;
    viewer.classList.add('is-plain');
    const img = $<HTMLImageElement>('#bs-v-img')!;
    img.src = b.dataset.zoomSrc ?? '';
    img.alt = b.dataset.zoomAlt ?? '';
    $('#bs-v-kicker')!.textContent = b.dataset.zoomKicker ?? 'Concept';
    $('#bs-v-title')!.textContent = b.dataset.zoomCaption ?? '';
    $('#bs-v-style')!.textContent = '';
    openViewer(b);
  }),
);

$('#bs-v-prev')?.addEventListener('click', () => step(-1));
$('#bs-v-next')?.addEventListener('click', () => step(1));
$('#bs-v-save')?.addEventListener('click', () => current && toggleSaved(current));
$('#bs-v-usepal')?.addEventListener('click', () => {
  const g = current && item(current);
  if (!g) return;
  setPalette(`${g.name} direction`, g.palette);
});
$('#bs-v-usefont')?.addEventListener('click', () => {
  const g = current && item(current);
  if (!g) return;
  setDisplayFont(g.font);
  announce(
    `${studioFonts.find((f) => f.id === g.font)?.family ?? 'Typeface'} chosen as your display typeface.`,
  );
});
$$('[data-close]', viewer ?? document).forEach((b) =>
  b.addEventListener('click', () => viewer?.close()),
);
viewer?.addEventListener('click', (e) => {
  if (e.target === viewer) viewer.close(); // a press on the backdrop
});
viewer?.addEventListener('close', () => returnFocus?.focus());
viewer?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
