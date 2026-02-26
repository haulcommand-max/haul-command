-- 🚀 UNLOCK VELOCITY ENGINE — SAFE PACK (FEATURE-FLAGGED, CAPPED, TTL)
-- 1) Tables + Columns
create table if not exists public.unlock_velocity_buckets (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  bucket_minute timestamptz not null,
  unlock_attempts int not null default 0,
  created_at timestamptz not null default now()
);

-- Unique constraint for upsert aggregation
create unique index if not exists unq_unlock_velocity_load_bucket 
on public.unlock_velocity_buckets(load_id, bucket_minute);

-- 2) Ingest Event (High performance, minimal locking)
create or replace function public.ingest_unlock_velocity_event(p_load_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('minute', now());
begin
  insert into public.unlock_velocity_buckets (load_id, bucket_minute, unlock_attempts)
  values (p_load_id, v_bucket, 1)
  on conflict (load_id, bucket_minute) do update set 
    unlock_attempts = public.unlock_velocity_buckets.unlock_attempts + 1;
end;
$$;

-- 3) Refresh Intel (Cron-driven aggregation)
create or replace function public.refresh_unlock_velocity_intel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int := 0;
begin
  update public.load_intel li
  set 
    velocity_60m = coalesce((
      select sum(uv.unlock_attempts) 
      from public.unlock_velocity_buckets uv 
      where uv.load_id = li.load_id 
        and uv.bucket_minute >= date_trunc('minute', now() - interval '60 minutes')
    ), 0)
  from public.loads l
  where li.load_id = l.id
    and l.status = 'active';
    
  get diagnostics v_rows = row_count;
  return jsonb_build_object('ok', true, 'updated_loads', v_rows);
end;
$$;

-- 4) TTL Cleanup (Cron-driven)
create or replace function public.cleanup_unlock_velocity_buckets(p_keep_days int default 3)
returns jsonb
language sql
security definer
set search_path = public
as $$
  delete from public.unlock_velocity_buckets
  where bucket_minute < (now() - make_interval(days := p_keep_days));
  select jsonb_build_object('ok', true);
$$;
