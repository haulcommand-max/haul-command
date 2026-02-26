-- ============================================================================
-- Social + Reputation + Live Intelligence Layer
-- Phase 0-3 Foundation Tables
-- ============================================================================

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_type') then
    create type post_type as enum (
      'run_update','availability','intel','question','announcement','review_highlight'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'content_visibility') then
    create type content_visibility as enum ('public','members','role_based');
  end if;
  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type moderation_status as enum ('published','hidden','removed','pending_moderation');
  end if;
  if not exists (select 1 from pg_type where typname = 'scope_type') then
    create type scope_type as enum ('profile','corridor','port','city','state','country');
  end if;
  if not exists (select 1 from pg_type where typname = 'reaction_type') then
    create type reaction_type as enum ('useful','cool','thanks','flag','agree','disagree');
  end if;
  if not exists (select 1 from pg_type where typname = 'follow_type') then
    create type follow_type as enum ('user','corridor','port','city','state');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum (
      'new_post','reply','mention','new_review','new_report',
      'quote_request','message','follow','recommendation'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'intel_report_type') then
    create type intel_report_type as enum (
      'closure','delay','hazard','construction','enforcement',
      'wind','flood','accident','weather','other'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'severity_level') then
    create type severity_level as enum ('low','med','high');
  end if;
  if not exists (select 1 from pg_type where typname = 'intel_vote') then
    create type intel_vote as enum ('confirm','deny');
  end if;
  if not exists (select 1 from pg_type where typname = 'thread_status') then
    create type thread_status as enum ('open','locked','archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_subject_type') then
    create type review_subject_type as enum ('escort','broker');
  end if;
  if not exists (select 1 from pg_type where typname = 'reputation_event_type') then
    create type reputation_event_type as enum (
      'review_received','review_removed','report_confirmed','report_denied',
      'verification_added','sla_fast_response','complaint_upheld',
      'recommendation_received','photo_added'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_type') then
    create type verification_type as enum (
      'identity','insurance','twic','equipment_photos','background_check_optional'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'verification_status') then
    create type verification_status as enum ('pending','approved','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'convo_type') then
    create type convo_type as enum ('dm','quote_request');
  end if;
  if not exists (select 1 from pg_type where typname = 'convo_role') then
    create type convo_role as enum ('requester','provider','admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'quote_status') then
    create type quote_status as enum ('open','responded','closed','expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'availability_status') then
    create type availability_status as enum ('available','limited','unavailable');
  end if;
end$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- SOCIAL LAYER
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extended Profile Fields ────────────────────────────────────────────────
-- Adds social/reputation columns to existing profiles table
alter table public.profiles
  add column if not exists availability_status availability_status default 'available',
  add column if not exists availability_note text,
  add column if not exists equipment jsonb default '{}',
  add column if not exists badges jsonb default '[]',
  add column if not exists trust_score int default 0,
  add column if not exists accuracy_score int default 0,
  add column if not exists last_post_at timestamptz,
  add column if not exists last_review_at timestamptz,
  add column if not exists response_time_avg_seconds int,
  add column if not exists recommendation_count int default 0;


-- ── Posts ───────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  scope_type scope_type not null default 'profile',
  scope_id uuid,                       -- references corridors/ports/cities
  post_type post_type not null,
  title text,
  body text not null,
  tags text[] default '{}',
  visibility content_visibility default 'public',
  status moderation_status default 'published',

  -- Repost / signal boost
  original_post_id uuid references public.posts(id) on delete set null,
  repost_count int default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists posts_author_idx on public.posts(author_user_id, created_at desc);
create index if not exists posts_scope_idx on public.posts(scope_type, scope_id, created_at desc);
create index if not exists posts_type_idx on public.posts(post_type, created_at desc);
create index if not exists posts_tags_idx on public.posts using gin(tags);
create index if not exists posts_status_idx on public.posts(status) where status = 'published';


-- ── Post Media ─────────────────────────────────────────────────────────────
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_type text not null default 'image',  -- image | video
  url text not null,
  width int,
  height int,
  created_at timestamptz default now()
);

create index if not exists pm_post_idx on public.post_media(post_id);


-- ── Reactions ──────────────────────────────────────────────────────────────
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction reaction_type not null,
  created_at timestamptz default now(),
  unique(post_id, user_id, reaction)
);

create index if not exists reactions_post_idx on public.reactions(post_id);
create index if not exists reactions_user_idx on public.reactions(user_id);


-- ── Comments ───────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null,
  status moderation_status default 'published',
  created_at timestamptz default now()
);

create index if not exists comments_post_idx on public.comments(post_id, created_at);
create index if not exists comments_user_idx on public.comments(user_id);


-- ── Follows ────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  follow_type follow_type not null,
  follow_id uuid not null,              -- user_id | corridor_id | port_id | etc.
  created_at timestamptz default now(),
  unique(follower_user_id, follow_type, follow_id)
);

create index if not exists follows_follower_idx on public.follows(follower_user_id);
create index if not exists follows_target_idx on public.follows(follow_type, follow_id);


-- ── Notifications ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notif_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notif_unread_idx on public.notifications(user_id) where read_at is null;


-- ── Recommendations (explicit ≠ review) ────────────────────────────────────
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  recommender_user_id uuid not null references auth.users(id) on delete cascade,
  recommended_user_id uuid not null references auth.users(id) on delete cascade,
  context text,                         -- "Great on I-10 corridor"
  created_at timestamptz default now(),
  unique(recommender_user_id, recommended_user_id)
);

create index if not exists rec_recommended_idx on public.recommendations(recommended_user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- REPUTATION LAYER
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Review Forms (versioned categories) ────────────────────────────────────
create table if not exists public.review_forms (
  id uuid primary key default gen_random_uuid(),
  form_type review_subject_type not null,
  version int not null default 1,
  categories jsonb not null default '[]',  -- [{key, label, weight}]
  active boolean default true,
  created_at timestamptz default now()
);

-- Seed v1 forms
insert into public.review_forms (form_type, version, categories, active) values
  ('escort', 1, '[
    {"key":"on_time","label":"On Time","weight":0.25},
    {"key":"communication","label":"Communication","weight":0.20},
    {"key":"equipment_ready","label":"Equipment Ready","weight":0.20},
    {"key":"professionalism","label":"Professionalism","weight":0.20},
    {"key":"safety","label":"Safety","weight":0.15}
  ]'::jsonb, true),
  ('broker', 1, '[
    {"key":"pay_on_time","label":"Pay On Time","weight":0.30},
    {"key":"communication","label":"Communication","weight":0.20},
    {"key":"load_accuracy","label":"Load Info Accuracy","weight":0.20},
    {"key":"fairness","label":"Rate Fairness","weight":0.15},
    {"key":"repeat_work","label":"Repeat Work Likelihood","weight":0.15}
  ]'::jsonb, true)
on conflict do nothing;


-- ── Reviews ────────────────────────────────────────────────────────────────
create table if not exists public.structured_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  subject_type review_subject_type not null,
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  form_id uuid references public.review_forms(id),
  overall_rating int not null check (overall_rating between 1 and 5),
  summary text,
  status moderation_status default 'published',

  -- Owner response (Yelp pattern)
  owner_response text,
  owner_response_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sr_subject_idx on public.structured_reviews(subject_user_id, created_at desc);
create index if not exists sr_reviewer_idx on public.structured_reviews(reviewer_user_id);
create index if not exists sr_type_idx on public.structured_reviews(subject_type, overall_rating);


-- ── Review Category Scores ─────────────────────────────────────────────────
create table if not exists public.review_category_scores (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.structured_reviews(id) on delete cascade,
  category_key text not null,
  score int not null check (score between 1 and 5),
  unique(review_id, category_key)
);


-- ── Reputation Events (auditable ledger) ───────────────────────────────────
create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type reputation_event_type not null,
  delta int not null default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists re_user_idx on public.reputation_events(user_id, created_at desc);


-- ── Verifications ──────────────────────────────────────────────────────────
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_type verification_type not null,
  status verification_status default 'pending',
  evidence jsonb default '{}',
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  unique(user_id, verification_type)
);

create index if not exists verif_user_idx on public.verifications(user_id);
create index if not exists verif_status_idx on public.verifications(status) where status = 'pending';


-- ═══════════════════════════════════════════════════════════════════════════
-- LIVE INTELLIGENCE (Waze-style)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Intel Reports ──────────────────────────────────────────────────────────
create table if not exists public.intel_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  scope_type scope_type not null,
  scope_id uuid,
  report_type intel_report_type not null,
  severity severity_level default 'med',
  title text not null,
  details text,
  location jsonb,                       -- {lat, lng, mile_marker?, address?}
  expires_at timestamptz not null,      -- decay timer
  confidence int default 50 check (confidence between 0 and 100),
  status moderation_status default 'published',
  confirm_count int default 0,
  deny_count int default 0,
  created_at timestamptz default now()
);

create index if not exists ir_scope_idx on public.intel_reports(scope_type, scope_id, created_at desc);
create index if not exists ir_active_idx on public.intel_reports(status, expires_at) where status = 'published';
create index if not exists ir_type_idx on public.intel_reports(report_type);
create index if not exists ir_reporter_idx on public.intel_reports(reporter_user_id);


-- ── Intel Confirmations ────────────────────────────────────────────────────
create table if not exists public.intel_confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.intel_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote intel_vote not null,
  created_at timestamptz default now(),
  unique(report_id, user_id)
);

create index if not exists ic_report_idx on public.intel_confirmations(report_id);


-- ── Corridor Threads ───────────────────────────────────────────────────────
create table if not exists public.corridor_threads (
  id uuid primary key default gen_random_uuid(),
  corridor_id uuid not null,            -- references corridors.id
  topic text not null,                  -- "Detours", "Wind", "Weigh Stations", "General"
  status thread_status default 'open',
  message_count int default 0,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists ct_corridor_idx on public.corridor_threads(corridor_id);


-- ── Corridor Messages ──────────────────────────────────────────────────────
create table if not exists public.corridor_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.corridor_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status moderation_status default 'published',
  created_at timestamptz default now()
);

create index if not exists cm_thread_idx on public.corridor_messages(thread_id, created_at desc);


-- ═══════════════════════════════════════════════════════════════════════════
-- HIGH-INTENT CONVERSION
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Conversations ──────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  convo_type convo_type not null default 'dm',
  created_at timestamptz default now()
);


-- ── Conversation Members ───────────────────────────────────────────────────
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role convo_role default 'requester',
  joined_at timestamptz default now(),
  unique(conversation_id, user_id)
);

create index if not exists cm_user_idx on public.conversation_members(user_id);


-- ── Messages ───────────────────────────────────────────────────────────────
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status moderation_status default 'published',
  created_at timestamptz default now()
);

create index if not exists dm_convo_idx on public.direct_messages(conversation_id, created_at);


-- ── Quote Requests ─────────────────────────────────────────────────────────
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  scope jsonb default '{}',             -- route/corridor/time/load meta
  status quote_status default 'open',
  conversation_id uuid references public.conversations(id),
  created_at timestamptz default now(),
  responded_at timestamptz,
  response_time_seconds int
);

create index if not exists qr_provider_idx on public.quote_requests(provider_user_id, status);
create index if not exists qr_requester_idx on public.quote_requests(requester_user_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Active intel (not expired, published)
create or replace view public.v_active_intel as
select
  ir.*,
  p.display_name as reporter_name
from public.intel_reports ir
left join public.profiles p on p.user_id = ir.reporter_user_id
where ir.status = 'published'
  and ir.expires_at > now()
order by ir.created_at desc;

-- Profile activity feed (published posts for a user)
create or replace view public.v_profile_feed as
select
  po.*,
  p.display_name as author_name,
  (select count(*) from public.reactions r where r.post_id = po.id) as reaction_count,
  (select count(*) from public.comments c where c.post_id = po.id and c.status = 'published') as comment_count
from public.posts po
join public.profiles p on p.user_id = po.author_user_id
where po.status = 'published'
order by po.created_at desc;

-- Corridor feed (posts scoped to corridors)
create or replace view public.v_corridor_feed as
select
  po.*,
  p.display_name as author_name,
  (select count(*) from public.reactions r where r.post_id = po.id) as reaction_count,
  (select count(*) from public.comments c where c.post_id = po.id and c.status = 'published') as comment_count
from public.posts po
join public.profiles p on p.user_id = po.author_user_id
where po.scope_type = 'corridor'
  and po.status = 'published'
order by po.created_at desc;

-- Provider response time leaderboard
create or replace view public.v_response_time_leaders as
select
  provider_user_id,
  p.display_name,
  count(*) as total_quotes,
  count(*) filter (where responded_at is not null) as responded,
  avg(response_time_seconds) filter (where response_time_seconds is not null) as avg_response_seconds,
  percentile_cont(0.5) within group (order by response_time_seconds)
    filter (where response_time_seconds is not null) as median_response_seconds
from public.quote_requests qr
join public.profiles p on p.user_id = qr.provider_user_id
where qr.created_at >= (now() - interval '90 days')
group by provider_user_id, p.display_name
having count(*) >= 3
order by avg_response_seconds asc;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════

-- Social
alter table public.posts enable row level security;
create policy posts_read on public.posts for select using (status = 'published' or author_user_id = auth.uid());
create policy posts_insert on public.posts for insert with check (author_user_id = auth.uid());
create policy posts_update on public.posts for update using (author_user_id = auth.uid());

alter table public.post_media enable row level security;
create policy pm_read on public.post_media for select using (true);
create policy pm_insert on public.post_media for insert with check (
  exists (select 1 from public.posts where id = post_id and author_user_id = auth.uid())
);

alter table public.reactions enable row level security;
create policy react_read on public.reactions for select using (true);
create policy react_insert on public.reactions for insert with check (user_id = auth.uid());
create policy react_delete on public.reactions for delete using (user_id = auth.uid());

alter table public.comments enable row level security;
create policy comment_read on public.comments for select using (status = 'published' or user_id = auth.uid());
create policy comment_insert on public.comments for insert with check (user_id = auth.uid());

alter table public.follows enable row level security;
create policy follow_read on public.follows for select using (true);
create policy follow_insert on public.follows for insert with check (follower_user_id = auth.uid());
create policy follow_delete on public.follows for delete using (follower_user_id = auth.uid());

alter table public.notifications enable row level security;
create policy notif_read on public.notifications for select using (user_id = auth.uid());
create policy notif_update on public.notifications for update using (user_id = auth.uid());

alter table public.recommendations enable row level security;
create policy rec_read on public.recommendations for select using (true);
create policy rec_insert on public.recommendations for insert with check (recommender_user_id = auth.uid());

-- Reputation
alter table public.review_forms enable row level security;
create policy rf_read on public.review_forms for select using (true);

alter table public.structured_reviews enable row level security;
create policy sr_read on public.structured_reviews for select using (status = 'published' or reviewer_user_id = auth.uid() or subject_user_id = auth.uid());
create policy sr_insert on public.structured_reviews for insert with check (reviewer_user_id = auth.uid());
create policy sr_update on public.structured_reviews for update using (
  reviewer_user_id = auth.uid() or subject_user_id = auth.uid() -- owner can add response
);

alter table public.review_category_scores enable row level security;
create policy rcs_read on public.review_category_scores for select using (true);
create policy rcs_insert on public.review_category_scores for insert with check (
  exists (select 1 from public.structured_reviews where id = review_id and reviewer_user_id = auth.uid())
);

alter table public.reputation_events enable row level security;
create policy re_read on public.reputation_events for select using (user_id = auth.uid() or auth.role() = 'service_role');
create policy re_write on public.reputation_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.verifications enable row level security;
create policy v_read on public.verifications for select using (user_id = auth.uid() or auth.role() = 'service_role');
create policy v_insert on public.verifications for insert with check (user_id = auth.uid());

-- Intel
alter table public.intel_reports enable row level security;
create policy ir_read on public.intel_reports for select using (true);
create policy ir_insert on public.intel_reports for insert with check (reporter_user_id = auth.uid());

alter table public.intel_confirmations enable row level security;
create policy ic_read on public.intel_confirmations for select using (true);
create policy ic_insert on public.intel_confirmations for insert with check (user_id = auth.uid());

alter table public.corridor_threads enable row level security;
create policy cth_read on public.corridor_threads for select using (true);
create policy cth_write on public.corridor_threads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.corridor_messages enable row level security;
create policy cmsg_read on public.corridor_messages for select using (status = 'published' or user_id = auth.uid());
create policy cmsg_insert on public.corridor_messages for insert with check (user_id = auth.uid());

-- Conversion
alter table public.conversations enable row level security;
create policy conv_read on public.conversations for select using (
  exists (select 1 from public.conversation_members where conversation_id = id and user_id = auth.uid())
);

alter table public.conversation_members enable row level security;
create policy cvm_read on public.conversation_members for select using (user_id = auth.uid());

alter table public.direct_messages enable row level security;
create policy dms_read on public.direct_messages for select using (
  exists (select 1 from public.conversation_members where conversation_id = conversation_id and user_id = auth.uid())
);
create policy dms_insert on public.direct_messages for insert with check (sender_user_id = auth.uid());

alter table public.quote_requests enable row level security;
create policy qr_read on public.quote_requests for select using (
  requester_user_id = auth.uid() or provider_user_id = auth.uid()
);
create policy qr_insert on public.quote_requests for insert with check (requester_user_id = auth.uid());
create policy qr_update on public.quote_requests for update using (provider_user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Update posts.updated_at
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'posts_set_updated') then
    create trigger posts_set_updated before update on public.posts
    for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'sr_set_updated') then
    create trigger sr_set_updated before update on public.structured_reviews
    for each row execute function set_updated_at();
  end if;
end$$;
