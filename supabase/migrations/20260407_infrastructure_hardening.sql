-- ============================================================================
-- Haul Command — Infrastructure Hardening Batch
-- Migration: 20260407_infrastructure_hardening
--
-- Fixes:
-- 1. QuickPay double-spend prevention (unique booking constraint + idempotency)
-- 2. Broker-side RLS on quickpay_transactions
-- 3. Market-Mode Governor transition engine (evaluate + auto-promote)
-- 4. Reconciliation view between market_states and hc_country_readiness
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. QUICKPAY: Double-Spend Prevention
-- ══════════════════════════════════════════════════════════════════════════════

-- Prevent two active QuickPay requests for the same booking
-- Only one non-terminal request per booking is allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_qp_booking_active
    ON quickpay_transactions (booking_id)
    WHERE booking_id IS NOT NULL 
      AND status NOT IN ('completed', 'failed', 'reversed', 'cancelled');

-- Add idempotency key column for client-side dedup
DO $$ BEGIN
    ALTER TABLE quickpay_transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qp_idempotency
    ON quickpay_transactions (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. QUICKPAY: Broker-Side RLS
-- ══════════════════════════════════════════════════════════════════════════════

-- Brokers can see QuickPay requests where they are the paying party
CREATE POLICY "Brokers see quickpay requests against them"
    ON quickpay_transactions FOR SELECT
    TO authenticated USING (auth.uid() = broker_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. MARKET-MODE GOVERNOR: Transition Engine
-- ══════════════════════════════════════════════════════════════════════════════

-- Rules engine that evaluates market metrics and determines if a mode transition
-- should occur. Called by pg_cron every 6 hours.
--
-- Mode lifecycle:
--   seeding → demand_capture → waitlist → live → (shortage|rescue)
--
-- Thresholds (from master prompt):
--   seeding → demand_capture:  supply_count >= 10
--   demand_capture → waitlist: supply_count >= 25 AND demand_signals_30d >= 5
--   waitlist → live:           supply_count >= 50 AND demand_signals_30d >= 10 AND match_rate_30d >= 0.10
--   live → shortage:           fill_rate_30d < 0.30 AND demand_signals_30d >= 20
--   live → rescue:             fill_rate_30d < 0.10 OR avg_response_time_hours > 48
--   shortage → live:           fill_rate_30d >= 0.40
--   rescue → shortage:         fill_rate_30d >= 0.15 AND avg_response_time_hours < 48

CREATE OR REPLACE FUNCTION evaluate_market_transitions()
RETURNS TABLE (
    market_key TEXT,
    current_mode TEXT,
    recommended_mode TEXT,
    reason TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    WITH evaluations AS (
        SELECT
            ms.market_key,
            ms.mode AS current_mode,
            CASE
                -- Rescue triggers (highest priority, checked first)
                WHEN ms.mode = 'live' AND (ms.fill_rate_30d < 0.10 OR ms.avg_response_time_hours > 48) THEN 'rescue'
                
                -- Shortage trigger
                WHEN ms.mode = 'live' AND ms.fill_rate_30d < 0.30 AND ms.demand_signals_30d >= 20 THEN 'shortage'
                
                -- Recovery from rescue
                WHEN ms.mode = 'rescue' AND ms.fill_rate_30d >= 0.15 AND ms.avg_response_time_hours < 48 THEN 'shortage'
                
                -- Recovery from shortage
                WHEN ms.mode = 'shortage' AND ms.fill_rate_30d >= 0.40 THEN 'live'
                
                -- Forward progression: waitlist → live
                WHEN ms.mode = 'waitlist' AND ms.supply_count >= 50 AND ms.demand_signals_30d >= 10 AND ms.match_rate_30d >= 0.10 THEN 'live'
                
                -- Forward progression: demand_capture → waitlist
                WHEN ms.mode = 'demand_capture' AND ms.supply_count >= 25 AND ms.demand_signals_30d >= 5 THEN 'waitlist'
                
                -- Forward progression: seeding → demand_capture
                WHEN ms.mode = 'seeding' AND ms.supply_count >= 10 THEN 'demand_capture'
                
                -- No change
                ELSE ms.mode
            END AS recommended_mode,
            CASE
                WHEN ms.mode = 'live' AND (ms.fill_rate_30d < 0.10 OR ms.avg_response_time_hours > 48) THEN
                    format('RESCUE: fill_rate=%.2f, response_hours=%.1f', ms.fill_rate_30d, ms.avg_response_time_hours)
                WHEN ms.mode = 'live' AND ms.fill_rate_30d < 0.30 AND ms.demand_signals_30d >= 20 THEN
                    format('SHORTAGE: fill_rate=%.2f with %s demand signals', ms.fill_rate_30d, ms.demand_signals_30d)
                WHEN ms.mode = 'rescue' AND ms.fill_rate_30d >= 0.15 AND ms.avg_response_time_hours < 48 THEN
                    'RECOVERY: fill rate and response time improved'
                WHEN ms.mode = 'shortage' AND ms.fill_rate_30d >= 0.40 THEN
                    format('RESTORED: fill_rate=%.2f', ms.fill_rate_30d)
                WHEN ms.mode = 'waitlist' AND ms.supply_count >= 50 AND ms.demand_signals_30d >= 10 AND ms.match_rate_30d >= 0.10 THEN
                    format('ACTIVATE: supply=%s, demand=%s, match_rate=%.2f', ms.supply_count, ms.demand_signals_30d, ms.match_rate_30d)
                WHEN ms.mode = 'demand_capture' AND ms.supply_count >= 25 AND ms.demand_signals_30d >= 5 THEN
                    format('WAITLIST: supply=%s, demand=%s', ms.supply_count, ms.demand_signals_30d)
                WHEN ms.mode = 'seeding' AND ms.supply_count >= 10 THEN
                    format('DEMAND_CAPTURE: supply=%s reached threshold', ms.supply_count)
                ELSE 'no_change'
            END AS reason
        FROM public.market_states ms
    )
    SELECT e.market_key, e.current_mode, e.recommended_mode, e.reason
    FROM evaluations e
    WHERE e.current_mode != e.recommended_mode;
END;
$$;

-- Execute transitions and log them
CREATE OR REPLACE FUNCTION execute_market_transitions()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER := 0;
    v_row RECORD;
BEGIN
    FOR v_row IN SELECT * FROM public.evaluate_market_transitions()
    LOOP
        -- Update the market state
        UPDATE public.market_states
        SET mode = v_row.recommended_mode,
            last_evaluated = now()
        WHERE market_key = v_row.market_key;

        -- Log to swarm activity
        INSERT INTO public.swarm_activity_log (
            agent_name, domain, trigger_reason, action_taken,
            surfaces_touched, market_key, status, metadata
        ) VALUES (
            'market_governor',
            'market_mode',
            v_row.reason,
            format('mode_transition: %s → %s', v_row.current_mode, v_row.recommended_mode),
            ARRAY['market_states'],
            v_row.market_key,
            'completed',
            jsonb_build_object(
                'from_mode', v_row.current_mode,
                'to_mode', v_row.recommended_mode,
                'reason', v_row.reason
            )
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- The evaluator should also update hc_country_readiness when all markets in a country 
-- reach a new aggregate state
CREATE OR REPLACE FUNCTION sync_country_readiness_from_markets()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER := 0;
    v_row RECORD;
BEGIN
    FOR v_row IN
        SELECT
            ms.country_code,
            -- Country state = worst market state (conservative)
            CASE
                WHEN bool_or(ms.mode = 'rescue') THEN 'seed'
                WHEN bool_or(ms.mode = 'shortage') THEN 'seed'
                WHEN bool_or(ms.mode = 'live') THEN 'live'
                WHEN bool_or(ms.mode = 'waitlist') THEN 'seed'
                WHEN bool_or(ms.mode = 'demand_capture') THEN 'prepared'
                ELSE 'dormant'
            END AS derived_state,
            cr.market_state AS current_state
        FROM public.market_states ms
        JOIN public.hc_country_readiness cr ON cr.country_code = ms.country_code
        GROUP BY ms.country_code, cr.market_state
    LOOP
        IF v_row.derived_state != v_row.current_state THEN
            PERFORM public.promote_country(
                v_row.country_code,
                v_row.derived_state,
                'auto_sync_from_market_states'
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. RECONCILIATION VIEW: market_states ↔ hc_country_readiness
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_market_country_status AS
SELECT
    cr.country_code,
    cr.country_name,
    cr.market_state AS country_level_state,
    cr.total_score AS country_readiness_score,
    count(ms.market_key) AS market_count,
    count(ms.market_key) FILTER (WHERE ms.mode = 'live') AS live_markets,
    count(ms.market_key) FILTER (WHERE ms.mode = 'seeding') AS seeding_markets,
    count(ms.market_key) FILTER (WHERE ms.mode IN ('shortage', 'rescue')) AS distressed_markets,
    coalesce(sum(ms.supply_count), 0) AS total_supply,
    coalesce(sum(ms.demand_signals_30d), 0) AS total_demand_30d,
    coalesce(avg(ms.fill_rate_30d), 0) AS avg_fill_rate,
    cr.last_scored_at AS country_last_scored,
    max(ms.last_evaluated) AS markets_last_evaluated
FROM public.hc_country_readiness cr
LEFT JOIN public.market_states ms ON ms.country_code = cr.country_code
GROUP BY cr.country_code, cr.country_name, cr.market_state, cr.total_score, cr.last_scored_at
ORDER BY cr.total_score DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. CRON SCHEDULE (requires pg_cron extension)
-- Run market evaluator every 6 hours, country sync every 12 hours
-- ══════════════════════════════════════════════════════════════════════════════

-- These will only execute if pg_cron is available (Supabase Pro plan)
DO $$ BEGIN
    PERFORM cron.schedule(
        'evaluate-market-transitions',
        '0 */6 * * *',
        'SELECT execute_market_transitions()'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available — schedule evaluate-market-transitions manually';
END $$;

DO $$ BEGIN
    PERFORM cron.schedule(
        'sync-country-readiness',
        '0 */12 * * *',
        'SELECT sync_country_readiness_from_markets()'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available — schedule sync-country-readiness manually';
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. GRANTS
-- ══════════════════════════════════════════════════════════════════════════════

GRANT SELECT ON v_market_country_status TO authenticated;
