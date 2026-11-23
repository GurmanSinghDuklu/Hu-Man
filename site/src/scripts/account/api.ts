/**
 * Shared helpers for the client-area pages: calling the Worker's API (worker/accounts/), checking
 * who is logged in, the status line and the log-out button. Same-origin requests only; the browser
 * sends the session cookie and the Origin header the API checks.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** A site path with the base path in front (the GitHub Pages preview lives under /Hu-Man). */
export const sitePath = (path: string) => `${BASE}${path}`;

export interface ApiResult<T = Record<string, unknown>> {
  status: number;
  data: T & { ok?: boolean; error?: string; errors?: Record<string, string> };
}

/** Calls the API. A network failure (or a host with no API, like the preview) comes back as 0. */
export async function api<T = Record<string, unknown>>(
  path: string,
  {
    method = 'GET',
    body,
    headers,
  }: { method?: string; body?: unknown; headers?: HeadersInit } = {},
): Promise<ApiResult<T>> {
  const isRaw = body instanceof Blob;
  try {
    const res = await fetch(sitePath(path), {
      method,
      credentials: 'same-origin',
      headers: isRaw
        ? headers
        : body === undefined
          ? headers
          : { 'Content-Type': 'application/json', ...headers },
      body: isRaw ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const data = res.headers.get('Content-Type')?.includes('application/json')
      ? await res.json()
      : {};
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { ok: false, error: 'offline' } as ApiResult<T>['data'] };
  }
}

const statusEl = () => document.querySelector<HTMLElement>('[data-acct-status]');

/** Shows a message in the page's status line (tone 'warn' or 'ok'); '' clears it. */
export function setStatus(message: string, tone: 'warn' | 'ok' | '' = '') {
  const el = statusEl();
  if (!el) return;
  el.textContent = message;
  if (tone) el.dataset.tone = tone;
  else delete el.dataset.tone;
  // The line sits at the top of the page; bring it into view so a reply is never missed.
  if (message) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

export const UNAVAILABLE =
  'The client area isn’t available right now. Please try again in a few minutes, or email us.';

export interface Me {
  user: { name: string; email: string; role: 'client' | 'admin' };
  projects: {
    id: string;
    name: string;
    type: 'business' | 'portfolio' | 'custom';
    tier: string | null;
    concept: string | null;
    status: string;
    briefState: 'not-started' | 'draft' | 'sent';
    updatedAt: number | null;
    sentAt: number | null;
    stage: 'brief' | 'building' | 'preview' | 'paid' | 'live';
    quotePence: number | null;
    depositPence: number | null;
    depositPaidAt: number | null;
    duePence: number;
    paidPence: number | null;
    paidAt: number | null;
    previewAt: number | null;
    previewPath: string | null;
    previewBase: string;
    liveUrl: string | null;
    liveAt: number | null;
    kind: 'brief' | 'request';
    route: 'instant' | 'custom' | null;
    customDomain: string | null;
    customDomainStatus: string | null;
  }[];
}

/** Whole pence as money: £466, or £466.50 when there are pence. */
export const money = (pence: number | null) =>
  pence === null
    ? ''
    : `£${(pence / 100).toLocaleString('en-GB', {
        minimumFractionDigits: pence % 100 ? 2 : 0,
        maximumFractionDigits: 2,
      })}`;

/**
 * The logged-in user, or null after sending them to /login/ (and back here afterwards).
 * With `admin`, a client is told the page isn't for them.
 */
export async function requireLogin({ admin = false } = {}): Promise<Me | null> {
  const { status, data } = await api<Me>('/api/account/me');
  if (status === 401) {
    const next = location.pathname + location.search;
    location.replace(sitePath(`/login/?next=${encodeURIComponent(next)}`));
    return null;
  }
  if (status !== 200) {
    setStatus(UNAVAILABLE, 'warn');
    return null;
  }
  wireLogout();
  if (admin && data.user.role !== 'admin') {
    setStatus('This page is only for the Hu/man team.', 'warn');
    return null;
  }
  return data;
}

function wireLogout() {
  const button = document.querySelector<HTMLButtonElement>('[data-logout]');
  if (!button) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    location.replace(sitePath('/login/?out=1'));
  });
}

/** Builds an element with text (never HTML), so nothing a user typed can become markup. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Record<string, string>> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

export const briefStateLabel = {
  'not-started': 'Brief not started',
  draft: 'Brief in progress',
  sent: 'Brief sent',
} as const;

export const formatDate = (ms: number | null) =>
  ms
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        ms,
      )
    : '';

/** Field errors from the API onto the form's fields ([data-error-for] and [data-field]). */
export function showErrors(root: ParentNode, errors: Record<string, string> = {}) {
  root.querySelectorAll<HTMLElement>('[data-error-for]').forEach((p) => {
    const id = p.dataset.errorFor ?? '';
    p.textContent = errors[id] ?? '';
    const field = p.closest<HTMLElement>('[data-field]');
    if (field) field.toggleAttribute('data-invalid', Boolean(errors[id]));
  });
  const first = Object.keys(errors)[0];
  if (first) {
    root
      .querySelector<HTMLElement>(
        `[data-field="${CSS.escape(first)}"] :is(input, textarea, select)`,
      )
      ?.focus();
  }
}
