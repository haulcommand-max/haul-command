-- ============================================================================
-- Migration: 20260412_paperclip_maximum_coverage.sql
-- Purpose: Spreads Paperclip to govern EVERY codebase integration
--          (Supabase Vectors, Realtime, Firebase Push, Fly.io Edge)
--          Overhauls all 163 agents into highly optimized machine workers
-- ============================================================================

BEGIN;

-- 1. Optimize all CEO & Board level roles (High Reasoning, Multi-Model, Agent Fabric)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{fabric}', 
    '{"executor": "agent_fabric", "model": "claude-3-5-sonnet", "planning": "claude-3-opus", "access": ["supabase_rpc", "firebase_admin"]}')
WHERE slug LIKE 'ceo-%' OR slug LIKE 'alphabet-%';

-- 2. Optimize all Market & Growth Agents (Firebase Integrations)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', 
    '{"primary": "supabase_edge", "outbound": "firebase_fcm_v1", "experimentation": "firebase_remote_config", "analytics": "firebase_events"}')
WHERE domain IN ('growth', 'monetization', 'adgrid', 'sponsor_inventory');

-- 3. Optimize all Intelligence & SEO Agents (Fly.io + Supabase Vector)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', 
    '{"primary": "fly.io_anycast", "docker_resources": {"cpu": 4, "memory": "8gb"}, "storage": "supabase_pgvector", "crawler": "puppeteer_stealth"}')
WHERE domain IN ('intelligence', 'seo', 'content_generation', 'market_watch');

-- 4. Optimize all Operator & Dispatch Agents (Supabase Realtime + Firebase Critical Push)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', 
    '{"primary": "supabase_edge", "sockets": "supabase_realtime_broadcast", "alerts": "firebase_high_priority_push", "latency_target_ms": 50}')
WHERE domain IN ('dispatch', 'dispatch_operations', 'operator_activation');

-- 5. Optimize all Trust & Compliance Agents (Fly.io OCR + Storage)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', 
    '{"primary": "fly.io_machine", "heavy_lifting": "tesseract_ocr", "storage": "supabase_s3_protocol", "queues": "pgmq"}')
WHERE domain IN ('trust', 'trust_proof', 'defense', 'compliance', 'permit_compliance');

-- 6. For role-specific lifecycles (e.g. role-pilot-car-operator)
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{lifecycle}', 
    '{"onboarding": "firebase_dynamic_links", "retention": "firebase_in_app", "telemetry": "supabase_postgis"}')
WHERE slug LIKE 'role-%';

-- 7. Catch-all for any agent we missed, assigning standard baseline
UPDATE public.hc_command_agents
SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{runtime}', '{"primary": "supabase_edge"}')
WHERE config IS NULL OR NOT (config ? 'runtime' OR config ? 'fabric');

COMMIT;
