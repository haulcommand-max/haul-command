/**
 * /api/cron/outreach-sequence — Daily cron to advance operators through 3-email drip
 * Runs daily, processes up to 50 operators per batch
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { requireInternalRequest, getInternalRequestToken } from '@/lib/security/internal-request-auth';

export async function GET(req: Request) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
  const internalToken = getInternalRequestToken();

  try {
    // Call the sequence endpoint internally
    const res = await fetch(`${siteUrl}/api/outreach/sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(internalToken ? { Authorization: `Bearer ${internalToken}` } : {}),
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
