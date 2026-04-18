BEGIN;

-- 1. Grab the training_catalog ID for 'pilot-car-certification'
DO $$ 
DECLARE
  v_training_id UUID;
BEGIN
  SELECT id INTO v_training_id FROM public.training_catalog WHERE slug = 'pilot-car-certification' LIMIT 1;

  -- 2. Clean out old stuff if re-running
  DELETE FROM public.training_modules WHERE training_id = v_training_id;
  DELETE FROM public.training_levels WHERE training_id = v_training_id;

  -- 3. Insert 8 Structured Modules for the Master Pilot Car Curriculum
  INSERT INTO public.training_modules (training_id, sort_order, slug, title, summary, hours) VALUES
  (v_training_id, 1, 'regulatory-framework', 'Regulatory Framework & Compliance', 'Understanding federal vs. state regulations, FHWA vs FMCSA structures, and navigating multi-state transport permits.', 2),
  (v_training_id, 2, 'convoy-dynamics', 'Convoy Dynamics & Spacing', 'Technical breakdown of lead vs. chase vehicle spacing patterns based on speed, load width, and blindspots.', 1),
  (v_training_id, 3, 'route-surveying', 'Advanced Route Surveying', 'Bridge heights, structural capacities, turning radii, and hazard mapping along projected heavy haul corridors.', 2),
  (v_training_id, 4, 'radio-protocols', 'Standardized Radio Protocols', 'Clear, precise, and standardized VHF/CB radio communication between pilot cars and the heavy hauler.', 1),
  (v_training_id, 5, 'emergency-response', 'Emergency Response & Traffic Control', 'Strategies for handling blown tires, mechanical failures, and safely blocking intersections during transit.', 2),
  (v_training_id, 6, 'equipment-standards', 'Vehicle Equipment Standards', 'Rigging standards for signs, amber lights, height poles, and high-visibility apparel required across 50 states.', 1),
  (v_training_id, 7, 'insurance-liability', 'Insurance & Liability Moats', 'Understanding Professional Liability vs. Commercial Auto insurance limits and how to defend yourself from cargo claims.', 1),
  (v_training_id, 8, 'broker-negotiation', 'Broker Negotiation & Dispatch', 'Bidding on loads, evaluating broker credit scores, and reading standard escort contracts to maximize payout.', 1);

  -- 4. Insert Output Credentials / Levels
  INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json) VALUES
  (v_training_id, 'level-1-certified', 'Level 1: Federal Baseline', 'Passed all 8 modules and minimum competency exam.', 'badge-l1-pilot', 10, 50, '{"price_usd": 150}'::jsonb),
  (v_training_id, 'level-2-master', 'Level 2: Master Operator', 'Passed Level 1 + verified 50+ hours of physical logging via dispatcher sign-offs.', 'badge-l2-master', 30, 95, '{"price_usd": 300}'::jsonb);

  -- 5. Update catalog metadata
  UPDATE public.training_catalog 
  SET module_count = 8, hours_total = 11, pricing_mode = 'tiered', 
      pricing_json = '{"tier_1": 150, "tier_2": 300}'::jsonb
  WHERE id = v_training_id;

END $$;

COMMIT;
