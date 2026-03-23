/**
 * Haul Command Language System
 *
 * Three layers:
 *   1. Pilot Car & Heavy Haul Industry Lingo
 *   2. Light Military Terminology (precise, not gimmicky)
 *   3. Direct, road-ready tone
 *
 * RULE: Never use "leverage," "seamless," "ecosystem," "synergy,"
 *       or "streamline" in user-facing copy. Plain, direct language only.
 *
 * This is how the community actually talks. Not a costume — a culture.
 */

// ─── Status Labels ───────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  available:    'On Standby',
  on_job:       'Running',
  unavailable:  'Tied Up',
  completed:    'All Clear',
  cancelled:    'Aborted',
  no_show:      'No Show — Extracting Replacement',
  rolling:      'Rolling',
  clear:        'Clear',
  standby:      'On Standby',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// ─── Operator Status (user-facing display) ───────────────────

export const OPERATOR_STATUS = {
  available:  'On Standby',
  on_job:     'Running',
  unavailable:'Tied Up',
  completed:  'Clear',
} as const;

// ─── Load Board Labels ──────────────────────────────────────

export const LOAD_BOARD = {
  activeJobs:         'Runs in Progress',
  emergencyFill:      'Emergency Extract',
  availableOperators: 'Pilots on Standby',
  postLoad:           'Post a Load',               // industry standard — keep
  jobCompleted:       'Run Complete — All Clear',
  loadCancelled:      'Run Aborted',
  assignOperator:     'Put a Pilot on It',
} as const;

// ─── Corridor Status Language ────────────────────────────────

export const CORRIDOR_STATUS = {
  hot:  'Running Hot — high demand, thin coverage',
  warm: 'Active — steady demand, good coverage',
  cool: 'Quiet — low demand, plenty of pilots available',
} as const;

export const CORRIDOR_BADGES = {
  hotCorridor:     'Running Hot',
  hardFill:        'Thin Coverage — Boots Needed',
  thinCorridor:    'Coverage Needed',
  coverageNeeded:  'Thin Coverage — Boots Needed',
} as const;

// ─── Dashboard Sections ─────────────────────────────────────

export const DASHBOARD = {
  controlTower:  'Control Tower',          // already correct
  heatMap:       'AO Intelligence',
  systemHealth:  'Command Status',
  activeJobs:    'Runs in Progress',
  shortageAlert: 'Thin Coverage — Boots Needed',
  hotCorridor:   'High Demand — Corridor Running Hot',
} as const;

// ─── Notification Templates ─────────────────────────────────
// FCM push notification copy. Use template variables: $RATE, $CORRIDOR, $DATE, $AMOUNT, $COUNT

export const NOTIFICATIONS = {
  newLoadAlert:       (rate: string, corridor: string) =>
    `Run posted on your AO — $${rate}/day · ${corridor} · Tap to accept`,

  jobConfirmed:       (date: string, corridor: string) =>
    `You're on — run confirmed · ${date} · ${corridor}`,

  paymentReleased:    (amount: string) =>
    `Funds clear — $${amount} on the way`,

  emergencyReplace:   (corridor: string, rate: string) =>
    `URGENT — pilot needed NOW on ${corridor} · $${rate} · 125% rate`,

  dailyBriefing:      (count: number, trend: 'up' | 'down' | 'flat') =>
    `Morning intel — ${count} runs posted on your AO yesterday · Rates trending ${trend}`,

  operatorNoShow:     (corridor: string) =>
    `Pilot didn't show — extracting replacement on ${corridor}`,
} as const;

// ─── Empty States ───────────────────────────────────────────

export const EMPTY_STATES = {
  noOperators:  'No pilots on standby in this AO right now',
  noLoads:      'Quiet on the board — set an alert to catch the next run',
  noMessages:   'Radio silence — no messages yet',
  noData:       'No intel available for this AO yet',
} as const;

// ─── Onboarding Copy ────────────────────────────────────────

export const ONBOARDING = {
  step1Headline:    'Tell Us What You Run',
  step2Headline:    'Mark Your AO',
  step3Headline:    'Get Verified',
  successHeadline:  "You're on the board.",
  successBody:      "Runs in your AO will hit your phone the moment they post.",
  ctaGetRolling:    'Get Rolling',
  claimProfile:     'Claim your profile and get on the board',
  selectServices:   'Tell us what you run',
  addCorridors:     'Mark your AO',
} as const;

// ─── Error States ───────────────────────────────────────────

export const ERRORS = {
  generic:    'Hit a snag — try again or contact support',
  loadNotFound: 'Run not found — may have already been covered',
  notFound:   'Page not found — that route may have moved',
  timeout:    'Timed out — try again in a second',
  cancelled:  'Checkout was cancelled. Try again or start with a free profile.',
} as const;

// ─── AI Assistant ───────────────────────────────────────────

export const AI_GREETING =
  "What do you need? I can pull corridor intel, check compliance for your run, find available pilots in your AO, or walk you through the platform.";

// ─── Taglines ───────────────────────────────────────────────

export const TAGLINES = {
  enterprise: 'The Operating System for Heavy Haul',
  operator:   'Built for the corridor. Not the crowd.',
} as const;

// ─── Terminology Glossary (Layer 1 — Industry Lingo) ────────

export const LINGO = {
  pevo:           'P/EVO',           // Pilot/Escort Vehicle Operator
  rolling:        'Rolling',         // Active / In Progress
  covered:        'Covered',         // Filled / Assigned
  loadMoving:     'The load is moving',
  chaseCar:       'Chase car',       // Rear escort
  highPole:       'High pole',       // Height pole escort
  superload:      'Superload',       // Extreme oversize load
  permitRun:      'Permit run',      // Permitted oversize move
  frontPilot:     'Front pilot',     // Lead escort
  rearPilot:      'Rear pilot',      // Trail escort
  bridgeHit:      'Bridge hit',      // Clearance violation
  shutdown:       'Shutdown',        // Load stopped by enforcement
  travelWindow:   'Travel window',   // Permitted operating hours
  flaggedDown:    'Flagged down',    // Pulled over
  makingHoles:    'Making holes',    // Clearing traffic
  theRig:         'The rig',         // The load vehicle
  grossWeight:    'Gross weight',    // Total loaded weight
  osow:           'OS/OW',           // Oversize/Overweight
  onTheRoad:      'On the road',     // Available
  tiedUp:         'Tied up',         // Unavailable
} as const;

// ─── Military Layer (Layer 2 — used sparingly) ──────────────

export const MILITARY = {
  standingOrders: 'Standing Orders', // Recurring schedule feature
  mission:        'Mission',         // A job / load assignment
  ao:             'AO',             // Area of Operations
  intel:          'Intel',           // Corridor intelligence
  bootsOnGround:  'Boots on the ground',
  commandCenter:  'Command Center',  // Admin dashboard
  dispatch:       'Dispatch',
  mobilize:       'Mobilize',        // Send operator to job
  recon:          'Recon',           // Route survey
  standby:        'Standby',
  engage:         'Engage',          // Accept a load
  extract:        'Extract',         // Emergency replacement
  allClear:       'All Clear',       // Job completed
  abort:          'Abort',           // Cancel a load
  hot:            'HOT',
  warm:           'WARM',
  cool:           'COOL',
  controlTower:   'Control Tower',
  watchdog:       'Watchdog',
} as const;

// ─── Banned Words (Layer 3 — tone enforcement) ──────────────
// Never use these in user-facing copy

export const BANNED_WORDS = [
  'leverage',
  'synergy',
  'ecosystem',
  'seamless',
  'streamline',
  'seamlessly',
  'leveraging',
  'synergize',
  'synergistic',
  'holistic',
] as const;
