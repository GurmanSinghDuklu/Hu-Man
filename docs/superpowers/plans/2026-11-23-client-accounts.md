# Client accounts and the brief: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Invited clients log in, fill in a project brief with uploads and send it; admins invite
clients and read briefs (parts 1 and 2 of `docs/superpowers/specs/2026-11-23-client-accounts-design.md`).

**Architecture:** Static Astro page shells (`/login/`, `/account/…`, `/admin/…`, noindex, out of the
sitemap) call a JSON API in the existing Cloudflare Worker (`site/worker/accounts/`). D1 holds users,
invites, sessions, projects, briefs and file records; R2 holds uploads. One HttpOnly session cookie.

**Tech stack:** Astro 7 + TypeScript, Cloudflare Workers, D1, R2, Web Crypto. No new npm
dependencies. Tests: Node's test runner with `node:sqlite` standing in for D1 (running the real
migration) and a Map for R2. `wrangler` runs through `npx` as the deploy script already does.

Execution note (2026-11-23): Gurman said "build", so this runs inline in the same session. Each task
below lists files, interfaces and the exact test cases; the code itself is in that task's commit.

---

## File map

| File | Responsibility |
|---|---|
| `site/migrations/0001_accounts.sql` | D1 schema (users, invites, sessions, projects, briefs, files) |
| `site/worker/accounts/crypto.js` | `hashPassword`, `verifyPassword`, `newToken`, `sha256Hex`, `safeEqual` |
| `site/worker/accounts/http.js` | `json()`, `readJson()`, `sameOrigin()`, cookie read/write, `getSession()`, `requireUser()`, `requireAdmin()`, security headers for API replies |
| `site/worker/accounts/auth.js` | setup check, setup, login (lockout), logout, `createInvite()` |
| `site/worker/accounts/admin.js` | list/create clients, client detail, new setup link, reopen brief |
| `site/worker/accounts/briefs.js` | read/save draft, send (validation from `src/data/brief.ts`, studio email) |
| `site/worker/accounts/files.js` | upload (magic bytes, limits), download (ownership), delete |
| `site/worker/accounts/index.js` | `handleAccounts(request, env, deps)`: routes `/api/auth/*`, `/api/account/*`, `/api/admin/*` |
| `site/worker/accounts/test-env.js` | test helpers: D1 fake on `node:sqlite`, R2 fake, request builders |
| `site/worker/accounts/*.test.js` | tests per module |
| `site/worker/index.js` | send `/api/auth|account|admin/*` to `handleAccounts` |
| `site/wrangler.toml` | `DB` (D1), `FILES` (R2), `LOGIN_PER_IP`, `UPLOAD_PER_USER` rate limits |
| `site/scripts/make-admin.mjs` | prints SQL-backed setup link for an admin (local or `--remote`) |
| `site/src/data/brief.ts` | the brief's steps and fields (shared by page and Worker; erasable TS only, so Node and wrangler import it directly) |
| `site/src/data/pages.ts` | page entries `login`, `account`, `account-setup`, `account-brief`, `admin`, `admin-client` (noindex) |
| `site/src/components/account/AccountShell.astro` | shared frame for account pages (no-JS note, status line, log-out) |
| `site/src/components/account/BriefForm.astro` | renders the steps from `brief.ts` |
| `site/src/pages/login.astro`, `account/index.astro`, `account/setup.astro`, `account/brief.astro`, `admin/index.astro`, `admin/client.astro` | page shells |
| `site/src/scripts/account/*.ts` | `api.ts` (fetch helper), `login.ts`, `setup.ts`, `account.ts`, `brief.ts`, `admin.ts`, `admin-client.ts` |
| `site/astro.config.mjs` | sitemap filter excludes the new paths |
| `site/scripts/seo-check.mjs`, `scripts/axe.mjs` | know the new noindex pages; public pages and `/api/enquiry` set no cookie |
| `site/src/components/SiteFooter.astro` | "Client login" link |
| `site/src/pages/cookies.astro`, `privacy.astro`, `CookieButton.astro` | one strictly necessary cookie, client account section |
| `docs/10-launch.md`, `CLAUDE.md` | setup steps, the new rules |

## Tasks

### Task 1: schema and test harness
- [ ] `migrations/0001_accounts.sql` per the spec's Data section (all ids TEXT, timestamps INTEGER ms,
      `users.email` UNIQUE, foreign keys ON DELETE CASCADE, indexes on `sessions.user_id`,
      `projects.user_id`, `files.project_id`).
- [ ] `test-env.js`: `makeEnv()` returns `{ DB, FILES, SEND_EMAIL, sent, FROM_ADDRESS, TO_ADDRESS }`;
      `DB` wraps `DatabaseSync(':memory:')` with `prepare(sql).bind(...).first()/all()/run()` and
      `batch(stmts)`, after running every file in `migrations/`. `req(method, path, {body, cookie, origin})`.
- [ ] Test: migration applies; inserting a duplicate email throws.
- [ ] Commit.

### Task 2: crypto
- [ ] Tests first: hash then verify true; wrong password false; two hashes of one password differ
      (salt); `newToken()` is 43 base64url chars and unique; `sha256Hex('a')` known vector.
- [ ] Implement with Web Crypto (PBKDF2-SHA256, 210000 iterations, 16-byte salt, 32-byte key).
- [ ] Commit.

### Task 3: http helpers and sessions
- [ ] Tests: `sameOrigin` accepts matching Origin, rejects missing or foreign on non-GET; cookie set
      string has `__Host-hm_session`, HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=2592000;
      `getSession` finds a valid session by token hash, ignores expired.
- [ ] Commit.

### Task 4: auth routes
- [ ] Tests: `GET /api/auth/setup?t=` valid gives email, used/expired/unknown gives 404;
      `POST /api/auth/setup` sets password (min 10), marks invite used, returns Set-Cookie; reuse 404;
      login right gives cookie, wrong gives 401 "Wrong email or password" (same for unknown email);
      5 wrong locks for 15 min (right password then 401 too); logout deletes the session and clears
      the cookie; every POST without our Origin is 403.
- [ ] Commit.

### Task 5: admin routes
- [ ] Tests: client session calling any `/api/admin/*` gets 404; admin creates a client (name,
      email, type business|portfolio|custom, optional tier, concept) and gets `setupUrl` once;
      duplicate email 409; list shows brief status; new setup link ends old invites and sessions;
      reopen sets a sent brief back to draft.
- [ ] Commit.

### Task 6: brief definition and brief routes
- [ ] `src/data/brief.ts`: `briefSteps` (id, title, intro, fields), field kinds `text`, `textarea`,
      `choice` (single), `checks` (multi), `files`, `repeat` (cards of sub-fields), `consent`;
      `types?: ProjectType[]`; `required?`; `max?`. Helpers `fieldsFor(type)`, `validateBrief(type,
      answers, {sending})` returning `{ answers, errors }` (drops unknown keys, trims, caps lengths).
- [ ] Tests: unknown keys dropped; over-long text capped/errored; send without consent or a required
      field gives errors; another client's project is 404; PUT after send is 409; send emails the
      studio once with "[Client brief]" subject and the admin link.
- [ ] Commit.

### Task 7: files
- [ ] Tests: PNG/JPG/WebP/PDF/SVG accepted by magic bytes; a `.png` name with PDF bytes stored as
      PDF; text file refused 415; over 10 MB 413; 21st file 409; another client's file 404; SVG and
      PDF download as attachment with nosniff; delete refused after send.
- [ ] Commit.

### Task 8: router, Worker wiring, wrangler, make-admin
- [ ] `handleAccounts` routing; API replies get `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- [ ] `worker/index.js` routes the three prefixes; `wrangler.toml` bindings with placeholder
      `database_id` comment explaining `wrangler d1 create`.
- [ ] `scripts/make-admin.mjs <email> <name> [--remote]`: inserts an admin user with no password and
      an invite via `npx wrangler d1 execute`, prints `/account/setup/?t=…`.
- [ ] `npm test` includes the new test files. Commit.

### Task 9: pages
- [ ] Page entries in `pages.ts` (noindex), AccountShell, BriefForm and the six pages plus scripts.
      Brief autosaves (debounced 1.5 s, and on step change) via PUT; uploads per file with progress.
- [ ] Sitemap filter, seo-check `NOINDEX_FILES`, axe page list.
- [ ] Build, seo-check, axe 0, Commit.

### Task 10: site-wide promises
- [ ] Footer "Client login"; cookies page, cookie panel and privacy section; seo-check fails if a
      public page or `/api/enquiry` sets a cookie (checked on the Worker in tests); CLAUDE.md and
      `docs/10-launch.md` "Client accounts". Commit.

### Task 11: end-to-end
- [ ] `npx wrangler d1 migrations apply hm_accounts --local`, `npx wrangler dev`, then a Playwright
      script: make-admin → admin sets password → creates client → client sets password, fills brief,
      uploads logo, sends → admin sees it and downloads the logo. Screenshots at 360/768/1280,
      keyboard walk, axe on the pages. Fix, commit.
