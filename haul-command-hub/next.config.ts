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
      // ROI-Driven Coming Soon Page Redirects
      {
        source: '/fuel-card/apply',
        destination: '/waitlist?feature=fuel-card',
        permanent: false,
      },
      {
        source: '/carbon/order',
        destination: '/waitlist?feature=carbon-reports',
        permanent: false,
      },
      {
        source: '/dispute/request',
        destination: '/waitlist?feature=dispute-resolution',
        permanent: false,
      },
      {
        source: '/exchange/:path*',
        destination: '/waitlist?feature=equipment-exchange',
        permanent: false,
      },
      {
        source: '/intelligence',
        destination: '/waitlist?feature=intelligence',
        permanent: false,
      },
      {
        source: '/cab-mode',
        destination: '/waitlist?feature=cab-mode',
        permanent: false,
      },
      {
        source: '/local-services/:path*',
        destination: '/waitlist?feature=local-services',
        permanent: false,
      },
      {
        source: '/services/oversize-load-escorts',
        destination: '/waitlist?feature=oversize-escorts',
        permanent: false,
      },
      {
        source: '/directory/all/:path*',
        destination: '/waitlist?feature=directory-categories',
        permanent: false,
      },
      // ─── GLOSSARY ARCHITECTURE: Legacy → Canonical Redirects ───────
      // All glossary/dictionary traffic funnels to /glossary/[term-slug]/
      {
        source: '/pilot-car',
        destination: '/glossary/pilot-car/',
        permanent: true,
      },
      // Legacy /dictionary hub → /glossary
      {
        source: '/dictionary',
        destination: '/glossary',
        permanent: true,
      },
      // Legacy /dictionary/term/:id → /glossary/:id (slug normalization in page)
      {
        source: '/dictionary/term/:id',
        destination: '/glossary/:id/',
        permanent: true,
      },
      // Legacy /glossary/term/:id → /glossary/:id
      {
        source: '/glossary/term/:id',
        destination: '/glossary/:id/',
        permanent: true,
      },
      // Legacy /dictionary/:country/:term → /glossary/:term/:country
      // (slug normalization happens in the page component via redirect())
      {
        source: '/dictionary/us/:term',
        destination: '/glossary/:term/united-states/',
        permanent: true,
      },
      {
        source: '/dictionary/ca/:term',
        destination: '/glossary/:term/canada/',
        permanent: true,
      },
      {
        source: '/dictionary/au/:term',
        destination: '/glossary/:term/australia/',
        permanent: true,
      },
      {
        source: '/dictionary/gb/:term',
        destination: '/glossary/:term/united-kingdom/',
        permanent: true,
      },
      {
        source: '/dictionary/de/:term',
        destination: '/glossary/:term/germany/',
        permanent: true,
      },
      {
        source: '/dictionary/nl/:term',
        destination: '/glossary/:term/netherlands/',
        permanent: true,
      },
      {
        source: '/dictionary/nz/:term',
        destination: '/glossary/:term/new-zealand/',
        permanent: true,
      },
      {
        source: '/dictionary/za/:term',
        destination: '/glossary/:term/south-africa/',
        permanent: true,
      },
      {
        source: '/dictionary/ae/:term',
        destination: '/glossary/:term/united-arab-emirates/',
        permanent: true,
      },
      {
        source: '/dictionary/br/:term',
        destination: '/glossary/:term/brazil/',
        permanent: true,
      },
      // Catch-all for remaining /dictionary/:country/:term patterns
      {
        source: '/dictionary/:country/:term',
        destination: '/glossary/:term/',
        permanent: true,
      },
      // Legacy /glossary/:country/:term-id → /glossary/:term-id/:country
      // (flips country-first to topic-first; slug normalization in-page)
      {
        source: '/glossary/us/:term',
        destination: '/glossary/:term/united-states/',
        permanent: true,
      },
      {
        source: '/glossary/ca/:term',
        destination: '/glossary/:term/canada/',
        permanent: true,
      },
      {
        source: '/glossary/au/:term',
        destination: '/glossary/:term/australia/',
        permanent: true,
      },
      {
        source: '/glossary/gb/:term',
        destination: '/glossary/:term/united-kingdom/',
        permanent: true,
      },
      {
        source: '/glossary/de/:term',
        destination: '/glossary/:term/germany/',
        permanent: true,
      },
      // ─── END GLOSSARY REDIRECTS ─────────────────
      {
        source: '/services/:path*',
        destination: '/waitlist?feature=services-hub',
        permanent: false,
      },
      {
        source: '/report',
        destination: '/report-data-issue',
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
    ignoreBuildErrors: true,
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
