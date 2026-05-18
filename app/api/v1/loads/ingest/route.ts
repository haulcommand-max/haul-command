import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'load_ingest_not_available',
      status: 'requires_source_api_contract',
      message:
        'Public load ingest is disabled until source API keys, dedupe provenance, payload validation, and tenant ownership are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'load_detail_not_available',
      status: 'requires_source_api_contract',
      message:
        'Public load detail is disabled until load ownership, marketplace visibility, and private-field redaction policies are enforced.',
    },
    { status: 501 },
  );
}
