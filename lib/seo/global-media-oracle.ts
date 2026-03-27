// ══════════════════════════════════════════════════════════════
// GLOBAL MEDIA ORACLE — HC Recon
// Monitors 14 journalist source platforms across all regions
// Agent: HC Recon | Swarm: seo_backlink
// ══════════════════════════════════════════════════════════════

export interface MediaPlatform {
  name: string;
  region: string;
  type: 'journalist_source' | 'social_monitoring' | 'industry_specific' | 'pr_wire';
  url: string;
  monitoringMethod: 'api' | 'email_parse' | 'rss' | 'scrape' | 'webhook';
  languages: string[];
  costTier: 'free' | 'paid' | 'enterprise';
}

export const MEDIA_PLATFORMS: MediaPlatform[] = [
  // English Primary
  { name: 'HARO', region: 'US/Global', type: 'journalist_source', url: 'https://www.helpareporter.com', monitoringMethod: 'email_parse', languages: ['en'], costTier: 'free' },
  { name: 'Qwoted', region: 'US/Global', type: 'journalist_source', url: 'https://www.qwoted.com', monitoringMethod: 'api', languages: ['en'], costTier: 'free' },
  { name: 'ProfNet/PR Newswire', region: 'Global', type: 'pr_wire', url: 'https://profnet.prnewswire.com', monitoringMethod: 'email_parse', languages: ['en'], costTier: 'paid' },
  { name: 'Muck Rack', region: 'Global', type: 'journalist_source', url: 'https://muckrack.com', monitoringMethod: 'api', languages: ['en'], costTier: 'enterprise' },
  { name: 'JournoFinder', region: 'Global', type: 'journalist_source', url: 'https://journofinder.com', monitoringMethod: 'email_parse', languages: ['en'], costTier: 'free' },
  // UK/Europe
  { name: 'ResponseSource', region: 'UK/DACH/Global', type: 'journalist_source', url: 'https://www.responsesource.com', monitoringMethod: 'email_parse', languages: ['en', 'de'], costTier: 'paid' },
  { name: 'Cision', region: 'Global', type: 'journalist_source', url: 'https://www.cision.com', monitoringMethod: 'api', languages: ['en', 'de', 'fr', 'es', 'sv', 'no', 'da', 'fi', 'ja'], costTier: 'enterprise' },
  // APAC
  { name: 'SourceBottle', region: 'AU/APAC', type: 'journalist_source', url: 'https://www.sourcebottle.com', monitoringMethod: 'email_parse', languages: ['en'], costTier: 'free' },
  { name: 'Meltwater', region: 'Global/MENA/APAC', type: 'journalist_source', url: 'https://www.meltwater.com', monitoringMethod: 'api', languages: ['en', 'ar', 'hi'], costTier: 'enterprise' },
  // Social Monitoring
  { name: 'Twitter/X #journorequest', region: 'Global', type: 'social_monitoring', url: 'https://x.com/search?q=%23journorequest', monitoringMethod: 'api', languages: ['en'], costTier: 'paid' },
  { name: 'LinkedIn Sources', region: 'Global', type: 'social_monitoring', url: 'https://linkedin.com', monitoringMethod: 'scrape', languages: ['en'], costTier: 'free' },
  { name: 'Reddit Industry', region: 'Global', type: 'social_monitoring', url: 'https://reddit.com', monitoringMethod: 'api', languages: ['en'], costTier: 'free' },
  // Industry Specific
  { name: 'FreightWaves', region: 'US/Global', type: 'industry_specific', url: 'https://www.freightwaves.com', monitoringMethod: 'rss', languages: ['en'], costTier: 'free' },
  { name: 'Transport Topics', region: 'US', type: 'industry_specific', url: 'https://www.ttnews.com', monitoringMethod: 'rss', languages: ['en'], costTier: 'free' },
];

// Keywords to match journalist queries against
export const MEDIA_MATCH_KEYWORDS = [
  'trucking', 'logistics', 'heavy haul', 'oversize load', 'pilot car',
  'escort vehicle', 'freight', 'transportation', 'infrastructure',
  'autonomous vehicles', 'supply chain', 'DOT regulations', 'FMCSA',
  'bridge clearance', 'permit', 'superload', 'wind turbine transport',
  'wide load', 'convoy', 'route planning', 'commercial vehicle',
  'fleet management', 'last mile', 'intermodal', 'drayage',
];

// Response template for journalist pitches
export const PITCH_TEMPLATE = {
  subject: 'Expert Source: [TOPIC] — Haul Command (World\'s Largest Pilot Car Directory)',
  body: `Hi [JOURNALIST_NAME],

I’m reaching out regarding your query on [TOPIC]. Haul Command operates the world’s largest pilot car and escort vehicle directory, serving operators across 57 countries with 1.56M verified profiles.

[DATA_POINT_1]
[DATA_POINT_2]

I’d be happy to provide:
• Proprietary market data from our platform
• Expert commentary from our founder (military veteran, 15+ years in heavy haul)
• Real-time corridor analysis from our AI-powered intelligence engine

Best,
Haul Command Media Relations
haulcommand.com | press@haulcommand.com`,
  llm_config: {
    data_synthesis: 'gemini-2.5-pro',
    tone_calibration: 'claude-3.5-sonnet',
  },
};
