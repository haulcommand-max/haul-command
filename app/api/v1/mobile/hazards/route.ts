import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'mobile_hazard_ingest_not_available',
      status: 'requires_mobile_auth_contract',
      message:
        'Mobile hazard ingest is disabled until verified-device auth, operator ownership, anti-spam controls, and location privacy policies are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'mobile_hazard_feed_not_available',
      status: 'requires_mobile_auth_contract',
      message:
        'Mobile hazard feed is disabled until nearby hazard output is redacted and protected by verified-device auth.',
    },
    { status: 501 },
  );
}
