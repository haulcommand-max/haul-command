import type { NextConfig } from "next";
import { resolve } from "path";

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
      // /jobs was in sitemap at 0.85 priority — dead
      {
        source: '/jobs',
        destination: '/loads',
        permanent: true,
      },
      // /onboarding/start — primary CTA on 404 page was broken
      {
        source: '/onboarding/start',
        destination: '/claim',
        permanent: true,
      },
      // /home — was rendering same as / causing confusion
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // /start — legacy onboarding entry
      {
        source: '/start',
        destination: '/claim',
        permanent: true,
      },
      // /services/marketplace → services hub
      {
        source: '/services/marketplace',
        destination: '/services',
        permanent: true,
      },
      // /map/jurisdiction → map
      {
        source: '/map/jurisdiction',
        destination: '/map',
        permanent: true,
      },
      // Legacy tool routes → current tool names
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
};

export default nextConfig;
