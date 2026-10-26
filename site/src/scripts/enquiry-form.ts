/**
 * The enquiry form, enhanced: prefills from the link that brought you here (?website=, ?topic=,
 * ?tier=), sends in place to /api/enquiry, shows field errors next to the fields, and if sending
 * fails offers a ready-written email instead. Without JavaScript the form still posts normally.
 * In mailto mode (preview builds with no server) it opens an email with everything filled in.
 */
type Fields = Record<string, string>;

const TOPIC_LABELS: Record<string, string> = {
  'ai-check': 'Free AI check',
  website: 'A new website or redesign',
  idea: 'My idea',
  tier: 'Pricing tier',
  other: 'Enquiry',
};

function fieldsOf(form: HTMLFormElement): Fields {
  const data: Fields = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === 'string') data[key] = value.trim();
  });
  return data;
}

function mailtoFor(email: string, f: Fields): string {
  const topic =
    f.topic === 'tier' && f.tier ? `${f.tier} tier` : (TOPIC_LABELS[f.topic] ?? 'Enquiry');
  const lines = [
    'Hi,',
    '',
    f.message || '',
    '',
    `Name: ${f.name ?? ''}`,
    f.website ? `Website: ${f.website}` : '',
    f.phone ? `Phone: ${f.phone}` : '',
  ].filter((line, i, all) => line !== '' || (all[i - 1] ?? '') !== '');
  return `mailto:${email}?subject=${encodeURIComponent(`${topic}${f.website ? `: ${f.website}` : ''}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function setErrors(form: HTMLFormElement, errors: Record<string, string>): void {
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((el) => {
    const name = el.dataset.errorFor ?? '';
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    const message = errors[name] ?? '';
    el.textContent = message;
    if (input) {
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', (el.id ||= `${input.id}-error`));
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
  });
  const first = Object.keys(errors)[0];
  if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
}

/** The same rules the server applies, so most mistakes are caught before sending. */
function check(f: Fields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!f.name) errors.name = 'Please add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email ?? '')) {
    errors.email = 'Please add an email address we can reply to.';
  }
  if (f.topic === 'ai-check' && !f.website) errors.website = 'Please add the website to check.';
  if (f.topic !== 'ai-check' && !f.message)
    errors.message = 'Please tell us a little about what you need.';
  return errors;
}

function status(form: HTMLFormElement, html: string, tone: 'ok' | 'warn'): void {
  const el = form.querySelector<HTMLElement>('[data-status]');
  if (!el) return;
  el.innerHTML = html;
  el.dataset.tone = tone;
  el.tabIndex = -1;
  el.focus();
}

function prefill(form: HTMLFormElement): void {
  const params = new URLSearchParams(window.location.search);
  const set = (name: string, value: string | null) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
    if (el && value && el.type !== 'hidden') el.value = value;
  };
  set('website', params.get('website'));
  const tier = params.get('tier');
  set('topic', tier ? 'tier' : params.get('topic'));
  set('tier', tier);
  const error = params.get('error');
  if (error) {
    const email = form.dataset.email ?? '';
    status(
      form,
      error === 'busy'
        ? 'Lots of messages just now. Please wait a minute and send it again.'
        : error === 'send'
          ? `Sorry, your message didn’t send. Please try again, or email <a href="mailto:${email}">${email}</a>.`
          : 'Please add your name, an email to reply to, and a few words about what you need.',
      'warn',
    );
  }
}

document.querySelectorAll<HTMLFormElement>('[data-enquiry-form]').forEach((form) => {
  prefill(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const f = fieldsOf(form);
    const errors = check(f);
    setErrors(form, errors);
    if (Object.keys(errors).length) return;

    const email = form.dataset.email ?? '';
    if (form.dataset.mode === 'mailto') {
      window.location.href = mailtoFor(email, f);
      return;
    }

    const button = form.querySelector<HTMLButtonElement>('[data-submit]');
    if (button) button.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        errors?: Record<string, string>;
      };
      if (res.ok && body.ok) {
        form.querySelector<HTMLElement>('[data-fields]')?.setAttribute('hidden', '');
        status(
          form,
          '<strong>Thanks, that’s sent.</strong> A real person will read it and reply by email. If it’s urgent, WhatsApp us too.',
          'ok',
        );
        return;
      }
      if (res.status === 400 && body.errors) {
        setErrors(form, body.errors);
        return;
      }
      if (res.status === 429) {
        status(form, 'Lots of messages just now. Please wait a minute and send it again.', 'warn');
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      status(
        form,
        `Sorry, that didn’t send. <a href="${mailtoFor(email, f).replace(/"/g, '&quot;')}">Open it as an email instead</a>, with everything you typed filled in.`,
        'warn',
      );
    } finally {
      if (button) button.disabled = false;
    }
  });
});

export {};
