export const dynamic = 'force-dynamic';

/**
 * POST /api/map/prefetch-jurisdiction
 * 
 * Prefetches home jurisdiction + neighbor jurisdictions for fast drawer opens.
 * Uses an adjacency map for US/CA regions.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Adjacency map for US states — neighbors share a border
const US_NEIGHBORS: Record<string, string[]> = {
    'US-FL': ['US-GA', 'US-AL'],
    'US-TX': ['US-NM', 'US-OK', 'US-AR', 'US-LA'],
    'US-CA': ['US-OR', 'US-NV', 'US-AZ'],
    'US-NY': ['US-NJ', 'US-PA', 'US-CT', 'US-MA', 'US-VT'],
    'US-OH': ['US-PA', 'US-WV', 'US-KY', 'US-IN', 'US-MI'],
    'US-GA': ['US-FL', 'US-AL', 'US-TN', 'US-NC', 'US-SC'],
    'US-PA': ['US-NY', 'US-NJ', 'US-DE', 'US-MD', 'US-WV', 'US-OH'],
    'US-IL': ['US-IN', 'US-KY', 'US-MO', 'US-IA', 'US-WI'],
    'US-NC': ['US-VA', 'US-TN', 'US-GA', 'US-SC'],
    'US-MI': ['US-OH', 'US-IN', 'US-WI'],
    'US-WA': ['US-OR', 'US-ID'],
    'US-OR': ['US-WA', 'US-CA', 'US-NV', 'US-ID'],
};

export async function POST(req: Request) {
    try {
        const { jurisdiction_code } = await req.json();

        if (!jurisdiction_code || typeof jurisdiction_code !== 'string') {
            return NextResponse.json({ error: 'jurisdiction_code is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get home jurisdiction
        const { data: homeData } = await supabase.rpc('get_jurisdiction_drawer', {
            p_jurisdiction_code: jurisdiction_code,
        });

        // Get neighbor jurisdictions
        const neighbors = US_NEIGHBORS[jurisdiction_code] || [];
        const neighborPromises = neighbors.slice(0, 4).map(n =>
            supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: n })
        );
        const neighborResults = await Promise.all(neighborPromises);

        // Build prefetch payload
        const payload: Record<string, any> = {
            [jurisdiction_code]: homeData,
        };
        neighbors.slice(0, 4).forEach((n, i) => {
            const result = neighborResults[i];
            if (result.data) {
                payload[n] = result.data;
            }
        });

        return NextResponse.json({
            home: jurisdiction_code,
            prefetched_count: Object.keys(payload).length,
            jurisdictions: payload,
        });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
