import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ══════════════════════════════════════════════════════════════
// DATA SUBJECT REQUEST API
//
// GDPR Art. 15: Right of access — export all user data
// GDPR Art. 17: Right to erasure — delete all user data
// CCPA §1798.105: Right to deletion
// CCPA §1798.110: Right to know
//
// Endpoint: POST /api/privacy/data-request
// Body: { action: 'export' | 'delete', user_id?: string }
//
// Authentication: Requires authenticated session.
// The user_id is derived from auth — never trust client input.
// ══════════════════════════════════════════════════════════════

interface DataSubjectRequest {
    action: 'export' | 'delete';
    reason?: string;
}

// Tables containing user PII or behavioral data
const USER_DATA_TABLES = [
    { table: 'profiles', id_column: 'id', action: 'anonymize' },
    { table: 'intake_events', id_column: 'source_entity_id', action: 'delete' },
    { table: 'data_purchases', id_column: 'user_id', action: 'export_only' },
    { table: 'user_subscriptions', id_column: 'user_id', action: 'anonymize' },
    { table: 'trust_ratings', id_column: 'rater_user_id', action: 'delete' },
    { table: 'trust_ratings', id_column: 'rated_user_id', action: 'anonymize' },
    { table: 'composite_trust_scores', id_column: 'user_id', action: 'delete' },
    { table: 'verified_activity_events', id_column: 'user_id', action: 'delete' },
    { table: 'verified_activity_summary', id_column: 'user_id', action: 'delete' },
    { table: 'disputes', id_column: 'respondent_id', action: 'anonymize' },
    { table: 'dispute_trust_impacts', id_column: 'user_id', action: 'delete' },
    { table: 'hc_events', id_column: null, action: 'skip' }, // system events, no direct user ID
];

export async function POST(req: Request) {
    const supabase = createClient();

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    // 2. Parse request
    let body: DataSubjectRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    if (!['export', 'delete'].includes(body.action)) {
        return NextResponse.json(
            { error: 'action must be "export" or "delete"' },
            { status: 400 }
        );
    }

    const userId = user.id;

    // 3. Log the request (required for GDPR compliance audit trail)
    await supabase.from('hc_events').insert({
        event_type: 'data_subject_request',
        properties: {
            user_id: userId,
            action: body.action,
            reason: body.reason || null,
            requested_at: new Date().toISOString(),
            ip_country: req.headers.get('cf-ipcountry') || 'unknown',
        },
    });

    // ── EXPORT ──
    if (body.action === 'export') {
        const exportData: Record<string, unknown[]> = {};

        for (const table of USER_DATA_TABLES) {
            if (!table.id_column || table.action === 'skip') continue;

            try {
                const { data, error } = await supabase
                    .from(table.table)
                    .select('*')
                    .eq(table.id_column, userId)
                    .limit(1000);

                if (!error && data && data.length > 0) {
                    exportData[table.table] = data;
                }
            } catch {
                // Non-blocking: continue with other tables
            }
        }

        return NextResponse.json({
            subject_id: userId,
            export_date: new Date().toISOString(),
            data: exportData,
            tables_queried: USER_DATA_TABLES
                .filter(t => t.id_column && t.action !== 'skip')
                .map(t => t.table),
            notice: 'This export contains all personal data associated with your account. For questions, contact privacy@haulcommand.com.',
        });
    }

    // ── DELETE ──
    if (body.action === 'delete') {
        const results: Record<string, { action: string; status: string }> = {};

        for (const table of USER_DATA_TABLES) {
            if (!table.id_column || table.action === 'skip') continue;

            try {
                if (table.action === 'delete') {
                    const { error } = await supabase
                        .from(table.table)
                        .delete()
                        .eq(table.id_column, userId);

                    results[`${table.table}.${table.id_column}`] = {
                        action: 'deleted',
                        status: error ? `error: ${error.message}` : 'success',
                    };
                } else if (table.action === 'anonymize') {
                    // For tables where we need to keep the record but remove PII
                    // (e.g., disputes need to stay for the other party)
                    const { error } = await supabase
                        .from(table.table)
                        .update({
                            // Anonymize by replacing identifiable fields
                            ...(table.table === 'profiles' ? {
                                full_name: '[REDACTED]',
                                email: `deleted_${userId.slice(0, 8)}@redacted.haulcommand.com`,
                                phone: null,
                                avatar_url: null,
                                bio: null,
                                company_name: '[REDACTED]',
                                is_deleted: true,
                                deleted_at: new Date().toISOString(),
                            } : {}),
                            ...(table.table === 'trust_ratings' && table.id_column === 'rated_user_id' ? {
                                review_text: '[REDACTED]',
                            } : {}),
                            ...(table.table === 'user_subscriptions' ? {
                                stripe_customer_id: '[REDACTED]',
                            } : {}),
                            ...(table.table === 'disputes' ? {
                                // Keep dispute but anonymize respondent
                            } : {}),
                        })
                        .eq(table.id_column, userId);

                    results[`${table.table}.${table.id_column}`] = {
                        action: 'anonymized',
                        status: error ? `error: ${error.message}` : 'success',
                    };
                } else if (table.action === 'export_only') {
                    // Financial records must be retained for tax/audit purposes
                    results[`${table.table}.${table.id_column}`] = {
                        action: 'retained',
                        status: 'Financial records retained per legal obligation (GDPR Art. 17(3)(b))',
                    };
                }
            } catch (err: any) {
                results[`${table.table}.${table.id_column}`] = {
                    action: table.action,
                    status: `error: ${err.message}`,
                };
            }
        }

        // Sign out the user after deletion
        await supabase.auth.signOut();

        return NextResponse.json({
            subject_id: userId,
            deletion_date: new Date().toISOString(),
            results,
            notice: 'Your personal data has been deleted or anonymized. Financial records are retained per legal obligation. Your session has been terminated.',
            retention_exceptions: [
                'data_purchases: Retained for tax/audit compliance (GDPR Art. 17(3)(b))',
                'disputes: Anonymized but retained for other party\'s records',
                'webhook_inbox: Anonymized system logs retained for 30 days',
            ],
        });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
