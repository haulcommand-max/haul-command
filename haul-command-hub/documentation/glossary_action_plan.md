# Gap Audit & Rollout Plan: Haul Command Glossary OS

## 1. Gap Audit: Current Glossary vs Reference Competitors
**Current State (Haul Command):**
- **Siloed Content:** The current `glossary/` route is hardcoded to 51 terms but advertises "200+".
- **Architecture Fragmentation:** We've spread operations across `glossary/page.tsx` and `dictionary/page.tsx`, causing split link equity and confusing navigation.
- **Lost Intent Conversion:** Term pages render definitions beautifully but act as "dead ends." No dynamic CTAs to the permit calculator, regulation overlays, or trusted directory.
- **Contamination Risk:** The old architecture risked feeding unvetted providers from `directory_listings` into context widgets automatically.
- **Reference Competitors** (like DAT, HeavyHaul.net) embed their glossary terms directly into "How to Start a Brokerage" or "What is a Flatbed" mega-guides capturing high commercial intent.

## 2. Missing Term Clusters & Classes
Competitors dominate specialized conversational queries. We need exactly these new classes added to our `GlossaryCategory` taxonomy:
- `official_pevo_terms` (e.g., ANSI, Curfew, Daylight hours, Gore strip)
- `field_radio_lingo` (e.g., Alligator, Zipper, Wiggle Wagon, P-Lot)
- `permit_and_regulation_terms` (e.g., Divisible load, Extra-legal vehicle)
- `heavy_haul_equipment_and_trailer_terms` (e.g., Height pole)
- `broker_shipper_carrier_logistics_terms` (e.g., Freight Forwarder, BOL)
- `route_clearance_and_infrastructure_terms`
- `country_state_jurisdiction_variants`
- `certification_and_compliance_terms`

## 3. Missing Resource & Explainer Pages
We are leaving money on the table without "Resource Bridges" (Pages capturing "What is X" & "How to do Y"). We will build:
* `/resources/height-pole-requirements`
* `/resources/pilot-car-certifications`
* `/resources/state-oversize-load-regulations` (Tying into `/escort-requirements`)
* `/resources/road-conditions-by-state`
* `/resources/tire-chain-laws`
* `/resources/trailer-types`
* `/resources/bill-of-lading`
* `/resources/broker-vs-carrier`
* `/resources/cross-border-heavy-haul`
* `/resources/how-to-start-pilot-car-company`

## 4. Schema / Content Model Changes
The `GlossaryEntry` model in `lib/glossary.ts` will be updated:
- Redefine `GlossaryCategory` to use the 8 required taxonomy classes.
- Introduce `nextBestAction` in the schema to store what the user should do next (e.g. `type: 'tool', link: '/tools/escort-calculator'`).
- Enforce that `relatedTerms` includes both primary definitions and synonym entries.

## 5. Synonym & Canonical Routing Logic
- **Slug Normalization:** Delete `dictionary/` route completely. Unify around `glossary/`.
- **Next.js `next.config.ts` redirects:** Force `/dictionary/:path*` to `/glossary/:path*`.
- **Term Family Handling:** Slang/Alias terms will be given their own unique URL (e.g., `/glossary/us/alligator`) to rank for the slang, but the `next-canonical` tag will point to the parent `/glossary/us/tire-debris` (or similar) IF it's a direct synonym, OR we let each rank on its own with a "See Also" block.
- **Hreflang Headers:** Hardened to ensure the 120-country matrix doesn't cause duplicate content penalties.

## 6. Internal Link Map & Guardrails
- **Glossary ➜ Tools:** Terms like "Axle Weight" link to `/tools/axle-weight`.
- **Glossary ➜ Regulations:** Terms with regulatory variances like "Curfew" link to `/state/[jurisdiction]`.
- **Glossary ➜ Directory (GUARDRAIL):** Glossary pages will ONLY display the "Find Operator" widget if `is_active_market` is true for the country, bypassing unvetted synthetic listings completely.
- **Resources ➜ Glossary:** Explainer guides will highlight terms directly to `/glossary` links.

## 7. Execution Runbook
1. **Unify & Patch:** Port `dictionary/` into `glossary/`, delete `dictionary/`, and fix the `200+` text mismatch instantly.
2. **Schema Evolution:** Update `GlossaryCategory` in `lib/glossary.ts` and add `actionLayer` metadata to terms.
3. **Term Expansion:** Inject the missing Priority Term Families (PEVO, Lingo, Logistics) directly into the new taxonomy.
4. **Build the Conversion Modules:** Develop the "Next Best Action" & "Related Resource" UI components for the canonical term pages.
5. **SEO Wiring:** Update `sitemap.ts` and `next.config.ts` to implement the canonical redirects and index the newly created Resource Pages.
6. **Final Verification:** Ensure no 404s, `a.rpc` errors, or build loops occur.
