-- ============================================================
-- COMPLIANCE COUNTRY PROFILES — SEED ALL 52 COUNTRIES
-- Spec: AG-COMPLIANCE-BRAIN-01
-- ============================================================
begin;

insert into public.compliance_country_profiles (
    country_iso2, country_name, tier, region_group,
    consent_profile, requires_gdpr, requires_att,
    data_retention_days, locale_default, currency_code,
    unit_system, timezone_default
) values
  -- Tier A — Active Markets
  ('US','United States','A','NA','non_eu_tracking_notice',false,true,365,'en-US','USD','imperial','America/New_York'),
  ('CA','Canada','A','NA','non_eu_tracking_notice',false,true,365,'en-CA','CAD','metric','America/Toronto'),
  ('AU','Australia','A','APAC','non_eu_tracking_notice',false,true,365,'en-AU','AUD','metric','Australia/Sydney'),
  ('GB','United Kingdom','A','UK_IRE','uk_gdpr_consent',true,true,365,'en-GB','GBP','mixed','Europe/London'),
  ('NZ','New Zealand','A','APAC','non_eu_tracking_notice',false,true,365,'en-NZ','NZD','metric','Pacific/Auckland'),
  ('ZA','South Africa','A','AFR','non_eu_tracking_notice',false,false,365,'en-ZA','ZAR','metric','Africa/Johannesburg'),
  ('DE','Germany','A','EU_EEA','eu_gdpr_consent',true,true,365,'de-DE','EUR','metric','Europe/Berlin'),
  ('NL','Netherlands','A','EU_EEA','eu_gdpr_consent',true,true,365,'nl-NL','EUR','metric','Europe/Amsterdam'),
  ('AE','United Arab Emirates','A','GCC','non_eu_tracking_notice',false,false,365,'en-AE','AED','metric','Asia/Dubai'),
  ('BR','Brazil','A','LATAM','non_eu_tracking_notice',false,false,365,'pt-BR','BRL','metric','America/Sao_Paulo'),

  -- Tier B — Near-Launch EU/EEA
  ('IE','Ireland','B','UK_IRE','eu_gdpr_consent',true,true,365,'en-IE','EUR','metric','Europe/Dublin'),
  ('SE','Sweden','B','EU_EEA','eu_gdpr_consent',true,true,365,'sv-SE','SEK','metric','Europe/Stockholm'),
  ('NO','Norway','B','EFTA','eu_gdpr_consent',true,true,365,'nb-NO','NOK','metric','Europe/Oslo'),
  ('DK','Denmark','B','EU_EEA','eu_gdpr_consent',true,true,365,'da-DK','DKK','metric','Europe/Copenhagen'),
  ('FI','Finland','B','EU_EEA','eu_gdpr_consent',true,true,365,'fi-FI','EUR','metric','Europe/Helsinki'),
  ('BE','Belgium','B','EU_EEA','eu_gdpr_consent',true,true,365,'nl-BE','EUR','metric','Europe/Brussels'),
  ('AT','Austria','B','EU_EEA','eu_gdpr_consent',true,true,365,'de-AT','EUR','metric','Europe/Vienna'),
  ('CH','Switzerland','B','EFTA','eu_gdpr_consent',true,true,365,'de-CH','CHF','metric','Europe/Zurich'),
  ('ES','Spain','B','EU_EEA','eu_gdpr_consent',true,true,365,'es-ES','EUR','metric','Europe/Madrid'),
  ('FR','France','B','EU_EEA','eu_gdpr_consent',true,true,365,'fr-FR','EUR','metric','Europe/Paris'),
  ('IT','Italy','B','EU_EEA','eu_gdpr_consent',true,true,365,'it-IT','EUR','metric','Europe/Rome'),
  ('PT','Portugal','B','EU_EEA','eu_gdpr_consent',true,true,365,'pt-PT','EUR','metric','Europe/Lisbon'),
  ('SA','Saudi Arabia','B','GCC','non_eu_tracking_notice',false,false,365,'ar-SA','SAR','metric','Asia/Riyadh'),

  -- Tier C — Growth Markets
  ('PL','Poland','C','EU_EEA','eu_gdpr_consent',true,true,365,'pl-PL','PLN','metric','Europe/Warsaw'),
  ('CZ','Czech Republic','C','EU_EEA','eu_gdpr_consent',true,true,365,'cs-CZ','CZK','metric','Europe/Prague'),
  ('SK','Slovakia','C','EU_EEA','eu_gdpr_consent',true,true,365,'sk-SK','EUR','metric','Europe/Bratislava'),
  ('HU','Hungary','C','EU_EEA','eu_gdpr_consent',true,true,365,'hu-HU','HUF','metric','Europe/Budapest'),
  ('SI','Slovenia','C','EU_EEA','eu_gdpr_consent',true,true,365,'sl-SI','EUR','metric','Europe/Ljubljana'),
  ('EE','Estonia','C','EU_EEA','eu_gdpr_consent',true,true,365,'et-EE','EUR','metric','Europe/Tallinn'),
  ('LV','Latvia','C','EU_EEA','eu_gdpr_consent',true,true,365,'lv-LV','EUR','metric','Europe/Riga'),
  ('LT','Lithuania','C','EU_EEA','eu_gdpr_consent',true,true,365,'lt-LT','EUR','metric','Europe/Vilnius'),
  ('HR','Croatia','C','EU_EEA','eu_gdpr_consent',true,true,365,'hr-HR','EUR','metric','Europe/Zagreb'),
  ('RO','Romania','C','EU_EEA','eu_gdpr_consent',true,true,365,'ro-RO','RON','metric','Europe/Bucharest'),
  ('BG','Bulgaria','C','EU_EEA','eu_gdpr_consent',true,true,365,'bg-BG','BGN','metric','Europe/Sofia'),
  ('GR','Greece','C','EU_EEA','eu_gdpr_consent',true,true,365,'el-GR','EUR','metric','Europe/Athens'),
  ('TR','Turkey','C','EU_EEA','non_eu_tracking_notice',false,false,365,'tr-TR','TRY','metric','Europe/Istanbul'),
  ('QA','Qatar','C','GCC','non_eu_tracking_notice',false,false,365,'ar-QA','QAR','metric','Asia/Qatar'),
  ('KW','Kuwait','C','GCC','non_eu_tracking_notice',false,false,365,'ar-KW','KWD','metric','Asia/Kuwait'),
  ('OM','Oman','C','GCC','non_eu_tracking_notice',false,false,365,'ar-OM','OMR','metric','Asia/Muscat'),
  ('BH','Bahrain','C','GCC','non_eu_tracking_notice',false,false,365,'ar-BH','BHD','metric','Asia/Bahrain'),
  ('SG','Singapore','C','APAC','non_eu_tracking_notice',false,true,365,'en-SG','SGD','metric','Asia/Singapore'),
  ('MY','Malaysia','C','APAC','non_eu_tracking_notice',false,false,365,'ms-MY','MYR','metric','Asia/Kuala_Lumpur'),
  ('JP','Japan','C','APAC','non_eu_tracking_notice',false,true,365,'ja-JP','JPY','metric','Asia/Tokyo'),
  ('KR','South Korea','C','APAC','non_eu_tracking_notice',false,true,365,'ko-KR','KRW','metric','Asia/Seoul'),
  ('MX','Mexico','C','LATAM','non_eu_tracking_notice',false,false,365,'es-MX','MXN','metric','America/Mexico_City'),

  -- Tier D — Emerging
  ('CL','Chile','D','LATAM','non_eu_tracking_notice',false,false,365,'es-CL','CLP','metric','America/Santiago'),
  ('AR','Argentina','D','LATAM','non_eu_tracking_notice',false,false,365,'es-AR','ARS','metric','America/Argentina/Buenos_Aires'),
  ('CO','Colombia','D','LATAM','non_eu_tracking_notice',false,false,365,'es-CO','COP','metric','America/Bogota'),
  ('PE','Peru','D','LATAM','non_eu_tracking_notice',false,false,365,'es-PE','PEN','metric','America/Lima'),
  ('UY','Uruguay','D','LATAM','non_eu_tracking_notice',false,false,365,'es-UY','UYU','metric','America/Montevideo'),
  ('PA','Panama','D','LATAM','non_eu_tracking_notice',false,false,365,'es-PA','USD','metric','America/Panama'),
  ('CR','Costa Rica','D','LATAM','non_eu_tracking_notice',false,false,365,'es-CR','CRC','metric','America/Costa_Rica')
on conflict (country_iso2)
do update set
    country_name = excluded.country_name,
    tier = excluded.tier,
    region_group = excluded.region_group,
    consent_profile = excluded.consent_profile,
    requires_gdpr = excluded.requires_gdpr,
    requires_att = excluded.requires_att,
    data_retention_days = excluded.data_retention_days,
    locale_default = excluded.locale_default,
    currency_code = excluded.currency_code,
    unit_system = excluded.unit_system,
    timezone_default = excluded.timezone_default,
    updated_at = now();

commit;
