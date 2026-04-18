import { supabase } from "@/lib/supabaseClient";

/**
 * Haul Command: Content Graph RPC Layer
 * Extends the core Content OS RPCs with graph intelligence functions.
 */

// ORPHAN DETECTION
export async function detectOrphans() {
  const { data, error } = await supabase.rpc('detect_content_orphans');
  if (error) throw new Error(`Orphan detection RPC failed: ${error.message}`);
  return data || [];
}

// DEAD-END DETECTION
export async function detectDeadEnds() {
  const { data, error } = await supabase.rpc('detect_content_dead_ends');
  if (error) throw new Error(`Dead-end detection RPC failed: ${error.message}`);
  return data || [];
}

// STALENESS QUEUE TRIGGER
export async function triggerStalenessQueue() {
  const { data, error } = await supabase.rpc('queue_stale_content');
  if (error) throw new Error(`Staleness queue RPC failed: ${error.message}`);
  return data; // Returns count of newly queued items
}

// REGISTER A NODE IN THE GRAPH
export async function registerContentNode(params: {
  page_family: string;
  entity_id: string;
  entity_title: string;
  canonical_url: string;
  country_code?: string;
  region_code?: string;
}) {
  const { data, error } = await supabase
    .from('content_nodes')
    .upsert(params, { onConflict: 'page_family,entity_id' })
    .select()
    .single();
  if (error) throw new Error(`Node registration failed: ${error.message}`);
  return data;
}

// CREATE AN EDGE (INTERNAL LINK)
export async function createContentEdge(params: {
  source_node_id: string;
  target_node_id: string;
  edge_type: string;
  anchor_text?: string;
  rel_attribute?: string; // 'sponsored' | 'ugc' | null
}) {
  const { data, error } = await supabase
    .from('content_edges')
    .upsert(params, { onConflict: 'source_node_id,target_node_id,edge_type' })
    .select()
    .single();
  if (error) throw new Error(`Edge creation failed: ${error.message}`);
  return data;
}

// GET REVIEW QUEUE (for admin dashboard)
export async function getReviewQueue(limit = 50) {
  const { data, error } = await supabase
    .from('content_review_queue')
    .select('*, content_nodes(*)')
    .is('resolved_at', null)
    .order('queued_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Review queue fetch failed: ${error.message}`);
  return data || [];
}

// CANONICAL TRUST COUNT (Single Source of Truth)
// This resolves the "15,000 vs 24,164" conflict
export async function getCanonicalTrustCounts() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  const profileCount = data ? (error ? 0 : (data as any)) : 0;

  const { count: activeLoads } = await supabase
    .from('loads')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: toolCount } = await supabase
    .from('tool_catalog')
    .select('id', { count: 'exact', head: true });

  return {
    verified_operators: profileCount || 0,
    active_loads: activeLoads || 0,
    tool_count: toolCount || 0,
  };
}
