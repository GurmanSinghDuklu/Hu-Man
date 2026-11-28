/**
 * Step 2, Inspiration: drag-and-drop or choose images and short videos (max 12, shown from object
 * URLs, nothing uploaded until the visitor sends), pasted links, the saved gallery directions, and
 * five colours pulled from each image with k-means. Files live in memory only.
 */
import { gallery } from '../../data/brandStudio';
import { brandStudioConfig as cfg } from '../../config/brandStudio';
import { get, update, subscribe, toggleSaved, announce, type UploadItem } from './store';
import { extractColours } from './colour';
import { addColour } from './colour-ui';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
let seq = 0;

function pullColours(item: UploadItem) {
  if (item.kind !== 'image') return;
  const img = new Image();
  img.onload = () => {
    const w = 64;
    const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    const colours = extractColours(ctx.getImageData(0, 0, w, h).data, 5);
    update('uploads', () => (item.colours = colours));
  };
  img.src = item.url;
}

function addFiles(files: FileList | File[]) {
  const incoming = [...files].filter(
    (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
  );
  const room = cfg.maxUploads - get().uploads.length;
  if (incoming.length > room)
    announce(`Twelve files is the limit. ${Math.max(room, 0)} added, the rest left out.`);
  for (const file of incoming.slice(0, Math.max(room, 0))) {
    const item: UploadItem = {
      id: `u${++seq}`,
      file,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      note: '',
      colours: [],
    };
    update('uploads', (s) => s.uploads.push(item));
    pullColours(item);
  }
}

const input = $<HTMLInputElement>('#bs-files');
const drop = $('#bs-drop');
input.addEventListener('change', () => {
  if (input.files) addFiles(input.files);
  input.value = '';
});
['dragenter', 'dragover'].forEach((t) =>
  drop.addEventListener(t, (e) => {
    e.preventDefault();
    drop.classList.add('is-over');
  }),
);
['dragleave', 'drop'].forEach((t) =>
  drop.addEventListener(t, () => drop.classList.remove('is-over')),
);
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  if ((e as DragEvent).dataTransfer?.files) addFiles((e as DragEvent).dataTransfer!.files);
});

// Links.
function addLink() {
  const field = $<HTMLInputElement>('#bs-link');
  const raw = field.value.trim();
  if (!raw) return;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!url.hostname.includes('.')) throw new Error('host');
    if (get().links.length >= cfg.maxUploads) return announce('Twelve links is the limit.');
    update('links', (s) => s.links.push(url.toString()));
    field.value = '';
    $('#bs-link-msg').textContent = '';
  } catch {
    $('#bs-link-msg').textContent = 'That doesn’t look like a web address. Check it and try again.';
  }
}
$('#bs-link-add').addEventListener('click', addLink);
$('#bs-link').addEventListener('keydown', (e) => {
  if ((e as KeyboardEvent).key === 'Enter') {
    e.preventDefault();
    addLink();
  }
});

function render() {
  const s = get();
  $('#bs-uploads').innerHTML = s.uploads
    .map(
      (u, i) => `<li class="bs-up" data-id="${u.id}">
        <div class="bs-up__media">${
          u.kind === 'video'
            ? `<video src="${u.url}#t=0.1" muted playsinline preload="metadata" aria-label="Video ${i + 1}: ${esc(u.file.name)}"></video>`
            : `<img src="${u.url}" alt="Upload ${i + 1}: ${esc(u.file.name)}">`
        }</div>
        <label class="visually-hidden" for="bs-note-${u.id}">Note for ${esc(u.file.name)}</label>
        <input id="bs-note-${u.id}" type="text" data-note placeholder="Note (optional)" value="${esc(u.note)}" maxlength="140">
        <button type="button" class="bs-x" data-remove aria-label="Remove ${esc(u.file.name)}">Remove</button>
      </li>`,
    )
    .join('');
  $('#bs-up-count').textContent = `${s.uploads.length} of ${cfg.maxUploads} files`;
  $('#bs-links').innerHTML = s.links
    .map(
      (l, i) =>
        `<li class="bs-link"><span>${esc(l.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span><button type="button" class="bs-x" data-link="${i}" aria-label="Remove link ${esc(l)}">Remove</button></li>`,
    )
    .join('');
  $('#bs-saved').innerHTML = s.saved.length
    ? s.saved
        .map((slug) => {
          const g = gallery.find((x) => x.slug === slug);
          const thumb =
            document.querySelector<HTMLElement>(`.bs-tile[data-slug="${slug}"]`)?.dataset.thumb ??
            '';
          return `<li class="bs-sv"><img src="${thumb}" alt="" width="64" height="80"><span>${g?.name}</span><button type="button" class="bs-x" data-unsave="${slug}" aria-label="Remove ${g?.name} from your board">Remove</button></li>`;
        })
        .join('')
    : '<li class="bs-empty">Nothing saved. Use “Save to board” on any direction in the gallery.</li>';
  const colours = [...new Set(s.uploads.flatMap((u) => u.colours))];
  $('#bs-extracted-wrap').hidden = colours.length === 0;
  $('#bs-extracted').innerHTML = colours
    .map(
      (c) =>
        `<li><button type="button" class="bs-swatch" data-add="${c}" style="background:${c}" aria-label="Add ${c} to your palette"><span>${c.slice(1)}</span></button></li>`,
    )
    .join('');
}

$('#bs-uploads').addEventListener('click', (e) => {
  const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
  if (!(e.target as HTMLElement).closest('[data-remove]') || !id) return;
  const u = get().uploads.find((x) => x.id === id);
  if (u) URL.revokeObjectURL(u.url);
  update('uploads', (s) => (s.uploads = s.uploads.filter((x) => x.id !== id)));
});
$('#bs-uploads').addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  const id = t.closest<HTMLElement>('[data-id]')?.dataset.id;
  const u = get().uploads.find((x) => x.id === id);
  if (u && t.matches('[data-note]')) u.note = t.value; // typing must not redraw the field
});
$('#bs-links').addEventListener('click', (e) => {
  const i = (e.target as HTMLElement).closest<HTMLElement>('[data-link]')?.dataset.link;
  if (i !== undefined) update('links', (s) => s.links.splice(Number(i), 1));
});
$('#bs-saved').addEventListener('click', (e) => {
  const slug = (e.target as HTMLElement).closest<HTMLElement>('[data-unsave]')?.dataset.unsave;
  if (slug) toggleSaved(slug);
});
$('#bs-extracted').addEventListener('click', (e) => {
  const c = (e.target as HTMLElement).closest<HTMLElement>('[data-add]')?.dataset.add;
  if (c) addColour(c);
});

subscribe((what) => {
  if (what === 'uploads' || what === 'links' || what === 'saved') render();
});
render();
