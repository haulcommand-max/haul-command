/**
 * Reusable SEO Variant Metadata Builder
 *
 * Drop-in for any international route:
 *
 * // app/[country]/[lang]/(routes)/corridor/[slug]/page.tsx
 * import { buildSeoVariantMetadata } from '@/lib/seo/variant-metadata';
 *
 * export async function generateMetadata({ params }) {
 *   return buildSeoVariantMetadata({ ...params, kind: 'corridor' });
 * }
 */

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getHreflangLinks } from './hreflang';
import type { SeoPageVariant, PageKind } from './routes';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com').replace(/\/+$/, '');

// ── Helpers ────────────────────────────────────────────────────────────────

function absoluteUrl(path: string): string {
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function robotsFor(mode: SeoPageVariant['indexing_mode']): Metadata['robots'] {
    if (mode === 'index') {
        return { index: true, follow: true, googleBot: { index: true, follow: true } };
    }
    return { index: false, follow: true, googleBot: { index: false, follow: true } };
}

function sanitize(s: string | null | undefined, max: number): string | undefined {
    if (!s) return undefined;
    const t = s.replace(/\s+/g, ' ').trim();
    if (!t) return undefined;
    return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function fallbackTitle(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const kind = parts[2] || 'page';
    const slug = parts[3] || '';
    return `${kind} ${slug}`.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' | Haul Command';
}

// ── Variant Resolver ───────────────────────────────────────────────────────

async function resolveVariant(path: string): Promise<SeoPageVariant | null> {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await supabase
        .from('seo_page_variants')
        .select('*')
        .eq('path', path)
        .single();
    return data;
}

// ── Main Export ────────────────────────────────────────────────────────────

type BuildMetaArgs = {
    country: string;
    lang: string;
    kind: PageKind;
    slug: string;
};

export async function buildSeoVariantMetadata(args: BuildMetaArgs): Promise<Metadata> {
    const path = `/${args.country}/${args.lang}/${args.kind}/${args.slug}`;
    const variant = await resolveVariant(path);

    if (!variant) {
        // Return minimal metadata; let the page component handle notFound()
        return {
            title: fallbackTitle(path),
            robots: { index: false, follow: true },
        };
    }

    const title = sanitize(variant.title, 70) ?? fallbackTitle(variant.path);
    const description = sanitize(variant.meta_description, 160);
    const canonical = absoluteUrl(variant.canonical_path || variant.path);

    // Hreflang mesh
    const hreflangLinks = await getHreflangLinks(variant.concept_id);

    const languages: Record<string, string> = {};
    let xDefaultHref: string | undefined;
    for (const l of hreflangLinks) {
        if (l.hreflang === 'x-default') {
            xDefaultHref = l.href;
        } else {
            languages[l.hreflang] = l.href;
        }
    }

    return {
        title,
        description,
        robots: robotsFor(variant.indexing_mode),
        alternates: {
            canonical,
            languages: Object.keys(languages).length ? languages : undefined,
        },
        openGraph: {
            type: 'website',
            url: canonical,
            title,
            description: description || undefined,
            siteName: 'Haul Command',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: description || undefined,
        },
        other: xDefaultHref
            ? { 'x-hreflang-x-default': xDefaultHref }
            : undefined,
    };
}

// ── Head Component: Manual hreflang links (for x-default support) ──────────

export { getHreflangLinks } from './hreflang';
