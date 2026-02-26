
import { Canonical } from './canonical';

/**
 * Module 5: Sitemap & Hreflang Manager
 * Purpose: Logic for segmenting sitemaps to handle 1M+ pages and multi-region targeting.
 */

// Sitemap Limits (Google: 50k URLs or 50MB uncompressed)
const MAX_URLS_PER_SITEMAP = 45000; // Safety buffer

export type SitemapType =
    | 'us-states'
    | 'us-cities'
    | 'ca-provinces'
    | 'ca-cities'
    | 'providers'
    | 'loads'
    | 'corridors';

export async function generateSitemapIndex(): Promise<string> {
    const sitemaps = [
        'sitemap-us-states.xml',
        'sitemap-us-cities-1.xml',
        'sitemap-ca-provinces.xml',
        'sitemap-ca-cities-1.xml',
        'sitemap-providers-1.xml',
        'sitemap-loads-rolling.xml',
        'sitemap-corridors.xml'
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemaps.map(file => `
    <sitemap>
        <loc>https://haulcommand.com/${file}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    `).join('')}
</sitemapindex>`;
}

export function generateUrlEntry(url: string, lastMod: string, changeFreq: string, priority: string): string {
    return `
    <url>
        <loc>${url}</loc>
        <lastmod>${lastMod}</lastmod>
        <changefreq>${changeFreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
}

// Logic to shard a large list of IDs into multiple sitemaps
export function calculateSitemapShards(totalCount: number): number {
    return Math.ceil(totalCount / MAX_URLS_PER_SITEMAP);
}

// Hreflang Logic
export function getHreflangTags(enUrl: string, frUrl?: string): string {
    let xml = `<xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`;
    if (frUrl) {
        xml += `\n        <xhtml:link rel="alternate" hreflang="fr" href="${frUrl}" />`;
    }
    return xml;
}
