import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Outcome Engine API — Band D Rank 1
 * 
 * Records and retrieves outcome events:
 *   - load_filled, load_matched, rescue_succeeded, contact_intent
 *   - claim_completed, partner_application_completed
 * 
 * GET: Retrieve outcome metrics for a market/corridor/entity
 * POST: Record a new outcome event
 */

export const dynamic = 'force-dynamic';

interface OutcomeEvent {
    event_type: string;
    market?: string;
    corridor?: string;
    service_type?: string;
    entity_id?: string;
    entity_type?: string;
    details?: Record<string, unknown>;
}

// Derive outcomes from existing data (behavioral_events + loads + directory)
async function deriveOutcomes(supabase: any, filters: {
    market?: string; corridor?: string; entity_id?: string; limit?: number;
}) {
    const outcomes: any[] = [];
    const limit = filters.limit || 20;

    // 1. Recent load activity as proxy for matches/fills
    try {
        let loadQuery = supabase
            .from('loads')
            .select('id, company_name, origin_city, origin_state, destination_city, destination_state, position_type, rate_amount, ingested_at, status')
            .order('ingested_at', { ascending: false })
            .limit(limit);

        if (filters.market) {
            loadQuery = loadQuery.or(`origin_state.eq.${filters.market},destination_state.eq.${filters.market}`);
        }

        const { data: loads } = await loadQuery;
        if (loads) {
            for (const load of loads) {
                const age = Date.now() - new Date(load.ingested_at).getTime();
                const ageHours = age / (1000 * 60 * 60);
                // Loads older than 24h with status filled are real outcomes
                const isFilled = load.status === 'filled' || load.status === 'matched';
                // Infer likely fills from aging posts (if >48h and not reposted, likely filled)
                const likelyFilled = ageHours > 48;

                outcomes.push({
                    type: isFilled ? 'load_filled' : likelyFilled ? 'likely_filled' : 'load_posted',
                    timestamp: load.ingested_at,
                    market: load.origin_state,
                    corridor: `${load.origin_state}-${load.destination_state}`,
                    entity: load.company_name,
                    detail: `${load.origin_city}, ${load.origin_state} → ${load.destination_city}, ${load.destination_state}`,
                    rate: load.rate_amount,
                    service_type: load.position_type,
                    confidence: isFilled ? 'confirmed' : likelyFilled ? 'inferred' : 'active',
                });
            }
        }
    } catch { /* table may not exist */ }

    // 2. Recent claims from directory_listings
    try {
        let claimQuery = supabase
            .from('hc_global_operators')
            .select('id, company_name, home_base_state, is_claimed, claimed_at, updated_at')
            .eq('is_claimed', true)
            .order('claimed_at', { ascending: false })
            .limit(10);

        if (filters.market) {
            claimQuery = claimQuery.eq('home_base_state', filters.market);
        }

        const { data: claims } = await claimQuery;
        if (claims) {
            for (const claim of claims) {
                outcomes.push({
                    type: 'claim_completed',
                    timestamp: claim.claimed_at || claim.updated_at,
                    market: claim.home_base_state,
                    entity: claim.company_name,
                    detail: `Claimed profile in ${claim.home_base_state}`,
                    confidence: 'confirmed',
                });
            }
        }
    } catch { /* table may not exist */ }

    // 3. Recent behavioral events as outcome signals
    try {
        let eventQuery = supabase
            .from('behavioral_events')
            .select('event_type, created_at, metadata, entity_type, entity_id')
            .in('event_type', ['claim_completed', 'offer_accepted', 'escort_contacted', 'partner_application_submitted'])
            .order('created_at', { ascending: false })
            .limit(10);

        const { data: events } = await eventQuery;
        if (events) {
            for (const ev of events) {
                outcomes.push({
                    type: ev.event_type,
                    timestamp: ev.created_at,
                    market: ev.metadata?.state || ev.metadata?.market || null,
                    detail: ev.metadata?.detail || `${ev.event_type} recorded`,
                    confidence: 'confirmed',
                });
            }
        }
    } catch { /* table may not exist */ }

    // Sort by recency
    outcomes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute summary metrics
    const filled = outcomes.filter(o => o.type === 'load_filled' || o.type === 'likely_filled');
    const claims = outcomes.filter(o => o.type === 'claim_completed');
    const contacts = outcomes.filter(o => o.type === 'escort_contacted' || o.type === 'offer_accepted');

    return {
        outcomes: outcomes.slice(0, limit),
        summary: {
            total_outcomes: outcomes.length,
            fills: filled.length,
            confirmed_fills: filled.filter(f => f.confidence === 'confirmed').length,
            inferred_fills: filled.filter(f => f.confidence === 'inferred').length,
            claims: claims.length,
            contacts: contacts.length,
            recent_activity: outcomes.length > 0,
            has_real_outcomes: filled.filter(f => f.confidence === 'confirmed').length > 0,
        },
    };
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || searchParams.get('state');
    const corridor = searchParams.get('corridor');
    const entityId = searchParams.get('entity_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    try {
        const supabase = getSupabaseAdmin();
        const result = await deriveOutcomes(supabase, { market: market || undefined, corridor: corridor || undefined, entity_id: entityId || undefined, limit });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Outcome query failed', details: error?.message, outcomes: [], summary: { total_outcomes: 0, fills: 0, claims: 0, contacts: 0, recent_activity: false, has_real_outcomes: false } },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: OutcomeEvent = await request.json();
        const supabase = getSupabaseAdmin();

        // Record to behavioral_events
        await supabase.from('behavioral_events').insert({
            event_type: body.event_type,
            entity_type: body.entity_type || null,
            entity_id: body.entity_id || null,
            metadata: {
                market: body.market,
                corridor: body.corridor,
                service_type: body.service_type,
                ...body.details,
            },
        });

        return NextResponse.json({ recorded: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to record outcome', details: error?.message }, { status: 500 });
    }
}
