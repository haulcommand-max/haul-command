-- 0017_rpc_atomic_jobs_create.sql
-- A tiny RPC: wraps multi-step create in a single DB transaction.

begin;

-- Ensure jobs table exists (if not created in 0001, though it serves as override/confirmation here)
-- Note: 'jobs' table definition in 0001 is sufficient, this likely just confirms structure or adds if missing.
-- The user provided script has a create table if not exists, I will include it to be safe and match input.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid,
  created_at timestamptz not null default now(),
  status text not null default 'created',
  payload jsonb not null default '{}'::jsonb
);

create or replace function public.rpc_jobs_create_atomic(
  p_offer_id uuid,
  p_payload jsonb
) returns public.jobs
language plpgsql
security definer
as $$
declare
  v_job public.jobs;
begin
  -- one transaction (function call) = atomic
  insert into public.jobs(offer_id, payload)
  values (p_offer_id, coalesce(p_payload, '{}'::jsonb))
  returning * into v_job;

  -- future: lock offer row, mark it consumed, create payment intent, etc.

  return v_job;
end;
$$;

revoke all on function public.rpc_jobs_create_atomic(uuid, jsonb) from public;
grant execute on function public.rpc_jobs_create_atomic(uuid, jsonb) to authenticated;

commit;
