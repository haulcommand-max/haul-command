import { MetadataRoute } from 'next';
import { getAllAVSEOSlugs } from '@/lib/seo/av-keywords';

// ── US State codes (50 states + DC)
const US_STATES = [
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks',
  'ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny',
  'nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv',
  'wi','wy','dc',
];

// ── Tier A countries for AV regulations
const AV_REGULATION_COUNTRIES = ['us','gb','de','au','ae','ca','sg','jp','se','no','nl','za','br','in','kr'];

// ── Oilfield corridor slugs
const OILFIELD_CORRIDORS = ['permian','eagle-ford','bakken','marcellus','gulf-coast','dj-basin','haynesville','anadarko'];

// ── AV company slugs (for dedicated pages)
const AV_COMPANY_SLUGS = [
  'aurora-innovation','kodiak-robotics','waabi','waymo','torc-robotics','gatik','plus-ai',
  'bot-auto','einride','wayve','weride','rio-tinto-autohаul','fortescue','bhp','pony-ai',
];


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
    // ── Training + Certification
    { url: `${BASE_URL}/training`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/training/av-certification`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/training/corporate`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // ── Partners
    { url: `${BASE_URL}/partners/av-companies`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // ── AV Regulations Hub
    { url: `${BASE_URL}/regulations/autonomous-vehicles`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    // ── Oilfield hub
    { url: `${BASE_URL}/corridors/oilfield`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
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

  // US state regulation pages (50 states + DC)
  const usStateRegPages: MetadataRoute.Sitemap = US_STATES.map(state => ({
    url: `${BASE_URL}/regulations/us/${state}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // AV regulations country pages
  const avRegCountryPages: MetadataRoute.Sitemap = AV_REGULATION_COUNTRIES.map(cc => ({
    url: `${BASE_URL}/regulations/autonomous-vehicles/${cc}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Oilfield corridor pages
  const oilfieldCorridorPages: MetadataRoute.Sitemap = OILFIELD_CORRIDORS.map(slug => ({
    url: `${BASE_URL}/corridors/us/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // AV company dedicated pages
  const avCompanyPages: MetadataRoute.Sitemap = AV_COMPANY_SLUGS.map(slug => ({
    url: `${BASE_URL}/regulations/autonomous-vehicles/company/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  return [
    ...corePages,
    ...companyPages,
    ...avPages,
    ...usStateRegPages,
    ...avRegCountryPages,
    ...oilfieldCorridorPages,
    ...avCompanyPages,
  ];
}

