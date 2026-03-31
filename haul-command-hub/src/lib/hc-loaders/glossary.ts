import { supabase } from '@/lib/supabase';

export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  short_definition: string;
  long_definition: string | null;
  category: string;
  surface_categories: string[];
  applicable_countries: string[];
  synonyms: string[];
  acronyms: string[];
  tags: string[];
  jurisdiction: string | null;
  related_tools: any[];
  related_rules: any[];
  related_services: any[];
  related_corridors: any[];
  related_entities: any[];
  related_problems: any[];
  why_it_matters: string | null;
  source_confidence: number;
}

/**
 * Retrieves all glossary terms from the `glossary_public` view.
 */
export async function fetchGlossaryTerms(): Promise<GlossaryTerm[]> {
  try {
    const { data, error } = await supabase
      .from('glossary_public')
      .select('*')
      .order('term', { ascending: true });

    if (error || !data) {
      console.error('Failed to fetch glossary_public:', error);
      return [];
    }
    return data as GlossaryTerm[];
  } catch (err) {
    console.error('Network catch for glossary_public:', err);
    return [];
  }
}

/**
 * Retrieves a single glossary term by slug from `glossary_public`.
 */
export async function fetchGlossaryTermBySlug(slug: string): Promise<GlossaryTerm | null> {
  try {
    const { data, error } = await supabase
      .from('glossary_public')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }
    return data as GlossaryTerm;
  } catch (err) {
    console.error('Network catch for glossary_public by slug:', err);
    return null;
  }
}
