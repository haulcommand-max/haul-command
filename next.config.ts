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
            // NOTE: www → apex redirect is handled by Vercel domain settings at the CDN edge.
            // DO NOT add a www redirect here — it conflicts with Vercel and causes redirect loops.
        ];
    },

    // ── Turbopack (Next.js 16 default bundler) ───────────────────────────────────
    // Empty config signals "I know Turbopack is active" and silences the
    // webpack-config conflict error that crashes the dev server.
    // canvas/fs/net/tls are excluded automatically by Turbopack for browser targets.
    turbopack: {},
};

export default nextConfig;
