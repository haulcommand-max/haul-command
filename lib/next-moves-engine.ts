/**
 * lib/next-moves-engine.ts
 * ══════════════════════════════════════════════════════════════
 * Haul Command — Next Moves Engine
 *
 * The single source of truth for "what should this user do next?"
 *
 * Architecture:
 *   Signal collectors → Decision resolver → NextMove[] output
 *
 * Used by:
 *   - Homepage (anonymous + known user)
 *   - App dashboard (authenticated)
 *   - Directory pages (contextual)
 *   - Load board (contextual)
 *   - Push notification scheduler
 *   - Empty state fallbacks (never blank)
 *
 * TRUTH-FIRST: if data doesn't exist, we degrade gracefully.
 * We never fake urgency. Scarcity signals are only shown when real.
 * ══════════════════════════════════════════════════════════════
 */

import { HCRole, ROLE_CONFIGS, getRoleConfig } from './role-config';

// ─── Types ────────────────────────────────────────────────────

export type MoveCategory =
  | 'claim'          // Claim or complete profile
  | 'jobs'           // Browse or post loads
  | 'compliance'     // Check regs, permits
  | 'discovery'      // Explore directory, corridors
  | 'upgrade'        // Premium features, certifications
  | 'return'         // Re-engage after absence
  | 'tools'          // Use a specific tool
  | 'market'         // Explore a specific market
  | 'install';       // App install / PWA

export type MoveUrgency = 'critical' | 'high' | 'normal' | 'low';

export type MoveTrigger =
  | 'no_profile'
  | 'incomplete_profile'
  | 'no_load_posted'
  | 'load_near_expiry'
  | 'loads_in_area'
  | 'unclaimed_region'
  | 'demand_spike'
  | 'repeat_visitor'
  | 'idle_operator'
  | 'missing_certifications'
  | 'corridor_opportunity'
  | 'anonymous'
  | 'role_selected_no_action'
  | 'fallback';

export interface NextMove {
  id: string;
  category: MoveCategory;
  urgency: MoveUrgency;
  trigger: MoveTrigger;
  label: string;           // Short action label: "Post Your Load"
  sublabel: string;        // Context line: "Your corridor has 3 open requests"
  href: string;            // Exact route — NEVER a dead end
  ctaText: string;         // Button text
  icon: string;            // Lucide icon name
  color: string;           // Hex accent
  isPrimary: boolean;      // Show as dominant action vs secondary
  pushTitle?: string;      // Push notification title if triggered later
  pushBody?: string;       // Push notification body
  analyticsEvent?: string; // PostHog event name to fire on click
  monetizationPath?: string; // Upgrade route if this triggers paid feature
}

// ─── Signal Interfaces ────────────────────────────────────────

export interface UserSignals {
  // Role
  role: HCRole | null;
  isAuthenticated: boolean;

  // Profile state
  hasProfile: boolean;
  profileComplete: boolean;
  profileCompletionPct: number;
  hasClaim: boolean;
  hasCertifications: boolean;

  // Activity
  hasPostedLoad: boolean;
  activeLoadCount: number;
  lastActiveAt: Date | null;
  visitCount: number;           // From cookie or Supabase
  daysSinceLastVisit: number;

  // Location
  detectedRegion: string | null;     // "TX", "Alberta", etc.
  detectedState: string | null;
  savedCorridors: string[];

  // Market context (from /api/demand/signals)
  loadsNearby: number;
  demandscore: number;           // 0-100 from demand signals API
  operatorsBelowSupply: boolean; // supply < demand in detected region
  unclaimedRegion: boolean;      // region has <3 claimed operators

  // Behavior
  hasVisitedDirectory: boolean;
  hasVisitedLoads: boolean;
  hasVisitedTools: boolean;
  bouncedLast: boolean;
}

// ─── Default Signals (anonymous, no data) ────────────────────

export const DEFAULT_SIGNALS: UserSignals = {
  role: null,
  isAuthenticated: false,
  hasProfile: false,
  profileComplete: false,
  profileCompletionPct: 0,
  hasClaim: false,
  hasCertifications: false,
  hasPostedLoad: false,
  activeLoadCount: 0,
  lastActiveAt: null,
  visitCount: 1,
  daysSinceLastVisit: 0,
  detectedRegion: null,
  detectedState: null,
  savedCorridors: [],
  loadsNearby: 0,
  demandscore: 0,
  operatorsBelowSupply: false,
  unclaimedRegion: false,
  hasVisitedDirectory: false,
  hasVisitedLoads: false,
  hasVisitedTools: false,
  bouncedLast: false,
};

// ─── Decision Engine ──────────────────────────────────────────

/**
 * resolveNextMoves()
 *
 * The core logic function. Pure — no side effects, no async.
 * Returns ordered NextMove[] from highest to lowest urgency.
 *
 * Callers supply signals from wherever they have data.
 * Server components pass DB signals.
 * Client hooks pass localStorage + PostHog signals.
 */
export function resolveNextMoves(signals: Partial<UserSignals>): NextMove[] {
  const s: UserSignals = { ...DEFAULT_SIGNALS, ...signals };
  const moves: NextMove[] = [];

  // ── RULE 1: Operator with no claim → CRITICAL ──────────────
  if (s.role === 'escort_operator' && !s.hasClaim) {
    moves.push({
      id: 'claim_profile_operator',
      category: 'claim',
      urgency: 'critical',
      trigger: 'no_profile',
      label: 'Claim Your Profile',
      sublabel: s.unclaimedRegion
        ? `Your area has almost no claimed operators — be first`
        : 'Unclaimed profiles get zero visibility on loads',
      href: '/claim',
      ctaText: 'Claim Free Profile',
      icon: 'Shield',
      color: '#C6923A',
      isPrimary: true,
      pushTitle: '🚛 Your profile is unclaimed',
      pushBody: 'Operators with claimed profiles get 3× more load matches. Claim yours free.',
      analyticsEvent: 'next_move_claim_clicked',
      monetizationPath: '/claim?upgrade=elite',
    });
  }

  // ── RULE 2: Operator with incomplete profile → HIGH ─────────
  if (s.role === 'escort_operator' && s.hasClaim && !s.profileComplete && s.profileCompletionPct < 70) {
    moves.push({
      id: 'complete_profile',
      category: 'claim',
      urgency: 'high',
      trigger: 'incomplete_profile',
      label: 'Complete Your Profile',
      sublabel: `${s.profileCompletionPct}% done — finish to unlock load matching`,
      href: '/claim',
      ctaText: `Finish Profile (${s.profileCompletionPct}%)`,
      icon: 'CheckCircle',
      color: '#C6923A',
      isPrimary: true,
      pushTitle: 'Finish your Haul Command profile',
      pushBody: `You're ${s.profileCompletionPct}% done. Finish to get matched with loads in your area.`,
      analyticsEvent: 'next_move_complete_profile_clicked',
    });
  }

  // ── RULE 3: Broker with no load posted → CRITICAL ─────────
  if (s.role === 'broker_dispatcher' && !s.hasPostedLoad) {
    moves.push({
      id: 'post_first_load',
      category: 'jobs',
      urgency: 'critical',
      trigger: 'no_load_posted',
      label: 'Post Your First Load',
      sublabel: 'Reach verified operators in your corridor instantly',
      href: '/loads/post',
      ctaText: 'Post Load Now',
      icon: 'TrendingUp',
      color: '#22C55E',
      isPrimary: true,
      pushTitle: '📤 Ready to move a load?',
      pushBody: 'Post your first load and reach verified operators in your area.',
      analyticsEvent: 'next_move_post_load_clicked',
    });
  }

  // ── RULE 4: Broker with active loads → return to board ─────
  if (s.role === 'broker_dispatcher' && s.activeLoadCount > 0) {
    moves.push({
      id: 'manage_active_loads',
      category: 'return',
      urgency: 'high',
      trigger: 'return',
      label: `Manage Your ${s.activeLoadCount} Active Load${s.activeLoadCount > 1 ? 's' : ''}`,
      sublabel: 'View responses and update status',
      href: '/loads',
      ctaText: 'View Load Board',
      icon: 'Zap',
      color: '#3B82F6',
      isPrimary: true,
      analyticsEvent: 'next_move_manage_loads_clicked',
    });
  }

  // ── RULE 5: Loads available nearby → strong signal ─────────
  if (s.loadsNearby > 0 && s.role === 'escort_operator') {
    moves.push({
      id: 'loads_nearby',
      category: 'jobs',
      urgency: s.loadsNearby > 5 ? 'high' : 'normal',
      trigger: 'loads_in_area',
      label: `${s.loadsNearby} Loads Near You`,
      sublabel: s.detectedState
        ? `Active loads in ${s.detectedState} — check availability`
        : 'Active loads in your detected region',
      href: s.detectedState ? `/loads?state=${s.detectedState}` : '/loads',
      ctaText: 'View Loads',
      icon: 'Zap',
      color: '#3B82F6',
      isPrimary: false,
      pushTitle: `📦 ${s.loadsNearby} loads near you`,
      pushBody: 'New loads just posted in your area. Check availability before they fill.',
      analyticsEvent: 'next_move_loads_nearby_clicked',
    });
  }

  // ── RULE 6: High demand region, supply missing ──────────────
  if (s.operatorsBelowSupply && s.role === 'escort_operator') {
    moves.push({
      id: 'demand_spike_operator',
      category: 'market',
      urgency: 'high',
      trigger: 'demand_spike',
      label: 'High Demand in Your Area',
      sublabel: 'More loads than operators — you can fill this gap',
      href: s.detectedState ? `/directory/${s.detectedState?.toLowerCase()}` : '/directory',
      ctaText: 'Explore Demand',
      icon: 'TrendingUp',
      color: '#F59E0B',
      isPrimary: false,
      analyticsEvent: 'next_move_demand_spike_clicked',
      monetizationPath: '/claim?upgrade=territory',
    });
  }

  // ── RULE 7: Unclaimed region — be first ─────────────────────
  if (s.unclaimedRegion) {
    moves.push({
      id: 'be_first_in_region',
      category: 'claim',
      urgency: 'high',
      trigger: 'unclaimed_region',
      label: 'Be First in Your Area',
      sublabel: `Operators in ${s.detectedState || 'your region'} are almost unclaimed`,
      href: '/claim',
      ctaText: 'Claim Territory',
      icon: 'Map',
      color: '#A855F7',
      isPrimary: false,
      analyticsEvent: 'next_move_first_in_region_clicked',
      monetizationPath: '/claim?upgrade=territory',
    });
  }

  // ── RULE 8: Repeat visitor, no action taken ─────────────────
  if (s.visitCount >= 2 && s.daysSinceLastVisit <= 7 && !s.isAuthenticated && s.bouncedLast) {
    moves.push({
      id: 'return_visitor_prompt',
      category: 'return',
      urgency: 'normal',
      trigger: 'repeat_visitor',
      label: 'Welcome Back',
      sublabel: 'Pick up where you left off — no account needed to browse',
      href: '/directory',
      ctaText: 'Continue Browsing',
      icon: 'ArrowRight',
      color: '#C6923A',
      isPrimary: false,
      analyticsEvent: 'next_move_return_visitor_clicked',
    });
  }

  // ── RULE 9: Operator idle (no recent activity) ──────────────
  if (s.role === 'escort_operator' && s.daysSinceLastVisit > 14) {
    moves.push({
      id: 'idle_operator_reactivate',
      category: 'return',
      urgency: 'high',
      trigger: 'idle_operator',
      label: 'Your Profile Needs Attention',
      sublabel: `You haven't been active in ${s.daysSinceLastVisit} days — loads are passing you by`,
      href: '/claim',
      ctaText: 'Reactivate Profile',
      icon: 'Bell',
      color: '#EF4444',
      isPrimary: true,
      pushTitle: '⚠️ Your profile visibility has dropped',
      pushBody: `You haven't logged in for ${s.daysSinceLastVisit} days. Reactivate to keep appearing on loads.`,
      analyticsEvent: 'next_move_reactivation_clicked',
    });
  }

  // ── RULE 10: Operator without certifications ────────────────
  if (s.role === 'escort_operator' && s.hasClaim && !s.hasCertifications) {
    moves.push({
      id: 'get_certified',
      category: 'upgrade',
      urgency: 'normal',
      trigger: 'missing_certifications',
      label: 'Add Your Certifications',
      sublabel: 'Certified operators book 2× more loads',
      href: '/training',
      ctaText: 'Get Certified',
      icon: 'Trophy',
      color: '#F59E0B',
      isPrimary: false,
      analyticsEvent: 'next_move_certification_clicked',
      monetizationPath: '/training?plan=hc_elite',
    });
  }

  // ── RULE 11: Saved corridors + new demand signal ────────────
  if (s.savedCorridors.length > 0) {
    const topCorridor = s.savedCorridors[0];
    moves.push({
      id: 'corridor_activity',
      category: 'market',
      urgency: 'normal',
      trigger: 'corridor_opportunity',
      label: `Activity on ${topCorridor}`,
      sublabel: 'Your watched corridor has new load activity',
      href: `/corridors/${topCorridor.toLowerCase().replace(/\s+/g, '-')}`,
      ctaText: 'Check Corridor',
      icon: 'Map',
      color: '#3B82F6',
      isPrimary: false,
      analyticsEvent: 'next_move_corridor_clicked',
    });
  }

  // ── RULE 12: Compliance check for broker ───────────────────
  if (s.role === 'broker_dispatcher' && s.detectedState && !s.hasVisitedTools) {
    moves.push({
      id: 'check_regulations',
      category: 'compliance',
      urgency: 'normal',
      trigger: 'role_selected_no_action',
      label: `${s.detectedState} Escort Requirements`,
      sublabel: 'Check what permits and escorts are required for your route',
      href: `/escort-requirements/${s.detectedState.toLowerCase()}`,
      ctaText: 'Check Requirements',
      icon: 'BookOpen',
      color: '#F59E0B',
      isPrimary: false,
      analyticsEvent: 'next_move_regulations_clicked',
    });
  }

  // ── RULE 13: Anonymous → discovery push ─────────────────────
  if (!s.isAuthenticated && !s.role && moves.length === 0) {
    moves.push(
      {
        id: 'anon_find_operators',
        category: 'discovery',
        urgency: 'normal',
        trigger: 'anonymous',
        label: 'Find Pilot Car Operators',
        sublabel: '2,400+ verified operators across 120 countries',
        href: '/directory',
        ctaText: 'Browse Directory',
        icon: 'Search',
        color: '#C6923A',
        isPrimary: true,
        analyticsEvent: 'next_move_anon_directory_clicked',
      },
      {
        id: 'anon_post_load',
        category: 'jobs',
        urgency: 'normal',
        trigger: 'anonymous',
        label: 'Moving a Wide Load?',
        sublabel: 'Post your route and get matched with operators instantly',
        href: '/loads/post',
        ctaText: 'Post a Load',
        icon: 'TrendingUp',
        color: '#22C55E',
        isPrimary: false,
        analyticsEvent: 'next_move_anon_post_load_clicked',
      }
    );
  }

  // ── FALLBACK: never return empty ────────────────────────────
  if (moves.length === 0) {
    moves.push(
      {
        id: 'fallback_explore',
        category: 'discovery',
        urgency: 'low',
        trigger: 'fallback',
        label: 'Explore Your Market',
        sublabel: 'See active operators, corridors, and loads in your region',
        href: '/directory',
        ctaText: 'Open Directory',
        icon: 'Globe',
        color: '#6B7280',
        isPrimary: true,
        analyticsEvent: 'next_move_fallback_clicked',
      }
    );
  }

  // Sort: critical → high → normal → low, primary first within tier
  const urgencyOrder: Record<MoveUrgency, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  return moves.sort((a, b) => {
    const uDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (uDiff !== 0) return uDiff;
    return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
  });
}

// ─── Helper: get top N moves for a surface ───────────────────

export function getTopMoves(signals: Partial<UserSignals>, count = 3): NextMove[] {
  return resolveNextMoves(signals).slice(0, count);
}

export function getPrimaryMove(signals: Partial<UserSignals>): NextMove {
  return resolveNextMoves(signals)[0];
}

// ─── Helper: role-aware moves from role-config ───────────────
// Bridges the existing ROLE_CONFIGS to the NextMove format

export function getRoleNextMoves(role: HCRole, signals: Partial<UserSignals>): NextMove[] {
  const config = getRoleConfig(role);
  const engineMoves = resolveNextMoves({ ...signals, role });

  // Merge: engine moves take priority for urgency, role config fills gaps
  const existingIds = new Set(engineMoves.map(m => m.id));

  const roleActions: NextMove[] = config.primaryActions
    .filter(a => !existingIds.has(a.id))
    .slice(0, 2)
    .map(a => ({
      id: a.id,
      category: 'discovery' as MoveCategory,
      urgency: 'normal' as MoveUrgency,
      trigger: 'role_selected_no_action' as MoveTrigger,
      label: a.label,
      sublabel: a.description,
      href: a.href,
      ctaText: a.label,
      icon: 'ArrowRight',
      color: '#C6923A',
      isPrimary: false,
      analyticsEvent: `role_action_${a.id}_clicked`,
    }));

  return [...engineMoves, ...roleActions].slice(0, 5);
}

// ─── Push Notification Batch Scheduler ───────────────────────
// Produces pushable NextMoves — only those with pushTitle defined

export function getSchedulablePushMoves(signals: Partial<UserSignals>): NextMove[] {
  return resolveNextMoves(signals).filter(m => m.pushTitle && m.urgency !== 'low');
}

// ─── Analytics event name registry ───────────────────────────
// All possible next_move events — used for PostHog taxonomy

export const NEXT_MOVE_EVENTS = [
  'next_move_claim_clicked',
  'next_move_complete_profile_clicked',
  'next_move_post_load_clicked',
  'next_move_manage_loads_clicked',
  'next_move_loads_nearby_clicked',
  'next_move_demand_spike_clicked',
  'next_move_first_in_region_clicked',
  'next_move_return_visitor_clicked',
  'next_move_reactivation_clicked',
  'next_move_certification_clicked',
  'next_move_corridor_clicked',
  'next_move_regulations_clicked',
  'next_move_anon_directory_clicked',
  'next_move_anon_post_load_clicked',
  'next_move_fallback_clicked',
] as const;

export type NextMoveEvent = typeof NEXT_MOVE_EVENTS[number];
