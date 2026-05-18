import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'glossary_localization_write_not_available',
      status: 'requires_internal_content_contract',
      message:
        'Public glossary localization writes are disabled until internal authorization, country review, source citation, and translation quality gates are enforced.',
    },
    { status: 501 },
  );
}
