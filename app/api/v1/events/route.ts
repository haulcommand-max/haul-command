import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'event_ingest_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public domain-event ingest is disabled until API keys, tenant scoping, idempotency ownership, and event-schema validation are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'event_status_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public event status is disabled until event ownership and redaction policies are enforced.',
    },
    { status: 501 },
  );
}
