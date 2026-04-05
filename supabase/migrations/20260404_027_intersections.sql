begin;

create table if not exists public.hc_corridor_intersections (
    slug text primary key,
    state text not null,
    city text not null,
    name text not null,
    risk text default 'Moderate',
    weight_limit text,
    created_at timestamptz default now()
);

alter table public.hc_corridor_intersections enable row level security;
create policy "Public read full access on intersections" on public.hc_corridor_intersections for select using (true);
create policy "Service role full access on intersections" on public.hc_corridor_intersections for all using (auth.role() = 'service_role');

-- Insert the mock ones as seed
insert into public.hc_corridor_intersections (slug, state, city, name, risk, weight_limit) values
  ('wa-i90-us97-ellensburg', 'WA', 'Ellensburg', 'I-90 / US-97 Interchange', 'High', '129,000 lbs'),
  ('tx-i10-i45-houston', 'TX', 'Houston', 'I-10 / I-45 Pierce Elevated', 'Critical', 'Bridge Formula'),
  ('pa-i80-us15-milton', 'PA', 'Milton', 'I-80 / US-15 River Bridge', 'Moderate', '100,000 lbs'),
  ('ca-i5-i80-sacramento', 'CA', 'Sacramento', 'I-5 / I-80 Interchange', 'High', 'Permit Req')
on conflict (slug) do nothing;

commit;
