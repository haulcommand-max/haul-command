import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ── Output ──────────────────────────────────────────────────────────────────
    // NOTE: "standalone" removed — Vercel uses its own serverless bundler.
    // Standalone was causing "Body exceeded 80000kb limit" on deploy.
    // For Docker/Capacitor, re-enable via NEXT_OUTPUT=standalone env var.

    // ── Performance ─────────────────────────────────────────────────────────────
    reactStrictMode: true,

    // ── Image optimization ───────────────────────────────────────────────────────
    images: {
        // Keep optimization ON — Vercel handles this on free plan.
        unoptimized: false,
        // Negotiate AVIF first (smallest), then WebP
        formats: ["image/avif", "image/webp"],

        // Allow images from external domains used in operator avatars and content.
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com", // Google OAuth avatars
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
            },
        ],
    },

    // ── Headers ─────────────────────────────────────────────────────────────────
    // Security headers applied at Next.js layer (also in vercel.json for CDN).
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-DNS-Prefetch-Control", value: "on" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                ],
            },
            {
                // Hero video + poster assets — immutable, CDN-cached for 1 year
                source: "/hero/:path*",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
        ];
    },

    // ── Redirects (SEO) ─────────────────────────────────────────────────────────
    async redirects() {
        // US state full-name → abbreviation redirects for /directory/us/[state]
        const US_STATE_REDIRECTS = [
            ['alabama','al'],['alaska','ak'],['arizona','az'],['arkansas','ar'],
            ['california','ca'],['colorado','co'],['connecticut','ct'],['delaware','de'],
            ['florida','fl'],['georgia','ga'],['hawaii','hi'],['idaho','id'],
            ['illinois','il'],['indiana','in'],['iowa','ia'],['kansas','ks'],
            ['kentucky','ky'],['louisiana','la'],['maine','me'],['maryland','md'],
            ['massachusetts','ma'],['michigan','mi'],['minnesota','mn'],['mississippi','ms'],
            ['missouri','mo'],['montana','mt'],['nebraska','ne'],['nevada','nv'],
            ['new-hampshire','nh'],['new-jersey','nj'],['new-mexico','nm'],['new-york','ny'],
            ['north-carolina','nc'],['north-dakota','nd'],['ohio','oh'],['oklahoma','ok'],
            ['oregon','or'],['pennsylvania','pa'],['rhode-island','ri'],['south-carolina','sc'],
            ['south-dakota','sd'],['tennessee','tn'],['texas','tx'],['utah','ut'],
            ['vermont','vt'],['virginia','va'],['washington','wa'],['west-virginia','wv'],
            ['wisconsin','wi'],['wyoming','wy'],
        ].map(([full, abbr]) => ({
            source: `/directory/us/${full}`,
            destination: `/directory/us/${abbr}`,
            permanent: true,
        }));

        // Also redirect /directory/united-states/:state → /directory/us/:state
        const COUNTRY_REDIRECTS = [
            { source: '/directory/united-states/:state', destination: '/directory/us/:state', permanent: true },
            { source: '/directory/united_states/:state', destination: '/directory/us/:state', permanent: true },
        ];

        // Corridor URL corrections
        const CORRIDOR_REDIRECTS = [
            { source: '/corridors', destination: '/corridor', permanent: true },
            { source: '/corridors/:slug', destination: '/corridor/:slug', permanent: true },
        ];

        return [
            // Legacy URL patterns → canonical
            {
                source: "/operators/:path*",
                destination: "/directory/:path*",
                permanent: true,
            },
            {
                source: "/escort/corridor",
                destination: "/corridor",
                permanent: true,
            },
            {
                source: "/escort/corridor/:path*",
                destination: "/corridor/:path*",
                permanent: true,
            },
            {
                source: "/escort/:path*",
                destination: "/directory/:path*",
                permanent: true,
            },
            ...US_STATE_REDIRECTS,
            ...COUNTRY_REDIRECTS,
            ...CORRIDOR_REDIRECTS,
            // NOTE: www → apex redirect is handled by Vercel domain settings at the CDN edge.
            // DO NOT add a www redirect here — it conflicts with Vercel and causes redirect loops.
        ];
    },
};

export default nextConfig;
