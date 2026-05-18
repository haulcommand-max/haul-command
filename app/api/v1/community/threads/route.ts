import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'community_thread_create_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public community thread creation is disabled until identity, moderation, rate limits, and spam controls are enforced.',
    },
    { status: 501 },
  );
}
