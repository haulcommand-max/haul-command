import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'skills_catalog_not_available',
      status: 'requires_public_api_contract',
      message:
        'Public skills catalog is disabled until the catalog uses an RLS-backed public projection and documented API contract.',
    },
    { status: 501 },
  );
}
