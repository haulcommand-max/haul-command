/**
 * HC Country Tiers — Canonical 57-Country System
 * 
 * CANONICAL SOURCE OF TRUTH for country tier assignments.
 * This file supersedes any other country lists in the codebase.
 * 
 * Tier A — Gold (10): Premium markets, full feature set, priority support
 * Tier B — Blue (18): Strong markets, full features, standard support  
 * Tier C — Silver (26): Growth markets, core features, community support
 * Tier D — Slate (3): Emerging markets, basic features, self-serve
 */

export type CountryTier = 'gold' | 'blue' | 'silver' | 'slate';

export interface CountryEntry {
  code: string;      // ISO 3166-1 alpha-2
  name: string;
  tier: CountryTier;
  flag: string;      // Emoji flag
  currency: string;  // ISO 4217
  region: string;
}

export const HC_COUNTRY_TIERS: Record<CountryTier, CountryEntry[]> = {
  gold: [
    { code: 'US', name: 'United States', tier: 'gold', flag: '🇺🇸', currency: 'USD', region: 'North America' },
    { code: 'CA', name: 'Canada', tier: 'gold', flag: '🇨🇦', currency: 'CAD', region: 'North America' },
    { code: 'AU', name: 'Australia', tier: 'gold', flag: '🇦🇺', currency: 'AUD', region: 'Oceania' },
    { code: 'GB', name: 'United Kingdom', tier: 'gold', flag: '🇬🇧', currency: 'GBP', region: 'Europe' },
    { code: 'NZ', name: 'New Zealand', tier: 'gold', flag: '🇳🇿', currency: 'NZD', region: 'Oceania' },
    { code: 'ZA', name: 'South Africa', tier: 'gold', flag: '🇿🇦', currency: 'ZAR', region: 'Africa' },
    { code: 'DE', name: 'Germany', tier: 'gold', flag: '🇩🇪', currency: 'EUR', region: 'Europe' },
    { code: 'NL', name: 'Netherlands', tier: 'gold', flag: '🇳🇱', currency: 'EUR', region: 'Europe' },
    { code: 'AE', name: 'United Arab Emirates', tier: 'gold', flag: '🇦🇪', currency: 'AED', region: 'Middle East' },
    { code: 'BR', name: 'Brazil', tier: 'gold', flag: '🇧🇷', currency: 'BRL', region: 'South America' },
  ],
  blue: [
    { code: 'IE', name: 'Ireland', tier: 'blue', flag: '🇮🇪', currency: 'EUR', region: 'Europe' },
    { code: 'SE', name: 'Sweden', tier: 'blue', flag: '🇸🇪', currency: 'SEK', region: 'Europe' },
    { code: 'NO', name: 'Norway', tier: 'blue', flag: '🇳🇴', currency: 'NOK', region: 'Europe' },
    { code: 'DK', name: 'Denmark', tier: 'blue', flag: '🇩🇰', currency: 'DKK', region: 'Europe' },
    { code: 'FI', name: 'Finland', tier: 'blue', flag: '🇫🇮', currency: 'EUR', region: 'Europe' },
    { code: 'BE', name: 'Belgium', tier: 'blue', flag: '🇧🇪', currency: 'EUR', region: 'Europe' },
    { code: 'AT', name: 'Austria', tier: 'blue', flag: '🇦🇹', currency: 'EUR', region: 'Europe' },
    { code: 'CH', name: 'Switzerland', tier: 'blue', flag: '🇨🇭', currency: 'CHF', region: 'Europe' },
    { code: 'ES', name: 'Spain', tier: 'blue', flag: '🇪🇸', currency: 'EUR', region: 'Europe' },
    { code: 'FR', name: 'France', tier: 'blue', flag: '🇫🇷', currency: 'EUR', region: 'Europe' },
    { code: 'IT', name: 'Italy', tier: 'blue', flag: '🇮🇹', currency: 'EUR', region: 'Europe' },
    { code: 'PT', name: 'Portugal', tier: 'blue', flag: '🇵🇹', currency: 'EUR', region: 'Europe' },
    { code: 'SA', name: 'Saudi Arabia', tier: 'blue', flag: '🇸🇦', currency: 'SAR', region: 'Middle East' },
    { code: 'QA', name: 'Qatar', tier: 'blue', flag: '🇶🇦', currency: 'QAR', region: 'Middle East' },
    { code: 'MX', name: 'Mexico', tier: 'blue', flag: '🇲🇽', currency: 'MXN', region: 'North America' },
    { code: 'IN', name: 'India', tier: 'blue', flag: '🇮🇳', currency: 'INR', region: 'Asia' },
    { code: 'ID', name: 'Indonesia', tier: 'blue', flag: '🇮🇩', currency: 'IDR', region: 'Asia' },
    { code: 'TH', name: 'Thailand', tier: 'blue', flag: '🇹🇭', currency: 'THB', region: 'Asia' },
  ],
  silver: [
    { code: 'PL', name: 'Poland', tier: 'silver', flag: '🇵🇱', currency: 'PLN', region: 'Europe' },
    { code: 'CZ', name: 'Czech Republic', tier: 'silver', flag: '🇨🇿', currency: 'CZK', region: 'Europe' },
    { code: 'SK', name: 'Slovakia', tier: 'silver', flag: '🇸🇰', currency: 'EUR', region: 'Europe' },
    { code: 'HU', name: 'Hungary', tier: 'silver', flag: '🇭🇺', currency: 'HUF', region: 'Europe' },
    { code: 'SI', name: 'Slovenia', tier: 'silver', flag: '🇸🇮', currency: 'EUR', region: 'Europe' },
    { code: 'EE', name: 'Estonia', tier: 'silver', flag: '🇪🇪', currency: 'EUR', region: 'Europe' },
    { code: 'LV', name: 'Latvia', tier: 'silver', flag: '🇱🇻', currency: 'EUR', region: 'Europe' },
    { code: 'LT', name: 'Lithuania', tier: 'silver', flag: '🇱🇹', currency: 'EUR', region: 'Europe' },
    { code: 'HR', name: 'Croatia', tier: 'silver', flag: '🇭🇷', currency: 'EUR', region: 'Europe' },
    { code: 'RO', name: 'Romania', tier: 'silver', flag: '🇷🇴', currency: 'RON', region: 'Europe' },
    { code: 'BG', name: 'Bulgaria', tier: 'silver', flag: '🇧🇬', currency: 'BGN', region: 'Europe' },
    { code: 'GR', name: 'Greece', tier: 'silver', flag: '🇬🇷', currency: 'EUR', region: 'Europe' },
    { code: 'TR', name: 'Turkey', tier: 'silver', flag: '🇹🇷', currency: 'TRY', region: 'Europe/Asia' },
    { code: 'KW', name: 'Kuwait', tier: 'silver', flag: '🇰🇼', currency: 'KWD', region: 'Middle East' },
    { code: 'OM', name: 'Oman', tier: 'silver', flag: '🇴🇲', currency: 'OMR', region: 'Middle East' },
    { code: 'BH', name: 'Bahrain', tier: 'silver', flag: '🇧🇭', currency: 'BHD', region: 'Middle East' },
    { code: 'SG', name: 'Singapore', tier: 'silver', flag: '🇸🇬', currency: 'SGD', region: 'Asia' },
    { code: 'MY', name: 'Malaysia', tier: 'silver', flag: '🇲🇾', currency: 'MYR', region: 'Asia' },
    { code: 'JP', name: 'Japan', tier: 'silver', flag: '🇯🇵', currency: 'JPY', region: 'Asia' },
    { code: 'KR', name: 'South Korea', tier: 'silver', flag: '🇰🇷', currency: 'KRW', region: 'Asia' },
    { code: 'CL', name: 'Chile', tier: 'silver', flag: '🇨🇱', currency: 'CLP', region: 'South America' },
    { code: 'AR', name: 'Argentina', tier: 'silver', flag: '🇦🇷', currency: 'ARS', region: 'South America' },
    { code: 'CO', name: 'Colombia', tier: 'silver', flag: '🇨🇴', currency: 'COP', region: 'South America' },
    { code: 'PE', name: 'Peru', tier: 'silver', flag: '🇵🇪', currency: 'PEN', region: 'South America' },
    { code: 'VN', name: 'Vietnam', tier: 'silver', flag: '🇻🇳', currency: 'VND', region: 'Asia' },
    { code: 'PH', name: 'Philippines', tier: 'silver', flag: '🇵🇭', currency: 'PHP', region: 'Asia' },
  ],
  slate: [
    { code: 'UY', name: 'Uruguay', tier: 'slate', flag: '🇺🇾', currency: 'UYU', region: 'South America' },
    { code: 'PA', name: 'Panama', tier: 'slate', flag: '🇵🇦', currency: 'PAB', region: 'Central America' },
    { code: 'CR', name: 'Costa Rica', tier: 'slate', flag: '🇨🇷', currency: 'CRC', region: 'Central America' },
  ],
} as const;

// ─── HELPERS ──────────────────────────────────────────────────────────

/** Get all 57 countries as a flat array */
export function getAllCountries(): CountryEntry[] {
  return Object.values(HC_COUNTRY_TIERS).flat();
}

/** Look up a country by ISO code */
export function getCountryByCode(code: string): CountryEntry | undefined {
  return getAllCountries().find(c => c.code === code.toUpperCase());
}

/** Get all countries in a specific tier */
export function getCountriesByTier(tier: CountryTier): CountryEntry[] {
  return HC_COUNTRY_TIERS[tier] ?? [];
}

/** Get the tier for a country code */
export function getTierForCountry(code: string): CountryTier | undefined {
  return getCountryByCode(code)?.tier;
}

/** Check if a country is in the HC ecosystem */
export function isHCCountry(code: string): boolean {
  return !!getCountryByCode(code);
}

/** Get country count per tier */
export function getTierCounts(): Record<CountryTier, number> {
  return {
    gold: HC_COUNTRY_TIERS.gold.length,
    blue: HC_COUNTRY_TIERS.blue.length,
    silver: HC_COUNTRY_TIERS.silver.length,
    slate: HC_COUNTRY_TIERS.slate.length,
  };
}
