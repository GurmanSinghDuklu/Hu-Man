# Vertical research: where time and money leak

Most figures below come from software vendors or trade press with a product to sell, often small samples, so they are directional. Prove value with each client's own numbers.

## Cross-industry patterns
1. Missed calls and slow enquiry replies.
2. Quotes and proposals written slowly (often at night).
3. Booking, reminders, no-shows, cancellations and waitlists.
4. Chasing money: invoices, deposits, late payers.
5. Repetitive customer questions (prices, hours, coverage, insurance).
6. Reviews: asking for them and replying.
7. Paperwork and compliance (certificates, forms, notes).
8. Multi-site reporting, rotas and staff questions (franchises).

## By business type
| Business | Time sinks | Staff should be doing | What to build |
|---|---|---|---|
| Electricians / builders | Missed calls on site, quotes at night, chasing late payers, job paperwork | Working on site, quoting more jobs | Call answering with missed-call text-back; voice note and photos to draft quote for owner approval; quote and invoice chasers; job-sheet drafts |
| Dental practices | Reception overloaded, new-patient enquiries unanswered, recalls, reminders, cancellations | Caring for patients in the building | New-patient enquiry handling and booking; recall and reminders; waitlist fill; review requests (admin only) |
| Physiotherapists | Reminders, no-shows, intake forms, exercise-plan follow-up, letters | Treating patients | Reminders and no-show recovery; pre-visit intake; follow-up messages; notes drafted for clinician review |
| Takeaways | Phone orders at peak, menu and allergen questions, delivery-app commission | Cooking and packing | AI phone and WhatsApp ordering; a direct-order page with repeat-customer texts; review replies |
| Restaurants | Booking calls, no-shows, event enquiries, reviews | Running the floor | Booking with reminders; waitlist; event enquiry handling; weekly sales digest |
| Franchise owners | Multi-site reporting, staff questions, compliance checks, same customer queries at each site | Growing sites | Per-site call handling; staff procedures assistant; owner dashboard |

## Evidence with sources and caveats
- Trades: a 2026 survey of 140 tradespeople (Powered Now and Installer, fieldwork April to June 2026) found admin (quoting, invoicing, chasing) averages 5 hours 20 minutes a week, and tradespeople are owed on average £5,901 in unpaid invoices. https://www.electricaltimes.co.uk/?p=36067 (vendor-commissioned, small sample). A sponsored article citing the same report says 55% believe they have lost a job because a quote went out too slowly. A separate 2026 survey of 167 small business owners (HeyBRB, an AI automation consultancy) reports about 8 hours of admin a week. https://www.electricaltimes.co.uk/?p=34786
- Dental: a UK survey (DenGro) found more than half of dentists and practice managers fear missing treatment enquiries and many do not log enquiries digitally. https://uk.dental-tribune.com/news/survey-reveals-many-dental-practices-concerned-about-missed-enquiries (vendor-run). Widely quoted missed-call revenue figures are mostly US vendor marketing; do not repeat them as fact.
- Food: restaurants told Which? they pay between 15% and 35% of each order in delivery-app commission. https://www.which.co.uk/news/2021/06/the-hidden-costs-of-the-food-delivery-revolution-the-surprising-premium-added-to-your-next-takeaway/ (2021).
- Competition: VoiceStack markets AI call handling to UK dental practices; Powered Now, Tradify and similar cover job management for trades.
- Website pricing context: https://www.kwiboo.com/blog/How-much-does-a-website-cost-in-the-UK-A-2026-breakdown (UK freelancer day rates and project ranges).

## Modules for the "Full presence" package
1. Answer: AI receptionist for calls, WhatsApp, SMS and web chat; answers questions, captures details, books or hands over.
2. Quote: notes or photos in, itemised quote drafted for owner approval, follow-ups at 1, 3 and 7 days.
3. Collect: polite invoice reminders that escalate, connected to Xero or QuickBooks.
4. Remind: appointment reminders, no-show recovery, waitlist fill.
5. Reputation: review requests after each job and drafted replies for approval.
6. Owner digest: weekly message of missed calls, open quotes, unpaid invoices, bookings and reviews.
Assemble existing tools (Claude API with tool use, n8n or Make, a voice platform, WhatsApp Business, Stripe or GoCardless) and write custom code only for gaps. Integrate with software clients already use.

## ROI formula (use each client's real numbers)
missed genuine enquiries per week x conversion rate x average job value. Illustration only: five a week x 30% x £250 is about £375 a week.

## Claude Certified Architect (context)
Anthropic launched Claude Certified Architect, Foundations on 12 March 2026: a proctored 60-question exam across five domains (agentic architecture and orchestration, Claude Code configuration, prompt engineering and structured output, tool design and MCP, context management and reliability). Anthropic added further certifications including Architect, Professional on 8 July 2026. One company blog says validity is six months; verify with Anthropic. Do not describe Gurman as an Anthropic partner unless he joins its partner programme. Clients buy outcomes; lead with results.
