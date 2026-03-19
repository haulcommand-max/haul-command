import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Directory Promotion Pipeline — PART 6 + 7
 * 
 * POST: Promote raw contacts/observations → canonical directory_listings
 * 
 * Pipeline:
 *   raw contacts / hc_identities / broker surfaces / activation queue
 *   → normalized entity resolution
 *   → role classification
 *   → enrichment
 *   → canonical profile (directory_listings)
 *   → directory visibility
 *   → claim / verification flows
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
        already_in_directory: 0,
        promoted: 0,
        enriched: 0,
        deduped: 0,
        errors: [] as string[],
    };

    try {
        // ── Step 1: Pull all hc_identities not yet in directory_listings ──
        const { data: identities, error: idErr } = await sb
            .from('hc_identities')
            .select('id, display_name, slug, role, city, state_code, country_code, phone, email, company_name, website, service_types, verification_state, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

        if (idErr) {
            results.errors.push(`hc_identities query failed: ${idErr.message}`);
            return NextResponse.json(results, { status: 500 });
        }

        results.identities_scanned = identities?.length ?? 0;

        if (!identities || identities.length === 0) {
            return NextResponse.json({ ...results, message: 'No identities to process' });
        }

        // ── Step 2: Check which are already in directory_listings ──
        const idList = identities.map(i => i.id);
        const { data: existingListings } = await sb
            .from('directory_listings')
            .select('id')
            .in('id', idList);

        const existingIds = new Set((existingListings ?? []).map(l => l.id));
        results.already_in_directory = existingIds.size;

        // ── Step 3: Classify, normalize, and promote missing records ──
        const toPromote = identities.filter(i => !existingIds.has(i.id));

        for (const identity of toPromote) {
            try {
                // Role classification
                const role = classifyRole(identity.role, identity.service_types);

                // Slug generation
                const baseSlug = identity.slug || generateSlug(identity.display_name || identity.company_name || identity.id);

                // Build the directory listing record
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

                // ── Step 4: Enrichment pass ──
                const enrichment: Record<string, any> = {};
                let enriched = false;

                // Phone normalization
                if (identity.phone) {
                    const normalized = normalizePhone(identity.phone);
                    if (normalized !== identity.phone) {
                        enrichment.phone_normalized = normalized;
                        enriched = true;
                    }
                }

                // Role upgrade
                if (!identity.role || identity.role === 'unknown') {
                    enrichment.role = role;
                    enriched = true;
                }

                // Name normalization
                if (identity.display_name) {
                    const cleaned = cleanName(identity.display_name);
                    if (cleaned !== identity.display_name) {
                        enrichment.display_name_clean = cleaned;
                        enriched = true;
                    }
                }

                if (enriched) {
                    await sb
                        .from('hc_identities')
                        .update({ metadata: { ...enrichment, enriched_at: new Date().toISOString() } })
                        .eq('id', identity.id);
                    results.enriched++;
                }
            } catch (entityErr: any) {
                results.errors.push(`Entity ${identity.id}: ${entityErr.message}`);
            }
        }

        // ── Step 5: Deduplication scan ──
        // Find potential duplicates by phone or company name
        const { data: dupeCheck } = await sb
            .from('directory_listings')
            .select('id, name, metadata')
            .order('rank_score', { ascending: false });

        if (dupeCheck && dupeCheck.length > 1) {
            const seen = new Map<string, string>();
            for (const listing of dupeCheck) {
                const phone = (listing.metadata as any)?.phone;
                if (phone) {
                    const normalized = normalizePhone(phone);
                    if (normalized && seen.has(normalized)) {
                        // Mark as duplicate but preserve — don't delete
                        await sb
                            .from('directory_listings')
                            .update({
                                metadata: {
                                    ...(listing.metadata as any),
                                    duplicate_of: seen.get(normalized),
                                    deduped_at: new Date().toISOString(),
                                },
                            })
                            .eq('id', listing.id);
                        results.deduped++;
                    } else if (normalized) {
                        seen.set(normalized, listing.id);
                    }
                }
            }
        }

        return NextResponse.json({
            ...results,
            message: `Promotion complete. ${results.promoted} promoted, ${results.enriched} enriched, ${results.deduped} duplicates flagged.`,
        });
    } catch (err: any) {
        results.errors.push(`Pipeline error: ${err.message}`);
        return NextResponse.json(results, { status: 500 });
    }
}

// ── Utility functions ──

function classifyRole(role?: string | null, serviceTypes?: string[] | null): string {
    if (role && role !== 'unknown') return role;

    const types = (serviceTypes ?? []).map(s => s.toLowerCase());
    if (types.some(t => t.includes('escort') || t.includes('pilot'))) return 'escort_operator';
    if (types.some(t => t.includes('broker') || t.includes('dispatch'))) return 'broker';
    if (types.some(t => t.includes('height') || t.includes('pole'))) return 'support_partner';
    if (types.some(t => t.includes('chase') || t.includes('rear'))) return 'escort_operator';
    return 'escort_operator'; // default
}

function normalizePhone(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return phone; // return as-is if format is unknown
}

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
}

function cleanName(name: string): string {
    return name
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(mr|mrs|ms|dr|llc|inc|corp)\.?\s*/i, '')
        .trim();
}
