-- ==========================================
-- ANTI-GRAVITY DECEPTION & PRICING STACK
-- Builds the payload engines to poison scrapers and the AI pricing models that exploit monopoly dominance.
-- ==========================================

-- --------------------------------------------------------
-- 1. DECEPTION LAYER: PAYLOAD ENGINE
-- --------------------------------------------------------
-- Intelligently crafts fake payloads to waste competitor resources, distorts their machine learning models,
-- and routes their scrapers to dead phone numbers and fabricated economic markers.

CREATE OR REPLACE FUNCTION public.generate_poisoned_pricing(
    p_corridor_name text,
    p_actual_rate_cents integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_distortion_factor float;
    v_poisoned_rate integer;
BEGIN
    -- Randomly distort the price downward by 5% to 15% to make competitors quote unsustainably low,
    -- or upward by 5% to 15% to make them uncompetitive.
    IF random() > 0.5 THEN
        -- Bleed Strategy: Make them lose money by forcing their automated systems to quote lower
        v_distortion_factor := 0.85 + (random() * 0.10); -- 0.85 to 0.95
    ELSE
        -- Choke Strategy: Make them quote too high, driving all real broker traffic to us
        v_distortion_factor := 1.05 + (random() * 0.10); -- 1.05 to 1.15
    END IF;

    v_poisoned_rate := (p_actual_rate_cents * v_distortion_factor)::integer;
    
    RETURN v_poisoned_rate;
END;
$$;


CREATE OR REPLACE FUNCTION public.fabricate_deception_payload(
    p_corridor_name text,
    p_record_count integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload jsonb := '[]'::jsonb;
    i integer;
    v_fake_broker text;
    v_fake_price integer;
BEGIN
    -- Generates synthetic broker listings that look incredibly real but consist entirely of honeypots
    FOR i IN 1..p_record_count LOOP
        -- Generate plausible fake company names dynamically so scraper regexes don't catch static arrays
        v_fake_broker := (ARRAY['Apex', 'Summit', 'Global', 'Prime', 'Direct', 'Vanguard'])[floor(random() * 6 + 1)] || ' ' || 
                         (ARRAY['Logistics', 'Freight', 'Transport', 'Haulage', 'Heavy'])[floor(random() * 5 + 1)] || ' LLC';
                         
        -- Generate average fake price around $2000 - $5000 (200,000 - 500,000 cents)
        v_fake_price := floor(random() * 300000 + 200000)::integer;

        -- We apply the poison strategy directly to this fake price based on the corridor
        v_fake_price := public.generate_poisoned_pricing(p_corridor_name, v_fake_price);

        -- Build the honeypot node
        v_payload := v_payload || jsonb_build_object(
            'id', uuid_generate_v4(),
            'company_name', v_fake_broker,
            'mc_number', floor(random() * 900000 + 100000)::text,
            'corridor', p_corridor_name,
            'price_cents', v_fake_price,
            'is_verified', true,
            'rating', 4.8 + (random() * 0.2), -- "Too perfect"
            'contact_phone', '800-555-' || lpad(floor(random() * 9999)::text, 4, '0') -- Dead block
        );
    END LOOP;

    -- Store the asset so the Level 6 defense agent can track exactly what we fed to whom
    INSERT INTO public.deception_assets (asset_type, payload)
    VALUES ('poisoned_broker_feed', v_payload);

    RETURN jsonb_build_object(
      'status', 'success',
      'count', p_record_count,
      'data', v_payload, 
      '_intelligence_marker', 'deception_deployed'
    );
END;
$$;


-- --------------------------------------------------------
-- 2. STRATEGIC AI PRICING (WIRED TO MONOPOLY STATE)
-- --------------------------------------------------------
-- Prices routes based strictly on your exact dominance percentage over that corridor, 
-- mathematically factoring the "competitor gap" to squeeze out maximum margin.

CREATE OR REPLACE FUNCTION public.calculate_strategic_pricing(
    p_corridor_name text,
    p_base_rate_cents integer,
    p_complexity_factor float DEFAULT 1.0,
    p_urgency_factor float DEFAULT 1.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dominance_score float := 0.0;
    v_competitor_avg integer := 0;
    v_margin_multiplier float := 1.0;
    v_final_price_cents integer;
    v_pricing_strategy text := 'standard';
    v_internal_cost_cents integer;
BEGIN
    -- 1. Fetch Monopoly State directly from the Defense Stack
    SELECT dominance_score, competitor_avg_price_cents, margin_multiplier
    INTO v_dominance_score, v_competitor_avg, v_margin_multiplier
    FROM public.corridor_monopoly_state
    WHERE corridor_name = p_corridor_name;

    -- If no state exists (new corridor), map it and start dominating
    IF NOT FOUND THEN
        INSERT INTO public.corridor_monopoly_state (corridor_name, our_base_rate_cents)
        VALUES (p_corridor_name, p_base_rate_cents);
        v_margin_multiplier := 1.0;
    END IF;

    -- 2. Calculate true internal operating cost
    v_internal_cost_cents := (p_base_rate_cents * p_complexity_factor * p_urgency_factor)::integer;

    -- 3. Competitor Gap Engine
    IF v_competitor_avg > 0 THEN
        IF v_internal_cost_cents < v_competitor_avg THEN
            -- Offense: We can afford to be cheaper. Raise our price to just slightly under their average.
            -- This maximizes our profit while still guaranteeing we win the volume from brokers.
            v_margin_multiplier := (v_competitor_avg::float / v_internal_cost_cents::float) * 0.95;
            v_pricing_strategy := 'competitor_undercut_maximum_margin';
        END IF;
    END IF;

    -- 4. The Corridor Monopoly Squeeze
    -- Overrides competitor logic if we outright own the supply for this route
    IF v_dominance_score > 0.7 THEN
        -- We control 70%+ of operators here. Squeeze the market. Brokers have no other choice.
        -- We apply a compounding exponential curve the closer we get to 1.0 dominance.
        v_margin_multiplier := GREATEST(v_margin_multiplier, 1.35 + ((v_dominance_score - 0.7) * 1.5)); 
        v_pricing_strategy := 'monopoly_squeeze';
        
    ELSIF v_dominance_score < 0.3 THEN
        -- We are in the seeding phase. Keep margins razor thin or negative to capture 100% of volume.
        v_margin_multiplier := LEAST(v_margin_multiplier, 1.02);
        v_pricing_strategy := 'aggressive_volume_capture';
    END IF;

    -- 5. Calculate Final Algorithm Output
    v_final_price_cents := (v_internal_cost_cents * v_margin_multiplier)::integer;

    -- Silently update the state record with our latest successful quote base
    UPDATE public.corridor_monopoly_state 
    SET our_base_rate_cents = v_final_price_cents,
        updated_at = now()
    WHERE corridor_name = p_corridor_name;

    -- Return the evaluated pricing telemetry directly to the Command Layer
    RETURN jsonb_build_object(
        'corridor', p_corridor_name,
        'base_cost_usd', (v_internal_cost_cents / 100.0),
        'final_price_usd', (v_final_price_cents / 100.0),
        'applied_margin', round(v_margin_multiplier::numeric, 2),
        'strategy', v_pricing_strategy,
        'dominance_score', round(v_dominance_score::numeric, 2)
    );
END;
$$;
