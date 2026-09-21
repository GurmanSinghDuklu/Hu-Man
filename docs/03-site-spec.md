# Site spec: Duklu Digital website

## Purpose, audience, job
- Subject: a solo Bradford studio that redesigns outdated local-business websites and adds bookings, payments, AI enquiry assistants and local and AI-search visibility.
- Audience: owners and managers of small local businesses (barbers, salons, electricians, builders, dental and physio practices, takeaways, restaurants, franchise owners). They are busy, sceptical of tech talk and judge a designer by how their own site looks and works.
- Primary job: get the visitor to request a free presence audit. Secondary: prove quality (before/after), explain prices honestly, show credentials.
- Success measures: audit requests, time on the before/after section, Lighthouse 95+, Search Console impressions for local queries.

## Design direction (proposed; /plan-site may refine it)
The memorable thing is one live demo: a full-width before/after slider on the home page that shows a typical outdated small-business site turning into a redesigned one. Everything else is quiet and disciplined.

Colour (light theme is the default; follow `prefers-color-scheme` and offer a toggle):
| Token | Light | Dark | Use |
|---|---|---|---|
| chalk / bg | #F1F2EE | #0C1020 | page background |
| ink / text | #0E1116 | #EDEFF5 | text |
| muted | #4C5563 | #A3ABC2 | secondary text |
| klein / accent | #1F3BD6 | #8EA2FF | links, primary buttons (white text on light, #0C1020 text on dark) |
| stone / line | #D9DBD3 | #232A44 | borders and dividers |
| highlighter | #FFE94A | #FFE94A | used sparingly: slider knob and the introductory-price tag |
Check every text and background pair for WCAG AA contrast.

Type (verify each loads via `@fontsource`; substitute if not available, keep the roles):
- Display and UI: Bricolage Grotesque, weights 600 to 700, tight tracking, large optical size for headlines.
- Body: Newsreader (serif) at 18 to 19px, line-height about 1.6, line length under 70 characters.
- Fallbacks: Georgia for body, system-ui for display.

Layout: left-aligned, 12-column grid, generous whitespace, max width about 1200px. Hero statement spans 8 columns. Avoid a wall of identical rounded cards: use rows, tables and lists where the content is comparative or sequential (pricing as a comparison table, process as a real sequence). Avoid: tracked all-caps eyebrows, one accented word in a headline, decorative numbering, arrows appended to buttons, mono labels, gradient washes as decoration.

Motion: one orchestrated moment only. When the slider first scrolls into view it nudges once from 50% to 35% and back to show it can be dragged. Otherwise no entrance animations. Respect `prefers-reduced-motion`.

Wireframe (desktop):
```
Duklu Digital        Work  Services  Pricing  About  FAQ   [Get your free presence audit] [theme]
------------------------------------------------------------------------------------------------
Websites that turn local
searches into bookings                      (left aligned, spans 8 of 12 columns)

One supporting paragraph (max 60 characters wide).
[Get your free presence audit]  [See concept work]

+----------------------------------------------------------------------------------------------+
| Barber | Electrician | Dental practice                   Concept design, fictional business    |
| BEFORE  ....................|....................  AFTER      full width, 16:10, draggable     |
+----------------------------------------------------------------------------------------------+
One factual line about credentials.
------------------------------------------------------------------------------------------------
What I do        (services as a list with short descriptions, two columns)
Try the enquiry assistant     (chat demo beside a short explanation)
Concept work     (gallery of six concept renders, then three real projects as a plain list)
How it works     (five-step sequence)
Pricing          (comparison table, introductory price and standard price)
About and credentials
Questions        (FAQ, native <details>)
Free presence audit (contact)  ->  footer with areas served
```
Mobile: single column, slider keeps 16:10 and scales, tabs scroll horizontally, pricing table becomes stacked rows with each tier's price first.

## Page sections and copy (British English, sentence case)
Use this copy unless Gurman changes it. Do not invent extra claims.

**Meta**
- Title: Web designer in Bradford | Website redesign, AI chatbots and local SEO
- Description: Bradford web designer for small businesses: high-end website redesigns, online booking and payments, AI enquiry assistants and local SEO. Free presence audit.

**Hero**
- H1: Websites that turn local searches into bookings
- Sub: I redesign outdated websites into fast, high-end sites that take bookings and payments, answer enquiries around the clock, and get found on Google and in AI search. Based in Bradford, working across West Yorkshire.
- Buttons: "Get your free presence audit" (to #audit), "See concept work" (to #work)
- Slider caption: "Concept redesigns for fictional businesses. Drag to compare."
- Credentials line: "I've shipped live customer pages inside Lloyds Banking Group's Agile team, completed Harvard's CS50x, and finished a T Level in Digital Production, Design and Development."

**Services (H2: What I do)** each with one to two plain sentences
1. Website redesign and launch: fast, mobile-first sites for businesses stuck on old or unloved Squarespace, Wix or WordPress setups. Moves your content and redirects your old addresses so you keep the search rankings you have earned.
2. Booking and online payments: customers book, pay a deposit or order straight from your site through providers such as Stripe, Square and SumUp. Card details never touch my code.
3. AI enquiry assistant: answers questions from your own prices, hours and FAQs at any time, collects details and hands over to you. I test it against real questions before launch.
4. Local and AI-search visibility: Google Business Profile, service pages, reviews and structured data, plus a monthly check on whether Google and ChatGPT mention you. Nobody can promise placement in AI answers, so I focus on the fundamentals Google says matter.
5. Automations: missed-call text-back, quote follow-ups, payment reminders and a weekly summary of what needs your attention.
6. Care plans: hosting, updates, backups and small edits every month.

**Enquiry assistant demo (H2: Try the enquiry assistant)**
- Intro: "This is a scripted demo for a fictional barbershop. A real assistant answers from your own information, hands over to a person when it isn't sure, and is tested before it goes live."
- Chips and replies (scripted, no network calls):
  - "Do you take walk-ins?" -> "Yes, when there's a free chair. Booking online guarantees your slot: the next free chair is today at 4:30 pm. Want me to hold it?"
  - "How much is a skin fade?" -> "A skin fade is £18. Adding a beard sculpt makes it £28 for both."
  - "Can I book Saturday morning?" -> "Saturday has 9:30 am and 11:00 am free. Tell me your name and I'll pass your request to the shop to confirm."
  - "Speak to a person" -> "Of course. I've sent your question to the team with a note of what you asked. They usually reply within the hour during opening times."
- Show a typing indicator (about 700 ms). Announce new messages with `aria-live="polite"`.

**Concept work (H2: Concept work)**
- Note: "These are concept designs for fictional businesses. They show what I would build, not past client work."
- Six tiles from the sector data below, each with a caption listing what the concept includes (for example "Online booking, deposits, AI assistant").
- Real projects (plain list, H3: Real projects):
  - Essence Hair Treatment: live React website, built for a family business (link to the live site).
  - Arm Learning Paths: macOS setup guide for the "AI Agent on CPU" path, submitted as a pull request.
  - Lloyds Banking Group placement: live mortgage web pages built in a React and TypeScript Agile team (no screenshots).

**How it works (H2: How it works)** a real sequence, numbered
1. Free presence audit: I review your site on a phone, your speed, your Google Business Profile, your reviews and whether Google and ChatGPT recommend you.
2. Concept: you see a mock-up of your new site before any build starts.
3. Build and test: I build it and test it on real phones.
4. Launch: your old addresses are redirected, and I hand over with a short video.
5. Grow: reviews, visibility and automations, month by month.

**Pricing (H2: Pricing)**
- Intro paragraph: "Introductory pricing while I build my portfolio in Bradford. Prices rise as my diary fills, so quotes are valid for 30 days. Monthly plans stay the same."
- Comparison table from `02-offer-and-pricing.md` (introductory "from" prices, standard price later, monthly plan, what is included). Highlighter tag on "Introductory".
- Terms line: "Fixed price after a free discovery call. 50% deposit, two revision rounds, and you own your site and content after final payment. Platform and AI usage fees are billed at cost."
- CTA per tier: mailto link with the tier in the subject.

**About and credentials (H2: About)**
- "I'm Gurman, a developer based in Bradford. I've shipped live customer pages inside a major bank's Agile team, written open-source documentation for Arm, and built and launched a live website for a family business. I started this studio because local businesses deserve websites as good as national brands', and I'd rather be judged on your bookings than my hours."
- Credential list exactly as in `01-business-context.md` "Verified credentials", with "in progress" items labelled. No testimonials section until real ones exist (then add it).
- No photo yet. Leave a clearly marked slot in the design for a professional photo (see open questions).

**FAQ (H2: Questions)** use native `<details>`. Answers:
1. How much does a website cost? Introductory prices start at £1,125 for a redesign and £2,100 with online booking and an AI enquiry assistant. You get a fixed quote after a free call.
2. Will I lose my Google rankings if you move me off Squarespace? I keep your page addresses where possible and redirect any that change, then check them after launch. No migration can promise identical rankings, but this protects what you have earned.
3. Can you get me into Google AI Overviews or ChatGPT recommendations? No one can guarantee that. Google says the same fundamentals apply as for search: pages that are indexed and helpful, plus a strong reputation. I set those up, then check monthly whether you appear and report the result.
4. Is an AI assistant safe for my customers' data? It only uses the information you give it, tells people they are talking to an assistant, hands over to you when unsure, and is set up to collect as little personal data as needed. I explain which providers process data before launch.
5. How long does a project take? Typically two to three weeks for Launch and four to six for Growth, depending on how quickly you send content.
6. Do I own my website? Yes. After final payment the site and content are yours, and your domain and accounts stay in your name.
7. Where do you work? I'm based in Bradford and meet in person across West Yorkshire, including Leeds, Halifax, Huddersfield, Keighley, Shipley, Bingley and Ilkley. I also work remotely across the UK.

**Audit / contact (H2: Get your free presence audit, id audit)**
- Text: "Send me your website address and I'll review it on a phone, check your speed and your Google Business Profile, and see whether Google and ChatGPT recommend you for your main search. You get a short video and a written list of fixes. It's free and there's no obligation."
- Actions: mailto link (subject "Free presence audit", body prompts for business name, website and main service), tel link, WhatsApp link (`https://wa.me/447988450280`). No form until a backend or form service is chosen.
- Footer: name, "Bradford, West Yorkshire", areas served, "This site uses no tracking cookies", links. Add company or sole-trader details when registered.

## Concept renderer (no photos, no remote images)
All concepts are drawn in HTML and CSS so they load instantly and stay crisp. Build one `MockSite` component that renders either a "before" or an "after" from data.
- Canvas: the frame sets `container-type: inline-size` and a 16:10 aspect ratio. Inside, the mock uses `font-size: 1.25cqw`, so the mock is an 80em by 50em canvas that scales with the frame. Size everything in `em`.
- Decorative mocks use `aria-hidden="true"`; put a real `<figcaption>` on each figure.
- Fictional domains: `.example` only.

Before mock (a typical dated small-business site, not a caricature): dark blue header bar with name in a serif; grey nav in small blue underlined text (Home, About Us, Services, Gallery, Links, Contact Us); a flat grey-blue banner with "WELCOME TO {NAME}"; a dense paragraph ("{NAME} is a family run business established in 2004. We offer a wide range of services at competitive prices. Please call for prices and availability."); a grey box labelled "photo coming soon"; "Tel: 01234 567890"; footer "Copyright 2014 {NAME}. Site last updated 2016." No booking, no clear next step.

After mock: nav (logo, four links, accent "book" button); hero in one of three variants (split: copy left and abstract art right; center: centred copy over an abstract background; trust: copy left and a "quote" panel with badges right); a bottom row of three service cards with prices plus one booking card ("next free slot"); a floating chat bubble bottom right with a short greeting. Abstract art uses CSS gradients and shapes in the sector palette, no stock imagery.

Compare slider: two absolutely positioned layers, the "after" clipped with `clip-path: inset(0 0 0 var(--pos))`. Control with a native `<input type="range">` (0 to 100, default 50) laid over the frame at full size with zero opacity so dragging works anywhere, plus a visible line and knob (highlighter colour). Keyboard: arrow keys move it. Label it "Reveal the redesign". Show a visible focus ring on the knob when the input has focus. Tabs switch sector (Barber, Electrician, Dental practice) and reset the slider to 50.

Sector data (all sample content for fictional businesses):
| id | Name | Domain | Palette (bg / fg / accent / ink on accent) | Hero variant | Headline | Sub | Button | Services (sample) | Booking card |
|---|---|---|---|---|---|---|---|---|---|
| barber | Northgate Barbers | northgate-barbers.example | #101114 / #F2EFE8 / #D9A441 / #16130B | split | Sharp cuts. No waiting around. | Pick your barber and time in 30 seconds. Pay a deposit, get a reminder, turn up. | Book a chair | Skin fade £18; Beard sculpt £12; Cut and beard £28 | Next free chair: today, 4:30 pm |
| electrician | Ashby Electrical | ashby-electrical.example | #F3F6FA / #0B2545 / #FFB703 / #0B2545 | trust | Certified electricians. Fixed quotes within 24 hours. | Tell us about the job and send a photo. We reply with a fixed price, not a guess. | Get a fixed quote | Safety inspection from £120; Consumer unit upgrade, fixed quote; EV charger install from £799 | We reply within 24 hours |
| dental | Bright Square Dental | bright-square-dental.example | #F7FBFA / #12332F / #2A9D8F / #06211D | split | Calm, modern dentistry near you. | New patients welcome. Book online, get reminders by text, and ask questions any time. | Book a check-up | Check-up £55; Hygiene visit £65; Whitening £295 | New patients: appointments this week |
| physio | Move Well Physio | move-well-physio.example | #0F2A24 / #ECF5EF / #A6E36E / #0F2A24 | center | Back to moving well. | Book an assessment online, get your exercise plan by message, and rebook in a tap. | Book an assessment | Assessment £60; Follow-up £45; Sports massage £40 | Next assessment: tomorrow, 9:15 am |
| takeaway | Spice Route Kitchen | spice-route-kitchen.example | #1A0F0A / #FFF1E3 / #FF7A1A / #1A0F0A | split | Order direct. Skip the app fees. | Fresh from our kitchen to your door, or ready for collection in 20 minutes. | Order now | Chicken karahi £9.50; Paneer tikka wrap £6.50; Family feast £24 | Collection in about 20 minutes |
| salon | Atelier Rose | atelier-rose.example | #FBF2F1 / #2B1B22 / #B5446E / #FFFFFF | center | Book the look you've been saving. | Colour, cut and treatments with the stylist you love. Book and pay a deposit online. | Book an appointment | Cut and finish £45; Full colour from £85; Treatment £35 | Next appointment: Thursday, 11:00 am |
The before-mock header colours: barber #7A1F1F, electrician #1A3D7C, dental #2A6B5A (others any dated dark colour).
Slider tabs use barber, electrician and dental. The gallery uses all six. Verify each after-mock's text and background pair meets AA contrast.

## Technical requirements
- Astro + TypeScript, static. Single layout, semantic landmarks (`header`, `main`, sections with `aria-labelledby`, `footer`), one `h1`, skip link.
- Tokens as CSS custom properties. Light, dark (`prefers-color-scheme`) and a manual toggle (`data-theme`), remembered with try/catch localStorage. Give `body` an explicit background.
- Accessibility: WCAG 2.2 AA, visible focus, keyboard-operable slider, tabs and chat chips, `prefers-reduced-motion`, sensible `aria-live`.
- Performance: total JavaScript under about 50 kB, no layout shift, self-hosted subsetted fonts with preload, LCP under 2 seconds on a mid-range mobile, no images except an Open Graph image added later.
- SEO on-page: see `04-seo-plan.md`. JSON-LD (ProfessionalService) skeleton below; use the real domain later and remove the placeholder.
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Duklu Digital",
  "description": "Website redesign, online booking and payments, AI enquiry assistants and local SEO for small businesses in Bradford and West Yorkshire.",
  "email": "gurmanduklu@gmail.com",
  "telephone": "+447988450280",
  "address": { "@type": "PostalAddress", "addressLocality": "Bradford", "addressRegion": "West Yorkshire", "addressCountry": "GB" },
  "areaServed": [
    { "@type": "City", "name": "Bradford" }, { "@type": "City", "name": "Leeds" },
    { "@type": "City", "name": "Halifax" }, { "@type": "City", "name": "Huddersfield" },
    { "@type": "City", "name": "Keighley" }, { "@type": "City", "name": "Shipley" },
    { "@type": "City", "name": "Bingley" }, { "@type": "City", "name": "Ilkley" }
  ],
  "founder": { "@type": "Person", "name": "Gurman Singh Duklu" },
  "sameAs": ["https://github.com/GurmanSinghDuklu", "https://www.linkedin.com/in/gurman-singh-duklu"],
  "url": "REPLACE_WITH_REAL_DOMAIN"
}
```
Only add `aggregateRating`, `review` or similar when real, verifiable reviews exist. Structured data must match visible content.
