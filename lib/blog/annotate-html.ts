/**
 * Server-side HTML annotation for glossary terms.
 *
 * Unlike the client-side `annotateText()` in GlossaryInlineLink.tsx which operates
 * on plain text and returns React nodes, this function works on raw HTML strings
 * and injects <a> tags with tooltip data attributes — compatible with
 * `dangerouslySetInnerHTML` rendering used by the blog.
 *
 * Only annotates the first occurrence of each term per document.
 * Skips content inside headings, code blocks, and existing links.
 */

import { createClient } from '@/lib/supabase/server';

export interface GlossaryAnnotation {
  slug: string;
  term: string;
  shortDefinition: string;
  category?: string | null;
}

/**
 * Fetch glossary terms for annotation from the glossary_public view.
 * Returns a map of normalized term → annotation data.
 */
export async function fetchGlossaryMap(): Promise<Map<string, GlossaryAnnotation>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('glossary_public')
      .select('slug, term, short_definition, category')
      .order('term', { ascending: true })
      .limit(500);

    if (error || !data) return new Map();

    const map = new Map<string, GlossaryAnnotation>();
    for (const row of data) {
      const key = row.term.toLowerCase();
      if (key.length >= 4) { // Skip very short terms to avoid false matches
        map.set(key, {
          slug: row.slug,
          term: row.term,
          shortDefinition: row.short_definition,
          category: row.category,
        });
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Annotate HTML content with glossary links.
 * Injects <a> tags with class "glossary-inline-link" and data attributes
 * for client-side tooltip rendering.
 *
 * Rules:
 * - Only annotates first occurrence per term
 * - Skips content inside <h1>-<h6>, <code>, <pre>, <a> tags
 * - Sorts terms by length descending (longer matches first)
 * - Maximum 15 annotations per document to avoid over-linking
 */
export function annotateHtml(
  html: string,
  glossaryMap: Map<string, GlossaryAnnotation>,
  maxAnnotations = 15,
): string {
  if (!html || glossaryMap.size === 0) return html;

  // Sort terms by length descending
  const entries = Array.from(glossaryMap.entries())
    .sort((a, b) => b[0].length - a[0].length);

  let annotatedCount = 0;
  let result = html;
  const annotated = new Set<string>();

  for (const [normalizedTerm, data] of entries) {
    if (annotatedCount >= maxAnnotations) break;
    if (annotated.has(data.slug)) continue;

    // Build regex that matches the term as a whole word, case-insensitive,
    // but NOT inside HTML tags or certain elements
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
      // Negative lookbehind for being inside a tag attribute or heading/code/link content
      `(?<![<\\/\\w])\\b(${escaped})\\b(?![^<]*?>)`,
      'i',
    );

    const match = result.match(pattern);
    if (!match || match.index === undefined) continue;

    // Check if the match position is inside a protected element
    const before = result.slice(0, match.index);
    if (isInsideProtectedElement(before)) continue;

    const linkHtml =
      `<a href="/glossary/${data.slug}" ` +
      `class="glossary-inline-link" ` +
      `data-glossary-term="${escapeAttr(data.term)}" ` +
      `data-glossary-def="${escapeAttr(data.shortDefinition)}" ` +
      `style="text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;text-decoration-color:rgba(212,168,67,0.6);color:inherit;cursor:pointer;" ` +
      `title="${escapeAttr(data.shortDefinition)}"` +
      `>${match[1]}</a>`;

    result =
      result.slice(0, match.index) +
      linkHtml +
      result.slice(match.index + match[0].length);

    annotated.add(data.slug);
    annotatedCount++;
  }

  return result;
}

/**
 * Check if the current position is inside a heading, code, pre, or link element.
 * Uses a simple tag-counting heuristic.
 */
function isInsideProtectedElement(beforeText: string): boolean {
  const protectedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'a', 'script', 'style'];

  for (const tag of protectedTags) {
    const openPattern = new RegExp(`<${tag}[\\s>]`, 'gi');
    const closePattern = new RegExp(`</${tag}>`, 'gi');
    const opens = (beforeText.match(openPattern) || []).length;
    const closes = (beforeText.match(closePattern) || []).length;
    if (opens > closes) return true;
  }

  return false;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
