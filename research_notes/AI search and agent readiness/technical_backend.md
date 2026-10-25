# Technical and backend requirements for AI search and agent readiness (small UK local-business sites, 2025-2026)

Research date: 2026-10-19. Every claim is dated where the source gives a date. "Secondary" marks claims I took from trade press or search-result summaries rather than reading the primary page myself. Anything dated before 2025 is flagged.

## 1. AI crawler user-agents: what each does, and which a local business should allow

### Takeaway
Every major AI provider now splits its crawlers into three jobs: **search/answer indexing** (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Meta-WebIndexer, Applebot, Googlebot, Bingbot), **user-triggered fetches** (ChatGPT-User, Claude-User, Perplexity-User, Meta-ExternalFetcher), and **training** (GPTBot, ClaudeBot, Meta-ExternalAgent, CCBot, plus the control-only tokens Google-Extended and Applebot-Extended). Each is controlled separately. A local business that wants to be cited must allow the search and user agents. Blocking training agents is a free choice and costs no search visibility, according to OpenAI, Google and Apple's own docs.

### Cited Findings
**OpenAI** ([OpenAI bots page](https://developers.openai.com/api/docs/bots), undated, read 2026-10-19; platform.openai.com/docs/bots now 301-redirects here)
- OAI-SearchBot: "OAI-SearchBot is used to surface websites in search results in ChatGPT's search features." "Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers." OpenAI says "we recommend allowing OAI-SearchBot". IPs are published at openai.com/searchbot.json.
- GPTBot: "used to crawl content that may be used in training our generative AI foundation models." "Disallowing GPTBot indicates a site's content should not be used in training generative AI foundation models." IPs are at openai.com/gptbot.json.
- ChatGPT-User: used "for certain user actions in ChatGPT and Custom GPTs". It "is not used for crawling the web in an automatic fashion", and "Because these actions are initiated by a user, robots.txt rules may not apply." It "is not used to determine whether content may appear in Search".
- OAI-AdsBot: "used to validate the safety of web pages submitted as ads on ChatGPT"; it only visits pages submitted as ads.
- Independence: "Each setting is independent of the others." "If your site has allowed both bots, we may use the results from just one crawl for both use cases." Robots.txt changes take "~24 hours" to apply to search.

**Anthropic** ([Claude Help Center article](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), dated 2026-04-07)
- ClaudeBot collects "web content that could potentially contribute to their training". Blocking it tells Anthropic to exclude the site's future content from training datasets.
- Claude-User: "Claude-User supports Claude AI users". It fetches pages when a person asks Claude something. Blocking it means Claude can't retrieve your content for a user, which may reduce visibility in user-directed web search.
- Claude-SearchBot "navigates the web to improve search result quality for users". Blocking it means your content won't be indexed for search, which may reduce visibility in user search results.
- Anthropic's bots "respect 'do not crawl' signals by honoring industry standard directives in robots.txt". Anthropic also supports "the non-standard Crawl-delay extension".

**Perplexity** ([Perplexity bots guide](https://docs.perplexity.ai/guides/bots), undated)
- "PerplexityBot is designed to surface and link websites in search results on Perplexity." It is not used to crawl content for AI foundation models. Perplexity recommends allowing it.
- "Perplexity-User supports user actions within Perplexity." It generally ignores robots.txt, because a user requested the fetch.
- In August 2025 Cloudflare accused Perplexity of using "stealth, undeclared crawlers" with generic Chrome user agents and IPs outside its published ranges, after sites had blocked it in robots.txt. Cloudflare removed Perplexity from its verified-bot programme. Perplexity disputed this and called the evidence a "sales pitch" ([Decrypt, Aug 2025](https://decrypt.co/333479/cloudflare-perplexity-ai-stealth-crawlers-website-blocks); secondary, I did not read Cloudflare's original post).

**Google** ([Google common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), last updated 2026-10-15)
- Google-Extended is "a standalone product token" that controls whether content Google crawls "may be used for training future generations of Gemini models" (Gemini Apps, Vertex AI API for Gemini) and "for grounding (providing content from the Google Search index to the model at prompt time".
- "Google-Extended does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search."
- Google-Extended has no user-agent string of its own. Crawling uses existing Google user agents, and the token is only a robots.txt control.
- Googlebot crawl preferences govern "Google Search (including Discover and all Google Search features)". AI Overviews and AI Mode are Search features, so Googlebot governs them, not Google-Extended (see section 2).
- Google-CloudVertexBot is separate: it handles site-owner-requested crawls for Vertex AI Agents and has no effect on Search.

**Apple** ([Apple support, About Applebot](https://support.apple.com/en-us/119829), published 2026-09-04)
- Applebot powers "the search technology" in Spotlight, Siri and Safari, and "may also be used to help train Apple foundation models". It "does not follow crawl-delay".
- "Applebot-Extended does not crawl webpages." It only determines how data crawled by Applebot is used for training.
- "Webpages that disallow Applebot-Extended can still be included in search results." "Site rules for Applebot-Extended are not considered in ranking for Search."
- Applebot "may render the content of your website within a browser". Apple warns that blocking JS or CSS in robots.txt may prevent proper rendering.

**Meta** ([Meta web crawlers doc](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers), undated)
- Meta-ExternalAgent "crawls the web for use cases such as training foundation AI models or improving products by indexing content directly". A robots.txt disallow blocks it.
- Meta-WebIndexer "navigates the web to improve Meta AI search result quality for users". Allowing it "helps us cite and link to your content".
- Meta-ExternalFetcher fetches links at a user's request and "may bypass robots.txt rules".
- FacebookExternalHit builds link previews for shared links and "might bypass robots.txt when performing security or integrity checks".
- Meta's crawlers may cache robots.txt for up to 24 hours.

**xAI / Grok**
- I found no official xAI crawler documentation. Third-party directories list GrokBot/1.0, xAI-Grok/1.0, Grok-DeepSearch/1.0 and xAI-SearchBot ([Trakkr](https://trakkr.ai/bots/xai-searchbot), [botcrawl](https://botcrawl.com/bots/xai-grok/); secondary, unverified).
- A February 2026 log analysis claims Grok's crawler sends spoofed Chrome, Safari and Go-http-client strings instead of its documented UAs, which would make robots.txt ineffective against it ([StackFox, Feb 2026](https://stackfox.co/research/grok-user-agent); single-author claim, unverified).

**Crawl volumes (pre-2025, flag as dated)**
- On Vercel's network in one month (published 2024-12-17), Googlebot made 4.5B requests, GPTBot 569M, Claude 370M, AppleBot 314M and PerplexityBot 24.4M ([Vercel/MERJ](https://vercel.com/blog/the-rise-of-the-ai-crawler)).

### Inferences
- Recommended default for a local-business client (salon, trades, dental, takeaway), whose aim is to be found and cited:
  - **Allow:** Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Applebot, Meta-WebIndexer, DuckDuckBot.
  - **Owner's choice** (no documented effect on search visibility): GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Meta-ExternalAgent, CCBot.
  - For a small business that wants maximum AI mentions, allowing training bots too is reasonable. Their facts (name, services, area) getting into model weights is arguably a benefit, and there is little proprietary content to protect. This is an inference, not a documented effect.
  - Blocking Google-Extended also blocks Gemini-app *grounding* from the Search index, per Google's wording. A business that wants to appear in the Gemini app should leave it allowed.
- Example robots.txt (owner chose "allow all"):
  ```
  User-agent: *
  Allow: /
  Sitemap: https://example.co.uk/sitemap-index.xml
  ```
  A training-opt-out variant adds `User-agent: GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `Meta-ExternalAgent` and `CCBot` blocks, each with `Disallow: /`. It must not touch OAI-SearchBot, Claude-SearchBot, PerplexityBot or Googlebot.
- User-triggered agents (ChatGPT-User, Perplexity-User, Meta-ExternalFetcher) may ignore robots.txt anyway. Robots.txt is therefore a preference signal, not access control.
- Build checklist item: log or spot-check the server or CDN logs after launch to confirm OAI-SearchBot, Claude-SearchBot and PerplexityBot get 200s, not 403s.

### Gaps
- I did not read Microsoft's Bingbot page, Common Crawl's CCBot page or ByteDance's Bytespider docs directly. CCBot's role (open dataset used by many model trainers) and Bingbot's role in ChatGPT/Copilot (see section 6) are not confirmed from primary sources here.
- No official xAI documentation exists, so Grok's crawler behaviour is unverified.
- Google publishes no separate "AI Overviews bot". The claim that Googlebot governs AI Overviews rests on Google's wording that Googlebot covers "all Google Search features" and that robots.txt "is the control … for Search" (section 2). No sentence states it word for word.

## 2. What Google Search Central says about AI Overviews and AI Mode

### Takeaway
Google's position (Dec 2025 doc and May 2026 guide) is unambiguous. There are no special requirements: a page must be indexed and snippet-eligible, and AI features use normal ranking plus query fan-out. The controls are the ordinary preview controls (nosnippet, data-nosnippet, max-snippet, noindex). Google-Extended does not remove a site from AI Overviews. Since June 2026 there is a dedicated Search Console report for generative AI impressions.

### Cited Findings
- From "AI features and your website" ([Google](https://developers.google.com/search/docs/appearance/ai-features), last updated 2025-12-10):
  - "There are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations necessary."
  - Eligibility: "a page must be indexed and eligible to be shown in Google Search with a snippet". "There are no additional technical requirements."
  - Controls: use "nosnippet", "data-nosnippet", "max-snippet" or "noindex" to limit what's shown. Robots.txt "is the control for site owners to manage access to how their sites are crawled for Search". Google-Extended is used "To limit AI training and grounding in some of Google's other systems".
  - Best practices include "Ensuring that crawling is allowed in robots.txt, and by any CDN or hosting infrastructure" and "Making sure your structured data matches the visible text on the page".
  - "You don't need to create new machine readable files, AI text files, or markup to appear in these features." "There's also no special schema.org structured data that you need to add."
  - Reporting: AI-feature traffic is "included in the overall search traffic in Search Console … in the Performance report, within the 'Web' search type".
- From "Optimizing your website for generative AI features on Google Search" ([Google guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), announced in the [Search Central blog, May 2026](https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing); page itself undated):
  - "There's no requirement to break your content into tiny pieces for AI to better understand it." "There's no ideal page length."
  - "Structured data isn't required for generative AI search, and there's no special schema.org markup you need to add". Even so, it is "a good idea to continue using it as part of your overall SEO strategy".
  - "You don't need to write in a specific way just for generative AI search." Pages made mainly to manipulate results can violate the scaled content abuse policy.
  - Eligibility again: "indexed and eligible to be shown in Google Search with a snippet". The site must also be "included in Search generative AI features in Search Console".
  - For local businesses: Google Business Profiles (and Merchant Center for products) "can help your products and services to be visible in both AI responses and other Google Search results".
  - The guide mentions "Business Agent", described as "a conversational experience on Google Search that helps customers chat with your brand".
  - Mechanism: RAG relies on Search ranking systems "to retrieve relevant, up-to-date web pages from our Search index". Query fan-out is "A set of concurrent, related queries generated by the model."
  - On semantic HTML: "focus on human readability and don't worry about perfect code."
- A Search Generative AI performance report launched 2026-06-03. It shows impressions in AI Overviews and AI Mode (Search view) and Discover, with no click or query data. It started with a subset of sites, reportedly UK sites first. Whether it has reached all properties is disputed ([Google blog, June 2026](https://developers.google.cn/search/blog/2026/06/gen-ai-performance-reports); rollout details from secondary coverage such as [Relevant Audience](https://www.relevantaudience.com/seo/search-console-generative-ai-report-live-all-properties/)).
- Some coverage says the guide was updated on 2026-07-10 ([ecorpit](https://ecorpit.com/google-ai-search-optimization-guide-geo-aeo-2026/); secondary, unverified).

### Inferences
- For a static Astro site, AI Overviews readiness is identical to normal SEO readiness:
  - indexable pages (no stray noindex);
  - no `nosnippet` or very low `max-snippet` on key pages;
  - robots.txt and CDN allow Googlebot;
  - a verified Search Console property;
  - a complete Google Business Profile.
- Use `data-nosnippet` only on content the owner doesn't want quoted, for example a price list that changes often.
- The GBP mention in Google's own AI guide is the strongest official local-specific lever. The GBP and website NAP should match.

### Gaps
- I found no Google statement on how AI Mode handles local-pack and Maps results for service-area businesses, beyond the GBP sentence above.
- The exact wording and date of the "included in Search generative AI features in Search Console" setting were not verified. Its mechanics (opt-in toggle or automatic) are unclear.

## 3. Structured data: which types matter, and do AI assistants use schema?

### Takeaway
Use JSON-LD for the correct LocalBusiness subtype (e.g. HairSalon, Electrician, Dentist, Restaurant), with NAP, geo, opening hours, areaServed and sameAs. Add Service/Offer where prices are public, and BreadcrumbList. FAQPage no longer earns rich results for ordinary businesses. Self-serving review stars on LocalBusiness/Organization are ineligible. Google says schema is not required for AI features, while Microsoft says schema helps its LLMs. The evidence is mixed, so treat schema as cheap hygiene, not a ranking lever.

### Cited Findings
- Google review snippets ([Google review-snippet doc](https://developers.google.com/search/docs/appearance/structured-data/review-snippet), last updated 2026-09-08):
  - "If the entity that's being reviewed controls the reviews about itself, their pages that use `LocalBusiness` or any other type of `Organization` structured data are ineligible for star review feature."
  - Valid `itemReviewed` types include LocalBusiness, Organization, Product, Event, Course, Recipe and SoftwareApplication, among others.
- FAQPage: Google's FAQ doc says FAQ rich results are only available for "well-known, authoritative websites that are government-focused or health-focused" ([Google FAQPage doc](https://developers.google.com/search/docs/data-types/faqpage)). The change was announced in August 2023 ([Search Central blog, Aug 2023](https://developers.google.com/search/blog/2023/08/howto-faq-changes); post body not read directly; pre-2025 but still current per the doc).
  - Secondary sources report that the change doesn't affect ranking and existing markup need not be removed ([Zyxware](https://www.zyxware.com/tag/faq), [Sitebulb](https://sitebulb.com/structured-data-history?tag=FAQ)).
  - FAQPage is for single-answer questions; use QAPage for user-submitted answers ([Google FAQPage doc](https://developers.google.com/search/docs/data-types/faqpage)).
- Google states that structured data must match visible text ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), 2025-12-10). It also says no special schema is needed for AI features but recommends keeping structured data for overall SEO ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), 2026).
- Microsoft's Fabrice Canel said at SMX Munich (March 2025) that schema markup helps Microsoft's LLMs understand content, and confirmed it in a LinkedIn thread ([Search Engine Land, March 2025](https://searchengineland.com/microsoft-bing-copilot-use-schema-for-its-llms-453455); secondary report of a talk). Search Engine Land noted it was unclear whether Gemini or other engines use schema the same way (same source).
- A counter-view headline says schema "earns no AI citations" ([ecorpit / DEV, 2026](https://ecorpit.com/structured-data-json-ld-ai-search-citations-2026/); practitioner opinion, methodology not checked). Vendor claims of "30% higher visibility" have no primary source ([Averi](https://www.averi.ai/blog/schema-markup-for-ai-citations-the-technical-implementation-guide); treat as marketing).
- Crawlers that don't execute JS (GPTBot, ClaudeBot, PerplexityBot) see only server-delivered HTML ([Vercel/MERJ, Dec 2024](https://vercel.com/blog/the-rise-of-the-ai-crawler)). JSON-LD injected client-side is therefore invisible to them (inference from that finding).

### Inferences
- Schema checklist per client site (static JSON-LD in the HTML):
  1. A LocalBusiness subtype with `name`, `url`, `telephone`, `address` (only if a public premises exists; service-area trades can omit street level), `geo`, `openingHoursSpecification`, `areaServed`, `sameAs` (GBP, Facebook, Instagram), `priceRange`, `image` and `logo`.
  2. `Service` with `provider` and `areaServed`, plus `Offer`/`PriceSpecification` only where the price is shown on the page.
  3. `BreadcrumbList` on inner pages.
  4. `potentialAction` (`ReserveAction` or `OrderAction`) pointing at the real booking or ordering URL. No Google rich result for it was verified, but it is cheap and accurate.
  5. FAQPage is optional. It is harmless and may help machine parsing, but expect no rich result.
  6. Never add `aggregateRating`/`review` pulled from the business's own site or widgets. That is ineligible for Google, and fake data would break the studio's honesty rules.
- Dental practices could use `Dentist` (a LocalBusiness and MedicalOrganization subtype). Note that health-site FAQ eligibility requires "well-known, authoritative", which a single practice is unlikely to meet.

### Gaps
- I found no first-party statement from OpenAI, Anthropic or Perplexity on whether their retrieval pipelines parse JSON-LD.
- No controlled, peer-reviewed study on schema's effect on AI citations was found.
- I did not verify the status of `ReserveAction`/`OrderAction` in Google (Reserve with Google uses partner feeds rather than on-page markup, from my background knowledge, unverified here).

## 4. llms.txt and similar proposals (ai.txt, TDMRep, IETF aipref, Cloudflare Content Signals, RSL)

### Takeaway
llms.txt is a 2024 community proposal. Google Search explicitly ignores it (2026 guide). No major AI provider has publicly committed to reading it, although Chrome Lighthouse 13.3 added an llms.txt audit for "agentic browsing". It is cheap to add on a static site but should be sold as optional, never as a visibility lever. Usage-preference standards (IETF aipref, Cloudflare Content Signals) are still in progress or voluntary.

### Cited Findings
- llms.txt was proposed by Jeremy Howard in September 2024. The current page is v2, last modified 2026-08-10 ([llmstxt.org](https://llmstxt.org/)).
  - It is a Markdown file at the site root (or a subpath) with a required H1, an optional blockquote summary, and H2 sections of links. Pages may have `.md` twins discoverable via `rel="alternate" type="text/markdown"`.
  - Stated purpose: "Our expectation was that llms.txt would mainly be useful for _inference_ rather than _training_, and that is how it has been used" ([llmstxt.org](https://llmstxt.org/)).
- Google:
  - "You don't need to create new machine readable files, AI text files, markup, or Markdown to appear in Google Search". Creating them "will neither harm nor help your site's visibility or rankings in Google Search, as Google Search ignores them" ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), 2026). Secondary sources date the llms.txt note to 2026-06-15 ([Google updates log](https://developers.google.com/search/updates?hl=en), via search summary; not confirmed on the page itself).
  - Also: "You don't need to create new machine readable files, AI text files…" ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), 2025-12-10).
- John Mueller compared llms.txt to the keywords meta tag and said bots didn't request it. He called separate Markdown pages for bots "a stupid idea". Gary Illyes and Amir Taboul said at Search Central Live Deep Dive APAC (2025) that Google was not pursuing llms.txt ([Search Engine Journal, 2026-05-20](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask); quotes undated in the article).
- Lighthouse 13.3 added an "Agentic Browsing" category with an llms.txt audit. Its docs describe llms.txt as "a machine-readable summary of a website's content, specifically designed for LLMs and AI agents" and say that without it "agents may spend more time crawling the site" ([SEJ, 2026-05-20](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask)). The audit is separate from SEO scoring.
- One site owner's logs reportedly show OpenAI fetching llms.txt files ([search summary citing oom.com.sg / topify](https://www.oom.com.sg/is-llms-txt-worth-implementing/); anecdotal, unverified). SEJ found no statements from OpenAI, Anthropic or others on reading llms.txt (same SEJ article).
- Cloudflare Content Signals Policy ([Cloudflare blog, 2025-09-24](https://blog.cloudflare.com/content-signals-policy/)):
  - It adds `Content-Signal:` lines to robots.txt with three signals. `search` covers "building a search index and providing search results" and "does not include providing AI-generated search summaries". `ai-input` covers "retrieval augmented generation, grounding, or other real-time taking of content for generative AI search answers". `ai-train` covers "training or fine-tuning AI models".
  - Managed robots.txt customers (3.8M+ domains) get `Content-Signal: search=yes, ai-train=no`, with no ai-input signal.
  - The signals are voluntary. Major AI companies and search engines have not universally committed to honouring them ([Search Engine Land](https://searchengineland.com/cloudflare-content-signals-462538); secondary).
- IETF AI Preferences (aipref) working group:
  - draft-ietf-aipref-vocab-06, "A Vocabulary For Expressing AI Usage Preferences", is dated 2026-04-27 and targets Proposed Standard with an August 2026 IESG milestone ([IETF datatracker](https://datatracker.ietf.org/group/aipref/documents/), [charter](https://datatracker.ietf.org/wg/aipref/charter/)).
  - A mirror shows -07 dated 2026-08-19 ([kaist mirror](https://ftp.kaist.ac.kr/ietf/draft-ietf-aipref-vocab-07.xml); unconfirmed as officially posted).
  - The HTTP attachment draft (draft-ietf-aipref-attach-04) is listed as expired since 2025-10-28.
  - Technical enforcement is out of scope.

### Inferences
- Treat llms.txt as an optional "agent convenience" extra. It is a few lines on a static Astro site, and a Lighthouse "Agentic Browsing" check now looks for it. Do not claim it improves ChatGPT, Google or Claude visibility: there is no evidence, and that would break the studio's no-guarantee rule.
- If added, keep it truthful and aligned with on-page facts: business name, area served, services, prices only if on the site, contact, and links to key pages.
- Content-Signal lines are harmless to add, but only Cloudflare-related tooling is documented as reading them. Robots.txt user-agent rules remain the operative control.

### Gaps
- I did not find primary sources for ai.txt (Spawning), TDMRep (W3C community group, EU DSM Art. 4 text-and-data-mining opt-out) or RSL (Really Simple Licensing, launched around September 2025). Their status and adoption are unverified here.
- No primary statement from OpenAI, Anthropic, Perplexity or Microsoft on reading llms.txt was found.

## 5. Rendering: do AI crawlers execute JavaScript?

### Takeaway
GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Meta-ExternalAgent, Bytespider and CCBot do not execute JavaScript, according to the only large published measurement (Vercel/MERJ, Dec 2024). Googlebot (and so Gemini) and Applebot do render JS. Static HTML output, which Astro produces by default, is therefore the right architecture. All critical content, NAP, prices and JSON-LD must be in the initial HTML.

### Cited Findings
- From [Vercel/MERJ, "The rise of the AI crawler", 2024-12-17](https://vercel.com/blog/the-rise-of-the-ai-crawler) (pre-2025, flag as possibly dated):
  - JS rendering: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Meta-ExternalAgent and Bytespider do not render JS. AppleBot (browser-based crawler) and Gemini (via Googlebot infrastructure) do. CCBot does not.
  - JS files are fetched but not executed: 11.50% of ChatGPT requests and 23.84% of Claude requests.
  - 404 rates: ChatGPT 34.82%, Claude 34.16%, Googlebot 8.22%. ChatGPT spends 14.36% of fetches on redirects, against 1.49% for Googlebot.
  - Recommendation: "ChatGPT and Claude don't execute JavaScript, so any important content should be server-rendered". Main content, metadata and navigation should come via SSR, ISR or SSG. Client-side rendering is fine for non-essential features such as chat widgets. Keep redirects correct and sitemaps current.
- Apple says Applebot "may render the content of your website within a browser" and warns against blocking JS/CSS in robots.txt ([Apple](https://support.apple.com/en-us/119829), 2026-09-04).

### Inferences
- Astro static output is ideal. The checklist:
  - Never put service lists, prices, hours or contact details behind client-side islands, tabs that load content via JS, or carousels that inject text.
  - Content that is present in the HTML but hidden with CSS (e.g. `<details>`, tab panels) is still in the HTML and readable.
  - JSON-LD must be emitted at build time, never injected by a tag manager.
- The high 404 and redirect rates for AI crawlers point to clean URL hygiene: stable URLs, 301s from old addresses after migrations, no redirect chains, and a current sitemap.
- Third-party embeds (booking widgets, Google Maps iframes, review widgets) are invisible to non-rendering bots. Repeat key facts in plain HTML text next to them, e.g. "Book online, or call 0113 …", and opening hours as text.

### Gaps
- No 2025-2026 replication of the Vercel/MERJ study was found. AI crawler rendering behaviour may have changed since December 2024.
- I found no documentation on whether Claude-SearchBot or Perplexity-User render JS. The Vercel data predates Claude-SearchBot.

## 6. Speed, Core Web Vitals, sitemaps, lastmod, IndexNow, Bing Webmaster Tools and Search Console AI reporting

### Takeaway
No AI provider documents speed or CWV as a citation factor. Fast static HTML still matters for Google ranking, which feeds AI Overviews via RAG, and for crawler efficiency. Bing matters because Copilot is built on it and ChatGPT search has historically leaned on Bing data. Bing Webmaster Tools now has an AI Performance report (Feb 2026), and Microsoft recommends IndexNow for freshness. There is no official evidence that IndexNow feeds ChatGPT directly.

### Cited Findings
- Google AI features rely on Search ranking systems "to retrieve relevant, up-to-date web pages from our Search index" ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), 2026).
- Fabrice Canel (Microsoft, March 2025) said generative AI systems value fresh content and pointed to IndexNow: "Use the API at indexnow.org to push that information as it's published or updated" ([Search Engine Land, March 2025](https://searchengineland.com/microsoft-bing-copilot-use-schema-for-its-llms-453455); secondary).
- Bing Webmaster Tools AI Performance report:
  - Public preview from February 2026 for verified sites. It covers Copilot, Bing AI summaries and some partner integrations, with page-level citation counts and "grounding queries" ([Search Engine Land](https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039); [Practical Ecommerce](https://www.practicalecommerce.com/bings-improved-ai-performance-section); secondary).
  - It has no click data and no surface filter.
  - One site's 91-day sample had 19,717 citations, 69% of them on one page ([Search Influence](https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/)).
- ChatGPT and Bing: practitioner sources claim ChatGPT search relies on Bing's index and that unindexed-in-Bing sites cannot be cited ([Tenten AIGEO](https://geo.tenten.co/en/blog/bing-webmaster-chatgpt-visibility); secondary). A Scrunch AI post (March 2025) suggests OpenAI brought search indexing in-house ([Scrunch](https://ai-cdn.scrunchai.com/blog/2025-03-significant-updates-to-chatgpt-search-are-coming); excerpt only). OpenAI's own crawler page describes OAI-SearchBot as surfacing sites in ChatGPT search ([OpenAI](https://developers.openai.com/api/docs/bots)), which implies OpenAI runs its own crawl. **Conflict:** the exact Bing dependency is unconfirmed by OpenAI.
- IndexNow and ChatGPT: a July 2025 experiment found IndexNow submissions alone did not get a new site indexed or cited ([Metehan Yesilyurt, 2025-07-18](https://metehan.ai/blog/what-happens-when-you-launch-a-website-without-google-or-bing-ai-citation-test/); single anecdotal test). There is no OpenAI statement linking IndexNow to ChatGPT.
- Google Search Console:
  - AI-feature traffic is folded into the Performance report "Web" search type ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), 2025-12-10).
  - A dedicated "Search Generative AI performance report" (impressions only, AI Overviews and AI Mode plus Discover) was introduced 2026-06-03 ([Google blog](https://developers.google.cn/search/blog/2026/06/gen-ai-performance-reports)). The rollout was initially limited, reportedly to UK sites first ([PinMeTo](https://www.pinmeto.com/news/google-search-console-generative-ai-reports-2026/); secondary).
  - Google's guide names it the "Generative AI performance report" ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)).
- Vercel/MERJ recommends current sitemaps and consistent URLs for AI crawlers ([Vercel, Dec 2024](https://vercel.com/blog/the-rise-of-the-ai-crawler)).

### Inferences
- Launch checklist for each client site:
  1. `@astrojs/sitemap` with accurate `lastmod`, only when content actually changes.
  2. A `Sitemap:` line in robots.txt.
  3. Verify in both Google Search Console and Bing Webmaster Tools; Bing can import from GSC.
  4. Submit the sitemap to both.
  5. Add IndexNow: host a key file at the root and ping api.indexnow.org from the deploy step. It is cheap and Microsoft recommends it, but sell it as "notifies Bing and Yandex of updates", not "gets you into ChatGPT".
  6. Monitor GSC's generative AI report and Bing's AI Performance report monthly. These are the only first-party AI-visibility measurements available, and they fit the studio's "measure, don't guarantee" stance.
- CWV: no AI provider documents a speed factor. Keep Lighthouse 95+ for users, Google ranking and crawl efficiency, but don't claim it drives AI citations.

### Gaps
- There is no primary OpenAI documentation on whether, or how much, ChatGPT search uses Bing results in 2026.
- No official statement says Perplexity or Anthropic consume IndexNow.
- No official evidence on page speed as an AI citation factor was found.

## 7. Cloudflare and hosting defaults that block AI bots

### Takeaway
Since 2025-07-01 Cloudflare blocks AI crawlers by default for new customers or domains, and asks owners at setup whether to allow them. Pay per crawl lets publishers charge. Cloudflare's managed robots.txt adds `ai-train=no`. A small business on Cloudflare, or on a host using similar bot-blocking, can silently disappear from ChatGPT, Claude or Perplexity answers. Google's own guidance tells owners to check that "any CDN or hosting infrastructure" allows crawling.

### Cited Findings
- On 2025-07-01 ("Content Independence Day") Cloudflare announced "changing the default to block AI crawlers unless they pay creators for their content" ([Cloudflare blog](https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/)).
- Press coverage says the default blocking applies to new customers, that new domain owners are asked at setup whether to allow AI crawlers, and that AI companies must state crawler purpose (training, inference, search). Pay per crawl lets publishers set a per-crawl price ([MIT Technology Review, 2025-07-01](https://www.technologyreview.com/2025/07/01/1119498/cloudflare-will-now-by-default-block-ai-bots-from-crawling-its-clients-websites/); secondary). The change built on a one-click "block AI bots" option from September 2024 (same source).
- Cloudflare managed robots.txt (3.8M+ domains) serves `Content-Signal: search=yes, ai-train=no` ([Cloudflare, 2025-09-24](https://blog.cloudflare.com/content-signals-policy/)).
- Vercel offers a "Block AI Bots" firewall rule ([Vercel, Dec 2024](https://vercel.com/blog/the-rise-of-the-ai-crawler)).
- Google's best practice list includes "Ensuring that crawling is allowed in robots.txt, and by any CDN or hosting infrastructure" ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), 2025-12-10).
- Cloudflare de-listed Perplexity from its verified-bot programme in August 2025 and added managed-rule heuristics to block its undeclared crawling ([Decrypt](https://decrypt.co/333479/cloudflare-perplexity-ai-stealth-crawlers-website-blocks); secondary). Sites with Cloudflare bot management may therefore block some Perplexity traffic regardless of robots.txt.

### Inferences
- Pre-launch and per-client checklist:
  - If the client's DNS or CDN is Cloudflare, open Security, then Bots / AI Crawl Control, and decide explicitly. Allow search and user agents (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot); block training agents only if the owner wants.
  - Check whether "managed robots.txt" is overwriting the site's own robots.txt.
  - Test with `curl -A "OAI-SearchBot"` (and the others) for a 200. A UA test won't pass IP-verified rules, so also check Cloudflare's AI Crawl Control logs.
- Static hosts such as GitHub Pages and Netlify don't block AI bots by default, as far as I found, but domain registrars and site builders (e.g. Squarespace and Wix, which have AI-crawler toggles) may. This needs checking per client when migrating.
- Make this an audit line item: "AI crawler access check". It is a concrete, measurable finding, and a block is a real risk for small sites that set up Cloudflare without knowing about it.

### Gaps
- I did not read Cloudflare's own documentation on exactly which plans or domains get the default block, how existing domains are treated, or the current pay-per-crawl availability. Those details come from press coverage.
- Not verified: whether Squarespace, Wix, Shopify, Netlify or other hosts block AI crawlers by default in 2026.

## 8. Content patterns that get cited

### Takeaway
Official guidance (Google 2026) rejects AI-specific rewriting, chunking and keyword-stuffing of question variants. It recommends original, people-first content that is crawlable, indexable and snippet-eligible, plus a complete Google Business Profile. For local businesses, the practical citable facts are clear entity details (name, address/area, phone, hours, services, prices), stated in plain HTML text, consistent with GBP and structured data, and kept current.

### Cited Findings
- From the [Google AI optimisation guide (2026)](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide):
  - "You don't need to write in a specific way just for generative AI search."
  - "Create the content yourself based on what you know about the topic."
  - "make pages for your audience, not just for generative AI search."
  - Pages built primarily to manipulate results can breach the scaled content abuse policy.
- Secondary coverage of the guide says over-rewriting for AI (e.g. including every phrasing of a question) is unnecessary and "if overdone, can even be classified as spam" ([arboro.de](https://www.arboro.de/en/blog/googles-ai-optimization-guide); secondary paraphrase).
- Google Business Profiles "can help your products and services to be visible in both AI responses and other Google Search results" ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), 2026).
- Google says structured data should match the visible text ([Google AI features](https://developers.google.com/search/docs/appearance/ai-features), 2025-12-10).
- Microsoft says freshness matters to generative AI and recommends pushing updates via IndexNow ([Search Engine Land, March 2025](https://searchengineland.com/microsoft-bing-copilot-use-schema-for-its-llms-453455)).
- Google's RAG retrieves "relevant, up-to-date web pages" ([Google AI optimisation guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)).
- Bing AI Performance data from one site showed citations heavily concentrated on a single page (69% of 19,717) ([Search Influence](https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/)). This suggests one clear, authoritative page per topic gets most of the citations (one site, anecdotal).

### Inferences
- Practical patterns for a local-business build (inferred from the above, not a documented ranking rule):
  - One page per core service per area, opening with a plain factual sentence, e.g. "We are a Gas Safe registered boiler engineer covering Leeds and Bradford. Boiler service from £X."
  - NAP and opening hours as visible text in the footer and on the contact page, matching GBP exactly.
  - An "About" block with real qualifications or registrations (e.g. GDC number for dentists, Gas Safe or NICEIC for trades, Food Hygiene Rating for takeaways). These are verifiable entity facts that third parties corroborate.
  - Visible "last updated" dates on price and hours pages, and genuine updates.
  - An FAQ section answering real customer questions in plain text. The value is answer content, not rich results.
  - Avoid AI-only hidden content or separate bot pages. Google calls the latter unnecessary, and Mueller called them "a stupid idea".
- Entity consistency across GBP, Bing Places, Apple Business Connect (Apple Maps and Siri use Applebot and Apple data) and directories is likely to matter more than on-page tweaks. This is an inference; no primary source in this research quantifies it.

### Gaps
- I found no rigorous, independent 2025-2026 study (with methodology) on which on-page content patterns raise citation rates in ChatGPT, Claude or Perplexity. The SEO-industry "GEO" claims (e.g. stats or quotation boosts) were not verified against primary research here.
- I found no official OpenAI, Anthropic or Perplexity guidance on how their answer engines choose which sources to cite.
- I found no UK-specific data on AI-assistant local recommendations (e.g. whether ChatGPT uses GBP, Yelp, Bing Places or Apple Maps data for UK local queries).
