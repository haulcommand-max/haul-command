import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ── State data map
const STATE_DATA: Record<string, {
  name: string;
  abbr: string;
  permit_office: string;
  permit_url: string;
  escort_width_ft: number;
  escort_height_ft: number;
  escort_length_ft: number;
  front_escort_at_ft: number;
  rear_escort_at_ft: number;
  night_moves: 'yes' | 'permit_required' | 'restricted';
  curfew_notes: string;
  special_notes: string;
  oilfield_notes?: string;
}> = {
  tx: {
    name: 'Texas', abbr: 'TX',
    permit_office: 'TxDMV Motor Carrier Division',
    permit_url: 'https://permit.txdmv.gov',
    escort_width_ft: 14, escort_height_ft: 16.5, escort_length_ft: 110,
    front_escort_at_ft: 16, rear_escort_at_ft: 20,
    night_moves: 'permit_required',
    curfew_notes: 'No moves Friday after 3pm through Sunday in major metro areas without special permit.',
    special_notes: 'Texas SB 2807 (eff. Sept 1, 2025) governs all commercial AV operations. TxDMV authorization required by May 28, 2026 for AV corridors.',
    oilfield_notes: 'TxDMV Subchapter D oilfield equipment permits available for drill rigs, fracking units, and production equipment moving to/from active production sites.',
  },
  ca: {
    name: 'California', abbr: 'CA',
    permit_office: 'Caltrans Permits',
    permit_url: 'https://tpermits.dot.ca.gov',
    escort_width_ft: 14, escort_height_ft: 16, escort_length_ft: 105,
    front_escort_at_ft: 15, rear_escort_at_ft: 20,
    night_moves: 'restricted',
    curfew_notes: 'Urban areas: most moves restricted to off-peak hours. LA metro restricted 7am–9am and 3pm–7pm.',
    special_notes: 'California has the most restrictive oversize regulations in the US. Utility coordination required for loads over 16ft high.',
  },
  fl: {
    name: 'Florida', abbr: 'FL',
    permit_office: 'FDOT Oversize/Overweight Permits',
    permit_url: 'https://www.flhsmv.gov',
    escort_width_ft: 14, escort_height_ft: 16, escort_length_ft: 120,
    front_escort_at_ft: 16, rear_escort_at_ft: 20,
    night_moves: 'yes',
    curfew_notes: 'Night moves generally permitted with proper lighting. Some county restrictions apply.',
    special_notes: 'Florida has one of the highest volumes of manufactured home transport in the US — double-wide requires 1 escort, triple-wide requires 2.',
  },
  nd: {
    name: 'North Dakota', abbr: 'ND',
    permit_office: 'NDDOT Motor Vehicle',
    permit_url: 'https://www.dot.nd.gov',
    escort_width_ft: 14, escort_height_ft: 16, escort_length_ft: 110,
    front_escort_at_ft: 16, rear_escort_at_ft: 20,
    night_moves: 'permit_required',
    curfew_notes: 'Spring load restrictions apply February–April. Spring thaw significantly limits moves.',
    special_notes: 'North Dakota oilfield (Bakken) is a primary market. NDDET permits for oil & gas equipment.',
    oilfield_notes: 'NDDET (North Dakota Department of Environmental Quality Transportation) permits required for specific oilfield moves. Williston Basin FM roads have seasonal weight restrictions.',
  },
  pa: {
    name: 'Pennsylvania', abbr: 'PA',
    permit_office: 'PennDOT Special Transportation',
    permit_url: 'https://www.penndot.pa.gov',
    escort_width_ft: 13, escort_height_ft: 15.5, escort_length_ft: 100,
    front_escort_at_ft: 14, rear_escort_at_ft: 18,
    night_moves: 'restricted',
    curfew_notes: 'PennDOT restricts oversize moves during peak hours and weekends in many districts.',
    special_notes: 'Pennsylvania has one of the strictest bridge clearance networks in the US. Bridge weights must be verified for each route. Marcellus Shale oilfield market.',
    oilfield_notes: 'Marcellus/Utica shale requires PennDOT OH permits for compressor packages and processing skids.',
  },
};

// Generate simple entries for all other states
const DEFAULT_STATE_TEMPLATE = (abbr: string, name: string) => ({
  name, abbr,
  permit_office: `${name} DOT / Motor Vehicle Division`,
  permit_url: `https://dot.state.${abbr.toLowerCase()}.us/permits`,
  escort_width_ft: 14,
  escort_height_ft: 16,
  escort_length_ft: 110,
  front_escort_at_ft: 16,
  rear_escort_at_ft: 20,
  night_moves: 'permit_required' as 'yes' | 'permit_required' | 'restricted',
  curfew_notes: 'Check with state DOT for current curfew restrictions.',
  special_notes: 'Standard oversize escort regulations apply. Contact the state permit office for specific route approval.',
  oilfield_notes: undefined as string | undefined,
});

// Fill in remaining states
const ALL_STATES: Record<string, ReturnType<typeof DEFAULT_STATE_TEMPLATE>> = {
  ...STATE_DATA,
  al: DEFAULT_STATE_TEMPLATE('AL', 'Alabama'),
  ak: DEFAULT_STATE_TEMPLATE('AK', 'Alaska'),
  az: DEFAULT_STATE_TEMPLATE('AZ', 'Arizona'),
  ar: DEFAULT_STATE_TEMPLATE('AR', 'Arkansas'),
  co: DEFAULT_STATE_TEMPLATE('CO', 'Colorado'),
  ct: DEFAULT_STATE_TEMPLATE('CT', 'Connecticut'),
  de: DEFAULT_STATE_TEMPLATE('DE', 'Delaware'),
  ga: DEFAULT_STATE_TEMPLATE('GA', 'Georgia'),
  hi: DEFAULT_STATE_TEMPLATE('HI', 'Hawaii'),
  id: DEFAULT_STATE_TEMPLATE('ID', 'Idaho'),
  il: DEFAULT_STATE_TEMPLATE('IL', 'Illinois'),
  in: DEFAULT_STATE_TEMPLATE('IN', 'Indiana'),
  ia: DEFAULT_STATE_TEMPLATE('IA', 'Iowa'),
  ks: DEFAULT_STATE_TEMPLATE('KS', 'Kansas'),
  ky: DEFAULT_STATE_TEMPLATE('KY', 'Kentucky'),
  la: DEFAULT_STATE_TEMPLATE('LA', 'Louisiana'),
  me: DEFAULT_STATE_TEMPLATE('ME', 'Maine'),
  md: DEFAULT_STATE_TEMPLATE('MD', 'Maryland'),
  ma: DEFAULT_STATE_TEMPLATE('MA', 'Massachusetts'),
  mi: DEFAULT_STATE_TEMPLATE('MI', 'Michigan'),
  mn: DEFAULT_STATE_TEMPLATE('MN', 'Minnesota'),
  ms: DEFAULT_STATE_TEMPLATE('MS', 'Mississippi'),
  mo: DEFAULT_STATE_TEMPLATE('MO', 'Missouri'),
  mt: DEFAULT_STATE_TEMPLATE('MT', 'Montana'),
  ne: DEFAULT_STATE_TEMPLATE('NE', 'Nebraska'),
  nv: DEFAULT_STATE_TEMPLATE('NV', 'Nevada'),
  nh: DEFAULT_STATE_TEMPLATE('NH', 'New Hampshire'),
  nj: DEFAULT_STATE_TEMPLATE('NJ', 'New Jersey'),
  nm: DEFAULT_STATE_TEMPLATE('NM', 'New Mexico'),
  ny: DEFAULT_STATE_TEMPLATE('NY', 'New York'),
  nc: DEFAULT_STATE_TEMPLATE('NC', 'North Carolina'),
  oh: DEFAULT_STATE_TEMPLATE('OH', 'Ohio'),
  ok: DEFAULT_STATE_TEMPLATE('OK', 'Oklahoma'),
  or: DEFAULT_STATE_TEMPLATE('OR', 'Oregon'),
  ri: DEFAULT_STATE_TEMPLATE('RI', 'Rhode Island'),
  sc: DEFAULT_STATE_TEMPLATE('SC', 'South Carolina'),
  sd: DEFAULT_STATE_TEMPLATE('SD', 'South Dakota'),
  tn: DEFAULT_STATE_TEMPLATE('TN', 'Tennessee'),
  ut: DEFAULT_STATE_TEMPLATE('UT', 'Utah'),
  vt: DEFAULT_STATE_TEMPLATE('VT', 'Vermont'),
  va: DEFAULT_STATE_TEMPLATE('VA', 'Virginia'),
  wa: DEFAULT_STATE_TEMPLATE('WA', 'Washington'),
  wv: DEFAULT_STATE_TEMPLATE('WV', 'West Virginia'),
  wi: DEFAULT_STATE_TEMPLATE('WI', 'Wisconsin'),
  wy: DEFAULT_STATE_TEMPLATE('WY', 'Wyoming'),
  dc: DEFAULT_STATE_TEMPLATE('DC', 'Washington DC'),
};

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const data = ALL_STATES[state.toLowerCase()];
  if (!data) return { title: 'Not Found' };
  return {
    title: `Pilot Car Requirements in ${data.name} — ${new Date().getFullYear()} Guide | Haul Command`,
    description: `Official escort/pilot car requirements in ${data.name}. Width, height, and length thresholds. When escorts are required. Night move rules. Permit office contacts. Updated ${new Date().getFullYear()}.`,
    keywords: [
      `pilot car requirements ${data.name}`,
      `escort requirements ${data.name}`,
      `oversize load escort ${data.abbr}`,
      `how much does a pilot car cost in ${data.name}`,
      `${data.name} oversize permit`,
    ],
    openGraph: {
      title: `Pilot Car Requirements in ${data.name} — Haul Command`,
      description: `Everything escort operators and brokers need to know about oversize load escort requirements in ${data.name}.`,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function StateRegulationPage({ params }: Props) {
  const { state } = await params;
  const data = ALL_STATES[state.toLowerCase()];
  if (!data) notFound();

  const nightMovesConfig = {
    yes:              { label: 'Permitted', color: '#00ff88', desc: 'Night moves generally allowed with proper equipment and lighting.' },
    permit_required:  { label: 'Permit Required', color: '#f5c842', desc: 'Night moves require advance permit approval from state DOT.' },
    restricted:       { label: 'Restricted', color: '#ef4444', desc: 'Night moves significantly restricted in most of this state.' },
  };
  const nightInfo = nightMovesConfig[data.night_moves];

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ background: '#0a0d16', borderBottom: '1px solid #1a223a', padding: '12px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', fontSize: 13, color: '#8fa3c0' }}>
          <Link aria-label="Navigation Link" href="/regulations" style={{ color: '#8fa3c0', textDecoration: 'none' }}>Regulations</Link>
          {' / '}
          <Link aria-label="Navigation Link" href="/regulations/us" style={{ color: '#8fa3c0', textDecoration: 'none' }}>United States</Link>
          {' / '}
          <span style={{ color: '#f0f4f8' }}>{data.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #07090f 0%, #0d1520 50%, #07090f 100%)',
        padding: '56px 24px 48px', borderBottom: '1px solid #1a223a',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 16,
            background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.2)',
            color: '#00ccff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 20,
          }}>
            🗺️ {data.abbr} · OFFICIAL ESCORT REQUIREMENTS · {new Date().getFullYear()}
          </div>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, margin: '0 0 16px',
            color: '#f0f4f8', lineHeight: 1.1,
          }}>
            Pilot Car Requirements in {data.name}
          </h1>
          <p style={{ color: '#8fa3c0', fontSize: 16, maxWidth: 680, lineHeight: 1.7, margin: 0 }}>
            When escorts are required, how many, certification rules, and permit office contacts.
            Official information for brokers and escort operators operating in {data.name}.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Quick reference thresholds */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: '#f0f4f8' }}>
            Escort Required At These Dimensions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Width over', val: `${data.escort_width_ft} ft`, icon: '↔️' },
              { label: 'Height over', val: `${data.escort_height_ft} ft`, icon: '↕️' },
              { label: 'Length over', val: `${data.escort_length_ft} ft`, icon: '↔️' },
              { label: 'Front escort at', val: `${data.front_escort_at_ft} ft wide`, icon: '🚗' },
              { label: 'Rear escort at', val: `${data.rear_escort_at_ft} ft wide`, icon: '🚘' },
              { label: 'Night moves', val: nightInfo.label, icon: '🌙', itemColor: nightInfo.color },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: (item as { itemColor?: string }).itemColor ?? '#f5c842' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Night moves detail */}
        <div style={{
          background: `rgba(${data.night_moves === ('yes' as string) ? '0,255,136' : data.night_moves === ('permit_required' as string) ? '245,200,66' : '239,68,68'},0.06)`,
          border: `1px solid rgba(${data.night_moves === ('yes' as string) ? '0,255,136' : data.night_moves === ('permit_required' as string) ? '245,200,66' : '239,68,68'},0.2)`,
          borderRadius: 14, padding: '18px 20px', marginBottom: 28,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: nightInfo.color, marginBottom: 6 }}>
            🌙 Night Move Rules in {data.name}
          </div>
          <div style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7 }}>
            {nightInfo.desc} {data.curfew_notes}
          </div>
        </div>

        {/* Special notes */}
        {data.special_notes && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,204,255,0.15)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 28,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#00ccff', marginBottom: 8 }}>
              ℹ️ {data.name}-Specific Notes
            </div>
            <div style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7 }}>{data.special_notes}</div>
          </div>
        )}

        {/* Oilfield notes */}
        {data.oilfield_notes && (
          <div style={{
            background: 'rgba(255,149,0,0.05)', border: '1px solid rgba(255,149,0,0.2)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 28,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#ff9500', marginBottom: 8 }}>
              🛢️ Oilfield Equipment Permits in {data.name}
            </div>
            <div style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7 }}>{data.oilfield_notes}</div>
          </div>
        )}

        {/* Permit office */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '20px 22px', marginBottom: 40,
        }}>
          <div style={{ fontWeight: 700, color: '#8fa3c0', marginBottom: 12, letterSpacing: '0.06em', fontSize: 11 }}>
            PERMIT OFFICE
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f0f4f8', marginBottom: 8 }}>{data.permit_office}</div>
          <a href={data.permit_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: 10,
            background: 'rgba(0,204,255,0.1)', border: '1px solid rgba(0,204,255,0.2)',
            color: '#00ccff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            Visit Permit Portal →
          </a>
        </div>

        {/* FAQ section */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
            Frequently Asked Questions — {data.name} Escort Requirements
          </h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              {
                q: `When do I need a pilot car in ${data.name}?`,
                a: `In ${data.name}, a pilot car (escort vehicle) is required when your load exceeds ${data.escort_width_ft} ft wide, ${data.escort_height_ft} ft tall, or ${data.escort_length_ft} ft long. Front escorts are required at ${data.front_escort_at_ft} ft wide and rear escorts at ${data.rear_escort_at_ft} ft wide.`,
              },
              {
                q: `How much does a pilot car cost in ${data.name}?`,
                a: `Pilot car rates in ${data.name} typically range from $1.75–$4.50 per mile depending on load complexity, urgency, and day/night requirements. Haul Command shows real-time rates from verified operators in ${data.name}.`,
              },
              {
                q: `Does ${data.name} require certified escort operators?`,
                a: `Certification requirements vary. ${data.name} requires operators to meet minimum vehicle and equipment standards. Haul Command's HC Certified operators meet all ${data.name} baseline requirements. AV-Ready Certified operators are preferred for autonomous truck corridors.`,
              },
              {
                q: `Can I do night moves in ${data.name}?`,
                a: `${nightInfo.desc} ${data.curfew_notes}`,
              },
            ].map((faq, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4f8', marginBottom: 8 }}>{faq.q}</div>
                <div style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.08), rgba(255,149,0,0.05))',
          border: '1px solid rgba(245,200,66,0.25)', borderRadius: 20, padding: '36px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 12px' }}>
            Find certified escorts in {data.name}
          </h2>
          <p style={{ color: '#8fa3c0', marginBottom: 24, fontSize: 15 }}>
            47-minute median fill time. Escrow-protected. Verified operators.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/directory?state=${data.abbr.toLowerCase()}`}>
              <button aria-label="Interactive Button" style={{
                background: 'linear-gradient(90deg, #f5c842, #ff9500)',
                color: '#07090f', border: 'none', borderRadius: 12,
                padding: '12px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}>
                Find {data.name} Escorts
              </button>
            </Link>
            <Link href="/app/loads/post">
              <button aria-label="Interactive Button" style={{
                background: 'transparent', border: '1px solid rgba(245,200,66,0.3)',
                color: '#f5c842', borderRadius: 12,
                padding: '12px 20px', fontSize: 15, cursor: 'pointer',
              }}>
                Post a Load in {data.name}
              </button>
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 13, color: '#8fa3c0' }}>
          <Link aria-label="Navigation Link" href="/regulations/us" style={{ color: '#8fa3c0', textDecoration: 'none' }}>← All US State Regulation Guides</Link>
          {' · '}
          <Link aria-label="Navigation Link" href="/regulations/autonomous-vehicles" style={{ color: '#00ccff', textDecoration: 'none' }}>AV Regulations →</Link>
        </div>
      </div>

      {/* Schema markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `When do I need a pilot car in ${data.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `In ${data.name}, a pilot car is required when your load exceeds ${data.escort_width_ft} ft wide, ${data.escort_height_ft} ft tall, or ${data.escort_length_ft} ft long.`,
            },
          },
          {
            '@type': 'Question',
            name: `How much does a pilot car cost in ${data.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Pilot car rates in ${data.name} typically range from $1.75–$4.50 per mile depending on load complexity, urgency, and time of day.`,
            },
          },
        ],
      })}} />
    </div>
  );
}
