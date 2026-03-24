import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// POST /api/permits/quote
// Body: { state, permit_type, dimensions }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { states, permit_type = 'oversize', dimensions } = body;

  if (!states?.length || !dimensions) {
    return NextResponse.json({ error: 'states array and dimensions are required' }, { status: 400 });
  }

  const PRICING: Record<string, Record<string, number>> = {
    single: { oversize: 2999, oilfield: 3499, annual: 7500 },
    multi: { oversize: 1499, oilfield: 2499, annual: 5000 }, // per state 3+
    rush: { oversize: 4999, oilfield: 5999, annual: 7500 },
  };

  const stateCount = states.length;
  const isRush = body.rush === true;
  const tierKey = isRush ? 'rush' : stateCount >= 3 ? 'multi' : 'single';
  const pricePerState = PRICING[tierKey]?.[permit_type] ?? PRICING.single.oversize;
  const totalCents = pricePerState * stateCount;

  const lineItems = (states as string[]).map(state => ({
    state: state.toUpperCase(),
    permit_type,
    amount_cents: pricePerState,
    description: `${state.toUpperCase()} ${permit_type} permit${isRush ? ' (rush)' : ''}`,
  }));

  return NextResponse.json({
    states,
    permit_type,
    line_items: lineItems,
    subtotal_cents: totalCents,
    processing_fee_cents: Math.round(totalCents * 0.029 + 30),
    total_cents: Math.round(totalCents * 1.029 + 30),
    pricing_tier: tierKey,
    estimated_processing_days: isRush ? 1 : 3,
  });
}
