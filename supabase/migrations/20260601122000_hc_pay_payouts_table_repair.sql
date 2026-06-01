-- Repair live drift where HC Pay payout code exists but the payout table is
-- absent. Idempotent so environments with the original wallet-ledger migration
-- already applied keep their existing table.

create table if not exists public.hc_pay_payouts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid references public.hc_pay_wallets(id),
  user_id uuid references auth.users(id),
  amount_usd numeric(18, 6) not null,
  payout_type text not null check (payout_type in ('quickpay', 'standard')),
  fee_usd numeric(18, 6) default 0,
  net_usd numeric(18, 6),
  stripe_transfer_id text,
  stripe_payout_id text,
  status text default 'pending' check (status in (
    'pending',
    'pending_transfer',
    'processing',
    'paid',
    'failed',
    'cancelled'
  )),
  estimated_arrival timestamptz,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_payouts_user
  on public.hc_pay_payouts(user_id, created_at desc);

create index if not exists idx_payouts_status
  on public.hc_pay_payouts(status, created_at desc);

alter table public.hc_pay_payouts enable row level security;

drop policy if exists "Users can view their own payouts" on public.hc_pay_payouts;

create policy "Users can view their own payouts"
  on public.hc_pay_payouts for select
  to authenticated
  using (auth.uid() = user_id);
