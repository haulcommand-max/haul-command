import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/entities/upsert — Create or update an entity
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const {
            entity_type, canonical_name, country_code, region_code,
            city_name, phone, email, website, external_ids,
            metadata, tags, data_sources,
        } = body;

        if (!entity_type || !canonical_name) {
            return NextResponse.json(
                { error: 'entity_type and canonical_name are required' },
                { status: 400 },
            );
        }

        // Dedup check: same name + type + country + city
        const { data: existing } = await db
            .from('hc_entities')
            .select('id')
            .eq('entity_type', entity_type)
            .ilike('canonical_name', canonical_name)
            .eq('country_code', country_code || '')
            .eq('city_name', city_name || '')
            .maybeSingle();

        if (existing) {
            // Update existing entity (merge metadata)
            const { error } = await db
                .from('hc_entities')
                .update({
                    ...(phone && { phone }),
                    ...(email && { email }),
                    ...(website && { website }),
                    ...(region_code && { region_code }),
                    ...(tags && { tags }),
                    ...(metadata && { metadata }),
                })
                .eq('id', existing.id);

            if (error) throw error;

            return NextResponse.json({
                entity_id: existing.id,
                action: 'updated',
            });
        }

        // Generate slug
        const slug = canonical_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const { data, error } = await db
            .from('hc_entities')
            .insert({
                entity_type,
                canonical_name,
                slug: `${slug}-${country_code?.toLowerCase() || 'us'}`,
                country_code: country_code || null,
                region_code: region_code || null,
                city_name: city_name || null,
                phone: phone || null,
                email: email || null,
                website: website || null,
                external_ids: external_ids || {},
                metadata: metadata || {},
                tags: tags || [],
                data_sources: data_sources || ['api'],
                status: 'draft',
            })
            .select('id')
            .single();

        if (error) throw error;

        // Initialize freshness record
        await db
            .from('hc_profile_freshness')
            .insert({ entity_id: data.id, freshness_score: 0 })
            .single();

        return NextResponse.json({
            entity_id: data.id,
            action: 'created',
        }, { status: 201 });
    } catch (err: any) {
        console.error('[v1/entities/upsert] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
