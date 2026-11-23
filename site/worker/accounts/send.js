/**
 * Email to the public (sign-up codes, password resets, "we've got your request") through Resend's
 * API (secret RESEND_API_KEY; sender RESEND_FROM, e.g. "Hu/man <hello@humansoftwareagency.com>",
 * whose domain must be verified in Resend). Studio emails keep using Cloudflare's SEND_EMAIL
 * (mail.js). Never throws: without a key, or if Resend fails, it logs and returns false.
 * Replies go to the studio inbox. Nothing a stranger typed is put in the subject.
 */
export async function sendToPerson(env, { to, subject, text }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[email not sent: no RESEND_API_KEY] to ${to}: ${subject}`);
    return false;
  }
  try {
    const res = await (env.RESEND_FETCH ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM ?? 'Hu/man <hello@humansoftwareagency.com>',
        to: [to],
        reply_to: env.TO_ADDRESS,
        subject,
        text: `${text}\n\n--\nHu/man Software Agency · Leeds\nhumansoftwareagency.com`,
      }),
    });
    if (!res.ok) console.error('Resend refused', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (error) {
    console.error('Resend failed', error instanceof Error ? error.message : error);
    return false;
  }
}
