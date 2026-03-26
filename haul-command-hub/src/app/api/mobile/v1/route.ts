import { NextResponse } from 'next/server';

/**
 * Flutter Super-App — Mobile API Gateway
 * 
 * GET /api/mobile/v1 — Returns full API contract for the Flutter super-app
 * 
 * This is the single source of truth for the Flutter mobile app architecture.
 * All endpoints are documented with request/response schemas, auth requirements,
 * and rate limits.
 * 
 * Mobile App Architecture:
 *   - Auth: Supabase Auth (email/password, Google, Apple sign-in)
 *   - State: Provider + Riverpod
 *   - Navigation: GoRouter
 *   - Real-time: SSE via /api/dispatch/realtime
 *   - Push: Firebase Cloud Messaging
 *   - Maps: Google Maps + custom HC overlays
 *   - Payments: Stripe Mobile SDK → /api/stripe/checkout-connect
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

  return NextResponse.json({
    name: 'Haul Command Mobile API',
    version: '1.0.0',
    baseUrl: `${baseUrl}/api`,
    auth: {
      provider: 'supabase',
      type: 'bearer_token',
      loginEndpoint: `${baseUrl}/auth/v1/token?grant_type=password`,
      signupEndpoint: `${baseUrl}/auth/v1/signup`,
      refreshEndpoint: `${baseUrl}/auth/v1/token?grant_type=refresh_token`,
      oauthProviders: ['google', 'apple'],
    },

    // ─── Core Endpoints ──────────────────────────────────────
    endpoints: {

      // ── Search ──
      search: {
        path: '/api/ai/search',
        method: 'POST',
        auth: 'optional',
        description: 'Semantic + keyword search across all HC data',
        request: {
          query: 'string (required)',
          types: 'string[] (dictionary|regulation|provider|load)',
          country: 'string (ISO country code)',
          limit: 'number (max 50)',
        },
        response: {
          totalResults: 'number',
          results: 'SearchResult[]',
          latencyMs: 'number',
        },
      },

      // ── Pricing Calculator ──
      pricing: {
        path: '/api/tools/pricing-calculator',
        method: 'POST',
        auth: 'optional',
        description: 'Calculate escort service pricing',
        request: {
          serviceType: 'lead_chase|height_pole|bucket_truck|route_survey|police_escort',
          distanceMiles: 'number',
          stateCode: 'string (auto-detects region)',
          rushLevel: 'sameDay|nextDay|standard',
        },
        response: {
          estimate: '{ low, mid, high, lineItems, warnings, upsells }',
        },
      },

      // ── Dispatch (Post Load) ──
      dispatch: {
        path: '/api/ai/dispatch',
        method: 'POST',
        auth: 'required',
        description: 'Post a load and get AI-matched operators',
        request: {
          origin: 'string',
          destination: 'string',
          originState: 'string (US state code)',
          serviceType: 'string',
          distanceMiles: 'number',
          urgency: 'same_day|high|normal|low',
        },
        response: {
          load_id: 'string',
          matches: 'DispatchMatch[]',
          surge_active: 'boolean',
        },
      },

      // ── Real-Time Stream ──
      realtime: {
        path: '/api/dispatch/realtime',
        method: 'GET',
        auth: 'optional',
        protocol: 'SSE (Server-Sent Events)',
        description: 'Live dispatch event stream',
        queryParams: {
          regions: 'string (comma-separated region codes for filtering)',
        },
        events: [
          'load:new', 'load:matched', 'load:accepted', 'load:completed',
          'surge:updated', 'dispatch:alert', 'operator:online',
        ],
      },

      // ── Surge State ──
      surge: {
        path: '/api/tools/surge-engine',
        method: 'GET',
        auth: 'none',
        description: 'Current surge multipliers by region',
        response: {
          surgeState: 'SurgeRegion[]',
          currentSeason: 'string',
        },
      },

      // ── Directory ──
      directoryList: {
        path: '/api/directory',
        method: 'GET',
        auth: 'none',
        description: 'Browse operator directory',
        queryParams: {
          country: 'string',
          state: 'string',
          category: 'string',
          page: 'number',
          limit: 'number',
        },
      },

      // ── Stripe Checkout ──
      checkout: {
        path: '/api/stripe/checkout-connect',
        method: 'POST',
        auth: 'required',
        description: 'Create Stripe Connect checkout session (85/15 split)',
        request: {
          escortStripeAccountId: 'string',
          basePriceUsd: 'number (min $50)',
          regionCode: 'string',
          loadDescription: 'string',
          jobId: 'string',
        },
        response: {
          url: 'string (Stripe checkout URL)',
          pricing: '{ basePriceUsd, surgeMultiplier, finalPriceUsd, splitModel }',
        },
      },

      // ── User Profile ──
      profile: {
        path: '/api/user/profile',
        method: 'GET|PATCH',
        auth: 'required',
        description: 'Get or update user profile',
      },

      // ── GPS / Location Updates ──
      location: {
        path: '/api/operator/location',
        method: 'POST',
        auth: 'required',
        description: 'Push GPS coordinates for real-time map tracking',
        request: {
          lat: 'number',
          lng: 'number',
          heading: 'number (degrees)',
          speed: 'number (mph)',
          batteryLevel: 'number (0-100)',
        },
        rateLimit: '1 req/5 sec',
      },
    },

    // ─── Flutter Project Structure ───────────────────────────
    flutterArchitecture: {
      projectName: 'haul_command_app',
      minSdk: '3.10.0',
      stateManagement: 'riverpod',
      navigation: 'go_router',
      httpClient: 'dio',
      features: [
        {
          name: 'auth',
          screens: ['login', 'signup', 'forgot_password', 'onboarding'],
          packages: ['supabase_flutter', 'google_sign_in', 'sign_in_with_apple'],
        },
        {
          name: 'dispatch',
          screens: ['load_board', 'post_load', 'load_detail', 'match_results'],
          packages: ['sse_client', 'google_maps_flutter'],
        },
        {
          name: 'pricing',
          screens: ['calculator', 'quote_builder', 'rate_card'],
          packages: [],
        },
        {
          name: 'directory',
          screens: ['search', 'operator_profile', 'map_view'],
          packages: ['google_maps_flutter', 'geolocator'],
        },
        {
          name: 'wallet',
          screens: ['earnings', 'payout_history', 'stripe_connect'],
          packages: ['stripe_sdk', 'flutter_stripe'],
        },
        {
          name: 'profile',
          screens: ['my_profile', 'settings', 'notifications', 'documents'],
          packages: ['image_picker', 'firebase_messaging'],
        },
      ],
      corePackages: [
        'supabase_flutter: ^2.0.0',
        'flutter_riverpod: ^2.4.0',
        'go_router: ^13.0.0',
        'dio: ^5.4.0',
        'flutter_stripe: ^10.0.0',
        'google_maps_flutter: ^2.5.0',
        'geolocator: ^11.0.0',
        'firebase_messaging: ^14.7.0',
        'flutter_secure_storage: ^9.0.0',
        'shimmer: ^3.0.0',
      ],
    },

    // ─── Data Models (shared between API and Flutter) ────────
    models: {
      Load: {
        id: 'string (UUID)',
        origin: 'string',
        destination: 'string',
        origin_state: 'string',
        service_type: 'lead_chase|height_pole|bucket_truck|route_survey|police_escort',
        distance_miles: 'number',
        urgency: 'same_day|high|normal|low',
        status: 'open|matched|accepted|in_transit|completed|cancelled',
        recommended_price_mid: 'number',
        surge_active: 'boolean',
        created_at: 'ISO datetime',
      },
      Operator: {
        id: 'string (UUID)',
        name: 'string',
        slug: 'string',
        phone: 'string',
        hc_trust_number: 'string (HC-XX-XX-XXXXX)',
        country_code: 'string',
        admin1_code: 'string',
        locality: 'string',
        lat: 'number',
        lng: 'number',
        surface_category_key: 'string',
        claim_status: 'unclaimed|claimed|verified',
      },
      DispatchMatch: {
        operatorName: 'string',
        score: 'number (0-100)',
        recommendedPrice: '{ low, mid, high }',
        phone: 'string',
        hcTrustNumber: 'string',
        distanceFromOrigin: 'number (miles)',
      },
      SurgeRegion: {
        region_code: 'string',
        region_label: 'string',
        surge_multiplier: 'number (0.85-2.5)',
        surge_tier: 'NORMAL|ELEVATED|HIGH|EXTREME',
        active_loads: 'number',
      },
    },
  });
}
