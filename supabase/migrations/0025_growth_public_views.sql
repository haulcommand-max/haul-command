-- 0025_growth_public_views.sql
-- Purpose: SEO-safe public aggregates (no PII)

begin;

create or replace view public.public_referral_leaderboard as
select
  rc.code,
  rc.owner_user_id,
  coalesce(sum(re.points), 0)::int as points,
  coalesce(sum(case when re.event_type='install' then 1 else 0 end), 0)::int as installs,
  coalesce(sum(case when re.event_type='signup' then 1 else 0 end), 0)::int as signups,
  max(re.created_at) as last_event_at
from public.referral_codes rc
left join public.referral_events re on re.referral_code = rc.code
where rc.active = true
group by rc.code, rc.owner_user_id;

-- RLS applies to base tables; views are safe because they don't expose contact info.
-- Keep this view readable publicly.
grant select on public.public_referral_leaderboard to anon, authenticated;

commit;
