# 🧠 gemini.md - System Pilot Constitution

> **Role:** System Pilot
> **Mission:** Build the Haul Command Operating System (HCOS) & **Automate the Physical World (Dropship Dispatch).**
> **Mantra:** "Missed call = lost load. Lost load = lost relationship."
> **Framework:** BLAST (Blueprint, Links, Architect, Stylize, Trigger)

## 🌟 North Star
**Build a White Label Automation Engine ('The BuildASign of Pilot Cars').**
*   **Goal:** Total Elimination of Industry Friction.
*   **Strategy:** Ingest Data -> Dropship Dispatch -> Automate Equipment -> Dominate Niches.
*   **Core Logic:** "Places the order as if a human was doing it." (Automated Fulfillment).

## 🗺️ Project Map (Current Status)
*   **`data/`**: 
    *   `pilot_cars_raw.txt`: Raw vendor data (155+ records).
    *   `pilot_cars_clean.json`: Parsed JSON data ready for ingestion.
*   **`scripts/`**: 
    *   `parse_pilot_cars.py`: Extraction logic for vendor data.
*   **`supabase/`**: 
    *   PostgreSQL Schemas (Layers 1-5 active).
    *   Edge Functions (`navixy-evidence-vault`).

## 🔗 Tech Stack (The Armory)
*   **Database:** Supabase (PostgreSQL, Edge Functions)
*   **Memory:** Pinecone (Vector Store for Regulation Manuals)
*   **Scraping:** Firecrawl (State Regulations & Load Boards)
*   **Research:** NotebookLM (Industry Intelligence)
*   **Voice/AI:** Vapi.ai (Intake)
*   **CRM:** GoHighLevel (Data Spine)

## 📜 Rules
1.  **Always check `gemini.md` before writing code.**
2.  **BLAST Protocol:** Follow the Blueprint -> Links -> Architect -> Stylize -> Trigger flow.
3.  **Data First:** Verify data integrity before ingestion.
4.  **Aesthetics:** "Dark Future Industrial" - High contrast, data-dense, neon accents.
5.  **Variable Pricing:** "Never assume a fixed rate." Price = (Route Difficulty + Urgency + Risk).
6.  **Quality Control:** "High Poles are Sacred." Only top-tier, vetted vendors for critical loads. No bad names.
    *   *Mandate:* High Pole vendors must verify equipment (e.g., AMC "Rattler" or similar) before dispatch.
7.  **Dropship First:** "Don't build it if you can dropship it." (Applies to signs, poles, apparel).
8.  **Canonical Truth (One Source):**
    *   **Distance:** `loads.miles` (cached numeric) is the absolute truth. Never compute on the client for ranking.
    *   **Rate:** `loads.rate_amount` (total) is the absolute truth.
    *   **Logic:** If user enters $/mi, convert to total immediately using `miles`. `rate_per_mile` is for UI display only.
9.  **Brand Spelling:** Use "HAUL COMMAND" (one L) globally in all copy, logs, and UI.
10. **Jurisdiction Map Control Surface uses jurisdiction_code as strict key; no fallback.**


## 🚀 Advanced Engines & Directives (Protocol Zero)

### Seed Assignment Directive
```yaml
seed_number_assignment:
  enabled: true
  objective: >
    Automatically assign any unassigned phone numbers already
    present in Supabase into the operator directory as seed records,
    while removing duplicates and preserving data integrity.
  source_detection:
    check_existing_tables: true
    prioritize_real_ingested_data: true
    skip_if_already_assigned: true
  deduplication:
    normalize_phone_e164: true
    fuzzy_match_threshold: 0.92
    keep_best_record_by:
      - has_email
      - has_geo
      - most_recent_activity
  seed_record_rules:
    assign_status: seed_unclaimed
    visibility: searchable
    allow_claim_flow: true
    require_phone_valid: true
  observability:
    output_metrics:
      - total_numbers_found
      - total_assigned_as_seed
      - duplicates_removed
      - invalid_numbers_filtered
```

### Email Inventory Audit (VERY IMPORTANT)
```yaml
email_inventory_audit:
  enabled: true
  queries:
    total_records: >
      SELECT COUNT(*) FROM operators;
    records_with_email: >
      SELECT COUNT(*) FROM operators
      WHERE email IS NOT NULL AND email <> '';
    unique_emails: >
      SELECT COUNT(DISTINCT email) FROM operators
      WHERE email IS NOT NULL AND email <> '';
  derived_metrics:
    email_coverage_rate: >
      records_with_email / total_records
  alert_thresholds:
    critical_if_below: 0.15
    warning_if_below: 0.30
  report_destination:
    - admin_dashboard
    - weekly_ops_email
```

### Regulation Ingestion Check
```yaml
regulation_ingestion_check:
  enabled: true
  verify_tables:
    - state_regulations
    - permit_rules
    - escort_rules
  completeness_checks:
    states_expected: 50
    provinces_expected: 10
  actions_if_missing:
    - request_reingestion
    - log_missing_states
    - flag_admin_alert
```
*Decision Logic:* If tables populated → DO NOT re-ingest. If gaps found → re-ingest only missing. Never duplicate full dataset.

### State Map Payload
```yaml
state_map_payload:
  include:
    - state_rules_and_regulations
    - pilot_car_operators
    - brokers
    - truck_stops
    - hotels
    - oversize_resources
  optional_later:
    - permit_offices
    - scale_locations
    - rest_areas
```

### Mobile Home Movers (Internal Prospecting Only)
```yaml
mobile_home_movers:
  placement: private_prospecting_playbook
  visibility: internal_only
  purposes:
    - operator_lead_generation
    - escort_outreach_targets
    - broker_relationship_building
  future_option:
    allow_marketplace_later: true
```

### Advanced Intelligence Engines
- **AI Load-to-Escort Match Predictor:** Predict best escort candidates before broadcast using Match Confidence Score (MCS). (Distance, Availability, Compliance, Reliability, CorridorFamiliarity). Auto-dispatch rules trigger on MCS thresholds (0.72, 0.82, 0.90).
- **Dead-Zone Auto-Healing Engine:** Immunity system. Detects zones with <3 operators within 150mi AND search demand present. Auto-triggers recruiter push -> paid ads -> referral boost -> synthetic fill.
- **Broker Lifetime Value Scorer (BLTV):** Prioritize best customers via Revenue90d, Frequency, Payment Speed, Complexity, Loyalty. Tiers: 🔥 elite, ⚡ strong, 🟡 developing, 🧊 low.
- **Market Takeover Playbook:** Q1 Foundation Density -> Q2 Liquidity Dominance -> Q3 Pricing Power -> Q4 Network Effects Lock.

### AI Contextual Pricing Engine (Bandit Optimizer)
```yaml
pricing_ai:
  enabled: true
  mode: guardrailed_contextual_bandit

  market_key:
    components: [country, region, metro_id, corridor_id]

  base_pricing:
    uses: [csi, scarcity_pressure, urgency_pressure, corridor_priority, broker_quality]
    floor_multiplier: 0.90
    ceiling_multiplier: 2.75

  learner:
    algorithm: thompson_sampling
    arms_delta: [-0.10, -0.05, 0.00, 0.05, 0.10, 0.15, 0.20]
    exploration_rate: 0.12
    min_samples_per_market: 40

  reward:
    match_success_weight: 1.00
    time_to_fill_penalty: 0.25
    cancellation_penalty: 0.35
    net_revenue_weight: 0.30
    repeat_weight: 0.15

  protections:
    max_daily_change_pct: 0.08
    max_request_change_pct: 0.12
    elite_broker_discount_cap: true
    oversupply_suppress_surge: true

  safety:
    global_kill_switch: true
    market_kill_switch: true
    panic_revert_to_base: true

  observability:
    dashboards:
      - pricing_delta_by_market
      - match_success_by_multiplier
      - revenue_vs_fill_time
      - broker_repeat_by_market
```

### Predictive Corridor Expansion Map
```yaml
corridor_expansion_map:
  enabled: true
  segment_miles: 50
  refresh_minutes: 60

  scoring:
    weights:
      demand_pressure: 0.30
      failure_pressure: 0.25
      strategic_value: 0.20
      recruitability: 0.15
      cost_to_win_inverse: 0.10

  tier1_corridors:
    - I-10
    - I-75
    - I-95
    - I-40
    - I-35
    - HWY_401
    - TRANS_CANADA

  outputs:
    map_layers:
      - corridor_segment_eps_heat
      - dead_zone_segments
      - recruit_targets_overlay

  alerts:
    expand_now_threshold: 80
    build_next_threshold: 60

  observability:
    dashboards:
      - top_100_segments_by_eps
      - eps_trend_by_corridor
      - match_rate_improvement_projection
```

### Fully Autonomous Recruiter Brain
```yaml
autonomous_recruiter_brain:
  enabled: true
  mode: closed_loop_growth
  safety_level: high

  monitors:
    refresh_minutes: 30
    primary_signals: [lrs, csi, eps, search_success_rate, corridor_gap_miles]

  missions:
    dead_zone_rescue:
      trigger:
        any:
          - lrs > 0.60
          - corridor_gap_miles > 200
      target:
        verified_operators_added: 12
        timebox_hours: 72

    corridor_buildout:
      trigger:
        - eps >= 60
      target:
        raise_csi_to: 0.90
        timebox_days: 14

    metro_fortify:
      trigger:
        - metro_below_strong_target
        - demand_trending_up
      target:
        verified_operators_added: 20
        timebox_days: 10

  action_ladder:
    - assign_unclaimed_seed_numbers
    - enrich_geo_and_email
    - sms_outreach_sequence
    - email_outreach_sequence
    - referral_booster
    - paid_micro_campaign_optional
    - temporary_synthetic_fill_expiring

  targeting:
    radius_miles: 150
    max_targets_per_mission: 300
    filters:
      require_valid_phone: true
      dedupe_threshold: 0.92
      spam_score_max: 0.35

  throttles:
    cooldown_hours: 12
    max_missions_per_region_per_day: 2
    max_outreach_per_day: 1200

  approvals:
    require_admin_for:
      - paid_micro_campaign_optional
      - temporary_synthetic_fill_expiring
    auto_execute_for:
      - assign_unclaimed_seed_numbers
      - enrich_geo_and_email
      - sms_outreach_sequence
      - email_outreach_sequence

  observability:
    dashboards:
      - mission_queue
      - conversion_funnel_by_region
      - claims_and_verifications
      - cost_per_verified_operator
      - liquidity_uplift_tracking

  safety:
    global_kill_switch: true
    mission_kill_switch: true
    revert_to_manual_mode: true
```

---
*Updated: 2026-02-20*
