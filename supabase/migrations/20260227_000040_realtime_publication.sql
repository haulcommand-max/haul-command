-- ============================================================
-- CORRECTED Realtime publication
-- Actual tables: escort_presence (not operator_availability),
--                loads (not load_requests)
-- corridor_incidents does not exist — omitted
-- ============================================================
do $$
begin
  -- escort_presence (operator availability/presence)
  if to_regclass('public.escort_presence') is not null then
    begin
      alter publication supabase_realtime add table public.escort_presence;
    exception when duplicate_object then
      null;
    end;
  end if;

  -- loads (new load postings)
  if to_regclass('public.loads') is not null then
    begin
      alter publication supabase_realtime add table public.loads;
    exception when duplicate_object then
      null;
    end;
  end if;

  -- bookings (booking confirmations)
  if to_regclass('public.bookings') is not null then
    begin
      alter publication supabase_realtime add table public.bookings;
    exception when duplicate_object then
      null;
    end;
  end if;

  -- reviews (review velocity signals)
  if to_regclass('public.reviews') is not null then
    begin
      alter publication supabase_realtime add table public.reviews;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;
