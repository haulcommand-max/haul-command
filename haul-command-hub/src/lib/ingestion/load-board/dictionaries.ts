/**
 * Haul Command Load Board Ingestion v3 — Parsing Dictionaries
 *
 * All dictionaries are language-extensible and country-agnostic.
 * v3 adds: price detection patterns, route family logic, standard urgency.
 */

import type { ServiceType, UrgencyLevel, PaymentTerm, ActorRole } from './types';

// ─── Service Type Dictionary ─────────────────────────────────────

export const SERVICE_TYPE_MAP: { type: ServiceType; patterns: RegExp[] }[] = [
  {
    type: 'lead',
    patterns: [/\blead\b/i],
  },
  {
    type: 'chase',
    patterns: [/\bchase\b/i],
  },
  {
    type: 'steer',
    patterns: [
      /\bsteer\b/i,
      /\b2\s?hi\s?poles?\b/i,
      /\b2\s?pole\s?cars?\b/i,
      /\bpole\s?and\s?a?\s?chase\s?car\b/i,
    ],
  },
  {
    type: 'route_survey',
    patterns: [/\broute\s?survey\b/i, /\bsurvey\b/i],
  },
  {
    type: 'permit_related',
    patterns: [
      /\bpermit\b/i,
      /\bpermits\b/i,
      /\bpermit\s?solutions?\b/i,
      /\bpermit\s?service\b/i,
    ],
  },
];

// ─── Urgency Dictionary (v3: added 'standard') ──────────────────

export const URGENCY_MAP: { level: UrgencyLevel; patterns: RegExp[] }[] = [
  {
    level: 'immediate',
    patterns: [
      /\basap\b/i,
      /\bneed\s?asap\b/i,
      /\bpilot\s?broke\s?down\b/i,
      /\bimmediately?\b/i,
      /\burgent\b/i,
    ],
  },
  {
    level: 'next_day',
    patterns: [
      /\btomorrow\b/i,
      /\btomorrow\s?morning\b/i,
      /\bnext\s?day\b/i,
    ],
  },
  {
    level: 'timed',
    patterns: [
      /\b\d{1,2}\s?(?:am|pm)\b/i,
      /\bnoon\b/i,
      /[@]\s?\d{1,2}:\d{2}\s?(?:am|pm)?\b/i,
    ],
  },
];

// ─── Payment Dictionary ──────────────────────────────────────────

export const PAYMENT_MAP: { term: PaymentTerm; patterns: RegExp[] }[] = [
  {
    term: 'quick_pay',
    patterns: [/\bQP\b/, /\bquick\s?pay\b/i],
  },
  {
    term: 'cod',
    patterns: [/\bCOD\b/, /\$+COD\$*/, /\bcash\s?on\s?delivery\b/i],
  },
  {
    term: 'efs',
    patterns: [/\bEFS\b/, /\befs\s?code\b/i],
  },
  {
    term: 'cashapp',
    patterns: [/\bcash\s?app\b/i, /\bcashapp\b/i],
  },
  {
    term: 'pay_at_end',
    patterns: [
      /\bpay\s?at\s?end\b/i,
      /\bpaid\s?upon\s?delivery\b/i,
      /\bpay\s?at\s?(?:the\s)?end\s?(?:of\s?load)?\b/i,
    ],
  },
  {
    term: 'text_only',
    patterns: [
      /\bTEXT\s?ONLY\b/,
      /\btext\s?only\b/i,
      /\btext\s?please\b/i,
      /\btext\s?me\b/i,
      /\bplease\s?text\b/i,
    ],
  },
];

// ─── Reputation / Caution Dictionary ─────────────────────────────

export const CAUTION_PATTERNS: RegExp[] = [
  /\bscam(?:mer)?\b/i,
  /\bwon'?t\s?pay\b/i,
  /\bdon'?t\s?pay\b/i,
  /\bdoesn'?t\s?pay\b/i,
  /\bbeware\b/i,
  /\bowes?\s?me\s?money\b/i,
  /\bstiffed\b/i,
  /\brob\s?you\b/i,
  /\bsteals?\s?information\b/i,
  /\bharass?(?:ment)?\b/i,
];

// ─── Role Hint Dictionary ────────────────────────────────────────

export const ROLE_HINT_MAP: { role: ActorRole; patterns: RegExp[] }[] = [
  {
    role: 'dispatcher_role_observed',
    patterns: [
      /\bdispatch\b/i,
    ],
  },
  {
    role: 'broker_role_observed',
    patterns: [
      /\blogistics\b/i,
      /\btransport\b/i,
      /\bfreight\b/i,
      /\bexpress\b/i,
      /\bgroup\b/i,
      /\bservices\b/i,
      /\btrucking\b/i,
      /\bhauling\b/i,
      /\bhaulers?\b/i,
      /\bcarriers?\b/i,
      /\binc\b/i,
      /\bllc\b/i,
    ],
  },
  {
    role: 'pilot_related_actor',
    patterns: [
      /\bpilot\s?car\b/i,
      /\bpcs\b/i,
      /\bescort\b/i,
      /\bflag\s?cars?\b/i,
      /\bpc\b/i,
    ],
  },
  {
    role: 'permit_related_actor',
    patterns: [
      /\bpermits?\b/i,
      /\bpermit\s?solutions?\b/i,
      /\bpermit\s?service\b/i,
    ],
  },
  {
    role: 'hybrid_possible',
    patterns: [
      /\bpilot\s?cars?\s?[&+]\s?permits?\b/i,
      /\bpilot\s?car\s?supply\b/i,
      /\broute\s?one\b/i,
    ],
  },
];

// ─── Line Prefix Patterns ────────────────────────────────────────

export const LINE_PREFIX_PATTERNS: RegExp[] = [
  /^Load\s?Alert!{1,2}/i,
  /^Alert!{1,2}/i,
];

// ─── Date Header Patterns ────────────────────────────────────────

export const DATE_HEADER_PATTERNS: RegExp[] = [
  /^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s*\d{4}\s*$/i,
  /^\d{4}-\d{2}-\d{2}\s*$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}\s*$/,
  /^\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{4}\s*$/i,
];

// ─── Phone Extraction ────────────────────────────────────────────

export const PHONE_PATTERN =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export const PLACEHOLDER_PHONES = new Set([
  '0000000000',
  '1111111111',
  '1234567890',
  '9999999999',
  '6666666666',
]);

// ─── Location Extraction ─────────────────────────────────────────

export const LOCATION_PAIR_PATTERN =
  /([A-Z][a-zA-Z.\s]+?),?\s+([A-Z]{2})\s*(?:to|[-–→>])\s*([A-Z][a-zA-Z.\s]+?),?\s+([A-Z]{2})/;

export const SINGLE_LOCATION_PATTERN = /([A-Z][a-zA-Z.\s]+?),?\s+([A-Z]{2})/g;

// ─── Truncation Detection ────────────────────────────────────────

export const TRUNCATION_INDICATORS = [/\.\.\.$/, /…$/, /\.\.$/];

// ─── Name / Company Prefix Extraction ────────────────────────────

export const COMPANY_SUFFIXES = [
  'LLC', 'Inc', 'Corp', 'Co', 'Ltd', 'Group', 'Services', 'Solutions',
  'Transport', 'Logistics', 'Express', 'Dispatch', 'Trucking', 'Hauling',
];

// ─── Price Detection (v3 patch: hardened) ────────────────────────

// Matches dollar amounts: "$500", "$1,200", "$2500.00", "$250"
export const PRICE_AMOUNT_PATTERN =
  /\$\s?([\d,]+(?:\.\d{1,2})?)/g;

// Matches rate language: "$2.50/mile", "250/mi", "$3 per mile", "$1.70/mi"
export const RATE_PER_MILE_PATTERN =
  /\$?\s?([\d.]+)\s*(?:\/\s*(?:mile|mi)|per\s*mile)/gi;

// Matches "total" syntax: "250 total", "550 total", "$600 total"
export const TOTAL_PRICE_PATTERN =
  /\$?\s?([\d,]+(?:\.\d{1,2})?)\s*(?:total|flat)/gi;

// Matches miles: "450 miles", "320 mi", "200 miles"
export const MILES_PATTERN =
  /(\d[\d,]*)\s*(?:miles?|mi)\b/gi;

// ─── Route Family Logic (v3) ─────────────────────────────────────
// Groups adjacent admin divisions into broader corridor families.

const ROUTE_FAMILIES: Record<string, string[]> = {
  'TX_SOUTH': ['TX'],
  'TX_OK': ['TX', 'OK'],
  'TX_NM': ['TX', 'NM'],
  'CA_NV': ['CA', 'NV'],
  'CA_AZ': ['CA', 'AZ'],
  'FL_GA': ['FL', 'GA'],
  'OH_PA': ['OH', 'PA'],
  'IL_IN': ['IL', 'IN'],
  'NY_NJ': ['NY', 'NJ'],
  'WA_OR': ['WA', 'OR'],
  'AB_BC': ['AB', 'BC'],
  'ON_QC': ['ON', 'QC'],
};

export function getRouteFamilyKey(origin: string, dest: string): string | null {
  for (const [family, members] of Object.entries(ROUTE_FAMILIES)) {
    if (members.includes(origin) && members.includes(dest)) {
      return family;
    }
  }
  // Generic family: origin_dest sorted alphabetically
  const sorted = [origin, dest].sort();
  return `${sorted[0]}_${sorted[1]}`;
}
