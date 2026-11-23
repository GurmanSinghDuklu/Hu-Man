# Preview and payment (parts 3 and 4 of client accounts)

Date: 2026-11-23. Branch: `client-accounts`. Approved in conversation (Mandeep, 2026-11-23).
Builds on `2026-11-23-client-accounts-design.md`.

## Goal
A client sees the site we build for them, live and clickable, inside their account, but only gets it
(domain, hosting, files) after paying. Nobody else can see it.

## Decisions
- **Live preview, locked down** (not screenshots). Honest limit: a technical person can save pages;
  they get a watermarked, unhosted copy with no handover.
- **Gurman uploads builds with a laptop command** (`npm run preview-upload`), not a zip in /admin/.
- **Only the final payment is taken on the site** (Stripe Checkout). The deposit stays off-site and
  is marked paid by hand in /admin/. The final payment can also be marked paid by hand (bank
  transfer).
- **No Stripe account yet**: built and tested in Stripe test mode; card payments switch on when the
  secret key and webhook secret are added as Worker secrets. Without them the button says payment
  details will be sent instead.
- Publishing to the client's domain stays manual; "Mark live" is only possible once paid.

## Journey
1. Admin enters the fixed quote and marks the deposit paid (amount) on the client's page.
2. Gurman builds the site with base path `/preview/<projectId>/` (shown on the client's admin page
   and printed by the command), then runs `npm run preview-upload -- <client email> <folder>`.
3. The client's account shows "Your preview is ready", an "Open your preview" link (new tab), and
   "£X left to pay · Pay and go live" (quote minus deposit, from what the admin entered; no prices
   are invented).
4. Pay opens Stripe Checkout (GBP, the amount due, their email). Only Stripe's signed webhook marks it
   paid; the success page just says the payment is being confirmed. The studio gets a "[Paid]" email.
5. Admin connects the domain and presses "Mark live" with the address; the account shows it.

Stage shown everywhere, derived from the project's fields: brief → building (deposit paid) →
preview (a version uploaded) → paid → live.

## Preview serving
- `/preview/<projectId>/…` (in `run_worker_first`) is served by the Worker from R2 key
  `preview/<projectId>/<version>/<path>`, only to the project's client and admins; anyone else gets
  the site's 404 page, as for /admin/. `…/` serves `index.html`; an extensionless path tries
  `<path>/index.html` (redirect to the slash form).
- Every HTML page: `<meta name="robots" content="noindex,nofollow">` added, any meta CSP removed (so
  the bar can render), and a fixed bottom bar injected: "Preview for <name> · not live yet" (after
  payment: "Paid · going live soon") with a link back to the account. Names are HTML-escaped.
- Headers on every preview file: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`,
  `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: frame-ancestors 'self'`, `nosniff`,
  `Vary: Cookie`. Content type from the file extension (a fixed list; unknown → octet-stream).

## Upload
- Worker routes under `/api/upload/preview/…`, authorised by `Authorization: Bearer <token>` matching
  the Worker secret `PREVIEW_UPLOAD_TOKEN` (constant-time). No secret set → 404. Not cookie-based, so
  no Origin check.
  - `POST /start` `{ email, projectId? }` → `{ projectId, version, basePath }` (the client's only
    project, or the one named; several and none named → 409 listing them).
  - `PUT /<projectId>/<version>/<path>` file bytes (≤ 25 MB; path: no `..`, no leading `/`,
    ≤ 300 characters).
  - `POST /finish` `{ projectId, version, count }` → switches the project to the new version, then
    deletes every older version's objects.
- `scripts/preview-upload.mjs <email> <folder> [--project <id>] [--local]`: token from
  `PREVIEW_UPLOAD_TOKEN` or `~/.hu-man/preview-token`; uploads 6 at a time; warns about root-absolute
  `href`/`src` in HTML that don't start with the base path; prints the preview address.

## Payment
- Admin: `POST /api/admin/projects/<id>/money` `{ quote, deposit }` (pounds, whole pence stored),
  `POST …/deposit-paid`, `POST …/paid` (by hand, amount), `POST …/live` `{ url }` (409 unless paid).
- Client: `POST /api/account/pay?p=` → 409 unless a preview exists, it isn't paid and something is
  due; 503 without `STRIPE_SECRET_KEY`; otherwise creates a Checkout Session through Stripe's REST
  API (`fetch`, form-encoded, no SDK) with `client_reference_id` and `metadata[project_id]`, and
  returns its URL.
- `POST /api/stripe/webhook`: verifies `Stripe-Signature` (HMAC-SHA256 over `t.body` with
  `STRIPE_WEBHOOK_SECRET`, 5-minute tolerance, constant time). On `checkout.session.completed` with
  `payment_status: paid` it records the amount, time and session id once (repeats ignored) and emails
  the studio. Bad signature → 400.

## Data
Migration `0003_preview_payment.sql` adds to `projects`: `quote_pence`, `deposit_pence`,
`deposit_paid_at`, `preview_version`, `preview_at`, `paid_pence`, `paid_at`, `payment_ref`,
`live_url`, `live_at`.

## Legal (drafts)
Terms: a preview is for review only; the site and files are the client's on final payment (as
already stated). Privacy: Stripe processes card payments as its own controller; we see the amount
and status, never card details. Cookies: Stripe's payment page is on stripe.com with its own cookies.

## Testing
Node tests: preview access (owner, admin, other client, stranger), bar and meta injection, content
types, upload token and path rules, version switch and old-version clean-up, money rules, Checkout
creation (fake fetch), webhook signature (good, forged, stale, repeated). Then a local run with the
upload command and Stripe test mode where possible, screenshots, axe on the account page.
