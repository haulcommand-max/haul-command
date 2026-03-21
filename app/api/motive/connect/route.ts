/**
 * Motive Connect — Initiate OAuth Flow
 *
 * GET /api/motive/connect?profile_id=xxx&return_url=/dashboard
 *
 * Redirects the user to Motive's OAuth authorize page.
 * After approval, Motive redirects to /api/motive/oauth-callback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildMotiveAuthorizeUrl } from '@/lib/motive/client';
import type { MotiveOAuthState } from '@/types/motive';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const profileId = searchParams.get('profile_id');
  const returnUrl = searchParams.get('return_url') || '/settings/integrations';

  if (!profileId) {
    return NextResponse.json(
      { error: 'Missing profile_id parameter' },
      { status: 400 }
    );
  }

  const state: MotiveOAuthState = {
    profile_id: profileId,
    return_url: returnUrl,
  };

  const authorizeUrl = buildMotiveAuthorizeUrl(state);
  return NextResponse.redirect(authorizeUrl);
}
