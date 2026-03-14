/**
 * lib/ingestion/line-parser.ts
 *
 * Per-line parser for historical market observation text.
 * Implements the parsing_rules and normalization sections of the spec.
 * Global-first: no US-only logic, country-agnostic phone + location parsing.
 */

import type {
    ParsedLine,
    ServiceType,
    Urgency,
    PaymentTerms,
    RoleCandidate,
    ReputationSignal,
} from "./types";

// ════════════════════════════════════════════════════════════════
// DICTIONARIES (from spec)
// ════════════════════════════════════════════════════════════════

const SERVICE_TYPE_MAP: Array<[RegExp, ServiceType]> = [
    [/\b(route\s*survey|survey)\b/i, "route_survey"],
    [/\b(2\s*hi\s*poles?|pole\s*(and\s*a\s*)?chase|steer|2\s*pole\s*cars?)\b/i, "steer"],
    [/\bchase\b/i, "chase"],
    [/\b(lead\s*(car)?)\b/i, "lead"],
    [/\b(permit\s*(solutions?|service)?|permits?)\b/i, "permit_related"],
];

const URGENCY_MAP: Array<[RegExp, Urgency]> = [
    [/\b(ASAP|need\s*asap|pilot\s*broke\s*down)\b/i, "immediate"],
    [/\b(tomorrow\s*(morning)?)\b/i, "next_day"],
    [/\b(\d{1,2}\s*[ap]m|noon|@\s*\d{1,2}:\d{2}\s*[ap]m)\b/i, "timed"],
];

const PAYMENT_MAP: Array<[RegExp, PaymentTerms]> = [
    [/\b(QP|quick\s*pay)\b/i, "quick_pay"],
    [/\b(COD|\$+COD\$?|cash\s*on\s*delivery)\b/i, "cod"],
    [/\b(EFS\s*(code)?)\b/i, "efs"],
    [/\b(cash\s*app|cashapp)\b/i, "cashapp"],
    [/\b(pay\s*at\s*(the\s*)?(end|delivery)|paid\s*upon\s*delivery)\b/i, "pay_at_end"],
    [/\b(TEXT\s*ONLY|text\s*only|text\s*please|text\s*me\s*pls|please\s*text)\b/i, "text_only"],
];

const ROLE_HINT_MAP: Array<[RegExp, RoleCandidate]> = [
    [/\b(pilot\s*car[s]?\s*&\s*permit|pilot\s*car\s*supply)\b/i, "pilot_permit_hybrid"],
    [/\b(pilot\s*car[s]?|pcs|escort|flag\s*car[s]?|pc\b)/i, "pilot_car_operator"],
    [/\b(dispatch|logistics|transport|freight|express|services?)\b/i, "broker"],
    [/\b(permits?|permit\s*(solutions?|service))\b/i, "permit_company"],
];

const CAUTION_TERMS = [
    /\bscam(mer)?\b/i,
    /\bwon'?t\s*pay\b/i,
    /\bdon'?t\s*pay\b/i,
    /\bdoes(n'?t)?\s*pay\b/i,
    /\bbeware\b/i,
    /\bowes?\s*me\s*money\b/i,
    /\bstiff(ed|s)?\b/i,
    /\brob\s*you\b/i,
    /\bsteals?\s*information\b/i,
];

const PLACEHOLDER_PHONES = new Set([
    "0000000000", "1111111111", "1234567890",
    "9999999999", "6666666666",
]);

const ALERT_PREFIXES = /^(Load\s*Alert\s*!+|Alert\s*!+)\s*/i;

// ════════════════════════════════════════════════════════════════
// PHONE PARSING
// ════════════════════════════════════════════════════════════════

const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export function extractPhones(text: string): string[] {
    return (text.match(PHONE_REGEX) || []).map((p) => p.trim());
}

export function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
}

export function isPlaceholderPhone(normalized: string): boolean {
    return PLACEHOLDER_PHONES.has(normalized) || normalized.length < 7;
}

// ════════════════════════════════════════════════════════════════
// LOCATION PARSING
// ════════════════════════════════════════════════════════════════

// Matches patterns like "City, ST" or "City ST" or "City, State"
const LOCATION_PAIR_REGEX =
    /([A-Z][a-zA-Z\s.']+),?\s*([A-Z]{2})\s*(?:to|[-–—>→]|thru)\s*([A-Z][a-zA-Z\s.']+),?\s*([A-Z]{2})/i;

const SINGLE_LOCATION_REGEX = /([A-Z][a-zA-Z\s.']+),?\s*([A-Z]{2})\b/gi;

export interface LocationPair {
    origin_raw: string;
    origin_city: string;
    origin_region: string;
    destination_raw: string;
    destination_city: string;
    destination_region: string;
}

export function extractLocationPair(text: string): LocationPair | null {
    const match = text.match(LOCATION_PAIR_REGEX);
    if (match) {
        return {
            origin_raw: `${match[1].trim()}, ${match[2].trim()}`,
            origin_city: match[1].trim(),
            origin_region: match[2].trim().toUpperCase(),
            destination_raw: `${match[3].trim()}, ${match[4].trim()}`,
            destination_city: match[3].trim(),
            destination_region: match[4].trim().toUpperCase(),
        };
    }
    return null;
}

export function extractSingleLocations(text: string): Array<{ city: string; region: string; raw: string }> {
    const results: Array<{ city: string; region: string; raw: string }> = [];
    let match;
    const regex = new RegExp(SINGLE_LOCATION_REGEX.source, "gi");
    while ((match = regex.exec(text)) !== null) {
        results.push({
            city: match[1].trim(),
            region: match[2].trim().toUpperCase(),
            raw: match[0].trim(),
        });
    }
    return results;
}

// ════════════════════════════════════════════════════════════════
// NAME / COMPANY EXTRACTION
// ════════════════════════════════════════════════════════════════

// Attempts to extract name/company from the beginning of a line after stripping alert prefix
export function extractNameOrCompany(text: string): string | null {
    const cleaned = text.replace(ALERT_PREFIXES, "").trim();

    // Pattern: line beginning with a name/company followed by phone or dash
    const nameMatch = cleaned.match(
        /^([A-Z][a-zA-Z\s.'&\-]{2,40})(?:\s*[-:–—]|\s+\d{3}[-.\s]?\d{3}|\s+\(?\d{3}\)?)/
    );
    if (nameMatch) return nameMatch[1].trim();

    // Pattern: quoted name
    const quotedMatch = cleaned.match(/^["']([^"']+)["']/);
    if (quotedMatch) return quotedMatch[1].trim();

    return null;
}

// ════════════════════════════════════════════════════════════════
// MAIN LINE PARSER
// ════════════════════════════════════════════════════════════════

export function parseLine(
    rawLine: string,
    activeDate: string,
    dateConfident: boolean,
    countryHint: string | null
): ParsedLine {
    const line = rawLine.trim();
    let confidence = 0.5;

    // Strip alert prefix
    const cleaned = line.replace(ALERT_PREFIXES, "").trim();

    // Service type
    let serviceType: ServiceType = "unknown";
    for (const [pattern, svc] of SERVICE_TYPE_MAP) {
        if (pattern.test(cleaned)) {
            serviceType = svc;
            confidence += 0.05;
            break;
        }
    }

    // Urgency
    let urgency: Urgency = "unknown";
    for (const [pattern, urg] of URGENCY_MAP) {
        if (pattern.test(cleaned)) {
            urgency = urg;
            confidence += 0.03;
            break;
        }
    }

    // Payment terms
    let paymentTerms: PaymentTerms = "unknown";
    for (const [pattern, pay] of PAYMENT_MAP) {
        if (pattern.test(cleaned)) {
            paymentTerms = pay;
            confidence += 0.03;
            break;
        }
    }

    // Role candidates
    const roleCandidates: RoleCandidate[] = [];
    for (const [pattern, role] of ROLE_HINT_MAP) {
        if (pattern.test(cleaned) && !roleCandidates.includes(role)) {
            roleCandidates.push(role);
        }
    }
    if (roleCandidates.length === 0) roleCandidates.push("unknown_market_actor");

    // Reputation signal
    let reputationSignal: ReputationSignal = "none";
    let reputationText: string | null = null;
    for (const pattern of CAUTION_TERMS) {
        if (pattern.test(cleaned)) {
            reputationSignal = "caution";
            reputationText = cleaned;
            break;
        }
    }

    // Phone extraction
    const phones = extractPhones(cleaned);
    const rawPhone = phones[0] || null;
    const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;
    const phoneIsPlaceholder = normalizedPhone ? isPlaceholderPhone(normalizedPhone) : false;
    if (rawPhone) confidence += 0.1;

    // Name / company
    const nameOrCompany = extractNameOrCompany(line);
    if (nameOrCompany) confidence += 0.1;

    // Location extraction
    const locPair = extractLocationPair(cleaned);
    const singleLocs = locPair ? [] : extractSingleLocations(cleaned);
    if (locPair) confidence += 0.15;
    else if (singleLocs.length >= 2) confidence += 0.1;

    // Truncation detection
    const truncationFlag = cleaned.endsWith("...") || cleaned.endsWith("…") || cleaned.length > 200;

    // Special requirements
    const specialReqs: string[] = [];
    if (/\b(oversize|over\s*size|OS)\b/i.test(cleaned)) specialReqs.push("oversize");
    if (/\b(super\s*load|superload)\b/i.test(cleaned)) specialReqs.push("superload");
    if (/\b(wide\s*load)\b/i.test(cleaned)) specialReqs.push("wide_load");
    if (/\b(height\s*pole|hi\s*pole|high\s*pole)\b/i.test(cleaned)) specialReqs.push("height_pole");

    // Clamp confidence
    confidence = Math.min(1.0, Math.max(0.0, confidence));

    return {
        raw_line: rawLine,
        observed_date: activeDate,
        date_confident: dateConfident,
        parsed_name_or_company: nameOrCompany,
        raw_phone: rawPhone,
        normalized_phone: normalizedPhone,
        phone_is_placeholder: phoneIsPlaceholder,
        origin_raw: locPair?.origin_raw ?? singleLocs[0]?.raw ?? null,
        origin_city: locPair?.origin_city ?? singleLocs[0]?.city ?? null,
        origin_region: locPair?.origin_region ?? singleLocs[0]?.region ?? null,
        origin_country: countryHint,
        destination_raw: locPair?.destination_raw ?? singleLocs[1]?.raw ?? null,
        destination_city: locPair?.destination_city ?? singleLocs[1]?.city ?? null,
        destination_region: locPair?.destination_region ?? singleLocs[1]?.region ?? null,
        destination_country: countryHint,
        service_type: serviceType,
        urgency,
        payment_terms: paymentTerms,
        role_candidates: roleCandidates,
        reputation_signal: reputationSignal,
        reputation_text: reputationText,
        truncation_flag: truncationFlag,
        parse_confidence: Math.round(confidence * 100) / 100,
        special_requirements: specialReqs.length > 0 ? specialReqs.join(", ") : null,
        country_code_if_known: countryHint,
    };
}

// ════════════════════════════════════════════════════════════════
// DATE HEADER DETECTION
// ════════════════════════════════════════════════════════════════

const DATE_HEADER_PATTERNS = [
    // "March 13, 2026" or "Mar 13, 2026"
    /^([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})\s*$/,
    // "3/13/2026" or "03-13-2026"
    /^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*$/,
    // "2026-03-13"
    /^(\d{4}-\d{2}-\d{2})\s*$/,
    // "Monday, March 13"
    /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+[A-Z][a-z]+\.?\s+\d{1,2}(?:,?\s+\d{4})?)\s*$/i,
];

export function detectDateHeader(line: string): string | null {
    const trimmed = line.trim();
    for (const pattern of DATE_HEADER_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
            try {
                const d = new Date(match[1]);
                if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
            } catch {
                // fallback: return raw
            }
            return match[1];
        }
    }
    return null;
}

// ════════════════════════════════════════════════════════════════
// BATCH SPLITTER
// ════════════════════════════════════════════════════════════════

export interface SplitResult {
    observations: Array<{ line: string; date: string; dateConfident: boolean }>;
    unparsedLines: string[];
}

export function splitBatchText(
    rawText: string,
    batchDate: string | null
): SplitResult {
    const lines = rawText.split(/\r?\n/);
    const fallbackDate = batchDate || new Date().toISOString().split("T")[0];

    let activeDate = fallbackDate;
    let dateConfident = !!batchDate;

    const observations: SplitResult["observations"] = [];
    const unparsedLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for date header
        const headerDate = detectDateHeader(trimmed);
        if (headerDate) {
            activeDate = headerDate;
            dateConfident = true;
            continue;
        }

        // Classify: is it parseable as an observation?
        const hasContent =
            trimmed.length > 10 &&
            (ALERT_PREFIXES.test(trimmed) ||
                /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(trimmed) ||
                /\b(need|looking|load|pilot|escort|chase|lead)\b/i.test(trimmed) ||
                /[A-Z][a-z]+,?\s*[A-Z]{2}\b/.test(trimmed));

        if (hasContent) {
            observations.push({ line: trimmed, date: activeDate, dateConfident });
        } else if (trimmed.length > 5) {
            unparsedLines.push(trimmed);
        }
    }

    return { observations, unparsedLines };
}
