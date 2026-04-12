/**
 * PageFamilyBackground
 *
 * SONNET-02 Visual System — Route-Aware Background Image Taxonomy
 *
 * A single reusable component that:
 *  - Maps page family → curated 4K/8K hero image
 *  - Applies a consistent dark overlay (dark at top for text legibility,
 *    lighter at bottom for content bleed-through)
 *  - Exports static metadata for og:image / Twitter card use
 *  - Never invents fake images — every entry maps to a real asset
 *
 * Usage:
 *  <PageFamilyBackground family="training" />
 *  <PageFamilyBackground family="directory" intensity="heavy" />
 *  <PageFamilyBackground family="homepage" gradientAnchor="bottom" />
 *
 * To add a new family:
 *  1. Add an entry to PAGE_FAMILY_MAP below
 *  2. Place the image in /public/backgrounds/
 *  3. No other code changes needed
 */

import Image from "next/image";
import React from "react";

// ═══════════════════════════════════════════════════════════════════════════
// PAGE FAMILY TAXONOMY — add new families here only
// ═══════════════════════════════════════════════════════════════════════════

export type PageFamily =
    | "homepage"
    | "training"
    | "directory"
    | "corridor"
    | "load-board"
    | "profiles"
    | "regulations"
    | "glossary"
    | "blog"
    | "forms"
    | "marketplace"
    | "tools"
    | "about"
    | "contact"
    | "dashboard"
    | "default";

interface PageFamilyAsset {
    /** Path relative to /public — must exist in the repo */
    src: string;
    /** Alt text for accessibility and og:image context */
    alt: string;
    /** Focal point: where the most important visual content lives */
    focalPoint: "center" | "top" | "bottom" | "left" | "right";
    /** Dominant palette for downstream CSS theming */
    palette: {
        primary: string;
        accent: string;
    };
}

export const PAGE_FAMILY_MAP: Record<PageFamily, PageFamilyAsset> = {
    homepage: {
        src: "/backgrounds/homepage-hero.jpg",
        alt: "Heavy haul fleet operations yard at dusk — Haul Command",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    training: {
        src: "/backgrounds/training-hero.jpg",
        alt: "Oversized heavy haul load convoy on an American highway at golden hour — Haul Command Training",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    directory: {
        src: "/backgrounds/directory-hero.jpg",
        alt: "Aerial night view of a highway interchange with heavy truck light trails — Haul Command Directory",
        focalPoint: "center",
        palette: { primary: "#050d1a", accent: "#3b82f6" },
    },
    corridor: {
        src: "/backgrounds/corridor-hero.jpg",
        alt: "Long exposure highway corridor at night — Haul Command Route Intelligence",
        focalPoint: "bottom",
        palette: { primary: "#060c18", accent: "#22c55e" },
    },
    "load-board": {
        src: "/backgrounds/load-board-hero.jpg",
        alt: "Heavy load truck at a freight terminal — Haul Command Load Board",
        focalPoint: "center",
        palette: { primary: "#0a0e1c", accent: "#C6923A" },
    },
    profiles: {
        src: "/backgrounds/profiles-hero.jpg",
        alt: "Pilot car operators preparing a convoy — Haul Command Operator Profiles",
        focalPoint: "top",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    regulations: {
        src: "/backgrounds/regulations-hero.jpg",
        alt: "State highway with permit signs — Haul Command Regulations Hub",
        focalPoint: "center",
        palette: { primary: "#0a0d17", accent: "#eab308" },
    },
    glossary: {
        src: "/backgrounds/glossary-hero.jpg",
        alt: "Technical overhead load diagram — Haul Command Heavy Haul Glossary",
        focalPoint: "center",
        palette: { primary: "#080c18", accent: "#6366f1" },
    },
    blog: {
        src: "/backgrounds/blog-hero.jpg",
        alt: "Heavy haul industry news — Haul Command Intelligence Hub",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    forms: {
        src: "/backgrounds/forms-hero.jpg",
        alt: "Compliance documents and permits — Haul Command Forms Hub",
        focalPoint: "right",
        palette: { primary: "#0a0c17", accent: "#64748b" },
    },
    marketplace: {
        src: "/backgrounds/marketplace-hero.jpg",
        alt: "Heavy haul equipment and vendor operations — Haul Command Marketplace",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    tools: {
        src: "/backgrounds/tools-hero.jpg",
        alt: "Route planning and permit intelligence tools — Haul Command",
        focalPoint: "center",
        palette: { primary: "#080c18", accent: "#06b6d4" },
    },
    about: {
        src: "/backgrounds/about-hero.jpg",
        alt: "Haul Command team and mission — heavy haul logistics operating system",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    contact: {
        src: "/backgrounds/contact-hero.jpg",
        alt: "Heavy haul dispatcher at work — Haul Command contact",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
    dashboard: {
        src: "/backgrounds/dashboard-hero.jpg",
        alt: "Haul Command operator dashboard — real-time logistics",
        focalPoint: "center",
        palette: { primary: "#050d1a", accent: "#3b82f6" },
    },
    default: {
        src: "/backgrounds/homepage-hero.jpg",
        alt: "Haul Command — heavy haul logistics operating system",
        focalPoint: "center",
        palette: { primary: "#0b0f19", accent: "#C6923A" },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// OVERLAY VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

type OverlayIntensity = "light" | "medium" | "heavy" | "ultra";
type GradientAnchor = "top" | "center" | "bottom";

const OVERLAY_GRADIENTS: Record<OverlayIntensity, Record<GradientAnchor, string>> = {
    light: {
        top: "linear-gradient(180deg, rgba(8,12,20,0.75) 0%, rgba(8,12,20,0.35) 50%, rgba(8,12,20,0.15) 100%)",
        center: "linear-gradient(180deg, rgba(8,12,20,0.6) 0%, rgba(8,12,20,0.25) 40%, rgba(8,12,20,0.6) 100%)",
        bottom: "linear-gradient(180deg, rgba(8,12,20,0.2) 0%, rgba(8,12,20,0.4) 50%, rgba(8,12,20,0.85) 100%)",
    },
    medium: {
        top: "linear-gradient(180deg, rgba(8,12,20,0.88) 0%, rgba(8,12,20,0.55) 45%, rgba(8,12,20,0.3) 100%)",
        center: "linear-gradient(180deg, rgba(8,12,20,0.75) 0%, rgba(8,12,20,0.4) 40%, rgba(8,12,20,0.75) 100%)",
        bottom: "linear-gradient(180deg, rgba(8,12,20,0.3) 0%, rgba(8,12,20,0.6) 50%, rgba(8,12,20,0.95) 100%)",
    },
    heavy: {
        top: "linear-gradient(180deg, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.78) 35%, rgba(8,12,20,0.45) 100%)",
        center: "linear-gradient(180deg, rgba(8,12,20,0.9) 0%, rgba(8,12,20,0.55) 40%, rgba(8,12,20,0.9) 100%)",
        bottom: "linear-gradient(180deg, rgba(8,12,20,0.45) 0%, rgba(8,12,20,0.78) 55%, rgba(8,12,20,0.97) 100%)",
    },
    ultra: {
        top: "linear-gradient(180deg, rgba(8,12,20,0.99) 0%, rgba(8,12,20,0.92) 30%, rgba(8,12,20,0.60) 100%)",
        center: "linear-gradient(180deg, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.72) 40%, rgba(8,12,20,0.97) 100%)",
        bottom: "linear-gradient(180deg, rgba(8,12,20,0.60) 0%, rgba(8,12,20,0.92) 60%, rgba(8,12,20,0.99) 100%)",
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface PageFamilyBackgroundProps {
    /** Which page family this is — drives image + palette selection */
    family?: PageFamily;
    /** Override the image entirely (use sparingly — prefer canonical taxonomy) */
    overrideSrc?: string;
    /** Overlay darkness */
    intensity?: OverlayIntensity;
    /** Where the gradient should be darkest */
    gradientAnchor?: GradientAnchor;
    /** Height of the background block */
    height?: string | number;
    /** Additional className for the outer wrapper */
    className?: string;
    /** Children render on top of the background */
    children?: React.ReactNode;
    /** Set to true for full-screen/viewport backgrounds */
    fullScreen?: boolean;
    /** Parallax disabled by default — too many motion implications on mobile */
    parallax?: boolean;
    /** If true, renders as a section-level <section> instead of div */
    asSection?: boolean;
}

export function PageFamilyBackground({
    family = "default",
    overrideSrc,
    intensity = "heavy",
    gradientAnchor = "top",
    height = "clamp(340px, 52vh, 680px)",
    className = "",
    children,
    fullScreen = false,
    asSection = false,
}: PageFamilyBackgroundProps) {
    const asset = PAGE_FAMILY_MAP[family] ?? PAGE_FAMILY_MAP.default;
    const src = overrideSrc ?? asset.src;
    const gradient = OVERLAY_GRADIENTS[intensity][gradientAnchor];

    const outerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: fullScreen ? "100vh" : height,
        overflow: "hidden",
        isolation: "isolate",
    };

    const Wrapper = asSection ? "section" : "div";

    return (
        <Wrapper className={className} style={outerStyle} aria-hidden={!children}>
            {/* 4K background image — lazy loaded, fill mode */}
            <Image
                src={src}
                alt={asset.alt}
                fill
                priority={false}
                sizes="100vw"
                style={{
                    objectFit: "cover",
                    objectPosition: asset.focalPoint,
                    zIndex: 0,
                    // Subtle desaturation keeps premium dark feel
                    filter: "saturate(0.85) brightness(0.82)",
                }}
                quality={85}
            />

            {/* Gradient overlay — always above image, below content */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    background: gradient,
                    pointerEvents: "none",
                }}
            />

            {/* Subtle noise texture for premium depth */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    backgroundImage: "url('/textures/noise-subtle.png')",
                    opacity: 0.04,
                    pointerEvents: "none",
                    mixBlendMode: "overlay",
                }}
            />

            {/* Content slot — always on top */}
            {children && (
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {children}
                </div>
            )}
        </Wrapper>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METADATA HELPER
// For use in generateMetadata() server functions — no component overhead
// ═══════════════════════════════════════════════════════════════════════════

export function getPageFamilyOgImage(family: PageFamily): {
    url: string;
    alt: string;
    width: number;
    height: number;
} {
    const asset = PAGE_FAMILY_MAP[family] ?? PAGE_FAMILY_MAP.default;
    return {
        url: `https://haul-command.com${asset.src}`,
        alt: asset.alt,
        width: 1200,
        height: 630,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE HOOK — for downstream components that need theme colors
// ═══════════════════════════════════════════════════════════════════════════

export function getPageFamilyPalette(family: PageFamily) {
    return (PAGE_FAMILY_MAP[family] ?? PAGE_FAMILY_MAP.default).palette;
}
