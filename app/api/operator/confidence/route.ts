/**
 * GET /api/operator/confidence?operatorId=...&corridor=...
 * Returns full Broker Confidence Report for an operator.
 * Public read — brokers need this data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BrokerConfidenceEngine } from '@/core/social/broker_confidence_engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');
    if (!operatorId) {
        return NextResponse.json({ error: 'operatorId required' }, { status: 400 });
    }

    const corridor = req.nextUrl.searchParams.get('corridor') ?? undefined;

    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const engine = new BrokerConfidenceEngine(admin);
    const report = await engine.generateReport(operatorId, corridor);

    return NextResponse.json(report);
}
