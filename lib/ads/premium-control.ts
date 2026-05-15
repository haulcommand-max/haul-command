import type { HouseAd, HouseAdContext } from "./house-ads";

export const PREMIUM_AD_SCORE_WEIGHTS = {
  contextMatch: 20,
  offerStrength: 15,
  visualQuality: 15,
  copyClarity: 10,
  ctaStrength: 10,
  brandConsistency: 10,
  mobileQuality: 10,
  localTerminologyAccuracy: 5,
  trackingComplianceAccessibility: 5,
} as const;

export type PremiumAdDecision = "blocked" | "temporary_house_fallback" | "default_house" | "premium_paid_standard";

export type PremiumAdScore = {
  total: number;
  decision: PremiumAdDecision;
  contextMatch: number;
  offerStrength: number;
  visualQuality: number;
  copyClarity: number;
  ctaStrength: number;
  brandConsistency: number;
  mobileQuality: number;
  localTerminologyAccuracy: number;
  trackingComplianceAccessibility: number;
  violations: string[];
};

export const WEAK_CTA_LABELS = ["Learn More", "Click Here", "Get Started", "Advertise With Us"];

export const PROHIBITED_AD_PATTERNS = [
  "white_empty_sponsor_box",
  "generic_stock_truck_photo",
  "random_gradient",
  "cartoon_logistics_graphic",
  "saas_blue_layout",
  "text_baked_into_image",
  "fake_urgency",
  "fake_guarantee",
  "fake_sponsor_logo",
  "low_resolution_asset",
] as const;

export const PREMIUM_SLOT_TEMPLATES = [
  "hero_sponsor_band",
  "inline_premium_card",
  "right_rail_intelligence_card",
  "footer_sponsorship_band",
  "mobile_sticky_cta",
  "glossary_category_sponsor",
  "training_module_sponsor",
  "corridor_sponsor",
  "jurisdiction_sponsor",
  "directory_claim_ad",
  "tool_conversion_ad",
] as const;

const STRONG_CTA_STARTS = [
  "Claim",
  "Lock",
  "Build",
  "Start",
  "Post",
  "Sponsor",
  "View",
  "Open",
  "List",
  "Launch",
  "Reserve",
];

function scoreBoolean(condition: boolean, points: number, partial = Math.floor(points * 0.6)) {
  return condition ? points : partial;
}

function getPremiumDecision(total: number): PremiumAdDecision {
  if (total >= 95) return "premium_paid_standard";
  if (total >= 90) return "default_house";
  if (total >= 80) return "temporary_house_fallback";
  return "blocked";
}

export function getPremiumAdViolations(ad: Pick<HouseAd, "cta_text" | "image_url" | "headline" | "body" | "image_prompt">) {
  const violations: string[] = [];
  const imagePrompt = ad.image_prompt ?? "";
  const promptAllowsBakedText =
    imagePrompt.match(/\b(text|logo|wordmark|headline)\b/i) &&
    !imagePrompt.match(/\b(no|without)\s+(text|logos?|wordmarks?|headlines?)\b/i);

  if (WEAK_CTA_LABELS.includes(ad.cta_text)) violations.push("weak_cta");
  if (!ad.image_url?.match(/^\/(ads|backgrounds|blog)\//)) violations.push("unapproved_image_path");
  if (promptAllowsBakedText) violations.push("image_prompt_risks_baked_text");
  if (ad.headline.length > 96) violations.push("headline_too_long_for_mobile");
  if (!ad.body || ad.body.length < 50) violations.push("body_too_thin");
  if (ad.body?.match(/guaranteed|limited time only|act now or lose/i)) violations.push("fake_urgency_or_guarantee_risk");
  return violations;
}

export function scorePremiumAdCreative(ad: HouseAd, context: HouseAdContext = {}): PremiumAdScore {
  const violations = getPremiumAdViolations(ad);
  const contextText = `${context.surface ?? ""} ${context.pageType ?? ""} ${context.intent ?? ""}`.toLowerCase();
  const contextMatch =
    !contextText || contextText.includes(ad.intent) || contextText.includes(ad.goal.replace(/_/g, " "))
      ? PREMIUM_AD_SCORE_WEIGHTS.contextMatch
      : 14;
  const offerStrength = scoreBoolean(
    ad.headline.length >= 18 && Boolean(ad.body?.match(/claim|sponsor|training|route|load|profile|directory|permit|corridor/i)),
    PREMIUM_AD_SCORE_WEIGHTS.offerStrength,
    9,
  );
  const visualQuality = scoreBoolean(
    Boolean(ad.image_url?.match(/^\/(ads|backgrounds|blog)\//)) && !violations.includes("image_prompt_risks_baked_text"),
    PREMIUM_AD_SCORE_WEIGHTS.visualQuality,
    8,
  );
  const copyClarity = scoreBoolean(ad.headline.length <= 96 && Boolean(ad.body && ad.body.length >= 50), PREMIUM_AD_SCORE_WEIGHTS.copyClarity, 6);
  const ctaStrength = scoreBoolean(
    STRONG_CTA_STARTS.some((verb) => ad.cta_text.startsWith(verb)) && !WEAK_CTA_LABELS.includes(ad.cta_text),
    PREMIUM_AD_SCORE_WEIGHTS.ctaStrength,
    5,
  );
  const brandConsistency = scoreBoolean(
    Boolean(ad.image_prompt?.match(/premium|dark|command|amber|bronze|heavy-haul|route|industrial/i)) ||
      Boolean(ad.image_url?.match(/^\/(ads|backgrounds|blog)\//)),
    PREMIUM_AD_SCORE_WEIGHTS.brandConsistency,
    6,
  );
  const mobileQuality = scoreBoolean(ad.headline.length <= 88 && ad.cta_text.length <= 32, PREMIUM_AD_SCORE_WEIGHTS.mobileQuality, 6);
  const localTerminologyAccuracy = context.country ? scoreBoolean(Boolean(ad.cta_url?.includes(`country=${context.country}`)), 5, 3) : 5;
  const trackingComplianceAccessibility = scoreBoolean(
    ad.campaign_id.length > 0 && ad.creative_id.length > 0 && ad.visual_alt.length >= 8 && ad.cta_url.startsWith("/"),
    PREMIUM_AD_SCORE_WEIGHTS.trackingComplianceAccessibility,
    3,
  );

  const total =
    contextMatch +
    offerStrength +
    visualQuality +
    copyClarity +
    ctaStrength +
    brandConsistency +
    mobileQuality +
    localTerminologyAccuracy +
    trackingComplianceAccessibility -
    violations.length * 5;

  return {
    total,
    decision: getPremiumDecision(total),
    contextMatch,
    offerStrength,
    visualQuality,
    copyClarity,
    ctaStrength,
    brandConsistency,
    mobileQuality,
    localTerminologyAccuracy,
    trackingComplianceAccessibility,
    violations,
  };
}
