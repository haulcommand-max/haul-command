/**
 * Load Alert Parser — V2 (Unified)
 * 
 * Handles TWO load board formats:
 * 
 * Format A (Legacy): Single-line alerts
 *   "Load Alert!! [Company] [Phone] [Origin] [Dest] [Position]"
 * 
 * Format B (Structured): Multi-line board entries
 *   COMPANY_NAME -  ID Verified
 *   Recent
 *   Open
 *   Origin City, Origin State, USADest City, Dest State, USA
 *   Est. XXX mi
 *   $XXXX.XX (total)
 *   Quick Pay
 *   (XXX) XXX-XXXX [Text Only]
 *   MM/DD/YYYY
 *   X minutes/hours ago
 *   Position Type
 * 
 * Both produce the same ParsedLoadAlert output for downstream consistency.
 */

export interface ParsedLoadAlert {
    raw: string;
    company_name: string;
    phone: string;
    phone_normalized: string;
    origin_city: string;
    origin_state: string;
    destination_city: string;
    destination_state: string;
    position_type: 'pilot' | 'chase' | 'lead' | 'high_pole' | 'unknown';
    rate_amount: number | null;
    rate_type: 'total' | 'per_mile' | 'contact' | null;
    parsed_at: string;
    source: string;
    /** MD5-style dedup key */
    dedup_key: string;
    /** Extended fields from structured format */
    is_verified: boolean;
    is_quick_pay: boolean;
    estimated_miles: number | null;
    recency_label: string | null;
    move_date: string | null;
    text_only: boolean;
    status: 'open' | 'closed' | 'unknown';
}

// US state/province codes for boundary detection
const STATE_CODES = new Set([
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
    'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
    // Canadian provinces
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
}

function normalizePosition(pos: string): ParsedLoadAlert['position_type'] {
    const p = pos.trim().toLowerCase();
    if (p === 'p' || p === 'pilot') return 'pilot';
    if (p === 'c' || p.startsWith('chase')) return 'chase';
    if (p === 'l' || p.startsWith('lead')) return 'lead';
    if (p.includes('high pole') || p.includes('high_pole') || p === 'high pole') return 'high_pole';
    return 'unknown';
}

function generateDedupKey(company: string, phone: string, origin: string, dest: string): string {
    const key = `${company.toLowerCase().trim()}|${phone}|${origin.toLowerCase()}|${dest.toLowerCase()}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const chr = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

/* ══════════════════════════════════════════════════════════
   Format A: Legacy single-line "Load Alert!!" parser
   ══════════════════════════════════════════════════════════ */

export function parseLoadAlertLegacy(line: string): ParsedLoadAlert | null {
    let text = line.replace(/^Load Alert!!\s*/i, '').trim();
    text = text.replace(/\.{2,}$/, '').trim();

    let rateAmount: number | null = null;
    const rateMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (rateMatch) {
        rateAmount = parseFloat(rateMatch[1]);
        text = text.replace(rateMatch[0], '').trim();
    }

    const phonePatterns = [
        /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/,
        /(\d{10})/,
    ];

    let phone = '';
    let phoneIndex = -1;
    let phoneLength = 0;

    for (const pattern of phonePatterns) {
        const match = text.match(pattern);
        if (match && match.index !== undefined) {
            phone = match[1];
            phoneIndex = match.index;
            phoneLength = match[0].length;
            break;
        }
    }

    if (!phone || phoneIndex === -1) return null;

    const companyName = text.substring(0, phoneIndex).trim();
    const afterPhone = text.substring(phoneIndex + phoneLength).trim();

    const positionPatterns = [/\s+(Chase|Lead|Pilot|High Pole|P|C)\s*$/i];
    let positionType: ParsedLoadAlert['position_type'] = 'unknown';
    let locationPart = afterPhone;

    for (const pattern of positionPatterns) {
        const match = afterPhone.match(pattern);
        if (match) {
            positionType = normalizePosition(match[1]);
            locationPart = afterPhone.substring(0, match.index!).trim();
            break;
        }
    }

    if (positionType === 'unknown') {
        if (afterPhone.endsWith('C') || afterPhone.match(/C\.{0,3}$/)) {
            positionType = 'chase';
            locationPart = afterPhone.replace(/C\.{0,3}$/, '').trim();
        } else if (afterPhone.endsWith('P')) {
            positionType = 'pilot';
            locationPart = afterPhone.replace(/P$/, '').trim();
        }
    }

    const words = locationPart.split(/\s+/);
    const statePositions: number[] = [];
    for (let i = 0; i < words.length; i++) {
        if (STATE_CODES.has(words[i].toUpperCase())) {
            statePositions.push(i);
        }
    }

    let originCity = '';
    let originState = '';
    let destCity = '';
    let destState = '';

    if (statePositions.length >= 2) {
        const firstStateIdx = statePositions[0];
        const secondStateIdx = statePositions[1];
        originCity = words.slice(0, firstStateIdx).join(' ');
        originState = words[firstStateIdx].toUpperCase();
        destCity = words.slice(firstStateIdx + 1, secondStateIdx).join(' ');
        destState = words[secondStateIdx].toUpperCase();
    } else if (statePositions.length === 1) {
        const idx = statePositions[0];
        originCity = words.slice(0, idx).join(' ');
        originState = words[idx].toUpperCase();
        destCity = words.slice(idx + 1).join(' ');
    }

    if (!companyName) return null;

    return {
        raw: line,
        company_name: companyName.replace(/[()]/g, '').trim(),
        phone,
        phone_normalized: normalizePhone(phone),
        origin_city: originCity,
        origin_state: originState,
        destination_city: destCity,
        destination_state: destState,
        position_type: positionType,
        rate_amount: rateAmount,
        rate_type: rateAmount ? 'total' : null,
        parsed_at: new Date().toISOString(),
        source: 'load_board_alert',
        dedup_key: generateDedupKey(companyName, normalizePhone(phone), `${originCity} ${originState}`, `${destCity} ${destState}`),
        is_verified: false,
        is_quick_pay: false,
        estimated_miles: null,
        recency_label: null,
        move_date: null,
        text_only: false,
        status: 'unknown',
    };
}

/* ══════════════════════════════════════════════════════════
   Format B: Structured multi-line load board entry parser
   Input: block of text representing one load entry
   ══════════════════════════════════════════════════════════ */

export function parseStructuredLoad(block: string): ParsedLoadAlert | null {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) return null;

    // Line 0: "COMPANY NAME -  ID Verified" or just "COMPANY NAME"
    const companyLine = lines[0];
    const isVerified = /ID\s*Verified/i.test(companyLine);
    const companyName = companyLine.replace(/-\s*ID\s*Verified/i, '').trim();

    // Scan for known fields
    let status: ParsedLoadAlert['status'] = 'unknown';
    let phone = '';
    let textOnly = false;
    let rateAmount: number | null = null;
    let rateType: ParsedLoadAlert['rate_type'] = null;
    let isQuickPay = false;
    let estimatedMiles: number | null = null;
    let recencyLabel: string | null = null;
    let moveDate: string | null = null;
    let positionType: ParsedLoadAlert['position_type'] = 'unknown';
    let originCity = '';
    let originState = '';
    let destCity = '';
    let destState = '';

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        // Status
        if (/^Open$/i.test(line)) { status = 'open'; continue; }
        if (/^Closed$/i.test(line)) { status = 'closed'; continue; }
        if (/^Recent$/i.test(line)) continue; // Skip "Recent" label

        // Quick Pay
        if (/^Quick\s*Pay$/i.test(line)) { isQuickPay = true; continue; }

        // Phone: (XXX) XXX-XXXX or similar
        const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
            phone = phoneMatch[0];
            textOnly = /Text\s*Only/i.test(line);
            continue;
        }

        // Rate: $XXXX.XX (total) or "Contact for rate"
        if (/^Contact for rate$/i.test(line)) { rateType = 'contact'; continue; }
        const dollarMatch = line.match(/^\$([0-9,]+(?:\.\d{2})?)\s*\(?(total|per\s*mile)?\)?/i);
        if (dollarMatch) {
            rateAmount = parseFloat(dollarMatch[1].replace(/,/g, ''));
            rateType = dollarMatch[2]?.toLowerCase().includes('mile') ? 'per_mile' : 'total';
            continue;
        }

        // Estimated miles: "Est. XXX mi"
        const milesMatch = line.match(/^Est\.\s*([0-9,]+)\s*mi$/i);
        if (milesMatch) {
            estimatedMiles = parseInt(milesMatch[1].replace(/,/g, ''), 10);
            continue;
        }

        // Date: MM/DD/YYYY
        const dateMatch = line.match(/^\d{2}\/\d{2}\/\d{4}$/);
        if (dateMatch) { moveDate = line; continue; }

        // Recency: "17 minutes ago", "about 2 hours ago"
        if (/\d+\s*(minutes?|hours?|days?)\s*ago/i.test(line) || /^about\s+\d+/i.test(line)) {
            recencyLabel = line;
            continue;
        }

        // Position type: Chase, Pilot, Lead, High Pole
        if (/^(Chase|Pilot|Lead|High\s*Pole)$/i.test(line)) {
            positionType = normalizePosition(line);
            continue;
        }

        // Route: "City, STATE, USACity, STATE, USA" (concatenated)
        const routeMatch = line.match(/^(.+?),\s*([A-Z]{2}),\s*USA\s*(.+?),\s*([A-Z]{2}),\s*USA$/i);
        if (routeMatch) {
            originCity = routeMatch[1].trim();
            originState = routeMatch[2].toUpperCase();
            destCity = routeMatch[3].trim();
            destState = routeMatch[4].toUpperCase();
            continue;
        }

        // Route variant: "City, STATE" separated by newline (next line is dest)
        const cityStateMatch = line.match(/^(.+?),\s*([A-Z]{2})(?:,\s*USA)?$/i);
        if (cityStateMatch && !originCity) {
            originCity = cityStateMatch[1].trim();
            originState = cityStateMatch[2].toUpperCase();
            continue;
        } else if (cityStateMatch && originCity && !destCity) {
            destCity = cityStateMatch[1].trim();
            destState = cityStateMatch[2].toUpperCase();
            continue;
        }
    }

    if (!companyName || !phone) return null;

    return {
        raw: block,
        company_name: companyName,
        phone,
        phone_normalized: normalizePhone(phone),
        origin_city: originCity,
        origin_state: originState,
        destination_city: destCity,
        destination_state: destState,
        position_type: positionType,
        rate_amount: rateAmount,
        rate_type: rateType,
        parsed_at: new Date().toISOString(),
        source: 'structured_load_board',
        dedup_key: generateDedupKey(companyName, normalizePhone(phone), `${originCity} ${originState}`, `${destCity} ${destState}`),
        is_verified: isVerified,
        is_quick_pay: isQuickPay,
        estimated_miles: estimatedMiles,
        recency_label: recencyLabel,
        move_date: moveDate,
        text_only: textOnly,
        status,
    };
}

/* ══════════════════════════════════════════════════════════
   Unified entry point — auto-detects format
   ══════════════════════════════════════════════════════════ */

/** Parse a single line (legacy) or structured block */
export function parseLoadAlert(input: string): ParsedLoadAlert | null {
    if (input.trim().startsWith('Load Alert!!')) {
        return parseLoadAlertLegacy(input);
    }
    return parseStructuredLoad(input);
}

/** 
 * Parse a full paste/text blob. 
 * Auto-detects whether it's legacy (line-by-line) or structured (block-by-block).
 */
export function parseLoadAlertBatch(text: string): {
    parsed: ParsedLoadAlert[];
    failed: string[];
    stats: {
        total: number;
        parsed: number;
        failed: number;
        uniqueBrokers: number;
        uniqueCorridors: number;
        positionBreakdown: Record<string, number>;
        formatBreakdown: { legacy: number; structured: number };
    };
} {
    const hasLegacyFormat = text.includes('Load Alert!!');

    let entries: string[];

    if (hasLegacyFormat) {
        // Legacy: split by lines, filter to Load Alert!! lines
        entries = text
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('Load Alert!!'));
    } else {
        // Structured: split into blocks by company headers
        //   A company header line contains "ID Verified" or is followed by "Recent"/"Open"
        const lines = text.split('\n');
        entries = [];
        let currentBlock: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Detect new block start: company line typically has "ID Verified" 
            // OR the next line after it says "Recent"
            const isNewEntry = /ID\s*Verified/i.test(line) ||
                (i + 1 < lines.length && /^Recent$/i.test(lines[i + 1].trim()) && !currentBlock.some(l => /^Recent$/i.test(l)));

            if (isNewEntry && currentBlock.length > 0) {
                entries.push(currentBlock.join('\n'));
                currentBlock = [];
            }
            currentBlock.push(line);
        }
        if (currentBlock.length > 0) {
            entries.push(currentBlock.join('\n'));
        }
    }

    const parsed: ParsedLoadAlert[] = [];
    const failed: string[] = [];
    let legacyCount = 0;
    let structuredCount = 0;

    for (const entry of entries) {
        const result = parseLoadAlert(entry);
        if (result) {
            parsed.push(result);
            if (result.source === 'load_board_alert') legacyCount++;
            else structuredCount++;
        } else {
            failed.push(entry);
        }
    }

    const uniqueBrokers = new Set(parsed.map(p => p.phone_normalized)).size;
    const uniqueCorridors = new Set(
        parsed.filter(p => p.origin_state && p.destination_state)
            .map(p => `${p.origin_state}-${p.destination_state}`)
    ).size;

    const positionBreakdown: Record<string, number> = {};
    for (const p of parsed) {
        positionBreakdown[p.position_type] = (positionBreakdown[p.position_type] || 0) + 1;
    }

    return {
        parsed,
        failed,
        stats: {
            total: entries.length,
            parsed: parsed.length,
            failed: failed.length,
            uniqueBrokers,
            uniqueCorridors,
            positionBreakdown,
            formatBreakdown: { legacy: legacyCount, structured: structuredCount },
        },
    };
}
