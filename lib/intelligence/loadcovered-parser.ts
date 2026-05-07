export type EntityTypeGuess =
  | "pilot_car_provider"
  | "broker_dispatch_carrier"
  | "permit_service"
  | "unknown_contact";

export interface ParsedDemandSignal {
  sourceName: "LoadCovered";
  sourceType: "historical_load_alert";
  sourceDate: string | null;
  rawText: string;
  posterNameRaw: string | null;
  posterPhoneRaw: string | null;
  posterPhoneNormalized: string | null;
  originCityRaw: string | null;
  originState: string | null;
  destinationCityRaw: string | null;
  destinationState: string | null;
  requestedRoleRaw: string | null;
  requestedRoleNormalized: string | null;
  urgencyTerms: string[];
  paymentTerms: string[];
  certificationTerms: string[];
  riskTerms: string[];
  confidenceScore: number;
  loadStatus: "historical_observed";
  activeLeadEligible: false;
  coveredVolumeEligible: true;
  fillHistoryEligible: true;
  executedDemandProxy: true;
  laneKey: string | null;
  observationFingerprint: string;
}

export interface ParsedEntity {
  displayName: string;
  phoneNormalized: string | null;
  entityTypeGuess: EntityTypeGuess;
  roleConfidence: number;
  dualRoleEvidence: boolean;
  publicCandidate: boolean;
  reviewRequired: boolean;
}

export interface RiskObservation {
  displayName: string | null;
  phoneNormalized: string | null;
  rawText: string;
  riskTerms: string[];
  publicSafe: false;
}

export interface ParsedLoadCoveredBatch {
  signals: ParsedDemandSignal[];
  entities: ParsedEntity[];
  riskObservations: RiskObservation[];
}

const PHONE_RE = /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;
const DATE_RE = /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})\s+/;

const ROLE_PATTERNS: Array<[RegExp, string, string]> = [
  [/\broute\s*survey\b/i, "Route Survey", "route_survey_provider"],
  [/\bhigh\s*pole\b|\bHP\b|\bpole\b/i, "High Pole", "high_pole_operator"],
  [/\bchase\b/i, "Chase", "chase_car_operator"],
  [/\blead\b/i, "Lead", "lead_car_operator"],
  [/\bsteer(?:man|sman)?\b/i, "Steer", "steerman"],
  [/\bP\b/, "P", "unknown_raw_p"],
];

const URGENCY_TERMS = [
  "asap",
  "today",
  "tomorrow",
  "sunrise",
  "noon",
  "early morning",
  "breakdown",
  "need in",
];

const PAYMENT_TERMS = [
  "qp",
  "quick pay",
  "cod",
  "efs",
  "pay at drop",
  "day rate",
];

const CERTIFICATION_TERMS = [
  "ny certified",
  "az/nm certified",
  "bridgeway approved",
  "landstar approved",
  "certified",
];

const RISK_TERMS = [
  "scammer",
  "beware",
  "won't pay",
  "wont pay",
  "nonpay",
  "broke",
  "no show",
  "switch bait",
  "rude",
  "don't help",
  "dont help",
];

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.trim();
}

function stableFingerprint(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `lc_${(hash >>> 0).toString(16)}`;
}

function collectTerms(raw: string, terms: string[]): string[] {
  const lower = raw.toLowerCase();
  return terms.filter(term => lower.includes(term));
}

function normalizeDate(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function parseLocationPair(raw: string): {
  originCityRaw: string | null;
  originState: string | null;
  destinationCityRaw: string | null;
  destinationState: string | null;
} {
  const match = raw.match(/\bfrom\s+([A-Za-z .'-]+?)\s+([A-Z]{2})\s+to\s+([A-Za-z .'-]+?)\s+([A-Z]{2})\b/i);
  if (!match) {
    const stateOnly = raw.match(/\bin\s+([A-Z]{2})\b/);
    return {
      originCityRaw: null,
      originState: stateOnly?.[1]?.toUpperCase() ?? null,
      destinationCityRaw: null,
      destinationState: null,
    };
  }

  return {
    originCityRaw: match[1].trim(),
    originState: match[2].toUpperCase(),
    destinationCityRaw: match[3].trim(),
    destinationState: match[4].toUpperCase(),
  };
}

function parseRole(raw: string): { rawRole: string | null; normalizedRole: string | null } {
  for (const [pattern, rawRole, normalizedRole] of ROLE_PATTERNS) {
    if (pattern.test(raw)) return { rawRole, normalizedRole };
  }
  return { rawRole: null, normalizedRole: null };
}

function classifyEntity(name: string, raw: string): Omit<ParsedEntity, "displayName" | "phoneNormalized"> {
  const lower = `${name} ${raw}`.toLowerCase();
  const hasProvider = /\b(pilot|pilot car|escort|pevo|flag car|pcs|mce|navigator|high pole)\b/.test(lower);
  const hasDemand = /\b(logistics|transport|trucking|freight|carrier|dispatch|cargo|agency|express|heavy haul)\b/.test(lower);
  const hasPermit = /\b(permit|permits|compliance|route survey)\b/.test(lower);
  const looksIndividual = /^[A-Z][a-z]+$/.test(name.trim()) || /^dispatch$/i.test(name.trim());

  if (hasPermit && !hasProvider) {
    return {
      entityTypeGuess: "permit_service",
      roleConfidence: 0.82,
      dualRoleEvidence: hasDemand,
      publicCandidate: true,
      reviewRequired: false,
    };
  }

  if (hasProvider) {
    return {
      entityTypeGuess: "pilot_car_provider",
      roleConfidence: hasDemand ? 0.72 : 0.86,
      dualRoleEvidence: hasDemand,
      publicCandidate: true,
      reviewRequired: hasDemand,
    };
  }

  if (hasDemand) {
    return {
      entityTypeGuess: "broker_dispatch_carrier",
      roleConfidence: 0.78,
      dualRoleEvidence: false,
      publicCandidate: true,
      reviewRequired: false,
    };
  }

  return {
    entityTypeGuess: "unknown_contact",
    roleConfidence: looksIndividual ? 0.35 : 0.45,
    dualRoleEvidence: false,
    publicCandidate: false,
    reviewRequired: true,
  };
}

function extractName(lineWithoutDate: string, phoneRaw: string | null): string | null {
  const beforePhone = phoneRaw ? lineWithoutDate.slice(0, lineWithoutDate.indexOf(phoneRaw)).trim() : "";
  if (!beforePhone) return null;
  return beforePhone.replace(/\s+/g, " ");
}

export function parseLoadCoveredText(text: string): ParsedLoadCoveredBatch {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const signals: ParsedDemandSignal[] = [];
  const entitiesByKey = new Map<string, ParsedEntity>();
  const riskObservations: RiskObservation[] = [];

  for (const line of lines) {
    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) continue;

    const sourceDate = normalizeDate(dateMatch[1]);
    const lineWithoutDate = line.replace(DATE_RE, "");
    const phoneRaw = lineWithoutDate.match(PHONE_RE)?.[0] ?? null;
    const phoneNormalized = normalizePhone(phoneRaw);
    const posterNameRaw = extractName(lineWithoutDate, phoneRaw);
    const locations = parseLocationPair(lineWithoutDate);
    const role = parseRole(lineWithoutDate);
    const urgencyTerms = collectTerms(lineWithoutDate, URGENCY_TERMS);
    const paymentTerms = collectTerms(lineWithoutDate, PAYMENT_TERMS);
    const certificationTerms = collectTerms(lineWithoutDate, CERTIFICATION_TERMS);
    const riskTerms = collectTerms(lineWithoutDate, RISK_TERMS);
    const laneKey = locations.originState && locations.destinationState
      ? `${locations.originState}-${locations.destinationState}`
      : null;

    const signal: ParsedDemandSignal = {
      sourceName: "LoadCovered",
      sourceType: "historical_load_alert",
      sourceDate,
      rawText: line,
      posterNameRaw,
      posterPhoneRaw: phoneRaw,
      posterPhoneNormalized: phoneNormalized,
      originCityRaw: locations.originCityRaw,
      originState: locations.originState,
      destinationCityRaw: locations.destinationCityRaw,
      destinationState: locations.destinationState,
      requestedRoleRaw: role.rawRole,
      requestedRoleNormalized: role.normalizedRole,
      urgencyTerms,
      paymentTerms,
      certificationTerms,
      riskTerms,
      confidenceScore: phoneNormalized && posterNameRaw ? 0.82 : 0.55,
      loadStatus: "historical_observed",
      activeLeadEligible: false,
      coveredVolumeEligible: true,
      fillHistoryEligible: true,
      executedDemandProxy: true,
      laneKey,
      observationFingerprint: stableFingerprint(line),
    };
    signals.push(signal);

    if (posterNameRaw) {
      const classified = classifyEntity(posterNameRaw, lineWithoutDate);
      const key = phoneNormalized ?? posterNameRaw.toLowerCase();
      const existing = entitiesByKey.get(key);
      entitiesByKey.set(key, {
        displayName: existing?.displayName ?? posterNameRaw,
        phoneNormalized,
        entityTypeGuess: existing?.entityTypeGuess ?? classified.entityTypeGuess,
        roleConfidence: Math.max(existing?.roleConfidence ?? 0, classified.roleConfidence),
        dualRoleEvidence: Boolean(existing?.dualRoleEvidence || classified.dualRoleEvidence),
        publicCandidate: Boolean(existing?.publicCandidate || classified.publicCandidate),
        reviewRequired: Boolean(existing?.reviewRequired || classified.reviewRequired),
      });
    }

    if (riskTerms.length > 0) {
      riskObservations.push({
        displayName: posterNameRaw,
        phoneNormalized,
        rawText: line,
        riskTerms,
        publicSafe: false,
      });
    }
  }

  return {
    signals,
    entities: [...entitiesByKey.values()],
    riskObservations,
  };
}
