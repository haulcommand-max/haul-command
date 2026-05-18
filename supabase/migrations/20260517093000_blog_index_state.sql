-- Blog indexing controls for the v115 content quality gate.
-- Keeps thin articles visible to users while allowing crawlers to be held back
-- until the article meets the current word-floor and proof requirements.

alter table public.hc_blog_articles
  add column if not exists noindex boolean not null default false,
  add column if not exists index_state text not null default 'index',
  add column if not exists noindex_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hc_blog_articles_index_state_check'
      and conrelid = 'public.hc_blog_articles'::regclass
  ) then
    alter table public.hc_blog_articles
      add constraint hc_blog_articles_index_state_check
      check (index_state in ('index', 'noindex', 'review', 'draft'));
  end if;
end $$;

with measured as (
  select
    id,
    coalesce(
      array_length(
        regexp_split_to_array(
          nullif(
            trim(regexp_replace(coalesce(content, ''), '<[^>]+>', ' ', 'g')),
            ''
          ),
          '\s+'
        ),
        1
      ),
      0
    ) as word_count
  from public.hc_blog_articles
  where status = 'published'
)
update public.hc_blog_articles article
set
  noindex = true,
  index_state = 'noindex',
  noindex_reason = coalesce(article.noindex_reason, 'thin_content_v115_word_floor'),
  updated_at = now()
from measured
where article.id = measured.id
  and measured.word_count < 800
  and article.noindex is false;

create index if not exists idx_hc_blog_articles_public_index_state
  on public.hc_blog_articles (status, index_state, noindex, created_at desc);

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values (
  'seo.blog_index_state_v115',
  'Blog article index-state controls for v115 thin-content handling.',
  'json',
  jsonb_build_object(
    'standard', 'v115-2026-05',
    'published_word_floor', 800,
    'thin_content_action', 'noindex_keep_user_visible',
    'reindex_rule', 'set noindex=false and index_state=index only after content passes the blog article quality floor'
  ),
  now()
)
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = excluded.updated_at;
