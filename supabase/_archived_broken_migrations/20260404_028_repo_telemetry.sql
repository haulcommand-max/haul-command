begin;

-- Add tracking columns for conversion measurement
alter table public.repositioning_posts 
add column if not exists booking_intent_clicks int default 0,
add column if not exists view_count int default 0;

-- RPC for atomic increment
create or replace function public.hc_increment_repo_click(p_id uuid)
returns void as $$
begin
  update public.repositioning_posts
  set booking_intent_clicks = booking_intent_clicks + 1
  where id = p_id;
end;
$$ language plpgsql security definer;

commit;
