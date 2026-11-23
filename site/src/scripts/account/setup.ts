/** /account/setup/?t=…: check the link, then set the name and password and log in. */
import { api, setStatus, sitePath, showErrors, UNAVAILABLE } from './api';

const form = document.querySelector<HTMLFormElement>('[data-setup]');
const bad = document.querySelector<HTMLElement>('[data-setup-bad]');
const token = new URLSearchParams(location.search).get('t') ?? '';
const MIN = 10;

async function start() {
  if (!form || !bad) return;
  if (!token) {
    setStatus('This page needs the setup link we sent you.', 'warn');
    bad.hidden = false;
    return;
  }
  const { status, data } = await api<{ email: string; name: string }>(
    `/api/auth/setup?t=${encodeURIComponent(token)}`,
  );
  if (status === 404) {
    setStatus('This setup link has expired or has already been used.', 'warn');
    bad.hidden = false;
    return;
  }
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return;
  }
  // The link has done its job: keep the token out of the address bar and history from here on.
  history.replaceState(null, '', location.pathname);
  form.querySelector('[data-setup-email]')!.textContent = data.email;
  (form.querySelector('[data-setup-username]') as HTMLInputElement).value = data.email;
  (form.elements.namedItem('name') as HTMLInputElement).value = data.name;
  form.hidden = false;
  (form.elements.namedItem('password') as HTMLInputElement).focus();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
  const errors: Record<string, string> = {};
  if (!value('name').trim()) errors.name = 'Please add your name.';
  if (value('password').length < MIN) errors.password = `Please use at least ${MIN} characters.`;
  else if (value('password') !== value('confirm'))
    errors.confirm = 'The two passwords don’t match.';
  showErrors(form, errors);
  if (Object.keys(errors).length) return;

  const button = form.querySelector<HTMLButtonElement>('[data-submit]');
  if (button) button.disabled = true;
  const { status, data } = await api<{ role: string }>('/api/auth/setup', {
    method: 'POST',
    body: { token, name: value('name'), password: value('password') },
  });
  if (button) button.disabled = false;
  if (status === 200) {
    location.replace(sitePath(data.role === 'admin' ? '/admin/' : '/account/'));
  } else if (status === 400) {
    showErrors(form, { password: data.error ?? 'Please choose a longer password.' });
  } else if (status === 404) {
    form.hidden = true;
    bad!.hidden = false;
    setStatus('This setup link has expired or has already been used.', 'warn');
  } else {
    setStatus(UNAVAILABLE, 'warn');
  }
});

void start();
