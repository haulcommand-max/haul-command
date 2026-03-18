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
    ];
  },
};

export default nextConfig;
