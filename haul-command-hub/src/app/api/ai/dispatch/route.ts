import { NextResponse } from 'next/server';
import { runDispatcherAgent } from '@/lib/engines/dispatcher-agent';

/**
 * POST /api/ai/dispatch
 * Auto-matches loads to the best available operators using the Dispatcher Agent.
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { origin, destination, originState, serviceType, distanceMiles, urgency, brokerId, notes } = body;

    if (!origin || !destination || !originState || !serviceType || !distanceMiles) {
      return NextResponse.json({
        error: 'Required: origin, destination, originState, serviceType, distanceMiles'
      }, { status: 400 });
    }

    const result = await runDispatcherAgent({
      origin,
      destination,
      originState,
      serviceType,
      distanceMiles: Number(distanceMiles),
      urgency: urgency ?? 'normal',
      brokerId,
      notes,
    });

    return NextResponse.json({
      success: true,
      load_id: result.loadId,
      matches: result.matches,
      match_count: result.matches.length,
      surge_active: result.surgeActive,
      corridor_demand_score: result.corridorDemandScore,
      latency_ms: result.estimatedMatchTimeMs,
    });
  } catch (err: any) {
    console.error('[/api/ai/dispatch]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
