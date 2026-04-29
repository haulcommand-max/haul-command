# Haul Command Hybrid Command Fabric Operating Model

## Locked architecture

- Pinecone is removed.
- Supabase is the system of record, vector/RAG layer, staging layer, validation layer, search/intelligence layer, and monetization warehouse.
- Typesense stays for fast hero search, directory search, autocomplete, typo tolerance, and faceted UX.
- Firecrawl is the public-source intelligence intake layer.
- The Command Layer / Paperclip Fabric is the central nervous system for agents, workers, heartbeats, tasks, approvals, proof packets, runs, and money events.

## Hybrid Paperclip decision

Haul Command should not choose between seven agents and a 200+ matrix.

Use both:

1. Seven real super agents / execution owners.
2. 208 virtual mandates as task scope, not separate paid LLM workers.
3. Supabase command tasks as the actual work queue.
4. Cheap workers first; LLMs only for review, extraction, reasoning, code, or high-value copy.

This keeps quantity and global coverage while cutting cost.

## Real super agents

1. CEO Command Brain
2. CTO Platform Engine
3. SEO/AEO Dominator
4. Firecrawl Intelligence Engine
5. Revenue / AdGrid Engine
6. Dispatch / Liquidity Engine
7. Trust / Compliance / Localization Engine

## Virtual matrix

The virtual matrix contains:

- 120 country mandates
- 50 U.S. state mandates
- 30 HQ domain mandates
- 8 emerging-service watches

These should not become 208 expensive live agents. They should become scoped tasks and reports handled by the seven real owners.

## Required hyperlocal dimensions

Every task, signal, source, regulation fact, SEO gap, data product candidate, and market-readiness row should carry:

- country_code
- region_code
- city_or_locality
- corridor_key
- language_code
- currency_code
- measurement_system
- role_context
- source_url
- source_type
- confidence_score
- monetization_score
- last_verified_at

Never let U.S. defaults overwrite local country facts.

## Firecrawl signal routes

Every Firecrawl signal must route to at least one destination:

- seo_gap
- aeo_answer_gap
- glossary_term_candidate
- regulation_change_candidate
- blog_update_candidate
- tool_gap
- training_gap
- directory_supply_candidate
- partner_candidate
- infrastructure_candidate
- adgrid_signal
- data_product_signal
- dispatch_liquidity_signal
- pain_point_signal
- country_readiness_signal
- emerging_service_signal

If a crawl result cannot route to one of these, it should not spend credits.

## Emerging service watch

The fabric should watch for new heavy-haul-adjacent services, including:

- autonomous escort and autonomous heavy-haul support
- drones for route survey and aerial clearance checks
- EV heavy-haul and charging corridors
- hydrogen heavy transport support
- wind, port, and superload project intelligence
- AI permit precheck
- connected vehicle and telematics services
- robotic yard and staging operations

These are not distractions. They are early-warning signals for future AdGrid, data product, partner, training, and regulation surfaces.

## Command fabric requirements

Every production worker should report:

- run started
- run completed or failed
- cost
- credits used if applicable
- entities processed
- pages published
- tasks created
- revenue influenced
- proof packet created if applicable
- source citations if applicable

Use `lib/command-heartbeat.ts` where possible.

## Audit commands

Run:

```bash
node scripts/command-fabric-audit.mjs
```

For JSON:

```bash
node scripts/command-fabric-audit.mjs --json
```

Hybrid Paperclip dry run:

```bash
node agents/hybrid-paperclip-provision.js --dry-run
```

Live provisioning requires local environment variables and should not be run until Paperclip credentials are configured outside the repo.

## Next wiring priorities

1. Wrap every active cron route with CommandHeartbeat.
2. Update Firecrawl Edge Function to write command runs and money/proof/signals.
3. Add task checkout leases so workers cannot duplicate work.
4. Add a playbook action registry so every playbook action has a handler or manual-review destination.
5. Add country-localization review gates before publishing regulation or compliance facts.
6. Add emerging-service alerts to country readiness and AdGrid opportunity scoring.
7. Keep Typesense and Supabase HC Vector in separate jobs: Typesense for fast UX, Supabase HC Vector for semantic/RAG/intelligence.
