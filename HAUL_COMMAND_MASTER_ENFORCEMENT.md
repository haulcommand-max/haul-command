# Haul Command Master Enforcement

This repo must behave like one heavy haul operating system, not a pile of disconnected features.

## Non-Negotiables

- Upgrade only: do not downgrade working SEO, schema, routing, Supabase queries, auth, CTAs, mobile UX, or monetization paths.
- Supabase first: do not hardcode roles, countries, services, homepage cards, readiness states, or monetization rules when Supabase already controls them.
- Canonical first: before building inside a system family, check the canonical registry and avoid creating duplicate tables, routes, APIs, or components.
- Truth labels: never claim all 120 countries are fully live unless live Supabase data supports it. Prefer "120-country coverage model" when depth varies.
- Mobile first: every public surface must work at 360px, 390px, 430px, 768px, 1024px, and desktop.
- Entity clarity: directory pages must keep service families clean. Pilot car pages show pilot/escort operators, not mechanics, brokers, yards, or unrelated places.
- Monetization loop: public AdGrid placements must have impression, click, lead, and outcome tracking before they are treated as revenue-ready.
- Data product loop: preserve repeated demand/load/lead observations for intelligence. Dedupe master entities, not market signals.
- No generic social: UGC must create SEO, trust, dispatch, claim, AdGrid, data product, or market expansion value.
- No fake proof: do not output fake ratings, fake reviews, fake aggregateRating, fake verification, or unsupported availability.
- No archived migrations as truth: files under archived broken migration folders are references only. Do not reapply or import them.

## Canonical System Families

Every related table, view, RPC, route, component, script, and migration should be classified as one of:

- `ACTIVE_CANONICAL`
- `ACTIVE_COMPATIBILITY`
- `PARTIALLY_WIRED`
- `DORMANT`
- `OBSOLETE`
- `ARCHIVED_DO_NOT_USE`
- `DELETE_AFTER_BACKUP`

Initial family targets:

- Homepage/session slots
- Directory/entities/claims
- Loads/load signals
- Corridors/corridor intelligence
- AdGrid
- Data products
- Social/community/UGC
- Reviews/report cards/trust
- Leaderboard/gamification
- Training/glossary/regulations/tools
- Payments/checkout/sponsor packages
- Agents/workers/automation
- SEO/AEO/schema/internal linking
- Country/state/city/corridor page generation
- Assignment OS / broker-to-provider matching

## Required PR Checklist

Every meaningful change should answer:

- Did this improve claim conversion, search conversion, dispatch, trust, AdGrid, data products, SEO/AEO, or mobile UX?
- Did this use the canonical Supabase table/view/RPC/component for the system family?
- Did this avoid hardcoded business logic that belongs in Supabase?
- Did this preserve truthful country readiness labels?
- Did this avoid archived broken migrations as source of truth?
- Did this keep clickable UI visibly clickable and mobile tappable?
- Did this preserve metadata, JSON-LD, internal links, and one clear H1 where applicable?
- Did this add or update tests for behavior that can regress?

## First Enforcement Gates To Automate

- Warn on "120 countries live" or similar unsupported copy.
- Warn on hardcoded homepage role/country/service arrays outside fallback files.
- Warn on AdGrid public components without event tracking.
- Warn on imports or references to archived broken migrations in runtime code.
- Warn on directory category filters that do not specify entity family.
- Warn on JSON-LD aggregate ratings without real review counts.
- Warn on public pages missing metadata or internal links.

## Closed Loop Standard

Every feature should feed the operating loop:

Search traffic -> useful page -> claim/search/load/review/post action -> Supabase signal -> trust/ranking/data product -> AdGrid monetization -> better SEO -> more traffic -> more claims -> more data -> more revenue.

If a feature does not feed the loop, mark it dormant, hide it from primary navigation, or connect it to a commercial/trust/SEO/data path before expanding it.
