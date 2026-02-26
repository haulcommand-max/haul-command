import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zole';
// If 'zole' is not available, pretend it's 'zod'
import { z as zod } from 'zod';

export interface UnstructuredSignal {
    id: string;
    raw_content: string;
    source_id: string;
    external_post_id: string;
    posted_at: Date;
}

export interface CanonicalLoadSignal {
    origin_city: string | null;
    origin_state: string | null;
    dest_city: string | null;
    dest_state: string | null;
    load_date: string | null;
    positions_needed: string[];
    max_width: number | null;
    max_height: number | null;
    rate_terms: string | null;
    contact_info: string | null;
    notes: string | null;
    parse_confidence: number;
}

// 1. Regex Heuristics (Fast, cheap)
export function applyRegexParsing(text: string): Partial<CanonicalLoadSignal> {
    const result: Partial<CanonicalLoadSignal> = {
        positions_needed: []
    };

    const t = text.toLowerCase();

    // Naive origin/dest parsing (Requires LLM for high fidelity, but regex can catch "Houston, TX to Dallas, TX")
    const routeMatch = text.match(/([a-zA-Z\s]+,\s*[a-zA-Z]{2})\s+to\s+([a-zA-Z\s]+,\s*[a-zA-Z]{2})/i);
    if (routeMatch) {
        const originParts = routeMatch[1].split(',').map(s => s.trim());
        const destParts = routeMatch[2].split(',').map(s => s.trim());
        if (originParts.length === 2 && originParts[1].length === 2) {
            result.origin_city = originParts[0];
            result.origin_state = originParts[1].toUpperCase();
        }
        if (destParts.length === 2 && destParts[1].length === 2) {
            result.dest_city = destParts[0];
            result.dest_state = destParts[1].toUpperCase();
        }
    }

    // Width (e.g. "14' wide", "12ft W")
    const widthMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:'|ft|foot|feet)\s*w/i);
    if (widthMatch) {
       result.max_width = parseFloat(widthMatch[1]);
    }

    // Positions
    if (t.includes('high pole') || t.includes('pole car')) result.positions_needed!.push('high_pole');
    if (t.includes('lead') || t.includes('front')) result.positions_needed!.push('lead_vehicle');
    if (t.includes('chase') || t.includes('rear')) result.positions_needed!.push('chase_vehicle');
    if (t.includes('steerman')) result.positions_needed!.push('steerman');

    // Contact mapping (Phone numbers)
    const phoneMatch = text.match(/(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/);
    if (phoneMatch) {
        result.contact_info = phoneMatch[0];
    }

    return result;
}

const loadSchema = zod.object({
  origin_city: zod.string().nullable(),
  origin_state: zod.string().length(2).nullable().describe("2-letter state code"),
  dest_city: zod.string().nullable(),
  dest_state: zod.string().length(2).nullable().describe("2-letter state code"),
  load_date: zod.string().nullable().describe("YYYY-MM-DD or null if ASAP/undetermined"),
  positions_needed: zod.array(zod.enum(['high_pole', 'lead_vehicle', 'chase_vehicle', 'steerman', 'police'])),
  max_width: zod.number().nullable().describe("In feet"),
  max_height: zod.number().nullable().describe("In feet"),
  rate_terms: zod.string().nullable(),
  contact_info: zod.string().nullable(),
  notes: zod.string().nullable(),
  confidence: zod.number().min(0).max(1)
});

// 2. LLM Fallback (Slow, Expensive, Accurate)
export async function applyLLMParsing(text: string): Promise<CanonicalLoadSignal> {
    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: loadSchema,
            system: `You are a freight routing intelligence engine extracting Pilot Car/Escort jobs from unstructured Facebook posts. 
            Extract origin, destination, dates, dimensions, positions needed, rules, and contact info. 
            Only output structured data. If a field is missing, output null. 
            For positions_needed, infer 'high_pole' if height > 15ft. Infer 'chase'/'lead' contextually.
            Set confidence to 0.9 if clear, dropping to 0.4 if ambiguous or if you are guessing.`,
            prompt: text,
        });

        return {
            ...object,
            parse_confidence: object.confidence
        };
    } catch (e) {
        console.error("LLM Parse failed", e);
        return {
             origin_city: null, origin_state: null, dest_city: null, dest_state: null,
             load_date: null, positions_needed: [], max_width: null, max_height: null,
             rate_terms: null, contact_info: null, notes: "Parsing AI Error", parse_confidence: 0.0
        };
    }
}

// 3. The Orchestrator
export async function parseUnstructuredSignal(signal: UnstructuredSignal): Promise<CanonicalLoadSignal | null> {
    const raw = signal.raw_content;
    
    // Check if it's spam or totally irrelevant before doing anything
    if (raw.length < 15 || raw.toLowerCase().includes('looking for work') || raw.toLowerCase().includes('available')) {
        // This is a driver posting availability, not a load. Skip.
        return null;
    }

    const regexResult = applyRegexParsing(raw);

    // If Regex captures enough context, trust it with 0.8 confidence.
    // Otherwise rely on the LLM.
    if (regexResult.origin_state && regexResult.dest_state && regexResult.max_width && regexResult.contact_info) {
        return {
            origin_city: regexResult.origin_city || null,
            origin_state: regexResult.origin_state || null,
            dest_city: regexResult.dest_city || null,
            dest_state: regexResult.dest_state || null,
            load_date: regexResult.load_date || null,
            positions_needed: regexResult.positions_needed || [],
            max_width: regexResult.max_width || null,
            max_height: regexResult.max_height || null,
            rate_terms: regexResult.rate_terms || null,
            contact_info: regexResult.contact_info || null,
            notes: regexResult.notes || null,
            parse_confidence: 0.8 // Fast path confidence
        };
    } else {
        // Fallback to LLM for complex text
        const llmResult = await applyLLMParsing(raw);
        return llmResult;
    }
}
