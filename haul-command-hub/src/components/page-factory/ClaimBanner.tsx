'use client';

export function ClaimBanner({ count, className }: { count: number; className?: string }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(0,200,150,0.08) 0%, rgba(0,100,200,0.06) 100%)',
            border: '1px solid rgba(0,200,150,0.15)',
            borderRadius: '16px',
            padding: '2rem',
            margin: '2rem 0',
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: '1.4rem', fontWeight: 700, color: '#e8eaf0',
                marginBottom: '0.5rem',
            }}>
                🏢 Own a listing here?
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1rem', maxWidth: '500px', marginInline: 'auto' }}>
                {count.toLocaleString()} locations are currently claimable. Verified operators get priority placement,
                lead routing, and corridor visibility.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{
                    background: 'rgba(0,200,150,0.12)', color: '#00c896',
                    padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem',
                }}>✓ Free listing</span>
                <span style={{
                    background: 'rgba(100,120,255,0.12)', color: '#8090ff',
                    padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem',
                }}>⚡ $19/mo verified</span>
                <span style={{
                    background: 'rgba(255,180,0,0.12)', color: '#ffb400',
                    padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem',
                }}>🔥 $49/mo pro</span>
            </div>
        </div>
    );
}
