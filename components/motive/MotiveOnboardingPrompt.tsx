'use client';
// components/motive/MotiveOnboardingPrompt.tsx
// Post-claim onboarding step prompting ELD connection

'use client';

interface Props {
  profileId: string;
  onSkip?: () => void;
}

export default function MotiveOnboardingPrompt({ profileId, onSkip }: Props) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      border: '1px solid #30363d',
      borderRadius: 16,
      padding: 32,
      maxWidth: 480,
      margin: '0 auto',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
      <h2 style={{
        fontSize: 22, fontWeight: 700, margin: '0 0 8px',
        color: '#e0e0e6',
      }}>
        Connect Your ELD for Verified Availability
      </h2>
      <p style={{ color: '#8b949e', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
        Operators with ELD verification get{' '}
        <span style={{ color: '#00ff88', fontWeight: 700 }}>3x more load offers</span>.
        Your real-time location and hours of service are automatically verified — no manual updates needed.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        marginBottom: 24, textAlign: 'left',
      }}>
        {[
          { icon: '📍', text: 'Live location on broker maps' },
          { icon: '⏰', text: 'Auto HOS availability' },
          { icon: '🛡️', text: 'ELD Verified badge' },
          { icon: '🚛', text: 'Fleet vehicle data' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', background: '#0d1117', borderRadius: 8,
            fontSize: 12, color: '#c9d1d9',
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>

      <a
        href={`/api/motive/connect?profile_id=${profileId}&return_url=/dashboard/operator`}
        style={{
          display: 'inline-block',
          padding: '14px 32px',
          borderRadius: 10,
          background: 'linear-gradient(90deg, #22c55e, #16a34a)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        ⚡ Connect Motive ELD
      </a>

      <div style={{ marginTop: 16 }}>
        <button aria-label="Interactive Button"
          onClick={onSkip}
          style={{
            background: 'none', border: 'none', color: '#8b949e',
            fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Skip for now — I'll connect later
        </button>
      </div>

      <p style={{ fontSize: 10, color: '#6e7681', marginTop: 20 }}>
        Supports Motive (KeepTruckin) • More ELD providers coming soon
      </p>
    </div>
  );
}
