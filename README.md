# Duklu Digital project package

This folder is a handoff from a long planning conversation in Claude.ai. It gives Claude Code everything it needs to continue: who the business is, what it sells, the agreed prices, the site design and copy, SEO and compliance rules, and the build phases.

## Start here
1. Unzip and open the folder in VS Code (`code duklu-digital`). Run `git init` if you want version control. Keep the repo private: the docs contain personal contact details.
2. Open Claude Code in this folder. It reads `CLAUDE.md` at the start of every session. Check what it loaded with `/memory`.
3. Choose your strongest available model for planning with `/model`.
4. Paste the contents of `FIRST_PROMPT.md`.
5. Answer the blocking questions in `docs/09-open-questions.md`, approve the design plan from `/plan-site`, then run `/build-phase 0`, `/build-phase 1` and so on.

## What is inside
- `CLAUDE.md`: project memory with the hard rules (honesty, credentials, pricing, stack, working agreements). It imports docs 01, 02, 03 and 05.
- `docs/01` business context and verified credentials; `02` offer and pricing; `03` full site spec with copy, design direction and concept data; `04` SEO plan; `05` compliance and claims; `06` go-to-market; `07` vertical research; `08` roadmap; `09` open questions.
- `.claude/commands/`: `/plan-site`, `/build-phase N`, `/honesty-check`, `/seo-audit`.
- `reference/`: the two interactive checklists made earlier.
- `site/`: empty. Claude Code creates the project here or at the repo root.

## Notes
- The website has not been built yet. The design direction in `docs/03-site-spec.md` is a proposal, and `/plan-site` asks Claude Code to review it before any code.
- Claude Code features change. Check the official docs (https://docs.claude.com/en/docs/claude-code/overview) if a command differs.
- Prices are estimates from UK 2026 guides, reduced 25% for introductory pricing. Monthly fees are unchanged.
