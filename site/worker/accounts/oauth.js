/**
 * Sign in with Google or Microsoft (OpenID Connect, authorisation code flow with PKCE), no extra
 * libraries. Switched on per provider by its Worker settings: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET,
 * MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET (docs/10-launch.md, "Sign in with Google and
 * Microsoft"). Without them the buttons don't show and these routes answer 404.
 *
 *   GET /api/auth/providers                 which buttons to show
 *   GET /api/auth/oauth/<provider>/start    → the provider's sign-in page (?popup=1, ?next=/path)
 *   GET /api/auth/oauth/<provider>/callback ← back from it: session started, then /auth/done/
 *
 * Safety:
 * - state, nonce and the PKCE verifier live in a short-lived __Host- cookie (HttpOnly, 10 minutes);
 *   the callback must match all three.
 * - The ID token comes straight from the provider's token endpoint over TLS, with our client
 *   secret, so (as OpenID Connect allows) its issuer, audience, expiry and nonce are checked rather
 *   than its signature.
 * - Accounts are matched by the provider's own id. An email is only trusted when the provider
 *   vouches for it (Google: email_verified; Microsoft: personal accounts, or xms_edov). An
 *   unvouched email gets our 6-digit code first, like a normal sign-up.
 * - Linking to an existing account whose email was never confirmed drops its password, so a
 *   stranger who signed up with someone else's email can't keep a way in.
 */
import { json, notFound, startSession, clientIp, allowed, line } from './http.js';
import { newToken, safeEqual, toB64url, fromB64url } from './crypto.js';
import { normaliseEmail, EMAIL, issueCode, sendCode } from './auth.js';

const MS_CONSUMER_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';
export const PROVIDERS = {
  google: {
    label: 'Google',
    id: 'GOOGLE_CLIENT_ID',
    secret: 'GOOGLE_CLIENT_SECRET',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    issuer: (iss) => iss === 'https://accounts.google.com' || iss === 'accounts.google.com',
    verified: (c) => c.email_verified === true || c.email_verified === 'true',
  },
  microsoft: {
    label: 'Microsoft',
    id: 'MICROSOFT_CLIENT_ID',
    secret: 'MICROSOFT_CLIENT_SECRET',
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    issuer: (iss, c) =>
      /^[0-9a-f-]{36}$/.test(c.tid ?? '') &&
      iss === `https://login.microsoftonline.com/${c.tid}/v2.0`,
    verified: (c) => c.tid === MS_CONSUMER_TENANT || c.xms_edov === true || c.xms_edov === 1,
  },
};

const STATE_COOKIE = '__Host-hm_oauth';
const STATE_MS = 10 * 60 * 1000;
const enabled = (env, name) =>
  Boolean(PROVIDERS[name] && env[PROVIDERS[name].id] && env[PROVIDERS[name].secret]);

/** Only paths on this site: never another host, never //host. */
const safeNext = (value) => {
  const next = String(value ?? '');
  return /^\/(?!\/)[\w\-./?=&%#~+]*$/.test(next) && next.length <= 300 ? next : '/account/';
};

const redirect = (location, cookies = []) => {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
};

/** Where the sign-in finishes: /auth/done/ tells the page that opened it, or carries on to next. */
const done = (origin, state, params, cookies = []) => {
  const query = new URLSearchParams({ ...params, ...(state?.popup ? { popup: '1' } : {}) });
  if (!state?.popup) query.set('next', state?.next ?? '/account/');
  return redirect(`${origin}/auth/done/?${query}`, [
    `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    ...cookies,
  ]);
};

/** GET /api/auth/providers */
export function providers(env) {
  return json({ ok: true, providers: Object.keys(PROVIDERS).filter((p) => enabled(env, p)) });
}

/** GET /api/auth/oauth/<provider>/start */
export async function start(request, url, env, name) {
  if (!enabled(env, name)) return notFound();
  if (!(await allowed(env.LOGIN_PER_IP, clientIp(request)))) {
    return done(url.origin, { popup: url.searchParams.get('popup') === '1' }, { error: 'busy' });
  }
  const provider = PROVIDERS[name];
  const state = {
    p: name,
    state: newToken(),
    nonce: newToken(),
    verifier: newToken(),
    next: safeNext(url.searchParams.get('next')),
    popup: url.searchParams.get('popup') === '1',
    exp: Date.now() + STATE_MS,
  };
  const challenge = toB64url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(state.verifier))),
  );
  const target = new URL(provider.authorize);
  target.search = new URLSearchParams({
    client_id: env[provider.id],
    redirect_uri: `${url.origin}/api/auth/oauth/${name}/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state: state.state,
    nonce: state.nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  const cookie = `${STATE_COOKIE}=${toB64url(new TextEncoder().encode(JSON.stringify(state)))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_MS / 1000}`;
  return redirect(target.toString(), [cookie]);
}

function readState(request) {
  for (const part of (request.headers.get('Cookie') ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key !== STATE_COOKIE) continue;
    try {
      return JSON.parse(new TextDecoder().decode(fromB64url(rest.join('='))));
    } catch {
      return null;
    }
  }
  return null;
}

function claimsOf(idToken) {
  try {
    return JSON.parse(new TextDecoder().decode(fromB64url(String(idToken).split('.')[1])));
  } catch {
    return null;
  }
}

/** GET /api/auth/oauth/<provider>/callback */
export async function callback(request, url, env, name, now = Date.now()) {
  if (!enabled(env, name)) return notFound();
  const provider = PROVIDERS[name];
  const state = readState(request);
  const valid =
    state &&
    state.p === name &&
    typeof state.state === 'string' &&
    state.exp > now &&
    safeEqual(state.state, url.searchParams.get('state') ?? '');
  if (!valid) return done(url.origin, state, { error: 'expired' });
  if (url.searchParams.get('error') || !url.searchParams.get('code')) {
    return done(url.origin, state, { error: 'cancelled' });
  }

  // The code for an ID token, straight from the provider.
  const fetcher = env.OAUTH_FETCH ?? fetch;
  let claims = null;
  try {
    const res = await fetcher(provider.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: url.searchParams.get('code'),
        redirect_uri: `${url.origin}/api/auth/oauth/${name}/callback`,
        client_id: env[provider.id],
        client_secret: env[provider.secret],
        code_verifier: state.verifier,
      }).toString(),
    });
    if (res.ok) claims = claimsOf((await res.json()).id_token);
  } catch {
    claims = null;
  }
  const ok =
    claims &&
    typeof claims.sub === 'string' &&
    claims.sub &&
    provider.issuer(claims.iss, claims) &&
    (claims.aud === env[provider.id] ||
      (Array.isArray(claims.aud) && claims.aud.includes(env[provider.id]))) &&
    Number(claims.exp) * 1000 > now &&
    typeof claims.nonce === 'string' &&
    safeEqual(claims.nonce, state.nonce);
  if (!ok) return done(url.origin, state, { error: 'failed' });

  const subject = `${name === 'microsoft' ? `${claims.tid}:` : ''}${claims.sub}`.slice(0, 200);
  const email = normaliseEmail(
    claims.email ?? (EMAIL.test(claims.preferred_username ?? '') ? claims.preferred_username : ''),
  );
  const vouched = EMAIL.test(email) && provider.verified(claims);
  const name_ =
    line(claims.name, 100) ||
    line([claims.given_name, claims.family_name].filter(Boolean).join(' '), 100) ||
    email.split('@')[0] ||
    'Your name';

  const signIn = async (userId) => {
    const cookie = await startSession(env, userId, now);
    return done(url.origin, state, { ok: '1' }, [cookie]);
  };

  // Seen before: the provider's id decides, whatever the email says now.
  const known = await env.DB.prepare(
    'SELECT user_id FROM oauth_identities WHERE provider = ? AND subject = ?',
  )
    .bind(name, subject)
    .first('user_id');
  if (known) {
    const user = await env.DB.prepare('SELECT id, email_verified_at FROM users WHERE id = ?')
      .bind(known)
      .first();
    if (user?.email_verified_at) return signIn(user.id);
    if (user) return askForCode(env, url, state, user.id, email, now);
  }
  if (!EMAIL.test(email)) return done(url.origin, state, { error: 'noemail' });

  const existing = await env.DB.prepare('SELECT id, email_verified_at FROM users WHERE email = ?')
    .bind(email)
    .first();
  if (existing && !vouched) {
    // Their provider can't vouch for this email, and an account already has it.
    return done(url.origin, state, { error: 'exists' });
  }
  const link = (userId) =>
    env.DB.prepare(
      'INSERT OR IGNORE INTO oauth_identities (provider, subject, user_id, email, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(name, subject, userId, email, now);

  if (existing) {
    // The provider vouches for the email. A never-confirmed password can't be trusted: drop it.
    await env.DB.batch([
      link(existing.id),
      existing.email_verified_at
        ? env.DB.prepare('SELECT 1')
        : env.DB.prepare(
            'UPDATE users SET email_verified_at = ?, password_hash = NULL, salt = NULL WHERE id = ?',
          ).bind(now, existing.id),
    ]);
    return signIn(existing.id);
  }

  const userId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO users (id, email, name, role, created_at, email_verified_at) VALUES (?, ?, ?, 'client', ?, ?)",
    ).bind(userId, email, name_, now, vouched ? now : null),
    link(userId),
  ]);
  return vouched ? signIn(userId) : askForCode(env, url, state, userId, email, now);
}

/** An email the provider can't vouch for: our own 6-digit code first. */
async function askForCode(env, url, state, userId, email, now) {
  const code = await issueCode(env, userId, now);
  await sendCode(env, email, code);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  return done(url.origin, state, {
    verify: email,
    ...(env.DEV_SHOW_CODES === 'yes' && local ? { devCode: code } : {}),
  });
}
