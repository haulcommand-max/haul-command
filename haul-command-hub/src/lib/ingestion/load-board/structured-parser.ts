/**
 * Haul Command Load Board Ingestion v3 — Structured Listing Parser
 *
 * Parses multi-line structured load board listings (e.g. from PilotCarLoads.com
 * listing view) into ParsedObservation objects.
 *
 * Format per listing block:
 *   Line 1: Company name - ID Verified
 *   Line 2: Recent / (empty)
 *   Line 3: Open / Covered
 *   Line 4: City, ST, USACity, ST, USA  (origin+destination concatenated)
 *   Line 5: Est. XXX mi
 *   Line 6: $X.XX/mi | $XXX.XX (total) | Contact for rate
 *   Line 7: Quick Pay | (service type if no payment)
 *   Line 8: (XXX) XXX-XXXX [Text Only]  |  Hidden for Covered Loads
 *   Line 9: MM/DD/YYYY
 *   Line 10: X minutes/hours/days ago
 *   Line 11+: Service type(s): Chase, Lead, High Pole, Third Car, etc.
 */

import type {
  ParsedObservation,
  PricingObservation,
  ObservationTags,
  ServiceType,
  UrgencyLevel,
  PaymentTerm,
  RoleCandidate,
  SourceType,
} from './types';
import { getRouteFamilyKey } from './dictionaries';

// ─── Structured Location Pattern ─────────────────────────────────
// Matches: "Olathe, KS, USAKansas City, MO, USA" (no space between)
const STRUCTURED_LOCATION =
  /^(.+?),\s*([A-Z]{2}),\s*USA(.+?),\s*([A-Z]{2}),\s*USA$/;

// Also handle: "Olathe, KS, USA" (single location)
const SINGLE_STRUCTURED_LOCATION =
  /^(.+?),\s*([A-Z]{2}),\s*USA$/;

// ─── Price Patterns ──────────────────────────────────────────────
const RATE_PER_MI = /^\$(\d+(?:\.\d{1,2})?)\/mi$/;
const TOTAL_PRICE = /^\$(\d[\d,]*(?:\.\d{1,2})?)\s*\(total\)$/i;
const CONTACT_FOR_RATE = /^Contact for rate$/i;

// ─── Phone Pattern ───────────────────────────────────────────────
const PHONE_STRUCTURED = /^\((\d{3})\)\s*(\d{3})-(\d{4})/;

// ─── Service Type Map ────────────────────────────────────────────
const SERVICE_MAP: Record<string, ServiceType> = {
  'lead': 'lead',
  'chase': 'chase',
  'steer': 'steer',
  'high pole': 'steer',
  'third car': 'steer',
  'route survey': 'route_survey',
};

// ─── US States ───────────────────────────────────────────────────
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY',
]);

// ─── Main Entry ──────────────────────────────────────────────────

export interface StructuredListing {
  companyName: string;
  idVerified: boolean;
  status: 'open' | 'covered';
  originCity: string | null;
  originState: string | null;
  destCity: string | null;
  destState: string | null;
  estimatedMiles: number | null;
  ratePerMile: number | null;
  totalPrice: number | null;
  contactForRate: boolean;
  paymentType: PaymentTerm;
  phone: string | null;
  phoneRaw: string | null;
  textOnly: boolean;
  date: string | null;
  serviceTypes: string[];
  urgencyHints: string[];
  nyCertified: boolean;
}

/**
 * Splits raw structured text into individual listing blocks, then parses each.
 */
export function parseStructuredListings(
  rawText: string,
  context: {
    sourceName: string | null;
    sourceType: SourceType;
    countryHint: string | null;
    ingestionDate: string;
  }
): ParsedObservation[] {
  const blocks = splitIntoBlocks(rawText);
  const observations: ParsedObservation[] = [];

  for (const block of blocks) {
    const listing = parseBlock(block);
    if (!listing) continue;
    const obs = listingToObservation(listing, rawText, context);
    observations.push(obs);
  }

  return observations;
}

/**
 * Detect if raw text is structured listing format (vs Load Alert format).
 */
export function isStructuredListingFormat(rawText: string): boolean {
  // Check for hallmarks: "ID Verified", "Est. XX mi", "Contact for rate"
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let idVerifiedCount = 0;
  let estMiCount = 0;
  for (const line of lines.slice(0, 30)) {
    if (/ID Verified/i.test(line)) idVerifiedCount++;
    if (/^Est\.\s+\d+\s+mi$/i.test(line)) estMiCount++;
  }
  return idVerifiedCount >= 2 && estMiCount >= 2;
}

// ─── Block Splitting ─────────────────────────────────────────────

function splitIntoBlocks(text: string): string[][] {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  const blocks: string[][] = [];
  let current: string[] = [];

  // Skip page headers like "1 of 2", "2 of 2"
  for (const line of lines) {
    if (!line) {
      if (current.length >= 3) blocks.push(current);
      current = [];
      continue;
    }
    if (/^\d+\s+of\s+\d+$/i.test(line)) continue;
    if (/^LeadMidwest/i.test(line)) continue; // malformed concatenation

    // New block starts with "- ID Verified" or "ID Verified"
    if (/ID Verified/i.test(line) && current.length > 0) {
      if (current.length >= 3) blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length >= 3) blocks.push(current);

  return blocks;
}

// ─── Block Parser ────────────────────────────────────────────────

function parseBlock(lines: string[]): StructuredListing | null {
  if (lines.length < 5) return null;

  // Line 0: Company name - ID Verified
  const nameLine = lines[0];
  const nameMatch = nameLine.match(/^(.+?)\s*-\s*ID Verified/i);
  const companyName = nameMatch ? nameMatch[1].trim() : nameLine.trim();
  const idVerified = /ID Verified/i.test(nameLine);

  if (!companyName || companyName.length < 2) return null;

  // Scan remaining lines for data
  let status: 'open' | 'covered' = 'open';
  let originCity: string | null = null;
  let originState: string | null = null;
  let destCity: string | null = null;
  let destState: string | null = null;
  let estimatedMiles: number | null = null;
  let ratePerMile: number | null = null;
  let totalPrice: number | null = null;
  let contactForRate = false;
  let paymentType: PaymentTerm = 'unspecified';
  let phone: string | null = null;
  let phoneRaw: string | null = null;
  let textOnly = false;
  let date: string | null = null;
  const serviceTypes: string[] = [];
  const urgencyHints: string[] = [];
  let nyCertified = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Status
    if (/^Open$/i.test(line)) { status = 'open'; continue; }
    if (/^Covered$/i.test(line)) { status = 'covered'; continue; }
    if (/^Recent$/i.test(line)) continue;

    // Location
    const locMatch = line.match(STRUCTURED_LOCATION);
    if (locMatch) {
      originCity = locMatch[1].trim();
      originState = locMatch[2];
      destCity = locMatch[3].trim();
      destState = locMatch[4];
      continue;
    }
    const singleLoc = line.match(SINGLE_STRUCTURED_LOCATION);
    if (singleLoc && !originCity) {
      originCity = singleLoc[1].trim();
      originState = singleLoc[2];
      continue;
    }

    // Miles
    const milesMatch = line.match(/^Est\.\s+(\d[\d,]*)\s+mi$/i);
    if (milesMatch) {
      estimatedMiles = parseInt(milesMatch[1].replace(/,/g, ''));
      continue;
    }

    // Rate
    const rpmMatch = line.match(RATE_PER_MI);
    if (rpmMatch) { ratePerMile = parseFloat(rpmMatch[1]); continue; }
    const totalMatch = line.match(TOTAL_PRICE);
    if (totalMatch) { totalPrice = parseFloat(totalMatch[1].replace(/,/g, '')); continue; }
    if (CONTACT_FOR_RATE.test(line)) { contactForRate = true; continue; }

    // Payment
    if (/^Quick Pay$/i.test(line)) { paymentType = 'quick_pay'; continue; }

    // Phone
    const phoneMatch = line.match(PHONE_STRUCTURED);
    if (phoneMatch) {
      phoneRaw = line;
      phone = `${phoneMatch[1]}${phoneMatch[2]}${phoneMatch[3]}`;
      textOnly = /Text Only/i.test(line);
      continue;
    }
    if (/^Hidden for Covered Loads$/i.test(line)) continue;

    // Date
    const dateMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dateMatch) {
      date = `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
      continue;
    }

    // Time ago (skip)
    if (/ago$/i.test(line) || /^less than/i.test(line)) continue;

    // Service types
    const lower = line.toLowerCase().trim();
    if (lower === 'chase' || lower === 'lead' || lower === 'steer' ||
        lower === 'high pole' || lower === 'third car' ||
        lower === 'route survey') {
      serviceTypes.push(lower);
      continue;
    }

    // NY Certified
    if (/NY Certified/i.test(line)) { nyCertified = true; continue; }

    // Urgency hints in company name
    if (/ASAP/i.test(line)) urgencyHints.push('immediate');
    if (/\d+\s*(?:am|pm)/i.test(line)) urgencyHints.push('timed');
  }

  return {
    companyName, idVerified, status,
    originCity, originState, destCity, destState,
    estimatedMiles, ratePerMile, totalPrice, contactForRate,
    paymentType, phone, phoneRaw, textOnly,
    date, serviceTypes, urgencyHints, nyCertified,
  };
}

// ─── Convert to Observation ──────────────────────────────────────

function listingToObservation(
  listing: StructuredListing,
  rawBlock: string,
  context: {
    sourceName: string | null;
    sourceType: SourceType;
    countryHint: string | null;
    ingestionDate: string;
  }
): ParsedObservation {
  // Determine service type
  let serviceType: ServiceType = 'unknown';
  for (const st of listing.serviceTypes) {
    const mapped = SERVICE_MAP[st];
    if (mapped && (serviceType === 'unknown' || mapped === 'lead' || mapped === 'chase')) {
      serviceType = mapped;
    }
  }

  // Determine urgency
  let urgency: UrgencyLevel = 'unspecified';
  if (listing.urgencyHints.includes('immediate')) urgency = 'immediate';
  else if (listing.urgencyHints.includes('timed')) urgency = 'timed';

  // Build pricing
  let pricing: PricingObservation | null = null;
  if (listing.ratePerMile) {
    const totalAmount = listing.estimatedMiles
      ? Math.round(listing.ratePerMile * listing.estimatedMiles * 100) / 100
      : null;
    pricing = {
      raw_price_text: `$${listing.ratePerMile}/mi`,
      quoted_amount: totalAmount,
      quoted_currency: 'USD',
      quoted_pay_type: listing.paymentType,
      quoted_miles: listing.estimatedMiles,
      derived_pay_per_mile: listing.ratePerMile,
      pricing_confidence: 0.9,
    };
  } else if (listing.totalPrice) {
    const ppm = listing.estimatedMiles && listing.estimatedMiles > 0
      ? Math.round((listing.totalPrice / listing.estimatedMiles) * 100) / 100
      : null;
    pricing = {
      raw_price_text: `$${listing.totalPrice} (total)`,
      quoted_amount: listing.totalPrice,
      quoted_currency: 'USD',
      quoted_pay_type: listing.paymentType,
      quoted_miles: listing.estimatedMiles,
      derived_pay_per_mile: ppm,
      pricing_confidence: 0.85,
    };
  }

  // Corridor & route family
  const corridorKey = listing.originState && listing.destState
    ? `${listing.originState}→${listing.destState}` : null;
  const routeFamilyKey = listing.originState && listing.destState
    ? getRouteFamilyKey(listing.originState, listing.destState) : null;

  // Country
  const countryCode = inferCountry(listing.originState, listing.destState, context.countryHint);

  // Role — v3 patch: broker_role_observed first for anyone posting on the board
  const roleCandidates: RoleCandidate[] = [];
  const nameL = listing.companyName.toLowerCase();

  // Primary: all load board posters are broker_role_observed
  roleCandidates.push({ role: 'broker_role_observed', confidence: 0.8, evidence: 'load_board_poster_structured' });

  // Secondary enrichment roles
  if (/pilot|pcs|escort|flag/i.test(nameL) && /permit/i.test(nameL)) {
    roleCandidates.push({ role: 'hybrid_possible', confidence: 0.7, evidence: 'name contains pilot+permit' });
  } else if (/pilot|pcs|escort|flag/i.test(nameL)) {
    roleCandidates.push({ role: 'pilot_related_actor', confidence: 0.6, evidence: 'name contains pilot/pcs/escort' });
  } else if (/permit/i.test(nameL)) {
    roleCandidates.push({ role: 'permit_related_actor', confidence: 0.6, evidence: 'name contains permit' });
  } else if (/transport|logistics|express|trucking|freight|hauler|carrier/i.test(nameL)) {
    roleCandidates.push({ role: 'transport_company_actor', confidence: 0.5, evidence: 'name contains transport/logistics' });
  } else if (/dispatch/i.test(nameL)) {
    roleCandidates.push({ role: 'dispatcher_role_observed', confidence: 0.6, evidence: 'name contains dispatch' });
  }

  // Tags
  const geo: string[] = [];
  if (countryCode) geo.push(countryCode);
  if (listing.originState) geo.push(listing.originState);
  if (listing.destState && listing.destState !== listing.originState) geo.push(listing.destState);
  if (corridorKey) geo.push(`corridor:${corridorKey}`);

  const tags: ObservationTags = {
    geography: geo,
    service: listing.serviceTypes.length > 0 ? listing.serviceTypes : [serviceType],
    urgency: [urgency],
    payment: [listing.paymentType, ...(pricing ? ['price_present'] : [])],
    actor: ['has_name', 'id_verified', 'broker_role_observed', ...roleCandidates.map(r => r.role)],
    risk: [],
    intelligence: ['seed_data', 'volume_signal', 'structured_listing',
      ...(pricing ? ['pricing_signal'] : []),
      ...(corridorKey ? ['corridor_signal'] : []),
      'monetization_signal'],
  };

  // Confidence is high for structured listings
  const confidence = 0.85 + (pricing ? 0.05 : 0) + (listing.phone ? 0.05 : 0) +
    (listing.estimatedMiles ? 0.03 : 0);

  const rawLine = `${listing.companyName} | ${listing.originCity ?? ''}, ${listing.originState ?? ''} → ${listing.destCity ?? ''}, ${listing.destState ?? ''} | ${listing.estimatedMiles ?? '?'} mi | ${pricing?.raw_price_text ?? 'Contact for rate'} | ${listing.phone ?? 'hidden'}`;

  return {
    raw_line: rawLine,
    observed_date: listing.date ?? context.ingestionDate,
    observed_date_uncertain: !listing.date,
    source_name: context.sourceName,
    source_type: context.sourceType,

    parsed_name_or_company: listing.companyName,
    raw_phone: listing.phoneRaw,
    normalized_phone: listing.phone,
    phone_is_placeholder: false,

    origin_raw: listing.originCity && listing.originState ? `${listing.originCity}, ${listing.originState}` : null,
    destination_raw: listing.destCity && listing.destState ? `${listing.destCity}, ${listing.destState}` : null,
    origin_city: listing.originCity,
    origin_admin_division: listing.originState,
    destination_city: listing.destCity,
    destination_admin_division: listing.destState,
    country_code: countryCode,

    service_type: serviceType,
    urgency,
    payment_terms: listing.paymentType,
    role_candidates: roleCandidates,
    reputation_signal: null,
    special_requirements: listing.serviceTypes.filter(s => s === 'high pole' || s === 'third car'),

    pricing,
    tags,
    corridor_key: corridorKey,
    route_family_key: routeFamilyKey,

    truncation_flag: false,
    parse_confidence: Math.min(1, Math.round(confidence * 100) / 100),

    board_activity_flag: true,
    availability_assumption: 'likely_not_available',
    volume_signal_weight: listing.status === 'open' ? 0.9 : 0.5,

    same_actor_repeat_same_day: false,
    same_route_repeat_same_day: false,
    timed_post_flag: urgency === 'timed',
    fast_cover_signal: listing.status === 'covered' ? 0.8 : 0,

    is_seed_data: true,
    source_format: 'structured_listing',
  };
}

function inferCountry(o: string | null, d: string | null, hint: string | null): string | null {
  for (const code of [o, d].filter(Boolean) as string[]) {
    if (US_STATES.has(code)) return 'US';
  }
  return hint ?? null;
}
