import { NextResponse } from 'next/server';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId');

  // When a user link expires during onboarding, retry redirecting them to onboard.
  // Assuming a UI flow will handle this providerId logic and kick off onboard again.
  return NextResponse.redirect(`${SITE_URL}/dashboard/financials?refresh_onboarding=true&provider_id=${providerId}`);
}
