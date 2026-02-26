-- ============================================================
-- Migration: Leaderboard View + Sponsorship Tables v1
-- ============================================================

-- 1) View: v_corridor_leaderboard
create or replace view public.v_corridor_leaderboard as
select
  e.scope_key as corridor_slug,
  e.rank,
  e.metric_value as score,
  p.display_name,
  p.home_state,
  dp.badges,
  dp.verified_score,
  dp.response_time_minutes_est,
  dp.jobs_completed
from public.leaderboard_entries e
join public.profiles p on p.id = e.subject_id
left join public.driver_profiles dp on dp.user_id = e.subject_id
where e.scope_type = 'corridor'
  and e.subject_type = 'driver'
order by e.scope_key, e.rank;

-- 2) Index
create index if not exists idx_lb_entries_corridor_lookup
  on public.leaderboard_entries(scope_type, scope_key, rank);

-- 3) Sponsorship tables
create table if not exists public.sponsorship_products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null unique,
  name text not null,
  amount numeric not null,
  currency text not null default 'USD',
  duration_days int not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsorship_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_key text not null,
  geo_key text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz not null default now()
);

create index if not exists idx_sponsor_orders_user_time
  on public.sponsorship_orders(user_id, created_at desc);

-- 4) RLS
alter table public.sponsorship_products enable row level security;
alter table public.sponsorship_orders enable row level security;

create policy "sponsorship_products_public_read"
on public.sponsorship_products for select using (true);

create policy "sponsorship_products_admin_write"
on public.sponsorship_products for all
using (public.has_any_role(array['owner_admin','admin']))
with check (public.has_any_role(array['owner_admin','admin']));

create policy "sponsorship_orders_read_own"
on public.sponsorship_orders for select
using (user_id = auth.uid() or public.has_any_role(array['owner_admin','admin']));

create policy "sponsorship_orders_self_insert"
on public.sponsorship_orders for insert
with check (user_id = auth.uid());

create policy "sponsorship_orders_admin_update"
on public.sponsorship_orders for update
using (public.has_any_role(array['owner_admin','admin']))
with check (public.has_any_role(array['owner_admin','admin']));

-- 5) Seed products
insert into public.sponsorship_products (product_key, name, amount, currency, duration_days)
values
  ('city_sponsor_basic', 'City Sponsor — Basic', 199, 'USD', 30),
  ('city_sponsor_premium', 'City Sponsor — Premium', 499, 'USD', 30),
  ('corridor_sponsor', 'Corridor Sponsor', 999, 'USD', 30)
on conflict (product_key) do nothing;
