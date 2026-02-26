-- Push Notifications Subscription Table
create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_webpush_user on public.web_push_subscriptions(user_id);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "webpush_self_read" on public.web_push_subscriptions;
create policy "webpush_self_read"
on public.web_push_subscriptions for select
using (user_id = auth.uid() or public.has_role(array['owner_admin','admin','support']));

drop policy if exists "webpush_self_insert" on public.web_push_subscriptions;
create policy "webpush_self_insert"
on public.web_push_subscriptions for insert
with check (user_id = auth.uid());

drop policy if exists "webpush_self_delete" on public.web_push_subscriptions;
create policy "webpush_self_delete"
on public.web_push_subscriptions for delete
using (user_id = auth.uid() or public.has_role(array['owner_admin','admin']));
