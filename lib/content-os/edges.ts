import { createClient } from "@/utils/supabase/server";

/**
 * Content OS — Unified Cross-System Link Fetcher
 *
 * Pulls all content_edges for a given entity (from any page family)
 * and groups them by target type for rendering.
 */
export async function getContentEdges(
  fromType: string,
  fromId: string
): Promise<Record<string, Array<{
  to_type: string;
  to_id: string;
  link_type: string;
  anchor_text: string | null;
  priority: number;
}>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_edges")
    .select("*")
    .eq("from_type", fromType)
    .eq("from_id", fromId)
    .order("priority", { ascending: false });

  const grouped: Record<string, typeof data> = {};
  for (const edge of data || []) {
    const key = edge.to_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(edge);
  }

  return grouped;
}

/**
 * Content OS — Reverse Edge Fetcher
 *
 * "What links here?" — Fetches all content that points TO this entity.
 * Essential for building "mentioned in" / "related from" sections.
 */
export async function getReverseContentEdges(
  toType: string,
  toId: string
): Promise<Record<string, Array<{
  from_type: string;
  from_id: string;
  link_type: string;
  anchor_text: string | null;
  priority: number;
}>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_edges")
    .select("*")
    .eq("to_type", toType)
    .eq("to_id", toId)
    .order("priority", { ascending: false });

  const grouped: Record<string, typeof data> = {};
  for (const edge of data || []) {
    const key = edge.from_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(edge);
  }

  return grouped;
}
