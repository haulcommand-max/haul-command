import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'adgrid_campaign_detail_not_available',
      status: 'requires_advertiser_api_contract',
      message:
        'Public AdGrid campaign detail is disabled until advertiser ownership, budget redaction, and API-key policies are enforced.',
    },
    { status: 501 },
  );
}
