# Launch runbook: humansoftwareagency.com

Everything in the code is ready. These are the steps that need Gurman's accounts, in order. Nothing
here has been done yet: no host, DNS or search-engine account has been touched.

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
   - Deploy command: `npx wrangler deploy`
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
3. **IndexNow**, after every deploy that changes content, from `site/`:
   `npm run build && npm run indexnow` (`-- --dry-run` first to see the list). Bing, Yandex and
   others recrawl within hours.

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
third-party scripts, a rate-limited and size-capped form endpoint, 0 known dependency
vulnerabilities, a build that refuses to deploy if tests or the SEO/GEO check fail, Dependabot.
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
  Strict-Transport-Security line in `site/public/_headers`, then submit at https://hstspreload.org.
  Hard to undo, so only once HTTPS is certain on every subdomain.

## Next content (needs Gurman's copy approval)
The strongest remaining SEO and GEO gains are content, not code. From `docs/04-seo-plan.md`:
1. A case-study page per project (what was built, why, what changed), starting with Essence.
2. "How much does a website cost in Leeds in 2026?": our real prices answer it.
3. "How to get your business recommended by Google and ChatGPT": what works, what no one can promise.
4. "Moving your website without losing Google rankings".
Each answers a question people ask AI tools, from a source that can prove it.
