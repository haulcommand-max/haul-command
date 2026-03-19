// lib/analytics/hc-events.ts
// ══════════════════════════════════════════════════════════════
// DEPRECATED — Re-exports from unified track.ts
//
// Server-side event tracking is now in lib/analytics/track.ts
// via the serverTrack() and trackEvent() functions.
// This file exists for backward compatibility only.
// ══════════════════════════════════════════════════════════════

export { trackEvent, trackCorridorView, trackPortView } from './track';
export type { HCEventType } from './track';
