'use client';
import Link from 'next/link';
import type { Surface } from '@/lib/page-factory';

export function SurfaceGrid({ surfaces, showClass = false }: { surfaces: Surface[]; showClass?: boolean }) {
    if (!surfaces.length) return <p style={{ color: '#888', padding: '2rem 0' }}>No surfaces found.</p>;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1rem',
        }}>
            {surfaces.map((s) => (
                <Link
                    key={s.surface_id}
                    href={`/surface/${s.surface_key}`}
                    style={{
                        display: 'block',
                        background: 'linear-gradient(135deg, rgba(20,25,35,0.95), rgba(15,18,28,0.98))',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textDecoration: 'none',
                        transition: 'all 0.25s ease',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0,200,150,0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,200,150,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {/* Quality badge */}
                    <div style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: s.quality_score >= 70 ? 'rgba(0,200,150,0.15)' : s.quality_score >= 45 ? 'rgba(255,180,0,0.15)' : 'rgba(255,255,255,0.05)',
                        color: s.quality_score >= 70 ? '#00c896' : s.quality_score >= 45 ? '#ffb400' : '#666',
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                        Q{s.quality_score}
                    </div>

                    <h3 style={{
                        color: '#e8eaf0',
                        fontSize: '1rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        paddingRight: '3rem',
                        lineHeight: 1.3,
                    }}>
                        {s.name || 'Unnamed Location'}
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {showClass && (
                            <span style={{
                                background: 'rgba(100, 120, 255, 0.12)',
                                color: '#8090ff',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                {s.surface_class}
                            </span>
                        )}
                        {s.is_claimable && (
                            <span style={{
                                background: 'rgba(0,200,150,0.1)',
                                color: '#00c896',
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem',
                                fontWeight: 600,
                            }}>
                                ● Claimable
                            </span>
                        )}
                    </div>

                    <p style={{ color: '#8892a8', fontSize: '0.8rem', margin: 0 }}>
                        {[s.city, s.state, s.country_code].filter(Boolean).join(', ')}
                    </p>
                </Link>
            ))}
        </div>
    );
}
