'use client';
import Link from 'next/link';
import type { InternalLink } from '@/lib/page-factory';

export function RelatedLinks({ links }: { links: InternalLink[] }) {
    if (!links.length) return null;

    return (
        <section style={{ margin: '2rem 0' }}>
            <h2 style={{ color: '#e8eaf0', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
                Related Pages
            </h2>
            <div style={{
                display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            }}>
                {links.map((l, i) => (
                    <Link
                        key={`${l.target_page_key_id}-${i}`}
                        href={l.canonical_slug}
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#9ca3af',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,200,150,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(0,200,150,0.2)';
                            e.currentTarget.style.color = '#00c896';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.color = '#9ca3af';
                        }}
                    >
                        {l.anchor_text}
                    </Link>
                ))}
            </div>
        </section>
    );
}
