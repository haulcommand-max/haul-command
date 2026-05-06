import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Geo-Fenced Compliance Sentinel | Haul Command',
    description: 'Real-time GPS-based compliance monitoring for escort vehicles.',
};

export default function ComplianceSentinelPending() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>ðŸ›°ï¸</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>
                    Geo-Fenced Compliance Sentinel
                </h1>
                <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(245,185,66,0.1)', color: '#f5b942', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(245,185,66,0.2)' }}>
                    COMING SOON — PREMIUM TOOL (T-33)
                </div>
                <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, marginBottom: 40 }}>
                    Real-time GPS-based compliance monitoring. Cross-references vehicle position against jurisdiction rules to detect violations before fines.
                    This tool is currently being provisioned for the global global expansion.
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