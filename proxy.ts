import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseMiddleware } from "./lib/supabase/middleware";

// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND PROXY — Next.js 16 Edge Middleware
// Merged: locale detection (57 countries), RTL, redirects, auth
// ═══════════════════════════════════════════════════════════════

// ── Locale Configuration ───────────────────────────────────────

const LOCALE_COOKIE = 'hc_locale';
const COUNTRY_COOKIE = 'hc_country';
const COUNTRY_HEADER = 'x-hc-country';
const LOCALE_HEADER = 'x-hc-locale';
const DIR_HEADER = 'x-hc-dir';
const LANG_HEADER = 'x-hc-lang';

// RTL languages
const RTL_LANGUAGES = new Set(['ar', 'he', 'ur', 'fa']);
const ARABIC_COUNTRIES = new Set(['AE', 'SA', 'QA', 'KW', 'OM', 'BH']);

/** Country → default locale — all 57 countries */
const COUNTRY_LOCALE_MAP: Record<string, string> = {
  US:'en-US', CA:'en-CA', AU:'en-AU', GB:'en-GB', NZ:'en-NZ',
  ZA:'en-ZA', DE:'de-DE', NL:'nl-NL', AE:'ar-AE', BR:'pt-BR',
  IE:'en-IE', SE:'sv-SE', NO:'nb-NO', DK:'da-DK', FI:'fi-FI',
  BE:'nl-BE', AT:'de-AT', CH:'de-CH', ES:'es-ES', FR:'fr-FR',
  IT:'it-IT', PT:'pt-PT', SA:'ar-SA', QA:'ar-QA', MX:'es-MX',
  IN:'hi-IN', ID:'id-ID', TH:'th-TH', PL:'pl-PL', CZ:'cs-CZ',
  SK:'sk-SK', HU:'hu-HU', SI:'sl-SI', EE:'et-EE', LV:'lv-LV',
  LT:'lt-LT', HR:'hr-HR', RO:'ro-RO', BG:'bg-BG', GR:'el-GR',
  TR:'tr-TR', KW:'ar-KW', OM:'ar-OM', BH:'ar-BH', SG:'en-SG',
  MY:'ms-MY', JP:'ja-JP', KR:'ko-KR', CL:'es-CL', AR:'es-AR',
  CO:'es-CO', PE:'es-PE', VN:'vi-VN', PH:'en-PH', UY:'es-UY',
  PA:'es-PA', CR:'es-CR',
};

/** All valid locale values */
const VALID_LOCALES = new Set(Object.values(COUNTRY_LOCALE_MAP));

function resolveLocale(req: NextRequest): { locale: string; country: string; isRTL: boolean } {
  // 1. Explicit user choice (cookie)
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  const cookieCountry = req.cookies.get(COUNTRY_COOKIE)?.value;

  if (cookieLocale && VALID_LOCALES.has(cookieLocale)) {
    const country = cookieCountry || cookieLocale.split('-').pop()?.toUpperCase() || 'US';
    const langCode = cookieLocale.split('-')[0];
    return { locale: cookieLocale, country, isRTL: RTL_LANGUAGES.has(langCode) };
  }

  // 2. Edge geo detection (Vercel provides geo headers)
  const geoCountry = (req as any).geo?.country || req.headers.get('x-vercel-ip-country') || '';

  // Canada: auto-detect French from Accept-Language
  if (geoCountry === 'CA') {
    const acceptLang = req.headers.get('accept-language') || '';
    const prefersFrench = /fr/i.test(acceptLang.split(',')[0] || '');
    return { locale: prefersFrench ? 'fr-CA' : 'en-CA', country: 'CA', isRTL: false };
  }

  // Arabic countries: check if user prefers English
  if (ARABIC_COUNTRIES.has(geoCountry)) {
    const acceptLang = req.headers.get('accept-language') || '';
    const prefersEnglish = /^en/i.test(acceptLang.split(',')[0] || '');
    if (prefersEnglish) {
      return { locale: `en-${geoCountry}`, country: geoCountry, isRTL: false };
    }
  }

  // All other markets
  const defaultLocale = COUNTRY_LOCALE_MAP[geoCountry];
  if (defaultLocale) {
    const langCode = defaultLocale.split('-')[0];
    return { locale: defaultLocale, country: geoCountry, isRTL: RTL_LANGUAGES.has(langCode) };
  }

  return { locale: 'en-US', country: geoCountry || 'US', isRTL: false };
}

// ── Proxy ──────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  // ── REDIRECT MATRIX (Legacy → Canonical) ──

  // 1) /directory/[country] → /[country]
  const directoryCountryMatch = path.match(/^\/directory\/([a-zA-Z]{2})$/i);
  if (directoryCountryMatch) {
    return NextResponse.redirect(new URL(`/${directoryCountryMatch[1].toLowerCase()}`, req.url), 301);
  }

  // 2) /[country]/places → /[country]
  const countryPlacesMatch = path.match(/^\/([a-zA-Z]{2})\/places$/i);
  if (countryPlacesMatch) {
    return NextResponse.redirect(new URL(`/${countryPlacesMatch[1].toLowerCase()}`, req.url), 301);
  }

  // 3) /pilot-car/[state] → /{country}/{state}/pilot-car-services
  const pilotCarStateMatch = path.match(/^\/pilot-car\/([a-zA-Z0-9-]+)$/i);
  if (pilotCarStateMatch) {
    const stateSlug = pilotCarStateMatch[1].toLowerCase();
    const isCanada = ['alberta', 'bc', 'ontario', 'quebec', 'saskatchewan'].includes(stateSlug);
    return NextResponse.redirect(new URL(`/${isCanada ? 'ca' : 'us'}/${stateSlug}/pilot-car-services`, req.url), 301);
  }

  // 4) /corridors/[route] → /corridor/[route]
  const corridorsPluralMatch = path.match(/^\/corridors\/(.*)$/i);
  if (corridorsPluralMatch) {
    return NextResponse.redirect(new URL(`/corridor/${corridorsPluralMatch[1].toLowerCase()}`, req.url), 301);
  }

  // 5) /high-pole-escorts/[city] → /high-pole-escort-{city}-near-me
  const highPoleMatch = path.match(/^\/high-pole-escorts\/([a-zA-Z0-9-]+)$/i);
  if (highPoleMatch) {
    return NextResponse.redirect(new URL(`/high-pole-escort-${highPoleMatch[1].toLowerCase()}-near-me`, req.url), 301);
  }

  // 6) Enforce lowercase paths
  if (path !== path.toLowerCase() && !path.includes('_next') && !path.match(/\.(png|jpg|jpeg|svg|ico|avif|webp|json|xml)$/)) {
    return NextResponse.redirect(new URL(path.toLowerCase() + url.search, req.url), 301);
  }

  // ── Locale resolution (57 countries + RTL) ──
  const { locale, country, isRTL } = resolveLocale(req);
  const langCode = locale.split('-')[0];

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(COUNTRY_HEADER, country);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set(DIR_HEADER, isRTL ? 'rtl' : 'ltr');
  requestHeaders.set(LANG_HEADER, langCode);
  requestHeaders.set('x-hc-arabic', ARABIC_COUNTRIES.has(country) ? '1' : '0');

  // ── SEO Redirect Check (Stale-Load Sweeper) ──
  if (path.startsWith("/loads/") || path.startsWith("/l/")) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("seo_redirects")
        .select("to_path, code")
        .eq("from_path", path)
        .single();

      if (data) {
        return NextResponse.redirect(new URL(data.to_path, req.url), { status: data.code });
      }
    } catch (e) {
      console.error("Proxy SEO check failed", e);
    }
  }

  // ── Protected routes ──
  const protectedMember = path.startsWith("/directory") && path.includes("/member");
  const protectedAdmin = path.startsWith("/admin");

  if (!protectedMember && !protectedAdmin) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    // Set locale cookie if not already set
    if (!req.cookies.get(LOCALE_COOKIE)?.value) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        maxAge: 30 * 86400, path: '/', sameSite: 'lax',
      });
    }
    if (!req.cookies.get(COUNTRY_COOKIE)?.value && country) {
      response.cookies.set(COUNTRY_COOKIE, country, {
        maxAge: 30 * 86400, path: '/', sameSite: 'lax',
      });
    }
    return response;
  }

  const { res, user, supabase } = await supabaseMiddleware(req);
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  if (protectedAdmin) {
    const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (data?.role !== "admin") return NextResponse.redirect(new URL("/", req.url));
  }

  // Set locale cookies on auth'd response
  if (!req.cookies.get(LOCALE_COOKIE)?.value) {
    res.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: 30 * 86400, path: '/', sameSite: 'lax',
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
