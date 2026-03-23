/**
 * Sitemap for company claim pages and autonomous SEO pages
 * TRACK 1 + TRACK 2 sitemap entries
 */
import { MetadataRoute } from 'next';
import { getAllCompanySlugs } from '@/lib/data/company-seed';
import { getAllAutonomousSeoParams } from '@/lib/data/autonomous-seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://haulcommand.com';
  const now = new Date().toISOString();

  // Company pages
  const companyPages = getAllCompanySlugs().map(slug => ({
    url: `${baseUrl}/companies/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Autonomous SEO pages
  const autonomousPages = getAllAutonomousSeoParams().map(p => ({
    url: `${baseUrl}/autonomous/${p.country}/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Permit pages
  const permitPages = [
    { url: `${baseUrl}/permits`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/permits/agents`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${baseUrl}/permits/request`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
  ];

  // QuickPay + Availability
  const featurePages = [
    { url: `${baseUrl}/quickpay`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/availability`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/companies`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 },
  ];

  return [...companyPages, ...autonomousPages, ...permitPages, ...featurePages];
}
