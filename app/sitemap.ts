import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://haulcommand.com';
    return [
        { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${baseUrl}/load-board`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
        { url: `${baseUrl}/directory`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
        { url: `${baseUrl}/compliance-kit`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];
}
