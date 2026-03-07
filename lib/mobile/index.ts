/**
 * Haul Command — Mobile Module Index
 * 
 * Barrel exports for all mobile-specific functionality.
 */

// Platform detection
export { isNativePlatform, getPlatform, isPluginAvailable } from './platform';

// Location tracking
export {
    pingCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    flushOfflineQueue,
    requestLocationPermission,
    type LocationPing,
} from './location';

// Camera & Evidence
export {
    captureEvidence,
    flushEvidenceQueue,
    getQueuedUploadCount,
    type EvidenceType,
    type EvidenceCapture,
    type EvidenceResult,
} from './evidence';

// Background runner
export { pingLocationNow } from './background/locationRunner';
export {
    registerBackgroundLocationTask,
    unregisterBackgroundLocationTask,
} from './background/register';
