/**
 * Motive (GoMotive) API Client
 *
 * Typed SDK wrapper for the Motive Open API.
 * Handles OAuth2 token management, rate limiting, retries, and pagination.
 *
 * Base URL: https://api.gomotive.com
 * App ID: 67348
 * Auth: OAuth2 Bearer tokens (per-company, obtained via operator connect flow)
 */

import type {
  MotiveOAuthTokenResponse,
  MotiveCompanyResponse,
  MotiveUsersResponse,
  MotiveVehiclesResponse,
  MotiveVehicleResponse,
  MotiveVehicleLocationsResponse,
  MotiveDriverLocationsResponse,
  MotiveDriversAvailableTimeResponse,
  MotiveHOSLogsResponse,
  MotiveHOSViolationsResponse,
  MotiveFreightVehicleLocationsResponse,
  MotiveFreightSubscribeRequest,
  MotiveFreightSubscribeResponse,
  MotiveNearbyVehiclesResponse,
  MotiveNearbyVehiclesV2Response,
  MotiveFreightCompaniesResponse,
  MotiveFuelPurchasesResponse,
  MotiveIFTATripsResponse,
  MotiveMileageSummaryResponse,
  MotiveScorecardSummaryResponse,
  MotivePerformanceEventsResponse,
  MotiveInspectionReportsResponse,
  MotiveDispatchesResponse,
  MotiveGeofenceEventsResponse,
  MotiveFaultCodesResponse,
  MotiveVehiclesParams,
  MotiveLocationsParams,
  MotiveHOSParams,
  MotiveDriversAvailableTimeParams,
  MotiveFuelPurchasesParams,
  MotiveIFTAParams,
  MotiveScorecardParams,
  MotivePerformanceEventsParams,
  MotiveNearbyVehiclesParams,
  MotiveFreightCompaniesParams,
  MotivePaginationParams,
  MotiveDateRangeParams,
} from './types';

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const MOTIVE_API_BASE = process.env.MOTIVE_API_BASE_URL || 'https://api.gomotive.com';
const MOTIVE_CLIENT_ID = process.env.MOTIVE_CLIENT_ID || '';
const MOTIVE_CLIENT_SECRET = process.env.MOTIVE_CLIENT_SECRET || '';
const MOTIVE_OAUTH_BASE = 'https://api.gomotive.com/oauth';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_PER_PAGE = 25;

// ═══════════════════════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════════════════════

export class MotiveAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public responseBody?: unknown,
  ) {
    super(`Motive API Error [${status}] ${endpoint}: ${message}`);
    this.name = 'MotiveAPIError';
  }
}

export class MotiveRateLimitError extends MotiveAPIError {
  constructor(
    endpoint: string,
    public retryAfterSeconds: number,
  ) {
    super(`Rate limited — retry after ${retryAfterSeconds}s`, 429, endpoint);
    this.name = 'MotiveRateLimitError';
  }
}

// ═══════════════════════════════════════════════════════════════
// Client
// ═══════════════════════════════════════════════════════════════

export class MotiveClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // ─── Internal HTTP ──────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    params?: Record<string, unknown>,
    body?: unknown,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const url = new URL(`${MOTIVE_API_BASE}/${path}`);

        // Add query params for GET requests
        if (params && method === 'GET') {
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
              url.searchParams.set(key, String(value));
            }
          }
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/json',
        };

        let fetchBody: string | undefined;
        if (body && (method === 'POST' || method === 'PUT')) {
          headers['Content-Type'] = 'application/json';
          fetchBody = JSON.stringify(body);
        }

        const res = await fetch(url.toString(), {
          method,
          headers,
          body: fetchBody,
        });

        // Rate limited — extract retry-after and throw
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
          throw new MotiveRateLimitError(path, retryAfter);
        }

        // Server errors — retry
        if (res.status >= 500) {
          const text = await res.text();
          throw new MotiveAPIError(text, res.status, path);
        }

        // Client errors — don't retry
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          throw new MotiveAPIError(
            (errorBody as Record<string, string>).error_description ||
              (errorBody as Record<string, string>).message ||
              `HTTP ${res.status}`,
            res.status,
            path,
            errorBody,
          );
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't retry on client errors (4xx except 429)
        if (err instanceof MotiveAPIError && err.status >= 400 && err.status < 500 && err.status !== 429) {
          throw err;
        }

        // Don't retry on rate limits — let the caller handle it
        if (err instanceof MotiveRateLimitError) {
          throw err;
        }

        // Exponential backoff for retries
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Motive API request failed after retries');
  }

  private async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, undefined, body);
  }

  // ─── Company ────────────────────────────────────────────────

  /** Identify the company associated with this access token */
  async getCompany(): Promise<MotiveCompanyResponse> {
    return this.get<MotiveCompanyResponse>('v1/company');
  }

  // ─── Users / Drivers ───────────────────────────────────────

  /** List all users (drivers, admins, etc.) for the company */
  async listUsers(params?: MotivePaginationParams): Promise<MotiveUsersResponse> {
    return this.get<MotiveUsersResponse>('v1/users', params as Record<string, unknown>);
  }

  // ─── Vehicles ───────────────────────────────────────────────

  /** List all vehicles in the company fleet */
  async listVehicles(params?: MotiveVehiclesParams): Promise<MotiveVehiclesResponse> {
    return this.get<MotiveVehiclesResponse>('v1/vehicles', {
      per_page: DEFAULT_PER_PAGE,
      ...params,
    } as Record<string, unknown>);
  }

  /** Get details of a specific vehicle */
  async getVehicle(vehicleId: number): Promise<MotiveVehicleResponse> {
    return this.get<MotiveVehicleResponse>(`v1/vehicles/${vehicleId}`);
  }

  // ─── Locations (Company Fleet) ──────────────────────────────

  /** List all vehicles and their current locations */
  async listVehicleLocations(params?: MotiveLocationsParams): Promise<MotiveVehicleLocationsResponse> {
    return this.get<MotiveVehicleLocationsResponse>('v3/vehicle_locations', params as Record<string, unknown>);
  }

  /** Get a specific vehicle's location */
  async getVehicleLocation(vehicleId: number): Promise<MotiveVehicleLocationsResponse> {
    return this.get<MotiveVehicleLocationsResponse>(`v3/vehicle_locations/${vehicleId}`);
  }

  /** List all drivers with their locations and vehicle info */
  async listDriverLocations(params?: MotivePaginationParams): Promise<MotiveDriverLocationsResponse> {
    return this.get<MotiveDriverLocationsResponse>('v1/driver_locations', params as Record<string, unknown>);
  }

  // ─── Hours of Service (HOS) ─────────────────────────────────

  /** List drivers with available drive/shift/cycle time */
  async listDriversAvailableTime(params?: MotiveDriversAvailableTimeParams): Promise<MotiveDriversAvailableTimeResponse> {
    return this.get<MotiveDriversAvailableTimeResponse>('v1/available_time', params as Record<string, unknown>);
  }

  /** List HOS logs for drivers */
  async listHOSLogs(params?: MotiveHOSParams): Promise<MotiveHOSLogsResponse> {
    return this.get<MotiveHOSLogsResponse>('v2/hos_logs', params as Record<string, unknown>);
  }

  /** List drivers with HOS violations */
  async listHOSViolations(params?: MotiveHOSParams): Promise<MotiveHOSViolationsResponse> {
    return this.get<MotiveHOSViolationsResponse>('v1/hos_violations', params as Record<string, unknown>);
  }

  // ─── Freight Visibility (Cross-Company) ────────────────────

  /** Get locations of all subscribed vehicles (freight visibility) */
  async listFreightVehicleLocations(): Promise<MotiveFreightVehicleLocationsResponse> {
    return this.get<MotiveFreightVehicleLocationsResponse>('v1/freight_visibility/vehicle_locations');
  }

  /** Subscribe to a vehicle's location for tracking */
  async subscribeToVehicle(request: MotiveFreightSubscribeRequest): Promise<MotiveFreightSubscribeResponse> {
    return this.post<MotiveFreightSubscribeResponse>('v1/freight_visibility/subscribe', request);
  }

  /** Find nearby vehicles using the V2 scoring system (proximity + HOS + direction) */
  async findNearbyVehiclesV2(params: MotiveNearbyVehiclesParams): Promise<MotiveNearbyVehiclesV2Response> {
    return this.get<MotiveNearbyVehiclesV2Response>('v2/freight_visibility/vehicle_association', params as unknown as Record<string, unknown>);
  }

  /** Find nearby vehicles (V1 — proximity only) */
  async findNearbyVehicles(params: MotiveNearbyVehiclesParams): Promise<MotiveNearbyVehiclesResponse> {
    return this.get<MotiveNearbyVehiclesResponse>('v1/freight_visibility/vehicle_association', params as unknown as Record<string, unknown>);
  }

  /** List companies that allow vehicle tracking */
  async listFreightCompanies(params?: MotiveFreightCompaniesParams): Promise<MotiveFreightCompaniesResponse> {
    return this.get<MotiveFreightCompaniesResponse>('v1/freight_visibility/companies', params as Record<string, unknown>);
  }

  /** Check if a specific carrier has consented to tracking */
  async checkCarrierConsent(companyId: string): Promise<{ company_associated: boolean }> {
    return this.get<{ company_associated: boolean }>('v1/freight_visibility/company_associated', { company_id: companyId });
  }

  // ─── Fuel Purchases ─────────────────────────────────────────

  /** List fuel purchases for the company */
  async listFuelPurchases(params?: MotiveFuelPurchasesParams): Promise<MotiveFuelPurchasesResponse> {
    return this.get<MotiveFuelPurchasesResponse>('v1/fuel_purchases', params as Record<string, unknown>);
  }

  // ─── IFTA Reports ───────────────────────────────────────────

  /** List IFTA trip reports */
  async listIFTATrips(params?: MotiveIFTAParams): Promise<MotiveIFTATripsResponse> {
    return this.get<MotiveIFTATripsResponse>('v1/ifta/trips', params as Record<string, unknown>);
  }

  /** List mileage summary by jurisdiction */
  async listMileageSummary(params?: MotiveIFTAParams): Promise<MotiveMileageSummaryResponse> {
    return this.get<MotiveMileageSummaryResponse>('v1/ifta/mileage_summary', params as Record<string, unknown>);
  }

  // ─── Safety / Scorecards ────────────────────────────────────

  /** List scorecard summaries for vehicles */
  async listScorecardSummaries(params?: MotiveScorecardParams): Promise<MotiveScorecardSummaryResponse> {
    return this.get<MotiveScorecardSummaryResponse>('v1/scorecard_summaries', params as Record<string, unknown>);
  }

  /** List driver performance events (safety events from AI dashcam) */
  async listPerformanceEvents(params?: MotivePerformanceEventsParams): Promise<MotivePerformanceEventsResponse> {
    return this.get<MotivePerformanceEventsResponse>('v2/driver_performance_events', {
      ...params,
      types: params?.types?.join(','),
    } as Record<string, unknown>);
  }

  // ─── Inspection Reports (DVIR) ──────────────────────────────

  /** List vehicle inspection reports */
  async listInspectionReports(params?: MotivePaginationParams & MotiveDateRangeParams): Promise<MotiveInspectionReportsResponse> {
    return this.get<MotiveInspectionReportsResponse>('v2/inspection_reports', params as Record<string, unknown>);
  }

  // ─── Dispatches ─────────────────────────────────────────────

  /** List dispatches */
  async listDispatches(params?: MotivePaginationParams & MotiveDateRangeParams): Promise<MotiveDispatchesResponse> {
    return this.get<MotiveDispatchesResponse>('v2/dispatches', params as Record<string, unknown>);
  }

  // ─── Geofences ──────────────────────────────────────────────

  /** List geofence events */
  async listGeofenceEvents(params?: MotivePaginationParams & MotiveDateRangeParams): Promise<MotiveGeofenceEventsResponse> {
    return this.get<MotiveGeofenceEventsResponse>('v1/geofence_events', params as Record<string, unknown>);
  }

  // ─── Fault Codes ────────────────────────────────────────────

  /** List vehicle fault codes (diagnostic trouble codes) */
  async listFaultCodes(params?: MotivePaginationParams & MotiveDateRangeParams): Promise<MotiveFaultCodesResponse> {
    return this.get<MotiveFaultCodesResponse>('v1/fault_codes', params as Record<string, unknown>);
  }
}

// ═══════════════════════════════════════════════════════════════
// OAuth2 Helpers (Static — not tied to a single company)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate the OAuth2 authorization URL for the operator connect flow.
 * Redirect the operator to this URL to start the OAuth process.
 */
export function getMotiveOAuthURL(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: MOTIVE_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'read',
  });
  return `${MOTIVE_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called after the operator completes the OAuth flow.
 */
export async function exchangeMotiveCode(
  code: string,
  redirectUri: string,
): Promise<MotiveOAuthTokenResponse> {
  const res = await fetch(`${MOTIVE_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: MOTIVE_CLIENT_ID,
      client_secret: MOTIVE_CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new MotiveAPIError(
      (errorBody as Record<string, string>).error_description || `Token exchange failed: HTTP ${res.status}`,
      res.status,
      'oauth/token',
      errorBody,
    );
  }

  return (await res.json()) as MotiveOAuthTokenResponse;
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshMotiveToken(
  refreshToken: string,
): Promise<MotiveOAuthTokenResponse> {
  const res = await fetch(`${MOTIVE_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: MOTIVE_CLIENT_ID,
      client_secret: MOTIVE_CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new MotiveAPIError(
      (errorBody as Record<string, string>).error_description || `Token refresh failed: HTTP ${res.status}`,
      res.status,
      'oauth/token',
      errorBody,
    );
  }

  return (await res.json()) as MotiveOAuthTokenResponse;
}

/**
 * Create a MotiveClient from a stored access token.
 * Automatically refreshes if the token is expired.
 */
export async function createMotiveClient(
  storedToken: { access_token: string; refresh_token: string; expires_at: string },
): Promise<{ client: MotiveClient; refreshed: boolean; newToken?: MotiveOAuthTokenResponse }> {
  const expiresAt = new Date(storedToken.expires_at);
  const now = new Date();

  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const newToken = await refreshMotiveToken(storedToken.refresh_token);
    return {
      client: new MotiveClient(newToken.access_token),
      refreshed: true,
      newToken,
    };
  }

  return {
    client: new MotiveClient(storedToken.access_token),
    refreshed: false,
  };
}
