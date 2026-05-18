import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'seo_surface_generation_not_available',
      status: 'requires_internal_content_contract',
      message:
        'Public SEO surface generation is disabled until internal authorization, quality gates, noindex policy, and generation-audit controls are enforced.',
    },
    { status: 501 },
  );
}
