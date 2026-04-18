import { createClient } from "@/utils/supabase/server";
import type { GlossaryTermMapEntry } from "@/components/glossary/SmartAutoLinker";

/**
 * Fetches the full glossary term map for the SmartAutoLinker.
 * Returns a Record<lowercase_term_or_alias, { slug, canonical_term }>
 *
 * This should be called server-side and passed as a prop to
 * the SmartAutoLinker component wherever it's used.
 *
 * Cached per-request via React `cache`.
 */
export async function getAutoLinkerTermMap(): Promise<
  Record<string, GlossaryTermMapEntry>
> {
  const supabase = await createClient();

  // Fetch all active terms
  const { data: terms } = await supabase
    .from("glo_terms")
    .select("slug, canonical_term")
    .eq("is_active", true)
    .eq("is_indexable", true);

  // Fetch all aliases
  const { data: aliases } = await supabase
    .from("glo_term_aliases")
    .select("alias, term_id, glo_terms!inner(slug, canonical_term)")
    .eq("glo_terms.is_active", true);

  const map: Record<string, GlossaryTermMapEntry> = {};

  if (terms) {
    for (const term of terms) {
      map[term.canonical_term.toLowerCase()] = {
        slug: term.slug,
        canonical_term: term.canonical_term,
      };
    }
  }

  if (aliases) {
    for (const alias of aliases as any[]) {
      if (alias.glo_terms) {
        map[alias.alias.toLowerCase()] = {
          slug: alias.glo_terms.slug,
          canonical_term: alias.glo_terms.canonical_term,
        };
      }
    }
  }

  return map;
}
