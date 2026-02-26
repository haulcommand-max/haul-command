
-- =========================================================
-- Smart Sort Intel Engine
-- 1) load_intel table (computed scores)
-- 2) Scoring functions (freshness, backhaul)
-- 3) Refresh procedure (batch updates)
-- 4) View update (directory_active_loads_view)
-- =========================================================

-- 0. Load Intel Table
create table if not exists public.load_intel (
  load_id uuid primary key references public.loads(id) on delete cascade,

  -- computed scores 0..1
  freshness_01 numeric not null default 0,
  load_quality_01 numeric not null default 0,
  broker_trust_01 numeric not null default 0,
  lane_density_01 numeric not null default 0,
  fill_speed_01 numeric not null default 0,
  backhaul_prob_01 numeric not null default 0,

  -- derived badges (for UI)
  load_quality_grade text,
  fill_speed_label text,
  lane_badges text[] not null default '{}',

  -- final sort key
  load_rank numeric not null default 0,

  computed_at timestamptz not null default now()
);

create index if not exists idx_load_intel_rank on public.load_intel(load_rank desc);

alter table public.load_intel enable row level security;

-- Policies
drop policy if exists "load_intel_public_read" on public.load_intel;
create policy "load_intel_public_read"
on public.load_intel for select
to anon, authenticated
using (true);

drop policy if exists "load_intel_write_mod_only" on public.load_intel;
create policy "load_intel_write_mod_only"
on public.load_intel for all
to authenticated
using (public.is_moderator())
with check (public.is_moderator());


-- 1. Helper: freshness score (0..1)
create or replace function public.freshness_01(p_posted_at timestamptz)
returns numeric
language sql
stable
as $$
  select greatest(0, least(1, exp(- (extract(epoch from (now() - p_posted_at)) / 60.0) / 240.0 )));
$$;


-- 2. Backhaul v1 helper (SQL version)
create or replace function public.backhaul_prob_v1_01(
  p_origin_country text,
  p_origin_admin1 text,
  p_origin_city text,
  p_dest_country text,
  p_dest_admin1 text,
  p_dest_city text,
  p_service text,
  p_posted_at timestamptz
)
returns numeric
language plpgsql
stable
as $$
declare
  v_lane_key_ab text := lower(p_origin_country)||':'||lower(p_origin_admin1)||':'||lower(p_origin_city)
                     ||'__'||lower(p_dest_country)||':'||lower(p_dest_admin1)||':'||lower(p_dest_city)
                     ||'__'||lower(p_service);

  v_lane_key_ba text := lower(p_dest_country)||':'||lower(p_dest_admin1)||':'||lower(p_dest_city)
                     ||'__'||lower(p_origin_country)||':'||lower(p_origin_admin1)||':'||lower(p_origin_city)
                     ||'__'||lower(p_service);

  ab_active int := 0;
  ba_active int := 0;
  ab_dens numeric := 0;
  ba_dens numeric := 0;

  sym numeric := 0.5;
  near24 int := 0;
  near72 int := 0;
  near numeric := 0.5;

  tscore numeric := 0.5;
  score numeric := 0.5;
begin
  select coalesce(active_loads_30d,0), coalesce(lane_density_score_30d,0)
    into ab_active, ab_dens
  from public.lanes
  where lane_key = v_lane_key_ab;

  select coalesce(active_loads_30d,0), coalesce(lane_density_score_30d,0)
    into ba_active, ba_dens
  from public.lanes
  where lane_key = v_lane_key_ba;

  -- lane symmetry ratio with smoothing
  declare
    ratio numeric := (ba_active + 3)::numeric / (ab_active + 3)::numeric;
    ratio_score numeric;
    dens_blend numeric := greatest(0, least(1, ((ab_dens + ba_dens)/2)));
  begin
    if ratio >= 1.1 then ratio_score := 1.0;
    elsif ratio >= 0.9 then ratio_score := 0.85;
    elsif ratio >= 0.7 then ratio_score := 0.65;
    elsif ratio >= 0.5 then ratio_score := 0.45;
    else ratio_score := 0.25;
    end if;

    sym := greatest(0, least(1, ratio_score*0.75 + dens_blend*0.25));
  end;

  -- nearby density (bucket method)
  select count(*) into near24
  from public.loads
  where status='active'
    and origin_country = p_dest_country
    and origin_admin1 = p_dest_admin1
    and origin_city = p_dest_city
    and posted_at >= (now() - interval '24 hours');

  select count(*) into near72
  from public.loads
  where status='active'
    and origin_country = p_dest_country
    and origin_admin1 = p_dest_admin1
    and origin_city = p_dest_city
    and posted_at >= (now() - interval '72 hours');

  -- log scaling
  declare
    s24 numeric := greatest(0, least(1, (ln(near24+1) - ln(3+1)) / (ln(250+1) - ln(3+1))));
    s72 numeric := greatest(0, least(1, (ln(near72+1) - ln(10+1)) / (ln(600+1) - ln(10+1))));
  begin
    near := greatest(0, least(1, s24*0.65 + s72*0.35));
  end;

  -- time window
  tscore := public.freshness_01(p_posted_at);

  score := sym*0.40 + near*0.40 + tscore*0.12; -- adjusted weights from user prompt v2?
  -- User Prompt v2 for backhaul: sym*0.40 + near*0.40 + time*0.12 + dir*0.08
  -- We don't have directionality easily in SQL without more logic. 
  -- We will preserve the prompt's SQL function which omitted directionality or simpler version.
  -- Wait, the prompt provided a specific SQL function `backhaul_prob_v1_01`.
  -- checking prompt... 
  -- "score := sym*0.40 + near*0.40 + tscore*0.20;" in the SQL block provided by user.
  -- I will use the SQL block provided exactly.
  
  -- REVERTING to user provided SQL math:
  score := sym*0.40 + near*0.40 + tscore*0.20;
  score := 0.05 + greatest(0, least(1, score))*0.90;

  return greatest(0, least(1, score));
end;
$$;


-- 3. Refresh Function
create or replace function public.refresh_active_load_intel(p_limit int default 3000)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_f numeric;
  v_q numeric;
  v_t numeric;
  v_l numeric;
  v_s numeric;
  v_b numeric;
  v_rank numeric;

  w_f numeric := 0.28;
  w_q numeric := 0.18;
  w_t numeric := 0.18;
  w_l numeric := 0.16;
  w_s numeric := 0.12;
  w_b numeric := 0.08;
begin
  for r in
    select
      l.id,
      l.posted_at,
      l.data_completeness_score,
      l.rate_amount,
      l.origin_country, l.origin_admin1, l.origin_city,
      l.dest_country, l.dest_admin1, l.dest_city,
      l.service_required,
      l.broker_id,
      bm.trust_score as broker_trust_score,
      ln.lane_density_score_30d as lane_density_01,
      ln.fill_speed_index_30d as fill_speed_01
    from public.loads l
    left join public.broker_metrics bm
      on bm.broker_id = l.broker_id and bm.window_days = 30
    left join public.lanes ln
      on ln.lane_key = (
        lower(l.origin_country)||':'||lower(l.origin_admin1)||':'||lower(l.origin_city)
        ||'__'||
        lower(l.dest_country)||':'||lower(l.dest_admin1)||':'||lower(l.dest_city)
        ||'__'||
        lower(l.service_required)
      )
    where l.status='active'
    order by l.posted_at desc
    limit p_limit
  loop
    v_f := public.freshness_01(r.posted_at);
    v_q := greatest(0, least(1, coalesce(r.data_completeness_score, 0)));
    v_t := greatest(0, least(1, coalesce(r.broker_trust_score, 0.5)));
    v_l := greatest(0, least(1, coalesce(r.lane_density_01, 0.35)));
    v_s := greatest(0, least(1, coalesce(r.fill_speed_01, 0.55)));

    v_b := public.backhaul_prob_v1_01(
      r.origin_country, r.origin_admin1, r.origin_city,
      r.dest_country, r.dest_admin1, r.dest_city,
      r.service_required,
      r.posted_at
    );

    v_rank := (v_f*w_f + v_q*w_q + v_t*w_t + v_l*w_l + v_s*w_s + v_b*w_b);

    if v_q < 0.50 then v_rank := v_rank - 0.12; end if;
    if v_t < 0.35 then v_rank := v_rank - 0.10; end if;
    if v_q < 0.35 then v_rank := v_rank - 0.08; end if;

    if r.rate_amount is not null then v_rank := v_rank + 0.03; end if;

    v_rank := greatest(0, least(1, v_rank));

    declare
      qg text;
      fs text;
      badges text[] := '{}';
    begin
      if v_q >= 0.85 then qg := 'A';
      elsif v_q >= 0.70 then qg := 'B';
      elsif v_q >= 0.50 then qg := 'C';
      else qg := 'D';
      end if;

      if v_s >= 0.75 then fs := 'Fast-fill';
      elsif v_s >= 0.55 then fs := 'Mid-fill';
      elsif v_s >= 0.35 then fs := 'Slow-fill';
      else fs := 'Unknown';
      end if;

      if v_l >= 0.70 then badges := array_append(badges, 'HOT');
      end if;
      if v_s >= 0.75 then badges := array_append(badges, 'FAST-FILL');
      end if;
      if v_b >= 0.70 then badges := array_append(badges, 'RETURN-LIKELY');
      end if;

      insert into public.load_intel(
        load_id, freshness_01, load_quality_01, broker_trust_01, lane_density_01, fill_speed_01, backhaul_prob_01,
        load_quality_grade, fill_speed_label, lane_badges,
        load_rank, computed_at
      )
      values(
        r.id, v_f, v_q, v_t, v_l, v_s, v_b,
        qg, fs, badges,
        round((v_rank*100)::numeric, 1), now()
      )
      on conflict (load_id) do update set
        freshness_01 = excluded.freshness_01,
        load_quality_01 = excluded.load_quality_01,
        broker_trust_01 = excluded.broker_trust_01,
        lane_density_01 = excluded.lane_density_01,
        fill_speed_01 = excluded.fill_speed_01,
        backhaul_prob_01 = excluded.backhaul_prob_01,
        load_quality_grade = excluded.load_quality_grade,
        fill_speed_label = excluded.fill_speed_label,
        lane_badges = excluded.lane_badges,
        load_rank = excluded.load_rank,
        computed_at = excluded.computed_at;
    end;
  end loop;
end;
$$;


-- 4. View Update (Join Load Intel)
create or replace view public.directory_active_loads_view as
select
  l.id,
  l.service_required,
  l.origin_country, l.origin_admin1, l.origin_city,
  l.dest_country, l.dest_admin1, l.dest_city,
  l.posted_at,
  l.load_date,
  l.rate_amount, l.rate_currency,
  l.status,

  -- Intel Columns
  coalesce(li.load_rank, 0) as load_rank,
  li.load_quality_grade,
  li.fill_speed_label,
  li.lane_badges,
  coalesce(li.backhaul_prob_01, 0) as backhaul_prob_01,

  bm.trust_score as broker_trust_score,
  bm.avg_days_to_pay as broker_avg_days_to_pay

from public.loads l
left join public.load_intel li on li.load_id = l.id
left join public.broker_metrics bm on bm.broker_id = l.broker_id and bm.window_days = 30
where l.status = 'active';

-- 5. pg_cron (Optional)
-- select cron.schedule('refresh_active_load_intel_5m', '*/5 * * * *', $$select public.refresh_active_load_intel(3000);$$);
