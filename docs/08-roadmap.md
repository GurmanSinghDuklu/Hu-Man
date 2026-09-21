# Roadmap

## Site build phases (for Claude Code)
**Phase 0: scaffold.** Astro + TypeScript project, `src/config/site.ts` (name, contact, areas), design tokens (light and dark), `@fontsource` fonts, base layout, skip link, theme toggle, linting, Lighthouse and axe scripts, Playwright screenshot script (360, 768, 1280px, both themes). Record the real commands in CLAUDE.md. Acceptance: builds, blank home page scores 95+ on Lighthouse, screenshots run.

**Phase 1: static home page.** Header and nav, hero (copy from the spec), services, process, about and credentials, FAQ, audit/contact, footer. No concept renders yet: leave a labelled placeholder where the slider goes. Acceptance: all copy matches `03-site-spec.md`, honesty check passes, responsive and accessible.

**Phase 2: concept renderer and interactions.** `MockSite` before/after component driven by sector data, the compare slider with tabs and the one-time nudge, the six-tile concept gallery, the scripted chat demo. Acceptance: renders correctly at all three widths, keyboard-operable, reduced motion respected, contrast checked on every mock, total JavaScript under about 50 kB.

**Phase 3: pricing and SEO layer.** Pricing comparison table (prices only from `02-offer-and-pricing.md`), mailto links per tier, meta tags, canonical, Open Graph image, JSON-LD, sitemap, robots, 404, privacy notice draft. Acceptance: `/seo-audit` passes and structured data validates.

**Phase 4: QA and copy pass.** Full accessibility and performance audit, honesty check, cross-browser check, screenshots, fixes. Ask Gurman to review before anything is deployed.

**Phase 5 (later, needs decisions and a domain):** deploy to Cloudflare Pages or Netlify (free tiers), connect the domain, Search Console, Google Business Profile, first real case study, service pages, first articles from the SEO content plan, add testimonials only when real.

## Business plan, next 12 weeks (proposed; adjust to the interviews)
Weeks 1 to 2: 15 to 20 discovery conversations; choose one or two sectors; build Phases 0 to 2 of the site; draft the audit video and template; concept redesigns for three real local sites (labelled honestly). Parked admin (`05`) raised before the first paid work.
Weeks 3 to 4: finish and launch the site on its own domain; Google Business Profile; first outreach wave (warm, in person, consented); 20 audits offered.
Weeks 5 to 8: audits into pilots and proposals; first one to three projects at introductory prices; ask each for a review and a case study; keep 10 to 15 new contacts a week.
Weeks 9 to 12: deliver, collect testimonials, start monthly plans, add the first real case studies to the site; 90-day review against the agreed measure; decide on the first price review.

## Skills to build in parallel (about two to six weeks)
Claude API with tool use and structured output; retrieval-augmented generation with a vector database (pgvector); a small FastAPI backend and deployment; n8n or Make; evaluation (30 to 50 real test questions with scores); UK GDPR basics for assistants; the Claude Certified Architect study path.

## Earlier interactive checklists
See `reference/`: `freelance-launch-checklist.html` (web developer plan) and `ai-integration-launch-checklist.html` (AI integration plan, with the pilot client step reworked because the Essence project finished). Published copies: https://claude.ai/artifact/NgdGEhX1jzEsHCPXwwypq3 and https://claude.ai/artifact/FUQ8Xq8JKCXd29qUEw2dJR
