import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'seo_surface_detail_not_available',
      status: 'requires_public_content_contract',
      message:
        'Public SEO surface detail is disabled until draft status, model cost, and unpublished content fields are redacted.',
    },
    { status: 501 },
  );
}
