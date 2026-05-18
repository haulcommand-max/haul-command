import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'conversation_create_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public conversation creation is disabled until participant ownership, spam controls, moderation, and private-message RLS are enforced.',
    },
    { status: 501 },
  );
}
