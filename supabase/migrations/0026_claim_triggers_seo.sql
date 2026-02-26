-- 0026_claim_triggers_seo.sql
-- Claim profile -> auto SEO page generator trigger + sitemap shard update

begin;

-- A simple URL registry used to generate sharded sitemaps.
create table if not exists public.sitemap_urls (
  url text primary key,
  kind text not null default 'page',
  shard int not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Aggregate counts per shard (optional but handy for ops).
create table if not exists public.sitemap_shards (
  shard int primary key,
  url_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Deterministic sharding: stable across time, no reorder churn.
create or replace function public.sitemap_shard_for(url text, shards int default 50)
returns int
language sql
immutable
as $$
  select mod(abs(hashtext(url)), shards);
$$;

create or replace function public.sitemap_url_upsert(p_url text, p_kind text default 'page')
returns void
language plpgsql
security definer
as $$
declare
  s int;
begin
  s := public.sitemap_shard_for(p_url, 50);

  insert into public.sitemap_urls(url, kind, shard)
  values (p_url, coalesce(p_kind,'page'), s)
  on conflict (url) do update
    set kind = excluded.kind,
        shard = excluded.shard,
        updated_at = now();

  insert into public.sitemap_shards(shard, url_count)
  values (s, 0)
  on conflict (shard) do nothing;

  -- lightweight shard recount (only that shard)
  update public.sitemap_shards
  set url_count = (select count(*) from public.sitemap_urls where shard = s),
      updated_at = now()
  where shard = s;
end;
$$;

-- NOTE: assumes you already have:
-- public.providers(id, slug, state, city, claim_status, updated_at)
-- If your column names differ, tell Gemini to map them.

create or replace function public.seo_on_provider_claim()
returns trigger
language plpgsql
security definer
as $$
declare
  provider_url text;
  city_url text;
  state_url text;
begin
  -- Trigger only when the listing becomes claimed/verified.
  -- Adjust statuses to your real enum values.
  if (tg_op = 'UPDATE') then
    if (coalesce(old.claim_status,'') = coalesce(new.claim_status,'')) then
      return new;
    end if;
  end if;

  if lower(coalesce(new.claim_status,'')) not in ('claimed','verified') then
    return new;
  end if;

  -- Build canonical URLs (edit to match your actual routing).
  provider_url := '/providers/' || new.slug;
  state_url := '/states/' || lower(new.state);
  city_url := '/states/' || lower(new.state) || '/' || lower(replace(new.city,' ','-'));

  perform public.sitemap_url_upsert(provider_url, 'provider');
  perform public.sitemap_url_upsert(city_url, 'city');
  perform public.sitemap_url_upsert(state_url, 'state');

  return new;
end;
$$;

drop trigger if exists trg_seo_on_provider_claim on public.providers;

create trigger trg_seo_on_provider_claim
after insert or update of claim_status on public.providers
for each row
execute function public.seo_on_provider_claim();

-- Public views for sitemap serving (50 shards)
create or replace view public.sitemap_urls_public as
select url, kind, shard, updated_at
from public.sitemap_urls;

commit;
