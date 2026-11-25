/**
 * Step 5, Typeface: all 25 display faces set in the visitor's own brand name, grouped, with the
 * faces of their saved and chosen directions first, plus a body face and a hierarchy preview in
 * their colours. Fonts load only when this step is opened or nears the screen.
 */
import { studioFonts, studioBodyFonts, gallery } from '../../data/brandStudio';
import { fontGroups } from '../../data/brandPage';
import { get, update, subscribe, brandName, roleColour } from './store';
import { loadFonts, cssFamily } from './fonts';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const card = (id: string) => {
  const f = studioFonts.find((x) => x.id === id)!;
  const on = get().type.display === id;
  return `<li><button type="button" class="bs-font" data-font="${id}" aria-pressed="${on}" aria-label="${f.family}, ${f.kind}">
    <span class="bs-font__name" style="font-family:${cssFamily(id)}">${esc(brandName())}</span>
    <span class="bs-font__meta">${f.family} · ${f.kind}</span><span class="bs-font__use">${f.use}</span></button></li>`;
};

function suggestedIds(): string[] {
  const s = get();
  const slugs = [...new Set([...s.logo.directions, ...s.saved])];
  return [
    ...new Set(
      slugs
        .map((slug) => gallery.find((g) => g.slug === slug)?.font)
        .filter((x): x is string => !!x),
    ),
  ];
}

function render() {
  const sug = suggestedIds();
  $('#bs-suggested-wrap').hidden = sug.length === 0;
  $('#bs-suggested').innerHTML = sug.map(card).join('');
  $('#bs-fonts').innerHTML = fontGroups
    .map(
      (g) =>
        `<div class="bs-fontgroup"><h4 class="label">${g.title}</h4><ul class="bs-fontlist">${g.ids.map(card).join('')}</ul></div>`,
    )
    .join('');
  const body = get().type.body;
  $('#bs-body-fonts').innerHTML = studioBodyFonts
    .map(
      (
        f,
      ) => `<li><button type="button" class="bs-font bs-font--body" data-body="${f.id}" aria-pressed="${f.id === body}">
      <span class="bs-font__meta">${f.family}</span>
      <span class="bs-font__body" style="font-family:${cssFamily(f.id)}">We draw it, you check it, then it goes out.</span></button></li>`,
    )
    .join('');
  const { display } = get().type;
  const dark = roleColour('Dark');
  const light = roleColour('Light');
  const prim = roleColour('Primary');
  const acc = roleColour('Accent');
  const prev = $('#bs-type-preview');
  prev.style.background = light;
  prev.style.color = dark;
  prev.innerHTML = `
    <p class="bs-tp__cap" style="font-family:${cssFamily(body)}">Display, ${studioFonts.find((f) => f.id === display)?.family}</p>
    <p class="bs-tp__h1" style="font-family:${cssFamily(display)};color:${prim}">${esc(brandName())}</p>
    <p class="bs-tp__h2" style="font-family:${cssFamily(display)}">${esc(get().basics.does || 'What you do, in one line')}</p>
    <p class="bs-tp__body" style="font-family:${cssFamily(body)}">Body text sits in ${studioBodyFonts.find((f) => f.id === body)?.family}. It stays calm so the name can do the shouting. Keep lines short and spacing generous.</p>
    <p class="bs-tp__cap" style="font-family:${cssFamily(body)}">Caption, 12 px, for small print and labels</p>
    <span class="bs-tp__btn" style="font-family:${cssFamily(body)};background:${acc};color:${dark}">Button</span>`;
}

$('#bs-step-5').addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const f = t.closest<HTMLElement>('[data-font]')?.dataset.font;
  const b = t.closest<HTMLElement>('[data-body]')?.dataset.body;
  if (f)
    update('type', (s) => {
      s.type.display = f;
      s.touched.type = true;
    });
  if (b)
    update('type', (s) => {
      s.type.body = b;
      s.touched.type = true;
    });
});

let loaded = false;
export function loadAll() {
  if (loaded) return;
  loaded = true;
  void loadFonts([
    ...suggestedIds(),
    ...studioFonts.map((f) => f.id),
    ...studioBodyFonts.map((f) => f.id),
  ]);
}
const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && loadAll(), {
  rootMargin: '600px 0px',
});
io.observe($('#bs-step-5'));

subscribe((what) => {
  if (['type', 'basics', 'palette', 'saved', 'logo'].includes(what)) render();
});
render();
