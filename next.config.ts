import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ── TypeScript ────────────────────────────────────────────────────────
    // ignoreBuildErrors: Vercel build won't fail on TS errors.
    // This is intentional during active sprint development.
    // TypeScript errors ARE caught by the GitHub Actions typecheck.yml gate
    // which runs on every PR/push to main. Fix errors there, not here.
    typescript: { ignoreBuildErrors: true },

    // ── Static page generation timeout ───────────────────────────────────
    // Build fails fast (45s) instead of hanging indefinitely on large pages.
    staticPageGenerationTimeout: 45,


    // ── Output ───────────────────────────────────────────────────────────────
    // Vercel uses its own builder. No output mode needed.

    // ── Bundle Optimization ───────────────────────────────────────────────
    // Fix: "Body exceeded 80000kb limit" — externalize heavy packages from
    // serverless function bundles so they're loaded from the layer instead.
    serverExternalPackages: [
        "mapbox-gl",
        "sharp",
        "@sentry/nextjs",
        "@livekit/components-react",
        "livekit-client",
    ],

    // ── Turbopack ───────────────────────────────────────────────────────────
    // Pin workspace root to this project to silence the "multiple lockfiles" warning
    turbopack: {
        root: process.cwd(),
    },

    experimental: {
        // Tree-shake barrel exports so each route only includes used icons/utils
        // NOTE: Do NOT add @supabase/supabase-js here — it breaks PostgrestBuilder's
        // PromiseLike chain (.then/.catch) causing "a.rpc(...).catch is not a function"
        optimizePackageImports: [
            "lucide-react",
            "date-fns",
        ],
    },

    // ── Performance ───────────────────────────────────────────────────────────
    reactStrictMode: true,

    // ── Image optimization ──────────────────────────────────────────────────
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

    // ── Headers ─────────────────────────────────────────────────────────────
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


    // ── Redirects (SEO) ──────────────────────────────────────────────────────────
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
            // §34 Command-OS — /hq is the canonical board-grade URL
            {
                source: '/hq',
                destination: '/dashboard/command',
                permanent: false,
            },
            {
                source: '/hq/:path*',
                destination: '/dashboard/command',
                permanent: false,
            },
            // Canonical homepage — /home is a mobile app route, not an SEO surface
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
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
            // Dictionary → Glossary unification (glossary_action_plan.md §5)
            {
                source: '/dictionary',
                destination: '/glossary',
                permanent: true,
            },
            {
                source: '/dictionary/:path*',
                destination: '/glossary/:path*',
                permanent: true,
            },
            {
                source: '/loads',
                destination: '/load-board',
                permanent: true,
            },
            {
                source: '/loads/post',
                destination: '/load-board/post',
                permanent: true,
            },
            {
                source: '/leaderboard',
                destination: '/leaderboards',
                permanent: true,
            },
            {
                source: '/requirements',
                destination: '/escort-requirements',
                permanent: true,
            },
            {
                source: '/privacy-policy',
                destination: '/privacy',
                permanent: true,
            },
            ...US_STATE_REDIRECTS,
            ...COUNTRY_REDIRECTS,
            ...CORRIDOR_REDIRECTS,
            // NOTE: www → apex redirect is handled by Vercel domain settings at the CDN edge.
            // DO NOT add a www redirect here — it conflicts with Vercel and causes redirect loops.
        ];
    },
    // ── Rewrites ─────────────────────────────────────────────────────────
    // Route special files to their API handlers, bypassing the [country] catch-all.
    // MUST use beforeFiles so they run BEFORE Next.js filesystem routing.
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/available-now',
                    destination: '/available-now-fixed',
                },
                {
                    source: '/sitemap.xml',
                    destination: '/api/sitemap',
                },
                {
                    source: '/llms.txt',
                    destination: '/api/llms-txt',
                },
            ],
            afterFiles: [],
            fallback: [],
        };
    },
};
export default nextConfig;
