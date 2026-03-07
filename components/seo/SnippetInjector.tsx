import React from 'react';
import {
    generateDefinitionBlock,
    generateFAQBlock,
    generateQuickTable,
    generateStepsList,
    type SnippetBlockType,
} from '@/lib/seo/long-tail-domination';

// ══════════════════════════════════════════════════════════════  
// SNIPPET BLOCK INJECTOR
// Reusable component that auto-adds featured-snippet-ready
// content blocks to any page:
//   - Definition box (40-60 words)
//   - FAQ cluster with schema.org FAQPage markup
//   - Quick reference table
//   - Step-by-step HowTo list
// ══════════════════════════════════════════════════════════════

interface SnippetInjectorProps {
    /** Which blocks to include */
    blocks: SnippetBlockType[];
    /** The primary service term (e.g., "pilot car") */
    term: string;
    /** Geographic location (e.g., "Florida", "Houston") */
    geo: string;
    /** Country ISO2 code */
    country: string;
    /** Optional custom styles */
    style?: React.CSSProperties;
}

const sectionStyle: React.CSSProperties = {
    marginBottom: 32,
};

const definitionBoxStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderRadius: 14,
    background: '#eff6ff',
    border: '1px solid #dbeafe',
    marginBottom: 24,
};

const faqWrapperStyle: React.CSSProperties = {
    marginBottom: 24,
};

const tableWrapperStyle: React.CSSProperties = {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    marginBottom: 24,
};

const stepsStyle: React.CSSProperties = {
    paddingLeft: 20,
    marginBottom: 24,
    fontSize: 15,
    lineHeight: 1.8,
    color: '#374151',
};

/**
 * SnippetInjector — Renders snippet-ready content blocks with schema markup.
 * 
 * Usage:
 * ```tsx
 * <SnippetInjector 
 *   blocks={['definition', 'faq', 'quick_table', 'steps']}
 *   term="pilot car"
 *   geo="Florida"
 *   country="US"
 * />
 * ```
 */
export function SnippetInjector({ blocks, term, geo, country, style }: SnippetInjectorProps) {
    return (
        <div style={{ ...sectionStyle, ...style }}>
            {blocks.map(blockType => (
                <SnippetBlockRenderer key={blockType} type={blockType} term={term} geo={geo} country={country} />
            ))}
        </div>
    );
}

function SnippetBlockRenderer({ type, term, geo, country }: { type: SnippetBlockType; term: string; geo: string; country: string }) {
    switch (type) {
        case 'definition': {
            const block = generateDefinitionBlock(term, geo, country);
            return (
                <>
                    {block.schemaMarkup && (
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...block.schemaMarkup }) }}
                        />
                    )}
                    <div style={definitionBoxStyle}>
                        <div dangerouslySetInnerHTML={{ __html: block.html }} style={{
                            fontSize: 16, lineHeight: 1.7, color: '#374151',
                        }} />
                    </div>
                </>
            );
        }

        case 'faq': {
            const block = generateFAQBlock(term, geo, country);
            return (
                <>
                    {block.schemaMarkup && (
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...block.schemaMarkup }) }}
                        />
                    )}
                    <div style={faqWrapperStyle}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f1729', marginBottom: 16 }}>
                            Frequently Asked Questions
                        </h2>
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />
                    </div>
                    <style>{`
                        [itemtype*="Question"] { margin-bottom: 16px; padding: 18px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
                        [itemtype*="Question"] h3 { font-size: 16px; font-weight: 700; color: #0f1729; margin: 0 0 8px; }
                        [itemtype*="Question"] p { margin: 0; color: #374151; font-size: 14px; line-height: 1.6; }
                    `}</style>
                </>
            );
        }

        case 'quick_table': {
            const block = generateQuickTable(term, geo, country);
            return (
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f1729', marginBottom: 16 }}>
                        Escort Requirements — {geo}
                    </h2>
                    <div style={tableWrapperStyle}>
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />
                    </div>
                    <style>{`
                        table { width: 100%; border-collapse: collapse; }
                        th { background: #f9fafb; padding: 12px 16px; text-align: left; font-weight: 700; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
                        td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; }
                        tr:hover td { background: #eff6ff; }
                    `}</style>
                </div>
            );
        }

        case 'steps': {
            const block = generateStepsList(term, geo);
            return (
                <>
                    {block.schemaMarkup && (
                        <script
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', ...block.schemaMarkup }) }}
                        />
                    )}
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f1729', marginBottom: 16 }}>
                            How to Book a {term.replace(/\b\w/g, c => c.toUpperCase())} in {geo}
                        </h2>
                        <div dangerouslySetInnerHTML={{ __html: block.html }} style={stepsStyle} />
                    </div>
                </>
            );
        }

        case 'cost_range': {
            return (
                <div style={{
                    padding: 20, borderRadius: 12,
                    background: '#fefce8', border: '1px solid #fde68a',
                    marginBottom: 24,
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#92400e', margin: '0 0 8px' }}>
                        💰 Typical {term.replace(/\b\w/g, c => c.toUpperCase())} Rates in {geo}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                        <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 10, border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>$250–$400</div>
                            <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>Standard Day Rate</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 10, border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>$1.50–$2.50</div>
                            <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>Per Mile Rate</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 10, border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>$500–$800</div>
                            <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>Specialized Load</div>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#92400e', marginTop: 10, fontStyle: 'italic' }}>
                        Rates vary by load type, distance, and jurisdiction. Get accurate quotes from verified operators.
                    </p>
                </div>
            );
        }

        case 'regulation_summary': {
            return (
                <div style={{
                    padding: 20, borderRadius: 12,
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    marginBottom: 24,
                }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>
                        📋 {geo} Escort Vehicle Regulations — Summary
                    </h3>
                    <ul style={{ margin: '10px 0 0', paddingLeft: 20, fontSize: 14, color: '#15803d', lineHeight: 1.8 }}>
                        <li>Loads exceeding <strong>8&apos;6&quot; width</strong> generally require at least 1 escort</li>
                        <li>Two escorts typically required above <strong>12&apos; width</strong></li>
                        <li>Height over <strong>14&apos;6&quot;</strong> requires height pole vehicle</li>
                        <li>Police escort may be required for <strong>superloads</strong> and urban routes</li>
                        <li>Permits required from state DOT for all oversize/overweight moves</li>
                    </ul>
                    <p style={{ fontSize: 12, color: '#166534', marginTop: 10, fontStyle: 'italic' }}>
                        Always verify current regulations with the local DOT. Rules differ by jurisdiction.
                    </p>
                </div>
            );
        }

        default:
            return null;
    }
}

export default SnippetInjector;
