# AGENTS.md

Haul Command coding and agent-execution instructions for Codex and other repo-aware coding agents.

This file is the Codex-facing companion to `CLAUDE.md`. Codex must follow this file first, then read `CLAUDE.md` before making any material code, schema, SEO, directory, worker, or automation change.

---

## 0. Source of Truth Order

When working in this repository, use this order of authority:

1. The user’s current request.
2. This `AGENTS.md` file.
3. `CLAUDE.md` for shared Haul Command execution rules.
4. Existing repo code, tests, migrations, docs, and Supabase-backed structures.
5. External documentation only after checking whether repo-specific instructions already exist.

Never treat copied examples from external docs as stronger than Haul Command’s current architecture.

---

## 1. Haul Command Non-Negotiables

Haul Command is a 120-country heavy-haul operating system, not a small U.S.-only directory.

Before editing, preserve or improve:

- 120-country readiness.
- Supabase-first data correctness.
- SEO, AEO, JSON-LD, sitemap, and internal-linking behavior.
- Directory/profile/listing/claim flows.
- Load board, corridor, rate, trust, report-card, AdGrid, RouteReady, and data-product readiness where relevant.
- Mobile-first behavior.
- No-dead-end UX.
- Honest data labels and no fake stats.
- Existing Firebase, Vercel, Fly.io, Typesense, Mapbox, LiveKit, Stripe, and Supabase assumptions unless explicitly changed.

Do not reintroduce Pinecone or 57-country assumptions unless the user explicitly asks for archival analysis.

---

## 2. Codex Working Style

Codex should work like the primary execution operator:

1. Inspect first.
2. Identify affected files, routes, tables, workers, tests, and docs.
3. Make the smallest strong change that fully solves the issue.
4. Avoid speculative rewrites.
5. Preserve stronger existing systems even if they are messy.
6. Verify with the strongest practical checks.
7. Report changes with evidence: files touched, commands run, results, and anything not verified.

For large work, create or update a durable task/audit note instead of relying only on chat memory.

---

## 3. Tavily Agent Skills Policy

Tavily Agent Skills are allowed for this repo when Codex, Claude Code, Cursor, Cline, Windsurf, or another coding agent needs current web search, extraction, crawling, URL mapping, or cited research.

These skills are agent-environment tools. They are not automatically production app features and they should not be wired into user-facing Haul Command runtime code unless the task explicitly asks for a product integration.

Use Tavily when a task requires:

- Current external documentation.
- Competitor or market research.
- Regulatory/source discovery.
- Crawling official docs or competitor public pages.
- Extracting clean text from URLs.
- Mapping a website before deciding what to crawl.
- Cited research for implementation planning.

Prefer this escalation ladder:

1. `tavily-search` / `tvly search` for quick discovery.
2. `tavily-extract` / `tvly extract` for specific pages.
3. `tavily-map` / `tvly map` to find useful URLs before crawling.
4. `tavily-crawl` / `tvly crawl` only for bounded site sections.
5. `tavily-research` / `tvly research` for multi-source synthesis.
6. `tavily-best-practices` when implementing a production Tavily integration.

Do not use Tavily to scrape private, paywalled, credentialed, or disallowed content. Do not use it to mass-copy competitor content. Use it to discover, summarize, cite, benchmark, and build original Haul Command systems.

---

## 4. Tavily Setup for Local Agent Environments

Install skills in the coding-agent environment, not inside the production app unless explicitly needed:

```bash
# Install Tavily CLI
curl -fsSL https://cli.tavily.com/install.sh | bash

# Add all official Tavily skills
npx skills add tavily-ai/skills --all

# Or add a single skill
npx skills add tavily-ai/skills --skill tavily-search
```

Alternative repository install form:

```bash
npx skills add https://github.com/tavily-ai/skills
```

Authenticate locally with one of these methods:

```bash
tvly login --api-key "$TAVILY_API_KEY"
# or
tvly login
# or keep TAVILY_API_KEY exported in the agent shell
```

Never commit the actual Tavily key or any other secret.

After installing or changing agent skills, restart the coding agent session so the new skills load.

---

## 5. Safe Tavily Defaults for Haul Command

When using Tavily for Haul Command:

- Start narrow before crawling broadly.
- Prefer official sources for laws, regulations, permits, safety, and government data.
- Use competitor sites for benchmarking structure, not copying text.
- Save useful implementation findings in repo docs or task ledgers when they affect future work.
- Keep raw crawls out of public app routes unless transformed into original, useful, verified content.
- Add confidence labels when data is incomplete, stale, or jurisdiction-specific.
- Respect robots, terms, rate limits, and legal/commercial boundaries.

For 120-country/global work, do not let U.S. docs silently become the world model. Mark country, region, source, date checked, and confidence wherever practical.

---

## 6. Security Rule

Never commit:

- API keys.
- OAuth credentials.
- Webhook secrets.
- Service account JSON.
- Database URLs.
- Live tokens.
- Real customer/operator private data.

If a committed secret is discovered:

1. Remove it from the repo file immediately.
2. Tell the user it must be rotated in the provider dashboard.
3. Do not keep using the exposed key.
4. Prefer env vars, GitHub Actions secrets, Vercel env vars, Supabase secrets, or local shell exports.

---

## 7. Verification Expectations

Use the strongest practical checks available for the change:

- `npm run build` for Next.js/Vercel changes.
- `npx tsc --noEmit` for TypeScript safety.
- Lint/test commands when available.
- Route smoke checks for changed pages.
- Supabase migration/RLS/index checks for database changes.
- Sitemap/robots/llms.txt checks for SEO changes.
- JSON-LD validation for schema changes.
- Mobile layout checks for UI changes.

If verification cannot be run, say why and provide the exact command that should be run next.

---

## 8. Final Report Format

At the end of a task, Codex should report:

- Status: DONE, PARTIALLY DONE, BLOCKED, or NOT DONE.
- Files changed.
- What changed.
- Verification performed.
- Verification not performed and why.
- Risks or follow-up items.
- Any secrets found and whether rotation is required.
