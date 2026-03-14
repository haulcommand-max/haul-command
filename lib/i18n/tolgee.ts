// ============================================================
// Tolgee — Localization & i18n for 57-Country Expansion
// The global-by-default tool. Without this, 80%+ of the
// pilot car market is locked out.
// Feature flag: TOLGEE
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

// ── Configuration ──

const TOLGEE_API_URL = () => process.env.TOLGEE_API_URL || 'https://app.tolgee.io';
const TOLGEE_API_KEY = () => process.env.TOLGEE_API_KEY || '';
const TOLGEE_PROJECT_ID = () => process.env.TOLGEE_PROJECT_ID || '';

// ── Types ──

export interface TranslationKey {
  key: string;
  namespace?: string;
  defaultValue?: string;
  description?: string;
  tags?: string[];
}

export interface Translation {
  key: string;
  language: string;
  value: string;
  state: 'UNTRANSLATED' | 'TRANSLATED' | 'REVIEWED';
}

export interface LanguageConfig {
  code: string;         // ISO 639-1
  name: string;
  originalName: string; // name in the language itself
  flagEmoji: string;
  rtl: boolean;
}

// ── Haul Command Language Map ──
// Derived from country-registry.ts languagePrimary values

export const HC_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', originalName: 'English', flagEmoji: '🇺🇸', rtl: false },
  { code: 'de', name: 'German', originalName: 'Deutsch', flagEmoji: '🇩🇪', rtl: false },
  { code: 'fr', name: 'French', originalName: 'Français', flagEmoji: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish', originalName: 'Español', flagEmoji: '🇪🇸', rtl: false },
  { code: 'pt', name: 'Portuguese', originalName: 'Português', flagEmoji: '🇧🇷', rtl: false },
  { code: 'nl', name: 'Dutch', originalName: 'Nederlands', flagEmoji: '🇳🇱', rtl: false },
  { code: 'it', name: 'Italian', originalName: 'Italiano', flagEmoji: '🇮🇹', rtl: false },
  { code: 'ar', name: 'Arabic', originalName: 'العربية', flagEmoji: '🇸🇦', rtl: true },
  { code: 'sv', name: 'Swedish', originalName: 'Svenska', flagEmoji: '🇸🇪', rtl: false },
  { code: 'no', name: 'Norwegian', originalName: 'Norsk', flagEmoji: '🇳🇴', rtl: false },
  { code: 'da', name: 'Danish', originalName: 'Dansk', flagEmoji: '🇩🇰', rtl: false },
  { code: 'fi', name: 'Finnish', originalName: 'Suomi', flagEmoji: '🇫🇮', rtl: false },
  { code: 'pl', name: 'Polish', originalName: 'Polski', flagEmoji: '🇵🇱', rtl: false },
  { code: 'cs', name: 'Czech', originalName: 'Čeština', flagEmoji: '🇨🇿', rtl: false },
  { code: 'hu', name: 'Hungarian', originalName: 'Magyar', flagEmoji: '🇭🇺', rtl: false },
  { code: 'ro', name: 'Romanian', originalName: 'Română', flagEmoji: '🇷🇴', rtl: false },
  { code: 'bg', name: 'Bulgarian', originalName: 'Български', flagEmoji: '🇧🇬', rtl: false },
  { code: 'el', name: 'Greek', originalName: 'Ελληνικά', flagEmoji: '🇬🇷', rtl: false },
  { code: 'tr', name: 'Turkish', originalName: 'Türkçe', flagEmoji: '🇹🇷', rtl: false },
  { code: 'ja', name: 'Japanese', originalName: '日本語', flagEmoji: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', originalName: '한국어', flagEmoji: '🇰🇷', rtl: false },
  { code: 'ms', name: 'Malay', originalName: 'Bahasa Melayu', flagEmoji: '🇲🇾', rtl: false },
  { code: 'hi', name: 'Hindi', originalName: 'हिन्दी', flagEmoji: '🇮🇳', rtl: false },
  { code: 'id', name: 'Indonesian', originalName: 'Bahasa Indonesia', flagEmoji: '🇮🇩', rtl: false },
  { code: 'hr', name: 'Croatian', originalName: 'Hrvatski', flagEmoji: '🇭🇷', rtl: false },
  { code: 'sk', name: 'Slovak', originalName: 'Slovenčina', flagEmoji: '🇸🇰', rtl: false },
  { code: 'sl', name: 'Slovenian', originalName: 'Slovenščina', flagEmoji: '🇸🇮', rtl: false },
  { code: 'et', name: 'Estonian', originalName: 'Eesti', flagEmoji: '🇪🇪', rtl: false },
  { code: 'lv', name: 'Latvian', originalName: 'Latviešu', flagEmoji: '🇱🇻', rtl: false },
  { code: 'lt', name: 'Lithuanian', originalName: 'Lietuvių', flagEmoji: '🇱🇹', rtl: false },
];

// ── API Client ──

async function tolgeeRequest<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${TOLGEE_API_URL()}/v2${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': TOLGEE_API_KEY(),
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Tolgee] ${opts?.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Public API ──

/**
 * Get all translations for a language.
 */
export async function getTranslations(
  language: string,
  namespace?: string
): Promise<Record<string, string>> {
  if (!isEnabled('TOLGEE')) return {};
  const projectId = TOLGEE_PROJECT_ID();
  if (!projectId) return {};

  const params = new URLSearchParams({ languages: language });
  if (namespace) params.set('filterNamespace', namespace);

  const result = await tolgeeRequest<any>(
    `/projects/${projectId}/translations?${params}`
  );

  const translations: Record<string, string> = {};
  for (const item of (result._embedded?.keys || [])) {
    const key = item.keyName;
    const value = item.translations?.[language]?.text;
    if (key && value) translations[key] = value;
  }
  return translations;
}

/**
 * Create or update a translation key.
 */
export async function upsertKey(key: TranslationKey): Promise<boolean> {
  if (!isEnabled('TOLGEE')) return false;
  const projectId = TOLGEE_PROJECT_ID();
  if (!projectId) return false;

  try {
    await tolgeeRequest(`/projects/${projectId}/keys/create`, {
      method: 'POST',
      body: JSON.stringify({
        name: key.key,
        namespace: key.namespace,
        description: key.description,
        tags: key.tags,
        translations: key.defaultValue
          ? { en: { text: key.defaultValue, state: 'TRANSLATED' } }
          : undefined,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get supported languages for the project.
 */
export async function getProjectLanguages(): Promise<string[]> {
  if (!isEnabled('TOLGEE')) return ['en'];
  const projectId = TOLGEE_PROJECT_ID();
  if (!projectId) return ['en'];

  const result = await tolgeeRequest<any>(`/projects/${projectId}/languages`);
  return (result._embedded?.languages || []).map((l: any) => l.tag);
}

/**
 * Detect the best language for a user based on their country code.
 */
export function detectLanguage(countryCode: string): string {
  // This would normally import from country-registry, but to avoid
  // circular deps we maintain a simple lookup
  const COUNTRY_TO_LANG: Record<string, string> = {
    US: 'en', CA: 'en', AU: 'en', GB: 'en', NZ: 'en', ZA: 'en',
    DE: 'de', AT: 'de', CH: 'de',
    FR: 'fr', BE: 'fr',
    ES: 'es', MX: 'es', CL: 'es', AR: 'es', CO: 'es', PE: 'es',
    BR: 'pt', PT: 'pt',
    NL: 'nl',
    IT: 'it',
    AE: 'ar', SA: 'ar', QA: 'ar', KW: 'ar', OM: 'ar', BH: 'ar',
    SE: 'sv', NO: 'no', DK: 'da', FI: 'fi',
    PL: 'pl', CZ: 'cs', HU: 'hu', RO: 'ro', BG: 'bg', HR: 'hr',
    GR: 'el', TR: 'tr',
    JP: 'ja', KR: 'ko', MY: 'ms', SG: 'en',
    IN: 'hi', ID: 'id', NG: 'en',
    IE: 'en', EE: 'et', LV: 'lv', LT: 'lt', SI: 'sl', SK: 'sk',
    UY: 'es', PA: 'es', CR: 'es', EC: 'es', DO: 'es',
  };
  return COUNTRY_TO_LANG[countryCode.toUpperCase()] || 'en';
}

/**
 * Get RTL status for a language.
 */
export function isRTL(langCode: string): boolean {
  return langCode === 'ar' || langCode === 'he' || langCode === 'fa' || langCode === 'ur';
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<boolean> {
  if (!isEnabled('TOLGEE')) return false;
  try {
    await tolgeeRequest('/projects');
    return true;
  } catch {
    return false;
  }
}
