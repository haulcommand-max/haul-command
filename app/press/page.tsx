import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Press | Haul Command',
  description: 'Haul Command press releases, media coverage, and company news.',
};

export default function PressPage() {
  const releases = [
    { date: '2025-03', title: 'Haul Command Launches Autonomous Freight Partner Portal', desc: 'New enterprise platform enables autonomous trucking companies to programmatically dispatch certified escort vehicles across active AV corridors.' },
    { date: '2025-02', title: 'Platform Expands to 120 countries', desc: 'Haul Command now supports escort dispatch operations in 120 countries, including all major heavy haul markets in North America, Europe, and Asia-Pacific.' },
    { date: '2025-01', title: 'Industry Intelligence Feed Goes Live', desc: 'Real-time regulatory tracking and trend analysis for autonomous freight, oversize loads, and escort compliance requirements.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Press</h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>Latest news and announcements from Haul Command.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {releases.map((r, i) => (
            <article key={i} style={{ padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{r.date}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '8px 0' }}>{r.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{r.desc}</p>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 48, padding: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 8px' }}>Media Inquiries</h3>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Contact <a href="mailto:press@haulcommand.com" style={{ color: '#00d4ff' }}>press@haulcommand.com</a> for interviews, logos, and company information.</p>
        </div>
      </div>
    </div>
  );
}
