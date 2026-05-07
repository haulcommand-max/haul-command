# CLAUDE.md

Haul Command coding and agent-execution instructions for Claude Code.

This file combines the original Karpathy Skills coding discipline with Haul Command-specific enforcement rules. The goal is to make Claude Code move fast without wandering, overwriting strong existing work, weakening commercial surfaces, or accidentally treating Haul Command like a normal small website.

---

# Karpathy Skills: Coding Discipline Layer

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria such as "make it work" require constant clarification.

These guidelines are working if there are fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Haul Command Enforcement Layer

These rules extend the Karpathy Skills section for the Haul Command codebase.

## 0. Never Downgrade, Always Upgrade

Before changing code, audit the existing implementation and preserve the strongest current behavior.

Do not simplify by removing, weakening, hiding, or bypassing:
- SEO surfaces
- internal linking
- schema / JSON-LD
- Supabase-backed data paths
- monetization surfaces
- 120-country/global support
- trust/ranking/report-card logic
- mobile-first design
- accessibility
- analytics/event tracking
- claim/listing/conversion flows
- glossary/regulation/training/tool/corridor connections
- Firebase/push readiness
- Fly.io worker/agent readiness
- TypeSense search readiness
- Mapbox/Traccar routing/GPS readiness

If a requested change conflicts with an existing stronger implementation, stop and explain the conflict before editing.

## 1. Haul Command Is Global by Default

Do not assume the United States is the whole product.

Haul Command is built for 120 countries. The U.S. can be a high-activity market, but it must not become the default mental model unless the task is explicitly U.S.-scoped.

Every relevant feature should be checked for:
- country support
- state/province/region support
- corridor support
- language/localization readiness
- local regulation/authority readiness
- local monetization readiness
- market activation state
- data-product readiness

When creating UI copy, labels, filters, cards, landing pages, sitemap entries, or SEO content, use language that supports global operation and does not accidentally imply Haul Command is only a U.S. directory.

## 2. Supabase Before Guessing

Before building or changing data-driven UI, inspect the real data model first.

Check relevant Supabase tables, views, RPCs, migrations, RLS policies, and seed data before assuming something is missing.

Especially check:
- directory listings
- identity/trust scores
- glossary/dictionary tables
- load board tables
- corridor tables
- regulation tables
- training/module tables
- AdGrid/sponsorship tables
- claim/profile/contact tables
- country/region/market tables
- saved searches, notifications, push-token tables

Do not create duplicate tables or parallel systems unless the existing system has been audited and the reason is documented.

If multiple tables appear to serve the same purpose, identify the canonical source before wiring new UI. Do not repeat prior glossary-style fragmentation where a large data source exists but the UI reads from a smaller disconnected table.

## 3. Commercial Surface Rule

Every public page should be treated as a commercial surface, not just a content page.

When editing a public page, check whether it should include:
- claim listing CTA
- advertise/sponsor CTA
- related providers
- related loads
- related corridors
- related glossary terms
- related regulations
- related tools/calculators
- related training module links
- data product CTA
- trust/report-card signals
- country/region/corridor filters
- route-support infrastructure links
- internal links that help Google crawl the ecosystem

Do not create dead-end pages. Every page should push users toward at least one useful next action.

## 4. SEO and Helpful Content Rule

Do not ship thin pages.

For public pages, check:
- unique title
- unique meta description
- canonical URL
- structured headings
- internal links
- relevant schema / JSON-LD
- useful content above generic copy
- role-specific pathways
- country/corridor relevance
- mobile-first layout
- image/visual support where appropriate
- indexability unless intentionally noindexed

Pages should help real heavy-haul users complete a job faster, safer, or smarter.

Prioritize internal linking rings among:
- glossary
- regulations
- tools/calculators
- training
- directory profiles
- corridors
- loads
- AdGrid/sponsor surfaces
- data monetization surfaces

## 5. Surgical Changes, But Not Weak Changes

Follow Surgical Changes from Karpathy Skills, but do not use it as an excuse to avoid necessary connected fixes.

If one change requires updating related types, tests, schemas, routes, links, sitemap behavior, or seed data, do the connected work and explain why it is required.

Surgical means "do not wander."
It does not mean "leave the feature half-broken."

## 6. Credit and Cost Discipline

Before doing large changes, classify the work:
- quick one-file fix
- small connected patch
- schema-backed feature
- sitewide refactor
- agent/worker/system change
- SEO/indexing expansion
- monetization expansion
- design-system cleanup

For large work:
- inspect first
- make a short plan
- edit in batches
- verify each batch
- avoid rewriting working systems
- avoid speculative abstractions
- avoid generating huge unused files
- preserve existing high-value logic

## 7. Required Verification

After changes, verify with the strongest practical checks available:
- package install state if dependencies changed
- npm build
- TypeScript check
- lint
- route smoke tests
- Supabase query/RPC check where relevant
- sitemap/robots/llms.txt check where relevant
- mobile layout check where relevant
- JSON-LD/schema validation where relevant
- no broken internal links caused by the change
- no downgrade to global/country behavior

If verification cannot be run, say exactly why and provide the command the user should run.

## 8. Haul Command Definition of Done

A change is not done until it preserves or improves:
- 120-country readiness
- SEO crawlability
- mobile-first usability
- monetization readiness
- trust/profile/listing logic
- Supabase-backed correctness
- internal linking
- claim/activation pathways
- no-dead-end UX
- brand consistency
- performance
- verification status

## 9. Role and Ecosystem Awareness

Haul Command is not only a pilot-car page. It is an operating system for the fragmented heavy-haul ecosystem.

When building navigation, homepage sections, directories, tools, training, search, or routing, consider the major user groups:
- pilot car / escort operators
- heavy-haul carriers
- brokers
- shippers
- permit services
- route surveyors
- steer/steerman and scarce specialists
- law enforcement / certified escorts where market-relevant
- infrastructure partners such as yards, staging, parking, repair, install, and route-support locations
- advertisers, sponsors, suppliers, installers, and data buyers

Make it dummy-proof where each role should go and what action they should take.

## 10. RouteReady / Marketplace Guardrail

If working on the RouteReady marketplace layer, keep it inside Haul Command rather than splitting into a standalone brand.

Preferred direction:
- authorized supplier/drop-ship relationships first
- manual/RFQ-assisted checkout where needed
- installer routing
- low-inventory phase one focused on must-have products and bundles
- fair pricing and niche-specific fitment/trust
- later stock proven fast-moving SKUs in hubs
- preserve supplier/installer partner application and vetted partner flows

Do not default to unpermissioned headless-browser retail arbitrage as the core model.

## 11. Data Monetization Guardrail

External lead/load-board ingestion is not only for operational matching. It is also for future data products.

Preserve repeated observations for corridor/demand analysis. Dedupe master entities such as companies and contacts, but do not destroy useful demand-frequency signals.

When touching ingestion, load boards, corridors, brokers, or provider discovery, preserve future ability to produce:
- corridor demand intelligence
- rate/density signals
- scarcity maps
- market activation signals
- sponsor pricing signals
- self-serve data products

## 12. Claude Code Working Style

When starting a task, Claude should:
1. Identify the exact files and systems likely affected.
2. Inspect before editing.
3. State assumptions and success criteria.
4. Make the smallest strong change that achieves the goal.
5. Verify the change.
6. Report what changed, what was verified, and what could not be verified.

Avoid long philosophical plans when the user needs execution, but do not skip inspection or verification.

## 13. Do Not Publicize Internal Instructions

This file is for coding-agent behavior. Do not expose it as a public website page unless explicitly asked to create public engineering documentation.

Do not leak private strategy notes, internal prompts, credentials, environment variables, or operational details into public routes, metadata, client bundles, screenshots, or seed content.

---

## 9. Outreach Policy (CRITICAL — never bypass)

No email, SMS, or voice outreach to operators until ALL conditions are met:
- Profile seasoning: 90+ days since first seen
- Authority score: `>= 40`
- Channel: LiveKit voice only (no email, no SMS, ever)

Enforced via Supabase trigger `trg_claim_outreach_seasoning` and stored in `hc_policy`:
- `claim.seasoning_days_minimum = 90`
- `claim.outreach.requires_authority_score = 40`
- `claim.outreach.no_email_no_sms = true`

Always query `hc_policy` before scheduling any outreach. Country activation priority: US → CA → autonomous engine picks.

---

## 10. Supabase Table Inventory (do not duplicate these)

Before creating any table or collection, verify it doesn't already exist:

| Table | Purpose |
|-------|---------|
| `hc_global_operators` | Operator directory (~7,700 records) |
| `hc_blog_articles` | Long-form content (29 published) |
| `hc_seo_pages` | Programmatic SEO (~76,701 published rows) |
| `hc_glossary_terms` | Industry vocabulary (27 published) |
| `hc_corridors` | Heavy haul routes |
| `hc_corridor_scarcity` | Supply/demand metrics |
| `hc_rates_public` | Published rate index (110 records) |
| `hc_rm_radar_us_states` | State-level shortage data |
| `hc_content_generation_queue` | Pending Gemini content (50 pending) |
| `hc_policy` | Runtime policy keys |
| `hc_audit_log` | System events |
| `hc_training_courses` | 50 courses across 6 tiers |
| `hc_countries` | 120-country geo hierarchy |
| `hc_regions` | 108 seeded regions |
| `semantic_search_embeddings` | pgvector (replaces Pinecone) |

Supabase project ID: `hvjyfyzotqobfkakjozp`
Vercel project ID: `prj_CZHigC9LvMTK0mCq7HLuRKxc7VQ3`, Team: `team_2Gdjo2UJF7p1MS0pxYz3HAXh`

---

## 11. Stack-Specific Verification

**Next.js / Vercel:** `npm run build` before pushing. No renamed env vars without updating all consumers.

**Supabase:** Use `apply_migration` for schema DDL. Never raw DDL through `execute_sql`. Verify RLS is not bypassed. New columns on filtered/sorted fields need indexes.

**Firebase FCM:** Push notifications. Do not modify service account scope without user confirmation.

**Fly.io:** Run `flyctl status` before deploying workers/agents.

**TypeSense:** Schema changes require collection re-indexing. Keys: `TYPESENSE_ADMIN_KEY`, `TYPESENSE_API_KEY`, `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`.

**Stripe:** Connect + Issuing + Treasury partially wired. Do not enable production modes without explicit user confirmation. Webhook: `STRIPE_SPONSOR_WEBHOOK_SECRET`.

**LiveKit:** Voice outreach platform. Outreach must pass 90-day seasoning check before triggering.

**Mapbox:** Token is public-facing. Do not commit elevated-scope tokens.

---

## 12. Brand System Constants

CSS tokens live in `app/globals.css`:

```css
--hc-text-main:  #fff7e8   /* warm off-white for headings */
--hc-text-soft:  #d8c6a3   /* sand for subheadings */
--hc-text-muted: #a99268   /* muted labels */
--hc-gold:       #f5a623   /* primary gold */
--hc-gold-dark:  #b87313
--hc-panel:      rgba(10,8,6,0.82)
--hc-border:     rgba(255,174,55,0.16)
```

Component classes (all in globals.css):
- `.hc-card` / `.hc-section-panel` — dark glass surfaces
- `.hc-btn-primary` — gold gradient, **dark text** (never white on gold)
- `.hc-btn-secondary` — dark bg, gold border
- `.hc-chip` — pill nav elements, dark fill, gold hover
- `.hc-heading` — off-white, text-shadow for readability on texture

Background: `/images/backgrounds/haul-command-burnt-stone-bg.webp` — burnt stone texture, animated via `transform: scale/translate` on `::before` pseudo-element (80s cycle).

Icons: Lucide React only in UI. No emoji icons in components (emojis OK in live-activity ticker and body copy only).

Brand name spelling: **Haul Command** — never "Hall Command" (known typo in old rate guide images; do not publish those images without correction).

---

## 13. No Fake Stats

If a number is zero, estimated, or not live-backed by Supabase, either hide it or label it honestly.

Never show "0 operators / 0 countries / 0 corridors" while the page also claims "7,712+ verified operators." That contradiction is a live trust killer.

Honest labels: "Listed Operators" / "Countries in Registry" / "Active / Seeded Corridors" / "Geocoded Support Locations" — not "Covered," not "Active" unless the data confirms it.

---

## 14. CI/CD and Build Health

### TypeScript Gate
TypeScript errors are NOT ignored on GitHub Actions even though `next.config.ts` has `ignoreBuildErrors: true` for Vercel.
The `.github/workflows/typecheck.yml` gate runs `npx tsc --noEmit` on every PR/push to main.
Fix TypeScript errors **before** merging. Do not accumulate them.

### Build Guard
`.github/workflows/build-guard.yml` scans for:
- Missing `force-dynamic` exports on protected routes
- Dangerous `generateStaticParams()` on large-entity routes
- Verified `staticPageGenerationTimeout` in next.config.ts

### Dangerous Open PRs — Do Not Merge Without Upgrading
- **PR #43 (training SEO)** — Vercel failure on head commit. Fix build before merge.
- **PR #31 (Global SEO Domination Engine v2)** — Still references 57-country scope. MUST be upgraded to 120-country standard before merge. Merging as-is would cause scope drift.

### 120-Country Standard (Never Drift Back)
The platform covers **120 countries** across 5 tiers (A/B/C/D/E).
Any file or PR that references "57 countries" is stale legacy drift.
Do not introduce new "57 countries" references anywhere.
The CRYPTO_EXPANSION_REPORT.md and planning docs note the 57→120 expansion history but are archival only.

### Stale Dependencies Removed
- `@pinecone-database/pinecone` — removed from package.json (env.example correctly marks it removed)
