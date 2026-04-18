/**
 * lib/geo/state-names.ts
 *
 * Canonical US state name mapping.
 * Used across directory, profiles, and SEO surfaces to render
 * full, authoritative state names instead of ugly 2-letter codes.
 *
 * P0 FIX: "Tx" → "Texas", "Ca" → "California" in all user-facing text.
 */

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

const CA_PROVINCES: Record<string, string> = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba',
  NB: 'New Brunswick', NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut',
  ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

const AU_STATES: Record<string, string> = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland',
  SA: 'South Australia', WA: 'Western Australia', TAS: 'Tasmania',
  NT: 'Northern Territory', ACT: 'Australian Capital Territory',
};

const ALL_REGIONS = { ...US_STATES, ...CA_PROVINCES, ...AU_STATES };

/**
 * Convert a 2-letter (or 3-letter for AU) state/province code
 * to its full, authoritative name.
 *
 * @param code  - "TX", "tx", "Tx", "CA", "FL", etc.
 * @param fallbackToTitleCase - If true and code isn't recognized,
 *        returns title-cased version instead of raw code.
 * @returns "Texas", "California", "Florida", etc.
 */
export function stateFullName(
  code: string | null | undefined,
  fallbackToTitleCase = true
): string {
  if (!code) return 'National';
  const normalized = code.trim().toUpperCase();
  const match = ALL_REGIONS[normalized];
  if (match) return match;

  // If it's already a full name (e.g., "Texas"), return as-is
  if (code.length > 3) return code;

  // Fallback: title-case the code if requested
  if (fallbackToTitleCase) {
    return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
  }
  return code;
}

/**
 * Convert a country code to its full name.
 */
export function countryFullName(code: string | null | undefined): string {
  if (!code) return '';
  const map: Record<string, string> = {
    US: 'United States', CA: 'Canada', AU: 'Australia',
    GB: 'United Kingdom', MX: 'Mexico', NZ: 'New Zealand',
    DE: 'Germany', FR: 'France', ZA: 'South Africa',
    BR: 'Brazil', IN: 'India', AE: 'United Arab Emirates',
  };
  return map[code.toUpperCase()] ?? code.toUpperCase();
}

export { US_STATES, CA_PROVINCES, AU_STATES };
