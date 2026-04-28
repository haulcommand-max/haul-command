# Haul Command — Claude Code Operating Manual

This file governs how Claude Code behaves in the Haul Command repository. It is read by Claude Code on every session. Public users do not see it.

Structure:
1. Karpathy Skills — base coding discipline
2. Haul Command — product, SEO, monetization, and platform enforcement
3. Stack-specific verification rules
4. Never downgrade / always upgrade enforcement
5. Definition of done

---

## 1. Karpathy Skills — Base Coding Discipline

These four rules apply to every coding task, every time. They exist to prevent assumption-driven, sprawling, sloppy, or speculative changes.

### 1.1 Think Before Coding

Before writing or editing code, state:
- What the user actually asked for, in one sentence.
- What is already true about the codebase that affects the answer.
- What the smallest correct change looks like.
- What could break if you change it.

If any of those are unknown, inspect the relevant files first. Do not guess. Do not invent file paths, function signatures, table names, env vars, or library APIs. Read what exists.

If the request is ambiguous, ask one tight clarifying question. Do not start coding on a guess.

### 1.2 Simplicity First

Pick the smallest change that solves the problem.

Avoid:
- Speculative abstractions
- New utilities that wrap one-line operations
- New config layers
- New dependencies when an existing one works
- Premature generalization
- Refactoring code that was not asked about

Add complexity only when the simple version is demonstrably wrong, not because the complex version "feels more correct."

### 1.3 Surgical Changes

Touch only what the task requires. Do not "tidy up" unrelated files in the same commit. Do not rename, reformat, or restructure code that is not part of the task. Do not delete code "because it looks unused" without verifying it is actually unused.

If a related file genuinely must change to make the requested change correct (types, imports, schemas, tests, links), make that change and explain why in the commit message.

Surgical does not mean leaving the feature half-broken. Surgical means not wandering.

### 1.4 Goal-Driven Execution

Every action serves the stated goal. If, mid-task, you discover an unrelated bug, do one of two things:

1. Note it for the user to address separately.
2. Address it only if it blocks the original goal, and say so explicitly.

Do not silently expand scope. Do not hide unrelated changes inside an in-scope diff.

### 1.5 Verify, Then Confirm

After making changes, verify with the strongest check available in this environment:
- TypeScript compilation
- Lint
- Build
- Targeted runtime check (Supabase query, route smoke test)
- Manual diff review

If verification cannot be run, say exactly which check could not run and what command the user should run.

Do not declare success on faith.

---

## 2. Haul Command Enforcement Layer

These rules extend Karpathy Skills with Haul Command product reality. The base layer prevents bad coding. This layer prevents bad product decisions.

### 2.1 Never Downgrade, Always Upgrade

Before changing code, audit the existing implementation and preserve the strongest current behavior.

Do not simplify by removing:
- SEO surfaces (titles, descriptions, canonical URLs, schema, sitemaps, robots.txt, llms.txt)
- Internal linking (cross-page links, breadcrumbs, related-content blocks)
- Schema / JSON-LD (Organization, WebSite, FAQPage, Service, Course, ItemList, BreadcrumbList, ProfilePage, LocalBusiness, SoftwareApplication, Dataset)
- Supabase-backed data paths (RLS, RPCs, views, indexes, triggers, policies)
- Monetization surfaces (AdGrid placements, sponsorships, claim CTAs, Pro upsells, training paywalls)
- Country / global support (120-country tier system, hreflang, country selectors)
- Trust / ranking logic (trust scores, authority scores, verification fields, claim seasoning)
- Mobile-first design
- Accessibility (ARIA, prefers-reduced-motion, keyboard nav)
- Analytics / event tracking (PostHog, GTM, custom events)
- Claim / listing / conversion flows
- Glossary / regulation / training / tool / corridor connections

If a requested change conflicts with stronger existing implementation, stop and explain the conflict before editing.

### 2.2 Haul Command Is Global by Default

The United States is a high-activity market. It is not the whole product.

Every relevant feature must be checked for:
- Country support (Tier A through Tier E, 120 countries total)
- State / province / region support
- Corridor support (national and cross-border)
- Language / localization readiness
- Local regulation / authority readiness
- Local monetization readiness
- Market activation state (live, indexed, developing, upcoming)

When labeling a feature as "Popular X" or "Top X," verify whether X is genuinely the scope or whether it should read "United States X — part of our 120-country registry" or similar honest framing.

### 2.3 Supabase Before Guessing

Before building or changing data-driven UI, inspect the real data model.

Always check:
- Relevant table columns and types
- Existing RLS policies
- Existing RPCs
- Migrations history
- Seed data presence
- Index coverage on filtered/sorted columns

Tables that exist (do not duplicate, do not parallel-build):
- `hc_global_operators` — operator directory
- `hc_blog_articles` — long-form content
- `hc_seo_pages` — programmatic SEO surfaces (~76,701 rows)
- `hc_glossary_terms` — industry vocabulary
- `hc_corridors` — heavy haul routes
- `hc_corridor_scarcity` — supply/demand metrics
- `hc_rates_public` — published rate index
- `hc_rm_radar_us_states` — state-level demand/supply
- `hc_content_generation_queue` — pending Gemini-generated content
- `hc_policy` — runtime policy keys (90-day seasoning, authority score gates)
- `hc_audit_log` — system events
- `hc_training_courses` — 50 seeded courses across 6 tiers
- `hc_countries`, `hc_regions` — geo hierarchy
- `semantic_search_embeddings` — pgvector replaces Pinecone

If the table you need does not exist, propose a migration before writing code that depends on it. Do not create duplicate or parallel tables.

### 2.4 Outreach Policy (CRITICAL — never bypass)

No email, SMS, or voice outreach to operators until:
- Profile has 90+ days seasoning
- AND `authority_score >= 40`
- AND outreach channel is LiveKit voice only

Stored in `hc_policy`:
- `claim.seasoning_days_minimum=90`
- `claim.outreach.requires_authority_score=40`
- `claim.outreach.no_email_no_sms=true`

Enforced via trigger `trg_claim_outreach_seasoning`. Always check `hc_policy` before scheduling any outreach.

Country priority for activation: US first, then CA, then autonomous engines pick.

### 2.5 Commercial Surface Rule

Every page is a commercial surface, not just a content page.

When editing or creating a page, check whether it should include:
- Claim listing CTA
- Advertise / sponsor CTA
- Related providers
- Related loads
- Related corridors
- Related glossary terms
- Related regulations
- Related tools / calculators
- Training module links
- Data product CTA
- Trust / report-card signals
- Country / region / corridor filters
- Internal links that help Google crawl the ecosystem

Do not create dead-end pages.

### 2.6 SEO and Helpful Content Rule

Do not ship thin pages.

For public pages, verify:
- Unique title (no duplicate "Haul Command | Haul Command")
- Unique meta description
- Canonical URL
- Single H1, structured H2/H3 hierarchy
- Internal links to related pages
- Relevant schema / JSON-LD
- Useful content beyond generic copy
- Role-specific pathways
- Country / corridor relevance
- Mobile-first layout
- Image / visual support where appropriate
- Indexable unless intentionally noindexed
- No "Coming soon" placeholder content shipped as live pages

Pages must help real heavy-haul users complete a job faster, safer, or smarter.

### 2.7 No Fake Stats

If a stat is zero, unknown, or not backed by a live data source, hide it or label it honestly. Do not show "0 operators / 0 countries / 0 corridors" while elsewhere claiming "7,712+ verified operators" — that contradiction destroys trust.

When numbers are not yet verified, use honest labels: "Listed Operators," "Countries in Registry," "Active / Seeded Corridors," "Geocoded Support Locations." Never say "Covered" when it's "in registry."

### 2.8 Brand Consistency

- Brand name: **Haul Command** (never "Hall Command" — typo found in earlier rate guide images, never use them publicly without correction)
- Background system: burnt stone texture (`/images/backgrounds/haul-command-burnt-stone-bg.webp`) + amber glow + slow drift
- Brand tokens (CSS variables in `app/globals.css`): `--hc-text-main #fff7e8`, `--hc-text-soft #d8c6a3`, `--hc-text-muted #a99268`, `--hc-gold #f5a623`, `--hc-gold-dark #b87313`, `--hc-panel rgba(10,8,6,0.82)`, `--hc-border rgba(255,174,55,0.16)`
- Component classes: `.hc-card`, `.hc-section-panel`, `.hc-btn-primary` (gold gradient + dark text), `.hc-btn-secondary`, `.hc-chip`, `.hc-heading`
- Icons: Lucide React only. No emoji icons in UI components (emojis acceptable in body text and activity ticker only).
- CTAs: never white text on gold — always dark text on gold gradient via `.hc-btn-primary`.

---

## 3. Stack-Specific Verification Rules

When changes touch these systems, verify accordingly.

**Next.js / Vercel:**
- Verify build does not break with `npm run build` or `vercel build`
- Check that no Vercel env var was renamed without updating consumers
- Project ID: `prj_CZHigC9LvMTK0mCq7HLuRKxc7VQ3`, Team: `team_2Gdjo2UJF7p1MS0pxYz3HAXh`

**Supabase:**
- Project ID: `hvjyfyzotqobfkakjozp`
- Use `apply_migration` for schema changes (never bare DDL through `execute_sql`)
- Verify RLS policies are not bypassed
- Check that new columns are indexed if filtered/sorted

**Firebase FCM:**
- Used for push notifications. Do not modify notification topics or service account scope without explicit user confirmation.

**Fly.io:**
- Hosts `hc-twenty-crm`, voice agent workers, and other long-running services
- Do not deploy without `flyctl status` check first

**TypeSense:**
- Powers search autocomplete
- Schema changes require collection re-indexing

**Mapbox:**
- Token is public-facing (`NEXT_PUBLIC_MAPBOX_TOKEN`)
- Do not commit tokens with elevated scopes; verify token type before edits

**Stripe:**
- Connect, Issuing, Treasury are partially wired. Do not enable production capabilities without user confirmation.
- Webhook secret: `STRIPE_SPONSOR_WEBHOOK_SECRET`

**LiveKit:**
- Voice outreach platform — outreach must respect 90-day seasoning policy

---

## 4. Credit and Cost Discipline

Before large changes, classify the work:
- Quick one-file fix
- Small connected patch
- Schema-backed feature
- Sitewide refactor
- Agent / worker / system change
- SEO / indexing expansion
- Monetization expansion

For anything beyond a quick fix:
1. Inspect first (read the existing implementation)
2. State a short plan
3. Edit in batches
4. Verify each batch
5. Avoid rewriting working systems
6. Avoid speculative abstractions
7. Avoid generating huge unused files

If a task would burn significant tokens regenerating files that already work, stop and ask whether to proceed.

---

## 5. Definition of Done

A change is not done until all of the following are preserved or improved:

- Global 120-country readiness
- SEO crawlability (title, meta, canonical, schema, internal links)
- Mobile-first usability
- Monetization readiness (claim CTAs, ad surfaces, sponsorships, Pro upsells)
- Trust / profile / listing logic intact
- Supabase-backed correctness (no broken RPCs, no orphaned tables)
- Internal linking density preserved or improved
- Claim / activation pathways unbroken
- No dead-end UX
- Brand consistency (texture, tokens, components, icons, CTAs)
- Performance (no LCP regression, no jank, no layout shift)
- Verification status reported honestly

If any of these are unverified, say so explicitly. Do not declare done on faith.

---

## 6. When in Doubt

- **Ask, don't guess.** One tight clarifying question is cheaper than 30 minutes of wandering.
- **Read, don't assume.** Open the file. Check the table. Verify the route exists.
- **Inspect, don't invent.** No fake imports, fake table names, fake env vars, fake function signatures.
- **Surgical, not weak.** Do the connected work that the task actually requires; don't leave half-broken features.
- **Honest, not performative.** Report what worked, what didn't, what wasn't verified.

The goal is for Haul Command to become the dominant infrastructure platform for the heavy haul industry globally. Every commit should serve that goal or stay out of the way.
