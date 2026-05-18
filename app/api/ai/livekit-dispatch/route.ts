import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'livekit_dispatch_not_available',
      status: 'requires_consent_and_internal_dispatch_contract',
      message:
        'Automated outbound calling is disabled until the dispatch queue enforces consent, internal authorization, and auditable call attempts.',
    },
    { status: 501 },
  );
}
