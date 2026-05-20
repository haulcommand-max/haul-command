export type OfferAudience =
  | "operator"
  | "broker"
  | "carrier"
  | "shipper"
  | "advertiser"
  | "insurance_partner"
  | "equipment_supplier"
  | "training_provider"
  | "infrastructure_partner"
  | "data_buyer"
  | "internal"
  | "other";

export type ObjectionType = "none" | "uncertainty" | "support" | "financial_logistic" | "timing_logistic" | "other";

export type PartnerPaidStatus = "free" | "basic" | "paid" | "sponsor" | "founding_seed" | "paused";

export type PartnerPayoutModel =
  | "none"
  | "flat_fee"
  | "pay_per_lead"
  | "pay_per_call"
  | "pay_per_bind"
  | "pay_per_policy"
  | "sponsor_subscription"
  | "revenue_share"
  | "manual_legal_review";

export type PartnerComplianceStatus = "pending" | "approved" | "rejected" | "legal_review";

export type FringeSourceEventType =
  | "started_claim_no_finish"
  | "pricing_view_no_buy"
  | "adgrid_info_no_pay"
  | "insurance_click_no_submit"
  | "booked_call_no_confirm"
  | "demo_no_purchase"
  | "broker_one_load_no_subscribe"
  | "advertiser_activity_no_renew"
  | "high_value_objection"
  | "other";

export type OfferScopeInput = {
  productKey: string;
  audience: OfferAudience;
  roleKeys?: string[];
  countryCodes?: string[];
  regionKeys?: string[];
  corridorKeys?: string[];
};

export type PartnerProfitFilterInput = {
  monetizable: boolean;
  referralTermsAvailable: boolean;
  callTrackingPossible: boolean;
  leadTrackingPossible: boolean;
  paidStatus: PartnerPaidStatus;
  payoutModel: PartnerPayoutModel;
  complianceStatus: PartnerComplianceStatus;
  heavyHaulRelevance?: number;
  pilotCarRelevance?: number;
  reputationScore?: number;
  responseSpeedScore?: number;
};

export type PartnerProfitFilterScore = {
  partnerScore: number;
  premiumRoutingEligible: boolean;
  blockers: string[];
};

export type DecisionPackInput = {
  audience: OfferAudience;
  productKey: string;
  problem: string;
  mechanism: string;
  nextStepLabel: string;
  nextStepUrl: string;
  proofAssetKeys?: string[];
  pricingOptions?: Array<{ label: string; value: string }>;
  objectionAnswers?: Partial<Record<ObjectionType, string>>;
};

export type DecisionPackSkeleton = {
  audience: OfferAudience;
  productKey: string;
  sections: Array<{
    key: "problem" | "mechanism" | "proof" | "pricing" | "objections" | "next_step";
    title: string;
    required: boolean;
  }>;
  problem: string;
  mechanism: string;
  proofAssetKeys: string[];
  pricingOptions: Array<{ label: string; value: string }>;
  objectionAnswers: Partial<Record<ObjectionType, string>>;
  nextStep: { label: string; url: string };
};

const UNSAFE_GUARANTEE_PATTERNS = [
  /\bguarantee(?:d|s)?\s+(?:you\s+)?(?:income|revenue|profit|earnings|loads?|jobs?)\b/i,
  /\bguarantee(?:d|s)?\s+(?:you\s+)?(?:a\s+)?(?:driver|operator|pilot\s+car|escort)\b/i,
  /\bguarantee(?:d|s)?\s+(?:insurance\s+)?(?:approval|coverage|quote|bind|policy)\b/i,
  /\bexact\s+(?:load|lead|job)\s+volume\b/i,
  /\bwill\s+(?:get|make|earn)\s+\$?\d+/i,
];

function cleanToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeCountryCodes(countryCodes?: string[]): string[] {
  return Array.from(
    new Set(
      (countryCodes ?? [])
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code)),
    ),
  ).sort();
}

export function buildOfferKey(input: OfferScopeInput): string {
  const countries = normalizeCountryCodes(input.countryCodes);
  const rolePart = (input.roleKeys ?? []).map(cleanToken).filter(Boolean).sort().join("+") || "all-roles";
  const countryPart = countries.join("+").toLowerCase() || "global";
  const regionPart = (input.regionKeys ?? []).map(cleanToken).filter(Boolean).sort().join("+") || "all-regions";
  const corridorPart = (input.corridorKeys ?? []).map(cleanToken).filter(Boolean).sort().join("+") || "all-corridors";

  return [
    cleanToken(input.productKey),
    cleanToken(input.audience),
    rolePart,
    countryPart,
    regionPart,
    corridorPart,
  ].join("__");
}

export function offerSupportsCountry(countryCodes: string[] | undefined, countryCode: string): boolean {
  const normalized = normalizeCountryCodes(countryCodes);
  if (normalized.length === 0) return true;
  return normalized.includes(countryCode.trim().toUpperCase());
}

export function classifyObjection(note?: string | null): ObjectionType {
  const value = (note ?? "").toLowerCase();
  if (!value.trim()) return "none";
  if (/(not sure|proof|traffic|will.*work|tried|skeptical|trust|real)/.test(value)) return "uncertainty";
  if (/(partner|wife|husband|owner|boss|corporate|manager|team|approval)/.test(value)) return "support";
  if (/(cash|budget|expensive|price|pay|terms|discount|month-to-month|lead first)/.test(value)) return "financial_logistic";
  if (/(next month|later|timing|too busy|after launch|call back|not ready)/.test(value)) return "timing_logistic";
  return "other";
}

export function scorePartnerProfitFilter(input: PartnerProfitFilterInput): PartnerProfitFilterScore {
  const blockers: string[] = [];
  const hasTracking = input.callTrackingPossible || input.leadTrackingPossible;
  const paidEnough = input.paidStatus === "paid" || input.paidStatus === "sponsor" || input.paidStatus === "founding_seed";
  const payoutConfigured = input.payoutModel !== "none";
  const complianceAllowed = input.complianceStatus === "approved" || input.complianceStatus === "legal_review";

  if (!input.monetizable) blockers.push("partner_not_monetizable");
  if (!hasTracking) blockers.push("no_call_or_lead_tracking");
  if (!paidEnough) blockers.push("not_paid_or_sponsored");
  if (!payoutConfigured) blockers.push("no_payout_model");
  if (!complianceAllowed) blockers.push("compliance_not_approved");

  const relevance = Math.max(input.heavyHaulRelevance ?? 0, input.pilotCarRelevance ?? 0);
  const trackingScore = hasTracking ? 18 : 0;
  const monetizationScore = input.monetizable ? 20 : 0;
  const termsScore = input.referralTermsAvailable ? 12 : 0;
  const paidScore = paidEnough ? 12 : 0;
  const payoutScore = payoutConfigured ? 10 : 0;
  const complianceScore = complianceAllowed ? 8 : 0;
  const reputationScore = (input.reputationScore ?? 0) * 0.1;
  const responseScore = (input.responseSpeedScore ?? 0) * 0.1;
  const relevanceScore = relevance * 0.1;

  return {
    partnerScore: clampScore(
      trackingScore +
        monetizationScore +
        termsScore +
        paidScore +
        payoutScore +
        complianceScore +
        reputationScore +
        responseScore +
        relevanceScore,
    ),
    premiumRoutingEligible: blockers.length === 0,
    blockers,
  };
}

export function containsUnsafeGuaranteeClaim(copy: string): boolean {
  return UNSAFE_GUARANTEE_PATTERNS.some((pattern) => pattern.test(copy));
}

export function validateSafeGuaranteeCopy(copy: string): { ok: true } | { ok: false; error: string } {
  if (containsUnsafeGuaranteeClaim(copy)) {
    return {
      ok: false,
      error: "Offer copy cannot guarantee income, jobs, exact volume, insurance approval, coverage, or a specific provider.",
    };
  }

  return { ok: true };
}

export function deriveFringeRescuePlan(input: {
  sourceEventType: FringeSourceEventType;
  objectionType?: ObjectionType;
  estimatedValueCents?: number;
}): {
  rescueScore: number;
  recommendedOpenLoop: string;
  recommendedLivekitAction: string;
  nextBestCta: string;
} {
  const valueScore = Math.min(25, Math.floor((input.estimatedValueCents ?? 0) / 10000));
  const objection = input.objectionType ?? "none";
  const baseByEvent: Record<FringeSourceEventType, number> = {
    started_claim_no_finish: 45,
    pricing_view_no_buy: 50,
    adgrid_info_no_pay: 60,
    insurance_click_no_submit: 65,
    booked_call_no_confirm: 58,
    demo_no_purchase: 70,
    broker_one_load_no_subscribe: 64,
    advertiser_activity_no_renew: 72,
    high_value_objection: 75,
    other: 35,
  };

  const objectionBoost: Record<ObjectionType, number> = {
    none: 0,
    uncertainty: 8,
    support: 10,
    financial_logistic: 6,
    timing_logistic: 5,
    other: 3,
  };

  const openLoopByObjection: Record<ObjectionType, string> = {
    none: "Show the exact next action, proof asset, and activation path.",
    uncertainty: "Show the market snapshot, proof asset, and why the graph-based mechanism differs from old directories.",
    support: "Send a decision pack built for the decision maker and ask what concern will matter most.",
    financial_logistic: "Offer a smaller scope or test only after the buyer confirms the direction is right.",
    timing_logistic: "Schedule the next touch around the launch window and bring a concrete preview.",
    other: "Clarify the real blocker before presenting terms or discounts.",
  };

  return {
    rescueScore: clampScore(baseByEvent[input.sourceEventType] + objectionBoost[objection] + valueScore),
    recommendedOpenLoop: openLoopByObjection[objection],
    recommendedLivekitAction: objection === "support" || objection === "uncertainty" ? "schedule_value_follow_up" : "queue_callback",
    nextBestCta: objection === "financial_logistic" ? "start_smaller_paid_test" : "send_decision_pack",
  };
}

export function buildDecisionPackSkeleton(input: DecisionPackInput): DecisionPackSkeleton {
  return {
    audience: input.audience,
    productKey: input.productKey,
    sections: [
      { key: "problem", title: "Buyer-specific problem", required: true },
      { key: "mechanism", title: "Haul Command mechanism", required: true },
      { key: "proof", title: "Relevant proof assets", required: true },
      { key: "pricing", title: "Pricing and options", required: true },
      { key: "objections", title: "FAQ and objection answers", required: true },
      { key: "next_step", title: "Next step", required: true },
    ],
    problem: input.problem,
    mechanism: input.mechanism,
    proofAssetKeys: input.proofAssetKeys ?? [],
    pricingOptions: input.pricingOptions ?? [],
    objectionAnswers: input.objectionAnswers ?? {},
    nextStep: { label: input.nextStepLabel, url: input.nextStepUrl },
  };
}
