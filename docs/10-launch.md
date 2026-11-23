# Launch runbook: humansoftwareagency.com

Everything in the code is ready. These are the steps that need Gurman's accounts, in order. The site
is live on Cloudflare Workers. Done 2026-10-31: Bing Webmaster Tools (verified with
`public/BingSiteAuth.xml`, sitemap submitted) and a first IndexNow submission of all 13 pages.
Still to do: Google Search Console, Google Business Profile and the rest of section 5.

## 0. Confirm before launch
- [ ] **The new pages' wording** (drafts, 2026-10-26): `/agentic-ai-ready/` (the definition and the
      eight points), `/free-ai-check/` (what we check, "within 48 hours"), `/contact/`.
- [ ] **The domain**: humansoftwareagency.com (registered at Namecheap on 2026-10-11, linked from the
      Instagram bio). The code assumes it in one place: `site/src/config/domain.ts`.
- [ ] **The About promises** ("we fix our mistakes at no cost", "a real person answers", "no charge for
      every little thing"): customers can hold us to them. Put them in the contract terms too.
- [ ] **The new services** (e-commerce, mobile apps, custom software, branding) can be delivered now.
- [ ] **The checklist and Essential**: "Every site passes this checklist" includes AI crawler rules
      and structured data, but Essential is "not agentic AI-ready".
- [ ] **Prices**: still drafts in `docs/02-offer-and-pricing.md`. Care plans show a Draft badge.
- [ ] **Phone**: +44 7988 450280 is a personal number. A business number keeps spam off it
      (`site/src/config/site.ts`).
- [ ] **Privacy notice**: remove its draft flag once reviewed, and name the host in its Hosting
      section. It says sole-trader registration is planned; register before the first paid work
      (`docs/05-compliance-and-claims.md`).
- [ ] **Merge** `agency-redesign` into `hu-man-rebrand` (the production branch).

## 1. Hosting: Cloudflare Workers (recommended)
Free, fast in the UK, and runs the enquiry form's endpoint (`site/worker/`) next to the static
site. Everything is set in `site/wrangler.toml`; `public/_headers` and `_redirects` work as they are.
(Cloudflare *Pages* can't send the form's email, so use Workers.)

1. Do section 2 (DNS) first, so the domain is on Cloudflare.
2. Cloudflare dashboard → Workers & Pages → Create → Import a repository →
   `GurmanSinghDuklu/Hu-Man`. Settings:
   - Project name: `humansoftwareagency` (must match `name` in `site/wrangler.toml`)
   - Production branch: `hu-man-rebrand`
   - Root directory: `site`
   - Build command: `npm run build`
   - Deploy command: `npm run deploy` (since 2026-11-19; was `npx wrangler deploy`). It runs
     `npx wrangler deploy`, then tells IndexNow which pages changed (`site/scripts/deploy.mjs`).
     Leave the non-production branch deploy command as it is.
   - Node: read from `site/.node-version` (24). If not, set build variable `NODE_VERSION=24`.
   - No `PUBLIC_NOINDEX` or `PUBLIC_FORM_MODE` (those are for the GitHub preview only).
3. `wrangler.toml` attaches the Worker to `humansoftwareagency.com` itself (Custom Domain), so no
   separate custom-domain step is needed. Check Settings → Domains & Routes shows it.
4. The GitHub "Checks" workflow (`.github/workflows/ci.yml`) runs on every push. Only merge to
   `hu-man-rebrand` when it is green.

### The enquiry form's email (Email Routing)
The form emails each enquiry to humansoftwareagency@gmail.com through Cloudflare. To allow that:
1. Cloudflare → humansoftwareagency.com → Email → Email Routing → Get started. It adds its own MX
   and SPF records: accept them.
2. Destination addresses → add **humansoftwareagency@gmail.com** → click the link Cloudflare emails
   to it. The form can only send to a verified address.
3. Bonus: add a routing rule `hello@humansoftwareagency.com` → the Gmail address. That gives you a
   professional address on the domain for free (put it on the site later in `site/src/config/site.ts`).
4. Test after deploy: send yourself a message from `/contact/`, check it arrives, and press Reply
   (it should reply to the address you typed in the form).
5. If sending ever fails, visitors are offered a ready-written email instead, so no enquiry is lost.

What the enquiry email contains (since 2026-10-27): every field, the page it was sent from, the
time it arrived and the "reply by" time (48 hours, UK time), and, when a website was given, a
quick automatic look at it (loads? HTTPS? speed, title, description, robots.txt blocks on AI
crawlers, llms.txt) plus links to PageSpeed, Google's rich results test, securityheaders.com and a
`site:` search. Code: `site/worker/enquiry.js` and `site/worker/site-look.js`.

### Auto-reply to the sender (built, switched off)
The Worker can email each sender a fixed "We've got your message" note (what happens next, links
to pricing and work; nothing they typed is echoed, so the form can't be used to send spam). It
is off because Cloudflare's free plan can only send to verified addresses (just our Gmail).
To switch it on (Gurman's decision, it costs money):
1. Cloudflare → Workers & Pages → Plans → **Workers Paid** (includes 3,000 sent emails a month,
   then $0.35 per 1,000; Email Sending is in beta).
2. Cloudflare → Email → **Email Sending** → onboard humansoftwareagency.com and accept the DNS
   records it adds (they sit alongside the Email Routing ones).
3. In `site/wrangler.toml`, uncomment the two `REPLY_EMAIL` lines, commit and push.
4. Update the privacy notice ("If you use a form") to say the sender gets one automatic email.
5. Before step 3, the Cloudflare WAF rate-limiting rule on `/api/enquiry` (section 5b) should be
   in place: an auto-reply is an email to an address someone typed, so flooding must be blocked.
6. Test: send an enquiry from `/contact/` with a second address of yours and check both emails.

### Client accounts (login, brief, uploads)
Built 2026-11-23 (spec `docs/superpowers/specs/2026-11-23-client-accounts-design.md`). Invited clients
log in at `/login/`, fill in their project brief and upload files; the team manages them at
`/admin/`. It needs a database (D1) and a file store (R2) in the same Cloudflare account. Both are
free at this size (D1: 5 GB; R2: 10 GB and no fees for downloads). Steps 1 to 3 were done on
2026-11-23 (both in Western Europe; R2 needed switching on in the dashboard with a card, free tier).
For reference, the steps were:
1. `cd site && npx wrangler d1 create hm_accounts`. Copy the `database_id` it prints into
   `site/wrangler.toml` (the `[[d1_databases]]` block), replacing the zeros. Commit.
2. `npx wrangler r2 bucket create hm-client-files` (keep it private: never turn on public access).
3. `npx wrangler d1 migrations apply hm_accounts --remote` (creates the tables).
4. Deploy as usual.
5. `npm run make-admin -- <email> "<name>" --remote` for Gurman, then for Mandeep. Each prints a
   one-time setup link (7 days); open it and choose a password. Run it again for a forgotten admin
   password.
6. Check: log in at `/admin/`, create a test client with your own second address, open its setup
   link in a private window, fill in and send the brief with a small upload, and check the
   "[Client brief]" email arrives. Then delete the test client:
   `npx wrangler d1 execute hm_accounts --remote --command "DELETE FROM users WHERE email = '<test address>'"`
   (its project, brief and file records go with it; the uploaded file stays in R2 until you delete
   it in the dashboard).

Local testing: `npx wrangler d1 migrations apply hm_accounts --local`, `npm run build`,
`npx wrangler dev --local --local-upstream localhost:8787` (without `--local-upstream`, wrangler
reports the live domain as the address, so links point there and the test codes below never show),
then `npm run make-admin -- you@example.com "You"` prints a localhost link. Put
`DEV_SHOW_CODES=yes` in `site/.dev.vars` to see sign-up codes on screen instead of by email.

### Client previews and card payments
Built 2026-11-23 (spec `docs/superpowers/specs/2026-11-23-preview-and-payment-design.md`).

**Preview uploads (needed before the first preview):**
1. Make a long random token: `openssl rand -base64 32`.
2. `cd site && npx wrangler secret put PREVIEW_UPLOAD_TOKEN` and paste it.
3. On each laptop that uploads (Gurman's), save the same token as one line in
   `~/.hu-man/preview-token`. Share it privately (in person or a password manager), never by chat
   or email, and never commit it.
4. For each client: on their page in `/admin/` copy the **base path**, build the site with it (Astro:
   `base: '/preview/<id>'`), then `npm run preview-upload -- <client email> <dist folder>`.
   `--base` prints the base path without uploading; `--local` uploads to `wrangler dev`.

**Card payments (Stripe; until this is done the pay button says payment details will be emailed):**
1. Open a Stripe account (stripe.com, UK, sole trader), add the bank account for payouts.
2. Stripe → Developers → API keys: copy the **secret key** (`sk_live_…`, or `sk_test_…` to try it
   with Stripe's test cards first). `npx wrangler secret put STRIPE_SECRET_KEY` and paste it.
3. Stripe → Developers → Webhooks → Add endpoint: URL
   `https://humansoftwareagency.com/api/stripe/webhook`, event `checkout.session.completed`.
   Copy its **signing secret** (`whsec_…`): `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
4. Stripe → Settings → Customer emails: turn on **successful payment receipts**.
5. Test with a test-mode key and card 4242 4242 4242 4242 on a dummy client, then swap both secrets
   for the live ones (the live webhook has its own signing secret).
6. Payments land as "Paid" on the client's page and as a "[Paid]" email. Then connect their domain
   and press **Mark live**.

### Self-serve portfolios: accounts, CV reading, instant builds, own domains
Built 2026-11-23 (spec `docs/superpowers/specs/2026-11-23-self-serve-portfolios-design.md`). Before
the deploy that includes it: `npx wrangler d1 migrations apply hm_accounts --remote` (adds 0003 and
0004). Each part below works on its own; until its step is done, the site says so politely.

**Emails to people (sign-up codes, resets, receipts): Resend**
1. resend.com → sign up (free: 3,000 emails a month, 100 a day) → Domains → add
   humansoftwareagency.com and add the DNS records it shows in Cloudflare (they sit alongside the
   Email Routing ones). Wait until it says Verified.
2. API Keys → create one with "Sending access" for that domain only.
   `npx wrangler secret put RESEND_API_KEY` and paste it.
3. In `site/wrangler.toml` `[vars]`, add `RESEND_FROM = "Hu/man <hello@humansoftwareagency.com>"`.
4. Test: create an account at /login/ with a real address of yours; the code arrives.

**Reading CVs: Workers AI** (binding `AI`, nothing to set up). It uses the free daily allowance
(10,000 neurons, about a few hundred CVs a day). If Cloudflare ever moves the model
(`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, `worker/accounts/cvread.js`) to Workers Paid, the
button says reading isn't available and people type it in.

**Instant portfolios published at <name>.humansoftwareagency.com**
1. Cloudflare → DNS → add record: type `AAAA`, name `*`, address `100::`, Proxied.
2. The Worker route `*.humansoftwareagency.com/*` is in `site/wrangler.toml`; it arrives with the
   next deploy.
3. Card payments need Stripe (see "Client previews and card payments" above).

**"Connect my own domain": Cloudflare for SaaS**
1. Cloudflare → humansoftwareagency.com → SSL/TLS → Custom Hostnames → enable (first 100 free,
   then $0.10 each a month).
2. DNS → add `sites` → `AAAA 100::`, Proxied. Set it as the Fallback Origin on that page.
3. The Worker route `*/*` (so customers' domains reach the Worker) is in `site/wrangler.toml`.
4. My Profile → API Tokens → Create token → permission "Zone · SSL and Certificates · Edit" for
   humansoftwareagency.com only. `npx wrangler secret put CF_API_TOKEN`, then
   `npx wrangler secret put CF_ZONE_ID` with the zone id from the zone's Overview page.

## 2. DNS
1. Add humansoftwareagency.com to Cloudflare (free plan). Cloudflare gives two nameservers.
2. Namecheap → Domain List → Manage → Nameservers → Custom DNS → paste Cloudflare's two.
   (Takes minutes to a few hours.)
3. **One address only**: DNS → add record `AAAA`, name `www`, value `100::`, Proxied (orange cloud).
   Then Rules → Redirect Rules → "Redirect from WWW to root" template → 301, keep the path and query
   string. Every canonical tag uses the bare domain; the Worker only answers on it.
4. SSL/TLS → Overview → Full (strict). Edge Certificates → Always Use HTTPS: on.

### Let every crawler in (do this before anything else is switched on)
**Cloudflare blocks AI crawlers by default on new domains** and can rewrite robots.txt to shut out
AI training. Left on, ChatGPT, Claude and Perplexity would never see the site, whatever our own
robots.txt says. In the Cloudflare dashboard for humansoftwareagency.com:
1. **AI Crawl Control** (or Security → Settings → Bot traffic): set "Block AI bots" to **Do not block
   (allow)**, and make sure no individual crawler shows as Blocked.
2. **Managed robots.txt**: **off**. Our own `/robots.txt` already welcomes every crawler by name.
3. **Bot Fight Mode**: **off**. It can serve challenges that crawlers can't solve.
4. No "Pay per crawl", no WAF rules on user agents, no "Under Attack" mode.

Then prove it from any terminal: every line should print `200`. A `403`, `503` or a challenge
page means something above is still blocking.
```sh
for ua in Googlebot Bingbot GPTBot OAI-SearchBot ChatGPT-User ClaudeBot Claude-SearchBot \
  Claude-User PerplexityBot Perplexity-User Google-Extended Applebot DuckAssistBot; do
  printf '%-18s ' "$ua"
  curl -s -o /dev/null -w '%{http_code}\n' -A "Mozilla/5.0 (compatible; $ua)" https://humansoftwareagency.com/
done
curl -s https://humansoftwareagency.com/robots.txt | head -20   # must be ours, with no Disallow
```
Re-check after any Cloudflare change, and in the monthly AI visibility check.

### See which crawlers visit (no code)
Cloudflare → humansoftwareagency.com → AI Crawl Control (the same page as step 1 above). It lists each AI crawler (GPTBot, ClaudeBot, PerplexityBot and the rest), how
often it fetches the site, and whether it is allowed. Every one should say **Allow**; set any that
says Block back to Allow. Look at it in the monthly AI visibility check. The site itself logs
nothing about visitors, bots included.

### Early Hints (fonts start loading sooner)
Cloudflare → humansoftwareagency.com → Speed → Settings → Content Optimization → **Early Hints: on**.
The Worker already sends `Link: rel=preload` headers for each page's fonts (`site/worker/pages.js`),
which is what Early Hints reads. Check after a deploy (load the page twice: the first visit
teaches Cloudflare the hints):
```sh
curl -s -o /dev/null https://humansoftwareagency.com/
curl -sv --http2 -o /dev/null https://humansoftwareagency.com/ 2>&1 | grep -E '< HTTP/2 (103|200)|< link'
```
A `103` line before the `200` means it works. If it never appears, nothing is lost: browsers
still preload the fonts from the page itself.

### Email records (our checklist promises SPF, DKIM and DMARC, so our own domain has them)
Email Routing (above) adds the MX records and an SPF record. Then add:

| Type | Name | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r` |

Check Email → Email Routing → Settings shows the DKIM and SPF records as "Configured". After a month
of the form's emails arriving fine (not in spam), tighten DMARC to `p=reject`. If you later send
email from the domain with another provider (e.g. Google Workspace), add their SPF include and DKIM
record, and keep DMARC.

## 3. Check the live site (15 minutes)
- [ ] `https://humansoftwareagency.com/` loads; `http://` and `www.` both redirect to it in one hop.
- [ ] https://securityheaders.com/?q=humansoftwareagency.com shows A or A+.
- [ ] https://www.ssllabs.com/ssltest/ shows A or A+.
- [ ] https://pagespeed.web.dev/ on mobile: 95+ everywhere.
- [ ] https://search.google.com/test/rich-results and https://validator.schema.org/ on the home
      and pricing pages: no errors.
- [ ] The crawler check above prints `200` for every crawler.
- [ ] Each page's Markdown copy opens, e.g. `/index.html.md`, `/pricing/index.html.md`.
- [ ] Asking for Markdown returns it at the page's own address, and a browser still gets the page:
      `curl -sI -H 'Accept: text/markdown' https://humansoftwareagency.com/pricing/` shows
      `content-type: text/markdown`, and `curl -sI https://humansoftwareagency.com/pricing/` shows
      `content-type: text/html` with a `link:` header naming `/pricing/index.html.md`.
- [ ] Rich Results Test on `/` and `/pricing/` lists a Video (VideoObject) with no errors. Google
      may still not show the videos in video results: it mostly does that for pages where the
      video is the main content, and these are hero videos.
- [ ] `/api/enquiry` opens and shows the field list (that's what AI agents read).
- [ ] A test message from `/contact/` and one from `/free-ai-check/` both reach the inbox, and
      Reply goes to the address typed in the form. Try once with JavaScript off too.
- [ ] These open: `/robots.txt`, `/sitemap-index.xml`, `/llms.txt`, `/llms-full.txt`,
      `/.well-known/security.txt`, `/site.webmanifest`, `/cd99b05867c9de36c6aa606c39fb4593.txt`.
- [ ] Share the home URL in a WhatsApp or LinkedIn draft: the new card image shows.
- [ ] `/contact`, `/faq` and `/portfolio` redirect to the right sections.

## 4. Search engines
1. **Google Search Console** (https://search.google.com/search-console): add a *Domain* property,
   verify with the TXT record it gives (add it in Cloudflare DNS). Sitemaps → submit
   `sitemap-index.xml`. URL inspection → home page → Request indexing.
2. **Bing Webmaster Tools** (https://www.bing.com/webmasters): sign in, Import from Google Search
   Console (copies the site and sitemap). Bing's index feeds Copilot and ChatGPT search, so this
   matters for AI answers as much as for Bing.
3. **IndexNow** runs by itself on every deploy (the `npm run deploy` deploy command in section 1):
   it sends the pages whose date changed. Bing, Yandex and others recrawl within hours. The build
   log shows what it sent ("IndexNow: N URLs"). To send every page by hand, from `site/`:
   `npm run build && npm run indexnow` (`-- --dry-run` first to see the list).

## 5. Being found locally and by AI (the off-site half)
AI answers about local businesses lean on the same sources as local search: the Business Profile,
reviews, and consistent mentions on other sites. Use the **exact same details everywhere**:
- Name: **Hu/man Software Agency**
- Website: **https://humansoftwareagency.com**
- Email: humansoftwareagency@gmail.com · Phone: the business number once you have one
- Area: Leeds, West Yorkshire (service-area business, no street address shown)
- One-line description: "Software studio in Leeds building websites, apps and software that are
  agentic AI-ready as standard, with a real person from first call to long after launch."

Steps:
1. **Google Business Profile** (https://business.google.com): service-area business, hide the
   address, service areas = Leeds plus the towns in `site/src/config/site.ts`. Primary category
   "Website designer"; add "Software company" and "Internet marketing service". Add each service
   from the services page, the website link, and real photos. Post the Instagram work there too.
2. **Bing Places** (https://www.bingplaces.com): import from Google Business Profile.
3. **Apple Business Connect** (https://businessconnect.apple.com): feeds Apple Maps and Siri.
4. **Instagram bio** already links the site. Add a LinkedIn *company* page and a Facebook page with
   the same name and link, then add their URLs to `contact` in `site/src/config/site.ts` and to
   `sameAs` in `site/src/data/schema.ts`, so the schema ties them to the business.
5. A few quality directories only: Yell, FreeIndex, Cylex, Nextdoor, the Leeds Chamber of Commerce
   if you join. Identical details on each (see `docs/04-seo-plan.md`).
6. **Reviews**: ask every client for a Google review with the direct link, and reply to each one.
   When real reviews exist, they can go on the site and into the schema; never before.
7. **AI visibility baseline**: in week one, run the fixed query list from `docs/04-seo-plan.md` in
   Google (AI Overviews and AI Mode), ChatGPT, Perplexity, Gemini, Claude and Copilot. Note whether
   Hu/man appears and which sources are cited. Repeat monthly with the same list.

## 5b. Security hardening (account side)
The code side is done: TLS 1.2+ only (1.3 offered), HSTS, CSP with hashed scripts, no cookies, no
third-party scripts, a rate-limited and size-capped form endpoint (reply addresses can't carry
header characters; the automatic site look checks every redirect before following it), 0 known
dependency vulnerabilities, a build that refuses to deploy if tests or the SEO/GEO check fail,
GitHub Actions pinned to commit hashes, Dependabot.
These need your logins:
1. **Two-factor authentication** (an authenticator app or passkey, not SMS) on all four:
   Cloudflare, Namecheap, GitHub, and the humansoftwareagency@gmail.com Google account. Whoever
   gets into any one of these controls the site or the email. This is the most important item.
2. **DNSSEC**: Cloudflare → DNS → Settings → Enable DNSSEC → copy the DS record it shows →
   Namecheap → Domain List → Manage → Advanced DNS → DNSSEC → add it. Stops DNS answers being forged.
3. **CAA records** (only these certificate authorities may issue for the domain). Cloudflare → DNS →
   Add record, type CAA, name `@`: `0 issue "pki.goog"`, then `0 issue "letsencrypt.org"`, then
   `0 issuewild "pki.goog"`, then `0 iodef "mailto:humansoftwareagency@gmail.com"`. Cloudflare
   adds the other CAs it needs automatically.
4. **GitHub**: Settings → Branches → add a rule for `hu-man-rebrand`: require the "checks"
   status check to pass and require a pull request before merging. Settings → Code security →
   turn on Dependabot alerts, Dependabot security updates and secret scanning (free for public repos).
5. **Namecheap**: keep Domain Lock (already on: clientTransferProhibited) and WithheldforPrivacy on.
6. **Cloudflare**: Security → Settings → leave "Block AI bots" off and Bot Fight Mode off (they
   would hide the site from AI). Notifications → add alerts for "Universal SSL" and "Workers
   deployment failures" to your email.
7. **After 6 weeks with no problems**: HSTS preload (see "Keeping it right").
8. Re-check any time: https://securityheaders.com/?q=humansoftwareagency.com (aim A+),
   https://www.ssllabs.com/ssltest/analyze.html?d=humansoftwareagency.com (aim A+),
   https://internet.nl/site/humansoftwareagency.com/ and https://internet.nl/mail/humansoftwareagency.com/.

## 6. Keeping it right
- Change prices in `docs/02` then `site/src/data/pricing.ts`; titles, schema, llms.txt and the
  FAQ follow automatically.
- Change a page headline → update its `ogHeadline` in `site/src/data/pages.ts` → `npm run og-images`.
- Brand artwork changes → `npm run icons`.
- `security.txt` renews its expiry on every build: rebuild at least once a year.
- After six weeks with no problems, consider HSTS preload: add `; preload` to the
  Strict-Transport-Security line in `site/public/_headers` and in `SECURITY_HEADERS` in
  `site/worker/index.js` (the form endpoint sets its own), then submit at https://hstspreload.org.
  Hard to undo, so only once HTTPS is certain on every subdomain.

## Next content (needs Gurman's copy approval)
The strongest remaining SEO and GEO gains are content, not code. From `docs/04-seo-plan.md`:
1. A case-study page per project (what was built, why, what changed), starting with Essence.
2. "How much does a website cost in Leeds in 2026?": our real prices answer it.
3. "How to get your business recommended by Google and ChatGPT": what works, what no one can promise.
4. "Moving your website without losing Google rankings".
Each answers a question people ask AI tools, from a source that can prove it.
