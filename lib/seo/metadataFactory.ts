import { Metadata } from 'next';
import { getGlobalHreflangTags } from '@/lib/seo/hreflang';

export interface SeoConfig {
    title: string;
    description: string;
    canonicalPath: string; // e.g. "/corridor/tx-to-ok"
    countryCode?: string; // 'us', 'au', 'za', defaults to 'us'
    noIndex?: boolean;
}

const DEFAULT_SITE_NAME = 'Haul Command';
const DOMAIN = 'https://www.haulcommand.com';

/**
 * HC-W1-03 Canonical URL / Slug / Hreflang Discipline
 * Generates strict canonical and hreflang tags for any Next.js 15 page.
 * Now wired to the full 120-country hreflang engine (lib/seo/hreflang.ts).
 */
export function generatePageMetadata(config: SeoConfig): Metadata {
    const canonicalUrl = `${DOMAIN}${config.canonicalPath}`;
    
    // Wire the full 120-country hreflang engine
    const hreflang = getGlobalHreflangTags(config.canonicalPath);

    return {
        title: `${config.title} | ${DEFAULT_SITE_NAME}`,
        description: config.description,
        alternates: {
            canonical: canonicalUrl,
            languages: hreflang,
        },
        robots: {
            index: !config.noIndex,
            follow: !config.noIndex,
            googleBot: {
                index: !config.noIndex,
                follow: !config.noIndex,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        openGraph: {
            title: config.title,
            description: config.description,
            url: canonicalUrl,
            siteName: DEFAULT_SITE_NAME,
            locale: `en_${country.toUpperCase()}`,
            type: 'website',
        },
    };
}
