// lib/intelligence/social-classifier.ts
//
// Haul Command — Social Intelligence AI Classifier
// Version: social_intent_v1
// Principle: opt_in_only_compliant_growth
//
// Classifies imported social posts into intent categories with
// entity extraction. Rule-based classifier with weighted signals.
// Future: swap for ML model via model_version field.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type IntentClass = 'escort_needed' | 'driver_available' | 'broker_offer' | 'dispute_signal' | 'equipment_sale' | 'general_chat';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ClassificationResult {
    intent_class: IntentClass;
    confidence: number;
    secondary_intents: { class: IntentClass; confidence: number }[];

    // Entity extraction
    origin_city?: string;
    origin_state?: string;
    destination_city?: string;
    destination_state?: string;
    load_type?: string;
    urgency_level?: UrgencyLevel;
    escort_count?: number;
    contact_present: boolean;
    extracted_phone?: string;
    extracted_email?: string;
    estimated_date?: string;
    equipment_type?: string;
    rate_mentioned?: number;

    extraction_quality: number;
}

// ============================================================
// INTENT KEYWORD SIGNALS
// ============================================================

const INTENT_SIGNALS: Record<IntentClass, { keywords: string[]; weight: number }[]> = {
    escort_needed: [
        { keywords: ['need escort', 'need pilot car', 'looking for pilot', 'need flag car', 'need a lead'], weight: 0.90 },
        { keywords: ['escort needed', 'pilot car needed', 'looking for escort', 'who can run'], weight: 0.85 },
        { keywords: ['oversize', 'wide load', 'over dimensional', 'heavy haul', 'superload'], weight: 0.40 },
        { keywords: ['asap', 'today', 'tomorrow', 'urgent', 'immediately', 'last minute'], weight: 0.30 },
        { keywords: ['from', 'to', 'heading', 'going', 'running'], weight: 0.15 },
    ],
    driver_available: [
        { keywords: ['available', 'open', 'free to run', 'looking for work', 'can run'], weight: 0.80 },
        { keywords: ['pilot car available', 'escort available', 'flag car available'], weight: 0.90 },
        { keywords: ['will run', 'can do', 'accepting loads', 'seeking loads'], weight: 0.75 },
        { keywords: ['my area', 'based in', 'located in', 'home base'], weight: 0.30 },
    ],
    broker_offer: [
        { keywords: ['paying', 'rate is', 'offering', 'budget', 'per mile'], weight: 0.80 },
        { keywords: ['broker', 'load available', 'have a load', 'posting a load', 'direct shipper'], weight: 0.85 },
        { keywords: ['detention', 'deadhead', 'layover', 'multistop'], weight: 0.35 },
        { keywords: ['$', 'usd', 'cad'], weight: 0.25 },
    ],
    dispute_signal: [
        { keywords: ['didn\'t pay', 'no payment', 'scam', 'fraud', 'stiffed', 'ghosted'], weight: 0.90 },
        { keywords: ['beware', 'warning', 'avoid', 'don\'t work with', 'bad experience'], weight: 0.80 },
        { keywords: ['dispute', 'complaint', 'issue with', 'problem with'], weight: 0.70 },
        { keywords: ['lawyer', 'legal', 'small claims', 'report'], weight: 0.40 },
    ],
    equipment_sale: [
        { keywords: ['for sale', 'selling', 'wts', 'asking', 'make offer'], weight: 0.85 },
        { keywords: ['height pole', 'amber lights', 'led board', 'oversize signs', 'flags'], weight: 0.60 },
        { keywords: ['truck', 'trailer', 'vehicle', 'car', 'suv'], weight: 0.30 },
        { keywords: ['miles', 'year', 'condition', 'obo'], weight: 0.25 },
    ],
    general_chat: [
        { keywords: ['anyone', 'question', 'how do', 'what is', 'does anyone know'], weight: 0.50 },
        { keywords: ['regulations', 'permits', 'dot', 'cdl', 'requirements'], weight: 0.35 },
        { keywords: ['weather', 'road', 'traffic', 'construction', 'detour'], weight: 0.30 },
    ],
};

// ============================================================
// US STATE ABBREVIATIONS FOR EXTRACTION
// ============================================================

const US_STATES: Record<string, string> = {
    alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
    colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
    hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
    kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
    massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
    montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
    ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
    'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
    utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
    wisconsin: 'WI', wyoming: 'WY',
};

const STATE_ABBREVS = new Set(Object.values(US_STATES));

// ============================================================
// ENTITY EXTRACTION
// ============================================================

function extractEntities(text: string): Partial<ClassificationResult> {
    const lower = text.toLowerCase();
    const result: Partial<ClassificationResult> = { contact_present: false };

    // ── Phone extraction ──
    const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    if (phoneMatch) {
        result.extracted_phone = phoneMatch[0];
        result.contact_present = true;
    }

    // ── Email extraction ──
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        result.extracted_email = emailMatch[0];
        result.contact_present = true;
    }

    // ── Rate extraction ──
    const rateMatch = text.match(/\$\s*(\d{1,4}(?:\.\d{2})?)/);
    if (rateMatch) {
        result.rate_mentioned = parseFloat(rateMatch[1]);
    }

    // ── Escort count ──
    const escortMatch = lower.match(/(\d)\s*(?:escort|pilot|flag)\s*car/);
    if (escortMatch) {
        result.escort_count = parseInt(escortMatch[1], 10);
    }
    if (!result.escort_count) {
        if (/front and rear|front & rear|both ends|2 cars|two cars/.test(lower)) result.escort_count = 2;
        else if (/escort|pilot car|flag car/.test(lower)) result.escort_count = 1;
    }

    // ── Origin/Destination extraction (from X to Y pattern) ──
    const routeMatch = lower.match(/from\s+([a-z\s]+?)(?:,?\s*([a-z]{2}))?\s+to\s+([a-z\s]+?)(?:,?\s*([a-z]{2}))?(?:\s|$|\.)/);
    if (routeMatch) {
        result.origin_city = routeMatch[1]?.trim();
        result.origin_state = routeMatch[2]?.toUpperCase();
        result.destination_city = routeMatch[3]?.trim();
        result.destination_state = routeMatch[4]?.toUpperCase();
    }

    // ── State extraction fallback (look for state names or abbreviations) ──
    if (!result.origin_state) {
        for (const [name, abbrev] of Object.entries(US_STATES)) {
            if (lower.includes(name)) {
                if (!result.origin_state) result.origin_state = abbrev;
                else if (!result.destination_state) result.destination_state = abbrev;
                break;
            }
        }

        // Check for standalone state abbreviations (e.g., "TX", "FL")
        const abbrMatches = text.match(/\b([A-Z]{2})\b/g);
        if (abbrMatches) {
            for (const abbr of abbrMatches) {
                if (STATE_ABBREVS.has(abbr)) {
                    if (!result.origin_state) result.origin_state = abbr;
                    else if (!result.destination_state && result.origin_state !== abbr) {
                        result.destination_state = abbr;
                    }
                }
            }
        }
    }

    // ── Urgency ──
    if (/asap|immediately|right now|emergency|urgent|last minute/.test(lower)) {
        result.urgency_level = 'critical';
    } else if (/today|tonight|this evening|this morning/.test(lower)) {
        result.urgency_level = 'high';
    } else if (/tomorrow|next day|this week/.test(lower)) {
        result.urgency_level = 'medium';
    } else {
        result.urgency_level = 'low';
    }

    // ── Load type ──
    if (/wind blade|wind tower|wind energy/.test(lower)) result.load_type = 'wind_energy';
    else if (/transformer|electrical/.test(lower)) result.load_type = 'transformer';
    else if (/modular|building|house/.test(lower)) result.load_type = 'modular_building';
    else if (/beam|girder|bridge/.test(lower)) result.load_type = 'bridge_beam';
    else if (/tank|vessel|pressure/.test(lower)) result.load_type = 'vessel_tank';
    else if (/equipment|dozer|excavator|crane/.test(lower)) result.load_type = 'heavy_equipment';
    else if (/boat|yacht/.test(lower)) result.load_type = 'boat';
    else if (/oversize|over.?dimensional|wide load/.test(lower)) result.load_type = 'oversize_general';

    // ── Equipment type (for equipment_sale) ──
    if (/height pole/.test(lower)) result.equipment_type = 'height_pole';
    else if (/amber light|light bar/.test(lower)) result.equipment_type = 'lighting';
    else if (/sign|oversize sign|wide load sign/.test(lower)) result.equipment_type = 'signage';
    else if (/gps|tracking/.test(lower)) result.equipment_type = 'gps_tracking';

    // ── Date extraction ──
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
        const month = dateMatch[1];
        const day = dateMatch[2];
        const year = dateMatch[3] || new Date().getFullYear().toString();
        result.estimated_date = `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // ── Extraction quality score ──
    let quality = 0;
    if (result.origin_state) quality += 0.20;
    if (result.destination_state) quality += 0.20;
    if (result.origin_city) quality += 0.10;
    if (result.destination_city) quality += 0.10;
    if (result.load_type) quality += 0.15;
    if (result.urgency_level && result.urgency_level !== 'low') quality += 0.10;
    if (result.escort_count) quality += 0.05;
    if (result.contact_present) quality += 0.05;
    if (result.rate_mentioned) quality += 0.05;
    result.extraction_quality = Math.min(quality, 1.0);

    return result;
}

// ============================================================
// CLASSIFICATION ENGINE
// ============================================================

function classifyText(text: string): ClassificationResult {
    const lower = text.toLowerCase();
    const scores: Record<IntentClass, number> = {
        escort_needed: 0,
        driver_available: 0,
        broker_offer: 0,
        dispute_signal: 0,
        equipment_sale: 0,
        general_chat: 0,
    };

    // Score each intent class
    for (const [intentClass, signals] of Object.entries(INTENT_SIGNALS) as [IntentClass, typeof INTENT_SIGNALS.escort_needed][]) {
        for (const signal of signals) {
            const matched = signal.keywords.some(kw => lower.includes(kw));
            if (matched) {
                scores[intentClass] = Math.min(scores[intentClass] + signal.weight, 1.0);
            }
        }
    }

    // Normalize to probabilities
    const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
    const probabilities: Record<IntentClass, number> = {} as any;

    if (totalScore > 0) {
        for (const [cls, score] of Object.entries(scores) as [IntentClass, number][]) {
            probabilities[cls] = score / totalScore;
        }
    } else {
        probabilities.general_chat = 1.0;
        for (const cls of Object.keys(scores) as IntentClass[]) {
            if (cls !== 'general_chat') probabilities[cls] = 0;
        }
    }

    // Sort by probability
    const sorted = (Object.entries(probabilities) as [IntentClass, number][])
        .sort((a, b) => b[1] - a[1]);

    const primary = sorted[0];
    const secondary = sorted.slice(1).filter(([_, conf]) => conf >= 0.10);

    // Extract entities
    const entities = extractEntities(text);

    return {
        intent_class: primary[0],
        confidence: Math.round(primary[1] * 10000) / 10000,
        secondary_intents: secondary.map(([cls, conf]) => ({
            class: cls,
            confidence: Math.round(conf * 10000) / 10000,
        })),
        ...entities,
        extraction_quality: entities.extraction_quality || 0,
        contact_present: entities.contact_present || false,
    };
}

// ============================================================
// BATCH PROCESSOR
// ============================================================

export async function processUnclassifiedImports(): Promise<{
    processed: number;
    classified: number;
    below_threshold: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();
    const CONFIDENCE_THRESHOLD = 0.60;

    // Pull unprocessed imports (max 100 per batch)
    const { data: imports } = await supabase
        .from('social_post_imports')
        .select('*')
        .eq('processed', false)
        .eq('opt_in_verified', true)  // Only process opted-in content
        .order('created_at', { ascending: true })
        .limit(100);

    let classified = 0;
    let belowThreshold = 0;

    for (const imp of imports || []) {
        const result = classifyText(imp.raw_text);

        // Insert classification
        const { data: classRow, error } = await supabase
            .from('social_classifications')
            .insert({
                import_id: imp.id,
                model_version: 'social_intent_v1',
                intent_class: result.intent_class,
                confidence: result.confidence,
                secondary_intents: result.secondary_intents,
                origin_city: result.origin_city,
                origin_state: result.origin_state,
                destination_city: result.destination_city,
                destination_state: result.destination_state,
                load_type: result.load_type,
                urgency_level: result.urgency_level,
                escort_count: result.escort_count,
                contact_present: result.contact_present,
                extracted_phone: result.extracted_phone,
                extracted_email: result.extracted_email,
                estimated_date: result.estimated_date,
                equipment_type: result.equipment_type,
                rate_mentioned: result.rate_mentioned,
                extraction_quality: result.extraction_quality,
                human_reviewed: false,
            })
            .select('id')
            .single();

        if (!error && classRow) {
            // Update import as processed
            await supabase.from('social_post_imports').update({
                processed: true,
                processed_at: new Date().toISOString(),
                classification_id: classRow.id,
            }).eq('id', imp.id);

            if (result.confidence >= CONFIDENCE_THRESHOLD) {
                classified++;
            } else {
                belowThreshold++;
            }
        }
    }

    return {
        processed: (imports || []).length,
        classified,
        below_threshold: belowThreshold,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// SINGLE POST CLASSIFICATION (for real-time use)
// ============================================================

export function classifySinglePost(text: string): ClassificationResult {
    return classifyText(text);
}
