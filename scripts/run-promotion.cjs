/**
 * Run the directory promotion pipeline directly against Supabase.
 * Promotes hc_identities + profiles → directory_listings
 */
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });
const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

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
    console.log('🔄 Starting directory promotion pipeline...\n');
    const results = { promoted: 0, skipped: 0, enriched: 0, errors: [] };

    // ── Step 1: Pull from hc_identities ──
    const { data: identities, error: idErr } = await sb
        .from('hc_identities')
        .select('identity_id, display_name, role, phone, home_base_city, home_base_region, service_area, verification_level, published, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(500);

    if (idErr) {
        console.error('❌ hc_identities query failed:', idErr.message);
        process.exit(1);
    }

    console.log(`📊 hc_identities: ${identities?.length ?? 0} records`);

    // ── Step 2: Pull from profiles ──
    const { data: profiles, error: prErr } = await sb
        .from('profiles')
        .select('id, display_name, role, phone, email, home_city, home_state, home_country, country, created_at')
        .limit(500);

    if (prErr) {
        console.error('❌ profiles query failed:', prErr.message);
    } else {
        console.log(`📊 profiles: ${profiles?.length ?? 0} records`);
    }

    // ── Step 3: Get existing directory_listings entity_ids ──
    const { data: existing } = await sb
        .from('directory_listings')
        .select('entity_id')
        .limit(2000);

    const existingIds = new Set((existing ?? []).map(l => l.entity_id));
    console.log(`📂 directory_listings: ${existingIds.size} existing\n`);

    // ── Step 4: Promote hc_identities ──
    if (identities && identities.length > 0) {
        for (const ident of identities) {
            if (existingIds.has(ident.identity_id)) {
                results.skipped++;
                continue;
            }

            try {
                const name = ident.display_name || 'Unknown Operator';
                const slug = generateSlug(name + '-' + (ident.home_base_region || 'us'));

                const listing = {
                    entity_type: ident.role || 'escort_operator',
                    entity_id: ident.identity_id,
                    name: name,
                    slug: slug,
                    city: ident.home_base_city || null,
                    region_code: ident.home_base_region || null,
                    country_code: 'US',
                    rank_score: ident.verification_level === 'verified' ? 50 : 10,
                    claim_status: 'unclaimed',
                    is_visible: true,
                    source: 'hc_identities',
                    metadata: {
                        phone: normalizePhone(ident.phone),
                        service_area: ident.service_area,
                        promoted_at: new Date().toISOString(),
                        pipeline: 'promotion_v1',
                    },
                };

                const { error: upsertErr } = await sb
                    .from('directory_listings')
                    .insert(listing);

                if (upsertErr) {
                    if (upsertErr.message.includes('duplicate')) {
                        results.skipped++;
                    } else {
                        results.errors.push(`[identity ${ident.identity_id}] ${upsertErr.message}`);
                    }
                } else {
                    results.promoted++;
                    existingIds.add(ident.identity_id);
                    console.log(`  ✅ ${name} (${ident.role || 'operator'}) → directory`);
                }
            } catch (e) {
                results.errors.push(`[identity ${ident.identity_id}] ${e.message}`);
            }
        }
    }

    // ── Step 5: Promote profiles not already in directory ──
    if (profiles && profiles.length > 0) {
        for (const prof of profiles) {
            if (existingIds.has(prof.id)) {
                results.skipped++;
                continue;
            }

            try {
                const name = prof.display_name || 'Unknown';
                const slug = generateSlug(name + '-' + (prof.home_state || prof.country || 'us'));

                const listing = {
                    entity_type: prof.role || 'escort_operator',
                    entity_id: prof.id,
                    name: name,
                    slug: slug,
                    city: prof.home_city || null,
                    region_code: prof.home_state || null,
                    country_code: prof.home_country || prof.country || 'US',
                    rank_score: 15,
                    claim_status: 'claimed',
                    is_visible: true,
                    source: 'profiles',
                    metadata: {
                        phone: normalizePhone(prof.phone),
                        email: prof.email,
                        promoted_at: new Date().toISOString(),
                        pipeline: 'promotion_v1',
                    },
                };

                const { error: upsertErr } = await sb
                    .from('directory_listings')
                    .insert(listing);

                if (upsertErr) {
                    if (upsertErr.message.includes('duplicate')) {
                        results.skipped++;
                    } else {
                        results.errors.push(`[profile ${prof.id}] ${upsertErr.message}`);
                    }
                } else {
                    results.promoted++;
                    existingIds.add(prof.id);
                    console.log(`  ✅ ${name} (${prof.role || 'profile'}) → directory`);
                }
            } catch (e) {
                results.errors.push(`[profile ${prof.id}] ${e.message}`);
            }
        }
    }

    // ── Results ──
    console.log('\n═══════════════════════════════════');
    console.log(`✅ Promoted: ${results.promoted}`);
    console.log(`⏭️  Skipped (already exists): ${results.skipped}`);
    if (results.errors.length > 0) {
        console.log(`⚠️  Errors: ${results.errors.length}`);
        results.errors.forEach(e => console.log(`   ${e}`));
    }
    console.log('═══════════════════════════════════');

    process.exit(0);
}

run();
