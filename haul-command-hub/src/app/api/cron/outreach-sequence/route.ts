import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/outreach-sequence
 * 
 * Daily cron (9am UTC) — triggers the outreach sequence processor.
 * Configured in vercel.json as a cron job.
 * 
 * Calls /api/outreach/sequence internally to advance all operators
 * through the 3-email drip.
 */

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

export async function GET(request: NextRequest) {
  // Verify cron authorization (Vercel Cron or manual trigger)
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-vercel-cron-secret');

  if (!authHeader?.includes(CRON_KEY) && !cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

    // Call the sequence processor
    const res = await fetch(`${siteUrl}/api/outreach/sequence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await res.json();

    console.log('📧 Daily outreach cron:', JSON.stringify(result));

    return NextResponse.json({
      cron: 'outreach-sequence',
      ran_at: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
