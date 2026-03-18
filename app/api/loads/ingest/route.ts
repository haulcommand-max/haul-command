/**
 * POST /api/loads/ingest
 * 
 * Ingests raw load board alert text into structured demand signals.
 * Also extracts broker/dispatcher contacts for the directory.
 * 
 * Body: { text: string, source?: string }
 * 
 * Stores:
 *   - hc_load_alerts: Individual parsed load alerts
 *   - Upserts broker contacts into operators table (as leads)
 *   - Fires PostHog events for demand tracking
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { parseLoadAlertBatch } from '@/lib/load-alert-parser';


export async function POST(req: NextRequest) {
    // Admin-only
    const authHeader = req.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { text, source } = await req.json() as { text: string; source?: string };

        if (!text) {
            return NextResponse.json({ error: 'text field required' }, { status: 400 });
        }

        const { parsed, failed, stats } = parseLoadAlertBatch(text);

        const supabase = getSupabaseAdmin();
        const batchId = crypto.randomUUID();
        const now = new Date().toISOString();

        // 1. Store parsed load alerts
        if (parsed.length > 0) {
            const loadRecords = parsed.map(alert => ({
                id: crypto.randomUUID(),
                batch_id: batchId,
                company_name: alert.company_name,
                phone: alert.phone_normalized,
                origin_city: alert.origin_city,
                origin_state: alert.origin_state,
                destination_city: alert.destination_city,
                destination_state: alert.destination_state,
                position_type: alert.position_type,
                rate_amount: alert.rate_amount,
                rate_type: alert.rate_type,
                corridor: alert.origin_state && alert.destination_state
                    ? `${alert.origin_state}-${alert.destination_state}` : null,
                dedup_key: alert.dedup_key,
                source: source || alert.source,
                raw_text: alert.raw,
                status: alert.status !== 'unknown' ? alert.status : 'active',
                is_verified: alert.is_verified,
                is_quick_pay: alert.is_quick_pay,
                estimated_miles: alert.estimated_miles,
                recency_label: alert.recency_label,
                move_date: alert.move_date,
                ingested_at: now,
                expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72hr TTL
            }));

            const { error: loadErr } = await supabase
                .from('hc_load_alerts')
                .upsert(loadRecords, { onConflict: 'dedup_key', ignoreDuplicates: true });

            if (loadErr) {
                console.error('[LOAD_INGEST] Insert error:', loadErr);
            }
        }

        // 2. Extract unique broker/dispatcher contacts → upsert as leads
        const uniqueBrokers = new Map<string, typeof parsed[0]>();
        for (const alert of parsed) {
            if (!uniqueBrokers.has(alert.phone_normalized)) {
                uniqueBrokers.set(alert.phone_normalized, alert);
            }
        }

        let brokersUpserted = 0;
        for (const [phone, alert] of uniqueBrokers) {
            // Check if this phone already exists in operators
            const { data: existing } = await supabase
                .from('operators')
                .select('id')
                .eq('phone', phone)
                .maybeSingle();

            if (!existing) {
                // Determine country_code from state
                const usStates = new Set([
                    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
                    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
                    'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
                ]);
                const countryCode = usStates.has(alert.origin_state) ? 'US' : 'CA';

                const { error: upsertErr } = await supabase
                    .from('operators')
                    .insert({
                        company_name: alert.company_name,
                        phone,
                        city: alert.origin_city || null,
                        state: alert.origin_state || null,
                        country_code: countryCode,
                        role_subtypes: ['broker', 'dispatcher'],
                        is_seeded: true,
                        source: 'load_board_alert',
                        source_detail: `Ingested from load alert batch ${batchId}`,
                        created_at: now,
                        updated_at: now,
                    });

                if (!upsertErr) brokersUpserted++;
            }
        }

        // 3. Corridor demand signals
        const corridorDemand = new Map<string, number>();
        for (const alert of parsed) {
            if (alert.origin_state && alert.destination_state) {
                const corridor = `${alert.origin_state}-${alert.destination_state}`;
                corridorDemand.set(corridor, (corridorDemand.get(corridor) || 0) + 1);
            }
        }

        // 4. PostHog batch event
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: 'system',
                        event: 'load_alerts_ingested',
                        properties: {
                            batch_id: batchId,
                            total: stats.total,
                            parsed: stats.parsed,
                            failed: stats.failed,
                            unique_brokers: stats.uniqueBrokers,
                            unique_corridors: stats.uniqueCorridors,
                            new_brokers_added: brokersUpserted,
                            positions: stats.positionBreakdown,
                            corridors: Object.fromEntries(corridorDemand),
                        },
                    }),
                });
            } catch { /* non-blocking */ }
        }

        return NextResponse.json({
            ok: true,
            batchId,
            stats: {
                ...stats,
                newBrokersAdded: brokersUpserted,
                corridorDemand: Object.fromEntries(corridorDemand),
            },
            parsed: parsed.map(p => ({
                company: p.company_name,
                phone: p.phone_normalized,
                route: `${p.origin_city}, ${p.origin_state} → ${p.destination_city}, ${p.destination_state}`,
                position: p.position_type,
                rate: p.rate_amount,
            })),
            failed,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
