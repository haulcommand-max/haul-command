import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Level Agreement | Haul Command',
  description: 'Haul Command SLA — 99.9% uptime guarantee, response time commitments, and support tiers for enterprise escort dispatch.',
};

export default function SLAPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24 }}>Service Level Agreement</h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Platform Uptime</h2>
            <p>Haul Command guarantees <strong style={{ color: '#00ff88' }}>99.9% uptime</strong> for all production services, measured monthly. Scheduled maintenance windows are communicated 48 hours in advance.</p>
          </section>
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Response Times</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[{ tier: 'Critical (P1)', time: '< 15 minutes', desc: 'Platform down, payments broken' }, { tier: 'High (P2)', time: '< 1 hour', desc: 'Feature degraded, data delays' }, { tier: 'Medium (P3)', time: '< 4 hours', desc: 'Non-critical bug, UI issue' }, { tier: 'Low (P4)', time: '< 24 hours', desc: 'Feature request, enhancement' }].map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div><strong>{t.tier}</strong> <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>— {t.desc}</span></div>
                  <span style={{ color: '#00ff88', fontWeight: 700 }}>{t.time}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Data Guarantees</h2>
            <p>All data backed up every 6 hours with 30-day point-in-time recovery. Data export available on demand via GDPR-compliant API.</p>
          </section>
        </div>
      </div>
    </div>
  );
}