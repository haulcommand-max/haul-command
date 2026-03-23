/**
 * Haul Command — Role-Aware Command Center Configuration
 *
 * This file defines every role, its first questions, primary/secondary CTAs,
 * live modules, and hide/demote rules. Role selection is NOT cosmetic —
 * it rewires the entire surface priority, question flow, and next actions.
 */

// ─── Role Types ──────────────────────────────────────────────

export type HCRole =
  | 'escort_operator'
  | 'broker_dispatcher'
  | 'both'
  | 'support_partner'
  | 'observer_researcher';

export interface RoleAction {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
}

export interface RoleModule {
  id: string;
  label: string;
  type: 'live_feed' | 'metric' | 'action_list' | 'progress' | 'shortcuts';
  icon: string;
}

export interface RoleConfig {
  id: HCRole;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  headline: string;
  subheadline: string;
  firstQuestions: string[];
  primaryActions: RoleAction[];
  secondaryActions: RoleAction[];
  liveModules: RoleModule[];
  hideIds: string[];
}

// ─── Role Definitions ────────────────────────────────────────

export const ROLE_CONFIGS: Record<HCRole, RoleConfig> = {

  escort_operator: {
    id: 'escort_operator',
    label: 'Pilot / Operator',
    shortLabel: 'Pilot',
    icon: '🚛',
    description: 'I run pilot cars or escort vehicles',
    headline: 'Find Runs. Get Ranked.',
    subheadline: 'Your command center for runs, profile, and corridor rank.',
    firstQuestions: [
      'Find runs near you',
      'Claim your profile and get on the board',
      'Tell us what you run',
    ],
    primaryActions: [
      { id: 'op_find_loads', label: 'Find Runs', href: '/loads', icon: '📦', description: 'Browse runs in your AO' },
      { id: 'op_claim_profile', label: 'Claim Profile', href: '/claim', icon: '✅', description: 'Get on the board' },
      { id: 'op_get_verified', label: 'Get Verified', href: '/claim', icon: '🛡️', description: 'Earn the badge — priority placement' },
      { id: 'op_improve_rank', label: 'Improve Rank', href: '/leaderboards', icon: '📈', description: 'Move up for earlier access to runs' },
    ],
    secondaryActions: [
      { id: 'op_update_capabilities', label: 'Update Capabilities', href: '/claim', icon: '🔧', description: 'Set your services and equipment' },
      { id: 'op_service_area', label: 'Mark Your AO', href: '/directory', icon: '📍', description: 'Define where you operate' },
      { id: 'op_follow_corridors', label: 'Follow Corridors', href: '/corridors', icon: '🛤️', description: 'Track your active corridors' },
    ],
    liveModules: [
      { id: 'nearby_load_activity', label: 'Runs Near You', type: 'live_feed', icon: '📦' },
      { id: 'matching_corridors', label: 'Your Corridors', type: 'action_list', icon: '🛤️' },
      { id: 'local_supply_context', label: 'Pilots in Your AO', type: 'metric', icon: '📊' },
      { id: 'operator_rank_progress', label: 'Your Rank', type: 'progress', icon: '📈' },
    ],
    hideIds: [
      'hc_act_find_escorts',
      'broker_rescue_primary',
      'post_load_primary',
    ],
  },

  broker_dispatcher: {
    id: 'broker_dispatcher',
    label: 'Broker / Dispatcher',
    shortLabel: 'Broker',
    icon: '📋',
    description: 'I hire pilots and dispatch loads',
    headline: 'Find Coverage. Move Loads.',
    subheadline: 'Your command center for pilots, runs, and corridor supply.',
    firstQuestions: [
      'Need a pilot?',
      'Post a load',
      'Emergency extract — hard fill',
    ],
    primaryActions: [
      { id: 'br_post_load', label: 'Post a Load', href: '/loads', icon: '📤', description: 'Put out a run for immediate coverage' },
      { id: 'br_find_escort', label: 'Find a Pilot', href: '/directory', icon: '🔍', description: 'Search pilots on standby near your route' },
      { id: 'br_broker_rescue', label: 'Emergency Extract', href: '/loads', icon: '🆘', description: 'Emergency extract for hard-to-cover lanes' },
      { id: 'br_corridor_coverage', label: 'Corridor Intel', href: '/corridors', icon: '🗺️', description: 'Check coverage density on your corridors' },
    ],
    secondaryActions: [
      { id: 'br_recent_posts', label: 'Recent Runs', href: '/loads', icon: '📁', description: 'View your recent run postings' },
      { id: 'br_saved_corridors', label: 'Saved Corridors', href: '/corridors', icon: '⭐', description: 'Quick access to watched corridors' },
      { id: 'br_coverage_confidence', label: 'Coverage Confidence', href: '/leaderboards', icon: '📊', description: 'See fill rate and coverage data' },
    ],
    liveModules: [
      { id: 'corridor_supply_density', label: 'Corridor Coverage', type: 'metric', icon: '🗺️' },
      { id: 'rescue_recommendations', label: 'Extract Recommendations', type: 'action_list', icon: '🆘' },
      { id: 'verified_operators_nearby', label: 'Pilots on Standby', type: 'live_feed', icon: '🔍' },
      { id: 'lane_rate_service_mix', label: 'Lane Rate & Service Mix', type: 'metric', icon: '💰' },
    ],
    hideIds: [
      'op_claim_profile_primary',
      'op_rank_building_primary',
    ],
  },

  both: {
    id: 'both',
    label: 'Both — Pilot & Broker',
    shortLabel: 'Both',
    icon: '🔄',
    description: 'I do both — run and dispatch',
    headline: 'Your Dual Command Center',
    subheadline: 'Switch between pilot and broker mode. All tools, one surface.',
    firstQuestions: [
      'What are you doing right now?',
    ],
    primaryActions: [
      { id: 'dual_post_load', label: 'Post a Load', href: '/loads', icon: '📤', description: 'Put out a run for coverage' },
      { id: 'dual_find_loads', label: 'Find Runs', href: '/loads', icon: '📦', description: 'Browse runs in your AO' },
      { id: 'dual_switch_mode', label: 'Switch Mode', href: '#', icon: '🔄', description: 'Toggle between pilot and broker view' },
      { id: 'dual_open_inbox', label: 'Open Inbox', href: '/login', icon: '💬', description: 'View messages and notifications' },
    ],
    secondaryActions: [
      { id: 'dual_rescue', label: 'Emergency Extract', href: '/loads', icon: '🆘', description: 'Emergency extract or availability' },
      { id: 'dual_claim_profile', label: 'Claim Profile', href: '/claim', icon: '✅', description: 'Get on the board' },
      { id: 'dual_watchlist', label: 'Corridor Watchlist', href: '/corridors', icon: '👁️', description: 'Corridors you follow' },
    ],
    liveModules: [
      { id: 'broker_side_activity', label: 'Broker Activity', type: 'live_feed', icon: '📋' },
      { id: 'operator_side_activity', label: 'Pilot Activity', type: 'live_feed', icon: '🚛' },
      { id: 'current_mode', label: 'Current Mode', type: 'shortcuts', icon: '🔄' },
      { id: 'dual_shortcuts', label: 'Quick Actions', type: 'shortcuts', icon: '⚡' },
    ],
    hideIds: [],
  },

  support_partner: {
    id: 'support_partner',
    label: 'Support Partner',
    shortLabel: 'Partner',
    icon: '🏢',
    description: 'I provide support services (fuel, permits, parking, etc.)',
    headline: 'Become Visible to the Network',
    subheadline: 'Join the infrastructure layer where operators and brokers find you.',
    firstQuestions: [
      'What support do you provide?',
      'Claim or add your location',
      'Where do you serve?',
    ],
    primaryActions: [
      { id: 'sp_become_partner', label: 'Become Partner', href: '/claim', icon: '🤝', description: 'Join the Haul Command partner network' },
      { id: 'sp_claim_location', label: 'Claim Location', href: '/claim', icon: '📍', description: 'Claim your physical location listing' },
      { id: 'sp_list_services', label: 'List Services', href: '/services', icon: '📝', description: 'Add your services to the directory' },
      { id: 'sp_market_gaps', label: 'View Market Gaps', href: '/map', icon: '🗺️', description: 'See where support is needed most' },
    ],
    secondaryActions: [
      { id: 'sp_sponsor', label: 'Sponsor Visibility', href: '/claim', icon: '💎', description: 'Boost your visibility to operators' },
      { id: 'sp_requirements', label: 'Partner Requirements', href: '/escort-requirements', icon: '📋', description: 'Review partnership requirements' },
      { id: 'sp_operator_demand', label: 'Operator Demand', href: '/leaderboards', icon: '📊', description: 'Where operators need support' },
    ],
    liveModules: [
      { id: 'infrastructure_gaps', label: 'Infrastructure Gaps', type: 'metric', icon: '🗺️' },
      { id: 'partner_opportunities', label: 'Partner Opportunities', type: 'action_list', icon: '🤝' },
      { id: 'active_markets', label: 'Markets Needing Support', type: 'live_feed', icon: '📊' },
    ],
    hideIds: [
      'hc_act_find_escorts',
      'post_load_primary',
    ],
  },

  observer_researcher: {
    id: 'observer_researcher',
    label: 'Observer / Researcher',
    shortLabel: 'Observer',
    icon: '🔬',
    description: 'I track markets, trends, and industry data',
    headline: 'Track. Analyze. Understand.',
    subheadline: 'Industry intelligence for market watchers and researchers.',
    firstQuestions: [
      'What do you want to track?',
    ],
    primaryActions: [
      { id: 'obs_dashboard', label: 'Market Dashboard', href: '/leaderboards', icon: '📊', description: 'Live market rankings and trends' },
      { id: 'obs_corridors', label: 'Track Corridors', href: '/corridors', icon: '🛤️', description: 'Follow corridor activity over time' },
      { id: 'obs_reports', label: 'Read Reports', href: '/blog', icon: '📰', description: 'Intelligence reports and analysis' },
      { id: 'obs_density', label: 'Explore Density', href: '/map', icon: '🗺️', description: 'Operator and service density maps' },
    ],
    secondaryActions: [
      { id: 'obs_save_markets', label: 'Save Markets', href: '/map', icon: '⭐', description: 'Bookmark markets to watch' },
      { id: 'obs_watch_activity', label: 'Watch Activity', href: '/leaderboards', icon: '👁️', description: 'Follow real-time changes' },
      { id: 'obs_compare', label: 'Compare Regions', href: '/directory', icon: '⚖️', description: 'Side-by-side regional analysis' },
    ],
    liveModules: [
      { id: 'market_trends', label: 'Market Trends', type: 'metric', icon: '📈' },
      { id: 'corridor_activity', label: 'Corridor Activity', type: 'live_feed', icon: '🛤️' },
      { id: 'claim_growth', label: 'Claim Growth', type: 'metric', icon: '✅' },
      { id: 'density_changes', label: 'Density Changes', type: 'metric', icon: '🗺️' },
    ],
    hideIds: [
      'op_claim_profile_primary',
      'post_load_primary',
      'hc_act_find_escorts',
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────

export const ROLE_LIST: HCRole[] = [
  'escort_operator',
  'broker_dispatcher',
  'both',
  'support_partner',
  'observer_researcher',
];

export function getRoleConfig(role: HCRole): RoleConfig {
  return ROLE_CONFIGS[role];
}

export function isValidRole(value: string): value is HCRole {
  return ROLE_LIST.includes(value as HCRole);
}

/** Storage key for role persistence */
export const ROLE_STORAGE_KEY = 'hc_user_role';
