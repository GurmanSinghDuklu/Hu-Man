/** /admin/client/?id=: one client, their projects' briefs and files. */
import {
  api,
  requireLogin,
  setStatus,
  el,
  sitePath,
  briefStateLabel,
  formatDate,
  money,
  showErrors,
  UNAVAILABLE,
  type Me,
} from './api';
import { showSetupLink } from './admin-shared';
import { stepsFor, answerText, projectTypeLabels, type BriefAnswers } from '../../data/brief';
import { requestFields, requestAnswerText } from '../../data/portfolioRequest';
import { portfolioConcepts } from '../../data/portfolioConcepts';

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

type Project = Detail['projects'][number];

const STAGES = {
  brief: 'Brief',
  building: 'Deposit paid, building',
  preview: 'Preview up, waiting for payment',
  paid: 'Paid, ready to go live',
  live: 'Live',
} as const;

/** Posts an admin action for a project, then reloads the page's data. */
async function act(project: Project, action: string, body: object, done: string) {
  const { status, data } = await api(
    `/api/admin/projects/${encodeURIComponent(project.id)}/${action}`,
    { method: 'POST', body },
  );
  if (status === 200) {
    setStatus(done, 'ok');
    await load();
  } else setStatus(data.error ?? UNAVAILABLE, 'warn');
}

/** Quote, deposit, preview, final payment and going live, for one project. */
function moneyCard(project: Project, clientEmail: string) {
  const id = (name: string) => `m-${project.id}-${name}`;
  const card = el(
    'section',
    { class: 'acct-card', 'aria-labelledby': id('title') },
    el('h2', { id: id('title'), text: `${project.name}: money, preview and going live` }),
    el('p', {
      class: 'acct-tag',
      'data-state': project.stage === 'live' ? 'sent' : 'draft',
      text: STAGES[project.stage],
    }),
  );

  // 1. Quote and deposit.
  const form = el('form', { class: 'acct-form', novalidate: '' });
  const pounds = (pence: number | null) => (pence === null ? '' : String(pence / 100));
  const field = (name: string, label: string, value: string) =>
    el(
      'div',
      { class: 'acct-field', 'data-field': name },
      el('label', { for: id(name), text: label }),
      el('input', {
        id: id(name),
        name,
        type: 'text',
        inputmode: 'decimal',
        value,
        placeholder: 'e.g. 932',
      }),
      el('p', { class: 'acct-field__error', 'data-error-for': name }),
    );
  form.append(
    el('h3', { text: '1. Fixed price' }),
    field('quote', 'Quote (£)', pounds(project.quotePence)),
    field('deposit', 'Deposit (£)', pounds(project.depositPence)),
    el(
      'div',
      { class: 'acct-actions' },
      el('button', { type: 'submit', class: 'btn btn--outline', text: 'Save amounts' }),
    ),
  );
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    showErrors(form, {});
    void act(
      project,
      'money',
      { quote: value('quote'), deposit: value('deposit') },
      'Amounts saved.',
    );
  });
  card.append(form);

  const depositButton = el('button', {
    type: 'button',
    class: 'btn btn--outline',
    text: project.depositPaidAt ? 'Undo: deposit not paid' : 'Mark deposit paid',
  });
  depositButton.addEventListener(
    'click',
    () =>
      void act(
        project,
        'deposit',
        { paid: !project.depositPaidAt },
        project.depositPaidAt ? 'Deposit unmarked.' : 'Deposit marked paid.',
      ),
  );
  card.append(
    el('p', {
      class: 'acct-small',
      text: project.depositPaidAt
        ? `Deposit of ${money(project.depositPence ?? 0)} marked paid on ${formatDate(project.depositPaidAt)}.`
        : 'Deposit not marked paid yet (it’s paid off the site, by invoice or transfer).',
    }),
    el('div', { class: 'acct-actions' }, depositButton),
  );

  // 2. Preview.
  card.append(el('h3', { text: '2. Preview' }));
  if (project.previewPath) {
    card.append(
      el('p', {
        class: 'acct-small',
        text: `Up since ${formatDate(project.previewAt)}. Upload again to update it.`,
      }),
      el(
        'div',
        { class: 'acct-actions' },
        el('a', {
          class: 'btn btn--outline',
          href: sitePath(project.previewPath),
          target: '_blank',
          rel: 'noopener',
          text: 'Open the preview',
        }),
      ),
    );
  } else {
    card.append(
      el('p', {
        class: 'acct-small',
        text: 'No preview yet. Build the site with this base path, then upload it:',
      }),
    );
  }
  card.append(
    el('pre', {
      class: 'admin__code',
      text: `Base path: ${project.previewBase}
npm run preview-upload -- ${clientEmail} <built folder>`,
    }),
  );

  // 3. Final payment.
  card.append(el('h3', { text: '3. Final payment' }));
  if (project.paidAt) {
    card.append(
      el('p', {
        class: 'acct-small',
        text: `${money(project.paidPence)} paid on ${formatDate(project.paidAt)}.`,
      }),
    );
  } else {
    card.append(
      el('p', {
        class: 'acct-small',
        text: project.previewPath
          ? `${money(project.duePence) || 'The amount'} left to pay. They can pay by card in their account, or mark it paid here if they paid another way.`
          : 'They can pay once the preview is up.',
      }),
    );
    const paid = el('button', {
      type: 'button',
      class: 'btn btn--outline',
      text: 'Mark final payment received',
    });
    paid.addEventListener('click', () => {
      if (
        window.confirm(
          `Mark ${money(project.duePence) || 'the final payment'} as received for ${project.name}?`,
        )
      ) {
        void act(project, 'paid', {}, 'Final payment marked received.');
      }
    });
    card.append(el('div', { class: 'acct-actions' }, paid));
  }

  // 4. Live.
  card.append(el('h3', { text: '4. Going live' }));
  if (project.liveUrl) {
    card.append(
      el(
        'p',
        { class: 'acct-small' },
        `Live since ${formatDate(project.liveAt)} at `,
        el('a', {
          class: 'acct-link',
          href: project.liveUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          text: project.liveUrl,
        }),
        '.',
      ),
    );
  } else if (project.paidAt) {
    const live = el('form', { class: 'acct-form', novalidate: '' });
    live.append(
      el(
        'div',
        { class: 'acct-field' },
        el('label', { for: id('url'), text: 'Live address' }),
        el('input', {
          id: id('url'),
          name: 'url',
          type: 'url',
          inputmode: 'url',
          placeholder: 'https://their-domain.co.uk',
        }),
      ),
      el(
        'div',
        { class: 'acct-actions' },
        el('button', { type: 'submit', class: 'pill-btn', text: 'Mark live' }),
      ),
    );
    live.addEventListener('submit', (event) => {
      event.preventDefault();
      const url = (live.elements.namedItem('url') as HTMLInputElement).value;
      void act(project, 'live', { url }, 'Marked live. Their account now shows the address.');
    });
    card.append(
      el('p', { class: 'acct-small', text: 'Connect their domain, then enter the address.' }),
      live,
    );
  } else {
    card.append(el('p', { class: 'acct-small', text: 'Available once the final payment is in.' }));
  }
  return card;
}

function renderProject(project: Detail['projects'][number]) {
  const card = el(
    'section',
    { class: 'acct-card' },
    el('h2', { text: project.name }),
    el('p', {
      class: 'acct-small',
      text: [
        projectTypeLabels[project.type],
        project.tier && `Tier: ${project.tier.replace(/^Portfolio: /, '')}`,
        project.concept && `Design: ${project.concept}`,
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

  if (project.kind === 'request') {
    // A portfolio request from /portfolio/start/: its own questions, then the CV.
    const rows: HTMLElement[] = [];
    for (const field of requestFields) {
      const text = requestAnswerText(field, project.answers[field.id]);
      if (text) rows.push(el('div', {}, el('dt', { text: field.label }), el('dd', { text })));
    }
    const cvs = project.files.filter((f) => f.field === 'cv');
    if (cvs.length) {
      rows.push(
        el(
          'div',
          {},
          el('dt', { text: 'CV' }),
          el(
            'dd',
            {},
            el(
              'ul',
              { class: 'bfiles' },
              ...cvs.map((f) =>
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
                ),
              ),
            ),
          ),
        ),
      );
    }
    card.append(
      el('p', {
        class: 'acct-small',
        text: `${project.route === 'instant' ? 'Built from a design' : project.route === 'custom' ? 'Custom made portfolio' : 'Fill in details now'}${project.concept ? ` · Design: ${project.concept}` : ''}`,
      }),
      rows.length
        ? el('dl', { class: 'acct-dl' }, ...rows)
        : el('p', { class: 'acct-small', text: 'Nothing filled in yet.' }),
    );
    // Designs with an automatic build (worker/accounts/concepts/): the team can make the preview
    // from their answers in one click; the client then sees it, pays and it's published.
    const buildable = portfolioConcepts.some((c) => c.name === project.concept && c.instantTier);
    if (buildable && !project.liveAt) {
      const build = el('button', {
        type: 'button',
        class: 'btn btn--outline',
        text: project.previewPath
          ? 'Rebuild the preview from their answers'
          : 'Build a preview from this design',
      });
      build.addEventListener('click', async () => {
        build.disabled = true;
        setStatus('Building…');
        const { status, data } = await api<{ previewPath: string }>(
          `/api/admin/projects/${encodeURIComponent(project.id)}/build`,
          { method: 'POST' },
        );
        build.disabled = false;
        if (status === 200) {
          setStatus('Built. They can see it in their account now.', 'ok');
          await load();
        } else setStatus(data.error ?? UNAVAILABLE, 'warn');
      });
      card.append(el('div', { class: 'acct-actions' }, build));
    }
    return card;
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
  root!
    .querySelector('[data-client-projects]')!
    .replaceChildren(...projects.flatMap((p) => [moneyCard(p, client.email), renderProject(p)]));
  root!.hidden = false;

  // Clients can be removed here; admins (the team) can't.
  const remove = root!.querySelector<HTMLElement>('[data-remove]')!;
  remove.hidden = client.role !== 'client';
  root!.querySelector<HTMLButtonElement>('[data-delete-client]')!.onclick = async () => {
    const sure = window.confirm(
      `Delete ${client.name} (${client.email}) and everything about them: account, brief, files and enquiries? This can’t be undone.`,
    );
    if (!sure) return;
    const { status: s } = await api(`/api/admin/clients/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (s === 200) location.replace(sitePath(`/admin/?deleted=${encodeURIComponent(client.name)}`));
    else setStatus(UNAVAILABLE, 'warn');
  };

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
