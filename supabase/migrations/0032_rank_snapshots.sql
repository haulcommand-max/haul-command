-- 0032_rank_snapshots.sql
-- Rank momentum snapshots for leaderboard delta_rank arrows + rival alerts.
-- (separate from leaderboard_snapshots in 0016 which stores full payload jsonb;
--  this table stores per-profile rank+score deltas for efficient momentum queries)

begin;

create table if not exists public.rank_snapshots (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  board_key    text not null,    -- e.g. "drivers:us:fl:monthly:most_runs"
  period_key   text not null,    -- e.g. "2026-02" or "season_2026"
  profile_id   uuid not null,
  rank         int  not null,
  score        numeric not null,
  delta_rank   int  not null default 0,   -- +N = moved up N positions
  delta_score  numeric not null default 0
);

create index if not exists idx_rank_snapshots_board  on public.rank_snapshots(board_key, period_key, created_at desc);
create index if not exists idx_rank_snapshots_profile on public.rank_snapshots(profile_id);

alter table public.rank_snapshots enable row level security;

-- Public: no PII in this table — safe to expose
create policy "rank_snapshots_public_read"
on public.rank_snapshots for select
to anon, authenticated
using (true);

-- service_role writes snapshots; deny client writes
create policy "rank_snapshots_deny_client_write"
on public.rank_snapshots for insert
to authenticated
with check (false);

commit;
