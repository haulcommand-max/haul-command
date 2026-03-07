/**
 * ISR revalidation constants and tag helpers.
 * All page factory pages use 86400s (24h) default revalidation.
 * Surface profiles use 604800s (7d) since they change less often.
 */

export const REVALIDATE_HUB = 86400;       // 24h for hub pages
export const REVALIDATE_PROFILE = 604800;   // 7d for surface profiles
export const REVALIDATE_SITEMAP = 43200;    // 12h for sitemap

export function pageTag(pageType: string, ...segments: string[]) {
    return `pf:${pageType}:${segments.join(":")}`;
}
