# Self-serve CV portfolios (design)

Date: 2026-11-23. Branch: `client-accounts`. Approved in conversation (Mandeep: "begin building
everything, it all looks good"). Replaces the invite-led flow as the way CV portfolio clients start;
the admin, enquiries, preview and payment code built earlier today is reused. Nothing deploys
without asking.

## Journey
1. On /portfolio a visitor presses **Choose this concept** on a design → /contact/?concept=<name>.
2. /contact/ opens with the **portfolio form on the left half and the video on the right** (form
   first on phones). The concept is already chosen. Two routes:
   - **Custom made portfolio**: we design it with them (the request lands in /admin/).
   - **Choose design + upload CV**: the site builds their portfolio instantly from the chosen design
     and their details (phase C).
3. The form asks what a CV builder asks: first name, surname, email, phone, town/city (optional),
   links (LinkedIn, website, other; optional), job title, a short summary, work history (repeat:
   job title, employer, place, from, to or "current", what you did), education (repeat:
   qualification, where, year), skills, anything else, the CV upload (optional), and a required
   tick: "Everything I've given is mine or I have permission to use it, and it's accurate." No
   street address: we don't need it.
4. **Sign-in before sending**: pressing Send (or choosing a CV to read) while logged out opens a
   sign-in / create-account panel on the same page. The form's answers stay in the page (nothing in
   browser storage), and sending continues once they're in.
5. On send: the request is saved to their account (a project with route custom or instant, the
   answers and the CV in private R2), appears in /admin/ (Enquiries list and their client page), the
   studio gets an email, and **the person gets a "We've got your request" email**.
6. Instant route (phase C): their portfolio is generated at once and opens as a private preview in
   their account (the preview bar from earlier). They choose **Pay now and publish**, **Speak with
   us**, or **Pay later** (it stays saved as a draft). They can edit their details and rebuild it.
7. Paid (Stripe Checkout, price = the concept's tier from `src/data/pricing.ts`): it publishes at
   `<name>.humansoftwareagency.com` straight away. Their account then offers **Contact us to change
   it** and **Connect my own domain** (phase D, Cloudflare for SaaS custom hostnames).

## Phase A: accounts and the contact page
- **Public sign-up**: `POST /api/auth/signup {name, email, password}` creates an unverified client
  and emails a 6-digit code (15 minutes, 5 tries, stored hashed). `POST /api/auth/verify {email,
  code}` verifies and logs in. Signing up with an email that already has an account sends that
  address a "you already have an account" email instead and answers the same way (no account
  enumeration). Login with the right password but an unverified email sends a fresh code and asks
  for it. `POST /api/auth/forgot {email}` emails a one-time reset link (the existing setup-link
  mechanism, 1 hour) and always answers the same. Rate limits on all three.
- **Emails to people go through Resend** (`worker/accounts/send.js`, `fetch` to its API, secret
  `RESEND_API_KEY`, sender `RESEND_FROM`). Studio emails keep using Cloudflare's SEND_EMAIL. With no
  Resend key, user emails are skipped and logged; for local testing only, `DEV_SHOW_CODES=yes` in
  `.dev.vars` returns the code in the response when the request is to localhost.
- **The portfolio form** is data (`src/data/portfolioRequest.ts`: fields, repeats, limits,
  validation shared by page and Worker), saved with `POST /api/account/request` into a new project
  (`kind = 'request'`, `route`), its answers in `briefs` (state sent) and the CV in `files`.
  An enquiry row (via "Portfolio request", linked to the account) puts it in the Enquiries list.
- **/contact/ layout**: the top band becomes two halves: the form (left) and the hero video (right,
  portfolio ad). The general "Tell us more" form, direct details, What happens next and FAQ stay
  below, unchanged and without sign-in, so business enquiries aren't blocked. /start/ keeps the
  landing.
- **Account**: shows each request and its state; **Delete my account** (confirm, then everything
  about them goes, as the admin removal does); a trust line by sign-up and upload: "Your CV and
  details are encrypted, stored privately in Europe and only seen by our team. Delete them any
  time."
- Privacy notice: public accounts, Resend, retention (accounts and drafts unused for 12 months are
  deleted), "How we keep your data safe". Cookie policy unchanged in substance (one login cookie).

## Phase B: reading the CV
`POST /api/account/cv/read` (logged in, after a "Read my CV to fill this in" tick): PDF or Word, 10 MB
max, converted to text with Workers AI `toMarkdown`, then a Workers AI text model returns JSON for
the form's fields (work history, education, skills, contact details, summary). Nothing is stored by
reading; the file is stored only when the form is sent. The person checks every field. Binding
`AI`. Privacy notice: CVs are read by Cloudflare's AI only to fill in your form, never used for
training.

## Phase C: instant portfolios
- Three concepts get instant templates first (`worker/accounts/templates/`), chosen for layouts that
  take CV content well; each concept has `instantTier` ('Profile' or 'Portfolio') in
  `portfolioConcepts.ts` (default Profile, for the team to set). Templates are self-contained HTML
  with the concept's colours, type and structure, sized for any amount of content.
- Generating writes `index.html` to R2 as a preview version (existing preview serving and bar).
- Account: Pay now and publish (a tick first: "I want my portfolio published now. I understand
  that once it's live I lose my 14-day right to cancel."), Speak with us (an enquiry), Pay later.
  Edit details → rebuild.
- Paid (webhook): picks a free slug from their name, sets `live_url` to
  `https://<slug>.humansoftwareagency.com/` and `live_at`; the Worker serves `<slug>` hosts from R2
  with no bar. Wildcard DNS and a `*.humansoftwareagency.com/*` route are account-side steps.

## Phase D: after it's live
Contact us to change it (an enquiry). Connect my own domain: `POST /api/account/domain {domain}`
creates a Cloudflare for SaaS custom hostname (secrets `CF_API_TOKEN`, `CF_ZONE_ID`), shows the CNAME
to add, and checks status; once active the Worker serves that host from R2 and `live_url` becomes
their domain. First 100 hostnames free, then $0.10 each.

## Data
Migration 0004: `users.email_verified_at`; `email_codes (user_id, code_hash, expires_at, tries)`;
`projects.kind`, `projects.route`, `projects.site_slug` (unique), `projects.custom_domain`,
`projects.custom_domain_id`, `projects.custom_domain_status`, `projects.cancel_waiver_at`.

## Security and law
Passwords PBKDF2, tokens and codes hashed, session cookie as before, Origin checks, rate limits, no
enumeration, files private, 404 for anything not yours. Data minimised (no street address). ICO
fee before launch (Gurman). Consumer cancellation waiver for instant purchases (solicitor to check).
