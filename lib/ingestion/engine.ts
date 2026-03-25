import { createClient } from '@/lib/supabase/server';
import { act } from '@/lib/ai/brain';
import * as yaml from 'yaml';

// Normalize enums based on standard platform capabilities
const VALID_CAPABILITIES = [
    'route_survey', 'lead', 'chase', 'height_pole', 
    'steerman', 'certified_flagging', 'twic', 'passport'
] as const;

export interface RawVendorInfo {
    name: string;
    phone: string;
    email: string;
    state: string;
    capabilities_raw: string | null;
    source: string;
}

export interface IngestedOperator {
    company_name: string;
    contact_name: string;
    phone: string;
    email: string;
    state: string;
    city: string | null;
    capabilities: string[];
    confidence_score: number;
    completeness_score: number;
    priority_rank: number;
    status: 'merged' | 'new';
    matched_listing_id: string | null;
}

/**
 * 1. AI Parsing Pass
 * Splits names, normalizes capabilities, scores the input.
 */
async function parseVendorWithGemini(vendor: RawVendorInfo): Promise<Omit<IngestedOperator, 'status' | 'matched_listing_id'>> {
    const prompt = `
You are an operator-ingestion and enrichment engine for Haul Command.
Convert this raw vendor into a structured entity.

Raw Data:
${JSON.stringify(vendor, null, 2)}

Instructions:
1. Split raw 'name' into 'company_name' and 'contact_name' (if applicable, else null).
2. Clean and standardize company name (e.g. "Pilot Car Svc" -> "Pilot Car Service").
3. Convert 'capabilities_raw' into standard enums. Expected enums: ${VALID_CAPABILITIES.join(', ')}. E.g. "HP" = "height_pole", "Lead/Chase" = ["lead", "chase"].
4. Assign confidence_score (0.00-1.00): How confident are you that this data is a real, legitimate operator?
5. Assign completeness_score (0.00-1.00): Is it missing capabilities, email, or name?
6. Assign priority_rank (1-100): High priority if they have high capabilities (like HP, TWIC) and full contact info.

Output MUST conform strictly to the JSON schema.`;

    const res = await act(prompt, {
        tier: 'fast',
        json: true,
        schema: {
            type: 'object',
            properties: {
                company_name: { type: 'string' },
                contact_name: { type: ['string', 'null'] },
                capabilities: { type: 'array', items: { type: 'string' } },
                confidence_score: { type: 'number' },
                completeness_score: { type: 'number' },
                priority_rank: { type: 'number' }
            },
            required: ['company_name', 'capabilities', 'confidence_score', 'completeness_score', 'priority_rank']
        }
    });

    const parsed = JSON.parse(res.text);

    return {
        company_name: parsed.company_name,
        contact_name: parsed.contact_name || null,
        phone: vendor.phone.replace(/[^0-9]/g, ''),
        email: vendor.email?.trim().toLowerCase() || '',
        state: vendor.state?.trim().toUpperCase(),
        city: null,
        capabilities: parsed.capabilities,
        confidence_score: parsed.confidence_score,
        completeness_score: parsed.completeness_score,
        priority_rank: parsed.priority_rank,
    };
}

/**
 * 2. Cross-Database Resolution
 * Tries to cleanly merge or insert against Supabase listings. 
 */
export async function resolveAndIngestVendor(vendor: RawVendorInfo): Promise<IngestedOperator> {
    const supabase = createClient();
    
    // 1. Structural Parse & Score
    const parsed = await parseVendorWithGemini(vendor);
    
    // 2. Exact Match Passes
    let matchedId = null;

    // Pass A: Email
    if (parsed.email && parsed.email !== 'null') {
        const { data: byEmail } = await supabase.from('listings').select('id, full_name, services').eq('email', parsed.email).single();
        if (byEmail) matchedId = byEmail.id;
    }

    // Pass B: Phone (If no email match)
    if (!matchedId && parsed.phone && parsed.phone.length >= 10) {
        // Strip everything to purely numbers
        const cleanPhone = parsed.phone.slice(-10);
        const { data: byPhone } = await supabase.from('listings').select('id')
            .like('phone', `%${cleanPhone}%`)
            .limit(1);
            
        if (byPhone && byPhone.length > 0) matchedId = byPhone[0].id;
    }

    // Pass C: Fuzzy Name Match in same State
    if (!matchedId && parsed.state) {
        // Use textSearch on company name for fuzzy matching in DB
        const { data: fuzzy } = await supabase.from('listings').select('id')
            .eq('state', parsed.state)
            .ilike('full_name', `%${parsed.company_name.substring(0, 5)}%`) // crude prefix match
            .limit(1);

        if (fuzzy && fuzzy.length > 0) matchedId = fuzzy[0].id;
    }

    // 3. Ingest or Merge
    const upsertData: any = {
        full_name: parsed.company_name,
        contact_name: parsed.contact_name,
        phone: parsed.phone,
        email: parsed.email,
        state: parsed.state,
        services: parsed.capabilities,
        ai_confidence: parsed.confidence_score,
        rank_score: parsed.priority_rank,
        claimed: false,
        active: true,
        source: vendor.source,
    };

    if (matchedId) {
        // Merge - append capabilities without destroying old ones
        const { data: existing } = await supabase.from('listings').select('services, rank_score').eq('id', matchedId).single();
        const combinedServices = Array.from(new Set([...(existing?.services || []), ...parsed.capabilities]));
        const maxRank = Math.max(existing?.rank_score || 0, parsed.priority_rank);
        
        await supabase.from('listings').update({
            services: combinedServices,
            rank_score: maxRank,
            // Keep existing primary contact info if it differs, or overwrite if empty
        }).eq('id', matchedId);

        return { ...parsed, status: 'merged', matched_listing_id: matchedId };
    } else {
        // Create brand new identity profile
        const { data: inserted, error } = await supabase.from('listings').insert([upsertData]).select('id').single();
        if (error) console.error("Ingestion insert error:", error);
        
        return { ...parsed, status: 'new', matched_listing_id: inserted?.id || null };
    }
}

/**
 * 3. Batch Orchestrator 
 * Accepts pure YAML payload from UI/CLI and pipelines it
 */
export async function batchIngestYaml(yamlPayload: string) {
    try {
        const parsedDoc: { vendors: RawVendorInfo[] } = yaml.parse(yamlPayload);
        if (!parsedDoc.vendors || !Array.isArray(parsedDoc.vendors)) {
            throw new Error("Invalid YAML structure. Expected root 'vendors' array.");
        }

        const stats = { new: 0, merged: 0, failed: 0 };
        const results = [];

        // Concurrency controlled ingestion
        const CONCURRENCY = 5;
        for (let i = 0; i < parsedDoc.vendors.length; i += CONCURRENCY) {
            const batch = parsedDoc.vendors.slice(i, i + CONCURRENCY);
            const settled = await Promise.allSettled(
                batch.map(async vendor => resolveAndIngestVendor(vendor))
            );

            for (const s of settled) {
                if (s.status === 'fulfilled') {
                    results.push(s.value);
                    if (s.value.status === 'new') stats.new++;
                    if (s.value.status === 'merged') stats.merged++;
                } else {
                    stats.failed++;
                    console.error("Failed vendor:", s.reason);
                }
            }
        }

        return { success: true, stats, processed_records: results };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
