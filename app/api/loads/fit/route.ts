/**
 * POST /api/loads/fit
 * 
 * Given a load profile, returns the best-fit operator shortlist.
 * Powers broker search, dispatch waves, and compare pages.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { type LoadProfile, type OperatorProfile, buildShortlist, rankOperatorsForLoad } from '@/lib/engines/load-fit';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            load: LoadProfile;
            max_results?: number;
            radius_miles?: number;
        };

        const { load, max_results = 10, radius_miles = 300 } = body;

        if (!load || !load.origin || !load.destination) {
            return NextResponse.json({ error: 'Load profile with origin and destination required' }, { status: 400 });
        }

        const supabase = getSupabase();

        // Fetch operators using PostGIS proximity if available, else all
        const { data: operators, error } = await supabase
            .from('operators')
            .select(`
        id, company_name, phone, email, lat, lng, city, state, country_code,
        role_subtypes, has_height_pole, certifications,
        trust_score, reputation_score, freshness_score,
        response_rate_7d, avg_response_time_minutes,
        completed_jobs_90d, corridors_familiar,
        is_available, is_dispatch_ready, boost_tier
      `)
            .eq('is_available', true)
            .limit(200);

        if (error) throw error;

        // Map to engine format
        const opProfiles: OperatorProfile[] = (operators || [])
            .filter(op => op.lat && op.lng)
            .map(op => ({
                operator_id: op.id,
                lat: op.lat,
                lng: op.lng,
                city: op.city || '',
                state: op.state || '',
                role_subtypes: Array.isArray(op.role_subtypes) ? op.role_subtypes : [],
                has_height_pole: op.has_height_pole || false,
                certifications: Array.isArray(op.certifications) ? op.certifications : [],
                trust_score: op.trust_score || 0,
                freshness_score: op.freshness_score || 50,
                reputation_score: op.reputation_score || 0,
                response_rate_7d: op.response_rate_7d || 0,
                avg_response_time_minutes: op.avg_response_time_minutes || 60,
                completed_jobs_90d: op.completed_jobs_90d || 0,
                corridors_familiar: Array.isArray(op.corridors_familiar) ? op.corridors_familiar : [],
                is_available: true,
                is_dispatch_ready: op.is_dispatch_ready || false,
                boost_tier: op.boost_tier || null,
            }));

        // Run fit engine
        const ranked = rankOperatorsForLoad(load, opProfiles);
        const shortlist = ranked.slice(0, max_results);

        // Enrich with display names
        const shortlistEnriched = shortlist.map(fit => {
            const op = operators?.find(o => o.id === fit.operator_id);
            return {
                ...fit,
                company_name: op?.company_name || 'Unknown',
                city: op?.city || '',
                state: op?.state || '',
                phone: op?.phone,
                boost_tier: op?.boost_tier,
            };
        });

        return NextResponse.json({
            ok: true,
            load_id: load.load_id,
            corridor: load.corridor,
            total_candidates: opProfiles.length,
            total_qualified: ranked.length,
            shortlist: shortlistEnriched,
        }, {
            headers: { 'Cache-Control': 'private, max-age=60' },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
