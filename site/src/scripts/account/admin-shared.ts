/** Bits both admin pages use: the setup-link box and copying to the clipboard. */
import { setStatus } from './api';
import { site } from '../../config/site';

/** Shows a fresh setup link with a ready-to-send message, and focuses it. */
export function showSetupLink(name: string, url: string) {
  const box = document.querySelector<HTMLElement>('[data-link-box]');
  if (!box) return;
  box.querySelector('[data-link-name]')!.textContent = name;
  box.querySelector<HTMLInputElement>('[data-link-url]')!.value = url;
  box.querySelector<HTMLTextAreaElement>('[data-link-message]')!.value = [
    `Hi ${name.split(' ')[0]},`,
    '',
    'Here’s the link to set up your Hu/man client account, where you can tell us about your project and send us your files:',
    '',
    url,
    '',
    'It works once and lasts 7 days. Any questions, just reply to this email.',
    '',
    site.name,
  ].join('\n');
  box.hidden = false;
  box.querySelector<HTMLElement>('h2')?.focus();
}

document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) =>
  button.addEventListener('click', async () => {
    const field = document.getElementById(button.dataset.copy!) as HTMLInputElement | null;
    if (!field) return;
    try {
      await navigator.clipboard.writeText(field.value);
      setStatus('Copied.', 'ok');
    } catch {
      field.select();
      setStatus('Select the text and copy it (Ctrl or Cmd + C).', 'warn');
    }
  }),
);
