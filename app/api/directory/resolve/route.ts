export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveProfile, type NormalizedProfile, type ResolutionResult } from '@/lib/resolvers/resolveProfile';

/* ── Rate limiting (graceful if Upstash not configured) ── */
let apiRateLimit: any = null;
const UPSTASH_CONFIGURED = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
if (UPSTASH_CONFIGURED) {
    try {
        const { apiRateLimit: rl } = require('@/lib/upstash');
        apiRateLimit = rl;
    } catch (e) {
        console.warn('[resolve] Upstash rate limiter failed to initialize:', e);
    }
} else {
    console.warn('[resolve] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled');
}

/* ── Supabase (service role — bypasses RLS) ── */
function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

/* ── Input validation ── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9\-]{1,120}$/;

function isValidIdOrSlug(v: string): boolean {
    return UUID_RE.test(v) || SLUG_RE.test(v);
}

/* ── Extract IP for rate limiting ── */
function getClientIp(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}

/* ── Public field allowlist ──
 * Only expose fields that are safe for unauthenticated users.
 * NEVER leak: claim_hash, latitude, longitude (precise), us_dot_number,
 *             insurance_status, compliance_status, fill_probability
 */
interface PublicProfile {
    id: string;
    display_name: string;
    company_name: string | null;
    home_base_city: string | null;
    home_base_state: string | null;
    country_code: string | null;
    vehicle_type: string | null;
    trust_score: number;
    verification_status: string | null;
    is_claimed: boolean;
    is_seeded: boolean;
    certifications_json: Record<string, boolean>;
    reliability_score: number;
    responsiveness_score: number;
    integrity_score: number;
    customer_signal_score: number;
    compliance_score: number;
    market_fit_score: number;
    completed_escorts: number;
    rating_score: number;
    review_count: number;
    coverage_radius_miles: number | null;
    updated_at: string | null;
}

function toPublicProfile(p: NormalizedProfile): PublicProfile {
    return {
        id: p.id,
        display_name: p.display_name,
        company_name: p.company_name,
        home_base_city: p.home_base_city,
        home_base_state: p.home_base_state,
        country_code: p.country_code,
        vehicle_type: p.vehicle_type,
        trust_score: p.trust_score,
        verification_status: p.verification_status,
        is_claimed: p.is_claimed,
        is_seeded: p.is_seeded,
        certifications_json: p.certifications_json,
        reliability_score: p.reliability_score,
        responsiveness_score: p.responsiveness_score,
        integrity_score: p.integrity_score,
        customer_signal_score: p.customer_signal_score,
        compliance_score: p.compliance_score,
        market_fit_score: p.market_fit_score,
        completed_escorts: p.completed_escorts,
        rating_score: p.rating_score,
        review_count: p.review_count,
        coverage_radius_miles: p.coverage_radius_miles,
        updated_at: p.updated_at,
    };
}

/**
 * GET /api/directory/resolve?id=port-of-los-angeles
 * 
 * Server-side profile resolver endpoint.
 * - Rate limited: 60 req/min per IP (via Upstash, graceful if unconfigured)
 * - Validates input shape (UUID or lowercase slug)
 * - Returns only public-safe fields (no claim_hash, lat/lng, us_dot, etc.)
 * - Logs resolution metadata for observability
 * - Cache headers: 60s s-maxage, 5min stale-while-revalidate
 */
export async function GET(req: NextRequest) {
    /* ── Rate limiting ── */
    if (apiRateLimit) {
        const ip = getClientIp(req);
        try {
            const { success, limit, remaining, reset } = await apiRateLimit.limit(ip);
            if (!success) {
                console.warn(`[resolve] RATE_LIMITED ip=${ip} limit=${limit} reset=${reset}`);
                return NextResponse.json(
                    { error: 'Too many requests. Please try again later.' },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                            'X-RateLimit-Limit': String(limit),
                            'X-RateLimit-Remaining': '0',
                        },
                    }
                );
            }
        } catch (e) {
            // Rate limiter failure should not block the request
            console.error('[resolve] Rate limiter error (allowing request):', e);
        }
    }

    const id = req.nextUrl.searchParams.get('id')?.trim();

    if (!id) {
        return NextResponse.json({ error: 'Missing ?id= parameter' }, { status: 400 });
    }
    if (!isValidIdOrSlug(id)) {
        return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
    }

    const supabase = getSupabase();
    const result = await resolveProfile(supabase, id);

    // Observability: log resolution path and duplicate hits
    if (result.redirect_to) {
        console.info(`[resolve] id=${id} → REDIRECT to ${result.redirect_to}`);
    } else if (result.resolved) {
        console.info(`[resolve] id=${id} → ${result.resolved_table} (${result.entity_type}) path=${result.resolution_path.join('→')}`);
    } else {
        console.warn(`[resolve] id=${id} NOT_FOUND path=${result.resolution_path.join('→')} reason=${result.failure_reason}`);
    }

    // Build safe public response
    const publicResult = {
        resolved: result.resolved,
        resolved_table: result.resolved_table,
        entity_type: result.entity_type,
        resolution_path: result.resolution_path,
        profile: result.profile ? toPublicProfile(result.profile) : null,
        failure_reason: result.failure_reason,
        redirect_to: result.redirect_to || null,
    };

    return NextResponse.json(publicResult, {
        headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
    });
}
