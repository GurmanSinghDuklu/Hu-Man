/** /account/: each project with its brief's state, a way into the brief, and the preview box. */
import {
  api,
  requireLogin,
  el,
  sitePath,
  briefStateLabel,
  formatDate,
  money,
  setStatus,
  UNAVAILABLE,
  type Me,
} from './api';
import { projectTypeLabels } from '../../data/brief';

const root = document.querySelector<HTMLElement>('[data-account]');

type Project = Me['projects'][number];

/** Pay what's left: opens Stripe's own payment page. */
async function payFor(project: Project, button: HTMLButtonElement) {
  button.disabled = true;
  setStatus('Opening the secure payment page…');
  const { status, data } = await api<{ url: string }>(
    `/api/account/pay?p=${encodeURIComponent(project.id)}`,
    { method: 'POST' },
  );
  if (status === 200 && data.url?.startsWith('https://')) {
    location.href = data.url;
    return;
  }
  button.disabled = false;
  setStatus(data.error ?? UNAVAILABLE, 'warn');
}

/** The preview, payment and live state of one project. */
function previewCard(project: Project) {
  const card = el('article', { class: 'acct-card', 'data-preview-card': project.id });
  const openPreview = () =>
    el('a', {
      class: 'btn btn--outline',
      href: sitePath(project.previewPath ?? '/account/'),
      target: '_blank',
      rel: 'noopener',
      text: 'Open your preview',
    });

  if (project.stage === 'live' && project.liveUrl) {
    card.append(
      el('h2', { text: 'Your site is live' }),
      el(
        'p',
        { class: 'acct-small' },
        'It went live on ',
        formatDate(project.liveAt),
        '. Thank you for working with us.',
      ),
      el(
        'div',
        { class: 'acct-actions' },
        el(
          'a',
          {
            class: 'pill-btn',
            href: project.liveUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          'Visit your site',
          el('span', { class: 'visually-hidden', text: ' (opens in a new tab)' }),
        ),
      ),
    );
    return card;
  }
  if (project.stage === 'paid') {
    card.append(
      el('h2', { text: 'Paid. Going live soon' }),
      el('p', {
        class: 'acct-small',
        text: `You paid ${money(project.paidPence)} on ${formatDate(project.paidAt)}. We’re connecting your domain now and will email you when it’s live.`,
      }),
      el('div', { class: 'acct-actions' }, openPreview()),
    );
    return card;
  }
  if (project.stage === 'preview') {
    const rows = [
      project.quotePence !== null && ['Fixed price', money(project.quotePence)],
      project.depositPaidAt && ['Deposit paid', money(project.depositPence ?? 0)],
      project.duePence > 0 && ['Left to pay', money(project.duePence)],
    ].filter(Boolean) as [string, string][];
    card.append(
      el('h2', { text: 'Your preview is ready' }),
      el('p', {
        class: 'acct-small',
        text: 'Click round it on your phone and computer. It’s just for you: nobody else can see it, and it goes live on your own address once it’s paid for.',
      }),
      el('div', { class: 'acct-actions' }, openPreview()),
    );
    if (rows.length) {
      card.append(
        el(
          'dl',
          { class: 'acct-dl' },
          ...rows.map(([term, value]) =>
            el('div', {}, el('dt', { text: term }), el('dd', { text: value })),
          ),
        ),
      );
    }
    if (project.duePence > 0) {
      const button = el('button', {
        type: 'button',
        class: 'pill-btn',
        text: `Pay ${money(project.duePence)} and go live`,
      });
      button.addEventListener('click', () => void payFor(project, button));
      card.append(
        el('div', { class: 'acct-actions' }, button),
        el('p', {
          class: 'acct-small',
          text: 'Payment is by card on Stripe’s secure page. We never see your card details.',
        }),
      );
    } else {
      card.append(
        el('p', { class: 'acct-small', text: 'We’ll confirm the final amount with you by email.' }),
      );
    }
    return card;
  }
  card.append(
    el('h2', { text: 'Your preview' }),
    el('p', {
      class: 'acct-small',
      text:
        project.stage === 'building'
          ? 'We’re building your site. Your preview will appear here as soon as it’s ready to look round.'
          : 'Your preview will appear here once we’ve built it. You’ll be able to look round it before anything goes live.',
    }),
  );
  return card;
}

/** After paying, Stripe brings them back with ?paid=1: wait for Stripe's confirmation to land. */
async function waitForPayment() {
  history.replaceState(null, '', location.pathname);
  setStatus('Thank you. Your payment is being confirmed; this page updates by itself.', 'ok');
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const { status, data } = await api<Me>('/api/account/me');
    if (status === 200 && data.projects.some((p) => p.stage === 'paid' || p.stage === 'live')) {
      setStatus('Payment confirmed. Thank you!', 'ok');
      for (const p of data.projects) {
        root
          ?.querySelector(`[data-preview-card="${CSS.escape(p.id)}"]`)
          ?.replaceWith(previewCard(p));
      }
      return;
    }
  }
}

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
    if (project.kind === 'request') {
      list.append(requestCard(project));
      if (project.route === 'instant' || project.previewPath) list.append(previewCard(project));
      continue;
    }
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
      previewCard(project),
    );
  }
  if (me.user.role === 'client') root.append(deleteCard());
  root.hidden = false;
  if (new URLSearchParams(location.search).get('paid')) void waitForPayment();
}

const ROUTE_LABEL = {
  instant: 'Choose design + upload CV',
  custom: 'Custom made portfolio',
} as const;

/** A portfolio request from /contact/. */
function requestCard(project: Project) {
  const sent = project.briefState === 'sent';
  const facts = [
    project.route ? ROUTE_LABEL[project.route as keyof typeof ROUTE_LABEL] : '',
    project.concept ? `Design: ${project.concept}` : '',
  ].filter(Boolean);
  const edit = sitePath(`/contact/?p=${encodeURIComponent(project.id)}`);
  return el(
    'article',
    { class: 'acct-card' },
    el('h2', { text: project.name }),
    el('p', { class: 'acct-small', text: facts.join(' · ') }),
    el('p', {
      class: 'acct-tag',
      'data-state': sent ? 'sent' : 'draft',
      text: sent ? 'Request sent' : 'Not sent yet',
    }),
    el('p', {
      class: 'acct-small',
      text: sent
        ? project.route === 'custom'
          ? `Sent on ${formatDate(project.sentAt)}. A real person will reply by email within 48 hours.`
          : `Sent on ${formatDate(project.sentAt)}.`
        : 'You started this but haven’t sent it yet.',
    }),
    sent && project.route !== 'instant'
      ? null
      : el(
          'div',
          { class: 'acct-actions' },
          el('a', {
            class: sent ? 'btn btn--outline' : 'pill-btn',
            href: edit,
            text: sent ? 'Change your details' : 'Finish your request',
          }),
        ),
  );
}

/** Delete my account: everything about them goes, after a confirm. */
function deleteCard() {
  const button = el('button', { type: 'button', class: 'acct-danger', text: 'Delete my account' });
  button.addEventListener('click', async () => {
    const sure = window.confirm(
      'Delete your account and everything in it: your details, requests, CV and any portfolio we built? This can’t be undone.',
    );
    if (!sure) return;
    const { status } = await api('/api/account/me', { method: 'DELETE' });
    if (status === 200) location.replace(sitePath('/?deleted=1'));
    else setStatus(UNAVAILABLE, 'warn');
  });
  return el(
    'section',
    { class: 'acct-card', 'aria-labelledby': 'delete-title' },
    el('h2', { id: 'delete-title', text: 'Your data' }),
    el('p', {
      class: 'acct-small',
      text: 'Your details and CV are encrypted, stored privately in Europe and only seen by our team. You can delete everything at any time.',
    }),
    el('div', { class: 'acct-actions' }, button),
  );
}

void start();
