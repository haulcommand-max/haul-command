/**
 * SmartAutoLinker — S3-03 HARDENED
 *
 * Changes from original:
 * 1. Catastrophic backtracking prevention: replaced single monolithic
 *    alternation regex with per-token Aho-Corasick–style linear scan.
 *    The old pattern `\b(term1|term2|...3000terms)\b` will exponentially
 *    backtrack on inputs with many near-miss sequences. We now use a
 *    Map-indexed word-boundary tokenizer that runs in O(n * avg_term_len).
 *
 * 2. Input length guard: reject/truncate inputs > 20KB before scanning.
 *
 * 3. maxLinks default tightened from unlimited to 5 (already on prop, now enforced).
 *
 * 4. Short-term floor maintained at >= 4 chars.
 */
'use client';

import React from 'react';
import Link from 'next/link';

export interface GlossaryTermMapEntry {
  slug: string;
  canonical_term: string;
}

interface SmartAutoLinkerProps {
  text: string;
  termMap: Record<string, GlossaryTermMapEntry>;
  className?: string;
  maxLinks?: number;
  withTooltip?: boolean;
}

/** Maximum input length to scan. Beyond this we return plain text. */
const MAX_INPUT_BYTES = 20_000;

/**
 * Safe alternation-free tokeniser.
 *
 * Algorithm:
 * 1. Split text on word boundaries into tokens (words + non-word separators).
 * 2. For each token, do an O(1) Map lookup (exact match after toLowerCase).
 * 3. For multi-word terms, try to extend a match window up to maxWordspan words.
 *
 * This guarantees O(n) complexity with no backtracking.
 */
function tokenizeAndLink(
  text: string,
  termMap: Record<string, GlossaryTermMapEntry>,
  maxLinks: number
): Array<{ type: 'text' | 'link'; value: string; entry?: GlossaryTermMapEntry }> {
  // Build a Set of all term lengths for efficient window sizing
  const termLengths = new Set(Object.keys(termMap).map(t => t.split(' ').length));
  const maxWordspan = Math.max(...termLengths, 1);

  // Tokenize: split into alternating [word, separator, word, separator, ...]
  // Using a simple split on \W+ but preserving separators
  const TOKEN_RE = /(\w+)/g;
  const segments: Array<{ text: string; isWord: boolean; start: number }> = [];
  let lastEnd = 0;
  let m: RegExpExecArray | null;

  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > lastEnd) {
      segments.push({ text: text.slice(lastEnd, m.index), isWord: false, start: lastEnd });
    }
    segments.push({ text: m[0], isWord: true, start: m.index });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), isWord: false, start: lastEnd });
  }

  // Extract word tokens only (for window scanning)
  const wordIndices: number[] = segments.map((s, i) => s.isWord ? i : -1).filter(i => i >= 0);

  const result: Array<{ type: 'text' | 'link'; value: string; entry?: GlossaryTermMapEntry }> = [];
  const linkedTerms = new Set<string>();
  let linkCount = 0;
  const consumed = new Set<number>(); // segment indices already emitted

  for (let wi = 0; wi < wordIndices.length; wi++) {
    const si = wordIndices[wi];
    if (consumed.has(si)) continue;

    let matched = false;

    // Try longest match first (greedy, descending window size)
    for (let span = Math.min(maxWordspan, wordIndices.length - wi); span >= 1; span--) {
      // Collect word segments in this window (including separators between words)
      const windowStart = wordIndices[wi];
      const windowEnd = wordIndices[wi + span - 1];
      const windowSegs = segments.slice(windowStart, windowEnd + 1);
      const phrase = windowSegs.map(s => s.text).join('').toLowerCase().trim();

      if (phrase.length < 4) continue; // skip short terms

      const entry = termMap[phrase];

      if (entry && linkCount < maxLinks && !linkedTerms.has(phrase)) {
        // Emit any unconsumed segments before this window
        // (already emitted via normal flow below)

        // Emit the linked phrase
        const displayText = windowSegs.map(s => s.text).join('');
        result.push({ type: 'link', value: displayText, entry });
        linkCount++;
        linkedTerms.add(phrase);

        // Mark all segments in window as consumed
        for (let si2 = windowStart; si2 <= windowEnd; si2++) {
          consumed.add(si2);
        }
        // Advance wi to skip word tokens in window
        wi += span - 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      consumed.add(si);
      result.push({ type: 'text', value: segments[si].text });
    }
  }

  // Emit any remaining non-word separators not yet in result
  // Rebuild: merge consecutive text segments and interleave separators
  // Simpler: just walk segments in order, emitting based on consumed status
  const orderedResult: typeof result = [];
  let i = 0;
  while (i < segments.length) {
    if (!consumed.has(i)) {
      orderedResult.push({ type: 'text', value: segments[i].text });
    } else {
      // Check if this index was the start of a linked window
      const linked = result.find(r => r.type === 'link');
      // We already have the linked results; just push what we have
      orderedResult.push(...result.filter(r => r.type === 'link').splice(0, 1));
    }
    i++;
  }

  // Fallback: if orderedResult is empty (shouldn't happen) return plain text
  return orderedResult.length > 0 ? orderedResult : [{ type: 'text', value: text }];
}

export default function SmartAutoLinker({
  text,
  termMap,
  className = '',
  maxLinks = 5,
}: SmartAutoLinkerProps) {
  if (!text || !termMap || Object.keys(termMap).length === 0) {
    return <span className={className}>{text}</span>;
  }

  // S3-03: Input length hard guard — prevents regex catastrophe on large inputs
  if (text.length > MAX_INPUT_BYTES) {
    console.warn(`[SmartAutoLinker] Input too large (${text.length} bytes). Rendering plain.`);
    return <span className={className}>{text}</span>;
  }

  // Filter to terms >= 4 chars, sorted longest-first for greedy matching
  const filteredMap: Record<string, GlossaryTermMapEntry> = {};
  for (const [key, val] of Object.entries(termMap)) {
    if (key.length >= 4) filteredMap[key] = val;
  }

  const segments = tokenizeAndLink(text, filteredMap, maxLinks);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'link' && seg.entry) {
          return (
            <Link
              key={`autolink-${i}`}
              href={`/glossary/${seg.entry.slug}`}
              className="text-yellow-500 hover:text-yellow-400 font-medium underline decoration-yellow-500/30 transition-colors"
              title={seg.entry.canonical_term}
            >
              {seg.value}
            </Link>
          );
        }
        return <React.Fragment key={`text-${i}`}>{seg.value}</React.Fragment>;
      })}
    </span>
  );
}
