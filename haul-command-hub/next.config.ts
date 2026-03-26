import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  async redirects() {
    return [
      // Legacy service routes → new local-services path (route conflict fix)
      {
        source: '/services/:state/:city',
        destination: '/local-services/:state/:city',
        permanent: true,
      },
      // escort-requirements → canonical requirements family
      {
        source: '/escort-requirements',
        destination: '/requirements',
        permanent: true,
      },
      {
        source: '/escort-requirements/:jurisdiction',
        destination: '/requirements/us/:jurisdiction',
        permanent: true,
      },
      // ─── AUDIT FIX: Legacy broken routes ───────────────────
      {
        source: '/jobs',
        destination: '/loads',
        permanent: true,
      },
      {
        source: '/onboarding/start',
        destination: '/claim',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/start',
        destination: '/claim',
        permanent: true,
      },
      {
        source: '/services/marketplace',
        destination: '/services',
        permanent: true,
      },
      {
        source: '/map/jurisdiction',
        destination: '/map',
        permanent: true,
      },
      {
        source: '/tools/compliance-copilot',
        destination: '/tools/escort-calculator',
        permanent: true,
      },
      {
        source: '/tools/permit-checker',
        destination: '/tools/escort-calculator',
        permanent: true,
      },
      {
        source: '/tools/permit-calculator',
        destination: '/tools/escort-calculator',
        permanent: true,
      },
      {
        source: '/tools/state-requirements',
        destination: '/requirements',
        permanent: true,
      },
      {
        source: '/tools/heavy-haul-index',
        destination: '/corridors',
        permanent: true,
      },
      {
        source: '/tools/route-complexity',
        destination: '/tools/superload-meter',
        permanent: true,
      },
      {
        source: '/tools/route-iq',
        destination: '/tools/load-analyzer',
        permanent: true,
      },
      {
        source: '/tools/rate-lookup',
        destination: '/tools/rate-advisor',
        permanent: true,
      },
    ];
  },

  // ─── Build behavior ────────────────────────────────────────────────────────

  /**
   * CRITICAL: Kill static generation workers after 45 seconds.
   * Vercel's hard limit is 60s. This gives a 15s buffer so you get a clean
   * error instead of a mysterious hanging build.
   *
   * If a page hits this timeout, it MUST be set to force-dynamic.
   * Do NOT increase this value — fix the page instead.
   */
  staticPageGenerationTimeout: 45,

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // ─── Packages ─────────────────────────────────────────────────────────────

  /**
   * These packages must run in the Node.js runtime, not bundled by webpack.
   * Bundling them causes build failures or huge lambda sizes.
   */
  serverExternalPackages: [
    'mapbox-gl',
    '@mapbox/mapbox-gl-geocoder',
    'sharp',
    'canvas',
    '@supabase/supabase-js',
  ],

  // ─── Bundle size protection ────────────────────────────────────────────────

  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/esbuild-linux-64',
      'node_modules/webpack',
      'node_modules/rollup',
    ],
  },

  // ─── Image optimization ────────────────────────────────────────────────────

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },

  // ─── Headers ──────────────────────────────────────────────────────────────

  async headers() {
    return [
      {
        // Admin routes: never cache, never index
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        // API routes: no caching (they handle their own cache headers)
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Directory: allow CDN caching for 5 min (CDN handles revalidation)
        source: '/directory/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
