import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Vercel cron-triggered: daily at 06:00 UTC
// Checks standing orders, auto-dispatches due ones
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron auth
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
