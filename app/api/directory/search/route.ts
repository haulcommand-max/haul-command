export const dynamic = 'force-dynamic';
/**
 * GET /api/directory/search
 * Enhanced natural-language search with intent parsing + analytics tracking.
 *
 * Supports conversational queries like:
 *   "pilot car in Houston TX"
 *   "TWIC escort near Port of Houston"
 *   "wide load escort Florida"
 *
 * Returns: city/region results ranked by relevance + market pressure.
 * Side-effect: logs parsed query to directory_search_logs for analytics.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ── NL Intent Parser ─────────────────────────────────────────────────────────

const US_STATES: Record<string, string> = {
    alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
    colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
    hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
    kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
    massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
    montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
    ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
    'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
    vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
    wisconsin: 'WI', wyoming: 'WY',
};

const STATE_ABBREVS = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY',
]);

const SERVICE_KEYWORDS: Record<string, string> = {
    'pilot car': 'pilot_car', 'escort': 'escort', 'wide load': 'wide_load',
    'oversize': 'oversize', 'overwidth': 'overwidth', 'overheight': 'overheight',
    'twic': 'twic_verified', 'port escort': 'port_escort',
    'heavy haul': 'heavy_haul', 'superload': 'superload',
    'pole car': 'pole_car', 'flag car': 'flag_car',
};

interface ParsedIntent {
    city: string | null;
    state: string | null;
    country: string;
    service: string | null;
    tags: string[];
    raw: string;
}

function parseSearchIntent(raw: string): ParsedIntent {
    const q = raw.trim().toLowerCase();
    const words = q.split(/\s+/);

    let state: string | null = null;
    let city: string | null = null;
    let service: string | null = null;
    const tags: string[] = [];

    // 1. Extract service keywords first (multi-word)
    for (const [kw, svc] of Object.entries(SERVICE_KEYWORDS)) {
        if (q.includes(kw)) {
            service = svc;
            tags.push(svc);
        }
    }

    // 2. Extract state: check for full name or 2-letter abbrev
    for (const [name, abbrev] of Object.entries(US_STATES)) {
        if (q.includes(name)) {
            state = abbrev;
            break;
        }
    }
    if (!state) {
        for (const w of words) {
            const upper = w.toUpperCase().replace(/[^A-Z]/g, '');
            if (STATE_ABBREVS.has(upper)) { state = upper; break; }
        }
    }

    // 3. Strip stopwords + known tokens to extract city candidate
    const stopwords = new Set([
        'in', 'near', 'around', 'at', 'for', 'find', 'find me', 'a', 'an', 'the', 'with',
        'pilot', 'car', 'escort', 'wide', 'load', 'twic', 'heavy', 'haul', 'oversize',
        'overwidth', 'overheight', 'port', 'superload', 'flag', 'pole', 'services',
        'operator', 'operators', 'available',
        ...(state ? [state.toLowerCase()] : []),
        ...(Object.keys(US_STATES)),
    ]);

    const cityWords = words.filter(w => !stopwords.has(w) && w.length > 1 && !/^\d+$/.test(w));
    if (cityWords.length > 0) {
        city = cityWords.slice(0, 3)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    return { city, state, country: 'US', service, tags, raw };
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const raw = req.nextUrl.searchParams.get('q') ?? '';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '10'), 20);
    const sessionId = req.headers.get('x-session-id') ?? null;
    const countryHint = req.headers.get('x-vercel-ip-country') ?? null;

    if (raw.length < 2) return NextResponse.json({ results: [], parsed: null }, { status: 400 });

    const intent = parseSearchIntent(raw);

    // ── Query: match on city + state + country ────────────────────────────────
    let query = svc
        .from('directory_drivers')
        .select('city, region_code, country_code, city_slug, operator_count, market_pressure_level')
        .limit(limit);

    if (intent.city) query = query.ilike('city', `${intent.city}%`);
    if (intent.state) query = query.eq('region_code', intent.state);

    const { data: rawResults, error } = await query;
    const results = rawResults ?? [];

    // De-duplicate on city_slug
    const seen = new Set<string>();
    const unique = results.filter((r: any) => {
        if (seen.has(r.city_slug)) return false;
        seen.add(r.city_slug);
        return true;
    });

    // ── Fallback: full-text on city if empty ─────────────────────────────────
    let finalResults = unique;
    if (unique.length === 0 && intent.city) {
        const { data: fallback } = await svc
            .from('directory_drivers')
            .select('city, region_code, country_code, city_slug, operator_count, market_pressure_level')
            .ilike('city', `%${intent.city}%`)
            .limit(limit);
        finalResults = fallback ?? [];
    }

    // ── Log analytics (fire-and-forget) ──────────────────────────────────────
    void Promise.resolve(
        svc.from('directory_search_logs').insert({
            session_id: sessionId,
            raw_query: raw,
            parsed_city: intent.city,
            parsed_state: intent.state,
            parsed_country: intent.country,
            parsed_service: intent.service,
            parsed_tags: intent.tags,
            result_count: finalResults.length,
            country_hint: countryHint,
        })
    ).catch(() => { });


    return NextResponse.json({
        results: finalResults,
        parsed: intent,
        count: finalResults.length,
    });
}

/**
 * POST /api/directory/search
 * Track a click-through from search results (updates analytics log).
 */
export async function POST(req: NextRequest) {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const body = await req.json().catch(() => ({}));
    const { session_id, clicked_slug, position } = body;

    if (!session_id || !clicked_slug) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Update the most recent log for this session
    await svc.from('directory_search_logs')
        .update({ clicked_slug, click_position: position ?? null })
        .eq('session_id', session_id)
        .is('clicked_slug', null)
        .order('searched_at', { ascending: false })
        .limit(1);

    return NextResponse.json({ ok: true });
}
