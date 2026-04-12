import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Oilfield Equipment Escort Services â€” Permian Basin, Eagle Ford, Bakken | Haul Command',
  description:
    'Certified oilfield escort operators for drilling rigs, fracking equipment, pressure vessels, and pipe racks. Permian Basin, Eagle Ford, Bakken, Marcellus, Gulf Coast. TxDMV Subchapter D specialists.',
  keywords: [
    'oilfield escort services Texas',
    'pilot car drilling rig transport',
    'Permian Basin escort operator',
    'fracking equipment escort',
    'oilfield pilot car',
    'TxDMV oilfield permit escort',
  ],
};

const CORRIDORS = [
  {
    code: 'permian', name: 'Permian Basin', state: 'Texas', flag: 'ðŸ›¢ï¸',
    basin: 'Permian Basin',
    cities: ['Midland', 'Odessa', 'Pecos', 'Andrews', 'Ward County'],
    roads: ['US-287', 'FM-1788', 'I-20', 'TX-349'],
    operators_est: 312,
    avg_rate: '$3.80/mile',
    load_types: ['Drilling Rigs', 'Fracking Equipment', 'Mud Systems', 'Pressure Vessels', 'Pipe Racks'],
    fun_fact: '579 new drilling permits issued in February 2026 alone.',
  },
  {
    code: 'eagle_ford', name: 'Eagle Ford Shale', state: 'Texas', flag: 'ðŸ”¥',
    basin: 'Eagle Ford',
    cities: ['Laredo', 'Corpus Christi', 'San Antonio', 'Cotulla'],
    roads: ['I-35', 'US-59', 'TX-16', 'US-83'],
    operators_est: 198,
    avg_rate: '$3.60/mile',
    load_types: ['Workover Rigs', 'Tank Batteries', 'Compressor Packages', 'Water Transfer Systems'],
    fun_fact: 'Eagle Ford spans 50+ counties in South Texas with county-road-heavy access routes.',
  },
  {
    code: 'bakken', name: 'Bakken Formation', state: 'North Dakota', flag: 'â„ï¸',
    basin: 'Williston Basin',
    cities: ['Williston', 'Minot', 'Bismarck', 'Dickinson'],
    roads: ['US-2', 'US-85', 'ND-8', 'US-85'],
    operators_est: 134,
    avg_rate: '$4.10/mile',
    load_types: ['Drilling Rigs', 'LACT Units', 'Saltwater Disposal Equipment', 'Tank Batteries'],
    fun_fact: 'North Dakota\'s Bakken requires NDDET permits â€” specific to heavy oilfield transport.',
  },
  {
    code: 'marcellus', name: 'Marcellus / Utica', state: 'Pennsylvania / West Virginia', flag: 'ðŸ”ï¸',
    basin: 'Appalachian',
    cities: ['Pittsburgh PA', 'Morgantown WV', 'Columbus OH', 'Charleston WV'],
    roads: ['I-79', 'I-77', 'US-19', 'WV-2'],
    operators_est: 156,
    avg_rate: '$3.90/mile',
    load_types: ['Compressor Packages', 'Gas Processing Skids', 'Wellhead Equipment', 'Pipeline Pigs'],
    fun_fact: 'Marcellus/Utica is natural gas dominant â€” compressor packages are the key load type.',
  },
  {
    code: 'gulf_coast', name: 'Gulf Coast Petrochem', state: 'Texas / Louisiana', flag: 'â›½',
    basin: 'Gulf Coast',
    cities: ['Port Arthur', 'Beaumont', 'Houston Ship Channel', 'Freeport'],
    roads: ['I-10', 'TX-87', 'US-90', 'FM-365'],
    operators_est: 287,
    avg_rate: '$3.70/mile',
    load_types: ['Refinenry Equipment', 'Distillation Columns', 'Heat Exchangers', 'Offshore Modules'],
    fun_fact: 'Houston Ship Channel is the largest petrochemical complex in the Western Hemisphere.',
  },
];

const LOAD_TYPES = [
  { icon: 'ðŸ—ï¸', name: 'Complete Drilling Rig', complexity: 'EXTREME', escort: '2â€“4 escorts', notes: 'Multi-move over multiple days. Route survey required. Permit specialist needed.' },
  { icon: 'âš™ï¸', name: 'Mud Pump (Triplex)', complexity: 'STANDARD', escort: '1 escort', notes: 'Heavy and wide. Standard oilfield move.' },
  { icon: 'ðŸ’¨', name: 'Fracking Blender / Pump Unit', complexity: 'HIGH', escort: '2 escorts', notes: 'Tier 4 units are heavy and long. Often night moves.' },
  { icon: 'ðŸ”˜', name: 'Pressure Vessel / Separator', complexity: 'HIGH', escort: '2 escorts', notes: 'Often superload weight. Engineered route required.' },
  { icon: 'ðŸ“¦', name: 'Tubular Rack (Pipe / Casing)', complexity: 'STANDARD', escort: '1 escort', notes: 'Long loads. Pipe box regulations in Texas.' },
  { icon: 'ðŸŒ€', name: 'Coil Tubing Unit', complexity: 'STANDARD', escort: '1 escort', notes: 'Compact but heavy. Spool unit is wide.' },
  { icon: 'ðŸ­', name: 'Compressor Package', complexity: 'HIGH', escort: '2 escorts', notes: 'Gas compression equipment. Heavy base.' },
  { icon: 'ðŸ”§', name: 'Workover Rig', complexity: 'HIGH', escort: '2 escorts', notes: 'Mast section separate move. Multi-day.' },
  { icon: 'â›½', name: 'Tank Battery', complexity: 'STANDARD', escort: '1 escort', notes: 'Oil and water storage tanks. Often multiple loads.' },
  { icon: 'ðŸ”¥', name: 'Flare Stack', complexity: 'EXTREME', escort: '2â€“3 escorts', notes: 'Tall and long. Utility coordination required.' },
];

const COMPLEXITY_CONFIG: Record<string, { color: string; bg: string }> = {
  STANDARD: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
  HIGH:     { color: '#f5c842', bg: 'rgba(245,200,66,0.1)' },
  EXTREME:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function OilfieldCorridorsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0a0808 0%, #1a0d08 50%, #0a0808 100%)',
        padding: '72px 24px 56px', textAlign: 'center',
        borderBottom: '1px solid #2a1a10',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 18px', borderRadius: 20,
          background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.3)',
          color: '#ff9500', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 24,
        }}>
          ðŸ›¢ï¸ OILFIELD ESCORT SPECIALIST NETWORK
        </div>
        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 50px)', fontWeight: 900, margin: '0 0 16px',
          background: 'linear-gradient(135deg, #fff 0%, #ff9500 50%, #ff6b00 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1,
        }}>
          Oilfield Escort Services<br />Permian Basin to Pilbara
        </h1>
        <p style={{ color: '#8fa3c0', fontSize: 17, maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Certified oilfield escort operators for drilling rigs, fracking equipment, pressure vessels,
          and pipe racks. Sub-47-minute fill times. TxDMV Subchapter D specialists.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          {[
            { val: '579', label: 'TX drilling permits Feb 2026' },
            { val: '5', label: 'Major US oilfield corridors' },
            { val: '$5Kâ€“$15K', label: 'Per rig move (escort total)' },
            { val: '47 min', label: 'Median fill time' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)',
              borderRadius: 14, padding: '14px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#ff9500' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#8fa3c0', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/app/loads/post">
            <button aria-label="Interactive Button" style={{
              background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            }}>
              Post an Oilfield Load
            </button>
          </Link>
          <Link href="/directory?specialty=oilfield">
            <button aria-label="Interactive Button" style={{
              background: 'transparent', border: '1px solid rgba(255,149,0,0.3)',
              color: '#ff9500', borderRadius: 12, padding: '14px 24px', fontSize: 15, cursor: 'pointer',
            }}>
              Find Oilfield Operators
            </button>
          </Link>
        </div>
      </div>

      {/* Corridors */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>US Oilfield Corridors</h2>
        <p style={{ color: '#8fa3c0', marginBottom: 40, fontSize: 15 }}>
          Pre-positioned operators on every major basin. International corridors: Alberta, Saudi Ghawar, Pilbara WA, North Sea â†’
        </p>
        <div style={{ display: 'grid', gap: 20 }}>
          {CORRIDORS.map(c => (
            <div key={c.code} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 32 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#f0f4f8' }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: '#8fa3c0' }}>{c.state} Â· {c.basin}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ff9500' }}>{c.operators_est}</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0' }}>operators</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#00ff88' }}>{c.avg_rate}</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0' }}>avg rate</div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 8 }}>KEY CITIES</div>
                  {c.cities.map(ci => (
                    <div key={ci} style={{ fontSize: 13, color: '#b0bcd0', marginBottom: 4 }}>â†’ {ci}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 8 }}>HIGHWAYS / ROADS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {c.roads.map(r => (
                      <span key={r} style={{
                        padding: '3px 10px', borderRadius: 10,
                        background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.2)',
                        fontSize: 12, color: '#ff9500', fontWeight: 600,
                      }}>{r}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3c0', letterSpacing: '0.08em', marginBottom: 8 }}>COMMON LOADS</div>
                  {c.load_types.map(lt => (
                    <div key={lt} style={{ fontSize: 13, color: '#b0bcd0', marginBottom: 4 }}>âœ“ {lt}</div>
                  ))}
                </div>
              </div>
              <div style={{
                padding: '10px 24px 14px',
                background: 'rgba(255,149,0,0.04)',
                borderTop: '1px solid rgba(255,149,0,0.08)',
              }}>
                <span style={{ fontSize: 12, color: '#ff9500', fontStyle: 'italic' }}>ðŸ’¡ {c.fun_fact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load types */}
      <div style={{ background: '#0a0d16', borderTop: '1px solid #1a223a', borderBottom: '1px solid #1a223a', padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Oilfield Load Types â€” What You Need to Know</h2>
          <p style={{ color: '#8fa3c0', marginBottom: 40, fontSize: 15 }}>
            20+ oilfield equipment categories on the load board. Each with escort complexity rating and permit guidance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {LOAD_TYPES.map(lt => {
              const cfg = COMPLEXITY_CONFIG[lt.complexity];
              return (
                <div key={lt.name} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16, padding: '18px 20px',
                  transition: 'border-color 0.2s',
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{lt.icon}</span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12,
                      background: cfg.bg, color: cfg.color,
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                    }}>{lt.complexity}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4f8', marginBottom: 6 }}>{lt.name}</div>
                  <div style={{ fontSize: 12, color: '#ff9500', marginBottom: 6 }}>ðŸš— {lt.escort}</div>
                  <div style={{ fontSize: 12, color: '#8fa3c0', lineHeight: 1.6 }}>{lt.notes}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Texas regulatory section */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,149,0,0.06), rgba(255,107,0,0.04))',
          border: '1px solid rgba(255,149,0,0.2)', borderRadius: 20, padding: '36px 36px',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#ff9500' }}>
            Texas Oilfield Permit Basics â€” TxDMV Subchapter D
          </h2>
          <p style={{ color: '#8fa3c0', fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>
            Texas has specific oilfield equipment permit provisions that are separate from standard oversize permits.
            Here is what every escort operator needs to know.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { title: 'Subchapter D Permits', body: 'Special oilfield equipment permits under Texas Admin Code Â§217.67. Covers rigs, fracking units, mud systems en route to production sites.' },
              { title: 'Pipe Box Transport', body: 'Drill collars transported in a "pipe box" qualify for oilfield permits. Specific tie-down and escort requirements differ from general oversize.' },
              { title: 'Annual Oilfield Permits', body: 'Companies with regular moves can obtain annual permits for specific equipment types, avoiding single-trip permitting for each move.' },
              { title: 'County Sheriff Coordination', body: 'West Texas counties (Midland, Ector, Pecos, Ward) often require advance coordination with county sheriff for large rig moves.' },
              { title: 'FM Road Considerations', body: 'Farm-to-market (FM) roads to well pad access often have different weight limits and escort requirements than state highways.' },
              { title: 'Night Move Restrictions', body: 'Most oilfield equipment moves in West Texas are restricted to daylight hours. Night move approval must be pre-confirmed on permit.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,149,0,0.15)',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ff9500', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#b0bcd0', lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue opportunity box */}
        <div style={{
          marginTop: 32,
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,204,255,0.04))',
          border: '1px solid rgba(0,255,136,0.2)', borderRadius: 16, padding: '24px 28px',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#00ff88', margin: '0 0 12px' }}>
            The oilfield escort opportunity
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { stat: '$5Kâ€“$15K', label: 'Total escort fees for complete rig move', sub: 'Multiple loads over multiple days' },
              { stat: '$250â€“$750', label: 'Per rig move at 5% escrow', sub: 'Haul Command platform fee' },
              { stat: '579', label: 'New TX drilling permits Feb 2026', sub: 'Monthly market volume' },
              { stat: '~58/month', label: '10% conversion = 58 loads', sub: 'Conservative estimate' },
            ].map(s => (
              <div key={s.stat} style={{
                background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)',
                borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#00ff88' }}>{s.stat}</div>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#00ff88', marginTop: 4, opacity: 0.7 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Oilfield specialist CTA */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
            Get your Oilfield Specialist certification
          </h3>
          <p style={{ color: '#8fa3c0', marginBottom: 24 }}>
            Module 5 of the Haul Command training covers everything above â€” plus international basins and safety protocols.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/training/av-certification">
              <button aria-label="Interactive Button" style={{
                background: 'linear-gradient(90deg, #ff6b00, #ff9500)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}>
                View Oilfield Specialist Training
              </button>
            </Link>
            <Link href="/app/loads/post">
              <button aria-label="Interactive Button" style={{
                background: 'transparent', border: '1px solid rgba(255,149,0,0.3)',
                color: '#ff9500', borderRadius: 12,
                padding: '14px 24px', fontSize: 15, cursor: 'pointer',
              }}>
                Post an Oilfield Load Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}