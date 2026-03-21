import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security | Haul Command',
  description: 'How Haul Command protects your data. SOC2-compliant infrastructure, encryption at rest and in transit, GDPR compliance.',
};

export default function SecurityPage() {
  const practices = [
    { icon: '🔐', title: 'Encryption', desc: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). API keys hashed with bcrypt.' },
    { icon: '🏗️', title: 'Infrastructure', desc: 'Hosted on Vercel with SOC2 Type II compliance. Database on Supabase with automatic backups and point-in-time recovery.' },
    { icon: '🛡️', title: 'Authentication', desc: 'Multi-factor authentication, OAuth 2.0, JWT tokens with short expiry. Role-based access control (RBAC) throughout.' },
    { icon: '📋', title: 'Compliance', desc: 'GDPR compliant with full data export and deletion capabilities. Privacy by design architecture.' },
    { icon: '🔍', title: 'Monitoring', desc: 'Real-time threat detection, automated vulnerability scanning, and 24/7 incident response.' },
    { icon: '📊', title: 'Audit Trail', desc: 'Complete audit logging for all data access and modifications. Immutable event log for compliance reporting.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Security at Haul Command</h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>Enterprise-grade security for the logistics industry.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {practices.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, padding: 24, background: 'rgba(0,255,136,0.08)', borderRadius: 12, border: '1px solid rgba(0,255,136,0.2)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Report a Vulnerability</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>If you discover a security issue, please email <a href="mailto:security@haulcommand.com" style={{ color: '#00ff88' }}>security@haulcommand.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
