import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ── Output ──────────────────────────────────────────────────────────────────
    // "standalone" bundles everything needed to run without node_modules.
    // Required for Vercel, Docker, and Capacitor native builds.
    output: "standalone",

    // ── Performance ─────────────────────────────────────────────────────────────
    reactStrictMode: true,

    // ── Image optimization ───────────────────────────────────────────────────────
    images: {
        // Keep optimization ON — Vercel handles this on free plan.
        unoptimized: false,

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
        ];
    },

    // ── Redirects (SEO) ─────────────────────────────────────────────────────────
    async redirects() {
        return [
            // Legacy URL patterns → canonical
            {
                source: "/operators/:path*",
                destination: "/directory/:path*",
                permanent: true,
            },
            {
                source: "/escort/:path*",
                destination: "/directory/:path*",
                permanent: true,
            },
            // www → root (haulcommand.com is canonical, not www)
            {
                source: "/:path*",
                has: [{ type: "host", value: "www.haulcommand.com" }],
                destination: "https://haulcommand.com/:path*",
                permanent: true,
            },
        ];
    },

    // ── Turbopack (Next.js 16 default bundler) ───────────────────────────────────
    // Empty config signals "I know Turbopack is active" and silences the
    // webpack-config conflict error that crashes the dev server.
    // canvas/fs/net/tls are excluded automatically by Turbopack for browser targets.
    turbopack: {},
};

export default nextConfig;
