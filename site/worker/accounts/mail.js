/**
 * A plain-text email as raw MIME (what Cloudflare's EmailMessage takes), for messages to the
 * studio's own inbox through the SEND_EMAIL binding.
 */
const toBase64 = (text) => {
  let binary = '';
  for (const b of new TextEncoder().encode(text)) binary += String.fromCharCode(b);
  return btoa(binary);
};
const encodeHeader = (text) => `=?UTF-8?B?${toBase64(text)}?=`;

export function plainEmail({
  from,
  to,
  subject,
  text,
  now = new Date(),
  id = crypto.randomUUID(),
}) {
  return [
    `From: ${encodeHeader('Hu/man website')} <${from}>`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject.replace(/[\r\n]+/g, ' '))}`,
    `Date: ${now.toUTCString()}`,
    `Message-ID: <${id}@${from.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    toBase64(text).replace(/.{76}/g, '$&\r\n'),
  ].join('\r\n');
}

/** Sends to the studio inbox. Never throws: the caller's work is already saved. */
export async function tellStudio(env, subject, text) {
  if (!env.SEND_EMAIL || !env.EmailMessage) return false;
  try {
    const raw = plainEmail({ from: env.FROM_ADDRESS, to: env.TO_ADDRESS, subject, text });
    await env.SEND_EMAIL.send(new env.EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw));
    return true;
  } catch (error) {
    console.error('Studio email failed', error);
    return false;
  }
}
