-- 🚀 HERE POLYLINE COMPUTE (SERVER-SIDE) — DORMANT UNTIL KEY EXISTS
-- PHASE A — Secure config table for provider keys (server-only reads)

create table if not exists public.integrations_secrets (
  key text primary key,        -- e.g. 'here_api_key'
  value text not null,
  updated_at timestamptz not null default now()
);

-- RLS: deny all direct access
alter table public.integrations_secrets enable row level security;

create policy "deny_all_select_integrations_secrets"
on public.integrations_secrets for select
to public
using (false);

create policy "deny_all_insert_integrations_secrets"
on public.integrations_secrets for insert
to public
with check (false);

create policy "deny_all_update_integrations_secrets"
on public.integrations_secrets for update
to public
using (false);

create policy "deny_all_delete_integrations_secrets"
on public.integrations_secrets for delete
to public
using (false);

-- Helper: server-side get secret (SECURITY DEFINER)
create or replace function public.get_integration_secret(p_key text)
returns text
language sql
security definer
set search_path = public
as $$
  select value from public.integrations_secrets where key = p_key;
$$;

-- PHASE B — Ensure loads have origin/dest coordinates
alter table public.loads
add column if not exists origin_lat numeric,
add column if not exists origin_lng numeric,
add column if not exists dest_lat numeric,
add column if not exists dest_lng numeric;
