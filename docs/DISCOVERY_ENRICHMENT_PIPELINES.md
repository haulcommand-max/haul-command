# Discovery Enrichment Pipelines

This is the execution contract for Tavily, Firecrawl, Clay, OSM, government registries, association registries, geocode backfill, and quality review.

## Standing Rules

- Do not use Google Places for this pipeline.
- Do not use Make.com.
- Do not create another canonical directory table.
- Do not promote scraped candidates straight into verified/provider surfaces.
- Do not fake demand, verification, authority, scarcity, reviews, or market coverage.
- Do not commit API keys, webhook URLs, service-role keys, tokens, or screenshots of secrets.
- All discoveries must season through raw/staged queues, confidence checks, dedupe, and claim/proof paths before public trust claims.

## Required Secrets

Set these outside Git:

- `TAVILY_API_KEY`
- `FIRECRAWL_API_KEY`
- `CLAY_WEBHOOK_URL`
- `CLAY_API_KEY`
- `AUTHORITY_IMPORT_SECRET`

For Supabase Edge Functions, set at least:

- `FIRECRAWL_API_KEY`
- `FIRECRAWL_WORKER_SECRET` or `CRON_SECRET`
- `CLAY_WEBHOOK_URL` when Clay handoff is enabled
- `AUTHORITY_IMPORT_SECRET` for authority parser functions

## Local Repo Pieces

- Firecrawl worker: `supabase/functions/firecrawl-worker/index.ts`
- Discovery migration: `supabase/migrations/20260520143000_discovery_enrichment_pipelines.sql`
- Authority import parser migration: `supabase/migrations/20260520170000_authority_import_parser_scaffold.sql`
- Discovery queue runner: `scripts/discovery/run-work-queue.mjs`
- Authority parser edge functions: `supabase/functions/authority-*-parser/index.ts`
- Safe Vercel env loader: `scripts/set-vercel-env.sh`
- Existing raw ingest API: `app/api/discovery/ingest/route.ts`
- Existing OSM cron: `app/api/cron/osm-enrichment/route.ts`
- Existing FMCSA cron: `app/api/cron/fmcsa-ingest/route.ts`

## Pipeline Order

1. Set secrets in Vercel and Supabase Edge Function secrets.
2. Apply the discovery enrichment migration.
3. Run `select public.hc_enqueue_discovery_from_templates(100);`.
4. Run low-cost OSM jobs first.
5. Run Tavily discovery jobs for rare roles, state-localized searches, and reverse-company evidence.
6. Send Tavily raw discoveries to Clay via queued `clay_enrichment` work.
7. Use Firecrawl for official pages, association pages, and source-backed candidate evidence.
8. Dispatch approved authority registry imports through parser edge functions.
9. Run geocode backfill only for records without verified coordinates.
10. Review quality and dedupe before promotion.

## Discovery Queue Runner

Run the first safe worker set with:

```bash
npm run discovery:work-queue -- --limit 5
```

Supported jobs:

- `tavily_search`
- `reverse_company_search`
- `firecrawl_scrape`
- `clay_enrichment`
- `authority_registry_scan`
- `association_member_scan`

Unsupported jobs such as `geocode_backfill`, `osm_overpass_template`, and `quality_dedup_review` are marked `skipped` with a reason until dedicated non-Google, non-Make consumers exist. The runner only stages observations in `hc_entities_raw` or hands off to the Firecrawl/Clay/authority-parser worker path; it does not promote rows directly into public directory tables.

## Authority Import Parser Contract

Authority sources live in `hc_authority_source_imports`. The dispatcher only enqueues sources with `legal_review_status = 'approved'`; association/member-list rows default to legal review instead of scraping by accident.

Run the dispatcher with:

```sql
select public.fn_dispatch_authority_imports(10);
```

Approved imports are converted into `hc_discovery_work_queue` jobs with:

```json
{
  "job_type": "authority_registry_scan",
  "payload": {
    "authority_source_import_id": "<uuid>",
    "parser_function": "authority-csv-parser",
    "source_format": "csv",
    "legal_review_status": "approved",
    "staging_policy": "raw_only_no_public_promotion"
  }
}
```

Parser functions:

- `authority-csv-parser`
- `authority-api-parser`
- `authority-json-parser`
- `authority-html-scrape-parser`
- `authority-xml-parser`
- `authority-xlsx-parser`
- `authority-pdf-scrape-parser`
- `authority-zip-parser`

CSV, API, JSON, HTML, and XML parsers fetch source data and stage observations into `hc_entities_raw`. XLSX, PDF, and ZIP parsers are intentionally scaffolded but quarantined until the approved Fly/Hugging Face utility extraction layer is wired. No parser writes to `directory_entities`, marks a profile verified, creates review/rating data, or bypasses dedup/seasoning.

ZIP-backed authority datasets are registry-tracked through `authority-zip-parser` but quarantined until a dedicated extractor is added. FMCSA census ZIP handling should continue through the existing FMCSA ingestion path until this parser layer has audited archive support.

## Firecrawl Worker Contract

Request:

```json
{
  "url": "https://example.com/member-directory",
  "source_type": "association",
  "source_name": "association_member_page",
  "country_code": "US",
  "target_entity_subtype": "pilot_car_operator",
  "trigger_clay": false,
  "dry_run": true
}
```

Headers:

```text
Authorization: Bearer <FIRECRAWL_WORKER_SECRET or CRON_SECRET>
Content-Type: application/json
```

Output lands in `hc_entities_raw` with source metadata and raw scrape payload. If `trigger_clay` is true and `CLAY_WEBHOOK_URL` is configured, the worker posts a minimal enrichment handoff to Clay.

## Verification Queries

Queue health, run with service/admin database access:

```sql
select *
from public.v_hc_discovery_pipeline_health
order by provider, job_type, status;
```

Template inventory:

```sql
select provider, count(*) as templates
from public.hc_discovery_source_templates
where active
group by provider
order by provider;
```

Ready work:

```sql
select provider, job_type, count(*) as ready
from public.hc_discovery_work_queue
where status = 'pending'
  and run_after <= now()
group by provider, job_type
order by ready desc;
```

Clay auto-queue check after Tavily raw inserts:

```sql
select count(*) as clay_jobs
from public.hc_discovery_work_queue
where provider = 'clay'
  and job_type = 'clay_enrichment'
  and created_at >= now() - interval '7 days';
```

Failed work:

```sql
select provider, job_type, source_name, country_code, last_error, attempts, updated_at
from public.hc_discovery_work_queue
where status = 'failed'
order by updated_at desc
limit 50;
```

## Escalate Only When

- A required API credential is missing or rejected.
- A source blocks lawful crawling or terms prohibit use.
- A live table shape differs from the migration assumptions in a way that would lose data.
- A candidate could affect public verification, legal, safety, or authority claims without a source-backed review.

## Current Limitation

The local checkout does not include the Supabase CLI, and live Supabase credentials in the current environment were not validated in this patch. Code and migrations are ready for review, but live application of secrets, edge deployment, and database migration must be done with valid project access.
