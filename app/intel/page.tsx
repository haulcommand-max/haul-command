import { Metadata } from 'next';
import { PaywallGateBanner } from '@/components/monetization/PaywallBanner';

export const metadata: Metadata = {
  title: 'Industry Intelligence | Haul Command',
  description: 'Real-time intelligence on autonomous trucks, regulatory changes, and oversize/heavy haul industry trends.',
};

const trendData = [
  { category: 'Autonomous Trucks', title: 'Aurora Launches Commercial Driverless on I-45', date: '2024-12-15', impact: 'high', summary: 'Aurora Innovation began commercial autonomous trucking between Dallas and Houston on I-45, creating immediate demand for AV-certified escort vehicles.' },
  { category: 'Regulation', title: 'Texas Expands AV Operating Zones to I-10 Corridor', date: '2025-01-22', impact: 'high', summary: 'TXDOT approved autonomous vehicle operation on I-10 between San Antonio and El Paso, opening new escort service opportunities.' },
  { category: 'Market', title: 'Escort Demand Up 340% on Active AV Corridors', date: '2025-02-10', impact: 'high', summary: 'Haul Command data shows escort requests on I-45 increased 340% since Aurora launch. Average rates up 15%.' },
  { category: 'Technology', title: 'Kodiak Expands Driverless Fleet to 20 Trucks', date: '2025-02-28', impact: 'medium', summary: 'Kodiak Robotics doubled their autonomous fleet size, with all operations requiring escort vehicle support per Texas regulations.' },
  { category: 'Regulation', title: 'FMCSA Proposes Federal AV Escort Requirements', date: '2025-03-05', impact: 'high', summary: 'Federal Motor Carrier Safety Administration draft rule would require escort vehicles for all Class 8 autonomous trucks on interstate highways.' },
  { category: 'Industry', title: 'Insurance Carriers Require AV Escort Certification', date: '2025-03-12', impact: 'medium', summary: 'Three major trucking insurers now require AV-certified escort operators for policies covering autonomous freight operations.' },
];

export default function IntelPage() {
  const impactColors: Record<string, { bg: string; text: string }> = {
    high: { bg: 'rgba(255, 59, 48, 0.15)', text: '#ff3b30' },
    medium: { bg: 'rgba(255, 200, 0, 0.15)', text: '#ffc800' },
    low: { bg: 'rgba(0, 255, 136, 0.15)', text: '#00ff88' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Intelligence Feed</span>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>Industry Intelligence</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Curated trends, regulatory changes, and market signals for oversize/heavy haul and autonomous freight.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trendData.slice(0, 3).map((item, i) => (
            <article key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.category}</span>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: impactColors[item.impact].bg, color: impactColors[item.impact].text, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{item.impact} impact</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{item.date}</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{item.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{item.summary}</p>
            </article>
          ))}

          {/* Paywall gate — after 3rd card, before remaining feed */}
          <div style={{ margin: '8px 0' }}>
            <PaywallGateBanner
              surfaceName="Intelligence Feed"
              tier="Pro"
              description="Get the full intelligence feed: AV corridor signals, regulatory alerts, and market data across active markets."
            />
          </div>

          {trendData.slice(3).map((item, i) => (
            <article key={`gated-${i}`} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 24, border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.category}</span>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: impactColors[item.impact].bg, color: impactColors[item.impact].text, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{item.impact} impact</span>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{item.date}</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{item.title}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{item.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}