// ══════════════════════════════════════════════════════════════
// PERMIT INTELLIGENCE ENGINE — The Competitive Moat
// AI-powered permit requirement lookup, route validation,
// and compliance checking across 120 countries.
// Revenue: 10 free questions/mo → $9/mo unlimited
// ══════════════════════════════════════════════════════════════

import { JURISDICTION_REGISTRY, getJurisdictionsByCountry, type Jurisdiction } from '@/lib/config/jurisdiction-registry';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PermitRequirement {
  jurisdictionCode: string;       // ISO 3166-2
  jurisdictionName: string;
  requiresEscort: boolean;
  escortCount: number;            // Number of escorts required
  escortPosition: string[];       // "front", "rear", "both"
  dimensionThresholds: DimensionThreshold;
  timeRestrictions: TimeRestriction[];
  specialRequirements: string[];
  permitTypes: PermitType[];
  fines: FineSchedule;
  authority: string;
  authorityUrl: string;
  lastUpdated: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DimensionThreshold {
  /** Width in feet/meters above which escort is required */
  escortRequiredWidth: number;
  escortRequiredWidthUnit: 'ft' | 'm';
  /** Height above which escort is required */
  escortRequiredHeight: number;
  escortRequiredHeightUnit: 'ft' | 'm';
  /** Length above which escort is required */
  escortRequiredLength: number;
  escortRequiredLengthUnit: 'ft' | 'm';
  /** Weight above which permit is required */
  permitRequiredWeight: number;
  permitRequiredWeightUnit: 'lbs' | 'kg' | 'tons' | 'tonnes';
  /** Max width allowed on public roads */
  maxLegalWidth: number;
  maxLegalWidthUnit: 'ft' | 'm';
  /** Additional escorts required at extreme dimensions */
  dualEscortWidth?: number;
  dualEscortWidthUnit?: 'ft' | 'm';
}

export interface TimeRestriction {
  type: 'no_travel' | 'escort_required' | 'reduced_speed';
  days: ('mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun')[];
  startTime: string;   // "06:00"
  endTime: string;     // "09:00"
  reason: string;      // "Rush hour restriction"
}

export interface PermitType {
  name: string;
  description: string;
  singleTripCost: number;
  annualCost?: number;
  currency: string;
  processingDays: number;
  onlineAvailable: boolean;
  url?: string;
}

export interface FineSchedule {
  noPermitFine: number;
  noEscortFine: number;
  currency: string;
  additionalPenalties: string[];
}

export interface RouteAnalysis {
  origin: { jurisdiction: string; city: string };
  destination: { jurisdiction: string; city: string };
  transitJurisdictions: string[];
  totalPermitsRequired: number;
  totalEscortsRequired: number;
  estimatedPermitCost: number;
  estimatedEscortCost: number;
  estimatedTotalCost: number;
  timeRestrictions: TimeRestriction[];
  warnings: string[];
  requirements: PermitRequirement[];
}

export interface ComplianceQuestion {
  question: string;
  jurisdictionCode?: string;
  loadWidth?: number;
  loadHeight?: number;
  loadLength?: number;
  loadWeight?: number;
  dimensionUnit?: 'imperial' | 'metric';
}

export interface ComplianceAnswer {
  answer: string;
  jurisdiction?: Jurisdiction;
  requirements?: PermitRequirement;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  followUpQuestions: string[];
}

// ── Permit Intelligence Database (subset — real implementation queries Supabase) ──

const US_PERMIT_RULES: Record<string, Partial<PermitRequirement>> = {
  'US-TX': {
    requiresEscort: true, escortCount: 1, escortPosition: ['front'],
    dimensionThresholds: {
      escortRequiredWidth: 12, escortRequiredWidthUnit: 'ft',
      escortRequiredHeight: 15, escortRequiredHeightUnit: 'ft',
      escortRequiredLength: 110, escortRequiredLengthUnit: 'ft',
      permitRequiredWeight: 80000, permitRequiredWeightUnit: 'lbs',
      maxLegalWidth: 8.5, maxLegalWidthUnit: 'ft',
      dualEscortWidth: 16, dualEscortWidthUnit: 'ft',
    },
    permitTypes: [
      { name: 'Single Trip Oversize', description: 'One-time permit for oversize loads', singleTripCost: 60, annualCost: 600, currency: 'USD', processingDays: 1, onlineAvailable: true, url: 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits' },
      { name: 'Single Trip Overweight', description: 'One-time permit for overweight loads', singleTripCost: 85, currency: 'USD', processingDays: 1, onlineAvailable: true },
    ],
    fines: { noPermitFine: 5000, noEscortFine: 2500, currency: 'USD', additionalPenalties: ['Vehicle impoundment', 'CDL points'] },
    timeRestrictions: [
      { type: 'no_travel', days: ['mon','tue','wed','thu','fri'], startTime: '07:00', endTime: '09:00', reason: 'Urban rush hour — Dallas, Houston, San Antonio metro areas' },
      { type: 'no_travel', days: ['mon','tue','wed','thu','fri'], startTime: '16:30', endTime: '18:30', reason: 'Evening rush hour — metro areas' },
    ],
    specialRequirements: ['Height pole required for loads over 14ft', 'Amber rotating light required', 'OVERSIZE LOAD banner front and rear'],
    authority: 'TxDMV Motor Carrier Division',
    authorityUrl: 'https://www.txdmv.gov',
  },
  'US-CA': {
    requiresEscort: true, escortCount: 1, escortPosition: ['front', 'rear'],
    dimensionThresholds: {
      escortRequiredWidth: 10, escortRequiredWidthUnit: 'ft',
      escortRequiredHeight: 14.5, escortRequiredHeightUnit: 'ft',
      escortRequiredLength: 100, escortRequiredLengthUnit: 'ft',
      permitRequiredWeight: 80000, permitRequiredWeightUnit: 'lbs',
      maxLegalWidth: 8.5, maxLegalWidthUnit: 'ft',
      dualEscortWidth: 14, dualEscortWidthUnit: 'ft',
    },
    permitTypes: [
      { name: 'Single Trip Transportation Permit', description: 'Caltrans single trip permit', singleTripCost: 90, annualCost: 900, currency: 'USD', processingDays: 2, onlineAvailable: true, url: 'https://dot.ca.gov/programs/traffic-operations/transportation-permits' },
    ],
    fines: { noPermitFine: 10000, noEscortFine: 5000, currency: 'USD', additionalPenalties: ['Mandatory court appearance', 'License suspension possible'] },
    specialRequirements: ['Pilot car operators must have valid CA certification', 'Two escorts required over 14ft wide', 'CHP notification required for super-loads'],
    authority: 'Caltrans / CHP',
    authorityUrl: 'https://dot.ca.gov',
  },
};

// ── Engine Functions ──────────────────────────────────────────────────────────

export class PermitIntelligenceEngine {
  // Check permit requirements for a specific jurisdiction
  async getRequirements(jurisdictionCode: string): Promise<PermitRequirement | null> {
    const jurisdiction = JURISDICTION_REGISTRY.find(j => j.code === jurisdictionCode);
    if (!jurisdiction) return null;

    const rules = US_PERMIT_RULES[jurisdictionCode];
    if (!rules) {
      // Return generic requirements based on jurisdiction type
      return {
        jurisdictionCode,
        jurisdictionName: jurisdiction.name_en,
        requiresEscort: true,
        escortCount: 1,
        escortPosition: ['front'],
        dimensionThresholds: this.getDefaultThresholds(jurisdiction.country),
        timeRestrictions: [],
        specialRequirements: [`Check ${jurisdiction.compliance_url} for current requirements`],
        permitTypes: [],
        fines: { noPermitFine: 0, noEscortFine: 0, currency: 'USD', additionalPenalties: [] },
        authority: jurisdiction.name_en,
        authorityUrl: jurisdiction.compliance_url,
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
      };
    }

    return {
      jurisdictionCode,
      jurisdictionName: jurisdiction.name_en,
      requiresEscort: rules.requiresEscort ?? true,
      escortCount: rules.escortCount ?? 1,
      escortPosition: rules.escortPosition ?? ['front'],
      dimensionThresholds: rules.dimensionThresholds ?? this.getDefaultThresholds(jurisdiction.country),
      timeRestrictions: rules.timeRestrictions ?? [],
      specialRequirements: rules.specialRequirements ?? [],
      permitTypes: rules.permitTypes ?? [],
      fines: rules.fines ?? { noPermitFine: 0, noEscortFine: 0, currency: 'USD', additionalPenalties: [] },
      authority: rules.authority ?? jurisdiction.name_en,
      authorityUrl: rules.authorityUrl ?? jurisdiction.compliance_url,
      lastUpdated: new Date().toISOString(),
      confidence: 'high',
    };
  }

  // Analyze a route across multiple jurisdictions
  async analyzeRoute(
    originJurisdiction: string,
    destinationJurisdiction: string,
    transitJurisdictions: string[],
    loadWidth?: number,
    loadHeight?: number,
    loadWeight?: number,
  ): Promise<RouteAnalysis> {
    const allJurisdictions = [originJurisdiction, ...transitJurisdictions, destinationJurisdiction];
    const uniqueJurisdictions = [...new Set(allJurisdictions)];

    const requirements: PermitRequirement[] = [];
    const warnings: string[] = [];
    let totalPermitCost = 0;
    let totalEscorts = 0;
    const allTimeRestrictions: TimeRestriction[] = [];

    for (const jCode of uniqueJurisdictions) {
      const req = await this.getRequirements(jCode);
      if (!req) {
        warnings.push(`No permit data available for ${jCode}`);
        continue;
      }

      requirements.push(req);

      // Check if escort is required based on load dimensions
      if (loadWidth && req.dimensionThresholds) {
        if (loadWidth > req.dimensionThresholds.escortRequiredWidth) {
          totalEscorts = Math.max(totalEscorts, req.escortCount);
          if (req.dimensionThresholds.dualEscortWidth && loadWidth > req.dimensionThresholds.dualEscortWidth) {
            totalEscorts = Math.max(totalEscorts, 2);
            warnings.push(`${req.jurisdictionName}: Dual escorts required for width over ${req.dimensionThresholds.dualEscortWidth}${req.dimensionThresholds.dualEscortWidthUnit}`);
          }
        }
      }

      // Sum permit costs
      if (req.permitTypes.length > 0) {
        totalPermitCost += req.permitTypes[0].singleTripCost;
      }

      // Collect time restrictions
      allTimeRestrictions.push(...req.timeRestrictions);
    }

    // Estimate escort cost (rough: $85/hr × 8 hrs per jurisdiction)
    const estimatedEscortCost = totalEscorts * uniqueJurisdictions.length * 85 * 8;

    return {
      origin: {
        jurisdiction: originJurisdiction,
        city: requirements.find(r => r.jurisdictionCode === originJurisdiction)?.jurisdictionName || originJurisdiction,
      },
      destination: {
        jurisdiction: destinationJurisdiction,
        city: requirements.find(r => r.jurisdictionCode === destinationJurisdiction)?.jurisdictionName || destinationJurisdiction,
      },
      transitJurisdictions,
      totalPermitsRequired: uniqueJurisdictions.length,
      totalEscortsRequired: totalEscorts,
      estimatedPermitCost: totalPermitCost,
      estimatedEscortCost,
      estimatedTotalCost: totalPermitCost + estimatedEscortCost,
      timeRestrictions: allTimeRestrictions,
      warnings,
      requirements,
    };
  }

  // Answer a compliance question (AI wrapper — real implementation calls OpenAI/Claude)
  async answerQuestion(q: ComplianceQuestion): Promise<ComplianceAnswer> {
    // For now, return structured data based on jurisdiction lookup
    if (q.jurisdictionCode) {
      const req = await this.getRequirements(q.jurisdictionCode);
      const jurisdiction = JURISDICTION_REGISTRY.find(j => j.code === q.jurisdictionCode);

      if (req) {
        return {
          answer: this.buildAnswerFromRequirements(q, req),
          jurisdiction: jurisdiction || undefined,
          requirements: req,
          confidence: req.confidence || 'medium',
          sources: [req.authorityUrl],
          followUpQuestions: [
            `What are the fines for non-compliance in ${req.jurisdictionName}?`,
            `What time restrictions apply in ${req.jurisdictionName}?`,
            `How do I get a permit in ${req.jurisdictionName}?`,
          ],
        };
      }
    }

    return {
      answer: 'I need more information to answer this question. Please specify the jurisdiction (state/province/country) and load dimensions.',
      confidence: 'low',
      sources: [],
      followUpQuestions: [
        'Which state or country is this load traveling through?',
        'What are the load dimensions (width, height, length, weight)?',
      ],
    };
  }

  // Build a human-readable answer from requirements
  private buildAnswerFromRequirements(q: ComplianceQuestion, req: PermitRequirement): string {
    const parts: string[] = [];

    parts.push(`In **${req.jurisdictionName}**:`);

    if (q.loadWidth) {
      const needsEscort = q.loadWidth > req.dimensionThresholds.escortRequiredWidth;
      if (needsEscort) {
        parts.push(`\n- ✅ **Escort required** — your load width (${q.loadWidth}${req.dimensionThresholds.escortRequiredWidthUnit}) exceeds the ${req.dimensionThresholds.escortRequiredWidth}${req.dimensionThresholds.escortRequiredWidthUnit} threshold`);
        parts.push(`- Number of escorts: **${req.escortCount}** (${req.escortPosition.join(' + ')})`);
        if (req.dimensionThresholds.dualEscortWidth && q.loadWidth > req.dimensionThresholds.dualEscortWidth) {
          parts.push(`- ⚠️ **Dual escort required** — load exceeds ${req.dimensionThresholds.dualEscortWidth}${req.dimensionThresholds.dualEscortWidthUnit}`);
        }
      } else {
        parts.push(`\n- ❌ **No escort required** for this width (threshold: ${req.dimensionThresholds.escortRequiredWidth}${req.dimensionThresholds.escortRequiredWidthUnit})`);
      }
    }

    if (req.permitTypes.length > 0) {
      parts.push(`\n**Permits available:**`);
      req.permitTypes.forEach(p => {
        parts.push(`- ${p.name}: $${p.singleTripCost} (${p.processingDays} day processing, ${p.onlineAvailable ? 'online' : 'mail-in'})`);
      });
    }

    if (req.timeRestrictions.length > 0) {
      parts.push(`\n**Time restrictions:**`);
      req.timeRestrictions.forEach(t => {
        parts.push(`- ${t.reason}: ${t.startTime}–${t.endTime}`);
      });
    }

    if (req.fines.noPermitFine > 0) {
      parts.push(`\n**Fines:** No permit: $${req.fines.noPermitFine.toLocaleString()} · No escort: $${req.fines.noEscortFine.toLocaleString()}`);
    }

    return parts.join('\n');
  }

  // Default thresholds by country
  private getDefaultThresholds(country: string): DimensionThreshold {
    if (country === 'US' || country === 'CA') {
      return {
        escortRequiredWidth: 12, escortRequiredWidthUnit: 'ft',
        escortRequiredHeight: 14.5, escortRequiredHeightUnit: 'ft',
        escortRequiredLength: 100, escortRequiredLengthUnit: 'ft',
        permitRequiredWeight: 80000, permitRequiredWeightUnit: 'lbs',
        maxLegalWidth: 8.5, maxLegalWidthUnit: 'ft',
      };
    }
    // Metric countries
    return {
      escortRequiredWidth: 3.5, escortRequiredWidthUnit: 'm',
      escortRequiredHeight: 4.5, escortRequiredHeightUnit: 'm',
      escortRequiredLength: 25, escortRequiredLengthUnit: 'm',
      permitRequiredWeight: 44000, permitRequiredWeightUnit: 'kg',
      maxLegalWidth: 2.55, maxLegalWidthUnit: 'm',
    };
  }
}

// Singleton
export const permitEngine = new PermitIntelligenceEngine();
