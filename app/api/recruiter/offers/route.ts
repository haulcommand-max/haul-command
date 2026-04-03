// app/api/recruiter/offers/route.ts
// GET /api/recruiter/offers?region=TX&load_type=wind_turbine&trust_score=75&limit=4
//
// Serves recruiter offers from the internal registry (tier 1 house + tier 2 paid).
// No external partner API required. Falls back to house offers on any error.
// Called by AdGridRecruiterCard when operating in dynamic mode.

import { NextRequest, NextResponse } from 'next/server';
import { getRecruiterOffers, logRecruiterApply } from '@/lib/ads/recruiter-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const region = searchParams.get('region') ?? undefined;
    const load_type = searchParams.get('load_type') ?? undefined;
    const trust_score = searchParams.get('trust_score')
        ? parseInt(searchParams.get('trust_score')!)
        : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '4'), 10);

    const offers = await getRecruiterOffers({ region, load_type, trust_score, limit });

    return NextResponse.json(offers, {
        headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
    });
}

// POST /api/recruiter/offers — log apply intent (revenue attribution)
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const { offer_id, carrier_name, operator_trust_score, user_id } = body;

    if (!offer_id || !carrier_name) {
        return NextResponse.json({ error: 'offer_id and carrier_name required' }, { status: 400 });
    }

    await logRecruiterApply({ offer_id, carrier_name, operator_trust_score, user_id });
    return NextResponse.json({ ok: true, logged: true });
}
