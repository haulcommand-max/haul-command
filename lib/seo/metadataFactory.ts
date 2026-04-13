import { Metadata } from 'next';

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
 */
export function generatePageMetadata(config: SeoConfig): Metadata {
    const canonicalUrl = `${DOMAIN}${config.canonicalPath}`;
    
    // Build the hreflang map for 120-country rollout compatibility
    const country = (config.countryCode || 'us').toLowerCase();
    const hreflang = {
        'en-US': country === 'us' ? canonicalUrl : `${DOMAIN}/directory/us`,
        'en-AU': country === 'au' ? canonicalUrl : `${DOMAIN}/directory/au`,
        'en-CA': country === 'ca' ? canonicalUrl : `${DOMAIN}/directory/ca`,
        'en-ZA': country === 'za' ? canonicalUrl : `${DOMAIN}/directory/za`,
        'en-GB': country === 'gb' ? canonicalUrl : `${DOMAIN}/directory/gb`,
        'x-default': canonicalUrl
    };

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
