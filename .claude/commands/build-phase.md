---
description: Build one phase from docs/08-roadmap.md, run all checks, report.
argument-hint: <phase number>
---
Build Phase $ARGUMENTS from docs/08-roadmap.md.

1. Restate the phase goal and the acceptance checks.
2. Build it, following docs/03-site-spec.md and the hard rules in CLAUDE.md.
3. Run build, typecheck, lint, Lighthouse and an axe accessibility check. Test keyboard use and reduced motion.
4. Take screenshots at 360, 768 and 1280px in light and dark themes. Look at them, critique them and fix what is wrong.
5. Run the honesty check (/honesty-check) on all visible copy.
6. Update CLAUDE.md with any real commands and decisions, then commit.
7. Report: what you built, scores, what you would change, and any question for me.
