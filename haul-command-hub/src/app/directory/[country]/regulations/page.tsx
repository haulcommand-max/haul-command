import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface CountryReg {
  id: string; country_name: string; country_code: string; region: string;
  measurement_system: string; currency_code: string;
  escort_min_age?: number; escort_license_required?: boolean;
  escort_training_course?: string; escort_training_hours?: number; escort_renewal_years?: number;
  vehicle_max_gvwr_kg?: number;
  warning_light_color?: string; flag_size_cm?: string; flag_colors?: string;
  fire_extinguisher_spec?: string; cone_count?: number; cone_size_cm?: number;
  max_width_no_escort_m?: number; max_width_one_escort_m?: number;
  max_width_two_escorts_m?: number; max_width_le_escort_m?: number;
  max_height_no_escort_m?: number; max_height_one_escort_m?: number;
  max_length_no_escort_m?: number; max_length_one_escort_m?: number;
  max_length_two_escorts_m?: number;
  daytime_travel_only?: boolean; travel_window?: string;
  holiday_restrictions?: string; weekend_movement_allowed?: boolean;
  permit_office_name?: string; permit_office_phone?: string;
  permit_office_website?: string; online_permit_available?: boolean;
  apparel_day_class?: string; apparel_night_class?: string;
  oversize_banner_text?: string; banner_min_size?: string;
  av_corridors_exist?: boolean; av_regulatory_body?: string; av_corridor_notes?: string;
  data_confidence_score?: number; data_sources?: string[];
  last_verified?: string;
}

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getCountryReg(slug: string): Promise<CountryReg | null> {
  const sb = supabaseServer();
  const countryName = slug.replaceAll('-', ' ');
  const { data } = await (sb as any)
    .from('country_regulations')
    .select('*')
    .or(`country_code.ilike.${slug},country_name.ilike.${countryName}`)
    .single();
  return data || null;
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const reg = await getCountryReg(country);
  const name = reg?.country_name || country.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `Heavy Haul Regulations in ${name} — Pilot Cars, Brokers & Permits | Diesel Blood USA`,
    description: `Find oversize load rules, escort requirements, and permit offices in ${name}. Updated heavy haul directory powered by Diesel Blood USA — covering 57 countries.`,
    openGraph: {
      title: `Heavy Haul Regulations in ${name}`,
      description: `Oversize load escort rules and permit contacts for ${name}.`,
      type: 'website',
    },
  };
}

const CONFIDENCE_CONFIG: Record<number, { label: string; color: string; bg: string; border: string; description: string }> = {
  5: { label: '✅ Verified Official', color: '#00c864', bg: 'rgba(0,200,100,0.08)', border: 'rgba(0,200,100,0.25)', description: 'Official government regulation document verified.' },
  4: { label: '🟢 Government Source', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', description: 'Official government website, regulations inferred from published guidelines.' },
  3: { label: '🟡 Industry Verified', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', description: 'Credible industry association data — no official document found.' },
  2: { label: '🟠 Unofficial Source', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', description: 'Unofficially cited data — verify with local authority.' },
  1: { label: '🔴 Unverified', color: '#ff5555', bg: 'rgba(255,85,85,0.08)', border: 'rgba(255,85,85,0.25)', description: 'No reliable data found. Consult local transport authority.' },
};

function DataRow({ label, value, unit }: { label: string; value?: string | number | boolean | null; unit?: string }) {
  if (value === null || value === undefined) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: '#888', fontSize: '13px', flex: '0 0 55%' }}>{label}</span>
      <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500, textAlign: 'right', flex: '0 0 44%' }}>
        {display}{unit && <span style={{ color: '#666', fontSize: '12px' }}> {unit}</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default async function CountryRegulationsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const reg = await getCountryReg(country);

  if (!reg) notFound();

  const confidence = CONFIDENCE_CONFIG[reg.data_confidence_score || 1];

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#fff',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
            <a href="/directory" style={{ color: '#888', textDecoration: 'none' }}>Directory</a>
            {' → '}
            <a href={`/directory/${reg.region?.toLowerCase().replace(' ', '-')}`} style={{ color: '#888', textDecoration: 'none' }}>{reg.region}</a>
            {' → '}
            <span style={{ color: '#aaa' }}>{reg.country_name}</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: '0 0 10px' }}>
            🚛 Heavy Haul Regulations — {reg.country_name}
          </h1>
          <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}>
            Oversize load escort requirements, pilot car rules, dimension limits, and permit contacts. Updated directory powered by Diesel Blood USA.
          </p>

          {/* Confidence Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px',
            background: confidence.bg,
            border: `1px solid ${confidence.border}`,
            borderRadius: '12px',
          }}>
            <span style={{ color: confidence.color, fontWeight: 700, fontSize: '13px' }}>{confidence.label}</span>
            <span style={{ color: '#666', fontSize: '12px' }}>{confidence.description}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Low confidence warning */}
        {(reg.data_confidence_score || 1) <= 2 && (
          <div style={{ background: 'rgba(255,85,85,0.08)', border: '1px solid rgba(255,85,85,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ color: '#ff8888', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Regulation Data Limited</div>
              <div style={{ color: '#aaa', fontSize: '13px', lineHeight: 1.5 }}>
                Official verified data for {reg.country_name} is limited. Always verify current rules directly with the local transport authority before operating.
              </div>
            </div>
          </div>
        )}

        {/* Permit Office */}
        {reg.permit_office_name && (
          <div style={{ background: 'linear-gradient(135deg,rgba(255,140,0,0.1),rgba(255,100,0,0.05))', border: '1px solid rgba(255,140,0,0.25)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#ff8c00', marginBottom: '12px' }}>📋 Permit Office</div>
            <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px', marginBottom: '8px' }}>{reg.permit_office_name}</div>
            {reg.permit_office_phone && <div style={{ color: '#888', fontSize: '13px', marginBottom: '6px' }}>📞 {reg.permit_office_phone}</div>}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
              {reg.permit_office_website && (
                <a href={reg.permit_office_website} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: 'rgba(255,140,0,0.15)', border: '1px solid rgba(255,140,0,0.35)', borderRadius: '8px', color: '#ff8c00', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  🌐 Apply for Permit
                </a>
              )}
              <span style={{ padding: '8px 12px', background: reg.online_permit_available ? 'rgba(0,200,100,0.1)' : 'rgba(255,85,85,0.1)', border: `1px solid ${reg.online_permit_available ? 'rgba(0,200,100,0.3)' : 'rgba(255,85,85,0.3)'}`, borderRadius: '8px', color: reg.online_permit_available ? '#00c864' : '#ff5555', fontSize: '12px' }}>
                {reg.online_permit_available ? '✅ Online Application Available' : '❌ No Online Application'}
              </span>
            </div>
          </div>
        )}

        {/* Load Dimensions */}
        <SectionCard title="Load Dimension Limits" icon="📐">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ color: '#666', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '8px' }}>WIDTH (metres)</div>
              <DataRow label="No escort required" value={reg.max_width_no_escort_m} unit="m" />
              <DataRow label="1 escort required" value={reg.max_width_one_escort_m} unit="m" />
              <DataRow label="2 escorts required" value={reg.max_width_two_escorts_m} unit="m" />
              <DataRow label="LE escort required" value={reg.max_width_le_escort_m} unit="m" />
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '8px' }}>LENGTH (metres)</div>
              <DataRow label="No escort required" value={reg.max_length_no_escort_m} unit="m" />
              <DataRow label="1 escort required" value={reg.max_length_one_escort_m} unit="m" />
              <DataRow label="2 escorts required" value={reg.max_length_two_escorts_m} unit="m" />
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ color: '#666', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '8px' }}>HEIGHT (metres)</div>
            <DataRow label="Standard max (no escort)" value={reg.max_height_no_escort_m} unit="m" />
            <DataRow label="Max with escort" value={reg.max_height_one_escort_m} unit="m" />
          </div>
        </SectionCard>

        {/* Escort Qualifications */}
        <SectionCard title="Escort Qualifications" icon="🚗">
          <DataRow label="Minimum Age" value={reg.escort_min_age} unit="years" />
          <DataRow label="License Required" value={reg.escort_license_required} />
          <DataRow label="Training Course" value={reg.escort_training_course} />
          <DataRow label="Training Hours" value={reg.escort_training_hours} unit="hours" />
          <DataRow label="Renewal Period" value={reg.escort_renewal_years} unit="years" />
        </SectionCard>

        {/* Escort Vehicle */}
        <SectionCard title="Escort Vehicle Requirements" icon="🚨">
          <DataRow label="Max GVWR" value={reg.vehicle_max_gvwr_kg != null ? reg.vehicle_max_gvwr_kg / 1000 : null} unit="tonnes" />
          <DataRow label="Warning Light Color" value={reg.warning_light_color} />
          <DataRow label="Flag Size" value={reg.flag_size_cm} />
          <DataRow label="Flag Colors" value={reg.flag_colors} />
          <DataRow label="Warning Banner Text" value={reg.oversize_banner_text} />
          <DataRow label="Banner Minimum Size" value={reg.banner_min_size} />
        </SectionCard>

        {/* Travel Restrictions */}
        <SectionCard title="Travel Restrictions" icon="⏰">
          <DataRow label="Daytime Travel Only" value={reg.daytime_travel_only} />
          <DataRow label="Permitted Hours" value={reg.travel_window} />
          <DataRow label="Weekend Movement" value={reg.weekend_movement_allowed ? 'Permitted' : 'Restricted or Prohibited'} />
          <DataRow label="Holiday Restrictions" value={reg.holiday_restrictions} />
        </SectionCard>

        {/* Safety Apparel */}
        <SectionCard title="Safety Apparel" icon="🦺">
          <DataRow label="Daytime Apparel" value={reg.apparel_day_class} />
          <DataRow label="Night Upgrade" value={reg.apparel_night_class} />
        </SectionCard>

        {/* AV Corridor Monitor */}
        {reg.av_corridors_exist !== null && (
          <SectionCard title="Autonomous Vehicle Corridors" icon="🤖">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: reg.av_corridors_exist ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${reg.av_corridors_exist ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', marginBottom: '12px' }}>
              <span style={{ color: reg.av_corridors_exist ? '#3b82f6' : '#666', fontWeight: 700, fontSize: '13px' }}>
                {reg.av_corridors_exist ? '🛣️ AV Corridors Active' : '— No Designated AV Corridors'}
              </span>
            </div>
            <DataRow label="Regulatory Body" value={reg.av_regulatory_body} />
            {reg.av_corridor_notes && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', color: '#ccc', fontSize: '13px', lineHeight: 1.6 }}>
                {reg.av_corridor_notes}
              </div>
            )}
          </SectionCard>
        )}

        {/* Data Sources */}
        {reg.data_sources && reg.data_sources.length > 0 && (
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <div style={{ color: '#555', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '8px' }}>DATA SOURCES</div>
            {reg.data_sources.map((src: string, i: number) => (
              <div key={i}>
                <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: '12px', textDecoration: 'underline', display: 'block', marginBottom: '4px' }}>{src}</a>
              </div>
            ))}
            {reg.last_verified && (
              <div style={{ color: '#444', fontSize: '11px', marginTop: '8px' }}>Last verified: {reg.last_verified}</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
