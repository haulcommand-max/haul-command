import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'adgrid_recommendations_not_available',
      status: 'requires_advertiser_api_contract',
      message:
        'Public AdGrid recommendations are disabled until advertiser ownership, campaign visibility, and recommendation redaction policies are enforced.',
    },
    { status: 501 },
  );
}
