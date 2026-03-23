/**
 * DEPRECATED — Use core/intelligence/PermitIntelligenceEngine.ts instead.
 * This file re-exports the new PermitIntelligenceEngine for backward compatibility.
 *
 * The new engine provides:
 * - Per-jurisdiction permit requirements across 57 countries
 * - Multi-jurisdiction route analysis with cost estimates
 * - AI compliance Q&A (Compliance Copilot, $9/mo revenue)
 * - Imperial + metric unit support
 * - Fine schedules, time restrictions, special requirements
 * - Integration with the global Jurisdiction Registry
 */

export {
  PermitIntelligenceEngine,
  permitEngine,
  type PermitRequirement,
  type DimensionThreshold,
  type TimeRestriction,
  type PermitType,
  type FineSchedule,
  type RouteAnalysis,
  type ComplianceQuestion,
  type ComplianceAnswer,
} from './PermitIntelligenceEngine';

// Legacy compatibility wrapper
import { permitEngine } from './PermitIntelligenceEngine';

export class PermitBot {
  /**
   * @deprecated Use permitEngine.getRequirements() instead
   */
  public static async apply(req: { state: string; loadDims: { h: number; w: number; l: number; gw: number }; routeStr: string; startDate: string }) {
    console.warn('[PermitBot] DEPRECATED: Use permitEngine.getRequirements() or permitEngine.analyzeRoute() instead.');
    const jurisdictionCode = `US-${req.state}`;
    const result = await permitEngine.getRequirements(jurisdictionCode);
    return {
      status: result ? 'SUBMITTED' : 'NOT_FOUND',
      ref: `perm-sub-${req.state}-${Date.now()}`,
      requirements: result,
    };
  }
}
