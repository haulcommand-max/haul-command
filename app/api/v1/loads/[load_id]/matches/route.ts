import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'load_matches_not_available',
      status: 'requires_marketplace_api_contract',
      message:
        'Public load-match output is disabled until load ownership, provider privacy, and marketplace API-key policies are enforced.',
    },
    { status: 501 },
  );
}
