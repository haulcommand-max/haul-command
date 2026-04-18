import { supabase } from "@/lib/supabaseClient";

/**
 * Haul Command: Content OS RPC Pack
 * These Next.js edge functions fetch the ONE-SHOT payloads required by the Universal Layout blocks.
 */

// BLOG GRAPH
export async function getBlogArticle(slug: string) {
  const { data, error } = await supabase.rpc('get_blog_article_structured', { p_slug: slug });
  if (error) throw new Error(`Blog RPC Failed: ${error.message}`);
  return data;
}

// REGULATIONS GRAPH
export async function getRegulationJurisdiction(country: string, region: string | null = null) {
  const { data, error } = await supabase.rpc('get_reg_jurisdiction_structured', { p_country_code: country, p_region_code: region });
  if (error) throw new Error(`Regulation RPC Failed: ${error.message}`);
  return data;
}

// TOOLS GRAPH
export async function getTool(slug: string) {
  const { data, error } = await supabase.rpc('get_tool_structured', { p_slug: slug });
  if (error) throw new Error(`Tool RPC Failed: ${error.message}`);
  return data;
}

/**
 * Cross-System Inference (The Graph Link System)
 * Prevents ORPHANED PAGES. If a regulation lacks explicit links, this automatically
 * queries the graph for related tools and glossary terms based on string overlap.
 */
export async function getInferredGraphAdjacency(scope: { country?: string; textChunk?: string }) {
   // A unified call that returns related entities to satisfy the Intent Router
   const { data, error } = await supabase
       .from('tool_catalog')
       .select('name, slug, quick_answer')
       .textSearch('metadata', scope.textChunk || '', { config: 'english' })
       .limit(3);
   
   return data || [];
}
