/**
 * /account/brief/?p=<project>: the brief, one step at a time. Answers save to the server as the
 * client goes (a moment after they stop typing, and on every step change), never to the browser.
 * Uploads go one file at a time. Once sent, the page shows a read-only summary.
 */
import {
  api,
  requireLogin,
  setStatus,
  showErrors,
  el,
  formatDate,
  sitePath,
  UNAVAILABLE,
} from './api';
import { stepsFor, answerText, type BriefAnswers, type ProjectType } from '../../data/brief';

interface FileInfo {
  id: string;
  field: string;
  name: string;
  type: string;
  size: number;
}
interface Brief {
  project: {
    id: string;
    name: string;
    type: ProjectType;
    tier: string | null;
    concept: string | null;
  };
  state: 'draft' | 'sent';
  answers: BriefAnswers;
  updatedAt: number | null;
  files: FileInfo[];
}

const form = document.querySelector<HTMLFormElement>('[data-brief]');
const readonly = document.querySelector<HTMLElement>('[data-readonly]');
const projectId = new URLSearchParams(location.search).get('p') ?? '';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = /\.(jpe?g|png|webp|svg|pdf)$/i;

let brief: Brief;
let files: FileInfo[] = [];
let steps: HTMLElement[] = [];
let current = 0;

const fields = () => [...form!.querySelectorAll<HTMLElement>('[data-field]')];
const sizeText = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`;

// ---------- reading and filling answers ----------

function readAnswers(): BriefAnswers {
  const answers: BriefAnswers = {};
  for (const wrap of fields()) {
    const id = wrap.dataset.field!;
    const kind = wrap.dataset.kind;
    if (kind === 'files') continue;
    if (kind === 'consent') {
      if (wrap.querySelector<HTMLInputElement>('input')?.checked) answers[id] = true;
    } else if (kind === 'choice') {
      const picked = wrap.querySelector<HTMLInputElement>('input:checked');
      if (picked) answers[id] = picked.value;
    } else if (kind === 'checks') {
      const picked = [...wrap.querySelectorAll<HTMLInputElement>('input:checked')].map(
        (i) => i.value,
      );
      if (picked.length) answers[id] = picked;
    } else if (kind === 'repeat') {
      const cards = [...wrap.querySelectorAll<HTMLElement>('[data-repeat-card]')].map((card) => {
        const out: Record<string, string> = {};
        card
          .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-part]')
          .forEach((input) => {
            if (input.value.trim()) out[input.dataset.part!] = input.value;
          });
        return out;
      });
      const kept = cards.filter((c) => Object.keys(c).length);
      if (kept.length) answers[id] = kept;
    } else {
      const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (input?.value.trim()) answers[id] = input.value;
    }
  }
  return answers;
}

function addCard(wrap: HTMLElement, values: Record<string, string> = {}) {
  const list = wrap.querySelector<HTMLElement>('[data-repeat-list]')!;
  const template = wrap.querySelector<HTMLTemplateElement>('[data-repeat-template]')!;
  const max = Number(wrap.dataset.max ?? 10);
  if (list.children.length >= max) return null;
  const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  const n = list.children.length + 1;
  card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-part]').forEach((input) => {
    const uid = `b-${wrap.dataset.field}-${n}-${input.dataset.part}-${Math.random().toString(36).slice(2, 7)}`;
    input.id = uid;
    card
      .querySelector<HTMLLabelElement>(`[data-part-label="${input.dataset.part}"]`)
      ?.setAttribute('for', uid);
    input.value = values[input.dataset.part!] ?? '';
  });
  card.querySelector<HTMLButtonElement>('[data-repeat-remove]')!.addEventListener('click', () => {
    card.remove();
    renumber(wrap);
    scheduleSave();
    wrap.querySelector<HTMLButtonElement>('[data-repeat-add]')?.focus();
  });
  list.append(card);
  renumber(wrap);
  return card;
}

function renumber(wrap: HTMLElement) {
  const cards = [...wrap.querySelectorAll<HTMLElement>('[data-repeat-card]')];
  cards.forEach((card, i) => {
    card.querySelector('[data-repeat-number]')!.textContent = `${i + 1} of ${wrap.dataset.max}`;
    card
      .querySelector('[data-repeat-remove]')!
      .setAttribute('aria-label', `Remove number ${i + 1}`);
  });
  const add = wrap.querySelector<HTMLButtonElement>('[data-repeat-add]');
  if (add) add.hidden = cards.length >= Number(wrap.dataset.max ?? 10);
}

function fill(answers: BriefAnswers) {
  for (const wrap of fields()) {
    const id = wrap.dataset.field!;
    const value = answers[id];
    const kind = wrap.dataset.kind;
    if (kind === 'repeat') {
      const cards = Array.isArray(value) ? (value as Record<string, string>[]) : [];
      cards.forEach((card) => addCard(wrap, card));
      if (!cards.length) addCard(wrap);
    } else if (kind === 'consent') {
      wrap.querySelector<HTMLInputElement>('input')!.checked = value === true;
    } else if (kind === 'choice' || kind === 'checks') {
      const picked = new Set(Array.isArray(value) ? value : [value]);
      wrap
        .querySelectorAll<HTMLInputElement>('input')
        .forEach((i) => (i.checked = picked.has(i.value)));
    } else if (kind !== 'files' && typeof value === 'string') {
      const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (input) input.value = value;
    }
  }
}

// ---------- saving ----------

const saveState = () => form!.querySelector<HTMLElement>('[data-save-state]')!;
let timer: number | undefined;
let saving: Promise<boolean> = Promise.resolve(true);

function scheduleSave() {
  window.clearTimeout(timer);
  saveState().textContent = 'Unsaved changes…';
  timer = window.setTimeout(() => void save(), 1500);
}

function save(): Promise<boolean> {
  window.clearTimeout(timer);
  saving = saving.then(async () => {
    const { status } = await api(`/api/account/brief?p=${encodeURIComponent(projectId)}`, {
      method: 'PUT',
      body: { answers: readAnswers() },
    });
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
      new Date(),
    );
    saveState().textContent =
      status === 200
        ? `Saved at ${time}.`
        : status === 409
          ? 'This brief has been sent, so changes can’t be saved.'
          : 'Couldn’t save just now. Check your connection; we’ll try again when you carry on.';
    return status === 200;
  });
  return saving;
}

// ---------- files ----------

function renderFiles(field: string) {
  const list = form!.querySelector<HTMLElement>(`[data-file-list="${field}"]`);
  if (!list) return;
  list.replaceChildren(
    ...files
      .filter((f) => f.field === field)
      .map((file) => {
        const remove = el('button', {
          type: 'button',
          class: 'acct__logout',
          text: 'Remove',
          'aria-label': `Remove ${file.name}`,
        });
        remove.addEventListener('click', async () => {
          remove.setAttribute('disabled', '');
          const { status, data } = await api(`/api/account/files/${encodeURIComponent(file.id)}`, {
            method: 'DELETE',
          });
          if (status === 200) {
            files = files.filter((f) => f.id !== file.id);
            renderFiles(field);
            setStatus(`Removed ${file.name}.`, 'ok');
          } else {
            remove.removeAttribute('disabled');
            setStatus(data.error ?? UNAVAILABLE, 'warn');
          }
        });
        return el(
          'li',
          {},
          el('a', {
            class: 'acct-link',
            href: sitePath(`/api/account/files/${encodeURIComponent(file.id)}`),
            target: '_blank',
            rel: 'noopener',
            text: `${file.name} (${sizeText(file.size)})`,
          }),
          remove,
        );
      }),
  );
}

async function upload(input: HTMLInputElement) {
  const field = input.dataset.fileInput!;
  const chosen = [...(input.files ?? [])];
  input.value = '';
  for (const file of chosen) {
    if (!ALLOWED.test(file.name)) {
      setStatus(`${file.name}: please upload a JPG, PNG, WebP, SVG or PDF.`, 'warn');
      continue;
    }
    if (file.size > MAX_BYTES) {
      setStatus(`${file.name} is over 10 MB. Please send a smaller copy.`, 'warn');
      continue;
    }
    setStatus(`Uploading ${file.name}…`);
    const { status, data } = await api<{ file: FileInfo }>(
      `/api/account/files?p=${encodeURIComponent(projectId)}&field=${encodeURIComponent(field)}`,
      {
        method: 'POST',
        body: file,
        headers: {
          'X-File-Name': encodeURIComponent(file.name),
          'Content-Type': file.type || 'application/octet-stream',
        },
      },
    );
    if (status === 201) {
      files.push(data.file);
      renderFiles(field);
      setStatus(`Uploaded ${file.name}.`, 'ok');
    } else {
      setStatus(`${file.name}: ${data.error ?? UNAVAILABLE}`, 'warn');
      return;
    }
  }
}

// ---------- steps ----------

function showStep(index: number, focus = true) {
  current = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, i) => (step.hidden = i !== current));
  const last = current === steps.length - 1;
  form!.querySelector<HTMLElement>('[data-back]')!.hidden = current === 0;
  form!.querySelector<HTMLElement>('[data-next]')!.hidden = last;
  form!.querySelector<HTMLElement>('[data-send]')!.hidden = !last;
  form!.querySelector('[data-progress]')!.textContent =
    `Step ${current + 1} of ${steps.length}: ${steps[current].querySelector('h2')!.textContent}`;
  form!.querySelector<HTMLElement>('[data-progress-bar]')!.style.width =
    `${((current + 1) / steps.length) * 100}%`;
  if (last) renderReview(form!.querySelector<HTMLElement>('[data-review]')!);
  if (focus) {
    const heading = steps[current].querySelector<HTMLElement>('h2')!;
    heading.focus({ preventScroll: true });
    form!.scrollIntoView({ block: 'start' });
  }
}

function renderReview(target: HTMLElement) {
  const answers = readonly && !readonly.hidden ? brief.answers : readAnswers();
  const blocks: HTMLElement[] = [];
  for (const step of stepsFor(brief.project.type)) {
    if (step.id === 'send') continue;
    const rows: HTMLElement[] = [];
    for (const field of step.fields) {
      const text =
        field.kind === 'files'
          ? files
              .filter((f) => f.field === field.id)
              .map((f) => f.name)
              .join(', ')
          : answerText(field, answers[field.id]);
      if (text) rows.push(el('div', {}, el('dt', { text: field.label }), el('dd', { text })));
    }
    blocks.push(
      el(
        'section',
        { class: 'acct-card' },
        el('h3', { text: step.title }),
        rows.length
          ? el('dl', { class: 'acct-dl' }, ...rows)
          : el('p', { class: 'acct-small', text: 'Nothing added.' }),
      ),
    );
  }
  target.replaceChildren(...blocks);
}

async function send() {
  await save();
  const { status, data } = await api(`/api/account/brief/send?p=${encodeURIComponent(projectId)}`, {
    method: 'POST',
    body: { answers: readAnswers() },
  });
  if (status === 200) {
    brief.state = 'sent';
    brief.answers = readAnswers();
    showReadOnly(Date.now());
    setStatus('Brief sent. Thank you: a person will read it and reply by email.', 'ok');
    return;
  }
  if (status === 400 && data.errors) {
    const firstId = Object.keys(data.errors)[0];
    const step = steps.findIndex((s) => s.querySelector(`[data-field="${CSS.escape(firstId)}"]`));
    if (step >= 0) showStep(step, false);
    showErrors(form!, data.errors);
    setStatus(data.error ?? 'A few things need filling in before you send.', 'warn');
    return;
  }
  setStatus(data.error ?? UNAVAILABLE, 'warn');
}

function showReadOnly(sentAt: number | null) {
  form!.hidden = true;
  readonly!.hidden = false;
  readonly!.replaceChildren();
  const holder = el('div', { class: 'breview' });
  renderReview(holder);
  readonly!.append(
    el('p', {
      class: 'acct-small',
      text: `You sent this brief${sentAt ? ` on ${formatDate(sentAt)}` : ''}. It’s locked now; if you need to change something, just ask us.`,
    }),
    holder,
  );
}

// ---------- start ----------

async function start() {
  if (!form || !readonly) return;
  const me = await requireLogin();
  if (!me) return;
  const { status, data } = await api<Brief>(
    `/api/account/brief?p=${encodeURIComponent(projectId)}`,
  );
  if (status === 404) {
    setStatus(
      'We couldn’t find that brief. Go back to your account and open it from there.',
      'warn',
    );
    return;
  }
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return;
  }
  brief = data;
  files = data.files;
  const { type, tier, concept, name } = brief.project;
  document.querySelector('[data-acct-title]')!.textContent = `Brief: ${name}`;

  // Keep only this project type's questions, and the steps that still have some.
  for (const wrap of fields()) {
    const types = wrap.dataset.types?.split(' ').filter(Boolean) ?? [];
    if (types.length && !types.includes(type)) wrap.remove();
  }
  steps = [...form.querySelectorAll<HTMLElement>('[data-step]')].filter((step) => {
    if (step.querySelector('[data-field]')) return true;
    step.remove();
    return false;
  });

  // Features outside this project's tier: talked through on a call.
  form.querySelectorAll<HTMLElement>('[data-in]').forEach((option) => {
    const inTiers = option.dataset.in!.split('|').filter(Boolean);
    const note = option.querySelector<HTMLElement>('[data-tier-note]');
    if (note && tier && !inTiers.includes(tier))
      note.textContent = 'We’ll talk about this on a call';
  });

  if (brief.state === 'sent') {
    showReadOnly(me.projects.find((p) => p.id === projectId)?.sentAt ?? null);
    return;
  }

  const answers = { ...brief.answers };
  if (concept && answers.concept === undefined) answers.concept = concept;
  fill(answers);
  for (const wrap of fields().filter((w) => w.dataset.kind === 'files'))
    renderFiles(wrap.dataset.field!);

  form.querySelectorAll<HTMLElement>('[data-repeat-add]').forEach((button) =>
    button.addEventListener('click', () => {
      const wrap = button.closest<HTMLElement>('[data-field]')!;
      addCard(wrap)?.querySelector<HTMLElement>('[data-part]')?.focus();
    }),
  );
  form
    .querySelectorAll<HTMLInputElement>('[data-file-input]')
    .forEach((input) => input.addEventListener('change', () => void upload(input)));
  form.addEventListener('input', (event) => {
    const target = event.target as HTMLElement;
    // A field's error goes as soon as it's touched again.
    const wrap = target.closest<HTMLElement>('[data-field]');
    if (wrap?.hasAttribute('data-invalid')) {
      wrap.removeAttribute('data-invalid');
      const error = wrap.querySelector<HTMLElement>('[data-error-for]');
      if (error) error.textContent = '';
    }
    if (!target.matches('[data-file-input]')) scheduleSave();
  });
  form.querySelector('[data-next]')!.addEventListener('click', () => {
    void save();
    showStep(current + 1);
  });
  form.querySelector('[data-back]')!.addEventListener('click', () => {
    void save();
    showStep(current - 1);
  });
  form.querySelector('[data-send]')!.addEventListener('click', () => void send());
  form
    .querySelector<HTMLAnchorElement>('[data-later]')!
    .addEventListener('click', async (event) => {
      event.preventDefault();
      await save();
      location.href = sitePath('/account/');
    });

  form.hidden = false;
  showStep(0, false);
}

void start();
