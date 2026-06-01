-- HC Pay money-path hardening.
-- Keeps durable reservation states aligned with payout/QuickPay code and
-- prevents duplicate NOWPayments finished IPNs from double-crediting wallets.

do $$
begin
  if to_regclass('public.quickpay_transactions') is not null then
    alter table public.quickpay_transactions
      drop constraint if exists quickpay_transactions_status_check;

    alter table public.quickpay_transactions
      add constraint quickpay_transactions_status_check
      check (status in (
        'pending',
        'risk_review',
        'approved',
        'pending_transfer',
        'transferring',
        'completed',
        'failed',
        'reversed',
        'cancelled'
      ));
  end if;

  if to_regclass('public.hc_pay_payouts') is not null then
    alter table public.hc_pay_payouts
      drop constraint if exists hc_pay_payouts_status_check;

    alter table public.hc_pay_payouts
      add constraint hc_pay_payouts_status_check
      check (status in (
        'pending',
        'pending_transfer',
        'processing',
        'paid',
        'failed',
        'cancelled'
      ));
  end if;

  if to_regclass('public.hc_pay_ledger') is not null then
    alter table public.hc_pay_ledger
      drop constraint if exists hc_pay_ledger_entry_type_check;

    alter table public.hc_pay_ledger
      add constraint hc_pay_ledger_entry_type_check
      check (entry_type in (
        'payment_received',
        'payment_sent',
        'payout_requested',
        'payout_completed',
        'payout_reversal',
        'quickpay_payout',
        'standard_payout',
        'refund_issued',
        'bonus_credit',
        'fee_charged'
      ));
  end if;
end $$;

drop index if exists public.idx_ledger_nowpayments;

create unique index if not exists hc_pay_ledger_nowpayments_payment_id_unique
  on public.hc_pay_ledger (nowpayments_payment_id)
  where nowpayments_payment_id is not null;
