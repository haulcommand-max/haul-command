-- 0016_core_directory_authz.sql
-- Public directory listing is safe for SEO. Contact info is never exposed unless:
-- user is logged in AND user has an entitlement “ticket” OR driver explicitly opted_in_contact = true

begin;

-- ---------- ROLES ----------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','driver','broker','admin')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- DRIVERS (public-safe fields) ----------
create table if not exists public.driver_profiles (
  driver_id uuid primary key references auth.users(id) on delete cascade,
  country_code text not null default 'us',          -- us/ca
  region_code text not null,                       -- state/province
  city text not null,
  city_slug text not null,
  company_name text,
  rig_type text,
  equipment jsonb not null default '{}'::jsonb,     -- { high_pole:true, height_stick:true, ... }
  insurance_level text,                            -- "1M", "2M", etc
  is_verified boolean not null default false,       -- admin-set
  last_active_bucket text not null default 'unknown' check (last_active_bucket in ('today','this_week','this_month','unknown')),
  opted_in_contact boolean not null default false,  -- driver must opt in
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists driver_profiles_geo_idx
  on public.driver_profiles(country_code, region_code, city_slug);

create index if not exists driver_profiles_verified_idx
  on public.driver_profiles(is_verified);

-- ---------- CONTACT INFO (NEVER PUBLIC) ----------
create table if not exists public.driver_contact_private (
  driver_id uuid primary key references public.driver_profiles(driver_id) on delete cascade,
  phone text,
  email text,
  website text,
  notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- LISTING CLAIMS / APPROVALS ----------
create table if not exists public.driver_claims (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_payload jsonb not null default '{}'::jsonb,
  admin_notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- ---------- ENTITLEMENT TICKETS (what gets unlocked) ----------
create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,           -- e.g. 'directory_contact_unlock', 'broker_post_load', 'rate_index_access'
  value jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, key)
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.driver_contact_private enable row level security;
alter table public.driver_claims enable row level security;
alter table public.entitlements enable row level security;

-- profiles: user reads own; admin reads all
create policy "profiles_read_own"
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy "profiles_admin_read_all"
on public.profiles for select
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

-- driver_profiles: public can read (SEO safe)
create policy "driver_profiles_public_read"
on public.driver_profiles for select
to anon, authenticated
using (true);

-- driver_profiles: driver can update own profile; admin can update anything
create policy "driver_profiles_update_own"
on public.driver_profiles for update
to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

create policy "driver_profiles_admin_update"
on public.driver_profiles for update
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (true);

-- driver_contact_private: only driver + admin can read
create policy "driver_contact_read_own"
on public.driver_contact_private for select
to authenticated
using (driver_id = auth.uid());

create policy "driver_contact_admin_read"
on public.driver_contact_private for select
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

-- driver_contact_private: only driver + admin can update
create policy "driver_contact_update_own"
on public.driver_contact_private for update
to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

create policy "driver_contact_admin_update"
on public.driver_contact_private for update
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (true);

-- entitlements: user reads own; admin reads all
create policy "entitlements_read_own"
on public.entitlements for select
to authenticated
using (user_id = auth.uid());

create policy "entitlements_admin_read_all"
on public.entitlements for select
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

-- claims: driver can insert + read own; admin read all + update status
create policy "claims_insert_own"
on public.driver_claims for insert
to authenticated
with check (driver_id = auth.uid());

create policy "claims_read_own"
on public.driver_claims for select
to authenticated
using (driver_id = auth.uid());

create policy "claims_admin_read_all"
on public.driver_claims for select
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

create policy "claims_admin_update"
on public.driver_claims for update
to authenticated
using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (true);

commit;
