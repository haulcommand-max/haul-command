import { MetadataRoute } from 'next';
import { getAllStates } from '@/lib/regulatory-engine';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://hub.haulcommand.com'; // Placeholder, should be configured

    const states = getAllStates().map((state) => ({
        url: `${baseUrl}/state/${state.slug}`,
        lastModified: new Date(state.last_verified_date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Add static routes
    const routes = ['', '/blog', '/tools/movement-checker'].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1.0,
    }));

    return [...routes, ...states];
}
