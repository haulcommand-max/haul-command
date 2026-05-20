import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireInternalRequest } from '@/lib/security/internal-request-auth';

// Vercel cron-triggered: daily at 06:00 UTC
// Checks standing orders, auto-dispatches due ones
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  try {
    // Dispatch standing orders
    const dispatchRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/standing-orders/dispatch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await dispatchRes.json();

    return NextResponse.json({
      job: 'daily-dispatch',
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
