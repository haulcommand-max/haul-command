/**
 * Haul Command Load Board Ingestion v3 — Line Parser
 *
 * Parses a single alert line into a structured ParsedObservation.
 * v3 adds: price extraction, tagging system, route families, speed signals.
 * Pure function — no side-effects, no database calls.
 */

import type {
  ParsedObservation,
  PricingObservation,
  ObservationTags,
  ServiceType,
  UrgencyLevel,
  PaymentTerm,
  RoleCandidate,
  ReputationSignal,
} from './types';

import {
  SERVICE_TYPE_MAP,
  URGENCY_MAP,
  PAYMENT_MAP,
  CAUTION_PATTERNS,
  ROLE_HINT_MAP,
  LINE_PREFIX_PATTERNS,
  PHONE_PATTERN,
  PLACEHOLDER_PHONES,
  LOCATION_PAIR_PATTERN,
  SINGLE_LOCATION_PATTERN,
  TRUNCATION_INDICATORS,
  PRICE_AMOUNT_PATTERN,
  RATE_PER_MILE_PATTERN,
  TOTAL_PRICE_PATTERN,
  MILES_PATTERN,
  getRouteFamilyKey,
} from './dictionaries';

// ─── Main Parser ─────────────────────────────────────────────────

export function parseLine(
  rawLine: string,
  context: {
    activeDate: string | null;
    batchDate: string | null;
    ingestionDate: string;
    sourceName: string | null;
    sourceType: import('./types').SourceType;
    countryHint: string | null;
  }
): ParsedObservation {
  const line = rawLine.trim();

  let cleanLine = line;
  for (const prefix of LINE_PREFIX_PATTERNS) {
    cleanLine = cleanLine.replace(prefix, '').trim();
  }

  const serviceType = detectServiceType(cleanLine);
  const urgency = detectUrgency(cleanLine);
  const paymentTerms = detectPaymentTerm(cleanLine);
  const { rawPhone, normalizedPhone, isPlaceholder } = extractPhone(cleanLine);
  const parsedName = extractNameOrCompany(cleanLine, rawPhone);
  const locations = extractLocations(cleanLine);
  const roleCandidates = detectRoles(cleanLine, parsedName);
  const reputationSignal = detectReputationSignal(cleanLine, parsedName, normalizedPhone);
  const specialRequirements = extractSpecialRequirements(cleanLine);
  const truncationFlag = TRUNCATION_INDICATORS.some((p) => p.test(line));
  const pricing = extractPricing(cleanLine, paymentTerms);

  const observedDate = context.activeDate ?? context.batchDate ?? context.ingestionDate;
  const dateUncertain = !context.activeDate && !context.batchDate;

  const countryCode = inferCountryCode(
    locations.originAdminDivision,
    locations.destinationAdminDivision,
    context.countryHint
  );

  // Corridor & route family
  const corridorKey =
    locations.originAdminDivision && locations.destinationAdminDivision
      ? `${locations.originAdminDivision}→${locations.destinationAdminDivision}`
      : null;
  const routeFamilyKey =
    locations.originAdminDivision && locations.destinationAdminDivision
      ? getRouteFamilyKey(locations.originAdminDivision, locations.destinationAdminDivision)
      : null;

  // Tagging
  const tags = buildTags({
    countryCode,
    originAdmin: locations.originAdminDivision,
    destAdmin: locations.destinationAdminDivision,
    corridorKey,
    routeFamilyKey,
    serviceType,
    urgency,
    paymentTerms,
    pricing,
    parsedName,
    isPlaceholder,
    reputationSignal,
    roleCandidates,
  });

  const parseConfidence = calculateConfidence({
    hasName: !!parsedName,
    hasPhone: !!normalizedPhone && !isPlaceholder,
    hasOrigin: !!locations.originRaw,
    hasDestination: !!locations.destinationRaw,
    hasService: serviceType !== 'unknown',
    hasPrice: pricing !== null,
    isTruncated: truncationFlag,
    hasReputation: !!reputationSignal,
  });

  return {
    raw_line: rawLine,
    observed_date: observedDate,
    observed_date_uncertain: dateUncertain,
    source_name: context.sourceName,
    source_type: context.sourceType,

    parsed_name_or_company: parsedName,
    raw_phone: rawPhone,
    normalized_phone: normalizedPhone,
    phone_is_placeholder: isPlaceholder,

    origin_raw: locations.originRaw,
    destination_raw: locations.destinationRaw,
    origin_city: locations.originCity,
    origin_admin_division: locations.originAdminDivision,
    destination_city: locations.destinationCity,
    destination_admin_division: locations.destinationAdminDivision,
    country_code: countryCode,

    service_type: serviceType,
    urgency,
    payment_terms: paymentTerms,
    role_candidates: roleCandidates,
    reputation_signal: reputationSignal,
    special_requirements: specialRequirements,

    pricing,
    tags,
    corridor_key: corridorKey,
    route_family_key: routeFamilyKey,

    truncation_flag: truncationFlag,
    parse_confidence: parseConfidence,

    board_activity_flag: true,
    availability_assumption: 'likely_not_available',
    volume_signal_weight: parseConfidence,

    // Speed signals — computed at batch level in engine, initialized here
    same_actor_repeat_same_day: false,
    same_route_repeat_same_day: false,
    timed_post_flag: urgency === 'timed',
    fast_cover_signal: urgency === 'immediate' ? 0.8 : urgency === 'timed' ? 0.5 : 0,

    is_seed_data: true,
    source_format: 'alert_line',
  };
}


// ─── Detection Helpers ───────────────────────────────────────────

function detectServiceType(line: string): ServiceType {
  for (const entry of SERVICE_TYPE_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(line)) return entry.type;
    }
  }
  return 'unknown';
}

function detectUrgency(line: string): UrgencyLevel {
  for (const entry of URGENCY_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(line)) return entry.level;
    }
  }
  return 'unspecified';
}

function detectPaymentTerm(line: string): PaymentTerm {
  for (const entry of PAYMENT_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(line)) return entry.term;
    }
  }
  return 'unspecified';
}

function extractPhone(line: string): {
  rawPhone: string | null;
  normalizedPhone: string | null;
  isPlaceholder: boolean;
} {
  PHONE_PATTERN.lastIndex = 0;
  const match = line.match(PHONE_PATTERN);
  if (!match || match.length === 0) {
    return { rawPhone: null, normalizedPhone: null, isPlaceholder: false };
  }
  const rawPhone = match[0];
  const normalized = rawPhone.replace(/\D/g, '');
  const cleanNormalized =
    normalized.length === 11 && normalized.startsWith('1')
      ? normalized.slice(1)
      : normalized;
  const isPlaceholder = PLACEHOLDER_PHONES.has(cleanNormalized);
  return { rawPhone, normalizedPhone: cleanNormalized, isPlaceholder };
}

function extractNameOrCompany(line: string, rawPhone: string | null): string | null {
  let candidate = line;
  for (const prefix of LINE_PREFIX_PATTERNS) {
    candidate = candidate.replace(prefix, '').trim();
  }
  if (rawPhone) {
    const phoneIdx = candidate.indexOf(rawPhone);
    if (phoneIdx > 0) candidate = candidate.substring(0, phoneIdx).trim();
  }
  const locMatch = candidate.match(LOCATION_PAIR_PATTERN);
  if (locMatch && locMatch.index !== undefined && locMatch.index > 0) {
    candidate = candidate.substring(0, locMatch.index).trim();
  }
  const serviceIndicators = /\b(?:need(?:s|ed)?|looking\s?for|has\s?a?)\s+(?:lead|chase|steer|pilot|escort|survey)/i;
  const svcMatch = candidate.match(serviceIndicators);
  if (svcMatch && svcMatch.index !== undefined && svcMatch.index > 0) {
    candidate = candidate.substring(0, svcMatch.index).trim();
  }
  candidate = candidate.replace(/[-–:,.\s]+$/, '').trim();
  if (!candidate || candidate.length < 2) return null;
  if (/^(?:lead|chase|steer|need|has|survey)$/i.test(candidate)) return null;
  return candidate;
}

interface LocationParts {
  originRaw: string | null;
  destinationRaw: string | null;
  originCity: string | null;
  originAdminDivision: string | null;
  destinationCity: string | null;
  destinationAdminDivision: string | null;
}

function extractLocations(line: string): LocationParts {
  const pairMatch = line.match(LOCATION_PAIR_PATTERN);
  if (pairMatch) {
    return {
      originRaw: `${pairMatch[1].trim()}, ${pairMatch[2]}`,
      destinationRaw: `${pairMatch[3].trim()}, ${pairMatch[4]}`,
      originCity: pairMatch[1].trim(),
      originAdminDivision: pairMatch[2],
      destinationCity: pairMatch[3].trim(),
      destinationAdminDivision: pairMatch[4],
    };
  }
  const singles: { city: string; admin: string; raw: string }[] = [];
  SINGLE_LOCATION_PATTERN.lastIndex = 0;
  let m;
  while ((m = SINGLE_LOCATION_PATTERN.exec(line)) !== null) {
    singles.push({ city: m[1].trim(), admin: m[2], raw: `${m[1].trim()}, ${m[2]}` });
  }
  if (singles.length >= 2) {
    return {
      originRaw: singles[0].raw, destinationRaw: singles[1].raw,
      originCity: singles[0].city, originAdminDivision: singles[0].admin,
      destinationCity: singles[1].city, destinationAdminDivision: singles[1].admin,
    };
  }
  if (singles.length === 1) {
    return {
      originRaw: singles[0].raw, destinationRaw: null,
      originCity: singles[0].city, originAdminDivision: singles[0].admin,
      destinationCity: null, destinationAdminDivision: null,
    };
  }
  return {
    originRaw: null, destinationRaw: null, originCity: null,
    originAdminDivision: null, destinationCity: null, destinationAdminDivision: null,
  };
}

function detectRoles(line: string, parsedName: string | null): RoleCandidate[] {
  const roles: RoleCandidate[] = [];
  const combined = `${parsedName ?? ''} ${line}`;
  for (const entry of ROLE_HINT_MAP) {
    for (const pattern of entry.patterns) {
      if (pattern.test(combined)) {
        roles.push({ role: entry.role, confidence: 0.5, evidence: `pattern: ${pattern.source}` });
        break;
      }
    }
  }
  // v3 patch: broker_role_observed first — anyone posting on the load board
  // is acting as a broker/dispatcher for HC purposes.
  // Unknown only if no phone, no name, no role language.
  if (roles.length === 0) {
    const hasPhone = PHONE_PATTERN.test(line);
    const hasName = !!parsedName && parsedName.length > 1;
    if (hasPhone || hasName) {
      roles.push({ role: 'broker_role_observed', confidence: 0.6, evidence: 'load_board_poster_default' });
    } else {
      roles.push({ role: 'unknown_market_actor', confidence: 0.1, evidence: 'no role hints, no phone, no name' });
    }
  }
  return roles;
}

function detectReputationSignal(
  line: string, targetName: string | null, targetPhone: string | null
): ReputationSignal | null {
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(line)) {
      return {
        raw_text: line, target_name: targetName, target_phone: targetPhone,
        signal_type: 'caution', evidence_strength: 'single_mention', visibility: 'internal_only',
      };
    }
  }
  return null;
}

function extractSpecialRequirements(line: string): string[] {
  const reqs: string[] = [];
  const patterns: { label: string; regex: RegExp }[] = [
    { label: 'oversize', regex: /\boversize\b/i },
    { label: 'overweight', regex: /\boverweight\b/i },
    { label: 'superload', regex: /\bsuperload\b/i },
    { label: 'wide_load', regex: /\bwide\s?load\b/i },
    { label: 'high_pole', regex: /\bhigh\s?pole\b/i },
    { label: 'lowboy', regex: /\blowboy\b/i },
    { label: 'flatbed', regex: /\bflatbed\b/i },
    { label: 'police_escort', regex: /\bpolice\s?escort\b/i },
    { label: 'bucket_truck', regex: /\bbucket\s?truck\b/i },
    { label: 'height_pole', regex: /\bheight\s?pole\b/i },
  ];
  for (const { label, regex } of patterns) {
    if (regex.test(line)) reqs.push(label);
  }
  return reqs;
}

// ─── Price Extraction (v3) ───────────────────────────────────────

function extractPricing(line: string, payType: PaymentTerm): PricingObservation | null {
  // Check rate per mile first (most specific)
  RATE_PER_MILE_PATTERN.lastIndex = 0;
  const rateMatch = RATE_PER_MILE_PATTERN.exec(line);
  if (rateMatch) {
    const ppm = parseFloat(rateMatch[1]);
    return {
      raw_price_text: rateMatch[0],
      quoted_amount: null,
      quoted_currency: 'USD',
      quoted_pay_type: payType,
      quoted_miles: null,
      derived_pay_per_mile: isNaN(ppm) ? null : ppm,
      pricing_confidence: 0.7,
    };
  }

  // Check "total/flat" syntax: "250 total", "$600 total"
  TOTAL_PRICE_PATTERN.lastIndex = 0;
  const totalMatch = TOTAL_PRICE_PATTERN.exec(line);
  if (totalMatch) {
    const amount = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(amount) && amount >= 10 && amount <= 100000) {
      MILES_PATTERN.lastIndex = 0;
      const milesMatch = MILES_PATTERN.exec(line);
      const miles = milesMatch ? parseInt(milesMatch[1].replace(/,/g, '')) : null;
      const ppm = miles && miles > 0 ? Math.round((amount / miles) * 100) / 100 : null;
      return {
        raw_price_text: totalMatch[0],
        quoted_amount: amount,
        quoted_currency: 'USD',
        quoted_pay_type: payType,
        quoted_miles: miles,
        derived_pay_per_mile: ppm,
        pricing_confidence: 0.65,
      };
    }
  }

  // Check dollar amounts
  PRICE_AMOUNT_PATTERN.lastIndex = 0;
  const priceMatch = PRICE_AMOUNT_PATTERN.exec(line);
  if (priceMatch) {
    const amount = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (isNaN(amount) || amount < 10 || amount > 100000) return null;

    // Check for miles
    MILES_PATTERN.lastIndex = 0;
    const milesMatch = MILES_PATTERN.exec(line);
    const miles = milesMatch ? parseInt(milesMatch[1].replace(/,/g, '')) : null;
    const ppm = miles && miles > 0 ? Math.round((amount / miles) * 100) / 100 : null;

    return {
      raw_price_text: priceMatch[0],
      quoted_amount: amount,
      quoted_currency: 'USD',
      quoted_pay_type: payType,
      quoted_miles: miles,
      derived_pay_per_mile: ppm,
      pricing_confidence: miles ? 0.8 : 0.5,
    };
  }

  return null;
}

// ─── Tag Builder (v3) ────────────────────────────────────────────

function buildTags(ctx: {
  countryCode: string | null;
  originAdmin: string | null;
  destAdmin: string | null;
  corridorKey: string | null;
  routeFamilyKey: string | null;
  serviceType: ServiceType;
  urgency: UrgencyLevel;
  paymentTerms: PaymentTerm;
  pricing: PricingObservation | null;
  parsedName: string | null;
  isPlaceholder: boolean;
  reputationSignal: ReputationSignal | null;
  roleCandidates: RoleCandidate[];
}): ObservationTags {
  const geo: string[] = [];
  if (ctx.countryCode) geo.push(ctx.countryCode);
  if (ctx.originAdmin) geo.push(ctx.originAdmin);
  if (ctx.destAdmin && ctx.destAdmin !== ctx.originAdmin) geo.push(ctx.destAdmin);
  if (ctx.corridorKey) geo.push(`corridor:${ctx.corridorKey}`);
  if (ctx.routeFamilyKey) geo.push(`family:${ctx.routeFamilyKey}`);

  const svc: string[] = [ctx.serviceType];
  const urg: string[] = [ctx.urgency];
  const pay: string[] = [ctx.paymentTerms];
  if (ctx.pricing) {
    pay.push('price_present');
    if (ctx.pricing.quoted_miles) pay.push('miles_present');
    if (ctx.pricing.derived_pay_per_mile) pay.push('pay_per_mile_derived');
  }

  const actor: string[] = [];
  if (ctx.parsedName) actor.push('has_name');
  for (const rc of ctx.roleCandidates) actor.push(rc.role);

  const risk: string[] = [];
  if (ctx.reputationSignal) {
    risk.push(`${ctx.reputationSignal.signal_type}_flag`);
    risk.push('warning_text_present');
  }
  if (ctx.isPlaceholder) risk.push('placeholder_phone');

  const intel: string[] = ['seed_data', 'volume_signal', 'recurrence_signal'];
  if (ctx.corridorKey) intel.push('corridor_signal');
  if (ctx.pricing) intel.push('pricing_signal');
  if (ctx.urgency !== 'unspecified') intel.push('urgency_signal');
  intel.push('monetization_signal');

  return { geography: geo, service: svc, urgency: urg, payment: pay, actor, risk, intelligence: intel };
}

// ─── Country Inference ───────────────────────────────────────────

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY',
]);

const CA_PROVINCES = new Set([
  'AB','BC','MB','NB','NL','NS','ON','PE','QC','SK','NT','NU','YT',
]);

function inferCountryCode(o: string | null, d: string | null, hint: string | null): string | null {
  for (const code of [o, d].filter(Boolean) as string[]) {
    if (US_STATES.has(code)) return 'US';
    if (CA_PROVINCES.has(code)) return 'CA';
  }
  return hint ?? null;
}

// ─── Confidence Calculation ──────────────────────────────────────

function calculateConfidence(factors: {
  hasName: boolean; hasPhone: boolean; hasOrigin: boolean;
  hasDestination: boolean; hasService: boolean; hasPrice: boolean;
  isTruncated: boolean; hasReputation: boolean;
}): number {
  let score = 0.15; // Base
  if (factors.hasName) score += 0.18;
  if (factors.hasPhone) score += 0.18;
  if (factors.hasOrigin) score += 0.13;
  if (factors.hasDestination) score += 0.13;
  if (factors.hasService) score += 0.13;
  if (factors.hasPrice) score += 0.05;
  if (factors.isTruncated) score -= 0.08;
  if (factors.hasReputation) score -= 0.03;
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}
