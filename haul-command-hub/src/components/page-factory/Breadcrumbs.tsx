'use client';
import Link from 'next/link';

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" style={{
            fontSize: '0.8rem', color: '#666', marginBottom: '1.5rem',
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        }}>
            <Link href="/directory" style={{ color: '#8090ff', textDecoration: 'none' }}>Directory</Link>
            {crumbs.map((c, i) => (
                <span key={i}>
                    <span style={{ margin: '0 4px', color: '#444' }}>/</span>
                    {c.href ? (
                        <Link href={c.href} style={{ color: '#8090ff', textDecoration: 'none' }}>{c.label}</Link>
                    ) : (
                        <span style={{ color: '#9ca3af' }}>{c.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
