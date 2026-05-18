import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'entity_alias_write_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public entity alias writes are disabled until tenant authorization, provenance, moderation, and dedupe policies are enforced.',
    },
    { status: 501 },
  );
}
