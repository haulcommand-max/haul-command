-- Migration 026: Partner CRM Leads Table
begin;

create table if not exists public.hc_partner_leads (
    id uuid primary key default gen_random_uuid(),
    partner_type text not null,
    usdot text,
    email text,
    phone text,
    estimated_gallons text,
    status text default 'new',
    created_at timestamptz default now()
);

alter table public.hc_partner_leads enable row level security;

-- Only service role can access these leads
create policy "Service role full access partner leads" on public.hc_partner_leads for all using (auth.role() = 'service_role');

commit;
