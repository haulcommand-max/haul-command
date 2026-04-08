import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/leaderboards/{board_key} — Get leaderboard entries
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { board_key: string } },
) {
    try {
        const db = supabase();

        // Resolve board
        const { data: board, error: bErr } = await db
            .from('lbd_boards')
            .select('id, board_key, display_name, scope_type, country_code, period_type, current_period_start, max_entries')
            .eq('board_key', params.board_key)
            .eq('is_active', true)
            .single();

        if (bErr || !board) {
            return NextResponse.json({ error: `Board '${params.board_key}' not found` }, { status: 404 });
        }

        // Get scores with entity names
        const { data: scores } = await db
            .from('lbd_scores')
            .select(`
                entity_id, score_total, score_components,
                rank, rank_change, period_start
            `)
            .eq('board_id', board.id)
            .order('rank', { ascending: true, nullsFirst: false })
            .limit(board.max_entries || 100);

        // Enrich entries
        const entries = [];
        for (const s of scores || []) {
            const { data: entity } = await db
                .from('hc_entities')
                .select('canonical_name, entity_type, country_code')
                .eq('id', s.entity_id)
                .single();

            const { data: badges } = await db
                .from('lbd_entity_badges')
                .select('badge_id')
                .eq('entity_id', s.entity_id)
                .eq('is_active', true);

            const badgeKeys: string[] = [];
            for (const b of badges || []) {
                const { data: badge } = await db
                    .from('lbd_badges')
                    .select('badge_key')
                    .eq('id', b.badge_id)
                    .single();
                if (badge) badgeKeys.push(badge.badge_key);
            }

            entries.push({
                entity_id: s.entity_id,
                entity_name: entity?.canonical_name || 'Unknown',
                entity_type: entity?.entity_type,
                score_total: s.score_total,
                rank: s.rank,
                rank_change: s.rank_change,
                badges: badgeKeys,
            });
        }

        return NextResponse.json({
            board_key: board.board_key,
            display_name: board.display_name,
            scope_type: board.scope_type,
            country_code: board.country_code,
            period_type: board.period_type,
            entries,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
