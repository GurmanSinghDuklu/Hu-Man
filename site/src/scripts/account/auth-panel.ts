/**
 * The sign-in / create-account panel (components/account/AuthPanel.astro). Create an account → an
 * emailed 6-digit code → logged in. Log in (an unconfirmed email goes to the code step). Forgotten
 * password → a reset link by email. Talks to /api/auth/* (worker/accounts/auth.js).
 *
 * Inline (/login/): on success it goes to where they were heading, or their home in the area.
 * Dialog (/contact/): `openAuth()` shows it over the page and resolves true once they're in, false
 * if they close it, so the form underneath can carry on sending with nothing re-typed.
 */
import { api, sitePath, showErrors } from './api';

type View = 'signup' | 'login' | 'code' | 'forgot';
const TITLES: Record<View, [string, string]> = {
  signup: [
    'Create your account',
    'So you can see your request, your portfolio and anything we send back.',
  ],
  login: ['Log in', 'Welcome back.'],
  code: ['Check your email', ''],
  forgot: ['Forgotten your password?', 'We’ll email you a link to choose a new one.'],
};

const done = new WeakMap<HTMLElement, (ok: boolean) => void>();

/** Where an inline panel sends people after logging in: only somewhere inside the client area. */
function nextPath(role: string): string {
  const next = new URLSearchParams(location.search).get('next') ?? '';
  if (
    /^\/(?:[\w-]+\/)?(?:account|admin|contact)\/[\w\-/?=&%.]*$/.test(next) &&
    !next.includes('//')
  ) {
    return next;
  }
  return sitePath(role === 'admin' ? '/admin/' : '/account/');
}

export function setupAuth(root: HTMLElement) {
  const isDialog = root instanceof HTMLDialogElement;
  const status = root.querySelector<HTMLElement>('[data-auth-status]')!;
  const say = (text: string, tone: '' | 'ok' | 'warn' = '') => {
    status.textContent = text;
    if (tone) status.dataset.tone = tone;
    else delete status.dataset.tone;
  };
  let email = '';

  const show = (view: View, keepStatus = false) => {
    root.querySelectorAll<HTMLElement>('[data-auth-view]').forEach((form) => {
      form.hidden = form.dataset.authView !== view;
    });
    const [title, lede] = TITLES[view];
    root.querySelector('[data-auth-title]')!.textContent = title;
    const ledeEl = root.querySelector<HTMLElement>('[data-auth-lede]')!;
    ledeEl.textContent = lede;
    ledeEl.hidden = !lede;
    if (!keepStatus) say('');
    root.querySelector<HTMLElement>('[data-auth-title]')!.focus();
    if (view === 'login' && email) {
      (root.querySelector('#auth-login-email') as HTMLInputElement).value = email;
    }
  };

  const finish = (role: string) => {
    const resolve = done.get(root);
    if (isDialog && resolve) {
      done.delete(root);
      root.close();
      resolve(true);
    } else {
      location.replace(nextPath(role));
    }
  };

  const toCode = (to: string, devCode?: string) => {
    email = to;
    show('code');
    const note = root.querySelector<HTMLElement>('[data-auth-code-note]')!;
    note.textContent = `We’ve emailed a 6-digit code to ${to}. It works for 15 minutes.`;
    if (devCode) {
      (root.querySelector('#auth-code') as HTMLInputElement).value = devCode;
      note.textContent += ' (Local testing: the code is filled in for you.)';
    }
  };

  const busy = (form: HTMLFormElement, on: boolean) => {
    form.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled = on;
  };
  const value = (form: HTMLFormElement, name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement).value;
  const trouble = (code: number, message?: string) =>
    say(
      code === 429
        ? 'Lots of tries just now. Please wait a minute and try again.'
        : code === 0 || code >= 500
          ? 'We couldn’t reach the site just now. Please try again in a moment.'
          : (message ?? 'Something went wrong. Please try again.'),
      'warn',
    );

  root
    .querySelectorAll<HTMLElement>('[data-auth-show]')
    .forEach((b) => b.addEventListener('click', () => show(b.dataset.authShow as View)));
  root
    .querySelector('[data-auth-close]')
    ?.addEventListener('click', () => root instanceof HTMLDialogElement && root.close());
  if (isDialog) {
    root.addEventListener('close', () => {
      const resolve = done.get(root);
      done.delete(root);
      resolve?.(false);
    });
  }

  const forms = Object.fromEntries(
    [...root.querySelectorAll<HTMLFormElement>('[data-auth-view]')].map((f) => [
      f.dataset.authView,
      f,
    ]),
  ) as Record<View, HTMLFormElement>;

  forms.signup.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = forms.signup;
    showErrors(f, {});
    busy(f, true);
    const { status: code, data } = await api<{ devCode?: string }>('/api/auth/signup', {
      method: 'POST',
      body: { name: value(f, 'name'), email: value(f, 'email'), password: value(f, 'password') },
    });
    busy(f, false);
    if (code === 200) toCode(value(f, 'email').trim(), data.devCode);
    else if (code === 400 && data.errors) showErrors(f, data.errors);
    else trouble(code, data.error);
  });

  forms.login.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = forms.login;
    busy(f, true);
    const { status: code, data } = await api<{ role: string; verify?: boolean; devCode?: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email: value(f, 'email'), password: value(f, 'password') } },
    );
    busy(f, false);
    if (code === 200) finish(data.role);
    else if (code === 403 && data.verify) toCode(value(f, 'email').trim(), data.devCode);
    else trouble(code, data.error);
  });

  forms.code.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = forms.code;
    showErrors(f, {});
    busy(f, true);
    const { status: code, data } = await api<{ role: string }>('/api/auth/verify', {
      method: 'POST',
      body: { email, code: value(f, 'code') },
    });
    busy(f, false);
    if (code === 200) finish(data.role);
    else if (code === 400) showErrors(f, { code: data.error ?? 'That code isn’t right.' });
    else trouble(code, data.error);
  });

  root.querySelector('[data-auth-resend]')?.addEventListener('click', async () => {
    const { status: code, data } = await api<{ devCode?: string }>('/api/auth/resend', {
      method: 'POST',
      body: { email },
    });
    if (code === 200) {
      if (data.devCode) (root.querySelector('#auth-code') as HTMLInputElement).value = data.devCode;
      say('A new code is on its way. Only the newest one works.', 'ok');
    } else trouble(code, data.error);
  });

  forms.forgot.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = forms.forgot;
    busy(f, true);
    const { status: code, data } = await api('/api/auth/forgot', {
      method: 'POST',
      body: { email: value(f, 'email') },
    });
    busy(f, false);
    if (code === 200) {
      say(
        'If there’s an account for that email, a reset link is on its way. It works for an hour.',
        'ok',
      );
    } else trouble(code, data.error);
  });

  const params = new URLSearchParams(location.search);
  const first: View = params.get('forgot')
    ? 'forgot'
    : ((root.dataset.authStart as View) ?? 'signup');
  show(first, true);
  if (params.get('out')) say('You’ve logged out.', 'ok');
  // Keep focus on the page heading until someone opens a dialog.
  if (!isDialog) (document.activeElement as HTMLElement | null)?.blur();
}

/** Opens the dialog panel; resolves true once they're logged in, false if they close it. */
export function openAuth(start: 'signup' | 'login' = 'signup', message = ''): Promise<boolean> {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-auth]');
  if (!dialog) return Promise.resolve(false);
  return new Promise((resolve) => {
    done.set(dialog, resolve);
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>(`[data-auth-show="${start}"]`)?.click();
    const status = dialog.querySelector<HTMLElement>('[data-auth-status]')!;
    status.textContent = message;
    status.dataset.tone = 'ok';
  });
}
