/** /account/: each project with its brief's state, a way into the brief, and the preview box. */
import { requireLogin, el, sitePath, briefStateLabel, formatDate } from './api';
import { projectTypeLabels } from '../../data/brief';

const root = document.querySelector<HTMLElement>('[data-account]');

async function start() {
  const me = await requireLogin();
  if (!me || !root) return;
  if (me.user.role === 'admin') {
    root.before(
      el(
        'p',
        { class: 'acct-small' },
        'You’re logged in as the team. ',
        el('a', { class: 'acct-link', href: sitePath('/admin/'), text: 'Go to clients' }),
        '.',
      ),
    );
  }
  root.querySelector('[data-account-hello]')!.textContent = `Hello, ${me.user.name}.`;
  const list = root.querySelector<HTMLElement>('[data-account-projects]')!;

  if (!me.projects.length) {
    list.append(
      el('p', {
        class: 'acct-small',
        text: 'There’s no project on your account yet. We’ll add it after our call.',
      }),
    );
  }
  for (const project of me.projects) {
    const briefHref = sitePath(`/account/brief/?p=${encodeURIComponent(project.id)}`);
    const action =
      project.briefState === 'sent'
        ? el('a', { class: 'btn btn--outline', href: briefHref, text: 'Read your brief' })
        : el('a', {
            class: 'pill-btn',
            href: briefHref,
            text:
              project.briefState === 'not-started'
                ? 'Start your brief'
                : 'Carry on with your brief',
          });
    const facts = [
      projectTypeLabels[project.type],
      project.tier ? `Tier: ${project.tier.replace(/^Portfolio: /, '')}` : '',
      project.concept ? `Concept: ${project.concept}` : '',
    ].filter(Boolean);
    list.append(
      el(
        'article',
        { class: 'acct-card' },
        el('h2', { text: project.name }),
        el('p', { class: 'acct-small', text: facts.join(' · ') }),
        el('p', {
          class: 'acct-tag',
          'data-state': project.briefState,
          text: briefStateLabel[project.briefState],
        }),
        project.briefState === 'sent'
          ? el('p', {
              class: 'acct-small',
              text: `Sent on ${formatDate(project.sentAt)}. We’ll be in touch by email. Need to change something? Just ask us.`,
            })
          : el('p', {
              class: 'acct-small',
              text: 'Tell us what you want and send what we need. It saves as you go, so you can come back to it.',
            }),
        el('div', { class: 'acct-actions' }, action),
      ),
      el(
        'article',
        { class: 'acct-card' },
        el('h2', { text: 'Your preview' }),
        el('p', {
          class: 'acct-small',
          text: 'Your preview will appear here once we’ve built it. You’ll be able to look round it before anything goes live.',
        }),
      ),
    );
  }
  root.hidden = false;
}

void start();
