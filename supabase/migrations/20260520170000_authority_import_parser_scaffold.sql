-- Authority import parser scaffold.
-- Purpose: register official/public authority sources and association sources,
-- route approved sources to parser edge functions, and keep all output staged
-- in raw discovery tables until quality, legal, dedup, and seasoning gates pass.

create table if not exists public.hc_authority_source_imports (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  template_source_key text references public.hc_discovery_source_templates(source_key) on delete set null,
  country_code text not null,
  authority_name text not null,
  source_url text not null,
  source_format text not null check (source_format in ('api','csv','html_scrape','json','pdf_scrape','xml','xlsx','zip')),
  source_category text not null default 'government_registry' check (
    source_category in ('government_registry','association_registry','public_open_data','manual_review')
  ),
  role_keys_covered text[] not null default '{}',
  parser_function text not null,
  refresh_frequency text not null default 'quarterly',
  estimated_record_count integer,
  legal_review_status text not null default 'pending' check (
    legal_review_status in ('approved','pending','needs_legal_review','blocked')
  ),
  source_license text,
  source_notes text,
  last_imported_at timestamptz,
  last_import_row_count integer,
  status text not null default 'queued' check (
    status in ('queued','running','completed','failed','skipped','quarantined')
  ),
  last_error text,
  result_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_authority_source_imports_ready
  on public.hc_authority_source_imports (legal_review_status, status, country_code, source_format);

create index if not exists idx_hc_authority_source_imports_category
  on public.hc_authority_source_imports (source_category, country_code);

alter table public.hc_authority_source_imports enable row level security;

drop policy if exists "authenticated read approved authority imports" on public.hc_authority_source_imports;
create policy "authenticated read approved authority imports"
on public.hc_authority_source_imports
for select
to authenticated
using (legal_review_status = 'approved');

create or replace view public.v_hc_authority_import_health
with (security_invoker = true) as
select
  country_code,
  source_category,
  source_format,
  legal_review_status,
  status,
  count(*)::bigint as source_count,
  coalesce(sum(estimated_record_count), 0)::bigint as estimated_records,
  max(last_imported_at) as latest_imported_at,
  count(*) filter (where legal_review_status = 'approved' and status in ('queued','failed'))::bigint as dispatchable_count
from public.hc_authority_source_imports
group by country_code, source_category, source_format, legal_review_status, status;

create or replace function public.fn_authority_parser_for_format(p_source_format text)
returns text
language sql
immutable
as $$
  select case p_source_format
    when 'csv' then 'authority-csv-parser'
    when 'json' then 'authority-json-parser'
    when 'api' then 'authority-api-parser'
    when 'html_scrape' then 'authority-html-scrape-parser'
    when 'xml' then 'authority-xml-parser'
    when 'xlsx' then 'authority-xlsx-parser'
    when 'pdf_scrape' then 'authority-pdf-scrape-parser'
    when 'zip' then 'authority-zip-parser'
    else 'authority-html-scrape-parser'
  end;
$$;

create or replace function public.fn_dispatch_authority_imports(
  p_limit integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_dispatched integer := 0;
  v_blocked integer := 0;
begin
  update public.hc_authority_source_imports
  set status = 'skipped',
      last_error = 'Legal review is not approved; dispatcher refused to enqueue this source.',
      updated_at = now()
  where status = 'queued'
    and legal_review_status <> 'approved';

  get diagnostics v_blocked = row_count;

  with ready_sources as (
    select *
    from public.hc_authority_source_imports
    where legal_review_status = 'approved'
      and status in ('queued','failed')
    order by
      case source_category when 'government_registry' then 0 else 1 end,
      coalesce(estimated_record_count, 0) desc,
      created_at asc
    limit p_limit
  ),
  inserted as (
    insert into public.hc_discovery_work_queue (
      source_key,
      provider,
      job_type,
      priority,
      country_code,
      target_entity_subtype,
      source_name,
      source_url,
      query,
      payload
    )
    select
      template_source_key,
      case source_category
        when 'association_registry' then 'association_registry'
        else 'government_registry'
      end,
      case source_category
        when 'association_registry' then 'association_member_scan'
        else 'authority_registry_scan'
      end,
      case source_category when 'government_registry' then 20 else 70 end,
      country_code,
      coalesce(role_keys_covered[1], 'heavy_haul_support_provider'),
      authority_name,
      source_url,
      null,
      jsonb_build_object(
        'authority_source_import_id', id,
        'source_key', source_key,
        'template_source_key', template_source_key,
        'source_format', source_format,
        'source_category', source_category,
        'parser_function', parser_function,
        'role_keys_covered', role_keys_covered,
        'legal_review_status', legal_review_status,
        'source_license', source_license,
        'staging_policy', 'raw_only_no_public_promotion'
      )
    from ready_sources
    on conflict do nothing
    returning 1
  )
  select count(*) into v_dispatched from inserted;

  update public.hc_authority_source_imports s
  set status = 'running',
      updated_at = now(),
      last_error = null
  where exists (
    select 1
    from public.hc_discovery_work_queue q
    where q.source_key = s.template_source_key
      and q.status in ('pending','running')
      and q.payload->>'authority_source_import_id' = s.id::text
  )
  and s.legal_review_status = 'approved';

  return jsonb_build_object(
    'ok', true,
    'dispatched', v_dispatched,
    'blocked_for_legal_review', v_blocked
  );
end;
$$;

insert into public.hc_authority_source_imports (
  source_key,
  template_source_key,
  country_code,
  authority_name,
  source_url,
  source_format,
  source_category,
  role_keys_covered,
  parser_function,
  refresh_frequency,
  estimated_record_count,
  legal_review_status,
  source_license,
  source_notes,
  status,
  last_error
)
select
  t.source_key || '_' || lower(country_code),
  t.source_key,
  country_code,
  t.source_name,
  t.source_url,
  case
    when t.source_url ilike '%.csv%' then 'csv'
    when t.source_url ilike '%.zip%' then 'zip'
    when t.provider = 'government_registry' then 'html_scrape'
    else 'html_scrape'
  end as source_format,
  case
    when t.provider = 'association_registry' then 'association_registry'
    else 'government_registry'
  end as source_category,
  t.role_terms,
  public.fn_authority_parser_for_format(
    case
      when t.source_url ilike '%.csv%' then 'csv'
      when t.source_url ilike '%.zip%' then 'zip'
      when t.provider = 'government_registry' then 'html_scrape'
      else 'html_scrape'
    end
  ),
  'quarterly',
  null,
  case
    when t.provider = 'association_registry' then 'needs_legal_review'
    else 'approved'
  end,
  case
    when t.provider = 'association_registry' then 'permission_required'
    else 'public_authority_source'
  end,
  t.notes,
  case
    when t.source_url ilike '%.zip%' then 'quarantined'
    else 'queued'
  end,
  case
    when t.source_url ilike '%.zip%' then 'ZIP authority bundles are tracked but require a dedicated extractor before this parser pipeline can run.'
    else null
  end
from public.hc_discovery_source_templates t
cross join lateral unnest(t.country_codes) as country_code
where t.provider in ('government_registry','association_registry')
  and t.source_url is not null
on conflict (source_key) do update
set template_source_key = excluded.template_source_key,
    country_code = excluded.country_code,
    authority_name = excluded.authority_name,
    source_url = excluded.source_url,
    source_format = excluded.source_format,
    source_category = excluded.source_category,
    role_keys_covered = excluded.role_keys_covered,
    parser_function = excluded.parser_function,
    refresh_frequency = excluded.refresh_frequency,
    legal_review_status = excluded.legal_review_status,
    source_license = excluded.source_license,
    source_notes = excluded.source_notes,
    status = case
      when hc_authority_source_imports.status in ('running','completed') then hc_authority_source_imports.status
      else excluded.status
    end,
    last_error = case
      when hc_authority_source_imports.status in ('running','completed') then hc_authority_source_imports.last_error
      else excluded.last_error
    end,
    updated_at = now();

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net') then
    begin
      perform cron.unschedule('authority-imports-dispatcher');
    exception
      when others then
        null;
    end;

    perform cron.schedule(
      'authority-imports-dispatcher',
      '*/30 * * * *',
      $cron$select public.fn_dispatch_authority_imports(10);$cron$
    );
  end if;
exception
  when others then
    raise notice 'authority-imports-dispatcher cron was not scheduled: %', sqlerrm;
end $$;
