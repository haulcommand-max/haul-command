import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'conversation_summary_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public conversation summarization is disabled until participant ownership, model provider policy, and redacted storage are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'conversation_summary_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public conversation summaries are disabled until participant ownership and redaction policies are enforced.',
    },
    { status: 501 },
  );
}
