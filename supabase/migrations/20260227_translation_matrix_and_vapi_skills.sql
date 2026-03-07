-- 20260227_translation_matrix_and_vapi_skills.sql
-- Creates translation_matrix table for tracking per-country per-field translations
-- and seeds fallback translations for required email sequences.

begin;

-- =========================
-- TRANSLATION MATRIX TABLE
-- =========================

create table if not exists public.translation_matrix (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  language_code text not null,
  field_key text not null,                  -- 'claim_cta', 'verified_badge_label', 'services', etc.
  field_category text not null default 'profile', -- 'profile', 'email_sequence', 'ui_label', 'seo_meta'
  source_text text not null,                -- English original
  translated_text text,                     -- translated version (null = not yet translated)
  translation_method text default 'pending', -- 'human', 'machine', 'pending', 'fallback_en'
  quality_score int default 0 check (quality_score between 0 and 100),
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, language_code, field_key, field_category)
);

create index if not exists idx_tm_country on public.translation_matrix (country_code);
create index if not exists idx_tm_lang on public.translation_matrix (language_code);
create index if not exists idx_tm_category on public.translation_matrix (field_category);

alter table public.translation_matrix enable row level security;
create policy "translation_matrix_public_read" on public.translation_matrix for select using (true);
create policy "translation_matrix_service_write" on public.translation_matrix for all using (auth.role() = 'service_role');

-- =========================
-- SEED CRITICAL FIELDS FOR ALL NON-EN COUNTRIES WITH ENGLISH FALLBACKS
-- =========================

-- Profile fields
insert into public.translation_matrix (country_code, language_code, field_key, field_category, source_text, translated_text, translation_method, quality_score)
select
  cc,
  lang,
  field_key,
  'profile',
  source_text,
  source_text,  -- fallback to English until human translation available
  'fallback_en',
  30  -- low quality = needs real translation
from (values ('DE','de'), ('SE','sv'), ('NO','no'), ('SA','ar'), ('MX','es'), ('TR','tr'),
             ('NL','nl'), ('BE','nl'), ('IT','it'), ('BR','pt'), ('CL','es'), ('PL','pl'),
             ('DK','da'), ('FI','fi'), ('ES','es'), ('CH','de'), ('AT','de'), ('FR','fr')
) as countries(cc, lang)
cross join (values
  ('name', 'Name'),
  ('description', 'Description'),
  ('services', 'Services'),
  ('hours_label', 'Hours'),
  ('claim_cta', 'Claim this listing'),
  ('verified_badge_label', 'Verified'),
  ('contact_label', 'Contact')
) as fields(field_key, source_text)
on conflict (country_code, language_code, field_key, field_category) do nothing;

-- Email sequences
insert into public.translation_matrix (country_code, language_code, field_key, field_category, source_text, translated_text, translation_method, quality_score)
select
  cc,
  lang,
  seq_name,
  'email_sequence',
  'English fallback — requires translation',
  null,  -- explicitly null = not translated yet
  'pending',
  0
from (values ('DE','de'), ('SE','sv'), ('NO','no'), ('SA','ar'), ('MX','es'), ('TR','tr'),
             ('NL','nl'), ('BE','nl'), ('IT','it'), ('BR','pt'), ('CL','es'), ('PL','pl'),
             ('DK','da'), ('FI','fi'), ('ES','es'), ('CH','de'), ('AT','de'), ('FR','fr')
) as countries(cc, lang)
cross join (values
  ('claim_followup'),
  ('verification_steps'),
  ('premium_offer'),
  ('advertiser_nurture')
) as seqs(seq_name)
on conflict (country_code, language_code, field_key, field_category) do nothing;

commit;
