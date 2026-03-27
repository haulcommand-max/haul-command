// ══════════════════════════════════════════════════════════════
// ELAI + HEYGEN + ELEVENLABS CONTENT PIPELINE
// Triple-stack AI content factory — HC Broadcast
// Elai: article-to-video | HeyGen: custom avatar | 11Labs: voice
// ══════════════════════════════════════════════════════════════

export interface ContentShow {
  name: string;
  format: string;
  frequency: string;
  languages: string[];
  engine: 'elai' | 'heygen' | 'elevenlabs' | 'elai+heygen';
  distribution: string[];
}

export const CONTENT_SHOWS: ContentShow[] = [
  {
    name: 'Haul Command Dispatch',
    format: 'Weekly 10-min AI-hosted industry briefing',
    frequency: 'weekly',
    languages: ['en'],
    engine: 'elai+heygen',
    distribution: ['YouTube', 'YouTube Shorts', 'Spotify', 'Apple Podcasts', 'LinkedIn', 'TikTok'],
  },
  {
    name: 'Haul Command Market Intel',
    format: 'Monthly deep-dive on corridor/state data',
    frequency: 'monthly',
    languages: ['en', 'es', 'pt', 'de', 'fr'],
    engine: 'heygen', // HeyGen auto-translates + lip syncs
    distribution: ['YouTube', 'Spotify', 'Apple Podcasts'],
  },
  {
    name: 'Haul Command Country Brief',
    format: 'Monthly per-country logistics intelligence',
    frequency: 'monthly',
    languages: ['en', 'es', 'pt', 'de', 'fr', 'ar', 'ja', 'ko'],
    engine: 'heygen',
    distribution: ['YouTube', 'LinkedIn'],
  },
  {
    name: 'Daily AI Podcast',
    format: '5-min daily audio briefing',
    frequency: 'daily',
    languages: ['en'],
    engine: 'elevenlabs', // Audio-only, Nathaniel/Stokes voice
    distribution: ['Spotify', 'Apple Podcasts', 'Google Podcasts', 'Amazon Music'],
  },
];

// Pipeline configuration
export const CONTENT_PIPELINE_CONFIG = {
  step1_script: {
    dataEngine: 'gemini-2.5-pro',   // Data synthesis from mm_feature_store
    scriptWriter: 'claude-3.5-sonnet', // Script writing with brand voice
  },
  step2_video: {
    elai: {
      apiKey: 'ELAI_API_KEY',
      avatarId: 'ELAI_AVATAR_ID',
      features: ['article-to-video', 'url-to-video', 'summarize'],
    },
    heygen: {
      apiKey: 'HEYGEN_API_KEY',
      avatarId: 'HEYGEN_AVATAR_ID',
      features: ['custom-avatar', 'lip-sync-translate', 'branded-overlays'],
    },
    elevenlabs: {
      apiKey: 'ELEVENLABS_API_KEY',
      voices: {
        en: 'nathaniel', // Primary English voice
        es: 'spanish_male_1',
        pt: 'portuguese_male_1',
        de: 'german_male_1',
        fr: 'french_male_1',
      },
    },
  },
  step3_distribution: {
    youtube: { channelName: 'Haul Command', autoShorts: true, shortsPerEpisode: 3 },
    podcast: ['Spotify for Podcasters', 'Apple Podcasts', 'Google Podcasts', 'Amazon Music'],
    social: ['LinkedIn', 'Twitter/X', 'Instagram Reels', 'TikTok', 'Facebook'],
    blog: { baseUrl: 'https://haulcommand.com/intelligence', transcriptIncluded: true },
  },
  backlinksPerEpisode: {
    youtubeDescription: 2,
    podcastShowNotes: 1,
    blogPost: 3,
    socialPosts: 4,
    total: 10,
  },
  monthlyOutput: {
    weeklyDispatches: 4,
    monthlyDeepDives: 1,
    countryBriefs: 2,
    dailyPodcasts: 30,
    totalEpisodes: 37,
    totalBacklinks: 370,
  },
};

// YouTube channel SEO config
export const YOUTUBE_SEO = {
  channelName: 'Haul Command',
  channelDescription: 'The operating system for heavy haul. World\'s largest pilot car & escort vehicle directory serving 57 countries.',
  playlists: [
    'Weekly Dispatch',
    'Market Intel by Country',
    'State Compliance Guides',
    'Operator Spotlights',
    'How-To: Equipment & Safety',
    'Industry Intelligence',
  ],
  defaultTags: ['pilot car', 'escort vehicle', 'oversize load', 'heavy haul', 'trucking', 'logistics', 'freight', 'Haul Command'],
};
