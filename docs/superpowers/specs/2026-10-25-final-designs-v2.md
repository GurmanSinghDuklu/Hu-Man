# Final designs v2 (2026-10-25, branch `agency-redesign`)

Gurman supplied seven new page designs (`reference/final-designs-v2/`: home-1, home-2, services,
pricing, about, how-we-build, work) and asked for separate pages where needed, otherwise the content
added to the page it fits.

## Pages
- `/` Home: hero "Got an idea? Let's build it." on the same collage, facts strip, 01 Bringing your
  ideas to life, 02 Pretty isn't enough, 03 Is AI recommending your competitors? (free AI check),
  04 Agentic AI-ready as standard, 05 Everything under one roof (six tiles), 06 Real projects (three
  browser cards), 07 At the centre of it all, 08 Pricing arches, Talk to a human.
- `/services/`: hero, Pretty isn't enough, Bringing your ideas to life, six service cards with "Care
  plan" pills, Projects and care, Agentic AI-ready, At the centre.
- `/pricing/`: nine tiers (Essential £295 added), tier by tier, care plans, FAQ.
- `/about/` (new): mission, four rules, our promise, care plans "coming soon".
- `/how-we-build/` (new): one-prompt site vs Hu/man build, six stages, under the bonnet, go-live
  checklist, ready for what's next.
- `/work/` (new): the three project showcases that were on the home page.
- Nav: Services, Work, Pricing, About, How we build, FAQ, Free audit.

## Shared code
- Sections used on two pages live in `site/src/components/sections/` and take the section number.
- The six service areas are one list in `site/src/data/services.ts` (home tiles and services cards).
- Contact buttons build their email links with `site/src/config/mailto.ts`.

## Kept from the 2026-10-19 decisions (the designs differ)
- No personal name on the pages: "a reply from Gurman" stays "a reply from a real person"; the
  footer copyright is "Hu/man", not his name; no GitHub or LinkedIn in the footer.
- Email is humansoftwareagency@gmail.com, not the address shown in the designs.
- "Most picked" stays "Our pick": nobody has bought yet.
- Eldeva is "Concept design · Not live" on the home cards.

## Need Gurman's confirmation before launch
- The About promises: "we fix our mistakes at no cost", "a real person answers", "no charge for every
  little thing". Customers can hold him to these; they belong in the contract terms too.
- The new service areas (e-commerce, mobile apps, custom software, branding) are on the site without
  prices. Confirm each can be delivered now.
- "Every site passes this checklist" includes AI crawler rules and structured data, while Essential
  is "not agentic AI-ready". Decide whether the checklist covers Essential.
- Essential at £295 (added to docs/02 as a draft).
