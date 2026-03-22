/**
 * lib/utils/decode-html.ts
 *
 * Decodes HTML entities in strings.
 * Applied to all operator names before rendering.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&amp;': '&',
  '&quot;': '"',
  '&#34;': '"',
  '&#x22;': '"',
  '&lt;': '<',
  '&#60;': '<',
  '&gt;': '>',
  '&#62;': '>',
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&ndash;': '–',
  '&#8211;': '–',
  '&mdash;': '—',
  '&#8212;': '—',
};

const ENTITY_REGEX = new RegExp(Object.keys(HTML_ENTITIES).join('|'), 'gi');

export function decodeHTML(input: string): string {
  if (!input) return input;
  return input.replace(ENTITY_REGEX, (match) => HTML_ENTITIES[match.toLowerCase()] ?? match);
}

/**
 * Decode all common HTML entities from operator names.
 * Use before rendering any name from directory_listings.
 */
export function cleanOperatorName(name: string): string {
  if (!name) return name;
  let result = decodeHTML(name);
  // Also fix common encoding artifacts
  result = result.replace(/\s{2,}/g, ' ').trim();
  return result;
}
