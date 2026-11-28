/**
 * Live mockups: a neutral photo with the visitor's name painted into its print area, in their
 * chosen font and colours. 'fill' surfaces (sign, billboard, card) get a Primary rectangle with the
 * name in Light, re-textured with a multiplied copy of the photo so it reads as printed; 'print'
 * surfaces (tote, tee, cup) get the name in Primary, multiplied into the fabric or paper.
 * The name is fitted to its area: measured once at 100px, then sized in container units.
 */
import { mockupBases, type MockupBase } from '../../data/brandStudio';
import { get, brandName, roleColour } from './store';
import { loadFont, cssFamily } from './fonts';

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/brand-studio/bases/`;

let ruler: HTMLSpanElement | null = null;
const widths = new Map<string, number>();

/** Width of `text` at 100px in this family, per pixel of font size. */
function widthPer(text: string, family: string): number {
  const key = `${family}|${text}`;
  const hit = widths.get(key);
  if (hit !== undefined) return hit;
  if (!ruler) {
    ruler = document.createElement('span');
    ruler.setAttribute('aria-hidden', 'true');
    ruler.style.cssText =
      'position:absolute;left:-9999px;top:0;white-space:nowrap;visibility:hidden;font-size:100px;line-height:1;';
    document.body.appendChild(ruler);
  }
  ruler.style.fontFamily = family;
  ruler.textContent = text;
  const w = ruler.getBoundingClientRect().width / 100;
  widths.set(key, w);
  return w;
}

/** The biggest font size (in the area's own width units, 1cqw) at which `name` fits, on 1 or 2 lines. */
export function fitName(
  name: string,
  family: string,
  areaRatio: number,
): { size: number; text: string } {
  const heightCq = 100 * areaRatio; // area height in cqw
  const one = (() => {
    const w = widthPer(name, family);
    return { text: name, size: Math.min(84 / w, (0.74 * heightCq) / 1) };
  })();
  const words = name.split(/\s+/);
  if (words.length < 2) return one;
  // Split nearest the middle of the characters.
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  const a = words.slice(0, best).join(' ');
  const b = words.slice(best).join(' ');
  const w = Math.max(widthPer(a, family), widthPer(b, family));
  const two = { text: `${a}\n${b}`, size: Math.min(84 / w, (0.8 * heightCq) / 2) };
  return two.size > one.size * 1.15 ? two : one;
}

export function buildMockup(base: MockupBase): HTMLElement {
  const [x, y, w, h] = base.area;
  const src = `${BASE}${base.file}`;
  const root = document.createElement('div');
  root.className = `bs-mock bs-mock--${base.surface}`;
  root.dataset.base = base.id;
  root.style.aspectRatio = `${base.w} / ${base.h}`;
  const ratio = ((h / 100) * base.h) / ((w / 100) * base.w);
  root.innerHTML =
    `<img class="bs-mock__photo" src="${src}" alt="" width="${base.w}" height="${base.h}" loading="lazy" decoding="async">` +
    `<div class="bs-mock__area" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%" data-ratio="${ratio}"><span class="bs-mock__text"></span></div>` +
    (base.surface === 'fill'
      ? `<img class="bs-mock__tex" src="${src}" alt="" aria-hidden="true" loading="lazy" decoding="async" style="clip-path:inset(${y}% ${100 - x - w}% ${100 - y - h}% ${x}%)">`
      : '');
  return root;
}

/** Paint the current name, font and colours into a mockup built by buildMockup. */
export async function paintMockup(root: HTMLElement) {
  const { display } = get().type;
  await loadFont(display);
  const family = cssFamily(display);
  const area = root.querySelector<HTMLElement>('.bs-mock__area');
  const text = root.querySelector<HTMLElement>('.bs-mock__text');
  if (!area || !text) return;
  const fill = root.classList.contains('bs-mock--fill');
  const { size, text: shown } = fitName(brandName(), family, Number(area.dataset.ratio));
  text.textContent = shown;
  text.style.fontFamily = family;
  text.style.fontSize = `${size.toFixed(2)}cqw`;
  if (fill) {
    area.style.background = roleColour('Primary');
    text.style.color = roleColour('Light');
  } else {
    area.style.background = 'transparent';
    text.style.color = roleColour('Primary');
  }
}

export const bases = mockupBases;
export const baseById = (id: string) => mockupBases.find((b) => b.id === id) ?? mockupBases[0];
