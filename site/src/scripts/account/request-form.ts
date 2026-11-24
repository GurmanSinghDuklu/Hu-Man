/**
 * The portfolio request form on /portfolio/start/ (components/account/RequestForm.astro).
 * - The design comes from ?concept= (the "Choose this design" buttons on /portfolio/).
 * - Two choices: "Fill in details now" (the full form and CV; needs an account) or "Chat with us
 *   instead" (a short message to /api/enquiry, no account; or WhatsApp).
 * - Send: checked here first; signed out → the sign-in panel opens over the page and sending
 *   carries on once they're in. Then: save the draft → upload the CV and pictures → send. A pop-up
 *   says we reply within 48 hours and that details can be changed for 3 hours (?p=<project> from the
 *   dashboard reopens it in that window).
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
const pop = document.querySelector<HTMLDialogElement>('[data-rq-pop]');
const params = new URLSearchParams(location.search);
let loggedIn = false;
let projectId = params.get('p') ?? '';
let cvFile: File | null = null;
let cvUploaded = false;
/** Reopened from the dashboard within 3 hours of sending: Send saves changes instead. */
let editUntil: number | null = null;
/** Pictures chosen but not uploaded yet, by the hidden input that will hold their file id. */
const pendingImages = new Map<HTMLInputElement, File>();
const WHATSAPP = 'https://wa.me/447988450280';

const status = (text: string, tone: '' | 'warn' = '') => {
  const s = form!.querySelector<HTMLElement>('[data-rq-status]')!;
  s.textContent = text;
  if (tone) s.dataset.tone = tone;
  else delete s.dataset.tone;
};
const route = () =>
  (form!.querySelector<HTMLInputElement>('input[name="route"]:checked')?.value ?? 'details') as
    'details' | 'chat';
const concept = () => (form!.elements.namedItem('concept') as HTMLSelectElement).value;
const ukTime = (ms: number) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));

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
  const slug = route() === 'details' ? (select.selectedOptions[0]?.dataset.slug ?? '') : '';
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
    if (field.kind === 'consent') {
      // Their own saved answer (reopening a sent request); a CV read never ticks it for them.
      if (overwrite && value === true)
        wrap.querySelector<HTMLInputElement>('input')!.checked = true;
      continue;
    }
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

/** Shows the chosen route's part of the form, and the design's own questions. */
function showRoute() {
  const chat = route() === 'chat';
  form!.querySelector<HTMLElement>('[data-panel="chat"]')!.hidden = !chat;
  form!.querySelector<HTMLElement>('[data-panel="details"]')!.hidden = chat;
  form!.querySelector<HTMLElement>('[data-rq-who]')!.hidden = chat || loggedIn;
  form!.querySelector<HTMLElement>('[data-rq-send]')!.textContent = chat
    ? 'Send my message'
    : editUntil
      ? 'Save my changes'
      : 'Send my details';
  showDesignFields();
  const design = concept();
  const text = `Hi Hu/man, I'd like a portfolio website${design ? ` based on the ${design} design` : ''}.`;
  form!.querySelector<HTMLAnchorElement>('[data-rq-wa]')!.href =
    `${WHATSAPP}?text=${encodeURIComponent(text)}`;
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

/** The pop-up after sending: 48 hours to a reply, and (for details) 3 hours to add more. */
function showSent(kind: 'details' | 'changes' | 'chat', until: number | null = null) {
  const first = (form!.elements.namedItem('firstName') as HTMLInputElement | null)?.value.trim();
  pop!.querySelector('[data-rq-pop-title]')!.textContent =
    kind === 'changes' ? 'Changes saved' : `Thanks${first ? `, ${first}` : ''}. We’ve got it`;
  pop!.querySelector('[data-rq-pop-reply]')!.textContent =
    kind === 'changes'
      ? 'We’ve got your changes, and the team has been told.'
      : 'A real person will read it and reply by email within 48 hours.';
  pop!.querySelector('[data-rq-pop-extra]')!.textContent = until
    ? `Want to add something? You can add or change details from your dashboard until ${ukTime(until)} today (3 hours after sending). After that, just reply to our email.`
    : kind === 'chat'
      ? 'If it’s easier, you can also message us on WhatsApp.'
      : '';
  pop!.querySelector('[data-rq-pop-mail]')!.textContent =
    kind === 'details' ? 'We’ve emailed you a copy of what you sent.' : '';
  pop!.querySelector<HTMLElement>('[data-rq-pop-dash]')!.hidden = kind === 'chat';
  const after = () => {
    form!.hidden = true;
    done!.replaceChildren(
      el('h2', { text: kind === 'chat' ? 'Message sent' : 'Request sent' }),
      el('p', { text: 'A real person will reply by email within 48 hours.' }),
      ...(kind === 'chat'
        ? []
        : [
            el('a', { class: 'rq__send', href: sitePath('/account/'), text: 'Go to my dashboard' }),
          ]),
    );
    done!.hidden = false;
    done!.focus();
  };
  pop!.addEventListener('close', after, { once: true });
  pop!.showModal();
  pop!.querySelector<HTMLElement>('[data-rq-pop-title]')!.focus();
}

/** "Chat with us instead": a short message to the enquiry endpoint. No account needed. */
async function sendChat() {
  const value = (id: string) =>
    (
      form!.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#rq-chat-${id}`)?.value ?? ''
    ).trim();
  const errors: Record<string, string> = {};
  if (!value('name')) errors.chatName = 'Please tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value('email')))
    errors.chatEmail = 'Please check this email address.';
  if (!value('message')) errors.chatMessage = 'Please write a short message.';
  showErrors(form!, errors);
  if (Object.keys(errors).length) {
    status('A few things need filling in first. They’re marked below.', 'warn');
    return;
  }
  const button = form!.querySelector<HTMLButtonElement>('[data-rq-send]')!;
  button.disabled = true;
  status('Sending…');
  try {
    const res = await fetch(sitePath('/api/enquiry'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: value('name'),
        email: value('email'),
        phone: value('phone') || undefined,
        message: value('message'),
        concept: concept() || undefined,
        topic: 'website',
        via: 'Portfolio: chat',
      }),
    });
    if (res.ok) {
      status('');
      showSent('chat');
    } else {
      status('That didn’t send. Please try again, or message us on WhatsApp.', 'warn');
    }
  } catch {
    status('That didn’t send. Please try again, or message us on WhatsApp.', 'warn');
  } finally {
    button.disabled = false;
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  status('');
  if (route() === 'chat') {
    await sendChat();
    return;
  }
  const answers = readAnswers();
  const { errors } = validateRequest(answers, { sending: true });
  showErrors(form, errors);
  if (Object.keys(errors).length) {
    status('A few things need filling in first. They’re marked below.', 'warn');
    return;
  }
  if (
    !(await ensureLoggedIn(
      'Create an account (or sign in) to send your details. Your answers are kept on the page.',
    ))
  ) {
    status('Your answers are still here. Send again whenever you’re ready.');
    return;
  }
  const button = form.querySelector<HTMLButtonElement>('[data-rq-send]')!;
  button.disabled = true;
  try {
    if (editUntil) {
      if (!(await uploadCv()) || !(await uploadImages())) return;
      status('Saving…');
      const { status: code, data } = await api<{ editableUntil: number }>(
        `/api/account/request/update?p=${encodeURIComponent(projectId)}`,
        { method: 'POST', body: { answers: readAnswers(), concept: concept() } },
      );
      if (code === 200) {
        status('');
        showSent('changes', data.editableUntil);
      } else {
        if (data.errors) showErrors(form, data.errors);
        status(data.error ?? 'That didn’t save. Please try again.', 'warn');
      }
      return;
    }
    if (!(await saveDraft()) || !(await uploadCv())) return;
    if (pendingImages.size) {
      // Pictures need the saved request to belong to; then save again with their ids.
      if (!(await uploadImages()) || !(await saveDraft())) return;
    }
    status('Sending…');
    const { status: code, data } = await api<{ editableUntil: number }>(
      `/api/account/request/send?p=${encodeURIComponent(projectId)}`,
      { method: 'POST', body: { answers: readAnswers() } },
    );
    if (code === 200) {
      status('');
      showSent('details', data.editableUntil);
    } else {
      if (data.errors) showErrors(form, data.errors);
      status(data.error ?? 'That didn’t send. Please try again.', 'warn');
    }
  } finally {
    button.disabled = false;
  }
});

pop?.querySelector('[data-rq-pop-close]')?.addEventListener('click', () => pop.close());

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

// ---------- choosing a design ----------

function applyConcept(name: string): boolean {
  if (!form) return false;
  const select = form.elements.namedItem('concept') as HTMLSelectElement;
  if (![...select.options].some((o) => o.value === name)) return false;
  select.value = name;
  showErrors(form, {});
  showRoute();
  return true;
}

// A "Choose this design" link on this same page: fill it in and bring them to the form.
document.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-choose-concept]');
  if (!link || !form || event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (!applyConcept(link.dataset.chooseConcept ?? '')) return;
  event.preventDefault();
  const band = document.getElementById('request');
  if (band) scroller.to(band.getBoundingClientRect().top + scroller.target() - 72);
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
    .forEach((r) => r.addEventListener('change', showRoute));
  form
    .querySelectorAll<HTMLElement>('[data-field][data-kind="image"] [data-image]')
    .forEach((box) => setUpImage(box));
  const conceptSelect = form.elements.namedItem('concept') as HTMLSelectElement;
  conceptSelect.addEventListener('change', showRoute);
  const wanted = params.get('concept');
  if (wanted && applyConcept(wanted)) {
    status(`${wanted}’s design is chosen. Fill in your details below, or chat with us first.`);
  }
  showRoute();

  const me = await api<{ user: { name: string; email: string } }>('/api/account/me');
  loggedIn = me.status === 200;
  if (loggedIn) {
    const [first, ...rest] = me.data.user.name.split(' ');
    fill(
      { firstName: first, surname: rest.join(' '), email: me.data.user.email },
      { overwrite: false },
    );
    const name = form.querySelector<HTMLInputElement>('#rq-chat-name');
    const email = form.querySelector<HTMLInputElement>('#rq-chat-email');
    if (name && !name.value) name.value = me.data.user.name;
    if (email && !email.value) email.value = me.data.user.email;
  }
  if (loggedIn && projectId) {
    const saved = await api<{
      concept: string | null;
      state: string;
      editableUntil: number | null;
      answers: RequestAnswers;
    }>(`/api/account/request?p=${encodeURIComponent(projectId)}`);
    if (saved.status === 200) {
      fill(saved.data.answers);
      if (saved.data.concept) conceptSelect.value = saved.data.concept;
      if (saved.data.state === 'sent') {
        form
          .querySelectorAll<HTMLInputElement>('input[name="route"]')
          .forEach((r) => (r.disabled = r.value !== 'details'));
        const until = saved.data.editableUntil;
        if (until && until > Date.now()) {
          editUntil = until;
          status(
            `Add or change anything below, then save. Open until ${ukTime(until)} today (3 hours after sending).`,
          );
        } else {
          form.querySelector<HTMLButtonElement>('[data-rq-send]')!.disabled = true;
          status(
            'This request was sent more than 3 hours ago, so it can’t be changed here. Reply to our email and we’ll add anything for you.',
            'warn',
          );
        }
      }
    } else projectId = '';
  }
  showRoute();
}

void start();
