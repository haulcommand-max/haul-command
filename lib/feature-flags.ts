// ============================================================
// Haul Command — Feature Flags
// Central registry for all non-core integrations.
// Every external service lives behind a flag.
// Core services (Supabase, Firebase, Vercel, GitHub) are always on.
// Global-by-default: flags apply to all 57 countries unless overridden.
// ============================================================

export type FeatureFlagKey =
  // ── ACTIVE INTEGRATIONS ──
  | 'HERE_MAPS'
  | 'OVERPASS_OSM'
  | 'TRACCAR'
  | 'LANGFUSE'
  | 'TRIGGER_DEV'
  | 'INFISICAL'
  | 'DUB'
  | 'TWENTY_CRM'
  | 'LISTMONK'
  | 'VAPI'
  | 'FLY_IO'
  // ── SEARCH ──
  | 'TYPESENSE'
  // ── LOCALIZATION / COMMS INFRA ──
  | 'TOLGEE'
  | 'TELNYX'
  // ── SCAFFOLDED BUT DISABLED ──
  | 'DOCUMENSO'
  | 'LAGO'
  // ── ANALYTICS / MONITORING ──
  | 'POSTHOG'
  | 'SENTRY'
  | 'GOOGLE_ANALYTICS'
  // ── PAYMENTS ──
  | 'STRIPE'
  | 'NOWPAYMENTS'
  // ── COMMS ──
  | 'LIVEKIT'
  | 'NOVU'
  | 'RESEND'
  | 'BREVO_SMTP';

interface FlagConfig {
  envKey: string;          // env var that enables this flag (truthy = on)
  fallback: boolean;       // default state when env var is missing
  description: string;
  requiredEnvVars: string[]; // env vars needed for the integration to actually work
}

const FLAG_REGISTRY: Record<FeatureFlagKey, FlagConfig> = {
  // ── ACTIVE INTEGRATIONS ──
  HERE_MAPS: {
    envKey: 'FEATURE_HERE_MAPS',
    fallback: true,
    description: 'HERE Maps — routing, geocoding, distance calculation',
    requiredEnvVars: ['HERE_API_KEY'],
  },
  OVERPASS_OSM: {
    envKey: 'FEATURE_OVERPASS_OSM',
    fallback: true,
    description: 'Overpass / OpenStreetMap — infrastructure harvesting',
    requiredEnvVars: [], // Overpass is free, no key required
  },
  TRACCAR: {
    envKey: 'FEATURE_TRACCAR',
    fallback: true,
    description: 'Traccar — GPS telematics, tracking, geofences',
    requiredEnvVars: ['TRACCAR_API_URL', 'TRACCAR_API_TOKEN'],
  },
  LANGFUSE: {
    envKey: 'FEATURE_LANGFUSE',
    fallback: true,
    description: 'Langfuse — LLM observability, prompt tracing, evaluations',
    requiredEnvVars: ['LANGFUSE_SECRET_KEY', 'LANGFUSE_PUBLIC_KEY'],
  },
  TRIGGER_DEV: {
    envKey: 'FEATURE_TRIGGER_DEV',
    fallback: true,
    description: 'Trigger.dev — background job orchestration',
    requiredEnvVars: ['TRIGGER_API_KEY'],
  },
  INFISICAL: {
    envKey: 'FEATURE_INFISICAL',
    fallback: false, // opt-in — falls back to process.env
    description: 'Infisical — secrets management and rotation',
    requiredEnvVars: ['INFISICAL_TOKEN'],
  },
  DUB: {
    envKey: 'FEATURE_DUB',
    fallback: true,
    description: 'Dub.co — short links, QR codes, attribution tracking',
    requiredEnvVars: ['DUB_API_KEY'],
  },
  TWENTY_CRM: {
    envKey: 'FEATURE_TWENTY_CRM',
    fallback: true,
    description: 'Twenty CRM — internal ops/relationship management spine',
    requiredEnvVars: ['TWENTY_API_URL', 'TWENTY_API_KEY'],
  },
  LISTMONK: {
    envKey: 'FEATURE_LISTMONK',
    fallback: true,
    description: 'Listmonk — email campaigns, newsletters, list management',
    requiredEnvVars: ['LISTMONK_URL', 'LISTMONK_API_PASSWORD'],
  },
  VAPI: {
    envKey: 'FEATURE_VAPI',
    fallback: true,
    description: 'Vapi — AI voice agents, call workflows',
    requiredEnvVars: ['VAPI_PRIVATE_API_KEY'],
  },
  FLY_IO: {
    envKey: 'FEATURE_FLY_IO',
    fallback: false, // needs manual setup first
    description: 'Fly.io — workers, agents, background compute',
    requiredEnvVars: ['FLY_API_TOKEN'],
  },

  // ── SEARCH ──
  TYPESENSE: {
    envKey: 'FEATURE_TYPESENSE',
    fallback: true,
    description: 'Typesense — instant search, typo-tolerance, geo-search',
    requiredEnvVars: ['TYPESENSE_API_KEY'],
  },

  // ── LOCALIZATION / COMMS INFRA ──
  TOLGEE: {
    envKey: 'FEATURE_TOLGEE',
    fallback: true,
    description: 'Tolgee — i18n and localization for 57-country expansion',
    requiredEnvVars: ['TOLGEE_API_KEY'],
  },
  TELNYX: {
    envKey: 'FEATURE_TELNYX',
    fallback: true,
    description: 'Telnyx — local phone numbers, SMS, voice routing',
    requiredEnvVars: ['TELNYX_API_KEY'],
  },

  // ── SCAFFOLDED BUT DISABLED ──
  DOCUMENSO: {
    envKey: 'FEATURE_DOCUMENSO',
    fallback: false,
    description: 'Documenso — digital signatures (disabled, scaffold only)',
    requiredEnvVars: ['DOCUMENSO_API_KEY'],
  },
  LAGO: {
    envKey: 'FEATURE_LAGO',
    fallback: false,
    description: 'Lago — usage-based billing (disabled, scaffold only)',
    requiredEnvVars: ['LAGO_API_KEY'],
  },

  // ── ANALYTICS / MONITORING ──
  POSTHOG: {
    envKey: 'FEATURE_POSTHOG',
    fallback: true,
    description: 'PostHog — product analytics',
    requiredEnvVars: ['NEXT_PUBLIC_POSTHOG_KEY'],
  },
  SENTRY: {
    envKey: 'FEATURE_SENTRY',
    fallback: true,
    description: 'Sentry — error tracking',
    requiredEnvVars: ['SENTRY_DSN'],
  },
  GOOGLE_ANALYTICS: {
    envKey: 'FEATURE_GOOGLE_ANALYTICS',
    fallback: false,
    description: 'Google Analytics 4',
    requiredEnvVars: ['NEXT_PUBLIC_GA_ID'],
  },

  // ── PAYMENTS ──
  STRIPE: {
    envKey: 'FEATURE_STRIPE',
    fallback: true,
    description: 'Stripe — payment processing',
    requiredEnvVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  },
  NOWPAYMENTS: {
    envKey: 'FEATURE_NOWPAYMENTS',
    fallback: true,
    description: 'NOWPayments — crypto payments',
    requiredEnvVars: ['NOWPAYMENTS_API_KEY'],
  },

  // ── COMMS ──
  LIVEKIT: {
    envKey: 'FEATURE_LIVEKIT',
    fallback: false,
    description: 'LiveKit — push-to-talk, real-time comms',
    requiredEnvVars: ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'],
  },
  NOVU: {
    envKey: 'FEATURE_NOVU',
    fallback: false,
    description: 'Novu — notification infrastructure',
    requiredEnvVars: ['NOVU_API_KEY'],
  },
  RESEND: {
    envKey: 'FEATURE_RESEND',
    fallback: false,
    description: 'Resend — transactional email',
    requiredEnvVars: ['RESEND_API_KEY'],
  },
  BREVO_SMTP: {
    envKey: 'FEATURE_BREVO_SMTP',
    fallback: false,
    description: 'Brevo SMTP — email relay',
    requiredEnvVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
  },
};

// ── Public API ──

/**
 * Check if a feature flag is enabled.
 * A flag is enabled when:
 *   1. Its env var is set to a truthy value ('true', '1', 'yes', 'on'), OR
 *   2. Its env var is missing AND the fallback is true, AND
 *   3. All required env vars are present (non-empty)
 */
export function isEnabled(flag: FeatureFlagKey): boolean {
  const config = FLAG_REGISTRY[flag];
  if (!config) return false;

  const envValue = process.env[config.envKey];

  // Explicit disable always wins
  if (envValue === 'false' || envValue === '0' || envValue === 'no' || envValue === 'off') {
    return false;
  }

  // Explicit enable
  if (envValue === 'true' || envValue === '1' || envValue === 'yes' || envValue === 'on') {
    return config.requiredEnvVars.every(k => !!process.env[k]);
  }

  // Fallback: check if required env vars are present
  if (config.fallback) {
    return config.requiredEnvVars.every(k => !!process.env[k]);
  }

  return false;
}

/**
 * Get the config for a feature flag (for diagnostics).
 */
export function getFlagConfig(flag: FeatureFlagKey): FlagConfig {
  return FLAG_REGISTRY[flag];
}

/**
 * List all flags with their current status (for admin/debug panels).
 */
export function getAllFlags(): Record<FeatureFlagKey, { enabled: boolean; config: FlagConfig }> {
  const result = {} as Record<FeatureFlagKey, { enabled: boolean; config: FlagConfig }>;
  for (const key of Object.keys(FLAG_REGISTRY) as FeatureFlagKey[]) {
    result[key] = { enabled: isEnabled(key), config: FLAG_REGISTRY[key] };
  }
  return result;
}

/**
 * Guard wrapper: execute a function only if the flag is enabled.
 * Returns null if disabled.
 */
export async function guarded<T>(
  flag: FeatureFlagKey,
  fn: () => Promise<T>
): Promise<T | null> {
  if (!isEnabled(flag)) {
    return null;
  }
  return fn();
}

/**
 * Country-aware flag check.
 * Some integrations have per-country overrides:
 *   FEATURE_HERE_MAPS_US=false  → disables HERE Maps for US only
 * Falls back to the global flag if no country override exists.
 */
export function isEnabledForCountry(flag: FeatureFlagKey, countryCode: string): boolean {
  // Check country-specific override first
  const countryEnv = process.env[`FEATURE_${flag}_${countryCode.toUpperCase()}`];
  if (countryEnv === 'false' || countryEnv === '0') return false;
  if (countryEnv === 'true' || countryEnv === '1') return true;
  // Fall back to global flag
  return isEnabled(flag);
}

/**
 * Get all countries where a flag is active.
 * Useful for admin dashboards showing per-country tool activation.
 */
export function getActiveCountries(flag: FeatureFlagKey, countryCodes: string[]): string[] {
  return countryCodes.filter(cc => isEnabledForCountry(flag, cc));
}
