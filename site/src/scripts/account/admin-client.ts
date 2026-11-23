/** /admin/client/?id=: one client, their projects' briefs and files. */
import {
  api,
  requireLogin,
  setStatus,
  el,
  sitePath,
  briefStateLabel,
  formatDate,
  UNAVAILABLE,
  type Me,
} from './api';
import { showSetupLink } from './admin-shared';
import { stepsFor, answerText, projectTypeLabels, type BriefAnswers } from '../../data/brief';

interface Detail {
  client: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: number;
    hasPassword: boolean;
  };
  projects: (Me['projects'][number] & {
    answers: BriefAnswers;
    consentAt: number | null;
    files: { id: string; field: string; name: string; type: string; size: number }[];
  })[];
}

const root = document.querySelector<HTMLElement>('[data-client]');
const id = new URLSearchParams(location.search).get('id') ?? '';
const fact = (term: string, value: string) =>
  el('div', {}, el('dt', { text: term }), el('dd', { text: value || '–' }));
const fileUrl = (fileId: string) => sitePath(`/api/account/files/${encodeURIComponent(fileId)}`);

function renderProject(project: Detail['projects'][number]) {
  const card = el(
    'section',
    { class: 'acct-card' },
    el('h2', { text: project.name }),
    el('p', {
      class: 'acct-small',
      text: [
        projectTypeLabels[project.type],
        project.tier && `Tier: ${project.tier}`,
        project.concept && `Concept: ${project.concept}`,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
    el('p', {
      class: 'acct-tag',
      'data-state': project.briefState,
      text: briefStateLabel[project.briefState],
    }),
  );
  if (project.briefState === 'sent') {
    card.append(
      el('p', {
        class: 'acct-small',
        text: `Sent ${formatDate(project.sentAt)}. They ticked the accuracy and permission box.`,
      }),
    );
    const reopen = el('button', {
      type: 'button',
      class: 'btn btn--outline',
      text: 'Reopen the brief',
    });
    reopen.addEventListener('click', async () => {
      const { status } = await api(`/api/admin/projects/${encodeURIComponent(project.id)}/reopen`, {
        method: 'POST',
      });
      if (status === 200) {
        setStatus('Brief reopened: they can change it and send it again.', 'ok');
        await load();
      } else setStatus(UNAVAILABLE, 'warn');
    });
    card.append(el('div', { class: 'acct-actions' }, reopen));
  }

  for (const step of stepsFor(project.type)) {
    if (step.id === 'send') continue;
    const rows: HTMLElement[] = [];
    for (const field of step.fields) {
      if (field.kind === 'files') {
        const mine = project.files.filter((f) => f.field === field.id);
        if (mine.length) {
          rows.push(
            el(
              'div',
              {},
              el('dt', { text: field.label }),
              el(
                'dd',
                {},
                el(
                  'ul',
                  { class: 'bfiles' },
                  ...mine.map((f) =>
                    el(
                      'li',
                      {},
                      el('a', {
                        class: 'acct-link',
                        href: fileUrl(f.id),
                        target: '_blank',
                        rel: 'noopener',
                        text: f.name,
                      }),
                      el('span', { class: 'acct-small', text: f.type }),
                    ),
                  ),
                ),
              ),
            ),
          );
        }
        continue;
      }
      const text = answerText(field, project.answers[field.id]);
      if (text) rows.push(el('div', {}, el('dt', { text: field.label }), el('dd', { text })));
    }
    if (rows.length)
      card.append(el('h3', { text: step.title }), el('dl', { class: 'acct-dl' }, ...rows));
  }
  if (project.briefState === 'not-started') {
    card.append(el('p', { class: 'acct-small', text: 'Nothing filled in yet.' }));
  }
  return card;
}

async function load() {
  const { status, data } = await api<Detail>(`/api/admin/clients/${encodeURIComponent(id)}`);
  if (status === 404) {
    setStatus('No client with that link.', 'warn');
    return;
  }
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return;
  }
  const { client, projects } = data;
  document.querySelector('[data-acct-title]')!.textContent = client.name;
  root!
    .querySelector('[data-client-facts]')!
    .replaceChildren(
      fact('Email', client.email),
      fact('Account', client.hasPassword ? 'Set up' : 'Invited, password not set yet'),
      fact('Added', formatDate(client.createdAt)),
    );
  root!.querySelector('[data-client-projects]')!.replaceChildren(...projects.map(renderProject));
  root!.hidden = false;

  const button = root!.querySelector<HTMLButtonElement>('[data-new-link]')!;
  button.onclick = async () => {
    const { status: s, data: d } = await api<{ setupUrl: string }>(
      `/api/admin/clients/${encodeURIComponent(id)}/invite`,
      {
        method: 'POST',
      },
    );
    if (s === 200) showSetupLink(client.name, d.setupUrl);
    else setStatus(UNAVAILABLE, 'warn');
  };
}

async function start() {
  const me = await requireLogin({ admin: true });
  if (!me || !root) return;
  await load();
}

void start();
