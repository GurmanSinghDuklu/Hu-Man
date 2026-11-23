/**
 * Password hashing and tokens for client accounts, on Web Crypto only (no libraries).
 *
 * Passwords: PBKDF2-SHA256 with a 16-byte random salt per user. 100,000 iterations is the most
 * Cloudflare Workers allow (larger counts throw), so it is the count used.
 * Tokens (setup links, sessions): 32 random bytes, base64url. Only their SHA-256 hex is stored.
 */
const ITERATIONS = 100_000;
const enc = new TextEncoder();

const toB64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromB64url = (text) =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Compares two strings in time that depends only on their length. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function derive(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    key,
    256,
  );
  return toB64url(new Uint8Array(bits));
}

/** A new hash and salt for a password (both base64url strings, stored on the user). */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: await derive(password, salt), salt: toB64url(salt) };
}

export async function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  return safeEqual(await derive(password, fromB64url(salt)), hash);
}

/** A random token: 32 bytes, base64url (43 characters). */
export const newToken = () => toB64url(crypto.getRandomValues(new Uint8Array(32)));

export const sha256Hex = async (text) => hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));

/** Runs the hash anyway when there is no user, so a wrong email takes as long as a wrong password. */
export const DUMMY = { hash: 'x'.repeat(43), salt: 'AAAAAAAAAAAAAAAAAAAAAA' };
