/**
 * Motive OAuth Callback — HAUL COMMAND
 *
 * POST https://haulcommand.com/api/motive/oauth-callback
 *
 * Motive redirects here after user approves the connection.
 * We exchange the authorization code for tokens and store them.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeMotiveCode } from '@/lib/motive/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { MotiveOAuthState } from '@/types/motive';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle denial
  if (error) {
    console.error('[Motive OAuth] User denied access:', error);
    return NextResponse.redirect(
      new URL('/settings/integrations?error=motive_denied', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=no_code', request.url)
    );
  }

  // Decode state
  let state: MotiveOAuthState;
  try {
    state = JSON.parse(
      Buffer.from(stateParam || '', 'base64url').toString('utf-8')
    );
  } catch {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=invalid_state', request.url)
    );
  }

  if (!state.profile_id) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=no_profile', request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeMotiveCode(code);
    const expiresAt = new Date(
      tokens.created_at * 1000 + tokens.expires_in * 1000
    ).toISOString();

    const supabase = getSupabaseAdmin();

    // Upsert connection (one Motive connection per profile)
    const { error: dbError } = await supabase
      .from('motive_connections')
      .upsert(
        {
          profile_id: state.profile_id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          scope: tokens.scope,
          expires_at: expiresAt,
          status: 'active',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      );

    if (dbError) {
      console.error('[Motive OAuth] DB error:', dbError);
      return NextResponse.redirect(
        new URL('/settings/integrations?error=db_error', request.url)
      );
    }

    console.log(`[Motive OAuth] Connected profile ${state.profile_id}`);

    // Redirect to success page
    const returnUrl = state.return_url || '/settings/integrations';
    return NextResponse.redirect(
      new URL(`${returnUrl}?motive=connected`, request.url)
    );
  } catch (err: any) {
    console.error('[Motive OAuth] Token exchange error:', err.message);
    return NextResponse.redirect(
      new URL('/settings/integrations?error=token_exchange', request.url)
    );
  }
}
