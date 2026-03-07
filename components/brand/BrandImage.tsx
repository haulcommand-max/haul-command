"use client";

/**
 * Haul Command — BrandImage
 * Single authoritative way to render brand assets by surface.
 *
 * RULE: Do not import /brand/* assets directly in UI components.
 * Always use <BrandImage surface="..." /> to avoid inconsistencies.
 */

import Image from "next/image";
import type { CSSProperties } from "react";
import {
    BRAND_ASSETS,
    SURFACE_ROLE_MAP,
    type BrandSurface,
} from "@/lib/brand/brandRegistry";

export interface BrandImageProps {
    surface: BrandSurface;
    alt?: string;
    className?: string;
    priority?: boolean;
    /** Allow explicit sizing overrides when needed (rare) */
    width?: number;
    height?: number;
    style?: CSSProperties;
}

export function BrandImage({
    surface,
    alt,
    className,
    priority,
    width,
    height,
    style,
}: BrandImageProps) {
    const role = SURFACE_ROLE_MAP[surface];
    const asset = BRAND_ASSETS[role];

    // Deterministic defaults
    const finalAlt = alt ?? asset.altDefault;
    const finalWidth = width ?? asset.width;
    const finalHeight = height ?? asset.height;

    // SVG files should be rendered as <img> with unoptimized (no blur placeholder)
    const isSvg = asset.src.endsWith(".svg");

    return (
        <Image
            src={asset.src}
            alt={finalAlt}
            width={finalWidth}
            height={finalHeight}
            priority={priority}
            className={className}
            style={style}
            unoptimized={isSvg}
        />
    );
}

export default BrandImage;
