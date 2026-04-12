import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dynamic Terminology Switcher | Haul Command',
    description: 'Region-aware localization converting industry terms for 120 countries.',
};

export default function TerminologyPending() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>ðŸŒ</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>
                    Dynamic Terminology Switcher
                </h1>
                <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(241,169,27,0.1)', color: '#f1a91b', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(241,169,27,0.2)' }}>
                    COMING SOON â€” PREMIUM TOOL (T-37)
                </div>
                <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, marginBottom: 40 }}>
                    Region-aware localization converting industry terms instantly based on active jurisdiction (e.g., Pilot Car vs Abnormal Load Escort).
                    This feature ensures seamless cross-border regulatory compliance across the 120 countries.
                </p>
                <Link aria-label="Navigation Link" href="/tools" style={{
                    display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s'
                }}>
                    â† Back to All Tools
                </Link>
            </div>
        </div>
    );
}