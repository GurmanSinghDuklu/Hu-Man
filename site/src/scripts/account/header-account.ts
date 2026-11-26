/**
 * The header's Sign in link (components/SiteHeader.astro). After the page has loaded (so it never
 * slows the first paint), asks the Worker who is signed in. Signed in: the link shows their first
 * name and goes to their dashboard (/account/, or /admin/ for the team), and hovering or focusing it
 * shows View dashboard and Sign out. Signed out, or no API (the GitHub Pages preview): it stays
 * "Sign in". The phone menu gets the same.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface Me {
  user: { name: string; role: 'client' | 'admin' };
}

/** /api/auth/session answers 200 with user null when signed out, so no console error. */
async function who(): Promise<Me | null> {
  try {
    const res = await fetch(`${BASE}/api/auth/session`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: Me['user'] | null };
    return data.user ? { user: data.user } : null;
  } catch {
    return null;
  }
}

async function signOut() {
  try {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'same-origin' });
  } finally {
    location.assign(`${BASE}/`);
  }
}

async function start() {
  const me = await who();
  if (!me) return;
  const dash = `${BASE}${me.user.role === 'admin' ? '/admin/' : '/account/'}`;
  const first = me.user.name.trim().split(/\s+/)[0] || 'Your account';
  const name = first.length > 14 ? `${first.slice(0, 13)}…` : first;

  document.querySelectorAll<HTMLElement>('[data-acctnav]').forEach((wrap) => {
    const link = wrap.querySelector<HTMLAnchorElement>('[data-acctnav-link]')!;
    link.textContent = name;
    link.href = dash;
    link.setAttribute('aria-label', `${me.user.name}: your dashboard`);
    const menu = wrap.querySelector<HTMLElement>('[data-acctnav-menu]')!;
    menu.querySelector<HTMLAnchorElement>('[data-acctnav-dash]')!.href = dash;
    menu.querySelector('[data-acctnav-out]')!.addEventListener('click', () => void signOut());
    menu.hidden = false;
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-acctnav-mobile]').forEach((link) => {
    link.textContent = `${name}: dashboard`;
    link.href = dash;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-acctnav-out-mobile]').forEach((b) => {
    b.hidden = false;
    b.addEventListener('click', () => void signOut());
  });
}

if (document.readyState === 'complete') void start();
else window.addEventListener('load', () => void start(), { once: true });
