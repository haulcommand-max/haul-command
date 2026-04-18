'use client';

export default function OfflinePage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #030712 0%, #0B1120 50%, #030712 100%)',
            color: '#F9FAFB',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            padding: '2rem',
            textAlign: 'center' as const,
            position: 'relative' as const,
            overflow: 'hidden',
        }}>
            {/* Animated background pulse */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite',
            }} />

            {/* Signal icon */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                marginBottom: '1.5rem',
            }}>
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Signal bars */}
                    <rect x="8" y="44" width="8" height="12" rx="2" fill="#374151" />
                    <rect x="20" y="36" width="8" height="20" rx="2" fill="#374151" />
                    <rect x="32" y="28" width="8" height="28" rx="2" fill="#374151" />
                    <rect x="44" y="20" width="8" height="36" rx="2" fill="#374151" />
                    {/* X overlay */}
                    <line x1="12" y1="12" x2="52" y2="52" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                    <line x1="52" y1="12" x2="12" y2="52" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>

            {/* Brand */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#F59E0B',
                marginBottom: '1.5rem',
                textTransform: 'uppercase' as const,
            }}>
                HAUL COMMAND
            </div>

            {/* Heading */}
            <h1 style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                color: '#F9FAFB',
                lineHeight: 1.3,
            }}>
                No Signal
            </h1>

            {/* Subtitle */}
            <p style={{
                position: 'relative',
                zIndex: 1,
                fontSize: '0.95rem',
                color: '#9CA3AF',
                maxWidth: '320px',
                lineHeight: 1.6,
                marginBottom: '0.5rem',
            }}>
                HAUL COMMAND needs an internet connection to load
                real-time dispatch data and corridor intelligence.
            </p>

            {/* Tips */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                marginTop: '1rem',
                padding: '1rem 1.25rem',
                background: 'rgba(245,158,11,0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(245,158,11,0.15)',
                maxWidth: '320px',
                width: '100%',
                textAlign: 'left' as const,
            }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B', marginBottom: '0.5rem' }}>
                    Troubleshoot
                </div>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    gap: '0.4rem',
                }}>
                    {[
                        'Check cellular or Wi-Fi connection',
                        'Toggle airplane mode off and back on',
                        'Move to an area with better coverage',
                    ].map((tip, i) => (
                        <li key={i} style={{
                            fontSize: '0.8rem',
                            color: '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}>
                            <span style={{ color: '#F59E0B', fontSize: '0.6rem' }}>â—</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Retry button */}
            <button aria-label="Interactive Button"
                onClick={() => window.location.reload()}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    marginTop: '2rem',
                    padding: '0.875rem 2.5rem',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#030712',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
            >
                Retry Connection
            </button>

            {/* Check status link */}
            <a
                href="https://status.haulcommand.com"
                target="_blank"
                rel="noopener"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    marginTop: '1rem',
                    fontSize: '0.8rem',
                    color: '#6B7280',
                    textDecoration: 'none',
                }}
            >
                Check system status â†’
            </a>

            {/* CSS animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.15); }
                }
            `}</style>
        </div>
    );
}