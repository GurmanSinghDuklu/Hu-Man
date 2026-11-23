/**
 * The portfolio request form on /contact/ (components/account/RequestForm.astro).
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
import { requestFields, validateRequest, type RequestAnswers } from '../../data/portfolioRequest';

const form = document.querySelector<HTMLFormElement>('[data-request]');
const done = document.querySelector<HTMLElement>('[data-rq-done]');
const params = new URLSearchParams(location.search);
let loggedIn = false;
let projectId = params.get('p') ?? '';
let cvFile: File | null = null;
let cvUploaded = false;

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

// ---------- repeat entries (jobs, qualifications) ----------

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
    else if (typeof v === 'string') input.value = v;
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
  const noun = wrap.dataset.field === 'experience' ? 'Job' : 'Qualification';
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
      const kept = entries.filter((e) => Object.keys(e).some((k) => k !== 'current'));
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
    if (field.kind === 'repeat') {
      if (!Array.isArray(value)) continue;
      const list = wrap.querySelector<HTMLElement>('[data-entries]')!;
      const hasTyping = [...list.querySelectorAll<HTMLInputElement>('[data-part]')].some((i) =>
        i.value.trim(),
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
  form!.querySelector<HTMLElement>('[data-rq-send]')!.textContent = optional
    ? 'Send my request'
    : 'Build my portfolio';
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

function finished(routeSent: 'instant' | 'custom') {
  form!.hidden = true;
  done!.replaceChildren(
    el('h2', { text: routeSent === 'instant' ? 'Your portfolio is on its way' : 'Request sent' }),
    el('p', {
      text:
        routeSent === 'instant'
          ? 'We’ve got everything we need. Your portfolio is in your account, and we’ve emailed you a copy of what you sent.'
          : 'A real person will read it and reply by email within 48 hours. We’ve emailed you a copy of what you sent.',
    }),
    el('a', { class: 'rq__send', href: sitePath('/account/'), text: 'Go to my account' }),
  );
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
  try {
    if (!(await saveDraft()) || !(await uploadCv())) return;
    status('Sending…');
    const { status: code, data } = await api<{ route: 'instant' | 'custom' }>(
      `/api/account/request/send?p=${encodeURIComponent(projectId)}`,
      { method: 'POST', body: { answers } },
    );
    if (code === 200) finished(data.route);
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

  const conceptSelect = form.elements.namedItem('concept') as HTMLSelectElement;
  const wanted = params.get('concept');
  if (wanted) {
    conceptSelect.value = wanted;
    if (conceptSelect.value !== wanted) conceptSelect.value = '';
  }

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
    const saved = await api<{ route: string; concept: string | null; answers: RequestAnswers }>(
      `/api/account/request?p=${encodeURIComponent(projectId)}`,
    );
    if (saved.status === 200) {
      fill(saved.data.answers);
      form.querySelector<HTMLInputElement>(
        `input[name="route"][value="${saved.data.route}"]`,
      )!.checked = true;
      if (saved.data.concept) conceptSelect.value = saved.data.concept;
    } else projectId = '';
  }
  showConceptRule();
}

void start();
