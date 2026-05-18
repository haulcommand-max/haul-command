import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'adgrid_campaign_create_not_available',
      status: 'requires_advertiser_api_contract',
      message:
        'Public AdGrid campaign creation is disabled until advertiser ownership, billing state, budget validation, and API-key policies are enforced.',
    },
    { status: 501 },
  );
}
