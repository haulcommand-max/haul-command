/**
 * lib/utils/currency.ts
 * Haul Command global currency + distance utilities.
 *
 * Usage (server + client safe):
 *   formatCurrency(1200, 'USD')          → "$1,200.00"
 *   formatCurrency(1200, 'CAD', 'fr')   → "1 200,00 $ CA"
 *   formatDistance(480, 'mi')            → "480 mi"
 *   formatDistance(480, 'km')            → "772 km"
 *   miToKm(480)                          → 772.49
 *
 * Country → currency/unit mapping:
 *   US  → USD, mi
 *   CA  → CAD, km
 *   AU  → AUD, km
 *   UK  → GBP, km
 *   ZA  → ZAR, km
 */

export type SupportedCurrency = 'USD' | 'CAD' | 'AUD' | 'GBP' | 'ZAR' | 'EUR' | 'NZD' | 'BRL';
export type DistanceUnit = 'mi' | 'km';

// ─── Country defaults ─────────────────────────────────────────────────────────
interface CountryDefaults {
  currency: SupportedCurrency;
  unit: DistanceUnit;
  locale: string;
}

const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  US: { currency: 'USD', unit: 'mi', locale: 'en-US' },
  CA: { currency: 'CAD', unit: 'km', locale: 'en-CA' },
  AU: { currency: 'AUD', unit: 'km', locale: 'en-AU' },
  GB: { currency: 'GBP', unit: 'km', locale: 'en-GB' },
  ZA: { currency: 'ZAR', unit: 'km', locale: 'en-ZA' },
  NZ: { currency: 'NZD', unit: 'km', locale: 'en-NZ' },
  BR: { currency: 'BRL', unit: 'km', locale: 'pt-BR' },
  DE: { currency: 'EUR', unit: 'km', locale: 'de-DE' },
};

export function getCountryDefaults(countryCode?: string | null): CountryDefaults {
  return COUNTRY_DEFAULTS[countryCode?.toUpperCase() ?? 'US'] ?? COUNTRY_DEFAULTS['US'];
}

// ─── Currency formatting ──────────────────────────────────────────────────────
/**
 * Format a value in any supported currency.
 * @param amount    The numeric amount (e.g. 1200.50)
 * @param currency  ISO currency code (default: USD)
 * @param locale    BCP 47 locale string (default: en-US)
 * @param compact   If true, use compact notation: $1.2K
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'USD',
  locale = 'en-US',
  compact = false,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : { minimumFractionDigits: 2 }),
  }).format(amount);
}

/**
 * Format a per-mile or per-km rate with optional dual display.
 * E.g. "$4.50/mi" or "$4.50/mi · CA$6.10/km"
 */
export function formatRate(
  rateUSD: number,
  unit: DistanceUnit = 'mi',
  showSecondary = false,
): string {
  const primary = `${formatCurrency(rateUSD)}/` + unit;
  if (!showSecondary) return primary;
  // Approx: convert USD/mi → CAD/km using rough multiplier (not a live FX call)
  const cadPerKm = (rateUSD / 1.609) * 1.36;
  return `${primary} · ${formatCurrency(cadPerKm, 'CAD', 'en-CA')}/km`;
}

// ─── Distance conversion ──────────────────────────────────────────────────────
const MI_TO_KM = 1.60934;
const KM_TO_MI = 0.621371;

export function miToKm(miles: number): number {
  return Math.round(miles * MI_TO_KM * 100) / 100;
}

export function kmToMi(km: number): number {
  return Math.round(km * KM_TO_MI * 100) / 100;
}

/**
 * Format a distance value for display.
 * @param value  The numeric distance
 * @param unit   'mi' or 'km'
 * @param convertFrom  Provide original unit if you want auto-conversion
 */
export function formatDistance(
  value: number,
  unit: DistanceUnit = 'mi',
  convertFrom?: DistanceUnit,
): string {
  let display = value;
  if (convertFrom && convertFrom !== unit) {
    display = unit === 'km' ? miToKm(value) : kmToMi(value);
  }
  return `${Math.round(display).toLocaleString()} ${unit}`;
}

/**
 * Hook-friendly utility: given a country code, return formatter functions
 * pre-configured with the correct defaults.
 */
export function getCountryFormatters(countryCode?: string | null) {
  const defaults = getCountryDefaults(countryCode);
  return {
    currency: defaults.currency,
    unit: defaults.unit,
    locale: defaults.locale,
    formatMoney: (amount: number, compact = false) =>
      formatCurrency(amount, defaults.currency, defaults.locale, compact),
    formatDist: (value: number, fromUnit?: DistanceUnit) =>
      formatDistance(value, defaults.unit, fromUnit),
  };
}
