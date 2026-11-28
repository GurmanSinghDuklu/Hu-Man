/**
 * Step 3, Colour: a Coolors-style generator bar (up to five columns: lock, copy, reorder, remove,
 * role), nine generator modes, the 159-palette library with theme chips and search, and AA checks.
 * The bar is the selection: whatever is in it is what the board sends.
 */
import { palettes, paletteThemes } from '../../data/brandStudio';
import { get, update, subscribe, setPalette, announce } from './store';
import {
  MODES,
  ROLES,
  generate,
  colourName,
  readableOn,
  verdict,
  autoRoles,
  type Mode,
  type Role,
} from './colour';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);
const MAX = 5;
const LIMIT = 'Five is plenty. Unlock or remove one first.';

let mode: Mode = 'Random';
let theme = 'All';
let query = '';
let shown = 24;
const bar = $('#bs-bar')!;
const msg = $('#bs-colour-msg')!;

function say(text: string) {
  msg.textContent = text;
  announce(text);
}

// ---------- the bar ----------
function render(wipeFrom?: string[]) {
  const { colours, locked, roles } = get().palette;
  const focus = document.activeElement as HTMLElement | null;
  const key = focus?.closest('#bs-bar')
    ? `${focus.dataset.act}:${focus.closest<HTMLElement>('.bs-col')?.dataset.i}`
    : '';
  bar.style.setProperty('--n', String(colours.length));
  bar.innerHTML = colours
    .map((c, i) => {
      const fg = readableOn(c);
      const name = colourName(c);
      const wipe = wipeFrom && wipeFrom[i] !== c;
      return `<div class="bs-col${wipe ? ' is-wipe' : ''}" data-i="${i}" draggable="true" style="--bg:${c};--fg:${fg};--from:${wipeFrom?.[i] ?? c};--d:${i * 0.05}s">
        <div class="bs-col__tools">
          <button type="button" data-act="lock" aria-pressed="${locked[i]}" aria-label="Lock ${name} ${c}">${locked[i] ? 'Locked' : 'Lock'}</button>
          <button type="button" data-act="copy" aria-label="Copy ${c}">Copy</button>
          <span class="bs-col__move">
            <button type="button" data-act="left" aria-label="Move ${name} left"${i === 0 ? ' disabled' : ''}>&larr;</button>
            <button type="button" data-act="right" aria-label="Move ${name} right"${i === colours.length - 1 ? ' disabled' : ''}>&rarr;</button>
          </span>
          <button type="button" data-act="remove" aria-label="Remove ${name} ${c}"${colours.length < 2 ? ' disabled' : ''}>Remove</button>
        </div>
        <div class="bs-col__info">
          <span class="bs-col__hex">${c.slice(1)}</span>
          <span class="bs-col__name">${name}</span>
          <label class="visually-hidden" for="bs-role-${i}">Role of ${name} ${c}</label>
          <select id="bs-role-${i}" data-role>${ROLES.map((r) => `<option${r === roles[i] ? ' selected' : ''}>${r}</option>`).join('')}</select>
        </div>
      </div>`;
    })
    .join('');
  if (key)
    bar
      .querySelector<HTMLElement>(
        `.bs-col[data-i="${key.split(':')[1]}"] [data-act="${key.split(':')[0]}"]`,
      )
      ?.focus();
  renderChecks();
}

function renderChecks() {
  const { colours, roles } = get().palette;
  const at = (r: Role) => colours[roles.indexOf(r)];
  const rows: [string, string | undefined, string | undefined][] = [
    ['Dark on Light', at('Dark'), at('Light')],
    ['Light on Primary', at('Light'), at('Primary')],
  ];
  $('#bs-checks')!.innerHTML = rows
    .map(([label, fg, bg]) => {
      if (!fg || !bg)
        return `<li><span>${label}</span><span class="bs-check__v">Needs both roles</span></li>`;
      const v = verdict(fg, bg);
      return `<li class="${v.pass ? 'is-pass' : 'is-fail'}"><span class="bs-check__sw" style="background:${bg};color:${fg}">Aa</span><span>${label}</span><span class="bs-check__v">${v.label}</span></li>`;
    })
    .join('');
}

function doGenerate() {
  const p = get().palette;
  const before = [...p.colours];
  update('palette', (s) => {
    s.palette.colours = generate(mode, s.palette.colours, s.palette.locked);
    s.palette.roles =
      s.palette.roles.length === s.palette.colours.length
        ? s.palette.roles
        : autoRoles(s.palette.colours);
    s.palette.name = `${mode} palette`;
    s.touched.colour = true;
  });
  render(before);
  say(`New ${mode.toLowerCase()} palette. ${get().palette.locked.filter(Boolean).length} locked.`);
}

export function addColour(hex?: string): boolean {
  const p = get().palette;
  if (p.colours.length >= MAX) {
    say(LIMIT);
    return false;
  }
  update('palette', (s) => {
    const next =
      hex ?? generate(mode, [...s.palette.colours, '#000000'], [...s.palette.locked, false]).pop()!;
    s.palette.colours.push(next);
    s.palette.locked.push(false);
    s.palette.roles = autoRoles(s.palette.colours);
    s.touched.colour = true;
  });
  say(
    `${colourName(get().palette.colours.at(-1)!)} added. ${get().palette.colours.length} of ${MAX} colours.`,
  );
  return true;
}

function move(i: number, to: number) {
  if (to < 0 || to >= get().palette.colours.length || to === i) return;
  update('palette', (s) => {
    for (const arr of [s.palette.colours, s.palette.locked, s.palette.roles] as unknown[][]) {
      const [x] = arr.splice(i, 1);
      arr.splice(to, 0, x);
    }
    s.touched.colour = true;
  });
}

bar.addEventListener('click', async (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-act]');
  if (!btn) return;
  const i = Number(btn.closest<HTMLElement>('.bs-col')?.dataset.i);
  const { colours } = get().palette;
  switch (btn.dataset.act) {
    case 'lock':
      update('palette', (s) => (s.palette.locked[i] = !s.palette.locked[i]));
      say(`${colourName(colours[i])} ${get().palette.locked[i] ? 'locked' : 'unlocked'}.`);
      break;
    case 'copy':
      try {
        await navigator.clipboard.writeText(colours[i]);
        say(`${colours[i]} copied.`);
      } catch {
        say(`${colours[i]}. Copying isn't available here: select the hex and copy it.`);
      }
      break;
    case 'left':
      move(i, i - 1);
      break;
    case 'right':
      move(i, i + 1);
      break;
    case 'remove':
      update('palette', (s) => {
        for (const arr of [s.palette.colours, s.palette.locked, s.palette.roles] as unknown[][])
          arr.splice(i, 1);
        s.palette.roles = autoRoles(s.palette.colours);
        s.touched.colour = true;
      });
      say(`Colour removed. ${get().palette.colours.length} of ${MAX} colours.`);
      break;
  }
});

// Re-assigning a role swaps it with the colour that had it, so each role stays unique.
bar.addEventListener('change', (e) => {
  const sel = (e.target as HTMLElement).closest<HTMLSelectElement>('select[data-role]');
  if (!sel) return;
  const i = Number(sel.closest<HTMLElement>('.bs-col')?.dataset.i);
  const role = sel.value as Role;
  update('palette', (s) => {
    const j = s.palette.roles.indexOf(role);
    if (j >= 0 && j !== i) s.palette.roles[j] = s.palette.roles[i];
    s.palette.roles[i] = role;
    s.touched.colour = true;
  });
});

// Drag to reorder.
let dragFrom = -1;
bar.addEventListener('dragstart', (e) => {
  const col = (e.target as HTMLElement).closest<HTMLElement>('.bs-col');
  if (!col) return;
  dragFrom = Number(col.dataset.i);
  e.dataTransfer?.setData('text/plain', String(dragFrom));
});
bar.addEventListener('dragover', (e) => e.preventDefault());
bar.addEventListener('drop', (e) => {
  e.preventDefault();
  const col = (e.target as HTMLElement).closest<HTMLElement>('.bs-col');
  if (col && dragFrom >= 0) move(dragFrom, Number(col.dataset.i));
  dragFrom = -1;
});

// Space makes a new palette when focus is on the bar itself, not in a field or on a button.
$('#bs-bar-wrap')!.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (e.code !== 'Space' || t.closest('input, textarea, select, button, a')) return;
  e.preventDefault();
  doGenerate();
});

$('#bs-generate')!.addEventListener('click', doGenerate);
$('#bs-add-colour')!.addEventListener('click', () => addColour());

// Modes.
$('#bs-modes')!.innerHTML = MODES.map(
  (m) =>
    `<button type="button" class="bs-pill" data-mode="${m}" aria-pressed="${m === mode}">${m}</button>`,
).join('');
$('#bs-modes')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-mode]');
  if (!b) return;
  mode = b.dataset.mode as Mode;
  $('#bs-modes')!
    .querySelectorAll('button')
    .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  doGenerate();
});

// ---------- library ----------
const themes = ['All', ...paletteThemes];
$('#bs-themes')!.innerHTML = themes
  .map(
    (t) =>
      `<button type="button" class="bs-pill" data-theme="${t}" aria-pressed="${t === theme}">${t}</button>`,
  )
  .join('');

function matches() {
  const q = query.trim().toLowerCase();
  return palettes.filter(
    (p) =>
      (theme === 'All' || p.theme === theme) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.colours.some((c) => c.toLowerCase().includes(q.replace('#', '')))),
  );
}

function renderLibrary() {
  const list = matches();
  const slice = list.slice(0, shown);
  $('#bs-lib')!.innerHTML = slice.length
    ? slice
        .map(
          (
            p,
          ) => `<li><button type="button" class="bs-pal" data-name="${p.name}" aria-label="Load ${p.name} palette: ${p.colours.join(', ')}">
          <span class="bs-pal__strip">${p.colours.map((c) => `<span style="background:${c}"></span>`).join('')}</span>
          <span class="bs-pal__name">${p.name}</span><span class="bs-pal__theme">${p.theme}</span></button></li>`,
        )
        .join('')
    : '<li class="bs-empty">No palettes match. Try another theme or word.</li>';
  const more = $<HTMLButtonElement>('#bs-lib-more')!;
  more.hidden = list.length <= shown;
  more.textContent = `Show more palettes (${list.length - shown} left)`;
  $('#bs-lib-count')!.textContent = `${list.length} palette${list.length === 1 ? '' : 's'}`;
}
$('#bs-themes')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-theme]');
  if (!b) return;
  theme = b.dataset.theme ?? 'All';
  shown = 24;
  $('#bs-themes')!
    .querySelectorAll('button')
    .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  renderLibrary();
});
$<HTMLInputElement>('#bs-search')!.addEventListener('input', (e) => {
  query = (e.target as HTMLInputElement).value;
  shown = 24;
  renderLibrary();
});
$('#bs-lib-more')!.addEventListener('click', () => {
  shown += 24;
  renderLibrary();
});
$('#bs-lib')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-name]');
  const p = palettes.find((x) => x.name === b?.dataset.name);
  if (p) {
    setPalette(p.name, p.colours);
    $('#bs-colour-msg')!.textContent = `${p.name} loaded.`;
  }
});

subscribe((what) => {
  if (what === 'palette') render();
});
render();
renderLibrary();
