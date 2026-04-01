// ══════════════════════════════════════════════════════════════
// COMMUNITY BRIDGE — Facebook group ↔ Platform integration
//
// RULES:
//   1. NEVER assume Facebook group membership
//   2. Only mark confirmed if user explicitly told us
//   3. Track the confirmation source (self-report, invite flow, onboarding)
//   4. Build a bridge: group → confirm → badge → claim → sync → leads
//
// The community bridge creates a loop:
//   join group → confirm membership → unlock badge → claim profile
//   → sync availability → get leads
// ══════════════════════════════════════════════════════════════

export type CommunityPlatform = 'facebook' | 'discord' | 'whatsapp' | 'telegram' | 'slack';

export type ConfirmationSource =
  | 'self_reported'          // User clicked "I'm already a member"
  | 'invite_flow'            // Came through a tracked group-specific invite URL
  | 'onboarding_step'        // Confirmed during onboarding wizard
  | 'admin_verified'         // Admin manually confirmed
  | 'never_confirmed';       // Default state

export interface CommunityMembership {
  userId: string;
  platform: CommunityPlatform;
  groupId: string;            // Platform-specific group identifier
  groupName: string;          // Human-readable: "Haul Command Operators"

  // Confirmation state — ALWAYS defaults to unknown
  isConfirmed: boolean;
  confirmationSource: ConfirmationSource;
  confirmedAt: string | null;

  // Engagement within community
  referredByGroupInvite: boolean;
  groupInviteCode: string | null;

  // Bridge progression
  badgeUnlocked: boolean;     // "Community Member" badge on profile
  profileClaimed: boolean;    // Has claimed a Haul Command profile
  availabilitySynced: boolean; // Syncing availability to platform
  receivingLeads: boolean;    // Getting leads through the platform
}

// ── Bridge Steps (the full loop) ──
export const COMMUNITY_BRIDGE_STEPS = [
  {
    step: 1,
    action: 'join_group',
    label: 'Join the community',
    description: 'Connect with operators, share intel, get peer support',
    completed: (m: CommunityMembership) => m.isConfirmed,
  },
  {
    step: 2,
    action: 'confirm_membership',
    label: 'Confirm membership',
    description: 'Let us know you\'re in the group to unlock your badge',
    completed: (m: CommunityMembership) => m.isConfirmed && m.confirmationSource !== 'never_confirmed',
  },
  {
    step: 3,
    action: 'unlock_badge',
    label: 'Unlock Community Badge',
    description: 'Show the "Community Member" badge on your profile',
    completed: (m: CommunityMembership) => m.badgeUnlocked,
  },
  {
    step: 4,
    action: 'claim_profile',
    label: 'Claim your profile',
    description: 'Take ownership of your Haul Command listing',
    completed: (m: CommunityMembership) => m.profileClaimed,
  },
  {
    step: 5,
    action: 'sync_availability',
    label: 'Sync availability',
    description: 'Let brokers know when you\'re available',
    completed: (m: CommunityMembership) => m.availabilitySynced,
  },
  {
    step: 6,
    action: 'receive_leads',
    label: 'Start receiving leads',
    description: 'Get matched with jobs in your coverage area',
    completed: (m: CommunityMembership) => m.receivingLeads,
  },
] as const;

export function getBridgeProgress(membership: CommunityMembership): {
  completedSteps: number;
  totalSteps: number;
  nextStep: typeof COMMUNITY_BRIDGE_STEPS[number] | null;
  progressPct: number;
} {
  let completedSteps = 0;
  let nextStep: typeof COMMUNITY_BRIDGE_STEPS[number] | null = null;

  for (const step of COMMUNITY_BRIDGE_STEPS) {
    if (step.completed(membership)) {
      completedSteps++;
    } else if (!nextStep) {
      nextStep = step;
    }
  }

  return {
    completedSteps,
    totalSteps: COMMUNITY_BRIDGE_STEPS.length,
    nextStep,
    progressPct: Math.round((completedSteps / COMMUNITY_BRIDGE_STEPS.length) * 100),
  };
}

// ── Default membership state ──
export function createDefaultMembership(userId: string, platform: CommunityPlatform = 'facebook'): CommunityMembership {
  return {
    userId,
    platform,
    groupId: platform === 'facebook' ? 'haulcommand' : '',
    groupName: platform === 'facebook' ? 'Haul Command Operators' : 'Haul Command Community',
    isConfirmed: false,
    confirmationSource: 'never_confirmed',
    confirmedAt: null,
    referredByGroupInvite: false,
    groupInviteCode: null,
    badgeUnlocked: false,
    profileClaimed: false,
    availabilitySynced: false,
    receivingLeads: false,
  };
}

// ── Tracked invite URL generator ──
export function generateGroupInviteUrl(platform: CommunityPlatform, inviteCode: string, source: string): string {
  const baseUrls: Record<CommunityPlatform, string> = {
    facebook: 'https://www.facebook.com/groups/haulcommand',
    discord: 'https://discord.gg/haulcommand',
    whatsapp: 'https://chat.whatsapp.com/haulcommand',
    telegram: 'https://t.me/haulcommand',
    slack: 'https://haulcommand.slack.com/join',
  };
  return `${baseUrls[platform]}?hc_invite=${inviteCode}&hc_source=${source}`;
}
