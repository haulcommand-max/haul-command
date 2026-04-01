// ══════════════════════════════════════════════════════════════
// SAVED INTENT SYSTEM — Repeat traffic without popups
//
// Users can "save" or "follow" entities. Each saved intent:
//   1. Creates a persistent subscription
//   2. Drives alert routing (what notifications to send)
//   3. Feeds corridor/state intelligence to the user's dashboard
//   4. Eliminates the need for capture popups on return visits
//
// Entity types that can be saved:
//   - State / province / jurisdiction
//   - Corridor (origin→destination route)
//   - Operator profile
//   - Company profile
//   - Regulation (specific rule set)
//   - Glossary topic cluster
//   - Search query (with filters)
// ══════════════════════════════════════════════════════════════

export type SavedEntityType =
  | 'state'
  | 'corridor'
  | 'operator'
  | 'company'
  | 'regulation'
  | 'glossary_topic'
  | 'search'
  | 'border_crossing'
  | 'certification'
  | 'equipment_type';

export interface SavedIntent {
  id: string;
  userId: string;           // auth user ID or anonymous session ID
  entityType: SavedEntityType;
  entityId: string;          // slug or ID of the entity
  entityLabel: string;       // human-readable label
  metadata: Record<string, string>;  // filters, query params, etc.

  // Alert preferences for this saved entity
  alertsEnabled: boolean;
  alertFrequency: 'immediate' | 'daily_digest' | 'weekly_digest';
  alertChannels: ('email' | 'push' | 'sms')[];

  // Tracking
  savedAt: string;
  lastNotifiedAt: string | null;
  viewCount: number;         // how many times they've viewed this since saving
  lastViewedAt: string | null;
}

// ── What alerts each entity type can generate ──
export const ENTITY_ALERT_MAP: Record<SavedEntityType, {
  alertTypes: string[];
  defaultFrequency: SavedIntent['alertFrequency'];
  description: string;
}> = {
  state: {
    alertTypes: ['regulation_change', 'permit_update', 'frost_law_change', 'new_operators', 'coverage_gap'],
    defaultFrequency: 'weekly_digest',
    description: 'Regulation changes, new operators, and coverage updates',
  },
  corridor: {
    alertTypes: ['closure', 'weather_impact', 'demand_spike', 'rate_change', 'seasonal_restriction', 'new_escort'],
    defaultFrequency: 'immediate',
    description: 'Closures, demand changes, and available escorts',
  },
  operator: {
    alertTypes: ['availability_change', 'new_review', 'rate_update', 'certification_change'],
    defaultFrequency: 'immediate',
    description: 'Availability and profile updates',
  },
  company: {
    alertTypes: ['new_review', 'fleet_change', 'service_area_change'],
    defaultFrequency: 'weekly_digest',
    description: 'Reviews and service area changes',
  },
  regulation: {
    alertTypes: ['rule_change', 'effective_date', 'enforcement_update'],
    defaultFrequency: 'immediate',
    description: 'Rule changes and enforcement updates',
  },
  glossary_topic: {
    alertTypes: ['new_content', 'related_regulation_change'],
    defaultFrequency: 'weekly_digest',
    description: 'New content and related regulation changes',
  },
  search: {
    alertTypes: ['new_match', 'availability_change', 'rate_change'],
    defaultFrequency: 'daily_digest',
    description: 'New matches and operator updates',
  },
  border_crossing: {
    alertTypes: ['wait_time_change', 'rule_change', 'documentation_update'],
    defaultFrequency: 'immediate',
    description: 'Wait times and compliance requirement changes',
  },
  certification: {
    alertTypes: ['renewal_deadline', 'reciprocity_change', 'training_available'],
    defaultFrequency: 'immediate',
    description: 'Renewal deadlines and reciprocity changes',
  },
  equipment_type: {
    alertTypes: ['new_transport_guide', 'regulation_change', 'new_specialist'],
    defaultFrequency: 'weekly_digest',
    description: 'New transport guides and specialist operators',
  },
};

// ── Build default SavedIntent from entity type ──
export function createSavedIntent(
  userId: string,
  entityType: SavedEntityType,
  entityId: string,
  entityLabel: string,
  metadata: Record<string, string> = {},
): SavedIntent {
  const config = ENTITY_ALERT_MAP[entityType];
  return {
    id: `${entityType}_${entityId}_${Date.now()}`,
    userId,
    entityType,
    entityId,
    entityLabel,
    metadata,
    alertsEnabled: true,
    alertFrequency: config.defaultFrequency,
    alertChannels: ['email'],
    savedAt: new Date().toISOString(),
    lastNotifiedAt: null,
    viewCount: 0,
    lastViewedAt: null,
  };
}

// ── Saved intent → alert routing ──
export interface AlertPayload {
  intentId: string;
  userId: string;
  alertType: string;
  entityType: SavedEntityType;
  entityId: string;
  entityLabel: string;
  message: string;
  actionUrl: string;
  channels: ('email' | 'push' | 'sms')[];
  priority: 'urgent' | 'normal' | 'low';
}

export function shouldSendAlert(
  intent: SavedIntent,
  alertType: string,
  now: Date = new Date(),
): boolean {
  if (!intent.alertsEnabled) return false;

  const config = ENTITY_ALERT_MAP[intent.entityType];
  if (!config.alertTypes.includes(alertType)) return false;

  // Check frequency cooldown
  if (intent.lastNotifiedAt) {
    const lastNotified = new Date(intent.lastNotifiedAt);
    const hoursSince = (now.getTime() - lastNotified.getTime()) / 3600000;

    switch (intent.alertFrequency) {
      case 'immediate': return true; // Always send
      case 'daily_digest': return hoursSince >= 20; // ~daily
      case 'weekly_digest': return hoursSince >= 144; // ~6 days
    }
  }

  return true; // First notification
}

export function buildAlertPayload(
  intent: SavedIntent,
  alertType: string,
  message: string,
  actionUrl: string,
  priority: AlertPayload['priority'] = 'normal',
): AlertPayload {
  return {
    intentId: intent.id,
    userId: intent.userId,
    alertType,
    entityType: intent.entityType,
    entityId: intent.entityId,
    entityLabel: intent.entityLabel,
    message,
    actionUrl,
    channels: intent.alertChannels,
    priority,
  };
}
