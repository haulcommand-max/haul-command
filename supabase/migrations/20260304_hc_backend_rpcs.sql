-- ===========================
-- HAUL COMMAND: Backend RPCs Migration
-- Quality Scoring + Leads Router + Ad Inventory + Claim Funnel
-- Apply via: Supabase MCP apply_migration or SQL editor
-- ===========================

-- ═══ QUALITY SCORING RPC ═══
CREATE OR REPLACE FUNCTION hc.score_operators_batch(p_country_code text DEFAULT NULL, p_batch int DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, hc
AS $$
DECLARE
  op record;
  scored int := 0;
  completeness numeric;
  contact numeric;
  geo numeric;
  trust numeric;
  monetization numeric;
  final_score numeric;
  badges text[];
  cert_count int;
BEGIN
  FOR op IN
    SELECT o.id, o.display_name, o.company_name, o.phone, o.email, o.website_url,
           o.home_base_city, o.home_base_state, o.country_code, o.latitude, o.longitude,
           o.is_claimed, o.verification_status, o.insurance_status, o.certifications_json,
           o.us_dot_number, o.vehicle_type, o.trust_score, o.review_count, o.completed_escorts
    FROM hc.operators o
    WHERE (p_country_code IS NULL OR o.country_code = p_country_code)
    ORDER BY o.updated_at ASC NULLS FIRST
    LIMIT p_batch
  LOOP
    completeness := 0;
    IF op.display_name IS NOT NULL OR op.company_name IS NOT NULL THEN completeness := completeness + 15; END IF;
    IF op.phone IS NOT NULL THEN completeness := completeness + 20; END IF;
    IF op.email IS NOT NULL THEN completeness := completeness + 15; END IF;
    IF op.website_url IS NOT NULL THEN completeness := completeness + 10; END IF;
    IF op.vehicle_type IS NOT NULL THEN completeness := completeness + 10; END IF;
    IF op.us_dot_number IS NOT NULL THEN completeness := completeness + 15; END IF;
    IF op.home_base_city IS NOT NULL THEN completeness := completeness + 10; END IF;
    IF op.home_base_state IS NOT NULL THEN completeness := completeness + 5; END IF;
    completeness := least(100, completeness);

    contact := 0;
    IF op.phone IS NOT NULL THEN contact := contact + 50; END IF;
    IF op.email IS NOT NULL THEN contact := contact + 30; END IF;
    IF op.website_url IS NOT NULL THEN contact := contact + 20; END IF;
    contact := least(100, contact);

    geo := 0;
    IF op.latitude IS NOT NULL AND op.longitude IS NOT NULL THEN geo := geo + 50; END IF;
    IF op.home_base_city IS NOT NULL THEN geo := geo + 30; END IF;
    IF op.home_base_state IS NOT NULL THEN geo := geo + 20; END IF;
    geo := least(100, geo);

    trust := 0;
    IF op.verification_status = 'verified' THEN trust := trust + 35; END IF;
    IF op.insurance_status = 'verified' THEN trust := trust + 25; END IF;
    IF op.is_claimed THEN trust := trust + 20; END IF;
    cert_count := coalesce(jsonb_array_length(
      coalesce((SELECT jsonb_agg(key) FROM jsonb_each(coalesce(op.certifications_json, '{}'::jsonb)) WHERE value = 'true'), '[]'::jsonb)
    ), 0);
    trust := trust + least(20, cert_count * 5);
    trust := least(100, trust);

    monetization := 0;
    IF op.is_claimed THEN monetization := monetization + 40; END IF;
    IF op.verification_status = 'verified' THEN monetization := monetization + 25; END IF;
    IF op.phone IS NOT NULL AND op.email IS NOT NULL THEN monetization := monetization + 20; END IF;
    IF coalesce(op.completed_escorts, 0) > 0 THEN monetization := monetization + 15; END IF;
    monetization := least(100, monetization);

    final_score := round(completeness * 0.20 + contact * 0.15 + geo * 0.15 + trust * 0.30 + monetization * 0.20);

    badges := '{}';
    IF final_score >= 80 THEN badges := array_append(badges, 'top_performer'); END IF;
    IF completeness >= 90 THEN badges := array_append(badges, 'complete_profile'); END IF;
    IF trust >= 75 THEN badges := array_append(badges, 'trusted'); END IF;
    IF contact >= 100 THEN badges := array_append(badges, 'reachable'); END IF;
    IF monetization >= 80 THEN badges := array_append(badges, 'revenue_ready'); END IF;

    INSERT INTO hc.operator_quality (operator_id, country_code, completeness_score, contact_score, geo_score, trust_score, monetization_score, final_score, badges, last_scored_at, score_inputs)
    VALUES (op.id, coalesce(op.country_code, 'US'), completeness, contact, geo, trust, monetization, final_score, badges, now(),
      jsonb_build_object('has_phone', op.phone IS NOT NULL, 'has_email', op.email IS NOT NULL, 'is_claimed', coalesce(op.is_claimed, false), 'is_verified', op.verification_status = 'verified'))
    ON CONFLICT (operator_id) DO UPDATE SET
      country_code = EXCLUDED.country_code, completeness_score = EXCLUDED.completeness_score,
      contact_score = EXCLUDED.contact_score, geo_score = EXCLUDED.geo_score,
      trust_score = EXCLUDED.trust_score, monetization_score = EXCLUDED.monetization_score,
      final_score = EXCLUDED.final_score, badges = EXCLUDED.badges,
      last_scored_at = EXCLUDED.last_scored_at, score_inputs = EXCLUDED.score_inputs;

    scored := scored + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'scored', scored, 'country_code', coalesce(p_country_code, 'ALL'));
END $$;

-- ═══ LEADS ROUTER RPC ═══
CREATE OR REPLACE FUNCTION hc.route_new_leads(p_batch int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, hc
AS $$
DECLARE
  lead_rec record;
  best_op uuid;
  best_score numeric;
  routed int := 0;
  expired int := 0;
BEGIN
  FOR lead_rec IN SELECT * FROM hc.leads WHERE status = 'new' ORDER BY created_at LIMIT p_batch
  LOOP
    SELECT operator_id, final_score INTO best_op, best_score
    FROM hc.operator_quality
    WHERE country_code = lead_rec.country_code AND final_score >= 20
    ORDER BY final_score DESC LIMIT 1;

    IF best_op IS NOT NULL THEN
      UPDATE hc.leads SET status = 'routed', routed_to_operator_id = best_op,
        routed_at = now(), expires_at = now() + interval '24 hours'
      WHERE id = lead_rec.id AND status = 'new';
      routed := routed + 1;
    END IF;
  END LOOP;

  UPDATE hc.leads SET status = 'expired', routed_to_operator_id = NULL
  WHERE status = 'routed' AND expires_at < now();
  GET DIAGNOSTICS expired = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'routed', routed, 'expired', expired);
END $$;

-- ═══ AD INVENTORY GENERATOR RPC ═══
CREATE OR REPLACE FUNCTION hc.generate_ad_inventory(p_country_code text DEFAULT 'US')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, hc
AS $$
DECLARE
  cat_rec record;
  created int := 0;
  inv_key text;
BEGIN
  p_country_code := upper(p_country_code);

  FOR cat_rec IN SELECT DISTINCT category::text as cat FROM hc.surfaces WHERE country_code = p_country_code
  LOOP
    inv_key := p_country_code || '_' || cat_rec.cat || '_featured';
    INSERT INTO hc.ad_inventory (country_code, inventory_key, product, placement, floor_cents, rules, is_active)
    VALUES (p_country_code, inv_key, 'sponsored_listing', cat_rec.cat || '_featured', 500,
      jsonb_build_object('category', cat_rec.cat, 'max_per_page', 3), true)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN created := created + 1; END IF;

    inv_key := p_country_code || '_' || cat_rec.cat || '_brand_defense';
    INSERT INTO hc.ad_inventory (country_code, inventory_key, product, placement, floor_cents, rules, is_active)
    VALUES (p_country_code, inv_key, 'brand_defense', cat_rec.cat || '_brand_defense', 2000,
      jsonb_build_object('category', cat_rec.cat, 'exclusive', true), true)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN created := created + 1; END IF;
  END LOOP;

  FOR cat_rec IN SELECT DISTINCT corridor_geo_key as corr FROM hc.surfaces
    WHERE country_code = p_country_code AND corridor_geo_key IS NOT NULL
  LOOP
    inv_key := p_country_code || '_corridor_' || left(cat_rec.corr, 20) || '_takeover';
    INSERT INTO hc.ad_inventory (country_code, inventory_key, product, placement, floor_cents, rules, is_active)
    VALUES (p_country_code, inv_key, 'takeover', 'corridor_takeover', 10000,
      jsonb_build_object('corridor', cat_rec.corr, 'exclusive', true), true)
    ON CONFLICT DO NOTHING;
    IF FOUND THEN created := created + 1; END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'country_code', p_country_code, 'ad_slots_created', created);
END $$;

-- ═══ SURFACE CLAIM FUNNEL RPCs ═══
CREATE OR REPLACE FUNCTION hc.claim_surface(
  p_surface_id uuid, p_user_id uuid, p_verification_route text DEFAULT 'phone'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, hc
AS $$
DECLARE surf record; claim_id uuid;
BEGIN
  SELECT * INTO surf FROM hc.surfaces WHERE surface_id = p_surface_id;
  IF surf IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Surface not found'); END IF;
  IF surf.claim_status != 'unclaimed' THEN RETURN jsonb_build_object('ok', false, 'error', 'Already claimed'); END IF;

  claim_id := gen_random_uuid();
  UPDATE hc.surfaces SET claim_status = 'pending', updated_at = now() WHERE surface_id = p_surface_id;

  INSERT INTO hc.audit_events (event_type, country_code, severity, message, details)
  VALUES ('surface_claim_initiated', surf.country_code, 'info', 'Surface claim initiated: ' || surf.name,
    jsonb_build_object('surface_id', p_surface_id, 'user_id', p_user_id, 'route', p_verification_route, 'claim_id', claim_id));

  RETURN jsonb_build_object('ok', true, 'claim_id', claim_id, 'surface_id', p_surface_id, 'verification_route', p_verification_route);
END $$;

CREATE OR REPLACE FUNCTION hc.verify_surface_claim(p_surface_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, hc
AS $$
DECLARE surf record;
BEGIN
  SELECT * INTO surf FROM hc.surfaces WHERE surface_id = p_surface_id;
  IF surf IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Surface not found'); END IF;
  IF surf.claim_status != 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'Not in pending state'); END IF;

  UPDATE hc.surfaces SET claim_status = 'claimed', status = 'verified', updated_at = now() WHERE surface_id = p_surface_id;

  INSERT INTO hc.audit_events (event_type, country_code, severity, message, details)
  VALUES ('surface_claim_verified', surf.country_code, 'info', 'Surface claimed: ' || surf.name,
    jsonb_build_object('surface_id', p_surface_id, 'user_id', p_user_id));

  RETURN jsonb_build_object('ok', true, 'surface_id', p_surface_id, 'status', 'claimed');
END $$;

-- ═══ CRON JOBS ═══
-- Quality scoring: every 6 hours
SELECT cron.schedule(
  'hc_quality_scoring_worker',
  '0 */6 * * *',
  $$SELECT hc.score_operators_batch(NULL, 1000)$$
);

-- Leads routing: every 5 minutes
SELECT cron.schedule(
  'hc_leads_router',
  '*/5 * * * *',
  $$SELECT hc.route_new_leads(100)$$
);

-- Ad inventory generation: daily at 5 AM UTC
SELECT cron.schedule(
  'hc_ad_inventory_gen',
  '0 5 * * *',
  $$SELECT hc.generate_ad_inventory('US')$$
);
