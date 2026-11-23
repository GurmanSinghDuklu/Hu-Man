/**
 * Money for a project (spec: docs/superpowers/specs/2026-11-23-preview-and-payment-design.md).
 * The deposit is taken off the site and marked paid by an admin; only the final payment can be made
 * here, through Stripe Checkout, and only once the preview is up. Amounts are whole pence; the
 * quote and deposit are what an admin entered, never worked out from list prices.
 *
 * Stripe is called with fetch (no SDK). Only the webhook, signed with STRIPE_WEBHOOK_SECRET, marks a
 * payment as made; the "thank you" page proves nothing. Without STRIPE_SECRET_KEY the pay button
 * answers 503 and the account says payment details will be sent instead.
 */
import { json, fail, notFound, readJson, line } from './http.js';
import { projectFor, moneyOf } from './account.js';
import { safeEqual } from './crypto.js';
import { tellStudio } from './mail.js';
import { publish } from './instant.js';

const MAX_PENCE = 100_000_000; // £1,000,000: a typo guard
export const pounds = (pence) =>
  `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Pounds (number or text like "932" or "£1,195.50") to whole pence, or null if not a sensible amount. */
export function toPence(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(String(value).replace(/[£,\s]/g, ''));
  if (!Number.isFinite(number) || number < 0) return NaN;
  const pence = Math.round(number * 100);
  return pence > MAX_PENCE ? NaN : pence;
}

async function admins(env, id) {
  return env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
}

/** POST /api/admin/projects/<id>/money { quote, deposit } (pounds) */
export async function setMoney(request, env, id) {
  const p = await admins(env, id);
  if (!p) return notFound();
  const body = (await readJson(request)) ?? {};
  const quote = toPence(body.quote);
  const deposit = toPence(body.deposit);
  if (Number.isNaN(quote) || Number.isNaN(deposit))
    return fail(400, 'Please enter amounts in pounds.');
  if (quote !== null && deposit !== null && deposit > quote) {
    return fail(400, 'The deposit can’t be more than the quote.');
  }
  await env.DB.prepare('UPDATE projects SET quote_pence = ?, deposit_pence = ? WHERE id = ?')
    .bind(quote, deposit, id)
    .run();
  return json({ ok: true });
}

/** POST /api/admin/projects/<id>/deposit { paid: boolean } */
export async function setDeposit(request, env, id, now = Date.now()) {
  if (!(await admins(env, id))) return notFound();
  const body = (await readJson(request)) ?? {};
  await env.DB.prepare('UPDATE projects SET deposit_paid_at = ? WHERE id = ?')
    .bind(body.paid ? now : null, id)
    .run();
  return json({ ok: true });
}

/** POST /api/admin/projects/<id>/paid { amount? } : final payment received another way. */
export async function markPaid(request, env, id, now = Date.now()) {
  const p = await admins(env, id);
  if (!p) return notFound();
  if (p.paid_at) return fail(409, 'Already marked paid.');
  const body = (await readJson(request)) ?? {};
  const given = toPence(body.amount);
  if (Number.isNaN(given)) return fail(400, 'Please enter the amount in pounds.');
  const amount = given ?? moneyOf(p).duePence;
  await env.DB.prepare(
    "UPDATE projects SET paid_pence = ?, paid_at = ?, payment_ref = 'by hand' WHERE id = ?",
  )
    .bind(amount, now, id)
    .run();
  return json({ ok: true });
}

/** POST /api/admin/projects/<id>/live { url } : only once paid. */
export async function markLive(request, env, id, now = Date.now()) {
  const p = await admins(env, id);
  if (!p) return notFound();
  if (!p.paid_at) return fail(409, 'Mark the final payment first: sites go live only once paid.');
  const body = (await readJson(request)) ?? {};
  let address;
  try {
    address = new URL(line(body.url, 300));
  } catch {
    address = null;
  }
  if (!address || !['https:', 'http:'].includes(address.protocol)) {
    return fail(400, 'Please enter the live address, starting https://');
  }
  await env.DB.prepare('UPDATE projects SET live_url = ?, live_at = ? WHERE id = ?')
    .bind(address.href, now, id)
    .run();
  return json({ ok: true });
}

/**
 * POST /api/account/pay?p= { waiver } : the client's own project, preview up, something due.
 * Instant portfolios go live the moment they're paid for, so the person first ticks that they want
 * that and lose the 14-day cancellation right once it's live (`waiver: true`, time recorded).
 */
export async function pay(request, url, env, user, now = Date.now()) {
  const p = await projectFor(env, user, url.searchParams.get('p'));
  if (!p || p.user_id !== user.id) return notFound();
  const money = moneyOf(p);
  if (!p.preview_version || p.paid_at || !money.duePence) {
    return fail(409, 'There’s nothing to pay for this project just now.');
  }
  if (p.route === 'instant') {
    const body = (await readJson(request)) ?? {};
    if (body.waiver !== true) {
      return fail(400, 'Please tick the box to say you want it published straight away.', {
        errors: { waiver: 'Please tick this to pay and publish.' },
      });
    }
    await env.DB.prepare('UPDATE projects SET cancel_waiver_at = ? WHERE id = ?')
      .bind(now, p.id)
      .run();
  }
  if (!env.STRIPE_SECRET_KEY) {
    return fail(503, 'Card payments aren’t switched on yet. We’ll email you payment details.');
  }
  const form = new URLSearchParams({
    mode: 'payment',
    customer_email: user.email,
    client_reference_id: p.id,
    'metadata[project_id]': p.id,
    'payment_intent_data[metadata][project_id]': p.id,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': String(money.duePence),
    'line_items[0][price_data][product_data][name]': `${p.name}: final payment`,
    success_url: `${url.origin}/account/?paid=1`,
    cancel_url: `${url.origin}/account/`,
  });
  const send = env.STRIPE_FETCH ?? fetch;
  let session;
  try {
    const res = await send('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    session = await res.json();
    if (!res.ok || !session.url) throw new Error(session?.error?.message ?? `Stripe ${res.status}`);
  } catch (error) {
    console.error('Stripe checkout failed', error instanceof Error ? error.message : error);
    return fail(502, 'The payment page didn’t open. Please try again in a minute.');
  }
  return json({ ok: true, url: session.url });
}

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Stripe's signature check: HMAC-SHA256 of "t.body", within five minutes. */
export async function verifyStripe(body, header, secret, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = header.split(',').map((kv) => kv.trim().split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > 300 || !signatures.length) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expected = toHex(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${body}`)),
  );
  return signatures.some((sig) => safeEqual(sig, expected));
}

/** POST /api/stripe/webhook, or null for any other path. */
export async function handleStripeWebhook(request, env, now = Date.now()) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/stripe/webhook') return null;
  if (request.method !== 'POST') return notFound();
  const body = await request.text();
  if (body.length > 256 * 1024) return fail(413, 'Too large.');
  const ok = await verifyStripe(
    body,
    request.headers.get('Stripe-Signature'),
    env.STRIPE_WEBHOOK_SECRET,
    now,
  );
  if (!ok) return fail(400, 'Bad signature.');

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return fail(400, 'Bad JSON.');
  }
  const session = event?.data?.object ?? {};
  if (event.type !== 'checkout.session.completed' || session.payment_status !== 'paid') {
    return json({ received: true });
  }
  const projectId = session.metadata?.project_id ?? session.client_reference_id;
  const amount = Number(session.amount_total) || 0;
  const { meta } = await env.DB.prepare(
    'UPDATE projects SET paid_pence = ?, paid_at = ?, payment_ref = ? WHERE id = ? AND paid_at IS NULL',
  )
    .bind(amount, now, line(session.id, 100), String(projectId ?? ''))
    .run();
  if (meta.changes) {
    const liveUrl = await publish(env, String(projectId), now);
    const p = await env.DB.prepare(
      'SELECT projects.name, users.name AS client, users.email, users.id AS user_id FROM projects JOIN users ON users.id = projects.user_id WHERE projects.id = ?',
    )
      .bind(projectId)
      .first();
    await tellStudio(
      env,
      `[Paid] ${p?.name ?? 'A project'}: ${pounds(amount)}`,
      [
        `${p?.client ?? 'A client'} (${p?.email ?? 'unknown'}) has paid ${pounds(amount)} by card for ${p?.name ?? projectId}.`,
        '',
        liveUrl
          ? `It's an instant portfolio, so it published itself: ${liveUrl}`
          : 'Next: connect their domain, then press "Mark live" on their page.',
        `${url.origin}/admin/client/?id=${p?.user_id ?? ''}`,
        '',
        `Stripe reference: ${session.id}`,
      ].join('\n'),
    );
  }
  return json({ received: true });
}
