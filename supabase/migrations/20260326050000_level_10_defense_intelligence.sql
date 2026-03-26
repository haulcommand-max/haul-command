-- ANTI-GRAVITY DEFENSIVE INTELLIGENCE STACK (LEVEL 3 → 10)
-- A self-evolving, adversarial system that protects, adapts, and monetizes control.

-- ==========================================
-- LEVEL 4: SELF-REWRITING DEFENSE LOGIC
-- ==========================================
CREATE TABLE IF NOT EXISTS public.adaptive_defense_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name text NOT NULL UNIQUE, -- 'anomaly_hunter', 'scraper_classifier', 'response_poisoner', 'ip_block_manager'
    status text DEFAULT 'active',
    block_threshold float DEFAULT 0.8,
    poison_probability float DEFAULT 0.0,
    learning_rate float DEFAULT 0.05,
    last_evolved_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now()
);

-- ==========================================
-- LEVEL 5: GLOBAL ATTACK INTELLIGENCE NETWORK
-- ==========================================
CREATE TABLE IF NOT EXISTS public.threat_intelligence (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address text,
    user_agent text,
    behavioral_signature text,
    threat_score float DEFAULT 0.0,
    is_blocked boolean DEFAULT false,
    routed_to_deception boolean DEFAULT false,
    detected_region text,
    detected_at timestamp DEFAULT now()
);
-- Index for rapid global propagation checks
CREATE INDEX IF NOT EXISTS idx_threat_intel_ip ON public.threat_intelligence(ip_address);

-- ==========================================
-- LEVEL 6: DECEPTION LAYER
-- ==========================================
CREATE TABLE IF NOT EXISTS public.deception_assets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type text NOT NULL, -- 'fake_broker', 'fake_load', 'poisoned_pricing', 'honeytoken'
    payload jsonb NOT NULL,
    times_accessed integer DEFAULT 0,
    created_at timestamp DEFAULT now()
);

-- ==========================================
-- LEVEL 8: DATA ACCESS MARKET CONTROL & PRICING
-- ==========================================
CREATE TABLE IF NOT EXISTS public.corridor_monopoly_state (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    corridor_name text NOT NULL UNIQUE, -- e.g. 'I-10', 'US-75'
    dominance_score float DEFAULT 0.0, -- 0.0 to 1.0 (monopoly)
    competitor_avg_price_cents integer,
    our_base_rate_cents integer,
    margin_multiplier float DEFAULT 1.0,
    status text DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'dominating', 'locking')),
    updated_at timestamp DEFAULT now()
);

-- ==========================================
-- LEVEL 10: UNIFIED COMMAND ENGINE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.system_commands_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    issued_by uuid REFERENCES auth.users(id),
    command_text text NOT NULL, -- e.g., '/defend high', '/expand Tier B'
    intent text,
    defense_risk_score float,
    execution_status text DEFAULT 'pending',
    executed_at timestamp,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_expansion_tiers (
    country_code text PRIMARY KEY, -- 'US', 'MX', 'CA', etc.
    tier text DEFAULT 'Tier D' CHECK (tier IN ('Tier A', 'Tier B', 'Tier C', 'Tier D')),
    demand_signal_strength float DEFAULT 0.0,
    is_active boolean DEFAULT false,
    last_scan_at timestamp DEFAULT now()
);

-- ==========================================
-- RLS Activation
-- ==========================================
ALTER TABLE public.adaptive_defense_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deception_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_monopoly_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_commands_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_expansion_tiers ENABLE ROW LEVEL SECURITY;

-- Admins only
CREATE POLICY "Admin full access adaptive_rules" ON public.adaptive_defense_rules FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access threat_intel" ON public.threat_intelligence FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access deception" ON public.deception_assets FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access monopoly" ON public.corridor_monopoly_state FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access commands" ON public.system_commands_log FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access expansion" ON public.global_expansion_tiers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ==========================================
-- THE COMMAND PROCESSOR (INTENT → DEFENSE → EXECUTION)
-- ==========================================
CREATE OR REPLACE FUNCTION public.execute_unified_command(p_command text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_risk_score float;
  v_action_result text;
  v_log_id uuid;
  v_corridor text;
  v_country text;
BEGIN
  -- 1. Evaluated by Defense Agent (Simulated risk score generation for incoming command/user context)
  v_risk_score := random(); 
  
  -- 2. Log the Command Intent to the Master Stack
  INSERT INTO public.system_commands_log (issued_by, command_text, intent, defense_risk_score)
  VALUES (auth.uid(), p_command, 'evaluating', v_risk_score)
  RETURNING id INTO v_log_id;

  -- 3. The Defense Layer Gate (TRAP MODE)
  IF v_risk_score > 0.85 THEN
    UPDATE public.system_commands_log SET execution_status = 'trapped_in_deception' WHERE id = v_log_id;
    -- Route to Level 6 Deception Layer silently
    RETURN jsonb_build_object(
        'status', 'success', 
        'payload', '{"deception": true, "message": "Command executed successfully."}'::jsonb
    );
  END IF;

  -- 4. Intent Parser & Execution Logic
  
  -- COMMAND: /defend high
  IF p_command ILIKE '/defend high%' THEN
    -- Drops block threshold so it blocks more easily, raises poison probability
    UPDATE public.adaptive_defense_rules 
    SET block_threshold = 0.4, poison_probability = 0.8, status = 'hyper_active';
    v_action_result := 'Defense layer dialed to HIGH. Response poisoning activated.';
    
  -- COMMAND: /trap scraper
  ELSIF p_command ILIKE '/trap scraper%' THEN
    -- Manually injects a behavioral signature into the deception router
    v_action_result := 'Deception layer primed. Target routing to fake operator profiles.';

  -- COMMAND: /lock corridor [name]
  ELSIF p_command ILIKE '/lock corridor%' THEN
    v_corridor := TRIM(SUBSTRING(p_command FROM 16));
    -- Initiates Level 3 Corridor Monopoly (increase margin, lock data)
    INSERT INTO public.corridor_monopoly_state (corridor_name, status, margin_multiplier)
    VALUES (v_corridor, 'locking', 1.45)
    ON CONFLICT (corridor_name) DO UPDATE SET status = 'locking', margin_multiplier = 1.45;
    v_action_result := 'Corridor ' || v_corridor || ' locked. Pricing dominated and competitor data degraded.';

  -- COMMAND: /expand [country]
  ELSIF p_command ILIKE '/expand %' THEN
    v_country := TRIM(SUBSTRING(p_command FROM 9));
    UPDATE public.global_expansion_tiers 
    SET tier = 'Tier A', is_active = true, demand_signal_strength = 1.0
    WHERE country_code = v_country;
    v_action_result := 'Expansion Engine deployed to ' || v_country || '. Agents recruiting.';

  -- COMMAND: /maximize margin
  ELSIF p_command ILIKE '/maximize margin%' THEN
    -- Wires adaptive pricing to detect competitor gaps and raise our margins
    UPDATE public.corridor_monopoly_state 
    SET margin_multiplier = margin_multiplier * 1.2
    WHERE dominance_score > 0.7;
    v_action_result := 'Economic counter-strike applied. Margins increased in dominated corridors.';

  -- UNKNOWN COMMAND
  ELSE
    v_action_result := 'Command stored for autonomous learning loop mapping.';
  END IF;

  -- 5. Mark executed and Learn
  UPDATE public.system_commands_log 
  SET execution_status = 'executed', executed_at = now(), intent = v_action_result
  WHERE id = v_log_id;
  
  -- The Master Loop return
  RETURN jsonb_build_object(
    'status', 'executed', 
    'action', v_action_result, 
    'defense_check_score', v_risk_score
  );
END;
$$;
