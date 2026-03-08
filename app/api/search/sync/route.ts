/**
 * POST /api/search/sync
 * 
 * Syncs operators from Supabase → Typesense.
 * Called by cron job or admin trigger.
 * Creates collection if not exists, then bulk imports.
 * 
 * Phase 1: typesense_install_and_sync
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    getTypesenseAdmin,
    OPERATORS_COLLECTION,
    OPERATORS_SCHEMA,
    operatorToDocument,
} from '@/lib/typesense/client';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    // Admin-only: require secret header
    const authHeader = req.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const typesense = getTypesenseAdmin();
    const supabase = getSupabase();

    try {
        // 1. Ensure collection exists
        try {
            await typesense.collections(OPERATORS_COLLECTION).retrieve();
        } catch {
            // Collection doesn't exist — create it
            await typesense.collections().create(OPERATORS_SCHEMA);
            console.log('[TYPESENSE_SYNC] Created operators collection');
        }

        // 2. Fetch operators from Supabase (paginated)
        const PAGE_SIZE = 1000;
        let offset = 0;
        let totalSynced = 0;
        let totalErrors = 0;

        while (true) {
            const { data: operators, error } = await supabase
                .from('operators')
                .select('*')
                .order('updated_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (error) {
                console.error('[TYPESENSE_SYNC] Supabase fetch error:', error);
                break;
            }

            if (!operators || operators.length === 0) break;

            // Convert to Typesense documents
            const documents = operators.map(op => operatorToDocument(op));

            // Bulk import with upsert
            try {
                const results = await typesense
                    .collections(OPERATORS_COLLECTION)
                    .documents()
                    .import(documents, { action: 'upsert' });

                const success = results.filter((r: { success: boolean }) => r.success).length;
                const errors = results.filter((r: { success: boolean }) => !r.success).length;
                totalSynced += success;
                totalErrors += errors;

                if (errors > 0) {
                    const failed = results.filter((r: { success: boolean; error?: string }) => !r.success).slice(0, 3);
                    console.warn('[TYPESENSE_SYNC] Import errors:', JSON.stringify(failed));
                }
            } catch (importErr) {
                console.error('[TYPESENSE_SYNC] Bulk import error:', importErr);
                totalErrors += operators.length;
            }

            // If we got less than PAGE_SIZE, we're done
            if (operators.length < PAGE_SIZE) break;
            offset += PAGE_SIZE;
        }

        // 3. Get collection stats
        const collection = await typesense.collections(OPERATORS_COLLECTION).retrieve();

        console.log(`[TYPESENSE_SYNC] Complete: ${totalSynced} synced, ${totalErrors} errors, ${collection.num_documents} total in index`);

        return NextResponse.json({
            ok: true,
            synced: totalSynced,
            errors: totalErrors,
            totalInIndex: collection.num_documents,
            timestamp: new Date().toISOString(),
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        console.error('[TYPESENSE_SYNC] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
