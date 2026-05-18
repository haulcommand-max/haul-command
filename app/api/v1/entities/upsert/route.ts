import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'entity_upsert_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public entity upsert is disabled until tenant API-key auth, dedupe policy, private-field handling, and verification provenance are enforced.',
    },
    { status: 501 },
  );
}
