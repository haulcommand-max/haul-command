/**
 * Motive OAuth2 Flow Helpers
 *
 * Handles the operator-facing "Connect your ELD" flow.
 * After OAuth, stores tokens in Supabase and links to the HC provider record.
 */

import { getMotiveOAuthURL, exchangeMotiveCode, MotiveClient } from './client';
import { supabaseServer } from '@/lib/supabase-server';

const OAUTH_REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com'}/api/motive/oauth-callback`;

// ═══════════════════════════════════════════════════════════════
// Generate Connect URL
// ═══════════════════════════════════════════════════════════════

/**
 * Generate the "Connect Motive" URL for an operator.
 * State includes the HC provider_id so we can link after callback.
 */
export function generateMotiveConnectURL(providerId: string): string {
  const state = Buffer.from(JSON.stringify({
    provider_id: providerId,
    ts: Date.now(),
  })).toString('base64url');

  return getMotiveOAuthURL(OAUTH_REDIRECT_URI, state);
}

/**
 * Parse the state parameter from the OAuth callback.
 */
export function parseMotiveOAuthState(state: string): { provider_id: string; ts: number } | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (!parsed.provider_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Handle OAuth Callback
// ═══════════════════════════════════════════════════════════════

export interface MotiveConnectResult {
  success: boolean;
  provider_id: string;
  motive_company_id?: string;
  company_name?: string;
  fleet_size?: number;
  error?: string;
}

/**
 * Complete the OAuth flow:
 * 1. Exchange code for tokens
 * 2. Identify the Motive company
 * 3. Pull initial fleet data
 * 4. Store tokens in Supabase
 * 5. Update the HC provider record with Motive data
 */
export async function handleMotiveOAuthCallback(
  code: string,
  state: string,
): Promise<MotiveConnectResult> {
  // Parse state to get provider_id
  const stateData = parseMotiveOAuthState(state);
  if (!stateData) {
    return { success: false, provider_id: '', error: 'Invalid OAuth state' };
  }

  const { provider_id } = stateData;

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await exchangeMotiveCode(code, OAUTH_REDIRECT_URI);

    // 2. Create client and identify company
    const client = new MotiveClient(tokenResponse.access_token);
    const companyRes = await client.getCompany();
    const company = companyRes.company;

    // 3. Pull initial fleet data
    const vehiclesRes = await client.listVehicles({ per_page: 100, status: 'active' });
    const fleetSize = vehiclesRes.vehicles?.length ?? 0;

    // 4. Pull initial safety scores
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let safetyScore: number | null = null;
    try {
      const scorecardRes = await client.listScorecardSummaries({
        start_date: thirtyDaysAgo.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
      });
      if (scorecardRes.scorecard_summaries?.length) {
        const scores = scorecardRes.scorecard_summaries.map((s) => s.scorecard_summary.total_score);
        safetyScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    } catch {
      // Safety scores are non-critical — proceed without them
      console.warn('[Motive OAuth] Could not fetch initial safety scores');
    }

    // 5. Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();

    // 6. Store tokens in Supabase
    const sb = supabaseServer();

    await sb.from('motive_tokens').upsert({
      provider_id,
      motive_company_id: String(company.id),
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: expiresAt,
      scope: tokenResponse.scope,
      company_name: company.name,
      dot_number: company.dot_number,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider_id' });

    // 7. Update the HC provider record
    await sb.from('providers').update({
      motive_company_id: String(company.id),
      motive_connected_at: new Date().toISOString(),
      motive_fleet_size: fleetSize,
      motive_safety_score: safetyScore,
      motive_last_synced_at: new Date().toISOString(),
    }).eq('id', provider_id);

    // 8. Seed initial vehicle positions
    if (vehiclesRes.vehicles?.length) {
      const positions = vehiclesRes.vehicles
        .filter((v) => v.vehicle.current_location?.lat && v.vehicle.current_location?.lon)
        .map((v) => ({
          motive_vehicle_id: String(v.vehicle.id),
          provider_id,
          lat: v.vehicle.current_location!.lat,
          lng: v.vehicle.current_location!.lon,
          heading: v.vehicle.current_location!.bearing,
          speed_mph: v.vehicle.current_location!.speed,
          recorded_at: v.vehicle.current_location!.located_at || new Date().toISOString(),
        }));

      if (positions.length) {
        await sb.from('motive_vehicle_positions').insert(positions);
      }
    }

    return {
      success: true,
      provider_id,
      motive_company_id: String(company.id),
      company_name: company.name,
      fleet_size: fleetSize,
    };
  } catch (err) {
    console.error('[Motive OAuth] Callback failed:', err);
    return {
      success: false,
      provider_id,
      error: err instanceof Error ? err.message : 'OAuth callback failed',
    };
  }
}
