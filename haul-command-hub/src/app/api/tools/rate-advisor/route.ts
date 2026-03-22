/**
 * POST /api/tools/rate-advisor
 *
 * Returns corridor-specific rate recommendations.
 * Uses corridor benchmarks, seasonal patterns, and supply/demand signals.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Corridor Rate Intelligence ───────────────────────────────
const CORRIDOR_DATA: Record<string, { baseRate: number; supplyDemand: number; seasonalMultiplier: number }> = {
  'I-10 Texas Triangle':      { baseRate: 380, supplyDemand: 1.15, seasonalMultiplier: 1.1 },
  'I-95 East Coast':          { baseRate: 400, supplyDemand: 0.95, seasonalMultiplier: 1.0 },
  'I-5 West Coast':           { baseRate: 420, supplyDemand: 1.05, seasonalMultiplier: 1.05 },
  'I-40 Cross Country':       { baseRate: 370, supplyDemand: 1.0,  seasonalMultiplier: 1.0 },
  'I-20 Southern Corridor':   { baseRate: 360, supplyDemand: 1.1,  seasonalMultiplier: 1.05 },
  'I-70 Midwest':             { baseRate: 355, supplyDemand: 0.9,  seasonalMultiplier: 0.95 },
  'I-80 Northern Route':      { baseRate: 365, supplyDemand: 0.85, seasonalMultiplier: 0.9 },
  'I-35 Central':             { baseRate: 375, supplyDemand: 1.08, seasonalMultiplier: 1.0 },
  'Oklahoma Wind Belt':       { baseRate: 450, supplyDemand: 1.3,  seasonalMultiplier: 1.2 },
  'Gulf Coast Industrial':    { baseRate: 395, supplyDemand: 1.2,  seasonalMultiplier: 1.1 },
  'Great Lakes Loop':         { baseRate: 350, supplyDemand: 0.88, seasonalMultiplier: 0.9 },
  'Pacific Northwest':        { baseRate: 410, supplyDemand: 1.02, seasonalMultiplier: 1.0 },
};

const LOAD_TYPE_MULTIPLIER: Record<string, number> = {
  'Wind Blade': 1.25,
  'Transformer': 1.3,
  'Modular Building': 1.15,
  'Bridge Beam': 1.2,
  'Construction Equipment': 1.0,
  'Generator': 1.1,
  'Military': 1.15,
  'Standard Oversize': 1.0,
};

function getCorridorStatus(supplyDemand: number): 'hot' | 'warm' | 'cool' {
  if (supplyDemand >= 1.15) return 'hot';
  if (supplyDemand >= 0.9) return 'warm';
  return 'cool';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { corridor, loadType, distance } = body;

    const data = CORRIDOR_DATA[corridor] ?? { baseRate: 375, supplyDemand: 1.0, seasonalMultiplier: 1.0 };
    const loadMultiplier = LOAD_TYPE_MULTIPLIER[loadType] ?? 1.0;
    const distanceMiles = parseFloat(distance) || 200;

    // Distance adjustment: longer runs get slightly lower per-day rate due to multi-day commitment
    const distanceAdj = distanceMiles > 500 ? 0.95 : distanceMiles > 300 ? 0.98 : 1.0;

    const base = data.baseRate * loadMultiplier * data.seasonalMultiplier * distanceAdj;
    const demandAdj = data.supplyDemand;

    const rateMid = Math.round(base * demandAdj);
    const rateLow = Math.round(rateMid * 0.85);
    const rateHigh = Math.round(rateMid * 1.15);
    const negotiateCeiling = Math.round(rateMid * 1.25);

    const corridorStatus = getCorridorStatus(demandAdj);

    // Generate reasons
    const reasons: string[] = [];
    if (corridorStatus === 'hot') {
      reasons.push(`${corridor} is showing shortage signals — demand exceeds supply by ${Math.round((demandAdj - 1) * 100)}%`);
    } else if (corridorStatus === 'cool') {
      reasons.push(`${corridor} has surplus operators — rates are competitive`);
    } else {
      reasons.push(`${corridor} is at normal capacity — standard market rates apply`);
    }

    if (loadMultiplier > 1.1) {
      reasons.push(`${loadType} loads command a ${Math.round((loadMultiplier - 1) * 100)}% premium due to specialized equipment and complexity`);
    }

    if (distanceMiles > 300) {
      reasons.push(`At ${distanceMiles} miles, multi-day commitment allows slight rate negotiation from operators seeking steady work`);
    } else {
      reasons.push(`Short-haul runs under 300 miles typically command premium day rates due to repositioning costs`);
    }

    const isPro = false; // Default free — Pro gating on client

    return NextResponse.json({
      rateLow,
      rateMid,
      rateHigh,
      negotiateCeiling,
      corridorStatus,
      reasons,
      isPro,
    });
  } catch (err) {
    console.error('[Rate Advisor] Error:', err);
    return NextResponse.json({ error: 'Rate advisory failed' }, { status: 500 });
  }
}
