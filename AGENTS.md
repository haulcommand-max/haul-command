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

## 6. Firecrawl Agent Skills Policy

Firecrawl Agent Skills are allowed for this repo when Codex, Claude Code, Cursor, Cline, Windsurf, or another coding agent needs search, scraping, interaction, crawl, map, docs-search, or repeatable web-data deliverables.

Firecrawl has three separate usage modes. Pick the correct mode before doing work:

| Mode | Use when | Where the work runs |
| ---- | -------- | ------------------- |
| Live CLI tools | The agent needs web data during the current session. | Agent terminal/session |
| Build skills | The task is to add Firecrawl API calls to Haul Command product code. | Product code/backend/workers |
| Workflow skills | The task is to produce a finished artifact such as a research brief, SEO audit, lead list, QA report, knowledge base, competitive intel digest, or design analysis. | Agent session/artifact output |

Do not confuse these modes. Running `firecrawl scrape` during a coding session is not the same thing as wiring Firecrawl into Haul Command runtime code.

---

## 7. Firecrawl Setup for Local Agent Environments

Install Firecrawl skills in the coding-agent environment, not inside the production app unless the task explicitly asks for a product integration:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

This installs the Firecrawl CLI, CLI skills, build skills, workflow skills, and browser authorization flow.

Verify the install before doing real web work:

```bash
mkdir -p .firecrawl
firecrawl --status
firecrawl scrape "https://firecrawl.dev" -o .firecrawl/install-check.md
```

Never commit `.firecrawl` output unless the user explicitly asks for a durable research artifact and the content is safe, original, and appropriate for the repo.

Never commit `FIRECRAWL_API_KEY` or any other secret. Keep it in local shell exports, Vercel env vars, GitHub Actions secrets, Supabase secrets, or another approved secret store.

---

## 8. Firecrawl Path Selection

Use this routing logic:

### Path A: Live Web Tools

Use when the agent needs web data during the current task:

- `firecrawl search` for discovery.
- `firecrawl scrape` when a URL is known.
- `firecrawl interact` when a page requires clicks, forms, or navigation.
- `firecrawl crawl` for bounded bulk extraction.
- `firecrawl map` for URL discovery.
- `firecrawl ask` when a Firecrawl job fails or returns unexpected output.
- `firecrawl docs-search` for Firecrawl implementation questions grounded in current docs.

Default flow: search first when discovery is needed, scrape known URLs, interact only when plain extraction is not enough, and use `firecrawl ask` with the failing job ID instead of guessing when a Firecrawl job fails.

### Path B: Product Integration

Use when the user wants Firecrawl built into Haul Command app code, backend services, scripts, agent loops, or pipelines.

Before writing code, answer: **What should Firecrawl do in the product?**

Route the implementation to the matching API capability:

- `/search` for query-led discovery.
- `/scrape` for known URL extraction.
- `/interact` for browser actions.
- `/parse` for local or non-public documents where appropriate.
- `/crawl` for bounded site extraction.
- `/map` for URL discovery.

For product integration, inspect the existing repo first, use the existing API/secrets conventions, store `FIRECRAWL_API_KEY` safely, and run one real smoke test when possible.

### Path C: Repeatable Deliverables

Use when the goal is a finished artifact powered by Firecrawl web data, not product code.

Examples:

- Research brief.
- SEO audit.
- Lead list.
- QA report.
- Knowledge base.
- Competitive intelligence digest.
- Design clone/analysis.

Default workflow: confirm the deliverable, collect traceable web evidence, run independent research units in parallel when available, synthesize the deliverable, and include a rerun-inputs block if the workflow could become repeatable automation.

### Path D: Authorization or API Key

Use when the human still needs to create an account, sign in, authorize access, or provide an API key.

If a valid `FIRECRAWL_API_KEY` already exists in the local agent/session environment, skip this path. If not, use the browser auth flow from the Firecrawl CLI setup or ask the human to authorize/provide the key.

### Path E: REST API Without Installing Skills

Use only when the agent environment cannot install the CLI/skills but can make direct authenticated API requests.

Base URL:

```text
https://api.firecrawl.dev/v2
```

Auth header:

```text
Authorization: Bearer $FIRECRAWL_API_KEY
```

Supported capabilities include `/search`, `/scrape`, `/interact`, `/support/ask`, and `/support/docs-search`.

---

## 9. Safe Firecrawl Defaults for Haul Command

When using Firecrawl for Haul Command:

- Start with search or map before crawl unless the exact URL set is known.
- Keep crawls bounded by domain, path, page count, and purpose.
- Prefer official sources for regulations, permits, public safety, government rules, and compliance.
- Use competitor sites for benchmarking structure and gaps, not copying language or assets.
- Do not scrape private, paywalled, credentialed, disallowed, or legally sensitive content.
- Do not store raw scraped competitor content in public routes.
- Transform findings into original, useful Haul Command tools, pages, audits, and workflows.
- Preserve source URLs, date checked, jurisdiction, and confidence labels when findings affect product logic or content.
- For 120-country work, do not let U.S. results silently define the global model.

If Firecrawl output is used for SEO, AEO, directories, regulations, glossary, training, tools, or data products, verify that the result passes the Haul Command no-thin-content, no-fake-stats, global-readiness, and commercial-surface rules.

---

## 10. Security Rule

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

## 11. Verification Expectations

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

## 12. Final Report Format

At the end of a task, Codex should report:

- Status: DONE, PARTIALLY DONE, BLOCKED, or NOT DONE.
- Files changed.
- What changed.
- Verification performed.
- Verification not performed and why.
- Risks or follow-up items.
- Any secrets found and whether rotation is required.
