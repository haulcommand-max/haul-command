import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'community_post_create_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public community posts are disabled until identity, moderation, rate limits, spam controls, and thread ownership policies are enforced.',
    },
    { status: 501 },
  );
}
