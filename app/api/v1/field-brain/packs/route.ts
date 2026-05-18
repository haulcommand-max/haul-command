import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'offline_packs_not_available',
      status: 'requires_public_mobile_contract',
      message:
        'Public offline-pack listing is disabled until published packs are exposed through an RLS-backed mobile projection.',
    },
    { status: 501 },
  );
}
