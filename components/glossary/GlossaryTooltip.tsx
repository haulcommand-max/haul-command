'use client';

/**
 * GlossaryTooltip — hover/tap tooltip with term definition.
 * Mobile-friendly: tap to open, tap outside to close.
 */

import { useState, useRef, useEffect } from 'react';

interface GlossaryTooltipProps {
    term: string;
    slug: string;
    shortDefinition: string;
    category?: string | null;
    jurisdiction?: string | null;
    children: React.ReactNode;
}

export function GlossaryTooltip({
    term,
    slug,
    shortDefinition,
    category,
    jurisdiction,
    children,
}: GlossaryTooltipProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('click', handler, { capture: true });
        return () => document.removeEventListener('click', handler, { capture: true });
    }, [open]);

    return (
        <span ref={ref} className="glossary-tooltip-wrap" style={{ position: 'relative', display: 'inline' }}>
            <span
                className="glossary-term-link"
                onClick={() => setOpen(o => !o)}
                onMouseEnter={() => setOpen(true)}
                style={{
                    borderBottom: '1px dotted rgba(56,189,248,0.5)',
                    cursor: 'pointer',
                    color: 'inherit',
                }}
            >
                {children}
            </span>
            {open && (
                <span
                    className="glossary-tooltip"
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        minWidth: '220px',
                        maxWidth: '320px',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                        {term}
                    </strong>
                    {(category || jurisdiction) && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
                            {[category, jurisdiction].filter(Boolean).join(' · ')}
                        </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                        {shortDefinition}
                    </span>
                    <a
                        href={`/glossary/${slug}`}
                        style={{
                            display: 'block',
                            marginTop: '8px',
                            fontSize: '11px',
                            color: '#38bdf8',
                            textDecoration: 'none',
                        }}
                    >
                        Learn more →
                    </a>
                </span>
            )}
        </span>
    );
}
