/**
 * The portfolio request form on /portfolio/ (components/account/RequestForm.astro).
 * - The design comes from ?concept= (the "Choose this concept" buttons); ?p=<project> reopens a saved
 *   request to change it (the instant route's "Edit and rebuild").
 * - Send: checked here first; logged out → the sign-in panel opens over the page and sending
 *   carries on once they're in. Then: save the draft → upload the CV (private) → send.
 * - "Fill in from my CV" (with a tick): the CV is read by /api/account/cv/read and the answers
 *   filled in, for them to check. Needs an account too.
 * Nothing is kept in browser storage; the page itself holds the answers until they're sent.
 */
import { api, sitePath, el, showErrors } from './api';
import { openAuth } from './auth-panel';
import { scroller } from '../motion/scroller';
import { requestFields, validateRequest, type RequestAnswers } from '../../data/portfolioRequest';

const form = document.querySelector<HTMLFormElement>('[data-request]');
const done = document.querySelector<HTMLElement>('[data-rq-done]');
const params = new URLSearchParams(location.search);
let loggedIn = false;
let projectId = params.get('p') ?? '';
let cvFile: File | null = null;
let cvUploaded = false;
/** Reopened an instant portfolio that's already built: Send rebuilds it instead. */
let rebuildMode = false;
/** Pictures chosen but not uploaded yet, by the hidden input that will hold their file id. */
const pendingImages = new Map<HTMLInputElement, File>();

const status = (text: string, tone: '' | 'warn' = '') => {
  const s = form!.querySelector<HTMLElement>('[data-rq-status]')!;
  s.textContent = text;
  if (tone) s.dataset.tone = tone;
  else delete s.dataset.tone;
};
const route = () =>
  (form!.querySelector<HTMLInputElement>('input[name="route"]:checked')?.value ?? 'instant') as
    'instant' | 'custom';
const concept = () => (form!.elements.namedItem('concept') as HTMLSelectElement).value;

// ---------- pictures (a design's photo, project screenshots) ----------

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function showImage(box: HTMLElement, src: string | null) {
  const thumb = box.querySelector<HTMLImageElement>('[data-image-thumb]')!;
  if (src) thumb.src = src;
  else thumb.removeAttribute('src');
  thumb.hidden = !src;
  box.querySelector<HTMLElement>('[data-image-clear]')!.hidden = !src;
}

/** Wires one picture box; `id` is a file already uploaded (reopening a saved request). */
function setUpImage(box: HTMLElement, id = '') {
  const hidden = box.querySelector<HTMLInputElement>('[data-image-id]')!;
  const input = box.querySelector<HTMLInputElement>('[data-image-input]')!;
  hidden.value = id;
  showImage(box, id ? sitePath(`/api/account/files/${encodeURIComponent(id)}`) : null);
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const field = box.closest<HTMLElement>('[data-field]')?.dataset.field ?? '';
    if (!IMAGE_TYPES.includes(file.type) || file.size > 10 * 1024 * 1024) {
      showErrors(form!, { [field]: 'Please choose a JPG, PNG or WebP picture under 10 MB.' });
      input.value = '';
      return;
    }
    showErrors(form!, {});
    pendingImages.set(hidden, file);
    showImage(box, URL.createObjectURL(file));
  });
  box.querySelector('[data-image-clear]')!.addEventListener('click', () => {
    hidden.value = '';
    input.value = '';
    pendingImages.delete(hidden);
    showImage(box, null);
    input.focus();
  });
}

/** Uploads every picture chosen since the last save, putting its file id in the form. */
async function uploadImages(): Promise<boolean> {
  for (const [hidden, file] of pendingImages) {
    if (!hidden.isConnected) {
      pendingImages.delete(hidden);
      continue;
    }
    status(`Uploading ${file.name}…`);
    const { status: code, data } = await api<{ file: { id: string } }>(
      `/api/account/files?p=${encodeURIComponent(projectId)}&field=image`,
      {
        method: 'POST',
        body: file,
        headers: { 'X-File-Name': encodeURIComponent(file.name), 'Content-Type': file.type },
      },
    );
    if (code !== 201) {
      const field = hidden.closest<HTMLElement>('[data-field]')?.dataset.field ?? '';
      showErrors(form!, { [field]: data.error ?? 'That picture didn’t upload. Please try again.' });
      status(data.error ?? 'A picture didn’t upload. Please try again.', 'warn');
      return false;
    }
    hidden.value = data.file.id;
    pendingImages.delete(hidden);
  }
  return true;
}

// ---------- the chosen design's own questions ----------

function showDesignFields() {
  const select = form!.elements.namedItem('concept') as HTMLSelectElement;
  const slug = route() === 'instant' ? (select.selectedOptions[0]?.dataset.slug ?? '') : '';
  let any = false;
  form!.querySelectorAll<HTMLElement>('[data-designs]').forEach((wrap) => {
    const on = Boolean(slug) && (wrap.dataset.designs ?? '').split(' ').includes(slug);
    wrap.hidden = !on;
    any ||= on;
  });
  form!.querySelector<HTMLElement>('[data-section="design"]')!.hidden = !any;
}

// ---------- repeat entries (jobs, qualifications, projects…) ----------

function addEntry(wrap: HTMLElement, values: Record<string, string | boolean> = {}) {
  const list = wrap.querySelector<HTMLElement>('[data-entries]')!;
  const max = Number(wrap.dataset.max ?? 10);
  if (list.children.length >= max) return null;
  const template = wrap.querySelector<HTMLTemplateElement>('[data-entry-template]')!;
  const entry = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  entry.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-part]').forEach((input) => {
    const uid = `rq-${wrap.dataset.field}-${input.dataset.part}-${Math.random().toString(36).slice(2, 8)}`;
    input.id = uid;
    entry.querySelector(`[data-part-label="${input.dataset.part}"]`)?.setAttribute('for', uid);
    const v = values[input.dataset.part!];
    if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = v === true;
    else if (typeof v === 'string' && !input.hasAttribute('data-image-id')) input.value = v;
  });
  entry.querySelectorAll<HTMLElement>('[data-image]').forEach((box) => {
    const part = box.querySelector<HTMLInputElement>('[data-image-id]')!.dataset.part!;
    const file = box.querySelector<HTMLInputElement>('[data-image-input]')!;
    file.id = `rq-${wrap.dataset.field}-${part}-file-${Math.random().toString(36).slice(2, 8)}`;
    entry.querySelector(`[data-part-label="${part}"]`)?.setAttribute('for', file.id);
    setUpImage(box, typeof values[part] === 'string' ? (values[part] as string) : '');
  });
  entry.querySelector('[data-entry-remove]')!.addEventListener('click', () => {
    entry.remove();
    renumber(wrap);
    wrap.querySelector<HTMLElement>('[data-entry-add]')?.focus();
  });
  list.append(entry);
  renumber(wrap);
  return entry;
}

function renumber(wrap: HTMLElement) {
  const entries = [...wrap.querySelectorAll<HTMLElement>('[data-entry]')];
  const noun = wrap.dataset.noun ?? 'Entry';
  entries.forEach((e, i) => {
    e.querySelector('[data-entry-number]')!.textContent = `${noun} ${i + 1}`;
    e.querySelector('[data-entry-remove]')!.setAttribute(
      'aria-label',
      `Remove ${noun.toLowerCase()} ${i + 1}`,
    );
  });
  const add = wrap.querySelector<HTMLElement>('[data-entry-add]');
  if (add) add.hidden = entries.length >= Number(wrap.dataset.max ?? 10);
}

// ---------- reading and filling ----------

function readAnswers(): RequestAnswers {
  const answers: RequestAnswers = {};
  for (const field of requestFields) {
    const wrap = form!.querySelector<HTMLElement>(`[data-field="${field.id}"]`);
    if (!wrap) continue;
    if (field.kind === 'consent') {
      if (wrap.querySelector<HTMLInputElement>('input')!.checked) answers[field.id] = true;
    } else if (field.kind === 'image') {
      const id = wrap.querySelector<HTMLInputElement>('[data-image-id]')!.value;
      if (id) answers[field.id] = id;
    } else if (field.kind === 'repeat') {
      const entries = [...wrap.querySelectorAll<HTMLElement>('[data-entry]')].map((entry) => {
        const out: Record<string, string | boolean> = {};
        entry
          .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-part]')
          .forEach((input) => {
            if (input instanceof HTMLInputElement && input.type === 'checkbox') {
              if (input.checked) out[input.dataset.part!] = true;
            } else if (input.value.trim()) out[input.dataset.part!] = input.value;
          });
        return out;
      });
      const kept = entries.filter((e) =>
        Object.keys(e).some((k) => k !== 'current' && k !== 'image'),
      );
      if (kept.length) answers[field.id] = kept;
    } else {
      const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (input?.value.trim()) answers[field.id] = input.value;
    }
  }
  return answers;
}

/** Fills the form. Only empty fields are filled unless `overwrite`, so reading a CV never wipes typing. */
function fill(answers: RequestAnswers, { overwrite = true } = {}) {
  for (const field of requestFields) {
    const wrap = form!.querySelector<HTMLElement>(`[data-field="${field.id}"]`);
    const value = answers[field.id];
    if (!wrap || value === undefined) continue;
    if (field.kind === 'consent') continue;
    if (field.kind === 'image') {
      const box = wrap.querySelector<HTMLElement>('[data-image]')!;
      const hidden = box.querySelector<HTMLInputElement>('[data-image-id]')!;
      if (typeof value === 'string' && (overwrite || !hidden.value)) {
        hidden.value = value;
        showImage(box, sitePath(`/api/account/files/${encodeURIComponent(value)}`));
      }
      continue;
    }
    if (field.kind === 'repeat') {
      if (!Array.isArray(value)) continue;
      const list = wrap.querySelector<HTMLElement>('[data-entries]')!;
      // Tick boxes say "on" even when unticked, so only real typing counts.
      const hasTyping = [...list.querySelectorAll<HTMLInputElement>('[data-part]')].some(
        (i) => i.type !== 'checkbox' && i.value.trim(),
      );
      if (hasTyping && !overwrite) continue;
      list.replaceChildren();
      value.forEach((v) => addEntry(wrap, v as Record<string, string | boolean>));
      if (!list.children.length) addEntry(wrap);
    } else {
      const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (input && typeof value === 'string' && (overwrite || !input.value.trim()))
        input.value = value;
    }
  }
}

function showConceptRule() {
  const optional = route() === 'custom';
  form!.querySelector<HTMLElement>('[data-concept-optional]')!.hidden = !optional;
  // Instant builds only exist for some designs: the others can't be picked for that route.
  const select = form!.elements.namedItem('concept') as HTMLSelectElement;
  [...select.options].forEach((o) => {
    o.disabled = !optional && Boolean(o.value) && o.dataset.instant !== 'yes';
  });
  if (select.selectedOptions[0]?.disabled) {
    select.value = '';
    showErrors(form!, {
      concept:
        'That design is made by hand. Choose one marked “instant”, or a custom made portfolio.',
    });
  }
  form!.querySelector<HTMLElement>('[data-rq-send]')!.textContent = optional
    ? 'Send my request'
    : 'Build my portfolio';
  showDesignFields();
}

// ---------- sending ----------

async function ensureLoggedIn(message: string) {
  if (loggedIn) return true;
  loggedIn = await openAuth('signup', message);
  if (loggedIn) form!.querySelector<HTMLElement>('[data-rq-who]')!.hidden = true;
  return loggedIn;
}

async function saveDraft(): Promise<boolean> {
  const { status: code, data } = await api<{ projectId: string }>('/api/account/request', {
    method: 'POST',
    body: {
      answers: readAnswers(),
      route: route(),
      concept: concept(),
      projectId: projectId || undefined,
    },
  });
  if (code === 200) {
    projectId = data.projectId;
    return true;
  }
  if (data.errors) showErrors(form!, data.errors);
  status(data.error ?? 'We couldn’t save that just now. Please try again.', 'warn');
  return false;
}

async function uploadCv(): Promise<boolean> {
  if (!cvFile || cvUploaded) return true;
  status(`Uploading ${cvFile.name}…`);
  const { status: code, data } = await api(
    `/api/account/files?p=${encodeURIComponent(projectId)}&field=cv`,
    {
      method: 'POST',
      body: cvFile,
      headers: {
        'X-File-Name': encodeURIComponent(cvFile.name),
        'Content-Type': cvFile.type || 'application/octet-stream',
      },
    },
  );
  if (code === 201) {
    cvUploaded = true;
    return true;
  }
  showErrors(form!, { cv: data.error ?? 'Your CV didn’t upload. Please try again.' });
  return false;
}

function finished(
  routeSent: 'instant' | 'custom',
  previewPath: string | null = null,
  live = false,
) {
  form!.hidden = true;
  const instant = routeSent === 'instant';
  const parts: (HTMLElement | null)[] = [
    el('h2', {
      text: rebuildMode ? 'Rebuilt' : instant ? 'Your portfolio is ready' : 'Request sent',
    }),
    el('p', {
      text: rebuildMode
        ? live
          ? 'Your changes are live now.'
          : 'Your portfolio has your changes. Have a look.'
        : instant
          ? 'We’ve built it from your design and details. Have a look, then choose what happens next in your account. We’ve emailed you a copy of what you sent.'
          : 'A real person will read it and reply by email within 48 hours. We’ve emailed you a copy of what you sent.',
    }),
    previewPath
      ? el('a', {
          class: 'rq__send',
          href: sitePath(previewPath),
          target: '_blank',
          rel: 'noopener',
          text: 'See my portfolio',
        })
      : null,
    el('a', { class: 'rq__ghost', href: sitePath('/account/'), text: 'Go to my account' }),
  ];
  done!.replaceChildren(...parts.filter((part): part is HTMLElement => part !== null));
  done!.hidden = false;
  done!.focus();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  status('');
  const answers = readAnswers();
  const { errors } = validateRequest(answers, { sending: true });
  if (route() === 'instant' && !concept()) errors.concept = 'Choose a design for us to build from.';
  showErrors(form, errors);
  if (Object.keys(errors).length) {
    status('A few things need filling in first. They’re marked below.', 'warn');
    return;
  }
  if (
    !(await ensureLoggedIn(
      'Create an account (or log in) to send your request. Your answers are kept on the page.',
    ))
  ) {
    status('Your answers are still here. Send again whenever you’re ready.');
    return;
  }
  const button = form.querySelector<HTMLButtonElement>('[data-rq-send]')!;
  button.disabled = true;
  if (rebuildMode) {
    if (!(await uploadImages())) {
      button.disabled = false;
      return;
    }
    status('Rebuilding…');
    const { status: code, data } = await api<{ previewPath: string; live: boolean }>(
      `/api/account/request/rebuild?p=${encodeURIComponent(projectId)}`,
      { method: 'POST', body: { answers: readAnswers() } },
    );
    button.disabled = false;
    if (code === 200) finished('instant', data.previewPath, data.live);
    else {
      if (data.errors) showErrors(form, data.errors);
      status(data.error ?? 'That didn’t rebuild. Please try again.', 'warn');
    }
    return;
  }
  try {
    if (!(await saveDraft()) || !(await uploadCv())) return;
    if (pendingImages.size) {
      // Pictures need the saved request to belong to; then save again with their ids.
      if (!(await uploadImages()) || !(await saveDraft())) return;
    }
    status('Sending…');
    const { status: code, data } = await api<{
      route: 'instant' | 'custom';
      previewPath: string | null;
    }>(`/api/account/request/send?p=${encodeURIComponent(projectId)}`, {
      method: 'POST',
      body: { answers: readAnswers() },
    });
    if (code === 200) finished(data.route, data.previewPath);
    else {
      if (data.errors) showErrors(form, data.errors);
      status(data.error ?? 'That didn’t send. Please try again.', 'warn');
    }
  } finally {
    button.disabled = false;
  }
});

// ---------- the CV ----------

const cvInput = form?.querySelector<HTMLInputElement>('[data-cv-input]');
cvInput?.addEventListener('change', () => {
  const file = cvInput.files?.[0] ?? null;
  showErrors(form!, {});
  if (file && !/\.(pdf|docx)$/i.test(file.name)) {
    showErrors(form!, { cv: 'Please choose a PDF or a Word (.docx) file.' });
    cvInput.value = '';
    return;
  }
  if (file && file.size > 10 * 1024 * 1024) {
    showErrors(form!, { cv: 'That file is over 10 MB. Please choose a smaller copy.' });
    cvInput.value = '';
    return;
  }
  cvFile = file;
  cvUploaded = false;
  form!.querySelector<HTMLElement>('[data-cv-read]')!.hidden = !file;
});

form?.querySelector('[data-cv-read-button]')?.addEventListener('click', async () => {
  if (!cvFile) return;
  if (!form!.querySelector<HTMLInputElement>('[data-cv-consent]')!.checked) {
    showErrors(form!, {
      cv: 'Tick the box first, so we know you’re happy for your CV to be read.',
    });
    return;
  }
  if (!(await ensureLoggedIn('Create an account (or log in) so we can read your CV privately.')))
    return;
  status('Reading your CV… this takes a few seconds.');
  const { status: code, data } = await api<{ answers: RequestAnswers }>('/api/account/cv/read', {
    method: 'POST',
    body: cvFile,
    headers: {
      'X-File-Name': encodeURIComponent(cvFile.name),
      'Content-Type': cvFile.type || 'application/octet-stream',
      'X-Consent': 'yes',
    },
  });
  if (code === 200) {
    fill(data.answers, { overwrite: false });
    status('Done. We’ve filled in what we could find: please check every answer before sending.');
  } else
    status(
      data.error ?? 'We couldn’t read that CV. You can still fill the form in yourself.',
      'warn',
    );
});

// ---------- choosing a design from a concept card ----------

/**
 * Picks a design: instant designs take the instant route, hand-made ones the custom route (so the
 * choice is never lost). Returns false if there's no such design.
 */
function applyConcept(name: string): boolean {
  if (!form || rebuildMode) return false;
  const select = form.elements.namedItem('concept') as HTMLSelectElement;
  const option = [...select.options].find((o) => o.value === name);
  if (!option) return false;
  const routeValue = option.dataset.instant === 'yes' ? 'instant' : 'custom';
  form.querySelector<HTMLInputElement>(`input[name="route"][value="${routeValue}"]`)!.checked =
    true;
  showConceptRule();
  select.value = name;
  showErrors(form, {});
  return true;
}

// "Choose this concept" on the wall: fill the design in and bring them to the form, without
// reloading (a reload would replay the page's opening). The link still works without JavaScript.
document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-choose-concept]');
  if (!link || !form || event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (!applyConcept(link.dataset.chooseConcept ?? '')) return;
  event.preventDefault();
  const url = new URL(location.href);
  url.searchParams.set('concept', link.dataset.chooseConcept ?? '');
  history.replaceState(null, '', `${url.pathname}${url.search}#request`);
  const band = document.getElementById('request');
  // Through the shared scroller, so it never fights Lenis's smooth scrolling.
  if (band) scroller.to(band.getBoundingClientRect().top + scroller.target() - 72);
  document.getElementById('rq-title')?.focus({ preventScroll: true });
  status(`${link.dataset.chooseConcept}’s design is chosen. Fill in your details below.`);
});

// ---------- start ----------

async function start() {
  if (!form) return;
  form.querySelectorAll<HTMLElement>('[data-field][data-kind="repeat"]').forEach((wrap) => {
    addEntry(wrap);
    wrap.querySelector('[data-entry-add]')!.addEventListener('click', () => {
      addEntry(wrap)?.querySelector<HTMLElement>('[data-part]')?.focus();
    });
  });
  form
    .querySelectorAll('input[name="route"]')
    .forEach((r) => r.addEventListener('change', showConceptRule));
  form
    .querySelectorAll<HTMLElement>('[data-field][data-kind="image"] [data-image]')
    .forEach((box) => setUpImage(box));

  const conceptSelect = form.elements.namedItem('concept') as HTMLSelectElement;
  conceptSelect.addEventListener('change', showDesignFields);
  const wanted = params.get('concept');
  if (wanted) applyConcept(wanted);

  const me = await api<{ user: { name: string; email: string } }>('/api/account/me');
  loggedIn = me.status === 200;
  if (loggedIn) {
    form.querySelector<HTMLElement>('[data-rq-who]')!.hidden = true;
    const [first, ...rest] = me.data.user.name.split(' ');
    fill(
      { firstName: first, surname: rest.join(' '), email: me.data.user.email },
      { overwrite: false },
    );
  }
  if (loggedIn && projectId) {
    const saved = await api<{
      route: string;
      concept: string | null;
      state: string;
      answers: RequestAnswers;
    }>(`/api/account/request?p=${encodeURIComponent(projectId)}`);
    if (saved.status === 200) {
      fill(saved.data.answers);
      form.querySelector<HTMLInputElement>(
        `input[name="route"][value="${saved.data.route}"]`,
      )!.checked = true;
      if (saved.data.concept) conceptSelect.value = saved.data.concept;
      if (saved.data.state === 'sent' && saved.data.route === 'instant') {
        rebuildMode = true;
        form
          .querySelectorAll<HTMLInputElement>('input[name="route"]')
          .forEach((r) => (r.disabled = true));
        form.querySelector<HTMLElement>('[data-field="cv"]')!.hidden = true;
      }
    } else projectId = '';
  }
  showConceptRule();
  if (rebuildMode) {
    form.querySelector<HTMLElement>('[data-rq-send]')!.textContent = 'Rebuild my portfolio';
    status(
      'Change anything below, then rebuild. To change your CV file, contact us from your account.',
    );
  }
}

void start();
