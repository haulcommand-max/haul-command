-- =====================================================================
-- SONNET-01 Migration 2/3: Dispute 5-Tier Ladder
-- Mode: ADDITIVE ONLY
-- Opus signoff: 2026-04-10
-- =====================================================================
begin;

do $$
begin
  -- dispute_tier: 1=auto, 2=review, 3=escalate, 4=human, 5=arbitration
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'disputes' and column_name = 'dispute_tier'
  ) then
    alter table public.disputes add column dispute_tier int not null default 1;
  end if;

  -- auto_escalate_at: when this dispute should auto-escalate to the next tier
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'disputes' and column_name = 'auto_escalate_at'
  ) then
    alter table public.disputes add column auto_escalate_at timestamptz;
  end if;

  -- proof_packet_id: link to the proof packet used in resolution
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'disputes' and column_name = 'proof_packet_id'
  ) then
    alter table public.disputes add column proof_packet_id uuid;
  end if;

  -- escalation_reason: why it moved to the current tier
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'disputes' and column_name = 'escalation_reason'
  ) then
    alter table public.disputes add column escalation_reason text;
  end if;
end $$;

-- Index for cron-based tier escalation sweeps
create index if not exists idx_disputes_escalation_pending
  on public.disputes (auto_escalate_at)
  where status = 'OPENED' and auto_escalate_at is not null;

commit;
