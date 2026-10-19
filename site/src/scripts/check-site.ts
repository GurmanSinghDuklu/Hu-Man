/**
 * The "Check my site" form has no backend (no form service has been chosen). It opens the
 * visitor's email app with a short, readable message and their address filled in. Without JS
 * the form still posts to the same mailto: as plain text.
 */
document.querySelectorAll<HTMLFormElement>('[data-check-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('input[name="website"]');
    const website = input?.value.trim() ?? '';
    if (!website) {
      input?.focus();
      return;
    }
    const [address] = form.action.replace(/^mailto:/, '').split('?');
    const subject = encodeURIComponent('Free AI check');
    const body = encodeURIComponent(
      `Hi,\n\nPlease check my site: ${website}\n\nBusiness name:\nMain service:\n\n`,
    );
    window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
  });
});

export {};
