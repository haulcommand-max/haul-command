/**
 * ONE-TIME MIGRATION ENDPOINT
 * POST /api/admin/migrate
 * 
 * Runs DDL via supabase-js .rpc() after first creating exec_sql function.
 * Protected by HC_ADMIN_SECRET.
 * DELETE AFTER USE.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-admin-secret') || '';
    const adminSecret = process.env.HC_ADMIN_SECRET || '';
    
    if (!adminSecret || secret !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use pg directly with the database URL from environment
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
    
    // If no Postgres URL, try constructing from Supabase vars
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    // Try Supabase Management API approach via fetch
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    
    const STATEMENTS = [
        `CREATE TABLE IF NOT EXISTS ai_usage_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), product TEXT NOT NULL, tier TEXT NOT NULL DEFAULT 'free', is_overage BOOLEAN DEFAULT false, cost_usd NUMERIC(10,4) DEFAULT 0, metadata JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log(user_id, created_at)`,
        `CREATE TABLE IF NOT EXISTS api_keys (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), key_hash TEXT UNIQUE NOT NULL, tier TEXT DEFAULT 'pro', is_active BOOLEAN DEFAULT true, daily_requests INT DEFAULT 0, last_request_date DATE, created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS api_usage_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, endpoint TEXT, query_type TEXT, query_params JSONB DEFAULT '{}', tier TEXT DEFAULT 'explore', "timestamp" TIMESTAMPTZ DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS dispatch_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), broker_id UUID REFERENCES auth.users(id), origin TEXT, origin_state TEXT, destination TEXT, destination_state TEXT, load_type TEXT, dimensions JSONB, date_needed DATE, positions_needed TEXT[], budget_range JSONB, status TEXT DEFAULT 'pending', wave INT DEFAULT 1, candidates UUID[], fill_probability NUMERIC(4,2), created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS hold_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), broker_id UUID REFERENCES auth.users(id), operator_id UUID REFERENCES auth.users(id), origin TEXT, destination TEXT, date_needed DATE, position TEXT DEFAULT 'chase', load_type TEXT DEFAULT 'oversize', notes TEXT, status TEXT DEFAULT 'pending', expires_at TIMESTAMPTZ, responded_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE INDEX IF NOT EXISTS idx_hold_operator ON hold_requests(operator_id, status)`,
        `CREATE TABLE IF NOT EXISTS notification_queue (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id), type TEXT NOT NULL, title TEXT, body TEXT, data JSONB DEFAULT '{}', channel TEXT DEFAULT 'push', sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE INDEX IF NOT EXISTS idx_notif_user ON notification_queue(user_id, created_at)`,
        `CREATE TABLE IF NOT EXISTS stripe_webhook_events (stripe_event_id TEXT PRIMARY KEY, event_type TEXT, account_id UUID, payload JSONB, processing_status TEXT DEFAULT 'pending', processed_at TIMESTAMPTZ, error_message TEXT, created_at TIMESTAMPTZ DEFAULT now())`,
        `CREATE TABLE IF NOT EXISTS driver_presence (user_id UUID PRIMARY KEY REFERENCES auth.users(id), is_available BOOLEAN DEFAULT false, last_seen_at TIMESTAMPTZ DEFAULT now(), lat DOUBLE PRECISION, lng DOUBLE PRECISION, city TEXT, state TEXT, country_code TEXT DEFAULT 'US', created_at TIMESTAMPTZ DEFAULT now())`,
        `ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE dispatch_requests ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE hold_requests ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE driver_presence ENABLE ROW LEVEL SECURITY`,
    ];

    const results: { sql: string; status: string; error?: string }[] = [];

    // Method 1: Try pg with POSTGRES_URL (multiple variants)
    const dbUrls = [
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_URL,
        process.env.DATABASE_URL,
    ].filter(Boolean) as string[];

    for (const dbUrl of dbUrls) {
        try {
            // Bypass self-signed certificate check for Supabase connection
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            const pg = await import('pg');
            const client = new pg.default.Client({ 
                connectionString: dbUrl, 
                ssl: { rejectUnauthorized: false } 
            });
            await client.connect();
            
            for (const sql of STATEMENTS) {
                try {
                    await client.query(sql);
                    results.push({ sql: sql.substring(0, 60), status: 'ok' });
                } catch (e: any) {
                    if (e.message?.includes('already exists')) {
                        results.push({ sql: sql.substring(0, 60), status: 'exists' });
                    } else {
                        results.push({ sql: sql.substring(0, 60), status: 'error', error: e.message });
                    }
                }
            }
            await client.end();
            
            return NextResponse.json({
                method: 'pg_direct',
                total: STATEMENTS.length,
                ok: results.filter(r => r.status === 'ok' || r.status === 'exists').length,
                failed: results.filter(r => r.status === 'error').length,
                results,
            });
        } catch (pgErr: any) {
            // Fall through to method 2
            results.push({ sql: 'pg_connect', status: 'error', error: pgErr.message });
        }
    }

    // Method 2: Try Supabase SQL endpoint
    const sqlEndpoint = `${supabaseUrl}/pg/query`;
    try {
        for (const sql of STATEMENTS) {
            const res = await fetch(sqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ query: sql }),
            });
            
            if (res.ok) {
                results.push({ sql: sql.substring(0, 60), status: 'ok' });
            } else {
                const errBody = await res.text();
                results.push({ sql: sql.substring(0, 60), status: 'error', error: `${res.status}: ${errBody.substring(0, 100)}` });
            }
        }
    } catch (e: any) {
        results.push({ sql: 'supabase_sql', status: 'error', error: e.message });
    }

    return NextResponse.json({
        method: 'supabase_sql',
        dbUrl_available: !!dbUrl,
        supabaseUrl_available: !!supabaseUrl,
        serviceKey_available: !!serviceKey,
        projectRef,
        total: STATEMENTS.length,
        ok: results.filter(r => r.status === 'ok' || r.status === 'exists').length,
        failed: results.filter(r => r.status === 'error').length,
        results,
    });
}
