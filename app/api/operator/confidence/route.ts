/**
 * GET /api/operator/confidence?operatorId=...&corridor=...
 * Returns full Broker Confidence Report for an operator.
 * Public read — brokers need this data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { BrokerConfidenceEngine } from '@/core/social/broker_confidence_engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');
    if (!operatorId) {
        return NextResponse.json({ error: 'operatorId required' }, { status: 400 });
    }

    const corridor = req.nextUrl.searchParams.get('corridor') ?? undefined;

    const admin = getSupabaseAdmin();

    const engine = new BrokerConfidenceEngine(admin);
    const report = await engine.generateReport(operatorId, corridor);

    return NextResponse.json(report);
}
