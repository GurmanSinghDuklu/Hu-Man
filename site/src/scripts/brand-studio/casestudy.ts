/**
 * Case-study switcher and lazy fonts. Every study is in the HTML (readable without script); with
 * JS one shows at a time. A hash with a study's id (#pura, #kira-fit...) opens the matching tab.
 */
import { loadFonts } from './fonts';

const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-cs-tab]')];
const panels = [...document.querySelectorAll<HTMLElement>('[data-cs]')];

function show(id: string, focus = false) {
  if (!panels.some((p) => p.dataset.cs === id)) return;
  for (const t of tabs) {
    const on = t.dataset.csTab === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  }
  for (const p of panels) {
    const on = p.dataset.cs === id;
    p.classList.toggle('is-active', on);
    if (on) void loadFonts((p.dataset.fonts ?? '').split(' ').filter(Boolean));
  }
}

tabs.forEach((t, i) => {
  t.addEventListener('click', () => {
    show(t.dataset.csTab ?? '');
    history.replaceState(null, '', `#${t.dataset.csTab}`);
  });
  t.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = tabs[(i + d + tabs.length) % tabs.length];
    show(next.dataset.csTab ?? '', true);
  });
});

const fromHash = () => {
  const id = location.hash.slice(1);
  if (panels.some((p) => p.dataset.cs === id)) {
    show(id);
    document.getElementById(id)?.scrollIntoView();
  }
};
window.addEventListener('hashchange', fromHash);
if (panels.some((p) => `#${p.dataset.cs}` === location.hash)) fromHash();
else show(panels[0]?.dataset.cs ?? 'pura');

// Fonts for the visible study load when it nears the screen.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const p = e.target as HTMLElement;
      void loadFonts((p.dataset.fonts ?? '').split(' ').filter(Boolean));
    }
  },
  { rootMargin: '900px 0px' },
);
panels.forEach((p) => io.observe(p));
