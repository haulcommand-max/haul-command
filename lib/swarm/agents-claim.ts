// lib/swarm/agents-claim.ts — Claim & Identity Control (9 agents)
import type { SwarmAgentDef } from "./types";

export const CLAIM_AGENTS: SwarmAgentDef[] = [
  {
    id: "claim_acceleration", name: "Claim Acceleration Agent", domain: "claim_identity_control",
    purpose: "Push unclaimed profiles toward claim via value-before-claim sequences",
    triggers: [
      { type: "event", name: "profile_view_unclaimed", condition: "View on unclaimed profile" },
      { type: "event", name: "lead_attempt_unclaimed", condition: "Lead attempt on unclaimed profile" },
      { type: "schedule", name: "daily_claim_batch", condition: "Daily claim nudge batch" },
    ],
    read_surfaces: ["listings", "profile_views", "lead_events"], write_surfaces: ["outreach_queues", "claim_nudges", "swarm_activity_log"],
    measurable_outputs: ["nudges_sent", "claims_started", "claim_conversion_rate"],
    loops_fed: ["claim_loop", "monetization_loop"], monetization_relation: "Claimed profile → upgradeable asset",
    enabled: true, implementation_ref: "supabase/functions/email-claim-nudges",
  },
  {
    id: "value_before_claim", name: "Value-Before-Claim Agent", domain: "claim_identity_control",
    purpose: "Show unclaimed entities their page views, leads missed, and rank potential",
    triggers: [{ type: "event", name: "claim_page_loaded", condition: "User visits claim page" }],
    read_surfaces: ["listings", "profile_views", "lead_events", "rank_data"], write_surfaces: ["claim_value_previews", "swarm_activity_log"],
    measurable_outputs: ["previews_shown", "claim_starts_from_preview"],
    loops_fed: ["claim_loop", "trust_loop"], monetization_relation: "Higher claim rate → bigger monetizable base",
    enabled: true, implementation_ref: "lib/engines/claim-readiness.ts",
  },
  {
    id: "identity_merge_dedupe", name: "Identity Merge/Dedupe Agent", domain: "claim_identity_control",
    purpose: "Detect and merge duplicate entities across listings, companies, places",
    triggers: [
      { type: "schedule", name: "nightly_merge_scan", condition: "Nightly" },
      { type: "event", name: "user_signup_match", condition: "Signup matches existing entity" },
    ],
    read_surfaces: ["listings", "companies", "hc_places", "users"], write_surfaces: ["merge_actions", "identity_graph", "swarm_activity_log"],
    measurable_outputs: ["duplicates_found", "merges_executed", "merges_pending_review"],
    loops_fed: ["claim_loop", "data_loop", "trust_loop"], monetization_relation: "Clean data → better matching → higher trust",
    enabled: true,
  },
  {
    id: "profile_completion", name: "Profile Completion Agent", domain: "claim_identity_control",
    purpose: "Push claimed profiles toward higher completion for rank + dispatch eligibility",
    triggers: [
      { type: "threshold", name: "completion_low", condition: "Profile completion < 60%" },
      { type: "schedule", name: "weekly_completion_nudge", condition: "Weekly" },
    ],
    read_surfaces: ["listings", "profile_completion_scores"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["nudges_sent", "completions_improved", "avg_completion_delta"],
    loops_fed: ["claim_loop", "trust_loop"], monetization_relation: "Complete profile → dispatch eligible → lead revenue",
    enabled: true, implementation_ref: "lib/engines/recovery-revenue.ts",
  },
  {
    id: "verification_prompt", name: "Verification Prompt Agent", domain: "claim_identity_control",
    purpose: "Prompt claimed users to complete verification steps (docs, insurance, certs)",
    triggers: [
      { type: "event", name: "claim_completed", condition: "Profile claimed but unverified" },
      { type: "threshold", name: "high_traffic_unverified", condition: "Unverified profile gets > 10 views" },
    ],
    read_surfaces: ["listings", "verification_status", "profile_views"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["prompts_sent", "verifications_started", "verifications_completed"],
    loops_fed: ["claim_loop", "trust_loop", "monetization_loop"], monetization_relation: "Verified status → premium upgrade path",
    enabled: true, implementation_ref: "supabase/functions/seed-claim-sequence",
  },
  {
    id: "trust_unlock", name: "Trust Unlock Agent", domain: "claim_identity_control",
    purpose: "Unlock trust-gated features as profile completes verification milestones",
    triggers: [{ type: "event", name: "verification_milestone", condition: "User completes a verification step" }],
    read_surfaces: ["verification_status", "composite_trust_scores"], write_surfaces: ["feature_unlocks", "notifications", "swarm_activity_log"],
    measurable_outputs: ["features_unlocked", "trust_score_lifts"],
    loops_fed: ["trust_loop", "claim_loop"], monetization_relation: "Feature unlock FOMO → premium conversion",
    enabled: true,
  },
  {
    id: "broker_claim", name: "Broker Claim Agent", domain: "claim_identity_control",
    purpose: "Push broker profile shells toward claim and verification",
    triggers: [
      { type: "event", name: "broker_shell_created", condition: "New broker shell published" },
      { type: "threshold", name: "broker_repeat_viewer", condition: "Broker shell viewed > 3 times" },
    ],
    read_surfaces: ["broker_profiles", "profile_views"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["broker_claims_started", "broker_claims_completed"],
    loops_fed: ["claim_loop", "demand_loop"], monetization_relation: "Broker claim → Business subscription",
    enabled: true,
  },
  {
    id: "property_claim", name: "Property Claim Agent", domain: "claim_identity_control",
    purpose: "Push truck stops, yards, repair shops toward claim and sponsor upgrade",
    triggers: [
      { type: "event", name: "place_shell_created", condition: "New place shell from ingestion" },
      { type: "threshold", name: "place_high_views", condition: "Place shell > 5 views/week" },
    ],
    read_surfaces: ["hc_places", "profile_views"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["property_claims_started", "property_claims_completed"],
    loops_fed: ["claim_loop", "monetization_loop", "seo_loop"], monetization_relation: "Property claim → AdGrid sponsor slot",
    enabled: true,
  },
  {
    id: "reclaim_reactivation", name: "Re-Claim Reactivation Agent", domain: "claim_identity_control",
    purpose: "Re-engage lapsed claimed profiles that stopped updating",
    triggers: [
      { type: "threshold", name: "profile_stale", condition: "No update > 90 days, claimed profile" },
      { type: "schedule", name: "weekly_reclaim", condition: "Weekly" },
    ],
    read_surfaces: ["listings", "user_activity", "freshness_scores"], write_surfaces: ["outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["reclaim_nudges_sent", "profiles_reactivated"],
    loops_fed: ["claim_loop", "supply_loop"], monetization_relation: "Reactivation → renewed subscription",
    enabled: true, implementation_ref: "lib/engines/recovery-revenue.ts",
  },
];
