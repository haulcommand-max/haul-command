import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autonomous Freight Partner Portal | Haul Command',
  description: 'The escort dispatch platform built for autonomous trucking. Real-time availability, automated compliance, API integration, and enterprise pricing for AV fleet operators.',
};

export default function AutonomousPartnerPage() {
  const partners = [
    { name: 'Aurora Innovation', corridor: 'I-45 Dallas–Houston', status: 'Active' },
    { name: 'Kodiak Robotics', corridor: 'I-10 Texas Corridor', status: 'Active' },
    { name: 'Waymo Via', corridor: 'I-20 Southwest', status: 'Expanding' },
    { name: 'Plus', corridor: 'Multi-State', status: 'Active' },
    { name: 'TuSimple', corridor: 'I-10 AZ–TX', status: 'Planning' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Enterprise</span>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Autonomous Freight<br /><span style={{ background: 'linear-gradient(90deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Partner Portal</span></h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto' }}>The escort dispatch infrastructure that autonomous trucking companies depend on. API-first, compliance-automated, Texas-dominant.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 64 }}>
          {[
            { icon: '🤖', title: 'AV-Ready Escorts', desc: 'Pre-certified operators trained for autonomous vehicle escort protocols. 24/7 availability on active AV corridors.' },
            { icon: '⚡', title: 'API Integration', desc: 'RESTful API for programmatic escort dispatch. Webhook notifications, real-time tracking, automated billing.' },
            { icon: '📋', title: 'Auto-Compliance', desc: 'Automated state permit verification, insurance validation, and regulatory compliance for every escort assignment.' },
            { icon: '📊', title: 'Enterprise Dashboard', desc: 'Fleet-wide visibility into escort operations. Usage analytics, cost tracking, SLA monitoring, and custom reporting.' },
            { icon: '🛡️', title: 'Dedicated SLA', desc: '99.9% uptime guarantee. Priority dispatch, dedicated account management, and guaranteed response times.' },
            { icon: '💰', title: 'Volume Pricing', desc: 'Custom enterprise pricing based on corridor volume. Committed-use discounts and flexible billing terms.' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 24px' }}>Active AV Corridor Coverage</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Company', 'Primary Corridor', 'Status'].map((h, i) => (<th key={i} style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {partners.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', color: '#fff', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{p.corridor}</td>
                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', borderRadius: 12, background: p.status === 'Active' ? 'rgba(0,255,136,0.15)' : 'rgba(255,200,0,0.15)', color: p.status === 'Active' ? '#00ff88' : '#ffc800', fontSize: 12, fontWeight: 600 }}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Ready to integrate?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Contact our enterprise team for API access and custom pricing.</p>
          <a href="mailto:enterprise@haulcommand.com" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 12, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>Contact Enterprise Sales</a>
        </div>
      </div>
    </div>
  );
}
