import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/command-dashboard/',
                    '/settings/',
                    '/auth/'
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
            },
            {
                // Crown Jewel Architecture blocks predatory scraper bots
                userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
                disallow: ['/directory/'],
            }
        ],
        sitemap: 'https://haulcommand.com/sitemap.xml',
    };
}
