# Agentic actions: making small-business sites usable by AI agents that browse, compare, book and buy (2025-2026)

Research date: 2026-10-19. Status labels used: SHIPPED (GA), PREVIEW (beta/Labs/early preview), DRAFT (spec/proposal), REPORTED (secondary source only, not confirmed against a primary). Several primary pages (OpenAI help centre) returned HTTP 403 to the fetch tool, so some OpenAI details are taken from search-result summaries of those pages; this is flagged where it applies.

## 1. How browsing agents perceive pages, and what official guidance exists

### Takeaway
Browsing agents use a mix of screenshots, raw HTML/DOM and the accessibility tree, and the only explicit vendor guidance found (OpenAI, for Atlas) says, in effect, "build to WAI-ARIA/accessibility best practice". Google's public line (Mueller) is that a site useful to humans is useful to agents. For a small business, a well-built accessible site with text prices and availability *is* the agent-readiness work; there is no separate "agent SEO" layer to buy.

### Cited Findings
- OpenAI's "Publishers and developers FAQ" (help.openai.com, article 12627856, published around the Atlas launch, Oct 2025) says making a website more accessible helps ChatGPT Agent in Atlas understand it; Atlas reads the same ARIA labels and roles that screen readers use; it recommends descriptive roles, labels and states on buttons, menus and forms, and following WAI-ARIA best practices. — [OpenAI Publishers and developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) (page returned 403 to direct fetch; content taken from search summary, so wording is paraphrased, not quoted)
- The same FAQ covers publisher controls: allowing OAI-SearchBot lets publishers track ChatGPT referral traffic in analytics; disallowing GPTBot opts out of training, and OpenAI says it respects that signal for content gathered through Atlas use. — [OpenAI Publishers and developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) (search summary)
- Search Engine Journal reports that Atlas queries the accessibility tree for roles and accessible names rather than relying on screenshot analysis. — [Search Engine Journal: How AI agents see your website](https://www.searchenginejournal.com/how-ai-agents-see-your-website-and-how-to-build-for-them/570443/)
- Accessibility specialist Adrian Roselli (Oct 2025) criticises the OpenAI guidance as treating ARIA as bot metadata, warning it encourages misuse of ARIA ("making the web worse"); the accessibility community's rule is that native HTML beats ARIA, and bad ARIA harms screen-reader users. — [Adrian Roselli: OpenAI, ARIA, and SEO](https://adrianroselli.com/2025/10/openai-aria-and-seo-making-the-web-worse.html)
- Simon Willison notes the broader point that AI agents behave like assistive technologies and benefit from the same page affordances. — [Simon Willison, accessibility tag](https://feeds.simonwillison.net/tags/accessibility/)
- Google's John Mueller (reported, on Bluesky) said most existing quality principles stay the same, because a website useful for human users will generally also be useful for agentic browsers. Not published on Search Central. — [Search Engine Journal: Google answers question about SEO for AI agents](https://www.searchenginejournal.com/google-answers-question-about-seo-for-ai-agents/580589/)
- A UK SEO podcast recap (May 2026) refers to "Google's official guidance on building agent-friendly websites" noting agents use screenshots, raw HTML and the accessibility tree; I could not locate the Google document itself. — [Candour: biggest SEO news from April 2026](https://withcandour.co.uk/podcast/the-biggest-seo-news-from-april-2026) (UNVERIFIED)
- Chrome's agentic "auto browse" (Gemini 3, launched Jan 2026) pauses before sensitive actions such as purchases or social posts. — [Noqta: Google Chrome gets agentic AI](https://noqta.tn/en/news/google-chrome-gets-agentic-ai-gemini-can-now-browse-the-web-for-you) (secondary)
- Microsoft Copilot Mode in Edge went from experimental (July 2025) to available to all users (Oct 2025); Copilot Actions can book a restaurant table or unsubscribe from mailing lists, US-only at the time. Testing found real errors: it booked 26 October instead of 26 November, and claimed to have sent/deleted emails it had not. Copilot labels the tool as for research and evaluation and "may make mistakes". — [Mezha: Copilot Mode in Microsoft Edge](https://mezha.ua/en/news/copilot-mode-in-microsoft-edge-305829/); [PCWorld](https://www.pcworld.com/article/2859596/microsoft-is-testing-its-own-ai-browser-via-copilot-mode-for-edge.html)
- Anthropic's Claude in Chrome: pilot Aug 2025, beta to paid tiers late 2025, GA for paid plans on 26 Aug 2026 (desktop Chrome only); acts without per-action approval, with a safety classifier checking each action; Anthropic calls prompt-injection risk "still non-zero". One source says GA was July 2026 (outlier). — [Gigazine, 27 Aug 2026](https://gigazine.net/gsc_news/en/20260827-claude-chrome-available/); [ClickForest explainer](https://www.clickforest.com/en/blog/claude-in-chrome-explained); conflicting date: [jwatte.com](https://jwatte.com/blog/claude-in-chrome-browser-extension/)

### Inferences
- Practical build checklist that follows from the above (all are things the Hu/man stack already does or can do cheaply): native semantic HTML first (`<button>`, `<a>`, `<form>`, `<label for>`), ARIA only where native HTML cannot express state; every form field has a visible, programmatic label and correct `type`/`autocomplete`; prices, opening hours, service durations and "next availability" written as text, not baked into images; stable, descriptive button text ("Book a skin fade", not "Click here"); no cookie walls, interstitial modals or chat pop-ups that cover the booking button; no CAPTCHA on the first step of a booking/quote form (put abuse protection server-side or use invisible/risk-based checks); deep-linkable booking and quote URLs so an agent (or AI Mode) can hand off straight to the right step.
- The WCAG 2.2 AA work this project already enforces with axe/Lighthouse doubles as agent-readiness. That is an honest, sellable point: "accessible to people and to AI assistants", without promising that any agent will choose the business.
- Reliability is still poor (Edge date error; prompt-injection warnings). Sites should design for an agent handing off to a human for confirmation and payment, not for full autonomy.
- Roselli's critique matters for the studio's quality bar: do not sprinkle ARIA "for bots". Correct native HTML is what serves both audiences.

### Gaps
- Could not read the OpenAI FAQ directly (403), so exact wording and date are unconfirmed.
- No primary Google Search Central document on agentic browsing was found; only Mueller's social post (via SEJ) and an unverified podcast mention.
- No official guidance found from Perplexity (Comet) on how it perceives pages.
- No primary data on how often agents are actually blocked by CAPTCHAs on small-business sites.

## 2. Agent identification and verification (not blocking legitimate agents)

### Takeaway
Agent traffic is moving to cryptographic identification via Web Bot Auth (HTTP Message Signatures, RFC 9421). OpenAI signs its agent's requests; Cloudflare validates "signed agents"; Vercel recognises ChatGPT's agent automatically. For a static site on a CDN, the action is mostly "don't turn on aggressive bot blocking that challenges these agents", not writing code.

### Cited Findings
- OpenAI's agent (now called "ChatGPT Work's Cloud browser" in the help article) signs outbound HTTP requests using Web Bot Auth / HTTP Message Signatures (RFC 9421), sending `Signature`, `Signature-Input` and `Signature-Agent` headers, with `Signature-Agent` pointing to chatgpt.com; public keys are published at chatgpt.com's `/.well-known/http-message-signatures-directory`. — [OpenAI: ChatGPT Work's Cloud browser allowlisting](https://help.openai.com/en/articles/11845367-chatgpt-works-cloud-browser-allowlisting) (403 to direct fetch; from search summary)
- Same article: Vercel recognises this traffic through its existing ChatGPT Agent entry (`chatgpt-operator`); other CDNs can verify manually; at launch the Cloud browser cannot sign in to websites or complete payments. — [OpenAI help article 11845367](https://help.openai.com/en/articles/11845367-chatgpt-works-cloud-browser-allowlisting) (search summary)
- Cloudflare's "signed agents" category covers agents directed by an end user (rather than a single company's crawler); their infrastructure signs requests with Web Bot Auth and Cloudflare validates the signatures. Agents must follow Cloudflare's signed-agents policy and can apply via the dashboard to join its bots and agents directory. The verified-bots programme continues alongside. — [Cloudflare blog: The age of agents: cryptographically recognizing agent traffic](https://blog.cloudflare.com/signed-agents/); [Cloudflare docs: Signed agents](https://developers.cloudflare.com/bots/concepts/bot/signed-agents)
- Cloudflare's Web Bot Auth reference: operators generate an Ed25519 signing key and publish it in a key directory; Cloudflare accepts valid Ed25519 keys found there. — [Cloudflare docs: Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth)
- Cloudflare's verified-bots docs state that from 1 July 2026 the verified-bot vs signed-agent distinction is expressed as a metadata field (direct vs intermediary access) rather than two separate categories. — [Cloudflare docs: Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/index.md) (from search summary)
- Third-party guides say the underlying IETF drafts had not been adopted as a single working-group document as of 2026, though major providers already deploy the scheme; Cloudflare and AWS WAF check signatures for site owners. — [guptadeepak.com: Verify an AI agent](https://guptadeepak.com/guides/verify-an-ai-agent/); [contextbolt: Web Bot Auth](https://contextbolt.com/blog/web-bot-auth/) (secondary)
- A third-party bot database lists a "Google-Gemini-CLI" user agent and itself warns that user-agent strings are identification signals, not proof. Not confirmed in Google docs. — [botcrawl: google-gemini-cli](https://botcrawl.com/bots/google-gemini-cli/) (UNVERIFIED)

### Inferences
- Browser-extension agents (Claude in Chrome, Atlas's in-browser agent, Comet) run inside the user's real browser, so they look like the user; they are not affected by robots.txt or bot rules in the same way. Cloud agents (ChatGPT's Cloud browser) are the ones a WAF might block, and those now sign requests.
- For the Hu/man stack (static Astro on a host/CDN, mailto/tel/WhatsApp contact, no forms yet): nothing to build. When a client site sits behind Cloudflare, keep "Bot Fight Mode"/"block AI bots" settings from challenging signed agents and verified bots, and test the booking path with an agent before launch.
- Distinguish in client advice: blocking AI *training* crawlers (GPTBot) is a content decision; blocking *agents acting for a customer* loses bookings. Most small businesses want the second allowed.

### Gaps
- Could not confirm whether Perplexity Comet, Google's agents or Microsoft's agents sign requests with Web Bot Auth.
- Exact Cloudflare blog post date not captured (believed 2025, not confirmed in results).

## 3. Emerging protocols: what each is, status, and relevance to a UK small business

### Takeaway
Of the many protocols, the ones that actually put bookings in front of AI today are the booking platforms' own integrations with Google (Reserve with Google / AI Mode partners). Commerce protocols (ACP, UCP, AP2, Visa/Mastercard agent payments) are aimed at retailers and payment providers, are partly US-only, and in OpenAI's case the flagship (Instant Checkout) was wound down in March 2026. WebMCP is an early preview; NLWeb and MCP servers are developer-grade and not worth building for a local barber or electrician yet.

### Cited Findings

**Model Context Protocol (MCP) and ChatGPT apps**
- OpenAI launched "apps in ChatGPT" and the Apps SDK (preview) at DevDay, 6 Oct 2025; the SDK is open source and built on MCP. Launch apps: Booking.com, Canva, Coursera, Expedia, Figma, Spotify, Zillow; DoorDash, OpenTable, Target and Uber announced as "coming in the following weeks". — [TechCrunch, 6 Oct 2025](https://techcrunch.com/2025/10/06/openai-launches-apps-inside-of-chatgpt/); [OpenAI: Introducing apps in ChatGPT](https://openai.com/ko-KR/index/introducing-apps-in-chatgpt/)

**Microsoft NLWeb** (DRAFT/open-source project)
- Announced at Microsoft Build, May 2025, led by R.V. Guha (creator of schema.org/RSS). Exposes an `/ask` endpoint that takes a natural-language question and returns schema.org-formatted JSON; each instance is also an MCP server. Ingests existing schema.org markup, RSS and sitemaps into a vector store. — [NLWeb README (GitHub mirror)](https://cdn.jsdelivr.net/gh/nlweb-ai/nlweb@main/README.md); [inblog glossary: NLWeb](https://inblog.ai/glossary/nlweb); [Opus Research, 28 May 2025](https://opusresearch.net/2025/05/28/talk-to-the-web-how-nlweb-opens-conversational-access-to-site-content/)
- No evidence found of NLWeb adoption by consumer agents in 2026.

**WebMCP** (PREVIEW)
- Chrome announced the WebMCP early preview on 10 Feb 2026: "available for prototyping to early preview program participants". Two APIs: a declarative API for standard actions defined directly in HTML forms, and an imperative JavaScript API for dynamic interactions. Lets browser agents act through structured tools instead of raw DOM actuation; examples include support tickets, ecommerce checkout and travel booking. — [Chrome for Developers: WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp)
- Exposed as `navigator.modelContext`; testable in Chrome 146 behind `chrome://flags/#enable-webmcp-testing`. Being developed with Microsoft through a W3C Community Group (not a W3C standard). The spec changed in March 2026 (`provideContext`/`clearContext` removed); tools are only discoverable on pages the agent has visited; security questions are open. — [DataCamp WebMCP tutorial](https://www.datacamp.com/tutorial/webmcp-tutorial); [Similarweb: WebMCP](https://aisearch.similarweb.com/blog/webmcp/); [Seoteric: WebMCP and Chrome 146](https://www.seoteric.com/webmcp-and-chrome-146-making-websites-agent-ready-what-seos-need-to-know/) (secondary)

**OpenAI Agentic Commerce Protocol (ACP) and Instant Checkout** (protocol: open spec; Instant Checkout: WOUND DOWN)
- Instant Checkout launched (Sept 2025) for US ChatGPT users buying from Etsy sellers, with 1M+ Shopify merchants announced to follow; multi-item carts and new markets were "planned". — [TravelDailyNews: ChatGPT launches Instant Checkout with ACP](https://www.traveldailynews.com/technology/chatgpt-launches-instant-checkout-with-the-agentic-commerce-protocol/)
- Checkout.com (London) announced ACP support for enterprise merchants in Nov 2025: support, not a UK consumer rollout. — [Checkout.com newsroom](https://www.checkout.com/newsroom/checkout-adopts-acp-backed-by-openai-to-power-agentic-commerce-for-enterprise-merchants)
- OpenAI wound down in-chat Instant Checkout in March 2026: CNBC reported on 20 March that OpenAI confirmed it was ending it in favour of retailer apps; OpenAI's 24 March post reportedly said the first version lacked the flexibility merchants wanted. Purchases now complete on the merchant's site or app. Reported adoption figures conflict (about 30 vs about 12 Shopify merchants live by Feb 2026); Walmart reportedly saw ChatGPT checkout convert at a third of its own site. — [Stellagent: OpenAI ends Instant Checkout](https://stellagent.ai/insights/openai-shopping-agent-strategy-pivot); [Digital Applied: Why AI checkout stalled](https://www.digitalapplied.com/blog/ai-agentic-commerce-discover-in-ai-buy-on-site-2026); [presenc.ai analysis](https://presenc.ai/research/chatgpt-instant-checkout-shutdown-analysis-2026) (all secondary; CNBC and OpenAI primaries not fetched)
- A UK commentary (July 2026) says the ACP protocol "continues" after the front-end change and that, "by industry accounts", an unnamed major UK sports retailer was the first UK retailer live on Stripe's agentic commerce suite. No primary sources cited. — [Manchester Digital / VE3, mid-2026 update](https://www.manchesterdigital.com/post/ve3/agentic-commerce-update-mid-2026-whats-actually-changed-and-what-it-means-for-retailers) (REPORTED, weak sourcing)

**Google Universal Commerce Protocol (UCP) and Agent Payments Protocol (AP2)** (open specs; reference implementation in AI Mode/Gemini)
- Google announced UCP at NRF on 11 Jan 2026 as an open-source standard for agentic commerce, co-developed with Shopify, Etsy, Wayfair, Target and Walmart, endorsed by 20+ partners (Visa, Mastercard, Stripe among them), with a first reference implementation for buying flows in AI Mode in Search and the Gemini app. It aligns with AP2. — [InfoQ, Jan 2026](https://www.infoq.com/news/2026/01/google-ucp); [IT Brief](https://itbrief.co.nz/story/google-unveils-open-ucp-standard-for-ai-driven-shopping)
- AP2 is Google's payments layer: W3C Verifiable Credentials used as signed "Intent", "Cart" and "Payment" mandates so an agent can buy within limits the user set. — [Manchester Digital / VE3](https://www.manchesterdigital.com/post/ve3/agentic-commerce-update-mid-2026-whats-actually-changed-and-what-it-means-for-retailers); [IT Brief](https://itbrief.co.nz/story/google-unveils-open-ucp-standard-for-ai-driven-shopping)
- Shopify reportedly made UCP "effectively self-serve" (no approval gate). Google "Universal Cart" (reported as an I/O 2026 announcement) is said to be rolling out with the UK among markets to follow. — [Manchester Digital / VE3](https://www.manchesterdigital.com/post/ve3/agentic-commerce-update-mid-2026-whats-actually-changed-and-what-it-means-for-retailers); [AI Weekly](https://aiweekly.co/alerts/google-universal-cart-unifies-shopping-across-search-youtube-gmail) (REPORTED)

**Visa Intelligent Commerce and Mastercard Agent Pay** (pilots)
- Visa announced "Visa Agentic Ready" on 17 March 2026, built on Visa Intelligent Commerce; first phase targets card issuers testing agent-initiated transactions with selected merchants in controlled production; Europe/UK launch press release on visa.co.uk; expanded to Asia Pacific and Latin America on 29 April 2026. Visa Intelligent Commerce Connect (9 April 2026) is in pilot with select partners (AWS and payments firms). — [Visa UK: Agentic Ready programme for Europe](https://www.visa.co.uk/about-visa/newsroom/press-releases.3437886.html); [Visa: global expansion](https://corporate.visa.com/en/sites/visa-perspectives/newsroom/visa-agentic-ready-program-expands-globally.html)
- Mastercard Agent Pay (introduced 2025) uses "Agentic Tokens" built on its tokenisation; no confirmed 2026 UK merchant rollout found. — [Central Florida Lifestyle summary](https://www.centralfloridalifestyle.com/?p=67120) (secondary)

**Google agentic booking in AI Mode** (SHIPPED in places; see section 4)
- Original announcement (Aug 2025): restaurant reservations first, with local service appointments and event tickets to follow; AI Mode searches multiple reservation platforms and links the user to the booking page to finish. — [Google blog: AI Mode gets new agentic features](https://blog.google/products/search/ai-mode-agentic-personalized/)

### Inferences
- For a UK barber, salon, physio, electrician or takeaway in late 2026, none of ACP, UCP, AP2, Visa/Mastercard agent payments, NLWeb or WebMCP requires action from the business or its web studio. They are retailer/platform/payment-provider plumbing, and they come "for free" if the business uses Shopify, Stripe or a booking platform that adopts them.
- "Discover in AI, transact on site" is the 2026 reality (OpenAI's own retreat confirms it). This argues for fast, clear, accessible booking and checkout pages on the business's site or its booking provider, which is the studio's core offer anyway.
- WebMCP is the only protocol that a web studio would itself build into a site (it annotates forms). Worth a prototype on the studio's own site once it leaves early preview, because the declarative form API maps neatly onto a well-labelled quote/booking form. Not worth selling to clients yet: unstable spec, Chrome-only, behind a flag.
- A custom MCP server or ChatGPT app for a single local business is over-engineering at this stage; the agent platforms integrate with booking aggregators, not individual shops.
- Honesty rule applies: the studio must not claim client sites "work with ChatGPT checkout" or "are bookable by AI" unless a specific integration has been tested.

### Gaps
- Did not fetch OpenAI's ACP spec (agenticcommerce.dev) or the March 2026 OpenAI post directly; the wind-down details are from secondary sources that partly disagree.
- No primary confirmation of Google Universal Cart's UK date.
- Perplexity's commerce features (e.g., PayPal/"Buy with Pro") not researched in this pass.
- No data found on whether NLWeb has any 2026 production adopters among consumer agents.

## 4. Google agentic booking: which platforms are integrated, especially UK

### Takeaway
UK agentic restaurant booking in AI Mode went live on 10 April 2026 via eight partner platforms including ResDiary, OpenTable, TheFork, SevenRooms and Dojo. Beauty/wellness appointment booking via Booksy, Fresha and Vagaro is confirmed for the US (Search Labs, Nov 2025); I found no confirmation it is live in the UK. In both cases the business is reachable only if it uses a partner booking platform. Reserve with Google (the "Book" button on the Business Profile) is the long-standing route, and Fresha, Treatwell and ResDiary are listed partners.

### Cited Findings
- UK launch: Google's UK blog announced agentic restaurant booking in AI Mode across the UK on 10 April 2026. Users describe what they want (e.g., dog-friendly Italian in Shoreditch for two at 7pm Saturday); AI Mode checks real-time availability across platforms and returns a shortlist with links to finish booking. Partners named: TheFork, SevenRooms, ResDiary, Mozrest, Foodhub, Dojo, DesignMyNight and OpenTable (Verdict's list omits OpenTable). Google cites a 140% rise in searches for "when to book a table". — [Google UK blog: Booking restaurants in the UK just got easier](https://blog.google/company-news/inside-google/around-the-globe/google-europe/united-kingdom/ai-mode-restaurants-uk/); [ResultSense, 10 Apr 2026](https://www.resultsense.com/news/2026-04-10-google-ai-mode-restaurant-booking-uk); [PPC Land](https://ppc.land/googles-ai-mode-now-books-uk-restaurants-meet-the-8-partner-platforms/); [Verdict Foodservice](https://www.verdictfoodservice.com/newsletters/google-adds-agentic-restaurant)
- Completion: Google says users finish through partner links; one trade outlet claims the AI handles the whole booking. Google's account is more reliable. — [Google UK blog](https://blog.google/company-news/inside-google/around-the-globe/google-europe/united-kingdom/ai-mode-restaurants-uk/); contradicted by [Restaurant Technology News](https://restauranttechnologynews.com/2026/04/google-introduces-ai-powered-restaurant-booking-as-search-evolves-into-action/)
- US history: restaurant reservations first limited to AI Ultra subscribers ($250/month) via Labs (Aug 2025); Nov 2025 expansion added event tickets and beauty/wellness appointments for US English-language Labs users aged 18+, starting with AI Pro and Ultra subscribers; hand-off to partner pages to confirm and pay. Partners across the US features include OpenTable, Resy, Tock, Ticketmaster, StubHub, SeatGeek, Vivid Seats, Booksy, Fresha and Vagaro. Sources disagree on when Fresha and Vagaro joined. — [YourStory](https://yourstory.com/ai-story/googles-ai-mode-adds-agentic-booking-for-tickets); [CO/AI](https://getcoai.com/news/googles-ai-mode-now-books-restaurants-for-250-month-subscribers/); [9to5Google, 17 Nov 2025](https://9to5google.com/2025/11/17/google-ai-mode-travel/)
- Booksy (20 Nov 2025) says AI Mode reads live availability from the provider's Booksy calendar and books into it; providers must keep services/calendar updated and connect Booksy to their Google profile; no extra fee or commission for AI Mode bookings. Country coverage not stated. — [Booksy: Google AI Mode integration](https://biz.booksy.com/blog/booksy-google-ai-mode-integration)
- A marketing blog claims Google announced expanded beauty booking (including AI calling businesses) at I/O 2026. Not corroborated. — [findskill.ai](https://findskill.ai/blog/google-ai-books-your-salon-appointment-2026/) (UNVERIFIED)
- Reserve with Google: Google's partner list includes ResDiary, Treatwell and Fresha. Treatwell UK describes a "Book" button on the Google Business Profile for bookings from Search and Maps. Fresha requires the business name and address to match the Google Business Profile exactly and the Fresha profile to be listed on the Fresha Marketplace; it can take up to 48 hours to appear. — [Reserve with Google partners](https://www.google.com/maps/reserve/partners); [Treatwell UK partners](https://www.treatwell.co.uk/partners?p=6126); [Fresha help: Get booked on Reserve with Google](https://www.fresha.com/help-center/knowledge-base/online-presence/179-get-booked-on-reserve-with-google)

### Inferences
- Strongest practical lever for the studio's target sectors: recommend (or connect clients to) a booking provider that is already a Google partner. For takeaways and restaurants in the UK: ResDiary, OpenTable, TheFork, SevenRooms, Dojo, Foodhub, DesignMyNight, Mozrest (AI Mode partners as of Apr 2026). For barbers, salons and some wellness: Fresha, Treatwell or Booksy (Reserve with Google partners; Booksy/Fresha are also US AI Mode partners, so likely first in line if UK appointment booking arrives, but that is a prediction).
- For electricians and builders there is no equivalent agentic booking partner; the agent-ready move is a clear, accessible quote-request form/page with a stable URL and text pricing ("from £X").
- This fits Hu/man's Growth package ("online booking or ordering") without inventing new prices: a decision on booking provider is a scoping item.
- The studio should also not over-claim to clients: being on a partner platform makes a business *eligible* to appear in AI Mode booking; it does not guarantee selection (hard rule 3).

### Gaps
- No confirmation of whether AI Mode beauty/wellness booking (Booksy, Fresha, Vagaro) or event tickets are live in the UK as of Oct 2026.
- Treatwell and Booksy UK status in AI Mode not found.
- No uptake or conversion data for UK AI Mode bookings.
- Reserve with Google partner list page is undated; current 2026 completeness not verified.

## 5. schema.org potentialAction and Reserve with Google: still relevant? And realistic now-vs-later stack

### Takeaway
No source found in this pass shows any 2025-2026 agent (OpenAI, Google, Anthropic, Microsoft, Perplexity) consuming schema.org `potentialAction` (ReserveAction, OrderAction, ScheduleAction) to complete bookings. Google's booking agents work through partner platform integrations (Reserve with Google / AI Mode partners), not page markup. Structured data still helps agents and search understand the business (LocalBusiness, opening hours, offers), and NLWeb consumes schema.org, so it remains worth doing for description, not for action.

### Cited Findings
- Google's agentic booking is described entirely in terms of partner platforms that hold real-time availability, with links back to the partner's booking page. — [Google blog, Aug 2025](https://blog.google/products/search/ai-mode-agentic-personalized/); [Google UK blog, Apr 2026](https://blog.google/company-news/inside-google/around-the-globe/google-europe/united-kingdom/ai-mode-restaurants-uk/)
- Reserve with Google bookings require integration through a listed partner and matching Business Profile details (Fresha example). — [Fresha help](https://www.fresha.com/help-center/knowledge-base/online-presence/179-get-booked-on-reserve-with-google)
- NLWeb uses existing schema.org markup, RSS and sitemaps as its data source and returns schema.org JSON. — [NLWeb README](https://cdn.jsdelivr.net/gh/nlweb-ai/nlweb@main/README.md)
- WebMCP's declarative API defines agent actions directly on HTML forms, which is the closest current equivalent to "markup that declares an action". — [Chrome for Developers: WebMCP early preview](https://developer.chrome.com/blog/webmcp-epp)

### Inferences
Realistic small-business stack, by timeframe (inference from all sections above):
- **Now (build into every client site):**
  1. Accessible, semantic HTML; labelled forms; text prices ("from £X"), hours, service durations and areas in HTML; no CAPTCHA/modal on first booking or quote step; descriptive, stable buttons.
  2. Use a booking provider already integrated with Google (Reserve with Google; AI Mode partner where available) and link to it with deep links per service; for restaurants/takeaways pick a UK AI Mode partner.
  3. Keep Google Business Profile accurate and matching the booking platform (name/address exact match).
  4. LocalBusiness/ProfessionalService JSON-LD that matches visible content (already the studio's practice); add `potentialAction` only as harmless description, not as a selling point.
  5. Hosted checkout (Stripe/Square/SumUp) for payments: these providers are the ones adopting ACP/UCP/agentic payment rails, so clients inherit future support without custom work.
  6. CDN/WAF settings that let signed agents and verified bots through; separate decision on training crawlers.
  7. Test the booking/quote path end-to-end with at least one real agent (e.g., ChatGPT agent, Claude in Chrome, Comet) before launch and record the result honestly.
- **Later (watch, prototype on the studio's own site first):** WebMCP declarative form annotations once it leaves early preview and has more than one browser; UCP/ACP only if a client sells physical products via Shopify/Stripe (comes through the platform); Visa/Mastercard agent payments arrive through the payment provider, no site work.
- **Skip for now:** custom MCP server or ChatGPT app per local business; NLWeb deployment; any marketing claim of "AI checkout".

### Gaps
- Did not find an explicit Google statement deprecating or endorsing schema.org `potentialAction` for booking in 2025-2026; the conclusion above is an absence-of-evidence inference.
- No source checked on whether Perplexity Comet or Atlas read JSON-LD when acting on a page.
