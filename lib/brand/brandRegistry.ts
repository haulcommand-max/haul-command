/**
 * Haul Command — Brand Registry (static mapping)
 * This file is intentionally explicit to avoid guessing.
 *
 * Surfaces must match Brand OS YAML 'surfaces' keys.
 * Roles map to actual file paths in /public.
 */

export type BrandSurface =
    | "web_header_desktop"
    | "web_header_mobile"
    | "web_footer"
    | "directory_cards"
    | "operator_profiles"
    | "broker_profiles"
    | "leaderboard_rows"
    | "leaderboard_badges"
    | "leaderboard_header"
    | "mini_app_tiles"
    | "mini_app_module_header"
    | "favicon"
    | "social_share"
    | "pwa_manifest"
    | "pwa_maskable";

export type BrandRole =
    | "primary_wordmark"
    | "primary_mark"
    | "badge_round"
    | "badge_square"
    | "favicon_master"
    | "og_master"
    | "simplified_mark";

export interface BrandAsset {
    role: BrandRole;
    /** Public path (e.g. /brand/logo-mark.png) — next/image compatible */
    src: string;
    width: number;
    height: number;
    altDefault: string;
    classNameDefault?: string;
}

// ---------------------------------------------------------------------------
// Canonical assets (masters + generated)
// ---------------------------------------------------------------------------
export const BRAND_ASSETS: Record<BrandRole, BrandAsset> = {
    primary_wordmark: {
        role: "primary_wordmark",
        src: "/brand/logo.svg",
        width: 176,
        height: 52,
        altDefault: "Haul Command",
    },
    primary_mark: {
        role: "primary_mark",
        src: "/brand/logo-mark.svg",
        width: 64,
        height: 64,
        altDefault: "Haul Command",
    },
    badge_round: {
        role: "badge_round",
        src: "/brand/logo-mark.svg",
        width: 48,
        height: 48,
        altDefault: "Haul Command Badge",
    },
    badge_square: {
        role: "badge_square",
        src: "/brand/logo-mark.svg",
        width: 72,
        height: 72,
        altDefault: "Haul Command",
    },
    favicon_master: {
        role: "favicon_master",
        src: "/brand/favicon.svg",
        width: 32,
        height: 32,
        altDefault: "Haul Command",
    },
    og_master: {
        role: "og_master",
        src: "/brand/generated/og-1200x630.png",
        width: 1200,
        height: 630,
        altDefault: "Haul Command",
    },
    simplified_mark: {
        role: "simplified_mark",
        src: "/brand/favicon.svg",
        width: 64,
        height: 64,
        altDefault: "Haul Command",
    },
};

// ---------------------------------------------------------------------------
// Surface -> role selection (deterministic, zero-guessing)
// ---------------------------------------------------------------------------
export const SURFACE_ROLE_MAP: Record<BrandSurface, BrandRole> = {
    web_header_desktop: "primary_wordmark",
    web_header_mobile: "primary_mark",
    web_footer: "primary_wordmark",

    directory_cards: "primary_mark",
    operator_profiles: "primary_mark",
    broker_profiles: "primary_mark",

    leaderboard_rows: "primary_mark",
    leaderboard_badges: "badge_round",
    leaderboard_header: "primary_wordmark",

    mini_app_tiles: "badge_square",
    mini_app_module_header: "primary_mark",

    favicon: "favicon_master",
    social_share: "og_master",

    pwa_manifest: "badge_square",
    pwa_maskable: "badge_square",
};

// ---------------------------------------------------------------------------
// Helper: resolve asset for a surface
// ---------------------------------------------------------------------------
export function getAssetForSurface(surface: BrandSurface): BrandAsset {
    const role = SURFACE_ROLE_MAP[surface];
    return BRAND_ASSETS[role];
}
