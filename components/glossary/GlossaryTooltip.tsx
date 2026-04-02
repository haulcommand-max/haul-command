'use client';

/**
 * GlossaryTooltip — hover/tap tooltip with term definition.
 * Uses framer-motion for spring-animated entry, glow effects, and press feedback.
 * Mobile-friendly: tap to open, tap outside to close.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [pressed, setPressed] = useState(false);
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
            <motion.span
                className="glossary-term-link"
                onClick={() => setOpen(o => !o)}
                onMouseEnter={() => setOpen(true)}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                onMouseLeave={() => setPressed(false)}
                animate={{
                    scale: pressed ? 0.97 : 1,
                    color: open ? '#38bdf8' : 'inherit',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                    borderBottom: '2px solid rgba(56,189,248,0.4)',
                    cursor: 'pointer',
                    color: 'inherit',
                    textShadow: open ? '0 0 8px rgba(56,189,248,0.3)' : 'none',
                    transition: 'text-shadow 0.2s ease, border-color 0.2s ease',
                    paddingBottom: '1px',
                }}
                whileHover={{
                    borderBottomColor: 'rgba(56,189,248,0.8)',
                }}
            >
                {children}
            </motion.span>
            <AnimatePresence>
                {open && (
                    <motion.span
                        className="glossary-tooltip"
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 10px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            border: '1px solid rgba(56,189,248,0.2)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            minWidth: '240px',
                            maxWidth: '340px',
                            zIndex: 50,
                            boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 20px rgba(56,189,248,0.08)',
                        }}
                    >
                        {/* Arrow */}
                        <span style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: '10px',
                            height: '10px',
                            background: '#0f172a',
                            borderRight: '1px solid rgba(56,189,248,0.2)',
                            borderBottom: '1px solid rgba(56,189,248,0.2)',
                        }} />

                        <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                            {term}
                        </strong>
                        {(category || jurisdiction) && (
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(56,189,248,0.6)',
                                display: 'inline-flex',
                                gap: '6px',
                                marginBottom: '8px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                {[category, jurisdiction].filter(Boolean).join(' · ')}
                            </span>
                        )}
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', display: 'block' }}>
                            {shortDefinition}
                        </span>
                        <a
                            href={`/glossary/${slug}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#38bdf8',
                                textDecoration: 'none',
                                transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
                        >
                            Full definition <span style={{ fontSize: '14px' }}>→</span>
                        </a>
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}
