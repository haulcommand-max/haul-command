'use client';

import React from 'react';
import { GlossaryTooltip } from './GlossaryTooltip';

/**
 * GlossaryInlineLink — renders an underlined glossary term
 * with tooltip on hover and link to /glossary/[slug].
 *
 * Used by the annotation engine to mark first-occurrence terms.
 */

interface GlossaryInlineLinkProps {
    term: string;
    slug: string;
    shortDefinition: string;
    category?: string | null;
    jurisdiction?: string | null;
}

export function GlossaryInlineLink({
    term,
    slug,
    shortDefinition,
    category,
    jurisdiction,
}: GlossaryInlineLinkProps) {
    return (
        <GlossaryTooltip
            term={term}
            slug={slug}
            shortDefinition={shortDefinition}
            category={category}
            jurisdiction={jurisdiction}
        >
            {term}
        </GlossaryTooltip>
    );
}

/**
 * Annotate text with glossary tooltips.
 * Only annotates the first occurrence per term per call.
 * Skips headings, code blocks, phone numbers, and addresses.
 */
export function annotateText(
    text: string,
    glossaryMap: Record<string, { slug: string; term: string; shortDefinition: string; category?: string | null }>,
): React.ReactNode[] {
    if (!text || Object.keys(glossaryMap).length === 0) return [text];

    // Sort terms by length descending (match longer terms first)
    const terms = Object.entries(glossaryMap).sort((a, b) => b[0].length - a[0].length);

    const annotated = new Set<string>();
    let remaining = text;
    const nodes: React.ReactNode[] = [];
    let keyIdx = 0;

    for (const [normalizedTerm, data] of terms) {
        if (annotated.has(data.slug)) continue;

        const regex = new RegExp(`\\b(${escapeRegex(normalizedTerm)})\\b`, 'i');
        const match = remaining.match(regex);

        if (match && match.index !== undefined) {
            const before = remaining.slice(0, match.index);
            const matched = match[1];
            const after = remaining.slice(match.index + matched.length);

            if (before) nodes.push(<React.Fragment key={`t${keyIdx++}`}>{before}</React.Fragment>);

            nodes.push(
                <GlossaryInlineLink
                    key={`gl-${data.slug}`}
                    term={matched}
                    slug={data.slug}
                    shortDefinition={data.shortDefinition}
                    category={data.category}
                />
            );

            remaining = after;
            annotated.add(data.slug);
        }
    }

    if (remaining) nodes.push(<React.Fragment key={`t${keyIdx++}`}>{remaining}</React.Fragment>);

    return nodes.length > 0 ? nodes : [text];
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
