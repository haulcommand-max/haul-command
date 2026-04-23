/**
 * Brand Config — Single source of truth for Haul Command identity.
 *
 * RULES:
 *   - Spelling: "Haul Command" — never "Hall", never "HaulCommand".
 *   - SVG logos are the primary UI rendering (crisp, scalable).
 *   - Raster logo is for platform identity: OG image, PWA icons, app store.
 *   - Never crop the logo. Use object-fit: contain everywhere.
 *   - Never recolor the logo. If background feels heavy, add a subtle
 *     low-opacity container behind it instead.
 */

export const BRAND_NAME = "Haul Command" as const;
export const BRAND_NAME_UPPER = "HAUL COMMAND" as const;

/** Full logo — real brand mark (hexagon badge + HAUL COMMAND wordmark) */
export const LOGO_SRC = "/brand/haul-command-logo-real.png" as const;

/** Icon-only mark for mobile/compact */
export const LOGO_MARK_SRC = "/brand/haul-command-icon.png" as const;

/** Raster logo for OG/PWA/marketing */
export const LOGO_RASTER_SRC = "/brand/haul-command-logo-real.png" as const;

/** OG image source */
export const OG_IMAGE_SRC = "/og-image.png" as const;

/** Alt text for all logo <img> tags */
export const ALT_TEXT = "Haul Command" as const;

/** Copyright line */
export const COPYRIGHT = `© ${new Date().getFullYear()} ${BRAND_NAME}` as const;

/** Tagline variants */
export const TAGLINE = "The Operating System for Heavy Haul" as const;
export const TAGLINE_SHORT = "Heavy Haul Intelligence" as const;
