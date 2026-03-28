import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CRC Black Box Recorder | Haul Command',
    description: 'Voice recording and transcription for critical operational commands.',
};

export default function CRCRecorderPending() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '4rem 1rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>🎙️</div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>
                    CRC Black Box Recorder
                </h1>
                <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(129,140,248,0.1)', color: '#818cf8', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(129,140,248,0.2)' }}>
                    COMING SOON — PREMIUM TOOL (T-35)
                </div>
                <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, marginBottom: 40 }}>
                    Voice recording and transcription for critical operational commands (Command-Response-Confirm) with legal chain of custody.
                    This tool is currently being provisioned.
                </p>
                <Link href="/tools" style={{
                    display: 'inline-block', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', textDecoration: 'none', borderRadius: 8, fontWeight: 600, transition: 'background 0.2s'
                }}>
                    ← Back to All Tools
                </Link>
            </div>
        </div>
    );
}
