# Jurisdiction Map Control Surface Architecture

## Goal
Interactive US+Canada jurisdiction map inside the mobile app (and web directory) where tapping a state/province deterministically loads records: operators, rules/regulations, and ecosystem support resources for that jurisdiction.

## Principles & Non-Negotiable Rules
- **Deterministic Jurisdiction Binding**: All content retrieved ONLY by `jurisdiction_code` (e.g., `US-FL`, `CA-AB`). No fallback.
- **Zero Wrong-State Guardrails**: 
  - UI displays selected jurisdiction name + code.
  - Queries have strict equality filters.
  - If missing, show "No data yet".
- **Fast First**: p50 drawer open in < 250ms, p95 < 750ms. Achieved via `stale-while-revalidate` caching and prefetching home+neighbors.
- **Action-First UI**: Every record cluster has at least one action button (Call, Text, Website, Export).

## Data Model (Supabase)
Strictly defined tables:
1. `jurisdictions`: Canonical list of US/CA codes, names, and types.
2. `operator_listings`: Contains business info, location, rating, and strict foreign key to `jurisdiction_code`.
3. `jurisdiction_rulepacks`: Topics and summaries per jurisdiction.
4. `jurisdiction_support_contacts`: Emergency and operational contacts.
5. `jurisdiction_content_cache`: Stalls rendered drawer payloads for fast access.

## RPC / Edge Functions
- `get_jurisdiction_drawer(jurisdiction_code)`: Retrieves operators, rulepacks, support contacts, and meta. Validates code.
- `export_state_packet(jurisdiction_code)`: Generates PDF state bounds documentation.
- `set_home_jurisdiction(user_id, jurisdiction_code)`: Sets user preference for prefetching.

## Pre-fetch Logic
- Triggers on app open for Web and Mobile. Prefetches payload for home jurisdiction + neighbor jurisdictions (contiguous states / provinces).
- Hardcoded adjacency map will supply neighborhood resolution.

## UI / UX Requirements
- Vector map with SVG/GeoJSON bounds, pinch-to-zoom, pan, state select.
- Drawer / Bottom-sheet presenting Tabs: Operators, Rules, Support, Export.
- Actionable intents embedded: Call (`tel://`), Text (`sms://`), Web links (`open://`).

---
*Created per Anti-Gravity Protocol Zero directives.*
