/** /admin/: every client and their brief's state; the "New client" form. */
import {
  api,
  requireLogin,
  setStatus,
  showErrors,
  el,
  sitePath,
  briefStateLabel,
  formatDate,
  UNAVAILABLE,
  type Me,
} from './api';
import { showSetupLink } from './admin-shared';
import { projectTypeLabels } from '../../data/brief';

interface Client {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  hasPassword: boolean;
  projects: Me['projects'];
}

const root = document.querySelector<HTMLElement>('[data-admin]');
const form = document.querySelector<HTMLFormElement>('[data-new-client]');
let lastClients = '';

async function loadClients() {
  const target = root!.querySelector<HTMLElement>('[data-clients]')!;
  const { status, data } = await api<{ clients: Client[] }>('/api/admin/clients');
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return;
  }
  const snapshot = JSON.stringify(data.clients);
  if (snapshot === lastClients) return; // unchanged: don't disturb the page
  lastClients = snapshot;
  if (!data.clients.length) {
    target.replaceChildren(
      el('p', { class: 'acct-small', text: 'No clients yet. Add the first with “New client”.' }),
    );
    return;
  }
  const rows = data.clients.map((client) => {
    const project = client.projects[0];
    return el(
      'tr',
      {},
      el(
        'td',
        {},
        el('a', {
          class: 'acct-link',
          href: sitePath(`/admin/client/?id=${encodeURIComponent(client.id)}`),
          text: client.name,
        }),
      ),
      el('td', { text: client.email }),
      el('td', { text: project ? `${project.name} (${projectTypeLabels[project.type]})` : '' }),
      el(
        'td',
        {},
        project
          ? el('span', {
              class: 'acct-tag',
              'data-state': project.briefState,
              text: briefStateLabel[project.briefState],
            })
          : '',
      ),
      el('td', { text: client.hasPassword ? 'Set up' : `Invited ${formatDate(client.createdAt)}` }),
    );
  });
  target.replaceChildren(
    el(
      'table',
      { class: 'acct-table' },
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          ...['Client', 'Email', 'Project', 'Brief', 'Account'].map((h) =>
            el('th', { scope: 'col', text: h }),
          ),
        ),
      ),
      el('tbody', {}, ...rows),
    ),
  );
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
  const button = form.querySelector<HTMLButtonElement>('[data-submit]');
  if (button) button.disabled = true;
  const { status, data } = await api<{ setupUrl: string }>('/api/admin/clients', {
    method: 'POST',
    body: {
      name: value('name'),
      email: value('email'),
      enquiryId: value('enquiryId'),
      project: {
        name: value('projectName'),
        type: value('type'),
        tier: value('tier'),
        concept: value('concept'),
      },
    },
  });
  if (button) button.disabled = false;
  if (status === 201) {
    showErrors(form, {});
    setStatus(`${value('name')} added.`, 'ok');
    showSetupLink(value('name'), data.setupUrl);
    form.reset();
    (form.elements.namedItem('enquiryId') as HTMLInputElement).value = '';
    form.querySelector<HTMLElement>('[data-from-enquiry]')!.hidden = true;
    form.closest('details')?.removeAttribute('open');
    await Promise.all([loadClients(), loadEnquiries()]);
    return;
  }
  if (data.errors) showErrors(form, data.errors);
  setStatus(data.error ?? UNAVAILABLE, 'warn');
});

// ---------- enquiries (every form send on the site) ----------

interface Enquiry {
  id: string;
  createdAt: number;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  topic: string | null;
  tier: string | null;
  concept: string | null;
  service: string | null;
  via: string | null;
  message: string | null;
  source: string | null;
  status: 'new' | 'replied' | 'not-a-fit' | 'client';
  clientId: string | null;
}

const TOPICS: Record<string, string> = {
  'ai-check': 'Free AI check',
  website: 'A new website or redesign',
  idea: 'An idea: app, software or online business',
  tier: 'A pricing tier',
  other: 'Something else',
};
const STATUS_LABEL = {
  new: 'New',
  replied: 'Replied',
  'not-a-fit': 'Not a fit',
  client: 'Now a client',
};
const REFRESH_MS = 30_000;
const baseTitle = document.title;
let enquiries: Enquiry[] = [];
let lastEnquiries = '';
let filter: 'open' | 'all' = 'open';
let seen: Set<string> | null = null;

const when = (ms: number) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ms);

/** A page address as people read it (%20 back to a space). */
const readable = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/** What they asked about, in one line. */
function about(e: Enquiry): string {
  return [
    e.tier && `Tier: ${e.tier}`,
    e.concept && `Design: ${e.concept}`,
    e.service,
    !e.tier && !e.service && e.topic ? TOPICS[e.topic] : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** The New client form's project type, guessed from what they picked. */
function typeFor(e: Enquiry): string {
  const conceptGroup = [...form!.querySelectorAll<HTMLOptionElement>('#nc-concept option')]
    .find((o) => o.value === e.concept)
    ?.closest('optgroup')?.label;
  if (e.tier?.startsWith('Portfolio:') || e.service === 'Portfolio or CV website')
    return 'portfolio';
  if (conceptGroup?.startsWith('CV')) return 'portfolio';
  if (conceptGroup?.startsWith('Business')) return 'business';
  if (e.topic === 'idea' || e.tier === 'Custom') return 'custom';
  return e.topic === 'website' || e.tier ? 'business' : '';
}

function makeClient(e: Enquiry) {
  if (!form) return;
  form.reset();
  const set = (name: string, value: string) => {
    const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
    field.value = value;
    if (field.value !== value) field.value = ''; // not one of the options
  };
  set('name', e.name);
  set('email', e.email);
  set('type', typeFor(e));
  set('tier', e.tier ?? '');
  set('concept', e.concept ?? '');
  (form.elements.namedItem('enquiryId') as HTMLInputElement).value = e.id;
  const note = form.querySelector<HTMLElement>('[data-from-enquiry]')!;
  note.textContent = `From ${e.name}’s enquiry of ${when(e.createdAt)}. Check the details, then create.`;
  note.hidden = false;
  const details = form.closest('details');
  details?.setAttribute('open', '');
  details?.scrollIntoView({ block: 'start' });
  (form.elements.namedItem(typeFor(e) ? 'name' : 'type') as HTMLElement).focus();
}

async function mark(e: Enquiry, status: 'new' | 'replied' | 'not-a-fit') {
  const { status: code } = await api(`/api/admin/enquiries/${encodeURIComponent(e.id)}`, {
    method: 'POST',
    body: { status },
  });
  if (code === 200) {
    setStatus(`${e.name}: marked ${STATUS_LABEL[status].toLowerCase()}.`, 'ok');
    await loadEnquiries();
  } else setStatus(UNAVAILABLE, 'warn');
}

async function remove(e: Enquiry) {
  const sure = window.confirm(
    `Delete ${e.name}’s enquiry? It goes from this list for good (the email in your inbox stays).`,
  );
  if (!sure) return;
  const { status } = await api(`/api/admin/enquiries/${encodeURIComponent(e.id)}`, {
    method: 'DELETE',
  });
  if (status === 200) {
    setStatus(`${e.name}’s enquiry deleted.`, 'ok');
    await loadEnquiries();
    root!.querySelector<HTMLElement>('#enq-title')?.focus();
  } else setStatus(UNAVAILABLE, 'warn');
}

function card(e: Enquiry) {
  const button = (text: string, onClick: () => void, cls = 'acct__logout') => {
    const b = el('button', { type: 'button', class: cls, text });
    b.addEventListener('click', onClick);
    return b;
  };
  const facts = [
    el(
      'div',
      {},
      el('dt', { text: 'Email' }),
      el('dd', {}, el('a', { class: 'acct-link', href: `mailto:${e.email}`, text: e.email })),
    ),
    e.phone && el('div', {}, el('dt', { text: 'Phone' }), el('dd', { text: e.phone })),
    e.website && el('div', {}, el('dt', { text: 'Website' }), el('dd', { text: e.website })),
    about(e) && el('div', {}, el('dt', { text: 'About' }), el('dd', { text: about(e) })),
    el(
      'div',
      {},
      el('dt', { text: 'Sent from' }),
      el('dd', {
        text: [e.via, e.source && readable(e.source)].filter(Boolean).join(' · ') || 'Unknown',
      }),
    ),
  ];
  const actions = el('div', { class: 'acct-actions' });
  // Portfolio requests come with an account already; other enquiries can be made into one.
  if (e.clientId) {
    actions.append(
      el('a', {
        class: e.status === 'client' ? 'btn btn--outline' : 'pill-btn',
        href: sitePath(`/admin/client/?id=${encodeURIComponent(e.clientId)}`),
        text: 'Open their client page',
      }),
    );
  } else actions.append(button('Make client', () => makeClient(e), 'pill-btn'));
  if (e.status !== 'client') {
    if (e.status !== 'replied') actions.append(button('Replied', () => void mark(e, 'replied')));
    if (e.status !== 'not-a-fit')
      actions.append(button('Not a fit', () => void mark(e, 'not-a-fit')));
    if (e.status !== 'new') actions.append(button('Back to new', () => void mark(e, 'new')));
  }
  actions.append(button('Delete', () => void remove(e), 'acct-danger'));
  return el(
    'article',
    { class: 'acct-card', 'data-enquiry': e.id },
    el('h3', { text: e.name }),
    el('p', { class: 'acct-small', text: when(e.createdAt) }),
    el('p', {
      class: 'acct-tag',
      'data-state': e.status === 'new' ? 'draft' : e.status === 'client' ? 'sent' : '',
      text: STATUS_LABEL[e.status],
    }),
    el('dl', { class: 'acct-dl' }, ...facts.filter(Boolean)),
    e.message ? el('p', { class: 'admin__message', text: e.message }) : null,
    actions,
  );
}

function renderEnquiries() {
  const target = root!.querySelector<HTMLElement>('[data-enquiries]')!;
  const shown = enquiries.filter(
    (e) => filter === 'all' || e.status === 'new' || e.status === 'replied',
  );
  target.replaceChildren(
    ...(shown.length
      ? shown.map(card)
      : [
          el('p', {
            class: 'acct-small',
            text:
              filter === 'open'
                ? 'No open enquiries. New ones appear here by themselves.'
                : 'No enquiries yet.',
          }),
        ]),
  );
}

async function loadEnquiries() {
  const { status, data } = await api<{ enquiries: Enquiry[]; newCount: number }>(
    '/api/admin/enquiries',
  );
  if (status !== 200) return;
  const updated = root!.querySelector<HTMLElement>('[data-enq-updated]')!;
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(),
  );
  const arrived = seen ? data.enquiries.filter((e) => !seen!.has(e.id)).length : 0;
  seen = new Set(data.enquiries.map((e) => e.id));
  updated.textContent = `Updates by itself every 30 seconds. Last checked ${time}.${arrived ? ` ${arrived} new ${arrived === 1 ? 'enquiry' : 'enquiries'} just arrived.` : ''}`;
  document.title = data.newCount ? `(${data.newCount}) ${baseTitle}` : baseTitle;
  const snapshot = JSON.stringify(data.enquiries);
  if (snapshot === lastEnquiries) return; // unchanged: don't disturb the page
  lastEnquiries = snapshot;
  enquiries = data.enquiries;
  renderEnquiries();
}

document.querySelectorAll<HTMLButtonElement>('[data-enq-filter]').forEach((b) =>
  b.addEventListener('click', () => {
    filter = b.dataset.enqFilter as 'open' | 'all';
    document
      .querySelectorAll('[data-enq-filter]')
      .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderEnquiries();
  }),
);

/** Checks for new enquiries and clients every 30 seconds while the tab is open, and on return. */
function keepFresh() {
  const refresh = () => {
    if (document.visibilityState === 'visible') void Promise.all([loadEnquiries(), loadClients()]);
  };
  window.setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', refresh);
}

async function start() {
  const me = await requireLogin({ admin: true });
  if (!me || !root) return;
  root.hidden = false;
  const deleted = new URLSearchParams(location.search).get('deleted');
  if (deleted) {
    setStatus(`${deleted.slice(0, 100)} and everything about them has been deleted.`, 'ok');
    history.replaceState(null, '', location.pathname);
  }
  await Promise.all([loadEnquiries(), loadClients()]);
  keepFresh();
}

void start();
