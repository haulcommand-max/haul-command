import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Railroad Grade Crossing Profiler | Haul Command',
    description: 'Avoid high-center accidents using route ground clearance profiles.',
};

export default function RailroadProfilerPending() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>ðŸš†</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>
                    Railroad Grade Crossing Profiler
                </h1>
                <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(16,185,129,0.2)' }}>
                    COMING SOON â€” PREMIUM TOOL (T-34)
                </div>
                <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, marginBottom: 40 }}>
                    Cross-references load ground clearance against DOT crossing hump profiles and grade data to prevent high-center accidents.
                    This tool is currently being provisioned for the global infrastructure.
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