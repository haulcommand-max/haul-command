import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'glossary_term_write_not_available',
      status: 'requires_internal_content_contract',
      message:
        'Public glossary writes are disabled until internal authorization, source citation, v115 quality gates, and moderation policies are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'glossary_term_detail_not_available',
      status: 'requires_public_content_contract',
      message:
        'Public glossary v1 detail is disabled until it uses the canonical glossary renderer and RLS-backed published projection.',
    },
    { status: 501 },
  );
}
