// ══════════════════════════════════════════════════════════════
// RTL LAYOUT SUPPORT — Right-to-Left language utilities
// Used by: middleware, root layout, all components
// Covers: Arabic (AE, SA, QA, KW, OM, BH)
// ══════════════════════════════════════════════════════════════

import { headers } from 'next/headers';

export type TextDirection = 'ltr' | 'rtl';

/** RTL language codes */
const RTL_LANGS = new Set(['ar', 'he', 'ur', 'fa', 'ps', 'sd', 'yi']);

/** Countries where primary language is RTL */
const RTL_COUNTRIES = new Set(['AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'IL', 'IR', 'PK']);

// ── Server-side detection ──

/** Get text direction from middleware headers (use in server components) */
export async function getDirection(): Promise<TextDirection> {
  const heads = await headers();
  return (heads.get('x-hc-dir') as TextDirection) || 'ltr';
}

/** Get whether current request is RTL */
export async function isRTL(): Promise<boolean> {
  return (await getDirection()) === 'rtl';
}

/** Get whether current country is Arabic-speaking */
export async function isArabicCountry(): Promise<boolean> {
  const heads = await headers();
  return heads.get('x-hc-arabic') === '1';
}

// ── Client-side detection ──

/** Check if a language code is RTL */
export function isRTLLanguage(langCode: string): boolean {
  return RTL_LANGS.has(langCode.split('-')[0].toLowerCase());
}

/** Check if a country defaults to RTL */
export function isRTLCountry(countryCode: string): boolean {
  return RTL_COUNTRIES.has(countryCode.toUpperCase());
}

// ── CSS class helpers ──

/** Generate directional CSS classes */
export function dirClasses(dir: TextDirection): string {
  if (dir === 'rtl') {
    return 'direction-rtl text-right';
  }
  return 'direction-ltr text-left';
}

/**
 * Flip a margin/padding value for RTL.
 * e.g., flipSpacing('ml-4', 'rtl') → 'mr-4'
 */
export function flipSpacing(cls: string, dir: TextDirection): string {
  if (dir === 'ltr') return cls;
  return cls
    .replace(/\bml-/g, '__mr-')
    .replace(/\bmr-/g, 'ml-')
    .replace(/__mr-/g, 'mr-')
    .replace(/\bpl-/g, '__pr-')
    .replace(/\bpr-/g, 'pl-')
    .replace(/__pr-/g, 'pr-')
    .replace(/\bleft-/g, '__right-')
    .replace(/\bright-/g, 'left-')
    .replace(/__right-/g, 'right-')
    .replace(/\btext-left\b/g, '__text-right')
    .replace(/\btext-right\b/g, 'text-left')
    .replace(/__text-right/g, 'text-right')
    .replace(/\brounded-l-/g, '__rounded-r-')
    .replace(/\brounded-r-/g, 'rounded-l-')
    .replace(/__rounded-r-/g, 'rounded-r-')
    .replace(/\bborder-l-/g, '__border-r-')
    .replace(/\bborder-r-/g, 'border-l-')
    .replace(/__border-r-/g, 'border-r-');
}

/**
 * Get the correct flex direction for RTL layouts.
 */
export function flexDir(dir: TextDirection): string {
  return dir === 'rtl' ? 'flex-row-reverse' : 'flex-row';
}

// ── Font configuration for Arabic ──

/** Google Fonts family for Arabic text */
export const ARABIC_FONT_FAMILY = 'IBM Plex Sans Arabic';
export const ARABIC_FONT_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap';

/** Get the appropriate font stack based on language */
export function getFontStack(langCode: string): string {
  if (RTL_LANGS.has(langCode)) {
    return `'${ARABIC_FONT_FAMILY}', 'Segoe UI', Tahoma, sans-serif`;
  }
  return "'Inter', 'Segoe UI', system-ui, sans-serif";
}
