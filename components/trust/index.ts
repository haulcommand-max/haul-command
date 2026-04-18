/**
 * Haul Command: Consolidated Trust Architecture
 * This index unifies the 15+ duplicate trust badges into a single entrypoint.
 * Importing from this file guarantees the latest, production-hardened UI tokens.
 */

// Core Badging
export { TrustBadge } from './TrustBadge';
export { TrustScoreBadge } from './TrustScoreBadge';

// Cards
export { TrustCard } from './TrustCard';
export { default as TrustCardV2 } from './TrustCardV2';

// Strips and UI
export { TrustStrip } from './TrustStrip';
export { TrustSignalStrip } from './TrustSignalStrip';

// Forwarding legacy directory trust cards (alias mapped)
// Provide an alias for directory-specific cards if they want to import from the root
// export { OperatorTrustCard } from '../directory/OperatorTrustCard';
