import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Autonomous Vehicle Escort Requirements — Global Guide | Haul Command',
  description:
    'The only global resource tracking how autonomous vehicle deployments intersect with escort and oversize load regulations in 120 countries. Updated as laws change. Free.',
  keywords: [
    'autonomous vehicle escort requirements',
    'do autonomous trucks need pilot cars',
    'AV oversize load escort',
    'Texas SB 2807 escort',
    'automated vehicles act 2024 escort',
    'self-driving truck pilot car',
  ],
};

const COUNTRIES = [
  {
    code: 'us', flag: 'ðŸ‡ºðŸ‡¸', name: 'United States', maturity: 'mature',
    escort: true,
    headline: 'Texas SB 2807 eff. Sept 1, 2025',
    summary: 'TxDMV authorization required for all commercial AV ops by May 28, 2026. Oversize AV loads still require human escorts. Aurora, Kodiak, Waabi, Waymo all active.',
    laws: ['Texas SB 2807 (2025)', 'FMCSA federal AV rules', 'NHTSA voluntary guidance'],
    av_companies: ['Aurora Innovation', 'Kodiak Robotics', 'Waabi', 'Waymo', 'Torc Robotics', 'Gatik', 'Plus.ai', 'Bot Auto', 'Einride'],
    key_corridors: ['I-45 Dallas"“Houston (Aurora)', 'US-287 Permian Basin (Kodiak)', 'I-10 Houston"“El Paso', 'I-81 Virginia (Torc)'],
  },
  {
    code: 'gb', flag: 'ðŸ‡¬ðŸ‡§', name: 'United Kingdom', maturity: 'advanced',
    escort: true,
    headline: 'Automated Vehicles Act 2024 — world\'s first',
    summary: 'World\'s first comprehensive AV legal framework passed April 2024. STGO escort vehicle requirements maintained for oversize freight. Wayve, Einride, Nissan active.',
    laws: ['Automated Vehicles Act 2024', 'STGO Categories 1/2/3', 'DVSA regulations'],
    av_companies: ['Wayve', 'Oxbotica', 'Einride', 'Nissan (Wayve partnership)'],
    key_corridors: ['M1 London"“Leeds', 'M6 logistics corridor', 'ZENZIC CAM Corridor'],
  },
  {
    code: 'de', flag: 'ðŸ‡©ðŸ‡ª', name: 'Germany', maturity: 'advanced',
    escort: true,
    headline: 'World\'s first national Level 4 AV law (2021)',
    summary: 'German Level 4 AV law (AFGBV) 2021. A9 autobahn designated AV test corridor. Schwertransport Begleitpflicht (escort requirement) applies to AV overwidth freight.',
    laws: ['AFGBV Level 4 Law (2021)', 'StVG §1e autonomous driving', 'Kraftfahrt-Bundesamt (KBA) authorization'],
    av_companies: ['Mercedes-Benz (Level 3 Drive Pilot)', 'VW', 'BMW', 'Torc/Daimler', 'Einride', 'Momenta'],
    key_corridors: ['A9 Digital Motorway (Munich"“Berlin)', 'A3 Frankfurt"“Cologne', 'Hamburg port approaches'],
  },
  {
    code: 'au', flag: 'ðŸ‡¦ðŸ‡º', name: 'Australia', maturity: 'mature',
    escort: true,
    headline: 'The Pilbara: world capital of autonomous mining trucks',
    summary: 'NTC autonomous vehicle guidelines + state RMS authority. Rio Tinto, BHP, Fortescue operate the most advanced autonomous heavy haul fleet globally. Escort required for equipment transport to mine sites.',
    laws: ['NTC Automated Vehicle Safety Law', 'State RMS regulations', 'Pilbara mine site protocols'],
    av_companies: ['Rio Tinto AutoHaul', 'BHP', 'Fortescue', 'Caterpillar', 'Komatsu', 'Volvo AV Solutions', 'May Mobility'],
    key_corridors: ['Pilbara haul roads WA (Port Hedland"“mines)', 'Hunter Valley coal routes NSW', 'Bowen Basin QLD'],
  },
  {
    code: 'ae', flag: 'ðŸ‡¦ðŸ‡ª', name: 'UAE', maturity: 'framework',
    escort: false,
    headline: 'Dubai 2030: 25% autonomous trips',
    summary: 'Dubai Autonomous Transportation Strategy 2030. WeRide operating 50+ commercial robotaxis since Dec 2024. RTA escort framework for AV freight still evolving.',
    laws: ['UAE Roads and Transport Authority (RTA) framework', 'Dubai 2030 Autonomous Strategy'],
    av_companies: ['WeRide', 'Pony.ai', 'EasyMile', 'Waymo (discussions)'],
    key_corridors: ['Dubai Marina"“Downtown (WeRide)', 'Abu Dhabi city routes', 'Dubai"“Abu Dhabi highway (testing)'],
  },
  {
    code: 'ca', flag: 'ðŸ‡¨ðŸ‡¦', name: 'Canada', maturity: 'mature',
    escort: true,
    headline: 'Alberta oil sands + Ontario B2B routes',
    summary: 'Federal + provincial framework. Gatik operating commercially in Ontario. Alberta Oil Sands autonomous mining trucks expanding. Escort maintained for oversize autonomous freight.',
    laws: ['Canada Motor Vehicle Safety Act', 'Provincial transport acts', 'Alberta Transportation regulations'],
    av_companies: ['Gatik', 'Waabi', 'Aurora (border crossings)'],
    key_corridors: ['QEW Toronto"“Hamilton (Gatik)', 'Alberta oil sands haul roads', 'Trans-Canada segments'],
  },
];

const MATURITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  advanced:  { label: 'ADVANCED',  color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  mature:    { label: 'MATURE',    color: '#f5c842', bg: 'rgba(245,200,66,0.1)' },
  framework: { label: 'FRAMEWORK', color: '#00ccff', bg: 'rgba(0,204,255,0.1)' },
  emerging:  { label: 'EMERGING',  color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  no_law:    { label: 'NO LAW YET',color: '#8fa3c0', bg: 'rgba(143,163,192,0.08)' },
};

export default function AVRegulationsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #07090f 0%, #0a1520 50%, #07090f 100%)',
        padding: '72px 24px 56px', textAlign: 'center',
        borderBottom: '1px solid #1a2a3a',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 18px', borderRadius: 20,
          background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.25)',
          color: '#00ccff', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 24,
        }}>
          ðŸŒ 120 countries · UPDATED MARCH 2026
        </div>
        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, margin: '0 0 16px',
          background: 'linear-gradient(135deg, #fff 0%, #00ccff 60%, #00ff88 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1,
        }}>
          Autonomous Vehicle Escort<br />Requirements — Global Guide
        </h1>
        <p style={{ color: '#8fa3c0', fontSize: 16, maxWidth: 680, margin: '0 auto 32px', lineHeight: 1.7 }}>
          The only global resource tracking how AV deployments intersect with escort and oversize load
          regulations. Every jurisdiction. Updated as laws change. Free.
        </p>

        {/* Key fact banner */}
        <div style={{
          display: 'inline-block', background: 'rgba(245,200,66,0.08)',
          border: '1px solid rgba(245,200,66,0.25)', borderRadius: 14,
          padding: '14px 24px', fontSize: 14, color: '#f5c842', lineHeight: 1.6,
          maxWidth: 640, textAlign: 'left',
        }}>
          <strong>Key fact:</strong> In every country where autonomous trucks operate commercially today,
          oversize loads still require human escort vehicles by law. This is not changing soon — it is
          your opportunity.
        </div>
      </div>

      {/* What changes with AV */}
      <div style={{ background: '#0a0d16', borderBottom: '1px solid #1a223a', padding: '48px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>
            What changes when your load is behind an autonomous truck
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: 'ðŸ“¡', title: 'No CB Radio (Channel 19)', body: 'AVs do not respond. All communication goes through the AV company ops center.' },
              { icon: 'ðŸ”­', title: 'LiDAR/Radar Blind Zones', body: 'Sensor arcs at front, rear, and sides. Stay out of specific zones listed in company protocols.' },
              { icon: 'ðŸ›‘', title: 'Emergency Stops', body: 'AV may stop with no warning. Minimum following distance of 200ft (Aurora standard).' },
              { icon: 'ðŸ”„', title: 'Merge Behavior', body: 'AVs merge earlier and wider than humans. Your lane positioning adapts accordingly.' },
              { icon: 'âš ï¸', title: 'Breakdown Protocol', body: 'No driver to deploy triangles. Your role expands during AV system fault events.' },
              { icon: 'ðŸ“ž', title: 'Emergency Contact', body: 'Each AV company has a 24/7 operations center — not 911. You need the number.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4f8', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country cards */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Country-by-Country AV Regulations</h2>
        <p style={{ color: '#8fa3c0', marginBottom: 40, fontSize: 15 }}>
          Click any country for escort-specific AV guidance. All 120 countries â†’{' '}
          <Link aria-label="Navigation Link" href="/regulations" style={{ color: '#00ccff' }}>full regulation database</Link>
        </p>

        <div style={{ display: 'grid', gap: 24 }}>
          {COUNTRIES.map(c => {
            const mat = MATURITY_CONFIG[c.maturity] || MATURITY_CONFIG.emerging;
            return (
              <div key={c.code} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 20, overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  flexWrap: 'wrap', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 36 }}>{c.flag}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 20, color: '#f0f4f8' }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: '#8fa3c0', marginTop: 2 }}>{c.headline}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20,
                      background: mat.bg, color: mat.color, fontSize: 11, fontWeight: 800,
                    }}>{mat.label}</span>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20,
                      background: c.escort ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
                      color: c.escort ? '#00ff88' : '#ef4444',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {c.escort ? 'âœ“ ESCORT REQUIRED' : '~ ESCORT OPTIONAL'}
                    </span>
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 10 }}>SUMMARY</div>
                    <p style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7, margin: 0 }}>{c.summary}</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 10 }}>KEY LAWS</div>
                    {c.laws.map((l, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#b0bcd0' }}>
                        <span style={{ color: '#00ccff' }}>§</span> {l}
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', margin: '16px 0 8px' }}>ACTIVE AV COMPANIES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.av_companies.slice(0, 5).map(co => (
                        <span key={co} style={{
                          padding: '3px 10px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: 11, color: '#b0bcd0',
                        }}>{co}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 10 }}>KEY AV CORRIDORS</div>
                    {c.key_corridors.map((cor, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#b0bcd0' }}>
                        <span style={{ color: '#f5c842' }}>â†’</span> {cor}
                      </div>
                    ))}
                    <div style={{ marginTop: 16 }}>
                      <Link aria-label="Navigation Link"
                        href={`/regulations/autonomous-vehicles/${c.code}`}
                        style={{
                          display: 'inline-block', padding: '8px 16px', borderRadius: 10,
                          background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.2)',
                          color: '#00ccff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        }}
                      >
                        Full {c.name} AV guide â†’
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Coming soon countries */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#8fa3c0' }}>
            Additional countries with AV activity (detailed pages in progress)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              'ðŸ‡¯ðŸ‡µ Japan', 'ðŸ‡¸ðŸ‡¬ Singapore', 'ðŸ‡¸ðŸ‡ª Sweden', 'ðŸ‡³ðŸ‡´ Norway',
              'ðŸ‡¿ðŸ‡¦ South Africa', 'ðŸ‡§ðŸ‡· Brazil', 'ðŸ‡°ðŸ‡· South Korea', 'ðŸ‡®ðŸ‡³ India',
              'ðŸ‡®ðŸ‡© Indonesia', 'ðŸ‡¸ðŸ‡¦ Saudi Arabia', 'ðŸ‡¶ðŸ‡¦ Qatar', 'ðŸ‡³ðŸ‡± Netherlands',
            ].map(c => (
              <span key={c} style={{
                padding: '7px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 13, color: '#8fa3c0',
              }}>{c}</span>
            ))}
          </div>
        </div>

        {/* CTA to get certified */}
        <div style={{
          marginTop: 64, background: 'linear-gradient(135deg, rgba(245,200,66,0.08), rgba(255,149,0,0.05))',
          border: '1px solid rgba(245,200,66,0.25)', borderRadius: 20, padding: '40px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>
            Now get AV-Ready certified to work on these corridors
          </h2>
          <p style={{ color: '#8fa3c0', marginBottom: 24, fontSize: 15 }}>
            Understanding the regulations is step one. Certification is what gets you chosen first.
          </p>
          <Link href="/training/av-certification">
            <button aria-label="Interactive Button" style={{
              background: 'linear-gradient(90deg, #f5c842, #ff9500)',
              color: '#07090f', border: 'none', borderRadius: 12,
              padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            }}>
              Get AV-Ready Certified â†’
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}