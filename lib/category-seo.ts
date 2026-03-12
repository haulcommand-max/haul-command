/**
 * HAUL COMMAND — Category SEO Integration
 *
 * Connects the metadata-driven icon/category system to page-level SEO.
 * Generates JSON-LD, meta tags, alt text, and sitemap image entries
 * using the manifest + locales + OG rules.
 */

import { getCategoryAsset, getCategoryLabel, getCategorySynonyms, getCategoryAltText } from '../components/icons/manifest';
import { getLocalizedLabel, getLocalizedSynonyms, getLocalizedAltText, getLocalizedTooltip } from '../components/icons/locales';
import { getOGRule, getSchemaRole, isOGEligible, DO_NOT_INDEX_AS_PRIMARY, SITEMAP_IMAGE_RULES } from '../components/icons/og-preview-rules';

type CountryCode = string;

// ── Page-level Meta Generator ───────────────────────────────────────────────

export interface CategoryPageMeta {
    title: string;
    description: string;
    keywords: string[];
    og_title: string;
    og_description: string;
    og_image: string | null;
    canonical_url: string;
    json_ld: Record<string, unknown>;
    image_sitemap_entries: SitemapImageEntry[];
}

export interface SitemapImageEntry {
    loc: string;
    title: string;
    caption: string;
    geo_location?: string;
}

export function generateCategoryPageMeta(
    iconId: string,
    country: CountryCode,
    baseUrl: string,
    entityCount?: number
): CategoryPageMeta {
    const asset = getCategoryAsset(iconId);
    const label = getLocalizedLabel(iconId, country);
    const synonyms = getLocalizedSynonyms(iconId, country);
    const altText = getLocalizedAltText(iconId, country);
    const tooltip = getLocalizedTooltip(iconId, country);

    const countryName = COUNTRY_NAMES[country] || country;
    const title = `${label} in ${countryName} | HAUL COMMAND Directory`;
    const description = entityCount
        ? `Browse ${entityCount.toLocaleString()} ${label.toLowerCase()} in ${countryName}. ${tooltip}`
        : `Find the best ${label.toLowerCase()} in ${countryName}. ${tooltip}`;

    const ogRule = getOGRule('directory_category');
    const ogImage = ogRule ? `${baseUrl}/api/og?category=${iconId}&country=${country}` : null;

    const canonical = `${baseUrl}/directory/${country.toLowerCase()}/${iconId.replace(/_/g, '-')}`;

    const schemaRole = getSchemaRole('directory_category');
    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${label} — ${countryName}`,
        description,
        url: canonical,
        ...(schemaRole?.role !== 'none' && ogImage ? { image: { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 } } : {}),
        ...(entityCount ? { numberOfItems: entityCount } : {}),
        isPartOf: { '@type': 'WebSite', name: 'HAUL COMMAND', url: baseUrl },
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Directory', item: `${baseUrl}/directory` },
                { '@type': 'ListItem', position: 2, name: countryName, item: `${baseUrl}/directory/${country.toLowerCase()}` },
                { '@type': 'ListItem', position: 3, name: label, item: canonical },
            ],
        },
    };

    const imageEntries: SitemapImageEntry[] = [];
    if (asset && isOGEligible(asset) && ogImage) {
        imageEntries.push({
            loc: ogImage,
            title: `${label} in ${countryName}`,
            caption: altText,
            geo_location: countryName,
        });
    }
    // Include the stable SVG icon if indexing priority allows
    if (asset && asset.indexing_priority !== 'none' && !DO_NOT_INDEX_AS_PRIMARY.includes(asset.map_pin_variant)) {
        imageEntries.push({
            loc: `${baseUrl}${asset.stable_asset_url}`,
            title: `${label} Icon`,
            caption: altText,
        });
    }

    return {
        title, description,
        keywords: [label, ...synonyms.slice(0, 8), countryName, 'HAUL COMMAND'],
        og_title: title.replace(' | HAUL COMMAND Directory', ''),
        og_description: description,
        og_image: ogImage,
        canonical_url: canonical,
        json_ld: jsonLd,
        image_sitemap_entries: imageEntries,
    };
}

// ── Profile Page SEO ────────────────────────────────────────────────────────

export interface ProfilePageMeta {
    title: string;
    description: string;
    og_image: string | null;
    json_ld: Record<string, unknown>;
}

export function generateProfilePageMeta(
    operatorName: string,
    categoryIconId: string,
    country: CountryCode,
    city: string,
    state: string,
    trustScore: number,
    baseUrl: string,
    profileId: string,
    primaryImageUrl?: string
): ProfilePageMeta {
    const catLabel = getLocalizedLabel(categoryIconId, country);
    const location = [city, state].filter(Boolean).join(', ');
    const title = `${operatorName} — ${catLabel} in ${location} | HAUL COMMAND`;
    const description = `${operatorName} is a ${catLabel.toLowerCase()} based in ${location}. Trust score: ${trustScore}/100. Find contact info, reviews, and gear verification on HAUL COMMAND.`;

    const ogRule = getOGRule('profile_page');
    const ogImage = ogRule ? `${baseUrl}/api/og?profile=${profileId}` : null;

    const schemaRole = getSchemaRole('profile_page');
    const imageObj = primaryImageUrl
        ? { '@type': 'ImageObject', url: primaryImageUrl }
        : ogImage
            ? { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 }
            : undefined;

    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: operatorName,
        description,
        url: `${baseUrl}/place/${profileId}`,
        ...(imageObj ? { image: imageObj } : {}),
        address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: state, addressCountry: country },
        aggregateRating: trustScore > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: Math.min(5, (trustScore / 20)).toFixed(1),
            bestRating: '5', worstRating: '1', ratingCount: 1,
        } : undefined,
    };

    return { title, description, og_image: ogImage, json_ld: jsonLd };
}

// ── Place/Listing Image Alt Text Generator ──────────────────────────────────

export function generateMediaAltText(
    operatorName: string,
    slotType: string,
    country: CountryCode = 'US'
): string {
    const slotLabels: Record<string, Record<string, string>> = {
        vehicle_front_3qtr: { US: 'Front three-quarter view', CA: 'Front three-quarter view', AU: 'Front three-quarter view', GB: 'Front three-quarter view' },
        vehicle_side: { US: 'Side profile view', CA: 'Side profile view' },
        vehicle_rear: { US: 'Rear view showing signage', CA: 'Rear view showing signage' },
        roof_beacon_setup: { US: 'Roof-mounted beacon and light bar setup', CA: 'Roof beacon configuration' },
        flags_signs_poles: { US: 'Oversize load signs, flags, and height poles', CA: 'Wide load signs and flags' },
        radios_comms_setup: { US: 'Radio and communications equipment', CA: 'Communication equipment' },
        safety_gear_layout: { US: 'Safety gear and PPE layout', CA: 'Safety equipment layout' },
        optional_night_visibility: { US: 'Night visibility and lighting setup', CA: 'Night lighting configuration' },
        optional_support_equipment: { US: 'Additional support equipment', CA: 'Support equipment' },
        optional_trailer_or_additional_vehicle: { US: 'Additional escort vehicle or trailer', CA: 'Additional vehicle' },
    };

    const slotLabel = slotLabels[slotType]?.[country] || slotLabels[slotType]?.US || slotType.replace(/_/g, ' ');
    return `${operatorName} — ${slotLabel}`;
}

// ── Country name lookup ─────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom',
    NZ: 'New Zealand', MX: 'Mexico', DE: 'Germany', FR: 'France',
    NL: 'Netherlands', BE: 'Belgium', ZA: 'South Africa', IN: 'India',
    BR: 'Brazil', AE: 'United Arab Emirates', SA: 'Saudi Arabia',
    JP: 'Japan', KR: 'South Korea',
};
