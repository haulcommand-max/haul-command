-- 0004_rpc_create_job_from_offer.sql

create or replace function public.rpc_create_job_from_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer record;
  v_load record;
  v_job_id uuid;
begin
  -- Lock offer row
  select *
  into v_offer
  from public.offers
  where id = p_offer_id
  for update;

  if not found then
    raise exception 'offer_not_found';
  end if;

  if v_offer.status <> 'accepted' then
    raise exception 'offer_not_accepted';
  end if;

  -- Prevent duplicates
  if exists (select 1 from public.jobs where offer_id = v_offer.id) then
    select id into v_job_id from public.jobs where offer_id = v_offer.id;
    return v_job_id;
  end if;

  -- Lock load row
  select *
  into v_load
  from public.loads
  where id = v_offer.load_id
  for update;

  if not found then
    raise exception 'load_not_found';
  end if;

  -- Optional: if already filled, stop
  if v_load.status in ('filled','cancelled') then
    raise exception 'load_unavailable';
  end if;

  v_job_id := gen_random_uuid();

  insert into public.jobs (
    id,
    offer_id,
    load_id,
    broker_id,
    driver_id,
    status,
    agreed_price_cents,
    currency
  )
  values (
    v_job_id,
    v_offer.id,
    v_load.id,
    v_load.broker_id,
    v_offer.driver_id,
    'scheduled',
    v_offer.price_offer_cents,
    coalesce(v_offer.currency, 'USD')
  );

  -- Mark load filled
  update public.loads
  set status = 'filled', filled_job_id = v_job_id
  where id = v_load.id;

  -- Mark offer booked (optional, but nice)
  update public.offers
  set status = 'booked'
  where id = v_offer.id;

  return v_job_id;
end;
$$;

-- Lock down: only authenticated can call, or restrict to broker/driver roles via RLS checks
revoke all on function public.rpc_create_job_from_offer(uuid) from public;
grant execute on function public.rpc_create_job_from_offer(uuid) to authenticated;
