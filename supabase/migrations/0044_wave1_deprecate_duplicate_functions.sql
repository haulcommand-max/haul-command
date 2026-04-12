-- WAVE-1: Deprecate proven duplicate 'stripe-webhook' edge function
-- per canonical_edge_function_cluster_map.yaml decision: DEPRECATE
-- Migration creates a redirect guard so any old calls fail fast with a clear message

-- 1. Mark the old stripe-webhook function as deprecated in feature flags
INSERT INTO admin_settings (key, value, description)
VALUES (
  'deprecated_edge_functions',
  '["stripe-webhook", "score-recompute", "trust-score-recompute", "email-worker"]',
  'Edge functions deprecated by Opus Wave-1 cluster consolidation. Route to canonical replacements.'
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();

-- 2. Log the deprecation event
INSERT INTO event_log (actor_role, event_type, entity_type, payload)
VALUES (
  'system',
  'edge_function.deprecated',
  'infrastructure',
  '{"deprecated": ["stripe-webhook", "score-recompute", "trust-score-recompute", "email-worker"], "canonical_replacements": {"stripe-webhook": "hc_webhook_stripe", "score-recompute": "trust-and-ranking-core", "trust-score-recompute": "trust-and-ranking-core", "email-worker": "email-send"}, "wave": "WAVE-1"}'
);
