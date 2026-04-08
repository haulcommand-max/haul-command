/**
 * middleware.ts — Haul Command i18n + language routing
 *
 * Handles /[lang]/ routes for Spanish-speaking operators in the US
 * and future multilingual country deployments.
 *
 * Supported locales:
 *   en (default)  → pass-through, no prefix
 *   es            → /es/... routes (US Latino operator segment)
 *   fr            → /fr/... routes (Canadian French)
 *
 * Logic:
 *   1. If path starts with a known locale prefix → serve that locale
 *   2. If Accept-Language header signals a preferred locale → redirect to locale prefix
 *   3. Operator's locale preference (stored in hc_lang cookie) overrides header
 *   4. Always skip API routes, static files, Next.js internals
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    // Match everything except Next.js internals, static assets, and API
    '/((?!_next|api|favicon|icons|screenshots|sw|manifest|sitemap|robots|.*\\..*).*)',
  ],
};

const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en';

/**
 * Extract preferred locale from Accept-Language header.
 * Returns one of our supported locales or 'en' fallback.
 */
function getPreferredLocale(request: NextRequest): Locale {
  const accept = request.headers.get('accept-language') ?? '';
  // Parse "es-US,es;q=0.9,en;q=0.8" → ['es', 'en']
  const tags = accept
    .split(',')
    .map((s) => s.split(';')[0].trim().substring(0, 2).toLowerCase());

  for (const tag of tags) {
    if (SUPPORTED_LOCALES.includes(tag as Locale)) return tag as Locale;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check operator's stored locale preference cookie
  const cookieLocale = request.cookies.get('hc_lang')?.value as Locale | undefined;

  // 2. Check if pathname already starts with a supported locale
  const pathLocale = SUPPORTED_LOCALES.find(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`),
  );

  // If already has a valid locale prefix → continue
  if (pathLocale) {
    // Sync cookie if needed
    const response = NextResponse.next();
    if (cookieLocale !== pathLocale) {
      response.cookies.set('hc_lang', pathLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
    return response;
  }

  // 3. Determine target locale
  const targetLocale = cookieLocale ?? getPreferredLocale(request);

  // 4. Only redirect if locale is NOT English (en is default, no prefix)
  if (targetLocale !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = `/${targetLocale}${pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set('hc_lang', targetLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}
