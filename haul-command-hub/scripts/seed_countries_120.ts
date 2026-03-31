/**
 * Seed global_countries to 120 countries
 * 
 * Fills in the 63 missing countries from the COUNTRY_NAMES map
 * that don't exist in global_countries yet.
 * 
 * Usage: npx tsx scripts/seed_countries_120.ts
 */

const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  'https://hvjyfyzotqobfkakjozp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938',
  { auth: { persistSession: false } }
);

// Full 120-country dataset matching directory-helpers.ts COUNTRY_NAMES
const ALL_COUNTRIES: Record<string, {
  name: string; iso3: string; region: string; subregion: string;
  currency: string; tier: string; launch_wave: number;
  primary_language: string; seo_priority_score: number;
  units_system: string; driving_side: string;
}> = {
  // Tier A — Gold (10)
  US: { name: 'United States', iso3: 'USA', region: 'Americas', subregion: 'Northern America', currency: 'USD', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 100, units_system: 'imperial', driving_side: 'right' },
  CA: { name: 'Canada', iso3: 'CAN', region: 'Americas', subregion: 'Northern America', currency: 'CAD', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 95, units_system: 'metric', driving_side: 'right' },
  AU: { name: 'Australia', iso3: 'AUS', region: 'Oceania', subregion: 'Australia and New Zealand', currency: 'AUD', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 90, units_system: 'metric', driving_side: 'left' },
  GB: { name: 'United Kingdom', iso3: 'GBR', region: 'Europe', subregion: 'Northern Europe', currency: 'GBP', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 90, units_system: 'metric', driving_side: 'left' },
  NZ: { name: 'New Zealand', iso3: 'NZL', region: 'Oceania', subregion: 'Australia and New Zealand', currency: 'NZD', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 75, units_system: 'metric', driving_side: 'left' },
  ZA: { name: 'South Africa', iso3: 'ZAF', region: 'Africa', subregion: 'Southern Africa', currency: 'ZAR', tier: 'gold', launch_wave: 1, primary_language: 'en', seo_priority_score: 70, units_system: 'metric', driving_side: 'left' },
  DE: { name: 'Germany', iso3: 'DEU', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'gold', launch_wave: 1, primary_language: 'de', seo_priority_score: 85, units_system: 'metric', driving_side: 'right' },
  NL: { name: 'Netherlands', iso3: 'NLD', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'gold', launch_wave: 1, primary_language: 'nl', seo_priority_score: 70, units_system: 'metric', driving_side: 'right' },
  AE: { name: 'United Arab Emirates', iso3: 'ARE', region: 'Asia', subregion: 'Western Asia', currency: 'AED', tier: 'gold', launch_wave: 1, primary_language: 'ar', seo_priority_score: 80, units_system: 'metric', driving_side: 'right' },
  BR: { name: 'Brazil', iso3: 'BRA', region: 'Americas', subregion: 'South America', currency: 'BRL', tier: 'gold', launch_wave: 1, primary_language: 'pt', seo_priority_score: 80, units_system: 'metric', driving_side: 'right' },
  // Tier B — Blue (18)
  IE: { name: 'Ireland', iso3: 'IRL', region: 'Europe', subregion: 'Northern Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'en', seo_priority_score: 60, units_system: 'metric', driving_side: 'left' },
  SE: { name: 'Sweden', iso3: 'SWE', region: 'Europe', subregion: 'Northern Europe', currency: 'SEK', tier: 'blue', launch_wave: 2, primary_language: 'sv', seo_priority_score: 55, units_system: 'metric', driving_side: 'right' },
  NO: { name: 'Norway', iso3: 'NOR', region: 'Europe', subregion: 'Northern Europe', currency: 'NOK', tier: 'blue', launch_wave: 2, primary_language: 'no', seo_priority_score: 55, units_system: 'metric', driving_side: 'right' },
  DK: { name: 'Denmark', iso3: 'DNK', region: 'Europe', subregion: 'Northern Europe', currency: 'DKK', tier: 'blue', launch_wave: 2, primary_language: 'da', seo_priority_score: 50, units_system: 'metric', driving_side: 'right' },
  FI: { name: 'Finland', iso3: 'FIN', region: 'Europe', subregion: 'Northern Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'fi', seo_priority_score: 50, units_system: 'metric', driving_side: 'right' },
  BE: { name: 'Belgium', iso3: 'BEL', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'nl', seo_priority_score: 50, units_system: 'metric', driving_side: 'right' },
  AT: { name: 'Austria', iso3: 'AUT', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'de', seo_priority_score: 50, units_system: 'metric', driving_side: 'right' },
  CH: { name: 'Switzerland', iso3: 'CHE', region: 'Europe', subregion: 'Western Europe', currency: 'CHF', tier: 'blue', launch_wave: 2, primary_language: 'de', seo_priority_score: 55, units_system: 'metric', driving_side: 'right' },
  ES: { name: 'Spain', iso3: 'ESP', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'es', seo_priority_score: 55, units_system: 'metric', driving_side: 'right' },
  FR: { name: 'France', iso3: 'FRA', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'fr', seo_priority_score: 65, units_system: 'metric', driving_side: 'right' },
  IT: { name: 'Italy', iso3: 'ITA', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'it', seo_priority_score: 55, units_system: 'metric', driving_side: 'right' },
  PT: { name: 'Portugal', iso3: 'PRT', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'blue', launch_wave: 2, primary_language: 'pt', seo_priority_score: 40, units_system: 'metric', driving_side: 'right' },
  SA: { name: 'Saudi Arabia', iso3: 'SAU', region: 'Asia', subregion: 'Western Asia', currency: 'SAR', tier: 'blue', launch_wave: 2, primary_language: 'ar', seo_priority_score: 60, units_system: 'metric', driving_side: 'right' },
  QA: { name: 'Qatar', iso3: 'QAT', region: 'Asia', subregion: 'Western Asia', currency: 'QAR', tier: 'blue', launch_wave: 2, primary_language: 'ar', seo_priority_score: 50, units_system: 'metric', driving_side: 'right' },
  MX: { name: 'Mexico', iso3: 'MEX', region: 'Americas', subregion: 'Central America', currency: 'MXN', tier: 'blue', launch_wave: 2, primary_language: 'es', seo_priority_score: 65, units_system: 'metric', driving_side: 'right' },
  IN: { name: 'India', iso3: 'IND', region: 'Asia', subregion: 'Southern Asia', currency: 'INR', tier: 'blue', launch_wave: 2, primary_language: 'hi', seo_priority_score: 60, units_system: 'metric', driving_side: 'left' },
  ID: { name: 'Indonesia', iso3: 'IDN', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'IDR', tier: 'blue', launch_wave: 2, primary_language: 'id', seo_priority_score: 40, units_system: 'metric', driving_side: 'left' },
  TH: { name: 'Thailand', iso3: 'THA', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'THB', tier: 'blue', launch_wave: 2, primary_language: 'th', seo_priority_score: 40, units_system: 'metric', driving_side: 'left' },
  // Tier C — Silver (26)
  PL: { name: 'Poland', iso3: 'POL', region: 'Europe', subregion: 'Eastern Europe', currency: 'PLN', tier: 'silver', launch_wave: 3, primary_language: 'pl', seo_priority_score: 40, units_system: 'metric', driving_side: 'right' },
  CZ: { name: 'Czech Republic', iso3: 'CZE', region: 'Europe', subregion: 'Eastern Europe', currency: 'CZK', tier: 'silver', launch_wave: 3, primary_language: 'cs', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  SK: { name: 'Slovakia', iso3: 'SVK', region: 'Europe', subregion: 'Eastern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'sk', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  HU: { name: 'Hungary', iso3: 'HUN', region: 'Europe', subregion: 'Eastern Europe', currency: 'HUF', tier: 'silver', launch_wave: 3, primary_language: 'hu', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  SI: { name: 'Slovenia', iso3: 'SVN', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'sl', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  EE: { name: 'Estonia', iso3: 'EST', region: 'Europe', subregion: 'Northern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'et', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  LV: { name: 'Latvia', iso3: 'LVA', region: 'Europe', subregion: 'Northern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'lv', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  LT: { name: 'Lithuania', iso3: 'LTU', region: 'Europe', subregion: 'Northern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'lt', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  HR: { name: 'Croatia', iso3: 'HRV', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'hr', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  RO: { name: 'Romania', iso3: 'ROU', region: 'Europe', subregion: 'Eastern Europe', currency: 'RON', tier: 'silver', launch_wave: 3, primary_language: 'ro', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  BG: { name: 'Bulgaria', iso3: 'BGR', region: 'Europe', subregion: 'Eastern Europe', currency: 'BGN', tier: 'silver', launch_wave: 3, primary_language: 'bg', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  GR: { name: 'Greece', iso3: 'GRC', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'silver', launch_wave: 3, primary_language: 'el', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  TR: { name: 'Turkey', iso3: 'TUR', region: 'Asia', subregion: 'Western Asia', currency: 'TRY', tier: 'silver', launch_wave: 3, primary_language: 'tr', seo_priority_score: 40, units_system: 'metric', driving_side: 'right' },
  KW: { name: 'Kuwait', iso3: 'KWT', region: 'Asia', subregion: 'Western Asia', currency: 'KWD', tier: 'silver', launch_wave: 3, primary_language: 'ar', seo_priority_score: 40, units_system: 'metric', driving_side: 'right' },
  OM: { name: 'Oman', iso3: 'OMN', region: 'Asia', subregion: 'Western Asia', currency: 'OMR', tier: 'silver', launch_wave: 3, primary_language: 'ar', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  BH: { name: 'Bahrain', iso3: 'BHR', region: 'Asia', subregion: 'Western Asia', currency: 'BHD', tier: 'silver', launch_wave: 3, primary_language: 'ar', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  SG: { name: 'Singapore', iso3: 'SGP', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'SGD', tier: 'silver', launch_wave: 3, primary_language: 'en', seo_priority_score: 45, units_system: 'metric', driving_side: 'left' },
  MY: { name: 'Malaysia', iso3: 'MYS', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'MYR', tier: 'silver', launch_wave: 3, primary_language: 'ms', seo_priority_score: 35, units_system: 'metric', driving_side: 'left' },
  JP: { name: 'Japan', iso3: 'JPN', region: 'Asia', subregion: 'Eastern Asia', currency: 'JPY', tier: 'silver', launch_wave: 3, primary_language: 'ja', seo_priority_score: 50, units_system: 'metric', driving_side: 'left' },
  KR: { name: 'South Korea', iso3: 'KOR', region: 'Asia', subregion: 'Eastern Asia', currency: 'KRW', tier: 'silver', launch_wave: 3, primary_language: 'ko', seo_priority_score: 45, units_system: 'metric', driving_side: 'right' },
  CL: { name: 'Chile', iso3: 'CHL', region: 'Americas', subregion: 'South America', currency: 'CLP', tier: 'silver', launch_wave: 3, primary_language: 'es', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  AR: { name: 'Argentina', iso3: 'ARG', region: 'Americas', subregion: 'South America', currency: 'ARS', tier: 'silver', launch_wave: 3, primary_language: 'es', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  CO: { name: 'Colombia', iso3: 'COL', region: 'Americas', subregion: 'South America', currency: 'COP', tier: 'silver', launch_wave: 3, primary_language: 'es', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  PE: { name: 'Peru', iso3: 'PER', region: 'Americas', subregion: 'South America', currency: 'PEN', tier: 'silver', launch_wave: 3, primary_language: 'es', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  VN: { name: 'Vietnam', iso3: 'VNM', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'VND', tier: 'silver', launch_wave: 3, primary_language: 'vi', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  PH: { name: 'Philippines', iso3: 'PHL', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'PHP', tier: 'silver', launch_wave: 3, primary_language: 'en', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  // Tier D — Slate (25)
  UY: { name: 'Uruguay', iso3: 'URY', region: 'Americas', subregion: 'South America', currency: 'UYU', tier: 'slate', launch_wave: 4, primary_language: 'es', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  PA: { name: 'Panama', iso3: 'PAN', region: 'Americas', subregion: 'Central America', currency: 'USD', tier: 'slate', launch_wave: 4, primary_language: 'es', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  CR: { name: 'Costa Rica', iso3: 'CRI', region: 'Americas', subregion: 'Central America', currency: 'CRC', tier: 'slate', launch_wave: 4, primary_language: 'es', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  IL: { name: 'Israel', iso3: 'ISR', region: 'Asia', subregion: 'Western Asia', currency: 'ILS', tier: 'slate', launch_wave: 4, primary_language: 'he', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  NG: { name: 'Nigeria', iso3: 'NGA', region: 'Africa', subregion: 'Western Africa', currency: 'NGN', tier: 'slate', launch_wave: 4, primary_language: 'en', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  EG: { name: 'Egypt', iso3: 'EGY', region: 'Africa', subregion: 'Northern Africa', currency: 'EGP', tier: 'slate', launch_wave: 4, primary_language: 'ar', seo_priority_score: 30, units_system: 'metric', driving_side: 'right' },
  KE: { name: 'Kenya', iso3: 'KEN', region: 'Africa', subregion: 'Eastern Africa', currency: 'KES', tier: 'slate', launch_wave: 4, primary_language: 'en', seo_priority_score: 25, units_system: 'metric', driving_side: 'left' },
  MA: { name: 'Morocco', iso3: 'MAR', region: 'Africa', subregion: 'Northern Africa', currency: 'MAD', tier: 'slate', launch_wave: 4, primary_language: 'ar', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  RS: { name: 'Serbia', iso3: 'SRB', region: 'Europe', subregion: 'Southern Europe', currency: 'RSD', tier: 'slate', launch_wave: 4, primary_language: 'sr', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  UA: { name: 'Ukraine', iso3: 'UKR', region: 'Europe', subregion: 'Eastern Europe', currency: 'UAH', tier: 'slate', launch_wave: 4, primary_language: 'uk', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  KZ: { name: 'Kazakhstan', iso3: 'KAZ', region: 'Asia', subregion: 'Central Asia', currency: 'KZT', tier: 'slate', launch_wave: 4, primary_language: 'kk', seo_priority_score: 25, units_system: 'metric', driving_side: 'right' },
  TW: { name: 'Taiwan', iso3: 'TWN', region: 'Asia', subregion: 'Eastern Asia', currency: 'TWD', tier: 'slate', launch_wave: 4, primary_language: 'zh', seo_priority_score: 35, units_system: 'metric', driving_side: 'right' },
  PK: { name: 'Pakistan', iso3: 'PAK', region: 'Asia', subregion: 'Southern Asia', currency: 'PKR', tier: 'slate', launch_wave: 4, primary_language: 'ur', seo_priority_score: 25, units_system: 'metric', driving_side: 'left' },
  BD: { name: 'Bangladesh', iso3: 'BGD', region: 'Asia', subregion: 'Southern Asia', currency: 'BDT', tier: 'slate', launch_wave: 4, primary_language: 'bn', seo_priority_score: 20, units_system: 'metric', driving_side: 'left' },
  MN: { name: 'Mongolia', iso3: 'MNG', region: 'Asia', subregion: 'Eastern Asia', currency: 'MNT', tier: 'slate', launch_wave: 4, primary_language: 'mn', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  TT: { name: 'Trinidad and Tobago', iso3: 'TTO', region: 'Americas', subregion: 'Caribbean', currency: 'TTD', tier: 'slate', launch_wave: 4, primary_language: 'en', seo_priority_score: 15, units_system: 'metric', driving_side: 'left' },
  JO: { name: 'Jordan', iso3: 'JOR', region: 'Asia', subregion: 'Western Asia', currency: 'JOD', tier: 'slate', launch_wave: 4, primary_language: 'ar', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  GH: { name: 'Ghana', iso3: 'GHA', region: 'Africa', subregion: 'Western Africa', currency: 'GHS', tier: 'slate', launch_wave: 4, primary_language: 'en', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  TZ: { name: 'Tanzania', iso3: 'TZA', region: 'Africa', subregion: 'Eastern Africa', currency: 'TZS', tier: 'slate', launch_wave: 4, primary_language: 'sw', seo_priority_score: 15, units_system: 'metric', driving_side: 'left' },
  GE: { name: 'Georgia', iso3: 'GEO', region: 'Asia', subregion: 'Western Asia', currency: 'GEL', tier: 'slate', launch_wave: 4, primary_language: 'ka', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  AZ: { name: 'Azerbaijan', iso3: 'AZE', region: 'Asia', subregion: 'Western Asia', currency: 'AZN', tier: 'slate', launch_wave: 4, primary_language: 'az', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  CY: { name: 'Cyprus', iso3: 'CYP', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'slate', launch_wave: 4, primary_language: 'el', seo_priority_score: 20, units_system: 'metric', driving_side: 'left' },
  IS: { name: 'Iceland', iso3: 'ISL', region: 'Europe', subregion: 'Northern Europe', currency: 'ISK', tier: 'slate', launch_wave: 4, primary_language: 'is', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  LU: { name: 'Luxembourg', iso3: 'LUX', region: 'Europe', subregion: 'Western Europe', currency: 'EUR', tier: 'slate', launch_wave: 4, primary_language: 'fr', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  EC: { name: 'Ecuador', iso3: 'ECU', region: 'Americas', subregion: 'South America', currency: 'USD', tier: 'slate', launch_wave: 4, primary_language: 'es', seo_priority_score: 20, units_system: 'metric', driving_side: 'right' },
  // Tier E — Copper (41)
  BO: { name: 'Bolivia', iso3: 'BOL', region: 'Americas', subregion: 'South America', currency: 'BOB', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  PY: { name: 'Paraguay', iso3: 'PRY', region: 'Americas', subregion: 'South America', currency: 'PYG', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  GT: { name: 'Guatemala', iso3: 'GTM', region: 'Americas', subregion: 'Central America', currency: 'GTQ', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  DO: { name: 'Dominican Republic', iso3: 'DOM', region: 'Americas', subregion: 'Caribbean', currency: 'DOP', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  HN: { name: 'Honduras', iso3: 'HND', region: 'Americas', subregion: 'Central America', currency: 'HNL', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  SV: { name: 'El Salvador', iso3: 'SLV', region: 'Americas', subregion: 'Central America', currency: 'USD', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  NI: { name: 'Nicaragua', iso3: 'NIC', region: 'Americas', subregion: 'Central America', currency: 'NIO', tier: 'copper', launch_wave: 5, primary_language: 'es', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  JM: { name: 'Jamaica', iso3: 'JAM', region: 'Americas', subregion: 'Caribbean', currency: 'JMD', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  GY: { name: 'Guyana', iso3: 'GUY', region: 'Americas', subregion: 'South America', currency: 'GYD', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  SR: { name: 'Suriname', iso3: 'SUR', region: 'Americas', subregion: 'South America', currency: 'SRD', tier: 'copper', launch_wave: 5, primary_language: 'nl', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  BA: { name: 'Bosnia and Herzegovina', iso3: 'BIH', region: 'Europe', subregion: 'Southern Europe', currency: 'BAM', tier: 'copper', launch_wave: 5, primary_language: 'bs', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  ME: { name: 'Montenegro', iso3: 'MNE', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'copper', launch_wave: 5, primary_language: 'sr', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  MK: { name: 'North Macedonia', iso3: 'MKD', region: 'Europe', subregion: 'Southern Europe', currency: 'MKD', tier: 'copper', launch_wave: 5, primary_language: 'mk', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  AL: { name: 'Albania', iso3: 'ALB', region: 'Europe', subregion: 'Southern Europe', currency: 'ALL', tier: 'copper', launch_wave: 5, primary_language: 'sq', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  MD: { name: 'Moldova', iso3: 'MDA', region: 'Europe', subregion: 'Eastern Europe', currency: 'MDL', tier: 'copper', launch_wave: 5, primary_language: 'ro', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  IQ: { name: 'Iraq', iso3: 'IRQ', region: 'Asia', subregion: 'Western Asia', currency: 'IQD', tier: 'copper', launch_wave: 5, primary_language: 'ar', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  NA: { name: 'Namibia', iso3: 'NAM', region: 'Africa', subregion: 'Southern Africa', currency: 'NAD', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 15, units_system: 'metric', driving_side: 'left' },
  AO: { name: 'Angola', iso3: 'AGO', region: 'Africa', subregion: 'Middle Africa', currency: 'AOA', tier: 'copper', launch_wave: 5, primary_language: 'pt', seo_priority_score: 15, units_system: 'metric', driving_side: 'right' },
  MZ: { name: 'Mozambique', iso3: 'MOZ', region: 'Africa', subregion: 'Eastern Africa', currency: 'MZN', tier: 'copper', launch_wave: 5, primary_language: 'pt', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  ET: { name: 'Ethiopia', iso3: 'ETH', region: 'Africa', subregion: 'Eastern Africa', currency: 'ETB', tier: 'copper', launch_wave: 5, primary_language: 'am', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  CI: { name: 'Ivory Coast', iso3: 'CIV', region: 'Africa', subregion: 'Western Africa', currency: 'XOF', tier: 'copper', launch_wave: 5, primary_language: 'fr', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  SN: { name: 'Senegal', iso3: 'SEN', region: 'Africa', subregion: 'Western Africa', currency: 'XOF', tier: 'copper', launch_wave: 5, primary_language: 'fr', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  BW: { name: 'Botswana', iso3: 'BWA', region: 'Africa', subregion: 'Southern Africa', currency: 'BWP', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  ZM: { name: 'Zambia', iso3: 'ZMB', region: 'Africa', subregion: 'Eastern Africa', currency: 'ZMW', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  UG: { name: 'Uganda', iso3: 'UGA', region: 'Africa', subregion: 'Eastern Africa', currency: 'UGX', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  CM: { name: 'Cameroon', iso3: 'CMR', region: 'Africa', subregion: 'Middle Africa', currency: 'XAF', tier: 'copper', launch_wave: 5, primary_language: 'fr', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  KH: { name: 'Cambodia', iso3: 'KHM', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'KHR', tier: 'copper', launch_wave: 5, primary_language: 'km', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  LK: { name: 'Sri Lanka', iso3: 'LKA', region: 'Asia', subregion: 'Southern Asia', currency: 'LKR', tier: 'copper', launch_wave: 5, primary_language: 'si', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  UZ: { name: 'Uzbekistan', iso3: 'UZB', region: 'Asia', subregion: 'Central Asia', currency: 'UZS', tier: 'copper', launch_wave: 5, primary_language: 'uz', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  LA: { name: 'Laos', iso3: 'LAO', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'LAK', tier: 'copper', launch_wave: 5, primary_language: 'lo', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  NP: { name: 'Nepal', iso3: 'NPL', region: 'Asia', subregion: 'Southern Asia', currency: 'NPR', tier: 'copper', launch_wave: 5, primary_language: 'ne', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  DZ: { name: 'Algeria', iso3: 'DZA', region: 'Africa', subregion: 'Northern Africa', currency: 'DZD', tier: 'copper', launch_wave: 5, primary_language: 'ar', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  TN: { name: 'Tunisia', iso3: 'TUN', region: 'Africa', subregion: 'Northern Africa', currency: 'TND', tier: 'copper', launch_wave: 5, primary_language: 'ar', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  MT: { name: 'Malta', iso3: 'MLT', region: 'Europe', subregion: 'Southern Europe', currency: 'EUR', tier: 'copper', launch_wave: 5, primary_language: 'mt', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  BN: { name: 'Brunei', iso3: 'BRN', region: 'Asia', subregion: 'South-Eastern Asia', currency: 'BND', tier: 'copper', launch_wave: 5, primary_language: 'ms', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  RW: { name: 'Rwanda', iso3: 'RWA', region: 'Africa', subregion: 'Eastern Africa', currency: 'RWF', tier: 'copper', launch_wave: 5, primary_language: 'rw', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  MG: { name: 'Madagascar', iso3: 'MDG', region: 'Africa', subregion: 'Eastern Africa', currency: 'MGA', tier: 'copper', launch_wave: 5, primary_language: 'mg', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  PG: { name: 'Papua New Guinea', iso3: 'PNG', region: 'Oceania', subregion: 'Melanesia', currency: 'PGK', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
  TM: { name: 'Turkmenistan', iso3: 'TKM', region: 'Asia', subregion: 'Central Asia', currency: 'TMT', tier: 'copper', launch_wave: 5, primary_language: 'tk', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  KG: { name: 'Kyrgyzstan', iso3: 'KGZ', region: 'Asia', subregion: 'Central Asia', currency: 'KGS', tier: 'copper', launch_wave: 5, primary_language: 'ky', seo_priority_score: 10, units_system: 'metric', driving_side: 'right' },
  MW: { name: 'Malawi', iso3: 'MWI', region: 'Africa', subregion: 'Eastern Africa', currency: 'MWK', tier: 'copper', launch_wave: 5, primary_language: 'en', seo_priority_score: 10, units_system: 'metric', driving_side: 'left' },
};

async function main() {
  // Get existing countries
  const { data: existing } = await sb.from('global_countries').select('iso2');
  const existingSet = new Set((existing ?? []).map((r: any) => r.iso2));
  console.log(`Existing countries: ${existingSet.size}`);

  // Build rows for missing countries
  const missing: any[] = [];
  for (const [iso2, info] of Object.entries(ALL_COUNTRIES)) {
    if (existingSet.has(iso2)) continue;
    missing.push({
      name: info.name,
      slug: info.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      iso2,
      iso3: info.iso3,
      region: info.region,
      subregion: info.subregion,
      currency: info.currency,
      tier: info.tier,
      status: 'active',
      launch_wave: info.launch_wave,
      activation_phase: info.launch_wave <= 2 ? 'planned' : 'monitor',
      primary_language: info.primary_language,
      seo_priority_score: info.seo_priority_score,
      is_active_market: false,
      units_system: info.units_system,
      market_mode: 'emerging_market',
      market_priority_score: info.seo_priority_score,
      launch_status: 'seeded',
      target_country_enabled: true,
      currency_code: 'USD',
      measurement_system: 'imperial',
      driving_side: info.driving_side,
    });
  }

  console.log(`Missing countries to insert: ${missing.length}`);

  if (missing.length === 0) {
    console.log('✅ All 120 countries already seeded.');
    return;
  }

  // Insert in batches of 20 to avoid timeouts
  const BATCH = 20;
  let inserted = 0;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const { error } = await sb.from('global_countries').insert(batch);
    if (error) {
      console.error(`❌ Batch ${i / BATCH + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${i / BATCH + 1}: Inserted ${batch.length} countries (${inserted}/${missing.length})`);
    }
  }

  // Verify
  const { count } = await sb.from('global_countries').select('id', { count: 'exact', head: true });
  console.log(`\n🌍 global_countries now has ${count} rows`);
}

main().catch(console.error);
