import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'leaderboard_detail_not_available',
      status: 'requires_public_ranking_contract',
      message:
        'Public leaderboard detail is disabled until rank data is served from an RLS-backed public projection with anti-gaming redaction.',
    },
    { status: 501 },
  );
}
