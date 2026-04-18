"use client";

/**
 * DynamicBackgroundEngine — DISABLED for Yellow Pages light theme.
 * 
 * Previously rendered a fixed dark atmospheric overlay with route-aware
 * background images. Disabled because the site-wide conversion to the
 * Yellow Pages light theme makes dark overlays counterproductive.
 * 
 * The component is kept as a no-op so existing imports don't break.
 * When reactivated (e.g., for internal HQ/dashboard dark views),
 * it can be conditionally enabled based on pathname.
 */
export function DynamicBackgroundEngine() {
    // No-op in light theme mode. Remove this component from layout
    // when a route-based dark/light toggle is implemented.
    return null;
}
