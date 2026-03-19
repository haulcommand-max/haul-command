/**
 * Run the directory promotion pipeline directly against Supabase.
 * Usage: node scripts/run-promotion.mjs
 */
import { createClient } from '@supabase/supabase-js';

import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

function classifyRole(role, serviceTypes) {
    if (role && role !== 'unknown') return role;
    const types = (serviceTypes ?? []).map(s => s.toLowerCase());
    if (types.some(t => t.includes('escort') || t.includes('pilot'))) return 'escort_operator';
    if (types.some(t => t.includes('broker') || t.includes('dispatch'))) return 'broker';
    if (types.some(t => t.includes('height') || t.includes('pole'))) return 'support_partner';
    return 'escort_operator';
}

function normalizePhone(phone) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone;
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
}

async function run() {
    console.log('🔄 Starting directory promotion pipeline...');
    const results = {
        identities_scanned: 0,
        already_in_directory: 0,
        promoted: 0,
        enriched: 0,
        deduped: 0,
        errors: [],
    };

    // Step 1: Pull identities
    const { data: identities, error: idErr } = await sb
        .from('hc_identities')
        .select('id, display_name, slug, role, city, state_code, country_code, phone, email, company_name, website, service_types, verification_state, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

    if (idErr) {
        console.error('❌ hc_identities query failed:', idErr.message);
        process.exit(1);
    }

    results.identities_scanned = identities?.length ?? 0;
    console.log(`📊 Found ${results.identities_scanned} identities`);

    if (!identities || identities.length === 0) {
        console.log('ℹ️  No identities to process');
        process.exit(0);
    }

    // Step 2: Check existing
    const idList = identities.map(i => i.id);
    const { data: existing } = await sb
        .from('directory_listings')
        .select('id')
        .in('id', idList);

    const existingIds = new Set((existing ?? []).map(l => l.id));
    results.already_in_directory = existingIds.size;
    console.log(`📂 ${existingIds.size} already in directory`);

    // Step 3: Promote
    const toPromote = identities.filter(i => !existingIds.has(i.id));
    console.log(`🚀 Promoting ${toPromote.length} new records...`);

    for (const identity of toPromote) {
        try {
            const role = classifyRole(identity.role, identity.service_types);
            const baseSlug = identity.slug || generateSlug(identity.display_name || identity.company_name || identity.id);

            const listing = {
                id: identity.id,
                name: identity.display_name || identity.company_name || 'Unknown Operator',
                slug: baseSlug,
                entity_type: role,
                city: identity.city || null,
                region_code: identity.state_code || null,
                country_code: identity.country_code || 'US',
                rank_score: identity.verification_state === 'verified' ? 50 : 10,
                claim_status: identity.verification_state || 'unclaimed',
                is_visible: true,
                metadata: {
                    phone: normalizePhone(identity.phone),
                    email: identity.email,
                    company_name: identity.company_name,
                    website: identity.website,
                    service_types: identity.service_types,
                    promoted_at: new Date().toISOString(),
                    source: 'promotion_pipeline',
                },
            };

            const { error: upsertErr } = await sb
                .from('directory_listings')
                .upsert(listing, { onConflict: 'id' });

            if (upsertErr) {
                results.errors.push(`Promote ${identity.id}: ${upsertErr.message}`);
            } else {
                results.promoted++;
            }
        } catch (e) {
            results.errors.push(`Entity ${identity.id}: ${e.message}`);
        }
    }

    console.log(`✅ Promoted: ${results.promoted}`);
    if (results.errors.length > 0) {
        console.log(`⚠️  Errors: ${results.errors.length}`);
        results.errors.forEach(e => console.log(`   ${e}`));
    }
    console.log(JSON.stringify(results, null, 2));
}

run().catch(e => { console.error(e); process.exit(1); });
