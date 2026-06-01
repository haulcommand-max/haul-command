/**
 * POST /api/loads/emergency-fill
 *
 * Compatibility guard for the retired load-scoped emergency fill endpoint.
 * Emergency fill is a paid escalation and must run through the canonical
 * checkout/webhook path before any dispatch or notifications are sent.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let loadId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const candidate = body?.load_id ?? body?.loadId;
    loadId = typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  } catch {
    loadId = null;
  }

  return NextResponse.json({
    error: 'Emergency Fill is a paid escalation and must be activated by the canonical checkout/webhook path before notifications are sent.',
    requires_checkout: true,
    canonical_route: '/api/emergency-fill',
    checkout_route: '/api/stripe/emergency-fill',
    load_id: loadId,
  }, { status: 402 });
}
