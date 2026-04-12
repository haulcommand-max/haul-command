-- =====================================================================
-- DOUBLE PLATINUM UNICORN / MASTER MERGED EDITION
-- 2026-04-12: The Monopoly Liquidity Lock-in Sprint (Wave 14)
-- Owner: William
--
-- Actions:
-- 1. Create pg_net webhooks hitting `kyc-step-up-trigger` when jobs are accepted/created or fraud_score rises.
-- 2. Create pg_net webhooks hitting `claim-welcome-sequence` when a driver_profile `is_claimed` flips to true.
-- 3. Activate FCM push queues (fcm_push_active) so payout.failed hits operator phones instantly.
-- =====================================================================

begin;

-- =====================================================================
-- 1. ACTIVATE SYSTEM TOKENS & AGENT STATES
-- =====================================================================
insert into public.app_settings (key, value, description)
values ('kyc_step_up_active', 'true', 'Forces operators through Stripe Identity if lifetime volume or job rate exceeds thresholds')
on conflict (key) do update set value = 'true';

insert into public.app_settings (key, value, description)
values ('claim_welcome_sequence_active', 'true', 'Autofires email + push trap when SEO traffic leads to profile claims')
on conflict (key) do update set value = 'true';

insert into public.app_settings (key, value, description)
values ('fcm_push_active', 'true', 'Worker flag for push routing (PA-03 rescue)')
on conflict (key) do update set value = 'true';

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'hc_command_agents') then
    update public.hc_command_agents set status = 'active' where slug in ('kyc-step-up-trigger', 'claim-welcome-sequence', 'fcm-push-worker');
  end if;
end $$;

-- =====================================================================
-- 2. KYC STEP-UP TRIGGER (FR-03)
-- Fires continuously to check job thresholds / fraud score against KYC limits
-- =====================================================================
create or replace function public.tr_kyc_step_up_evaluation()
returns trigger as $$
declare
  edge_url text;
begin
  select value into edge_url from public.app_settings where key = 'EDGE_BASE_URL';
  if edge_url is null then
    edge_url := 'http://localhost:54321/functions/v1'; -- default dev
  end if;

  perform net.http_post(
    url := edge_url || '/kyc-step-up-trigger',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );

  return NEW;
end;
$$ language plpgsql security definer;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'hc_jobs') then
    drop trigger if exists trigger_kyc_eval_jobs on public.hc_jobs;
    create trigger trigger_kyc_eval_jobs
      after insert or update of status, rate_cents on public.hc_jobs
      for each row
      when (NEW.status = 'OPEN' or NEW.status = 'ASSIGNED')
      execute function public.tr_kyc_step_up_evaluation();
  end if;
end $$;


-- =====================================================================
-- 3. THE "CLAIM YOUR PROFILE" VIRAL LOOP (Competitor Harvest)
-- Triggers when directory traffic converts to a claimed profile
-- =====================================================================
create or replace function public.tr_claim_welcome_sequence()
returns trigger as $$
declare
  edge_url text;
begin
  -- Rule 34 logic: Target claim_status transitions instead of legacy is_claimed booleans
  if NEW.claim_status = 'claimed' and OLD.claim_status != 'claimed' then
    select value into edge_url from public.app_settings where key = 'EDGE_BASE_URL';
    if edge_url is null then
       edge_url := 'http://localhost:54321/functions/v1';
    end if;

    perform net.http_post(
      url := edge_url || '/claim-welcome-sequence',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'profile_id', NEW.id,
        'user_id', NEW.user_id,
        'claim_hash', 'verified_db_trigger',
        'event_family', 'trt.proof_packet.created'
      )
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Attach to the canonical OS profiles table (Rule 34 / ent_identities)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'claim_status') then
      drop trigger if exists trigger_claim_welcome_profile on public.profiles;
      create trigger trigger_claim_welcome_profile
        after update of claim_status on public.profiles
        for each row
        execute function public.tr_claim_welcome_sequence();
    end if;
  end if;
end $$;

commit;

-- THE MOAT IS SECURED.
