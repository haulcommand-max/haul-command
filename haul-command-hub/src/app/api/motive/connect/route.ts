/**
 * Motive Connect — Initiates OAuth flow
 * 
 * GET /api/motive/connect?provider_id=...
 *
 * Redirects the operator to Motive's OAuth authorization page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMotiveConnectURL } from '@/lib/motive/oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('provider_id');

  if (!providerId) {
    return NextResponse.json({ error: 'Missing provider_id' }, { status: 400 });
  }

  const connectUrl = generateMotiveConnectURL(providerId);
  return NextResponse.redirect(connectUrl);
}
