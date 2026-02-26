/**
 * SEO Metadata Generator for Next.js App Router
 *
 * Generates: title, description, robots, canonical, hreflang alternates.
 * Wired to seo_page_variants + hreflang mesh.
 *
 * Usage in page.tsx:
 *   export { generateMetadata } from '@/lib/seo/metadata';
 *   (or customize per template)
 */

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getHreflangLinks } from './hreflang';
import type { SeoPageVariant } from './routes';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';
const SITE_NAME = 'Haul Command';

// ── Variant Resolver ───────────────────────────────────────────────────────

export async function resolveVariant(path: string): Promise<SeoPageVariant | null> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data } = await supabase
        .from('seo_page_variants')
        .select('*')
        .eq('path', path)
        .single();

    return data;
}

// ── Metadata Generator ────────────────────────────────────────────────────

export async function generateSeoMetadata(
    path: string,
    fallbackTitle?: string,
    fallbackDescription?: string,
): Promise<Metadata> {
    const variant = await resolveVariant(path);

    if (!variant) {
        return {
            title: fallbackTitle || SITE_NAME,
            description: fallbackDescription,
        };
    }

    // Hreflang links
    const hreflangLinks = await getHreflangLinks(variant.concept_id);

    // Build alternates
    const languages: Record<string, string> = {};
    for (const link of hreflangLinks) {
        languages[link.hreflang] = link.href;
    }

    // Robots
    const robots = variant.indexing_mode === 'index'
        ? { index: true, follow: true }
        : { index: false, follow: true };

    return {
        title: variant.title || fallbackTitle || SITE_NAME,
        description: variant.meta_description || fallbackDescription,
        robots,
        alternates: {
            canonical: `${SITE_URL}${variant.canonical_path}`,
            languages,
        },
        openGraph: {
            title: variant.title || fallbackTitle || SITE_NAME,
            description: variant.meta_description || fallbackDescription,
            url: `${SITE_URL}${variant.path}`,
            siteName: SITE_NAME,
            type: 'website',
        },
    };
}

// ── Head Component Helper ──────────────────────────────────────────────────

/**
 * Generate raw hreflang link elements for manual head injection.
 * Use when you need more control than generateMetadata provides.
 */
export function hreflangLinkElements(links: Array<{ hreflang: string; href: string }>) {
    return links.map((l) => ({
        rel: 'alternate',
        hrefLang: l.hreflang,
        href: l.href,
    }));
}
