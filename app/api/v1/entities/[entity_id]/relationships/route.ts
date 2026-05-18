import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'entity_relationship_write_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public entity relationship writes are disabled until tenant authorization, provenance, moderation, and graph integrity policies are enforced.',
    },
    { status: 501 },
  );
}
