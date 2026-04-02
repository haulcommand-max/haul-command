// ══════════════════════════════════════════════════════════════
// API: /api/paywall/evaluate — Check if paywall should show
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { evaluatePaywallWithFlags, evaluatePagePaywall } from '@/lib/monetization/paywall-gate';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      entity_id,
      user_type,
      current_tier,
      usage,
      page_type,
      mode,
    } = body;

    if (!entity_id) {
      return NextResponse.json(
        { error: 'Missing required: entity_id' },
        { status: 400 }
      );
    }

    // Mode 1: Full evaluation with monetization_flags merge
    if (mode === 'full' && usage) {
      const decision = await evaluatePaywallWithFlags({
        entity_id,
        user_type: user_type || 'escort',
        current_tier: current_tier || 'free',
        usage: {
          searches: usage.searches ?? 0,
          leads: usage.leads ?? 0,
          routes: usage.routes ?? 0,
          daysActive: usage.daysActive ?? 0,
        },
      });

      return NextResponse.json(decision);
    }

    // Mode 2: Page-level quick check
    const result = await evaluatePagePaywall({
      entity_id,
      page_type: page_type || 'directory_listing',
      user_type: user_type || 'escort',
      current_tier: current_tier || 'free',
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[api/paywall/evaluate] Error:', e.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
