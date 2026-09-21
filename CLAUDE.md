# Duklu Digital: project memory

Working name for Gurman Singh Duklu's solo web, AI and local-search studio (Bradford, UK). The name is a placeholder until he chooses one. Keep it in a single config value (`src/config/site.ts`) so it is easy to change.

## Current goal
Build the studio's own marketing website: high-end, fast, local-SEO-ready, with concept before/after renders, services, pricing, credentials, FAQ and a free-audit contact path. Build it in the phases in `docs/08-roadmap.md`. Do not deploy, buy domains or publish anything without asking first.

## Who you are working with
- Gurman, 18, Bradford. Finished a T Level in Digital Production, Design and Development (Calderdale College). Placement at Lloyds Banking Group. Strong in JavaScript, TypeScript, React, Python and Java; comfortable with Git, Docker, REST APIs and Azure DevOps.
- Wants this as his full-time income, not a side job. Wants to grow aggressively but honestly.
- Has no employer, apprenticeship or benefits conflicts. Sole-trader registration is parked until nearer launch (see `docs/05-compliance-and-claims.md`).
- Explain things plainly and show your plan before big changes.

## Hard rules (never break)
1. No invented proof. No fake testimonials, ratings, review counts, client logos, awards, statistics or "as seen in". Concept work is labelled "Concept design for a fictional business" wherever it appears. Fictional domains use `.example`.
2. Credentials appear exactly as listed under "Verified credentials" in `docs/01-business-context.md`. Essence Hair Treatment was built unpaid for his aunt's business: call it "built for a family business", never a paid client. Claude Certified Architect is in progress: show it only as "in progress" until he confirms a pass. The Arm contribution is a submitted pull request unless he says it was merged.
3. No guarantees: not rankings, not Google AI Overviews or ChatGPT recommendations, not sales. State what is done and what is measured.
4. Publish only the contact details listed under "Public contact details". Never publish a home address.
5. UK English, sentence case, plain verbs. Buttons say what happens ("Get your free presence audit").
6. Prices come only from `docs/02-offer-and-pricing.md`. Do not invent, round or add prices.

## Stack (decided)
- Astro + TypeScript, static output.
- Plain CSS with design tokens (custom properties), light and dark themes.
- Self-hosted fonts (`@fontsource`), no Google Fonts requests.
- Small vanilla TypeScript islands only where needed: before/after slider, chat demo, theme toggle.
- No tracking, no cookies, no third-party scripts. Ask before adding any other dependency.
- Project lives in `site/` (Astro app root). Astro 7, TypeScript 6, Node 24.
- Commands (run from `site/`):
  - `npm run dev` — dev server.
  - `npm run build` — static build to `site/dist/`.
  - `npm run preview` — Astro's own preview (a singleton daemon; use `astro preview stop` if a port conflict shows up).
  - `npm run typecheck` — `astro check`.
  - `npm run lint` — ESLint (flat config, astro + typescript-eslint plugins) + `prettier --check`.
  - `npm run format` — `prettier --write .`.
  - `npm run check` — typecheck + lint + build, in one go.
  - `npm run lighthouse` — builds nothing itself (run `build` first); serves `dist/` on a throwaway static server (`scripts/serve.mjs`, not `astro preview`, to avoid its singleton-daemon port issue) and runs Lighthouse headless. Reports land in `reports/lighthouse/`.
  - `npm run axe` — same static-server approach, runs `@axe-core/playwright` against `dist/`, tags `wcag2a wcag2aa wcag22aa`.
  - `npm run screenshots` — Playwright screenshots of `dist/` at 360/768/1280px in light and dark (`colorScheme` emulation), saved to `reports/screenshots/`.
  - Run `npm run build` before `lighthouse`, `axe` or `screenshots` — they all serve the built `dist/`, not the dev server.

## Working agreements
- Plan first with `/plan-site`, get approval, then build one phase at a time with `/build-phase N`.
- After each phase: build, typecheck, Lighthouse (aim for 95+ on all four scores), an axe accessibility check, a keyboard test, a reduced-motion test, and screenshots at 360, 768 and 1280px. Critique the screenshots and fix problems before reporting.
- Make small commits with clear messages. Never commit secrets.
- If a doc and this file disagree, ask. Update the docs when a decision changes.

## Read on demand
`docs/04-seo-plan.md`, `docs/06-go-to-market.md`, `docs/07-vertical-research.md`, `docs/09-open-questions.md`, `reference/`

## Imported context
@docs/01-business-context.md
@docs/02-offer-and-pricing.md
@docs/03-site-spec.md
@docs/05-compliance-and-claims.md
