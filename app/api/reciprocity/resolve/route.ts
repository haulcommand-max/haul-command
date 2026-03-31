import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * RECIPROCITY GRAPH ENGINE API — TASK 3
 * 
 * POST /api/reciprocity/resolve
 * Body: { source_jurisdiction_id, target_jurisdiction_id, operator_certs? }
 *
 * Calls the resolve_reciprocity_path RPC which:
 * 1. Checks for a direct edge (A→B)
 * 2. If addon_required, checks if the operator already holds the addon cert
 * 3. If no direct edge, tries a 2-hop path (A→C→B) with cost optimization
 * 4. Returns the cheapest path with all required addons, estimated costs, and days
 */
export async function POST(request: Request) {
  try {
    const { source_jurisdiction_id, target_jurisdiction_id, operator_certs } = await request.json();

    if (!source_jurisdiction_id || !target_jurisdiction_id) {
      return NextResponse.json(
        { error: 'source_jurisdiction_id and target_jurisdiction_id are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc('resolve_reciprocity_path', {
      p_source_jurisdiction: source_jurisdiction_id,
      p_target_jurisdiction: target_jurisdiction_id,
      p_operator_certs: operator_certs || [],
    });

    if (error) {
      console.error('[Reciprocity Resolve] RPC error:', error);
      return NextResponse.json({ error: 'Reciprocity resolution failed', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Reciprocity Resolve] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
