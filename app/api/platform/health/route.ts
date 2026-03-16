// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE HEALTH API
// GET /api/platform/health — Returns current marketplace health per country
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country')?.toUpperCase();
    const entityType = searchParams.get('type') || 'country';
    const limit = parseInt(searchParams.get('limit') || '52');

    try {
        let query = supabase
            .from('marketplace_health_snapshots')
            .select('*')
            .eq('entity_type', entityType)
            .order('snapshot_at', { ascending: false })
            .limit(limit);

        if (country) {
            query = query.eq('country_code', country);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Deduplicate: latest snapshot per entity
        const latestByEntity = new Map<string, typeof data[0]>();
        for (const row of data || []) {
            if (!latestByEntity.has(row.entity_id)) {
                latestByEntity.set(row.entity_id, row);
            }
        }

        const snapshots = Array.from(latestByEntity.values());

        // Summary stats
        const healthCounts = { healthy: 0, warning: 0, critical: 0, dead: 0 };
        for (const s of snapshots) {
            const level = s.health_level as keyof typeof healthCounts;
            if (level in healthCounts) healthCounts[level]++;
        }

        return NextResponse.json({
            snapshots,
            summary: {
                total: snapshots.length,
                ...healthCounts,
                globalFillRate: snapshots.length > 0
                    ? snapshots.reduce((sum, s) => sum + (s.fill_rate || 0), 0) / snapshots.length
                    : 0,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load health data' }, { status: 500 });
    }
}
