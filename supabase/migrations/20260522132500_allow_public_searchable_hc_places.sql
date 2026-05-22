do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'hc_places'
      and policyname = 'Public can read searchable places'
  ) then
    create policy "Public can read searchable places"
      on public.hc_places
      for select
      to anon, authenticated
      using (status = 'published' and is_search_indexable = true);
  end if;
end $$;
