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

async function loadClients() {
  const target = root!.querySelector<HTMLElement>('[data-clients]')!;
  const { status, data } = await api<{ clients: Client[] }>('/api/admin/clients');
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return;
  }
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
    form.closest('details')?.removeAttribute('open');
    await loadClients();
    return;
  }
  if (data.errors) showErrors(form, data.errors);
  setStatus(data.error ?? UNAVAILABLE, 'warn');
});

async function start() {
  const me = await requireLogin({ admin: true });
  if (!me || !root) return;
  root.hidden = false;
  await loadClients();
}

void start();
