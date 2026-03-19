/**
 * Haul Command — 57 Country Tier System
 *
 * Tier A (Gold):  Highest operator density, most mature markets, highest monetization potential
 * Tier B (Blue):  Strong markets with growing operator bases, emerging monetization
 * Tier C (Silver): Developing markets with moderate operator activity
 * Tier D (Slate):  Early-stage markets, opportunity for first-mover advantage
 */

export type CountryTier = 'A' | 'B' | 'C' | 'D';

export interface CountryConfig {
    code: string;        // ISO 3166-1 alpha-2
    name: string;
    tier: CountryTier;
    flag: string;
    tierLabel: string;   // Gold, Blue, Silver, Slate
    tierColor: string;   // CSS color
}

export const COUNTRY_TIERS: Record<CountryTier, { label: string; color: string; bgColor: string; count: number }> = {
    A: { label: 'Gold',   color: '#c6923a', bgColor: 'rgba(198,146,58,0.15)', count: 10 },
    B: { label: 'Blue',   color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', count: 18 },
    C: { label: 'Silver', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)', count: 26 },
    D: { label: 'Slate',  color: '#64748b', bgColor: 'rgba(100,116,139,0.15)', count: 3 },
};

export const COUNTRIES: CountryConfig[] = [
    // ── Tier A — Gold (10) ────────────────────────────────────────────
    { code: 'US', name: 'United States',        tier: 'A', flag: '🇺🇸', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'CA', name: 'Canada',               tier: 'A', flag: '🇨🇦', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'AU', name: 'Australia',             tier: 'A', flag: '🇦🇺', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'GB', name: 'United Kingdom',        tier: 'A', flag: '🇬🇧', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'NZ', name: 'New Zealand',           tier: 'A', flag: '🇳🇿', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'ZA', name: 'South Africa',          tier: 'A', flag: '🇿🇦', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'DE', name: 'Germany',               tier: 'A', flag: '🇩🇪', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'NL', name: 'Netherlands',           tier: 'A', flag: '🇳🇱', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'AE', name: 'United Arab Emirates',  tier: 'A', flag: '🇦🇪', tierLabel: 'Gold',   tierColor: '#c6923a' },
    { code: 'BR', name: 'Brazil',               tier: 'A', flag: '🇧🇷', tierLabel: 'Gold',   tierColor: '#c6923a' },

    // ── Tier B — Blue (18) ────────────────────────────────────────────
    { code: 'IE', name: 'Ireland',               tier: 'B', flag: '🇮🇪', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'SE', name: 'Sweden',                tier: 'B', flag: '🇸🇪', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'NO', name: 'Norway',                tier: 'B', flag: '🇳🇴', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'DK', name: 'Denmark',               tier: 'B', flag: '🇩🇰', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'FI', name: 'Finland',               tier: 'B', flag: '🇫🇮', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'BE', name: 'Belgium',               tier: 'B', flag: '🇧🇪', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'AT', name: 'Austria',               tier: 'B', flag: '🇦🇹', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'CH', name: 'Switzerland',           tier: 'B', flag: '🇨🇭', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'ES', name: 'Spain',                 tier: 'B', flag: '🇪🇸', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'FR', name: 'France',                tier: 'B', flag: '🇫🇷', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'IT', name: 'Italy',                 tier: 'B', flag: '🇮🇹', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'PT', name: 'Portugal',              tier: 'B', flag: '🇵🇹', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'SA', name: 'Saudi Arabia',          tier: 'B', flag: '🇸🇦', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'QA', name: 'Qatar',                 tier: 'B', flag: '🇶🇦', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'MX', name: 'Mexico',                tier: 'B', flag: '🇲🇽', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'IN', name: 'India',                 tier: 'B', flag: '🇮🇳', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'ID', name: 'Indonesia',             tier: 'B', flag: '🇮🇩', tierLabel: 'Blue',   tierColor: '#3b82f6' },
    { code: 'TH', name: 'Thailand',              tier: 'B', flag: '🇹🇭', tierLabel: 'Blue',   tierColor: '#3b82f6' },

    // ── Tier C — Silver (26) ──────────────────────────────────────────
    { code: 'PL', name: 'Poland',                tier: 'C', flag: '🇵🇱', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'CZ', name: 'Czech Republic',        tier: 'C', flag: '🇨🇿', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'SK', name: 'Slovakia',              tier: 'C', flag: '🇸🇰', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'HU', name: 'Hungary',               tier: 'C', flag: '🇭🇺', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'SI', name: 'Slovenia',              tier: 'C', flag: '🇸🇮', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'EE', name: 'Estonia',               tier: 'C', flag: '🇪🇪', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'LV', name: 'Latvia',                tier: 'C', flag: '🇱🇻', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'LT', name: 'Lithuania',             tier: 'C', flag: '🇱🇹', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'HR', name: 'Croatia',               tier: 'C', flag: '🇭🇷', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'RO', name: 'Romania',               tier: 'C', flag: '🇷🇴', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'BG', name: 'Bulgaria',              tier: 'C', flag: '🇧🇬', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'GR', name: 'Greece',                tier: 'C', flag: '🇬🇷', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'TR', name: 'Turkey',                tier: 'C', flag: '🇹🇷', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'KW', name: 'Kuwait',                tier: 'C', flag: '🇰🇼', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'OM', name: 'Oman',                  tier: 'C', flag: '🇴🇲', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'BH', name: 'Bahrain',               tier: 'C', flag: '🇧🇭', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'SG', name: 'Singapore',             tier: 'C', flag: '🇸🇬', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'MY', name: 'Malaysia',              tier: 'C', flag: '🇲🇾', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'JP', name: 'Japan',                 tier: 'C', flag: '🇯🇵', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'KR', name: 'South Korea',           tier: 'C', flag: '🇰🇷', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'CL', name: 'Chile',                 tier: 'C', flag: '🇨🇱', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'AR', name: 'Argentina',             tier: 'C', flag: '🇦🇷', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'CO', name: 'Colombia',              tier: 'C', flag: '🇨🇴', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'PE', name: 'Peru',                  tier: 'C', flag: '🇵🇪', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'VN', name: 'Vietnam',               tier: 'C', flag: '🇻🇳', tierLabel: 'Silver', tierColor: '#94a3b8' },
    { code: 'PH', name: 'Philippines',           tier: 'C', flag: '🇵🇭', tierLabel: 'Silver', tierColor: '#94a3b8' },

    // ── Tier D — Slate (3) ────────────────────────────────────────────
    { code: 'UY', name: 'Uruguay',               tier: 'D', flag: '🇺🇾', tierLabel: 'Slate',  tierColor: '#64748b' },
    { code: 'PA', name: 'Panama',                tier: 'D', flag: '🇵🇦', tierLabel: 'Slate',  tierColor: '#64748b' },
    { code: 'CR', name: 'Costa Rica',            tier: 'D', flag: '🇨🇷', tierLabel: 'Slate',  tierColor: '#64748b' },
];

// ── Utility functions ─────────────────────────────────────────────

/** Get country config by ISO code */
export function getCountry(code: string): CountryConfig | undefined {
    return COUNTRIES.find(c => c.code === code.toUpperCase());
}

/** Get all countries in a tier */
export function getCountriesByTier(tier: CountryTier): CountryConfig[] {
    return COUNTRIES.filter(c => c.tier === tier);
}

/** Get tier info for a country code */
export function getCountryTier(code: string): CountryTier | undefined {
    return getCountry(code)?.tier;
}

/** Check if a country code is in the 57-country system */
export function isSupported(code: string): boolean {
    return COUNTRIES.some(c => c.code === code.toUpperCase());
}

/** Get country codes as a flat array */
export function getAllCountryCodes(): string[] {
    return COUNTRIES.map(c => c.code);
}

/** Get tier metadata */
export function getTierConfig(tier: CountryTier) {
    return COUNTRY_TIERS[tier];
}
