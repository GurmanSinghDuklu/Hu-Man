# Local and AI-search SEO plan

## Reality check
- The goal is to rank well for local searches, but no one can guarantee a position. Local rankings usually take weeks to months and depend on the Google Business Profile, reviews, relevance and competition.
- A page previewed on a claude.ai artifact link will not rank. The site needs its own domain and hosting.
- Google's own guidance says there are no extra requirements to appear in AI Overviews or AI Mode and no special optimisations: apply the fundamentals. A page must be indexed and eligible to show with a snippet, and content should be helpful and people-first. Source: https://developers.google.com/search/docs/appearance/ai-features
- AI Overviews only appear when Google decides they add something, so they often do not trigger. Pew Research (reported by SerpApi) found people clicked a regular result on 8% of visits when an AI summary appeared, versus 15% without one (US data). So the page must convert the visits it does get.
- One 2026 local SEO guide says AI local answers draw on Google Business Profile data, review text and third-party mentions, the same inputs as local search. A BrightLocal survey (vendor, n about 1,164) found 58% of consumers had used AI to find or get a recommendation for a local business, but 75% then go to Google to verify. Treat these as directional.

## Target queries (hypotheses; validate with Search Console and a keyword tool)
Primary: web designer Bradford; website design Bradford; website redesign Bradford; web design West Yorkshire.
Long tail (likely easier): AI chatbot for small business Bradford; Squarespace alternative Bradford; website with online booking Bradford; local SEO Bradford; Google Business Profile help Bradford.
Never create near-duplicate town pages ("web designer in Halifax" with swapped city names). Create a location page only if it has unique, useful content and a real reason (a real client or meeting presence).

## Technical checklist
- Own domain, HTTPS, `www` and non-`www` redirect to one canonical version.
- One `h1`; descriptive `title` (about 60 characters) and meta description (about 155) on every page; canonical URL on every page.
- `sitemap.xml` (via `@astrojs/sitemap`) and `robots.txt` pointing to it. Submit in Google Search Console and Bing Webmaster Tools.
- JSON-LD `ProfessionalService` on the home page (see `03-site-spec.md`), matching visible content. `FAQPage` markup is optional and harmless but no longer gets rich results for most sites.
- Open Graph and Twitter card tags with a designed 1200x630 image.
- Fast: LCP under 2 seconds on mobile, no layout shift, minimal JavaScript, self-hosted fonts.
- Descriptive internal links and anchor text; clear navigation; 404 page.
- Accessibility (also helps SEO and is a selling point).

## Google Business Profile (highest-leverage local asset)
- Create it as a service-area business. Hide the street address if working from home (Google allows this) and list service areas.
- Choose the most specific primary category, add every valid secondary category, add services with descriptions, photos of real work (concept renders labelled as such are not real photos; add real photos as they exist), and post regularly.
- Verify it. Ask every client for a Google review with a direct link. Reply to every review.
- Keep name, address (or service area) and phone identical everywhere.

## Off-site
- A handful of quality listings beat hundreds of junk ones: Yell, FreeIndex, Cylex, Nextdoor, plus local and industry bodies (Chamber of Commerce, Enterprise Nation, King's Trust where relevant).
- Earn links and mentions from partners (accountants, photographers, printers), client sites ("Website by ..."), local press and community sites.
- LinkedIn, GitHub and Facebook pages with the same name and link.

## Content plan (helpful, specific, honest; one strong page beats five thin ones)
1. How much does a website cost in Bradford in 2026?
2. Squarespace or a custom site for a small UK business?
3. How to get your business recommended by Google and ChatGPT (what actually works, and what nobody can promise).
4. Moving your website without losing Google rankings.
5. What an AI enquiry assistant can and cannot do for a barber, salon or electrician.
6. Case study pages, starting with Essence Hair Treatment (labelled honestly as a family business) and then real clients.

## Measurement
- Search Console (impressions, clicks, queries), Google Business Profile insights, and Lighthouse.
- A monthly AI-visibility check: a fixed list of 20 local queries run in Google (AI Overviews and AI Mode), ChatGPT and Perplexity, recording whether the business appears and which sources are cited. Keep the same list to compare month by month. BrightLocal offers a tracker; manual works to start.
- Do not report rankings as guaranteed results.
