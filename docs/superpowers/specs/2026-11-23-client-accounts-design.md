# Client accounts and the project brief (design)

Date: 2026-11-23. Branch: `client-accounts`. Status: approved in conversation, awaiting Gurman's review
of this write-up before the implementation plan.

## Why

Clients should be able to see the product we make for them, but it is only published once they have
paid, so nobody can take the work without paying. That needs a private client area. This spec covers
the first two parts of it; the rest gets its own spec later.

| Part | What | This spec |
|---|---|---|
| 1 | Accounts and login | Yes |
| 2 | Project brief form (what the client wants, what we need) | Yes |
| 3 | Client dashboard shows a watermarked, noindex preview of their site, hosted by us; they never get the files | Later |
| 4 | Payment through Stripe, then we publish to their domain (matches the terms: 50% deposit, 50% before launch) | Later |

Parts 3 and 4 build on the tables and pages here: `projects.status` and the "preview" box on
`/account/` are where they plug in.

## Decisions (Gurman, 2026-11-23)

- **Invited clients only.** No public sign-up. After the free call an admin creates the client and
  copies a one-time setup link into a Gmail reply. The site never emails clients in this phase (it
  can't: the `SEND_EMAIL` binding only reaches the studio's own inbox).
- **Email and password** login. Forgotten password: an admin issues a new setup link.
- **Admin pages on the site** (`/admin/`) for Gurman and Mandeep.
- **Uploads in the brief** (Cloudflare R2).
- **Approach A:** static Astro page shells plus a JSON API in the existing Worker; D1 and R2; no new
  npm dependencies (Web Crypto for hashing and tokens). The marketing pages do not change.

## Pages

All new pages are static Astro pages using `BaseLayout`, flagged `noindex: true` in
`src/data/pages.ts`, left out of the sitemap, llms.txt, llms-full.txt and the Markdown copies, and
served by the Worker with `Cache-Control: no-store`. Each loads one small script that calls the API;
without JavaScript they show a short "This area needs JavaScript" note. Public navigation does not
link to them; the footer gets a "Client login" link next to the Legal column.

| Path | Who | What |
|---|---|---|
| `/login/` | anyone | Email, password, "Log in". Errors say "Wrong email or password" only. Link: "Forgotten your password? Ask us for a new setup link." (mailto the business email). |
| `/account/setup/?t=<token>` | invited client | Shows their email, confirms their name, sets a password (10+ characters, typed twice). Single use, expires after 7 days; an expired or used link says so and offers the mailto. On success: logged in, sent to `/account/`. |
| `/account/` | client | Their project(s): type, tier and concept if set, brief status (Brief not started / Brief in progress / Brief sent), a button to the brief, and a box "Your preview will appear here once we've built it" (part 3). Log out. |
| `/account/brief/?p=<projectId>` | client | The brief (below). Read-only once sent unless an admin reopens it. |
| `/admin/` | admin | Clients and projects in a list with brief status. "New client" form: name, email, project type, tier (optional, from `pricing.ts` names), concept (optional, from `portfolioConcepts`). On create it shows the setup link with a Copy button. |
| `/admin/client/?id=<userId>` | admin | Client details, "New setup link" (invalidates older ones and ends their sessions), each project's brief rendered as a readable page, file list with downloads, "Reopen brief". |

## The brief

One form in steps with a progress bar. It saves to the server as the client goes (debounced, and on
every step change), never to browser storage. "Save and come back later" just returns to `/account/`.
Steps depend on project type (`business`, `portfolio`, `custom`). Fields are optional unless marked ★.

1. **About you**
   - business: business name ★, what you do in one line ★, where you work, who your customers are
   - portfolio: name as it should appear ★, job title ★, roles you're aiming for, CV (PDF upload)
   - custom: the problem it solves ★, who will use it ★
2. **What you want:** goals as tick boxes (business: enquiries, bookings, sell online, be found on
   Google and AI tools; portfolio: show my work, apply for jobs; custom: free text), pages wanted
   (checklist plus other), features wanted. Features outside the project's tier show "We'll talk
   about this on a call". The form shows no prices; only the tier name the project already has.
3. **Look and feel:** chosen concept (prefilled from the project), up to 3 sites you like plus what
   you like about each, brand colours, three words for the feel.
4. **Your content (what we need):** logo, photos and brand files (uploads); text: "I'll write it" or
   "Help me write it"; business: services and prices, opening hours, contact details to show;
   portfolio: projects as repeatable cards (title, what you did, link, files) and skills; social
   links; reviews or testimonials, labelled "Only real ones you have permission to use".
5. **Technical:** current website, own a domain? (yes/no/not sure, and who it's with), Google
   Business Profile? (business only). The form never asks for passwords or logins; it says "We'll
   ask for access safely on a call."
6. **Timing and anything else:** date you'd like it by and why, free text.
7. **Check and send:** a summary of every answer, a required tick box: "Everything I've given is
   mine or I have permission to use it, and it's accurate." (terms section 4), then "Send brief".

Sending sets the brief to `sent`, locks it, and emails the studio inbox through the existing
`SEND_EMAIL` binding: subject "[Client brief] <project name> from <client name>", body a plain-text
summary and a link to `/admin/client/?id=…`. The email holds no uploaded files.

The questions live in `src/data/brief.ts` (steps, fields, types, which project types see them,
required flags, max lengths). The page renders from it and the Worker validates against the same
definitions (built to `worker/brief-schema.json` by a small integration, the way `worker/pages.json`
is), so a question changes in one place.

## API (Worker)

All JSON. Every non-GET request must carry an `Origin` header equal to the site's origin (CSRF);
otherwise 403. Every route under `/api/account/` needs a valid session; every route under
`/api/admin/` needs a session whose user has `role = 'admin'`, checked on the server. Unknown or
unauthorised resources return 404 (never 403), so IDs can't be probed.

| Route | Does |
|---|---|
| `POST /api/auth/setup` | token, name, password: sets the password, uses up the invite, starts a session |
| `GET /api/auth/setup?t=` | whether a token is valid, and the invited email (for the setup page) |
| `POST /api/auth/login` | email, password: starts a session |
| `POST /api/auth/logout` | deletes the session, clears the cookie |
| `GET /api/account/me` | the user and their projects with brief status |
| `GET/PUT /api/account/brief?p=` | read or save draft answers (PUT refused once sent) |
| `POST /api/account/brief/send?p=` | validate required fields and the consent box, send |
| `POST /api/account/files?p=` | upload one file (multipart) |
| `GET /api/account/files/<fileId>` | download (owner or admin) |
| `DELETE /api/account/files/<fileId>` | delete (owner, brief not sent) |
| `GET /api/admin/clients` | list |
| `POST /api/admin/clients` | create user + project + invite; returns the setup link once |
| `GET /api/admin/clients/<id>` | detail with projects, briefs, files |
| `POST /api/admin/clients/<id>/invite` | new setup link; old invites and sessions ended |
| `POST /api/admin/projects/<id>/reopen` | brief back to draft |

Code lives in `site/worker/accounts/` (auth, sessions, briefs, files, admin, http helpers), each
module free of Cloudflare-only imports so it runs in Node tests, as `enquiry.js` does.

## Data

D1 database `hm_accounts` (binding `DB`), migrations in `site/migrations/`, applied with
`wrangler d1 migrations apply`.

- `users`: id, email (unique, lowercased), name, role (`client`|`admin`), password_hash, salt,
  failed_logins, locked_until, created_at
- `invites`: token_hash, user_id, expires_at, used_at
- `sessions`: token_hash, user_id, expires_at, created_at
- `projects`: id, user_id, type, tier, concept, status (`brief`, later `building`, `preview`,
  `paid`, `live`), created_at
- `briefs`: project_id, answers (JSON), state (`draft`|`sent`), consent_at, updated_at, sent_at
- `files`: id, project_id, field, r2_key, name, type, size, created_at

R2 bucket `hm-client-files` (binding `FILES`), keys `project/<projectId>/<random>`. Private: no
public bucket URL; every download goes through the Worker's ownership check.

IDs are random (`crypto.randomUUID()`), never sequential.

## Security

- Passwords: PBKDF2-SHA256, 100,000 iterations (the most Cloudflare Workers allow), 16-byte random salt per user (Web Crypto). Compared
  in constant time.
- Setup links and session tokens: 32 random bytes, base64url. Only SHA-256 hashes are stored.
- Cookie `__Host-hm_session`: HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age 30 days. Only
  `/api/auth/*` sets or clears it; public pages never set a cookie.
- Login: per-IP rate limit (5 a minute, Cloudflare rate-limit binding like the enquiry form) and a
  per-account lock (5 wrong in a row locks for 15 minutes). Same message and similar timing for an
  unknown email and a wrong password.
- Uploads: JPG, PNG, WebP, SVG, PDF only, checked by magic bytes, not the name or browser type;
  10 MB each; 20 per project; 10 uploads a minute per user. Served with `Content-Disposition:
  attachment` for SVG and PDF, `X-Content-Type-Options: nosniff`, and the stored type, never the
  requested one.
- Admin accounts: no admin UI creates admins. `npm run make-admin -- <email> <name>` prints a setup
  link for the first two (Gurman, Mandeep), running against local or remote D1.
- Account pages and API responses: `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- Nothing sensitive in URLs except the one-time setup token, which is used up on first use.

## Legal and site-wide promises (drafts, same solicitor review)

- `/cookies/`: "This website sets one cookie, and only if you have a client account: it keeps you
  logged in. It is strictly necessary, so it needs no consent. Public pages set no cookies." The
  cookie button's panel says the same. Updated before the feature goes live.
- `/privacy/`: new section "If you have a client account": what is stored (name, email, password
  hash, brief, uploaded files), why (to deliver the contract), where (Cloudflare D1 and R2; EU
  location hint where available), how long (the existing 12-month client defaults after the project
  ends), deletion on request.
- CLAUDE.md "No browser storage": amended to "public pages store nothing; the client area sets one
  strictly necessary login cookie". `motion-check`'s no-storage check stays as it is for public
  pages; a new check fails if any public page or `/api/enquiry` sets a cookie.

## Testing

- Node tests (`npm test`). D1 is stood in for by `node:sqlite` (built into Node 24) running the real
  migrations behind a tiny D1-shaped wrapper; R2 by an in-memory map. Cases: setup and login and logout; expired and reused links; lockout;
  a client reading another client's brief or files (404); a client calling admin routes (404);
  missing or foreign `Origin` (403); upload type, size and count limits; brief send without consent
  or required fields (400); PUT after send (409).
- Playwright journey against `wrangler dev` (local D1 and R2, nothing deployed): admin creates a
  client, client sets a password, fills the brief, uploads a logo, sends; admin sees it and downloads
  the logo.
- axe, keyboard walk and 360/768/1280 screenshots on every new page; seo-check confirms the new pages
  are noindex and absent from the sitemap and llms files.

## Setup (nothing deployed without asking)

`docs/10-launch.md` gets a "Client accounts" section: `wrangler d1 create hm_accounts`, `wrangler r2
bucket create hm-client-files`, the bindings in `wrangler.toml`, `wrangler d1 migrations apply
hm_accounts --remote`, then `npm run make-admin` for Gurman and Mandeep. Locally, `wrangler dev`
uses its own local D1 and R2.

## Out of scope here

Public sign-up, emails sent to clients (setup links, resets, notifications), passkeys, previews
(part 3), Stripe and publishing (part 4), messaging between client and studio, multiple users per
client.
