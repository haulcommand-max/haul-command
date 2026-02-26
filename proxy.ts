import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseMiddleware } from "./lib/supabase/middleware";

// ── Locale detection ───────────────────────────────────────────────────────────

type SupportedLocale = string; // Validated via COUNTRY_LOCALE_MAP
const LOCALE_COOKIE = 'hc_locale';
const COUNTRY_HEADER = 'x-hc-country';
const LOCALE_HEADER = 'x-hc-locale';

/** Default locale per country — all 11 priority markets */
const COUNTRY_LOCALE_MAP: Record<string, string> = {
    US: 'en-US', CA: 'en-CA', AU: 'en-AU', GB: 'en-GB', NZ: 'en-NZ',
    SE: 'sv-SE', NO: 'no-NO', AE: 'en-AE', SA: 'ar-SA', DE: 'de-DE', ZA: 'en-ZA',
};

/** All valid locale values for cookie validation */
const VALID_LOCALES = new Set([
    'en-US', 'en-CA', 'fr-CA', 'en-AU', 'en-GB', 'en-NZ',
    'sv-SE', 'no-NO', 'en-AE', 'ar-SA', 'de-DE', 'en-ZA',
]);

function resolveLocale(req: NextRequest): { locale: string; country: string } {
    // 1. Explicit user choice (cookie)
    const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
    if (cookieLocale && VALID_LOCALES.has(cookieLocale)) {
        // Derive country from locale: en-CA → CA, de-DE → DE, etc.
        const parts = cookieLocale.split('-');
        const country = parts[parts.length - 1]?.toUpperCase() || 'US';
        return { locale: cookieLocale, country };
    }

    // 2. Edge geo detection (Vercel provides geo headers)
    const geoCountry = req.geo?.country || req.headers.get('x-vercel-ip-country') || '';

    // Canada: auto-detect French from Accept-Language
    if (geoCountry === 'CA') {
        const acceptLang = req.headers.get('accept-language') || '';
        const prefersFrench = /fr/i.test(acceptLang.split(',')[0] || '');
        return { locale: prefersFrench ? 'fr-CA' : 'en-CA', country: 'CA' };
    }

    // All other priority markets
    const defaultLocale = COUNTRY_LOCALE_MAP[geoCountry];
    if (defaultLocale) {
        return { locale: defaultLocale, country: geoCountry };
    }

    // Default: US English
    return { locale: 'en-US', country: geoCountry || 'US' };
}

// ── Proxy ──────────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
    const url = new URL(req.url);
    const path = url.pathname;

    // ── Locale resolution (runs on all routes) ──
    const { locale, country } = resolveLocale(req);

    // Clone headers and inject locale/country for server components
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(COUNTRY_HEADER, country);
    requestHeaders.set(LOCALE_HEADER, locale);

    // ── SEO Redirect Check (Phase 12: Stale-Load Sweeper) ──
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
            // Ignore errors, proceed to app
            console.error("Proxy SEO check failed", e);
        }
    }

    // ── Protected routes ──
    const protectedMember = path.startsWith("/directory") && path.includes("/member");
    const protectedAdmin = path.startsWith("/admin");

    if (!protectedMember && !protectedAdmin) {
        // Non-protected: pass through with locale headers + set locale cookie
        const response = NextResponse.next({ request: { headers: requestHeaders } });
        if (!req.cookies.get(LOCALE_COOKIE)?.value) {
            response.cookies.set(LOCALE_COOKIE, locale, {
                maxAge: 30 * 86400,
                path: '/',
                sameSite: 'lax',
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

    // Set locale cookie on auth'd response too
    if (!req.cookies.get(LOCALE_COOKIE)?.value) {
        res.cookies.set(LOCALE_COOKIE, locale, {
            maxAge: 30 * 86400,
            path: '/',
            sameSite: 'lax',
        });
    }

    return res;
}

export const config = {
    matcher: [
        // Match all routes except static assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
    ],
};
