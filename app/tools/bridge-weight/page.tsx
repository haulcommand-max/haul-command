import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Bridge Weight Overlay | Haul Command',
    description: 'Cross-reference axle weight against bridge load capacity ratings.',
};

export default function BridgeWeightPending() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>🌉</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>
                    Bridge Weight Overlay
                </h1>
                <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
                    COMING SOON — PREMIUM TOOL (T-36)
                </div>
                <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, marginBottom: 40 }}>
                    Cross-references axle weight and spacing against NBI and DOT bridge load capacity ratings along your route. 
                    This tool is currently being provisioned.
                </p>
                <Link aria-label="Navigation Link" href="/tools" style={{
                    display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s'
                }}>
                    ← Back to All Tools
                </Link>
            </div>
        </div>
    );
}
