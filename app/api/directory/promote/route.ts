import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Directory Promotion Pipeline
 * POST: Promote hc_identities + profiles → directory_listings
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    const results = {
        identities_scanned: 0,
        profiles_scanned: 0,
        already_in_directory: 0,
        promoted: 0,
        errors: [] as string[],
    };

    try {
        // Step 1: Pull hc_identities
        const { data: identities, error: idErr } = await sb
            .from('hc_identities')
            .select('identity_id, display_name, role, phone, home_base_city, home_base_region, service_area, verification_level, published, created_at')
            .eq('published', true)
            .order('created_at', { ascending: false })
            .limit(500);

        if (idErr) {
            results.errors.push(`hc_identities query failed: ${idErr.message}`);
            return NextResponse.json(results, { status: 500 });
        }

        results.identities_scanned = identities?.length ?? 0;

        // Step 2: Pull profiles
        const { data: profiles, error: prErr } = await sb
            .from('profiles')
            .select('id, display_name, role, phone, email, home_city, home_state, home_country, country, created_at')
            .limit(500);

        if (!prErr) {
            results.profiles_scanned = profiles?.length ?? 0;
        }

        // Step 3: Get existing entity_ids
        const { data: existing } = await sb
            .from('hc_global_operators')
            .select('entity_id')
            .limit(5000);

        const existingIds = new Set((existing ?? []).map(l => l.entity_id));
        results.already_in_directory = existingIds.size;

        // Step 4: Promote identities
        if (identities) {
            for (const ident of identities) {
                if (existingIds.has(ident.identity_id)) continue;

                try {
                    const name = ident.display_name || 'Unknown Operator';
                    const slug = generateSlug(name + '-' + (ident.home_base_region || 'us'));

                    const { error: upsertErr } = await sb
                        .from('hc_global_operators')
                        .insert({
                            entity_type: ident.role || 'escort_operator',
                            entity_id: ident.identity_id,
                            name,
                            slug,
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
                        });

                    if (upsertErr && !upsertErr.message.includes('duplicate')) {
                        results.errors.push(`identity ${ident.identity_id}: ${upsertErr.message}`);
                    } else if (!upsertErr) {
                        results.promoted++;
                        existingIds.add(ident.identity_id);
                    }
                } catch (e: any) {
                    results.errors.push(`identity ${ident.identity_id}: ${e.message}`);
                }
            }
        }

        // Step 5: Promote profiles
        if (profiles) {
            for (const prof of profiles) {
                if (existingIds.has(prof.id)) continue;

                try {
                    const name = prof.display_name || 'Unknown';
                    const slug = generateSlug(name + '-' + (prof.home_state || prof.country || 'us'));

                    const { error: upsertErr } = await sb
                        .from('hc_global_operators')
                        .insert({
                            entity_type: prof.role || 'escort_operator',
                            entity_id: prof.id,
                            name,
                            slug,
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
                        });

                    if (upsertErr && !upsertErr.message.includes('duplicate')) {
                        results.errors.push(`profile ${prof.id}: ${upsertErr.message}`);
                    } else if (!upsertErr) {
                        results.promoted++;
                        existingIds.add(prof.id);
                    }
                } catch (e: any) {
                    results.errors.push(`profile ${prof.id}: ${e.message}`);
                }
            }
        }

        return NextResponse.json({
            ...results,
            message: `Promotion complete. ${results.promoted} promoted from ${results.identities_scanned} identities + ${results.profiles_scanned} profiles.`,
        });
    } catch (err: any) {
        results.errors.push(`Pipeline error: ${err.message}`);
        return NextResponse.json(results, { status: 500 });
    }
}

function normalizePhone(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone;
}

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
}
