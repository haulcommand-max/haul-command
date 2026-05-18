import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'skill_detail_not_available',
      status: 'requires_public_api_contract',
      message:
        'Public skill detail is disabled until contracts are exposed through an RLS-backed public projection and documented API contract.',
    },
    { status: 501 },
  );
}
