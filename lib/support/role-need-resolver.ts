export type PermitReadiness = "unknown" | "not_started" | "in_progress" | "ready";
export type RouteConfidence = "unknown" | "known" | "needs_review";
export type MoveUrgency = "planning" | "this_week" | "today";

export interface RoleNeedInput {
  widthFt?: number | null;
  heightFt?: number | null;
  weightLbs?: number | null;
  lengthFt?: number | null;
  countryCode?: string | null;
  origin?: string | null;
  destination?: string | null;
  routeConfidence?: RouteConfidence | null;
  permitReadiness?: PermitReadiness | null;
  urgency?: MoveUrgency | null;
}

export interface RecommendedSupportRole {
  id: string;
  label: string;
  confidence: "low" | "medium" | "high";
  reason: string;
  directoryHref: string;
}

export interface RoleNeedResolution {
  countryCode: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  recommendedRoles: RecommendedSupportRole[];
  warnings: string[];
  nextActions: Array<{
    label: string;
    href: string;
    intent: "find_provider" | "post_load" | "check_requirements" | "claim_listing";
  }>;
  disclaimer: string;
}

const ROLE_LABELS: Record<string, string> = {
  pilot_car_operator: "Pilot car / escort operator",
  high_pole_escort: "High-pole escort",
  route_surveyor: "Route survey provider",
  permit_service: "Permit support",
  traffic_control: "Traffic control / police escort coordination",
  steer_car_support: "Steer car support",
  staging_yard: "Staging or laydown yard",
  mobile_repair: "Mobile repair / field support",
};

const ROLE_QUERIES: Record<string, string> = {
  pilot_car_operator: "pilot car escort",
  high_pole_escort: "high pole escort",
  route_surveyor: "route survey",
  permit_service: "permit support",
  traffic_control: "traffic control police escort",
  steer_car_support: "steer car support",
  staging_yard: "staging yard",
  mobile_repair: "mobile repair",
};

function numeric(value: number | null | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCountry(countryCode: string | null | undefined): string {
  const normalized = String(countryCode || "US").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "US";
}

function addRole(
  roles: Map<string, RecommendedSupportRole>,
  id: string,
  confidence: RecommendedSupportRole["confidence"],
  reason: string,
  countryCode: string,
) {
  const existing = roles.get(id);
  const rank = { low: 1, medium: 2, high: 3 };
  if (existing && rank[existing.confidence] >= rank[confidence]) return;

  const query = ROLE_QUERIES[id] || id.replace(/_/g, " ");
  const params = new URLSearchParams({ q: query, country: countryCode });
  roles.set(id, {
    id,
    label: ROLE_LABELS[id] || id.replace(/_/g, " "),
    confidence,
    reason,
    directoryHref: `/directory?${params.toString()}`,
  });
}

function deriveRisk(score: number): RoleNeedResolution["riskLevel"] {
  if (score >= 8) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function resolveSupportRoles(input: RoleNeedInput): RoleNeedResolution {
  const countryCode = normalizeCountry(input.countryCode);
  const widthFt = numeric(input.widthFt);
  const heightFt = numeric(input.heightFt);
  const weightLbs = numeric(input.weightLbs);
  const lengthFt = numeric(input.lengthFt);
  const routeConfidence = input.routeConfidence || "unknown";
  const permitReadiness = input.permitReadiness || "unknown";
  const urgency = input.urgency || "planning";
  const roles = new Map<string, RecommendedSupportRole>();
  const warnings: string[] = [];
  let riskScore = 0;

  const hasOversizeSignal =
    (widthFt !== null && widthFt >= 12) ||
    (heightFt !== null && heightFt >= 13.5) ||
    (weightLbs !== null && weightLbs >= 80000) ||
    (lengthFt !== null && lengthFt >= 75);

  if (hasOversizeSignal) {
    riskScore += 2;
    addRole(roles, "pilot_car_operator", "high", "The move has oversize or overweight signals that commonly require escort support.", countryCode);
  } else {
    addRole(roles, "pilot_car_operator", "low", "Use this as the baseline support role when you are not sure which escort capability applies.", countryCode);
  }

  if (heightFt !== null && heightFt >= 14) {
    riskScore += heightFt >= 15 ? 3 : 2;
    addRole(roles, "high_pole_escort", heightFt >= 15 ? "high" : "medium", "Tall loads may need a height pole to check overhead clearance before the load reaches bridges, signals, or utilities.", countryCode);
  }

  const hasRouteSignal = Boolean(input.origin?.trim() || input.destination?.trim());

  if (routeConfidence !== "known" && (routeConfidence === "needs_review" || hasOversizeSignal || hasRouteSignal)) {
    riskScore += routeConfidence === "needs_review" ? 2 : 1;
    addRole(roles, "route_surveyor", routeConfidence === "needs_review" ? "high" : "medium", "The route is not confirmed enough to rely only on a phone search for escorts.", countryCode);
  }

  if ((heightFt !== null && heightFt >= 15) || (widthFt !== null && widthFt >= 16) || (weightLbs !== null && weightLbs >= 120000)) {
    riskScore += 2;
    addRole(roles, "route_surveyor", "high", "Large dimensions or high weight increase clearance, turn-radius, bridge, and jurisdiction review risk.", countryCode);
  }

  if (permitReadiness !== "ready" && (permitReadiness !== "unknown" || hasOversizeSignal)) {
    riskScore += permitReadiness === "not_started" ? 2 : 1;
    addRole(roles, "permit_service", permitReadiness === "not_started" ? "high" : "medium", "Permit status is not ready, so the support plan should include permit help before dispatch.", countryCode);
  }

  if ((widthFt !== null && widthFt >= 16) || (weightLbs !== null && weightLbs >= 150000)) {
    riskScore += 2;
    addRole(roles, "traffic_control", "medium", "Wide or heavy moves may need traffic control or police escort coordination depending on jurisdiction.", countryCode);
  }

  if (lengthFt !== null && lengthFt >= 120) {
    riskScore += 2;
    addRole(roles, "steer_car_support", "medium", "Long loads can need specialized turn, rear, or steer support beyond a basic escort.", countryCode);
  }

  if (urgency !== "planning") {
    riskScore += urgency === "today" ? 2 : 1;
    addRole(roles, "staging_yard", "medium", "Short-timeline moves need a fallback place to stage if permits, escorts, or route clearance are delayed.", countryCode);
    addRole(roles, "mobile_repair", "low", "Urgent moves benefit from field-support fallback in case the route or equipment changes under pressure.", countryCode);
  }

  if (countryCode !== "US") {
    warnings.push("Country-specific role names, permit authorities, units, and escort rules can differ. Treat this as a planning resolver, not a legal determination.");
  }

  if (!widthFt && !heightFt && !weightLbs && !lengthFt) {
    warnings.push("Add load dimensions for a stronger role recommendation.");
  }

  if (routeConfidence !== "known") {
    warnings.push("Do not dispatch from this output alone when the route is unknown or needs review.");
  }

  const orderedRoles = Array.from(roles.values()).sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return rank[b.confidence] - rank[a.confidence] || a.label.localeCompare(b.label);
  });
  const topRole = orderedRoles[0];
  const encodedNeed = encodeURIComponent(
    [topRole?.label || "heavy haul support", input.origin, input.destination].filter(Boolean).join(" "),
  );

  return {
    countryCode,
    riskLevel: deriveRisk(riskScore),
    summary: topRole
      ? `Start with ${topRole.label.toLowerCase()} and verify the adjacent support roles before the load moves.`
      : "Start with a directory search, then add dimensions to tighten the support plan.",
    recommendedRoles: orderedRoles,
    warnings,
    nextActions: [
      { label: "Find providers", href: topRole?.directoryHref || `/directory?country=${countryCode}`, intent: "find_provider" },
      { label: "Post support need", href: `/loads/post?intent=role-resolver&q=${encodedNeed}`, intent: "post_load" },
      { label: "Check requirements", href: `/regulations?country=${countryCode}&intent=role-resolver`, intent: "check_requirements" },
      { label: "Claim or add profile", href: `/claim?source=role-resolver&role=${encodeURIComponent(topRole?.id || "support")}`, intent: "claim_listing" },
    ],
    disclaimer: "Planning output only. Verify live rules, permits, route constraints, and provider qualifications before quoting or dispatching.",
  };
}
