/**
 * Haul Command — Brand Metadata Helpers
 * Centralizes OG + icons so every route inherits consistent brand assets.
 *
 * Usage in layout.tsx:
 *   import { brandMetadata } from "@/app/metadata.brand";
 *   export const metadata: Metadata = { title: "Haul Command", ...brandMetadata };
 */

import type { Metadata } from "next";

export const brandMetadata: Partial<Metadata> = {
    icons: {
        icon: "/brand/favicon.svg",
        shortcut: "/brand/generated/favicon-32.png",
        apple: "/brand/generated/ios-appicon-180.png",
    },
    openGraph: {
        images: [
            { url: "/brand/generated/og-1200x630.png", width: 1200, height: 630 },
        ],
    },
    twitter: {
        card: "summary_large_image",
        images: ["/brand/generated/og-1200x630.png"],
    },
};
