/**
 * Haul Command — Glossary Slug System
 *
 * Canonical slug normalization, alias resolution, and country slug mapping
 * for the topic-first, country-second glossary architecture.
 *
 * Rules:
 * - All slugs use hyphens, lowercase
 * - Underscores normalize to hyphens
 * - Internal IDs are never exposed in URLs
 * - Country slugs use full readable names in glossary URLs
 */

// ─── Country Slug Mapping (ISO2 ↔ Full Name) ────────────────────
// Glossary URLs use full country names for SEO readability.
// The rest of the site uses ISO2 slugs — this mapping bridges them.

export const COUNTRY_SLUG_MAP: Record<string, string> = {
  // Tier A — Gold
  us: 'united-states', ca: 'canada', au: 'australia', gb: 'united-kingdom',
  nz: 'new-zealand', za: 'south-africa', de: 'germany', nl: 'netherlands',
  ae: 'united-arab-emirates', br: 'brazil',
  // Tier B — Blue
  ie: 'ireland', se: 'sweden', no: 'norway', dk: 'denmark', fi: 'finland',
  be: 'belgium', at: 'austria', ch: 'switzerland', es: 'spain', fr: 'france',
  it: 'italy', pt: 'portugal', sa: 'saudi-arabia', qa: 'qatar', mx: 'mexico',
  in: 'india', id: 'indonesia', th: 'thailand',
  // Tier C — Silver
  pl: 'poland', cz: 'czech-republic', sk: 'slovakia', hu: 'hungary', si: 'slovenia',
  ee: 'estonia', lv: 'latvia', lt: 'lithuania', hr: 'croatia', ro: 'romania',
  bg: 'bulgaria', gr: 'greece', tr: 'turkey', kw: 'kuwait', om: 'oman',
  bh: 'bahrain', sg: 'singapore', my: 'malaysia', jp: 'japan', kr: 'south-korea',
  cl: 'chile', ar: 'argentina', co: 'colombia', pe: 'peru', vn: 'vietnam',
  ph: 'philippines',
  // Tier D — Slate
  uy: 'uruguay', pa: 'panama', cr: 'costa-rica', il: 'israel', ng: 'nigeria',
  eg: 'egypt', ke: 'kenya', ma: 'morocco', rs: 'serbia', ua: 'ukraine',
  kz: 'kazakhstan', tw: 'taiwan', pk: 'pakistan', bd: 'bangladesh', mn: 'mongolia',
  tt: 'trinidad-and-tobago', jo: 'jordan', gh: 'ghana', tz: 'tanzania',
  ge: 'georgia', az: 'azerbaijan', cy: 'cyprus', is: 'iceland', lu: 'luxembourg',
  ec: 'ecuador',
  // Tier E — Copper
  bo: 'bolivia', py: 'paraguay', gt: 'guatemala', do: 'dominican-republic',
  hn: 'honduras', sv: 'el-salvador', ni: 'nicaragua', jm: 'jamaica',
  gy: 'guyana', sr: 'suriname', ba: 'bosnia-and-herzegovina', me: 'montenegro',
  mk: 'north-macedonia', al: 'albania', md: 'moldova', iq: 'iraq',
  na: 'namibia', ao: 'angola', mz: 'mozambique', et: 'ethiopia',
  ci: 'ivory-coast', sn: 'senegal', bw: 'botswana', zm: 'zambia',
  ug: 'uganda', cm: 'cameroon', kh: 'cambodia', lk: 'sri-lanka',
  uz: 'uzbekistan', la: 'laos', np: 'nepal', dz: 'algeria', tn: 'tunisia',
  mt: 'malta', bn: 'brunei', rw: 'rwanda', mg: 'madagascar',
  pg: 'papua-new-guinea', tm: 'turkmenistan', kg: 'kyrgyzstan', mw: 'malawi',
};

// Reverse map: full-name → ISO2
const REVERSE_COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_SLUG_MAP).map(([iso, full]) => [full, iso])
);

/**
 * Resolve a country slug (ISO2 or full name) to the ISO2 code.
 * Returns undefined if not found.
 */
export function resolveCountrySlug(input: string): string | undefined {
  if (!input) return undefined;
  const lower = input.toLowerCase();
  // Direct ISO2 match
  if (COUNTRY_SLUG_MAP[lower]) return lower;
  // Full name match
  if (REVERSE_COUNTRY_MAP[lower]) return REVERSE_COUNTRY_MAP[lower];
  return undefined;
}

/**
 * Get the canonical full-name slug for a country.
 */
export function getCanonicalCountrySlug(isoOrFull: string): string | undefined {
  const iso = resolveCountrySlug(isoOrFull);
  if (!iso) return undefined;
  return COUNTRY_SLUG_MAP[iso];
}

/**
 * Get the display name for a country from any slug format.
 */
export function getCountryDisplayName(isoOrFull: string): string | undefined {
  const fullSlug = getCanonicalCountrySlug(isoOrFull);
  if (!fullSlug) return undefined;
  return fullSlug
    .split('-')
    .map(w => {
      // Handle 'and', 'of' etc.
      if (['and', 'of', 'the'].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

// ─── Term Slug Normalization ─────────────────────────────────────

/**
 * Normalize any term identifier into a canonical URL slug.
 *
 * Handles:
 * - underscore_to_hyphen: pilot_car → pilot-car
 * - camelCase split: pilotCar → pilot-car
 * - multiple hyphens collapse: pilot--car → pilot-car
 * - trim and lowercase
 */
export function normalizeTermSlug(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/_/g, '-')           // underscores → hyphens
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase split
    .replace(/[^a-z0-9-]/g, '-') // remove non-alphanumeric
    .replace(/-+/g, '-')         // collapse multiple hyphens
    .replace(/^-|-$/g, '');      // trim leading/trailing hyphens
}

/**
 * Check if a slug is already in canonical form.
 */
export function isCanonicalSlug(slug: string): boolean {
  return slug === normalizeTermSlug(slug);
}

// ─── Known Alias Redirects ──────────────────────────────────────
// Common misspellings, jammed words, and legacy slugs that should
// 301 to the canonical form.

export const TERM_ALIAS_MAP: Record<string, string> = {
  // Jammed words
  'pilotcar': 'pilot-car',
  'escortvehicle': 'escort-vehicle',
  'oversizeload': 'oversize-load',
  'oversizedload': 'oversize-load',
  'overweightload': 'overweight-load',
  'wideload': 'wide-load',
  'superload': 'superload', // canonical, no change
  'heightpole': 'height-pole',
  'highpole': 'height-pole',
  'routesurvey': 'route-survey',
  'bridgeformula': 'bridge-formula',
  'deadhead': 'deadhead', // canonical
  'bridgestrike': 'bridge-strike',
  'buckettruck': 'bucket-truck',
  // Legacy underscore IDs
  'pilot_car': 'pilot-car',
  'escort_vehicle': 'escort-vehicle',
  'oversize_load': 'oversize-load',
  'overweight_load': 'overweight-load',
  'wide_load': 'wide-load',
  'height_pole': 'height-pole',
  'route_survey': 'route-survey',
  'bridge_formula': 'bridge-formula',
  'bridge_strike': 'bridge-strike',
  'bucket_truck': 'bucket-truck',
  'lead_car_driver': 'lead-car-driver',
  'chase_car_driver': 'chase-car-driver',
  'single_trip_permit': 'single-trip-permit',
  'annual_permit': 'annual-permit',
  'superload_permit': 'superload-permit',
  'oversize_banner': 'oversize-banner',
  'amber_light': 'amber-light',
  'cb_radio': 'cb-radio',
  'pre_trip_meeting': 'pre-trip-meeting',
  'chain_of_responsibility': 'chain-of-responsibility',
  'convoi_exceptionnel': 'convoi-exceptionnel',
  'indivisible_load': 'indivisible-load',
};

/**
 * Resolve a term slug — handles aliases, underscores, and jammed words.
 * Returns the canonical slug.
 */
export function resolveTermSlug(input: string): string {
  const normalized = normalizeTermSlug(input);
  // Check alias map first (handles jammed words and legacy IDs)
  if (TERM_ALIAS_MAP[input]) return TERM_ALIAS_MAP[input];
  if (TERM_ALIAS_MAP[normalized]) return TERM_ALIAS_MAP[normalized];
  return normalized;
}
