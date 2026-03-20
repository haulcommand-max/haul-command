/**
 * Motive OAuth Callback Handler
 *
 * GET /api/motive/oauth-callback?code=...&state=...
 *
 * Called after an operator authorizes Haul Command in the Motive OAuth flow.
 * Exchanges the code for tokens, pulls initial fleet data, and redirects
 * back to the HC onboarding page with success/error status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleMotiveOAuthCallback } from '@/lib/motive/oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

  // Handle OAuth denial
  if (error) {
    const errorDesc = searchParams.get('error_description') || 'Authorization denied';
    return NextResponse.redirect(
      `${baseUrl}/onboarding/motive-connect?status=error&message=${encodeURIComponent(errorDesc)}`,
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/onboarding/motive-connect?status=error&message=${encodeURIComponent('Missing authorization code')}`,
    );
  }

  // Process the callback
  const result = await handleMotiveOAuthCallback(code, state);

  if (result.success) {
    const params = new URLSearchParams({
      status: 'success',
      company: result.company_name || '',
      fleet_size: String(result.fleet_size || 0),
      provider_id: result.provider_id,
    });
    return NextResponse.redirect(`${baseUrl}/onboarding/motive-connect?${params.toString()}`);
  }

  return NextResponse.redirect(
    `${baseUrl}/onboarding/motive-connect?status=error&message=${encodeURIComponent(result.error || 'Connection failed')}`,
  );
}
