import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Haul Command | The Escort Dispatch Platform',
  description: 'Haul Command is the leading dispatch platform for oversize and heavy haul escort services, connecting operators with loads across 120 countries.',
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24 }}>About Haul Command</h1>
        <div style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          <p>Haul Command is the operating system for oversize and heavy haul escort services. We connect certified escort operators with loads that need to move â€” safely, legally, and on time.</p>
          <p>Founded to solve the fragmentation in the escort vehicle industry, Haul Command provides real-time dispatch, automated compliance verification, rate intelligence, and trust scoring for operators across 120 countries.</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '40px 0 16px' }}>Our Mission</h2>
          <p>To make every oversize load move safely by connecting it with the best available escort operator in real time.</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '40px 0 16px' }}>The Autonomous Future</h2>
          <p>As autonomous trucking becomes reality, escort requirements are increasing â€” not decreasing. Haul Command is positioned as the essential dispatch layer between autonomous fleet operators and the certified escort vehicles required by law.</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '40px 0 16px' }}>By the Numbers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, margin: '24px 0' }}>
            {[{ num: '120', label: 'Countries' }, { num: '50', label: 'US States' }, { num: '24/7', label: 'Dispatch' }].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(90deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}