import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Safety Library & PEVO Resources | Haul Command',
  description: 'Access our master archive of heavy haul safety requirements, state reciprocity rules, and required equipment check-lists.',
};

export default async function SafetyLibraryPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  // Fetch Safety Library Data
  const { data: equipReq } = await supabase.from('pevo_equipment_requirements').select('*').order('category');
  const { data: certRules } = await supabase.from('pevo_certification_rules').select('*').order('state_name');
  const { data: insuranceProviders } = await supabase.from('pevo_insurance_providers').select('*').order('provider_name');

  // Fallback data if DB call fails
  const equipment = equipReq || [
    { category: 'vehicle', item_name: 'High Pole', description: 'Professional-grade, non-conductive, adjustable high pole.', required: true },
    { category: 'signaling', item_name: 'STOP/SLOW Paddle', description: 'Retroreflective, 18-inch paddle.', required: true },
    { category: 'ppe', item_name: 'Hi-Vis Upper Garment', description: 'ANSI Class 2 or 3 vest or jacket.', required: true }
  ];

  const rules = certRules || [
    { state_name: 'Washington', requires_certification: true, accepts_wa_cert: true },
    { state_name: 'Florida', requires_certification: true, accepts_wa_cert: true },
    { state_name: 'New York', requires_certification: true, accepts_wa_cert: false }
  ];

  const categories = Array.from(new Set(equipment.map(e => e.category)));

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', fontFamily: "'Inter', sans-serif" }}>
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #101018 100%)',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid #1a1a22',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '0%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 800, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
          color: '#3b82f6', letterSpacing: '0.06em', marginBottom: 20,
        }}>
          ðŸ“š AUTHORITATIVE RESOURCES
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900, margin: '0 0 20px',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #60a5fa 70%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Safety Operator Library
        </h1>
        <p style={{ fontSize: 18, color: '#8a8a9a', maxWidth: 680, margin: '0 auto', lineHeight: 1.65 }}>
          The central intelligence repository for heavy haul compliance. Browse multi-state reciprocity matrices, minimum equipment lists, and approved liability insurance providers.
        </p>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em', borderBottom: '1px solid #1a1a22', paddingBottom: 16 }}>
          1. State Certification Reciprocity Matrix
        </h2>
        <p style={{ color: '#8a8a9a', marginBottom: 32, fontSize: 15, lineHeight: 1.6, maxWidth: 800 }}>
          Which states require Pilot/Escort Vehicle Operator (PEVO) certification, and which states accept the Washington or Haul Command standard network certifications? Always check local DOT specific limits for bridge clearance restrictions.
        </p>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left', background: '#111118', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#1a1a22' }}>
                  <th style={{ padding: '16px 20px', color: '#e8e8e8', fontWeight: 600, fontSize: 14 }}>State</th>
                  <th style={{ padding: '16px 20px', color: '#e8e8e8', fontWeight: 600, fontSize: 14 }}>Requires PEVO Cert?</th>
                  <th style={{ padding: '16px 20px', color: '#e8e8e8', fontWeight: 600, fontSize: 14 }}>Accepts OS/OW Network Certs (WA/HC)</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #1a1a22' }}>
                    <td style={{ padding: '16px 20px', color: '#fff', fontWeight: 600 }}>{rule.state_name}</td>
                    <td style={{ padding: '16px 20px', color: rule.requires_certification ? '#F5A623' : '#6a6a7a' }}>{rule.requires_certification ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '16px 20px', color: rule.accepts_wa_cert ? '#22c55e' : '#ef4444' }}>{rule.accepts_wa_cert ? 'âœ“ Accepted' : 'âœ— Special Requirement'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto', background: '#0a0a0f', borderTop: '1px solid #1a1a22' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em', borderBottom: '1px solid #1a1a22', paddingBottom: 16 }}>
          2. Mandatory Vehicle & Safety Equipment
        </h2>
        <p style={{ color: '#8a8a9a', marginBottom: 32, fontSize: 15, lineHeight: 1.6, maxWidth: 800 }}>
          Before hitting the corridor, every pilot car operator must possess the base-level FMCSA and state-mandated equipment. Missing even one of these items during a scale-house inspection can result in an out-of-service order.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {categories.map((catType, i) => (
              <div key={i} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
                 <div style={{ fontSize: 14, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                    {String(catType).replace('_', ' ')}
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {equipment.filter((e) => e.category === catType).map((item, j) => (
                      <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ color: item.required ? '#F5A623' : '#6a6a7a', fontSize: 18, marginTop: 2 }}>
                            {item.required ? 'â˜…' : 'â—‹'}
                        </div>
                        <div>
                          <div style={{ color: '#e8e8e8', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.item_name}</div>
                          <div style={{ color: '#8a8a9a', fontSize: 13, lineHeight: 1.5 }}>{item.description}</div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
        </div>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: '-0.02em', borderBottom: '1px solid #1a1a22', paddingBottom: 16 }}>
            3. Approved Liability Insurance Providers
          </h2>
          <p style={{ color: '#8a8a9a', marginBottom: 32, fontSize: 15, lineHeight: 1.6, maxWidth: 800 }}>
            Standard commercial auto policies DO NOT cover pilot car operations (Errors & Omissions). You need specialized PEVO insurance. The following providers are verified network partners and offer specialized General Liability & E&O.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
            {(insuranceProviders || []).map((provider, i) => (
               <div key={i} style={{ padding: 24, background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>{provider.provider_name}</h3>
                      {provider.offers_cert_discount && (
                        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                          Discount Partner
                        </span>
                      )}
                  </div>
                  <div style={{ color: '#8a8a9a', fontSize: 13, marginBottom: 12 }}>
                      {provider.city ? `${provider.city}, ${provider.state_code}` : 'National Provider'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {(provider.policy_types || []).map((pt: string) => (
                          <span key={pt} style={{ background: '#1a1a22', color: '#c0c0c0', fontSize: 11, padding: '4px 10px', borderRadius: 12 }}>
                            {pt.replace('_', ' ')}
                          </span>
                      ))}
                  </div>
                  <a aria-label="Insurance Link" href={provider.website} target="_blank" rel="noreferrer" style={{ display: 'inline-block', fontSize: 14, fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>
                      Visit Website â†’
                  </a>
               </div>
            ))}
            {(!insuranceProviders || insuranceProviders.length === 0) && (
                <div style={{ color: '#8a8a9a' }}>Providers synchronizing... check back soon.</div>
            )}
          </div>
      </section>

    </div>
  );
}