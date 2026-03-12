/**
 * HAUL COMMAND — OG / Preview Image Generation Rules
 * Controls which icons qualify for OG images, schema roles, and sitemap inclusion.
 */

import type { CategoryAssetEntry } from './manifest';

export interface OGImageConfig {
    width: 1200; height: 630;
    background: string; accent: string;
    text_primary: string; text_secondary: string;
    font_family: string; logo_position: string;
    icon_size: number; icon_position: string;
}

export const OG_IMAGE_CONFIG: OGImageConfig = {
    width: 1200, height: 630,
    background: '#0B0B0C', accent: '#C6923A',
    text_primary: '#FFFFFF', text_secondary: '#888888',
    font_family: 'Space Grotesk',
    logo_position: 'top-left',
    icon_size: 120, icon_position: 'center-right',
};

export interface OGGenerationRule {
    page_type: string; template: string; icon_variant: string;
    include_in_sitemap: boolean; include_in_robots: boolean;
    cache_strategy: 'static' | 'isr' | 'on-demand';
    revalidate_seconds?: number; filename_pattern: string;
}

export const OG_GENERATION_RULES: OGGenerationRule[] = [
    { page_type: 'directory_category', template: 'category-hero', icon_variant: 'filled', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'isr', revalidate_seconds: 86400, filename_pattern: 'og-{country}-{category}.png' },
    { page_type: 'directory_country', template: 'country-hero', icon_variant: 'duotone', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'isr', revalidate_seconds: 86400, filename_pattern: 'og-{country}-directory.png' },
    { page_type: 'place_detail', template: 'place-card', icon_variant: 'filled', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'on-demand', filename_pattern: 'og-place-{slug}.png' },
    { page_type: 'surface_detail', template: 'surface-card', icon_variant: 'filled', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'isr', revalidate_seconds: 43200, filename_pattern: 'og-surface-{slug}.png' },
    { page_type: 'profile_page', template: 'profile-card', icon_variant: 'badge_mini', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'on-demand', filename_pattern: 'og-profile-{id}.png' },
    { page_type: 'compare_page', template: 'compare-grid', icon_variant: 'outline', include_in_sitemap: false, include_in_robots: false, cache_strategy: 'on-demand', filename_pattern: 'og-compare-{hash}.png' },
    { page_type: 'tools_page', template: 'tool-hero', icon_variant: 'duotone', include_in_sitemap: true, include_in_robots: true, cache_strategy: 'static', filename_pattern: 'og-tool-{slug}.png' },
];

export interface SchemaImageRole {
    page_type: string;
    role: 'logo' | 'representativeOfPage' | 'primaryImageOfPage' | 'none';
    source: 'icon_svg' | 'generated_og' | 'uploaded_photo' | 'map_screenshot';
    fallback_source: 'icon_svg' | 'generated_og' | null;
}

export const SCHEMA_IMAGE_ROLES: SchemaImageRole[] = [
    { page_type: 'directory_category', role: 'representativeOfPage', source: 'generated_og', fallback_source: 'icon_svg' },
    { page_type: 'directory_country', role: 'representativeOfPage', source: 'generated_og', fallback_source: 'icon_svg' },
    { page_type: 'place_detail', role: 'primaryImageOfPage', source: 'uploaded_photo', fallback_source: 'generated_og' },
    { page_type: 'profile_page', role: 'primaryImageOfPage', source: 'uploaded_photo', fallback_source: 'generated_og' },
    { page_type: 'surface_detail', role: 'representativeOfPage', source: 'generated_og', fallback_source: 'icon_svg' },
    { page_type: 'tools_page', role: 'representativeOfPage', source: 'generated_og', fallback_source: 'icon_svg' },
    { page_type: 'compare_page', role: 'none', source: 'generated_og', fallback_source: null },
];

export const SITEMAP_IMAGE_RULES = {
    eligible: true,
    min_indexing_priority: 'medium' as const,
    max_images_per_page: 5,
    priority_order: ['uploaded_photo', 'generated_og', 'icon_svg'] as const,
};

/** Variants too small or decorative to index as primary SEO assets */
export const DO_NOT_INDEX_AS_PRIMARY = ['badge_mini', 'app_nav', 'empty_state', 'active_selected'];

export function isOGEligible(entry: CategoryAssetEntry): boolean {
    return entry.og_preview_eligible && entry.indexing_priority !== 'none';
}
export function getOGRule(pageType: string) { return OG_GENERATION_RULES.find(r => r.page_type === pageType); }
export function getSchemaRole(pageType: string) { return SCHEMA_IMAGE_ROLES.find(r => r.page_type === pageType); }
