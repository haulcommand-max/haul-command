import React from 'react';
import Link from 'next/link';

interface GlossaryTermCardProps {
    term: string;
    definition: string;
    category?: string;
    relatedTerms?: string[];
    slug?: string;
}

export function GlossaryTermCard({ term, definition, category, relatedTerms = [], slug }: GlossaryTermCardProps) {
    // Generate a fallback slug if one isn't provided (for terms pulled directly from escort-terminology)
    const termSlug = slug || term.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return (
        <div style={{
            background: '#121214',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden'
        }} className="hover:bg-[#1A1A1E] hover:border-[#D4A844]/25 hover:-translate-y-1 group">
            <div style={{ 
                position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, 
                background: 'rgba(255,255,255,0.04)' 
            }} className="group-hover:bg-gradient-to-b group-hover:from-[#D4A844] group-hover:to-[#D4A844]/30 transition-all duration-300" />
            
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: category ? 8 : 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12 }} className="group-hover:text-[#D4A844] transition-colors">
                <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{term}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 -translate-x-1" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18 }}>→</span>
            </h3>

            {category && (
                <div style={{ paddingLeft: 12, marginBottom: 12 }}>
                    <span style={{
                        fontSize: 9,
                        textTransform: 'uppercase',
                        fontWeight: 900,
                        letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.06)'
                    }} className="group-hover:border-[#D4A844]/15 group-hover:text-[#D4A844]/50 transition-colors">
                        {category}
                    </span>
                </div>
            )}

            <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                paddingLeft: 12,
                flex: 1,
                margin: 0
            }}>
                {definition}
            </p>

            {relatedTerms.length > 0 && (
                <div style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingLeft: 12,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6
                }}>
                    {relatedTerms.slice(0, 3).map(rt => (
                        <span key={rt} style={{
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.02)',
                            padding: '2px 6px',
                            borderRadius: 4
                        }}>
                            {rt}
                        </span>
                    ))}
                </div>
            )}
            
            <Link href={`/glossary/${termSlug}`} className="absolute inset-0 z-10" aria-label={`View full definition for ${term}`}>
                <span className="sr-only">View Definition</span>
            </Link>
        </div>
    );
}

export default GlossaryTermCard;
