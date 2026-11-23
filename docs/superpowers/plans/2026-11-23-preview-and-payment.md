# Preview and payment: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parts 3 and 4 of `docs/superpowers/specs/2026-11-23-preview-and-payment-design.md`.
**Architecture:** Worker modules in `site/worker/accounts/` (preview.js, upload.js, payments.js),
migration 0003, account and admin page changes, one laptop script. No new npm dependencies.
**Tech stack:** Cloudflare Workers, D1, R2, Stripe REST API over `fetch`, Web Crypto HMAC.

Runs inline (Mandeep said "Yes, build it"); each task is test-first and committed.

- [ ] 1. Migration 0003; `projectsOf` returns money, preview and stage fields. Tests.
- [ ] 2. `preview.js`: serve `/preview/<id>/…` from R2 to owner/admin, inject bar and noindex, strip
      meta CSP, headers. Test with a fake R2 holding a small site.
- [ ] 3. `upload.js`: bearer-token start / put / finish, version switch, old versions deleted (fake R2
      gains `list`). Tests. `scripts/preview-upload.mjs`.
- [ ] 4. `payments.js`: admin money, deposit, paid by hand, live; client pay (Checkout via injected
      fetch); webhook signature check. Tests.
- [ ] 5. Worker wiring (`/preview/*` in run_worker_first, `/api/upload/*`, `/api/stripe/webhook`),
      seo-check accepts the new entries.
- [ ] 6. Account page (preview ready, pay, paid, live) and admin client page (money, preview base
      path, mark paid, mark live).
- [ ] 7. Legal drafts, docs/10-launch.md (Stripe and upload token steps), CLAUDE.md.
- [ ] 8. Local end-to-end with wrangler dev (upload a sample build, open preview as client and as a
      stranger, pay flow with Stripe off and with a fake webhook), screenshots, axe.
