// app/api/market/mode/route.ts
// Returns the current market mode for a given market_key
// Used by UrgentMarketSponsor client-side
// GET /api/market/mode?key=us-texas-houston

import { NextRequest, NextResponse } from 'next/server';
import { getMarketState, MODE_POLICIES } from '@/lib/swarm/market-mode-governor';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key param' }, { status: 400 });
  }

  try {
    const state = await getMarketState(key);

    if (!state) {
      // Unknown market → default seeding (launch sponsorship)
      return NextResponse.json({
        mode: 'seeding',
        policy: MODE_POLICIES.seeding,
        market_key: key,
        source: 'default',
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    return NextResponse.json({
      mode: state.mode,
      policy: MODE_POLICIES[state.mode],
      market_key: key,
      supply_count: state.supply_count,
      demand_signals_30d: state.demand_signals_30d,
      fill_rate_30d: state.fill_rate_30d,
      last_evaluated: state.last_evaluated,
      source: 'live',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('[/api/market/mode]', err);
    // Always return a valid mode — never break the UI
    return NextResponse.json({
      mode: 'live',
      policy: MODE_POLICIES.live,
      market_key: key,
      source: 'fallback',
    });
  }
}
