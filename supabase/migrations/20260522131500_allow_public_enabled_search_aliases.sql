grant select on table public.hc_search_aliases to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hc_search_aliases'
      and policyname = 'Public can read enabled search aliases'
  ) then
    create policy "Public can read enabled search aliases"
      on public.hc_search_aliases
      for select
      to anon, authenticated
      using (enabled = true);
  end if;
end $$;
