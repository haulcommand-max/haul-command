// lib/swarm/agents-trust.ts — Trust & Reputation Control (8 agents)
import type { SwarmAgentDef } from "./types";

export const TRUST_AGENTS: SwarmAgentDef[] = [
  {
    id: "trust_score", name: "Trust Score Agent", domain: "trust_reputation_control",
    purpose: "Compute and update composite trust scores across all 3 layers",
    triggers: [
      { type: "event", name: "job_completed", condition: "Job marked complete" },
      { type: "event", name: "review_left", condition: "New review submitted" },
      { type: "event", name: "response_received", condition: "Operator responds to match" },
    ],
    read_surfaces: ["trust_ratings", "verified_activity_events", "disputes"], write_surfaces: ["composite_trust_scores", "swarm_activity_log"],
    measurable_outputs: ["scores_computed", "confidence_upgrades"],
    loops_fed: ["trust_loop", "matching_loop"], monetization_relation: "Trust powers ranking → ranking drives premium",
    enabled: true, implementation_ref: "lib/trust/composite-trust-engine.ts",
  },
  {
    id: "profile_freshness", name: "Profile Freshness Agent", domain: "trust_reputation_control",
    purpose: "Recompute freshness scores, flag stale profiles, derank inactive",
    triggers: [
      { type: "schedule", name: "daily_freshness", condition: "Daily at 03:00 UTC" },
      { type: "event", name: "profile_updated", condition: "Profile field changed" },
    ],
    read_surfaces: ["listings", "user_activity", "freshness_scores"], write_surfaces: ["freshness_scores", "swarm_activity_log"],
    measurable_outputs: ["scores_recomputed", "stale_flags_set", "freshness_alerts_sent"],
    loops_fed: ["trust_loop", "supply_loop"], monetization_relation: "Freshness Guard upsell ($9.99/mo)",
    enabled: true, implementation_ref: "lib/engines/freshness.ts",
  },
  {
    id: "response_time", name: "Response Time Agent", domain: "trust_reputation_control",
    purpose: "Track and score operator response times to matches and messages",
    triggers: [
      { type: "event", name: "message_sent", condition: "Message sent to operator" },
      { type: "event", name: "match_proposed", condition: "Match sent to operator" },
    ],
    read_surfaces: ["messages", "match_results", "response_history"], write_surfaces: ["response_time_scores", "swarm_activity_log"],
    measurable_outputs: ["avg_response_time", "response_rate"],
    loops_fed: ["trust_loop", "matching_loop"], monetization_relation: "Fast responders get priority placement",
    enabled: true,
  },
  {
    id: "reputation_change", name: "Reputation Change Agent", domain: "trust_reputation_control",
    purpose: "Detect significant trust score changes and trigger appropriate actions",
    triggers: [{ type: "threshold", name: "trust_drop", condition: "Trust score drops > 10 points" }],
    read_surfaces: ["composite_trust_scores", "trust_score_history"], write_surfaces: ["notifications", "outreach_queues", "swarm_activity_log"],
    measurable_outputs: ["drops_detected", "recovery_nudges_sent", "escalations"],
    loops_fed: ["trust_loop"], monetization_relation: "Reputation recovery upsell",
    enabled: true, implementation_ref: "lib/engines/recovery-revenue.ts",
  },
  {
    id: "review_recovery", name: "Review Recovery Agent", domain: "trust_reputation_control",
    purpose: "Request reviews post-interaction, recover from negative reviews",
    triggers: [
      { type: "event", name: "job_completed", condition: "Job completed successfully" },
      { type: "schedule", name: "post_interaction_review", condition: "24h after job completion" },
    ],
    read_surfaces: ["jobs", "trust_ratings", "users"], write_surfaces: ["review_requests", "swarm_activity_log"],
    measurable_outputs: ["review_requests_sent", "reviews_received", "avg_review_score"],
    loops_fed: ["trust_loop", "monetization_loop"], monetization_relation: "More reviews → higher trust → more leads",
    enabled: true, implementation_ref: "supabase/functions/reviews-log",
  },
  {
    id: "report_card", name: "Report Card Agent", domain: "trust_reputation_control",
    purpose: "Generate and publish operator report cards with trust metrics",
    triggers: [
      { type: "schedule", name: "weekly_report_cards", condition: "Weekly" },
      { type: "event", name: "milestone_reached", condition: "Operator reaches trust milestone" },
    ],
    read_surfaces: ["composite_trust_scores", "verified_activity_summary", "trust_ratings"], write_surfaces: ["report_cards", "swarm_activity_log"],
    measurable_outputs: ["cards_generated", "cards_viewed", "share_rate"],
    loops_fed: ["trust_loop", "seo_loop"], monetization_relation: "Premium report card customization",
    enabled: true,
  },
  {
    id: "suspicious_pattern", name: "Suspicious Pattern Agent", domain: "trust_reputation_control",
    purpose: "Detect review manipulation, fake activity, gaming attempts",
    triggers: [
      { type: "event", name: "review_submitted", condition: "New review to check" },
      { type: "schedule", name: "daily_gaming_scan", condition: "Daily" },
    ],
    read_surfaces: ["trust_ratings", "verified_activity_events", "user_activity"], write_surfaces: ["gaming_flags", "policy_violations", "swarm_activity_log"],
    measurable_outputs: ["patterns_detected", "accounts_flagged"],
    loops_fed: ["trust_loop"], monetization_relation: "Platform integrity → long-term trust revenue",
    enabled: true, implementation_ref: "lib/trust/anti-gaming-engine.ts",
  },
  {
    id: "rank_badge", name: "Rank & Badge Agent", domain: "trust_reputation_control",
    purpose: "Award and manage badges, leaderboard positions, rank tiers",
    triggers: [
      { type: "event", name: "trust_score_updated", condition: "Trust score recomputed" },
      { type: "schedule", name: "hourly_leaderboard", condition: "Hourly" },
    ],
    read_surfaces: ["composite_trust_scores", "leaderboard_data"], write_surfaces: ["badges", "leaderboard_data", "swarm_activity_log"],
    measurable_outputs: ["badges_awarded", "rank_changes", "leaderboard_updates"],
    loops_fed: ["trust_loop", "monetization_loop"], monetization_relation: "Leaderboard visibility sponsorship",
    enabled: true, implementation_ref: "supabase/functions/leaderboard-snapshot-hourly",
  },
];
