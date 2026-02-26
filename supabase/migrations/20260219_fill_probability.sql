-- 20260219_fill_probability.sql
-- Phase 14: Fill Probability & Predictive Analytics

-- 1. Schema Updates
alter table public.load_intel
add column if not exists fill_probability_01 numeric,
add column if not exists fill_signal text;

-- 2. Region Mapping Helper
create or replace function public.get_region_from_state(p_state text)
returns text
language plpgsql
immutable
as $$
begin
  case upper(p_state)
    -- Southeast
    when 'AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV' then return 'southeast';
    -- Midwest
    when 'IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI' then return 'midwest';
    -- West
    when 'AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY' then return 'west';
    -- Northeast
    when 'CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT' then return 'northeast';
    -- Southwest / South
    when 'TX', 'OK', 'AR', 'LA' then return 'southeast'; -- Mapping to existing benchmark regions
    else return 'southeast'; -- Default
  end case;
end;
$$;

-- 3. Updated Worker (Includes Rate Intel + Fill Prob)
create or replace function public.refresh_load_intel_incremental(
  p_batch int default 800,
  p_recent_minutes int default 180
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock boolean;
  v_processed int := 0;
  r record;
  
  -- Weights
  w_f numeric := 0.28; -- freshness
  w_q numeric := 0.18; -- quality
  w_t numeric := 0.18; -- trust
  w_l numeric := 0.16; -- lane density
  w_s numeric := 0.12; -- fill speed index
  w_b numeric := 0.08; -- backhaul

  v_f numeric; v_q numeric; v_t numeric; v_l numeric; v_s numeric; v_b numeric; 
  v_rate_pos numeric; v_fill_prob numeric;
  v_rank numeric;
  
  qg text; fs text; badges text[]; fbucket int;
  v_rate_signal text; v_fill_signal text;
  v_region text;
  v_benchmark record;
begin
  select pg_try_advisory_lock(22334455) into v_lock;
  if not v_lock then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  end if;

  -- [Existing Dirty Tracking logic preserved in underlying logic, but for this script we focus on the loop]
  -- (Assuming dirty tracking is already enqueuing loads)

  for r in
    select q.load_id, q.reason
    from public.load_intel_queue q
    order by q.priority asc, q.requested_at asc
    limit p_batch
  loop
    declare
      l record;
      bm record;
      ln record;
      lane_key_val text;
    begin
      select * into l from public.loads where id = r.load_id and status='active';
      if l is null then
        delete from public.load_intel_queue where load_id = r.load_id;
        continue;
      end if;

      -- 1. Fetch Metrics
      select trust_score, fill_speed_score into bm
      from public.broker_metrics
      where broker_id = l.broker_id
      limit 1;

      lane_key_val := (
        lower(l.origin_country)||':'||lower(l.origin_admin1)||':'||lower(l.origin_city)
        ||'__'||
        lower(l.dest_country)||':'||lower(l.dest_admin1)||':'||lower(l.dest_city)
        ||'__'||
        lower(l.service_required)
      );

      select lane_density_score_30d, fill_speed_index_30d into ln
      from public.lanes
      where lane_key = lane_key_val
      limit 1;

      -- 2. Base Scores
      v_f := public.freshness_01(l.posted_at);
      v_q := greatest(0, least(1, coalesce(l.data_completeness_score, 0)));
      v_t := greatest(0, least(1, coalesce((bm).trust_score, 0.5)));
      v_l := greatest(0, least(1, coalesce((ln).lane_density_score_30d, 0.35)));
      v_s := greatest(0, least(1, coalesce((ln).fill_speed_index_30d, 0.55)));
      v_b := public.backhaul_prob_v1_01(
        l.origin_country, l.origin_admin1, l.origin_city,
        l.dest_country, l.dest_admin1, l.dest_city,
        l.service_required, l.posted_at
      );

      -- 3. Rate Score (Phase 13 Logic)
      v_region := public.get_region_from_state(l.origin_admin1);
      select low_per_mile, high_per_mile into v_benchmark
      from public.rate_benchmarks
      where country = l.origin_country and region = v_region and service_type = lower(l.service_required)
      limit 1;

      if v_benchmark is not null and l.rate_amount > 0 then
          v_rate_pos := public.compute_rate_position_01(l.rate_amount, v_benchmark.low_per_mile, v_benchmark.high_per_mile);
      else
          v_rate_pos := 0.5; -- Neutral if no benchmark
      end if;

      v_rate_signal := case
        when v_rate_pos >= 0.65 then 'strong'
        when v_rate_pos >= 0.40 then 'fair'
        else 'below'
      end;

      -- 4. Fill Probability (Phase 14 Logic)
      -- Probability = Broker Trust * Lane Fill Speed * Rate Strength
      -- Adjust trust to not be too punishing if unknown
      v_fill_prob := greatest(0, least(1, v_t * v_s * (0.5 + 0.5 * v_rate_pos))); 
      
      v_fill_signal := case
        when v_fill_prob >= 0.70 then 'Likely to fill fast'
        when v_fill_prob >= 0.40 then 'Normal'
        else 'Slow mover'
      end;

      -- 5. Calculate Final Rank
      v_rank := (v_f*w_f + v_q*w_q + v_t*w_t + v_l*w_l + v_s*w_s + v_b*w_b);
      -- Adjustment for Rate Strength
      if v_rate_pos >= 0.80 then v_rank := v_rank + 0.05; end if;
      if v_rate_pos < 0.35 then v_rank := v_rank - 0.05; end if;
      
      -- Penalties
      if v_q < 0.50 then v_rank := v_rank - 0.12; end if;
      if v_t < 0.35 then v_rank := v_rank - 0.10; end if;
      
      v_rank := greatest(0, least(1, v_rank));

      -- 6. Formatting / Grading
      if v_q >= 0.85 then qg := 'A';
      elsif v_q >= 0.70 then qg := 'B';
      elsif v_q >= 0.50 then qg := 'C';
      else qg := 'D'; end if;

      if v_s >= 0.75 then fs := 'Fast-fill';
      elsif v_s >= 0.55 then fs := 'Mid-fill';
      elsif v_s >= 0.35 then fs := 'Slow-fill';
      else fs := 'Unknown'; end if;

      badges := '{}';
      if v_l >= 0.70 then badges := array_append(badges, 'HOT'); end if;
      if v_s >= 0.75 then badges := array_append(badges, 'FAST-FILL'); end if;
      if v_b >= 0.70 then badges := array_append(badges, 'RETURN-LIKELY'); end if;

      fbucket := case
          when now() - l.posted_at <= interval '30 minutes' then 0
          when now() - l.posted_at <= interval '2 hours' then 1
          when now() - l.posted_at <= interval '6 hours' then 2
          when now() - l.posted_at <= interval '24 hours' then 3
          else 4 end;

      -- 7. UPSERT Load Intel
      insert into public.load_intel(
        load_id, freshness_01, load_quality_01, broker_trust_01, lane_density_01, fill_speed_01, backhaul_prob_01,
        rate_position_01, rate_signal, fill_probability_01, fill_signal,
        load_quality_grade, fill_speed_label, lane_badges,
        load_rank, freshness_bucket, computed_at
      )
      values(
        r.id, v_f, v_q, v_t, v_l, v_s, v_b,
        v_rate_pos, v_rate_signal, v_fill_prob, v_fill_signal,
        qg, fs, badges,
        round((v_rank*100)::numeric, 1), fbucket, now()
      )
      on conflict (load_id) do update set
        freshness_01 = excluded.freshness_01,
        load_quality_01 = excluded.load_quality_01,
        broker_trust_01 = excluded.broker_trust_01,
        lane_density_01 = excluded.lane_density_01,
        fill_speed_01 = excluded.fill_speed_01,
        backhaul_prob_01 = excluded.backhaul_prob_01,
        rate_position_01 = excluded.rate_position_01,
        rate_signal = excluded.rate_signal,
        fill_probability_01 = excluded.fill_probability_01,
        fill_signal = excluded.fill_signal,
        load_quality_grade = excluded.load_quality_grade,
        fill_speed_label = excluded.fill_speed_label,
        lane_badges = excluded.lane_badges,
        load_rank = excluded.load_rank,
        freshness_bucket = excluded.freshness_bucket,
        computed_at = excluded.computed_at;

      delete from public.load_intel_queue where load_id = r.load_id;
      v_processed := v_processed + 1;
    end;
  end loop;

  perform pg_advisory_unlock(22334455);
  return jsonb_build_object('ok', true, 'processed', v_processed, 'batch', p_batch);
end;
$$;

-- 4. Update View
create or replace view public.directory_active_loads_view as
select
  l.id,
  l.public_id,
  l.service_required,
  l.origin_country, l.origin_admin1, l.origin_city,
  l.dest_country, l.dest_admin1, l.dest_city,
  l.posted_at,
  l.load_date,
  l.rate_amount, l.rate_currency,
  l.status,
  
  coalesce(li.load_rank, 0) as load_rank,
  li.load_quality_grade,
  li.fill_speed_label,
  li.lane_badges,
  coalesce(li.backhaul_prob_01, 0) as backhaul_prob_01,
  
  -- Phase 13/14 Additions
  li.rate_signal,
  li.fill_signal,
  li.fill_probability_01,
  
  bm.trust_score as broker_trust_score,
  bm.avg_days_to_pay as broker_avg_days_to_pay
from public.loads l
left join public.load_intel li on li.load_id = l.id
left join public.broker_metrics bm on bm.broker_id = l.broker_id
where l.status = 'active';
