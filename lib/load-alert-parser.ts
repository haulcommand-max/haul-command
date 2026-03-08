/**
 * Load Alert Parser
 * 
 * Parses raw load board alert text into structured load demand signals.
 * Format: "Load Alert!! [Company] [Phone] [Origin City] [Origin State] [Dest City] [Dest State] [Position]"
 * 
 * Position types:
 *   P = Pilot (Lead car)
 *   Chase = Chase car (rear escort)
 *   Lead = Lead car
 *   C = Chase (abbreviated)
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
    position_type: 'pilot' | 'chase' | 'lead' | 'unknown';
    rate_amount: number | null;
    parsed_at: string;
    source: string;
    /** MD5-style dedup key */
    dedup_key: string;
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
    return 'unknown';
}

function generateDedupKey(company: string, phone: string, origin: string, dest: string): string {
    const key = `${company.toLowerCase().trim()}|${phone}|${origin.toLowerCase()}|${dest.toLowerCase()}`;
    // Simple hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const chr = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function parseLoadAlert(line: string): ParsedLoadAlert | null {
    // Remove "Load Alert!! " prefix
    let text = line.replace(/^Load Alert!!\s*/i, '').trim();

    // Remove trailing ellipsis / truncation
    text = text.replace(/\.{2,}$/, '').trim();

    // Extract rate if present (e.g., "$600")
    let rateAmount: number | null = null;
    const rateMatch = text.match(/\$(\d+(?:\.\d{2})?)/);
    if (rateMatch) {
        rateAmount = parseFloat(rateMatch[1]);
        text = text.replace(rateMatch[0], '').trim();
    }

    // Extract phone number (various formats: 9092527549, 909 436 4220, 479-928-5524, 440-299-3313)
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

    // Company name is everything before the phone
    const companyName = text.substring(0, phoneIndex).trim();

    // Everything after the phone is location + position
    const afterPhone = text.substring(phoneIndex + phoneLength).trim();

    // Find position type at the end
    const positionPatterns = [
        /\s+(Chase|Lead|Pilot|P|C)\s*$/i,
    ];

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

    // If position was truncated (ends with C... or P...), try to detect
    if (positionType === 'unknown') {
        if (afterPhone.endsWith('C') || afterPhone.match(/C\.{0,3}$/)) {
            positionType = 'chase';
            locationPart = afterPhone.replace(/C\.{0,3}$/, '').trim();
        } else if (afterPhone.endsWith('P')) {
            positionType = 'pilot';
            locationPart = afterPhone.replace(/P$/, '').trim();
        }
    }

    // Parse origin and destination from location part
    // Strategy: find state codes and use them as boundaries
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
        // First state code = origin state, everything before it = origin city
        const firstStateIdx = statePositions[0];
        const secondStateIdx = statePositions[statePositions.length >= 2 ? 1 : statePositions.length - 1];

        originCity = words.slice(0, firstStateIdx).join(' ');
        originState = words[firstStateIdx].toUpperCase();
        destCity = words.slice(firstStateIdx + 1, secondStateIdx).join(' ');
        destState = words[secondStateIdx].toUpperCase();
    } else if (statePositions.length === 1) {
        // Only one state found — use it as origin
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
        parsed_at: new Date().toISOString(),
        source: 'load_board_alert',
        dedup_key: generateDedupKey(companyName, normalizePhone(phone), `${originCity} ${originState}`, `${destCity} ${destState}`),
    };
}

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
    };
} {
    const lines = text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('Load Alert!!'));

    const parsed: ParsedLoadAlert[] = [];
    const failed: string[] = [];

    for (const line of lines) {
        const result = parseLoadAlert(line);
        if (result) {
            parsed.push(result);
        } else {
            failed.push(line);
        }
    }

    // Stats
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
            total: lines.length,
            parsed: parsed.length,
            failed: failed.length,
            uniqueBrokers,
            uniqueCorridors,
            positionBreakdown,
        },
    };
}
