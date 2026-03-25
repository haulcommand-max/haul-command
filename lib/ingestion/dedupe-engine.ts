import { getSupabaseAdmin } from '../supabase/admin';
import type { AgentExtractionResult } from './ai-extractor';

/**
 * Deduplication & Routing Engine for the Ingestion Pipeline.
 * Takes the structured output from Gemini and merges it into the Supabase graph.
 */
export async function matchAndInsertEntity(
    extracted: AgentExtractionResult, 
    sourceUrl: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    for (const ent of extracted.entities) {
        // Step 1: Normalize key matching fields
        const normalizedPhone = ent.primary_phone?.replace(/\D/g, '');
        const normalizedEmail = ent.primary_email?.toLowerCase().trim();
        const normalizedWebsite = ent.website ? new URL(ent.website).hostname.replace('www.', '') : null;
        const normalizedName = ent.name.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, ' ').trim();

        // Step 2: Query for matches
        let existingId: string | null = null;
        
        const queries = [];
        if (normalizedPhone) queries.push(`primary_phone.eq.%${normalizedPhone}%`);
        if (normalizedEmail) queries.push(`primary_email.eq.${normalizedEmail}`);
        if (normalizedWebsite) queries.push(`website.ilike.%${normalizedWebsite}%`);
        if (normalizedName) queries.push(`normalized_name.eq.${normalizedName}`);

        if (queries.length > 0) {
            const { data: matches } = await supabase
                .from('entities')
                .select('id, name, confidence_score')
                .or(queries.join(','))
                .limit(1)
                .maybeSingle();
            
            if (matches) {
                existingId = matches.id;
            }
        }

        const sourceScore = 0.5; // Base confidence
        let entityId = existingId;

        // Step 3: Upsert Entity
        if (entityId) {
            // Update mode
            await supabase.from('entities').update({
                type: ent.type,
                description: ent.description || undefined,
                primary_phone: ent.primary_phone || undefined,
                primary_email: ent.primary_email || undefined,
                website: ent.website || undefined,
                region: ent.region || undefined,
                city: ent.city || undefined,
                country_code: ent.country_code || undefined,
                source_url: sourceUrl,
                updated_at: new Date().toISOString()
            }).eq('id', entityId);
        } else {
            // Insert mode
            const { data: newEnt, error } = await supabase.from('entities').insert({
                type: ent.type,
                name: ent.name,
                normalized_name: normalizedName,
                description: ent.description,
                primary_phone: ent.primary_phone,
                primary_email: ent.primary_email,
                website: ent.website,
                region: ent.region,
                city: ent.city,
                country_code: ent.country_code,
                source: 'web_crawl',
                source_url: sourceUrl,
                confidence_score: sourceScore
            }).select('id').single();

            if (error) {
                console.error('Insert Error:', error.message);
                continue;
            }
            entityId = newEnt.id;
        }

        if (!entityId) continue;

        // Step 4: Add Contacts
        if (extracted.contacts && extracted.contacts.length > 0) {
            const contactsToInsert = extracted.contacts.map((c, i) => ({
                entity_id: entityId,
                name: c.name,
                role: c.role,
                phone: c.phone,
                email: c.email,
                linkedin: c.linkedin,
                is_primary: i === 0
            }));
            await supabase.from('contacts').upsert(contactsToInsert, { onConflict: 'id', ignoreDuplicates: true });
        }

        // Step 5: Add Services
        if (extracted.services && extracted.services.length > 0) {
            const servicesToInsert = extracted.services.map(s => ({
                entity_id: entityId,
                service_type: s.service_type,
                coverage_area: s.coverage_area
            }));
            await supabase.from('services').upsert(servicesToInsert, { onConflict: 'id', ignoreDuplicates: true });
        }

        // Step 6: Add Certifications
        if (ent.certifications && ent.certifications.length > 0) {
            const certsToInsert = ent.certifications.map(c => ({
                entity_id: entityId,
                cert_name: c.cert_name,
                issuing_authority: c.issuing_authority
            }));
            await supabase.from('entity_certifications').upsert(certsToInsert, { onConflict: 'id', ignoreDuplicates: true });
        }

        // Step 7: Add Locations
        if (extracted.locations && extracted.locations.length > 0) {
            const locsToInsert = extracted.locations.map(l => ({
                entity_id: entityId,
                address: l.address,
                city: l.city,
                region: l.region,
                country_code: l.country_code
            }));
            await supabase.from('locations').upsert(locsToInsert, { onConflict: 'id', ignoreDuplicates: true });
        }

        // Step 8: Trigger Claim Action (Example SMS/Email queue push)
        if (!existingId && ent.primary_phone) {
            // Push to claiming layer
            await supabase.from('claims').insert({
                entity_id: entityId,
                status: 'pending',
                claim_score: sourceScore
            });
        }
    }
}
