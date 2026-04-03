/**
 * POST /api/route/analyze — Route Intelligence API
 *
 * Wires the route-intelligence-engine (20KB, 331 lines) to a public API surface.
 * Given origin, destination, states crossed, and load dimensions,
 * returns full segment-by-segment escort/permit/restriction analysis.
 *
 * Used by:
 *   - /estimate page for corridor cost breakdowns
 *   - Corridor pages for "analyze a load on this corridor" widget
 *   - Programmatic /route/[origin]-to-[destination] pages
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    analyzeRoute,
    type LoadDimensions,
} from '@/lib/routes/route-intelligence-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            origin,
            destination,
            states_crossed,
            load,
            segment_distances,
        } = body as {
            origin: string;
            destination: string;
            states_crossed: string[];
            load: LoadDimensions;
            segment_distances?: number[];
        };

        if (!origin || !destination || !states_crossed?.length || !load) {
            return NextResponse.json(
                { error: 'origin, destination, states_crossed[], and load{} are required' },
                { status: 400 }
            );
        }

        if (!load.widthM || !load.heightM || !load.lengthM || !load.weightT) {
            return NextResponse.json(
                { error: 'load must include widthM, heightM, lengthM, weightT' },
                { status: 400 }
            );
        }

        const result = analyzeRoute(
            origin,
            destination,
            states_crossed,
            load,
            segment_distances
        );

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (err) {
        console.error('[route-analyze] error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
