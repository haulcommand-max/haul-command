import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'entity_detail_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public entity detail is disabled until private-field redaction, tenant authorization, and RLS-backed read contracts are enforced.',
    },
    { status: 501 },
  );
}
