// ══════════════════════════════════════════════════════════════
// HC AGENT BRANDING REGISTRY
// Military/Pilot Car themed agent identities for the 72-agent swarm
// ══════════════════════════════════════════════════════════════

export interface AgentIdentity {
  id: string;
  codename: string;
  fullName: string;
  role: string;
  swarm: string;
  description: string;
  icon: string;
}

export const HC_AGENTS: Record<string, AgentIdentity> = {
  // ── SEO & BACKLINK SWARM ─────────────────────────────────
  media_oracle: {
    id: 'media_oracle',
    codename: 'HC Recon',
    fullName: 'Haul Command Recon',
    role: 'HARO/journalist monitoring across 14 platforms',
    swarm: 'seo_backlink',
    description: 'Monitors HARO, Qwoted, ResponseSource, SourceBottle, Cision, Muck Rack & 8 more platforms for journalist queries',
    icon: '🔭',
  },
  brand_spider: {
    id: 'brand_spider',
    codename: 'HC Sentinel',
    fullName: 'Haul Command Sentinel',
    role: 'Brand mention detection across 57 countries',
    swarm: 'seo_backlink',
    description: 'Scans for unlinked brand mentions and converts them to backlinks',
    icon: '🛡️',
  },
  resource_builder: {
    id: 'resource_builder',
    codename: 'HC Fortify',
    fullName: 'Haul Command Fortify',
    role: '.gov compliance embed deployment (315+ targets)',
    swarm: 'seo_backlink',
    description: 'Deploys compliance widgets to government transport agency websites globally',
    icon: '🏗️',
  },
  broken_link_hunter: {
    id: 'broken_link_hunter',
    codename: 'HC Phoenix',
    fullName: 'Haul Command Phoenix',
    role: 'Dead link resurrection',
    swarm: 'seo_backlink',
    description: 'Finds broken links in logistics niche and pitches HC replacements',
    icon: '🔥',
  },
  wiki_librarian: {
    id: 'wiki_librarian',
    codename: 'HC Archive',
    fullName: 'Haul Command Archive',
    role: 'Wikipedia/wiki citations across 40+ editions',
    swarm: 'seo_backlink',
    description: 'Builds citations on 25+ Wikipedia language editions, Namu Wiki, state encyclopedias, Wikidata',
    icon: '📚',
  },
  link_monitor: {
    id: 'link_monitor',
    codename: 'HC Watchtower',
    fullName: 'Haul Command Watchtower',
    role: 'Backlink health monitoring',
    swarm: 'seo_backlink',
    description: 'Monitors all backlinks for removal/changes, alerts on lost links',
    icon: '🗼',
  },

  // ── CONTENT SWARM ────────────────────────────────────────
  podcast_factory: {
    id: 'podcast_factory',
    codename: 'HC Broadcast',
    fullName: 'Haul Command Broadcast',
    role: 'Elai + HeyGen + ElevenLabs video/podcast pipeline',
    swarm: 'content',
    description: 'Produces weekly AI video podcasts in 5 languages, distributes to 9 platforms',
    icon: '📡',
  },
  data_newsroom: {
    id: 'data_newsroom',
    codename: 'HC Intel',
    fullName: 'Haul Command Intel',
    role: 'Event-driven data journalism',
    swarm: 'content',
    description: 'Triggers press releases and data stories from macro events',
    icon: '📊',
  },
  content_writer: {
    id: 'content_writer',
    codename: 'HC Scribe',
    fullName: 'Haul Command Scribe',
    role: 'Blog/article generation for Intelligence hub',
    swarm: 'content',
    description: 'Produces weekly SEO articles for haulcommand.com/intelligence',
    icon: '✍️',
  },
  social_amplifier: {
    id: 'social_amplifier',
    codename: 'HC Signal',
    fullName: 'Haul Command Signal',
    role: 'Social media distribution to 9 platforms',
    swarm: 'content',
    description: 'Auto-publishes content to YouTube, LinkedIn, TikTok, X, IG, FB, Reddit, Pinterest, Threads',
    icon: '📣',
  },

  // ── SEO ENGINE SWARM ─────────────────────────────────────
  seo_generator: {
    id: 'seo_generator',
    codename: 'HC Pathfinder',
    fullName: 'Haul Command Pathfinder',
    role: 'Programmatic page generation (2M+ pages)',
    swarm: 'seo_engine',
    description: 'Generates country/state/city/corridor landing pages at scale',
    icon: '🗺️',
  },
  profile_boost: {
    id: 'profile_boost',
    codename: 'HC Convoy',
    fullName: 'Haul Command Convoy',
    role: 'Operator profile SEO optimization',
    swarm: 'seo_engine',
    description: 'Optimizes 1.56M directory profiles with LocalBusiness schema, near-me keywords',
    icon: '🚛',
  },
  compliance_widget: {
    id: 'compliance_widget',
    codename: 'HC Shield',
    fullName: 'Haul Command Shield',
    role: '.gov compliance embed builder',
    swarm: 'seo_engine',
    description: 'Generates embeddable compliance widgets for 315+ government domains',
    icon: '🛡️',
  },
  sitemap_gen: {
    id: 'sitemap_gen',
    codename: 'HC Cartographer',
    fullName: 'Haul Command Cartographer',
    role: 'Dynamic sitemap management for 2M+ pages',
    swarm: 'seo_engine',
    description: 'Manages XML sitemaps, hreflang tags, and search engine ping notifications',
    icon: '🧭',
  },

  // ── OUTREACH SWARM ───────────────────────────────────────
  outreach_mailer: {
    id: 'outreach_mailer',
    codename: 'HC Dispatch Comms',
    fullName: 'Haul Command Dispatch Communications',
    role: 'Email outreach sequences',
    swarm: 'outreach',
    description: 'Sends personalized outreach for backlinks, partnerships, press',
    icon: '📧',
  },
  voice_outreach: {
    id: 'voice_outreach',
    codename: 'HC Callsign',
    fullName: 'Haul Command Callsign',
    role: 'LiveKit voice agent for claims and outreach',
    swarm: 'outreach',
    description: 'Makes outbound claim calls, podcast pitches, and verification calls via LiveKit',
    icon: '📞',
  },
  rate_index: {
    id: 'rate_index',
    codename: 'HC Market',
    fullName: 'Haul Command Market',
    role: 'Rate transparency data engine',
    swarm: 'outreach',
    description: 'Computes and publishes market rate data for all corridors',
    icon: '💰',
  },
  claim_engine: {
    id: 'claim_engine',
    codename: 'HC Rally Point',
    fullName: 'Haul Command Rally Point',
    role: 'Operator claim & verification (57 countries)',
    swarm: 'outreach',
    description: 'Manages claim lifecycle: initiation, OTP, DNS, video verification, gamification',
    icon: '🎯',
  },
};

// Helper to get agent by codename
export function getAgentByCodename(codename: string): AgentIdentity | undefined {
  return Object.values(HC_AGENTS).find(a => a.codename === codename);
}

// Get all agents in a swarm
export function getSwarmAgents(swarm: string): AgentIdentity[] {
  return Object.values(HC_AGENTS).filter(a => a.swarm === swarm);
}

// Swarm definitions
export const SWARMS = {
  seo_backlink: { name: 'SEO & Backlink Swarm', agents: 6 },
  content: { name: 'Content Swarm', agents: 4 },
  seo_engine: { name: 'SEO Engine Swarm', agents: 4 },
  outreach: { name: 'Outreach Swarm', agents: 4 },
} as const;
