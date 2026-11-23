/** /login/: email and password, then on to where they were going (or their home in the area). */
import { api, setStatus, sitePath, UNAVAILABLE } from './api';

const form = document.querySelector<HTMLFormElement>('[data-login]');
const params = new URLSearchParams(location.search);

if (params.get('out')) setStatus('You’ve logged out.', 'ok');

/** Only send people on to pages inside the client area. */
function nextPath(role: string): string {
  const next = params.get('next') ?? '';
  if (/^\/(?:[\w-]+\/)?(?:account|admin)\/[\w\-/?=&%.]*$/.test(next) && !next.includes('//')) {
    return next;
  }
  return sitePath(role === 'admin' ? '/admin/' : '/account/');
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
  const password = (form.elements.namedItem('password') as HTMLInputElement).value;
  if (!email || !password) {
    setStatus('Please enter your email and password.', 'warn');
    return;
  }
  const button = form.querySelector<HTMLButtonElement>('[data-submit]');
  if (button) button.disabled = true;
  setStatus('Logging in…');
  const { status, data } = await api<{ role: string }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (button) button.disabled = false;
  if (status === 200) {
    location.replace(nextPath(data.role));
    return;
  }
  setStatus(status === 0 || status >= 500 ? UNAVAILABLE : (data.error ?? UNAVAILABLE), 'warn');
  (form.elements.namedItem('password') as HTMLInputElement).select();
});
