/**
 * Haul Command: Consolidated Claim Funnels
 * Unifies profile claiming, operator verification, and place assumption.
 */

// Core Wizard
export { ClaimWizard } from './ClaimWizard';

// Helper Components from directory and market rules
// These paths resolve to the unified file structure to ensure no duplicated logic
export { default as ClaimBanner } from '../growth/ClaimBanner';
export { default as ClaimPressureEngine } from '../market/ClaimPressureEngine';
export { default as ClaimThisPlace } from '../places/ClaimThisPlace';
export { ProfileClaimSidebar } from '../directory/ProfileClaimSidebar';
export { StickyClaimBar } from '../directory/StickyClaimBar';
