import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moat Dashboard | Admin | Haul Command',
  description: 'Track competitive defensibility metrics for Haul Command platform.',
};

export default function MoatDashboardPage() {
  const moatMetrics = [
    { label: 'Operator Profiles', value: '4,287', delta: '+12%', category: 'Network Effects' },
    { label: 'Route Intel Entries', value: '18,432', delta: '+28%', category: 'Data Moat' },
    { label: 'Compliance Records', value: '52,109', delta: '+15%', category: 'Data Moat' },
    { label: 'Trust Score Calculations', value: '892K', delta: '+34%', category: 'Switching Cost' },
    { label: 'AV-Certified Operators', value: '187', delta: '+67%', category: 'AV Readiness' },
    { label: 'Enterprise API Calls/mo', value: '284K', delta: '+45%', category: 'Embedding' },
    { label: 'Affiliate Revenue/mo', value: '$12,340', delta: '+22%', category: 'Passive Revenue' },
    { label: 'Countries Active', value: '57', delta: '--', category: 'Geographic Moat' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <div>
            <span style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(255,59,48,0.15)', color: '#ff3b30', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Admin Only</span>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: '12px 0 0' }}>Competitive Moat Dashboard</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {moatMetrics.map((m, i) => (
            <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{m.category}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{m.value}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.delta.startsWith('+') ? '#00ff88' : 'rgba(255,255,255,0.4)' }}>{m.delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: 24, background: 'rgba(0,255,136,0.06)', borderRadius: 12, border: '1px solid rgba(0,255,136,0.15)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>Moat Strength: Strong</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Data accumulation velocity is above target. AV-certified operator growth is the strongest moat driver. Focus on increasing route intelligence entries and enterprise API embedding depth.</p>
        </div>
      </div>
    </div>
  );
}