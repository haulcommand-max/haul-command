# Haul Command Directory Ingestion Pipeline (U.S.)
**Version:** 1.0
**Target:** Gemini 3.1 Pro / Large Batch Processing

This pipeline builds the U.S. heavy-haul ecosystem directory using a 3-layered approach matching actual industry reality (State rules, FMCSA authority, Local web footprint) before merging into the Haul Command database.

## System Prompt Addition
Prepended to all runs:
`Return structured JSON only, preserve exact source URLs, never guess missing data, and separate official regulatory sources from commercial entities.`

## Batching Strategy
1. **Version 1 (Official Pass):** 5 states at a time
2. **Version 2 (FMCSA Pass):** 1-2 categories at a time
3. **Version 3 (Long-Tail Pass):** 1 state + 1 metro + 1 corridor at a time
4. **Master Merge:** Run after V1, V2, and V3 data is collected

---

## 1. Operating Structure (YAML)
```yaml
project: haul_command_us_directory_ingest
version: 1
goal: >
  Build the U.S. heavy-haul ecosystem directory with official regulatory coverage first,
  then commercial entity coverage, then people/contact enrichment, then dedupe and review.

tabs:
  - tab_name: official_state_sources
    purpose: >
      Store the official state-level permit, escort, certification, and regulatory sources.
      This tab is the trust layer and should never be polluted with marketing pages unless
      explicitly labeled as non-official supporting material.
    primary_key: state_source_key
    columns:
      - name: state_source_key
        type: string
        rule: "state + normalized agency name + normalized source title"
      - name: state
        type: string
      - name: country
        type: string
        default: US
      - name: source_type
        type: enum
        allowed:
          - permit_office
          - permit_portal
          - escort_requirements
          - certification_page
          - training_page
          - reciprocity_page
          - route_map
          - permit_manual_pdf
          - attachment_pdf
          - enforcement_page
          - statute_or_rule
          - contact_page
          - supporting_non_official
      - name: official_status
        type: enum
        allowed:
          - official
          - non_official
      - name: agency_name
        type: string
      - name: agency_level
        type: enum
        allowed:
          - state_dot
          - dmv
          - dps
          - highway_patrol
          - public_safety
          - commerce
          - permit_office
          - other
      - name: source_title
        type: string
      - name: source_url
        type: string
      - name: page_format
        type: enum
        allowed:
          - html
          - pdf
          - portal
          - map
          - doc
          - other
      - name: escort_rules_present
        type: enum
        allowed: [yes, no, unknown]
      - name: certification_mentioned
        type: enum
        allowed: [yes, no, unknown]
      - name: reciprocity_mentioned
        type: enum
        allowed: [yes, no, unknown]
      - name: vehicle_equipment_rules_present
        type: enum
        allowed: [yes, no, unknown]
      - name: flagger_or_traffic_control_present
        type: enum
        allowed: [yes, no, unknown]
      - name: route_survey_mentioned
        type: enum
        allowed: [yes, no, unknown]
      - name: law_enforcement_escort_mentioned
        type: enum
        allowed: [yes, no, unknown]
      - name: utility_or_railroad_coordination_mentioned
        type: enum
        allowed: [yes, no, unknown]
      - name: responsible_agencies_note
        type: string
      - name: evidence_snippet
        type: string
      - name: extracted_contacts
        type: string
        rule: "comma-separated names/phones/emails only if directly present"
      - name: source_last_seen_date
        type: date
      - name: collection_method
        type: enum
        allowed:
          - gemini_official_pass
          - manual_review
          - later_verification
      - name: confidence_score
        type: integer
        range: "0-100"
      - name: needs_manual_review
        type: boolean
      - name: notes
        type: string

  - tab_name: commercial_entities
    purpose: >
      Store companies and organizations: pilot car operators, escort companies, heavy-haul brokers,
      carriers, permit services, route survey providers, dispatchers, and adjacent roles.
    primary_key: entity_key
    columns:
      - name: entity_key
        type: string
        rule: "normalized entity name + state + website root if present"
      - name: entity_name
        type: string
      - name: normalized_name
        type: string
      - name: dba_name
        type: string
      - name: legal_name
        type: string
      - name: entity_type
        type: enum
        allowed:
          - pilot_car_operator
          - escort_company
          - escort_dispatch
          - heavy_haul_broker
          - heavy_haul_carrier
          - permit_service
          - route_survey_provider
          - escort_flagger
          - traffic_control_provider
          - steersman_or_tillerman
          - utility_coordination_provider
          - railroad_coordination_provider
          - training_provider
          - mixed_services_company
          - unknown_pending_review
      - name: company_structure_guess
        type: enum
        allowed:
          - solo_operator
          - small_company
          - multi_state_company
          - enterprise
          - unknown
      - name: city
        type: string
      - name: state
        type: string
      - name: zip
        type: string
      - name: service_area
        type: string
      - name: website
        type: string
      - name: website_root
        type: string
      - name: phone
        type: string
      - name: email
        type: string
      - name: contact_page_url
        type: string
      - name: about_page_url
        type: string
      - name: social_urls
        type: string
      - name: fmcsa_source_url
        type: string
      - name: website_source_url
        type: string
      - name: additional_source_urls
        type: string
      - name: usdot_number
        type: string
      - name: mc_number
        type: string
      - name: authority_status
        type: string
      - name: services_offered
        type: string
        rule: "comma-separated controlled terms"
      - name: pilot_car_service
        type: enum
        allowed: [yes, no, unknown]
      - name: escort_dispatch_service
        type: enum
        allowed: [yes, no, unknown]
      - name: broker_service
        type: enum
        allowed: [yes, no, unknown]
      - name: carrier_service
        type: enum
        allowed: [yes, no, unknown]
      - name: permit_service
        type: enum
        allowed: [yes, no, unknown]
      - name: route_survey_service
        type: enum
        allowed: [yes, no, unknown]
      - name: height_pole_service
        type: enum
        allowed: [yes, no, unknown]
      - name: traffic_control_service
        type: enum
        allowed: [yes, no, unknown]
      - name: utility_coordination_service
        type: enum
        allowed: [yes, no, unknown]
      - name: railroad_coordination_service
        type: enum
        allowed: [yes, no, unknown]
      - name: certifications_mentioned
        type: string
      - name: states_explicitly_served
        type: string
      - name: evidence_snippet
        type: string
      - name: source_count
        type: integer
      - name: confidence_score
        type: integer
        range: "0-100"
      - name: needs_manual_review
        type: boolean
      - name: claim_priority
        type: enum
        allowed:
          - highest
          - high
          - medium
          - low
          - hold
      - name: seo_page_type
        type: enum
        allowed:
          - company_profile
          - broker_profile
          - carrier_profile
          - service_category_page
          - city_service_page
          - state_service_page
          - corridor_page
          - hold_no_page_yet
      - name: notes
        type: string

  - tab_name: people_and_roles
    purpose: >
      Store actual contact persons when Gemini finds them, without forcing every entity
      to have a named person.
    primary_key: person_key
    columns:
      - name: person_key
        type: string
        rule: "normalized person name + entity_key"
      - name: entity_key
        type: string
      - name: person_name
        type: string
      - name: role_title
        type: enum
        allowed:
          - owner
          - dispatcher
          - broker_contact
          - permit_specialist
          - route_survey_contact
          - pilot_car_operator
          - office_contact
          - sales_contact
          - unknown
      - name: phone
        type: string
      - name: email
        type: string
      - name: source_url
        type: string
      - name: evidence_snippet
        type: string
      - name: confidence_score
        type: integer
        range: "0-100"
      - name: needs_manual_review
        type: boolean
      - name: notes
        type: string

  - tab_name: merge_review_queue
    purpose: >
      Hold suspected duplicates, ambiguous records, weak leads, and records that need a human pass.
    primary_key: review_key
    columns:
      - name: review_key
        type: string
      - name: review_type
        type: enum
        allowed:
          - suspected_duplicate
          - weak_record
          - conflicting_contact
          - conflicting_location
          - conflicting_entity_type
          - unclear_service_area
          - unclear_fmcsa_match
          - unclear_official_status
      - name: entity_key_a
        type: string
      - name: entity_key_b
        type: string
      - name: state_source_key
        type: string
      - name: reason
        type: string
      - name: recommended_action
        type: enum
        allowed:
          - merge
          - keep_separate
          - enrich_more
          - suppress
          - publish_with_caution
      - name: confidence_score
        type: integer
        range: "0-100"
      - name: status
        type: enum
        allowed:
          - open
          - reviewed
          - resolved
      - name: notes
        type: string

  - tab_name: state_coverage_scoreboard
    purpose: >
      Track where you have enough data to publish pages and where you still have thin coverage.
    primary_key: state
    columns:
      - name: state
        type: string
      - name: official_sources_count
        type: integer
      - name: permit_portal_found
        type: enum
        allowed: [yes, no]
      - name: escort_requirements_found
        type: enum
        allowed: [yes, no]
      - name: certification_or_training_found
        type: enum
        allowed: [yes, no]
      - name: commercial_entities_count
        type: integer
      - name: pilot_car_operator_count
        type: integer
      - name: escort_company_count
        type: integer
      - name: heavy_haul_broker_count
        type: integer
      - name: heavy_haul_carrier_count
        type: integer
      - name: permit_service_count
        type: integer
      - name: route_survey_provider_count
        type: integer
      - name: unique_cities_covered
        type: integer
      - name: top_missing_metros
        type: string
      - name: top_missing_corridors
        type: string
      - name: publish_readiness
        type: enum
        allowed:
          - ready
          - nearly_ready
          - thin
          - blocked
      - name: notes
        type: string

controlled_vocabularies:
  services_offered:
    - pilot_car
    - escort_vehicle
    - escort_dispatch
    - wide_load_escort
    - overdimensional_escort
    - superload_support
    - permit_service
    - route_survey
    - height_pole
    - traffic_control
    - flagging
    - utility_coordination
    - railroad_coordination
    - heavy_haul_brokerage
    - specialized_transport
    - heavy_haul_carrier
    - training
    - consulting

confidence_rules:
  official_state_sources:
    - "95-100 = clearly official state source with direct escort/permit relevance"
    - "80-94 = official source but relevance is secondary or split across agencies"
    - "60-79 = likely valid supporting source but not fully explicit"
    - "below 60 = weak or unclear; do not publish without review"
  commercial_entities:
    - "95-100 = FMCSA or strong direct site evidence + matching geography + service clarity"
    - "80-94 = strong website evidence with direct services and contact details"
    - "60-79 = plausible company with partial evidence"
    - "below 60 = lead only, hold for review"

claim_priority_rules:
  highest: >
    website present + phone present + clear service area + strong evidence + active-looking business
  high: >
    FMCSA-confirmed or multi-source-confirmed company with clear heavy-haul relevance
  medium: >
    usable public record but missing one or two major trust signals
  low: >
    weak or incomplete record
  hold: >
    do not claim-push yet; review first

dedupe_rules:
  - "Never merge unlike entities solely because names are similar"
  - "Prefer website_root + phone + geography over name-only matching"
  - "Treat DBA and legal name as same family only when evidence supports it"
  - "Keep source URLs from every duplicate candidate before merge"
  - "If one record is official and one is commercial, do not merge them into one row"

batching_plan:
  official_pass:
    batch_size: "5 states at a time"
    prompt_target: "official_state_sources"
  fmcsa_pass:
    batch_size: "1-2 categories at a time"
    categories:
      - heavy_haul_broker
      - heavy_haul_carrier
      - permit_service
      - escort_dispatch
    prompt_target: "commercial_entities"
  long_tail_pass:
    batch_size: "1 state + 1 metro + 1 corridor at a time"
    prompt_target: "commercial_entities and people_and_roles"

publication_thresholds:
  state_regulation_page_ready_when:
    - "permit_portal_found = yes or equivalent official permit office found"
    - "escort_requirements_found = yes"
    - "at least 3 strong official source rows"
  company_profile_ready_when:
    - "entity_name present"
    - "state present"
    - "at least 1 direct source URL"
    - "confidence_score >= 80"
  city_service_page_ready_when:
    - "at least 5 decent commercial records in city/metro cluster"
    - "at least 2 entity types represented"

gemini_output_rules:
  - "Return unknown instead of guessing"
  - "Never invent phone numbers, emails, cities, MC numbers, USDOT numbers, or certifications"
  - "Every row must preserve source URLs"
  - "Every non-official commercial row needs an evidence_snippet"
  - "Weak rows must be marked needs_manual_review = true"
  - "Output structured JSON only"

starter_rollout_order:
  - Florida
  - Texas
  - California
  - Georgia
  - North Carolina
  - Tennessee
  - Arizona
  - Oklahoma
  - Ohio
  - Indiana
  - Illinois
  - Pennsylvania

notes:
  - "Use official-state pass first, always"
  - "Do not let Gemini mix regulatory pages and commercial company rows into one tab"
  - "Do not create public pages for low-confidence records"
  - "Preserve repeated observations for corridor and demand intelligence"

```

## 2. JSON Target Schema Payload

```json
{
  "run_metadata": {
    "run_type": "official_pass_or_fmcsa_pass_or_long_tail_pass",
    "states": [],
    "metros": [],
    "corridors": [],
    "categories": [],
    "timestamp_utc": "",
    "notes": ""
  },
  "official_state_sources": [],
  "commercial_entities": [],
  "people_and_roles": [],
  "merge_review_queue": [],
  "state_coverage_scoreboard_updates": []
}
```

## 3. Prompts

### Version 1 — State-First Official Coverage Mesh
```text
You are building a U.S. heavy-haul ecosystem directory for Haul Command.

Your task is to collect OFFICIAL state-level sources for oversize/overweight movement and pilot/escort operations for these states:
[INSERT STATES]

Objective:
Create a structured dataset of the official regulatory and permit surfaces that govern pilot car / escort work in each state.

Priority sources only:
1. Official state DOT / DMV / DPS / highway patrol / commerce / permit office domains
2. Official state permitting portals
3. Official state PDFs, manuals, route maps, permit attachments, escort requirement pages
4. Official state certification / reciprocity / escort flagger pages where available

Do not use marketing sites as primary sources in this pass.
Do not guess.
If a field cannot be confirmed, return "unknown".

For each state, find:
- state
- official_permit_office_name
- official_permit_office_url
- official_permit_portal_url
- official_escort_requirements_url
- official_certification_or_training_url
- official_route_map_or_attachment_url
- responsible_agency_names
- notes_on_which_agency_controls_escort_rules
- notes_on_whether certification is mentioned
- notes_on vehicle/equipment requirements
- notes_on escort/flagger/traffic control references
- last_verified_url_count

Output as JSON array.
Each row must include:
- state
- source_type
- source_title
- source_url
- agency_name
- evidence_snippet
- confidence_score (0-100)
- needs_manual_review (true/false)

Rules:
- Prefer official HTML pages over secondary summaries
- Include PDF URLs if they appear authoritative and current
- Preserve exact agency names
- Extract short evidence snippets from the source
- Never invent requirements
- If the state uses more than one agency, record all of them
- Flag any state where the regulatory surface appears split across DOT, public safety, or permit office functions

Return:
1. the JSON
2. a short gap report listing states where official escort requirements were hard to find
3. a short list of repeated patterns across states
```

### Version 2 — FMCSA Expansion Pass
```text
You are building a U.S. heavy-haul directory for Haul Command.

Your task is to identify FORMAL heavy-haul brokers, carriers, escort coordinators, and permit-adjacent companies using FMCSA-first research plus public company websites.

Geographic scope:
[INSERT STATES OR "United States"]

Priority sources:
1. FMCSA Licensing & Insurance
2. FMCSA SAFER / Company Snapshot
3. Official company websites
4. Public company contact pages

Target entity types:
- heavy_haul_broker
- heavy_haul_carrier
- escort_dispatch
- permit_service
- route_survey_provider
- escort_company

Search cues:
- heavy haul
- oversize
- overdimensional
- oversized load
- specialized transport
- superload
- permit service
- route survey
- escort coordination
- pilot car

For each entity, collect:
- entity_name
- normalized_name
- entity_type
- city
- state
- website
- phone
- email
- contact_name
- FMCSA_source_url
- website_source_url
- USDOT_number
- MC_number
- authority_status
- services_offered
- evidence_snippet
- confidence_score
- needs_manual_review

Rules:
- Do not invent MC or USDOT numbers
- If FMCSA confirms the company but the website does not mention heavy haul, say so
- If the website mentions pilot car arrangement, permit services, route surveys, escorts, superloads, or overdimensional logistics, tag those explicitly
- Merge duplicate records from DBA/legal names
- Keep all source URLs
- If a company looks relevant but evidence is weak, set needs_manual_review = true

Output:
1. JSON array
2. a deduplicated summary by state
3. a list of companies that appear broker-like but are not clearly classifiable from the evidence
```

### Version 3 — SERP / Local Web Triangulation
```text
You are building the long-tail U.S. pilot car directory for Haul Command.

Your task is to find small escort companies, solo pilot car operators, regional escort specialists, and other hard-to-find public-facing service providers that may not be easy to capture from federal databases alone.

Geographic scope:
[INSERT STATE OR REGION]

Search focus:
- pilot car
- escort vehicle
- escort service
- oversize escort
- overdimensional escort
- height pole car
- route survey
- escort flagger
- wide load escort
- superload escort

Also look for adjacent roles:
- permit service
- steersman / tillerman
- traffic control for oversize moves
- utility / railroad coordination related to oversize movements

Use public web sources only.
Possible discovery surfaces:
- company websites
- public directory pages
- contact pages
- public social profile pages
- public training/resource pages as lead sources only

Validation rule:
A record should not be considered strong unless at least one of these is true:
- the company has a website/contact page clearly offering the service
- the company’s public page clearly states the service and geography
- the record can be triangulated across multiple public sources

For each record, collect:
- entity_name
- normalized_name
- entity_type
- city
- state
- service_area
- website
- phone
- email
- public_source_urls
- evidence_snippet
- services_offered
- confidence_score
- needs_manual_review

Rules:
- Never guess city/state/service area
- Never invent contact details
- Merge duplicates
- Mark weak records for review
- Prefer direct evidence over directory mentions
- If a training/resource site reveals a company name, treat it only as a lead until confirmed elsewhere

Output:
1. JSON array
2. by-city coverage gaps
3. top missing metros/corridors needing manual follow-up
```

### Master Merge Prompt
```text
You are the data quality lead for Haul Command.

I will provide three JSON datasets:
1. official_state_sources
2. fmcsa_expansion_entities
3. public_web_gapfill_entities

Your job:
Merge them into one deduplicated U.S. heavy-haul ecosystem directory.

Goals:
- maximize coverage
- preserve source evidence
- separate official regulatory surfaces from commercial entities
- avoid hallucinations
- assign confidence honestly

Output schema:
- entity_name
- normalized_name
- entity_type
- city
- state
- service_area
- website
- phone
- email
- contact_name
- official_source_urls
- commercial_source_urls
- FMCSA_source_urls
- USDOT_number
- MC_number
- authority_status
- services_offered
- certifications_mentioned
- evidence_snippets
- confidence_score
- needs_manual_review
- duplicate_group_key
- source_count
- recommended_profile_slug
- recommended_claim_priority
- recommended_seo_page_type

Confidence logic:
- 95-100 = official source or FMCSA + company website + matching geography
- 80-94 = company website + strong corroboration
- 60-79 = plausible public record but incomplete
- below 60 = weak lead only

Claim priority logic:
- highest priority if website exists, phone exists, service area is clear, and company is active
- next priority if FMCSA-confirmed and heavy-haul relevant
- lower priority if only weak public signals exist

SEO page type options:
- state_regulation_page
- permit_office_page
- company_profile
- broker_profile
- carrier_profile
- service_category_page
- city_service_page
- corridor_page

Rules:
- never merge unlike entities just because names are similar
- preserve all source URLs
- return unknown instead of inventing missing data
- flag rows needing review
- create a short summary of the strongest uncovered gaps by state

Return:
1. merged JSON
2. duplicate audit
3. weak-record audit
4. top 100 claim-priority targets
5. states with the thinnest directory coverage
```
