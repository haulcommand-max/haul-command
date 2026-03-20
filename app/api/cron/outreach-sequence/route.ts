/**
 * /api/cron/outreach-sequence — Daily cron to advance operators through 3-email drip
 * Runs daily, processes up to 50 operators per batch
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

  try {
    // Call the sequence endpoint internally
    const res = await fetch(`${siteUrl}/api/outreach/sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ limit: 50 }),
    });

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      cron: 'outreach-sequence',
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
