// ═══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE API — Rate Index (Carvana-Style)
// GET /api/enterprise/rates/index
//
// Query params:
//   country    — ISO country code (required)
//   rate       — the rate to evaluate (required)
//   service    — service type (optional, default: pilot_car_general)
//
// Returns: Carvana-style badge, index score, trend, comparison text
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { RateIndexEngine } from '@/lib/pricing/global-rate-index';
import { enterpriseGate, shapeResponse } from '@/lib/enterprise/auth-middleware';
import type { ServiceType } from '@/lib/pricing/global-rate-index';

export async function GET(req: NextRequest) {
    // Enterprise auth gate
    const gate = await enterpriseGate(req, 'pricing_intelligence');
    if (gate.error) return gate.error;
    const ctx = gate.context!;

    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country')?.toUpperCase();
    const rate = parseFloat(searchParams.get('rate') || '');
    const service = (searchParams.get('service') || 'pilot_car_general') as ServiceType;

    if (!country || isNaN(rate)) {
        return NextResponse.json(
            { error: 'Missing required params: country, rate' },
            { status: 400 },
        );
    }

    const result = RateIndexEngine.computeIndex(rate, country, service);
    if (!result) {
        return NextResponse.json(
            { error: `No rate data available for country: ${country}` },
            { status: 404 },
        );
    }

    // Shape response based on tier
    const shaped = shapeResponse(
        [result as unknown as Record<string, unknown>],
        ctx,
        'pricing_intelligence',
    );

    const response = NextResponse.json({
        data: shaped[0],
        meta: {
            country,
            service,
            query_rate: rate,
            tier: ctx.tier,
            timestamp: new Date().toISOString(),
        },
    });

    response.headers.set('x-rows-returned', '1');
    return response;
}
