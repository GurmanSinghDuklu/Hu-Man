# Off-site visibility: how AI assistants and Google AI surfaces source local-business answers (UK small business, 2025-2026)

Research date: 2026-10-19. Most third-party material is from SEO vendors with a commercial interest; primary sources (Google, Wikipedia, Axios reporting, BrightLocal's own studies) are flagged where used. Correlation studies are labelled as such.

## Per-platform sourcing: where local recommendations come from

### Takeaway
Each assistant draws on a different mix. Google's surfaces (AI Overviews, AI Mode, Gemini, Ask Maps) use Google's index plus Business Profile/Maps data. ChatGPT uses web search (widely reported as Bing-backed) plus licensed third-party local data, and the only confirmed licensed provider is Yelp (deal reported July 2026). Claude uses Brave Search. Copilot uses Bing and Bing Places. Apple Maps/Siri use Apple Business Connect, with ratings syndicated from third parties such as Yelp and TripAdvisor. Perplexity has a Yelp data integration. The common thread across all of them is a strong Google Business Profile, a good business website and a consistent presence on the big directories, Yelp in particular.

### Cited Findings

**Google AI Overviews / AI Mode (official)**
- Google says a page only needs to be "indexed and eligible to be shown in Google Search with a snippet" and that there are "no additional technical requirements". You "don't need to create new machine readable files, AI text files, or markup to appear in these features", and no special schema.org markup is needed. — [Google Search Central: AI features and your website (updated 2025-12-10)](https://developers.google.com/search/docs/appearance/ai-features)
- Google advises keeping Business Profile and Merchant Center information current as part of the SEO practices that still apply. Both features may use "query fan-out", "issuing multiple related searches across subtopics and data sources". — [Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)
- Whitespark's Q3 2026 roundup reports that Google's AI optimisation guidance says generative AI features pull from GBP and Merchant Center feeds. — [Whitespark, Q3 2026 developments (8 Oct 2026)](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Google Search Console added generative-AI reporting (AI Overviews and AI Mode impressions and URLs combined) in August 2026. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Google Local Services Ads are being tested inside AI Mode (US-focused). — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Gemini's help page reportedly says "Gemini uses public information from Google Maps" to find places. This wording reached me through a secondary source. — [Local Falcon](https://www.localfalcon.com/blog/where-does-gemini-get-local-business-info)
- AI Mode local results can show star ratings and review counts drawn from Business Profiles. — [Women in Tech SEO](https://www.womenintechseo.com/knowledge/google-ai-mode-local-businesses/)

**Google Business Profile Q&A replaced by Ask Maps (Gemini)**
- Vendor reports agree on this timeline. Google announced on 17 Sept 2025 that it would retire the Q&A API, and the API shut down on 3 Nov 2025. The public Q&A panel began phasing out around 3 Dec 2025. Ask Maps, a Gemini answer tool inside Maps, answers questions using the profile, website, reviews and public web sources, and owners can no longer write answers themselves. Ask Maps launched in the US and India first, with no announced UK timeline. These dates are not verified against a Google primary source. — [BrightLocal Q&A guide](https://www.brightlocal.com/learn/google-q-and-a/); [Slashpost](https://slashpost.ai/blogs/google-business-profile/google-business-profile-qa-removed-2026); [The HOTH](https://www.thehoth.com/blog/google-cuts-qa-sections/)
- In 2026 Ask Maps reportedly gained agentic ordering through Square and Toast, with Uber Eats slated to join. "Tell Maps" crowd edits were announced in August 2026, and owners get 4 days to respond to suggested edits. These are observations, not formal studies. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)

**ChatGPT search**
- OpenAI's help documentation says ChatGPT may share approximate location with "trusted third-party providers" for nearby business listings and may show a map on mobile. It does not name the providers. I could not fetch the page directly (HTTP 403), so this comes from secondary summaries. — [Search Engine World](https://www.searchengineworld.com/getting-your-business-on-the-map-in-chatgpt-local-search-comes-to-chatgpt); [Local Falcon](https://www.localfalcon.com/blog/chatgpt-local-search-data-sources-where-does-business-info-come-from)
- **Yelp–OpenAI licensing deal (confirmed):** ChatGPT can use Yelp reviews, ratings, photos and business details (330M reviews, 8M+ listings) in local answers, with Yelp branding and links. The deal is non-exclusive and the terms were not disclosed. A "Request a Quote" feature inside ChatGPT is planned. Axios reported it on 23 July 2026, and one analysis says it was first signalled in Yelp's 12 Feb 2026 results. — [Axios, 23 Jul 2026](https://axios.com/2026/07/23/yelp-reviews-chatgpt-geo-partnership); [TechWyse](https://www.techwyse.com/news/platform-updates/yelp-openai-licensing-deal-chatgpt-local-reviews)
- ChatGPT is widely reported to rely on Bing results for live search. Whitespark's study of Bing Places, which ChatGPT draws on, found its review sources were mostly Facebook, then Yelp, TripAdvisor and others. — [TSEG](https://www.tseg.com/how-chatgpt-ranks-local-businesses-using-bing-and-what-that-means-for-your-firms-clients/); [BrightLocal blog](https://www.brightlocal.com/blog/ai-search-using-listings-sources/)
- **Foursquare claim (unverified):** some vendors say Foursquare supplies 60–70%+ of ChatGPT's local results. The figure traces to unnamed "independent analyses", and BrightLocal itself says only that "reports suggest" it. — [SurfaceLocal](https://www.surfacelocal.com/blog/how-chatgpt-finds-local-businesses); [BrightLocal blog](https://www.brightlocal.com/blog/ai-search-using-listings-sources/)
- In BrightLocal's 2026 data, Yelp appeared in about 80% of ChatGPT answers, and Apple's listings were cited 600 times. — [BrightLocal, AI directory sources (26 Aug 2026)](https://www.brightlocal.com/resources/ai-directory-sources/)
- OpenAI has not published a claim or verify process for businesses on ChatGPT maps. Vendors advise fixing data at the source and then contacting OpenAI Support. — [thejayant.in](https://thejayant.in/blog/chatgpt-maps)

**Perplexity**
- Perplexity integrated Yelp data (through Yelp's Fusion data-licensing programme) to power local results and map views, first reported in March 2024. — [Maginative](https://www.maginative.com/article/perplexity-enhances-ai-search-engine-with-direct-yelp-data-integration/); [Near Media](https://www.nearmedia.co/perplexity-yelps-ftc-pins-location-brokers-the-web-at-35/)
- I found no evidence of a formal Perplexity–TripAdvisor data deal. TripAdvisor appears only as an ordinary web source. — [Menra guide](https://www.menra.ai/guides/perplexity-local-visibility) (vendor)

**Claude (Anthropic)**
- In March 2025 Anthropic added Brave Search to its subprocessor list, and a researcher found Claude and Brave returning identical citations. — [TechCrunch, 21 Mar 2025](https://techcrunch.com/2025/03/21/anthropic-appears-to-be-using-brave-to-power-web-searches-for-its-claude-chatbot/)
- Profound measured 86.7% overlap between Claude's citations and Brave's top results. This is a third-party test, not an official confirmation. — [Profound](https://www.tryprofound.com/blog/what-is-claude-web-search-explained)

**Microsoft Copilot / Bing**
- Vendors report that Bing Places moved to bing.com/forbusiness in October 2025, that it can import a listing from GBP, and that it has no reviews of its own: it syndicates them from TripAdvisor, Yelp and Facebook. They also say a verified listing controls how a business appears in Bing, Bing Maps and Copilot. None of this is confirmed in Microsoft documentation. — [Whitespark Bing Places guide](https://whitespark.ca/guides/the-ultimate-guide-to-your-bing-places-listing/); [Birdeye](https://birdeye.com/blog/business-listing-on-bing)

**Apple (Maps, Siri, Apple Intelligence)**
- Apple Business Connect is Apple's free verified business directory. Apple Maps does not collect written reviews of its own and shows ratings from Yelp, TripAdvisor, Foursquare and others. Vendors say Siri's local answers come from Apple Maps data. These are vendor claims; I did not verify them against Apple's documentation. — [The Stacc](https://thestacc.com/blog/apple-maps-seo/); [Maas](https://www.trymaas.com/blog/apple-business-connect-apple-maps-marketers-2026/)

**Grok (xAI)**
- No reliable source found (see Gaps).

### Inferences
- Yelp is the cross-platform hub: it feeds ChatGPT (licensed), Perplexity (licensed), Apple Maps ratings and Bing review syndication. In the UK, Yelp has far fewer users than in the US, but a claimed, accurate Yelp listing is cheap insurance.
- One correct, consistent set of business details needs to exist on GBP, Bing Places (importable from GBP), Apple Business Connect, Yelp and Facebook. Those five cover the documented or credibly reported data pipes for every major assistant.
- Google's own documentation rules out llms.txt or special markup as a requirement. Anyone selling "AI schema" as a guaranteed lever is overclaiming.

### Gaps
- OpenAI does not name its local data providers, apart from Yelp, which was confirmed via the partnership. The Foursquare share is unverified.
- No Microsoft or Apple primary documentation was retrieved. Copilot and Siri sourcing rests on vendor reports.
- Grok: nothing reliable found on how it sources local businesses (X posts plus web search are assumed, not evidenced).
- Ask Maps' UK availability date is unknown.

## What drives AI citations and recommendations (studies)

### Takeaway
The best local data, from BrightLocal (2026, about 2M citations including UK locations), shows business websites (42%) and Google Business Profile (about 28.6%) dominate local AI citations, followed by Yelp, Facebook and TripAdvisor. AI visibility is volatile: a business appears in only 32–38% of AI answers against 66% of Google Maps searches, and only about half the time on a repeat run. Off-site brand mentions correlate with AI visibility more strongly than backlinks do (Ahrefs). Expert surveys rank reviews, dedicated service pages, directory citations and "best of" lists as AI factors. All of this is correlational.

### Cited Findings
- **BrightLocal Local AI Visibility Study (16 Sept 2026):** ~200k non-branded local prompts, ~1,342 locations, 60 days, ChatGPT plus Google AI Mode plus AI Overviews, ~1.97M citations. Business websites make up 42% of citations and 93% of unique cited domains. GBP is 28.63%, Yelp 9.53%, Facebook 2.23%, TripAdvisor 1.79% and OpenTable 1.18%. — [BrightLocal](https://www.brightlocal.com/research/local-ai-visibility-study/)
  - Average businesses named per answer: ChatGPT 4.1, AI Mode 3.5, AI Overviews 2.5. Tracked-business mention rate: ChatGPT 33%, AI Mode 32%, AIO 38%, against Google Maps at 66%. Overlap between repeat runs is 21–33%, and a business that appears once reappears about 50–58% of the time. — [BrightLocal](https://www.brightlocal.com/research/local-ai-visibility-study/)
  - ChatGPT overlaps only about 19–20% with the Google AI surfaces, and AI Mode and AIO share 29.3% of named businesses. ChatGPT's 90% radius is 287 km against 38–64 km for Google, and 53–59% of picks fall within 5 km. Storefronts are mentioned slightly more often than service-area businesses (33.6% vs 29.4%). — [BrightLocal](https://www.brightlocal.com/research/local-ai-visibility-study/)
- **BrightLocal AI directory sources (26 Aug 2026; US, UK and Australian locations; 1,355 locations):** UK-specific sources cited include Trustpilot (2,422 citations across 151 businesses, 11.14%) and Yell.com (709 citations across 68 businesses, 5.02%). Reddit (35,144) and Instagram (37,520) lead the social sources. Wikipedia had only 1,086 citations. No country split is given. Thomson Local, Checkatrade and Treatwell are not mentioned. — [BrightLocal](https://www.brightlocal.com/resources/ai-directory-sources/)
  - Dentists: Google 14,260, Yelp 3,839, Facebook 485. Restaurants: Google 45,384, Yelp 21,841, TripAdvisor 7,033, OpenTable 6,617. "Services": Google 74,995, Yelp 20,557. — [BrightLocal](https://www.brightlocal.com/resources/ai-directory-sources/)
- **Consumer behaviour (US only, n=1,002, Mar 2026):** 45% use AI tools for local recommendations, up from 6% the year before: ChatGPT 31%, Google AI Mode 23%. 88% of AI users fact-check, 42% always check native review platforms, and people increasingly want 4.5+ stars. Use of Google reviews fell from 83% to 71%. — [BrightLocal LCRS 2026 AI trust](https://www.brightlocal.com/research/lcrs-ai-trust/)
- A Yext survey of ~4,000 local consumers found only 5% use AI as a direct purchase path. Most go through a "verification loop" of search, website, reviews and social. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- **Ahrefs, 75,000 brands (Aug 2025, correlation with AI Overview presence):** branded web mentions scored 0.664, brand anchors 0.527, brand search volume 0.392 and referring domains 0.218. YouTube mentions scored about 0.737 in a later cross-platform version. Secondary sources disagree on the backlink figure (0.218 vs ~0.295). — [CiteFlow summary](https://www.citeflow.io/blog/brand-mentions-vs-backlinks); [AuthorityTech](https://authoritytech.io/curated/ahrefs-brand-mentions-backlinks-ai-search-2026)
- **Whitespark 2026 Local Search Ranking Factors (expert survey, 47 experts, 187 factors):** review signals rose for both the local pack and AI visibility. Newly added AI factors include content freshness, review diversification and inclusion on expert-curated "best of" lists. "Dedicated page for each service" is ranked #2 for AI visibility. Darren Shaw says citations on Yelp, BBB and industry directories matter again for ChatGPT and Gemini. — [Whitespark LSRF](https://whitespark.ca/local-search-ranking-factors/); [Harmo summary](https://harmo.me/en/blog/local-seo-ranking-factors-2026-whitespark); [Near Media ep. 247](https://www.nearmedia.co/ep-247-from-the-archives-local-search-ranking-factors-darren-shaw-on-reviews-ai-search-what-drives-local-rank/)
- **OppAlerts/Whitespark AI visibility study (403k prompts, 100 industries, correlational):** the top factor is simply ranking in the search results, followed by homepage keyword relevance and domain authority. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- A Cheers analysis of home-services queries found business websites supplied 68.1% of citations and Google surfaces 3.3% (vendor sample). — [Cheers](https://www.cheers.tech/geo-academy/how-local-businesses-can-show-up-in-google-ai-search)
- **Reddit:** I found no primary study giving Reddit's share of local AI citations. In BrightLocal's local data, Reddit ranks second among social sources (35,144 citations), a small share of 1.97M. — [BrightLocal](https://www.brightlocal.com/resources/ai-directory-sources/)

### Inferences
- For a Leeds salon or electrician, the biggest levers are on assets they control: the website (service pages, location and NAP, expertise) and GBP. Directories and reviews come second. Reddit or Wikipedia work is low-yield for local queries.
- Because answers vary run to run, any AI-visibility report should sample repeated prompts across several locations and report a mention rate, not a single "rank". That fits the "measure, don't guarantee" rule.
- Google results still matter: AIO and AI Mode overlap heavily with organic and local results, and "being in the search results" tops the AI factor study. Classic local SEO is the base layer.

### Gaps
- No UK-only split of AI local citation sources exists. The share for Checkatrade, TrustATrader, Rated People, MyBuilder, Which? Trusted Traders, Treatwell, Fresha, NHS listings, Just Eat or Deliveroo in AI answers is unmeasured in the sources found.
- NAP consistency as a direct AI factor: no quantified study found, only expert opinion (Cyrus Shepard via [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)).
- Semrush, Seer, BrightEdge and Profound Reddit-share studies were not retrieved directly.

## Google Business Profile, Bing Places, Apple Business Connect and UK directories

### Takeaway
GBP completeness and category choice correlate strongly with local rankings, and GBP is the single most cited source in AI answers. Q&A is gone, and Ask Maps now builds answers from the profile, website and reviews. The UK citation set should be GBP, Bing Places, Apple Business Connect, Yelp, Facebook, Yell and Trustpilot, plus the vertical directories that customers actually use. Evidence of AI citation exists only for Yell and Trustpilot.

### Cited Findings
- **Categories and completeness (Darren Shaw, 1.8M GBPs, correlational):** a specific primary category gave about 36% higher top-10 presence. Well-chosen extra categories gave 6–17 positions better. Moving completeness from 0 to 5 gave about 19 positions better and a 3× top-10 rate. — [Whitespark Q3 2026 / Search Engine Land](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Keyword-stuffed business names correlated with 2–5× more top-3 rankings (Whitespark, 1.4M GBPs). This breaks Google's name guidelines and should not be recommended, but it explains why spammy competitors rank. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Google asks reviewers category-specific follow-up questions (only 25% of categories have them, and restaurants get 14), for example "which services did you get" and price. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- GBP now has a "Collected Info" tab showing details Google gathered from calls, and owners can delete them. Users can report owner responses. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Google says local ranking is based on relevance, distance and prominence, and that review count and rating factor into prominence. — [SocialPilot summary of Google guidance](https://www.socialpilot.co/reviews/blogs/ai-visibility-for-local-businesses)
- Bing Places imports from GBP and syndicates reviews. Apple Business Connect is free and verified. See section 1 for sources.
- UK directories with AI-citation evidence: Yell.com and Trustpilot. — [BrightLocal](https://www.brightlocal.com/resources/ai-directory-sources/)

### Inferences
- Per vertical, for a UK client (an inference: AI-citation evidence is lacking for most of these):
  - Electrician: Checkatrade, TrustATrader, Rated People, MyBuilder, Which? Trusted Traders. NICEIC/NAPIT registers act as trust and verification sources.
  - Salon: Treatwell, Fresha, Booksy (these are also booking engines).
  - Dental: the NHS "find a dentist" listing (if NHS) and the CQC register (in England, dental providers are CQC-registered), plus the GDC register for clinicians.
  - Takeaway: Just Eat, Deliveroo, Uber Eats, TripAdvisor, and the FSA food hygiene rating.
  - All verticals: Facebook, Yell, Thomson Local, Trustpilot, Nextdoor.
- With Q&A gone, the FAQ content that used to sit in GBP Q&A should move to the website's FAQ and service pages, which Ask Maps and AI Mode read.
- GBP posts, photos and attributes are reasonable completeness signals, but no 2025–26 study isolating their AI effect was found.

### Gaps
- No primary Google help-centre pages on categories, services or attributes were retrieved this round.
- Whether NHS, CQC, Checkatrade, Treatwell or Just Eat pages get cited in AI answers is unmeasured.

## Legitimate review generation and PR/mentions (UK)

### Takeaway
Ask every customer, never pay or incentivise for Google reviews, never gate (only asking happy customers), and avoid staff or conflict-of-interest reviews. In the UK, fake and hidden-incentive reviews are illegal under the DMCC Act since 6 April 2025, and the CMA moved to enforcement in 2026. Recency and steady frequency of reviews matter more than the total count.

### Cited Findings
- Google's policy prohibits reviews "paid for, directly or in kind" and offering "payment, discounts, free goods and/or services". Merchants may not "Discourage or prohibit negative reviews, or selectively solicit positive reviews from customers", may not ask "staff [to] solicit a certain number of reviews", and conflict-of-interest content (including "current or former employment") is barred. — [Google Maps user contributed content policy](https://support.google.com/contributionpolicy/answer/7400114)
- **UK DMCC Act 2024:** the CMA guidance was published 4 Apr 2025 and the rules took effect 6 Apr 2025. They ban fake reviews, commissioning them, and incentivised reviews whose incentive is hidden. Publishers must take reasonable and proportionate steps to prevent and remove banned reviews. — [CMS Law](https://cms.law/en/int/legal-updates/no-more-faux-five-stars-the-dmcc-act-bans-fake-reviews); [Reed Smith](https://www.reedsmith.com/articles/the-truth-about-fake-reviews-what-businesses-need-to-know/)
- In 2026 the CMA opened its first fake-review investigations, with 14 businesses under scrutiny using its new powers. — [HSF Kramer, Mar 2026](https://www.hsfkramer.com/notes/crt/2026-03/cma-launches-first-investigations-into-fake-and-misleading-reviews); [Taylor Wessing, Mar 2026](https://www.taylorwessing.com/en/insights-and-events/insights/2026/03/the-cma-steps-up-its-fight-against-fake-reviews)
- Under UK law, incentives may be lawful if disclosed, but Google bans them for Business Profile reviews regardless. — [techUK](https://www.techuk.org/resource/fake-reviews-and-the-dmcc-act-what-the-cma-s-actions-mean-for-uk-businesses.html)
- Darren Shaw: consistent weekly reviews can outrank thousands of stale ones. Review "diversification" across platforms is a new AI factor. — [Whitespark LSRF coverage](https://whitespark.ca/local-search-ranking-factors/); [Harmo](https://harmo.me/en/blog/local-seo-ranking-factors-2026-whitespark)
- Google is sending review-policy warning emails to businesses. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- Local-brand advice from experts: third-party mentions, original assets, NAP consistency, photos with people, and peer recommendations. This is opinion, not data. — [Whitespark Q3 2026 (Cyrus Shepard, Near Media)](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)
- A "Google me" giveaway tactic that drives branded searches was called "borderline click manipulation" by practitioners. Avoid it. — [Whitespark Q3 2026](https://whitespark.ca/blog/22-local-seo-developments-you-need-to-know-about-from-q3-2026/)

### Inferences
- A compliant review service would send a post-visit request with a direct review link to every customer, include no gating step ("were you happy?"), offer no incentives, and reply to all reviews. Diversify reviews to one relevant vertical platform (Checkatrade, Treatwell, TripAdvisor) as well as Google.
- Legitimate mentions for a local client include local press (e.g. the Yorkshire Evening Post, Telegraph & Argus), community sponsorships, trade-body listings, and earning a place on genuine "best X in Leeds" editorial lists. Pay-to-play "best of" lists are a grey area.
- Reddit: participate transparently as the business, follow each subreddit's rules on self-promotion, and never astroturf. I could not fetch Reddit's own spam policy (HTTP 403).

### Gaps
- I did not retrieve the CMA's primary guidance (CMA208) on GOV.UK, so whether it explicitly addresses review gating is unconfirmed. Gating is in any case barred by Google's policy.
- Reddit's official self-promotion rules were not retrieved.

## Wikipedia / Wikidata for small businesses

### Takeaway
Almost no local SME meets Wikipedia's company notability bar. Directory listings, press releases, "best of" lists and purely local coverage don't count, and writing about yourself is a conflict of interest. Wikipedia is also a minor source in local AI answers. Don't sell it.

### Cited Findings
- Notability requires "significant coverage in multiple reliable secondary sources that are independent of the subject". These do not count: directory entries, press releases, paid content, routine business news, inclusion in "best of" or "top 100" lists, and purely local coverage (at least one regional, national or international source is needed). Self-published material and editors with a conflict of interest are also excluded. — [Wikipedia: Notability (organizations and companies)](https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies))
- Wikipedia drew 1,086 citations out of ~1.97M in BrightLocal's local AI dataset (about 0.06%). — [BrightLocal](https://www.brightlocal.com/resources/ai-directory-sources/)

### Inferences
- Wikidata entries for non-notable small businesses are likely to be deleted or to add little. A consistent entity footprint (GBP, Apple, Bing, Yelp, the website's Organization/LocalBusiness schema with sameAs links) is the realistic way to establish the entity.

### Gaps
- Wikidata's own notability policy was not retrieved in this round.
