/**
 * Motive API Client — HAUL COMMAND
 *
 * Handles OAuth 2.0 flow and authenticated API requests to Motive.
 * Docs: https://developer.gomotive.com/reference
 *
 * OAuth flow:
 * 1. User clicks "Connect Motive" → redirect to Motive authorize URL
 * 2. User approves → Motive redirects to our callback with ?code=
 * 3. We exchange code for access_token + refresh_token
 * 4. Store tokens in Supabase `motive_connections` table
 * 5. Use access_token for all API calls, auto-refresh when expired
 */

import type { MotiveOAuthTokens, MotiveOAuthState } from '@/types/motive';

// ═══ Constants ═══
const MOTIVE_AUTH_BASE = 'https://gomotive.com';
const MOTIVE_API_BASE = 'https://api.gomotive.com';

// ═══ Environment ═══
function getClientId(): string {
  const id = process.env.MOTIVE_CLIENT_ID;
  if (!id) throw new Error('Missing MOTIVE_CLIENT_ID');
  return id;
}

function getClientSecret(): string {
  const secret = process.env.MOTIVE_CLIENT_SECRET;
  if (!secret) throw new Error('Missing MOTIVE_CLIENT_SECRET');
  return secret;
}

function getRedirectUri(): string {
  return (
    process.env.NEXT_PUBLIC_MOTIVE_REDIRECT_URI ||
    'https://haulcommand.com/api/motive/oauth-callback'
  );
}

// ═══ OAuth URL Builder ═══

/** Build the Motive OAuth authorize URL */
export function buildMotiveAuthorizeUrl(state: MotiveOAuthState): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'users.read vehicles.read vehicle_locations.read hos_logs.read inspections.read fault_codes.read ifta.read freight_visibility.read',
    state: Buffer.from(JSON.stringify(state)).toString('base64url'),
  });
  return `${MOTIVE_AUTH_BASE}/oauth/authorize?${params.toString()}`;
}

// ═══ Token Exchange ═══

/** Exchange authorization code for access + refresh tokens */
export async function exchangeMotiveCode(
  code: string
): Promise<MotiveOAuthTokens> {
  const res = await fetch(`${MOTIVE_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Motive token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
}

/** Refresh an expired access token */
export async function refreshMotiveToken(
  refreshToken: string
): Promise<MotiveOAuthTokens> {
  const res = await fetch(`${MOTIVE_AUTH_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Motive token refresh failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ═══ Authenticated API Requests ═══

export interface MotiveRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string>;
  body?: Record<string, unknown>;
}

/** Make an authenticated request to the Motive API */
export async function motiveApiRequest<T = unknown>(
  accessToken: string,
  endpoint: string,
  options: MotiveRequestOptions = {}
): Promise<T> {
  const { method = 'GET', params, body } = options;

  let url = `${MOTIVE_API_BASE}${endpoint}`;
  if (params) {
    const search = new URLSearchParams(params);
    url += `?${search.toString()}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Client-App': 'HaulCommand/1.0',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Motive API ${method} ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ═══ Convenience Methods ═══

export async function getMotiveUsers(accessToken: string, page = 1) {
  return motiveApiRequest(accessToken, '/v1/users', {
    params: { page_no: String(page), per_page: '100' },
  });
}

export async function getMotiveVehicles(accessToken: string, page = 1) {
  return motiveApiRequest(accessToken, '/v1/vehicles', {
    params: { page_no: String(page), per_page: '100' },
  });
}

export async function getMotiveVehicleLocations(accessToken: string) {
  return motiveApiRequest(accessToken, '/v1/vehicle_locations');
}

export async function getMotiveHosLogs(
  accessToken: string,
  driverId: number,
  startDate: string,
  endDate: string
) {
  return motiveApiRequest(accessToken, `/v1/hos_logs`, {
    params: {
      driver_ids: String(driverId),
      start_date: startDate,
      end_date: endDate,
      per_page: '100',
    },
  });
}

export async function getMotiveInspections(accessToken: string, page = 1) {
  return motiveApiRequest(accessToken, '/v1/inspection_reports', {
    params: { page_no: String(page), per_page: '100' },
  });
}

export async function getMotiveFaultCodes(accessToken: string, page = 1) {
  return motiveApiRequest(accessToken, '/v1/fault_codes', {
    params: { page_no: String(page), per_page: '100' },
  });
}

export async function getMotiveIftaTrips(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  return motiveApiRequest(accessToken, '/v1/ifta/trips', {
    params: { start_date: startDate, end_date: endDate },
  });
}
