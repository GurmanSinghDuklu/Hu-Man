# Launch runbook: humansoftwareagency.com

Everything in the code is ready. These are the steps that need Gurman's accounts, in order. Nothing
here has been done yet: no host, DNS or search-engine account has been touched.

## 0. Confirm before launch
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

## 1. Hosting: Cloudflare Pages (recommended)
Free, fast in the UK, reads `site/public/_headers` and `_redirects` as they are, and handles the
apex domain cleanly. (Netlify reads the same two files; Vercel would need a `vercel.json`.)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `GurmanSinghDuklu/Hu-Man`.
2. Production branch: `hu-man-rebrand`. Settings:
   - Root directory: `site`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: read from `site/.node-version` (24). If not, set env `NODE_VERSION=24`.
   - No other environment variables. (Do NOT set `PUBLIC_NOINDEX`: that hides the site from search.)
3. Turn off automatic preview deployments for other branches if you don't want them
   (Settings → Builds → Branch control). Cloudflare marks preview URLs noindex anyway.
4. The GitHub "Checks" workflow (`.github/workflows/ci.yml`) runs on every push. Only merge to
   `hu-man-rebrand` when it is green.

## 2. DNS
1. Add humansoftwareagency.com to Cloudflare (free plan). Cloudflare gives two nameservers.
2. Namecheap → Domain List → Manage → Nameservers → Custom DNS → paste Cloudflare's two.
   (Takes minutes to a few hours.)
3. Pages project → Custom domains → add `humansoftwareagency.com`, then `www.humansoftwareagency.com`.
4. **One address only**: Cloudflare → Rules → Redirect Rules → "Redirect from WWW to root"
   template → 301, keep the path and query string. Every canonical tag uses the bare domain.
5. SSL/TLS → Overview → Full (strict). Edge Certificates → Always Use HTTPS: on.

### Email records (our checklist promises SPF, DKIM and DMARC, so our own domain has them)
The domain sends no email (the business address is Gmail), so lock it down against spoofing:

| Type | Name | Value |
|---|---|---|
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; adkim=s; aspf=s` |
| MX | `@` | `0 .` (a "null MX": this domain receives no mail; Cloudflare may need priority 0, target `.`) |

If you later move email onto the domain (e.g. Google Workspace), replace these with the provider's
SPF and DKIM records and start DMARC at `p=none`, then `quarantine`, then `reject`.

## 3. Check the live site (15 minutes)
- [ ] `https://humansoftwareagency.com/` loads; `http://` and `www.` both redirect to it in one hop.
- [ ] https://securityheaders.com/?q=humansoftwareagency.com shows A or A+.
- [ ] https://www.ssllabs.com/ssltest/ shows A or A+.
- [ ] https://pagespeed.web.dev/ on mobile: 95+ everywhere.
- [ ] https://search.google.com/test/rich-results and https://validator.schema.org/ on the home
      and pricing pages: no errors.
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
