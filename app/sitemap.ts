import { MetadataRoute } from 'next';
import { getAllAVSEOSlugs } from '@/lib/seo/av-keywords';

const BASE_URL = 'https://haulcommand.com';

// Hardcoded company slugs from migration seed data
const COMPANY_SLUGS = [
  'aurora-innovation','waymo-via','kodiak-robotics','plus-ai','gatik','einride',
  'volvo-autonomous','daimler-autonomous','torc-robotics','locomation',
  'mammoet','sarens','ale-heavylift','fagioli','barnhart','landstar','daseke',
  'vestas','ge-vernova','siemens-gamesa','nordex','enercon',
  'deep-south-crane','omega-morgan','keen-transport','nussbaum-transportation','buchanan-hauling','goldhofer','max-bogl','cts-nordics',
  'wabtec','scheuerle','nooteboom','bnsf-logistics','xpo-logistics','schneider-national',
  'perth-heavy-haulage','macs-heavy-haulage','pratt-industries','collett-transport',
  'abnormal-loads','hs2-transport','saudi-heavy-lift','enercon-brazil','suzlon-energy',
  'tata-projects','saipem','lamprell','jumbo-maritime','ti-group',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Core pages
  const corePages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/permits`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/permits/agents`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/intel`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/enterprise/autonomous`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/press`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/sla`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Company claim pages (50 companies)
  const companyPages: MetadataRoute.Sitemap = COMPANY_SLUGS.map(slug => ({
    url: `${BASE_URL}/companies/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Multilingual AV SEO pages (hundreds of combinations)
  const avSeoSlugs = getAllAVSEOSlugs();
  const avPages: MetadataRoute.Sitemap = avSeoSlugs.map(({ country, slug }) => ({
    url: `${BASE_URL}/autonomous/${country}/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...corePages, ...companyPages, ...avPages];
}
