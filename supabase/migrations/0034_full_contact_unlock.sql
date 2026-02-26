-- 0034_full_contact_unlock.sql
-- Full contact unlock: public directory NEVER shows contact fields.
-- Login + entitlement required to see phone/email.
-- RPC: rpc_unlock_contact(profile_id) gated by session role.

begin;

-- ── Public directory safe view (anon + authenticated) ───────────────────────
-- Replace or extend your existing public directory view.
-- This version explicitly excludes phone, email, and stripe fields.

create or replace view public.directory_public as
select
  id,
  slug,
  display_name,
  state,
  city,
  lat,
  lng,
  service_tags,
  coverage_status,
  source_quality,
  verified,
  created_at
from public.provider_directory;

-- Grant anon read on the safe view
grant select on public.directory_public to anon;
grant select on public.directory_public to authenticated;

-- ── Contact unlock entitlements ─────────────────────────────────────────────
-- Tracks which users have unlocked contact info for which providers.
-- Unlock requires: authenticated user + either broker role OR paid unlock.

create table if not exists public.contact_unlocks (
  id             uuid primary key default gen_random_uuid(),
  unlocked_by    uuid not null references auth.users(id) on delete cascade,
  provider_id    uuid not null references public.provider_directory(id) on delete cascade,
  unlock_type    text not null check (unlock_type in ('broker_verified','paid','admin')),
  unlocked_at    timestamptz not null default now(),
  unique(unlocked_by, provider_id)
);

alter table public.contact_unlocks enable row level security;

-- User reads their own unlocks
create policy "contact_unlocks_owner_read"
on public.contact_unlocks for select
to authenticated
using (unlocked_by = auth.uid());

-- service_role writes unlocks
create policy "contact_unlocks_deny_client_write"
on public.contact_unlocks for insert
to authenticated
with check (false);

-- ── RPC: rpc_unlock_contact ──────────────────────────────────────────────────
-- Returns contact details IF the calling user has an unlock for this provider.
-- This keeps contact info server-side and never in the public view.

create or replace function public.rpc_unlock_contact(p_provider_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_uid      uuid    := auth.uid();
  v_has_unlock boolean;
  v_result   jsonb;
begin
  -- Must be authenticated
  if v_uid is null then
    raise exception 'authentication required' using errcode = 'PGRST301';
  end if;

  -- Check entitlement: broker role OR explicit unlock record
  select exists(
    select 1 from public.contact_unlocks
    where unlocked_by = v_uid
      and provider_id = p_provider_id
  ) into v_has_unlock;

  -- Also accept broker role (brokers can see all contacts without per-record unlock)
  if not v_has_unlock then
    select exists(
      select 1 from public.profiles
      where id = v_uid and role in ('broker','admin')
    ) into v_has_unlock;
  end if;

  if not v_has_unlock then
    return jsonb_build_object('error', 'contact_locked', 'unlock_required', true);
  end if;

  -- Return contact fields
  select jsonb_build_object(
    'phone',   pd.phone,
    'website', pd.website,
    'city',    pd.city,
    'state',   pd.state
  )
  into v_result
  from public.provider_directory pd
  where pd.id = p_provider_id;

  -- Emit event for analytics
  insert into public.event_log(
    actor_profile_id, actor_role, event_type, entity_type, entity_id, payload
  ) values (
    v_uid, 'user', 'contact.unlocked', 'provider_directory', p_provider_id,
    jsonb_build_object('unlock_type', 'rpc')
  );

  return coalesce(v_result, jsonb_build_object('error', 'provider_not_found'));
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.rpc_unlock_contact(uuid) to authenticated;

commit;
