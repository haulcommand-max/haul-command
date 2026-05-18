import { NextResponse } from 'next/server';

// Haul Command Trust Preservation Cron
// Task 35: Endpoint triggered by pg_cron or Vercel crons.
// Scans the credential wallet array globally, finds expiring documents 
// and drops trust score mathematically.

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const allowedTokens = [process.env.CRON_SECRET, process.env.INTERNAL_API_KEY]
    .filter(Boolean)
    .map((token) => `Bearer ${token}`);

  if (!authHeader || !allowedTokens.includes(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: 'credential_expiration_sweep_not_available',
      status: 'requires_live_wallet_sweep',
      message:
        'Credential expiration trust updates are held until the route writes real wallet rows and audit events instead of simulated metrics.',
    },
    { status: 501 },
  );
}
