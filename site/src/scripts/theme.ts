/**
 * Manual theme toggle. Persists to localStorage; falls back silently (and
 * to prefers-color-scheme) if storage is unavailable (private browsing etc).
 */
type Theme = 'light' | 'dark';

const STORAGE_KEY = 'duklu-theme';

function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore — theme just won't persist this session
  }
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

export function initThemeToggle(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!toggle) return;

  applyTheme(currentTheme());

  toggle.addEventListener('click', () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeStoredTheme(next);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
} else {
  initThemeToggle();
}
