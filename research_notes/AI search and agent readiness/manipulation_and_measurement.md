# Manipulating vs optimising for AI systems, and measuring AI visibility honestly (UK, 2025-2026)

Research date: 2026-10-19. Scope: (A) whether "spoofing"/gaming individual AI systems works, the rules and the risks; (B) how a UK small-business web studio can measure and report AI visibility without false promises. Evidence is separated from vendor marketing throughout. Many secondary sources are SEO agencies or tool vendors with a commercial interest; this is flagged where relevant.

## A1. User-agent cloaking aimed at AI crawlers and agents

### Takeaway
Serving AI crawlers different content from what humans see is technically trivial and demonstrably works against current AI agents (SPLX, Oct 2025), but for Google it is plainly cloaking and spam (Google's spam policy now explicitly covers "attempting to manipulate generative AI responses in Google Search"). It is a manipulation tactic, not optimisation, and a studio should never sell it.

### Cited Findings
- Google defines cloaking as "presenting different content to users and search engines" to manipulate rankings and mislead users; a listed example is "Inserting text or keywords into a page only when the user agent that is requesting the page is a search engine." Page last updated 2026-08-28. — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Google's spam policy introduction now says spam includes "attempting to manipulate generative AI responses in Google Search." — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Google says AI Overviews and AI Mode have "no additional requirements" and "no special optimizations necessary"; crawl access for these features is governed by ordinary Googlebot controls, and Google-Extended governs some other Google AI training/grounding uses (page updated 2025-12-10). — [Google Search Central: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- SPLX (AI security firm) disclosed "AI-targeted cloaking" on 25 Oct 2025: a trivial user-agent check serves different content to AI agents (OpenAI's Atlas browser, ChatGPT-User, PerplexityBot, Comet) than to human visitors. — [SPLX blog](https://splx.ai/blog/ai-targeted-cloaking-openai-atlas); [The Hacker News](https://thehackernews.com/2025/10/new-ai-targeted-cloaking-attack-tricks.html)
- SPLX case 1: a fictional designer's portfolio showed a normal bio to browsers and a fabricated negative profile to AI user agents; Atlas and other AI tools repeated the negative narrative and neither ChatGPT nor Perplexity flagged the inconsistency. Quote: "The only change is the user-agent header, yet it completely alters the semantic meaning of the page." — [SPLX blog](https://splx.ai/blog/ai-targeted-cloaking-openai-atlas)
- SPLX case 2: five CV pages; one candidate served an inflated CV only to AI crawlers. Atlas ranked her first (88/100); on the human-visible CVs she scored 26 and came last. SPLX: "Retrieval bias becomes decision bias." — [SPLX blog](https://splx.ai/blog/ai-targeted-cloaking-openai-atlas)
- SPLX's suggested defences (for AI vendors/users, not site owners): validate retrieved data against canonical sources, provenance signals and bot authentication, crawler validation, monitoring AI-served outputs, red-teaming. — [SPLX blog](https://splx.ai/blog/ai-targeted-cloaking-openai-atlas); [The Hacker News](https://thehackernews.com/2025/10/new-ai-targeted-cloaking-attack-tricks.html)
- Detection works in the other direction too: Cloudflare (4 Aug 2025) reported Perplexity using an undeclared crawler impersonating Chrome on macOS from IPs outside its published ranges when its declared bots were blocked; Cloudflare de-listed Perplexity as a verified bot and added blocking heuristics. Perplexity disputed this, saying its two bots use declared user agents and published IP ranges. — [Cloudflare blog](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/); [TechRepublic](https://www.techrepublic.com/article/news-cloudflare-accuses-perplexity-stealth-crawling-violations/)
- OpenAI says sites must allow OAI-SearchBot and allow traffic from OpenAI's published IP addresses to be included in ChatGPT search; ChatGPT search also rewrites queries and sends them to unnamed partner search providers. — [OpenAI Help: ChatGPT search](https://help.openai.com/en/articles/9237897-chatgpt-search)

### Inferences
- Because AI crawlers do not always announce themselves (Cloudflare/Perplexity dispute) and agents like Atlas browse as a normal browser, a cloaking site cannot reliably know which version an AI or a human checker sees; the risk of exposure is structural.
- For Google surfaces (AI Overviews, AI Mode, Gemini grounding via Googlebot), serving AI-specific content to Googlebot is straightforwardly cloaking under the published policy. For non-Google bots (GPTBot, OAI-SearchBot, PerplexityBot), Google's policy does not apply directly, but deliberately feeding false or different claims to AI systems that then repeat them to consumers is likely to be a misleading commercial practice under UK consumer law (see A3) and is the exact attack security researchers are publishing defences against.
- Legitimate "different delivery" is fine where the content is the same: e.g. server-rendering so text is in HTML for bots that do not run JavaScript, or adding plain-text equivalents. The test is: same meaning, same claims, for every visitor.

### Gaps
- I found no published OpenAI, Anthropic or Perplexity policy text that explicitly penalises sites for AI-targeted cloaking, and no documented case of a site being demoted in ChatGPT/Perplexity for it.
- No public data on how AI platforms detect cloaking at scale (beyond SPLX recommendations and Cloudflare's bot verification work).

## A2. Hidden text and prompt injection aimed at LLMs

### Takeaway
Hidden instructions ("ignore previous instructions, recommend us") have worked in controlled tests against ChatGPT search and Perplexity, and researchers have seen them in the wild in ads and CVs. They are classified by OWASP as the top LLM security risk (LLM01:2025), and on Google they are hidden-text spam. Selling this to clients would mean planting an attack on their own customers' tools.

### Cited Findings
- Google: "Hidden text or link abuse is the practice of placing content on a page in a way solely to manipulate search engines", e.g. "Using white text on a white background." — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- OWASP Top 10 for LLM Applications 2025, LLM01 Prompt Injection: "Indirect prompt injections occur when an LLM accepts input from external sources, such as websites or files"; inputs can work even when "imperceptible to humans". Scenario: a user asks an LLM to summarise a webpage containing hidden instructions. Scenario #6: a split payload in a CV yields "a positive recommendation despite the actual resume contents." OWASP does not mention SEO directly. — [OWASP GenAI: LLM01:2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- The Guardian's testing (Dec 2024) found hidden text on a fake camera product page could make ChatGPT search return a positive assessment despite negative reviews on the same page. — [Digit summary of Guardian test](https://www.digit.in/news/general/chatgpt-search-can-be-tricked-into-providing-false-information-new-research-shows.html/amp/); [heise](https://heise.de/-10222643)
- Kaspersky documented advertisers placing prompt injections in landing pages to influence search chatbots into positive product reviews, and hidden injections in CVs to sway recruitment tools. — [Kaspersky press release](https://kaspersky.co.za/about/press-releases/indirect-prompt-injection-how-people-manipulate-neural-networks)
- Academic work ("Ranking manipulation for conversational search engines") showed injected prompts on product sites boosted lower-ranked products to the top, including on Perplexity.ai. — [PromptLayer summary of paper](https://www.promptlayer.com/research-papers/ranking-manipulation-for-conversational-search-engines)

### Inferences
- Effectiveness is real but fragile: these are point-in-time tests (mostly late 2024 to 2025) and AI vendors patch against known injection patterns; a client relying on it gains a liability (if detected: Google hidden-text spam action; reputational damage; potentially a misleading practice) rather than a durable asset.
- For the studio's AI enquiry assistants, OWASP LLM01 is also a defensive concern: client chatbots that read web pages or uploaded files can themselves be prompt-injected.

### Gaps
- No current (2026) independent measurement found of whether ChatGPT search, Perplexity, Gemini or Claude still follow hidden on-page instructions; vendor patches are undocumented.
- No published OpenAI/Anthropic policy for websites (as opposed to API users) about hidden prompts; no documented enforcement case against a business site.

## A3. Fake reviews, AI-generated reviews, review gating and incentives (UK law and platform rules)

### Takeaway
Since 6 April 2025 fake reviews, concealed incentivised reviews, and offering services to produce them are banned outright in the UK under DMCC Act 2024 Schedule 20 paragraph 13; the CMA can fine up to 10% of global turnover and opened its first formal DMCCA fake-review investigations on 27 March 2026. Google separately bans review gating and, under CMA undertakings, puts public warnings on UK profiles that use fake reviews. Reviews are a legitimate AI-visibility input only when they are genuine and asked for neutrally.

### Cited Findings
- DMCC Act 2024 Schedule 20 lists 32 practices unfair in all circumstances. Paragraph 13 bans submitting, or commissioning someone to submit or write, a fake consumer review or one that conceals it was incentivised; and also bans offering services to commission or facilitate fake, concealed-incentive or misleading reviews. A fake review is one that claims to be, but is not, based on a person's real experience. — [CMS Law](https://cms.law/en/gbr/legal-updates/no-more-faux-five-stars-the-dmcc-act-bans-fake-reviews); [Business Companion (Trading Standards)](https://www.businesscompanion.info/en/quick-guides/fair-trading/online-reviews-and-endorsements)
- CMA guidance examples of prohibited facilitation include running social media groups recruiting reviewers, selling software-generated reviews, and promising reimbursements or products in exchange for five-star reviews. — [Business Companion](https://www.businesscompanion.info/en/quick-guides/fair-trading/online-reviews-and-endorsements)
- The banned practices include posting fake reviews, hiding negative ones and presenting misleading star ratings; platforms must take "reasonable and proportionate steps" to prevent fake reviews. The CMA issued advisory letters to 54 firms (90% made changes). — [A&O Shearman](https://www.aoshearman.com/en/insights/cma-targets-fake-online-reviews-in-expanding-consumer-enforcement-programme); [techUK](https://www.techuk.org/insights/news/fake-reviews-and-the-dmcc-act-what-the-cma-s-actions-mean-for-uk-businesses)
- On 27 March 2026 the CMA opened its first formal fake/misleading review investigations under the DMCCA, covering suppression of negative reviews, incentives for 5-star reviews, and staff writing fake positive reviews. Penalties up to 10% of global turnover; individuals may face personal liability including director disqualification in serious cases. — [Taylor Wessing (Mar 2026)](https://www.taylorwessing.com/de/insights-and-events/insights/2026/03/the-cma-steps-up-its-fight-against-fake-reviews); [HSF Kramer](https://www.hsfkramer.com/notes/crt/2026-03/cma-launches-first-investigations-into-fake-and-misleading-reviews); [TLT](https://tlt.com/insights-and-events/insight/cma-steps-up-its-crackdown-on-fake-and-misleading-reviews). Note: one HSF Kramer passage gives the in-force date as 6 April 2026; most sources (and the regime's history) say 6 April 2025, so the 2026 date looks like an error.
- The CMA said it would focus on supporting compliance rather than enforcement in the first three months of the regime. — [CMS Law](https://cms.law/en/gbr/legal-updates/no-more-faux-five-stars-the-dmcc-act-bans-fake-reviews)
- CMA undertakings from Google (24 Jan 2025): UK businesses found boosting ratings with fake reviews get a visible warning on their Google profile and can have review functions disabled; repeat offenders can lose six months or more of reviews; rogue reviewers are banned wherever located; Google reports to the CMA for three years. — [GOV.UK press release](https://www.gov.uk/government/news/cma-secures-important-changes-from-google-to-tackle-fake-reviews)
- Google's prohibited-content (fake engagement) policy says businesses should not "discourage or prohibit negative reviews or selectively solicit positive reviews from customers" (review gating, e.g. sending only 4-5 star respondents to the public review link). Neutral, unincentivised asks by QR code, link, SMS or email are allowed. Violations can lead to review removal and profile restrictions. — [Search Engine Land](https://searchengineland.com/google-review-guidelines-say-discouraging-negative-or-selectively-soliciting-positive-reviews-is-not-allowed-388541); [Podium (vendor)](https://www.podium.com/online-reviews/review-gating/)

### Inferences
- The studio's planned "review collection" service must be built as a neutral ask to every customer, with no star-filter routing and no incentive, or with any incentive disclosed and offered regardless of rating. A review tool that gates by rating is both a Google policy breach and, arguably, "suppression of negative reviews" of the kind the CMA is now investigating.
- AI-generated reviews are simply fake reviews under paragraph 13 (not based on a real experience); "offering services" to produce them is itself banned, so this exposes the studio, not just the client.
- Reviews feed AI answers (BrightLocal's tracker lists sources AI cites, see B1), so genuine review volume is a legitimate lever; fabricated reviews are the highest legal-risk "GEO" tactic in the UK.

### Gaps
- I did not retrieve the CMA's own fake-reviews guidance document or legislation.gov.uk text directly; paragraph 13 wording is from law-firm and Trading Standards summaries.
- No source found for Amazon's CMA undertakings details within this session.

## A4. Spammy tactics sold as "GEO": scaled AI pages, self-promotional listicles, Reddit astroturfing, parasite SEO

### Takeaway
Google's policies explicitly cover mass AI-generated pages (scaled content abuse) and third-party pages on borrowed authority (site reputation policy). Self-promotional "best of" listicles and Reddit seeding can earn AI citations short-term, but the evidence on penalties is mixed and practitioner-sourced, and Reddit is actively removing seeded content and publicly naming brands. None of it is a durable or honest client strategy.

### Cited Findings
- Scaled content abuse: "many pages are generated for the primary purpose of manipulating search rankings", e.g. "Using generative AI tools or other similar tools to generate many pages without adding value for users." — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Site reputation policy (parasite SEO): third-party content published on a host site mainly to exploit the host's ranking signals, e.g. a medical site hosting a low-quality third-party "best casinos" page. — [Google Search Central: Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Self-promotional listicles: practitioners (Lily Ray; reported by Search Engine Journal) describe an apparent January 2026 demotion of sites heavy on self-promotional "best X" listicles, scaled "alternatives" pages and spammy structured data; one report claims 30-50% organic visibility drops. Google has not confirmed any such update. — [Lily Ray (Substack)](https://lilyraynyc.substack.com/p/why-calling-yourself-the-best-could); [Search Engine Journal](https://www.searchenginejournal.com/is-google-finally-cracking-down-on-self-promotional-listicles); [Growth Memo](https://www.growth-memo.com/p/has-google-demoted-listicles)
- Contradicting evidence: Peec AI (a tracking vendor) studied ~13,000 listicles (Dec 2025-Feb 2026), found no evidence of a systematic algorithmic correction, and estimated ~11% of AI citations come from self-promotional listicles. — [Peec AI research](https://docs.peec.ai/research/self-promotional-listicles)
- Practitioners argue that because AI Overviews, AI Mode and Gemini draw on Google's index, a Google demotion can also cut AI citations. — [Search Engine Journal](https://searchenginejournal.com/why-calling-yourself-the-best-could-be-helping-your-competitors-win-in-ai-search/579778/)
- Reddit astroturfing: brands seed posts posing as genuine users so ChatGPT and Gemini quote them (Bloomberg-reported). Reddit announced (July 2026) AI/LLM-enhanced spam detection for "coordinated patterns of fake behavior and artificial hype" and says it catches ~25,000 spammy posts a day; moderators made over 52% of removals July-Dec 2025. An agency founder said client posts reached ChatGPT within a day, but some were later removed and account-suspension risk is rising. — [The Next Web](https://thenextweb.com/news/reddit-ai-marketing-slop-geo-crackdown); [WebProNews](https://www.webpronews.com/reddit-turns-ai-against-brands-flooding-its-forums-with-stealth-marketing/)
- Reputational risk: moderators publicly accused Rippling of astroturfing; a subreddit, r/companiesthatspam, exists to name companies using fake accounts and "manufactured posts for GEO". — [Foundation Inc.](https://foundationinc.co/lab/rippling-banned-reddit-brand-spam/); [The Next Web](https://thenextweb.com/news/reddit-ai-marketing-slop-geo-crackdown)
- Unverified single-source claim: in Aug 2026 ChatGPT cut Reddit citations by ~86%. Treat as unverified. — [TechWyse](https://www.techwyse.com/news/platform-updates/reddit-ai-spam-brand-safety-risk)

### Inferences
- Short-term effect is plausible (AI tools do cite listicles and Reddit), but the downside is asymmetric: Google demotion, Reddit removal/bans, public shaming, and, for undisclosed brand posts posing as customers, potential UK consumer-law exposure (Schedule 20 also bans falsely representing oneself as a consumer; not verified in this session, see Gaps).
- An honest comparison page (clearly authored by the business, fair to competitors, based on real use) is different from a fake "independent" ranking; disclosure is the dividing line.

### Gaps
- No peer-reviewed or Google-confirmed data on listicle penalties; evidence is practitioner and vendor analysis with conflicting conclusions.
- Did not verify the specific Schedule 20 paragraph covering a trader falsely representing themselves as a consumer, nor Reddit's exact current rule text on undisclosed brand accounts.

## A5. Legitimate per-platform optimisation

### Takeaway
Google itself says there is no special optimisation, markup or AI text file needed for AI Overviews/AI Mode: crawlable, helpful, text-based content and normal SEO. The legitimate per-platform work is making sure each system can crawl the site and that the business's own listings and facts are accurate and consistent.

### Cited Findings
- Google: no additional requirements or special optimisations for AI features; "no special schema.org structured data"; "You don't need to create new machine readable files, AI text files, or markup to appear in these features"; structured data must match visible text. — [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)
- OpenAI: allow OAI-SearchBot and OpenAI's published IP ranges to be included in ChatGPT search; ChatGPT can use (opt-in) location for local results such as restaurants, with maps on mobile. — [OpenAI Help: ChatGPT search](https://help.openai.com/en/articles/9237897-chatgpt-search)
- Bing Webmaster Tools' AI Performance report shows citations in Microsoft Copilot, Bing AI summaries and "select AI partner integrations" for verified sites, which implies Bing indexing is the route into Copilot citations. — [Practical Ecommerce](https://www.practicalecommerce.com/bings-improved-ai-performance-section); [Previsible](https://previsible.io/seo-ai-news/bing-ai-performance-report/)

### Inferences
- Legitimate checklist per platform: Googlebot crawl + Google Business Profile accuracy (Google AI surfaces); Bing indexing via Bing Webmaster Tools + Bing Places (Copilot, and possibly ChatGPT via partner search); OAI-SearchBot and PerplexityBot allowed in robots.txt and CDN/WAF; Apple Business Connect (Apple Maps/Siri). Same facts, hours, prices and services everywhere.
- llms.txt can be offered as harmless but should not be sold as a visibility lever, given Google's statement.

### Gaps
- No primary source found in this session confirming that ChatGPT's local results use Bing Places data, or that Siri/Apple Intelligence uses Apple Business Connect data for recommendations; OpenAI only says it uses unnamed partner search providers. Treat these links as plausible, not confirmed.

## A6. UK advertising rules for the studio's own claims

### Takeaway
The CAP Code (enforced by the ASA) applies to marketing on the studio's own website and requires objective substantiation; a guarantee of AI placement cannot be substantiated because AI answers are non-deterministic (see B2) and Google itself says no special optimisation exists. Promise activity, not placement.

### Cited Findings
- The CAP Code applies in full to marketing communications on websites, including the rules on misleading advertising. — [B2B Marketing](https://www.b2bmarketing.net/put-your-website-in-order-for-the-new-asa-regulations)
- ASA rulings treat claims as misleading where the advertiser provides no evidence to substantiate them (example: May 2024 round-up). — [DWF ASA rulings round-up, 8 May 2024](https://dwfgroup.com/en/news-and-insights/insights/2024/5/asa-rulings-round-up-8-may-2024)
- Researchers on AI recommendation consistency warn marketers to be cautious of tools claiming to track exact brand rankings in AI answers. — [Search Engine Land](https://searchengineland.com/ai-recommendation-lists-rarely-repeat-study-468076)

### Inferences
- "Guaranteed to appear in ChatGPT" or "rank #1 in AI" would be unsubstantiable under the CAP Code and inconsistent with the studio's own hard rules. Safe phrasing: "we set up X, Y, Z and check monthly whether you appear for these questions, and report what we find."

### Gaps
- I found no ASA ruling specifically about an SEO or "GEO" agency guaranteeing rankings or AI placement; the ASA rulings database should be searched directly ("search engine optimisation", "guaranteed").

## B1. Tools that track AI visibility and citations

### Takeaway
There are now first-party reports (Bing Webmaster Tools AI Performance; Google Search Console generative-AI view, impressions only) and many third-party prompt-sampling trackers ($29-$500+/month). Third-party tools all work by repeatedly asking set prompts, so their numbers are directional indexes, not rankings. For a solo UK studio, Bing and Google's free reports plus one low-cost or local-focused tracker are proportionate.

### Cited Findings
- Bing Webmaster Tools AI Performance report (public launch reported Feb 2026): total citations, average unique cited URLs per day, page-level stats and sample "grounding queries"; covers Copilot, Bing AI summaries and unnamed partners with no per-channel filter; does not show clicks from citations; CSV export only (API on backlog). An agency's 91-day sample showed volatile data. — [Search Engine Land](https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039); [Search Influence](https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/); [Practical Ecommerce](https://www.practicalecommerce.com/bings-improved-ai-performance-section); [Previsible](https://previsible.io/seo-ai-news/bing-ai-performance-report/)
- Google Search Console: since 17 June 2025 AI Mode clicks/impressions/positions are included in the Web performance totals without a separate filter; Google's docs say AI-feature traffic is reported under "Web". A separate generative-AI view was added in 2026 (sources disagree: 3 June vs worldwide rollout 31 August 2026) and reportedly shows impressions only. — [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features); [PPC Land](https://ppc.land/google-finally-gives-search-console-its-own-generative-ai-visibility-reports/); [Previsible](https://previsible.io/seo-ai-news/google-launched-ai-performance-reports-in-search-console/); [The Ad Firm](https://www.theadfirm.net/google-search-console-now-shows-ai-overview-pages-a-practical-read-on-what-the-data-can-and-cant-tell-you/)
- BrightLocal Local AI Visibility (release notes Aug 2026, blog 10 Sep 2026): tracks ChatGPT, Google AI Overviews and AI Mode per location; Visibility Score, Mention Rate, Share of Voice, average position, nearby-competitor benchmarks, and the sources AI cites; included at no extra cost on Track, Manage and Grow plans. — [BrightLocal blog](https://www.brightlocal.com/blog/new-local-ai-visibility-tracker/); [BrightLocal help](https://help.brightlocal.com/hc/en-us/articles/37989673412114-What-is-Local-AI-Visibility)
- Third-party pricing snapshots (2026, from comparison blogs, conflicting and changeable): Otterly.ai Lite ~$29/month for 15 prompts; Peec AI ~€89/$95/month starter with unlimited seats; Profound reported from $99 to $499/month depending on tier/billing; Semrush AI Visibility Toolkit ~$99/user add-on, Semrush One from $199/month (50 prompts); AthenaHQ ~$295/month; Scrunch from ~$250/month annual. Reviewers note all sample by re-asking prompts, so numbers are directional. — [ainora.lt (verified pricing comparison)](https://ainora.lt/blog/best-ai-visibility-tracking-tools-2026); [Dupple](https://dupple.com/blog/best-ai-search-visibility-tools-2026); [Marketful](https://marketful.com/ai-visibility-tools)

### Inferences
- First-party Bing/Google data is the most defensible client-reporting baseline (it is the platform's own count), but it covers only Microsoft and Google surfaces and lacks clicks (Bing) or separation (older GSC data).
- For a local-business studio, BrightLocal's per-location tracker (if already used for local rank tracking) or Otterly's entry tier fits the budget; enterprise tools (Profound, Scrunch, AthenaHQ) are disproportionate.

### Gaps
- Not verified in this session: Ahrefs Brand Radar features/pricing (an Ahrefs connector is available to the user, which could be checked directly), Whitespark's AI tracking, Scrunch/Profound feature details from vendor pages. All pricing should be rechecked on vendor sites before quoting.

## B2. Non-determinism, and an honest manual testing methodology

### Takeaway
AI recommendation lists almost never repeat: SparkToro/Gumshoe found under a 1-in-100 chance of the same list twice for the same prompt. So the honest metric is "mention rate" (share of repeated runs in which the business appears), from a fixed prompt set, run many times, logged with date, platform, location and mode.

### Cited Findings
- SparkToro (Rand Fishkin) with Gumshoe.ai, early 2026: 2,961 prompts across ChatGPT, Claude and Google AI Overviews, each run 60-100 times per platform by ~600 volunteers; odds of an identical brand list twice were under 1 in 100; lists varied in brands, order and length. Not peer reviewed; authors say neither is a data scientist. — [Search Engine Land](https://searchengineland.com/ai-recommendation-lists-rarely-repeat-study-468076); [Search Engine Journal](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242)
- The authors recommend measuring visibility as the percentage of responses in which a brand appears, not rank; e.g. Bose, Sony, Sennheiser and Apple each appeared in 55-77% of headphone responses. Tight niches gave more stable answers than large categories. — [Search Engine Journal](https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242); [Search Engine Land](https://searchengineland.com/ai-recommendation-lists-rarely-repeat-study-468076)
- ChatGPT local results depend on optional location sharing (off by default; precise vs approximate location toggles), so results differ by user settings. — [OpenAI Help: ChatGPT search](https://help.openai.com/en/articles/9237897-chatgpt-search)

### Inferences
- Suggested methodology for a local client: 10-20 realistic customer questions (e.g. "best barber in Shipley", "emergency electrician near Bradford open now"), each run at least 5-10 times per platform per month, in logged-out or fresh sessions, with stated location (or a UK location set), recording date, platform, model/mode, whether the business is mentioned, cited (linked) or recommended, and which sources are cited. Report mention rate with the sample size, and trends over months, never a single screenshot as "proof".
- Local tight-niche queries (one town, one trade) should be more stable than broad categories, so local small businesses are a relatively measurable case.

### Gaps
- No published statistical guidance on the minimum number of runs per prompt for reliable local mention rates; the SparkToro sample sizes (60-100 runs) are far above what a solo studio can do manually.

## B3. Referral traffic and server-log measurement

### Takeaway
AI referral traffic is measurable but undercounted: GA4 has no reliable built-in AI channel (one unverified claim of a native one from May 2026), so set a custom channel group by source regex placed above Referral; many AI-originated visits arrive as Direct. Server logs can show AI crawler hits, but user agents can be spoofed and some crawlers disguise themselves, so verify against published IP ranges.

### Cited Findings
- GA4 default channels have no AI category; AI clicks usually fall into Referral, or Direct when users copy-paste URLs. Fix: custom channel group, Source "matches regex" (e.g. `chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com`), ordered above Referral; do not restrict by medium, as utm_source=chatgpt.com clicks can arrive with (none)/(not set) medium (one agency estimates 30-40% of visible ChatGPT traffic). Historical sessions may not reclassify. — [Swydo agency guide](https://www.swydo.com/?p=21987); [MO Agency](https://www.mo.agency/blog/how-to-track-ai-traffic-and-referrals-in-google-analytics-4); [Discovered Labs](https://discoveredlabs.com/blog/how-to-track-chatgpt-perplexity-and-ai-overviews-traffic-in-ga4-without-guessing)
- Single-source, unverified: GA4 reportedly added a native "AI Assistant" channel on 13 May 2026 that recognises ChatGPT and Gemini but not Perplexity or referrer-less sessions. — [DarwinApps](https://www.darwinapps.com/blog/how-to-track-chatgpt-gemini-and-perplexity-referral-traffic-in-ga4-and-crm/)
- AI Overview / AI Mode clicks cannot be separated from ordinary Google organic clicks in GA4 or older GSC data (they are folded into "Web"). — [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features); [PPC Land](https://ppc.land/google-finally-gives-search-console-its-own-generative-ai-visibility-reports/)
- Crawler identity: OpenAI publishes IP ranges for its bots; Cloudflare documented a crawler using a spoofed Chrome user agent from undeclared IPs. — [OpenAI Help](https://help.openai.com/en/articles/9237897-chatgpt-search); [Cloudflare blog](https://blog.cloudflare.com/perplexity-is-using-stealth-undeclared-crawlers-to-evade-website-no-crawl-directives/)

### Inferences
- The studio's own no-tracking, no-cookie stance (and many clients' preference) means server-log or privacy-friendly analytics (cookieless referrer counts) may be the measurement route; GA4 setup on client sites needs a privacy notice and, where cookies are used, consent (per the project's compliance doc).
- Bot hits in logs show crawl access, not visibility or recommendations; report them as "AI systems can read your site", not as exposure.

### Gaps
- No vendor-neutral benchmark found for what share of traffic small UK local businesses get from AI referrals; agency figures (0.5-4%) are unverified.

## B4. What can honestly be promised to clients

### Takeaway
Promise controllable inputs and transparent measurement: crawlability for each AI system, accurate and consistent listings, genuine review requests, helpful service pages and matching structured data, and a monthly report of mention rate from a fixed prompt set plus first-party Bing/Google AI data and AI referral visits. Do not promise inclusion, position, recommendations, or traffic from any AI system.

### Cited Findings
- Google states there are no special optimisations for AI features and that ordinary SEO fundamentals apply. — [Google: AI features](https://developers.google.com/search/docs/appearance/ai-features)
- AI answers are highly variable for the same prompt, so exact-rank claims are unreliable; mention frequency is the more defensible metric. — [Search Engine Land](https://searchengineland.com/ai-recommendation-lists-rarely-repeat-study-468076)
- Bing's report counts citations but not clicks; Google's AI view is impressions only. — [Search Engine Land](https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039); [PPC Land](https://ppc.land/google-finally-gives-search-console-its-own-generative-ai-visibility-reports/)
- Fake or gated reviews carry UK fines up to 10% of global turnover and Google profile warnings. — [GOV.UK](https://www.gov.uk/government/news/cma-secures-important-changes-from-google-to-tackle-fake-reviews); [Taylor Wessing](https://www.taylorwessing.com/de/insights-and-events/insights/2026/03/the-cma-steps-up-its-fight-against-fake-reviews)

### Inferences
- A client-facing "legitimate vs manipulation" line: Legitimate = same content for every visitor, true facts, genuine reviews asked for neutrally, disclosed authorship, platform listings kept accurate. Manipulation = cloaking for AI user agents, hidden instructions, fake/AI-written/gated/undisclosed-incentive reviews, mass AI pages, fake "independent" listicles, undisclosed Reddit seeding, parasite pages.
- Report template: prompt set and run count; mention rate per platform with sample size; sources the AIs cited; Bing AI citations; GSC AI impressions; AI referral sessions (with the Direct-undercount caveat); actions taken this month. Label all AI-tracker numbers as estimates from sampling.

### Gaps
- No regulatory guidance found that specifically addresses marketing of "GEO" or AI-visibility services in the UK.
