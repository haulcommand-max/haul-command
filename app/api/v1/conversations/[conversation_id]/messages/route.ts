import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'conversation_message_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public conversation messages are disabled until participant ownership, spam controls, moderation, and private-message RLS are enforced.',
    },
    { status: 501 },
  );
}
