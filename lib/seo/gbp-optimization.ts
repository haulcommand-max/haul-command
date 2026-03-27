// ══════════════════════════════════════════════════════════════
// GOOGLE BUSINESS PROFILE OPTIMIZATION CONFIG
// Gradual transition plan + category management
// ══════════════════════════════════════════════════════════════

export const GBP_OPTIMIZATION = {
  // DO NOT create a new profile — keep existing
  keepExistingProfile: true,

  // Gradual transition schedule (avoid Google suspicion)
  transitionPlan: [
    {
      week: 1,
      action: 'Update business category',
      primaryCategory: 'Software Company',
      secondaryCategories: ['Transportation Service', 'Business to Business Service'],
      note: 'Change ONLY categories in week 1. Nothing else.',
    },
    {
      week: 2,
      action: 'Update description',
      description: 'Haul Command is the operating system for heavy haul \u2014 the world\'s largest pilot car and escort vehicle directory, load board, and compliance platform serving operators across 57 countries.',
      note: 'Update description only. Leave address/phone untouched.',
    },
    {
      week: 3,
      action: 'Update website + contact info',
      websiteUrl: 'https://haulcommand.com',
      businessType: 'Service Area Business',
      hidePhysicalAddress: true,
      note: 'Service-area business hides address. Update phone if needed.',
    },
    {
      week: 4,
      action: 'Add photos + enable messaging',
      photos: ['logo', 'team', 'app_screenshots', 'dashboard'],
      enableMessaging: true,
      note: 'Add 8-12 high-quality images. Enable Google messaging.',
    },
  ],

  // Review collection URL (from GBP "Get more reviews")
  reviewUrl: process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_PLACE_ID/review',

  // Posts strategy (weekly GBP posts for freshness signal)
  postSchedule: {
    frequency: 'weekly',
    types: ['update', 'offer', 'event'],
    content_source: 'lib/content/content-pipeline.ts',
  },
};

// Email capture config (money on the table: no email capture currently)
export const EMAIL_CAPTURE_CONFIG = {
  enabled: true,
  placements: [
    {
      location: 'homepage_hero',
      cta: 'Get state escort requirement updates by email',
      incentive: 'Free compliance alerts for your corridors',
    },
    {
      location: 'directory_sidebar',
      cta: 'Get notified when new operators join your area',
      incentive: 'Real-time market intelligence',
    },
    {
      location: 'blog_footer',
      cta: 'Subscribe to Haul Command Intelligence',
      incentive: 'Weekly industry briefing + corridor data',
    },
    {
      location: 'exit_intent',
      cta: 'Before you go \u2014 get your free state compliance checklist',
      incentive: 'Downloadable PDF + email series',
    },
  ],
  listUses: [
    'Review request campaigns (via review-gating-engine)',
    'Product launch announcements',
    'Intelligence newsletter (weekly)',
    'Corridor-specific market alerts',
  ],
};

// Facebook Group backlink strategy
export const FACEBOOK_GROUP_CONFIG = {
  groupUrl: 'https://facebook.com/groups/pilotcarjobs',
  pinnedPost: {
    text: '🚛 Find pilot car jobs, post loads, and connect with verified operators at haulcommand.com \u2014 the world\'s largest pilot car directory. Free to join.',
    link: 'https://haulcommand.com',
    pinned: true,
  },
  seoValue: 'High-traffic Facebook group = real backlink signal to Google',
};
