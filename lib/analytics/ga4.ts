// lib/analytics/ga4.ts
// ══════════════════════════════════════════════════════════════
// DEPRECATED — Re-exports from unified track.ts
// 
// All GA4 analytics are now in lib/analytics/track.ts.
// This file exists for backward compatibility only.
// Import from '@/lib/analytics/track' for new code.
// ══════════════════════════════════════════════════════════════

export { track, track as default, setGlobalParams } from './track';
export type { PageType, ReferrerType, LoadStatus, AdPlacement } from './track';
