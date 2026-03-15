/**
 * Decode common HTML entities that leak from database/API strings.
 * Handles the most common offenders: &amp; &#39; &quot; &lt; &gt; &#x27; &#x2F;
 * Safe to call on strings that don't contain entities.
 */
export function decodeEntities(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&#0?39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#0?34;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x2F;/g, '/')
        .replace(/&nbsp;/g, ' ');
}
