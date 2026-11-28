/**
 * Sending the board. The visitor signs in through Cloudflare Access in a popup (a one-time code to
 * their email); the popup lands on /studio/signed-in/, which tells this page over a BroadcastChannel
 * and closes itself. COOP is same-origin, so window.opener is lost across the Access redirect and is
 * never used: the channel is the signal, and /studio/api/me is polled as a fallback. Once signed in
 * the brief and files post to /studio/api/brand-board. If the endpoints aren't there yet, or fail,
 * a calm fallback offers a .json download and the booking link: the board is never lost.
 */
import { brandStudioConfig as cfg } from '../../config/brandStudio';
import { withBase } from '../../config/paths';
import { gallery, studioFonts } from '../../data/brandStudio';
import { get, brandName } from './store';
import { ROLES } from './colour';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
let channel: BroadcastChannel | null = null;
let poll = 0;
let waiting = false;

type Panel = 'idle' | 'waiting' | 'sending' | 'success' | 'fallback' | 'blocked';

function panel(which: Panel) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-panel]'))
    el.hidden = el.dataset.panel !== which;
  $('#bs-send').toggleAttribute('disabled', which === 'waiting' || which === 'sending');
  const target = document.querySelector<HTMLElement>(`[data-panel="${which}"]`);
  if (which !== 'idle' && target) target.focus();
}

/** The brief as plain data: what we receive, and what the .json download holds. */
export function brief() {
  const s = get();
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    brand: { ...s.basics, name: brandName() },
    inspiration: {
      saved: s.saved.map((slug) => ({ slug, name: gallery.find((g) => g.slug === slug)?.name })),
      links: s.links,
      uploads: s.uploads.map((u) => ({
        id: u.id,
        name: u.file.name,
        type: u.file.type,
        size: u.file.size,
        note: u.note,
        colours: u.colours,
      })),
    },
    palette: {
      name: s.palette.name,
      colours: s.palette.colours.map((hex, i) => ({ hex, role: s.palette.roles[i] ?? ROLES[i] })),
    },
    logo: {
      directions: s.logo.directions.map((slug) => ({
        slug,
        name: gallery.find((g) => g.slug === slug)?.name,
      })),
      types: s.logo.types,
      existingLogo: s.logo.existing?.name ?? null,
      notes: s.logo.notes,
    },
    typeface: {
      display: studioFonts.find((f) => f.id === s.type.display)?.family,
      body: s.type.body === 'dm-sans' ? 'DM Sans' : 'Figtree',
    },
    contact: s.review,
  };
}

function download() {
  const blob = new Blob([JSON.stringify(brief(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${
    brandName()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') || 'brand'
  }-board.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function whoami(): Promise<boolean> {
  try {
    const r = await fetch(withBase(cfg.whoamiUrl), {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    return r.ok && (r.headers.get('content-type') ?? '').includes('json');
  } catch {
    return false;
  }
}

async function submit() {
  panel('sending');
  const form = new FormData();
  form.append('brief', JSON.stringify(brief()));
  const s = get();
  s.uploads.forEach((u, i) => form.append(`upload-${i + 1}`, u.file, u.file.name));
  if (s.logo.existing) form.append('logo', s.logo.existing, s.logo.existing.name);
  try {
    const r = await fetch(withBase(cfg.submitUrl), {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    if (!r.ok) throw new Error(String(r.status));
    s.touched.sent = true;
    document.dispatchEvent(new CustomEvent('bs-sent'));
    panel('success');
  } catch {
    panel('fallback');
  }
}

function stopWaiting() {
  waiting = false;
  clearInterval(poll);
}

function onSignedIn() {
  if (!waiting) return;
  stopWaiting();
  void submit();
}

export function startSignIn() {
  // Opened synchronously from the click, or the browser's pop-up blocker refuses it.
  const w = window.open(
    withBase(cfg.signedInPath),
    'hu-man-studio',
    'popup=yes,width=520,height=720',
  );
  if (!w) return panel('blocked');
  waiting = true;
  panel('waiting');
  if (!channel && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(cfg.channel);
    channel.onmessage = (e) => e.data?.type === 'signed-in' && onSignedIn();
  }
  clearInterval(poll);
  let ticks = 0;
  poll = window.setInterval(async () => {
    if (++ticks > 300) return stopWaiting(); // ten minutes
    if (waiting && (await whoami())) onSignedIn();
  }, 2000);
}

$('#bs-cancel-wait').addEventListener('click', () => {
  stopWaiting();
  panel('idle');
});
$('#bs-download').addEventListener('click', download);
$('#bs-retry').addEventListener('click', () => {
  panel('sending');
  void submit();
});
