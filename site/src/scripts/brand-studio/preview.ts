/**
 * The live preview: the name in the chosen font, the palette bar, one rotating photo mockup and the
 * saved gallery thumbnails. The same component fills the sticky column on desktop and the
 * bottom sheet on phones.
 */
import { mockupBases } from '../../data/brandStudio';
import { gallery } from '../../data/brandStudio';
import { get, subscribe, brandName, roleColour } from './store';
import { cssFamily, loadFont } from './fonts';
import { buildMockup, paintMockup } from './mockups';
import { readableOn, contrast } from './colour';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function thumbFor(slug: string): string {
  return document.querySelector<HTMLElement>(`.bs-tile[data-slug="${slug}"]`)?.dataset.thumb ?? '';
}

export function mountPreview(host: HTMLElement) {
  host.innerHTML = `
    <p class="bs-pv__name" data-pv-name></p>
    <div class="bs-pv__bar" data-pv-bar></div>
    <div class="bs-pv__mock" data-pv-mock></div>
    <div class="bs-pv__dots" role="group" aria-label="Choose a mockup" data-pv-dots></div>
    <p class="label bs-pv__label">Saved directions</p>
    <ul class="bs-pv__saved" data-pv-saved></ul>`;
  const name = host.querySelector<HTMLElement>('[data-pv-name]')!;
  const bar = host.querySelector<HTMLElement>('[data-pv-bar]')!;
  const mockHost = host.querySelector<HTMLElement>('[data-pv-mock]')!;
  const dots = host.querySelector<HTMLElement>('[data-pv-dots]')!;
  const saved = host.querySelector<HTMLElement>('[data-pv-saved]')!;
  let index = 0;
  let mock = buildMockup(mockupBases[0]);
  mockHost.appendChild(mock);
  dots.innerHTML = mockupBases
    .map(
      (b, i) =>
        `<button type="button" data-i="${i}" aria-label="Show ${b.label}" aria-pressed="${i === 0}"></button>`,
    )
    .join('');

  const show = (i: number) => {
    index = i;
    mock = buildMockup(mockupBases[i]);
    mockHost.replaceChildren(mock);
    dots
      .querySelectorAll('button')
      .forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
    void paintMockup(mock);
  };
  dots.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-i]');
    if (b) show(Number(b.dataset.i));
  });

  const paint = () => {
    const s = get();
    const dark = roleColour('Dark');
    name.textContent = brandName();
    name.style.fontFamily = cssFamily(s.type.display);
    // The name must stay readable whatever palette is loaded: Primary only when it passes AA on Light.
    name.style.color =
      contrast(roleColour('Primary'), roleColour('Light')) >= 4.5 ? roleColour('Primary') : dark;
    name.style.background = roleColour('Light');
    name.style.borderColor = dark;
    void loadFont(s.type.display);
    bar.innerHTML = s.palette.colours
      .map((c) => `<span style="background:${c};color:${readableOn(c)}" title="${c}"></span>`)
      .join('');
    saved.innerHTML = s.saved.length
      ? s.saved
          .map(
            (slug) =>
              `<li><img src="${thumbFor(slug)}" alt="${gallery.find((g) => g.slug === slug)?.name ?? ''}" width="56" height="70"></li>`,
          )
          .join('')
      : '<li class="bs-pv__empty">Nothing saved yet. Save directions from the gallery.</li>';
    void paintMockup(mock);
  };
  subscribe(paint);
  paint();

  if (!reduced) {
    let hover = false;
    host.addEventListener('pointerenter', () => (hover = true));
    host.addEventListener('pointerleave', () => (hover = false));
    setInterval(() => {
      if (!hover && !document.hidden && host.offsetParent) show((index + 1) % mockupBases.length);
    }, 4500);
  }
}
